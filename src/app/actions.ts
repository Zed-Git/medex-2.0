// src/app/actions.ts
'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { EmailTemplate } from '@/components/EmailTemplate';
import { render } from '@react-email/render';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function submitMedicalRequest(formData: FormData) {
  try {
    const name = formData.get('fullName') as string; 
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const urgency = formData.get('urgency') as string;
    const description = formData.get('description') as string;
    const file = formData.get('medicalFile') as File;

    let filePath: string | null = null;

    // 1. Storage Upload (Ovo Vam radi!)
    if (file && file.size > 0) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('medical-files').upload(fileName, file);
        if (!error) filePath = data.path;
      } catch (e) {
        console.error('Storage problem:', e);
      }
    }

    // 2. Upis u bazu (Ovo Vam radi!)
    const { error: dbError } = await supabase
      .from('patient_requests')
      .insert([
        { 
          patient_name: name,      
          patient_email: email,    
          phone: phone || 'N/A', 
          urgency_level: urgency,  
          medical_note: description, 
          description: description,
          file_url: filePath 
        },
      ]);

    if (dbError) throw new Error(dbError.message);

    // 3. SLANJE EMAILA - POPRAVLJENA PROCEDURA
    try {
      // Rešavamo TypeScript grešku: kreiramo React element eksplicitno
      const template = React.createElement(EmailTemplate, {
        firstName: name,
        email: email,
        urgency: urgency,
        description: description,
      });

      // Pretvaramo u HTML
      const emailHtml = await render(template);

      const emailResult = await resend.emails.send({
        from: 'MEDEX <onboarding@resend.dev>',
        to: ['mdzdravko@gmail.com'], // Mora biti mejl sa kojim ste se registrovali na Resend!
        subject: `🚨 ${urgency} - Pacijent: ${name}`,
        html: emailHtml,
      });

      if (emailResult.error) {
        console.error('RESEND GREŠKA (401 verovatno):', emailResult.error);
      } else {
        console.log('✅ MEJL JE POSLAT USPEŠNO!');
      }

    } catch (emailErr) {
      console.error('Greška pri crtanju mejla:', emailErr);
    }

    return { success: true, message: 'Success' };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: msg };
  }
}