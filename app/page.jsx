import { fetchHeroData, fetchProducts, fetchSupabaseBlogPosts } from '../src/productData.js';
import { getSeoMetadata } from '../src/utils/seoHelper.js';
import { siteUrl } from '../src/config.js';
import HomeRouteClient from './HomeRouteClient.jsx';

export const revalidate = 300; // Cache and revalidate every 5 minutes
export const runtime = 'edge';

export async function generateMetadata() {
  const heroSlides = await fetchHeroData().catch(() => []);
  const firstHeroImage =
    heroSlides?.[0]?.image ||
    heroSlides?.[0]?.imageUrl ||
    'https://assets.weave365.com/assets/banner/heroFreeWebsite.webp';

  const defaultMeta = {
    title: 'Wholesale Banarasi Sarees Online | Saree Supplier India | Weave 365',
    description:
      'Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India. Explore silk, organza, katan and designer Banarasi collections.',
    alternates: { canonical: siteUrl },
    firstImage: firstHeroImage,
    openGraph: {
      title: 'Wholesale Banarasi Sarees Online | Saree Supplier India | Weave 365',
      description:
        'Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India. Explore silk, organza, katan and designer Banarasi collections.',
      url: siteUrl,
      images: [
        {
          url: firstHeroImage,
          secureUrl: firstHeroImage,
          type: 'image/webp',
          width: 1200,
          height: 630,
          alt: 'Wholesale Banarasi Sarees Online | Saree Supplier India | Weave 365',
        },
      ],
    },
  };

  return getSeoMetadata('/', defaultMeta);
}

export default async function HomePage() {
  const [heroSlides, allProducts, blogs] = await Promise.all([
    fetchHeroData().catch(() => []),
    fetchProducts().catch(() => []),
    fetchSupabaseBlogPosts().catch(() => []),
  ]);

  // Optimize payload: Homepage only renders 8 arrivals, 8 bestsellers, 2 deals, and category previews.
  // Passing only the required ~24 products avoids embedding hundreds of unused products into the initial HTML document.
  const unarchived = allProducts.filter((p) => !p.isArchived);
  const homeProductMap = new Map();

  // 1. Deals of the day
  unarchived
    .filter((p) => {
      const v = p.variants?.[0];
      return v?.prices?.mrp && v?.prices?.offer && v.prices.offer < v.prices.mrp;
    })
    .slice(0, 4)
    .forEach((p) => homeProductMap.set(p.id, p));

  // 2. Bestsellers
  unarchived
    .filter((p) => p.isTopSeller)
    .slice(0, 6)
    .forEach((p) => homeProductMap.set(p.id, p));

  // 3. New arrivals
  unarchived
    .filter((p) => p.isNew)
    .slice(0, 6)
    .forEach((p) => {
      if (homeProductMap.size < 12) homeProductMap.set(p.id, p);
    });

  // 4. Fill up to 12 products for category preview samples if needed
  unarchived.slice(0, 12).forEach((p) => {
    if (homeProductMap.size < 12) homeProductMap.set(p.id, p);
  });

  const rawProducts = homeProductMap.size > 0 ? Array.from(homeProductMap.values()) : allProducts.slice(0, 12);

  // Trim heavy unneeded raw, extra images, and variant fields to keep homepage SSR payload minimal
  const products = rawProducts.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category || '',
    purity: p.purity || '',
    fabric: p.fabric || '',
    work: p.work || '',
    images: Array.isArray(p.images) && p.images[0] ? [p.images[0]] : [],
    variants: (p.variants || []).slice(0, 1).map((v) => ({
      code: v.code || '',
      color: v.color || '',
      prices: v.prices || {},
      stock: v.stock,
    })),
    colorOptions: (p.colorOptions || []).slice(0, 1),
    totalColors: p.totalColors || p.variants?.length || 1,
    statusTags: p.statusTags || [],
    isNew: Boolean(p.isNew),
    isTopSeller: Boolean(p.isTopSeller),
    isDealOfDay: Boolean(p.isDealOfDay),
    isOutOfStock: Boolean(p.isOutOfStock),
    stockStatusOverride: p.stockStatusOverride || '',
    stockDate: p.stockDate || '',
    isArchived: Boolean(p.isArchived),
  }));

  // Trim blog posts to card-only fields for the home page (only 4 are rendered, saves ~110KB)
  const trimmedBlogs = (blogs || []).slice(0, 4).map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    intro: b.intro || '',
    image: b.image || '',
    category: b.category || '',
    date: b.date || '',
    readTime: b.readTime || '',
  }));

  // Trim hero slides to card-only fields
  const trimmedHeroSlides = (heroSlides || []).slice(0, 4).map((s) => ({
    type: s.type || '',
    image: s.image || '',
    video: s.video || '',
    title: s.title || '',
    subtitle: s.subtitle || '',
    link: s.link || '',
  }));

  return (
    <>
      <link
        rel="preload"
        as="image"
        type="image/webp"
        href="/assets/banner/heroFreeWebsite-400.webp"
        media="(max-width: 640px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        type="image/avif"
        href="/assets/banner/heroFreeWebsite-600.avif"
        media="(min-width: 641px)"
        fetchPriority="high"
      />
      <HomeRouteClient
        initialProducts={products}
        initialHeroSlides={trimmedHeroSlides}
        initialBlogs={trimmedBlogs}
      />
    </>
  );
}
