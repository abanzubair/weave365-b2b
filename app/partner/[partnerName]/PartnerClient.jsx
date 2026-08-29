'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { Catalog } from '../../../src/CatalogPage.jsx';
import { useStorefront } from '../../../src/store/useStorefront.js';
import { useAppNavigate } from '../../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../../src/utils/buyerAccess.js';
import { upsertCart, persistCart, persistFavorites } from '../../../src/utils/cartHelpers.js';
import { slugifyPartner } from '../../../src/hooks/useAppNavigate.js';

export default function PartnerClient({ partnerSlug, initialProducts = [] }) {
  const navigate = useAppNavigate();
  const {
    user,
    buyerProfile,
    products: storeProducts,
    setProducts,
    configOptions,
    favorites,
    setFavorites,
    setCart,
    setCartOpen,
  } = useStorefront();

  useEffect(() => {
    if (initialProducts.length > 0 && storeProducts.length === 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts, storeProducts.length, setProducts]);

  const rawProducts = storeProducts.length > 0 ? storeProducts : initialProducts;

  const partnerFilteredProducts = useMemo(() => {
    return rawProducts.filter(
      (p) => p.partner && slugifyPartner(p.partner) === partnerSlug && !p.isArchived
    );
  }, [rawProducts, partnerSlug]);

  const partnerRealName = useMemo(() => {
    const found = rawProducts.find((p) => p.partner && slugifyPartner(p.partner) === partnerSlug);
    if (found?.partner) return found.partner;
    return partnerSlug
      ? partnerSlug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : 'Partner';
  }, [rawProducts, partnerSlug]);

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

  return (
    <Catalog
      title={`${partnerRealName}'s Collection`}
      products={partnerFilteredProducts}
      status="ready"
      error=""
      categories={configOptions?.categories || []}
      category="All"
      setCategory={() => {}}
      fabrics={configOptions?.fabrics || []}
      fabric="All"
      setFabric={() => {}}
      weaves={configOptions?.weaves || []}
      weave="All"
      setWeave={() => {}}
      occasions={configOptions?.occasions || []}
      occasion="All"
      setOccasion={() => {}}
      priceRanges={configOptions?.priceRanges || []}
      priceRange="All"
      setPriceRange={() => {}}
      search=""
      setSearch={() => {}}
      navigate={navigate}
      addToCart={addToCart}
      toggleFavorite={toggleFavorite}
      favoriteKeys={favoriteKeySet}
      priceAccess={priceAccess}
      openAuth={() => navigate('signup')}
      isTransitioning={false}
    />
  );
}
