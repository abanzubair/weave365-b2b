import { createClient } from '@supabase/supabase-js';
import { parseProductCsv } from '../../../../src/productData.js';
import {
  createVisualEmbeddingFromImage,
  VISUAL_EMBEDDING_DIMENSIONS,
} from '../../_lib/visualEmbeddings.js';

export const runtime = 'edge';

function getSyncSupabase(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing in the backend environment.');
  }

  if (serviceKey) {
    return createClient(url, serviceKey);
  }

  const authHeader = request.headers.get('authorization');
  if (!anonKey || !authHeader) {
    throw new Error('Visual indexing needs either SUPABASE_SERVICE_ROLE_KEY in the backend environment or an authenticated admin session from the browser.');
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });
}

export async function POST(request) {
  try {
    const supabaseAdmin = getSyncSupabase(request);

    const { data: sheetData, error: sheetError } = await supabaseAdmin
      .from('sheet_data')
      .select('csv_data')
      .eq('id', 'products')
      .single();

    if (sheetError || !sheetData?.csv_data) {
      return Response.json(
        { status: 'error', error: 'No synced product data found in sheet_data table.' },
        { status: 404 }
      );
    }

    const products = parseProductCsv(sheetData.csv_data);
    const uniqueItemsMap = new Map();

    for (const product of products) {
      if (!product.variants) continue;
      for (const variant of product.variants) {
        if (variant.image) {
          const cleanUrl = variant.image.trim();
          uniqueItemsMap.set(cleanUrl, {
            product_group_key: product.groupKey || product.id,
            variant_code: variant.code,
            image_url: cleanUrl,
          });
        }
      }
    }

    const allCatalogItems = Array.from(uniqueItemsMap.values());
    console.log(`[Visual Sync] Found ${allCatalogItems.length} unique variant images in parsed catalog.`);

    const { data: existing, error: dbError } = await supabaseAdmin
      .from('product_image_embeddings')
      .select('image_url');

    if (dbError) throw dbError;

    const indexedUrls = new Set(existing?.map((row) => row.image_url) || []);
    const missingItems = allCatalogItems.filter((item) => !indexedUrls.has(item.image_url));

    console.log(`[Visual Sync] ${indexedUrls.size} images already indexed. ${missingItems.length} images need indexing.`);

    if (missingItems.length === 0) {
      return Response.json({
        status: 'success',
        message: 'All saree variant images are already fully indexed.',
        indexed: 0,
        total: allCatalogItems.length,
      });
    }

    const indexedResults = [];
    const failedResults = [];
    const batchLimit = 15;
    const itemsToProcess = missingItems.slice(0, batchLimit);

    for (const item of itemsToProcess) {
      try {
        const { embedding, via } = await createVisualEmbeddingFromImage(item.image_url);

        if (!embedding || embedding.length !== VISUAL_EMBEDDING_DIMENSIONS) {
          throw new Error(
            `Failed to generate ${VISUAL_EMBEDDING_DIMENSIONS}-dimension visual embedding.`
          );
        }

        const dominantColors = [{ hex: '#E2C275', weight: 1.0 }];
        const { error: upsertError } = await supabaseAdmin
          .from('product_image_embeddings')
          .upsert({
            product_group_key: item.product_group_key,
            variant_code: item.variant_code,
            image_url: item.image_url,
            embedding,
            dominant_colors: dominantColors,
          }, { onConflict: 'image_url' });

        if (upsertError) throw upsertError;

        indexedResults.push({ image_url: item.image_url, via });
      } catch (itemErr) {
        console.error(`[Visual Sync Failed] Item ${item.variant_code}:`, itemErr.message);
        failedResults.push({ code: item.variant_code, image_url: item.image_url, error: itemErr.message });
      }
    }

    return Response.json({
      status: failedResults.length === itemsToProcess.length ? 'error' : 'success',
      message: `Visual indexing completed. Successfully indexed ${indexedResults.length} images in this batch.`,
      indexed: indexedResults.length,
      failed: failedResults.length,
      failures: failedResults,
      remaining: missingItems.length - indexedResults.length,
      total: allCatalogItems.length,
      via: indexedResults[0]?.via || 'replicate-openai-clip',
    }, {
      status: failedResults.length === itemsToProcess.length ? 500 : 200,
    });
  } catch (err) {
    console.error('[Visual Sync Route Error]:', err);
    return Response.json(
      { status: 'error', error: err.message || 'An error occurred during indexing.' },
      { status: 500 }
    );
  }
}
