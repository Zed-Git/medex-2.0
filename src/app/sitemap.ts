/**
 * [DODATO — note.txt SEO] XML sitemap na /sitemap.xml — lista URL-ova koje želimo u indeksu.
 * Statične rute ručno; /analysis/* iz FEATURED_ANALYSES (fallback slugovi; CMS može imati iste slugove).
 */
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { FEATURED_ANALYSES } from '@/lib/featured-analyses';

const STATIC_PATHS: string[] = [
  '/',
  '/about',
  '/contact',
  '/notice-to-readers',
  '/request-analysis',
  '/terms-and-conditions',
  '/terms-of-payment',
  '/user-agreement',
];

/** /pay i /success imaju noindex — ne ulaze u sitemap (konzistentno sa meta robots). */

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));

  const analysisEntries: MetadataRoute.Sitemap = FEATURED_ANALYSES.map((a) => ({
    url: `${base}/analysis/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...analysisEntries];
}
