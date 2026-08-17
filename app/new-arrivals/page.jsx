import { fetchProducts } from '../../src/productData.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import { siteUrl } from '../../src/config.js';
import NewArrivalsClient from './NewArrivalsClient.jsx';

export const revalidate = 3600;

export async function generateMetadata() {
  const defaultMeta = {
    title: 'New Arrivals: Latest Wholesale Banarasi Sarees & Suits | Weave 365',
    description:
      'Explore our latest collection of handwoven pure silk Banarasi sarees, suits, and fabrics direct from Varanasi weavers. Updated weekly with fresh designs.',
    alternates: { canonical: `${siteUrl}/new-arrivals` },
    openGraph: {
      title: 'New Arrivals: Latest Wholesale Banarasi Sarees & Suits | Weave 365',
      description:
        'Explore our latest collection of handwoven pure silk Banarasi sarees, suits, and fabrics direct from Varanasi weavers. Updated weekly with fresh designs.',
      url: `${siteUrl}/new-arrivals`,
    },
  };

  return getSeoMetadata('/new-arrivals', defaultMeta);
}

export default async function NewArrivalsRoute() {
  const products = await fetchProducts().catch(() => []);

  return <NewArrivalsClient initialProducts={products} />;
}
