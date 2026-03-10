"use client";

import React, { useState } from "react";
import { 
  ClipboardList, 
  ChevronRight, 
  CheckCircle2
} from "lucide-react";

export default function RequestAnalysisForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
  });

  const nextStep = () => setStep(s => s + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="text-center p-12 bg-white rounded-[40px] shadow-2xl border-t-8 border-emerald-500 max-w-2xl mx-auto">
        <CheckCircle2 size={60} className="text-emerald-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-[#2E5481] uppercase italic tracking-tighter">Uspešno poslato!</h2>
        <button onClick={() => window.location.reload()} className="mt-8 bg-[#2E5481] text-white px-10 py-4 rounded-2xl font-black uppercase italic tracking-widest shadow-lg">Nova Analiza</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-4xl shadow-2xl overflow-hidden border border-slate-100">
      <div className="bg-[#2E5481] p-10 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-4 rounded-2xl">
            <ClipboardList className="text-white" size={30} />
          </div>
          <div>
             <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Digitalna Anamneza</h2>
             {/* ISPRAVKA: Obrisano duplo "italic italic" koje je pravilo grešku na liniji 55 */}
             <p className="text-[10px] uppercase font-black tracking-widest opacity-60 mt-1 italic">Cardiology Evidence Based Analysis</p>
          </div>
        </div>
        <div className="bg-[#E31E24] px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest">Step {step}/2</div>
      </div>

      <form onSubmit={handleSubmit} className="p-10">
        {step === 1 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Full Name</label>
                <input 
                  required
                  className="p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-700 transition-all shadow-inner"
                  placeholder="John Smith"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2">Age</label>
                <input 
                  required
                  type="number"
                  className="p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold text-slate-700 transition-all shadow-inner"
                  placeholder="45"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                />
              </div>
            </div>
            <button type="button" onClick={nextStep} className="w-full bg-[#2E5481] text-white p-6 rounded-2xl font-black uppercase italic tracking-widest flex items-center justify-center gap-3 hover:bg-blue-800 shadow-xl transition-all">
              Next Step <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 text-center">
            <p className="text-slate-500 font-bold italic uppercase text-xs tracking-widest">Ready to send your data for PhD analysis?</p>
            <button type="submit" className="w-full bg-[#E31E24] text-white p-6 rounded-2xl font-black uppercase italic tracking-widest shadow-2xl hover:bg-red-700 transition-all">
              {isSubmitting ? "Sending..." : "Confirm & Send"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}