import OnboardingClient from './OnboardingClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Varanasi Silk Weaver Onboarding & Partnership | Weave 365',
    description: 'Are you a master weaver, manufacturer, or artisan in Varanasi? Onboard as a certified partner with Weave 365 to showcase your handlooms directly to global boutiques.',
    alternates: { canonical: `${siteUrl}/weaver-onboarding` },
  };
  return getSeoMetadata('/weaver-onboarding', defaultMeta);
}

export const runtime = 'edge';

export default function WeaverOnboardingPageRoute() {
  return <OnboardingClient />;
}
