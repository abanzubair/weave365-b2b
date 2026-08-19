import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Reference the global uploads map initialized in the upload route or initialize it here
globalThis.__localUploads = globalThis.__localUploads || new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const imageKey = searchParams.get('key');

    if (!imageUrl && !imageKey) {
      return new Response('Missing image key or url parameter', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    let key = '';
    let decodedImageUrl = '';

    if (imageKey) {
      key = imageKey;
    } else if (imageUrl) {
      decodedImageUrl = decodeURIComponent(imageUrl).trim();

      // Extract key if it's an R2 / weave365 URL
      if (decodedImageUrl.includes('weave365.in/')) {
        key = decodedImageUrl.split('weave365.in/')[1];
      } else if (decodedImageUrl.includes('weave365.com/')) {
        key = decodedImageUrl.split('weave365.com/')[1];
      } else if (decodedImageUrl.includes('r2.cloudflarestorage.com/')) {
        const parts = decodedImageUrl.split('.r2.cloudflarestorage.com/');
        if (parts[1]) {
          const pathParts = parts[1].split('/');
          const bucketName = process.env.R2_BUCKET_NAME || 'weave365images';
          if (pathParts[0] === bucketName) {
            pathParts.shift();
          }
          key = pathParts.join('/');
        }
      } else if (!decodedImageUrl.startsWith('http')) {
        key = decodedImageUrl;
      }
    }

    // Clean up key
    key = String(key || '').trim().replace(/^\//, '');

    // Detect Content-Type from extension
    const ext = (key || decodedImageUrl).split('?')[0].split('.').pop()?.toLowerCase() || '';
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';

    let context = null;
    try {
      context = getRequestContext();
    } catch (e) {
      // getRequestContext not available in local dev
    }

    // 1. Try Native R2 binding if key exists and R2 binding is active
    if (key && context?.env?.R2_BUCKET) {
      try {
        const object = await context.env.R2_BUCKET.get(key);
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('Content-Type', contentType);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('Access-Control-Allow-Origin', '*');
          return new Response(object.body, { headers });
        }
      } catch (r2Err) {
        console.warn('[Image Proxy R2 Error]:', r2Err);
      }
    }

    // 2. Check local in-memory uploads if key exists
    if (key) {
      const localFile = globalThis.__localUploads.get(key);
      if (localFile) {
        const headers = new Headers();
        headers.set('Content-Type', localFile.type || contentType);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(localFile.buffer, { headers });
      }
    }

    // 3. Proxy remote HTTP/HTTPS images (Google Drive thumbnails, Cloudinary, Supabase, R2 CDN, etc.)
    if (decodedImageUrl && /^https?:\/\//i.test(decodedImageUrl)) {
      try {
        const fetchResponse = await fetch(decodedImageUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
          redirect: 'follow',
        });

        if (fetchResponse.ok) {
          const buffer = await fetchResponse.arrayBuffer();
          const remoteContentType = fetchResponse.headers.get('content-type') || contentType;
          const headers = new Headers();
          headers.set('Content-Type', remoteContentType);
          headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          headers.set('Access-Control-Allow-Origin', '*');
          return new Response(buffer, { headers });
        }
      } catch (fetchErr) {
        console.error('[Image Proxy Remote Fetch Error]:', fetchErr);
      }
    }

    // 4. Fallback: If we only have key, fetch from the default public bucket endpoint
    if (key) {
      const baseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://assets.weave365.com';
      const cdnUrl = `${baseUrl.replace(/\/$/, '')}/${key}`;
      try {
        const fetchResponse = await fetch(cdnUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
          redirect: 'follow',
        });
        if (fetchResponse.ok) {
          const buffer = await fetchResponse.arrayBuffer();
          const remoteContentType = fetchResponse.headers.get('content-type') || contentType;
          const headers = new Headers();
          headers.set('Content-Type', remoteContentType);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('Access-Control-Allow-Origin', '*');
          return new Response(buffer, { headers });
        }
      } catch (err) {
        console.error('[Image Proxy Fallback Fetch Error]:', err);
      }
    }

    return new Response('Image not found', {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[Image Proxy API Route Error]:', err);
    return new Response(`Error loading image: ${err.message}`, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}
