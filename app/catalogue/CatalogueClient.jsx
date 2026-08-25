'use client';

import { useMemo, useState, useCallback, useEffect, useDeferredValue } from 'react';
import { useSearchParams } from 'next/navigation';
import { Catalog } from '../../src/CatalogPage.jsx';
import { useStorefront } from '../../src/store/useStorefront.js';
import { useAppNavigate } from '../../src/hooks/useAppNavigate.js';
import { getBuyerAccess } from '../../src/utils/buyerAccess.js';
import { checkProductPriceInRange } from '../../src/storefrontShared.jsx';
import { sortByStockDateDesc } from '../../src/utils/sortProducts.js';
import { upsertCart, persistCart, persistFavorites } from '../../src/utils/cartHelpers.js';
import { homeCategoryNames } from '../../src/views/Home.jsx';
import { getCategorySlug } from '../../src/config.js';

export default function CatalogueClient({
  initialProducts = [],
  initialConfigOptions = null,
  initialCategory = null,
  categorySlug = null,
}) {
  const searchParams = useSearchParams();
  const navigate = useAppNavigate();

  const {
    user,
    buyerProfile,
    products: storeProducts,
    setProducts,
    configOptions: storeConfigOptions,
    setConfigOptions,
    favorites,
    setFavorites,
    setCart,
    setCartOpen,
  } = useStorefront();

  useEffect(() => {
    if (initialProducts.length > 0 && storeProducts.length === 0) {
      setProducts(initialProducts);
    }
    if (initialConfigOptions && (!storeConfigOptions?.categories || storeConfigOptions.categories.length === 0)) {
      setConfigOptions(initialConfigOptions);
    }
  }, [initialProducts, initialConfigOptions, storeProducts.length, storeConfigOptions, setProducts, setConfigOptions]);

  const rawProducts = storeProducts.length > 0 ? storeProducts : initialProducts;
  const config = (storeConfigOptions?.categories?.length > 0 ? storeConfigOptions : initialConfigOptions) || {
    categories: [],
    fabrics: [],
    weaves: [],
    priceRanges: [],
  };

  const priceAccess = useMemo(() => {
    return getBuyerAccess(user, buyerProfile);
  }, [user, buyerProfile]);

  const categories = useMemo(() => {
    if (config.categories?.length > 0) {
      return ['All', ...config.categories];
    }
    return ['All', ...homeCategoryNames];
  }, [config.categories]);

  const fabrics = useMemo(() => {
    if (config.fabrics?.length > 0) {
      return ['All', ...config.fabrics];
    }
    const set = new Set();
    rawProducts.forEach((p) => {
      if (p.fabric) set.add(p.fabric.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [rawProducts, config.fabrics]);

  const weaves = useMemo(() => {
    if (config.weaves?.length > 0) {
      return ['All', ...config.weaves];
    }
    const set = new Set();
    rawProducts.forEach((p) => {
      if (p.weave) set.add(p.weave.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [rawProducts, config.weaves]);

  const priceRanges = useMemo(() => {
    if (config.priceRanges?.length > 0) {
      return ['All', ...config.priceRanges];
    }
    const set = new Set();
    rawProducts.forEach((p) => {
      if (p.priceRange) set.add(p.priceRange);
    });
    return ['All', ...Array.from(set).sort()];
  }, [rawProducts, config.priceRanges]);

  const urlCategory = searchParams?.get('category') || initialCategory || 'all';
  const urlFabric = searchParams?.get('fabric') || 'all';
  const urlWeave = searchParams?.get('weave') || 'all';
  const urlPriceRange = searchParams?.get('priceRange') || 'all';
  const urlSearch = searchParams?.get('search') || '';

  const activeCategory = useMemo(() => {
    const catQuery = searchParams?.get('category');
    if (catQuery) {
      const matched = categories.find((c) => c.toLowerCase() === catQuery.toLowerCase());
      if (matched) return matched;
    }
    if (initialCategory) {
      const matched = categories.find((c) => c.toLowerCase() === initialCategory.toLowerCase());
      if (matched) return matched;
      return initialCategory;
    }
    return 'All';
  }, [categories, searchParams, initialCategory]);

  const activeFabric = useMemo(() => {
    const matched = fabrics.find((f) => f.toLowerCase() === urlFabric.toLowerCase());
    return matched || 'All';
  }, [fabrics, urlFabric]);

  const activeWeave = useMemo(() => {
    const matched = weaves.find((w) => w.toLowerCase() === urlWeave.toLowerCase());
    return matched || 'All';
  }, [weaves, urlWeave]);

  const activePriceRange = useMemo(() => {
    const matched = priceRanges.find((p) => p.toLowerCase() === urlPriceRange.toLowerCase());
    return matched || 'All';
  }, [priceRanges, urlPriceRange]);

  const [localSearch, setLocalSearch] = useState(urlSearch);

  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  const deferredSearch = useDeferredValue(localSearch);
  const searchTerm = useMemo(() => deferredSearch.trim().toLowerCase(), [deferredSearch]);

  const setFilterParam = useCallback(
    (key, val) => {
      if (key === 'category') {
        if (val === 'All' || val === 'all') {
          navigate('catalogue', null, null, { category: 'All' });
        } else {
          const catSlug = getCategorySlug(val);
          navigate(catSlug, null, null, { category: val });
        }
      } else {
        if (activeCategory && activeCategory !== 'All') {
          const catSlug = getCategorySlug(activeCategory);
          navigate(catSlug, null, null, { [key]: val, category: activeCategory });
        } else {
          navigate('catalogue', null, null, { [key]: val });
        }
      }
    },
    [navigate, activeCategory]
  );

  const filteredProducts = useMemo(() => {
    const productsWithIndex = rawProducts.map((p, idx) => ({ ...p, _originalIndex: idx }));
    const filtered = productsWithIndex.filter((product) => {
      if (product.isArchived) return false;

      const variantCodes = (product.variants || []).map((v) => v.code).join(' ');
      const colorOptionNames = (product.colorOptions || []).map((c) => c.name);
      const variantColors = (product.variants || []).map((v) => v.color);
      const csvColors = [
        product.raw?.Color,
        product.raw?.Col,
        product.raw?.Colors,
        product.raw?.['Colors Name List'],
      ];
      const allColors = [...colorOptionNames, ...variantColors, ...csvColors]
        .filter(Boolean)
        .map((c) => String(c).trim())
        .join(' ');

      const weaveText = product.weave
        ? `${product.weave} ${product.weave} weave ${product.weave} weave type`
        : '';
      const purityText = product.purity
        ? `${product.purity} ${product.purity} purity ${product.purity} quality`
        : '';

      const text = [
        product.title,
        product.fabric,
        product.work,
        product.occasion,
        product.category,
        product.groupKey,
        product.partner,
        weaveText,
        purityText,
        allColors,
        variantCodes,
        product.pattern,
        product.style,
        product.subCategory,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const searchTerms = searchTerm.split(/\s+/).filter(Boolean);
      const matchesSearch = searchTerms.every((term) => text.includes(term));

      const matchesCategory =
        activeCategory === 'All' ||
        (activeCategory === 'New Arrivals' && product.isNew) ||
        (activeCategory === 'Bestsellers' && product.isTopSeller) ||
        product.fabric === activeCategory ||
        product.category === activeCategory;

      const matchesPrice = checkProductPriceInRange(product, activePriceRange, priceAccess);
      const matchesFabric =
        activeFabric === 'All' ||
        (product.fabric && product.fabric.trim().toLowerCase() === activeFabric.trim().toLowerCase());
      const matchesWeave =
        activeWeave === 'All' ||
        (product.weave && product.weave.trim().toLowerCase() === activeWeave.trim().toLowerCase());

      return matchesSearch && matchesCategory && matchesPrice && matchesFabric && matchesWeave;
    });

    return sortByStockDateDesc(filtered);
  }, [rawProducts, searchTerm, activeCategory, activePriceRange, activeFabric, activeWeave, priceAccess]);

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
      title="Catalogue"
      products={filteredProducts}
      status="ready"
      error=""
      categories={categories}
      category={activeCategory}
      setCategory={(cat) => setFilterParam('category', cat)}
      fabrics={fabrics}
      fabric={activeFabric}
      setFabric={(fab) => setFilterParam('fabric', fab)}
      weaves={weaves}
      weave={activeWeave}
      setWeave={(wve) => setFilterParam('weave', wve)}
      priceRanges={priceRanges}
      priceRange={activePriceRange}
      setPriceRange={(prc) => setFilterParam('priceRange', prc)}
      search={localSearch}
      setSearch={setLocalSearch}
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
