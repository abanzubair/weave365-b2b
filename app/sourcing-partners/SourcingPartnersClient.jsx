'use client';

import { PartnerProgramPage } from '../../src/views/PartnerProgramPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function SourcingPartnersClient() {
  const navigate = useAppNavigate();

  return <PartnerProgramPage type="sourcing-partners" navigate={navigate} />;
}
