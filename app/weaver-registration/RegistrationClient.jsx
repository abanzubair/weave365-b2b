'use client';

import { TrustedPartnerRegistrationPage } from '../../src/views/TrustedPartnerRegistrationPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function RegistrationClient() {
  const navigate = useAppNavigate();
  return <TrustedPartnerRegistrationPage navigate={navigate} />;
}
