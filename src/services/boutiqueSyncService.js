import { createClient } from '@supabase/supabase-js';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_SUPABASE_URL || 'https://agsldsqeynzydujmijgc.supabase.co';
const STOREFRONT_KEY = process.env.STOREFRONT_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_STOREFRONT_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnc2xkc3FleW56eWR1am1pamdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDQxOTAsImV4cCI6MjEwNDAyMDE5MH0.PHFlhCQyRyBCxy1nFR2GdYgwcraiQZu8wSho29qkpEA';

let storefrontClient = null;

export function getStorefrontSupabase() {
  if (!storefrontClient && STOREFRONT_URL && STOREFRONT_KEY) {
    storefrontClient = createClient(STOREFRONT_URL, STOREFRONT_KEY, {
      auth: { persistSession: false },
    });
  }
  return storefrontClient;
}

/**
 * Synchronizes tenant boutique profile into the isolated storefront database.
 */
export async function syncTenantToStorefrontDb(storefrontRecord) {
  const sb = getStorefrontSupabase();
  if (!sb || !storefrontRecord?.slug) return null;

  try {
    const slug = storefrontRecord.slug.toLowerCase().trim();
    const payload = {
      slug,
      store_name: storefrontRecord.store_name || slug,
      tagline: storefrontRecord.tagline || '',
      logo_url: storefrontRecord.logo_url || null,
      banner_url: storefrontRecord.banner_url || null,
      theme_color: storefrontRecord.theme_color || 'vrtx-studio',
      accent_color: storefrontRecord.accent_color || '#b58342',
      whatsapp: storefrontRecord.whatsapp || '',
      custom_domain: storefrontRecord.custom_domain || null,
      about_text: storefrontRecord.about_text || null,
      is_active: storefrontRecord.is_active !== false,
    };

    const { data: existing } = await sb
      .from('boutique_tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await sb
        .from('boutique_tenants')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      return { data, error };
    } else {
      const { data, error } = await sb
        .from('boutique_tenants')
        .insert(payload)
        .select()
        .single();
      return { data, error };
    }
  } catch (err) {
    console.error('[boutiqueSync] Tenant sync error:', err);
    return { error: err };
  }
}

/**
 * Synchronizes a published product and its retail pricing into the isolated storefront database.
 */
export async function syncProductToStorefrontDb(slugOrStorefront, productData) {
  const sb = getStorefrontSupabase();
  if (!sb) return null;

  try {
    const slug = (typeof slugOrStorefront === 'string' ? slugOrStorefront : slugOrStorefront?.slug || '').toLowerCase().trim();
    if (!slug) return null;

    let { data: tenant } = await sb
      .from('boutique_tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!tenant) {
      const createRes = await syncTenantToStorefrontDb(
        typeof slugOrStorefront === 'object' ? slugOrStorefront : { slug, store_name: slug }
      );
      tenant = createRes?.data;
    }

    if (!tenant?.id) return null;

    const productId = String(productData.productId || productData.id);
    const retailPrice = Number(productData.customerPrice || productData.retailPrice || productData.basePrice || 0);
    const basePrice = Number(productData.basePrice || 0);

    const imagesList = Array.isArray(productData.images) && productData.images.length > 0
      ? productData.images
      : (productData.image ? [productData.image] : []);

    const productPayload = {
      tenant_id: tenant.id,
      original_product_id: productId,
      sku: productData.variantCode || productData.sku || null,
      title: productData.title || 'Handloom Banarasi Saree',
      description: productData.description || null,
      images: imagesList,
      category: productData.category || 'Saree',
      fabric: productData.fabric || 'Pure Silk',
      weave: productData.weave || 'Handloom',
      base_price: basePrice,
      retail_price: retailPrice,
      is_published: true,
    };

    const { data: existingProd } = await sb
      .from('boutique_products')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('original_product_id', productId)
      .maybeSingle();

    if (existingProd?.id) {
      return await sb
        .from('boutique_products')
        .update(productPayload)
        .eq('id', existingProd.id)
        .select()
        .single();
    } else {
      return await sb
        .from('boutique_products')
        .insert(productPayload)
        .select()
        .single();
    }
  } catch (err) {
    console.error('[boutiqueSync] Product sync error:', err);
    return { error: err };
  }
}
