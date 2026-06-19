/**
 * storefrontShared Utility Hub & Re-exporting Module
 * Purpose: Streamlines storefront operations by serving as:
 * 1. The central stateless business logic library (currency math, WhatsApp message formatting, image proxying).
 * 2. A backward-compatibility import/re-export gateway for extracted visual components.
 */
import { memo, useMemo, useState, useEffect } from 'react';
import { storeConfig } from './config.js';
import { priceForBuyer, priceNoticeForAccess } from './utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import {
  CURRENCIES,
  CurrencyManager,
  useCurrency,
  formatMoney,
  formatWeight,
  customerPrice,
  parsePositiveNumber
} from './utils/priceUtils.js';

export {
  CURRENCIES,
  CurrencyManager,
  useCurrency,
  formatMoney,
  formatWeight,
  customerPrice,
  parsePositiveNumber,
  priceForBuyer,
  priceNoticeForAccess
};
import { ResellerShareModal } from './components/ResellerShareModal.jsx';
import { WhatsappIcon } from './components/WhatsappIcon.jsx';
import { SectionTitle } from './components/SectionTitle.jsx';
import { StateMessage } from './components/StateMessage.jsx';
import { Newsletter } from './components/Newsletter.jsx';
import { ProductTrustStrip } from './components/ProductTrustStrip.jsx';
import { ProductCard } from './components/ProductCard.jsx';
import { PriceLine } from './components/PriceLine.jsx';
import { ResellerWhatsappShare } from './components/ResellerWhatsappShare.jsx';
import { EnquiryPopup } from './components/EnquiryPopup.jsx';

export {
  WhatsappIcon,
  SectionTitle,
  StateMessage,
  Newsletter,
  ProductTrustStrip,
  ProductCard,
  PriceLine,
  ResellerWhatsappShare,
  EnquiryPopup
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
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
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
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error('Unable to prepare product image');

  const blob = await response.blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';

  return new File([blob], `${filename}.${extension}`, { type });
}

export function safeFileName(value) {
  return String(value || 'product-image').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'product-image';
}



export function buildWhatsappUrl(items, total, pincode, codStatus, priceAccess, screenshotUrl, address) {
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const isWholesale = priceAccess?.priceGroup === 'wholesale';

  if (isWholesale && canViewPrices) {
    const itemLines = items.map((item) => {
      const price = customerPrice(item.variant.prices, priceAccess) || 0;
      const totalColors = item.product.totalColors ?? (item.product.variants?.length || 1);
      const colorText = item.selectedColorName || item.variant.color || 'Set';
      const isSet = totalColors > 1;
      
      const setQty = isSet ? Math.max(1, Math.round(item.quantity / totalColors)) : item.quantity;
      const unitLabel = isSet ? (setQty > 1 ? 'Sets' : 'Set') : (setQty > 1 ? 'pcs' : 'pc');
      const finalPrice = price * item.quantity;

      return [
        `${item.product.title}`,
        `Code: ${item.variant.code} | Color: ${colorText} | Qty: ${setQty} ${unitLabel} | Price: ${formatMoney(finalPrice)}`
      ].join('\n');
    });

    const lines = [
      `Hello ${storeConfig.name}, I want to enquire about these sarees:`,
      '',
      itemLines.join('\n\n'),
      '',
      total != null ? `Estimated total: ${formatMoney(total)} (Excluding GST & Shipping)` : '',
      pincode ? `Pincode: ${pincode}` : '',
      codStatus === 'available' ? 'COD checked: Available' : '',
    ].filter(Boolean);

    if (address) {
      lines.push(
        '',
        '*Delivery Address:*',
        `Name: ${address.full_name}`,
        `Phone: ${address.phone_number}`,
        `Address: ${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}`,
        `City: ${address.city}, State: ${address.state} - ${address.pincode}`,
        `Country: ${address.country || 'India'}`
      );
    }

    if (screenshotUrl) {
      lines.push('', `Payment Screenshot: ${screenshotUrl}`);
    }

    return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  // Fallback for non-wholesale users
  const lines = [
    `Hello ${storeConfig.name}, I want to enquire about these sarees:`,
    '',
    ...items.map((item) => {
      const price = customerPrice(item.variant.prices, priceAccess);
      const color = item.selectedColorName ? ` | Color: ${item.selectedColorName}` : '';
      const priceText = canViewPrices && price != null ? ` | Price: ${formatMoney(price)}` : '';
      return `${item.product.title} | Code: ${item.variant.code}${color} | Qty: ${item.quantity}${priceText}`;
    }),
    '',
    canViewPrices && total != null ? `Estimated total: ${formatMoney(total)}` : '',
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  if (address) {
    lines.push(
      '',
      '*Delivery Address:*',
      `Name: ${address.full_name}`,
      `Phone: ${address.phone_number}`,
      `Address: ${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}`,
      `City: ${address.city}, State: ${address.state} - ${address.pincode}`,
      `Country: ${address.country || 'India'}`
    );
  }

  if (screenshotUrl) {
    lines.push('', `Payment Screenshot: ${screenshotUrl}`);
  }

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildSingleProductWhatsappUrl(product, variant, quantity, pincode, codStatus, priceAccess) {
  const price = customerPrice(variant.prices, priceAccess);
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const isWholesale = priceAccess?.priceGroup === 'wholesale';
  const productUrl = `https://www.weave365.com/product/${product.id}`;

  if (isWholesale && canViewPrices && price != null) {
    const isSet = quantity > 1;
    const unitLabel = isSet ? 'Set' : 'pc';
    const finalPrice = isSet ? price * quantity : price;

    const lines = [
      `Hello ${storeConfig.name},`,
      `I want to buy this catalog: `,
      `${product.title}`,
      `Code: ${variant.code} | Color: ${quantity}`,
      `Quant: 1 ${unitLabel} | price : ${formatMoney(finalPrice)} (Excluding GST & Shipping)`
    ];
    lines.push('', `Product Link: ${productUrl}`);
    return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  // Fallback for Guest/Reseller accounts
  const priceText = canViewPrices && price != null
    ? `Price: ${formatMoney(price)} /pc | Price ${formatMoney(price * quantity)} /set`
    : '';

  const lines = [
    `Hello ${storeConfig.name},`,
    `I want to buy this catalog:`,
    `${product.title}`,
    `Code: ${variant.code} | Color: ${quantity}`,
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