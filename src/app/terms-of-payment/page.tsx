'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TermsOfPaymentPage() {
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
        const v = data?.value as { termsOfPayment?: unknown } | undefined;
        setBody(typeof v?.termsOfPayment === 'string' ? v.termsOfPayment : null);
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
            Terms of payment
          </h1>
          <p className="text-sm text-slate-600">
            This page explains how fees are calculated and when payment is
            required.
          </p>
        </header>

        <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-md p-6 space-y-4 shadow-sm">
          {body?.trim() ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {body}
            </p>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-900">When you pay</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                You do not pay at the time of submission. Payment is requested only
                after your preview report is ready. The full PDF report unlocks
                after successful payment confirmation.
              </p>

              <h2 className="text-lg font-bold text-slate-900">Pricing</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                Fees vary based on the selected service level. The final amount is
                shown in the secure Stripe checkout.
              </p>

              <h2 className="text-lg font-bold text-slate-900">Refunds</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                If you have questions regarding charges or payment issues, please
                contact support. Refund policies may depend on service status and
                applicable regulations.
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
            href="/notice-to-readers"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Notice to readers
          </Link>
        </div>
      </div>
    </main>
  );
}

