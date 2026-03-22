// src/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

// --- 1. Učitavanje iz .env.local ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- 2. Validacija (obavezno) ---
if (!supabaseUrl) {
  throw new Error("❌ Supabase URL nije pronađen! Proveri NEXT_PUBLIC_SUPABASE_URL u .env.local");
}

if (!supabaseAnonKey) {
  throw new Error("❌ Supabase Anon Key nije pronađen! Proveri NEXT_PUBLIC_SUPABASE_ANON_KEY u .env.local");
}

// --- 3. Kreiranje klijenta ---
// Ovo je jedini ispravan način da Next.js radi sa Supabase-om
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // server actions ne koriste sesije
  },
});

