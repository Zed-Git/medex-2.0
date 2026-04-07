// src/lib/fulfill-checkout-session.ts
//
// [DODATO vs Zlatni standard] Zajednička logika nakon uspešnog plaćanja (Checkout Session).
// Zašto: Stripe webhook (`/api/webhook`) ne stiže lokalno ako nije pokrenut `stripe listen`,
// pa korisnik plati ali baza ostane "unpaid". Embedded Checkout uvek vraća `session_id` u URL —
// `/success` može pozvati `/api/checkout/verify-return` koji koristi istu funkciju kao webhook.

import type Stripe from "stripe";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import MedicalReportPDF, {
  type MedicalReportPDFProps,
} from "@/components/MedicalReportPDF";
import { sendFinalPdfReportEmails } from "@/lib/email-service";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const FINAL_PDF_STORAGE_BUCKET = "medical-files";

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

export type FulfillCheckoutResult =
  | { ok: true; skipped: true; reason: "already_fulfilled" }
  | { ok: true; skipped: false }
  | { ok: false; error: string };

/** Zajednička provera da li je Checkout sesija spremna za fulfillment (koristi verify-return pre brzog odgovora). */
export function isStripeCheckoutSessionPaid(session: Stripe.Checkout.Session): boolean {
  const checkoutComplete =
    session.status === "complete" && session.mode === "payment";
  const paymentOk =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  return paymentOk || checkoutComplete;
}

/**
 * Ista poslovna logika kao u `checkout.session.completed` webhook-u.
 * Idempotentno: ako je red već `paid` i ima `analysis_pdf_url`, preskače (bez duplog mejla).
 */
export async function fulfillCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<FulfillCheckoutResult> {
  const requestId = session.metadata?.requestId;
  if (!requestId) {
    return { ok: false, error: "Missing requestId in session metadata" };
  }

  const numericRequestId = Number(requestId);
  if (!Number.isFinite(numericRequestId)) {
    return { ok: false, error: "Invalid requestId in session metadata" };
  }

  if (!isStripeCheckoutSessionPaid(session)) {
    return {
      ok: false,
      error: `Session not paid (payment_status=${session.payment_status ?? "?"}, status=${session.status ?? "?"})`,
    };
  }

  const supabase = getSupabaseAdmin();

  const { data: patientRow, error: fetchError } = await supabase
    .from("patient_requests")
    .select("*")
    .eq("id", numericRequestId)
    .single();

  if (fetchError || !patientRow) {
    console.error("[fulfill-checkout] DB fetch error:", fetchError);
    return { ok: false, error: "Could not load patient request" };
  }

  const typedRow = patientRow as PatientRequestRow;

  if (typedRow.status === "paid" && typedRow.analysis_pdf_url) {
    console.log(
      `[fulfill-checkout] Request ${numericRequestId} već fulfilled — preskačem.`,
    );
    return { ok: true, skipped: true, reason: "already_fulfilled" };
  }

  console.log(`[fulfill-checkout] Payment confirmed for request ${numericRequestId}`);

  let finalPdfUrl: string | null = null;

  try {
    const pdfProps: MedicalReportPDFProps = {
      patient: {
        patient_name: typedRow.patient_name ?? "",
        created_at: typedRow.created_at ?? "",
        medical_note: typedRow.medical_note ?? "",
      },
      analysis: typedRow.analysis ?? "No analysis provided.",
      recommendation: typedRow.recommendation ?? "No recommendations provided.",
      references: typedRow.references ?? "No references provided.",
      mode: "final",
    };

    const finalDocument = React.createElement(MedicalReportPDF, pdfProps);

    const pdfBuffer = await renderToBuffer(
      finalDocument as Parameters<typeof renderToBuffer>[0],
    );

    const finalPath = `final-report-request-${numericRequestId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from(FINAL_PDF_STORAGE_BUCKET)
      .upload(finalPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error(
        "[fulfill-checkout] Final PDF storage upload failed:",
        uploadError,
      );
    } else {
      const { data: publicUrlData } = supabase.storage
        .from(FINAL_PDF_STORAGE_BUCKET)
        .getPublicUrl(finalPath);

      finalPdfUrl = publicUrlData.publicUrl;
      console.log("[fulfill-checkout] Final PDF URL:", finalPdfUrl);
    }
  } catch (err: unknown) {
    console.error("[fulfill-checkout] PDF generation error:", err);
  }

  const paymentIntentRaw = session.payment_intent;
  const paymentIntentId =
    typeof paymentIntentRaw === "string"
      ? paymentIntentRaw
      : paymentIntentRaw &&
          typeof paymentIntentRaw === "object" &&
          "id" in paymentIntentRaw
        ? String((paymentIntentRaw as { id: string }).id)
        : null;

  const { error: updateError } = await supabase
    .from("patient_requests")
    .update({
      status: "paid",
      ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
      analysis_pdf_url: finalPdfUrl,
    })
    .eq("id", numericRequestId);

  if (updateError) {
    console.error("[fulfill-checkout] patient_requests update failed:", updateError);
    return { ok: false, error: "Database update failed" };
  }

  if (finalPdfUrl) {
    try {
      const amountUsd =
        session.amount_total != null
          ? `${(session.amount_total / 100).toFixed(2)} USD`
          : "Amount not available";
      const emailOutcome = await sendFinalPdfReportEmails({
        patientName: typedRow.patient_name ?? "Patient",
        patientEmail: typedRow.patient_email,
        requestId,
        priceDisplay: amountUsd,
        pdfUrl: finalPdfUrl,
      });
      console.log(
        "[fulfill-checkout] Final report e-mail:",
        JSON.stringify(emailOutcome),
      );
    } catch (err: unknown) {
      console.error("[fulfill-checkout] E-mail dispatch error:", err);
    }
  }

  return { ok: true, skipped: false };
}
