'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import { CheckoutPage } from '../../src/views/CheckoutPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../src/utils/buyerAccess.js';
import { parseCartVariantCode, resolveItemVariant } from '../../src/utils/cartHelpers.js';
import { serviceablePincodes } from '../../src/config.js';

export default function CheckoutClient() {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    products,
    setProducts,
    cart,
    setCart,
    isCartHydrated,
    pincode,
    setPincode,
    codStatus,
    setCodStatus,
  } = useStorefront();

  const [isFetchingCatalog, setIsFetchingCatalog] = useState(false);

  // Eagerly fetch catalog products if products store is empty
  useEffect(() => {
    if ((!products || products.length === 0) && !isFetchingCatalog) {
      setIsFetchingCatalog(true);
      import('../../src/productData.js')
        .then((m) => m.fetchProducts())
        .then((fetched) => {
          if (Array.isArray(fetched) && fetched.length > 0) {
            setProducts(fetched);
          }
        })
        .catch((err) => {
          console.error('[CheckoutClient] Failed to load catalog products:', err);
        })
        .finally(() => {
          setIsFetchingCatalog(false);
        });
    }
  }, [products, setProducts, isFetchingCatalog]);

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

  const productsById = useMemo(() => {
    const map = new Map();
    (products || []).forEach((p) => {
      if (p.id) {
        map.set(p.id, p);
        map.set(String(p.id), p);
      }
      if (p.groupKey) {
        map.set(p.groupKey, p);
        map.set(String(p.groupKey), p);
      }
    });
    return map;
  }, [products]);

  const cartProducts = useMemo(() => {
    return (cart || [])
      .map((item) => {
        const product =
          productsById.get(item.productGroupKey) ||
          productsById.get(String(item.productGroupKey)) ||
          productsById.get(Number(item.productGroupKey));
        const { baseVariantCode, colorName } = parseCartVariantCode(item.variantCode);
        const variant =
          resolveItemVariant(product, item.variantCode, colorName) ||
          product?.variants?.find((entry) => entry.code === baseVariantCode);
        const colorOptions = product?.colorOptions || [];
        const selectedColorName = colorName || variant?.color || colorOptions[0]?.name || '';
        const selectedColor = colorOptions.find((entry) => entry.name === selectedColorName);
        const resolvedWeight = (function() {
          const w = Number(product?.weight ?? item.weight);
          return (!isNaN(w) && w > 0) ? w : 1.2;
        })();
        return product && variant
          ? {
              ...item,
              product: {
                ...product,
                weight: resolvedWeight,
              },
              variant,
              baseVariantCode,
              selectedColorName,
              selectedColorImage: selectedColor?.image || variant.image || product.images?.[0],
              colorOptions,
              weight: resolvedWeight,
            }
          : null;
      })
      .filter(Boolean);
  }, [cart, productsById]);

  const checkPincode = useCallback(() => {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }, [pincode, setCodStatus]);

  // Loading state if cart or products are still hydrating/fetching
  const isHydrating =
    !isCartHydrated ||
    isFetchingCatalog ||
    (Boolean(cart && cart.length > 0) && (!products || products.length === 0));

  return (
    <CheckoutPage
      items={cartProducts}
      priceAccess={priceAccess}
      user={user}
      buyerProfile={buyerProfile}
      pincode={pincode}
      setPincode={setPincode}
      codStatus={codStatus}
      checkPincode={checkPincode}
      navigate={navigate}
      clearCart={() => setCart([])}
      isLoading={isHydrating}
    />
  );
}
