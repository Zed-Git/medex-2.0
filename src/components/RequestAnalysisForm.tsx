"use client";

import React, { useState } from 'react';
import { 
  ClipboardList, Heart, Activity, CheckCircle, 
  X, AlertCircle, Info 
} from "lucide-react"; 

interface AnamnesisData {
  age: string; sex: string;
  // 2. Symptoms
  chestPain: string; heartRate: string; shortnessOfBreath: string;
  // 3. Risk Factors
  riskFactors: string;
  // 4. CV History
  cvHistory: string;
  // 5. Non-cardiac History
  nonCvHistory: string;
  // 6. Allergies
  allergies: string;
  // 7. Current Therapy
  therapy: string;
  // 8. Other
  otherNotes: string;
}

export default function RequestAnalysisForm() {
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [q, setQ] = useState<AnamnesisData>({
    age: '', sex: '', chestPain: '', heartRate: '', shortnessOfBreath: '',
    riskFactors: '', cvHistory: '', nonCvHistory: '', allergies: '',
    therapy: '', otherNotes: ''
  });

  const handleSave = () => {
    if(!q.age || !q.sex) { alert("Please fill in Age and Sex."); return; }
    setShowModal(false);
  };

  if (success) return (
    <div className="p-12 text-center bg-white rounded-[40px] shadow-2xl border-2 border-emerald-500 text-slate-900">
      <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
      <h2 className="text-3xl font-black uppercase italic text-[#2E5481]">Data Saved Successfully</h2>
      <button onClick={() => window.location.reload()} className="bg-[#2E5481] text-white px-10 py-4 rounded-2xl font-black mt-6 uppercase tracking-widest">New Request</button>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-[35px] shadow-2xl border border-slate-100 max-w-2xl mx-auto text-left text-slate-900 font-sans">
      <div className="space-y-8 text-left">
        <div className="flex items-center gap-4 border-b-2 border-slate-50 pb-6 text-left">
           <div className="bg-blue-50 p-4 rounded-2xl text-[#2E5481] shadow-sm"><ClipboardList size={30}/></div>
           <div className="text-left">
              <h2 className="text-2xl font-black uppercase italic text-[#2E5481] leading-none text-left">Medical Data</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-2 text-left">Section 1: Identification</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-left">
          <div className="flex flex-col border-b-2 border-slate-100 pb-2 text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1 leading-none text-left">Age *</label>
            <input type="number" className="outline-none font-bold text-xl p-0 bg-transparent text-slate-800" value={q.age} onChange={e=>setQ({...q, age: e.target.value})} placeholder="45" />
          </div>
          <div className="flex flex-col border-b-2 border-slate-100 pb-2 text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1 leading-none text-left">Sex *</label>
            <select className="outline-none font-bold text-sm bg-transparent uppercase cursor-pointer text-slate-800" value={q.sex} onChange={e=>setQ({...q, sex: e.target.value})}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select>
          </div>
        </div>

        <button type="button" onClick={() => setShowModal(true)} className={`w-full p-8 rounded-[30px] border-4 border-dashed transition-all flex items-center justify-between group ${q.age ? 'bg-emerald-50 border-emerald-500' : 'bg-blue-50 border-[#2E5481] animate-pulse'}`}>
          <div className="flex items-center gap-4 text-left">
             <Heart className={q.chestPain ? 'text-red-500' : 'text-[#2E5481]'} size={32}/>
             <div className="text-left">
                <span className="block font-black uppercase italic text-sm text-[#2E5481]">2-8. Full PhD Anamnesis</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Symptoms, Risk Factors, History & Therapy</span>
             </div>
          </div>
          <ChevronRight size={24} className="text-[#2E5481] group-hover:translate-x-2 transition-transform" />
        </button>

        <button type="button" onClick={()=>setSuccess(true)} className="w-full bg-[#E31E24] text-white py-6 rounded-2xl font-black uppercase italic tracking-widest shadow-xl hover:bg-red-700 transition-all leading-none">Confirm All Clinical Data →</button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border-4 border-[#2E5481]">
            <div className="p-6 bg-[#2E5481] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3"><Activity className="text-red-400" /><h2 className="text-xl font-black uppercase italic leading-none">Comprehensive Questionnaire</h2></div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all leading-none"><X size={24}/></button>
            </div>
            
            <div className="p-8 space-y-10 overflow-y-auto text-slate-900 text-left">
              <section className="space-y-6">
                 <h3 className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 flex items-center gap-2 leading-none text-left"><AlertCircle size={18} className="text-red-500" /> 2. Symptoms & Complaints</h3>
                 <div className="space-y-4 text-left">
                    <div className="text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic leading-none text-left">A. Chest Pain (Character, Location, Duration...)</label><textarea className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none focus:border-[#2E5481]" rows={2} value={q.chestPain} onChange={e=>setQ({...q, chestPain: e.target.value})} /></div>
                    <div className="text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic leading-none text-left">B. Irregular Heartbeat (Pulse, dizzy spells, syncope...)</label><textarea className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none focus:border-[#2E5481]" rows={2} value={q.heartRate} onChange={e=>setQ({...q, heartRate: e.target.value})} /></div>
                    <div className="text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic leading-none text-left">C. Shortness of breath (When lying down, EF%...)</label><textarea className="w-full mt-2 p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none focus:border-[#2E5481]" rows={2} value={q.shortnessOfBreath} onChange={e=>setQ({...q, shortnessOfBreath: e.target.value})} /></div>
                 </div>
              </section>

              <section className="space-y-4 text-left">
                 <h3 className="font-black uppercase italic text-[#E31E24] border-b-2 border-slate-100 pb-2 leading-none text-left">3. Risk Factors</h3>
                 <textarea className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none text-left" rows={2} value={q.riskFactors} onChange={e=>setQ({...q, riskFactors: e.target.value})} placeholder="Smoking, Diabetes, HTN, Cholesterol, Obesity, Stress..." />
              </section>

              <section className="space-y-4 text-left">
                 <h3 className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 leading-none text-left">4. Cardiovascular History</h3>
                 <textarea className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none text-left" rows={2} value={q.cvHistory} onChange={e=>setQ({...q, cvHistory: e.target.value})} placeholder="MI, Stents, Bypass, Arrhythmia, Pacemaker..." />
              </section>

              <section className="space-y-4 text-left">
                 <h3 className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 leading-none text-left">5. Non-cardiac History</h3>
                 <textarea className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none text-left" rows={2} value={q.nonCvHistory} onChange={e=>setQ({...q, nonCvHistory: e.target.value})} placeholder="Stroke, other surgeries..." />
              </section>

              <section className="space-y-4 text-left">
                 <h3 className="font-black uppercase italic text-red-600 border-b-2 border-slate-100 pb-2 leading-none text-left">6. Allergies</h3>
                 <textarea className="w-full p-4 bg-red-50/50 border border-red-100 rounded-2xl text-xs font-bold italic outline-none text-left" rows={2} value={q.allergies} onChange={e=>setQ({...q, allergies: e.target.value})} />
              </section>

              <section className="space-y-4 text-left">
                 <h3 className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 leading-none text-left">7. Current Therapy</h3>
                 <textarea className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none text-left" rows={2} value={q.therapy} onChange={e=>setQ({...q, therapy: e.target.value})} />
              </section>

              <section className="space-y-4 pb-10 text-left">
                 <h3 className="font-black uppercase italic text-[#2E5481] border-b-2 border-slate-100 pb-2 flex items-center gap-2 leading-none text-left"><Info size={16}/> 8. Other Significant Information</h3>
                 <textarea className="w-full p-4 bg-slate-50 border rounded-2xl text-xs font-bold italic outline-none text-left" rows={2} value={q.otherNotes} onChange={e=>setQ({...q, otherNotes: e.target.value})} />
              </section>

            </div>
            <div className="p-8 bg-slate-50 border-t-2 text-center shrink-0"><button type="button" onClick={handleSave} className="w-full bg-[#2E5481] text-white py-6 rounded-3xl font-black uppercase italic shadow-xl hover:bg-blue-900 transition-all leading-none">Confirm and Save Anamnesis</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}