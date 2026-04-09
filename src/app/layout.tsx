import './globals.css'
import type { Metadata, Viewport } from 'next'
import { SeoJsonLd } from '@/components/SeoJsonLd'
import { getSiteUrl } from '@/lib/site-url'

/**
 * [Zadržano iz Zlatnog standarda] Viewport + theme-color — ne menjamo ponašanje na mobilnom.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2E5481',
}

/**
 * [IZMENA / proširenje vs Zlatni standard — note.txt SEO]
 * Ranije: samo title, description, icons.
 * Sada: template za podstranice, Open Graph, Twitter/X kartice, robots, canonical početne,
 * ključne reči, opciona Google Search Console verifikacija preko env.
 * Svi stringovi vidljivi korisnicima sajta = engleski.
 */
const siteUrl = getSiteUrl()

const defaultTitle = 'MedExNews — Science & Cardiology Analysis'
const defaultDescription =
  'Expert-reviewed context on evidence-based cardiology, personalized medicine, and AI in healthcare. Educational analysis—not a substitute for your physician.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | MedExNews',
  },
  description: defaultDescription,
  applicationName: 'MedExNews',
  authors: [{ name: 'MedExNews', url: siteUrl }],
  creator: 'MedExNews',
  publisher: 'MedExNews',
  category: 'health',
  keywords: [
    'cardiology',
    'evidence-based medicine',
    'personalized medicine',
    'medical AI',
    'heart disease',
    'clinical analysis',
    'MedExNews',
  ],
  /** Sprečava iOS da automatski linkuje “lažne” telefone/email iz brojeva u tekstu (često željeno na landing stranama). */
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' }],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/icon.svg', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'MedExNews',
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: '/logo.webp',
        alt: 'MedExNews',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  /**
   * Opciono: u Vercel / .env.local dodaj NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION = meta tag vrednost iz Search Console.
   * Ako nije setovano, polje je undefined i Next ga ne renderuje (ništa se ne lomi).
   */
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  appleWebApp: {
    capable: true,
    title: 'MedExNews',
    statusBarStyle: 'default',
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
        {/* [DODATO — note.txt SEO] JSON-LD sme i u body; Google ga indeksira. Izbegavamo ručni <head> jer Next upravlja meta tagovima. */}
        <SeoJsonLd />
        {/* [Zadržano iz Zlatnog standarda] Globalni background za sve stranice. */}
        <div
          className="fixed inset-0 -z-10 bg-slate-200 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/medback1.webp')" }}
          aria-hidden
        />
        <div className="fixed inset-0 -z-10 bg-white/40" aria-hidden />
        {children}
      </body>
    </html>
  )
}
