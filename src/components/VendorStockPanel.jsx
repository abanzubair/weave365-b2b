/**
 * @file VendorStockPanel.jsx
 * @description Vendor stock & availability management dashboard component.
 * Allows weaver and brand partners to mark their products as Ready Stock, Pre-Order,
 * Out of Stock, or Back Soon, mapped by VID (Vendor ID) and Partner name, with IST timestamp tracking.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  Search, 
  CheckCircle2, 
  Clock, 
  Boxes, 
  Check, 
  RefreshCw, 
  Filter, 
  AlertCircle,
  TrendingUp,
  Tag,
  MessageCircle
} from 'lucide-react';
import '../styles/vendorStock.css';
import { 
  STOCK_STATUS_OPTIONS, 
  formatISTDateTime, 
  getVendorStockLocal, 
  fetchVendorStockOverrides, 
  saveVendorProductStock, 
  VENDOR_STOCK_UPDATED_EVENT 
} from '../utils/vendorStockService.js';
import { fetchProducts } from '../productData.js';
import { fallbackProductImage } from '../storefrontShared.jsx';
import { AppLink } from './AppLink.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';

import { adminEmails } from '../config.js';

function normalizeVendorCode(vid) {
  if (!vid || vid === 'all' || vid === 'N/A') return '';
  const clean = String(vid).trim();
  const digits = clean.replace(/\D/g, '');
  if (!digits) return clean.toUpperCase();
  return `V${digits.padStart(2, '0')}`;
}

export function VendorStockPanel({ user, buyerProfile, products = [] }) {
  const [catalogProducts, setCatalogProducts] = useState(() => (Array.isArray(products) && products.length > 0 ? products : []));
  const [stockOverrides, setStockOverrides] = useState(() => getVendorStockLocal());
  const [loading, setLoading] = useState(() => !Array.isArray(products) || products.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [justSavedId, setJustSavedId] = useState(null);

  // Sync products if prop updates or fetch if initially empty
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      setCatalogProducts(products);
      setLoading(false);
    } else if (catalogProducts.length === 0) {
      setLoading(true);
      fetchProducts()
        .then((data) => setCatalogProducts(data || []))
        .catch((err) => console.error('[VendorStockPanel] Error loading products:', err))
        .finally(() => setLoading(false));
    }
  }, [products]);

  // Check administrative privilege
  const userEmail = String(user?.email || '').toLowerCase().trim();
  const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail)) || user?.role === 'admin' || user?.user_metadata?.role === 'admin' || buyerProfile?.role === 'admin';

  // Vendor identity from profile
  const profileBusinessName = String(buyerProfile?.business_name || user?.user_metadata?.buyer_profile?.business_name || user?.buyer_profile?.business_name || '').trim();
  const profileFullName = String(buyerProfile?.full_name || user?.user_metadata?.buyer_profile?.full_name || user?.buyer_profile?.full_name || '').trim();
  const profileVid = String(buyerProfile?.vendor_code || user?.user_metadata?.buyer_profile?.vendor_code || user?.buyer_profile?.vendor_code || '').trim();
  const profilePartner = String(buyerProfile?.partner_name || user?.user_metadata?.buyer_profile?.partner_name || user?.buyer_profile?.partner_name || '').trim();

  // Extract all distinct vendor identities from the catalog
  const vendorOptions = useMemo(() => {
    const map = new Map();
    for (const p of catalogProducts) {
      const rawVid = String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').trim();
      const normVid = normalizeVendorCode(rawVid);
      const partner = String(p.partner || p.raw?.Partner || p.raw?.partner || '').trim();
      if (!normVid && !partner) continue;
      
      const primaryKey = normVid || partner.toLowerCase();
      if (!map.has(primaryKey)) {
        map.set(primaryKey, {
          key: primaryKey,
          vid: normVid || rawVid || 'N/A',
          rawVid: rawVid || 'N/A',
          partner: partner || '',
          count: 1
        });
      } else {
        const item = map.get(primaryKey);
        item.count += 1;
        if (!item.partner && partner) {
          item.partner = partner;
        }
      }
    }
    const list = Array.from(map.values()).map(item => {
      const pName = item.partner || (item.vid !== 'N/A' ? '' : 'Partner');
      const displayName = item.vid !== 'N/A' && pName
        ? `${item.vid} ${pName}`
        : (item.vid !== 'N/A' ? `Vendor ${item.vid}` : pName || 'Partner');
      return {
        ...item,
        partner: pName || 'Partner',
        displayName,
      };
    }).sort((a, b) => a.vid.localeCompare(b.vid, undefined, { numeric: true }));
    if (list.length > 0 && isAdmin) {
      list.unshift({
        key: 'all',
        vid: 'all',
        rawVid: 'all',
        partner: 'All Catalog Designs',
        displayName: `All Designs (${catalogProducts.length})`,
        count: catalogProducts.length
      });
    }
    return list;
  }, [catalogProducts, isAdmin]);

  // Automatic Google Sheet match resolution (by Partner Name, Business Name, Full Name, Email, or VID)
  const autoMatchedVendor = useMemo(() => {
    const normProfileVid = normalizeVendorCode(profileVid);
    if (profileBusinessName) {
      const found = vendorOptions.find(v => v.partner.toLowerCase() === profileBusinessName.toLowerCase());
      if (found) return found;
    }
    if (profilePartner) {
      const found = vendorOptions.find(v => v.partner.toLowerCase() === profilePartner.toLowerCase());
      if (found) return found;
    }
    if (profileFullName) {
      const found = vendorOptions.find(v => v.partner.toLowerCase() === profileFullName.toLowerCase());
      if (found) return found;
    }
    if (normProfileVid) {
      const found = vendorOptions.find(v => normalizeVendorCode(v.vid) === normProfileVid || v.rawVid === profileVid);
      if (found) return found;
    }
    // Check if any product in the catalog contains vendor email in raw CSV columns
    if (userEmail) {
      const matchedProd = catalogProducts.find(p => {
        const pEmail = String(p.raw?.['Vendor Email'] || p.raw?.['Email'] || p.raw?.['vendor_email'] || '').toLowerCase().trim();
        return pEmail === userEmail;
      });
      if (matchedProd) {
        const vid = String(matchedProd.vendorCode || matchedProd.raw?.VID || '').trim();
        const partner = String(matchedProd.partner || matchedProd.raw?.Partner || '').trim();
        return { key: `${normalizeVendorCode(vid) || vid}:::${partner}`, vid: normalizeVendorCode(vid) || vid || 'N/A', partner: partner || profileBusinessName || 'Partner', displayName: `${vid} ${partner}`.trim(), count: 1 };
      }
    }
    return null;
  }, [vendorOptions, catalogProducts, profileVid, profilePartner, profileBusinessName, profileFullName, userEmail]);

  const isAssigned = Boolean(profileVid || profilePartner || autoMatchedVendor || isAdmin);

  const [selectedVendorKey, setSelectedVendorKey] = useState(() => {
    if (autoMatchedVendor) return autoMatchedVendor.key;
    if (profileVid) return profileVid;
    if (profilePartner) return profilePartner;
    return isAdmin ? 'all' : '';
  });

  // Sync selected vendor key once auto-match is resolved
  useEffect(() => {
    if (autoMatchedVendor) {
      setSelectedVendorKey(autoMatchedVendor.key);
    } else if (isAdmin && selectedVendorKey === '') {
      setSelectedVendorKey('all');
    }
  }, [autoMatchedVendor, isAdmin]);

  // Fetch overrides on mount and listen to live events
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const remoteData = await fetchVendorStockOverrides();
        if (mounted) {
          setStockOverrides(remoteData);
        }
      } catch (err) {
        console.error('[VendorStockPanel] Failed to fetch stock data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();

    const handleUpdate = (e) => {
      if (e.detail && mounted) {
        setStockOverrides(e.detail);
      }
    };
    window.addEventListener(VENDOR_STOCK_UPDATED_EVENT, handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener(VENDOR_STOCK_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Filter products belonging strictly to this vendor
  const vendorProducts = useMemo(() => {
    if (isAdmin && selectedVendorKey === 'all') return catalogProducts;

    const matchedPartner = String(autoMatchedVendor?.partner || profilePartner || profileBusinessName || '').toLowerCase().trim();
    const matchedVid = String((autoMatchedVendor?.vid && autoMatchedVendor.vid !== 'N/A') ? autoMatchedVendor.vid : (profileVid || '')).trim();
    const normMatchedVid = normalizeVendorCode(matchedVid);

    return catalogProducts.filter((p) => {
      const rawPVid = String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').trim();
      const normPVid = normalizeVendorCode(rawPVid);
      const pPartner = String(p.partner || p.raw?.Partner || p.raw?.partner || '').toLowerCase().trim();
      const pEmail = String(p.raw?.['Vendor Email'] || p.raw?.['Email'] || '').toLowerCase().trim();

      // If matched by partner/business name, match that partner
      if (matchedPartner && pPartner === matchedPartner) return true;

      // If matched by normalized VID (e.g. V02 matches V02, 02, v02, 2)
      if (normMatchedVid && normMatchedVid !== 'ALL') {
        if (normPVid === normMatchedVid || rawPVid === matchedVid) {
          if (!matchedPartner || !pPartner || pPartner === matchedPartner) {
            return true;
          }
        }
      }

      if (userEmail && pEmail && pEmail === userEmail) return true;

      // Admin manual dropdown selection
      if (isAdmin && selectedVendorKey) {
        if (selectedVendorKey === 'all') return true;
        const normSelected = normalizeVendorCode(selectedVendorKey);
        if (normSelected) {
          if (normPVid === normSelected || rawPVid === selectedVendorKey) return true;
        } else if (selectedVendorKey.includes(':::')) {
          const [sVid, sPartner] = selectedVendorKey.split(':::');
          const normSVid = normalizeVendorCode(sVid);
          const vidMatches = normPVid === normSVid || rawPVid === sVid;
          const partnerMatches = !sPartner || pPartner === sPartner.toLowerCase();
          if (vidMatches && partnerMatches) return true;
        } else if (normPVid === normalizeVendorCode(selectedVendorKey) || rawPVid === selectedVendorKey || pPartner === selectedVendorKey.toLowerCase()) {
          return true;
        }
      }

      return false;
    });
  }, [catalogProducts, selectedVendorKey, autoMatchedVendor, profileVid, profilePartner, profileBusinessName, userEmail, isAdmin]);

  // Extract distinct categories available for this vendor
  const vendorCategories = useMemo(() => {
    const counts = {};
    for (const p of vendorProducts) {
      const cat = p.category ? p.category.trim() : 'Saree';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [vendorProducts]);

  // Current vendor display name
  const currentVendorInfo = useMemo(() => {
    if (isAdmin && selectedVendorKey === 'all') {
      return {
        vid: 'ALL',
        partner: 'All Catalog Designs',
        displayName: `Administrator View (All Designs)`
      };
    }
    if (autoMatchedVendor) return autoMatchedVendor;
    const found = vendorOptions.find(v => v.key === selectedVendorKey || normalizeVendorCode(v.vid) === normalizeVendorCode(profileVid || selectedVendorKey) || String(v.partner || '').toLowerCase() === String(profilePartner || selectedVendorKey || '').toLowerCase());
    if (found) return found;
    return {
      vid: profileVid || selectedVendorKey || 'V02',
      partner: profilePartner || profileBusinessName || 'Loom Partner',
      displayName: profileVid && profilePartner ? `${profileVid} ${profilePartner}` : (profileVid ? `Vendor ${profileVid}` : (profilePartner || profileBusinessName || 'Assigned Vendor'))
    };
  }, [isAdmin, selectedVendorKey, autoMatchedVendor, vendorOptions, profileVid, profilePartner, profileBusinessName]);

  // Fast vendor code to partner name lookup
  const vendorNameMap = useMemo(() => {
    const map = new Map();
    for (const v of vendorOptions) {
      if (v.vid && v.partner) map.set(normalizeVendorCode(v.vid).toLowerCase(), v.partner.toLowerCase());
    }
    return map;
  }, [vendorOptions]);

  // Apply category filter, search query and status tab filter
  const displayedProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vendorProducts.filter((p) => {
      const pKey = p.id || p.groupKey;
      const override = stockOverrides[pKey];
      
      // Determine effective status: override -> parsed product status -> ready-stock
      let currentStatus = override ? override.stockStatus : null;
      if (!currentStatus) {
        if (p.isOutOfStock) currentStatus = 'out-of-stock';
        else if (p.isPreOrder) currentStatus = 'pre-order';
        else if (p.isBackSoon) currentStatus = 'back-soon';
        else currentStatus = 'ready-stock';
      }

      if (statusFilter !== 'all' && currentStatus !== statusFilter) {
        return false;
      }

      if (selectedCategory !== 'all') {
        const pCat = String(p.category || 'Saree').toLowerCase();
        if (pCat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      if (query) {
        const rawVid = String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').toLowerCase();
        const normVid = normalizeVendorCode(rawVid).toLowerCase();
        const partnerName = String(p.partner || p.raw?.Partner || p.raw?.partner || p.raw?.['Vendor Name'] || p.raw?.Vendor || '').toLowerCase();
        const knownPartner = (normVid && vendorNameMap.get(normVid)) || '';

        const codeMatch = String(pKey || '').toLowerCase().includes(query) ||
                          rawVid.includes(query) ||
                          normVid.includes(query) ||
                          (p.variants || []).some(v => String(v.code || '').toLowerCase().includes(query));
        const partnerMatch = partnerName.includes(query) || knownPartner.includes(query);
        const titleMatch = String(p.title || '').toLowerCase().includes(query);
        const categoryMatch = String(p.category || '').toLowerCase().includes(query);
        const fabricMatch = String(p.fabric || '').toLowerCase().includes(query);
        const weaveMatch = String(p.weave || '').toLowerCase().includes(query);
        if (!codeMatch && !partnerMatch && !titleMatch && !categoryMatch && !fabricMatch && !weaveMatch) return false;
      }

      return true;
    });
  }, [vendorProducts, stockOverrides, searchQuery, statusFilter, selectedCategory, vendorNameMap]);

  // Calculate statistics for the active vendor products
  const stats = useMemo(() => {
    let ready = 0;
    let preorder = 0;
    let out = 0;
    let backsoon = 0;

    for (const p of vendorProducts) {
      const pKey = p.id || p.groupKey;
      const override = stockOverrides[pKey];
      let currentStatus = override ? override.stockStatus : null;
      if (!currentStatus) {
        if (p.isOutOfStock) currentStatus = 'out-of-stock';
        else if (p.isPreOrder) currentStatus = 'pre-order';
        else if (p.isBackSoon) currentStatus = 'back-soon';
        else currentStatus = 'ready-stock';
      }

      if (currentStatus === 'ready-stock') ready++;
      else if (currentStatus === 'pre-order') preorder++;
      else if (currentStatus === 'out-of-stock') out++;
      else if (currentStatus === 'back-soon') backsoon++;
    }

    return { total: vendorProducts.length, ready, preorder, out, backsoon };
  }, [vendorProducts, stockOverrides]);

  // Handle single stock status change
  const handleStatusChange = async (product, newStatus) => {
    const pKey = product.id || product.groupKey;
    const vid = String(product.vendorCode || currentVendorInfo.vid || '').trim();
    const partner = String(product.partner || currentVendorInfo.partner || '').trim();
    const userName = buyerProfile?.full_name || buyerProfile?.business_name || user?.email || 'Vendor';

    setJustSavedId(pKey);
    setTimeout(() => setJustSavedId(null), 2500);

    const result = await saveVendorProductStock({
      productId: pKey,
      vendorCode: vid,
      vendorName: partner,
      stockStatus: newStatus,
      userId: user?.id,
      userName: userName
    });

    if (result.item) {
      setStockOverrides(prev => ({
        ...prev,
        [pKey]: result.item
      }));
    }
  };



  if (!isAssigned) {
    const businessOrName = buyerProfile?.business_name || buyerProfile?.full_name || user?.email || 'Partner';
    const sellerWaMsg = `Hello Weave 365 Team,\n\nI have registered as a seller on Weave 365 (${businessOrName}, Email: ${user?.email || ''}). Could you please help activate my vendor portal?`;
    const waUrl = `https://wa.me/919919101369?text=${encodeURIComponent(sellerWaMsg)}`;

    return (
      <div className="vendor-stock-pending-view">
        <Clock size={32} className="vendor-stock-pending-icon" aria-hidden="true" />

        <h2 className="vendor-stock-pending-title">
          Catalog Setup in Progress
        </h2>

        <p className="vendor-stock-pending-desc">
          Your seller account for <strong>{businessOrName}</strong> is ready. To speed up catalog linking, send our onboarding team your collection details on WhatsApp.
        </p>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="vendor-stock-pending-wa-btn"
        >
          <WhatsappIcon size={17} />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    );
  }

  return (
    <div className="vendor-stock-dashboard">
      {/* Header Card */}
      <div className="vendor-stock-header-card">
        <div className="vendor-stock-header-top">
          <div className="vendor-stock-title-wrap">
            <h2 className="vendor-stock-heading">Product Availability Portal</h2>
            <div className="vendor-identity-pill">
              {currentVendorInfo.vid && currentVendorInfo.vid !== 'N/A' && (
                <span className="vendor-vid-code">{currentVendorInfo.vid}</span>
              )}
              <span>{currentVendorInfo.partner || currentVendorInfo.displayName}</span>
            </div>
          </div>

          {/* Vendor Selector Dropdown (Admin Only) */}
          {isAdmin && (
            <div className="vendor-selector-wrap">
              <label htmlFor="vendor-vid-select" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Admin Switch VID:
              </label>
              <select
                id="vendor-vid-select"
                className="vendor-vid-select"
                value={selectedVendorKey}
                onChange={(e) => setSelectedVendorKey(e.target.value)}
              >
                {vendorOptions.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.displayName} ({v.count} designs)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Real-Time Stats Ribbon */}
        <div className="vendor-stock-stats-ribbon">
          <div className="vendor-stat-item">
            <span className="vendor-stat-num ready">{stats.ready}</span>
            <span className="vendor-stat-label">Ready Stock</span>
          </div>
          <div className="vendor-stat-item">
            <span className="vendor-stat-num preorder">{stats.preorder}</span>
            <span className="vendor-stat-label">Pre Order</span>
          </div>
          <div className="vendor-stat-item">
            <span className="vendor-stat-num outofstock">{stats.out}</span>
            <span className="vendor-stat-label">Out of Stock</span>
          </div>
          <div className="vendor-stat-item">
            <span className="vendor-stat-num backsoon">{stats.backsoon}</span>
            <span className="vendor-stat-label">Back Soon</span>
          </div>
          <div className="vendor-stat-item">
            <span className="vendor-stat-num">{stats.total}</span>
            <span className="vendor-stat-label">Total Products</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="vendor-stock-controls">
        <div className="vendor-stock-search-row">
          <div className="vendor-search-input-wrap">
            <Search className="vendor-search-icon" size={14} />
            <input
              type="text"
              className="vendor-stock-search-input"
              placeholder="Search designs, vendor, fabric..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Pills */}
          <button
            type="button"
            className={`vendor-filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({vendorProducts.length})
          </button>
          <button
            type="button"
            className={`vendor-filter-tab ready-tab ${statusFilter === 'ready-stock' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ready-stock')}
          >
            Ready ({stats.ready})
          </button>
          <button
            type="button"
            className={`vendor-filter-tab preorder-tab ${statusFilter === 'pre-order' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pre-order')}
          >
            Pre-Order ({stats.preorder})
          </button>
          <button
            type="button"
            className={`vendor-filter-tab out-tab ${statusFilter === 'out-of-stock' ? 'active' : ''}`}
            onClick={() => setStatusFilter('out-of-stock')}
          >
            Out ({stats.out})
          </button>
          <button
            type="button"
            className={`vendor-filter-tab backsoon-tab ${statusFilter === 'back-soon' ? 'active' : ''}`}
            onClick={() => setStatusFilter('back-soon')}
          >
            Back Soon ({stats.backsoon})
          </button>
        </div>

        {/* Category Filter Pills (when vendor has products in multiple categories) */}
        {Object.keys(vendorCategories).length > 1 && (
          <div className="vendor-category-tabs-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#78716c', marginRight: '4px' }}>Category:</span>
            <button
              type="button"
              className={`vendor-filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              style={{ fontSize: '12px', padding: '4px 12px' }}
              onClick={() => setSelectedCategory('all')}
            >
              All Categories ({vendorProducts.length})
            </button>
            {Object.entries(vendorCategories).map(([catName, catCount]) => (
              <button
                key={catName}
                type="button"
                className={`vendor-filter-tab ${selectedCategory.toLowerCase() === catName.toLowerCase() ? 'active' : ''}`}
                style={{ fontSize: '12px', padding: '4px 12px' }}
                onClick={() => setSelectedCategory(catName)}
              >
                {catName} ({catCount})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8c827a' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px' }} />
          <p>Loading vendor catalog and stock overrides...</p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="vendor-stock-empty">
          <Boxes size={36} style={{ color: '#b8860b', margin: '0 auto 8px' }} />
          <h4>No Products Found</h4>
          <p>No products match your current search or status filter for Vendor {currentVendorInfo.displayName}.</p>
        </div>
      ) : (
        <div className="vendor-stock-grid">
          {displayedProducts.map((product) => {
            const pKey = product.id || product.groupKey;
            const override = stockOverrides[pKey];

            // Determine active status
            let activeStatus = override ? override.stockStatus : null;
            if (!activeStatus) {
              if (product.isOutOfStock) activeStatus = 'out-of-stock';
              else if (product.isPreOrder) activeStatus = 'pre-order';
              else if (product.isBackSoon) activeStatus = 'back-soon';
              else activeStatus = 'ready-stock';
            }

            const lastUpdatedText = override?.updatedAtIST || (override?.updatedAt ? formatISTDateTime(override.updatedAt) : null);
            const image = product.images?.[1] || product.images?.[0] || fallbackProductImage;

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
              <div className="vendor-product-card" key={pKey}>
                <AppLink to="product" productId={product.id} className="vendor-card-main vendor-card-link">
                  <div className="vendor-card-img-wrap">
                    <img src={image} alt={product.title} className="vendor-card-img" loading="lazy" />
                  </div>
                  <div className="vendor-card-meta">
                    <div className="vendor-card-code-row">
                      <span className="vendor-card-code">{pKey}</span>
                      <span className="vendor-card-category">{product.category || 'Saree'}</span>
                    </div>
                    {(product.vendorCode || product.partner) && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', background: '#f5f0e6', padding: '2px 8px', borderRadius: '4px', color: '#5a4f43', fontWeight: '600', margin: '3px 0' }}>
                        {product.vendorCode && <span style={{ fontFamily: 'monospace', color: '#1a1612', background: '#e8e0d0', padding: '0 4px', borderRadius: '2px' }}>{product.vendorCode}</span>}
                        <span>{product.partner || 'Loom Partner'}</span>
                      </div>
                    )}
                    {costNumber != null && costNumber > 0 && (
                      <div className="vendor-card-price-row">
                        <span className="vendor-card-price-val">₹{costNumber.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="vendor-card-title" title={product.title}>
                      {product.title}
                    </div>
                    <div className="vendor-card-details">
                      {product.fabric && <span>{product.fabric}</span>}
                      {product.weave && <span> • {product.weave}</span>}
                    </div>
                  </div>
                </AppLink>

                {/* 4 Single-Select Radio Options */}
                <div className="vendor-stock-action-block">
                  <div className="vendor-stock-options-label">
                    Stock Availability:
                  </div>

                  <div className="vendor-stock-options-grid">
                    {STOCK_STATUS_OPTIONS.map((opt) => {
                      const isSelected = activeStatus === opt.key;
                      const optClass = opt.key === 'ready-stock' ? 'ready' :
                                       opt.key === 'pre-order' ? 'preorder' :
                                       opt.key === 'out-of-stock' ? 'outofstock' : 'backsoon';

                      return (
                        <button
                          key={opt.key}
                          type="button"
                          className={`vendor-stock-radio-btn ${optClass} ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleStatusChange(product, opt.key)}
                          aria-pressed={isSelected}
                        >
                          <div className="vendor-stock-radio-dot" />
                          <span className="vendor-stock-radio-text">
                            {opt.number}. {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* IST Timestamp & Saved Feedback */}
                  <div className="vendor-stock-footer-row">
                    <div className="vendor-timestamp-text">
                      <Clock size={12} />
                      {lastUpdatedText ? (
                        <span>Last updated: <span className="vendor-timestamp-val">{lastUpdatedText}</span></span>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#9e9488' }}>Default availability (click option to update)</span>
                      )}
                    </div>

                    {justSavedId === pKey && (
                      <div className="vendor-saved-indicator">
                        <Check size={13} /> Saved
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
