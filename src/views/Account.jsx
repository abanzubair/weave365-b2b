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

import { useState, useEffect } from 'react';
import { Bookmark, ClipboardList, Heart, History, LockKeyhole, ShoppingBag, UserRound, MapPin, Plus, Edit, Trash2, RefreshCw, AlertTriangle, Boxes } from 'lucide-react';
import { customerPrice, fallbackProductImage, formatMoney, calculateComboDiscount } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { ResellerTools } from '../components/ResellerTools.jsx';
import { VendorStockPanel } from '../components/VendorStockPanel.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { applyAsInfluencer, fetchInfluencerStats } from '../utils/influencerHelpers.js';
import { adminEmails } from '../config.js';

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

function AccountSummaryCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="account-summary-card">
      <div className="card-icon-wrapper">
        <Icon size={20} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
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

  const isVendor = isAdmin ||
                   buyerProfile?.buyer_type === 'vendor' ||
                   user?.user_metadata?.buyer_profile?.buyer_type === 'vendor' ||
                   user?.buyer_profile?.buyer_type === 'vendor' ||
                   buyerProfile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   user?.user_metadata?.buyer_profile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   user?.buyer_profile?.buyer_subtype?.toLowerCase().includes('vendor') ||
                   priceAccess?.buyerType === 'vendor' ||
                   Boolean(buyerProfile?.vendor_code) ||
                   Boolean(user?.user_metadata?.buyer_profile?.vendor_code);

  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab === 'stock' || initialTab === 'vendor' || initialTab === 'vendor-stock') return 'vendor-stock';
    if (initialTab) return initialTab;
    if (isVendor) return 'vendor-stock';
    return 'orders';
  });

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'stock' || initialTab === 'vendor' || initialTab === 'vendor-stock') {
        setActiveTab('vendor-stock');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Placed orders state
  const [placedOrders, setPlacedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilterTab, setOrderFilterTab] = useState('all');
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

  if (!user) {
    return (
      <section className="section empty-page">
        <LockKeyhole size={34} />
        <h1>Login to open your account area</h1>
        <p>Your cart, favourites, inquiries and price group stay linked to your buyer account.</p>
        <button className="primary-button" type="button" onClick={() => navigate ? navigate('signup') : (openAuth && openAuth())}>Login / Register</button>
      </section>
    );
  }

  const subtotal = priceAccess.canViewPrices
    ? cartItems.reduce((sum, item) => sum + (customerPrice(item.variant.prices, priceAccess) || 0) * item.quantity, 0)
    : 0;
  const discount = priceAccess.canViewPrices
    ? calculateComboDiscount(cartItems, priceAccess)
    : 0;
  const total = priceAccess.canViewPrices ? Math.max(0, subtotal - discount) : null;

  const approvalHint = priceAccess.blockedByVaranasiPincode
    ? 'Varanasi pincode requires manual approval'
    : priceAccess.canViewPrices
      ? 'Auto approved'
      : 'Waiting for admin review';

  const userInitials = (buyerProfile?.full_name || buyerProfile?.business_name || user.email || 'U')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <section className="account-page">
      <div className="account-hero-card">
        <div className="account-hero-profile">
          <div className="account-avatar-wrapper">
            <span className="account-avatar-text">{userInitials}</span>
            <span className="account-avatar-badge" title="Active B2B Session"></span>
          </div>
          <div className="account-profile-info">
            <span className="account-badge-top">Verified B2B Account</span>
            <h1>{buyerProfile?.business_name || buyerProfile?.full_name || user.email}</h1>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="account-hero-actions">
          <button className="secondary-button" type="button" onClick={() => navigate('catalogue')}>
            Browse Catalogue
          </button>
          <button className="secondary-button logout-btn" type="button" onClick={onSignOut}>
            Log Out
          </button>
        </div>
      </div>

      <div className="account-summary-grid">
        <AccountSummaryCard 
          icon={UserRound} 
          label="Account Type" 
          value={isVendor ? 'Vendor Partner' : 'Customer'} 
          hint={buyerProfile?.pincode ? `PIN ${buyerProfile.pincode}` : ''} 
        />
        <AccountSummaryCard icon={LockKeyhole} label="Pricing Tier" value={priceAccess.canViewPrices ? 'Hybrid Wholesale & Reseller' : 'Pending'} hint={approvalHint} />
        <AccountSummaryCard icon={ShoppingBag} label="My Cart" value={`${cartItems.length} row${cartItems.length === 1 ? '' : 's'}`} hint={total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)} />
        <AccountSummaryCard icon={Heart} label="My Favourites" value={favoriteProducts.length} hint="Saved designs" />
      </div>


      {/* Premium Account Tabs for Responsive Screens */}
      <div className="account-tabs-bar">
        {isVendor && (
          <button type="button" 
            className={`account-tab-btn ${activeTab === 'vendor-stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendor-stock')}
          >
            <Boxes size={16} />
            <span>{isAdmin ? 'Stock Availability' : 'Stock'}</span>
          </button>
        )}
        <button type="button" 
          className={`account-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} />
          <span>Orders ({placedOrders.length})</span>
        </button>
        <button type="button" 
          className={`account-tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <Heart size={16} />
          <span>Saved ({favoriteProducts.length})</span>
        </button>
        <button type="button" 
          className={`account-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          <MapPin size={16} />
          <span>Addresses ({addresses.length})</span>
        </button>
        {priceAccess.resellerDashboardEnabled && (
          <button type="button" 
            className={`account-tab-btn ${activeTab === 'reseller' ? 'active' : ''}`}
            onClick={() => setActiveTab('reseller')}
          >
            <UserRound size={16} />
            <span>Business Center</span>
          </button>
        )}
        <button type="button" 
          className={`account-tab-btn ${activeTab === 'influencer' ? 'active' : ''}`}
          onClick={() => setActiveTab('influencer')}
        >
          <UserRound size={16} />
          <span>Affiliates</span>
        </button>
      </div>

      <div className={`account-dashboard-grid tab-active-${activeTab}`}>
        <article className="account-panel panel-orders">
          <div className="account-panel-head">
            <span><ShoppingBag size={18} /> B2B Shopping Cart (Draft Order)</span>
            {cartItems.length > 0 && (
              <button type="button" onClick={() => navigate('catalogue')}>Continue Sourcing</button>
            )}
          </div>
          <div className="account-list" style={{ marginBottom: '2.5rem' }}>
            {cartItems.slice(0, 5).map((item) => (
              <div className="account-list-row" key={item.variantCode}>
                <img src={item.selectedColorImage || item.product.images[0] || fallbackProductImage} alt={`${item.product.title} – ${item.selectedColorName || item.variant.code}`} loading="lazy" />
                <span>
                  <strong>{item.product.title}</strong>
                  <small>{item.selectedColorName || item.variant.code}</small>
                </span>
                <div className="account-qty-controls">
                  <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                  <output>{item.quantity}</output>
                  <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
                </div>
              </div>
            ))}
            {cartItems.length === 0 && (
              <p className="empty-state" style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '8px', color: 'var(--muted)' }}>
                Your cart is empty.
              </p>
            )}
          </div>

          <div className="account-panel-head" style={{ borderTop: '1px solid var(--line)', paddingTop: '2rem', marginTop: '2rem' }}>
            <span><History size={18} /> Placed Orders (Order History)</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`account-tab-btn ${orderFilterTab === 'all' ? 'active' : ''}`}
              onClick={() => setOrderFilterTab('all')}
              style={{ padding: '5px 12px', fontSize: 'var(--small-size)' }}
            >
              All Orders ({placedOrders.length})
            </button>
            <button
              type="button"
              className={`account-tab-btn ${orderFilterTab === 'dropship' ? 'active' : ''}`}
              onClick={() => setOrderFilterTab('dropship')}
              style={{ padding: '5px 12px', fontSize: 'var(--small-size)' }}
            >
              Dropship Orders ({placedOrders.filter(o => o.is_dropship).length})
            </button>
            <button
              type="button"
              className={`account-tab-btn ${orderFilterTab === 'regular' ? 'active' : ''}`}
              onClick={() => setOrderFilterTab('regular')}
              style={{ padding: '5px 12px', fontSize: 'var(--small-size)' }}
            >
              Standard Orders ({placedOrders.filter(o => !o.is_dropship).length})
            </button>
          </div>

          <div className="account-list">
            {ordersLoading ? (
              <p className="loading-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading your orders...</p>
            ) : placedOrders.length === 0 ? (
              <p className="empty-state" style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '8px', color: 'var(--muted)' }}>
                No orders placed yet.
              </p>
            ) : (
              <div className="placed-orders-grid" style={{ display: 'grid', gap: '16px' }}>
                {placedOrders
                  .filter(o => {
                    if (orderFilterTab === 'dropship') return o.is_dropship;
                    if (orderFilterTab === 'regular') return !o.is_dropship;
                    return true;
                  })
                  .map((order) => {
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
                        className="placed-order-card"
                        style={{ 
                          border: isDropshipOrder ? '1px solid #fde68a' : '1px solid var(--line)', 
                          borderRadius: '10px', 
                          padding: '16px', 
                          background: isDropshipOrder ? 'linear-gradient(135deg, #fffdfa 0%, #fffbf0 100%)' : 'var(--surface-soft)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Tracking ID</span>
                              <code style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-dark)' }}>{order.id}</code>
                            </div>
                            {isDropshipOrder && (
                              <span className="dropship-badge" style={{ marginLeft: '6px' }}>
                                Dropship
                              </span>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Date Placed</span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{orderDate}</span>
                          </div>
                        </div>

                        {isDropshipOrder && (
                          <div style={{ background: '#fef3c7', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: '#92400e', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div><strong>Parcel Sender (Label):</strong> {order.dropship_sender_name || order.business_name || 'Reseller Store'} {order.dropship_sender_phone ? `(${order.dropship_sender_phone})` : ''}</div>
                            <div><strong>Recipient Customer:</strong> {order.dropship_recipient_name || order.buyer_name} {order.dropship_recipient_phone ? `(${order.dropship_recipient_phone})` : ''}</div>
                            {order.dropship_recipient_address && (
                              <div><strong>Deliver To:</strong> {order.dropship_recipient_address}, {order.dropship_recipient_city} - {order.dropship_recipient_pincode}</div>
                            )}
                            <div><strong>Packaging:</strong> {order.dropship_packing_preference || 'Blind Shipping'}</div>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                              <span 
                                style={{ 
                                  ...statusStyle, 
                                  fontSize: '10px', 
                                  fontWeight: 800, 
                                  padding: '4px 10px', 
                                  borderRadius: '20px', 
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}
                              >
                                {order.status || 'new'}
                              </span>
                              {order.pincode && (
                                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                  Pincode: <strong>{order.pincode}</strong>
                                </span>
                              )}
                            </div>
                            
                            <div style={{ display: 'grid', gap: '6px' }}>
                              {order.items && Array.isArray(order.items) && order.items.map((item, idx) => (
                                <div key={idx} style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--gold)', display: 'inline-block' }}></span>
                                  <span>
                                    <strong>{item.product_title || 'Premium Banarasi Saree'}</strong>
                                    {item.color && <span style={{ color: 'var(--muted)' }}> · Color: {item.color}</span>}
                                    {` x ${item.quantity || 1}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', display: 'grid', gap: '8px', justifyItems: 'end' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Amount</span>
                              <strong style={{ fontSize: '16px', color: 'var(--ink)' }}>
                                {orderTotal > 0 ? formatMoney(orderTotal) : 'Price on request'}
                              </strong>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button 
                                type="button" 
                                className="primary-button" 
                                onClick={() => navigate('order-tracking', order.id)}
                                style={{ 
                                  padding: '6px 14px', 
                                  fontSize: '12px', 
                                  minHeight: 0, 
                                  height: 'auto',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  width: 'fit-content'
                                }}
                              >
                                Track Order
                              </button>
                              {isDropshipOrder && (
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => copyCustomerTrackingLink(order.id)}
                                  style={{
                                    fontSize: '11px',
                                    padding: '6px 10px',
                                    border: '1px solid #d97706',
                                    borderRadius: '6px',
                                    color: '#b45309',
                                    background: '#fff',
                                    fontWeight: 600
                                  }}
                                >
                                  {copiedTrackingId === order.id ? '✓ Link Copied!' : 'Copy Customer Tracking Link'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </article>

        <article className="account-panel panel-favorites">
          <div className="account-panel-head">
            <span><Bookmark size={18} /> My Favourites</span>
            <button type="button" onClick={() => navigate('favorites')}>View all</button>
          </div>
          <div className="account-list">
            {favoriteProducts.slice(0, 5).map((product) => (
              <button className="account-list-row as-button" type="button" key={product.id} onClick={() => navigate('product', product.id)}>
                <img src={product.images[0] || fallbackProductImage} alt={product.title} loading="lazy" />
                <span>
                  <strong>{product.title}</strong>
                  <small>{product.variants[0]?.code}</small>
                </span>
              </button>
            ))}
            {favoriteProducts.length === 0 && <p className="empty-state">No favourites saved yet.</p>}
          </div>
        </article>

        <article className="account-panel panel-addresses">
          <div className="account-panel-head">
            <span><MapPin size={18} /> My Saved Addresses</span>
            {!showAddEditForm && (
              <button 
                type="button" 
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
                + Add Address
              </button>
            )}
          </div>

          {showAddEditForm ? (
            <form onSubmit={handleSaveAddress} className="account-address-form">
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
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
            <div className="account-addresses-list">
              {addressLoading && <p className="loading-state">Loading addresses...</p>}
              {!addressLoading && addresses.length === 0 && (
                <div className="address-empty-state">
                  <p>You have no saved addresses yet.</p>
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
                    Add Your First Address
                  </button>
                </div>
              )}
              {!addressLoading && addresses.map((addr) => (
                <div 
                  key={addr.id} 
                  className={`account-address-card ${addr.is_default ? 'default' : ''}`}
                >
                  <div className="address-card-content">
                    <div className="address-card-header">
                      <strong>{addr.full_name}</strong>
                      {addr.is_default && <span className="default-badge">Default</span>}
                    </div>
                    <p className="phone">{addr.phone_number}</p>
                    <p className="street">
                      {addr.address_line1}
                      {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                    </p>
                    <p className="location">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="country">{addr.country}</p>
                  </div>
                  <div className="address-card-actions">
                    <button 
                      type="button" 
                      className="edit-btn" 
                      onClick={() => handleStartEdit(addr)}
                      title="Edit Address"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button 
                      type="button" 
                      className="delete-btn" 
                      onClick={() => handleDeleteAddress(addr.id)}
                      title="Delete Address"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                    {!addr.is_default && (
                      <button 
                        type="button" 
                        className="set-default-btn" 
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
        </article>

        {priceAccess.resellerDashboardEnabled && (
          <article className="account-panel account-panel-highlight panel-reseller" style={{ border: '1px solid var(--primary-color)' }}>
            <div className="account-panel-head">
              <span><UserRound size={18} /> My Reseller Business Center</span>
            </div>
            <div style={{ padding: '1.5rem', background: 'var(--bg-light)', borderRadius: '8px', marginTop: '1rem' }}>
              <h2 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>White-Label Storefront</h2>
              <p className="account-muted" style={{ marginBottom: '1.5rem' }}>Manage your personalized catalog, themes, and customer shares in a dedicated, unbranded environment.</p>
              <button type="button" className="primary-button" onClick={() => navigate('reseller-dashboard')}>
                Open Business Center
              </button>
            </div>
          </article>
        )}

        {activeTab === 'influencer' && (
          <article className="account-panel panel-influencer">
            <div className="account-panel-head" style={{ marginBottom: '1.5rem' }}>
              <span><UserRound size={18} /> Weave 365 Affiliate Program</span>
            </div>

            {influencerLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
                <p>Loading influencer dashboard...</p>
              </div>
            ) : !influencerProfile ? (
              /* Application Form */
              <div style={{ maxWidth: '500px', margin: '1.5rem auto' }}>
                <h2 style={{ fontSize: 'var(--h3-size)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>Join the Weave 365 Affiliate Partner Program</h2>
                <p style={{ fontSize: 'var(--body-size)', color: 'var(--muted)', marginBottom: '2rem', lineHeight: '1.5', textAlign: 'center', fontWeight: 400 }}>
                  Share Banarasi collection (saree, suit and more) with your audience and earn 10% commission on every order!
                </p>

                <form onSubmit={handleApplyInfluencer} style={{ display: 'grid', gap: '20px' }}>
                  <div style={{ background: 'rgba(183, 134, 70, 0.08)', border: '1px solid rgba(183, 134, 70, 0.25)', borderRadius: '8px', padding: '14px', fontSize: 'var(--small-size)', color: 'var(--gold-dark)', display: 'flex', gap: '8px', alignItems: 'flex-start', lineHeight: '1.4' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Important Notice:</strong> Commissions are tracked once a customer completes checkout. However, funds will only be credited to your account and eligible for payout after the customer receives the products and the return/exchange window has successfully expired.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 'var(--small-size)', fontWeight: 600, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Desired Referral Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. FASHION10"
                      value={infFormCode}
                      onChange={e => setInfFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      required
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: 'var(--body-size)', outline: 'none', transition: 'border-color 0.2s' }}
                    />
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(183,134,70,0.06)', padding: '6px 12px', borderRadius: '20px', border: '1px dashed rgba(183,134,70,0.3)', marginTop: '10px', fontSize: 'var(--small-size)', fontWeight: 600, color: 'var(--gold-dark)' }}>
                      <span>Referral Link:</span>
                      <code>weave365.com/?ref={infFormCode || 'YOUR_CODE'}</code>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Payout Method *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setInfFormPayoutMethod('upi')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '14px',
                          borderRadius: '8px',
                          border: infFormPayoutMethod === 'upi' ? '2px solid var(--gold-dark)' : '1px solid var(--line)',
                          background: infFormPayoutMethod === 'upi' ? 'rgba(183,134,70,0.04)' : 'var(--white)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: infFormPayoutMethod === 'upi' ? 'var(--gold-dark)' : 'var(--ink)' }}>UPI ID</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>username@bank</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInfFormPayoutMethod('bank')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '14px',
                          borderRadius: '8px',
                          border: infFormPayoutMethod === 'bank' ? '2px solid var(--gold-dark)' : '1px solid var(--line)',
                          background: infFormPayoutMethod === 'bank' ? 'rgba(183,134,70,0.04)' : 'var(--white)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          outline: 'none'
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: infFormPayoutMethod === 'bank' ? 'var(--gold-dark)' : 'var(--ink)' }}>Bank Transfer</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Wire Account Details</span>
                      </button>
                    </div>
                  </div>

                  {infFormPayoutMethod === 'upi' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>UPI ID *</label>
                      <input
                        type="text"
                        placeholder="username@bank"
                        value={infFormUpiId}
                        onChange={e => setInfFormUpiId(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Bank Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          value={infFormBankName}
                          onChange={e => setInfFormBankName(e.target.value)}
                          required
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Account Number *</label>
                        <input
                          type="text"
                          placeholder="Enter account number"
                          value={infFormAccountNo}
                          onChange={e => setInfFormAccountNo(e.target.value)}
                          required
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>IFSC Code *</label>
                        <input
                          type="text"
                          placeholder="Enter 11-digit IFSC code"
                          value={infFormIfsc}
                          onChange={e => setInfFormIfsc(e.target.value.toUpperCase())}
                          required
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--line)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                    </div>
                  )}

                  {infFormError && (
                    <p style={{ color: '#C62828', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>{infFormError}</p>
                  )}

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={infFormSubmitting}
                    style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}
                  >
                    {infFormSubmitting ? 'Submitting Application…' : 'SUBMIT APPLICATION'}
                  </button>
                </form>
              </div>
            ) : !influencerProfile.is_approved ? (
              /* Pending Status Review Screen */
              <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', border: '1px solid #FFE8E1', borderRadius: '8px', background: '#FFFDF9', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold-dark)', marginBottom: '0.5rem' }}>Application Under Review</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                  Your application for the referral code <strong style={{ color: 'var(--text-dark)' }}>{influencerProfile.referral_code}</strong> has been received!
                  We are validating your profile details. You will receive a WhatsApp message once your profile is approved.
                </p>
                <div style={{ display: 'inline-block', border: '1px solid var(--line)', borderRadius: '6px', padding: '12px 20px', background: 'var(--surface-soft)', marginTop: '1.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--muted)', display: 'block' }}>Submitted Payout Details:</span>
                  {influencerProfile.payment_details?.payout_method === 'upi' ? (
                    <strong>UPI ID: {influencerProfile.payment_details?.upi_id}</strong>
                  ) : (
                    <strong>Bank Wire to Account ...{influencerProfile.payment_details?.account_number?.slice(-4)}</strong>
                  )}
                </div>
              </div>
            ) : (
              /* Active Influencer Dashboard */
              <div style={{ display: 'grid', gap: '24px', minWidth: 0, width: '100%' }}>
                {/* 1. Stats Row */}
                <div className="influencer-stats-grid">
                  <div className="influencer-stats-card">
                    <span>Total Visitors</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{influencerStats.clicks}</strong>
                    <small>Unique Clickthroughs</small>
                  </div>
                  <div className="influencer-stats-card">
                    <span>Total Conversions</span>
                    <strong style={{ color: 'var(--text-dark)' }}>{influencerStats.referrals.filter(r => r.status !== 'cancelled').length}</strong>
                    <small>Orders</small>
                  </div>
                  <div className="influencer-stats-card">
                    <span>Commission Earned</span>
                    <strong style={{ color: 'var(--gold-dark)' }}>
                      {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status !== 'cancelled')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </strong>
                    <small>Rate: {influencerProfile.commission_percentage}%</small>
                  </div>
                  <div className="influencer-stats-card">
                    <span>Settled Payouts</span>
                    <strong style={{ color: '#2E7D32' }}>
                      {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status === 'paid')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </strong>
                    <small>
                      Pending: {formatMoney(
                        influencerStats.referrals
                          .filter(r => r.status === 'pending')
                          .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0)
                      )}
                    </small>
                  </div>
                </div>

                {/* 2. Link Sharing Section */}
                <div className="influencer-link-section" style={{ padding: '1.5rem', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--surface)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your Unique Referral Link</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                    Copy this link and share it in your social media bio, YouTube descriptions, or Instagram posts. When a business clicks your link and places a wholesale order, you get paid!
                  </p>
                  <div className="influencer-share-row">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/?ref=${influencerProfile.referral_code}` : ''}
                      style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '0.85rem', background: 'var(--bg-light)', color: 'var(--text-dark)', fontWeight: 600, width: '100%', boxSizing: 'border-box', minWidth: 0 }}
                      onClick={e => e.target.select()}
                    />
                    <button
                      type="button"
                      className="primary-button"
                      style={{ padding: '0 16px', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.origin}/?ref=${influencerProfile.referral_code}`);
                          alert('Link copied to clipboard!');
                        }
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* 3. Conversion Transactions Log */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Referred Conversion History</h3>
                  {influencerStats.referrals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', border: '1px dashed var(--line)', borderRadius: '8px', color: 'var(--muted)' }}>
                      No referred orders recorded yet. Share your link to start earning!
                    </div>
                  ) : (
                    <div className="influencer-history-wrapper" style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px', width: '100%', minWidth: 0 }}>
                      <table className="influencer-history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--surface-soft)', borderBottom: '1px solid var(--line)' }}>
                            <th style={{ padding: '10px 12px' }}>Date</th>
                            <th style={{ padding: '10px 12px' }}>Reference</th>
                            <th style={{ padding: '10px 12px' }}>Buyer Name</th>
                            <th style={{ padding: '10px 12px' }}>Order Total</th>
                            <th style={{ padding: '10px 12px' }}>My Commission</th>
                            <th style={{ padding: '10px 12px' }}>Payout Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {influencerStats.referrals.map(ref => {
                            const dateStr = new Date(ref.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            });
                            
                            let statusBg = '#F5F5F5';
                            let statusColor = '#616161';
                            if (ref.status === 'paid') {
                              statusBg = '#EAFAF1';
                              statusColor = '#2E7D32';
                            } else if (ref.status === 'cancelled') {
                              statusBg = '#FFEBEE';
                              statusColor = '#C62828';
                            } else if (ref.status === 'pending') {
                              statusBg = '#FFF8E1';
                              statusColor = '#B78646';
                            }

                            return (
                              <tr key={ref.id} style={{ borderBottom: '1px solid var(--line)' }}>
                                <td data-label="Date" style={{ padding: '10px 12px' }}>{dateStr}</td>
                                <td data-label="Reference" style={{ padding: '10px 12px' }}><code style={{ fontSize: '11px' }}>{ref.order_id || ref.inquiry_id || 'N/A'}</code></td>
                                <td data-label="Buyer" style={{ padding: '10px 12px' }}>{ref.buyer_name || 'Guest Buyer'}</td>
                                <td data-label="Order Total" style={{ padding: '10px 12px', fontWeight: 600 }}>{formatMoney(ref.sale_amount)}</td>
                                <td data-label="Commission" style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gold-dark)' }}>{formatMoney(ref.commission_amount)}</td>
                                <td data-label="Status" style={{ padding: '10px 12px' }}>
                                  <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, background: statusBg, color: statusColor }}>
                                    {ref.status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </article>
        )}

        {activeTab === 'vendor-stock' && (
          <article className="account-panel panel-vendor-stock" style={{ gridColumn: '1 / -1', width: '100%', background: 'transparent', padding: 0, border: 'none', boxShadow: 'none' }}>
            <VendorStockPanel
              user={user}
              buyerProfile={buyerProfile}
              products={products}
            />
          </article>
        )}
      </div>
    </section>
  );
}

