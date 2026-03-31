import './globals.css'

export const metadata = {
  title: 'Medex 2.0',
  description: 'Cardiology PhD Analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        {/* [DODATO vs Zlatni standard] Globalni background (u skladu sa sajtom) za SVE stranice. */}
        <div
          className="fixed inset-0 -z-10 bg-slate-200 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/medback1.webp')" }}
          aria-hidden
        />
        {/* Blagi overlay da sadržaj ostane čitljiv. */}
        <div className="fixed inset-0 -z-10 bg-white/40" aria-hidden />
        {children}
      </body>
    </html>
  )
}



