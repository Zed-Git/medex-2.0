'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserAgreementPage() {
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
        const v = data?.value as { userAgreement?: unknown } | undefined;
        setBody(typeof v?.userAgreement === 'string' ? v.userAgreement : null);
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
            User agreement
          </h1>
          <p className="text-sm text-slate-600">
            This agreement outlines acceptable use and user responsibilities.
          </p>
        </header>

        <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-md p-6 space-y-4 shadow-sm">
          {body?.trim() ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {body}
            </p>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900">Acceptable use</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                You agree not to misuse the service, attempt to access private
                systems, or use the website for unlawful purposes.
              </p>

              <h2 className="text-lg font-bold text-slate-900">Account and communication</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                If you provide contact information, you confirm it is accurate and
                you consent to receiving service-related communications.
              </p>

              <h2 className="text-lg font-bold text-slate-900">No medical advice</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                MedExNews does not provide medical advice, diagnosis, or treatment.
                Always consult a qualified physician.
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
            href="/terms-and-conditions"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Terms &amp; conditions
          </Link>
        </div>
      </div>
    </main>
  );
}

