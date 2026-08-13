'use client';

import { WeaverOnboardingPage } from '../../src/views/WeaverOnboardingPage.jsx';
import { useRouter } from 'next/navigation';

export default function OnboardingClient() {
  const router = useRouter();
  return <WeaverOnboardingPage openAuth={() => router.push('/weaver-registration')} />;
}
