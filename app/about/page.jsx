import { Suspense } from 'react';
import AboutClient from './AboutClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export async function generateMetadata() {
  const defaultMeta = {
    title: 'About Weave 365 | Premium Banarasi Saree Wholesaler India',
    description: 'Discover Weave 365, India\'s leading Banarasi saree supplier. Learn about our heritage, meet our 200+ Varanasi artisan network, and explore our 5-step quality verification process.',
    alternates: { canonical: `${siteUrl}/about` },
  };
  return getSeoMetadata('/about', defaultMeta);
}

export default function AboutPage() {
  return (
    <Suspense fallback={null}>
      <AboutClient />
    </Suspense>
  );
}
