/**
 * @file BlogPost.jsx
 * @description The granular single blog article post view. Dynamically extracts article slugs,
 * updates browser titles and meta descriptions for on-page SEO targeting, and injects Google JSON-LD
 * rich metadata scripts (BlogPosting + FAQPage schemas). Translates simple markdown body structures into
 * beautiful, premium styled layouts with tables, blockquotes, related articles, and share options.
 * 
 * @module views/BlogPost
 * @param {Object} props
 * @param {string} props.postSlug - URL slug identifier matching a published blog post
 * @param {Function} props.navigate - Application route transition callback
 * @param {Array} props.blogs - Dynamic collection of blog posts loaded from both static data and Supabase CMS
 */

import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, Share2, MessageSquare, Heart, ArrowRight, Bookmark } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb.jsx';

export function BlogPost({ postSlug, navigate, blogs = [] }) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Scroll to top when post changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [postSlug]);

  const post = useMemo(() => {
    return blogs.find((p) => p.slug === postSlug) || null;
  }, [blogs, postSlug]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return blogs.filter((p) => p.slug !== post.slug).slice(0, 2);
  }, [blogs, post]);

  // Dynamic Browser Tab Title & Meta Description SEO injection
  useEffect(() => {
    if (!post || typeof window === 'undefined') return;

    // Update document title tag
    const originalTitle = document.title;
    document.title = post.metaTitle || `${post.title} | Weave 365`;

    // Update meta description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    const newDesc = post.metaDescription || post.intro || '';
    
    if (metaDesc) {
      metaDesc.setAttribute('content', newDesc);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = newDesc;
      document.head.appendChild(metaDesc);
    }

    // Clean up to avoid leaking custom metadata to other pages on routing
    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
    };
  }, [post]);

  // Google JSON-LD Structural Rich Schema (Article + FAQ Page + BreadcrumbList) injection
  useEffect(() => {
    if (!post || typeof window === 'undefined') return;

    const currentUrl = `${window.location.origin}/blog/${post.slug}`;

    // 1. Google Article Schema
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.metaDescription || post.intro,
      "image": post.image,
      "author": {
        "@type": "Person",
        "name": post.author || "Weave 365 Editorial Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Weave 365",
        "logo": {
          "@type": "ImageObject",
          "url": "https://res.cloudinary.com/weave365/image/upload/f_auto,q_auto/v1779137653/Weave_365_iemq2t.png"
        }
      },
      "datePublished": post.date || new Date().toISOString(),
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      }
    };

    const articleScript = document.createElement('script');
    articleScript.type = 'application/ld+json';
    articleScript.id = 'blog-article-ld-json';
    articleScript.text = JSON.stringify(articleSchema);
    document.head.appendChild(articleScript);

    // 2. Google FAQPage Rich Accordion Snippet Schema
    let faqScript = null;
    if (post.faqs && post.faqs.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": post.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      };

      faqScript = document.createElement('script');
      faqScript.type = 'application/ld+json';
      faqScript.id = 'blog-faq-ld-json';
      faqScript.text = JSON.stringify(faqSchema);
      document.head.appendChild(faqScript);
    }

    // 3. BreadcrumbList Schema
    const breadcrumbListItems = [
      { name: 'Home', url: '/' },
      { name: 'Insights & Blogs', url: '/blog' },
      ...(post.category ? [{ name: post.category, url: '/blog' }] : []),
      { name: post.title, url: `/blog/${post.slug}` }
    ];

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbListItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": `${window.location.origin}${item.url}`
      }))
    };

    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.id = 'blog-breadcrumb-ld-json';
    breadcrumbScript.text = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(breadcrumbScript);

    // Clean up injected rich scripts to prevent duplicates or crawler confusion
    return () => {
      const oldArticleScript = document.getElementById('blog-article-ld-json');
      if (oldArticleScript) oldArticleScript.remove();
      const oldFaqScript = document.getElementById('blog-faq-ld-json');
      if (oldFaqScript) oldFaqScript.remove();
      const oldBreadcrumbScript = document.getElementById('blog-breadcrumb-ld-json');
      if (oldBreadcrumbScript) oldBreadcrumbScript.remove();
    };
  }, [post]);

  const siteUrl = 'https://www.weave365.in';
  const postUrl = `${siteUrl}/blog/${postSlug}`;

  // Helper to parse markdown links and convert them to React routers
  const renderTextWithLinks = (text) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      const isInternal = url.startsWith('/');
      if (isInternal) {
        const targetRoute = url.substring(1);
        parts.push(
          <a
            key={match.index}
            href={url}
            onClick={(e) => {
              e.preventDefault();
              navigate(targetRoute);
            }}
            className="seo-inline-link"
          >
            {label}
          </a>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="seo-inline-link"
          >
            {label}
          </a>
        );
      }
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  // Custom parser to translate simple markdown body blocks into beautiful styled JSX elements
  const parseContentBlocks = (rawContent) => {
    if (!rawContent) return null;
    const blocks = rawContent.split('\n\n');

    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H2 Headers
      if (trimmed.startsWith('## ')) {
        const text = trimmed.substring(3).trim();
        return <h2 key={idx}>{renderTextWithLinks(text)}</h2>;
      }

      // H3 Headers
      if (trimmed.startsWith('### ')) {
        const text = trimmed.substring(4).trim();
        return <h3 key={idx}>{renderTextWithLinks(text)}</h3>;
      }

      // Horizontal Divider
      if (trimmed === '---') {
        return <hr key={idx} />;
      }

      // Bullet Lists
      if (trimmed.startsWith('- ')) {
        const lines = trimmed.split('\n');
        return (
          <ul key={idx}>
            {lines.map((line, lIdx) => {
              const itemText = line.substring(2).trim();
              return <li key={lIdx}>{renderTextWithLinks(itemText)}</li>;
            })}
          </ul>
        );
      }

      // Numbered Lists
      if (/^\d+\.\s/.test(trimmed)) {
        const lines = trimmed.split('\n');
        return (
          <ol key={idx}>
            {lines.map((line, lIdx) => {
              // Strip numbering e.g. "1. " or "10. "
              const itemText = line.replace(/^\d+\.\s/, '').trim();
              return <li key={lIdx}>{renderTextWithLinks(itemText)}</li>;
            })}
          </ol>
        );
      }

      // Table Parser
      if (trimmed.startsWith('|')) {
        const rows = trimmed.split('\n').filter(Boolean);
        const headers = rows[0]
          .split('|')
          .slice(1, -1)
          .map((h) => h.trim());
        
        // Skip rows[1] which contains table align specs like :--- | :---
        const dataRows = rows.slice(2);

        return (
          <div className="table-responsive-wrapper" key={idx} style={{ overflowX: 'auto', width: '100%' }}>
            <table>
              <thead>
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((r, rIdx) => {
                  const cells = r
                    .split('|')
                    .slice(1, -1)
                    .map((c) => c.trim());
                  return (
                    <tr key={rIdx}>
                      {cells.map((c, cIdx) => (
                        <td key={cIdx}>{renderTextWithLinks(c)}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.substring(2).trim();
        return <blockquote key={idx}>{renderTextWithLinks(quoteText)}</blockquote>;
      }

      // Standard Paragraph
      return <p key={idx}>{renderTextWithLinks(trimmed)}</p>;
    });
  };

  const handleShare = (platform) => {
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + postUrl)}`;
    } else if (platform === 'pinterest') {
      url = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(postUrl)}&media=${encodeURIComponent(post.image)}&description=${encodeURIComponent(post.title)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`;
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!post) {
    return (
      <div className="blog-list-container text-center" style={{ padding: '12rem 5% 8rem' }}>
        <h1 style={{ fontFamily: "var(--font-hero-heading)", color: "var(--blog-gold-dark)", fontSize: '3rem', marginBottom: '1.5rem' }}>Article Not Found</h1>
        <p className="blog-list-subtitle" style={{ marginBottom: '3rem' }}>The blog post you are looking for may have been moved or renamed.</p>
        <button className="blog-filter-btn active" onClick={() => navigate('blog')}>
          Return to Blog List
        </button>
      </div>
    );
  }

  const breadcrumbItems = useMemo(() => {
    if (!post) return [];
    return [
      { name: 'Home', url: '/', route: 'home' },
      { name: 'Insights & Blogs', url: '/blog', route: 'blog' },
      ...(post.category ? [{ name: post.category, url: '/blog', route: 'blog' }] : []),
      { name: post.title }
    ];
  }, [post]);

  return (
    <div className="blog-post-page">
      <Breadcrumb items={breadcrumbItems} navigate={navigate} />

      {/* Floating Back Anchor */}
      <button 
        className="floating-back-btn"
        onClick={() => navigate('blog')}
      >
        <ArrowLeft size={16} /> Back to Blog
      </button>

      {/* Hero Header Section */}
      <section className="blog-post-hero">
        <div className="blog-post-hero-overlay"></div>
        <img 
          src={post.image} 
          alt={post.title} 
          className="blog-post-hero-bg" 
        />
        
        <div className="blog-post-hero-content">
          <span className="post-category-tag">{post.category}</span>
          <h1>{post.title}</h1>
          
          <div className="post-meta-strip-white">
            <span className="post-meta-item">
              <User size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} /> {post.author}
            </span>
            <span className="meta-divider"></span>
            <span className="post-meta-item">
              <Calendar size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} /> {post.date}
            </span>
            <span className="meta-divider"></span>
            <span className="post-meta-item">
              <Clock size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} /> {post.readTime}
            </span>
          </div>
        </div>
      </section>

      {/* Main Split Layout */}
      <div className="blog-post-main-container">
        {/* Left Rich Text Column */}
        <article className="blog-post-body-panel">
          <p className="post-intro-paragraph">{post.intro}</p>
          <div className="article-rich-text">
            {parseContentBlocks(post.content)}
          </div>
        </article>

        {/* Right Sticky Sidebar Widget Column */}
        <aside className="blog-sidebar-panel">
          {/* Share Article Widget */}
          <div className="sidebar-widget">
            <h3>Share This Insight</h3>
            <div className="share-links-row">
              <button 
                className="share-btn-luxury"
                onClick={() => handleShare('whatsapp')}
                aria-label="Share on WhatsApp"
              >
                WhatsApp
              </button>
              <button 
                className="share-btn-luxury"
                onClick={() => handleShare('pinterest')}
                aria-label="Share on Pinterest"
              >
                Pinterest
              </button>
              <button 
                className="share-btn-luxury"
                onClick={() => handleShare('twitter')}
                aria-label="Share on Twitter"
              >
                Twitter / X
              </button>
            </div>
          </div>

          {/* B2B Sourcing Widget */}
          <div className="sidebar-widget sidebar-cta-widget">
            <h3>B2B Wholesale Portal</h3>
            <p>Source authentic Banarasi sarees and suits direct from Varanasi weavers with a flexible MOQ, certified purity, and international shipping.</p>
            <button 
              className="sidebar-luxury-btn"
              onClick={() => navigate('bulk-inquiry')}
            >
              Get Bulk Sourcing Quotes <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      </div>

      {/* Accordion FAQ Section */}
      {post.faqs && post.faqs.length > 0 && (
        <section className="post-faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-accordion-list">
            {post.faqs.map((faq, index) => (
              <div 
                key={index}
                className={`faq-accordion-item ${openFaqIndex === index ? 'active' : ''}`}
              >
                <button
                  className="faq-accordion-trigger"
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <span>{faq.q}</span>
                  <span className="faq-accordion-icon">+</span>
                </button>
                <div className="faq-accordion-content">
                  <div className="faq-accordion-content-inner">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="related-posts-section">
          <h2>Continue Reading Business Insights</h2>
          <div className="blog-grid">
            {relatedPosts.map((rPost) => (
              <article 
                key={rPost.slug} 
                className="blog-card"
                onClick={() => navigate('blog', rPost.slug)}
              >
                <div className="card-img-wrapper">
                  <img src={rPost.image} alt={rPost.title} loading="lazy" />
                  <span className="card-category-badge">{rPost.category}</span>
                </div>
                <div className="card-info-pane">
                  <div className="post-meta-strip">
                    <span>{rPost.date}</span>
                    <span className="meta-divider"></span>
                    <span>{rPost.readTime}</span>
                  </div>
                  <h3>{rPost.title}</h3>
                  <p>{rPost.intro}</p>
                  <button 
                    className="read-more-link"
                    style={{ marginTop: 'auto' }}
                  >
                    Read Guide <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
