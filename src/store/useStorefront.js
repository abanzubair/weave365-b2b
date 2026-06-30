import { create } from 'zustand';

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
  setCart: (cart) => set({ cart }),
  setFavorites: (favorites) => set({ favorites }),

  // Product Catalogue Data Cache (for fast loading and global sync)
  products: [],
  status: 'loading',
  error: '',
  setProducts: (products) => set({ products }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
}));
