import { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Mail,
  User,
  ShoppingBag,
  Heart,
  ChevronDown,
  RefreshCw,
  Clock,
  MapPin,
  Building,
  Phone,
  Tag
} from 'lucide-react';
import { getProductCategorySlug } from '../../config.js';

/**
 * BuyerActivity Component
 * Displays a unified timeline table of all buyer interactions:
 * - Favourites (Wishlist items)
 * - Enquiry (Quotes and purchase inquiries)
 * - Abandoned Carts (Incomplete cart sessions older than 24h)
 * - Shopping Carts (Active buyer shopping carts)
 */
export default function BuyerActivity({ adminData, products = [], loadAdminData }) {
  const [activityFilter, setActivityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});

  // 1. Build map of profiles by ID
  const profileMap = useMemo(() => {
    const map = new Map();
    (adminData.profiles || []).forEach((p) => {
      if (p.id) map.set(p.id, p);
      if (p.email) map.set(p.email.toLowerCase(), p);
    });
    return map;
  }, [adminData.profiles]);

  // 2. Build product lookup map
  const productMap = useMemo(() => {
    const map = new Map();
    (products || []).forEach((prod) => {
      const pid = String(prod.id || '').trim();
      if (pid) map.set(pid, prod);
    });
    return map;
  }, [products]);

  // Helper to resolve product details
  const getProductDetails = (itemKey, variantCode) => {
    const rawKey = String(itemKey || variantCode || '').trim();
    const pidMatch = rawKey.match(/^[0-9]+/);
    const pid = pidMatch ? pidMatch[0] : rawKey;
    const prod = productMap.get(pid);

    const title = prod ? prod.title : (itemKey ? `Product #${rawKey}` : 'Banarasi Craft Article');
    const categorySlug = getProductCategorySlug(pid, prod?.category);
    const url = pid ? `/${categorySlug}/${encodeURIComponent(pid)}` : '/catalogue';
    const image = prod?.image || null;

    return { title, url, image, pid };
  };

  // Helper to normalize buyer info
  const resolveBuyer = (userId, email, phone, name, business, city, pincode, type) => {
    const profile = userId ? profileMap.get(userId) : (email ? profileMap.get(email.toLowerCase()) : null);

    const buyerName = profile?.full_name || name || profile?.email?.split('@')[0] || 'Buyer / Customer';
    const bName = profile?.business_name || business || 'B2B Client';
    const bCity = profile?.city || city || '';
    const bPincode = profile?.pincode || pincode || '';
    const bEmail = profile?.email || email || '';
    const bPhone = profile?.whatsapp || profile?.whatsapp_number || profile?.phone || phone || '';

    let rawType = profile?.buyer_type || profile?.price_group || type || 'wholesale';
    let formattedType = 'Wholesaler';
    const lowerType = String(rawType).toLowerCase();
    if (lowerType.includes('reseller') || lowerType.includes('b2r')) {
      formattedType = 'Reseller';
    } else if (lowerType.includes('user') || lowerType.includes('guest') || lowerType.includes('single') || lowerType.includes('d2c')) {
      formattedType = 'User';
    } else {
      formattedType = 'Wholesaler';
    }

    return {
      name: buyerName,
      businessName: bName,
      city: bCity,
      pincode: bPincode,
      location: [bCity, bPincode].filter(Boolean).join(', ') || 'N/A',
      email: bEmail,
      phone: bPhone,
      type: formattedType,
      profileId: profile?.id || userId || null,
    };
  };

  // 3. Aggregate all Buyer Activities into unified feed
  const allActivities = useMemo(() => {
    const feed = [];
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // A. Favourites (Wishlist)
    (adminData.favorites || []).forEach((fav, idx) => {
      const buyer = resolveBuyer(fav.user_id, null, null, null, null, null, null, null);
      const prod = getProductDetails(fav.product_group_key, fav.variant_code);
      feed.push({
        id: `ACT-FAV-${fav.id ? fav.id.substring(0, 6) : idx + 100}`,
        rawId: fav.id || idx,
        date: fav.created_at || new Date().toISOString(),
        buyer,
        activityType: 'Favourites',
        products: [
          {
            name: prod.title,
            qty: 1,
            url: prod.url,
            image: prod.image,
            code: fav.variant_code || fav.product_group_key
          }
        ]
      });
    });

    // B. Shopping Carts & Abandoned Carts
    (adminData.cartItems || []).forEach((item, idx) => {
      const buyer = resolveBuyer(item.user_id, null, null, null, null, null, null, null);
      const prod = getProductDetails(item.product_group_key, item.variant_code);

      const itemTime = new Date(item.updated_at || item.created_at || Date.now()).getTime();
      const isAbandoned = (now - itemTime) > TWENTY_FOUR_HOURS;
      const activityType = isAbandoned ? 'Abandoned Carts' : 'Shopping Carts';

      feed.push({
        id: `ACT-${isAbandoned ? 'ABND' : 'CART'}-${item.id ? item.id.substring(0, 6) : idx + 200}`,
        rawId: item.id || idx,
        date: item.updated_at || item.created_at || new Date().toISOString(),
        buyer,
        activityType,
        products: [
          {
            name: prod.title,
            qty: item.quantity || 1,
            url: prod.url,
            image: prod.image,
            code: item.variant_code || item.product_group_key
          }
        ]
      });
    });

    // C. Enquiries & Purchase Quotes
    const inquiries = (adminData.optional?.inquiries || []).concat(adminData.optional?.orders || []);
    inquiries.forEach((inq, idx) => {
      const buyer = resolveBuyer(
        inq.user_id,
        inq.email || inq.buyer_email,
        inq.phone || inq.whatsapp || inq.buyer_phone,
        inq.buyer_name || inq.full_name,
        inq.business_name,
        inq.city,
        inq.pincode,
        inq.inquiry_type
      );

      const itemsList = Array.isArray(inq.items) && inq.items.length > 0
        ? inq.items.map((it) => {
            const prod = getProductDetails(it.variant_code || it.product_group_key || it.product_id, it.variant_code);
            return {
              name: it.product_title || prod.title,
              qty: it.quantity || 1,
              url: prod.url,
              image: prod.image || it.image,
              code: it.variant_code || it.product_group_key || 'N/A'
            };
          })
        : [
            (() => {
              const prod = getProductDetails(inq.product_group_key, inq.variant_code);
              return {
                name: prod.title,
                qty: inq.quantity || 1,
                url: prod.url,
                image: prod.image,
                code: inq.variant_code || inq.product_group_key || 'N/A'
              };
            })()
          ];

      feed.push({
        id: `ACT-ENQ-${inq.id ? String(inq.id).substring(0, 6).toUpperCase() : idx + 500}`,
        rawId: inq.id || idx,
        date: inq.created_at || new Date().toISOString(),
        buyer,
        activityType: 'Enquiry',
        products: itemsList
      });
    });

    // Sort feed by newest timestamp first
    return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [adminData, productMap, profileMap]);

  // 4. Apply Filters
  const filteredActivities = useMemo(() => {
    return allActivities.filter((act) => {
      // Activity filter
      if (activityFilter !== 'all' && act.activityType !== activityFilter) {
        return false;
      }
      // Buyer Type filter
      if (typeFilter !== 'all' && act.buyer.type !== typeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const buyerText = `${act.buyer.name} ${act.buyer.businessName} ${act.buyer.email} ${act.buyer.phone} ${act.buyer.location}`.toLowerCase();
        const productText = act.products.map(p => p.name + ' ' + p.code).join(' ').toLowerCase();
        const idText = String(act.id).toLowerCase();
        if (!buyerText.includes(q) && !productText.includes(q) && !idText.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allActivities, activityFilter, typeFilter, searchQuery]);

  // Counts for summary metrics
  const activityCounts = useMemo(() => {
    const counts = {
      all: allActivities.length,
      Favourites: 0,
      Enquiry: 0,
      'Abandoned Carts': 0,
      'Shopping Carts': 0
    };
    allActivities.forEach((act) => {
      if (counts[act.activityType] !== undefined) {
        counts[act.activityType]++;
      }
    });
    return counts;
  }, [allActivities]);

  // Copy handler with animated feedback
  const handleCopyActivity = (activity) => {
    const b = activity.buyer;
    const pText = activity.products.map(p => `- ${p.name} (Qty: ${p.qty}) [${p.url}]`).join('\n');
    const text = `Activity ID: ${activity.id}\nDate: ${new Date(activity.date).toLocaleString('en-IN')}\nBuyer: ${b.name} (${b.businessName})\nType: ${b.type}\nActivity: ${activity.activityType}\nLocation: ${b.location}\nEmail: ${b.email}\nPhone: ${b.phone}\nProducts:\n${pText}`;

    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [activity.id]: true }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [activity.id]: false }));
    }, 2000);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityBadgeClass = (type) => {
    switch (type) {
      case 'Favourites':
        return 'badge-activity-favourites';
      case 'Enquiry':
        return 'badge-activity-enquiry';
      case 'Abandoned Carts':
        return 'badge-activity-abandoned';
      case 'Shopping Carts':
        return 'badge-activity-shopping';
      default:
        return 'badge-activity-default';
    }
  };

  return (
    <div className="buyer-activity-container">
      {/* 1. Header Overview */}
      <div className="buyer-activity-header">
        <div>
          <h1 className="admin-page-title">Buyer Activity</h1>
          <p className="admin-page-subtitle">Real-time stream of customer intent, shopping carts, enquiries, and wishlist interactions.</p>
        </div>
        <button
          type="button"
          className="admin-refresh-btn"
          onClick={() => loadAdminData && loadAdminData()}
          title="Refresh Data"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* 2. Activity Metric Cards */}
      <div className="buyer-activity-metrics-grid">
        <div
          className={`buyer-activity-card ${activityFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActivityFilter('all')}
        >
          <div className="card-icon icon-all"><Activity size={20} /></div>
          <div>
            <span className="card-label">Total Activities</span>
            <div className="card-val">{activityCounts.all}</div>
          </div>
        </div>

        <div
          className={`buyer-activity-card ${activityFilter === 'Favourites' ? 'active' : ''}`}
          onClick={() => setActivityFilter('Favourites')}
        >
          <div className="card-icon icon-favourites"><Heart size={20} /></div>
          <div>
            <span className="card-label">Favourites</span>
            <div className="card-val">{activityCounts.Favourites}</div>
          </div>
        </div>

        <div
          className={`buyer-activity-card ${activityFilter === 'Enquiry' ? 'active' : ''}`}
          onClick={() => setActivityFilter('Enquiry')}
        >
          <div className="card-icon icon-enquiry"><MessageSquare size={20} /></div>
          <div>
            <span className="card-label">Enquiry</span>
            <div className="card-val">{activityCounts.Enquiry}</div>
          </div>
        </div>

        <div
          className={`buyer-activity-card ${activityFilter === 'Abandoned Carts' ? 'active' : ''}`}
          onClick={() => setActivityFilter('Abandoned Carts')}
        >
          <div className="card-icon icon-abandoned"><Clock size={20} /></div>
          <div>
            <span className="card-label">Abandoned Carts</span>
            <div className="card-val">{activityCounts['Abandoned Carts']}</div>
          </div>
        </div>

        <div
          className={`buyer-activity-card ${activityFilter === 'Shopping Carts' ? 'active' : ''}`}
          onClick={() => setActivityFilter('Shopping Carts')}
        >
          <div className="card-icon icon-shopping"><ShoppingBag size={20} /></div>
          <div>
            <span className="card-label">Shopping Carts</span>
            <div className="card-val">{activityCounts['Shopping Carts']}</div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="buyer-activity-toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Buyer Name, Email, Phone, City or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        <div className="toolbar-filters">
          <div className="filter-select-group">
            <Filter size={15} className="filter-icon" />
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="all">All Activities</option>
              <option value="Favourites">Favourites</option>
              <option value="Enquiry">Enquiry</option>
              <option value="Abandoned Carts">Abandoned Carts</option>
              <option value="Shopping Carts">Shopping Carts</option>
            </select>
          </div>

          <div className="filter-select-group">
            <User size={15} className="filter-icon" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="all">All Buyer Types</option>
              <option value="Wholesaler">Wholesaler</option>
              <option value="Reseller">Reseller</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Activity Data Table */}
      <div className="buyer-activity-table-wrapper">
        <table className="buyer-activity-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>ID</th>
              <th style={{ width: '130px' }}>Date</th>
              <th style={{ minWidth: '220px' }}>Buyer</th>
              <th style={{ width: '120px' }}>Type</th>
              <th style={{ width: '170px' }}>
                <div className="th-filter-header">
                  <span>Buyer Activity</span>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="th-inline-select"
                    title="Filter by Activity"
                  >
                    <option value="all">All</option>
                    <option value="Favourites">Favourites</option>
                    <option value="Enquiry">Enquiry</option>
                    <option value="Abandoned Carts">Abandoned Carts</option>
                    <option value="Shopping Carts">Shopping Carts</option>
                  </select>
                </div>
              </th>
              <th style={{ minWidth: '240px' }}>Products</th>
              <th style={{ width: '140px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-records-cell">
                  No buyer activities found matching current filter.
                </td>
              </tr>
            ) : (
              filteredActivities.map((act) => {
                const b = act.buyer;
                const isCopied = copyFeedback[act.id];

                return (
                  <tr key={act.id} className="activity-row">
                    {/* ID */}
                    <td className="cell-id">
                      <span className="activity-id-badge">{act.id}</span>
                    </td>

                    {/* Date */}
                    <td className="cell-date">
                      <div className="date-time-wrapper">
                        <span>{formatDate(act.date)}</span>
                      </div>
                    </td>

                    {/* Buyer */}
                    <td className="cell-buyer">
                      <div className="buyer-card-block">
                        <div className="buyer-name">{b.name}</div>
                        {b.businessName && <div className="buyer-business">{b.businessName}</div>}
                        {b.location !== 'N/A' && (
                          <div className="buyer-location">
                            <MapPin size={12} /> {b.location}
                          </div>
                        )}
                        {b.email && <div className="buyer-email">{b.email}</div>}
                        {b.phone && <div className="buyer-phone">{b.phone}</div>}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="cell-type">
                      <span className={`buyer-type-tag type-${b.type.toLowerCase()}`}>
                        {b.type}
                      </span>
                    </td>

                    {/* Buyer Activity */}
                    <td className="cell-activity">
                      <span className={`badge-activity ${getActivityBadgeClass(act.activityType)}`}>
                        {act.activityType}
                      </span>
                    </td>

                    {/* Products */}
                    <td className="cell-products">
                      <div className="products-stack">
                        {act.products.map((p, pIdx) => (
                          <div key={pIdx} className="product-item-row">
                            {p.image && (
                              <img src={p.image} alt={p.name} className="product-mini-thumb" />
                            )}
                            <div className="product-item-details">
                              <span className="product-title">{p.name}</span>
                              <div className="product-meta">
                                <span className="product-qty">Qty: <strong>{p.qty}</strong></span>
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="product-url-link"
                                  title="Open Product Page"
                                >
                                  URL <ExternalLink size={11} />
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="cell-action">
                      <div className="action-buttons-group">
                        {/* Copy Icon with Animation */}
                        <button
                          type="button"
                          className={`btn-copy-animated ${isCopied ? 'copied' : ''}`}
                          onClick={() => handleCopyActivity(act)}
                          title="Copy Activity & Buyer Info"
                        >
                          {isCopied ? <Check size={16} className="icon-check-anim" /> : <Copy size={16} />}
                          {isCopied && <span className="copy-tooltip">Copied!</span>}
                        </button>

                        {/* Action Dropdown Button */}
                        <div className="action-dropdown-container">
                          <button
                            type="button"
                            className="btn-action-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === act.id ? null : act.id);
                            }}
                          >
                            Action <ChevronDown size={14} />
                          </button>

                          {openDropdownId === act.id && (
                            <div className="action-menu-popup">
                              {b.phone && (
                                <a
                                  href={`https://wa.me/${String(b.phone).replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(b.name)},%20we%20noticed%20your%20activity%20on%20Weave365.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="action-menu-item"
                                  onClick={() => setOpenDropdownId(null)}
                                >
                                  <MessageSquare size={14} style={{ color: '#25D366' }} /> WhatsApp Buyer
                                </a>
                              )}
                              {b.email && (
                                <a
                                  href={`mailto:${b.email}?subject=Weave365%20Inquiry%20Support&body=Hello%20${encodeURIComponent(b.name)},`}
                                  className="action-menu-item"
                                  onClick={() => setOpenDropdownId(null)}
                                >
                                  <Mail size={14} style={{ color: '#2563eb' }} /> Email Buyer
                                </a>
                              )}
                              <button
                                type="button"
                                className="action-menu-item"
                                onClick={() => {
                                  handleCopyActivity(act);
                                  setOpenDropdownId(null);
                                }}
                              >
                                <Copy size={14} /> Copy Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
