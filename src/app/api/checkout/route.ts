/* 
  FAZA: Napredna Automatizacija - Zadatak 3 (Stripe)
  STATUS: Golden Standard 3.1.1 (0 Errors - Sterilized Code)
  LANGUAGE: English
  ---------------------------------------------------------
  ZLATNI STANDARD IZMENE:
  1. FIXED: Removed 'as any' from apiVersion.
  2. FIXED: Used 'Stripe.StripeConfig["apiVersion"]' to precisely define the type.
  3. CLEAN: 0 Problems in VSC.
*/

import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// --- [FUNCTIONAL BLOCK: STRIPE INITIALIZATION] ---
// Umesto 'any', koristimo interni tip iz Stripe biblioteke da zadovoljimo TypeScript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
});

export async function POST(request: Request) {
  try {
    // --- [FUNCTIONAL BLOCK: DATA EXTRACTION] ---
    const { requestId, patientName, price } = await request.json();

    console.log(`Financial Transaction: Initializing session for Patient: ${patientName}`);

    // --- [FUNCTIONAL BLOCK: CHECKOUT SESSION CREATION] ---
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `PhD Cardiology Analysis Report`,
              description: `Clinical expert review for ${patientName}`,
            },
            unit_amount: Math.round(price * 100), // Convert dollars to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?id=${requestId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin-zdravko`,
      metadata: { 
        requestId: requestId.toString(),
        category: 'Cardiology_PhD_Report'
      },
    });

    // Return the session ID to the client
    return NextResponse.json({ id: session.id });
    
  } catch (err) {
    // --- [FUNCTIONAL BLOCK: ERROR HANDLING] ---
    const errorMsg = err instanceof Error ? err.message : "Financial System Offline";
    console.error("Stripe Engine Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
