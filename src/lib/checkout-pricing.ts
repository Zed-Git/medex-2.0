// src/lib/checkout-pricing.ts
//
// --- [FUNCTIONAL BLOCK: STRIPE AMOUNT WITHOUT DB `price` COLUMN] ---
// [DODATO vs Zlatni Standard]
// Some Supabase projects have no `price` column on `patient_requests`. We still need a
// positive USD amount for Stripe. Resolution order:
// 1) Explicit `price` from the client (when present and valid).
// 2) Load `urgency_level` from the row + `site_config.pricing` (normal / priority).
// ---

import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type ResolveCheckoutPriceResult =
  | { ok: true; usd: number }
  | { ok: false; error: string };

/**
 * Returns a positive dollar amount (not cents) for Checkout Sessions.
 */
export async function resolveCheckoutPriceUsd(options: {
  requestId: string | number;
  /** When the client already knows the fee (e.g. legacy rows with a price field). */
  clientPrice?: number;
}): Promise<ResolveCheckoutPriceResult> {
  const { requestId, clientPrice } = options;

  if (
    typeof clientPrice === "number" &&
    !Number.isNaN(clientPrice) &&
    clientPrice > 0
  ) {
    return { ok: true, usd: clientPrice };
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: row, error: rowErr } = await admin
      .from("patient_requests")
      .select("urgency_level")
      .eq("id", requestId)
      .single();

    if (rowErr || !row) {
      console.error("[checkout-pricing] Row load error:", rowErr);
      return {
        ok: false,
        error:
          "Could not load this request for pricing. Please verify the report link.",
      };
    }

    const urgency = String(
      (row as { urgency_level?: string | null }).urgency_level ?? "Basic",
    );

    const { data: pricingRow, error: pcErr } = await admin
      .from("site_config")
      .select("value")
      .eq("key", "pricing")
      .single();

    if (pcErr) {
      console.error("[checkout-pricing] site_config error:", pcErr);
    }

    const pv = pricingRow?.value as
      | { normal?: string; priority?: string }
      | undefined;
    const normalStr = pv?.normal?.trim() ?? "";
    const priorityStr = pv?.priority?.trim() ?? "";
    const rateStr =
      urgency === "Extended" ? priorityStr : normalStr;
    const usd = Number.parseFloat(rateStr);

    if (!Number.isFinite(usd) || usd <= 0) {
      return {
        ok: false,
        error:
          "No valid service fee is configured for this request. Please contact Medex 2.0 support.",
      };
    }

    return { ok: true, usd };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Pricing resolution failed";
    console.error("[checkout-pricing] Exception:", e);
    return { ok: false, error: msg };
  }
}
