import React from 'react';

/**
 * Premium Breadcrumb navigation component with integrated JSON-LD schema.
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of trail elements e.g. [{ name: 'Home', url: '/' }]
 * @param {Function} [props.navigate] - Optional router callback
 */
export default function Breadcrumb({ items, navigate }) {
  if (!items || items.length === 0) return null;

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.weave365.in';

  // Construct structured data schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url ? (item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`) : `${siteUrl}/`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <nav className="premium-breadcrumb" aria-label="Breadcrumb">
        <ol className="breadcrumb-list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            
            return (
              <li key={index} className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                {isLast ? (
                  <span className="breadcrumb-current" aria-current="page">{item.name}</span>
                ) : item.onClick ? (
                  <button onClick={item.onClick} className="breadcrumb-link-btn" type="button">
                    {item.name}
                  </button>
                ) : item.url ? (
                  <a
                    href={item.url}
                    onClick={(e) => {
                      if (navigate && !item.url.startsWith('http')) {
                        e.preventDefault();
                        if (item.route) {
                          navigate(item.route, item.routeVal, item.routeSlug);
                        } else {
                          // Fallback parsing for slash paths if matches routes
                          if (item.url === '/' || item.url === '/home') {
                            navigate('home');
                          } else if (item.url === '/catalog') {
                            navigate('catalog');
                          } else if (item.url === '/blog') {
                            navigate('blog');
                          } else {
                            window.location.href = item.url;
                          }
                        }
                      }
                    }}
                    className="breadcrumb-link"
                  >
                    {item.name}
                  </a>
                ) : (
                  <span className="breadcrumb-text">{item.name}</span>
                )}
                {!isLast && <span className="breadcrumb-separator">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
