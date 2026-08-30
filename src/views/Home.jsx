/**
 * Home View
 * Purpose: Serves as Weave365's homepage, combining high-end luxury storytelling banners,
 * live handloom collection highlights, reseller program onboarding, daily deal counters,
 * and search engine optimized text content (Varanasi direct weaver heritage).
 */
import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, Award, ChevronLeft, ChevronRight, PackageCheck, Clock3, BadgePercent, ArrowDown, Globe, Gem, MapPin, Calendar, Clock } from 'lucide-react';
import { expandedProductCards, formatMoney, customerPrice } from '../storefrontShared.jsx';
import { SectionTitle } from '../components/SectionTitle.jsx';
import { StateMessage } from '../components/StateMessage.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { Newsletter } from '../components/Newsletter.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { WholesalePartnership } from '../components/WholesalePartnership.jsx';
import { ResellerProgram } from '../components/ResellerProgram.jsx';
import { OccasionShowcase } from '../components/OccasionShowcase.jsx';
import { PrivateLabelSection } from '../components/PrivateLabelSection.jsx';
import { storeConfig, seoCategoryMap, getCategorySlug, siteUrl } from '../config.js';
import { assetSrc } from '../utils/assetSrc.js';
import { sortByStockDateDesc } from '../utils/sortProducts.js';
import { usePageSeo } from '../hooks/usePageSeo.js';
import { AppLink } from '../components/AppLink.jsx';
import { OverlapHero } from '../components/OverlapHero.jsx';
import '../styles/blog.css';
import '../styles/heroPremium.css';

export const SHOW_OVERLAP_HERO = true;

export const homeCategoryNames = ['Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Under 999'];

const defaultHero = {
  image: 'https://assets.weave365.com/assets/banner/hero1.webp',
  mobileImage: 'https://assets.weave365.com/assets/banner/hero1m.webp',
  title: 'Beyond\nBeauty',
  subtitle: 'Bringing You the Elements of Style',
  buttonText: 'Read More',
  buttonLink: 'catalogue',
  button2Text: 'Request Catalog',
  button2Link: 'bulk-inquiry',
  rightText: "WHOLESALE\nSAREE\nCOLLECTION\n'26",
};

const defaultHeroFeatures = [
  {
    title: 'Wholesale Ready',
    text: 'Made For resellers, boutique, and exporters.',
  },
  {
    title: 'White Label',
    text: 'Share catalogues without our branding.',
  },
  {
    title: 'WhatsApp Sharing',
    text: 'Easily share catalogues with customers.',
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

function renderHeroSubtitle(value) {
  const lines = normalizeHeroText(value).split(/\r?\n|\|/);
  if (lines.length <= 1) {
    return normalizeHeroText(value);
  }
  return lines.map((line, index) => (
    <Fragment key={`${line}-${index}`}>
      {index === 0 ? <strong className="hero-subtitle-bold">{line}</strong> : <span className="hero-subtitle-normal">{line}</span>}
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

function getContrastColor(hexColor, fallback) {
  if (!hexColor) return fallback;
  const color = String(hexColor).trim().replace('#', '');
  if (color.length === 3 || color.length === 6) {
    const r = parseInt(color.length === 3 ? color[0] + color[0] : color.substring(0, 2), 16);
    const g = parseInt(color.length === 3 ? color[1] + color[1] : color.substring(2, 4), 16);
    const b = parseInt(color.length === 3 ? color[2] + color[2] : color.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 128 ? '#241912' : '#FFFFFF';
    }
  }
  return fallback;
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
  setVar('--hero-button1-hover-text-color', getContrastColor(hero?.button1Color, '#241912'));
  setVar('--hero-button2-color', hero?.button2Color);
  setVar('--hero-accent-color', hero?.accentColor || hero?.button1Color);
  setVar('--hero-right-text-color', hero?.rightTextColor);
  setVar('--hero-feature-svg-color', hero?.featureSvgColor);
  setVar('--hero-feature-heading-color', hero?.featureHeadingColor);
  setVar('--hero-feature-text-color', hero?.featureTextColor);
  setVar('--hero-image-position', hero?.imagePosition);
  setVar('--hero-overlay-color', hero?.overlayColor);
  setVar('--hero-overlay-opacity', hero?.overlayOpacity);
  setVar('--hero-scroll-color', hero?.scrollColor);

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

const scrollProductRail = (rowId, direction) => {
  const rail = document.getElementById(rowId);
  if (!rail) return;

  const card = rail.querySelector('.product-card, .blog-card');
  const styles = window.getComputedStyle(rail);
  const gap = parseFloat(styles.columnGap || styles.gap) || 0;
  const distance = card ? card.getBoundingClientRect().width + gap : rail.clientWidth;

  rail.scrollBy({ left: direction * distance, behavior: 'smooth' });
};

export function Home({
  products = [],
  status,
  error,
  heroSlides = [],
  fallbackHeroImage,
  navigate = () => {},
  setCategory,
  openAuth,
  addToCart,
  toggleFavorite,
  favoriteKeys,
  priceAccess,
  blogs = [],
}) {
  const [isMobile, setIsMobile] = useState(false);
  const handleLinkClick = (e, to, productId = null, shopName = null) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    navigate(to, productId, shopName);
  };
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dealCountdown, setDealCountdown] = useState(() => getDealCountdown());
  const dealRailRef = useRef(null);
  const [showNewHero, setShowNewHero] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);

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



  const desktopBanners = useMemo(() => heroSlides.filter(s => s.type === 'banner'), [heroSlides]);
  const mobileBanners = useMemo(() => heroSlides.filter(s => s.type === 'banner mobile'), [heroSlides]);

  const activeHeroData = useMemo(() => {
    const activeSlide = bannerSlides[currentSlide] || null;
    if (!activeSlide) return null;

    if (activeSlide.type === 'banner mobile') {
      const correspondingDesktop = desktopBanners[currentSlide] || desktopBanners[0] || null;
      if (correspondingDesktop) {
        return {
          ...correspondingDesktop,
          ...Object.fromEntries(
            Object.entries(activeSlide).filter(([_, v]) => v !== undefined && v !== null && v !== '')
          ),
          image: activeSlide.image || correspondingDesktop.image,
        };
      }
    }
    return activeSlide;
  }, [bannerSlides, currentSlide, desktopBanners]);

  const currentDesktopSlide = desktopBanners[currentSlide] || null;
  const currentMobileSlide = mobileBanners[currentSlide] || mobileBanners[0] || null;

  const heroImage = currentDesktopSlide?.image || defaultHero.image;
  const heroMobileImage = currentMobileSlide?.image || currentDesktopSlide?.image || defaultHero.mobileImage;

  const rawTitle = activeHeroData?.title;
  const heroTitle = (rawTitle && rawTitle.trim() !== '') ? rawTitle : defaultHero.title;

  const rawSubtitle = activeHeroData?.subtitle;
  const heroSubtitle = (rawSubtitle && rawSubtitle.trim() !== '') ? rawSubtitle : defaultHero.subtitle;

  const heroButtonText = activeHeroData?.buttonText || defaultHero.buttonText;
  const heroButtonLink = activeHeroData?.buttonLink || defaultHero.buttonLink;
  const heroButton2Text = activeHeroData?.button2Text || defaultHero.button2Text;
  const heroButton2Link = activeHeroData?.button2Link || defaultHero.button2Link;
  const heroRightText = activeHeroData?.rightText || defaultHero.rightText;
  const heroStyle = buildHeroStyle(activeHeroData);
  const heroFeatures = defaultHeroFeatures.map((feature, index) => {
    const idx = index + 1;
    const titleVal = activeHeroData?.[`feature${idx}Title`]?.trim();
    const descVal = activeHeroData?.[`feature${idx}Desc`]?.trim();

    if (titleVal || descVal) {
      return {
        title: titleVal || feature.title,
        text: descVal || feature.text,
      };
    }

    // Fallback to combined column feature1/2/3
    const oldVal = activeHeroData?.[`feature${idx}`];
    if (oldVal) {
      return parseHeroFeature(oldVal, feature);
    }

    return feature;
  });


  useEffect(() => {
    if (currentSlide >= bannerSlides.length && bannerSlides.length > 0) {
      setCurrentSlide(0);
    }
  }, [bannerSlides.length, currentSlide]);

  useEffect(() => {
    if (SHOW_OVERLAP_HERO) {
      document.documentElement.style.setProperty('--header-text-color', '#1a1a1a');
      document.documentElement.style.setProperty('--hero-logo-color', '#1a1a1a');
      document.documentElement.style.setProperty('--hero-nav-color', '#1a1a1a');
      return () => {
        document.documentElement.style.removeProperty('--header-text-color');
        document.documentElement.style.removeProperty('--hero-logo-color');
        document.documentElement.style.removeProperty('--hero-nav-color');
      };
    }

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
  usePageSeo({
    title: 'Banarasi Sarees and Suits for Wholesale & Export | Weave 365',
    description: 'Wholesale Banarasi sarees and suits for boutiques, retailers, sourcing partners and white label brands. Flexible MOQ. Global shipping & dropshipping support.',
    canonical: siteUrl
  });

  const bestsellers = useMemo(() => {
    const productsWithIndex = products.map((p, idx) => ({ ...p, _originalIndex: idx }));
    const filtered = productsWithIndex.filter((p) => p.isTopSeller && !p.isArchived);
    
    const sorted = sortByStockDateDesc(filtered);

    return sorted.slice(0, 8).map(p => ({
      product: p,
      image: p.images[0] || fallbackHeroImage,
      variant: p.variants[0]
    }));
  }, [products, fallbackHeroImage]);

  const arrivals = useMemo(() => {
    const productsWithIndex = products.map((p, idx) => ({ ...p, _originalIndex: idx }));
    let filtered = productsWithIndex.filter(p => p.isNew && !p.isArchived);
    if (filtered.length === 0) {
      filtered = productsWithIndex.filter(p => !p.isArchived);
    }
    
    const sorted = sortByStockDateDesc(filtered);

    return sorted.slice(0, 8).map(p => ({
      product: p,
      image: p.images[0] || fallbackHeroImage,
      variant: p.variants[0]
    }));
  }, [products, fallbackHeroImage]);

  const dealProducts = useMemo(() => {
    const discountedProducts = products
      .map((product) => {
        if (product.isArchived) return null;
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

  const resellerSectionImage = "https://assets.weave365.com/assets/banner/weaver-partner.jpg";
  const brandCollabSectionImage = "https://assets.weave365.com/assets/banner/brand-collab.jpg";
  const occasionSectionImage = "https://assets.weave365.com/assets/banner/endUserHome.webp";
  const privateLabelSectionImage = "https://assets.weave365.com/assets/banner/privateLabelCustomWeave.webp";

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
      {!SHOW_OVERLAP_HERO && (
        <h1 className="sr-only">Banarasi Sarees and Suits for Wholesale, Resellers, Private Labels and Retail</h1>
      )}
      {SHOW_OVERLAP_HERO ? (
        <OverlapHero navigate={navigate} />
      ) : (
        <section className="hero-transition-container">
        {/* Original Slide */}
        <div className={`hero-slide-pane pane-first ${!showNewHero ? 'active' : ''}`}>
          <section className="premium-hero" style={heroStyle}>
            {/* Full-bleed Background Picture */}
            <div className="premium-hero-bg-picture">
              <Image
                src={heroImage}
                alt={activeHeroData?.title || 'Wholesale Banarasi Sarees and Suits Weave 365'}
                fill
                priority
                className="premium-hero-bg-img desktop-hero-image"
                sizes="100vw"
                style={{ objectFit: 'cover' }}
              />
              <Image
                src={heroMobileImage}
                alt={activeHeroData?.title || 'Wholesale Banarasi Sarees and Suits Weave 365'}
                fill
                priority
                className="premium-hero-bg-img mobile-hero-image"
                sizes="100vw"
                style={{ objectFit: 'cover' }}
              />
            </div>

            {/* Dark gradient overlay for text readability */}
            <div className="premium-hero-overlay"></div>

            <div className="premium-hero-content">
              <div className="premium-hero-left">
                <div className="premium-hero-header-group">
                  <div className="premium-hero-title" aria-level="2" role="heading">

                    {renderHeroLines(heroTitle)}
                  </div>
                  <p className="premium-hero-subtitle">
                    <span className="hero-subtitle-desktop">{renderHeroSubtitle(heroSubtitle)}</span>
                    <span className="hero-subtitle-mobile">{renderHeroSubtitle(heroRightText)}</span>
                  </p>
                </div>

                <div className="premium-hero-actions">
                  <AppLink
                    to={heroButtonLink || defaultHero.buttonLink}
                    className="premium-btn-filled"
                    navigate={navigate}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <span>{heroButtonText}</span>
                  </AppLink>
                  {heroButton2Text && (
                    <AppLink
                      to={heroButton2Link || defaultHero.button2Link}
                      className="premium-btn-text"
                      navigate={navigate}
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span>{heroButton2Text}</span>
                    </AppLink>
                  )}
                </div>
              </div>

              {/* Middle Column: Left empty for background image layout */}
              <div className="premium-hero-middle"></div>


              {/* Right Column: Right-aligned text & features list */}
              <div className="premium-hero-right">
                <div className="premium-hero-right-container">
                  {heroRightText && (
                    <div className="premium-hero-right-text">
                      {renderHeroSubtitle(heroRightText)}
                    </div>
                  )}
                  <div className="premium-hero-features-list">
                    {heroFeatures.map((feature, index) => (
                      <div className="premium-hero-feature-item" key={`${feature.title}-${index}`}>
                        <h3 className="feature-item-title">{feature.title}</h3>
                        <p className="feature-item-desc">{renderHeroLines(feature.text)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <button type="button" 
              className="premium-hero-scroll-btn" 
              onClick={() => {
                const nextSection = document.querySelector('.deal-section') || document.querySelector('.category-section') || document.querySelector('.section');
                if (nextSection) {
                  nextSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
                }
              }}
              style={{ color: 'var(--hero-scroll-color, #E6D0C3)' }}
              aria-label="Scroll to Explore"
            >
              <span>Scroll to Explore</span>
              <ArrowDown size={14} />
            </button>
          </section>
        </div>

        {bannerSlides.length > 1 && (
          <>
            <button
              type="button"
              className="hero-nav-arrow left-arrow"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              className="hero-nav-arrow right-arrow"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)}
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            <div className="hero-slide-indicators">
              {bannerSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`hero-indicator-dot ${currentSlide === idx ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
      )}

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
                <AppLink to="product" productId={product.id} className="deal-image" navigate={navigate}>
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
                </AppLink>
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
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section category-section">
        <SectionTitle title="Shop By Category" align="left" />
        <div className="category-grid">
          {homeCategoryNames.map((name, index) => {
            const slug = getCategorySlug(name);
            const targetHref = `/${slug}`;

            return (
              <AppLink
                key={name}
                to={slug}
                href={targetHref}
                className="category-card"
                navigate={navigate}
                onClick={() => {
                  if (setCategory) setCategory(name);
                }}
                style={{ textDecoration: 'none' }}
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
              </AppLink>
            );
          })}
        </div>
        <AppLink to="catalogue" className="center-button" navigate={navigate} style={{ textDecoration: 'none' }}>
          View All Categories
        </AppLink>
      </section>

      {bestsellers.length > 0 && (
        <section className="section home-product-section bestsellers-section">
          <div className="section-heading-row">
            <SectionTitle title="Best Sellers" align="left" />
            <AppLink to="catalogue" className="text-button" navigate={navigate} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowRight size={17} />
            </AppLink>
          </div>
          <StateMessage status={status} error={error} />
          <div className="scroll-wrapper">
            <button type="button"
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

            <button type="button"
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
          <AppLink to="catalogue" className="text-button" navigate={navigate} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            View All <ArrowRight size={17} />
          </AppLink>
        </div>
        <StateMessage status={status} error={error} />
        <div className="scroll-wrapper">
          <button type="button"
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

          <button type="button"
            className="scroll-arrow right"
            onClick={() => scrollProductRail('new-arrivals-row', 1)}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      <WholesalePartnership imageUrl={resellerSectionImage} navigate={navigate} />

      <ResellerProgram imageUrl={brandCollabSectionImage} navigate={navigate} />

      <OccasionShowcase imageUrl={occasionSectionImage} navigate={navigate} />

      <PrivateLabelSection imageUrl={privateLabelSectionImage} navigate={navigate} />

      {/* Weave 365 Insights Section */}
      <section className="home-blog-section">
        <div className="home-blog-header">
          <div className="home-blog-header-left">
            <h2>Insights from Banaras Looms</h2>
          </div>
          <div className="home-blog-header-right">
            <AppLink
              to="blog"
              className="blog-filter-btn active"
              navigate={navigate}
              style={{ padding: '0.75rem 2rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Read All Insights
            </AppLink>
          </div>
        </div>

        <div className="scroll-wrapper blog-scroll-wrapper">
          <button type="button"
            className="scroll-arrow left blog-scroll-arrow"
            onClick={() => scrollProductRail('home-blog-row', -1)}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="home-blog-grid" id="home-blog-row">
            {isMounted && blogs.slice(0, 4).map((post) => (
              <AppLink
                key={post.slug}
                to="blog"
                productId={post.slug}
                className="blog-card"
                navigate={navigate}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
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
                  <h3 style={{ fontSize: 'var(--h5-size)', fontWeight: 600, minHeight: '3.4rem' }}>{post.title}</h3>
                  <p style={{ fontSize: 'var(--body-size)', fontWeight: 400 }}>{post.intro}</p>
                  <span
                    className="read-more-link"
                    style={{ marginTop: 'auto', fontSize: 'var(--small-size)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Read Guide <ArrowRight size={14} />
                  </span>
                </div>
              </AppLink>
            ))}
          </div>

          <button type="button"
            className="scroll-arrow right blog-scroll-arrow"
            onClick={() => scrollProductRail('home-blog-row', 1)}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      <section className="seo-compact-section">
        <div className={`seo-compact-container ${seoExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="seo-compact-left">
            <h2>Trusted Banarasi Saree Supplier</h2>
            <p>Weave 365 is India's most reliable platform for sourcing premium Banarasi collections, supporting direct <AppLink to="bulk-inquiry" navigate={navigate} className="seo-inline-link">bulk buyers</AppLink>, sourcing partners, and white label brands. Our portal is designed specifically to supply <AppLink to="sarees" navigate={navigate} className="seo-inline-link">wholesale Banarasi sarees</AppLink> and suits to boutiques, retailers, and showrooms globally with a flexible MOQ, global shipping, and <AppLink to="dropshipping" navigate={navigate} className="seo-inline-link">reliable dropshipping support</AppLink>.</p>
            <button
              type="button"
              className="seo-expand-trigger"
              onClick={() => setSeoExpanded(!seoExpanded)}
              aria-expanded={seoExpanded}
            >
              {seoExpanded ? 'Show Less' : 'Read Wholesale Sourcing Guide'}
              <ArrowDown size={14} style={{ transform: seoExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </button>
          </div>

          <div className="seo-compact-right">
            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <Gem size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Explore Wholesale Saree Collections</h2>
              </div>
              <p>Discover our extensive <a href="/catalogue" onClick={(e) => handleLinkClick(e, 'catalogue')} className="seo-inline-link">live catalogue</a> featuring <a href="/katan-silk-sarees" onClick={(e) => handleLinkClick(e, 'katan-silk-sarees')} className="seo-inline-link">Pure Katan Silk</a>, <a href="/organza-banarasi-sarees" onClick={(e) => handleLinkClick(e, 'organza-banarasi-sarees')} className="seo-inline-link">Organza</a>, Georgette, and intricately woven tissue sarees. From traditional bridal wear to contemporary designs, our <a href="/catalogue" onClick={(e) => handleLinkClick(e, 'catalogue')} className="seo-inline-link">wholesale banarasi sarees and suits</a> are crafted to elevate your retail offerings.</p>
            </div>

            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <Award size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Why Retailers Choose Weave 365</h2>
              </div>
              <p>Our platform ensures seamless <a href="/bulk-inquiry" onClick={(e) => handleLinkClick(e, 'bulk-inquiry')} className="seo-inline-link">bulk purchasing</a> with transparent pricing, guaranteed quality checks, and real-time inventory updates. We bridge the gap between traditional weaving techniques and modern commerce.</p>
            </div>

            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <MapPin size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Banarasi Sarees Direct from Varanasi</h2>
              </div>
              <p>By partnering directly with <a href="/weaver-onboarding" onClick={(e) => handleLinkClick(e, 'weaver-onboarding')} className="seo-inline-link">master artisans and weavers in Varanasi</a>, we bring the loom directly to your storefront. This direct-to-retail model ensures you receive authentic Banarasi craftsmanship at the most competitive wholesale prices.</p>
            </div>

            <div className="seo-compact-card">
              <div className="seo-card-title-row">
                <Globe size={30} strokeWidth={1.5} className="seo-card-icon" />
                <h2>Flexible MOQ for Wholesale, Export and Dropshipping</h2>
              </div>
              <p>We understand that every business scales differently. That's why we offer flexible Minimum Order Quantities (MOQ), supporting small boutique <a href="/dropshipping" onClick={(e) => handleLinkClick(e, 'dropshipping')} className="seo-inline-link">saree &amp; suit dropshipping</a>, large-scale domestic retail, and international export orders worldwide. Learn how to launch your business with our expert <a href="/blog/how-to-start-saree-reselling-business" onClick={(e) => handleLinkClick(e, 'blog', 'how-to-start-saree-reselling-business')} className="seo-inline-link">saree reselling business blueprint</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <Newsletter navigate={navigate} />
    </>
  );
}
