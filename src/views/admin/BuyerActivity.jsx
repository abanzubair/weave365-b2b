import { useState, useEffect, useMemo } from 'react';
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
  Tag,
  Globe,
  Smartphone,
  Laptop,
  Bot,
  BarChart3,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { getProductCategorySlug } from '../../config.js';
import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * Helper to get badge styling & icons for traffic sources
 */
function getSourceBadge(sourceCategory, sourceName) {
  let icon = '🌐';
  let bg = '#f1f5f9';
  let color = '#334155';

  if (sourceCategory === 'AI Assistant') {
    icon = '🤖';
    bg = '#f3e8ff';
    color = '#6b21a8';
  } else if (sourceCategory === 'Social Media') {
    if (sourceName.includes('Instagram')) { icon = '📷'; bg = '#fdf2f8'; color = '#db2777'; }
    else if (sourceName.includes('Facebook')) { icon = '📘'; bg = '#eff6ff'; color = '#2563eb'; }
    else if (sourceName.includes('YouTube')) { icon = '▶️'; bg = '#fef2f2'; color = '#dc2626'; }
    else if (sourceName.includes('WhatsApp')) { icon = '💬'; bg = '#f0fdf4'; color = '#15803d'; }
    else if (sourceName.includes('Twitter') || sourceName.includes('X')) { icon = '🐦'; bg = '#f8fafc'; color = '#0f172a'; }
    else { icon = '📲'; bg = '#eff6ff'; color = '#1d4ed8'; }
  } else if (sourceCategory === 'Search Engine') {
    icon = '🔍';
    bg = '#f0fdf4';
    color = '#16a34a';
  } else {
    icon = '🔗';
    bg = '#f1f5f9';
    color = '#475569';
  }

  return { icon, bg, color };
}

/**
 * BuyerActivity Component
 * Dual-Mode Dashboard:
 * 1. Customer Interactions Timeline (Favourites, Quotes/Enquiries, Shopping & Abandoned Carts)
 * 2. Main Website Traffic & AI Referral Analytics (ChatGPT, Gemini, Claude, Location, Device)
 */
export default function BuyerActivity({ adminData, products = [], loadAdminData }) {
  const [viewMode, setViewMode] = useState('interactions'); // 'interactions' | 'traffic'
  const [activityFilter, setActivityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});

  // Site traffic analytics state
  const [siteAnalytics, setSiteAnalytics] = useState([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load site analytics from Supabase
  const loadTrafficAnalytics = async () => {
    if (!isSupabaseConfigured) return;
    setTrafficLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!error) {
        setSiteAnalytics(data || []);
      }
    } catch (err) {
      console.error('[BuyerActivity] Error loading site analytics:', err);
    } finally {
      setTrafficLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'traffic') {
      void loadTrafficAnalytics();
    }
  }, [viewMode]);

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
      location: bCity ? (bPincode ? `${bCity} (${bPincode})` : bCity) : (bPincode ? `Pincode ${bPincode}` : 'Varanasi, UP'),
      email: bEmail,
      phone: bPhone,
      type: formattedType,
    };
  };

  // Combine interaction activities
  const allActivities = useMemo(() => {
    const list = [];
    const nowMs = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    (adminData.favourites || []).forEach((fav) => {
      const b = resolveBuyer(fav.user_id, fav.user_email, fav.phone, fav.full_name, fav.business_name, fav.city, fav.pincode);
      const prodInfo = getProductDetails(fav.item_key || fav.product_id, fav.variant_code);
      list.push({
        id: `fav_${fav.id}`,
        type: 'favourites',
        activityType: 'Favourites',
        date: fav.created_at || new Date().toISOString(),
        buyer: b,
        products: [{ ...prodInfo, qty: 1 }],
      });
    });

    (adminData.carts || []).forEach((cart) => {
      const b = resolveBuyer(cart.user_id, cart.email, cart.phone, cart.full_name, cart.business_name, cart.city, cart.pincode);
      const cartDateMs = cart.updated_at ? new Date(cart.updated_at).getTime() : (cart.created_at ? new Date(cart.created_at).getTime() : nowMs);
      const isAbandoned = (nowMs - cartDateMs) > TWENTY_FOUR_HOURS;
      const activityType = isAbandoned ? 'Abandoned Carts' : 'Shopping Carts';

      let items = [];
      if (Array.isArray(cart.items) && cart.items.length > 0) {
        items = cart.items.map((it) => {
          const info = getProductDetails(it.item_key || it.product_id, it.variant_code);
          return { ...info, qty: it.quantity || it.qty || 1 };
        });
      } else {
        const info = getProductDetails(cart.item_key || cart.product_id, cart.variant_code);
        items = [{ ...info, qty: cart.quantity || cart.qty || 1 }];
      }

      list.push({
        id: `cart_${cart.id}`,
        type: isAbandoned ? 'abandoned' : 'cart',
        activityType,
        date: cart.updated_at || cart.created_at || new Date().toISOString(),
        buyer: b,
        products: items,
      });
    });

    (adminData.inquiries || []).forEach((inq) => {
      const b = resolveBuyer(inq.user_id, inq.email, inq.phone, inq.buyer_name || inq.full_name, inq.business_name, inq.city, inq.pincode);
      let items = [];
      if (Array.isArray(inq.items) && inq.items.length > 0) {
        items = inq.items.map((it) => {
          const info = getProductDetails(it.item_key || it.product_id, it.variant_code);
          return { ...info, qty: it.quantity || it.qty || 1 };
        });
      } else {
        const info = getProductDetails(inq.item_key || inq.product_id, inq.variant_code);
        items = [{ ...info, qty: inq.quantity || inq.qty || 1 }];
      }

      list.push({
        id: `inq_${inq.id}`,
        type: 'enquiry',
        activityType: 'Enquiry',
        date: inq.created_at || new Date().toISOString(),
        buyer: b,
        products: items,
        message: inq.message || '',
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [adminData, products, profileMap, productMap]);

  // Filter interaction activities
  const filteredActivities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allActivities.filter((act) => {
      if (activityFilter !== 'all' && act.activityType !== activityFilter) return false;
      if (typeFilter !== 'all' && act.buyer.type !== typeFilter) return false;

      if (q) {
        const b = act.buyer;
        const text = `${act.id} ${b.name} ${b.businessName} ${b.email} ${b.phone} ${b.location} ${act.activityType} ${b.type}`.toLowerCase();
        const pMatch = act.products.some((p) => p.title.toLowerCase().includes(q) || p.pid.toLowerCase().includes(q));
        return text.includes(q) || pMatch;
      }
      return true;
    });
  }, [allActivities, activityFilter, typeFilter, searchQuery]);

  const activityCounts = useMemo(() => {
    const counts = { all: allActivities.length, Favourites: 0, Enquiry: 0, 'Abandoned Carts': 0, 'Shopping Carts': 0 };
    allActivities.forEach((act) => {
      if (counts[act.activityType] !== undefined) counts[act.activityType]++;
    });
    return counts;
  }, [allActivities]);

  // Traffic Analytics Breakdown Calculations
  const trafficMetrics = useMemo(() => {
    let totalVisits = siteAnalytics.length;
    let aiVisits = 0;
    let socialVisits = 0;
    let searchVisits = 0;
    let directVisits = 0;
    let mobileCount = 0;
    let desktopCount = 0;

    const aiBreakdown = {};
    const socialBreakdown = {};
    const cityBreakdown = {};

    siteAnalytics.forEach((item) => {
      const cat = item.source_category || 'Direct / App';
      const name = item.source_name || 'Direct Visit';
      const city = item.city && item.city !== 'Unknown' ? item.city : 'India';

      if (cat === 'AI Assistant') {
        aiVisits++;
        aiBreakdown[name] = (aiBreakdown[name] || 0) + 1;
      } else if (cat === 'Social Media') {
        socialVisits++;
        socialBreakdown[name] = (socialBreakdown[name] || 0) + 1;
      } else if (cat === 'Search Engine') {
        searchVisits++;
        socialBreakdown[name] = (socialBreakdown[name] || 0) + 1;
      } else {
        directVisits++;
      }

      if (item.device_type === 'Mobile' || item.device_type === 'Tablet') {
        mobileCount++;
      } else {
        desktopCount++;
      }

      cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
    });

    const topAiList = Object.entries(aiBreakdown).sort((a, b) => b[1] - a[1]);
    const topSocialList = Object.entries(socialBreakdown).sort((a, b) => b[1] - a[1]);
    const topCitiesList = Object.entries(cityBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      totalVisits,
      aiVisits,
      socialVisits,
      searchVisits,
      directVisits,
      mobileCount,
      desktopCount,
      mobilePercent: totalVisits ? Math.round((mobileCount / totalVisits) * 100) : 0,
      desktopPercent: totalVisits ? Math.round((desktopCount / totalVisits) * 100) : 0,
      topAiList,
      topSocialList,
      topCitiesList,
    };
  }, [siteAnalytics]);

  const filteredTraffic = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return siteAnalytics.filter((t) => {
      if (categoryFilter !== 'all' && t.source_category !== categoryFilter) return false;
      if (!q) return true;
      const text = `${t.path} ${t.source_name} ${t.source_category} ${t.device_type} ${t.device_os} ${t.browser} ${t.city} ${t.country} ${t.referrer || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [siteAnalytics, categoryFilter, searchQuery]);

  const handleCopyActivity = (activity) => {
    const b = activity.buyer;
    const pText = activity.products.map((p) => `- ${p.title} (Qty: ${p.qty}) [${p.url}]`).join('\n');
    const text = `Activity ID: ${activity.id}\nDate: ${new Date(activity.date).toLocaleString('en-IN')}\nBuyer: ${b.name} (${b.businessName})\nType: ${b.type}\nActivity: ${activity.activityType}\nLocation: ${b.location}\nEmail: ${b.email}\nPhone: ${b.phone}\nProducts:\n${pText}`;

    navigator.clipboard.writeText(text);
    setCopyFeedback((prev) => ({ ...prev, [activity.id]: true }));
    setTimeout(() => {
      setCopyFeedback((prev) => ({ ...prev, [activity.id]: false }));
    }, 2000);
  };

  const getActivityBadgeClass = (type) => {
    switch (type) {
      case 'Favourites': return 'badge-activity-favourites';
      case 'Enquiry': return 'badge-activity-enquiry';
      case 'Abandoned Carts': return 'badge-activity-abandoned';
      case 'Shopping Carts': return 'badge-activity-shopping';
      default: return 'badge-activity-default';
    }
  };

  return (
    <div className="buyer-activity-container">
      {/* 1. Header & Mode Switcher */}
      <div className="buyer-activity-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="admin-page-title">
            {viewMode === 'interactions' ? 'Buyer Activity & Intent' : 'Main Website Traffic & AI Referral Analytics'}
          </h1>
          <p className="admin-page-subtitle">
            {viewMode === 'interactions'
              ? 'Real-time stream of customer intent, shopping carts, enquiries, and wishlist interactions.'
              : 'Track visitor traffic, AI Assistants (ChatGPT, Gemini, Claude, Perplexity), Social Media origins, devices, and cities.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <button
              type="button"
              onClick={() => { setViewMode('interactions'); setSearchQuery(''); }}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'interactions' ? '#ffffff' : 'transparent',
                color: viewMode === 'interactions' ? '#0f172a' : '#64748b',
                fontWeight: viewMode === 'interactions' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: viewMode === 'interactions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Activity size={16} /> Buyer Interactions
            </button>
            <button
              type="button"
              onClick={() => { setViewMode('traffic'); setSearchQuery(''); }}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'traffic' ? '#ffffff' : 'transparent',
                color: viewMode === 'traffic' ? '#2563eb' : '#64748b',
                fontWeight: viewMode === 'traffic' ? 700 : 500,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: viewMode === 'traffic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Globe size={16} style={{ color: '#2563eb' }} /> Website Traffic & AI
            </button>
          </div>

          <button
            type="button"
            className="admin-refresh-btn"
            onClick={() => {
              if (viewMode === 'traffic') void loadTrafficAnalytics();
              if (loadAdminData) loadAdminData();
            }}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={trafficLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {viewMode === 'interactions' ? (
        <>
          {/* 2. Activity Metric Cards */}
          <div className="buyer-activity-metrics-grid">
            <div
              className={`buyer-activity-card ${activityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActivityFilter('all')}
            >
              <div className="card-icon icon-all"><Activity size={22} /></div>
              <div>
                <span className="card-label">Total Activities</span>
                <div className="card-val">{activityCounts.all}</div>
              </div>
            </div>

            <div
              className={`buyer-activity-card ${activityFilter === 'Favourites' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Favourites')}
            >
              <div className="card-icon icon-favourites"><Heart size={22} /></div>
              <div>
                <span className="card-label">Favourites</span>
                <div className="card-val">{activityCounts.Favourites}</div>
              </div>
            </div>

            <div
              className={`buyer-activity-card ${activityFilter === 'Enquiry' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Enquiry')}
            >
              <div className="card-icon icon-enquiry"><MessageSquare size={22} /></div>
              <div>
                <span className="card-label">Enquiry</span>
                <div className="card-val">{activityCounts.Enquiry}</div>
              </div>
            </div>

            <div
              className={`buyer-activity-card ${activityFilter === 'Abandoned Carts' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Abandoned Carts')}
            >
              <div className="card-icon icon-abandoned"><Clock size={22} /></div>
              <div>
                <span className="card-label">Abandoned Carts</span>
                <div className="card-val">{activityCounts['Abandoned Carts']}</div>
              </div>
            </div>

            <div
              className={`buyer-activity-card ${activityFilter === 'Shopping Carts' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Shopping Carts')}
            >
              <div className="card-icon icon-shopping"><ShoppingBag size={22} /></div>
              <div>
                <span className="card-label">Shopping Carts</span>
                <div className="card-val">{activityCounts['Shopping Carts']}</div>
              </div>
            </div>
          </div>

          {/* 3. Search and Filters Bar */}
          <div className="buyer-activity-toolbar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by Buyer Name, Company, Email, Phone, Product Name, or Location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="toolbar-search-input"
              />
            </div>

            <div className="toolbar-type-filter">
              <label htmlFor="type-filter-select"><Filter size={16} /> Buyer Tier:</label>
              <select
                id="type-filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="toolbar-select-dropdown"
              >
                <option value="all">All Buyer Tiers</option>
                <option value="Wholesaler">Wholesale (B2B)</option>
                <option value="Reseller">Reseller (B2R)</option>
                <option value="User">Single Piece (D2C)</option>
              </select>
            </div>
          </div>

          {/* 4. Unified Interactions Table */}
          <div className="buyer-activity-table-wrapper">
            <table className="buyer-activity-table">
              <thead>
                <tr>
                  <th style={{ width: '170px' }}>Date & Time</th>
                  <th style={{ width: '240px' }}>Buyer Detail</th>
                  <th style={{ width: '130px' }}>Activity Type</th>
                  <th>Products Involved</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state-cell">
                      No buyer interaction records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => {
                    const b = act.buyer;
                    const formattedDate = new Date(act.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={act.id}>
                        <td className="cell-date">
                          <div className="date-main">{formattedDate}</div>
                          <div className="cell-id">ID: {act.id}</div>
                        </td>

                        <td className="cell-buyer">
                          <div className="buyer-name">{b.name}</div>
                          <div className="buyer-business">{b.businessName}</div>
                          <div className="buyer-meta-list">
                            <span className="meta-item"><MapPin size={13.5} /> {b.location}</span>
                            {b.email && <span className="meta-item"><Mail size={13.5} /> {b.email}</span>}
                            {b.phone && <span className="meta-item"><Phone size={13.5} /> {b.phone}</span>}
                          </div>
                        </td>

                        <td className="cell-activity-type">
                          <span className={`badge-activity ${getActivityBadgeClass(act.activityType)}`}>
                            {act.activityType}
                          </span>
                          <span className={`badge-buyer-tier tier-${b.type.toLowerCase()}`}>
                            {b.type}
                          </span>
                        </td>

                        <td className="cell-products">
                          <div className="products-list-wrapper">
                            {act.products.map((p, idx) => (
                              <div key={idx} className="product-item-row">
                                <div className="product-thumb">
                                  {p.image ? (
                                    <img src={p.image} alt={p.title} />
                                  ) : (
                                    <div className="thumb-placeholder"><Building size={16} /></div>
                                  )}
                                </div>
                                <div className="product-details">
                                  <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="product-title-link"
                                  >
                                    {p.title} <ExternalLink size={13} />
                                  </a>
                                  <div className="product-meta">
                                    <span className="qty-tag">Qty: <strong>{p.qty}</strong></span>
                                    {p.pid && <span className="code-tag">ID: {p.pid}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {act.message && (
                              <div className="enquiry-message-snippet">
                                💬 <em>"{act.message}"</em>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="cell-actions">
                          <div className="actions-wrapper">
                            <button
                              type="button"
                              className="btn-quick-copy"
                              onClick={() => handleCopyActivity(act)}
                              title="Copy details"
                            >
                              {copyFeedback[act.id] ? <Check size={18} style={{ color: '#10B981' }} /> : <Copy size={18} />}
                            </button>

                            <div className="action-dropdown-container">
                              <button
                                type="button"
                                className="btn-action-trigger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === act.id ? null : act.id);
                                }}
                              >
                                Action <ChevronDown size={15} />
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
                                      <MessageSquare size={16} style={{ color: '#25D366' }} /> WhatsApp Buyer
                                    </a>
                                  )}
                                  {b.email && (
                                    <a
                                      href={`mailto:${b.email}?subject=Weave365%20Inquiry%20Support&body=Hello%20${encodeURIComponent(b.name)},`}
                                      className="action-menu-item"
                                      onClick={() => setOpenDropdownId(null)}
                                    >
                                      <Mail size={16} style={{ color: '#2563eb' }} /> Email Buyer
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
                                    <Copy size={16} /> Copy Details
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
        </>
      ) : (
        /* Website Traffic & AI Referral Analytics View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Overview Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Globe size={22} />
              </div>
              <div>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Website Visits</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{trafficMetrics.totalVisits}</div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Unique Sessions</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f3e8ff', color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={22} />
              </div>
              <div>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>AI Assistant Traffic</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#6b21a8' }}>{trafficMetrics.aiVisits}</div>
                <span style={{ fontSize: '12px', color: '#6b21a8', fontWeight: 600 }}>ChatGPT, Gemini, Claude</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUp size={22} />
              </div>
              <div>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Social & Search</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#db2777' }}>{trafficMetrics.socialVisits + trafficMetrics.searchVisits}</div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Instagram, WhatsApp, Google</span>
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Smartphone size={22} />
              </div>
              <div>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Mobile Devices</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>{trafficMetrics.mobilePercent}%</div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{trafficMetrics.mobileCount} Mobile vs {trafficMetrics.desktopCount} PC</span>
              </div>
            </div>
          </div>

          {/* Breakdown Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* AI Traffic Breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                <Bot size={20} style={{ color: '#6b21a8' }} /> AI Assistants Referral Breakdown
              </div>
              {trafficMetrics.topAiList.length === 0 ? (
                <div style={{ fontSize: '13.5px', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                  No AI referrals recorded yet. (Detects ChatGPT, Gemini, Claude, Perplexity, Copilot, DeepSeek).
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {trafficMetrics.topAiList.map(([aiName, count]) => (
                    <div key={aiName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🤖</span> {aiName}
                      </span>
                      <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 10px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 700 }}>
                        {count} visits
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social & Search Breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                <Globe size={20} style={{ color: '#2563eb' }} /> Top Social & Search Channels
              </div>
              {trafficMetrics.topSocialList.length === 0 ? (
                <div style={{ fontSize: '13.5px', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                  No social/search visits logged yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {trafficMetrics.topSocialList.map(([srcName, count]) => {
                    const badge = getSourceBadge('Social Media', srcName);
                    return (
                      <div key={srcName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{badge.icon}</span> {srcName}
                        </span>
                        <span style={{ background: badge.bg, color: badge.color, padding: '2px 10px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 700 }}>
                          {count} visits
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Geographic Cities Breakdown */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                <MapPin size={20} style={{ color: '#dc2626' }} /> Top Visitor Locations (Cities)
              </div>
              {trafficMetrics.topCitiesList.length === 0 ? (
                <div style={{ fontSize: '13.5px', color: '#94a3b8', fontStyle: 'italic', padding: '12px 0' }}>
                  No location data recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {trafficMetrics.topCitiesList.map(([cityName, count]) => (
                    <div key={cityName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📍</span> {cityName}
                      </span>
                      <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 10px', borderRadius: '12px', fontSize: '12.5px', fontWeight: 700 }}>
                        {count} visits
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', background: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search traffic by path, AI source (ChatGPT, Gemini), city, device, browser..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'AI Assistant', 'Social Media', 'Search Engine', 'Direct / App'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    background: categoryFilter === cat ? '#2563eb' : '#ffffff',
                    color: categoryFilter === cat ? '#ffffff' : '#475569'
                  }}
                >
                  {cat === 'all' ? 'All Channels' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Table */}
          <div className="buyer-activity-table-wrapper" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table className="buyer-activity-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>Date & Time</th>
                  <th>Website Page Path</th>
                  <th style={{ width: '180px' }}>Traffic Channel / Source</th>
                  <th style={{ width: '150px' }}>Device & OS</th>
                  <th style={{ width: '160px' }}>Location (City/Country)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTraffic.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state-cell" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                      {trafficLoading ? 'Loading traffic analytics...' : 'No site traffic records logged yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredTraffic.map((item) => {
                    const dateStr = new Date(item.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const badge = getSourceBadge(item.source_category, item.source_name);

                    return (
                      <tr key={item.id}>
                        <td style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>{dateStr}</td>

                        <td>
                          <code style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            {item.path}
                          </code>
                          {item.referrer && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.referrer}>
                              Ref: {item.referrer}
                            </span>
                          )}
                        </td>

                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color
                          }}>
                            <span>{badge.icon}</span> {item.source_name}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {item.source_category}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 600, color: '#1e293b' }}>
                            {item.device_type === 'Mobile' || item.device_type === 'Tablet'
                              ? <Smartphone size={15} style={{ color: '#16a34a' }} />
                              : <Laptop size={15} style={{ color: '#2563eb' }} />}
                            <span>{item.device_type} ({item.device_os})</span>
                          </div>
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{item.browser}</span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13.5px', fontWeight: 600, color: '#0f172a' }}>
                            <MapPin size={14} style={{ color: '#dc2626' }} />
                            <span>{item.city || 'India'}, {item.country || 'IN'}</span>
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
      )}
    </div>
  );
}
