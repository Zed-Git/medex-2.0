// src/components/RequestAnalysisForm.tsx
'use client';

import React, { useState } from 'react';
import { submitMedicalRequest } from '@/app/actions';

export const RequestAnalysisForm = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (file) formData.append('medicalFile', file);

    setLoading(true);
    const result = await submitMedicalRequest(formData);

    if (result.success) {
      setStatus('success');
      setFile(null);
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus('error');
      // ISPRAVKA: Ovde je bila greška! 
      // Koristimo result.message jer je to polje koje šalje naša funkcija iz actions.ts
      console.error(result.message);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-xl font-bold text-[#2E5481]">Podaci o pacijentu</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">Ime i prezime *</label>
        <input name="firstName" required className="w-full p-2 border rounded-md" placeholder="Dr. Marko Marković" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input name="email" type="email" required className="w-full p-2 border rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Opis tegoba *</label>
        <textarea name="description" required className="w-full p-2 border rounded-md" rows={4} />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3 bg-[#2E5481] text-white rounded-xl font-bold hover:bg-[#1e3a5a] transition-colors"
      >
        {loading ? "Slanje u toku..." : "POŠALJI NA ANALIZU"}
      </button>

      {status === 'success' && <p className="text-green-600 font-medium">Uspešno poslato!</p>}
      {status === 'error' && <p className="text-red-600 font-medium">Greška pri slanju. Pokušajte ponovo.</p>}
    </form>
  );
};

