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
  ArrowLeft
} from 'lucide-react';
import { developerService, TIER_CONFIGS } from '../../services/developerService.js';
import { DeveloperDashboard } from '../../components/developer/DeveloperDashboard.jsx';
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
  const handleToggleActive = async (keyId, currentStatus) => {
    try {
      const { data, error } = await developerService.updateApiKey(keyId, {
        is_active: !currentStatus,
      });
      if (error) throw error;
      setAllKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, is_active: !currentStatus } : k)));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Delete key
  const handleDeleteKey = async (keyId, clientName) => {
    if (!window.confirm(`Are you sure you want to permanently revoke the API key for "${clientName}"?`)) return;
    try {
      const { error } = await developerService.deleteApiKey(keyId);
      if (error) throw error;
      setAllKeys((prev) => prev.filter((k) => k.id !== keyId));
      if (inspectedKeyId === keyId) setInspectedKeyId(null);
      alert('API Key revoked successfully.');
    } catch (err) {
      alert('Failed to delete key: ' + err.message);
    }
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
        <div>
          <div className="api-badges-row">
            <span className="api-architecture-badge">
              <Zap size={12} /> Cloudflare Edge Architecture
            </span>
            <span className="api-safemode-badge">
              <Shield size={12} /> Supabase 90/10 Safe Mode
            </span>
          </div>
          <h1 className="api-manager-title">
            Developer & B2B API Manager
          </h1>
          <p className="api-manager-subtitle">
            Manage external reseller website connections (Shopify, WooCommerce, PrestaShop), monitor quota safety, and assign pricing tiers.
          </p>
        </div>

        <div className="api-header-actions">
          <button
            type="button"
            className="api-btn-secondary"
            onClick={fetchOverview}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh Stats
          </button>
          <button
            type="button"
            className="api-btn-primary"
            onClick={() => {
              setNewlyCreatedKeySecret(null);
              setCreateModalOpen(true);
            }}
          >
            <Plus size={16} /> Provision New API Client
          </button>
        </div>
      </div>

      {/* 2. System Quota & Revenue Metric Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="admin-stat-head">
            <span className="admin-stat-label">Monthly API Load (10% Budget)</span>
            <div className="admin-stat-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
              <Code2 size={18} />
            </div>
          </div>
          <div className="admin-stat-value">
            {systemOverview?.totalRequestsThisMonth.toLocaleString() || 0}{' '}
            <span>/ {systemOverview?.safetyLimit.toLocaleString()} req</span>
          </div>
          <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', margin: '8px 0 6px 0' }}>
            <div
              style={{
                height: '100%',
                background: (systemOverview?.safetyUsagePercent || 0) > 75 ? '#ef4444' : '#10b981',
                width: `${Math.min(100, systemOverview?.safetyUsagePercent || 0)}%`,
                borderRadius: '4px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div className="admin-stat-subtext">
            <strong>{systemOverview?.safetyUsagePercent || 0}%</strong> of 10% safety budget used • 90% reserved for main site
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="admin-stat-head">
            <span className="admin-stat-label">Active API Partners</span>
            <div className="admin-stat-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-value">
            {systemOverview?.activeKeysCount || 0}{' '}
            <span>/ {systemOverview?.totalKeysCount || 0} total</span>
          </div>
          <div className="admin-stat-subtext" style={{ color: '#15803d', fontWeight: 600, marginTop: '12px' }}>
            🎉 {systemOverview?.paidTiersCount || 0} Paid Clients (Growth / Pro)
          </div>
        </div>

        <div className="admin-stat-card" style={{ borderLeft: '4px solid #db2777' }}>
          <div className="admin-stat-head">
            <span className="admin-stat-label">Estimated API SaaS Revenue</span>
            <div className="admin-stat-icon-wrap" style={{ background: '#fdf2f8', color: '#db2777' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-stat-value" style={{ color: '#db2777' }}>
            ₹{(systemOverview?.monthlyRevenueEst || 0).toLocaleString()}
            <span style={{ fontSize: '0.8125rem', color: '#64748b' }}> / mo</span>
          </div>
          <div className="admin-stat-subtext" style={{ marginTop: '12px' }}>
            {(systemOverview?.paidTiersCount || 0) >= 3 ? '🎉 100% Covers Supabase Pro plan' : '3 paid clients = ₹2,097 (covers Supabase Pro)'}
          </div>
        </div>
      </div>

      {/* 3. "Inspect User Dashboard" Inspector Mode */}
      {inspectedRecord ? (
        <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button
              type="button"
              className="api-btn-secondary"
              onClick={() => setInspectedKeyId(null)}
            >
              <ArrowLeft size={14} /> Back to All Clients Table
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Switch Client:</span>
              <select
                value={inspectedKeyId}
                onChange={(e) => setInspectedKeyId(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8125rem', background: 'white' }}
              >
                {allKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.client_name} ({k.profiles?.email || 'No email'}) - {k.tier.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DeveloperDashboard
            apiKeyRecord={inspectedRecord}
            isAdminMode={true}
            onAdminUpdate={() => void fetchOverview()}
          />
        </div>
      ) : null}

      {/* 4. Filter & Search Bar */}
      <div className="api-filter-bar">
        <div className="api-search-box">
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            className="api-search-input"
            placeholder="Search by business name, website, or email..."
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
              <th>Client / Portal</th>
              <th>User Account</th>
              <th>Tier & Pricing</th>
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
                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9375rem' }}>{item.client_name}</strong>
                    {item.client_website ? (
                      <a
                        href={item.client_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#2563eb', fontSize: '0.75rem', textDecoration: 'none', marginTop: '2px' }}
                      >
                        <Globe size={11} /> {item.client_website} <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No website specified</span>
                    )}
                  </td>

                  <td>
                    <span style={{ display: 'block', color: '#334155', fontWeight: 500 }}>{item.profiles?.email || 'N/A'}</span>
                    <small style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.profiles?.full_name || item.profiles?.business_name || ''}</small>
                  </td>

                  <td>
                    <span className={`api-tier-tag ${item.tier}`}>
                      {tierInfo.name}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>{tierInfo.priceLabel}</div>
                  </td>

                  <td style={{ minWidth: '150px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <strong>{item.monthTotal.toLocaleString()}</strong>
                      <span style={{ color: '#64748b' }}>/ {item.monthly_quota.toLocaleString()}</span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          background: item.quotaPercent > 85 ? '#ef4444' : item.quotaPercent > 60 ? '#f59e0b' : '#10b981',
                          width: `${Math.min(100, item.quotaPercent)}%`,
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', background: '#f8fafc', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      {item.rate_limit_rps || 1} req/s
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: item.is_active ? '#dcfce7' : '#fee2e2',
                        color: item.is_active ? '#15803d' : '#b91c1c',
                      }}
                    >
                      <Power size={12} /> {item.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Contact Reseller on WhatsApp"
                          style={{
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: '#dcfce7',
                            color: '#15803d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                          }}
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setInspectedKeyId(item.id)}
                        title="Inspect Live User Dashboard"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Eye size={13} /> Inspect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(item.id, item.client_name)}
                        title="Revoke API Key"
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fff1f2',
                          color: '#e11d48',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredKeys.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
                  <KeyRound size={32} style={{ color: '#cbd5e1', margin: '0 auto 8px auto', display: 'block' }} />
                  <strong style={{ display: 'block', color: '#334155', marginBottom: '4px' }}>No API Clients Found</strong>
                  <span style={{ fontSize: '0.8125rem' }}>No client matches your current filter criteria or no API keys have been generated yet.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 6. Provision New API Client Modal */}
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
                  Client Website URL:
                  <input
                    type="url"
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
    </div>
  );
}
