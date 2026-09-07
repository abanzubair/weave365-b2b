/**
 * @file sortProducts.js
 * @description Shared product sorting utility.
 * Sorts products by stockInDate descending with tie-breaking by original sheet order.
 *
 * @module utils/sortProducts
 */

/**
 * Sorts an array of products by stockInDate descending.
 * Tie-breaker: reverse sheet order (latest _originalIndex first).
 *
 * @param {Array} products - Array of product objects with optional `stockInDate` and `_originalIndex` fields.
 * @returns {Array} A new sorted array (does not mutate the original).
 */
export function sortByStockDateDesc(products) {
  if (!Array.isArray(products) || products.length <= 1) return products || [];

  return [...products].sort((a, b) => {
    const dateA =
      a._stockTimestamp !== undefined
        ? a._stockTimestamp
        : a.stockInDate
        ? new Date(a.stockInDate).getTime()
        : 0;
    const dateB =
      b._stockTimestamp !== undefined
        ? b._stockTimestamp
        : b.stockInDate
        ? new Date(b.stockInDate).getTime()
        : 0;

    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return (b._originalIndex ?? 0) - (a._originalIndex ?? 0);
  });
}

/**
 * Fast O(N) lookup for the top active product in a specific category.
 * Matches the first product rendered on the frontend grid.
 *
 * @param {Array} products
 * @param {string} categoryName
 * @returns {Object|null}
 */
export function getTopProductForCategory(products, categoryName) {
  if (!Array.isArray(products) || !categoryName) return null;
  const targetCategory = String(categoryName).toLowerCase().trim();
  const categoryProducts = products.filter((p) => {
    if (p.isArchived) return false;
    return String(p.category || '').toLowerCase().trim() === targetCategory;
  });
  if (categoryProducts.length === 0) return null;
  const sorted = sortByStockDateDesc(categoryProducts);
  return sorted[0] || null;
}

/**
 * Fast O(N) lookup for the top active product across the entire catalogue.
 * Matches the first product rendered on the catalogue grid.
 *
 * @param {Array} products
 * @returns {Object|null}
 */
export function getTopProductForCatalogue(products) {
  if (!Array.isArray(products) || products.length === 0) return null;
  const active = products.filter((p) => !p.isArchived);
  if (active.length === 0) return null;
  const sorted = sortByStockDateDesc(active);
  return sorted[0] || null;
}
