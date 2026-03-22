/* 
  FAZA: Napredna Automatizacija - Zadatak 2
  STATUS: Golden Standard 2.8 (Email Template Fixed)
  ZAKRPA: Rešen VSC Problem (react/no-unescaped-entities) korišćenjem &apos;
*/

import * as React from 'react';

interface EmailTemplateProps {
  patientName: string;
  reportId: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  patientName,
  reportId,
}) => (
  <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#2E5481', lineHeight: '1.6' }}>
    <h1 style={{ color: '#2E5481', borderBottom: '2px solid #E31E24', paddingBottom: '10px' }}>
      MEDEXNEWS <span style={{ color: '#E31E24' }}>AI</span>
    </h1>
    <p>Dear <strong>{patientName}</strong>,</p>
    {/* ZLATNI STANDARD: Koristimo &apos; umesto običnog apostrofa za stabilnost */}
    <p>We are pleased to inform you that your <strong>PhD Cardiology Analysis</strong> has been completed by Dr. Zdravko&apos;s expert team.</p>
    
    <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '15px', border: '1px solid #E1EBF5' }}>
      <p style={{ margin: '0' }}><strong>Report Reference:</strong> {reportId}</p>
      <p style={{ margin: '10px 0 0 0' }}><strong>Status:</strong> <span style={{ color: '#10B981' }}>READY FOR DOWNLOAD</span></p>
    </div>

    <p>To access your full clinical report, please visit our portal and complete the secure payment process.</p>
    
    <a href="https://medexnews.ai/dashboard" style={{
      display: 'inline-block',
      backgroundColor: '#2E5481',
      color: 'white',
      padding: '12px 25px',
      borderRadius: '10px',
      textDecoration: 'none',
      fontWeight: 'bold',
      marginTop: '20px'
    }}>
      View My Report
    </a>

    <hr style={{ marginTop: '40px', border: 'none', borderTop: '1px solid #e2e8f0' }} />
    <p style={{ fontSize: '10px', color: '#64748b' }}>
      Note: This is an automated notification. Please do not reply directly to this email. 
      The report should be discussed with your primary physician.
    </p>
    <p style={{ fontSize: '10px', color: '#2E5481' }}>
      © 2026 MedExNews AI | Evidence Based Cardiology Review
    </p>
  </div>
);


