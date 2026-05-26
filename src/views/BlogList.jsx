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
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, Calendar, Clock, User, Filter } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb.jsx';

export function BlogList({ navigate, blogs = [] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const list = new Set();
    blogs.forEach((post) => {
      if (post.category) list.add(post.category);
    });
    return ['All', ...Array.from(list)];
  }, [blogs]);

  // Sync activeCategory with URL query parameter
  useEffect(() => {
    const catParam = searchParams?.get('category');
    if (catParam) {
      const matched = categories.find(c => c.toLowerCase() === catParam.toLowerCase());
      if (matched) {
        setActiveCategory(matched);
        return;
      }
    }
    setActiveCategory('All');
  }, [searchParams, categories]);

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      router.push('/blog');
    } else {
      router.push(`/blog?category=${encodeURIComponent(cat)}`);
    }
  };

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return blogs;
    return blogs.filter((post) => post.category === activeCategory);
  }, [blogs, activeCategory]);

  const remainingPosts = useMemo(() => {
    return filteredPosts;
  }, [filteredPosts]);

  const breadcrumbItems = [
    { name: 'Home', url: '/', route: 'home' },
    { name: 'Insights & Blogs' }
  ];

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
                <article 
                  key={post.slug} 
                  className="blog-card animate-fade-in"
                  onClick={() => navigate('blog', post.slug)}
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

                    <button 
                      className="read-more-link"
                      style={{ marginTop: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('blog', post.slug);
                      }}
                    >
                      Read Article <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <div className="blog-empty-state">
              <h3>No articles found</h3>
              <p>We haven't published any articles in the "{activeCategory}" category yet. Check back soon!</p>
              <button 
                className="blog-filter-btn active"
                onClick={() => handleCategoryChange('All')}
              >
                Show All Articles
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Sticky Filter Sidebar */}
        <aside className="blog-list-sidebar-column">
          <div className="blog-filters-sticky-wrapper">
            <div className="blog-filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`blog-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat === 'All' ? 'All Guides' : cat}
                </button>
              ))}
            </div>
            
            {/* Premium Sourcing CTA Widget */}
            <div className="sidebar-widget sidebar-cta-widget" style={{ marginTop: '2.5rem', padding: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                B2B Sourcing Portal
              </h3>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.5', opacity: 0.85, marginBottom: '1.5rem' }}>
                Source authentic Banarasi sarees and suits direct from Varanasi weavers with low MOQs and reliable global shipping.
              </p>
              <button 
                className="sidebar-luxury-btn"
                style={{ padding: '0.8rem', fontSize: '0.8rem' }}
                onClick={() => navigate('bulk-inquiry')}
              >
                Request Bulk Quotes
              </button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
