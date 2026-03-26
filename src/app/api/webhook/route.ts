// src/app/api/webhook/route.ts

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import MedicalReportPDF from '@/components/MedicalReportPDF';

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

// Tipovi za PDF komponentu - Anatomija dokumenta
interface PDFProps {
  patient: {
    patient_name: string;
    patient_email: string;
    medical_note: string;
    created_at: string;
  };
  analysis: string;
  recommendation: string;
  references: string;
  mode: 'final' | 'draft';
}

// --- [FUNCTIONAL BLOCK: STRIPE INIT] ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  /* 
     [FIX]: Brisanje Error 1 (Stripe Config).
     Problem: Namespace 'Stripe' više ne izvozi 'Config' na taj način.
     Rešenje: Koristimo 'as any' sa ESLint ignorisanjem. U svetu programiranja, 
     ovo je 'bypass' koji koristimo kada se verzije biblioteka ne poklapaju u tipovima.
  */
  apiVersion: '2025-01-27.acacia' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
});

// --- [FUNCTIONAL BLOCK: SUPABASE INIT] ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
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

    console.log(`💳 Payment confirmed for request ${requestId}`);

    // --- [SUB-BLOCK: FETCH PATIENT ROW] ---
    const { data: patientRow, error: fetchError } = await supabase
      .from('patient_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !patientRow) {
      console.error('❌ DB fetch error:', fetchError);
      return new NextResponse('DB error', { status: 500 });
    }

    const typedRow = patientRow as PatientRequestRow;

    // --- [SUB-BLOCK: GENERATE FINAL PDF] ---
    let finalPdfUrl: string | null = null;

    try {
      // Pravimo React element koristeći našu PDF komponentu
      const finalDocument = React.createElement(MedicalReportPDF as React.FC<PDFProps>, {
        patient: {
          patient_name: typedRow.patient_name ?? '',
          patient_email: typedRow.patient_email ?? '',
          medical_note: typedRow.medical_note ?? '',
          created_at: typedRow.created_at ?? '',
        },
        analysis: typedRow.analysis ?? 'No analysis provided.',
        recommendation: typedRow.recommendation ?? 'No recommendations provided.',
        references: typedRow.references ?? 'No references provided.',
        mode: 'final',
      });

      /* 
         [FIX]: Brisanje Error 2 (PDF Type Mismatch).
         Problem: 'renderToBuffer' očekuje poseban PDF format, a React vraća opšti element.
         Rešenje: Kastujemo 'finalDocument' u 'any'. To je kao da kažemo sistemu: 
         "Veruj mi, ovo je ispravan organ za transplantaciju, iako se krvne grupe na papiru ne slažu."
      */
      const pdfBuffer = await renderToBuffer(finalDocument as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const finalPath = `reports/final/request-${requestId}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('reports')
        .upload(finalPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('reports')
          .getPublicUrl(finalPath);

        finalPdfUrl = publicUrlData.publicUrl;
        console.log('📄 Final PDF URL generated.');
      }
    } catch (err: unknown) {
      console.error('❌ PDF generation error:', err);
    }

    // --- [SUB-BLOCK: UPDATE DATABASE] ---
    await supabase
      .from('patient_requests')
      .update({
        status: 'paid',
        payment_intent_id: session.payment_intent as string,
        analysis_pdf_url: finalPdfUrl,
      })
      .eq('id', requestId);

    // --- [SUB-BLOCK: SEND FINAL REPORT EMAIL] ---
    if (finalPdfUrl) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientName: typedRow.patient_name,
            patientEmail: typedRow.patient_email,
            requestId,
            price: session.amount_total
              ? (session.amount_total / 100).toFixed(2)
              : '',
            pdfUrl: finalPdfUrl,
            status: 'paid',
          }),
        });
      } catch (err: unknown) {
        console.error('❌ Email error:', err);
      }
    }
  }

  return new NextResponse('Success', { status: 200 });
}
