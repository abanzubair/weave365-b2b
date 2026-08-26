/**
 * @file DeveloperDashboard.jsx
 * @description Unified Developer & API Integration Dashboard for Weave365.
 * Serves both User Mode (inside Account / Reseller portal) and Admin Mode (inspected by Admin).
 * Features live usage gauges, quota meters, platform integration scripts (Shopify, WooCommerce, PrestaShop),
 * and an interactive API test console.
 * 
 * @module components/developer/DeveloperDashboard
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Activity,
  Server,
  Globe,
  Code2,
  Play,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Shield,
  Layers,
  ShoppingBag,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Trash2,
  BookOpen,
  Search,
  Filter,
  CheckSquare,
  Square,
  PackageCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { developerService, TIER_CONFIGS } from '../../services/developerService.js';
import { fetchProducts } from '../../productData.js';
import '../../styles/developerDashboard.css';

export function DeveloperDashboard({
  user,
  buyerProfile,
  apiKeyRecord: initialKeyRecord,
  isAdminMode = false,
  onAdminUpdate,
}) {
  const [apiKey, setApiKey] = useState(initialKeyRecord || null);
  const [loading, setLoading] = useState(!initialKeyRecord);
  const [revealedKey, setRevealedKey] = useState(null); // only set right after generation/regeneration
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [usageStats, setUsageStats] = useState({ usage: [], totalMonth: 0 });
  const [activePlatformTab, setActivePlatformTab] = useState('woocommerce');
  
  // Test Console State
  const [testEndpoint, setTestEndpoint] = useState('/api/v1/stock-status');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  // Curated Catalog Selection State
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [catalogMode, setCatalogMode] = useState(initialKeyRecord?.catalog_mode || 'all');
  const [selectedSkus, setSelectedSkus] = useState(Array.isArray(initialKeyRecord?.selected_skus) ? initialKeyRecord.selected_skus : []);
  const [isCuratorGridOpen, setIsCuratorGridOpen] = useState(true);
  const [curatorSearch, setCuratorSearch] = useState('');
  const [curatorCategory, setCuratorCategory] = useState('all');
  const [curatorStockOnly, setCuratorStockOnly] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [selectionSuccessMsg, setSelectionSuccessMsg] = useState(null);

  // Admin Override Form State
  const [adminTier, setAdminTier] = useState(initialKeyRecord?.tier || 'free');
  const [adminQuota, setAdminQuota] = useState(initialKeyRecord?.monthly_quota || 2000);
  const [adminRps, setAdminRps] = useState(initialKeyRecord?.rate_limit_rps || 1);
  const [adminIsActive, setAdminIsActive] = useState(initialKeyRecord?.is_active ?? true);
  const [adminSaving, setAdminSaving] = useState(false);

  // Key creation state for new users
  const [newClientName, setNewClientName] = useState(buyerProfile?.business_name || buyerProfile?.full_name || '');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [domainOwnerName, setDomainOwnerName] = useState(buyerProfile?.full_name || user?.user_metadata?.full_name || '');
  const [gstNumber, setGstNumber] = useState(buyerProfile?.gstin || buyerProfile?.gst_number || '');
  const [creatingKey, setCreatingKey] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGeneratedSecret, setNewGeneratedSecret] = useState(null);

  // Load API Key and Usage
  const loadData = async () => {
    setLoading(true);
    try {
      let record = initialKeyRecord;
      if (!record && user?.id) {
        const { data } = await developerService.getApiKeyForUser(user.id);
        record = data;
      }
      setApiKey(record);
      if (record) {
        setAdminTier(record.tier || 'free');
        setAdminQuota(record.monthly_quota || 2000);
        setAdminRps(record.rate_limit_rps || 1);
        setAdminIsActive(record.is_active ?? true);
        setCatalogMode(record.catalog_mode || 'all');
        setSelectedSkus(Array.isArray(record.selected_skus) ? record.selected_skus : []);

        const stats = await developerService.getUsageStats(record.id, 14, user?.id);
        setUsageStats(stats);
      }
    } catch (err) {
      console.error('[DeveloperDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialKeyRecord) {
      setApiKey(initialKeyRecord);
      setAdminTier(initialKeyRecord.tier || 'free');
      setAdminQuota(initialKeyRecord.monthly_quota || 2000);
      setAdminRps(initialKeyRecord.rate_limit_rps || 1);
      setAdminIsActive(initialKeyRecord.is_active ?? true);
      setCatalogMode(initialKeyRecord.catalog_mode || 'all');
      setSelectedSkus(Array.isArray(initialKeyRecord.selected_skus) ? initialKeyRecord.selected_skus : []);
      void developerService.getUsageStats(initialKeyRecord.id, 14, user?.id).then(setUsageStats);
    } else {
      void loadData();
    }
  }, [initialKeyRecord?.id, user?.id]);

  // Load Products for Visual Catalog Curator
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoadingProducts(true);
      try {
        const prods = await fetchProducts();
        if (isMounted && Array.isArray(prods)) {
          setAvailableProducts(prods);
        }
      } catch (err) {
        console.warn('[DeveloperDashboard] Error loading products for curator:', err);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }
    void loadCatalog();
    return () => { isMounted = false; };
  }, [apiKey?.id]);

  // Categories list derived from products
  const categoriesList = useMemo(() => {
    const set = new Set();
    availableProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [availableProducts]);

  // Filtered products for visual curator
  const filteredCuratorProducts = useMemo(() => {
    return availableProducts.filter(p => {
      const pSku = (p.id || p.groupKey || '').toLowerCase();
      const pTitle = (p.title || p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pFabric = (p.fabric || '').toLowerCase();
      
      if (curatorSearch.trim()) {
        const q = curatorSearch.toLowerCase().trim();
        const matches = pSku.includes(q) || pTitle.includes(q) || pCat.includes(q) || pFabric.includes(q);
        if (!matches) return false;
      }
      
      if (curatorCategory !== 'all') {
        if (pCat !== curatorCategory.toLowerCase()) return false;
      }

      if (curatorStockOnly) {
        const isOutOfStock = p.isOutOfStock || p.stockStatusOverride === 'out-of-stock';
        if (isOutOfStock) return false;
      }

      return true;
    });
  }, [availableProducts, curatorSearch, curatorCategory, curatorStockOnly]);

  const toggleSelectSku = (sku) => {
    setSelectedSkus(prev => {
      const skuStr = String(sku);
      if (prev.includes(skuStr)) {
        return prev.filter(s => s !== skuStr);
      } else {
        return [...prev, skuStr];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredSkuSet = new Set(filteredCuratorProducts.map(p => String(p.id || p.groupKey)));
    setSelectedSkus(prev => {
      const combined = new Set([...prev, ...filteredSkuSet]);
      return Array.from(combined);
    });
  };

  const handleDeselectAllFiltered = () => {
    const filteredSkuSet = new Set(filteredCuratorProducts.map(p => String(p.id || p.groupKey)));
    setSelectedSkus(prev => prev.filter(s => !filteredSkuSet.has(s)));
  };

  const handleClearAllSelections = () => {
    setSelectedSkus([]);
  };

  const handleSaveCatalogSelection = async () => {
    if (!apiKey?.id) return;
    setSavingSelection(true);
    setSelectionSuccessMsg(null);
    try {
      const { data, error } = await developerService.updateApiKey(apiKey.id, {
        catalog_mode: 'curated',
        selected_skus: selectedSkus,
      });
      if (error) throw error;
      setApiKey(prev => ({
        ...prev,
        catalog_mode: 'curated',
        selected_skus: selectedSkus,
      }));
      setSelectionSuccessMsg(`Saved! API & Feed will now sync your ${selectedSkus.length} selected ${selectedSkus.length === 1 ? 'product' : 'products'}.`);
      setTimeout(() => setSelectionSuccessMsg(null), 4000);
    } catch (err) {
      alert('Failed to save catalog selection: ' + err.message);
    } finally {
      setSavingSelection(false);
    }
  };

  const copyToClipboard = (text, fieldId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!newClientName || !newClientName.trim()) {
      alert('Please provide your Business or Storefront name.');
      return;
    }
    if (!newClientWebsite || !newClientWebsite.trim()) {
      alert('Please provide your storefront / website URL.');
      return;
    }
    if (!domainOwnerName || !domainOwnerName.trim()) {
      alert('Please provide the Domain Owner / Developer name.');
      return;
    }
    if (!gstNumber || !gstNumber.trim()) {
      alert('Please provide your Business GST Number / GSTIN.');
      return;
    }
    setCreatingKey(true);
    try {
      const { keyRecord, rawSecretKey } = await developerService.createApiKey(user.id, {
        clientName: newClientName.trim(),
        clientWebsite: newClientWebsite.trim(),
        domainOwnerName: domainOwnerName.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        tier: 'free',
      });
      setApiKey(keyRecord);
      setNewGeneratedSecret(rawSecretKey);
      setRevealedKey(rawSecretKey);
      await developerService.getUsageStats(keyRecord.id, 14).then(setUsageStats);
    } catch (err) {
      alert('Failed to generate API Key: ' + err.message);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!apiKey?.id) return;
    if (!window.confirm('Are you sure you want to regenerate your API Key? Your existing key will stop working immediately.')) return;
    try {
      const { keyRecord, rawSecretKey } = await developerService.regenerateApiKey(apiKey.id);
      setApiKey(keyRecord);
      setNewGeneratedSecret(rawSecretKey);
      setRevealedKey(rawSecretKey);
      alert('New API Key generated successfully! Please copy and store it safely.');
    } catch (err) {
      alert('Failed to regenerate key: ' + err.message);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!apiKey?.id) return;
    const confirmName = apiKey.client_name || 'your';
    if (!window.confirm(`Are you sure you want to permanently delete the API key for "${confirmName}"? All active integrations using this key will immediately lose access.`)) {
      return;
    }
    try {
      const { error } = await developerService.deleteApiKey(apiKey.id);
      if (error) throw error;
      setApiKey(null);
      setRevealedKey(null);
      setNewGeneratedSecret(null);
      setNewClientName(buyerProfile?.business_name || '');
      setNewClientWebsite('');
      if (onAdminUpdate) onAdminUpdate(null);
      alert('API Key permanently deleted.');
    } catch (err) {
      alert('Failed to delete API Key: ' + err.message);
    }
  };

  const handleSaveAdminSettings = async () => {
    if (!apiKey?.id) return;
    setAdminSaving(true);
    try {
      const { data, error } = await developerService.updateApiKey(apiKey.id, {
        tier: adminTier,
        monthly_quota: parseInt(adminQuota, 10) || 2000,
        rate_limit_rps: parseInt(adminRps, 10) || 1,
        is_active: adminIsActive,
      });
      if (error) throw error;
      setApiKey(data);
      if (onAdminUpdate) onAdminUpdate(data);
      alert('API Key settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings: ' + err.message);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleRunApiTest = async () => {
    setTestLoading(true);
    setTestResponse(null);
    setTestStatus(null);
    try {
      const activeKeyToUse = revealedKey || apiKey?.key_prefix || 'w365_demo_test';
      const headers = {
        'X-API-Key': activeKeyToUse,
      };
      if (apiKey?.id) {
        headers['X-API-Key-Id'] = apiKey.id;
      }
      const res = await fetch(testEndpoint, { headers });
      setTestStatus(res.status);

      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { response: text };
        }
      }
      setTestResponse(data);

      if (apiKey?.id) {
        // Refresh usage metrics after request
        setTimeout(async () => {
          try {
            const updatedStats = await developerService.getUsageStats(apiKey.id, 14, user?.id);
            setUsageStats(updatedStats);
          } catch (e) {
            console.warn('[DeveloperDashboard] Error refreshing usage stats:', e);
          }
        }, 300);
      }
    } catch (err) {
      setTestStatus(500);
      setTestResponse({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  // Quota and calculations
  const monthlyQuota = apiKey?.monthly_quota || 2000;
  const currentMonthUsed = usageStats.totalMonth || 0;
  const usagePercent = Math.min(100, Math.round((currentMonthUsed / monthlyQuota) * 100));
  const remainingQuota = Math.max(0, monthlyQuota - currentMonthUsed);
  const tierInfo = TIER_CONFIGS[apiKey?.tier] || TIER_CONFIGS.free;

  // Days left in month
  const daysInMonthLeft = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(1, lastDay.getDate() - now.getDate());
  }, []);

  // Display key string
  const displayKey = revealedKey || apiKey?.key_prefix || '••••••••••••••••••••••••••••••••';

  if (loading) {
    return (
      <div className="dev-dashboard-loading">
        <RefreshCw size={28} className="spin-icon" />
        <p>Loading Developer Dashboard & API Metrics...</p>
      </div>
    );
  }

  // If user has no API Key yet and not in admin mode
  if (!apiKey && !isAdminMode) {
    return (
      <div className="dev-dashboard-empty">
        <div className="dev-empty-icon-wrap">
          <KeyRound size={26} />
        </div>
        <h2>Connect Your Storefront via Weave 365 API</h2>
        <p className="dev-empty-desc">
          Automate live catalog sync, real-time handloom product stock availability, and dropship order management directly with your store.
        </p>

        <div className="dev-empty-perks">
          <span className="dev-perk-item">
            <Check size={14} className="dev-perk-icon" /> 2,000 monthly requests included
          </span>
          <span className="dev-perk-item">
            <Check size={14} className="dev-perk-icon" /> Real-time stock status sync
          </span>
          <span className="dev-perk-item">
            <Check size={14} className="dev-perk-icon" /> Ready-made WooCommerce & Shopify scripts
          </span>
        </div>

        <form onSubmit={handleCreateApiKey} className="dev-new-key-form">
          <div className="dev-form-row">
            <label className="dev-form-label">
              <span>Business / Storefront Name <span className="dev-required">*</span></span>
              <input
                type="text"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g. My Boutique Store"
                className="dev-form-input"
              />
            </label>
            <label className="dev-form-label">
              <span>Storefront Website URL <span className="dev-required">*</span></span>
              <input
                type="url"
                required
                value={newClientWebsite}
                onChange={(e) => setNewClientWebsite(e.target.value)}
                placeholder="https://www.example.com"
                className="dev-form-input"
              />
            </label>
          </div>

          <div className="dev-form-row">
            <label className="dev-form-label">
              <span>Domain Owner / Developer Name <span className="dev-required">*</span></span>
              <input
                type="text"
                required
                value={domainOwnerName}
                onChange={(e) => setDomainOwnerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="dev-form-input"
              />
            </label>
            <label className="dev-form-label">
              <span>GST Number / GSTIN <span className="dev-required">*</span></span>
              <input
                type="text"
                required
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 29ABCDE1234F1Z5"
                maxLength={15}
                className="dev-form-input"
              />
            </label>
          </div>

          <button type="submit" disabled={creatingKey} className="primary-button dev-activate-btn">
            {creatingKey ? <RefreshCw size={16} className="spin-icon" /> : <Zap size={16} />}
            {creatingKey ? 'Generating Key...' : 'Generate API Key'}
          </button>
          <p className="dev-form-footnote">
            Free Starter tier • Instant activation • No credit card required
          </p>
        </form>

        <div className="dev-empty-docs-banner">
          <BookOpen size={16} className="dev-docs-banner-icon" />
          <span>Need technical schema, endpoints & tutorials first?</span>
          <a
            href="/developer-api"
            target="_blank"
            rel="noopener noreferrer"
            className="dev-docs-banner-link"
          >
            View Developer API Documentation ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="dev-dashboard-container">
      {/* 1. Admin Inspection Header (Admin Mode Only) */}
      {isAdminMode && (
        <div className="dev-admin-banner">
          <div className="dev-admin-banner-info">
            <Sliders size={18} />
            <div>
              <strong>Admin Inspection Mode:</strong> Live view for <u>{apiKey?.client_name || 'Client'}</u> ({apiKey?.profiles?.email || 'No email'})
            </div>
          </div>
          <div className="dev-admin-quick-toggles">
            <label className="dev-toggle-label">
              <span>Status:</span>
              <input
                type="checkbox"
                checked={adminIsActive}
                onChange={(e) => setAdminIsActive(e.target.checked)}
              />
              <strong className={adminIsActive ? 'text-green' : 'text-red'}>
                {adminIsActive ? 'Active' : 'Disabled'}
              </strong>
            </label>
          </div>
        </div>
      )}

      {/* 2. Top Header & Tier Bar */}
      <div className="dev-dashboard-header">
        <div className="dev-header-main">
          <div className="dev-header-title-row">
            <h1 className="dev-header-title">{apiKey?.client_name || 'Developer API'}</h1>
            <span className={`dev-status-tag ${apiKey?.is_active ? 'active' : 'inactive'}`}>
              <span className="dev-status-dot" />
              {apiKey?.is_active ? 'Live & Active' : 'Suspended'}
            </span>
            <span className="dev-tier-tag">
              {tierInfo.name} • {tierInfo.priceLabel}
            </span>
          </div>
          {apiKey?.client_website && (
            <div className="dev-header-meta-row">
              <a href={apiKey.client_website} target="_blank" rel="noopener noreferrer" className="dev-client-link">
                <Globe size={13} className="dev-meta-icon" />
                <span>{apiKey.client_website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink size={11} className="dev-meta-ext" />
              </a>
            </div>
          )}
        </div>

        <div className="dev-header-actions">
          <a
            href="/developer-api"
            target="_blank"
            rel="noopener noreferrer"
            className="dev-btn dev-btn-primary"
            title="Open official REST API documentation & endpoint references"
          >
            <BookOpen size={14} />
            <span>API Docs ↗</span>
          </a>
          <button
            type="button"
            className="dev-btn dev-btn-secondary"
            onClick={handleRegenerateKey}
            title="Generate a new API secret"
          >
            <RefreshCw size={13} />
            <span>Regenerate</span>
          </button>
          <button
            type="button"
            className="dev-btn dev-btn-danger"
            onClick={handleDeleteApiKey}
            title="Permanently revoke and delete this API key"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Secret Key Notification Banner (When Key is newly generated) */}
      {newGeneratedSecret && (
        <div className="dev-new-secret-alert">
          <button 
            type="button" 
            className="dev-close-secret" 
            onClick={() => setNewGeneratedSecret(null)} 
            aria-label="Dismiss notification"
          >
            ✕
          </button>
          
          <div className="dev-alert-left">
            <CheckCircle2 size={18} className="dev-alert-icon" />
            <div className="dev-alert-content">
              <strong>New API Secret Key Generated</strong>
              <p>Your API key is active. You can copy it now or view and manage it anytime below.</p>
            </div>
          </div>

          <div className="dev-secret-copy-box">
            <input
              type="text"
              readOnly
              value={newGeneratedSecret}
              className="dev-secret-key-input"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(newGeneratedSecret, 'new-secret')}
              className="dev-copy-btn"
            >
              {copiedField === 'new-secret' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedField === 'new-secret' ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Metric Gauges (Quota & Rate Limit) */}
      <div className="dev-metrics-grid">
        <div className="dev-metric-card">
          <div className="dev-metric-head">
            <span className="dev-metric-label">Monthly Request Quota</span>
            <Activity size={15} className="dev-metric-icon" />
          </div>
          <div className="dev-metric-value">
            {currentMonthUsed.toLocaleString()} <span className="dev-metric-total">/ {monthlyQuota.toLocaleString()} req</span>
          </div>
          <div className="dev-progress-bar-wrap">
            <div
              className={`dev-progress-bar ${usagePercent > 85 ? 'danger' : usagePercent > 60 ? 'warning' : 'good'}`}
              style={{ transform: `scaleX(${usagePercent / 100})` }}
            />
          </div>
          <div className="dev-metric-footer">
            <span>{remainingQuota.toLocaleString()} requests remaining ({usagePercent}% used)</span>
            <span>Resets in {daysInMonthLeft} days</span>
          </div>
        </div>

        <div className="dev-metric-card">
          <div className="dev-metric-head">
            <span className="dev-metric-label">Rate Limit & Throughput</span>
            <Zap size={15} className="dev-metric-icon" />
          </div>
          <div className="dev-metric-value">
            {apiKey?.rate_limit_rps || 1} <span className="dev-metric-unit">req / sec</span>
          </div>
          <p className="dev-metric-subtext">
            Standard burst allowance: {Math.max(5, (apiKey?.rate_limit_rps || 1) * 3)} concurrent requests
          </p>
        </div>
      </div>

      {/* 4. Credentials & Base URLs Card */}
      <div className="dev-card">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <KeyRound size={16} />
            <h3>API Credentials & Endpoint Access</h3>
          </div>
        </div>

        <div className="dev-credentials-list">
          <div className="dev-cred-row">
            <div className="dev-cred-info">
              <span className="dev-cred-name">API Secret Key</span>
              <span className="dev-cred-desc">Pass in HTTP header: <code>X-API-Key: &lt;your_key&gt;</code></span>
            </div>
            <div className="dev-cred-input-wrap">
              <input
                type={showKeySecret ? 'text' : 'password'}
                readOnly
                value={displayKey}
                className="dev-cred-input"
              />
              <button
                type="button"
                className="dev-icon-btn"
                onClick={() => setShowKeySecret(!showKeySecret)}
                title={showKeySecret ? 'Hide Key' : 'Reveal Key'}
                aria-label={showKeySecret ? 'Hide Key' : 'Reveal Key'}
              >
                {showKeySecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                className="dev-copy-btn"
                onClick={() => copyToClipboard(revealedKey || apiKey?.key_prefix, 'api-key')}
              >
                {copiedField === 'api-key' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedField === 'api-key' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="dev-cred-row">
            <div className="dev-cred-info">
              <span className="dev-cred-name">Base API URL</span>
              <span className="dev-cred-desc">Production Cloudflare Edge endpoint</span>
            </div>
            <div className="dev-cred-input-wrap">
              <input
                type="text"
                readOnly
                value="https://www.weave365.com/api/v1"
                className="dev-cred-input"
              />
              <button
                type="button"
                className="dev-copy-btn"
                onClick={() => copyToClipboard('https://www.weave365.com/api/v1', 'base-url')}
              >
                {copiedField === 'base-url' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedField === 'base-url' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Curated Catalog Selection & Storefront Sync */}
      <div className="dev-card dev-curator-card" id="catalog-curator">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <ShoppingBag size={18} />
            <div>
              <h3>Curated Catalog Sync</h3>
              <p className="dev-card-subtitle">
                Select the specific products you want to sync with your Shopify or WooCommerce storefront.
              </p>
            </div>
          </div>
          <div className="dev-curator-selected-badge">
            <span>{selectedSkus.length} {selectedSkus.length === 1 ? 'Product' : 'Products'} Selected</span>
          </div>
        </div>

        {!isCuratorGridOpen ? (
          <div className="dev-curator-compact-all dev-curator-collapsed-bar">
            <div className="dev-curator-all-status">
              <span className="dev-pulse-dot" />
              <span>
                {selectedSkus.length > 0 ? (
                  <><strong>Curated Feed Active:</strong> Syncing <strong>{selectedSkus.length}</strong> selected {selectedSkus.length === 1 ? 'product' : 'products'}.</>
                ) : (
                  <><strong>No Products Selected:</strong> Pick products below to enable your storefront feed.</>
                )}
              </span>
            </div>
            <button
              type="button"
              className="dev-curate-btn"
              onClick={() => setIsCuratorGridOpen(true)}
            >
              <ChevronDown size={14} />
              <span>{selectedSkus.length > 0 ? 'Edit Product Selection' : 'Pick Products to Sync'}</span>
            </button>
          </div>
        ) : (
          <div className="dev-curator-body">
            {/* Filter Bar */}
            <div className="dev-curator-toolbar">
              <div className="dev-curator-search-box">
                <Search size={15} className="dev-search-icon" />
                <input
                  type="text"
                  placeholder="Search by title, SKU, category, fabric..."
                  value={curatorSearch}
                  onChange={(e) => setCuratorSearch(e.target.value)}
                  className="dev-curator-search-input"
                />
                {curatorSearch && (
                  <button type="button" onClick={() => setCuratorSearch('')} className="dev-clear-search">✕</button>
                )}
              </div>

              <div className="dev-curator-actions">
                <label className="dev-stock-filter-toggle">
                  <input
                    type="checkbox"
                    checked={curatorStockOnly}
                    onChange={(e) => setCuratorStockOnly(e.target.checked)}
                  />
                  <span>Ready Stock Only</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="dev-action-chip"
                >
                  Select Visible
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="dev-action-chip"
                >
                  Deselect Visible
                </button>
                {selectedSkus.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSelections}
                    className="dev-action-chip danger"
                  >
                    Clear All ({selectedSkus.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCuratorGridOpen(false)}
                  className="dev-action-chip"
                  title="Close product grid"
                >
                  <ChevronUp size={13} />
                  <span>Close List</span>
                </button>
              </div>
            </div>

            {/* Category Chips */}
            <div className="dev-curator-cats">
              <button
                type="button"
                className={`dev-cat-chip ${curatorCategory === 'all' ? 'active' : ''}`}
                onClick={() => setCuratorCategory('all')}
              >
                All
              </button>
              {categoriesList.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`dev-cat-chip ${curatorCategory === cat ? 'active' : ''}`}
                  onClick={() => setCuratorCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div className="dev-curator-loading">
                <RefreshCw size={22} className="spin-icon" />
                <p>Loading catalog...</p>
              </div>
            ) : filteredCuratorProducts.length === 0 ? (
              <div className="dev-curator-empty">
                <p>No products found matching your filters.</p>
                <button
                  type="button"
                  onClick={() => { setCuratorSearch(''); setCuratorCategory('all'); setCuratorStockOnly(false); }}
                  className="dev-secondary-btn"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="dev-curator-grid">
                {filteredCuratorProducts.map(p => {
                  const sku = String(p.id || p.groupKey);
                  const isSelected = selectedSkus.includes(sku);
                  const isOutOfStock = p.isOutOfStock || p.stockStatusOverride === 'out-of-stock';
                  const firstPrices = p.variants?.[0]?.prices || {};
                  const price = Number(firstPrices.b2r || firstPrices.single || p.resellerPrice || p.price || 0);
                  const image = p.images?.[0] || p.image || '/images/placeholder.webp';

                  return (
                    <div
                      key={sku}
                      className={`dev-curator-card-item ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => toggleSelectSku(sku)}
                    >
                      <div className="dev-item-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="dev-item-checkbox"
                        />
                      </div>
                      <div className="dev-item-thumb-wrap">
                        <img src={image} alt={p.title || p.name} className="dev-item-thumb" loading="lazy" />
                        <span className={`dev-item-stock-tag ${isOutOfStock ? 'oos' : 'ready'}`}>
                          {isOutOfStock ? 'OOS' : 'Ready'}
                        </span>
                      </div>
                      <div className="dev-item-info">
                        <div className="dev-item-sku-row">
                          <span className="dev-item-sku">SKU: {sku}</span>
                          <span className="dev-item-price">₹{price.toLocaleString('en-IN')}</span>
                        </div>
                        <h4 className="dev-item-title" title={p.title || p.name}>
                          {p.title || p.name}
                        </h4>
                        <div className="dev-item-meta">
                          <span>{p.category || 'Product'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sticky Save Bar (Shown when product grid is open) */}
        {isCuratorGridOpen && (
          <div className="dev-curator-save-bar">
            <div className="dev-save-bar-info">
              <span><strong>{selectedSkus.length}</strong> {selectedSkus.length === 1 ? 'product' : 'products'} selected for sync</span>
              {selectionSuccessMsg && (
                <span className="dev-save-success-tag">
                  <Check size={13} /> {selectionSuccessMsg}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCuratorGridOpen(false)}
                className="dev-curate-btn"
                style={{ height: '38px' }}
              >
                <ChevronUp size={14} />
                <span>Close List</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCatalogSelection}
                disabled={savingSelection}
                className="dev-btn dev-btn-primary dev-save-selection-btn"
              >
                {savingSelection ? <RefreshCw size={14} className="spin-icon" /> : <Check size={14} />}
                <span>{savingSelection ? 'Saving...' : 'Save Selection'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Platform Integration Guides (Shopify, WooCommerce, PrestaShop, cURL) */}
      <div className="dev-card">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <Code2 size={18} />
            <h3>Platform Integration Guides & Ready-Made Scripts</h3>
          </div>
          <a
            href="/developer-api"
            target="_blank"
            rel="noopener noreferrer"
            className="dev-card-docs-link"
            title="Read complete REST API documentation and payload schemas"
          >
            <ExternalLink size={13} /> Full API Reference
          </a>
        </div>

        <div className="dev-platform-tabs">
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'woocommerce' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('woocommerce')}
          >
            WooCommerce (WordPress)
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'shopify' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('shopify')}
          >
            Shopify
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'prestashop' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('prestashop')}
          >
            PrestaShop
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'curl' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('curl')}
          >
            cURL / Terminal
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'javascript' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('javascript')}
          >
            JavaScript / Node.js
          </button>
        </div>

        <div className="dev-platform-content">
          {activePlatformTab === 'woocommerce' && (
            <div>
              <div className="dev-plat-intro">
                <h4 className="dev-plat-title">WooCommerce Auto-Sync Snippet:</h4>
                <p>
                  Paste this snippet into your theme's <code>functions.php</code> or the free <em>Code Snippets</em> plugin. It will automatically query Weave365 every 2 hours and sync stock status for all products matching your SKU numbers.
                </p>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`// === Weave365 WooCommerce Live Stock & Catalog Sync ===
add_action('weave365_cron_stock_sync', 'sync_weave365_inventory');

function sync_weave365_inventory() {
    $api_key = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';
    $url = 'https://www.weave365.com/api/v1/stock-status';
    
    $response = wp_remote_get($url, [
        'headers' => ['X-API-Key' => $api_key],
        'timeout' => 20
    ]);
    
    if (is_wp_error($response)) return;
    $body = json_decode(wp_remote_retrieve_body($response), true);
    
    if (!empty($body['stock_map'])) {
        foreach ($body['stock_map'] as $sku => $data) {
            $product_id = wc_get_product_id_by_sku($sku);
            if ($product_id) {
                $product = wc_get_product($product_id);
                $is_available = !empty($data['is_available']);
                $product->set_stock_status($is_available ? 'instock' : 'outofstock');
                $product->save();
            }
        }
    }
}

if (!wp_next_scheduled('weave365_cron_stock_sync')) {
    wp_schedule_event(time(), 'hourly', 'weave365_cron_stock_sync');
}`}
                </pre>
                <button
                  type="button"
                  className="dev-code-copy-btn"
                  onClick={() => copyToClipboard(`// === Weave365 WooCommerce Live Stock & Catalog Sync ===\nadd_action('weave365_cron_stock_sync', 'sync_weave365_inventory');\nfunction sync_weave365_inventory() {\n    $api_key = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';\n    $response = wp_remote_get('https://www.weave365.com/api/v1/stock-status', ['headers' => ['X-API-Key' => $api_key], 'timeout' => 20]);\n    if (is_wp_error($response)) return;\n    $body = json_decode(wp_remote_retrieve_body($response), true);\n    if (!empty($body['stock_map'])) {\n        foreach ($body['stock_map'] as $sku => $data) {\n            $id = wc_get_product_id_by_sku($sku);\n            if ($id) {\n                $p = wc_get_product($id);\n                $p->set_stock_status(!empty($data['is_available']) ? 'instock' : 'outofstock');\n                $p->save();\n            }\n        }\n    }\n}\nif (!wp_next_scheduled('weave365_cron_stock_sync')) { wp_schedule_event(time(), 'hourly', 'weave365_cron_stock_sync'); }`, 'woo-code')}
                >
                  {copiedField === 'woo-code' ? <Check size={14} /> : <Copy size={14} />} Copy PHP Snippet
                </button>
              </div>
            </div>
          )}

          {activePlatformTab === 'shopify' && (
            <div>
              <div className="dev-plat-intro">
                <h4 className="dev-plat-title">Shopify Automated Integration:</h4>
                <p>
                  Use any Shopify data-sync app (e.g. <strong>Matrixify</strong> or <strong>Stock Sync</strong>). Provide your dedicated Shopify-formatted feed URL below:
                </p>
              </div>
              <div className="dev-shopify-box">
                <label className="dev-shopify-label">Your Automated Shopify JSON Feed URL:</label>
                <div className="dev-feed-input-group">
                  <input
                    type="text"
                    readOnly
                    value={`https://www.weave365.com/api/v1/catalog?format=shopify`}
                    className="dev-feed-input"
                  />
                  <button
                    type="button"
                    className="dev-feed-copy-btn"
                    onClick={() => copyToClipboard(`https://www.weave365.com/api/v1/catalog?format=shopify`, 'shopify-url')}
                  >
                    {copiedField === 'shopify-url' ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedField === 'shopify-url' ? 'Copied' : 'Copy Feed URL'}</span>
                  </button>
                </div>
                <div className="dev-shopify-steps">
                  <div className="dev-step-item">
                    <span className="dev-step-num">1</span>
                    <div className="dev-step-text">In Shopify App <strong>Stock Sync</strong> or <strong>Matrixify</strong>, choose <em>New Scheduled Feed</em>.</div>
                  </div>
                  <div className="dev-step-item">
                    <span className="dev-step-num">2</span>
                    <div className="dev-step-text">Set Source URL to the URL above and add Header <code>X-API-Key: {revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}</code>.</div>
                  </div>
                  <div className="dev-step-item">
                    <span className="dev-step-num">3</span>
                    <div className="dev-step-text">Set schedule to <em>Every 2 hours</em> for automated inventory sync.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePlatformTab === 'prestashop' && (
            <div>
              <div className="dev-plat-intro">
                <h4 className="dev-plat-title">PrestaShop Sync Script:</h4>
                <p>Run via PrestaShop Cron or custom module connector to synchronize warehouse quantities:</p>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`<?php
// PrestaShop 1.7 / 8.x Stock Synchronizer
require_once dirname(__FILE__) . '/config/config.inc.php';

$apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';
$ch = curl_init('https://www.weave365.com/api/v1/stock-status');
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: $apiKey"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);

$data = json_decode($res, true);
if (!empty($data['stock_map'])) {
    foreach ($data['stock_map'] as $sku => $item) {
        $id_product = (int)Db::getInstance()->getValue('SELECT id_product FROM '._DB_PREFIX_.'product WHERE reference = "'.pSQL($sku).'"');
        if ($id_product) {
            $qty = !empty($item['is_available']) ? 5 : 0;
            StockAvailable::setQuantity($id_product, 0, $qty);
        }
    }
    echo "Successfully synced ".count($data['stock_map'])." products from Weave365.";
}`}
                </pre>
                <button
                  type="button"
                  className="dev-code-copy-btn"
                  onClick={() => copyToClipboard(`<?php\n// PrestaShop 1.7 / 8.x Stock Synchronizer\nrequire_once dirname(__FILE__) . '/config/config.inc.php';\n\n$apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';\n$ch = curl_init('https://www.weave365.com/api/v1/stock-status');\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: $apiKey"]);\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n$res = curl_exec($ch);\ncurl_close($ch);\n\n$data = json_decode($res, true);\nif (!empty($data['stock_map'])) {\n    foreach ($data['stock_map'] as $sku => $item) {\n        $id_product = (int)Db::getInstance()->getValue('SELECT id_product FROM '._DB_PREFIX_.'product WHERE reference = "'.pSQL($sku).'"');\n        if ($id_product) {\n            $qty = !empty($item['is_available']) ? 5 : 0;\n            StockAvailable::setQuantity($id_product, 0, $qty);\n        }\n    }\n    echo "Successfully synced ".count($data['stock_map'])." products from Weave365.";\n}`, 'prestashop-code')}
                >
                  {copiedField === 'prestashop-code' ? <Check size={14} /> : <Copy size={14} />} {copiedField === 'prestashop-code' ? 'Copied' : 'Copy PHP Snippet'}
                </button>
              </div>
            </div>
          )}

          {activePlatformTab === 'curl' && (
            <div>
              <div className="dev-plat-intro">
                <h4 className="dev-plat-title">cURL Command Examples:</h4>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`# 1. Fetch Complete Wholesale Catalog
curl -X GET "https://www.weave365.com/api/v1/catalog" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 2. Fetch Lightweight Stock Availability Map
curl -X GET "https://www.weave365.com/api/v1/stock-status" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 3. Place Dropship Order via API (Growth Tier)
curl -X POST "https://www.weave365.com/api/v1/orders" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reseller_order_id": "ORD-101",
    "customer": {
      "name": "Priya Sharma",
      "phone": "+919876543210",
      "pincode": "560034",
      "address_line1": "Flat 402, Green Valley",
      "city": "Bangalore",
      "state": "Karnataka"
    },
    "items": [{ "sku": "W365-KAN-001", "quantity": 1 }]
  }'`}
                </pre>
                <button
                  type="button"
                  className="dev-code-copy-btn"
                  onClick={() => copyToClipboard(`# 1. Fetch Complete Wholesale Catalog\ncurl -X GET "https://www.weave365.com/api/v1/catalog" \\\n  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"\n\n# 2. Fetch Lightweight Stock Availability Map\ncurl -X GET "https://www.weave365.com/api/v1/stock-status" \\\n  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"\n\n# 3. Place Dropship Order via API (Growth Tier)\ncurl -X POST "https://www.weave365.com/api/v1/orders" \\\n  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "reseller_order_id": "ORD-101",\n    "customer": {\n      "name": "Priya Sharma",\n      "phone": "+919876543210",\n      "pincode": "560034",\n      "address_line1": "Flat 402, Green Valley",\n      "city": "Bangalore",\n      "state": "Karnataka"\n    },\n    "items": [{ "sku": "W365-KAN-001", "quantity": 1 }]\n  }'`, 'curl-code')}
                >
                  {copiedField === 'curl-code' ? <Check size={14} /> : <Copy size={14} />} {copiedField === 'curl-code' ? 'Copied' : 'Copy cURL'}
                </button>
              </div>
            </div>
          )}

          {activePlatformTab === 'javascript' && (
            <div>
              <div className="dev-plat-intro">
                <h4 className="dev-plat-title">Node.js / Fetch Example:</h4>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`const apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}';

async function fetchWeave365Catalog() {
  const response = await fetch('https://www.weave365.com/api/v1/catalog', {
    headers: {
      'X-API-Key': apiKey,
    },
  });
  const data = await response.json();
  console.log('Total Products Synced:', data.total_products);
  return data.products;
}

fetchWeave365Catalog();`}
                </pre>
                <button
                  type="button"
                  className="dev-code-copy-btn"
                  onClick={() => copyToClipboard(`const apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}';\n\nasync function fetchWeave365Catalog() {\n  const response = await fetch('https://www.weave365.com/api/v1/catalog', {\n    headers: {\n      'X-API-Key': apiKey,\n    },\n  });\n  const data = await response.json();\n  console.log('Total Products Synced:', data.total_products);\n  return data.products;\n}\n\nfetchWeave365Catalog();`, 'js-code')}
                >
                  {copiedField === 'js-code' ? <Check size={14} /> : <Copy size={14} />} {copiedField === 'js-code' ? 'Copied' : 'Copy JavaScript'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Interactive Live API Test Console */}
      <div className="dev-card">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <Play size={18} />
            <h3>Live API Test Console</h3>
          </div>
        </div>

        <div className="dev-test-console">
          <div className="dev-test-bar">
            <span className="dev-http-badge">GET</span>
            <select
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              className="dev-endpoint-select"
            >
              <option value="/api/v1/stock-status">/api/v1/stock-status (Real-Time Stock Map)</option>
              <option value="/api/v1/catalog">/api/v1/catalog (Full B2B Product Feed)</option>
              <option value="/api/v1/catalog?format=shopify">/api/v1/catalog?format=shopify (Shopify Feed)</option>
              <option value="/api/v1/orders">/api/v1/orders (My API Orders & Live Tracking)</option>
              <option value="/api/v1/me">/api/v1/me (Account & Usage Stats)</option>
            </select>
            <button
              type="button"
              onClick={handleRunApiTest}
              disabled={testLoading}
              className="primary-button dev-send-btn"
            >
              {testLoading ? <RefreshCw size={14} className="spin-icon" /> : <Play size={14} />}
              Send Request
            </button>
          </div>

          {testResponse && (
            <div className="dev-test-output">
              <div className="dev-test-output-head">
                <span>Response Status: <strong className={testStatus === 200 ? 'text-green' : 'text-red'}>HTTP {testStatus}</strong></span>
                <button
                  type="button"
                  className="dev-copy-btn"
                  onClick={() => copyToClipboard(JSON.stringify(testResponse, null, 2), 'test-json')}
                >
                  {copiedField === 'test-json' ? <Check size={12} /> : <Copy size={12} />} Copy JSON
                </button>
              </div>
              <pre>{JSON.stringify(testResponse, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
