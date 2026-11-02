import { useCallback, useEffect, useMemo, useState } from 'react';
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
  RotateCcw,
} from '../../components/icons.jsx';
import { WhatsappIcon } from '../../components/WhatsappIcon.jsx';
import { normalizeBuyerType, isVendorProfile, isAccountLocked, isCategoryDetailsComplete, isDropOffAccount } from '../../utils/buyerAccess.js';
import { adminEmails, storeConfig } from '../../config.js';
import {
  joinByUser,
  isAdminUser,
  AdminLoadingScreen,
} from './AdminShared.jsx';
import { resolveBuyerAcquisition } from '../../utils/acquisitionResolver.js';
import { resolveBuyerPresence } from '../../utils/presenceResolver.js';
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
  loading = false,
}) {
  // Local state for filters and sorting
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [acquisitionFilter, setAcquisitionFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [userPageLimit, setUserPageLimit] = useState('15');
  const [currentPage, setCurrentPage] = useState(1);
  const [userSortField, setUserSortField] = useState('last_seen');
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
    const presenceData = adminData?.userPresence || {};
    (adminData.profiles || []).forEach((p) => {
      const authAcq = presenceData[p.id]?.acquisition;
      const profileWithAcq = authAcq ? { ...p, acquisition: p.acquisition || authAcq } : p;
      map.set(p.id, resolveBuyerAcquisition(profileWithAcq, siteAnalyticsList));
    });
    return map;
  }, [adminData.profiles, adminData.userPresence, siteAnalyticsList]);

  // Real-time & historical "Last Seen" presence map
  const presenceMap = useMemo(() => {
    const map = new Map();
    const presenceData = adminData?.userPresence || {};
    const ordersList = adminData?.optional?.orders || [];
    const inqList = adminData?.optional?.inquiries || [];
    const dlList = adminData?.optional?.download_logs || [];

    (adminData.profiles || []).forEach((p) => {
      const presence = resolveBuyerPresence(p, {
        userPresenceMap: presenceData,
        cartRows: userCartMap.get(p.id) || [],
        favoriteRows: userFavoriteMap.get(p.id) || [],
        orders: ordersList.filter((o) => o.user_id === p.id || o.buyer_id === p.id || (p.email && o.customer_email === p.email)),
        inquiries: inqList.filter((i) => i.user_id === p.id || (p.email && i.email === p.email) || (p.whatsapp && i.phone === p.whatsapp)),
        downloadLogs: dlList.filter((d) => d.user_id === p.id || (p.email && d.user_email === p.email)),
      });
      map.set(p.id, presence);
    });
    return map;
  }, [adminData.profiles, adminData.userPresence, adminData.optional, userCartMap, userFavoriteMap]);

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
    if (isVendorProfile(p) || p.user_type === 'supplier' || p.role === 'vendor' || p.buyer_type === 'vendor') {
      return 'supplier';
    }
    const subtype = String(p.buyer_subtype || '').toLowerCase().trim();
    // Explicit Customer assignment takes precedence over fallback heuristics
    if (
      (p.user_type === 'customer' || p.role === 'customer' || p.buyer_type === 'customer' || subtype === 'customer') &&
      p.user_type !== 'business' &&
      p.user_type !== 'supplier' &&
      p.role !== 'reseller' &&
      p.role !== 'vendor' &&
      p.buyer_type !== 'business' &&
      p.buyer_type !== 'reseller' &&
      p.buyer_type !== 'vendor'
    ) {
      return 'customer';
    }
    if (subtype.includes('reseller') || subtype.includes('wholeseller') || p.role === 'reseller' || p.user_type === 'business' || p.buyer_type === 'business' || p.buyer_type === 'reseller') {
      return 'reseller';
    }
    const isBusiness = (p.buyer_subtype && p.buyer_subtype.toLowerCase() !== 'customer') || Boolean(p.business_name?.trim());
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
      setLockStatusToSet(!isComplete || isDropOffAccount(inspectProfile));
    } else {
      setLockStatusToSet(isDropOffAccount(inspectProfile));
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
        const existingSub = String(inspectProfile.buyer_subtype || '').toLowerCase().trim();
        const isBuyerSub = existingSub && !['customer', 'user', 'supplier', 'vendor', 'weaver', 'cluster'].includes(existingSub);
        newBuyerSubtype = inspectProfile.qualification?.business_type_label || (isBuyerSub ? inspectProfile.buyer_subtype : 'Reseller');
      } else if (selectedRoleToSet === 'supplier') {
        newUserType = 'supplier';
        newRole = 'vendor';
        newBuyerType = 'vendor';
        const existingSub = String(inspectProfile.buyer_subtype || '').toLowerCase().trim();
        const isVendorSub = existingSub && !['customer', 'user', 'reseller', 'wholesaler', 'wholeseller', 'boutique', 'buyer', 'retailer'].includes(existingSub);
        newBuyerSubtype = inspectProfile.qualification?.business_type || (isVendorSub ? inspectProfile.buyer_subtype : 'Supplier');
      }

      // Respect the admin's manual lock status selection (allow admin override)
      const finalLockStatus = Boolean(lockStatusToSet);

      const existingQual = (typeof inspectProfile.qualification === 'object' && inspectProfile.qualification) ? inspectProfile.qualification : {};
      const newQual = {
        ...existingQual,
        ...(selectedRoleToSet === 'customer' ? { business_type: null, business_type_label: null, user_type: 'customer' } : {}),
        account_locked: finalLockStatus,
        locked_reason: finalLockStatus ? (existingQual.locked_reason || 'switched_by_admin_pending_details') : null,
        ...(finalLockStatus === false ? { form_completed: true } : {}),
      };

      // When switching to customer, clear firm/business name; otherwise resolve business name
      const resolvedBusinessName = selectedRoleToSet === 'customer'
        ? ''
        : (inspectProfile.business_name?.trim() || (selectedRoleToSet === 'reseller' ? inspectProfile.full_name?.trim() : ''));

      const updateData = {
        user_type: newUserType,
        role: newRole,
        buyer_type: newBuyerType,
        buyer_subtype: newBuyerSubtype,
        business_name: resolvedBusinessName,
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
          `Account type updated to ${selectedRoleToSet === 'supplier' ? 'Supplier' : (selectedRoleToSet === 'reseller' ? 'Business & Reseller' : 'Customer')}! ${finalLockStatus ? 'Account is locked pending required profile details.' : 'Account is unlocked.'}`
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

  const isIncomplete = (p) => isDropOffAccount(p);

  const sortedProfiles = useMemo(() => {
    let profiles = (adminData.profiles || []).filter((p) => {
      const email = String(p.email || '').toLowerCase().trim();
      const isConfiguredAdmin = (adminEmails || []).some((adm) => String(adm).toLowerCase().trim() === email);
      return !isAdminUser(p) && !isConfiguredAdmin && p.role !== 'admin';
    });

    // Filter by Role
    if (roleFilter !== 'all') {
      profiles = profiles.filter((p) => {
        const roleKey = getProfileRoleKey(p);
        if (roleFilter === 'reseller' || roleFilter === 'business') {
          return roleKey === 'reseller';
        }
        if (roleFilter === 'customer') {
          return roleKey === 'customer';
        }
        if (roleFilter === 'supplier' || roleFilter === 'vendor') {
          return roleKey === 'supplier';
        }
        return true;
      });
    }

    // Filter by Account Status
    if (statusFilter !== 'all') {
      if (statusFilter === 'locked') {
        profiles = profiles.filter((p) => isAccountLocked(p));
      } else if (statusFilter === 'dropoff' || statusFilter === 'incomplete') {
        profiles = profiles.filter((p) => isIncomplete(p));
      } else if (statusFilter === 'active') {
        profiles = profiles.filter((p) => !isAccountLocked(p) && !isIncomplete(p));
      }
    }

    // Filter by marketing acquisition channel
    if (acquisitionFilter !== 'all') {
      profiles = profiles.filter((p) => {
        const attr = acquisitionMap.get(p.id);
        return attr && attr.type === acquisitionFilter;
      });
    }

    // Filter by online status / activity timeline
    if (activityFilter === 'online') {
      profiles = profiles.filter((p) => presenceMap.get(p.id)?.isOnline === true);
    } else if (activityFilter === 'today') {
      profiles = profiles.filter((p) => presenceMap.get(p.id)?.isToday === true);
    } else if (activityFilter === 'week') {
      profiles = profiles.filter((p) => presenceMap.get(p.id)?.isThisWeek === true);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      profiles = profiles.filter((p) => {
        const name = String(p.full_name || p.business_name || '').toLowerCase();
        const email = String(p.email || '').toLowerCase();
        const phone = String(p.whatsapp || p.whatsapp_number || p.phone || '').toLowerCase();
        const city = String(p.city || p.location_city || '').toLowerCase();
        const social = String(p.social_handle || p.socialHandle || '').toLowerCase();
        const website = String(p.website || p.client_website || '').toLowerCase();
        const attr = acquisitionMap.get(p.id);
        const attrText = attr ? `${attr.cleanName} ${attr.landingPath} ${attr.category}`.toLowerCase() : '';
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          social.includes(q) ||
          website.includes(q) ||
          attrText.includes(q)
        );
      });
    }
    return [...profiles].sort((a, b) => {
      let valA, valB;
      if (userSortField === 'last_seen') {
        valA = presenceMap.get(a.id)?.timestamp || 0;
        valB = presenceMap.get(b.id)?.timestamp || 0;
      } else if (userSortField === 'name') {
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
  }, [adminData.profiles, userCartMap, userFavoriteMap, userSortField, userSortOrder, roleFilter, statusFilter, acquisitionFilter, activityFilter, acquisitionMap, presenceMap, searchQuery]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setAcquisitionFilter('all');
    setActivityFilter('all');
  }, []);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (searchQuery.trim()) {
      filters.push({
        id: 'search',
        label: `Search: "${searchQuery.trim()}"`,
        onRemove: () => setSearchQuery(''),
      });
    }
    if (roleFilter !== 'all') {
      const roleLabels = {
        reseller: 'Role: Business',
        business: 'Role: Business',
        customer: 'Role: Customer',
        supplier: 'Role: Seller',
        vendor: 'Role: Seller',
      };
      filters.push({
        id: 'role',
        label: roleLabels[roleFilter] || `Role: ${roleFilter}`,
        onRemove: () => setRoleFilter('all'),
      });
    }
    if (statusFilter !== 'all') {
      const statusLabels = {
        active: 'Status: Active',
        dropoff: 'Status: Drop Off',
        incomplete: 'Status: Drop Off',
        locked: 'Status: Locked',
      };
      filters.push({
        id: 'status',
        label: statusLabels[statusFilter] || `Status: ${statusFilter}`,
        onRemove: () => setStatusFilter('all'),
      });
    }
    if (acquisitionFilter !== 'all') {
      const channelLabels = {
        ai: 'Channel: AI Assistants',
        search: 'Channel: Search Engines',
        social: 'Channel: Social Media',
        referral: 'Channel: Referral Sites',
        direct: 'Channel: Direct Links',
      };
      filters.push({
        id: 'acquisition',
        label: channelLabels[acquisitionFilter] || `Channel: ${acquisitionFilter}`,
        onRemove: () => setAcquisitionFilter('all'),
      });
    }
    if (activityFilter !== 'all') {
      const activityLabels = {
        online: 'Activity: Online Now',
        today: 'Activity: Active Today',
        week: 'Activity: Active This Week',
      };
      filters.push({
        id: 'activity',
        label: activityLabels[activityFilter] || `Activity: ${activityFilter}`,
        onRemove: () => setActivityFilter('all'),
      });
    }
    return filters;
  }, [searchQuery, roleFilter, statusFilter, acquisitionFilter, activityFilter]);

  const pageSize = parseInt(userPageLimit, 10) || 15;
  const totalPages = Math.max(1, Math.ceil(sortedProfiles.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Reset to page 1 whenever any filter/sort/limit changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, acquisitionFilter, activityFilter, searchQuery, userSortField, userSortOrder, userPageLimit]);

  const displayedProfiles = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return sortedProfiles.slice(startIdx, startIdx + pageSize);
  }, [sortedProfiles, safeCurrentPage, pageSize]);

  const paginationNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  }, [totalPages, safeCurrentPage]);

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
    if (isIncomplete(profile)) return 'Drop Off';
    const roleKey = getProfileRoleKey(profile);
    if (roleKey === 'customer') {
      return 'Customer';
    }
    if (roleKey === 'supplier') {
      const rawSub = String(profile.buyer_subtype || '').trim();
      const cleanSub = rawSub.split('(')[0].split('/')[0].trim();
      if (cleanSub && !['customer', 'user', 'reseller', 'wholesaler', 'wholesale', 'buyer'].includes(cleanSub.toLowerCase())) {
        return toTitleCase(cleanSub);
      }
      return 'Vendor Partner';
    }
    const rawSub = String(profile.buyer_subtype || '').trim();
    if (rawSub) {
      let clean = rawSub.split('(')[0].split('/')[0].trim();
      if (clean.toLowerCase() === 'wholeseller') clean = 'Wholesaler';
      if (clean.toLowerCase() === 'buyer') clean = 'Business';
      if (clean && !['customer', 'user'].includes(clean.toLowerCase())) {
        return toTitleCase(clean);
      }
    }
    if (profile.user_type === 'business' || profile.buyer_type === 'business' || profile.buyer_type === 'reseller' || profile.role === 'reseller' || Boolean(profile.business_name?.trim())) {
      return 'Business Buyer';
    }
    return 'Customer';
  };

  const getBuyerRoleClass = (profile) => {
    if (isIncomplete(profile)) return 'type-dropoff';
    const label = String(getBuyerTypeLabel(profile) || '').toLowerCase();
    if (label.includes('store') || label.includes('boutique')) return 'type-store';
    if (label.includes('reseller') || label.includes('business') || label.includes('wholesale')) return 'type-reseller';
    if (label.includes('vendor') || label.includes('supplier')) return 'type-supplier';
    return 'type-customer';
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
    const presence = presenceMap.get(profile.id);
    const lastSeenStr = presence?.isOnline ? 'Online (Active now)' : (presence?.fullFormatted || 'Never');

    const row = [
      toTitleCase(profile.full_name),
      toTitleCase(profile.business_name),
      `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
      profile.email || '',
      profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
      lastSeenStr,
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
      const presence = presenceMap.get(profile.id);
      const lastSeenStr = presence?.isOnline ? 'Online (Active now)' : (presence?.fullFormatted || 'Never');

      return [
        toTitleCase(profile.full_name),
        toTitleCase(profile.business_name),
        `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
        profile.email || '',
        profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
        lastSeenStr,
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
    const headers = ['Name', 'Business', 'City', 'Email', 'Phone', 'Registered', 'Last Seen', 'Acquisition', 'Social Handle', 'Website', 'Categories', 'Type', 'Behavior'];
    const csvRows = sortedProfiles.map(profile => {
      const categoriesStr = Array.isArray(profile.interested_categories)
        ? profile.interested_categories.join('; ')
        : '';
      const attr = acquisitionMap.get(profile.id);
      const presence = presenceMap.get(profile.id);
      const lastSeenStr = presence?.isOnline ? 'Online (Active now)' : (presence?.fullFormatted || 'Never');
      const registeredStr = profile.created_at ? new Date(profile.created_at).toLocaleString('en-US') : 'N/A';
      return [
        toTitleCase(profile.full_name),
        toTitleCase(profile.business_name),
        `${toTitleCase(profile.city)}${profile.city && profile.pincode ? ', ' : ''}${profile.pincode || ''}`,
        profile.email || '',
        profile.whatsapp ? profile.whatsapp.replace('+', '') : '',
        registeredStr,
        lastSeenStr,
        attr ? `${attr.cleanName} (${attr.landingPath || '/'})` : 'Direct',
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

  if (loading || status === 'loading' || !adminData?.hasLoaded) {
    return (
      <AdminLoadingScreen
        title="Loading Customer Accounts..."
        subtitle="Fetching registered buyers, tiers, and purchase intent…"
      />
    );
  }

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
        <div className="pipeline-filter-field pipeline-search-wrap">
          <label className="pipeline-field-label">Search</label>
          <div className="pipeline-search-input-wrap">
            <Search size={16} className="pipeline-search-icon" />
            <input
              type="text"
              placeholder="Name, email, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pipeline-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="pipeline-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="pipeline-filters">
          {/* Role Filter */}
          <div className="pipeline-filter-field">
            <label className={`pipeline-field-label ${roleFilter !== 'all' ? 'is-active' : ''}`} htmlFor="filter-role">Role</label>
            <select
              id="filter-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`pipeline-filter-select ${roleFilter !== 'all' ? 'is-active' : ''}`}
            >
              <option value="all">All Roles</option>
              <option value="business">Business (Reseller)</option>
              <option value="customer">Customer (Retail)</option>
              <option value="supplier">Seller (Supplier)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="pipeline-filter-field">
            <label className={`pipeline-field-label ${statusFilter !== 'all' ? 'is-active' : ''}`} htmlFor="filter-status">Status</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pipeline-filter-select ${statusFilter !== 'all' ? 'is-active' : ''}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="dropoff">Drop Off</option>
              <option value="locked">Locked</option>
            </select>
          </div>

          {/* Acquisition Channel Filter */}
          <div className="pipeline-filter-field">
            <label className={`pipeline-field-label ${acquisitionFilter !== 'all' ? 'is-active' : ''}`} htmlFor="filter-channel">Channel</label>
            <select
              id="filter-channel"
              value={acquisitionFilter}
              onChange={(e) => setAcquisitionFilter(e.target.value)}
              className={`pipeline-filter-select ${acquisitionFilter !== 'all' ? 'is-active' : ''}`}
            >
              <option value="all">All Channels</option>
              <option value="ai">🤖 AI Assistants</option>
              <option value="search">🔍 Search Engines</option>
              <option value="social">📱 Social Media</option>
              <option value="referral">🌐 Referral Sites</option>
              <option value="direct">🧭 Direct Links</option>
            </select>
          </div>

          {/* Activity Filter */}
          <div className="pipeline-filter-field">
            <label className={`pipeline-field-label ${activityFilter !== 'all' ? 'is-active' : ''}`} htmlFor="filter-activity">Activity</label>
            <select
              id="filter-activity"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className={`pipeline-filter-select ${activityFilter !== 'all' ? 'is-active' : ''}`}
            >
              <option value="all">All Activity</option>
              <option value="online">🟢 Online Now</option>
              <option value="today">⚡ Active Today</option>
              <option value="week">📅 Active This Week</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="pipeline-filter-field pipeline-filter-action">
            <label className="pipeline-field-label pipeline-label-action">
              {activeFilters.length > 0 ? `${activeFilters.length} Active` : '\u00A0'}
            </label>
            <button
              type="button"
              onClick={handleResetFilters}
              className={`pipeline-reset-filters-btn ${activeFilters.length > 0 ? 'has-active' : ''}`}
              title="Reset all filters and search"
            >
              <RotateCcw size={13} className="reset-icon" />
              <span>Reset</span>
            </button>
          </div>

          <div className="pipeline-toolbar-divider" aria-hidden="true" />

          {/* Sort Field */}
          <div className="pipeline-filter-field">
            <label className="pipeline-field-label" htmlFor="filter-sort">Sort By</label>
            <div className="pipeline-sort-group">
              <select
                id="filter-sort"
                value={userSortField}
                onChange={(e) => setUserSortField(e.target.value)}
                className="pipeline-filter-select"
              >
                <option value="last_seen">Last Seen</option>
                <option value="date">Registered Date</option>
                <option value="name">Name</option>
                <option value="order_list">Orders</option>
                <option value="favourites">Favourites</option>
              </select>
              <button
                type="button"
                onClick={() => setUserSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="pipeline-sort-toggle"
                title={userSortOrder === 'asc' ? 'Ascending (click for Descending)' : 'Descending (click for Ascending)'}
                aria-label="Toggle sort order"
              >
                {userSortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Rows Per Page */}
          <div className="pipeline-filter-field">
            <label className="pipeline-field-label" htmlFor="filter-rows">Rows</label>
            <select
              id="filter-rows"
              value={userPageLimit}
              onChange={(e) => {
                setUserPageLimit(e.target.value);
                setCurrentPage(1);
              }}
              className="pipeline-filter-select"
            >
              <option value="15">15 rows</option>
              <option value="30">30 rows</option>
              <option value="60">60 rows</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Pills Bar */}
      {activeFilters.length > 0 && (
        <div className="pipeline-active-filters-bar">
          <span className="pipeline-active-filter-label">Active filters:</span>
          {activeFilters.map(filter => (
            <span key={filter.id} className="pipeline-active-filter-pill">
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={filter.onRemove}
                title={`Remove ${filter.label}`}
                aria-label={`Remove ${filter.label}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleResetFilters}
            className="pipeline-clear-all-link"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="pipeline-table-container">
        <div className="admin-table-wrap">
          <table className="admin-table pipeline-table">
            <thead>
              <tr>
                <th className="pipeline-col-sno">S.No.</th>
                <th className="pipeline-col-activity">Activity</th>
                <th className="pipeline-col-buyer">Buyer</th>
                <th className="pipeline-col-acquisition">Source</th>
                <th className="pipeline-col-type">Type</th>
                <th className="pipeline-col-items">Items</th>
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
                    <td className="pipeline-col-sno">
                      <span className="pipeline-sno-num">{sortedProfiles.length - ((safeCurrentPage - 1) * pageSize + index)}</span>
                    </td>
                    <td className="pipeline-col-activity">
                      {(() => {
                        const presence = presenceMap.get(profile.id);
                        const joinedStr = profile.created_at
                          ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—';
                        return (
                          <div className="pipeline-timing-cell">
                            <div className="pipeline-timing-main">
                              {presence?.isOnline ? (
                                <span className="pipeline-online-pill">
                                  <span className="pipeline-online-dot" />
                                  <span>Online</span>
                                </span>
                              ) : (
                                <span className="pipeline-last-seen-text" title={`Last active: ${presence?.fullFormatted || 'Never'}`}>
                                  <strong className="pipeline-timing-primary">{presence?.primaryLabel || '—'}</strong>
                                  {presence?.secondaryLabel && (
                                    <span className="pipeline-timing-secondary"> · {presence.secondaryLabel}</span>
                                  )}
                                </span>
                              )}
                            </div>
                            <span className="pipeline-joined-sub" title={profile.created_at ? new Date(profile.created_at).toLocaleString() : ''}>
                              Joined {joinedStr}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="pipeline-col-buyer">
                      <div className="pipeline-buyer-compact">
                        <div className="pipeline-buyer-top-row">
                          <strong
                            className="pipeline-buyer-name admin-capitalize"
                            title={profile.full_name || profile.business_name || 'Unnamed'}
                          >
                            {profile.full_name || profile.business_name || 'Unnamed'}
                          </strong>
                          {profile.business_name && profile.full_name && (
                            <span className="pipeline-buyer-biz-tag" title={profile.business_name}>
                              · {profile.business_name}
                            </span>
                          )}
                        </div>
                        <div className="pipeline-buyer-sub-row">
                          {profile.email && (
                            <a
                              href={`mailto:${profile.email}`}
                              className="pipeline-buyer-sub-link pipeline-buyer-email"
                              title={profile.email}
                            >
                              {profile.email}
                            </a>
                          )}
                          {(profile.city || profile.pincode) && profile.email && (
                            <span className="pipeline-buyer-sub-dot">·</span>
                          )}
                          {(profile.city || profile.pincode) && (
                            <span
                              className="pipeline-buyer-sub-text pipeline-buyer-city"
                              title={`${profile.city || ''}${profile.pincode ? `, ${profile.pincode}` : ''}`}
                            >
                              {profile.city || 'No City'}
                            </span>
                          )}
                          {profile.whatsapp && (profile.email || profile.city) && (
                            <span className="pipeline-buyer-sub-dot">·</span>
                          )}
                          {profile.whatsapp && (
                            <a
                              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="pipeline-buyer-sub-link pipeline-buyer-phone"
                              title={profile.whatsapp}
                            >
                              {profile.whatsapp}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="pipeline-col-acquisition">
                      {(() => {
                        const attr = acquisitionMap.get(profile.id);
                        if (!attr) return <span className="pipeline-empty-dash">—</span>;
                        return (
                          <span
                            className={`acquisition-badge ${attr.badgeClass}`}
                            title={`${attr.cleanName}${attr.landingPath ? ` (Landing: ${attr.landingPath})` : ''}`}
                          >
                            <span className="attr-icon">{attr.icon}</span>
                            <span className="attr-name">{attr.cleanName}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="pipeline-col-type">
                      <span
                        className={`pipeline-type-badge ${getBuyerRoleClass(profile)}`}
                        onClick={() => openInspectModal(profile)}
                        title={`Type: ${profile.buyer_subtype || getBuyerTypeLabel(profile)} (Click to view details or switch role)`}
                      >
                        {getBuyerTypeLabel(profile)}
                      </span>
                      {isAccountLocked(profile) && (
                        <span className="pipeline-locked-tag" title="Account locked" style={{ marginLeft: '4px' }}>
                          <Lock size={10} />
                        </span>
                      )}
                    </td>
                    <td className="pipeline-col-items">
                      <div className="pipeline-items-cell" style={{ flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                        {cartRows.length === 0 && favoriteRows.length === 0 ? (
                          <span className="pipeline-empty-dash" title="No cart or favourite items">—</span>
                        ) : (
                          <>
                            {cartRows.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedUserList({ profile, type: 'cart' })}
                                className="pipeline-item-chip cart"
                                title={`View ${cartRows.length} cart ${cartRows.length === 1 ? 'item' : 'items'}`}
                              >
                                <ShoppingBag size={12} strokeWidth={2.2} />
                                <span>{cartRows.length}</span>
                              </button>
                            )}
                            {favoriteRows.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedUserList({ profile, type: 'favorite' })}
                                className="pipeline-item-chip fav"
                                title={`View ${favoriteRows.length} favourite ${favoriteRows.length === 1 ? 'item' : 'items'}`}
                              >
                                <Heart size={12} strokeWidth={2.2} />
                                <span>{favoriteRows.length}</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="pipeline-col-action">
                      <div className="pipeline-action-stack">
                        <button
                          type="button"
                          onClick={() => openInspectModal(profile)}
                          className="pipeline-action-details-btn"
                          title="View all details & switch account type"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>
                        <div className="pipeline-action-sub-row">
                          <button
                            type="button"
                            onClick={() => handleCopyUserDetails(profile)}
                            className={`pipeline-action-icon-btn ${copyFeedback[profile.id] ? 'copied' : ''}`}
                            title={copyFeedback[profile.id] ? 'Copied!' : 'Copy details'}
                          >
                            {copyFeedback[profile.id] ? (
                              <Check size={13} className="icon-check-anim" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          {storeUrl && (
                            <a
                              href={storeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pipeline-action-icon-btn pipeline-store-link-btn"
                              title={`Open reseller storefront: ${storeDisplayName}`}
                            >
                              <Globe size={12} />
                            </a>
                          )}
                          {toggleResellerDashboard && (
                            <label
                              className={`pipeline-switch-toggle ${profile.reseller_dashboard_enabled ? 'is-enabled' : ''}`}
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
                              <span className="pipeline-switch-label">
                                Web
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );

              })}
              {displayedProfiles.length === 0 && (
                <tr>
                  <td colSpan="7" className="pipeline-empty-cell">
                    <div className="pipeline-empty-state">
                      <Users size={32} className="pipeline-empty-icon" />
                      <p className="pipeline-empty-title">
                        {adminData?.hasLoaded === false ? 'Loading accounts...' : 'No accounts match the selected filters.'}
                      </p>
                      {activeFilters.length > 0 && (
                        <>
                          <p className="pipeline-empty-hint">Try adjusting or clearing your active search and filter criteria.</p>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="pipeline-empty-reset-btn"
                          >
                            <RotateCcw size={14} /> Reset All Filters
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination Bar (Separated from table, no box wrapper) */}
      <div className="pipeline-pagination-bar">
        <div className="pipeline-pagination-info">
          Showing <strong>{sortedProfiles.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}</strong> – <strong>{Math.min(sortedProfiles.length, safeCurrentPage * pageSize)}</strong> of <strong>{sortedProfiles.length}</strong> accounts
          {activeFilters.length > 0 && ` (filtered from ${adminData.profiles?.length || 0} total)`}
        </div>

        {totalPages > 1 && (
          <div className="pipeline-pagination-controls">
            <button
              type="button"
              className="pipeline-page-nav-btn pipeline-page-nav-edge"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              title="First page"
            >
              « First
            </button>
            <button
              type="button"
              className="pipeline-page-nav-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              title="Previous page"
            >
              ‹ Prev
            </button>

            <div className="pipeline-page-numbers">
              {paginationNumbers.map((p, idx) => (
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="pipeline-page-ellipsis">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`pipeline-page-number ${safeCurrentPage === p ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                )
              ))}
            </div>

            <button
              type="button"
              className="pipeline-page-nav-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              title="Next page"
            >
              Next ›
            </button>
            <button
              type="button"
              className="pipeline-page-nav-btn pipeline-page-nav-edge"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              title="Last page"
            >
              Last »
            </button>
          </div>
        )}
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
                        <Lock size={11} /> Locked
                      </span>
                    ) : (
                      <span className="pipeline-active-tag">
                        ✓ Active &amp; Unlocked
                      </span>
                    )}
                  </div>
                </div>
                <p className="pipeline-modal-meta">
                  <span>Registered {inspectProfile.created_at ? new Date(inspectProfile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                  <span className="meta-sep">·</span>
                  {(() => {
                    const presence = presenceMap.get(inspectProfile.id);
                    if (!presence) return <span>Last active: —</span>;
                    if (presence.isOnline) {
                      return (
                        <span className="pipeline-online-pill" style={{ verticalAlign: 'middle' }}>
                          <span className="pipeline-online-dot" />
                          <span>Online Now</span>
                        </span>
                      );
                    }
                    return (
                      <span>
                        Last active: <strong style={{ color: '#334155', fontWeight: 600 }}>{presence.fullFormatted}</strong>
                      </span>
                    );
                  })()}
                  <span className="meta-sep">·</span>
                  <span>ID: <code>{inspectProfile.id.slice(0, 8)}</code></span>
                </p>
              </div>
              <button
                type="button"
                className="pipeline-modal-close"
                onClick={() => setInspectProfile(null)}
                aria-label="Close modal"
              >
                <X size={18} />
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
                    <WhatsappIcon size={14} />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
                {inspectProfile.email && (
                  <a
                    href={`mailto:${inspectProfile.email}`}
                    className="pipeline-qa-btn email"
                  >
                    <Mail size={13} />
                    <span>{inspectProfile.email}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyUserDetails(inspectProfile)}
                  className={`pipeline-qa-btn copy ${copyFeedback[inspectProfile.id] ? 'copied' : ''}`}
                >
                  {copyFeedback[inspectProfile.id] ? (
                    <Check size={13} className="icon-check-anim" />
                  ) : (
                    <Copy size={13} />
                  )}
                  <span>{copyFeedback[inspectProfile.id] ? 'Copied Details!' : 'Copy Summary'}</span>
                </button>
              </div>

              {/* SECTION 1: Account Type */}
              <div className="pipeline-switch-role-card">
                <div className="pipeline-switch-header">
                  <div className="pipeline-switch-title-wrap">
                    <Shield size={14} />
                    <span className="pipeline-switch-title">Account Type</span>
                  </div>
                  <span className="pipeline-switch-hint">Takes effect on save</span>
                </div>

                <div className="pipeline-role-selector-row" style={{ marginBottom: 0 }}>
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
                    className={`pipeline-role-chip ${selectedRoleToSet === 'customer' ? 'active' : ''}`}
                    onClick={() => handleRoleSelectionChange('customer')}
                  >
                    <span className="role-chip-name">Customer</span>
                    <span className="role-chip-sub">Personal retail</span>
                  </button>

                  <button
                    type="button"
                    className={`pipeline-role-chip ${selectedRoleToSet === 'supplier' ? 'active' : ''}`}
                    onClick={() => handleRoleSelectionChange('supplier')}
                  >
                    <span className="role-chip-name">Supplier</span>
                    <span className="role-chip-sub">Artisan / Weaver</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: Contact Details */}
              <div className="pipeline-detail-card">
                <div className="pipeline-detail-card-head">
                  <h4 className="pipeline-detail-card-title">
                    <Users size={14} /> Contact Details
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

              {/* SECTION 3: Online Presence */}
              <div className="pipeline-detail-card">
                <div className="pipeline-detail-card-head">
                  <h4 className="pipeline-detail-card-title">
                    <Globe size={14} /> Online Presence
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
                        if (!attr) return '—';
                        return (
                          <div className="pipeline-modal-acq-chip">
                            <span className={`acquisition-badge ${attr.badgeClass}`}>
                              <span className="attr-icon">{attr.icon}</span>
                              <span className="attr-name">{attr.cleanName}</span>
                            </span>
                            {attr.landingPath && (
                              <span className="pipeline-modal-acq-path">
                                {attr.landingPath}
                              </span>
                            )}
                          </div>
                        );
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

              {/* SECTION 4: Business Details */}
              <div className="pipeline-detail-card">
                <div className="pipeline-detail-card-head">
                  <h4 className="pipeline-detail-card-title">
                    <Building size={14} /> Business Details
                  </h4>
                  <span className="pipeline-detail-card-sub">
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

              {/* SECTION 5: SHARED FOOTER (Lock Account Checkbox + Close + Save Changes) */}
              <div className="pipeline-switch-role-card pipeline-modal-footer-card">
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
