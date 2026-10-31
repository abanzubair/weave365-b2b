/**
 * @file AdminTrackingPanel.jsx
 * @description Master Coordinator & Tracking Management Panel for Weave365 Admin.
 * Provides streamlined order inspection, logistics carrier assignment, real-time status management,
 * automated buyer WhatsApp dispatch alerts, direct courier tracking links, and 
 * blind dropship dispatch label generation with an impeccable, quiet, scan-first interface.
 */

import { useState, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  Edit3, 
  X, 
  ExternalLink, 
  MessageSquareText, 
  Copy,
  Check,
  Printer,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Send,
  ShieldCheck,
  Layers,
  Calendar,
  MapPin,
  User,
  Phone,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  MessageCircle,
  HelpCircle,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Tag
} from '../../components/icons.jsx';
import { supabase } from '../../supabaseClient.js';
import { fallbackProductImage, formatMoney } from '../../storefrontShared.jsx';
import { getProductCategorySlug } from '../../config.js';
import AdminLoadingScreen from './AdminLoadingScreen.jsx';
import { printCourierSlip, getDropshipCustomPricing } from '../../utils/courierSlipGenerator.js';

async function updateSupabaseOrderTracking(id, { status, trackingCarrier, trackingNumber, trackingMessage, sourceTable }) {
  let table = 'inquiries';
  if (sourceTable === 'api_orders') table = 'api_orders';
  else if (sourceTable === 'orders') table = 'orders';

  const payload = {
    status: status,
    tracking_carrier: trackingCarrier,
    tracking_number: trackingNumber,
    tracking_message: trackingMessage,
    updated_at: new Date().toISOString()
  };
  const { error } = await supabase.from(table).update(payload).eq('id', id);
  if (error) throw error;

  if (sourceTable === 'orders' && (trackingCarrier || trackingNumber)) {
    try {
      await supabase.from('order_fulfillments').insert({
        order_id: id,
        tracking_carrier: trackingCarrier || 'Delhivery',
        tracking_number: trackingNumber || '',
        tracking_message: trackingMessage || null,
        status: status === 'delivered' ? 'delivered' : 'dispatched',
        dispatched_at: new Date().toISOString(),
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
      });
    } catch (e) {
      // Non-blocking if table or trigger already handled it
      console.warn('[AdminTrackingPanel] order_fulfillments insert notice:', e);
    }
  }
}

// Carrier tracking link generator
function getCarrierTrackingUrl(carrier = '', awb = '') {
  if (!awb) return null;
  const c = carrier.toLowerCase();
  const cleanAwb = encodeURIComponent(awb.trim());
  if (c.includes('delhivery')) return `https://www.delhivery.com/track/package/${cleanAwb}`;
  if (c.includes('dtdc')) return `https://www.dtdc.in/`;
  if (c.includes('bluedart') || c.includes('blue dart')) return `https://www.bluedart.com/tracking`;
  if (c.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${cleanAwb}`;
  if (c.includes('india post') || c.includes('speed post')) return `https://www.indiapost.gov.in/`;
  if (c.includes('shadowfax')) return `https://tracker.shadowfax.in/#/track?awb=${cleanAwb}`;
  if (c.includes('trackon')) return `http://trackon.in/`;
  return null;
}

// Status classification helpers
export function isNeedsAttentionStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  return s === 'new' || s === 'paid' || s === 'unfulfilled';
}

export function isFulfillmentStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  return s === 'verified' || s === 'processing' || s === 'packing' || s === 'qc' || s === 'in_fulfillment';
}

export function isTransitStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  return s === 'dispatched' || s === 'in_transit' || s === 'shipped';
}

export function isDeliveredStatus(status) {
  const s = String(status || '').toLowerCase().trim();
  return s === 'delivered' || s === 'done' || s === 'completed';
}

export function getOrderStatusDisplay(status) {
  const s = String(status || 'new').toLowerCase().trim();
  if (s === 'paid') {
    return {
      label: 'Payment Received',
      pillClass: 'pill-paid',
      dotColor: '#16a34a',
      category: 'needs_attention'
    };
  }
  if (s === 'new') {
    return {
      label: 'Payment Received',
      pillClass: 'pill-paid',
      dotColor: '#16a34a',
      category: 'needs_attention'
    };
  }
  if (s === 'pending_payment') {
    return {
      label: 'Pending Payment',
      pillClass: 'pill-new',
      dotColor: '#d97706',
      category: 'needs_attention'
    };
  }
  if (isFulfillmentStatus(s)) {
    return {
      label: s === 'processing' ? 'Processing' : 'In Fulfillment (QC)',
      pillClass: 'pill-verified',
      dotColor: '#4f46e5',
      category: 'in_fulfillment'
    };
  }
  if (isTransitStatus(s)) {
    return {
      label: 'In Transit',
      pillClass: 'pill-dispatched',
      dotColor: '#0284c7',
      category: 'in_transit'
    };
  }
  if (isDeliveredStatus(s)) {
    return {
      label: 'Delivered',
      pillClass: 'pill-delivered',
      dotColor: '#16a34a',
      category: 'delivered'
    };
  }
  if (s === 'cancelled' || s === 'rejected') {
    return {
      label: 'Cancelled',
      pillClass: 'pill-cancelled',
      dotColor: '#e11d48',
      category: 'cancelled'
    };
  }
  return {
    label: status || 'New',
    pillClass: `pill-${s}`,
    dotColor: '#64748b',
    category: 'other'
  };
}

export function AdminTrackingPanel({ inquiries = [], products = [], loadAdminData, loading = false }) {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('tracking'); // 'tracking' | 'details'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('new'); // Defaults to 'new' (Needs Attention)
  const [typeFilter, setTypeFilter] = useState('orders'); // 'orders' | 'dropship' | 'all'
  const [dateSortOrder, setDateSortOrder] = useState('desc'); // 'desc' = latest at top, 'asc' = oldest at top
  const [actionLoading, setActionLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState({});

  // Form State for editing order tracking
  const [formStatus, setFormStatus] = useState('verified');
  const [formCarrier, setFormCarrier] = useState('');
  const [formTrackingNum, setFormTrackingNum] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // Open editor modal with selected order details
  const handleOpenEditor = (inquiry, defaultTab = 'tracking') => {
    setSelectedInquiry(inquiry);
    setActiveModalTab(defaultTab);
    setFormStatus(inquiry.status || 'new');
    setFormCarrier(inquiry.tracking_carrier || 'Delhivery');
    setFormTrackingNum(inquiry.tracking_number || '');
    setFormMessage(inquiry.tracking_message || '');
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Helper to parse delivery address from message notes
  const getParsedAddress = (msg) => {
    if (!msg) return '';
    if (msg.includes('Delivery Address:')) {
      const parts = msg.split('Delivery Address:');
      if (parts.length >= 2) return parts[1].split('. Notes:')[0].trim();
    }
    if (msg.includes('Shipping to:')) {
      const parts = msg.split('Shipping to:');
      if (parts.length >= 2) return parts[1].split('. Notes:')[0].trim();
    }
    return '';
  };

  // Resolve item image and title from products catalog or item properties
  const resolveItemDetails = (item) => {
    const skuCode = String(item.variant_code || item.sku || item.product_id || item.id || '').trim();
    const baseCode = skuCode.includes('-') ? skuCode.split('-')[0].trim().toLowerCase() : skuCode.toLowerCase();
    const itemColor = String(item.color || '').trim().toLowerCase();

    let matchedProd = (products || []).find(p => {
      const pId = String(p.id || '').toLowerCase();
      const pGroup = String(p.groupKey || '').toLowerCase();
      if (pId === skuCode.toLowerCase() || pGroup === skuCode.toLowerCase()) return true;
      if (p.variants && p.variants.some(v => String(v.code || '').toLowerCase() === skuCode.toLowerCase())) return true;
      return false;
    });

    if (!matchedProd && baseCode) {
      matchedProd = (products || []).find(p => {
        const pId = String(p.id || '').toLowerCase();
        const pGroup = String(p.groupKey || '').toLowerCase();
        return pId === baseCode || pGroup === baseCode;
      });
    }

    let matchedVariant = null;
    if (matchedProd?.variants) {
      matchedVariant = matchedProd.variants.find(v => 
        String(v.code || '').toLowerCase() === skuCode.toLowerCase() ||
        (itemColor && String(v.color || v.colorName || '').toLowerCase() === itemColor)
      );
    }

    let imageSrc = item.thumbnail_url || item.image || item.image_url || '';
    if (!imageSrc && matchedProd) {
      if (itemColor && matchedProd.colorOptions) {
        const matchedOpt = matchedProd.colorOptions.find(c => String(c.name || '').toLowerCase() === itemColor);
        if (matchedOpt?.image) imageSrc = matchedOpt.image;
      }
      if (!imageSrc && itemColor && matchedProd.colorImages && matchedProd.colorImages[itemColor]) {
        imageSrc = matchedProd.colorImages[itemColor];
      }
      if (!imageSrc) {
        imageSrc = matchedVariant?.image || matchedVariant?.images?.[0] || matchedProd.images?.[0] || '';
      }
    }

    const title = item.product_title || item.title || matchedProd?.title || matchedProd?.name || 'Handloom Banarasi Saree';
    const color = item.color || matchedVariant?.color || 'Standard';
    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
    const setSize = matchedProd?.totalColors || matchedProd?.variants?.length || 1;
    const isUnder999 = String(matchedProd?.category || '').toLowerCase() === 'under 999';
    const isSinglePiece = isUnder999 || setSize <= 1 || qty < setSize;

    const b2rPrice = Number(matchedVariant?.prices?.b2r || matchedVariant?.prices?.single || matchedProd?.resellerPrice || 0);
    const mrpPrice = Number(matchedVariant?.prices?.mrp || matchedVariant?.prices?.offer || matchedProd?.price || 0);
    const recordedPrice = Number(item.unit_price) || Number(item.price) || 0;

    let price = recordedPrice;
    // If recordedPrice was saved as wholesale mrp (or 0) but item was ordered as single-piece,
    // resolve to b2rPrice (the single-piece price shown to buyers on the storefront product page)
    if (isSinglePiece && b2rPrice > 0 && (recordedPrice <= mrpPrice || recordedPrice === 0)) {
      price = b2rPrice;
    } else if (!price) {
      price = (isSinglePiece && b2rPrice > 0) ? b2rPrice : (mrpPrice || b2rPrice || 0);
    }
    const targetProductId = matchedProd?.id || item.product_id || baseCode || skuCode;
    const categorySlug = getProductCategorySlug(targetProductId, matchedProd?.category);
    const queryParams = [];
    if (color && color !== 'Standard') {
      queryParams.push(`color=${encodeURIComponent(color)}`);
    }
    if (matchedVariant?.code && matchedVariant.code !== targetProductId) {
      queryParams.push(`variant=${encodeURIComponent(matchedVariant.code)}`);
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const productUrl = targetProductId ? `/${categorySlug}/${encodeURIComponent(targetProductId)}${queryString}` : '#';

    return {
      sku: skuCode || 'SKU',
      title,
      color,
      price,
      image: imageSrc || fallbackProductImage,
      quantity: Math.max(1, parseInt(item.quantity || 1, 10)),
      productId: targetProductId,
      productUrl
    };
  };

  // Generate WhatsApp message url for buyer
  const getBuyerWhatsAppUrl = (inquiry) => {
    const rawPhone = inquiry.dropship_recipient_phone || inquiry.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone) return null;
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const recipientName = inquiry.dropship_recipient_name || inquiry.buyer_name || 'Customer';
    const orderIdShort = inquiry.order_number || inquiry.id.substring(0, 8);
    const trackingUrl = `https://weave365.com/order-tracking/${encodeURIComponent(inquiry.order_number || inquiry.id)}`;
    const carrierText = inquiry.tracking_carrier ? ` via ${inquiry.tracking_carrier} (AWB: ${inquiry.tracking_number || 'in transit'})` : '';
    
    const msg = `Hello ${recipientName}, your order #${orderIdShort} from Weave365 is confirmed${carrierText}.\n\nYou can track live delivery status here:\n${trackingUrl}\n\nThank you for choosing authentic Banarasi handlooms!`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  };

  const handlePrintBlindLabel = (inquiry) => {
    printCourierSlip(inquiry, products);
  };

  // Helper template filler for quick notification message
  const applyTemplate = (type) => {
    if (type === 'verified') {
      setFormMessage('Payment verified! Your order is currently undergoing quality inspection and careful packaging at our Varanasi hub before courier dispatch.');
      setFormStatus('verified');
    } else if (type === 'dispatched') {
      const carrierStr = formCarrier ? ` via ${formCarrier}` : '';
      const trackingStr = formTrackingNum ? ` (Tracking AWB: ${formTrackingNum})` : '';
      setFormMessage(`Package dispatched${carrierStr}${trackingStr}! Your shipment is in transit to your delivery destination.`);
      setFormStatus('dispatched');
    } else if (type === 'delivered') {
      setFormMessage('Shipment successfully delivered! Thank you for ordering with us.');
      setFormStatus('delivered');
    } else if (type === 'needs_attention' || type === 'new' || type === 'paid') {
      setFormMessage('Payment received successfully! Your order is confirmed and queued for quality check and packaging at our Varanasi hub.');
      setFormStatus((selectedInquiry?.status || '').toLowerCase() === 'paid' ? 'paid' : 'new');
    }
  };

  // Submit updated order tracking to Supabase database
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setActionLoading(true);
    try {
      await updateSupabaseOrderTracking(selectedInquiry.id, {
        status: formStatus,
        trackingCarrier: formCarrier.trim(),
        trackingNumber: formTrackingNum.trim(),
        trackingMessage: formMessage.trim(),
        sourceTable: selectedInquiry._sourceTable || 'inquiries'
      });

      setSelectedInquiry(null);
      
      if (loadAdminData) {
        await loadAdminData();
      }
    } catch (err) {
      console.error('Error updating tracking details:', err);
      alert(err.message || 'Failed to update order tracking details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter orders by channel, status, and search query
  const { filteredInquiries, orderStats, channelCounts } = useMemo(() => {
    let allOrders = [...inquiries]
      .filter(i => {
        const s = String(i.status || '').toLowerCase().trim();
        return s !== 'pending_payment' && s !== 'draft' && s !== 'unpaid';
      })
      .map(i => ({
        ...i,
        isDropship: Boolean(i.is_dropship || i._sourceTable === 'api_orders' || i.inquiry_type === 'reseller_api_order'),
        cleanStatus: (i.status || 'new').toLowerCase(),
      }));

    const directOrders = allOrders.filter(i => 
      i._sourceTable === 'orders' || 
      i._sourceTable === 'api_orders' ||
      i.inquiry_type === 'cart_payment' || 
      i.inquiry_type === 'cart_payment_fallback' ||
      i.inquiry_type === 'reseller_api_order'
    );
    const dropshipOrders = allOrders.filter(i => i.isDropship);

    const chCounts = {
      orders: directOrders.length,
      dropship: dropshipOrders.length,
      all: allOrders.length
    };

    // Calculate overall stats for the active channel filter
    const baseSet = typeFilter === 'orders' ? directOrders : (typeFilter === 'dropship' ? dropshipOrders : allOrders);

    const stats = {
      total: baseSet.length,
      newCount: baseSet.filter(i => isNeedsAttentionStatus(i.cleanStatus)).length,
      inProgressCount: baseSet.filter(i => isFulfillmentStatus(i.cleanStatus)).length,
      dispatchedCount: baseSet.filter(i => isTransitStatus(i.cleanStatus)).length,
      deliveredCount: baseSet.filter(i => isDeliveredStatus(i.cleanStatus)).length,
    };

    let result = baseSet;

    if (statusFilter !== 'all') {
      if (statusFilter === 'new') {
        result = result.filter(i => isNeedsAttentionStatus(i.cleanStatus));
      } else if (statusFilter === 'in_progress' || statusFilter === 'in_fulfillment') {
        result = result.filter(i => isFulfillmentStatus(i.cleanStatus));
      } else if (statusFilter === 'dispatched' || statusFilter === 'in_transit') {
        result = result.filter(i => isTransitStatus(i.cleanStatus));
      } else if (statusFilter === 'delivered') {
        result = result.filter(i => isDeliveredStatus(i.cleanStatus));
      } else {
        result = result.filter(i => i.cleanStatus === statusFilter.toLowerCase());
      }
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(i => 
        (i.id && i.id.toLowerCase().includes(q)) ||
        (i.reseller_order_id && String(i.reseller_order_id).toLowerCase().includes(q)) ||
        (i.buyer_name && i.buyer_name.toLowerCase().includes(q)) ||
        (i.dropship_sender_name && i.dropship_sender_name.toLowerCase().includes(q)) ||
        (i.dropship_recipient_name && i.dropship_recipient_name.toLowerCase().includes(q)) ||
        (i.phone && i.phone.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.tracking_number && i.tracking_number.toLowerCase().includes(q)) ||
        (i.items && i.items.some(it => String(it.sku || it.variant_code || '').toLowerCase().includes(q)))
      );
    }

    // Sort by date latest at top (descending) by default, or ascending if toggled
    const sortedResult = [...result].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return { filteredInquiries: sortedResult, orderStats: stats, channelCounts: chCounts };
  }, [inquiries, searchQuery, statusFilter, typeFilter, dateSortOrder]);

  // Quick carrier suggestions
  const carrierSuggestions = ['Delhivery', 'BlueDart', 'DTDC', 'DHL Express', 'India Post Speed Post', 'Shadowfax', 'Trackon'];

  if (loading) {
    return (
      <AdminLoadingScreen
        title="Loading Orders & Live Tracking..."
        subtitle="Syncing dispatches, courier tracking, and order fulfillments…"
      />
    );
  }

  return (
    <div className="admin-tracking-container-refined">
      
      {/* 1. KPI Summary Strip (Distill & Quieter) */}
      <div className="admin-order-stats-strip">
        <button 
          type="button"
          className={`admin-order-kpi-card ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="admin-order-kpi-icon-wrap stat-neutral">
            <Package size={18} />
          </div>
          <div className="admin-order-kpi-text">
            <span className="admin-order-kpi-label">TOTAL ORDERS</span>
            <strong className="admin-order-kpi-value">{orderStats.total}</strong>
          </div>
        </button>

        <button 
          type="button"
          className={`admin-order-kpi-card ${statusFilter === 'new' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
        >
          <div className="admin-order-kpi-icon-wrap stat-amber">
            <Clock size={18} />
          </div>
          <div className="admin-order-kpi-text">
            <span className="admin-order-kpi-label">NEEDS ATTENTION</span>
            <strong className="admin-order-kpi-value" style={{ color: '#b45309' }}>{orderStats.newCount}</strong>
          </div>
        </button>

        <button 
          type="button"
          className={`admin-order-kpi-card ${statusFilter === 'in_progress' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
        >
          <div className="admin-order-kpi-icon-wrap stat-indigo">
            <ShieldCheck size={18} />
          </div>
          <div className="admin-order-kpi-text">
            <span className="admin-order-kpi-label">IN FULFILLMENT</span>
            <strong className="admin-order-kpi-value" style={{ color: '#4338ca' }}>{orderStats.inProgressCount}</strong>
          </div>
        </button>

        <button 
          type="button"
          className={`admin-order-kpi-card ${statusFilter === 'dispatched' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'dispatched' ? 'all' : 'dispatched')}
        >
          <div className="admin-order-kpi-icon-wrap stat-cyan">
            <Truck size={18} />
          </div>
          <div className="admin-order-kpi-text">
            <span className="admin-order-kpi-label">IN TRANSIT</span>
            <strong className="admin-order-kpi-value" style={{ color: '#0369a1' }}>{orderStats.dispatchedCount}</strong>
          </div>
        </button>

        <button 
          type="button"
          className={`admin-order-kpi-card ${statusFilter === 'delivered' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered')}
        >
          <div className="admin-order-kpi-icon-wrap stat-emerald">
            <CheckCircle2 size={18} />
          </div>
          <div className="admin-order-kpi-text">
            <span className="admin-order-kpi-label">DELIVERED</span>
            <strong className="admin-order-kpi-value" style={{ color: '#15803d' }}>{orderStats.deliveredCount}</strong>
          </div>
        </button>
      </div>

      {/* 2. Unified Filter & Search Toolbar (Clarify & Distill) */}
      <div className="admin-orders-toolbar">
        {/* Channel / Type Segmented Pills */}
        <div className="admin-channel-pill-group">
          <button 
            type="button"
            className={`admin-channel-pill ${typeFilter === 'orders' ? 'active' : ''}`}
            onClick={() => setTypeFilter('orders')}
          >
            All Orders ({channelCounts.orders})
          </button>
          <button 
            type="button"
            className={`admin-channel-pill ${typeFilter === 'dropship' ? 'active' : ''}`}
            onClick={() => setTypeFilter('dropship')}
          >
            Dropship Packages ({channelCounts.dropship})
          </button>
          <button 
            type="button"
            className={`admin-channel-pill ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All Inquiries ({channelCounts.all})
          </button>
        </div>

        {/* Right Search & Status Filter */}
        <div className="admin-toolbar-right">
          {/* Status Dropdown */}
          <div className="admin-status-dropdown-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select-refined"
            >
              <option value="new">Status: Needs Attention ({orderStats.newCount})</option>
              <option value="all">Status: Total Orders ({orderStats.total})</option>
              <option value="in_progress">Status: In Fulfillment ({orderStats.inProgressCount})</option>
              <option value="dispatched">Status: In Transit ({orderStats.dispatchedCount})</option>
              <option value="delivered">Status: Delivered ({orderStats.deliveredCount})</option>
              <option value="cancelled">Status: Cancelled</option>
            </select>
          </div>

          {/* Search Field */}
          <div className="admin-search-wrap-refined">
            <Search size={15} className="admin-search-icon-refined" />
            <input
              type="text"
              placeholder="Search by Order ID, name, phone, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-input-refined"
            />
            {searchQuery && (
              <button 
                type="button"
                className="admin-clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Clear Search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {(statusFilter !== 'new' || searchQuery || typeFilter !== 'orders' || dateSortOrder !== 'desc') && (
            <button 
              type="button"
              className="admin-btn-reset-filters"
              onClick={() => {
                setStatusFilter('new');
                setSearchQuery('');
                setTypeFilter('orders');
                setDateSortOrder('desc');
              }}
              title="Reset to Needs Attention"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Streamlined Orders Table (Scan-First & Quieter) */}
      <div className="admin-orders-card-table">
        <div className="admin-table-scroll-container">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th 
                  style={{ width: '110px', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setDateSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  title={`Sort by Date: currently ${dateSortOrder === 'desc' ? 'Latest at top (newest first)' : 'Oldest first'}. Click to toggle.`}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Date</span>
                    {dateSortOrder === 'desc' ? (
                      <ArrowDown size={11} style={{ color: '#4f46e5' }} />
                    ) : (
                      <ArrowUp size={11} style={{ color: '#4f46e5' }} />
                    )}
                  </div>
                </th>
                <th style={{ width: '115px' }}>Order ID</th>
                <th style={{ width: '230px' }}>Recipient & Destination</th>
                <th style={{ width: '185px' }}>Items</th>
                <th style={{ width: '135px' }}>Carrier & Tracking</th>
                <th style={{ width: '115px', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => {
                const parsedAddr = getParsedAddress(inquiry.message);
                const addressText = inquiry.dropship_recipient_address 
                  ? `${inquiry.dropship_recipient_address}${inquiry.dropship_recipient_city ? `, ${inquiry.dropship_recipient_city}` : ''}${inquiry.dropship_recipient_state ? `, ${inquiry.dropship_recipient_state}` : ''}${inquiry.dropship_recipient_pincode ? ` - ${inquiry.dropship_recipient_pincode}` : ''}`
                  : parsedAddr;
                const cityState = (inquiry.dropship_recipient_city || inquiry.dropship_recipient_state)
                  ? [inquiry.dropship_recipient_city, inquiry.dropship_recipient_state].filter(Boolean).join(', ')
                  : (addressText ? addressText.replace(/\s+/g, ' ').trim() : 'Address on file');
                const isDropship = inquiry.isDropship;
                const itemsList = inquiry.items || [];
                const totalItemsQty = itemsList.reduce((sum, it) => sum + Math.max(1, parseInt(it.quantity || 1, 10)), 0);
                const carrierTrackingUrl = getCarrierTrackingUrl(inquiry.tracking_carrier, inquiry.tracking_number);
                const whatsAppUrl = getBuyerWhatsAppUrl(inquiry);
                const customPricing = getDropshipCustomPricing(inquiry);

                return (
                  <tr key={inquiry.id} className={`admin-order-row ${isDropship ? 'is-dropship-row' : ''}`}>
                    {/* Date & Source */}
                    <td>
                      <div className="admin-order-date-col">
                        <span className="admin-date-primary">
                          {inquiry.created_at ? new Date(inquiry.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : '—'}
                        </span>
                        {inquiry.created_at && (
                          <span className="admin-date-time">
                            {new Date(inquiry.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        )}
                        <span className={`admin-source-badge ${isDropship ? 'badge-dropship' : 'badge-direct'}`}>
                          {isDropship ? 'Dropship' : 'Direct'}
                        </span>
                      </div>
                    </td>

                    {/* Order ID */}
                    <td>
                      <div className="admin-order-id-col">
                        <div className="admin-id-copy-row">
                          <code className="admin-order-code" title={inquiry.order_number || inquiry.id}>
                            {inquiry.order_number || inquiry.id.substring(0, 8)}
                          </code>
                          <button 
                            type="button" 
                            onClick={() => handleCopy(inquiry.order_number || inquiry.id, inquiry.id)}
                            className="admin-btn-icon-subtle"
                            title="Copy Order ID"
                          >
                            {copyFeedback[inquiry.id] ? <Check size={11} style={{ color: '#15803d' }} /> : <Copy size={11} />}
                          </button>
                          <a 
                            href={`/order-tracking/${encodeURIComponent(inquiry.order_number || inquiry.id)}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="admin-btn-icon-subtle"
                            title="Open Buyer Tracking Page"
                          >
                            <ExternalLink size={11} />
                          </a>
                        </div>
                        {inquiry.reseller_order_id && (
                          <span className="admin-reseller-ref" title={`Ref: #${inquiry.reseller_order_id}`}>
                            Ref: #{inquiry.reseller_order_id}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Recipient & Destination */}
                    <td>
                      <div className="admin-recipient-col">
                        <div className="admin-recipient-name-row">
                          <strong className="admin-recipient-name" title={inquiry.dropship_recipient_name || inquiry.buyer_name}>
                            {inquiry.dropship_recipient_name || inquiry.buyer_name || 'Customer'}
                          </strong>
                          {whatsAppUrl && (
                            <a 
                              href={whatsAppUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="admin-wa-icon-link"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={11} />
                            </a>
                          )}
                        </div>
                        <div className="admin-destination-text" title={addressText}>
                          <MapPin size={11} className="admin-pin-icon" />
                          <span className="admin-loc-name">{cityState}</span>
                          {(inquiry.dropship_recipient_phone || inquiry.phone) && (
                            <>
                              <span className="admin-dot-sep">·</span>
                              <span className="admin-phone-text">{inquiry.dropship_recipient_phone || inquiry.phone}</span>
                            </>
                          )}
                        </div>
                        {isDropship && (
                          <div className="admin-sender-subtext">
                            via <strong>{inquiry.dropship_sender_name || inquiry.business_name || 'Reseller Store'}</strong>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ordered Items Summary */}
                    <td>
                      {itemsList.length === 1 ? (() => {
                        const resolved = resolveItemDetails(itemsList[0]);
                        return (
                          <div className="admin-item-single-row">
                            <a 
                              href={resolved.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-item-thumb-link"
                              title={`View ${resolved.title} on Storefront ↗`}
                            >
                              <img 
                                src={resolved.image} 
                                alt={resolved.title} 
                                className="admin-item-avatar"
                                onError={(e) => { e.target.src = fallbackProductImage; }}
                              />
                            </a>
                            <div className="admin-item-text-info">
                              <span className="admin-item-sku" title={resolved.sku}>{resolved.sku}</span>
                              <span className="admin-item-desc" title={`${resolved.color} · ${resolved.quantity} pc`}>
                                {resolved.color !== 'Standard' ? `${resolved.color} · ` : ''}{resolved.quantity} {resolved.quantity > 1 ? 'pcs' : 'pc'}
                              </span>
                              {isDropship && customPricing.hasCustom && (
                                <span className="admin-slip-price-pill" title="Retail price printed on customer parcel slip">
                                  Bill: ₹{customPricing.billedPrice.toLocaleString('en-IN')}{customPricing.discount > 0 ? ` (-₹${customPricing.discount.toLocaleString('en-IN')})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })() : itemsList.length > 1 ? (() => {
                        const visibleItems = itemsList.slice(0, 3);
                        const remainingCount = itemsList.length - 3;
                        return (
                          <div 
                            className="admin-items-stack-wrap"
                            onClick={() => handleOpenEditor(inquiry, 'details')}
                            title="Click to view all items in order"
                            role="button"
                            tabIndex={0}
                          >
                            <div className="admin-items-avatar-stack">
                              {visibleItems.map((it, idx) => {
                                const resolved = resolveItemDetails(it);
                                return (
                                  <img 
                                    key={idx} 
                                    src={resolved.image} 
                                    alt={resolved.title} 
                                    className="admin-item-avatar stacked"
                                    style={{ zIndex: 3 - idx }}
                                    onError={(e) => { e.target.src = fallbackProductImage; }}
                                    title={`${resolved.sku} (${resolved.color}) x${resolved.quantity}`}
                                  />
                                );
                              })}
                              {remainingCount > 0 && (
                                <span className="admin-items-avatar-more" style={{ zIndex: 0 }}>
                                  +{remainingCount}
                                </span>
                              )}
                            </div>
                            <div className="admin-item-text-info">
                              <strong className="admin-item-total-qty">{totalItemsQty} items</strong>
                              <span className="admin-item-styles-count">{itemsList.length} styles</span>
                              {isDropship && customPricing.hasCustom && (
                                <span className="admin-slip-price-pill" title="Retail price printed on customer parcel slip">
                                  Bill: ₹{customPricing.billedPrice.toLocaleString('en-IN')}{customPricing.discount > 0 ? ` (-₹${customPricing.discount.toLocaleString('en-IN')})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })() : (
                        <span className="admin-text-muted-subtle">{inquiry.variant_code || '1 Standard Item'}</span>
                      )}
                    </td>

                    {/* Logistics Carrier & Tracking */}
                    <td>
                      {inquiry.tracking_carrier ? (
                        <div className="admin-carrier-col">
                          <strong className="admin-carrier-title">{inquiry.tracking_carrier}</strong>
                          <div className="admin-awb-row">
                            <span className="admin-carrier-awb" title={inquiry.tracking_number || 'Pending'}>
                              {inquiry.tracking_number ? `AWB: ${inquiry.tracking_number}` : 'AWB: Pending'}
                            </span>
                            {inquiry.tracking_number && (
                              <button 
                                type="button"
                                onClick={() => handleCopy(inquiry.tracking_number, `awb-${inquiry.id}`)}
                                className="admin-btn-icon-subtle"
                                title="Copy AWB Number"
                              >
                                {copyFeedback[`awb-${inquiry.id}`] ? <Check size={11} style={{ color: '#15803d' }} /> : <Copy size={11} />}
                              </button>
                            )}
                            {carrierTrackingUrl && (
                              <a 
                                href={carrierTrackingUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="admin-btn-icon-subtle"
                                title={`Track on ${inquiry.tracking_carrier}`}
                              >
                                <ArrowUpRight size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="admin-unassigned-badge">Unassigned</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      {(() => {
                        const badgeInfo = getOrderStatusDisplay(inquiry.status);
                        return (
                          <span className={`admin-status-pill ${badgeInfo.pillClass}`}>
                            <span className="admin-status-dot" style={{ background: badgeInfo.dotColor }} />
                            {badgeInfo.label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="admin-actions-cell">
                        <button
                          type="button"
                          onClick={() => handleOpenEditor(inquiry, 'tracking')}
                          className="admin-btn-action-primary"
                          title="Update Tracking & Fulfillment"
                        >
                          <Edit3 size={13} /> <span>Update</span>
                        </button>
                        {isDropship && (
                          <button
                            type="button"
                            onClick={() => handlePrintBlindLabel(inquiry)}
                            className="admin-btn-action-slip"
                            title="Print Blind Dispatch Slip"
                          >
                            <Printer size={13} /> <span>Slip</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditor(inquiry, 'details')}
                          className="admin-btn-action-ghost"
                          title="View Full Order Details"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-empty-table-state">
                    <div className="admin-empty-wrap">
                      <Package size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                      <p className="admin-empty-title">No orders found</p>
                      <p className="admin-empty-sub">Try changing your search terms or filter selection.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Interactive Focused Modal (Tracking Update & Order Details) */}
      {selectedInquiry && (
        <div className="admin-modal-overlay" onClick={() => setSelectedInquiry(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="admin-modal-header">
              <div className="admin-modal-header-left">
                <div className="admin-modal-title-row">
                  <h3 className="admin-modal-title">
                    {activeModalTab === 'details' ? (
                      <>
                        <Layers size={18} /> Order Details #{selectedInquiry.order_number || selectedInquiry.id.substring(0, 8)}
                      </>
                    ) : (
                      <>
                        <Truck size={18} /> Update Fulfillment #{selectedInquiry.order_number || selectedInquiry.id.substring(0, 8)}
                      </>
                    )}
                  </h3>
                  {(() => {
                    const badgeInfo = getOrderStatusDisplay(selectedInquiry.status);
                    return (
                      <span className={`admin-status-pill ${badgeInfo.pillClass}`}>
                        <span className="admin-status-dot" style={{ background: badgeInfo.dotColor }} />
                        {badgeInfo.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="admin-modal-sub-row">
                  <span>Placed on {new Date(selectedInquiry.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  {selectedInquiry.isDropship && <span className="badge-dropship-mini">Direct Dropship</span>}
                </div>
              </div>

              <div className="admin-modal-header-right">
                <button 
                  type="button" 
                  className="admin-modal-close-btn"
                  onClick={() => setSelectedInquiry(null)}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Tab Switcher */}
            <div className="admin-modal-tabs-strip">
              <button
                type="button"
                className={`admin-modal-tab-btn ${activeModalTab === 'tracking' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('tracking')}
              >
                <Truck size={14} /> Update Fulfillment
              </button>
              <button
                type="button"
                className={`admin-modal-tab-btn ${activeModalTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('details')}
              >
                <Layers size={14} /> Order Details & Items ({(selectedInquiry.order_items?.length || selectedInquiry.items?.length || 1)})
              </button>
            </div>

            {/* Modal Context Strip (Shown on Fulfillment tab for quick reference) */}
            {activeModalTab === 'tracking' && (
              <div className="admin-modal-context-banner">
                <div className="admin-context-pill">
                  <User size={13} className="admin-context-icon" />
                  <span><strong>{selectedInquiry.dropship_recipient_name || selectedInquiry.buyer_name || 'Customer'}</strong> {selectedInquiry.phone ? `(${selectedInquiry.phone})` : ''}</span>
                </div>
                <div className="admin-context-pill">
                  <MapPin size={13} className="admin-context-icon" />
                  <span>{selectedInquiry.dropship_recipient_city ? `${selectedInquiry.dropship_recipient_city}, ${selectedInquiry.dropship_recipient_state || ''}` : 'Direct Order'}</span>
                </div>
                <div className="admin-context-pill">
                  <Package size={13} className="admin-context-icon" />
                  <span><strong>{(selectedInquiry.order_items?.length || selectedInquiry.items?.length || 1)} Item(s)</strong> {selectedInquiry.total_amount ? `• ₹${Number(selectedInquiry.total_amount).toLocaleString('en-IN')}` : ''}</span>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="admin-modal-body">
              
              {/* TAB 1: Tracking & Fulfillment Form */}
              {activeModalTab === 'tracking' && (
                <form onSubmit={handleFormSubmit} className="admin-fulfillment-form">
                  
                  {/* Section 1: Status Picker */}
                  <div className="admin-form-section">
                    <div className="admin-section-header">
                      <span className="admin-section-number">1</span>
                      <span className="admin-section-title">SELECT ORDER STATUS</span>
                    </div>
                    <div className="admin-status-picker-grid">
                      {[
                        {
                          id: 'needs_attention',
                          targetStatus: (selectedInquiry?.status || '').toLowerCase() === 'paid' ? 'paid' : 'new',
                          label: 'Payment Received',
                          sub: 'Payment captured via Gateway · Ready for QC & packaging',
                          color: '#b45309',
                          isSelected: isNeedsAttentionStatus(formStatus)
                        },
                        {
                          id: 'verified',
                          targetStatus: 'verified',
                          label: 'In Fulfillment (QC & Packing)',
                          sub: 'Quality check & packaging at Varanasi hub',
                          color: '#4338ca',
                          isSelected: isFulfillmentStatus(formStatus)
                        },
                        {
                          id: 'dispatched',
                          targetStatus: 'dispatched',
                          label: 'In Transit (Dispatched)',
                          sub: 'Dispatched with logistics carrier tracking AWB',
                          color: '#0369a1',
                          isSelected: isTransitStatus(formStatus)
                        },
                        {
                          id: 'delivered',
                          targetStatus: 'delivered',
                          label: 'Delivered',
                          sub: 'Package successfully handed to buyer',
                          color: '#15803d',
                          isSelected: isDeliveredStatus(formStatus)
                        },
                        {
                          id: 'cancelled',
                          targetStatus: 'cancelled',
                          label: 'Cancelled',
                          sub: 'Order voided, cancelled or returned',
                          color: '#be123c',
                          isSelected: formStatus === 'cancelled' || formStatus === 'rejected'
                        },
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          className={`admin-status-card-opt ${st.isSelected ? 'selected' : ''}`}
                          onClick={() => setFormStatus(st.targetStatus)}
                        >
                          <div className="admin-status-card-top">
                            <span className="admin-status-dot-sm" style={{ background: st.color }} />
                            <span className="admin-status-card-name">{st.label}</span>
                            {st.isSelected && <Check size={14} className="admin-status-check-icon" />}
                          </div>
                          <span className="admin-status-card-sub">{st.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Logistics & Tracking Details */}
                  <div className="admin-form-section">
                    <div className="admin-section-header">
                      <span className="admin-section-number">2</span>
                      <span className="admin-section-title">LOGISTICS & TRACKING DETAILS</span>
                    </div>
                    <div className="admin-form-grid-2col">
                      <div className="admin-form-field-wrap">
                        <label className="admin-field-label">Logistics Carrier</label>
                        <input
                          type="text"
                          placeholder="e.g. Delhivery, DTDC, BlueDart"
                          value={formCarrier}
                          onChange={(e) => setFormCarrier(e.target.value)}
                          className="admin-form-input"
                        />
                        <div className="admin-quick-carrier-tags">
                          {carrierSuggestions.map(c => (
                            <button 
                              key={c} 
                              type="button" 
                              className={`admin-tag-pill ${formCarrier === c ? 'active' : ''}`}
                              onClick={() => setFormCarrier(c)}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="admin-form-field-wrap">
                        <div className="admin-label-flex-row">
                          <label className="admin-field-label">AWB / Tracking Number</label>
                          {formTrackingNum && formCarrier && getCarrierTrackingUrl(formCarrier, formTrackingNum) && (
                            <a 
                              href={getCarrierTrackingUrl(formCarrier, formTrackingNum)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="admin-preview-track-link"
                            >
                              Test Carrier Link <ArrowUpRight size={11} />
                            </a>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. 12893012930"
                          value={formTrackingNum}
                          onChange={(e) => setFormTrackingNum(e.target.value)}
                          className="admin-form-input"
                        />
                        <span className="admin-form-hint">Shown to buyer on their live tracking dashboard</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Custom Tracking Message with Templates */}
                  <div className="admin-form-section">
                    <div className="admin-section-header-flex">
                      <div className="admin-section-header">
                        <span className="admin-section-number">3</span>
                        <span className="admin-section-title">BUYER TRACKING NOTIFICATION NOTE</span>
                      </div>
                      <div className="admin-quick-templates">
                        <button type="button" onClick={() => applyTemplate('paid')} className="admin-template-btn">
                          <Sparkles size={11} /> Payment Received
                        </button>
                        <button type="button" onClick={() => applyTemplate('verified')} className="admin-template-btn">
                          <Sparkles size={11} /> QC & Packing
                        </button>
                        <button type="button" onClick={() => applyTemplate('dispatched')} className="admin-template-btn">
                          <Sparkles size={11} /> Dispatched
                        </button>
                        <button type="button" onClick={() => applyTemplate('delivered')} className="admin-template-btn">
                          <Sparkles size={11} /> Delivered
                        </button>
                      </div>
                    </div>
                    <textarea
                      placeholder="Add a message visible to the buyer on their live tracking dashboard..."
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      rows="3"
                      className="admin-form-textarea"
                    />
                  </div>

                  {/* Form Footer Actions */}
                  <div className="admin-modal-footer">
                    <div className="admin-modal-footer-left">
                      <a 
                        href={`/order-tracking/${selectedInquiry.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn-secondary"
                        title="Open Buyer Live Tracking Page"
                      >
                        <ExternalLink size={14} /> <span>Live Tracking</span>
                      </a>
                    </div>
                    <div className="admin-modal-footer-right">
                      <button 
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => setSelectedInquiry(null)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="admin-btn-save-primary"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Saving...' : 'Save & Update Tracking'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: Full Order & Items Inspection (Impeccable Layout) */}
              {activeModalTab === 'details' && (() => {
                const modalCustomPricing = getDropshipCustomPricing(selectedInquiry);
                return (
                <div className="admin-order-full-inspection">
                  
                  {/* Address Summary Cards */}
                  <div className="admin-address-inspection-grid">
                    {/* Ship From */}
                    <div className="admin-inspect-card">
                      <div className="admin-inspect-card-top-row">
                        <span className="admin-inspect-header">
                          <User size={13} /> SENDER (SHIP FROM)
                        </span>
                        {selectedInquiry.dropship_packing_preference && (
                          <span className="admin-tag-pill" style={{ fontSize: '10px' }}>
                            {selectedInquiry.dropship_packing_preference}
                          </span>
                        )}
                      </div>
                      <strong className="admin-inspect-name">
                        {selectedInquiry.dropship_sender_name || selectedInquiry.business_name || 'Weave365 Wholesale Partner'}
                      </strong>
                      <p className="admin-inspect-detail">Phone: {selectedInquiry.dropship_sender_phone || selectedInquiry.phone || 'N/A'}</p>
                      {selectedInquiry.dropship_sender_address && (
                        <p className="admin-inspect-detail">{selectedInquiry.dropship_sender_address}</p>
                      )}
                      {modalCustomPricing.hasCustom && (
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534' }}>
                              Customer Parcel Slip Price:
                            </span>
                            <strong style={{ fontSize: '12px', color: '#166534', fontFamily: 'ui-monospace, monospace' }}>
                              ₹{modalCustomPricing.billedPrice.toLocaleString('en-IN')}
                            </strong>
                          </div>
                          {modalCustomPricing.discount > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                              <span style={{ fontSize: '11px', color: '#dc2626' }}>
                                Slip Discount:
                              </span>
                              <span style={{ fontSize: '11.5px', color: '#dc2626', fontFamily: 'ui-monospace, monospace' }}>
                                -₹{modalCustomPricing.discount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '2px' }}>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                              Net Printed on Invoice:
                            </span>
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#0f172a', fontFamily: 'ui-monospace, monospace' }}>
                              ₹{modalCustomPricing.netPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ship To */}
                    <div className="admin-inspect-card highlighted">
                      <div className="admin-inspect-card-top-row">
                        <span className="admin-inspect-header" style={{ color: '#0f172a' }}>
                          <MapPin size={13} /> RECIPIENT (DELIVER TO)
                        </span>
                      </div>
                      <strong className="admin-inspect-name">
                        {selectedInquiry.dropship_recipient_name || selectedInquiry.buyer_name || 'Customer'}
                      </strong>
                      <p className="admin-inspect-detail">Phone: {selectedInquiry.dropship_recipient_phone || selectedInquiry.phone || 'N/A'}</p>
                      <p className="admin-inspect-detail">
                        {selectedInquiry.dropship_recipient_address || getParsedAddress(selectedInquiry.message) || 'Address in order notes'}
                      </p>
                      {(selectedInquiry.dropship_recipient_city || selectedInquiry.dropship_recipient_pincode) && (
                        <p className="admin-inspect-pin">
                          {selectedInquiry.dropship_recipient_city} {selectedInquiry.dropship_recipient_state} - {selectedInquiry.dropship_recipient_pincode || selectedInquiry.pincode}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items Detailed Table */}
                  {(() => {
                    const inspectItems = (Array.isArray(selectedInquiry.order_items) && selectedInquiry.order_items.length > 0)
                      ? selectedInquiry.order_items
                      : (Array.isArray(selectedInquiry.items) ? selectedInquiry.items : []);
                    return (
                      <div className="admin-inspect-items-wrap">
                        <div className="admin-section-header">
                          <span className="admin-section-title">ORDERED ITEMS ({inspectItems.length || 1})</span>
                        </div>
                        <table className="admin-inspect-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>SKU / Variant</th>
                              <th>Color</th>
                              <th style={{ textAlign: 'center' }}>Qty</th>
                              <th style={{ textAlign: 'right' }}>Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inspectItems.map((it, idx) => {
                              const resolved = resolveItemDetails(it);
                              return (
                                <tr key={idx}>
                                  <td>
                                    <a 
                                      href={resolved.productUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="admin-inspect-item-cell"
                                      title={`Open ${resolved.title} page in new tab ↗`}
                                    >
                                      <img 
                                        src={resolved.image} 
                                        alt={resolved.title} 
                                        className="admin-inspect-item-img"
                                        onError={(e) => { e.target.src = fallbackProductImage; }}
                                      />
                                      <span className="admin-inspect-item-title">{resolved.title}</span>
                                    </a>
                                  </td>
                                  <td><code className="admin-sku-code">{resolved.sku}</code></td>
                                  <td><span className="admin-color-tag">{resolved.color}</span></td>
                                  <td style={{ textAlign: 'center' }}><strong>{resolved.quantity}</strong></td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{resolved.price > 0 ? formatMoney(resolved.price * resolved.quantity) : 'Wholesale Tier'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            {(() => {
                              const totalQuantity = inspectItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);
                              const itemsSubtotal = inspectItems.reduce((acc, it) => {
                                const resolved = resolveItemDetails(it);
                                return acc + (resolved.price * resolved.quantity);
                              }, 0);

                              let couponDiscount = Number(selectedInquiry.coupon_discount || 0);
                              let couponCode = selectedInquiry.coupon_code || '';
                              if (!couponDiscount && selectedInquiry.message) {
                                const match = selectedInquiry.message.match(/Coupon:\s*([A-Z0-9_-]+)\s*\(-?₹?([0-9.,]+)\)/i);
                                if (match) {
                                  couponCode = couponCode || match[1];
                                  couponDiscount = Number(match[2].replace(/,/g, '')) || 0;
                                }
                              }

                              const finalTotal = (selectedInquiry.total_amount !== undefined && selectedInquiry.total_amount !== null && Number(selectedInquiry.total_amount) > 0)
                                ? Number(selectedInquiry.total_amount)
                                : Math.max(0, itemsSubtotal - couponDiscount);

                              const paymentMethod = selectedInquiry.payment_method 
                                ? selectedInquiry.payment_method.toUpperCase() 
                                : 'ONLINE PAYMENT';

                              let isExpedited = String(selectedInquiry.shipping_speed || '').toLowerCase() === 'expedited' ||
                                /Shipping:\s*Expedited/i.test(selectedInquiry.message || '');

                              let explicitShippingFee = null;
                              const feeMatch = (selectedInquiry.message || '').match(/Shipping Fee:\s*₹?([0-9.,]+)/i) ||
                                               (selectedInquiry.message || '').match(/Expedited\s*\([^)]*\)\s*\(\+?₹?([0-9.,]+)\)/i);
                              if (feeMatch) {
                                explicitShippingFee = Number(feeMatch[1].replace(/,/g, '')) || 0;
                              }

                              const netItems = Math.max(0, itemsSubtotal - couponDiscount);
                              const diff = finalTotal - netItems;

                              // Heuristic for orders where shipping_speed was not saved to DB:
                              // If diff is a clean positive multiple of ₹150 (the exact expedited rate in India: ₹150, ₹300, ₹450, etc.)
                              if (!isExpedited && diff > 0 && Math.round(diff) % 150 === 0) {
                                isExpedited = true;
                                explicitShippingFee = Math.round(diff);
                              }

                              let shippingFee = 0;
                              let displayItemsSubtotal = itemsSubtotal;

                              if (isExpedited) {
                                if (explicitShippingFee !== null && !isNaN(explicitShippingFee)) {
                                  shippingFee = explicitShippingFee;
                                } else {
                                  shippingFee = Math.max(0, finalTotal - netItems);
                                }
                                if (Math.abs((displayItemsSubtotal - couponDiscount + shippingFee) - finalTotal) > 0.01) {
                                  displayItemsSubtotal = Math.max(0, finalTotal - shippingFee + couponDiscount);
                                }
                              } else {
                                shippingFee = 0;
                                if (finalTotal > 0 && Math.abs((displayItemsSubtotal - couponDiscount) - finalTotal) > 0.01) {
                                  displayItemsSubtotal = Math.max(0, finalTotal + couponDiscount);
                                }
                              }

                              const hasAdjustments = couponDiscount > 0 || shippingFee > 0 || Math.abs(displayItemsSubtotal - finalTotal) > 0.01;

                              if (hasAdjustments) {
                                return (
                                  <>
                                    <tr className="admin-inspect-summary-subtotal">
                                      <td colSpan="4">
                                        <span className="admin-inspect-subtotal-label">Items Subtotal</span>
                                        <span className="admin-inspect-subtotal-units">({totalQuantity} unit{totalQuantity > 1 ? 's' : ''})</span>
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        <span className="admin-inspect-subtotal-amount">{formatMoney(displayItemsSubtotal)}</span>
                                      </td>
                                    </tr>
                                    {couponDiscount > 0 && (
                                      <tr className="admin-inspect-summary-coupon">
                                        <td colSpan="4">
                                          <div className="admin-inspect-coupon-wrap">
                                            <span className="admin-inspect-coupon-label">Applied Coupon</span>
                                            <span className="admin-inspect-coupon-pill">
                                              <Tag size={10.5} /> {couponCode || 'APPLIED'}
                                            </span>
                                          </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                          <span className="admin-inspect-coupon-amount">-{formatMoney(couponDiscount)}</span>
                                        </td>
                                      </tr>
                                    )}
                                    {shippingFee > 0 && (
                                      <tr className="admin-inspect-summary-shipping">
                                        <td colSpan="4">
                                          <span className="admin-inspect-shipping-label">
                                            Shipping &amp; Delivery {isExpedited ? '(Expedited Air)' : ''}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                          <span className="admin-inspect-shipping-amount">+{formatMoney(shippingFee)}</span>
                                        </td>
                                      </tr>
                                    )}
                                    <tr className="admin-inspect-summary-total">
                                      <td colSpan="4">
                                        <div className="admin-inspect-total-left">
                                          <span className="admin-inspect-total-label">Total Paid</span>
                                          {selectedInquiry.payment_method && (
                                            <span className="admin-inspect-payment-pill">{paymentMethod}</span>
                                          )}
                                        </div>
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        <span className="admin-inspect-total-amount">{formatMoney(finalTotal)}</span>
                                      </td>
                                    </tr>
                                    {modalCustomPricing.hasCustom && (
                                      <tr style={{ background: '#f8fafc', borderTop: '1px dashed #cbd5e1' }}>
                                        <td colSpan="4">
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>
                                              Customer Parcel Slip Value
                                            </span>
                                            <span className="admin-slip-price-pill" style={{ margin: 0 }}>
                                              Printed on Bill &amp; Slip
                                            </span>
                                          </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <strong style={{ fontSize: '13px', color: '#166534', fontFamily: 'ui-monospace, monospace' }}>
                                              ₹{modalCustomPricing.netPrice.toLocaleString('en-IN')}
                                            </strong>
                                            {modalCustomPricing.discount > 0 && (
                                              <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                                (₹{modalCustomPricing.billedPrice.toLocaleString('en-IN')} - ₹{modalCustomPricing.discount.toLocaleString('en-IN')})
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </>
                                );
                              }

                              return (
                                <>
                                  <tr className="admin-inspect-summary-total">
                                    <td colSpan="4">
                                      <div className="admin-inspect-total-left">
                                        <span className="admin-inspect-total-label">Total Paid ({totalQuantity} unit{totalQuantity > 1 ? 's' : ''})</span>
                                        {selectedInquiry.payment_method && (
                                          <span className="admin-inspect-payment-pill">{paymentMethod}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <span className="admin-inspect-total-amount">{formatMoney(finalTotal)}</span>
                                    </td>
                                  </tr>
                                  {modalCustomPricing.hasCustom && (
                                    <tr style={{ background: '#f8fafc', borderTop: '1px dashed #cbd5e1' }}>
                                      <td colSpan="4">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#166534' }}>
                                            Customer Parcel Slip Value
                                          </span>
                                          <span className="admin-slip-price-pill" style={{ margin: 0 }}>
                                            Printed on Bill &amp; Slip
                                          </span>
                                        </div>
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                          <strong style={{ fontSize: '13px', color: '#166534', fontFamily: 'ui-monospace, monospace' }}>
                                            ₹{modalCustomPricing.netPrice.toLocaleString('en-IN')}
                                          </strong>
                                          {modalCustomPricing.discount > 0 && (
                                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                              (₹{modalCustomPricing.billedPrice.toLocaleString('en-IN')} - ₹{modalCustomPricing.discount.toLocaleString('en-IN')})
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })()}
                          </tfoot>
                        </table>
                      </div>
                    );
                  })()}

                  {/* Inspection Footer Actions (Balanced 1-Row Layout) */}
                  <div className="admin-modal-footer">
                    <div className="admin-modal-footer-left">
                      <a
                        href={`/order-tracking/${selectedInquiry.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn-secondary"
                        title="Open Buyer Live Tracking Page"
                      >
                        <ExternalLink size={14} /> <span>Live Tracking</span>
                      </a>
                    </div>
                    <div className="admin-modal-footer-right">
                      <button
                        type="button"
                        className="admin-btn-action-primary"
                        onClick={() => setActiveModalTab('tracking')}
                        title="Update status, enter tracking carrier & dispatch"
                        style={{ padding: '8px 14px', fontSize: '13px' }}
                      >
                        <Truck size={14} /> <span>Fulfill / Dispatch</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => handlePrintBlindLabel(selectedInquiry)}
                        title="Print Blind Dispatch Slip"
                      >
                        <Printer size={14} /> <span>Print Label</span>
                      </button>
                      {getBuyerWhatsAppUrl(selectedInquiry) && (
                        <a
                          href={getBuyerWhatsAppUrl(selectedInquiry)}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn-action-wa"
                          title="Send Customer WhatsApp Dispatch Alert"
                        >
                          <MessageCircle size={14} /> <span>WhatsApp Alert</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                );
              })()}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
