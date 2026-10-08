import { useMemo, useState } from 'react';
import {
  Users,
  ShoppingBag,
  Heart,
  Copy,
  Check,
  Search,
  Download,
  Globe,
  ExternalLink,
  Instagram,
  Facebook,
  Eye,
  Lock,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  X,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
} from '../../components/icons.jsx';
import { WhatsappIcon } from '../../components/WhatsappIcon.jsx';
import { normalizeBuyerType, isVendorProfile, isAccountLocked, isCategoryDetailsComplete } from '../../utils/buyerAccess.js';
import { adminEmails, storeConfig } from '../../config.js';
import {
  joinByUser,
  isAdminUser,
} from './AdminShared.jsx';
import { resolveBuyerAcquisition } from '../../utils/acquisitionResolver.js';
import {
  BUSINESS_TYPES,
  BUSINESS_EXPERIENCE_OPTIONS,
  BUSINESS_BUDGET_OPTIONS,
  BUSINESS_SALES_CHANNELS,
  BUSINESS_PURCHASE_INTENT_OPTIONS,
} from '../../components/signup/signupConstants.js';

function formatExperienceLabel(val) {
  if (!val) return '—';
  const opt = BUSINESS_EXPERIENCE_OPTIONS.find((o) => o.id === val);
  return opt ? opt.label : val;
}

function formatBudgetLabel(val) {
  if (!val) return '—';
  const opt = BUSINESS_BUDGET_OPTIONS.find((o) => o.id === val);
  return opt ? opt.label : val;
}

function formatSalesChannelsLabel(channels) {
  if (!channels || (Array.isArray(channels) && channels.length === 0)) return '—';
  if (Array.isArray(channels)) {
    return channels
      .map((ch) => BUSINESS_SALES_CHANNELS.find((o) => o.id === ch)?.label || ch)
      .join(', ');
  }
  return BUSINESS_SALES_CHANNELS.find((o) => o.id === channels)?.label || channels;
}

function formatPurchaseIntentLabel(val) {
  if (!val) return '—';
  const opt = BUSINESS_PURCHASE_INTENT_OPTIONS.find((o) => o.id === val);
  return opt ? opt.label : val;
}

function getSocialInfo(rawHandle) {
  if (!rawHandle || typeof rawHandle !== 'string') return null;
  const trimmed = rawHandle.trim();
  if (!trimmed) return null;

  let url = trimmed;
  let display = trimmed;
  let type = 'instagram';

  if (/^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\//i.test(trimmed)) {
    type = 'instagram';
    const cleanPath = trimmed
      .replace(/^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/?/i, '')
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '')
      .replace(/^@/, '');
    display = cleanPath ? `@${cleanPath}` : trimmed;
    url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  } else if (/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\//i.test(trimmed)) {
    type = 'facebook';
    const cleanPath = trimmed
      .replace(/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/?/i, '')
      .replace(/[?#].*$/, '')
      .replace(/\/+$/, '');
    display = cleanPath ? `fb/${cleanPath}` : trimmed;
    url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    type = 'link';
    display = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
    url = trimmed;
  } else {
    const clean = trimmed.replace(/^@+/, '');
    display = `@${clean}`;
    url = `https://instagram.com/${clean}`;
  }

  return { url, display, type };
}

function getWebsiteInfo(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const url = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  const display = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '');

  return { url, display };
}

export default function BuyerPipeline({
  adminData,
  status,
  syncStatus,
  loadAdminData,
  handleManualSync,
  setSelectedUserList,
  toggleResellerDashboard,
  updateInquiryStatus,
  user,
  updateProfile,
}) {
  // Local state for filters and sorting
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [acquisitionFilter, setAcquisitionFilter] = useState('all');
  const [userPageLimit, setUserPageLimit] = useState('10');
  const [userSortField, setUserSortField] = useState('date');
  const [userSortOrder, setUserSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Account details & role switch modal state
  const [inspectProfile, setInspectProfile] = useState(null);
  const [selectedRoleToSet, setSelectedRoleToSet] = useState('customer');
  const [lockStatusToSet, setLockStatusToSet] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleSwitchSuccess, setRoleSwitchSuccess] = useState('');
  const [roleSwitchError, setRoleSwitchError] = useState('');

  const [copyFeedback, setCopyFeedback] = useState({});

  const userCartMap = useMemo(() => joinByUser(adminData.cartItems), [adminData.cartItems]);
  const userFavoriteMap = useMemo(() => joinByUser(adminData.favorites), [adminData.favorites]);

  const siteAnalyticsList = adminData?.optional?.site_analytics || [];
  const acquisitionMap = useMemo(() => {
    const map = new Map();
    (adminData.profiles || []).forEach((p) => {
      map.set(p.id, resolveBuyerAcquisition(p, siteAnalyticsList));
    });
    return map;
  }, [adminData.profiles, siteAnalyticsList]);

  const storefrontsByReseller = useMemo(() => {
    const list = adminData?.optional?.boutique_tenants || adminData?.optional?.reseller_storefronts || [];
    const map = {};
    list.forEach((sf) => {
      const rid = sf?.reseller_id || sf?.owner_id || sf?.about_text?.match(/"reseller_id":"([^"]+)"/)?.[1];
      if (rid) {
        map[rid] = sf;
      }
    });
    return map;
  }, [adminData?.optional?.boutique_tenants, adminData?.optional?.reseller_storefronts]);

  const getProfileRoleKey = (p) => {
    if (!p) return 'customer';
    if (isVendorProfile(p)) return 'supplier';
    const isBusiness = p.user_type === 'business' || p.buyer_type === 'business' || p.buyer_type === 'reseller' || p.role === 'reseller' || (p.buyer_subtype && p.buyer_subtype.toLowerCase() !== 'customer') || Boolean(p.business_name?.trim());
    return isBusiness ? 'reseller' : 'customer';
  };

  const openInspectModal = (profile) => {
    setInspectProfile(profile);
    const roleKey = getProfileRoleKey(profile);
    setSelectedRoleToSet(roleKey);
    setLockStatusToSet(Boolean(isAccountLocked(profile)));
    setRoleSwitchSuccess('');
    setRoleSwitchError('');
  };

  const handleRoleSelectionChange = (newRole) => {
    setSelectedRoleToSet(newRole);
    if (newRole !== 'customer') {
      const isComplete = isCategoryDetailsComplete(inspectProfile, newRole);
      setLockStatusToSet(!isComplete);
    } else {
      setLockStatusToSet(false);
    }
    setRoleSwitchSuccess('');
    setRoleSwitchError('');
  };

  const handleSaveRoleSwitch = async () => {
    if (!inspectProfile || switchingRole) return;
    setSwitchingRole(true);
    setRoleSwitchError('');
    setRoleSwitchSuccess('');

    try {
      let newUserType = 'customer';
      let newRole = 'customer';
      let newBuyerType = 'customer';
      let newBuyerSubtype = 'Customer';

      if (selectedRoleToSet === 'reseller') {
        newUserType = 'business';
        newRole = 'reseller';
        newBuyerType = 'business';
        newBuyerSubtype = inspectProfile.qualification?.business_type_label || inspectProfile.buyer_subtype || 'Reseller';
      } else if (selectedRoleToSet === 'supplier') {
        newUserType = 'supplier';
        newRole = 'vendor';
        newBuyerType = 'vendor';
        newBuyerSubtype = inspectProfile.qualification?.business_type || inspectProfile.buyer_subtype || 'Supplier';
      }

      const requiresLock = selectedRoleToSet !== 'customer' && !isCategoryDetailsComplete(inspectProfile, selectedRoleToSet);
      const finalLockStatus = requiresLock ? true : lockStatusToSet;

      const existingQual = (typeof inspectProfile.qualification === 'object' && inspectProfile.qualification) ? inspectProfile.qualification : {};
      const newQual = {
        ...existingQual,
        account_locked: finalLockStatus,
        locked_reason: finalLockStatus ? 'switched_by_admin_pending_details' : null,
      };

      const updateData = {
        user_type: newUserType,
        role: newRole,
        buyer_type: newBuyerType,
        buyer_subtype: newBuyerSubtype,
        qualification: newQual,
        updated_at: new Date().toISOString(),
      };

      let success = false;
      if (updateProfile) {
        success = await updateProfile(inspectProfile.id, updateData);
      }

      if (success) {
        const updated = {
          ...inspectProfile,
          ...updateData,
          account_locked: finalLockStatus,
          locked_reason: finalLockStatus ? 'switched_by_admin_pending_details' : null,
        };
        setInspectProfile(updated);
        setRoleSwitchSuccess(
          `Account type updated to ${selectedRoleToSet === 'supplier' ? 'Supplier Partner' : (selectedRoleToSet === 'reseller' ? 'Business & Reseller' : 'Customer')}! ${finalLockStatus ? 'Account is locked pending required profile details.' : 'Account is unlocked.'}`
        );
        if (loadAdminData) loadAdminData();
      } else {
        setRoleSwitchError('Failed to update account. Please try again.');
      }
    } catch (err) {
      console.error('Error switching account role:', err);
      setRoleSwitchError(err?.message || 'Failed to switch account role.');
    } finally {
      setSwitchingRole(false);
    }
  };

  const sortedProfiles = useMemo(() => {
    let profiles = (adminData.profiles || []).filter((p) => {
      const email = String(p.email || '').toLowerCase().trim();
      const isConfiguredAdmin = (adminEmails || []).some((adm) => String(adm).toLowerCase().trim() === email);
      return !isAdminUser(p) && !isConfiguredAdmin && p.role !== 'admin';
    });
    const isIncomplete = (p) => {
      const cleanPhone = String(p.whatsapp_number || p.whatsapp || '').replace(/\D/g, '');
      return cleanPhone.length < 6 || !String(p.city || '').trim();
    };

    if (userTypeFilter === 'customer') {
      profiles = profiles.filter((p) => (
        !isVendorProfile(p) &&
        p.user_type !== 'business' &&
        p.buyer_type !== 'business' &&
        p.buyer_type !== 'reseller' &&
        p.role !== 'reseller' &&
        (!p.buyer_subtype || p.buyer_subtype.toLowerCase() === 'customer') &&
        !Boolean(p.business_name?.trim()) &&
        !isIncomplete(p)
      ));
    } else if (userTypeFilter === 'business') {
      profiles = profiles.filter((p) => (
        (p.user_type === 'business' ||
         p.buyer_type === 'business' ||
         p.buyer_type === 'reseller' ||
         p.role === 'reseller' ||
         (p.buyer_subtype && p.buyer_subtype.toLowerCase() !== 'customer') ||
         Boolean(p.business_name?.trim())) &&
        !isVendorProfile(p)
      ));
    } else if (userTypeFilter === 'vendor') {
      profiles = profiles.filter((p) => isVendorProfile(p));
    } else if (userTypeFilter === 'locked') {
      profiles = profiles.filter((p) => isAccountLocked(p));
    } else if (userTypeFilter === 'incomplete') {
      profiles = profiles.filter((p) => isIncomplete(p));
    } else {
      // 'all' -> Default view: verified buyers and vendors with completed details
      profiles = profiles.filter((p) => !isIncomplete(p));
    }

    // Filter by marketing acquisition channel
    if (acquisitionFilter !== 'all') {
      profiles = profiles.filter((p) => {
        const attr = acquisitionMap.get(p.id);
        return attr && attr.type === acquisitionFilter;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      profiles = profiles.filter((p) => {
        const name = String(p.full_name || p.business_name || '').toLowerCase();
        const email = String(p.email || '').toLowerCase();
        const phone = String(p.whatsapp || '').toLowerCase();
        const social = String(p.social_handle || p.socialHandle || '').toLowerCase();
        const website = String(p.website || p.client_website || '').toLowerCase();
        const attr = acquisitionMap.get(p.id);
        const attrText = attr ? `${attr.cleanName} ${attr.landingPath} ${attr.category}`.toLowerCase() : '';
        return name.includes(q) || email.includes(q) || phone.includes(q) || social.includes(q) || website.includes(q) || attrText.includes(q);
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
      } else { // 'date'
        valA = new Date(a.created_at || 0).getTime();
        valB = new Date(b.created_at || 0).getTime();
      }

      if (valA < valB) return userSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return userSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [adminData.profiles, userCartMap, userFavoriteMap, userSortField, userSortOrder, userTypeFilter, acquisitionFilter, acquisitionMap, searchQuery]);

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

  const getBuyerTypeLabel = (profile) => {
    if (!profile) return 'Customer';
    if (isVendorProfile(profile)) return 'Vendor Partner';
    const subtype = String(profile.buyer_subtype || '').toLowerCase().trim();
    if (subtype && subtype !== 'customer' && subtype !== 'user') return toTitleCase(subtype);
    if (profile.user_type === 'business' || profile.buyer_type === 'business' || profile.buyer_type === 'reseller' || profile.role === 'reseller' || Boolean(profile.business_name?.trim())) {
      return 'Business Buyer';
    }
    return 'Customer';
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
    const attr = acquisitionMap.get(profile.id);

    const row = [
      toTitleCase(profile.full_name),
      toTitleCase(profile.business_name),
      `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
      profile.email || '',
      profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
      attr ? `${attr.cleanName} (↳ ${attr.landingPath})` : 'Direct',
      profile.social_handle || profile.socialHandle || '',
      profile.website || profile.client_website || '',
      categoriesStr,
      getBuyerTypeLabel(profile),
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
      const attr = acquisitionMap.get(profile.id);

      return [
        toTitleCase(profile.full_name),
        toTitleCase(profile.business_name),
        `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
        profile.email || '',
        profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
        attr ? `${attr.cleanName} (↳ ${attr.landingPath})` : 'Direct',
        profile.social_handle || profile.socialHandle || '',
        profile.website || profile.client_website || '',
        categoriesStr,
        getBuyerTypeLabel(profile),
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
    const headers = ['Name', 'Business', 'City', 'Email', 'Phone', 'Social Handle', 'Website', 'Categories', 'Type', 'Behavior'];
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
        profile.social_handle || profile.socialHandle || '',
        profile.website || profile.client_website || '',
        categoriesStr,
        getBuyerTypeLabel(profile),
        getBuyingBehaviorLabel(profile.buying_behavior),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Clean Header */}
      <div className="pipeline-page-header">
        <div className="pipeline-header-left">
          <h1 className="pipeline-page-title">Accounts</h1>
          <p className="pipeline-page-subtitle">Manage customer and buyer accounts</p>
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
            placeholder="Search by name, email, phone, social, or website..."
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
            <option value="all">All</option>
            <option value="customer">Customer</option>
            <option value="business">Business</option>
            <option value="vendor">Seller</option>
            <option value="locked">Locked</option>
            <option value="incomplete">Drop Off</option>
          </select>

          <select
            value={acquisitionFilter}
            onChange={(e) => setAcquisitionFilter(e.target.value)}
            className="pipeline-filter-select"
            title="Filter leads by acquisition source"
          >
            <option value="all">All Channels</option>
            <option value="ai">🤖 AI Assistants</option>
            <option value="search">🔍 Search Engines</option>
            <option value="social">📱 Social Media</option>
            <option value="referral">🌐 Referral Sites</option>
            <option value="direct">🧭 Direct / App Links</option>
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
                <th className="pipeline-col-sno">S.No.</th>
                <th className="pipeline-col-registered">Registered</th>
                <th className="pipeline-col-buyer">Buyer</th>
                <th className="pipeline-col-acquisition">Acquisition</th>
                <th className="pipeline-col-type">Type</th>
                <th className="pipeline-col-items">Cart & Fav</th>
                <th className="pipeline-col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedProfiles.map((profile, index) => {
                const cartRows = userCartMap.get(profile.id) || [];
                const favoriteRows = userFavoriteMap.get(profile.id) || [];

                const storefront = storefrontsByReseller[profile.id] || (profile.user_id ? storefrontsByReseller[profile.user_id] : null);
                const storeSlug = storefront?.slug || profile.reseller_slug || profile.store_slug;
                const rawCustomDomain = storefront?.custom_domain || profile.custom_domain;
                const storeUrl = rawCustomDomain
                  ? (rawCustomDomain.startsWith('http') ? rawCustomDomain : `https://${rawCustomDomain}`)
                  : (storeSlug ? `/s/${storeSlug}` : null);
                const storeDisplayName = storefront?.store_name || (storeSlug ? `/s/${storeSlug}` : 'View Store');

                return (
                  <tr key={profile.id}>
                    <td className="pipeline-col-sno"><strong>{sortedProfiles.length - index}</strong></td>
                    <td className="pipeline-col-registered">
                      {profile.created_at ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>
                            {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </strong>
                          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                            {new Date(profile.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="pipeline-col-buyer">
                      <div className="pipeline-buyer-cell">
                        <strong
                          className="admin-capitalize"
                          title={profile.full_name || profile.business_name || 'Unnamed'}
                        >
                          {profile.full_name || profile.business_name || 'Unnamed'}
                        </strong>
                        {profile.business_name && profile.full_name && (
                          <span className="pipeline-buyer-business" title={profile.business_name}>
                            {profile.business_name}
                          </span>
                        )}
                        {(profile.city || profile.pincode) && (
                          <span
                            className="pipeline-buyer-location"
                            title={`${profile.city || 'No City'}${profile.pincode ? `, ${profile.pincode}` : ''}`}
                          >
                            {profile.city || 'No City'}{profile.pincode ? `, ${profile.pincode}` : ''}
                          </span>
                        )}
                        {profile.email && (
                          <a
                            href={`mailto:${profile.email}`}
                            className="pipeline-buyer-email"
                            title={profile.email}
                          >
                            {profile.email}
                          </a>
                        )}
                        {profile.whatsapp && (
                          <a
                            href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="pipeline-buyer-phone"
                            title={profile.whatsapp}
                          >
                            {profile.whatsapp}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="pipeline-col-acquisition">
                      {(() => {
                        const attr = acquisitionMap.get(profile.id);
                        if (!attr) return <span className="pipeline-text-muted">—</span>;
                        return (
                          <div className="pipeline-acquisition-cell" title={attr.tooltip}>
                            <span className={`acquisition-badge ${attr.badgeClass}`}>
                              <span className="attr-icon">{attr.icon}</span>
                              <span className="attr-name">{attr.cleanName}</span>
                            </span>
                            {attr.landingPath && (
                              <span className="acquisition-landing-path" title={`Landing route: ${attr.landingPath}`}>
                                ↳ {attr.landingPath}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="pipeline-col-type">
                      <span className="pipeline-type-label" onClick={() => openInspectModal(profile)} style={{ cursor: 'pointer' }}>
                        {getBuyerTypeLabel(profile)}
                      </span>
                      {isAccountLocked(profile) && (
                        <span className="pipeline-locked-tag" title="Account locked: User must complete profile details in Accounts > Profile">
                          <Lock size={10} /> Locked
                        </span>
                      )}
                      {profile.qualification?.monthly_budget_label && (
                        <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }} title={`Monthly Budget: ${profile.qualification.monthly_budget_label}`}>
                          {profile.qualification.monthly_budget_label}
                        </span>
                      )}
                    </td>
                    <td className="pipeline-col-items">
                      <div className="pipeline-items-cell">
                        <button
                          type="button"
                          onClick={() => setSelectedUserList({ profile, type: 'cart' })}
                          className={`admin-list-link-btn cart-btn ${cartRows.length > 0 ? 'has-items' : 'empty'}`}
                          disabled={cartRows.length === 0}
                          title={cartRows.length > 0 ? `View ${cartRows.length} cart ${cartRows.length === 1 ? 'item' : 'items'}` : 'Cart is empty'}
                        >
                          <ShoppingBag size={14} strokeWidth={2.2} />
                          <span>{cartRows.length} Cart</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedUserList({ profile, type: 'favorite' })}
                          className={`admin-list-link-btn fav-btn ${favoriteRows.length > 0 ? 'has-items' : 'empty'}`}
                          disabled={favoriteRows.length === 0}
                          title={favoriteRows.length > 0 ? `View ${favoriteRows.length} favourite ${favoriteRows.length === 1 ? 'item' : 'items'}` : 'No favourites'}
                        >
                          <Heart size={14} strokeWidth={2.2} />
                          <span>{favoriteRows.length} {favoriteRows.length === 1 ? 'Fav' : 'Favs'}</span>
                        </button>
                      </div>
                    </td>
                    <td className="pipeline-col-action">
                      <div className="pipeline-action-cell">
                        <div className="pipeline-action-buttons-row">
                          <button
                            type="button"
                            onClick={() => openInspectModal(profile)}
                            className="pipeline-action-details-btn"
                            title="View all signup details and switch account type"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
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
                          {storeUrl && (
                            <a
                              href={storeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pipeline-action-icon-btn pipeline-store-link-btn"
                              title={`Open reseller storefront: ${storeDisplayName} (${storeUrl})`}
                            >
                              <Globe size={14} />
                            </a>
                          )}
                        </div>
                        {toggleResellerDashboard && (
                          <label
                            className="pipeline-switch-toggle"
                            title={`Reseller Website: ${profile.reseller_dashboard_enabled ? 'Enabled' : 'Disabled'} (Click to toggle)`}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(profile.reseller_dashboard_enabled)}
                              onChange={() => toggleResellerDashboard(profile, !profile.reseller_dashboard_enabled)}
                              aria-label="Toggle Reseller Website"
                            />
                            <span className="pipeline-switch-track">
                              <span className="pipeline-switch-thumb" />
                            </span>
                            <span className={`pipeline-switch-label ${profile.reseller_dashboard_enabled ? 'active' : ''}`}>
                              Website
                            </span>
                          </label>
                        )}
                      </div>
                    </td>
                  </tr>
                );

              })}
              {displayedProfiles.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-table-empty">No profiles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row count summary */}
      <div className="pipeline-footer-summary">
        Showing {displayedProfiles.length} of {sortedProfiles.length} accounts
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

      {/* =====================================================================
          ACCOUNT DETAILS & ROLE SWITCH MODAL
          ===================================================================== */}
      {inspectProfile && (
        <div className="admin-modal-overlay" onClick={() => setInspectProfile(null)}>
          <div
            className="pipeline-account-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="pipeline-modal-header">
              <div className="pipeline-modal-header-left">
                <div className="pipeline-modal-title-row">
                  <h3 className="pipeline-modal-title">
                    {toTitleCase(inspectProfile.full_name) || inspectProfile.business_name || 'Account Details'}
                  </h3>
                  <div className="pipeline-modal-badges">
                    <span className={`pipeline-role-tag ${getProfileRoleKey(inspectProfile)}`}>
                      {getBuyerTypeLabel(inspectProfile)}
                    </span>
                    {isAccountLocked(inspectProfile) ? (
                      <span className="pipeline-locked-tag">
                        <Lock size={11} /> Locked (Pending Profile)
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '999px', border: '1px solid #bbf7d0' }}>
                        ✓ Active &amp; Unlocked
                      </span>
                    )}
                  </div>
                </div>
                <p className="pipeline-modal-meta">
                  User ID: {inspectProfile.id.slice(0, 8)}... • Registered:{' '}
                  {inspectProfile.created_at
                    ? new Date(inspectProfile.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'N/A'}
                </p>
              </div>
              <button
                type="button"
                className="pipeline-modal-close"
                onClick={() => setInspectProfile(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="pipeline-modal-body">
              {/* Quick Contact & Actions Bar */}
              <div className="pipeline-quick-actions-bar">
                {inspectProfile.whatsapp && (
                  <a
                    href={`https://wa.me/${String(inspectProfile.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${toTitleCase(inspectProfile.full_name) || 'there'}, greetings from Weave365 Admin team!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pipeline-qa-btn whatsapp"
                  >
                    <WhatsappIcon size={15} />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
                {inspectProfile.email && (
                  <a
                    href={`mailto:${inspectProfile.email}`}
                    className="pipeline-qa-btn email"
                  >
                    <Mail size={14} />
                    <span>{inspectProfile.email}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyUserDetails(inspectProfile)}
                  className="pipeline-qa-btn copy"
                >
                  <Copy size={14} />
                  <span>{copyFeedback[inspectProfile.id] ? 'Copied Details!' : 'Copy Summary'}</span>
                </button>
              </div>

              {/* CARD 1: Core Contact & Location */}
              <div className="pipeline-detail-card">
                <div className="pipeline-detail-card-head">
                  <h4 className="pipeline-detail-card-title">
                    <Users size={16} /> Contact &amp; Location
                  </h4>
                </div>
                <div className="pipeline-detail-grid">
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Full Name</span>
                    <span className="pipeline-detail-val">{toTitleCase(inspectProfile.full_name) || '—'}</span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Firm / Business Name</span>
                    <span className="pipeline-detail-val">{inspectProfile.business_name || '—'}</span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Email</span>
                    <span className="pipeline-detail-val">{inspectProfile.email || '—'}</span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Phone / WhatsApp</span>
                    <span className="pipeline-detail-val">{inspectProfile.whatsapp || inspectProfile.whatsapp_number || '—'}</span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">City &amp; State</span>
                    <span className="pipeline-detail-val">
                      {inspectProfile.city || ''}
                      {inspectProfile.state ? `, ${inspectProfile.state}` : ''}
                      {!inspectProfile.city && !inspectProfile.state ? '—' : ''}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Pincode &amp; Country</span>
                    <span className="pipeline-detail-val">
                      {inspectProfile.pincode || ''}
                      {inspectProfile.country ? ` (${inspectProfile.country})` : ''}
                      {!inspectProfile.pincode ? '—' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: Online & Marketing */}
              <div className="pipeline-detail-card">
                <div className="pipeline-detail-card-head">
                  <h4 className="pipeline-detail-card-title">
                    <Globe size={16} /> Online Presence &amp; Marketing
                  </h4>
                </div>
                <div className="pipeline-detail-grid">
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Social Handle</span>
                    <span className="pipeline-detail-val">
                      {(() => {
                        const s = getSocialInfo(inspectProfile.social_handle || inspectProfile.socialHandle);
                        if (!s) return '—';
                        return (
                          <a href={s.url} target="_blank" rel="noopener noreferrer">
                            {s.display} ↗
                          </a>
                        );
                      })()}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Website / Store</span>
                    <span className="pipeline-detail-val">
                      {(() => {
                        const w = getWebsiteInfo(inspectProfile.website || inspectProfile.client_website);
                        if (!w) return '—';
                        return (
                          <a href={w.url} target="_blank" rel="noopener noreferrer">
                            {w.display} ↗
                          </a>
                        );
                      })()}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Acquisition Channel</span>
                    <span className="pipeline-detail-val">
                      {(() => {
                        const attr = acquisitionMap.get(inspectProfile.id);
                        if (!attr) return 'Direct / None';
                        return `${attr.cleanName} ${attr.landingPath ? `(↳ ${attr.landingPath})` : ''}`;
                      })()}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Reseller Storefront</span>
                    <span className="pipeline-detail-val">
                      {storefrontsByReseller[inspectProfile.id]?.slug ? (
                        <a href={`/s/${storefrontsByReseller[inspectProfile.id].slug}`} target="_blank" rel="noopener noreferrer">
                          /s/{storefrontsByReseller[inspectProfile.id].slug} ↗
                        </a>
                      ) : (
                        'None'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 3: Business & Qualification Details */}
              <div className="pipeline-detail-card">
                <div className="pipeline-detail-card-head">
                  <h4 className="pipeline-detail-card-title">
                    <Building size={16} /> Business Qualification Details
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Entered during signup or profile update
                  </span>
                </div>
                <div className="pipeline-detail-grid">
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Business Type</span>
                    <span className="pipeline-detail-val">
                      {inspectProfile.qualification?.business_type_label ||
                        BUSINESS_TYPES.find((b) => b.id === inspectProfile.qualification?.business_type)?.label ||
                        inspectProfile.qualification?.business_type ||
                        inspectProfile.buyer_subtype ||
                        '—'}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Industry Experience</span>
                    <span className="pipeline-detail-val">
                      {formatExperienceLabel(inspectProfile.qualification?.business_experience)}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Monthly Budget</span>
                    <span className="pipeline-detail-val">
                      {inspectProfile.qualification?.monthly_budget_label ||
                        formatBudgetLabel(inspectProfile.qualification?.monthly_budget)}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Sales Channels</span>
                    <span className="pipeline-detail-val">
                      {formatSalesChannelsLabel(inspectProfile.qualification?.sales_channels)}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Purchase Intent</span>
                    <span className="pipeline-detail-val">
                      {formatPurchaseIntentLabel(inspectProfile.qualification?.purchase_intent)}
                    </span>
                  </div>
                  <div className="pipeline-detail-item">
                    <span className="pipeline-detail-label">Buying Behavior</span>
                    <span className="pipeline-detail-val">
                      {getBuyingBehaviorLabel(inspectProfile.buying_behavior) || 'Immediate'}
                    </span>
                  </div>
                  <div className="pipeline-detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="pipeline-detail-label">Interested Categories</span>
                    <span className="pipeline-detail-val">
                      {Array.isArray(inspectProfile.interested_categories) && inspectProfile.interested_categories.length > 0
                        ? inspectProfile.interested_categories.join(', ')
                        : 'Saree'}
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 4: Supplier Details (if available or relevant) */}
              {(isVendorProfile(inspectProfile) || inspectProfile.qualification?.has_gst || inspectProfile.qualification?.weaving_specialisation) && (
                <div className="pipeline-detail-card">
                  <div className="pipeline-detail-card-head">
                    <h4 className="pipeline-detail-card-title">
                      <Layers size={16} /> Supplier &amp; Manufacturing Details
                    </h4>
                  </div>
                  <div className="pipeline-detail-grid">
                    <div className="pipeline-detail-item">
                      <span className="pipeline-detail-label">GST Registered</span>
                      <span className="pipeline-detail-val">
                        {inspectProfile.qualification?.has_gst || 'No'}
                        {inspectProfile.qualification?.gstin ? ` (${inspectProfile.qualification.gstin})` : ''}
                      </span>
                    </div>
                    <div className="pipeline-detail-item">
                      <span className="pipeline-detail-label">Supplier Type</span>
                      <span className="pipeline-detail-val">
                        {inspectProfile.qualification?.business_type || 'Weaver'}
                      </span>
                    </div>
                    <div className="pipeline-detail-item">
                      <span className="pipeline-detail-label">Weaving Specialisations</span>
                      <span className="pipeline-detail-val">
                        {Array.isArray(inspectProfile.qualification?.weaving_specialisation)
                          ? inspectProfile.qualification.weaving_specialisation.join(', ')
                          : inspectProfile.qualification?.weaving_specialisation || 'Handloom'}
                      </span>
                    </div>
                    <div className="pipeline-detail-item">
                      <span className="pipeline-detail-label">Manufacturing Location</span>
                      <span className="pipeline-detail-val">
                        {inspectProfile.qualification?.manufacturing_location || 'Varanasi'}
                        {inspectProfile.qualification?.other_city_name ? ` (${inspectProfile.qualification.other_city_name})` : ''}
                      </span>
                    </div>
                    <div className="pipeline-detail-item">
                      <span className="pipeline-detail-label">Price Range</span>
                      <span className="pipeline-detail-val">
                        {inspectProfile.qualification?.wholesale_price_range || '—'}
                      </span>
                    </div>
                    <div className="pipeline-detail-item">
                      <span className="pipeline-detail-label">Vendor Tag Code</span>
                      <span className="pipeline-detail-val">
                        {inspectProfile.vendor_code || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD 5: SWITCH ACCOUNT TYPE (ADMIN CORE ACTION) */}
              <div className="pipeline-switch-role-card">
                <div className="pipeline-switch-header">
                  <div className="pipeline-switch-title-wrap">
                    <Shield size={16} />
                    <span className="pipeline-switch-title">Switch Account Type</span>
                  </div>
                  <span className="pipeline-switch-hint">Takes effect on save</span>
                </div>

                <div className="pipeline-role-selector-row">
                  <button
                    type="button"
                    className={`pipeline-role-chip ${selectedRoleToSet === 'customer' ? 'active' : ''}`}
                    onClick={() => handleRoleSelectionChange('customer')}
                  >
                    <span className="role-chip-name">Customer</span>
                    <span className="role-chip-sub">Personal retail</span>
                  </button>

                  <button
                    type="button"
                    className={`pipeline-role-chip ${selectedRoleToSet === 'reseller' ? 'active' : ''}`}
                    onClick={() => handleRoleSelectionChange('reseller')}
                  >
                    <span className="role-chip-name">Business &amp; Reseller</span>
                    <span className="role-chip-sub">Wholesale pricing</span>
                  </button>

                  <button
                    type="button"
                    className={`pipeline-role-chip ${selectedRoleToSet === 'supplier' ? 'active' : ''}`}
                    onClick={() => handleRoleSelectionChange('supplier')}
                  >
                    <span className="role-chip-name">Supplier Partner</span>
                    <span className="role-chip-sub">Artisan / Weaver</span>
                  </button>
                </div>

                {/* Minimal Lock Toggle */}
                <div className="pipeline-role-lock-toggle">
                  <label className="pipeline-lock-checkbox-label">
                    <input
                      type="checkbox"
                      id="pipeline-force-lock-check"
                      checked={lockStatusToSet}
                      onChange={(e) => setLockStatusToSet(e.target.checked)}
                    />
                    <span>Lock account until user completes profile</span>
                  </label>
                  {selectedRoleToSet !== 'customer' && !isCategoryDetailsComplete(inspectProfile, selectedRoleToSet) && (
                    <span className="pipeline-lock-auto-badge" title="Required profile details have not been submitted">
                      <Lock size={11} /> Required details missing
                    </span>
                  )}
                </div>

                {/* Actions & Feedback */}
                <div className="pipeline-switch-actions">
                  <div className="pipeline-switch-feedback-area">
                    {roleSwitchSuccess && (
                      <span className="pipeline-switch-inline-msg success">✓ {roleSwitchSuccess}</span>
                    )}
                    {roleSwitchError && (
                      <span className="pipeline-switch-inline-msg error">{roleSwitchError}</span>
                    )}
                  </div>
                  <div className="pipeline-switch-btn-group">
                    <button
                      type="button"
                      onClick={() => setInspectProfile(null)}
                      className="pipeline-switch-cancel-btn"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRoleSwitch}
                      disabled={switchingRole}
                      className="pipeline-save-role-btn"
                    >
                      {switchingRole ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
