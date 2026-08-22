import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Share2, Calculator, IndianRupee, Percent, ExternalLink, Store, Sparkles } from 'lucide-react';
import { resellerService } from '../services/resellerService';
import { formatMoney, customerPrice } from '../utils/priceUtils';
import { storeConfig } from '../config.js';
import { WhatsappIcon } from './WhatsappIcon.jsx';

/**
 * Modal for resellers to add a product to their white-label catalog.
 * The shareable link always points to the reseller's storefront slug.
 */
export function ResellerShareModal({ product, variant, user, priceAccess, onClose }) {
  const [markupType, setMarkupType] = useState('percentage');
  const [markupValue, setMarkupValue] = useState(20);
  const [isCreating, setIsCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [storeSlug, setStoreSlug] = useState(null);
  const [copied, setCopied] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const [customDomain, setCustomDomain] = useState(null);

  // Load the reseller's storefront slug
  useEffect(() => {
    async function loadSlug() {
      const { data } = await resellerService.getStorefront(user.id);
      if (data?.slug) {
        setStoreSlug(data.slug);
        if (data.custom_domain) setCustomDomain(data.custom_domain);
      } else {
        setNeedsSetup(true);
      }
    }
    loadSlug();
  }, [user.id]);

  const basePrice = useMemo(() => {
    const prices = variant?.prices || product?.variants?.[0]?.prices || {};
    return customerPrice(prices, priceAccess) || prices.reseller || prices.wholesale || 0;
  }, [product, variant, priceAccess]);

  const calculatedCustomerPrice = useMemo(() => {
    if (markupType === 'percentage') return Math.round(basePrice * (1 + markupValue / 100));
    if (markupType === 'fixed_amount') return Math.round(basePrice + Number(markupValue));
    return Math.round(Number(markupValue));
  }, [basePrice, markupType, markupValue]);

  const shareLink = customDomain ? `https://${customDomain.replace(/\/+$/, '')}` : '';

  const handleAdd = async () => {
    setIsCreating(true);
    try {
      const { error } = await resellerService.addToCatalog(user.id, {
        title: product.title,
        markupType,
        markupValue: Number(markupValue),
        productId: product.id,
        variantCode: variant?.code || product.variants?.[0]?.code,
        basePrice,
        customerPrice: calculatedCustomerPrice,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      console.error('Error adding to catalog:', err);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modal = (
    <div className="reseller-modal-overlay" onClick={onClose}>
      <div className="reseller-modal" onClick={e => e.stopPropagation()}>
        
        <div className="reseller-modal-header">
          <h2><Store size={18} /> White-Label Catalog</h2>
          <button type="button" onClick={onClose} className="reseller-modal-close" aria-label="Close modal"><X size={18} /></button>
        </div>

        <div className="reseller-modal-content">
          {!priceAccess?.resellerDashboardEnabled ? (
            <div className="reseller-activation-card">
              <div className="reseller-activation-icon">
                <Store size={22} />
              </div>
              <h3 className="reseller-activation-title">
                Activate White-Label Store
              </h3>
              <p className="reseller-activation-desc">
                White-label storefronts let you showcase curated catalogs under your own brand with custom profit margins. This is a premium paid feature — connect with our team on WhatsApp to explore pricing plans and get your store activated.
              </p>
              <a
                href={`https://wa.me/${storeConfig.whatsapp || ''}?text=${encodeURIComponent('Hi Weave 365, I would like to inquire about pricing and plans to activate my premium reseller white-label storefront.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="reseller-activation-btn"
              >
                <WhatsappIcon size={18} />
                <span>Inquire Pricing & Activate</span>
              </a>
            </div>
          ) : needsSetup ? (
            <div className="reseller-activation-card">
              <div className="reseller-activation-icon setup">
                <Sparkles size={24} />
              </div>
              <h3 className="reseller-activation-title">
                Set Up Your Store Name
              </h3>
              <p className="reseller-activation-desc">
                Please configure your store name & link in <strong>Account → Reseller Tools → Settings</strong> before adding products to your catalog.
              </p>
            </div>
          ) : !done ? (
            <>
              <div className="reseller-price-preview">
                <div className="reseller-price-box base">
                  <span>Base Price</span>
                  <strong>{formatMoney(basePrice)}</strong>
                </div>
                <div className="reseller-price-box customer">
                  <span>Customer Price</span>
                  <strong>{formatMoney(calculatedCustomerPrice)}</strong>
                </div>
              </div>

              <div className="reseller-form-group">
                <label>Pricing Markup</label>
                <div className="reseller-markup-selector">
                  <button type="button" onClick={() => setMarkupType('percentage')} className={`reseller-markup-btn ${markupType === 'percentage' ? 'active' : ''}`}>
                    <Percent size={14} /> Percentage
                  </button>
                  <button type="button" onClick={() => setMarkupType('fixed_amount')} className={`reseller-markup-btn ${markupType === 'fixed_amount' ? 'active' : ''}`}>
                    <IndianRupee size={14} /> Fixed
                  </button>
                  <button type="button" onClick={() => setMarkupType('exact_price')} className={`reseller-markup-btn ${markupType === 'exact_price' ? 'active' : ''}`}>
                    <Calculator size={14} /> Exact
                  </button>
                </div>

                <div className="reseller-input-with-icon" style={{ marginTop: '0.5rem' }}>
                  <div className="reseller-input-icon">
                    {markupType === 'percentage' ? <Percent size={14} /> : <IndianRupee size={14} />}
                  </div>
                  <input type="number" value={markupValue} onChange={e => setMarkupValue(e.target.value)} placeholder="Enter value" />
                </div>
                <p className="reseller-form-hint">
                  {markupType === 'percentage' && `Adds ${markupValue}% to your base price.`}
                  {markupType === 'fixed_amount' && `Adds ${formatMoney(markupValue)} to base price.`}
                  {markupType === 'exact_price' && `Final customer price: ${formatMoney(markupValue)}.`}
                </p>
              </div>

              <button type="button" onClick={handleAdd} disabled={isCreating} className="reseller-btn-primary" style={{ width: '100%' }}>
                {isCreating ? 'Adding…' : `Add to My Catalog — ${formatMoney(calculatedCustomerPrice)}`}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="reseller-success-box">
                <div className="reseller-success-icon"><Check size={20} strokeWidth={3} /></div>
                <h3>Added to Your Catalog!</h3>
                <p>Share the link below — all your products appear on one page.</p>
              </div>

              <div className="reseller-form-group">
                <label>Your White-label Link</label>
                <div className="reseller-copy-row">
                  <input type="text" readOnly value={shareLink} />
                  <button type="button" onClick={copyToClipboard} className="reseller-btn-primary" style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap' }}>
                    {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out my catalog: ${shareLink}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="reseller-btn-whatsapp"
                >
                  WhatsApp
                </a>
                <a href={shareLink} target="_blank" rel="noopener noreferrer" className="reseller-btn-outline" style={{ justifyContent: 'center' }}>
                  <ExternalLink size={16} /> Preview
                </a>
              </div>
              
              <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: 'var(--button-size)' }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
