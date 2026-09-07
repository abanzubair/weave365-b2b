import { fetchProducts } from '../../../src/productData.js';
import { siteUrl, storeConfig } from '../../../src/config.js';
import { getSeoMetadata } from '../../../src/utils/seoHelper.js';
import PartnerClient from './PartnerClient.jsx';

export const revalidate = 3600;
export const runtime = 'edge';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const partnerSlug = decodeURIComponent(resolvedParams?.partnerName || '');
  const prettyPartnerName = partnerSlug
    ? partnerSlug
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Partner';

  const products = await fetchProducts().catch(() => []);
  const partnerProduct = products.find((p) => {
    const slug = (p.sourcePartner || p.sellerName || '').toLowerCase().replace(/\s+/g, '-');
    return slug === partnerSlug.toLowerCase();
  });
  const firstImage = partnerProduct?.images?.[0] || undefined;

  const defaultMeta = {
    title: `${prettyPartnerName}'s Collection | ${storeConfig.name}`,
    description: `Browse the exclusive saree collection by our weaver partner ${prettyPartnerName} on Weave 365.`,
    alternates: { canonical: `${siteUrl}/partner/${encodeURIComponent(partnerSlug)}` },
    firstImage,
    openGraph: {
      title: `${prettyPartnerName}'s Collection | ${storeConfig.name}`,
      description: `Browse the exclusive saree collection by our weaver partner ${prettyPartnerName} on Weave 365.`,
      url: `${siteUrl}/partner/${encodeURIComponent(partnerSlug)}`,
    },
  };

  return getSeoMetadata(`/partner/${encodeURIComponent(partnerSlug)}`, defaultMeta);
}

export default async function PartnerRoute({ params }) {
  const resolvedParams = await params;
  const partnerSlug = decodeURIComponent(resolvedParams?.partnerName || '');
  const products = await fetchProducts().catch(() => []);

  return <PartnerClient partnerSlug={partnerSlug} initialProducts={products} />;
}
