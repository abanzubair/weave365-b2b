import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { resellerService } from '../services/resellerService';

export function ResellerTools({ user, buyerProfile }) {
  const [activeTab, setActiveTab] = useState('shares');
  const [shares, setShares] = useState([]);
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sharesRes, storefrontRes] = await Promise.all([
          resellerService.getResellerShares(user.id),
          resellerService.getStorefront(user.id)
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
  }, [user.id]);

  const catalogLink = storefront?.slug ? `${origin || ''}/s/${storefront.slug}` : null;

  const copyCatalogLink = () => {
    if (!catalogLink) return;
    navigator.clipboard.writeText(catalogLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeactivate = async (shareId) => {
    const { error } = await resellerService.deactivateShare(shareId);
    if (!error) {
      setShares(prev => prev.map(s => s.id === shareId ? { ...s, is_active: false } : s));
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
          <div className="rt-link-list">
            {shares.map((share) => (
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
          </div>
        )
      )}

      {activeTab === 'storefront' && (
        <StorefrontSettings storefront={storefront} user={user} origin={origin} onUpdate={setStorefront} />
      )}

      {activeTab === 'inquiries' && (
        <div className="rt-empty">
          <MessageSquare size={20} />
          <p>Customer leads from your catalog will appear here.</p>
        </div>
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
      <button type="submit" disabled={saving} className={`rt-save-btn ${saved ? 'saved' : ''}`}>
        {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : <><Save size={14} /> Save Settings</>}
      </button>
    </form>
  );
}
