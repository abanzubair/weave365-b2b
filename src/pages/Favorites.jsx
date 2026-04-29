import { SectionTitle, ProductCard } from '../storefrontShared.jsx';

export function Favorites({ products, user, navigate, openAuth, toggleFavorite, addToCart }) {
  if (!user) {
    return (
      <section className="section empty-page">
        <h1>Login to see your favourite sarees</h1>
        <p>Your saved designs will stay linked to your account.</p>
        <button className="primary-button" onClick={openAuth}>
          Login / Register
        </button>
      </section>
    );
  }

  return (
    <section className="section catalog-page">
      <SectionTitle title="Favourite Items" align="left" />
      <div className="catalog-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={product.variants[0]}
            navigate={navigate}
            addToCart={addToCart}
            toggleFavorite={toggleFavorite}
            isFavorite
          />
        ))}
      </div>
      {products.length === 0 && <p className="empty-state">No favourites saved yet.</p>}
    </section>
  );
}
