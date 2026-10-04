'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStorefront } from '../store/useStorefront.js';
import { useCountryCurrency } from '../store/useCountryCurrency.js';
import { adminEmails, serviceablePincodes, storeConfig } from '../config.js';
import { loadSavedState, persistCart, persistFavorites, readLocal, parseCartVariantCode, changeCartColor, upsertCartSelections, resolveItemVariant } from '../utils/cartHelpers.js';
import { loadProfileForUser, syncProfileFromUser, isProfileComplete } from '../utils/profileHelpers.js';
import { getCachedAuth, clearCachedAuth } from '../utils/authCache.js';
import { getBuyerAccess } from '../utils/buyerAccess.js';
import { trackSiteTraffic, getStoredAttribution } from '../utils/trafficTracker.js';
import {
  setStoredReferralCode,
  handleIncomingReferral,
  setOwnAffiliateCode,
  clearOwnAffiliateCode,
} from '../utils/influencerHelpers.js';
import { useAppNavigate } from '../hooks/useAppNavigate.js';
import {
  fetchVendorStockOverrides,
  getVendorStockLocal,
  applyStockOverridesToProducts,
  VENDOR_STOCK_UPDATED_EVENT,
  VENDOR_STOCK_STORAGE_KEY,
} from '../utils/vendorStockService.js';

import dynamic from 'next/dynamic';
import { SiteHeader } from './SiteHeader.jsx';

const SearchOverlay = dynamic(
  () => import('./SearchOverlay.jsx').then((m) => m.SearchOverlay),
  { ssr: false }
);
const MobileMenu = dynamic(
  () => import('./MobileMenu.jsx').then((m) => m.MobileMenu),
  { ssr: false }
);
const CartDrawer = dynamic(
  () => import('./CartDrawer.jsx').then((m) => m.CartDrawer),
  { ssr: false }
);
const WhatsAppFloat = dynamic(
  () => import('./WhatsAppFloat.jsx').then((m) => m.WhatsAppFloat),
  { ssr: false }
);

const ResellerOnboardingWalkthrough = dynamic(
  () => import('./ResellerOnboardingWalkthrough.jsx').then((m) => m.ResellerOnboardingWalkthrough),
  { ssr: false }
);
import { InternalLinkNetwork } from './InternalLinkNetwork.jsx';
import { Footer } from './Footer.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

export function AppShell({ children }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const navigate = useAppNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const {
    user,
    setUser,
    buyerProfile,
    setBuyerProfile,
    vendorOnboarding,
    setVendorOnboarding,
    isProfileHydrated,
    setIsProfileHydrated,
    cartOpen,
    setCartOpen,
    menuOpen,
    setMenuOpen,
    searchActive,
    setSearchActive,
    dropdownOpen,
    setDropdownOpen,
    scrolled,
    pastHero,
    cart,
    setCart,
    favorites,
    setFavorites,
    pincode,
    setPincode,
    codStatus,
    setCodStatus,
    products,
    setProducts,
    configOptions,
    setConfigOptions,
  } = useStorefront();

  const [showWaFloat, setShowWaFloat] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowWaFloat(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Smooth mobile menu mount and unmount animation state
  const [mobileMenuMounted, setMobileMenuMounted] = useState(false);
  const [mobileMenuClosing, setMobileMenuClosing] = useState(false);
  const menuCloseTimerRef = useRef(null);

  useEffect(() => {
    if (menuOpen) {
      if (menuCloseTimerRef.current) {
        clearTimeout(menuCloseTimerRef.current);
        menuCloseTimerRef.current = null;
      }
      setMobileMenuMounted(true);
      setMobileMenuClosing(false);
    } else if (mobileMenuMounted && !mobileMenuClosing) {
      setMobileMenuClosing(true);
      menuCloseTimerRef.current = setTimeout(() => {
        setMobileMenuMounted(false);
        setMobileMenuClosing(false);
        menuCloseTimerRef.current = null;
      }, 280);
    }
  }, [menuOpen, mobileMenuMounted, mobileMenuClosing]);

  useEffect(() => {
    return () => {
      if (menuCloseTimerRef.current) {
        clearTimeout(menuCloseTimerRef.current);
      }
    };
  }, []);

  // Expose global navigate for legacy AppLink / window clicks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__appNavigate = navigate;
    }
  }, [navigate]);

  // Initialize global country pricing & currency conversion
  useEffect(() => {
    useCountryCurrency.getState().initCountryCurrency();
  }, []);

  // Traffic tracking
  useEffect(() => {
    trackSiteTraffic();
  }, []);

  // Inbound affiliate referral detection (?ref=..., ?affiliate=..., ?influencer=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      void handleIncomingReferral(window.location.search);
    }
  }, [pathname]);

  // Ensure every route transition cleanly starts at the top of the new page
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);

  // Lazy-load products & config options strictly during idle or when shell features require them
  useEffect(() => {
    // Pages that already have their own SSR product data or don't need products
    const isCategoryOrCatalogue = pathname === '/catalogue' || pathname === '/wholesale-catalogue' || pathname === '/new-arrivals';
    const isProductPage = /^\/[^/]+\/[^/]+/.test(pathname);
    const skipProductFetchPages = [
      '/',
      '/privacy-security',
      '/terms-conditions',
      '/disclaimer',
      '/shipping-delivery',
      '/returns-cancellation',
      '/about',
      '/contact',
      '/bulk-inquiry',
      '/reviews',
      '/faq',
      '/reseller-faqs',
    ];

    if (skipProductFetchPages.includes(pathname) || isCategoryOrCatalogue || isProductPage) {
      return;
    }

    let idleId;
    const timer = setTimeout(() => {
      const runFetch = () => {
        if (!products || products.length === 0) {
          import('../productData.js').then((m) => m.fetchProducts()).then(setProducts).catch(() => {});
        }
        if (!configOptions || Object.keys(configOptions).length === 0) {
          import('../productData.js').then((m) => m.fetchConfigOptions()).then(setConfigOptions).catch(() => {});
        }
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(runFetch, { timeout: 15000 });
      } else {
        runFetch();
      }
    }, 6000);

    return () => {
      clearTimeout(timer);
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [pathname, products, configOptions, setProducts, setConfigOptions]);

  // Listen for vendor stock real-time sync events from developer panel
  useEffect(() => {
    const handleStockUpdate = (event) => {
      const overrides = event.detail || getVendorStockLocal();
      if (overrides && Object.keys(overrides).length > 0) {
        const currentProds = useStorefront.getState().products;
        if (currentProds && currentProds.length > 0) {
          const updated = applyStockOverridesToProducts(currentProds, overrides);
          setProducts(updated);
        }
      }
    };
    window.addEventListener(VENDOR_STOCK_UPDATED_EVENT, handleStockUpdate);

    // Cross-tab synchronization via native storage event
    const handleStorageChange = (e) => {
      if (e.key === VENDOR_STOCK_STORAGE_KEY && e.newValue) {
        try {
          const overrides = JSON.parse(e.newValue);
          if (overrides && Object.keys(overrides).length > 0) {
            const currentProds = useStorefront.getState().products;
            if (currentProds && currentProds.length > 0) {
              const updated = applyStockOverridesToProducts(currentProds, overrides);
              setProducts(updated);
            }
          }
        } catch (err) {
          // Ignore JSON parse errors from concurrent writes
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Background fetch to ensure fresh stock status from Supabase after page load settles
    const timer = setTimeout(() => {
      fetchVendorStockOverrides()
        .then((overrides) => {
          if (overrides && Object.keys(overrides).length > 0) {
            const currentProds = useStorefront.getState().products;
            if (currentProds && currentProds.length > 0) {
              const updated = applyStockOverridesToProducts(currentProds, overrides);
              setProducts(updated);
            }
          }
        })
        .catch((err) => console.warn('[AppShell] Vendor stock hydration notice:', err?.message || err));
    }, 500);

    return () => {
      window.removeEventListener(VENDOR_STOCK_UPDATED_EVENT, handleStockUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timer);
    };
  }, [setProducts]);

  // Supabase Auth Listener (fast local hydration + instant live session resolution)
  useEffect(() => {
    let isMounted = true;
    let authUnsubscribe = null;

    // Immediately restore cached local session if present so user sees their state with zero latency (0ms)
    const { user: cachedUser, buyerProfile: cachedProfile } = getCachedAuth();
    const current = useStorefront.getState();
    if (cachedUser && !current.user) {
      setUser(cachedUser);
    }
    if (cachedProfile && !current.buyerProfile) {
      setBuyerProfile(cachedProfile);
    }
    setIsProfileHydrated(true);

    import('../supabaseClient.js').then(({ isSupabaseConfigured, supabase }) => {
      if (!isMounted) return;
      if (!isSupabaseConfigured || !supabase) {
        return;
      }

      const syncSession = (sessionUser) => {
        if (!isMounted) return;
        const curUser = useStorefront.getState().user;
        if (!sessionUser) {
          if (curUser) {
            clearCachedAuth();
            setUser(null);
            setBuyerProfile(null);
          }
          return;
        }
        if (curUser?.id !== sessionUser.id) {
          setUser(sessionUser);
        }
      };

      supabase.auth.getSession().then(({ data }) => {
        syncSession(data.session?.user || null);
      });

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        syncSession(session?.user || null);
        if (event === 'PASSWORD_RECOVERY') {
          navigateRef.current?.('signup', null, null, { mode: 'reset-password' });
        }
      });

      authUnsubscribe = () => data?.subscription?.unsubscribe();
    }).catch((err) => {
      console.error('Error loading Supabase auth:', err);
    });

    return () => {
      isMounted = false;
      if (authUnsubscribe) authUnsubscribe();
    };
  }, [setUser, setBuyerProfile, setIsProfileHydrated]);

  // Hydrate User Profile & Influencer Referral
  const currentUserId = user?.id;
  useEffect(() => {
    let isActive = true;

    if (!currentUserId) {
      setBuyerProfile(null);
      setVendorOnboarding(null);
      clearOwnAffiliateCode();
      setIsProfileHydrated(true);
      return;
    }

    async function hydrateProfile() {
      try {
        const currentUser = useStorefront.getState().user;
        if (!currentUser) return;

        // Fast DB profile fetch (read-only, does not block on write)
        const { profile } = await loadProfileForUser(currentUser);
        if (isActive) {
          if (profile) {
            setBuyerProfile(profile);
          } else {
            // Only sync/upsert to DB if profile row doesn't exist yet
            await syncProfileFromUser(currentUser);
            const { profile: createdProfile } = await loadProfileForUser(currentUser);
            if (isActive && createdProfile) {
              setBuyerProfile(createdProfile);
            }
          }

          // Asynchronously sync attribution in background if missing, without blocking profile hydration
          const storedAttr = getStoredAttribution();
          if (storedAttr && !currentUser.user_metadata?.acquisition) {
            void syncProfileFromUser(currentUser).catch(() => {});
          }

          const { supabase, isSupabaseConfigured } = await import('../supabaseClient.js');
          if (isSupabaseConfigured && supabase && isActive) {
            const targetProfile = profile || currentUser.user_metadata?.buyer_profile || currentUser.buyer_profile;
            const cleanWhatsapp = targetProfile?.whatsapp_number
              ? String(targetProfile.whatsapp_number).replace(/\D/g, '').slice(-10)
              : '';

            await Promise.allSettled([
              supabase
                .from('influencer_profiles')
                .select('referral_code, is_approved')
                .eq('id', currentUserId)
                .maybeSingle()
                .then(({ data }) => {
                  if (isActive && data && data.is_approved && data.referral_code && typeof window !== 'undefined') {
                    setOwnAffiliateCode(data.referral_code.trim().toUpperCase());
                  } else if (isActive) {
                    clearOwnAffiliateCode();
                  }
                }),
              cleanWhatsapp
                ? supabase
                    .from('vendor_profiles')
                    .select('status, drive_folder_url')
                    .eq('whatsapp_number', cleanWhatsapp)
                    .maybeSingle()
                    .then(({ data: vProfile }) => {
                      if (vProfile && isActive) {
                        setVendorOnboarding(vProfile);
                      }
                    })
                : Promise.resolve(),
            ]);
          }
        }
      } catch (err) {
        console.error('Error hydrating profile:', err);
      } finally {
        if (isActive) {
          setIsProfileHydrated(true);
        }
      }
    }

    void hydrateProfile();
    return () => {
      isActive = false;
    };
  }, [currentUserId, setBuyerProfile, setVendorOnboarding, setIsProfileHydrated]);

  // Load Saved Cart & Favorites on User Change
  useEffect(() => {
    if (!currentUserId) {
      setCart(readLocal('cart_guest'));
      setFavorites(readLocal('favorites_guest'));
      return;
    }

    import('../supabaseClient.js').then(({ isSupabaseConfigured }) => {
      if (isSupabaseConfigured) {
        loadSavedState(currentUserId).then(({ savedCart, savedFavorites }) => {
          setCart(savedCart);
          setFavorites(savedFavorites);
        });
      } else {
        setCart(readLocal(`cart_${currentUserId}`));
        setFavorites(readLocal(`favorites_${currentUserId}`));
      }
    }).catch(() => {
      setCart(readLocal(`cart_${currentUserId}`));
      setFavorites(readLocal(`favorites_${currentUserId}`));
    });
  }, [currentUserId, setCart, setFavorites]);

  // Search lock scroll
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

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const isEmailAdmin = adminEmails.includes(user.email.toLowerCase().trim());
    const isRoleAdmin = user?.user_metadata?.role === 'admin' || buyerProfile?.role === 'admin';
    return Boolean(isEmailAdmin || isRoleAdmin);
  }, [user, buyerProfile]);

  // Allow authenticated users to browse freely without route hijacking
  // Incomplete profiles are prompted organically at checkout or inside Account page

  const productsById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const cartProducts = useMemo(() => {
    return cart
      .map((item) => {
        const product = productsById.get(item.productGroupKey);
        const { baseVariantCode, colorName } = parseCartVariantCode(item.variantCode);
        const variant = resolveItemVariant(product, item.variantCode, colorName) || product?.variants?.find((entry) => entry.code === baseVariantCode);
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
      .filter(Boolean);
  }, [cart, productsById]);

  const favoriteKeySet = useMemo(
    () => new Set(favorites.map((item) => item.productGroupKey)),
    [favorites]
  );

  const cartCount = cartProducts.length;
  const favoritesCount = favorites.length;

  const updateQuantity = useCallback(
    (item, quantity) => {
      setCart((currentCart) => {
        let next;
        if (quantity <= 0) {
          next = currentCart.filter(
            (entry) =>
              !(
                entry.productGroupKey === item.productGroupKey &&
                entry.variantCode === item.variantCode
              )
          );
        } else {
          next = currentCart.map((entry) => {
            if (
              entry.productGroupKey === item.productGroupKey &&
              entry.variantCode === item.variantCode
            ) {
              return { ...entry, quantity };
            }
            return entry;
          });
        }
        if (user) {
          void persistCart(next, user.id);
        } else {
          try { localStorage.setItem('cart_guest', JSON.stringify(next)); } catch (e) {}
        }
        return next;
      });
    },
    [user, setCart]
  );

  const removeProduct = useCallback(
    (productGroupKey) => {
      setCart((currentCart) => {
        const next = currentCart.filter((entry) => entry.productGroupKey !== productGroupKey);
        if (user) {
          void persistCart(next, user.id);
        } else {
          try { localStorage.setItem('cart_guest', JSON.stringify(next)); } catch (e) {}
        }
        return next;
      });
    },
    [user, setCart]
  );

  const addCartColor = useCallback(
    (item, color) => {
      if (!color?.name) return;
      const unselectedItem = cartProducts.find(
        (entry) =>
          entry.productGroupKey === item.productGroupKey &&
          entry.selectedColorName === 'Select Color'
      );

      if (unselectedItem) {
        setCart((currentCart) => {
          const next = changeCartColor(currentCart, unselectedItem, color.name);
          if (user) {
            void persistCart(next, user.id);
          } else {
            try { localStorage.setItem('cart_guest', JSON.stringify(next)); } catch (e) {}
          }
          return next;
        });
      } else {
        const selectedRows = [
          {
            variant: item.variant,
            quantity: 1,
            colorName: color.name,
            image: color.image,
          },
        ];
        setCart((currentCart) => {
          const next = upsertCartSelections(currentCart, item.product, selectedRows);
          if (user) {
            void persistCart(next, user.id);
          } else {
            try { localStorage.setItem('cart_guest', JSON.stringify(next)); } catch (e) {}
          }
          return next;
        });
      }
    },
    [cartProducts, user, setCart]
  );

  const checkPincode = useCallback(() => {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }, [pincode, setCodStatus]);

  const handleSignOut = useCallback(async () => {
    try {
      const { supabase, isSupabaseConfigured } = await import('../supabaseClient.js');
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      clearCachedAuth();
      setUser(null);
      setBuyerProfile(null);
      setIsProfileHydrated(true);
      clearStoredReferralCode();
      navigate('home');
    }
  }, [navigate, setUser, setBuyerProfile, setIsProfileHydrated]);

  const scrollToSection = useCallback(
    (sectionId) => {
      if (pathname !== '/') {
        navigate('home');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
      } else {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [pathname, navigate]
  );

  const isAdminRoute = pathname.startsWith('/admin');
  const isSharedRoute = pathname.startsWith('/s/') || pathname === '/s';
  const isAuthRoute = pathname.startsWith('/signup') || pathname.startsWith('/login') || pathname.startsWith('/register');
  const hideShellSections = isAdminRoute || isSharedRoute || isAuthRoute;

  const routeName = pathname === '/' ? 'home' : pathname.slice(1);

  return (
    <>
      {!hideShellSections && (
        <SiteHeader
          route={routeName}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          navigate={navigate}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setCategory={(cat) => navigate('catalogue', null, null, { category: cat })}
          searchActive={searchActive}
          setSearchActive={setSearchActive}
          user={user}
          buyerProfile={buyerProfile}
          vendorOnboarding={vendorOnboarding}
          isAdmin={isAdmin}
          favoritesCount={favoritesCount}
          handleSignOut={handleSignOut}
          setCartOpen={setCartOpen}
          cartProducts={cartProducts}
        />
      )}

      {!hideShellSections && searchActive && (
        <SearchOverlay
          searchActive={searchActive}
          setSearchActive={setSearchActive}
          navigate={navigate}
          visibleProducts={products}
          priceAccess={priceAccess}
        />
      )}

      {mobileMenuMounted && !hideShellSections && (
        <MobileMenu
          isClosing={mobileMenuClosing}
          onClose={() => setMenuOpen(false)}
          navigate={navigate}
          user={user}
          isAdmin={isAdmin}
          priceAccess={priceAccess}
          openAuth={() => navigate('signup')}
          setCartOpen={setCartOpen}
          cartCount={cartCount}
          favoritesCount={favoritesCount}
          onSignOut={handleSignOut}
          vendorOnboarding={vendorOnboarding}
          setCategory={(cat) => navigate('catalogue', null, null, { category: cat })}
        />
      )}

      <main>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {!hideShellSections && (
        <InternalLinkNetwork navigate={navigate} />
      )}

      {!hideShellSections && (
        <Footer navigate={navigate} scrollToSection={scrollToSection} />
      )}

      {!hideShellSections && cartOpen && (
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

      {!hideShellSections && user && (
        <ResellerOnboardingWalkthrough
          user={user}
          buyerProfile={buyerProfile}
          priceAccess={priceAccess}
        />
      )}

      {!hideShellSections && showWaFloat && <WhatsAppFloat />}
    </>
  );
}
