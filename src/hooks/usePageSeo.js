import { useEffect } from 'react';
import { siteUrl } from '../config.js';

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

    let metaDesc = document.querySelector('head meta[name="description"]');
    if (!metaDesc) {
      const anyDesc = document.querySelector('meta[name="description"]');
      if (anyDesc && document.head) {
        document.head.appendChild(anyDesc);
        metaDesc = anyDesc;
      }
    }
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

    if (description) {
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      } else if (document.head) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = description;
        document.head.appendChild(metaDesc);
      }
    }

    let canonicalLink = document.querySelector('head link[rel="canonical"]');
    if (!canonicalLink) {
      const anyCanonical = document.querySelector('link[rel="canonical"]');
      if (anyCanonical && document.head) {
        document.head.appendChild(anyCanonical);
        canonicalLink = anyCanonical;
      }
    }
    const originalCanonical = canonicalLink ? canonicalLink.getAttribute('href') : '';

    if (canonical) {
      const absoluteCanonical = canonical.startsWith('http')
        ? canonical
        : `${siteUrl}${canonical.startsWith('/') ? canonical : `/${canonical}`}`;

      if (canonicalLink) {
        canonicalLink.setAttribute('href', absoluteCanonical);
      } else if (document.head) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        canonicalLink.href = absoluteCanonical;
        document.head.appendChild(canonicalLink);
      }
    }

    return () => {
      if (title && originalTitle) {
        document.title = originalTitle;
      }
      if (originalDesc && metaDesc) {
        metaDesc.setAttribute('content', originalDesc);
      }
      if (originalCanonical && canonicalLink) {
        canonicalLink.setAttribute('href', originalCanonical);
      }
    };
  }, [title, description, canonical]);
}
