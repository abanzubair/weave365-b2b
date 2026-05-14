import { Bookmark, ClipboardList, Heart, History, LockKeyhole, ShoppingBag, UserRound } from 'lucide-react';
import { customerPrice, fallbackProductImage, formatMoney } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';

function titleCase(value) {
  return String(value || 'pending')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function AccountSummaryCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="account-summary-card">
      <Icon size={22} />
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
  if (!user) {
    return (
      <section className="section empty-page">
        <LockKeyhole size={34} />
        <h1>Login to open your account area</h1>
        <p>Your cart, favourites, inquiries and price group stay linked to your buyer account.</p>
        <button className="primary-button" type="button" onClick={openAuth}>Login / Register</button>
      </section>
    );
  }

  const total = priceAccess.canViewPrices
    ? cartItems.reduce((sum, item) => sum + (customerPrice(item.variant.prices, priceAccess) || 0) * item.quantity, 0)
    : null;

  const approvalHint = priceAccess.blockedByVaranasiPincode
    ? 'Varanasi pincode requires manual approval'
    : priceAccess.canViewPrices
      ? 'Auto approved'
      : 'Waiting for admin review';

  return (
    <section className="account-page">
      <div className="account-hero">
        <div>
          <span>Account Area</span>
          <h1>{buyerProfile?.business_name || buyerProfile?.full_name || user.email}</h1>
          <p>{user.email}</p>
        </div>
        <div className="account-hero-actions" style={{ display: 'flex', gap: '12px' }}>
          <button className="secondary-button" type="button" onClick={() => navigate('catalog')}>
            Browse Catalogue
          </button>
          <button className="secondary-button logout-btn" type="button" onClick={onSignOut}>
            Log Out
          </button>
        </div>
      </div>

      <div className="account-summary-grid">
        <AccountSummaryCard icon={UserRound} label="My Buyer Type" value={titleCase(priceAccess.buyerType)} hint={buyerProfile?.pincode ? `PIN ${buyerProfile.pincode}` : ''} />
        <AccountSummaryCard icon={LockKeyhole} label="My Approved Price Group" value={priceAccess.canViewPrices ? priceAccess.priceLabel : 'Pending'} hint={approvalHint} />
        <AccountSummaryCard icon={ShoppingBag} label="My Cart" value={`${cartItems.length} row${cartItems.length === 1 ? '' : 's'}`} hint={total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)} />
        <AccountSummaryCard icon={Heart} label="My Favourites" value={favoriteProducts.length} hint="Saved designs" />
      </div>

      <div className="account-dashboard-grid">
        <article className="account-panel">
          <div className="account-panel-head">
            <span><ShoppingBag size={18} /> My Cart</span>
            <button type="button" onClick={() => navigate('catalog')}>Add items</button>
          </div>
          <div className="account-list">
            {cartItems.slice(0, 5).map((item) => (
              <div className="account-list-row" key={item.variantCode}>
                <img src={item.selectedColorImage || item.product.images[0] || fallbackProductImage} alt="" />
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
            {cartItems.length === 0 && <p className="empty-state">Your cart is empty.</p>}
          </div>
        </article>

        <article className="account-panel">
          <div className="account-panel-head">
            <span><Bookmark size={18} /> My Favourites</span>
            <button type="button" onClick={() => navigate('favorites')}>View all</button>
          </div>
          <div className="account-list">
            {favoriteProducts.slice(0, 5).map((product) => (
              <button className="account-list-row as-button" type="button" key={product.id} onClick={() => navigate('product', product.id)}>
                <img src={product.images[0] || fallbackProductImage} alt="" />
                <span>
                  <strong>{product.title}</strong>
                  <small>{product.variants[0]?.code}</small>
                </span>
              </button>
            ))}
            {favoriteProducts.length === 0 && <p className="empty-state">No favourites saved yet.</p>}
          </div>
        </article>

        <article className="account-panel">
          <div className="account-panel-head">
            <span><ClipboardList size={18} /> Saved for Customer Orders</span>
          </div>
          <p className="account-muted">This CRM section is ready for the Supabase table. Saved customer order notes will appear here.</p>
        </article>

        <article className="account-panel">
          <div className="account-panel-head">
            <span><History size={18} /> My Inquiry History</span>
          </div>
          <p className="account-muted">Product, cart and bulk inquiry history will appear here after the inquiry table is connected.</p>
        </article>
      </div>
    </section>
  );
}
