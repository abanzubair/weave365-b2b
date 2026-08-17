'use client';

import { ReturnsCancellationPage } from '../../src/views/ReturnsCancellationPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function ReturnsCancellationClient() {
  const navigate = useAppNavigate();
  return <ReturnsCancellationPage navigate={navigate} />;
}
