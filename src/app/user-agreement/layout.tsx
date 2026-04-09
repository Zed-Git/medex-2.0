/** [DODATO — note.txt SEO] Meta za /user-agreement */
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/site-url';

const title = 'User agreement';
const description =
  'User agreement governing access to MedExNews and use of our platform.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${getSiteUrl()}/user-agreement` },
  openGraph: {
    title,
    description,
    url: `${getSiteUrl()}/user-agreement`,
    siteName: 'MedExNews',
    locale: 'en_US',
    type: 'website',
  },
  twitter: { card: 'summary', title, description },
};

export default function UserAgreementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
