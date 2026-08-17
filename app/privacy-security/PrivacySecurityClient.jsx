'use client';

import { PrivacySecurityPage } from '../../src/views/PrivacySecurityPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function PrivacySecurityClient() {
  const navigate = useAppNavigate();
  return <PrivacySecurityPage navigate={navigate} />;
}
