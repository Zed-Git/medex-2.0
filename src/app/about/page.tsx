'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AboutPage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [body, setBody] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('site_config')
          .select('value')
          .eq('key', 'about_page')
          .single();
        if (cancelled) return;
        const v = data?.value as { imageUrl?: unknown; body?: unknown } | undefined;
        setImageUrl(typeof v?.imageUrl === 'string' ? v.imageUrl : null);
        setBody(typeof v?.body === 'string' ? v.body : null);
      } catch {
        /* keep fallbacks */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E31E24] italic">
            Company
          </p>
          <h1 className="text-3xl font-black tracking-tighter italic text-[#2E5481]">
            About MedExNews AI
          </h1>
          <p className="text-sm text-slate-600">
            MedExNews provides educational medical content and expert review
            services focused on evidence-based personalized medicine.
          </p>
        </header>

        <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-md p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">What we do</h2>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- CMS public URL
            <img
              src={imageUrl}
              alt="About MedExNews"
              // [IZMENA vs prethodni izgled] object-contain + veća visina: slika se vidi POTPUNO (bez sečenja).
              className="w-full max-h-112 object-contain rounded-2xl border border-slate-100 bg-white"
            />
          )}
          {/* [IZMENA vs prethodni izgled] Očuvaj format iz CMS-a (paragrafi/novi redovi) sa whitespace-pre-wrap. */}
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {(body ?? '').trim()
              ? body
              : `We help patients and readers better understand medical topics by producing structured expert reviews and clear summaries. Our goal is to improve understanding — not to replace medical care.`}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            For clinical decisions, diagnosis, and treatment planning, always
            consult a qualified physician.
          </p>
        </section>

        <section className="rounded-2xl border bg-white p-6 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Important notice</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            MedExNews does not provide medical advice, diagnosis, or treatment.
            If you believe you may have a medical emergency, contact your local
            emergency services immediately.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[#2E5481] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1e3a5f]"
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}

