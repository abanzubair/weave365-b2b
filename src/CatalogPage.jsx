/**
 * Catalog Component
 * Purpose: Handles the bulk B2B catalog view, featuring advanced sidebar filters (category, fabric, price ranges),
 * instantaneous text search, custom responsive product grids, and quick order list compilation.
 */
import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, RotateCcw } from 'lucide-react';
import { ProductCard } from './components/ProductCard.jsx';
import { SectionTitle } from './components/SectionTitle.jsx';
import { StateMessage } from './components/StateMessage.jsx';
import Breadcrumb from './components/Breadcrumb.jsx';
import EmptyCategorySourcing from './components/EmptyCategorySourcing.jsx';

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
}) {
  const [visibleCount, setVisibleCount] = useState(25);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Google JSON-LD BreadcrumbList Schema injection
  useEffect(() => {
    if (typeof window === 'undefined') return;
 
    const schemaItems = [
      { name: 'Home', url: '/' },
      { name: title || 'Wholesale Saree Catalogue', url: '/shop' }
    ];
    if (category && category !== 'All') {
      schemaItems.push({ name: category, url: `/shop` });
    }
    if (fabric && fabric !== 'All') {
      schemaItems.push({ name: fabric, url: `/shop` });
    }
    if (weave && weave !== 'All') {
      schemaItems.push({ name: weave, url: `/shop` });
    }
 
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": schemaItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `${window.location.origin}${item.url}`
      }))
    };
 
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'catalog-breadcrumb-ld-json';
    script.text = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);
 
    return () => {
      const oldScript = document.getElementById('catalog-breadcrumb-ld-json');
      if (oldScript) oldScript.remove();
    };
  }, [title, category, fabric, weave]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdown) return;
    
    const handleClickOutside = (event) => {
      // If the click is not inside a filter-dropdown, close it
      if (!event.target.closest('.filter-dropdown')) {
        closeWithAnimation();
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
    setVisibleCount(25);
  };

  const breadcrumbItems = useMemo(() => {
    return [
      { name: 'Home', url: '/', route: 'home' },
      { name: title || 'Wholesale Saree Catalogue', url: '/shop', route: 'shop' },
      ...(category && category !== 'All' ? [{ name: category }] : []),
      ...(fabric && fabric !== 'All' ? [{ name: fabric }] : []),
      ...(weave && weave !== 'All' ? [{ name: weave }] : [])
    ];
  }, [title, category, fabric, weave]);

  return (
    <section className="section catalog-page">
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />

      <h1 className="sr-only">
        {search && search.trim() !== ''
          ? `Wholesale Banarasi Sarees matching "${search}" - Weave 365`
          : (title || "Banarasi Sarees and Suits Wholesale Catalogue")}
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
            title={search && search.trim() !== '' ? `Search Results: "${search}"` : (title || "Wholesale Catalogue")} 
            align="left" 
          />
          {hasActiveFilters && (
            <button className="reset-filters-btn mobile-only-reset" onClick={resetFilters}>
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
                <button className="clear-search-btn" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
        )}

        <div className="catalog-filters-container">
          {/* Category Dropdown */}
          <div className={`filter-dropdown ${openDropdown === 'category' ? 'open' : ''} ${isClosing && openDropdown === 'category' ? 'closing' : ''}`}>
            <button className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('category'); }}>
              <div className="filter-label-wrap">
                <label>Category</label>
                <span>{category}</span>
              </div>
              <ChevronDown size={18} />
            </button>
            <div className="filter-dropdown-menu">
              {categories.map((name) => (
                <button
                  key={name}
                  className={category === name ? 'active' : ''}
                  onClick={() => {
                    setCategory(name);
                    setVisibleCount(25);
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
              <button className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('price'); }}>
                <div className="filter-label-wrap">
                  <label>Price Range</label>
                  <span>{priceRange}</span>
                </div>
                <ChevronDown size={18} />
              </button>
              <div className="filter-dropdown-menu">
                {priceRanges.map((range) => (
                  <button
                    key={range}
                    className={priceRange === range ? 'active' : ''}
                    onClick={() => {
                      setPriceRange(range);
                      setVisibleCount(25);
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
            <button className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('fabric'); }}>
              <div className="filter-label-wrap">
                <label>Fabric</label>
                <span>{fabric}</span>
              </div>
              <ChevronDown size={18} />
            </button>
            <div className="filter-dropdown-menu">
              {fabrics.map((name) => (
                <button
                  key={name}
                  className={fabric === name ? 'active' : ''}
                  onClick={() => {
                    setFabric(name);
                    setVisibleCount(25);
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
            <button className="filter-dropdown-trigger" onClick={(e) => { e.stopPropagation(); toggleDropdown('weave'); }}>
              <div className="filter-label-wrap">
                <label>Weave</label>
                <span>{weave}</span>
              </div>
              <ChevronDown size={18} />
            </button>
            <div className="filter-dropdown-menu">
              {weaves.map((name) => (
                <button
                  key={name}
                  className={weave === name ? 'active' : ''}
                  onClick={() => {
                    setWeave(name);
                    setVisibleCount(25);
                    closeWithAnimation();
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button className="filter-dropdown-trigger reset-filters-trigger desktop-only-reset" onClick={resetFilters}>
              <div className="filter-label-wrap">
                <label>Reset</label>
                <span>All Filters</span>
              </div>
              <RotateCcw size={15} className="reset-icon-gold" />
            </button>
          )}
        </div>
      </div>

      <StateMessage status={status} error={error} />
      
      <div className="catalog-grid">
        {products.slice(0, visibleCount).map((product) => (
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
        ))}
      </div>
      
      {products.length > visibleCount && (
        <div className="load-more-row">
          <button className="secondary-button" onClick={() => setVisibleCount(prev => prev + 25)}>
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
