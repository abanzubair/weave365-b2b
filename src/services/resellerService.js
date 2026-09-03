/**
 * @file resellerService.js
 * @description White-label B2B Reseller and Storefront Database Operations.
 * Operates on the isolated secondary database as the single source of truth for all boutique
 * website settings, published saree catalogs, retail pricing markups, and customer orders.
 * 
 * @module services/resellerService
 */

import { supabase } from '../supabaseClient';
import { syncTenantToStorefrontDb, syncProductToStorefrontDb, getStorefrontSupabase } from './boutiqueSyncService';

/**
 * Normalizes an external website URL to ensure it has a valid https protocol and no trailing slashes.
 * @param {string} url - Input website URL or domain
 * @returns {string} Normalized URL (e.g. 'https://myboutique.com')
 */
export function normalizeWebsiteUrl(url) {
  if (!url) return '';
  let clean = String(url).trim();
  if (!clean) return '';
  if (!/^https?:\/\//i.test(clean)) {
    clean = 'https://' + clean;
  }
  return clean.replace(/\/+$/, '');
}

/**
 * Service for Reseller White-label operations
 */
export const resellerService = {
  /**
   * Get reseller storefront settings (from primary DB mapping or secondary DB)
   */
  async getStorefront(resellerId) {
    const { data, error } = await supabase
      .from('reseller_storefronts')
      .select('*')
      .eq('reseller_id', resellerId)
      .maybeSingle();
    
    return { data, error };
  },

  /**
   * Update reseller storefront settings (upsert)
   */
  async updateStorefront(resellerId, updates) {
    const sanitizedUpdates = { ...updates };
    if ('custom_domain' in sanitizedUpdates) {
      const cd = typeof sanitizedUpdates.custom_domain === 'string'
        ? sanitizedUpdates.custom_domain.trim()
        : sanitizedUpdates.custom_domain;
      sanitizedUpdates.custom_domain = cd ? cd : null;
    }

    // 1. Keep mapping in primary DB
    const { data, error } = await supabase
      .from('reseller_storefronts')
      .upsert({ reseller_id: resellerId, ...sanitizedUpdates }, { onConflict: 'reseller_id' })
      .select()
      .single();

    // 2. Direct sync to isolated secondary storefront database
    if (data && !error) {
      syncTenantToStorefrontDb(data).catch(err => console.warn('[resellerService] Sync tenant warning:', err));
    }

    return { data, error };
  },

  /**
   * Add a product to the reseller's boutique catalog.
   * Saves DIRECTLY and EXCLUSIVELY to the dedicated Secondary DB.
   */
  async addToCatalog(resellerId, productData) {
    const { data: sf } = await this.getStorefront(resellerId);
    if (!sf?.slug) {
      return { error: new Error('Please configure your boutique brand name and handle first.') };
    }

    // Direct write to Secondary DB boutique_products
    const syncRes = await syncProductToStorefrontDb(sf, productData);
    if (syncRes?.error) {
      console.error('Error adding product to boutique database:', syncRes.error);
      return { error: syncRes.error };
    }

    return { data: syncRes?.data || { success: true }, error: null };
  },

  /**
   * Get all products in the reseller's boutique catalog.
   * Reads DIRECTLY and EXCLUSIVELY from the dedicated Secondary DB.
   */
  async getResellerShares(resellerId) {
    const { data: sf } = await this.getStorefront(resellerId);
    if (!sf?.slug) {
      return { data: [], error: null };
    }

    const sb = getStorefrontSupabase();
    if (!sb) {
      console.warn('[resellerService] Storefront DB client not initialized');
      return { data: [], error: null };
    }

    try {
      // 1. Fetch tenant from secondary DB
      const { data: tenant } = await sb
        .from('boutique_tenants')
        .select('id')
        .eq('slug', sf.slug.toLowerCase().trim())
        .maybeSingle();

      if (!tenant?.id) {
        return { data: [], error: null };
      }

      // 2. Query products exclusively from secondary DB
      const { data: products, error } = await sb
        .from('boutique_products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[resellerService] Error fetching boutique products:', error);
        return { data: [], error };
      }

      // 3. Map into expected schema for ResellerTools UI
      const formatted = (products || []).map((p) => {
        const base = Number(p.base_price || 0);
        const retail = Number(p.retail_price || base);
        const profit = retail - base;
        const markupPct = base > 0 ? Math.round((profit / base) * 100) : 0;

        return {
          id: p.id,
          is_active: p.is_published !== false,
          title: p.title,
          default_markup_type: 'percentage',
          default_markup_value: markupPct,
          created_at: p.created_at,
          reseller_share_items: [
            {
              id: p.id,
              product_group_key: p.original_product_id,
              variant_code: p.sku || p.original_product_id,
              base_price_snapshot: base,
              customer_price: retail,
              markup_type: 'percentage',
              markup_value: markupPct,
            },
          ],
        };
      });

      return { data: formatted, error: null };
    } catch (err) {
      console.error('[resellerService] Critical error fetching boutique catalog:', err);
      return { data: [], error: err };
    }
  },

  /**
   * Update retail selling price for a boutique product.
   * Updates DIRECTLY on the Secondary DB.
   */
  async updateShareMarkup(productId, { markupType, markupValue, customerPrice }) {
    const sb = getStorefrontSupabase();
    if (!sb) return { error: new Error('Database client not available') };

    try {
      let finalPrice = Number(customerPrice || 0);

      if (!finalPrice) {
        const { data: existing } = await sb
          .from('boutique_products')
          .select('base_price')
          .eq('id', productId)
          .maybeSingle();

        const base = Number(existing?.base_price || 0);
        if (markupType === 'percentage') {
          finalPrice = Math.round(base * (1 + Number(markupValue) / 100));
        } else if (markupType === 'fixed_amount') {
          finalPrice = Math.round(base + Number(markupValue));
        } else {
          finalPrice = base;
        }
      }

      const { data, error } = await sb
        .from('boutique_products')
        .update({ retail_price: finalPrice })
        .eq('id', productId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('[resellerService] Error updating product price:', err);
      return { error: err };
    }
  },

  /**
   * Remove or deactivate a product from the boutique catalog.
   * Deletes DIRECTLY from the Secondary DB.
   */
  async deactivateShare(productId) {
    const sb = getStorefrontSupabase();
    if (!sb) return { error: new Error('Database client not available') };

    try {
      const { error } = await sb
        .from('boutique_products')
        .delete()
        .eq('id', productId);

      return { error };
    } catch (err) {
      console.error('[resellerService] Error deleting boutique product:', err);
      return { error: err };
    }
  },

  /**
   * Get the full public catalog for a storefront by slug.
   * Reads DIRECTLY from Secondary DB.
   */
  async getStorefrontBySlug(slug) {
    const sb = getStorefrontSupabase();
    if (!sb || !slug) return { data: null, error: new Error('Invalid slug') };

    try {
      const cleanSlug = slug.toLowerCase().trim();
      const { data: tenant, error: tenantErr } = await sb
        .from('boutique_tenants')
        .select('*')
        .eq('slug', cleanSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (tenantErr || !tenant) {
        return { data: null, error: tenantErr || new Error('Boutique not found') };
      }

      const { data: products, error: prodErr } = await sb
        .from('boutique_products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      const allItems = (products || []).map((p) => ({
        id: p.id,
        product_group_key: p.original_product_id,
        variant_code: p.sku || p.original_product_id,
        base_price_snapshot: p.base_price,
        customer_price: p.retail_price,
        share_title: p.title,
      }));

      return {
        data: {
          storefront: tenant,
          items: allItems,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  /**
   * Submit a customer inquiry (stored in isolated storefront DB)
   */
  async submitInquiry(inquiryData) {
    const sb = getStorefrontSupabase();
    if (!sb) return { error: new Error('Storefront DB not available') };

    const { data, error } = await sb
      .from('boutique_orders')
      .insert({
        customer_name: inquiryData.name || inquiryData.customer_name || 'Guest',
        customer_phone: inquiryData.phone || inquiryData.customer_phone || '',
        customer_email: inquiryData.email || inquiryData.customer_email || null,
        total_amount: inquiryData.total_amount || 0,
        status: 'new',
      })
      .select()
      .single();

    if (error) console.error('Error submitting inquiry:', error);
    return { data, error };
  },

  /**
   * Get all customer inquiries for a reseller
   */
  async getResellerInquiries(resellerId) {
    const { data: sf } = await this.getStorefront(resellerId);
    if (!sf?.slug) return { data: [], error: null };

    const sb = getStorefrontSupabase();
    if (!sb) return { data: [], error: null };

    const { data: tenant } = await sb
      .from('boutique_tenants')
      .select('id')
      .eq('slug', sf.slug.toLowerCase().trim())
      .maybeSingle();

    if (!tenant?.id) return { data: [], error: null };

    const { data, error } = await sb
      .from('boutique_orders')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  /**
   * Delete reseller storefront and associated boutique records
   */
  async deleteStorefront(resellerId) {
    if (!resellerId) return { error: new Error('User ID is required') };

    // 1. Fetch existing storefront to get slug
    const { data: existingSf } = await this.getStorefront(resellerId);

    // 2. Delete the storefront mapping from primary DB
    const { data, error } = await supabase
      .from('reseller_storefronts')
      .delete()
      .eq('reseller_id', resellerId);

    if (error) {
      console.error('Error deleting reseller storefront:', error);
      return { error };
    }

    // 3. Delete tenant and cascade products from secondary DB
    if (existingSf?.slug) {
      try {
        const sb = getStorefrontSupabase();
        if (sb) {
          await sb
            .from('boutique_tenants')
            .delete()
            .eq('slug', existingSf.slug.toLowerCase().trim());
        }
      } catch (e) {
        console.warn('[resellerService] Delete storefront remote error:', e);
      }
    }

    return { data, error: null };
  },
};
