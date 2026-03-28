// src/app/api/request-analysis/route.ts

// =============================================================================
// CHANGE VS PREVIOUS GOLDEN STANDARD (WHY)
// =============================================================================
// Before: After inserting the row, this route called `fetch(baseUrl + '/api/send-email')`.
// That depended on a correct public URL and the app being able to HTTP-call itself,
// which often failed in production — e-mails never left the server.
// After: The same business rules apply (validate body → insert → notify), but we call
// `sendRequestSubmissionEmails` from `src/lib/email-service.ts`, which talks to Resend
// directly. No self-HTTP hop.
// =============================================================================

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendRequestSubmissionEmails } from "@/lib/email-service";

// --- [FUNCTIONAL BLOCK: SUPABASE INIT] ---
// Service role key: required to insert from this trusted API route only (never expose to browser).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// --- [FUNCTIONAL BLOCK: POST HANDLER] ---
export async function POST(req: NextRequest) {
  try {
    // --- [SUB-BLOCK: PARSE BODY] ---
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const record = body as Record<string, unknown>;

    const patientName =
      typeof record.patientName === "string" ? record.patientName : "";
    const patientEmail =
      typeof record.patientEmail === "string" ? record.patientEmail : "";
    const medicalNote =
      typeof record.medicalNote === "string" ? record.medicalNote : "";
    const price =
      record.price === null || record.price === undefined
        ? null
        : String(record.price);

    // --- [SUB-BLOCK: VALIDATION] ---
    if (!patientName || !patientEmail || !medicalNote) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    // --- [SUB-BLOCK: INSERT INTO DATABASE] ---
    const { data: insertData, error: insertError } = await supabase
      .from("patient_requests")
      .insert({
        patient_name: patientName,
        patient_email: patientEmail,
        medical_note: medicalNote,
        status: "pending",
        price: price,
      })
      .select("id")
      .single();

    if (insertError || !insertData) {
      console.error("[request-analysis] DB insert error:", insertError);
      return NextResponse.json(
        { error: "Database insert error" },
        { status: 500 },
      );
    }

    const requestId = insertData.id;
    console.log("[request-analysis] New request created with id:", requestId);

    // --- [SUB-BLOCK: E-MAIL — INITIAL CONFIRMATION + ADMIN NOTICE] ---
    // Runs after DB success so we always have a stable request id in the message.
    try {
      const emailOutcome = await sendRequestSubmissionEmails({
        patientName,
        patientEmail,
        requestId,
        priceDisplay: price,
      });
      console.log(
        "[request-analysis] E-mail dispatch finished:",
        JSON.stringify(emailOutcome),
      );
    } catch (emailError: unknown) {
      // Do not fail the HTTP response: the clinical request is already stored.
      console.error(
        "[request-analysis] E-mail dispatch error (non-fatal):",
        emailError,
      );
    }

    // --- [SUB-BLOCK: SUCCESS RESPONSE] ---
    return NextResponse.json(
      {
        success: true,
        requestId,
        message:
          "Request recorded. Confirmation e-mail dispatched when Resend is configured.",
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    console.error("[request-analysis] Critical error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
