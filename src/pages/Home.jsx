import { useState, useMemo, useEffect, Fragment } from 'react';
import { ArrowRight, User, Heart, Award, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, PackageCheck } from 'lucide-react';
import { fallbackProductImage, SectionTitle, StateMessage, ProductCard, expandedProductCards, Newsletter } from '../storefrontShared.jsx';
import { FeatureStrip, BenefitStrip, Stat } from '../components/Strips.jsx';
import { storeConfig } from '../config.js';

export const homeCategoryNames = ['Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Accessories'];

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
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerSlides = useMemo(() => heroSlides.filter(s => s.type === 'banner'), [heroSlides]);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [bannerSlides.length]);

  const fixedHeroData = bannerSlides[0] || null;

  const arrivals = useMemo(() => 
    products.slice(0, 8).map(p => ({
      product: p,
      image: p.images[0] || fallbackHeroImage,
      variant: p.variants[0]
    })), 
    [products, fallbackHeroImage]
  );

  const categoryImages = useMemo(() => {
    const map = {};
    heroSlides.forEach(slide => {
      if (slide.type !== 'banner') {
        map[slide.type] = slide.image;
      }
    });
    return map;
  }, [heroSlides]);

  const categoryPreviewImages = useMemo(() => {
    const productImages = expandedProductCards(products).map((item) => item.image).filter(Boolean);
    return productImages.length ? productImages : [fallbackHeroImage];
  }, [fallbackHeroImage, products]);

  return (
    <>
      <section className="hero">
        {/* Static Copy Overlay */}
        <div className="hero-copy-wrapper">
          <div className="hero-copy">
            <h1>
              {fixedHeroData?.title ? (
                (() => {
                  const lines = fixedHeroData.title.split('|').map(l => l.trim()).filter(Boolean);
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
                              {isFirst || isLast ? <span>{word}</span> : word}
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
            <p>{fixedHeroData?.subtitle || 'Your trusted partner for quality sarees in bulk at the best prices.'}</p>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => fixedHeroData?.buttonLink ? (fixedHeroData.buttonLink.startsWith('http') ? window.open(fixedHeroData.buttonLink, '_blank') : navigate(fixedHeroData.buttonLink)) : navigate('catalog')}>
                {fixedHeroData?.buttonText || 'Shop Collection'} <ArrowRight size={18} />
              </button>
              <button className="secondary-button" onClick={openAuth}>
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

      <section id="why" className="why-band">
        <div>
          <SectionTitle title="Why Choose Us?" align="left" />
          <p>We understand your business and provide the best quality sarees with unbeatable wholesale prices to help you grow more.</p>
          <button className="primary-button compact" onClick={() => navigate('catalog')}>
            Know More
          </button>
        </div>
        <div className="stats-panel">
          <Stat icon={<User />} value="1000+" label="Unique Designs" />
          <Stat icon={<Heart />} value="500+" label="Happy Customers" />
          <Stat icon={<Award />} value="10+" label="Years of Trust" />
          <Stat icon={<CheckCircle2 />} value="100%" label="Quality Assured" />
        </div>
      </section>

      <section className="section">
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
            onClick={() => {
              const el = document.getElementById('new-arrivals-row');
              el.scrollBy({ left: -500, behavior: 'smooth' });
            }}
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
            onClick={() => {
              const el = document.getElementById('new-arrivals-row');
              el.scrollBy({ left: 500, behavior: 'smooth' });
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      <BenefitStrip />

      <section className="reseller-band">
        <div>
          <h2>Built for Business. Made for Resellers.</h2>
          <p>Join thousands of retailers who trust {storeConfig.name} wholesale for premium quality sarees.</p>
          <button className="gold-button" onClick={openAuth}>
            Register Now <ArrowRight size={17} />
          </button>
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
      </section>

      <Newsletter />
    </>
  );
}
