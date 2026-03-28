// src/app/api/send-email/route.ts

// =============================================================================
// CHANGE VS PREVIOUS GOLDEN STANDARD
// =============================================================================
// Before: This file constructed `Resend` and duplicated HTML templates here.
// After: It validates/parses the JSON body and delegates to `dispatchLegacySendEmailBody`
// in `@/lib/email-service`, so all Resend logic lives in one module. External callers
// (cron jobs, admin tools) can keep posting to `/api/send-email` unchanged.
// =============================================================================

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { NextRequest, NextResponse } from "next/server";
import {
  dispatchLegacySendEmailBody,
  type LegacySendEmailBody,
} from "@/lib/email-service";

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid JSON body.", success: false },
        { status: 400 },
      );
    }

    const legacyBody = body as LegacySendEmailBody;
    const outcome = await dispatchLegacySendEmailBody(legacyBody);

    if (!outcome) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing request reference (requestId) — cannot route e-mail templates.",
        },
        { status: 400 },
      );
    }

    // [DODATO] Ako Resend odbije oba (ili pacijenta kada postoji), ne lažemo UI sa 200 OK.
    const patientFailed =
      outcome.patient !== null && !outcome.patient.ok;
    const adminFailed = !outcome.admin.ok;
    if (patientFailed || adminFailed) {
      const parts: string[] = [];
      if (patientFailed) {
        parts.push(
          `Patient: ${outcome.patient?.errorMessage ?? "send failed"}`,
        );
      }
      if (adminFailed) {
        parts.push(`Admin: ${outcome.admin.errorMessage ?? "send failed"}`);
      }
      return NextResponse.json(
        {
          success: false,
          error: "E-mail delivery failed",
          details: parts.join(" | "),
          outcome,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, outcome });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("[send-email] Critical server error:", err);
      return NextResponse.json(
        { error: "E-mail notification system error", details: err.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "E-mail notification system error",
        details: "Unknown error",
      },
      { status: 500 },
    );
  }
}
