import './globals.css'
import type { Metadata } from 'next'

// [note.txt + Vercel] Kanonski URL sajta za OG/metadata; na produkciji obično = NEXT_PUBLIC_SITE_URL (npr. https://www.medexnews.com).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
  'https://www.medexnews.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // [IZMENA vs Zlatni standard] Naslov u tabu pregledača — brend "MedExNews", ne interni naziv projekta "Medex 2.0".
  title: 'MedExNews',
  description: 'Cardiology PhD Analysis',
  // Eksplicitno da svi browseri dobiju istu ikonu (pored app/icon.svg).
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' }],
    shortcut: ['/icon.svg'],
  },
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



