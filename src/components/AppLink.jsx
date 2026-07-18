import React from 'react';
import { useRouter } from 'next/navigation';
import { getProductCategorySlug } from '../config.js';

/**
 * AppLink Component
 * Purpose: Replaces navigational <button> or <div> elements with semantic <a> tags.
 * Provides:
 * 1. Natively crawlable href for search engines (Googlebot) to index our internal links (SEO).
 * 2. Native right-click context menu ("Open link in new tab", "Copy link address").
 * 3. Native modifier click support (Ctrl+Click, Cmd+Click, Shift+Click, middle-click).
 * 4. Intercepts normal left-clicks to use the smooth SPA navigate transition.
 */
export function AppLink({
  to,
  productId = null,
  shopName = null,
  href: customHref,
  navigate,
  children,
  className,
  navOptions = {},
  ...props
}) {
  const router = useRouter();

  // 1. Resolve semantic URL path (used by Googlebot and browser multi-tab features)
  const resolvedHref = React.useMemo(() => {
    if (customHref) return customHref;
    if (!to) return '#';

    let url = `/${to}`;
    if (to === 'home') {
      url = '/';
    } else if (to === 'product' && productId) {
      url = `/${getProductCategorySlug(productId)}/${encodeURIComponent(productId)}`;
    } else if (to === 'partner' && productId) {
      // Slugify partner name
      const slug = String(productId).toLowerCase().trim().replace(/\s+/g, '-');
      url = `/partner/${encodeURIComponent(slug)}`;
    } else if (to === 'blog' && productId) {
      url = `/blog/${encodeURIComponent(productId)}`;
    } else if (to === 'wholesale-catalogue' || to === 'catalogue') {
      url = '/catalogue';
    }

    return url;
  }, [to, productId, customHref]);

  // 2. Handle Left Click Interception
  const handleClick = (e) => {
    // Invoke optional custom onClick handler first
    if (props.onClick) {
      props.onClick(e);
    }

    // Let the browser handle standard browser shortcuts:
    // - Default prevented by previous handlers
    // - Command, Control, Shift keys held down
    // - Middle mouse button click (button 1)
    if (
      e.defaultPrevented ||
      e.ctrlKey ||
      e.metaKey ||
      e.shiftKey ||
      e.button !== 0
    ) {
      return;
    }

    // Prevent default full page reload
    e.preventDefault();

    // Use specific client-side navigation orchestrator if passed or defined globally
    const navFn = navigate || (typeof window !== 'undefined' ? window.__appNavigate : null);

    if (navFn) {
      navFn(to, productId, shopName, navOptions);
    } else {
      router.push(resolvedHref, { scroll: false });
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    }
  };

  return (
    <a
      href={resolvedHref}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}
