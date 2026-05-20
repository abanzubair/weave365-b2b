/**
 * @file assetSrc.js
 * @description Safe asset path resolution helper. Resolves import structures for local images
 * and SVGs, ensuring compatibility between static string URLs and module object shapes imported
 * via loaders (such as Next.js image objects).
 * 
 * @module utils/assetSrc
 * @param {string|Object} asset - The imported asset reference or direct string path
 * @returns {string} The resolved absolute or relative URL string to render in `src` elements
 */

export function assetSrc(asset) {
  return typeof asset === 'string' ? asset : asset?.src || '';
}
