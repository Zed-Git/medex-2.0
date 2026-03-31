'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NoticeToReadersPage() {
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
        const v = data?.value as { noticeToReaders?: unknown } | undefined;
        setBody(typeof v?.noticeToReaders === 'string' ? v.noticeToReaders : null);
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
            Resources
          </p>
          <h1 className="text-3xl font-black tracking-tighter italic text-[#2E5481]">
            Notice to readers
          </h1>
          <p className="text-sm text-slate-600">
            Please read this notice carefully before using MedExNews content.
          </p>
        </header>

        <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-md p-6 space-y-4 shadow-sm">
          {body?.trim() ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {body}
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-700 leading-relaxed">
                MedExNews content is provided for informational and educational
                purposes only. It is not intended to substitute professional medical
                advice, diagnosis, or treatment.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">
                If you have symptoms or concerns, seek advice from a qualified
                healthcare professional. In emergencies, contact your local
                emergency services immediately.
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
            href="/terms-of-payment"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Terms of payment
          </Link>
        </div>
      </div>
    </main>
  );
}

