import {
  Suspense,
  lazy,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  Heart,
  Headphones,
  Layers,
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
  X,
} from 'lucide-react';
import { fetchProducts, fetchHeroData } from './productData.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import { serviceablePincodes, storeConfig } from './config.js';
import brandLogo from '../assets/Weave365.svg';
import {
  buildWhatsappUrl,
  customerPrice,
  expandedProductCards,
  fallbackProductImage,
  formatMoney,
  Newsletter,
  normalizePincodeInput,
  PriceLine,
  ProductCard,
  SectionTitle,
  StateMessage,
} from './storefrontShared.jsx';

const homeCategoryNames = ['Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Accessories'];
const topBarItems = [
  { icon: Award, text: 'Wholesale Only' },
  { icon: PackageCheck, text: 'MOQ: 1 Set' },
  { icon: Truck, text: 'Global Delivery' },
  { icon: User, text: 'Login for Best Prices' },
];
const featureStripItems = [
  { icon: Award, title: 'Premium Quality', copy: 'Finest fabrics, crafted to perfection' },
  { icon: Tag, title: 'Best Wholesale Prices', copy: 'Competitive pricing for maximum profit' },
  { icon: Truck, title: 'Pan India Delivery', copy: 'Safe and fast delivery across India' },
  { icon: Headphones, title: 'Dedicated Support', copy: '24/7 support for all your business needs' },
];
const benefitStripItems = [
  { icon: PackageCheck, title: 'Easy Returns', copy: 'Hassle-free returns for eligible issues' },
  { icon: ShieldCheck, title: 'Secure Payments', copy: '100% secure payments and data safety' },
  { icon: Tag, title: 'Bulk Discounts', copy: 'Special offers on bulk and repeat orders' },
  { icon: Truck, title: 'Fast Dispatch', copy: 'Quick processing and on-time dispatch' },
];
const Catalog = lazy(() =>
  import('./CatalogPage.jsx').then((module) => ({ default: module.Catalog })),
);
const ProductDetailWrapper = lazy(() =>
  import('./ProductPage.jsx').then((module) => ({ default: module.ProductDetailWrapper })),
);

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
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [heroSlides, setHeroSlides] = useState([]);


  useEffect(() => {
    let isActive = true;

    fetchProducts()
      .then((items) => {
        if (!isActive) return;
        setProducts(items);
        setStatus('ready');
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err.message || 'Unable to load products.');
        setStatus('error');
      });

    fetchHeroData()
      .then((data) => {
        if (!isActive) return;
        if (data && data.length > 0) {
          setHeroSlides(data);
        }
      })
      .catch(console.error);

    return () => {

      isActive = false;
    };
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
    if (!dropdownOpen) return undefined;

    function handleClickOutside(event) {
      if (!event.target.closest('.nav-item-dropdown')) {
        setDropdownOpen(null);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

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

  const searchTerm = useDeferredValue(search.trim().toLowerCase());

  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      const text = [product.title, product.fabric, product.work, product.occasion, product.category]
        .join(' ')
        .toLowerCase();
      const matchesSearch = text.includes(searchTerm);
      const matchesCategory =
        category === 'All' || product.fabric === category || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, products, searchTerm]);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const favoriteKeySet = useMemo(
    () => new Set(favorites.map((item) => item.productGroupKey)),
    [favorites],
  );

  const cartProducts = useMemo(
    () =>
      cart
        .map((item) => {
          const product = productsById.get(item.productGroupKey);
          const variant = product?.variants.find((entry) => entry.code === item.variantCode);
          return product && variant ? { ...item, product, variant } : null;
        })
        .filter(Boolean),
    [cart, productsById],
  );

  const favoriteProducts = useMemo(
    () => products.filter((product) => favoriteKeySet.has(product.id)),
    [favoriteKeySet, products],
  );

  // We no longer need heroImage here as Home will manage it from slides

  const addToCart = useCallback((product, variant, quantity = 1) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setCart((currentCart) => {
      const next = upsertCart(currentCart, product, variant, quantity);
      void persistCart(next, user.id);
      return next;
    });
    setCartOpen(true);
  }, [user]);

  const toggleFavorite = useCallback((product) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setFavorites((currentFavorites) => {
      const exists = currentFavorites.some((item) => item.productGroupKey === product.id);
      const next = exists
        ? currentFavorites.filter((item) => item.productGroupKey !== product.id)
        : [
          ...currentFavorites,
          { productGroupKey: product.id, variantCode: product.variants[0]?.code || '' },
        ];
      void persistFavorites(next, user.id);
      return next;
    });
  }, [user]);

  const updateQuantity = useCallback((item, quantity) => {
    setCart((currentCart) => {
      const next = currentCart
        .map((entry) => (entry.variantCode === item.variantCode ? { ...entry, quantity } : entry))
        .filter((entry) => entry.quantity > 0);
      if (user) {
        void persistCart(next, user.id);
      }
      return next;
    });
  }, [user]);

  const checkPincode = useCallback(() => {
    const serviceable = serviceablePincodes.includes(pincode.trim());
    setCodStatus(serviceable ? 'available' : 'unavailable');
  }, [pincode]);

  const navigate = useCallback((nextRoute, productId = null) => {
    if (nextRoute === 'product') {
      routerNavigate(`/product/${productId}`);
    } else if (nextRoute === 'home') {
      routerNavigate('/');
    } else {
      routerNavigate(`/${nextRoute}`);
    }
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [routerNavigate]);

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
          <div className="nav-item-dropdown">
            <button
              className={dropdownOpen === 'categories' ? 'active' : ''}
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(dropdownOpen === 'categories' ? null : 'categories');
              }}
            >
              Categories <ChevronDown size={14} className={dropdownOpen === 'categories' ? 'rotate' : ''} />
            </button>
            {dropdownOpen === 'categories' && (
              <div className="dropdown-menu">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      navigate('catalog');
                      setDropdownOpen(null);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* <button onClick={() => navigate('catalog')}>
            Collections <ChevronDown size={14} />
          </button> */}
          <a href="#about">Ready to Ship</a>
          <a href="#why">Why Us</a>
          <a href="#contact">Contact Us</a>
        </nav>
        <div className="search-box-wrapper">
          <label className="search-box">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
            />
            <Search size={18} />
          </label>
          {search && route !== 'catalog' && (
            <div className="search-suggestions">
              {visibleProducts.length > 0 ? (
                <>
                  {visibleProducts.slice(0, 6).map((product) => {
                    const price = customerPrice(product.variants?.[0]?.prices || {});
                    const image = product.images?.[0] || fallbackProductImage;
                    return (
                      <button
                        key={product.id}
                        onClick={() => {
                          navigate('product', product.id);
                          setSearch('');
                        }}
                      >
                        <img src={image} alt="" />
                        <div>
                          <span>{product.name || product.title}</span>
                          {price > 0 && <small>{formatMoney(price)}</small>}
                        </div>
                      </button>
                    );
                  })}
                  <button className="view-all-results" onClick={() => navigate('catalog')}>
                    See all results for "{search}"
                  </button>
                </>
              ) : (
                <div className="no-results">No products found for "{search}"</div>
              )}
            </div>
          )}
        </div>
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
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={
              <Home
                products={products}
                status={status}
                error={error}
                heroSlides={heroSlides}
                fallbackHeroImage={fallbackProductImage}
                navigate={navigate}
                setCategory={setCategory}
                openAuth={() => setAuthOpen(true)}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}

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
                navigate={navigate}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
              />
            } />
            <Route path="/product/:id" element={
              <ProductDetailWrapper
                products={products}
                productsById={productsById}
                navigate={navigate}
                addToCart={addToCart}
                toggleFavorite={toggleFavorite}
                favoriteKeys={favoriteKeySet}
                pincode={pincode}
                setPincode={setPincode}
                codStatus={codStatus}
                checkPincode={checkPincode}
              />
            } />
            <Route path="/favorites" element={
              <Favorites
                products={favoriteProducts}
                user={user}
                navigate={navigate}
                openAuth={() => setAuthOpen(true)}
                toggleFavorite={toggleFavorite}
                addToCart={addToCart}
              />
            } />
          </Routes>
        </Suspense>
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



function RouteFallback() {
  return (
    <section className="section">
      <StateMessage status="loading" error="" />
    </section>
  );
}

function TopBar() {
  return (
    <div className="top-bar">
      <div className="top-bar-static">
        {topBarItems.map(({ icon: Icon, text }) => (
          <span key={text}><Icon size={14} /> {text}</span>
        ))}
      </div>
      <div className="top-bar-marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...topBarItems, ...topBarItems].map(({ icon: Icon, text }, index) => (
            <span key={`${text}-${index}`}><Icon size={14} /> {text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Home({
  products,
  status,
  error,
  heroSlides,
  fallbackHeroImage,
  navigate,
  setCategory,
  openAuth,
  addToCart,
  toggleFavorite,
  favoriteKeys,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerSlides = useMemo(() => heroSlides.filter(s => s.type === 'banner'), [heroSlides]);

  useEffect(() => {
    if (bannerSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [bannerSlides.length]);

  const fixedHeroData = bannerSlides[0] || null;

  const arrivals = useMemo(() => 
    products.slice(0, 8).map(p => ({
      product: p,
      image: p.images[0] || fallbackHeroImage,
      variant: p.variants[0]
    })), 
    [products, fallbackHeroImage]
  );

  const categoryImages = useMemo(() => {
    const map = {};
    heroSlides.forEach(slide => {
      if (slide.type !== 'banner') {
        map[slide.type] = slide.image;
      }
    });
    return map;
  }, [heroSlides]);

  const categoryPreviewImages = useMemo(() => {
    const productImages = expandedProductCards(products).map((item) => item.image).filter(Boolean);
    return productImages.length ? productImages : [fallbackHeroImage];
  }, [fallbackHeroImage, products]);

  return (
    <>
      <section className="hero">
        {/* Static Copy Overlay */}
        <div className="hero-copy-wrapper">
          <div className="hero-copy">
            <h1>
              {fixedHeroData?.title ? (
                fixedHeroData.title.split('.').map((part, i, arr) => (
                  <span key={i}>
                    {part}{i < arr.length - 1 ? '.' : ''}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))
              ) : (
                <>
                  <span>Premium</span> Sarees.
                  <br />
                  Wholesale <strong>Prices.</strong>
                </>
              )}
            </h1>
            <p>{fixedHeroData?.subtitle || 'Your trusted partner for quality sarees in bulk at the best prices.'}</p>

            <div className="hero-actions">
              <button className="primary-button" onClick={() => fixedHeroData?.buttonLink ? (fixedHeroData.buttonLink.startsWith('http') ? window.open(fixedHeroData.buttonLink, '_blank') : navigate(fixedHeroData.buttonLink)) : navigate('catalog')}>
                {fixedHeroData?.buttonText || 'Shop Collection'} <ArrowRight size={18} />
              </button>
              <button className="secondary-button" onClick={openAuth}>
                Register Now
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Background Track */}
        <div className="hero-slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {(bannerSlides.length > 0 ? bannerSlides : [{}]).map((slide, index) => (
            <div key={index} className="hero-slide">
              <div className="hero-visual" aria-label="Featured saree">
                <img src={slide.image || fallbackHeroImage} alt={slide.title || 'Premium saree collection'} fetchPriority={index === 0 ? "high" : "low"} decoding="async" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <FeatureStrip />

      <section className="section category-section">
        <SectionTitle title="Shop By Category" />
        <div className="category-grid">
          {homeCategoryNames.map((name, index) => (
            <button
              key={name}
              className="category-card"
              onClick={() => {
                setCategory(name);
                navigate('catalog');
              }}
            >
              <img
                src={categoryImages[name.toLowerCase()] || categoryPreviewImages[index % categoryPreviewImages.length]}
                alt={name}
                loading="lazy"
                decoding="async"
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
        <div className="product-row scrollable-row">
          {arrivals.map(({ product, image, variant }, index) => (
            <ProductCard
              key={`${product.id}-${index}`}
              product={{ ...product, images: [image, ...product.images] }}
              variant={variant}
              navigate={navigate}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
              isFavorite={favoriteKeys.has(product.id)}
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

function FeatureStrip() {
  return (
    <section className="feature-strip">
      {featureStripItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon />
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
  return (
    <section className="benefit-strip">
      {benefitStripItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon />
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
  const total = useMemo(
    () => items.reduce((sum, item) => sum + customerPrice(item.variant.prices) * item.quantity, 0),
    [items],
  );
  const whatsappUrl = useMemo(
    () => buildWhatsappUrl(items, total, pincode, codStatus),
    [codStatus, items, pincode, total],
  );

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
            <img
              src={item.variant.image || item.product.images[0] || fallbackProductImage}
              alt={item.product.title}
              loading="lazy"
              decoding="async"
            />
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
                onChange={(event) => setPincode(normalizePincodeInput(event.target.value))}
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
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, label: 'Home', action: () => navigate('home') },
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

function Stat({ icon, value, label }) {
  return (
    <div>
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
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
