import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import SourcingPartnersClient from './SourcingPartnersClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
    description:
      'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
    alternates: { canonical: `${siteUrl}/sourcing-partners` },
    openGraph: {
      title: 'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
      description:
        'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
      url: `${siteUrl}/sourcing-partners`,
    },
  };

  return getSeoMetadata('/sourcing-partners', defaultMeta);
}

export default function SourcingPartnersRoute() {
  return <SourcingPartnersClient />;
}
