import { useState, useMemo } from 'react';
import { Sparkles, ShoppingBag, RotateCcw, ArrowRight, ShieldCheck, Check, Heart } from 'lucide-react';
import { ProductCard, StateMessage, formatMoney, customerPrice, fallbackProductImage } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import weaverImage from '../../assets/artisan_at_loom_premium.png';
import brandLogo from '../../assets/logo_new_arrival.svg';
import { assetSrc } from '../utils/assetSrc.js';

export function NewArrivalsPage({
  products = [],
  status,
  error,
  navigate,
  addToCart,
  toggleFavorite,
  favoriteKeys,
  priceAccess,
  openAuth,
}) {
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(24);

  // 1. Isolate the base new arrivals
  const baseNewArrivals = useMemo(() => {
    let filtered = products.filter(p => p.isNew && !p.isArchived);

    // Defensive fallback: if no explicitly flagged new items, pull the latest 16 items by stockInDate
    if (filtered.length === 0) {
      filtered = [...products]
        .filter(p => !p.isArchived)
        .sort((a, b) => {
          const dateA = a.stockInDate ? new Date(a.stockInDate).getTime() : 0;
          const dateB = b.stockInDate ? new Date(b.stockInDate).getTime() : 0;
          return dateB - dateA; // descending
        })
        .slice(0, 16);
    }
    return filtered;
  }, [products]);

  // 2. Identify available subcategories within the new arrivals list
  const subcategories = useMemo(() => {
    const categoriesSet = new Set();
    baseNewArrivals.forEach(p => {
      if (p.category) {
        categoriesSet.add(p.category);
      }
    });
    return ['All', ...Array.from(categoriesSet)];
  }, [baseNewArrivals]);

  // 3. Filtered products by selected subcategory chip
  const filteredNewArrivals = useMemo(() => {
    if (selectedSubcategory === 'All') return baseNewArrivals;
    return baseNewArrivals.filter(p => p.category === selectedSubcategory);
  }, [baseNewArrivals, selectedSubcategory]);

  const handleResetFilters = () => {
    setSelectedSubcategory('All');
    setVisibleCount(24);
  };

  // 4. Split list to extract the first item as the featured spotlight card
  const featuredProduct = filteredNewArrivals[0] || null;
  const remainingArrivals = filteredNewArrivals.slice(1);

  const artisanCardInfo = useMemo(() => {
    if (!featuredProduct) return null;
    const textToTest = `${featuredProduct.work || ''} ${featuredProduct.fabric || ''} ${featuredProduct.purity || ''} ${featuredProduct.title || ''} ${featuredProduct.category || ''}`.toLowerCase();
    const isHandloom = textToTest.includes('handloom') || textToTest.includes('katan') || textToTest.includes('pure') || textToTest.includes('mulberry') || textToTest.includes('silk mark');

    if (isHandloom) {
      return {
        kicker: "Heritage Craftsmanship",
        title: "The Artisan Weaving Circle",
        seal: "Loom Spotlight",
        desc: "Our New Arrivals showcase a curated collection of premium textiles from Varanasi and heritage weaving hubs. Each piece represents outstanding craftsmanship ranging from traditional handlooms to modern power looms crafted with carefully selected premium fibers, distinct zari specifications, and custom thread purities designed to fit the diverse needs of luxury reseller boutiques.",
        image: assetSrc(weaverImage)
      };
    } else {
      return {
        kicker: "Modern Curation",
        title: "Designer Style Showcase",
        seal: "Collection Spotlight",
        desc: "This premium release showcases contemporary designs and high-demand commercial weaves. Combining designer styling with highly durable modern fabrics, these pieces offer incredible color vibrancy, high structural integrity, and exceptional value for bulk boutique orders.",
        image: featuredProduct.images?.[0] || fallbackProductImage
      };
    }
  }, [featuredProduct]);

  return (
    <div className="new-arrivals-page">
      <div className="container">
        
        {/* 🏆 Editorial Hero Banner */}
        <div className="arrivals-hero-banner animate-fade-in">
          {/* Branded Logo Background */}
          <img 
            src={assetSrc(brandLogo)} 
            alt="Weave365 Logo" 
            className="hero-geometric-motif" 
            style={{ objectFit: 'contain' }}
          />

          <div className="arrivals-hero-content">
            <span className="arrivals-hero-kicker">
              <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Weft & Warp Masterpieces
            </span>
            <h1 className="arrivals-hero-title">
              Couture <span>New Arrivals</span>
            </h1>
            <p className="arrivals-hero-description">
              Experience the fresh breath of handloom mastery. Explore our newly released Banarasi sarees, premium fabrics, and royal suit sets curated specifically for elite reseller collections and luxury retail boutiques.
            </p>
            <div className="arrivals-hero-stats">
              <div className="arrivals-stat-item">
                <span className="arrivals-stat-value">100%</span>
                <span className="arrivals-stat-label">Weaver Certified</span>
              </div>
              <div className="arrivals-stat-item">
                <span className="arrivals-stat-value">Fresh</span>
                <span className="arrivals-stat-label">Weekly Loom Drops</span>
              </div>
              <div className="arrivals-stat-item">
                <span className="arrivals-stat-value">Direct</span>
                <span className="arrivals-stat-label">Direct Loom Pricing</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🧶 Weft & Warp Artisan Feature Card */}
        <section className="artisan-showcase-section">
          <div className="glass-lux-card">
            <div className="artisan-card-layout">
              <div className="artisan-image-wrapper">
                <img 
                  src={artisanCardInfo?.image} 
                  alt="Spotlight product release" 
                  onError={(e) => { e.target.style.opacity = '0'; }}
                />
                <div className="artisan-seal-floating">
                  <span className="artisan-glow-dot"></span>
                  {artisanCardInfo?.seal}
                </div>
              </div>
              
              <div className="artisan-details-content">
                <span className="artisan-kicker">{artisanCardInfo?.kicker}</span>
                <h3 className="artisan-title">{artisanCardInfo?.title}</h3>
                <p className="artisan-desc">
                  {artisanCardInfo?.desc}
                </p>
                <div className="artisan-specs-table">
                  <div className="spec-row">
                    <span className="spec-name">Spotlight Release</span>
                    <span className="spec-value">{featuredProduct?.name || featuredProduct?.title || "Curated Weave"}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-name">Technique</span>
                    <span className="spec-value">
                      {featuredProduct?.work || featuredProduct?.weave || "Product-coordinated Craft / Weave"}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-name">Thread & Fabric</span>
                    <span className="spec-value">
                      {featuredProduct?.purity && featuredProduct?.fabric
                        ? `${featuredProduct.purity} ${featuredProduct.fabric}`
                        : (featuredProduct?.fabric || "Product-coordinated fibers")}
                    </span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-name">Loom Code</span>
                    <span className="spec-value">{featuredProduct?.id || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🛣️ "From Loom to Boutique" Visual Journey */}
        <section className="heritage-journey-section">
          <div className="journey-header">
            <h2>From Loom to Boutique</h2>
            <p>A transparent, high-integrity supply chain crafted for B2B buyers.</p>
          </div>
          
          <div className="journey-steps-grid">
            <div className="journey-step-card">
              <div className="journey-step-circle">01</div>
              <h4 className="journey-step-title">Artisan Selection</h4>
              <p className="journey-step-desc">Direct partnership with handpicked master weavers in Varanasi.</p>
            </div>
            
            <div className="journey-step-card">
              <div className="journey-step-circle">02</div>
              <h4 className="journey-step-title">Strict QA & Cert</h4>
              <p className="journey-step-desc">Every piece receives Silk Mark validation and design code registration.</p>
            </div>
            
            <div className="journey-step-card">
              <div className="journey-step-circle">03</div>
              <h4 className="journey-step-title">Secure Pack</h4>
              <p className="journey-step-desc">Moisture-sealed parcel layout prevents textile degradation.</p>
            </div>
            
            <div className="journey-step-card">
              <div className="journey-step-circle">04</div>
              <h4 className="journey-step-title">Direct Dispatch</h4>
              <p className="journey-step-desc">Fast, direct shipping to your retail outlet or boutique door.</p>
            </div>
          </div>
        </section>

        {/* 🏷️ Categories / Filter Section */}
        <div className="arrivals-filter-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="arrivals-filter-title">Filter by Category</h2>
            {selectedSubcategory !== 'All' && (
              <button 
                onClick={handleResetFilters} 
                className="reset-filters-btn"
                style={{ background: 'none', border: 'none', color: '#c69e6a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}
              >
                <RotateCcw size={14} /> Clear Filter
              </button>
            )}
          </div>

          <div className="arrivals-chips-container">
            {subcategories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedSubcategory(cat);
                  setVisibleCount(24);
                }}
                className={`arrivals-chip ${selectedSubcategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Count and Info */}
        <div className="arrivals-info-bar">
          <div>
            Showing <span className="arrivals-count-highlight">{filteredNewArrivals.slice(0, visibleCount).length}</span> of <span className="arrivals-count-highlight">{filteredNewArrivals.length}</span> luxury designs
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#c69e6a', display: 'inline-block' }}></span>
            <span>Live Inventory Sync</span>
          </div>
        </div>

        {/* Error/Loading Status Handler */}
        <StateMessage status={status} error={error} />

        {/* Product Catalog Grid */}
        {status === 'ready' && filteredNewArrivals.length > 0 ? (
          <>
            <div className="arrivals-grid">
              
              {/* 🌟 Asymmetrical Featured Hero Product Card */}
              {featuredProduct && (
                <div className="featured-hero-product-card animate-scale-up">
                  <div className="image-wrapper">
                    <img 
                      src={featuredProduct.images?.[0] || fallbackProductImage} 
                      alt={featuredProduct.title} 
                      onError={(e) => { e.target.style.opacity = '0'; }}
                    />
                    <span className="featured-card-badge">spotlight release</span>
                  </div>
                  
                  <div className="featured-card-body">
                    <span className="featured-card-subtitle">{featuredProduct.category}</span>
                    <h3 className="featured-card-title">{featuredProduct.name || featuredProduct.title}</h3>
                    <p className="featured-card-description">
                      {featuredProduct.summary || featuredProduct.description || "A breathtaking handcrafted masterwork freshly released from our weavers. Available in limited quantities for wholesale buyers."}
                    </p>
                    
                    <div className="featured-card-details">
                      {featuredProduct.fabric && (
                        <div className="featured-detail-item">
                          <span className="label">Fabric</span>
                          <span className="value">{featuredProduct.fabric}</span>
                        </div>
                      )}
                      {featuredProduct.work && (
                        <div className="featured-detail-item">
                          <span className="label">Weave Craft</span>
                          <span className="value">{featuredProduct.work}</span>
                        </div>
                      )}
                      {featuredProduct.groupKey && (
                        <div className="featured-detail-item">
                          <span className="label">Loom Code</span>
                          <span className="value">{featuredProduct.groupKey}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="featured-card-price-row">
                      <div className="featured-card-price">
                        <span className="price-label">Wholesale Cost</span>
                        {priceAccess?.canViewPrices ? (
                          <span className="price-value">
                            {formatMoney(customerPrice(featuredProduct.variants?.[0]?.prices || {}, priceAccess))}
                          </span>
                        ) : (
                          <span className="price-locked">{priceNoticeForAccess(priceAccess)}</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => toggleFavorite(featuredProduct.id)} 
                        className="icon-button"
                        style={{ border: '1px solid rgba(198, 158, 106, 0.3)', color: favoriteKeys.has(featuredProduct.id) ? '#d9534f' : '#ffffff' }}
                        aria-label="Add to favorites"
                      >
                        <Heart size={18} fill={favoriteKeys.has(featuredProduct.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => navigate('product', featuredProduct.id)}
                      className="featured-card-btn"
                    >
                      <ShoppingBag size={18} />
                      Configure Wholesale Order
                    </button>
                  </div>
                </div>
              )}

              {/* Remaining standard arrival cards */}
              {remainingArrivals.slice(0, visibleCount - 1).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={product.variants[0]}
                  navigate={navigate}
                  addToCart={addToCart}
                  toggleFavorite={toggleFavorite}
                  isFavorite={favoriteKeys.has(product.id)}
                  priceAccess={priceAccess}
                  openAuth={openAuth}
                />
              ))}
            </div>

            {/* Load More Row */}
            {filteredNewArrivals.length > visibleCount && (
              <div className="load-more-row" style={{ display: 'flex', justifyContent: 'center', marginTop: 48 }}>
                <button 
                  className="secondary-button" 
                  onClick={() => setVisibleCount(prev => prev + 24)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  Discover More Masterpieces <ArrowRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          status === 'ready' && (
            <div className="arrivals-empty-state">
              <div className="arrivals-empty-icon">✨</div>
              <h3>Fresh Drop Coming Soon</h3>
              <p>We are currently uploading our latest batch of premium handcrafted pieces. Click below to explore our extensive catalogue in the meantime.</p>
              <button onClick={() => navigate('catalog')}>
                Explore Wholesale Catalogue
              </button>
            </div>
          )
        )}

      </div>
    </div>
  );
}
