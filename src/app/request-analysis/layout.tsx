/** [DODATO — note.txt SEO] Meta za /request-analysis */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'Request expert analysis';
const description =
  'Submit your cardiology questions, results, or dilemmas for structured expert review through MedExNews.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/request-analysis` },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/request-analysis`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default function RequestAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
