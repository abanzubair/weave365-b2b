import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Inbox,
  RefreshCw,
  Search,
  AlertTriangle,
  Phone,
  Mail,
  Building,
  Calendar,
  CheckCircle,
  Trash2,
  ExternalLink,
  Clock,
  Layers,
  ShoppingBag,
  MapPin,
} from '../../components/icons.jsx';
import { supabase } from '../../supabaseClient.js';
import { parseCartVariantCode } from '../../utils/cartHelpers.js';
import { fallbackProductImage, formatMoney } from '../../storefrontShared.jsx';
import { getProductCategorySlug, siteUrl } from '../../config.js';
import { WhatsappIcon } from '../../components/WhatsappIcon.jsx';

const GROUPING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours (1 day)

function getWhatsappUrl(rawPhone) {
  if (!rawPhone) return '#';
  const cleaned = String(rawPhone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `https://wa.me/91${cleaned}`;
  }
  return `https://wa.me/${cleaned}`;
}

function getUserIdentifier(row) {
  const rawPhone = row.phone || row.whatsapp || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length >= 7) {
    return `phone:${cleanPhone}`;
  }
  const cleanEmail = (row.email || '').toLowerCase().trim();
  if (cleanEmail) {
    return `email:${cleanEmail}`;
  }
  const cleanName = (row.buyer_name || row.name || '').toLowerCase().trim();
  if (cleanName) {
    return `name:${cleanName}`;
  }
  return `id:${row.id}`;
}

function extractEnquiryItems(enquiry) {
  if (!enquiry) return [];
  let itemsList = [];
  if (Array.isArray(enquiry.items) && enquiry.items.length > 0) {
    itemsList = enquiry.items;
  } else if (typeof enquiry.items === 'string') {
    try {
      itemsList = JSON.parse(enquiry.items);
    } catch (e) {}
  }
  if (!Array.isArray(itemsList) || itemsList.length === 0) {
    const productKey = enquiry.product_group_key || enquiry.productGroupKey;
    if (productKey || enquiry.variant_code) {
      itemsList = [
        {
          product_group_key: productKey,
          variant_code: enquiry.variant_code,
          color: 'Assorted',
          quantity: 1,
        },
      ];
    }
  }
  return itemsList;
}

function cleanEnquiryMessage(msg) {
  if (!msg) return '';
  const match = msg.match(/^Enquiry for (\d+)\s*items?\s*in cart$/i);
  if (match) {
    const count = parseInt(match[1], 10);
    return `Enquiry for ${count} ${count === 1 ? 'item' : 'items'} in cart`;
  }
  return msg;
}

function getTimeSpanText(earliestTime, latestTime, count) {
  if (count <= 1 || earliestTime === latestTime) return null;
  const diffMs = Math.abs(latestTime - earliestTime);
  const diffMins = Math.round(diffMs / (60 * 1000));
  if (diffMins < 1) return 'Within 1 min';
  if (diffMins < 60) return `Within ${diffMins}m`;
  const diffHours = Math.round(diffMs / (60 * 60 * 1000));
  if (diffHours === 1) return 'Within 1h';
  if (diffHours < 24) return `Within ${diffHours}h`;
  return 'Within 1d';
}

function createSessionMeta(cluster, userId) {
  const latestEnq = cluster[0];
  const earliestEnq = cluster[cluster.length - 1];
  const latestTime = latestEnq.created_at ? new Date(latestEnq.created_at).getTime() : 0;
  const earliestTime = earliestEnq.created_at ? new Date(earliestEnq.created_at).getTime() : 0;

  const buyerName = cluster.find((e) => e.buyer_name || e.name)?.buyer_name || latestEnq.name || 'Direct Buyer';
  const businessName = cluster.find((e) => e.business_name || e.company)?.business_name || latestEnq.company || 'Individual / Direct';
  const phone = cluster.find((e) => e.phone || e.whatsapp)?.phone || latestEnq.whatsapp || '';
  const email = cluster.find((e) => e.email)?.email || '';
  const pincode = cluster.find((e) => e.pincode)?.pincode || '';

  let totalItemsCount = 0;
  cluster.forEach((e) => {
    const items = extractEnquiryItems(e);
    totalItemsCount += items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
  });

  const hasNew = cluster.some((e) => (e.status || 'new').toLowerCase() === 'new');
  const hasContacted = cluster.some((e) => (e.status || '').toLowerCase() === 'contacted');
  const overallStatus = hasNew ? 'new' : hasContacted ? 'contacted' : 'completed';

  return {
    id: `session_${userId}_${latestTime}`,
    userKey: userId,
    buyerName,
    businessName,
    phone,
    email,
    pincode,
    enquiries: cluster,
    totalItemsCount,
    latestTime,
    earliestTime,
    latestDateStr: latestEnq.created_at
      ? new Date(latestEnq.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Unknown Date',
    timeSpanText: getTimeSpanText(earliestTime, latestTime, cluster.length),
    overallStatus,
    isGrouped: cluster.length > 1,
  };
}

function generateWhatsAppGroupMsg(enquiries, products) {
  const primaryEnq = enquiries[0] || {};
  const buyerName = primaryEnq.buyer_name || primaryEnq.name || 'Customer';

  const consolidatedItems = [];
  enquiries.forEach((enq) => {
    const items = extractEnquiryItems(enq);
    items.forEach((item) => {
      consolidatedItems.push({
        ...item,
        product_group_key: item.product_group_key || item.productGroupKey || enq.product_group_key || enq.productGroupKey,
        variant_code: item.variant_code || item.variantCode || enq.variant_code,
      });
    });
  });

  let itemsText = '';
  let totalAmt = 0;
  let hasPrice = false;

  consolidatedItems.forEach((row, idx) => {
    const productKey = row.product_group_key;
    const searchCode = row.variant_code;
    let matchedProduct = products.find((p) => p.id === productKey || p.groupKey === productKey);
    let resolvedKey = productKey;
    if (!matchedProduct && searchCode) {
      matchedProduct = products.find(
        (p) =>
          (p.variants || []).some((v) => v.code === searchCode) ||
          p.id === searchCode ||
          p.groupKey === searchCode
      );
      if (matchedProduct) {
        resolvedKey = matchedProduct.id || matchedProduct.groupKey;
      }
    }

    const { baseVariantCode, colorName } = parseCartVariantCode(searchCode || '');
    const variant = matchedProduct?.variants?.find((v) => v.code === baseVariantCode);
    const colorOptions = matchedProduct?.colorOptions || [];
    const selectedColorName = colorName || row.color || variant?.color || colorOptions[0]?.name || '';

    const itemTitle = matchedProduct?.title || `Product Design Code: ${resolvedKey || 'N/A'}`;
    const displayCode = searchCode || baseVariantCode || resolvedKey || 'N/A';
    const qty = Number(row.quantity) || 1;

    let unitPrice = 0;
    if (row.price !== undefined && row.price !== null) {
      unitPrice = Number(row.price);
      hasPrice = true;
    }

    const lineTotal = unitPrice * qty;
    totalAmt += lineTotal;

    itemsText += `${idx + 1}. ${itemTitle}\n   Code: ${displayCode} | Color: ${selectedColorName} | Qty: ${qty}`;
    if (unitPrice > 0) {
      itemsText += ` | Price: ₹${unitPrice.toLocaleString('en-IN')}`;
    }
    if (matchedProduct) {
      const categorySlug = getProductCategorySlug(
        matchedProduct.id || matchedProduct.groupKey,
        matchedProduct.category
      );
      const productUrl = `${siteUrl}/${categorySlug}/${encodeURIComponent(
        matchedProduct.id || matchedProduct.groupKey
      )}`;
      itemsText += `\n   Link: ${productUrl}`;
    }
    itemsText += '\n\n';
  });

  const isMultiple = enquiries.length > 1;
  let msg = `Dear ${buyerName},\nThank you for your ${isMultiple ? 'enquiries' : 'enquiry'}.\n\nWe are pleased to confirm that the requested items are available:\n\n${itemsText}`;

  if (hasPrice && totalAmt > 0) {
    msg += `Total Estimated Amount: ₹${totalAmt.toLocaleString('en-IN')}\n\n`;
  }

  msg += `Kindly confirm your order so our wholesale team can dispatch for you.\n\nThank you,\nTeam Weave 365`;
  return msg;
}

export default function EnquiresManager({
  adminData,
  loadAdminData,
  products = [],
  loading = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'individual'
  const [actionLoading, setActionLoading] = useState(null);
  const [localMessage, setLocalMessage] = useState(null);
  const [selectedItemModalData, setSelectedItemModalData] = useState(null);

  // Retrieve valid inquiries from adminData.optional (excluding system orders)
  const inquiresData = useMemo(() => {
    return (adminData.optional?.inquiries || []).filter(
      (r) =>
        r.inquiry_type !== 'reseller_api_order' &&
        r.inquiry_type !== 'cart_payment' &&
        r.inquiry_type !== 'cart_payment_fallback'
    );
  }, [adminData]);

  // Clean / search matching logic
  const query = searchQuery.toLowerCase().trim();
  const filtered = useMemo(() => {
    const list = inquiresData.filter((row) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (row.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesSearch =
        !query ||
        (row.buyer_name || row.name || '').toLowerCase().includes(query) ||
        (row.business_name || row.company || '').toLowerCase().includes(query) ||
        (row.email || '').toLowerCase().includes(query) ||
        (row.phone || row.whatsapp || '').includes(query) ||
        (row.message || row.notes || '').toLowerCase().includes(query) ||
        (row.pincode || '').includes(query);
      return matchesStatus && matchesSearch;
    });

    return list.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [inquiresData, statusFilter, query]);

  // Group filtered inquiries by user and 24-hour time window (1 day)
  const groupedSessions = useMemo(() => {
    if (filtered.length === 0) return [];

    const userBuckets = new Map();
    filtered.forEach((enq) => {
      const userId = getUserIdentifier(enq);
      if (!userBuckets.has(userId)) {
        userBuckets.set(userId, []);
      }
      userBuckets.get(userId).push(enq);
    });

    const sessions = [];

    userBuckets.forEach((userEnquiries, userId) => {
      userEnquiries.sort((a, b) => {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tB - tA; // newest first
      });

      let currentCluster = null;

      userEnquiries.forEach((enq) => {
        const enqTime = enq.created_at ? new Date(enq.created_at).getTime() : 0;

        if (!currentCluster) {
          currentCluster = [enq];
        } else {
          const lastEnq = currentCluster[currentCluster.length - 1];
          const lastTime = lastEnq.created_at ? new Date(lastEnq.created_at).getTime() : 0;

          if (Math.abs(lastTime - enqTime) <= GROUPING_WINDOW_MS) {
            currentCluster.push(enq);
          } else {
            sessions.push(createSessionMeta(currentCluster, userId));
            currentCluster = [enq];
          }
        }
      });

      if (currentCluster && currentCluster.length > 0) {
        sessions.push(createSessionMeta(currentCluster, userId));
      }
    });

    return sessions.sort((a, b) => b.latestTime - a.latestTime);
  }, [filtered]);

  // Status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts = { all: inquiresData.length, new: 0, contacted: 0, completed: 0 };
    inquiresData.forEach((row) => {
      const st = (row.status || 'new').toLowerCase();
      if (counts[st] !== undefined) {
        counts[st]++;
      }
    });
    return counts;
  }, [inquiresData]);

  // Status update for single ID or array of IDs
  async function updateStatus(idOrIds, newStatus) {
    const isArray = Array.isArray(idOrIds);
    const ids = isArray ? idOrIds : [idOrIds];
    const loadingKey = ids.join(',');

    setActionLoading(loadingKey);
    setLocalMessage(null);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;
      setLocalMessage({
        type: 'success',
        text: ids.length > 1
          ? `Updated status of ${ids.length} enquiries to "${newStatus}"`
          : `Enquiry status updated to "${newStatus}"`,
      });
      await loadAdminData();
    } catch (err) {
      console.error('[EnquiresManager] Update status error:', err);
      setLocalMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(null);
    }
  }

  // Delete single enquiry or session
  async function handleDelete(idOrIds) {
    const isArray = Array.isArray(idOrIds);
    const ids = isArray ? idOrIds : [idOrIds];
    const confirmPrompt =
      ids.length > 1
        ? `Are you sure you want to delete all ${ids.length} enquiries in this session? This cannot be undone.`
        : 'Are you sure you want to delete this enquiry? This action cannot be undone.';

    if (!window.confirm(confirmPrompt)) {
      return;
    }

    const loadingKey = ids.join(',');
    setActionLoading(loadingKey);
    setLocalMessage(null);
    try {
      const { error } = await supabase.from('inquiries').delete().in('id', ids);

      if (error) throw error;
      setLocalMessage({
        type: 'success',
        text: ids.length > 1 ? `${ids.length} enquiries deleted.` : 'Enquiry deleted successfully.',
      });
      await loadAdminData();
    } catch (err) {
      console.error('[EnquiresManager] Delete error:', err);
      setLocalMessage({ type: 'error', text: err.message || 'Failed to delete enquiry.' });
    } finally {
      setActionLoading(null);
    }
  }

  const openItemsModalForSession = (session) => {
    setSelectedItemModalData({
      type: 'session',
      title: session.buyerName,
      subtitle: session.businessName,
      phone: session.phone,
      enquiries: session.enquiries,
    });
  };

  const openItemsModalForEnquiry = (enquiry) => {
    setSelectedItemModalData({
      type: 'enquiry',
      title: enquiry.buyer_name || enquiry.name || 'Direct Buyer',
      subtitle: enquiry.business_name || enquiry.company || 'Individual / Direct',
      phone: enquiry.phone || enquiry.whatsapp || '',
      enquiries: [enquiry],
    });
  };

  const newCount = statusCounts.new || 0;

  return (
    <div className="admin-enquiries-page">
      {/* 1. Header Toolbar */}
      <div className="admin-enq-header">
        <div className="admin-enq-header-left">
          <div className="admin-enq-icon-badge">
            <Inbox size={18} className="admin-enq-header-icon" />
          </div>
          <div>
            <h2 className="admin-enq-title">Buyer Enquiries</h2>
            <p className="admin-enq-subtitle">
              {inquiresData.length} total &bull;{' '}
              <span className={newCount > 0 ? 'admin-enq-unread-pill' : ''}>
                {newCount} new
              </span>{' '}
              {viewMode === 'grouped' && groupedSessions.length > 0 && (
                <span>&bull; {groupedSessions.length} buyer {groupedSessions.length === 1 ? 'session' : 'sessions'}</span>
              )}
            </p>
          </div>
        </div>

        <div className="admin-enq-header-actions">
          <div className="admin-enq-view-toggle">
            <button
              type="button"
              className={`admin-enq-toggle-btn ${viewMode === 'grouped' ? 'active' : ''}`}
              onClick={() => setViewMode('grouped')}
              title="Group enquiries by buyer within 1 day (24 hours)"
            >
              <Clock size={12} />
              <span>Grouped (1 Day)</span>
            </button>
            <button
              type="button"
              className={`admin-enq-toggle-btn ${viewMode === 'individual' ? 'active' : ''}`}
              onClick={() => setViewMode('individual')}
              title="Show each enquiry as an individual card"
            >
              <Layers size={12} />
              <span>Individual</span>
            </button>
          </div>

          <button
            type="button"
            className="admin-enq-refresh-btn"
            onClick={() => loadAdminData()}
            disabled={loading}
            title="Refresh enquiries"
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Section */}
      <div className="admin-enq-toolbar">
        <div className="admin-enq-search-wrap">
          <Search size={14} className="admin-enq-search-icon" />
          <input
            type="search"
            className="admin-enq-search-input"
            placeholder="Search buyer, company, phone, email, pincode…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-enq-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="admin-enq-status-tabs">
          {[
            { key: 'all', label: 'All' },
            { key: 'new', label: 'New' },
            { key: 'contacted', label: 'Contacted' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => {
            const count = statusCounts[tab.key] ?? 0;
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`admin-enq-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="admin-enq-tab-badge">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Feedback Messages */}
      {localMessage && (
        <div className={`admin-enq-alert ${localMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {localMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {adminData.errors?.inquiries && (
        <div className="admin-enq-alert alert-error">
          <AlertTriangle size={15} />
          <span>Error loading enquiries: {adminData.errors.inquiries}</span>
        </div>
      )}

      {/* 4. Enquiries Content */}
      {filtered.length === 0 ? (
        <div className="admin-enq-empty-state">
          <div className="admin-enq-empty-icon">
            <Inbox size={28} />
          </div>
          <h3>No enquiries found</h3>
          <p>
            {searchQuery || statusFilter !== 'all'
              ? 'Try resetting your search or selecting a different status filter.'
              : 'New customer enquiries will appear here in real time.'}
          </p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              className="admin-enq-empty-reset-btn"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grouped' ? (
        /* Compact Grouped Sessions View */
        <div className="admin-enquiries-list">
          {groupedSessions.map((session) => {
            const isGroup = session.isGrouped;
            const sessionIds = session.enquiries.map((e) => e.id);
            const isLoading = actionLoading === sessionIds.join(',');

            return (
              <div key={session.id} className="admin-enq-card">
                {/* 1. Header: Buyer Name, Business, Group Badge, Status, Date */}
                <div className="admin-enq-card-top">
                  <div className="admin-enq-identity">
                    <span className="admin-enq-buyer-name">{session.buyerName}</span>
                    {session.businessName && session.businessName !== 'Individual / Direct' && (
                      <>
                        <span className="admin-enq-dot">&bull;</span>
                        <span className="admin-enq-business">{session.businessName}</span>
                      </>
                    )}
                    {isGroup && session.timeSpanText && (
                      <span className="admin-enq-group-tag" title="Enquiries received within a 24-hour window">
                        <Clock size={10} />
                        <span>{session.enquiries.length} enquiries &bull; {session.timeSpanText}</span>
                      </span>
                    )}
                  </div>

                  <div className="admin-enq-top-meta">
                    <span className={`admin-enq-status-pill pill-${session.overallStatus}`}>
                      {session.overallStatus}
                    </span>
                    <span className="admin-enq-date">
                      <Calendar size={10} />
                      <span>{session.latestDateStr}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Contact Meta: Clean inline contact links */}
                <div className="admin-enq-contact-row">
                  {session.phone && (
                    <a
                      href={getWhatsappUrl(session.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-enq-contact-link"
                      title="Direct phone / WhatsApp contact"
                    >
                      <Phone size={11} />
                      <span>{session.phone}</span>
                    </a>
                  )}
                  {session.email && (
                    <a
                      href={`mailto:${session.email}`}
                      className="admin-enq-contact-link"
                      title="Send email"
                    >
                      <Mail size={11} />
                      <span>{session.email}</span>
                    </a>
                  )}
                  {session.pincode && (
                    <span className="admin-enq-contact-text">
                      <MapPin size={11} />
                      <span>{session.pincode}</span>
                    </span>
                  )}
                </div>

                {/* 3. Submissions Feed: Compact, minimal rows */}
                <div className="admin-enq-feed">
                  {session.enquiries.map((enq, index) => {
                    const items = extractEnquiryItems(enq);
                    const itemCount = items.reduce(
                      (sum, it) => sum + (Number(it.quantity) || 1),
                      0
                    );
                    const cleanedMsg = cleanEnquiryMessage(enq.message || enq.notes);
                    const enqTimeStr = enq.created_at
                      ? new Date(enq.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';
                    const enqStatus = (enq.status || 'new').toLowerCase();
                    const isAutoCart = !enq.message || /^Enquiry for \d+\s*items?\s*in cart$/i.test(enq.message);

                    return (
                      <div key={enq.id} className="admin-enq-feed-item">
                        {isGroup && (
                          <span className="admin-enq-feed-badge">#{session.enquiries.length - index}</span>
                        )}
                        <span className="admin-enq-feed-desc" title={cleanedMsg}>
                          {isAutoCart ? (
                            <span>Cart enquiry &bull; {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                          ) : (
                            cleanedMsg
                          )}
                        </span>

                        {itemCount > 0 && (
                          <button
                            type="button"
                            className="admin-enq-item-tag"
                            onClick={() => openItemsModalForEnquiry(enq)}
                            title="Inspect enquired items"
                          >
                            <ShoppingBag size={11} />
                            <span>View {itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                            <ExternalLink size={10} />
                          </button>
                        )}

                        <div className="admin-enq-feed-meta">
                          {isGroup && enqStatus !== session.overallStatus && (
                            <span className={`admin-enq-mini-status status-${enqStatus}`}>
                              {enqStatus}
                            </span>
                          )}
                          {enqTimeStr && <span className="admin-enq-feed-time">{enqTimeStr}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4. Action Bar: Compact, clean actions */}
                <div className="admin-enq-card-footer">
                  <div className="admin-enq-btn-group">
                    {session.phone && (
                      <a
                        href={`${getWhatsappUrl(session.phone)}?text=${encodeURIComponent(
                          generateWhatsAppGroupMsg(session.enquiries, products)
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-enq-btn btn-whatsapp"
                        title="Send consolidated WhatsApp quotation"
                      >
                        <WhatsappIcon size={13} />
                        <span>WhatsApp Quote</span>
                      </a>
                    )}

                    {session.totalItemsCount > 1 && isGroup && (
                      <button
                        type="button"
                        className="admin-enq-btn btn-outline"
                        onClick={() => openItemsModalForSession(session)}
                      >
                        <ShoppingBag size={12} />
                        <span>All Items ({session.totalItemsCount})</span>
                      </button>
                    )}

                    {session.overallStatus !== 'contacted' && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => updateStatus(sessionIds, 'contacted')}
                        className="admin-enq-btn btn-secondary"
                      >
                        {isGroup ? 'Mark Contacted' : 'Mark Contacted'}
                      </button>
                    )}

                    {session.overallStatus !== 'completed' && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => updateStatus(sessionIds, 'completed')}
                        className="admin-enq-btn btn-secondary"
                      >
                        {isGroup ? 'Mark Completed' : 'Mark Completed'}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    title={isGroup ? 'Delete session' : 'Delete enquiry'}
                    disabled={isLoading}
                    onClick={() => handleDelete(sessionIds)}
                    className="admin-enq-delete-btn"
                    aria-label="Delete enquiry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Individual Flat View */
        <div className="admin-enquiries-list">
          {filtered.map((item) => {
            const buyerName = item.buyer_name || item.name || 'Direct Buyer';
            const businessName = item.business_name || item.company || 'Individual / Direct';
            const email = item.email || '';
            const phone = item.phone || item.whatsapp || '';
            const msg = cleanEnquiryMessage(item.message || item.notes);
            const status = (item.status || 'new').toLowerCase();
            const items = extractEnquiryItems(item);
            const itemCount = items.reduce(
              (sum, it) => sum + (Number(it.quantity) || 1),
              0
            );
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown Date';
            const isLoading = actionLoading === item.id;
            const isAutoCart = !item.message || /^Enquiry for \d+\s*items?\s*in cart$/i.test(item.message);

            return (
              <div key={item.id} className="admin-enq-card">
                {/* 1. Header */}
                <div className="admin-enq-card-top">
                  <div className="admin-enq-identity">
                    <span className="admin-enq-buyer-name">{buyerName}</span>
                    {businessName && businessName !== 'Individual / Direct' && (
                      <>
                        <span className="admin-enq-dot">&bull;</span>
                        <span className="admin-enq-business">{businessName}</span>
                      </>
                    )}
                  </div>

                  <div className="admin-enq-top-meta">
                    <span className={`admin-enq-status-pill pill-${status}`}>
                      {status}
                    </span>
                    <span className="admin-enq-date">
                      <Calendar size={10} />
                      <span>{dateStr}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Contact Meta */}
                <div className="admin-enq-contact-row">
                  {phone && (
                    <a
                      href={getWhatsappUrl(phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-enq-contact-link"
                    >
                      <Phone size={11} />
                      <span>{phone}</span>
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="admin-enq-contact-link">
                      <Mail size={11} />
                      <span>{email}</span>
                    </a>
                  )}
                  {item.pincode && (
                    <span className="admin-enq-contact-text">
                      <MapPin size={11} />
                      <span>{item.pincode}</span>
                    </span>
                  )}
                </div>

                {/* 3. Message / Items row */}
                <div className="admin-enq-feed">
                  <div className="admin-enq-feed-item">
                    <span className="admin-enq-feed-desc" title={msg}>
                      {isAutoCart ? (
                        <span>Cart enquiry &bull; {itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      ) : (
                        msg || 'Catalogue enquiry'
                      )}
                    </span>
                    {itemCount > 0 && (
                      <button
                        type="button"
                        className="admin-enq-item-tag"
                        onClick={() => openItemsModalForEnquiry(item)}
                      >
                        <ShoppingBag size={11} />
                        <span>View {itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                        <ExternalLink size={10} />
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Action Bar */}
                <div className="admin-enq-card-footer">
                  <div className="admin-enq-btn-group">
                    {phone && (
                      <a
                        href={`${getWhatsappUrl(phone)}?text=${encodeURIComponent(
                          generateWhatsAppGroupMsg([item], products)
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-enq-btn btn-whatsapp"
                      >
                        <WhatsappIcon size={13} />
                        <span>WhatsApp Quote</span>
                      </a>
                    )}

                    {status !== 'contacted' && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => updateStatus(item.id, 'contacted')}
                        className="admin-enq-btn btn-secondary"
                      >
                        Mark Contacted
                      </button>
                    )}

                    {status !== 'completed' && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => updateStatus(item.id, 'completed')}
                        className="admin-enq-btn btn-secondary"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    title="Delete Enquiry"
                    disabled={isLoading}
                    onClick={() => handleDelete(item.id)}
                    className="admin-enq-delete-btn"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Item Inspection Modal */}
      <EnquiryItemsModal
        isOpen={!!selectedItemModalData}
        onClose={() => setSelectedItemModalData(null)}
        modalData={selectedItemModalData}
        products={products}
      />
    </div>
  );
}

function EnquiryItemsModal({ isOpen, onClose, modalData, products = [] }) {
  if (!isOpen || !modalData) return null;

  const { title, subtitle, phone, enquiries = [] } = modalData;

  // Extract and consolidate all items across provided enquiries
  const consolidatedList = [];
  enquiries.forEach((enq) => {
    const rawItems = extractEnquiryItems(enq);
    rawItems.forEach((row) => {
      consolidatedList.push({
        ...row,
        _enquiryCreatedAt: enq.created_at,
        _productGroupKey: row.product_group_key || row.productGroupKey || enq.product_group_key || enq.productGroupKey,
        _variantCode: row.variant_code || row.variantCode || enq.variant_code,
      });
    });
  });

  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-user-list-modal admin-enq-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <span className="admin-modal-subtitle">Enquired Items</span>
            <h3 className="admin-modal-title">{title}</h3>
            <span className="admin-modal-header-meta">
              {subtitle} &bull; Phone:{' '}
              {phone ? (
                <a
                  href={getWhatsappUrl(phone)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0284c7', textDecoration: 'underline' }}
                >
                  {phone}
                </a>
              ) : (
                'N/A'
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-modal-close-btn"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="admin-modal-body admin-enq-modal-body">
          {consolidatedList.length === 0 ? (
            <p className="admin-modal-empty">No items recorded for this enquiry.</p>
          ) : (
            consolidatedList.map((row, idx) => {
              const productKey = row._productGroupKey;
              const searchCode = row._variantCode;
              let matchedProduct = products.find((p) => p.id === productKey || p.groupKey === productKey);

              if (!matchedProduct && searchCode) {
                matchedProduct = products.find(
                  (p) =>
                    (p.variants || []).some((v) => v.code === searchCode) ||
                    p.id === searchCode ||
                    p.groupKey === searchCode
                );
              }

              const { baseVariantCode, colorName } = parseCartVariantCode(searchCode || '');
              const variant = matchedProduct?.variants?.find((v) => v.code === baseVariantCode);
              const colorOptions = matchedProduct?.colorOptions || [];
              const selectedColorName = colorName || row.color || variant?.color || colorOptions[0]?.name || '';
              const selectedColor = colorOptions.find((entry) => entry.name === selectedColorName);
              const itemImage = selectedColor?.image || variant?.image || matchedProduct?.images?.[0] || fallbackProductImage;

              const resolvedKey = productKey || matchedProduct?.id || matchedProduct?.groupKey;
              const itemTitle = matchedProduct?.title || `Product Design Code: ${resolvedKey || 'N/A'}`;
              const displayCode = searchCode || baseVariantCode || resolvedKey || 'N/A';

              const categorySlug = matchedProduct ? getProductCategorySlug(matchedProduct.id || matchedProduct.groupKey, matchedProduct.category) : 'catalogue';
              const pId = resolvedKey || matchedProduct?.id || matchedProduct?.groupKey;
              const productUrl = pId ? `/${categorySlug}/${encodeURIComponent(pId)}` : '#';

              return (
                <a
                  key={row.id || idx}
                  href={productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-user-item-card-link"
                  title="Click to view product on live site"
                >
                  <div className="admin-user-item-card">
                    <img
                      src={itemImage}
                      className="admin-user-item-thumb"
                      alt={itemTitle}
                      onError={(e) => {
                        e.target.src = fallbackProductImage;
                      }}
                    />
                    <div className="admin-user-item-details">
                      <div className="admin-user-item-header-row">
                        <h4 className="admin-user-item-title">{itemTitle}</h4>
                        <ExternalLink size={14} className="admin-item-ext-icon" style={{ marginLeft: 'auto' }} />
                      </div>
                      <div className="admin-user-item-meta">
                        <span className="admin-item-code">
                          Code: <code>{displayCode}</code>
                        </span>
                        {selectedColorName && (
                          <span className="admin-item-color">
                            Color: <strong className="admin-capitalize">{selectedColorName}</strong>
                          </span>
                        )}
                        <span className="admin-user-item-qty">
                          Qty: <strong>x{row.quantity || 1}</strong>
                        </span>
                      </div>
                      {row.price !== undefined && row.price !== null && (
                        <div className="admin-user-item-price">
                          <span className="price-tag">
                            Price: <strong>{formatMoney(row.price)}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
