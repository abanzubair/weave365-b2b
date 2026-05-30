/**
 * Home View
 * Purpose: Serves as Weave365's homepage, combining high-end luxury storytelling banners,
 * live handloom collection highlights, reseller program onboarding, daily deal counters,
 * and search engine optimized text content (Varanasi direct weaver heritage).
 */
import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import { ArrowRight, User, Users, Award, ChevronLeft, ChevronRight, ShieldCheck, PackageCheck, Clock3, BadgePercent, ShoppingBag, Truck, LayoutGrid, ArrowDown, Grid, Tag, Globe, Gem, MapPin, Layers } from 'lucide-react';
import { fallbackProductImage, expandedProductCards, formatMoney, customerPrice } from '../storefrontShared.jsx';
import { SectionTitle } from '../components/SectionTitle.jsx';
import { StateMessage } from '../components/StateMessage.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { Newsletter } from '../components/Newsletter.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { BenefitStrip, Stat } from '../components/Strips.jsx';
import { ResellerGrowth } from '../components/ResellerGrowth.jsx';
import { BrandCollaboration } from '../components/BrandCollaboration.jsx';
import resellerImage from '../../assets/reseller_premium_catalog_display.webp';
import brandCollabImage from '../../assets/brand_collaboration.webp';
import weaverImage from '../../assets/artisan_at_loom_premium.webp';
import { storeConfig } from '../config.js';
import { assetSrc } from '../utils/assetSrc.js';
import { Calendar, Clock } from 'lucide-react';
import { WhatsappIcon } from '../components/WhatsappIcon.jsx';

export const homeCategoryNames = ['Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Accessories'];

const defaultHero = {
  image: 'https://images.weave365.in/assets/banner/hero1.webp',
  mobileImage: 'https://images.weave365.in/assets/banner/hero1m.webp',
  title: 'Timeless Weaves\nEndless Possibilities',
  subtitle: 'Banarasi Sarees & Suits for your business,\ncrafted for every story.',
  buttonText: 'Explore Collections',
  buttonLink: 'wholesale-catalogue',
  button2Text: 'Request Catalog',
  button2Link: 'bulk-inquiry',
  rightText: "B2B\nSAREE\nCOLLECTION\n'26",
};

const defaultHeroFeatures = [
  {
    title: 'White Label',
    text: 'Share catalogues without\nour branding.',
  },
  {
    title: 'Wholesale Ready',
    text: 'Made for resellers, boutiques,\nand exporters.',
  },
  {
    title: 'WhatsApp Sharing',
    text: 'Easily share catalogues\nwith customers.',
  },
];

function normalizeHeroText(value) {
  return String(value || '').replace(/\\n/g, '\n').trim();
}

function renderHeroLines(value) {
  return normalizeHeroText(value).split(/\r?\n|\|/).map((line, index, lines) => (
    <Fragment key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

function parseHeroFeature(value, fallback) {
  const text = normalizeHeroText(value);
  if (!text) return fallback;

  const separator = text.includes('|') ? '|' : text.includes(':') ? ':' : '';
  if (!separator) {
    return { ...fallback, title: text };
  }

  const [title, ...rest] = text.split(separator);
  return {
    title: title.trim() || fallback.title,
    text: rest.join(separator).trim() || fallback.text,
  };
}

function buildHeroStyle(hero) {
  const style = {};
  const setVar = (name, value) => {
    const normalized = String(value || '').trim();
    if (normalized) style[name] = normalized;
  };

  setVar('--hero-title-color', hero?.headingColor);
  setVar('--hero-subtitle-color', hero?.subheadingColor);
  setVar('--hero-button1-color', hero?.button1Color);
  setVar('--hero-button2-color', hero?.button2Color);
  setVar('--hero-accent-color', hero?.accentColor || hero?.button1Color);
  setVar('--hero-right-text-color', hero?.rightTextColor);
  setVar('--hero-feature-svg-color', hero?.featureSvgColor);
  setVar('--hero-feature-heading-color', hero?.featureHeadingColor);
  setVar('--hero-feature-text-color', hero?.featureTextColor);
  setVar('--hero-image-position', hero?.imagePosition);
  setVar('--hero-overlay-color', hero?.overlayColor);
  setVar('--hero-overlay-opacity', hero?.overlayOpacity);

  return style;
}

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
  blogs = [],
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dealCountdown, setDealCountdown] = useState(() => getDealCountdown());
  const dealRailRef = useRef(null);
  const [showNewHero, setShowNewHero] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  /*
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
  */

  const activeHeroData = bannerSlides[currentSlide] || null;
  const heroImage = activeHeroData?.image || defaultHero.image;
  const heroMobileImage = isMobile ? heroImage : defaultHero.mobileImage;
  const heroTitle = activeHeroData?.title || defaultHero.title;
  const heroSubtitle = activeHeroData?.subtitle || defaultHero.subtitle;
  const heroButtonText = activeHeroData?.buttonText || defaultHero.buttonText;
  const heroButtonLink = activeHeroData?.buttonLink || defaultHero.buttonLink;
  const heroButton2Text = activeHeroData?.button2Text || defaultHero.button2Text;
  const heroButton2Link = activeHeroData?.button2Link || defaultHero.button2Link;
  const heroRightText = activeHeroData?.rightText || defaultHero.rightText;
  const heroStyle = buildHeroStyle(activeHeroData);
  const heroFeatures = defaultHeroFeatures.map((feature, index) => (
    parseHeroFeature(activeHeroData?.[`feature${index + 1}`], feature)
  ));

  useEffect(() => {
    if (currentSlide >= bannerSlides.length && bannerSlides.length > 0) {
      setCurrentSlide(0);
    }
  }, [bannerSlides.length, currentSlide]);

  useEffect(() => {
    // Premium hero is always dark → force white header text
    document.documentElement.style.setProperty('--header-text-color', activeHeroData?.headerColor || 'white');
    if (activeHeroData?.logoColor) {
      document.documentElement.style.setProperty('--hero-logo-color', activeHeroData.logoColor);
    }
    if (activeHeroData?.navigationColor) {
      document.documentElement.style.setProperty('--hero-nav-color', activeHeroData.navigationColor);
    }
    document.documentElement.classList.add('header-over-dark');
    return () => {
      document.documentElement.style.removeProperty('--header-text-color');
      document.documentElement.style.removeProperty('--hero-logo-color');
      document.documentElement.style.removeProperty('--hero-nav-color');
      document.documentElement.classList.remove('header-over-dark');
    };
  }, [activeHeroData?.headerColor, activeHeroData?.logoColor, activeHeroData?.navigationColor]);

  // Dynamic Browser Tab Title, Meta Description & Canonical Link SEO injection for Home page
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalTitle = document.title;
    document.title = 'Banarasi Sarees and Suits for Wholesale & Export | Weave 365';

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    const newDesc = 'Wholesale Banarasi sarees and suits for boutiques, retailers, sourcing partners and white label brands. Flexible MOQ. Global shipping & dropshipping support.';

    if (metaDesc) {
      metaDesc.setAttribute('content', newDesc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = newDesc;
      document.head.appendChild(metaDesc);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonicalLink ? canonicalLink.getAttribute('href') : '';
    const newCanonical = 'https://www.weave365.in';

    if (canonicalLink) {
      canonicalLink.setAttribute('href', newCanonical);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = newCanonical;
      document.head.appendChild(canonicalLink);
    }

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
      if (canonicalLink) {
        if (originalCanonical) {
          canonicalLink.setAttribute('href', originalCanonical);
        } else {
          canonicalLink.remove();
        }
      }
    };
  }, []);

  const bestsellers = useMemo(() => {
    const productsWithIndex = products.map((p, idx) => ({ ...p, _originalIndex: idx }));
    const filtered = productsWithIndex.filter((p) => p.isTopSeller);
    
    filtered.sort((a, b) => {
      const dateA = a.stockInDate ? new Date(a.stockInDate).getTime() : 0;
      const dateB = b.stockInDate ? new Date(b.stockInDate).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return b._originalIndex - a._originalIndex;
    });

    return filtered.slice(0, 8).map(p => ({
      product: p,
      image: p.images[0] || fallbackHeroImage,
      variant: p.variants[0]
    }));
  }, [products, fallbackHeroImage]);

  const arrivals = useMemo(() => {
    const productsWithIndex = products.map((p, idx) => ({ ...p, _originalIndex: idx }));
    let filtered = productsWithIndex.filter(p => p.isNew);
    if (filtered.length === 0) {
      filtered = [...productsWithIndex];
    }
    
    filtered.sort((a, b) => {
      const dateA = a.stockInDate ? new Date(a.stockInDate).getTime() : 0;
      const dateB = b.stockInDate ? new Date(b.stockInDate).getTime() : 0;
      if (dateA !== dateB) {
        return dateB - dateA;
      }
      return b._originalIndex - a._originalIndex;
    });

    return filtered.slice(0, 8).map(p => ({
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

    const card = rail.querySelector('.product-card, .blog-card');
    const styles = window.getComputedStyle(rail);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    const distance = card ? card.getBoundingClientRect().width + gap : rail.clientWidth;

    rail.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  const openHeroLink = (link, fallbackRoute) => {
    const target = String(link || fallbackRoute || '').trim();
    if (!target) return;

    if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(target)) {
      window.location.href = target;
      return;
    }

    navigate(target.replace(/^\/+/, '') || fallbackRoute);
  };

  return (
    <>
      <section className="hero-transition-container">
        <h1 className="sr-only">Wholesale Banarasi Sarees for Retailers & Resellers</h1>
        {/* Original Slide */}
        <div className={`hero-slide-pane pane-first ${!showNewHero ? 'active' : ''}`}>
          <section className="premium-hero" style={heroStyle}>
            <picture className="premium-hero-bg-picture">
              <source media="(max-width: 820px)" srcSet={heroMobileImage} />
              <img
                src={heroImage}
                alt={activeHeroData?.title || 'Wholesale Banarasi Sarees and Suits Weave 365'}
                className="premium-hero-bg-img"
                fetchPriority="high"
                decoding="async"
                width={1920}
                height={1080}
              />
            </picture>
            <div className="premium-hero-overlay"></div>

            <div className="premium-hero-content">
              <div className="premium-hero-main">
                <div className="premium-hero-title" aria-level="2" role="heading">
                  {renderHeroLines(heroTitle)}
                </div>

                <p className="premium-hero-subtitle">
                  {renderHeroLines(heroSubtitle)}
                </p>

                <div className="premium-hero-actions">
                  <button
                    className="premium-btn-filled"
                    onClick={() => openHeroLink(heroButtonLink, defaultHero.buttonLink)}
                  >
                    {heroButtonText}
                  </button>
                  <button
                    className="premium-btn-text"
                    onClick={() => openHeroLink(heroButton2Link, defaultHero.button2Link)}
                  >
                    {heroButton2Text} <ArrowRight size={18} />
                  </button>
                </div>

                <div className="premium-hero-features">
                  {heroFeatures.map((feature, index) => (
                    <div className="premium-feature" key={`${feature.title}-${index}`}>
                      {index === 0 ? <Layers size={24} strokeWidth={1.5} /> : null}
                      {index === 1 ? <Users size={24} strokeWidth={1.5} /> : null}
                      {index === 2 ? <WhatsappIcon size={24} /> : null}
                      <div className="premium-feature-text">
                        <strong>{feature.title}</strong>
                        <span>{renderHeroLines(feature.text)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-hero-sidebar">
                <div className="premium-hero-collection-info">
                  <span>{renderHeroLines(heroRightText)}</span>
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

        {/* New Editorial Brand Collaboration Hero Slide (Disabled)
        <div className={`hero-slide-pane pane-second ${showNewHero ? 'active' : ''}`}>
          <section className="collab-hero-section">
            {/* Left Column: Image and side tagline * /}
            <div className="collab-hero-left">
              <div className="collab-hero-photo-wrap">
                <img
                  src={assetSrc(newBanner2)}
                  alt="Brand Collaboration Banner"
                  className="collab-hero-photo"
                  width={960}
                  height={1080}
                  loading="lazy"
                  decoding="async"
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

            {/* Right Column: Content segment * /}
            <div className="collab-hero-right">
              <div className="collab-right-content">
                <span className="collab-kicker">COLLABORATE WITH US</span>

                <div className="collab-title-seal-row">
                  <div className="collab-title" aria-level="2" role="heading">
                    <span className="collab-title-line-1">Together</span><br />
                    <span className="collab-title-line-2">in Every</span><br />
                    <span className="collab-title-line-3">Weave</span>
                  </div>

                  {/* Elegant rotating gold seal * /}
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
                    {/* Symmetrical flower icon at the center sits outside wrapper to remain static * /}
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
        */}
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
                    width={360}
                    height={480}
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
                navigate('wholesale-catalogue');
              }}
            >
              <img
                src={categoryImages[name.toLowerCase()] || categoryPreviewImages[index % categoryPreviewImages.length]}
                alt={name}
                loading="lazy"
                decoding="async"
                width={300}
                height={300}
                onError={(e) => { e.target.style.opacity = '0'; }}
              />
              <span>{name}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
        <button className="center-button" onClick={() => navigate('wholesale-catalogue')}>
          View All Categories
        </button>
      </section>

      {bestsellers.length > 0 && (
        <section className="section home-product-section bestsellers-section">
          <div className="section-heading-row">
            <SectionTitle title="Best Sellers" align="left" />
            <button className="text-button" onClick={() => navigate('wholesale-catalogue')}>
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
          <button className="text-button" onClick={() => navigate('wholesale-catalogue')}>
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
          <button className="primary-button compact" onClick={() => navigate('about')}>
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

      {/* Weave 365 Insights Section */}
      <section className="home-blog-section">
        <div className="home-blog-header">
          <div className="home-blog-header-left">
            <span>Corporate Intelligence & Craft Heritage</span>
            <h2>Insights from Banaras Looms</h2>
          </div>
          <div className="home-blog-header-right">
            <button
              className="blog-filter-btn active"
              onClick={() => navigate('blog')}
              style={{ padding: '0.75rem 2rem' }}
            >
              Read All Insights
            </button>
          </div>
        </div>

        <div className="scroll-wrapper blog-scroll-wrapper">
          <button
            className="scroll-arrow left blog-scroll-arrow"
            onClick={() => scrollProductRail('home-blog-row', -1)}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="home-blog-grid" id="home-blog-row">
            {isMounted && blogs.slice(0, 4).map((post) => (
              <article
                key={post.slug}
                className="blog-card"
                onClick={() => navigate('blog', post.slug)}
              >
                <div className="card-img-wrapper">
                  <img src={post.image} alt={post.title} loading="lazy" decoding="async" width={400} height={250} />
                  <span className="card-category-badge">{post.category}</span>
                </div>
                <div className="card-info-pane">
                  <div className="post-meta-strip">
                    <span className="post-meta-item">
                      <Calendar size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} /> {post.date}
                    </span>
                    <span className="meta-divider"></span>
                    <span className="post-meta-item">
                      <Clock size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} /> {post.readTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', minHeight: '3.4rem' }}>{post.title}</h3>
                  <p style={{ fontSize: '0.85rem' }}>{post.intro}</p>
                  <button
                    className="read-more-link"
                    style={{ marginTop: 'auto', fontSize: '0.8rem' }}
                  >
                    Read Guide <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <button
            className="scroll-arrow right blog-scroll-arrow"
            onClick={() => scrollProductRail('home-blog-row', 1)}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      <section className="seo-compact-section">
        <div className="seo-compact-container">
          <div className="seo-compact-left">
            <span className="seo-compact-kicker">TRUSTED PARTNERSHIP</span>
            <h2>Trusted B2B Banarasi Saree Supplier</h2>
            <p>Weave 365 is India's most reliable platform for sourcing premium Banarasi collections, supporting direct <a href="/bulk-inquiry" onClick={(e) => { e.preventDefault(); navigate('bulk-inquiry'); }} className="seo-inline-link">bulk buyers</a>, sourcing partners, and white label brands. Our B2B portal is designed specifically to supply <a href="/wholesale-banarasi-sarees" onClick={(e) => { e.preventDefault(); navigate('wholesale-banarasi-sarees'); }} className="seo-inline-link">wholesale Banarasi sarees</a> and suits to boutiques, retailers, and showrooms globally with a flexible MOQ, global shipping, and reliable dropshipping support.</p>
          </div>

          <div className="seo-compact-right">
            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <Gem size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Explore Wholesale Saree Collections</h2>
              </div>
              <p>Discover our extensive <a href="/wholesale-catalogue" onClick={(e) => { e.preventDefault(); navigate('wholesale-catalogue'); }} className="seo-inline-link">live catalogue</a> featuring <a href="/katan-silk-sarees" onClick={(e) => { e.preventDefault(); navigate('katan-silk-sarees'); }} className="seo-inline-link">Pure Katan Silk</a>, <a href="/organza-banarasi-sarees" onClick={(e) => { e.preventDefault(); navigate('organza-banarasi-sarees'); }} className="seo-inline-link">Organza</a>, Georgette, and intricately woven tissue sarees. From traditional bridal wear to contemporary designs, our <a href="/wholesale-catalogue" onClick={(e) => { e.preventDefault(); navigate('wholesale-catalogue'); }} className="seo-inline-link">wholesale banarasi sarees and suits</a> are crafted to elevate your retail offerings.</p>
            </div>

            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <Award size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Why Retailers Choose Weave 365</h2>
              </div>
              <p>Our platform ensures seamless <a href="/bulk-inquiry" onClick={(e) => { e.preventDefault(); navigate('bulk-inquiry'); }} className="seo-inline-link">bulk purchasing</a> with transparent pricing, guaranteed quality checks, and real-time inventory updates. We bridge the gap between traditional weaving techniques and modern B2B commerce.</p>
            </div>

            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <MapPin size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Banarasi Sarees Direct from Varanasi</h2>
              </div>
              <p>By partnering directly with <a href="/vendor-partnership" onClick={(e) => { e.preventDefault(); navigate('vendor-partnership'); }} className="seo-inline-link">master artisans and weavers in Varanasi</a>, we bring the loom directly to your storefront. This direct-to-retail model ensures you receive authentic Banarasi craftsmanship at the most competitive wholesale prices.</p>
            </div>

            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <Globe size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Flexible MOQ for Wholesale, Export and Dropshipping</h2>
              </div>
              <p>We understand that every business scales differently. That's why we offer flexible Minimum Order Quantities (MOQ), supporting small boutique dropshipping, large-scale domestic retail, and international export orders worldwide. Learn how to launch your business with our expert <a href="/blog/how-to-start-saree-reselling-business" onClick={(e) => { e.preventDefault(); navigate('blog', 'how-to-start-saree-reselling-business'); }} className="seo-inline-link">saree reselling business blueprint</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
