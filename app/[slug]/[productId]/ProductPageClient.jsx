'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { ProductDetailWrapper } from '../../../src/ProductPage.jsx';
import { useStorefront } from '../../../src/store/useStorefront.js';
import { useAppNavigate } from '../../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../../src/utils/buyerAccess.js';
import { upsertCart, upsertCartSelections, persistCart, persistFavorites } from '../../../src/utils/cartHelpers.js';
import { serviceablePincodes } from '../../../src/config.js';
import { getVendorStockLocal, applyStockOverridesToProducts } from '../../../src/utils/vendorStockService.js';

export default function ProductPageClient({ productId, initialProduct, initialAllProducts = [] }) {
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
    pincode,
    setPincode,
    codStatus,
    setCodStatus,
  } = useStorefront();

  useEffect(() => {
    if (initialAllProducts.length > 0 && storeProducts.length === 0) {
      setProducts(initialAllProducts);
    }
  }, [initialAllProducts, storeProducts.length, setProducts]);

  const allProducts = storeProducts.length > 0 ? storeProducts : initialAllProducts;

  const productsById = useMemo(() => {
    const map = new Map();
    const overrides = typeof window !== 'undefined' ? getVendorStockLocal() : {};
    allProducts.forEach((p) => {
      const overridden = (overrides && overrides[p.id])
        ? applyStockOverridesToProducts([p], overrides)[0]
        : p;
      map.set(p.id, overridden);
    });
    if (initialProduct && !map.has(initialProduct.id)) {
      const overriddenInit = (overrides && overrides[initialProduct.id])
        ? applyStockOverridesToProducts([initialProduct], overrides)[0]
        : initialProduct;
      map.set(initialProduct.id, overriddenInit);
    }
    return map;
  }, [allProducts, initialProduct]);

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

  const favoriteKeySet = useMemo(
    () => new Set(favorites.map((item) => item.productGroupKey)),
    [favorites]
  );

  const addToCart = useCallback(
    (product, variant, quantity = 1, colorSelection = {}) => {
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
    },
    [user, setCart, setCartOpen]
  );

  const addCartSelections = useCallback(
    (product, selections) => {
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
    },
    [user, setCart, setCartOpen]
  );


  const toggleFavorite = useCallback(
    (product) => {
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
    },
    [user, setFavorites, navigate]
  );

  const checkPincode = useCallback(() => {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }, [pincode, setCodStatus]);

  return (
    <ProductDetailWrapper
      productId={productId}
      products={allProducts}
      productsById={productsById}
      navigate={navigate}
      addToCart={addToCart}
      addCartSelections={addCartSelections}
      toggleFavorite={toggleFavorite}
      favoriteKeys={favoriteKeySet}
      priceAccess={priceAccess}
      openAuth={() => navigate('signup')}
      pincode={pincode}
      setPincode={setPincode}
      codStatus={codStatus}
      checkPincode={checkPincode}
      user={user}
    />
  );
}
