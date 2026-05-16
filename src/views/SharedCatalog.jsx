import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  ChevronRight, 
  Phone, 
  CheckCircle2, 
  X,
  Layers,
  Palette,
  Truck,
  ShieldCheck
} from 'lucide-react';

import { resellerService } from '../services/resellerService';
import { formatMoney, fallbackProductImage } from '../storefrontShared';
import '../styles/resellerStorefront.css';

export function SharedCatalog({ products, slug, navigate }) {
  const [storefront, setStorefront] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const catalogUrl = origin ? `${origin}/s/${slug}` : `/s/${slug}`;

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const { data, error } = await resellerService.getStorefrontBySlug(slug);
        if (data) {
          setStorefront(data.storefront);
          setCatalogItems(data.items);
        }
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [slug]);

  // Match share items to local product data for images/details
  const displayItems = useMemo(() => {
    if (!catalogItems.length || !products?.length) return [];
    return catalogItems.map(item => {
      const product = products.find(p => p.id === item.product_group_key);
      if (!product) return null;
      const variant = product.variants.find(v => v.code === item.variant_code) || product.variants[0];
      return { ...item, product, variant, displayPrice: item.customer_price };
    }).filter(Boolean);
  }, [catalogItems, products]);

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    try {
      await resellerService.submitInquiry({
        reseller_id: storefront.reseller_id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        items: displayItems.map(item => ({
          product_title: item.product.title,
          variant_code: item.variant.code,
          price: item.displayPrice,
        })),
        customer_total: displayItems.reduce((sum, item) => sum + item.displayPrice, 0),
      });
      setInquirySent(true);
      if (storefront?.whatsapp) {
        const msg = `Hi ${storefront.store_name}, I'm interested in products from your catalog: ${catalogUrl}`;
        window.open(`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set();
    displayItems.forEach(item => {
      if (item.product.category) cats.add(item.product.category);
    });
    return Array.from(cats).slice(0, 4);
  }, [displayItems]);

  const heroImage = "/boutique-hero.png";


  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) return (
    <div className="reseller-storefront">
      <div className="sc-loading">
        <div className="sc-pulse-dot" />
        <p>Opening boutique…</p>
      </div>
    </div>
  );

  if (!storefront) return (
    <div className="reseller-storefront">
      <div className="sc-error">
        <h2>Store Not Found</h2>
        <p>This storefront may not exist or has been deactivated.</p>
      </div>
    </div>
  );

  return (
    <div className={`reseller-storefront ${storefront.theme_color || 'theme-classic-luxury'}`}>
      <header className={`sc-header ${scrolled ? 'scrolled' : ''}`}>

        <div className="sc-brand" onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} style={{ cursor: 'pointer' }}>
          {storefront.logo_url ? (
            <img src={storefront.logo_url} alt={storefront.store_name} className="sc-logo" />
          ) : (
            <div className="sc-logo-fallback">{storefront.store_name?.[0] || 'S'}</div>
          )}
          <span className="sc-brand-name">{storefront.store_name}</span>
        </div>
        <button onClick={() => setInquiryOpen(true)} className="sc-contact-btn">
          <MessageSquare size={14} /> Contact
        </button>
      </header>


      {/* Hero Section */}
      <section className="sc-hero">
        <div className="sc-hero-bg">
          <img src={heroImage} alt="Hero" />
          <div className="sc-hero-overlay" />
        </div>
        <div className="sc-hero-content">
          <div className="sc-hero-card">
            <span className="sc-hero-tag">Handcrafted Elegance</span>
            <h1>The {storefront.store_name} Collection</h1>
            <p>Discover our curated selection of premium ethnic wear, designed for the modern woman who values tradition.</p>
            <button onClick={() => {
              document.getElementById('catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
            }} className="sc-hero-btn">
              Explore Collection <ChevronRight size={18} />
            </button>
          </div>
        </div>

      </section>

      {/* Trust Badges */}
      <section className="sc-trust-bar">
        <div className="sc-trust-item">
          <div className="sc-trust-icon"><Truck size={20} /></div>
          <div className="sc-trust-text">
            <h4>Fast Delivery</h4>
            <p>Pan India Shipping</p>
          </div>
        </div>
        <div className="sc-trust-item">
          <div className="sc-trust-icon"><ShieldCheck size={20} /></div>
          <div className="sc-trust-text">
            <h4>Quality Assured</h4>
            <p>Hand-picked Designs</p>
          </div>
        </div>
        <div className="sc-trust-item">
          <div className="sc-trust-icon"><Palette size={20} /></div>
          <div className="sc-trust-text">
            <h4>Exclusive Art</h4>
            <p>Direct from Weavers</p>
          </div>
        </div>
      </section>

      <div className="sc-container">
        {/* Shop by Category */}
        {categories.length > 0 && (
          <section className="sc-categories-section">
            <div className="sc-section-header">
              <h2>Shop by Category</h2>
              <p>Explore our wide range of traditional wear</p>
            </div>
            <div className="sc-categories-grid">
              {categories.map((cat, idx) => {
                const catItem = displayItems.find(item => item.product.category === cat);
                return (
                  <div key={cat} className="sc-cat-card">
                    <img src={catItem?.variant?.image || catItem?.product?.images[0]} alt={cat} />
                    <div className="sc-cat-overlay">
                      <h3>{cat}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Catalog Grid */}
        <section id="catalog-grid" className="sc-catalog-section">
          <div className="sc-section-header">
            <h2>Our Catalog</h2>
            <span className="sc-item-count">{displayItems.length} curated item{displayItems.length !== 1 ? 's' : ''}</span>
          </div>

          {displayItems.length === 0 ? (
            <div className="sc-empty">
              <p>No products in this catalog yet.</p>
            </div>
          ) : (
            <main className="sc-grid">
              {displayItems.map((item) => (
                <article 
                  key={item.id} 
                  className="sc-card"
                  onClick={() => navigate('shared-product', item.product_group_key, slug)}
                >
                  <div className="sc-card-img">
                    <img 
                      src={item.variant?.image || item.product?.images[0] || fallbackProductImage} 
                      alt={item.product?.title}
                      loading="lazy"
                    />
                    <div className="sc-card-overlay">
                      {item.product.fabric && (
                        <span className="sc-card-badge">{item.product.fabric}</span>
                      )}
                    </div>
                  </div>
                  <div className="sc-card-body">
                    <div className="sc-card-header-row">
                      <div className="sc-card-category">{item.product.category || 'Premium Collection'}</div>
                      <div className="sc-card-price">{formatMoney(item.displayPrice)}</div>
                    </div>
                    <h3>{item.product.title}</h3>
                    <div className="sc-card-meta">
                      <span><Layers size={14} /> {item.product.totalColors || 1} Colors</span>
                      <span><Palette size={14} /> {item.product.work || 'Designer'}</span>
                    </div>
                    <div className="sc-card-footer">
                      <button className="sc-card-cta">
                        View Details <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </main>
          )}
        </section>
      </div>

      {storefront.whatsapp && (
        <div className="sc-float-bar">
          <a 
            href={`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in products from your catalog: ${catalogUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-whatsapp-btn"
          >
            <Phone size={16} /> WhatsApp {storefront.store_name}
          </a>
        </div>
      )}

      {inquiryOpen && (
        <div className="reseller-modal-overlay" onClick={() => setInquiryOpen(false)}>
          <div className="reseller-modal" onClick={e => e.stopPropagation()}>
            <div className="reseller-modal-header">
              <h2>Send Inquiry</h2>
              <button onClick={() => setInquiryOpen(false)} className="reseller-modal-close"><X size={18} /></button>
            </div>
            <div className="reseller-modal-content">
              {!inquirySent ? (
                <form onSubmit={handleSubmitInquiry} className="sc-inquiry-form">
                  <p className="sc-inquiry-desc" style={{ marginBottom: '1.5rem', color: 'var(--reseller-muted)' }}>
                    Leave your details and <strong>{storefront.store_name}</strong> will reach out shortly.
                  </p>
                  <div className="reseller-form-group">
                    <label htmlFor="sc-name">Your Name</label>
                    <input id="sc-name" type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                  </div>
                  <div className="reseller-form-group">
                    <label htmlFor="sc-phone">Phone Number</label>
                    <input id="sc-phone" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Mobile Number" />
                  </div>
                  <button type="submit" className="reseller-btn-primary" style={{ width: '100%' }}>Submit Inquiry</button>
                </form>
              ) : (
                <div className="reseller-success-box">
                  <div className="reseller-success-icon"><CheckCircle2 size={24} strokeWidth={2.5} /></div>
                  <h3>Inquiry Sent!</h3>
                  <p>{storefront.store_name} will contact you soon.</p>
                  <button onClick={() => setInquiryOpen(false)} className="reseller-btn-primary" style={{ background: 'none', color: 'var(--reseller-primary)', border: '1px solid var(--reseller-border)', marginTop: '1.5rem' }}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

