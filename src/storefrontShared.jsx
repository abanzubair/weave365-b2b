import { memo, useState, useEffect } from 'react';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Download,
  Heart,
  Headphones,
  Layers,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  Share2,
  Shirt,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  ZoomIn,
} from 'lucide-react';
import { storeConfig } from './config.js';

export const fallbackProductImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const CURRENCIES = [
  { code: 'INR', label: '🇮🇳 India (IND)', locale: 'en-IN' },
  { code: 'USD', label: '🇺🇸 United States (USA)', locale: 'en-US' },
  { code: 'GBP', label: '🇬🇧 United Kingdom (UK)', locale: 'en-GB' },
  { code: 'AED', label: '🇦🇪 United Arab Emirates (UAE)', locale: 'ar-AE' },
  { code: 'SGD', label: '🇸🇬 Singapore', locale: 'en-SG' },
  { code: 'MYR', label: '🇲🇾 Malaysia', locale: 'ms-MY' },
];

let currentCurrency = 'INR';
let exchangeRates = { INR: 1 };
const currencyListeners = new Set();

export const CurrencyManager = {
  get currency() { return currentCurrency; },
  get rates() { return exchangeRates; },
  setCurrency(c) {
    currentCurrency = c;
    currencyListeners.forEach(l => l());
  },
  setRates(r) {
    exchangeRates = { ...r, INR: 1 };
    currencyListeners.forEach(l => l());
  },
  subscribe(l) {
    currencyListeners.add(l);
    return () => currencyListeners.delete(l);
  }
};

export function useCurrency() {
  const [currency, setCurrencyState] = useState(CurrencyManager.currency);
  useEffect(() => {
    return CurrencyManager.subscribe(() => setCurrencyState(CurrencyManager.currency));
  }, []);
  return currency;
}

const productTrustItems = [
  { icon: Truck, title: 'Pan India Delivery', copy: 'Fast and secure delivery across India' },
  { icon: Tag, title: 'Best Wholesale Prices', copy: 'Get the best prices on bulk orders' },
  { icon: PackageCheck, title: 'Easy Returns', copy: 'Hassle-free returns for eligible issues' },
  { icon: Headphones, title: 'Dedicated Support', copy: "We're here to help you at every step" },
];

export function SectionTitle({ title, align = 'center' }) {
  return (
    <div className={`section-title ${align}`}>
      <h2>{title}</h2>
      <span />
    </div>
  );
}

export function StateMessage({ status, error }) {
  if (status === 'loading') return <p className="empty-state">Loading live catalogue...</p>;
  if (status === 'error') return <p className="error-state">{error}</p>;
  return null;
}

export function Newsletter() {
  return (
    <section className="newsletter">
      <div>
        <PackageCheck />
        <span>
          <strong>Stay Updated</strong>
          Sign up for our newsletter and get updates on new arrivals, exclusive offers and more.
        </span>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <input type="email" placeholder="Enter your email" />
        <button>Subscribe</button>
      </form>
    </section>
  );
}

export function ProductTrustStrip() {
  return (
    <section className="product-trust-strip">
      {productTrustItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon />
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

export const ProductCard = memo(function ProductCard({
  product,
  variant,
  navigate,
  addToCart,
  toggleFavorite,
  isFavorite,
}) {
  useCurrency();
  const selectedVariant = variant || product.variants[0];
  const image = product.images[0] || fallbackProductImage;
  const cardStatusTags = (product.statusTags || []).slice(0, 2);


  return (
    <article className="product-card">
      <button className="image-button" onClick={() => navigate('product', product.id)}>
        <img
          src={image}
          alt={product.title}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.target.style.opacity = '0'; }}
        />
        {product.isOutOfStock && (
          <span className="out-of-stock-overlay" />
        )}
        <div className="card-brand-vertical">
          <BadgeCheck size={14} />
          <span>Weave 365</span>
          <div className="brand-line" />
        </div>
        {cardStatusTags.length > 0 && (
          <span className="card-status-row">
            {cardStatusTags.map((tag) => (
              <span
                key={tag.key}
                className={`card-status-badge card-status-${tag.key}`}
              >
                {tag.key === 'new-arrival' && <Sparkles size={11} />}
                {tag.key === 'top-seller' && <Award size={11} />}
                {tag.key === 'bestseller' && <Award size={11} />}
                {tag.label}
              </span>
            ))}
          </span>
        )}
      </button>
      <button className="fav-button" onClick={() => toggleFavorite(product)} aria-label="Save favourite">
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <div className="product-card-copy">
        <button className="card-title-btn" onClick={() => navigate('product', product.id)}>{product.title}</button>
        <span className="product-card-code">{selectedVariant.code}</span>
        <div className="card-price-divider">
          <span className="card-price-divider-diamond" />
        </div>
        <PriceLine prices={selectedVariant.prices} />

        <div className="card-actions">
          <a
            href={buildSingleProductWhatsappUrl(product, selectedVariant, 1)}
            target="_blank"
            rel="noreferrer"
            className="card-chat-btn"
            aria-label="Enquire on WhatsApp"
          >
            <MessageCircle size={16} /> Enquire
          </a>
          <button
            className={`card-add-btn${product.isOutOfStock ? ' disabled' : ''}`}
            onClick={() => !product.isOutOfStock && addToCart(product, selectedVariant, 1)}
            disabled={product.isOutOfStock}
          >
            <ShoppingBag size={16} /> {product.isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </article>
  );
});

export function PriceLine({ prices }) {
  const buyPrice = customerPrice(prices);

  return (
    <p className="price-line">
      {prices.offer ? (
        <>
          <strong>{formatMoney(buyPrice)} <small className="price-unit">/piece</small></strong>
          {prices.mrp && (
            <>
              <span>{formatMoney(prices.mrp)}</span>
              <em>MRP</em>
            </>
          )}
        </>
      ) : (
        buyPrice > 0 && <strong>{formatMoney(buyPrice)} <small className="price-unit">/piece</small></strong>
      )}
    </p>
  );
}

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

export function formatMoney(value) {
  if (value == null || Number.isNaN(value)) return 'On request';
  
  const currencyCode = CurrencyManager.currency;
  const rate = CurrencyManager.rates[currencyCode] || 1;
  const convertedValue = value * rate;
  
  const currencyInfo = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  const formatter = new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: currencyCode === 'INR' ? 0 : 2,
  });
  
  return formatter.format(convertedValue);
}

export function formatWeight(weightInKg) {
  const w = Number(weightInKg) || 0;
  if (w < 1 && w > 0) {
    return `${Number((w * 1000).toFixed(2))} Grams`;
  }
  return `${Number(w.toFixed(2))} KG`;
}

export function customerPrice(prices) {
  return prices.offer || prices.mrp || 0;
}

export function buildWhatsappUrl(items, total, pincode, codStatus) {
  const lines = [
    `Hello ${storeConfig.name}, I want to enquire about these sarees:`,
    '',
    ...items.map((item) => {
      const price = customerPrice(item.variant.prices);
      return `${item.product.title} | Code: ${item.variant.code} | Qty: ${item.quantity} | Price: ${formatMoney(price)}`;
    }),
    '',
    `Estimated total: ${formatMoney(total)}`,
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildSingleProductWhatsappUrl(product, variant, quantity, pincode, codStatus) {
  const price = customerPrice(variant.prices);
  const lines = [
    `Hello ${storeConfig.name}, I want to buy this catalog:`,
    '',
    `${product.title}`,
    `Code: ${variant.code}`,
    `Designs: ${quantity}`,
    `Price: ${formatMoney(price)} / piece`,
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function normalizePincodeInput(value) {
  return String(value).replace(/\D/g, '').slice(0, 6);
}
