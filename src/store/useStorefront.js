import { create } from 'zustand';
import { getVendorStockLocal, applyStockOverridesToProducts } from '../utils/vendorStockService.js';

const resolveArrayUpdate = (nextValue, currentValue) => {
  const currentArray = Array.isArray(currentValue) ? currentValue : [];
  const resolved = typeof nextValue === 'function' ? nextValue(currentArray) : nextValue;
  return Array.isArray(resolved) ? resolved : [];
};

export const useStorefront = create((set) => ({
  // Auth & Profile State
  user: null,
  buyerProfile: null,
  vendorOnboarding: null,
  setUser: (user) => set({ user }),
  setBuyerProfile: (buyerProfile) => set({ buyerProfile }),
  setVendorOnboarding: (vendorOnboarding) => set({ vendorOnboarding }),

  // UI Shell & Navigation State
  authOpen: false,
  authInitialMode: 'login',
  cartOpen: false,
  menuOpen: false,
  searchActive: false,
  dropdownOpen: null,
  scrolled: false,
  pastHero: false,
  siteCustomizer: null,
  setAuthOpen: (authOpen) => set({ authOpen }),
  setAuthInitialMode: (authInitialMode) => set({ authInitialMode }),
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
  setCart: (cart) => set((state) => ({ cart: resolveArrayUpdate(cart, state.cart) })),
  setFavorites: (favorites) => set((state) => ({ favorites: resolveArrayUpdate(favorites, state.favorites) })),

  // Data Caches & Storefront Collections
  products: [],
  status: 'loading',
  error: '',
  heroSlides: [],
  blogs: [],
  configOptions: { priceRanges: [], categories: [], fabrics: [], weaves: [] },
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
