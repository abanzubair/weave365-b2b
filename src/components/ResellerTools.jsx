/**
 * ResellerTools Component
 * Purpose: Handles the back-office dashboard for registered boutique resellers.
 * Manages external website links, catalog items added from Weave365, pricing markups, and API integration feeds.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Trash2, 
  Settings, 
  Calendar,
  Save,
  ExternalLink,
  Search,
  Globe,
  Code,
  Sparkles,
  ArrowRight,
  Package,
  LayoutTemplate,
  Terminal,
  BookOpen,
  Layers,
  X,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';
import { resellerService, normalizeWebsiteUrl } from '../services/resellerService';
import { getProductCategorySlug } from '../config.js';
import { PREMADE_TEMPLATES } from '../config/templates.js';
import '../styles/resellerTools.css';

export function ResellerTools({ user, buyerProfile }) {
  const [activeTab, setActiveTab] = useState('templates');
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
  const selectedTemplateId = storefront?.theme_settings?.template_id || 'ecom-template-1';

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

  return (
    <div className="rt-container">
      {/* Distilled Store Header */}
      <div className="rt-header">
        <div className="rt-header-main">
          <div className="rt-header-left">
            <h2 className="rt-store-name">{storefront?.store_name || 'My Reseller Boutique'}</h2>

            {externalWebsiteUrl ? (
              <div className="rt-url-chip" onClick={copyWebsiteLink} title="Click to copy store link">
                <Globe size={13} className="rt-url-icon" />
                <span className="rt-url-text">{externalWebsiteUrl}</span>
                <span className="rt-url-copy-hint">{copied ? 'Copied' : 'Copy'}</span>
              </div>
            ) : (
              <span className="rt-unlinked-text">
                Select a template below or enter your website URL in settings.
              </span>
            )}
          </div>

          <div className="rt-header-actions">
            {externalWebsiteUrl ? (
              <a 
                href={externalWebsiteUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="rt-action-btn primary"
              >
                <span>Open Live Store ↗</span>
              </a>
            ) : (
              <button 
                type="button" 
                onClick={() => setActiveTab('storefront')} 
                className="rt-action-btn primary"
              >
                <Globe size={14} />
                <span>Configure Website</span>
              </button>
            )}
          </div>
        </div>

        {/* Distilled Metadata Strip */}
        <div className="rt-header-stats-strip">
          <span className="rt-stat-item">
            <strong>{shares.filter(s => s.is_active).length}</strong> Products in Catalog
          </span>
          <span className="rt-stat-divider" />
          <span className="rt-stat-item">
            Theme: <strong>{PREMADE_TEMPLATES.find(t => t.id === selectedTemplateId)?.name || 'VRTX Modern Studio'}</strong>
          </span>
          <span className="rt-stat-divider" />
          <span className="rt-stat-item" style={{ color: '#166534' }}>
            ✓ Wholesale Costs Confidential
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="rt-tabs-bar">
        <div className="rt-tabs">
          <button 
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`rt-tab ${activeTab === 'templates' ? 'active' : ''}`}
          >
            <LayoutTemplate size={15} /> 
            <span>Store Templates</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('shares')}
            className={`rt-tab ${activeTab === 'shares' ? 'active' : ''}`}
          >
            <Package size={15} /> 
            <span>Catalog ({shares.filter(s => s.is_active).length})</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('storefront')}
            className={`rt-tab ${activeTab === 'storefront' ? 'active' : ''}`}
          >
            <Settings size={15} /> 
            <span>Website Settings</span>
          </button>
        </div>
      </div>

      {/* Tab 0: Pre-Made Storefront Templates */}
      {activeTab === 'templates' && (
        <div className="rt-templates-section">
          <div className="rt-section-header">
            <div>
              <h3 className="rt-section-title">Storefront Templates</h3>
              <p className="rt-section-subtitle">
                Choose a ready design for your boutique. Sarees added from Weave365 sync automatically with your retail markup prices and WhatsApp checkout.
              </p>
            </div>
          </div>

          <div className="rt-templates-grid">
            {PREMADE_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              const isReady = tmpl.status === 'ready';

              return (
                <div key={tmpl.id} className={`rt-template-card ${isSelected ? 'selected' : ''}`}>
                  <div className="rt-template-preview-wrap">
                    <img src={tmpl.previewImage} alt={tmpl.name} className="rt-template-preview-img" />
                    <div className="rt-template-badges">
                      {isSelected && (
                        <span className="rt-tmpl-badge active">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                      <span className={`rt-tmpl-badge ${tmpl.badgeType}`}>
                        {tmpl.badge}
                      </span>
                    </div>
                  </div>

                  <div className="rt-template-body">
                    <div className="rt-template-top">
                      <span className="rt-template-category">{tmpl.category}</span>
                      <h4 className="rt-template-title">{tmpl.name}</h4>
                    </div>

                    <p className="rt-template-desc">{tmpl.description}</p>

                    {/* Key Feature Highlights */}
                    <div className="rt-template-features">
                      {tmpl.features.slice(0, 2).map((feat, idx) => (
                        <div key={idx} className="rt-template-feature-row">
                          <CheckCircle2 size={13} className="rt-feature-bullet" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="rt-template-actions">
                      {isReady ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSelectTemplate(tmpl.id)}
                            className={`rt-tmpl-btn ${isSelected ? 'selected' : 'primary'}`}
                          >
                            {isSelected ? (
                              <><Check size={14} /> Active</>
                            ) : (
                              'Select Template'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setGuideTemplate(tmpl)}
                            className="rt-tmpl-btn secondary"
                          >
                            <Globe size={14} /> Details
                          </button>
                        </>
                      ) : (
                        <button type="button" disabled className="rt-tmpl-btn disabled">
                          Coming Soon
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Tab 1: Catalog Items Added to Website */}
      {activeTab === 'shares' && (
        shares.length === 0 ? (
          <div className="rt-empty-state-card">
            <div className="rt-empty-icon-wrap">
              <Package size={32} />
            </div>
            <h4>Your store catalog is currently empty</h4>
            <p>
              Browse sarees or textiles on Weave365 and click <strong>Add to My Store</strong> on any design. Set your profit markup and it will immediately appear on your boutique website.
            </p>
          </div>
        ) : (
          <div className="rt-shares-container">
            <div className="rt-filters">
              <div className="rt-filter-search">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search your catalog products..." 
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
                <option value="live">Visible on Website</option>
                <option value="removed">Hidden / Removed</option>
              </select>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="rt-filter-select"
              >
                <option value="newest">Newest Added First</option>
                <option value="oldest">Oldest Added First</option>
                <option value="a-z">Product Name (A to Z)</option>
              </select>
            </div>

            <div className="rt-link-list" onScroll={handleScroll} style={{ maxHeight: '550px', overflowY: 'auto' }}>
              {processedShares.slice(0, visibleCount).map((share) => {
                const markupLabel = share.default_markup_type === 'percentage' 
                  ? `+${share.default_markup_value}% markup`
                  : share.default_markup_type === 'fixed_amount'
                    ? `+₹${share.default_markup_value} markup`
                    : 'Custom price';

                return (
                  <div key={share.id} className={`rt-link-row ${!share.is_active ? 'rt-row-inactive' : ''}`}>
                    <div className="rt-link-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{share.title || 'Untitled Product'}</strong>
                        <span className={`rt-badge ${share.is_active ? 'on' : 'off'}`}>
                          {share.is_active ? 'Visible on Website' : 'Hidden'}
                        </span>
                      </div>
                      <span className="rt-link-meta">
                        <Calendar size={12} />
                        <span>Added: {new Date(share.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="rt-dot"></span>
                        <span className="rt-markup-tag">{markupLabel}</span>
                      </span>
                    </div>
                    <div className="rt-link-actions">
                      {share.is_active && (
                        <button 
                          type="button" 
                          onClick={() => handleDeactivate(share.id)} 
                          className="rt-icon-btn danger" 
                          title="Remove from your boutique website"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {processedShares.length === 0 && (
                <div className="rt-empty" style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <p>No products match your current search or filter.</p>
                </div>
              )}
            </div>
            
            {visibleCount < processedShares.length && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--muted)', fontSize: '0.8125rem' }}>
                Scroll down to load more products...
              </div>
            )}
          </div>
        )
      )}

      {/* Tab 2: Website & API Settings */}
      {activeTab === 'storefront' && (
        <StorefrontSettings 
          storefront={storefront} 
          user={user} 
          origin={origin} 
          onUpdate={setStorefront} 
        />
      )}

      {/* Simplified Storefront Details & Link Modal */}
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
            <LayoutTemplate size={20} className="rt-modal-icon" />
            <div>
              <h3>{template.name}</h3>
              <p>Storefront Template Design</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rt-modal-close" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="rt-modal-content">
          {/* Active Status Badge */}
          <div className="rt-modal-status-banner">
            <div className="rt-status-pill">
              <span className="rt-status-dot live"></span>
              {isSelected ? 'Currently Selected Template' : 'Available Storefront Template'}
            </div>
            <p className="rt-modal-status-text">
              {template.description}
            </p>
          </div>

          {/* Your Live Store Link Box */}
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
              <span className="rt-store-link-tip">
                Share this link on your WhatsApp Status, Instagram Bio, or broadcast groups to take customer orders.
              </span>
            </div>
          </div>

          {/* Automatic Features */}
          <div className="rt-easy-features-grid">
            <div className="rt-easy-feature-card">
              <Sparkles size={18} className="rt-easy-icon" />
              <div>
                <strong>Automatic Product Sync</strong>
                <p>Every saree or textile added from Weave365 appears on your site with high-resolution imagery.</p>
              </div>
            </div>
            <div className="rt-easy-feature-card">
              <CheckCircle2 size={18} className="rt-easy-icon" />
              <div>
                <strong>Protected Profit Margins</strong>
                <p>Customers only see your customized selling prices. Wholesale purchase costs remain completely confidential.</p>
              </div>
            </div>
            <div className="rt-easy-feature-card">
              <Package size={18} className="rt-easy-icon" />
              <div>
                <strong>Direct WhatsApp Orders</strong>
                <p>Customer checkout orders and questions route straight to your WhatsApp number.</p>
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
              <Check size={16} /> Use {template.name} for My Boutique
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StorefrontSettings({ storefront, user, origin, onUpdate }) {
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
    <div className="rt-settings-layout">
      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="rt-settings-form">
        <div className="rt-settings-form-head">
          <Globe size={20} className="rt-settings-head-icon" />
          <div>
            <h4>External Website & Domain Setup</h4>
            <p>Configure where your boutique website is hosted so your product links and share buttons connect properly.</p>
          </div>
        </div>

        <div className="rt-form-row">
          <label htmlFor="rt-store-name">Boutique / Store Name *</label>
          <input 
            id="rt-store-name" 
            type="text" 
            required 
            value={formData.store_name} 
            onChange={e => update('store_name', e.target.value)} 
            placeholder="e.g. Aria Heritage Sarees" 
          />
          <span className="rt-field-hint">Displayed as the main brand title on your boutique website.</span>
        </div>

        <div className="rt-form-row">
          <label htmlFor="rt-custom-domain">External Website URL *</label>
          <div className="rt-input-with-icon">
            <Globe size={16} className="rt-input-prefix-icon" />
            <input 
              id="rt-custom-domain" 
              type="text" 
              value={formData.custom_domain} 
              onChange={e => update('custom_domain', e.target.value)} 
              placeholder="e.g. https://myboutique.com or https://ecom-template-1-tau.vercel.app" 
              className="rt-input-has-prefix"
            />
          </div>
          <span className="rt-field-hint">
            Paste your live store URL. When you share products with customers, all links will direct here.
          </span>
        </div>

        <div className="rt-form-row">
          <label htmlFor="rt-slug">Store Identifier (Slug) *</label>
          <input 
            id="rt-slug" 
            type="text" 
            required 
            value={formData.slug} 
            onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} 
            placeholder="my-boutique-slug" 
          />
          <span className="rt-field-hint">A unique short name used to identify your store catalog in links and data feeds.</span>
        </div>

        <button type="submit" disabled={saving} className={`rt-save-btn ${saved ? 'saved' : ''}`}>
          {saved ? <><Check size={16} /> Settings Saved Successfully</> : saving ? 'Saving Changes…' : <><Save size={16} /> Save Website Settings</>}
        </button>
      </form>

      {/* Website API Integration Guide */}
      <div className="rt-integration-card">
        <div className="rt-integration-header">
          <div className="rt-integration-title">
            <Code size={18} />
            <h4>Live JSON Products Feed (For Custom Developers)</h4>
          </div>
          <span className="rt-api-badge">REST API</span>
        </div>

        <p className="rt-integration-desc">
          If you or your developer are building a custom website from scratch, consume your live products directly from this endpoint:
        </p>

        <div className="rt-api-endpoint-box">
          <div className="rt-api-endpoint-label">Live JSON Products Endpoint:</div>
          <div className="rt-api-endpoint-row">
            <code className="rt-api-url">{apiUrl}</code>
            <button 
              type="button" 
              onClick={copyApiUrl} 
              className="rt-api-copy-btn"
              title="Copy API URL"
            >
              {copiedApiUrl ? <Check size={14} /> : <Copy size={14} />}
              {copiedApiUrl ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="rt-integration-points">
          <div className="rt-integration-point">
            <Sparkles size={16} className="rt-point-icon" />
            <div>
              <strong>Instant Catalog Sync</strong>
              <span>Adding or editing products in Weave365 updates this feed immediately in real time.</span>
            </div>
          </div>
          <div className="rt-integration-point">
            <CheckCircle2 size={16} className="rt-point-icon" style={{ color: '#166534' }} />
            <div>
              <strong>Protected Profit Margins</strong>
              <span>Wholesale base prices are never exposed; buyer prices are pre-calculated with your profit markup.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


