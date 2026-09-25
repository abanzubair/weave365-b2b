/**
 * @file catalogSanitizer.js
 * @description Compact serializer for catalogue and category SSR payloads.
 * Strips verbose descriptions, unused variant image arrays, and internal vendor data
 * while preserving 100% of filtering, sorting, pricing, and visual card attributes.
 */
export function sanitizeCatalogProducts(products) {
  if (!Array.isArray(products)) return [];

  return products
    .filter((p) => !p?.isArchived)
    .map((p) => {
      const csvColors = [
        p.raw?.Color,
        p.raw?.Col,
        p.raw?.Colors,
        p.raw?.['Colors Name List'],
      ].filter(Boolean);

      const o = {
        id: p.id,
        title: p.title || '',
      };

      if (p.category) o.category = p.category;
      if (p.subCategory) o.subCategory = p.subCategory;
      if (p.fabric) o.fabric = p.fabric;
      if (p.weave) o.weave = p.weave;
      if (p.work) o.work = p.work;
      if (p.purity) o.purity = p.purity;
      if (p.occasion) o.occasion = p.occasion;
      if (p.pattern) o.pattern = p.pattern;
      if (p.style) o.style = p.style;
      if (p.partner) o.partner = p.partner;
      if (p.groupKey && p.groupKey !== p.id) o.groupKey = p.groupKey;
      if (p.priceRange) o.priceRange = p.priceRange;

      const tc = p.totalColors || p.variants?.length || 1;
      if (tc > 1) o.totalColors = tc;

      if (p.statusTags?.length) o.statusTags = p.statusTags;
      if (p.isNew) o.isNew = true;
      if (p.isTopSeller) o.isTopSeller = true;
      if (p.isDealOfDay) o.isDealOfDay = true;
      if (p.isOutOfStock) o.isOutOfStock = true;
      if (p.stockStatusOverride) o.stockStatusOverride = p.stockStatusOverride;
      if (p.stockInDate) o.stockInDate = p.stockInDate;
      if (p._stockTimestamp) o._stockTimestamp = p._stockTimestamp;
      o._originalIndex = p._originalIndex !== undefined ? p._originalIndex : idx;

      o.images = Array.isArray(p.images) && p.images[0] ? [p.images[0]] : [];
      o.colorOptions = p.colorOptions?.[0]?.name ? [{ name: p.colorOptions[0].name }] : [];
      o.variants = (p.variants || []).slice(0, 1).map((v) => ({
        code: v.code || '',
        color: v.color || '',
        prices: {
          mrp: v.prices?.mrp || 0,
          b2r: v.prices?.b2r || 0,
          offer: v.prices?.offer || 0,
          single: v.prices?.single || 0,
        },
        ...(v.stock !== undefined ? { stock: v.stock } : {}),
      }));

      if (csvColors.length > 0) o.csvColors = csvColors;
      return o;
    });
}
