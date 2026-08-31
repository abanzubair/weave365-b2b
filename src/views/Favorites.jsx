/**
 * Favorites View
 * Purpose: Displays the boutique owner's saved/favourited saree designs.
 * Restricts access to logged-in users and provides single-click "Add All to Order List" for quick bulk checkouts.
 */
import { SectionTitle } from '../components/SectionTitle.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import CatalogPageSkeleton from '../components/CatalogPageSkeleton.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';

export function Favorites({ products, user, status = 'ready', navigate, openAuth, toggleFavorite, addToCart, priceAccess }) {
  const breadcrumbItems = [
    { name: 'Home', url: '/', route: 'home' },
    { name: 'Favourites' }
  ];

  if (!user) {
    return (
      <section className="section empty-page">
        <Breadcrumb items={breadcrumbItems} navigate={navigate} />
        <h1>Login to see your favourite sarees</h1>
        <p>Your saved designs will stay linked to your account.</p>
        <button type="button" className="primary-button" onClick={() => navigate ? navigate('signup') : openAuth && openAuth()}>
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
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />
      <h1 className="sr-only">Your Saved Banarasi Sarees and Suits</h1>
      <div className="favorites-header">
        <SectionTitle title="Favourite Items" align="left" />
        {products.length > 0 && (
          <button type="button" className="secondary-button add-all-btn" onClick={addAllToCart}>
            Add All to Cart
          </button>
        )}
      </div>
      <div className="catalog-grid">
        {status === 'loading' ? (
          <CatalogPageSkeleton count={4} wrap={false} />
        ) : (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant={product.variants[0]}
              navigate={navigate}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              isFavorite
              priceAccess={priceAccess}
              openAuth={openAuth}
            />
          ))
        )}
      </div>
      {status === 'ready' && products.length === 0 && <p className="empty-state">No favourites saved yet.</p>}
    </section>
  );
}
