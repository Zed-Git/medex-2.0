'use client';

// =============================================================================
// [DODATO vs Zlatni standard] Posebne stranice za kartice "MEDICINE IN THE FUTURE".
// - Svaki članak je na /analysis/[slug]
// - [IZMENA] Ovo je READ-ONLY javna stranica: nema edit/upload opcija za pacijente.
// - Sadržaj dolazi iz `site_config` (CMS Editor) uz fallback na FEATURED_ANALYSES.
// - UI tekst je na engleskom; komentari su za developera (sr/hr).
// =============================================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FEATURED_ANALYSES } from '@/lib/featured-analyses';
import { supabase } from '@/lib/supabase';

type CmsClinicalNewsItem = {
  slug: string;
  tag: string;
  title: string;
  description: string;
  body?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
};

export default function AnalysisDetailPage() {
  const params = useParams<{ slug?: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const fallback = useMemo(
    () => FEATURED_ANALYSES.find((a) => a.slug === slug) ?? null,
    [slug],
  );

  const [cmsItem, setCmsItem] = useState<CmsClinicalNewsItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('site_config')
          .select('value')
          .eq('key', 'clinical_news')
          .single();
        if (cancelled) return;
        const v = data?.value as { items?: unknown } | undefined;
        const items = Array.isArray(v?.items) ? (v?.items as CmsClinicalNewsItem[]) : [];
        const found = items.find((it) => it?.slug === slug) ?? null;
        setCmsItem(found);
      } catch {
        setCmsItem(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const title = cmsItem?.title || fallback?.title || '';
  const tag = cmsItem?.tag || fallback?.tag || '';
  const description = cmsItem?.description || fallback?.description || '';
  const bodyParagraphs = useMemo(() => {
    const fromCms = (cmsItem?.body ?? '').trim();
    if (fromCms) {
      return fromCms.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    }
    return fallback?.body ?? [];
  }, [cmsItem?.body, fallback?.body]);
  const imageUrl = cmsItem?.imageUrl ?? null;
  const videoUrl = cmsItem?.videoUrl ?? null;

  if (!fallback && !cmsItem) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="max-w-3xl mx-auto px-4 py-14 space-y-6">
          <h1 className="text-2xl font-black tracking-tighter italic text-[#2E5481]">
            Analysis not found
          </h1>
          <p className="text-sm text-slate-700">
            The requested analysis page does not exist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[#2E5481] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1e3a5f]"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-10">
        <header className="rounded-[35px] border border-white/40 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E31E24]">
            {tag}
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-slate-900">
            {title}
          </h1>
          <p className="mt-4 text-sm text-slate-700 max-w-3xl leading-relaxed">
            {description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-[#2E5481] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1e3a5f]"
            >
              Back to home
            </Link>
            <Link
              href="/#medicine"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Back to cards
            </Link>
          </div>
        </header>

        <section className="rounded-[35px] border border-slate-100 bg-white p-8 shadow-sm space-y-6">
          <h2 className="text-xl font-black text-[#2E5481] uppercase tracking-tighter italic">
            Summary
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            {bodyParagraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {(imageUrl || videoUrl) && (
            <div className="mt-6 grid grid-cols-1 gap-6">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- remote/public URL
                <img
                  src={imageUrl}
                  alt="Clinical news image"
                  className="w-full rounded-2xl border border-slate-100 object-cover"
                />
              )}
              {videoUrl && (
                <video
                  src={videoUrl}
                  controls
                  className="w-full rounded-2xl border border-slate-100"
                />
              )}
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">
            Educational content only. This is not medical advice.
          </p>
        </section>
      </div>
    </main>
  );
}

