'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { Home } from '../src/views/Home.jsx';
import { useStorefront } from '../src/store/useStorefront.js';
import { useAppNavigate } from '../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../src/utils/buyerAccess.js';
import { fallbackProductImage } from '../src/storefrontShared.jsx';
import { upsertCart, upsertCartSelections, persistCart, persistFavorites } from '../src/utils/cartHelpers.js';

export default function HomeRouteClient({ initialProducts = [], initialHeroSlides = [], initialBlogs = [] }) {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    products: storeProducts,
    setProducts,
    heroSlides: storeHeroSlides,
    setHeroSlides,
    blogs: storeBlogs,
    setBlogs,
    favorites,
    setFavorites,
    setCart,
    setCartOpen,
  } = useStorefront();

  // Sync initial SSR data to store if store is empty
  useEffect(() => {
    if (initialProducts.length > 0 && storeProducts.length === 0) {
      setProducts(initialProducts);
    }
    if (initialHeroSlides.length > 0 && storeHeroSlides.length === 0) {
      setHeroSlides(initialHeroSlides);
    }
    if (initialBlogs.length > 0 && storeBlogs.length === 0) {
      setBlogs(initialBlogs);
    }
  }, [initialProducts, initialHeroSlides, initialBlogs, storeProducts.length, storeHeroSlides.length, storeBlogs.length, setProducts, setHeroSlides, setBlogs]);

  const activeProducts = storeProducts.length > 0 ? storeProducts : initialProducts;
  const activeHeroSlides = storeHeroSlides.length > 0 ? storeHeroSlides : initialHeroSlides;
  const activeBlogs = storeBlogs.length > 0 ? storeBlogs : initialBlogs;

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

  const favoriteKeySet = useMemo(
    () => new Set(favorites.map((item) => item.productGroupKey)),
    [favorites]
  );

  const addToCart = useCallback((product, variant, quantity = 1, colorSelection = {}) => {
    setCart((currentCart) => {
      const next = upsertCart(currentCart, product, variant, quantity, colorSelection);
      if (user) {
        void persistCart(next, user.id);
      } else {
        try { localStorage.setItem('cart_guest', JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    setCartOpen(true);
  }, [user, setCart, setCartOpen]);

  const addCartSelections = useCallback((product, selections) => {
    const selectedRows = selections.filter((selection) => selection?.variant && selection.quantity > 0);
    if (!selectedRows.length) return;

    setCart((currentCart) => {
      const next = upsertCartSelections(currentCart, product, selectedRows);
      if (user) {
        void persistCart(next, user.id);
      } else {
        try { localStorage.setItem('cart_guest', JSON.stringify(next)); } catch (e) {}
      }
      return next;
    });
    setCartOpen(true);
  }, [user, setCart, setCartOpen]);


  const toggleFavorite = useCallback((product) => {
    if (!user) {
      navigate('signup');
      return;
    }

    setFavorites((currentFavorites) => {
      const exists = currentFavorites.some((item) => item.productGroupKey === product.id);
      const next = exists
        ? currentFavorites.filter((item) => item.productGroupKey !== product.id)
        : [
            ...currentFavorites,
            { productGroupKey: product.id, variantCode: product.variants?.[0]?.code || '' },
          ];
      void persistFavorites(next, user.id);
      return next;
    });
  }, [user, setFavorites, navigate]);

  const isLoading = activeProducts.length === 0;

  return (
    <Home
      products={activeProducts}
      status={isLoading ? 'loading' : 'ready'}
      error=""
      heroSlides={activeHeroSlides}
      fallbackHeroImage={fallbackProductImage}
      navigate={navigate}
      setCategory={(cat) => navigate('catalogue', null, null, { category: cat })}
      openAuth={() => navigate('signup')}
      addToCart={addToCart}
      addCartSelections={addCartSelections}
      toggleFavorite={toggleFavorite}
      favoriteKeys={favoriteKeySet}
      priceAccess={priceAccess}
      blogs={activeBlogs}
    />
  );
}
