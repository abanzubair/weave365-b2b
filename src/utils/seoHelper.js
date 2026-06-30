import { fetchSupabasePageSeoSettings } from '../productData.js';

export function normalizeSeoPath(path) {
  const cleaned = String(path || '/').trim();
  if (!cleaned || cleaned === 'home') return '/';
  const pathOnly = cleaned.split('?')[0];
  const withSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withSlash.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function seoOverrideForPath(pageSeoSettings, canonicalPath) {
  const normalized = normalizeSeoPath(canonicalPath);
  return pageSeoSettings.find((setting) => normalizeSeoPath(setting.path) === normalized);
}

export async function getSeoMetadata(path, defaultMetadata) {
  try {
    const settings = await fetchSupabasePageSeoSettings();
    const override = seoOverrideForPath(settings, path);
    if (!override) {
      return defaultMetadata;
    }

    const title = override.metaTitle || defaultMetadata.title;
    const description = override.metaDescription || defaultMetadata.description;
    const canonical = override.canonicalPath || defaultMetadata.alternates?.canonical || path;
    const siteUrl = 'https://www.weave365.com';
    const canonicalUrl = canonical.startsWith('http') ? canonical : `${siteUrl}${canonical === '/' ? '' : canonical}`;
    
    let imageUrl = override.imageUrl || defaultMetadata.openGraph?.images?.[0]?.url || 'https://assets.weave365.com/assets/banner/favicon.svg';
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = `${siteUrl}${imageUrl}`;
    }

    // Apply Cloudflare API proxying if appropriate
    if (imageUrl && imageUrl !== 'https://assets.weave365.com/assets/banner/favicon.svg') {
      if (imageUrl.includes('weave365.in') || imageUrl.includes('assets.weave365.com') || imageUrl.includes('r2.cloudflarestorage.com')) {
        imageUrl = `${siteUrl}/api/image?url=${encodeURIComponent(imageUrl)}`;
      }
    }

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
        title: override.ogTitle || title,
        description: override.ogDescription || description,
        url: canonicalUrl,
        images: [{ url: imageUrl, alt: title, width: 1200, height: 630 }],
      },
      twitter: {
        ...defaultMetadata.twitter,
        title: override.ogTitle || title,
        description: override.ogDescription || description,
        images: [imageUrl],
      },
    };

    if (override.robotsIndex === false || override.robotsFollow === false) {
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
    return defaultMetadata;
  }
}
