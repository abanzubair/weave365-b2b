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
  const [editSaving, setEditSaving] = useState(false);

  const handleOpenEditModal = (item) => {
    setEditingKey(item);
    setEditTier(item.tier || 'free');
    setEditQuota(item.monthly_quota || 2000);
    setEditRps(item.rate_limit_rps || 1);
    setEditIsActive(item.is_active ?? true);
  };

  const handleSaveEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingKey) return;
    setEditSaving(true);
    try {
      const quotaNum = parseInt(editQuota, 10) || 2000;
      const rpsNum = parseInt(editRps, 10) || 1;
      const { error } = await developerService.updateApiKey(editingKey.id, {
        tier: editTier,
        monthly_quota: quotaNum,
        rate_limit_rps: rpsNum,
        is_active: editIsActive,
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

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const client = (k.client_name || '').toLowerCase();
        const email = (k.profiles?.email || '').toLowerCase();
        const website = (k.client_website || '').toLowerCase();
        return client.includes(q) || email.includes(q) || website.includes(q);
      }
      return true;
    });
  }, [allKeys, tierFilter, statusFilter, searchQuery]);

  // Toggle active status
  const handleToggleActive = (item) => {
    const keyId = item.id;
    const currentStatus = item.is_active;
    const clientName = item.client_name || 'Client';

    if (currentStatus) {
      // Disabling
      triggerConfirm({
        title: 'Disable API Access',
        message: 'Live storefront requests from this client will immediately receive 403 Forbidden errors and stop syncing products or orders.',
        confirmLabel: 'Disable Access',
        isDanger: true,
        clientName,
        onConfirm: async () => {
          try {
            const { error } = await developerService.updateApiKey(keyId, {
              is_active: false,
            });
            if (error) throw error;
            setAllKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, is_active: false } : k)));
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
    <div className="api-manager-container">
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
            <span className="admin-stat-label">Connected Storefronts</span>
            <div className="admin-stat-icon-wrap">
              <Users size={16} />
            </div>
          </div>
          <div className="admin-stat-value">
            {systemOverview?.activeKeysCount || 0}{' '}
            <span>/ {systemOverview?.totalKeysCount || 0} active</span>
          </div>
          <div className="admin-stat-subtext">
            {systemOverview?.paidTiersCount || 0} paid subscription clients (Growth / Pro)
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
        </div>
      </div>

      {/* 5. Clients Table */}
      <div className="api-table-wrapper">
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
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`api-status-btn ${item.is_active ? 'active' : 'disabled'}`}
                      title={item.is_active ? 'Click to disable API key' : 'Click to enable API key'}
                    >
                      <span className="api-status-dot" />
                      {item.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className="api-action-group">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Contact Reseller on WhatsApp"
                          className="api-action-btn api-wa-btn"
                        >
                          <MessageCircle size={15} style={{ flexShrink: 0 }} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit Tier & Quota Overrides"
                        className="api-action-btn api-edit-btn"
                      >
                        <Sliders size={14} style={{ flexShrink: 0 }} /> <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectedKeyId(item.id)}
                        title="Inspect Live User Dashboard"
                        className="api-action-btn api-inspect-btn"
                      >
                        <Eye size={14} style={{ flexShrink: 0 }} /> <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(item.id, item.client_name)}
                        title="Revoke API Key"
                        className="api-action-btn api-delete-btn"
                      >
                        <Trash2 size={14} style={{ flexShrink: 0 }} />
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
              Configure pricing tier, monthly request quota, and rate limits for <strong>{editingKey.client_name}</strong> ({editingKey.profiles?.email || 'No email'}).
            </p>

            <form onSubmit={handleSaveEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
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

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Key Status: {editIsActive ? <span style={{ color: '#16a34a' }}>Active & Live</span> : <span style={{ color: '#dc2626' }}>Deactivated / Suspended</span>}
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
                  🎉 API Key Created Successfully!
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
