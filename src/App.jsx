'use client';

/**
 * App Component (Core Entrypoint & Orchestrator)
 * Purpose: Manages Weave365's master client state, authentication sessions, order lists (carts),
 * catalog caching, currency states, and client-side page navigation routing.
 * Houses universal shell items like the top alert bars, navigation headers, sidebar drawers, and the footer.
 */
import { Suspense, lazy, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Bookmark, Search, ShoppingBag, User, ArrowRight } from 'lucide-react';
import { fetchProducts, fetchHeroData, fetchConfigOptions, fetchSupabaseBlogPosts } from './productData.js';
import { blogPosts } from './data/blogPosts.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { adminEmails, serviceablePincodes, storeConfig } from './config.js';
import brandLogo from '../assets/Weave365.svg';
import { fallbackProductImage, formatMoney, customerPrice, useCurrency, CurrencyManager, CURRENCIES } from './storefrontShared.jsx';
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
import { Footer } from './components/Footer.jsx';
import { InternalLinkNetwork } from './components/InternalLinkNetwork.jsx';
import { MobileMenu } from './components/MobileMenu.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { Home, homeCategoryNames } from './views/Home.jsx';
import { Favorites } from './views/Favorites.jsx';


import { Catalog } from './CatalogPage.jsx';
import { ProductDetailWrapper } from './ProductPage.jsx';
import { BulkInquiry } from './views/BulkInquiry.jsx';
import { Admin } from './views/Admin.jsx';
import { Account } from './views/Account.jsx';
import { WholesalePartnerProgramPage } from './views/WholesalePartnerProgramPage.jsx';
import { VendorPartnershipPage } from './views/VendorPartnershipPage.jsx';
import { TrustedPartnerRegistrationPage } from './views/TrustedPartnerRegistrationPage.jsx';
import { ResellerDashboard } from './views/ResellerDashboard.jsx';
import { SharedCatalog } from './views/SharedCatalog.jsx';

import { SharedProductPage } from './views/SharedProductPage.jsx';
import { NewArrivalsPage } from './views/NewArrivalsPage.jsx';
import SeoLandingPage from './views/SeoLandingPage.jsx';
import { PartnerProgramPage } from './views/PartnerProgramPage.jsx';
import { BlogList } from './views/BlogList.jsx';
import { BlogPost } from './views/BlogPost.jsx';
import { AboutPage } from './views/AboutPage.jsx';
import { EarlyAccessPage } from './views/EarlyAccessPage.jsx';
import { ContactPage } from './views/ContactPage.jsx';
import { NotFoundPage } from './views/NotFoundPage.jsx';

import { seoLandingPages } from './data/seoLandingPages.js';


const slugifyPartner = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, '-');
};

export default function App({ initialData = {} }) {
  if (typeof window === 'undefined') {
    console.log('SSR App: initialData status =', initialData?.status, 'products count =', initialData?.products?.length, 'hydrated =', initialData?.hydrated);
  }

  const currentCurrency = useCurrency();
  const activeCurrency = useMemo(() => {
    return CURRENCIES.find(c => c.code === currentCurrency) || CURRENCIES[0];
  }, [currentCurrency]);
  const router = useRouter();
  const pathname = usePathname() || '/';
  const pathSegments = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const route = pathSegments[0] || 'home';
  const productId = route === 'product' ? decodeURIComponent(pathSegments[1] || '') : null;
  const sharedSlug = route === 's' ? decodeURIComponent(pathSegments[1] || '') : null;
  const isSharedProduct = route === 's' && pathSegments[2] === 'p';
  const sharedProductId = isSharedProduct ? decodeURIComponent(pathSegments[3] || '') : null;
  const partnerName = route === 'partner' ? decodeURIComponent(pathSegments[1] || '') : null;
  const blogPostSlug = route === 'blog' ? decodeURIComponent(pathSegments[1] || '') : null;

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
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [vendorOnboarding, setVendorOnboarding] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [pincode, setPincode] = useState('');
  const [codStatus, setCodStatus] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const categoriesRef = useRef(null);
  const partnerNavRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const currencyRef = useRef(null);
  const [categoriesPos, setCategoriesPos] = useState({ top: 0, left: 0 });
  const [partnerNavPos, setPartnerNavPos] = useState({ top: 0, left: 0 });
  const [profilePos, setProfilePos] = useState({ top: 0, left: 0 });
  const [currencyPos, setCurrencyPos] = useState({ top: 0, left: 0 });
  const [searchPos, setSearchPos] = useState({ top: 0, left: 0, width: 0 });
  const [searchActive, setSearchActive] = useState(false);
  useLayoutEffect(() => {
    if (search && searchRef.current && route !== 'wholesale-catalogue') {
      const rect = searchRef.current.getBoundingClientRect();
      setSearchPos({ top: rect.bottom, left: rect.left, width: rect.width });
    } else if (!search) {
      setSearchPos({ top: 0, left: 0, width: 0 });
    }
  }, [search, route]);

  const [heroSlides, setHeroSlides] = useState(() => initialData.heroSlides || []);
  const [blogs, setBlogs] = useState(() => blogPosts);
  const [configOptions, setConfigOptions] = useState(() => (
    initialData.configOptions || { priceRanges: [], categories: [], fabrics: [] }
  ));
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const isAdmin = Boolean(
    (user?.email && adminEmails.includes(String(user.email).toLowerCase())) ||
    buyerProfile?.role === 'admin'
  );
  const priceAccess = useMemo(() => getBuyerAccess(user, buyerProfile), [buyerProfile, user]);
  const visiblePriceMap = useMemo(() => buildVisiblePriceMap(visiblePriceRows), [visiblePriceRows]);
  const pricedProducts = useMemo(
    () => applyVisiblePricesToProducts(products, visiblePriceMap),
    [products, visiblePriceMap],
  );

  useEffect(() => {
    if (route === 'catalog' || route === 'catalogue') {
      router.replace('/wholesale-catalogue' + (typeof window !== 'undefined' ? window.location.search : ''));
    }
  }, [route, router]);

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

    fetchSupabaseBlogPosts()
      .then((dbPosts) => {
        if (!isActive) return;
        setBlogs(() => {
          const slugMap = new Map();
          blogPosts.forEach((post) => slugMap.set(post.slug, post));
          if (dbPosts && dbPosts.length > 0) {
            dbPosts.forEach((post) => slugMap.set(post.slug, post));
          }
          const allPosts = Array.from(slugMap.values());
          if (typeof window !== 'undefined') {
            const deletedSlugs = JSON.parse(localStorage.getItem('deleted_blog_slugs') || '[]');
            return allPosts.filter(b => !deletedSlugs.includes(b.slug));
          }
          return allPosts;
        });
      })
      .catch(console.error);

    return () => {
      isActive = false;
    };
  }, [hasInitialData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'history' in window) {
      window.history.scrollRestoration = 'manual';
    }

    const updateScrolled = () => {
      const scrollPos = window.scrollY || document.scrollingElement?.scrollTop || 0;
      setScrolled(scrollPos > 20);
      setPastHero(scrollPos > 0 && scrollPos > (window.innerHeight - 100));
    };

    window.addEventListener('scroll', updateScrolled, { passive: true });
    updateScrolled();

    return () => {
      window.removeEventListener('scroll', updateScrolled);
    };
  }, []);

  useEffect(() => {
    void CurrencyManager.fetchRates();
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
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthInitialMode('reset-password');
        setAuthOpen(true);
      }
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const deletedSlugs = JSON.parse(localStorage.getItem('deleted_blog_slugs') || '[]');
      if (deletedSlugs.length > 0) {
        setBlogs((prev) => prev.filter(b => !deletedSlugs.includes(b.slug)));
      }
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function hydrateProfile() {
      if (!user) {
        setBuyerProfile(null);
        setVendorOnboarding(null);
        return;
      }

      if (isSupabaseConfigured) {
        await syncProfileFromUser(user);
      }

      const { profile } = await loadProfileForUser(user);
      if (isActive) {
        setBuyerProfile(profile);
        
        if (isSupabaseConfigured && profile?.whatsapp_number) {
          const cleanWhatsapp = String(profile.whatsapp_number).replace(/\D/g, '').slice(-10);
          try {
            const { data: vProfile } = await supabase
              .from('vendor_profiles')
              .select('status, drive_folder_url')
              .eq('whatsapp_number', cleanWhatsapp)
              .maybeSingle();
            
            if (vProfile && isActive) {
              setVendorOnboarding(vProfile);
            } else if (isActive) {
              setVendorOnboarding(null);
            }
          } catch (e) {
            console.error('Error hydrating vendor profile:', e);
            if (isActive) setVendorOnboarding(null);
          }
        } else if (isActive) {
          setVendorOnboarding(null);
        }
      }
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
      if (!priceAccess.canViewPrices || priceAccess.priceGroup === 'guest') {
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
    if (searchActive) {
      document.body.classList.add('search-lock');
    } else {
      document.body.classList.remove('search-lock');
    }
    return () => {
      document.body.classList.remove('search-lock');
    };
  }, [searchActive]);

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

  // Sync URL query params to filter states (e.g. ?category=dupatta)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (route !== 'wholesale-catalogue') return;

    const params = new URLSearchParams(window.location.search);

    const catParam = params.get('category');
    if (catParam) {
      const matched = categories.find(c => c.toLowerCase() === catParam.toLowerCase());
      if (matched && matched !== category) {
        setCategory(matched);
      } else if (!matched && catParam.toLowerCase() === 'all' && category !== 'All') {
        setCategory('All');
      }
    } else if (category !== 'All' && !params.has('category')) {
      setCategory('All');
    }

    const fabricParam = params.get('fabric');
    if (fabricParam) {
      const matched = fabrics.find(f => f.toLowerCase() === fabricParam.toLowerCase());
      if (matched && matched !== fabric) {
        setFabric(matched);
      } else if (!matched && fabricParam.toLowerCase() === 'all' && fabric !== 'All') {
        setFabric('All');
      }
    } else if (fabric !== 'All' && !params.has('fabric')) {
      setFabric('All');
    }
  }, [pathname, route, categories, fabrics]);

  // Sync filter states back to URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (route !== 'wholesale-catalogue') return;

    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (category && category !== 'All') {
      if (params.get('category') !== category.toLowerCase()) {
        params.set('category', category.toLowerCase());
        changed = true;
      }
    } else {
      if (params.has('category')) {
        params.delete('category');
        changed = true;
      }
    }

    if (fabric && fabric !== 'All') {
      if (params.get('fabric') !== fabric.toLowerCase()) {
        params.set('fabric', fabric.toLowerCase());
        changed = true;
      }
    } else {
      if (params.has('fabric')) {
        params.delete('fabric');
        changed = true;
      }
    }

    if (changed) {
      const newSearch = params.toString();
      const newPath = `/wholesale-catalogue${newSearch ? '?' + newSearch : ''}`;
      window.history.replaceState(null, '', newPath);
    }
  }, [category, fabric, route]);

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
    } else if (nextRoute === 'blog' && productId) {
      href = `/blog/${productId}`;
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

    if (route === 'wholesale-catalogue' || route === 'partner') {
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
          blogs={blogs}
          setBlogs={setBlogs}
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

    if (route === 'wholesale-partner-program') {

      return <WholesalePartnerProgramPage openAuth={() => setAuthOpen(true)} />;
    }

    if (route === 'new-arrivals') {
      return (
        <NewArrivalsPage
          products={pricedProducts}
          status={status}
          error={error}
          navigate={navigate}
          addToCart={addToCart}
          toggleFavorite={toggleFavorite}
          favoriteKeys={favoriteKeySet}
          priceAccess={priceAccess}
          openAuth={() => setAuthOpen(true)}
        />
      );
    }

    if (route === 'sourcing-partners' || route === 'white-label-brands') {
      return <PartnerProgramPage type={route} navigate={navigate} />;
    }

    if (seoLandingPages[route]) {
      return (
        <SeoLandingPage
          slug={route}
          products={pricedProducts}
          status={status}
          error={error}
          navigate={navigate}
          addToCart={addToCart}
          toggleFavorite={toggleFavorite}
          favoriteKeys={favoriteKeySet}
          priceAccess={priceAccess}
          openAuth={() => setAuthOpen(true)}
        />
      );
    }

    if (route === 'contact') return <ContactPage navigate={navigate} />;

    if (route === 'about') return <AboutPage navigate={navigate} />;

    if (route === 'early-access') return <EarlyAccessPage navigate={navigate} />;

    if (route === 'vendor-partnership') return <VendorPartnershipPage />;

    if (route === 'trusted-partner-registration') return <TrustedPartnerRegistrationPage />;

    if (route === 's') {
      if (isSharedProduct) {
        return <SharedProductPage products={pricedProducts} slug={sharedSlug} productId={sharedProductId} navigate={navigate} />;
      }
      return <SharedCatalog products={pricedProducts} slug={sharedSlug} navigate={navigate} />;
    }


    if (route === 'blog') {
      if (blogPostSlug) {
        return <BlogPost postSlug={blogPostSlug} navigate={navigate} blogs={blogs} />;
      }
      return <BlogList navigate={navigate} blogs={blogs} />;
    }

    return <NotFoundPage />;
  })();

  return (
    <>
      {!isSharedPage && (
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
              e.preventDefault();
              navigate('home');
            }}
          >
            <img src={brandLogoSrc} alt={storeConfig.name} className="brand-logo" />
          </a>
          <nav className="main-nav">
            <button 
              className={route === 'new-arrivals' ? 'active' : ''} 
              onClick={() => navigate('new-arrivals')}
            >
              NEW ARRIVALS
            </button>
            <button 
              className={route === 'wholesale-catalogue' ? 'active' : ''} 
              onClick={() => navigate('wholesale-catalogue')}
            >
              CATALOGUE
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
                CATEGORIES <ChevronDown size={14} className={dropdownOpen === 'categories' ? 'rotate' : ''} />
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
                        navigate('catalogue');
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
            <div className="nav-item-dropdown" ref={partnerNavRef}>
              <button
                className={dropdownOpen === 'partner' || route === 'sourcing-partners' || route === 'white-label-brands' ? 'active' : ''}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dropdownOpen !== 'partner' && partnerNavRef.current) {
                    const rect = partnerNavRef.current.getBoundingClientRect();
                    setPartnerNavPos({ top: rect.bottom, left: rect.left + rect.width / 2 });
                  }
                  setDropdownOpen(dropdownOpen === 'partner' ? null : 'partner');
                }}
              >
                PARTNERS <ChevronDown size={14} className={dropdownOpen === 'partner' ? 'rotate' : ''} />
              </button>
              {dropdownOpen === 'partner' && createPortal(
                <div 
                  className="dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: partnerNavPos.top,
                    left: partnerNavPos.left,
                    transform: 'translateX(-50%) translateY(12px)',
                    zIndex: 10000
                  }}
                >
                  {[
                    { name: 'Sourcing Partners', slug: 'sourcing-partners' },
                    { name: 'White Label Brands', slug: 'white-label-brands' },
                  ].map((item) => (
                    <button
                      key={item.slug}
                      onClick={() => {
                        navigate(item.slug);
                        setDropdownOpen(null);
                      }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>
            <button 
              className={route === 'about' ? 'active' : ''} 
              onClick={() => navigate('about')}
            >
              ABOUT
            </button>
          </nav>

          <button className="icon-button mobile-search-button" type="button" onClick={() => navigate('catalogue')}>
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
            
            <div className="nav-item-dropdown" ref={profileRef}>
              <button 
                className={`premium-icon-btn profile-trigger ${dropdownOpen === 'profile' ? 'active' : ''}`}
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (dropdownOpen !== 'profile' && profileRef.current) {
                    const rect = profileRef.current.getBoundingClientRect();
                    setProfilePos({ top: rect.bottom, left: rect.left + rect.width / 2 });
                  }
                  setDropdownOpen(dropdownOpen === 'profile' ? null : 'profile');
                }}
                aria-label="Profile"
              >
                <User size={18} strokeWidth={1.5} />
              </button>
              {dropdownOpen === 'profile' && createPortal(
                <div 
                  className="dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: profilePos.top,
                    left: profilePos.left,
                    transform: 'translateX(-50%) translateY(12px)',
                    zIndex: 10000
                  }}
                >
                  {user ? (
                    <>
                      {buyerProfile?.full_name && (
                        <div className="profile-dropdown-greeting">
                          Hello, {buyerProfile.full_name.split(' ')[0]}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          navigate('account');
                          setDropdownOpen(null);
                        }}
                      >
                        My Account
                      </button>
                      {vendorOnboarding?.status === 'approved' && vendorOnboarding?.drive_folder_url && (
                        <button
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
                        <button
                          onClick={() => {
                            navigate('admin');
                            setDropdownOpen(null);
                          }}
                        >
                          Admin Panel
                        </button>
                      )}
                      <button
                        onClick={() => {
                          navigate('favorites');
                          setDropdownOpen(null);
                        }}
                      >
                        Saved Items {favoritesCount > 0 && `(${favoritesCount})`}
                      </button>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setDropdownOpen(null);
                        }}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setAuthOpen(true);
                        setDropdownOpen(null);
                      }}
                    >
                      Sign In / Register
                    </button>
                  )}
                </div>,
                document.body
              )}
            </div>
            
            <button 
              className="premium-icon-btn cart-btn" 
              type="button" 
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartProducts.length > 0 && <span className="premium-badge">{cartProducts.length}</span>}
            </button>

            <div className="nav-item-dropdown" ref={currencyRef}>
              <button 
                className={`premium-icon-btn navbar-currency-trigger ${dropdownOpen === 'currency' ? 'active' : ''}`}
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (dropdownOpen !== 'currency' && currencyRef.current) {
                    const rect = currencyRef.current.getBoundingClientRect();
                    setCurrencyPos({ top: rect.bottom, left: rect.left + rect.width / 2 });
                  }
                  setDropdownOpen(dropdownOpen === 'currency' ? null : 'currency');
                }}
                aria-label="Change Currency"
              >
                <span className="navbar-currency-code">{activeCurrency.code}</span>
                <ChevronDown size={11} className={dropdownOpen === 'currency' ? 'rotate' : ''} />
              </button>
              {dropdownOpen === 'currency' && createPortal(
                <div 
                  className="dropdown-menu currency-dropdown-menu"
                  style={{
                    position: 'fixed',
                    top: currencyPos.top,
                    left: currencyPos.left,
                    transform: 'translateX(-50%) translateY(12px)',
                    zIndex: 10000
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <button
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
                </div>,
                document.body
              )}
            </div>
          </div>

        </header>
      )}

      {searchActive && !isSharedPage && (
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
                          <button onClick={() => { navigate('catalogue'); setSearchActive(false); }}>
                            <span>Browse All Collections</span>
                            <ArrowRight size={14} />
                          </button>
                        </li>
                        <li>
                          <button onClick={() => { navigate('wholesale-partner-program'); setSearchActive(false); }}>
                            <span>Wholesale & Reseller Partner Program</span>
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
                                  <img src={image} alt={product.title} loading="lazy" />
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
                              navigate('catalogue');
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
          vendorOnboarding={vendorOnboarding}
        />

      )}

      <main>
        {routeContent}
      </main>

      {!isSharedPage && route !== 'admin' && <InternalLinkNetwork navigate={navigate} setCategory={setCategory} />}
      {!isSharedPage && route !== 'admin' && <Footer navigate={navigate} />}
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
        onClose={() => { setAuthOpen(false); setAuthInitialMode('login'); }}
        user={user}
        setUser={setUser}
        buyerProfile={buyerProfile}
        setBuyerProfile={setBuyerProfile}
        initialMode={authInitialMode}
      />
    </>
  );
}
