import OnboardingClient from './OnboardingClient.jsx';
import { siteUrl } from '../../src/config.js';

export const metadata = {
  title: 'Varanasi Silk Weaver Onboarding & Partnership | Weave 365',
  description: 'Are you a master weaver, manufacturer, or artisan in Varanasi? Onboard as a certified partner with Weave 365 to showcase your handlooms directly to global boutiques.',
  alternates: { canonical: `${siteUrl}/weaver-onboarding` },
};

export const runtime = 'edge';

export default function WeaverOnboardingPageRoute() {
  return <OnboardingClient />;
}
