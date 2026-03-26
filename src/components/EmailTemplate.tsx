// --- [FUNCTIONAL BLOCK: REACT IMPORT] ---
// [ZLATNI STANDARD - UNCHANGED]
import * as React from 'react';

// --- [FUNCTIONAL BLOCK: PROPS TYPE] ---
// [ZLATNI STANDARD + DODATO: baseUrl obavezno, price/pdfUrl mogu biti null]
export type EmailTemplateProps = {
  mode: 'processing-notification' | 'final-report';
  patientName: string;
  requestId: string;
  price: string;
  pdfUrl: string | null;
  baseUrl: string;
};

// --- [FUNCTIONAL BLOCK: SUBJECT HELPER (OPTIONAL)] ---
// [ZLATNI STANDARD + DODATO: koristimo ako želiš da generišeš subject i ovde]
export function buildSubjectLine(mode: EmailTemplateProps['mode']) {
  return mode === 'final-report'
    ? 'Your Medex 2.0 clinical report is ready'
    : 'Your Medex 2.0 clinical report notification';
}

// --- [FUNCTIONAL BLOCK: EMAIL TEMPLATE COMPONENT] ---
// [ZLATNI STANDARD - GLAVNI DEO, SVE NA ENGLESKOM]
export default function EmailTemplate(props: EmailTemplateProps) {
  const { mode, patientName, requestId, price, pdfUrl, baseUrl } = props;

  const isFinal = mode === 'final-report';

  const reportUrl = pdfUrl
    ? pdfUrl
    : `${baseUrl.replace(/\/$/, '')}/dashboard`; // fallback ako nema direktan PDF

  const statusText = isFinal ? 'READY FOR DOWNLOAD' : 'PROCESSING';

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: '14px',
        lineHeight: 1.5,
        color: '#111827',
      }}
    >
      {/* --- [BLOCK: HEADER] --- */}
      <h1 style={{ fontSize: '18px', marginBottom: '8px' }}>MEDEXNEWS AI</h1>
      <p style={{ margin: '0 0 16px 0' }}>
        Dear {patientName || 'Patient'},
      </p>

      {/* --- [BLOCK: MAIN MESSAGE] --- */}
      {isFinal ? (
        <p style={{ margin: '0 0 12px 0' }}>
          We are pleased to inform you that your PhD Cardiology Analysis has
          been completed by Dr. Zdravko&apos;s expert team.
        </p>
      ) : (
        <p style={{ margin: '0 0 12px 0' }}>
          Your clinical report is being processed. You will receive a secure
          link to your final report once it is ready.
        </p>
      )}

      {/* --- [BLOCK: REPORT REFERENCE] --- */}
      <p style={{ margin: '0 0 8px 0' }}>
        <strong>Report Reference:</strong> {requestId || 'N/A'}
        <br />
        <strong>Status:</strong> {statusText}
      </p>

      {/* --- [BLOCK: PRICE INFO] --- */}
      {price && (
        <p style={{ margin: '0 0 12px 0' }}>
          <strong>Price:</strong> {price}
        </p>
      )}

      {/* --- [BLOCK: CTA BUTTON] --- */}
      <p style={{ margin: '16px 0' }}>
        <a
          href={reportUrl}
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            backgroundColor: '#2563EB',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 600,
          }}
        >
          {isFinal ? 'View My Report' : 'Open Medex 2.0 Portal'}
        </a>
      </p>

      {/* --- [BLOCK: FOOTER] --- */}
      <p style={{ margin: '16px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
        2026 All Rights Reserved. Unauthorized Use Prohibited.
        <br />
        MedExNews does not provide medical advice, diagnosis or treatment.
      </p>
    </div>
  );
}
