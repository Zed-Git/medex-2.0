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
import { createClient } from '@supabase/supabase-js';
import { getStripe, resolveStripeWebhookSecret } from '@/lib/stripe-server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import MedicalReportPDF, {
  type MedicalReportPDFProps,
} from '@/components/MedicalReportPDF';
import { sendFinalPdfReportEmails } from '@/lib/email-service';

// --- [FUNCTIONAL BLOCK: TYPES] ---
interface PatientRequestRow {
  id: number;
  patient_name: string | null;
  patient_email: string | null;
  medical_note: string | null;
  created_at: string;
  analysis: string | null;
  recommendation: string | null;
  references: string | null;
  status?: string | null;
  payment_intent_id?: string | null;
  analysis_pdf_url?: string | null;
}

// --- [FUNCTIONAL BLOCK: STRIPE] ---
// [DODATO vs Zlatni Standard] getStripe() + resolveStripeWebhookSecret() omogućavaju
// test mod (STRIPE_TEST_SECRET_KEY + STRIPE_WEBHOOK_SECRET_TEST sa `stripe listen`).

// --- [FUNCTIONAL BLOCK: SUPABASE INIT] ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// [DODATO / ISPRAVKA vs raniji webhook] Finalni PDF mora ići u isti Storage bucket kao pacijentovi fajlovi
// (`medical-files` u `actions.ts`). Bucket `reports` često ne postoji u Supabase projektu — upload je
// ćutao (uploadError), `finalPdfUrl` ostajao null i kolona `analysis_pdf_url` uvek NULL uprkos uspešnom plaćanju.
const FINAL_PDF_STORAGE_BUCKET = "medical-files";

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
    const requestId = session.metadata?.requestId;

    if (!requestId) {
      console.error('❌ Missing requestId in metadata.');
      return new NextResponse('Missing requestId', { status: 400 });
    }

    const numericRequestId = Number(requestId);
    if (!Number.isFinite(numericRequestId)) {
      console.error('❌ Invalid requestId in metadata:', requestId);
      return new NextResponse('Invalid requestId', { status: 400 });
    }

    console.log(`💳 Payment confirmed for request ${numericRequestId}`);

    // --- [SUB-BLOCK: FETCH PATIENT ROW] ---
    const { data: patientRow, error: fetchError } = await supabase
      .from('patient_requests')
      .select('*')
      .eq('id', numericRequestId)
      .single();

    if (fetchError || !patientRow) {
      console.error('❌ DB fetch error:', fetchError);
      return new NextResponse('DB error', { status: 500 });
    }

    const typedRow = patientRow as PatientRequestRow;

    // --- [SUB-BLOCK: GENERATE FINAL PDF] ---
    let finalPdfUrl: string | null = null;

    try {
      const pdfProps: MedicalReportPDFProps = {
        patient: {
          patient_name: typedRow.patient_name ?? '',
          created_at: typedRow.created_at ?? '',
          medical_note: typedRow.medical_note ?? '',
        },
        analysis: typedRow.analysis ?? 'No analysis provided.',
        recommendation: typedRow.recommendation ?? 'No recommendations provided.',
        references: typedRow.references ?? 'No references provided.',
        mode: 'final',
      };

      const finalDocument = React.createElement(MedicalReportPDF, pdfProps);

      const pdfBuffer = await renderToBuffer(
        finalDocument as Parameters<typeof renderToBuffer>[0],
      );

      // Prefiks `final-` + id da ne sudaramo sa slučajnim imenima poput `1730....pdf` sa forme.
      const finalPath = `final-report-request-${numericRequestId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from(FINAL_PDF_STORAGE_BUCKET)
        .upload(finalPath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error(
          "❌ Final PDF storage upload failed (proveri bucket i Storage policies):",
          uploadError,
        );
      } else {
        const { data: publicUrlData } = supabase.storage
          .from(FINAL_PDF_STORAGE_BUCKET)
          .getPublicUrl(finalPath);

        finalPdfUrl = publicUrlData.publicUrl;
        console.log("📄 Final PDF URL generated:", finalPdfUrl);
      }
    } catch (err: unknown) {
      console.error('❌ PDF generation error:', err);
    }

    // --- [SUB-BLOCK: UPDATE DATABASE] ---
    const paymentIntentRaw = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntentRaw === 'string'
        ? paymentIntentRaw
        : paymentIntentRaw &&
            typeof paymentIntentRaw === 'object' &&
            'id' in paymentIntentRaw
          ? String((paymentIntentRaw as { id: string }).id)
          : null;

    const { error: updateError } = await supabase
      .from('patient_requests')
      .update({
        status: 'paid',
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        analysis_pdf_url: finalPdfUrl,
      })
      .eq('id', numericRequestId);

    if (updateError) {
      console.error('❌ patient_requests update failed:', updateError);
      return new NextResponse('DB update failed', { status: 500 });
    }

    // --- [SUB-BLOCK: SEND FINAL REPORT E-MAIL (RESEND, IN-PROCESS)] ---
    if (finalPdfUrl) {
      try {
        const amountUsd =
          session.amount_total != null
            ? `${(session.amount_total / 100).toFixed(2)} USD`
            : 'Amount not available';
        const emailOutcome = await sendFinalPdfReportEmails({
          patientName: typedRow.patient_name ?? 'Patient',
          patientEmail: typedRow.patient_email,
          requestId,
          priceDisplay: amountUsd,
          pdfUrl: finalPdfUrl,
        });
        console.log('📧 Final report e-mail outcome:', JSON.stringify(emailOutcome));
      } catch (err: unknown) {
        console.error('❌ E-mail dispatch error:', err);
      }
    }
  }

  return new NextResponse('Success', { status: 200 });
}
