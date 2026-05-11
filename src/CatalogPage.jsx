import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProductCard, SectionTitle, StateMessage } from './storefrontShared.jsx';

export function Catalog({
  products,
  status,
  error,
  categories,
  category,
  setCategory,
  fabrics,
  fabric,
  setFabric,
  priceRanges,
  priceRange,
  setPriceRange,
  navigate,
  addToCart,
  toggleFavorite,
  favoriteKeys,
}) {
  const [visibleCount, setVisibleCount] = useState(24);
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <section className="section catalog-page">
      <div className="catalog-toolbar">
        <SectionTitle title="Wholesale Catalogue" align="left" />
        
        <div className="catalog-filters-container">
          {/* Category Dropdown */}
          <div className={`filter-dropdown ${openDropdown === 'category' ? 'open' : ''}`}>
            <button className="filter-dropdown-trigger" onClick={() => toggleDropdown('category')}>
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
                    setVisibleCount(24);
                    setOpenDropdown(null);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Dropdown */}
          <div className={`filter-dropdown ${openDropdown === 'price' ? 'open' : ''}`}>
            <button className="filter-dropdown-trigger" onClick={() => toggleDropdown('price')}>
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
                    setVisibleCount(24);
                    setOpenDropdown(null);
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Fabric Dropdown */}
          <div className={`filter-dropdown fabric-filter ${openDropdown === 'fabric' ? 'open' : ''}`}>
            <button className="filter-dropdown-trigger" onClick={() => toggleDropdown('fabric')}>
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
                    setVisibleCount(24);
                    setOpenDropdown(null);
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
        {products.slice(0, visibleCount).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={product.variants[0]}
            navigate={navigate}
            addToCart={addToCart}
            toggleFavorite={toggleFavorite}
            isFavorite={favoriteKeys.has(product.id)}
          />
        ))}
      </div>
      
      {products.length > visibleCount && (
        <div className="load-more-row">
          <button className="secondary-button" onClick={() => setVisibleCount(prev => prev + 24)}>
            Show more products
          </button>
        </div>
      )}

      {status === 'ready' && products.length === 0 && (
        <p className="empty-state">No products match this search.</p>
      )}
    </section>
  );
}
