import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Search,
  Filter,
  Copy,
  Check,
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
  Globe,
  Smartphone,
  Laptop,
  Bot,
  TrendingUp,
  Download,
  ChevronUp,
  X
} from '../../components/icons.jsx';
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
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'cart_qty' | 'activity_count' | 'intent'
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState('grouped'); // 'grouped' | 'feed'
  const [expandedBuyerKey, setExpandedBuyerKey] = useState(null);
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
    const profileList = adminData.profiles || adminData.optional?.profiles || [];
    profileList.forEach((p) => {
      if (p.id) map.set(p.id, p);
      if (p.email) map.set(p.email.toLowerCase(), p);
    });
    return map;
  }, [adminData.profiles, adminData.optional]);

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
    const matchedV = prod?.variants?.find(v => v.code === variantCode || v.code === rawKey);
    const queryParams = [];
    if (matchedV?.color) {
      queryParams.push(`color=${encodeURIComponent(matchedV.color)}`);
    }
    if (matchedV?.code && matchedV.code !== pid) {
      queryParams.push(`variant=${encodeURIComponent(matchedV.code)}`);
    }
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const url = pid ? `/${categorySlug}/${encodeURIComponent(pid)}${queryString}` : '/catalogue';
    const image = matchedV?.image || prod?.image || null;

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

    const favList = adminData.favorites || adminData.favourites || adminData.optional?.favorites || [];
    const cartList = adminData.cartItems || adminData.carts || adminData.optional?.cartItems || [];
    const inqList = adminData.inquiries || adminData.optional?.inquiries || [];
    const dlList = adminData.download_logs || adminData.optional?.download_logs || [];

    favList.forEach((fav) => {
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

    cartList.forEach((cart) => {
      const b = resolveBuyer(cart.user_id, cart.email, cart.phone, cart.full_name, cart.business_name, cart.city, cart.pincode);
      const cartDateMs = cart.updated_at ? new Date(cart.updated_at).getTime() : (cart.created_at ? new Date(cart.created_at).getTime() : nowMs);
      const isAbandoned = (nowMs - cartDateMs) > TWENTY_FOUR_HOURS;
      const activityType = isAbandoned ? 'Abandoned Carts' : 'Shopping Carts';

      let items = [];
      if (Array.isArray(cart.items) && cart.items.length > 0) {
        items = cart.items.map((it) => {
          const info = getProductDetails(it.product_group_key || it.item_key || it.product_id, it.variant_code);
          return { ...info, qty: it.quantity || it.qty || 1 };
        });
      } else {
        const info = getProductDetails(cart.product_group_key || cart.item_key || cart.product_id, cart.variant_code);
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

    inqList.forEach((inq) => {
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

    dlList.forEach((dl) => {
      const b = resolveBuyer(dl.user_id, dl.user_email, dl.phone, dl.full_name, dl.business_name, dl.city, dl.pincode);
      const prodInfo = getProductDetails(dl.product_id || dl.item_key, dl.variant_code);
      list.push({
        id: `dl_${dl.id}`,
        type: 'download',
        activityType: 'Catalogue Downloads',
        date: dl.downloaded_at || dl.created_at || new Date().toISOString(),
        buyer: b,
        products: [{ ...prodInfo, qty: 1 }],
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [adminData, products, profileMap, productMap]);

  // Unique key extractor to group interactions by customer
  const getBuyerKey = (b) => {
    const phoneDigits = String(b?.phone || '').replace(/\D/g, '');
    if (phoneDigits && phoneDigits.length >= 10) {
      return `phone_${phoneDigits.slice(-10)}`;
    }
    if (b?.email && b.email.includes('@')) {
      return `email_${b.email.toLowerCase().trim()}`;
    }
    const cleanName = String(b?.name || 'buyer').toLowerCase().replace(/\s+/g, '_').trim();
    const cleanCity = String(b?.city || '').toLowerCase().trim();
    return `name_${cleanName}_${cleanCity}`;
  };

  // Compile Grouped Buyer Dossiers
  const groupedBuyers = useMemo(() => {
    const map = new Map();

    allActivities.forEach((act) => {
      const key = getBuyerKey(act.buyer);
      if (!map.has(key)) {
        map.set(key, {
          key,
          buyer: { ...act.buyer },
          lastActive: act.date,
          firstSeen: act.date,
          counts: {
            abandoned: 0,
            cart: 0,
            download: 0,
            favourites: 0,
            enquiry: 0,
            total: 0,
          },
          productsMap: new Map(),
          activities: [],
        });
      }

      const group = map.get(key);
      group.activities.push(act);
      group.counts.total++;

      const actTime = new Date(act.date).getTime();
      if (actTime > new Date(group.lastActive).getTime()) {
        group.lastActive = act.date;
        if (act.buyer.phone && !group.buyer.phone) group.buyer.phone = act.buyer.phone;
        if (act.buyer.email && !group.buyer.email) group.buyer.email = act.buyer.email;
        if (act.buyer.businessName && act.buyer.businessName !== 'B2B Client') {
          group.buyer.businessName = act.buyer.businessName;
        }
      }
      if (actTime < new Date(group.firstSeen).getTime()) {
        group.firstSeen = act.date;
      }

      if (act.activityType === 'Abandoned Carts') group.counts.abandoned++;
      else if (act.activityType === 'Shopping Carts') group.counts.cart++;
      else if (act.activityType === 'Catalogue Downloads') group.counts.download++;
      else if (act.activityType === 'Favourites') group.counts.favourites++;
      else if (act.activityType === 'Enquiry') group.counts.enquiry++;

      act.products.forEach((p) => {
        const pKey = p.pid || p.title;
        if (!group.productsMap.has(pKey)) {
          group.productsMap.set(pKey, { ...p });
        } else {
          const ex = group.productsMap.get(pKey);
          ex.qty = (ex.qty || 1) + (p.qty || 1);
        }
      });
    });

    return Array.from(map.values()).map((g) => {
      g.products = Array.from(g.productsMap.values());
      g.activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Total cart item quantity (shopping carts + abandoned carts)
      const cartQty = g.activities.reduce((sum, act) => {
        if (act.activityType === 'Shopping Carts' || act.activityType === 'Abandoned Carts' || act.type === 'cart' || act.type === 'abandoned') {
          return sum + act.products.reduce((pSum, p) => pSum + (Number(p.qty) || 1), 0);
        }
        return sum;
      }, 0);

      // Total quantity of products across all interactions
      const totalProdQty = g.products.reduce((sum, p) => sum + (Number(p.qty) || 1), 0);

      g.totalCartQty = cartQty > 0 ? cartQty : (g.counts.cart > 0 || g.counts.abandoned > 0 ? totalProdQty : 0);
      g.totalQty = totalProdQty;
      g.totalActivities = g.counts.total;

      // Intent score
      g.intentScore = (g.counts.abandoned * 100) + (g.counts.enquiry * 80) + (g.counts.cart * 50) + (g.counts.download * 20) + (g.counts.favourites * 5);

      // High activity flag (bulk cart volume e.g. 5+ items, 90+ items, or 4+ activities)
      g.isHighActivity = g.totalCartQty >= 5 || g.totalActivities >= 4 || g.totalQty >= 5;

      return g;
    });
  }, [allActivities]);

  const activityCounts = useMemo(() => {
    const counts = {
      all: allActivities.length,
      Favourites: 0,
      Enquiry: 0,
      'Abandoned Carts': 0,
      'Shopping Carts': 0,
      'Catalogue Downloads': 0,
      'High Activity': 0,
    };
    allActivities.forEach((act) => {
      if (counts[act.activityType] !== undefined) counts[act.activityType]++;
    });
    counts['High Activity'] = groupedBuyers.filter((g) => g.isHighActivity).length;
    return counts;
  }, [allActivities, groupedBuyers]);

  // Filter interaction activities for Live Feed
  const filteredActivities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = allActivities.filter((act) => {
      if (activityFilter !== 'all') {
        if (activityFilter === 'high-activity') {
          const bKey = getBuyerKey(act.buyer);
          const grp = groupedBuyers.find((g) => g.key === bKey);
          if (!grp || !grp.isHighActivity) return false;
        } else if (act.activityType !== activityFilter) {
          return false;
        }
      }
      if (typeFilter !== 'all' && act.buyer.type !== typeFilter) return false;

      if (q) {
        const b = act.buyer;
        const text = `${act.id} ${b.name} ${b.businessName} ${b.email} ${b.phone} ${b.location} ${act.activityType} ${b.type}`.toLowerCase();
        const pMatch = act.products.some((p) => p.title.toLowerCase().includes(q) || p.pid.toLowerCase().includes(q));
        return text.includes(q) || pMatch;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'cart_qty') {
        const qA = a.products.reduce((s, p) => s + (Number(p.qty) || 1), 0);
        const qB = b.products.reduce((s, p) => s + (Number(p.qty) || 1), 0);
        if (qB !== qA) return qB - qA;
      }
      if (sortBy === 'activity_count') {
        const bKeyA = getBuyerKey(a.buyer);
        const bKeyB = getBuyerKey(b.buyer);
        const grpA = groupedBuyers.find((g) => g.key === bKeyA);
        const grpB = groupedBuyers.find((g) => g.key === bKeyB);
        const countDiff = (grpB?.totalActivities || 0) - (grpA?.totalActivities || 0);
        if (countDiff !== 0) return countDiff;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [allActivities, activityFilter, typeFilter, searchQuery, sortBy, groupedBuyers]);

  // Filter and Sort grouped buyers
  const filteredGroupedBuyers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = groupedBuyers.filter((g) => {
      if (activityFilter !== 'all') {
        if (activityFilter === 'high-activity') {
          if (!g.isHighActivity) return false;
        } else if (activityFilter === 'Abandoned Carts' && g.counts.abandoned === 0) return false;
        else if (activityFilter === 'Shopping Carts' && g.counts.cart === 0) return false;
        else if (activityFilter === 'Catalogue Downloads' && g.counts.download === 0) return false;
        else if (activityFilter === 'Favourites' && g.counts.favourites === 0) return false;
        else if (activityFilter === 'Enquiry' && g.counts.enquiry === 0) return false;
      }
      if (typeFilter !== 'all' && g.buyer.type !== typeFilter) return false;

      if (q) {
        const b = g.buyer;
        const text = `${b.name} ${b.businessName} ${b.email} ${b.phone} ${b.location} ${b.type}`.toLowerCase();
        const pMatch = g.products.some((p) => p.title.toLowerCase().includes(q) || (p.pid && p.pid.toLowerCase().includes(q)));
        return text.includes(q) || pMatch;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sortBy === 'cart_qty') {
        // High volume / 90+ items in cart at the top!
        const diff = (b.totalCartQty || 0) - (a.totalCartQty || 0);
        if (diff !== 0) return diff;
        const totalDiff = (b.totalQty || 0) - (a.totalQty || 0);
        if (totalDiff !== 0) return totalDiff;
        return (b.totalActivities || 0) - (a.totalActivities || 0);
      }
      if (sortBy === 'activity_count') {
        // Most activities at top!
        const diff = (b.totalActivities || 0) - (a.totalActivities || 0);
        if (diff !== 0) return diff;
        return (b.totalCartQty || 0) - (a.totalCartQty || 0);
      }
      if (sortBy === 'intent') {
        const diff = (b.intentScore || 0) - (a.intentScore || 0);
        if (diff !== 0) return diff;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      }
      // Default: 'recent'
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });
  }, [groupedBuyers, activityFilter, typeFilter, searchQuery, sortBy]);

  // Filtered raw site analytics (Excludes /admin pages, localhost, and local dev network)
  const cleanSiteAnalytics = useMemo(() => {
    return siteAnalytics.filter((t) => {
      const cityLower = String(t.city || '').toLowerCase();
      const pathLower = String(t.path || '').toLowerCase();
      if (
        cityLower.includes('localhost') ||
        cityLower.includes('local dev') ||
        pathLower.includes('localhost') ||
        pathLower.startsWith('/admin') ||
        pathLower.includes('/admin')
      ) {
        return false;
      }
      return true;
    });
  }, [siteAnalytics]);

  // Traffic Analytics Breakdown Calculations
  const trafficMetrics = useMemo(() => {
    let totalVisits = cleanSiteAnalytics.length;
    let aiVisits = 0;
    let socialVisits = 0;
    let searchVisits = 0;
    let directVisits = 0;
    let mobileCount = 0;
    let desktopCount = 0;

    const aiBreakdown = {};
    const socialBreakdown = {};
    const cityBreakdown = {};

    cleanSiteAnalytics.forEach((item) => {
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
  }, [cleanSiteAnalytics]);

  const filteredTraffic = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return cleanSiteAnalytics.filter((t) => {
      if (categoryFilter !== 'all' && t.source_category !== categoryFilter) return false;
      if (!q) return true;
      const text = `${t.path} ${t.source_name} ${t.source_category} ${t.device_type} ${t.device_os} ${t.browser} ${t.city} ${t.country} ${t.referrer || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [cleanSiteAnalytics, categoryFilter, searchQuery]);

  const formatTimeClean = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.round(diffMs / (60 * 1000));
    const diffHours = Math.round(diffMs / (60 * 60 * 1000));

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return `Today, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getWhatsAppUrl = (phone, text) => {
    if (!phone) return null;
    const clean = String(phone).replace(/\D/g, '');
    const full = clean.length === 10 ? `91${clean}` : clean;
    return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
  };

  const getGroupedWhatsAppUrl = (group) => {
    const b = group.buyer;
    if (!b?.phone) return null;
    const topProd = group.products[0]?.title || 'our collection';
    let msg = '';
    const cartQtyText = group.totalCartQty > 1 ? ` (${group.totalCartQty} items)` : '';

    if (group.counts.abandoned > 0 || group.totalCartQty >= 5) {
      msg = `Hello ${b.name}, this is Weave 365 Varanasi Weaver Facility. We noticed your wholesale cart${cartQtyText} including ${topProd}. We provide direct weaver bulk pricing and express parcel dispatch. Would you like assistance confirming your parcel?`;
    } else if (group.counts.download > 0) {
      msg = `Hello ${b.name}, this is Weave 365 Varanasi Handloom. We noticed you downloaded our latest wholesale catalogues. Are you looking for sarees, suits, or custom weave collections for your store?`;
    } else if (group.counts.enquiry > 0) {
      msg = `Hello ${b.name}, this is Weave 365. Regarding your wholesale enquiry on our store, our sourcing desk is available to assist you.`;
    } else {
      msg = `Hello ${b.name}, this is Weave 365 Varanasi Handloom. We noticed your interest in ${topProd} on our B2B wholesale platform. How can we assist your business today?`;
    }
    return getWhatsAppUrl(b.phone, msg);
  };

  const getFeedWhatsAppUrl = (act) => {
    const b = act.buyer;
    if (!b?.phone) return null;
    const topProd = act.products[0]?.title || 'our collection';
    let msg = '';
    if (act.activityType === 'Abandoned Carts' || act.type === 'abandoned') {
      msg = `Hello ${b.name} (${b.businessName || 'Boutique'}), this is Weave 365 Varanasi Weaver Facility. We noticed you selected ${topProd} on our store. We provide direct weaver wholesale pricing and instant parcel dispatch. Would you like assistance confirming your order?`;
    } else if (act.activityType === 'Catalogue Downloads') {
      msg = `Hello ${b.name}, this is Weave 365 Varanasi Handloom. We noticed you downloaded the catalogue for ${topProd}. Are you looking for wholesale pricing or swatches?`;
    } else if (act.activityType === 'Enquiry') {
      msg = `Hello ${b.name}, this is Weave 365. Regarding your wholesale enquiry on ${topProd}, our sourcing desk is ready to assist you.`;
    } else {
      msg = `Hello ${b.name}, this is Weave 365 Varanasi Handloom. We noticed your interest in ${topProd} on Weave365. How can we assist you?`;
    }
    return getWhatsAppUrl(b.phone, msg);
  };

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

  const handleCopyGroup = (group) => {
    const b = group.buyer;
    const text = `Weave 365 Buyer Lead Summary:\n` +
      `Name: ${b.name} (${b.businessName})\n` +
      `Tier: ${b.type}\n` +
      `Phone: ${b.phone || 'N/A'}\n` +
      `Email: ${b.email || 'N/A'}\n` +
      `Location: ${b.location}\n` +
      `Last Active: ${new Date(group.lastActive).toLocaleString('en-IN')}\n` +
      `Summary: ${group.counts.abandoned ? `Abandoned Carts: ${group.counts.abandoned}, ` : ''}` +
      `${group.counts.download ? `Downloads: ${group.counts.download}, ` : ''}` +
      `${group.counts.favourites ? `Favourites: ${group.counts.favourites}, ` : ''}` +
      `${group.counts.enquiry ? `Enquiries: ${group.counts.enquiry}` : ''}\n` +
      `Products of Interest:\n` +
      group.products.map((p) => `- ${p.title} (Qty: ${p.qty || 1}, ID: ${p.pid || 'N/A'})`).join('\n');

    navigator.clipboard.writeText(text);
    setCopyFeedback((prev) => ({ ...prev, [group.key]: true }));
    setTimeout(() => {
      setCopyFeedback((prev) => ({ ...prev, [group.key]: false }));
    }, 2000);
  };

  const getActivityBadgeClass = (type) => {
    switch (type) {
      case 'Favourites': return 'badge-activity-favourites';
      case 'Enquiry': return 'badge-activity-enquiry';
      case 'Abandoned Carts': return 'badge-activity-abandoned';
      case 'Shopping Carts': return 'badge-activity-shopping';
      case 'Catalogue Downloads': return 'badge-activity-download';
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
              ? 'Real-time stream of customer intent, shopping carts, enquiries, wishlist interactions, and catalogue downloads.'
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
          {/* 2. Distilled Metric Filter Strip */}
          <div className="buyer-filter-strip">
            <button
              type="button"
              className={`filter-strip-pill ${activityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActivityFilter('all')}
            >
              <span>All Activities</span>
              <span className="pill-count">{activityCounts.all}</span>
            </button>

            <button
              type="button"
              className={`filter-strip-pill pill-high-activity ${activityFilter === 'high-activity' ? 'active' : ''}`}
              onClick={() => setActivityFilter(activityFilter === 'high-activity' ? 'all' : 'high-activity')}
              title="Filter buyers with large cart volume or frequent interactions"
            >
              <span className="pill-dot dot-high-activity" />
              <span>🔥 High Activity</span>
              <span className="pill-count">{activityCounts['High Activity']}</span>
            </button>

            <button
              type="button"
              className={`filter-strip-pill pill-abandoned ${activityFilter === 'Abandoned Carts' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Abandoned Carts')}
            >
              <span className="pill-dot dot-abandoned" />
              <span>Abandoned Carts</span>
              <span className="pill-count">{activityCounts['Abandoned Carts']}</span>
            </button>

            <button
              type="button"
              className={`filter-strip-pill pill-downloads ${activityFilter === 'Catalogue Downloads' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Catalogue Downloads')}
            >
              <span className="pill-dot dot-download" />
              <span>Downloads</span>
              <span className="pill-count">{activityCounts['Catalogue Downloads']}</span>
            </button>

            <button
              type="button"
              className={`filter-strip-pill pill-favourites ${activityFilter === 'Favourites' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Favourites')}
            >
              <span className="pill-dot dot-fav" />
              <span>Favourites</span>
              <span className="pill-count">{activityCounts.Favourites}</span>
            </button>

            <button
              type="button"
              className={`filter-strip-pill pill-enquiry ${activityFilter === 'Enquiry' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Enquiry')}
            >
              <span className="pill-dot dot-enquiry" />
              <span>Enquiries</span>
              <span className="pill-count">{activityCounts.Enquiry}</span>
            </button>

            <button
              type="button"
              className={`filter-strip-pill pill-cart ${activityFilter === 'Shopping Carts' ? 'active' : ''}`}
              onClick={() => setActivityFilter('Shopping Carts')}
            >
              <span className="pill-dot dot-cart" />
              <span>Active Carts</span>
              <span className="pill-count">{activityCounts['Shopping Carts']}</span>
            </button>
          </div>

          {/* 3. Streamlined Search & Mode Toolbar */}
          <div className="buyer-activity-toolbar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search buyer name, phone, city, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="toolbar-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="toolbar-controls-right">
              <div className="buyer-view-mode-toggle">
                <button
                  type="button"
                  className={`view-toggle-btn ${displayMode === 'grouped' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('grouped')}
                  title="Group interactions by customer"
                >
                  <User size={14} />
                  <span>By Buyer ({filteredGroupedBuyers.length})</span>
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${displayMode === 'feed' ? 'active' : ''}`}
                  onClick={() => setDisplayMode('feed')}
                  title="View chronological activity stream"
                >
                  <Activity size={14} />
                  <span>Live Feed ({filteredActivities.length})</span>
                </button>
              </div>

              <div className="toolbar-filters-row">
                {/* Sort By Selector */}
                <div className="toolbar-select-group">
                  <label htmlFor="sort-by-select" className="toolbar-control-label">Sort:</label>
                  <select
                    id="sort-by-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="toolbar-select-dropdown toolbar-sort-dropdown"
                    title="Sort buyers by activity, cart volume, or intent"
                  >
                    <option value="recent">🕒 Recently Active</option>
                    <option value="cart_qty">🛍️ Highest Cart Volume</option>
                    <option value="activity_count">⚡ Most Activities</option>
                    <option value="intent">🎯 Highest Buyer Intent</option>
                  </select>
                </div>

                <div className="toolbar-type-filter">
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
            </div>
          </div>

          {/* 4. Data Table Display */}
          <div className="buyer-activity-table-wrapper">
            {displayMode === 'grouped' ? (
              /* Grouped By Buyer View */
              <table className="buyer-activity-table table-grouped">
                <thead>
                  <tr>
                    <th style={{ width: '250px' }}>Buyer &amp; Location</th>
                    <th style={{ width: '230px' }}>Intent Summary</th>
                    <th style={{ width: '290px' }}>Products of Interest</th>
                    <th style={{ width: '130px' }}>Last Active</th>
                    <th style={{ width: '200px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroupedBuyers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state-cell">
                        No buyer profiles found matching your active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredGroupedBuyers.map((group) => {
                      const b = group.buyer;
                      const isExpanded = expandedBuyerKey === group.key;
                      const waLink = getGroupedWhatsAppUrl(group);
                      const topProd = group.products[0];

                      return (
                        <tr key={group.key} className="buyer-group-row-wrapper">
                          <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                            <div className={`buyer-group-main-row ${isExpanded ? 'is-expanded' : ''}`}>
                              {/* 1. Buyer & Tier */}
                              <div className="group-col col-buyer">
                                <div className="buyer-primary-row">
                                  <span className="buyer-name" title={b.name}>{b.name}</span>
                                  <span className={`badge-buyer-tier tier-${b.type.toLowerCase()}`}>
                                    {b.type}
                                  </span>
                                  <span className="mobile-time-badge">{formatTimeClean(group.lastActive)}</span>
                                </div>
                                <div className="buyer-secondary-row">
                                  {b.businessName && b.businessName !== 'B2B Client' && (
                                    <span className="buyer-biz">{b.businessName} · </span>
                                  )}
                                  <span className="buyer-loc">{b.location}</span>
                                  {b.phone && <span className="buyer-phone"> · {b.phone}</span>}
                                </div>
                              </div>

                              {/* 2. Intent Summary */}
                              <div className="group-col col-intent">
                                <div className="intent-badges-row">
                                  {group.totalCartQty >= 15 ? (
                                    <span className="intent-badge badge-high-volume" title={`High Volume Lead: ${group.totalCartQty} total pieces in wholesale cart`}>
                                      🔥 {group.totalCartQty} Bulk Items
                                    </span>
                                  ) : group.totalCartQty >= 5 ? (
                                    <span className="intent-badge badge-bulk-cart" title={`Active cart with ${group.totalCartQty} items`}>
                                      🛍️ {group.totalCartQty} in Cart
                                    </span>
                                  ) : null}
                                  {group.counts.total >= 5 && (
                                    <span className="intent-badge badge-high-activity" title={`${group.counts.total} total recorded interactions`}>
                                      ⚡ {group.counts.total} Acts
                                    </span>
                                  )}
                                  {group.counts.abandoned > 0 && (
                                    <span className="intent-badge badge-abandoned" title="Cart left idle for >24 hours without checkout">
                                      <Clock size={12} /> Abandoned ({group.counts.abandoned})
                                    </span>
                                  )}
                                  {group.counts.enquiry > 0 && (
                                    <span className="intent-badge badge-enquiry" title="Wholesale enquiry submitted">
                                      <MessageSquare size={12} /> Enquiry ({group.counts.enquiry})
                                    </span>
                                  )}
                                  {group.counts.download > 0 && (
                                    <span className="intent-badge badge-download" title="Catalogues downloaded">
                                      <Download size={12} /> {group.counts.download} DLs
                                    </span>
                                  )}
                                  {group.counts.favourites > 0 && (
                                    <span className="intent-badge badge-fav" title="Favourited items">
                                      <Heart size={12} /> {group.counts.favourites}
                                    </span>
                                  )}
                                  {group.counts.cart > 0 && (
                                    <span className="intent-badge badge-cart" title="Items currently in cart (<24 hours old)">
                                      <ShoppingBag size={12} /> Active Cart
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 3. Products */}
                              <div className="group-col col-products">
                                {topProd ? (
                                  <div className="product-compact-preview">
                                    {topProd.image ? (
                                      <img src={topProd.image} alt={topProd.title} className="compact-prod-thumb" />
                                    ) : (
                                      <div className="compact-thumb-fallback"><Building size={14} /></div>
                                    )}
                                    <div className="compact-prod-info">
                                      <a href={topProd.url} target="_blank" rel="noopener noreferrer" className="compact-prod-title">
                                        {topProd.title}
                                      </a>
                                      <div className="compact-prod-meta">
                                        <span>Qty: <strong>{topProd.qty}</strong></span>
                                        {group.totalCartQty > topProd.qty && (
                                          <span className="compact-total-cart-pill" title="Total cart items across all products">
                                            Total {group.totalCartQty}
                                          </span>
                                        )}
                                        {group.products.length > 1 && (
                                          <span className="compact-more-pill">+{group.products.length - 1} more</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </div>

                              {/* 4. Time */}
                              <div className="group-col col-time">
                                <span className="time-relative">{formatTimeClean(group.lastActive)}</span>
                              </div>

                              {/* 5. Actions */}
                              <div className="group-col col-actions">
                                <div className="actions-cluster">
                                  {waLink && (
                                    <a
                                      href={waLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-quick-wa"
                                      title="Direct WhatsApp with prefilled intent context"
                                    >
                                      <MessageSquare size={13} />
                                      <span>WhatsApp</span>
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    className="btn-icon-soft"
                                    onClick={() => handleCopyGroup(group)}
                                    title="Copy buyer summary"
                                  >
                                    {copyFeedback[group.key] ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn-expand-trigger ${isExpanded ? 'active' : ''}`}
                                    onClick={() => setExpandedBuyerKey(isExpanded ? null : group.key)}
                                    title={isExpanded ? 'Collapse history' : 'Expand session history'}
                                  >
                                    <span>{group.activities.length} logs</span>
                                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expandable Session Timeline Drawer */}
                            {isExpanded && (
                              <div className="buyer-timeline-drawer">
                                <div className="drawer-header">
                                  <div className="drawer-title-block">
                                    <span className="drawer-title">Session Activity Timeline</span>
                                    <span className="drawer-subtitle">
                                      Showing all {group.activities.length} interactions for {b.name}
                                      {group.totalCartQty > 0 ? ` · ${group.totalCartQty} items in wholesale cart` : ''}
                                    </span>
                                  </div>
                                  <div className="drawer-contact-pills">
                                    {b.email && (
                                      <a href={`mailto:${b.email}`} className="contact-pill">
                                        <Mail size={12} /> {b.email}
                                      </a>
                                    )}
                                    {b.phone && (
                                      <span className="contact-pill">
                                        <Phone size={12} /> {b.phone}
                                      </span>
                                    )}
                                    {b.location && (
                                      <span className="contact-pill">
                                        <MapPin size={12} /> {b.location}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="timeline-items-list">
                                  {group.activities.map((act) => (
                                    <div key={act.id} className="timeline-item">
                                      <div className="timeline-badge-col">
                                        <span className={`badge-activity ${getActivityBadgeClass(act.activityType)}`}>
                                          {act.activityType}
                                        </span>
                                        <span className="timeline-date">{formatTimeClean(act.date)}</span>
                                      </div>
                                      <div className="timeline-content-col">
                                        {act.products.map((p, idx) => (
                                          <div key={idx} className="timeline-product-snippet">
                                            {p.image && <img src={p.image} alt={p.title} className="tiny-thumb" />}
                                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="timeline-prod-link">
                                              {p.title}
                                            </a>
                                            <span className="timeline-prod-qty">×{p.qty}</span>
                                            {p.pid && <span className="timeline-pid">#{p.pid}</span>}
                                          </div>
                                        ))}
                                        {act.message && (
                                          <div className="timeline-enquiry-msg">
                                            💬 "{act.message}"
                                          </div>
                                        )}
                                      </div>
                                      <div className="timeline-action-col">
                                        <button
                                          type="button"
                                          className="btn-tiny-copy"
                                          onClick={() => handleCopyActivity(act)}
                                          title="Copy log details"
                                        >
                                          {copyFeedback[act.id] ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            ) : (
              /* Streamlined Live Feed View */
              <table className="buyer-activity-table table-feed">
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Date &amp; Time</th>
                    <th style={{ width: '230px' }}>Buyer &amp; Tier</th>
                    <th style={{ width: '150px' }}>Activity Type</th>
                    <th style={{ width: '310px' }}>Product Involved</th>
                    <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
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
                      const waLink = getFeedWhatsAppUrl(act);
                      const topProd = act.products[0];

                      return (
                        <tr key={act.id} className="feed-row">
                          <td className="cell-date">
                            <span className="time-relative">{formatTimeClean(act.date)}</span>
                          </td>

                          <td className="cell-buyer">
                            <div className="buyer-primary-row">
                              <span className="buyer-name" title={b.name}>{b.name}</span>
                              <span className={`badge-buyer-tier tier-${b.type.toLowerCase()}`}>
                                {b.type}
                              </span>
                              <span className="mobile-time-badge">{formatTimeClean(act.date)}</span>
                            </div>
                            <div className="buyer-secondary-row">
                              <span className="buyer-loc">{b.location}</span>
                              {b.phone && <span className="buyer-phone"> · {b.phone}</span>}
                            </div>
                          </td>

                          <td className="cell-activity-type">
                            <span className={`badge-activity ${getActivityBadgeClass(act.activityType)}`}>
                              {act.activityType}
                            </span>
                          </td>

                          <td className="cell-products">
                            {topProd ? (
                              <div className="product-compact-preview">
                                {topProd.image ? (
                                  <img src={topProd.image} alt={topProd.title} className="compact-prod-thumb" />
                                ) : (
                                  <div className="compact-thumb-fallback"><Building size={14} /></div>
                                )}
                                <div className="compact-prod-info">
                                  <a href={topProd.url} target="_blank" rel="noopener noreferrer" className="compact-prod-title">
                                    {topProd.title}
                                  </a>
                                  <div className="compact-prod-meta">
                                    <span>Qty: <strong>{topProd.qty}</strong></span>
                                    {act.products.length > 1 && (
                                      <span className="compact-more-pill">+{act.products.length - 1} more</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                            {act.message && (
                              <div className="timeline-enquiry-msg" style={{ marginTop: '4px' }}>
                                💬 "{act.message}"
                              </div>
                            )}
                          </td>

                          <td className="cell-actions">
                            <div className="actions-cluster" style={{ justifyContent: 'flex-end' }}>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-quick-wa"
                                  title="WhatsApp Buyer"
                                >
                                  <MessageSquare size={13} />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                              <button
                                type="button"
                                className="btn-icon-soft"
                                onClick={() => handleCopyActivity(act)}
                                title="Copy event details"
                              >
                                {copyFeedback[act.id] ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
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
                  <th style={{ width: '200px' }}>Date & Time</th>
                  <th>Page Path</th>
                  <th style={{ width: '180px' }}>Traffic Source</th>
                  <th style={{ width: '150px' }}>Device & OS</th>
                  <th style={{ width: '160px' }}>Location</th>
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
                            <span>{item.city ? `${item.city}, ${item.country || 'IN'}` : (item.country || 'IN')}</span>
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
