import { Suspense } from 'react';
import SignupClient from './SignupClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export const revalidate = 3600;
export const runtime = 'edge';

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Weave 365 Sign-up',
    description:
      'Join Weave 365 as a B2B wholesale buyer, reseller, or artisan weaver partner. Access factory pricing, flexible MOQs, and live inventory directly from Varanasi.',
    alternates: { canonical: `${siteUrl}/signup` },
    openGraph: {
      title: 'Weave 365 Sign-up',
      description:
        'Join Weave 365 as a B2B wholesale buyer, reseller, or artisan weaver partner. Access factory pricing, flexible MOQs, and live inventory directly from Varanasi.',
      url: `${siteUrl}/signup`,
    },
  };

  return getSeoMetadata('/signup', defaultMeta);
}

export default function SignupPageRoute() {
  return (
    <Suspense fallback={null}>
      <SignupClient />
    </Suspense>
  );
}
