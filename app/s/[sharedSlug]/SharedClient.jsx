'use client';

import { useEffect } from 'react';

export default function SharedClient({ sharedSlug }) {
  useEffect(() => {
    const target = sharedSlug
      ? `/store/${encodeURIComponent(sharedSlug)}`
      : '/resell-sarees-online';
    window.location.replace(target);
  }, [sharedSlug]);

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#737373', fontSize: '15px' }}>Connecting to live boutique storefront…</p>
    </div>
  );
}
