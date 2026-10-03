/**
 * MobileMenu Component
 * Purpose: Full-screen slide-over drawer navigation for mobile devices.
 * Uses a high-performance, 100% GPU-composited horizontal drill-down slide architecture.
 * Locked 60/120 FPS performance with zero layout thrashing or CPU reflow.
 */
import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Phone,
  Layers,
  Sparkles,
  Store,
  User,
  Mail,
  Bookmark,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Briefcase,
  Info,
  Shield,
} from './icons.jsx';

import { storeConfig } from '../config.js';
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
      { icon: <LogOut size={18} />, label: 'Logout', action: () => { onSignOut?.(); onClose(); } },
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
            <AppLink to="sarees" href="/sarees" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Wholesale Banarasi Sarees</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="suits" href="/suits" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Wholesale Banarasi Suits</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="catalogue" href="/catalogue" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Wholesale Catalog</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Bulk Enquiry &amp; MOQ</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="sourcing-partners" href="/sourcing-partners" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Retailer / Boutique Sourcing</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <a href={wholesaleWaLink} target="_blank" rel="noopener noreferrer" className="mobile-subpanel-wa" onClick={onClose}>
              <WhatsappIcon size={16} />
              <span>Talk to Wholesale Team</span>
            </a>
          </>
        );

      case 'resell':
        return (
          <>
            <AppLink to="resell-sarees-online" href="/resell-sarees-online" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Sell Without Inventory</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Dropshipping Program</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="white-label" href="/white-label" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>White-Label Fulfilment</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>How Reselling Works</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Reseller FAQs</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <a href={resellWaLink} target="_blank" rel="noopener noreferrer" className="mobile-subpanel-wa" onClick={onClose}>
              <WhatsappIcon size={16} />
              <span>Talk to Reseller Support</span>
            </a>
          </>
        );

      case 'custom-weaving':
        return (
          <>
            <AppLink to="custom-weaving" href="/custom-weaving" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Custom Weaving Sarees</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="white-label" href="/white-label" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Private Label Manufacturing</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Custom / Bulk Requirement</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink 
              to="custom-weaving#weaving-techniques" 
              href="/custom-weaving#weaving-techniques"
              navigate={navigate} 
              className="mobile-subpanel-link" 
              onClick={(e) => {
                onClose(e);
                const el = document.getElementById('weaving-techniques');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span>Weaving Techniques</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="handloom-vs-powerloom-guide" href="/handloom-vs-powerloom-guide" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Handloom vs Powerloom Guide</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <a href={customWovenWaLink} target="_blank" rel="noopener noreferrer" className="mobile-subpanel-wa" onClick={onClose}>
              <WhatsappIcon size={16} />
              <span>Discuss Your Requirement</span>
            </a>
          </>
        );

      case 'collections':
        return (
          <>
            <AppLink to="catalogue" href="/catalogue" className="mobile-subpanel-link" navigate={navigate} onClick={onClose}>
              <span>All Collections</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="new-arrivals" href="/new-arrivals" className="mobile-subpanel-link" navigate={navigate} onClick={onClose}>
              <span>New Arrivals</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="sarees" href="/sarees" className="mobile-subpanel-link" navigate={navigate} onClick={() => { if (setCategory) setCategory('Saree'); onClose(); }}>
              <span>Banarasi Sarees</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="suits" href="/suits" className="mobile-subpanel-link" navigate={navigate} onClick={() => { if (setCategory) setCategory('Suit'); onClose(); }}>
              <span>Banarasi Suits</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="lehengas" href="/lehengas" className="mobile-subpanel-link" navigate={navigate} onClick={() => { if (setCategory) setCategory('Lehenga'); onClose(); }}>
              <span>Banarasi Lehengas</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="dupattas" href="/dupattas" className="mobile-subpanel-link" navigate={navigate} onClick={() => { if (setCategory) setCategory('Dupatta'); onClose(); }}>
              <span>Statement Dupattas</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="under-999" href="/under-999" className="mobile-subpanel-link" navigate={navigate} onClick={() => { if (setCategory) setCategory('Under 999'); onClose(); }}>
              <span>Under ₹999</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
          </>
        );

      case 'company':
        return (
          <>
            <AppLink to="about" href="/about" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>About Weave 365</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="collaboration" href="/collaboration" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Our Banaras Network</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="contact" href="/contact" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Contact Us</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="shipping-delivery" href="/shipping-delivery" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Shipping &amp; Delivery</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="returns-cancellation" href="/returns-cancellation" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Returns &amp; Cancellation</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="payment-policy" href="/payment-policy" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Payment Policy</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
            <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} className="mobile-subpanel-link" onClick={onClose}>
              <span>Reseller FAQs</span>
              <ChevronRight size={16} className="mobile-subpanel-arrow" />
            </AppLink>
          </>
        );

      case 'account':
        return (
          <>
            {accountItems.map((item, idx) => (
              <button type="button" key={idx} className="mobile-subpanel-link" onClick={item.action}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--gold-dark)', display: 'grid', placeItems: 'center', width: '22px', height: '22px', flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  {item.badge > 0 && <span className="mobile-menu-badge mini">{item.badge}</span>}
                  <ChevronRight size={16} className="mobile-subpanel-arrow" />
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
        {/* 100% GPU-Composited Drill-Down Panels Slider */}
        <div className="mobile-panels-viewport">
          <div className={`mobile-panels-track ${activeSubpanel ? 'is-subpanel' : ''}`}>
            
            {/* PANEL 1: Root Menu */}
            <div className="mobile-panel mobile-panel-root" aria-hidden={activeSubpanel !== null}>
              <nav className="mobile-menu-nav">
                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('wholesale')}>
                  <span className="mobile-menu-icon"><Briefcase size={18} /></span>
                  <span className="mobile-menu-label">WHOLESALE</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('resell')}>
                  <span className="mobile-menu-icon"><Store size={18} /></span>
                  <span className="mobile-menu-label">RESELL</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('custom-weaving')}>
                  <span className="mobile-menu-icon"><Sparkles size={18} /></span>
                  <span className="mobile-menu-label">CUSTOM WEAVING</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('collections')}>
                  <span className="mobile-menu-icon"><Layers size={18} /></span>
                  <span className="mobile-menu-label">COLLECTIONS</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('company')}>
                  <span className="mobile-menu-icon"><Info size={18} /></span>
                  <span className="mobile-menu-label">COMPANY</span>
                  <ChevronRight size={18} className="mobile-menu-arrow" />
                </button>

                {isAdmin && (
                  <button 
                    type="button" 
                    className="mobile-menu-item" 
                    onClick={() => {
                      window.open('/admin', '_blank');
                      onClose();
                    }}
                    style={{ borderLeft: '3px solid var(--gold-mid)' }}
                  >
                    <span className="mobile-menu-icon"><Shield size={18} style={{ color: 'var(--gold-mid)' }} /></span>
                    <span className="mobile-menu-label" style={{ color: 'var(--gold-dark)', fontWeight: '700' }}>ADMIN PANEL</span>
                    <ArrowRight size={16} className="mobile-menu-arrow" />
                  </button>
                )}
              </nav>

              <div className="mobile-menu-bottom-section">
                <CountrySelector variant="mobile" onClose={onClose} />
                <DemoToggle user={user} isMobile={true} />

                <button type="button" className="mobile-menu-item" onClick={() => setActiveSubpanel('account')}>
                  <span className="mobile-menu-icon"><User size={18} /></span>
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
                    <Phone size={15} />
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
                    <Mail size={15} />
                    <span>{storeConfig.email || 'support@weave365.com'}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* PANEL 2: Sub-Panel (Slides in with GPU transform) */}
            <div className="mobile-panel mobile-panel-sub" aria-hidden={activeSubpanel === null}>
              <div className="mobile-subpanel-head">
                <button 
                  type="button" 
                  className="mobile-subpanel-back" 
                  onClick={() => setActiveSubpanel(null)}
                  aria-label="Back to main menu"
                >
                  <ChevronLeft size={16} />
                  <span>Back</span>
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
