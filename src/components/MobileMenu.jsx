import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  Layers,
  Mail,
  PackageCheck,
  Search,
  Sparkles,
  Store,
  User,
  X,
  MessageCircle,
  Bookmark,
  ShoppingBag,
  ChevronDown,
  LogOut,
  Globe,
  BookOpen,
} from 'lucide-react';

import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';

import { fallbackProductImage, formatMoney, customerPrice, CURRENCIES, CurrencyManager, useCurrency } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { assetSrc } from '../utils/assetSrc.js';
import { useState } from 'react';

export function MobileMenu({ 
  onClose, 
  navigate, 
  setCategory, 
  user, 
  isAdmin,
  categories = [],
  openAuth, 
  search, 
  setSearch, 
  visibleProducts, 
  priceAccess,
  setCartOpen,
  cartCount,
  favoritesCount,
  onSignOut
}) {
  const currentCurrency = useCurrency();
  const [localSearch, setLocalSearch] = useState(search || '');
  const [accountOpen, setAccountOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);


  const navItems = [
    { 
      icon: <Sparkles size={20} />, 
      label: 'New Arrivals', 
      action: () => { 
        navigate('new-arrivals'); 
        onClose();
      } 
    },
    { 
      icon: <Store size={20} />, 
      label: 'Catalogue', 
      action: () => navigate('catalog') 
    },
    { 
      icon: <PackageCheck size={20} />, 
      label: 'Bulk Order', 
      action: () => navigate('bulk-inquiry') 
    },
    { 
      icon: <BookOpen size={20} />, 
      label: 'B2B Blog', 
      action: () => {
        navigate('blog');
        onClose();
      }
    },
    ...(isAdmin ? [
      { 
        icon: <BadgeCheck size={20} />, 
        label: 'Admin', 
        action: () => navigate('admin') 
      }
    ] : []),
  ];

  const accountItems = [
    { 
      icon: <ShoppingBag size={18} />, 
      label: 'My Order List', 
      badge: cartCount,
      action: () => {
        onClose();
        setCartOpen(true);
      } 
    },
    { 
      icon: <Bookmark size={18} />, 
      label: 'Saved Items', 
      badge: favoritesCount,
      action: () => navigate('favorites') 
    },
    ...(user ? [
      { icon: <User size={18} />, label: 'Account Details', action: () => navigate('account') },
      { icon: <LogOut size={18} />, label: 'Logout', action: () => { onSignOut(); onClose(); } },
    ] : [
      { icon: <User size={18} />, label: 'Login / Register', action: () => openAuth() },
    ]),
  ];

  return (
    <>
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu-head">
          <img src={assetSrc(brandLogo)} alt={storeConfig.name} className="brand-logo" style={{ height: 36 }} />
          <button className="icon-button" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <div className="mobile-menu-search">
          <label className="mobile-search-box">
            <Search size={18} />
            <input
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setSearch(e.target.value);
              }}
              placeholder="Search products..."
            />
          </label>
          {localSearch.trim() && (
            <div className="mobile-search-results">
              {visibleProducts.length > 0 ? (
                <>
                  {visibleProducts.slice(0, 5).map((product) => {
                    const price = customerPrice(product.variants?.[0]?.prices || {}, priceAccess);
                    const image = product.images?.[0] || fallbackProductImage;
                    return (
                      <button
                        key={product.id}
                        className="mobile-search-item"
                        onClick={() => {
                          setSearch('');
                          navigate('product', product.id);
                        }}
                      >
                        <img
                          src={image}
                          alt={product.title}
                          loading="lazy"
                          onError={(e) => { e.target.style.opacity = '0'; }}
                        />
                        <div>
                          <span>{product.name || product.title}</span>
                          {price != null && price > 0 ? <small>{formatMoney(price)}</small> : <small>{priceNoticeForAccess(priceAccess)}</small>}
                        </div>
                      </button>
                    );
                  })}
                  <button
                    className="mobile-search-view-all"
                    onClick={() => {
                      navigate('catalog');
                    }}
                  >
                    See all results for "{localSearch}"
                  </button>
                </>
              ) : (
                <div className="mobile-search-empty">No products found</div>
              )}
            </div>
          )}
        </div>
        <nav className="mobile-menu-nav">
          <div className={`mobile-account-dropdown ${categoriesOpen ? 'is-open' : ''}`}>
            <button 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <span className="mobile-menu-icon"><Layers size={20} /></span>
              <span className="mobile-menu-label">Categories</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${categoriesOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                {categories.map((cat) => (
                  <button 
                    key={cat} 
                    className="mobile-account-subitem" 
                    onClick={() => {
                      setCategory(cat);
                      navigate('catalog');
                      onClose();
                    }}
                  >
                    <span className="subitem-label" style={{ paddingLeft: '8px' }}>
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`mobile-account-dropdown ${partnerOpen ? 'is-open' : ''}`}>
            <button 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => setPartnerOpen(!partnerOpen)}
            >
              <span className="mobile-menu-icon"><Layers size={20} /></span>
              <span className="mobile-menu-label">Partner</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${partnerOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                {[
                  { name: 'Sourcing Partners', slug: 'sourcing-partners' },
                  { name: 'White Label Brands', slug: 'white-label-brands' },
                ].map((item) => (
                  <button 
                    key={item.slug} 
                    className="mobile-account-subitem" 
                    onClick={() => {
                      navigate(item.slug);
                      onClose();
                    }}
                  >
                    <span className="subitem-label" style={{ paddingLeft: '8px' }}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {navItems.map(({ icon, label, action, badge }) => (
            <button key={label} onClick={action} className="mobile-menu-item">
              <span className="mobile-menu-icon">{icon}</span>
              <span className="mobile-menu-label">
                {label}
                {badge > 0 && <span className="mobile-menu-badge">{badge}</span>}
              </span>
              <ArrowRight size={16} className="mobile-menu-arrow" />
            </button>
          ))}
        </nav>
        <div className="mobile-menu-bottom-section">
          <div className="mobile-menu-divider" />
          
          <div className={`mobile-account-dropdown ${accountOpen ? 'is-open' : ''}`}>
            <button 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => setAccountOpen(!accountOpen)}
            >
              <span className="mobile-menu-icon"><User size={20} /></span>
              <span className="mobile-menu-label">My Account</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${accountOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                {accountItems.map((item, idx) => (
                  <button key={idx} className="mobile-account-subitem" onClick={item.action}>
                    <span className="subitem-icon">{item.icon}</span>
                    <span className="subitem-label">
                      {item.label}
                      {item.badge > 0 && <span className="mobile-menu-badge mini">{item.badge}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={`mobile-currency-dropdown ${currencyOpen ? 'is-open' : ''}`}>
            <button 
              className="mobile-menu-item mobile-currency-trigger" 
              onClick={() => setCurrencyOpen(!currencyOpen)}
            >
              <span className="mobile-menu-icon"><Globe size={20} /></span>
              <span className="mobile-menu-label">Select Currency</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${currencyOpen ? 'rotated' : ''}`} />
            </button>

            
            <div className="mobile-currency-expandable">
              <div className="mobile-currency-expandable-inner">
                <div className="mobile-currency-grid">
                  {CURRENCIES.map(c => (
                    <button 
                      key={c.code}
                      className={`mobile-currency-btn ${c.code === currentCurrency ? 'active' : ''}`}
                      onClick={() => {
                        CurrencyManager.setCurrency(c.code);
                      }}
                    >
                      <img src={`https://flagcdn.com/w20/${c.flag}.png`} alt="" className="flag-img" />
                      <span>{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mobile-menu-footer">
            <a href={storeConfig.phone.startsWith('+') ? `tel:${storeConfig.phone}` : `tel:+91${storeConfig.phone}`}>
              <Headphones size={16} />
              <span>
                {storeConfig.phone === '9919101369' 
                  ? '+91 9919 101369' 
                  : (storeConfig.phone.length === 10 && !storeConfig.phone.startsWith('+')
                      ? `+91 ${storeConfig.phone.slice(0, 4)} ${storeConfig.phone.slice(4)}`
                      : storeConfig.phone
                    )
                }
              </span>
            </a>
            <a href={`mailto:${storeConfig.email}`}>
              <MessageCircle size={16} />
              <span>{storeConfig.email}</span>
            </a>
          </div>
        </div>

      </aside>
    </>
  );
}
