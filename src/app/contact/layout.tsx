/** [DODATO — note.txt SEO] Meta za /contact */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'Contact';
const description =
  'Contact MedExNews — send a message about partnerships, editorial questions, or general inquiries.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/contact` },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/contact`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
