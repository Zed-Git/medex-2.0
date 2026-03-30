'use client';

// =============================================================================
// [DODATO vs Zlatni standard] Omotač za plaćanje na NAŠEM sajtu (Embedded Stripe).
// Razlog: Stripe Hosted (checkout.stripe.com) ne može imati medback1.webp ni naš header/footer.
// Ovaj shell kopira vizuelni identitet landing stranice — tekst na engleskom.
// =============================================================================

import Link from 'next/link';

export default function PaymentFlowShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-200 font-sans tracking-tight text-slate-900">
      {/* Pozadina: stavi fajl u public/medback1.webp (kao na starom PayPal checkout-u). */}
      <div
        className="fixed inset-0 z-0 bg-slate-300 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/medback1.webp')" }}
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="w-full border-b-4 border-[#E31E24] bg-[#2E5481] py-4 px-6 text-white shadow-xl md:px-12">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="flex min-w-max flex-col">
              <div className="flex cursor-pointer items-baseline leading-none">
                <span className="text-2xl font-black tracking-tighter italic md:text-3xl">
                  MedExNews
                </span>
                <sup className="ml-0.5 rounded-sm bg-white px-1 text-[20px] font-black italic text-[#E31E24]">
                  AI
                </sup>
              </div>
              <div className="mt-1 h-1 w-full bg-[#E31E24]" />
            </Link>
            <div className="mx-8 hidden flex-1 text-center lg:block">
              <h2 className="text-2xl font-black uppercase leading-none tracking-tight text-white">
                Science and Cardiology Analysis
              </h2>
              <p className="mt-1 text-xs font-bold uppercase italic leading-none tracking-widest text-red-100 opacity-95">
                An Expert Review of Evidence-Based, Personalized Medicine, and AI
              </p>
            </div>
          </div>
        </nav>

        {children}

        <footer className="mt-auto border-t-8 border-[#E31E24] bg-[#2E5481] px-6 pt-12 pb-8 text-white md:px-12">
          <div className="mx-auto mb-10 grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-4">
            <div>
              <h4 className="mb-4 text-[10px] font-black uppercase italic tracking-widest text-red-400">
                Company
              </h4>
              <ul className="space-y-2 text-[10px] font-black uppercase italic tracking-widest opacity-80">
                <li>
                  <Link href="#">About us</Link>
                </li>
                <li>
                  <Link href="#">Contact us</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-black uppercase italic tracking-widest text-red-400">
                Legal
              </h4>
              <ul className="space-y-2 text-[10px] font-black uppercase italic tracking-widest opacity-80">
                <li>
                  <Link href="#">Terms &amp; conditions</Link>
                </li>
                <li>
                  <Link href="#">User agreement</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[10px] font-black uppercase italic tracking-widest text-red-400">
                Resources
              </h4>
              <ul className="space-y-2 text-[10px] font-black uppercase italic tracking-widest opacity-80">
                <li>
                  <Link href="#">Notice to readers</Link>
                </li>
                <li>
                  <Link href="#">Terms of payment</Link>
                </li>
              </ul>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <div className="flex items-baseline leading-none">
                <span className="text-xl font-black tracking-tighter italic">
                  MedExNews
                </span>
                <sup className="ml-0.5 rounded-sm bg-white px-1 text-[12px] font-black italic text-[#E31E24]">
                  AI
                </sup>
              </div>
              <p className="mt-4 max-w-xs text-left text-[10px] font-black uppercase tracking-widest text-slate-400 md:text-right md:leading-snug">
                © {new Date().getFullYear()} MedExNews. All rights reserved.
                MedExNews does not provide medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
