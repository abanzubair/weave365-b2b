/**
 * @file ApiManager.jsx
 * @description Admin Panel Management View for Weave365 B2B Developer API System.
 * Provides system quota monitoring vs Supabase Free Tier (50,000 safe ceiling),
 * client key provisioning, instant enable/disable toggles, tier assignment,
 * and live "Inspect User Dashboard" mirroring.
 * 
 * @module views/admin/ApiManager
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2,
  KeyRound,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  Shield,
  Sliders,
  DollarSign,
  TrendingUp,
  Globe,
  Trash2,
  Power,
  Eye,
  MessageCircle,
  Copy,
  Check,
  Zap,
  ArrowLeft,
  X,
  ShoppingBag,
} from 'lucide-react';
import { developerService, TIER_CONFIGS } from '../../services/developerService.js';
import { DeveloperDashboard, ConfirmActionModal } from '../../components/developer/DeveloperDashboard.jsx';
import '../../styles/developerDashboard.css';

export default function ApiManager({ adminData, loadAdminData, user }) {
  const [loading, setLoading] = useState(true);
  const [systemOverview, setSystemOverview] = useState(null);
  const [allKeys, setAllKeys] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [endpointFilter, setEndpointFilter] = useState('all');
  
  // Selected user for "Inspect Dashboard" mode
  const [inspectedKeyId, setInspectedKeyId] = useState(null);

  // Confirmation Dialog State
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

  const triggerConfirm = ({ title, message, confirmLabel, isDanger = false, requiredInputText = null, clientName, onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: confirmLabel || (isDanger ? 'Yes, Proceed' : 'Confirm'),
      cancelLabel: 'Cancel',
      isDanger,
      requiredInputText,
      clientName: clientName || 'Client',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  // Edit Client Tier & Quota Overrides Modal (Directly on Admin Table)
  const [editingKey, setEditingKey] = useState(null);
  const [editTier, setEditTier] = useState('free');
  const [editQuota, setEditQuota] = useState(2000);
  const [editRps, setEditRps] = useState(1);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editOrdersEnabled, setEditOrdersEnabled] = useState(false);
  const [editClientWebsite, setEditClientWebsite] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const handleOpenEditModal = (item) => {
    setEditingKey(item);
    setEditTier(item.tier || 'free');
    setEditQuota(item.monthly_quota || 2000);
    setEditRps(item.rate_limit_rps || 1);
    setEditIsActive(item.is_active ?? true);
    setEditOrdersEnabled(Boolean(item.orders_enabled));
    setEditClientWebsite(item.client_website || '');
  };

  const handleSaveEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingKey) return;
    setEditSaving(true);
    try {
      const quotaNum = parseInt(editQuota, 10) || 2000;
      const rpsNum = parseInt(editRps, 10) || 1;
      const finalOrdersEnabled = editIsActive ? editOrdersEnabled : false;
      const { error } = await developerService.updateApiKey(editingKey.id, {
        tier: editTier,
        monthly_quota: quotaNum,
        rate_limit_rps: rpsNum,
        is_active: editIsActive,
        orders_enabled: finalOrdersEnabled,
        client_website: editClientWebsite.trim(),
      });
      if (error) throw error;
      setAllKeys((prev) =>
        prev.map((k) =>
          k.id === editingKey.id
            ? {
                ...k,
                tier: editTier,
                monthly_quota: quotaNum,
                rate_limit_rps: rpsNum,
                is_active: editIsActive,
                orders_enabled: finalOrdersEnabled,
                client_website: editClientWebsite.trim(),
              }
            : k
        )
      );
      setEditingKey(null);
    } catch (err) {
      alert('Failed to save API settings: ' + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // New Client Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [newTier, setNewTier] = useState('growth');
  const [newOrdersEnabled, setNewOrdersEnabled] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKeySecret, setNewlyCreatedKeySecret] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const overview = await developerService.getSystemApiOverview();
      setSystemOverview(overview);
      setAllKeys(overview.allKeys || []);
    } catch (err) {
      console.error('[ApiManager] Error fetching overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOverview();
  }, []);

  // Filtered keys
  const filteredKeys = useMemo(() => {
    return allKeys.filter((k) => {
      if (tierFilter !== 'all' && k.tier !== tierFilter) return false;
      if (statusFilter === 'active' && !k.is_active) return false;
      if (statusFilter === 'disabled' && k.is_active) return false;

      if (endpointFilter === 'orders_on' && !k.orders_enabled) return false;
      if (endpointFilter === 'orders_off' && k.orders_enabled) return false;
      if (endpointFilter === 'curated' && !(k.catalog_mode === 'curated' && (k.selected_skus || []).length > 0)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = (k.client_name || '').toLowerCase();
        const email = (k.profiles?.email || '').toLowerCase();
        const website = (k.client_website || '').toLowerCase();
        return client.includes(q) || email.includes(q) || website.includes(q);
      }
      return true;
    });
  }, [allKeys, tierFilter, statusFilter, endpointFilter, searchQuery]);

  // Toggle active status
  const handleToggleActive = (item) => {
    const keyId = item.id;
    const currentStatus = item.is_active;
    const clientName = item.client_name || 'Client';

    if (currentStatus) {
      // Disabling Product API / Master Key Access
      triggerConfirm({
        title: 'Disable API Access',
        message: 'Live storefront requests from this client will immediately receive 403 Forbidden errors and stop syncing products or orders. Order API will also be automatically disabled.',
        confirmLabel: 'Disable Access',
        isDanger: true,
        clientName,
        onConfirm: async () => {
          try {
            const { error } = await developerService.updateApiKey(keyId, {
              is_active: false,
              orders_enabled: false,
            });
            if (error) throw error;
            setAllKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, is_active: false, orders_enabled: false } : k)));
          } catch (err) {
            alert('Failed to update status: ' + err.message);
          }
        }
      });
    } else {
      // Enabling
      triggerConfirm({
        title: 'Enable API Access',
        message: 'Restore API access for this client? Incoming requests from their storefront will resume immediately.',
        confirmLabel: 'Enable Access',
        isDanger: false,
        clientName,
        onConfirm: async () => {
          try {
            const { error } = await developerService.updateApiKey(keyId, {
              is_active: true,
            });
            if (error) throw error;
            setAllKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, is_active: true } : k)));
          } catch (err) {
            alert('Failed to update status: ' + err.message);
          }
        }
      });
    }
  };

  // Toggle Order API access directly from table
  const handleToggleOrders = (item) => {
    const keyId = item.id;
    const currentStatus = Boolean(item.orders_enabled);
    const clientName = item.client_name || 'Client';

    // Guard: Order API CANNOT be enabled if Product API is disabled!
    if (!item.is_active && !currentStatus) {
      alert('Cannot enable Order API while Product API is disabled. Please activate the Product API first.');
      return;
    }

    triggerConfirm({
      title: currentStatus ? 'Disable Order API Access' : 'Enable Order API Access',
      message: currentStatus
        ? `Revoke Order API (/api/v1/orders) access for ${clientName}? Any automated dropship orders submitted by their storefront will receive 403 Forbidden.`
        : `Grant Order API (/api/v1/orders) access to ${clientName}? Their external storefront will be authorized to submit wholesale dropship orders.`,
      confirmLabel: currentStatus ? 'Disable Orders' : 'Enable Orders',
      isDanger: currentStatus,
      clientName,
      onConfirm: async () => {
        try {
          const { error } = await developerService.updateApiKey(keyId, {
            orders_enabled: !currentStatus,
          });
          if (error) throw error;
          setAllKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, orders_enabled: !currentStatus } : k)));
        } catch (err) {
          alert('Failed to update Order API access: ' + err.message);
        }
      },
    });
  };

  // Delete key
  const handleDeleteKey = (keyId, clientName) => {
    triggerConfirm({
      title: 'Delete API Key',
      message: 'This action cannot be undone. All connected storefront plugins and feeds using this key will immediately lose access.',
      confirmLabel: 'Delete Key',
      isDanger: true,
      requiredInputText: 'DELETE',
      clientName,
      onConfirm: async () => {
        try {
          const { error } = await developerService.deleteApiKey(keyId);
          if (error) throw error;
          setAllKeys((prev) => prev.filter((k) => k.id !== keyId));
          if (inspectedKeyId === keyId) setInspectedKeyId(null);
          alert('API Key revoked successfully.');
        } catch (err) {
          alert('Failed to delete key: ' + err.message);
        }
      }
    });
  };

  // Create Key Submit
  const handleCreateClientSubmit = async (e) => {
    e.preventDefault();
    if (!newUserId) {
      alert('Please select a user account to link this API key to.');
      return;
    }
    setCreatingKey(true);
    try {
      const { keyRecord, rawSecretKey } = await developerService.createApiKey(newUserId, {
        clientName: newClientName,
        clientWebsite: newClientWebsite,
        tier: newTier,
        orders_enabled: newOrdersEnabled,
      });
      setNewlyCreatedKeySecret(rawSecretKey);
      await fetchOverview();
    } catch (err) {
      alert('Failed to create API Key: ' + err.message);
    } finally {
      setCreatingKey(false);
    }
  };

  const inspectedRecord = useMemo(() => {
    return allKeys.find((k) => k.id === inspectedKeyId);
  }, [allKeys, inspectedKeyId]);

  const candidateProfiles = useMemo(() => {
    return adminData?.profiles || [];
  }, [adminData?.profiles]);

  return (
    <div className="api-manager-container" style={{ maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
      {/* 1. Header & Summary Stats */}
      <div className="api-manager-header">
        <div className="api-header-title-block">
          <h1 className="api-manager-title">
            Developer API Manager
          </h1>
          <p className="api-manager-subtitle">
            Manage connected storefronts, inspect client keys, and configure tier rate limits.
          </p>
        </div>

        <div className="api-header-actions">
          <button
            type="button"
            className="api-btn-secondary"
            onClick={fetchOverview}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="api-btn-primary"
            onClick={() => {
              setNewlyCreatedKeySecret(null);
              setCreateModalOpen(true);
            }}
          >
            <Plus size={15} /> Provision Client Key
          </button>
        </div>
      </div>

      {/* 2. System Quota & Revenue Metric Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-label">System Monthly Load</span>
            <div className="admin-stat-icon-wrap">
              <Code2 size={16} />
            </div>
          </div>
          <div className="admin-stat-value">
            {systemOverview?.totalRequestsThisMonth.toLocaleString() || 0}{' '}
            <span>/ {systemOverview?.safetyLimit.toLocaleString()} req</span>
          </div>
          <div className="admin-stat-progress-wrap">
            <div
              className="admin-stat-progress-bar"
              style={{
                transform: `scaleX(${Math.min(1, (systemOverview?.safetyUsagePercent || 0) / 100)})`,
                background: (systemOverview?.safetyUsagePercent || 0) > 75 ? '#ef4444' : '#10b981',
              }}
            />
          </div>
          <div className="admin-stat-subtext">
            {systemOverview?.safetyUsagePercent || 0}% of 10% safety budget used • 90% reserved for main site
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-label">Order API Authorization</span>
            <div className="admin-stat-icon-wrap">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="admin-stat-value">
            {allKeys.filter(k => k.orders_enabled).length}{' '}
            <span>/ {allKeys.length} enabled</span>
          </div>
          <div className="admin-stat-subtext">
            Product API enabled for all {allKeys.length} keys
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-label">Estimated Monthly Revenue</span>
            <div className="admin-stat-icon-wrap">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="admin-stat-value">
            ₹{(systemOverview?.monthlyRevenueEst || 0).toLocaleString()}{' '}
            <span>/ mo</span>
          </div>
          <div className="admin-stat-subtext">
            SaaS subscription recurring revenue from API partners
          </div>
        </div>
      </div>



      {/* 4. Filter & Search Bar */}
      <div className="api-filter-bar">
        <div className="api-search-box">
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            className="api-search-input"
            placeholder="Search by storefront, website, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="api-filter-selects">
          <select
            className="api-select"
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="free">Starter (Free)</option>
            <option value="growth">Growth Partner (₹699)</option>
            <option value="pro">Pro / Scale (₹1,499)</option>
          </select>

          <select
            className="api-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>

          <select
            className="api-select"
            value={endpointFilter}
            onChange={(e) => setEndpointFilter(e.target.value)}
          >
            <option value="all">All Permissions</option>
            <option value="orders_on">Order API: Enabled</option>
            <option value="orders_off">Order API: Disabled</option>
            <option value="curated">Curated Catalog Only</option>
          </select>
        </div>
      </div>

      {/* 5. Clients Table */}
      <div className="api-table-wrapper" style={{ maxWidth: '1600px', width: '100%' }}>
        <table className="api-table">
          <thead>
            <tr>
              <th>Storefront / Client</th>
              <th>User Account</th>
              <th>Tier</th>
              <th>Monthly Usage</th>
              <th>Rate Limit</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map((item) => {
              const tierInfo = TIER_CONFIGS[item.tier] || TIER_CONFIGS.free;
              const phone = item.profiles?.whatsapp || '';
              const whatsappUrl = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(item.client_name)},%20regarding%20your%20Weave365%20API%20integration...` : null;

              return (
                <tr key={item.id}>
                  <td>
                    <strong className="api-client-title">{item.client_name}</strong>
                    {item.client_website ? (
                      <a
                        href={item.client_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="api-client-link"
                      >
                        <Globe size={11} /> {item.client_website} <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="api-no-website">No website specified</span>
                    )}
                  </td>

                  <td>
                    <span className="api-user-email">{item.profiles?.email || 'N/A'}</span>
                    <small className="api-user-name">{item.profiles?.full_name || item.profiles?.business_name || ''}</small>
                  </td>

                  <td>
                    <span className={`api-tier-tag ${item.tier}`}>
                      {tierInfo.name}
                    </span>
                    <div className="api-tier-price">{tierInfo.priceLabel}</div>
                  </td>

                  <td>
                    <div className="api-usage-cell">
                      <div className="api-usage-nums">
                        <span className="api-usage-used">{item.monthTotal.toLocaleString()}</span>
                        <span className="api-usage-total"> / {item.monthly_quota.toLocaleString()}</span>
                      </div>
                      <div className="api-mini-progress-wrap">
                        <div
                          className="api-mini-progress-bar"
                          style={{
                            transform: `scaleX(${Math.min(1, (item.quotaPercent || 0) / 100)})`,
                            background: item.quotaPercent > 85 ? '#ef4444' : item.quotaPercent > 60 ? '#f59e0b' : '#0f172a',
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="api-rps-badge">
                      {item.rate_limit_rps || 1} req/s
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                      {/* 1. Order API Tag */}
                      <button
                        type="button"
                        onClick={() => handleToggleOrders(item)}
                        disabled={!item.is_active}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: (item.is_active && item.orders_enabled) ? '#ecfdf5' : '#f1f5f9',
                          border: `1px solid ${(item.is_active && item.orders_enabled) ? '#a7f3d0' : '#e2e8f0'}`,
                          color: (item.is_active && item.orders_enabled) ? '#065f46' : '#64748b',
                          cursor: !item.is_active ? 'not-allowed' : 'pointer',
                          opacity: !item.is_active ? 0.6 : 1,
                          whiteSpace: 'nowrap',
                          lineHeight: '1.4',
                          transition: 'all 0.15s ease',
                        }}
                        title={
                          !item.is_active
                            ? 'Cannot enable Order API: Product API must be enabled first'
                            : item.orders_enabled
                            ? 'Order API is Enabled (Click to Disable)'
                            : 'Order API is Disabled (Click to Enable)'
                        }
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: (item.is_active && item.orders_enabled) ? '#10b981' : '#94a3b8',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span>Order: {(item.is_active && item.orders_enabled) ? 'Enabled' : 'Disabled'}</span>
                      </button>

                      {/* 2. Product API Tag */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: item.is_active ? '#ecfdf5' : '#f1f5f9',
                          border: `1px solid ${item.is_active ? '#a7f3d0' : '#e2e8f0'}`,
                          color: item.is_active ? '#065f46' : '#64748b',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.4',
                          transition: 'all 0.15s ease',
                        }}
                        title={item.is_active ? 'Product API is Enabled (Click to Deactivate key)' : 'Product API is Disabled (Click to Activate key)'}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: item.is_active ? '#10b981' : '#94a3b8',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span>Product: {item.is_active ? 'Enabled' : 'Disabled'}</span>
                      </button>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right', width: '160px' }}>
                    <div className="api-action-grid">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit Tier & Quota Overrides"
                        className="api-action-btn api-edit-btn"
                        aria-label="Edit Key"
                      >
                        <Sliders size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectedKeyId(item.id)}
                        title="Inspect Live User Dashboard"
                        className="api-action-btn api-inspect-btn"
                        aria-label="Inspect Dashboard"
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                      {whatsappUrl ? (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Contact Reseller on WhatsApp"
                          className="api-action-btn api-wa-btn"
                          aria-label="WhatsApp Chat"
                        >
                          <MessageCircle size={12} />
                          <span>Chat</span>
                        </a>
                      ) : (
                        <span className="api-action-btn-placeholder" />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(item.id, item.client_name)}
                        title="Revoke API Key"
                        className="api-action-btn api-delete-btn"
                        aria-label="Delete Key"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredKeys.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  <KeyRound size={28} style={{ color: '#cbd5e1', margin: '0 auto 8px auto', display: 'block' }} />
                  <strong style={{ display: 'block', color: '#334155', marginBottom: '4px' }}>No API Clients Found</strong>
                  <span style={{ fontSize: '0.8125rem' }}>No client matches your current filter criteria or no API keys have been generated yet.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Admin Controls: Tier & Quota Overrides Modal (Outside Table) */}
      {editingKey && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <Sliders size={20} style={{ color: '#0f172a' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Admin Controls: Tier & Quota Overrides
              </h2>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              Configure pricing tier, monthly request quota, order access, and rate limits for <strong>{editingKey.client_name}</strong> ({editingKey.profiles?.email || 'No email'}).
            </p>

            <form onSubmit={handleSaveEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Storefront Website URL:
                <input
                  type="url"
                  placeholder="https://example-reseller.com"
                  value={editClientWebsite}
                  onChange={(e) => setEditClientWebsite(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Plan / Pricing Tier:
                <select
                  value={editTier}
                  onChange={(e) => {
                    const nextTier = e.target.value;
                    setEditTier(nextTier);
                    const cfg = TIER_CONFIGS[nextTier];
                    if (cfg) {
                      setEditQuota(cfg.monthlyQuota);
                      setEditRps(cfg.rateLimitRps);
                    }
                  }}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#ffffff', color: '#0f172a' }}
                >
                  <option value="free">Starter (Free) - 2,000 req/mo</option>
                  <option value="growth">Growth Partner (₹699/mo) - 20,000 req/mo</option>
                  <option value="pro">Pro / Scale (₹1,499/mo) - 75,000 req/mo</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Monthly Request Quota:
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  required
                  value={editQuota}
                  onChange={(e) => setEditQuota(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                Rate Limit (Req / Sec):
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={editRps}
                  onChange={(e) => setEditRps(e.target.value)}
                  style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer', marginTop: '2px' }}>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => {
                    const active = e.target.checked;
                    setEditIsActive(active);
                    if (!active) setEditOrdersEnabled(false);
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>
                  Product API (API Key Status): {editIsActive ? <strong style={{ color: '#16a34a' }}>Active & Live</strong> : <span style={{ color: '#dc2626' }}>Deactivated / Suspended</span>}
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: !editIsActive ? '#94a3b8' : '#334155',
                  cursor: !editIsActive ? 'not-allowed' : 'pointer',
                  marginTop: '2px',
                  background: !editIsActive ? '#f1f5f9' : (editOrdersEnabled ? '#f0fdf4' : '#f8fafc'),
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${!editIsActive ? '#e2e8f0' : (editOrdersEnabled ? '#86efac' : '#e2e8f0')}`,
                  opacity: !editIsActive ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={editIsActive && editOrdersEnabled}
                  disabled={!editIsActive}
                  onChange={(e) => {
                    if (!editIsActive) return;
                    setEditOrdersEnabled(e.target.checked);
                  }}
                  style={{ width: '16px', height: '16px', cursor: !editIsActive ? 'not-allowed' : 'pointer' }}
                />
                <span>
                  Order API Access:{' '}
                  {!editIsActive ? (
                    <span style={{ color: '#94a3b8' }}>Disabled (Product API must be enabled first)</span>
                  ) : editOrdersEnabled ? (
                    <strong style={{ color: '#16a34a' }}>Enabled (Authorized for /api/v1/orders)</strong>
                  ) : (
                    <span style={{ color: '#64748b' }}>Disabled (Default 403 Forbidden)</span>
                  )}
                </span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="api-btn-secondary"
                  onClick={() => setEditingKey(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="api-btn-primary"
                >
                  {editSaving ? <RefreshCw size={14} className="spin-icon" /> : <Check size={14} />}
                  Save Client API Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Provision New API Client Modal */}
      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#0f172a' }}>
              Provision New B2B API Key
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              Generate an authenticated API key for a reseller or external website.
            </p>

            {newlyCreatedKeySecret ? (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <strong style={{ color: '#15803d', display: 'block', marginBottom: '4px', fontSize: '0.9375rem' }}>
                  API Key Created Successfully!
                </strong>
                <p style={{ fontSize: '0.8125rem', color: '#166534', margin: '0 0 10px 0' }}>
                  Copy this key now to send to the reseller via WhatsApp. It will not be shown in plain text again:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <code style={{ fontFamily: 'monospace', fontSize: '0.875rem', flex: 1, wordBreak: 'break-all', color: '#0f172a', fontWeight: 600 }}>
                    {newlyCreatedKeySecret}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedKeySecret);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="api-btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />} {copiedKey ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="api-btn-secondary"
                  style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Link to User Profile:
                  <select
                    required
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#ffffff', color: '#0f172a' }}
                  >
                    <option value="">-- Select Registered User --</option>
                    {candidateProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.business_name || p.full_name || 'User'} ({p.email || p.whatsapp || p.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Client / Storefront Name:
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reseller Boutique / Storefront"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Client Website URL *:
                  <input
                    type="url"
                    required
                    placeholder="https://www.example.com"
                    value={newClientWebsite}
                    onChange={(e) => setNewClientWebsite(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Pricing Tier:
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#ffffff', color: '#0f172a' }}
                  >
                    <option value="free">Starter (Free) - 2,000 req/mo</option>
                    <option value="growth">Growth Partner (₹699/mo) - 20,000 req/mo + Order API</option>
                    <option value="pro">Pro / Scale (₹1,499/mo) - 75,000 req/mo</option>
                  </select>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer', marginTop: '2px', background: newOrdersEnabled ? '#f0fdf4' : '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${newOrdersEnabled ? '#86efac' : '#e2e8f0'}` }}>
                  <input
                    type="checkbox"
                    checked={newOrdersEnabled}
                    onChange={(e) => setNewOrdersEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>
                    Enable Order API Access (Default: OFF)
                  </span>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="api-btn-secondary"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className="api-btn-primary"
                  >
                    {creatingKey ? <RefreshCw size={14} className="spin-icon" /> : <Zap size={14} />}
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 8. Live Reseller Dashboard Inspection Modal */}
      {inspectedKeyId && inspectedRecord && (
        <div className="api-inspect-modal-overlay">
          <div className="api-inspect-modal-content">
            
            {/* Modal Top Control Bar */}
            <div className="api-inspect-top-bar">
              <div className="api-inspect-top-left">
                <div className="api-inspect-nav-row">
                  <button
                    type="button"
                    className="api-inspect-back-btn"
                    onClick={() => setInspectedKeyId(null)}
                  >
                    <ArrowLeft size={15} /> <span>Back to Table</span>
                  </button>
                  <button
                    type="button"
                    className="api-inspect-close-btn mobile-only-inspect-close"
                    onClick={() => setInspectedKeyId(null)}
                    title="Close Inspector"
                    aria-label="Close Inspector"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="api-inspect-select-wrap">
                  <span className="api-inspect-select-label">Inspect Client:</span>
                  <select
                    className="api-inspect-select"
                    value={inspectedKeyId}
                    onChange={(e) => setInspectedKeyId(e.target.value)}
                  >
                    {allKeys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.client_name} ({k.profiles?.email || 'No email'}) - {k.tier.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="api-inspect-close-btn desktop-only-inspect-close"
                onClick={() => setInspectedKeyId(null)}
                title="Close Inspector"
                aria-label="Close Inspector"
              >
                <X size={16} /> <span>Close</span>
              </button>
            </div>

            <DeveloperDashboard
              apiKeyRecord={inspectedRecord}
              isAdminMode={true}
              onAdminUpdate={(updatedKey) => {
                if (!updatedKey) {
                  setAllKeys((prev) => prev.filter((k) => k.id !== inspectedKeyId));
                  setInspectedKeyId(null);
                } else {
                  setAllKeys((prev) => prev.map((k) => (k.id === updatedKey.id ? { ...k, ...updatedKey } : k)));
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Sensitive Actions */}
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
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
