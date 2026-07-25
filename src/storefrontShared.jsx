/**
 * storefrontShared Utility Hub & Re-exporting Module
 * Purpose: Streamlines storefront operations by serving as:
 * 1. The central stateless business logic library (currency math, WhatsApp message formatting, image proxying).
 * 2. A backward-compatibility import/re-export gateway for extracted visual components.
 */
import { memo, useMemo, useState, useEffect } from 'react';
import { storeConfig, getProductCategorySlug, siteUrl } from './config.js';
import { priceForBuyer, priceNoticeForAccess } from './utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import {
  CURRENCIES,
  CurrencyManager,
  useCurrency,
  formatMoney,
  formatWeight,
  customerPrice,
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
  const fetchUrl = imageUrl.startsWith('http') ? `/api/image?url=${encodeURIComponent(imageUrl)}` : imageUrl;
  const response = await fetch(fetchUrl);
  if (!response.ok) throw new Error('Unable to prepare product image');

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
  const isWholesale = priceAccess?.priceGroup === 'wholesale';

  if (isWholesale && canViewPrices) {
    const groups = {};
    items.forEach((item) => {
      const key = item.productGroupKey;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    const itemLines = Object.entries(groups).map(([productId, groupItems]) => {
      const firstItem = groupItems[0];
      if (!firstItem) return '';

      const setQty = firstItem.quantity;
      const totalColors = firstItem.product.totalColors ?? (firstItem.product.variants?.length || 1);
      const isUnder999 = String(firstItem.product?.category || '').toLowerCase() === 'under 999';
      const discountFactor = isUnder999 ? 1.0 : (setQty >= 10 ? 0.95 : (setQty >= 5 ? 0.98 : 1.0));

      let baseSetPrice = 0;
      groupItems.forEach((item) => {
        baseSetPrice += customerPrice(item.variant.prices, priceAccess) || 0;
      });
      if (groupItems.length < totalColors && groupItems.length > 0) {
        baseSetPrice = (baseSetPrice / groupItems.length) * totalColors;
      }

      const discountedSetPrice = baseSetPrice * discountFactor;
      const groupTotalPrice = discountedSetPrice * setQty;

      const catSlug = getProductCategorySlug(firstItem.product.id, firstItem.product.category);
      const productUrl = `${siteUrl}/${catSlug}/${encodeURIComponent(firstItem.product.id)}`;

      if (isUnder999) {
        const totalPcs = groupItems.reduce((sum, item) => sum + item.quantity, 0);
        let groupTotalPricePcs = 0;
        groupItems.forEach((item) => {
          groupTotalPricePcs += (customerPrice(item.variant.prices, priceAccess) || 0) * item.quantity;
        });
        const details = groupItems.map(item => `${item.selectedColorName}: ${item.quantity}pc`).join(', ');
        return [
          `${firstItem.product.title}`,
          productUrl,
          `Code: ${firstItem.variant.code} | Qty: ${totalPcs} pc${totalPcs === 1 ? '' : 's'} (${details}) | Price: ${formatMoney(groupTotalPricePcs)}`
        ].join('\n');
      }

      return [
        `${firstItem.product.title}`,
        productUrl,
        `Code: ${firstItem.variant.code} | Qty: ${setQty} Set${setQty === 1 ? '' : 's'} (${totalColors} colors) | Price: ${formatMoney(groupTotalPrice)} (${formatMoney(discountedSetPrice)}/Set)`
      ].join('\n');
    }).filter(Boolean);

    const greeting = isPayment 
      ? `Hello ${storeConfig.name}, I have made the payment for these sarees:`
      : `Hello ${storeConfig.name}, I want to enquire about these sarees:`;

    const itemSection = itemLines.join('\n\n');

    const summarySection = [
      total != null ? `Total: ${formatMoney(total)} (Excluding GST & Shipping)` : '',
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

  const discount = calculateComboDiscount(items, priceAccess);
  const subtotal = items.reduce((sum, item) => sum + (customerPrice(item.variant.prices, priceAccess) || 0) * item.quantity, 0);

  // Fallback for non-wholesale users
  const greeting = isPayment 
    ? `Hello ${storeConfig.name}, I have made the payment for these sarees:`
    : `Hello ${storeConfig.name}, I want to enquire about these sarees:`;

  const itemSection = items.map((item) => {
    const price = customerPrice(item.variant.prices, priceAccess);
    const color = item.selectedColorName ? ` | Color: ${item.selectedColorName}` : '';
    const priceText = canViewPrices && price != null ? ` | Price: ${formatMoney(price)}` : '';
    return `${item.product.title} | Code: ${item.variant.code}${color} | Qty: ${item.quantity}${priceText}`;
  }).join('\n');

  const summarySection = [
    discount > 0 ? `Subtotal: ${formatMoney(subtotal)}` : '',
    discount > 0 ? `Combo Discount: -${formatMoney(discount)}` : '',
    canViewPrices && total != null ? `Total: ${formatMoney(total)}` : '',
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

export function buildSingleProductWhatsappUrl(product, variant, quantity, pincode, codStatus, priceAccess) {
  const price = customerPrice(variant.prices, priceAccess);
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const isWholesale = priceAccess?.priceGroup === 'wholesale';
  const catSlug = getProductCategorySlug(product.id, product.category);
  const productUrl = `${siteUrl}/${catSlug}/${product.id}`;

  if (isWholesale && canViewPrices && price != null) {
    const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
    const isSet = quantity > 1 && !isUnder999;
    const unitLabel = isSet ? 'Set' : 'pc';
    const finalPrice = isSet ? price * quantity : price;

    const lines = [
      `Hello ${storeConfig.name},`,
      `I want to buy this catalog: `,
      `${product.title}`,
      isUnder999
        ? `Code: ${variant.code} | Quant: 1 pc | price : ${formatMoney(price)} (Excluding GST & Shipping)`
        : `Code: ${variant.code} | Color: ${quantity}\nQuant: 1 ${unitLabel} | price : ${formatMoney(finalPrice)} (Excluding GST & Shipping)`
    ];
    lines.push('', `Product Link: ${productUrl}`);
    return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  // Fallback for Guest/Reseller accounts
  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
  const discount = (!isWholesale && product.comboDiscount > 0) ? Math.floor(quantity / 2) * product.comboDiscount : 0;
  const subtotal = price * quantity;
  const finalPrice = subtotal - discount;

  const priceText = canViewPrices && price != null
    ? (discount > 0
        ? `Price: ${formatMoney(price)} /pc | Subtotal: ${formatMoney(subtotal)} | Combo Discount: -${formatMoney(discount)} | Total: ${formatMoney(finalPrice)}`
        : (isUnder999
            ? `Price: ${formatMoney(price)} /pc`
            : `Price: ${formatMoney(price)} /pc | Price ${formatMoney(price * quantity)} /set`))
    : '';

  const lines = [
    `Hello ${storeConfig.name},`,
    `I want to buy this catalog:`,
    `${product.title}`,
    isUnder999
      ? `Code: ${variant.code} | Quant: ${quantity} pc`
      : `Code: ${variant.code} | Color: ${quantity}`,
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