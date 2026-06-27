import { useState } from 'react';
import {
  Inbox,
  RefreshCw,
  Search,
  AlertTriangle,
  Phone,
  Check,
  ExternalLink,
} from 'lucide-react';

export default function EarlyAccessManager({
  earlyAccessSubmissions,
  earlyAccessLoading,
  earlyAccessError,
  loadEarlyAccessSubmissions,
  handleEarlyAccessStatusChange,
  earlyAccessActionLoading,
}) {
  const [earlyAccessSearch, setEarlyAccessSearch] = useState('');
  const [earlyAccessStatusFilter, setEarlyAccessStatusFilter] = useState('all');

  const query = earlyAccessSearch.toLowerCase().trim();
  const filtered = earlyAccessSubmissions.filter(s => {
    const matchesStatus = earlyAccessStatusFilter === 'all' || s.status === earlyAccessStatusFilter;
    const matchesSearch = !query ||
      (s.full_name || '').toLowerCase().includes(query) ||
      (s.whatsapp_number || '').includes(query) ||
      (s.city || '').toLowerCase().includes(query) ||
      (s.buyer_type || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-early-access-tab">
      <div className="admin-ea-header">
        <div className="admin-ea-header-left">
          <Inbox size={22} className="admin-ea-header-icon" />
          <div>
            <h2 className="admin-ea-title">Early Access Requests</h2>
            <p className="admin-ea-subtitle">
              {earlyAccessSubmissions.length} total &bull; {earlyAccessSubmissions.filter(s => s.status === 'pending_review').length} pending review
            </p>
          </div>
        </div>
        <button
          type="button"
          className="admin-ea-refresh-btn"
          onClick={() => loadEarlyAccessSubmissions()}
          disabled={earlyAccessLoading}
        >
          <RefreshCw size={16} className={earlyAccessLoading ? 'spin' : ''} />
          {earlyAccessLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="admin-ea-filters">
        <div className="admin-ea-search-wrap">
          <Search size={15} className="admin-ea-search-icon" />
          <input
            type="search"
            className="admin-ea-search-input"
            placeholder="Search by name, WhatsApp, city…"
            value={earlyAccessSearch}
            onChange={e => setEarlyAccessSearch(e.target.value)}
          />
        </div>
        <div className="admin-ea-status-filter">
          {['all', 'pending_review', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              type="button"
              className={`admin-ea-filter-btn ${earlyAccessStatusFilter === s ? 'active' : ''}`}
              onClick={() => setEarlyAccessStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s === 'pending_review' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {earlyAccessError && (
        <div className="admin-ea-error">
          <AlertTriangle size={16} />
          {earlyAccessError}
        </div>
      )}

      {earlyAccessLoading ? (
        <div className="admin-ea-loading">
          <RefreshCw size={28} className="spin" />
          <span>Loading submissions…</span>
        </div>
      ) : (() => {
        if (filtered.length === 0) {
          return (
            <div className="admin-ea-empty">
              <Inbox size={40} opacity={0.25} />
              <p>No submissions match your filter.</p>
            </div>
          );
        }

        return (
          <div className="admin-table-wrap-scroller">
            <table className="admin-table admin-ea-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>WhatsApp</th>
                  <th>Buyer Type</th>
                  <th>Budget / Month</th>
                  <th>Preference</th>
                  <th>City &amp; Pincode</th>
                  <th>Store Link</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => {
                  const isActioning = earlyAccessActionLoading === sub.id;
                  const dateStr = sub.submitted_at
                    ? new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
                    : '—';
                  const statusClass =
                    sub.status === 'approved' ? 'ea-status-approved' :
                    sub.status === 'rejected' ? 'ea-status-rejected' :
                    'ea-status-pending';
                  return (
                    <tr key={sub.id} className={`admin-ea-row ${isActioning ? 'admin-ea-row-loading' : ''}`}>
                      <td>
                        <span className="admin-ea-date">{dateStr}</span>
                      </td>
                      <td>
                        <strong className="admin-ea-name">{sub.full_name || '—'}</strong>
                      </td>
                      <td>
                        {sub.whatsapp_number ? (
                          <a
                            href={`https://wa.me/${sub.whatsapp_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-ea-whatsapp-link"
                          >
                            <Phone size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            {sub.whatsapp_number}
                          </a>
                        ) : '—'}
                      </td>
                      <td>{sub.buyer_type || '—'}</td>
                      <td>{sub.monthly_budget || '—'}</td>
                      <td>
                        <span className="admin-ea-pref">
                          {sub.buying_preference === 'Ready to buy (immediately)' ? '✅ Ready to buy' :
                           sub.buying_preference === 'Order basis (after confirmation)' ? '📋 Order basis' :
                           sub.buying_preference || '—'}
                        </span>
                      </td>
                      <td>
                        {sub.city && <span>{sub.city}</span>}
                        {sub.pincode && <span className="admin-ea-pincode"> — {sub.pincode}</span>}
                        {!sub.city && !sub.pincode && '—'}
                      </td>
                      <td>
                        {sub.store_link && sub.store_link !== 'None provided' ? (
                          <a
                            href={sub.store_link.startsWith('http') ? sub.store_link : `https://${sub.store_link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-ea-store-link"
                          >
                            <ExternalLink size={11} style={{ marginRight: '3px' }} /> View
                          </a>
                        ) : <span className="admin-ea-no-link">None</span>}
                      </td>
                      <td>
                        <span className={`admin-ea-status-badge ${statusClass}`}>
                          {sub.status === 'pending_review' ? 'Pending' :
                           sub.status === 'approved' ? 'Approved' :
                           sub.status === 'rejected' ? 'Rejected' :
                           sub.status || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-ea-actions">
                          {sub.status !== 'approved' && (
                            <button
                              type="button"
                              className="admin-ea-btn admin-ea-btn-approve"
                              disabled={isActioning}
                              onClick={() => handleEarlyAccessStatusChange(sub.id, 'approved')}
                            >
                              <Check size={12} /> Approve
                            </button>
                          )}
                          {sub.status !== 'rejected' && (
                            <button
                              type="button"
                              className="admin-ea-btn admin-ea-btn-reject"
                              disabled={isActioning}
                              onClick={() => handleEarlyAccessStatusChange(sub.id, 'rejected')}
                            >
                              Reject
                            </button>
                          )}
                          {(sub.status === 'approved' || sub.status === 'rejected') && (
                            <button
                              type="button"
                              className="admin-ea-btn admin-ea-btn-reset"
                              disabled={isActioning}
                              onClick={() => handleEarlyAccessStatusChange(sub.id, 'pending_review')}
                            >
                              Reset
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
        );
      })()}
    </div>
  );
}
