import { useEffect } from 'react';

/**
 * usePageSeo Hook
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {string} props.description - The page meta description
 * @param {string} props.canonical - The canonical URL for the page
 */
export function usePageSeo({ title, description, canonical }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalTitle = document.title;
    if (title) {
      document.title = title;
    }

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

    if (description) {
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = description;
        document.head.appendChild(metaDesc);
      }
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonicalLink ? canonicalLink.getAttribute('href') : '';

    if (canonical) {
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonical);
      } else {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        canonicalLink.href = canonical;
        document.head.appendChild(canonicalLink);
      }
    }

    return () => {
      if (title) document.title = originalTitle;
      
      if (description && metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
      
      if (canonical && canonicalLink) {
        if (originalCanonical) {
          canonicalLink.setAttribute('href', originalCanonical);
        } else {
          canonicalLink.remove();
        }
      }
    };
  }, [title, description, canonical]);
}
