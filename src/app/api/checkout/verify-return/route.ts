// src/app/api/checkout/verify-return/route.ts
//
// [DODATO vs Zlatni standard] Potvrda plaćanja kada korisnik stigne sa Stripe Embedded Checkout-a
// (query: session_id). Koristi isti fulfillment kao webhook — rešava slučaj kada webhook nije stigao
// (npr. lokalno bez `stripe listen` ili privremeni propust u mreži).
//
// [KOREKCIJA 2026 — brzina] PDF + upload + mejl traju ~10–15s — NE čekamo to u HTTP odgovoru.
// Odmah vraćamo 200, fulfillment ide u pozadini; /success i dalje poll-uje Supabase dok se red ne ažurira.

import { after, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe-server";
import {
  fulfillCheckoutSessionCompleted,
  isStripeCheckoutSessionPaid,
} from "@/lib/fulfill-checkout-session";

interface Body {
  sessionId?: string;
  requestId?: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    const raw: unknown = await request.json();
    body = typeof raw === "object" && raw !== null ? (raw as Body) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  const requestId = body.requestId?.trim();

  if (!sessionId || !requestId) {
    return NextResponse.json(
      { error: "Missing sessionId or requestId" },
      { status: 400 },
    );
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (String(session.metadata?.requestId ?? "") !== String(requestId)) {
      return NextResponse.json(
        { error: "Session does not match this request" },
        { status: 403 },
      );
    }

    if (!isStripeCheckoutSessionPaid(session)) {
      return NextResponse.json(
        {
          error: `Payment not finalized yet (payment_status=${session.payment_status ?? "unknown"})`,
        },
        { status: 409 },
      );
    }

    // `after()` = posao posle slanja odgovora (pouzdanije na Vercel serverless nego gol `void`).
    after(() =>
      fulfillCheckoutSessionCompleted(session).catch((err: unknown) => {
        console.error("[verify-return] After-task fulfill failed:", err);
      }),
    );

    return NextResponse.json({
      ok: true,
      processing: true,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    console.error("[verify-return]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
