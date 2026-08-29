'use client';

import { CollaborationPage } from '../../src/views/CollaborationPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function CollaborationClient() {
  const navigate = useAppNavigate();

  return <CollaborationPage navigate={navigate} openAuth={() => navigate('signup', 'partner')} />;
}
