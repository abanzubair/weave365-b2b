export const VISUAL_EMBEDDING_DIMENSIONS = 768;

const REPLICATE_MODEL = 'openai/clip';
const REPLICATE_MODEL_URL = 'https://api.replicate.com/v1/models/openai/clip/predictions';

function getReplicateToken() {
  return process.env.REPLICATE_API_TOKEN || '';
}

function assertEmbedding(output) {
  const embedding = output?.embedding || output?.image_embedding || output;

  if (!Array.isArray(embedding)) {
    throw new Error('Replicate CLIP did not return an embedding array.');
  }

  if (embedding.length !== VISUAL_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Replicate CLIP returned ${embedding.length} dimensions; expected ${VISUAL_EMBEDDING_DIMENSIONS}.`
    );
  }

  return embedding;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export function imageBufferToDataUrl(buffer, contentType = 'image/webp') {
  return `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
}

export async function createVisualEmbeddingFromImage(image) {
  const token = getReplicateToken();

  if (!token) {
    throw new Error('REPLICATE_API_TOKEN is missing. Add it to .env and Cloudflare Pages secrets.');
  }

  const response = await fetch(REPLICATE_MODEL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=30',
    },
    body: JSON.stringify({
      input: { image },
    }),
    signal: AbortSignal.timeout(35000),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body?.detail || body?.error || response.statusText;
    throw new Error(`Replicate ${REPLICATE_MODEL} request failed: ${detail}`);
  }

  if (body?.status === 'failed' || body?.error) {
    throw new Error(`Replicate ${REPLICATE_MODEL} prediction failed: ${body.error || 'unknown error'}`);
  }

  if (body?.status && body.status !== 'succeeded') {
    throw new Error(`Replicate ${REPLICATE_MODEL} prediction did not finish in time. Status: ${body.status}`);
  }

  return {
    embedding: assertEmbedding(body?.output),
    via: 'replicate-openai-clip',
  };
}
