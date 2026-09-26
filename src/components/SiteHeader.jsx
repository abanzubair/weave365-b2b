import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Search, User } from './icons.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { DropdownPortal } from './DropdownPortal.jsx';
import { AppLink } from './AppLink.jsx';
import { CountrySelector } from './CountrySelector.jsx';
import { storeConfig, getCategorySlug, adminEmails } from '../config.js';
import { useStorefront } from '../store/useStorefront.js';

import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';

const defaultCategoryNames = ['All', 'Saree', 'Suit', 'Dupatta', 'Lehenga', 'Under 999'];

export const pluralizeCategory = (cat) => {
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

export function SiteHeader(props) {
  const store = useStorefront();

  const internalWholesaleRef = useRef(null);
  const internalResellRef = useRef(null);
  const internalCustomWovenRef = useRef(null);
  const internalCategoriesRef = useRef(null);
  const internalCompanyRef = useRef(null);
  const internalProfileRef = useRef(null);

  const [internalScrolled, setInternalScrolled] = useState(false);
  const [internalPastHero, setInternalPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop;
      const isScrolled = scrollPos > 20;
      const isPastHero = scrollPos > 400;
      setInternalScrolled(isScrolled);
      setInternalPastHero(isPastHero);
      if (store.setScrolled && store.scrolled !== isScrolled) {
        store.setScrolled(isScrolled);
      }
      if (store.setPastHero && store.pastHero !== isPastHero) {
        store.setPastHero(isPastHero);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [store]);

  const dropdownOpen = props.dropdownOpen ?? store.dropdownOpen;
  const setDropdownOpen = props.setDropdownOpen ?? store.setDropdownOpen;

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e) => {
      if (!e.target.closest('.nav-item-dropdown')) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen, setDropdownOpen]);

  const route = props.route;
  const scrolled = props.scrolled !== undefined ? props.scrolled : (store.scrolled || internalScrolled);
  const pastHero = props.pastHero !== undefined ? props.pastHero : (store.pastHero || internalPastHero);
  const menuOpen = props.menuOpen ?? store.menuOpen;
  const setMenuOpen = props.setMenuOpen ?? store.setMenuOpen;
  const brandLogoSrc = props.brandLogoSrc || assetSrc(brandLogo);
  const navigate = props.navigate;
  const wholesaleRef = props.wholesaleRef || internalWholesaleRef;
  const resellRef = props.resellRef || internalResellRef;
  const customWovenRef = props.customWovenRef || internalCustomWovenRef;
  const categoriesRef = props.categoriesRef || internalCategoriesRef;
  const companyRef = props.companyRef || internalCompanyRef;

  const setCategory = props.setCategory;
  const searchActive = props.searchActive ?? store.searchActive;
  const setSearchActive = props.setSearchActive ?? store.setSearchActive;
  const profileRef = props.profileRef || internalProfileRef;
  const user = props.user ?? store.user;
  const buyerProfile = props.buyerProfile ?? store.buyerProfile;
  const userDisplayName = user
    ? (() => {
        const rawName = buyerProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || buyerProfile?.business_name || user.email?.split('@')[0] || 'Account';
        return rawName.trim().split(/\s+/)[0] || 'Account';
      })()
    : 'Log In';
  const vendorOnboarding = props.vendorOnboarding ?? store.vendorOnboarding;
  const userEmail = (user?.email || '').toLowerCase().trim();
  const isAdmin = props.isAdmin ?? Boolean(userEmail && adminEmails.includes(userEmail));
  const favoritesCount = props.favoritesCount ?? store.favorites.length;
  const handleSignOut = props.handleSignOut;
  const setCartOpen = props.setCartOpen ?? store.setCartOpen;
  const cartProducts = props.cartProducts || [];

  const whatsappPhone = String(storeConfig.whatsapp || storeConfig.phone || '9919101369').replace(/\D/g, '');
  const fullPhone = whatsappPhone.length === 10 ? `91${whatsappPhone}` : whatsappPhone;
  const wholesaleWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to talk to the Wholesale Team regarding bulk sourcing.')}`;
  const resellWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to talk to Reseller Support regarding selling without inventory.')}`;
  const customWovenWaLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hi Weave 365, I would like to discuss a custom woven / private label saree requirement.')}`;

  const isWholesaleActive = ['catalogue', 'wholesale-catalogue', 'sarees', 'suits', 'bulk-inquiry', 'sourcing-partners', 'wholesale-banarasi-sarees'].includes(route);
  const isResellActive = ['resell-sarees-online', 'dropshipping', 'white-label', 'reseller-faqs', 'affiliate-program', 'reseller-dashboard'].includes(route);
  const isCustomWovenActive = ['custom-woven', 'handloom-vs-powerloom-guide'].includes(route);
  const isCollectionsActive = ['new-arrivals', 'lehengas', 'dupattas', 'under-999'].includes(route);
  const isCompanyActive = ['about', 'contact', 'shipping-delivery', 'returns-cancellation', 'payment-policy', 'collaboration', 'sell-banarasi-sarees'].includes(route);

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''} ${pastHero ? 'past-hero' : ''}`}>
      <a
        href="/"
        className="brand"
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
            e.preventDefault();
            if (navigate) navigate('home');
          }
        }}
      >
        <img src={brandLogoSrc} alt={storeConfig.name} className="brand-logo" width={151} height={28} />
      </a>
      <nav className="main-nav">
        {/* 1. WHOLESALE */}
        <div className="nav-item-dropdown" ref={wholesaleRef}>
          <button
            type="button"
            className={dropdownOpen === 'wholesale' || isWholesaleActive ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'wholesale' ? null : 'wholesale');
            }}
          >
            WHOLESALE <ChevronDown size={14} className={dropdownOpen === 'wholesale' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={wholesaleRef} isOpen={dropdownOpen === 'wholesale'} className="dropdown-menu nav-standard-dropdown">
            <AppLink to="sarees" href="/sarees" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Wholesale Banarasi Sarees
            </AppLink>
            <AppLink to="suits" href="/suits" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Wholesale Banarasi Suits
            </AppLink>
            <AppLink to="catalogue" href="/catalogue" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Wholesale Catalog
            </AppLink>
            <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Bulk Enquiry &amp; MOQ
            </AppLink>
            <AppLink to="sourcing-partners" href="/sourcing-partners" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Retailer / Boutique Sourcing
            </AppLink>
            <div className="nav-dropdown-divider" />
            <a
              href={wholesaleWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-contextual-action"
              onClick={() => setDropdownOpen(null)}
            >
              <WhatsappIcon size={14} />
              <span>Talk to Wholesale Team</span>
            </a>
          </DropdownPortal>
        </div>

        {/* 2. RESELL */}
        <div className="nav-item-dropdown" ref={resellRef}>
          <button
            type="button"
            className={dropdownOpen === 'resell' || isResellActive ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'resell' ? null : 'resell');
            }}
          >
            RESELL <ChevronDown size={14} className={dropdownOpen === 'resell' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={resellRef} isOpen={dropdownOpen === 'resell'} className="dropdown-menu nav-standard-dropdown">
            <span className="nav-dropdown-tagline">Sell Without Inventory</span>
            <AppLink to="resell-sarees-online" href="/resell-sarees-online" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Sell Without Inventory
            </AppLink>
            <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Dropshipping
            </AppLink>
            <AppLink to="white-label" href="/white-label" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              White-Label Fulfilment
            </AppLink>
            <AppLink to="dropshipping" href="/dropshipping" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              How Reselling Works
            </AppLink>
            <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Reseller FAQs
            </AppLink>
            <div className="nav-dropdown-divider" />
            <a
              href={resellWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-contextual-action"
              onClick={() => setDropdownOpen(null)}
            >
              <WhatsappIcon size={14} />
              <span>Talk to Reseller Support</span>
            </a>
          </DropdownPortal>
        </div>

        {/* 3. CUSTOM WOVEN */}
        <div className="nav-item-dropdown" ref={customWovenRef}>
          <button
            type="button"
            className={dropdownOpen === 'custom-woven' || isCustomWovenActive ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'custom-woven' ? null : 'custom-woven');
            }}
          >
            CUSTOM WOVEN <ChevronDown size={14} className={dropdownOpen === 'custom-woven' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={customWovenRef} isOpen={dropdownOpen === 'custom-woven'} className="dropdown-menu nav-standard-dropdown">
            <AppLink to="custom-woven" href="/custom-woven" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Custom Woven Sarees
            </AppLink>
            <AppLink to="white-label" href="/white-label" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Private Label Manufacturing
            </AppLink>
            <AppLink to="bulk-inquiry" href="/bulk-inquiry" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Custom / Bulk Requirement
            </AppLink>
            <AppLink
              to="custom-woven#weaving-techniques"
              href="/custom-woven#weaving-techniques"
              navigate={navigate}
              onClick={(e) => {
                setDropdownOpen(null);
                const el = document.getElementById('weaving-techniques');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Weaving Techniques
            </AppLink>
            <AppLink to="handloom-vs-powerloom-guide" href="/handloom-vs-powerloom-guide" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Handloom vs Powerloom Guide
            </AppLink>
            <div className="nav-dropdown-divider" />
            <a
              href={customWovenWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-contextual-action"
              onClick={() => setDropdownOpen(null)}
            >
              <WhatsappIcon size={14} />
              <span>Discuss Your Requirement</span>
            </a>
          </DropdownPortal>
        </div>

        {/* 4. COLLECTIONS */}
        <div className="nav-item-dropdown" ref={categoriesRef}>
          <button
            type="button"
            className={dropdownOpen === 'categories' || isCollectionsActive ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'categories' ? null : 'categories');
            }}
          >
            COLLECTIONS <ChevronDown size={14} className={dropdownOpen === 'categories' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={categoriesRef} isOpen={dropdownOpen === 'categories'} className="dropdown-menu nav-standard-dropdown">
            <AppLink
              to="catalogue"
              href="/catalogue"
              navigate={navigate}
              onClick={() => setDropdownOpen(null)}
            >
              All Collections
            </AppLink>
            <AppLink
              to="new-arrivals"
              href="/new-arrivals"
              navigate={navigate}
              onClick={() => setDropdownOpen(null)}
            >
              New Arrivals
            </AppLink>
            <AppLink
              to="sarees"
              href="/sarees"
              navigate={navigate}
              onClick={() => {
                if (setCategory) setCategory('Saree');
                setDropdownOpen(null);
              }}
            >
              Sarees
            </AppLink>
            <AppLink
              to="suits"
              href="/suits"
              navigate={navigate}
              onClick={() => {
                if (setCategory) setCategory('Suit');
                setDropdownOpen(null);
              }}
            >
              Suits
            </AppLink>
            <AppLink
              to="lehengas"
              href="/lehengas"
              navigate={navigate}
              onClick={() => {
                if (setCategory) setCategory('Lehenga');
                setDropdownOpen(null);
              }}
            >
              Lehengas
            </AppLink>
            <AppLink
              to="dupattas"
              href="/dupattas"
              navigate={navigate}
              onClick={() => {
                if (setCategory) setCategory('Dupatta');
                setDropdownOpen(null);
              }}
            >
              Dupattas
            </AppLink>
            <AppLink
              to="under-999"
              href="/under-999"
              navigate={navigate}
              onClick={() => {
                if (setCategory) setCategory('Under 999');
                setDropdownOpen(null);
              }}
            >
              Under ₹999
            </AppLink>
          </DropdownPortal>
        </div>

        {/* 5. COMPANY */}
        <div className="nav-item-dropdown" ref={companyRef}>
          <button
            type="button"
            className={dropdownOpen === 'company' || isCompanyActive ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'company' ? null : 'company');
            }}
          >
            COMPANY <ChevronDown size={14} className={dropdownOpen === 'company' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={companyRef} isOpen={dropdownOpen === 'company'} className="dropdown-menu nav-standard-dropdown">
            <AppLink to="about" href="/about" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              About Weave 365
            </AppLink>
            <AppLink to="collaboration" href="/collaboration" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Our Banaras Network
            </AppLink>
            <AppLink to="contact" href="/contact" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Contact Us
            </AppLink>
            <AppLink to="shipping-delivery" href="/shipping-delivery" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Shipping &amp; Delivery
            </AppLink>
            <AppLink to="returns-cancellation" href="/returns-cancellation" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Returns &amp; Cancellation
            </AppLink>
            <AppLink to="payment-policy" href="/payment-policy" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Payment Policy
            </AppLink>
            <AppLink to="reseller-faqs" href="/reseller-faqs" navigate={navigate} onClick={() => setDropdownOpen(null)}>
              Reseller FAQs
            </AppLink>
          </DropdownPortal>
        </div>
      </nav>

      <button className="icon-button mobile-search-button" type="button" onClick={() => setSearchActive(true)} aria-label="Search">
        <Search size={20} />
      </button>

      <div className="header-actions-premium">
        <button 
          className={`premium-search-trigger ${searchActive ? 'active' : ''}`}
          type="button" 
          onClick={() => setSearchActive(!searchActive)}
          aria-label="Search"
        >
          <Search size={19} strokeWidth={1.75} />
        </button>

        {/* 1. Log In / User Name Dropdown Button */}
        <div className="nav-item-dropdown account-dropdown-container" ref={profileRef}>
          {/* Desktop Auth / User Button */}
          <button
            type="button"
            className="nav-auth-pill-btn desktop-only-action"
            onClick={(e) => {
              e.stopPropagation();
              if (user) {
                setDropdownOpen(dropdownOpen === 'account' ? null : 'account');
              } else {
                if (navigate) navigate('signup');
                else window.location.href = '/signup';
              }
            }}
          >
            <span>{userDisplayName}</span>
          </button>

          {/* Mobile User Icon */}
          <button
            type="button"
            className={`premium-icon-btn mobile-user-trigger mobile-only-action ${dropdownOpen === 'account' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (user) {
                setDropdownOpen(dropdownOpen === 'account' ? null : 'account');
              } else {
                if (navigate) navigate('signup');
                else window.location.href = '/signup';
              }
            }}
            aria-label="Account Menu"
          >
            <User size={20} strokeWidth={1.5} />
            {cartProducts.length > 0 && (
              <span className="premium-badge mobile-only-badge">{cartProducts.length}</span>
            )}
          </button>

          {user && (
            <DropdownPortal anchorRef={profileRef} isOpen={dropdownOpen === 'account'}>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (navigate) navigate('admin');
                    else window.location.href = '/admin';
                    setDropdownOpen(null);
                  }}
                >
                  Admin Panel
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (navigate) navigate('account');
                  else window.location.href = '/account';
                  setDropdownOpen(null);
                }}
              >
                My Account
              </button>
              <button
                type="button"
                className="profile-dropdown-cart-btn"
                onClick={() => {
                  setCartOpen(true);
                  setDropdownOpen(null);
                }}
              >
                <span>My Cart {cartProducts.length > 0 ? `(${cartProducts.length})` : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigate) navigate('favorites');
                  else window.location.href = '/favorites';
                  setDropdownOpen(null);
                }}
              >
                Saved Items {favoritesCount > 0 ? `(${favoritesCount})` : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSignOut();
                  setDropdownOpen(null);
                }}
              >
                Log Out
              </button>
            </DropdownPortal>
          )}
        </div>

        {/* Country & Currency Selector */}
        <div className="desktop-only-action">
          <CountrySelector variant="desktop" />
        </div>

        <button 
          className={`hamburger-btn ${menuOpen ? 'is-active' : ''}`} 
          type="button" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="hamburger-svg">
            <rect className="line line-top" x="4" y="6" width="16" height="1.5" rx="0.75" fill="currentColor" />
            <rect className="line line-middle" x="4" y="11" width="16" height="1.5" rx="0.75" fill="currentColor" />
            <rect className="line line-bottom" x="9" y="16" width="11" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
        </button>
      </div>
    </header>
  );
}
