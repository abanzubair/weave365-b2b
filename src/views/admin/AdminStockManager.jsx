/**
 * @file AdminStockManager.jsx
 * @description Master Administrator Stock & Availability Management Portal.
 * Provides full visibility and control over stock status (Ready Stock, Pre-Order,
 * Out of Stock, Back Soon) across all loom partners and vendor catalogs in real-time,
 * with multi-vendor filtering, batch bulk actions, compact table view, card grid view,
 * and live IST timestamp synchronization.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Filter,
  Check,
  LayoutGrid,
  List,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Tag,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Store,
  CheckSquare,
  Square,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import {
  STOCK_STATUS_OPTIONS,
  formatISTDateTime,
  getVendorStockLocal,
  fetchVendorStockOverrides,
  saveVendorProductStock,
  batchSaveVendorStock,
  VENDOR_STOCK_UPDATED_EVENT,
} from '../../utils/vendorStockService.js';
import { fetchProducts, clearProductDataCache } from '../../productData.js';
import { fallbackProductImage } from '../../storefrontShared.jsx';
import { AppLink } from '../../components/AppLink.jsx';

function normalizeVendorCode(vid) {
  if (!vid || vid === 'all' || vid === 'N/A') return '';
  const clean = String(vid).trim();
  const digits = clean.replace(/\D/g, '');
  if (!digits) return clean.toUpperCase();
  return `V${digits.padStart(2, '0')}`;
}

export default function AdminStockManager({
  products = [],
  user,
  buyerProfile,
}) {
  const [catalogProducts, setCatalogProducts] = useState(() => (Array.isArray(products) && products.length > 0 ? products : []));
  const [stockOverrides, setStockOverrides] = useState(() => getVendorStockLocal());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorKey, setSelectedVendorKey] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'id-asc' | 'id-desc' | 'updated-desc'

  // Selection & Batch State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchActionLoading, setBatchActionLoading] = useState(false);
  const [justSavedId, setJustSavedId] = useState(null);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Sync products if prop updates
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      setCatalogProducts(products);
    } else if (catalogProducts.length === 0) {
      setLoading(true);
      fetchProducts()
        .then((data) => setCatalogProducts(data || []))
        .catch((err) => console.error('[AdminStockManager] Error loading products:', err))
        .finally(() => setLoading(false));
    }
  }, [products]);

  // Fetch overrides on mount and listen to live events
  const loadStockData = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    try {
      if (force) {
        clearProductDataCache();
        const freshProducts = await fetchProducts();
        if (Array.isArray(freshProducts) && freshProducts.length > 0) {
          setCatalogProducts(freshProducts);
        }
      }
      const remoteData = await fetchVendorStockOverrides(force);
      setStockOverrides(remoteData);
    } catch (err) {
      console.error('[AdminStockManager] Failed to fetch stock data:', err);
    } finally {
      if (force) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStockData(false);

    const handleUpdate = (e) => {
      if (e.detail) {
        setStockOverrides(e.detail);
      }
    };
    window.addEventListener(VENDOR_STOCK_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(VENDOR_STOCK_UPDATED_EVENT, handleUpdate);
    };
  }, [loadStockData]);

  // Extract all distinct vendor identities from the catalog
  const vendorOptions = useMemo(() => {
    const map = new Map();
    for (const p of catalogProducts) {
      const rawVid = String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').trim();
      const normVid = normalizeVendorCode(rawVid);
      const partner = String(p.partner || p.raw?.Partner || p.raw?.partner || '').trim();
      if (!normVid && !partner) continue;

      // Group primarily by normalized VID if available, otherwise by partner name
      const primaryKey = normVid || partner.toLowerCase();
      if (!map.has(primaryKey)) {
        map.set(primaryKey, {
          key: primaryKey,
          vid: normVid || rawVid || 'N/A',
          rawVid: rawVid || 'N/A',
          partner: partner || '',
          count: 1,
        });
      } else {
        const item = map.get(primaryKey);
        item.count += 1;
        if (!item.partner && partner) {
          item.partner = partner;
        }
      }
    }

    const list = Array.from(map.values()).map((item) => {
      const pName = item.partner || (item.vid !== 'N/A' ? '' : 'Loom Partner');
      const displayName = item.vid !== 'N/A' && pName
        ? `${item.vid} - ${pName}`
        : (item.vid !== 'N/A' ? `Vendor ${item.vid}` : pName || 'Loom Partner');
      return {
        ...item,
        partner: pName || 'Loom Partner',
        displayName,
      };
    }).sort((a, b) => a.vid.localeCompare(b.vid, undefined, { numeric: true }));

    return list;
  }, [catalogProducts]);

  // Extract all distinct categories
  const categoryOptions = useMemo(() => {
    const set = new Set();
    for (const p of catalogProducts) {
      if (p.category) set.add(p.category.trim());
    }
    return Array.from(set).sort();
  }, [catalogProducts]);

  // Helper to determine effective stock status for any product
  const getProductEffectiveStatus = useCallback((product) => {
    const pKey = product.id || product.groupKey;
    const override = stockOverrides[pKey];
    if (override && override.stockStatus) return override.stockStatus;
    if (product.isOutOfStock) return 'out-of-stock';
    if (product.isPreOrder) return 'pre-order';
    if (product.isBackSoon) return 'back-soon';
    return 'ready-stock';
  }, [stockOverrides]);

  // Fast vendor code to partner name lookup
  const vendorNameMap = useMemo(() => {
    const map = new Map();
    for (const v of vendorOptions) {
      if (v.vid && v.partner) map.set(v.vid, v.partner.toLowerCase());
    }
    return map;
  }, [vendorOptions]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return catalogProducts.filter((p) => {
      const pKey = p.id || p.groupKey;
      const rawPVid = String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').trim();
      const normPVid = normalizeVendorCode(rawPVid);
      const pPartner = String(p.partner || p.raw?.Partner || p.raw?.partner || '').toLowerCase().trim();
      const currentStatus = getProductEffectiveStatus(p);

      // 1. Vendor filter
      if (selectedVendorKey !== 'all') {
        const normSelected = normalizeVendorCode(selectedVendorKey);
        if (normSelected) {
          if (normPVid !== normSelected && rawPVid !== selectedVendorKey) {
            return false;
          }
        } else if (selectedVendorKey.includes(':::')) {
          const [sVid, sPartner] = selectedVendorKey.split(':::');
          const normSVid = normalizeVendorCode(sVid);
          const vidMatches = normPVid === normSVid || rawPVid === sVid;
          const partnerMatches = !sPartner || pPartner === sPartner.toLowerCase();
          if (!vidMatches || !partnerMatches) {
            return false;
          }
        } else if (normPVid !== normalizeVendorCode(selectedVendorKey) && rawPVid !== selectedVendorKey && pPartner !== selectedVendorKey.toLowerCase()) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'all') {
        if (String(p.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Status filter
      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      // 4. Search query (SKU, VID, Vendor/Partner Name, Title, Category, Fabric, Weave, Variant)
      if (query) {
        const idMatch = String(pKey || '').toLowerCase().includes(query);
        const vidMatch = (normPVid && normPVid.toLowerCase().includes(query)) || (rawPVid && rawPVid.toLowerCase().includes(query));
        const knownPartner = (normPVid && vendorNameMap.get(normPVid)) || '';
        const partnerMatch = pPartner.includes(query) || knownPartner.includes(query) || String(p.raw?.['Vendor Name'] || p.raw?.Vendor || '').toLowerCase().includes(query);
        const titleMatch = String(p.title || '').toLowerCase().includes(query);
        const catMatch = String(p.category || '').toLowerCase().includes(query);
        const fabricMatch = String(p.fabric || '').toLowerCase().includes(query);
        const weaveMatch = String(p.weave || '').toLowerCase().includes(query);
        const variantMatch = (p.variants || []).some((v) => String(v.code || '').toLowerCase().includes(query));

        if (!idMatch && !vidMatch && !partnerMatch && !titleMatch && !catMatch && !fabricMatch && !weaveMatch && !variantMatch) {
          return false;
        }
      }

      return true;
    });
  }, [catalogProducts, searchQuery, selectedVendorKey, selectedCategory, statusFilter, getProductEffectiveStatus, vendorNameMap]);

  // Sorted Products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'id-asc') {
      list.sort((a, b) => String(a.id || '').localeCompare(String(b.id || ''), undefined, { numeric: true }));
    } else if (sortBy === 'id-desc') {
      list.sort((a, b) => String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true }));
    } else if (sortBy === 'updated-desc') {
      list.sort((a, b) => {
        const aKey = a.id || a.groupKey;
        const bKey = b.id || b.groupKey;
        const aTime = stockOverrides[aKey]?.updatedAt ? new Date(stockOverrides[aKey].updatedAt).getTime() : 0;
        const bTime = stockOverrides[bKey]?.updatedAt ? new Date(stockOverrides[bKey].updatedAt).getTime() : 0;
        return bTime - aTime;
      });
    }
    return list;
  }, [filteredProducts, sortBy, stockOverrides]);

  // Paginated Products
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    if (pageSize === 'all') return sortedProducts;
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedVendorKey, selectedCategory, statusFilter, pageSize]);

  // Overall and active statistics
  const stats = useMemo(() => {
    let ready = 0;
    let preorder = 0;
    let out = 0;
    let backsoon = 0;

    for (const p of catalogProducts) {
      const currentStatus = getProductEffectiveStatus(p);
      if (currentStatus === 'ready-stock') ready++;
      else if (currentStatus === 'pre-order') preorder++;
      else if (currentStatus === 'out-of-stock') out++;
      else if (currentStatus === 'back-soon') backsoon++;
    }

    const total = catalogProducts.length || 1;
    return {
      total: catalogProducts.length,
      vendorsCount: vendorOptions.length,
      ready,
      readyPct: Math.round((ready / total) * 100),
      preorder,
      preorderPct: Math.round((preorder / total) * 100),
      out,
      outPct: Math.round((out / total) * 100),
      backsoon,
      backsoonPct: Math.round((backsoon / total) * 100),
    };
  }, [catalogProducts, vendorOptions.length, getProductEffectiveStatus]);

  // Handle single stock status change
  const handleSingleStatusChange = async (product, newStatus) => {
    const pKey = product.id || product.groupKey;
    const vid = String(product.vendorCode || product.raw?.VID || product.raw?.vid || '').trim();
    const partner = String(product.partner || product.raw?.Partner || product.raw?.partner || '').trim();
    const adminName = buyerProfile?.full_name || user?.email?.split('@')[0] || 'Admin';

    setJustSavedId(pKey);
    setTimeout(() => setJustSavedId(null), 2500);

    const result = await saveVendorProductStock({
      productId: pKey,
      vendorCode: vid,
      vendorName: partner,
      stockStatus: newStatus,
      userId: user?.id,
      userName: `${adminName} (Admin)`,
    });

    if (result.item) {
      setStockOverrides((prev) => ({
        ...prev,
        [pKey]: result.item,
      }));
    }
  };

  // Selection handlers
  const toggleSelectProduct = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleSelectAllOnPage = () => {
    const pageIds = paginatedProducts.map((p) => p.id || p.groupKey);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = sortedProducts.map((p) => p.id || p.groupKey);
    setSelectedIds(new Set(allFilteredIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Batch Status Update
  const handleBatchStatusUpdate = async (targetStatus) => {
    if (selectedIds.size === 0) return;
    setBatchActionLoading(true);

    const selectedProducts = catalogProducts.filter((p) => selectedIds.has(p.id || p.groupKey));
    const items = selectedProducts.map((p) => ({
      productId: p.id || p.groupKey,
      vendorCode: String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').trim(),
      vendorName: String(p.partner || p.raw?.Partner || p.raw?.partner || '').trim(),
    }));

    const adminName = buyerProfile?.full_name || user?.email?.split('@')[0] || 'Admin';

    try {
      const result = await batchSaveVendorStock({
        items,
        stockStatus: targetStatus,
        userId: user?.id,
        userName: `${adminName} (Admin)`,
      });

      if (result.success) {
        const opt = STOCK_STATUS_OPTIONS.find((o) => o.key === targetStatus);
        setBatchSuccessMsg(`Successfully marked ${result.count} designs as ${opt?.label || targetStatus}!`);
        setTimeout(() => setBatchSuccessMsg(''), 4000);
        clearSelection();
      }
    } catch (err) {
      console.error('[AdminStockManager] Batch update error:', err);
    } finally {
      setBatchActionLoading(false);
    }
  };

  const isAllPageSelected = paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.has(p.id || p.groupKey));

  return (
    <div className="admin-stock-manager">
      {/* 1. Header Banner & Actions */}
      <div className="admin-stock-topbar">
        <div className="admin-stock-header-title-block">
          <div className="admin-stock-badge-kicker">
            <Boxes size={14} /> Master Inventory & Availability
          </div>
          <h1 className="admin-stock-page-title">Vendor Stock & Availability Manager</h1>
          <p className="admin-stock-page-subtitle">
            Real-time stock status overrides across all {stats.vendorsCount} loom partners & master weavers in Varanasi with live IST timestamps.
          </p>
        </div>

        <div className="admin-stock-top-actions">
          <button
            type="button"
            className="admin-stock-refresh-btn"
            onClick={() => loadStockData(true)}
            disabled={refreshing}
            title="Refresh latest stock from database"
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Refreshing…' : 'Sync Live Stock'}</span>
          </button>
          <AppLink
            to="wholesale-catalogue"
            className="admin-stock-view-catalog-btn"
            target="_blank"
            title="Open Live Storefront Wholesale Catalogue"
          >
            <Store size={15} />
            <span>View Storefront</span>
            <ExternalLink size={12} />
          </AppLink>
        </div>
      </div>

      {/* 2. Key Metric Stat Cards */}
      <div className="admin-stock-kpi-grid">
        <div className="admin-stock-kpi-card total">
          <div className="admin-stock-kpi-header">
            <span className="admin-stock-kpi-label">Total Catalog Designs</span>
            <Layers size={18} className="admin-stock-kpi-icon" />
          </div>
          <div className="admin-stock-kpi-val">{stats.total}</div>
          <div className="admin-stock-kpi-sub">{stats.vendorsCount} Active Loom Partners</div>
        </div>

        <div className="admin-stock-kpi-card ready">
          <div className="admin-stock-kpi-header">
            <span className="admin-stock-kpi-label">Ready Stock</span>
            <span className="admin-stock-kpi-pill ready">{stats.readyPct}%</span>
          </div>
          <div className="admin-stock-kpi-val ready">{stats.ready}</div>
          <div className="admin-stock-progress-track">
            <div className="admin-stock-progress-bar ready" style={{ width: `${stats.readyPct}%` }} />
          </div>
        </div>

        <div className="admin-stock-kpi-card preorder">
          <div className="admin-stock-kpi-header">
            <span className="admin-stock-kpi-label">Pre-Order</span>
            <span className="admin-stock-kpi-pill preorder">{stats.preorderPct}%</span>
          </div>
          <div className="admin-stock-kpi-val preorder">{stats.preorder}</div>
          <div className="admin-stock-progress-track">
            <div className="admin-stock-progress-bar preorder" style={{ width: `${stats.preorderPct}%` }} />
          </div>
        </div>

        <div className="admin-stock-kpi-card out">
          <div className="admin-stock-kpi-header">
            <span className="admin-stock-kpi-label">Out of Stock</span>
            <span className="admin-stock-kpi-pill out">{stats.outPct}%</span>
          </div>
          <div className="admin-stock-kpi-val out">{stats.out}</div>
          <div className="admin-stock-progress-track">
            <div className="admin-stock-progress-bar out" style={{ width: `${stats.outPct}%` }} />
          </div>
        </div>

        <div className="admin-stock-kpi-card backsoon">
          <div className="admin-stock-kpi-header">
            <span className="admin-stock-kpi-label">Back Soon</span>
            <span className="admin-stock-kpi-pill backsoon">{stats.backsoonPct}%</span>
          </div>
          <div className="admin-stock-kpi-val backsoon">{stats.backsoon}</div>
          <div className="admin-stock-progress-track">
            <div className="admin-stock-progress-bar backsoon" style={{ width: `${stats.backsoonPct}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Filter & Search Toolbar */}
      <div className="admin-stock-toolbar-card">
        <div className="admin-stock-filters-main-row">
          {/* Search Box */}
          <div className="admin-stock-search-box">
            <Search size={16} className="admin-stock-search-icon" />
            <input
              type="text"
              className="admin-stock-search-input"
              placeholder="Search by Design Code / SKU, Fabric, Title, VID, Loom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-stock-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          {/* Vendor Dropdown Selector */}
          <div className="admin-stock-select-wrapper">
            <label htmlFor="admin-vendor-filter" className="admin-stock-select-label">
              Vendor / Loom:
            </label>
            <select
              id="admin-vendor-filter"
              className="admin-stock-dropdown"
              value={selectedVendorKey}
              onChange={(e) => setSelectedVendorKey(e.target.value)}
            >
              <option value="all">All Loom Partners ({catalogProducts.length} designs)</option>
              {vendorOptions.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.displayName} ({v.count} designs)
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown Selector */}
          <div className="admin-stock-select-wrapper">
            <label htmlFor="admin-category-filter" className="admin-stock-select-label">
              Category:
            </label>
            <select
              id="admin-category-filter"
              className="admin-stock-dropdown"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="admin-stock-select-wrapper">
            <label htmlFor="admin-sort-filter" className="admin-stock-select-label">
              Sort:
            </label>
            <select
              id="admin-sort-filter"
              className="admin-stock-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Default Order</option>
              <option value="id-asc">SKU / ID (Ascending)</option>
              <option value="id-desc">SKU / ID (Descending)</option>
              <option value="updated-desc">Recently Updated (IST)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="admin-stock-view-toggle">
            <button
              type="button"
              className={`admin-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              className={`admin-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Compact Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Status Filter Tab Pills */}
        <div className="admin-stock-status-pills-row">
          <div className="admin-stock-pills-group">
            <button
              type="button"
              className={`admin-status-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Designs <span className="admin-pill-count">{filteredProducts.length}</span>
            </button>
            <button
              type="button"
              className={`admin-status-pill ready ${statusFilter === 'ready-stock' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ready-stock')}
            >
              <span className="admin-status-dot ready" />
              Ready Stock <span className="admin-pill-count">{stats.ready}</span>
            </button>
            <button
              type="button"
              className={`admin-status-pill preorder ${statusFilter === 'pre-order' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pre-order')}
            >
              <span className="admin-status-dot preorder" />
              Pre-Order <span className="admin-pill-count">{stats.preorder}</span>
            </button>
            <button
              type="button"
              className={`admin-status-pill out ${statusFilter === 'out-of-stock' ? 'active' : ''}`}
              onClick={() => setStatusFilter('out-of-stock')}
            >
              <span className="admin-status-dot out" />
              Out of Stock <span className="admin-pill-count">{stats.out}</span>
            </button>
            <button
              type="button"
              className={`admin-status-pill backsoon ${statusFilter === 'back-soon' ? 'active' : ''}`}
              onClick={() => setStatusFilter('back-soon')}
            >
              <span className="admin-status-dot backsoon" />
              Back Soon <span className="admin-pill-count">{stats.backsoon}</span>
            </button>
          </div>

          {/* Quick Select Buttons */}
          <div className="admin-stock-quick-select-wrap">
            <button
              type="button"
              className="admin-stock-select-page-btn"
              onClick={handleSelectAllOnPage}
            >
              {isAllPageSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              <span>{isAllPageSelected ? 'Deselect Page' : 'Select Page'}</span>
            </button>
            {sortedProducts.length > paginatedProducts.length && (
              <button
                type="button"
                className="admin-stock-select-all-btn"
                onClick={handleSelectAllFiltered}
              >
                Select All ({sortedProducts.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Batch Actions Bar (Visible when >= 1 item is selected) */}
      {selectedIds.size > 0 && (
        <div className="admin-stock-batch-bar animate-fade-in">
          <div className="admin-stock-batch-info">
            <span className="admin-stock-batch-badge">{selectedIds.size}</span>
            <span className="admin-stock-batch-text">
              designs selected across vendors
            </span>
          </div>

          <div className="admin-stock-batch-actions">
            <span className="admin-stock-batch-label">Set Stock to:</span>
            <button
              type="button"
              className="admin-batch-btn ready"
              onClick={() => handleBatchStatusUpdate('ready-stock')}
              disabled={batchActionLoading}
            >
              <span className="admin-status-dot ready" /> Ready Stock
            </button>
            <button
              type="button"
              className="admin-batch-btn preorder"
              onClick={() => handleBatchStatusUpdate('pre-order')}
              disabled={batchActionLoading}
            >
              <span className="admin-status-dot preorder" /> Pre-Order
            </button>
            <button
              type="button"
              className="admin-batch-btn out"
              onClick={() => handleBatchStatusUpdate('out-of-stock')}
              disabled={batchActionLoading}
            >
              <span className="admin-status-dot out" /> Out of Stock
            </button>
            <button
              type="button"
              className="admin-batch-btn backsoon"
              onClick={() => handleBatchStatusUpdate('back-soon')}
              disabled={batchActionLoading}
            >
              <span className="admin-status-dot backsoon" /> Back Soon
            </button>

            <button
              type="button"
              className="admin-batch-clear-btn"
              onClick={clearSelection}
              disabled={batchActionLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Batch Success Toast Notification */}
      {batchSuccessMsg && (
        <div className="admin-stock-success-toast animate-slide-down">
          <CheckCircle2 size={18} color="#15803d" />
          <span>{batchSuccessMsg}</span>
        </div>
      )}

      {/* 5. Products Content Area */}
      {loading ? (
        <div className="admin-stock-loading-box">
          <RefreshCw size={32} className="spin" />
          <p>Loading master vendor stock catalog and database overrides…</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="admin-stock-empty-box">
          <Boxes size={48} style={{ color: '#b8860b', opacity: 0.5, margin: '0 auto 12px' }} />
          <h3>No Matching Products Found</h3>
          <p>
            No designs match the current filters (Vendor: {selectedVendorKey === 'all' ? 'All' : selectedVendorKey}, Status: {statusFilter}, Search: &ldquo;{searchQuery}&rdquo;).
          </p>
          <button
            type="button"
            className="admin-stock-reset-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedVendorKey('all');
              setSelectedCategory('all');
              setStatusFilter('all');
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="admin-stock-cards-grid">
          {paginatedProducts.map((product) => {
            const pKey = product.id || product.groupKey;
            const override = stockOverrides[pKey];
            const activeStatus = getProductEffectiveStatus(product);
            const isSelected = selectedIds.has(pKey);

            const lastUpdatedText = override?.updatedAtIST || (override?.updatedAt ? formatISTDateTime(override.updatedAt) : null);
            const updatedByName = override?.updatedByName || null;
            const image = product.images?.[1] || product.images?.[0] || fallbackProductImage;

            const vid = String(product.vendorCode || product.raw?.VID || product.raw?.vid || 'N/A').trim();
            const partner = String(product.partner || product.raw?.Partner || product.raw?.partner || 'Loom Partner').trim();

            const rawCost = product.cost ??
              product.prices?.cost ??
              product.variants?.[0]?.prices?.cost ??
              product.raw?.Cost ??
              product.raw?.cost ??
              product.raw?.['Cost Price'] ??
              product.raw?.['Cost'] ??
              product.raw?.['cost_price'] ??
              product.cost_price;

            const costNumber = rawCost != null && rawCost !== '' ? Number(String(rawCost).replace(/[^\d.]/g, '')) : null;

            return (
              <div
                key={pKey}
                className={`admin-stock-card ${isSelected ? 'selected' : ''} ${justSavedId === pKey ? 'highlight-save' : ''}`}
              >
                {/* Select Checkbox & Vendor Header Tag */}
                <div className="admin-card-header-bar">
                  <button
                    type="button"
                    className="admin-card-checkbox-btn"
                    onClick={() => toggleSelectProduct(pKey)}
                    aria-label={`Select design ${pKey}`}
                  >
                    {isSelected ? (
                      <CheckSquare size={18} className="checkbox-checked-icon" />
                    ) : (
                      <Square size={18} className="checkbox-unchecked-icon" />
                    )}
                  </button>

                  <div className="admin-card-vendor-badge" title={`Vendor ${vid} - ${partner}`}>
                    {vid && vid !== 'N/A' && <span className="admin-card-vid-code">{vid}</span>}
                    <span className="admin-card-partner-name">{partner}</span>
                  </div>
                </div>

                {/* Main Card Content with Link */}
                <div className="admin-card-body">
                  <AppLink to="product" productId={product.id} className="admin-card-img-link" target="_blank">
                    <img src={image} alt={product.title} className="admin-card-thumb" loading="lazy" />
                  </AppLink>

                  <div className="admin-card-info">
                    <div className="admin-card-meta-row">
                      <AppLink to="product" productId={product.id} className="admin-card-sku-code" target="_blank">
                        {pKey}
                        <ExternalLink size={11} />
                      </AppLink>
                      <span className="admin-card-category-tag">{product.category || 'Saree'}</span>
                    </div>

                    {costNumber != null && costNumber > 0 && (
                      <div className="admin-card-cost-row">
                        <span className="admin-card-cost-label">Cost:</span>
                        <span className="admin-card-cost-val">₹{costNumber.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <h4 className="admin-card-title" title={product.title}>
                      {product.title}
                    </h4>

                    <div className="admin-card-spec-tags">
                      {product.fabric && <span className="spec-tag">{product.fabric}</span>}
                      {product.weave && <span className="spec-tag">{product.weave}</span>}
                    </div>
                  </div>
                </div>

                {/* 4 Single-Select Radio Options */}
                <div className="admin-card-stock-actions">
                  <div className="admin-stock-options-label">
                    Stock Availability:
                  </div>

                  <div className="admin-card-radio-grid">
                    {STOCK_STATUS_OPTIONS.map((opt) => {
                      const isRadioSelected = activeStatus === opt.key;
                      const optClass = opt.key === 'ready-stock' ? 'ready' :
                                       opt.key === 'pre-order' ? 'preorder' :
                                       opt.key === 'out-of-stock' ? 'outofstock' : 'backsoon';

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className={`admin-stock-radio-btn ${optClass} ${isRadioSelected ? 'selected' : ''}`}
                          onClick={() => handleSingleStatusChange(product, opt.key)}
                          aria-pressed={isRadioSelected}
                        >
                          <div className="admin-stock-radio-dot" />
                          <span className="admin-stock-radio-text">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* IST Timestamp & Saved Feedback */}
                  <div className="admin-card-footer">
                    <div className="admin-timestamp-text">
                      <Clock size={12} />
                      {lastUpdatedText ? (
                        <span>
                          Updated: <strong>{lastUpdatedText}</strong>
                          {updatedByName && <span className="admin-updater-text"> &bull; {updatedByName}</span>}
                        </span>
                      ) : (
                        <span className="admin-default-timestamp">Default availability</span>
                      )}
                    </div>

                    {justSavedId === pKey && (
                      <div className="admin-saved-feedback">
                        <Check size={13} /> Saved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="admin-stock-table-card">
          <div className="admin-stock-table-wrap">
            <table className="admin-stock-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="admin-table-select-all-btn"
                      onClick={handleSelectAllOnPage}
                      title="Select all on page"
                    >
                      {isAllPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </th>
                  <th style={{ width: '60px' }}>Image</th>
                  <th style={{ width: '110px' }}>SKU / ID</th>
                  <th style={{ width: '160px' }}>Loom / Vendor</th>
                  <th>Design & Specs</th>
                  <th style={{ width: '90px' }}>Cost</th>
                  <th style={{ width: '380px' }}>Stock Availability</th>
                  <th style={{ width: '200px' }}>Last Updated (IST)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const pKey = product.id || product.groupKey;
                  const override = stockOverrides[pKey];
                  const activeStatus = getProductEffectiveStatus(product);
                  const isSelected = selectedIds.has(pKey);

                  const lastUpdatedText = override?.updatedAtIST || (override?.updatedAt ? formatISTDateTime(override.updatedAt) : null);
                  const updatedByName = override?.updatedByName || null;
                  const image = product.images?.[1] || product.images?.[0] || fallbackProductImage;

                  const vid = String(product.vendorCode || product.raw?.VID || product.raw?.vid || 'N/A').trim();
                  const partner = String(product.partner || product.raw?.Partner || product.raw?.partner || 'Loom Partner').trim();

                  const rawCost = product.cost ??
                    product.prices?.cost ??
                    product.variants?.[0]?.prices?.cost ??
                    product.raw?.Cost ??
                    product.raw?.cost ??
                    product.raw?.['Cost Price'] ??
                    product.cost_price;

                  const costNumber = rawCost != null && rawCost !== '' ? Number(String(rawCost).replace(/[^\d.]/g, '')) : null;

                  return (
                    <tr
                      key={pKey}
                      className={`${isSelected ? 'row-selected' : ''} ${justSavedId === pKey ? 'row-saved' : ''}`}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="admin-table-checkbox-btn"
                          onClick={() => toggleSelectProduct(pKey)}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="checkbox-checked-icon" />
                          ) : (
                            <Square size={16} className="checkbox-unchecked-icon" />
                          )}
                        </button>
                      </td>
                      <td>
                        <AppLink to="product" productId={product.id} className="admin-table-thumb-link" target="_blank">
                          <img src={image} alt={product.title} className="admin-table-thumb" loading="lazy" />
                        </AppLink>
                      </td>
                      <td>
                        <AppLink to="product" productId={product.id} className="admin-table-sku" target="_blank">
                          {pKey}
                          <ExternalLink size={10} />
                        </AppLink>
                      </td>
                      <td>
                        <div className="admin-table-vendor-info">
                          {vid && vid !== 'N/A' && <span className="admin-card-vid-code">{vid}</span>}
                          <span className="admin-table-partner" title={partner}>{partner}</span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-table-product-cell">
                          <div className="admin-table-product-title" title={product.title}>
                            {product.title}
                          </div>
                          <div className="admin-table-product-specs">
                            <span className="spec-badge">{product.category || 'Saree'}</span>
                            {product.fabric && <span className="spec-badge">{product.fabric}</span>}
                            {product.weave && <span className="spec-badge">{product.weave}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {costNumber != null && costNumber > 0 ? (
                          <span className="admin-table-cost">₹{costNumber.toLocaleString('en-IN')}</span>
                        ) : (
                          <span style={{ color: '#a8a29e' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-table-radio-group">
                          {STOCK_STATUS_OPTIONS.map((opt) => {
                            const isRadioSelected = activeStatus === opt.key;
                            const optClass = opt.key === 'ready-stock' ? 'ready' :
                                             opt.key === 'pre-order' ? 'preorder' :
                                             opt.key === 'out-of-stock' ? 'outofstock' : 'backsoon';

                            return (
                              <button
                                key={opt.key}
                                type="button"
                                className={`admin-table-status-btn ${optClass} ${isRadioSelected ? 'selected' : ''}`}
                                onClick={() => handleSingleStatusChange(product, opt.key)}
                                title={`Set to ${opt.label}`}
                              >
                                <span className="table-radio-dot" />
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="admin-table-timestamp-cell">
                          {lastUpdatedText ? (
                            <>
                              <span className="table-timestamp-val">{lastUpdatedText}</span>
                              {updatedByName && <span className="table-updater-val">{updatedByName}</span>}
                            </>
                          ) : (
                            <span className="table-default-text">Default</span>
                          )}
                          {justSavedId === pKey && (
                            <span className="table-saved-badge">
                              <Check size={11} /> Saved
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Pagination Bar */}
      {sortedProducts.length > 0 && (
        <div className="admin-stock-pagination-bar">
          <div className="admin-pagination-left">
            <span>
              Showing <strong>{pageSize === 'all' ? sortedProducts.length : Math.min(sortedProducts.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
              <strong>{pageSize === 'all' ? sortedProducts.length : Math.min(sortedProducts.length, currentPage * pageSize)}</strong> of{' '}
              <strong>{sortedProducts.length}</strong> designs
            </span>
            <div className="admin-pagesize-select-wrap">
              <label htmlFor="admin-page-size" style={{ fontSize: '12px', color: '#78716c' }}>
                Per page:
              </label>
              <select
                id="admin-page-size"
                className="admin-pagesize-select"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
                <option value="all">All ({sortedProducts.length})</option>
              </select>
            </div>
          </div>

          {pageSize !== 'all' && totalPages > 1 && (
            <div className="admin-pagination-nav">
              <button
                type="button"
                className="admin-page-nav-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>

              <div className="admin-page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = Math.min(totalPages - 4 + i, currentPage - 2 + i);
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`admin-page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="admin-page-nav-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
