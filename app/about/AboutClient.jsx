'use client';

import { AboutPage } from '../../src/views/AboutPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function AboutClient() {
  const navigate = useAppNavigate();
  return <AboutPage navigate={navigate} />;
}
