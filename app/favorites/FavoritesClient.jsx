'use client';

import { useMemo, useCallback } from 'react';
import { Favorites } from '../../src/views/Favorites.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../src/utils/buyerAccess.js';
import { upsertCart, persistCart, persistFavorites } from '../../src/utils/cartHelpers.js';

export default function FavoritesClient() {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    products,
    favorites,
    setFavorites,
    setCart,
    setCartOpen,
    setAuthOpen,
  } = useStorefront();

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

  const favoriteKeySet = useMemo(
    () => new Set(favorites.map((item) => item.productGroupKey)),
    [favorites]
  );

  const favoriteProducts = useMemo(
    () => products.filter((product) => favoriteKeySet.has(product.id)),
    [favoriteKeySet, products]
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
