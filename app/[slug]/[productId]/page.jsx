import { notFound, redirect } from 'next/navigation';
import { fetchProducts } from '../../../src/productData.js';
import { getProductCategorySlug, siteUrl, storeConfig } from '../../../src/config.js';
import { isSupabaseConfigured, supabase } from '../../../src/supabaseClient.js';
import { getSeoMetadata } from '../../../src/utils/seoHelper.js';
import { getOptimizedImageUrl, getImageSrcSet } from '../../../src/utils/imageOptimizer.js';
import ProductPageClient from './ProductPageClient.jsx';

export const revalidate = 3600;
export const runtime = 'edge';

function generateProductSchemas(product, activeReviews = [], requestedColor = null) {
  if (!product) return null;

  const categorySlug = getProductCategorySlug(product.id, product.category);
  const colorQuery = requestedColor ? `?color=${encodeURIComponent(requestedColor)}` : '';
  const prodUrl = `${siteUrl}/${categorySlug}/${encodeURIComponent(product.id)}${colorQuery}`;

  const totalColors = product.totalColors ?? (product.variants?.length > 1 ? product.variants.length : Math.max(1, Math.min(product.images?.length || 0, 4)));

  let variant = product.variants?.[0] || { code: product.id, prices: {} };
  let primaryImage = product.images?.[0] || '';
  if (requestedColor) {
    const matchedV = (product.variants || []).find(
      (v) => String(v.color || '').toLowerCase() === String(requestedColor).toLowerCase()
    );
    if (matchedV) {
      variant = matchedV;
      if (matchedV.image) primaryImage = matchedV.image;
    }
  }

  const cleanTitle = (product.title || product.metaTitle || 'Banarasi Saree')
    .replace(new RegExp(`\\s*\\|?\\s*${storeConfig.name || 'Weave 365'}\\s*$`, 'i'), '')
    .trim();
  const schemaProductName = requestedColor ? `${requestedColor} ${cleanTitle}` : (product.title || cleanTitle);
  const displayPrice = variant.prices?.single || variant.prices?.mrp || 2500;
  const images = primaryImage ? [primaryImage, ...(product.images || []).filter(img => img !== primaryImage)] : (product.images || []);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: schemaProductName,
    image: images,
    description: product.description || `Elegant handwoven Banarasi saree styled in ${product.fabric || 'pure silk'}. Sourced directly from Varanasi.`,
    sku: variant.code || product.id,
    mpn: variant.code || product.id,
    ...(requestedColor ? { color: requestedColor } : {}),
    brand: {
      '@type': 'Brand',
      name: storeConfig.name || 'Weave 365',
    },
    offers: {
      '@type': requestedColor ? 'Offer' : 'AggregateOffer',
      priceCurrency: 'INR',
      price: displayPrice,
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

  const categoryName = product.category || (categorySlug === 'saree' ? 'Sarees' : categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
  const categoryUrl = `${siteUrl}/${categorySlug === 'saree' ? 'sarees' : categorySlug === 'suit' ? 'suits' : categorySlug}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: categoryUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: schemaProductName,
        item: prodUrl,
      },
    ],
  };

  return { productSchema, faqSchema, breadcrumbSchema };
}

export async function generateMetadata({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawId = decodeURIComponent(resolvedParams?.productId || '');
  const products = await fetchProducts().catch(() => []);
  let product = products.find((item) => item.id === rawId);
  let requestedColor = resolvedSearchParams?.color || null;

  if (!product) {
    product = products.find((item) => item.variants?.some((v) => v.code === rawId));
    if (product) {
      const v = product.variants.find((v) => v.code === rawId);
      if (v?.color) requestedColor = v.color;
    }
  }

  if (!product || product.isArchived) {
    return { title: 'Product Not Found | Weave 365' };
  }

  let imageUrl = product.images?.[0] || undefined;
  if (requestedColor) {
    const colorOpt = product.colorOptions?.find(
      (c) => String(c.name || '').toLowerCase() === String(requestedColor).toLowerCase()
    );
    const variantOpt = product.variants?.find(
      (v) => String(v.color || '').toLowerCase() === String(requestedColor).toLowerCase()
    );
    if (colorOpt?.image || variantOpt?.image) {
      imageUrl = colorOpt?.image || variantOpt?.image;
    }
  }

  const categorySlug = getProductCategorySlug(product.id, product.category);
  const colorQuery = requestedColor ? `?color=${encodeURIComponent(requestedColor)}` : '';
  const canonicalUrl = `${siteUrl}/${categorySlug}/${encodeURIComponent(product.id)}${colorQuery}`;
  const brandName = storeConfig.name || 'Weave 365';
  const rawTitle = product.metaTitle || product.title || `${brandName} Product`;
  const cleanBaseTitle = rawTitle.replace(new RegExp(`\\s*\\|?\\s*${brandName}\\s*$`, 'i'), '').trim();
  const title = requestedColor
    ? `${requestedColor} ${cleanBaseTitle} | ${brandName}`
    : rawTitle;
  const description = requestedColor
    ? `Buy ${requestedColor} ${product.title || 'Banarasi Saree'}. Direct Varanasi weaver wholesale price. ${product.description || ''}`
    : (product.metaDescription ||
      product.summary ||
      product.description ||
      `View ${title} in the ${storeConfig.name} wholesale catalogue.`);

  const defaultMeta = {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    firstImage: imageUrl,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                secureUrl: imageUrl,
                type: imageUrl.endsWith('.png')
                  ? 'image/png'
                  : imageUrl.endsWith('.webp')
                  ? 'image/webp'
                  : 'image/jpeg',
                width: 900,
                height: 1200,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };

  return getSeoMetadata(`/${categorySlug}/${encodeURIComponent(product.id)}${colorQuery}`, defaultMeta, {
    firstImage: imageUrl,
    pageImage: imageUrl,
  });
}

export default async function ProductPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawId = decodeURIComponent(resolvedParams?.productId || '');
  const categoryParam = resolvedParams?.slug || resolvedParams?.category || '';

  const products = await fetchProducts().catch(() => []);
  let product = products.find((item) => item.id === rawId);

  // If rawId is a variant code (e.g. 102045-4), redirect to parent product with ?color=
  if (!product) {
    product = products.find((item) => item.variants?.some((v) => v.code === rawId));
    if (product) {
      const matchedVariant = product.variants.find((v) => v.code === rawId);
      const catSlug = getProductCategorySlug(product.id, product.category);
      const colorQuery = matchedVariant?.color
        ? `?color=${encodeURIComponent(matchedVariant.color)}`
        : `?variant=${encodeURIComponent(rawId)}`;
      redirect(`/${catSlug}/${encodeURIComponent(product.id)}${colorQuery}`);
    }
  }

  if (!product || product.isArchived) {
    notFound();
  }

  const expectedCategorySlug = getProductCategorySlug(product.id, product.category);
  if (categoryParam !== expectedCategorySlug) {
    const colorQuery = resolvedSearchParams?.color
      ? `?color=${encodeURIComponent(resolvedSearchParams.color)}`
      : '';
    redirect(`/${expectedCategorySlug}/${encodeURIComponent(product.id)}${colorQuery}`);
  }

  const initialColorName = resolvedSearchParams?.color || null;
  const initialVariantCode = resolvedSearchParams?.variant || null;

  let activeReviews = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('reviewer_name, rating, comment, title, created_at')
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

  const schemas = generateProductSchemas(product, activeReviews, initialColorName);

  // Trim related products to avoid serializing heavy database records into initial SSR HTML
  const trimmedRelated = products
    .filter((p) => p.id !== product.id && !p.isArchived)
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category || '',
      fabric: p.fabric || '',
      work: p.work || '',
      pattern: p.pattern || '',
      purity: p.purity || '',
      images: Array.isArray(p.images) && p.images[0] ? [p.images[0]] : [],
      variants: (p.variants || []).slice(0, 1).map((v) => ({
        code: v.code || '',
        color: v.color || '',
        prices: {
          mrp: v.prices?.mrp || 0,
          b2r: v.prices?.b2r || 0,
          offer: v.prices?.offer || 0,
          single: v.prices?.single || 0,
        },
        stock: v.stock,
      })),
      colorOptions: p.colorOptions?.[0]?.name ? [{ name: p.colorOptions[0].name }] : [],
      totalColors: p.totalColors || p.variants?.length || 1,
      statusTags: p.statusTags || [],
      isNew: Boolean(p.isNew),
      isTopSeller: Boolean(p.isTopSeller),
      isOutOfStock: Boolean(p.isOutOfStock),
      stockStatusOverride: p.stockStatusOverride || '',
      isArchived: Boolean(p.isArchived),
    }));

  const { raw, ...cleanProduct } = product;
  if (raw?.['Pc / Set']) {
    cleanProduct.raw = { 'Pc / Set': raw['Pc / Set'] };
  }

  let primaryHeroImage = product.images?.[0] || '';
  if (initialColorName) {
    const matchedV = (product.variants || []).find(
      (v) => String(v.color || '').toLowerCase() === String(initialColorName).toLowerCase()
    );
    if (matchedV?.image) primaryHeroImage = matchedV.image;
  }

  return (
    <>
      <link rel="preconnect" href="https://assets.weave365.com" crossOrigin="" />
      {primaryHeroImage && (
        <link
          rel="preload"
          as="image"
          href={getOptimizedImageUrl(primaryHeroImage, 'card')}
          imageSrcSet={getImageSrcSet(primaryHeroImage, ['card', 'listing', 'detail'])}
          imageSizes="(max-width: 640px) 120px, 600px"
          fetchPriority="high"
        />
      )}
      {schemas?.breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schemas.breadcrumbSchema).replace(/</g, '\\u003c'),
          }}
        />
      )}
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
        productId={cleanProduct.id}
        initialProduct={cleanProduct}
        initialAllProducts={[cleanProduct, ...trimmedRelated]}
        initialColorName={initialColorName}
        initialVariantCode={initialVariantCode}
        initialReviews={activeReviews}
      />
    </>
  );
}
