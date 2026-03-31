// src/app/api/cms/upload/route.ts
//
// [DODATO vs Zlatni standard] Upload endpoint za CMS Editor (admin).
// Razlog: javne (anon) Supabase Storage politike često ne dozvoljavaju upload iz browser-a.
// Ova ruta koristi service role preko getSupabaseAdmin() i vraća public URL fajla.
//
// UI tekst ostaje na engleskom (admin već ima engleski); komentari su sr/hr.

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const CMS_ASSETS_BUCKET = 'medical-files';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const prefixRaw = form.get('prefix');
    const prefix =
      typeof prefixRaw === 'string' && prefixRaw.trim()
        ? prefixRaw.trim()
        : 'cms';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const ext =
      typeof file.name === 'string' && file.name.includes('.')
        ? file.name.split('.').pop()
        : '';
    const safeExt = (ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const name = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

    const admin = getSupabaseAdmin();
    const { error: upErr } = await admin.storage
      .from(CMS_ASSETS_BUCKET)
      .upload(name, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (upErr) {
      return NextResponse.json(
        { error: 'Upload failed', details: upErr.message },
        { status: 500 },
      );
    }

    const { data } = admin.storage.from(CMS_ASSETS_BUCKET).getPublicUrl(name);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown upload error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

