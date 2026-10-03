/**
 * MobileMenu Component
 * Purpose: Full-screen slide-over drawer navigation for mobile devices.
 * Uses a high-performance, 100% GPU-composited horizontal drill-down slide architecture.
 * Locked 60/120 FPS performance with zero layout thrashing or CPU reflow.
 */
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Headphones,
  Layers,
  Sparkles,
  Store,
  User,
  MessageCircle,
  Bookmark,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Info,
  Shield,
} from './icons.jsx';

import { storeConfig } from '../config.js';
import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';
import { DemoToggle } from '../utils/demoHelper.js';
import { AppLink } from './AppLink.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { CountrySelector } from './CountrySelector.jsx';
import { useStorefront } from '../store/useStorefront.js';

export function MobileMenu(props) {
  const store = useStorefront();

  const isClosing = props.isClosing || false;
  const onClose = props.onClose || (() => store.setMenuOpen(false));
  const navigate = props.navigate;
  const setCategory = props.setCategory;
  const user = props.user ?? store.user;
  const setCartOpen = props.setCartOpen || store.setCartOpen;
  const cartCount = props.cartCount ?? store.cart.length;
  const favoritesCount = props.favoritesCount ?? store.favorites.length;
  const onSignOut = props.onSignOut;
  const vendorOnboarding = props.vendorOnboarding ?? store.vendorOnboarding;
  const isAdmin = props.isAdmin;

  // Active subpanel: null (root) | 'wholesale' | 'resell' | 'custom-weaving' | 'collections' | 'company' | 'account'
  const [activeSubpanel, setActiveSubpanel] = useState(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Reset to root panel when menu closes
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => setActiveSubpanel(null), 280);
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

  const whatsappPhone = String(storeConfig.whatsapp || storeConfig.phone || '9919101369').replace(/\D/g, '');
  const fullPhone = whatsappPhone.length === 10 ? `91${whatsappPhone}` : whatsappPhone;
  const wholesaleWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to talk to the Wholesale Team regarding bulk sourcing.')}`;
  const resellWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to talk to Reseller Support regarding selling without inventory.')}`;
  const customWovenWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to discuss a custom woven / private label saree requirement.')}`;

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

  const subpanelTitles = {
    wholesale: 'Wholesale',
    resell: 'Resell',
    'custom-weaving': 'Custom Weaving',
    collections: 'Collections',
    company: 'Company',
    account: 'My Account',
  };

  const renderSubpanelContent = () => {
    switch (activeSubpanel) {
      case 'wholesale':
        return (
          <>
            <AppLink to="sarees" href="/sarees" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Wholesale Banarasi Sarees</span>
            </AppLink>
            <AppLink to="suits" href="/suits" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Wholesale Banarasi Suits</span>
            </AppLink>
            <AppLink to="catalogue" href="/catalogue" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Wholesale Catalog</span>
            </AppLink>
            <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Bulk Enquiry &amp; MOQ</span>
            </AppLink>
            <AppLink to="sourcing-partners" href="/sourcing-partners" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Retailer / Boutique Sourcing</span>
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
          </>
        );

      case 'resell':
        return (
          <>
            <span className="mobile-tagline">Sell Without Inventory</span>
            <AppLink to="resell-sarees-online" href="/resell-sarees-online" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Sell Without Inventory</span>
            </AppLink>
            <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Dropshipping</span>
            </AppLink>
            <AppLink to="white-label" href="/white-label" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">White-Label Fulfilment</span>
            </AppLink>
            <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">How Reselling Works</span>
            </AppLink>
            <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Reseller FAQs</span>
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
          </>
        );

      case 'custom-weaving':
        return (
          <>
            <AppLink to="custom-weaving" href="/custom-weaving" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Custom Weaving Sarees</span>
            </AppLink>
            <AppLink to="white-label" href="/white-label" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Private Label Manufacturing</span>
            </AppLink>
            <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Custom / Bulk Requirement</span>
            </AppLink>
            <AppLink 
              to="custom-weaving#weaving-techniques" 
              href="/custom-weaving#weaving-techniques"
              navigate={navigate} 
              className="mobile-account-subitem" 
              onClick={(e) => {
                onClose(e);
                const el = document.getElementById('weaving-techniques');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span className="subitem-label">Weaving Techniques</span>
            </AppLink>
            <AppLink to="handloom-vs-powerloom-guide" href="/handloom-vs-powerloom-guide" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Handloom vs Powerloom Guide</span>
            </AppLink>
            <a
              href={customWovenWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-contextual-action"
              onClick={onClose}
            >
              <WhatsappIcon size={16} />
              <span>Discuss Your Requirement</span>
            </a>
          </>
        );

      case 'collections':
        return (
          <>
            <AppLink to="catalogue" href="/catalogue" className="mobile-account-subitem" navigate={navigate} onClick={onClose}>
              <span className="subitem-label">All Collections</span>
            </AppLink>
            <AppLink to="new-arrivals" href="/new-arrivals" className="mobile-account-subitem" navigate={navigate} onClick={onClose}>
              <span className="subitem-label">New Arrivals</span>
            </AppLink>
            <AppLink to="sarees" href="/sarees" className="mobile-account-subitem" navigate={navigate} onClick={() => { if (setCategory) setCategory('Saree'); onClose(); }}>
              <span className="subitem-label">Sarees</span>
            </AppLink>
            <AppLink to="suits" href="/suits" className="mobile-account-subitem" navigate={navigate} onClick={() => { if (setCategory) setCategory('Suit'); onClose(); }}>
              <span className="subitem-label">Suits</span>
            </AppLink>
            <AppLink to="lehengas" href="/lehengas" className="mobile-account-subitem" navigate={navigate} onClick={() => { if (setCategory) setCategory('Lehenga'); onClose(); }}>
              <span className="subitem-label">Lehengas</span>
            </AppLink>
            <AppLink to="dupattas" href="/dupattas" className="mobile-account-subitem" navigate={navigate} onClick={() => { if (setCategory) setCategory('Dupatta'); onClose(); }}>
              <span className="subitem-label">Dupattas</span>
            </AppLink>
            <AppLink to="under-999" href="/under-999" className="mobile-account-subitem" navigate={navigate} onClick={() => { if (setCategory) setCategory('Under 999'); onClose(); }}>
              <span className="subitem-label">Under ₹999</span>
            </AppLink>
          </>
        );

      case 'company':
        return (
          <>
            <AppLink to="about" href="/about" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">About Weave 365</span>
            </AppLink>
            <AppLink to="collaboration" href="/collaboration" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Our Banaras Network</span>
            </AppLink>
            <AppLink to="contact" href="/contact" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Contact Us</span>
            </AppLink>
            <AppLink to="shipping-delivery" href="/shipping-delivery" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Shipping &amp; Delivery</span>
            </AppLink>
            <AppLink to="returns-cancellation" href="/returns-cancellation" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Returns &amp; Cancellation</span>
            </AppLink>
            <AppLink to="payment-policy" href="/payment-policy" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Payment Policy</span>
            </AppLink>
            <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} className="mobile-account-subitem" onClick={onClose}>
              <span className="subitem-label">Reseller FAQs</span>
            </AppLink>
          </>
        );

      case 'account':
        return (
          <>
            {accountItems.map((item, idx) => (
              <button type="button" key={idx} className="mobile-account-subitem" onClick={item.action}>
                <span className="subitem-icon">{item.icon}</span>
                <span className="subitem-label">
                  {item.label}
                  {item.badge > 0 && <span className="mobile-menu-badge mini">{item.badge}</span>}
                </span>
              </button>
            ))}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className={`mobile-menu-backdrop ${isClosing ? 'is-closing' : ''}`} onClick={onClose} />
      <aside className={`mobile-menu ${isClosing ? 'is-closing' : ''}`}>
        {/* Sticky Header: Locked 64px, brand logo strictly on left, close button strictly on right */}
        <div className="mobile-menu-head">
          <a
            href="/"
            className="brand mobile-menu-brand"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onClose();
                if (navigate) navigate('home');
              }
            }}
          >
            <img src={assetSrc(brandLogo)} alt={storeConfig.name} className="brand-logo" width={151} height={28} />
          </a>
          <button 
            type="button" 
            className={`hamburger-btn mobile-menu-close-btn ${isClosing ? 'is-closing' : 'is-active'}`} 
            onClick={onClose} 
            aria-label="Close menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="hamburger-svg">
              <rect className="line line-top" x="4" y="6" width="16" height="1.5" rx="0.75" fill="currentColor" />
              <rect className="line line-middle" x="4" y="11" width="16" height="1.5" rx="0.75" fill="currentColor" />
              <rect className="line line-bottom" x="4" y="16" width="16" height="1.5" rx="0.75" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* 100% GPU-Composited Drill-Down Panels Slider */}
        <div className="mobile-panels-viewport">
          <div className={`mobile-panels-track ${activeSubpanel ? 'is-subpanel' : ''}`}>
            
            {/* PANEL 1: Root Menu */}
            <div className="mobile-panel mobile-panel-root">
              <nav className="mobile-menu-nav">
                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('wholesale')}>
                  <span className="mobile-menu-icon"><Briefcase size={20} /></span>
                  <span className="mobile-menu-label">WHOLESALE</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('resell')}>
                  <span className="mobile-menu-icon"><Store size={20} /></span>
                  <span className="mobile-menu-label">RESELL</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('custom-weaving')}>
                  <span className="mobile-menu-icon"><Sparkles size={20} /></span>
                  <span className="mobile-menu-label">CUSTOM WEAVING</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('collections')}>
                  <span className="mobile-menu-icon"><Layers size={20} /></span>
                  <span className="mobile-menu-label">COLLECTIONS</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('company')}>
                  <span className="mobile-menu-icon"><Info size={20} /></span>
                  <span className="mobile-menu-label">COMPANY</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

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
                <CountrySelector variant="mobile" onClose={onClose} />
                <DemoToggle user={user} isMobile={true} />

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('account')}>
                  <span className="mobile-menu-icon"><User size={20} /></span>
                  <span className="mobile-menu-label">
                    <span>My Account</span>
                    {favoritesCount + cartCount > 0 && (
                      <span className="mobile-menu-badge mini">{favoritesCount + cartCount}</span>
                    )}
                  </span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

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
                  <a href={`mailto:${storeConfig.email || 'support@weave365.com'}`}>
                    <MessageCircle size={16} />
                    <span>{storeConfig.email || 'support@weave365.com'}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* PANEL 2: Sub-Panel (Slides in with GPU transform) */}
            <div className="mobile-panel mobile-panel-sub">
              <div className="mobile-subpanel-head">
                <button 
                  type="button" 
                  className="mobile-subpanel-back" 
                  onClick={() => setActiveSubpanel(null)}
                  aria-label="Back to main menu"
                >
                  <ChevronLeft size={18} />
                  <span>Main Menu</span>
                </button>
                <span className="mobile-subpanel-title">{subpanelTitles[activeSubpanel] || ''}</span>
              </div>

              <div className="mobile-subpanel-content">
                {renderSubpanelContent()}
              </div>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}
