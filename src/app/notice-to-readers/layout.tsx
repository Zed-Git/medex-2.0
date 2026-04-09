/** [DODATO — note.txt SEO] Meta za /notice-to-readers */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'Notice to readers';
const description =
  'Important notice to readers: how to interpret MedExNews content, limitations, and that information is not personal medical advice.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/notice-to-readers` },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/notice-to-readers`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title, description },
};

export default function NoticeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
