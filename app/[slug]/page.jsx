import { notFound } from 'next/navigation';
import { fetchProducts, fetchConfigOptions, fetchSupabaseLandingPages } from '../../src/productData.js';
import { seoCategoryRoutes, siteUrl } from '../../src/config.js';
import { seoLandingPages } from '../../src/data/seoLandingPages.js';
import { getSeoMetadata } from '../../src/utils/seoHelper.js';
import CatalogueClient from '../catalogue/CatalogueClient.jsx';
import SeoLandingPageClient from './SeoLandingPageClient.jsx';

export const revalidate = 3600;
export const runtime = 'edge';

function getStaticLandingPagesFallback() {
  return Object.entries(seoLandingPages).map(([slug, page]) => ({
    slug,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    ogTitle: page.ogTitle || page.metaTitle,
    ogDescription: page.ogDescription || page.metaDescription,
    imageUrl: page.imageUrl,
    canonicalPath: page.canonicalPath || '/' + slug,
    robotsIndex: page.robotsIndex !== false,
    robotsFollow: page.robotsFollow !== false,
    h1: page.h1,
    introTitle: page.introTitle,
    introText: page.introText,
    buyerGuideTitle: page.buyerGuideTitle,
    buyerGuideSections: page.buyerGuideSections || [],
    faqs: page.faqs || [],
    filter: page.filter || {},
    comparisonSections: page.comparisonSections || [],
  }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';

  // 1. Dynamic Category Routes
  if (Object.keys(seoCategoryRoutes).includes(slug)) {
    const categoryName = seoCategoryRoutes[slug];
    const pluralName =
      categoryName === 'Under 999'
        ? categoryName
        : categoryName.endsWith('s')
        ? categoryName
        : `${categoryName}s`;
    const defaultMeta = {
      title: `Wholesale Banarasi ${pluralName} Online | Weave 365`,
      description: `Buy handwoven premium Banarasi ${pluralName.toLowerCase()} at wholesale prices direct from Varanasi weavers. High quality, verified silk collections.`,
      alternates: { canonical: `${siteUrl}/${slug}` },
      openGraph: {
        title: `Wholesale Banarasi ${pluralName} Online | Weave 365`,
        description: `Buy handwoven premium Banarasi ${pluralName.toLowerCase()} at wholesale prices direct from Varanasi weavers. High quality, verified silk collections.`,
        url: `${siteUrl}/${slug}`,
      },
    };
    return getSeoMetadata(`/${slug}`, defaultMeta);
  }

  // 2. SEO Landing Pages
  const dbLandingPages = await fetchSupabaseLandingPages().catch(() => []);
  const allLandingPages = dbLandingPages.length > 0 ? dbLandingPages : getStaticLandingPagesFallback();
  const pageData = allLandingPages.find((p) => p.slug === slug);

  if (pageData) {
    const defaultMeta = {
      title: pageData.metaTitle,
      description: pageData.metaDescription,
      alternates: { canonical: `${siteUrl}/${slug}` },
      openGraph: {
        title: pageData.ogTitle || pageData.metaTitle,
        description: pageData.ogDescription || pageData.metaDescription,
        url: `${siteUrl}/${slug}`,
        images: pageData.imageUrl ? [{ url: pageData.imageUrl }] : [],
      },
    };
    return getSeoMetadata(`/${slug}`, defaultMeta);
  }

  return { title: 'Page Not Found | Weave 365' };
}

export default async function SlugPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';

  // 1. If it's a category route
  if (Object.keys(seoCategoryRoutes).includes(slug)) {
    const [products, configOptions] = await Promise.all([
      fetchProducts().catch(() => []),
      fetchConfigOptions().catch(() => null),
    ]);

    return (
      <CatalogueClient
        initialProducts={products}
        initialConfigOptions={configOptions}
      />
    );
  }

  // 2. If it's a dynamic SEO landing page
  const [products, dbLandingPages] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchSupabaseLandingPages().catch(() => []),
  ]);

  const allLandingPages = dbLandingPages.length > 0 ? dbLandingPages : getStaticLandingPagesFallback();
  const pageData = allLandingPages.find((p) => p.slug === slug);

  if (!pageData) {
    notFound();
  }

  let landingPageFaqSchema = null;
  if (pageData.faqs && pageData.faqs.length > 0) {
    landingPageFaqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: pageData.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    };
  }

  return (
    <>
      {landingPageFaqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(landingPageFaqSchema).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <SeoLandingPageClient
        slug={slug}
        pageData={pageData}
        initialProducts={products}
        initialLandingPages={allLandingPages}
      />
    </>
  );
}
