import { useState, useMemo } from 'react';
import { 
  Truck, 
  Search, 
  Edit3, 
  X, 
  ExternalLink, 
  MessageSquareText, 
  Copy,
  Check
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
    }

    if (statusFilter !== 'all') {
      result = result.filter(i => (i.status || 'new').toLowerCase() === statusFilter.toLowerCase());
    }

    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(i => 
        (i.id && i.id.toLowerCase().includes(q)) ||
        (i.buyer_name && i.buyer_name.toLowerCase().includes(q)) ||
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
                <th>Buyer & Address</th>
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

                return (
                  <tr key={inquiry.id}>
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
                    </td>

                    {/* Buyer */}
                    <td>
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
                      <button
                        type="button"
                        onClick={() => handleEditClick(inquiry)}
                        className="admin-btn-edit-tracking"
                      >
                        <Edit3 size={13} /> Edit Tracking
                      </button>
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
