// src/app/api/finalize-expert-report/route.ts
//
// [DODATO 2026] Ekspert završava tekst u admin panelu: čuva polja u bazu, generiše PREVIEW PDF,
// uploaduje u `medical-files`, šalje drugi pacijentov mejl (link ka /success + plaćanje).
// Prvi mejl (forma) ostaje bez plaćanja — vidi sendRequestSubmissionEmails.
// ---

import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getNextAppPublicUrl } from "@/lib/public-app-url";
import { resolveCheckoutPriceUsd } from "@/lib/checkout-pricing";
import MedicalReportPDF from "@/components/MedicalReportPDF";
import { sendReportReadyPaymentInviteEmails } from "@/lib/email-service";

const PREVIEW_BUCKET = "medical-files";

interface Body {
  requestId?: unknown;
  analysis?: unknown;
  recommendation?: unknown;
  references?: unknown;
}

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json();
    if (typeof raw !== "object" || raw === null) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const body = raw as Body;

    const requestId = Number(body.requestId);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });
    }

    const analysis = typeof body.analysis === "string" ? body.analysis.trim() : "";
    const recommendation =
      typeof body.recommendation === "string" ? body.recommendation.trim() : "";
    const refs =
      typeof body.references === "string" ? body.references.trim() : "";

    if (!analysis) {
      return NextResponse.json(
        { error: "Clinical findings (analysis) are required." },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();

    const { data: row, error: fetchErr } = await admin
      .from("patient_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchErr || !row) {
      console.error("[finalize-expert-report] Fetch error:", fetchErr);
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const r = row as {
      patient_name: string | null;
      patient_email: string | null;
      medical_note: string | null;
      created_at: string | null;
      urgency_level?: string | null;
    };

    let previewUrl: string | null = null;

    try {
      const doc = React.createElement(MedicalReportPDF, {
        patient: {
          patient_name: r.patient_name ?? "",
          created_at: r.created_at ?? "",
          medical_note: r.medical_note ?? "",
        },
        analysis,
        recommendation: recommendation || "No recommendations provided.",
        references: refs || "No references provided.",
        mode: "preview",
      });

      const buf = await renderToBuffer(
        doc as Parameters<typeof renderToBuffer>[0],
      );

      const path = `preview-report-request-${requestId}.pdf`;
      const { error: upErr } = await admin.storage
        .from(PREVIEW_BUCKET)
        .upload(path, buf, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (upErr) {
        console.error("[finalize-expert-report] Preview upload failed:", upErr);
      } else {
        const { data: pub } = admin.storage.from(PREVIEW_BUCKET).getPublicUrl(path);
        previewUrl = pub.publicUrl;
        console.log("[finalize-expert-report] Preview PDF URL:", previewUrl);
      }
    } catch (e: unknown) {
      console.error("[finalize-expert-report] Preview PDF error:", e);
    }

    const { error: upRowErr } = await admin
      .from("patient_requests")
      .update({
        analysis,
        recommendation: recommendation || null,
        references: refs || null,
        status: "completed",
        analysis_preview_url: previewUrl,
      })
      .eq("id", requestId);

    if (upRowErr) {
      console.error("[finalize-expert-report] DB update error:", upRowErr);
      return NextResponse.json(
        { error: "Could not save expert report to database.", details: upRowErr.message },
        { status: 500 },
      );
    }

    const priceResolved = await resolveCheckoutPriceUsd({ requestId });
    const urgency = String(r.urgency_level ?? "Basic");
    const tier =
      urgency === "Extended" ? "extended review" : "basic review";
    const priceDisplay = priceResolved.ok
      ? `$${priceResolved.usd.toFixed(0)} USD (${tier})`
      : "See your private report page for the current fee.";

    const base = getNextAppPublicUrl();
    const portalPaymentUrl = `${base.replace(/\/$/, "")}/success?id=${encodeURIComponent(String(requestId))}`;

    const emailOutcome = await sendReportReadyPaymentInviteEmails({
      patientName: r.patient_name ?? "Patient",
      patientEmail: r.patient_email,
      requestId,
      priceDisplay,
      portalPaymentUrl,
    });

    const patientFailed =
      emailOutcome.patient !== null && !emailOutcome.patient.ok;
    const adminFailed = !emailOutcome.admin.ok;
    if (patientFailed || adminFailed) {
      return NextResponse.json(
        {
          success: false,
          error: "Report saved but e-mail delivery failed",
          outcome: emailOutcome,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      previewUrl,
      portalPaymentUrl,
      outcome: emailOutcome,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[finalize-expert-report]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
