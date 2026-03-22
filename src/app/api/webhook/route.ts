// src/app/api/webhook/route.ts

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// --- [FUNCTIONAL BLOCK: STRIPE INITIALIZATION] ---
// [FIXED - Added explicit type cast for apiVersion]
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
});

// --- [FUNCTIONAL BLOCK: SUPABASE INITIALIZATION] ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(req: Request) {
  // --- [FIXED - headers() MUST be awaited] ---
  const headerList = await headers(); // [ADDED]
  const signature = headerList.get('stripe-signature') as string; // [CHANGED]

  const body = await req.text();

  let event: Stripe.Event;

  try {
    // --- [FUNCTIONAL BLOCK: STRIPE SIGNATURE VERIFICATION] ---
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    // --- [FIXED - Replaced any → unknown + safe narrowing] ---
    if (err instanceof Error) {
      console.error(`❌ Webhook Error: ${err.message}`);
      return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.error('❌ Webhook Error (non-Error object):', err);
    return new NextResponse('Webhook Error: Unknown error', { status: 400 });
  }

  // --- [FUNCTIONAL BLOCK: PAYMENT SUCCESS HANDLING] ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const requestId = session.metadata?.requestId;

    if (requestId) {
      console.log(`✅ Payment received for request: ${requestId}`);

      // --- [FUNCTIONAL BLOCK: DATABASE UPDATE] ---
      const { error } = await supabase
        .from('patient_requests')
        .update({
          status: 'paid',
          payment_intent_id: session.payment_intent as string,
        })
        .eq('id', requestId);

      if (error) {
        console.error('❌ Database update error:', error);
        return new NextResponse('DB Error', { status: 500 });
      }
    }
  }

  // --- [FUNCTIONAL BLOCK: SUCCESS RESPONSE] ---
  return new NextResponse('Success', { status: 200 });
}

