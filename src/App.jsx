'use client';

/**
 * App Component (Core Entrypoint & Orchestrator)
 * Purpose: Manages Weave365's master client state, authentication sessions, order lists (carts),
 * catalog caching, currency states, and client-side page navigation routing.
 * Houses universal shell items like the top alert bars, navigation headers, sidebar drawers, and the footer.
 */
import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Bookmark, Search, ShoppingBag, User, ArrowRight, LogOut } from 'lucide-react';
import { fetchProducts, fetchHeroData, fetchConfigOptions, fetchSupabaseBlogPosts, fetchSupabasePageSeoSettings } from './productData.js';
import { blogPosts } from './data/blogPosts.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { DropdownPortal } from './components/DropdownPortal.jsx';
import { SearchOverlay } from './components/SearchOverlay.jsx';
import { SiteHeader } from './components/SiteHeader.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { seoCategoryRoutes, seoCategoryMap, NON_PRODUCT_ROUTES, getProductCategorySlug } from './config.js';
import { sortByStockDateDesc } from './utils/sortProducts.js';
import { adminEmails, serviceablePincodes, storeConfig } from './config.js';
import brandLogo from '../assets/Weave365.svg';
import { fallbackProductImage, formatMoney, customerPrice, useCurrency, CurrencyManager, CURRENCIES, checkProductPriceInRange } from './storefrontShared.jsx';
import { assetSrc } from './utils/assetSrc.js';

import {
  parseCartVariantCode,
  encodeCartVariantCode,
  upsertCart,
  upsertCartSelections,
  changeCartColor,
  loadSavedState,
  persistCart,
  persistFavorites,
  readLocal,
} from './utils/cartHelpers.js';
import { loadProfileForUser, syncProfileFromUser } from './utils/profileHelpers.js';
import { getBuyerAccess, priceNoticeForAccess } from './utils/buyerAccess.js';
import { useDemoPriceGroup, overrideDemoPriceAccess } from './utils/demoHelper.js';
import { applyVisiblePricesToProducts, buildVisiblePriceMap, loadVisiblePrices } from './services/priceService.js';
import { RouteFallback } from './components/RouteFallback.jsx';
import { Footer } from './components/Footer.jsx';
import { InternalLinkNetwork } from './components/InternalLinkNetwork.jsx';
import { MobileMenu } from './components/MobileMenu.jsx';
import { AppLink } from './components/AppLink.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { Home, homeCategoryNames } from './views/Home.jsx';
import { Favorites } from './views/Favorites.jsx';


import { Catalog } from './CatalogPage.jsx';
import { ProductDetailWrapper } from './ProductPage.jsx';
import ProductPageSkeleton from './components/ProductPageSkeleton.jsx';
import { BulkInquiry } from './views/BulkInquiry.jsx';
import OrderTracking from './views/OrderTracking.jsx';
import { Admin } from './views/Admin.jsx';
import { Account } from './views/Account.jsx';
import { WholesalePartnerProgramPage } from './views/WholesalePartnerProgramPage.jsx';
import { VendorPartnershipPage } from './views/VendorPartnershipPage.jsx';
import { TrustedPartnerRegistrationPage } from './views/TrustedPartnerRegistrationPage.jsx';
import { ResellerDashboard } from './views/ResellerDashboard.jsx';

import { NewArrivalsPage } from './views/NewArrivalsPage.jsx';
import SeoLandingPage from './views/SeoLandingPage.jsx';
import { PartnerProgramPage } from './views/PartnerProgramPage.jsx';
import { BlogList } from './views/BlogList.jsx';
import { BlogPost } from './views/BlogPost.jsx';
import { AboutPage } from './views/AboutPage.jsx';
import { ReviewsPage } from './views/ReviewsPage.jsx';
import { ReviewStrip } from './components/ReviewStrip.jsx';
import { EarlyAccessPage } from './views/EarlyAccessPage.jsx';
import { ContactPage } from './views/ContactPage.jsx';
import { OurOfferings } from './views/OurOfferings.jsx';
import { NotFoundPage } from './views/NotFoundPage.jsx';
import { DisclaimerPage } from './views/DisclaimerPage.jsx';
import { ShippingDeliveryPage } from './views/ShippingDeliveryPage.jsx';
import { ReturnsCancellationPage } from './views/ReturnsCancellationPage.jsx';
import { PrivacySecurityPage } from './views/PrivacySecurityPage.jsx';
import { TermsConditionsPage } from './views/TermsConditionsPage.jsx';

import { seoLandingPages } from './data/seoLandingPages.js';


const slugifyPartner = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, '-');
};

function isProductSoldAsPc(product) {
  if (!product) return false;
  const pcSetVal = String(product.raw?.['Pc / Set'] || '').trim().toLowerCase();
  if (pcSetVal) return pcSetVal === 'pc';
  const category = String(product.category || '').trim().toLowerCase();
  return category === 'saree' || category === 'fabric' || category === 'under 999';
}

function normalizeWholesaleCart(cart, productsById) {
  let changed = false;
  const nextCart = [];

  // Group cart items by product ID
  const groups = {};
  cart.forEach(item => {
    if (!groups[item.productGroupKey]) {
      groups[item.productGroupKey] = [];
    }
    groups[item.productGroupKey].push(item);
  });

  Object.entries(groups).forEach(([productId, items]) => {
    const product = productsById.get(productId);
    if (!product) {
      nextCart.push(...items);
      return;
    }

    if (isProductSoldAsPc(product)) {
      nextCart.push(...items);
      return;
    }

    // Find the max quantity in this group
    let maxQty = 0;
    items.forEach(item => {
      if (item.quantity > maxQty) maxQty = item.quantity;
    });
    if (maxQty <= 0) maxQty = 1;

    const colorOptions = product.colorOptions || [];
    if (colorOptions.length > 0) {
      colorOptions.forEach(option => {
        const variant = product.variants.find(v => v.color === option.name) || product.variants[0];
        const cartVariantCode = encodeCartVariantCode(variant.code, option.name);
        const existing = items.find(item => item.variantCode === cartVariantCode);
        
        if (!existing) {
          nextCart.push({
            productGroupKey: productId,
            variantCode: cartVariantCode,
            quantity: maxQty
          });
          changed = true;
        } else {
          nextCart.push({
            ...existing,
            quantity: maxQty
          });
          if (existing.quantity !== maxQty) {
            changed = true;
          }
        }
      });
    } else {
      const variant = product.variants[0];
      const cartVariantCode = encodeCartVariantCode(variant.code);
      const existing = items.find(item => item.variantCode === cartVariantCode);
      if (!existing) {
        nextCart.push({
          productGroupKey: productId,
          variantCode: cartVariantCode,
          quantity: maxQty
        });
        changed = true;
      } else {
        nextCart.push({
          ...existing,
          quantity: maxQty
        });
        if (existing.quantity !== maxQty) {
          changed = true;
        }
      }
    }
  });

  return { nextCart, changed };
}

// seoCategoryRoutes imported from config.js

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
  const [pendingRoute, setPendingRoute] = useState(null);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isProductPageReady, setIsProductPageReady] = useState(true);

  const isProductPathname = useCallback((path) => {
    const segments = path.split('/').filter(Boolean);
    return segments.length === 2 && !NON_PRODUCT_ROUTES.has(segments[0]) && !seoLandingPages[segments[0]];
  }, []);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setPendingRoute(null);
    if (isProductPathname(pathname)) {
      setIsProductPageReady(false);
    }
  }
  
  const isProductRoute = pathSegments.length === 2 && !NON_PRODUCT_ROUTES.has(pathSegments[0]) && !seoLandingPages[pathSegments[0]];
  const route = pendingRoute || (isProductRoute ? 'product' : (pathSegments[0] || 'home'));
  const productId = route === 'product' ? decodeURIComponent(pathSegments[1] || '') : null;
  const inquiryId = route === 'order-tracking' ? decodeURIComponent(pathSegments[1] || '') : null;

  const partnerName = route === 'partner' ? decodeURIComponent(pathSegments[1] || '') : null;
  const blogPostSlug = route === 'blog' && pathSegments[1] !== 'category' ? decodeURIComponent(pathSegments[1] || '') : null;
  const isSeoCategoryRoute = Object.keys(seoCategoryRoutes).includes(route);

  const hasInitialData = Boolean(initialData?.hydrated);
  const brandLogoSrc = assetSrc(brandLogo);
  const [products, setProducts] = useState(() => initialData.products || []);
  const [visiblePriceRows, setVisiblePriceRows] = useState([]);
  const [status, setStatus] = useState(() => initialData.status || (initialData.products ? 'ready' : 'loading'));
  const [error, setError] = useState(() => initialData.error || '');
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
  const [searchPos, setSearchPos] = useState({ top: 0, left: 0, width: 0 });
  const [searchActive, setSearchActive] = useState(false);


  const [heroSlides, setHeroSlides] = useState(() => initialData.heroSlides || []);
  const [blogs, setBlogs] = useState(() => {
    const serverBlogs = initialData.dbPosts || [];
    const slugMap = new Map();
    blogPosts.forEach((post) => slugMap.set(post.slug, post));
    serverBlogs.forEach((post) => slugMap.set(post.slug, post));
    return Array.from(slugMap.values());
  });
  const [configOptions, setConfigOptions] = useState(() => (
    initialData.configOptions || { priceRanges: [], categories: [], fabrics: [], weaves: [] }
  ));
  const [pageSeoSettings, setPageSeoSettings] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const isAdmin = Boolean(
    (user?.email && adminEmails.includes(String(user.email).toLowerCase())) ||
    buyerProfile?.role === 'admin'
  );
  const demoPriceGroup = useDemoPriceGroup(user);
  const priceAccess = useMemo(() => {
    const access = getBuyerAccess(user, buyerProfile);
    return overrideDemoPriceAccess(user, buyerProfile, access);
  }, [buyerProfile, user, demoPriceGroup]);
  const [prevCanViewPrices, setPrevCanViewPrices] = useState(priceAccess.canViewPrices);
  if (priceAccess.canViewPrices !== prevCanViewPrices) {
    setPrevCanViewPrices(priceAccess.canViewPrices);
    if (!priceAccess.canViewPrices && priceRange !== 'All') {
      setPriceRange('All');
    }
  }
  const visiblePriceMap = useMemo(() => buildVisiblePriceMap(visiblePriceRows), [visiblePriceRows]);
  const pricedProducts = useMemo(
    () => applyVisiblePricesToProducts(products, visiblePriceMap),
    [products, visiblePriceMap],
  );

  const productsById = useMemo(
    () => new Map(pricedProducts.map((product) => [product.id, product])),
    [pricedProducts],
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

    if (isSupabaseConfigured) {
      fetchSupabasePageSeoSettings()
        .then((settings) => {
          if (!isActive) return;
          setPageSeoSettings(settings);
        })
        .catch(console.error);
    }

    return () => {
      isActive = false;
    };
  }, [hasInitialData]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'history' in window) {
      window.history.scrollRestoration = 'auto';
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

  const weaves = useMemo(() => {
    if (configOptions.weaves && configOptions.weaves.length > 0) {
      return ['All', ...configOptions.weaves];
    }
    const set = new Set();
    pricedProducts.forEach(p => {
      if (p.weave) set.add(p.weave.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [pricedProducts, configOptions.weaves]);

  const searchParams = useSearchParams();

  const category = useMemo(() => {
    if (route !== 'wholesale-catalogue' && !isSeoCategoryRoute) return 'All';
    if (isSeoCategoryRoute) return seoCategoryRoutes[route];
    const catParam = searchParams?.get('category');
    if (catParam) {
      const matched = categories.find(c => c.toLowerCase() === catParam.toLowerCase());
      if (matched) return matched;
    }
    return 'All';
  }, [route, isSeoCategoryRoute, searchParams, categories]);

  const activeCategory = isSeoCategoryRoute ? seoCategoryRoutes[route] : category;

  const fabric = useMemo(() => {
    if (route !== 'wholesale-catalogue' && !isSeoCategoryRoute) return 'All';
    const fabricParam = searchParams?.get('fabric');
    if (fabricParam) {
      const matched = fabrics.find(f => f.toLowerCase() === fabricParam.toLowerCase());
      if (matched) return matched;
    }
    return 'All';
  }, [route, isSeoCategoryRoute, searchParams, fabrics]);

  const weave = useMemo(() => {
    if (route !== 'wholesale-catalogue' && !isSeoCategoryRoute) return 'All';
    const weaveParam = searchParams?.get('weave');
    if (weaveParam) {
      const matched = weaves.find(w => w.toLowerCase() === weaveParam.toLowerCase());
      if (matched) return matched;
    }
    return 'All';
  }, [route, isSeoCategoryRoute, searchParams, weaves]);

  const urlSearch = useMemo(() => {
    if (route !== 'wholesale-catalogue' && !isSeoCategoryRoute) return '';
    return searchParams?.get('search') || '';
  }, [route, isSeoCategoryRoute, searchParams]);

  const [localSearch, setLocalSearch] = useState(urlSearch);

  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  const search = localSearch;

  const updateQueryParam = useCallback((name, value, defaultValue = 'All') => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (value && value !== defaultValue) {
      params.set(name, name === 'search' ? value : value.toLowerCase());
    } else {
      params.delete(name);
    }
    const newSearch = params.toString();
    const basePath = isSeoCategoryRoute ? `/${route}` : '/wholesale-catalogue';
    const newUrl = basePath + (newSearch ? `?${newSearch}` : '');
    router.replace(newUrl, { scroll: false });
  }, [router, isSeoCategoryRoute, route]);

  useEffect(() => {
    if (route !== 'wholesale-catalogue' && !isSeoCategoryRoute) return undefined;
    const timer = setTimeout(() => {
      if (localSearch !== urlSearch) {
        updateQueryParam('search', localSearch, '');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearch, urlSearch, updateQueryParam, route, isSeoCategoryRoute]);

  const setCategory = useCallback((val) => {
    if (isSeoCategoryRoute) return;
    updateQueryParam('category', val, 'All');
  }, [updateQueryParam, isSeoCategoryRoute]);

  const setFabric = useCallback((val) => {
    updateQueryParam('fabric', val, 'All');
  }, [updateQueryParam]);

  const setWeave = useCallback((val) => {
    updateQueryParam('weave', val, 'All');
  }, [updateQueryParam]);

  const setSearch = useCallback((val) => {
    setLocalSearch(val);
  }, []);

  useLayoutEffect(() => {
    if (search && searchRef.current && route !== 'wholesale-catalogue') {
      const rect = searchRef.current.getBoundingClientRect();
      setSearchPos({ top: rect.bottom, left: rect.left, width: rect.width });
    } else if (!search) {
      setSearchPos({ top: 0, left: 0, width: 0 });
    }
  }, [search, route]);

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
  }, [search, setSearch]);

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

  // Normalize wholesale cart items to complete sets
  useEffect(() => {
    if (priceAccess?.priceGroup === 'wholesale' && cart.length > 0 && productsById.size > 0) {
      let needsNormalization = false;
      
      const groups = {};
      cart.forEach(item => {
        if (!groups[item.productGroupKey]) {
          groups[item.productGroupKey] = [];
        }
        groups[item.productGroupKey].push(item);
      });

      for (const [productId, items] of Object.entries(groups)) {
        const product = productsById.get(productId);
        if (!product) continue;

        if (isProductSoldAsPc(product)) continue;

        let targetQty = items[0]?.quantity || 1;
        
        const colorOptions = product.colorOptions || [];
        if (colorOptions.length > 0) {
          if (items.length !== colorOptions.length) {
            needsNormalization = true;
            break;
          }
          const allMatch = items.every(item => item.quantity === targetQty);
          if (!allMatch) {
            needsNormalization = true;
            break;
          }
        } else {
          if (items.length !== 1 || items[0].quantity !== targetQty) {
            needsNormalization = true;
            break;
          }
        }
      }

      if (needsNormalization) {
        setCart((currentCart) => {
          const { nextCart, changed } = normalizeWholesaleCart(currentCart, productsById);
          if (changed && user) {
            void persistCart(nextCart, user.id);
          }
          return changed ? nextCart : currentCart;
        });
      }
    }
  }, [priceAccess?.priceGroup, cart, productsById, user]);

  const deferredSearch = useDeferredValue(localSearch);
  const searchTerm = useMemo(() => deferredSearch.trim().toLowerCase(), [deferredSearch]);

  const visibleProducts = useMemo(() => {
    const productsWithIndex = pricedProducts.map((p, idx) => ({ ...p, _originalIndex: idx }));
    const filtered = productsWithIndex.filter((product) => {
      const variantCodes = (product.variants || []).map((v) => v.code).join(' ');
      const text = [
        product.title,
        product.fabric,
        product.work,
        product.occasion,
        product.category,
        product.groupKey,
        product.partner,
        product.weave,
        variantCodes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = text.includes(searchTerm);
      const matchesCategory =
        activeCategory === 'All' ||
        (activeCategory === 'New Arrivals' && product.isNew) ||
        (activeCategory === 'Bestsellers' && product.isTopSeller) ||
        product.fabric === activeCategory ||
        product.category === activeCategory;
      const matchesPrice = checkProductPriceInRange(product, priceRange, priceAccess);
      const matchesFabric = fabric === 'All' ||
        (product.fabric && product.fabric.trim() === fabric.trim());
      const matchesWeave = weave === 'All' ||
        (product.weave && product.weave.trim().toLowerCase() === weave.trim().toLowerCase());
      return matchesSearch && matchesCategory && matchesPrice && matchesFabric && matchesWeave && !product.isArchived;
    });

    // Sort by stockInDate descending; tie-breaker: reverse sheet order (latest first)
    return sortByStockDateDesc(filtered);
  }, [activeCategory, priceRange, fabric, weave, pricedProducts, searchTerm, priceAccess]);



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

    const isWholesale = priceAccess?.priceGroup === 'wholesale';
    const isSoldAsPc = isProductSoldAsPc(product);

    setCart((currentCart) => {
      let next;
      if (isWholesale && !isSoldAsPc) {
        const colorOptions = product.colorOptions || [];
        const selections = colorOptions.length > 0
          ? colorOptions.map((option) => {
              const varItem = product.variants.find((v) => v.color === option.name) || product.variants[0];
              return {
                variant: varItem,
                quantity: quantity,
                colorName: option.name,
                image: option.image,
              };
            })
          : [{ variant: product.variants[0], quantity: quantity }];
        
        next = upsertCartSelections(currentCart, product, selections);
      } else {
        next = upsertCart(currentCart, product, variant, quantity, colorSelection);
      }
      void persistCart(next, user.id);
      return next;
    });
    setCartOpen(true);
  }, [user, priceAccess?.priceGroup]);

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
      const isWholesale = priceAccess?.priceGroup === 'wholesale';
      const product = productsById.get(item.productGroupKey);
      const isSoldAsPc = isProductSoldAsPc(product);
      let next;
      if (isWholesale && !isSoldAsPc) {
        if (quantity <= 0) {
          next = currentCart.filter((entry) => entry.productGroupKey !== item.productGroupKey);
        } else {
          next = currentCart.map((entry) => {
            if (entry.productGroupKey === item.productGroupKey) {
              return { ...entry, quantity };
            }
            return entry;
          });
        }
      } else {
        next = currentCart.reduce((acc, entry) => {
          const matches = entry.productGroupKey === item.productGroupKey && entry.variantCode === item.variantCode;
          const newQty = matches ? quantity : entry.quantity;
          if (newQty > 0) {
            acc.push(matches ? { ...entry, quantity: newQty } : entry);
          }
          return acc;
        }, []);
      }
      if (user) {
        void persistCart(next, user.id);
      }
      return next;
    });
  }, [user, priceAccess?.priceGroup, productsById]);
 
  const removeProduct = useCallback((productGroupKey) => {
    setCart((currentCart) => {
      const next = currentCart.filter((entry) => entry.productGroupKey !== productGroupKey);
      if (user) {
        void persistCart(next, user.id);
      }
      return next;
    });
  }, [user]);


  const addCartColor = useCallback((item, color) => {
    if (!color?.name) return;

    // Check if there is an item in the cart for this product that has 'Select Color'
    const unselectedItem = cartProducts.find(
      (entry) => entry.productGroupKey === item.productGroupKey && entry.selectedColorName === 'Select Color'
    );

    if (unselectedItem) {
      setCart((currentCart) => {
        const next = changeCartColor(currentCart, unselectedItem, color.name);
        void persistCart(next, user?.id);
        return next;
      });
    } else {
      addCartSelections(item.product, [{
        variant: item.variant,
        quantity: 1,
        colorName: color.name,
        image: color.image,
      }]);
    }
  }, [cartProducts, addCartSelections, user]);

  const checkPincode = useCallback(() => {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }, [pincode]);

  const navigate = useCallback((nextRoute, productId = null, shopName = null, navOptions = {}) => {
    let href = `/${nextRoute}`;
    if (nextRoute === 'product') {
      const catSlug = getProductCategorySlug(productId);
      href = `/${catSlug}/${productId}`;
    } else if (nextRoute === 'order-tracking') {
      href = `/order-tracking/${productId}`;
    } else if (nextRoute === 'partner') {
      href = `/partner/${encodeURIComponent(slugifyPartner(productId))}`;
    } else if (nextRoute === 'blog' && productId) {
      href = `/blog/${productId}`;
    } else if (nextRoute === 'home') {
      href = '/';
    } else if (nextRoute === 'wholesale-catalogue' || nextRoute === 'catalogue') {
      const params = new URLSearchParams();
      const currentSearch = navOptions.search !== undefined ? navOptions.search : search;
      const currentCategory = navOptions.category !== undefined ? navOptions.category : category;
      const currentFabric = navOptions.fabric !== undefined ? navOptions.fabric : fabric;
      const currentWeave = navOptions.weave !== undefined ? navOptions.weave : weave;

      // seoCategoryMap imported from config.js

      const isCleanCategory = currentCategory && currentCategory !== 'All' && 
                             (!currentSearch || currentSearch.trim() === '') && 
                             (!currentFabric || currentFabric === 'All') && 
                             (!currentWeave || currentWeave === 'All');

      if (isCleanCategory && seoCategoryMap[currentCategory.toLowerCase()]) {
        href = `/${seoCategoryMap[currentCategory.toLowerCase()]}`;
      } else {
        if (currentSearch && currentSearch.trim() !== '') {
          params.set('search', currentSearch);
        }
        if (currentCategory && currentCategory !== 'All') {
          params.set('category', currentCategory.toLowerCase());
        }
        if (currentFabric && currentFabric !== 'All') {
          params.set('fabric', currentFabric.toLowerCase());
        }
        if (currentWeave && currentWeave !== 'All') {
          params.set('weave', currentWeave.toLowerCase());
        }
        const searchStr = params.toString();
        href = `/wholesale-catalogue${searchStr ? '?' + searchStr : ''}`;
      }
    }

    const targetPath = href.split('?')[0];
    const isTargetProduct = isProductPathname(targetPath);
    const targetSegment = isTargetProduct ? 'product' : (href.split('/').filter(Boolean)[0] || 'home').split('?')[0];
    const cleanTargetPath = targetPath.replace(/\/$/, '') || '/';
    const cleanPathname = pathname.replace(/\/$/, '') || '/';


    if (cleanTargetPath !== cleanPathname) {
      setPendingRoute(targetSegment);
      if (targetSegment === 'product') {
        setIsProductPageReady(false);
      }
    } else {
      setPendingRoute(null);
    }

    setTimeout(() => {
      router.push(href);
    }, 300);

    setMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [router, pathname, search, category, fabric, weave]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__appNavigate = navigate;
    }
  }, [navigate]);

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
          blogs={blogs}
        />
      );
    }

    if (route === 'wholesale-catalogue' || route === 'catalogue' || route === 'partner' || isSeoCategoryRoute) {
      const partnerFilteredProducts = route === 'partner'
        ? visibleProducts.filter(p => p.partner && slugifyPartner(p.partner) === partnerName)
        : visibleProducts;

      const pluralCategory = activeCategory === 'Under 999' 
        ? activeCategory 
        : (activeCategory.endsWith('s') ? activeCategory : `${activeCategory}s`);
      const catalogTitle = isSeoCategoryRoute 
        ? `Wholesale Banarasi ${pluralCategory}`
        : route === 'partner' 
          ? `${products.find(p => p.partner && slugifyPartner(p.partner) === partnerName)?.partner || (partnerName ? partnerName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '')}'s Collection` 
          : 'Wholesale Catalogue';

      return (
        <Catalog
          title={catalogTitle}
          products={partnerFilteredProducts}
          status={status}
          error={error}
          categories={categories}
          category={activeCategory}
          setCategory={setCategory}
          fabrics={fabrics}
          fabric={fabric}
          setFabric={setFabric}
          weaves={weaves}
          weave={weave}
          setWeave={setWeave}
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
          isTransitioning={!!pendingRoute}
          pageSeoSettings={pageSeoSettings}
        />
      );
    }

    if (route === 'product') {
      const showSkeleton = !!pendingRoute || !isProductPageReady;
      return (
        <div style={{ position: 'relative', minHeight: '80vh' }}>
          {showSkeleton && <ProductPageSkeleton />}
          <div style={{ display: showSkeleton ? 'none' : 'block' }}>
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
              user={user}
              onReady={() => setIsProductPageReady(true)}
            />
          </div>
        </div>
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

    if (route === 'order-tracking') {
      return (
        <OrderTracking
          inquiryId={inquiryId}
          products={pricedProducts}
          navigate={navigate}
          user={user}
        />
      );
    }

    if (route === 'admin') {
      return (
        <ErrorBoundary>
          <Admin
            user={user}
            buyerProfile={buyerProfile}
            onProfileChange={setBuyerProfile}
            openAuth={() => setAuthOpen(true)}
            blogs={blogs}
            setBlogs={setBlogs}
            products={pricedProducts}
          />
        </ErrorBoundary>
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
          isTransitioning={!!pendingRoute}
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
    
    if (route === 'reviews') return <ReviewsPage navigate={navigate} user={user} />;

    if (route === 'early-access') return <EarlyAccessPage navigate={navigate} />;

    if (route === 'disclaimer') return <DisclaimerPage navigate={navigate} />;

    if (route === 'shipping-delivery') return <ShippingDeliveryPage navigate={navigate} />;

    if (route === 'returns-cancellation') return <ReturnsCancellationPage navigate={navigate} />;

    if (route === 'privacy-security') return <PrivacySecurityPage navigate={navigate} />;

    if (route === 'terms-conditions') return <TermsConditionsPage navigate={navigate} />;

    if (route === 'weaver-onboarding') return <VendorPartnershipPage />;

    if (route === 'weaver-registration') return <TrustedPartnerRegistrationPage />;




    if (route === 'blog') {
      if (blogPostSlug) {
        return <BlogPost postSlug={blogPostSlug} navigate={navigate} blogs={blogs} />;
      }
      return <BlogList navigate={navigate} blogs={blogs} />;
    }

    if (route === 'our-offerings') return <OurOfferings navigate={navigate} openAuth={() => setAuthOpen(true)} />;

    return <NotFoundPage />;
  })();

  return (
    <>
      {!isSharedPage && (
        <SiteHeader
          route={route}
          scrolled={scrolled}
          pastHero={pastHero}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          brandLogoSrc={brandLogoSrc}
          navigate={navigate}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          categoriesRef={categoriesRef}
          categories={categories}
          setCategory={setCategory}
          partnerNavRef={partnerNavRef}
          searchActive={searchActive}
          setSearchActive={setSearchActive}
          profileRef={profileRef}
          user={user}
          buyerProfile={buyerProfile}
          vendorOnboarding={vendorOnboarding}
          isAdmin={isAdmin}
          favoritesCount={favoritesCount}
          handleSignOut={handleSignOut}
          setAuthOpen={setAuthOpen}
          setCartOpen={setCartOpen}
          cartProducts={cartProducts}
          currencyRef={currencyRef}
          activeCurrency={activeCurrency}
          currentCurrency={currentCurrency}
        />
      )}

      {!isSharedPage && (
        <SearchOverlay
          searchActive={searchActive}
          setSearchActive={setSearchActive}
          search={search}
          setSearch={setSearch}
          navigate={navigate}
          visibleProducts={visibleProducts}
          priceAccess={priceAccess}
        />
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
        <ErrorBoundary>
          {routeContent}
        </ErrorBoundary>
      </main>

      {!isSharedPage && route !== 'admin' && <InternalLinkNetwork navigate={navigate} setCategory={setCategory} />}
      {!isSharedPage && route === 'home' && <ReviewStrip navigate={navigate} />}
      {!isSharedPage && route !== 'admin' && <Footer navigate={navigate} />}
      {!isSharedPage && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cartProducts}
          updateQuantity={updateQuantity}
          removeProduct={removeProduct}
          addCartColor={addCartColor}
          pincode={pincode}
          setPincode={setPincode}
          codStatus={codStatus}
          checkPincode={checkPincode}
          priceAccess={priceAccess}
          user={user}
          navigate={navigate}
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
