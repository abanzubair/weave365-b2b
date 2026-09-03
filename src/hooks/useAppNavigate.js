'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getProductCategorySlug, seoCategoryRoutes, getCategorySlug, getCategoryFromSlug } from '../config.js';

export const slugifyPartner = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim().replace(/\s+/g, '-');
};

export function useAppNavigate() {
  const router = useRouter();

  const navigate = useCallback((nextRoute, productId = null, shopName = null, navOptions = {}) => {
    let href = `/${nextRoute}`;
    if (nextRoute === 'home' || !nextRoute) {
      href = '/';
    } else if (nextRoute === 'product' && productId) {
      const catSlug = getProductCategorySlug(productId);
      href = `/${catSlug}/${encodeURIComponent(productId)}`;
    } else if (nextRoute === 'order-tracking') {
      href = productId ? `/order-tracking/${encodeURIComponent(productId)}` : '/order-tracking';
    } else if (nextRoute === 'partner') {
      href = `/partner/${encodeURIComponent(slugifyPartner(productId))}`;
    } else if (nextRoute === 'account' || nextRoute.startsWith('account?')) {
      if (nextRoute.startsWith('account?')) {
        href = `/${nextRoute}`;
      } else {
        const tab = productId || navOptions.tab;
        href = tab ? `/account?tab=${encodeURIComponent(tab)}` : '/account';
      }
    } else if (nextRoute === 'blog' && productId) {
      href = `/blog/${encodeURIComponent(productId)}`;
    } else if (nextRoute === 'signup' || nextRoute.startsWith('signup?') || nextRoute === 'register' || nextRoute === 'login') {
      if (nextRoute.startsWith('signup?')) {
        href = `/${nextRoute}`;
      } else {
        const params = new URLSearchParams();
        if (nextRoute === 'login' || navOptions.mode === 'login') {
          params.set('mode', 'login');
        } else if (nextRoute === 'register' || navOptions.mode === 'register') {
          params.set('mode', 'register');
        } else if (navOptions.mode) {
          params.set('mode', navOptions.mode);
        }
        if (productId) {
          params.set('type', productId);
        } else if (navOptions.type) {
          params.set('type', navOptions.type);
        }
        const q = params.toString();
        href = `/signup${q ? `?${q}` : ''}`;
      }
    } else if (nextRoute === 'reseller-banarasi-sarees' || nextRoute === 'resell-sarees-online') {
      href = '/resell-sarees-online';
    } else if (nextRoute === 'sellers' || nextRoute === 'sell-banarasi-sarees' || nextRoute === 'seller' || nextRoute === 'weaver-onboarding') {
      href = '/sell-banarasi-sarees';
    } else if (nextRoute === 'wholesale-catalogue' || nextRoute === 'catalogue' || nextRoute === 'wholesale-banarasi-sarees') {
      const currentSearchParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const params = new URLSearchParams();
      const s = navOptions.search !== undefined ? navOptions.search : currentSearchParams.get('search');
      if (s) params.set('search', s);
      const cat = navOptions.category !== undefined ? navOptions.category : currentSearchParams.get('category');
      const fab = navOptions.fabric !== undefined ? navOptions.fabric : currentSearchParams.get('fabric');
      if (fab && fab !== 'All' && fab !== 'all') params.set('fabric', fab.toLowerCase());
      const wve = navOptions.weave !== undefined ? navOptions.weave : currentSearchParams.get('weave');
      if (wve && wve !== 'All' && wve !== 'all') params.set('weave', wve.toLowerCase());
      const occ = navOptions.occasion !== undefined ? navOptions.occasion : currentSearchParams.get('occasion');
      if (occ && occ !== 'All' && occ !== 'all') params.set('occasion', occ.toLowerCase());
      const prc = navOptions.priceRange !== undefined ? navOptions.priceRange : currentSearchParams.get('priceRange');
      if (prc && prc !== 'All' && prc !== 'all') params.set('priceRange', prc);

      if (cat && cat !== 'All' && cat !== 'all') {
        const catSlug = getCategorySlug(cat);
        const q = params.toString();
        href = `/${catSlug}${q ? `?${q}` : ''}`;
      } else {
        const q = params.toString();
        href = `/catalogue${q ? `?${q}` : ''}`;
      }
    } else if (Object.keys(seoCategoryRoutes).includes(nextRoute) || getCategoryFromSlug(nextRoute)) {
      const catSlug = getCategorySlug(nextRoute) || nextRoute;
      const currentSearchParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const params = new URLSearchParams();
      const s = navOptions.search !== undefined ? navOptions.search : currentSearchParams.get('search');
      if (s) params.set('search', s);
      const fab = navOptions.fabric !== undefined ? navOptions.fabric : currentSearchParams.get('fabric');
      if (fab && fab !== 'All' && fab !== 'all') params.set('fabric', fab.toLowerCase());
      const wve = navOptions.weave !== undefined ? navOptions.weave : currentSearchParams.get('weave');
      if (wve && wve !== 'All' && wve !== 'all') params.set('weave', wve.toLowerCase());
      const occ = navOptions.occasion !== undefined ? navOptions.occasion : currentSearchParams.get('occasion');
      if (occ && occ !== 'All' && occ !== 'all') params.set('occasion', occ.toLowerCase());
      const prc = navOptions.priceRange !== undefined ? navOptions.priceRange : currentSearchParams.get('priceRange');
      if (prc && prc !== 'All' && prc !== 'all') params.set('priceRange', prc);
      const q = params.toString();
      href = `/${catSlug}${q ? `?${q}` : ''}`;
    }

    router.push(href, { scroll: true });

    if (typeof window !== 'undefined' && href.includes('#')) {
      const hashAnchor = href.split('#')[1];
      setTimeout(() => {
        const el = document.getElementById(hashAnchor);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [router]);

  return navigate;
}
