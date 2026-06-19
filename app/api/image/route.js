import { getRequestContext } from '@cloudflare/next-on-pages';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'edge';

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const imageKey = searchParams.get('key');

    let key = '';
    let decodedImageUrl = '';
    if (imageKey) {
      key = imageKey;
    } else if (imageUrl) {
      // Decode and parse the URL to extract the R2 key
      const decodedUrl = decodeURIComponent(imageUrl);
      decodedImageUrl = decodedUrl;
      
      if (decodedUrl.includes('weave365.in/')) {
        key = decodedUrl.split('weave365.in/')[1];
      } else if (decodedUrl.includes('weave365.com/')) {
        key = decodedUrl.split('weave365.com/')[1];
      } else if (decodedUrl.includes('r2.cloudflarestorage.com/')) {
        // e.g. https://19495a554f7e8aee993d4f48a274a030.r2.cloudflarestorage.com/weave365images/Saree/102001/102001.jpg
        const parts = decodedUrl.split('.r2.cloudflarestorage.com/');
        if (parts[1]) {
          const pathParts = parts[1].split('/');
          // Shift out the bucket name if it is present
          const bucketName = process.env.R2_BUCKET_NAME || 'weave365images';
          if (pathParts[0] === bucketName) {
            pathParts.shift();
          }
          key = pathParts.join('/');
        }
      } else {
        // Try to treat as absolute path/key if it doesn't look like a full external URL
        if (!decodedUrl.startsWith('http')) {
          key = decodedUrl;
        }
      }
    }

    // Clean up key
    key = String(key || '').trim().replace(/^\//, '');

    if (!key) {
      return new Response('Missing image key or URL parameter', { status: 400 });
    }

    let context = null;
    try {
      context = getRequestContext();
    } catch (e) {
      console.warn('[Image Proxy Route] getRequestContext() not available, utilizing S3 SDK fallback.');
    }

    // Detect Content-Type from file extension
    const ext = key.split('.').pop()?.toLowerCase() || '';
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';

    if (context && context.env && context.env.R2_BUCKET) {
      // 🚀 Native R2 binding fetch (Cloudflare Pages Production environment)
      const object = await context.env.R2_BUCKET.get(key);
      if (!object) {
        return new Response('Image not found in bucket', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('Content-Type', contentType);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(object.body, { headers });
    } else {
      // ⚙️ S3 client fetch (Local Next.js dev server fallback environment)
      const hasS3Credentials = Boolean(
        process.env.R2_ENDPOINT &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY
      );

      if (!hasS3Credentials && decodedImageUrl && /^https?:\/\//i.test(decodedImageUrl)) {
        return Response.redirect(decodedImageUrl, 302);
      }

      const s3 = getS3Client();
      const bucketName = process.env.R2_BUCKET_NAME || 'weave365images';

      const response = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );

      const bytes = await response.Body.transformToByteArray();
      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(bytes, { headers });
    }
  } catch (err) {
    console.error('[Image Proxy API Route Error]:', err);
    return new Response(`Error loading image: ${err.message}`, { status: 500 });
  }
}
