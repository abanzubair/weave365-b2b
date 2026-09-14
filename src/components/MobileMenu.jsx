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
  Info,
  Shield,
} from './icons.jsx';

import { storeConfig, getCategorySlug } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';
import { DemoToggle } from '../utils/demoHelper.js';
import { AppLink } from './AppLink.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';

const pluralizeCategory = (cat) => {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  if (lower === 'all') return cat;
  if (lower === 'under 999') return cat;
  if (lower === 'saree') return 'Sarees';
  if (lower === 'suit') return 'Suits';
  if (lower === 'lehenga') return 'Lehengas';
  if (lower === 'dupatta') return 'Dupattas';
  if (lower.endsWith('s')) return cat;
  return cat + 's';
};

const defaultCategoryNames = ['All', 'Saree', 'Suit', 'Dupatta', 'Lehenga', 'Under 999'];

import { useStorefront } from '../store/useStorefront.js';

export function MobileMenu(props) {
  const store = useStorefront();

  const onClose = props.onClose || (() => store.setMenuOpen(false));
  const navigate = props.navigate;
  const setCategory = props.setCategory;
  const user = props.user ?? store.user;
  const rawCategories = (props.categories && props.categories.length > 0)
    ? props.categories
    : (store.configOptions?.categories?.length > 0
      ? ['All', ...store.configOptions.categories]
      : defaultCategoryNames);
  const categories = rawCategories.filter(
    (cat) => cat && cat.toLowerCase().trim() !== 'fabric' && cat.toLowerCase().trim() !== 'fabrics'
  );
  const openAuth = props.openAuth || (() => {
    if (navigate) navigate('signup');
  });
  const setCartOpen = props.setCartOpen || store.setCartOpen;
  const cartCount = props.cartCount ?? store.cart.length;
  const favoritesCount = props.favoritesCount ?? store.favorites.length;
  const onSignOut = props.onSignOut;
  const vendorOnboarding = props.vendorOnboarding ?? store.vendorOnboarding;
  const isAdmin = props.isAdmin;
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const wholesaleOpen = openSection === 'wholesale';
  const resellOpen = openSection === 'resell';
  const customWovenOpen = openSection === 'custom-woven';
  const collectionsOpen = openSection === 'collections';
  const companyOpen = openSection === 'company';
  const accountOpen = openSection === 'account';

  const whatsappPhone = String(storeConfig.whatsapp || storeConfig.phone || '9919101369').replace(/\D/g, '');
  const fullPhone = whatsappPhone.length === 10 ? `91${whatsappPhone}` : whatsappPhone;
  const wholesaleWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to talk to the Wholesale Team regarding bulk sourcing.')}`;
  const resellWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to talk to Reseller Support regarding selling without inventory.')}`;

  const accountItems = [
    ...(isAdmin ? [
      {
        icon: <Shield size={18} style={{ color: 'var(--gold-mid)' }} />,
        label: 'Admin Panel',
        action: () => {
          window.open('/admin', '_blank');
          onClose();
        }
      }
    ] : []),
    { 
      icon: <ShoppingBag size={18} />, 
      label: 'My Cart', 
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
      { icon: <User size={18} />, label: 'Login / Register', action: () => { navigate('signup'); onClose(); } },
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
          {/* 1. WHOLESALE */}
          <div className={`mobile-account-dropdown ${wholesaleOpen ? 'is-open' : ''}`}>
            <button type="button" 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => toggleSection('wholesale')}
            >
              <span className="mobile-menu-icon"><Briefcase size={20} /></span>
              <span className="mobile-menu-label">WHOLESALE</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${wholesaleOpen ? 'rotated' : ''}`} />
            </button>
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                <AppLink to="sarees" href="/sarees" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Wholesale Banarasi Sarees</span>
                </AppLink>
                <AppLink to="suits" href="/suits" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Wholesale Banarasi Suits</span>
                </AppLink>
                <AppLink to="catalogue" href="/catalogue" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Wholesale Catalog</span>
                </AppLink>
                <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Bulk Enquiry &amp; MOQ</span>
                </AppLink>
                <AppLink to="sourcing-partners" href="/sourcing-partners" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Retailer / Boutique Sourcing</span>
                </AppLink>
                <a
                  href={wholesaleWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-contextual-action"
                  onClick={onClose}
                >
                  <WhatsappIcon size={16} />
                  <span>Talk to Wholesale Team</span>
                </a>
              </div>
            </div>
          </div>

          {/* 2. RESELL */}
          <div className={`mobile-account-dropdown ${resellOpen ? 'is-open' : ''}`}>
            <button type="button" 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => toggleSection('resell')}
            >
              <span className="mobile-menu-icon"><Store size={20} /></span>
              <span className="mobile-menu-label">RESELL</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${resellOpen ? 'rotated' : ''}`} />
            </button>
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                <span className="mobile-tagline">Sell Without Inventory</span>
                <AppLink to="resell-sarees-online" href="/resell-sarees-online" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Sell Without Inventory</span>
                </AppLink>
                <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Dropshipping</span>
                </AppLink>
                <AppLink to="white-label" href="/white-label" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>White-Label Fulfilment</span>
                </AppLink>
                <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>How Reselling Works</span>
                </AppLink>
                <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Reseller FAQs</span>
                </AppLink>
                <a
                  href={resellWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-contextual-action"
                  onClick={onClose}
                >
                  <WhatsappIcon size={16} />
                  <span>Talk to Reseller Support</span>
                </a>
              </div>
            </div>
          </div>

          {/* 3. CUSTOM WOVEN */}
          <div className={`mobile-account-dropdown ${customWovenOpen ? 'is-open' : ''}`}>
            <button type="button" 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => toggleSection('custom-woven')}
            >
              <span className="mobile-menu-icon"><Sparkles size={20} /></span>
              <span className="mobile-menu-label">CUSTOM WOVEN</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${customWovenOpen ? 'rotated' : ''}`} />
            </button>
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                <AppLink to="custom-woven" href="/custom-woven" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Custom Woven Sarees</span>
                </AppLink>
                <AppLink to="white-label" href="/white-label" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Private Label Manufacturing</span>
                </AppLink>
                <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Custom / Bulk Requirement</span>
                </AppLink>
                <AppLink 
                  to="custom-woven#weaving-techniques" 
                  href="/custom-woven#weaving-techniques"
                  navigate={navigate} 
                  className="mobile-account-subitem" 
                  onClick={(e) => {
                    onClose(e);
                    const el = document.getElementById('weaving-techniques');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Weaving Techniques</span>
                </AppLink>
                <AppLink to="handloom-vs-powerloom-guide" href="/handloom-vs-powerloom-guide" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Handloom vs Powerloom Guide</span>
                </AppLink>
                <AppLink
                  to="custom-woven#inquiry-form"
                  href="/custom-woven#inquiry-form"
                  navigate={navigate}
                  className="mobile-contextual-action"
                  onClick={(e) => {
                    onClose(e);
                    const el = document.getElementById('inquiry-form');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <WhatsappIcon size={16} />
                  <span>Discuss Your Requirement</span>
                </AppLink>
              </div>
            </div>
          </div>

          {/* 4. COLLECTIONS */}
          <div className={`mobile-account-dropdown ${collectionsOpen ? 'is-open' : ''}`}>
            <button type="button" 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => toggleSection('collections')}
            >
              <span className="mobile-menu-icon"><Layers size={20} /></span>
              <span className="mobile-menu-label">COLLECTIONS</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${collectionsOpen ? 'rotated' : ''}`} />
            </button>
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                <AppLink
                  to="catalogue"
                  href="/catalogue"
                  className="mobile-account-subitem"
                  navigate={navigate}
                  onClick={onClose}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>All Collections</span>
                </AppLink>
                <AppLink
                  to="new-arrivals"
                  href="/new-arrivals"
                  className="mobile-account-subitem"
                  navigate={navigate}
                  onClick={onClose}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>New Arrivals</span>
                </AppLink>
                <AppLink
                  to="sarees"
                  href="/sarees"
                  className="mobile-account-subitem"
                  navigate={navigate}
                  onClick={() => {
                    if (setCategory) setCategory('Saree');
                    onClose();
                  }}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Sarees</span>
                </AppLink>
                <AppLink
                  to="suits"
                  href="/suits"
                  className="mobile-account-subitem"
                  navigate={navigate}
                  onClick={() => {
                    if (setCategory) setCategory('Suit');
                    onClose();
                  }}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Suits</span>
                </AppLink>
                <AppLink
                  to="lehengas"
                  href="/lehengas"
                  className="mobile-account-subitem"
                  navigate={navigate}
                  onClick={() => {
                    if (setCategory) setCategory('Lehenga');
                    onClose();
                  }}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Lehengas</span>
                </AppLink>
                <AppLink
                  to="dupattas"
                  href="/dupattas"
                  className="mobile-account-subitem"
                  navigate={navigate}
                  onClick={() => {
                    if (setCategory) setCategory('Dupatta');
                    onClose();
                  }}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Dupattas</span>
                </AppLink>
                <AppLink
                  to="under-999"
                  href="/under-999"
                  className="mobile-account-subitem"
                  navigate={navigate}
                  onClick={() => {
                    if (setCategory) setCategory('Under 999');
                    onClose();
                  }}
                >
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Under ₹999</span>
                </AppLink>
              </div>
            </div>
          </div>

          {/* 5. COMPANY */}
          <div className={`mobile-account-dropdown ${companyOpen ? 'is-open' : ''}`}>
            <button type="button" 
              className="mobile-menu-item mobile-menu-account-trigger" 
              onClick={() => toggleSection('company')}
            >
              <span className="mobile-menu-icon"><Info size={20} /></span>
              <span className="mobile-menu-label">COMPANY</span>
              <ChevronDown size={18} className={`mobile-menu-chevron ${companyOpen ? 'rotated' : ''}`} />
            </button>
            <div className="mobile-account-items">
              <div className="mobile-account-items-inner">
                <AppLink to="about" href="/about" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>About Weave 365</span>
                </AppLink>
                <AppLink to="collaboration" href="/collaboration" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Our Banaras Network</span>
                </AppLink>
                <AppLink to="contact" href="/contact" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Contact Us</span>
                </AppLink>
                <AppLink to="shipping-delivery" href="/shipping-delivery" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Shipping &amp; Delivery</span>
                </AppLink>
                <AppLink to="returns-cancellation" href="/returns-cancellation" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Returns &amp; Cancellation</span>
                </AppLink>
                <AppLink to="payment-policy" href="/payment-policy" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Payment Policy</span>
                </AppLink>
                <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
                  <span className="subitem-label" style={{ paddingLeft: '8px' }}>Reseller FAQs</span>
                </AppLink>
              </div>
            </div>
          </div>

          {/* Admin Panel */}
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
              onClick={() => toggleSection('account')}
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
