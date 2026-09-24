import { Suspense } from 'react';
import AboutClient from './AboutClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export const runtime = 'edge';

export function generateMetadata() {
  const title = 'About Weave 365 | Premium Banarasi Saree Wholesaler India';
  const description = "Discover Weave 365, India's leading Banarasi saree supplier. Learn about our heritage, meet our 200+ Varanasi artisan network, and explore our 5-step quality verification process.";
  const canonical = `${siteUrl}/about`;
  const ogImage = `${siteUrl}/artisan_at_loom_premium.webp`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Weave 365',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function AboutPage() {
  return <AboutClient />;
}
