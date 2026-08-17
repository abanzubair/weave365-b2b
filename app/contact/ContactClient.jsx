'use client';

import { ContactPage } from '../../src/views/ContactPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function ContactClient() {
  const navigate = useAppNavigate();
  return <ContactPage navigate={navigate} />;
}
