/**
 * @file categoryHelpers.js
 * Helpers for category taxonomy and matching across the storefront.
 */

/**
 * Determines whether a product is a Saree, including sarees categorized under "Under 999"
 * or promotional price stores.
 *
 * @param {Object} product
 * @returns {boolean}
 */
export function isSareeProduct(product) {
  if (!product) return false;
  const cat = String(product.category || '').trim().toLowerCase();
  if (cat === 'saree' || cat === 'sarees') return true;

  if (cat === 'under 999' || cat === 'under-999') {
    const title = String(product.title || '').toLowerCase();
    const subCat = String(product.subCategory || '').toLowerCase();
    const desc = String(product.description || '').toLowerCase();
    const isOther = title.includes('suit') || title.includes('dupatta') || title.includes('lehenga');
    return !isOther && (title.includes('saree') || subCat.includes('saree') || desc.includes('saree') || true);
  }

  return false;
}

/**
 * Checks if a product matches a target category filter.
 * Supports:
 * - "All"
 * - "New Arrivals" / "Bestsellers"
 * - Fabric categories
 * - Garment categories (Saree, Suit, Dupatta, Lehenga)
 * - Cross-matching: "Under 999" sarees appear when Category: Saree is selected.
 *
 * @param {Object} product
 * @param {string} targetCategory
 * @returns {boolean}
 */
export function isProductMatchingCategory(product, targetCategory) {
  if (!product || !targetCategory) return false;

  const cleanTarget = String(targetCategory).trim().toLowerCase();
  if (cleanTarget === 'all') return true;
  if (cleanTarget === 'new arrivals') return Boolean(product.isNew);
  if (cleanTarget === 'bestsellers') return Boolean(product.isTopSeller);

  const prodCat = String(product.category || '').trim().toLowerCase();
  if (prodCat === cleanTarget) return true;

  if (product.fabric && String(product.fabric).trim().toLowerCase() === cleanTarget) {
    return true;
  }

  const isUnder999 = prodCat === 'under 999' || prodCat === 'under-999';

  if (cleanTarget === 'saree' || cleanTarget === 'sarees') {
    if (isUnder999) {
      return isSareeProduct(product);
    }
  }

  if (cleanTarget === 'suit' || cleanTarget === 'suits') {
    if (isUnder999) {
      const title = String(product.title || '').toLowerCase();
      const subCat = String(product.subCategory || '').toLowerCase();
      return title.includes('suit') || subCat.includes('suit');
    }
  }

  if (cleanTarget === 'dupatta' || cleanTarget === 'dupattas') {
    if (isUnder999) {
      const title = String(product.title || '').toLowerCase();
      const subCat = String(product.subCategory || '').toLowerCase();
      return title.includes('dupatta') || subCat.includes('dupatta');
    }
  }

  if (cleanTarget === 'lehenga' || cleanTarget === 'lehengas') {
    if (isUnder999) {
      const title = String(product.title || '').toLowerCase();
      const subCat = String(product.subCategory || '').toLowerCase();
      return title.includes('lehenga') || subCat.includes('lehenga');
    }
  }

  return false;
}

