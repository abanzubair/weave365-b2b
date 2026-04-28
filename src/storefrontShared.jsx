import { memo } from 'react';
import {
  ArrowRight,
  Award,
  Headphones,
  Heart,
  PackageCheck,
  ShoppingBag,
  Tag,
  Truck,
} from 'lucide-react';
import { storeConfig } from './config.js';

export const fallbackProductImage = 'https://placehold.co/1200x800/f8efe5/b78646?text=No+Image+Available';

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

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
  const selectedVariant = variant || product.variants[0];
  const image = product.images[0] || fallbackProductImage;

  return (
    <article className="product-card">
      <button className="fav-button" onClick={() => toggleFavorite(product)} aria-label="Save favourite">
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button className="image-button" onClick={() => navigate('product', product.id)}>
        <span className="new-badge">New</span>
        <img src={image} alt={product.title} loading="lazy" decoding="async" />
      </button>
      <div className="product-card-copy">
        <button onClick={() => navigate('product', product.id)}>{product.title}</button>
        <PriceLine prices={selectedVariant.prices} />
        <div className="card-actions">
          <span>{selectedVariant.code}</span>
          <button onClick={() => addToCart(product, selectedVariant, 1)}>
            <ShoppingBag size={16} /> Add
          </button>
        </div>
      </div>
    </article>
  );
});

export function PriceLine({ prices }) {
  return (
    <p className="price-line">
      {prices.offer ? (
        <>
          <strong>{formatMoney(prices.offer)}</strong>
          {prices.mrp && <span>{formatMoney(prices.mrp)} MRP</span>}
        </>
      ) : (
        <>
          {prices.mrp && <strong>{formatMoney(prices.mrp)} MRP</strong>}
          {prices.single && <span>Single {formatMoney(prices.single)}</span>}
        </>
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
  return moneyFormatter.format(value);
}

export function customerPrice(prices) {
  return prices.offer || prices.single || prices.mrp || 0;
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
