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

import { useState, useMemo } from 'react';
import { ArrowRight, Calendar, Clock, User, Filter } from 'lucide-react';

export function BlogList({ navigate, blogs = [] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const list = new Set();
    blogs.forEach((post) => {
      if (post.category) list.add(post.category);
    });
    return ['All', ...Array.from(list)];
  }, [blogs]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return blogs;
    return blogs.filter((post) => post.category === activeCategory);
  }, [blogs, activeCategory]);

  // Featured post is the first one overall (or from the filtered list if we want to be dynamic)
  // Let's keep the absolute first post as the featured hero to preserve luxury layouts
  const featuredPost = useMemo(() => {
    return blogs[0] || null;
  }, [blogs]);

  const remainingPosts = useMemo(() => {
    // If filtering, display everything in the grid
    if (activeCategory !== 'All') return filteredPosts;
    // If 'All', slice out the featured post
    return filteredPosts.slice(1);
  }, [filteredPosts, activeCategory]);

  return (
    <div className="blog-list-container">
      <header className="blog-list-header">
        <span className="blog-list-kicker">Weave 365 Insights</span>
        <h1>The Saree Wholesaler's Business & Fabric Journal</h1>
        <p className="blog-list-subtitle">
          Expert boutique scaling roadmaps, historical Varanasi loom guides, and technical fabric blueprints to empower your ethnic wear enterprise.
        </p>
      </header>

      {/* Elegant Filter Navigation */}
      <div className="blog-filters">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`blog-filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'All' ? 'All Guides' : cat}
          </button>
        ))}
      </div>

      {/* Featured Luxury Banner Post (only shown when 'All' is selected to maintain perfect editorial hierarchy) */}
      {activeCategory === 'All' && featuredPost && (
        <article 
          className="featured-post-card animate-fade-in"
          onClick={() => navigate('blog', featuredPost.slug)}
        >
          <div className="featured-img-wrapper">
            <img 
              src={featuredPost.image} 
              alt={featuredPost.title} 
              loading="lazy"
            />
            <span className="featured-badge">Featured Guide</span>
          </div>

          <div className="featured-info-pane">
            <div className="post-meta-strip">
              <span className="card-category-tag">{featuredPost.category}</span>
              <span className="meta-divider"></span>
              <span className="post-meta-item">
                <Calendar size={12} style={{ marginRight: '4px', display: 'inline' }} /> {featuredPost.date}
              </span>
              <span className="meta-divider"></span>
              <span className="post-meta-item">
                <Clock size={12} style={{ marginRight: '4px', display: 'inline' }} /> {featuredPost.readTime}
              </span>
            </div>

            <h2>{featuredPost.title}</h2>
            <p>{featuredPost.intro}</p>

            <button 
              className="read-more-link"
              onClick={(e) => {
                e.stopPropagation();
                navigate('blog', featuredPost.slug);
              }}
            >
              Start Reading <ArrowRight size={16} />
            </button>
          </div>
        </article>
      )}

      {/* Grid of Other Articles */}
      {remainingPosts.length > 0 ? (
        <section className="blog-grid">
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
            onClick={() => setActiveCategory('All')}
          >
            Show All Articles
          </button>
        </div>
      )}
    </div>
  );
}
