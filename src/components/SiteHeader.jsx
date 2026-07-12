import { ChevronDown, Search, ShoppingBag, User, LogOut } from 'lucide-react';
import { DropdownPortal } from './DropdownPortal.jsx';
import { AppLink } from './AppLink.jsx';
import { storeConfig } from '../config.js';
import { CURRENCIES, CurrencyManager } from '../storefrontShared.jsx';
import { DemoToggle } from '../utils/demoHelper.js';

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

export function SiteHeader({
  route,
  scrolled,
  pastHero,
  menuOpen,
  setMenuOpen,
  brandLogoSrc,
  navigate,
  dropdownOpen,
  setDropdownOpen,
  categoriesRef,
  categories,
  setCategory,
  partnerNavRef,
  searchActive,
  setSearchActive,
  profileRef,
  user,
  buyerProfile,
  vendorOnboarding,
  isAdmin,
  favoritesCount,
  handleSignOut,
  setAuthOpen,
  setCartOpen,
  cartProducts,
  currencyRef,
  activeCurrency,
  currentCurrency,
}) {
  return (
    <header className={`site-header ${route === 'home' || route === 'about' ? 'home-header' : ''} ${scrolled ? 'scrolled' : ''} ${pastHero ? 'past-hero' : ''}`}>
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

      <a
        href="/"
        className="brand"
        onClick={(e) => {
          if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
            e.preventDefault();
            navigate('home');
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
            {categories.map((cat) => (
              <button type="button"
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  navigate('catalogue', null, null, { category: cat });
                  setDropdownOpen(null);
                }}
              >
                {pluralizeCategory(cat)}
              </button>
            ))}
          </DropdownPortal>
        </div>
        <div className="nav-item-dropdown" ref={partnerNavRef}>
          <button type="button"
            className={dropdownOpen === 'partner' || route === 'sourcing-partners' || route === 'white-label' || route === 'bulk-inquiry' ? 'active' : ''}
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'partner' ? null : 'partner');
            }}
          >
            PARTNERS <ChevronDown size={14} className={dropdownOpen === 'partner' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={partnerNavRef} isOpen={dropdownOpen === 'partner'}>
            {[
              { name: 'Dropshipping Program', slug: 'dropshipping' },
              { name: 'White Label Brands', slug: 'white-label' },
              { name: 'Sourcing Partners', slug: 'sourcing-partners' },
              { name: 'Bulk Inquiry', slug: 'bulk-inquiry' },
            ].map((item) => (
              <button type="button"
                key={item.slug}
                onClick={() => {
                  navigate(item.slug);
                  setDropdownOpen(null);
                }}
              >
                {item.name}
              </button>
            ))}
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

      <button className="icon-button mobile-search-button" type="button" onClick={() => navigate('catalogue')}>
        <Search size={20} />
      </button>

      <div className="header-actions-premium">
        <DemoToggle user={user} />
        <button 
          className={`premium-search-trigger ${searchActive ? 'active' : ''}`}
          type="button" 
          onClick={() => setSearchActive(!searchActive)}
          aria-label="Search"
        >
          <Search size={18} strokeWidth={1.5} />
        </button>
        
        <div className="nav-item-dropdown profile-dropdown-container" ref={profileRef}>
          <button 
            className={`premium-icon-btn profile-trigger ${dropdownOpen === 'profile' ? 'active' : ''}`}
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'profile' ? null : 'profile');
            }}
            aria-label="Profile"
          >
            <User size={18} strokeWidth={1.5} />
            {cartProducts.length > 0 && (
              <span className="premium-badge mobile-only-badge">{cartProducts.length}</span>
            )}
          </button>
          <DropdownPortal anchorRef={profileRef} isOpen={dropdownOpen === 'profile'}>
            {user ? (
              <>
                {buyerProfile?.full_name && (
                  <div className="profile-dropdown-greeting">
                    Hello, {buyerProfile.full_name.split(' ')[0]}
                  </div>
                )}
                <button type="button"
                  onClick={() => {
                    navigate('account');
                    setDropdownOpen(null);
                  }}
                >
                  My Account
                </button>
                {vendorOnboarding?.status === 'approved' && vendorOnboarding?.drive_folder_url && (
                  <button type="button"
                    onClick={() => {
                      window.open(vendorOnboarding.drive_folder_url, '_blank');
                      setDropdownOpen(null);
                    }}
                    className="premium-product-listing-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: '600',
                      color: '#b78646',
                      transition: 'color 0.2s ease',
                    }}
                  >
                    Product Listing
                  </button>
                )}
                {isAdmin && (
                  <button type="button"
                    onClick={() => {
                      window.open('/admin', '_blank');
                      setDropdownOpen(null);
                    }}
                  >
                    Admin Panel
                  </button>
                )}
                <button type="button"
                  onClick={() => {
                    navigate('favorites');
                    setDropdownOpen(null);
                  }}
                >
                  Saved Items {favoritesCount > 0 && `(${favoritesCount})`}
                </button>
                <button type="button"
                  className="profile-dropdown-cart-btn"
                  onClick={() => {
                    setCartOpen(true);
                    setDropdownOpen(null);
                  }}
                >
                  <span>Order List</span>
                  {cartProducts.length > 0 && (
                    <span className="premium-badge" style={{ position: 'static', transform: 'none' }}>
                      {cartProducts.length}
                    </span>
                  )}
                </button>
                <button type="button"
                  onClick={() => {
                    handleSignOut();
                    setDropdownOpen(null);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button type="button"
                  onClick={() => {
                    setAuthOpen(true);
                    setDropdownOpen(null);
                  }}
                >
                  Sign In / Register
                </button>
              </>
            )}
          </DropdownPortal>
        </div>
        
        {user && (
          <button 
            className="premium-icon-btn navbar-logout-btn" 
            type="button" 
            onClick={handleSignOut}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={18} strokeWidth={1.5} />
          </button>
        )}
        
        <button 
          className="premium-icon-btn cart-btn" 
          type="button" 
          onClick={() => setCartOpen(true)}
          aria-label="Cart"
        >
          <ShoppingBag size={18} strokeWidth={1.5} />
          {cartProducts.length > 0 && <span className="premium-badge">{cartProducts.length}</span>}
        </button>

        <div className="nav-item-dropdown currency-dropdown-container" ref={currencyRef}>
          <button 
            className={`premium-icon-btn navbar-currency-trigger ${dropdownOpen === 'currency' ? 'active' : ''}`}
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === 'currency' ? null : 'currency');
            }}
            aria-label="Change Currency"
          >
            <span className="navbar-currency-code">{activeCurrency.code}</span>
            <ChevronDown size={11} className={dropdownOpen === 'currency' ? 'rotate' : ''} />
          </button>
          <DropdownPortal anchorRef={currencyRef} isOpen={dropdownOpen === 'currency'} className="dropdown-menu currency-dropdown-menu">
            {CURRENCIES.map((c) => (
              <button type="button"
                key={c.code}
                className={c.code === currentCurrency ? 'active' : ''}
                onClick={() => {
                  CurrencyManager.setCurrency(c.code);
                  setDropdownOpen(null);
                }}
              >
                <span>{c.code}</span>
                {c.code === currentCurrency && <div className="active-dot" />}
              </button>
            ))}
          </DropdownPortal>
        </div>
      </div>
    </header>
  );
}
