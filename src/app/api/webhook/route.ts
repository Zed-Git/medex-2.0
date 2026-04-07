// src/app/api/webhook/route.ts

// =============================================================================
// CHANGE VS PREVIOUS GOLDEN STANDARD (E-MAIL PORTION)
// =============================================================================
// Before: After uploading the PDF, the webhook called `fetch(BASE_URL + '/api/send-email')`.
// Same reliability issue as `request-analysis` when BASE_URL was wrong or self-calls failed.
// After: `sendFinalPdfReportEmails` from `@/lib/email-service` sends via Resend in-process.
// Stripe `headers()` usage remains `await headers()` for Next.js 15+ dynamic API compliance.
// =============================================================================

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripe, resolveStripeWebhookSecret } from '@/lib/stripe-server';
import { fulfillCheckoutSessionCompleted } from '@/lib/fulfill-checkout-session';

// --- [FUNCTIONAL BLOCK: STRIPE] ---
// [DODATO vs Zlatni Standard] getStripe() + resolveStripeWebhookSecret() omogućavaju
// test mod (STRIPE_TEST_SECRET_KEY + STRIPE_WEBHOOK_SECRET_TEST sa `stripe listen`).
// [IZMENA 2026] Posao nakon plaćanja je u `@/lib/fulfill-checkout-session` (deljeno sa `/api/checkout/verify-return`).

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(req: Request) {
  // --- [SUB-BLOCK: HEADERS + SIGNATURE] ---
  const headerList = await headers();
  const signature = headerList.get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      resolveStripeWebhookSecret(),
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ Stripe signature error:', message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  // --- [SUB-BLOCK: HANDLE PAYMENT SUCCESS] ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const result = await fulfillCheckoutSessionCompleted(session);
    if (!result.ok) {
      console.error('❌ fulfillCheckoutSessionCompleted:', result.error);
      return new NextResponse(result.error, { status: 400 });
    }
  }

  return new NextResponse('Success', { status: 200 });
}
