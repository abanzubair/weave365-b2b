import { useState, useMemo } from 'react';
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
  Clock,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';

export default function EnquiresManager({
  adminData,
  loadAdminData,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [localMessage, setLocalMessage] = useState(null);

  // Retrieve the inquiries data from adminData.optional
  const inquiresData = useMemo(() => {
    return adminData.optional?.inquiries || [];
  }, [adminData]);

  // Clean / search matching logic
  const query = searchQuery.toLowerCase().trim();
  const filtered = useMemo(() => {
    return inquiresData.filter((row) => {
      const matchesStatus = statusFilter === 'all' || (row.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesSearch = !query ||
        (row.buyer_name || row.name || '').toLowerCase().includes(query) ||
        (row.business_name || row.company || '').toLowerCase().includes(query) ||
        (row.email || '').toLowerCase().includes(query) ||
        (row.phone || '').includes(query) ||
        (row.message || row.notes || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [inquiresData, statusFilter, query]);

  // Status updates
  async function updateStatus(id, newStatus) {
    setActionLoading(id);
    setLocalMessage(null);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setLocalMessage({ type: 'success', text: `Enquiry status updated to "${newStatus}"` });
      await loadAdminData();
    } catch (err) {
      console.error('[EnquiresManager] Update status error:', err);
      setLocalMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(null);
    }
  }

  // Delete enquiry
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      return;
    }
    setActionLoading(id);
    setLocalMessage(null);
    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLocalMessage({ type: 'success', text: 'Enquiry deleted successfully.' });
      await loadAdminData();
    } catch (err) {
      console.error('[EnquiresManager] Delete error:', err);
      setLocalMessage({ type: 'error', text: err.message || 'Failed to delete enquiry.' });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="admin-early-access-tab">
      <div className="admin-ea-header">
        <div className="admin-ea-header-left">
          <Inbox size={22} className="admin-ea-header-icon" />
          <div>
            <h2 className="admin-ea-title">B2B Enquiries Manager (Table: inquiries)</h2>
            <p className="admin-ea-subtitle">
              {inquiresData.length} total &bull; {inquiresData.filter((r) => r.status === 'new').length} new enquiries
            </p>
          </div>
        </div>
        <button
          type="button"
          className="admin-ea-refresh-btn"
          onClick={() => loadAdminData()}
          disabled={adminData.loading}
        >
          <RefreshCw size={16} className={adminData.loading ? 'spin' : ''} />
          {adminData.loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="admin-ea-filters">
        <div className="admin-ea-search-wrap">
          <Search size={15} className="admin-ea-search-icon" />
          <input
            type="search"
            className="admin-ea-search-input"
            placeholder="Search by name, company, email, WhatsApp…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="admin-ea-status-filter">
          {['all', 'new', 'pending', 'contacted', 'completed'].map((s) => (
            <button
              key={s}
              type="button"
              className={`admin-ea-filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {localMessage && (
        <div className={`admin-ea-error ${localMessage.type === 'success' ? 'admin-ea-success-banner' : ''}`} style={{
          backgroundColor: localMessage.type === 'success' ? '#e6f4ea' : '#fce8e6',
          color: localMessage.type === 'success' ? '#137333' : '#c5221f',
          borderColor: localMessage.type === 'success' ? '#ceead6' : '#fad2cf',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid',
          fontSize: '0.875rem'
        }}>
          {localMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {adminData.errors?.inquiries && (
        <div className="admin-ea-error">
          <AlertTriangle size={16} />
          <span>Error loading from table 'inquiries': {adminData.errors.inquiries}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="admin-ea-empty">
          <Inbox size={40} opacity={0.25} />
          <p>No enquiries found matching filters.</p>
        </div>
      ) : (
        <div className="admin-ea-submissions-list">
          {filtered.map((item) => {
            const buyerName = item.buyer_name || item.name || 'Unknown Buyer';
            const businessName = item.business_name || item.company || 'Individual / Direct';
            const email = item.email || '';
            const phone = item.phone || item.whatsapp || '';
            const msg = item.message || item.notes || 'No message provided.';
            const status = (item.status || 'new').toLowerCase();
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown Date';

            return (
              <div key={item.id} className="admin-ea-card">
                <div className="admin-ea-card-main">
                  <div className="admin-ea-card-row">
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#1a1715', fontWeight: '600' }}>{buyerName}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5f6368', fontSize: '0.85rem', marginTop: '4px' }}>
                        <Building size={13} />
                        <span>{businessName}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`admin-review-status-badge status-badge-${status}`} style={{
                        textTransform: 'uppercase',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        {status}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#80868b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
                        <Calendar size={12} />
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ margin: '12px 0 8px 0', padding: '10px 14px', backgroundColor: '#f8f9fa', borderRadius: '6px', borderLeft: '3px solid #c69e6a', fontSize: '0.875rem', color: '#3c4043' }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg}</p>
                    {item.pincode && (
                      <div style={{ fontSize: '0.75rem', color: '#80868b', marginTop: '6px' }}>
                        <strong>Pincode:</strong> {item.pincode}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: '#5f6368', marginTop: '8px' }}>
                    {phone && (
                      <a href={`tel:${phone}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1a73e8', textDecoration: 'none' }}>
                        <Phone size={13} />
                        <span>{phone}</span>
                      </a>
                    )}
                    {email && (
                      <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1a73e8', textDecoration: 'none' }}>
                        <Mail size={13} />
                        <span>{email}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="admin-ea-card-actions" style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid #f1f3f4',
                  paddingTop: '12px',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#80868b' }}>Set Status:</span>
                    <select
                      value={status}
                      disabled={actionLoading === item.id}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #dadce0',
                        fontSize: '0.85rem',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="new">New</option>
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    title="Delete Enquiry"
                    disabled={actionLoading === item.id}
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#d93025',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
