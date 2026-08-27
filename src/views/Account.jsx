/**
 * @file Account.jsx
 * @description The user account area view for boutique owners and resellers. Aggregates and displays
 * buyer profile details, approved B2B pricing groups, active bulk order lists, saved favorites,
 * and entry points to the personalized Reseller Business Center (white-label storefront tools).
 * 
 * @module views/Account
 * @param {Object} props
 * @param {Object} props.user - Current user object from Supabase authentication
 * @param {Object} props.buyerProfile - Buyer profile data including business name, pincode, etc.
 * @param {Object} props.priceAccess - Evaluated price permissions, buyer groups, and approval states
 * @param {Array} props.cartItems - Items currently in the draft order list
 * @param {Array} props.favoriteProducts - Bookmarked products list
 * @param {Function} props.navigate - Application route/navigation handler
 * @param {Function} props.openAuth - Trigger callback to display login/registration modal
 * @param {Function} props.updateQuantity - Callback to adjust the quantity of items in the draft order list
 * @param {Function} props.onSignOut - Callback to end the user session
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Bookmark, 
  ClipboardList, 
  Heart, 
  History, 
  LockKeyhole, 
  ShoppingBag, 
  UserRound, 
  MapPin, 
  Plus, 
  Edit, 
  Edit3,
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Boxes, 
  Store, 
  Globe,
  Code2, 
  ArrowUpRight, 
  LogOut, 
  Copy,
  ExternalLink,
  Phone,
  Check
} from 'lucide-react';
import { customerPrice, fallbackProductImage, formatMoney, calculateHybridCartTotals, calculateComboDiscount } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { ResellerTools } from '../components/ResellerTools.jsx';
import { ResellerUpgradeCard } from '../components/ResellerUpgradeCard.jsx';
import { VendorStockPanel } from '../components/VendorStockPanel.jsx';
import { DeveloperDashboard } from '../components/developer/DeveloperDashboard.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { applyAsInfluencer, fetchInfluencerStats } from '../utils/influencerHelpers.js';
import { isProfileComplete } from '../utils/profileHelpers.js';
import { adminEmails } from '../config.js';
import '../styles/developerDashboard.css';
import '../styles/accountMinimal.css';

function titleCase(value) {
  return String(value || 'pending')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusBadgeStyle(status) {
  const s = String(status || 'new').toLowerCase();
  switch (s) {
    case 'delivered':
    case 'done':
      return { backgroundColor: '#eafaf1', color: '#2e7d32', border: '1px solid rgba(46, 125, 50, 0.2)' };
    case 'dispatched':
      return { backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid rgba(21, 101, 192, 0.2)' };
    case 'verified':
    case 'processing':
    case 'active':
      return { backgroundColor: '#fff8e1', color: '#b78646', border: '1px solid rgba(183, 134, 70, 0.2)' };
    case 'cancelled':
    case 'rejected':
      return { backgroundColor: '#ffebee', color: '#c62828', border: '1px solid rgba(198, 40, 40, 0.2)' };
    default:
      return { backgroundColor: '#f5f5f5', color: '#616161', border: '1px solid rgba(97, 97, 97, 0.2)' };
  }
}

export function Account({
  user,
  buyerProfile,
  priceAccess,
  cartItems,
  favoriteProducts,
  products = [],
  navigate,
  openAuth,
  updateQuantity,
  onSignOut,
  initialTab,
}) {
  const userEmail = String(user?.email || '').toLowerCase().trim();
  const isAdmin = Boolean(userEmail && adminEmails.includes(userEmail)) || user?.role === 'admin' || user?.user_metadata?.role === 'admin' || buyerProfile?.role === 'admin';

  const isVendor = !isAdmin && (
                   buyerProfile?.buyer_type === 'vendor' ||
                   user?.user_metadata?.buyer_profile?.buyer_type === 'vendor' ||
                   user?.buyer_profile?.buyer_type === 'vendor' ||
                   buyerProfile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   user?.user_metadata?.buyer_profile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   user?.buyer_profile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   priceAccess?.buyerType === 'vendor' ||
                   Boolean(buyerProfile?.vendor_code) ||
                   Boolean(user?.user_metadata?.buyer_profile?.vendor_code));

  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === 'stock' || initialTab === 'vendor' || initialTab === 'vendor-stock') {
      return isVendor ? 'vendor-stock' : 'orders';
    }
    if (initialTab) return initialTab;
    if (isVendor) return 'vendor-stock';
    return 'orders';
  });

  const [orderSubTab, setOrderSubTab] = useState('enquiry');

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'stock' || initialTab === 'vendor' || initialTab === 'vendor-stock') {
        setActiveTab(isVendor ? 'vendor-stock' : 'orders');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, isVendor]);

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Placed orders state
  const [placedOrders, setPlacedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState(null);

  const copyCustomerTrackingLink = (orderId) => {
    if (typeof window === 'undefined') return;
    const link = `${window.location.origin}/order-tracking?id=${orderId}`;
    navigator.clipboard.writeText(link);
    setCopiedTrackingId(orderId);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  // Influencer Program State
  const [influencerProfile, setInfluencerProfile] = useState(null);
  const [influencerLoading, setInfluencerLoading] = useState(false);
  const [influencerStats, setInfluencerStats] = useState({ clicks: 0, referrals: [] });

  // Application Form State
  const [infFormCode, setInfFormCode] = useState('');
  const [infFormPayoutMethod, setInfFormPayoutMethod] = useState('upi');
  const [infFormUpiId, setInfFormUpiId] = useState('');
  const [infFormBankName, setInfFormBankName] = useState('');
  const [infFormAccountNo, setInfFormAccountNo] = useState('');
  const [infFormIfsc, setInfFormIfsc] = useState('');
  const [infFormSubmitting, setInfFormSubmitting] = useState(false);
  const [infFormError, setInfFormError] = useState('');

  const fetchInfluencerData = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setInfluencerLoading(true);
    try {
      const stats = await fetchInfluencerStats(user.id);
      setInfluencerProfile(stats.profile);
      setInfluencerStats({
        clicks: stats.clicks,
        referrals: stats.referrals
      });
      // prefill referral code form with full name slug if empty
      if (!stats.profile && !infFormCode) {
        const name = buyerProfile?.full_name || buyerProfile?.business_name || '';
        if (name) {
          const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
          setInfFormCode(slug.toUpperCase().slice(0, 10));
        }
      }
    } catch (err) {
      console.error('Error loading influencer data:', err);
    } finally {
      setInfluencerLoading(false);
    }
  };

  const handleApplyInfluencer = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!infFormCode || infFormCode.length < 3) {
      setInfFormError('Referral code must be at least 3 characters.');
      return;
    }
    setInfFormSubmitting(true);
    setInfFormError('');
    try {
      const paymentDetails = infFormPayoutMethod === 'upi' 
        ? { payout_method: 'upi', upi_id: infFormUpiId }
        : { payout_method: 'bank', bank_name: infFormBankName, account_number: infFormAccountNo, ifsc: infFormIfsc };

      const { data, error: applyErr } = await applyAsInfluencer(user.id, infFormCode, paymentDetails);
      if (applyErr) {
        setInfFormError(applyErr.message || 'Failed to submit application.');
      } else {
        await fetchInfluencerData();
      }
    } catch (err) {
      console.error('Apply influencer error:', err);
      setInfFormError(err.message || 'Error occurred while applying.');
    } finally {
      setInfFormSubmitting(false);
    }
  };

  // Address form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddr1, setFormAddr1] = useState('');
  const [formAddr2, setFormAddr2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formCountry, setFormCountry] = useState('India');
  const [isDefault, setIsDefault] = useState(false);

  const normalizePincodeInput = (value) => {
    return String(value).replace(/\D/g, '').slice(0, 6);
  };

  const fetchAddresses = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setAddressLoading(true);
    try {
      const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
      if (error) throw error;
      setAddresses(data || []);
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  const fetchPlacedOrders = async () => {
    if (!user?.id || !isSupabaseConfigured) return;
    setOrdersLoading(true);
    try {
      const [ordersRes, inquiriesRes] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id),
        supabase.from('inquiries').select('*').eq('user_id', user.id)
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (inquiriesRes.error) throw inquiriesRes.error;

      const combined = [
        ...(ordersRes.data || []).map(o => ({ ...o, _sourceTable: 'orders' })),
        ...(inquiriesRes.data || []).map(i => ({ ...i, _sourceTable: 'inquiries' }))
      ];

      combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPlacedOrders(combined);
    } catch (err) {
      console.error('Error loading placed orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses' && user?.id) {
      fetchAddresses();
    } else if (activeTab === 'orders' && user?.id) {
      fetchPlacedOrders();
    } else if (activeTab === 'influencer' && user?.id) {
      fetchInfluencerData();
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
      fetchPlacedOrders();
      fetchInfluencerData();
    }
  }, [user?.id]);

  const handleStartEdit = (addr) => {
    setEditingAddress(addr);
    setFormName(addr.full_name || '');
    setFormPhone(addr.phone_number || '');
    setFormAddr1(addr.address_line1 || '');
    setFormAddr2(addr.address_line2 || '');
    setFormCity(addr.city || '');
    setFormState(addr.state || '');
    setFormPincode(addr.pincode || '');
    setFormCountry(addr.country || 'India');
    setIsDefault(addr.is_default || false);
    setShowAddEditForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!user?.id || !isSupabaseConfigured) return;

    const addrData = {
      full_name: formName.trim(),
      phone_number: formPhone.trim(),
      address_line1: formAddr1.trim(),
      address_line2: formAddr2.trim() || null,
      city: formCity.trim(),
      state: formState.trim(),
      pincode: formPincode.trim(),
      country: formCountry.trim(),
      is_default: isDefault,
    };

    try {
      if (isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addrData)
          .eq('id', editingAddress.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const isFirst = addresses.length === 0;
        const { error } = await supabase
          .from('addresses')
          .insert({
            ...addrData,
            user_id: user.id,
            is_default: isDefault || isFirst,
          });
        if (error) throw error;
      }

      setShowAddEditForm(false);
      setEditingAddress(null);
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to save address:', err);
      alert('Error saving address. Please try again.');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    if (!isSupabaseConfigured || !user?.id) return;

    try {
      const target = addresses.find(a => a.id === id);
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      if (target?.is_default && addresses.length > 1) {
        const remaining = addresses.filter(a => a.id !== id);
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remaining[0].id)
          .eq('user_id', user.id);
      }

      await fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
      alert('Error deleting address.');
    }
  };

  const handleSetDefault = async (id) => {
    if (!user?.id || !isSupabaseConfigured) return;

    try {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      await fetchAddresses();
    } catch (err) {
      console.error('Failed to set default address:', err);
      alert('Error setting default address.');
    }
  };

  const hybridTotals = useMemo(() => {
    return calculateHybridCartTotals(cartItems || [], priceAccess);
  }, [cartItems, priceAccess]);

  const subtotal = hybridTotals.subtotal;
  const discount = hybridTotals.discount;
  const total = hybridTotals.total;

  const groupedCartItems = useMemo(() => {
    const groups = new Map();

    (cartItems || []).forEach((item) => {
      const key = item.productGroupKey || item.product?.id || item.productId || item.product?.title || 'unknown';
      const group = groups.get(key) || {
        key,
        product: item.product,
        variant: item.variant,
        colorOptions: item.colorOptions || item.product?.colorOptions || [],
        items: [],
      };

      group.items.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.values()).map((group) => {
      const activeItems = group.items.filter(
        (item) => item.selectedColorName && item.selectedColorName !== 'Select Color'
      );
      return {
        ...group,
        totalQuantity: group.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        selectedColorsCount: activeItems.length,
      };
    });
  }, [cartItems]);

  const userInitials = (buyerProfile?.full_name || buyerProfile?.business_name || user?.email || 'U')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const enquiriesList = useMemo(() => {
    return (placedOrders || []).filter(o => o._sourceTable === 'inquiries' || String(o.status || '').toLowerCase() === 'inquiry');
  }, [placedOrders]);

  const pendingOrdersList = useMemo(() => {
    return (placedOrders || []).filter(o => {
      if (o._sourceTable === 'inquiries' || String(o.status || '').toLowerCase() === 'inquiry') return false;
      const s = String(o.status || '').toLowerCase();
      return s !== 'delivered' && s !== 'completed' && s !== 'cancelled' && s !== 'done' && s !== 'rejected';
    });
  }, [placedOrders]);

  const orderHistoryList = useMemo(() => {
    return (placedOrders || []).filter(o => {
      if (o._sourceTable === 'inquiries' || String(o.status || '').toLowerCase() === 'inquiry') return false;
      const s = String(o.status || '').toLowerCase();
      return s === 'delivered' || s === 'completed' || s === 'cancelled' || s === 'done' || s === 'rejected';
    });
  }, [placedOrders]);

  if (!user) {
    return (
      <section className="section empty-page">
        <LockKeyhole size={32} />
        <h1>Login to access your B2B account</h1>
        <p>Your orders, saved items, addresses and wholesale pricing tier stay linked to your buyer account.</p>
        <button className="primary-button" type="button" onClick={() => navigate ? navigate('signup') : (openAuth && openAuth())}>
          Sign In / Register
        </button>
      </section>
    );
  }

  return (
    <section className="account-page-minimal">
      {/* 1. MINIMAL HERO HEADER (COMMENTED OUT)
      <div className="account-hero-minimal">
        <div className="account-hero-left">
          <div className="account-avatar-minimal">
            <span>{userInitials}</span>
            <span className="account-avatar-online-dot" title="Active B2B Session" />
          </div>
          <div className="account-identity-block">
            <div className="account-name-row">
              <h1 className="account-user-name">
                {buyerProfile?.business_name || buyerProfile?.full_name || (userEmail ? userEmail.split('@')[0] : 'My Account')}
              </h1>
              {(isAdmin || isVendor) && (
                <div className="account-chips-row">
                  <span className="account-chip role">
                    {isAdmin ? 'Administrator' : 'Vendor Partner'}
                  </span>
                </div>
              )}
            </div>
            <div className="account-sub-meta">
              <span className="account-email-text">{user.email}</span>
              {buyerProfile?.city && (
                <>
                  <span className="account-meta-dot">•</span>
                  <span>{buyerProfile.city}</span>
                </>
              )}
              {buyerProfile?.pincode && (
                <>
                  <span className="account-meta-dot">•</span>
                  <span>PIN {buyerProfile.pincode}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="account-hero-actions-minimal">
          <button 
            type="button" 
            className="account-action-outline-btn"
            onClick={() => navigate('catalogue')}
          >
            <span>Browse Catalogue</span>
            <ArrowUpRight size={14} />
          </button>
          <button 
            type="button" 
            className="account-action-logout-btn"
            onClick={onSignOut}
            title="Log Out"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
      */}

      {/* 2. INCOMPLETE PROFILE NOTICE */}
      {!isProfileComplete(user, buyerProfile) && (
        <div className="account-profile-incomplete-strip">
          <div className="incomplete-strip-text">
            <AlertTriangle size={17} className="incomplete-strip-icon" />
            <div>
              <strong>Complete your wholesale profile</strong>
              <span>Add your WhatsApp number, city, and pincode to activate wholesale pricing and rapid dispatch.</span>
            </div>
          </div>
          <button
            type="button"
            className="account-strip-btn"
            onClick={() => navigate ? navigate('signup?mode=complete-profile') : (window.location.href = '/signup?mode=complete-profile')}
          >
            Complete Profile →
          </button>
        </div>
      )}

      {/* 3. MINIMAL TAB NAVIGATION */}
      <nav className="account-nav-bar" aria-label="Account Tabs">
        {isVendor && (
          <button 
            type="button" 
            className={`account-nav-item ${activeTab === 'vendor-stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendor-stock')}
          >
            <Boxes size={16} />
            <span>Stock Inventory</span>
          </button>
        )}
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ClipboardList size={16} />
          <span>Orders</span>
          {placedOrders.length > 0 && <span className="nav-count">{placedOrders.length}</span>}
        </button>
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          <MapPin size={16} />
          <span>Addresses</span>
          {addresses.length > 0 && <span className="nav-count">{addresses.length}</span>}
        </button>
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'reseller' ? 'active' : ''}`}
          onClick={() => setActiveTab('reseller')}
        >
          <Globe size={16} />
          <span>Build Your Own Website</span>
        </button>
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'influencer' ? 'active' : ''}`}
          onClick={() => setActiveTab('influencer')}
        >
          <UserRound size={16} />
          <span>Affiliates</span>
        </button>
        <button 
          type="button" 
          className={`account-nav-item ${activeTab === 'developer' ? 'active' : ''}`}
          onClick={() => setActiveTab('developer')}
        >
          <Code2 size={16} />
          <span>Developer API</span>
        </button>
      </nav>

      {/* 4. ACTIVE TAB CONTENT */}
      <div className="account-tab-content-area">
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="account-panel-minimal">
            <div className="account-section-header">
              <div className="account-order-subtabs">
                <button
                  type="button"
                  className={`account-order-subtab-btn ${orderSubTab === 'enquiry' ? 'active' : ''}`}
                  onClick={() => setOrderSubTab('enquiry')}
                >
                  Enquiry {enquiriesList.length > 0 && <span className="subtab-badge">({enquiriesList.length})</span>}
                </button>
                <button
                  type="button"
                  className={`account-order-subtab-btn ${orderSubTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setOrderSubTab('pending')}
                >
                  Pending Order {((cartItems?.length || 0) + (pendingOrdersList?.length || 0)) > 0 && (
                    <span className="subtab-badge">({(cartItems?.length || 0) + (pendingOrdersList?.length || 0)})</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`account-order-subtab-btn ${orderSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => setOrderSubTab('history')}
                >
                  Order History {orderHistoryList.length > 0 && <span className="subtab-badge">({orderHistoryList.length})</span>}
                </button>
              </div>
            </div>

            {orderSubTab === 'pending' ? (
              <div className="pending-orders-section">
                {/* 1. DRAFT SOURCING CART ITEMS */}
                {cartItems && cartItems.length > 0 && (
                  <div className="draft-cart-container" style={{ marginBottom: pendingOrdersList.length > 0 ? '36px' : '0' }}>
                    <div className="draft-cart-groups-stack">
                      {groupedCartItems.map((group) => {
                        const hybridInfo = hybridTotals.productPricing?.[group.product?.id];
                        const isUnder999 = String(group.product?.category || '').toLowerCase() === 'under 999';

                        return (
                          <div className="draft-cart-group-card" key={group.key}>
                            {/* Product Header */}
                            <div className="draft-cart-group-header">
                              <div className="draft-cart-group-main">
                                <img 
                                  src={group.items[0]?.selectedColorImage || group.product?.images?.[0] || fallbackProductImage} 
                                  alt={group.product?.title} 
                                  className="draft-cart-group-thumb"
                                  loading="lazy" 
                                  onError={(e) => { e.target.src = fallbackProductImage; }}
                                />
                                <div className="draft-cart-group-meta">
                                  <h4 className="draft-cart-group-title">{group.product?.title || 'Product'}</h4>
                                  <div className="draft-cart-group-sub">
                                    <span className="draft-cart-code">Code: {group.variant?.code || group.product?.code || '—'}</span>
                                    <span className="account-meta-dot">•</span>
                                    <span>{group.items.length} {group.items.length === 1 ? 'Color' : 'Colors'} ({group.totalQuantity} pcs)</span>
                                  </div>
                                </div>
                              </div>

                              {!isUnder999 && hybridInfo && hybridInfo.setSize > 1 && (
                                <div className="draft-cart-tier-badge">
                                  {hybridInfo.completeSets > 0 && hybridInfo.extraPieces === 0 ? (
                                    <span className="tier-pill tier-pill-wholesale">
                                      {hybridInfo.completeSets} Full Set{hybridInfo.completeSets > 1 ? 's' : ''} ({group.totalQuantity} pcs) · Wholesale Rate
                                    </span>
                                  ) : (
                                    <span className="tier-pill tier-pill-reseller">
                                      {group.totalQuantity} pcs · Single Piece Rate
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Color Variants Rows */}
                            <div className="draft-cart-variants-list">
                              {group.items.map((item) => {
                                const unitPrice =
                                  hybridInfo && group.totalQuantity >= hybridInfo.setSize
                                    ? hybridInfo.wholesalePrice
                                    : hybridInfo?.resellerPrice || customerPrice(item.variant?.prices, priceAccess) || 0;

                                return (
                                  <div className="draft-cart-variant-row" key={item.variantCode || `${item.productId}-${item.selectedColorName}`}>
                                    <div className="draft-cart-variant-left">
                                      {item.selectedColorImage && (
                                        <img 
                                          src={item.selectedColorImage} 
                                          alt={item.selectedColorName || 'Color'}
                                          className="draft-cart-variant-swatch"
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      )}
                                      <div className="draft-cart-variant-label-group">
                                        <span className="draft-cart-variant-name">
                                          {item.selectedColorName || item.variant?.code || 'Selected Color'}
                                        </span>
                                        {priceAccess.canViewPrices && (
                                          <span className="draft-cart-unit-rate">
                                            {formatMoney(unitPrice)} / pc
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="draft-cart-variant-right">
                                      <div className="draft-qty-picker">
                                        <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)} aria-label="Decrease">−</button>
                                        <output>{item.quantity}</output>
                                        <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)} aria-label="Increase">+</button>
                                      </div>

                                      <div className="draft-cart-variant-price">
                                        {priceAccess.canViewPrices ? (
                                          formatMoney(unitPrice * item.quantity)
                                        ) : (
                                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Verified Only</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="draft-cart-footer">
                      <div className="draft-cart-total-summary">
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>Draft Subtotal:</span>
                        <strong style={{ fontSize: '20px', color: 'var(--ink)' }}>
                          {total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)}
                        </strong>
                      </div>
                      <div className="draft-cart-actions">
                        <button type="button" className="secondary-button" onClick={() => navigate('catalogue')}>
                          Add More Products
                        </button>
                        <button type="button" className="primary-button" onClick={() => navigate('checkout')}>
                          Proceed to Checkout →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PLACED PENDING ORDERS IF ANY */}
                {pendingOrdersList && pendingOrdersList.length > 0 && (
                  <div className="account-orders-stack" style={{ marginTop: cartItems.length > 0 ? '24px' : '0' }}>
                    {cartItems.length > 0 && (
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 12px', color: '#1a1a1a' }}>
                        Confirmed Pending Orders ({pendingOrdersList.length})
                      </h4>
                    )}
                    {pendingOrdersList.map((order) => {
                      const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      const statusStyle = getStatusBadgeStyle(order.status);
                      const orderTotal = order.items && Array.isArray(order.items)
                        ? order.items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
                        : 0;
                      const isDropshipOrder = Boolean(order.is_dropship);

                      return (
                        <div 
                          key={order.id} 
                          className={`account-minimal-order-card ${isDropshipOrder ? 'is-dropship' : ''}`}
                        >
                          <div className="order-card-top-bar">
                            <div className="order-ref-group">
                              <span className="order-ref-code">#{order.id}</span>
                              {isDropshipOrder && (
                                <span className="account-chip tier" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                                  Dropship
                                </span>
                              )}
                              <span className="order-date-text">{orderDate}</span>
                            </div>
                            <span 
                              className="order-status-pill"
                              style={statusStyle}
                            >
                              {order.status || 'Processing'}
                            </span>
                          </div>

                          {isDropshipOrder && (
                            <div className="order-dropship-info-box">
                              <div><strong>Sender Label:</strong> {order.dropship_sender_name || order.business_name || 'Reseller'} {order.dropship_sender_phone ? `(${order.dropship_sender_phone})` : ''}</div>
                              <div><strong>Deliver To:</strong> {order.dropship_recipient_name || order.buyer_name} ({order.dropship_recipient_phone || 'N/A'}) — {order.dropship_recipient_city} {order.dropship_recipient_pincode ? `(${order.dropship_recipient_pincode})` : ''}</div>
                            </div>
                          )}

                          <div className="order-items-list">
                            {order.items && Array.isArray(order.items) && order.items.map((item, idx) => (
                              <div key={idx} className="order-item-row">
                                <div className="order-item-left">
                                  <span className="order-item-bullet" />
                                  <span className="order-item-title">{item.product_title || 'Banarasi Saree'}</span>
                                  {item.color && <span className="order-item-variant">· {item.color}</span>}
                                </div>
                                <span className="order-item-qty">Qty {item.quantity || 1}</span>
                              </div>
                            ))}
                          </div>

                          <div className="order-card-bottom-bar">
                            <div className="order-total-block">
                              <span className="order-total-label">Total:</span>
                              <span className="order-total-value">
                                {orderTotal > 0 ? formatMoney(orderTotal) : 'Price on request'}
                              </span>
                            </div>

                            <div className="order-card-actions">
                              <button 
                                type="button" 
                                className="order-track-btn"
                                onClick={() => navigate('order-tracking', order.id)}
                              >
                                <span>Track Order</span>
                                <ArrowUpRight size={13} />
                              </button>
                              {isDropshipOrder && (
                                <button
                                  type="button"
                                  className="order-copy-link-btn"
                                  onClick={() => copyCustomerTrackingLink(order.id)}
                                  title="Copy tracking link for your customer"
                                >
                                  {copiedTrackingId === order.id ? (
                                    <>
                                      <Check size={13} style={{ color: '#059669' }} />
                                      <span style={{ color: '#059669' }}>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Share2 size={13} />
                                      <span>Customer Link</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* EMPTY STATE IF BOTH CART AND PENDING ORDERS ARE EMPTY */}
                {(!cartItems || cartItems.length === 0) && (!pendingOrdersList || pendingOrdersList.length === 0) && (
                  <div className="account-empty-state">
                    <ShoppingBag size={36} strokeWidth={1.5} />
                    <h3 className="account-empty-title">No pending orders or cart items</h3>
                    <p className="account-empty-desc">Explore the wholesale catalogue to select sarees and add them to your draft order.</p>
                    <button type="button" className="primary-button" onClick={() => navigate('catalogue')}>
                      Browse Wholesale Catalogue
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="placed-orders-container">
                {ordersLoading ? (
                  <p style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>Loading orders...</p>
                ) : (
                  (() => {
                    const currentList = orderSubTab === 'enquiry'
                      ? enquiriesList
                      : orderHistoryList;

                    if (currentList.length === 0) {
                      const emptyTitle = orderSubTab === 'enquiry'
                        ? 'No inquiries yet'
                        : 'No order history yet';

                      const emptyDesc = orderSubTab === 'enquiry'
                        ? 'Once you submit a wholesale or custom sourcing inquiry, your live updates will appear here.'
                        : 'Your completed and delivered wholesale orders will be archived here for easy reference.';

                      return (
                        <div className="account-empty-state">
                          <ClipboardList size={36} strokeWidth={1.5} />
                          <h3 className="account-empty-title">{emptyTitle}</h3>
                          <p className="account-empty-desc">{emptyDesc}</p>
                          <button type="button" className="primary-button" onClick={() => navigate('catalogue')}>
                            Browse Wholesale Catalogue
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="account-orders-stack">
                        {currentList.map((order) => {
                          const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });
                          const statusStyle = getStatusBadgeStyle(order.status);
                          const orderTotal = order.items && Array.isArray(order.items)
                            ? order.items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
                            : 0;
                          const isDropshipOrder = Boolean(order.is_dropship);

                          return (
                            <div 
                              key={order.id} 
                              className={`account-minimal-order-card ${isDropshipOrder ? 'is-dropship' : ''}`}
                            >
                              <div className="order-card-top-bar">
                                <div className="order-ref-group">
                                  <span className="order-ref-code">#{order.id}</span>
                                  {isDropshipOrder && (
                                    <span className="account-chip tier" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                                      Dropship
                                    </span>
                                  )}
                                  <span className="order-date-text">{orderDate}</span>
                                </div>
                                <span 
                                  className="order-status-pill"
                                  style={statusStyle}
                                >
                                  {order.status || (order._sourceTable === 'inquiries' ? 'Inquiry Submitted' : 'Received')}
                                </span>
                              </div>

                              {isDropshipOrder && (
                                <div className="order-dropship-info-box">
                                  <div><strong>Sender Label:</strong> {order.dropship_sender_name || order.business_name || 'Reseller'} {order.dropship_sender_phone ? `(${order.dropship_sender_phone})` : ''}</div>
                                  <div><strong>Deliver To:</strong> {order.dropship_recipient_name || order.buyer_name} ({order.dropship_recipient_phone || 'N/A'}) — {order.dropship_recipient_city} {order.dropship_recipient_pincode ? `(${order.dropship_recipient_pincode})` : ''}</div>
                                </div>
                              )}

                              <div className="order-items-list">
                                {order.items && Array.isArray(order.items) && order.items.map((item, idx) => (
                                  <div key={idx} className="order-item-row">
                                    <div className="order-item-left">
                                      <span className="order-item-bullet" />
                                      <span className="order-item-title">{item.product_title || 'Banarasi Saree'}</span>
                                      {item.color && <span className="order-item-variant">· {item.color}</span>}
                                    </div>
                                    <span className="order-item-qty">Qty {item.quantity || 1}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="order-card-bottom-bar">
                                <div className="order-total-block">
                                  <span className="order-total-label">Total:</span>
                                  <span className="order-total-value">
                                    {orderTotal > 0 ? formatMoney(orderTotal) : 'Price on request'}
                                  </span>
                                </div>

                                <div className="order-card-actions">
                                  <button 
                                    type="button" 
                                    className="order-track-btn"
                                    onClick={() => navigate('order-tracking', order.id)}
                                  >
                                    <span>Track Order</span>
                                    <ArrowUpRight size={13} />
                                  </button>
                                  {isDropshipOrder && (
                                    <button
                                      type="button"
                                      className="order-copy-link-btn"
                                      onClick={() => copyCustomerTrackingLink(order.id)}
                                      title="Copy tracking link for your customer"
                                    >
                                      {copiedTrackingId === order.id ? (
                                        <>
                                          <Check size={13} style={{ color: '#059669' }} />
                                          <span style={{ color: '#059669' }}>Copied!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Share2 size={13} />
                                          <span>Customer Link</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <div className="account-panel-minimal">
            <div className="account-section-header">
              <span className="account-section-title">
                <MapPin size={18} />
                <span>Delivery Addresses</span>
              </span>
              {!showAddEditForm && (
                <button 
                  type="button" 
                  className="account-action-outline-btn"
                  onClick={() => {
                    setEditingAddress(null);
                    setFormName('');
                    setFormPhone('');
                    setFormAddr1('');
                    setFormAddr2('');
                    setFormCity('');
                    setFormState('');
                    setFormPincode('');
                    setFormCountry('India');
                    setIsDefault(false);
                    setShowAddEditForm(true);
                  }}
                >
                  <Plus size={14} />
                  <span>Add Address</span>
                </button>
              )}
            </div>

            {showAddEditForm ? (
              <form onSubmit={handleSaveAddress} className="account-address-form-minimal">
                <h3 className="address-form-title">{editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
                <div className="address-form-grid">
                  <label className="field-label">
                    Full Name *
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    Phone Number *
                    <input 
                      type="tel" 
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label full-width">
                    Address Line 1 *
                    <input 
                      type="text" 
                      value={formAddr1}
                      onChange={(e) => setFormAddr1(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label full-width">
                    Address Line 2 (Optional)
                    <input 
                      type="text" 
                      value={formAddr2}
                      onChange={(e) => setFormAddr2(e.target.value)}
                    />
                  </label>
                  <label className="field-label">
                    City *
                    <input 
                      type="text" 
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    State *
                    <input 
                      type="text" 
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    Pincode *
                    <input 
                      type="text" 
                      value={formPincode}
                      onChange={(e) => setFormPincode(normalizePincodeInput(e.target.value))}
                      required 
                    />
                  </label>
                  <label className="field-label">
                    Country *
                    <input 
                      type="text" 
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      required 
                    />
                  </label>
                </div>

                <label className="address-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    disabled={editingAddress?.is_default}
                  />
                  <span>Set as default delivery address</span>
                </label>

                <div className="form-actions-row">
                  <button type="submit" className="primary-button">
                    Save Address
                  </button>
                  <button 
                    type="button" 
                    className="secondary-button" 
                    onClick={() => setShowAddEditForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {addressLoading && <p style={{ textAlign: 'center', padding: '36px', color: '#6b7280' }}>Loading saved addresses...</p>}
                {!addressLoading && addresses.length === 0 && (
                  <div className="account-empty-state">
                    <MapPin size={36} strokeWidth={1.5} />
                    <h3 className="account-empty-title">No saved addresses</h3>
                    <p className="account-empty-desc">Add your dispatch and delivery addresses for quick one-click checkout.</p>
                    <button 
                      type="button" 
                      className="primary-button"
                      onClick={() => {
                        setEditingAddress(null);
                        setFormName('');
                        setFormPhone('');
                        setFormAddr1('');
                        setFormAddr2('');
                        setFormCity('');
                        setFormState('');
                        setFormPincode('');
                        setFormCountry('India');
                        setIsDefault(false);
                        setShowAddEditForm(true);
                      }}
                    >
                      Add Address
                    </button>
                  </div>
                )}
                {!addressLoading && (
                  <div className="account-addresses-grid-minimal">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`account-address-card-minimal ${addr.is_default ? 'is-default' : ''}`}
                      >
                        <div className="address-card-content">
                          <div className="address-card-top">
                            <h4 className="address-name">{addr.full_name}</h4>
                            {addr.is_default && (
                              <span className="address-default-badge">
                                <Check size={11} strokeWidth={2.5} />
                                <span>Default</span>
                              </span>
                            )}
                          </div>
                          
                          <div className="address-phone-pill">
                            <Phone size={12} strokeWidth={2} />
                            <span>{addr.phone_number}</span>
                          </div>

                          <div className="address-lines">
                            <p className="address-street">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
                            <p className="address-location">{addr.city}, {addr.state} — <strong>{addr.pincode}</strong></p>
                            <p className="address-country">{addr.country || 'India'}</p>
                          </div>
                        </div>

                        <div className="address-card-actions-minimal">
                          <div className="address-actions-left">
                            <button 
                              type="button" 
                              className="address-action-chip"
                              onClick={() => handleStartEdit(addr)}
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button 
                              type="button" 
                              className="address-action-chip danger"
                              onClick={() => handleDeleteAddress(addr.id)}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                          {!addr.is_default && (
                            <button 
                              type="button" 
                              className="address-action-link default-action"
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* BUILD YOUR OWN WEBSITE */}
        {activeTab === 'reseller' && (
          <div className="account-panel-minimal">
            <div className="account-section-header">
              <span className="account-section-title">
                <Globe size={18} />
                <span>Build Your Own Website</span>
              </span>
              {priceAccess.resellerDashboardEnabled && (
                <button 
                  type="button" 
                  onClick={() => navigate('reseller-dashboard')}
                  className="account-action-outline-btn"
                >
                  <span>Fullscreen Dashboard</span>
                  <ArrowUpRight size={14} />
                </button>
              )}
            </div>
            {priceAccess.resellerDashboardEnabled ? (
              <ResellerTools user={user} buyerProfile={buyerProfile} navigate={navigate} />
            ) : (
              <ResellerUpgradeCard user={user} buyerProfile={buyerProfile} />
            )}
          </div>
        )}

        {/* AFFILIATES TAB */}
        {activeTab === 'influencer' && (
          <div className="account-panel-minimal">
            <div className="account-section-header">
              <span className="account-section-title">
                <UserRound size={18} />
                <span>Weave 365 Affiliate Partner Program</span>
              </span>
            </div>

            {influencerLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                <p>Loading partner dashboard...</p>
              </div>
            ) : !influencerProfile ? (
              /* Application Form */
              <div style={{ maxWidth: '480px', margin: '1rem auto' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px', textAlign: 'center' }}>
                  Join the Affiliate Partner Program
                </h2>
                <p style={{ fontSize: '13.5px', color: '#6b7280', marginBottom: '20px', lineHeight: '1.5', textAlign: 'center' }}>
                  Share curated Banarasi collections with boutique buyers and earn a 10% commission on completed orders.
                </p>

                <form onSubmit={handleApplyInfluencer} style={{ display: 'grid', gap: '16px' }}>
                  <div style={{ background: '#fdfaf5', border: '1px solid #fef3c7', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', color: '#92400e', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: '1.4' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                    <div>
                      <strong>Payout terms:</strong> Commissions are tracked at checkout and credited to your balance after the buyer return/exchange window concludes.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Desired Referral Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BOUTIQUE10"
                      value={infFormCode}
                      onChange={e => setInfFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      required
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13.5px', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                      Payout Method *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setInfFormPayoutMethod('upi')}
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: infFormPayoutMethod === 'upi' ? '2px solid var(--gold-dark)' : '1px solid var(--line)',
                          background: infFormPayoutMethod === 'upi' ? 'rgba(183,134,70,0.06)' : '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: infFormPayoutMethod === 'upi' ? 'var(--gold-dark)' : 'var(--ink)'
                        }}
                      >
                        UPI ID
                      </button>

                      <button
                        type="button"
                        onClick={() => setInfFormPayoutMethod('bank')}
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          border: infFormPayoutMethod === 'bank' ? '2px solid var(--gold-dark)' : '1px solid var(--line)',
                          background: infFormPayoutMethod === 'bank' ? 'rgba(183,134,70,0.06)' : '#ffffff',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '13px',
                          color: infFormPayoutMethod === 'bank' ? 'var(--gold-dark)' : 'var(--ink)'
                        }}
                      >
                        Bank Transfer
                      </button>
                    </div>
                  </div>

                  {infFormPayoutMethod === 'upi' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                        UPI ID *
                      </label>
                      <input
                        type="text"
                        placeholder="yourname@bank"
                        value={infFormUpiId}
                        onChange={e => setInfFormUpiId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Bank Name (e.g. HDFC Bank)"
                        value={infFormBankName}
                        onChange={e => setInfFormBankName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={infFormAccountNo}
                        onChange={e => setInfFormAccountNo(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                      <input
                        type="text"
                        placeholder="11-digit IFSC Code"
                        value={infFormIfsc}
                        onChange={e => setInfFormIfsc(e.target.value.toUpperCase())}
                        required
                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                      />
                    </div>
                  )}

                  {infFormError && (
                    <p style={{ color: '#dc2626', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>{infFormError}</p>
                  )}

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={infFormSubmitting}
                    style={{ width: '100%', padding: '10px', marginTop: '4px' }}
                  >
                    {infFormSubmitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </form>
              </div>
            ) : !influencerProfile.is_approved ? (
              <div style={{ maxWidth: '500px', margin: '1rem auto', padding: '24px', border: '1px solid #fed7aa', borderRadius: '10px', background: '#fffdf7', textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#9a3412', marginBottom: '6px' }}>Application Under Review</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                  Your referral code <strong>{influencerProfile.referral_code}</strong> is being validated by our partner team. You will be notified once activated.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                <div className="affiliate-stats-row">
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Total Visitors</span>
                    <div className="affiliate-stat-value">{influencerStats.clicks}</div>
                    <span className="affiliate-stat-hint">Unique Clicks</span>
                  </div>
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Conversions</span>
                    <div className="affiliate-stat-value">{influencerStats.referrals.filter(r => r.status !== 'cancelled').length}</div>
                    <span className="affiliate-stat-hint">Completed Orders</span>
                  </div>
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Commission</span>
                    <div className="affiliate-stat-value">
                      {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status !== 'cancelled')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </div>
                    <span className="affiliate-stat-hint">Rate: {influencerProfile.commission_percentage}%</span>
                  </div>
                  <div className="affiliate-stat-box">
                    <span className="affiliate-stat-label">Settled Payouts</span>
                    <div className="affiliate-stat-value" style={{ color: '#2e7d32' }}>
                      {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status === 'paid')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </div>
                    <span className="affiliate-stat-hint">
                      Pending: {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status === 'pending')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="affiliate-share-box-minimal">
                  <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>Your Unique Partner Link</span>
                  <div className="affiliate-share-input-row">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/?ref=${influencerProfile.referral_code}` : ''}
                      className="affiliate-share-input"
                      onClick={e => e.target.select()}
                    />
                    <button
                      type="button"
                      className="primary-button"
                      style={{ padding: '0 16px', whiteSpace: 'nowrap', fontSize: '12.5px' }}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.origin}/?ref=${influencerProfile.referral_code}`);
                          alert('Partner link copied to clipboard!');
                        }
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '10px' }}>
                    Referred Conversion History
                  </span>
                  {influencerStats.referrals.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '24px', border: '1px dashed var(--line)', borderRadius: '8px', color: '#6b7280', fontSize: '13px' }}>
                      No referred orders yet. Share your partner link to start earning commissions.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--line)' }}>
                            <th style={{ padding: '8px 12px' }}>Date</th>
                            <th style={{ padding: '8px 12px' }}>Reference</th>
                            <th style={{ padding: '8px 12px' }}>Buyer</th>
                            <th style={{ padding: '8px 12px' }}>Order Total</th>
                            <th style={{ padding: '8px 12px' }}>Commission</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {influencerStats.referrals.map(ref => (
                            <tr key={ref.id} style={{ borderBottom: '1px solid var(--line)' }}>
                              <td style={{ padding: '8px 12px' }}>{new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                              <td style={{ padding: '8px 12px' }}><code>{ref.order_id || ref.inquiry_id || 'N/A'}</code></td>
                              <td style={{ padding: '8px 12px' }}>{ref.buyer_name || 'Buyer'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{formatMoney(ref.sale_amount)}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--gold-dark)' }}>{formatMoney(ref.commission_amount)}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: ref.status === 'paid' ? '#eafaf1' : '#fff8e1', color: ref.status === 'paid' ? '#2e7d32' : '#b78646' }}>
                                  {ref.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === 'vendor-stock' && (
          <div className="account-panel-minimal panel-transparent">
            <VendorStockPanel
              user={user}
              buyerProfile={buyerProfile}
              products={products}
            />
          </div>
        )}

        {/* DEVELOPER API TAB */}
        {activeTab === 'developer' && (
          <div className="account-panel-minimal panel-transparent">
            <DeveloperDashboard user={user} buyerProfile={buyerProfile} />
          </div>
        )}
      </div>
    </section>
  );
}

