// src/lib/stripe-server.ts
//
// --- [BLOK: Stripe na serveru — test vs produkcija] ---
// [DODATO vs Zlatni Standard]
// Zašto: Test kartica 4242 radi SAMO sa Stripe *test* tajnim ključem (počinje sa sk_test_).
// Ako u .env.local stoji samo sk_live_..., Stripe će odbiti test kartice.
//
// Preporuka za lokalno testiranje:
// 1) U Stripe Dashboard uključi "Test mode" i kopiraj sk_test_... u STRIPE_TEST_SECRET_KEY
//    (ili privremeno zameni STRIPE_SECRET_KEY sa sk_test_... dok testiraš).
// 2) Webhook za lokal: terminal → npx stripe listen --forward-to localhost:3000/api/webhook
//    Stripe CLI ispiše "whsec_..." — stavi u STRIPE_WEBHOOK_SECRET_TEST.
// 3) Produkcija: koristi STRIPE_SECRET_KEY (sk_live_...) i STRIPE_WEBHOOK_SECRET iz Dashboard-a.
//
// Sajt (UI) ostaje na engleskom; komentari u kodu su za tebe na srpsko-hrvatskom.
// ---

import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

/**
 * Bira tajni ključ: u development-u, ako postoji STRIPE_TEST_SECRET_KEY, koristi ga.
 * Inače STRIPE_SECRET_KEY (obično live u produkciji).
 */
export function resolveStripeSecretKey(): string {
  const isDev = process.env.NODE_ENV === "development";
  const testKey = process.env.STRIPE_TEST_SECRET_KEY?.trim();
  const primaryKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (isDev && primaryKey?.startsWith("sk_live") && !testKey) {
    console.warn(
      "[stripe-server] U development-u koristiš LIVE ključ (sk_live_) bez STRIPE_TEST_SECRET_KEY — test kartica 4242 neće raditi. Dodaj STRIPE_TEST_SECRET_KEY=sk_test_... iz Stripe Dashboard (Test mode).",
    );
  }

  if (isDev && testKey) {
    return testKey;
  }
  if (primaryKey) {
    return primaryKey;
  }
  if (testKey) {
    return testKey;
  }

  throw new Error(
    "Nedostaje STRIPE_SECRET_KEY ili STRIPE_TEST_SECRET_KEY u okruženju.",
  );
}

/**
 * Potpis webhook događaja. U development-u možeš koristiti tajnu sa `stripe listen` (TEST).
 */
export function resolveStripeWebhookSecret(): string {
  const isDev = process.env.NODE_ENV === "development";
  const testWh = process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim();
  const prodWh = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (isDev && testWh) {
    return testWh;
  }
  if (isDev && !testWh) {
    console.warn(
      "[stripe-server] STRIPE_WEBHOOK_SECRET_TEST je prazan — lokalni događaji iz `stripe listen` neće proći verifikaciju potpisa dok ne zalepiš whsec_... iz CLI u .env.local.",
    );
  }
  if (prodWh) {
    return prodWh;
  }
  if (testWh) {
    return testWh;
  }

  throw new Error(
    "Nedostaje STRIPE_WEBHOOK_SECRET (ili STRIPE_WEBHOOK_SECRET_TEST u development-u).",
  );
}

/** Jedna Stripe instanca po procesu (isti apiVersion kao webhook). */
export function getStripe(): Stripe {
  if (!cachedStripe) {
    cachedStripe = new Stripe(resolveStripeSecretKey(), {
      apiVersion: "2026-02-25.clover",
    });
  }
  return cachedStripe;
}
