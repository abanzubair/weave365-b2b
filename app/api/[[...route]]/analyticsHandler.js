/**
 * @file API route for ultra-lightweight Edge Traffic & AI Referral Analytics.
 * Runs on Edge runtime to extract Cloudflare Geolocation headers (cf-ipcountry, cf-ipcity),
 * parses AI Referrals (ChatGPT, Gemini, Claude, Perplexity, Copilot, DeepSeek),
 * social media networks, and device metrics with zero dependency overhead.
 */

import { classifyTraffic } from '../../../src/utils/universalClassifier.js';


/**
 * Parses User-Agent header for Device & Operating System
 */
function parseDeviceDetails(uaString) {
  if (!uaString || typeof uaString !== 'string') {
    return { deviceType: 'Desktop', deviceOs: 'Unknown', browser: 'Unknown' };
  }

  const ua = uaString;
  let deviceType = 'Desktop';
  let deviceOs = 'Unknown';
  let browser = 'Unknown';

  // Device & OS
  if (/iPhone/i.test(ua)) {
    deviceType = 'Mobile';
    deviceOs = 'iOS';
  } else if (/iPad/i.test(ua)) {
    deviceType = 'Tablet';
    deviceOs = 'iOS';
  } else if (/Android/i.test(ua)) {
    deviceType = /Mobile/i.test(ua) ? 'Mobile' : 'Tablet';
    deviceOs = 'Android';
  } else if (/Mobile/i.test(ua)) {
    deviceType = 'Mobile';
    deviceOs = 'Mobile OS';
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    deviceType = 'Desktop';
    deviceOs = 'macOS';
  } else if (/Windows/i.test(ua)) {
    deviceType = 'Desktop';
    deviceOs = 'Windows';
  } else if (/Linux/i.test(ua)) {
    deviceType = 'Desktop';
    deviceOs = 'Linux';
  }

  // Browser Detection
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  return { deviceType, deviceOs, browser };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { path, referrer, searchParams, fullUrl, userAgent, sessionId } = body || {};

    // 0. Bot & Automated Crawler Filtering (Cloudflare Bot Score, Verified Bots, and Scraper User-Agents)
    const rawUA = userAgent || request.headers.get('user-agent') || '';
    const isVerifiedBot = request.cf?.verifiedBot === true;
    const botScore = request.cf?.botManagement?.score ?? parseInt(request.headers.get('cf-bot-score') || '100', 10);
    const BOT_REGEX = /(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|bytespider|semrushbot|ahrefsbot|mj12bot|headlesschrome|phantomjs|lighthouse|screaming frog|spider|crawler|crawl|curl\/|wget\/|python-requests|node-fetch|axios|go-http-client|mediapartners-google)/i;

    if (isVerifiedBot || botScore < 30 || BOT_REGEX.test(rawUA)) {
      return Response.json({ status: 'ignored_bot' }, { status: 200 });
    }

    // 1. Extract Geolocation from Vercel & Cloudflare Edge Headers / Objects
    const host = (request.headers.get('host') || '').toLowerCase();
    const isLocal = host.includes('localhost') ||
                    host.includes('127.0.0.1') ||
                    host.includes('192.168.') ||
                    host.includes('10.') ||
                    host.includes('172.') ||
                    host.endsWith('.local');

    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelRegion = request.headers.get('x-vercel-ip-country-region');
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const cfCity = request.cf?.city;
    const cfRegion = request.cf?.region || request.headers.get('cf-region');
    const cfCountry = request.cf?.country;
    const cfHeaderCity = request.headers.get('cf-ipcity');
    const cfHeaderCountry = request.headers.get('cf-ipcountry');

    const country = (vercelCountry || cfCountry || cfHeaderCountry || 'IN').toUpperCase();
    let rawCity = vercelCity || cfCity || cfHeaderCity;
    let rawRegion = vercelRegion || cfRegion;
    if (rawCity) {
      try { rawCity = decodeURIComponent(rawCity); } catch (e) {}
      if (rawCity === 'undefined' || rawCity === 'null') rawCity = null;
    }
    if (rawRegion) {
      try { rawRegion = decodeURIComponent(rawRegion); } catch (e) {}
      if (rawRegion === 'undefined' || rawRegion === 'null') rawRegion = null;
    }

    let displayCity = rawCity;
    if (rawCity && rawRegion && rawCity.toLowerCase() !== rawRegion.toLowerCase()) {
      displayCity = `${rawCity} (${rawRegion})`;
    } else if (!rawCity && rawRegion) {
      displayCity = rawRegion;
    }
    const city = displayCity || (isLocal ? 'Local Dev Network' : 'India');

    // 2. Classify Referrer & Device Specs securely
    const trafficSource = classifyTraffic({
      referrer,
      searchParams,
      fullUrl,
      userAgent: rawUA,
      path: path || '/'
    });
    const deviceSpecs = parseDeviceDetails(rawUA);

    // Filter out clients with completely unknown signatures
    if (deviceSpecs.deviceOs === 'Unknown' && deviceSpecs.browser === 'Unknown') {
      return Response.json({ status: 'ignored_unknown_client' }, { status: 200 });
    }

    // Drop automated foreign datacenter scrapers without referrer or campaign
    const isForeign = country !== 'IN';
    const hasCampaign = /[?&](utm_|ref|source|via|origin|gclid|fbclid)/i.test(searchParams || '') ||
                        /whatsapp|instagram/i.test(trafficSource.name || '');
    if (isForeign && !(referrer || '') && !hasCampaign && (country === 'SG' || country === 'US')) {
      const DATACENTER_BOT_CITIES = ['prineville', 'dallas', 'ashburn', 'moses lake', 'social circle', 'forest city', 'boydton', 'council bluffs', 'singapore', 'richmond', 'oklahoma city', 'phoenix'];
      if (DATACENTER_BOT_CITIES.some(dc => (rawCity || '').toLowerCase().includes(dc))) {
        return Response.json({ status: 'ignored_datacenter_crawler' }, { status: 200 });
      }
    }

    // 3. Security Sanitize strings
    const safePath = (path || '/').slice(0, 200);
    const safeReferrer = (referrer || '').slice(0, 500);

    // Ignore admin panel paths (/admin)
    if (safePath.toLowerCase().startsWith('/admin') || safePath.toLowerCase().includes('/admin')) {
      return Response.json({ status: 'ignored_admin_path' }, { status: 200 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Direct REST API fetch to Supabase (Zero dependency bundle overhead for Edge worker)
      const res = await fetch(`${supabaseUrl}/rest/v1/site_analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          session_id: (sessionId || '').slice(0, 100) || null,
          path: safePath,
          referrer: safeReferrer || null,
          source_category: trafficSource.category,
          source_name: trafficSource.name,
          device_type: deviceSpecs.deviceType,
          device_os: deviceSpecs.deviceOs,
          browser: deviceSpecs.browser,
          country: country.slice(0, 10),
          city: city.slice(0, 100),
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[Analytics API] Supabase REST error:', res.status, errText);
      }
    }

    return Response.json({ status: 'success' }, { status: 200 });
  } catch (err) {
    return Response.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
