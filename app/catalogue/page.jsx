import { Suspense } from 'react';
import { fetchProducts, fetchConfigOptions } from '../../src/productData.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import CatalogueClient from './CatalogueClient.jsx';

export const revalidate = 3600;
export const runtime = 'edge';

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search;
  const category = resolvedSearchParams?.category;
  const fabric = resolvedSearchParams?.fabric;

  let title = 'Wholesale Saree & Suit Catalogue | Weave 365';
  let description = 'Browse our live Banarasi saree and suit wholesale catalogue. Sourced directly from Varanasi weavers for boutiques and retailers.';
  let canonical = '/catalogue';

  if (search) {
    title = `Wholesale Banarasi Sarees matching "${search}" | Weave 365`;
    description = `Explore wholesale Banarasi sarees matching "${search}" at direct-from-weaver wholesale prices with flexible MOQ for resellers and boutiques.`;
    canonical = `/catalogue?search=${encodeURIComponent(search)}`;
  } else if (category && category !== 'all' && category !== 'All') {
    const prettyCategory = category.charAt(0).toUpperCase() + category.slice(1);
    title = `Wholesale Banarasi ${prettyCategory} Collection | Weave 365`;
    description = `Shop premium wholesale Banarasi ${prettyCategory} direct from Varanasi weavers. High quality, flexible MOQ, and worldwide delivery for resellers.`;
    canonical = `/catalogue?category=${encodeURIComponent(category)}`;
  } else if (fabric && fabric !== 'all' && fabric !== 'All') {
    const prettyFabric = fabric.charAt(0).toUpperCase() + fabric.slice(1);
    title = `Pure ${prettyFabric} Silk Banarasi Sarees Wholesale | Weave 365`;
    description = `Discover handwoven pure ${prettyFabric} Banarasi sarees at wholesale prices. Certified quality checks and worldwide shipping for boutique owners.`;
    canonical = `/catalogue?fabric=${encodeURIComponent(fabric)}`;
  }

  const defaultMeta = {
    title,
    description,
    alternates: { canonical: `${siteUrl}${canonical}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonical}`,
    },
  };

  return getSeoMetadata(canonical, defaultMeta);
}

export default async function CataloguePage() {
  const [products, configOptions] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchConfigOptions().catch(() => null),
  ]);

  return (
    <Suspense fallback={null}>
      <CatalogueClient
        initialProducts={products}
        initialConfigOptions={configOptions}
      />
    </Suspense>
  );
}
