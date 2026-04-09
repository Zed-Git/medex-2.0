/** [DODATO — note.txt SEO] Meta za /about (stranica je client — metadata ovde). */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'About';
const description =
  'Learn about MedExNews — our mission to provide rigorous, evidence-based context on cardiology and modern medicine.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/about` },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/about`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
