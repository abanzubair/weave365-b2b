/**
 * @file API route for ultra-lightweight Edge Traffic & AI Referral Analytics.
 * Runs on Edge runtime to extract Cloudflare Geolocation headers (cf-ipcountry, cf-ipcity),
 * parses AI Referrals (ChatGPT, Gemini, Claude, Perplexity, Copilot, DeepSeek),
 * social media networks, and device metrics with zero dependency overhead.
 */

export const runtime = 'edge';

/**
 * Classifies traffic source into Category & Friendly Name
 * Inspects HTTP Referrer, URL Query Params (UTM / ChatGPT tags), Full URL, and UserAgent.
 */
function classifyTrafficSource(referrer, searchParams, fullUrl, rawUserAgent) {
  const ref = (referrer || '').toLowerCase().trim();
  const search = (searchParams || '').toLowerCase().trim();
  const url = (fullUrl || '').toLowerCase().trim();
  const ua = (rawUserAgent || '').toLowerCase().trim();

  const combined = `${ref} ${search} ${url} ${ua}`;

  // 1. AI Assistants (Matches Referrer, URL parameters like ?utm_source=claude, AND User-Agent tags)
  if (combined.includes('chatgpt') || combined.includes('openai') || combined.includes('gptbot')) {
    return { category: 'AI Assistant', name: 'ChatGPT' };
  }
  if (combined.includes('claude') || combined.includes('anthropic') || combined.includes('claudebot')) {
    return { category: 'AI Assistant', name: 'Claude AI' };
  }
  if (combined.includes('gemini') || combined.includes('bard.google') || combined.includes('geminibot')) {
    return { category: 'AI Assistant', name: 'Google Gemini' };
  }
  if (combined.includes('perplexity') || combined.includes('perplexitybot')) {
    return { category: 'AI Assistant', name: 'Perplexity AI' };
  }
  if (combined.includes('copilot') || combined.includes('bing.com/chat') || combined.includes('bingchat')) {
    return { category: 'AI Assistant', name: 'Microsoft Copilot' };
  }
  if (combined.includes('deepseek') || combined.includes('deepseekbot')) {
    return { category: 'AI Assistant', name: 'DeepSeek' };
  }
  if (combined.includes('grok') || combined.includes('x.ai')) {
    return { category: 'AI Assistant', name: 'Grok AI' };
  }
  if (combined.includes('poe.com') || combined.includes('poe')) {
    return { category: 'AI Assistant', name: 'Poe AI' };
  }
  if (combined.includes('mistral') || combined.includes('lechat')) {
    return { category: 'AI Assistant', name: 'Mistral AI' };
  }
  if (combined.includes('phind')) {
    return { category: 'AI Assistant', name: 'Phind AI' };
  }

  // 2. Social Media
  if (combined.includes('instagram') || combined.includes('ig.me')) {
    return { category: 'Social Media', name: 'Instagram' };
  }
  if (combined.includes('facebook') || combined.includes('fb.com')) {
    return { category: 'Social Media', name: 'Facebook' };
  }
  if (combined.includes('youtube') || combined.includes('youtu.be')) {
    return { category: 'Social Media', name: 'YouTube' };
  }
  if (combined.includes('t.co') || combined.includes('twitter') || combined.includes('x.com')) {
    return { category: 'Social Media', name: 'X (Twitter)' };
  }
  if (combined.includes('whatsapp') || combined.includes('wa.me')) {
    return { category: 'Social Media', name: 'WhatsApp' };
  }
  if (combined.includes('linkedin')) {
    return { category: 'Social Media', name: 'LinkedIn' };
  }
  if (combined.includes('pinterest')) {
    return { category: 'Social Media', name: 'Pinterest' };
  }

  // 3. Search Engines
  if (combined.includes('google.com') || combined.includes('google.co.in')) {
    return { category: 'Search Engine', name: 'Google Search' };
  }
  if (combined.includes('bing.com')) {
    return { category: 'Search Engine', name: 'Bing Search' };
  }
  if (combined.includes('duckduckgo')) {
    return { category: 'Search Engine', name: 'DuckDuckGo' };
  }
  if (combined.includes('yahoo')) {
    return { category: 'Search Engine', name: 'Yahoo Search' };
  }

  // 4. Other Website Referrals
  if (ref && ref !== 'null' && ref !== 'undefined') {
    try {
      const urlObj = new URL(referrer);
      const domain = urlObj.hostname.replace(/^www\./, '');
      return { category: 'Referral Website', name: domain };
    } catch (e) {
      return { category: 'Referral Link', name: 'External Link' };
    }
  }

  return { category: 'Direct / App', name: 'Direct Visit' };
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
    const { path, referrer, searchParams, fullUrl, userAgent, sessionId } = body || {};

    // 1. Extract Geolocation from Vercel & Cloudflare Edge Headers / Objects
    const host = (request.headers.get('host') || '').toLowerCase();
    const isLocal = host.includes('localhost') ||
                    host.includes('127.0.0.1') ||
                    host.includes('192.168.') ||
                    host.includes('10.') ||
                    host.includes('172.') ||
                    host.endsWith('.local');

    const vercelCity = request.headers.get('x-vercel-ip-city');
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    const cfCity = request.cf?.city;
    const cfCountry = request.cf?.country;
    const cfHeaderCity = request.headers.get('cf-ipcity');
    const cfHeaderCountry = request.headers.get('cf-ipcountry');
    const cfRegion = request.headers.get('cf-region');

    const country = (vercelCountry || cfCountry || cfHeaderCountry || 'IN').toUpperCase();
    let rawCity = vercelCity || cfCity || cfHeaderCity || cfRegion;
    if (rawCity) {
      try { rawCity = decodeURIComponent(rawCity); } catch (e) {}
    }
    const city = rawCity || (isLocal ? 'Local Dev Network' : 'India');

    // 2. Classify Referrer & Device Specs securely
    const rawUA = userAgent || request.headers.get('user-agent') || '';
    const trafficSource = classifyTrafficSource(referrer, searchParams, fullUrl, rawUA);
    const deviceSpecs = parseDeviceDetails(rawUA);

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
