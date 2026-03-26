// src/app/api/checkout/route.ts

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
// [ZLATNI STANDARD - CORE IMPORTS]
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// [NEW BLOCK - EMAIL NOTIFICATION IMPORT]
// [ADDED vs "Zlatni Standard": Resend for email notifications]
import { Resend } from 'resend';

// --- [FUNCTIONAL BLOCK: STRIPE INITIALIZATION] ---
// [ZLATNI STANDARD - UNCHANGED]
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as Stripe.StripeConfig['apiVersion'],
});

// --- [FUNCTIONAL BLOCK: RESEND INITIALIZATION] ---
// [NEW BLOCK - EMAIL NOTIFICATION INIT]
// Initialize Resend client for sending emails
const resend = new Resend(process.env.RESEND_API_KEY!);

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(request: Request) {
  try {
    // --- [FUNCTIONAL BLOCK: DATA EXTRACTION] ---
    // [ZLATNI STANDARD - EXTENDED]
    // We add `patientEmail` so we can notify the patient as well.
    const body = await request.json();

    const requestId: number | string = body.requestId;
    const patientName: string = body.patientName;
    const price: number = body.price;
    const patientEmail: string | null = body.patientEmail ?? null;

    console.log(
      `Financial Transaction: Initializing session for Patient: ${patientName}`
    );

    // --- [FUNCTIONAL BLOCK: BASIC VALIDATION] ---
    // [NEW BLOCK - SIMPLE SAFETY CHECKS]
    if (!requestId) {
      console.error('Missing requestId in checkout payload.');
      return NextResponse.json(
        { error: 'Missing requestId' },
        { status: 400 }
      );
    }

    if (!patientName) {
      console.error('Missing patientName in checkout payload.');
      return NextResponse.json(
        { error: 'Missing patientName' },
        { status: 400 }
      );
    }

    if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
      console.error('Invalid price in checkout payload:', price);
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      );
    }

    // --- [FUNCTIONAL BLOCK: CHECKOUT SESSION CREATION] ---
    // [ZLATNI STANDARD - CORE LOGIC KEPT]
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'PhD Cardiology Analysis Report',
              description: `Clinical expert review for ${patientName}`,
            },
            // Convert dollars to cents
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?id=${requestId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin-zdravko`,
      metadata: {
        requestId: String(requestId),
        category: 'Cardiology_PhD_Report',
      },
    });

    // --- [FUNCTIONAL BLOCK: EMAIL NOTIFICATIONS] ---
    // [NEW BLOCK - EMAIL NOTIFICATION LOGIC]
    // 1) Admin notification (you)
    // 2) Patient confirmation (if patientEmail is provided)
    // IMPORTANT: If email fails, Stripe flow MUST continue.
    try {
      const adminEmail = 'mdzdravko@gmail.com';
      const fromAddress =
        process.env.RESEND_FROM || 'Medex 2.0 <noreply@medexnews.com>';

      const emailPromises: Promise<unknown>[] = [];

      // --- [SUB-BLOCK: ADMIN NOTIFICATION EMAIL] ---
      emailPromises.push(
        resend.emails.send({
          from: fromAddress,
          to: adminEmail,
          subject: 'New Medex 2.0 payment session initialized',
          html: `
            <h2>New Payment Session Created</h2>
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Request ID:</strong> ${requestId}</p>
            <p><strong>Price:</strong> $${price}</p>
            <p><strong>Stripe Session ID:</strong> ${session.id}</p>
            <p>You can review this request in your Medex 2.0 admin panel.</p>
          `,
        })
      );

      // --- [SUB-BLOCK: PATIENT CONFIRMATION EMAIL] ---
      if (patientEmail) {
        emailPromises.push(
          resend.emails.send({
            from: fromAddress,
            to: patientEmail,
            subject: 'Your Medex 2.0 payment is being processed',
            html: `
              <h2>Thank you for using Medex 2.0</h2>
              <p>Dear ${patientName},</p>
              <p>Your payment session has been initialized successfully.</p>
              <p><strong>Request ID:</strong> ${requestId}</p>
              <p><strong>Service:</strong> PhD Cardiology Analysis Report</p>
              <p><strong>Amount:</strong> $${price}</p>
              <p>You will be redirected to a secure Stripe checkout page to complete your payment.</p>
              <p>After successful payment, your final report will be available for secure download.</p>
              <p>Best regards,<br/>Medex 2.0 Team</p>
            `,
          })
        );
      }

      await Promise.all(emailPromises);
      console.log('Email notifications sent successfully.');
    } catch (emailError) {
      // [NEW BLOCK - EMAIL ERROR HANDLING]
      // If email fails, we only log – we DO NOT break Stripe flow.
      console.error('Email notification system error:', emailError);
    }

    // --- [FUNCTIONAL BLOCK: RESPONSE TO CLIENT] ---
    // [ZLATNI STANDARD - UNCHANGED]
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    // --- [FUNCTIONAL BLOCK: GLOBAL ERROR HANDLING] ---
    // [IMPROVED vs any → unknown + safe narrowing]
    if (err instanceof Error) {
      console.error('Checkout critical error:', err);
      return NextResponse.json(
        { error: 'Stripe checkout error', details: err.message },
        { status: 500 }
      );
    }

    console.error('Checkout critical error (non-Error):', err);
    return NextResponse.json(
      { error: 'Stripe checkout error', details: 'Unknown error' },
      { status: 500 }
    );
  }
}














