import { create } from 'zustand';
import { getVendorStockLocal, applyStockOverridesToProducts } from '../utils/vendorStockService.js';
import { getCachedAuth, saveCachedUser, saveCachedProfile, clearCachedAuth } from '../utils/authCache.js';

const resolveArrayUpdate = (nextValue, currentValue) => {
  const currentArray = Array.isArray(currentValue) ? currentValue : [];
  const resolved = typeof nextValue === 'function' ? nextValue(currentArray) : nextValue;
  return Array.isArray(resolved) ? resolved : [];
};

const initialAuth = typeof window !== 'undefined' ? getCachedAuth() : { user: null, buyerProfile: null };

export const useStorefront = create((set) => ({
  // Auth & Profile State
  user: initialAuth.user,
  buyerProfile: initialAuth.buyerProfile,
  vendorOnboarding: null,
  isProfileHydrated: Boolean(initialAuth.user),
  setUser: (user) => {
    const current = useStorefront.getState?.()?.user;
    if (user === current || (user?.id && current?.id && user.id === current.id && user.updated_at === current.updated_at)) {
      return;
    }
    if (user) {
      saveCachedUser(user);
    } else {
      clearCachedAuth();
    }
    set({ user });
  },
  setBuyerProfile: (buyerProfile) => {
    const current = useStorefront.getState?.()?.buyerProfile;
    if (buyerProfile === current || (buyerProfile?.id && current?.id && buyerProfile.id === current.id && buyerProfile.updated_at === current.updated_at)) {
      return;
    }
    saveCachedProfile(buyerProfile);
    set({ buyerProfile });
  },
  setVendorOnboarding: (vendorOnboarding) => set({ vendorOnboarding }),
  setIsProfileHydrated: (isProfileHydrated) => set({ isProfileHydrated }),

  // UI Shell & Navigation State
  cartOpen: false,
  menuOpen: false,
  searchActive: false,
  dropdownOpen: null,
  scrolled: false,
  pastHero: false,
  siteCustomizer: null,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setSearchActive: (searchActive) => set({ searchActive }),
  setDropdownOpen: (dropdownOpen) => set({ dropdownOpen }),
  setScrolled: (scrolled) => set({ scrolled }),
  setPastHero: (pastHero) => set({ pastHero }),
  setSiteCustomizer: (siteCustomizer) => set({ siteCustomizer }),

  // Pincode & Serviceability State
  pincode: '',
  codStatus: null,
  setPincode: (pincode) => set({ pincode }),
  setCodStatus: (codStatus) => set({ codStatus }),

  // Cart & Favorites State
  cart: [],
  favorites: [],
  isCartHydrated: false,
  setCart: (cart) => set((state) => ({ cart: resolveArrayUpdate(cart, state.cart) })),
  setFavorites: (favorites) => set((state) => ({ favorites: resolveArrayUpdate(favorites, state.favorites) })),
  setIsCartHydrated: (isCartHydrated) => set({ isCartHydrated }),

  // Data Caches & Storefront Collections
  products: [],
  status: 'loading',
  error: '',
  heroSlides: [],
  blogs: [],
  configOptions: { priceRanges: [], categories: [], fabrics: [], weaves: [], occasions: [] },
  pageSeoSettings: [],
  landingPages: [],
  setProducts: (products) => {
    const current = useStorefront.getState().products;
    const resolved = typeof products === 'function' ? products(current) : products;
    const localOverrides = getVendorStockLocal();
    const finalProducts = (localOverrides && Object.keys(localOverrides).length > 0 && Array.isArray(resolved))
      ? applyStockOverridesToProducts(resolved, localOverrides)
      : (Array.isArray(resolved) ? resolved : []);
    set({ products: finalProducts });
  },
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setHeroSlides: (heroSlides) => set({ heroSlides }),
  setBlogs: (blogs) => set((state) => ({ blogs: typeof blogs === 'function' ? blogs(state.blogs) : blogs })),
  setConfigOptions: (configOptions) => set({ configOptions }),
  setPageSeoSettings: (pageSeoSettings) => set({ pageSeoSettings }),
  setLandingPages: (landingPages) => set({ landingPages }),
}));
