'use client';

// =============================================================================
// [DODATO vs Zlatni standard] Embedded Stripe Checkout na domeni aplikacije.
// Omogućava PaymentFlowShell (medback1.webp + header/footer kao landing).
// =============================================================================

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import PaymentFlowShell from '@/components/PaymentFlowShell';

type PatientRequest = {
  id: string;
  patient_name: string | null;
  patient_email: string | null;
  status: string;
  price: number | string | null;
  analysis_preview_url: string | null;
};

function PayPageInner() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Povećaj da se ponovo pokrene Embedded Checkout (npr. posle „Something went wrong“). */
  const [checkoutEpoch, setCheckoutEpoch] = useState(0);
  const [request, setRequest] = useState<PatientRequest | null>(null);
  const requestRef = useRef<PatientRequest | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<StripeEmbeddedCheckout | null>(null);
  /** Isti client_secret za sve ponovne pozive fetchClientSecret (Stripe + React Strict Mode). */
  const clientSecretCacheRef = useRef<string | null>(null);

  requestRef.current = request;

  useEffect(() => {
    clientSecretCacheRef.current = null;
  }, [requestId]);

  useEffect(() => {
    if (!requestId) {
      setError('Missing request ID. Open this page from your report link.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data, error: rowError } = await supabase
          .from('patient_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        if (cancelled) return;
        if (rowError || !data) {
          setError('Unable to load your request.');
          setLoading(false);
          return;
        }
        const row = data as PatientRequest;
        setRequest(row);
      } catch {
        if (!cancelled) setError('Unexpected error while loading your request.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const isPaid = request?.status === 'paid';
  const hasPreview = !!request?.analysis_preview_url;
  const canPay =
    request &&
    !isPaid &&
    (request.status === 'completed' || hasPreview);

  // [KOREKCIJA 2026] Ne vezujemo efekat za `price` iz state-a — promena NaN→broj je ponovo pokretala
  // checkout i Stripe je javljao "Something went wrong" / istek sesije. Cenu čitamo iz requestRef u fetchClientSecret.

  useLayoutEffect(() => {
    if (!canPay || !requestId) return;

    const mountEl = mountRef.current;
    if (!mountEl) return;

    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    if (!pk) {
      setError('Payment configuration is missing (publishable key).');
      return;
    }

    let destroyed = false;

    (async () => {
      const stripe = await loadStripe(pk);
      if (!stripe || destroyed) return;

      try {
        const embedded = await stripe.initEmbeddedCheckout({
          fetchClientSecret: async () => {
            if (clientSecretCacheRef.current) {
              return clientSecretCacheRef.current;
            }
            const r = requestRef.current;
            if (!r) throw new Error('Request not loaded');

            const body: Record<string, unknown> = {
              requestId: r.id,
              patientName: r.patient_name?.trim() || 'Patient',
              patientEmail: r.patient_email?.trim() || null,
            };
            const p =
              r.price === null || r.price === undefined ? NaN : Number(r.price);
            if (Number.isFinite(p) && p > 0) {
              body.price = p;
            }

            const res = await fetch('/api/checkout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });
            const data: unknown = await res.json();
            const payload = data as {
              clientSecret?: string;
              error?: string;
              details?: string;
            };
            if (!res.ok) {
              throw new Error(
                payload.details ||
                  payload.error ||
                  `Checkout failed (${res.status})`,
              );
            }
            if (!payload.clientSecret) {
              throw new Error('No checkout session from server.');
            }
            clientSecretCacheRef.current = payload.clientSecret;
            return payload.clientSecret;
          },
        });

        if (destroyed) {
          embedded.destroy();
          return;
        }

        checkoutRef.current = embedded;
        embedded.mount(mountEl);
      } catch (e: unknown) {
        if (!destroyed) {
          setError(
            e instanceof Error ? e.message : 'Could not start secure checkout.',
          );
        }
      }
    })();

    return () => {
      destroyed = true;
      checkoutRef.current?.destroy();
      checkoutRef.current = null;
    };
  }, [canPay, requestId, checkoutEpoch]);

  const backHref = requestId
    ? `/success?id=${encodeURIComponent(requestId)}`
    : '/';

  if (!requestId) {
    return (
      <PaymentFlowShell>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
          <p className="rounded-xl bg-white/95 p-6 text-center text-sm text-red-700 shadow-lg">
            {error}
          </p>
          <Link
            href="/"
            className="mt-6 text-center text-sm font-semibold text-[#2E5481] underline"
          >
            Back to home
          </Link>
        </main>
      </PaymentFlowShell>
    );
  }

  if (loading) {
    return (
      <PaymentFlowShell>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-16">
          <p className="text-center text-sm font-medium text-white drop-shadow-md">
            Loading secure payment…
          </p>
        </main>
      </PaymentFlowShell>
    );
  }

  if (error && !request) {
    return (
      <PaymentFlowShell>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
          <p className="rounded-xl bg-white/95 p-6 text-center text-sm text-red-700 shadow-lg">
            {error}
          </p>
          <Link
            href={backHref}
            className="mt-6 text-center text-sm font-semibold text-[#2E5481] underline"
          >
            Back to your report
          </Link>
        </main>
      </PaymentFlowShell>
    );
  }

  if (request && isPaid) {
    return (
      <PaymentFlowShell>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
          <p className="rounded-xl bg-white/95 p-6 text-center text-sm text-slate-800 shadow-lg">
            This report is already paid. You can return to your analysis page for
            the download link.
          </p>
          <Link
            href={backHref}
            className="mt-8 inline-flex justify-center rounded-md bg-[#2E5481] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#1e3a5f]"
          >
            Open your report
          </Link>
        </main>
      </PaymentFlowShell>
    );
  }

  if (request && !canPay) {
    return (
      <PaymentFlowShell>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
          <p className="rounded-xl bg-white/95 p-6 text-center text-sm text-amber-900 shadow-lg">
            Your expert report is not ready for payment yet. Please use the link
            from your e-mail when the preview is available.
          </p>
          <Link
            href={backHref}
            className="mt-6 text-center text-sm font-semibold text-[#2E5481] underline"
          >
            Back to your report
          </Link>
        </main>
      </PaymentFlowShell>
    );
  }

  return (
    <PaymentFlowShell>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-8 md:py-12">
        <div className="mb-6 rounded-2xl border border-white/40 bg-white/95 p-5 text-center shadow-xl backdrop-blur-sm md:p-6">
          <h1 className="text-lg font-bold text-[#2E5481] md:text-xl">
            Secure payment
          </h1>
          <p className="mt-2 text-xs text-slate-600 md:text-sm">
            Complete your payment below. You will return to your report when the
            transaction is finished.
          </p>
          {(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '').includes(
            'pk_test',
          ) ? (
            <p className="mt-3 text-[11px] text-slate-500">
              Test mode: use card{' '}
              <span className="font-mono">4242 4242 4242 4242</span>, any future
              expiry, any CVC. Numbers like 1234… are not valid Stripe test cards.
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 space-y-3 rounded-lg bg-red-50 p-3 text-center text-sm text-red-800">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                clientSecretCacheRef.current = null;
                checkoutRef.current?.destroy();
                checkoutRef.current = null;
                setError(null);
                setCheckoutEpoch((e) => e + 1);
              }}
              className="rounded-lg bg-[#2E5481] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow hover:bg-[#1e3a5f]"
            >
              Try loading payment again
            </button>
          </div>
        ) : null}

        <div
          ref={mountRef}
          className="min-h-[420px] w-full overflow-hidden rounded-2xl bg-white p-2 shadow-2xl md:p-4"
        />

        <Link
          href={backHref}
          className="mt-8 block text-center text-sm font-medium text-white underline drop-shadow-md"
        >
          Cancel and return to your report
        </Link>
      </main>
    </PaymentFlowShell>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <PaymentFlowShell>
          <main className="flex flex-1 items-center justify-center px-4 py-16">
            <p className="text-sm font-medium text-white drop-shadow">Loading…</p>
          </main>
        </PaymentFlowShell>
      }
    >
      <PayPageInner />
    </Suspense>
  );
}
