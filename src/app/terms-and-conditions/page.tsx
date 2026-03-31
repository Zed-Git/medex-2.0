'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TermsAndConditionsPage() {
  const [body, setBody] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('site_config')
          .select('value')
          .eq('key', 'legal_pages')
          .single();
        if (cancelled) return;
        const v = data?.value as { termsAndConditions?: unknown } | undefined;
        setBody(typeof v?.termsAndConditions === 'string' ? v.termsAndConditions : null);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E31E24] italic">
            Legal
          </p>
          <h1 className="text-3xl font-black tracking-tighter italic text-[#2E5481]">
            Terms &amp; conditions
          </h1>
          <p className="text-sm text-slate-600">
            These terms describe how you may use the MedExNews website and
            services.
          </p>
        </header>

        <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-md p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">1. Educational nature</h2>
          {body?.trim() ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {body}
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-700 leading-relaxed">
                MedExNews provides informational content and expert summaries.
                Content is not a substitute for professional medical advice,
                diagnosis, or treatment.
              </p>

              <h2 className="text-lg font-bold text-slate-900">2. User responsibilities</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                You are responsible for how you use the information provided. Always
                consult a qualified healthcare professional for medical decisions.
              </p>

              <h2 className="text-lg font-bold text-slate-900">3. Limitations</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                MedExNews does not guarantee outcomes and is not liable for damages
                resulting from reliance on website content.
              </p>
            </>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[#2E5481] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1e3a5f]"
          >
            Back to home
          </Link>
          <Link
            href="/user-agreement"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            User agreement
          </Link>
        </div>
      </div>
    </main>
  );
}

