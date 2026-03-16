/* 
  FAZA: Napredna Automatizacija - Zadatak 1
  STATUS: Golden Standard 2.0 (Restored & Optimized)
  ---------------------------------------------------------
  ZLATNI STANDARD POPRAVKE:
  1. USED: 'getNewSecureId' je sada u upotrebi (VSC Problem 2 Rešen).
  2. ENGLISH: Svi nazivi u Stats karticama i tabeli su na Engleskom jeziku.
  3. CLEAN: 'loading' i 'err' stanja su pravilno integrisana.
*/

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { 
  X, Users, Clock, DollarSign, 
  CheckCircle, Layout, Wallet, Activity, FileEdit, Lock 
} from "lucide-react"; 
import dynamic from 'next/dynamic';

const PDFButton = dynamic(() => import('@/components/PDFButton'), { 
  ssr: false,
  loading: () => <span className="text-slate-400 text-[10px] italic font-black">Loading...</span>
});

interface PatientRequest {
  id: string; 
  patient_name: string; 
  patient_email: string; 
  urgency_level: string; 
  medical_note: string; 
  file_url: string; 
  created_at: string; 
  status: string;
}

interface FooterLinks {
  company: string[];
  legal: string[];
  resources: string[];
}

// POMOĆNA FUNKCIJA ZA GENERISANJE ID-a IZVEŠTAJA
const getNewSecureId = () => `REP-${Math.floor(1000 + Math.random() * 9000)}`;

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passInput, setPassInput] = useState("");
  const ADMIN_PASSWORD = "admin123";

  const [activeTab, setActiveTab] = useState<'patients' | 'settings'>('patients');
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRequest | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [currentReportId, setCurrentReportId] = useState(""); // Čuvamo ID izveštaja
  const [loading, setLoading] = useState(false);

  const [prices, setPrices] = useState({ normal: '15', priority: '30' });
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

  useEffect(() => { 
    if (isLoggedIn) {
      const loadData = async () => {
        setLoading(true);
        try {
          const { data: reqs } = await supabase.from("patient_requests").select("*").order("created_at", { ascending: false });
          setRequests(reqs || []);
          const { data: config } = await supabase.from("site_config").select("*").eq('key', 'pricing').single();
          if (config) setPrices(config.value);
        } catch (err) {
          console.error("Fetch error:", err instanceof Error ? err.message : 'Unknown');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [isLoggedIn]);

  const handleSavePrices = async () => {
    const { error } = await supabase.from("site_config").upsert({ key: 'pricing', value: prices }, { onConflict: 'key' });
    if (error) alert(error.message); else alert("PRICES UPDATED!");
  };

  const stats = useMemo(() => ({
    total: requests.length,
    unprocessed: requests.filter(r => !r.status || r.status === 'pending').length,
    finished: requests.filter(r => r.status === 'completed').length,
    paid: requests.filter(r => r.status === 'paid').length,
    revenue: requests.filter(r => r.status === 'paid').length * Number(prices.normal)
  }), [requests, prices.normal]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#2E5481] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md text-center border-t-8 border-[#E31E24]">
          <Lock className="text-[#2E5481] mx-auto mb-6" size={40} />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-[#2E5481]">Admin Access</h2>
          <input type="password" placeholder="Password..." className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 text-center font-bold text-slate-900 outline-none" value={passInput} onChange={(e) => setPassInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && passInput === ADMIN_PASSWORD && setIsLoggedIn(true)} />
          <button onClick={() => passInput === ADMIN_PASSWORD ? setIsLoggedIn(true) : alert("Invalid")} className="w-full bg-[#E31E24] text-white py-5 rounded-2xl font-black uppercase italic tracking-widest shadow-xl">Authorize</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 text-left">
      <nav className="bg-[#2E5481] border-b-4 border-[#E31E24] p-6 text-white shadow-xl mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center leading-none">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">MedEx Admin <span className="text-red-400">Control</span></h1>
            <div className="flex gap-4">
                <button onClick={() => setActiveTab('patients')} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${activeTab === 'patients' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>Patients</button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${activeTab === 'settings' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>CMS Editor</button>
                <button onClick={() => setIsLoggedIn(false)} className="p-2 bg-white/10 rounded-lg ml-2 hover:bg-red-600 transition-all"><Lock size={18} /></button>
            </div>
        </div>
      </nav>

      {activeTab === 'patients' ? (
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
             <StatCard title="Total Records" value={stats.total} icon={<Users className="text-blue-600" />} />
             <StatCard title="DB Health" value="100%" icon={<CheckCircle className="text-emerald-500" />} />
             <StatCard title="Pending" value={stats.unprocessed} icon={<Clock className="text-amber-500" />} />
             <StatCard title="Reports" value={stats.total} icon={<Activity className="text-purple-500" />} />
             <StatCard title="Paid" value={stats.paid} icon={<Wallet className="text-emerald-600" />} />
             <StatCard title="Revenue" value={`$${stats.revenue}`} icon={<DollarSign className="text-blue-600" />} />
          </div>

          <div className="bg-white rounded-[35px] shadow-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 uppercase text-[10px] font-black text-slate-400 italic">
                <tr><th className="p-6">Patient Identity</th><th className="p-6 text-center">Urgency</th><th className="p-6 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={3} className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase">Syncing clinical records...</td></tr>
                ) : requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-all text-slate-900 group">
                    <td className="p-6">
                      <div className="font-black text-[#2E5481] uppercase group-hover:text-[#E31E24] transition-colors">{r.patient_name}</div>
                      <div className="text-[10px] text-slate-400">{r.patient_email}</div>
                    </td>
                    <td className="p-6 text-center"><span className="px-3 py-1 rounded-full text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase">{r.urgency_level}</span></td>
                    <td className="p-6 text-right flex justify-end gap-2">
                      <PDFButton patient={r} />
                      <button 
                        onClick={() => { 
                          setSelectedPatient(r); 
                          setAnalysis(""); 
                          setRecommendation(""); 
                          setCurrentReportId(getNewSecureId()); // KORISTIMO FUNKCIJU
                        }} 
                        className="px-6 py-2.5 bg-[#2E5481] text-white text-[10px] rounded-2xl font-black uppercase shadow-md hover:bg-[#E31E24] transition-all"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CMS EDITOR VIEW */
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 text-left">
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><DollarSign /> Price Settings</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    <div><label className="block mb-1">Basic Review ($)</label><input type="text" value={prices.normal} className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold outline-none" onChange={e=>setPrices({...prices, normal: e.target.value})} /></div>
                    <div><label className="block mb-1">Extended Review ($)</label><input type="text" value={prices.priority} className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold outline-none" onChange={e=>setPrices({...prices, priority: e.target.value})} /></div>
                    <button onClick={handleSavePrices} className="w-full bg-[#E31E24] text-white p-4 rounded-2xl font-black uppercase text-xs mt-2 hover:bg-red-700 transition-all shadow-lg">Save Prices</button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Layout /> Hero Content</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    <div><label className="block mb-1">Doctor Image</label><input type="file" className="w-full p-2 bg-slate-50 border rounded-xl text-[9px]" /></div>
                    <div><label className="block mb-1">Floating Bubble Text</label><textarea value={heroText} className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold outline-none h-20" onChange={e=>setHeroText(e.target.value)} /></div>
                    <div><label className="block mb-1">Sample Report PDF</label><input type="file" className="w-full p-2 bg-slate-50 border rounded-xl text-[9px]" /></div>
                    <button className="w-full bg-[#2E5481] text-white p-4 rounded-2xl font-black uppercase text-xs hover:bg-blue-900 transition-all">Update Hero Files</button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Activity /> Medicine Section Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {medicineNews.map((news, idx) => (
                      <div key={idx} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                         <input className="text-[10px] font-black text-red-500 bg-white px-2 py-1 rounded border uppercase w-full outline-none" value={news.tag} onChange={e=>{ const n = [...medicineNews]; n[idx].tag = e.target.value; setMedicineNews(n); }} />
                         <input className="w-full p-2 text-xs font-bold rounded-lg border text-slate-900 outline-none" value={news.title} onChange={e=>{ const n = [...medicineNews]; n[idx].title = e.target.value; setMedicineNews(n); }} />
                         <textarea className="w-full p-2 text-[10px] h-20 border rounded-lg text-slate-600 outline-none" value={news.desc} onChange={e=>{ const n = [...medicineNews]; n[idx].desc = e.target.value; setMedicineNews(n); }} />
                      </div>
                    ))}
                </div>
                <button className="w-full bg-[#2E5481] text-white p-5 rounded-[25px] font-black uppercase text-xs mt-8 shadow-lg hover:bg-blue-900 transition-all">Save Medicine Section Content</button>
            </div>

            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><FileEdit /> Footer Column Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {(Object.keys(footerLinks) as Array<keyof FooterLinks>).map((col) => (
                      <div key={col} className="space-y-3">
                        <label className="text-[10px] font-black text-red-500 uppercase italic">{col} Column</label>
                        {footerLinks[col].map((l, i) => (
                          <input key={i} value={l} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold uppercase outline-none focus:border-[#2E5481]" onChange={e=>{ 
                            const next = {...footerLinks}; next[col][i] = e.target.value; setFooterLinks(next); 
                          }} />
                        ))}
                      </div>
                    ))}
                </div>
                <button className="w-full bg-[#2E5481] text-white p-5 rounded-[25px] font-black uppercase text-xs mt-8 shadow-lg">Save Footer Links</button>
            </div>
        </div>
      )}

      {/* ANALYSIS MODAL */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-[#2E5481] animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-[#2E5481] text-white flex justify-between items-center leading-none">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Analysis: {selectedPatient.patient_name}</h2>
              <button onClick={() => setSelectedPatient(null)} className="bg-white/10 p-2 rounded-full hover:bg-red-500 transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] text-left">
                <p className="text-[10px] font-black text-[#E31E24] uppercase mb-2 italic tracking-widest leading-none">Record ID: {currentReportId}</p>
                <pre className="text-[12px] whitespace-pre-wrap font-sans italic leading-relaxed text-slate-600">{selectedPatient.medical_note}</pre>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <textarea className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl h-48 outline-none focus:border-[#2E5481] font-medium text-sm" placeholder="Expert Clinical Findings & Analysis..." value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
                <textarea className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl h-32 outline-none focus:border-[#2E5481] font-medium text-sm" placeholder="Final Physician Recommendations..." value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t-2 flex justify-end gap-3 font-bold items-center leading-none">
              <button onClick={() => setSelectedPatient(null)} className="px-8 py-4 text-slate-400 font-black uppercase text-xs hover:text-slate-600 leading-none">Cancel</button>
              {/* PDFButton koji sada dobija sve podatke */}
              <PDFButton 
                patient={selectedPatient} 
                analysis={analysis} 
                recommendation={recommendation} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-xl flex items-center justify-between transition-all hover:scale-105 group text-left">
      <div className="text-left leading-none">
        <p className="text-[9px] text-slate-400 font-black uppercase italic mb-1 tracking-widest leading-none">{title}</p>
        <p className="text-2xl font-black text-[#2E5481] leading-none">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors leading-none">{icon}</div>
    </div>
  );
}
