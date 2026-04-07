/* 
  FAZA: Napredna Automatizacija - Zadatak 1
  STATUS: Golden Standard 2.3 + dopune (PDF estetika / sadržaj)
  [IZMENE vs Zlatni standard — 2026]
  1. Ispod naslova ostaje samo CRVENA linija (plava uklonjena).
  2. Sekcija D: nema više podrazumevanih ESC/ACC referenci — samo dinamički tekst eksperta.
  3. Footer „Note“: jača medicinsko-pravna formulacija (engleski).
  4. Ostalo ne diramo (reference dole, PhD layout, preview badge).
  5. [note.txt] Ceo WARNING blok u footeru u crvenoj boji (ranije je deo teksta bio plav).
  6. [note.txt] „AI“ u zaglavlju kao na Landing page — vizuelno superscript (pomereno nagore), iste boje/veličine kao pre.
  7. Logo tekst „MedExNews“ (M, E, N velika) kao na Landingu, ne MEDEXNEWS.
*/

import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// [Pomoćna funkcija] Stari zapisi u bazi još uvek mogu imati „PHD CLINICAL REPORT“ + crtice — skidamo to samo za prikaz u PDF-u.
function stripLegacyPhdHeader(note: string): string {
  return note.replace(
    /^\s*PHD\s+CLINICAL\s+REPORT\s*[\r\n]+[-\s]+[\r\n]*/i,
    "",
  );
}

function previewExcerpt(text: string | undefined, maxChars: number): string {
  const t = (text ?? "").trim();
  if (!t) return "N/A";
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars).trimEnd()}…`;
}

// --- [FUNCTIONAL BLOCK: PROPS INTERFACE] ---
// [DODATO vs stariji layout: tipovi za integration sa webhook-om i backendom]
// Ovo omogućava da backend (webhook) precizno prosledi podatke u PDF komponentu.
export interface MedicalReportPDFProps {
  patient: {
    patient_name: string;
    created_at: string;
    medical_note: string;
  };
  analysis?: string;
  recommendation?: string;
  references?: string;
  // [DODATO] mode: omogućava razlikovanje PREVIEW vs FINAL PDF-a
  mode?: "final" | "preview";
}

// --- [FUNCTIONAL BLOCK: STYLES] ---
// [ZLATNI STANDARD - VIZUELNI LAYOUT PDF-a]
const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#ffffff", fontFamily: "Helvetica" },
  header: { marginBottom: 15 },
  // [note.txt] Jedan red kao flex na sajtu (items-baseline / sup efekat) — u PDF-u nema <sup>, pa „AI“ blago podižemo.
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "nowrap",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E5481",
    fontStyle: "italic",
  },
  // Iste boje i fontSize kao u Zlatnom standardu; eksplicitno bold+italic jer više nije ugnježden u logoText.
  aiTag: {
    color: "#E31E24",
    fontSize: 14,
    fontWeight: "bold",
    fontStyle: "italic",
    marginTop: -6,
    marginLeft: 2,
  },
  doctorTitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  /* [IZMENA vs Zlatni standard] Plava linija uklonjena — ostaje samo crvena ispod tagline-a. */
  redLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#E31E24",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 25,
  },
  infoLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 10, color: "#000", marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2E5481",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  contentBox: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#1e293b",
    borderLeftWidth: 2,
    borderLeftColor: "#2E5481",
    paddingLeft: 10,
  },
  conclusionBox: { backgroundColor: "#E1EBF5", padding: 12, borderRadius: 2 },
  noteAboveLine: {
    fontSize: 8,
    color: "#E31E24",
    fontWeight: "bold",
    marginBottom: 5,
  },
  footerContainer: { position: "absolute", bottom: 30, left: 40, right: 40 },
  footerLine: { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 },
  legalDisclaimer: {
    fontSize: 7,
    color: "#2E5481",
    textAlign: "center",
    lineHeight: 1.5,
  },

  // --- [NEW STYLE BLOCK: PREVIEW BADGE] ---
  // [DODATO vs Zlatni Standard: vizuelni indikator da je PDF samo preview]
  previewBadge: {
    backgroundColor: "#F97316", // narandžasta, jasno vidljiva
    padding: 6,
    marginBottom: 10,
    borderRadius: 2,
  },
  previewBadgeText: {
    fontSize: 9,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "bold",
  },
});

// --- [FUNCTIONAL BLOCK: MAIN COMPONENT] ---
// [ZLATNI STANDARD + DODATO: korištenje "mode" za PREVIEW indikator]
const MedicalReportPDF = ({
  patient,
  analysis,
  recommendation,
  references,
  mode, // [DODATO] — sada se stvarno koristi u layoutu
}: MedicalReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* --- [SUB-BLOCK: OPTIONAL PREVIEW BADGE] --- */}
      {/* [DODATO vs Zlatni Standard: ako je mode === 'preview', prikaži upozorenje] */}
      {mode === "preview" && (
        <View style={styles.previewBadge}>
          <Text style={styles.previewBadgeText}>
            PREVIEW VERSION – NOT FOR PATIENT USE
          </Text>
        </View>
      )}

      {/* --- [SUB-BLOCK: HEADER] --- */}
      {/* [Zlatni standard + dopuna] Jedna crvena linija ispod podnaslova (plava uklonjena). */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          {/* [IZMENA vs Zlatni standard] Isto pisanje kao na Landing page (MedExNews), ne sve veliko. */}
          <Text style={styles.logoText}>MedExNews </Text>
          <Text style={styles.aiTag}>AI</Text>
        </View>
        <Text style={styles.doctorTitle}>
          Scientists & Cardiology | Evidence Based Personalized Medicine |
          Expert Team Review
        </Text>
        <View style={styles.redLine} />
      </View>

      {/* --- [SUB-BLOCK: PATIENT INFO ROW] --- */}
      {/* Levo: ime pacijenta, desno: datum pregleda */}
      <View style={styles.infoRow}>
        <View>
          <Text style={styles.infoLabel}>NAME</Text>
          <Text style={styles.infoValue}>{patient.patient_name || "N/A"}</Text>
        </View>
        <View style={{ textAlign: "right" }}>
          <Text style={styles.infoLabel}>EXAMINATION DATE</Text>
          <Text style={styles.infoValue}>
            {new Date(patient.created_at).toLocaleDateString("en-US")}
          </Text>
        </View>
      </View>

      {/* --- [SUB-BLOCK: SECTION A - ANAMNESIS] --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A) PATIENT ANAMNESIS & DATA</Text>
        <View style={styles.contentBox}>
          <Text>{stripLegacyPhdHeader(patient.medical_note || "")}</Text>
        </View>
      </View>

      {/* --- [SUB-BLOCK: SECTION B - ANALYSIS] --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          B) EXPERT CLINICAL FINDINGS & ANALYSIS
        </Text>
        <View style={styles.contentBox}>
          {mode === "preview" ? (
            <>
              <Text>{previewExcerpt(analysis, 900)}</Text>
              <Text
                style={{
                  fontSize: 9,
                  marginTop: 8,
                  color: "#E31E24",
                  fontWeight: "bold",
                }}
              >
                LOCKED: Full findings unlock after payment.
              </Text>
            </>
          ) : (
            <Text>{analysis || "N/A"}</Text>
          )}
        </View>
      </View>

      {/* --- [SUB-BLOCK: SECTION C - CONCLUSIONS] --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>C) CONCLUSIONS</Text>
        <View style={styles.conclusionBox}>
          <Text style={{ fontSize: 10, lineHeight: 1.5 }}>
            {mode === "preview"
              ? "LOCKED: Conclusions unlock after payment."
              : recommendation || "N/A"}
          </Text>
        </View>
      </View>

      {/* --- [SUB-BLOCK: SECTION D - REFERENCES] --- */}
      {/* [IZMENA vs Zlatni standard] Bez generičkih ESC/ACC stringova — samo ono što ekspert unese. */}
      <View style={{ marginTop: 30 }}>
        <Text style={styles.sectionTitle}>
          D) REFERENCES (Evidence Based Medicine)
        </Text>
        <View style={styles.contentBox}>
          <Text style={{ fontSize: 8 }}>
            {mode === "preview"
              ? "LOCKED: References unlock after payment."
              : references?.trim()
                ? references.trim()
                : "N/A"}
          </Text>
        </View>
      </View>

      {/* --- [SUB-BLOCK: FOOTER + NOTE] --- */}
      {/* Note iznad linije + legal disclaimer u dnu stranice */}
      <View style={styles.footerContainer}>
        {/* [IZMENA vs Zlatni standard + note.txt] Ceo upozoravajući tekst mora biti crven (ne plavo + crveno). */}
        <Text style={styles.noteAboveLine}>
          WARNING: This report must be presented to a qualified medical
          practitioner for clinical evaluation prior to the initiation of any
          treatment or diagnostic procedures!
        </Text>
        <View style={styles.footerLine}>
          <Text style={styles.legalDisclaimer}>
            2026 All Rights Reserved. Unauthorized Use Prohibited. {"\n"}
            MedExNews does not provide medical advices, diagnosis or treatment.
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default MedicalReportPDF;
