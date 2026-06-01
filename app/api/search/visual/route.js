import { createClient } from '@supabase/supabase-js';
import {
  createVisualEmbeddingFromImage,
  imageBufferToDataUrl,
  VISUAL_EMBEDDING_DIMENSIONS,
} from '../../_lib/visualEmbeddings.js';

export const runtime = 'edge';

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase URL or Service Role Key missing in backend environment');
  }

  return createClient(url, serviceKey);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || typeof file === 'string') {
      return Response.json(
        { status: 'error', error: 'No image file provided in the visual search request' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const imageDataUrl = imageBufferToDataUrl(buffer, file.type || 'image/webp');
    const { embedding: queryEmbedding, via } = await createVisualEmbeddingFromImage(imageDataUrl);

    if (!queryEmbedding || queryEmbedding.length !== VISUAL_EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Failed to generate ${VISUAL_EMBEDDING_DIMENSIONS}-dimension visual embedding vector. Obtained size: ${queryEmbedding?.length || 0}`
      );
    }

    const supabaseAdmin = getAdminSupabase();
    const { data: matches, error: dbError } = await supabaseAdmin.rpc('match_saree_images', {
      query_embedding: queryEmbedding,
      match_threshold: 0.65,
      match_count: 12,
    });

    if (dbError) throw dbError;

    return Response.json({
      status: 'success',
      matches: matches || [],
      count: matches?.length || 0,
      via,
    });
  } catch (err) {
    console.error('[Visual Search Route Error]:', err);
    return Response.json(
      {
        status: 'error',
        error: err.message || 'An error occurred during visual matching.',
      },
      { status: 500 }
    );
  }
}
