"use server";

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

import { supabase } from "@/lib/supabase";
import { sendRequestSubmissionEmails } from "@/lib/email-service";

// -------------------------------
//  SUBMIT MEDICAL REQUEST
// -------------------------------
export async function submitMedicalRequest(formData: FormData) {
  try {
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

      const { error: uploadError } = await supabase.storage
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
      const { data: publicUrl } = supabase.storage.from("medical-files").getPublicUrl(fileName);
      uploadedFileUrl = publicUrl.publicUrl;
    }

    // --- [DODATO U ZLATNI STANDARD] ---
    // Razlog: Pakovanje svih PhD polja u medical_note za Admin prikaz (Problem 2)
    const formattedPhDNote = anamnesis ? `
PHD CLINICAL REPORT
-------------------
AGE: ${anamnesis.age} | SEX: ${anamnesis.sex}
CHEST PAIN: ${anamnesis.chestPain || 'N/A'}
RISK FACTORS: ${anamnesis.riskFactors || 'N/A'}
ALLERGIES: ${anamnesis.allergies || 'N/A'}
THERAPY: ${anamnesis.therapy || 'N/A'}
    ` : "No anamnesis data.";

    // --- CELINA 4: UPIS U BAZU (patient_requests) ---
    // [FIX]: Mapiranje polja prema Vašoj slici 3 (phone -> phone_number)
    const { data, error } = await supabase
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
        const { data: pricingRow } = await supabase
          .from("site_config")
          .select("value")
          .eq("key", "pricing")
          .single();

        const pv = pricingRow?.value as
          | { normal?: string; priority?: string }
          | undefined;
        const normal = pv?.normal?.trim() ?? "";
        const priority = pv?.priority?.trim() ?? "";
        const priceDisplay =
          urgency === "Extended"
            ? priority
              ? `$${priority} USD (extended review)`
              : "Extended review (fee from site configuration)"
            : normal
              ? `$${normal} USD (basic review)`
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
  } catch (err) {
    console.error("Server Action error:", err);
    return { success: false, error: "Unexpected server error" };
  }
}


