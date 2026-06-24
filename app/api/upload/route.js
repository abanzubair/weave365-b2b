import { getRequestContext } from '@cloudflare/next-on-pages';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'edge';

// S3-compatible client fallback for local development or non-Cloudflare edge runtimes
let s3ClientInstance = null;
function getS3Client() {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return s3ClientInstance;
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
      console.warn('[Upload Route] getRequestContext() not available, utilizing S3 SDK fallback.');
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
      // ⚙️ S3 client upload (Local Next.js dev server environment)
      const s3 = getS3Client();
      const bucketName = process.env.R2_BUCKET_NAME || 'weave365-assets';

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: new Uint8Array(buffer),
          ContentType: file.type || 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
    }

    // Build the public custom domain CDN URL
    const baseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://weave365.in';
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/${key}`;

    return Response.json({
      status: 'success',
      url: publicUrl,
      key,
      via: isBindingUsed ? 'r2-binding' : 's3-fallback',
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