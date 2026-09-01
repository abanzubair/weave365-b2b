/**
 * @file Single Catch-All Edge API Router for Cloudflare Pages
 * Consolidates all API endpoints into a single Edge Function bundle
 * to comply with Cloudflare Pages Worker 3 MiB size limit.
 */

export const runtime = 'edge';

// Import handler logic
import { POST as contactPost } from './contactHandler.js';
import { POST as analyticsPost } from './analyticsHandler.js';
import { GET as imageGet } from './imageHandler.js';
import { POST as inquiryNotificationPost } from './inquiryNotificationHandler.js';
import { POST as uploadPost } from './uploadHandler.js';
import { GET as storefrontGet, POST as storefrontPost } from './storefrontHandler.js';
import { GET as googleShoppingGet } from './googleShoppingHandler.js';
import { GET as vendorRegistrationGet, POST as vendorRegistrationPost } from './vendorRegistrationHandler.js';
import { POST as adminSyncPost } from './adminSyncHandler.js';
import { POST as checkEmailPost } from './checkEmailHandler.js';
import { generateSitemapXml } from './sitemapHandler.js';
import { GET as catalogGet } from './catalogHandler.js';
import { handleDeveloperApiGet, handleDeveloperApiPost } from './developerApiHandler.js';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const routeArray = resolvedParams?.route || [];
  const routeKey = routeArray.join('/');

  if (routeArray[0] === 'v1' || routeArray[0] === 'developer') {
    return handleDeveloperApiGet(request, routeArray);
  }

  if (routeKey === 'sitemap.xml' || routeKey === 'sitemap') return generateSitemapXml(request);
  if (routeKey === 'catalog') return catalogGet(request);
  if (routeKey === 'image') return imageGet(request);
  if (routeKey === 'storefront') return storefrontGet(request);
  if (routeKey === 'feed/google-shopping') return googleShoppingGet(request);
  if (routeKey === 'vendor-registration') return vendorRegistrationGet(request);

  return Response.json({ error: `GET /api/${routeKey} Not Found` }, { status: 404 });
}

export async function POST(request, { params }) {
  const resolvedParams = await params;
  const routeArray = resolvedParams?.route || [];
  const routeKey = routeArray.join('/');

  if (routeArray[0] === 'v1' || routeArray[0] === 'developer') {
    return handleDeveloperApiPost(request, routeArray);
  }

  if (routeKey === 'contact') return contactPost(request);
  if (routeKey === 'analytics') return analyticsPost(request);
  if (routeKey === 'inquiry-notification') return inquiryNotificationPost(request);
  if (routeKey === 'upload') return uploadPost(request);
  if (routeKey === 'storefront') return storefrontPost(request);
  if (routeKey === 'vendor-registration') return vendorRegistrationPost(request);
  if (routeKey === 'admin/sync') return adminSyncPost(request);
  if (routeKey === 'check-email' || routeKey === 'auth/check-email') return checkEmailPost(request);
  return Response.json({ error: `POST /api/${routeKey} Not Found` }, { status: 404 });
}

const ALLOWED_ADMIN_ORIGINS = [
  'https://www.weave365.com',
  'https://weave365.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export async function OPTIONS(request, { params }) {
  const resolvedParams = await params;
  const routeArray = resolvedParams?.route || [];
  const routeKey = routeArray.join('/');

  // If route is under admin, restrict CORS to allowed origins
  if (routeArray[0] === 'admin' || routeKey.startsWith('admin/')) {
    const origin = request?.headers?.get('origin');
    const isAllowed = origin && (ALLOWED_ADMIN_ORIGINS.includes(origin) || origin.endsWith('.weave365.com'));
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : 'https://www.weave365.com',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Vary': 'Origin',
      },
    });
  }

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}
