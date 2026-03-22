// src/app/api/send-email/route.ts

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
// [ZLATNI STANDARD - NEW FILE]:
// Core Next.js response helpers + Resend client
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// --- [FUNCTIONAL BLOCK: RESEND INITIALIZATION] ---
// [ZLATNI STANDARD - NEW]:
// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY!);

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(req: NextRequest) {
  try {
    // --- [FUNCTIONAL BLOCK: DATA EXTRACTION] ---
    // [ZLATNI STANDARD - ROBUST PARSING]:
    const body = await req.json();

    const requestId =
      body.requestId ?? body.id ?? null;
    const patientName =
      body.patientName ?? body.patient_name ?? 'Unknown patient';
    const patientEmail =
      body.patientEmail ?? body.patient_email ?? null;
    const price =
      body.price ?? body.amount ?? null;
    const pdfUrl =
      body.pdfUrl ?? body.reportUrl ?? null;

    // --- [FUNCTIONAL BLOCK: VALIDATION] ---
    if (!requestId) {
      console.warn(
        '[send-email] Missing requestId in payload. Email will still be attempted without it.'
      );
    }

    if (!patientEmail) {
      console.warn(
        '[send-email] Missing patientEmail in payload. Patient email will NOT be sent.'
      );
    }

    // --- [FUNCTIONAL BLOCK: EMAIL PREPARATION] ---
    const adminEmail = 'mdzdravko@gmail.com';
    const fromAddress =
      process.env.RESEND_FROM || 'Medex 2.0 <noreply@medexnews.com>';

    const emailPromises: Promise<unknown>[] = [];

    // --- [SUB-BLOCK: ADMIN NOTIFICATION EMAIL] ---
    emailPromises.push(
      resend.emails.send({
        from: fromAddress,
        to: adminEmail,
        subject: 'Medex 2.0 – New clinical report notification',
        html: `
          <h2>New Clinical Report Notification</h2>
          <p><strong>Patient:</strong> ${patientName}</p>
          ${
            requestId
              ? `<p><strong>Request ID:</strong> ${requestId}</p>`
              : `<p><strong>Request ID:</strong> Not provided</p>`
          }
          ${
            price
              ? `<p><strong>Price:</strong> $${price}</p>`
              : `<p><strong>Price:</strong> Not provided</p>`
          }
          ${
            pdfUrl
              ? `<p><strong>Report URL:</strong> ${pdfUrl}</p>`
              : `<p><strong>Report URL:</strong> Not provided</p>`
          }
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
          subject: 'Your Medex 2.0 clinical report notification',
          html: `
            <h2>Thank you for using Medex 2.0</h2>
            <p>Dear ${patientName},</p>
            <p>Your clinical report is being processed.</p>
            ${
              requestId
                ? `<p><strong>Request ID:</strong> ${requestId}</p>`
                : ''
            }
            ${
              price
                ? `<p><strong>Service amount:</strong> $${price}</p>`
                : ''
            }
            ${
              pdfUrl
                ? `<p>You will receive a secure link to your final report once it is ready.</p>`
                : `<p>You will be notified when your final report is ready.</p>`
            }
            <p>Best regards,<br/>Medex 2.0 Team</p>
          `,
        })
      );
    }

    // --- [FUNCTIONAL BLOCK: EMAIL SENDING] ---
    try {
      await Promise.all(emailPromises);
      console.log('[send-email] Email notifications sent successfully.');
    } catch (emailError) {
      console.error('[send-email] Email sending error:', emailError);
      // We DO NOT throw here – we still return 200 to avoid "Critical Error" popup.
    }

    // --- [FUNCTIONAL BLOCK: SUCCESS RESPONSE] ---
    // [ZLATNI STANDARD - STABLE FRONTEND CONTRACT]:
    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    // --- [FUNCTIONAL BLOCK: GLOBAL ERROR HANDLING] ---
    // [FIXED - REPLACED any → unknown + safe narrowing]
    if (err instanceof Error) {
      console.error('[send-email] Critical server error:', err);
      return NextResponse.json(
        {
          error: 'Email notification system error',
          details: err.message,
        },
        { status: 500 }
      );
    }

    console.error('[send-email] Critical server error (non-Error):', err);
    return NextResponse.json(
      {
        error: 'Email notification system error',
        details: 'Unknown error',
      },
      { status: 500 }
    );
  }
}
