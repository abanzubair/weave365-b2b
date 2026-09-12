/**
 * @file imageOptimizer.js
 * @description Centralized single source of truth for Cloudflare Image Transformations.
 * 
 * Architecture:
 * - Keeps high-quality master JPEGs in Cloudflare R2 (bucket: weave365images).
 * - Dynamically requests optimized WebP/AVIF versions on-demand via Cloudflare's
 *   Image Transformation layer:
 *   https://<CDN_DOMAIN>/cdn-cgi/image/<OPTIONS>/<ORIGINAL_PATH>
 * - Constrains transformations to a small, predictable set of presets (400px, 800px, 1400px, 2400px)
 *   to maximize edge caching and strictly control transformation costs.
 * - Guarantees aspect ratio preservation (fit=scale-down).
 * - Provides graceful fallback to the original R2 JPEG URL if transformations are disabled or fail.
 */

// 1. Standard transformation presets (Deterministic & Edge-Cached)
export const IMAGE_PRESETS = {
  thumbnail: { width: 240, quality: 75, format: 'auto', fit: 'scale-down' },
  card: { width: 450, quality: 80, format: 'auto', fit: 'scale-down' },
  listing: { width: 800, quality: 85, format: 'auto', fit: 'scale-down' },
  detail: { width: 1400, quality: 88, format: 'auto', fit: 'scale-down' },
  zoom: { width: 2400, quality: 90, format: 'auto', fit: 'scale-down' },
};

/**
 * Returns the configured base CDN domain for Cloudflare image delivery.
 * Defaults to NEXT_PUBLIC_R2_URL or 'https://assets.weave365.com'.
 */
export function getImageBaseUrl() {
  const url =
    (typeof process !== 'undefined' && process.env && (
      process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_BASE_URL ||
      process.env.CLOUDFLARE_IMAGE_BASE_URL ||
      process.env.NEXT_PUBLIC_R2_URL
    )) || 'https://assets.weave365.com';
  return url.replace(/\/+$/, '');
}

/**
 * Checks whether Cloudflare Image Transformations are active in the current environment.
 * Can be explicitly disabled by setting NEXT_PUBLIC_ENABLE_IMAGE_TRANSFORM=false.
 */
export function isTransformationEnabled() {
  if (typeof process === 'undefined' || !process.env) return true;
  if (process.env.NEXT_PUBLIC_ENABLE_IMAGE_TRANSFORM === 'false') return false;
  if (process.env.NEXT_PUBLIC_CLOUDFLARE_TRANSFORM_ENABLED === 'false') return false;
  return true;
}

/**
 * Checks if a given asset URL or path is eligible for transformation.
 * Returns false for empty strings, data URIs, SVGs, and non-image media.
 */
export function isTransformableImage(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Do not transform data URIs or blob URLs
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return false;

  // Do not transform SVGs (vector graphics should remain vector)
  const cleanPath = trimmed.split('?')[0].toLowerCase();
  if (cleanPath.endsWith('.svg')) return false;

  // Do not transform video embeds or video files
  if (
    cleanPath.endsWith('.mp4') ||
    cleanPath.endsWith('.webm') ||
    cleanPath.endsWith('.ogg') ||
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be')
  ) {
    return false;
  }

  return true;
}

/**
 * Parses the raw image path/key from any URL (relative, absolute CDN, S3 R2 endpoint,
 * or an existing /cdn-cgi/image/ transformed URL).
 * 
 * @param {string} sourceUrl 
 * @returns {string} Clean relative path (e.g. "saree/111001/0.jpg" or "products/kan-001.jpg")
 */
export function extractImagePath(sourceUrl) {
  if (!sourceUrl || typeof sourceUrl !== 'string') return '';
  let val = sourceUrl.trim();

  // If it is already a transformed URL, extract the underlying source path
  if (val.includes('/cdn-cgi/image/')) {
    const afterCdnCgi = val.split('/cdn-cgi/image/')[1] || '';
    // Format is <options>/<path-or-url>
    const slashIdx = afterCdnCgi.indexOf('/');
    if (slashIdx !== -1) {
      val = afterCdnCgi.slice(slashIdx + 1);
    }
  }

  // Handle direct Cloudflare R2 S3 storage endpoints
  if (val.includes('.r2.cloudflarestorage.com/')) {
    const parts = val.split('.r2.cloudflarestorage.com/');
    if (parts[1]) {
      const pathParts = parts[1].split('/');
      // Remove bucket name if present as first path segment
      const bucket = (typeof process !== 'undefined' && process.env?.R2_BUCKET_NAME) || 'weave365images';
      if (pathParts[0] === bucket) {
        pathParts.shift();
      }
      return pathParts.join('/');
    }
  }

  // Handle absolute URLs on known domains
  const domainMatches = [
    'assets.weave365.com/',
    'weave365.com/',
    'weave365.in/',
  ];

  for (const domain of domainMatches) {
    if (val.includes(domain)) {
      const parts = val.split(domain);
      return parts[1] || '';
    }
  }

  // If it's a full URL on another domain (e.g. Supabase storage or Drive)
  if (/^https?:\/\//i.test(val)) {
    try {
      const parsed = new URL(val);
      const configuredBase = getImageBaseUrl();
      const configuredHost = new URL(configuredBase).host;
      if (parsed.host === configuredHost) {
        return parsed.pathname.replace(/^\/+/, '') + parsed.search;
      }
      // External origin - return as-is
      return val;
    } catch {
      return val;
    }
  }

  // Relative path - strip leading slashes
  return val.replace(/^\/+/, '');
}

/**
 * Reconstructs the canonical original (raw/untransformed) image URL in R2.
 * Used for high-res photo downloads and runtime onError fallback.
 * 
 * @param {string} url - Any image URL or transformed URL
 * @returns {string} The raw source URL (e.g. "https://assets.weave365.com/saree/111001/0.jpg")
 */
export function getOriginalImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!isTransformableImage(trimmed)) return trimmed;

  const path = extractImagePath(trimmed);
  if (!path) return trimmed;

  // If path is still a full external URL, return it
  if (/^https?:\/\//i.test(path)) return path;

  const baseUrl = getImageBaseUrl();
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}

/**
 * Serializes transformation options into Cloudflare's comma-separated options string.
 * Example: "width=800,quality=85,format=auto,fit=scale-down"
 * 
 * @param {Object} options 
 * @returns {string}
 */
export function formatCloudflareOptions(options = {}) {
  const parts = [];

  if (options.width) parts.push(`width=${Math.round(options.width)}`);
  if (options.height) parts.push(`height=${Math.round(options.height)}`);
  if (options.quality) parts.push(`quality=${Math.round(options.quality)}`);

  // Default format to 'auto' for modern browser negotiation (WebP / AVIF)
  const format = options.format || 'auto';
  if (format) parts.push(`format=${format}`);

  // Default fit to 'scale-down' to preserve aspect ratio and avoid enlarging
  const fit = options.fit || 'scale-down';
  if (fit) parts.push(`fit=${fit}`);

  if (options.metadata) parts.push(`metadata=${options.metadata}`);

  return parts.join(',');
}

/**
 * Main URL Transformation Utility.
 * Converts any source image into a Cloudflare Image Transformation URL.
 * 
 * @param {string} sourceUrl - The source JPEG URL or relative path in R2
 * @param {string|Object} [presetOrOptions='listing'] - Preset name ('listing' | 'detail' | 'zoom' | 'thumbnail') or custom options
 * @returns {string} The transformed URL or original URL fallback
 * 
 * @example
 * getOptimizedImageUrl('saree/111001/0.jpg', 'listing')
 * // => "https://assets.weave365.com/cdn-cgi/image/width=800,quality=85,format=auto,fit=scale-down/saree/111001/0.jpg"
 * 
 * getOptimizedImageUrl('https://assets.weave365.com/products/kan-001.jpg', 'detail')
 * // => "https://assets.weave365.com/cdn-cgi/image/width=1400,quality=88,format=auto,fit=scale-down/products/kan-001.jpg"
 */
export function getOptimizedImageUrl(sourceUrl, presetOrOptions = 'listing') {
  if (!sourceUrl || typeof sourceUrl !== 'string') return '';
  const trimmed = sourceUrl.trim();
  if (!trimmed) return '';

  // Return non-transformable assets untouched
  if (!isTransformableImage(trimmed)) {
    return trimmed;
  }

  // Resolve options from preset or custom object
  let options;
  if (typeof presetOrOptions === 'string') {
    options = IMAGE_PRESETS[presetOrOptions] || IMAGE_PRESETS.listing;
  } else if (presetOrOptions && typeof presetOrOptions === 'object') {
    const basePreset = presetOrOptions.preset ? IMAGE_PRESETS[presetOrOptions.preset] : IMAGE_PRESETS.listing;
    options = { ...basePreset, ...presetOrOptions };
  } else {
    options = IMAGE_PRESETS.listing;
  }

  // Check if transformations are enabled (either via options override or environment)
  const isEnabled = options.enabled !== undefined ? Boolean(options.enabled) : isTransformationEnabled();
  if (!isEnabled) {
    return getOriginalImageUrl(trimmed);
  }

  const rawPath = extractImagePath(trimmed);
  if (!rawPath) return trimmed;

  const baseUrl = getImageBaseUrl();
  const optionsString = formatCloudflareOptions(options);

  // If the path is a full external URL (e.g. https://...), only transform if explicitly allowed
  if (/^https?:\/\//i.test(rawPath)) {
    try {
      const parsed = new URL(rawPath);
      const baseHost = new URL(baseUrl).host;
      if (parsed.host === baseHost) {
        // Path on the CDN domain
        const cleanInner = parsed.pathname.replace(/^\/+/, '') + parsed.search;
        return `${baseUrl}/cdn-cgi/image/${optionsString}/${cleanInner}`;
      }
    } catch {
      return rawPath;
    }
    // External host — return original URL unless transformExternal is set
    if (!options.transformExternal) {
      return rawPath;
    }
    return `${baseUrl}/cdn-cgi/image/${optionsString}/${rawPath}`;
  }

  // Canonical transformed URL on the CDN domain
  return `${baseUrl}/cdn-cgi/image/${optionsString}/${rawPath.replace(/^\/+/, '')}`;
}

/**
 * Generates a responsive srcset string using predictable, edge-cached presets.
 * 
 * @param {string} sourceUrl - Source image path or URL
 * @param {Array<string>} [presetNames=['thumbnail', 'listing']] - Ordered array of preset names
 * @returns {string|undefined} Formatted srcset string (e.g. "... 400w, ... 800w") or undefined if disabled
 * 
 * @example
 * getImageSrcSet(image, ['thumbnail', 'listing'])
 * // => "https://assets.weave365.com/cdn-cgi/image/width=400... 400w, https://assets.weave365.com/cdn-cgi/image/width=800... 800w"
 */
export function getImageSrcSet(sourceUrl, presetNames = ['thumbnail', 'listing']) {
  if (!sourceUrl || !isTransformableImage(sourceUrl) || !isTransformationEnabled()) {
    return undefined;
  }

  const entries = presetNames
    .map((name) => {
      const preset = IMAGE_PRESETS[name];
      if (!preset || !preset.width) return null;
      const url = getOptimizedImageUrl(sourceUrl, name);
      return `${url} ${preset.width}w`;
    })
    .filter(Boolean);

  return entries.length > 0 ? entries.join(', ') : undefined;
}
