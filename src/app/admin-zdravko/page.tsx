"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import { 
  X, Download, Users, Clock, DollarSign, 
  CheckCircle, Layout, Wallet, Activity, FileEdit, Lock 
} from "lucide-react"; 
import { PDFDownloadLink } from "@react-pdf/renderer";
import MedicalReportPDF from "@/components/MedicalReportPDF";

// --- [ZLATNI STANDARD] DEFINICIJA TIPOVA ---
// Razlog: TypeScript zahteva preciznost. Rešava "Unexpected any" (VSC Problem 1)
interface PatientRequest {
  id: string; patient_name: string; patient_email: string; urgency_level: string; 
  medical_note: string; file_url: string; created_at: string; status: string;
}

interface FooterLinks {
  company: string[];
  legal: string[];
  resources: string[];
}

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
  const [currentReportId, setCurrentReportId] = useState("");

  // --- [ZLATNI STANDARD] CMS STANJA ---
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

  // --- CELINA 1: UČITAVANJE PODATAKA ---
  useEffect(() => { 
    if (isLoggedIn) {
      const loadData = async () => {
        const { data: reqs } = await supabase.from("patient_requests").select("*").order("created_at", { ascending: false });
        setRequests(reqs || []);
        const { data: config } = await supabase.from("site_config").select("*").eq('key', 'pricing').single();
        if (config) setPrices(config.value);
      };
      loadData();
    }
  }, [isLoggedIn]);

  // --- CELINA 2: CMS SNIMANJE ---
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
          <input type="password" placeholder="Password..." className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-4 text-center font-bold text-slate-900" value={passInput} onChange={(e) => setPassInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && passInput === ADMIN_PASSWORD && setIsLoggedIn(true)} />
          <button onClick={() => passInput === ADMIN_PASSWORD ? setIsLoggedIn(true) : alert("Invalid")} className="w-full bg-[#E31E24] text-white py-5 rounded-2xl font-black uppercase italic tracking-widest shadow-xl">Authorize</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 text-left">
      <nav className="bg-[#2E5481] border-b-4 border-[#E31E24] p-6 text-white shadow-xl mb-8 leading-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">MedEx Admin <span className="text-red-400">Control</span></h1>
            <div className="flex gap-4">
                <button onClick={() => setActiveTab('patients')} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${activeTab === 'patients' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>Patients</button>
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${activeTab === 'settings' ? 'bg-white text-[#2E5481]' : 'bg-white/10'}`}>CMS Editor</button>
                <button onClick={() => setIsLoggedIn(false)} className="p-2 bg-white/10 rounded-lg ml-2"><Lock size={18} /></button>
            </div>
        </div>
      </nav>

      {activeTab === 'patients' ? (
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard title="Total" value={stats.total} icon={<Users className="text-blue-600" />} />
             <StatCard title="Unprocessed" value={stats.unprocessed} icon={<Clock className="text-amber-500" />} />
             <StatCard title="Finished" value={stats.finished} icon={<CheckCircle className="text-emerald-500" />} />
             <StatCard title="Waiting Download" value={stats.unprocessed} icon={<Activity className="text-purple-500" />} />
             <StatCard title="Paid Requests" value={stats.paid} icon={<Wallet className="text-emerald-600" />} />
             <StatCard title="Total Revenue" value={`$${stats.revenue}`} icon={<DollarSign className="text-blue-600" />} />
          </div>

          <div className="bg-white rounded-[35px] shadow-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 uppercase text-[10px] font-black text-slate-400 italic">
                <tr><th className="p-6">Patient</th><th className="p-6">Urgency</th><th className="p-6 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-all text-slate-900">
                    <td className="p-6"><div className="font-black text-[#2E5481] uppercase">{r.patient_name}</div><div className="text-[10px] text-slate-400">{r.patient_email}</div></td>
                    <td className="p-6"><span className="px-3 py-1 rounded-full text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 uppercase">{r.urgency_level}</span></td>
                    <td className="p-6 text-right">
                      <button onClick={() => { setSelectedPatient(r); setAnalysis(""); setRecommendation(""); setCurrentReportId(getNewSecureId()); }} className="px-6 py-2.5 bg-[#2E5481] text-white text-[10px] rounded-2xl font-black uppercase shadow-md">Process</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12 text-left">
            {/* 1. PRICE SETTINGS */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><DollarSign /> Price Settings</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    <div><label className="block mb-1">Basic Review ($)</label><input type="text" value={prices.normal} className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold outline-none" onChange={e=>setPrices({...prices, normal: e.target.value})} /></div>
                    <div><label className="block mb-1">Extended Review ($)</label><input type="text" value={prices.priority} className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold outline-none" onChange={e=>setPrices({...prices, priority: e.target.value})} /></div>
                    <button onClick={handleSavePrices} className="w-full bg-[#E31E24] text-white p-4 rounded-2xl font-black uppercase text-xs mt-2 hover:bg-red-700 transition-all shadow-lg">Save Prices</button>
                </div>
            </div>

            {/* 2. HERO CONTENT (Problem 4a & 4c) */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Layout /> Hero Content</h3>
                <div className="space-y-4 font-bold text-[10px] uppercase text-slate-400">
                    {/* [DODATO U ZLATNI STANDARD] - Opcija za promenu slike i Sample report (Zadatak 4a/c) */}
                    <div><label className="block mb-1">Doctor Image</label><input type="file" className="w-full p-2 bg-slate-50 border rounded-xl text-[9px]" /></div>
                    <div><label className="block mb-1">Floating Bubble Text</label><textarea value={heroText} className="w-full p-3 bg-slate-50 border rounded-xl text-slate-900 font-bold outline-none" onChange={e=>setHeroText(e.target.value)} /></div>
                    <div><label className="block mb-1">Sample Report PDF</label><input type="file" className="w-full p-2 bg-slate-50 border rounded-xl text-[9px]" /></div>
                    <button className="w-full bg-[#2E5481] text-white p-4 rounded-2xl font-black uppercase text-xs hover:bg-blue-900 transition-all shadow-md">Update Hero Files</button>
                </div>
            </div>

            {/* 3. MEDICINE SECTION (Problem 4b) */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><Activity /> Medicine Section Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {medicineNews.map((news, idx) => (
                      <div key={idx} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3 text-slate-900">
                         <input className="text-[10px] font-black text-red-500 bg-white px-2 py-1 rounded border uppercase w-full outline-none" value={news.tag} onChange={e=>{ const n = [...medicineNews]; n[idx].tag = e.target.value; setMedicineNews(n); }} />
                         <input className="w-full p-2 text-xs font-bold rounded-lg border text-slate-900" value={news.title} onChange={e=>{ const n = [...medicineNews]; n[idx].title = e.target.value; setMedicineNews(n); }} />
                         <textarea className="w-full p-2 text-[10px] h-20 border rounded-lg text-slate-600 outline-none" value={news.desc} onChange={e=>{ const n = [...medicineNews]; n[idx].desc = e.target.value; setMedicineNews(n); }} />
                      </div>
                    ))}
                </div>
                <button className="w-full bg-[#2E5481] text-white p-5 rounded-[25px] font-black uppercase text-xs mt-8 shadow-lg hover:bg-blue-900 transition-all">Save Medicine Section Content</button>
            </div>

            {/* 4. FOOTER EDITOR (Problem 5 - Rešeno kucanje tipova) */}
            <div className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 lg:col-span-2">
                <h3 className="text-lg font-black text-[#2E5481] uppercase italic mb-6 flex items-center gap-2"><FileEdit /> Footer Column Editor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-900">
                    {(Object.keys(footerLinks) as Array<keyof FooterLinks>).map((col) => (
                      <div key={col} className="space-y-3">
                        <label className="text-[10px] font-black text-red-500 uppercase italic">{col} Column</label>
                        {footerLinks[col].map((l, i) => (
                          <input key={i} value={l} className="w-full p-3 bg-slate-50 border rounded-xl text-xs font-bold uppercase outline-none" onChange={e=>{ 
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

      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border-4 border-[#2E5481]">
            <div className="p-6 bg-[#2E5481] text-white flex justify-between items-center leading-none">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Analysis: {selectedPatient.patient_name}</h2>
              <button onClick={() => setSelectedPatient(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 leading-none transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] text-left">
                <p className="text-[10px] font-black text-[#E31E24] uppercase mb-2 italic">Patient PhD Anamnesis Record:</p>
                <pre className="text-[12px] whitespace-pre-wrap font-sans italic leading-relaxed text-slate-600">{selectedPatient.medical_note}</pre>
              </div>
              <div className="grid grid-cols-1 gap-6 text-slate-900">
                <textarea className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl h-48 outline-none focus:border-[#2E5481] font-medium" placeholder="Expert Clinical Findings..." value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
                <textarea className="w-full p-5 bg-white border-2 border-slate-100 rounded-3xl h-32 outline-none focus:border-[#2E5481] font-medium" placeholder="Final Recommendation..." value={recommendation} onChange={(e) => setRecommendation(e.target.value)} />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t-2 flex justify-end gap-3 font-bold leading-none">
              <button onClick={() => setSelectedPatient(null)} className="px-8 py-4 text-slate-400 font-black uppercase text-xs leading-none">Cancel</button>
              <PDFDownloadLink document={<MedicalReportPDF patientData={{name: selectedPatient.patient_name, age: 0}} recommendation={recommendation} reportId={currentReportId} />} fileName={`Report-${selectedPatient.patient_name}.pdf`} className="px-10 py-4 bg-emerald-600 text-white rounded-[20px] font-black uppercase text-[10px] flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all leading-none">
                {({ loading }) => (loading ? "Generating..." : <><Download size={16}/> Sign & Save PDF</>)}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-xl flex items-center justify-between transition-all hover:scale-105 text-left group">
      <div className="text-left leading-none text-slate-900">
        <p className="text-[9px] text-slate-400 font-black uppercase italic leading-none mb-1 tracking-widest">{title}</p>
        <p className="text-2xl font-black text-[#2E5481] leading-none text-left">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-2xl text-[#2E5481] group-hover:bg-blue-50 transition-colors leading-none">{icon}</div>
    </div>
  );
}
