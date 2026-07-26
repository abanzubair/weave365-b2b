import { useMemo, useState } from 'react';
import {
  Users,
  ShoppingBag,
  Heart,
  MessageSquareText,
  BarChart3,
  LineChart,
  Store,
  UserRound,
  Copy,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Search,
  MoreHorizontal,
  Download,
} from 'lucide-react';
import { isVaranasiPincode, normalizeBuyerType } from '../../utils/buyerAccess.js';
import {
  monthKey,
  buildMonthlySeries,
  joinByUser,
  MetricCard,
  MiniBarChart,
} from './AdminShared.jsx';

export default function BuyerPipeline({
  adminData,
  status,
  syncStatus,
  loadAdminData,
  handleManualSync,
  setSelectedUserList,
  updateBuyerPriceAccess,
  toggleResellerDashboard,
  updateInquiryStatus,
  user,
}) {
  // Local state for filters and sorting
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [userPageLimit, setUserPageLimit] = useState('10');
  const [userSortField, setUserSortField] = useState('date');
  const [userSortOrder, setUserSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const [copyFeedback, setCopyFeedback] = useState({});

  const userCartMap = useMemo(() => joinByUser(adminData.cartItems), [adminData.cartItems]);
  const userFavoriteMap = useMemo(() => joinByUser(adminData.favorites), [adminData.favorites]);

  const sortedProfiles = useMemo(() => {
    let profiles = adminData.profiles || [];
    if (userTypeFilter !== 'all') {
      profiles = profiles.filter((p) => normalizeBuyerType(p.buyer_type) === userTypeFilter);
    }
    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      profiles = profiles.filter((p) => {
        const name = String(p.full_name || p.business_name || '').toLowerCase();
        const email = String(p.email || '').toLowerCase();
        const phone = String(p.whatsapp || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    return [...profiles].sort((a, b) => {
      let valA, valB;
      if (userSortField === 'name') {
        valA = String(a.business_name || a.full_name || '').toLowerCase();
        valB = String(b.business_name || b.full_name || '').toLowerCase();
      } else if (userSortField === 'order_list') {
        const cartA = userCartMap.get(a.id) || [];
        const cartB = userCartMap.get(b.id) || [];
        valA = cartA.length;
        valB = cartB.length;
      } else if (userSortField === 'favourites') {
        const favA = userFavoriteMap.get(a.id) || [];
        const favB = userFavoriteMap.get(b.id) || [];
        valA = favA.length;
        valB = favB.length;
      } else if (userSortField === 'approval') {
        valA = String(a.approval_status || 'pending').toLowerCase();
        valB = String(b.approval_status || 'pending').toLowerCase();
      } else { // 'date'
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      }

      if (valA < valB) return userSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return userSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [adminData.profiles, userCartMap, userFavoriteMap, userSortField, userSortOrder, userTypeFilter, searchQuery]);

  const displayedProfiles = useMemo(() => {
    if (userPageLimit === 'all') return sortedProfiles;
    return sortedProfiles.slice(0, parseInt(userPageLimit));
  }, [sortedProfiles, userPageLimit]);

  const toTitleCase = (str) => {
    if (!str) return '';
    return String(str)
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getBuyerTypeLabel = (type) => {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (lower === 'wholesale') return 'Wholesaler';
    if (lower === 'reseller') return 'Reseller';
    if (lower === 'user') return 'User';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getBuyingBehaviorLabel = (behavior) => {
    if (!behavior) return '';
    const lower = behavior.toLowerCase();
    if (lower === 'instant') return 'Immediate';
    if (lower === 'order_basis') return 'Order Basis';
    return behavior.charAt(0).toUpperCase() + behavior.slice(1);
  };

  const handleCopyUserDetails = (profile) => {
    const categoriesStr = Array.isArray(profile.interested_categories)
      ? profile.interested_categories.join(', ')
      : '';

    const row = [
      toTitleCase(profile.full_name),
      toTitleCase(profile.business_name),
      `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
      profile.email || '',
      profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
      categoriesStr,
      getBuyerTypeLabel(profile.buyer_type),
      getBuyingBehaviorLabel(profile.buying_behavior)
    ].join('\t');

    navigator.clipboard.writeText(row);

    setCopyFeedback(prev => ({ ...prev, [profile.id]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [profile.id]: false }));
    }, 2000);
  };

  const handleCopyAllUserDetails = () => {
    if (!sortedProfiles || sortedProfiles.length === 0) {
      alert('No user records available to copy.');
      return;
    }

    const rows = sortedProfiles.map(profile => {
      const categoriesStr = Array.isArray(profile.interested_categories)
        ? profile.interested_categories.join(', ')
        : '';
      return [
        toTitleCase(profile.full_name),
        toTitleCase(profile.business_name),
        `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
        profile.email || '',
        profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
        categoriesStr,
        getBuyerTypeLabel(profile.buyer_type),
        getBuyingBehaviorLabel(profile.buying_behavior)
      ].join('\t');
    });

    navigator.clipboard.writeText(rows.join('\n'));

    setCopyFeedback(prev => ({ ...prev, allUsers: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, allUsers: false }));
    }, 2000);
  };

  const handleExportCSV = () => {
    if (!sortedProfiles || sortedProfiles.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = ['Name', 'Business', 'City', 'Email', 'Phone', 'Categories', 'Type', 'Behavior', 'Approval'];
    const csvRows = sortedProfiles.map(profile => {
      const categoriesStr = Array.isArray(profile.interested_categories)
        ? profile.interested_categories.join('; ')
        : '';
      return [
        toTitleCase(profile.full_name),
        toTitleCase(profile.business_name),
        `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
        profile.email || '',
        profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
        categoriesStr,
        getBuyerTypeLabel(profile.buyer_type),
        getBuyingBehaviorLabel(profile.buying_behavior),
        profile.approval_status || 'pending',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Clean Header */}
      <div className="pipeline-page-header">
        <div className="pipeline-header-left">
          <h1 className="pipeline-page-title">Customers</h1>
          <p className="pipeline-page-subtitle">Manage your customers</p>
        </div>
        <div className="pipeline-header-actions">
          <button
            type="button"
            onClick={handleExportCSV}
            className="pipeline-header-btn"
          >
            <Download size={16} /> Export
          </button>
          <button
            type="button"
            onClick={handleCopyAllUserDetails}
            className={`pipeline-header-btn ${copyFeedback.allUsers ? 'copied' : ''}`}
          >
            {copyFeedback.allUsers ? <Check size={16} className="icon-check-anim" /> : <Copy size={16} />} {copyFeedback.allUsers ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      </div>

      {/* Search + Filters Bar */}
      <div className="pipeline-toolbar">
        <div className="pipeline-search-wrap">
          <Search size={18} className="pipeline-search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or phone."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pipeline-search-input"
          />
        </div>
        <div className="pipeline-filters">
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="pipeline-filter-select"
          >
            <option value="all">All Types</option>
            <option value="wholesale">Wholesalers</option>
            <option value="reseller">Resellers</option>
            <option value="user">Users</option>
          </select>
          <select
            value={userSortField}
            onChange={(e) => setUserSortField(e.target.value)}
            className="pipeline-filter-select"
          >
            <option value="date">Sort: Date</option>
            <option value="name">Sort: Name</option>
            <option value="order_list">Sort: Orders</option>
            <option value="favourites">Sort: Favourites</option>
            <option value="approval">Sort: Approval</option>
          </select>
          <button
            type="button"
            onClick={() => setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="pipeline-sort-toggle"
          >
            {userSortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <select
            value={userPageLimit}
            onChange={(e) => setUserPageLimit(e.target.value)}
            className="pipeline-filter-select"
          >
            <option value="10">10 rows</option>
            <option value="20">20 rows</option>
            <option value="30">30 rows</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="pipeline-table-container">
        <div className="admin-table-wrap">
          <table className="admin-table pipeline-table">
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Registered</th>
                <th>Buyer</th>
                <th>Type</th>
                <th>Categories</th>
                <th>Order List</th>
                <th>Favourites</th>
                <th>Approval</th>
                <th>Dashboard</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedProfiles.map((profile, index) => {
                const cartRows = userCartMap.get(profile.id) || [];
                const favoriteRows = userFavoriteMap.get(profile.id) || [];

                const currentStatusVal =
                  profile.approval_status === 'approved' && profile.price_group === 'wholesale' ? 'approved-wholesale' :
                    profile.approval_status === 'approved' && profile.price_group === 'reseller' ? 'approved-reseller' :
                      profile.approval_status === 'approved' && profile.price_group === 'user' ? 'approved-user' :
                        profile.approval_status === 'pending' ? 'pending' :
                          profile.approval_status === 'suspended' ? 'suspended' : 'pending';

                return (
                  <tr key={profile.id}>
                    <td><strong>{sortedProfiles.length - index}</strong></td>
                    <td>
                      {profile.created_at ? (
                        <span className="pipeline-date-cell">
                          {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td>
                      <div className="pipeline-buyer-cell">
                        <strong className="admin-capitalize">{profile.full_name || profile.business_name || 'Unnamed'}</strong>
                        {profile.business_name && profile.full_name && (
                          <span className="pipeline-buyer-business">{profile.business_name}</span>
                        )}
                        {(profile.city || profile.pincode) && (
                          <span className="pipeline-buyer-location">
                            {profile.city || 'No City'}{profile.pincode ? `, ${profile.pincode}` : ''}
                          </span>
                        )}
                        {profile.email && (
                          <a href={`mailto:${profile.email}`} className="pipeline-buyer-email">{profile.email}</a>
                        )}
                        {profile.whatsapp && (
                          <a
                            href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="pipeline-buyer-phone"
                          >
                            {profile.whatsapp}
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="pipeline-type-label">
                        {profile.buyer_type || 'Not set'}
                      </span>
                    </td>
                    <td>
                      {profile.interested_categories && Array.isArray(profile.interested_categories) && profile.interested_categories.length > 0 ? (
                        <span className="admin-categories-tags">
                          {profile.interested_categories.join(', ')}
                        </span>
                      ) : (
                        <span className="pipeline-muted">-</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedUserList({ profile, type: 'cart' })}
                        className={`admin-list-link-btn ${cartRows.length > 0 ? 'has-items' : 'empty'}`}
                        disabled={cartRows.length === 0}
                      >
                        <ShoppingBag size={15} />
                        <span>{cartRows.length} {cartRows.length === 1 ? 'row' : 'rows'}</span>
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setSelectedUserList({ profile, type: 'favorite' })}
                        className={`admin-list-link-btn ${favoriteRows.length > 0 ? 'has-items' : 'empty'}`}
                        disabled={favoriteRows.length === 0}
                      >
                        <Heart size={15} />
                        <span>{favoriteRows.length} {favoriteRows.length === 1 ? 'item' : 'items'}</span>
                      </button>
                    </td>
                    <td>
                      <span className={`admin-badge-status status-${String(profile.approval_status || 'pending').toLowerCase().trim().replace(/[^a-z0-9]/g, '-')}`}>
                        {profile.approval_status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div className="reseller-dashboard-cell">
                        <span className={`reseller-dashboard-status ${profile.reseller_dashboard_enabled ? 'enabled' : 'disabled'}`}>
                          {profile.reseller_dashboard_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleResellerDashboard(profile, !profile.reseller_dashboard_enabled)}
                          className={`admin-action-link-btn ${profile.reseller_dashboard_enabled ? 'btn-disable' : 'btn-enable'}`}
                        >
                          {profile.reseller_dashboard_enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="pipeline-action-cell">
                        <button
                          type="button"
                          onClick={() => handleCopyUserDetails(profile)}
                          className={`pipeline-action-icon-btn ${copyFeedback[profile.id] ? 'copied' : ''}`}
                          title={copyFeedback[profile.id] ? 'Copied!' : 'Copy details'}
                        >
                          {copyFeedback[profile.id] ? (
                            <Check size={16} className="icon-check-anim" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <select
                          value={currentStatusVal}
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (val === 'approved-wholesale') {
                              await updateBuyerPriceAccess(profile, 'approved', 'wholesale');
                            } else if (val === 'approved-reseller') {
                              await updateBuyerPriceAccess(profile, 'approved', 'reseller');
                            } else if (val === 'approved-user') {
                              await updateBuyerPriceAccess(profile, 'approved', 'user');
                            } else if (val === 'pending') {
                              await updateBuyerPriceAccess(profile, 'pending', 'pending');
                            } else if (val === 'suspended') {
                              await updateBuyerPriceAccess(profile, 'suspended', 'pending');
                            }
                          }}
                          className="pipeline-action-select"
                        >
                          <option value="approved-wholesale">Wholesale</option>
                          <option value="approved-reseller">Reseller</option>
                          <option value="approved-user">User</option>
                          <option value="pending">Hold</option>
                          <option value="suspended">Suspend</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayedProfiles.length === 0 && (
                <tr>
                  <td colSpan="10" className="admin-table-empty">No profiles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row count summary */}
      <div className="pipeline-footer-summary">
        Showing {displayedProfiles.length} of {sortedProfiles.length} customers
        {userTypeFilter !== 'all' && ` (${userTypeFilter})`}
      </div>

      {/* Notices */}
      {Object.keys(adminData.errors).filter(k => k !== 'blog_posts').length > 0 && (
        <article className="admin-panel" style={{ marginTop: '24px' }}>
          <div className="admin-panel-head">
            <span>Supabase Setup Notices</span>
            <small>Missing tables or RLS policies</small>
          </div>
          <div className="admin-notice-list">
            {Object.entries(adminData.errors).reduce((acc, [table, error]) => {
              if (table !== 'blog_posts') {
                acc.push(<p key={table}><strong>{table}</strong>: {error}</p>);
              }
              return acc;
            }, [])}
          </div>
        </article>
      )}
    </>
  );
}
