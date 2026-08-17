/**
 * @file BlogList.jsx
 * @description The main B2B insights and articles page index for Weave365. Showcases a premium
 * editorial journal layout with filterable categories, a prominent featured hero article,
 * and a grid of secondary educational, reseller, and commercial B2B guides designed to build topical authority.
 * 
 * @module views/BlogList
 * @param {Object} props
 * @param {Function} props.navigate - Callback function to transition between application pages/routes
 * @param {Array} props.blogs - Dynamic collection of blog posts loaded from both static datasets and Supabase CMS
 */

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ArrowRight, Calendar, Clock, User, Filter, Search, X } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { AppLink } from '../components/AppLink.jsx';
import '../styles/blog.css';

const slugifyCategory = (cat) => {
  return cat.toLowerCase().trim().replace(/\s+/g, '-');
};

export function BlogList({ navigate, blogs = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const categories = useMemo(() => {
    const order = [
      'All',
      'Wholesale Guides',
      'Reseller Business',
      'Banarasi Insights',
      'Business Growth'
    ];
    const presentCategories = new Set();
    blogs.forEach((post) => {
      if (post.category) presentCategories.add(post.category);
    });

    const sorted = order.filter(cat => cat === 'All' || presentCategories.has(cat));
    
    // Append any other dynamic categories not explicitly in order
    presentCategories.forEach((cat) => {
      if (!sorted.includes(cat)) sorted.push(cat);
    });

    return sorted;
  }, [blogs]);

  const pathname = usePathname() || '';
  const pathSegments = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);

  const activeCategory = useMemo(() => {
    if (pathSegments[0] === 'blog' && pathSegments[1] === 'category' && pathSegments[2]) {
      const catSlug = decodeURIComponent(pathSegments[2]).toLowerCase();
      const matched = categories.find(c => slugifyCategory(c) === catSlug);
      if (matched) return matched;
    } else {
      const catParam = searchParams?.get('category');
      if (catParam) {
        const matched = categories.find(c => c.toLowerCase() === catParam.toLowerCase());
        if (matched) return matched;
      }
    }
    return 'All';
  }, [pathSegments, categories, searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  
  const searchParam = searchParams?.get('search') || '';
  const [prevSearchParam, setPrevSearchParam] = useState(searchParam);
  if (searchParam !== prevSearchParam) {
    setPrevSearchParam(searchParam);
    setSearchQuery(searchParam);
  }

  // JSON-LD Schema: Blog index or category CollectionPage + BreadcrumbList
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    const slugifyCategory = (cat) => cat.toLowerCase().trim().replace(/\s+/g, '-');
    const isCategory = activeCategory !== 'All';
    const catSlug = isCategory ? slugifyCategory(activeCategory) : '';
    const pageUrl = isCategory
      ? `${origin}/blog/category/${catSlug}`
      : `${origin}/blog`;

    // 1. Blog / CollectionPage schema
    const pageSchema = isCategory
      ? {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          '@id': pageUrl,
          name: `${activeCategory} – Wholesale Saree Business Guides | Weave 365`,
          description: `Expert B2B articles on ${activeCategory} for boutique owners, saree resellers and wholesale buyers sourcing Banarasi sarees from Varanasi.`,
          url: pageUrl,
          publisher: { '@type': 'Organization', name: 'Weave 365', url: origin },
          mainEntity: {
            '@type': 'ItemList',
            itemListElement: blogs
              .filter((p) => p.category === activeCategory)
              .slice(0, 10)
              .map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${origin}/blog/${p.slug}`,
                name: p.title,
              })),
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': `${origin}/blog`,
          name: "The Saree Wholesaler's Business & Fabric Blog | Weave 365",
          description:
            'Expert boutique scaling roadmaps, historical Varanasi loom guides, and technical fabric blueprints to empower your ethnic wear enterprise.',
          url: `${origin}/blog`,
          publisher: { '@type': 'Organization', name: 'Weave 365', url: origin },
          blogPost: blogs.slice(0, 10).map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${origin}/blog/${p.slug}`,
            datePublished: p.date,
            image: p.image,
            description: p.metaDescription || p.intro,
          })),
        };

    const inject = (id, schema) => {
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = id;
        document.head.appendChild(el);
      }
      el.text = JSON.stringify(schema);
    };

    inject('blog-list-page-ld-json', pageSchema);

    return () => {
      const el = document.getElementById('blog-list-page-ld-json');
      if (el) el.remove();
    };
  }, [activeCategory, blogs]);

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      router.push('/blog');
    } else {
      router.push(`/blog/category/${slugifyCategory(cat)}`);
    }
  };

  const filteredPosts = useMemo(() => {
    let result = blogs;
    if (activeCategory !== 'All') {
      result = result.filter((post) => post.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((post) => 
        (post.title && post.title.toLowerCase().includes(q)) ||
        (post.intro && post.intro.toLowerCase().includes(q)) ||
        (post.category && post.category.toLowerCase().includes(q))
      );
    }
    return result;
  }, [blogs, activeCategory, searchQuery]);

  const remainingPosts = useMemo(() => {
    return filteredPosts;
  }, [filteredPosts]);

  const breadcrumbItems = useMemo(() => {
    const base = [
      { name: 'Home', url: '/', route: 'home' },
      { name: 'Insights & Blogs', url: activeCategory !== 'All' ? '/blog' : undefined, route: activeCategory !== 'All' ? 'blog' : undefined }
    ];
    if (activeCategory !== 'All') {
      base.push({ name: activeCategory });
    }
    return base;
  }, [activeCategory]);

  return (
    <div className="blog-list-container">
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />
      <header className="blog-list-header">
        {/* <span className="blog-list-kicker">Weave 365 Insights</span> */}
        <h1>The Saree Wholesaler's Business & Fabric Blog</h1>
        <p className="blog-list-subtitle">
          Expert boutique scaling roadmaps, historical Varanasi loom guides, and technical fabric blueprints to empower your ethnic wear enterprise.
        </p>
      </header>

      {/* Main Split Layout */}
      <div className="blog-list-main-layout">
        
        {/* Left Side: Blog Grid */}
        <div className="blog-list-content-column">
          {remainingPosts.length > 0 ? (
            <section className="blog-grid" style={{ marginBottom: 0 }}>
              {remainingPosts.map((post) => (
                <AppLink 
                  key={post.slug} 
                  to="blog"
                  productId={post.slug}
                  className="blog-card animate-fade-in"
                  navigate={navigate}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
                >
                  <div className="card-img-wrapper">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      loading="lazy"
                    />
                    <span className="card-category-badge">{post.category}</span>
                  </div>

                  <div className="card-info-pane">
                    <div className="post-meta-strip">
                      <span className="post-meta-item">
                        <Calendar size={12} style={{ marginRight: '4px', display: 'inline' }} /> {post.date}
                      </span>
                      <span className="meta-divider"></span>
                      <span className="post-meta-item">
                        <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} /> {post.readTime}
                      </span>
                    </div>

                    <h3>{post.title}</h3>
                    <p>{post.intro}</p>

                    <span 
                      className="read-more-link"
                      style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Read Article <ArrowRight size={14} />
                    </span>
                  </div>
                </AppLink>
              ))}
            </section>
          ) : (
            <div className="blog-empty-state">
              <h3>No articles found</h3>
              {searchQuery ? (
                <>
                  <p>No results matched your search for "{searchQuery}". Try using different keywords or resetting the filters.</p>
                  <button type="button" 
                    className="blog-filter-btn active"
                    style={{ marginTop: '1.5rem' }}
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <p>We haven't published any articles in the "{activeCategory}" category yet. Check back soon!</p>
                  <button type="button" 
                    className="blog-filter-btn active"
                    onClick={() => handleCategoryChange('All')}
                  >
                    Show All Articles
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Sticky Filter Sidebar */}
        <aside className="blog-list-sidebar-column">
          <div className="blog-filters-sticky-wrapper">
            {/* Sleek Search Bar */}
            <div className="sidebar-search-container">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sidebar-search-input"
              />
              {searchQuery && (
                <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <span className="sidebar-filter-title">Categories</span>

            <div className="blog-filters">
              {categories.map((cat) => (
                <button type="button"
                  key={cat}
                  className={`blog-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat === 'All' ? 'All Blogs' : cat}
                </button>
              ))}
            </div>
            
            {/* Premium Sourcing CTA Widget */}
            <div className="sidebar-widget sidebar-cta-widget" style={{ marginTop: '2.5rem', padding: '2rem' }}>
              <h3 style={{ fontSize: 'var(--h5-size)', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                B2B Sourcing Portal
              </h3>
              <p style={{ fontSize: 'var(--body-size)', lineHeight: '1.5', opacity: 0.85, marginBottom: '1.5rem', fontWeight: 400 }}>
                Source authentic Banarasi sarees and suits direct from Varanasi weavers with low MOQs and reliable global shipping.
              </p>
              <AppLink 
                to="bulk-inquiry"
                className="sidebar-luxury-btn"
                style={{ padding: '0.8rem', fontSize: 'var(--button-size)', fontWeight: 'var(--button-weight)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                navigate={navigate}
              >
                Request Bulk Quotes
              </AppLink>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
