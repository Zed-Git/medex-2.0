// src/app/api/checkout/route.ts

// =============================================================================
// [CHANGE vs earlier checkout] Golden Standard + Stripe Checkout integration
// =============================================================================
// - Stripe apiVersion aligned with `src/app/api/webhook/route.ts` (same SDK).
// - success_url / cancel_url use getNextAppPublicUrl() (Next.js app), not WordPress
//   NEXT_PUBLIC_SITE_URL. Set NEXT_PUBLIC_APP_URL in production when applicable.
// - Resend logic moved to `sendCheckoutSessionInitEmails` in `@/lib/email-service`
//   (single Resend configuration path). Checkout still succeeds if e-mail fails.
// =============================================================================

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { NextResponse } from "next/server";
import { sendCheckoutSessionInitEmails } from "@/lib/email-service";
import { getNextAppPublicUrl } from "@/lib/public-app-url";
import { resolveCheckoutPriceUsd } from "@/lib/checkout-pricing";
import { getStripe } from "@/lib/stripe-server";

// --- [FUNCTIONAL BLOCK: STRIPE] ---
// [DODATO vs Zlatni Standard] Kreiranje sesije ide preko getStripe() iz @/lib/stripe-server
// da se u development-u može koristiti STRIPE_TEST_SECRET_KEY (kartica 4242).

// --- [FUNCTIONAL BLOCK: REQUEST BODY TYPE] ---
interface CheckoutRequestBody {
  requestId?: string | number;
  patientName?: string;
  price?: number;
  patientEmail?: string | null;
}

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(request: Request) {
  try {
    const bodyUnknown: unknown = await request.json();
    if (typeof bodyUnknown !== "object" || bodyUnknown === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = bodyUnknown as CheckoutRequestBody;

    const requestId = body.requestId;
    const patientName = body.patientName ?? "";
    const clientPrice = body.price;
    const patientEmail = body.patientEmail ?? null;

    console.log(
      `[checkout] Creating Stripe session for request ${String(requestId)} (${patientName})`,
    );

    if (requestId === undefined || requestId === null || String(requestId).trim() === "") {
      console.error("[checkout] Missing requestId.");
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    if (!patientName.trim()) {
      console.error("[checkout] Missing patientName.");
      return NextResponse.json({ error: "Missing patientName" }, { status: 400 });
    }

    const resolved = await resolveCheckoutPriceUsd({
      requestId,
      clientPrice:
        typeof clientPrice === "number" && !Number.isNaN(clientPrice)
          ? clientPrice
          : undefined,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    const price = resolved.usd;

    const base = getNextAppPublicUrl();
    const idParam = encodeURIComponent(String(requestId));

    // --- [FUNCTIONAL BLOCK: STRIPE CHECKOUT SESSION] ---
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      ...(typeof patientEmail === "string" && patientEmail.trim()
        ? { customer_email: patientEmail.trim() }
        : {}),
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PhD Cardiology Analysis Report",
              description: `Clinical expert review — ${patientName.trim()}`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${base}/success?id=${idParam}`,
      cancel_url: `${base}/success?id=${idParam}`,
      metadata: {
        requestId: String(requestId),
        category: "Cardiology_PhD_Report",
      },
    });

    if (!session.url) {
      console.error("[checkout] Stripe returned no session.url");
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 },
      );
    }

    // --- [FUNCTIONAL BLOCK: OPTIONAL E-MAILS (NON-BLOCKING)] ---
    try {
      await sendCheckoutSessionInitEmails({
        patientName: patientName.trim(),
        requestId,
        priceUsd: price,
        patientEmail,
        stripeSessionId: session.id,
      });
    } catch (emailErr: unknown) {
      console.error("[checkout] Checkout notification e-mail error (non-fatal):", emailErr);
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[checkout] Critical error:", err);
      return NextResponse.json(
        { error: "Stripe checkout error", details: err.message },
        { status: 500 },
      );
    }
    console.error("[checkout] Critical error (non-Error):", err);
    return NextResponse.json(
      { error: "Stripe checkout error", details: "Unknown error" },
      { status: 500 },
    );
  }
}
