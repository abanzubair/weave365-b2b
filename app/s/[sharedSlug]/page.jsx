import { fetchProducts } from '../../../src/productData.js';
import { siteUrl } from '../../../src/config.js';
import { getSeoMetadata } from '../../../src/utils/seoHelper.js';
import SharedClient from './SharedClient.jsx';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const sharedSlug = decodeURIComponent(resolvedParams?.sharedSlug || '');

  const defaultMeta = {
    title: 'Shared Catalogue | Weave 365',
    description: 'A shared Weave 365 reseller catalogue featuring premium wholesale Banarasi sarees.',
    alternates: { canonical: `${siteUrl}/s/${encodeURIComponent(sharedSlug)}` },
  };

  return getSeoMetadata(`/s/${encodeURIComponent(sharedSlug)}`, defaultMeta);
}

export default async function SharedCatalogueRoute({ params }) {
  const resolvedParams = await params;
  const sharedSlug = decodeURIComponent(resolvedParams?.sharedSlug || '');
  const products = await fetchProducts().catch(() => []);

  return <SharedClient sharedSlug={sharedSlug} initialProducts={products} />;
}
