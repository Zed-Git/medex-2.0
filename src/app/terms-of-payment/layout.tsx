/** [DODATO — note.txt SEO] Meta za /terms-of-payment */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'Terms of payment';
const description =
  'Payment terms for MedExNews expert analysis and related services.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/terms-of-payment` },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/terms-of-payment`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary', title, description },
};

export default function TermsPaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
