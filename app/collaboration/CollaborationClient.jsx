'use client';

import { OurOfferings } from '../../src/views/OurOfferings.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function CollaborationClient() {
  const navigate = useAppNavigate();
  const { setAuthOpen } = useStorefront();

  return <OurOfferings navigate={navigate} openAuth={() => setAuthOpen(true)} />;
}
