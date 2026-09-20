import { Suspense } from 'react';
import ResellerFeaturesClient from '../resell-sarees-online/ResellerFeaturesClient.jsx';
import { siteUrl } from '../../src/config.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Resell Sarees Online | WhatsApp Catalog Sharing & Social Media Reseller Tools | Weave 365',
    description:
      'Resell authentic Banarasi sarees on WhatsApp, Instagram & Facebook with free tools from Weave 365. Share ready-made catalogs, add your markup, collect orders — we handle the rest. No inventory needed.',
    alternates: { canonical: `${siteUrl}/resell-sarees-online` },
    openGraph: {
      title: 'Resell Sarees Online | WhatsApp Catalog Sharing & Social Media Reseller Tools | Weave 365',
      description:
        'Resell authentic Banarasi sarees on WhatsApp, Instagram & Facebook with free tools from Weave 365. Share ready-made catalogs, add your markup, collect orders — we handle the rest. No inventory needed.',
      url: `${siteUrl}/resell-sarees-online`,
    },
  };
  return getSeoMetadata('/resell', defaultMeta);
}

export default function ResellAliasRoute() {
  return (
    <Suspense fallback={null}>
      <ResellerFeaturesClient />
    </Suspense>
  );
}
