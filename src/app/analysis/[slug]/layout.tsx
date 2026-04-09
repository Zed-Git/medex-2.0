/**
 * [DODATO — note.txt SEO] Server layout samo zbog generateMetadata — stranica je i dalje 'use client'.
 * Zašto: pretraživači ne izvršavaju JS kao browser; treba im <title> i meta description sa servera.
 * Fallback tekstovi iz FEATURED_ANALYSES; CMS izmene na klijentu ne menjaju ove meta (prihvatljivo za SEO).
 */
import type { Metadata } from 'next';
import { FEATURED_ANALYSES } from '@/lib/featured-analyses';
import { getSiteUrl } from '@/lib/site-url';

const GENERIC_DESCRIPTION =
  'Expert-reviewed cardiology and medicine analysis — educational context, not medical advice.';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const match = FEATURED_ANALYSES.find((a) => a.slug === slug);
  const title = match?.title ?? 'Clinical analysis';
  const description = match?.description ?? GENERIC_DESCRIPTION;
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/analysis/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'MedExNews',
      locale: 'en_US',
      type: 'article',
      images: [{ url: '/logo.webp', alt: 'MedExNews' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function AnalysisSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
