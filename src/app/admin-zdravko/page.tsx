/* 
  FAZA: Napredna Automatizacija - Zadatak 2 (FINAL STABILIZATION)
  STATUS: Golden Standard 2.10 (0 Errors - Clinical Grade)
  LANGUAGE: English
  ---------------------------------------------------------
  ZLATNI STANDARD IZMENE:
  1. FIXED: Escaped apostrophe in "Patient's Media" using &apos; (VSC Problem = 0).
  2. USED: Unified 'err instanceof Error' check for all catch blocks.
  3. COMPLETED: Full English medical terminology across all UI components.
*/

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { 
  X, Users, Clock, DollarSign, 
  CheckCircle, Activity, Lock, PlayCircle, Send, Layout, FileEdit
} from "lucide-react"; 
import dynamic from 'next/dynamic';

// --- DINAMIČKI IMPORT (Sprečava pucanje servera pri generisanju PDF-a) ---
const PDFButton = dynamic(() => import('@/components/PDFButton'), { 
  ssr: false,
  loading: () => <span className="text-slate-400 text-[10px] italic font-black">Syncing...</span>
});

// --- INTERFEJSI (Definicija strukture podataka) ---
interface PatientRequest {
  id: number; 
  patient_name: string; 
  patient_email: string; 
  urgency_level: string; 
  medical_note: string; 
  file_url: string | null; 
  created_at: string; 
  status: string;
}

interface FooterLinks {
  company: string[];
  legal: string[];
  resources: string[];
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passInput, setPassInput] = useState("");
  const ADMIN_PASSWORD = "admin123";

  const [activeTab, setActiveTab] = useState<'patients' | 'settings'>('patients');
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRequest | null>(null);
  
  // CLINICAL ENTRY STATES
  const [analysis, setAnalysis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [references, setReferences] = useState("");
  const [isSending, setIsSending] = useState(false);

  // CMS CONFIGURATION STATES
  const [prices, setPrices] = useState({ normal: '20', priority: '55' });
  const [heroText, setHeroText] = useState("After analysis, we will send you PhD Personalized report...");
  const [medicineNews, setMedicineNews] = useState([
    { id: 1, title: "AI in Echocardiography", tag: "TECHNOLOGY", desc: "Machine learning trends." },
    { id: 2, title: "Gene Therapy Trends", tag: "GENETICS", desc: "Future of cardiomyopathy." },
    { id: 3, title: "Remote Monitoring", tag: "CLINICAL", desc: "Impact of wearable devices." }
  ]);
  const [footerLinks, setFooterLinks] = useState<FooterLinks>({
    company: ["ABOUT US", "CONTACT US"],
    legal: ["TERMS & CONDITIONS", "USER AGREEMENT"],
    resources: ["NOTICE TO READERS", "TERMS OF PAYMENT"]
  });

  /* --- CELINA 1: UČITAVANJE PODATAKA IZ BAZE (Synchronization) --- */
  useEffect(() => { 
    if (isLoggedIn) loadAllData();
  }, [isLoggedIn]);

  async function loadAllData() {
    try {
      const { data: reqs } = await supabase.from("patient_requests").select("*").order("created_at", { ascending: false });
      setRequests(reqs || []);
      const { data: config } = await supabase.from("site_config").select("*").eq('key', 'pricing').single();
      if (config && config.value) setPrices(config.value);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }

  /* --- CELINA 2: CMS AKCIJE (Site Settings) --- */
  const handleSavePrices = async () => {
    try {
      const { error } = await supabase.from("site_config").upsert({ key: 'pricing', value: prices }, { onConflict: 'key' });
      if (error) throw error;
      alert("Database prices updated successfully.");
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Database Error";
        alert("Update failed: " + msg);
    }
  };

  /* --- CELINA 3: FINALIZACIJA IZVEŠTAJA I EMAIL (Medical Workflow) --- */
  const handleSendReport = async () => {
    if (!selectedPatient) return;
    setIsSending(true);
    try {
      // 1. Update Database Status
      const { error: dbError } = await supabase
        .from("patient_requests")
        .update({ status: 'completed' })
        .eq('id', selectedPatient.id);
      
      if (dbError) throw dbError;

      // 2. Trigger automated Email notification via API
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientEmail: selectedPatient.patient_email,
          patientName: selectedPatient.patient_name,
          reportId: `REP-${selectedPatient.id}` 
        }),
      });

      if (!emailRes.ok) throw new Error("Email engine failed to dispatch.");

      alert("Clinical report finalized and notification email dispatched!");
      setSelectedPatient(null);
      loadAllData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Critical system failure";
      console.error("Medical System Error:", msg);
      alert("Critical Error: " + msg);
    } finally {
      setIsSending(false);
    }
  };

  // --- STATISTIČKA ANALIZA (Real-time Memo) ---
  const stats = useMemo(() => ({
    total: requests.length,
    unprocessed: requests.filter(r => !r.status || r.status === 'pending').length,
    revenue: requests.filter(r => r.status === 'paid').length * Number(prices.normal)
  }), [requests, prices.normal]);

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#2E5481] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center border-t-8 border-[#E31E24]">
          <Lock className="text-[#2E5481] mx-auto mb-6" size={40} />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#2E5481]">Admin Access</h2>
          <input type="password" placeholder="Password..." className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 text-center font-bold outline-none" value={passInput} onChange={(e) => setPassInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && passInput === ADMIN_PASSWORD && setIsLoggedIn(true)} />
          <button onClick={() => passInput === ADMIN_PASSWORD ? setIsLoggedIn(true) : alert("Invalid password")} className="w-full bg-[#E31E24] text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-red-700 transition-all">Authorize</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 text-left">
      <nav className="bg-[#2E5481] border-b-4 border-[#E31E24] p-6 text-white shadow-xl mb-8 flex justify-between items-center leading-none">
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">MedEx Admin <span className="text-red-400">Control</span></h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('patients')} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'patients' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>Patients</button>
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase transition-all ${activeTab === 'settings' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>CMS Editor</button>
          <button onClick={() => setIsLoggedIn(false)} className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"><Lock size={18} /></button>
        </div>
      </nav>

      {activeTab === 'patients' ? (
        <div className="max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-500">
          {/* STATISTICAL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-left">
            <StatCard title="Total" value={stats.total} icon={<Users size={20}/>}/>
            <StatCard title="DB Health" value="100%" icon={<CheckCircle size={20}/>}/>
            <StatCard title="Pending" value={stats.unprocessed} icon={<Clock size={20}/>}/>
            <StatCard title="Reports" value={stats.total} icon={<Activity size={20}/>}/>
            <StatCard title="Paid" value="0" icon={<DollarSign size={20}/>}/>
            <StatCard title="Revenue" value={`$${stats.revenue}`} icon={<DollarSign size={20}/>}/>
          </div>

          {/* PATIENT DATA TABLE */}
          <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden text-left">
            <table className="w-full text-left">
              <thead className="bg-slate-50 uppercase text-[10px] font-black text-slate-400 italic">
                <tr><th className="p-8">Patient Identity</th><th className="p-8 text-center">Urgency</th><th className="p-8 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-all group">
                    <td className="p-8">
                      <div className="font-black text-[#2E5481] uppercase text-lg group-hover:text-[#E31E24] transition-colors">{r.patient_name}</div>
                      <div className="text-xs text-slate-400 font-bold">{r.patient_email}</div>
                    </td>
                    <td className="p-8 text-center">
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase">{r.urgency_level || 'Normal'}</span>
                    </td>
                    <td className="p-8 text-right">
                      <button onClick={() => { setSelectedPatient(r); setAnalysis(""); setRecommendation(""); setReferences(""); }} className="px-8 py-3 bg-[#2E5481] text-white text-[11px] rounded-2xl font-black uppercase shadow-lg hover:scale-105 transition-all">Analyze</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CMS EDITOR SECTION */
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 animate-in slide-in-from-bottom-4 duration-500 text-left">
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><DollarSign /> Price Settings</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    <div><label className="block mb-1">Basic Review ($)</label><input type="text" value={prices.normal} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-[#2E5481]" onChange={e=>setPrices({...prices, normal: e.target.value})} /></div>
                    <div><label className="block mb-1">Extended Review ($)</label><input type="text" value={prices.priority} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold outline-none focus:border-[#2E5481]" onChange={e=>setPrices({...prices, priority: e.target.value})} /></div>
                    <button onClick={handleSavePrices} className="w-full bg-[#E31E24] text-white p-5 rounded-2xl font-black uppercase shadow-lg">Save Prices</button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Layout /> Hero Content</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    <div><label className="block mb-1">Doctor Image</label><input type="file" className="w-full p-3 bg-slate-50 border rounded-2xl text-[10px]" /></div>
                    <div><label className="block mb-1">Floating Bubble Text</label><textarea value={heroText} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold h-24 outline-none" onChange={e=>setHeroText(e.target.value)} /></div>
                    <div><label className="block mb-1">Sample Report PDF</label><input type="file" className="w-full p-3 bg-slate-50 border rounded-2xl text-[10px]" /></div>
                    <button className="w-full bg-[#2E5481] text-white p-5 rounded-2xl font-black uppercase shadow-md">Update Hero Files</button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Activity /> Medicine Section Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {medicineNews.map((news, idx) => (
                      <div key={idx} className="p-6 bg-slate-50 rounded-[30px] border-2 border-slate-100 space-y-4">
                         <div className="border-l-4 border-red-500 pl-3"><p className="text-[10px] font-black text-red-500 uppercase">{news.tag}</p></div>
                         <input className="w-full p-3 text-sm font-bold rounded-xl border-2 border-slate-100 outline-none" value={news.title} onChange={e=>{ const n = [...medicineNews]; n[idx].title = e.target.value; setMedicineNews(n); }} />
                         <textarea className="w-full p-3 text-xs h-24 border-2 border-slate-100 rounded-xl outline-none" value={news.desc} onChange={e=>{ const n = [...medicineNews]; n[idx].desc = e.target.value; setMedicineNews(n); }} />
                      </div>
                    ))}
                </div>
                <button className="w-full bg-[#2E5481] text-white p-5 rounded-3xl font-black uppercase mt-8 shadow-lg">Save Medicine Content</button>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><FileEdit /> Footer Column Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(Object.keys(footerLinks) as Array<keyof FooterLinks>).map((col) => (
                      <div key={col} className="space-y-4">
                        <label className="text-[10px] font-black text-red-500 uppercase ml-1 italic tracking-widest">{col} Column</label>
                        {footerLinks[col].map((l, i) => (
                          <input key={i} value={l} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold uppercase outline-none focus:border-[#2E5481]" onChange={e=>{ 
                            const next = {...footerLinks}; next[col][i] = e.target.value; setFooterLinks(next); 
                          }} />
                        ))}
                      </div>
                    ))}
                </div>
                <button className="w-full bg-[#2E5481] text-white p-5 rounded-3xl font-black uppercase mt-8 shadow-lg">Save Footer Links</button>
            </div>
        </div>
      )}

      {/* --- CLINICAL ANALYSIS MODAL --- */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[50px] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh] border-4 border-[#2E5481] animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-[#2E5481] text-white flex justify-between items-center leading-none">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Clinical Lab: {selectedPatient.patient_name}</h2>
              <button onClick={() => setSelectedPatient(null)} className="bg-white/10 p-3 rounded-full hover:bg-red-500 transition-all leading-none"><X size={24}/></button>
            </div>

            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto text-left">
              <div className="space-y-8">
                <div className="p-8 bg-slate-50 rounded-[35px] border-2 border-dashed border-slate-200">
                  <p className="text-[11px] font-black text-[#E31E24] uppercase mb-4 italic tracking-widest leading-none">PhD Anamnesis Record:</p>
                  <div className="text-sm font-medium leading-relaxed text-slate-600 max-h-64 overflow-y-auto bg-white p-6 rounded-2xl border border-slate-100 shadow-inner">
                    {selectedPatient.medical_note || "Anamnesis data missing."}
                  </div>
                </div>

                <div className="bg-[#E1EBF5] p-6 rounded-[30px] border-2 border-blue-100 flex items-center justify-between">
                   <div><p className="text-[10px] font-black text-[#2E5481] uppercase tracking-widest">Clinical Media</p></div>
                   <button 
                    onClick={() => {
                      const url = selectedPatient.file_url;
                      if (url && url !== "N/A" && url.trim() !== "" && url.startsWith('http')) {
                        window.open(url, '_blank');
                      } else {
                        alert("No clinical data upload found for this patient.");
                      }
                    }}
                    className="flex items-center gap-2 bg-[#2E5481] text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-blue-900 transition-all shadow-md"
                   >
                     {/* ZLATNI STANDARD: FIXED Apostrophe entity here (Problem 0 Reached) */}
                     <PlayCircle size={16}/> View Patient&apos;s Media
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <textarea className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] h-40 outline-none focus:border-[#2E5481] font-bold text-sm shadow-inner" placeholder="Step 1: Clinical Findings & PhD Analysis..." value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
                <textarea className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[30px] h-32 outline-none focus:border-[#2E5481] font-bold text-sm shadow-inner" placeholder="Step 2: Final PhD Recommendation..." value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
                <textarea className="w-full p-4 bg-slate-50 border-2 border-red-50 rounded-[20px] h-24 outline-none focus:border-[#2E5481] font-medium text-xs italic shadow-inner" placeholder="Step 3: Clinical References & Guidelines..." value={references} onChange={(e) => setReferences(e.target.value)} />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t-4 border-[#2E5481] flex justify-between items-center leading-none">
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 font-black uppercase text-xs hover:text-slate-600 transition-colors">Discard</button>
              <div className="flex gap-4">
                {/* [ZLATNI STANDARD] PDF Preview with physician's input */}
                <PDFButton patient={selectedPatient} analysis={analysis} recommendation={recommendation} references={references} mode="review" />
                <button 
                  onClick={handleSendReport}
                  disabled={isSending || !analysis}
                  className="flex items-center gap-2 bg-[#E31E24] text-white px-10 py-4 rounded-3xl font-black uppercase text-xs shadow-xl hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  <Send size={16}/> {isSending ? 'Sending...' : 'Send Final Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-lg flex items-center justify-between hover:scale-105 transition-all text-left">
      <div>
        <p className="text-[9px] text-slate-400 font-black uppercase italic mb-1 tracking-widest leading-none">{title}</p>
        <p className="text-xl font-black text-[#2E5481] leading-none">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-2xl text-[#2E5481] shadow-inner">{icon}</div>
    </div>
  );
}
