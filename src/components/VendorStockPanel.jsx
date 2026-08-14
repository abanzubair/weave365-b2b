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
  Tag
} from 'lucide-react';
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

import { adminEmails } from '../config.js';

export function VendorStockPanel({ user, buyerProfile, products = [] }) {
  const [catalogProducts, setCatalogProducts] = useState(() => (Array.isArray(products) && products.length > 0 ? products : []));
  const [stockOverrides, setStockOverrides] = useState(() => getVendorStockLocal());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [justSavedId, setJustSavedId] = useState(null);


  // Check administrative privilege
  const userEmail = String(user?.email || '').toLowerCase().trim();
  const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail)) || user?.role === 'admin';

  // Vendor identity from profile
  const profileBusinessName = String(buyerProfile?.business_name || user?.user_metadata?.buyer_profile?.business_name || user?.buyer_profile?.business_name || '').trim();
  const profileFullName = String(buyerProfile?.full_name || user?.user_metadata?.buyer_profile?.full_name || user?.buyer_profile?.full_name || '').trim();
  const profileVid = String(buyerProfile?.vendor_code || user?.user_metadata?.buyer_profile?.vendor_code || user?.buyer_profile?.vendor_code || '').trim();
  const profilePartner = String(buyerProfile?.partner_name || user?.user_metadata?.buyer_profile?.partner_name || user?.buyer_profile?.partner_name || '').trim();

  // Extract all distinct vendor identities from the catalog
  const vendorOptions = useMemo(() => {
    const map = new Map();
    for (const p of catalogProducts) {
      const vid = String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').trim();
      const partner = String(p.partner || p.raw?.Partner || p.raw?.partner || '').trim();
      if (!vid && !partner) continue;
      
      const key = `${vid}:::${partner}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          vid: vid || 'N/A',
          partner: partner || 'Partner',
          displayName: vid && partner ? `${vid} ${partner}` : (vid ? `Vendor ${vid}` : partner),
          count: 1
        });
      } else {
        const item = map.get(key);
        item.count += 1;
      }
    }
    const list = Array.from(map.values()).sort((a, b) => a.vid.localeCompare(b.vid, undefined, { numeric: true }));
    if (list.length > 0 && isAdmin) {
      list.unshift({
        key: 'all',
        vid: 'all',
        partner: 'All Catalog Designs',
        displayName: `All Designs (${catalogProducts.length})`,
        count: catalogProducts.length
      });
    }
    return list;
  }, [catalogProducts, isAdmin]);

  // Automatic Google Sheet match resolution (by Partner Name, Business Name, Full Name, Email, or VID)
  const autoMatchedVendor = useMemo(() => {
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
    if (profileVid) {
      const found = vendorOptions.find(v => v.vid === profileVid);
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
        return { key: `${vid}:::${partner}`, vid: vid || 'N/A', partner: partner || profileBusinessName || 'Partner', displayName: `${vid} ${partner}`.trim(), count: 1 };
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

    const matchedPartner = (autoMatchedVendor?.partner || profilePartner || profileBusinessName || '').toLowerCase().trim();
    const matchedVid = (autoMatchedVendor?.vid !== 'N/A' ? autoMatchedVendor?.vid : profileVid || '').trim();

    return catalogProducts.filter((p) => {
      const pVid = String(p.vendorCode || p.raw?.VID || p.raw?.vid || '').trim();
      const pPartner = String(p.partner || p.raw?.Partner || p.raw?.partner || '').toLowerCase().trim();
      const pEmail = String(p.raw?.['Vendor Email'] || p.raw?.['Email'] || '').toLowerCase().trim();

      // If matched by partner/business name, strictly match that partner
      if (matchedPartner && pPartner === matchedPartner) return true;

      // If matched by specific VID (e.g. V01)
      if (matchedVid && matchedVid !== 'all' && pVid === matchedVid) {
        if (!matchedPartner || pPartner === matchedPartner || !pPartner) {
          return true;
        }
      }

      if (userEmail && pEmail && pEmail === userEmail) return true;

      // Admin manual dropdown selection
      if (isAdmin && selectedVendorKey) {
        if (selectedVendorKey.includes(':::')) {
          const [sVid, sPartner] = selectedVendorKey.split(':::');
          if (pVid === sVid && (!sPartner || pPartner === sPartner.toLowerCase())) return true;
        } else if (pVid === selectedVendorKey || pPartner === selectedVendorKey.toLowerCase()) {
          return true;
        }
      }

      return false;
    });
  }, [catalogProducts, selectedVendorKey, autoMatchedVendor, profileVid, profilePartner, profileBusinessName, userEmail, isAdmin]);

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
    const found = vendorOptions.find(v => v.key === selectedVendorKey || v.vid === (profileVid || selectedVendorKey) || v.partner.toLowerCase() === (profilePartner || selectedVendorKey).toLowerCase());
    if (found) return found;
    return {
      vid: profileVid || selectedVendorKey || '02',
      partner: profilePartner || profileBusinessName || 'Loom Partner',
      displayName: profileVid && profilePartner ? `${profileVid} ${profilePartner}` : (profileVid ? `Vendor ${profileVid}` : (profilePartner || profileBusinessName || 'Assigned Vendor'))
    };
  }, [vendorOptions, selectedVendorKey, autoMatchedVendor, profileVid, profilePartner, profileBusinessName, isAdmin]);

  // Apply search query and status tab filter
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

      if (query) {
        const codeMatch = String(pKey || '').toLowerCase().includes(query) ||
                          String(p.vendorCode || '').toLowerCase().includes(query) ||
                          (p.variants || []).some(v => String(v.code || '').toLowerCase().includes(query));
        const titleMatch = String(p.title || '').toLowerCase().includes(query);
        const categoryMatch = String(p.category || '').toLowerCase().includes(query);
        const fabricMatch = String(p.fabric || '').toLowerCase().includes(query);
        if (!codeMatch && !titleMatch && !categoryMatch && !fabricMatch) return false;
      }

      return true;
    });
  }, [vendorProducts, stockOverrides, searchQuery, statusFilter]);

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
    return (
      <div className="vendor-stock-dashboard">
        <div className="vendor-stock-header-card">
          <div className="vendor-stock-kicker">
            <Boxes size={14} /> Stock & Availability
          </div>
          <h2 className="vendor-stock-heading">Vendor Stock & Availability Portal</h2>
          <div style={{ background: '#faf8f5', borderRadius: '10px', padding: '32px 24px', textAlign: 'center', marginTop: '12px', border: '1px dashed #dcd5c9' }}>
            <AlertCircle size={40} color="#b8860b" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1612', marginBottom: '8px' }}>
              Vendor Account Pending VID Linkage
            </h3>
            <p style={{ fontSize: '14px', color: '#57534e', maxWidth: '560px', margin: '0 auto 16px', lineHeight: '1.6' }}>
              Your account (<strong>{buyerProfile?.business_name || buyerProfile?.full_name || user?.email}</strong>) has been registered as a Loom / Vendor Partner. Once the Weave365 admin assigns your specific <strong>Vendor Code (VID)</strong> in the system, your loom products will automatically appear here for stock and price updates.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fdf8ee', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: '#996515', border: '1px solid rgba(184, 134, 11, 0.25)' }}>
              Registered Email: <strong style={{ color: '#1a1612' }}>{user?.email}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-stock-dashboard">
      {/* Header Card */}
      <div className="vendor-stock-header-card">
        <div className="vendor-stock-header-top">
          <div>
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
            <span className="vendor-stat-num">{stats.total}</span>
            <span className="vendor-stat-label">Total Products</span>
          </div>
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
              placeholder="Search code, fabric..."
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
