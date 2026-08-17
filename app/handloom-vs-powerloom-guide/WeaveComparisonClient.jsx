'use client';

import { WeaveComparisonGuidePage } from '../../src/views/WeaveComparisonGuidePage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function WeaveComparisonClient() {
  const navigate = useAppNavigate();
  return <WeaveComparisonGuidePage navigate={navigate} />;
}
