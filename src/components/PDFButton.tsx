/* 
  FAZA: Napredna Automatizacija - Zadatak 1
  STATUS: Golden Standard 2.0 - PDF Button
  ZAKRPA: Rešen TypeScript Error "Missing properties" (VSC Problem 1)
*/

'use client';
import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MedicalReportPDF from './MedicalReportPDF';

// USKLAĐIVANJE: Interface mora biti identičan onom u bazi/PDF-u
interface PatientData {
  patient_name: string;
  patient_email: string;
  medical_note: string;
  created_at: string;
}

export default function PDFButton({ patient, analysis, recommendation }: { 
  patient: PatientData, 
  analysis?: string, 
  recommendation?: string 
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <div className="text-slate-400 text-[10px] font-black uppercase italic">Preparing...</div>;

  return (
    <PDFDownloadLink
      document={
        <MedicalReportPDF 
          patient={patient} 
          analysis={analysis} 
          recommendation={recommendation} 
        />
      }
      fileName={`Report_${(patient.patient_name || 'Patient').replace(/\s+/g, '_')}.pdf`}
      className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] rounded-2xl font-black uppercase shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
    >
      {({ loading }) => (loading ? 'Generating...' : '📄 Download PDF')}
    </PDFDownloadLink>
  );
}
