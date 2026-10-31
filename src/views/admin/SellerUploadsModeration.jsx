/**
 * @file SellerUploadsModeration.jsx
 * @description Admin Moderation Dashboard for Seller Product Uploads.
 * Enables Weave365 administrators to inspect multi-color single-design uploads,
 * verify Cloudflare R2 bucket images, review attributes and Suit components,
 * and approve products to immediately publish them to the live storefront catalog.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Filter,
  Check,
  X,
  Eye,
  Tag,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
} from '../../components/icons.jsx';
import AdminLoadingScreen from './AdminLoadingScreen.jsx';

export function SellerUploadsModeration() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('submitted'); // default to pending submissions
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selected product for detailed modal inspection
  const [inspectItem, setInspectItem] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Active color preview in inspector modal
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Fetch all seller uploads
  const loadSellerProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/seller/products?status=all');
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load seller products for moderation:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSellerProducts();
  }, [loadSellerProducts]);

  // Compute status metrics
  const metrics = useMemo(() => {
    const total = products.length;
    const submitted = products.filter((p) => p.status === 'submitted' || !p.status).length;
    const approved = products.filter((p) => p.status === 'approved').length;
    const rejected = products.filter((p) => p.status === 'rejected').length;
    return { total, submitted, approved, rejected };
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Status filter
      if (statusFilter !== 'all') {
        const itemStatus = p.status || 'submitted';
        if (itemStatus !== statusFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        if (String(p.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const skuMatch = String(p.sku || '').toLowerCase().includes(q);
        const sellerMatch = String(p.seller_code || '').toLowerCase().includes(q) || String(p.seller_name || '').toLowerCase().includes(q);
        const fabricMatch = String(p.fabric || '').toLowerCase().includes(q);
        const titleMatch = String(p.title || '').toLowerCase().includes(q);
        if (!skuMatch && !sellerMatch && !fabricMatch && !titleMatch) return false;
      }

      return true;
    });
  }, [products, statusFilter, categoryFilter, searchQuery]);

  // Approve product action
  const handleApprove = async (item) => {
    if (!item?.id || actionLoadingId) return;
    setActionLoadingId(item.id);
    setActionMessage('');

    try {
      const res = await fetch('/api/admin/seller-products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'approved',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to approve');

      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: 'approved' } : p))
      );
      if (inspectItem?.id === item.id) {
        setInspectItem((prev) => ({ ...prev, status: 'approved' }));
      }
      setActionMessage(`Product ${item.sku} approved and published to live website.`);
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject product action
  const handleReject = async (item) => {
    if (!item?.id || actionLoadingId) return;
    setActionLoadingId(item.id);
    setActionMessage('');

    try {
      const res = await fetch('/api/admin/seller-products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: 'rejected',
          admin_notes: rejectNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to reject');

      setProducts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: 'rejected', admin_notes: rejectNote.trim() } : p))
      );
      if (inspectItem?.id === item.id) {
        setInspectItem((prev) => ({ ...prev, status: 'rejected', admin_notes: rejectNote.trim() }));
      }
      setShowRejectInput(false);
      setRejectNote('');
      setActionMessage(`Product ${item.sku} marked as rejected.`);
    } catch (err) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open inspector modal
  const openInspector = (item) => {
    setInspectItem(item);
    setActivePreviewIndex(0);
    setShowRejectInput(false);
    setRejectNote(item.admin_notes || '');
    setActionMessage('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1c1917' }}>
            Seller Product Uploads & Moderation
          </h2>
          <p style={{ fontSize: 13, color: '#78716c', margin: '4px 0 0 0' }}>
            Review single-design products uploaded by loom partners. Only approved products are visible on the website.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadSellerProducts(true)}
          disabled={refreshing}
          className="admin-btn-refresh-partners"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, background: '#f5f5f4', border: '1px solid #d6d3d1', cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Uploads'}</span>
        </button>
      </div>

      {/* 2. Metrics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div
          onClick={() => setStatusFilter('submitted')}
          style={{
            background: statusFilter === 'submitted' ? '#fef3c7' : '#ffffff',
            border: `1px solid ${statusFilter === 'submitted' ? '#f59e0b' : '#e7e5e4'}`,
            borderRadius: 12,
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pending Approval
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <strong style={{ fontSize: 24, color: '#92400e' }}>{metrics.submitted}</strong>
            <span style={{ fontSize: 12, color: '#b45309' }}>Needs Review</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          style={{
            background: statusFilter === 'approved' ? '#ecfdf5' : '#ffffff',
            border: `1px solid ${statusFilter === 'approved' ? '#10b981' : '#e7e5e4'}`,
            borderRadius: 12,
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Approved & Live
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <strong style={{ fontSize: 24, color: '#065f46' }}>{metrics.approved}</strong>
            <span style={{ fontSize: 12, color: '#047857' }}>On Storefront</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          style={{
            background: statusFilter === 'rejected' ? '#fef2f2' : '#ffffff',
            border: `1px solid ${statusFilter === 'rejected' ? '#ef4444' : '#e7e5e4'}`,
            borderRadius: 12,
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Rejected
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <strong style={{ fontSize: 24, color: '#991b1b' }}>{metrics.rejected}</strong>
            <span style={{ fontSize: 12, color: '#b91c1c' }}>Changes Requested</span>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('all')}
          style={{
            background: statusFilter === 'all' ? '#f1f5f9' : '#ffffff',
            border: `1px solid ${statusFilter === 'all' ? '#475569' : '#e7e5e4'}`,
            borderRadius: 12,
            padding: '14px 18px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            All Uploads
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <strong style={{ fontSize: 24, color: '#0f172a' }}>{metrics.total}</strong>
            <span style={{ fontSize: 12, color: '#64748b' }}>Total Submissions</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#a8a29e' }} />
          <input
            type="text"
            placeholder="Search by SKU, Seller Code, Fabric, Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, border: '1px solid #d6d3d1', fontSize: 13, outline: 'none' }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #d6d3d1', fontSize: 13, background: '#fff', outline: 'none' }}
        >
          <option value="all">All Categories</option>
          <option value="Saree">Saree (1)</option>
          <option value="Suit">Suit (2)</option>
          <option value="Dupatta">Dupatta (3)</option>
          <option value="Lehenga">Lehenga (4)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #d6d3d1', fontSize: 13, background: '#fff', outline: 'none' }}
        >
          <option value="all">All Statuses ({metrics.total})</option>
          <option value="submitted">Pending Approval ({metrics.submitted})</option>
          <option value="approved">Approved & Live ({metrics.approved})</option>
          <option value="rejected">Rejected ({metrics.rejected})</option>
        </select>
      </div>

      {actionMessage && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '10px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 4. Products Table / List */}
      {loading ? (
        <AdminLoadingScreen
          compact
          title="Loading Seller Product Submissions..."
          subtitle="Fetching submitted products and artisan details for moderation…"
        />
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', background: '#fff', borderRadius: 12, border: '1px solid #e7e5e4', color: '#78716c' }}>
          <Boxes size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No products found</p>
          <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>
            {statusFilter === 'submitted' ? 'No pending seller submissions at this moment.' : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e7e5e4', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px' }}>Photo</th>
                <th style={{ padding: '12px 16px' }}>SKU</th>
                <th style={{ padding: '12px 16px' }}>Seller</th>
                <th style={{ padding: '12px 16px' }}>Category & Details</th>
                <th style={{ padding: '12px 16px' }}>Colors</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const colors = Array.isArray(p.colors) ? p.colors : [];
                const isPending = !p.status || p.status === 'submitted';
                const isApproved = p.status === 'approved';
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }}>
                    <td style={{ padding: '12px 16px', width: 64 }}>
                      <div
                        onClick={() => openInspector(p)}
                        style={{
                          width: 48,
                          height: 60,
                          borderRadius: 6,
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <img
                          src={p.cover_image || colors[0]?.image_url || '/placeholder.png'}
                          alt={p.sku}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ fontFamily: 'monospace', fontSize: 14, color: '#0f172a' }}>{p.sku}</strong>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: '#1e293b', display: 'block' }}>{p.seller_code}</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{p.seller_name || 'Artisan Partner'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{p.category}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          {p.fabric} • {p.work}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          {p.weave} • {p.pattern}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {colors.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 11,
                              color: '#334155',
                            }}
                          >
                            {c.color}
                          </span>
                        ))}
                        {colors.length > 3 && (
                          <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>
                            +{colors.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isApproved ? '#dcfce7' : p.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                          color: isApproved ? '#166534' : p.status === 'rejected' ? '#991b1b' : '#92400e',
                          border: `1px solid ${isApproved ? '#86efac' : p.status === 'rejected' ? '#fca5a5' : '#fde68a'}`,
                        }}
                      >
                        {isApproved ? 'Approved & Live' : p.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => openInspector(p)}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '6px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          Review
                        </button>
                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleApprove(p)}
                            disabled={actionLoadingId === p.id}
                            style={{
                              background: '#059669',
                              border: 'none',
                              borderRadius: 6,
                              padding: '6px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            {actionLoadingId === p.id ? '...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Full Inspection & Review Modal */}
      {inspectItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectItem(null);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 900,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                    Review SKU: {inspectItem.sku}
                  </h3>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: inspectItem.status === 'approved' ? '#dcfce7' : inspectItem.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                      color: inspectItem.status === 'approved' ? '#166534' : inspectItem.status === 'rejected' ? '#991b1b' : '#92400e',
                    }}
                  >
                    {inspectItem.status || 'submitted'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Submitted by {inspectItem.seller_code} ({inspectItem.seller_name || 'Vendor'}) on{' '}
                  {new Date(inspectItem.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: 24 }}>
              {/* Left Column: Image Viewer */}
              <div>
                {/* Main Large Image */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '3 / 4',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                  }}
                >
                  <img
                    src={
                      inspectItem.colors?.[activePreviewIndex]?.image_url ||
                      inspectItem.images?.[activePreviewIndex] ||
                      inspectItem.cover_image ||
                      '/placeholder.png'
                    }
                    alt={inspectItem.sku}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {inspectItem.colors?.[activePreviewIndex]?.color || `Photo ${activePreviewIndex + 1}`}
                  </div>
                </div>

                {/* Thumbnails list */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                  {(inspectItem.colors || []).map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setActivePreviewIndex(i)}
                      style={{
                        width: 52,
                        height: 64,
                        borderRadius: 6,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `2px solid ${activePreviewIndex === i ? '#3b82f6' : '#e2e8f0'}`,
                        flexShrink: 0,
                      }}
                    >
                      <img src={c.image_url || '/placeholder.png'} alt={c.color} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Attribute Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                    {inspectItem.title}
                  </h4>
                  {inspectItem.wholesale_price && (
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#059669' }}>
                      ₹{Number(inspectItem.wholesale_price).toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>per piece (B2B)</span>
                    </div>
                  )}
                </div>

                {/* Attributes Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Category</span>
                    <strong style={{ color: '#0f172a' }}>{inspectItem.category}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Fabric</span>
                    <strong style={{ color: '#0f172a' }}>{inspectItem.fabric}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Work</span>
                    <strong style={{ color: '#0f172a' }}>{inspectItem.work}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Pattern</span>
                    <strong style={{ color: '#0f172a' }}>{inspectItem.pattern}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Weave</span>
                    <strong style={{ color: '#0f172a' }}>{inspectItem.weave}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Purity & Type</span>
                    <strong style={{ color: '#0f172a' }}>{inspectItem.purity} • {inspectItem.type}</strong>
                  </div>
                </div>

                {/* Suit Breakdown if Suit */}
                {String(inspectItem.category).toLowerCase() === 'suit' && (
                  <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: 10, padding: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#86198f', display: 'block', marginBottom: 8 }}>
                      Suit Component Fabrics
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12.5 }}>
                      <div>
                        <span style={{ color: '#701a75', fontSize: 11, display: 'block' }}>Top Fabric:</span>
                        <strong>{inspectItem.fabric_top || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#701a75', fontSize: 11, display: 'block' }}>Bottom Fabric:</span>
                        <strong>{inspectItem.fabric_bottom || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#701a75', fontSize: 11, display: 'block' }}>Dupatta Fabric:</span>
                        <strong>{inspectItem.fabric_dupatta || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Variations Breakdown */}
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                    Color Variations & Variant SKUs
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(inspectItem.colors || []).map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 12px',
                          background: '#f8fafc',
                          borderRadius: 6,
                          fontSize: 12.5,
                        }}
                      >
                        <span>
                          <strong>{c.color}</strong> {c.is_cover && <span style={{ color: '#2563eb', fontSize: 11 }}>(Cover)</span>}
                        </span>
                        <code style={{ color: '#475569', fontWeight: 600 }}>{c.sku || `${inspectItem.sku}-${i + 1}`}</code>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Notes / Rejection input */}
                {showRejectInput && (
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', display: 'block', marginBottom: 4 }}>
                      Rejection Reason / Notes for Seller:
                    </label>
                    <textarea
                      rows={2}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="e.g. Please upload higher resolution pallu photo..."
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #fca5a5', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                borderRadius: '0 0 16px 16px',
              }}
            >
              <div>
                {!showRejectInput ? (
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Reject Design...
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleReject(inspectItem)}
                      disabled={actionLoadingId === inspectItem.id}
                      style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Confirm Rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectInput(false)}
                      style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 6, padding: '8px 12px', fontSize: 13, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setInspectItem(null)}
                  style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                >
                  Close
                </button>
                {inspectItem.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(inspectItem)}
                    disabled={actionLoadingId === inspectItem.id}
                    style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{actionLoadingId === inspectItem.id ? 'Approving...' : 'Approve & Publish Live'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
