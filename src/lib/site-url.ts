/**
 * [DODATO — note.txt SEO] Jedan izvor istine za kanonski URL sajta.
 * Zašto: robots.ts, sitemap.ts, metadata i JSON-LD moraju da koriste ISTU bazu,
 * inače Google vidi drugačiji canonical od onog u sitemap-i (loše za SEO).
 *
 * [note.txt — ENV] OVO NIJE isto što i NEXT_PUBLIC_BASE_URL / NEXT_PUBLIC_APP_URL:
 * - NEXT_PUBLIC_SITE_URL → “javna adresa brenda” u smislu SEO (Open Graph, sitemap, canonical u meta).
 * - getNextAppPublicUrl() u public-app-url.ts → adresa same Next aplikacije (Stripe return, linkovi u mejlu).
 *
 * Na Vercelu postavi NEXT_PUBLIC_SITE_URL = pun HTTPS URL bez završnog / (npr. https://www.medexnews.com).
 *
 * [IZMENA — note.txt] Ako je u .env.local pogrešan tekst (nije URL), `new URL()` u layout-u je bacao build.
 * Zato validacija + fallback na podrazumevani domen + jedno upozorenje u konzoli.
 */
const SITE_URL_FALLBACK = 'https://www.medexnews.com';

let invalidSiteUrlWarned = false;

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? '';
  if (!raw) return SITE_URL_FALLBACK;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const u = new URL(withProtocol);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') {
      throw new Error('unsupported protocol');
    }
    return u.origin;
  } catch {
    if (!invalidSiteUrlWarned) {
      invalidSiteUrlWarned = true;
      console.warn(
        `[site-url] NEXT_PUBLIC_SITE_URL nije validan HTTP(S) URL — koristim fallback ${SITE_URL_FALLBACK}. Popuni .env.local ispravnom vrednošću.`,
      );
    }
    return SITE_URL_FALLBACK;
  }
}
