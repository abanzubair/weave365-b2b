/**
 * @file resellerService.js
 * @description White-label B2B Reseller and Storefront Database Operations.
 * Manages Supabase CRUD operations for reseller storefront branding, custom pricing markup
 * strategies, catalog item synchronization, customer inquiry ingestion, and reseller dashboard reporting.
 * 
 * @module services/resellerService
 */

import { supabase } from '../supabaseClient';

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
   * Get reseller storefront settings
   */
  async getStorefront(resellerId) {
    const { data, error } = await supabase
      .from('reseller_storefronts')
      .select('*')
      .eq('reseller_id', resellerId)
      .single();
    
    return { data, error };
  },

  /**
   * Update reseller storefront settings (upsert)
   */
  async updateStorefront(resellerId, updates) {
    const { data, error } = await supabase
      .from('reseller_storefronts')
      .upsert({ reseller_id: resellerId, ...updates }, { onConflict: 'reseller_id' })
      .select()
      .single();

    
    return { data, error };
  },

  /**
   * Add a product to the reseller's catalog (creates a share record + item).
   * If the reseller doesn't have a storefront yet, this will still work at the DB level,
   * but the storefront must exist for the public page to load.
   */
  async addToCatalog(resellerId, productData) {
    // Generate a unique token for this share
    const publicToken = Math.random().toString(36).substring(2, 10);

    const { data: share, error: shareError } = await supabase
      .from('reseller_shares')
      .insert({
        reseller_id: resellerId,
        public_token: publicToken,
        title: productData.title,
        default_markup_type: productData.markupType,
        default_markup_value: productData.markupValue,
      })
      .select()
      .single();

    if (shareError) {
      console.error('Error creating share:', shareError);
      return { error: shareError };
    }

    const { error: itemError } = await supabase
      .from('reseller_share_items')
      .insert({
        share_id: share.id,
        product_group_key: productData.productId,
        variant_code: productData.variantCode,
        base_price_snapshot: productData.basePrice,
        markup_type: productData.markupType,
        markup_value: productData.markupValue,
        customer_price: productData.customerPrice,
      });

    if (itemError) {
      console.error('Error creating share item:', itemError);
    }

    return { data: share, error: itemError };
  },

  /**
   * Get the full public catalog for a storefront by slug.
   * Returns the storefront info + ALL active share items combined.
   */
  async getStorefrontBySlug(slug) {
    // 1. Get storefront by slug
    const { data: storefront, error: storeError } = await supabase
      .from('reseller_storefronts')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (storeError || !storefront) {
      console.error('Storefront not found:', storeError);
      return { data: null, error: storeError };
    }

    // 2. Get ALL active shares for this reseller
    const { data: shares, error: sharesError } = await supabase
      .from('reseller_shares')
      .select('*, reseller_share_items (*)')
      .eq('reseller_id', storefront.reseller_id)
      .eq('is_active', true);

    if (sharesError) {
      console.error('Error fetching shares:', sharesError);
      return { data: null, error: sharesError };
    }

    // 3. Flatten all share items into one array
    const allItems = (shares || []).flatMap(share =>
      (share.reseller_share_items || []).map(item => ({
        ...item,
        share_title: share.title,
      }))
    );

    return {
      data: {
        storefront,
        items: allItems,
      },
      error: null,
    };
  },

  /**
   * Submit a customer inquiry from a shared link
   */
  async submitInquiry(inquiryData) {
    const { data, error } = await supabase
      .from('reseller_customer_inquiries')
      .insert(inquiryData)
      .select()
      .single();
    
    if (error) console.error('Error submitting inquiry:', error);
    return { data, error };
  },

  /**
   * Get all customer inquiries for a reseller
   */
  async getResellerInquiries(resellerId) {
    const { data, error } = await supabase
      .from('reseller_customer_inquiries')
      .select('*')
      .eq('reseller_id', resellerId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching inquiries:', error);
    return { data, error };
  },

  /**
   * Delete an inquiry
   */
  async deleteInquiry(inquiryId) {
    const { error } = await supabase
      .from('reseller_customer_inquiries')
      .update({ status: 'archived' })
      .eq('id', inquiryId);
    
    if (error) console.error('Error deleting inquiry:', error);
    return { error };
  },

  /**
   * Get all shares for a reseller (dashboard)
   */
  async getResellerShares(resellerId) {
    const { data, error } = await supabase
      .from('reseller_shares')
      .select(`
        *,
        reseller_share_items (*)
      `)
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching reseller shares:', error);
    return { data, error };
  },

  /**
   * Update markup price for a share and its share items
   */
  async updateShareMarkup(shareId, { markupType, markupValue, customerPrice }) {
    // 1. Update reseller_shares record
    const { data: share, error: shareError } = await supabase
      .from('reseller_shares')
      .update({
        default_markup_type: markupType,
        default_markup_value: markupValue,
      })
      .eq('id', shareId)
      .select()
      .single();

    if (shareError) {
      console.error('Error updating share markup:', shareError);
      return { error: shareError };
    }

    // 2. Fetch existing share items to update customer_price
    const { data: items, error: fetchItemsError } = await supabase
      .from('reseller_share_items')
      .select('*')
      .eq('share_id', shareId);

    if (!fetchItemsError && items && items.length > 0) {
      for (const item of items) {
        let newCustomerPrice = customerPrice;
        if (!newCustomerPrice && item.base_price_snapshot) {
          const base = Number(item.base_price_snapshot) || 0;
          if (markupType === 'percentage') {
            newCustomerPrice = Math.round(base * (1 + Number(markupValue) / 100));
          } else if (markupType === 'fixed_amount') {
            newCustomerPrice = Math.round(base + Number(markupValue));
          } else {
            newCustomerPrice = base;
          }
        }

        await supabase
          .from('reseller_share_items')
          .update({
            markup_type: markupType,
            markup_value: markupValue,
            customer_price: newCustomerPrice || item.customer_price,
          })
          .eq('id', item.id);
      }
    }

    return { data: share, error: null };
  },

  /**
   * Deactivate a share
   */
  async deactivateShare(shareId) {
    const { error } = await supabase
      .from('reseller_shares')
      .update({ is_active: false })
      .eq('id', shareId);
    
    return { error };
  },
};
