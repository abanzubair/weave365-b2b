import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

// Reference the global uploads map initialized in the upload route or initialize it here
globalThis.__localUploads = globalThis.__localUploads || new Map();

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

    let context = null;
    try {
      context = getRequestContext();
    } catch (e) {
      // getRequestContext not available
    }

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
      // ⚙️ Local development fallback
      // Check in-memory uploads first
      const localFile = globalThis.__localUploads.get(key);
      if (localFile) {
        const headers = new Headers();
        headers.set('Content-Type', localFile.type || contentType);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(localFile.buffer, { headers });
      }

      // Fallback to fetch from public URL if it is a remote image URL
      if (decodedImageUrl && /^https?:\/\//i.test(decodedImageUrl)) {
        const isAllowedDomain = 
          decodedImageUrl.includes('weave365.in') || 
          decodedImageUrl.includes('weave365.com') || 
          decodedImageUrl.includes('r2.cloudflarestorage.com');
        
        if (isAllowedDomain) {
          try {
            const fetchResponse = await fetch(decodedImageUrl);
            if (fetchResponse.ok) {
              const buffer = await fetchResponse.arrayBuffer();
              const headers = new Headers();
              headers.set('Content-Type', contentType);
              headers.set('Cache-Control', 'public, max-age=31536000, immutable');
              headers.set('Access-Control-Allow-Origin', '*');
              return new Response(buffer, { headers });
            }
          } catch (fetchErr) {
            console.error('[Image Proxy Route Fetch Error]:', fetchErr);
          }
        }
        return Response.redirect(decodedImageUrl, 302);
      }

      // Fallback: If we only have key, we can try fetching from the default public bucket endpoint
      const baseUrl = process.env.NEXT_PUBLIC_R2_URL || 'https://assets.weave365.com';
      const cdnUrl = `${baseUrl.replace(/\/$/, '')}/${key}`;
      try {
        const fetchResponse = await fetch(cdnUrl);
        if (fetchResponse.ok) {
          const buffer = await fetchResponse.arrayBuffer();
          const headers = new Headers();
          headers.set('Content-Type', contentType);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('Access-Control-Allow-Origin', '*');
          return new Response(buffer, { headers });
        }
      } catch (err) {
        console.error('[Image Proxy Route Fallback Fetch Error]:', err);
      }

      return new Response('Image not found', { status: 404 });
    }
  } catch (err) {
    console.error('[Image Proxy API Route Error]:', err);
    return new Response(`Error loading image: ${err.message}`, { status: 500 });
  }
}
