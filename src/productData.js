import Papa from 'papaparse';
import { categoryCodes, csvUrl, heroCsvUrl } from './config.js';

const moneyColumns = {
  mrp: 'B2B',
  single: 'D2C/Export',
  cod: 'COD',
  offer: 'Offer',
};

export async function fetchProducts() {
  const response = await fetch(csvUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load products (${response.status})`);
  }

  const text = await response.text();
  return parseProductCsv(text);
}

export function parseProductCsv(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: false,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length) {
    throw new Error(parsed.errors[0].message);
  }

  const products = new Map();
  let currentGroupKey = null;

  for (const rawRow of parsed.data) {
    const row = normalizeRow(rawRow);
    const coverImage = driveImageUrl(row.Cover);
    const colorEntries = parseColorEntries(row['Product Link'] || row.Color);
    const colorImages = colorEntries.map((entry) => driveImageUrl(entry.image)).filter(Boolean);
    const images = unique([coverImage, ...colorImages]);

    const primaryImage = images[0] || colorImages[0] || '';
    const hasCode = Boolean(row.Code);
    const hasProductData = hasCode || Boolean(row['Pre Code']) || Boolean(row.Category);

    if (!hasProductData && images.length > 0 && currentGroupKey && products.has(currentGroupKey)) {
      products.get(currentGroupKey).images.push(...images);
      continue;
    }

    if (!hasProductData) {
      continue;
    }

    const codeInfo = parseCode(row.Code, row['Pre Code'], getPrimaryColorName(row.Color));
    const groupKey = codeInfo.groupKey;
    currentGroupKey = groupKey;

    const existing = products.get(groupKey);
    const variant = buildVariant(row, codeInfo, primaryImage, colorEntries);

    if (existing) {
      existing.variants.push(variant);
      if (images.length > 0) existing.images.push(...images);
      existing.colorOptions.push(...colorEntries);
      const parsedTotalColors = parseTotalColors(row.Color, colorEntries);
      if (parsedTotalColors > 0 && existing.totalColors === null) {
        existing.totalColors = parsedTotalColors;
      }
      continue;
    }

    const category = row.Category || categoryCodes[codeInfo.category] || 'Saree';
    const rawStatus = row.Tag || row.Status;
    const product = {
      id: groupKey,
      groupKey,
      categoryCode: codeInfo.category,
      vendorCode: codeInfo.vendor,
      designCode: codeInfo.design,
      category,
      subCategory: row['Sub Category'],
      style: row.Style,
      occasion: row.Occasion,
      fabric: row.Fabric,
      work: row.Work,
      pattern: row.Pattern,
      weave: row.Weave,
      purity: row.Purity,
      type: row.Type,
      status: rawStatus,
      statusTags: parseStatusTags(rawStatus),
      stockInDate: parseStockInDate(row),
      title: productTitle(row, category),
      summary: row.Summary || wholesaleSummary(row),
      description: row.Description || wholesaleDescription(row),
      images: images,
      variants: [variant],
      colorOptions: colorEntries,
      weight: (function() {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'weight') || 'Weight';
        const val = String(row[key] || '').replace(/[^\d.]/g, '');
        return val ? Number(val) : null;
      })(),
      totalColors: parseTotalColors(row.Col || row.Color, colorEntries),
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
    const isTopSeller = statusKeys.has('top-seller') || statusKeys.has('bestseller');
    const isManualNew = statusKeys.has('new-arrival');

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

function buildVariant(row, codeInfo, image, colorEntries = []) {
  const firstColorName = colorEntries[0]?.name || codeInfo.color || getPrimaryColorName(row.Color);
  return {
    code: row.Code || codeInfo.variantCode,
    preCode: row['Pre Code'],
    color: firstColorName,
    image,
    prices: {
      mrp: parsePrice(row[moneyColumns.mrp]),
      single: parsePrice(row[moneyColumns.single]),
      cod: parsePrice(row[moneyColumns.cod]),
      offer: parsePrice(row[moneyColumns.offer]),
    },
  };
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

function parseColorEntries(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue || !rawValue.includes(':')) return [];

  return rawValue
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const match = entry.match(/^([^:]+):\s*(.+)$/);
      if (!match) return null;
      return {
        name: match[1].trim(),
        image: match[2].trim(),
      };
    })
    .filter((entry) => entry && entry.image);
}

function parseTotalColors(value, colorEntries = []) {
  if (colorEntries.length > 0) return colorEntries.length;

  const rawValue = String(value || '').trim();
  const parsed = parseInt(rawValue, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getPrimaryColorName(value) {
  const colorEntries = parseColorEntries(value);
  if (colorEntries.length > 0) return colorEntries[0].name;
  return String(value || '').trim();
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
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const tagMap = {
    'high demand': { key: 'high-demand', label: 'High Demand' },
    'fast moving': { key: 'fast-moving', label: 'Fast Moving' },
    'low moq': { key: 'low-moq', label: 'Low MOQ' },
    'new arrival': { key: 'new-arrival', label: 'New Arrival' },
    'out of stock': { key: 'out-of-stock', label: 'Out of Stock' },
    'pre-order': { key: 'pre-order', label: 'Pre-Order' },
    preorder: { key: 'pre-order', label: 'Pre-Order' },
    'ready stock': { key: 'ready-stock', label: 'Ready Stock' },
    'todays deal': { key: 'todays-deal', label: "Today's Deal" },
    'deals of the day': { key: 'todays-deal', label: "Today's Deal" },
    'deal of the day': { key: 'todays-deal', label: "Today's Deal" },
    'top seller': { key: 'top-seller', label: 'Top Seller' },
    bestseller: { key: 'bestseller', label: 'Bestseller' },
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

function parseStockInDate(row) {
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'stock in') || 'Stock in';
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
export async function fetchHeroData() {
  try {
    const response = await fetch(heroCsvUrl, { cache: 'no-store' });
    if (!response.ok) return [];
    const text = await response.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    return parsed.data.map((row) => {
      return {
        image: driveImageUrl(row['Image URL']),
        video: driveVideoUrl(row['Video URL']),
        title: row['Title'] || '',
        subtitle: row['Subtitle'] || '',
        buttonText: row['Button Text'] || '',
        buttonLink: row['Button Link'] || '',
        type: (row['Type'] || 'banner').toLowerCase(),
      };
    }).filter(hero => hero.image || hero.video);
  } catch (error) {
    console.error('Error fetching hero data:', error);
    return [];
  }
}
