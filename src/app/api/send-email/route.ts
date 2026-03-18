/* 
  FAZA: Napredna Automatizacija - Zadatak 2
  STATUS: Golden Standard 2.9 (Email Engine Fix)
  LANGUAGE: English
*/

import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { EmailTemplate } from '@/components/EmailTemplate';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { patientEmail, patientName, reportId } = await request.json();

    console.log(`Clinical Dispatch: Notifying ${patientEmail}`);

    const { data, error } = await resend.emails.send({
      from: 'MedExNews AI <onboarding@resend.dev>',
      to: ['mdzdravko@gmail.com'], // Slanje Vama radi testiranja
      subject: `Clinical Analysis Ready: ${patientName}`,
      react: EmailTemplate({ patientName, reportId }) as React.ReactElement,
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ message: 'Success', data });
    
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
