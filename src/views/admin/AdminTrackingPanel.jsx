/**
 * AdminTrackingPanel Component
 * Purpose: Provides a backend interface for store managers to update shipping details,
 * tracking numbers, carriers, statuses, and custom messages for buyer checkouts.
 */
import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Truck, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  X,
  MessageSquareText
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { formatMoney } from '../../storefrontShared.jsx';

export function AdminTrackingPanel({ inquiries = [], products = [], loadAdminData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('orders'); // 'orders' (cart_payment*) | 'all'
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for the editor
  const [formStatus, setFormStatus] = useState('new');
  const [formCarrier, setFormCarrier] = useState('');
  const [formTrackingNum, setFormTrackingNum] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // Handle clipboard copy
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Populate editor form
  const handleEditClick = (inquiry) => {
    setSelectedInquiry(inquiry);
    setFormStatus(inquiry.status || 'new');
    setFormCarrier(inquiry.tracking_carrier || '');
    setFormTrackingNum(inquiry.tracking_number || '');
    setFormMessage(inquiry.tracking_message || '');
    
    // Smooth scroll to editor
    setTimeout(() => {
      document.getElementById('admin-tracking-editor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Apply quick templates for the custom message
  const applyTemplate = (type) => {
    const carrierName = formCarrier || 'our logistics partner';
    const trackingNum = formTrackingNum || 'TBD';

    if (type === 'verified') {
      setFormMessage('Payment successfully verified. Your items are being hand-packed at our Varanasi dispatch hub and will undergo final quality checks.');
    } else if (type === 'dispatched') {
      setFormMessage(`Your order has been handed over to ${carrierName} under tracking number ${trackingNum}. It is expected to arrive within 3-5 business days.`);
    } else if (type === 'delivered') {
      setFormMessage('Order has been marked as delivered. We hope you appreciate the premium handloom craftsmanship of Weave365!');
    }
  };

  // Submit tracking updates to Supabase
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setActionLoading(true);
    try {
      if (!isSupabaseConfigured) {
        alert('Supabase client is not connected.');
        setActionLoading(false);
        return;
      }

      const sourceTable = selectedInquiry._sourceTable || 'inquiries';
      const { error } = await supabase
        .from(sourceTable)
        .update({
          status: formStatus,
          tracking_carrier: formCarrier.trim() || null,
          tracking_number: formTrackingNum.trim() || null,
          tracking_message: formMessage.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInquiry.id);

      if (error) throw error;

      alert('Order tracking details updated successfully.');
      setSelectedInquiry(null);
      
      // Reload admin data to refresh table
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

    // Filter by type: 'orders' displays payment checkouts (both new orders and older inquiry checkouts)
    if (typeFilter === 'orders') {
      result = result.filter(i => 
        i._sourceTable === 'orders' || 
        i.inquiry_type === 'cart_payment' || 
        i.inquiry_type === 'cart_payment_fallback'
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(i => (i.status || 'new').toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by search query
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Editor Panel (Conditionally Visible at top when editing) */}
      {selectedInquiry && (
        <article id="admin-tracking-editor" className="admin-panel" style={{ border: '2px solid var(--gold)' }}>
          <div className="admin-panel-head admin-panel-head-flex">
            <div>
              <span style={{ color: 'var(--gold-dark)' }}><Truck size={18} /> Edit Order Tracking</span>
              <br />
              <small>Updating Inquiry ID: <code>{selectedInquiry.id}</code></small>
            </div>
            <button 
              type="button" 
              className="admin-crm-btn" 
              onClick={() => setSelectedInquiry(null)}
              style={{ background: '#f3f4f6', color: '#374151', minWidth: 'auto', padding: '0.4rem 0.8rem' }}
            >
              <X size={14} /> Cancel
            </button>
          </div>

          <form onSubmit={handleFormSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              
              {/* Order Status */}
              <div>
                <label className="admin-control-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Fulfillment Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="admin-select-input"
                  style={{ width: '100%', padding: '0.6rem' }}
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
              <div>
                <label className="admin-control-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Logistics Carrier</label>
                <input
                  type="text"
                  placeholder="e.g. Delhivery, DHL, BlueDart"
                  value={formCarrier}
                  onChange={(e) => setFormCarrier(e.target.value)}
                  className="lookup-input"
                  style={{ width: '100%', padding: '0.6rem' }}
                />
              </div>

              {/* Tracking ID */}
              <div>
                <label className="admin-control-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. AWB128930129"
                  value={formTrackingNum}
                  onChange={(e) => setFormTrackingNum(e.target.value)}
                  className="lookup-input"
                  style={{ width: '100%', padding: '0.6rem' }}
                />
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="admin-control-label"><MessageSquareText size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Custom Tracking Message</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => applyTemplate('verified')} className="admin-crm-btn" style={{ fontSize: '11px', padding: '2px 8px', minWidth: 'auto' }}>Template: Verified</button>
                  <button type="button" onClick={() => applyTemplate('dispatched')} className="admin-crm-btn" style={{ fontSize: '11px', padding: '2px 8px', minWidth: 'auto' }}>Template: Dispatched</button>
                  <button type="button" onClick={() => applyTemplate('delivered')} className="admin-crm-btn" style={{ fontSize: '11px', padding: '2px 8px', minWidth: 'auto' }}>Template: Delivered</button>
                </div>
              </div>
              <textarea
                placeholder="Add a custom tracking message visible to the buyer on their tracking page."
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                className="lookup-input"
                style={{ width: '100%', minHeight: '80px', padding: '0.6rem', fontFamily: 'inherit' }}
              />
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className="btn-wholesale" 
                disabled={actionLoading}
                style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
              >
                {actionLoading ? 'Saving changes...' : 'Save Tracking details'}
              </button>
            </div>
          </form>
        </article>
      )}

      {/* Main List and Controls */}
      <article className="admin-panel">
        <div className="admin-panel-head admin-panel-head-flex">
          <div>
            <span><Truck size={18} /> Manage Shipping & Tracking</span>
            <br />
            <small>{filteredInquiries.length} inquiries match filters</small>
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
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="lookup-input"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: '180px' }}
              />
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr className="admin-table-sticky-tr">
                <th className="admin-table-sticky-th">Date</th>
                <th className="admin-table-sticky-th">Inquiry/Order ID</th>
                <th className="admin-table-sticky-th">Buyer & Address</th>
                <th className="admin-table-sticky-th">Items Summary</th>
                <th className="admin-table-sticky-th">Tracking Info</th>
                <th className="admin-table-sticky-th">Status</th>
                <th className="admin-table-sticky-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.map((inquiry) => {
                const addressText = getParsedAddress(inquiry.message);
                return (
                  <tr key={inquiry.id}>
                    {/* Date */}
                    <td style={{ fontSize: '12px' }}>
                      {new Date(inquiry.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* ID */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <code style={{ fontSize: '11px', color: '#6b7280' }}>
                          {inquiry.id.substring(0, 8)}...
                        </code>
                        <button 
                          type="button" 
                          onClick={() => handleCopy(inquiry.id, inquiry.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}
                          title="Copy Full ID"
                        >
                          {copyFeedback[inquiry.id] ? <Check size={12} style={{ color: 'green' }} /> : <Copy size={12} />}
                        </button>
                        <a 
                          href={`/order-tracking/${inquiry.id}`}
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: 'var(--gold-dark)' }}
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
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                          Phone: {inquiry.phone}
                        </span>
                      )}
                      {addressText && (
                        <span 
                          style={{ display: 'block', fontSize: '11px', color: '#666', marginTop: '0.25rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
                          <div key={idx} className="admin-item-row" style={{ fontSize: '11px' }}>
                            <code>{item.variant_code}</code>
                            <span>{item.color}</span>
                            <strong>x{item.quantity}</strong>
                          </div>
                        ))}
                        {(!inquiry.items || inquiry.items.length === 0) && (
                          <code style={{ fontSize: '11px' }}>{inquiry.variant_code || 'N/A'}</code>
                        )}
                      </div>
                    </td>

                    {/* Carrier Info */}
                    <td>
                      {inquiry.tracking_carrier ? (
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ display: 'block', fontWeight: 600 }}>{inquiry.tracking_carrier}</span>
                          <span style={{ display: 'block', color: 'var(--muted)', fontSize: '11px' }}>ID: {inquiry.tracking_number || 'TBD'}</span>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', fontSize: '11px', color: '#9ca3af' }}>No details set</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`admin-status ${inquiry.status || 'new'}`} style={{ textTransform: 'capitalize' }}>
                        {inquiry.status || 'new'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleEditClick(inquiry)}
                        className="admin-crm-btn btn-wholesale"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', minWidth: 'auto' }}
                      >
                        <Edit3 size={13} /> Edit Tracking
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-muted" style={{ textAlign: 'center', padding: '3rem' }}>
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
