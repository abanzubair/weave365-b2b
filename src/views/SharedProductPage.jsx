import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Phone, 
  ChevronRight,
  Layers,
  Palette,
  Truck,
  ShieldCheck,
  X,
  CheckCircle2
} from 'lucide-react';
import { resellerService } from '../services/resellerService';
import { formatMoney, fallbackProductImage } from '../storefrontShared';
import '../styles/resellerStorefront.css';

export function SharedProductPage({ products, slug, productId, navigate }) {
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [catalogItems, setCatalogItems] = useState([]);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await resellerService.getStorefrontBySlug(slug);
        if (data) {
          setStorefront(data.storefront);
          setCatalogItems(data.items);
        }
      } catch (err) {
        console.error('Error loading product data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  const productData = useMemo(() => {
    if (!products || !productId || !catalogItems.length) return null;
    
    // Find the item in the reseller's catalog
    const catalogItem = catalogItems.find(item => item.product_group_key === productId);
    if (!catalogItem) return null;

    const baseProduct = products.find(p => p.id === productId);
    if (!baseProduct) return null;

    const variant = baseProduct.variants.find(v => v.code === catalogItem.variant_code) || baseProduct.variants[0];
    
    return {
      ...baseProduct,
      selectedVariant: variant,
      displayPrice: catalogItem.customer_price
    };
  }, [products, productId, catalogItems]);

  useEffect(() => {
    if (productData && !activeImage) {
      setActiveImage(productData.selectedVariant?.image || productData.images[0]);
    }
  }, [productData, activeImage]);

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    try {
      await resellerService.submitInquiry({
        reseller_id: storefront.reseller_id,
        customer_name: formData.name,
        customer_phone: formData.phone,
        items: [{
          product_title: productData.title,
          variant_code: productData.selectedVariant.code,
          price: productData.displayPrice,
        }],
        customer_total: productData.displayPrice,
      });
      setInquirySent(true);
    } catch (err) {
      console.error('Error submitting inquiry:', err);
    }
  };

  if (loading) return (
    <div className="reseller-storefront">
      <div className="sc-loading">
        <div className="sc-pulse-dot" />
        <p>Loading product…</p>
      </div>
    </div>
  );

  if (!storefront || !productData) return (
    <div className="reseller-storefront">
      <div className="sc-error">
        <h2>Product Not Found</h2>
        <p>This product might have been removed from the catalog.</p>
        <button onClick={() => navigate('s', null, slug)} className="sp-back-btn" style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back to Catalog
        </button>
      </div>
    </div>
  );

  const whatsappMsg = `Hi ${storefront.store_name}, I'm interested in "${productData.title}" from your catalog. Product link: ${window.location.href}`;

  return (
    <div className="reseller-storefront">
      <header className="sc-header">
        <div className="sc-brand" onClick={() => navigate('s', null, slug)} style={{ cursor: 'pointer' }}>
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

      <main className="sp-container">
        <button onClick={() => navigate('s', null, slug)} className="sp-back-btn">
          <ArrowLeft size={16} /> Back to Catalog
        </button>

        <div className="sp-layout">
          <div className="sp-gallery">
            <div className="sp-main-img">
              <img 
                src={activeImage || fallbackProductImage} 
                alt={productData.title} 
              />
            </div>
            
            {productData.colorOptions && productData.colorOptions.length > 0 && (
              <div className="sp-thumbnails">
                {productData.colorOptions.map((opt, idx) => (
                  <button 
                    key={`${opt.name}-${idx}`}
                    className={`sp-thumb-btn ${activeImage === opt.image ? 'active' : ''}`}
                    onClick={() => setActiveImage(opt.image)}
                  >
                    <img src={opt.image} alt={opt.name} />
                    <span className="sp-thumb-label">{opt.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sp-details">
            <span className="sp-tag">{productData.fabric} • {productData.category}</span>
            <h1 className="sp-title">{productData.title}</h1>
            
            <div className="sp-price">
              {formatMoney(productData.displayPrice)}
              <small>/ piece</small>
            </div>

            <div className="sp-description">
              {productData.description || `Exquisite ${productData.fabric} ${productData.category} featuring beautiful ${productData.work} work. Perfect for ${productData.occasion} and special celebrations.`}
            </div>

            <div className="sp-specs">
              <div className="sp-spec-item">
                <span className="sp-spec-label">Fabric</span>
                <span className="sp-spec-value">{productData.fabric || 'Premium Quality'}</span>
              </div>
              <div className="sp-spec-item">
                <span className="sp-spec-label">Work</span>
                <span className="sp-spec-value">{productData.work || 'Designer'}</span>
              </div>
              <div className="sp-spec-item">
                <span className="sp-spec-label">Occasion</span>
                <span className="sp-spec-value">{productData.occasion || 'Festive'}</span>
              </div>
              <div className="sp-spec-item">
                <span className="sp-spec-label">Colors</span>
                <span className="sp-spec-value">{productData.totalColors || 1} Available</span>
              </div>
            </div>

            <div className="sp-actions">
              <button onClick={() => setInquiryOpen(true)} className="sp-btn-primary">
                <MessageSquare size={20} /> Send Inquiry
              </button>
              
              {storefront.whatsapp && (
                <a 
                  href={`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sp-btn-whatsapp"
                >
                  <Phone size={20} /> Inquire on WhatsApp
                </a>
              )}
            </div>


            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--reseller-muted)', fontSize: '0.9rem' }}>
                  <Truck size={18} />
                  <span>Pan India Delivery Available</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--reseller-muted)', fontSize: '0.9rem' }}>
                  <ShieldCheck size={18} />
                  <span>Quality Assured by {storefront.store_name}</span>
               </div>
            </div>
          </div>
        </div>
      </main>

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
                  <p className="sc-inquiry-desc" style={{ marginBottom: '1.5rem', color: 'var(--reseller-muted)' }}>
                    Interested in <strong>{productData.title}</strong>? Leave your details and we'll contact you.
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
                  <p>{storefront.store_name} will contact you soon regarding this product.</p>
                  <div style={{ marginTop: '1.5rem' }}>
                    {storefront.whatsapp && (
                      <a 
                        href={`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sp-btn-whatsapp"
                        style={{ marginBottom: '1rem' }}
                      >
                        <Phone size={18} /> WhatsApp Now
                      </a>
                    )}
                    <button onClick={() => setInquiryOpen(false)} className="reseller-btn-primary" style={{ background: 'none', color: 'var(--reseller-primary)', border: '1px solid var(--reseller-border)' }}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
