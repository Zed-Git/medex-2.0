// src/app/request-analysis/page.tsx
//
// =============================================================================
// RESTORE NOTE (Golden Standard stability)
// =============================================================================
// This file had been overwritten by mistake with API-route code (a duplicate of
// `src/app/api/request-analysis/route.ts`), which removed the default page export
// and broke `next build`. The route handler lives only under `app/api/...`.
// This page is the patient-facing “Request analysis” form: it POSTs JSON to
// `/api/request-analysis`, which inserts into Supabase and triggers e-mail via
// `@/lib/email-service`.
// =============================================================================

"use client";

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { useState, FormEvent } from "react";
import Link from "next/link";

// --- [FUNCTIONAL BLOCK: TYPES] ---
interface ApiSuccessBody {
  success?: boolean;
  requestId?: string | number;
  message?: string;
}

interface ApiErrorBody {
  error?: string;
}

// --- [FUNCTIONAL BLOCK: PAGE COMPONENT] ---
export default function RequestAnalysisPage() {
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [medicalNote, setMedicalNote] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setFeedback(null);

    try {
      const res = await fetch("/api/request-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientEmail: patientEmail.trim(),
          medicalNote: medicalNote.trim(),
          price: price.trim() || null,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const err = data as ApiErrorBody;
        setStatus("error");
        setFeedback(err.error ?? "Unable to submit your request. Please try again.");
        return;
      }

      const ok = data as ApiSuccessBody;
      setStatus("success");
      setFeedback(
        ok.message ??
          "Your request has been received. A confirmation e-mail will be sent to your inbox when the system is configured.",
      );
    } catch {
      setStatus("error");
      setFeedback("A network error occurred. Please check your connection and try again.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="max-w-xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Medex 2.0 · Cardiology analysis
        </p>
        <h1 className="text-3xl font-black italic text-[#2E5481] mb-2">
          Request expert analysis
        </h1>
        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          Submit your clinical summary for PhD-level cardiology review. You will
          receive an initial confirmation by e-mail; after expert analysis and
          payment, your full report (PDF) is delivered automatically.
        </p>

        {status === "success" ? (
          <div className="rounded-2xl border-2 border-emerald-500 bg-white p-8 shadow-lg">
            <p className="text-emerald-700 font-semibold mb-2">Request received</p>
            <p className="text-sm text-slate-600 mb-6">{feedback}</p>
            <Link
              href="/"
              className="inline-block text-sm font-bold text-[#2E5481] underline"
            >
              Return to home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white rounded-[35px] shadow-xl border border-slate-100 p-8"
          >
            {status === "error" && feedback && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {feedback}
              </p>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 italic mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                required
                className="w-full border-b-2 border-slate-100 py-2 outline-none font-bold text-slate-800"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 italic mb-1">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                className="w-full border-b-2 border-slate-100 py-2 outline-none font-bold text-slate-800"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 italic mb-1">
                Clinical summary / referral question <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={6}
                className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm leading-relaxed outline-none focus:border-[#2E5481]"
                placeholder="Relevant history, symptoms, investigations, and the specific question for the expert reviewer."
                value={medicalNote}
                onChange={(e) => setMedicalNote(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 italic mb-1">
                Quoted fee (optional)
              </label>
              <input
                className="w-full border-b-2 border-slate-100 py-2 outline-none font-bold text-slate-800"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="If already agreed — e.g. 49"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-4 rounded-xl bg-[#2E5481] text-white font-black uppercase text-xs tracking-widest disabled:opacity-60"
            >
              {status === "loading" ? "Submitting…" : "Submit request"}
            </button>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              MedExNews does not provide emergency medical advice. For urgent
              symptoms, contact local emergency services or your physician.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
