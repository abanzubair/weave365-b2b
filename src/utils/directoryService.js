/**
 * @file directoryService.js
 * @description Data service for managing Weave365 Directory (InternalLinkNetwork) configuration.
 * Handles persistence to Supabase database (`site_directory_settings`) and local browser cache (`localStorage`),
 * and dispatches live events when configurations are updated.
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient.js';

export const DIRECTORY_STORAGE_KEY = 'weave365_directory_config';
export const DIRECTORY_UPDATED_EVENT = 'directory-config-updated';

export const DEFAULT_DIRECTORY_CONFIG = {
  kicker: 'WEAVE365 DIRECTORY',
  title: 'Sourcing & Craft Heritage Network',
  columns: [
    {
      id: 'col_collections',
      title: 'Premium Collections',
      icon: 'Compass',
      links: [
        { label: 'Banarasi Sarees', type: 'route', target: 'banarasi-sarees', path: '/banarasi-sarees' },
        { label: 'Pure Katan Silk Sarees', type: 'route', target: 'katan-silk-sarees', path: '/katan-silk-sarees' },
        { label: 'Organza Banarasi Sarees', type: 'route', target: 'organza-banarasi-sarees', path: '/organza-banarasi-sarees' },
        { label: 'Bridal Banarasi Sarees', type: 'route', target: 'bridal-banarasi-sarees', path: '/bridal-banarasi-sarees' },
        { label: 'Banarasi Meenakari Sarees', type: 'route', target: 'meenakari-sarees', path: '/meenakari-sarees' },
        { label: 'Soft Silk Banarasi Sarees', type: 'route', target: 'soft-silk-sarees', path: '/soft-silk-sarees' },
        { label: 'Wholesale Saree Supplier India', type: 'route', target: 'wholesale-saree-supplier-india', path: '/wholesale-saree-supplier-india' }
      ]
    },
    {
      id: 'col_categories',
      title: 'Product Categories',
      icon: 'Grid',
      links: [
        { label: 'Wholesale Saree Catalog', type: 'category', target: 'Saree', path: '/catalogue?category=Saree' },
        { label: 'Wholesale Suit Catalog', type: 'category', target: 'Suit', path: '/catalogue?category=Suit' },
        { label: 'Wholesale Silk Dupattas', type: 'category', target: 'Dupatta', path: '/catalogue?category=Dupatta' },
        { label: 'Designer Banarasi Lehengas', type: 'category', target: 'Lehenga', path: '/catalogue?category=Lehenga' },
        { label: 'Handloom Unstitched Fabrics', type: 'category', target: 'Fabric', path: '/catalogue?category=Fabric' },
        { label: 'Under 999', type: 'category', target: 'Under 999', path: '/catalogue?category=Under 999' }
      ]
    },
    {
      id: 'col_guides',
      title: 'Educational Guides',
      icon: 'BookOpen',
      links: [
        { label: 'Fabric Guide: Katan vs Organza', type: 'blog-guide', target: 'difference-katan-silk-and-organza-saree', path: '/blog/difference-katan-silk-and-organza-saree' },
        { label: 'Saree Reselling Business Blueprint', type: 'blog-guide', target: 'how-to-start-saree-reselling-business', path: '/blog/how-to-start-saree-reselling-business' },
        { label: 'Boutique Wholesale Sourcing Guide', type: 'blog-guide', target: 'wholesale-saree-buying-guide-boutiques', path: '/blog/wholesale-saree-buying-guide-boutiques' }
      ]
    },
    {
      id: 'col_hubs',
      title: 'Sourcing Hubs',
      icon: 'Briefcase',
      links: [
        { label: 'Weaver Partnership Program', type: 'route', target: 'weaver-onboarding', path: '/weaver-onboarding' },
        { label: 'Bulk Sourcing & Custom Catalog', type: 'route', target: 'bulk-inquiry', path: '/bulk-inquiry' },
        { label: 'Varanasi Brand Story & Heritage', type: 'route', target: 'about', path: '/about' },
        { label: 'Insights & Sourcing Blog', type: 'route', target: 'blog', path: '/blog' }
      ]
    }
  ]
};

export const DIRECTORY_TABLE_SQL = `CREATE TABLE IF NOT EXISTS public.site_directory_settings (
  id text PRIMARY KEY DEFAULT 'main',
  config jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_directory_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "directory settings public read" ON public.site_directory_settings;
CREATE POLICY "directory settings public read" ON public.site_directory_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "directory settings admin modify" ON public.site_directory_settings;
CREATE POLICY "directory settings admin modify" ON public.site_directory_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

/**
 * Loads current directory configuration synchronously from localStorage or default.
 */
export function getDirectoryConfigLocal() {
  if (typeof window === 'undefined') {
    return DEFAULT_DIRECTORY_CONFIG;
  }
  try {
    const cached = localStorage.getItem(DIRECTORY_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.columns)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[directoryService] Local storage load error:', e);
  }
  return DEFAULT_DIRECTORY_CONFIG;
}

/**
 * Fetches directory configuration from Supabase and syncs with local cache.
 */
export async function fetchDirectoryConfigRemote() {
  if (!isSupabaseConfigured) return getDirectoryConfigLocal();
  
  try {
    const { data, error } = await supabase
      .from('site_directory_settings')
      .select('config')
      .eq('id', 'main')
      .maybeSingle();

    if (error) {
      console.warn('[directoryService] Remote fetch error (using cache):', error.message);
      return getDirectoryConfigLocal();
    }

    if (data && data.config && Array.isArray(data.config.columns)) {
      localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(data.config));
      window.dispatchEvent(new CustomEvent(DIRECTORY_UPDATED_EVENT, { detail: data.config }));
      return data.config;
    }
  } catch (err) {
    console.error('[directoryService] Unexpected fetch error:', err);
  }
  return getDirectoryConfigLocal();
}

/**
 * Saves updated directory configuration to Supabase and localStorage.
 */
export async function saveDirectoryConfig(newConfig) {
  try {
    // 1. Save to local storage for instant feedback
    localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(newConfig));
    window.dispatchEvent(new CustomEvent(DIRECTORY_UPDATED_EVENT, { detail: newConfig }));

    // 2. Save to Supabase if configured
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('site_directory_settings')
        .upsert({
          id: 'main',
          config: newConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.warn('[directoryService] Supabase upsert warning:', error.message);
        return { success: true, warning: 'Saved locally. Remote save issue: ' + error.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[directoryService] Save failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Resets configuration to default values.
 */
export async function resetDirectoryConfig() {
  return await saveDirectoryConfig(DEFAULT_DIRECTORY_CONFIG);
}
