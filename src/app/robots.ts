/**
 * [DODATO — note.txt SEO] robots.txt generisan od strane Next-a na /robots.txt
 * Objašnjenje za početnika: pretraživači prvo provere šta SME da indeksiraju.
 * /admin-zdravko i /api/* ne treba u Google rezultatima.
 */
import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin-zdravko', '/admin-zdravko/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
