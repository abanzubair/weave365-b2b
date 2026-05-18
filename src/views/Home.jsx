import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import { ArrowRight, User, Users, Award, ChevronLeft, ChevronRight, ShieldCheck, PackageCheck, Clock3, BadgePercent, ShoppingBag, Truck, LayoutGrid, ArrowDown, Grid, Tag } from 'lucide-react';
import { fallbackProductImage, SectionTitle, StateMessage, ProductCard, expandedProductCards, Newsletter, formatMoney, customerPrice } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { FeatureStrip, BenefitStrip, Stat } from '../components/Strips.jsx';
import { ResellerGrowth } from '../components/ResellerGrowth.jsx';
import { BrandCollaboration } from '../components/BrandCollaboration.jsx';
import newBanner1 from '../../assets/newBanner1.png';
import newBanner1Mobile from '../../assets/newBanner1Mobile.png';
import newBanner2 from '../../assets/newBanner2.png';
import resellerImage from '../../assets/reseller_premium_catalog_display.png';
import brandCollabImage from '../../assets/brand_collaboration.png';
import weaverImage from '../../assets/artisan_at_loom_premium.png';
import { storeConfig } from '../config.js';
import { assetSrc } from '../utils/assetSrc.js';

export const homeCategoryNames = ['Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Accessories'];

function getDealCountdown() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const remaining = Math.max(0, end - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return { hours, minutes, seconds };
}

function twoDigit(value) {
  return String(value).padStart(2, '0');
}

export function Home({
  products,
  status,
  error,
  heroSlides,
  fallbackHeroImage,
  navigate,
  setCategory,
  openAuth,
  addToCart,
  toggleFavorite,
  favoriteKeys,
  priceAccess,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dealCountdown, setDealCountdown] = useState(() => getDealCountdown());
  const dealRailRef = useRef(null);
  const [showNewHero, setShowNewHero] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const bannerSlides = useMemo(() => {
    const mobileBanners = heroSlides.filter(s => s.type === 'banner mobile');
    const desktopBanners = heroSlides.filter(s => s.type === 'banner');

    if (isMobile && mobileBanners.length > 0) return mobileBanners;
    return desktopBanners;
  }, [heroSlides, isMobile]);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 8000); // 8 seconds interval

    return () => clearInterval(interval);
  }, [bannerSlides.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDealCountdown(getDealCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowNewHero((prev) => {
        const next = !prev;
        if (next) {
          document.documentElement.classList.add('new-hero-active');
        } else {
          document.documentElement.classList.remove('new-hero-active');
        }
        return next;
      });
    }, 8000); // Toggle slides every 8 seconds to match banner slideshows

    return () => {
      clearInterval(interval);
      document.documentElement.classList.remove('new-hero-active');
    };
  }, []);

  const activeHeroData = bannerSlides[currentSlide] || null;

  useEffect(() => {
    // Premium hero is always dark → force white header text
    document.documentElement.style.setProperty('--header-text-color', 'white');
    document.documentElement.classList.add('header-over-dark');
    return () => {
      document.documentElement.style.removeProperty('--header-text-color');
      document.documentElement.classList.remove('header-over-dark');
    };
  }, []);

  const bestsellers = useMemo(() => 
    products
      .filter((p) => p.isTopSeller)
      .slice(0, 8)
      .map(p => ({
        product: p,
        image: p.images[0] || fallbackHeroImage,
        variant: p.variants[0]
      })), 
    [products, fallbackHeroImage]
  );

  const arrivals = useMemo(() => {
    const newProducts = products.filter(p => p.isNew);
    const source = newProducts.length > 0 ? newProducts.slice(0, 8) : products.slice(0, 8);
    return source.map(p => ({
      product: p,
      image: p.images[0] || fallbackHeroImage,
      variant: p.variants[0]
    }));
  }, [products, fallbackHeroImage]);

  const dealProducts = useMemo(() => {
    const discountedProducts = products
      .map((product) => {
        const variant = product.variants?.[0];
        const mrp = variant?.prices?.mrp;
        const offer = variant?.prices?.offer;
        if (!variant || !mrp || !offer || offer >= mrp) return null;

        const discountPercent = Math.round(((mrp - offer) / mrp) * 100);
        return {
          product,
          variant,
          image: product.images[0] || fallbackHeroImage,
          discountPercent,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.discountPercent - a.discountPercent);

    const taggedDeals = discountedProducts.filter(({ product }) => product.isDealOfDay);
    if (!taggedDeals.length) return [];

    const taggedProductIds = new Set(taggedDeals.map(({ product }) => product.id));
    return [
      ...taggedDeals,
      ...discountedProducts.filter(({ product }) => !taggedProductIds.has(product.id)),
    ].slice(0, 2);
  }, [fallbackHeroImage, products]);

  useEffect(() => {
    if (dealProducts.length <= 1) return undefined;

    const mediaQuery = window.matchMedia('(max-width: 820px)');
    if (!mediaQuery.matches) return undefined;

    const rail = dealRailRef.current;
    if (!rail) return undefined;

    let nextIndex = 0;

    const interval = setInterval(() => {
      const slideWidth = rail.clientWidth;
      if (!slideWidth) return;

      nextIndex = (nextIndex + 1) % dealProducts.length;
      rail.scrollTo({
        left: slideWidth * nextIndex,
        behavior: 'smooth',
      });
    }, 4200);

    return () => clearInterval(interval);
  }, [dealProducts.length]);

  const categoryImages = useMemo(() => {
    const map = {};
    heroSlides.forEach(slide => {
      if (slide.type !== 'banner' && slide.type !== 'banner mobile') {
        map[slide.type] = slide.image;
      }
    });
    return map;
  }, [heroSlides]);

  const categoryPreviewImages = useMemo(() => {
    const productImages = expandedProductCards(products).map((item) => item.image).filter(Boolean);
    return productImages.length ? productImages : [fallbackHeroImage];
  }, [fallbackHeroImage, products]);

  const resellerSectionImage = assetSrc(resellerImage);
  const brandCollabSectionImage = assetSrc(brandCollabImage);
  const weaverSectionImage = assetSrc(weaverImage);

  const scrollProductRail = (rowId, direction) => {
    const rail = document.getElementById(rowId);
    if (!rail) return;

    const card = rail.querySelector('.product-card');
    const styles = window.getComputedStyle(rail);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    const distance = card ? card.getBoundingClientRect().width + gap : rail.clientWidth;

    rail.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero-transition-container">
        {/* Original Slide */}
        <div className={`hero-slide-pane pane-first ${!showNewHero ? 'active' : ''}`}>
          <section 
            className="premium-hero" 
            style={{ 
              '--hero-bg': `url(https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/v1779137653/Weave_365_iemq2t.png)`,
              '--hero-bg-mobile': `url(${assetSrc(newBanner1Mobile)})`
            }}
          >
            <div className="premium-hero-overlay"></div>
            
            <div className="premium-hero-content">
              <div className="premium-hero-main">
                <h1 className="premium-hero-title">
                  {/* <span className="title-slash">/</span> Timeless<br />
                  Weaves.<br />
                  Endless<br />
                  Possibilities. */}
                  Timeless Weaves<br />
                  Endless Possibilities
                </h1>
                
                <p className="premium-hero-subtitle">
                  Banarasi Sarees & Suits for your business,
                  crafted for every story.
                </p>
                
                <div className="premium-hero-actions">
                  <button 
                    className="premium-btn-filled" 
                    onClick={() => navigate('catalog')}
                  >
                    Explore Collections
                  </button>
                  <button 
                    className="premium-btn-text" 
                    onClick={() => navigate('bulk-inquiry')}
                  >
                    Request Catalog <ArrowRight size={18} />
                  </button>
                </div>
                
                <div className="premium-hero-features">
                  <div className="premium-feature">
                    <Grid size={24} strokeWidth={1.5} />
                    <div className="premium-feature-text">
                      <strong>Premium Quality</strong>
                      <span>Finest fabrics and<br />authentic craftsmanship.</span>
                    </div>
                  </div>
                  <div className="premium-feature">
                    <Tag size={24} strokeWidth={1.5} />
                    <div className="premium-feature-text">
                      <strong>Wholesale Prices</strong>
                      <span>Competitive pricing<br />for your business.</span>
                    </div>
                  </div>
                  <div className="premium-feature">
                    <Truck size={24} strokeWidth={1.5} />
                    <div className="premium-feature-text">
                      <strong>Reliable Supply</strong>
                      <span>Timely delivery & bulk<br />order support.</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="premium-hero-sidebar">
                <div className="premium-hero-collection-info">
                  <span>B2B<br />SAREE<br />COLLECTION<br />'26</span>
                </div>
                {/* <div className="premium-hero-pagination">
                  <span className="current-slide">01</span>
                  <span className="divider">/</span>
                  <span className="total-slides">03</span>
                </div> */}
              </div>
            </div>
            <div className="premium-hero-scroll">
              <span>Scroll to Explore</span>
              <ArrowDown size={20} strokeWidth={1.5} />
            </div>
          </section>
        </div>

        {/* New Editorial Brand Collaboration Hero Slide */}
        <div className={`hero-slide-pane pane-second ${showNewHero ? 'active' : ''}`}>
          <section className="collab-hero-section">
            {/* Left Column: Image and side tagline */}
            <div className="collab-hero-left">
              <div className="collab-hero-photo-wrap">
                <img 
                  src={assetSrc(newBanner2)} 
                  alt="Brand Collaboration Banner" 
                  className="collab-hero-photo"
                />
                <div className="collab-hero-photo-overlay"></div>
              </div>
              
              <div className="collab-vertical-text">
                CURATE. COLLABORATE. GROW TOGETHER.
              </div>
              
              <div className="collab-vertical-badge">
                <span className="badge-kicker">BRAND</span>
                <span className="badge-title">COLLABORATION</span>
                <span className="badge-line"></span>
              </div>
              
              <div className="collab-slide-pagination">
                <span className="slide-num">01</span>
                <span className="slide-separator">—</span>
                <span className="slide-total">03</span>
              </div>
            </div>

            {/* Right Column: Content segment */}
            <div className="collab-hero-right">
              <div className="collab-right-content">
                <span className="collab-kicker">COLLABORATE WITH US</span>
                
                <div className="collab-title-seal-row">
                  <h1 className="collab-title">
                    <span className="collab-title-line-1">Together</span><br />
                    <span className="collab-title-line-2">in Every</span><br />
                    <span className="collab-title-line-3">Weave</span>
                  </h1>

                  {/* Elegant rotating gold seal */}
                  <div className="rotating-seal-container">
                    <div className="rotating-seal-wrapper">
                      <svg viewBox="0 0 100 100" className="rotating-seal-svg">
                        <path d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" id="sealCirclePath" fill="none" />
                        <text fill="#c69e6a" fontSize="6.2" fontFamily="var(--font-hero-body)" letterSpacing="2.5" fontWeight="600">
                          <textPath href="#sealCirclePath" startOffset="0%">
                            BUILD YOUR BRAND • EXPAND YOUR REACH • 
                          </textPath>
                        </text>
                      </svg>
                    </div>
                    {/* Symmetrical flower icon at the center sits outside wrapper to remain static */}
                    <div className="seal-center-emblem">
                      <svg viewBox="0 0 50 50" className="seal-center-svg">
                        <g transform="translate(25,25) scale(0.7)" stroke="#c69e6a" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="-3" y="-3" width="6" height="6" transform="rotate(45)" fill="#c69e6a" opacity="0.8" />
                          <path d="M 0,-6 C 2,-11 5,-14 0,-20 C -5,-14 -2,-11 0,-6 Z" />
                          <path d="M 0,6 C 2,12 5,14 0,20 C -5,14 -2,12 0,6 Z" />
                          <path d="M -6,0 C -11,2 -14,5 -20,0 C -14,-5 -11,-2 -6,0 Z" />
                          <path d="M 6,0 C 11,2 14,5 22,0 C 14,-5 11,-2 6,0 Z" />
                          <line x1="-5" y1="-5" x2="-9" y2="-9" />
                          <line x1="5" y1="-5" x2="9" y2="-9" />
                          <line x1="-5" y1="5" x2="-9" y2="9" />
                          <line x1="5" y1="5" x2="9" y2="9" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                <p className="collab-subtitle">
                  Join hands with India's trusted B2B saree platform and showcase your collections to a growing network of buyers.
                </p>

                <div className="collab-bottom-row">
                  <button 
                    className="collab-cta-btn"
                    onClick={() => navigate('bulk-inquiry')}
                  >
                    <span className="cta-btn-text">BECOME A BRAND PARTNER</span>
                    <ArrowRight size={20} strokeWidth={1.5} />
                    <span className="cta-btn-line"></span>
                  </button>

                  <div className="collab-partners-box">
                    <span className="partners-title">FEATURED PARTNERS</span>
                    <div className="partners-list">
                      <span className="partner-name">HOUSE OF PALLU</span>
                      <span className="partner-name">VEVORA</span>
                      <span className="partner-more">+12 MORE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {dealProducts.length > 0 && (
        <section className="deal-section" aria-labelledby="deal-heading">
          <div className="deal-copy">
            <span className="deal-kicker"><BadgePercent size={15} /> Deal of the Day</span>
            <h2 id="deal-heading">Today's strongest wholesale offers</h2>
            <p>Limited-time prices on selected sarees. Pick the deal before the counter refreshes tonight.</p>
            <div className="deal-timer" aria-label="Deal ends countdown">
              <Clock3 size={18} />
              <span>{twoDigit(dealCountdown.hours)}</span>
              <small>Hrs</small>
              <span>{twoDigit(dealCountdown.minutes)}</span>
              <small>Min</small>
              <span>{twoDigit(dealCountdown.seconds)}</span>
              <small>Sec</small>
            </div>
          </div>

          <div
            ref={dealRailRef}
            className={`deal-card-grid deal-count-${dealProducts.length}`}
          >
            {dealProducts.map(({ product, variant, image, discountPercent }) => (
              <article className="deal-card" key={product.id}>
                <button className="deal-image" type="button" onClick={() => navigate('product', product.id)}>
                  <img
                    src={image}
                    alt={product.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.target.style.opacity = '0'; }}
                  />
                  <span>{discountPercent}% Off</span>
                </button>
                <div className="deal-card-copy">
                  <strong>{product.title}</strong>
                  <small>{variant.code}</small>
                  <div className="deal-price-row">
                    {priceAccess?.canViewPrices ? (
                      <>
                        <span>{formatMoney(customerPrice(variant.prices, priceAccess))}</span>
                        <del>{formatMoney(variant.prices.mrp)}</del>
                      </>
                    ) : (
                      <span className="price-locked-text">{priceNoticeForAccess(priceAccess)}</span>
                    )}
                  </div>
                  <button className="deal-order-button" type="button" onClick={() => navigate('product', product.id)}>
                    <ShoppingBag size={16} /> Order Now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section category-section">
        <SectionTitle title="Shop By Category" align="left" />
        <div className="category-grid">
          {homeCategoryNames.map((name, index) => (
            <button
              key={name}
              className="category-card"
              onClick={() => {
                setCategory(name);
                navigate('catalog');
              }}
            >
              <img
                src={categoryImages[name.toLowerCase()] || categoryPreviewImages[index % categoryPreviewImages.length]}
                alt={name}
                loading="lazy"
                decoding="async"
                onError={(e) => { e.target.style.opacity = '0'; }}
              />
              <span>{name}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
        <button className="center-button" onClick={() => navigate('catalog')}>
          View All Categories
        </button>
      </section>

      {bestsellers.length > 0 && (
        <section className="section home-product-section bestsellers-section">
          <div className="section-heading-row">
            <SectionTitle title="Best Sellers" align="left" />
            <button className="text-button" onClick={() => navigate('catalog')}>
              View All <ArrowRight size={17} />
            </button>
          </div>
          <StateMessage status={status} error={error} />
          <div className="scroll-wrapper">
            <button 
              className="scroll-arrow left" 
              onClick={() => scrollProductRail('bestsellers-row', -1)}
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="product-row scrollable-row" id="bestsellers-row">
              {bestsellers.map(({ product, image, variant }, index) => (
                <ProductCard
                key={`${product.id}-${index}`}
                product={{ ...product, images: [image, ...product.images] }}
                variant={variant}
                navigate={navigate}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                isFavorite={favoriteKeys.has(product.id)}
                priceAccess={priceAccess}
                openAuth={openAuth}
                />
              ))}
            </div>

            <button 
              className="scroll-arrow right" 
              onClick={() => scrollProductRail('bestsellers-row', 1)}
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>
      )}

      <section className="section home-product-section new-arrivals-section">
        <div className="section-heading-row">
          <SectionTitle title="New Arrivals" align="left" />
          <button className="text-button" onClick={() => navigate('catalog')}>
            View All <ArrowRight size={17} />
          </button>
        </div>
        <StateMessage status={status} error={error} />
        <div className="scroll-wrapper">
          <button 
            className="scroll-arrow left" 
            onClick={() => scrollProductRail('new-arrivals-row', -1)}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="product-row scrollable-row" id="new-arrivals-row">
            {arrivals.map(({ product, image, variant }, index) => (
              <ProductCard
              key={`${product.id}-${index}`}
              product={{ ...product, images: [image, ...product.images] }}
              variant={variant}
              navigate={navigate}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              isFavorite={favoriteKeys.has(product.id)}
              priceAccess={priceAccess}
              openAuth={openAuth}
              />
            ))}
          </div>

          <button 
            className="scroll-arrow right" 
            onClick={() => scrollProductRail('new-arrivals-row', 1)}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      <section id="why" className="why-band">
        <div>
          <SectionTitle title="Why Choose Us?" align="left" />
          <p>We provide premium quality banarasi sarees at unbeatable wholesale prices to empower your journey, elevate your brand, and help your business grow more.</p>
          <button className="primary-button compact" onClick={() => navigate('catalog')}>
            Know More
          </button>
        </div>
        <div className="stats-panel">
          <Stat icon={<LayoutGrid />} value="1000+" label="Unique Designs" />
          <Stat icon={<Users />} value="500+" label="Active Buyers" />
          <Stat icon={<Award />} value="10+" label="Years of Trust" />
          <Stat icon={<ShieldCheck />} value="95%" label="Repeat Buyers" />
        </div>
      </section>

      <ResellerGrowth imageUrl={resellerSectionImage} navigate={navigate} />

      <BrandCollaboration imageUrl={brandCollabSectionImage} weaverImageUrl={weaverSectionImage} navigate={navigate} />

      {/* <BenefitStrip /> */}

      {/* <section className="reseller-band">
        <div>
          <h2>Built for Business. Made for Resellers.</h2>
          <p>Join thousands of retailers who trust {storeConfig.name} wholesale for premium quality sarees.</p>
          <div className="reseller-actions">
            <button className="gold-button" onClick={() => navigate('bulk-inquiry')}>
              Bulk Inquiry <ArrowRight size={17} />
            </button>
            <button className="reseller-link-button" onClick={openAuth}>
              Register Now
            </button>
          </div>
        </div>
        <ul>
          <li>
            <ShieldCheck /> <span><strong>Exclusive Wholesale Prices</strong>Best rates guaranteed for our registered buyers.</span>
          </li>
          <li>
            <PackageCheck /> <span><strong>Wide Range of Collections</strong>Sarees for every occasion and customer demand.</span>
          </li>
          <li>
            <Award /> <span><strong>Reliable Partnership</strong>We grow when you grow. That's our promise.</span>
          </li>
        </ul>
      </section> */}
      

      <Newsletter />
    </>
  );
}
