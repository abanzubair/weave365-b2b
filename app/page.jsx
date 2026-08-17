import { fetchHeroData, fetchProducts, fetchSupabaseBlogPosts } from '../src/productData.js';
import { getSeoMetadata } from '../src/utils/seoHelper.js';
import { siteUrl } from '../src/config.js';
import HomeRouteClient from './HomeRouteClient.jsx';

export const revalidate = 3600; // Cache and revalidate every hour

export async function generateMetadata() {
  const defaultMeta = {
    title: 'Wholesale Banarasi Sarees Online | Saree Supplier India | Weave 365',
    description:
      'Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India. Explore silk, organza, katan and designer Banarasi collections.',
    alternates: { canonical: siteUrl },
    openGraph: {
      title: 'Wholesale Banarasi Sarees Online | Saree Supplier India | Weave 365',
      description:
        'Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India. Explore silk, organza, katan and designer Banarasi collections.',
      url: siteUrl,
      images: [
        {
          url: 'https://assets.weave365.com/assets/banner/Weave365.svg',
          width: 539,
          height: 100,
          alt: 'Weave 365 - Banarasi Sarees Wholesale',
        },
      ],
    },
  };

  return getSeoMetadata('/', defaultMeta);
}

export default async function HomePage() {
  const [heroSlides, products, blogs] = await Promise.all([
    fetchHeroData().catch(() => []),
    fetchProducts().catch(() => []),
    fetchSupabaseBlogPosts().catch(() => []),
  ]);

  return (
    <HomeRouteClient
      initialProducts={products}
      initialHeroSlides={heroSlides}
      initialBlogs={blogs}
    />
  );
}
