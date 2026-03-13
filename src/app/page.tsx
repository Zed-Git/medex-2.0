'use client';

import { useState, useRef } from "react";
import { submitMedicalRequest } from "./actions"; 
import { motion } from "framer-motion";
import Image from "next/image"; 
import Link from "next/link"; 
import { FileUpload } from "@/components/FileUpload"; 
// UKLONILI SMO 'Lock' IZ OVE LINIJE JER GA NE KORISTIMO
import { ArrowDown, CheckCircle2, ShieldCheck, Activity, ArrowRight } from "lucide-react";

const NEWS_DATA = [
  { id: 1, title: "AI in Echocardiography", description: "How machine learning is revolutionizing valve disease detection.", tag: "TECHNOLOGY" },
  { id: 2, title: "Gene Therapy Trends", description: "The future of treating hypertrophic cardiomyopathy at the DNA level.", tag: "GENETICS" },
  { id: 3, title: "Remote Monitoring", description: "The impact of wearable devices on post-operative recovery speed.", tag: "CLINICAL" },
];

export default function LandingPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [urgency, setUrgency] = useState('Normal');
  const [isAgreed, setIsAgreed] = useState(false);
  const [file, setFile] = useState<File | null>(null); 
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPrice = () => urgency === 'Priority' ? '$30' : '$15';

  async function handleSubmit(formData: FormData) {
    if (!isAgreed) {
      alert("Please confirm that you agree with our Terms and Conditions.");
      return;
    }
    if (file) formData.append('medicalFile', file);

    setStatus('loading');
    try {
      const result = await submitMedicalRequest(formData);
      if (result.success) setStatus('success');
      else {
        setStatus('error');
        alert(result.message || "Submission error.");
      }
    } catch { 
      setStatus('error');
      alert("An unexpected error occurred.");
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 rounded-[40px] shadow-2xl border-t-8 border-green-500 max-w-lg">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-[#2E5481] uppercase tracking-tighter">REQUEST RECEIVED</h1>
          <button onClick={() => setStatus('idle')} className="mt-8 px-10 py-4 bg-[#2E5481] text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#1a3a5a] transition-all">New Patient</button>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen bg-white font-sans tracking-tight text-slate-900">
      
      {/* 1. NAVIGACIJA */}
      <nav className="sticky top-0 z-50 w-full bg-[#2E5481] border-b-4 border-[#E31E24] py-4 px-6 md:px-12 text-white shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer flex flex-col min-w-max">
            <div className="flex items-baseline leading-none">
              <span className="text-2xl md:text-3xl font-black tracking-tighter italic">MedExNews</span>
              <sup className="text-[10px] font-black text-[#E31E24] ml-0.5 bg-white px-1 rounded-sm">AI</sup>
            </div>
            <div className="h-1 w-full bg-[#E31E24] mt-1"></div>
          </div>
          <div className="hidden lg:flex flex-col items-center flex-1 mx-8 text-center leading-tight">
             <h2 className="text-2xl font-black uppercase tracking-tight">CARDIOLOGY ANALYSIS ACCORDING EVIDENCE BASED</h2>
             <p className="text-xs uppercase tracking-widest font-bold text-red-100 opacity-95 italic mt-1">- Personalized Medicine and AI (with Expert Review) -</p>
          </div>
        </div>
      </nav>


      {/* 2. HERO SEKCIJA (TRIPTIH) */}
      <section className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-3 flex flex-col gap-4 self-center justify-center">
            <motion.div onClick={scrollToForm} whileHover={{ y: -5 }} className="cursor-pointer bg-[#2E5481] p-6 rounded-[35px] text-white shadow-[0_25px_60px_rgba(0,0,0,0.4)] flex flex-col justify-center text-center relative h-64 overflow-hidden">
              <h3 className="text-[#E31E24] text-4xl font-black italic mb-1 uppercase tracking-tighter">SUBMIT</h3> 
              <p className="text-[11px] font-black uppercase leading-tight mb-4 tracking-wider">YOUR CARDIOLOGY <br/> QUESTION/RESULTS/ <br/> DILEMMA...?</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[8px] font-black text-[#E31E24] uppercase italic">click to start analysis</span>
                <ArrowDown className="text-[#E31E24] animate-bounce" size={18} />
              </div>
            </motion.div>
            <button className="w-full bg-white border-2 border-slate-100 py-3 rounded-2xl text-[#2E5481] font-black text-[10px] uppercase tracking-widest shadow-[0_10px_25px_rgba(227,30,36,0.25)] flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
              Sample Report <ArrowDown size={14} className="text-[#E31E24]" />
            </button>
        </div>

        <div className="lg:col-span-3 bg-white border border-slate-100 p-8 rounded-[35px] shadow-xl h-96 flex flex-col justify-center text-center">
          <span className="text-[9px] font-black text-[#2E5481] opacity-60 uppercase tracking-widest italic block mb-2">Simple Steps / No Delays</span>
          <h3 className="text-xl font-black text-[#2E5481] uppercase border-b-4 border-[#E31E24] pb-1 inline-block tracking-tighter">HOW IT WORKS</h3>
          <div className="space-y-6 mt-6">
            {[ {id: "01", t: "Your Request"}, {id: "02", t: "Our Analysis"}, {id: "03", t: "Your Answer"} ].map((step) => (
              <div key={step.id} className="flex items-center gap-4 group">
                <div className="w-1.5 h-10 bg-slate-100 rounded-full group-hover:bg-[#E31E24] transition-colors duration-300"></div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-800">{step.id}. {step.t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6 h-96 relative">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }} className="rounded-[35px] overflow-hidden shadow-2xl border-4 border-white h-full relative group">
            <Image src="/doctor.png" alt="Doctor" fill className="object-cover object-top transition-transform duration-1000 group-hover:scale-105" priority />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-[#2E5481] max-w-50 z-20">
              <p className="text-[10px] font-bold text-[#2E5481] leading-relaxed italic">&quot;After analysis, we will send you <span className="underline font-black">Evidence Based Personalized</span> report...&quot;</p>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* 3. MEDICINE IN THE FUTURE */}
      <section className="bg-slate-50 py-10 px-6 mt-2">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[#2E5481] uppercase mb-1 tracking-tighter">MEDICINE IN THE FUTURE</h2>
          <div className="w-16 h-1.5 bg-[#E31E24] mx-auto mb-8 rounded-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {NEWS_DATA.map((news, idx) => (
              <motion.div key={news.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover={{ y: -10 }} className="bg-white p-6 rounded-[30px] shadow-md border border-slate-100 text-left hover:shadow-2xl transition-all cursor-default">
                <span className="text-[#E31E24] font-black text-[9px] tracking-widest uppercase">{news.tag}</span>
                <h3 className="text-lg font-black text-slate-800 mt-2 mb-2 uppercase leading-tight">{news.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-4 font-medium">{news.description}</p>
                <button className="text-[#2E5481] font-black text-[9px] uppercase border-b-2 border-slate-100 hover:border-[#E31E24] transition-all flex items-center gap-1 italic">Read Analysis <ArrowRight size={12} /></button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FORM SEKCIJA */}
      <section ref={formRef} className="max-w-5xl mx-auto p-1 my-2">
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-red-50 border-b border-red-100 p-2 md:p-3 flex items-center justify-center gap-4 text-center">
            <div className="bg-[#E31E24] text-white w-7 h-7 flex items-center justify-center rounded-full font-black text-xs shrink-0 shadow-lg animate-pulse">!</div>
            <p className="text-[#E31E24] font-black text-[9px] md:text-[10px] uppercase italic leading-tight tracking-tight">
              Note: MedExNews does not provide medical diagnosis or treatment. In emergency, ask your physician or call 911 immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-3 bg-[#2E5481] p-4 text-white flex flex-col justify-center items-center text-center gap-6">
              <h2 className="text-xl font-black uppercase leading-none border-b border-white/20 pb-3 w-full tracking-tighter">REQUEST <br/> ANALYSIS</h2>
              
              <div className="w-full">
                <span className="text-[8px] font-black opacity-60 block mb-1 uppercase tracking-widest italic">Estimated Fee</span>
                <span className="text-5xl font-black text-white">{getPrice()}</span>
                <div className="mt-2 p-2 bg-white/10 rounded-xl border border-white/10">
                  <p className="text-[9px] font-black text-yellow-400 uppercase italic leading-tight tracking-wider">
                    NO NEED TO PAY NOW!<br/>YOU PAY AFTER REPORT!
                  </p>
                  <p className="text-[8px] font-black text-white/70 uppercase italic mt-2 tracking-widest">
                    No Need credit Card Now...
                  </p>
                </div>
              </div>

              <div className="space-y-2 w-full pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-red-400" /> Secure & Confident
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Activity size={16} className="text-green-400" /> AI + EXPERT REVIEW
                </div>
              </div>
            </div>

            <form action={handleSubmit} className="lg:col-span-9 p-6 md:p-8 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-4">
                <div className="flex flex-col border-b border-slate-100 pb-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 italic mb-1">Full Name <span className="text-red-600 font-black text-sm">*</span></label>
                  <input name="fullName" required className="outline-none font-bold text-slate-700 p-0 text-sm bg-transparent" placeholder="John Smith" />
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 italic mb-1">Email <span className="text-red-600 font-black text-sm">*</span></label>
                  <input name="email" type="email" required className="outline-none font-bold text-slate-700 p-0 text-sm bg-transparent" placeholder="mdzdravko@yahoo.com" />
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 italic mb-1">Phone (Optional)</label>
                  <input name="phone" className="outline-none font-bold text-slate-700 p-0 text-sm bg-transparent" placeholder="+381..." />
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 italic mb-1">Urgency <span className="text-red-600 font-black text-sm">*</span></label>
                  <select name="urgency" required onChange={(e) => setUrgency(e.target.value)} className="font-black text-[#2E5481] cursor-pointer outline-none bg-transparent text-xs p-0 uppercase">
                      <option value="Normal">($15) NORMAL REVIEW</option>
                      <option value="Priority">($30) PRIORITY REVIEW</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase text-[#2E5481] mb-1 italic tracking-widest">Attach Clinical Findings (Optional)</label>
                <div className="bg-slate-50 rounded-2xl p-1 border-2 border-dashed border-slate-200 hover:border-[#2E5481] transition-colors">
                    <FileUpload onFileSelect={(selectedFile) => setFile(selectedFile)} />
                </div>
                <p className="mt-1 text-[8px] font-black text-slate-400 uppercase italic text-center tracking-[0.2em]">
                    JPG, PNG, PDF, MP4 | MAX SIZE: 10MB
                </p>
              </div>

              <div className="mb-4">
                <label className="text-[9px] font-black uppercase text-slate-400 italic block mb-1">Describe finding or dilemma <span className="text-red-600 font-black text-sm">*</span></label>
                <textarea name="description" required rows={6} className="w-full bg-slate-50 rounded-2xl p-4 outline-none border border-slate-100 font-medium text-sm shadow-inner" placeholder="Please provide details..."></textarea>
              </div>

              <div className="mb-4 flex items-start gap-3">
                <input type="checkbox" id="legal-checkbox" required checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-[#2E5481] cursor-pointer" />
                <label htmlFor="legal-checkbox" className="text-[9px] font-bold text-slate-500 uppercase italic leading-tight cursor-pointer">
                  I confirm that I am over 18 years old and agree <span className="text-[#2E5481] underline font-black uppercase">User Agreement & Notice to Readers</span>.
                </label>
              </div>


              <button type="submit" disabled={status === 'loading'} className="w-full bg-[#E31E24] text-white font-black py-4 rounded-xl shadow-xl uppercase tracking-widest hover:bg-[#b0171c] transition-all text-sm">
                {status === 'loading' ? 'ANALYZING...' : 'SEND FOR EXPERT ANALYSIS →'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-[#2E5481] pt-12 pb-6 px-6 md:px-12 text-white border-t-8 border-[#E31E24]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-left border-b border-white/10 pb-10">
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-4 italic">Company</h4>
            <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest opacity-80 italic">
              <li><Link href="/about" className="hover:text-white transition-colors">ABOUT US</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">CONTACT US</Link></li>
              <li><a href="mailto:medexnews@gmail.com" className="hover:text-white transition-colors">medexnews@gmail.com</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-4 italic">Legal</h4>
            <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest opacity-80 italic">
              <li><Link href="/terms-conditions" className="hover:text-white transition-colors">TERMS & CONDITIONS</Link></li>
              <li><Link href="/user-agreement" className="hover:text-white transition-colors">USER AGREEMENT</Link></li>
              <li><Link href="/terms-payment" className="hover:text-white transition-colors">TERMS OF PAYMENT</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black text-red-400 uppercase tracking-widest text-[10px] mb-4 italic">Resources</h4>
            <ul className="space-y-2 text-[10px] font-black uppercase tracking-widest opacity-80 italic">
              <li><Link href="/notice-readers" className="hover:text-white transition-colors">NOTICE TO READERS</Link></li>
              <li><Link href="/ai-protocols" className="hover:text-white transition-colors">AI PROTOCOLS</Link></li>
            </ul>
          </div>
          <div className="flex flex-col items-start md:items-end leading-none">
             <div className="flex items-baseline mb-2">
                <span className="text-3xl font-black italic uppercase">MedExNews</span>
                <sup className="text-xs text-[#E31E24] ml-1 font-black">AI</sup>
             </div>
             <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-4">© 2026 MedExNews | ALL RIGHTS RESERVED</p>
             <p className="text-[8px] uppercase font-black text-slate-500 mt-1 opacity-60 italic text-right w-full">Unauthorized Use Prohibited. MedExNews does not provide medical advices, diagnosis or treatment. See additional Information.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}


