import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  MessageSquare, 
  ChevronRight, 
  Phone, 
  CheckCircle2, 
  X,
  Layers,
  Palette
} from 'lucide-react';
import { resellerService } from '../services/resellerService';
import { formatMoney, fallbackProductImage } from '../storefrontShared';
import '../styles/sharedCatalog.css';
import '../styles/resellerTools.css';

export function SharedCatalog({ products }) {
  const { slug } = useParams();
  const [storefront, setStorefront] = useState(null);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

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
        const msg = `Hi ${storefront.store_name}, I'm interested in products from your catalog: ${window.location.origin}/s/${slug}`;
        window.open(`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (err) {
      console.error('Error submitting inquiry:', err);
    }
  };

  if (loading) return (
    <div className="sc-loading">
      <div className="sc-pulse-dot" />
      <p>Loading catalog…</p>
    </div>
  );

  if (!storefront) return (
    <div className="sc-error">
      <h2>Store Not Found</h2>
      <p>This storefront may not exist or has been deactivated.</p>
    </div>
  );

  return (
    <div className="sc-wrapper">
      {/* Compact sticky header */}
      <header className="sc-header">
        <div className="sc-brand">
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

      {/* Title bar */}
      <div className="sc-title-bar">
        <h2>{storefront.store_name}'s Catalog</h2>
        <span className="sc-item-count">{displayItems.length} item{displayItems.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Product grid — all products on one page */}
      {displayItems.length === 0 ? (
        <div className="sc-empty">
          <p>No products in this catalog yet.</p>
        </div>
      ) : (
        <main className="sc-grid">
          {displayItems.map((item) => (
            <article key={item.id} className="sc-card">
              <div className="sc-card-img">
                <img 
                  src={item.variant?.image || item.product?.images[0] || fallbackProductImage} 
                  alt={item.product?.title}
                  loading="lazy"
                />
                {item.product.fabric && (
                  <span className="sc-card-badge">{item.product.fabric}</span>
                )}
              </div>
              <div className="sc-card-body">
                <h3>{item.product.title}</h3>
                <div className="sc-card-price">{formatMoney(item.displayPrice)} <small>/pc</small></div>
                <div className="sc-card-meta">
                  <span><Layers size={13} /> {item.product.totalColors || 1} Colors</span>
                  <span><Palette size={13} /> {item.product.work || 'Designer'}</span>
                </div>
                <button onClick={() => setInquiryOpen(true)} className="sc-card-cta">
                  Inquire <ChevronRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </main>
      )}

      {/* Floating WhatsApp bar */}
      {storefront.whatsapp && (
        <div className="sc-float-bar">
          <a 
            href={`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in products from your catalog: ${window.location.origin}/s/${slug}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-whatsapp-btn"
          >
            <Phone size={16} /> WhatsApp {storefront.store_name}
          </a>
        </div>
      )}

      {/* Inquiry Modal */}
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
                  <p className="sc-inquiry-desc">Leave your details and we'll reach out shortly.</p>
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
                  <button onClick={() => setInquiryOpen(false)} className="sc-close-link">Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
