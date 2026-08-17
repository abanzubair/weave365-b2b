'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { NewArrivalsPage } from '../../src/views/NewArrivalsPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../src/utils/buyerAccess.js';
import { upsertCart, persistCart, persistFavorites } from '../../src/utils/cartHelpers.js';

export default function NewArrivalsClient({ initialProducts = [] }) {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    products: storeProducts,
    setProducts,
    favorites,
    setFavorites,
    setCart,
    setCartOpen,
    setAuthOpen,
  } = useStorefront();

  useEffect(() => {
    if (initialProducts.length > 0 && storeProducts.length === 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts, storeProducts.length, setProducts]);

  const allProducts = storeProducts.length > 0 ? storeProducts : initialProducts;

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

  const favoriteKeySet = useMemo(
    () => new Set(favorites.map((item) => item.productGroupKey)),
    [favorites]
  );

  const addToCart = useCallback(
    (product, variant, quantity = 1, colorSelection = {}) => {
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
    },
    [user, setCart, setCartOpen, setAuthOpen]
  );

  const toggleFavorite = useCallback(
    (product) => {
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
              { productGroupKey: product.id, variantCode: product.variants?.[0]?.code || '' },
            ];
        void persistFavorites(next, user.id);
        return next;
      });
    },
    [user, setFavorites, setAuthOpen]
  );

  return (
    <NewArrivalsPage
      products={allProducts}
      status="ready"
      error=""
      navigate={navigate}
      addToCart={addToCart}
      toggleFavorite={toggleFavorite}
      favoriteKeys={favoriteKeySet}
      priceAccess={priceAccess}
      openAuth={() => setAuthOpen(true)}
      isTransitioning={false}
    />
  );
}
