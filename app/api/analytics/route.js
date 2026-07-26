/**
 * @file API route for lightweight Edge Traffic & AI Referral Analytics.
 * Runs on Edge runtime to extract Cloudflare Geolocation headers (cf-ipcountry, cf-ipcity),
 * parses AI Referrals (ChatGPT, Gemini, Claude, Perplexity, Copilot, DeepSeek),
 * social media networks, and device metrics with zero-overhead async logging.
 */

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      return {
        from: () => ({
          insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          select: () => ({ order: () => Promise.resolve({ data: [], error: null }) })
        })
      };
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

/**
 * Classifies traffic source into Category & Friendly Name
 * Supports AI Assistants (ChatGPT, Gemini, Claude, Perplexity, Copilot, DeepSeek, Poe, Mistral),
 * Social Media (Instagram, Facebook, YouTube, WhatsApp, X/Twitter, LinkedIn, Pinterest),
 * Search Engines (Google, Bing, DuckDuckGo, Yahoo), and Direct Traffic.
 */
function classifyTrafficSource(referrer) {
  if (!referrer || typeof referrer !== 'string') {
    return { category: 'Direct / App', name: 'Direct Visit' };
  }

  const ref = referrer.toLowerCase().trim();

  // 1. AI Assistants
  if (ref.includes('chatgpt.com') || ref.includes('chat.openai.com') || ref.includes('openai.com')) {
    return { category: 'AI Assistant', name: 'ChatGPT' };
  }
  if (ref.includes('gemini.google.com') || ref.includes('bard.google.com')) {
    return { category: 'AI Assistant', name: 'Google Gemini' };
  }
  if (ref.includes('claude.ai') || ref.includes('anthropic.com')) {
    return { category: 'AI Assistant', name: 'Claude AI' };
  }
  if (ref.includes('perplexity.ai')) {
    return { category: 'AI Assistant', name: 'Perplexity AI' };
  }
  if (ref.includes('copilot.microsoft.com') || ref.includes('bing.com/chat')) {
    return { category: 'AI Assistant', name: 'Microsoft Copilot' };
  }
  if (ref.includes('deepseek.com')) {
    return { category: 'AI Assistant', name: 'DeepSeek' };
  }
  if (ref.includes('poe.com')) {
    return { category: 'AI Assistant', name: 'Poe AI' };
  }
  if (ref.includes('mistral.ai')) {
    return { category: 'AI Assistant', name: 'Mistral AI' };
  }
  if (ref.includes('phind.com')) {
    return { category: 'AI Assistant', name: 'Phind AI' };
  }

  // 2. Social Media
  if (ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
    return { category: 'Social Media', name: 'Instagram' };
  }
  if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('l.facebook.com')) {
    return { category: 'Social Media', name: 'Facebook' };
  }
  if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
    return { category: 'Social Media', name: 'YouTube' };
  }
  if (ref.includes('t.co') || ref.includes('twitter.com') || ref.includes('x.com')) {
    return { category: 'Social Media', name: 'X (Twitter)' };
  }
  if (ref.includes('whatsapp.com') || ref.includes('api.whatsapp.com') || ref.includes('web.whatsapp.com')) {
    return { category: 'Social Media', name: 'WhatsApp' };
  }
  if (ref.includes('linkedin.com')) {
    return { category: 'Social Media', name: 'LinkedIn' };
  }
  if (ref.includes('pinterest.com')) {
    return { category: 'Social Media', name: 'Pinterest' };
  }

  // 3. Search Engines
  if (ref.includes('google.com') || ref.includes('google.co.in')) {
    return { category: 'Search Engine', name: 'Google Search' };
  }
  if (ref.includes('bing.com')) {
    return { category: 'Search Engine', name: 'Bing Search' };
  }
  if (ref.includes('duckduckgo.com')) {
    return { category: 'Search Engine', name: 'DuckDuckGo' };
  }
  if (ref.includes('yahoo.com')) {
    return { category: 'Search Engine', name: 'Yahoo' };
  }

  // 4. Other Web Referrals
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return { category: 'Referral Website', name: host };
  } catch (e) {
    return { category: 'Referral Website', name: 'External Site' };
  }
}

/**
 * Parses user-agent header into Device Type, OS, and Browser
 */
function parseDeviceDetails(userAgent) {
  let deviceType = 'Desktop';
  let deviceOs = 'Unknown';
  let browser = 'Browser';

  if (!userAgent || typeof userAgent !== 'string') {
    return { deviceType, deviceOs, browser };
  }

  const ua = userAgent;

  // OS & Device Type
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
    const { path, referrer, userAgent, sessionId } = body || {};

    // 1. Extract Cloudflare Edge Geolocation HTTP Headers
    const country = (request.headers.get('cf-ipcountry') || 'IN').toUpperCase();
    const rawCity = request.headers.get('cf-ipcity');
    const region = request.headers.get('cf-region');
    const city = rawCity ? decodeURIComponent(rawCity) : (region ? decodeURIComponent(region) : 'India');

    // 2. Classify Referrer & Device Specs securely
    const trafficSource = classifyTrafficSource(referrer);
    const deviceSpecs = parseDeviceDetails(userAgent || request.headers.get('user-agent'));

    // 3. Security Sanitize strings to avoid excessive length / spam
    const safePath = (path || '/').slice(0, 200);
    const safeReferrer = (referrer || '').slice(0, 500);

    const supabase = getSupabase();

    // 4. Insert into Supabase (Edge runtime optimized)
    const { error } = await supabase
      .from('site_analytics')
      .insert({
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
      });

    if (error) {
      console.error('[Analytics API] Supabase insert error:', error.message);
      return Response.json({ status: 'error', error: error.message }, { status: 500 });
    }

    return Response.json({ status: 'success' }, { status: 200 });
  } catch (err) {
    console.error('[Analytics API] Exception:', err);
    return Response.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
