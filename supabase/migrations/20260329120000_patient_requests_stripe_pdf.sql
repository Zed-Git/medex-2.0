-- Required by Stripe webhook: src/app/api/webhook/route.ts
-- Fixes PostgREST PGRST204: "Could not find the 'analysis_pdf_url' column..."
-- Run once in Supabase → SQL Editor (as postgres), then Table Editor → refresh if needed.

ALTER TABLE public.patient_requests
  ADD COLUMN IF NOT EXISTS analysis_pdf_url text,
  ADD COLUMN IF NOT EXISTS payment_intent_id text;

COMMENT ON COLUMN public.patient_requests.analysis_pdf_url IS
  'Public URL of the final PDF after checkout.session.completed (Medex 2.0 webhook).';

COMMENT ON COLUMN public.patient_requests.payment_intent_id IS
  'Stripe PaymentIntent id after successful Checkout (test or live).';
