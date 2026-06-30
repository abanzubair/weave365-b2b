import { create } from 'zustand';

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

  // UI State
  authOpen: false,
  authInitialMode: 'login',
  cartOpen: false,
  menuOpen: false,
  searchActive: false,
  setAuthOpen: (authOpen) => set({ authOpen }),
  setAuthInitialMode: (authInitialMode) => set({ authInitialMode }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setSearchActive: (searchActive) => set({ searchActive }),

  // Cart & Favorites State
  cart: [],
  favorites: [],
  setCart: (cart) => set((state) => ({ cart: resolveArrayUpdate(cart, state.cart) })),
  setFavorites: (favorites) => set((state) => ({ favorites: resolveArrayUpdate(favorites, state.favorites) })),

  // Product Catalogue Data Cache (for fast loading and global sync)
  products: [],
  status: 'loading',
  error: '',
  setProducts: (products) => set({ products }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));
