// src/app/api/contact/route.ts
//
// [DODATO vs Zlatni standard] Kontakt forma sa Contact us stranice.
// Šalje poruku admin inbox-u preko Resend (email-service), ne čuva u bazi.

import { NextRequest, NextResponse } from 'next/server';
import { sendContactFormEmail } from '@/lib/email-service';

// [DODATO — Turnstile] Server-side verifikacija Cloudflare Turnstile tokena
// Vraća true ako prođe, ili ako TURNSTILE_SECRET_KEY nije konfigurisan (graceful degradation)
async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true; // Graceful: bez ključa lokalni dev radi normalno
  if (!token) return false; // Secret postoji ali token fali — odbij
  try {
    const body = new URLSearchParams();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[contact] Turnstile greška:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw: unknown = await req.json();
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    // [DODATO — Turnstile] Provjeri CAPTCHA token
    const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
    const clientIp =
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for') ??
      undefined;
    const captchaOk = await verifyTurnstileToken(turnstileToken, clientIp ?? undefined);
    if (!captchaOk) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed.' },
        { status: 400 },
      );
    }

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

