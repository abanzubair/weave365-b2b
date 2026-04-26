import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Heart,
  Layers,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  ShoppingBag,
  ZoomIn,
} from 'lucide-react';
import { storeConfig } from './config.js';
import heroBanner from '../assets/hero.png';
import {
  formatMoney,
  customerPrice,
  buildSingleProductWhatsappUrl,
  ProductTrustStrip,
  ProductCard,
  Newsletter,
  SectionTitle,
  expandedProductCards,
} from './App.jsx';

const fallbackHero = heroBanner;

export function ProductDetailWrapper(props) {
  const { id } = useParams();
  const product = props.products.find((p) => p.id === id) || props.products[0] || null;
  const isFavorite = props.favorites.some((item) => item.productGroupKey === product?.id);

  if (!product) return null;

  return <ProductDetail {...props} product={product} isFavorite={isFavorite} />;
}

export function ProductDetail({
  product,
  products,
  navigate,
  addToCart,
  toggleFavorite,
  isFavorite,
  pincode,
  setPincode,
  codStatus,
  checkPincode,
}) {
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [variantCode, setVariantCode] = useState(product.variants[0]?.code);

  useEffect(() => {
    setSelectedImage(product.images[0]);
    setVariantCode(product.variants[0]?.code);
  }, [product]);

  const variant = product.variants.find((item) => item.code === variantCode) || product.variants[0];
  const totalDesigns =
    product.variants.length > 1 ? product.variants.length : Math.max(1, Math.min(product.images.length, 4));
  const catalogWeight = Math.max(1, totalDesigns);
  const displayPrice = customerPrice(variant.prices);
  const related = products.filter((item) => item.id !== product.id).slice(0, 5);
  const recommendationItems = related.length ? related : expandedProductCards([product]).slice(1, 6).map((item) => ({
    ...item.product,
    images: [item.image, ...item.product.images],
  }));
  const detailRows = [
    ['Catalog Name', product.title],
    ['MRP', formatMoney(variant.prices.mrp)],
    ['Single Unit Price', formatMoney(variant.prices.single)],
    ...(variant.prices.offer ? [['Offer Price', formatMoney(variant.prices.offer)]] : []),
    ...(codStatus === 'available' && variant.prices.cod ? [['COD Price', formatMoney(variant.prices.cod)]] : []),
    ['Total Design', totalDesigns],
    ['Weight', `${catalogWeight} KG`],
    ['MOQ', 'Minimum 4 Pic'],
    ['Fabric', product.fabric || 'Premium Saree'],
    ['Work', product.work || 'Designer Work'],
    ['Occasion', product.occasion || 'Casual Wear'],
    ['Fabric Description', product.description],
    ['Brand', `${storeConfig.name} ${storeConfig.subtitle}`],
  ];

  return (
    <>
      <section className="product-view">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button onClick={() => navigate('home')}>Home</button>
          <span>/</span>
          <button onClick={() => navigate('catalog')}>Catalogs</button>
          <span>/</span>
          <strong>{product.title}</strong>
        </nav>

        <div className="product-hero-grid">
          <div className="product-media">
            <div className="vertical-thumbs">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  className={selectedImage === image ? 'active' : ''}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={`${product.title} view ${index + 1}`} />
                </button>
              ))}
            </div>

            <div className="catalog-main-image">
              <img src={selectedImage || product.images[0] || fallbackHero} alt={product.title} />
              <button className="zoom-button" aria-label="View larger image">
                <ZoomIn size={18} />
              </button>
            </div>

            <div className="catalog-design-strip">
              <div>
                <strong>{totalDesigns} Designs in this Catalog</strong>
                <button type="button">
                  View all designs <ArrowRight size={16} />
                </button>
              </div>
              <div className="design-thumb-row">
                {product.images.slice(0, 4).map((image) => (
                  <button key={image} onClick={() => setSelectedImage(image)}>
                    <img src={image} alt={`${product.title} design`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="product-info-panel">
            <div className="panel-topline">
              <span className="pill">Wholesale Only</span>
              <button className="info-fav" onClick={() => toggleFavorite(product)} aria-label="Save favourite">
                <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
            <h1>{product.title}</h1>

            <div className="catalog-price-row">
              <div>
                <strong>{formatMoney(displayPrice)}</strong>
                <span>{variant.prices.offer ? 'Offer Price / Piece' : 'Single Unit / Piece'}</span>
              </div>
              <div>
                <span>MRP</span>
                <strong>{formatMoney(variant.prices.mrp)}</strong>
              </div>
            </div>

            <div className="quick-facts">
              <span>
                <Layers size={18} /> Total Designs: <strong>{totalDesigns}</strong>
              </span>
              <span>
                <ShoppingBag size={18} /> Weight: <strong>{catalogWeight} KG</strong>
              </span>
            </div>

            <div className="catalog-table">
              {detailRows.map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value || 'On request'}</strong>
                </div>
              ))}
            </div>

            {product.variants.length > 1 && (
              <label className="field-label catalog-variant">
                Variant / Color
                <select value={variantCode} onChange={(event) => setVariantCode(event.target.value)}>
                  {product.variants.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} {item.color ? `- Color ${item.color}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="pincode-box product-pincode">
              <label>
                Check COD pincode availability
                <span>
                  <input
                    value={pincode}
                    onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter pincode"
                  />
                  <button onClick={checkPincode}>Check</button>
                </span>
              </label>
              {codStatus === 'available' && <p className="success">COD available. COD price is now visible.</p>}
              {codStatus === 'unavailable' && <p className="warning">COD is not available for this pincode.</p>}
            </div>

            <button className="catalog-add-button" onClick={() => addToCart(product, variant, totalDesigns)}>
              <ShoppingBag size={20} /> Add Full Catalog
            </button>
            <a
              className="whatsapp-button"
              href={buildSingleProductWhatsappUrl(product, variant, totalDesigns, pincode, codStatus)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={20} /> Buy Via WhatsApp
            </a>
            <p className="buyer-note">
              <LockKeyhole size={16} /> Only for registered wholesale buyers. Login to save best prices.
            </p>
          </aside>
        </div>


        <ProductTrustStrip />

        <div className="product-highlight-grid">
          <section>
            <h2>Product Highlights</h2>
            <ul>
              <li>Premium {product.fabric || 'saree'} with {product.work || 'designer'} work</li>
              <li>Smooth texture and lightweight feel</li>
              <li>Elegant border with intricate detailing</li>
              <li>Comes with unstitched blouse piece</li>
            </ul>
          </section>
          <img src={product.images[1] || product.images[0] || fallbackHero} alt={`${product.title} fabric close-up`} />
          <section>
            <h2>Perfect For</h2>
            <ul className="perfect-list">
              <li><PackageCheck size={18} /> Casual Wear</li>
              <li><Heart size={18} /> Daily Wear</li>
              <li><ShoppingBag size={18} /> Office Wear</li>
              <li><Award size={18} /> Small Gatherings</li>
            </ul>
          </section>
        </div>

        <section className="you-may-like">
          <div className="section-heading-row">
            <SectionTitle title="You May Also Like" align="left" />
          </div>
          <div className="product-row">
            {recommendationItems.slice(0, 5).map((item, index) => (
              <ProductCard
                key={`${item.id}-${index}`}
                product={item}
                variant={item.variants[0]}
                navigate={navigate}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                isFavorite={false}
              />
            ))}
          </div>
        </section>
      </section>

      <Newsletter />
    </>
  );
}

export function PriceBlock({ prices, codVisible }) {
  return (
    <div className="price-block">
      {prices.offer && (
        <div className="offer-price">
          <span>Offer Price</span>
          <strong>{formatMoney(prices.offer)}</strong>
        </div>
      )}
      <div>
        <span>MRP</span>
        <strong>{formatMoney(prices.mrp)}</strong>
      </div>
      <div>
        <span>Single Unit / Export</span>
        <strong>{formatMoney(prices.single)}</strong>
      </div>
      {codVisible && prices.cod && (
        <div>
          <span>COD Price</span>
          <strong>{formatMoney(prices.cod)}</strong>
        </div>
      )}
    </div>
  );
}
