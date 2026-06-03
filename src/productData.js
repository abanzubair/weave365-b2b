/**
 * @file productData.js
 * @description Core B2B Product and Catalog Data Service.
 * Orchestrates CSV ingestion from Google Sheets config, parsing and normalizing product codes,
 * variants, status tags, stock-in dates, and images, and manages background auto-synchronization
 * to the Supabase database.
 * 
 * @module productData
 */

import Papa from 'papaparse';
import { categoryCodes, csvUrl, heroCsvUrl, configCsvUrl } from './config.js';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const moneyColumns = {
  mrp: 'B2B',
  b2r: 'B2R',
  single: 'D2C',
  cod: 'COD',
  offer: 'Offer',
};

export async function fetchConfigOptions() {
  const text = await fetchSyncedCsv('config', configCsvUrl, 'config sheet', { optional: true });
  if (!text) return { priceRanges: [], categories: [], fabrics: [], weaves: [] };

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeCsvHeader,
  });
  
  const priceRanges = parsed.data
    .map(row => row['Price Range'] || row['PriceRange'])
    .filter(Boolean)
    .map(s => s.trim())
    .slice(0, 50);

  const categories = parsed.data
    .map(row => row['Category'] || row['Category'])
    .filter(Boolean)
    .map(s => s.trim())
    .slice(0, 50);

  const fabrics = parsed.data
    .map(row => row['Fabric'] || row['Fabric'])
    .filter(Boolean)
    .map(s => s.trim())
    .slice(0, 50);

  const weaves = parsed.data
    .map(row => row['Weave'] || row['weave'])
    .filter(Boolean)
    .map(s => s.trim())
    .slice(0, 50);

  return { priceRanges, categories, fabrics, weaves };
}

export async function fetchProducts() {
  const text = await fetchSyncedCsv('products', csvUrl, 'products sheet');

  return parseProductCsv(text);
}

export function parseProductCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: false,
    transformHeader: normalizeCsvHeader,
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0].message);
  }

  const products = new Map();
  let currentGroupKey = null;

  for (const rawRow of parsed.data) {
    const row = normalizeRow(rawRow);
    const hasVariantCol = Boolean(row.Variant || row.variant);
    const firstVariantCode = (function() {
      if (!hasVariantCol) return '';
      const segs = String(row.Variant || row.variant || '').split('|').map(s => s.trim()).filter(Boolean);
      if (!segs.length) return '';
      const idx = segs[0].indexOf(':');
      return idx === -1 ? segs[0] : segs[0].substring(0, idx).trim();
    })();

    const hasProductData = Boolean(row.Code) || Boolean(firstVariantCode) || Boolean(row['Pre Code']) || Boolean(row.Category);

    if (!hasProductData) {
      const coverImage = driveImageUrl(row['Cover Image'] || row.Cover);
      const imagesRawStr = String(row['Product Images'] || row['Product Link'] || row.Color || '').trim();
      const imageUrls = imagesRawStr.split('|').map(s => s.trim()).filter(Boolean);
      const images = unique([coverImage, ...imageUrls.map(url => driveImageUrl(url))]);

      if (images.length > 0 && currentGroupKey && products.has(currentGroupKey)) {
        products.get(currentGroupKey).images.push(...images);
      }
      continue;
    }

    const { colorEntries, variants: rowVariants, images } = parseRowMediaAndVariants(row);

    const primaryCode = row.Code || firstVariantCode;
    const primaryColorName = rowVariants[0]?.color || getPrimaryColorName(row.Color);
    const codeInfo = parseCode(primaryCode, row['Pre Code'], primaryColorName);
    const groupKey = codeInfo.groupKey;
    currentGroupKey = groupKey;

    const existing = products.get(groupKey);
    if (existing) {
      for (const rv of rowVariants) {
        if (!existing.variants.some(v => v.code === rv.code)) {
          existing.variants.push(rv);
        }
      }
      if (images.length > 0) existing.images.push(...images);
      existing.colorOptions.push(...colorEntries);
      const parsedTotalColors = parseTotalColors(row.Color || row.Col || row.Variant || row.variant, colorEntries);
      if (parsedTotalColors > 0 && existing.totalColors === null) {
        existing.totalColors = parsedTotalColors;
      }
      continue;
    }

    const category = row.Category || categoryCodes[codeInfo.category] || 'Saree';
    const rawStatus = row.Tag || row.Status;
    const video = (function() {
      const key = Object.keys(row).find(k => {
        const norm = k.trim().toLowerCase().replace(/\s+/g, '');
        return norm === 'productvideo';
      }) || 'Product Video';
      return row[key] || '';
    })();

    const product = {
      id: groupKey,
      groupKey,
      categoryCode: codeInfo.category,
      vendorCode: codeInfo.vendor,
      designCode: codeInfo.design,
      category,
      subCategory: row['Sub Category'],
      partner: row.Partner || row.partner || '',
      style: row.Style,
      occasion: row.Occasion,
      fabric: row.Fabric,
      work: row.Work,
      pattern: row.Pattern,
      weave: row.Weave || row.weave || row.WEAVE || '',
      purity: row.Purity,
      type: row.Type,
      status: rawStatus,
      statusTags: parseStatusTags(rawStatus),
      stockInDate: parseStockInDate(row),
      title: productTitle(row, category),
      metaTitle: row['Meta Title'] || '',
      metaDescription: row['Meta Description'] || '',
      summary: row.Summary || wholesaleSummary(row),
      description: row.Description || wholesaleDescription(row),
      subtitle: row.Title || category,
      images: images,
      video: formatYoutubeUrl(video),
      variants: rowVariants,
      colorOptions: colorEntries,
      weight: (function() {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'weight') || 'Weight';
        const val = String(row[key] || '').replace(/[^\d.]/g, '');
        return val ? Number(val) : null;
      })(),
      totalColors: parseTotalColors(row.Col || row.Color, colorEntries),
      quantity: (function() {
        const key = Object.keys(row).find(k => {
          const lo = k.trim().toLowerCase();
          return lo === 'quantity' || lo === 'qty' || lo === 'set qty' || lo === 'designs';
        });
        const val = String(row[key] || '').replace(/[^\d.]/g, '');
        return val ? Number(val) : null;
      })(),
      priceRange: (function() {
        const key = Object.keys(row).find(k => {
          const norm = k.trim().toLowerCase().replace(/\s+/g, '');
          return norm === 'pricerange';
        });
        if (row[key]) return String(row[key]).trim();
        
        // Derive from B2B price (mrp)
        const price = Number(String(row.B2B || '').replace(/[^\d.]/g, '')) || 0;
        if (price >= 10000) return '₹10,000+';
        if (price >= 5000) return '₹5,000 \u2013 ₹9,999';
        if (price >= 3000) return '₹3,000 \u2013 ₹4,999';
        if (price >= 2000) return '₹2,000 \u2013 ₹2,999';
        if (price >= 1000) return '₹1,000 \u2013 ₹1,999';
        if (price >= 500) return '₹500 \u2013 ₹999';
        return 'Below ₹500';
      })(),
      raw: row,
    };

    products.set(groupKey, product);
  }

  const now = new Date();
  return Array.from(products.values()).map((product) => {
    const baseStatusTags = dedupeStatusTags(product.statusTags);
    const statusKeys = new Set(baseStatusTags.map((tag) => tag.key));
    const isOutOfStock = statusKeys.has('out-of-stock');
    const isFastMoving = statusKeys.has('high-demand') || statusKeys.has('fast-moving');
    const isLowMoq = statusKeys.has('low-moq');
    const isPreOrder = statusKeys.has('pre-order');
    const isReadyStock = statusKeys.has('ready-stock');
    const isDealOfDay = statusKeys.has('todays-deal');
    const isTopSeller = statusKeys.has('bestseller');
    const isManualNew = statusKeys.has('new-arrival');
    const isArchived = statusKeys.has('archived');

    const isDateNew = product.stockInDate
      ? (now - product.stockInDate) <= 15 * 24 * 60 * 60 * 1000
      : false;

    const isNew = isManualNew || isDateNew;
    const statusTags = isDateNew && !isManualNew
      ? dedupeStatusTags([{ key: 'new-arrival', label: 'New Arrival' }, ...baseStatusTags])
      : baseStatusTags;
    const normalizedColorOptions = dedupeColorOptions(product.colorOptions).map((entry) => ({
      ...entry,
      image: driveImageUrl(entry.image),
    }));
    const normalizedImages = unique([
      ...product.images,
      ...normalizedColorOptions.map((entry) => entry.image),
    ]);
    const firstColorName = normalizedColorOptions[0]?.name || '';

    return {
      ...product,
      isNew,
      isOutOfStock,
      isFastMoving,
      isLowMoq,
      isPreOrder,
      isReadyStock,
      isDealOfDay,
      isTopSeller,
      isArchived,
      statusTags,
      colorOptions: normalizedColorOptions,
      totalColors: product.totalColors || normalizedColorOptions.length || null,
      images: normalizedImages,
      variants: product.variants.map((variant, index) => ({
        ...variant,
        color: variant.color || firstColorName,
        image: variant.image || normalizedImages[index] || normalizedImages[0],
      })),
    };
  });
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim(), String(value || '').trim()]),
  );
}

function normalizeCsvHeader(header, index) {
  const trimmed = header.trim();
  return trimmed || `__empty_${index}`;
}

function readCsvValue(row, ...keys) {
  for (const key of keys) {
    const value = String(row[key] || '').trim();
    if (value) return value;
  }
  return '';
}

function normalizeHeroType(rawType, imageName) {
  const type = String(rawType || '').trim().toLowerCase();
  const name = String(imageName || '').trim().toLowerCase();

  if (type === 'desktop' || type === 'hero desktop' || type === 'banner desktop') {
    return 'banner';
  }

  if (type === 'mobile' || type === 'hero mobile' || type === 'banner mobile') {
    return 'banner mobile';
  }

  if ((type === 'category' || type === 'categories') && name) {
    return name;
  }

  return type || 'banner';
}

function parseCode(code = '', preCode = '', color = '') {
  const cleanCode = String(code || '').replace(/\s+/g, '');
  const cleanPreCode = String(preCode || '').replace(/\s+/g, '');
  let base = cleanPreCode;
  let colorCode = String(color || '').trim();

  if (cleanCode.includes('-')) {
    const [beforeDash, afterDash] = cleanCode.split('-');
    base = beforeDash;
    colorCode = afterDash || colorCode;
  } else if (!base && cleanCode.length > 6) {
    base = cleanCode.slice(0, 6);
    colorCode = cleanCode.slice(6) || colorCode;
  } else if (!base) {
    base = cleanCode;
  }

  const category = base.slice(0, 1) || '1';
  const vendor = base.slice(1, 3) || '00';
  const design = base.slice(3, 6) || base.slice(3) || '000';

  return {
    category,
    vendor,
    design,
    color: colorCode,
    groupKey: `${category}${vendor}${design}`,
    variantCode: cleanCode || `${category}${vendor}${design}${colorCode}`,
  };
}

function productTitle(row, category) {
  if (row.Name) return row.Name;
  if (row['Product Name']) return row['Product Name'];
  if (row.Title) return row.Title;

  const parts = [row.Fabric, row.Occasion, category].filter(Boolean);
  return parts.length ? parts.join(' ') : 'Premium Saree';
}

function wholesaleSummary(row) {
  const pieces = [row.Fabric, row.Work, row.Pattern].filter(Boolean);
  return pieces.length ? pieces.join(' / ') : 'Premium wholesale design for resellers.';
}

function wholesaleDescription(row) {
  const details = [row.Fabric, row.Work, row.Pattern, row.Weave, row.Purity].filter(Boolean);
  return details.length
    ? `A refined ${details.join(', ')} piece curated for wholesale and single-unit orders.`
    : 'A refined saree curated for wholesale and single-unit orders.';
}

function parsePrice(value) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  return cleaned ? Number(cleaned) : null;
}

function isCoverVariantCode(code = '') {
  return /-0$/i.test(String(code || '').trim());
}

function parseRowMediaAndVariants(row) {
  const imagesRawStr = String(row['Product Images'] || row['Product Link'] || row.Color || '').trim();
  const imageUrls = imagesRawStr.split('|').map(s => s.trim()).filter(Boolean);
  
  // 0th index of the URL list is treated as the cover image only
  const coverImage = driveImageUrl(row['Cover Image'] || row.Cover || imageUrls[0] || '');
  
  let colorEntries = [];
  let rowVariants = [];
  
  const variantColValue = row.Variant || row.variant || '';
  
  if (variantColValue) {
    const variantSegments = String(variantColValue).split('|').map(s => s.trim()).filter(Boolean);
    const parsedVariants = variantSegments.map(seg => {
      const idx = seg.indexOf(':');
      if (idx === -1) {
        return { code: seg, color: '' };
      }
      return {
        code: seg.substring(0, idx).trim(),
        color: seg.substring(idx + 1).trim()
      };
    });
    
    const hasSubVariants = parsedVariants.some(pv => pv.code && pv.code.includes('-'));
    
    // First variant image starts at index 1 for fallback, cover is index 0
    const firstVariantImage = imageUrls[1] ? driveImageUrl(imageUrls[1]) : coverImage;
    
    for (let i = 0; i < parsedVariants.length; i++) {
      const pv = parsedVariants[i];
      // Index i matches imageUrls[i] directly
      const rawImg = imageUrls[i] || '';
      const imgUrl = rawImg ? driveImageUrl(rawImg) : (i === 0 ? coverImage : firstVariantImage);
      
      const pvCodeInfo = parseCode(pv.code, row['Pre Code'], pv.color);
      const variantCode = pv.code || pvCodeInfo.variantCode;
      
      const isExplicitCover = isCoverVariantCode(variantCode);
      const isDynamicCover = hasSubVariants && !variantCode.includes('-');
      const isCoverVariant = isExplicitCover || isDynamicCover;

      // The -0 code is reserved for the cover image, not an orderable color.
      if (pv.color && !isCoverVariant) {
        colorEntries.push({
          name: pv.color,
          image: imgUrl,
        });
      }
      
      if (!isExplicitCover) {
        rowVariants.push({
          code: variantCode,
          preCode: row['Pre Code'],
          color: pv.color || pvCodeInfo.color || '',
          image: imgUrl,
          prices: {
            mrp: parsePrice(row[moneyColumns.mrp]),
            b2r: parsePrice(row[moneyColumns.b2r]),
            single: parsePrice(row[moneyColumns.single]),
            cod: parsePrice(row[moneyColumns.cod]),
            offer: parsePrice(row[moneyColumns.offer]),
          },
        });
      }
    }
  } else {
    // Single variant fallback: Color is row.Color, image is coverImage or imageUrls[0]
    const primaryImage = coverImage;
    
    const colorName = String(row.Color || row.Col || '').trim();
    const primaryColorName = (colorName && !colorName.includes('/') && !colorName.includes('http') && !colorName.includes(':')) ? colorName : '';
    
    const codeInfo = parseCode(row.Code, row['Pre Code'], primaryColorName);
    
    rowVariants.push({
      code: row.Code || codeInfo.variantCode,
      preCode: row['Pre Code'],
      color: primaryColorName,
      image: primaryImage,
      prices: {
        mrp: parsePrice(row[moneyColumns.mrp]),
        b2r: parsePrice(row[moneyColumns.b2r]),
        single: parsePrice(row[moneyColumns.single]),
        cod: parsePrice(row[moneyColumns.cod]),
        offer: parsePrice(row[moneyColumns.offer]),
      },
    });
    
    if (primaryColorName) {
      colorEntries.push({
        name: primaryColorName,
        image: primaryImage,
      });
    }
  }
  
  const rawImagesParsed = imageUrls.map(url => driveImageUrl(url)).filter(Boolean);
  const images = unique([coverImage, ...rawImagesParsed]);
  
  return {
    colorEntries,
    variants: rowVariants,
    images,
  };
}

function parseTotalColors(value, colorEntries = []) {
  if (colorEntries.length > 0) return colorEntries.length;

  const rawValue = String(value || '').trim();
  if (rawValue.includes('|') || rawValue.includes(':')) {
    const parsed = rawValue.split('|').map(s => s.trim()).filter(Boolean).length;
    if (parsed > 0) return parsed;
  }
  const parsed = parseInt(rawValue, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getPrimaryColorName(value) {
  const val = String(value || '').trim();
  if (val.includes('/') || val.includes('http') || val.includes(':')) {
    return '';
  }
  return val;
}

function dedupeColorOptions(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.name && !item?.image) return false;
    const key = `${item.name}|${item.image}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseStatusTags(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return [];

  const parts = rawValue.split(/[,|/]+/).map((part) => part.trim()).filter(Boolean);
  return parts
    .map(normalizeStatusTag)
    .filter(Boolean);
}

function normalizeStatusTag(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const tagMap = {
    'new arrival': { key: 'new-arrival', label: 'New Arrival' },
    'best seller': { key: 'bestseller', label: 'Best Seller' },
    'bestseller': { key: 'bestseller', label: 'Best Seller' },
    'top seller': { key: 'bestseller', label: 'Best Seller' },
    'top-seller': { key: 'bestseller', label: 'Best Seller' },
    'high demand': { key: 'high-demand', label: 'High Demand' },
    'fast moving': { key: 'high-demand', label: 'High Demand' },
    'low moq': { key: 'low-moq', label: 'Low MOQ' },
    'pre-order': { key: 'pre-order', label: 'Pre-Order' },
    'preorder': { key: 'pre-order', label: 'Pre-Order' },
    'ready stock': { key: 'ready-stock', label: 'Ready Stock' },
    'todays deal': { key: 'todays-deal', label: "Today's Deal" },
    'deals of the day': { key: 'todays-deal', label: "Today's Deal" },
    'deal of the day': { key: 'todays-deal', label: "Today's Deal" },
    'out of stock': { key: 'out-of-stock', label: 'Out of Stock' },
    'archived': { key: 'archived', label: 'Archived' },
  };

  return tagMap[normalized] || {
    key: normalized.replace(/[^a-z0-9]+/g, '-'),
    label: value.trim(),
  };
}

function dedupeStatusTags(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.key) return false;
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

function driveImageUrl(link) {
  const value = String(link || '').trim();
  if (!value) return '';

  // Cloudflare R2 URLs — pass through directly
  if (value.includes('images.weave365.in') || value.includes('r2.cloudflarestorage.com')) {
    return value;
  }

  // Cloudinary URLs — auto-inject f_auto,q_auto optimization if missing
  if (value.includes('res.cloudinary.com')) {
    if (value.includes('f_auto') || value.includes('q_auto')) return value;
    // Insert transformations after /upload/ (e.g. .../upload/f_auto,q_auto/folder/image.jpg)
    return value.replace('/upload/', '/upload/f_auto,q_auto/');
  }

  // Supabase Storage URLs — pass through directly
  if (value.includes('supabase.co/storage')) return value;

  const idMatch = value.match(/\/d\/([^/]+)/) || value.match(/[?&]id=([^&]+)/);
  if (!idMatch) return value;
  return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200`;
}

function driveVideoUrl(link) {
  const value = String(link || '').trim();
  if (!value) return '';

  const idMatch = value.match(/\/d\/([^/]+)/) || value.match(/[?&]id=([^&]+)/);
  if (!idMatch) return value;
  return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
}

function formatYoutubeUrl(link) {
  const value = String(link || '').trim();
  if (!value) return '';

  // Extract ID from various formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  
  let videoId = '';

  const watchMatch = value.match(/[?&]v=([^&]+)/);
  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  const embedMatch = value.match(/youtube\.com\/embed\/([^?&/]+)/);
  const shortsMatch = value.match(/youtube\.com\/shorts\/([^?&/]+)/);

  if (watchMatch) videoId = watchMatch[1];
  else if (shortMatch) videoId = shortMatch[1];
  else if (embedMatch) videoId = embedMatch[1];
  else if (shortsMatch) videoId = shortsMatch[1];

  if (videoId) {
    // Clean up any trailing parameters from the ID
    videoId = videoId.split(/[?&]/)[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return value;
}

function parseStockInDate(row) {
  const key = Object.keys(row).find(k => {
    const norm = k.trim().toLowerCase().replace(/\s+/g, '');
    return norm === 'stockin' || norm === 'stockindate';
  }) || 'Stock in';
  const val = String(row[key] || '').trim();
  if (!val) return null;

  // Try DD/MM/YY, DD-MM-YY, DD/MM/YYYY, DD-MM-YYYY
  const dmy = val.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$/);
  if (dmy) {
    const [, a, b, yearStr] = dmy;
    let year = Number(yearStr);
    if (yearStr.length === 2) {
      year += 2000;
    }
    // Assume DD/MM/YYYY (Indian date format)
    const date = new Date(year, Number(b) - 1, Number(a));
    if (!isNaN(date.getTime())) return date;
  }

  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

async function fetchPublicCsvText(url, label, { optional = false } = {}) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`[Data] Public ${label} fetch failed:`, err.message);
    if (optional) return '';
    throw new Error(`Unable to load ${label}.`);
  }
}

async function fetchSyncedCsv(id, url, label, { optional = false } = {}) {
  if (isSupabaseConfigured) {
    try {
      await autoSyncIfNeeded();
      const { data, error } = await supabase
        .from('sheet_data')
        .select('csv_data')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data?.csv_data) return data.csv_data;
    } catch (err) {
      console.warn(`[Data] Supabase ${label} unavailable, using public sheet fallback:`, err.message);
    }
  }

  return fetchPublicCsvText(url, label, { optional });
}

export async function fetchHeroData() {
  try {
    const text = await fetchSyncedCsv('hero', heroCsvUrl, 'hero sheet', { optional: true });
    if (!text) return [];

    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeCsvHeader,
    });

    return parsed.data.map((row) => {
      const imageName = readCsvValue(row, 'Image Name', 'Name');
      const type = normalizeHeroType(readCsvValue(row, 'Type'), imageName);

      return {
        imageName,
        image: driveImageUrl(readCsvValue(row, 'Image URL', 'Image')),
        video: driveVideoUrl(readCsvValue(row, 'Video URL', 'Video')),
        title: readCsvValue(row, 'Title', 'Heading'),
        subtitle: readCsvValue(row, 'Subtitle', 'Subheading'),
        buttonText: readCsvValue(row, 'Button1 Text', 'Button 1 Text', 'Button Text'),
        buttonLink: readCsvValue(row, 'Button1 Link', 'Button 1 Link', 'Button Link'),
        button2Text: readCsvValue(row, 'Button2 Text', 'Button 2 Text'),
        button2Link: readCsvValue(row, 'Button2 Link', 'Button 2 Link'),
        type,
        headingColor: readCsvValue(row, 'Title Color', 'Heading Color'),
        subheadingColor: readCsvValue(row, 'Subtitle Color', 'Subheading Color'),
        button1Color: readCsvValue(row, 'Button1 Color', 'Button 1 Color', 'Button Color'),
        button2Color: readCsvValue(row, 'Button2 Color', 'Button 2 Color'),
        headerColor: readCsvValue(row, 'Header Color'),
        accentColor: readCsvValue(row, 'Accent Color'),
        rightText: readCsvValue(row, 'Right Text', 'Sidebar Text'),
        rightTextColor: readCsvValue(row, 'Right Text Color', 'Sidebar Text Color'),
        feature1: readCsvValue(row, 'Feature 1', 'Feature1'),
        feature2: readCsvValue(row, 'Feature 2', 'Feature2'),
        feature3: readCsvValue(row, 'Feature 3', 'Feature3'),
        featureSvgColor: readCsvValue(row, 'Feature SVG Color', 'Feature Icon Color'),
        featureHeadingColor: readCsvValue(row, 'Feature Heading Color', 'Feature Title Color'),
        featureTextColor: readCsvValue(row, 'Feature Text Color', 'Feature Description Color'),
        imagePosition: readCsvValue(row, 'Image Position', 'Background Position'),
        overlayColor: readCsvValue(row, 'Overlay Color'),
        overlayOpacity: readCsvValue(row, 'Overlay Opacity'),
        logoColor: readCsvValue(row, 'Logo', 'Logo Color'),
        navigationColor: readCsvValue(row, 'Navigation', 'Navigation Color', 'Nav Color'),
      };
    }).filter(hero => hero.image || hero.video);
  } catch (error) {
    console.error('Error fetching hero data:', error);
    return [];
  }
}

let isSyncing = false;

export async function autoSyncIfNeeded() {
  if (!isSupabaseConfigured || isSyncing) return;
  
  try {
    // Check last sync time
    const { data } = await supabase.from('sheet_data').select('updated_at').eq('id', 'products').single();
    
    const lastSync = data?.updated_at ? new Date(data.updated_at) : new Date(0);
    const now = new Date();
    const diffMinutes = (now - lastSync) / (1000 * 60);

    // Auto sync every 15 minutes
    if (diffMinutes > 15) {
      console.log('Auto-syncing sheets to Supabase...');
      await syncSheetsToSupabase();
    }
  } catch (err) {
    console.error('Auto-sync check failed:', err);
  }
}

export async function syncSheetsToSupabase() {
  if (!isSupabaseConfigured || isSyncing) return;
  isSyncing = true;
  
  try {
    const fetchText = async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Fetch failed for ${url}`);
      return res.text();
    };

    // Gracefully handle hero sheet fetch failure so the entire sync doesn't abort
    const fetchHeroText = async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return await res.text();
      } catch (err) {
        console.warn(`Optional hero sheet fetch failed, skipping hero update:`, err.message);
        return null;
      }
    };

    const [products, hero, config] = await Promise.all([
      fetchText(csvUrl),
      fetchHeroText(heroCsvUrl),
      fetchText(configCsvUrl)
    ]);

    const timestamp = new Date().toISOString();
    
    const updates = [
      { id: 'products', csv_data: products, updated_at: timestamp },
      { id: 'config', csv_data: config, updated_at: timestamp }
    ];

    if (hero !== null) {
      updates.push({ id: 'hero', csv_data: hero, updated_at: timestamp });
    }

    const { error } = await supabase.from('sheet_data').upsert(updates);
    if (error) throw error;
    
    console.log('Successfully synced sheets to Supabase at', timestamp);
  } catch (err) {
    console.error('Manual sync failed:', err);
    throw err;
  } finally {
    isSyncing = false;
  }
}

export async function fetchSupabaseBlogPosts() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Unable to select from blog_posts:', error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      category: row.category,
      tag: row.tag,
      date: row.date,
      readTime: row.read_time,
      author: row.author,
      image: row.image,
      intro: row.intro,
      content: row.content,
      faqs: row.faqs || [],
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Error fetching Supabase blog posts:', err);
    return [];
  }
}

function normalizeSeoPath(path) {
  const cleaned = String(path || '/').trim();
  if (!cleaned || cleaned === 'home') return '/';
  const withSlash = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return withSlash.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export async function fetchSupabasePageSeoSettings() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('page_seo_settings')
      .select('*')
      .order('path', { ascending: true });
    if (error) {
      console.warn('Unable to select from page_seo_settings:', error.message);
      return [];
    }
    return (data || []).map((row) => ({
      id: row.id,
      path: normalizeSeoPath(row.path),
      metaTitle: row.meta_title || '',
      metaDescription: row.meta_description || '',
      ogTitle: row.og_title || '',
      ogDescription: row.og_description || '',
      imageUrl: row.image_url || '',
      canonicalPath: row.canonical_path ? normalizeSeoPath(row.canonical_path) : '',
      robotsIndex: row.robots_index !== false,
      robotsFollow: row.robots_follow !== false,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.error('Error fetching Supabase page SEO settings:', err);
    return [];
  }
}

export async function saveSupabasePageSeoSetting(setting) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

  const now = new Date().toISOString();
  const row = {
    path: normalizeSeoPath(setting.path),
    meta_title: setting.metaTitle,
    meta_description: setting.metaDescription,
    og_title: setting.ogTitle || setting.metaTitle,
    og_description: setting.ogDescription || setting.metaDescription,
    image_url: setting.imageUrl || null,
    canonical_path: setting.canonicalPath ? normalizeSeoPath(setting.canonicalPath) : normalizeSeoPath(setting.path),
    robots_index: setting.robotsIndex !== false,
    robots_follow: setting.robotsFollow !== false,
    updated_at: now,
  };

  if (setting.id) {
    row.id = setting.id;
  } else {
    row.created_at = now;
  }

  const { data, error } = await supabase
    .from('page_seo_settings')
    .upsert(row, { onConflict: 'path' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveSupabaseBlogPost(post) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
  
  const row = {
    slug: post.slug,
    title: post.title,
    meta_title: post.metaTitle,
    meta_description: post.metaDescription,
    category: post.category,
    tag: post.tag,
    date: post.date,
    read_time: post.readTime,
    author: post.author,
    image: post.image,
    intro: post.intro,
    content: post.content,
    faqs: post.faqs || [],
    created_at: post.createdAt || new Date().toISOString(),
  };

  if (post.id) {
    row.id = post.id;
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}
