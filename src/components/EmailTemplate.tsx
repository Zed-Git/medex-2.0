// --- [FUNCTIONAL BLOCK: REACT IMPORT] ---
// [ZLATNI STANDARD + DODATO 2026]
// Promena toka mejlova: prvi mejl (processing) NE sme voditi na /success (plaćanje).
// Drugi mejl (report-ready-payment) eksplicitno poziva na privatnu stranicu izveštaja + plaćanje.
// Sav korisnički tekst u mejlu — na engleskom.
// ---

import * as React from "react";

// --- [FUNCTIONAL BLOCK: PROPS TYPE] ---
export type EmailTemplateProps = {
  mode:
    | "processing-notification"
    | "final-report"
    | "report-ready-payment";
  patientName: string;
  requestId: string;
  price: string;
  pdfUrl: string | null;
  baseUrl: string;
  /**
   * [DODATO] Puna URL adresa ka /success?id= kada je mode `report-ready-payment`.
   * Bez ovoga koristi se fallback iz baseUrl + requestId.
   */
  portalPaymentUrl?: string;
};

export function buildSubjectLine(mode: EmailTemplateProps["mode"]) {
  if (mode === "final-report") {
    return "Your Medex 2.0 clinical report is ready";
  }
  if (mode === "report-ready-payment") {
    return "Your expert report is ready — review and complete payment";
  }
  return "Your Medex 2.0 request was received";
}

export default function EmailTemplate(props: EmailTemplateProps) {
  const {
    mode,
    patientName,
    requestId,
    price,
    pdfUrl,
    baseUrl,
    portalPaymentUrl,
  } = props;

  const root = baseUrl.replace(/\/$/, "");
  const homeUrl = `${root}/`;

  const paymentPortalUrl =
    portalPaymentUrl && portalPaymentUrl.startsWith("http")
      ? portalPaymentUrl
      : `${root}/success?id=${encodeURIComponent(requestId)}`;

  let primaryHref: string;
  let ctaLabel: string;
  let statusText: string;

  if (mode === "final-report") {
    primaryHref = pdfUrl ?? homeUrl;
    ctaLabel = "View full report (PDF)";
    statusText = "PAID — FULL REPORT AVAILABLE";
  } else if (mode === "report-ready-payment") {
    primaryHref = paymentPortalUrl;
    ctaLabel = "Open your report & complete payment";
    statusText = "READY FOR PREVIEW — PAYMENT REQUIRED FOR FULL PDF";
  } else {
    // processing-notification — prvi mejl: samo početna stranica, bez /success (nema plaćanja)
    primaryHref = homeUrl;
    ctaLabel = "Return to Medex 2.0";
    statusText = "RECEIVED — UNDER EXPERT REVIEW";
  }

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "14px",
        lineHeight: 1.55,
        color: "#111827",
      }}
    >
      <h1 style={{ fontSize: "18px", marginBottom: "8px" }}>MEDEXNEWS AI</h1>
      <p style={{ margin: "0 0 16px 0" }}>Dear {patientName || "Patient"},</p>

      {mode === "final-report" && (
        <p style={{ margin: "0 0 12px 0" }}>
          Your payment has been confirmed. Your full PhD Cardiology Analysis
          report is attached below as a secure link. Thank you for trusting
          Medex 2.0.
        </p>
      )}

      {mode === "processing-notification" && (
        <>
          <p style={{ margin: "0 0 12px 0" }}>
            Thank you for submitting your request. We have received your
            clinical information and our cardiology team will review it in line
            with our PhD-level standards.
          </p>
          <p style={{ margin: "0 0 12px 0" }}>
            <strong>You do not need to pay at this stage.</strong> When your
            expert report is ready, you will receive a <strong>separate e-mail</strong>{" "}
            with a private link to preview your report and, if you choose to
            proceed, to complete secure payment for the full PDF.
          </p>
        </>
      )}

      {mode === "report-ready-payment" && (
        <>
          <p style={{ margin: "0 0 12px 0" }}>
            Your expert PhD cardiology review is ready. You can open your
            private report page to <strong>preview</strong> the clinical
            document and, when you are satisfied, complete a secure Stripe
            payment to unlock the <strong>full downloadable PDF</strong>.
          </p>
          <p style={{ margin: "0 0 12px 0" }}>
            Please use the button below — it is the only message that contains
            the payment step for this request.
          </p>
        </>
      )}

      <p style={{ margin: "0 0 8px 0" }}>
        <strong>Report reference:</strong> {requestId || "N/A"}
        <br />
        <strong>Status:</strong> {statusText}
      </p>

      {price && mode !== "processing-notification" && (
        <p style={{ margin: "0 0 12px 0" }}>
          <strong>Quoted fee:</strong> {price}
        </p>
      )}

      {price && mode === "processing-notification" && (
        <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#374151" }}>
          <strong>Indicative service fee (for your records):</strong> {price}
        </p>
      )}

      <p style={{ margin: "16px 0" }}>
        <a
          href={primaryHref}
          style={{
            display: "inline-block",
            padding: "10px 18px",
            backgroundColor: "#2563EB",
            color: "#ffffff",
            textDecoration: "none",
            borderRadius: "6px",
            fontWeight: 600,
          }}
        >
          {ctaLabel}
        </a>
      </p>

      <p style={{ margin: "16px 0 0 0", fontSize: "12px", color: "#6B7280" }}>
        © {new Date().getFullYear()} Medex 2.0. All rights reserved.
        <br />
        MedExNews does not provide emergency medical advice, diagnosis, or
        treatment. For urgent symptoms, contact your physician or local
        emergency services.
      </p>
    </div>
  );
}
