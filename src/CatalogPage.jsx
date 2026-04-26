import { Search } from 'lucide-react';
import { SectionTitle, StateMessage, ProductCard } from './App.jsx';

export function Catalog(props) {
  return (
    <section className="section catalog-page">
      <div className="catalog-toolbar">
        <div>
          <SectionTitle title="Wholesale Catalogue" align="left" />
          <p>Browse live products from the Google Sheets catalogue.</p>
        </div>
        <label className="search-box wide">
          <input
            value={props.search}
            onChange={(event) => props.setSearch(event.target.value)}
            placeholder="Search by fabric, work, occasion..."
          />
          <Search size={18} />
        </label>
      </div>
      <div className="filter-tabs">
        {props.categories.map((name) => (
          <button
            key={name}
            className={props.category === name ? 'active' : ''}
            onClick={() => props.setCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <StateMessage status={props.status} error={props.error} />
      <div className="catalog-grid">
        {props.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={product.variants[0]}
            navigate={props.navigate}
            addToCart={props.addToCart}
            toggleFavorite={props.toggleFavorite}
            isFavorite={props.favorites.some((item) => item.productGroupKey === product.id)}
          />
        ))}
      </div>
      {props.status === 'ready' && props.products.length === 0 && (
        <p className="empty-state">No products match this search.</p>
      )}
    </section>
  );
}
