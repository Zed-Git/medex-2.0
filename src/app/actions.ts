"use server";

import { supabase } from "@/lib/supabase";

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

    return { success: true, data };
  } catch (err) {
    console.error("Server Action error:", err);
    return { success: false, error: "Unexpected server error" };
  }
}


