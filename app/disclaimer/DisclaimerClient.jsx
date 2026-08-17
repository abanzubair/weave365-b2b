'use client';

import { DisclaimerPage } from '../../src/views/DisclaimerPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function DisclaimerClient() {
  const navigate = useAppNavigate();
  return <DisclaimerPage navigate={navigate} />;
}
