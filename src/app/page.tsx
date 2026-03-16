'use client';

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { submitMedicalRequest } from "./actions"; 
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image"; 
import Link from "next/link"; 
import { FileUpload } from "@/components/FileUpload"; 
import RequestAnalysisForm, { AnamnesisData } from "@/components/RequestAnalysisForm";
import { 
  ArrowDown, CheckCircle2, ShieldCheck, Activity, 
  ArrowRight, X 
} from "lucide-react";

const NEWS_DATA = [
  { id: 1, title: "AI in Echocardiography", description: "How machine learning is revolutionizing valve disease detection.", tag: "TECHNOLOGY" },
  { id: 2, title: "Gene Therapy Trends", description: "The future of treating cardiomyopathy.", tag: "GENETICS" },
  { id: 3, title: "Remote Monitoring", description: "Impact of wearable devices on recovery.", tag: "CLINICAL" },
];

export default function LandingPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [urgency, setUrgency] = useState('Basic');
  const [isAgreed, setIsAgreed] = useState(false);
  const [file, setFile] = useState<File | null>(null); 
  const [showAnamneza, setShowAnamneza] = useState(false);
  const [anamnezaDone, setAnamnezaDone] = useState(false);
  const [anamnezaData, setAnamnezaData] = useState<AnamnesisData | null>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const [dbPrices, setDbPrices] = useState({ normal: '15', priority: '30' });

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from("site_config").select("*").eq('key', 'pricing').single();
      if (data) setDbPrices(data.value);
    };
    fetchConfig();
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });
  const getPrice = () => urgency === 'Extended' ? `$${dbPrices.priority}` : `$${dbPrices.normal}`;

  async function handleSubmit(formData: FormData) {
    if (!anamnezaDone || !anamnezaData) { alert("Please fill your medical anamnesis first."); return; }
    if (!isAgreed) { alert("Please confirm agreement."); return; }
    
    setStatus('loading');
    formData.append('medicalAnamnesis', JSON.stringify(anamnezaData));
    if (file) formData.append('medicalFile', file);

    try {
      const result = await submitMedicalRequest(formData);
      if (result.success) setStatus('success');
      else setStatus('error');
    } catch { setStatus('error'); }
  }

  // --- [ZLATNI STANDARD] RESTAURIRAN SUCCESS PORUKA ---
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center text-slate-900 font-sans">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[40px] shadow-2xl border-t-8 border-emerald-500 max-w-lg">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-[#2E5481] uppercase tracking-tighter italic">SUCCESSFUL!</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] mt-6 tracking-widest leading-relaxed">
            Your request has been successfully sent to the MedExNews team.
          </p>
          <button onClick={() => setStatus('idle')} className="mt-10 px-10 py-4 bg-[#2E5481] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-900 transition-all shadow-lg">New Request</button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-white font-sans tracking-tight text-slate-900 text-left">
      <nav className="sticky top-0 z-50 w-full bg-[#2E5481] border-b-4 border-[#E31E24] py-4 px-6 md:px-12 text-white shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer flex flex-col min-w-max">
            <div className="flex items-baseline leading-none">
              <span className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase">MedExNews</span>
              <sup className="text-[10px] font-black text-[#E31E24] ml-0.5 bg-white px-1 rounded-sm uppercase italic">AI</sup>
            </div>
            <div className="h-1 w-full bg-[#E31E24] mt-1"></div>
          </div>
          <div className="hidden lg:flex flex-col items-center flex-1 mx-8 text-center leading-tight">
             <h2 className="text-2xl font-black uppercase tracking-tight text-white leading-none">CARDIOLOGY ANALYSIS ACCORDING EVIDENCE BASED</h2>
             <p className="text-xs uppercase tracking-widest font-bold text-red-100 opacity-95 italic mt-1 leading-none">- PhD Personalized Review -</p>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION (RESTAURIRANO) --- */}
      <section className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-3 flex flex-col gap-4">
            <motion.div onClick={scrollToForm} whileHover={{ y: -5 }} className="cursor-pointer bg-[#2E5481] p-6 rounded-[35px] text-white shadow-2xl flex flex-col justify-center text-center relative h-64 overflow-hidden border-b-4 border-blue-900">
              <h3 className="text-[#E31E24] text-4xl font-black italic mb-1 uppercase tracking-tighter shadow-black drop-shadow-md">SUBMIT</h3> 
              <p className="text-[11px] font-black uppercase leading-tight mb-4 tracking-wider">YOUR CARDIOLOGY <br/> QUESTION/RESULTS/ <br/> DILEMMA...?</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[8px] font-black text-[#E31E24] uppercase italic">click to start</span>
                <ArrowDown className="text-[#E31E24] animate-bounce" size={18} />
              </div>
            </motion.div>
            
            {/* [DODATO U ZLATNI STANDARD] - RESTAURIRAN SAMPLE REPORT BUTTON (Problem 3) */}
            <button className="w-full bg-white border-2 border-slate-100 py-3 rounded-2xl text-[#2E5481] font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-all leading-none">
              Sample Report <ArrowDown size={14} className="text-[#E31E24]" />
            </button>
        </div>

        <div className="lg:col-span-3 bg-white border border-slate-100 p-8 rounded-[35px] shadow-xl h-96 flex flex-col justify-center text-center relative overflow-hidden">
          <h3 className="text-xl font-black text-[#2E5481] uppercase border-b-4 border-[#E31E24] pb-1 inline-block tracking-tighter italic">HOW IT WORKS</h3>
          <div className="space-y-6 mt-6 text-left">
            {[ {id: "01", t: "Your Request"}, {id: "02", t: "Our Analysis"}, {id: "03", t: "Your Answer"} ].map((step) => (
              <div key={step.id} className="flex items-center gap-4 group">
                <div className="w-1.5 h-10 bg-slate-100 rounded-full group-hover:bg-[#E31E24] transition-all"></div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-800">{step.id}. {step.t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 h-96 relative">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-[35px] overflow-hidden shadow-2xl border-4 border-white h-full relative group">
            <Image src="/doctor.png" alt="Doctor" fill className="object-cover object-top transition-transform duration-1000 group-hover:scale-105" priority />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-[#2E5481] max-w-50 z-20">
              <p className="text-[10px] font-bold text-[#2E5481] leading-relaxed italic">&quot;After analysis, we will send report...&quot;</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- [DODATO U ZLATNI STANDARD] - RESTAURIRANA MEDICINE SEKCIJA (Problem 4) --- */}
      <section className="bg-slate-50 py-16 px-6 mt-2">
        <div className="max-w-7xl mx-auto text-center text-slate-900">
          <h2 className="text-3xl font-black text-[#2E5481] uppercase mb-1 tracking-tighter italic leading-none">MEDICINE IN THE FUTURE</h2>
          <div className="w-16 h-1.5 bg-[#E31E24] mx-auto mb-10 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {NEWS_DATA.map((news, idx) => (
              <motion.div key={news.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -10 }} className="bg-white p-8 rounded-[35px] shadow-md border border-slate-100 text-left hover:shadow-2xl transition-all cursor-default">
                <span className="text-[#E31E24] font-black text-[9px] tracking-widest uppercase">{news.tag}</span>
                <h3 className="text-xl font-black text-slate-800 mt-2 mb-3 uppercase leading-tight">{news.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-6 font-medium">{news.description}</p>
                <button type="button" className="text-[#2E5481] font-black text-[10px] uppercase border-b-2 border-slate-100 hover:border-[#E31E24] transition-all flex items-center gap-1 italic">Read Analysis <ArrowRight size={14} /></button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* REQUEST FORM */}
      <section ref={formRef} className="max-w-5xl mx-auto p-1 my-10 text-left">
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          {/* Note Banner */}
          <div className="bg-red-50 border-b border-red-100 p-4 flex items-center justify-center gap-4 text-center text-slate-900">
            <div className="bg-[#E31E24] text-white w-7 h-7 flex items-center justify-center rounded-full font-black text-xs shrink-0 animate-pulse">!</div>
            <p className="text-[#E31E24] font-black text-[10px] uppercase italic leading-tight tracking-tight">
              Note: MedExNews does not provide medical diagnosis. If you have emergency, call 911 immediately!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 text-slate-900">
            {/* PLAVA KOLONA SA CENOM (Problem 5) */}
            <div className="lg:col-span-3 bg-[#2E5481] p-8 text-white flex flex-col justify-center items-center text-center gap-8 border-r border-white/10">
              <h2 className="text-xl font-black uppercase leading-none border-b border-white/20 pb-4 w-full tracking-tighter italic">REQUEST <br/> ANALYSIS</h2>
              <div className="w-full">
                <span className="text-[8px] font-black opacity-60 block mb-1 uppercase tracking-widest italic">Estimated Fee</span>
                <span className="text-5xl font-black text-white">{getPrice()}</span>
                <div className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/10 text-left">
                  <p className="text-[9px] font-black text-yellow-400 uppercase italic leading-tight tracking-wider">NO NEED TO PAY NOW!</p>
                  <p className="text-[8px] font-black text-white/90 uppercase italic mt-1 tracking-widest leading-none">YOU PAY AFTER REPORT!</p>
                  <p className="text-[7px] font-bold text-white/50 uppercase mt-1 leading-none italic">No Need Credit Card Now...</p>
                </div>
              </div>
              <div className="space-y-3 w-full pt-4 border-t border-white/10 text-[10px] font-black uppercase italic tracking-widest">
                <div className="flex items-center justify-center gap-2"><ShieldCheck className="text-red-400" size={16} /> Secure & Confidential</div>
                <div className="flex items-center justify-center gap-2"><Activity className="text-green-400" size={16} /> PhD Expert Review </div>
              </div>
            </div>

            <form action={handleSubmit} className="lg:col-span-9 p-8 bg-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input name="patientName" required className="w-full outline-none font-bold text-slate-800 p-0 text-sm bg-transparent" placeholder="John Smith" />
                </div>
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">Email <span className="text-red-500">*</span></label>
                  <input name="email" type="email" required className="w-full outline-none font-bold text-slate-800 p-0 text-sm bg-transparent" placeholder="mdzdravko@yahoo.com" />
                </div>
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">Phone Number</label>
                  <input name="phone" className="w-full outline-none font-bold text-slate-800 p-0 text-sm bg-transparent" placeholder="+381 6..." />
                </div>
                <div className="border-b-2 border-slate-50 pb-2 flex flex-col">
                  <label className="text-[10px] font-black uppercase text-slate-400 italic mb-1">Urgency Level <span className="text-red-500">*</span></label>
                  <select name="urgency" required onChange={(e) => setUrgency(e.target.value === 'Extended' ? 'Extended' : 'Basic')} className="w-full font-black text-[#2E5481] outline-none bg-transparent text-xs p-0 uppercase cursor-pointer">
                      <option value="Basic">(${dbPrices.normal}) BASIC REVIEW</option>
                      <option value="Extended">(${dbPrices.priority}) EXTENDED REVIEW</option>
                  </select>
                </div>
              </div>

              <div className="py-2">
                <button type="button" onClick={() => setShowAnamneza(true)} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${anamnezaDone ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-blue-50 border-[#2E5481] text-[#2E5481]'}`}>
                  <span className="font-black uppercase italic tracking-widest text-xs">
                    {anamnezaDone ? "MEDICAL DATA SAVED" : "FILL YOUR MEDICAL ANAMNESIS *"}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* RESTAURIRAN UPLOAD PROSTOR (Problem 6) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#2E5481] italic block tracking-widest">Attach Clinical Findings (Optional)</label>
                <div className="bg-slate-50 rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center hover:border-[#2E5481] transition-all">
                    <FileUpload onFileSelect={(f) => setFile(f)} />
                    <div className="mt-4">
                       <p className="text-[8px] font-bold text-slate-400 uppercase italic">PNG, JPG, PDF or MP4 | Max Size: 50MB</p>
                    </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 text-left">
                <label className="flex items-start gap-3 cursor-pointer group mb-6 leading-none">
                  <input required type="checkbox" checked={isAgreed} onChange={e => setIsAgreed(e.target.checked)} className="mt-1 w-4 h-4 rounded border-slate-300" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase italic leading-tight text-left">
                    By submitting you agree with <span className="text-[#2E5481] underline font-black italic">User Agreement</span>.
                  </span>
                </label>
                <button type="submit" disabled={status === 'loading'} className="w-full bg-[#E31E24] text-white font-black py-5 rounded-2xl shadow-xl uppercase tracking-widest hover:bg-red-700 transition-all text-sm italic">
                  {status === 'loading' ? 'PROCESSING...' : 'SEND FOR EXPERT ANALYSIS →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* --- FOOTER RESTAURIRANO --- */}
      <footer className="bg-[#2E5481] pt-16 pb-8 px-6 md:px-12 text-white border-t-8 border-[#E31E24] text-left">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-6 italic">Company</h4>
            <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest opacity-80 italic leading-none">
              <li><Link href="#">ABOUT US</Link></li>
              <li><Link href="#">CONTACT US</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-6 italic">Legal</h4>
            <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest opacity-80 italic leading-none">
              <li><Link href="#">TERMS & CONDITIONS</Link></li>
              <li><Link href="#">USER AGREEMENT</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-6 italic">Resources</h4>
            <ul className="space-y-3 text-[10px] font-black uppercase tracking-widest opacity-80 italic leading-none">
              <li><Link href="#">NOTICE TO READERS</Link></li>
              <li><Link href="#">TERMS OF PAYMENT</Link></li>
            </ul>
          </div>
          <div className="flex flex-col items-start md:items-end">
             <div className="flex items-baseline mb-2 leading-none">
                <span className="text-3xl font-black italic uppercase tracking-tighter leading-none">MedExNews</span>
                <sup className="text-xs text-[#E31E24] ml-1 font-black uppercase italic leading-none">AI</sup>
             </div>
             <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-4 leading-none">© 2026 MedExNews | ALL RIGHTS RESERVED</p>
          </div>
        </div>
      </footer>

      {/* ANAMNESIS MODAL */}
      <AnimatePresence>
        {showAnamneza && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAnamneza(false)} className="absolute inset-0 bg-[#2E5481]/90 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9 }} className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[40px] shadow-2xl">
              <button type="button" onClick={() => setShowAnamneza(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-[#E31E24] z-50">
                <X size={32} />
              </button>
              <div className="p-2">
                <RequestAnalysisForm onSave={(data) => {
                   setAnamnezaData(data);
                   setAnamnezaDone(true);
                   setShowAnamneza(false);
                }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
