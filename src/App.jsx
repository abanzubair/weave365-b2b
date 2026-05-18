'use client';

import { Suspense, lazy, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Bookmark, Search, ShoppingBag, User, ArrowRight } from 'lucide-react';
import { fetchProducts, fetchHeroData, fetchConfigOptions } from './productData.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { adminEmails, serviceablePincodes, storeConfig } from './config.js';
import brandLogo from '../assets/Weave365.svg';
import { fallbackProductImage, formatMoney, customerPrice, useCurrency, CurrencyManager } from './storefrontShared.jsx';
import { assetSrc } from './utils/assetSrc.js';

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
import { Home, homeCategoryNames } from './views/Home.jsx';
import { Favorites } from './views/Favorites.jsx';
import { ComingSoon } from './views/ComingSoon.jsx';

const Catalog = lazy(() => import('./CatalogPage.jsx').then((module) => ({ default: module.Catalog })));
const ProductDetailWrapper = lazy(() => import('./ProductPage.jsx').then((module) => ({ default: module.ProductDetailWrapper })));
const BulkInquiry = lazy(() => import('./views/BulkInquiry.jsx').then((module) => ({ default: module.BulkInquiry })));
const Admin = lazy(() => import('./views/Admin.jsx').then((module) => ({ default: module.Admin })));
const Account = lazy(() => import('./views/Account.jsx').then((module) => ({ default: module.Account })));
const ResellerGrowthPage = lazy(() => import('./views/ResellerGrowthPage.jsx').then((module) => ({ default: module.ResellerGrowthPage })));
const VendorPartnershipPage = lazy(() => import('./views/VendorPartnershipPage.jsx').then((module) => ({ default: module.VendorPartnershipPage })));
const TrustedPartnerRegistrationPage = lazy(() => import('./views/TrustedPartnerRegistrationPage.jsx').then((module) => ({ default: module.TrustedPartnerRegistrationPage })));
const ResellerDashboard = lazy(() => import('./views/ResellerDashboard.jsx').then((module) => ({ default: module.ResellerDashboard })));
const SharedCatalog = lazy(() => import('./views/SharedCatalog.jsx').then((module) => ({ default: module.SharedCatalog })));

const SharedProductPage = lazy(() => import('./views/SharedProductPage.jsx').then((module) => ({ default: module.SharedProductPage })));


const slugifyPartner = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, '-');
};

export default function App({ initialData = {} }) {

  useCurrency();
  const router = useRouter();
  const pathname = usePathname() || '/';
  const pathSegments = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const route = pathSegments[0] || 'home';
  const productId = route === 'product' ? decodeURIComponent(pathSegments[1] || '') : null;
  const sharedSlug = route === 's' ? decodeURIComponent(pathSegments[1] || '') : null;
  const isSharedProduct = route === 's' && pathSegments[2] === 'p';
  const sharedProductId = isSharedProduct ? decodeURIComponent(pathSegments[3] || '') : null;
  const partnerName = route === 'partner' ? decodeURIComponent(pathSegments[1] || '') : null;

  const hasInitialData = Boolean(initialData?.hydrated);
  const brandLogoSrc = assetSrc(brandLogo);
  const [products, setProducts] = useState(() => initialData.products || []);
  const [visiblePriceRows, setVisiblePriceRows] = useState([]);
  const [status, setStatus] = useState(() => initialData.status || (initialData.products ? 'ready' : 'loading'));
  const [error, setError] = useState(() => initialData.error || '');
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
  const [searchActive, setSearchActive] = useState(false);
  useLayoutEffect(() => {
    if (search && searchRef.current && route !== 'catalog') {
      const rect = searchRef.current.getBoundingClientRect();
      setSearchPos({ top: rect.bottom, left: rect.left, width: rect.width });
    } else if (!search) {
      setSearchPos({ top: 0, left: 0, width: 0 });
    }
  }, [search, route]);

  const [heroSlides, setHeroSlides] = useState(() => initialData.heroSlides || []);
  const [configOptions, setConfigOptions] = useState(() => (
    initialData.configOptions || { priceRanges: [], categories: [], fabrics: [] }
  ));
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
    if (hasInitialData) return undefined;

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
  }, [hasInitialData]);

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
    fetch('https://api.exchangerate-api.com/v4/latest/INR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          CurrencyManager.setRates(data.rates);
        }
      })
      .catch(err => console.error('Failed to fetch exchange rates', err));
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
    if (!search) return;

    function handleClickOutside(event) {
      const isOutsideBox = searchRef.current && !searchRef.current.contains(event.target);
      const isOutsideSuggestions = !event.target.closest('.search-suggestions');
      if (isOutsideBox && isOutsideSuggestions) {
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [search]);

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
        product.partner,
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

  const cartCount = cartProducts.length;
  const favoritesCount = favoriteProducts.length;

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

  const navigate = useCallback((nextRoute, productId = null, shopName = null) => {
    let href = `/${nextRoute}`;
    if (nextRoute === 'product') {
      href = `/product/${productId}`;
    } else if (nextRoute === 'shared-product') {
      href = `/s/${shopName}/p/${productId}`;
    } else if (nextRoute === 's') {
      href = `/s/${shopName}`;
    } else if (nextRoute === 'partner') {
      href = `/partner/${encodeURIComponent(slugifyPartner(productId))}`;
    } else if (nextRoute === 'home') {
      href = '/';
    }

    router.push(href);

    setMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [router]);

  const handleSignOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('sareeva_user');
      setUser(null);
    }
    navigate('home');
  }, [navigate]);

  const scrollToSection = useCallback((sectionId) => {
    if (route !== 'home') {
      navigate('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [route, navigate]);

  // return <ComingSoon />;

  const isSharedPage = route === 's' || route === 'reseller-dashboard';
  const routeContent = (() => {
    if (route === 'home') {
      return (
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
      );
    }

    if (route === 'catalog' || route === 'partner') {
      const partnerFilteredProducts = route === 'partner'
        ? visibleProducts.filter(p => p.partner && slugifyPartner(p.partner) === partnerName)
        : visibleProducts;

      return (
        <Catalog
          title={route === 'partner' ? `${products.find(p => p.partner && slugifyPartner(p.partner) === partnerName)?.partner || (partnerName ? partnerName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '')}'s Collection` : 'Wholesale Catalogue'}
          products={partnerFilteredProducts}
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
      );
    }

    if (route === 'product') {
      return (
        <ProductDetailWrapper
          productId={productId}
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
      );
    }

    if (route === 'favorites') {
      return (
        <Favorites
          products={favoriteProducts}
          user={user}
          navigate={navigate}
          openAuth={() => setAuthOpen(true)}
          toggleFavorite={toggleFavorite}
          addToCart={addToCart}
          priceAccess={priceAccess}
        />
      );
    }

    if (route === 'account') {
      return (
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
      );
    }

    if (route === 'bulk-inquiry') return <BulkInquiry navigate={navigate} />;

    if (route === 'admin') {
      return (
        <Admin
          user={user}
          buyerProfile={buyerProfile}
          onProfileChange={setBuyerProfile}
          openAuth={() => setAuthOpen(true)}
        />
      );
    }

    if (route === 'reseller-dashboard') {
      return (
        <ResellerDashboard
          user={user}
          buyerProfile={buyerProfile}
          navigate={navigate}
        />
      );
    }

    if (route === 'reseller-growth') {

      return <ResellerGrowthPage openAuth={() => setAuthOpen(true)} />;
    }

    if (route === 'vendor-partnership') return <VendorPartnershipPage />;

    if (route === 'Trusted-Partner-Registration') return <TrustedPartnerRegistrationPage />;

    if (route === 's') {
      if (isSharedProduct) {
        return <SharedProductPage products={pricedProducts} slug={sharedSlug} productId={sharedProductId} navigate={navigate} />;
      }
      return <SharedCatalog products={pricedProducts} slug={sharedSlug} navigate={navigate} />;
    }


    return <ComingSoon />;
  })();

  return (
    <>
      {!isSharedPage && (
        <header className={`site-header ${route === 'home' ? 'home-header' : ''} ${scrolled ? 'scrolled' : ''} ${pastHero ? 'past-hero' : ''}`}>
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
              e.preventDefault();
              navigate('home');
            }}
          >
            <img src={brandLogoSrc} alt={storeConfig.name} className="brand-logo" />
            <div className="brand-divider"></div>
            <div className="brand-subtitle">
              <span>B2B SAREE PLATFORM</span>
              <span>FOR BRANDS & BUYERS</span>
            </div>
          </a>
          <nav className="main-nav">
            <button 
              className={route === 'home' && typeof window !== 'undefined' && window.location.hash === '#brand-collab' ? 'active' : ''} 
              onClick={() => scrollToSection('brand-collab')}
            >
              Brands
            </button>
            <button 
              className={route === 'catalog' ? 'active' : ''} 
              onClick={() => navigate('catalog')}
            >
              Collections
            </button>
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
            <button 
              className={route === 'home' && typeof window !== 'undefined' && window.location.hash === '#why' ? 'active' : ''} 
              onClick={() => scrollToSection('why')}
            >
              About Us
            </button>
          </nav>

          <button className="icon-button mobile-search-button" type="button" onClick={() => navigate('catalog')}>
            <Search size={20} />
          </button>

          <div className="header-actions-premium">
            <button 
              className={`premium-search-trigger ${searchActive ? 'active' : ''}`}
              type="button" 
              onClick={() => setSearchActive(!searchActive)}
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
            
            <div className="premium-divider"></div>
            
            {user ? (
              <div className="premium-auth-group">
                <button className="premium-auth-link" type="button" onClick={() => navigate('account')}>
                  {buyerProfile?.full_name ? String(buyerProfile.full_name).toUpperCase() : 'MY ACCOUNT'}
                </button>
                <span className="premium-auth-slash">/</span>
                <button className="premium-auth-link" type="button" onClick={handleSignOut}>
                  LOGOUT
                </button>
              </div>
            ) : (
              <button className="premium-auth-link" type="button" onClick={() => setAuthOpen(true)}>
                SIGN IN / REGISTER
              </button>
            )}
            
            <div className="premium-divider"></div>

            <button 
              className="premium-icon-btn favorite-btn" 
              type="button" 
              onClick={() => navigate('favorites')}
              aria-label="Favorites"
            >
              <Bookmark size={18} strokeWidth={1.5} />
              {favoriteProducts.length > 0 && <span className="premium-badge">{favoriteProducts.length}</span>}
            </button>
            
            <button 
              className="premium-icon-btn cart-btn" 
              type="button" 
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartProducts.length > 0 && <span className="premium-badge">{cartProducts.length}</span>}
            </button>
          </div>

          {searchActive && (
            <div className="premium-search-overlay animate-fade-in" onClick={() => { setSearchActive(false); setSearch(''); }}>
              <div className="premium-search-modal" onClick={(e) => e.stopPropagation()}>
                <div className="premium-search-inner-wrapper">
                  <div className="premium-search-field-container">
                    <Search size={22} strokeWidth={1.5} className="search-icon-premium" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="What are you looking for?"
                      autoFocus
                      className="premium-search-input-field"
                    />
                    {search && (
                      <button className="search-clear-btn" onClick={() => setSearch('')}>
                        Clear
                      </button>
                    )}
                    <button 
                      className="search-modal-close-btn" 
                      onClick={() => {
                        setSearchActive(false);
                        setSearch('');
                      }}
                    >
                      <span className="close-text">Close</span> <span className="close-x">✕</span>
                    </button>
                  </div>
                  
                  <div className="premium-search-content-grid">
                    {!search ? (
                      <div className="search-preset-suggestions animate-fade-in">
                        <div className="preset-group">
                          <h3>Trending Saree Fabrics</h3>
                          <div className="preset-tags">
                            {['Banarasi', 'Katan Silk', 'Organza', 'Linen', 'Tussar', 'Georgette'].map((tag) => (
                              <button
                                key={tag}
                                className="preset-tag-btn"
                                onClick={() => setSearch(tag)}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="preset-group">
                          <h3>Quick Links</h3>
                          <ul className="quick-access-list">
                            <li>
                              <button onClick={() => { navigate('catalog'); setSearchActive(false); }}>
                                <span>Browse All Collections</span>
                                <ArrowRight size={14} />
                              </button>
                            </li>
                            <li>
                              <button onClick={() => { navigate('reseller-growth'); setSearchActive(false); }}>
                                <span>Reseller Partnership Program</span>
                                <ArrowRight size={14} />
                              </button>
                            </li>
                            <li>
                              <button onClick={() => { scrollToSection('brand-collab'); setSearchActive(false); }}>
                                <span>Collaborating Brands</span>
                                <ArrowRight size={14} />
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="premium-search-results-panel">
                        <div className="results-header">
                          <span className="results-title">Collections Found</span>
                          <span className="results-count">{visibleProducts.length} premium products</span>
                        </div>
                        
                        {visibleProducts.length > 0 ? (
                          <div className="results-split-layout">
                            <div className="results-products-grid">
                              {visibleProducts.slice(0, 6).map((product) => {
                                const price = customerPrice(product.variants?.[0]?.prices || {}, priceAccess);
                                const image = product.images?.[0] || fallbackProductImage;
                                return (
                                  <div 
                                    key={product.id}
                                    className="premium-search-result-card animate-scale-up"
                                    onClick={() => {
                                      navigate('product', product.id);
                                      setSearch('');
                                      setSearchActive(false);
                                    }}
                                  >
                                    <div className="result-img-wrapper">
                                      <img src={image} alt={product.title} />
                                      {product.fabric && <span className="result-fabric-badge">{product.fabric}</span>}
                                    </div>
                                    <div className="result-card-info">
                                      <h4 className="result-product-title">{product.name || product.title}</h4>
                                      <span className="result-product-price">
                                        {price != null && price > 0 ? formatMoney(price) : priceNoticeForAccess(priceAccess)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {visibleProducts.length > 6 && (
                              <button 
                                className="premium-search-view-all-btn" 
                                onClick={() => {
                                  navigate('catalog');
                                  setSearchActive(false);
                                }}
                              >
                                View all {visibleProducts.length} premium products
                                <ArrowRight size={16} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="premium-search-no-results-state">
                            <div className="no-results-icon">🔍</div>
                            <h3>No match found</h3>
                            <p>We couldn't find any premium products for "{search}".</p>
                            <button className="reset-search-btn" onClick={() => setSearch('')}>
                              Try another query
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {menuOpen && !isSharedPage && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          navigate={navigate}
          setCategory={setCategory}
          user={user}
          isAdmin={isAdmin}
          categories={categories}
          priceAccess={priceAccess}
          openAuth={() => setAuthOpen(true)}
          search={search}
          setSearch={setSearch}
          visibleProducts={visibleProducts}
          setCartOpen={setCartOpen}
          cartCount={cartCount}
          favoritesCount={favoritesCount}
          onSignOut={handleSignOut}
        />

      )}

      <main>
        <Suspense fallback={<RouteFallback />}>
          {routeContent}
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
