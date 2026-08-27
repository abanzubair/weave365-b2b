/**
 * ResellerTools Component
 * Purpose: Clean, distilled back-office dashboard for registered boutique resellers.
 * Provides easy catalog management, profit markup visibility, and ready template setup.
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
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { resellerService, normalizeWebsiteUrl } from '../services/resellerService';
import { PREMADE_TEMPLATES } from '../config/templates.js';
import '../styles/resellerTools.css';

export function ResellerTools({ user, buyerProfile, navigate }) {
  const [activeTab, setActiveTab] = useState('shares');
  const [shares, setShares] = useState([]);
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const [guideTemplate, setGuideTemplate] = useState(null);

  // Catalog List State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [sharesRes, storefrontRes] = await Promise.all([
          resellerService.getResellerShares(user.id),
          resellerService.getStorefront(user.id),
        ]);
        if (sharesRes.data) setShares(sharesRes.data);
        if (storefrontRes.data) setStorefront(storefrontRes.data);
      } catch (err) {
        console.error('Error loading reseller data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const rawWebsiteUrl = storefront?.custom_domain || '';
  const externalWebsiteUrl = rawWebsiteUrl ? normalizeWebsiteUrl(rawWebsiteUrl) : '';
  const selectedTemplateId = storefront?.theme_settings?.template_id || null;
  const activeSharesCount = shares.filter(s => s.is_active).length;

  const copyWebsiteLink = () => {
    if (!externalWebsiteUrl) return;
    navigator.clipboard.writeText(externalWebsiteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectTemplate = async (templateId) => {
    if (!user?.id) return;
    try {
      const currentThemeSettings = storefront?.theme_settings || {};
      const updates = {
        theme_settings: {
          ...currentThemeSettings,
          template_id: templateId
        }
      };
      const { data, error } = await resellerService.updateStorefront(user.id, updates);
      if (!error && data) {
        setStorefront(data);
      }
    } catch (err) {
      console.error('Error updating selected template:', err);
    }
  };

  const handleDeactivate = async (shareId) => {
    const { error } = await resellerService.deactivateShare(shareId);
    if (!error) {
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_active: false } : s));
    }
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

  const readyTemplate = PREMADE_TEMPLATES[0];

  return (
    <div className="rt-container">
      {/* Sleek, Clean Top Overview */}
      <div className="rt-top-summary">
        <div className="rt-summary-left">
          <div className="rt-boutique-title-row">
            <h3 className="rt-store-name">{storefront?.store_name || 'My Reseller Boutique'}</h3>
            {externalWebsiteUrl ? (
              <div className="rt-url-chip" onClick={copyWebsiteLink} title="Click to copy live website link">
                <Globe size={13} className="rt-url-icon" />
                <span className="rt-url-text">{externalWebsiteUrl}</span>
                <span className="rt-url-copy-hint">{copied ? 'Copied' : 'Copy'}</span>
              </div>
            ) : (
              <span className="rt-unlinked-pill">No store website linked</span>
            )}
          </div>
          <div className="rt-summary-meta">
            <span><strong>{activeSharesCount}</strong> products in catalog</span>
            <span className="rt-dot-sep">·</span>
            <span>Wholesale base costs confidential</span>
          </div>
        </div>

        <div className="rt-summary-actions">
          {externalWebsiteUrl ? (
            <a 
              href={externalWebsiteUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="rt-open-store-btn"
            >
              <span>Open Live Store</span>
              <ExternalLink size={13} />
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
          <span>Storefront & Website Setup</span>
        </button>
      </div>

      {/* TAB 1: CATALOG PRODUCTS */}
      {activeTab === 'shares' && (
        shares.length === 0 ? (
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
            <div className="rt-filters">
              <div className="rt-filter-search">
                <Search size={15} />
                <input 
                  type="text" 
                  placeholder="Search catalog products..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rt-filter-input"
                />
              </div>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="rt-filter-select"
              >
                <option value="all">All Products</option>
                <option value="live">Visible on Store</option>
                <option value="removed">Hidden</option>
              </select>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="rt-filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">Name (A-Z)</option>
              </select>
            </div>

            <div className="rt-link-list" onScroll={handleScroll}>
              {processedShares.slice(0, visibleCount).map((share) => {
                const markupLabel = share.default_markup_type === 'percentage' 
                  ? `+${share.default_markup_value}% markup`
                  : share.default_markup_type === 'fixed_amount'
                    ? `+₹${share.default_markup_value} markup`
                    : 'Custom price';

                return (
                  <div key={share.id} className={`rt-link-row ${!share.is_active ? 'rt-row-inactive' : ''}`}>
                    <div className="rt-link-info">
                      <div className="rt-link-title-row">
                        <strong>{share.title || 'Untitled Product'}</strong>
                        <span className={`rt-badge ${share.is_active ? 'on' : 'off'}`}>
                          {share.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <div className="rt-link-meta">
                        <span><Calendar size={12} /> Added {new Date(share.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span className="rt-markup-tag">{markupLabel}</span>
                      </div>
                    </div>
                    <div className="rt-link-actions">
                      {share.is_active && (
                        <button 
                          type="button" 
                          onClick={() => handleDeactivate(share.id)} 
                          className="rt-icon-btn danger" 
                          title="Remove from your boutique"
                        >
                          <Trash2 size={14} />
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
          origin={origin}
          selectedTemplateId={selectedTemplateId}
          templates={PREMADE_TEMPLATES}
          onSelectTemplate={handleSelectTemplate}
          onOpenDetails={(tmpl) => setGuideTemplate(tmpl)}
          onUpdate={setStorefront}
        />
      )}

      {/* Template Details Modal */}
      {guideTemplate && (
        <TemplateDetailsModal 
          template={guideTemplate}
          storefront={storefront}
          user={user}
          origin={origin}
          onClose={() => setGuideTemplate(null)}
          onSelectTemplate={handleSelectTemplate}
          isSelected={selectedTemplateId === guideTemplate.id}
        />
      )}
    </div>
  );
}

function TemplateDetailsModal({ template, storefront, user, origin, onClose, onSelectTemplate, isSelected }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const slug = storefront?.slug || (user?.email ? user.email.split('@')[0].replace(/[^a-z0-9]/g, '') : 'my-boutique');
  const baseOrigin = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://weave365.in');
  const rawCustomDomain = storefront?.custom_domain || '';
  const liveStoreUrl = rawCustomDomain ? normalizeWebsiteUrl(rawCustomDomain) : `${baseOrigin}/s/${slug}`;

  const copyStoreLink = () => {
    navigator.clipboard.writeText(liveStoreUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="rt-modal-overlay" onClick={onClose}>
      <div className="rt-modal-card" onClick={e => e.stopPropagation()}>
        <div className="rt-modal-header">
          <div className="rt-modal-header-left">
            <div>
              <h3>{template.name}</h3>
              <p>Storefront Template Details</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rt-modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="rt-modal-content">
          <div className="rt-modal-status-banner">
            <div className="rt-status-pill">
              <span className={`rt-status-dot ${isSelected ? 'live' : ''}`}></span>
              {isSelected ? 'Active Selected Template' : 'Ready to Activate'}
            </div>
            <p className="rt-modal-status-text">
              {template.description}
            </p>
          </div>

          <div className="rt-store-link-box">
            <span className="rt-store-link-label">Your Live Storefront Link:</span>
            <div className="rt-store-link-input-group">
              <input 
                type="text" 
                readOnly 
                value={liveStoreUrl} 
                className="rt-store-url-field"
                onClick={e => e.currentTarget.select()}
              />
              <button 
                type="button" 
                onClick={copyStoreLink} 
                className="rt-btn-copy-link"
              >
                {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <div className="rt-store-link-actions">
              <a 
                href={liveStoreUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="rt-btn-visit-store"
              >
                <ExternalLink size={14} /> Open Live Store
              </a>
            </div>
          </div>

          <div className="rt-easy-features-grid">
            <div className="rt-easy-feature-card">
              <Sparkles size={16} className="rt-easy-icon" />
              <div>
                <strong>Automatic Product Sync</strong>
                <p>Textiles added from Weave365 appear on your site with high-resolution imagery.</p>
              </div>
            </div>
            <div className="rt-easy-feature-card">
              <CheckCircle2 size={16} className="rt-easy-icon" style={{ color: '#166534' }} />
              <div>
                <strong>Protected Profit Margins</strong>
                <p>Customers only see your selling prices. Wholesale costs remain completely confidential.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rt-modal-footer">
          <button type="button" onClick={onClose} className="rt-btn-secondary">
            Close
          </button>
          {!isSelected && (
            <button
              type="button"
              onClick={() => {
                onSelectTemplate(template.id);
                onClose();
              }}
              className="rt-btn-primary"
            >
              <Check size={16} /> Use {template.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StorefrontSetupPanel({ 
  storefront, 
  user, 
  origin, 
  selectedTemplateId, 
  templates = [], 
  onSelectTemplate, 
  onOpenDetails, 
  onUpdate 
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedApiUrl, setCopiedApiUrl] = useState(false);

  const [formData, setFormData] = useState({
    store_name: storefront?.store_name || '',
    slug: storefront?.slug || (user?.email ? user.email.split('@')[0].replace(/[^a-z0-9]/g, '') : 'my-boutique'),
    custom_domain: storefront?.custom_domain || '',
  });

  const apiUrl = useMemo(() => {
    const base = origin || (typeof window !== 'undefined' ? window.location.origin : 'https://weave365.in');
    const param = formData.custom_domain 
      ? `domain=${encodeURIComponent(formData.custom_domain.replace(/^https?:\/\//, '').replace(/\/+$/, ''))}`
      : `slug=${encodeURIComponent(formData.slug || 'my-store')}`;
    return `${base}/api/storefront?${param}`;
  }, [origin, formData.custom_domain, formData.slug]);

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
      const cleanDomain = formData.custom_domain ? formData.custom_domain.trim() : '';

      const updates = {
        store_name: formData.store_name.trim() || 'My Reseller Boutique',
        slug: cleanSlug,
        custom_domain: cleanDomain,
        is_active: true,
      };

      const { data, error } = await resellerService.updateStorefront(user.id, updates);
      if (error) throw error;
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
    <div className="rt-setup-card">
      {/* 1. Themes List */}
      {templates && templates.length > 0 && (
        <div className="rt-setup-row">
          <div className="rt-setup-label">
            <strong>Storefront Themes</strong>
            <span>Select a pre-built luxury theme for your boutique</span>
          </div>
          <div className="rt-themes-list">
            {templates.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              const isComingSoon = tmpl.status === 'coming_soon';

              return (
                <div key={tmpl.id} className={`rt-theme-tile ${isSelected ? 'is-active-theme' : ''}`}>
                  <div className="rt-theme-tile-thumb">
                    <img src={tmpl.previewImage} alt={tmpl.name} />
                  </div>
                  <div className="rt-theme-tile-body">
                    <div className="rt-theme-tile-title-row">
                      <span className="rt-theme-tile-name">{tmpl.name}</span>
                      {isComingSoon && <span className="rt-theme-badge-soon">Coming Soon</span>}
                    </div>
                    <div className="rt-theme-tile-desc">{tmpl.tagline || tmpl.description}</div>
                  </div>
                  <div className="rt-theme-tile-actions">
                    {isComingSoon ? (
                      <button type="button" disabled className="rt-theme-btn disabled">
                        Coming Soon
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectTemplate(tmpl.id)}
                        className={`rt-theme-btn ${isSelected ? 'active' : 'primary'}`}
                      >
                        {isSelected ? <><Check size={13} /> Active</> : 'Use Template'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenDetails(tmpl)}
                      className="rt-theme-btn subtle"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rt-setup-divider" />

      {/* 2. Store & Domain Form */}
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
              placeholder="e.g. Aria Heritage Sarees" 
              className="rt-text-input"
            />
          </div>
        </div>

        <div className="rt-setup-row">
          <div className="rt-setup-label">
            <strong>Store Identifier *</strong>
            <span>Unique handle for your store links</span>
          </div>
          <div className="rt-setup-input-wrap">
            <input 
              type="text" 
              required 
              value={formData.slug} 
              onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
              placeholder="my-boutique" 
              className="rt-text-input"
            />
          </div>
        </div>

        <div className="rt-setup-row">
          <div className="rt-setup-label">
            <strong>External Website URL</strong>
            <span>Optional domain if you host your own site</span>
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
            <span className="rt-input-hint">Shared product links will connect customers here.</span>
          </div>
        </div>

        <div className="rt-setup-submit-row">
          <button type="submit" disabled={saving} className={`rt-submit-btn ${saved ? 'saved' : ''}`}>
            {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </form>

      <div className="rt-setup-divider" />

      {/* 3. Developer API - Tucked into a sleek 1-line bar */}
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


