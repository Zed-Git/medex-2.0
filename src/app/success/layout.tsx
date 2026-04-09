/** [DODATO — note.txt SEO] Thank-you stranica — ne indeksirati (izbegni “thin” duplicate u Google-u). */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'Thank you';
const description = 'Your MedExNews payment or request was received successfully.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/success` },
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/success`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary', title, description },
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
