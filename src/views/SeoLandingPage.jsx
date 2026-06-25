/**
 * SeoLandingPage View
 * Purpose: Renders search-optimized B2B landing pages for specific Banarasi saree collections (e.g. organza, katan silk).
 * Leverages crawlable breadcrumb & FAQ JSON-LD schemas, structured header hierarchies, direct weaver narratives,
 * and high-end aesthetic designs to drive B2B traffic and boutique reseller conversions.
 */
import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, BookOpen, HelpCircle, ArrowRight, Award } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.jsx';
import { StateMessage } from '../components/StateMessage.jsx';
import { seoLandingPages } from '../data/seoLandingPages.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { siteUrl } from '../config.js';
import EmptyCategorySourcing from '../components/EmptyCategorySourcing.jsx';

const getCollectionTagline = (itemSlug) => {
  switch (itemSlug) {
    case 'wholesale-banarasi-sarees':
      return 'Varanasi Direct Weaver Heritage';
    case 'katan-silk-sarees':
      return 'Intricate Twisted Pure Silk weaves';
    case 'organza-banarasi-sarees':
      return 'Translucent Sheer Modern Elegance';
    case 'bridal-banarasi-sarees':
      return 'Grand Wedding Jaals & Brocades';
    case 'meenakari-sarees':
      return 'Exquisite Multi-colored Enamelled Inlays';
    case 'soft-silk-sarees':
      return 'Supple Lightweight Versatile Drape';
    case 'wholesale-saree-supplier-india':
      return 'Global Export & Bulk Direct Distribution';
    default:
      return 'Handcrafted Banarasi Excellence';
  }
};

export default function SeoLandingPage({
  slug,
  products = [],
  status = 'ready',
  error = '',
  navigate,
  addToCart,
  toggleFavorite,
  favoriteKeys = new Set(),
  priceAccess,
  openAuth,
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const [visibleCount, setVisibleCount] = useState(16);

  const pageData = useMemo(() => {
    return seoLandingPages[slug] || null;
  }, [slug]);

  // Filter products dynamically based on matching collection criteria
  const filteredProducts = useMemo(() => {
    if (!pageData) return [];
    
    return products.filter((product) => {
      if (product.isArchived) return false;
      
      const currentSlug = pageData.slug;
      
      if (currentSlug === 'wholesale-banarasi-sarees') {
        return product.category === 'Saree';
      }
      if (currentSlug === 'katan-silk-sarees') {
        return product.fabric === 'Katan Silk';
      }
      if (currentSlug === 'organza-banarasi-sarees') {
        return product.fabric === 'Organza';
      }
      if (currentSlug === 'bridal-banarasi-sarees') {
        const text = [product.title, product.work, product.category, product.fabric]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return (
          product.fabric === 'Katan Silk' &&
          (text.includes('bridal') || text.includes('zari') || text.includes('gold') || text.includes('wedding') || text.includes('heavy'))
        );
      }
      if (currentSlug === 'meenakari-sarees') {
        const text = [product.title, product.work, product.fabric]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes('meena') || text.includes('meenakari');
      }
      if (currentSlug === 'soft-silk-sarees') {
        const text = (product.fabric || '').toLowerCase();
        return text.includes('soft') || text.includes('blend') || text.includes('art');
      }
      if (currentSlug === 'wholesale-saree-supplier-india') {
        return product.category === 'Saree' || product.isTopSeller;
      }
      return true;
    });
  }, [products, pageData]);

  const collectionTextBadge = useMemo(() => {
    if (!pageData) return 'SOURCE';
    const currentSlug = pageData.slug;
    if (currentSlug === 'wholesale-banarasi-sarees') return 'HERITAGE';
    if (currentSlug === 'katan-silk-sarees') return 'KATAN';
    if (currentSlug === 'organza-banarasi-sarees') return 'ORGANZA';
    if (currentSlug === 'bridal-banarasi-sarees') return 'BRIDAL';
    if (currentSlug === 'meenakari-sarees') return 'MEENA';
    if (currentSlug === 'soft-silk-sarees') return 'SOFT';
    if (currentSlug === 'wholesale-saree-supplier-india') return 'INDIA';
    return 'SOURCE';
  }, [pageData]);

  // Dynamic Browser Tab Title, Meta Description & Canonical Link SEO injection
  useEffect(() => {
    if (!pageData || typeof window === 'undefined') return;

    // Update document title tag
    const originalTitle = document.title;
    document.title = pageData.metaTitle || `${pageData.h1} | Weave 365`;

    // Update meta description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    const newDesc = pageData.metaDescription || pageData.introText || '';
    
    if (metaDesc) {
      metaDesc.setAttribute('content', newDesc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = newDesc;
      document.head.appendChild(metaDesc);
    }

    // Update or create Canonical Link tag
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonicalLink ? canonicalLink.getAttribute('href') : '';
    const newCanonical = `${siteUrl}/${pageData.slug}`;

    if (canonicalLink) {
      canonicalLink.setAttribute('href', newCanonical);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = newCanonical;
      document.head.appendChild(canonicalLink);
    }

    // Clean up to avoid leaking custom metadata to other pages on routing
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
  }, [pageData]);

  if (!pageData) {
    return (
      <div className="section" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <StateMessage status="error" error="Collection page not found." />
      </div>
    );
  }

  // Generate dynamic JSON-LD Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": pageData.h1,
        "item": `${siteUrl}/${pageData.slug}`
      }
    ]
  };

  // Generate dynamic JSON-LD FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": pageData.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const breadcrumbItems = [
    { name: 'Home', url: '/', route: 'home' },
    { name: pageData.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }
  ];

  return (
    <article className="seo-landing-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />

      {/* Premium UI/UX Pro Max Hero Header */}
      <header className="seo-landing-hero">
        <div className="seo-hero-header-wrap">
          <span className="seo-subtitle">{pageData.introTitle}</span>
          <h1>{pageData.h1}</h1>
          <div className="seo-kicker-line"></div>
        </div>

        {/* Elegant Rotating Gold Seal SVG */}
        <div className="seo-seal-container" aria-hidden="true">
          <div className="seo-rotating-seal-wrap">
            <svg viewBox="0 0 100 100" className="seo-rotating-seal">
              <path d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" id="sealCirclePath" fill="none" />
              <text fill="#c69e6a" fontSize="6.7" fontFamily="var(--font-hero-body)" letterSpacing="2.6" fontWeight="700">
                <textPath href="#sealCirclePath" startOffset="0%">
                  AUTHENTIC WEAVES • B2B EXCLUSIVE • DIRECT VARANASI • 
                </textPath>
              </text>
            </svg>
            <div className="seo-seal-center">
              <Award size={20} />
            </div>
          </div>
        </div>

        {/* Asymmetric Split Intro Narrative */}
        <section className="seo-split-intro">
          <div className="seo-split-left-sidebar">
            <span className="seo-sidebar-large-tag">{collectionTextBadge}</span>
            <span className="seo-sidebar-badge">B2B Verified</span>
          </div>
          <div className="seo-split-right-narrative">
            {pageData.introText.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      </header>

      {/* Sourcing Product Grid */}
      <section className="section" style={{ backgroundColor: '#ffffff', padding: '5rem 5% 6rem' }}>
        <div className="seo-catalog-title-wrapper">
          <h2>Explore B2B Wholesale {pageData.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h2>
          <span className="seo-catalog-subtitle">Real-time artisan inventory with secure international shipping support</span>
        </div>

        <StateMessage status={status} error={error} />

        {status === 'ready' && filteredProducts.length > 0 && (
          <>
            <div className="catalog-grid" style={{ maxWidth: '1280px', margin: '0 auto' }}>
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={product.variants?.[0]}
                  navigate={navigate}
                  addToCart={addToCart}
                  toggleFavorite={toggleFavorite}
                  isFavorite={favoriteKeys.has(product.id)}
                  priceAccess={priceAccess}
                  openAuth={openAuth}
                />
              ))}
            </div>
            {filteredProducts.length > visibleCount && (
              <div className="load-more-row" style={{ marginTop: '4.5rem' }}>
                <button type="button" className="secondary-button" onClick={() => setVisibleCount(prev => prev + 16)}>
                  Show more products
                </button>
              </div>
            )}
          </>
        )}

        {status === 'ready' && filteredProducts.length === 0 && (
          <EmptyCategorySourcing categoryName={pageData.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} navigate={navigate} />
        )}
      </section>

      {/* Premium Step Counter Sourcing Guide (Buyer's Guide) */}
      <section className="seo-guide-section">
        <div className="seo-guide-container">
          <div className="seo-guide-header">
            <h2>{pageData.buyerGuideTitle}</h2>
            <p>Direct sourcing standards from the master artisans of Varanasi, India</p>
          </div>
          <div className="seo-guide-grid">
            {pageData.buyerGuideSections.map((section, idx) => (
              <article className="seo-guide-card" key={idx}>
                <h3>
                  <BookOpen size={20} className="seo-card-icon" />
                  {section.title}
                </h3>
                <p>{section.content}</p>
                <div className="seo-step-num">0{idx + 1}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Asymmetric Sticky FAQ Layout */}
      <section className="seo-faq-section">
        <div className="seo-faq-split-container">
          <div className="seo-faq-sticky-left">
            <div className="seo-faq-icon-badge">
              <HelpCircle size={24} />
            </div>
            <h2>Sourcing Insights & Boutique Support</h2>
            <p>Get professional details regarding international customs clearing, dynamic B2B discount slabs, customized fabric inspections, and flexible dropshipping support from Varanasi weavers.</p>
            <a
              href="/bulk-inquiry"
              className="seo-faq-inquiry-btn"
              onClick={(e) => {
                e.preventDefault();
                navigate('bulk-inquiry');
              }}
            >
              <span>Submit Inquiry</span>
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="seo-faq-list">
            {pageData.faqs.map((faq, idx) => (
              <div
                className={`seo-faq-item ${openFaq === idx ? 'active' : ''}`}
                key={idx}
              >
                <button type="button"
                  className="seo-faq-trigger"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaq === idx}
                >
                  <h3>{faq.q}</h3>
                  <div className="seo-faq-icon-circle">
                    <ChevronDown size={16} />
                  </div>
                </button>
                <div className="seo-faq-content">
                  <div className="seo-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Magazine-Style Related Collections Grid */}
      <footer className="seo-crosslinks-section">
        <div className="seo-crosslinks-container">
          <h2>Explore Sourcing Collections</h2>
          <div className="seo-crosslinks-grid">
            {Object.values(seoLandingPages).map((item) => (
              <a
                key={item.slug}
                href={`/${item.slug}`}
                className={`seo-crosslink-card ${item.slug === slug ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (item.slug !== slug) {
                    navigate(item.slug);
                  }
                }}
              >
                <div className="seo-crosslink-top">
                  <span className="kicker">Collection</span>
                  <h3>{item.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h3>
                  <p className="tagline">{getCollectionTagline(item.slug)}</p>
                </div>
                <div className="seo-crosslink-bottom">
                  <span>Explore Bulk Rates</span>
                  <ArrowRight size={14} className="arrow" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </footer>
    </article>
  );
}
