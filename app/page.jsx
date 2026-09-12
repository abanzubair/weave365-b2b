import { fetchHeroData, fetchProducts, fetchSupabaseBlogPosts } from '../src/productData.js';
import { getSeoMetadata } from '../src/utils/seoHelper.js';
import { siteUrl } from '../src/config.js';
import HomeRouteClient from './HomeRouteClient.jsx';

export const revalidate = 3600; // Cache and revalidate every hour

export async function generateMetadata() {
  const heroSlides = await fetchHeroData().catch(() => []);
  const firstHeroImage = heroSlides?.[0]?.imageUrl || 'https://assets.weave365.com/assets/banner/hero1.webp';

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
    .slice(0, 6)
    .forEach((p) => homeProductMap.set(p.id, p));

  // 2. Bestsellers
  unarchived
    .filter((p) => p.isTopSeller)
    .slice(0, 12)
    .forEach((p) => homeProductMap.set(p.id, p));

  // 3. New arrivals
  unarchived
    .filter((p) => p.isNew)
    .slice(0, 12)
    .forEach((p) => homeProductMap.set(p.id, p));

  // 4. Fill up to 24 products for category preview samples if needed
  unarchived.slice(0, 24).forEach((p) => {
    if (homeProductMap.size < 24) homeProductMap.set(p.id, p);
  });

  const rawProducts = homeProductMap.size > 0 ? Array.from(homeProductMap.values()) : allProducts.slice(0, 24);

  // Trim product payload to avoid bloated SSR JSON serialization (~200KB reduction)
  const products = rawProducts.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category || '',
    purity: p.purity || '',
    fabric: p.fabric || '',
    work: p.work || '',
    images: Array.isArray(p.images) ? p.images.slice(0, 2) : [],
    variants: (p.variants || []).slice(0, 2).map((v) => ({
      code: v.code || '',
      color: v.color || '',
      prices: v.prices || {},
      stock: v.stock,
      images: Array.isArray(v.images) ? v.images.slice(0, 1) : [],
    })),
    colorOptions: p.colorOptions || [],
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

  return (
    <HomeRouteClient
      initialProducts={products}
      initialHeroSlides={heroSlides}
      initialBlogs={trimmedBlogs}
    />
  );
}
