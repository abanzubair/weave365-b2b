'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from '../icons.jsx';
import { useCountryCurrency } from '../../store/useCountryCurrency.js';
import { getLocalizedPrice } from '../../services/pricingService.js';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer.js';
import { fallbackProductImage } from '../../storefrontShared.jsx';
import { getProductCategorySlug } from '../../config.js';

export function ProductMatchCard({ product, onSelect }) {
  const currentCountry = useCountryCurrency((s) => s.currentCountry);
  const exchangeRates = useCountryCurrency((s) => s.exchangeRates);

  const productHref = useMemo(() => {
    if (product?.url && typeof product.url === 'string') {
      return product.url.startsWith('/') ? product.url : `/${product.url}`;
    }
    if (product?.id) {
      return `/${getProductCategorySlug(product.id, product.category)}/${encodeURIComponent(product.id)}`;
    }
    return '/catalogue';
  }, [product?.url, product?.id, product?.category]);

  const rawInr = Number(product?.priceInr ?? product?.price ?? 0);
  const localizedPrice = useMemo(() => {
    if (!Number.isFinite(rawInr) || rawInr <= 0) return null;
    return getLocalizedPrice(rawInr, currentCountry, exchangeRates);
  }, [rawInr, currentCountry, exchangeRates]);

  const imageSrc = useMemo(() => {
    if (!product?.image) return fallbackProductImage;
    return getOptimizedImageUrl(product.image, 'thumbnail');
  }, [product?.image]);

  const inStock = product?.inStock !== false;
  const colorName = product?.colorName ? String(product.colorName).trim() : '';
  const fabricLabel = product?.fabricLabel ? String(product.fabricLabel).trim() : '';
  const title = product?.title || 'Banarasi Piece';
  const altText = [
    title,
    colorName || null,
    fabricLabel ? `${fabricLabel} fabric` : null,
    inStock ? 'in stock' : 'out of stock',
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <Link
      href={productHref}
      className="wc-product-link"
      onClick={() => onSelect?.(product)}
    >
      <article className="wc-product-card">
        <img
          src={imageSrc}
          alt={altText}
          width={52}
          height={65}
          loading="lazy"
          decoding="async"
          className="wc-product-thumb"
        />

        <div className="wc-product-body">
          <h3 className="wc-product-title">{title}</h3>
          <p className="wc-product-meta">
            {colorName && (
              <>
                <span>{colorName}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            {fabricLabel && (
              <>
                <span>{fabricLabel}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className={inStock ? 'wc-stock-in' : 'wc-stock-out'}>
              {inStock ? 'In stock' : 'Out of stock'}
            </span>
          </p>
          <footer className="wc-product-footer">
            <span className="wc-product-price">
              {localizedPrice ? `${localizedPrice.formatted}/pc` : 'Rate on WhatsApp'}
            </span>
            <ChevronRight size={14} className="wc-product-chevron" aria-hidden="true" />
          </footer>
        </div>
      </article>
    </Link>
  );
}
