/**
 * [DODATO — note.txt SEO] Web App Manifest (PWA-light): ime u “Add to Home Screen”, theme-color.
 * Nije zamena za pun SEO, ali pomaže brendu i mobilnom iskustvu; tekst na engleskom za korisnike.
 */
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MedExNews — Science and Cardiology Analysis',
    short_name: 'MedExNews',
    description:
      'Expert-reviewed, evidence-based cardiology insights and personalized medicine context — not a substitute for your physician.',
    start_url: '/',
    display: 'browser',
    background_color: '#f8fafc',
    theme_color: '#2E5481',
    lang: 'en',
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
    ],
  };
}
