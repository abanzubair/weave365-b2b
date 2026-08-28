import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Search, User } from 'lucide-react';
import { DropdownPortal } from './DropdownPortal.jsx';
import { AppLink } from './AppLink.jsx';
import { storeConfig, getCategorySlug } from '../config.js';
import { useStorefront } from '../store/useStorefront.js';

import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';

const defaultCategoryNames = ['All', 'Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Under 999'];

export const pluralizeCategory = (cat) => {
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

export function SiteHeader(props) {
  const store = useStorefront();

  const internalCategoriesRef = useRef(null);
  const internalPartnerNavRef = useRef(null);
  const internalProfileRef = useRef(null);
  const internalGetStartedRef = useRef(null);

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
  const categoriesRef = props.categoriesRef || internalCategoriesRef;
  const categories = (props.categories && props.categories.length > 0)
    ? props.categories
    : (store.configOptions?.categories?.length > 0
      ? ['All', ...store.configOptions.categories]
      : defaultCategoryNames);
  const setCategory = props.setCategory;
  const partnerNavRef = props.partnerNavRef || internalPartnerNavRef;
  const searchActive = props.searchActive ?? store.searchActive;
  const setSearchActive = props.setSearchActive ?? store.setSearchActive;
  const profileRef = props.profileRef || internalProfileRef;
  const getStartedRef = props.getStartedRef || internalGetStartedRef;
  const user = props.user ?? store.user;
  const buyerProfile = props.buyerProfile ?? store.buyerProfile;
  const userDisplayName = user
    ? (() => {
        const rawName = buyerProfile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || buyerProfile?.business_name || user.email?.split('@')[0] || 'Account';
        return rawName.trim().split(/\s+/)[0] || 'Account';
      })()
    : 'Log In';
  const vendorOnboarding = props.vendorOnboarding ?? store.vendorOnboarding;
  const isAdmin = props.isAdmin;
  const favoritesCount = props.favoritesCount ?? store.favorites.length;
  const handleSignOut = props.handleSignOut;
  const setCartOpen = props.setCartOpen ?? store.setCartOpen;
  const cartProducts = props.cartProducts || [];
  return (
    <header className={`site-header ${route === 'home' ? 'home-header' : ''} ${scrolled ? 'scrolled' : ''} ${pastHero ? 'past-hero' : ''}`}>
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
        <img src={brandLogoSrc} alt={storeConfig.name} className="brand-logo" />
      </a>
      <nav className="main-nav">
        <AppLink 
          to="new-arrivals" 
          className={route === 'new-arrivals' ? 'active' : ''} 
          navigate={navigate}
        >
          NEW ARRIVALS
        </AppLink>
        <div className="nav-item-dropdown" ref={categoriesRef}>
          <button type="button"
            className={dropdownOpen === 'categories' ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'categories' ? null : 'categories');
            }}
          >
            CATEGORIES <ChevronDown size={14} className={dropdownOpen === 'categories' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={categoriesRef} isOpen={dropdownOpen === 'categories'}>
            {categories.map((cat) => {
              const isAll = cat === 'All' || cat === 'all';
              const targetSlug = isAll ? 'catalogue' : getCategorySlug(cat);
              const targetHref = isAll ? '/catalogue' : `/${targetSlug}`;
              return (
                <AppLink
                  key={cat}
                  to={targetSlug}
                  href={targetHref}
                  navigate={navigate}
                  onClick={() => {
                    if (setCategory) setCategory(cat);
                    setDropdownOpen(null);
                  }}
                >
                  {pluralizeCategory(cat)}
                </AppLink>
              );
            })}
          </DropdownPortal>
        </div>
        <div className="nav-item-dropdown" ref={partnerNavRef}>
          <button type="button"
            className={dropdownOpen === 'partner' || route === 'sourcing-partners' || route === 'white-label' || route === 'bulk-inquiry' || route === 'dropshipping' || route === 'collaboration' || route === 'weaver-onboarding' || route === 'custom-woven' || route === 'handloom-vs-powerloom-guide' ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'partner' ? null : 'partner');
            }}
          >
            BUSINESS <ChevronDown size={14} className={dropdownOpen === 'partner' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={partnerNavRef} isOpen={dropdownOpen === 'partner'} className="dropdown-menu business-mega-menu">
            <div className="mega-menu-grid">
              <div className="mega-menu-col">
                <div className="mega-menu-section">
                  <span className="mega-menu-heading">Buy</span>
                  <AppLink to="wholesale-catalogue" navigate={navigate} onClick={() => setDropdownOpen(null)}>Wholesale</AppLink>
                  <AppLink to="bulk-inquiry" navigate={navigate} onClick={() => setDropdownOpen(null)}>Bulk Enquiry</AppLink>
                </div>
              </div>
              <div className="mega-menu-col">
                <div className="mega-menu-section">
                  <span className="mega-menu-heading">Sell</span>
                  <AppLink to="resell-sarees-online" navigate={navigate} onClick={() => setDropdownOpen(null)}>Reseller Center</AppLink>
                  <AppLink to="white-label" navigate={navigate} onClick={() => setDropdownOpen(null)}>White Label Catalog</AppLink>
                  <AppLink to="dropshipping" navigate={navigate} onClick={() => setDropdownOpen(null)}>Dropshipping Services</AppLink>
                  <AppLink to="affiliate-program" navigate={navigate} onClick={() => setDropdownOpen(null)}>Affiliate Program</AppLink>
                </div>
              </div>
              <div className="mega-menu-col">
                <div className="mega-menu-section">
                  <span className="mega-menu-heading">Partner</span>
                  <AppLink to="collaboration" navigate={navigate} onClick={() => setDropdownOpen(null)}>Collaboration</AppLink>
                  <AppLink to="sourcing-partners" navigate={navigate} onClick={() => setDropdownOpen(null)}>Sourcing Partner</AppLink>
                  <AppLink to="weaver-onboarding" navigate={navigate} onClick={() => setDropdownOpen(null)}>Vendor Onboarding</AppLink>
                  <a href="https://wa.me/919919101369?text=Hi%20Weave365%2C%20I%20would%20like%20to%20join%20the%20WhatsApp%20community" target="_blank" rel="noopener noreferrer" onClick={() => setDropdownOpen(null)}>WhatsApp Community</a>
                </div>
              </div>
              <div className="mega-menu-col">
                <div className="mega-menu-section">
                  <span className="mega-menu-heading">Learn</span>
                  <AppLink to="custom-woven" navigate={navigate} onClick={() => setDropdownOpen(null)}>Custom Woven</AppLink>
                  <AppLink 
                    to="custom-woven#weaving-techniques" 
                    navigate={navigate} 
                    onClick={(e) => {
                      setDropdownOpen(null);
                      const el = document.getElementById('weaving-techniques');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    Weaving Techniques
                  </AppLink>
                  <AppLink to="handloom-vs-powerloom-guide" navigate={navigate} onClick={() => setDropdownOpen(null)}>Handloom vs Powerloom</AppLink>
                </div>
              </div>
            </div>
          </DropdownPortal>
        </div>
        <AppLink 
          to="about" 
          className={route === 'about' ? 'active' : ''} 
          navigate={navigate}
        >
          ABOUT
        </AppLink>
        <AppLink 
          to="contact" 
          className={route === 'contact' ? 'active' : ''} 
          navigate={navigate}
        >
          CONTACT
        </AppLink>
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
                <span>Cart {cartProducts.length > 0 ? `(${cartProducts.length})` : ''}</span>
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

        {/* 2. Get Started Dropdown Button */}
        <div className="nav-item-dropdown get-started-dropdown-container" ref={getStartedRef}>
          <button
            type="button"
            className="nav-account-pill-btn desktop-only-action"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'get-started' ? null : 'get-started');
            }}
          >
            <span>Get Started</span>
          </button>

          <DropdownPortal anchorRef={getStartedRef} isOpen={dropdownOpen === 'get-started'}>
            <button
              type="button"
              onClick={() => {
                if (navigate) navigate('resell-sarees-online');
                else window.location.href = '/resell-sarees-online';
                setDropdownOpen(null);
              }}
            >
              Start Reselling
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigate) navigate('catalogue');
                else window.location.href = '/catalogue';
                setDropdownOpen(null);
              }}
            >
              Shop Products
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigate) navigate('bulk-inquiry');
                else window.location.href = '/bulk-inquiry';
                setDropdownOpen(null);
              }}
            >
              Wholesale Buying
            </button>
          </DropdownPortal>
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
