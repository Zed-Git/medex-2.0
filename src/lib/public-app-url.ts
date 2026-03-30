// src/lib/public-app-url.ts
//
// --- [FUNCTIONAL BLOCK: NEXT.JS APP CANONICAL URL] ---
// [DODATO vs Zlatni Standard]
// Problem: NEXT_PUBLIC_SITE_URL often points at the legacy WordPress site (e.g.
// https://www.medexnews.com). Patient e-mails and Stripe redirects must open the
// Next.js app (Vercel / custom domain), not WordPress.
//
// Set in .env.local (production):
//   NEXT_PUBLIC_APP_URL=https://your-next-app.vercel.app
// Fallbacks: NEXT_PUBLIC_BASE_URL, then VERCEL_URL (preview/production), then localhost.
// We intentionally avoid defaulting to NEXT_PUBLIC_SITE_URL for app links.
// ---

/**
 * Public base URL of this Next.js application (no trailing slash).
 * Use for: Stripe success/cancel URLs, patient e-mail CTA targets.
 */
export function getNextAppPublicUrl(): string {
  const a = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (a) return a.replace(/\/$/, "");

  const b = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (b) return b.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/\/$/, "");
    return host.startsWith("http") ? host : `https://${host}`;
  }

  return "http://localhost:3000";
}
