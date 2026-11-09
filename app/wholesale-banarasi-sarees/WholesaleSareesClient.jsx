'use client';

import { WholesaleSareesPage } from '../../src/views/WholesaleSareesPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function WholesaleSareesClient() {
  const navigate = useAppNavigate();

  return <WholesaleSareesPage navigate={navigate} />;
}
