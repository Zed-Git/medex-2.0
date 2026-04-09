/** [DODATO — note.txt SEO] Meta za /terms-and-conditions */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'Terms and conditions';
const description =
  'Terms and conditions for using the MedExNews website and services.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/terms-and-conditions` },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/terms-and-conditions`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary', title, description },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
