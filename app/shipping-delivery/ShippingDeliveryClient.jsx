'use client';

import { ShippingDeliveryPage } from '../../src/views/ShippingDeliveryPage.jsx';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function ShippingDeliveryClient() {
  const navigate = useAppNavigate();
  return <ShippingDeliveryPage navigate={navigate} />;
}
