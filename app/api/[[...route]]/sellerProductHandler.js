/**
 * @file Edge API handler for Seller Product Uploads and Admin Moderation.
 * Handles:
 * - POST /api/seller/products : Upload a new single-design product with multi-color Cloudflare images
 * - GET  /api/seller/products : Retrieve products by seller_code or status
 * - PATCH /api/admin/seller-products : Admin approval/rejection of uploaded products
 */

export const runtime = 'edge';

let supabaseInstance = null;
async function getSupabase() {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Validates predefined SKU format: [Category 1][Vendor 2][Design 3]
 * Must be exactly 6 digits starting with 1-4.
 */
function isValidSku(sku) {
  if (!sku || typeof sku !== 'string') return false;
  return /^[1-4][0-9]{2}[0-9]{3}$/.test(sku.trim());
}

/**
 * POST /api/seller/products
 */
export async function handleSellerProductPost(request) {
  try {
    const body = await request.json();
    const {
      seller_id,
      seller_code,
      seller_name,
      sku,
      category,
      category_code,
      design_code,
      title,
      fabric,
      fabric_top,
      fabric_bottom,
      fabric_dupatta,
      work,
      pattern,
      weave,
      purity,
      type,
      colors,
      images,
      cover_image,
      wholesale_price,
    } = body || {};

    // 1. Validate seller code is present
    const cleanSellerCode = String(seller_code || '').trim().toUpperCase();
    if (!cleanSellerCode) {
      return Response.json(
        { error: 'Seller Code is required. Please wait until admin assigns your Seller Code.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. Validate SKU format
    const cleanSku = String(sku || '').trim();
    if (!isValidSku(cleanSku)) {
      return Response.json(
        { error: `Invalid SKU '${cleanSku}'. SKU must strictly follow the predefined 6-digit format: [Category][Vendor][Design]` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Validate mandatory attributes
    if (!category || !fabric || !work || !pattern || !weave || !purity || !type) {
      return Response.json(
        { error: 'Missing required product attributes (Category, Fabric, Work, Pattern, Weave, Purity, Type).' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Validate Suit-specific fields if category is Suit
    const isSuit = String(category).toLowerCase() === 'suit';
    if (isSuit && (!fabric_top || !fabric_bottom || !fabric_dupatta)) {
      return Response.json(
        { error: 'Suit products require Top Fabric, Bottom Fabric, and Dupatta Fabric to be specified.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Validate at least one color/image
    const colorsList = Array.isArray(colors) ? colors : [];
    const imagesList = Array.isArray(images) ? images : [];
    if (colorsList.length === 0 || imagesList.length === 0) {
      return Response.json(
        { error: 'At least one color variation with an image uploaded to Cloudflare is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await getSupabase();
    if (!supabase) {
      return Response.json(
        { error: 'Database service is currently unconfigured.' },
        { status: 503, headers: corsHeaders }
      );
    }

    // 6. Insert new product record into seller_products (status: 'submitted' by default)
    const newProduct = {
      seller_id: seller_id || null,
      seller_code: cleanSellerCode,
      seller_name: seller_name || '',
      sku: cleanSku,
      category,
      category_code: String(category_code || cleanSku[0] || '1'),
      design_code: String(design_code || cleanSku.slice(3) || '001'),
      title: title || `${fabric} ${work} ${category}`,
      fabric,
      fabric_top: isSuit ? fabric_top : null,
      fabric_bottom: isSuit ? fabric_bottom : null,
      fabric_dupatta: isSuit ? fabric_dupatta : null,
      work,
      pattern,
      weave,
      purity,
      type,
      colors: colorsList,
      images: imagesList,
      cover_image: cover_image || imagesList[0] || '',
      wholesale_price: wholesale_price ? Number(wholesale_price) : null,
      status: 'submitted', // strictly requires admin approval to go live
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('seller_products')
      .insert([newProduct])
      .select()
      .single();

    if (error) {
      console.error('[sellerProductHandler POST] Insert error:', error);
      return Response.json(
        { error: error.message || 'Failed to save product in database.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return Response.json(
      {
        status: 'success',
        message: 'Product design uploaded successfully and submitted for admin review.',
        product: data,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[sellerProductHandler POST] Exception:', err);
    return Response.json(
      { error: err.message || 'Internal server error while processing upload.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/seller/products
 */
export async function handleSellerProductGet(request) {
  try {
    const url = new URL(request.url);
    const sellerCode = url.searchParams.get('seller_code');
    const status = url.searchParams.get('status'); // 'all', 'submitted', 'approved', 'rejected'
    const sku = url.searchParams.get('sku');
    const category = url.searchParams.get('category');

    const supabase = await getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database unconfigured' }, { status: 503, headers: corsHeaders });
    }

    let query = supabase.from('seller_products').select('*').order('created_at', { ascending: false });

    if (sellerCode && sellerCode !== 'all') {
      query = query.ilike('seller_code', sellerCode.trim());
    }

    if (status && status !== 'all') {
      query = query.eq('status', status.trim());
    }

    if (sku) {
      query = query.eq('sku', sku.trim());
    }

    if (category && category !== 'all') {
      query = query.ilike('category', category.trim());
    }

    const { data, error } = await query;
    if (error) {
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json({ status: 'success', products: data || [] }, { status: 200, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

/**
 * PATCH /api/admin/seller-products
 * Updates status ('approved', 'rejected', 'submitted') and optional admin notes.
 */
export async function handleAdminSellerProductPatch(request) {
  try {
    const body = await request.json();
    const { id, status, admin_notes } = body || {};

    if (!id || !status) {
      return Response.json(
        { error: 'Product id and target status are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validStatuses = ['submitted', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return Response.json(
        { error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database unconfigured' }, { status: 503, headers: corsHeaders });
    }

    const updatePayload = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (admin_notes !== undefined) {
      updatePayload.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('seller_products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[AdminSellerProductPatch] Update error:', error);
      return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    }

    return Response.json(
      {
        status: 'success',
        message: `Product ${data.sku} marked as ${status}.`,
        product: data,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('[AdminSellerProductPatch] Exception:', err);
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
