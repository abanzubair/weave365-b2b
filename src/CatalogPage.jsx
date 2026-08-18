/**
 * Catalog Component
 * Purpose: Handles the bulk B2B catalog view, featuring advanced sidebar filters (category, fabric, price ranges),
 * instantaneous text search, custom responsive product grids, and quick order list compilation.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, Search, X, RotateCcw } from 'lucide-react';
import { ProductCard } from './components/ProductCard.jsx';
import { SectionTitle } from './components/SectionTitle.jsx';
import { StateMessage } from './components/StateMessage.jsx';
import CatalogPageSkeleton from './components/CatalogPageSkeleton.jsx';
import Breadcrumb from './components/Breadcrumb.jsx';
import EmptyCategorySourcing from './components/EmptyCategorySourcing.jsx';
import { usePageSeo } from './hooks/usePageSeo.js';
import { seoCategoryMap, getCategorySlug } from './config.js';

export function Catalog({
  title,
  products,
  status,
  error,
  categories,
  category,
  setCategory,
  fabrics,
  fabric,
  setFabric,
  weaves,
  weave,
  setWeave,
  priceRanges,
  priceRange,
  setPriceRange,
  search,
  setSearch,
  navigate,
  addToCart,
  toggleFavorite,
  favoriteKeys,
  priceAccess,
  openAuth,
  isTransitioning = false,
  pageSeoSettings = [],
}) {
  const getPageSize = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 820) {
      return 26;
    }
    return 25;
  };

  const [visibleCount, setVisibleCount] = useState(25);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setVisibleCount(getPageSize());
  }, []);

  // Calculate dynamic SEO values for Catalog
  const seoConfig = useMemo(() => {
    let seoTitle = title || "Wholesale Saree & Suit Catalogue | Weave 365";
    let seoDesc = "Browse our live Banarasi saree and suit wholesale catalogue. Sourced directly from Varanasi weavers for boutiques and retailers.";
    let seoCanonical = "/catalogue";

    if (search && search.trim() !== '') {
      seoTitle = `Wholesale Banarasi Sarees matching "${search}" | Weave 365`;
      seoDesc = `Explore wholesale Banarasi sarees matching "${search}" at direct-from-weaver wholesale prices with flexible MOQ for resellers and boutiques.`;
      seoCanonical = `/catalogue?search=${encodeURIComponent(search)}`;
    } else if (category && category !== 'All') {
      const pluralCategory = category === 'Under 999' ? category : (category.endsWith('s') ? category : `${category}s`);
      seoTitle = `Wholesale Banarasi ${pluralCategory} Online | Weave 365`;
      seoDesc = `Buy handwoven premium Banarasi ${category.toLowerCase()} at wholesale prices direct from Varanasi weavers. High quality, verified silk collections.`;
      
      const cleanSlug = getCategorySlug(category);
      if (cleanSlug) {
        seoCanonical = `/${cleanSlug}`;
      } else {
        seoCanonical = `/catalogue?category=${encodeURIComponent(category)}`;
      }
    } else if (fabric && fabric !== 'All') {
      const prettyFabric = fabric.charAt(0).toUpperCase() + fabric.slice(1);
      seoTitle = `Pure ${prettyFabric} Silk Banarasi Sarees Wholesale | Weave 365`;
      seoDesc = `Discover handwoven pure ${prettyFabric} Banarasi sarees at wholesale prices. Certified quality checks and worldwide shipping for boutique owners.`;
      seoCanonical = `/catalogue?fabric=${encodeURIComponent(fabric)}`;
    }

    return {
      title: seoTitle,
      description: seoDesc,
      canonical: seoCanonical
    };
  }, [title, category, fabric, search]);

  const override = useMemo(() => {
    if (!pageSeoSettings || pageSeoSettings.length === 0) return null;
    const path = seoConfig.canonical;
    const normalized = path.split('?')[0];
    return pageSeoSettings.find(setting => setting.path === normalized);
  }, [pageSeoSettings, seoConfig.canonical]);

  const finalSeoConfig = useMemo(() => {
    if (override) {
      return {
        title: override.metaTitle || seoConfig.title,
        description: override.metaDescription || seoConfig.description,
        canonical: override.canonicalPath || seoConfig.canonical
      };
    }
    return seoConfig;
  }, [override, seoConfig]);

  usePageSeo(finalSeoConfig);

  const closeWithAnimation = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setOpenDropdown(null);
      setIsClosing(false);
    }, 250); // Match CSS duration
  };

  const toggleDropdown = (name) => {
    if (openDropdown === name) {
      closeWithAnimation();
    } else {
      setOpenDropdown(name);
      setIsClosing(false);
    }
  };

  // Stable ref to closeWithAnimation for use inside useEffect
  const closeRef = useRef(closeWithAnimation);
  closeRef.current = closeWithAnimation;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return;
    
    const handleClickOutside = (event) => {
      // If the click is not inside a filter-dropdown, close it
      if (!event.target.closest('.filter-dropdown')) {
        closeRef.current();
      }
    };

    // Use a small timeout to avoid the same click that opens the dropdown from immediately closing it
    // though e.stopPropagation() on the trigger would also work.
    // Given the current structure, adding the listener on next tick is safer.
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  const hasActiveFilters =
    category !== 'All' ||
    fabric !== 'All' ||
    weave !== 'All' ||
    (priceAccess?.canViewPrices && priceRange !== 'All') ||
    (search && search.trim() !== '');
 
  const resetFilters = () => {
    setCategory('All');
    setFabric('All');
    setWeave('All');
    setPriceRange('All');
    if (setSearch) setSearch('');
    setVisibleCount(getPageSize());
    navigate('catalogue', null, null, { category: 'All', fabric: 'All', weave: 'All', price: 'All', search: '' });
  };

  const breadcrumbItems = useMemo(() => {
    const items = [
      { name: 'Home', url: '/', route: 'home' }
    ];

    if (title && title !== 'Catalogue') {
      items.push({ name: title, url: '/catalogue', route: 'catalogue', routeOptions: { category: category || 'All', fabric: 'All', weave: 'All', price: 'All', search: '' } });
    } else {
      items.push({ name: 'Catalogue', url: '/catalogue', route: 'catalogue', routeOptions: { category: 'All', fabric: 'All', weave: 'All', price: 'All', search: '' } });
      if (category && category !== 'All') {
        const catSlug = getCategorySlug(category);
        items.push({ name: category, url: `/${catSlug}`, route: catSlug, routeOptions: { category, fabric: 'All', weave: 'All', price: 'All', search: '' } });
      }
    }

    if (fabric && fabric !== 'All') {
      items.push({ name: fabric, url: '/catalogue', route: 'catalogue', routeOptions: { category, fabric, weave: 'All', price: 'All', search: '' } });
    }
    if (weave && weave !== 'All') {
      items.push({ name: weave, url: '/catalogue', route: 'catalogue', routeOptions: { category, fabric, weave, price: 'All', search: '' } });
    }

    return items;
  }, [title, category, fabric, weave]);

  return (
    <section className="section catalog-page">
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />

      <h1 className="sr-only">
        {search && search.trim() !== ''
          ? `Wholesale Banarasi Sarees matching "${search}" - Weave 365`
          : (title || "Banarasi Sarees and Suits Catalogue")}
      </h1>
      {openDropdown && (
        <div 
          className={`filter-backdrop-overlay ${isClosing ? 'closing' : ''}`} 
          onClick={closeWithAnimation} 
        />
      )}

      <div className="catalog-toolbar">
        <div className="catalog-header-row">
          <SectionTitle 
            title={search && search.trim() !== '' ? `Search Results: "${search}"` : (title || "Catalogue")} 
            align="left" 
          />
          {hasActiveFilters && (
            <button type="button" className="reset-filters-btn mobile-only-reset" onClick={resetFilters}>
              <RotateCcw size={14} /> Reset Filters
            </button>
          )}
        </div>

        {/* Premium Mobile Search Bar with AI Visual Search */}
        {setSearch && (
          <div className="catalog-search-wrapper">
            <label className="catalog-search-input">
              <Search size={16} />
              <input
                type="text"
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                  }
                }}
                placeholder="Search designs, fabrics, codes..."
              />
              {search && (
                <button type="button" className="clear-search-btn" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
        )}

        <div className="catalog-filters-container">
          {/* Category Dropdown */}
          <div className={`filter-dropdown ${openDropdown === 'category' ? 'open' : ''} ${isClosing && openDropdown === 'category' ? 'closing' : ''}`}>
            <button type="button" className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('category'); }}>
              <div className="filter-label-wrap">
                <label>Category</label>
                <span>{category}</span>
              </div>
              <ChevronDown size={18} />
            </button>
            <div className="filter-dropdown-menu">
              {categories.map((name) => (
                <button type="button"
                  key={name}
                  className={category === name ? 'active' : ''}
                  onClick={() => {
                    setCategory(name);
                    setVisibleCount(getPageSize());
                    if (name === 'All' || name === 'all') {
                      navigate('catalogue', null, null, { category: 'All' });
                    } else {
                      const catSlug = getCategorySlug(name);
                      navigate(catSlug, null, null, { category: name });
                    }
                    closeWithAnimation();
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {priceAccess?.canViewPrices && (
            <div className={`filter-dropdown ${openDropdown === 'price' ? 'open' : ''} ${isClosing && openDropdown === 'price' ? 'closing' : ''}`}>
              <button type="button" className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('price'); }}>
                <div className="filter-label-wrap">
                  <label>Price Range</label>
                  <span>{priceRange}</span>
                </div>
                <ChevronDown size={18} />
              </button>
              <div className="filter-dropdown-menu">
                {priceRanges.map((range) => (
                  <button type="button"
                    key={range}
                    className={priceRange === range ? 'active' : ''}
                    onClick={() => {
                      setPriceRange(range);
                      setVisibleCount(getPageSize());
                      closeWithAnimation();
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fabric Dropdown */}
          <div className={`filter-dropdown fabric-filter ${openDropdown === 'fabric' ? 'open' : ''} ${isClosing && openDropdown === 'fabric' ? 'closing' : ''}`}>
            <button type="button" className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('fabric'); }}>
              <div className="filter-label-wrap">
                <label>Fabric</label>
                <span>{fabric}</span>
              </div>
              <ChevronDown size={18} />
            </button>
            <div className="filter-dropdown-menu">
              {fabrics.map((name) => (
                <button type="button"
                  key={name}
                  className={fabric === name ? 'active' : ''}
                  onClick={() => {
                    setFabric(name);
                    setVisibleCount(getPageSize());
                    closeWithAnimation();
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
 
          {/* Weave Dropdown */}
          <div className={`filter-dropdown weave-filter ${openDropdown === 'weave' ? 'open' : ''} ${isClosing && openDropdown === 'weave' ? 'closing' : ''}`}>
            <button type="button" className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('weave'); }}>
              <div className="filter-label-wrap">
                <label>Weave</label>
                <span>{weave}</span>
              </div>
              <ChevronDown size={18} />
            </button>
            <div className="filter-dropdown-menu">
              {weaves.map((name) => (
                <button type="button"
                  key={name}
                  className={weave === name ? 'active' : ''}
                  onClick={() => {
                    setWeave(name);
                    setVisibleCount(getPageSize());
                    closeWithAnimation();
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button type="button" className="filter-dropdown-trigger reset-filters-trigger desktop-only-reset" onClick={resetFilters}>
              <div className="filter-label-wrap">
                <label>Reset</label>
                <span>All Filters</span>
              </div>
              <RotateCcw size={15} className="reset-icon-gold" />
            </button>
          )}
        </div>
      </div>

      {status === 'error' && <StateMessage status={status} error={error} />}
      
      <div className="catalog-grid">
        {status === 'loading' || isTransitioning ? (
          <CatalogPageSkeleton count={12} wrap={false} />
        ) : (
          products.slice(0, visibleCount).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={product.variants[0]}
              navigate={navigate}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              isFavorite={favoriteKeys.has(product.id)}
              priceAccess={priceAccess}
              openAuth={openAuth}
            />
          ))
        )}
      </div>
      
      {products.length > visibleCount && (
        <div className="load-more-row">
          <button type="button" className="secondary-button" onClick={() => setVisibleCount(prev => prev + getPageSize())}>
            Show more products
          </button>
        </div>
      )}

      {status === 'ready' && products.length === 0 && (
        category && category !== 'All' ? (
          <EmptyCategorySourcing categoryName={category} navigate={navigate} />
        ) : (
          <p className="empty-state">No products match this search.</p>
        )
      )}
    </section>
  );
}
