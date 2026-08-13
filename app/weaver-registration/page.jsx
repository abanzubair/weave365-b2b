import { Suspense } from 'react';
import RegistrationClient from './RegistrationClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Trusted Weaver Registration | Weave 365',
    description: 'Share your craft, capacity, and product details for manual review by the Weave 365 team. Become a trusted Banarasi saree vendor.',
    alternates: { canonical: `${siteUrl}/weaver-registration` },
    openGraph: {
      title: 'Trusted Weaver Registration | Weave 365',
      description: 'Share your craft, capacity, and product details for manual review by the Weave 365 team. Become a trusted Banarasi saree vendor.',
      url: `${siteUrl}/weaver-registration`,
      images: [{ url: `${siteUrl}/artisan_at_loom_premium.webp`, alt: 'Trusted Weaver Registration' }],
    },
  };
  return getSeoMetadata('/weaver-registration', defaultMeta);
}

export default function WeaverRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationClient />
    </Suspense>
  );
}
