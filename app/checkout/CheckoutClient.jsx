'use client';

import { useMemo, useCallback } from 'react';
import { CheckoutPage } from '../../src/views/CheckoutPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../src/utils/buyerAccess.js';
import { parseCartVariantCode } from '../../src/utils/cartHelpers.js';
import { serviceablePincodes } from '../../src/config.js';

export default function CheckoutClient() {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    products,
    cart,
    setCart,
    pincode,
    setPincode,
    codStatus,
    setCodStatus,
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

  const checkPincode = useCallback(() => {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }, [pincode, setCodStatus]);

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
    />
  );
}
