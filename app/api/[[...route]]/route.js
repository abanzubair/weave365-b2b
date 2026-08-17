/**
 * @file Single Catch-All Edge API Router for Cloudflare Pages
 * Consolidates all API endpoints into a single Edge Function bundle
 * to comply with Cloudflare Pages Worker 3 MiB size limit.
 */

export const runtime = 'edge';

// Import handler logic
import { POST as contactPost } from './contactHandler.js';
import { POST as analyticsPost } from './analyticsHandler.js';
import { GET as earlyAccessGet, POST as earlyAccessPost } from './earlyAccessHandler.js';
import { GET as imageGet } from './imageHandler.js';
import { POST as inquiryNotificationPost } from './inquiryNotificationHandler.js';
import { POST as uploadPost } from './uploadHandler.js';
import { GET as storefrontGet, POST as storefrontPost } from './storefrontHandler.js';
import { GET as googleShoppingGet } from './googleShoppingHandler.js';
import { GET as vendorRegistrationGet, POST as vendorRegistrationPost } from './vendorRegistrationHandler.js';
import { POST as adminSyncPost } from './adminSyncHandler.js';
import { generateSitemapXml } from './sitemapHandler.js';
import { GET as catalogGet } from './catalogHandler.js';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const routeKey = (resolvedParams?.route || []).join('/');

  if (routeKey === 'sitemap.xml' || routeKey === 'sitemap') return generateSitemapXml(request);
  if (routeKey === 'catalog') return catalogGet(request);
  if (routeKey === 'early-access') return earlyAccessGet(request);
  if (routeKey === 'image') return imageGet(request);
  if (routeKey === 'storefront') return storefrontGet(request);
  if (routeKey === 'feed/google-shopping') return googleShoppingGet(request);
  if (routeKey === 'vendor-registration') return vendorRegistrationGet(request);

  return Response.json({ error: `GET /api/${routeKey} Not Found` }, { status: 404 });
}

export async function POST(request, { params }) {
  const resolvedParams = await params;
  const routeKey = (resolvedParams?.route || []).join('/');

  if (routeKey === 'contact') return contactPost(request);
  if (routeKey === 'analytics') return analyticsPost(request);
  if (routeKey === 'early-access') return earlyAccessPost(request);
  if (routeKey === 'inquiry-notification') return inquiryNotificationPost(request);
  if (routeKey === 'upload') return uploadPost(request);
  if (routeKey === 'storefront') return storefrontPost(request);
  if (routeKey === 'vendor-registration') return vendorRegistrationPost(request);
  if (routeKey === 'admin/sync') return adminSyncPost(request);

  return Response.json({ error: `POST /api/${routeKey} Not Found` }, { status: 404 });
}
