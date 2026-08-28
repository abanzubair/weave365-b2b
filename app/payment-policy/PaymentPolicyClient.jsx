'use client';

import { PaymentPolicyPage } from '../../src/views/PaymentPolicyPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function PaymentPolicyClient() {
  const navigate = useAppNavigate();
  return <PaymentPolicyPage navigate={navigate} />;
}
