/* 
  FAZA: Napredna Automatizacija - Zadatak 3 (Finance & CMS Perfection)
  STATUS: Golden Standard 3.2.4 (FINAL STABLE VERSION)
  LANGUAGE: English
  ---------------------------------------------------------
  ZLATNI STANDARD FINALIZACIJA:
  1. DATABASE: 'handleSavePrices' performs clean overwrite (No redundant keys).
  2. STATS: 'Database Sync' card used to show real-time loading status.
  3. EMAIL: Fully integrated fetch call to /api/send-email.
  4. UI: 100% Medical Grade English interface.
*/

"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  ReactNode,
  useState,
  useMemo,
} from "react";
import { supabase } from "@/lib/supabase"; 
import { 
  X, Users, Clock, DollarSign, 
  CheckCircle, Activity, Lock, PlayCircle, Send, CreditCard, Layout, FileEdit
} from "lucide-react"; 
import dynamic from 'next/dynamic';

// --- DYNAMIC COMPONENT: PDF BUTTON ---
const PDFButton = dynamic(() => import('@/components/PDFButton'), { 
  ssr: false,
  loading: () => <span className="text-slate-400 text-[10px] italic font-black">Syncing...</span>
});

// --- INTERFACES ---
interface PatientRequest {
  id: number; 
  patient_name: string; 
  patient_email: string; 
  urgency_level: string; 
  medical_note: string; 
  file_url: string | null; 
  created_at: string; 
  status: string; 
}

// [IZMENA vs Zlatni standard] CMS model za “MEDICINE IN THE FUTURE” kartice + sadržaj za /analysis/[slug].
interface MedicineNews {
  id: number;
  slug: string;
  /** Public tag prikazan na kartici (BASICS / CLINICAL CARDIOLOGY / FUTURE). */
  tag: "BASICS" | "CLINICAL CARDIOLOGY" | "FUTURE";
  title: string;
  desc: string;
  /** Duži sadržaj za zasebnu stranicu (admin uređuje; korisnik samo čita). */
  body: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

interface FooterLinks {
  company: { label: string; href: string }[];
  legal: { label: string; href: string }[];
  resources: { label: string; href: string }[];
}

// [DODATO vs Zlatni standard] CMS content za statične stranice.
type AboutPageCms = { imageUrl: string | null; body: string };
type LegalPagesCms = {
  termsAndConditions: string;
  userAgreement: string;
  noticeToReaders: string;
  termsOfPayment: string;
};

// [IZMENA vs Zlatni standard] Sesija admina ostaje posle refresh-a u istom tabu (sessionStorage).
// Nije localStorage — kad se tab zatvori, sesija se gubi (malo sigurnije od „zauvek ulogovan“).
const ADMIN_SESSION_STORAGE_KEY = "medex.admin.session.v1";

export default function AdminDashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'patients' | 'settings'>('patients');
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRequest | null>(null);
  
  // ZLATNI STANDARD: 'loading' state used to provide DB status feedback
  const [loading, setLoading] = useState(false);

  // CLINICAL ENTRY STATES
  const [analysis, setAnalysis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [references, setReferences] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- CMS STATES ---
  const [prices, setPrices] = useState({ normal: "33", priority: "66" });
  const [heroText, setHeroText] = useState("After analysis, we will send you PhD Personalized report...");
  const [heroDoctorPhotoUrl, setHeroDoctorPhotoUrl] = useState<string>("/doctor.png");
  const [heroUploading, setHeroUploading] = useState(false);
  
  const DEFAULT_MEDICINE_NEWS: MedicineNews[] = useMemo(
    () => [
      {
        id: 1,
        slug: "ai-echocardiography",
        tag: "BASICS",
        title: "AI in Echocardiography",
        desc: "Machine learning trends.",
        body: "",
        imageUrl: null,
        videoUrl: null,
      },
      {
        id: 2,
        slug: "gene-therapy-trends",
        tag: "CLINICAL CARDIOLOGY",
        title: "Gene Therapy Trends",
        desc: "Future of cardiomyopathy.",
        body: "",
        imageUrl: null,
        videoUrl: null,
      },
      {
        id: 3,
        slug: "remote-monitoring",
        tag: "FUTURE",
        title: "Remote Monitoring",
        desc: "Impact of wearable devices.",
        body: "",
        imageUrl: null,
        videoUrl: null,
      },
    ],
    [],
  );
  const [medicineNews, setMedicineNews] = useState<MedicineNews[]>(DEFAULT_MEDICINE_NEWS);

  const [footerLinks, setFooterLinks] = useState<FooterLinks>({
    company: [
      { label: "ABOUT US", href: "/about" },
      { label: "CONTACT US", href: "/contact" },
    ],
    legal: [
      { label: "TERMS & CONDITIONS", href: "/terms-and-conditions" },
      { label: "USER AGREEMENT", href: "/user-agreement" },
    ],
    resources: [
      { label: "NOTICE TO READERS", href: "/notice-to-readers" },
      { label: "TERMS OF PAYMENT", href: "/terms-of-payment" },
    ],
  });

  // --- PAGES CMS (ABOUT / LEGAL) ---
  const [aboutCms, setAboutCms] = useState<AboutPageCms>({
    imageUrl: null,
    body: "",
  });
  const [legalCms, setLegalCms] = useState<LegalPagesCms>({
    termsAndConditions: "",
    userAgreement: "",
    noticeToReaders: "",
    termsOfPayment: "",
  });

  /* --- CELINA 1: DATABASE SYNCHRONIZATION --- */
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Clinical Cases
      const { data: reqs } = await supabase.from("patient_requests").select("*").order("created_at", { ascending: false });
      setRequests(reqs || []);
      
      // 2. Fetch Pricing from 'site_config'
      const { data: config } = await supabase.from("site_config").select("*").eq('key', 'pricing').single();
      if (config && config.value) {
        setPrices({
          normal: config.value.normal || "33",
          priority: config.value.priority || "66"
        });
      }

      // 3. Fetch CMS content blocks
      const { data: heroCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "hero_content")
        .single();
      const hv = heroCfg?.value as
        | { doctorPhotoUrl?: string; floatingMessage?: string }
        | undefined;
      if (hv?.doctorPhotoUrl) setHeroDoctorPhotoUrl(String(hv.doctorPhotoUrl));
      if (hv?.floatingMessage) setHeroText(String(hv.floatingMessage));

      const { data: newsCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "clinical_news")
        .single();
      const nv = newsCfg?.value as { items?: unknown } | undefined;
      if (Array.isArray(nv?.items)) {
        const items = nv.items as Array<Partial<MedicineNews>>;
        // Map i popuni sva polja (body/image/video) ako postoje.
        const next = [0, 1, 2].map((idx) => {
          const it = items[idx] ?? {};
          const fallback = DEFAULT_MEDICINE_NEWS[idx];
          return {
            id: typeof it.id === "number" ? it.id : fallback.id,
            slug: typeof it.slug === "string" && it.slug.trim() ? it.slug : fallback.slug,
            tag:
              it.tag === "BASICS" || it.tag === "CLINICAL CARDIOLOGY" || it.tag === "FUTURE"
                ? it.tag
                : fallback.tag,
            title: typeof it.title === "string" ? it.title : fallback.title,
            desc:
              typeof (it as { description?: unknown }).description === "string"
                ? String((it as { description: string }).description)
                : typeof (it as { desc?: unknown }).desc === "string"
                  ? String((it as { desc: string }).desc)
                  : fallback.desc,
            body: typeof (it as { body?: unknown }).body === "string" ? String((it as { body: string }).body) : fallback.body,
            imageUrl:
              typeof (it as { imageUrl?: unknown }).imageUrl === "string"
                ? String((it as { imageUrl: string }).imageUrl)
                : null,
            videoUrl:
              typeof (it as { videoUrl?: unknown }).videoUrl === "string"
                ? String((it as { videoUrl: string }).videoUrl)
                : null,
          } as MedicineNews;
        });
        setMedicineNews(next);
      }

      const { data: footerCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "footer_links")
        .single();
      const fv = footerCfg?.value as Partial<FooterLinks> | undefined;
      if (fv?.company && fv?.legal && fv?.resources) {
        setFooterLinks({
          company: fv.company,
          legal: fv.legal,
          resources: fv.resources,
        } as FooterLinks);
      }

      const { data: aboutCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "about_page")
        .single();
      const av = aboutCfg?.value as Partial<AboutPageCms> | undefined;
      if (av) {
        setAboutCms({
          imageUrl: typeof av.imageUrl === "string" ? av.imageUrl : null,
          body: typeof av.body === "string" ? av.body : "",
        });
      }

      const { data: legalCfg } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "legal_pages")
        .single();
      const lv = legalCfg?.value as Partial<LegalPagesCms> | undefined;
      if (lv) {
        setLegalCms({
          termsAndConditions: typeof lv.termsAndConditions === "string" ? lv.termsAndConditions : "",
          userAgreement: typeof lv.userAgreement === "string" ? lv.userAgreement : "",
          noticeToReaders: typeof lv.noticeToReaders === "string" ? lv.noticeToReaders : "",
          termsOfPayment: typeof lv.termsOfPayment === "string" ? lv.termsOfPayment : "",
        });
      }
    } catch (err) {
      console.error("Clinical Sync Error:", err);
    } finally {
      setLoading(false);
    }
  }, [DEFAULT_MEDICINE_NEWS]);

  // [IZMENA vs Zlatni standard] Ranije je posle refresh-a uvek bio logout (useState(false)).
  // useLayoutEffect čita sessionStorage pre prvog crtanja da smanjimo treperenje ekrana.
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === "1") {
        setIsLoggedIn(true);
      }
    } catch {
      /* privatni režim / blokiran storage */
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadAllData();
  }, [isLoggedIn, loadAllData]);

  const persistAdminSession = () => {
    try {
      sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const clearAdminSession = () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  // [IZMENA vs Zlatni standard] PIN se proverava na serveru (/api/admin/verify-pin), ne u React kodu.
  const tryAdminLogin = async () => {
    setLoginError(null);
    setLoginPending(true);
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: passInput }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (res.status === 503 && data.error === "pin_not_configured") {
        setLoginError(
          "Admin access is not configured on this server (missing PIN).",
        );
        return;
      }

      if (res.ok && data.ok) {
        persistAdminSession();
        setIsLoggedIn(true);
        return;
      }

      setLoginError("Invalid PIN. Please try again.");
    } catch {
      setLoginError("Could not reach the server. Check your connection.");
    } finally {
      setLoginPending(false);
    }
  };

  const handleAdminLogout = () => {
    clearAdminSession();
    setIsLoggedIn(false);
    setPassInput("");
  };

  /* --- CELINA 2: CMS ACTIONS (CLEAN SYNC) --- */
  const handleSavePrices = async () => {
    setIsSending(true);
    try {
      // ZLATNI STANDARD: Overwriting with clean keys to prevent residual data in JSON
      const cleanPricing = {
        normal: prices.normal,
        priority: prices.priority
      };

      const { error } = await supabase.from("site_config").upsert({ 
        key: 'pricing', 
        value: cleanPricing 
      }, { onConflict: 'key' });
      
      if (error) throw error;
      alert("Success: Database cleaned and prices updated for live website.");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Sync failed"));
    } finally {
      setIsSending(false);
    }
  };

  // [IZMENA vs Zlatni standard] CMS Editor sada zaista upisuje u site_config, umesto alert().
  const handleSaveHeroContent = async () => {
    setIsSending(true);
    try {
      const cleanHero = {
        doctorPhotoUrl: heroDoctorPhotoUrl,
        floatingMessage: heroText,
      };
      const { error } = await supabase.from("site_config").upsert(
        { key: "hero_content", value: cleanHero },
        { onConflict: "key" },
      );
      if (error) throw error;
      alert("Success: Hero content updated.");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Sync failed"));
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveClinicalNews = async () => {
    setIsSending(true);
    try {
      // [IZMENA vs prethodni CMS] Admin sada uređuje i “duži sadržaj + media” koji se prikazuje na /analysis/[slug].
      const items = medicineNews.slice(0, 3).map((n) => ({
        id: n.id,
        slug: n.slug,
        tag: n.tag,
        title: n.title,
        description: n.desc,
        body: n.body,
        imageUrl: n.imageUrl,
        videoUrl: n.videoUrl,
      }));
      const { error } = await supabase.from("site_config").upsert(
        { key: "clinical_news", value: { items } },
        { onConflict: "key" },
      );
      if (error) throw error;
      alert("Success: Clinical news cards updated.");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Sync failed"));
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveFooterLinks = async () => {
    setIsSending(true);
    try {
      const { error } = await supabase.from("site_config").upsert(
        { key: "footer_links", value: footerLinks },
        { onConflict: "key" },
      );
      if (error) throw error;
      alert("Success: Footer links updated.");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Sync failed"));
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAboutPage = async () => {
    setIsSending(true);
    try {
      const { error } = await supabase.from("site_config").upsert(
        { key: "about_page", value: aboutCms },
        { onConflict: "key" },
      );
      if (error) throw error;
      alert("Success: About page updated.");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Sync failed"));
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveLegalPages = async () => {
    setIsSending(true);
    try {
      const { error } = await supabase.from("site_config").upsert(
        { key: "legal_pages", value: legalCms },
        { onConflict: "key" },
      );
      if (error) throw error;
      alert("Success: Legal pages updated.");
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Sync failed"));
    } finally {
      setIsSending(false);
    }
  };

  async function uploadCmsFile(file: File, prefix: string): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("prefix", prefix);
    const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
    const data: unknown = await res.json();
    const payload = data as { url?: string; error?: string; details?: string };
    if (!res.ok || !payload.url) {
      throw new Error(payload.details || payload.error || `Upload failed (${res.status})`);
    }
    return payload.url;
  }

  /* --- CELINA 3: MEDICAL WORKFLOW & EMAIL --- */
  const handleSendReport = async () => {
    if (!selectedPatient) return;
    setIsSending(true);
    try {
      // [IZMENA 2026] Server čuva ekspertni tekst, generiše preview PDF, šalje DRUGI mejl pacijentu
      // (link ka /success + plaćanje). Prvi mejl ostaje samo potvrda prijema — bez plaćanja.
      const emailRes = await fetch("/api/finalize-expert-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedPatient.id,
          analysis,
          recommendation,
          references,
        }),
      });

      if (!emailRes.ok) {
        const errJson: unknown = await emailRes.json().catch(() => null);
        let detail = `HTTP ${emailRes.status}`;
        if (errJson && typeof errJson === "object") {
          const o = errJson as {
            details?: unknown;
            error?: unknown;
          };
          if (typeof o.details === "string" && o.details.trim()) {
            detail = o.details;
          } else if (typeof o.error === "string") {
            detail = o.error;
          }
        }
        throw new Error(`Finalize report failed: ${detail}`);
      }

      alert("Clinical report finalized and email notification sent!");
      setSelectedPatient(null);
      loadAllData();
    } catch (err) {
      alert("Critical Error: " + (err instanceof Error ? err.message : "System Error"));
    } finally {
      setIsSending(false);
    }
  };

  // --- STATISTICS CALCULATIONS ---
  const stats = useMemo(() => {
    const total = requests.length;
    const paidCount = requests.filter(r => r.status === 'paid').length;
    const currentPrice = Number(prices.priority) || 66;

    return {
      total,
      unprocessed: requests.filter(r => r.status === 'pending' || !r.status).length,
      paid: paidCount,
      revenue: paidCount * currentPrice
    };
  }, [requests, prices]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#2E5481] flex items-center justify-center p-6 font-sans">
        <p className="text-white/90 text-sm font-bold uppercase tracking-widest">Loading…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    const helpEmail = process.env.NEXT_PUBLIC_ADMIN_HELP_EMAIL?.trim();
    return (
      <div className="min-h-screen bg-[#2E5481] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center border-t-8 border-[#E31E24]">
          <Lock className="text-[#2E5481] mx-auto mb-6" size={40} />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#2E5481]">Admin Access</h2>
          <input
            type="password"
            placeholder="PIN..."
            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-2 text-center font-bold outline-none focus:border-[#2E5481]"
            value={passInput}
            onChange={(e) => {
              setPassInput(e.target.value);
              if (loginError) setLoginError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loginPending) void tryAdminLogin();
            }}
            autoComplete="current-password"
          />
          {loginError ? (
            <p className="mb-3 text-sm font-semibold text-red-600" role="alert">
              {loginError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void tryAdminLogin()}
            disabled={loginPending}
            className="w-full bg-[#E31E24] text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-red-700 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {loginPending ? "Checking…" : "Authorize"}
          </button>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="mt-4 text-sm font-bold text-[#2E5481] underline underline-offset-2 hover:text-[#1e3a5f]"
          >
            Forgot password?
          </button>
        </div>

        {showForgotPassword ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <div className="max-w-md rounded-2xl bg-white p-8 shadow-2xl text-left">
              <h3
                id="forgot-password-title"
                className="text-lg font-black uppercase text-[#2E5481]"
              >
                Recover admin access
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Your PIN is verified on the server and is not visible in the
                website code. It cannot be reset from this browser. If you lost
                it, contact whoever hosts or maintains this MedEx site.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Operators: set a strong value for{" "}
                <code className="rounded bg-slate-100 px-1">
                  MEDEX_ADMIN_DASHBOARD_PIN
                </code>{" "}
                in <code className="rounded bg-slate-100 px-1">.env.local</code>{" "}
                (or your host&apos;s secret env vars), then restart the app.
                Never use <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_*</code>{" "}
                for a PIN — that would expose it to visitors.
              </p>
              {helpEmail ? (
                <p className="mt-3 text-sm">
                  <span className="font-semibold text-slate-700">Support: </span>
                  <a
                    href={`mailto:${helpEmail}`}
                    className="font-bold text-[#2E5481] underline"
                  >
                    {helpEmail}
                  </a>
                </p>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Optional: set{" "}
                  <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_ADMIN_HELP_EMAIL</code>{" "}
                  in <code className="rounded bg-slate-100 px-1">.env.local</code> to show a
                  mailto link here.
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="mt-6 w-full rounded-xl bg-[#2E5481] py-3 text-sm font-black uppercase text-white hover:bg-[#1e3a5f]"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 text-left">
      <nav className="bg-[#2E5481] border-b-4 border-[#E31E24] p-6 text-white shadow-xl mb-8 flex justify-between items-center leading-none">
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">MedEx Admin <span className="text-red-400">Control</span></h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('patients')} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'patients' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>Patients</button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'settings' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>CMS Editor</button>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="p-2 bg-red-600/20 hover:bg-red-600 rounded-lg transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <Lock size={18} />
          </button>
        </div>
      </nav>

      {activeTab === 'patients' && (
        <div className="max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-left">
            <StatCard title="Total" value={stats.total} icon={<Users size={20}/>}/>
            <StatCard title="Database Sync" value={loading ? "Syncing..." : "Active"} icon={<CheckCircle size={20}/>}/>
            <StatCard title="Pending" value={stats.unprocessed} icon={<Clock size={20}/>}/>
            <StatCard title="Reports" value={stats.total} icon={<Activity size={20}/>}/>
            <StatCard title="Paid Requests" value={stats.paid} icon={<DollarSign size={20}/>}/>
            <StatCard title="Total Revenue" value={`$${stats.revenue}`} icon={<CreditCard className="text-emerald-500" size={20}/>}/>
          </div>

          <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden text-left">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 uppercase text-[10px] font-black text-slate-400 italic border-b">
                <tr><th className="p-8">Patient Identity</th><th className="p-8 text-center">Status</th><th className="p-8 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-all group">
                    <td className="p-8 text-left">
                      <div className="font-black text-[#2E5481] uppercase text-lg group-hover:text-[#E31E24] transition-colors">{r.patient_name}</div>
                      <div className="text-xs text-slate-400 font-bold">{r.patient_email}</div>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${
                        r.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        r.status === 'completed' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {r.status === 'paid' ? 'PAID' : r.status === 'completed' ? 'AWAITING PAYMENT' : 'NEW REQUEST'}
                      </span>
                    </td>
                    <td className="p-8 text-right">
                      <button onClick={() => { setSelectedPatient(r); setAnalysis(""); setRecommendation(""); setReferences(""); }} className="px-8 py-3 bg-[#2E5481] text-white text-[11px] rounded-2xl font-black uppercase shadow-lg hover:scale-105 transition-all">Analyze Case</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CMS EDITOR VIEW --- */}
      {activeTab === 'settings' && (
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 animate-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><DollarSign /> Price Settings</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    <div><label className="block mb-1">Basic Review ($)</label><input type="text" value={prices.normal} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-[#2E5481]" onChange={e=>setPrices({...prices, normal: e.target.value})} /></div>
                    <div><label className="block mb-1">Extended Review ($)</label><input type="text" value={prices.priority} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-[#2E5481]" onChange={e=>setPrices({...prices, priority: e.target.value})} /></div>
                    <button onClick={handleSavePrices} className="w-full bg-[#E31E24] text-white p-5 rounded-2xl font-black uppercase shadow-lg">Save Website Prices</button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Layout /> Hero Content</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    <div className="space-y-2">
                      <label className="block mb-1">Doctor Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full p-3 bg-slate-50 border rounded-2xl text-[10px]"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setHeroUploading(true);
                          try {
                            const url = await uploadCmsFile(f, "hero-doctor");
                            setHeroDoctorPhotoUrl(url);
                          } catch (err) {
                            alert("Upload error: " + (err instanceof Error ? err.message : "Unknown"));
                          } finally {
                            setHeroUploading(false);
                          }
                        }}
                      />
                      <div className="text-[10px] text-slate-500 normal-case font-bold">
                        Current: <span className="font-mono break-all">{heroDoctorPhotoUrl}</span>
                      </div>
                      {/* [DODATO vs Zlatni standard] Vizuelni preview hero slike + brzo uklanjanje. */}
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote/public URL */}
                      <img
                        src={heroDoctorPhotoUrl}
                        alt="Doctor photo preview"
                        className="w-full h-40 object-cover rounded-2xl border border-slate-100 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setHeroDoctorPhotoUrl("/doctor.png")}
                        className="w-full bg-white border border-slate-200 text-slate-700 p-4 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-50"
                      >
                        Remove photo (use default)
                      </button>
                    </div>
                    <div><label className="block mb-1">Floating Message</label><textarea value={heroText} onChange={e=>setHeroText(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold h-24 outline-none focus:border-[#2E5481]" /></div>
                    <button
                      onClick={handleSaveHeroContent}
                      disabled={isSending || heroUploading}
                      className="w-full bg-[#2E5481] text-white p-5 rounded-2xl font-black uppercase shadow-md disabled:opacity-60"
                    >
                      {heroUploading ? "Uploading..." : "Update Hero Section"}
                    </button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2 text-left">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Activity /> Clinical News Control</h3>
                <p className="text-xs text-slate-500 font-bold mb-6">
                  Edit the public “Medicine in the future” cards and the full content shown on
                  <span className="font-mono"> /analysis/[slug]</span>. Patients can view only; only admins can edit.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    {medicineNews.map((news, idx) => (
                      <div key={news.id} className="p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
                         <div className="border-l-4 border-red-500 pl-3 space-y-1">
                           <p className="text-[10px] font-black text-red-500 uppercase">{news.tag}</p>
                           <p className="text-[10px] font-bold text-slate-400">
                             Slug: <span className="font-mono">{news.slug}</span>
                           </p>
                         </div>
                         <input
                           className="w-full p-3 text-sm font-bold rounded-xl border-2 border-slate-100 outline-none focus:border-[#2E5481]"
                           value={news.title}
                           onChange={e=>{ const n = [...medicineNews]; n[idx] = { ...n[idx], title: e.target.value }; setMedicineNews(n); }}
                         />
                         <textarea
                           className="w-full p-3 text-xs h-20 border-2 border-slate-100 rounded-xl outline-none focus:border-[#2E5481]"
                           value={news.desc}
                           onChange={e=>{ const n = [...medicineNews]; n[idx] = { ...n[idx], desc: e.target.value }; setMedicineNews(n); }}
                         />
                         <textarea
                           className="w-full p-3 text-xs h-36 border-2 border-slate-100 rounded-xl outline-none focus:border-[#2E5481]"
                           placeholder="Full page content (use paragraphs separated by blank lines)…"
                           value={news.body}
                           onChange={e=>{ const n = [...medicineNews]; n[idx] = { ...n[idx], body: e.target.value }; setMedicineNews(n); }}
                         />
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400">
                             Image (optional)
                           </label>
                           <input
                             type="file"
                             accept="image/*"
                             className="w-full p-3 bg-white border rounded-2xl text-[10px]"
                             onChange={async (e) => {
                               const f = e.target.files?.[0];
                               if (!f) return;
                               try {
                                 const url = await uploadCmsFile(f, `clinical-${news.slug}-img`);
                                 const n = [...medicineNews];
                                 n[idx] = { ...n[idx], imageUrl: url };
                                 setMedicineNews(n);
                               } catch (err) {
                                 alert("Upload error: " + (err instanceof Error ? err.message : "Unknown"));
                               }
                             }}
                           />
                           {news.imageUrl && (
                            <div className="space-y-2">
                              <div className="text-[10px] text-slate-500 normal-case font-bold break-all">
                                Current: {news.imageUrl}
                              </div>
                              {/* [DODATO vs Zlatni standard] Vizuelni preview uploadovane slike. */}
                              {/* eslint-disable-next-line @next/next/no-img-element -- remote/public URL */}
                              <img
                                src={news.imageUrl}
                                alt="Clinical news image preview"
                                className="w-full h-28 object-cover rounded-2xl border border-slate-100 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const n = [...medicineNews];
                                  n[idx] = { ...n[idx], imageUrl: null };
                                  setMedicineNews(n);
                                }}
                                className="w-full bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-50"
                              >
                                Remove image
                              </button>
                            </div>
                           )}
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400">
                             Video (optional)
                           </label>
                           <input
                             type="file"
                             accept="video/*"
                             className="w-full p-3 bg-white border rounded-2xl text-[10px]"
                             onChange={async (e) => {
                               const f = e.target.files?.[0];
                               if (!f) return;
                               try {
                                 const url = await uploadCmsFile(f, `clinical-${news.slug}-vid`);
                                 const n = [...medicineNews];
                                 n[idx] = { ...n[idx], videoUrl: url };
                                 setMedicineNews(n);
                               } catch (err) {
                                 alert("Upload error: " + (err instanceof Error ? err.message : "Unknown"));
                               }
                             }}
                           />
                           {news.videoUrl && (
                            <div className="space-y-2">
                              <div className="text-[10px] text-slate-500 normal-case font-bold break-all">
                                Current: {news.videoUrl}
                              </div>
                              {/* [DODATO vs Zlatni standard] Vizuelni preview uploadovanog videa. */}
                              <video
                                src={news.videoUrl}
                                controls
                                className="w-full rounded-2xl border border-slate-100 bg-black"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const n = [...medicineNews];
                                  n[idx] = { ...n[idx], videoUrl: null };
                                  setMedicineNews(n);
                                }}
                                className="w-full bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-50"
                              >
                                Remove video
                              </button>
                            </div>
                           )}
                         </div>
                      </div>
                    ))}
                </div>
                <button onClick={handleSaveClinicalNews} disabled={isSending} className="w-full bg-[#2E5481] text-white p-5 rounded-3xl font-black uppercase mt-8 shadow-lg disabled:opacity-60">Save Clinical News</button>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2 text-left">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><FileEdit /> Footer Column Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(Object.keys(footerLinks) as Array<keyof FooterLinks>).map((col) => (
                      <div key={col} className="space-y-4">
                        <label className="text-[10px] font-black text-red-500 uppercase ml-1 italic tracking-widest">{col} Column</label>
                        {footerLinks[col].map((l, i) => (
                          <div key={i} className="grid grid-cols-1 gap-2">
                            <input
                              value={l.label}
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#2E5481]"
                              onChange={(e) => {
                                const next = { ...footerLinks };
                                next[col][i] = { ...next[col][i], label: e.target.value };
                                setFooterLinks(next);
                              }}
                            />
                            <input
                              value={l.href}
                              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-bold outline-none focus:border-[#2E5481]"
                              onChange={(e) => {
                                const next = { ...footerLinks };
                                next[col][i] = { ...next[col][i], href: e.target.value };
                                setFooterLinks(next);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
                <button onClick={handleSaveFooterLinks} disabled={isSending} className="w-full bg-[#2E5481] text-white p-5 rounded-3xl font-black uppercase mt-8 shadow-lg disabled:opacity-60">Save Footer Links</button>
            </div>

            {/* --- [DODATO vs Zlatni standard] PAGES EDITOR (ABOUT / LEGAL) --- */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2 text-left">
              <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2">
                <FileEdit /> Pages Editor
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">
                    About us
                  </p>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      About image (optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full p-3 bg-slate-50 border rounded-2xl text-[10px]"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const url = await uploadCmsFile(f, "about-image");
                          setAboutCms((p) => ({ ...p, imageUrl: url }));
                        } catch (err) {
                          alert("Upload error: " + (err instanceof Error ? err.message : "Unknown"));
                        }
                      }}
                    />
                    {aboutCms.imageUrl && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-slate-500 normal-case font-bold break-all">
                          Current: {aboutCms.imageUrl}
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element -- CMS public URL */}
                        <img
                          src={aboutCms.imageUrl}
                          alt="About image preview"
                          className="w-full h-28 object-cover rounded-2xl border border-slate-100 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setAboutCms((p) => ({ ...p, imageUrl: null }))}
                          className="w-full bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-50"
                        >
                          Remove image
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      About text
                    </label>
                    <textarea
                      value={aboutCms.body}
                      onChange={(e) => setAboutCms((p) => ({ ...p, body: e.target.value }))}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold h-48 outline-none focus:border-[#2E5481]"
                      placeholder="Write the About page content…"
                    />
                  </div>
                  <button
                    onClick={handleSaveAboutPage}
                    disabled={isSending}
                    className="w-full bg-[#2E5481] text-white p-5 rounded-2xl font-black uppercase shadow-md disabled:opacity-60"
                  >
                    Save About page
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">
                    Legal pages
                  </p>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Terms &amp; conditions
                    </label>
                    <textarea
                      value={legalCms.termsAndConditions}
                      onChange={(e) => setLegalCms((p) => ({ ...p, termsAndConditions: e.target.value }))}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold h-28 outline-none focus:border-[#2E5481]"
                      placeholder="Text for Terms & Conditions…"
                    />

                    <label className="text-[10px] font-black uppercase text-slate-400">
                      User agreement
                    </label>
                    <textarea
                      value={legalCms.userAgreement}
                      onChange={(e) => setLegalCms((p) => ({ ...p, userAgreement: e.target.value }))}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold h-28 outline-none focus:border-[#2E5481]"
                      placeholder="Text for User Agreement…"
                    />

                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Notice to readers
                    </label>
                    <textarea
                      value={legalCms.noticeToReaders}
                      onChange={(e) => setLegalCms((p) => ({ ...p, noticeToReaders: e.target.value }))}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold h-24 outline-none focus:border-[#2E5481]"
                      placeholder="Text for Notice to Readers…"
                    />

                    <label className="text-[10px] font-black uppercase text-slate-400">
                      Terms of payment
                    </label>
                    <textarea
                      value={legalCms.termsOfPayment}
                      onChange={(e) => setLegalCms((p) => ({ ...p, termsOfPayment: e.target.value }))}
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold h-24 outline-none focus:border-[#2E5481]"
                      placeholder="Text for Terms of Payment…"
                    />
                  </div>
                  <button
                    onClick={handleSaveLegalPages}
                    disabled={isSending}
                    className="w-full bg-[#2E5481] text-white p-5 rounded-2xl font-black uppercase shadow-md disabled:opacity-60"
                  >
                    Save legal pages
                  </button>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* ANALYZE MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[50px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-[#2E5481] animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#2E5481] text-white flex justify-between items-center leading-none">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Diagnostic Lab: {selectedPatient.patient_name}</h2>
              <button onClick={() => setSelectedPatient(null)} className="bg-white/10 p-3 rounded-full hover:bg-red-500 transition-all leading-none"><X size={24}/></button>
            </div>

            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto text-left">
              <div className="space-y-8">
                <div className="p-8 bg-slate-50 rounded-[35px] border-2 border-dashed border-slate-200 text-left">
                  <p className="text-[11px] font-black text-[#E31E24] uppercase mb-4 italic tracking-widest leading-none">PhD Anamnesis Record:</p>
                  <div className="text-sm font-medium leading-relaxed text-slate-600 max-h-64 overflow-y-auto bg-white p-6 rounded-2xl border border-slate-100 shadow-inner">
                    {selectedPatient.medical_note || "Data missing."}
                  </div>
                </div>

                <div className="bg-[#E1EBF5] p-6 rounded-[30px] border-2 border-blue-100 flex items-center justify-between">
                   <div><p className="text-[10px] font-black text-[#2E5481] uppercase tracking-widest">Clinical Media</p></div>
                   <button 
                    onClick={() => {
                      const url = selectedPatient.file_url;
                      if (url && url !== "N/A" && url.trim() !== "" && url.startsWith('http')) {
                        window.open(url, '_blank');
                      } else {
                        alert("No clinical upload found.");
                      }
                    }}
                    className="flex items-center gap-2 bg-[#2E5481] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-blue-900 transition-all shadow-md"
                   >
                     <PlayCircle size={16}/> View Media
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <textarea className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] h-40 outline-none focus:border-[#2E5481] font-bold text-sm shadow-inner" placeholder="Step 1: Clinical Findings..." value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
                <textarea className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] h-32 outline-none focus:border-[#2E5481] font-bold text-sm shadow-inner" placeholder="Step 2: Recommendations..." value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
                <textarea className="w-full p-4 bg-slate-50 border-2 border-red-50 rounded-[20px] h-24 outline-none focus:border-[#2E5481] font-medium text-xs italic shadow-inner" placeholder="Step 3: References..." value={references} onChange={(e) => setReferences(e.target.value)} />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t-4 border-[#2E5481] flex justify-between items-center leading-none">
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Discard</button>
              <div className="flex gap-4">
                <PDFButton patient={selectedPatient} analysis={analysis} recommendation={recommendation} references={references} mode="review" />
                <button 
                  onClick={handleSendReport}
                  disabled={isSending || !analysis}
                  className="flex items-center gap-2 bg-[#E31E24] text-white px-10 py-4 rounded-3xl font-black uppercase text-xs shadow-xl hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  <Send size={16}/> {isSending ? 'Sending...' : 'Notify & Send Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-lg flex items-center justify-between hover:scale-105 transition-all text-left">
      <div>
        <p className="text-[9px] text-slate-400 font-black uppercase italic mb-1 tracking-widest leading-none">{title}</p>
        <p className="text-xl font-black text-[#2E5481] leading-none">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-2xl text-[#2E5481] shadow-inner">{icon}</div>
    </div>
  );
}








