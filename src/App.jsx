import { Suspense, lazy, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Heart, Search, ShoppingBag, User, Menu } from 'lucide-react';
import { fetchProducts, fetchHeroData } from './productData.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { serviceablePincodes, storeConfig } from './config.js';
import brandLogo from '../assets/Weave365.svg';
import { fallbackProductImage, formatMoney, customerPrice } from './storefrontShared.jsx';

import { upsertCart, loadSavedState, persistCart, persistFavorites, readLocal } from './utils/cartHelpers.js';
import { RouteFallback } from './components/RouteFallback.jsx';
import { TopBar } from './components/TopBar.jsx';
import { Footer } from './components/Footer.jsx';
import { MobileMenu } from './components/MobileMenu.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { Home } from './pages/Home.jsx';
import { Favorites } from './pages/Favorites.jsx';

const Catalog = lazy(() => import('./CatalogPage.jsx').then((module) => ({ default: module.Catalog })));
const ProductDetailWrapper = lazy(() => import('./ProductPage.jsx').then((module) => ({ default: module.ProductDetailWrapper })));
const BulkInquiry = lazy(() => import('./pages/BulkInquiry.jsx').then((module) => ({ default: module.BulkInquiry })));

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const routerNavigate = useNavigate();
  const location = useLocation();
  const route = location.pathname === '/' ? 'home' : location.pathname.split('/')[1];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [pincode, setPincode] = useState('');
  const [codStatus, setCodStatus] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [heroSlides, setHeroSlides] = useState([]);

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

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const localUser = localStorage.getItem('sareeva_user');
      if (localUser) setUser(JSON.parse(localUser));
      return;
    }

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

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
    const names = products.map((product) => product.fabric || product.category).filter(Boolean);
    return ['All', 'New Arrivals', 'Bestsellers', ...Array.from(new Set(names))];
  }, [products]);

  const searchTerm = useDeferredValue(search.trim().toLowerCase());

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
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
        (category === 'Bestsellers' && product.status && product.status.toLowerCase() === 'bestseller') ||
        product.fabric === category ||
        product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, searchTerm]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
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
          const variant = product?.variants.find((entry) => entry.code === item.variantCode);
          return product && variant ? { ...item, product, variant } : null;
        })
        .filter(Boolean),
    [cart, productsById],
  );

  const favoriteProducts = useMemo(
    () => products.filter((product) => favoriteKeySet.has(product.id)),
    [favoriteKeySet, products],
  );

  const addToCart = useCallback((product, variant, quantity = 1) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setCart((currentCart) => {
      const next = upsertCart(currentCart, product, variant, quantity);
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
        .map((entry) => (entry.variantCode === item.variantCode ? { ...entry, quantity } : entry))
        .filter((entry) => entry.quantity > 0);
      if (user) {
        void persistCart(next, user.id);
      }
      return next;
    });
  }, [user]);

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

  return (
    <>
      <TopBar />
      <header className="site-header">
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
          <div className="nav-item-dropdown">
            <button
              className={dropdownOpen === 'categories' ? 'active' : ''}
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(dropdownOpen === 'categories' ? null : 'categories');
              }}
            >
              Categories <ChevronDown size={14} className={dropdownOpen === 'categories' ? 'rotate' : ''} />
            </button>
            {dropdownOpen === 'categories' && (
              <div className="dropdown-menu">
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
              </div>
            )}
          </div>
          <button className={category === 'Bestsellers' && route === 'catalog' ? 'active' : ''} onClick={() => { setCategory('Bestsellers'); navigate('catalog'); }}>Bestsellers</button>
          <button className={category === 'New Arrivals' && route === 'catalog' ? 'active' : ''} onClick={() => { setCategory('New Arrivals'); navigate('catalog'); }}>New Arrivals</button>
          <button className={route === 'bulk-inquiry' ? 'active' : ''} onClick={() => navigate('bulk-inquiry')}>
            Bulk Order
          </button>
          <button className={route === 'catalog' ? 'active' : ''} onClick={() => navigate('catalog')}>
            Catalogue
          </button>
        </nav>
        <div className="search-box-wrapper">
          <label className="search-box">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
            />
            <Search size={18} />
          </label>
          {search && route !== 'catalog' && (
            <div className="search-suggestions">
              {visibleProducts.length > 0 ? (
                <>
                  {visibleProducts.slice(0, 6).map((product) => {
                    const price = customerPrice(product.variants?.[0]?.prices || {});
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
                          {price > 0 && <small>{formatMoney(price)}</small>}
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
            </div>
          )}
        </div>
        <div className="header-actions">
          <button className="login-link" type="button" onClick={() => setAuthOpen(true)}>
            <User size={18} />
            {user ? user.email || 'Account' : 'Login / Register'}
          </button>
          <button className="icon-button" type="button" onClick={() => navigate('favorites')}>
            <Heart size={22} />
            {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
          </button>
          <button className="icon-button" type="button" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={22} />
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </button>
        </div>
      </header>

      {menuOpen && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          navigate={navigate}
          setCategory={setCategory}
          user={user}
          openAuth={() => setAuthOpen(true)}
        />
      )}

      <main>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={
              <Home
                products={products}
                status={status}
                error={error}
                heroSlides={heroSlides}
                fallbackHeroImage={fallbackProductImage}
                navigate={navigate}
                setCategory={setCategory}
                openAuth={() => setAuthOpen(true)}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
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
                navigate={navigate}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
              />
            } />
            <Route path="/product/:id" element={
              <ProductDetailWrapper
                products={products}
                productsById={productsById}
                navigate={navigate}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
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
              />
            } />
            <Route path="/bulk-inquiry" element={
              <BulkInquiry navigate={navigate} />
            } />
          </Routes>
        </Suspense>
      </main>

      <Footer navigate={navigate} />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartProducts}
        updateQuantity={updateQuantity}
        pincode={pincode}
        setPincode={setPincode}
        codStatus={codStatus}
        checkPincode={checkPincode}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        setUser={setUser}
      />
    </>
  );
}
