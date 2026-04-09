/**
 * [DODATO — note.txt SEO] Strukturirani podaci (JSON-LD) za Organization + WebSite.
 * Objašnjenje: Google/Rich Results koriste schema.org da “razumeju” brend i domen.
 * Tekst u JSON-u mora biti na engleskom (sadržaj za korisnike sajta).
 */
import { getSiteUrl } from '@/lib/site-url';

export function SeoJsonLd() {
  const siteUrl = getSiteUrl();
  const payload = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'MedExNews',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/logo.webp`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'MedExNews',
        description:
          'Science and cardiology analysis — expert-reviewed context on evidence-based medicine, cardiology, and AI in healthcare.',
        inLanguage: 'en-US',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
