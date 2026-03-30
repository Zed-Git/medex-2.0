-- Expert text + preview URL for Medex 2.0 workflow (admin finalize → patient 2nd e-mail → Stripe).
-- Run in Supabase SQL Editor if these columns are missing.

ALTER TABLE public.patient_requests
  ADD COLUMN IF NOT EXISTS analysis text,
  ADD COLUMN IF NOT EXISTS recommendation text;

-- "references" is a reserved word in SQL — quoted identifier matches PostgREST / JS client.
ALTER TABLE public.patient_requests
  ADD COLUMN IF NOT EXISTS "references" text;

ALTER TABLE public.patient_requests
  ADD COLUMN IF NOT EXISTS analysis_preview_url text;

COMMENT ON COLUMN public.patient_requests.analysis_preview_url IS
  'Public URL of preview PDF (watermarked) before payment; set by /api/finalize-expert-report.';
