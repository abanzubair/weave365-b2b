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
} from 'lucide-react';
import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';

import { fallbackProductImage, formatMoney, customerPrice, CURRENCIES, CurrencyManager, useCurrency } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { useState } from 'react';

export function MobileMenu({ onClose, navigate, setCategory, user, openAuth, search, setSearch, visibleProducts, priceAccess }) {
  const currentCurrency = useCurrency();
  const [localSearch, setLocalSearch] = useState(search || '');
  const navItems = [
    { icon: <Layers size={20} />, label: 'Categories', action: () => navigate('catalog') },
    {
      icon: <BadgeCheck size={20} />,
      label: 'Bestsellers',
      action: () => {
        setCategory('Bestsellers');
        navigate('catalog');
      },
    },
    {
      icon: <Sparkles size={20} />,
      label: 'New Arrivals',
      action: () => {
        setCategory('All');
        navigate('catalog');
      },
    },
    { icon: <PackageCheck size={20} />, label: 'Bulk Order', action: () => navigate('bulk-inquiry') },
    { icon: <Store size={20} />, label: 'Catalogue', action: () => navigate('catalog') },
  ];

  return (
    <>
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu-head">
          <img src={brandLogo} alt={storeConfig.name} className="brand-logo" style={{ height: 36 }} />
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
              autoFocus
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
                          alt=""
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
          {navItems.map(({ icon, label, action }) => (
            <button key={label} onClick={action} className="mobile-menu-item">
              <span className="mobile-menu-icon">{icon}</span>
              {label}
              <ArrowRight size={16} className="mobile-menu-arrow" />
            </button>
          ))}
        </nav>
        <div className="mobile-menu-divider" />
        <button className="mobile-menu-item mobile-menu-account" onClick={() => user ? navigate('account') : openAuth()}>
          <span className="mobile-menu-icon"><User size={20} /></span>
          {user ? user.email || 'Account' : 'Login / Register'}
          <ArrowRight size={16} className="mobile-menu-arrow" />
        </button>
        <div className="mobile-menu-section">
          <h4 className="mobile-menu-section-title">Select Currency</h4>
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
        <div className="mobile-menu-footer">
          <span><Headphones size={16} /> {storeConfig.phone}</span>
          <span><MessageCircle size={16} /> {storeConfig.email}</span>
        </div>
      </aside>
    </>
  );
}
