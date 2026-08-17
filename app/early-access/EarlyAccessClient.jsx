'use client';

import { EarlyAccessPage } from '../../src/views/EarlyAccessPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function EarlyAccessClient() {
  const navigate = useAppNavigate();

  return <EarlyAccessPage navigate={navigate} />;
}
