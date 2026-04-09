// src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

// [note.txt — ENV] U Next-u URL mora biti NEXT_PUBLIC_SUPABASE_URL (ne "SUPABASE_URL"); vidi .env.example.

let supabaseEnvWarned = false;

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

const urlOk = isValidHttpUrl(rawUrl);
const keyOk = rawKey.length > 0;

/**
 * [IZMENA — note.txt / ENV] Ranije: throw na load ako fali env → `next build` i prerender padaju
 * čim je u .env.local pogrešan URL (npr. slučajni tekst). Sada: sintaksički validan placeholder
 * da se build završi; u konzoli se jednom upozorava. Bez ispravnog .env.local CMS/fetch neće raditi.
 */
const supabaseUrl = urlOk
  ? rawUrl
  : "https://placeholder.invalid.supabase.co";
const supabaseAnonKey = urlOk && keyOk
  ? rawKey
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder";

if (!urlOk || !keyOk) {
  if (!supabaseEnvWarned) {
    supabaseEnvWarned = true;
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL ili NEXT_PUBLIC_SUPABASE_ANON_KEY nisu ispravno podešeni — koristim placeholder da build/prerender ne padaju. Popuni .env.local (puni https://....supabase.co URL i anon key).",
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});
