'use client';

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStorefront } from '../store/useStorefront.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { adminEmails, serviceablePincodes, storeConfig } from '../config.js';
import { loadSavedState, persistCart, persistFavorites, readLocal, parseCartVariantCode, changeCartColor, upsertCartSelections } from '../utils/cartHelpers.js';
import { loadProfileForUser, syncProfileFromUser } from '../utils/profileHelpers.js';
import { getBuyerAccess } from '../utils/buyerAccess.js';
import { useCurrency, CurrencyManager, CURRENCIES } from '../storefrontShared.jsx';
import { trackSiteTraffic } from '../utils/trafficTracker.js';
import { applyCustomTheme } from '../utils/themeEngine.js';
import { fetchSiteCustomizer, fetchProducts, fetchConfigOptions } from '../productData.js';
import { clearStoredReferralCode, setStoredReferralCode } from '../utils/influencerHelpers.js';
import { useAppNavigate } from '../hooks/useAppNavigate.js';

import { SiteHeader } from './SiteHeader.jsx';
import { SearchOverlay } from './SearchOverlay.jsx';
import { MobileMenu } from './MobileMenu.jsx';
import { CartDrawer } from './CartDrawer.jsx';
import { AuthModal } from './AuthModal.jsx';
import { ResellerOnboardingWalkthrough } from './ResellerOnboardingWalkthrough.jsx';
import { WhatsAppFloat } from './WhatsAppFloat.jsx';
import { InternalLinkNetwork } from './InternalLinkNetwork.jsx';
import { Footer } from './Footer.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

export function AppShell({ children }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const navigate = useAppNavigate();

  const {
    user,
    setUser,
    buyerProfile,
    setBuyerProfile,
    vendorOnboarding,
    setVendorOnboarding,
    authOpen,
    setAuthOpen,
    authInitialMode,
    setAuthInitialMode,
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

  const currentCurrency = useCurrency();
  const activeCurrency = CURRENCIES.find((c) => c.code === currentCurrency) || CURRENCIES[0];

  // Expose global navigate for legacy AppLink / window clicks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__appNavigate = navigate;
    }
  }, [navigate]);

  // Traffic tracking & Currency rates
  useEffect(() => {
    trackSiteTraffic();
    void CurrencyManager.fetchRates();
  }, []);

  // Customizer theme
  useEffect(() => {
    fetchSiteCustomizer()
      .then((customizer) => {
        if (customizer) {
          applyCustomTheme(customizer);
        }
      })
      .catch((err) => console.error('Error loading custom theme:', err));
  }, []);

  // Lazy-load products & config options only when needed
  useEffect(() => {
    // Skip eager product fetch on purely static text/policy pages
    const staticTextPages = [
      '/privacy-security',
      '/terms-conditions',
      '/disclaimer',
      '/shipping-delivery',
      '/returns-cancellation',
      '/about',
      '/contact',
    ];
    if (staticTextPages.includes(pathname)) {
      return;
    }

    if (products.length === 0) {
      fetchProducts()
        .then((prods) => {
          if (prods && prods.length > 0) setProducts(prods);
        })
        .catch(console.error);
    }
    if (!configOptions || configOptions.categories?.length === 0) {
      fetchConfigOptions()
        .then((cfg) => {
          if (cfg) setConfigOptions(cfg);
        })
        .catch(console.error);
    }
  }, [pathname, products.length, configOptions, setProducts, setConfigOptions]);

  // Supabase Auth Listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const localUser = localStorage.getItem('sareeva_user');
      if (localUser) {
        try {
          const parsedUser = JSON.parse(localUser);
          setUser(parsedUser);
          setBuyerProfile(parsedUser.user_metadata?.buyer_profile || parsedUser.buyer_profile || null);
        } catch (e) {
          console.error(e);
        }
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

    return () => data?.subscription?.unsubscribe();
  }, [setUser, setBuyerProfile, setAuthInitialMode, setAuthOpen]);

  // Hydrate User Profile & Influencer Referral
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

        if (isSupabaseConfigured) {
          supabase
            .from('influencer_profiles')
            .select('referral_code, is_approved')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data }) => {
              if (isActive && data && data.is_approved && data.referral_code && typeof window !== 'undefined') {
                setStoredReferralCode(data.referral_code.trim().toUpperCase());
              }
            })
            .catch((err) => console.error('[Referral] Error:', err));
        }

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
            }
          } catch (e) {
            console.error('Error hydrating vendor profile:', e);
          }
        }
      }
    }

    void hydrateProfile();
    return () => {
      isActive = false;
    };
  }, [user, setBuyerProfile, setVendorOnboarding]);

  // Load Saved Cart & Favorites on User Change
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
  }, [user, setCart, setFavorites]);

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
    return adminEmails.includes(user.email.toLowerCase().trim());
  }, [user]);

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
          if (user) void persistCart(next, user.id);
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
          if (user) void persistCart(next, user.id);
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
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('sareeva_user');
      setUser(null);
    }
    clearStoredReferralCode();
    navigate('home');
  }, [navigate, setUser]);

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

  const routeName = pathname === '/' ? 'home' : pathname.slice(1);

  return (
    <>
      {!isAdminRoute && !isSharedRoute && (
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
          setAuthOpen={setAuthOpen}
          setCartOpen={setCartOpen}
          cartProducts={cartProducts}
          activeCurrency={activeCurrency}
          currentCurrency={currentCurrency}
        />
      )}

      {!isAdminRoute && !isSharedRoute && (
        <SearchOverlay
          searchActive={searchActive}
          setSearchActive={setSearchActive}
          navigate={navigate}
          visibleProducts={products}
          priceAccess={priceAccess}
        />
      )}

      {menuOpen && !isAdminRoute && !isSharedRoute && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          navigate={navigate}
          user={user}
          isAdmin={isAdmin}
          priceAccess={priceAccess}
          openAuth={() => setAuthOpen(true)}
          visibleProducts={products}
          setCartOpen={setCartOpen}
          cartCount={cartCount}
          favoritesCount={favoritesCount}
          onSignOut={handleSignOut}
          vendorOnboarding={vendorOnboarding}
        />
      )}

      <main>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {!isAdminRoute && !isSharedRoute && (
        <InternalLinkNetwork navigate={navigate} />
      )}

      {!isAdminRoute && !isSharedRoute && (
        <Footer navigate={navigate} scrollToSection={scrollToSection} />
      )}

      {!isAdminRoute && !isSharedRoute && (
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
        onClose={() => {
          setAuthOpen(false);
          setAuthInitialMode('login');
        }}
        user={user}
        setUser={setUser}
        buyerProfile={buyerProfile}
        setBuyerProfile={setBuyerProfile}
        initialMode={authInitialMode}
      />

      <ResellerOnboardingWalkthrough
        user={user}
        buyerProfile={buyerProfile}
        priceAccess={priceAccess}
      />

      {!isAdminRoute && !isSharedRoute && <WhatsAppFloat />}
    </>
  );
}
