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
  ChevronUp,
  Building2,
  UserCheck,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  MessageCircle
} from '../icons.jsx';
import { developerService, TIER_CONFIGS } from '../../services/developerService.js';
import { fetchProducts } from '../../productData.js';
import '../../styles/developerDashboard.css';

/**
 * Modern confirmation modal for sensitive and dangerous admin actions.
 */
export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  requiredInputText = null, // e.g. "DELETE"
  onConfirm,
  onCancel,
  clientName,
}) {
  const [typedInput, setTypedInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = requiredInputText ? typedInput.trim() === requiredInputText : true;
  const isConfirmedDisabled = !isMatched;

  return (
    <div className="dev-confirm-overlay" onClick={onCancel}>
      <div className="dev-confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with integrated icon and title */}
        <div className="dev-confirm-header">
          <div className={`dev-confirm-icon-badge ${isDanger ? 'danger' : 'warning'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="dev-confirm-header-text">
            <h3 className="dev-confirm-title">{title}</h3>
            {clientName && (
              <div className="dev-confirm-target-row">
                <span className="dev-confirm-target-label">Target Client:</span>
                <strong className="dev-confirm-target-name">{clientName}</strong>
              </div>
            )}
          </div>
          <button type="button" className="dev-confirm-close-btn" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body content */}
        <div className="dev-confirm-body">
          <p className="dev-confirm-message">{message}</p>

          {requiredInputText && (
            <div className="dev-confirm-verify-panel">
              <label className="dev-confirm-verify-label" htmlFor="dev-confirm-verify-input">
                <span>Type </span>
                <code className="dev-confirm-keyword">{requiredInputText}</code>
                <span> to confirm:</span>
              </label>
              <div className="dev-confirm-input-wrapper">
                <input
                  id="dev-confirm-verify-input"
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder={`Type ${requiredInputText}`}
                  className={`dev-confirm-text-input ${isMatched && typedInput ? 'matched' : ''}`}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
                {isMatched && typedInput && (
                  <span className="dev-confirm-match-badge">
                    <Check size={12} /> Ready
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="dev-confirm-footer">
          <button
            type="button"
            className="dev-confirm-btn-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isConfirmedDisabled}
            className={`dev-confirm-btn-action ${isDanger ? 'danger' : 'warning'} ${isConfirmedDisabled ? 'disabled' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Quiet, elegant card displaying storefront registration and developer activation details.
 */
function UserActivationInfoCard({ apiKey, user, buyerProfile, isAdminMode, copiedField, copyToClipboard, tierInfo }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Extract all data fields with intelligent fallbacks
  const clientName = apiKey?.client_name || apiKey?.profiles?.business_name || buyerProfile?.business_name || 'N/A';
  const clientWebsite = apiKey?.client_website || '';
  const domainOwnerName = apiKey?.domain_owner_name || apiKey?.profiles?.full_name || buyerProfile?.full_name || user?.user_metadata?.full_name || 'N/A';
  const gstNumber = apiKey?.gst_number || apiKey?.profiles?.gstin || apiKey?.profiles?.gst_number || buyerProfile?.gstin || buyerProfile?.gst_number || '';
  const email = apiKey?.profiles?.email || user?.email || 'N/A';
  const phone = apiKey?.profiles?.whatsapp || apiKey?.profiles?.whatsapp_number || apiKey?.profiles?.phone || buyerProfile?.whatsapp || '';
  
  const city = apiKey?.profiles?.city || buyerProfile?.city || '';
  const state = apiKey?.profiles?.state || buyerProfile?.state || '';
  const pincode = apiKey?.profiles?.pincode || buyerProfile?.pincode || '';
  const locationParts = [city, state, pincode].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Not specified';

  const buyerType = apiKey?.profiles?.buyer_subtype || apiKey?.profiles?.role || buyerProfile?.buyer_subtype || buyerProfile?.buyer_type || 'Reseller / Developer';
  
  const createdAtFormatted = apiKey?.created_at
    ? new Date(apiKey.created_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A';

  const lastUsedFormatted = apiKey?.last_used_at
    ? new Date(apiKey.last_used_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No requests recorded';

  const catalogModeLabel = apiKey?.catalog_mode === 'curated'
    ? `Curated Feed (${(apiKey?.selected_skus || []).length} items)`
    : 'Master Catalog (All SKUs)';

  // Build WhatsApp URL
  const waCleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const waUrl = waCleanPhone
    ? `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(
        `Hi ${domainOwnerName !== 'N/A' ? domainOwnerName : clientName}, regarding your Weave365 Developer API connection for ${clientName}...`
      )}`
    : null;

  return (
    <div className="dev-activation-card">
      <div className="dev-activation-card-head">
        <div className="dev-activation-head-left">
          <div className="dev-activation-icon-wrap">
            <Building2 size={16} />
          </div>
          <div className="dev-activation-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: '#0f172a' }}>
                {clientName !== 'N/A' ? clientName : (isAdminMode ? 'Activation Details' : 'Storefront Profile')}
              </h3>
              <span className={`dev-quiet-status-tag ${apiKey?.is_active ? 'active' : 'inactive'}`}>
                <span className="dev-quiet-dot" />
                {apiKey?.is_active ? 'Live & Active' : 'Suspended'}
              </span>
              {tierInfo && (
                <span className="dev-tier-tag" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                  {tierInfo.name} • {tierInfo.priceLabel}
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {isAdminMode
                ? 'Registered storefront parameters, buyer account details, and API credentials'
                : 'Your registered storefront parameters and API credentials'}
            </p>
          </div>
        </div>

        <div className="dev-activation-head-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="/developer-api"
            target="_blank"
            rel="noopener noreferrer"
            className="dev-action-chip"
            style={{
              height: '30px',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
            title="Open official REST API documentation & endpoint references"
          >
            <BookOpen size={13} />
            <span>API Docs ↗</span>
          </a>

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dev-quiet-wa-btn"
              style={{ height: '30px', fontSize: '0.75rem' }}
              title="Message reseller on WhatsApp"
            >
              <MessageCircle size={13} />
              <span>Chat on WhatsApp</span>
            </a>
          )}

          {!isAdminMode && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="dev-icon-btn"
              style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer' }}
              title={isCollapsed ? 'Expand Storefront Profile' : 'Collapse Storefront Profile'}
              aria-label={isCollapsed ? 'Expand Storefront Profile' : 'Collapse Storefront Profile'}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="dev-activation-grid">
            {/* 1. Storefront / Business Name */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Business / Storefront</span>
              <div className="dev-activation-value-row">
                <span className="dev-activation-value primary" title={clientName}>
                  {clientName}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(clientName, 'act-client-name')}
                  className="dev-quiet-copy-icon"
                  title="Copy Name"
                  aria-label="Copy Business Name"
                >
                  {copiedField === 'act-client-name' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* 2. Storefront Website URL */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Storefront Website</span>
              <div className="dev-activation-value-row">
                {clientWebsite ? (
                  <>
                    <a
                      href={clientWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dev-quiet-link"
                      title={clientWebsite}
                    >
                      <span>{clientWebsite.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={11} className="dev-quiet-ext-icon" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(clientWebsite, 'act-website')}
                      className="dev-quiet-copy-icon"
                      title="Copy URL"
                      aria-label="Copy Website URL"
                    >
                      {copiedField === 'act-website' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">Not provided</span>
                )}
              </div>
            </div>

            {/* 3. Domain Owner / Developer Name */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Domain Owner / Developer</span>
              <div className="dev-activation-value-row">
                <span className="dev-activation-value" title={domainOwnerName}>
                  {domainOwnerName}
                </span>
                {domainOwnerName !== 'N/A' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(domainOwnerName, 'act-domain-owner')}
                    className="dev-quiet-copy-icon"
                    title="Copy Domain Owner"
                    aria-label="Copy Domain Owner Name"
                  >
                    {copiedField === 'act-domain-owner' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            {/* 4. GST Number / GSTIN */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">GST Number / GSTIN</span>
              <div className="dev-activation-value-row">
                {gstNumber ? (
                  <>
                    <code className="dev-quiet-gstin-code" title="Business GSTIN">
                      {gstNumber}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gstNumber, 'act-gstin')}
                      className="dev-quiet-copy-icon"
                      title="Copy GSTIN"
                      aria-label="Copy GSTIN"
                    >
                      {copiedField === 'act-gstin' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">Not provided</span>
                )}
              </div>
            </div>

            {/* 5. User Account Email */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Account Email</span>
              <div className="dev-activation-value-row">
                {email && email !== 'N/A' ? (
                  <>
                    <a href={`mailto:${email}`} className="dev-quiet-link" title={email}>
                      <Mail size={11} className="dev-quiet-inline-icon" />
                      <span>{email}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(email, 'act-email')}
                      className="dev-quiet-copy-icon"
                      title="Copy Email"
                      aria-label="Copy Email"
                    >
                      {copiedField === 'act-email' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">N/A</span>
                )}
              </div>
            </div>

            {/* 6. Phone / WhatsApp Contact */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Phone / WhatsApp</span>
              <div className="dev-activation-value-row">
                {phone ? (
                  <>
                    <span className="dev-activation-value">{phone}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(phone, 'act-phone')}
                      className="dev-quiet-copy-icon"
                      title="Copy Phone"
                      aria-label="Copy Phone Number"
                    >
                      {copiedField === 'act-phone' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">Not on profile</span>
                )}
              </div>
            </div>

            {/* 7. Registered Location */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Location / City</span>
              <div className="dev-activation-value-row">
                <span className="dev-activation-value" title={locationStr}>
                  {locationStr}
                </span>
              </div>
            </div>

            {/* 8. Buyer Role & Classification */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Classification</span>
              <div className="dev-activation-value-row">
                <span className="dev-quiet-type-pill">
                  {buyerType}
                </span>
              </div>
            </div>
          </div>

          <div className="dev-activation-footer">
            <div className="dev-activation-footer-left">
              <span className="dev-activation-footer-item">
                <Calendar size={12} />
                <span>Activated: <strong>{createdAtFormatted}</strong></span>
              </span>
              <span className="dev-activation-footer-dot">•</span>
              <span className="dev-activation-footer-item">
                <Clock size={12} />
                <span>Last Request: <strong>{lastUsedFormatted}</strong></span>
              </span>
            </div>

            <div className="dev-activation-footer-item">
              <Layers size={12} />
              <span>Feed: <strong>{catalogModeLabel}</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
  const [isCuratorGridOpen, setIsCuratorGridOpen] = useState(false);
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
  const [adminOrdersEnabled, setAdminOrdersEnabled] = useState(initialKeyRecord?.orders_enabled ?? false);
  const [adminSaving, setAdminSaving] = useState(false);

  // Key creation state for new users
  const [newClientName, setNewClientName] = useState(buyerProfile?.business_name || buyerProfile?.full_name || '');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [domainOwnerName, setDomainOwnerName] = useState(buyerProfile?.full_name || user?.user_metadata?.full_name || '');
  const [gstNumber, setGstNumber] = useState(buyerProfile?.gstin || buyerProfile?.gst_number || '');
  const [creatingKey, setCreatingKey] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGeneratedSecret, setNewGeneratedSecret] = useState(null);

  // Confirmation Modal State for dangerous / impactful admin actions
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    isDanger: false,
    requiredInputText: null,
    clientName: '',
    onConfirm: null,
  });

  const triggerConfirm = ({ title, message, confirmLabel, isDanger = false, requiredInputText = null, onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: confirmLabel || (isDanger ? 'Yes, Proceed' : 'Confirm'),
      cancelLabel: 'Cancel',
      isDanger,
      requiredInputText,
      clientName: apiKey?.client_name || 'Client',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

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
        setAdminOrdersEnabled(Boolean(record.orders_enabled));
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
      setAdminOrdersEnabled(Boolean(initialKeyRecord.orders_enabled));
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

  const handleOpenCuratorGrid = () => {
    if (isAdminMode) {
      triggerConfirm({
        title: 'Edit Curated Catalog',
        message: 'Product changes directly modify what is synced to the client\'s live storefront.',
        confirmLabel: 'Edit Catalog',
        isDanger: false,
        onConfirm: () => setIsCuratorGridOpen(true),
      });
    } else {
      setIsCuratorGridOpen(true);
    }
  };

  const handleClearAllSelections = () => {
    if (isAdminMode) {
      triggerConfirm({
        title: 'Clear Product Selection',
        message: 'This will remove all products from the feed. The storefront sync will be empty until new products are selected.',
        confirmLabel: 'Clear Products',
        isDanger: true,
        onConfirm: () => setSelectedSkus([]),
      });
    } else {
      setSelectedSkus([]);
    }
  };

  const handleSaveCatalogSelection = async () => {
    if (!apiKey?.id) return;
    
    const executeSave = async () => {
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

    if (isAdminMode) {
      triggerConfirm({
        title: 'Save Curated Feed',
        message: `Update live storefront sync feed to ${selectedSkus.length} selected ${selectedSkus.length === 1 ? 'product' : 'products'}?`,
        confirmLabel: 'Save Feed',
        isDanger: false,
        onConfirm: executeSave,
      });
    } else {
      await executeSave();
    }
  };

  const handleAdminToggleActiveChange = (newChecked) => {
    if (!newChecked) {
      triggerConfirm({
        title: 'Disable API Access',
        message: 'Live storefront requests from this client will immediately receive 403 Forbidden errors and stop syncing products or orders.',
        confirmLabel: 'Disable Access',
        isDanger: true,
        onConfirm: async () => {
          setAdminIsActive(false);
          try {
            const { data, error } = await developerService.updateApiKey(apiKey.id, {
              is_active: false,
              orders_enabled: false,
            });
            if (error) throw error;
            setApiKey(prev => ({ ...prev, is_active: false, orders_enabled: false }));
            setAdminOrdersEnabled(false);
            if (onAdminUpdate) onAdminUpdate({ ...apiKey, is_active: false, orders_enabled: false });
          } catch (e) {
            alert('Failed to update status: ' + e.message);
          }
        }
      });
    } else {
      triggerConfirm({
        title: 'Enable API Access',
        message: 'Restore API access for this client? Incoming requests from their storefront will resume immediately.',
        confirmLabel: 'Enable Access',
        isDanger: false,
        onConfirm: async () => {
          setAdminIsActive(true);
          try {
            const { data, error } = await developerService.updateApiKey(apiKey.id, { is_active: true });
            if (error) throw error;
            setApiKey(prev => ({ ...prev, is_active: true }));
            if (onAdminUpdate) onAdminUpdate({ ...apiKey, is_active: true });
          } catch (e) {
            alert('Failed to update status: ' + e.message);
          }
        }
      });
    }
  };

  const handleAdminToggleOrdersChange = (newChecked) => {
    const keyId = apiKey?.id;
    if (!keyId) return;

    // Guard: Cannot enable Order API if API key / Product API is disabled
    if (!apiKey?.is_active && newChecked) {
      alert('Cannot enable Order API while Product API is disabled. Please activate the API Key first.');
      return;
    }

    triggerConfirm({
      title: newChecked ? 'Enable Order API Access' : 'Disable Order API Access',
      message: newChecked
        ? `Grant /api/v1/orders access to ${apiKey?.client_name || 'this client'}? They will be authorized to submit wholesale dropship orders.`
        : `Revoke /api/v1/orders access for ${apiKey?.client_name || 'this client'}? Any subsequent order requests will receive 403 Forbidden.`,
      confirmLabel: newChecked ? 'Enable Order API' : 'Disable Order API',
      isDanger: !newChecked,
      clientName: apiKey?.client_name,
      onConfirm: async () => {
        try {
          const { data, error } = await developerService.updateApiKey(keyId, {
            orders_enabled: newChecked,
          });
          if (error) throw error;
          setApiKey(prev => ({ ...prev, orders_enabled: newChecked }));
          setAdminOrdersEnabled(newChecked);
          if (onAdminUpdate) onAdminUpdate({ ...apiKey, orders_enabled: newChecked });
        } catch (e) {
          alert('Failed to update Order API access: ' + e.message);
        }
      },
    });
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
        orders_enabled: false,
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
    triggerConfirm({
      title: 'Regenerate Secret Key',
      message: 'The current production key will stop working immediately. Connected plugins must be updated with the new key.',
      confirmLabel: 'Regenerate Key',
      isDanger: true,
      requiredInputText: 'REGENERATE',
      onConfirm: async () => {
        try {
          const { keyRecord, rawSecretKey } = await developerService.regenerateApiKey(apiKey.id);
          setApiKey(keyRecord);
          setNewGeneratedSecret(rawSecretKey);
          setRevealedKey(rawSecretKey);
          alert('New API Key generated successfully! Please copy and store it safely.');
        } catch (err) {
          alert('Failed to regenerate key: ' + err.message);
        }
      }
    });
  };

  const handleDeleteApiKey = async () => {
    if (!apiKey?.id) return;
    triggerConfirm({
      title: 'Delete API Key',
      message: 'This action cannot be undone. All connected storefront plugins and feeds using this key will immediately lose access.',
      confirmLabel: 'Delete Key',
      isDanger: true,
      requiredInputText: 'DELETE',
      onConfirm: async () => {
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
      }
    });
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
        orders_enabled: adminOrdersEnabled,
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
      const activeKeyToUse = (revealedKey || apiKey?.key_prefix || '').trim();
      if (!activeKeyToUse || activeKeyToUse.includes('...') || activeKeyToUse.includes('••••')) {
        setTestStatus(401);
        setTestResponse({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Full unmasked API secret key required. For security, full keys are shown only once upon generation. Please test using curl or Postman with your saved secret key.',
        });
        setTestLoading(false);
        return;
      }
      const headers = {
        'X-API-Key': activeKeyToUse,
      };
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
            <Sliders size={14} className="dev-admin-sliders-icon" />
            <div>
              <span>Admin Inspection:</span> <strong>{apiKey?.client_name || 'Client'}</strong> <span className="dev-admin-email">({apiKey?.profiles?.email || 'No email'})</span>
            </div>
          </div>
          <div className="dev-admin-quick-toggles">
            <label
              className="dev-toggle-label"
              style={{
                opacity: !adminIsActive ? 0.6 : 1,
                cursor: !adminIsActive ? 'not-allowed' : 'pointer',
              }}
              title={!adminIsActive ? 'Cannot enable Order API: API key is disabled' : undefined}
            >
              <span>Order API:</span>
              <input
                type="checkbox"
                checked={Boolean(apiKey?.orders_enabled && adminIsActive)}
                disabled={!adminIsActive}
                onChange={(e) => handleAdminToggleOrdersChange(e.target.checked)}
              />
              <span className={(apiKey?.orders_enabled && adminIsActive) ? 'dev-status-pill active' : 'dev-status-pill disabled'}>
                {(apiKey?.orders_enabled && adminIsActive) ? 'ON' : 'OFF'}
              </span>
            </label>
            <label className="dev-toggle-label">
              <span>Status:</span>
              <input
                type="checkbox"
                checked={adminIsActive}
                onChange={(e) => handleAdminToggleActiveChange(e.target.checked)}
              />
              <span className={adminIsActive ? 'dev-status-pill active' : 'dev-status-pill disabled'}>
                {adminIsActive ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* 2. User & Storefront Activation Profile Card with Integrated Actions */}
      <UserActivationInfoCard
        apiKey={apiKey}
        user={user}
        buyerProfile={buyerProfile}
        isAdminMode={isAdminMode}
        copiedField={copiedField}
        copyToClipboard={copyToClipboard}
        tierInfo={tierInfo}
        onRegenerateKey={handleRegenerateKey}
        onDeleteApiKey={handleDeleteApiKey}
      />

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
        <div className="dev-card-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="dev-card-title">
            <KeyRound size={16} />
            <h3>API Credentials</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="dev-action-chip"
              style={{ height: '30px', fontSize: '0.75rem', gap: '5px', cursor: 'pointer' }}
              onClick={handleRegenerateKey}
              title="Generate a new API secret key"
            >
              <RefreshCw size={12} />
              <span>Regenerate Key</span>
            </button>
            <button
              type="button"
              className="dev-action-chip"
              style={{ height: '30px', fontSize: '0.75rem', gap: '5px', color: '#dc2626', borderColor: '#fecaca', background: '#ffffff', cursor: 'pointer' }}
              onClick={handleDeleteApiKey}
              title="Permanently revoke and delete this API key"
            >
              <Trash2 size={12} />
              <span>Revoke Key</span>
            </button>
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

      {/* 5. API Permissions & Integration Status */}
      <div className="dev-card">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <Shield size={16} style={{ color: '#64748b' }} />
            <h3>API Permissions &amp; Endpoint Access</h3>
          </div>
        </div>
        <div className="dev-permissions-grid">
          <div className="dev-permission-item">
            <div className="dev-permission-head">
              <span className="dev-permission-title">Wholesale Catalog</span>
              <span className="dev-permission-status active">
                <span className="dev-permission-dot" />
                Active
              </span>
            </div>
            <div className="dev-permission-foot">
              <span className="dev-permission-endpoint">GET /catalog, /products/:sku</span>
            </div>
          </div>

          <div className="dev-permission-item">
            <div className="dev-permission-head">
              <span className="dev-permission-title">Live Stock Status</span>
              <span className="dev-permission-status active">
                <span className="dev-permission-dot" />
                Active
              </span>
            </div>
            <div className="dev-permission-foot">
              <span className="dev-permission-endpoint">GET /stock-status</span>
            </div>
          </div>

          <div className="dev-permission-item">
            <div className="dev-permission-head">
              <span className="dev-permission-title">Order Placement</span>
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={() => handleAdminToggleOrdersChange(!apiKey?.orders_enabled)}
                  disabled={!apiKey?.is_active}
                  className={`dev-permission-toggle-btn ${(apiKey?.orders_enabled && apiKey?.is_active) ? 'active' : 'disabled'}`}
                  title={!apiKey?.is_active ? 'Cannot enable Order API: API key is disabled' : 'Toggle Order API Access'}
                >
                  <span className="dev-permission-dot" />
                  {(apiKey?.orders_enabled && apiKey?.is_active) ? 'Enabled' : 'Disabled'}
                </button>
              ) : (
                <span className={`dev-permission-status ${apiKey?.orders_enabled ? 'active' : 'disabled'}`}>
                  <span className="dev-permission-dot" />
                  {apiKey?.orders_enabled ? 'Active' : 'Disabled'}
                </span>
              )}
            </div>
            <div className="dev-permission-foot">
              <span className="dev-permission-endpoint">POST /orders</span>
              {!apiKey?.orders_enabled && !isAdminMode && (
                <span className="dev-permission-note">Growth tier only</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Curated Catalog Selection & Storefront Sync */}
      <div className={`dev-card dev-curator-card ${isCuratorGridOpen ? 'open' : ''}`} id="catalog-curator">
        <div
          className="dev-card-head"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderBottom: isCuratorGridOpen ? '1px solid #f1f5f9' : 'none',
          }}
        >
          <div className="dev-card-title">
            <ShoppingBag size={16} style={{ color: '#64748b' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0f172a' }}>
                  Curated Catalog Sync
                </h3>
                <span className={`dev-quiet-status-tag ${selectedSkus.length > 0 ? 'active' : 'inactive'}`}>
                  <span className="dev-quiet-dot" />
                  {selectedSkus.length > 0
                    ? `${selectedSkus.length} ${selectedSkus.length === 1 ? 'product' : 'products'} selected`
                    : 'No products selected'}
                </span>
              </div>
              <p className="dev-card-subtitle" style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Select the specific products you want to sync with your Shopify or WooCommerce storefront.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dev-action-chip"
            style={{
              height: '30px',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: isCuratorGridOpen ? '#f1f5f9' : '#ffffff',
            }}
            onClick={() => {
              if (!isCuratorGridOpen) {
                handleOpenCuratorGrid();
              } else {
                setIsCuratorGridOpen(false);
              }
            }}
          >
            {isCuratorGridOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{isCuratorGridOpen ? 'Close Grid' : (selectedSkus.length > 0 ? 'Edit Selection' : 'Pick Products')}</span>
          </button>
        </div>

        {isCuratorGridOpen && (
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

      {/* 6. Platform Integration Guides (Shopify, WooCommerce, PrestaShop, cURL) - Reseller User Mode Only */}
      {!isAdminMode && (
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
      )}

      {/* 7. Interactive Live API Test Console - Reseller User Mode Only */}
      {!isAdminMode && (
        <div className="dev-card">
          <div className="dev-card-head">
            <div className="dev-card-title">
              <Play size={18} />
              <h3>Live API Test Console</h3>
            </div>
          </div>

          <div className="dev-test-console">
            <div className="dev-test-bar">
              <div className="dev-test-input-group">
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
              </div>
              <button
                type="button"
                onClick={handleRunApiTest}
                disabled={testLoading}
                className="dev-send-btn"
              >
                {testLoading ? <RefreshCw size={15} className="spin-icon" /> : <Play size={15} />}
                <span>{testLoading ? 'SENDING...' : 'SEND REQUEST'}</span>
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
      )}

      {/* Confirmation Modal for Admin Actions */}
      <ConfirmActionModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        isDanger={confirmDialog.isDanger}
        requiredInputText={confirmDialog.requiredInputText}
        clientName={confirmDialog.clientName}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
