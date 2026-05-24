/**
 * @file InternalLinkNetwork.jsx
 * @description A premium B2B Sourcing and Heritage Directory component rendered at the bottom
 * of the page. It maps the internal linking network to establish strong search engine crawlability and
 * topical authority, linking custom collections, product categories, educational guides, and B2B services.
 */

import React from 'react';
import { Compass, Grid, BookOpen, Briefcase } from 'lucide-react';

export function InternalLinkNetwork({ navigate, setCategory }) {
  const collections = [
    { label: 'Wholesale Banarasi Sarees', path: '/wholesale-banarasi-sarees', route: 'wholesale-banarasi-sarees' },
    { label: 'Pure Katan Silk Sarees', path: '/katan-silk-sarees', route: 'katan-silk-sarees' },
    { label: 'Organza Banarasi Sarees', path: '/organza-banarasi-sarees', route: 'organza-banarasi-sarees' },
    { label: 'Bridal Banarasi Sarees', path: '/bridal-banarasi-sarees', route: 'bridal-banarasi-sarees' },
    { label: 'Banarasi Meenakari Sarees', path: '/meenakari-sarees', route: 'meenakari-sarees' },
    { label: 'Soft Silk Banarasi Sarees', path: '/soft-silk-sarees', route: 'soft-silk-sarees' },
    { label: 'Wholesale Saree Supplier India', path: '/wholesale-saree-supplier-india', route: 'wholesale-saree-supplier-india' }
  ];

  const categories = [
    { label: 'Wholesale Saree Catalog', value: 'Saree' },
    { label: 'Wholesale Suit Catalog', value: 'Suit' },
    { label: 'Wholesale Silk Dupattas', value: 'Dupatta' },
    { label: 'Designer Banarasi Lehengas', value: 'Lehenga' },
    { label: 'Handloom Unstitched Fabrics', value: 'Fabric' },
    { label: 'Boutique Saree Accessories', value: 'Accessories' }
  ];

  const guides = [
    { label: 'Fabric Guide: Katan vs Organza', path: '/blog/difference-katan-silk-and-organza-saree', slug: 'difference-katan-silk-and-organza-saree' },
    { label: 'Saree Reselling Business Blueprint', path: '/blog/how-to-start-saree-reselling-business', slug: 'how-to-start-saree-reselling-business' },
    { label: 'Boutique Wholesale Sourcing Guide', path: '/blog/wholesale-saree-buying-guide-boutiques', slug: 'wholesale-saree-buying-guide-boutiques' }
  ];

  const services = [
    { label: 'Wholesale & Reseller Partner Program', path: '/wholesale-partner-program', route: 'wholesale-partner-program' },
    { label: 'Weaver Partnership Program', path: '/vendor-partnership', route: 'vendor-partnership' },
    { label: 'Bulk Sourcing & Custom Catalog', path: '/bulk-inquiry', route: 'bulk-inquiry' },
    { label: 'Varanasi Brand Story & Heritage', path: '/about', route: 'about' },
    { label: 'B2B Insights & Sourcing Blog', path: '/blog', route: 'blog' }
  ];

  const handleLinkClick = (e, targetRoute, param = null) => {
    e.preventDefault();
    if (targetRoute === 'category' && setCategory) {
      setCategory(param);
      navigate('catalogue');
    } else if (targetRoute === 'blog-guide') {
      navigate('blog', param);
    } else {
      navigate(targetRoute);
    }
  };

  return (
    <section className="internal-link-network" aria-label="B2B Directory">
      <div className="directory-container">
        <div className="directory-header">
          <span className="directory-kicker">WEAVE365 B2B DIRECTORY</span>
          <h2 className="directory-title">Sourcing & Craft Heritage Network</h2>
          <div className="directory-divider"></div>
        </div>

        <div className="directory-grid">
          {/* Column 1: Sourcing Collections */}
          <div className="directory-col">
            <div className="col-header">
              <Compass className="col-icon" size={18} />
              <h3>Premium Collections</h3>
            </div>
            <nav aria-label="Collections Directory">
              <ul>
                {collections.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.path}
                      onClick={(e) => handleLinkClick(e, item.route)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 2: Product Categories */}
          <div className="directory-col">
            <div className="col-header">
              <Grid className="col-icon" size={18} />
              <h3>Product Categories</h3>
            </div>
            <nav aria-label="Categories Directory">
              <ul>
                {categories.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={`/catalogue?category=${item.value}`}
                      onClick={(e) => handleLinkClick(e, 'category', item.value)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 3: Educational Guides */}
          <div className="directory-col">
            <div className="col-header">
              <BookOpen className="col-icon" size={18} />
              <h3>Educational Guides</h3>
            </div>
            <nav aria-label="Educational Guides Directory">
              <ul>
                {guides.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.path}
                      onClick={(e) => handleLinkClick(e, 'blog-guide', item.slug)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 4: B2B Services & Hubs */}
          <div className="directory-col">
            <div className="col-header">
              <Briefcase className="col-icon" size={18} />
              <h3>B2B Sourcing Hubs</h3>
            </div>
            <nav aria-label="Sourcing Hubs Directory">
              <ul>
                {services.map((item, idx) => (
                  <li key={idx}>
                    <a
                      href={item.path}
                      onClick={(e) => handleLinkClick(e, item.route)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
