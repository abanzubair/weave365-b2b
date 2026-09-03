import { Suspense } from 'react';
import SellerPageClient from '../sell-banarasi-sarees/SellerPageClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Sell Banarasi Sarees Online | Varanasi Sellers | Weave 365',
    description:
      'Varanasi weavers and sellers: list Banarasi sarees & suits on Weave 365, reach B2B & B2C buyers across India and worldwide, with fulfilment support.',
    alternates: { canonical: `${siteUrl}/sell-banarasi-sarees` },
    openGraph: {
      title: 'Sell Banarasi Sarees Online | Varanasi Sellers | Weave 365',
      description:
        'Varanasi weavers and sellers: list Banarasi sarees & suits on Weave 365, reach B2B & B2C buyers across India and worldwide, with fulfilment support.',
      url: `${siteUrl}/sell-banarasi-sarees`,
    },
  };
  return getSeoMetadata('/sellers', defaultMeta);
}

export default function SellersAliasRoute() {
  return (
    <Suspense fallback={null}>
      <SellerPageClient />
    </Suspense>
  );
}
