"use client";

import React, { useState } from 'react';
import { 
  ClipboardList, Heart, Activity, CheckCircle, 
  X, AlertCircle, Info, ChevronRight 
} from "lucide-react"; 

export interface AnamnesisData {
  age: string; sex: string; chestPain: string; heartRate: string; 
  shortnessOfBreath: string; riskFactors: string; cvHistory: string; 
  nonCvHistory: string; allergies: string; therapy: string; otherNotes: string;
}

export default function RequestAnalysisForm({ onSave }: { onSave?: (data: AnamnesisData) => void }) {
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [q, setQ] = useState<AnamnesisData>({
    age: '', sex: '', chestPain: '', heartRate: '', shortnessOfBreath: '',
    riskFactors: '', cvHistory: '', nonCvHistory: '', allergies: '',
    therapy: '', otherNotes: ''
  });

  const handleFinalSave = () => {
    if(!q.age || !q.sex) { alert("Please fill in Age and Sex."); return; }
    // NOVO (Zlatni Standard): Prvo emitujemo podatke, pa onda postavljamo success
    if (onSave) onSave(q); 
    setSuccess(true);
    // Automatsko zatvaranje modala nakon 1 sekunde radi boljeg UX-a
    setTimeout(() => {
      setShowModal(false);
    }, 1000);
  };

  if (success) return (
    <div className="p-12 text-center bg-white rounded-[40px] shadow-2xl border-2 border-emerald-500 text-slate-900 font-sans">
      <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
      <h2 className="text-3xl font-black uppercase italic text-[#2E5481]">Medical Data Saved</h2>
      <p className="text-slate-400 font-bold uppercase text-[10px] mt-2 tracking-widest leading-relaxed">Closing and returning to main form...</p>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-[35px] shadow-2xl border border-slate-100 max-w-2xl mx-auto text-left text-slate-900 font-sans">
      <div className="space-y-8 text-left">
        <div className="flex items-center gap-4 border-b-2 border-slate-50 pb-6">
           <div className="bg-blue-50 p-4 rounded-2xl text-[#2E5481] shadow-sm"><ClipboardList size={30}/></div>
           <div>
              <h2 className="text-2xl font-black uppercase italic text-[#2E5481] leading-none">Medical Data</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-2 italic">Section 1: Identification</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col border-b-2 border-slate-100 pb-2">
            <label htmlFor="anamnesis-age" className="text-[10px] font-black uppercase text-slate-600 italic mb-1">Age *</label>
            <input id="anamnesis-age" type="number" className="outline-none font-bold text-xl p-0 bg-transparent text-slate-800" value={q.age} onChange={e=>setQ({...q, age: e.target.value})} placeholder="45" />
          </div>
          <div className="flex flex-col border-b-2 border-slate-100 pb-2">
            <label htmlFor="anamnesis-sex" className="text-[10px] font-black uppercase text-slate-600 italic mb-1">Sex *</label>
            <select id="anamnesis-sex" className="outline-none font-bold text-sm bg-transparent uppercase cursor-pointer text-slate-800" value={q.sex} onChange={e=>setQ({...q, sex: e.target.value})}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select>
          </div>
        </div>

        <button type="button" onClick={() => setShowModal(true)} className={`w-full p-8 rounded-[30px] border-4 border-dashed transition-all flex items-center justify-between group ${q.chestPain ? 'bg-emerald-50 border-emerald-500' : 'bg-blue-50 border-[#2E5481] animate-pulse'}`}>
          <div className="flex items-center gap-4">
             <Heart className={q.chestPain ? 'text-red-500' : 'text-[#2E5481]'} size={32}/>
             <div>
                <span className="block font-black uppercase italic text-sm text-[#2E5481]">2-8. Full PhD Anamnesis</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Symptoms, Risk Factors, History & Therapy</span>
             </div>
          </div>
          <ChevronRight size={24} className="text-[#2E5481] group-hover:translate-x-2 transition-transform" />
        </button>

        <button type="button" onClick={handleFinalSave} className="w-full bg-[#E31E24] text-white py-6 rounded-2xl font-black uppercase italic tracking-widest shadow-xl hover:bg-red-700 transition-all leading-none">Confirm and Save Medical Data →</button>
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="questionnaire-modal-title"
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-[40px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border-4 border-[#2E5481]">
            <div className="p-6 bg-[#2E5481] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3"><Activity className="text-red-400" /><h2 id="questionnaire-modal-title" className="text-xl font-black uppercase italic leading-none">PhD Cardiology Questionnaire</h2></div>
              <button aria-label="Close questionnaire" onClick={() => setShowModal(false)} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 leading-none transition-all"><X size={24}/></button>
            </div>
            
            <div className="p-8 space-y-10 overflow-y-auto text-slate-900 text-left">
              <section className="space-y-6">
                 <h3 className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 flex items-center gap-2 leading-none"><AlertCircle size={18} className="text-red-500" /> 2. Symptoms & Complaints</h3>
                 <div className="space-y-4">
                    <div><label htmlFor="q-chest-pain" className="text-[10px] font-black uppercase text-slate-600 ml-2 italic">A. Chest Pain (Character, Location, Duration...)</label><textarea id="q-chest-pain" className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none focus:border-[#2E5481]" rows={2} value={q.chestPain} onChange={e=>setQ({...q, chestPain: e.target.value})} /></div>
                    <div><label htmlFor="q-heart-rate" className="text-[10px] font-black uppercase text-slate-600 ml-2 italic">B. Irregular Heartbeat (Pulse, dizzy spells, syncope...)</label><textarea id="q-heart-rate" className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none focus:border-[#2E5481]" rows={2} value={q.heartRate} onChange={e=>setQ({...q, heartRate: e.target.value})} /></div>
                    <div><label htmlFor="q-breath" className="text-[10px] font-black uppercase text-slate-600 ml-2 italic">C. Shortness of breath (When lying down, EF%...)</label><textarea id="q-breath" className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none focus:border-[#2E5481]" rows={2} value={q.shortnessOfBreath} onChange={e=>setQ({...q, shortnessOfBreath: e.target.value})} /></div>
                 </div>
              </section>

              <section className="space-y-4">
                 <h3 id="q-risk-heading" className="font-black uppercase italic text-[#E31E24] border-b-2 border-slate-100 pb-2 leading-none">3. Risk Factors</h3>
                 <textarea aria-labelledby="q-risk-heading" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none" rows={2} value={q.riskFactors} onChange={e=>setQ({...q, riskFactors: e.target.value})} placeholder="Smoking, Diabetes, HTN, Cholesterol, Obesity, Stress..." />
              </section>

              <section className="space-y-4">
                 <h3 id="q-cv-heading" className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 leading-none">4. Cardiovascular History</h3>
                 <textarea aria-labelledby="q-cv-heading" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none" rows={2} value={q.cvHistory} onChange={e=>setQ({...q, cvHistory: e.target.value})} placeholder="MI, Stents, Bypass, Arrhythmia, Pacemaker..." />
              </section>

              <section className="space-y-4">
                 <h3 id="q-noncv-heading" className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 leading-none">5. Non-cardiac History</h3>
                 <textarea aria-labelledby="q-noncv-heading" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none" rows={2} value={q.nonCvHistory} onChange={e=>setQ({...q, nonCvHistory: e.target.value})} placeholder="Stroke, other surgeries..." />
              </section>

              <section className="space-y-4">
                 <h3 id="q-allergies-heading" className="font-black uppercase italic text-red-600 border-b-2 border-slate-100 pb-2 leading-none">6. Allergies</h3>
                 <textarea aria-labelledby="q-allergies-heading" className="w-full p-4 bg-red-50/50 border border-red-100 rounded-2xl text-xs font-bold italic outline-none" rows={2} value={q.allergies} onChange={e=>setQ({...q, allergies: e.target.value})} />
              </section>

              <section className="space-y-4">
                 <h3 id="q-therapy-heading" className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 leading-none">7. Current Therapy</h3>
                 <textarea aria-labelledby="q-therapy-heading" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none" rows={2} value={q.therapy} onChange={e=>setQ({...q, therapy: e.target.value})} />
              </section>

              <section className="space-y-4 pb-10">
                 <h3 id="q-other-heading" className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 flex items-center gap-2 leading-none"><Info size={16}/> 8. Other Significant Information</h3>
                 <textarea aria-labelledby="q-other-heading" className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none" rows={2} value={q.otherNotes} onChange={e=>setQ({...q, otherNotes: e.target.value})} />
              </section>
            </div>
            <div className="p-8 bg-slate-50 border-t-2 text-center shrink-0">
               <button type="button" onClick={() => setShowModal(false)} className="w-full bg-[#2E5481] text-white py-6 rounded-3xl font-black uppercase italic shadow-xl hover:bg-blue-900 transition-all leading-none">Save & Return to Form</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



