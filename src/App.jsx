import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { ProductDetailWrapper } from './ProductPage.jsx';
import { Catalog } from './CatalogPage.jsx';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  Heart,
  Headphones,
  Layers,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  User,
  ZoomIn,
  X,
} from 'lucide-react';
import { fetchProducts } from './productData.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { serviceablePincodes, storeConfig } from './config.js';
import heroBanner from '../assets/hero.png';
import brandLogo from '../assets/Weave365.svg';

const fallbackHero = heroBanner;

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const routerNavigate = useNavigate();
  const location = useLocation();
  const route = location.pathname === '/' ? 'home' : location.pathname.split('/')[1];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [pincode, setPincode] = useState('');
  const [codStatus, setCodStatus] = useState(null);

  useEffect(() => {
    fetchProducts()
      .then((items) => {
        setProducts(items);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.message || 'Unable to load products.');
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const localUser = localStorage.getItem('sareeva_user');
      if (localUser) setUser(JSON.parse(localUser));
      return;
    }

    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCart([]);
      setFavorites([]);
      return;
    }

    if (isSupabaseConfigured) {
      loadSavedState(user.id).then(({ savedCart, savedFavorites }) => {
        setCart(savedCart);
        setFavorites(savedFavorites);
      });
      return;
    }

    setCart(readLocal(`cart_${user.id}`));
    setFavorites(readLocal(`favorites_${user.id}`));
  }, [user]);

  const categories = useMemo(() => {
    const names = products.map((product) => product.fabric || product.category).filter(Boolean);
    return ['All', ...Array.from(new Set(names))];
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const text = [product.title, product.fabric, product.work, product.occasion, product.category]
        .join(' ')
        .toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory =
        category === 'All' || product.fabric === category || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, search]);



  const cartProducts = cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productGroupKey);
      const variant = product?.variants.find((entry) => entry.code === item.variantCode);
      return product && variant ? { ...item, product, variant } : null;
    })
    .filter(Boolean);

  const heroImage = heroBanner;

  async function addToCart(product, variant, quantity = 1) {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    const next = upsertCart(cart, product, variant, quantity);
    setCart(next);
    await persistCart(next, user.id);
    setCartOpen(true);
  }

  async function toggleFavorite(product) {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    const exists = favorites.some((item) => item.productGroupKey === product.id);
    const next = exists
      ? favorites.filter((item) => item.productGroupKey !== product.id)
      : [...favorites, { productGroupKey: product.id, variantCode: product.variants[0]?.code || '' }];
    setFavorites(next);
    await persistFavorites(next, user.id);
  }

  async function updateQuantity(item, quantity) {
    const next = cart
      .map((entry) => (entry.variantCode === item.variantCode ? { ...entry, quantity } : entry))
      .filter((entry) => entry.quantity > 0);
    setCart(next);
    if (user) await persistCart(next, user.id);
  }

  function checkPincode() {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }

  function navigate(nextRoute, productId = null) {
    if (nextRoute === 'product') {
      routerNavigate(`/product/${productId}`);
    } else if (nextRoute === 'home') {
      routerNavigate('/');
    } else {
      routerNavigate(`/${nextRoute}`);
    }
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <TopBar />
      <header className="site-header">
        <button className="icon-button menu-button" type="button" onClick={() => setMenuOpen(true)}>
          <Menu size={22} />
        </button>
        <button className="brand" type="button" onClick={() => navigate('home')}>
          <img src={brandLogo} alt={storeConfig.name} className="brand-logo" />
        </button>
        <nav className="main-nav">
          <button className={route === 'home' ? 'active' : ''} onClick={() => navigate('home')}>
            Home
          </button>
          <button onClick={() => navigate('catalog')}>
            Categories <ChevronDown size={14} />
          </button>
          <button onClick={() => navigate('catalog')}>
            Collections <ChevronDown size={14} />
          </button>
          {/* <a href="#about">About Us</a> */}
          <a href="#why">Why Us</a>
          <a href="#contact">Contact Us</a>
        </nav>
        <label className="search-box">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => navigate('catalog')}
            placeholder="Search products..."
          />
          <Search size={18} />
        </label>
        <div className="header-actions">
          <button className="login-link" type="button" onClick={() => setAuthOpen(true)}>
            <User size={18} />
            {user ? user.email || 'Account' : 'Login / Register'}
          </button>
          <button className="icon-button" type="button" onClick={() => navigate('favorites')}>
            <Heart size={22} />
            {favorites.length > 0 && <span className="badge">{favorites.length}</span>}
          </button>
          <button className="icon-button" type="button" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={22} />
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </button>
        </div>
      </header>

      {menuOpen && (
        <MobileMenu
          onClose={() => setMenuOpen(false)}
          navigate={navigate}
          user={user}
          openAuth={() => setAuthOpen(true)}
        />
      )}

      <main>
        <Routes>
          <Route path="/" element={
            <Home
              products={products}
              status={status}
              error={error}
              heroImage={heroImage}
              navigate={navigate}
              openAuth={() => setAuthOpen(true)}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
            />
          } />
          <Route path="/catalog" element={
            <Catalog
              products={visibleProducts}
              status={status}
              error={error}
              categories={categories}
              category={category}
              setCategory={setCategory}
              search={search}
              setSearch={setSearch}
              navigate={navigate}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
            />
          } />
          <Route path="/product/:id" element={
            <ProductDetailWrapper
              products={products}
              navigate={navigate}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              favorites={favorites}
              pincode={pincode}
              setPincode={setPincode}
              codStatus={codStatus}
              checkPincode={checkPincode}
            />
          } />
          <Route path="/favorites" element={
            <Favorites
              products={products.filter((product) =>
                favorites.some((item) => item.productGroupKey === product.id),
              )}
              user={user}
              navigate={navigate}
              openAuth={() => setAuthOpen(true)}
              toggleFavorite={toggleFavorite}
              addToCart={addToCart}
            />
          } />
        </Routes>
      </main>

      <Footer />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartProducts}
        updateQuantity={updateQuantity}
        pincode={pincode}
        setPincode={setPincode}
        codStatus={codStatus}
        checkPincode={checkPincode}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        user={user}
        setUser={setUser}
      />
    </>
  );
}



function TopBar() {
  const items = [
    [<Award size={14} key="a" />, 'Wholesale Only'],
    [<Truck size={14} key="t" />, `Min. Order ₹${storeConfig.minimumOrderValue.toLocaleString('en-IN')}`],
    [<PackageCheck size={14} key="p" />, 'Pan India Delivery'],
    [<User size={14} key="u" />, 'Login for Best Prices'],
  ];

  return (
    <div className="top-bar">
      {/* Desktop: static grid */}
      <div className="top-bar-static">
        {items.map(([icon, text], i) => (
          <span key={i}>{icon} {text}</span>
        ))}
      </div>
      {/* Mobile: scrolling marquee */}
      <div className="top-bar-marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...items, ...items].map(([icon, text], i) => (
            <span key={i}>{icon} {text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Home({ products, status, error, heroImage, navigate, openAuth, addToCart, toggleFavorite, favorites }) {
  const arrivals = expandedProductCards(products).slice(0, 5);
  const categories = [
    'Silk Sarees',
    'Fancy Sarees',
    'Cotton Sarees',
    'Printed Sarees',
    'Designer Sarees',
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            <span>Premium</span> Sarees.
            <br />
            Wholesale <strong>Prices.</strong>
          </h1>
          <p>Your trusted partner for quality sarees in bulk at the best prices.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate('catalog')}>
              Shop Collection <ArrowRight size={18} />
            </button>
            <button className="secondary-button" onClick={openAuth}>
              Register Now
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-label="Featured saree">
          <img src={heroImage} alt="Premium saree collection" />
        </div>
      </section>

      <FeatureStrip />

      <section className="section category-section">
        <SectionTitle title="Shop By Category" />
        <div className="category-grid">
          {categories.map((name, index) => (
            <button key={name} className="category-card" onClick={() => navigate('catalog')}>
              <img
                src={products[0]?.images[index % Math.max(products[0]?.images.length || 1, 1)] || heroImage}
                alt={name}
              />
              <span>{name}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
        <button className="center-button" onClick={() => navigate('catalog')}>
          View All Categories
        </button>
      </section>

      <section id="why" className="why-band">
        <div>
          <SectionTitle title="Why Choose Us?" align="left" />
          <p>We understand your business and provide the best quality sarees with unbeatable wholesale prices to help you grow more.</p>
          <button className="primary-button compact" onClick={() => navigate('catalog')}>
            Know More
          </button>
        </div>
        <div className="stats-panel">
          <Stat icon={<User />} value="1000+" label="Unique Designs" />
          <Stat icon={<Heart />} value="500+" label="Happy Customers" />
          <Stat icon={<Award />} value="10+" label="Years of Trust" />
          <Stat icon={<CheckCircle2 />} value="100%" label="Quality Assured" />
        </div>
      </section>

      <section className="section">
        <div className="section-heading-row">
          <SectionTitle title="New Arrivals" align="left" />
          <button className="text-button" onClick={() => navigate('catalog')}>
            View All <ArrowRight size={17} />
          </button>
        </div>
        <StateMessage status={status} error={error} />
        <div className="product-row">
          {arrivals.map(({ product, image, variant }, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={{ ...product, images: [image, ...product.images] }}
              variant={variant}
              navigate={navigate}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              isFavorite={favorites.some((item) => item.productGroupKey === product.id)}
            />
          ))}
        </div>
      </section>

      <BenefitStrip />

      <section className="reseller-band">
        <div>
          <h2>Built for Business. Made for Resellers.</h2>
          <p>Join thousands of retailers who trust {storeConfig.name} wholesale for premium quality sarees.</p>
          <button className="gold-button" onClick={openAuth}>
            Register Now <ArrowRight size={17} />
          </button>
        </div>
        <ul>
          <li>
            <ShieldCheck /> <span><strong>Exclusive Wholesale Prices</strong>Best rates guaranteed for our registered buyers.</span>
          </li>
          <li>
            <PackageCheck /> <span><strong>Wide Range of Collections</strong>Sarees for every occasion and customer demand.</span>
          </li>
          <li>
            <Award /> <span><strong>Reliable Partnership</strong>We grow when you grow. That's our promise.</span>
          </li>
        </ul>
      </section>

      <Newsletter />
    </>
  );
}


function Favorites({ products, user, navigate, openAuth, toggleFavorite, addToCart }) {
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

export function ProductCard({ product, variant, navigate, addToCart, toggleFavorite, isFavorite }) {
  const selectedVariant = variant || product.variants[0];
  return (
    <article className="product-card">
      <button className="fav-button" onClick={() => toggleFavorite(product)} aria-label="Save favourite">
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button className="image-button" onClick={() => navigate('product', product.id)}>
        <span className="new-badge">New</span>
        <img src={product.images[0] || fallbackHero} alt={product.title} />
      </button>
      <div className="product-card-copy">
        <button onClick={() => navigate('product', product.id)}>{product.title}</button>
        <PriceLine prices={selectedVariant.prices} />
        <div className="card-actions">
          <span>{selectedVariant.code}</span>
          <button onClick={() => addToCart(product, selectedVariant, 1)}>
            <ShoppingBag size={16} /> Add
          </button>
        </div>
      </div>
    </article>
  );
}

function PriceLine({ prices }) {
  return (
    <p className="price-line">
      {prices.offer ? (
        <>
          <strong>{formatMoney(prices.offer)}</strong>
          {prices.mrp && <span>MRP {formatMoney(prices.mrp)}</span>}
        </>
      ) : (
        <>
          {prices.mrp && <strong>MRP {formatMoney(prices.mrp)}</strong>}
          {prices.single && <span>Single {formatMoney(prices.single)}</span>}
        </>
      )}
    </p>
  );
}

function FeatureStrip() {
  const items = [
    [<Award />, 'Premium Quality', 'Finest fabrics, crafted to perfection'],
    [<Tag />, 'Best Wholesale Prices', 'Competitive pricing for maximum profit'],
    [<Truck />, 'Pan India Delivery', 'Safe and fast delivery across India'],
    [<Headphones />, 'Dedicated Support', '24/7 support for all your business needs'],
  ];

  return (
    <section className="feature-strip">
      {items.map(([icon, title, copy]) => (
        <div key={title}>
          {icon}
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

function BenefitStrip() {
  const items = [
    [<PackageCheck />, 'Easy Returns', 'Hassle-free returns for eligible issues'],
    [<ShieldCheck />, 'Secure Payments', '100% secure payments and data safety'],
    [<Tag />, 'Bulk Discounts', 'Special offers on bulk and repeat orders'],
    [<Truck />, 'Fast Dispatch', 'Quick processing and on-time dispatch'],
  ];

  return (
    <section className="benefit-strip">
      {items.map(([icon, title, copy]) => (
        <div key={title}>
          {icon}
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

export function ProductTrustStrip() {
  const items = [
    [<Truck />, 'Pan India Delivery', 'Fast and secure delivery across India'],
    [<Tag />, 'Best Wholesale Prices', 'Get the best prices on bulk orders'],
    [<PackageCheck />, 'Easy Returns', 'Hassle-free returns for eligible issues'],
    [<Headphones />, 'Dedicated Support', "We're here to help you at every step"],
  ];

  return (
    <section className="product-trust-strip">
      {items.map(([icon, title, copy]) => (
        <div key={title}>
          {icon}
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

function CartDrawer({
  open,
  onClose,
  items,
  updateQuantity,
  pincode,
  setPincode,
  codStatus,
  checkPincode,
}) {
  const total = items.reduce((sum, item) => sum + customerPrice(item.variant.prices) * item.quantity, 0);
  const whatsappUrl = buildWhatsappUrl(items, total, pincode, codStatus);

  return (
    <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-head">
        <h2>Your Cart</h2>
        <button className="icon-button" onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="drawer-body">
        {items.length === 0 && <p className="empty-state">Your cart is empty.</p>}
        {items.map((item) => (
          <div className="cart-item" key={item.variantCode}>
            <img src={item.variant.image || item.product.images[0] || fallbackHero} alt={item.product.title} />
            <div>
              <strong>{item.product.title}</strong>
              <span>{item.variant.code}</span>
              <PriceLine prices={item.variant.prices} />
              <div className="qty-row">
                <button onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="drawer-foot">
        <div className="pincode-box small">
          <label>
            Check COD pincode
            <span>
              <input
                value={pincode}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Pincode"
              />
              <button onClick={checkPincode}>Check</button>
            </span>
          </label>
          {codStatus === 'available' && <p className="success">COD price can be discussed for this pincode.</p>}
          {codStatus === 'unavailable' && <p className="warning">COD unavailable for this pincode.</p>}
        </div>
        <div className="total-row">
          <span>Estimated Total</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <a className={`primary-button ${items.length ? '' : 'disabled'}`} href={items.length ? whatsappUrl : undefined} target="_blank" rel="noreferrer">
          Send WhatsApp Enquiry <ArrowRight size={18} />
        </a>
      </div>
    </aside>
  );
}

function AuthModal({ open, onClose, user, setUser }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    if (!isSupabaseConfigured) {
      const demoUser = { id: email || 'demo-user', email: email || 'demo@sareeva.local' };
      localStorage.setItem('sareeva_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setMessage('Demo login active. Add Supabase keys in .env for real accounts.');
      return;
    }

    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      setMessage(mode === 'login' ? 'Logged in successfully.' : 'Check your email to confirm registration.');
      if (result.data.user) setUser(result.data.user);
    }
  }

  async function logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sareeva_user');
    setUser(null);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <section className="auth-modal">
        <button className="icon-button modal-close" onClick={onClose}>
          <X />
        </button>
        {user ? (
          <>
            <h2>Your Account</h2>
            <p>{user.email || 'Demo account'}</p>
            {!isSupabaseConfigured && <p className="warning">Demo mode: configure Supabase env keys for real login.</p>}
            <button className="secondary-button icon-label" onClick={logout}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            <h2>{mode === 'login' ? 'Login' : 'Register'} for saved cart</h2>
            <form onSubmit={submit}>
              <label>
                Email
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength="6"
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                {mode === 'login' ? 'Login' : 'Create Account'}
              </button>
            </form>
            <button className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Create a new account' : 'Already registered? Login'}
            </button>
            {message && <p className="form-message">{message}</p>}
          </>
        )}
      </section>
    </div>
  );
}

function Footer() {
  return (
    <footer id="contact" className="footer">
      <div>
        <button className="brand footer-brand">
          <img src={brandLogo} alt={storeConfig.name} className="brand-logo footer-logo" />
        </button>
        <p>Your trusted wholesale partner for premium quality sarees at unbeatable wholesale prices.</p>
      </div>
      <div>
        <h3>Quick Links</h3>
        <a>Home</a>
        <a>Categories</a>
        <a>Collections</a>
        <a>Contact Us</a>
      </div>
      <div>
        <h3>Customer Service</h3>
        <a>Shipping Policy</a>
        <a>Return & Refund</a>
        <a>Terms & Conditions</a>
        <a>FAQ</a>
      </div>
      <div>
        <h3>Get In Touch</h3>
        <p>{storeConfig.phone}</p>
        <p>{storeConfig.email}</p>
        <p>Mon - Sat (10AM - 6PM)</p>
      </div>
    </footer>
  );
}

function MobileMenu({ onClose, navigate, user, openAuth }) {
  const navItems = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: 'Home', action: () => navigate('home') },
    { icon: <Layers size={20} />, label: 'Categories', action: () => navigate('catalog') },
    { icon: <ShoppingBag size={20} />, label: 'Collections', action: () => navigate('catalog') },
    { icon: <Heart size={20} />, label: 'Favourites', action: () => navigate('favorites') },
  ];

  return (
    <>
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <aside className="mobile-menu">
        <div className="mobile-menu-head">
          <img src={brandLogo} alt={storeConfig.name} className="brand-logo" style={{ height: 36 }} />
          <button className="icon-button" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>
        <nav className="mobile-menu-nav">
          {navItems.map(({ icon, label, action }) => (
            <button key={label} onClick={action} className="mobile-menu-item">
              <span className="mobile-menu-icon">{icon}</span>
              {label}
              <ArrowRight size={16} className="mobile-menu-arrow" />
            </button>
          ))}
        </nav>
        <div className="mobile-menu-divider" />
        <button className="mobile-menu-item mobile-menu-account" onClick={openAuth}>
          <span className="mobile-menu-icon"><User size={20} /></span>
          {user ? user.email || 'Account' : 'Login / Register'}
          <ArrowRight size={16} className="mobile-menu-arrow" />
        </button>
        <div className="mobile-menu-footer">
          <span><Headphones size={16} /> {storeConfig.phone}</span>
          <span><MessageCircle size={16} /> {storeConfig.email}</span>
        </div>
      </aside>
    </>
  );
}

export function SectionTitle({ title, align = 'center' }) {
  return (
    <div className={`section-title ${align}`}>
      <h2>{title}</h2>
      <span />
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div>
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function Newsletter() {
  return (
    <section className="newsletter">
      <div>
        <PackageCheck />
        <span>
          <strong>Stay Updated</strong>
          Sign up for our newsletter and get updates on new arrivals, exclusive offers and more.
        </span>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <input type="email" placeholder="Enter your email" />
        <button>Subscribe</button>
      </form>
    </section>
  );
}

export function StateMessage({ status, error }) {
  if (status === 'loading') return <p className="empty-state">Loading live catalogue...</p>;
  if (status === 'error') return <p className="error-state">{error}</p>;
  return null;
}

export function expandedProductCards(products) {
  if (!products.length) return [];
  return products.flatMap((product) => {
    const images = product.images.length ? product.images : [fallbackHero];
    return images.map((image, index) => ({
      product,
      image,
      variant: product.variants[index] || product.variants[0],
    }));
  });
}

export function formatMoney(value) {
  if (!value) return 'On request';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function customerPrice(prices) {
  return prices.offer || prices.single || prices.mrp || 0;
}

function buildWhatsappUrl(items, total, pincode, codStatus) {
  const lines = [
    `Hello ${storeConfig.name}, I want to enquire about these sarees:`,
    '',
    ...items.map((item) => {
      const price = customerPrice(item.variant.prices);
      return `${item.product.title} | Code: ${item.variant.code} | Qty: ${item.quantity} | Price: ${formatMoney(price)}`;
    }),
    '',
    `Estimated total: ${formatMoney(total)}`,
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildSingleProductWhatsappUrl(product, variant, quantity, pincode, codStatus) {
  const price = customerPrice(variant.prices);
  const lines = [
    `Hello ${storeConfig.name}, I want to buy this catalog:`,
    '',
    `${product.title}`,
    `Code: ${variant.code}`,
    `Designs: ${quantity}`,
    `Price: ${formatMoney(price)} / piece`,
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function upsertCart(cart, product, variant, quantity) {
  const existing = cart.find((item) => item.variantCode === variant.code);
  if (existing) {
    return cart.map((item) =>
      item.variantCode === variant.code ? { ...item, quantity: item.quantity + quantity } : item,
    );
  }
  return [
    ...cart,
    {
      productGroupKey: product.id,
      variantCode: variant.code,
      quantity,
    },
  ];
}

async function loadSavedState(userId) {
  const [cartResult, favoriteResult] = await Promise.all([
    supabase.from('cart_items').select('product_group_key, variant_code, quantity').eq('user_id', userId),
    supabase.from('favorites').select('product_group_key, variant_code').eq('user_id', userId),
  ]);

  return {
    savedCart: (cartResult.data || []).map((item) => ({
      productGroupKey: item.product_group_key,
      variantCode: item.variant_code,
      quantity: item.quantity,
    })),
    savedFavorites: (favoriteResult.data || []).map((item) => ({
      productGroupKey: item.product_group_key,
      variantCode: item.variant_code,
    })),
  };
}

async function persistCart(cart, userId) {
  if (!isSupabaseConfigured) {
    localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
    return;
  }

  await supabase.from('cart_items').delete().eq('user_id', userId);
  if (!cart.length) return;
  await supabase.from('cart_items').insert(
    cart.map((item) => ({
      user_id: userId,
      product_group_key: item.productGroupKey,
      variant_code: item.variantCode,
      quantity: item.quantity,
    })),
  );
}

async function persistFavorites(favorites, userId) {
  if (!isSupabaseConfigured) {
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
    return;
  }

  await supabase.from('favorites').delete().eq('user_id', userId);
  if (!favorites.length) return;
  await supabase.from('favorites').insert(
    favorites.map((item) => ({
      user_id: userId,
      product_group_key: item.productGroupKey,
      variant_code: item.variantCode,
    })),
  );
}

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}
