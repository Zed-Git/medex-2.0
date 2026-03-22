// src/app/success/page.tsx

'use client';

// --- [FUNCTIONAL BLOCK: IMPORTS] ---
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// --- [FUNCTIONAL BLOCK: TYPES] ---
type PatientRequest = {
  id: string;
  patient_name: string | null;
  status: 'pending' | 'paid' | 'cancelled' | string;
  price: number | null;
  analysis_preview_url: string | null;
  analysis_pdf_url: string | null;
  created_at: string;
};

// --- [FUNCTIONAL BLOCK: COMPONENT STATE] ---
export default function SuccessPage() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<PatientRequest | null>(null);

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
          {request.price !== null && (
            <p className="text-sm text-slate-700">
              <span className="font-medium">Price:</span> ${request.price}
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
            <div className="border rounded-md overflow-hidden bg-slate-100">
              <iframe
                src={request.analysis_preview_url || ''}
                className="w-full h-96 border-0"
                title="Analysis preview"
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Preview is not available for this request.
            </p>
          )}

          {!isPaid && (
            <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                Your payment is still being processed or has not been completed
                yet. Once your payment is confirmed, you will be able to
                download the full analysis report as a secure PDF document.
              </p>
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


