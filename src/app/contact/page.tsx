'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      const payload = data as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || `Request failed (${res.status})`);
      }
      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    }
  }

  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#E31E24] italic">
            Company
          </p>
          <h1 className="text-3xl font-black tracking-tighter italic text-[#2E5481]">
            Contact us
          </h1>
          <p className="text-sm text-slate-600">
            For general inquiries, please reach out using the contact details
            below.
          </p>
        </header>

        <section className="rounded-2xl border border-white/50 bg-white/85 backdrop-blur-md p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Send us a message</h2>
          <p className="text-sm text-slate-600">
            Fill out the form below and we will forward your message to our
            support inbox.
          </p>

          {status === 'sent' && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Your message has been sent successfully.
            </div>
          )}
          {status === 'error' && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                Name <span className="text-[#E31E24]">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-800 outline-none focus:border-[#2E5481]"
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                Email <span className="text-[#E31E24]">*</span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-800 outline-none focus:border-[#2E5481]"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                Message <span className="text-[#E31E24]">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800 outline-none focus:border-[#2E5481]"
                placeholder="Write your message…"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-2xl bg-[#2E5481] px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow hover:bg-[#1e3a5f] disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border bg-white p-6 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Medical emergencies</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            MedExNews does not provide emergency services. If you have urgent
            symptoms or believe you are experiencing a medical emergency, call
            your local emergency number immediately.
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-[#2E5481] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#1e3a5f]"
          >
            Back to home
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            About
          </Link>
        </div>
      </div>
    </main>
  );
}

