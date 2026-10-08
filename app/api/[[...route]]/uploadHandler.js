import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Global in-memory cache for local development upload testing without S3 credentials or R2 bindings
globalThis.__localUploads = globalThis.__localUploads || new Map();

/**
 * Direct S3 API PUT to Cloudflare R2 using Web Crypto (SigV4)
 * Enables uploading directly to R2 in local dev or outside Cloudflare Pages bindings.
 */
async function uploadToR2ViaS3(key, buffer, contentType) {
  const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '');
  const bucket = process.env.R2_BUCKET_NAME || 'weave365images';
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  try {
    const url = new URL(`${endpoint}/${bucket}/${key}`);
    const host = url.host;
    const path = url.pathname;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const payloadHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const canonicalReqHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
    const canonicalReqHash = Array.from(new Uint8Array(canonicalReqHashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalReqHash}`;

    async function hmac(keyBytes, data) {
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        typeof data === 'string' ? new TextEncoder().encode(data) : data
      );
      return new Uint8Array(signature);
    }

    const kSecret = new TextEncoder().encode('AWS4' + secretAccessKey);
    const kDate = await hmac(kSecret, dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, 'aws4_request');
    const signatureBytes = await hmac(kSigning, stringToSign);
    const signatureHex = Array.from(signatureBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Host: host,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        Authorization: authHeader,
        'Content-Type': contentType || 'image/jpeg',
      },
      body: buffer,
    });

    if (res.ok) {
      const baseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://assets.weave365.com';
      return `${baseUrl.replace(/\/$/, '')}/${key}`;
    }
  } catch (err) {
    console.warn('[R2 S3 Upload Error]:', err);
  }
  return null;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return Response.json(
        { status: 'error', error: 'No file provided in the upload request' },
        { status: 400 }
      );
    }

    // Security: Validate file size (max 10MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json(
        { status: 'error', error: 'File size exceeds the 10MB limit.' },
        { status: 400 }
      );
    }

    // Security: Validate MIME type
    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif',
      'application/pdf',
    ];
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return Response.json(
        { status: 'error', error: 'Invalid file type. Only JPEG, PNG, WEBP, AVIF, and PDF files are allowed.' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();

    const skuRaw = formData.get('sku') || formData.get('productId') || '';
    const uploaderRaw = formData.get('uploader') || formData.get('reviewerName') || '';
    const indexRaw = formData.get('index') || '';

    // Sanitize and create an organized bucket key: reviews/{sku}/{uploader}-{timestamp}[-{index}].{ext}
    const timestamp = Date.now();
    const cleanSku = String(skuRaw).trim().toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-') || 'general';
    const cleanUploader = String(uploaderRaw).trim().toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-') || 'buyer';
    const cleanFileName = (file.name || 'photo.jpg').toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-');
    const ext = cleanFileName.split('.').pop() || 'jpg';
    const indexSuffix = indexRaw ? `-${indexRaw}` : '';
    
    // Key format: reviews/{sku}/{uploader}-{timestamp}[-{index}].{ext}
    const key = `reviews/${cleanSku}/${cleanUploader}-${timestamp}${indexSuffix}.${ext}`;

    let isBindingUsed = false;
    let context = null;

    // Check if Cloudflare native bindings are available
    try {
      context = getRequestContext();
    } catch (e) {
      // not in Cloudflare Pages worker runtime
    }

    let storageProvider = 'none';
    let publicUrl = '';

    // 1. Try Cloudflare Pages native R2 binding if active
    if (context && context.env && context.env.R2_BUCKET) {
      try {
        await context.env.R2_BUCKET.put(key, buffer, {
          httpMetadata: {
            contentType: file.type || 'image/jpeg',
            cacheControl: 'public, max-age=31536000, immutable',
          },
        });
        const baseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://assets.weave365.com';
        publicUrl = `${baseUrl.replace(/\/$/, '')}/${key}`;
        storageProvider = 'cloudflare-r2-binding';
      } catch (bindErr) {
        console.warn('[Upload Route] Native R2 binding upload failed:', bindErr);
      }
    }

    // 2. Try direct Cloudflare R2 S3 API upload if credentials are provided
    if (!publicUrl && process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
      try {
        const r2Url = await uploadToR2ViaS3(key, buffer, file.type || 'image/jpeg');
        if (r2Url) {
          publicUrl = r2Url;
          storageProvider = 'cloudflare-r2-s3';
        }
      } catch (r2S3Err) {
        console.warn('[Upload Route] Direct R2 S3 upload error:', r2S3Err);
      }
    }

    // 3. Fallback: Local dev in-memory (only when Cloudflare R2 is offline in local dev)
    if (!publicUrl) {
      globalThis.__localUploads.set(key, {
        buffer: new Uint8Array(buffer),
        type: file.type || 'image/jpeg'
      });
      publicUrl = `/api/image?key=${key}`;
      storageProvider = 'local-in-memory';
    }

    return Response.json({
      status: 'success',
      url: publicUrl,
      key,
      via: storageProvider,
    });
  } catch (err) {
    console.error('[Upload API Route Error]:', err);
    return Response.json(
      {
        status: 'error',
        error: err.message || 'An error occurred during file upload.',
      },
      { status: 500 }
    );
  }
}