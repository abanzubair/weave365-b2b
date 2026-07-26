import { lazy } from 'react';

/**
 * Robust lazy import wrapper that handles Next.js ChunkLoadErrors caused by deployment updates.
 * If a chunk fails to load (e.g. after a new build deployment), it reloads the page once to fetch fresh assets.
 */
export function safeLazy(importFn) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      const errorStr = String(error?.message || error || '');
      const isChunkError =
        errorStr.includes('Loading chunk') ||
        errorStr.includes('Failed to fetch dynamically imported module') ||
        errorStr.includes('ChunkLoadError') ||
        errorStr.includes('Failed to load chunk');

      if (isChunkError && typeof window !== 'undefined') {
        const reloadKey = 'chunk_reload_' + (window.location.pathname || 'app');
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, '1');
          console.warn('[ChunkLoader] Stale chunk detected after deployment. Auto-refreshing page...');
          window.location.reload();
          return new Promise(() => {}); // Hold until reload
        }
      }
      throw error;
    }
  });
}
