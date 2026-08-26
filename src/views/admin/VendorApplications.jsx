/**
 * @file VendorApplications.jsx
 * @description Modern Vendor Onboarding & Loom Management Portal for Weave365 Admin.
 * Displays all registered artisan weavers & vendor partners, assigns unique Loom Codes (V01, V02...),
 * inspects contact & location data, coordinates inventory catalog sync, and allows bulk toggling
 * (enable / disable) of all products belonging to a vendor.
 *
 * @module views/admin/VendorApplications
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Store,
  Users,
  Boxes,
  Copy,
  Check,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  Tag,
  ExternalLink,
  Plus,
  Edit3,
  FileSpreadsheet,
  PackageCheck,
  Layers,
  Eye,
  EyeOff,
  Power,
} from 'lucide-react';
import { PRICE_GROUPS, isVendorProfile } from '../../utils/buyerAccess.js';
import {
  getVendorStockLocal,
  batchSaveVendorStock,
  VENDOR_STOCK_UPDATED_EVENT,
} from '../../utils/vendorStockService.js';
import { fallbackProductImage, formatMoney } from '../../storefrontShared.jsx';

function toTitleCase(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(dateInput) {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

function formatTime(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

function cleanPhoneDigits(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function normalizeVendorCode(vid) {
  if (!vid || vid === 'all' || vid === 'N/A') return '';
  const clean = String(vid).trim();
  const digits = clean.replace(/\D/g, '');
  if (!digits) return clean.toUpperCase();
  return `V${digits.padStart(2, '0')}`;
}

export default function VendorApplications({
  adminData,
  loadAdminData,
  updateVendorProfile,
  products = [],
  user,
  setActiveTab,
}) {
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [codeFilter, setCodeFilter] = useState('all'); // 'all' | 'assigned' | 'unassigned'
  const [sortField, setSortField] = useState('date'); // 'date' | 'name' | 'business' | 'city' | 'code'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  // Live stock overrides map
  const [stockOverrides, setStockOverrides] = useState(() => getVendorStockLocal());
  const [togglingVendorId, setTogglingVendorId] = useState(null);

  // Selected vendor for full inspector modal
  const [inspectVendor, setInspectVendor] = useState(null);

  // Quick Code Assign Popover / Modal state
  const [quickCodeVendor, setQuickCodeVendor] = useState(null);
  const [quickCodeInput, setQuickCodeInput] = useState('');

  // Editing state inside inspector
  const [editingCode, setEditingCode] = useState('');
  const [editingPartnerName, setEditingPartnerName] = useState('');
  const [savingAction, setSavingAction] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  // Sync live stock updates
  useEffect(() => {
    const handleStockUpdate = (e) => {
      if (e.detail) setStockOverrides(e.detail);
      else setStockOverrides(getVendorStockLocal());
    };
    window.addEventListener(VENDOR_STOCK_UPDATED_EVENT, handleStockUpdate);
    return () => window.removeEventListener(VENDOR_STOCK_UPDATED_EVENT, handleStockUpdate);
  }, []);

  // Extract all vendor profiles
  const allVendors = useMemo(() => {
    const profiles = adminData?.profiles || [];
    return profiles.filter(isVendorProfile);
  }, [adminData?.profiles]);

  // Helper to compute vendor product visibility status & counts
  const getVendorProductsInfo = useCallback(
    (vendorCode) => {
      if (!vendorCode) return { products: [], total: 0, hiddenCount: 0, visibleCount: 0, allHidden: false, allVisible: false };
      const code = normalizeVendorCode(vendorCode);
      if (!code) return { products: [], total: 0, hiddenCount: 0, visibleCount: 0, allHidden: false, allVisible: false };

      const vendorProds = (products || []).filter((p) => {
        const pVid = normalizeVendorCode(p.vendorCode || p.raw?.VID || p.raw?.vid || p.vendor || '');
        return pVid === code;
      });

      let hiddenCount = 0;
      vendorProds.forEach((p) => {
        const key = p.id || p.groupKey;
        const ov = stockOverrides[key];
        const isHidden = ov
          ? ov.stockStatus === 'archived'
          : Boolean(p.isArchived);
        if (isHidden) hiddenCount += 1;
      });

      const total = vendorProds.length;
      const visibleCount = total - hiddenCount;
      const allHidden = total > 0 && hiddenCount === total;
      const allVisible = total > 0 && hiddenCount === 0;

      return {
        products: vendorProds,
        total,
        hiddenCount,
        visibleCount,
        allHidden,
        allVisible,
      };
    },
    [products, stockOverrides]
  );

  // Toggle all products for a vendor between Visible and Hidden (preserving individual stock status)
  const handleToggleAllVendorProducts = async (vendor) => {
    if (!vendor?.vendor_code || togglingVendorId) return;
    const info = getVendorProductsInfo(vendor.vendor_code);
    if (info.total === 0) {
      alert(`No catalog products currently found with Vendor Code ${vendor.vendor_code}.`);
      return;
    }

    const shouldHide = !info.allHidden;
    const vendorName = vendor.business_name || vendor.full_name || 'Vendor';

    const confirmMsg = shouldHide
      ? `Are you sure you want to HIDE all ${info.total} products for "${vendorName}"?\n\nThey will be archived and completely hidden from the website. Individual Out of Stock and Pre-Order statuses will be preserved.`
      : `Are you sure you want to PUBLISH all ${info.total} products for "${vendorName}"?\n\nThey will become visible on the website while keeping any Out of Stock or Pre-Order statuses previously set by the vendor.`;

    if (!window.confirm(confirmMsg)) return;

    setTogglingVendorId(vendor.id);
    try {
      let items;
      if (shouldHide) {
        // Hiding: archive all products, remembering each product's current stock status
        items = info.products.map((p) => {
          const key = p.id || p.groupKey;
          const currentOverride = stockOverrides[key];
          const currentStatus = currentOverride
            ? currentOverride.stockStatus
            : p.stockStatus || (p.isOutOfStock ? 'out-of-stock' : p.isPreOrder ? 'pre-order' : 'ready-stock');

          return {
            productId: key,
            vendorCode: vendor.vendor_code,
            vendorName: vendor.business_name || vendor.full_name || '',
            stockStatus: 'archived',
            prevStockStatus: currentStatus !== 'archived' ? currentStatus : 'ready-stock',
          };
        });
      } else {
        // Publishing: restore each product's individual previous status (out-of-stock, pre-order, ready-stock)
        items = info.products.map((p) => {
          const key = p.id || p.groupKey;
          const currentOverride = stockOverrides[key];
          let restoredStatus = currentOverride?.prevStockStatus;
          if (!restoredStatus || restoredStatus === 'archived') {
            restoredStatus = p.isOutOfStock ? 'out-of-stock' : p.isPreOrder ? 'pre-order' : 'ready-stock';
          }

          return {
            productId: key,
            vendorCode: vendor.vendor_code,
            vendorName: vendor.business_name || vendor.full_name || '',
            stockStatus: restoredStatus,
            prevStockStatus: null,
          };
        });
      }

      const res = await batchSaveVendorStock({
        items,
        userId: user?.id,
        userName: user?.email || 'Admin',
      });

      if (res?.success) {
        setStockOverrides(getVendorStockLocal());
        handleCopy(
          `✓ ${shouldHide ? 'Hidden' : 'Published'} all ${info.total} products!`,
          `toggle_${vendor.id}`
        );
      }
    } catch (err) {
      console.error('Error toggling vendor products:', err);
      alert('Failed to update product visibility.');
    } finally {
      setTogglingVendorId(null);
    }
  };

  // Extract distinct category options across all registered vendors
  const allCategoryOptions = useMemo(() => {
    const set = new Set();
    allVendors.forEach((v) => {
      if (Array.isArray(v.interested_categories)) {
        v.interested_categories.forEach((cat) => {
          if (cat && typeof cat === 'string') set.add(cat.trim());
        });
      } else if (typeof v.interested_categories === 'string' && v.interested_categories) {
        v.interested_categories.split(',').forEach((cat) => {
          if (cat) set.add(cat.trim());
        });
      }
    });
    return Array.from(set).sort();
  }, [allVendors]);

  // Metrics KPI calculations
  const metrics = useMemo(() => {
    const total = allVendors.length;
    let withCode = 0;
    let withoutCode = 0;

    allVendors.forEach((v) => {
      if (v.vendor_code && v.vendor_code.trim()) {
        withCode += 1;
      } else {
        withoutCode += 1;
      }
    });

    return { total, withCode, withoutCode };
  }, [allVendors]);

  // Filtered and Sorted Vendors
  const filteredVendors = useMemo(() => {
    let list = [...allVendors];

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter((v) => {
        const cats = Array.isArray(v.interested_categories)
          ? v.interested_categories
          : String(v.interested_categories || '').split(',');
        return cats.some((c) => String(c).trim().toLowerCase() === categoryFilter.toLowerCase());
      });
    }

    // Vendor Code filter
    if (codeFilter === 'assigned') {
      list = list.filter((v) => Boolean(v.vendor_code && v.vendor_code.trim()));
    } else if (codeFilter === 'unassigned') {
      list = list.filter((v) => !v.vendor_code || !v.vendor_code.trim());
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) => {
        const name = String(v.full_name || '').toLowerCase();
        const bName = String(v.business_name || '').toLowerCase();
        const email = String(v.email || '').toLowerCase();
        const phone = String(v.whatsapp || v.whatsapp_number || '').toLowerCase();
        const city = String(v.city || '').toLowerCase();
        const state = String(v.state || '').toLowerCase();
        const pin = String(v.pincode || '').toLowerCase();
        const code = String(v.vendor_code || '').toLowerCase();
        const partner = String(v.partner_name || '').toLowerCase();
        const cats = Array.isArray(v.interested_categories)
          ? v.interested_categories.join(' ').toLowerCase()
          : String(v.interested_categories || '').toLowerCase();

        return (
          name.includes(q) ||
          bName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          city.includes(q) ||
          state.includes(q) ||
          pin.includes(q) ||
          code.includes(q) ||
          partner.includes(q) ||
          cats.includes(q)
        );
      });
    }

    // Sorting
    return list.sort((a, b) => {
      let valA, valB;
      if (sortField === 'name') {
        valA = String(a.full_name || '').toLowerCase();
        valB = String(b.full_name || '').toLowerCase();
      } else if (sortField === 'business') {
        valA = String(a.business_name || a.full_name || '').toLowerCase();
        valB = String(b.business_name || b.full_name || '').toLowerCase();
      } else if (sortField === 'city') {
        valA = String(a.city || '').toLowerCase();
        valB = String(b.city || '').toLowerCase();
      } else if (sortField === 'code') {
        valA = String(a.vendor_code || '').toLowerCase();
        valB = String(b.vendor_code || '').toLowerCase();
      } else {
        // 'date'
        valA = new Date(a.created_at || a.updated_at || 0).getTime();
        valB = new Date(b.created_at || b.updated_at || 0).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allVendors, categoryFilter, codeFilter, searchQuery, sortField, sortOrder]);

  // Handle Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    if (loadAdminData) {
      await loadAdminData();
    }
    setRefreshing(false);
  };

  // Handle copy text with toast feedback
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyFeedback((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyFeedback((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Handle Copy Vendor Signup Link
  const handleCopySignupLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.weave365.com';
    const link = `${origin}/signup?type=vendor`;
    handleCopy(link, 'signup_link');
  };

  // Export Vendors to CSV
  const handleExportCSV = () => {
    if (!filteredVendors || filteredVendors.length === 0) {
      alert('No vendors available to export.');
      return;
    }

    const headers = [
      'Registration Date',
      'Proprietor Name',
      'Business / Workshop Name',
      'Email',
      'WhatsApp Phone',
      'City',
      'State',
      'Pincode',
      'Specialties',
      'Sourcing Model',
      'Vendor Code',
      'Partner Label',
      'Total Products',
      'Visible Products',
      'Hidden Products',
    ];

    const rows = filteredVendors.map((v) => {
      const cats = Array.isArray(v.interested_categories)
        ? v.interested_categories.join(', ')
        : String(v.interested_categories || '');
      const prodInfo = getVendorProductsInfo(v.vendor_code);
      return [
        v.created_at || v.updated_at || '',
        toTitleCase(v.full_name),
        v.business_name || '',
        v.email || '',
        v.whatsapp || v.whatsapp_number || '',
        v.city || '',
        v.state || '',
        v.pincode || '',
        `"${cats.replace(/"/g, '""')}"`,
        v.buying_behavior || '',
        v.vendor_code || '',
        v.partner_name || '',
        prodInfo.total,
        prodInfo.visibleCount,
        prodInfo.hiddenCount,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Weave365_Vendors_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open full details modal for a vendor
  const handleInspectVendor = (vendor) => {
    setInspectVendor(vendor);
    setEditingCode(vendor.vendor_code || '');
    setEditingPartnerName(vendor.partner_name || '');
  };

  // Save Code & Partner Name inside Inspector
  const handleSaveInspectorDetails = async () => {
    if (!inspectVendor || savingAction) return;
    setSavingAction(true);
    try {
      const cleanCode = editingCode.trim().toUpperCase();
      const cleanPartner = editingPartnerName.trim();

      const success = await updateVendorProfile(inspectVendor.id, {
        vendor_code: cleanCode,
        partner_name: cleanPartner,
      });

      if (success) {
        setInspectVendor((prev) => ({
          ...prev,
          vendor_code: cleanCode,
          partner_name: cleanPartner,
        }));
        handleCopy('Saved successfully!', 'inspector_save');
      }
    } catch (err) {
      console.error('Error saving vendor details:', err);
    } finally {
      setSavingAction(false);
    }
  };

  // Quick Code Assign save
  const handleSaveQuickCode = async () => {
    if (!quickCodeVendor || savingAction) return;
    setSavingAction(true);
    try {
      const cleanCode = quickCodeInput.trim().toUpperCase();
      const success = await updateVendorProfile(quickCodeVendor.id, {
        vendor_code: cleanCode,
      });
      if (success) {
        setQuickCodeVendor(null);
        setQuickCodeInput('');
      }
    } catch (err) {
      console.error('Error saving quick code:', err);
    } finally {
      setSavingAction(false);
    }
  };

  // Linked products info for currently inspected vendor
  const inspectedVendorProductsInfo = useMemo(() => {
    if (!inspectVendor?.vendor_code) return { products: [], total: 0, disabledCount: 0, activeCount: 0, allDisabled: false };
    return getVendorProductsInfo(inspectVendor.vendor_code);
  }, [inspectVendor?.vendor_code, getVendorProductsInfo]);

  return (
    <div className="admin-partners-tab">
      {/* 1. Header Dashboard Banner */}
      <div className="admin-partners-banner">
        <div className="admin-sync-content">
          <div className="admin-partners-banner-icon-wrap">
            <Store size={26} />
          </div>
          <div>
            <h2 className="admin-partners-banner-title">Vendor & Artisan Management</h2>
            <p className="admin-partners-banner-desc">
              Manage registered artisan suppliers, assign Vendor Codes (V01, V02...), and toggle website product availability.
            </p>
          </div>
        </div>

        <div className="admin-flex-gap12">
          <button
            type="button"
            className="admin-btn-refresh-partners"
            onClick={handleCopySignupLink}
            title="Copy link to vendor registration form"
          >
            {copyFeedback.signup_link ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
            <span>{copyFeedback.signup_link ? 'Link Copied!' : 'Copy Signup Link'}</span>
          </button>

          <button
            type="button"
            className="admin-btn-refresh-partners"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Vendors'}</span>
          </button>
        </div>
      </div>

      {/* 2. Mini-Metrics KPI Grid */}
      <div className="admin-partners-metrics-grid">
        <div className="admin-partner-metric-card">
          <div className="admin-partner-icon-blue">
            <Users size={22} />
          </div>
          <div className="admin-flex1">
            <span className="admin-partner-metric-label">Total Registered Vendors</span>
            <div className="admin-partner-metric-values">
              <strong className="admin-partner-metric-value">{metrics.total}</strong>
              <span className="admin-partner-status-blue">Partner Accounts</span>
            </div>
          </div>
        </div>

        <div className="admin-partner-metric-card">
          <div className="admin-partner-icon-purple" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <PackageCheck size={22} />
          </div>
          <div className="admin-flex1">
            <span className="admin-partner-metric-label">Vendor Codes Assigned</span>
            <div className="admin-partner-metric-values">
              <strong className="admin-partner-metric-value">{metrics.withCode}</strong>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#7c3aed' }}>
                {metrics.total > 0 ? `${Math.round((metrics.withCode / metrics.total) * 100)}% Linked` : '0%'}
              </span>
            </div>
          </div>
        </div>

        <div className="admin-partner-metric-card">
          <div className="admin-partner-icon-orange" style={{ background: '#fffbeb', color: '#b45309' }}>
            <Boxes size={22} />
          </div>
          <div className="admin-flex1">
            <span className="admin-partner-metric-label">Pending Vendor Code</span>
            <div className="admin-partner-metric-values">
              <strong className="admin-partner-metric-value">{metrics.withoutCode}</strong>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#b45309' }}>Needs V-Code</span>
            </div>
          </div>
        </div>

        <div className="admin-partner-metric-card">
          <div className="admin-partner-icon-green">
            <Layers size={22} />
          </div>
          <div className="admin-flex1">
            <span className="admin-partner-metric-label">Specialties Covered</span>
            <div className="admin-partner-metric-values">
              <strong className="admin-partner-metric-value">{allCategoryOptions.length}</strong>
              <span className="admin-partner-status-green">Handloom Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filtering & Search Toolbar */}
      <div className="admin-partners-filter-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div className="admin-search-wrapper" style={{ flex: '1 1 240px', minWidth: '220px' }}>
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search vendor, phone, vendor code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter */}
          {allCategoryOptions.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select-input"
              aria-label="Filter by specialty"
            >
              <option value="all">All Specialties ({allCategoryOptions.length})</option>
              {allCategoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Vendor Code Filter */}
          <select
            value={codeFilter}
            onChange={(e) => setCodeFilter(e.target.value)}
            className="admin-select-input"
            aria-label="Filter by vendor code"
          >
            <option value="all">All Vendor Codes</option>
            <option value="assigned">Assigned Code (V01, V02...)</option>
            <option value="unassigned">Unassigned Code</option>
          </select>

          {/* Sort Controls */}
          <div className="admin-flex-align-center-gap8">
            <span className="admin-partner-sort-label">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="admin-select-input"
              aria-label="Sort by field"
            >
              <option value="date">Date Registered</option>
              <option value="name">Vendor Name</option>
              <option value="business">Business Name</option>
              <option value="city">City / Location</option>
              <option value="code">Vendor Code</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="admin-btn-toggle"
              title={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
            </button>
          </div>
        </div>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="admin-btn-doc-badge"
          style={{ background: '#059669', color: '#ffffff', borderColor: '#047857' }}
          title="Download complete vendor directory as CSV"
        >
          <FileSpreadsheet size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* 4. Vendors Directory Table */}
      <div className="pipeline-table-container">
        <div className="admin-table-wrap">
          <table className="admin-table pipeline-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Date</th>
                <th style={{ minWidth: '180px' }}>Vendor</th>
                <th style={{ minWidth: '160px' }}>Contact</th>
                <th style={{ minWidth: '140px' }}>Location</th>
                <th style={{ minWidth: '150px' }}>Specialty & Model</th>
                <th style={{ width: '120px' }}>Vendor Code</th>
                <th style={{ minWidth: '140px', textAlign: 'center' }}>Products</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <Store size={36} style={{ color: '#cbd5e1' }} />
                      <strong style={{ fontSize: '15px', color: '#334155' }}>No vendor partners found</strong>
                      <span style={{ fontSize: '13px' }}>
                        {searchQuery || categoryFilter !== 'all' || codeFilter !== 'all'
                          ? 'Try adjusting your search criteria or filters.'
                          : 'Vendors who sign up on the registration page will automatically appear here.'}
                      </span>
                      {(searchQuery || categoryFilter !== 'all' || codeFilter !== 'all') && (
                        <button
                          type="button"
                          className="admin-btn-inspect"
                          onClick={() => {
                            setSearchQuery('');
                            setCategoryFilter('all');
                            setCodeFilter('all');
                          }}
                          style={{ marginTop: '8px' }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const cleanPhone = cleanPhoneDigits(vendor.whatsapp || vendor.whatsapp_number);
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(
                        `Namaste ${vendor.full_name || 'Partner'}, greetings from Weave365 Admin team!`
                      )}`
                    : null;

                  const cats = Array.isArray(vendor.interested_categories)
                    ? vendor.interested_categories
                    : String(vendor.interested_categories || '')
                        .split(',')
                        .filter(Boolean);

                  const prodInfo = getVendorProductsInfo(vendor.vendor_code);

                  return (
                    <tr key={vendor.id}>
                      {/* Date & Time */}
                      <td>
                        <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>
                          {formatDate(vendor.created_at || vendor.updated_at)}
                        </strong>
                        <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                          {formatTime(vendor.created_at || vendor.updated_at)}
                        </span>
                      </td>

                      {/* Vendor & Workshop */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                            {toTitleCase(vendor.full_name) || 'Unnamed Partner'}
                          </strong>
                          {vendor.business_name && (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5' }}>
                              {vendor.business_name}
                            </span>
                          )}
                          {vendor.email && (
                            <a
                              href={`mailto:${vendor.email}`}
                              style={{ fontSize: '11.5px', color: '#64748b', textDecoration: 'none' }}
                              title="Send Email"
                            >
                              {vendor.email}
                            </a>
                          )}
                        </div>
                      </td>

                      {/* WhatsApp Contact */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {cleanPhone ? (
                            <>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-wa-icon-link"
                                title="Chat on WhatsApp"
                              >
                                <Phone size={13} />
                              </a>
                              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e293b' }}>
                                +91 {cleanPhone}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(cleanPhone, `phone_${vendor.id}`)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                title="Copy Phone Number"
                              >
                                {copyFeedback[`phone_${vendor.id}`] ? (
                                  <Check size={13} style={{ color: '#10b981' }} />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>No Phone</span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '12.5px', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} style={{ color: '#64748b' }} />
                            {vendor.city || 'N/A'}{vendor.state ? `, ${vendor.state}` : ''}
                          </span>
                          {vendor.pincode && (
                            <span style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '16px' }}>
                              PIN: {vendor.pincode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Specialty & Model */}
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {cats.length > 0 ? (
                            cats.slice(0, 3).map((cat) => (
                              <span
                                key={cat}
                                style={{
                                  padding: '2px 6px',
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                }}
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>General Handloom</span>
                          )}
                          {cats.length > 3 && (
                            <span style={{ fontSize: '10px', color: '#64748b', alignSelf: 'center' }}>
                              +{cats.length - 3} more
                            </span>
                          )}
                        </div>
                        {vendor.buying_behavior && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              fontSize: '10.5px',
                              color: '#6366f1',
                              fontWeight: 600,
                            }}
                          >
                            Model: {vendor.buying_behavior === 'instant' ? 'Immediate' : toTitleCase(vendor.buying_behavior)}
                          </span>
                        )}
                      </td>

                      {/* Vendor Code */}
                      <td>
                        {vendor.vendor_code ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                              }}
                            >
                              {vendor.vendor_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickCodeVendor(vendor);
                                setQuickCodeInput(vendor.vendor_code || '');
                              }}
                              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
                              title="Edit Vendor Code"
                            >
                              <Edit3 size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickCodeVendor(vendor);
                              setQuickCodeInput('');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              background: '#fffbeb',
                              color: '#b45309',
                              border: '1px dashed #fcd34d',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Assign Vendor Code (e.g. V01)"
                          >
                            <Plus size={11} />
                            <span>Assign Code</span>
                          </button>
                        )}
                      </td>

                      {/* Products Visibility Toggle */}
                      <td style={{ textAlign: 'center' }}>
                        {vendor.vendor_code && prodInfo.total > 0 ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleAllVendorProducts(vendor)}
                              disabled={togglingVendorId === vendor.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: prodInfo.allHidden ? '#fee2e2' : prodInfo.hiddenCount > 0 ? '#fef3c7' : '#dcfce7',
                                color: prodInfo.allHidden ? '#dc2626' : prodInfo.hiddenCount > 0 ? '#b45309' : '#15803d',
                                border: `1px solid ${prodInfo.allHidden ? '#fca5a5' : prodInfo.hiddenCount > 0 ? '#fcd34d' : '#86efac'}`,
                              }}
                              title={
                                prodInfo.allHidden
                                  ? `Click to PUBLISH all ${prodInfo.total} products on website`
                                  : `Click to HIDE all ${prodInfo.total} products from website`
                              }
                            >
                              {prodInfo.allHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>
                                {togglingVendorId === vendor.id
                                  ? 'Updating...'
                                  : prodInfo.allHidden
                                  ? `Hidden (${prodInfo.total})`
                                  : prodInfo.hiddenCount > 0
                                  ? `${prodInfo.visibleCount} Vis / ${prodInfo.hiddenCount} Hid`
                                  : `Visible (${prodInfo.total})`}
                              </span>
                            </button>
                            {copyFeedback[`toggle_${vendor.id}`] && (
                              <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 600 }}>
                                {copyFeedback[`toggle_${vendor.id}`]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                            {vendor.vendor_code ? '0 Items' : 'No Code'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleInspectVendor(vendor)}
                          className="admin-btn-inspect"
                        >
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Quick Code Assign Dialog */}
      {quickCodeVendor && (
        <div className="admin-modal-overlay" onClick={() => setQuickCodeVendor(null)}>
          <div
            className="admin-review-modal"
            style={{ maxWidth: '420px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: '#0f172a', fontWeight: 700 }}>
                  Assign Loom / Vendor Code
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Vendor: <strong>{quickCodeVendor.business_name || quickCodeVendor.full_name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickCodeVendor(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Vendor Code Prefix (e.g. V01, V02, V03):
              </label>
              <input
                type="text"
                placeholder="V01"
                value={quickCodeInput}
                onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
                className="admin-search-input"
                style={{ width: '100%', fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em' }}
                autoFocus
              />
              <span style={{ display: 'block', fontSize: '11.5px', color: '#64748b', marginTop: '6px' }}>
                This prefix links products in the wholesale inventory catalog directly to this vendor.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setQuickCodeVendor(null)}
                className="admin-btn-inspect"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickCode}
                disabled={savingAction}
                className="admin-btn-save-drive"
              >
                {savingAction ? 'Saving...' : 'Save Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Full Vendor Details Inspector Modal */}
      {inspectVendor && (
        <div className="admin-modal-overlay" onClick={() => setInspectVendor(null)}>
          <div
            className="admin-onboarding-modal"
            style={{ maxWidth: '840px', borderRadius: '16px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="admin-modal-header" style={{ padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                    {toTitleCase(inspectVendor.full_name) || 'Vendor Details'}
                  </h3>
                  {inspectVendor.business_name && (
                    <span style={{ padding: '3px 10px', background: '#e0e7ff', color: '#4338ca', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
                      {inspectVendor.business_name}
                    </span>
                  )}
                  {inspectVendor.vendor_code && (
                    <span style={{ padding: '3px 10px', background: '#dbeafe', color: '#1e40af', borderRadius: '6px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Code: {inspectVendor.vendor_code}
                    </span>
                  )}
                </div>
                <span style={{ display: 'block', fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                  Registered: {formatDate(inspectVendor.created_at || inspectVendor.updated_at)} at {formatTime(inspectVendor.created_at || inspectVendor.updated_at)} • Email: {inspectVendor.email || 'N/A'}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setInspectVendor(null)}
                style={{ fontSize: '24px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="admin-modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Quick Actions Bar */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {cleanPhoneDigits(inspectVendor.whatsapp || inspectVendor.whatsapp_number) && (
                  <a
                    href={`https://wa.me/${cleanPhoneDigits(inspectVendor.whatsapp || inspectVendor.whatsapp_number)}?text=${encodeURIComponent(`Namaste ${inspectVendor.full_name || 'Partner'}, greetings from Weave365!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn-save-drive"
                    style={{
                      background: '#25d366',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px',
                    }}
                  >
                    <Phone size={15} />
                    <span>WhatsApp Chat (+91 {cleanPhoneDigits(inspectVendor.whatsapp || inspectVendor.whatsapp_number)})</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const summary = `VENDOR SUMMARY\nName: ${inspectVendor.full_name}\nFirm: ${inspectVendor.business_name || 'N/A'}\nPhone: ${inspectVendor.whatsapp || inspectVendor.whatsapp_number || 'N/A'}\nEmail: ${inspectVendor.email || 'N/A'}\nLocation: ${inspectVendor.city || ''} ${inspectVendor.state || ''} (${inspectVendor.pincode || ''})\nVendor Code: ${inspectVendor.vendor_code || 'Unassigned'}\nCategories: ${Array.isArray(inspectVendor.interested_categories) ? inspectVendor.interested_categories.join(', ') : inspectVendor.interested_categories || 'N/A'}`;
                    handleCopy(summary, 'vendor_summary');
                  }}
                  className="admin-btn-inspect"
                  style={{ padding: '10px 16px', fontSize: '13px' }}
                >
                  {copyFeedback.vendor_summary ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  <span>{copyFeedback.vendor_summary ? 'Summary Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              {/* Main Content: 2 Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Left Card: Vendor Information */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} style={{ color: '#4f46e5' }} />
                    Contact & Vendor Info
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Proprietor:</span>
                      <strong style={{ color: '#0f172a' }}>{toTitleCase(inspectVendor.full_name) || 'N/A'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Business / Firm:</span>
                      <strong style={{ color: '#0f172a' }}>{inspectVendor.business_name || 'Individual Weaver'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Email:</span>
                      <strong style={{ color: '#0f172a' }}>{inspectVendor.email || 'N/A'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>WhatsApp:</span>
                      <strong style={{ color: '#0f172a' }}>{inspectVendor.whatsapp || inspectVendor.whatsapp_number || 'N/A'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Location:</span>
                      <strong style={{ color: '#0f172a', textAlign: 'right' }}>
                        {inspectVendor.city || ''}{inspectVendor.state ? `, ${inspectVendor.state}` : ''}
                        {inspectVendor.pincode ? ` (${inspectVendor.pincode})` : ''}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Sourcing Model:</span>
                      <strong style={{ color: '#4338ca' }}>
                        {inspectVendor.buying_behavior === 'instant' ? 'Immediate Stock' : 'Order Basis / Custom Woven'}
                      </strong>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                      Specialties & Categories:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Array.isArray(inspectVendor.interested_categories) && inspectVendor.interested_categories.length > 0 ? (
                        inspectVendor.interested_categories.map((c) => (
                          <span
                            key={c}
                            style={{
                              padding: '3px 8px',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              borderRadius: '4px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                            }}
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>General Handloom</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Vendor Code & Products Toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Vendor Code Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={16} style={{ color: '#2563eb' }} />
                      Vendor Code (Catalog Link)
                    </h4>
                    <p style={{ margin: '4px 0 12px', fontSize: '12px', color: '#64748b' }}>
                      Set a short code (e.g. <strong>V01</strong>, <strong>V02</strong>) to link this vendor to their catalog products.
                    </p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="e.g. V01"
                        value={editingCode}
                        onChange={(e) => setEditingCode(e.target.value.toUpperCase())}
                        className="admin-search-input"
                        style={{ width: '110px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em', textAlign: 'center' }}
                      />
                      <button
                        type="button"
                        onClick={handleSaveInspectorDetails}
                        disabled={savingAction}
                        className="admin-btn-save-drive"
                        style={{ padding: '8px 18px', whiteSpace: 'nowrap' }}
                      >
                        {savingAction ? 'Saving...' : 'Save Code'}
                      </button>
                    </div>

                    {copyFeedback.inspector_save && (
                      <span style={{ display: 'block', fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: '6px' }}>
                        ✓ Vendor code saved successfully!
                      </span>
                    )}
                  </div>

                  {/* Linked Products & Bulk Toggle Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Boxes size={16} style={{ color: '#7c3aed' }} />
                        Linked Products ({inspectedVendorProductsInfo.total})
                      </h4>

                      {/* Bulk Product Toggle Button */}
                      {inspectedVendorProductsInfo.total > 0 && (
                        <button
                          type="button"
                          onClick={() => handleToggleAllVendorProducts(inspectVendor)}
                          disabled={togglingVendorId === inspectVendor.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: inspectedVendorProductsInfo.allHidden ? '#16a34a' : '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                          }}
                          title={
                            inspectedVendorProductsInfo.allHidden
                              ? `Click to Publish all ${inspectedVendorProductsInfo.total} products on website`
                              : `Click to Hide all ${inspectedVendorProductsInfo.total} products from website`
                          }
                        >
                          {inspectedVendorProductsInfo.allHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span>
                            {togglingVendorId === inspectVendor.id
                              ? 'Updating...'
                              : inspectedVendorProductsInfo.allHidden
                              ? `Publish All (${inspectedVendorProductsInfo.total})`
                              : `Hide All (${inspectedVendorProductsInfo.total})`}
                          </span>
                        </button>
                      )}
                    </div>

                    {inspectedVendorProductsInfo.total > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: inspectedVendorProductsInfo.allHidden
                              ? '#fee2e2'
                              : inspectedVendorProductsInfo.hiddenCount > 0
                              ? '#fef3c7'
                              : '#dcfce7',
                            color: inspectedVendorProductsInfo.allHidden
                              ? '#b91c1c'
                              : inspectedVendorProductsInfo.hiddenCount > 0
                              ? '#b45309'
                              : '#15803d',
                          }}
                        >
                          Status:{' '}
                          {inspectedVendorProductsInfo.allHidden
                            ? 'All Products Hidden from Website'
                            : inspectedVendorProductsInfo.hiddenCount > 0
                            ? `${inspectedVendorProductsInfo.visibleCount} Visible, ${inspectedVendorProductsInfo.hiddenCount} Hidden`
                            : 'All Products Visible on Website'}
                        </span>
                      </div>
                    )}

                    {inspectedVendorProductsInfo.total > 0 ? (
                      <div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                            gap: '8px',
                            maxHeight: '140px',
                            overflowY: 'auto',
                            padding: '2px',
                          }}
                        >
                          {inspectedVendorProductsInfo.products.slice(0, 8).map((p, idx) => {
                            const pKey = p.id || p.groupKey;
                            const ov = stockOverrides[pKey];
                            const isHidden = ov
                              ? ov.stockStatus === 'archived'
                              : Boolean(p.isArchived);

                            return (
                              <div
                                key={pKey || idx}
                                style={{
                                  border: `1px solid ${isHidden ? '#fca5a5' : '#e2e8f0'}`,
                                  borderRadius: '6px',
                                  padding: '4px',
                                  background: isHidden ? '#fff5f5' : '#ffffff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  opacity: isHidden ? 0.65 : 1,
                                }}
                              >
                                <img
                                  src={p.image || (Array.isArray(p.images) && p.images[0]) || fallbackProductImage}
                                  alt={p.name || 'Product'}
                                  style={{ width: '100%', height: '55px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                                <span
                                  style={{
                                    fontSize: '10px',
                                    color: '#1e293b',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontWeight: 600,
                                  }}
                                >
                                  {p.name || p.title || 'Saree'}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    color: isHidden ? '#dc2626' : '#16a34a',
                                  }}
                                >
                                  {isHidden ? 'Hidden' : 'Visible'}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {setActiveTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setInspectVendor(null);
                              setActiveTab('stock');
                            }}
                            className="admin-btn-inspect"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '12px', marginTop: '10px' }}
                          >
                            <ExternalLink size={13} />
                            <span>Manage in Stock Portal</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#64748b' }}>
                        {inspectVendor.vendor_code ? (
                          <>No catalog products currently tagged with code <strong>{inspectVendor.vendor_code}</strong>.</>
                        ) : (
                          <>Assign a Vendor Code above (e.g. <strong>V01</strong>) to link products to this vendor.</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
