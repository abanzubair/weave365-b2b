import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import { ArrowRight, User, Heart, Award, ChevronLeft, ChevronRight, ShieldCheck, PackageCheck, Clock3, BadgePercent, ShoppingBag, Truck } from 'lucide-react';
import { fallbackProductImage, SectionTitle, StateMessage, ProductCard, expandedProductCards, Newsletter, formatMoney, WhatsappIcon } from '../storefrontShared.jsx';
import { FeatureStrip, BenefitStrip, Stat } from '../components/Strips.jsx';
import { ResellerGrowth } from '../components/ResellerGrowth.jsx';
import { storeConfig } from '../config.js';

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
}) {
  const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 820px)').matches);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dealCountdown, setDealCountdown] = useState(() => getDealCountdown());
  const dealRailRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)');
    const handler = (e) => setIsMobile(e.matches);
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
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [bannerSlides.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDealCountdown(getDealCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const activeHeroData = bannerSlides[currentSlide] || null;

  useEffect(() => {
    if (activeHeroData?.headerColor) {
      document.documentElement.style.setProperty('--header-text-color', activeHeroData.headerColor);
      if (activeHeroData.headerColor.toLowerCase() === 'white') {
        document.documentElement.classList.add('header-over-dark');
      } else {
        document.documentElement.classList.remove('header-over-dark');
      }
    } else {
      document.documentElement.style.removeProperty('--header-text-color');
      document.documentElement.classList.remove('header-over-dark');
    }
    return () => {
      document.documentElement.style.removeProperty('--header-text-color');
      document.documentElement.classList.remove('header-over-dark');
    };
  }, [activeHeroData]);

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

  const resellerSectionImage = categoryImages.collaboration || categoryPreviewImages[0] || fallbackHeroImage;

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
      <section className="hero">
        {/* Static Copy Overlay */}
        <div className="hero-copy-wrapper">
          <div className="hero-copy" key={currentSlide}>
            <h1 style={{ color: activeHeroData?.headingColor || undefined }}>
              {activeHeroData?.title ? (
                (() => {
                  const lines = activeHeroData.title.split('|').map(l => l.trim()).filter(Boolean);
                  const totalLines = lines.length;
                  return lines.map((line, i) => {
                    const words = line.split(/\s+/);
                    const totalWords = words.length;
                    return (
                      <Fragment key={i}>
                        {words.map((word, j) => {
                          const isFirst = i === 0 && j === 0;
                          const isLast = i === totalLines - 1 && j === totalWords - 1;
                          return (
                            <Fragment key={j}>
                              {isFirst || isLast ? <span style={{ color: 'inherit' }}>{word}</span> : word}
                              {j < totalWords - 1 ? ' ' : ''}
                            </Fragment>
                          );
                        })}
                        {i < totalLines - 1 && <br />}
                      </Fragment>
                    );
                  });
                })()
              ) : (
                <>
                  <span>Premium</span> Sarees.
                  <br />
                  Wholesale <strong>Prices.</strong>
                </>
              )}
            </h1>
            <p style={{ color: activeHeroData?.subheadingColor || undefined }}>
              {activeHeroData?.subtitle || 'Your trusted partner for quality sarees in bulk at the best prices.'}
            </p>

            <div className="hero-actions">
              <button 
                className="primary-button" 
                style={{ backgroundColor: activeHeroData?.button1Color || undefined, borderColor: activeHeroData?.button1Color || undefined }}
                onClick={() => activeHeroData?.buttonLink ? (activeHeroData.buttonLink.startsWith('http') ? window.open(activeHeroData.buttonLink, '_blank') : navigate(activeHeroData.buttonLink)) : navigate('catalog')}
              >
                <WhatsappIcon size={18} /> {activeHeroData?.buttonText || 'Shop Collection'}
              </button>
              <button 
                className="secondary-button" 
                style={{ color: activeHeroData?.button2Color || undefined, borderColor: activeHeroData?.button2Color || undefined }}
                onClick={openAuth}
              >
                Register Now
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Background Track */}
        <div className="hero-slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {(bannerSlides.length > 0 ? bannerSlides : [{}]).map((slide, index) => (
            <div key={index} className="hero-slide">
              <div className="hero-visual" aria-label="Featured saree">
                {slide.video ? (
                  <video 
                    src={slide.video} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img 
                    src={slide.image || fallbackHeroImage} 
                    alt={slide.title || 'Premium saree collection'} 
                    fetchPriority={index === 0 ? "high" : "low"} 
                    decoding="async" 
                    onError={(e) => { e.target.style.opacity = '0'; }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeatureStrip />

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
                    <span>{formatMoney(variant.prices.offer)}</span>
                    <del>{formatMoney(variant.prices.mrp)}</del>
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
        <SectionTitle title="Shop By Category" />
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
          <p>We provide premium quality sarees at unbeatable wholesale prices to empower your journey, elevate your brand, and help your business grow more.</p>
          <button className="primary-button compact" onClick={() => navigate('catalog')}>
            Know More
          </button>
        </div>
        <div className="stats-panel">
          <Stat icon={<User />} value="1000+" label="Unique Designs" />
          <Stat icon={<Heart />} value="500+" label="Active Buyers" />
          <Stat icon={<Award />} value="10+" label="Years of Trust" />
          <Stat icon={<ShieldCheck />} value="95%" label="Repeat Buyers" />
          <Stat icon={<Truck />} value="28+" label="States Covered" />
        </div>
      </section>

      <ResellerGrowth imageUrl={resellerSectionImage} />

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
