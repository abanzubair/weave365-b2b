/**
 * HomeProductRails Component
 * Purpose: Renders the New Arrivals and Best Sellers horizontal scroll rails on the homepage.
 * Extracted into a client-deferred chunk to keep ProductCard and productCard.css out of the
 * initial critical render-blocking path on mobile and desktop.
 */
import { memo } from 'react';
import { SectionTitle } from './SectionTitle.jsx';
import { AppLink } from './AppLink.jsx';
import { ProductCard } from './ProductCard.jsx';
import CatalogPageSkeleton from './CatalogPageSkeleton.jsx';
import { StateMessage } from './StateMessage.jsx';
import { ArrowRight, ChevronLeft, ChevronRight } from './icons.jsx';

export const HomeProductRails = memo(function HomeProductRails({
  arrivals = [],
  bestsellers = [],
  status,
  error,
  scrollProductRail,
  navigate,
  addToCart,
  toggleFavorite,
  favoriteKeys = new Set(),
  priceAccess,
  openAuth,
}) {
  return (
    <>
      <section className="section home-product-section new-arrivals-section">
        <div className="section-heading-row">
          <SectionTitle title="New Arrivals" align="left" />
          <AppLink
            to="catalogue"
            className="text-button"
            navigate={navigate}
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            View All <ArrowRight size={17} />
          </AppLink>
        </div>
        {status === 'error' && <StateMessage status={status} error={error} />}
        <div className="scroll-wrapper">
          <button
            type="button"
            className="scroll-arrow left"
            onClick={() => scrollProductRail('new-arrivals-row', -1)}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="product-row scrollable-row" id="new-arrivals-row">
            {status === 'loading' ? (
              <CatalogPageSkeleton count={5} wrap={false} />
            ) : (
              arrivals.map(({ product, image, variant }, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  product={{ ...product, images: [image, ...product.images] }}
                  variant={variant}
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

          <button
            type="button"
            className="scroll-arrow right"
            onClick={() => scrollProductRail('new-arrivals-row', 1)}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </section>

      {(status === 'loading' || bestsellers.length > 0) && (
        <section className="section home-product-section bestsellers-section">
          <div className="section-heading-row">
            <SectionTitle title="Best Sellers" align="left" />
            <AppLink
              to="catalogue"
              className="text-button"
              navigate={navigate}
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              View All <ArrowRight size={17} />
            </AppLink>
          </div>
          {status === 'error' && <StateMessage status={status} error={error} />}
          <div className="scroll-wrapper">
            <button
              type="button"
              className="scroll-arrow left"
              onClick={() => scrollProductRail('bestsellers-row', -1)}
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="product-row scrollable-row" id="bestsellers-row">
              {status === 'loading' ? (
                <CatalogPageSkeleton count={5} wrap={false} />
              ) : (
                bestsellers.map(({ product, image, variant }, index) => (
                  <ProductCard
                    key={`${product.id}-${index}`}
                    product={{ ...product, images: [image, ...product.images] }}
                    variant={variant}
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

            <button
              type="button"
              className="scroll-arrow right"
              onClick={() => scrollProductRail('bestsellers-row', 1)}
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>
      )}
    </>
  );
});
