'use client';

import { ResellerFaqsPage } from '../../src/views/ResellerFaqsPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function ResellerFaqsClient() {
  const navigate = useAppNavigate();
  return <ResellerFaqsPage navigate={navigate} />;
}
