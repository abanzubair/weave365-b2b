/**
 * storefrontShared Utility Hub & Re-exporting Module
 * Purpose: Streamlines storefront operations by serving as:
 * 1. The central stateless business logic library (currency math, WhatsApp message formatting, image proxying).
 * 2. A backward-compatibility import/re-export gateway for extracted visual components.
 */
import { storeConfig, getProductCategorySlug, siteUrl } from './config.js';
import { priceForBuyer, priceNoticeForAccess } from './utils/buyerAccess.js';
import {
  CURRENCIES,
  CurrencyManager,
  useCurrency,
  formatMoney,
  formatWeight,
  customerPrice,
  calculateHybridProductPrice,
  calculateHybridCartTotals,
  parsePositiveNumber,
  checkProductPriceInRange
} from './utils/priceUtils.js';

export {
  CURRENCIES,
  CurrencyManager,
  useCurrency,
  formatMoney,
  formatWeight,
  customerPrice,
  calculateHybridProductPrice,
  calculateHybridCartTotals,
  parsePositiveNumber,
  checkProductPriceInRange,
  priceForBuyer,
  priceNoticeForAccess
};



export const fallbackProductImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function expandedProductCards(products) {
  if (!products.length) return [];

  return products.flatMap((product) => {
    const images = product.images.length ? product.images : [fallbackProductImage];
    return images.map((image, index) => ({
      product,
      image,
      variant: product.variants[index] || product.variants[0],
    }));
  });
}



export function calculateCustomerPrice(basePrice, mode, value) {
  const amount = parsePositiveNumber(value);

  if (mode === 'percentage') {
    return Math.round(basePrice + (basePrice * amount / 100));
  }

  if (mode === 'final') {
    return Math.max(basePrice, Math.round(amount || basePrice));
  }

  return Math.round(basePrice + amount);
}

export function buildCustomerProductMessage({ product, variant, quantity, selectedColorName, customerPriceValue }) {
  const length = product.length || product.sareeLength || product.raw?.Length || product.raw?.['Saree Length'] || '6.3m (incl. 85cm blouse)';
  const lines = [
    product?.title || 'Product details',
    '',
    `Code: ${variant?.code || 'On request'}`,
    `Price: ${formatMoney(customerPriceValue)} /pc`,
    '',
    '*Specification:*',
    `Colors: ${product.totalColors || quantity || 1}`,
    product.fabric ? `Fabric: ${product.fabric}` : null,
    product.fabricTop ? `Fabric Top: ${product.fabricTop}` : null,
    product.fabricBottom ? `Fabric Bottom: ${product.fabricBottom}` : null,
    product.fabricDupatta ? `Fabric Dupatta: ${product.fabricDupatta}` : null,
    product.work ? `Work: ${product.work}` : null,
    product.pattern ? `Pattern: ${product.pattern}` : null,
    product.weave ? `Weave: ${product.weave}` : null,
    product.purity ? `Purity: ${product.purity}` : null,
    product.type ? `Type: ${product.type}` : null,
    `Length: ${length}`,
    '',
    '*Disclaimer:* Slight variations in color, fabric, and weaving are possible. Making a payment indicates your agreement to this. *Cover image is for reference only.*',
    '',
    'Reply here to order or ask any question.',
  ];

  return lines.filter((line) => line !== null).join('\n');
}

export function buildWhatsappShareUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function uniqueProductShareImages(product, variant, fallbackImage) {
  const images = [
    variant?.image,
    fallbackImage,
    ...(product?.images || []),
    ...(product?.colorOptions || []).map((option) => option.image),
    ...(product?.variants || []).map((item) => item.image),
  ].filter(Boolean);

  // Return unique images. Limit to 10 to prevent Web Share API / App limits (e.g. WhatsApp) from rejecting the payload.
  return Array.from(new Set(images))
    .filter((image) => image !== fallbackProductImage)
    .slice(0, 10);
}

export async function fileFromImageUrl(imageUrl, filename) {
  let response = null;
  const fetchUrl = imageUrl.startsWith('http') ? `/api/image?url=${encodeURIComponent(imageUrl)}` : imageUrl;
  try {
    response = await fetch(fetchUrl);
  } catch (err) {
    // Proxy fetch failed, will try direct fetch
  }

  if (!response || !response.ok) {
    if (imageUrl.startsWith('http')) {
      try {
        response = await fetch(imageUrl);
      } catch (directErr) {
        // Direct fetch failed
      }
    }
  }

  if (!response || !response.ok) throw new Error('Unable to prepare product image');

  const blob = await response.blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';

  return new File([blob], `${filename}.${extension}`, { type });
}

export function safeFileName(value) {
  return String(value || 'product-image').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'product-image';
}



export function formatAddressBlock(address) {
  if (!address) return '';
  if (address.is_dropship) {
    const senderFullAddress = [
      address.dropship_sender_address,
      address.dropship_sender_city,
      address.dropship_sender_state ? `${address.dropship_sender_state}${address.dropship_sender_pincode ? ' - ' + address.dropship_sender_pincode : ''}` : address.dropship_sender_pincode
    ].filter(Boolean).join(', ');

    return [
      '*DIRECT DROPSHIP ORDER (BLIND PACKAGING)*',
      `*Sender (Parcel Label):* ${address.dropship_sender_name || 'Reseller'} (Ph: ${address.dropship_sender_phone || 'N/A'})`,
      senderFullAddress ? `*Sender Address:* ${senderFullAddress}` : null,
      `*Recipient:* ${address.dropship_recipient_name || address.full_name}`,
      `*Recipient Phone:* ${address.dropship_recipient_phone || address.phone_number}`,
      `*Deliver To:* ${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}, ${address.city}, ${address.state} - ${address.pincode}`,
      address.country && address.country !== 'India' ? `*Country:* ${address.country}` : null,
      `*Packaging Preference:* ${address.dropship_packing_preference || 'Blind Shipping (Zero Supplier Branding / No Price Tags)'}`,
    ].filter(Boolean).join('\n');
  }

  return [
    '*Delivery Address:*',
    address.full_name,
    `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}`,
    `${address.city}, ${address.state}, ${address.pincode}`,
    address.country || 'India',
    address.phone_number
  ].filter(Boolean).join('\n');
}

export function buildWhatsappUrl(items, total, pincode, codStatus, priceAccess, screenshotUrl, address, isPayment = false) {
  const canViewPrices = priceAccess?.canViewPrices !== false;

  const { groups, total: calculatedTotal } = calculateHybridCartTotals(items, priceAccess);
  const finalTotal = total != null ? total : calculatedTotal;

  const itemLines = groups.map((group) => {
    const firstItem = group.items[0];
    if (!firstItem) return '';

    const product = group.product || firstItem.product;
    const variant = group.variant || firstItem.variant;
    const catSlug = getProductCategorySlug(product.id, product.category);
    const productUrl = `${siteUrl}/${catSlug}/${encodeURIComponent(product.id)}`;
    const pricing = group.pricing || calculateHybridProductPrice(product, group.items);

    let priceSummary = '';
    if (canViewPrices && pricing.totalPrice > 0) {
      if (pricing.completeSets > 0 && pricing.extraPieces === 0) {
        priceSummary = ` | Qty: ${pricing.completeSets} Set${pricing.completeSets > 1 ? 's' : ''} (${pricing.totalQty} pcs) | Price: ${formatMoney(pricing.totalPrice)} (${formatMoney(pricing.wholesalePrice)}/pc in Set)`;
      } else if (pricing.completeSets === 0) {
        priceSummary = ` | Qty: ${pricing.totalQty} pc${pricing.totalQty > 1 ? 's' : ''} | Price: ${formatMoney(pricing.totalPrice)} (${formatMoney(pricing.resellerPrice)}/pc)`;
      } else {
        priceSummary = ` | Qty: ${pricing.totalQty} pcs (${pricing.completeSets} Set @ Wholesale ${formatMoney(pricing.wholesalePrice)}/pc + ${pricing.extraPieces} extra pcs @ Reseller ${formatMoney(pricing.resellerPrice)}/pc) | Price: ${formatMoney(pricing.totalPrice)}`;
      }
    } else {
      priceSummary = ` | Qty: ${pricing.totalQty} pcs`;
    }

    const colorDetails = group.items
      .filter((it) => it.selectedColorName && it.selectedColorName !== 'Select Color')
      .map((it) => `${it.selectedColorName}: ${it.quantity}pc`)
      .join(', ');

    return [
      `${product.title}`,
      productUrl,
      `Code: ${variant.code}${priceSummary}${colorDetails ? ` (${colorDetails})` : ''}`
    ].join('\n');
  }).filter(Boolean);

  const greeting = isPayment 
    ? `Hello ${storeConfig.name}, I have made the payment for these items:`
    : `Hello ${storeConfig.name}, I want to enquire about these items:`;

  const itemSection = itemLines.join('\n\n');

  const summarySection = [
    canViewPrices && finalTotal != null ? `Total: ${formatMoney(finalTotal)} (Excluding GST & Shipping)` : '',
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean).join('\n');

  const mainParts = [greeting, ''];
  let itemsAndSummary = '';
  if (itemSection && summarySection) {
    itemsAndSummary = `${itemSection}\n${summarySection}`;
  } else {
    itemsAndSummary = itemSection || summarySection;
  }
  if (itemsAndSummary) {
    mainParts.push(itemsAndSummary);
  }

  const blocks = [];
  blocks.push(mainParts.join('\n'));

  if (address) {
    blocks.push(formatAddressBlock(address));
  }

  if (screenshotUrl) {
    blocks.push(`Payment Screenshot: ${screenshotUrl}`);
  }

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(blocks.filter(Boolean).join('\n\n'))}`;
}

export function buildSingleProductWhatsappUrl(product, variant, quantity = 1, pincode, codStatus, priceAccess) {
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const pricing = calculateHybridProductPrice(product, quantity, variant);
  const catSlug = getProductCategorySlug(product.id, product.category);
  const productUrl = `${siteUrl}/${catSlug}/${product.id}`;

  let priceText = '';
  if (canViewPrices && pricing.totalPrice > 0) {
    if (pricing.completeSets > 0 && pricing.extraPieces === 0) {
      priceText = `Price: ${formatMoney(pricing.totalPrice)} (${formatMoney(pricing.wholesalePrice)}/pc in ${pricing.completeSets} Set${pricing.completeSets > 1 ? 's' : ''})`;
    } else if (pricing.completeSets === 0) {
      priceText = `Price: ${formatMoney(pricing.totalPrice)} (${formatMoney(pricing.resellerPrice)}/pc for ${pricing.totalQty} pc${pricing.totalQty > 1 ? 's' : ''})`;
    } else {
      priceText = `Price: ${formatMoney(pricing.totalPrice)} (${pricing.completeSets} Set @ ${formatMoney(pricing.wholesalePrice)}/pc + ${pricing.extraPieces} pcs @ ${formatMoney(pricing.resellerPrice)}/pc)`;
    }
  }

  const lines = [
    `Hello ${storeConfig.name},`,
    `I want to buy this catalog:`,
    `${product.title}`,
    `Code: ${variant.code} | Quantity: ${quantity} pc${quantity === 1 ? '' : 's'}`,
    priceText,
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  lines.push('', `Product Link: ${productUrl}`);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}


export function normalizePincodeInput(value) {
  return String(value).replace(/\D/g, '').slice(0, 6);
}

export function calculateComboDiscount(items, priceAccess) {
  if (!items || !items.length) return 0;
  if (priceAccess?.priceGroup === 'wholesale') {
    return 0;
  }

  const under999Units = [];
  const otherItems = [];

  items.forEach((item) => {
    const isUnder999 = String(item.product?.category || '').toLowerCase() === 'under 999';
    if (isUnder999) {
      for (let q = 0; q < item.quantity; q++) {
        under999Units.push(Number(item.product?.comboDiscount || 0));
      }
    } else {
      otherItems.push(item);
    }
  });

  let under999Discount = 0;
  under999Units.sort((a, b) => b - a);
  for (let i = 0; i < under999Units.length - 1; i += 2) {
    under999Discount += under999Units[i];
  }

  const otherDiscount = otherItems.reduce((sum, item) => {
    const discountAmount = Number(item.product?.comboDiscount || 0);
    if (discountAmount > 0) {
      const pairs = Math.floor(item.quantity / 2);
      return sum + (pairs * discountAmount);
    }
    return sum;
  }, 0);

  return under999Discount + otherDiscount;
}