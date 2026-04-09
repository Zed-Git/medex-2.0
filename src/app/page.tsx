"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { submitMedicalRequest } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { AnamnesisData } from "@/components/RequestAnalysisForm";

// [note.txt — performanse] Teške komponente tek kad treba: manji početni bundle na mobilnom.
const FileUpload = dynamic(
  () => import("@/components/FileUpload").then((m) => m.FileUpload),
  {
    loading: () => (
      <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
        Preparing upload…
      </div>
    ),
  },
);

const RequestAnalysisForm = dynamic(
  () => import("@/components/RequestAnalysisForm"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[200px] items-center justify-center p-8 text-sm font-bold uppercase tracking-widest text-slate-500">
        Loading form…
      </div>
    ),
  },
);
import { FEATURED_ANALYSES } from "@/lib/featured-analyses";
import {
  ArrowDown,
  CheckCircle2,
  ShieldCheck,
  Activity,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";

// [IZMENA vs Zlatni standard] Kartice ostaju na landing-u; “Read analysis” vodi na posebne stranice (/analysis/[slug]).
// [DODATO] CMS može da override-uje title/description/tag preko site_config.clinical_news (fallback: FEATURED_ANALYSES).
const NEWS_DATA = FEATURED_ANALYSES;

// [IZMENA vs “flash starih kartica”] Pri povratku sa /analysis/[slug] komponenta se ponovo mount-uje sa praznim CMS stanjem —
// dok fetch trži ~1s mergedNews pada na FEATURED_ANALYSES. sessionStorage keš primenjujemo u queueMicrotask (isto kao hero).
type CmsClinicalNewsItem = {
  slug: string;
  tag?: string;
  title?: string;
  description?: string;
};

const CLINICAL_NEWS_SESSION_KEY = "medex.clinicalNews.v1";

function normalizeClinicalNewsItems(
  items: Array<{
    slug?: unknown;
    tag?: unknown;
    title?: unknown;
    description?: unknown;
  }>,
): CmsClinicalNewsItem[] {
  return items
    .map((it) => ({
      slug: String(it.slug ?? "").trim(),
      tag: typeof it.tag === "string" ? it.tag : undefined,
      title: typeof it.title === "string" ? it.title : undefined,
      description:
        typeof it.description === "string" ? it.description : undefined,
    }))
    .filter((it) => it.slug.length > 0);
}

// [DODATO vs Zlatni standard] “Živi” gradijentni border bez wrapper-a.
// Trik: 2 background layer-a — (1) unutra “glass” (padding-box), (2) conic-gradient samo na ivici (border-box).
// Prednost: unutrašnji stil kartice ostaje praktično isti kao pre, menja se samo border.
const GRADIENT_BORDER_LAYER =
  "conic-gradient(from 0deg at var(--gx, 50%) var(--gy, 50%), #E31E24, #3b82f6, #1e3a5f, #f87171, #E31E24)";
function gradientBorderStyle(
  glassRgba: string,
  borderPx = 3,
): React.CSSProperties {
  return {
    border: `${borderPx}px solid transparent`,
    backgroundImage: `linear-gradient(${glassRgba}, ${glassRgba}), ${GRADIENT_BORDER_LAYER}`,
    backgroundOrigin: "padding-box, border-box",
    backgroundClip: "padding-box, border-box",
  };
}
function setCardGradientFromPointer(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = ((e.clientX - r.left) / Math.max(r.width, 1)) * 100;
  const y = ((e.clientY - r.top) / Math.max(r.height, 1)) * 100;
  el.style.setProperty("--gx", `${x}%`);
  el.style.setProperty("--gy", `${y}%`);
}
function resetCardGradient(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--gx", "50%");
  e.currentTarget.style.setProperty("--gy", "50%");
}

// [Hydration] Isti fallback na serveru i na prvom client renderu — ne čitati localStorage u useState inicijalizatoru
// (server nema window → uvek default; klijent bi iz keša dobio druge vrednosti → React hydration error).
const HERO_FALLBACK_PHOTO = "/doctor.png";
const HERO_FALLBACK_MESSAGE = "After analysis, we will send report...";

export default function LandingPage() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [urgency, setUrgency] = useState("Basic");
  const [isAgreed, setIsAgreed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showAnamneza, setShowAnamneza] = useState(false);
  const [anamnezaDone, setAnamnezaDone] = useState(false);
  const [anamnezaData, setAnamnezaData] = useState<AnamnesisData | null>(null);
  // [DODATO vs Zlatni standard] Kontrolisana polja — sprečava gubitak unosa ako korisnik pokuša submit bez anamneze.
  const [patientName, setPatientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // [DODATO vs Zlatni standard] Lepši UX od alert(): crveni banner iznad forme za lokalne validacije.
  const [formValidationError, setFormValidationError] = useState<string | null>(
    null,
  );

  const formRef = useRef<HTMLDivElement>(null);
  const [dbPrices, setDbPrices] = useState({ normal: "15", priority: "30" });
  // [DODATO vs Zlatni standard] CMS hero content (doctor photo + floating message) iz site_config.
  // [IZMENA vs hydration bug] Početno stanje MORA biti isto na SSR i na prvom client paint-u; keš iz localStorage
  // primenjujemo tek u useEffect (posle hidratacije), pa onda async Supabase.
  const [heroDoctorPhotoUrl, setHeroDoctorPhotoUrl] =
    useState<string>(HERO_FALLBACK_PHOTO);
  const [heroFloatingMessage, setHeroFloatingMessage] = useState<string>(
    HERO_FALLBACK_MESSAGE,
  );
  // [DODATO vs Zlatni standard] CMS override za kartice (clinical_news). Ako nema, koristimo FEATURED_ANALYSES.
  const [cmsClinicalNews, setCmsClinicalNews] = useState<CmsClinicalNewsItem[]>(
    [],
  );
  // --- [DODATO] Surface server/validation errors (previously status was 'error' with no UI) ---
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // [DODATO vs Zlatni standard] Na hard refresh-u browser ponekad “vrati” skrol na sredinu stranice.
    // Forsiramo start na vrhu (logo/status bar vidljiv), i gasimo scroll restoration.
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, left: 0 });

    // [IZMENA vs raniji pristup] localStorage ovde (ne u useState) — nema hydration mismatch-a sa serverom.
    // [IZMENA vs ESLint react-hooks/set-state-in-effect] setState direktno u effect-u = sinhrono kaskadno renderovanje;
    // queueMicrotask odlaže setState na sledeći mikrotask (i dalje pre fetch-a, bez promene ponašanja za korisnika).
    queueMicrotask(() => {
      try {
        const cachedPhoto = window.localStorage.getItem(
          "medex.hero.doctorPhotoUrl",
        );
        const cachedMsg = window.localStorage.getItem(
          "medex.hero.floatingMessage",
        );
        if (cachedPhoto?.trim()) setHeroDoctorPhotoUrl(cachedPhoto.trim());
        if (cachedMsg?.trim()) setHeroFloatingMessage(cachedMsg.trim());

        try {
          const rawNews = sessionStorage.getItem(CLINICAL_NEWS_SESSION_KEY);
          if (rawNews) {
            const parsed = JSON.parse(rawNews) as unknown;
            if (Array.isArray(parsed)) {
              const items = normalizeClinicalNewsItems(
                parsed as Array<{
                  slug?: unknown;
                  tag?: unknown;
                  title?: unknown;
                  description?: unknown;
                }>,
              );
              if (items.length > 0) setCmsClinicalNews(items);
            }
          }
        } catch {
          /* pokvaren JSON u session kešu — ignoriši */
        }
      } catch {
        /* privatni režim / blokiran storage */
      }
    });

    const fetchConfig = async () => {
      const { data } = await supabase
        .from("site_config")
        .select("*")
        .eq("key", "pricing")
        .single();
      if (data) setDbPrices(data.value);

      // [DODATO] hero_content je opcioni CMS blok (ako ne postoji, koristi fallback).
      const { data: heroCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "hero_content")
        .single();
      const hv = heroCfg?.value as
        | { doctorPhotoUrl?: string; floatingMessage?: string }
        | undefined;
      if (hv?.doctorPhotoUrl) {
        const next = String(hv.doctorPhotoUrl);
        setHeroDoctorPhotoUrl(next);
        try {
          window.localStorage.setItem("medex.hero.doctorPhotoUrl", next);
        } catch {
          /* ignore */
        }
      }
      if (hv?.floatingMessage) {
        const next = String(hv.floatingMessage);
        setHeroFloatingMessage(next);
        try {
          window.localStorage.setItem("medex.hero.floatingMessage", next);
        } catch {
          /* ignore */
        }
      }

      // [DODATO] clinical_news: koristi se za kartice i /analysis/[slug].
      const { data: newsCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "clinical_news")
        .single();
      const nv = newsCfg?.value as { items?: unknown } | undefined;
      if (Array.isArray(nv?.items)) {
        const items = nv.items as Array<{
          slug?: unknown;
          tag?: unknown;
          title?: unknown;
          description?: unknown;
        }>;
        const normalized = normalizeClinicalNewsItems(items);
        setCmsClinicalNews(normalized);
        try {
          if (normalized.length > 0) {
            sessionStorage.setItem(
              CLINICAL_NEWS_SESSION_KEY,
              JSON.stringify(normalized),
            );
          } else {
            sessionStorage.removeItem(CLINICAL_NEWS_SESSION_KEY);
          }
        } catch {
          /* ignore */
        }
      }
    };
    fetchConfig();
  }, []);

  const mergedNews = useMemo(() => {
    const bySlug = new Map(cmsClinicalNews.map((x) => [x.slug, x]));
    return NEWS_DATA.map((n) => {
      const o = bySlug.get(n.slug);
      return {
        ...n,
        tag:
          o?.tag && typeof o.tag === "string" && o.tag.trim() ? o.tag : n.tag,
        title: o?.title && o.title.trim() ? o.title : n.title,
        description:
          o?.description && o.description.trim()
            ? o.description
            : n.description,
      };
    });
  }, [cmsClinicalNews]);

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  // [IZMENA vs Zlatni standard] getPrice se više ne koristi jer je “Estimated fee” sakriven na landing-u.

  async function handleSubmit(formData: FormData) {
    // [IZMENA vs Zlatni standard] Ne koristimo alert() — prikazujemo poruku iznad forme i skrolujemo do nje.
    if (!anamnezaDone || !anamnezaData) {
      setFormValidationError(
        "Please complete the “Fill Your Medical Anamnesis” section before submitting your request.",
      );
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!isAgreed) {
      setFormValidationError(
        "Please confirm the agreement checkbox before submitting your request.",
      );
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setStatus("loading");
    setSubmitError(null);
    setFormValidationError(null);
    formData.append("medicalAnamnesis", JSON.stringify(anamnezaData));
    if (file) formData.append("medicalFile", file);

    try {
      const result = await submitMedicalRequest(formData);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setSubmitError(
          "error" in result && typeof result.error === "string"
            ? result.error
            : "Your request could not be saved. Please try again.",
        );
      }
    } catch {
      setStatus("error");
      setSubmitError(
        "A network error occurred. Please check your connection and try again.",
      );
    }
  }

  // [DODATO vs Zlatni standard] onSubmit + preventDefault: zaustavlja “submit refresh” tok koji može obrisati vrednosti inputa.

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await handleSubmit(formData);
  }

  // --- [DODATO — jasna povratna informacija ako INSERT / upload ne uspe] ---
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center text-slate-900 font-sans">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-2xl border-t-8 border-red-500 max-w-lg"
        >
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-[#2E5481] uppercase tracking-tighter italic">
            Submission unsuccessful
          </h1>
          <p className="text-slate-600 text-sm mt-4 leading-relaxed">
            {submitError ||
              "We could not save your request. Please verify your information and try again."}
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setSubmitError(null);
            }}
            className="mt-10 px-10 py-4 bg-[#2E5481] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-900 transition-all shadow-lg"
          >
            Return to form
          </button>
        </motion.div>
      </div>
    );
  }

  // --- [ZLATNI STANDARD] RESTAURIRAN SUCCESS PORUKA ---
  if (status === "success") {
    // [IZMENA — note.txt] "New Request" je ranije pozivao samo setStatus('idle') —
    // forma se prikazivala sa starim podacima dok korisnik ne uradi page refresh.
    // Sada resetujemo SVA polja i stanje forme zajedno sa statusom.
    function handleNewRequest() {
      setPatientName("");
      setEmail("");
      setPhone("");
      setUrgency("Basic");
      setIsAgreed(false);
      setFile(null);
      setShowAnamneza(false);
      setAnamnezaDone(false);
      setAnamnezaData(null);
      setFormValidationError(null);
      setSubmitError(null);
      setStatus("idle");
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center text-slate-900 font-sans">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-2xl border-t-8 border-emerald-500 max-w-lg"
        >
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-[#2E5481] uppercase tracking-tighter italic">
            SUCCESSFUL!
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] mt-6 tracking-widest leading-relaxed">
            Your request has been successfully sent to the MedExNews team.
          </p>
          <button
            onClick={handleNewRequest}
            className="mt-10 px-10 py-4 bg-[#2E5481] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-900 transition-all shadow-lg"
          >
            New Request
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    // [IZMENA vs Zlatni standard] Globalni background je u layout.tsx (medback1.webp).
    // Landing main mora biti transparentan da bi se background video iza sadržaja.
    <main className="relative min-h-screen bg-transparent font-sans tracking-tight text-slate-900 text-left">
      <nav className="sticky top-0 z-50 w-full bg-[#2E5481] border-b-4 border-[#E31E24] px-6 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-12 md:pb-4 text-white shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer flex flex-col min-w-max"
          >
            {/* --- LOGO (RESTAURIRANO) --- */}
            <div className="flex items-baseline leading-none">
              <span className="text-2xl md:text-3xl font-black tracking-tighter italic">
                MedExNews
              </span>
              <sup className="text-[20px] font-black text-[#E31E24] ml-0.5 bg-white px-1 rounded-sm italic">
                AI
              </sup>
            </div>

            <div className="h-1 w-full bg-[#E31E24] mt-1"></div>
          </div>
          <div className="hidden lg:flex flex-col items-center flex-1 mx-8 text-center leading-tight">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
              Science and Cardiology Analysis
            </h2>
            <p className="text-xs uppercase tracking-widest font-bold text-red-100 opacity-95 italic mt-1 leading-none">
              An Expert Review of Evidence-Based, Personalized Medicine, and
              AI{" "}
            </p>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (RESTAURIRANO) --- */}
      {/* [DODATO vs Zlatni standard] Glassmorphism: veći kontejneri dobijaju bg-white/80 + backdrop-blur. */}
      <section className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* [IZMENA vs Zlatni standard] Spoljašnji omotač: tanki “ram”; ista logika kao MEDICINE kartice (setCardGradientFromPointer). */}
          <motion.div
            onClick={scrollToForm}
            onPointerMove={setCardGradientFromPointer}
            onPointerLeave={resetCardGradient}
            whileHover={{ y: -5 }}
            className="touch-manipulation cursor-pointer rounded-[35px] p-[3px] shadow-2xl h-64 relative overflow-hidden"
            style={gradientBorderStyle("rgba(46,84,129,1)", 3)}
          >
            <div className="rounded-[32px] bg-[#2E5481] p-6 text-white flex flex-col justify-center text-center h-full relative overflow-hidden border-b-4 border-blue-900">
              <h3 className="text-[#E31E24] text-4xl font-black italic mb-1 uppercase tracking-tighter shadow-black drop-shadow-md">
                SUBMIT
              </h3>
              <p className="text-[11px] font-black uppercase leading-tight mb-4 tracking-wider">
                Your Cardiology
                <br />
                Questions,Results,
                <br />
                Dilemmas...?
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-black text-[#E31E24] uppercase italic">
                  click to start
                </span>
                <ArrowDown
                  className="text-[#E31E24] animate-bounce"
                  size={18}
                />
              </div>
            </div>
          </motion.div>

          {/* [IZMENA vs Zlatni standard] Uklonjen "Sample Report" (nije poželjna opcija na landing-u). */}
        </div>

        <div className="lg:col-span-3 bg-white/80 backdrop-blur-md border border-white/50 p-8 rounded-[35px] shadow-xl h-96 flex flex-col justify-center text-center relative overflow-hidden">
          <h3 className="text-xl font-black text-[#2E5481] uppercase border-b-4 border-[#E31E24] pb-1 inline-block tracking-tighter italic">
            HOW IT WORKS
          </h3>
          <div className="space-y-6 mt-6 text-left">
            {[
              { id: "1", t: "Your Requests" },
              { id: "2", t: "Our Analysis" },
              { id: "3", t: "Get Your Answers" },
            ].map((step) => (
              <div key={step.id} className="flex items-center gap-4 group">
                <div className="w-1.5 h-10 bg-slate-100 rounded-full group-hover:bg-[#E31E24] transition-all"></div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-800">
                  {step.id}. {step.t}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 h-96 relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[35px] overflow-hidden shadow-2xl border border-white/60 bg-white/20 backdrop-blur-sm h-full relative group"
          >
            {/* [IZMENA vs Zlatni standard] Doktor fotografija dolazi iz CMS-a (hero_content.doctorPhotoUrl). */}
            <Image
              src={heroDoctorPhotoUrl}
              alt="Doctor"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-1000 group-hover:scale-105"
              priority
            />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-[#2E5481] max-w-50 z-20"
            >
              {/* [IZMENA vs Zlatni standard] Floating message iz CMS-a (hero_content.floatingMessage). */}
              <p className="text-[10px] font-bold text-[#2E5481] leading-relaxed italic">
                &quot;{heroFloatingMessage}&quot;
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- [DODATO U ZLATNI STANDARD] - RESTAURIRANA MEDICINE SEKCIJA (Problem 4) --- */}
      {/* [IZMENA vs raniji draft] ID anchor za povratak sa /analysis/[slug]. */}
      {/* [IZMENA vs Zlatni standard] Sekcija je transparentna da background ostane vidljiv. */}
      <section id="medicine" className="bg-transparent py-16 px-6 mt-2">
        <div className="max-w-7xl mx-auto text-center text-slate-900">
          <h2 className="text-3xl font-black text-[#2E5481] uppercase mb-1 tracking-tighter italic leading-none">
            MEDICINE IN THE FUTURE
          </h2>
          <div className="w-16 h-1.5 bg-[#E31E24] mx-auto mb-10 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mergedNews.map((news, idx) => (
              // [IZMENA vs raniji draft] Uklonjen whileInView (IntersectionObserver) jer je pravio “praznu sekciju” na hard refresh-u kod nekih browsera.
              // [DODATO vs Gold 5.3.0] Samo border je gradijent i “živi” na pointer move.
              // [VAŽNO] Unutrašnji layout/typography/spacing ostaje kao u Gold-u (isti className), jer nema wrapper-a.
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                onPointerMove={setCardGradientFromPointer}
                onPointerLeave={resetCardGradient}
                className="backdrop-blur-md p-8 rounded-[35px] shadow-md text-left hover:shadow-2xl transition-all cursor-default"
                // [KOREKCIJA vs eksperiment] “Unutra” vraćamo na vizuelno belo kao pre (veća neprozirnost),
                // dok gradijent ostaje samo na borderu.
                style={gradientBorderStyle("rgba(255,255,255,0.95)", 3)}
              >
                <span className="text-[#E31E24] font-black text-[9px] tracking-widest uppercase">
                  {news.tag}
                </span>
                <h3 className="text-xl font-black text-slate-800 mt-2 mb-3 uppercase leading-tight">
                  {news.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 font-medium">
                  {news.description}
                </p>
                {/* [IZMENA vs raniji draft] Link vodi na posebnu stranicu (ne u okviru landing-a). */}
                <Link
                  href={`/analysis/${encodeURIComponent(news.slug)}`}
                  className="text-[#2E5481] font-black text-[10px] uppercase border-b-2 border-slate-100 hover:border-[#E31E24] transition-all inline-flex items-center gap-1 italic"
                >
                  Read analysis <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REQUEST FORM */}
      <section ref={formRef} className="max-w-5xl mx-auto p-1 my-10 text-left">
        <div className="bg-white/85 backdrop-blur-md rounded-[40px] shadow-2xl overflow-hidden border border-white/50">
          {/* Note Banner */}
          <div className="bg-red-50 border-b border-red-100 p-4 flex items-center justify-center gap-4 text-center text-slate-900">
            <div className="bg-[#E31E24] text-white w-7 h-7 flex items-center justify-center rounded-full font-black text-xs shrink-0 animate-pulse">
              !
            </div>
            <p className="text-[#E31E24] font-black text-[10px] uppercase italic leading-tight tracking-tight">
              Note: MedExNews does not provide MEDICAL ADVICES, DIAGNOSIS OR
              TREATMENT. If you think that you have emergency medical problem,
              ask your physician without any delay, call 911 or dial respective
              number in your country immediately!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 text-slate-900">
            {/* PLAVA KOLONA SA CENOM (Problem 5) */}
            <div className="lg:col-span-3 bg-[#2E5481] p-8 text-white flex flex-col justify-center items-center text-center gap-8 border-r border-white/10">
              <h2 className="text-xl font-black uppercase leading-none border-b border-white/20 pb-4 w-full tracking-tighter italic">
                REQUEST <br /> ANALYSIS
              </h2>
              <div className="w-full">
                {/* [IZMENA vs Zlatni standard] Sakriven “Estimated fee” + cena na landing-u (traženo). */}
                <div className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/10 text-left">
                  <p className="text-[9px] font-black text-yellow-400 uppercase italic leading-tight tracking-wider">
                    NO NEED TO PAY NOW!
                  </p>
                  <p className="text-[8px] font-black text-white/90 uppercase italic mt-1 tracking-widest leading-none">
                    YOU PAY AFTER REPORT!
                  </p>
                  <p className="text-[7px] font-bold text-white/50 uppercase mt-1 leading-none italic">
                    No Need Credit Card Now...
                  </p>
                </div>
              </div>
              <div className="space-y-3 w-full pt-4 border-t border-white/10 text-[10px] font-black uppercase italic tracking-widest">
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="text-red-400" size={16} /> Secure &
                  Confidential
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Activity className="text-green-400" size={16} /> PhD Expert
                  Review{" "}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="lg:col-span-9 p-8 bg-white space-y-6"
            >
              {/* [DODATO vs Zlatni standard] In-page validaciona poruka (engleski UI). */}
              {formValidationError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-left shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-widest text-red-700 italic">
                    Please review the required fields
                  </p>
                  <p className="mt-2 text-sm font-medium text-red-800">
                    {formValidationError}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="patientName"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    onFocus={() => setFormValidationError(null)}
                    className="w-full outline-none font-bold text-slate-800 p-0 text-sm bg-transparent"
                    placeholder="John Smith"
                  />
                </div>
                {/* [IZMENA vs Zlatni standard + note.txt] Placeholderi email/telefon — generički engleski tekst, ne lični primer. */}
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFormValidationError(null)}
                    className="w-full outline-none font-bold text-slate-800 p-0 text-sm bg-transparent"
                    placeholder="Your e-mail address"
                  />
                </div>
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => setFormValidationError(null)}
                    className="w-full outline-none font-bold text-slate-800 p-0 text-sm bg-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">
                    Urgency Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="urgency"
                    required
                    value={urgency}
                    onChange={(e) =>
                      setUrgency(
                        e.target.value === "Extended" ? "Extended" : "Basic",
                      )
                    }
                    onFocus={() => setFormValidationError(null)}
                    className="w-full font-black text-[#2E5481] outline-none bg-transparent text-xs p-0 uppercase cursor-pointer"
                  >
                    <option value="Basic">
                      (${dbPrices.normal}) BASIC REVIEW
                    </option>
                    <option value="Extended">
                      (${dbPrices.priority}) EXTENDED REVIEW
                    </option>
                  </select>
                </div>
              </div>

              <div className="py-2">
                <button
                  type="button"
                  onClick={() => setShowAnamneza(true)}
                  className={`touch-manipulation w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${anamnezaDone ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-blue-50 border-[#2E5481] text-[#2E5481]"}`}
                >
                  <span className="font-black uppercase italic tracking-widest text-xs">
                    {anamnezaDone ? (
                      "MEDICAL DATA SAVED"
                    ) : (
                      <>
                        FILL YOUR MEDICAL ANAMNESIS{" "}
                        <span className="text-[#E31E24] font-black">*</span>
                      </>
                    )}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* RESTAURIRAN UPLOAD PROSTOR (Problem 6) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#2E5481] italic block tracking-widest">
                  Attach Clinical Findings (Optional)
                </label>
                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center hover:border-[#2E5481] transition-all">
                  <FileUpload onFileSelect={(f) => setFile(f)} />
                  <div className="mt-4">
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic">
                      PNG, JPG, PDF or MP4 | Max Size: 50MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 text-left">
                <label className="flex items-start gap-3 cursor-pointer group mb-6 leading-none">
                  <input
                    required
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => {
                      setIsAgreed(e.target.checked);
                      if (e.target.checked) setFormValidationError(null);
                    }}
                    className="mt-1 w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-[9px] font-bold text-slate-500 uppercase italic leading-tight text-left">
                    {/* [IZMENA vs Zlatni standard] Sređen razmak/format: “WITH TERMS …” bez spajanja reči. */}
                    By submitting this form you confirm that you are over 18
                    years old and you agree with{" "}
                    <Link
                      href="/terms-and-conditions"
                      className="text-[#2E5481] underline font-black italic"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms &amp; Conditions
                    </Link>
                    {", "}
                    <Link
                      href="/user-agreement"
                      className="text-[#2E5481] underline font-black italic"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      User Agreement
                    </Link>
                    {", "}
                    <Link
                      href="/notice-to-readers"
                      className="text-[#2E5481] underline font-black italic"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Notice to Readers
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/terms-of-payment"
                      className="text-[#2E5481] underline font-black italic"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms of Payment
                    </Link>
                    .
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="touch-manipulation w-full bg-[#E31E24] text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest hover:bg-red-700 transition-all text-sm italic disabled:opacity-60"
                >
                  {status === "loading"
                    ? "PROCESSING..."
                    : "SEND FOR EXPERT ANALYSIS →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* --- FOOTER RESTAURIRANO --- */}
      <footer className="bg-[#2E5481] pt-16 pb-8 px-6 md:px-12 text-white border-t-8 border-[#E31E24] text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-6 italic">
              Company
            </h4>
            <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest opacity-80 italic leading-none">
              {/* [IZMENA vs Zlatni standard] Footer linkovi vode na stvarne stranice (app router). */}
              <li>
                <Link href="/about">ABOUT US</Link>
              </li>
              <li>
                <Link href="/contact">CONTACT US</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-6 italic">
              Legal
            </h4>
            <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest opacity-80 italic leading-none">
              <li>
                <Link href="/terms-and-conditions">TERMS & CONDITIONS</Link>
              </li>
              <li>
                <Link href="/user-agreement">USER AGREEMENT</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-6 italic">
              Resources
            </h4>
            <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest opacity-80 italic leading-none">
              <li>
                <Link href="/notice-to-readers">NOTICE TO READERS</Link>
              </li>
              <li>
                <Link href="/terms-of-payment">TERMS OF PAYMENT</Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <div className="flex items-baseline leading-none">
              <span className="text-1xl md:text-1xl font-black tracking-tighter italic">
                MedExNews
              </span>
              <sup className="text-[12px] font-black text-[#E31E24] ml-0.5 bg-white px-1 rounded-sm italic">
                AI
              </sup>
            </div>

            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-4 leading-none">
              © 2026 MedExNews | ALL RIGHTS RESERVED | MedExNews does not
              provide medical advices, diagnosis or treatment. See additional
              Information.
            </p>
          </div>
        </div>
      </footer>

      {/* ANAMNESIS MODAL */}
      <AnimatePresence>
        {showAnamneza && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnamneza(false)}
              className="absolute inset-0 bg-[#2E5481]/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[40px] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowAnamneza(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-[#E31E24] z-50"
              >
                <X size={32} />
              </button>
              <div className="p-2">
                <RequestAnalysisForm
                  onSave={(data) => {
                    setAnamnezaData(data);
                    setAnamnezaDone(true);
                    setShowAnamneza(false);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
