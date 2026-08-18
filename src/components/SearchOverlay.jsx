import { useRef, useState, useEffect, useMemo, useDeferredValue } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { customerPrice, fallbackProductImage, formatMoney } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { useStorefront } from '../store/useStorefront.js';
import { fetchProducts } from '../productData.js';
import { sortByStockDateDesc } from '../utils/sortProducts.js';

/**
 * Global search overlay with quick links and real-time product results.
 */
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export function SearchOverlay(props) {
  const store = useStorefront();

  const searchActive = props.searchActive ?? store.searchActive;
  const setSearchActive = props.setSearchActive || store.setSearchActive;
  const navigate = props.navigate;
  const priceAccess = props.priceAccess;

  const [internalSearch, setInternalSearch] = useState('');
  const search = props.search !== undefined ? props.search : internalSearch;
  const setSearch = props.setSearch || setInternalSearch;

  const inputRef = useRef(null);

  // Auto-focus input when searchActive becomes true
  useEffect(() => {
    if (searchActive) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      if (props.search === undefined) {
        setInternalSearch('');
      }
    }
  }, [searchActive, props.search]);

  // Ensure products are fetched if search is activated on pages where products weren't eagerly loaded
  useEffect(() => {
    if (searchActive && (!store.products || store.products.length === 0)) {
      fetchProducts()
        .then((prods) => {
          if (prods && prods.length > 0 && store.setProducts) {
            store.setProducts(prods);
          }
        })
        .catch(console.error);
    }
  }, [searchActive, store.products, store.setProducts]);

  // Handle ESC key to close search
  useEffect(() => {
    if (!searchActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchActive(false);
        setSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchActive, setSearchActive, setSearch]);

  const rawProducts = (props.visibleProducts && props.visibleProducts.length > 0)
    ? props.visibleProducts
    : (store.products || []);

  const deferredSearch = useDeferredValue(search);
  const searchTerm = useMemo(() => (deferredSearch || '').trim().toLowerCase(), [deferredSearch]);

  const matchingProducts = useMemo(() => {
    if (!searchTerm) return [];

    const searchTerms = searchTerm.split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return [];

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
        product.name,
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

      return searchTerms.every((term) => text.includes(term));
    });

    return sortByStockDateDesc(filtered);
  }, [rawProducts, searchTerm]);

  const handleSearchSubmit = (overrideSearch) => {
    const term = (overrideSearch !== undefined ? overrideSearch : search).trim();
    setSearchActive(false);
    setSearch('');
    if (term) {
      navigate('catalogue', null, null, { search: term });
    } else {
      navigate('catalogue');
    }
  };

  if (!searchActive) return null;

  return (
    <div
      className="premium-search-overlay animate-fade-in"
      onClick={() => {
        setSearchActive(false);
        setSearch('');
      }}
    >
      <div className="premium-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="premium-search-inner-wrapper">
          <div className="premium-search-field-container">
            <Search size={22} strokeWidth={1.5} className="search-icon-premium" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              placeholder="What are you looking for?"
              autoFocus
              className="premium-search-input-field"
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearch('');
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="search-modal-close-btn"
              onClick={() => {
                setSearchActive(false);
                setSearch('');
              }}
            >
              <span className="close-text">Close</span> <span className="close-x">✕</span>
            </button>
          </div>

          <div className="premium-search-content-grid">
            {!search ? (
              <div className="search-preset-suggestions animate-fade-in">
                <div className="preset-group">
                  <h3>Trending Saree Fabrics</h3>
                  <div className="preset-tags">
                    {['Banarasi', 'Katan Silk', 'Organza', 'Linen', 'Tussar', 'Georgette'].map((tag) => (
                      <button
                        type="button"
                        key={tag}
                        className="preset-tag-btn"
                        onClick={() => {
                          setSearch(tag);
                          if (inputRef.current) inputRef.current.focus();
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="preset-group">
                  <h3>Quick Links</h3>
                  <ul className="quick-access-list">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchActive(false);
                          setSearch('');
                          navigate('catalogue');
                        }}
                      >
                        <span>Browse All Collections</span>
                        <ArrowRight size={14} />
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchActive(false);
                          setSearch('');
                          navigate('resell-sarees-online');
                        }}
                      >
                        <span>Wholesale & Reseller Partner Program</span>
                        <ArrowRight size={14} />
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchActive(false);
                          setSearch('');
                          scrollToSection('brand-collab');
                        }}
                      >
                        <span>Collaborating Brands</span>
                        <ArrowRight size={14} />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="premium-search-results-panel">
                <div className="results-header">
                  <span className="results-title">Collections Found</span>
                  <span className="results-count">{matchingProducts.length} premium products</span>
                </div>

                {matchingProducts.length > 0 ? (
                  <div className="results-split-layout">
                    <div className="results-products-grid">
                      {matchingProducts.slice(0, 6).map((product) => {
                        const price = customerPrice(product.variants?.[0]?.prices || {}, priceAccess);
                        const image = product.images?.[0] || fallbackProductImage;
                        return (
                          <div
                            key={product.id}
                            className="premium-search-result-card animate-scale-up"
                            onClick={() => {
                              navigate('product', product.id);
                              setSearch('');
                              setSearchActive(false);
                            }}
                          >
                            <div className="result-img-wrapper">
                              <img src={image} alt={product.title} loading="lazy" />
                              {product.fabric && <span className="result-fabric-badge">{product.fabric}</span>}
                            </div>
                            <div className="result-card-info">
                              <h4 className="result-product-title">{product.name || product.title}</h4>
                              <span className="result-product-price">
                                {price != null && price > 0 ? formatMoney(price) : priceNoticeForAccess(priceAccess)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {matchingProducts.length > 6 && (
                      <button
                        type="button"
                        className="premium-search-view-all-btn"
                        onClick={() => handleSearchSubmit()}
                      >
                        View all {matchingProducts.length} premium products
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="premium-search-no-results-state">
                    <div className="no-results-icon">🔍</div>
                    <h3>No match found</h3>
                    <p>We couldn't find any premium products for "{search}".</p>
                    <button
                      type="button"
                      className="reset-search-btn"
                      onClick={() => {
                        setSearch('');
                        if (inputRef.current) inputRef.current.focus();
                      }}
                    >
                      Try another query
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
