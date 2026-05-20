/**
 * @file SharedCatalog.jsx
 * @description The customer-facing white-label storefront view shared by resellers.
 * Dynamically resolves the specific reseller storefront profile and marked-up catalog items by custom URL slug,
 * applying the reseller's custom theme (e.g. Classic Luxury, Soft Silk). Enables retail customers to browse collections,
 * filter by category/fabric/pricing, and submit purchase inquiries directly to the reseller via database logs and WhatsApp.
 * 
 * @module views/SharedCatalog
 * @param {Object} props
 * @param {Array} props.products - Full catalog list used for matching local details (images, fabrics)
 * @param {string} props.slug - The unique white-label reseller boutique URL slug
 * @param {Function} props.navigate - Client router transition callback
 */

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
  ShieldCheck,
  Users
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFabric, setSelectedFabric] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');

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
  const allItems = useMemo(() => {
    if (!catalogItems.length || !products?.length) return [];
    return catalogItems.map(item => {
      const product = products.find(p => p.id === item.product_group_key);
      if (!product) return null;
      const variant = product.variants.find(v => v.code === item.variant_code) || product.variants[0];
      return { ...item, product, variant, displayPrice: item.customer_price };
    }).filter(Boolean);
  }, [catalogItems, products]);

  const fabrics = useMemo(() => {
    const set = new Set();
    allItems.forEach(item => {
      if (item.product.fabric) set.add(item.product.fabric);
    });
    return Array.from(set).sort();
  }, [allItems]);

  const displayItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.product.category === selectedCategory;
      const matchesFabric = selectedFabric === 'All' || item.product.fabric === selectedFabric;
      
      let matchesPrice = true;
      if (selectedPrice === 'Under 2000') matchesPrice = item.displayPrice < 2000;
      else if (selectedPrice === '2000-5000') matchesPrice = item.displayPrice >= 2000 && item.displayPrice <= 5000;
      else if (selectedPrice === 'Above 5000') matchesPrice = item.displayPrice > 5000;

      return matchesCategory && matchesFabric && matchesPrice;
    });
  }, [allItems, selectedCategory, selectedFabric, selectedPrice]);

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

  const heroImage = "/boutique-hero.webp";


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
            <img src={storefront.logo_url} alt={storefront.store_name} className="sc-logo" width={150} height={50} loading="lazy" decoding="async" />
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
          <img src={heroImage} alt="Hero" width={1920} height={400} loading="lazy" decoding="async" />
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
            <h3>Fast Delivery</h3>
            <p>Pan India Shipping</p>
          </div>
        </div>
        <div className="sc-trust-item">
          <div className="sc-trust-icon"><ShieldCheck size={20} /></div>
          <div className="sc-trust-text">
            <h3>Quality Assured</h3>
            <p>Hand-picked Designs</p>
          </div>
        </div>
        <div className="sc-trust-item">
          <div className="sc-trust-icon"><Palette size={20} /></div>
          <div className="sc-trust-text">
            <h3>Exclusive Art</h3>
            <p>Direct from Weavers</p>
          </div>
        </div>
        <div className="sc-trust-item">
          <div className="sc-trust-icon"><Users size={20} /></div>
          <div className="sc-trust-text">
            <h3>Happy Customers</h3>
            <p>5000+ Reviews</p>
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
                  <div 
                    key={cat} 
                    className={`sc-cat-card ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                  >
                    <img src={catItem?.variant?.image || catItem?.product?.images[0]} alt={cat} width={300} height={300} loading="lazy" decoding="async" />
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
          <div className="sc-catalog-toolbar">
            <div className="sc-toolbar-left">
              <h2>{selectedCategory === 'All' ? 'Our Catalog' : selectedCategory}</h2>
            </div>
            <div className="sc-toolbar-right">
              <div className="sc-filters">
                <div className="sc-filter-group">
                  <label>Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="All">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="sc-filter-group">
                  <label>Fabric</label>
                  <select value={selectedFabric} onChange={(e) => setSelectedFabric(e.target.value)}>
                    <option value="All">All Fabrics</option>
                    {fabrics.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="sc-filter-group">
                  <label>Price</label>
                  <select value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)}>
                    <option value="All">All Prices</option>
                    <option value="Under 2000">Under ₹2,000</option>
                    <option value="2000-5000">₹2,000 - ₹5,000</option>
                    <option value="Above 5000">Above ₹5,000</option>
                  </select>
                </div>
              </div>
            </div>
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
                      decoding="async"
                      width={360}
                      height={480}
                    />
                    <div className="sc-card-overlay" />

                  </div>
                  <div className="sc-card-body">
                    <h3>{item.product.title}</h3>
                    <div className="sc-card-color-badge">{item.product.totalColors || 1} Colors Available</div>
                    <div className="sc-card-price">{formatMoney(item.displayPrice)}</div>
                    
                    <div className="sc-card-footer" style={{ marginTop: '0.125rem' }}>
                      <button className="sc-card-cta">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg> Enquire
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
            title={`Contact ${storefront.store_name} on WhatsApp`}
            onClick={() => {
              resellerService.submitInquiry({
                reseller_id: storefront.reseller_id,
                customer_name: 'WhatsApp Click (Catalog)',
                customer_phone: '',
                items: [],
                customer_total: 0
              }).catch(console.error);
            }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">


              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
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

