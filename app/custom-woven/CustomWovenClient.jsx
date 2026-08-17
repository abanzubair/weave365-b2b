'use client';

import { CustomWovenPage } from '../../src/views/CustomWovenPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function CustomWovenClient() {
  const navigate = useAppNavigate();

  return <CustomWovenPage navigate={navigate} />;
}
