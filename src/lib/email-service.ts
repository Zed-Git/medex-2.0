// src/lib/email-service.ts
//
// =============================================================================
// WHAT CHANGED VS PREVIOUS GOLDEN STANDARD (AND WHY)
// =============================================================================
// Before: `request-analysis` and `webhook` called `fetch(${BASE_URL}/api/send-email)`.
// Problem: In serverless/edge deployments the app often cannot reliably call itself
// (missing/wrong BASE_URL, loopback blocked, cold starts). E-mails appeared "stuck".
// After: This module calls the Resend HTTP API directly from the same API route
// process. Same Resend account and "from" address as before — behaviour is preserved,
// delivery is more dependable.
// =============================================================================

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import EmailTemplate from "@/components/EmailTemplate";
import { getNextAppPublicUrl } from "@/lib/public-app-url";

// --- [FUNCTIONAL BLOCK: STRICT TYPES — NO `any`] ---
/** Payload when a patient first submits the request form (no payment yet). */
export interface RequestSubmissionEmailInput {
  patientName: string;
  patientEmail: string | null;
  requestId: string | number;
  /** Display string for quoted service fee, if known (may be empty). */
  priceDisplay: string | null;
}

/** Payload after Stripe checkout completes and the final PDF URL is stored. */
export interface FinalPdfReportEmailInput {
  patientName: string;
  patientEmail: string | null;
  requestId: string | number;
  /** Human-readable amount, e.g. "49.00 USD" (from Stripe or manual). */
  priceDisplay: string;
  /** Public HTTPS URL to the full PDF in Supabase storage. */
  pdfUrl: string;
}

/**
 * [DODATO 2026 — drugi pacijentov mejl] Posle eksperta: poziv na privatnu stranicu sa pregledom + plaćanje.
 * Prvi mejl (sendRequestSubmissionEmails) ne sme sadržati ovaj korak.
 */
export interface ReportReadyPaymentInviteEmailInput {
  patientName: string;
  patientEmail: string | null;
  requestId: string | number;
  /** Npr. "$111 USD (extended review)" */
  priceDisplay: string;
  /** Puna HTTPS adresa ka /success?id= */
  portalPaymentUrl: string;
}

/** One Resend API outcome (success carries Resend message id when present). */
export interface SingleEmailResult {
  ok: boolean;
  id?: string;
  errorMessage?: string;
}

/** Aggregated outcome for observability (routes still return 200 if DB succeeded). */
export interface BatchEmailResult {
  patient: SingleEmailResult | null;
  admin: SingleEmailResult;
}

// --- [FUNCTIONAL BLOCK: CONFIG HELPERS] ---
/**
 * Resend requires a verified domain or onboarding "from" address.
 * We read the same env vars as the legacy `send-email` route for compatibility.
 */
function getFromAddress(): string {
  // [ZLATNI STANDARD + DODATO] Ponekad se u .env.local stavi vrednost u navodnicima.
  // Next obično učita bez spoljnih navodnika, ali ako korisnik zalepi ceo string sa "",
  // trim pomaže da "from" ostane validan za Resend.
  const raw = process.env.RESEND_FROM ?? "Medex 2.0 <noreply@medexnews.com>";
  return raw.trim().replace(/^["']|["']$/g, "");
}

/** Primary administrator inbox for operational notices. */
function getAdminEmail(): string {
  return process.env.MEDEX_ADMIN_EMAIL ?? "mdzdravko@gmail.com";
}

/**
 * Lazily construct the Resend client so missing API keys do not crash module load.
 * Returns `null` if e-mail cannot be sent (caller logs and continues).
 */
function getResendClient(): Resend | null {
  // Ukloni slučajne razmake / navodnike oko ključa iz .env (čest uzrok 401 u Resend-u).
  const key = process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!key) {
    console.error(
      "[email-service] RESEND_API_KEY is missing — cannot dispatch e-mail.",
    );
    return null;
  }
  return new Resend(key);
}

// --- [FUNCTIONAL BLOCK: HTML SAFETY FOR ADMIN BODIES] ---
/** Escape text inserted into HTML so patient-supplied names cannot break markup. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- [FUNCTIONAL BLOCK: ADMIN HTML TEMPLATES] ---
function buildAdminNewRequestHtml(input: RequestSubmissionEmailInput): string {
  const name = escapeHtml(input.patientName);
  const email = input.patientEmail?.trim()
    ? escapeHtml(input.patientEmail.trim())
    : "Not provided";
  const id = escapeHtml(String(input.requestId));
  const price =
    input.priceDisplay && input.priceDisplay.trim().length > 0
      ? escapeHtml(input.priceDisplay)
      : "Not specified at submission";

  return `
    <h2 style="font-family:system-ui,sans-serif;font-size:18px;">New cardiology analysis request</h2>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111827;">
      A new Medex 2.0 request has been submitted and awaits expert (PhD) review.
    </p>
    <ul style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
      <li><strong>Patient name:</strong> ${name}</li>
      <li><strong>Patient e-mail:</strong> ${email}</li>
      <li><strong>Request reference:</strong> ${id}</li>
      <li><strong>Quoted service fee:</strong> ${price}</li>
    </ul>
    <p style="font-family:system-ui,sans-serif;font-size:14px;color:#6B7280;">
      Please review the case in the Medex 2.0 administration workspace and complete the analysis when clinically appropriate.
    </p>
  `;
}

function buildAdminFinalReportHtml(input: FinalPdfReportEmailInput): string {
  const name = escapeHtml(input.patientName);
  const id = escapeHtml(String(input.requestId));
  const price = escapeHtml(input.priceDisplay);
  const pdf = escapeHtml(input.pdfUrl);

  return `
    <h2 style="font-family:system-ui,sans-serif;font-size:18px;">Payment confirmed — final report issued</h2>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111827;">
      The patient has completed payment. The full cardiology analysis document is available at the secure link below.
    </p>
    <ul style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
      <li><strong>Patient name:</strong> ${name}</li>
      <li><strong>Request reference:</strong> ${id}</li>
      <li><strong>Amount paid:</strong> ${price}</li>
      <li><strong>Final PDF:</strong> <a href="${pdf}" target="_blank" rel="noopener noreferrer">Open full report (PDF)</a></li>
    </ul>
  `;
}

// --- [FUNCTIONAL BLOCK: LOW-LEVEL SEND] ---
async function sendHtmlEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<SingleEmailResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, errorMessage: "Resend client not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: getFromAddress(),
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("[email-service] Resend error:", error);
      return {
        ok: false,
        errorMessage:
          "message" in error && typeof error.message === "string"
            ? error.message
            : "Resend returned an error",
      };
    }

    return { ok: true, id: data?.id ?? undefined };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown send error";
    console.error("[email-service] Send exception:", e);
    return { ok: false, errorMessage: message };
  }
}

// --- [FUNCTIONAL BLOCK: PUBLIC — REQUEST FORM SUBMITTED] ---
/**
 * Sends (1) initial confirmation to the patient and (2) operational notice to the admin.
 * Intended call site: `POST /api/request-analysis` after a successful Supabase insert.
 */
export async function sendRequestSubmissionEmails(
  input: RequestSubmissionEmailInput,
): Promise<BatchEmailResult> {
  const siteUrl = getNextAppPublicUrl();
  const requestIdStr = String(input.requestId);

  // Render the shared React e-mail template to HTML (same visual language as before).
  let patientResult: SingleEmailResult | null = null;
  if (input.patientEmail?.trim()) {
    const patientHtml = await render(
      React.createElement(EmailTemplate, {
        mode: "processing-notification",
        patientName: input.patientName,
        requestId: requestIdStr,
        price: input.priceDisplay?.trim() ?? "",
        pdfUrl: null,
        baseUrl: siteUrl,
      }),
    );

    patientResult = await sendHtmlEmail({
      to: input.patientEmail.trim(),
      subject:
        "Medex 2.0 — Confirmation: your cardiology analysis request was received",
      html: patientHtml,
    });
  } else {
    console.warn(
      "[email-service] No patient e-mail — sending admin notice only (submission).",
    );
  }

  const adminResult = await sendHtmlEmail({
    to: getAdminEmail(),
    subject: "Medex 2.0 — New cardiology analysis request (expert review required)",
    html: buildAdminNewRequestHtml(input),
  });

  return { patient: patientResult, admin: adminResult };
}

// --- [FUNCTIONAL BLOCK: PUBLIC — EXPERT READY, PAYMENT INVITE (2. PACIJENTOV MEJL)] ---
/**
 * Šalje isključivo drugi pacijentov mejl: izveštaj spreman za pregled + link ka /success (Stripe).
 * Poziv: `POST /api/finalize-expert-report` nakon uploada preview PDF-a.
 */
export async function sendReportReadyPaymentInviteEmails(
  input: ReportReadyPaymentInviteEmailInput,
): Promise<BatchEmailResult> {
  const siteUrl = getNextAppPublicUrl();
  const requestIdStr = String(input.requestId);

  let patientResult: SingleEmailResult | null = null;
  if (input.patientEmail?.trim()) {
    const patientHtml = await render(
      React.createElement(EmailTemplate, {
        mode: "report-ready-payment",
        patientName: input.patientName,
        requestId: requestIdStr,
        price: input.priceDisplay,
        pdfUrl: null,
        baseUrl: siteUrl,
        portalPaymentUrl: input.portalPaymentUrl,
      }),
    );

    patientResult = await sendHtmlEmail({
      to: input.patientEmail.trim(),
      subject:
        "Medex 2.0 — Your expert report is ready — review and complete payment",
      html: patientHtml,
    });
  } else {
    console.warn(
      "[email-service] Report-ready invite: no patient e-mail — skipping patient message.",
    );
  }

  const name = escapeHtml(input.patientName);
  const id = escapeHtml(requestIdStr);
  const price = escapeHtml(input.priceDisplay);
  const portal = escapeHtml(input.portalPaymentUrl);

  const adminHtml = `
    <h2 style="font-family:system-ui,sans-serif;font-size:18px;">Expert report finalized — payment invite sent</h2>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111827;">
      The expert workflow has marked a report as ready. The patient has been sent the second e-mail with a link to preview the report and complete Stripe payment.
    </p>
    <ul style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
      <li><strong>Patient:</strong> ${name}</li>
      <li><strong>Request reference:</strong> ${id}</li>
      <li><strong>Quoted fee:</strong> ${price}</li>
      <li><strong>Patient portal link:</strong> <a href="${portal}" target="_blank" rel="noopener noreferrer">Open patient report page</a></li>
    </ul>
  `;

  const adminResult = await sendHtmlEmail({
    to: getAdminEmail(),
    subject: "Medex 2.0 — Patient notified: report ready for payment",
    html: adminHtml,
  });

  return { patient: patientResult, admin: adminResult };
}

// --- [FUNCTIONAL BLOCK: PUBLIC — STRIPE PAID, FINAL PDF] ---
/**
 * Sends the patient their full-report notification and notifies the admin with the PDF link.
 * Intended call site: `POST /api/webhook` on `checkout.session.completed`.
 */
export async function sendFinalPdfReportEmails(
  input: FinalPdfReportEmailInput,
): Promise<BatchEmailResult> {
  const siteUrl = getNextAppPublicUrl();
  const requestIdStr = String(input.requestId);

  let patientResult: SingleEmailResult | null = null;
  if (input.patientEmail?.trim()) {
    const patientHtml = await render(
      React.createElement(EmailTemplate, {
        mode: "final-report",
        patientName: input.patientName,
        requestId: requestIdStr,
        price: input.priceDisplay,
        pdfUrl: input.pdfUrl,
        baseUrl: siteUrl,
      }),
    );

    patientResult = await sendHtmlEmail({
      to: input.patientEmail.trim(),
      subject:
        "Medex 2.0 — Your full cardiology analysis report is ready for download",
      html: patientHtml,
    });
  } else {
    console.warn(
      "[email-service] Missing patient e-mail — skipping patient final report e-mail.",
    );
  }

  const adminResult = await sendHtmlEmail({
    to: getAdminEmail(),
    subject: "Medex 2.0 — Payment received: final cardiology report available",
    html: buildAdminFinalReportHtml(input),
  });

  return { patient: patientResult, admin: adminResult };
}

// --- [FUNCTIONAL BLOCK: STRIPE CHECKOUT SESSION — ADMIN NOTICE ONLY] ---
/**
 * [IZMENA 2026] Poziva se kada se kreira Stripe Checkout sesija.
 * Ranije je slao i pacijentu mejl ("Proceed to payment") — to je uklonjeno:
 * pacijent dobija link za plaćanje samo u drugom mejlu (sendReportReadyPaymentInviteEmails),
 * nakon što ekspert završi pregled (finalize-expert-report).
 * Ovde ostaje obaveštenje adminu radi logovanja u inboxu.
 */
export interface CheckoutSessionInitEmailInput {
  patientName: string;
  requestId: string | number;
  /** Amount in USD (whole or decimal dollars, e.g. 105 or 49.5). */
  priceUsd: number;
  patientEmail: string | null;
  stripeSessionId: string;
}

export async function sendCheckoutSessionInitEmails(
  input: CheckoutSessionInitEmailInput,
): Promise<void> {
  const name = escapeHtml(input.patientName);
  const id = escapeHtml(String(input.requestId));
  const price = escapeHtml(String(input.priceUsd));
  const sid = escapeHtml(input.stripeSessionId);

  const adminHtml = `
    <h2 style="font-family:system-ui,sans-serif;font-size:18px;">Stripe Checkout session started</h2>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111827;">
      A patient has opened the secure payment flow for a Medex 2.0 PhD cardiology analysis report.
    </p>
    <ul style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
      <li><strong>Patient:</strong> ${name}</li>
      <li><strong>Request reference:</strong> ${id}</li>
      <li><strong>Quoted amount (USD):</strong> $${price}</li>
      <li><strong>Stripe session ID:</strong> ${sid}</li>
    </ul>
    <p style="font-family:system-ui,sans-serif;font-size:14px;color:#6B7280;">
      Completion is recorded when Stripe sends <code>checkout.session.completed</code> to your webhook.
    </p>
  `;

  await sendHtmlEmail({
    to: getAdminEmail(),
    subject: "Medex 2.0 — Stripe Checkout session started",
    html: adminHtml,
  });
}

// --- [FUNCTIONAL BLOCK: PUBLIC — CONTACT FORM] ---
// [DODATO vs Zlatni standard] Kontakt forma sa sajta šalje poruku na admin inbox (Resend).
export interface ContactFormEmailInput {
  name: string;
  email: string;
  message: string;
}

export async function sendContactFormEmail(
  input: ContactFormEmailInput,
): Promise<SingleEmailResult> {
  const name = escapeHtml(input.name.trim());
  const email = escapeHtml(input.email.trim());
  const message = escapeHtml(input.message.trim()).replace(/\n/g, "<br/>");

  const html = `
    <h2 style="font-family:system-ui,sans-serif;font-size:18px;">Website contact form</h2>
    <ul style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;">
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
    </ul>
    <p style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#111827;">
      ${message}
    </p>
  `;

  return await sendHtmlEmail({
    to: getAdminEmail(),
    subject: `MedExNews — Contact form message from ${input.name.trim()}`,
    html,
  });
}

// --- [FUNCTIONAL BLOCK: LEGACY `/api/send-email` COMPAT] ---
/** Shape of JSON historically accepted by `POST /api/send-email`. */
export interface LegacySendEmailBody {
  requestId?: string | number | null;
  id?: string | number | null;
  /**
   * [DODATO vs raniji refaktor] Admin panel (Golden Standard 3.2.4) šalje `reportId: "REP-51"`.
   * Stari kod je tražio samo `requestId` / `id`, pa je dispatch vraćao null → 400 → "Email notification system error".
   */
  reportId?: string | null;
  patientName?: string | null;
  patient_name?: string | null;
  patientEmail?: string | null;
  patient_email?: string | null;
  price?: string | number | null;
  amount?: string | number | null;
  pdfUrl?: string | null;
  reportUrl?: string | null;
}

function formatLegacyPrice(
  price: string | number | null | undefined,
): string | null {
  if (price === null || price === undefined) return null;
  if (typeof price === "number") return String(price);
  const s = price.trim();
  return s.length > 0 ? s : null;
}

/**
 * Izvuče jedinstveni broj zahteva iz legacy tela: `requestId`, `id`, ili `REP-<broj>`.
 */
function resolveLegacyRequestId(
  body: LegacySendEmailBody,
): string | number | null {
  const a = body.requestId;
  if (a !== undefined && a !== null && String(a).trim() !== "") return a;
  const b = body.id;
  if (b !== undefined && b !== null && String(b).trim() !== "") return b;
  if (typeof body.reportId === "string") {
    const t = body.reportId.trim();
    const rep = /^REP-(\d+)$/i.exec(t);
    if (rep) return rep[1];
    if (/^\d+$/.test(t)) return t;
    if (t.length > 0) return t;
  }
  return null;
}

/**
 * Maps the old HTTP body to the new service calls so external callers of
 * `/api/send-email` keep working without duplicating Resend logic.
 */
export async function dispatchLegacySendEmailBody(
  body: LegacySendEmailBody,
): Promise<BatchEmailResult | null> {
  const requestId = resolveLegacyRequestId(body);
  const patientName =
    body.patientName ?? body.patient_name ?? "Unknown patient";
  const patientEmail = body.patientEmail ?? body.patient_email ?? null;
  const priceRaw = body.price ?? body.amount ?? null;
  const pdfUrl = body.pdfUrl ?? body.reportUrl ?? null;

  if (requestId === null || requestId === undefined) {
    console.warn(
      "[email-service] Legacy payload missing requestId / id / reportId — skip.",
    );
    return null;
  }

  if (pdfUrl?.trim()) {
    return sendFinalPdfReportEmails({
      patientName,
      patientEmail,
      requestId,
      priceDisplay: formatLegacyPrice(priceRaw) ?? "—",
      pdfUrl: pdfUrl.trim(),
    });
  }

  return sendRequestSubmissionEmails({
    patientName,
    patientEmail: patientEmail?.trim() ? patientEmail.trim() : null,
    requestId,
    priceDisplay: formatLegacyPrice(priceRaw),
  });
}
