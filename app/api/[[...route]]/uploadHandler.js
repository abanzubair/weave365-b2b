import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Global in-memory cache for local development upload testing without S3 credentials or R2 bindings
globalThis.__localUploads = globalThis.__localUploads || new Map();

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

    // Sanitize and create an SEO-friendly, clean filename
    const timestamp = Date.now();
    const cleanFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-');
    const key = `vendor-uploads/${timestamp}-${cleanFileName}`;

    let isBindingUsed = false;
    let context = null;

    // Check if Cloudflare native bindings are available
    try {
      context = getRequestContext();
    } catch (e) {
      console.warn('[Upload Route] getRequestContext() not available, using in-memory mock upload.');
    }

    if (context && context.env && context.env.R2_BUCKET) {
      // 🚀 Native R2 binding upload (Cloudflare Pages environment)
      await context.env.R2_BUCKET.put(key, buffer, {
        httpMetadata: {
          contentType: file.type || 'image/jpeg',
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });
      isBindingUsed = true;
    } else {
      // ⚙️ Local development in-memory storage fallback
      globalThis.__localUploads.set(key, {
        buffer: new Uint8Array(buffer),
        type: file.type || 'image/jpeg'
      });
    }

    // Build the public custom domain CDN URL
    const baseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://assets.weave365.com';
    const publicUrl = isBindingUsed 
      ? `${baseUrl.replace(/\/$/, '')}/${key}`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/image?key=${key}`;

    return Response.json({
      status: 'success',
      url: publicUrl,
      key,
      via: isBindingUsed ? 'r2-binding' : 'local-in-memory',
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