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
  return [...products].sort((a, b) => {
    const dateA = a.stockInDate ? new Date(a.stockInDate).getTime() : 0;
    const dateB = b.stockInDate ? new Date(b.stockInDate).getTime() : 0;
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return (b._originalIndex ?? 0) - (a._originalIndex ?? 0);
  });
}
