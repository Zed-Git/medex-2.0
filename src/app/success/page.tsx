// src/app/success/page.tsx

'use client';

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// --- [FUNCTIONAL BLOCK: TYPES] ---
type PatientRequest = {
  id: string;
  patient_name: string | null;
  patient_email: string | null;
  status: 'pending' | 'paid' | 'cancelled' | string;
  /** Stored fee for Stripe Checkout (number or numeric string from DB). */
  price: number | string | null;
  analysis_preview_url: string | null;
  analysis_pdf_url: string | null;
  created_at: string;
};

// --- [FUNCTIONAL BLOCK: COMPONENT STATE] ---
function SuccessPageContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  /** Stripe Embedded Checkout dodaje `session_id` na return_url — koristi se za potvrdu ako webhook kasni. */
  const stripeSessionId = searchParams.get('session_id');
  /** Sprečava dupli verify za isti par id+session; novi session_id ponovo pokreće verify. */
  const verifyReturnKeyDone = useRef<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<PatientRequest | null>(null);
  /** Transparentni sloj iznad PDF preview-a pre uplate — blokira skrol i klik (Download). */
  const previewBlockerRef = useRef<HTMLDivElement>(null);

  // --- [FUNCTIONAL BLOCK: DATA FETCHING] ---
  useEffect(() => {
    async function fetchRequest() {
      if (!requestId) {
        setError('Missing request ID in URL.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('patient_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (error) {
          console.error('Error fetching patient request:', error);
          setError('Unable to load your analysis. Please try again later.');
        } else {
          setRequest(data as PatientRequest);
        }
      } catch (err: unknown) {
        // --- [FIXED - Replaced any → unknown + safe narrowing] ---
        if (err instanceof Error) {
          console.error('Unexpected error fetching patient request:', err);
        } else {
          console.error('Unexpected error fetching patient request (non-Error):', err);
        }
        setError('Unexpected error while loading your analysis.');
      } finally {
        setLoading(false);
      }
    }

    fetchRequest();
  }, [requestId]);

  // [DODATO 2026] Fulfillment kao webhook + kratki retry (Stripe ponekad kasni sa `payment_status` u API-ju).
  useEffect(() => {
    if (!requestId || !stripeSessionId) return;
    const verifyKey = `${requestId}:${stripeSessionId}`;
    if (verifyReturnKeyDone.current === verifyKey) return;
    verifyReturnKeyDone.current = verifyKey;

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    void (async () => {
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        try {
          const res = await fetch('/api/checkout/verify-return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: stripeSessionId,
              requestId,
            }),
          });
          if (res.ok) {
            const { data, error: qErr } = await supabase
              .from('patient_requests')
              .select('*')
              .eq('id', requestId)
              .single();
            if (!qErr && data) {
              setRequest(data as PatientRequest);
            }
            return;
          }
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          console.warn(
            '[success] verify-return:',
            res.status,
            j.error ?? '',
            `(attempt ${attempt}/4)`,
          );
        } catch (e: unknown) {
          console.warn('[success] verify-return fetch error', e);
        }
        if (attempt < 4) await sleep(2000);
      }
    })();
  }, [requestId, stripeSessionId]);

  // After Stripe redirect, the webhook often arrives a second later — first paint can still
  // show status `completed` (report ready) instead of `paid`. Poll briefly until DB catches up.
  useEffect(() => {
    if (!requestId || !request) return;
    if (request.status === 'paid') return;

    let attempts = 0;
    const maxAttempts = 45;
    const intervalMs = 2000;

    const id = setInterval(async () => {
      attempts += 1;
      if (attempts > maxAttempts) {
        clearInterval(id);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('patient_requests')
          .select('*')
          .eq('id', requestId)
          .single();
        if (!error && data) {
          setRequest(data as PatientRequest);
          if ((data as PatientRequest).status === 'paid') {
            clearInterval(id);
          }
        }
      } catch {
        /* ignore transient refetch errors */
      }
    }, intervalMs);

    return () => clearInterval(id);
    // `request` omitted on purpose: we only want to (re)start polling when id or payment status changes,
    // not when the same row is refetched with identical status.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [requestId, request?.status]);

  // [DODATO vs Zlatni standard] Pre uplate: transparentni sloj hvata wheel/touch; passive:false je
  // neophodan da preventDefault stvarno zaustavi skrolovanje unutar ugrađenog PDF pregledača.
  useLayoutEffect(() => {
    if (!request || request.status === 'paid' || !request.analysis_preview_url) {
      return;
    }
    const el = previewBlockerRef.current;
    if (!el) return;
    const blockScrollAndPassThrough = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', blockScrollAndPassThrough, { passive: false });
    el.addEventListener('touchmove', blockScrollAndPassThrough, { passive: false });
    return () => {
      el.removeEventListener('wheel', blockScrollAndPassThrough);
      el.removeEventListener('touchmove', blockScrollAndPassThrough);
    };
  }, [request]);

  // --- [FUNCTIONAL BLOCK: LOADING & ERROR STATES] ---
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-slate-800">
            Loading your analysis...
          </h1>
          <p className="text-sm text-slate-500">
            Please wait while we retrieve your report details.
          </p>
        </div>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-red-600">
            Unable to display your analysis
          </h1>
          <p className="text-sm text-slate-600">
            {error || 'The requested analysis could not be found.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  // --- [FUNCTIONAL BLOCK: STATUS LOGIC] ---
  const isPaid = request.status === 'paid';
  const hasPreview = !!request.analysis_preview_url;
  const hasFullPdf = !!request.analysis_pdf_url;
  // [IZMENA 2026] Plaćanje tek nakon što ekspert završi izveštaj (finalize-expert-report):
  // status `completed` i/ili uploadovan preview PDF. Do tada samo poruka — nema Stripe dugmeta.
  const waitingForExpert =
    !isPaid &&
    request.status !== 'completed' &&
    !hasPreview;
  const canStartCheckout =
    !isPaid && (request.status === 'completed' || hasPreview);

  // [IZMENA vs Zlatni standard] Plaćanje ide na /pay (Embedded Stripe + isti vizuelni omotač kao landing).

  // --- [FUNCTIONAL BLOCK: MAIN SUCCESS UI] ---
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* --- [SUB-BLOCK: HEADER] --- */}
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Your Cardiology Analysis
          </h1>
          <p className="text-sm text-slate-600">
            Request ID: <span className="font-mono">{request.id}</span>
          </p>
          <p className="text-sm text-slate-600">
            Status:{' '}
            <span
              className={
                isPaid
                  ? 'text-emerald-600 font-semibold'
                  : 'text-amber-600 font-semibold'
              }
            >
              {isPaid ? 'Paid' : request.status || 'Pending'}
            </span>
          </p>
        </header>

        {/* [KOREKCIJA 2026] Posle povratka sa Stripe-a PDF se još generiše u pozadini — korisnik vidi zašto „čeka“. */}
        {stripeSessionId && !isPaid && (
          <section
            className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <p className="font-semibold">Confirming your payment…</p>
            <p className="mt-1 text-sky-900/90 leading-relaxed">
              We are finalizing your report on the server. This usually takes a few
              seconds. This page will refresh automatically. If the status does not
              change after about a minute, reload the page once.
            </p>
          </section>
        )}

        {/* [DODATO 2026 — UX posle Stripe-a] Jasna potvrda na sajtu + upućivanje na mejl (tekst na engleskom). */}
        {isPaid && (
          <section
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-emerald-900">
              Payment successful — thank you.
            </p>
            <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
              We have sent a confirmation and your full report details to the
              e-mail address we have on file for this request. Please{' '}
              <strong>check your inbox</strong> (and your spam or promotions
              folder). You can also keep this page open — the download button
              below will appear as soon as your file is ready.
            </p>
            {request.patient_email?.trim() && (
              <p className="mt-2 text-xs text-emerald-700/90">
                Sent to:{' '}
                <span className="font-mono">{request.patient_email.trim()}</span>
              </p>
            )}
          </section>
        )}

        {/* --- [SUB-BLOCK: PATIENT & CONTEXT INFO] --- */}
        <section className="rounded-lg border bg-white p-4 space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Patient and request details
          </h2>
          <p className="text-sm text-slate-700">
            <span className="font-medium">Patient:</span>{' '}
            {request.patient_name || 'Not specified'}
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-medium">Service:</span>{' '}
            PhD Cardiology Analysis Report
          </p>
          {request.price !== null && request.price !== undefined && (
            <p className="text-sm text-slate-700">
              <span className="font-medium">Price:</span> $
              {typeof request.price === 'number'
                ? request.price
                : request.price}
            </p>
          )}
          <p className="text-xs text-slate-500">
            This report has been prepared by a cardiology expert based on your
            submitted request.
          </p>
        </section>

        {/* --- [SUB-BLOCK: PREVIEW SECTION] --- */}
        <section className="rounded-lg border bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Analysis preview
          </h2>
          <p className="text-sm text-slate-600">
            Below you can see a preview of your analysis. This preview is
            intended to give you an overview of the structure and content of
            your final report.
          </p>

          {hasPreview ? (
            <div className="space-y-2">
              {/* [IZMENA od „Zlatnog standarda“ — mart 2026 + dopuna]
                  Pre uplate: (1) sečen prikaz; (2) PUN transparentni sloj iznad iframe-a (z-20) blokira
                  klik na „Download“ u PDF toolbar-u i skrolovanje; (3) useLayoutEffect + wheel/touchmove
                  sa passive:false za browsere gde je potrebno. Posle uplate: normalan iframe.
                  Pun download i dalje SAMO u sekciji „Download full analysis“ kada je paid. */}
              {!isPaid && (
                <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  On-screen preview only: a fixed portion of the report is shown.
                  Scrolling and saving the preview are disabled until your payment
                  is complete. Your full PDF download will unlock below after
                  payment is confirmed.
                </p>
              )}
              <div
                className={
                  !isPaid
                    ? 'relative max-h-[min(26rem,52vh)] min-h-56 overflow-hidden rounded-md border bg-slate-100'
                    : 'overflow-hidden rounded-md border bg-slate-100'
                }
              >
                <iframe
                  src={request.analysis_preview_url || ''}
                  className={
                    !isPaid
                      ? 'relative z-0 block h-[min(36rem,75vh)] w-full border-0'
                      : 'h-96 w-full border-0'
                  }
                  title="Analysis preview"
                  tabIndex={!isPaid ? -1 : undefined}
                />
                {!isPaid && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-linear-to-t from-slate-100 to-transparent"
                      aria-hidden
                    />
                    <div
                      ref={previewBlockerRef}
                      role="presentation"
                      className="absolute inset-0 z-20 cursor-default touch-none select-none bg-transparent"
                      aria-hidden
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Preview is not available for this request.
            </p>
          )}

          {!isPaid && (
            <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3 space-y-3">
              {waitingForExpert ? (
                <p className="text-sm text-amber-800">
                  Your request is under expert review. When your preview report is
                  ready, you will receive an e-mail with a link to this page. You
                  will then be able to review the preview and proceed to secure
                  payment for the full PDF.
                </p>
              ) : (
                <>
                  <p className="text-sm text-amber-800">
                    Review the preview above when available. When you are ready,
                    complete secure payment to unlock the full downloadable PDF.
                    After payment is confirmed, the download button will appear
                    below.
                  </p>
                  {canStartCheckout && (
                    <Link
                      href={`/pay?requestId=${encodeURIComponent(String(request.id))}`}
                      className="inline-flex w-full sm:w-auto items-center justify-center rounded-md bg-[#2E5481] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[#1e3a5f]"
                    >
                      Proceed to secure payment (Stripe)
                    </Link>
                  )}
                  <p className="text-xs text-amber-800/90">
                    Payment opens on a MedExNews-branded page (same header and
                    background as our main site), then continues through
                    Stripe&apos;s secure checkout. You can return to this report
                    using the same link if you cancel.
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        {/* --- [SUB-BLOCK: DOWNLOAD SECTION] --- */}
        <section className="rounded-lg border bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Download full analysis
          </h2>

          {isPaid && hasFullPdf ? (
            <>
              <p className="text-sm text-slate-600">
                Your payment has been confirmed. You can now download your full
                cardiology analysis report as a secure PDF file.
              </p>
              <a
                href={request.analysis_pdf_url || '#'}
                download
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Download full PDF report
              </a>
            </>
          ) : (
            <div className="rounded-md bg-slate-50 border border-slate-200 p-3 space-y-2">
              <p className="text-sm text-slate-600">
                The full PDF report will be available for download once your
                payment is fully confirmed and the report is finalized.
              </p>
              <p className="text-xs text-slate-500">
                If you have already completed your payment, please wait a few
                moments for the system to update, or refresh this page.
              </p>
            </div>
          )}
        </section>

        {/* --- [SUB-BLOCK: NAVIGATION LINKS] --- */}
        <section className="flex flex-wrap gap-3">
          <Link
            href="/admin-zdravko"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Go to admin panel
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Back to home
          </Link>
        </section>
      </div>
    </main>
  );
}

// Next.js 15+: `useSearchParams()` must be under `<Suspense>` for static generation.
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-600 text-sm">Loading…</p>
        </main>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}
