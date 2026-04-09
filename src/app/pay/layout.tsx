/** [DODATO — note.txt SEO] Meta za /pay */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'Payment';
const description =
  'Secure payment for MedExNews expert analysis services via our checkout flow.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/pay` },
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/pay`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary', title, description },
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
