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
  Printer
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

async function updateSupabaseOrderTracking(id, { status, trackingCarrier, trackingNumber, trackingMessage, sourceTable }) {
  const table = sourceTable === 'orders' ? 'orders' : 'inquiries';
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

export function AdminTrackingPanel({ inquiries = [], loadAdminData }) {
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('orders');
  const [actionLoading, setActionLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState({});

  // Form State for editing order tracking
  const [formStatus, setFormStatus] = useState('verified');
  const [formCarrier, setFormCarrier] = useState('');
  const [formTrackingNum, setFormTrackingNum] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // Open editor panel with selected order details
  const handleEditClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setFormStatus(inquiry.status || 'verified');
    setFormCarrier(inquiry.tracking_carrier || 'Delhivery');
    setFormTrackingNum(inquiry.tracking_number || '');
    setFormMessage(inquiry.tracking_message || '');
    
    // Smooth scroll to top editor panel
    setTimeout(() => {
      const editorEl = document.getElementById('admin-tracking-editor');
      if (editorEl) {
        editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const handlePrintBlindLabel = (inquiry) => {
    if (typeof window === 'undefined') return;
    const senderName = inquiry.dropship_sender_name || inquiry.business_name || inquiry.buyer_name || 'Reseller Store';
    const senderPhone = inquiry.dropship_sender_phone || inquiry.phone || 'N/A';
    const senderAddrText = inquiry.dropship_sender_address ? `${inquiry.dropship_sender_address}, ${inquiry.dropship_sender_city || ''}, ${inquiry.dropship_sender_state || ''} - ${inquiry.dropship_sender_pincode || ''}` : '';
    const recipientName = inquiry.dropship_recipient_name || inquiry.buyer_name || 'Customer';
    const recipientPhone = inquiry.dropship_recipient_phone || inquiry.phone || 'N/A';
    const recipientAddress = inquiry.dropship_recipient_address || getParsedAddress(inquiry.message) || 'N/A';
    const cityStatePin = `${inquiry.dropship_recipient_city || ''} ${inquiry.dropship_recipient_state || ''} ${inquiry.dropship_recipient_pincode || inquiry.pincode || ''}`.trim();
    const packingPref = inquiry.dropship_packing_preference || 'Blind Packaging (Zero Supplier Branding / No Prices)';

    const itemsHtml = (inquiry.items || []).map(it => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${it.variant_code || 'N/A'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${it.product_title || 'Banarasi Textile'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${it.color || 'Standard'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity || 1} pc</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Blind Shipping Label - Order ${inquiry.id.substring(0, 8)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; background: #fff; }
          .label-box { border: 2px solid #0f172a; padding: 24px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
          .label-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #0f172a; padding-bottom: 16px; margin-bottom: 20px; }
          .badge { background: #d97706; color: #fff; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase; }
          .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .addr-card { border: 1px solid #cbd5e1; padding: 14px; border-radius: 6px; background: #f8fafc; }
          .addr-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 6px; }
          .addr-name { font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 4px; }
          .addr-text { font-size: 13px; line-height: 1.4; color: #334155; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
          .items-table th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569; }
          .footer-note { margin-top: 20px; font-size: 11px; color: #92400e; background: #fef3c7; border: 1px solid #fde68a; padding: 8px; border-radius: 4px; text-align: center; font-weight: bold; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="label-box">
          <div class="label-header">
            <div>
              <span class="badge">BLIND DROPSHIP DISPATCH LABEL</span>
              <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Order ID: <strong>${inquiry.id}</strong></div>
            </div>
            <button onclick="window.print()" style="padding: 8px 16px; background: #0f172a; color: #fff; border: 0; border-radius: 4px; cursor: pointer; font-weight: bold;">🖨️ Print Label</button>
          </div>

          <div class="address-grid">
            <div class="addr-card">
              <div class="addr-title">SHIP FROM (SENDER LABEL)</div>
              <div class="addr-name">${senderName}</div>
              <div class="addr-text">Contact: ${senderPhone}</div>
              ${senderAddrText ? `<div class="addr-text" style="margin-top: 4px;">${senderAddrText}</div>` : ''}
            </div>
            <div class="addr-card" style="background: #fffdf5; border-color: #fde68a;">
              <div class="addr-title" style="color: #b45309;">SHIP TO (RECIPIENT)</div>
              <div class="addr-name">${recipientName}</div>
              <div class="addr-text">Phone: ${recipientPhone}</div>
              <div class="addr-text">${recipientAddress}</div>
              <div class="addr-text" style="font-weight: bold; margin-top: 4px;">${cityStatePin}</div>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; font-size: 12px; color: #334155; margin-bottom: 16px;">
            <strong>PACKAGING PREFERENCE:</strong> ${packingPref}
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Item Title</th>
                <th>Color</th>
                <th style="text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="footer-note">
            ⚠️ WAREHOUSE INSTRUCTION: BLIND FULFILLMENT. DO NOT INCLUDE SUPPLIER PRICING LEAFLETS OR WEAVE365 BRANDING.
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

  // Helper template fillers for quick messages
  const applyTemplate = (type) => {
    if (type === 'verified') {
      setFormMessage('Payment verified! Your order is currently being inspected by our quality control team in Varanasi before dispatch.');
      setFormStatus('verified');
    } else if (type === 'dispatched') {
      setFormMessage(`Handed over to ${formCarrier || 'courier partner'}. Your package is in transit to your destination address.`);
      setFormStatus('dispatched');
    } else if (type === 'delivered') {
      setFormMessage('Shipment successfully delivered! Thank you for partnering with Weave 365.');
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

      alert('Order tracking details updated successfully!');
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

  // Parse delivery address from messages for summary display
  const getParsedAddress = (msg) => {
    if (!msg) return '';
    const addressBlockMatch = msg.split('Delivery Address:');
    if (addressBlockMatch.length < 2) return '';
    return addressBlockMatch[1].trim();
  };

  // Filter and search inquiries list
  const filteredInquiries = useMemo(() => {
    let result = [...inquiries];

    if (typeFilter === 'orders') {
      result = result.filter(i => 
        i._sourceTable === 'orders' || 
        i.inquiry_type === 'cart_payment' || 
        i.inquiry_type === 'cart_payment_fallback'
      );
    } else if (typeFilter === 'dropship') {
      result = result.filter(i => i.is_dropship);
    }

    if (statusFilter !== 'all') {
      result = result.filter(i => (i.status || 'new').toLowerCase() === statusFilter.toLowerCase());
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(i => 
        (i.id && i.id.toLowerCase().includes(q)) ||
        (i.buyer_name && i.buyer_name.toLowerCase().includes(q)) ||
        (i.dropship_sender_name && i.dropship_sender_name.toLowerCase().includes(q)) ||
        (i.dropship_recipient_name && i.dropship_recipient_name.toLowerCase().includes(q)) ||
        (i.phone && i.phone.toLowerCase().includes(q)) ||
        (i.email && i.email.toLowerCase().includes(q)) ||
        (i.tracking_number && i.tracking_number.toLowerCase().includes(q))
      );
    }

    return result;
  }, [inquiries, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="admin-tracking-tab">
      
      {/* Editor Panel (Conditionally Visible at top when editing) */}
      {selectedInquiry && (
        <article id="admin-tracking-editor" className="admin-panel admin-tracking-editor-card">
          <div className="admin-panel-head admin-panel-head-flex">
            <div>
              <span className="admin-editor-title"><Truck size={18} /> Edit Order Tracking</span>
              <small>Updating Inquiry ID: <code>{selectedInquiry.id}</code></small>
            </div>
            <button 
              type="button" 
              className="admin-btn-cancel"
              onClick={() => setSelectedInquiry(null)}
            >
              <X size={14} /> Cancel
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="admin-editor-form">
            <div className="admin-grid-3col">
              
              {/* Order Status */}
              <div className="admin-field-container">
                <label className="admin-field-label">Fulfillment Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="admin-field-input"
                >
                  <option value="new">New (Payment Review)</option>
                  <option value="verified">Payment Verified</option>
                  <option value="processing">Processing & QC</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Shipping Carrier */}
              <div className="admin-field-container">
                <label className="admin-field-label">Logistics Carrier</label>
                <input
                  type="text"
                  placeholder="e.g. Delhivery, DHL, BlueDart"
                  value={formCarrier}
                  onChange={(e) => setFormCarrier(e.target.value)}
                  className="admin-field-input"
                />
              </div>

              {/* Tracking ID */}
              <div className="admin-field-container">
                <label className="admin-field-label">Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. AWB128930129"
                  value={formTrackingNum}
                  onChange={(e) => setFormTrackingNum(e.target.value)}
                  className="admin-field-input"
                />
              </div>
            </div>

            {/* Custom Message */}
            <div className="admin-field-container">
              <div className="admin-flex-between">
                <label className="admin-field-label">
                  <MessageSquareText size={14} className="admin-inline-icon" /> Custom Tracking Message
                </label>
                <div className="admin-flex-gap8">
                  <button type="button" onClick={() => applyTemplate('verified')} className="admin-template-pill">Template: Verified</button>
                  <button type="button" onClick={() => applyTemplate('dispatched')} className="admin-template-pill">Template: Dispatched</button>
                  <button type="button" onClick={() => applyTemplate('delivered')} className="admin-template-pill">Template: Delivered</button>
                </div>
              </div>
              <textarea
                placeholder="Add a custom tracking message visible to the buyer on their tracking page."
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows="3"
                className="admin-field-textarea"
              />
            </div>

            {/* Submit Action */}
            <div className="admin-form-actions">
              <button 
                type="submit" 
                className="admin-btn-publish" 
                disabled={actionLoading}
              >
                {actionLoading ? 'Saving changes...' : 'Save Tracking Details'}
              </button>
            </div>
          </form>
        </article>
      )}

      {/* Main List and Controls */}
      <article className="admin-panel admin-m0">
        <div className="admin-panel-head admin-panel-head-flex">
          <div className="admin-tracking-header-box">
            <h2 className="admin-tracking-main-title"><Truck size={19} /> Manage Shipping & Tracking</h2>
            <span className="admin-tracking-sub-title">{filteredInquiries.length} inquiries match filters</span>
          </div>
          <div className="admin-controls-group">
            {/* Type selector */}
            <div className="admin-control-item">
              <span className="admin-control-label">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="admin-select-input"
              >
                <option value="orders">Orders (UPI Checkout)</option>
                <option value="dropship">Dropship Orders Only</option>
                <option value="all">All Inquiries (incl. Product/Cart)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="admin-control-item">
              <span className="admin-control-label">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select-input"
              >
                <option value="all">All Statuses</option>
                <option value="new">New / Under Review</option>
                <option value="verified">Verified</option>
                <option value="processing">Processing</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="admin-control-item">
              <div className="admin-search-wrapper" style={{ minWidth: '180px', maxWidth: '220px' }}>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                <span className="admin-search-icon">🔍</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="admin-search-clear-btn"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Inquiry/Order ID</th>
                <th>Buyer & Delivery Details</th>
                <th>Items Summary</th>
                <th>Tracking Info</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => {
                const addressText = getParsedAddress(inquiry.message);
                const currentStatus = inquiry.status || 'new';
                const isDropship = Boolean(inquiry.is_dropship);

                return (
                  <tr key={inquiry.id} style={isDropship ? { background: '#fffdf5' } : {}}>
                    {/* Date */}
                    <td className="admin-fs12">
                      {new Date(inquiry.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* ID */}
                    <td>
                      <div className="admin-flex-align-center-gap6">
                        <code className="admin-fs12 admin-text-muted">
                          {inquiry.id.substring(0, 8)}...
                        </code>
                        <button 
                          type="button" 
                          onClick={() => handleCopy(inquiry.id, inquiry.id)}
                          className="admin-icon-btn-ghost"
                          title="Copy Full ID"
                        >
                          {copyFeedback[inquiry.id] ? <Check size={12} className="admin-text-green" /> : <Copy size={12} />}
                        </button>
                        <a 
                          href={`/order-tracking/${inquiry.id}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="admin-icon-btn-ghost"
                          title="View Tracking Page"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      {isDropship && (
                        <span className="dropship-badge" style={{ marginTop: '4px', fontSize: '10px' }}>
                          Dropship
                        </span>
                      )}
                    </td>

                    {/* Buyer & Delivery Details */}
                    <td>
                      {isDropship ? (
                        <div>
                          <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, display: 'block' }}>
                            Sender Label: {inquiry.dropship_sender_name || 'Reseller'} ({inquiry.dropship_sender_phone || 'N/A'})
                          </span>
                          <strong style={{ fontSize: '13px', display: 'block', marginTop: '2px' }}>
                            Recipient: {inquiry.dropship_recipient_name || inquiry.buyer_name} ({inquiry.dropship_recipient_phone || inquiry.phone || 'N/A'})
                          </strong>
                          <span className="admin-address-trunc" title={inquiry.dropship_recipient_address || addressText}>
                            Address: {inquiry.dropship_recipient_address || addressText}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <strong>{inquiry.buyer_name || 'Guest'}</strong>
                          {inquiry.phone && (
                            <span className="admin-phone-label">
                              Phone: {inquiry.phone}
                            </span>
                          )}
                          {addressText && (
                            <span 
                              className="admin-address-trunc"
                              title={addressText}
                            >
                              Address: {addressText}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Items */}
                    <td>
                      <div className="admin-items-list">
                        {(inquiry.items || []).map((item, idx) => (
                          <div key={idx} className="admin-item-pill">
                            <code className="admin-item-code">{item.variant_code}</code>
                            {item.color && <span className="admin-item-color">{item.color}</span>}
                            <span className="admin-item-qty">x{item.quantity || 1}</span>
                          </div>
                        ))}
                        {(!inquiry.items || inquiry.items.length === 0) && (
                          <div className="admin-item-pill">
                            <code className="admin-item-code">{inquiry.variant_code || 'N/A'}</code>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Carrier Info */}
                    <td>
                      {inquiry.tracking_carrier ? (
                        <div className="admin-fs12">
                          <strong className="admin-display-block">{inquiry.tracking_carrier}</strong>
                          <span className="admin-text-muted admin-fs11">ID: {inquiry.tracking_number || 'TBD'}</span>
                        </div>
                      ) : (
                        <span className="admin-text-muted-italic admin-fs11">No details set</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`admin-badge-status status-${currentStatus.toLowerCase()}`}>
                        {currentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(inquiry)}
                          className="admin-btn-edit-tracking"
                        >
                          <Edit3 size={13} /> Edit Tracking
                        </button>
                        {isDropship && (
                          <button
                            type="button"
                            onClick={() => handlePrintBlindLabel(inquiry)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Printer size={12} /> Print Shipping Slip
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-table-empty-cell">
                    No checkouts or orders found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
