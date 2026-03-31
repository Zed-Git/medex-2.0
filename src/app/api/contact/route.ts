// src/app/api/contact/route.ts
//
// [DODATO vs Zlatni standard] Kontakt forma sa Contact us stranice.
// Šalje poruku admin inbox-u preko Resend (email-service), ne čuva u bazi.

import { NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const raw: unknown = await req.json();
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const outcome = await sendContactFormEmail({ name, email, message });
    if (!outcome.ok) {
      return NextResponse.json(
        { error: outcome.errorMessage || 'E-mail send failed' },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

