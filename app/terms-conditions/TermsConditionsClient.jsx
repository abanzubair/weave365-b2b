'use client';

import { TermsConditionsPage } from '../../src/views/TermsConditionsPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function TermsConditionsClient() {
  const navigate = useAppNavigate();
  return <TermsConditionsPage navigate={navigate} />;
}
