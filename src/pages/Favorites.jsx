import { SectionTitle, ProductCard } from '../storefrontShared.jsx';

export function Favorites({ products, user, navigate, openAuth, toggleFavorite, addToCart, priceAccess }) {
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

  const addAllToCart = () => {
    products.forEach((product) => {
      const variant = product.variants[0];
      if (variant) {
        addToCart(product, variant, 1);
      }
    });
  };

  return (
    <section className="section catalog-page">
      <div className="favorites-header">
        <SectionTitle title="Favourite Items" align="left" />
        {products.length > 0 && (
          <button className="secondary-button add-all-btn" onClick={addAllToCart}>
            Add All to Cart
          </button>
        )}
      </div>
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
            priceAccess={priceAccess}
          />
        ))}
      </div>
      {products.length === 0 && <p className="empty-state">No favourites saved yet.</p>}
    </section>
  );
}
