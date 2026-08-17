import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import DropshippingClient from './DropshippingClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Free Saree & Suit Dropshipping Program in India | Weave 365',
    description:
      'Start your free Banarasi saree & suit dropshipping business in India. Sourced directly from weavers with WhatsApp sharing, catalog downloads, and white-label website tools.',
    alternates: { canonical: `${siteUrl}/dropshipping` },
    openGraph: {
      title: 'Free Saree & Suit Dropshipping Program in India | Weave 365',
      description:
        'Start your free Banarasi saree & suit dropshipping business in India. Sourced directly from weavers with WhatsApp sharing, catalog downloads, and white-label website tools.',
      url: `${siteUrl}/dropshipping`,
    },
  };

  return getSeoMetadata('/dropshipping', defaultMeta);
}

export default function DropshippingRoute() {
  return <DropshippingClient />;
}
