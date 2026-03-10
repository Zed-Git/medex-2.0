"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// REŠENO: Definisan interfejs umesto "any"
interface PDFProps {
  patientData: {
    name: string;
    age: number;
  } | null;
  recommendation: string;
  reportId: string;
}

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica' },
  title: { fontSize: 24, marginBottom: 20, color: '#2E5481', fontWeight: 'bold' },
  section: { marginBottom: 15 },
  label: { fontSize: 10, color: '#64748b' },
  value: { fontSize: 14, marginBottom: 10, borderBottom: '1px solid #e2e8f0' }
});

const MedicalReportPDF = ({ patientData, recommendation, reportId }: PDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>MedExNews PhD Report</Text>
        <Text style={styles.label}>Report ID:</Text>
        <Text style={styles.value}>{reportId}</Text>
        <Text style={styles.label}>Patient:</Text>
        <Text style={styles.value}>{patientData?.name}</Text>
        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Recommendation:</Text>
          <Text style={{ fontSize: 12, lineHeight: 1.5 }}>{recommendation}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default MedicalReportPDF;