/**
 * [DODATO — note.txt SEO] Admin panel — eksplicitno noindex (čak i ako robots.txt već blokira).
 * Dvostruka zaštita: manje šanse da se URL pojavi u indeksu greškom.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
