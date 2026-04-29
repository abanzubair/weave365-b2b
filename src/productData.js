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
    const links = String(row['Product Link'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const images = links.map(driveImageUrl);
    const primaryImage = images[0] || '';
    const hasCode = Boolean(row.Code);
    const hasProductData = hasCode || Boolean(row['Pre Code']) || Boolean(row.Category);

    if (!hasProductData && images.length > 0 && currentGroupKey && products.has(currentGroupKey)) {
      products.get(currentGroupKey).images.push(...images);
      continue;
    }

    if (!hasProductData) {
      continue;
    }

    const codeInfo = parseCode(row.Code, row['Pre Code'], row.Color);
    const groupKey = codeInfo.groupKey;
    currentGroupKey = groupKey;

    const existing = products.get(groupKey);
    const variant = buildVariant(row, codeInfo, primaryImage);

    if (existing) {
      existing.variants.push(variant);
      if (images.length > 0) existing.images.push(...images);
      
      const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'color') || 'Color';
      const val = String(row[key] || '').trim();
      const p = parseInt(val, 10);
      if (!isNaN(p) && p > 0 && existing.totalColors === null) {
        existing.totalColors = p;
      }
      continue;
    }

    const category = row.Category || categoryCodes[codeInfo.category] || 'Saree';
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
      title: productTitle(row, category),
      summary: row.Summary || wholesaleSummary(row),
      description: row.Description || wholesaleDescription(row),
      images: images,
      variants: [variant],
      weight: (function() {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'weight') || 'Weight';
        const val = String(row[key] || '').replace(/[^\d.]/g, '');
        return val ? Number(val) : null;
      })(),
      totalColors: (function() {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'color') || 'Color';
        const val = String(row[key] || '').trim();
        const p = parseInt(val, 10);
        return isNaN(p) ? null : p;
      })(),
      raw: row,
    };

    products.set(groupKey, product);
  }

  return Array.from(products.values()).map((product) => ({
    ...product,
    images: unique(product.images),
    variants: product.variants.map((variant, index) => ({
      ...variant,
      image: variant.image || product.images[index] || product.images[0],
    })),
  }));
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key.trim(), String(value || '').trim()]),
  );
}

function buildVariant(row, codeInfo, image) {
  return {
    code: row.Code || codeInfo.variantCode,
    preCode: row['Pre Code'],
    color: codeInfo.color || row.Color,
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
