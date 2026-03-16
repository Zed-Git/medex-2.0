/* 
  FAZA: Napredna Automatizacija - Zadatak 1
  STATUS: Golden Standard 2.0 - PDF Template
  ZAKRPA: Harmonizacija naziva polja sa Supabase bazom (patient_name, patient_email)
*/

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// USKLAĐENO SA VAŠOM BAZOM (patient_name umesto full_name)
interface PatientData {
  patient_name: string;
  patient_email: string;
  medical_note: string;
  created_at: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { marginBottom: 20 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: '#2E5481', letterSpacing: 1 },
  doctorTitle: { fontSize: 10, color: '#64748b', marginTop: 2 },
  blueLine: { borderBottomWidth: 3, borderBottomColor: '#2E5481', marginTop: 10 },
  redLine: { borderBottomWidth: 1, borderBottomColor: '#E31E24', marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#2E5481', textTransform: 'uppercase', marginBottom: 8, backgroundColor: '#f8fafc', padding: 4 },
  contentBox: { fontSize: 10, lineHeight: 1.6, color: '#1e293b', paddingLeft: 5, borderLeftWidth: 2, borderLeftColor: '#e2e8f0' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#2E5481', textAlign: 'center' }
});

interface Props {
  patient: PatientData;
  analysis?: string;
  recommendation?: string;
}

const MedicalReportPDF = ({ patient, analysis, recommendation }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.logoText}>MEDEXNEWS AI</Text>
        <Text style={styles.doctorTitle}>Dr Zdravko | PhD Cardiologist | Evidence Based Review</Text>
        <View style={styles.blueLine} />
        <View style={styles.redLine} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        {/* KORISTIMO TAČNE NAZIVE IZ VAŠE BAZE */}
        <Text style={{ fontSize: 9 }}>Patient: {patient.patient_name || 'Anonymous'}</Text>
        <Text style={{ fontSize: 9 }}>
          Date: {patient.created_at ? new Date(patient.created_at).toLocaleDateString('en-US') : ''}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>a) Anamnesis Data</Text>
        <View style={styles.contentBox}>
          <Text>{patient.medical_note || 'No data provided.'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>b) Clinical Analysis</Text>
        <View style={styles.contentBox}>
          <Text>{analysis || '[ No analysis entered ]'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>c) Final Recommendation</Text>
        <View style={styles.contentBox}>
          <Text>{recommendation || '[ No recommendation entered ]'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          2026 MedExNews. Unauthorized Use Prohibited. {"\n"}
          This report is for informational PhD review purposes only.
        </Text>
      </View>
    </Page>
  </Document>
);

export default MedicalReportPDF;
