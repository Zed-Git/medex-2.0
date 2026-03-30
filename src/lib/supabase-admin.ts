// src/lib/supabase-admin.ts
//
// --- [FUNCTIONAL BLOCK: SERVER-ONLY SUPABASE (SERVICE ROLE)] ---
// [DODATO vs Zlatni Standard]
// Patient form Server Action previously used the anon Supabase client. If RLS policies
// block anonymous INSERT into patient_requests, the row never saves and the user sees
// no success flow. The service role is used only on the server (this module must never
// be imported from Client Components).
// ---

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Server configuration error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for saving requests.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
