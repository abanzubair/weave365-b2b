/**
 * @file NewArrivalsPage.jsx
 * @description Dedicated catalog view displaying recently stocked Banarasi sarees and suits.
 * Leverages stateful filter dropdowns (category, fabric, pricing range) and fuzzy search logic to narrow
 * results. Dynamically cascades down to the most recent items sorted by stock entry date if no explicitly
 * flagged "new arrivals" are available, ensuring fresh collection presentations for retail buyers.
 * 
 * @module views/NewArrivalsPage
 * @param {Object} props
 * @param {Array} props.products - Full B2B catalog list from local DB and Google Sheets
 * @param {string} props.status - Loading/ready state of the active catalog query
 * @param {Object} props.error - Active query/sync errors if any
 * @param {Function} props.navigate - Internal client router handler
 * @param {Function} props.addToCart - Callback to push bulk pieces to the draft order list
 * @param {Function} props.toggleFavorite - Callback to bookmark/unbookmark items
 * @param {Set} props.favoriteKeys - Unique set of currently bookmarked product IDs
 * @param {Object} props.priceAccess - Active buyer type and price visibility clearances
 * @param {Function} props.openAuth - Trigger callback to display login/registration modal
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, RotateCcw } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.jsx';
import { SectionTitle } from '../components/SectionTitle.jsx';
import { StateMessage } from '../components/StateMessage.jsx';

export function NewArrivalsPage({
  products = [],
  status,
  error,
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

  // Filter States
  const [category, setCategory] = useState('All');
  const [fabric, setFabric] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [search, setSearch] = useState('');

  const closeWithAnimation = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setOpenDropdown(null);
      setIsClosing(false);
    }, 250); // Match CSS transition duration
  };

  const toggleDropdown = (name) => {
    if (openDropdown === name) {
      closeWithAnimation();
    } else {
      setOpenDropdown(name);
      setIsClosing(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    if (!openDropdown) return;
    
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown')) {
        closeWithAnimation();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  // 1. Isolate the base new arrivals
  const baseNewArrivals = useMemo(() => {
    let filtered = products.filter(p => p.isNew && !p.isArchived);

    // Defensive fallback: if no explicitly flagged new items, pull the latest 16 items by stockInDate
    if (filtered.length === 0) {
      filtered = [...products]
        .filter(p => !p.isArchived)
        .sort((a, b) => {
          const dateA = a.stockInDate ? new Date(a.stockInDate).getTime() : 0;
          const dateB = b.stockInDate ? new Date(b.stockInDate).getTime() : 0;
          return dateB - dateA; // descending
        })
        .slice(0, 16);
    }
    return filtered;
  }, [products]);

  // 2. Identify available categories within the new arrivals list
  const categoriesList = useMemo(() => {
    const categoriesSet = new Set();
    baseNewArrivals.forEach(p => {
      if (p.category) {
        categoriesSet.add(p.category);
      }
    });
    return ['All', ...Array.from(categoriesSet)];
  }, [baseNewArrivals]);

  // 3. Identify available fabrics within the new arrivals list
  const fabricsList = useMemo(() => {
    const fabricsSet = new Set();
    baseNewArrivals.forEach(p => {
      if (p.fabric) {
        fabricsSet.add(p.fabric);
      }
    });
    return ['All', ...Array.from(fabricsSet)];
  }, [baseNewArrivals]);

  // Standard Price Ranges list
  const priceRangesList = [
    'All',
    'Below ₹500',
    '₹500 – ₹999',
    '₹1,000 – ₹1,999',
    '₹2,000 – ₹2,999',
    '₹3,000 – ₹4,999',
    '₹5,000 – ₹9,999',
    '₹10,000+',
  ];

  // 4. Filter new arrivals by active values
  const filteredProducts = useMemo(() => {
    return baseNewArrivals.filter(product => {
      // Category Filter
      if (category !== 'All' && product.category !== category) return false;

      // Fabric Filter
      if (fabric !== 'All' && product.fabric !== fabric) return false;

      // Price Filter (only if buyer is logged in / has price access)
      if (priceAccess?.canViewPrices && priceRange !== 'All') {
        if (product.priceRange !== priceRange) return false;
      }

      // Search Query Filter
      if (search && search.trim() !== '') {
        const query = search.toLowerCase().trim();
        const codeText = product.id ? String(product.id).toLowerCase() : '';
        const titleText = product.title ? String(product.title).toLowerCase() : '';
        const descText = product.description ? String(product.description).toLowerCase() : '';
        const fabricText = product.fabric ? String(product.fabric).toLowerCase() : '';
        const workText = product.work ? String(product.work).toLowerCase() : '';
        
        const matches = 
          codeText.includes(query) ||
          titleText.includes(query) ||
          descText.includes(query) ||
          fabricText.includes(query) ||
          workText.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [baseNewArrivals, category, fabric, priceRange, search, priceAccess]);

  const hasActiveFilters =
    category !== 'All' ||
    fabric !== 'All' ||
    (priceAccess?.canViewPrices && priceRange !== 'All') ||
    (search && search.trim() !== '');

  const resetFilters = () => {
    setCategory('All');
    setFabric('All');
    setPriceRange('All');
    setSearch('');
    setVisibleCount(25);
  };

  return (
    <section className="section catalog-page">
      <h1 className="sr-only">Latest Banarasi Sarees and Suits - New Arrivals</h1>
      {openDropdown && (
        <div 
          className={`filter-backdrop-overlay ${isClosing ? 'closing' : ''}`} 
          onClick={closeWithAnimation} 
        />
      )}

      <div className="catalog-toolbar">
        <div className="catalog-header-row">
          <SectionTitle title="New Arrivals" align="left" />
          {hasActiveFilters && (
            <button className="reset-filters-btn" onClick={resetFilters}>
              <RotateCcw size={14} /> Reset Filters
            </button>
          )}
        </div>

        {/* Premium Search Bar */}
        <div className="catalog-search-wrapper">
          <label className="catalog-search-input">
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search new arrivals..."
            />
            {search && (
              <button className="clear-search-btn" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </label>
        </div>

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
              {categoriesList.map((name) => (
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
                {priceRangesList.map((range) => (
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
              {fabricsList.map((name) => (
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
        </div>
      </div>

      <StateMessage status={status} error={error} />
      
      <div className="catalog-grid">
        {filteredProducts.slice(0, visibleCount).map((product) => (
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
      
      {filteredProducts.length > visibleCount && (
        <div className="load-more-row">
          <button className="secondary-button" onClick={() => setVisibleCount(prev => prev + 25)}>
            Show more new arrivals
          </button>
        </div>
      )}

      {status === 'ready' && filteredProducts.length === 0 && (
        <p className="empty-state">No new arrivals match your filters.</p>
      )}
    </section>
  );
}
