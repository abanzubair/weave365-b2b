import { ProductCard, SectionTitle, StateMessage } from './storefrontShared.jsx';

export function Catalog({
  products,
  status,
  error,
  categories,
  category,
  setCategory,
  navigate,
  addToCart,
  toggleFavorite,
  favoriteKeys,
}) {
  return (
    <section className="section catalog-page">
      <div className="catalog-toolbar">
        <div>
          <SectionTitle title="Wholesale Catalogue" align="left" />
          {/* <p>Browse live products from the Google Sheets catalogue.</p> */}
        </div>
      </div>
      <div className="filter-tabs">
        {categories.map((name) => (
          <button
            key={name}
            className={category === name ? 'active' : ''}
            onClick={() => setCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <StateMessage status={status} error={error} />
      <div className="catalog-grid">
        {products.map((product) => (
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
      {status === 'ready' && products.length === 0 && (
        <p className="empty-state">No products match this search.</p>
      )}
    </section>
  );
}
