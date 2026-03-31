// [DODATO vs Zlatni standard] Centralizovan sadržaj za kartice "MEDICINE IN THE FUTURE"
// i zasebne stranice analiza. UI tekst je na engleskom; komentari su za developera.

export type FeaturedAnalysis = {
  id: number;
  slug: string;
  title: string;
  description: string;
  tag: 'BASICS' | 'CLINICAL CARDIOLOGY' | 'FUTURE';
  body: string[];
};

export const FEATURED_ANALYSES: readonly FeaturedAnalysis[] = [
  {
    id: 1,
    slug: 'ai-echocardiography',
    title: 'AI in Echocardiography',
    description:
      'How machine learning is revolutionizing valve disease detection.',
    tag: 'BASICS',
    body: [
      'Echocardiography is increasingly supported by AI models that can help segment cardiac chambers, quantify valve function, and highlight potential abnormalities.',
      'In practice, these tools can reduce variability, speed up routine measurements, and improve triage — but they do not replace clinical judgment.',
      'Key takeaway: AI can improve consistency and efficiency, especially for high‑volume workflows and structured reporting.',
    ],
  },
  {
    id: 2,
    slug: 'gene-therapy-trends',
    title: 'Gene Therapy Trends',
    description: 'The future of treating cardiomyopathy.',
    tag: 'CLINICAL CARDIOLOGY',
    body: [
      'Gene-based therapies are being explored for inherited cardiomyopathies and specific metabolic disorders affecting the myocardium.',
      'The most important constraints remain patient selection, long-term safety, and proving durable outcomes across diverse populations.',
      'Key takeaway: the field is promising, but evidence‑based adoption requires clear indications and rigorous follow‑up.',
    ],
  },
  {
    id: 3,
    slug: 'remote-monitoring',
    title: 'Remote Monitoring',
    description: 'Impact of wearable devices on recovery.',
    tag: 'FUTURE',
    body: [
      'Wearables and home monitoring can detect rhythm irregularities, track functional recovery, and support adherence to therapy plans.',
      'They can help clinicians catch issues earlier, but false positives and data overload must be managed with clear protocols.',
      'Key takeaway: remote monitoring works best when integrated into a care pathway, not used as a standalone gadget.',
    ],
  },
] as const;

