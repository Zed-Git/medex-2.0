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

/** Jednokratno upozorenje da pk_* i sk_* budu u istom Stripe režimu (test vs live). */
let publishableSecretAlignmentWarned = false;

type StripeKeyMode = "live" | "test" | "unknown";

function getKeyMode(key: string | undefined, kind: "pk" | "sk"): StripeKeyMode {
  const v = key?.trim() ?? "";
  if (!v) return "unknown";
  if (v.startsWith(`${kind}_live_`)) return "live";
  if (v.startsWith(`${kind}_test_`)) return "test";
  return "unknown";
}

function isStrictLiveModeExpected(): boolean {
  if (process.env.STRIPE_ENFORCE_LIVE_MODE?.trim() === "true") {
    return true;
  }
  return (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV === "production"
  );
}

export function getStripeModeDiagnostics() {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  const effectiveSk = peekEffectiveStripeSecretPrefix();
  const prodWh = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const testWh = process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim();
  const strictLiveExpected = isStrictLiveModeExpected();
  const publishableMode = getKeyMode(pk, "pk");
  const secretMode = getKeyMode(effectiveSk ?? undefined, "sk");
  const keyModesAligned =
    publishableMode !== "unknown" &&
    secretMode !== "unknown" &&
    publishableMode === secretMode;

  const issues: string[] = [];
  if (!pk) issues.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing.");
  if (!effectiveSk) issues.push("Missing effective Stripe secret key.");
  if (!keyModesAligned) issues.push("Publishable and secret key modes differ.");
  if (strictLiveExpected && publishableMode !== "live") {
    issues.push("Strict live mode expects pk_live_* in production.");
  }
  if (strictLiveExpected && secretMode !== "live") {
    issues.push("Strict live mode expects sk_live_* in production.");
  }
  if (strictLiveExpected && !prodWh) {
    issues.push("Strict live mode requires STRIPE_WEBHOOK_SECRET.");
  }
  if (!strictLiveExpected && !prodWh && !testWh) {
    issues.push("No webhook secret configured.");
  }

  return {
    environment: process.env.NODE_ENV ?? "unknown",
    vercelEnv: process.env.VERCEL_ENV ?? null,
    strictLiveExpected,
    publishableMode,
    secretMode,
    keyModesAligned,
    webhookConfigured: Boolean(prodWh || testWh),
    webhookProductionConfigured: Boolean(prodWh),
    ok: issues.length === 0,
    issues,
  };
}

/**
 * [DODATO — note.txt / provera .env] Isti “efektivni” izbor kao resolveStripeSecretKey, ali bez bacanja greške.
 * Koristi se samo za dijagnostiku usklađenosti sa NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
 */
function peekEffectiveStripeSecretPrefix(): string | null {
  const isDev = process.env.NODE_ENV === "development";
  const testKey = process.env.STRIPE_TEST_SECRET_KEY?.trim();
  const primaryKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (isDev && testKey) return testKey;
  if (primaryKey) return primaryKey;
  if (testKey) return testKey;
  return null;
}

/**
 * [DODATO — note.txt] Ako je pk_test uz sk_live (ili obrnuto), plaćanje / Checkout sesije pucaju ili ponašanje je nepredvidivo.
 * Lokalno: sa STRIPE_TEST_SECRET_KEY obično si OK i sa pk_test; problem je production build ili dev bez test tajnog ključa.
 */
function warnIfStripePublishableAndSecretModesDiverge(): void {
  if (publishableSecretAlignmentWarned) return;
  publishableSecretAlignmentWarned = true;

  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
  const sk = peekEffectiveStripeSecretPrefix();
  if (!pk || !sk) return;

  const pubTest = pk.startsWith("pk_test_");
  const pubLive = pk.startsWith("pk_live_");
  const secTest = sk.startsWith("sk_test_");
  const secLive = sk.startsWith("sk_live_");

  if (pubTest && secLive) {
    console.warn(
      "[stripe-server] Neklapanje Stripe režima: publishable je pk_test_* a efektivni tajni ključ je sk_live_* (u produkciji uvek sk_live). " +
        "Moraš staviti NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_* za produkciju, ili za lokal test koristi STRIPE_TEST_SECRET_KEY=sk_test_* i pk_test_* zajedno. Vidi .env.example.",
    );
  }
  if (pubLive && secTest) {
    console.warn(
      "[stripe-server] Neklapanje Stripe režima: publishable je pk_live_* a efektivni tajni ključ je sk_test_*. " +
        "Koristi oba test ili oba live. Vidi .env.example.",
    );
  }
}

/**
 * Bira tajni ključ: u development-u, ako postoji STRIPE_TEST_SECRET_KEY, koristi ga.
 * Inače STRIPE_SECRET_KEY (obično live u produkciji).
 */
export function resolveStripeSecretKey(): string {
  const isDev = process.env.NODE_ENV === "development";
  const testKey = process.env.STRIPE_TEST_SECRET_KEY?.trim();
  const primaryKey = process.env.STRIPE_SECRET_KEY?.trim();
  const strictLive = isStrictLiveModeExpected();

  if (strictLive) {
    if (!primaryKey?.startsWith("sk_live_")) {
      throw new Error(
        "Stripe strict live mode: STRIPE_SECRET_KEY must be sk_live_* in production.",
      );
    }
    return primaryKey;
  }

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
  const strictLive = isStrictLiveModeExpected();

  if (strictLive) {
    if (!prodWh) {
      throw new Error(
        "Stripe strict live mode: STRIPE_WEBHOOK_SECRET is required in production.",
      );
    }
    return prodWh;
  }

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
    warnIfStripePublishableAndSecretModesDiverge();
    const diagnostics = getStripeModeDiagnostics();
    if (!diagnostics.ok && diagnostics.strictLiveExpected) {
      throw new Error(
        `Stripe configuration invalid: ${diagnostics.issues.join(" ")}`,
      );
    }
    cachedStripe = new Stripe(resolveStripeSecretKey(), {
      apiVersion: "2026-02-25.clover",
    });
  }
  return cachedStripe;
}
