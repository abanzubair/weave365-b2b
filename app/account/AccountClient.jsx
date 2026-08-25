'use client';

import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Account } from '../../src/views/Account.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../src/utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from '../../src/supabaseClient.js';
import { clearStoredReferralCode } from '../../src/utils/influencerHelpers.js';
import { parseCartVariantCode, upsertCart, persistCart } from '../../src/utils/cartHelpers.js';

export default function AccountClient() {
  const searchParams = useSearchParams();
  const navigate = useAppNavigate();
  const {
    user,
    setUser,
    buyerProfile,
    products,
    cart,
    setCart,
    favorites,
    setCartOpen,
  } = useStorefront();

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

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

  const favoriteProducts = useMemo(
    () => products.filter((product) => favoriteKeySet.has(product.id)),
    [favoriteKeySet, products]
  );

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

  const addToCart = useCallback(
    (product, variant, quantity = 1, colorSelection = {}) => {
      if (!user) {
        navigate('signup');
        return;
      }
      setCart((currentCart) => {
        const next = upsertCart(currentCart, product, variant, quantity, colorSelection);
        void persistCart(next, user.id);
        return next;
      });
      setCartOpen(true);
    },
    [user, setCart, setCartOpen, navigate]
  );

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

  return (
    <Account
      user={user}
      buyerProfile={buyerProfile}
      priceAccess={priceAccess}
      cartItems={cartProducts}
      favoriteProducts={favoriteProducts}
      products={products}
      navigate={navigate}
      openAuth={() => navigate('signup')}
      updateQuantity={updateQuantity}
      addToCart={addToCart}
      onSignOut={handleSignOut}
      initialTab={searchParams?.get('tab')}
    />
  );
}
