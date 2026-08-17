'use client';

import { OrderTracking } from '../../src/views/OrderTracking.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';

export default function OrderTrackingClient({ inquiryId = '' }) {
  const navigate = useAppNavigate();
  const { user, products } = useStorefront();

  return (
    <OrderTracking
      inquiryId={inquiryId}
      products={products}
      navigate={navigate}
      user={user}
    />
  );
}
