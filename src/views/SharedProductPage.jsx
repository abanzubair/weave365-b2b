/**
 * @file SharedProductPage.jsx
 * @description Single product detail view for customer-facing white-label reseller storefronts.
 * Displays matching fabric details, work descriptions, and custom color thumbnail swatches for selected items,
 * showing the reseller's custom marked-up retail pricing. Features customer inquiry forms that log requests and
 * coordinate direct WhatsApp redirects.
 * 
 * @module views/SharedProductPage
 * @param {Object} props
 * @param {Array} props.products - Full catalog list used for matching local details (images, fabrics)
 * @param {string} props.slug - The unique white-label reseller boutique URL slug
 * @param {string} props.productId - Selected catalog product group key/ID to render
 * @param {Function} props.navigate - Client router transition callback
 */

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
import Breadcrumb from '../components/Breadcrumb.jsx';

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
    <div className={`reseller-storefront ${storefront.theme_color || 'theme-classic-luxury'}`}>
      <header className="sc-header">

        <div className="sc-brand" onClick={() => navigate('s', null, slug)} style={{ cursor: 'pointer' }}>
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

      <main className="sp-container">
        <Breadcrumb 
          items={[
            { name: storefront?.store_name || 'Catalog', onClick: () => navigate('s', null, slug) },
            ...(productData.category ? [{ name: productData.category, onClick: () => navigate('s', null, slug) }] : []),
            { name: productData.title }
          ]} 
        />
        <button onClick={() => navigate('s', null, slug)} className="sp-back-btn">
          <ArrowLeft size={16} /> Back to Catalog
        </button>

        <div className="sp-layout">
          <div className="sp-gallery">
            <div className="sp-main-img">
              <img 
                src={activeImage || fallbackProductImage} 
                alt={productData.title} 
                width={600}
                height={800}
                decoding="async"
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
                    <img src={opt.image} alt={opt.name} width={80} height={100} loading="lazy" decoding="async" />
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
              {String(productData.category || '').toLowerCase() === 'saree' && (
                <div className="saree-length-display" style={{ marginTop: '12px', fontWeight: '600', color: 'var(--reseller-primary)' }}>
                  Saree Length: 6.3m (including 85cm Blouse)
                </div>
              )}
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

              
              {storefront.whatsapp && (
                <a 
                  href={`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sp-btn-whatsapp"
                  onClick={() => {
                    resellerService.submitInquiry({
                      reseller_id: storefront.reseller_id,
                      customer_name: 'WhatsApp Click',
                      customer_phone: '',
                      items: [{ product_title: productData.title, product_id: productData.id, price: productData.displayPrice }],
                      customer_total: productData.displayPrice
                    }).catch(console.error);
                  }}
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

      {storefront.whatsapp && (
        <div className="sc-float-bar">
          <a 
            href={`https://wa.me/${storefront.whatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sc-whatsapp-btn"
            title={`Contact ${storefront.store_name} on WhatsApp`}
            onClick={() => {
              resellerService.submitInquiry({
                reseller_id: storefront.reseller_id,
                customer_name: 'WhatsApp Click',
                customer_phone: '',
                items: [{ product_title: productData.title, product_id: productData.id, price: productData.displayPrice }],
                customer_total: productData.displayPrice
              }).catch(console.error);
            }}
          >
            <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">


              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
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
