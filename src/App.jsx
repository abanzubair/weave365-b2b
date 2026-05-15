import { Suspense, lazy, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Bookmark, Search, ShoppingBag, User, Menu } from 'lucide-react';
import { fetchProducts, fetchHeroData, fetchConfigOptions } from './productData.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { adminEmails, serviceablePincodes, storeConfig } from './config.js';
import brandLogo from '../assets/Weave365.svg';
import { fallbackProductImage, formatMoney, customerPrice, useCurrency } from './storefrontShared.jsx';

import {
  parseCartVariantCode,
  upsertCart,
  upsertCartSelections,
  loadSavedState,
  persistCart,
  persistFavorites,
  readLocal,
} from './utils/cartHelpers.js';
import { loadProfileForUser, syncProfileFromUser } from './utils/profileHelpers.js';
import { getBuyerAccess, priceNoticeForAccess } from './utils/buyerAccess.js';
import { applyVisiblePricesToProducts, buildVisiblePriceMap, loadVisiblePrices } from './services/priceService.js';
import { RouteFallback } from './components/RouteFallback.jsx';
import { TopBar } from './components/TopBar.jsx';
import { Footer } from './components/Footer.jsx';
import { MobileMenu } from './components/MobileMenu.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { Home, homeCategoryNames } from './pages/Home.jsx';
import { Favorites } from './pages/Favorites.jsx';
import { ComingSoon } from './pages/ComingSoon.jsx';

const Catalog = lazy(() => import('./CatalogPage.jsx').then((module) => ({ default: module.Catalog })));
const ProductDetailWrapper = lazy(() => import('./ProductPage.jsx').then((module) => ({ default: module.ProductDetailWrapper })));
const BulkInquiry = lazy(() => import('./pages/BulkInquiry.jsx').then((module) => ({ default: module.BulkInquiry })));
const Admin = lazy(() => import('./pages/Admin.jsx').then((module) => ({ default: module.Admin })));
const Account = lazy(() => import('./pages/Account.jsx').then((module) => ({ default: module.Account })));
const ResellerGrowthPage = lazy(() => import('./pages/ResellerGrowthPage.jsx').then((module) => ({ default: module.ResellerGrowthPage })));
const SharedCatalog = lazy(() => import('./pages/SharedCatalog.jsx').then((module) => ({ default: module.SharedCatalog })));

export default function App() {

  useCurrency();
  const [products, setProducts] = useState([]);
  const [visiblePriceRows, setVisiblePriceRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const routerNavigate = useNavigate();
  const location = useLocation();
  const route = location.pathname === '/' ? 'home' : location.pathname.split('/')[1];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [fabric, setFabric] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [pincode, setPincode] = useState('');
  const [codStatus, setCodStatus] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const categoriesRef = useRef(null);
  const searchRef = useRef(null);
  const [categoriesPos, setCategoriesPos] = useState({ top: 0, left: 0 });
  const [searchPos, setSearchPos] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    if (search && searchRef.current && route !== 'catalog') {
      const rect = searchRef.current.getBoundingClientRect();
      setSearchPos({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  }, [search, route]);

  const [heroSlides, setHeroSlides] = useState([]);
  const [configOptions, setConfigOptions] = useState({ priceRanges: [], categories: [], fabrics: [] });
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const isAdmin = Boolean(user?.email && adminEmails.includes(String(user.email).toLowerCase()));
  const priceAccess = useMemo(() => getBuyerAccess(user, buyerProfile), [buyerProfile, user]);
  const visiblePriceMap = useMemo(() => buildVisiblePriceMap(visiblePriceRows), [visiblePriceRows]);
  const pricedProducts = useMemo(
    () => applyVisiblePricesToProducts(products, visiblePriceMap),
    [products, visiblePriceMap],
  );

  useEffect(() => {
    let isActive = true;

    fetchProducts()
      .then((items) => {
        if (!isActive) return;
        setProducts(items);
        setStatus('ready');
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err.message || 'Unable to load products.');
        setStatus('error');
      });

    fetchHeroData()
      .then((data) => {
        if (!isActive) return;
        if (data && data.length > 0) {
          setHeroSlides(data);
        }
      })
      .catch(console.error);

    fetchConfigOptions()
      .then((opts) => {
        if (!isActive) return;
        setConfigOptions(opts);
      })
      .catch(console.error);

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const updateScrolled = () => {
      const scrollPos = window.scrollY || document.scrollingElement?.scrollTop || 0;
      setScrolled(scrollPos > 20);
      setPastHero(scrollPos > (window.innerHeight - 100));
    };

    window.addEventListener('scroll', updateScrolled, { passive: true });
    updateScrolled();

    return () => {
      window.removeEventListener('scroll', updateScrolled);
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const localUser = localStorage.getItem('sareeva_user');
      if (localUser) {
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
        setBuyerProfile(parsedUser.user_metadata?.buyer_profile || parsedUser.buyer_profile || null);
      }
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function hydrateProfile() {
      if (!user) {
        setBuyerProfile(null);
        return;
      }

      if (isSupabaseConfigured) {
        await syncProfileFromUser(user);
      }

      const { profile } = await loadProfileForUser(user);
      if (isActive) setBuyerProfile(profile);
    }

    void hydrateProfile();

    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    if (!priceAccess.canViewPrices && priceRange !== 'All') {
      setPriceRange('All');
    }
  }, [priceAccess.canViewPrices, priceRange]);

  useEffect(() => {
    let isActive = true;

    async function hydrateVisiblePrices() {
      if (!priceAccess.canViewPrices) {
        setVisiblePriceRows([]);
        return;
      }

      const { prices, error } = await loadVisiblePrices();
      if (!isActive) return;

      if (error) {
        console.warn('Unable to load approved Google Sheet prices:', error.message || error);
        setVisiblePriceRows([]);
        return;
      }

      setVisiblePriceRows(prices);
    }

    void hydrateVisiblePrices();

    return () => {
      isActive = false;
    };
  }, [priceAccess.canViewPrices, priceAccess.priceGroup, user?.id]);

  useEffect(() => {
    if (!dropdownOpen) return undefined;

    function handleClickOutside(event) {
      if (!event.target.closest('.nav-item-dropdown')) {
        setDropdownOpen(null);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!user) {
      setCart([]);
      setFavorites([]);
      return;
    }

    if (isSupabaseConfigured) {
      loadSavedState(user.id).then(({ savedCart, savedFavorites }) => {
        setCart(savedCart);
        setFavorites(savedFavorites);
      });
      return;
    }

    setCart(readLocal(`cart_${user.id}`));
    setFavorites(readLocal(`favorites_${user.id}`));
  }, [user]);

  const categories = useMemo(() => {
    if (configOptions.categories.length > 0) {
      return ['All', ...configOptions.categories];
    }
    return ['All', ...homeCategoryNames];
  }, [configOptions.categories]);

  const priceRanges = useMemo(() => {
    if (configOptions.priceRanges.length > 0) {
      return ['All', ...configOptions.priceRanges];
    }
    const ranges = new Set();
    pricedProducts.forEach(p => {
      if (p.priceRange) ranges.add(p.priceRange);
    });
    return ['All', ...Array.from(ranges).sort()];
  }, [pricedProducts, configOptions.priceRanges]);

  const fabrics = useMemo(() => {
    if (configOptions.fabrics.length > 0) {
      return ['All', ...configOptions.fabrics];
    }
    const set = new Set();
    pricedProducts.forEach(p => {
      if (p.fabric) set.add(p.fabric.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [pricedProducts, configOptions.fabrics]);

  const searchTerm = useDeferredValue(search.trim().toLowerCase());

  const visibleProducts = useMemo(() => {
    return pricedProducts.filter((product) => {
      const variantCodes = (product.variants || []).map((v) => v.code).join(' ');
      const text = [
        product.title,
        product.fabric,
        product.work,
        product.occasion,
        product.category,
        product.groupKey,
        variantCodes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = text.includes(searchTerm);
      const matchesCategory =
        category === 'All' ||
        (category === 'New Arrivals' && product.isNew) ||
        (category === 'Bestsellers' && product.isTopSeller) ||
        product.fabric === category ||
        product.category === category;
      const matchesPrice = priceRange === 'All' ||
        (product.priceRange && product.priceRange.trim() === priceRange.trim());
      const matchesFabric = fabric === 'All' ||
        (product.fabric && product.fabric.trim() === fabric.trim());
      return matchesSearch && matchesCategory && matchesPrice && matchesFabric && !product.isArchived;
    });
  }, [category, priceRange, fabric, pricedProducts, searchTerm]);

  const productsById = useMemo(
    () => new Map(pricedProducts.map((product) => [product.id, product])),
    [pricedProducts],
  );

  const favoriteKeySet = useMemo(
    () => new Set(favorites.map((item) => item.productGroupKey)),
    [favorites],
  );

  const cartProducts = useMemo(
    () =>
      cart
        .map((item) => {
          const product = productsById.get(item.productGroupKey);
          const { baseVariantCode, colorName } = parseCartVariantCode(item.variantCode);
          const variant = product?.variants.find((entry) => entry.code === baseVariantCode);
          const colorOptions = product?.colorOptions || [];
          const selectedColorName = colorName || variant?.color || colorOptions[0]?.name || '';
          const selectedColor = colorOptions.find((entry) => entry.name === selectedColorName);
          return product && variant
            ? {
              ...item,
              product,
              variant,
              baseVariantCode,
              selectedColorName,
              selectedColorImage: selectedColor?.image || variant.image || product.images[0],
              colorOptions,
            }
            : null;
        })
        .filter(Boolean),
    [cart, productsById],
  );

  const favoriteProducts = useMemo(
    () => pricedProducts.filter((product) => favoriteKeySet.has(product.id)),
    [favoriteKeySet, pricedProducts],
  );

  const addToCart = useCallback((product, variant, quantity = 1, colorSelection = {}) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setCart((currentCart) => {
      const next = upsertCart(currentCart, product, variant, quantity, colorSelection);
      void persistCart(next, user.id);
      return next;
    });
    setCartOpen(true);
  }, [user]);

  const addCartSelections = useCallback((product, selections) => {
    const selectedRows = selections.filter((selection) => selection?.variant && selection.quantity > 0);
    if (!selectedRows.length) return;

    if (!user) {
      setAuthOpen(true);
      return;
    }

    setCart((currentCart) => {
      const next = upsertCartSelections(currentCart, product, selectedRows);
      void persistCart(next, user.id);
      return next;
    });
    setCartOpen(true);
  }, [user]);

  const toggleFavorite = useCallback((product) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setFavorites((currentFavorites) => {
      const exists = currentFavorites.some((item) => item.productGroupKey === product.id);
      const next = exists
        ? currentFavorites.filter((item) => item.productGroupKey !== product.id)
        : [
          ...currentFavorites,
          { productGroupKey: product.id, variantCode: product.variants[0]?.code || '' },
        ];
      void persistFavorites(next, user.id);
      return next;
    });
  }, [user]);

  const updateQuantity = useCallback((item, quantity) => {
    setCart((currentCart) => {
      const next = currentCart
        .map((entry) => (
          entry.productGroupKey === item.productGroupKey && entry.variantCode === item.variantCode
            ? { ...entry, quantity }
            : entry
        ))
        .filter((entry) => entry.quantity > 0);
      if (user) {
        void persistCart(next, user.id);
      }
      return next;
    });
  }, [user]);


  const addCartColor = useCallback((item, color) => {
    if (!color?.name) return;
    addCartSelections(item.product, [{
      variant: item.variant,
      quantity: 1,
      colorName: color.name,
      image: color.image,
    }]);
  }, [addCartSelections]);

  const checkPincode = useCallback(() => {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }, [pincode]);

  const navigate = useCallback((nextRoute, productId = null) => {
    if (nextRoute === 'product') {
      routerNavigate(`/product/${productId}`);
    } else if (nextRoute === 'home') {
      routerNavigate('/');
    } else {
      routerNavigate(`/${nextRoute}`);
    }
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [routerNavigate]);

  const handleSignOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('sareeva_user');
      setUser(null);
    }
    navigate('home');
  }, [navigate]);

  // return <ComingSoon />;

  const isSharedPage = location.pathname.startsWith('/s/');

  return (
    <>
      {!isSharedPage && (
        <header className={`site-header ${route === 'home' ? 'home-header' : ''} ${scrolled ? 'scrolled' : ''} ${pastHero ? 'past-hero' : ''}`}>
          <button className="icon-button menu-button" type="button" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>
          <a
            href="/"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigate('home');
            }}
          >
            <img src={brandLogo} alt={storeConfig.name} className="brand-logo" />
          </a>
          <nav className="main-nav">
            {/* <button className={route === 'home' ? 'active' : ''} onClick={() => navigate('home')}>
              Home
            </button> */}
            <div className="nav-item-dropdown" ref={categoriesRef}>
              <button
                className={dropdownOpen === 'categories' ? 'active' : ''}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dropdownOpen !== 'categories' && categoriesRef.current) {
                    const rect = categoriesRef.current.getBoundingClientRect();
                    setCategoriesPos({ top: rect.bottom, left: rect.left + rect.width / 2 });
                  }
                  setDropdownOpen(dropdownOpen === 'categories' ? null : 'categories');
                }}
              >
                Categories <ChevronDown size={14} className={dropdownOpen === 'categories' ? 'rotate' : ''} />
              </button>
              {dropdownOpen === 'categories' && createPortal(
                <div 
                  className="dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: categoriesPos.top,
                    left: categoriesPos.left,
                    transform: 'translateX(-50%) translateY(12px)',
                    zIndex: 10000
                  }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        navigate('catalog');
                        setDropdownOpen(null);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
            <button className={category === 'Bestsellers' && route === 'catalog' ? 'active' : ''} onClick={() => { setCategory('Bestsellers'); navigate('catalog'); }}>Bestsellers</button>
            <button className={category === 'New Arrivals' && route === 'catalog' ? 'active' : ''} onClick={() => { setCategory('New Arrivals'); navigate('catalog'); }}>New Arrivals</button>
            <button className={route === 'catalog' ? 'active' : ''} onClick={() => navigate('catalog')}>
              Catalogue
            </button>
            <button className={route === 'bulk-inquiry' ? 'active' : ''} onClick={() => navigate('bulk-inquiry')}>
              Bulk Order
            </button>
            {isAdmin && (
              <button className={route === 'admin' ? 'active' : ''} onClick={() => navigate('admin')}>
                Admin
              </button>
            )}
          </nav>
          <div className="search-box-wrapper" ref={searchRef}>
            <label className="search-box">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
              />
              <Search size={18} />
            </label>
            {search && route !== 'catalog' && createPortal(
              <div 
                className="search-suggestions"
                style={{
                  position: 'fixed',
                  top: searchPos.top,
                  left: searchPos.left,
                  width: searchPos.width,
                  marginTop: '14px',
                  zIndex: 10000
                }}
              >
                {visibleProducts.length > 0 ? (
                  <>
                    {visibleProducts.slice(0, 6).map((product) => {
                      const price = customerPrice(product.variants?.[0]?.prices || {}, priceAccess);
                      const image = product.images?.[0] || fallbackProductImage;
                      return (
                        <button
                          key={product.id}
                          onClick={() => {
                            navigate('product', product.id);
                            setSearch('');
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
                    <button className="view-all-results" onClick={() => navigate('catalog')}>
                      See all results for "{search}"
                    </button>
                  </>
                ) : (
                  <div className="no-results">No products found for "{search}"</div>
                )}
              </div>,
              document.body
            )}
          </div>
          <button className="icon-button mobile-search-button" type="button" onClick={() => navigate('catalog')}>
            <Search size={22} />
          </button>
          <div className="header-actions">
            {user ? (
              <>
                <button className="login-link" type="button" onClick={() => navigate('account')}>
                  <User size={18} />
                  Account
                </button>
                <button className="login-link" type="button" onClick={handleSignOut}>
                  Logout
                </button>
              </>
            ) : (
              <button className="login-link" type="button" onClick={() => setAuthOpen(true)}>
                <User size={18} />
                Login / Register
              </button>
            )}
            <button className="icon-button favorite-button" type="button" onClick={() => navigate('favorites')}>
              <Bookmark size={22} />
              {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
            </button>
            <button className="icon-button cart-button" type="button" onClick={() => setCartOpen(true)}>
              <ShoppingBag size={22} />
              {cart.length > 0 && <span className="badge">{cart.length}</span>}
            </button>
          </div>
        </header>
      )}

      {menuOpen && !isSharedPage && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          navigate={navigate}
          setCategory={setCategory}
          user={user}
          priceAccess={priceAccess}
          openAuth={() => setAuthOpen(true)}
          search={search}
          setSearch={setSearch}
          visibleProducts={visibleProducts}
          setCartOpen={setCartOpen}
          cartCount={cart.length}
          favoritesCount={favorites.length}
        />
      )}

      <main>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={
              <Home
                products={pricedProducts}
                status={status}
                error={error}
                heroSlides={heroSlides}
                fallbackHeroImage={fallbackProductImage}
                navigate={navigate}
                setCategory={setCategory}
                openAuth={() => setAuthOpen(true)}
                addToCart={addToCart}
                addCartSelections={addCartSelections}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
                priceAccess={priceAccess}
              />
            } />
            <Route path="/catalog" element={
              <Catalog
                products={visibleProducts}
                status={status}
                error={error}
                categories={categories}
                category={category}
                setCategory={setCategory}
                fabrics={fabrics}
                fabric={fabric}
                setFabric={setFabric}
                priceRanges={priceRanges}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                search={search}
                setSearch={setSearch}
                navigate={navigate}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
                priceAccess={priceAccess}
                openAuth={() => setAuthOpen(true)}
              />
            } />
            <Route path="/product/:id" element={
              <ProductDetailWrapper
                products={pricedProducts}
                productsById={productsById}
                navigate={navigate}
                addToCart={addToCart}
                addCartSelections={addCartSelections}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
                priceAccess={priceAccess}
                openAuth={() => setAuthOpen(true)}
                pincode={pincode}
                setPincode={setPincode}
                codStatus={codStatus}
                checkPincode={checkPincode}
              />
            } />
            <Route path="/favorites" element={
              <Favorites
                products={favoriteProducts}
                user={user}
                navigate={navigate}
                openAuth={() => setAuthOpen(true)}
                toggleFavorite={toggleFavorite}
                addToCart={addToCart}
                priceAccess={priceAccess}
              />
            } />
            <Route path="/account" element={
              <Account
                user={user}
                buyerProfile={buyerProfile}
                priceAccess={priceAccess}
                cartItems={cartProducts}
                favoriteProducts={favoriteProducts}
                navigate={navigate}
                openAuth={() => setAuthOpen(true)}
                updateQuantity={updateQuantity}
                addToCart={addToCart}
                onSignOut={handleSignOut}
              />
            } />
            <Route path="/bulk-inquiry" element={
              <BulkInquiry navigate={navigate} />
            } />
            <Route path="/admin" element={
              <Admin
                user={user}
                buyerProfile={buyerProfile}
                onProfileChange={setBuyerProfile}
                openAuth={() => setAuthOpen(true)}
              />
            } />
            <Route path="/reseller-growth" element={
              <ResellerGrowthPage
                openAuth={() => setAuthOpen(true)}
              />
            } />
            <Route path="/s/:slug" element={
              <SharedCatalog products={pricedProducts} />
            } />
          </Routes>

        </Suspense>
      </main>

      {!isSharedPage && <Footer navigate={navigate} />}
      {!isSharedPage && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cartProducts}
          updateQuantity={updateQuantity}
          addCartColor={addCartColor}
          pincode={pincode}
          setPincode={setPincode}
          codStatus={codStatus}
          checkPincode={checkPincode}
          priceAccess={priceAccess}
        />
      )}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        setUser={setUser}
        buyerProfile={buyerProfile}
        setBuyerProfile={setBuyerProfile}
      />
    </>
  );
}
