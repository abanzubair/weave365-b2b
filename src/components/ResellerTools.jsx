/**
 * @file ResellerTools.jsx
 * @description Back-office dashboard for registered boutique resellers.
 * Provides easy catalog management, profit markup editing, price updating,
 * and direct integration with the external standalone boutique template.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  Calendar, 
  Save, 
  ExternalLink, 
  Search, 
  Globe, 
  Code, 
  Sparkles, 
  Package, 
  ArrowRight,
  Phone,
  Edit3,
  IndianRupee,
  Percent,
  X,
  TrendingUp,
  Tag
} from 'lucide-react';
import { resellerService, normalizeWebsiteUrl } from '../services/resellerService';
import { fetchProducts } from '../productData.js';
import '../styles/resellerTools.css';

const TEMPLATE_BASE_URL = 'https://ecom-template-1-tau.vercel.app';

export function ResellerTools({ user, buyerProfile, navigate }) {
  const [activeTab, setActiveTab] = useState('shares');
  const [shares, setShares] = useState([]);
  const [storefront, setStorefront] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Edit Price Modal State
  const [editingShare, setEditingShare] = useState(null);

  // Catalog List Filter/Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [sharesRes, storefrontRes, prods] = await Promise.all([
          resellerService.getResellerShares(user.id),
          resellerService.getStorefront(user.id),
          fetchProducts().catch(() => []),
        ]);
        if (sharesRes.data) setShares(sharesRes.data);
        if (storefrontRes.data) setStorefront(storefrontRes.data);
        if (prods) setCatalogProducts(prods);
      } catch (err) {
        console.error('Error loading reseller data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  // Product lookup map for image thumbnails and base details
  const productMap = useMemo(() => {
    const map = new Map();
    for (const p of catalogProducts) {
      if (p.groupKey) map.set(String(p.groupKey).toLowerCase().trim(), p);
      if (p.id) map.set(String(p.id).toLowerCase().trim(), p);
    }
    return map;
  }, [catalogProducts]);

  const slug = storefront?.slug || (user?.email ? user.email.split('@')[0].replace(/[^a-z0-9]/g, '') : '');
  const rawCustomDomain = storefront?.custom_domain || '';
  const customDomainUrl = rawCustomDomain ? normalizeWebsiteUrl(rawCustomDomain) : '';
  const hostedTemplateUrl = slug ? `${TEMPLATE_BASE_URL}/${encodeURIComponent(slug)}` : '';
  const liveStoreUrl = customDomainUrl || hostedTemplateUrl;
  const isWebsiteConfigured = Boolean(storefront?.slug || storefront?.store_name || customDomainUrl);
  const activeSharesCount = shares.filter(s => s.is_active).length;

  const copyWebsiteLink = (urlToCopy) => {
    const target = typeof urlToCopy === 'string' ? urlToCopy : liveStoreUrl;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeactivate = async (shareId) => {
    if (!window.confirm('Remove this product from your live boutique?')) return;
    const { error } = await resellerService.deactivateShare(shareId);
    if (!error) {
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_active: false } : s));
    }
  };

  const handlePriceUpdated = (updatedShareId, newMarkupType, newMarkupValue, newCustomerPrice) => {
    setShares(prev => prev.map(s => {
      if (s.id === updatedShareId) {
        const updatedItems = (s.reseller_share_items || []).map(item => ({
          ...item,
          markup_type: newMarkupType,
          markup_value: newMarkupValue,
          customer_price: newCustomerPrice || item.customer_price,
        }));
        return {
          ...s,
          default_markup_type: newMarkupType,
          default_markup_value: newMarkupValue,
          reseller_share_items: updatedItems,
        };
      }
      return s;
    }));
    setEditingShare(null);
  };

  const processedShares = useMemo(() => {
    let result = [...shares];

    if (filterStatus === 'live') result = result.filter(s => s.is_active);
    if (filterStatus === 'removed') result = result.filter(s => !s.is_active);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => (s.title || 'Untitled Product').toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'a-z') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

    return result;
  }, [shares, filterStatus, searchQuery, sortBy]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (visibleCount < processedShares.length) {
        setVisibleCount(prev => prev + 15);
      }
    }
  };

  if (loading) return <p className="rt-loading">Loading business center…</p>;

  return (
    <div className="rt-container">
      {/* Top Overview Bar */}
      <div className="rt-top-summary">
        <div className="rt-summary-left">
          <div className="rt-boutique-title-row">
            <h3 className="rt-store-name">{storefront?.store_name || 'My Reseller Boutique'}</h3>
            {liveStoreUrl ? (
              <button 
                type="button" 
                className="rt-url-chip" 
                onClick={() => copyWebsiteLink(liveStoreUrl)} 
                title="Click to copy live website link"
              >
                <Globe size={13} className="rt-url-icon" />
                <span className="rt-url-text">{liveStoreUrl}</span>
                <span className="rt-url-copy-hint">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            ) : (
              <span className="rt-unlinked-pill">No store website linked</span>
            )}
          </div>
          <div className="rt-summary-meta">
            <span>
              <strong>{activeSharesCount}</strong> {activeSharesCount === 1 ? 'product' : 'products'} in catalog
            </span>
            <span className="rt-dot-sep">·</span>
            <span>Wholesale base costs confidential</span>
          </div>
        </div>

        <div className="rt-summary-actions">
          {liveStoreUrl ? (
            <a 
              href={liveStoreUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="rt-open-store-btn"
            >
              <span>Open Live Store</span>
              <ExternalLink size={14} />
            </a>
          ) : (
            <button 
              type="button" 
              onClick={() => setActiveTab('storefront')} 
              className="rt-setup-btn"
            >
              <Globe size={14} />
              <span>Configure Website</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="rt-subtabs">
        <button 
          type="button"
          onClick={() => setActiveTab('shares')}
          className={`rt-subtab ${activeTab === 'shares' ? 'active' : ''}`}
        >
          <Package size={15} /> 
          <span>My Catalog ({activeSharesCount})</span>
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('storefront')}
          className={`rt-subtab ${activeTab === 'storefront' ? 'active' : ''}`}
        >
          <Globe size={15} /> 
          <span>Storefront &amp; Website Setup</span>
        </button>
      </div>

      {/* TAB 1: CATALOG PRODUCTS */}
      {activeTab === 'shares' && (
        !isWebsiteConfigured ? (
          /* Unconfigured Website Empty State */
          <div className="rt-empty-catalog rt-unconfigured-state">
            <div className="rt-empty-catalog-icon unconfigured">
              <Globe size={32} strokeWidth={1.5} />
            </div>
            <h4>Configure &amp; set up your website first</h4>
            <p>
              Before adding sarees to your catalog, set up your boutique brand name and handle so your live online website is ready for customers.
            </p>
            <button 
              type="button" 
              onClick={() => setActiveTab('storefront')}
              className="rt-setup-cta-btn"
            >
              <Globe size={15} />
              <span>Configure &amp; Set Up Website</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ) : shares.length === 0 ? (
          /* Configured Website but Empty Catalog */
          <div className="rt-empty-catalog">
            <div className="rt-empty-catalog-icon">
              <Package size={32} strokeWidth={1.5} />
            </div>
            <h4>Your boutique catalog is empty</h4>
            <p>
              Browse sarees on Weave 365 and click <strong>Add to My Website</strong> on any design to set your retail profit markup.
            </p>
            {navigate && (
              <button 
                type="button" 
                onClick={() => navigate('catalogue')}
                className="rt-browse-cta-btn"
              >
                <span>Browse Wholesale Catalogue</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        ) : (
          <div className="rt-shares-container">
            {/* Sleek, Single-Row Filters Toolbar */}
            <div className="rt-filters-toolbar">
              <div className="rt-filter-search-box">
                <Search size={15} className="rt-search-icon" />
                <input 
                  type="text" 
                  placeholder="Search catalog products..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rt-filter-search-input"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')} 
                    className="rt-search-clear"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="rt-filter-dropdowns">
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  className="rt-filter-select"
                >
                  <option value="all">All Products ({shares.length})</option>
                  <option value="live">Visible on Store ({activeSharesCount})</option>
                  <option value="removed">Hidden ({shares.length - activeSharesCount})</option>
                </select>

                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="rt-filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="a-z">Name (A–Z)</option>
                </select>
              </div>
            </div>

            {/* Catalog List */}
            <div className="rt-products-list" onScroll={handleScroll}>
              {processedShares.slice(0, visibleCount).map((share) => {
                const item = share.reseller_share_items?.[0] || {};
                const baseCost = Number(item.base_price_snapshot || 0);
                const currentCustomerPrice = Number(item.customer_price || 0);
                const markupType = item.markup_type || share.default_markup_type || 'percentage';
                const markupVal = Number(item.markup_value || share.default_markup_value || 20);

                // Find thumbnail image
                const matchedProd = productMap.get(String(item.product_group_key || '').toLowerCase().trim());
                const imgThumb = matchedProd?.images?.[0] || matchedProd?.image || 'assets/hero_saree_banner.png';

                // Profit calculation
                const profitAmount = currentCustomerPrice && baseCost ? currentCustomerPrice - baseCost : 0;

                const markupLabel = markupType === 'percentage' 
                  ? `+${markupVal}% markup` 
                  : `+₹${markupVal} markup`;

                return (
                  <div key={share.id} className={`rt-product-row ${!share.is_active ? 'is-inactive' : ''}`}>
                    <div className="rt-prod-main-content">
                      {/* Thumbnail */}
                      <div className="rt-prod-thumb-wrap">
                        <img src={imgThumb} alt={share.title} className="rt-prod-thumb-img" />
                      </div>

                      {/* Main Details */}
                      <div className="rt-prod-details">
                        <div className="rt-prod-header-line">
                          <h4 className="rt-prod-title">{share.title || 'Untitled Product'}</h4>
                          <span className={`rt-status-pill ${share.is_active ? 'active' : 'inactive'}`}>
                            {share.is_active ? 'ACTIVE' : 'HIDDEN'}
                          </span>
                        </div>

                        {/* Distilled Pricing & Profit Row */}
                        <div className="rt-prod-pricing-row">
                          <span className="rt-hero-price">
                            ₹{currentCustomerPrice ? currentCustomerPrice.toLocaleString('en-IN') : '—'}
                          </span>

                          <span className="rt-profit-badge">
                            +{markupVal}% ({profitAmount > 0 ? `+₹${profitAmount.toLocaleString('en-IN')}` : 'profit'})
                          </span>

                          {baseCost > 0 && (
                            <span className="rt-cost-badge">
                              Cost: ₹{baseCost.toLocaleString('en-IN')}
                            </span>
                          )}

                          <span className="rt-dot-sep">·</span>

                          <span className="rt-date-added">
                            Added {new Date(share.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="rt-prod-actions">
                      <button 
                        type="button"
                        onClick={() => setEditingShare({ ...share, item, baseCost, currentCustomerPrice, markupType, markupVal, imgThumb })}
                        className="rt-change-price-btn"
                        title="Change price or profit margin"
                      >
                        <Edit3 size={13} />
                        <span>Edit Price</span>
                      </button>

                      {share.is_active && (
                        <button 
                          type="button" 
                          onClick={() => handleDeactivate(share.id)} 
                          className="rt-trash-action-btn" 
                          title="Remove from your live boutique"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {processedShares.length === 0 && (
                <div className="rt-empty-search">
                  <p>No products match your current search.</p>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* TAB 2: STOREFRONT & WEBSITE SETUP */}
      {activeTab === 'storefront' && (
        <StorefrontSetupPanel
          storefront={storefront}
          user={user}
          liveStoreUrl={liveStoreUrl}
          onCopyLink={copyWebsiteLink}
          copied={copied}
          onUpdate={setStorefront}
        />
      )}

      {/* EDIT PRICE & PROFIT MARGIN MODAL */}
      {editingShare && (
        <EditPriceModal
          share={editingShare}
          onClose={() => setEditingShare(null)}
          onSave={handlePriceUpdated}
        />
      )}
    </div>
  );
}

/**
 * Interactive Modal for Resellers to update price / markup percentage
 */
function EditPriceModal({ share, onClose, onSave }) {
  const [markupType, setMarkupType] = useState(share.markupType || 'percentage');
  const [markupValue, setMarkupValue] = useState(share.markupVal || 20);
  const [customSellingPrice, setCustomSellingPrice] = useState(share.currentCustomerPrice || '');
  const [saving, setSaving] = useState(false);

  const basePrice = share.baseCost || 0;

  // Real-time calculation of customer price and reseller profit
  const calculatedPrice = useMemo(() => {
    if (markupType === 'percentage') {
      return Math.round(basePrice * (1 + Number(markupValue) / 100));
    }
    if (markupType === 'fixed_amount') {
      return Math.round(basePrice + Number(markupValue));
    }
    return Math.round(Number(customSellingPrice) || basePrice);
  }, [basePrice, markupType, markupValue, customSellingPrice]);

  const profitAmount = calculatedPrice > basePrice ? calculatedPrice - basePrice : 0;
  const effectiveMarginPct = basePrice > 0 ? Math.round((profitAmount / basePrice) * 100) : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalVal = Number(markupValue);
      if (markupType === 'direct_price') {
        finalVal = calculatedPrice - basePrice;
      }

      const { error } = await resellerService.updateShareMarkup(share.id, {
        markupType: markupType === 'direct_price' ? 'fixed_amount' : markupType,
        markupValue: finalVal,
        customerPrice: calculatedPrice,
      });

      if (error) throw error;
      onSave(share.id, markupType === 'direct_price' ? 'fixed_amount' : markupType, finalVal, calculatedPrice);
    } catch (err) {
      console.error('Failed to update price:', err);
      alert('Failed to update price: ' + (err.message || 'Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rt-modal-overlay" onClick={onClose}>
      <div className="rt-modal-box" onClick={e => e.stopPropagation()}>
        <div className="rt-modal-header">
          <div className="rt-modal-header-title">
            <TrendingUp size={18} className="rt-modal-title-icon" />
            <h3>Update Retail Price &amp; Markup</h3>
          </div>
          <button type="button" onClick={onClose} className="rt-modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="rt-modal-body">
          {/* Product Summary Header */}
          <div className="rt-modal-prod-summary">
            <img src={share.imgThumb} alt="" className="rt-modal-prod-img" />
            <div className="rt-modal-prod-meta">
              <h4 className="rt-modal-prod-name">{share.title}</h4>
              <div className="rt-modal-base-badge">
                <span>Wholesale Base Cost:</span>
                <strong>₹{basePrice.toLocaleString('en-IN')}</strong>
                <span className="rt-confidential-tag">Confidential</span>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="rt-markup-mode-selector">
            <button
              type="button"
              onClick={() => setMarkupType('percentage')}
              className={`rt-mode-btn ${markupType === 'percentage' ? 'active' : ''}`}
            >
              <Percent size={14} />
              <span>Percentage Markup (%)</span>
            </button>
            <button
              type="button"
              onClick={() => setMarkupType('fixed_amount')}
              className={`rt-mode-btn ${markupType === 'fixed_amount' ? 'active' : ''}`}
            >
              <IndianRupee size={14} />
              <span>Fixed Profit (+₹)</span>
            </button>
          </div>

          {/* Percentage Presets */}
          {markupType === 'percentage' && (
            <div className="rt-markup-presets-wrap">
              <label className="rt-form-label">Select Markup Percentage</label>
              <div className="rt-preset-chips">
                {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setMarkupValue(pct)}
                    className={`rt-preset-chip ${Number(markupValue) === pct ? 'active' : ''}`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>

              <div className="rt-custom-input-row">
                <label className="rt-custom-label">Custom Percentage:</label>
                <div className="rt-input-affix-wrap">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={markupValue}
                    onChange={e => setMarkupValue(e.target.value)}
                    className="rt-affix-input"
                    required
                  />
                  <span className="rt-affix-tag">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Fixed Amount Presets */}
          {markupType === 'fixed_amount' && (
            <div className="rt-markup-presets-wrap">
              <label className="rt-form-label">Select Fixed Profit Amount</label>
              <div className="rt-preset-chips">
                {[300, 500, 800, 1000, 1500, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setMarkupValue(amt)}
                    className={`rt-preset-chip ${Number(markupValue) === amt ? 'active' : ''}`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="rt-custom-input-row">
                <label className="rt-custom-label">Custom Profit Amount:</label>
                <div className="rt-input-affix-wrap">
                  <span className="rt-affix-tag prefix">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={markupValue}
                    onChange={e => setMarkupValue(e.target.value)}
                    className="rt-affix-input has-prefix"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Price & Profit Breakdown Card */}
          <div className="rt-live-calc-card">
            <div className="rt-calc-row">
              <span>Wholesale Base Cost</span>
              <span>₹{basePrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="rt-calc-row profit-highlight">
              <span>Your Profit Margin ({effectiveMarginPct}%)</span>
              <span className="profit-text">+₹{profitAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="rt-calc-divider" />
            <div className="rt-calc-total-row">
              <div>
                <strong>Customer Sells For:</strong>
                <span className="rt-calc-sub">Visible on your boutique store</span>
              </div>
              <div className="rt-calc-total-price">
                ₹{calculatedPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="rt-modal-footer">
            <button type="button" onClick={onClose} className="rt-btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rt-btn-save-price">
              {saving ? 'Updating…' : <><Check size={16} /> Save New Price</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StorefrontSetupPanel({ 
  storefront, 
  user, 
  liveStoreUrl,
  onCopyLink,
  copied,
  onUpdate 
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);

  const [formData, setFormData] = useState({
    store_name: storefront?.store_name || '',
    slug: storefront?.slug || (user?.email ? user.email.split('@')[0].replace(/[^a-z0-9]/g, '') : 'my-boutique'),
    whatsapp: storefront?.whatsapp || '',
    custom_domain: storefront?.custom_domain || '',
  });

  const apiUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.weave365.com';
    const param = formData.custom_domain 
      ? `domain=${encodeURIComponent(formData.custom_domain.replace(/^https?:\/\//, '').replace(/\/+$/, ''))}`
      : `slug=${encodeURIComponent(formData.slug || 'my-store')}`;
    return `${origin}/api/storefront?${param}`;
  }, [formData.custom_domain, formData.slug]);

  const copyApiUrl = () => {
    navigator.clipboard.writeText(apiUrl);
    setCopiedApiUrl(true);
    setTimeout(() => setCopiedApiUrl(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const cleanSlug = (formData.slug || 'my-store').toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      const cleanDomain = formData.custom_domain && formData.custom_domain.trim()
        ? formData.custom_domain.trim()
        : null;

      const updates = {
        store_name: formData.store_name.trim() || 'My Reseller Boutique',
        slug: cleanSlug,
        whatsapp: formData.whatsapp.trim(),
        custom_domain: cleanDomain,
        is_active: true,
      };

      const { data, error } = await resellerService.updateStorefront(user.id, updates);
      if (error) {
        if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('duplicate key')) {
          if (error.message?.includes('custom_domain') || error.details?.includes('custom_domain')) {
            throw new Error('This custom domain is already registered by another boutique.');
          }
          if (error.message?.includes('slug') || error.details?.includes('slug')) {
            throw new Error(`The store handle "${cleanSlug}" is already taken. Please choose a different handle.`);
          }
        }
        throw error;
      }
      onUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error updating storefront settings:', err);
      alert('Failed to save settings: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="rt-setup-panel">
      {/* Store Configuration Form */}
      <form onSubmit={handleSubmit} className="rt-setup-form">
        <div className="rt-setup-row">
          <div className="rt-setup-label">
            <strong>Boutique Name *</strong>
            <span>Main title displayed on your store</span>
          </div>
          <div className="rt-setup-input-wrap">
            <input 
              type="text" 
              required 
              value={formData.store_name} 
              onChange={e => update('store_name', e.target.value)} 
              placeholder="e.g. AbaZain" 
              className="rt-text-input"
            />
          </div>
        </div>

        <div className="rt-setup-row">
          <div className="rt-setup-label">
            <strong>Store Identifier *</strong>
            <span>Unique handle for your live website</span>
          </div>
          <div className="rt-setup-input-wrap">
            <input 
              type="text" 
              required 
              value={formData.slug} 
              onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
              placeholder="abazain" 
              className="rt-text-input"
            />
            <span className="rt-input-hint">
              Live website URL:{' '}
              <a 
                href={`${TEMPLATE_BASE_URL}/${encodeURIComponent(formData.slug || 'my-boutique')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'var(--gold-dark, #805d31)', fontWeight: 600, textDecoration: 'underline' }}
              >
                {TEMPLATE_BASE_URL}/{formData.slug || 'my-boutique'}
              </a>
            </span>
          </div>
        </div>

        <div className="rt-setup-row">
          <div className="rt-setup-label">
            <strong>WhatsApp Order Number</strong>
            <span>Phone number for direct customer orders</span>
          </div>
          <div className="rt-setup-input-wrap">
            <div className="rt-input-with-icon">
              <Phone size={15} className="rt-input-prefix-icon" />
              <input 
                type="text" 
                value={formData.whatsapp} 
                onChange={e => update('whatsapp', e.target.value)} 
                placeholder="e.g. +91 98765 43210" 
                className="rt-text-input rt-input-has-prefix"
              />
            </div>
            <span className="rt-input-hint">Customer orders and inquiries on your website are forwarded directly to this WhatsApp number.</span>
          </div>
        </div>

        <div className="rt-setup-row">
          <div className="rt-setup-label">
            <strong>External Custom Domain</strong>
            <span>Optional domain if you host your own URL</span>
          </div>
          <div className="rt-setup-input-wrap">
            <div className="rt-input-with-icon">
              <Globe size={15} className="rt-input-prefix-icon" />
              <input 
                type="text" 
                value={formData.custom_domain} 
                onChange={e => update('custom_domain', e.target.value)} 
                placeholder="e.g. https://myboutique.com" 
                className="rt-text-input rt-input-has-prefix"
              />
            </div>
            <span className="rt-input-hint">Leave blank to use your default hosted link above, or enter your custom domain.</span>
          </div>
        </div>

        <div className="rt-setup-submit-row">
          <button type="submit" disabled={saving} className={`rt-submit-btn ${saved ? 'saved' : ''}`}>
            {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </form>

      <div className="rt-setup-divider" />

      {/* Developer API Feed */}
      <div className="rt-api-strip">
        <div className="rt-api-strip-left">
          <Code size={16} />
          <div>
            <strong>Developer Products Feed (JSON)</strong>
            <span>Live REST API feed for custom frontend developers</span>
          </div>
        </div>
        <div className="rt-api-strip-right">
          <code className="rt-api-code-text">{apiUrl}</code>
          <button 
            type="button" 
            onClick={copyApiUrl} 
            className="rt-api-copy-pill"
            title="Copy API Feed URL"
          >
            {copiedApiUrl ? <Check size={13} /> : <Copy size={13} />}
            {copiedApiUrl ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
