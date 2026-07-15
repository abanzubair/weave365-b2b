/**
 * MobileMenu Component
 * Purpose: Renders the full-screen slide-over B2B drawer navigation for mobile devices.
 * Displays the curated premium navigation categories (NEW ARRIVALS, CATALOGUE, CATEGORIES,
 * PARTNERS, and ABOUT) and maintains the lower utility sections (My Account, Currency selection, and contact support).
 */
import { useState } from 'react';
import {
  ArrowRight,
  Headphones,
  Layers,
  Sparkles,
  Store,
  User,
  X,
  MessageCircle,
  Bookmark,
  ShoppingBag,
  ChevronDown,
  LogOut,
  Briefcase,
  Globe,
  Info,
  Star,
  Shield,
} from 'lucide-react';

import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';
import { CURRENCIES, CurrencyManager, useCurrency } from '../storefrontShared.jsx';
import { DemoToggle } from '../utils/demoHelper.js';

const pluralizeCategory = (cat) => {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  if (lower === 'all') return cat;
  if (lower === 'under 999') return cat;
  if (lower === 'saree') return 'Sarees';
  if (lower === 'suit') return 'Suits';
  if (lower === 'lehenga') return 'Lehengas';
  if (lower === 'dupatta') return 'Dupattas';
  if (lower === 'fabric') return 'Fabrics';
  if (lower.endsWith('s')) return cat;
  return cat + 's';
};

export function MobileMenu({ 
  onClose, 
  navigate, 
  setCategory, 
  user,
  categories = [],
  openAuth,
  setCartOpen,
  cartCount,
  favoritesCount,
  onSignOut,
  vendorOnboarding,
  isAdmin
}) {
  const currentCurrency = useCurrency();
  const [accountOpen, setAccountOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [partnerOpen, setPartnerOpen] = useState(false);

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
      action: () => {
        navigate('favorites');
        onClose();
      }
    },
    ...(vendorOnboarding?.status === 'approved' && vendorOnboarding?.drive_folder_url ? [
      {
        icon: <Store size={18} style={{ color: '#b78646' }} />,
        label: 'Product Listing',
        action: () => {
          window.open(vendorOnboarding.drive_folder_url, '_blank');
          onClose();
        }
      }
    ] : []),
    ...(user ? [
      { icon: <User size={18} />, label: 'Account Details', action: () => { navigate('account'); onClose(); } },
      { icon: <LogOut size={18} />, label: 'Logout', action: () => { onSignOut(); onClose(); } },
    ] : [
      { icon: <User size={18} />, label: 'Login / Register', action: () => { openAuth(); onClose(); } },
    ]),
  ];

  return (
    <>
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu-head">
          <img src={assetSrc(brandLogo)} alt={storeConfig.name} className="brand-logo" style={{ height: 36 }} />
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="mobile-menu-nav">
          {/* 1. NEW ARRIVALS */}
          <button type="button" 
            className="mobile-menu-item" 
            onClick={() => {
              navigate('new-arrivals');
              onClose();
            }}
          >
            <span className="mobile-menu-icon"><Sparkles size={20} /></span>
            <span className="mobile-menu-label">NEW ARRIVALS</span>
            <ArrowRight size={16} className="mobile-menu-arrow" />
          </button>

          {/* 3. CATEGORIES */}
          <div className={`mobile-account-dropdown ${categoriesOpen ? 'is-open' : ''}`}>
            <button type="button" 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              <span className="mobile-menu-icon"><Layers size={20} /></span>
              <span className="mobile-menu-label">CATEGORIES</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${categoriesOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                {categories.map((cat) => (
                  <button type="button" 
                    key={cat} 
                    className="mobile-account-subitem" 
                    onClick={() => {
                      setCategory(cat);
                      navigate('catalogue', null, null, { category: cat });
                      onClose();
                    }}
                  >
                    <span className="subitem-label" style={{ paddingLeft: '8px' }}>
                      {pluralizeCategory(cat)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. BUSINESS */}
          <div className={`mobile-account-dropdown ${partnerOpen ? 'is-open' : ''}`}>
            <button type="button" 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => setPartnerOpen(!partnerOpen)}
            >
              <span className="mobile-menu-icon"><Briefcase size={20} /></span>
              <span className="mobile-menu-label">BUSINESS</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${partnerOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                <span className="mobile-mega-heading">Buy</span>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('bulk-inquiry'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Bulk Enquiry</span>
                </button>

                <span className="mobile-mega-heading">Sell</span>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('dropshipping'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Dropshipping Program</span>
                </button>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('white-label'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>White Label Catalog</span>
                </button>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('resell-sarees-online'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Reseller Centre</span>
                </button>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('affiliate-program'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Affiliate Program</span>
                </button>

                <span className="mobile-mega-heading">Partner</span>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('collaboration'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Collaboration</span>
                </button>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('sourcing-partners'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Sourcing Partner</span>
                </button>

                <span className="mobile-mega-heading">Supply</span>
                <button type="button" className="mobile-account-subitem" onClick={() => { navigate('weaver-onboarding'); onClose(); }}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Vendor Onboarding</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. ABOUT */}
          <button type="button" 
            className="mobile-menu-item" 
            onClick={() => {
              navigate('about');
              onClose();
            }}
          >
            <span className="mobile-menu-icon"><Info size={20} /></span>
            <span className="mobile-menu-label">ABOUT</span>
            <ArrowRight size={16} className="mobile-menu-arrow" />
          </button>

          {/* 6. CONTACT */}
          <button type="button" 
            className="mobile-menu-item" 
            onClick={() => {
              navigate('contact');
              onClose();
            }}
          >
            <span className="mobile-menu-icon"><Headphones size={20} /></span>
            <span className="mobile-menu-label">CONTACT</span>
            <ArrowRight size={16} className="mobile-menu-arrow" />
          </button>

          {/* 7. ADMIN PANEL */}
          {isAdmin && (
            <button type="button" 
              className="mobile-menu-item" 
              onClick={() => {
                window.open('/admin', '_blank');
                onClose();
              }}
              style={{ borderLeft: '3px solid var(--gold-mid)' }}
            >
              <span className="mobile-menu-icon"><Shield size={20} style={{ color: 'var(--gold-mid)' }} /></span>
              <span className="mobile-menu-label" style={{ color: 'var(--gold-dark)', fontWeight: '700' }}>ADMIN PANEL</span>
              <ArrowRight size={16} className="mobile-menu-arrow" />
            </button>
          )}
        </nav>

        <div className="mobile-menu-bottom-section">
          <div className="mobile-menu-divider" />
          <DemoToggle user={user} isMobile={true} />
          
          {/* My Account Dropdown */}
          <div className={`mobile-account-dropdown ${accountOpen ? 'is-open' : ''}`}>
            <button type="button" 
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
                  <button type="button" key={idx} className="mobile-account-subitem" onClick={item.action}>
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

          {/* Select Currency Dropdown */}
          <div className={`mobile-currency-dropdown ${currencyOpen ? 'is-open' : ''}`}>
            <button type="button" 
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
                    <button type="button" 
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

          {/* Footer Contact Info */}
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
