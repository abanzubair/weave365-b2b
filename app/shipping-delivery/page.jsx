import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import ShippingDeliveryClient from './ShippingDeliveryClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Wholesale Saree Shipping & Worldwide Logistics | Weave 365',
    description:
      'Direct Varanasi warehouse dispatch, express domestic delivery, international courier timelines (US, UK, UAE), and bulk freight cargo configurations.',
    alternates: { canonical: `${siteUrl}/shipping-delivery` },
    openGraph: {
      title: 'Wholesale Saree Shipping & Worldwide Logistics | Weave 365',
      description:
        'Direct Varanasi warehouse dispatch, express domestic delivery, international courier timelines (US, UK, UAE), and bulk freight cargo configurations.',
      url: `${siteUrl}/shipping-delivery`,
    },
  };

  return getSeoMetadata('/shipping-delivery', defaultMeta);
}

export default function ShippingDeliveryRoute() {
  return <ShippingDeliveryClient />;
}
