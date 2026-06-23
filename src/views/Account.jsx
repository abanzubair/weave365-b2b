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
import { Bookmark, ClipboardList, Heart, History, LockKeyhole, ShoppingBag, UserRound, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { customerPrice, fallbackProductImage, formatMoney, calculateComboDiscount } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { ResellerTools } from '../components/ResellerTools.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

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
  navigate,
  openAuth,
  updateQuantity,
  onSignOut,
}) {
  const [activeTab, setActiveTab] = useState('orders');

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Placed orders state
  const [placedOrders, setPlacedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

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
    }
  }, [activeTab, user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchAddresses();
      fetchPlacedOrders();
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
          .eq('id', editingAddress.id);
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
    if (!isSupabaseConfigured) return;

    try {
      const target = addresses.find(a => a.id === id);
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);
      if (error) throw error;

      if (target?.is_default && addresses.length > 1) {
        const remaining = addresses.filter(a => a.id !== id);
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remaining[0].id);
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
        .eq('id', id);
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
        <p>Your order list, favourites, inquiries and price group stay linked to your buyer account.</p>
        <button className="primary-button" type="button" onClick={openAuth}>Login / Register</button>
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
          <button className="secondary-button" type="button" onClick={() => navigate('wholesale-catalogue')}>
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
          label="My Buyer Type" 
          value={buyerProfile?.buyer_subtype ? titleCase(buyerProfile.buyer_subtype) : titleCase(priceAccess.buyerType)} 
          hint={buyerProfile?.pincode ? `PIN ${buyerProfile.pincode}` : ''} 
        />
        <AccountSummaryCard icon={LockKeyhole} label="My Approved Price Group" value={priceAccess.canViewPrices ? priceAccess.priceLabel : 'Pending'} hint={approvalHint} />
        <AccountSummaryCard icon={ShoppingBag} label="My Order List" value={`${cartItems.length} row${cartItems.length === 1 ? '' : 's'}`} hint={total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)} />
        <AccountSummaryCard icon={Heart} label="My Favourites" value={favoriteProducts.length} hint="Saved designs" />
      </div>

      {/* Premium Account Tabs for Responsive Screens */}
      <div className="account-tabs-bar">
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
      </div>

      <div className={`account-dashboard-grid tab-active-${activeTab}`}>
        <article className="account-panel panel-orders">
          <div className="account-panel-head">
            <span><ShoppingBag size={18} /> B2B Shopping Cart (Draft Order)</span>
            {cartItems.length > 0 && (
              <button type="button" onClick={() => navigate('wholesale-catalogue')}>Continue Sourcing</button>
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

          <div className="account-list">
            {ordersLoading ? (
              <p className="loading-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading your orders...</p>
            ) : placedOrders.length === 0 ? (
              <p className="empty-state" style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '8px', color: 'var(--muted)' }}>
                No orders placed yet.
              </p>
            ) : (
              <div className="placed-orders-grid" style={{ display: 'grid', gap: '16px' }}>
                {placedOrders.map((order) => {
                  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const statusStyle = getStatusBadgeStyle(order.status);
                  const orderTotal = order.items && Array.isArray(order.items)
                    ? order.items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
                    : 0;

                  return (
                    <div 
                      key={order.id} 
                      className="placed-order-card"
                      style={{ 
                        border: '1px solid var(--line)', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        background: 'var(--surface-soft)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Tracking ID</span>
                          <code style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold-dark)' }}>{order.id}</code>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Date Placed</span>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{orderDate}</span>
                        </div>
                      </div>

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
      </div>
    </section>
  );
}

