// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Proveravamo da li su podaci u .env.local pravilno upisani
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Kreiramo klijenta koji će pričati sa bazom
// Ako su URL ili Key prazni, ovde će izbaciti grešku, što je dobro za dijagnostiku
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* 
OBJAŠNJENJE: 
Premestili smo fajl u 'lib' folder jer je to 'apoteka' našeg projekta 
gde držimo sve eksterne servise.
*/