/**
 * @file API route for ultra-lightweight Edge Traffic & AI Referral Analytics.
 * Runs on Edge runtime to extract Cloudflare Geolocation headers (cf-ipcountry, cf-ipcity),
 * parses AI Referrals (ChatGPT, Gemini, Claude, Perplexity, Copilot, DeepSeek),
 * social media networks, and device metrics with zero dependency overhead.
 */

export const runtime = 'edge';

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
    return { category: 'Search Engine', name: 'Yahoo Search' };
  }

  // 4. Other Website Referrals
  try {
    const urlObj = new URL(referrer);
    const domain = urlObj.hostname.replace(/^www\./, '');
    return { category: 'Referral Website', name: domain };
  } catch (e) {
    return { category: 'Referral Link', name: 'External Link' };
  }
}

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
    const { path, referrer, userAgent, sessionId } = body || {};

    // 1. Extract Cloudflare Edge Geolocation HTTP Headers
    const host = request.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    const country = (request.headers.get('cf-ipcountry') || 'IN').toUpperCase();
    const rawCity = request.headers.get('cf-ipcity');
    const region = request.headers.get('cf-region');
    const city = rawCity ? decodeURIComponent(rawCity) : (region ? decodeURIComponent(region) : (isLocal ? 'Localhost (Dev)' : 'India'));

    // 2. Classify Referrer & Device Specs securely
    const trafficSource = classifyTrafficSource(referrer);
    const deviceSpecs = parseDeviceDetails(userAgent || request.headers.get('user-agent'));

    // 3. Security Sanitize strings
    const safePath = (path || '/').slice(0, 200);
    const safeReferrer = (referrer || '').slice(0, 500);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Direct REST API fetch to Supabase (Zero dependency bundle overhead for Edge worker)
      void fetch(`${supabaseUrl}/rest/v1/site_analytics`, {
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
      }).catch(() => {});
    }

    return Response.json({ status: 'success' }, { status: 200 });
  } catch (err) {
    return Response.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
