/**
 * @file directoryService.js
 * @description Data service for managing Weave365 Directory (InternalLinkNetwork) configuration.
 * Handles persistence to Supabase database (`site_directory_settings`) and local browser cache (`localStorage`),
 * and dispatches live events when configurations are updated.
 */

// Note: supabaseClient is dynamically imported inside fetchDirectoryConfigRemote and saveDirectoryConfig
// to avoid bundling @supabase/supabase-js into the critical layout bundle.

export const DIRECTORY_STORAGE_KEY = 'weave365_directory_config_v2';
export const DIRECTORY_UPDATED_EVENT = 'directory-config-updated';

export const DEFAULT_DIRECTORY_CONFIG = {
  kicker: 'HOW WEAVE 365 WORKS FOR YOU',
  title: 'Explore the World of Banarasi, Your Way',
  columns: [
    {
      id: 'col_b2b',
      title: 'B2B Sourcing & Wholesale',
      icon: 'Briefcase',
      links: [
        { label: 'Wholesale Banarasi Sarees', type: 'route', target: 'wholesale-saree-supplier-india', path: '/wholesale-saree-supplier-india' },
        { label: 'Wholesale Saree Catalog', type: 'category', target: 'Saree', path: '/sarees' },
        { label: 'Unstitched Banarasi Suits Wholesale', type: 'category', target: 'Suit', path: '/suits' },
        { label: 'Pure Silk Dupattas in Bulk', type: 'category', target: 'Dupatta', path: '/dupattas' },
        { label: 'Bulk Sourcing & Export Inquiries', type: 'route', target: 'bulk-inquiry', path: '/bulk-inquiry' },
        { label: 'B2B Sourcing Partners Program', type: 'route', target: 'sourcing-partners', path: '/sourcing-partners' },
        { label: 'Wholesale Saree Buying Guide', type: 'blog-guide', target: 'the-ultimate-wholesale-banarasi-saree-buying-guide-for-wholesalers-and-resellers', path: '/blog/the-ultimate-wholesale-banarasi-saree-buying-guide-for-wholesalers-and-resellers' }
      ]
    },
    {
      id: 'col_whitelabel',
      title: 'White Label & Custom Branding',
      icon: 'BookOpen',
      links: [
        { label: 'White Label Banarasi Sarees for Boutiques', type: 'route', target: 'white-label-banarasi-sarees-for-boutiques', path: '/white-label-banarasi-sarees-for-boutiques' },
        { label: 'Private Label Saree Catalog Varanasi', type: 'route', target: 'private-label-saree-catalog-varanasi-india', path: '/private-label-saree-catalog-varanasi-india' },
        { label: 'Custom Packaging & Tagging', type: 'route', target: 'private-label-sarees-with-custom-packaging', path: '/private-label-sarees-with-custom-packaging' },
        { label: 'White Label Sarees for Online Stores', type: 'route', target: 'white-label-sarees-for-online-stores', path: '/white-label-sarees-for-online-stores' },
        { label: 'Catalog Sharing via WhatsApp & Social', type: 'route', target: 'white-label-catalog-for-whatsapp-social-media', path: '/white-label-catalog-for-whatsapp-social-media' },
        { label: 'Custom Weaving for Fashion Designers', type: 'route', target: 'custom-banarasi-saree-weaving-for-fashion-designers', path: '/custom-banarasi-saree-weaving-for-fashion-designers' },
        { label: 'How White Label Catalogs Work', type: 'route', target: 'how-white-label-catalogs-work', path: '/how-white-label-catalogs-work' }
      ]
    },
    {
      id: 'col_reseller',
      title: 'Reseller & Dropshipping Hub',
      icon: 'Sparkles',
      links: [
        { label: 'Saree Reselling from Home', type: 'route', target: 'resell-sarees-online', path: '/resell-sarees-online' },
        { label: 'Start Saree Business from Home', type: 'blog-guide', target: 'how-to-start-a-saree-reselling-business-from-home-in-india', path: '/blog/how-to-start-a-saree-reselling-business-from-home-in-india' },
        { label: 'Low MOQ Dropshipping for Resellers', type: 'route', target: 'dropshipping-white-label-low-moq-banarasi-sarees', path: '/dropshipping-white-label-low-moq-banarasi-sarees' },
        { label: 'Banarasi Saree Dropshipping Services', type: 'route', target: 'dropshipping', path: '/dropshipping' },
        { label: 'Zero-Investment Reselling Blueprint', type: 'blog-guide', target: 'how-to-start-a-banarasi-saree-and-suit-reselling-business-with-zero-investment', path: '/blog/how-to-start-a-banarasi-saree-and-suit-reselling-business-with-zero-investment' },
        { label: 'Reseller Pricing & FAQs Guide', type: 'route', target: 'reseller-faqs', path: '/reseller-faqs' },
        { label: 'Sell on Weave 365 (Artisan Network)', type: 'route', target: 'sell-banarasi-sarees', path: '/sell-banarasi-sarees' }
      ]
    },
    {
      id: 'col_craft',
      title: 'Pure Silk & Heritage Weaves',
      icon: 'ShoppingBag',
      links: [
        { label: 'Pure Handloom Banarasi Silk Sarees', type: 'route', target: 'pure-handloom-banarasi-silk-sarees', path: '/pure-handloom-banarasi-silk-sarees' },
        { label: 'Pure Katan Silk Sarees for Wedding', type: 'route', target: 'banarasi-katan-silk-saree-for-wedding', path: '/banarasi-katan-silk-saree-for-wedding' },
        { label: 'Handloom Kora Organza Sarees', type: 'route', target: 'organza-banarasi-sarees', path: '/organza-banarasi-sarees' },
        { label: 'Bridal Banarasi Sarees Online India', type: 'route', target: 'bridal-banarasi-sarees-online-india', path: '/bridal-banarasi-sarees-online-india' },
        { label: 'Semi Handloom Banarasi Silk Sarees', type: 'route', target: 'semi-handloom-banarasi-silk-saree', path: '/semi-handloom-banarasi-silk-saree' },
        { label: 'Handloom vs Powerloom Fabric Guide', type: 'route', target: 'handloom-vs-powerloom-guide', path: '/handloom-vs-powerloom-guide' },
        { label: 'Banarasi Meenakari Sarees', type: 'route', target: 'meenakari-sarees', path: '/meenakari-sarees' }
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

let inMemoryConfig = null;
let inFlightFetch = null;

/**
 * Loads current directory configuration synchronously from localStorage or default.
 */
export function getDirectoryConfigLocal() {
  if (inMemoryConfig && Array.isArray(inMemoryConfig.columns)) {
    return inMemoryConfig;
  }
  if (typeof window === 'undefined') {
    return DEFAULT_DIRECTORY_CONFIG;
  }
  try {
    const cached = localStorage.getItem(DIRECTORY_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.columns)) {
        inMemoryConfig = parsed;
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
export async function fetchDirectoryConfigRemote(force = false) {
  if (!force && inFlightFetch) {
    return inFlightFetch;
  }
  
  inFlightFetch = (async () => {
    try {
      const { supabase, isSupabaseConfigured } = await import('../supabaseClient.js');
      if (!isSupabaseConfigured || !supabase) return getDirectoryConfigLocal();

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
        inMemoryConfig = data.config;
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(data.config));
          } catch (storageErr) {
            console.warn('[directoryService] Local storage sync error:', storageErr);
          }
        }
        return data.config;
      }
    } catch (err) {
      console.error('[directoryService] Unexpected fetch error:', err);
    } finally {
      inFlightFetch = null;
    }
    return getDirectoryConfigLocal();
  })();

  return inFlightFetch;
}

/**
 * Saves updated directory configuration to Supabase and localStorage.
 */
export async function saveDirectoryConfig(newConfig) {
  try {
    // 1. Save to local storage for instant feedback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(newConfig));
        window.dispatchEvent(new CustomEvent(DIRECTORY_UPDATED_EVENT, { detail: newConfig }));
      } catch (storageErr) {
        console.warn('[directoryService] Local storage save error:', storageErr);
      }
    }

    // 2. Save to Supabase if configured
    const { supabase, isSupabaseConfigured } = await import('../supabaseClient.js');
    if (isSupabaseConfigured && supabase) {
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
