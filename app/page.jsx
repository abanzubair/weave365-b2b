import { fetchHeroData, fetchProducts, fetchSupabaseBlogPosts } from '../src/productData.js';
import { getSeoMetadata } from '../src/utils/seoHelper.js';
import { siteUrl } from '../src/config.js';
import { sanitizeCatalogProducts } from '../src/utils/catalogSanitizer.js';
import { sortByStockDateDesc } from '../src/utils/sortProducts.js';
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

  const unarchived = allProducts.filter((p) => !p.isArchived);

  // Exact top 8 arrivals sorted by stockInDate
  const topArrivals = sortByStockDateDesc(
    unarchived.filter((p) => p.isNew)
  ).slice(0, 8);

  // Exact top 8 bestsellers sorted by stockInDate
  const topBestsellers = sortByStockDateDesc(
    unarchived.filter((p) => p.isTopSeller)
  ).slice(0, 8);

  // Top deals of the day
  const topDeals = unarchived
    .filter((p) => {
      const v = p.variants?.[0];
      return v?.prices?.mrp && v?.prices?.offer && v.prices.offer < v.prices.mrp;
    })
    .slice(0, 4);

  // Category preview samples for each homepage category
  const catSamples = ['saree', 'suit', 'dupatta', 'lehenga', 'under 999']
    .map((cat) => unarchived.find((p) => String(p.category || '').toLowerCase().trim() === cat))
    .filter(Boolean);

  const homeProductMap = new Map();
  [...topArrivals, ...topBestsellers, ...topDeals, ...catSamples].forEach((p) => {
    homeProductMap.set(p.id, p);
  });

  const cleanProducts = sanitizeCatalogProducts(Array.from(homeProductMap.values()));

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

  // Trim hero slides to needed fields
  const trimmedHeroSlides = (heroSlides || []).map((s) => ({
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
        initialProducts={cleanProducts}
        initialHeroSlides={trimmedHeroSlides}
        initialBlogs={trimmedBlogs}
      />
    </>
  );
}
