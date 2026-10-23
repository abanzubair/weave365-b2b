/**
 * @file CouponsManager.jsx
 * @description Master Coordinator & Private Coupon Management Panel for Weave365 Admin.
 * 
 * Allows administrators to:
 * - Generate private, unique coupon codes
 * - Set strict global usage limits (e.g. max 2 uses before becoming exhausted)
 * - Set anti-abuse per-buyer limits (e.g. 1 use per customer phone/email)
 * - Define percentage or fixed discounts with optional minimum order and max caps
 * - Track real-time redemptions, remaining limits, and customer savings
 * - Copy codes or one-click share formatted invitations on WhatsApp
 * - All codes remain completely private and hidden from public storefronts
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Users,
  ShoppingBag,
  X,
  ExternalLink,
  ShieldCheck,
  Percent,
  MessageSquareText,
} from '../../components/icons.jsx';
import { supabase } from '../../supabaseClient.js';
import '../../styles/couponsAdmin.css';

const INITIAL_FORM = {
  code: '',
  discount_type: 'percentage',
  discount_value: '10',
  usage_limit: '2',
  per_user_limit: '1',
  min_order_amount: '0',
  max_discount_amount: '',
  expires_at: '',
  description: '',
  is_active: true,
};

export default function CouponsManager({ adminData, user }) {
  const [coupons, setCoupons] = useState([]);
  const [usages, setUsages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [viewingUsagesCoupon, setViewingUsagesCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Quick edit limit modal
  const [quickLimitCoupon, setQuickLimitCoupon] = useState(null);
  const [quickLimitValue, setQuickLimitValue] = useState(1);

  // Fetch Coupons from backend
  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/coupons', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load coupons.');
      }

      setCoupons(data.coupons || []);
      setUsages(data.usages || []);
    } catch (err) {
      console.error('[CouponsManager] Error loading coupons:', err);
      setErrorMessage(err.message || 'Failed to load coupons from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  // Generate a random clean coupon code
  const generateRandomCode = (prefix = 'WEAVE') => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `${prefix}-${rand}`;
    setFormData((prev) => ({ ...prev, code: generated }));
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData(INITIAL_FORM);
    generateRandomCode('WEAVE');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type || 'percentage',
      discount_value: String(coupon.discount_value || '10'),
      usage_limit: String(coupon.usage_limit || '2'),
      per_user_limit: String(coupon.per_user_limit || '1'),
      min_order_amount: coupon.min_order_amount ? String(coupon.min_order_amount) : '0',
      max_discount_amount: coupon.max_discount_amount ? String(coupon.max_discount_amount) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : '',
      description: coupon.description || '',
      is_active: coupon.is_active !== false,
    });
    setIsModalOpen(true);
  };

  // Save Coupon (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const action = editingCoupon ? 'update' : 'create';
      const payload = {
        action,
        ...(editingCoupon && { id: editingCoupon.id }),
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        usage_limit: parseInt(formData.usage_limit, 10) || 1,
        per_user_limit: parseInt(formData.per_user_limit, 10) || 1,
        min_order_amount: Number(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        description: formData.description.trim(),
        is_active: formData.is_active,
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to save coupon.');
      }

      setIsModalOpen(false);
      await loadCoupons();
    } catch (err) {
      console.error('[CouponsManager] Save error:', err);
      alert(err.message || 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (coupon) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update',
          id: coupon.id,
          is_active: !coupon.is_active,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update status.');

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // Quick Limit Adjustment
  const handleSaveQuickLimit = async () => {
    if (!quickLimitCoupon) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update',
          id: quickLimitCoupon.id,
          usage_limit: quickLimitValue,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update usage limit.');

      setCoupons((prev) =>
        prev.map((c) => (c.id === quickLimitCoupon.id ? { ...c, usage_limit: quickLimitValue } : c))
      );
      setQuickLimitCoupon(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${coupon.code}"?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete coupon.');

      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
    } catch (err) {
      alert(err.message);
    }
  };

  // 1-Click Copy Code to Clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((curr) => (curr === code ? null : curr));
    }, 2000);
  };

  // 1-Click Share on WhatsApp
  const handleShareWhatsApp = (coupon) => {
    const remaining = Math.max(0, (coupon.usage_limit || 1) - (coupon.times_used || 0));
    const discountText = coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% OFF${coupon.max_discount_amount ? ` (Up to ₹${coupon.max_discount_amount})` : ''}`
      : `₹${coupon.discount_value} Flat OFF`;

    const message = `Hello! Here is your exclusive private discount coupon code for *Weave 365*:

🎟️ Code: *${coupon.code}*
✨ Discount: *${discountText}*
${coupon.min_order_amount > 0 ? `📦 Min Order: ₹${Number(coupon.min_order_amount).toLocaleString('en-IN')}\n` : ''}⏳ Limit: Valid for ${remaining} ${remaining === 1 ? 'order' : 'orders'} only

Apply this code directly at checkout on https://www.weave365.com/checkout. Happy sourcing!`;

    navigator.clipboard.writeText(message);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date()) && c.times_used < c.usage_limit).length;
    const redemptions = coupons.reduce((sum, c) => sum + (Number(c.times_used) || 0), 0);
    const totalSavings = usages.reduce((sum, u) => sum + (Number(u.discount_amount) || 0), 0);
    return { total, active, redemptions, totalSavings };
  }, [coupons, usages]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return coupons.filter((c) => {
      const matchesSearch = !query ||
        c.code.toLowerCase().includes(query) ||
        (c.description && c.description.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      const isExhausted = (c.times_used || 0) >= (c.usage_limit || 1);
      const isExpired = c.expires_at && new Date(c.expires_at) < new Date();

      if (statusFilter === 'active') {
        return c.is_active && !isExhausted && !isExpired;
      }
      if (statusFilter === 'exhausted') {
        return isExhausted;
      }
      if (statusFilter === 'expired') {
        return isExpired;
      }
      if (statusFilter === 'disabled') {
        return !c.is_active;
      }

      return true;
    });
  }, [coupons, searchTerm, statusFilter]);

  return (
    <div className="coupons-manager-container">
      {/* Header */}
      <div className="coupons-header">
        <div className="coupons-header-title-wrap">
          <h1 className="coupons-title">
            <Tag size={24} style={{ color: '#0f172a' }} /> Private Coupon Codes
          </h1>
          <p className="coupons-subtitle">
            Generate private discount codes with strict usage limits for manual distribution. Codes remain invisible to the public.
          </p>
        </div>
        <div className="coupons-header-actions">
          <button
            type="button"
            className="coupon-btn-secondary"
            onClick={loadCoupons}
            disabled={isLoading}
            title="Refresh coupons"
          >
            <RefreshCw size={15} className={isLoading ? 'admin-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            className="coupon-btn-primary"
            onClick={handleOpenCreateModal}
          >
            <Plus size={16} /> Generate Coupon
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="coupons-metrics-grid">
        <div className="coupon-metric-card">
          <div className="coupon-metric-icon blue">
            <Tag size={22} />
          </div>
          <div className="coupon-metric-info">
            <span className="coupon-metric-label">Total Coupons</span>
            <span className="coupon-metric-value">{metrics.total}</span>
          </div>
        </div>

        <div className="coupon-metric-card">
          <div className="coupon-metric-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div className="coupon-metric-info">
            <span className="coupon-metric-label">Active & Available</span>
            <span className="coupon-metric-value">{metrics.active}</span>
          </div>
        </div>

        <div className="coupon-metric-card">
          <div className="coupon-metric-icon amber">
            <ShoppingBag size={22} />
          </div>
          <div className="coupon-metric-info">
            <span className="coupon-metric-label">Total Redemptions</span>
            <span className="coupon-metric-value">{metrics.redemptions}</span>
          </div>
        </div>

        <div className="coupon-metric-card">
          <div className="coupon-metric-icon purple">
            <Percent size={22} />
          </div>
          <div className="coupon-metric-info">
            <span className="coupon-metric-label">Total Savings Granted</span>
            <span className="coupon-metric-value">₹{Math.round(metrics.totalSavings).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="coupons-toolbar">
        <div className="coupons-search-box">
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            className="coupons-search-input"
            placeholder="Search by code or private note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="coupons-filter-group">
          <select
            className="coupons-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Coupons ({coupons.length})</option>
            <option value="active">Active Only</option>
            <option value="exhausted">Limit Reached / Exhausted</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="coupons-table-card">
        {isLoading && coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="admin-spin" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontWeight: 500 }}>Loading coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="coupons-empty-state">
            <div className="coupons-empty-icon">
              <Tag size={28} />
            </div>
            <h3 className="coupons-empty-title">
              {coupons.length === 0 ? 'No coupon codes yet' : 'No matching coupons'}
            </h3>
            <p className="coupons-empty-desc">
              {coupons.length === 0
                ? 'Create private discount codes with limited uses for your VIP buyers. Codes will not be shown on the storefront.'
                : 'Try clearing your search query or changing the status filter.'}
            </p>
            {coupons.length === 0 && (
              <button
                type="button"
                className="coupon-btn-primary"
                onClick={handleOpenCreateModal}
              >
                <Plus size={16} /> Generate First Coupon
              </button>
            )}
          </div>
        ) : (
          <div className="coupons-table-wrap">
            <table className="coupons-table">
              <thead>
                <tr>
                  <th>Coupon Code</th>
                  <th>Discount Value</th>
                  <th>Usage & Limit</th>
                  <th>Rules & Requirements</th>
                  <th>Private Recipient / Note</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((c) => {
                  const timesUsed = Number(c.times_used) || 0;
                  const usageLimit = Number(c.usage_limit) || 1;
                  const percentUsed = Math.min(100, Math.round((timesUsed / usageLimit) * 100));
                  const isExhausted = timesUsed >= usageLimit;
                  const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                  const remaining = Math.max(0, usageLimit - timesUsed);

                  let statusTagClass = 'active';
                  let statusLabel = 'Active';

                  if (!c.is_active) {
                    statusTagClass = 'disabled';
                    statusLabel = 'Disabled';
                  } else if (isExhausted) {
                    statusTagClass = 'exhausted';
                    statusLabel = 'Exhausted';
                  } else if (isExpired) {
                    statusTagClass = 'expired';
                    statusLabel = 'Expired';
                  }

                  let barClass = 'normal';
                  if (isExhausted) barClass = 'full';
                  else if (percentUsed >= 70) barClass = 'warning';

                  return (
                    <tr key={c.id}>
                      {/* Code Badge */}
                      <td>
                        <div className="coupon-code-badge">
                          <span>{c.code}</span>
                          <button
                            type="button"
                            className="coupon-copy-icon-btn"
                            onClick={() => handleCopyCode(c.code)}
                            title="Copy coupon code"
                          >
                            {copiedCode === c.code ? (
                              <Check size={14} style={{ color: '#16a34a' }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.92rem' }}>
                          {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                        </div>
                        {c.discount_type === 'percentage' && c.max_discount_amount > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Max ₹{c.max_discount_amount} cap
                          </div>
                        )}
                      </td>

                      {/* Usage Progress Bar */}
                      <td>
                        <div className="coupon-usage-bar-wrap">
                          <div className="coupon-usage-text">
                            <span style={{ color: isExhausted ? '#d97706' : '#1e293b' }}>
                              {timesUsed} / {usageLimit} used
                            </span>
                            <span style={{ color: '#64748b' }}>{remaining} left</span>
                          </div>
                          <div className="coupon-usage-bar-track">
                            <div
                              className={`coupon-usage-bar-fill ${barClass}`}
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            Max {c.per_user_limit || 1} use/customer
                          </div>
                        </div>
                      </td>

                      {/* Rules */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.78rem' }}>
                          {c.min_order_amount > 0 ? (
                            <span style={{ color: '#334155' }}>
                              Min Order: <strong>₹{Number(c.min_order_amount).toLocaleString('en-IN')}</strong>
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>No minimum order</span>
                          )}

                          {c.expires_at ? (
                            <span style={{ color: isExpired ? '#dc2626' : '#64748b' }}>
                              Exp: {new Date(c.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>No expiration</span>
                          )}
                        </div>
                      </td>

                      {/* Notes / Recipient */}
                      <td>
                        <div style={{ maxWidth: '220px', fontSize: '0.82rem', color: '#475569' }}>
                          {c.description ? (
                            <span>{c.description}</span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Private distribution</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`coupon-status-tag ${statusTagClass}`}>
                          {statusLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="coupon-actions-cell" style={{ justifyContent: 'flex-end' }}>
                          {/* Share on WhatsApp */}
                          <button
                            type="button"
                            className="coupon-icon-btn whatsapp"
                            onClick={() => handleShareWhatsApp(c)}
                            title="Share coupon invitation on WhatsApp"
                          >
                            <MessageSquareText size={15} />
                          </button>

                          {/* Quick Adjust Limit */}
                          <button
                            type="button"
                            className="coupon-icon-btn"
                            onClick={() => {
                              setQuickLimitCoupon(c);
                              setQuickLimitValue(c.usage_limit || 2);
                            }}
                            title="Adjust usage limit"
                          >
                            <ShieldCheck size={15} />
                          </button>

                          {/* Toggle Active */}
                          <button
                            type="button"
                            className="coupon-icon-btn"
                            onClick={() => handleToggleActive(c)}
                            title={c.is_active ? 'Disable Coupon' : 'Enable Coupon'}
                            style={{ color: c.is_active ? '#16a34a' : '#94a3b8' }}
                          >
                            <CheckCircle2 size={15} />
                          </button>

                          {/* Edit Full */}
                          <button
                            type="button"
                            className="coupon-icon-btn"
                            onClick={() => handleOpenEditModal(c)}
                            title="Edit details"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Usages history */}
                          {timesUsed > 0 && (
                            <button
                              type="button"
                              className="coupon-icon-btn"
                              onClick={() => setViewingUsagesCoupon(c)}
                              title="View redemption history"
                            >
                              <Users size={15} />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            className="coupon-icon-btn danger"
                            onClick={() => handleDeleteCoupon(c)}
                            title="Delete coupon"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="coupon-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="coupon-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h2 className="coupon-modal-title">
                <Tag size={20} /> {editingCoupon ? 'Edit Coupon Settings' : 'Generate New Coupon Code'}
              </h2>
              <button
                type="button"
                className="coupon-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="coupon-modal-body">
                {/* Coupon Code & Generate Button */}
                <div className="coupon-form-group">
                  <label className="coupon-form-label">
                    <span>Coupon Code *</span>
                    <span className="coupon-form-hint">Uppercase alphanumeric</span>
                  </label>
                  <div className="coupon-input-with-button">
                    <input
                      type="text"
                      className="coupon-form-input"
                      style={{ fontFamily: 'monospace', fontWeight: '700', letterSpacing: '0.05em' }}
                      placeholder="e.g. WEAVE-20OFF"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                    <button
                      type="button"
                      className="coupon-btn-secondary"
                      onClick={() => generateRandomCode('WEAVE')}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      🎲 Generate
                    </button>
                  </div>
                </div>

                {/* Discount Type Toggle */}
                <div className="coupon-form-group">
                  <label className="coupon-form-label">Discount Type</label>
                  <div className="coupon-type-toggle">
                    <button
                      type="button"
                      className={`coupon-type-toggle-btn ${formData.discount_type === 'percentage' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                    >
                      <Percent size={15} /> Percentage (% Off)
                    </button>
                    <button
                      type="button"
                      className={`coupon-type-toggle-btn ${formData.discount_type === 'fixed' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                    >
                      <span>₹</span> Fixed Amount (Flat Off)
                    </button>
                  </div>
                </div>

                {/* Discount Value & Max Cap */}
                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">
                      <span>Discount Value *</span>
                      <span className="coupon-form-hint">{formData.discount_type === 'percentage' ? '%' : '₹'}</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={formData.discount_type === 'percentage' ? '100' : '100000'}
                      className="coupon-form-input"
                      placeholder={formData.discount_type === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      required
                    />
                  </div>

                  {formData.discount_type === 'percentage' ? (
                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        <span>Max Discount Cap (₹)</span>
                        <span className="coupon-form-hint">Optional</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="coupon-form-input"
                        placeholder="e.g. 1000 (No limit if blank)"
                        value={formData.max_discount_amount}
                        onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        <span>Min Order Amount (₹)</span>
                        <span className="coupon-form-hint">Optional</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="coupon-form-input"
                        placeholder="e.g. 2000"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Usage Limit & Per-User Limit */}
                <div className="coupon-form-row">
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">
                      <span>Total Usage Limit *</span>
                      <span className="coupon-form-hint">Exhaustion limit</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="coupon-form-input"
                      placeholder="e.g. 2 times"
                      value={formData.usage_limit}
                      onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      After this many total orders across all buyers, the code automatically stops working.
                    </span>
                  </div>

                  <div className="coupon-form-group">
                    <label className="coupon-form-label">
                      <span>Per-Customer Limit *</span>
                      <span className="coupon-form-hint">Anti-abuse</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="coupon-form-input"
                      placeholder="e.g. 1"
                      value={formData.per_user_limit}
                      onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Max times a single customer phone/email can redeem this code.
                    </span>
                  </div>
                </div>

                {/* Min Order & Expiration Date (for percentage mode) */}
                {formData.discount_type === 'percentage' && (
                  <div className="coupon-form-row">
                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        <span>Min Order Amount (₹)</span>
                        <span className="coupon-form-hint">Optional</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="coupon-form-input"
                        placeholder="e.g. 2000"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      />
                    </div>

                    <div className="coupon-form-group">
                      <label className="coupon-form-label">
                        <span>Expiry Date</span>
                        <span className="coupon-form-hint">Optional</span>
                      </label>
                      <input
                        type="date"
                        className="coupon-form-input"
                        value={formData.expires_at}
                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Expiration Date (for fixed mode) */}
                {formData.discount_type === 'fixed' && (
                  <div className="coupon-form-group">
                    <label className="coupon-form-label">
                      <span>Expiry Date</span>
                      <span className="coupon-form-hint">Optional</span>
                    </label>
                    <input
                      type="date"
                      className="coupon-form-input"
                      value={formData.expires_at}
                      onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    />
                  </div>
                )}

                {/* Private Notes */}
                <div className="coupon-form-group">
                  <label className="coupon-form-label">
                    <span>Private Admin Note / Recipient</span>
                    <span className="coupon-form-hint">Internal only</span>
                  </label>
                  <input
                    type="text"
                    className="coupon-form-input"
                    placeholder="e.g. Given to Priya Sharma (Varanasi Boutique) via WhatsApp"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Active Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    id="coupon-active-check"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="coupon-active-check" style={{ fontSize: '0.86rem', fontWeight: '500', cursor: 'pointer' }}>
                    Activate coupon immediately
                  </label>
                </div>
              </div>

              <div className="coupon-modal-footer">
                <button
                  type="button"
                  className="coupon-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coupon-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Adjust Limit Modal */}
      {quickLimitCoupon && (
        <div className="coupon-modal-backdrop" onClick={() => setQuickLimitCoupon(null)}>
          <div className="coupon-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h3 className="coupon-modal-title">
                Adjust Limit: {quickLimitCoupon.code}
              </h3>
              <button
                type="button"
                className="coupon-modal-close"
                onClick={() => setQuickLimitCoupon(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="coupon-modal-body">
              <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
                Current redemptions: <strong>{quickLimitCoupon.times_used || 0}</strong> uses.
                Set a new total limit to allow more orders:
              </p>
              <div className="coupon-form-group">
                <label className="coupon-form-label">New Total Usage Limit</label>
                <input
                  type="number"
                  min={quickLimitCoupon.times_used || 1}
                  className="coupon-form-input"
                  value={quickLimitValue}
                  onChange={(e) => setQuickLimitValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  autoFocus
                />
              </div>
            </div>
            <div className="coupon-modal-footer">
              <button
                type="button"
                className="coupon-btn-secondary"
                onClick={() => setQuickLimitCoupon(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="coupon-btn-primary"
                onClick={handleSaveQuickLimit}
              >
                Save Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Usages Modal */}
      {viewingUsagesCoupon && (
        <div className="coupon-modal-backdrop" onClick={() => setViewingUsagesCoupon(null)}>
          <div className="coupon-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h3 className="coupon-modal-title">
                Redemption History: {viewingUsagesCoupon.code}
              </h3>
              <button
                type="button"
                className="coupon-modal-close"
                onClick={() => setViewingUsagesCoupon(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="coupon-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {(() => {
                const couponRedemptions = usages.filter((u) => u.coupon_id === viewingUsagesCoupon.id);
                if (couponRedemptions.length === 0) {
                  return (
                    <p style={{ color: '#64748b', textAlign: 'center', margin: '20px 0' }}>
                      No redemptions recorded yet.
                    </p>
                  );
                }
                return (
                  <table className="coupons-table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Buyer Contact</th>
                        <th>Discount Given</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {couponRedemptions.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>#{r.order_number || (r.order_id ? r.order_id.slice(0, 8).toUpperCase() : 'ORD')}</strong>
                          </td>
                          <td>
                            {r.buyer_phone || r.buyer_email || 'Direct Buyer'}
                          </td>
                          <td style={{ color: '#16a34a', fontWeight: '600' }}>
                            -₹{Number(r.discount_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ color: '#64748b' }}>
                            {r.used_at ? new Date(r.used_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <div className="coupon-modal-footer">
              <button
                type="button"
                className="coupon-btn-secondary"
                onClick={() => setViewingUsagesCoupon(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
