/**
 * @file resellerService.js
 * @description White-label B2B Reseller and Storefront Database Operations.
 * Operates on the isolated secondary database as the single source of truth for all boutique
 * website settings, published saree catalogs, retail pricing markups, and customer orders.
 * 
 * @module services/resellerService
 */

import { syncProductToStorefrontDb, getStorefrontSupabase } from './boutiqueSyncService';

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
 * Service for Reseller White-label operations.
 * Operates EXCLUSIVELY on the secondary storefront database (boutique_tenants, boutique_products).
 */
export const resellerService = {
  /**
   * Get reseller storefront settings exclusively from secondary DB (boutique_tenants)
   */
  async getStorefront(resellerId) {
    if (!resellerId) return { data: null, error: null };
    const sb = getStorefrontSupabase();
    if (!sb) return { data: null, error: new Error('Storefront database not configured') };

    try {
      // 1. Try finding tenant by metadata in about_text
      let { data: tenant } = await sb
        .from('boutique_tenants')
        .select('*')
        .ilike('about_text', `%${resellerId}%`)
        .maybeSingle();

      // 2. If not found, fetch active tenants and match owner_id or single default
      if (!tenant) {
        const { data: allTenants } = await sb
          .from('boutique_tenants')
          .select('*')
          .order('created_at', { ascending: false });

        if (allTenants && allTenants.length > 0) {
          tenant = allTenants.find(t => t.reseller_id === resellerId || t.owner_id === resellerId);
          if (!tenant && allTenants.length === 1 && !allTenants[0].about_text?.includes('reseller_id')) {
            tenant = allTenants[0];
          }
        }
      }

      if (!tenant) return { data: null, error: null };

      return {
        data: {
          id: tenant.id,
          reseller_id: resellerId,
          store_name: tenant.store_name,
          slug: tenant.slug,
          tagline: tenant.tagline || '',
          logo_url: tenant.logo_url,
          banner_url: tenant.banner_url,
          whatsapp: tenant.whatsapp || '',
          custom_domain: tenant.custom_domain,
          theme_color: tenant.theme_color || 'vrtx-studio',
          accent_color: tenant.accent_color || '#b58342',
          theme_settings: {
            theme_id: tenant.theme_color || 'vrtx-studio',
            accent_color: tenant.accent_color || '#b58342',
            primary_color: tenant.accent_color || '#0F172A',
          },
          about_text: tenant.about_text,
          is_active: tenant.is_active !== false,
          created_at: tenant.created_at,
        },
        error: null,
      };
    } catch (err) {
      console.error('[resellerService] getStorefront error from secondary DB:', err);
      return { data: null, error: err };
    }
  },

  /**
   * Update reseller storefront settings exclusively in secondary DB (boutique_tenants)
   */
  async updateStorefront(resellerId, updates) {
    const sb = getStorefrontSupabase();
    if (!sb) return { data: null, error: new Error('Storefront database not configured') };

    const sanitizedUpdates = { ...updates };
    if ('custom_domain' in sanitizedUpdates) {
      const cd = typeof sanitizedUpdates.custom_domain === 'string'
        ? sanitizedUpdates.custom_domain.trim()
        : sanitizedUpdates.custom_domain;
      sanitizedUpdates.custom_domain = cd ? cd : null;
    }

    try {
      const { data: existingSf } = await this.getStorefront(resellerId);
      const slug = (sanitizedUpdates.slug || existingSf?.slug || 'my-boutique').toLowerCase().trim();

      const metaTag = JSON.stringify({ reseller_id: resellerId });

      const tenantPayload = {
        slug,
        store_name: sanitizedUpdates.store_name || existingSf?.store_name || slug,
        tagline: sanitizedUpdates.tagline !== undefined ? sanitizedUpdates.tagline : (existingSf?.tagline || ''),
        logo_url: sanitizedUpdates.logo_url !== undefined ? sanitizedUpdates.logo_url : (existingSf?.logo_url || null),
        banner_url: sanitizedUpdates.banner_url !== undefined ? sanitizedUpdates.banner_url : (existingSf?.banner_url || null),
        theme_color: sanitizedUpdates.theme_color || existingSf?.theme_color || 'vrtx-studio',
        accent_color: sanitizedUpdates.accent_color || existingSf?.accent_color || '#b58342',
        whatsapp: sanitizedUpdates.whatsapp !== undefined ? sanitizedUpdates.whatsapp : (existingSf?.whatsapp || ''),
        custom_domain: sanitizedUpdates.custom_domain !== undefined ? sanitizedUpdates.custom_domain : (existingSf?.custom_domain || null),
        about_text: metaTag,
        is_active: sanitizedUpdates.is_active !== undefined ? sanitizedUpdates.is_active : true,
      };

      let resultTenant = null;

      if (existingSf?.id) {
        const { data, error } = await sb
          .from('boutique_tenants')
          .update(tenantPayload)
          .eq('id', existingSf.id)
          .select()
          .single();
        if (error) throw error;
        resultTenant = data;
      } else {
        const { data: existingBySlug } = await sb
          .from('boutique_tenants')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (existingBySlug?.id) {
          const { data, error } = await sb
            .from('boutique_tenants')
            .update(tenantPayload)
            .eq('id', existingBySlug.id)
            .select()
            .single();
          if (error) throw error;
          resultTenant = data;
        } else {
          const { data, error } = await sb
            .from('boutique_tenants')
            .insert(tenantPayload)
            .select()
            .single();
          if (error) throw error;
          resultTenant = data;
        }
      }

      return {
        data: {
          id: resultTenant.id,
          reseller_id: resellerId,
          store_name: resultTenant.store_name,
          slug: resultTenant.slug,
          tagline: resultTenant.tagline || '',
          logo_url: resultTenant.logo_url,
          banner_url: resultTenant.banner_url,
          whatsapp: resultTenant.whatsapp || '',
          custom_domain: resultTenant.custom_domain,
          theme_color: resultTenant.theme_color,
          accent_color: resultTenant.accent_color,
          theme_settings: {
            theme_id: resultTenant.theme_color,
            accent_color: resultTenant.accent_color,
            primary_color: resultTenant.accent_color || '#0F172A',
          },
          about_text: resultTenant.about_text,
          is_active: resultTenant.is_active !== false,
          created_at: resultTenant.created_at,
        },
        error: null,
      };
    } catch (err) {
      console.error('[resellerService] updateStorefront error on secondary DB:', err);
      return { data: null, error: err };
    }
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
   * Delete reseller storefront and associated boutique records exclusively from secondary DB
   */
  async deleteStorefront(resellerId) {
    if (!resellerId) return { error: new Error('User ID is required') };
    const sb = getStorefrontSupabase();
    if (!sb) return { error: new Error('Storefront database not configured') };

    try {
      const { data: existingSf } = await this.getStorefront(resellerId);
      if (!existingSf) return { data: null, error: null };

      if (existingSf.id) {
        await sb
          .from('boutique_products')
          .delete()
          .eq('tenant_id', existingSf.id);

        const { error } = await sb
          .from('boutique_tenants')
          .delete()
          .eq('id', existingSf.id);

        if (error) throw error;
      }

      return { data: { success: true }, error: null };
    } catch (err) {
      console.error('[resellerService] deleteStorefront error on secondary DB:', err);
      return { error: err };
    }
  },
};
