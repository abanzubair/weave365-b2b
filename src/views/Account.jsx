import { Bookmark, ClipboardList, Heart, History, LockKeyhole, ShoppingBag, UserRound } from 'lucide-react';
import { customerPrice, fallbackProductImage, formatMoney } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { ResellerTools } from '../components/ResellerTools.jsx';

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
        <p>Your order list, favourites, inquiries and price group stay linked to your buyer account.</p>
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
        <AccountSummaryCard icon={ShoppingBag} label="My Order List" value={`${cartItems.length} row${cartItems.length === 1 ? '' : 's'}`} hint={total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)} />
        <AccountSummaryCard icon={Heart} label="My Favourites" value={favoriteProducts.length} hint="Saved designs" />
      </div>

      <div className="account-dashboard-grid">
        <article className="account-panel">
          <div className="account-panel-head">
            <span><ShoppingBag size={18} /> My Order List</span>
            <button type="button" onClick={() => navigate('catalog')}>Add items</button>
          </div>
          <div className="account-list">
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
            {cartItems.length === 0 && <p className="empty-state">Your order list is empty.</p>}
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

      </div>


      {priceAccess.resellerDashboardEnabled && (
        <article className="account-panel account-panel-highlight" style={{ marginTop: '2rem', border: '1px solid var(--primary-color)' }}>
          <div className="account-panel-head">
            <span><UserRound size={18} /> My Reseller Business Center</span>
          </div>
          <div style={{ padding: '1.5rem', background: 'var(--bg-light)', borderRadius: '8px', marginTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>White-Label Storefront</h3>
            <p className="account-muted" style={{ marginBottom: '1.5rem' }}>Manage your personalized catalog, themes, and customer shares in a dedicated, unbranded environment.</p>
            <button className="primary-button" onClick={() => navigate('reseller-dashboard')}>
              Open Business Center
            </button>
          </div>
        </article>
      )}
    </section>
  );
}

