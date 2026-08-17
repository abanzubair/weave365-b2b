import { notFound, redirect } from 'next/navigation';
import { fetchProducts } from '../../../src/productData.js';
import { getProductCategorySlug, siteUrl, storeConfig } from '../../../src/config.js';
import { isSupabaseConfigured, supabase } from '../../../src/supabaseClient.js';
import ProductPageClient from './ProductPageClient.jsx';

export const revalidate = 3600;

function generateProductSchemas(product, activeReviews = []) {
  if (!product) return null;

  const categorySlug = getProductCategorySlug(product.id, product.category);
  const prodUrl = `${siteUrl}/${categorySlug}/${encodeURIComponent(product.id)}`;

  const totalColors = product.totalColors ?? (product.variants?.length > 1 ? product.variants.length : Math.max(1, Math.min(product.images?.length || 0, 4)));
  const variant = product.variants?.[0] || { code: product.id, prices: {} };
  const displayPrice = variant.prices?.single || variant.prices?.mrp || 2500;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title || product.metaTitle,
    image: product.images || [],
    description: product.description || `Elegant handwoven Banarasi saree styled in ${product.fabric || 'pure silk'}. Sourced directly from Varanasi.`,
    sku: product.id || variant.code,
    mpn: variant.code || product.id,
    brand: {
      '@type': 'Brand',
      name: storeConfig.name || 'Weave 365',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: displayPrice,
      highPrice: Math.round(displayPrice * 1.5),
      offerCount: totalColors,
      availability: 'https://schema.org/InStock',
      url: prodUrl,
    },
  };

  if (activeReviews && activeReviews.length > 0) {
    const total = activeReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const count = activeReviews.length;
    const avg = (total / count).toFixed(1);

    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg,
      reviewCount: count,
      bestRating: '5',
      worstRating: '1',
    };

    productSchema.review = activeReviews.map((r) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.reviewer_name || 'Verified Buyer',
      },
      datePublished: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      reviewBody: r.comment || '',
      name: r.title || 'Product Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(r.rating || 5),
        bestRating: '5',
        worstRating: '1',
      },
    }));
  }

  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the Minimum Order Quantity (MOQ) for wholesale?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isUnder999
            ? 'For retailers and boutique owners, our MOQ starts at just 1 piece. This allows you to test our premium Banarasi collection with minimal upfront capital.'
            : 'For retailers and boutique owners, our MOQ starts at just 1 set (which typically contains all available color variants of the design). This allows you to test our premium Banarasi collection with minimal upfront capital.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are these Banarasi sarees authentically sourced?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all Weave 365 sarees and suits are crafted directly in Varanasi by expert weavers. We use premium pure katan silk, organza, and georgette with authentic gold and silver zari work, preserving the heritage weaving tradition.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you support resellers, boutiques, and dropshipping?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely! We support boutiques, resellers, and global export partners. Registered resellers get access to our white-labeled marketing toolkit, live catalog links, and dedicated support for direct boutique dispatch.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is international shipping available for wholesale orders?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we ship globally including USA, UK, Canada, UAE, Europe, and Australia. We handle standard custom declarations and cargo documentation to ensure door-to-door delivery.',
        },
      },
    ],
  };

  return { productSchema, faqSchema };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const productId = decodeURIComponent(resolvedParams?.productId || '');
  const products = await fetchProducts().catch(() => []);
  const product = products.find((item) => item.id === productId);

  if (!product || product.isArchived) {
    return { title: 'Product Not Found | Weave 365' };
  }

  const categorySlug = getProductCategorySlug(product.id, product.category);
  const canonicalUrl = `${siteUrl}/${categorySlug}/${encodeURIComponent(product.id)}`;
  const title = product.metaTitle || product.title || `${storeConfig.name} Product`;
  const description =
    product.metaDescription ||
    product.summary ||
    product.description ||
    `View ${title} in the ${storeConfig.name} wholesale catalogue.`;
  const imageUrl = product.images?.[0] || 'https://assets.weave365.com/assets/banner/Weave365.svg';

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: imageUrl, alt: title, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params;
  const productId = decodeURIComponent(resolvedParams?.productId || '');
  const categoryParam = resolvedParams?.slug || resolvedParams?.category || '';

  const products = await fetchProducts().catch(() => []);
  const product = products.find((item) => item.id === productId);

  if (!product || product.isArchived) {
    notFound();
  }

  const expectedCategorySlug = getProductCategorySlug(product.id, product.category);
  if (categoryParam !== expectedCategorySlug) {
    redirect(`/${expectedCategorySlug}/${encodeURIComponent(product.id)}`);
  }

  let activeReviews = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', product.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error && data) {
        activeReviews = data;
      }
    } catch (e) {
      console.warn('Error fetching reviews for SSR product schema:', e.message);
    }
  }

  const schemas = generateProductSchemas(product, activeReviews);

  return (
    <>
      {schemas?.productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas.productSchema).replace(/</g, '\\u003c'),
          }}
        />
      )}
      {schemas?.faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas.faqSchema).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <ProductPageClient
        productId={product.id}
        initialProduct={product}
        initialAllProducts={products}
      />
    </>
  );
}
