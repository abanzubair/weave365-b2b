'use client';

import { WeaverOnboardingPage } from '../../src/views/WeaverOnboardingPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function OnboardingClient() {
  const navigate = useAppNavigate();
  return <WeaverOnboardingPage navigate={navigate} />;
}
