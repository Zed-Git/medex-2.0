"use server";

// =============================================================================
// [DODATO vs Zlatni Standard] — pouzdan upis u bazu (service role)
// =============================================================================
// Anon Supabase klijent često ne može da INSERT-uje u patient_requests ako RLS to zabrani.
// Server Action koristi getSupabaseAdmin() (samo na serveru) da zahtev uvek bude sačuvan
// kada su env promenljive ispravne.
// =============================================================================
//
// =============================================================================
// [DODATO vs Zlatni Standard] — prvi e-mail (pacijent + admin) sa landing forme
// =============================================================================
// Problem: Dugme "SEND FOR EXPERT ANALYSIS" na početnoj (page.tsx) pozivalo je samo
// ovu server akciju koja radi INSERT u Supabase. Nije postojao poziv ka Resend-u,
// za razliku od /api/request-analysis. Zato je "prvi mejl" izostajao dok je drugi
// (admin panel / webhook) i dalje radio.
// Rešenje: Nakon uspešnog INSERT-a, pozovemo sendRequestSubmissionEmails iz
// @/lib/email-service (isti tok kao API ruta). Greška mejla ne sme da poništi uspeh
// forme — zahtev je već u bazi.
// =============================================================================

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { sendRequestSubmissionEmails } from "@/lib/email-service";

// -------------------------------
//  SUBMIT MEDICAL REQUEST
// -------------------------------
export async function submitMedicalRequest(formData: FormData) {
  try {
    const admin = getSupabaseAdmin();
    // --- CELINA 1: IZVLAČENJE PODATAKA ---
    const patientName = formData.get("patientName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string; // Iz forme
    const urgency = formData.get("urgency") as string;

    // --- CELINA 2: ANAMNEZA ---
    const anamnesisRaw = formData.get("medicalAnamnesis") as string;
    const anamnesis = anamnesisRaw ? JSON.parse(anamnesisRaw) : null;

    // --- CELINA 3: FAJL (ako postoji) ---
    const file = formData.get("medicalFile") as File | null;
    let uploadedFileUrl: string | null = null;

    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await admin.storage
        .from("medical-files")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return { success: false, error: "Upload failed" };
      }

      // Generisanje javnog URL-a za fajl
      const { data: publicUrl } = admin.storage.from("medical-files").getPublicUrl(fileName);
      uploadedFileUrl = publicUrl.publicUrl;
    }

    // --- [DODATO U ZLATNI STANDARD] ---
    // Pakovanje PhD polja u medical_note za admin + PDF sekciju A.
    // [IZMENA vs Zlatni standard 2026] Uklonjeni naslov „PHD CLINICAL REPORT“ i crtice — PDF ostaje čistiji.
    const formattedPhDNote = anamnesis
      ? `AGE: ${anamnesis.age} | SEX: ${anamnesis.sex}
CHEST PAIN: ${anamnesis.chestPain || 'N/A'}
RISK FACTORS: ${anamnesis.riskFactors || 'N/A'}
ALLERGIES: ${anamnesis.allergies || 'N/A'}
THERAPY: ${anamnesis.therapy || 'N/A'}`
      : "No anamnesis data.";

    // --- [DODATO — e-mail quoted fee tekst] ---
    // Napomena: mnoge baze nemaju kolonu `patient_requests.price` (Supabase schema cache).
    // Ne šaljemo `price` u INSERT — iznos za Stripe se računa u /api/checkout iz urgency + site_config.
    const { data: pricingRow } = await admin
      .from("site_config")
      .select("value")
      .eq("key", "pricing")
      .single();
    const pv = pricingRow?.value as
      | { normal?: string; priority?: string }
      | undefined;
    const normalStr = pv?.normal?.trim() ?? "";
    const priorityStr = pv?.priority?.trim() ?? "";

    // --- CELINA 4: UPIS U BAZU (patient_requests) ---
    // [FIX]: Mapiranje polja prema Vašoj slici 3 (phone -> phone_number)
    const { data, error } = await admin
      .from("patient_requests")
      .insert({
        patient_name: patientName,
        patient_email: email,
        phone_number: phone,
        urgency_level: urgency,
        medical_note: formattedPhDNote, // Formatirani medicinski tekst
        file_url: uploadedFileUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase INSERT error:", error);
      return { success: false, error: error.message };
    }

    // --- [FUNCTIONAL BLOCK: FIRST E-MAIL — PATIENT + ADMIN (RESEND)] ---
    if (data && typeof data === "object" && "id" in data) {
      const row = data as { id: number | string };
      try {
        const priceDisplay =
          urgency === "Extended"
            ? priorityStr
              ? `$${priorityStr} USD (extended review)`
              : "Extended review (fee from site configuration)"
            : normalStr
              ? `$${normalStr} USD (basic review)`
              : "Basic review (fee from site configuration)";

        const emailOutcome = await sendRequestSubmissionEmails({
          patientName: patientName ?? "",
          patientEmail: (email ?? "").trim() ? String(email).trim() : null,
          requestId: row.id,
          priceDisplay,
        });
        console.log(
          "[submitMedicalRequest] First e-mail batch:",
          JSON.stringify(emailOutcome),
        );
      } catch (emailErr: unknown) {
        console.error(
          "[submitMedicalRequest] First e-mail failed (non-fatal):",
          emailErr,
        );
      }
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Server Action error:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return { success: false, error: message };
  }
}


