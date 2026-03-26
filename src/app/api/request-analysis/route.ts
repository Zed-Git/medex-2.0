// src/app/api/request-analysis/route.ts

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
// [ZLATNI STANDARD + DODATO: endpoint za kreiranje zahtjeva + slanje prvog e-maila]
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- [FUNCTIONAL BLOCK: SUPABASE INIT] ---
// [ZLATNI STANDARD - backend service role key]
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- [FUNCTIONAL BLOCK: HELPER ZA BASE URL] ---
// [DODATO vs Zlatni Standard: sigurni base URL za fetch ka /api/send-email]
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  return 'http://localhost:3000';
}

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(req: NextRequest) {
  try {
    // --- [SUB-BLOCK: PARSE BODY] ---
    const body = await req.json();

    const patientName: string = body.patientName;
    const patientEmail: string = body.patientEmail;
    const medicalNote: string = body.medicalNote;
    const price: string | null = body.price ?? null;

    // --- [SUB-BLOCK: VALIDATION] ---
    if (!patientName || !patientEmail || !medicalNote) {
      return NextResponse.json(
        { error: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // --- [SUB-BLOCK: INSERT INTO DATABASE] ---
    const { data: insertData, error: insertError } = await supabase
      .from('patient_requests')
      .insert({
        patient_name: patientName,
        patient_email: patientEmail,
        medical_note: medicalNote,
        status: 'pending',
        price: price,
      })
      .select('id')
      .single();

    if (insertError || !insertData) {
      console.error('[request-analysis] DB insert error:', insertError);
      return NextResponse.json(
        { error: 'Database insert error' },
        { status: 500 }
      );
    }

    const requestId = insertData.id;
    console.log('[request-analysis] New request created with id:', requestId);

    // --- [SUB-BLOCK: SEND FIRST (PROCESSING) EMAIL] ---
    const baseUrl = getBaseUrl();

    const emailPayload = {
      patientName,
      patientEmail,
      requestId,
      price,
      status: 'pending',
    };

    try {
      console.log('[request-analysis] Calling send-email with payload:', emailPayload);
      const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error(
          '[request-analysis] send-email responded with non-OK status:',
          emailResponse.status,
          errorText
        );
      } else {
        console.log('[request-analysis] send-email (processing) triggered successfully.');
      }
    } catch (emailError) {
      console.error('[request-analysis] Email error (fetch failed):', emailError);
    }

    // --- [SUB-BLOCK: SUCCESS RESPONSE] ---
    return NextResponse.json(
      {
        success: true,
        requestId,
        message: 'Request created and notification emails triggered (if possible).',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[request-analysis] Critical error:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
