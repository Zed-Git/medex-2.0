/* 
  FAZA: Napredna Automatizacija - Zadatak 1
  STATUS: Golden Standard 2.3 - PDF Engine
*/

'use client';
import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MedicalReportPDF from './MedicalReportPDF';
import { Download, Eye } from 'lucide-react';

interface PatientData {
  patient_name: string;
  patient_email: string;
  medical_note: string;
  created_at: string;
}

interface PDFButtonProps {
  patient: PatientData;
  analysis?: string;
  recommendation?: string;
  references?: string;
  mode?: 'download' | 'review';
}

export default function PDFButton({ patient, analysis, recommendation, references, mode = 'download' }: PDFButtonProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <div className="text-slate-400 text-[10px] font-black uppercase">Syncing...</div>;

  const btnClass = mode === 'review' 
    ? "px-6 py-3 bg-blue-100 text-[#2E5481] rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 hover:bg-blue-200 transition-all border-2 border-blue-200 shadow-sm"
    : "px-6 py-2.5 bg-emerald-600 text-white text-[10px] rounded-2xl font-black uppercase shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2";

  return (
    <PDFDownloadLink
      document={<MedicalReportPDF patient={patient} analysis={analysis} recommendation={recommendation} references={references} />}
      fileName={`Report_${(patient.patient_name || 'Patient').replace(/\s+/g, '_')}.pdf`}
      className={btnClass}
    >
      {({ loading }) => (
        loading ? 'Generating...' : (
          <>
            {mode === 'review' ? <Eye size={14}/> : <Download size={14}/>}
            {mode === 'review' ? 'Review Final Report' : 'Download PDF'}
          </>
        )
      )}
    </PDFDownloadLink>
  );
}
