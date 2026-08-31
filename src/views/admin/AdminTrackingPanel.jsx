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
  HelpCircle
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { fallbackProductImage, formatMoney } from '../../storefrontShared.jsx';
import { getProductCategorySlug } from '../../config.js';

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

export function AdminTrackingPanel({ inquiries = [], products = [], loadAdminData }) {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('tracking'); // 'tracking' | 'details'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('new'); // Defaults to 'new' (Needs Attention)
  const [typeFilter, setTypeFilter] = useState('orders'); // 'orders' | 'dropship' | 'all'
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
    setFormStatus(inquiry.status || 'verified');
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

    let imageSrc = item.image || item.image_url || '';
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
    const price = Number(item.price) || Number(matchedVariant?.prices?.b2r) || Number(matchedProd?.price) || 0;
    const targetProductId = matchedProd?.id || item.product_id || baseCode || skuCode;
    const categorySlug = getProductCategorySlug(targetProductId, matchedProd?.category);
    const productUrl = targetProductId ? `/${categorySlug}/${encodeURIComponent(targetProductId)}` : '#';

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
    const orderIdShort = inquiry.id.substring(0, 8);
    const trackingUrl = `https://weave365.com/order-tracking/${inquiry.id}`;
    const carrierText = inquiry.tracking_carrier ? ` via ${inquiry.tracking_carrier} (AWB: ${inquiry.tracking_number || 'in transit'})` : '';
    
    const msg = `Namaste ${recipientName}, your order #${orderIdShort} from Weave365 is confirmed${carrierText}.\n\nYou can track live delivery status here:\n${trackingUrl}\n\nThank you for choosing authentic Banarasi handlooms!`;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
  };

  const handlePrintBlindLabel = (inquiry) => {
    if (typeof window === 'undefined') return;
    const senderName = inquiry.dropship_sender_name || inquiry.business_name || inquiry.buyer_name || 'Partner Store';
    const senderPhone = inquiry.dropship_sender_phone || inquiry.phone || 'N/A';
    const senderAddrText = inquiry.dropship_sender_address ? `${inquiry.dropship_sender_address}, ${inquiry.dropship_sender_city || ''} ${inquiry.dropship_sender_state || ''} ${inquiry.dropship_sender_pincode || ''}`.trim() : '';
    
    const recipientName = inquiry.dropship_recipient_name || inquiry.buyer_name || 'Customer';
    const recipientPhone = inquiry.dropship_recipient_phone || inquiry.phone || 'N/A';
    const recipientAddress = inquiry.dropship_recipient_address || getParsedAddress(inquiry.message) || 'Address in order details';
    const recipientCity = inquiry.dropship_recipient_city || '';
    const recipientState = inquiry.dropship_recipient_state || '';
    const recipientPincode = inquiry.dropship_recipient_pincode || inquiry.pincode || '';
    const formattedDestLine = [recipientCity, recipientState].filter(Boolean).join(', ');
    
    const orderIdShort = String(inquiry.id).substring(0, 8);
    const orderDate = new Date(inquiry.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const packingPref = inquiry.dropship_packing_preference || 'Blind Packaging (No Supplier Invoices)';

    const itemsRows = (inquiry.items || []).map((it, idx) => {
      const resolved = resolveItemDetails(it);
      return `
        <tr>
          <td class="check-col"><div class="check-box"></div></td>
          <td class="sku-cell">${resolved.sku}</td>
          <td class="title-cell">${resolved.title}</td>
          <td class="color-cell">${resolved.color}</td>
          <td class="qty-cell">${resolved.quantity} pc</td>
        </tr>
      `;
    }).join('');

    const totalQty = (inquiry.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Dispatch Slip #${orderIdShort}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.4;
            padding: 24px;
          }
          .slip-wrapper {
            max-width: 650px;
            margin: 0 auto;
            border: 1.5px solid #0f172a;
            border-radius: 6px;
            padding: 24px;
          }
          .slip-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .slip-title-wrap h1 {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #0f172a;
            margin-bottom: 3px;
          }
          .slip-meta {
            font-size: 12px;
            color: #475569;
          }
          .slip-meta strong {
            color: #0f172a;
            font-family: monospace;
          }
          .print-btn {
            background: #0f172a;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 4px;
            cursor: pointer;
          }
          .address-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
          }
          .address-card {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 12px 14px;
            background: #ffffff;
          }
          .address-card.recipient-card {
            border-color: #0f172a;
            background: #fafafa;
          }
          .card-tag {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .party-name {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3px;
          }
          .party-phone {
            font-size: 12.5px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 4px;
          }
          .party-address {
            font-size: 12.5px;
            color: #334155;
            line-height: 1.4;
          }
          .pincode-highlight {
            display: inline-block;
            margin-top: 6px;
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
          }
          .spec-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 12px;
            color: #334155;
            margin-bottom: 18px;
          }
          .spec-row strong {
            color: #0f172a;
          }
          .manifest-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12.5px;
            margin-bottom: 18px;
          }
          .manifest-table th {
            text-align: left;
            padding: 8px 10px;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #475569;
            border-bottom: 1.5px solid #cbd5e1;
            background: #f8fafc;
          }
          .manifest-table td {
            padding: 9px 10px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }
          .check-col { width: 30px; text-align: center; }
          .check-box {
            width: 14px;
            height: 14px;
            border: 1.5px solid #94a3b8;
            border-radius: 3px;
            margin: 0 auto;
          }
          .sku-cell {
            font-family: monospace;
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
          }
          .title-cell { color: #1e293b; font-weight: 500; }
          .color-cell { color: #334155; }
          .qty-cell { text-align: center; font-weight: 700; color: #0f172a; white-space: nowrap; }
          .manifest-footer td {
            border-top: 1.5px solid #0f172a;
            border-bottom: none;
            padding: 10px;
            font-weight: 700;
            color: #0f172a;
          }
          .compliance-footer {
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
            font-size: 11px;
            color: #475569;
            text-align: center;
            letter-spacing: 0.2px;
          }
          .compliance-footer strong {
            color: #0f172a;
          }
          @media print {
            body { padding: 0; }
            .slip-wrapper { border-width: 1px; max-width: 100%; border-radius: 0; }
            .print-btn { display: none; }
            @page { margin: 10mm; size: auto; }
          }
        </style>
      </head>
      <body>
        <div class="slip-wrapper">
          <div class="slip-header">
            <div class="slip-title-wrap">
              <h1>Blind Dropship Dispatch Slip</h1>
              <div class="slip-meta">
                Ref ID: <strong>${inquiry.id}</strong> &nbsp;•&nbsp; Date: <strong>${orderDate}</strong>
              </div>
            </div>
            <button class="print-btn" onclick="window.print()">Print Slip</button>
          </div>

          <div class="address-section">
            <div class="address-card">
              <div class="card-tag">SHIP FROM (SENDER)</div>
              <div class="party-name">${senderName}</div>
              <div class="party-phone">Phone: ${senderPhone}</div>
              ${senderAddrText ? `<div class="party-address">${senderAddrText}</div>` : ''}
            </div>

            <div class="address-card recipient-card">
              <div class="card-tag">SHIP TO (RECIPIENT)</div>
              <div class="party-name">${recipientName}</div>
              <div class="party-phone">Phone: ${recipientPhone}</div>
              <div class="party-address">${recipientAddress}</div>
              ${formattedDestLine || recipientPincode ? `
                <div class="pincode-highlight">
                  ${formattedDestLine} ${recipientPincode ? `• PIN: ${recipientPincode}` : ''}
                </div>
              ` : ''}
            </div>
          </div>

          <div class="spec-row">
            <span>Packaging: <strong>${packingPref}</strong></span>
            <span>Total Units: <strong>${totalQty} item(s)</strong></span>
          </div>

          <table class="manifest-table">
            <thead>
              <tr>
                <th class="check-col">QC</th>
                <th>SKU Code</th>
                <th>Item Description</th>
                <th>Color</th>
                <th style="text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr class="manifest-footer">
                <td colspan="4">Total Items In Package</td>
                <td style="text-align: center;">${totalQty} pc</td>
              </tr>
            </tfoot>
          </table>

          <div class="compliance-footer">
            <strong>Warehouse Instructions:</strong> Direct dropship dispatch. Do not enclose supplier invoices, leaflets, or external branding.
          </div>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    }
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
    let allOrders = [...inquiries].map(i => ({
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
      newCount: baseSet.filter(i => i.cleanStatus === 'new').length,
      inProgressCount: baseSet.filter(i => i.cleanStatus === 'verified' || i.cleanStatus === 'processing').length,
      dispatchedCount: baseSet.filter(i => i.cleanStatus === 'dispatched').length,
      deliveredCount: baseSet.filter(i => i.cleanStatus === 'delivered' || i.cleanStatus === 'done').length,
    };

    let result = baseSet;

    if (statusFilter !== 'all') {
      if (statusFilter === 'in_progress') {
        result = result.filter(i => i.cleanStatus === 'verified' || i.cleanStatus === 'processing');
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

    return { filteredInquiries: result, orderStats: stats, channelCounts: chCounts };
  }, [inquiries, searchQuery, statusFilter, typeFilter]);

  // Quick carrier suggestions
  const carrierSuggestions = ['Delhivery', 'BlueDart', 'DTDC', 'DHL Express', 'India Post Speed Post', 'Shadowfax', 'Trackon'];

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
              <option value="new">Status: Needs Attention</option>
              <option value="all">Status: All (Everything)</option>
              <option value="in_progress">Status: In Fulfillment</option>
              <option value="verified">Status: Verified</option>
              <option value="processing">Status: Processing</option>
              <option value="dispatched">Status: Dispatched</option>
              <option value="delivered">Status: Delivered</option>
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

          {(statusFilter !== 'new' || searchQuery || typeFilter !== 'orders') && (
            <button 
              type="button"
              className="admin-btn-reset-filters"
              onClick={() => {
                setStatusFilter('new');
                setSearchQuery('');
                setTypeFilter('orders');
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
                <th style={{ width: '130px' }}>Date & Source</th>
                <th style={{ width: '150px' }}>Order ID</th>
                <th>Recipient & Destination</th>
                <th>Ordered Items</th>
                <th style={{ width: '150px' }}>Carrier & Tracking</th>
                <th style={{ width: '140px', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => {
                const parsedAddr = getParsedAddress(inquiry.message);
                const addressText = inquiry.dropship_recipient_address 
                  ? `${inquiry.dropship_recipient_address}${inquiry.dropship_recipient_city ? `, ${inquiry.dropship_recipient_city}` : ''}${inquiry.dropship_recipient_state ? `, ${inquiry.dropship_recipient_state}` : ''}${inquiry.dropship_recipient_pincode ? ` - ${inquiry.dropship_recipient_pincode}` : ''}`
                  : parsedAddr;
                const currentStatus = (inquiry.status || 'new').toLowerCase();
                const isDropship = inquiry.isDropship;
                const itemsList = inquiry.items || [];
                const carrierTrackingUrl = getCarrierTrackingUrl(inquiry.tracking_carrier, inquiry.tracking_number);
                const whatsAppUrl = getBuyerWhatsAppUrl(inquiry);

                return (
                  <tr key={inquiry.id} className={`admin-order-row ${isDropship ? 'is-dropship-row' : ''}`}>
                    {/* Date & Source */}
                    <td>
                      <div className="admin-order-date-col">
                        <span className="admin-date-primary">
                          {new Date(inquiry.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className={`admin-source-badge ${isDropship ? 'badge-dropship' : 'badge-direct'}`}>
                          {isDropship ? 'Dropship' : 'Direct Order'}
                        </span>
                      </div>
                    </td>

                    {/* Order ID */}
                    <td>
                      <div className="admin-order-id-col">
                        <div className="admin-id-copy-row">
                          <code className="admin-order-code" title={inquiry.id}>
                            {inquiry.id.substring(0, 8)}
                          </code>
                          <button 
                            type="button" 
                            onClick={() => handleCopy(inquiry.id, inquiry.id)}
                            className="admin-btn-icon-subtle"
                            title="Copy full Order ID"
                          >
                            {copyFeedback[inquiry.id] ? <Check size={12} style={{ color: '#15803d' }} /> : <Copy size={12} />}
                          </button>
                          <a 
                            href={`/order-tracking/${inquiry.id}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="admin-btn-icon-subtle"
                            title="Open Buyer Live Tracking Page"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {inquiry.reseller_order_id && (
                          <span className="admin-reseller-ref">Ref: #{inquiry.reseller_order_id}</span>
                        )}
                      </div>
                    </td>

                    {/* Recipient & Destination */}
                    <td>
                      <div className="admin-recipient-col">
                        <div className="admin-recipient-name-row">
                          <strong className="admin-recipient-name">
                            {inquiry.dropship_recipient_name || inquiry.buyer_name || 'Customer'}
                          </strong>
                          {(inquiry.dropship_recipient_phone || inquiry.phone) && (
                            <span className="admin-recipient-phone">
                              · {inquiry.dropship_recipient_phone || inquiry.phone}
                            </span>
                          )}
                          {whatsAppUrl && (
                            <a 
                              href={whatsAppUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="admin-wa-icon-link"
                              title="Send order update on WhatsApp"
                            >
                              <MessageCircle size={12} />
                            </a>
                          )}
                        </div>
                        <div className="admin-destination-text" title={addressText}>
                          <MapPin size={12} className="admin-pin-icon" />
                          <span>{addressText || 'Address in order records'}</span>
                        </div>
                        {isDropship && (
                          <div className="admin-sender-subtext">
                            From: <strong>{inquiry.dropship_sender_name || inquiry.business_name || 'Reseller Store'}</strong>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ordered Items Summary */}
                    <td>
                      <div className="admin-items-summary-wrap">
                        {itemsList.slice(0, 3).map((it, idx) => {
                          const resolved = resolveItemDetails(it);
                          return (
                            <a 
                              key={idx} 
                              href={resolved.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-item-thumb-row" 
                              title={`View ${resolved.title} (${resolved.color}) on Storefront ↗`}
                            >
                              <img 
                                src={resolved.image} 
                                alt={resolved.title} 
                                className="admin-item-thumb"
                                onError={(e) => { e.target.src = fallbackProductImage; }}
                              />
                              <div className="admin-item-meta">
                                <span className="admin-item-sku-label">{resolved.sku}</span>
                                <span className="admin-item-color-label">{resolved.color}</span>
                              </div>
                              <span className="admin-item-qty-badge">x{resolved.quantity}</span>
                            </a>
                          );
                        })}
                        {itemsList.length > 3 && (
                          <span className="admin-items-more-badge">+{itemsList.length - 3} more</span>
                        )}
                        {itemsList.length === 0 && (
                          <span className="admin-text-muted-subtle">{inquiry.variant_code || 'Standard Product'}</span>
                        )}
                      </div>
                    </td>

                    {/* Logistics Carrier & Tracking */}
                    <td>
                      {inquiry.tracking_carrier ? (
                        <div className="admin-carrier-col">
                          <strong className="admin-carrier-title">{inquiry.tracking_carrier}</strong>
                          <div className="admin-awb-row">
                            <span className="admin-carrier-awb" title={inquiry.tracking_number}>
                              AWB: {inquiry.tracking_number || 'Pending'}
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
                                <ArrowUpRight size={12} />
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
                      <span className={`admin-status-pill pill-${currentStatus}`}>
                        <span className="admin-status-dot" />
                        {currentStatus === 'new' ? 'New / Review' :
                         currentStatus === 'verified' ? 'Verified' :
                         currentStatus === 'processing' ? 'Processing' :
                         currentStatus === 'dispatched' ? 'Dispatched' :
                         currentStatus === 'delivered' ? 'Delivered' :
                         currentStatus === 'cancelled' ? 'Cancelled' : currentStatus}
                      </span>
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
                          <Edit3 size={14} /> <span>Update</span>
                        </button>
                        {isDropship && (
                          <button
                            type="button"
                            onClick={() => handlePrintBlindLabel(inquiry)}
                            className="admin-btn-action-slip"
                            title="Print Blind Dispatch Slip"
                          >
                            <Printer size={14} /> <span>Slip</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditor(inquiry, 'details')}
                          className="admin-btn-action-ghost"
                          title="View Full Order Details"
                        >
                          <Eye size={15} />
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
                        <Layers size={18} /> Order Details #{selectedInquiry.id.substring(0, 8)}
                      </>
                    ) : (
                      <>
                        <Truck size={18} /> Update Fulfillment #{selectedInquiry.id.substring(0, 8)}
                      </>
                    )}
                  </h3>
                  <span className={`admin-status-pill pill-${(selectedInquiry.status || 'new').toLowerCase()}`}>
                    <span className="admin-status-dot" />
                    {selectedInquiry.status || 'new'}
                  </span>
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
                  <span><strong>{(selectedInquiry.items || []).length || 1} Item(s)</strong> {selectedInquiry.total_amount ? `• ₹${Number(selectedInquiry.total_amount).toLocaleString('en-IN')}` : ''}</span>
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
                        { id: 'new', label: 'Processing Payment', sub: 'Needs attention / proof review', color: '#b45309' },
                        { id: 'verified', label: 'Quality Check & Packing', sub: 'Payment verified, in Varanasi QC', color: '#4338ca' },
                        { id: 'dispatched', label: 'Dispatched', sub: 'Shipped with courier AWB', color: '#0369a1' },
                        { id: 'delivered', label: 'Delivered', sub: 'Package handed to buyer', color: '#15803d' },
                        { id: 'cancelled', label: 'Cancelled', sub: 'Order voided or returned', color: '#be123c' },
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          className={`admin-status-card-opt ${formStatus === st.id ? 'selected' : ''}`}
                          onClick={() => setFormStatus(st.id)}
                        >
                          <div className="admin-status-card-top">
                            <span className="admin-status-dot-sm" style={{ background: st.color }} />
                            <span className="admin-status-card-name">{st.label}</span>
                            {formStatus === st.id && <Check size={14} className="admin-status-check-icon" />}
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
              {activeModalTab === 'details' && (
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
                  <div className="admin-inspect-items-wrap">
                    <div className="admin-section-header">
                      <span className="admin-section-title">ORDERED ITEMS ({(selectedInquiry.items || []).length || 1})</span>
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
                        {(selectedInquiry.items || []).map((it, idx) => {
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
                        <tr className="admin-inspect-total-row">
                          <td colSpan="3" style={{ fontWeight: 700, color: '#0f172a' }}>
                            Total Items: {(selectedInquiry.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)} unit(s)
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>
                            {(selectedInquiry.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                            {formatMoney(
                              (selectedInquiry.items || []).reduce((acc, it) => {
                                const resolved = resolveItemDetails(it);
                                return acc + (resolved.price * resolved.quantity);
                              }, 0) || selectedInquiry.total_amount || 0
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

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
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
