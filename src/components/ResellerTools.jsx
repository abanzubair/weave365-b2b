import React, { useState, useEffect, useMemo } from 'react';
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Trash2, 
  Settings, 
  MessageSquare, 
  Eye,
  Calendar,
  Save,
  ExternalLink,
  Search
} from 'lucide-react';
import { resellerService } from '../services/resellerService';

export function ResellerTools({ user, buyerProfile }) {
  const [activeTab, setActiveTab] = useState('shares');
  const [shares, setShares] = useState([]);
  const [storefront, setStorefront] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  // Catalog List State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(10);


  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sharesRes, storefrontRes, inquiriesRes] = await Promise.all([
          resellerService.getResellerShares(user.id),
          resellerService.getStorefront(user.id),
          resellerService.getResellerInquiries(user.id)
        ]);
        if (sharesRes.data) setShares(sharesRes.data);
        if (storefrontRes.data) setStorefront(storefrontRes.data);
        if (inquiriesRes.data) setInquiries(inquiriesRes.data);
      } catch (err) {
        console.error('Error loading reseller data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.id]);

  const catalogLink = storefront?.slug ? `${origin || ''}/s/${storefront.slug}` : null;

  const copyCatalogLink = () => {
    if (!catalogLink) return;
    navigator.clipboard.writeText(catalogLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteInquiry = async (id) => {
    const { error } = await resellerService.deleteInquiry(id);
    if (!error) {
      setInquiries(prev => prev.filter(inq => inq.id !== id));
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
        setVisibleCount(prev => prev + 10);
      }
    }
  };

  if (loading) return <p className="rt-loading">Loading reseller tools…</p>;


  return (
    <div className="rt-container">
      {/* Compact Header Bar */}
      <div className="rt-header">
        <div className="rt-header-left">
          <h3>Reseller Tools</h3>
          <span className="rt-header-sub">Your white-label catalog</span>
        </div>
        <div className="rt-header-right">
          {catalogLink && (
            <>
              <button onClick={copyCatalogLink} className="rt-header-link" title="Copy catalog link">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a href={catalogLink} target="_blank" rel="noopener noreferrer" className="rt-header-link">
                <ExternalLink size={14} /> View
              </a>
            </>
          )}
        </div>
      </div>

      {/* Compact Tabs */}
      <div className="rt-tabs">
        {[
          { key: 'shares', icon: LinkIcon, label: 'Catalog Items' },
          { key: 'storefront', icon: Settings, label: 'Settings' },
          { key: 'inquiries', icon: MessageSquare, label: 'Leads' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rt-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'shares' && (
        shares.length === 0 ? (
          <div className="rt-empty">
            <LinkIcon size={20} />
            <p>No products in your catalog. Use <strong>Catalog Link</strong> on any product to add it.</p>
          </div>
        ) : (
          <div className="rt-shares-container">
            <div className="rt-filters">
              <div className="rt-filter-search">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
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
                <option value="all">All Status</option>
                <option value="live">Live</option>
                <option value="removed">Removed</option>
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

            <div className="rt-link-list" onScroll={handleScroll} style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {processedShares.slice(0, visibleCount).map((share) => (
                <div key={share.id} className={`rt-link-row ${!share.is_active ? 'rt-row-inactive' : ''}`}>
                  <div className="rt-link-info">
                    <strong>{share.title || 'Untitled Product'}</strong>
                    <span className="rt-link-meta">
                      <Calendar size={11} />
                      {new Date(share.created_at).toLocaleDateString()}
                      <span className={`rt-badge ${share.is_active ? 'on' : 'off'}`}>
                        {share.is_active ? 'Live' : 'Removed'}
                      </span>
                    </span>
                  </div>
                  <div className="rt-link-actions">
                    {share.is_active && (
                      <button onClick={() => handleDeactivate(share.id)} className="rt-icon-btn danger" title="Remove from catalog">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {processedShares.length === 0 && (
                <div className="rt-empty" style={{ padding: '2rem 0' }}>
                   <p>No products match your filters.</p>
                </div>
              )}
            </div>
            
            {visibleCount < processedShares.length && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--reseller-muted)', fontSize: '0.85rem' }}>
                Scroll for more...
              </div>
            )}
          </div>
        )
      )}


      {activeTab === 'storefront' && (
        <StorefrontSettings storefront={storefront} user={user} origin={origin} onUpdate={setStorefront} />
      )}

      {activeTab === 'inquiries' && (
        inquiries.length === 0 ? (
          <div className="rt-empty">
            <MessageSquare size={20} />
            <p>WhatsApp inquiries from your customers will appear here.</p>
          </div>
        ) : (
          <div className="rt-link-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {inquiries.map((inq) => {
              const productId = inq.items?.[0]?.product_id || inq.product_id;
              const displayTitle = inq.items?.[0]?.product_title || inq.message || inq.customer_name || 'WhatsApp Enquiry';
              
              return (
              <div key={inq.id} className="rt-link-row">
                <div className="rt-link-info">
                  <strong>{displayTitle}</strong>
                  <span className="rt-link-meta">
                    <Calendar size={11} />
                    {new Date(inq.created_at).toLocaleString()}
                    {inq.status && (
                      <span className={`rt-badge ${inq.status === 'new' ? 'on' : 'off'}`}>
                        {inq.status.toUpperCase()}
                      </span>
                    )}
                  </span>
                </div>
                <div className="rt-link-actions" style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <a 
                    href={productId ? `/product/${productId}` : '#'} 
                    target={productId ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="rt-header-link" 
                    style={{ 
                      background: productId ? 'var(--reseller-primary)' : '#94a3b8', 
                      borderColor: 'transparent', 
                      color: 'white', 
                      textDecoration: 'none',
                      pointerEvents: productId ? 'auto' : 'none',
                      opacity: productId ? 1 : 0.7
                    }}
                    title={productId ? "View Product on Weave 365" : "This was a general catalog inquiry or an older lead without a linked product"}
                  >
                    <ExternalLink size={14} /> {productId ? 'Product' : 'General'}
                  </a>
                  <a 
                    href={inq.customer_phone ? `https://wa.me/${inq.customer_phone}` : `https://web.whatsapp.com/`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rt-header-link"
                    style={{ background: '#25D366', color: 'white', borderColor: 'transparent', textDecoration: 'none' }}
                    title="Reply on WhatsApp"
                  >
                    <MessageSquare size={14} /> Reply
                  </a>
                  <button 
                    onClick={() => handleDeleteInquiry(inq.id)} 
                    className="rt-icon-btn danger" 
                    title="Delete Lead"
                    style={{ padding: '0.375rem 0.5rem', marginLeft: '0.25rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function StorefrontSettings({ storefront, user, origin, onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    store_name: storefront?.store_name || '',
    slug: storefront?.slug || '',
    whatsapp: storefront?.whatsapp || '',
    logo_url: storefront?.logo_url || '',
    theme_color: storefront?.theme_color || 'theme-classic-luxury',
  });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { data, error } = await resellerService.updateStorefront(user.id, formData);
      if (error) throw error;
      onUpdate(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error updating storefront:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  return (
    <form onSubmit={handleSubmit} className="rt-settings-form">
      <div className="rt-form-row">
        <label htmlFor="rt-store-name">Store Name</label>
        <input id="rt-store-name" type="text" required value={formData.store_name} onChange={e => update('store_name', e.target.value)} placeholder="My Premium Textiles" />
      </div>
      <div className="rt-form-row">
        <label htmlFor="rt-slug">URL Slug</label>
        <div className="rt-slug-wrap">
          <span className="rt-slug-prefix">{origin || ''}/s/</span>
          <input id="rt-slug" type="text" required value={formData.slug} onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="my-store" />
        </div>
      </div>
      <div className="rt-form-row">
        <label htmlFor="rt-whatsapp">WhatsApp</label>
        <input id="rt-whatsapp" type="text" required value={formData.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="919876543210" />
      </div>
      <div className="rt-form-row">
        <label htmlFor="rt-logo">Logo URL</label>
        <input id="rt-logo" type="text" value={formData.logo_url} onChange={e => update('logo_url', e.target.value)} placeholder="https://..." />
      </div>
      
      <div className="rt-form-row">
        <label>Store Theme</label>
        <div className="rt-theme-grid">
          {[
            { id: 'theme-classic-luxury', label: 'Classic Luxury', colors: ['#1C1917', '#CA8A04'] },
            { id: 'theme-midnight-royal', label: 'Midnight Royal', colors: ['#1E3A8A', '#CA8A04'] },
            { id: 'theme-rose-silk', label: 'Rose Silk', colors: ['#7F1D1D', '#E11D48'] },
            { id: 'theme-emerald-weave', label: 'Emerald Weave', colors: ['#064E3B', '#059669'] },
          ].map(t => (
            <div 
              key={t.id} 
              className={`rt-theme-card ${formData.theme_color === t.id ? 'selected' : ''}`}
              onClick={() => update('theme_color', t.id)}
            >
              <div className="rt-theme-preview" style={{ background: t.colors[0] }}>
                <div className="rt-theme-accent" style={{ background: t.colors[1] }} />
              </div>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className={`rt-save-btn ${saved ? 'saved' : ''}`}>
        {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : <><Save size={14} /> Save Settings</>}
      </button>
    </form>
  );
}
