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
  Bookmark,
  Package,
  PackageCheck,
  Share2,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  ZoomIn,
} from 'lucide-react';
import { storeConfig } from './config.js';

export const fallbackProductImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const WhatsappIcon = ({ size = 14, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export const CURRENCIES = [
  { code: 'INR', label: '🇮🇳 India (IND)', locale: 'en-IN' },
  { code: 'USD', label: '🇺🇸 United States (USA)', locale: 'en-US' },
  { code: 'GBP', label: '🇬🇧 United Kingdom (UK)', locale: 'en-GB' },
  { code: 'AED', label: '🇦🇪 United Arab Emirates (UAE)', locale: 'ar-AE' },
  { code: 'EUR', label: '🇪🇺 Euro (EUR)', locale: 'de-DE' },
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
  const basePrice = customerPrice(selectedVariant.prices);
  
  const tiers = [
    { range: '10-24 pcs', price: basePrice },
    { range: '25-49 pcs', price: basePrice > 500 ? basePrice - 50 : basePrice },
    { range: '50+ pcs', price: basePrice > 500 ? basePrice - 100 : basePrice },
  ];

  return (
    <article className="product-card">
      <div className="card-media">
        <button className="image-button" onClick={() => navigate('product', product.id)}>
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.target.style.opacity = '0'; }}
          />
          <span className="wholesale-badge">WHOLESALE</span>
          {product.totalColors > 1 && (
            <span className="colors-badge">+{product.totalColors} COLORS</span>
          )}
        </button>
        <button 
          className="fav-button" 
          onClick={() => toggleFavorite(product)} 
          aria-label={isFavorite ? "Remove from saved" : "Save for later"}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="product-card-copy">
        <h3 className="card-title" onClick={() => navigate('product', product.id)}>
          {product.title}
        </h3>
        <span className="card-category">{product.subtitle}</span>

        <div className="card-pricing-moq">
          <div className="pricing-col">
            <label>Starting at</label>
            <strong>{formatMoney(basePrice)} <span>/pc</span></strong>
          </div>
          <div className="divider-v" />
          <div className="moq-col">
            <label>MOQ</label>
            <strong>1 Set</strong>
          </div>
        </div>

        <div className="pricing-tiers-grid">
          {tiers.map((tier, i) => (
            <div key={i} className="tier-item">
              <span className="tier-range">{tier.range}</span>
              <strong className="tier-price">{formatMoney(tier.price)}<small>/pc</small></strong>
            </div>
          ))}
        </div>

        <div className="fulfillment-row">
          <div className="fulfillment-item">
            <Package size={14} /> Ready to Ship
          </div>
          <div className="divider-v" />
          <div className="fulfillment-item">
            <Truck size={14} /> Dispatch 24-48h
          </div>
        </div>

        <div className="card-actions-v2">
          <a
            href={buildSingleProductWhatsappUrl(product, selectedVariant, 1)}
            target="_blank"
            rel="noreferrer"
            className="whatsapp-btn"
          >
            <WhatsappIcon size={18} /> Order on WhatsApp
          </a>
          <div className="secondary-row">
            <button
              className="add-cart-btn"
              onClick={() => !product.isOutOfStock && addToCart(product, selectedVariant, 1)}
              disabled={product.isOutOfStock}
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button className="save-btn" onClick={() => toggleFavorite(product)}>
              <Bookmark size={16} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'Saved' : 'Save'}
            </button>
          </div>
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
