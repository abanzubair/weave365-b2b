import { fetchSupabasePageSeoSettings, fetchProducts } from '../productData.js';
import { siteUrl, DEFAULT_OG_IMAGE, getCategoryFromSlug, storeConfig } from '../config.js';

/**
 * Featured first-image mapping for static marketing / guide / landing pages (Level 2 fallback).
 */
export const ROUTE_FIRST_IMAGES = {
  '/': '/deskH.webp',
  '/handloom-vs-powerloom-guide': '/banarasi_loom_detail.webp',
  '/handloom-vs-semi-handloom-vs-powerloom-guide': '/banarasi_loom_detail.webp',
  '/sourcing-partners': '/artisan_at_loom_premium.webp',
  '/white-label': '/boutique-hero.webp',
  '/custom-woven': '/banarasi_loom_detail.webp',
  '/dropshipping': '/reseller_premium_catalog_display.webp',
  '/resell-sarees-online': '/reseller_premium_catalog_display.webp',
  '/sell-banarasi-sarees': 'https://assets.weave365.com/assets/banner/sellersHero.webp',
  '/sellers': 'https://assets.weave365.com/assets/banner/sellersHero.webp',
  '/reviews': '/boutique-hero.webp',
  '/contact': '/deskH.webp',
  '/signup': '/signup.webp',
  '/bulk-inquiry': '/deskH.webp',
  '/reseller-faqs': '/reseller_premium_catalog_display.webp',
  '/about': '/artisan_at_loom_premium.webp',
};

export function normalizeSeoPath(path) {
  const cleaned = String(path || '/').trim();
  if (!cleaned || cleaned === 'home') return '/';
  const pathOnly = cleaned.split('?')[0];
  const withSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withSlash.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function seoOverrideForPath(pageSeoSettings, canonicalPath) {
  if (!Array.isArray(pageSeoSettings)) return null;
  const normalized = normalizeSeoPath(canonicalPath);
  return pageSeoSettings.find((setting) => normalizeSeoPath(setting.path) === normalized);
}

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  // Social platforms reject SVGs for Open Graph and Twitter Cards
  if (trimmed.toLowerCase().endsWith('.svg') || trimmed.includes('.svg?')) return false;
  return true;
}

export function ensureAbsoluteUrl(url, base = siteUrl) {
  if (!url || typeof url !== 'string') return DEFAULT_OG_IMAGE;
  const trimmed = url.trim();
  if (!isValidImageUrl(trimmed)) return DEFAULT_OG_IMAGE;
  if (trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'https://');
  }
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base.replace(/\/$/, '')}${cleanPath}`;
}

/**
 * Resolves Open Graph and Twitter Card image following the 3-level fallback hierarchy:
 * - Level 1: Explicit Open Graph image (from DB SEO override or page metadata)
 * - Level 2: First image on the page (from page parameter, product image, post image, or route context)
 * - Level 3: Default brand image (fab icon / main logo)
 */
export async function resolveSeoImage({
  override = null,
  defaultMetadata = {},
  options = {},
  path = '/',
}) {
  const normalizedPath = normalizeSeoPath(path);

  // LEVEL 1: Explicit Open Graph image present
  const overrideOg = override?.imageUrl || override?.ogImage || override?.og_image;
  if (isValidImageUrl(overrideOg)) {
    return {
      url: ensureAbsoluteUrl(overrideOg),
      level: 1,
      source: 'seo_override',
    };
  }

  if (isValidImageUrl(options?.ogImage)) {
    return {
      url: ensureAbsoluteUrl(options.ogImage),
      level: 1,
      source: 'explicit_option_og',
    };
  }

  const metaOgUrl = defaultMetadata?.openGraph?.images?.[0]?.url;
  if (isValidImageUrl(metaOgUrl)) {
    return {
      url: ensureAbsoluteUrl(metaOgUrl),
      level: 1,
      source: 'metadata_og_images',
    };
  }

  // LEVEL 2: First image on that page
  const explicitPageImage =
    options?.firstImage ||
    options?.pageImage ||
    defaultMetadata?.firstImage ||
    defaultMetadata?.pageImage ||
    defaultMetadata?.image;

  if (isValidImageUrl(explicitPageImage)) {
    return {
      url: ensureAbsoluteUrl(explicitPageImage),
      level: 2,
      source: 'explicit_page_image',
    };
  }

  const routeImage = ROUTE_FIRST_IMAGES[normalizedPath];
  if (isValidImageUrl(routeImage)) {
    return {
      url: ensureAbsoluteUrl(routeImage),
      level: 2,
      source: 'route_first_image',
    };
  }

  // If it's a category page (e.g. /sarees, /suits, /under-999)
  const slugWithoutSlash = normalizedPath.replace(/^\//, '');
  const categoryName = getCategoryFromSlug(slugWithoutSlash);
  if (categoryName) {
    try {
      const products = await fetchProducts().catch(() => []);
      const matchedProd = products.find((p) => {
        const pCat = String(p.category || '').toLowerCase();
        return pCat === categoryName.toLowerCase();
      });
      const firstProdImg = matchedProd?.images?.[0];
      if (isValidImageUrl(firstProdImg)) {
        return {
          url: ensureAbsoluteUrl(firstProdImg),
          level: 2,
          source: 'category_first_product_image',
        };
      }
    } catch {
      // Continue to next fallback
    }
  }

  // If it's catalogue / wholesale-catalogue / new-arrivals
  if (['/catalogue', '/wholesale-catalogue', '/new-arrivals'].includes(normalizedPath)) {
    try {
      const products = await fetchProducts().catch(() => []);
      const firstProdImg = products[0]?.images?.[0];
      if (isValidImageUrl(firstProdImg)) {
        return {
          url: ensureAbsoluteUrl(firstProdImg),
          level: 2,
          source: 'catalogue_first_product_image',
        };
      }
    } catch {
      // Continue to next fallback
    }
  }

  // LEVEL 3: Default brand image (fab icon / main logo)
  return {
    url: ensureAbsoluteUrl(DEFAULT_OG_IMAGE),
    level: 3,
    source: 'default_brand_logo',
  };
}

export async function getSeoMetadata(path, defaultMetadata = {}, options = {}) {
  try {
    const settings = await fetchSupabasePageSeoSettings().catch(() => []);
    const override = seoOverrideForPath(settings, path);

    const title = override?.metaTitle || defaultMetadata.title || storeConfig.name || 'Weave 365';
    const description = override?.metaDescription || defaultMetadata.description || '';
    const canonical = override?.canonicalPath || defaultMetadata.alternates?.canonical || path;
    const canonicalUrl = canonical.startsWith('http')
      ? canonical
      : `${siteUrl}${canonical === '/' ? '' : canonical.startsWith('/') ? canonical : `/${canonical}`}`;

    const ogTitle = override?.ogTitle || defaultMetadata.openGraph?.title || title;
    const ogDescription = override?.ogDescription || defaultMetadata.openGraph?.description || description;

    // Resolve image via 3-level fallback hierarchy
    const resolvedImage = await resolveSeoImage({
      override,
      defaultMetadata,
      options,
      path,
    });

    const isFavicon = resolvedImage.url.endsWith('favicon.png');
    const imageWidth = isFavicon ? 512 : 1200;
    const imageHeight = isFavicon ? 512 : 630;

    const nextMeta = {
      ...defaultMetadata,
      title,
      description,
      alternates: {
        ...defaultMetadata.alternates,
        canonical: canonicalUrl,
      },
      openGraph: {
        ...defaultMetadata.openGraph,
        title: ogTitle,
        description: ogDescription,
        url: canonicalUrl,
        siteName: storeConfig.name || 'Weave 365',
        locale: 'en_IN',
        type: defaultMetadata.openGraph?.type || 'website',
        images: [
          {
            url: resolvedImage.url,
            width: imageWidth,
            height: imageHeight,
            alt: ogTitle,
          },
        ],
      },
      twitter: {
        ...defaultMetadata.twitter,
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [resolvedImage.url],
      },
    };

    if (override?.robotsIndex === false || override?.robotsFollow === false) {
      nextMeta.robots = {
        index: override.robotsIndex !== false,
        follow: override.robotsFollow !== false,
        googleBot: {
          index: override.robotsIndex !== false,
          follow: override.robotsFollow !== false,
        },
      };
    }

    return nextMeta;
  } catch (err) {
    console.error('[SEO Helper] Failed to fetch or merge SEO settings:', err);
    return {
      ...defaultMetadata,
      openGraph: {
        ...defaultMetadata?.openGraph,
        images: [
          {
            url: DEFAULT_OG_IMAGE,
            width: 1200,
            height: 630,
            alt: storeConfig.name || 'Weave 365',
          },
        ],
      },
      twitter: {
        ...defaultMetadata?.twitter,
        card: 'summary_large_image',
        images: [DEFAULT_OG_IMAGE],
      },
    };
  }
}
