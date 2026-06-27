import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Award,
  Check,
  ClipboardList,
  RefreshCw,
  Eye,
  Phone,
  Copy,
  FileText,
} from 'lucide-react';
import { PRICE_GROUPS } from '../../utils/buyerAccess.js';
import {
  handleViewAgreement,
} from './AdminShared.jsx';

export default function VendorApplications({
  adminData,
  partnerApps,
  setPartnerApps,
  loadPartnerApplications,
  localStatuses,
  setLocalStatuses,
  updatingWhatsapp,
  setUpdatingWhatsapp,
  updateDatabaseApplicationStatus,
  updateDatabaseDriveFolderUrl,
  updateBuyerPriceAccess,
  setLightboxImage,
  activeAgreement,
  setActiveAgreement,
}) {
  const [partnerSubTab, setPartnerSubTab] = useState('reviews');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerSortField, setPartnerSortField] = useState('date');
  const [partnerSortOrder, setPartnerSortOrder] = useState('desc');
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});

  // Reset sort key when switching sub-tabs to prevent invalid fields
  useEffect(() => {
    if (partnerSubTab === 'reviews' && partnerSortField === 'business') {
      setPartnerSortField('date');
    }
  }, [partnerSubTab, partnerSortField]);

  // Load active candidate's signed agreement on demand (Step 1 Review or Step 3 Onboarding)
  useEffect(() => {
    const candidate = selectedOnboarding || selectedReview;
    if (candidate) {
      const cleanWhatsapp = String(candidate.whatsapp_number || '').replace(/\D/g, '').slice(-10);
      void fetch(`/api/vendor-registration?whatsapp=${cleanWhatsapp}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.status === 'success' && resData.agreement) {
            setActiveAgreement(resData.agreement);
          } else {
            setActiveAgreement(null);
          }
        })
        .catch(() => setActiveAgreement(null));
    } else {
      setActiveAgreement(null);
    }
  }, [selectedOnboarding, selectedReview, setActiveAgreement]);

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [fieldName]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [fieldName]: false }));
    }, 2000);
  };

  const filteredReviews = useMemo(() => {
    const filtered = partnerApps.reviews.filter(rev => {
      if (!rev) return false;
      const query = partnerSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        String(rev.created_at || '').toLowerCase().includes(query) ||
        String(rev.full_name || '').toLowerCase().includes(query) ||
        String(rev.whatsapp_number || '').toLowerCase().includes(query) ||
        String(rev.city || '').toLowerCase().includes(query) ||
        String(rev.pincode || '').toLowerCase().includes(query) ||
        String(rev.categories || '').toLowerCase().includes(query) ||
        String(rev.price_range || '').toLowerCase().includes(query) ||
        String(rev.status || '').toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      let valA, valB;
      if (partnerSortField === 'name') {
        valA = String(a.full_name || '').toLowerCase();
        valB = String(b.full_name || '').toLowerCase();
      } else if (partnerSortField === 'city') {
        valA = String(a.city || '').toLowerCase();
        valB = String(b.city || '').toLowerCase();
      } else if (partnerSortField === 'status') {
        const wsA = String(a.whatsapp_number || '').replace(/\D/g, '').slice(-10);
        const wsB = String(b.whatsapp_number || '').replace(/\D/g, '').slice(-10);
        valA = String(localStatuses[wsA] || a.status || 'pending').toLowerCase();
        valB = String(localStatuses[wsB] || b.status || 'pending').toLowerCase();
      } else {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      }

      if (valA < valB) return partnerSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return partnerSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [partnerApps.reviews, partnerSearchQuery, partnerSortField, partnerSortOrder, localStatuses]);

  const filteredOnboardings = useMemo(() => {
    const filtered = partnerApps.onboardings.filter(onb => {
      if (!onb) return false;
      const query = partnerSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        String(onb.created_at || '').toLowerCase().includes(query) ||
        String(onb.full_name || '').toLowerCase().includes(query) ||
        String(onb.whatsapp_number || '').toLowerCase().includes(query) ||
        String(onb.email || '').toLowerCase().includes(query) ||
        String(onb.business_name || '').toLowerCase().includes(query) ||
        String(onb.business_type || '').toLowerCase().includes(query) ||
        String(onb.city || '').toLowerCase().includes(query) ||
        String(onb.gst_number || '').toLowerCase().includes(query) ||
        String(onb.pan_number || '').toLowerCase().includes(query) ||
        String(onb.fabric_specialisation || '').toLowerCase().includes(query) ||
        String(onb.bank_name || '').toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      let valA, valB;
      if (partnerSortField === 'name') {
        valA = String(a.full_name || '').toLowerCase();
        valB = String(b.full_name || '').toLowerCase();
      } else if (partnerSortField === 'business') {
        valA = String(a.business_name || '').toLowerCase();
        valB = String(b.business_name || '').toLowerCase();
      } else if (partnerSortField === 'city') {
        valA = String(a.city || '').toLowerCase();
        valB = String(b.city || '').toLowerCase();
      } else if (partnerSortField === 'status') {
        const wsA = String(a.whatsapp_number || '').replace(/\D/g, '').slice(-10);
        const wsB = String(b.whatsapp_number || '').replace(/\D/g, '').slice(-10);
        valA = String(localStatuses[wsA] || a.status || 'submitted').toLowerCase();
        valB = String(localStatuses[wsB] || b.status || 'submitted').toLowerCase();
      } else {
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      }

      if (valA < valB) return partnerSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return partnerSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [partnerApps.onboardings, partnerSearchQuery, partnerSortField, partnerSortOrder, localStatuses]);

  const handleExportCSV = () => {
    const isReviews = partnerSubTab === 'reviews';
    const data = isReviews ? filteredReviews : filteredOnboardings;
    if (!data || data.length === 0) {
      alert('No records available to export.');
      return;
    }

    let headers = [];
    let rows = [];

    if (isReviews) {
      headers = [
        'Date Submitted',
        'Applicant Name',
        'WhatsApp Number',
        'City',
        'Pincode',
        'Categories',
        'Price Range',
        'Status',
        'Sample Image 1',
        'Sample Image 2',
        'Sample Image 3',
        'Sample Image 4'
      ];
      rows = data.map(rev => {
        const ws = String(rev.whatsapp_number || '').replace(/\D/g, '').slice(-10);
        const st = localStatuses[ws] || rev.status || 'pending';
        return [
          rev.created_at || '',
          rev.full_name || '',
          rev.whatsapp_number || '',
          rev.city || '',
          rev.pincode || '',
          rev.categories || '',
          rev.price_range || '',
          st,
          rev.image1 || '',
          rev.image2 || '',
          rev.image3 || '',
          rev.image4 || ''
        ];
      });
    } else {
      headers = [
        'Date Submitted',
        'Proprietor Name',
        'Business Legal Name',
        'Business Role',
        'WhatsApp Number',
        'Alternate Contact',
        'Email Address',
        'GST Number',
        'PAN Number',
        'Business Address',
        'City',
        'Pincode',
        'Years in Business',
        'Fabric Specialisations',
        'Monthly Capacity',
        'Dispatch Timeline',
        'Preferred Courier',
        'Dispatch Address Same',
        'Dispatch Address Different',
        'Bank Account Holder',
        'Bank Name',
        'Bank Account Number',
        'Bank IFSC',
        'UPI ID',
        'ID Proof URL',
        'Cancelled Cheque URL',
        'Status'
      ];
      rows = data.map(onb => {
        const ws = String(onb.whatsapp_number || '').replace(/\D/g, '').slice(-10);
        const st = localStatuses[ws] || onb.status || 'submitted';
        return [
          onb.created_at || '',
          onb.full_name || '',
          onb.business_name || '',
          onb.business_type || '',
          onb.whatsapp_number || '',
          onb.alternate_contact || '',
          onb.email || '',
          onb.gst_number || '',
          onb.pan_number || '',
          onb.business_address || '',
          onb.city || '',
          onb.pincode || '',
          onb.years_in_business || '',
          onb.fabric_specialisation || '',
          onb.monthly_capacity || '',
          onb.dispatch_timeline || '',
          onb.preferred_courier || '',
          onb.dispatch_address_same || '',
          onb.dispatch_address_different || '',
          onb.bank_account_holder || '',
          onb.bank_name || '',
          onb.bank_account_number || '',
          onb.bank_ifsc || '',
          onb.upi_id || '',
          onb.id_proof_url || '',
          onb.cancelled_cheque_url || '',
          st
        ];
      });
    }

    const escapeCSV = (val) => {
      const str = String(val === null || val === undefined ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');

    try {
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `Weave365_B2B_Vendor_${isReviews ? 'Reviews' : 'Onboardings'}_${new Date().toISOString().split('T')[0]}.csv`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV file:', err);
      alert('Failed to generate export file. Check console logs for details.');
    }
  };

  return (
    <div className="admin-partners-tab">
      {/* Spinner Overlay */}
      {updatingWhatsapp && (
        <div className="admin-spinner-overlay">
          <RefreshCw size={42} className="spin" style={{ color: 'var(--primary)' }} />
          <span className="admin-spinner-text">Updating Database Status...</span>
        </div>
      )}

      {/* Header Dashboard Banner */}
      <div className="admin-partners-banner">
        <div className="admin-sync-content">
          <div className="admin-partners-banner-icon-wrap">
            <ClipboardList size={26} />
          </div>
          <div>
            <h2 className="admin-partners-banner-title">B2B Partner Applications Portal</h2>
            <p className="admin-partners-banner-desc">
              Verify signed merchant agreements and onboarding details for B2B supplier partners.
            </p>
          </div>
        </div>
        <div className="admin-flex-gap12">
          <button
            type="button"
            className="admin-btn-refresh-partners"
            onClick={loadPartnerApplications}
            disabled={partnerApps.loading}
          >
            <RefreshCw size={14} className={partnerApps.loading ? 'spin' : ''} />
            Refresh Applications
          </button>
        </div>
      </div>

      {/* Mini-Metrics Analytics Panel */}
      <div className="admin-partners-metrics-grid">
        <div className="admin-partner-metric-card">
          <div className="admin-partner-icon-orange">
            <Users size={20} />
          </div>
          <div className="admin-flex1">
            <span className="admin-partner-metric-label">Basic Partner Reviews</span>
            <div className="admin-partner-metric-values">
              <strong className="admin-partner-metric-value">{partnerApps.reviews.length}</strong>
              <span className="admin-partner-status-orange">
                {partnerApps.reviews.filter(r => {
                  const ws = r.whatsapp_number?.replace(/\D/g, '').slice(-10);
                  const st = localStatuses[ws] || r.status || 'pending';
                  return st.toLowerCase().includes('pend');
                }).length} Pending review
              </span>
            </div>
          </div>
        </div>

        <div className="admin-partner-metric-card">
          <div className="admin-partner-icon-blue">
            <Award size={20} />
          </div>
          <div className="admin-flex1">
            <span className="admin-partner-metric-label">Full Partner Onboardings</span>
            <div className="admin-partner-metric-values">
              <strong className="admin-partner-metric-value">{partnerApps.onboardings.length}</strong>
              <span className="admin-partner-status-blue">
                {partnerApps.onboardings.filter(o => {
                  const ws = o.whatsapp_number?.replace(/\D/g, '').slice(-10);
                  const st = localStatuses[ws] || o.status || 'submitted';
                  return st.toLowerCase().includes('pend') || st.toLowerCase().includes('submit');
                }).length} Pending approval
              </span>
            </div>
          </div>
        </div>

        <div className="admin-partner-metric-card">
          <div className="admin-partner-icon-green">
            <Check size={20} />
          </div>
          <div className="admin-flex1">
            <span className="admin-partner-metric-label">Supabase B2B Linked Rate</span>
            <div className="admin-partner-metric-values">
              <strong className="admin-partner-metric-value">
                {Math.round(
                  (partnerApps.onboardings.filter(o => adminData.profiles.some(p => p.whatsapp && p.whatsapp.replace(/\D/g, '').slice(-10) === o.whatsapp_number?.replace(/\D/g, '').slice(-10))).length /
                    Math.max(1, partnerApps.onboardings.length)) * 100
                )}%
              </strong>
              <span className="admin-partner-status-green">
                {partnerApps.onboardings.filter(o => adminData.profiles.some(p => p.whatsapp && p.whatsapp.replace(/\D/g, '').slice(-10) === o.whatsapp_number?.replace(/\D/g, '').slice(-10))).length} profiles synchronized
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtering and Search Strip */}
      <div className="admin-partners-filter-strip">
        <div className="admin-flex-gap8">
          <button
            type="button"
            onClick={() => setPartnerSubTab('reviews')}
            className={`admin-partner-subtab-btn ${partnerSubTab === 'reviews' ? 'active' : ''}`}
          >
            Basic Information ({filteredReviews.length})
          </button>
          <button
            type="button"
            onClick={() => setPartnerSubTab('onboardings')}
            className={`admin-partner-subtab-btn ${partnerSubTab === 'onboardings' ? 'active' : ''}`}
          >
            Full Onboarding Profiles ({filteredOnboardings.length})
          </button>
        </div>

        <div className="admin-flex-align-center-gap8">
          <span className="admin-partner-sort-label">Sort:</span>
          <select
            value={partnerSortField}
            onChange={(e) => setPartnerSortField(e.target.value)}
            className="admin-select-input"
          >
            <option value="date">Date Submitted</option>
            <option value="name">Proprietor Name</option>
            {partnerSubTab === 'onboardings' && (
              <option value="business">Business Name</option>
            )}
            <option value="city">City / Pincode</option>
            <option value="status">Application Status</option>
          </select>
          <button
            type="button"
            onClick={() => setPartnerSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="admin-btn-toggle"
          >
            {partnerSortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
          </button>
        </div>

        <div className="admin-flex-align-center-gap12">
          <button
            type="button"
            onClick={handleExportCSV}
            className="admin-btn-export-excel"
          >
            Export Excel 📥
          </button>

          <div className="admin-search-wrapper">
            <input
              type="text"
              placeholder="Search name, phone, city, fabric..."
              value={partnerSearchQuery}
              onChange={(e) => setPartnerSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            <span className="admin-search-icon">🔍</span>
            {partnerSearchQuery && (
              <button
                type="button"
                onClick={() => setPartnerSearchQuery('')}
                className="admin-search-clear-btn"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Applications Render */}
      {partnerApps.loading ? (
        <div className="admin-partners-loading">
          <RefreshCw size={42} className="spin" style={{ color: 'var(--primary)' }} />
          <span>Fetching live application records...</span>
        </div>
      ) : partnerApps.error ? (
        <div className="admin-partners-error">
          <strong>⚠️ Spreadsheet Proxy Connection Error:</strong>
          <p>{partnerApps.error}</p>
        </div>
      ) : partnerSubTab === 'reviews' ? (
        /* Basic Information Reviews */
        <article className="admin-panel admin-m0">
          <div className="admin-panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <span>Basic Partner Review Submissions</span>
            <small>{filteredReviews.length} records matching</small>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Applicant Name</th>
                  <th>WhatsApp Contact</th>
                  <th>Location</th>
                  <th>Categories</th>
                  <th>Price Range</th>
                  <th>Status</th>
                  <th>Inspect & Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((rev, idx) => {
                  const appWhatsapp = rev.whatsapp_number || '';
                  const cleanWhatsapp = appWhatsapp.replace(/\D/g, '').slice(-10);
                  const currentStatus = localStatuses[cleanWhatsapp] || rev.status || 'pending';

                  return (
                    <tr
                      key={rev.id || idx}
                      style={{
                        borderLeft: currentStatus.toLowerCase().includes('approv')
                          ? '3px solid #16a34a'
                          : currentStatus.toLowerCase().includes('reject')
                            ? '3px solid #dc2626'
                            : '3px solid #ea580c'
                      }}
                    >
                      <td className="admin-fs12">{rev.created_at ? rev.created_at.split('T')[0] : 'N/A'}</td>
                      <td><strong>{rev.full_name}</strong></td>
                      <td>
                        <div className="admin-flex-align-center-gap6">
                          <strong>{appWhatsapp}</strong>
                          <a
                            href={`https://wa.me/${appWhatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-wa-icon-link"
                          >
                            <Phone size={11} />
                          </a>
                        </div>
                      </td>
                      <td>{rev.city}{rev.pincode ? `, PIN ${rev.pincode}` : ''}</td>
                      <td>
                        <span className="admin-category-span">{rev.categories}</span>
                      </td>
                      <td className="admin-fs12">{rev.price_range}</td>
                      <td>
                        <span className={`admin-badge-status status-${currentStatus.toLowerCase().replace(/\s+/g, '')}`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn-inspect"
                          onClick={() => setSelectedReview(rev)}
                        >
                          <Eye size={12} /> Inspect Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredReviews.length === 0 && (
                  <tr>
                    <td colSpan="8" className="admin-table-empty-cell">
                      No applications found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      ) : (
        /* Full Onboarding Profiles */
        <article className="admin-panel admin-m0">
          <div className="admin-panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <span>Step 3 Full Onboarding Profiles</span>
            <small>{filteredOnboardings.length} records matching</small>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Business & Proprietor</th>
                  <th>Contact Details</th>
                  <th>GST / PAN</th>
                  <th>Fabric Specialisation</th>
                  <th>Verification Docs</th>
                  <th>Database Status</th>
                  <th>Supabase Match</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOnboardings.map((onb, idx) => {
                  const appWhatsapp = onb.whatsapp_number || '';
                  const cleanWhatsapp = appWhatsapp.replace(/\D/g, '').slice(-10);
                  const currentStatus = localStatuses[cleanWhatsapp] || onb.status || 'submitted';
                  const matchedProfile = adminData.profiles.find(p => p.whatsapp && p.whatsapp.replace(/\D/g, '').slice(-10) === cleanWhatsapp);

                  return (
                    <tr
                      key={onb.id || idx}
                      style={{
                        borderLeft: currentStatus.toLowerCase().includes('approv') || currentStatus.toLowerCase().includes('verify')
                          ? '3px solid #16a34a'
                          : currentStatus.toLowerCase().includes('reject') || currentStatus.toLowerCase().includes('flag')
                            ? '3px solid #dc2626'
                            : '3px solid #ea580c'
                      }}
                    >
                      <td className="admin-fs12">{onb.created_at ? onb.created_at.split('T')[0] : 'N/A'}</td>
                      <td>
                        <strong>{onb.business_name || 'Unnamed Business'}</strong>
                        <span className="admin-proprietor-label">Proprietor: {onb.full_name}</span>
                      </td>
                      <td>
                        <div className="admin-flex-align-center-gap6">
                          <span>{appWhatsapp}</span>
                          <a href={`https://wa.me/${appWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="admin-wa-icon-link">
                            <Phone size={11} />
                          </a>
                        </div>
                        <span className="admin-email-label">{onb.email}</span>
                      </td>
                      <td>
                        <span className="admin-display-block-fs12">GST: {onb.gst_number || 'N/A'}</span>
                        <span className="admin-pan-label">PAN: {onb.pan_number}</span>
                      </td>
                      <td><strong>{onb.fabric_specialisation}</strong></td>
                      <td>
                        <div className="admin-flex-wrap-gap8">
                          {onb.id_proof_url && (
                            <button type="button" className="admin-btn-doc-badge" onClick={() => setLightboxImage(onb.id_proof_url)}>Aadhaar</button>
                          )}
                          {onb.cancelled_cheque_url && (
                            <button type="button" className="admin-btn-doc-badge" onClick={() => setLightboxImage(onb.cancelled_cheque_url)}>Cheque</button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge-status status-${currentStatus.toLowerCase().replace(/\s+/g, '')}`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td>
                        {matchedProfile ? (
                          <span className="admin-status approved admin-status-linked">
                            ✓ Linked ({matchedProfile.approval_status})
                          </span>
                        ) : (
                          <span className="admin-status new admin-status-linked">
                            Unregistered
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn-inspect-onboarding"
                          onClick={() => setSelectedOnboarding(onb)}
                        >
                          <Eye size={12} /> Inspect Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredOnboardings.length === 0 && (
                  <tr>
                    <td colSpan="9" className="admin-table-empty-cell">
                      No onboarding applications found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Step 1 Inspect Modal */}
      {selectedReview && (() => {
        const rev = selectedReview;
        const appWhatsapp = rev.whatsapp_number || '';
        const cleanWhatsapp = appWhatsapp.replace(/\D/g, '').slice(-10);
        const currentStatus = localStatuses[cleanWhatsapp] || rev.status || 'pending';

        return (
          <div className="admin-modal-overlay">
            <div className="admin-review-modal">
              {/* Modal Header */}
              <div className="admin-modal-header">
                <div>
                  <span className="admin-modal-subtitle">B2B Partner Basic Assessment</span>
                  <h3 className="admin-modal-title">{rev.full_name}</h3>
                </div>
                <button type="button" onClick={() => setSelectedReview(null)} className="admin-modal-close-btn">×</button>
              </div>

              {/* Modal Body */}
              <div className="admin-modal-body">
                <div className="admin-modal-info-grid">
                  <div><strong>WhatsApp Contact</strong>: {appWhatsapp}</div>
                  <div><strong>City / Pincode</strong>: {rev.city} / {rev.pincode}</div>
                  <div><strong>Categories Supplied</strong>: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{rev.categories}</span></div>
                  <div><strong>Target Price Range</strong>: {rev.price_range}</div>
                  <div><strong>Submission Date</strong>: {rev.created_at ? rev.created_at.split('T')[0] : 'N/A'}</div>
                  <div>
                    <strong>Current Status</strong>:
                    <span className={`admin-status ${currentStatus.toLowerCase()} admin-ml6`}>
                      {currentStatus}
                    </span>
                    {activeAgreement && (
                      <div className="admin-agreement-modal-box">
                        <div className="admin-flex-align-center-gap12">
                          <div className="admin-agreement-icon-wrap">
                            <FileText size={20} />
                          </div>
                          <div>
                            <strong className="admin-agreement-title">Signed Merchant Agreement</strong>
                            <small className="admin-agreement-desc">Electronic copy generated at signature timestamp</small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="admin-btn-view-agreement"
                          onClick={() => handleViewAgreement(activeAgreement, appWhatsapp)}
                        >
                          View Signed Copy 📄
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Administrative Action Control Panel */}
                <div className="admin-review-control-panel">
                  <h4 className="admin-review-control-title">Review Status Controls</h4>
                  <p className="admin-review-control-desc">
                    Approving the application marks the B2B partner as approved for both basic review and full onboarding profile databases.
                  </p>
                  <div className="admin-flex-gap12">
                    <button
                      type="button"
                      className="admin-btn-approve-review"
                      onClick={async () => {
                        const success1 = await updateDatabaseApplicationStatus('update_review_status', appWhatsapp, 'approved');
                        const success2 = await updateDatabaseApplicationStatus('update_onboarding_status', appWhatsapp, 'approved');
                        if (success1 || success2) {
                          alert('Application approved successfully!');
                          setSelectedReview(null);
                        }
                      }}
                    >
                      Approve Application
                    </button>
                    <button
                      type="button"
                      className="admin-btn-reject-review"
                      onClick={async () => {
                        const success1 = await updateDatabaseApplicationStatus('update_review_status', appWhatsapp, 'rejected');
                        const success2 = await updateDatabaseApplicationStatus('update_onboarding_status', appWhatsapp, 'rejected');
                        if (success1 || success2) {
                          alert('Application marked as rejected.');
                          setSelectedReview(null);
                        }
                      }}
                    >
                      Reject Application
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-modal-close" onClick={() => setSelectedReview(null)}>Close Inspector</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Step 3 Onboarding Inspector Modal */}
      {selectedOnboarding && (() => {
        const onb = selectedOnboarding;
        const appWhatsapp = onb.whatsapp_number || '';
        const cleanWhatsapp = appWhatsapp.replace(/\D/g, '').slice(-10);
        const currentStatus = localStatuses[cleanWhatsapp] || onb.status || 'submitted';
        const matchedProfile = adminData.profiles.find(p => p.whatsapp && p.whatsapp.replace(/\D/g, '').slice(-10) === cleanWhatsapp);

        return (
          <div className="admin-modal-overlay">
            <div className="admin-onboarding-modal">
              {/* Modal Header */}
              <div className="admin-modal-header-bg">
                <div>
                  <span className="admin-modal-subtitle">Full Onboarding Application Detail</span>
                  <h3 className="admin-modal-title-fs24">{onb.business_name || 'Unnamed Vendor'}</h3>
                  <span className="admin-modal-header-meta">Proprietor: {onb.full_name} | WhatsApp: {onb.whatsapp_number}</span>
                </div>
                <button type="button" onClick={() => setSelectedOnboarding(null)} className="admin-modal-close-btn-lg">×</button>
              </div>

              {/* Modal Body */}
              <div className="admin-modal-body-split">
                {/* Left Column: Business & Logistics */}
                <div className="admin-grid-gap20-align-start">
                  <div>
                    <h4 className="admin-modal-section-title">Company Information</h4>
                    <div className="admin-grid-gap8-fs13">
                      <div><strong>Business Legal Name</strong>: {onb.business_name}</div>
                      <div><strong>Business Role</strong>: {onb.business_type}</div>
                      <div><strong>Years in Business</strong>: {onb.years_in_business}</div>
                      <div><strong>GST Registration</strong>: {onb.gst_number || 'Not Registered'}</div>
                      <div><strong>Permanent Account Number (PAN)</strong>: {onb.pan_number}</div>
                      <div><strong>Business Location</strong>: {onb.business_address}</div>
                      <div><strong>City / Pincode</strong>: {onb.city} / {onb.pincode}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="admin-modal-section-title">Products & Fulfillment</h4>
                    <div className="admin-grid-gap8-fs13">
                      <div><strong>Fabric Specialisations</strong>: <span>{onb.fabric_specialisation}</span></div>
                      <div><strong>Monthly Production Capacity</strong>: {onb.monthly_capacity}</div>
                      <div><strong>Standard Dispatch Timeline</strong>: {onb.dispatch_timeline}</div>
                      <div><strong>Preferred Courier Partner</strong>: {onb.preferred_courier}</div>
                      <div><strong>Dispatch Address</strong>: {onb.dispatch_address_same === 'same' ? 'Same as business address' : `Different: ${onb.dispatch_address_different}`}</div>
                      <div><strong>Target Price Group Intent</strong>: {onb.price_range}</div>
                      <div><strong>Agreement Signed On</strong>: {onb.created_at ? onb.created_at.split('T')[0] : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Verification Docs */}
                  <div>
                    <h4 className="admin-modal-section-title">Uploaded Verification Files</h4>
                    <div className="admin-flex-gap12">
                      {onb.id_proof_url ? (
                        <div onClick={() => setLightboxImage(onb.id_proof_url)} className="admin-doc-card img-hover-trigger">
                          <Eye size={18} className="admin-doc-card-icon" />
                          <div className="admin-doc-card-title">Aadhaar Card / ID Proof</div>
                          <span className="admin-doc-card-muted">Click to zoom file</span>
                        </div>
                      ) : (
                        <div className="admin-doc-card-empty">No Aadhaar uploaded</div>
                      )}

                      {onb.cancelled_cheque_url ? (
                        <div onClick={() => setLightboxImage(onb.cancelled_cheque_url)} className="admin-doc-card img-hover-trigger">
                          <Eye size={18} className="admin-doc-card-icon" />
                          <div className="admin-doc-card-title">Cancelled Cheque Proof</div>
                          <span className="admin-doc-card-muted">Click to zoom file</span>
                        </div>
                      ) : (
                        <div className="admin-doc-card-empty">No Cheque uploaded</div>
                      )}

                      {(activeAgreement || onb) && (
                        <button
                          type="button"
                          onClick={() => handleViewAgreement(activeAgreement || { vendor_signed_name: onb.full_name, signed_date: onb.created_at ? onb.created_at.split('T')[0] : new Date().toLocaleDateString('en-IN') }, appWhatsapp)}
                          className="admin-doc-card-agreement img-hover-trigger"
                        >
                          <FileText size={18} className="admin-doc-card-agreement-icon" />
                          <div className="admin-doc-card-title">Signed Merchant Agreement</div>
                          <span className="admin-doc-card-muted">Click to view signed copy 📄</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Bank Details & Supabase Database Integrations */}
                <div className="admin-grid-gap20-align-start">
                  <div>
                    <h4 className="admin-modal-section-title">Bank Disbursement Details</h4>
                    <div className="admin-bank-details-card">
                      <div className="admin-flex-between-align-center">
                        <div className="admin-bank-card-label">Account Holder Name</div>
                        <button type="button" onClick={() => handleCopy(onb.bank_account_holder, 'holder')} className="admin-bank-copy-btn">
                          <Copy size={11} /> {copyFeedback['holder'] ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <strong className="admin-bank-card-val">{onb.bank_account_holder || 'N/A'}</strong>

                      <div className="admin-flex-between-align-center">
                        <div className="admin-bank-card-label">Bank Name</div>
                        <button type="button" onClick={() => handleCopy(onb.bank_name, 'bankName')} className="admin-bank-copy-btn">
                          <Copy size={11} /> {copyFeedback['bankName'] ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <strong className="admin-bank-card-val">{onb.bank_name || 'N/A'}</strong>

                      <div className="admin-flex-between-align-center">
                        <div className="admin-bank-card-label">Bank Account Number</div>
                        <button type="button" onClick={() => handleCopy(onb.bank_account_number, 'accNum')} className="admin-bank-copy-btn">
                          <Copy size={11} /> {copyFeedback['accNum'] ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <strong className="admin-bank-card-val-mono">{onb.bank_account_number || 'N/A'}</strong>

                      <div className="admin-flex-between-align-center">
                        <div className="admin-bank-card-label">IFSC Code</div>
                        <button type="button" onClick={() => handleCopy(onb.bank_ifsc, 'ifsc')} className="admin-bank-copy-btn">
                          <Copy size={11} /> {copyFeedback['ifsc'] ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <strong className="admin-bank-card-val-mono-fs14">{onb.bank_ifsc || 'N/A'}</strong>

                      <div className="admin-flex-between-align-center">
                        <div className="admin-bank-card-label">UPI Address</div>
                        {onb.upi_id && (
                          <button type="button" onClick={() => handleCopy(onb.upi_id, 'upi')} className="admin-bank-copy-btn">
                            <Copy size={11} /> {copyFeedback['upi'] ? '✓ Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                      <strong className="admin-bank-card-val">{onb.upi_id || 'N/A'}</strong>
                    </div>
                  </div>

                  {/* Status update box */}
                  <div>
                    <h4 className="admin-modal-section-title">Database Application Status</h4>
                    <div className="admin-modal-status-box">
                      <div className="admin-flex-between-align-center" style={{ marginBottom: '8px' }}>
                        <span className="admin-modal-status-label">Current Status:</span>
                        <span className={`admin-status ${currentStatus.toLowerCase()}`}>{currentStatus}</span>
                      </div>
                      <div className="admin-grid-2col-gap8">
                        <button
                          type="button"
                          className="admin-btn-status-approve"
                          onClick={async () => {
                            const success1 = await updateDatabaseApplicationStatus('update_onboarding_status', appWhatsapp, 'approved');
                            const success2 = await updateDatabaseApplicationStatus('update_review_status', appWhatsapp, 'approved');
                            if (success1 || success2) alert('Onboarding profile and basic review marked as Approved in database!');
                          }}
                        >
                          Mark Profile Approved
                        </button>
                        <button
                          type="button"
                          className="admin-btn-status-flag"
                          onClick={async () => {
                            const success1 = await updateDatabaseApplicationStatus('update_onboarding_status', appWhatsapp, 'flagged');
                            const success2 = await updateDatabaseApplicationStatus('update_review_status', appWhatsapp, 'flagged');
                            if (success1 || success2) alert('Onboarding profile and basic review flagged in database.');
                          }}
                        >
                          Flag Application
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Google Drive upload link */}
                  <div>
                    <h4 className="admin-modal-section-title">Product Listing Drive Link</h4>
                    <div className="admin-modal-status-box">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span className="admin-modal-status-label">Google Drive Folder Link:</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="admin-field-input"
                            placeholder="Paste Google Drive folder URL..."
                            defaultValue={onb.drive_folder_url || ''}
                            id={`drive-url-${cleanWhatsapp}`}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            className="admin-btn-save-drive"
                            onClick={async () => {
                              const driveUrlVal = document.getElementById(`drive-url-${cleanWhatsapp}`).value;
                              const success = await updateDatabaseDriveFolderUrl(appWhatsapp, driveUrlVal);
                              if (success) {
                                alert('Drive folder URL saved successfully!');
                              } else {
                                alert('Failed to save Drive folder URL.');
                              }
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supabase Matched Account */}
                  <div>
                    <h4 className="admin-modal-section-title">Supabase B2B Database Integration</h4>
                    <div className="admin-supabase-link-box">
                      {matchedProfile ? (
                        <div className="admin-grid-gap12">
                          <div className="admin-flex-align-center-gap8">
                            <span className="admin-status approved">✓ Profile Linked</span>
                            <span className="admin-doc-card-muted">({matchedProfile.email})</span>
                          </div>
                          <div className="admin-supabase-matched-info">
                            <div><strong>Active Pricing Group</strong>: <span className="admin-primary-bold">{PRICE_GROUPS[matchedProfile.price_group] || 'None'}</span></div>
                            <div><strong>Database Account status</strong>: <span className="admin-ink-bold-capitalize">{matchedProfile.approval_status}</span></div>
                          </div>

                          <div className="admin-grid-2col-gap8-mt8">
                            <button
                              type="button"
                              className="admin-btn-disburse-wholesale"
                              onClick={async () => {
                                await updateBuyerPriceAccess(matchedProfile, 'approved', 'wholesale');
                                alert('Applicant approved as a WHOLESALE merchant successfully!');
                                setSelectedOnboarding(null);
                              }}
                            >
                              Unlock Wholesaler Access
                            </button>
                            <button
                              type="button"
                              className="admin-btn-disburse-reseller"
                              onClick={async () => {
                                await updateBuyerPriceAccess(matchedProfile, 'approved', 'reseller');
                                alert('Applicant approved as a RESELLER merchant successfully!');
                                setSelectedOnboarding(null);
                              }}
                            >
                              Unlock Reseller Access
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="admin-grid-gap10">
                          <span className="admin-status new admin-width-fit">No Supabase Profile Found</span>
                          <p className="admin-inquiry-notes-p">
                            This vendor has submitted onboarding details, but hasn't created a login account on Weave365.com yet. Send WhatsApp signup reminder:
                          </p>
                          <a
                            href={`https://wa.me/${appWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${onb.full_name}, we have verified your B2B Onboarding application for Weave 365! Please sign up an account at https://www.weave365.com using this WhatsApp number (+91 ${onb.whatsapp_number}) so we can instantly unlock your wholesale pricing tier access dashboard.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-btn-wa-signup"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            <Phone size={14} /> Send WhatsApp Signup Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer-bg">
                <button type="button" className="admin-btn-modal-close" onClick={() => setSelectedOnboarding(null)}>Close Inspector</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
