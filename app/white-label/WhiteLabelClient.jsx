'use client';

import { PartnerProgramPage } from '../../src/views/PartnerProgramPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function WhiteLabelClient() {
  const navigate = useAppNavigate();

  return <PartnerProgramPage type="white-label" navigate={navigate} />;
}
