/* 
  FAZA: Napredna Automatizacija - Zadatak 1
  STATUS: Golden Standard 2.3 (Final Medical Layout)
  PROMENE: 
  1. References moved to the bottom.
  2. "Note" text placed exactly above the footer line.
  3. Professional PhD formatting.
*/

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

interface PatientData {
  patient_name: string;
  created_at: string;
  medical_note: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 15 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: '#2E5481', fontStyle: 'italic' },
  aiTag: { color: '#E31E24', fontSize: 14 },
  doctorTitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  blueLine: { borderBottomWidth: 3, borderBottomColor: '#2E5481', marginTop: 8 },
  redLine: { borderBottomWidth: 1.5, borderBottomColor: '#E31E24', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 25 },
  infoLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },
  infoValue: { fontSize: 10, color: '#000', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#2E5481', textTransform: 'uppercase', marginBottom: 8 },
  contentBox: { fontSize: 10, lineHeight: 1.6, color: '#1e293b', borderLeftWidth: 2, borderLeftColor: '#2E5481', paddingLeft: 10 },
  conclusionBox: { backgroundColor: '#E1EBF5', padding: 12, borderRadius: 2 },
  
  // ZLATNI STANDARD: Note iznad linije
  noteAboveLine: { fontSize: 8, color: '#E31E24', fontWeight: 'bold', marginBottom: 5 },
  footerContainer: { position: 'absolute', bottom: 30, left: 40, right: 40 },
  footerLine: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
  legalDisclaimer: { fontSize: 7, color: '#2E5481', textAlign: 'center', lineHeight: 1.5 }
});

interface Props {
  patient: PatientData;
  analysis?: string;
  recommendation?: string;
  references?: string;
}

const MedicalReportPDF = ({ patient, analysis, recommendation, references }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.logoText}>MEDEXNEWS <Text style={styles.aiTag}>AI</Text></Text>
        <Text style={styles.doctorTitle}>Scientists & Cardiology Team | Evidence Based Personalized Medicine</Text>
        <View style={styles.blueLine} />
        <View style={styles.redLine} />
      </View>

      <View style={styles.infoRow}>
        <View>
          <Text style={styles.infoLabel}>NAME</Text>
          <Text style={styles.infoValue}>{patient.patient_name || 'N/A'}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.infoLabel}>EXAMINATION DATE</Text>
          <Text style={styles.infoValue}>{new Date(patient.created_at).toLocaleDateString('en-US')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>A) PATIENT ANAMNESIS & DATA</Text>
        <View style={styles.contentBox}><Text>{patient.medical_note}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>B) EXPERT CLINICAL FINDINGS & ANALYSIS</Text>
        <View style={styles.contentBox}><Text>{analysis || 'N/A'}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>C) CONCLUSIONS</Text>
        <View style={styles.conclusionBox}>
          <Text style={{ fontSize: 10, lineHeight: 1.5 }}>{recommendation || 'N/A'}</Text>
        </View>
      </View>

      {/* D) REFERENCES - Spuštene dole */}
      <View style={{ marginTop: 30 }}>
        <Text style={styles.sectionTitle}>D) REFERENCES (Evidence Based Medicine)</Text>
        <View style={styles.contentBox}>
          <Text style={{ fontSize: 8 }}>{references || '1. ESC Guidelines. 2. ACC/AHA Clinical Practice Standards.'}</Text>
        </View>
      </View>

      <View style={styles.footerContainer}>
        {/* ZLATNI STANDARD: Note tačno iznad linije */}
        <Text style={styles.noteAboveLine}>Note: <Text style={{ color: '#2E5481' }}>The report should be shown to your doctor.</Text></Text>
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


