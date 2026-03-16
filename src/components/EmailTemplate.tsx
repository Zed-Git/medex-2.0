// src/components/EmailTemplate.tsx
import * as React from 'react';

// Ovo je "karton" pacijenta koji će Vama stići na email
interface EmailTemplateProps {
  firstName: string;
  email: string;
  urgency: string;
  description: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  email,
  urgency,
  description,
}) => (
  <div style={{
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f4f7f9',
    borderRadius: '10px'
  }}>
    <h2 style={{ color: '#2E5481' }}>🩺 MEDEX 2.0: Novi upit za analizu</h2>
    <p>Stigli su novi podaci od pacijenta:</p>
    <div style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2E5481' }}>
      <p><strong>Ime:</strong> {firstName}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Hitnost:</strong> <span style={{ color: urgency === 'Emergency' ? 'red' : 'green' }}>{urgency}</span></p>
      <p><strong>Opis:</strong> {description}</p>
    </div>
    <p style={{ fontSize: '11px', marginTop: '20px', color: '#888' }}>
      Ova poruka je automatski generisana. Podaci su upisani u Supabase bazu.
    </p>
  </div>
);
