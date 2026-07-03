import { Search, ArrowRight } from 'lucide-react';
import { customerPrice, fallbackProductImage, formatMoney } from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';

/**
 * Global search overlay with quick links and real-time product results.
 */
const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export function SearchOverlay({
  searchActive,
  setSearchActive,
  search,
  setSearch,
  navigate,
  visibleProducts,
  priceAccess
}) {
  if (!searchActive) return null;

  return (
    <div className="premium-search-overlay animate-fade-in" onClick={() => { setSearchActive(false); setSearch(''); }}>
      <div className="premium-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="premium-search-inner-wrapper">
          <div className="premium-search-field-container">
            <Search size={22} strokeWidth={1.5} className="search-icon-premium" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setSearchActive(false);
                  navigate('catalogue');
                }
              }}
              placeholder="What are you looking for?"
              autoFocus
              className="premium-search-input-field"
            />
            {search && (
              <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
                Clear
              </button>
            )}
            <button type="button" 
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
                      <button type="button"
                        key={tag}
                        className="preset-tag-btn"
                        onClick={() => setSearch(tag)}
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
                      <button type="button" onClick={() => { navigate('catalogue'); setSearchActive(false); }}>
                        <span>Browse All Collections</span>
                        <ArrowRight size={14} />
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => { navigate('wholesale-partner-program'); setSearchActive(false); }}>
                        <span>Wholesale & Reseller Partner Program</span>
                        <ArrowRight size={14} />
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => { scrollToSection('brand-collab'); setSearchActive(false); }}>
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
                  <span className="results-count">{visibleProducts.length} premium products</span>
                </div>
                
                {visibleProducts.length > 0 ? (
                  <div className="results-split-layout">
                    <div className="results-products-grid">
                      {visibleProducts.slice(0, 6).map((product) => {
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
                    
                    {visibleProducts.length > 6 && (
                      <button type="button" 
                        className="premium-search-view-all-btn" 
                        onClick={() => {
                          navigate('catalogue');
                          setSearchActive(false);
                        }}
                      >
                        View all {visibleProducts.length} premium products
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="premium-search-no-results-state">
                    <div className="no-results-icon">🔍</div>
                    <h3>No match found</h3>
                    <p>We couldn't find any premium products for "{search}".</p>
                    <button type="button" className="reset-search-btn" onClick={() => setSearch('')}>
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
