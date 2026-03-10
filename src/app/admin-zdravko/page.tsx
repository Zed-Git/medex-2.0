"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, Clock, ChevronRight, CheckCircle, Search, Settings, FileText 
} from "lucide-react";
import MedicalReportPDF from "@/components/MedicalReportPDF";
import { PDFDownloadLink } from "@react-pdf/renderer";

// DEFINICIJA TIPA - Osigurava da TypeScript zna tačno šta je pacijent
interface Patient {
  id: string;
  name: string;
  age: number;
  date: string;
  status: 'Pending' | 'Completed';
  risk: string;
}

export default function AdminDashboard() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [currentReportId, setCurrentReportId] = useState("");

  // Zlatni Standard podaci - useMemo sprečava nepotrebno osvežavanje
  const patients: Patient[] = useMemo(() => [
    { id: "1", name: "Marko Marković", age: 45, date: "2023-10-25", status: "Pending", risk: "High" },
    { id: "2", name: "Ana Anić", age: 32, date: "2023-10-24", status: "Completed", risk: "Low" },
  ], []);

  // Funkcija koja se poziva na klik - Generiše ID bez kvarenja rendera
  const handleProcess = (patient: Patient) => {
    setSelectedPatient(patient);
    setRecommendation("");
    // Generisanje ID-a ovde rešava "Impure function" grešku
    const timestamp = new Date().getTime();
    setCurrentReportId(`REP-${timestamp}`);
  };

  const stats = useMemo(() => ({
    total: patients.length,
    pending: patients.filter(p => p.status === "Pending").length,
    completed: patients.filter(p => p.status === "Completed").length,
  }), [patients]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SEKCIJA */}
        <div className="flex justify-between items-center mb-12 text-slate-900">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            Admin <span className="text-blue-600">Dashboard</span>
          </h1>
          <div className="flex gap-4">
            <button className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <Settings className="text-slate-400 w-5 h-5" />
            </button>
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
              <Search className="text-slate-400 w-5 h-5" />
            </div>
          </div>
        </div>

        {/* STATISTIČKE KARTICE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard title="Total Patients" value={stats.total} icon={<Users className="text-blue-500" />} />
          <StatCard title="Awaiting" value={stats.pending} icon={<Clock className="text-amber-500" />} />
          <StatCard title="Completed" value={stats.completed} icon={<CheckCircle className="text-emerald-500" />} />
        </div>

        {/* LISTA PACIJENATA */}
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase italic tracking-widest">
              <tr>
                <th className="px-10 py-6">Patient</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition-all">
                  <td className="px-10 py-8">
                    <div className="font-black text-slate-900 text-xl tracking-tighter uppercase italic">{p.name}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase mt-1">{p.age} YRS • {p.date}</div>
                  </td>
                  <td className="px-10 py-8 italic font-black text-xs text-amber-600 uppercase">
                    {p.status}
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button 
                      onClick={() => handleProcess(p)}
                      className="bg-[#2E5481] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase italic tracking-widest shadow-lg"
                    >
                      Analyze <ChevronRight size={14} className="inline ml-1" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL ZA IZVEŠTAJ */}
        {selectedPatient && (
          <div className="mt-12 bg-white p-12 rounded-[50px] shadow-2xl border-4 border-[#2E5481] animate-in fade-in slide-in-from-bottom-8 text-slate-900">
            <div className="flex items-center gap-4 mb-6">
              <FileText className="text-[#2E5481]" />
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">PhD Evaluation: {selectedPatient.name}</h3>
            </div>
            <textarea 
              className="w-full h-56 p-8 bg-slate-50 border-2 border-slate-100 rounded-[30px] mb-8 focus:border-blue-500 outline-none text-slate-700"
              placeholder="Clinical findings..."
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 font-black uppercase text-xs italic tracking-widest">Cancel</button>
              
              {/* ISPRAVKA: Uklonjen @ts-expect-error jer je kod potpuno ispravan i bez njega */}
              <PDFDownloadLink
                document={<MedicalReportPDF patientData={selectedPatient} recommendation={recommendation} reportId={currentReportId} />}
                fileName={`Report_${selectedPatient.name}.pdf`}
                className="bg-[#E31E24] text-white px-12 py-5 rounded-[20px] font-black uppercase italic tracking-widest shadow-2xl"
              >
                {({ loading }) => (loading ? "Generating..." : "Sign & Finalize")}
              </PDFDownloadLink>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// POMOĆNA KOMPONENTA SA TIPIZIRANIM PROPSIMA
function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-50 flex items-center gap-6">
      <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
      <div className="text-left">
        <p className="text-slate-400 text-[10px] font-black uppercase italic tracking-widest">{title}</p>
        <p className="text-4xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}