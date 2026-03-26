// src/app/api/send-email/route.ts

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
// [ZLATNI STANDARD: NextResponse + Resend]
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// --- [FUNCTIONAL BLOCK: RESEND INIT] ---
const resend = new Resend(process.env.RESEND_API_KEY);

// --- [FUNCTIONAL BLOCK: ENV CONFIG] ---
// [ISPRAVKA: koristimo RESEND_FROM iz .env.local]
const FROM_EMAIL =
  process.env.RESEND_FROM || 'MedExNews AI <no-reply@yourdomain.com>';

// [DODATO: admin email iz env, fallback na tvoj mail]
const ADMIN_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || 'mdzdravko@yahoo.com';

// --- [FUNCTIONAL BLOCK: TYPES] ---
interface SendEmailPayload {
  patientName?: string;
  patientEmail?: string;
  requestId?: number | string;
  price?: string | number | null;
  pdfUrl?: string | null;
  status?: 'pending' | 'paid' | 'processing' | string;
}

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SendEmailPayload;

    const {
      patientName,
      patientEmail,
      requestId,
      price,
      pdfUrl,
      status,
    } = body;

    console.log('[send-email] Incoming payload:', body);
    console.log('[send-email] Using ADMIN_EMAIL:', ADMIN_EMAIL);

    if (!patientName || !patientEmail) {
      console.error('[send-email] Missing required fields:', {
        patientName,
        patientEmail,
        requestId,
      });
      return NextResponse.json(
        { error: 'Missing required fields for email (name/email).' },
        { status: 400 }
      );
    }

    const isFinalReport = !!pdfUrl;
    const safeRequestId = requestId ?? 'N/A';

    const subjectPatient = isFinalReport
      ? `Your MedExNews AI Final Report #${safeRequestId}`
      : `Your MedExNews AI Request #${safeRequestId} is being processed`;

    const subjectAdmin = isFinalReport
      ? `FINAL REPORT READY #${safeRequestId} - ${patientName}`
      : `NEW REQUEST RECEIVED #${safeRequestId} - ${patientName}`;

    const priceText =
      price !== undefined && price !== null && price !== ''
        ? `$${price}`
        : 'N/A';

    const patientBody = isFinalReport
      ? `
Dear ${patientName},

Your cardiology analysis report is now ready.

You can download your report here:
${pdfUrl}

Request ID: ${safeRequestId}
Estimated fee: ${priceText}

Best regards,
MedExNews AI Team
      `.trim()
      : `
Dear ${patientName},

Thank you for submitting your medical data.

Your request has been received and is now being reviewed.

Request ID: ${safeRequestId}
Estimated fee: ${priceText}

Best regards,
MedExNews AI Team
      `.trim();

    const adminBody = isFinalReport
      ? `
ADMIN NOTICE - FINAL REPORT READY

Request ID: ${safeRequestId}
Patient: ${patientName}
Patient Email: ${patientEmail}
Status: ${status || 'paid'}
Estimated fee: ${priceText}

Final PDF URL:
${pdfUrl}
      `.trim()
      : `
ADMIN NOTICE - NEW REQUEST RECEIVED

Request ID: ${safeRequestId}
Patient: ${patientName}
Patient Email: ${patientEmail}
Status: ${status || 'pending'}
Estimated fee: ${priceText}
      `.trim();

    // --- [SEND TO PATIENT] ---
    try {
      console.log('[send-email] Sending PATIENT email to:', patientEmail);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: patientEmail,
        subject: subjectPatient,
        text: patientBody,
      });
      console.log('[send-email] Patient email sent successfully.');
    } catch (err) {
      console.error('[send-email] Error sending patient email:', err);
    }

    // --- [SEND TO ADMIN] ---
    try {
      console.log('[send-email] Sending ADMIN email to:', ADMIN_EMAIL);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: subjectAdmin,
        text: adminBody,
      });
      console.log('[send-email] Admin email sent successfully.');
    } catch (err) {
      console.error('[send-email] Error sending admin email:', err);
    }

    return NextResponse.json(
      {
        success: true,
        mode: isFinalReport ? 'final-report' : 'processing',
        message: 'Emails processed (patient + admin).',
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[send-email] Critical error:', err);
    return NextResponse.json(
      { error: 'Server error in send-email.' },
      { status: 500 }
    );
  }
}
