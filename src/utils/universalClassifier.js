/**
 * @file universalClassifier.js
 * Universal Traffic & AI Referral Intelligence Engine.
 * 
 * Works without hardcoded referrer lists. Autonomously analyzes:
 * 1. Query parameters & UTM/ref/source tags (Tier 1)
 * 2. Universal Domain & TLD heuristics (.ai, .chat, subdomains, brand tokenization) (Tier 2)
 * 3. In-App Browser & Webview User-Agent fingerprinting (Tier 3)
 * 4. Deep-link "Dark Traffic" detection for stripped referrers (Tier 4)
 * 
 * Safe for Edge runtime, Node.js, and client-side browser environments.
 */

// Common generic prefixes to strip when extracting brand name
const STRIP_SUBDOMAINS = /^(www|l|lm|m|mobile|web|link|click|out|gateway|chat|app|api|login|auth|cdn|assets)\./i;

// Known AI root stems and services (used for semantic classification across domains & parameters)
const AI_KEYWORDS = [
  'chatgpt', 'openai', 'gptbot', 'claude', 'anthropic', 'claudebot',
  'gemini', 'bard', 'geminibot', 'perplexity', 'perplexitybot',
  'copilot', 'bingchat', 'deepseek', 'deepseekbot', 'grok', 'x.ai',
  'mistral', 'lechat', 'poe', 'phind', 'qwen', 'cohere', 'metaai',
  'characterai', 'midjourney', 'suno', 'cursor', 'v0.dev', 'bolt.new',
  'lovable.dev', 'kagi', 'you.com'
];

// Major search engines
const SEARCH_KEYWORDS = [
  'google', 'bing', 'duckduckgo', 'yahoo', 'ecosia', 'brave',
  'yandex', 'baidu', 'sogou', 'startpage', 'ask.com'
];

// Major social networks
const SOCIAL_KEYWORDS = [
  'instagram', 'facebook', 'fb.com', 'ig.me', 'whatsapp', 'wa.me',
  'youtube', 'youtu.be', 'tiktok', 'pinterest', 'reddit', 'linkedin',
  't.co', 'twitter', 'x.com', 'threads.net', 'bluesky', 'bsky.app',
  'snapchat', 'quora', 'tumblr', 'wechat'
];

/**
 * Parses a URL safely without throwing
 */
export function safeParseUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  try {
    const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

/**
 * Extracts a clean, human-friendly brand name from a hostname or token
 * E.g. "chat.deepseek.com" -> "DeepSeek"
 * E.g. "gemini.google.com" -> "Google Gemini"
 * E.g. "claude.ai" -> "Claude"
 * E.g. "news.ycombinator.com" -> "Y Combinator"
 */
export function extractBrandFromHost(hostname) {
  if (!hostname || typeof hostname !== 'string') return '';
  const cleanHost = hostname.toLowerCase().trim();

  // Special multi-part brands
  if (cleanHost.includes('gemini.google') || cleanHost.includes('bard.google')) return 'Google Gemini';
  if (cleanHost.includes('copilot.microsoft') || cleanHost.includes('bing.com/chat')) return 'Microsoft Copilot';
  if (cleanHost.includes('chatgpt') || cleanHost.includes('chat.openai')) return 'ChatGPT';
  if (cleanHost.includes('claude.ai') || cleanHost.includes('anthropic.com')) return 'Claude AI';
  if (cleanHost.includes('perplexity.ai')) return 'Perplexity AI';
  if (cleanHost.includes('deepseek.com')) return 'DeepSeek';
  if (cleanHost.includes('instagram.com') || cleanHost.includes('ig.me')) return 'Instagram';
  if (cleanHost.includes('facebook.com') || cleanHost.includes('fb.com')) return 'Facebook';
  if (cleanHost.includes('whatsapp.com') || cleanHost.includes('wa.me')) return 'WhatsApp';
  if (cleanHost.includes('youtube.com') || cleanHost.includes('youtu.be')) return 'YouTube';
  if (cleanHost.includes('t.co') || cleanHost.includes('twitter.com') || cleanHost === 'x.com') return 'X (Twitter)';

  // Remove common subdomains
  let domainPart = cleanHost.replace(STRIP_SUBDOMAINS, '');
  // Extract main second-level name before TLD
  const parts = domainPart.split('.');
  let mainName = parts.length > 1 ? parts[0] : domainPart;

  if (mainName === 'co' || mainName === 'com' || mainName === 'org' || mainName === 'net') {
    mainName = parts.length > 2 ? parts[parts.length - 3] : mainName;
  }

  // Capitalize hyphenated/dotted tokens nicely
  return mainName
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Universal classification of traffic into category, name, and intent.
 * 
 * @param {Object} options
 * @param {string} [options.referrer] - HTTP Referrer or document.referrer
 * @param {string} [options.searchParams] - Query string, e.g. "?ref=claude"
 * @param {string} [options.fullUrl] - Full incoming URL
 * @param {string} [options.userAgent] - Browser User-Agent string
 * @param {string} [options.path] - Landing route path, e.g. "/dropshipping"
 * @returns {Object} Classified attribution object
 */
export function classifyTraffic({
  referrer = '',
  searchParams = '',
  fullUrl = '',
  userAgent = '',
  path = '/'
} = {}) {
  const refObj = safeParseUrl(referrer);
  const refHost = refObj ? refObj.hostname.toLowerCase().replace(/^www\./, '') : '';
  const refPath = refObj ? refObj.pathname.toLowerCase() : '';

  const cleanPath = (path || '/').toLowerCase().trim();
  const search = (searchParams || (safeParseUrl(fullUrl)?.search || '')).toLowerCase().trim();
  const ua = (userAgent || '').toLowerCase().trim();

  // Helper to extract known origin from URL query params
  const extractOriginParam = () => {
    if (!search) return null;
    const urlParams = new URLSearchParams(search);
    const candidateKeys = [
      'utm_source', 'ref', 'source', 'src', 'via', 'origin',
      'from', 'platform', 'partner', 'f'
    ];
    for (const key of candidateKeys) {
      const val = urlParams.get(key);
      if (val && val.trim()) return val.trim().toLowerCase();
    }
    // Check for ad click IDs
    if (urlParams.has('gclid')) return 'google_ads';
    if (urlParams.has('fbclid')) return 'meta_ads';
    if (urlParams.has('msclkid')) return 'bing_ads';
    if (urlParams.has('ttclid')) return 'tiktok_ads';
    return null;
  };

  const originParam = extractOriginParam();

  // ---------------------------------------------------------------------------
  // TIER 1: Explicit Parameter & UTM Ingestion
  // ---------------------------------------------------------------------------
  if (originParam) {
    if (AI_KEYWORDS.some(k => originParam.includes(k))) {
      const brand = extractBrandFromHost(originParam);
      return buildResult({
        category: 'AI Assistant',
        name: brand.includes('AI') ? brand : `${brand} AI`,
        brand,
        type: 'ai',
        sourceParam: originParam,
        refHost,
        cleanPath
      });
    }

    if (SEARCH_KEYWORDS.some(k => originParam.includes(k))) {
      const brand = originParam.includes('google') ? 'Google' : extractBrandFromHost(originParam);
      return buildResult({
        category: 'Search Engine',
        name: `${brand} Search`,
        brand,
        type: 'search',
        sourceParam: originParam,
        refHost,
        cleanPath
      });
    }

    if (SOCIAL_KEYWORDS.some(k => originParam.includes(k))) {
      const brand = extractBrandFromHost(originParam);
      return buildResult({
        category: 'Social Media',
        name: brand,
        brand,
        type: 'social',
        sourceParam: originParam,
        refHost,
        cleanPath
      });
    }

    // Generic campaign parameter
    const brand = extractBrandFromHost(originParam);
    return buildResult({
      category: 'Referral Campaign',
      name: `Campaign: ${brand}`,
      brand,
      type: 'referral',
      sourceParam: originParam,
      refHost,
      cleanPath
    });
  }

  // ---------------------------------------------------------------------------
  // TIER 2: Universal Domain & Hostname Classifier
  // ---------------------------------------------------------------------------
  if (refHost) {
    // 2a. AI Assistant / Agent Domain Heuristics
    const isAiTld = refHost.endsWith('.ai') || refHost.endsWith('.chat') || refHost.endsWith('.bot');
    const isAiSubdomain = /^(ai|chat|copilot|assistant|gemini|claude|agent|llm|gpt)\./i.test(refHost);
    const hasAiKeyword = AI_KEYWORDS.some(k => refHost.includes(k) || refPath.includes(k));

    if ((isAiTld || isAiSubdomain || hasAiKeyword) && !refHost.includes('github') && !refHost.includes('gitlab')) {
      const brand = extractBrandFromHost(refHost);
      const lower = brand.toLowerCase();
      const displayName = lower.includes('ai') || lower.includes('chat') || lower.includes('gemini') || lower.includes('copilot')
        ? brand
        : `${brand} AI`;
      return buildResult({
        category: 'AI Assistant',
        name: displayName,
        brand,
        type: 'ai',
        refHost,
        cleanPath
      });
    }

    // 2b. Search Engine Heuristics
    const hasSearchKeyword = SEARCH_KEYWORDS.some(k => refHost.includes(k));
    const isSearchSubdomain = /^(search|find|query)\./i.test(refHost);
    if (hasSearchKeyword || isSearchSubdomain) {
      const brand = refHost.includes('google') ? 'Google' : extractBrandFromHost(refHost);
      return buildResult({
        category: 'Search Engine',
        name: `${brand} Search`,
        brand,
        type: 'search',
        refHost,
        cleanPath
      });
    }

    // 2c. Social Media Heuristics
    const hasSocialKeyword = SOCIAL_KEYWORDS.some(k => refHost.includes(k));
    if (hasSocialKeyword) {
      const brand = extractBrandFromHost(refHost);
      return buildResult({
        category: 'Social Media',
        name: brand,
        brand,
        type: 'social',
        refHost,
        cleanPath
      });
    }

    // 2d. Universal External Website (Any arbitrary web domain)
    const brand = extractBrandFromHost(refHost);
    return buildResult({
      category: 'Referral Website',
      name: refHost,
      brand: brand || refHost,
      type: 'referral',
      refHost,
      cleanPath
    });
  }

  // ---------------------------------------------------------------------------
  // TIER 3: In-App Browser & Webview Fingerprinting
  // ---------------------------------------------------------------------------
  if (ua) {
    if (ua.includes('instagram')) {
      return buildResult({
        category: 'Social Media',
        name: 'Instagram In-App',
        brand: 'Instagram',
        type: 'social',
        cleanPath,
        isWebview: true
      });
    }
    if (ua.includes('fban') || ua.includes('fbav')) {
      return buildResult({
        category: 'Social Media',
        name: 'Facebook In-App',
        brand: 'Facebook',
        type: 'social',
        cleanPath,
        isWebview: true
      });
    }
    if (ua.includes('whatsapp')) {
      return buildResult({
        category: 'Social Media',
        name: 'WhatsApp In-App',
        brand: 'WhatsApp',
        type: 'social',
        cleanPath,
        isWebview: true
      });
    }
    if (ua.includes('telegram')) {
      return buildResult({
        category: 'Social Media',
        name: 'Telegram In-App',
        brand: 'Telegram',
        type: 'social',
        cleanPath,
        isWebview: true
      });
    }
    // Generic mobile app webview (Android WebView or iOS UIWebView)
    if (ua.includes('wv') || (ua.includes('iphone') && ua.includes('mobile/') && !ua.includes('safari/'))) {
      return buildResult({
        category: 'Direct / App Link',
        name: 'Mobile App Webview',
        brand: 'App Link',
        type: 'direct',
        cleanPath,
        isWebview: true
      });
    }
  }

  // ---------------------------------------------------------------------------
  // TIER 4: Dark Traffic & Deep-Link Direct Arrival
  // ---------------------------------------------------------------------------
  const isDeepRoute = cleanPath !== '/' &&
                      cleanPath !== '' &&
                      !cleanPath.startsWith('/admin') &&
                      cleanPath.length > 1;

  if (isDeepRoute) {
    return buildResult({
      category: 'Direct / App Link',
      name: 'Dark App Link (Referrer Stripped)',
      brand: 'App Link',
      type: 'direct',
      cleanPath,
      isDarkTraffic: true
    });
  }

  // Standard Direct Homepage Visit
  return buildResult({
    category: 'Direct / App',
    name: 'Direct Visit',
    brand: 'Direct',
    type: 'direct',
    cleanPath
  });
}

/**
 * Builds the standardized attribution payload with a humanized intent story
 */
function buildResult({
  category,
  name,
  brand,
  type,
  sourceParam = null,
  refHost = null,
  cleanPath = '/',
  isDarkTraffic = false,
  isWebview = false
}) {
  let inferredIntent = '';

  const pathDescriptor = cleanPath.includes('dropshipping')
    ? 'dropshipping supplier & catalogue'
    : cleanPath.includes('resell')
    ? 'reseller onboarding & pricing'
    : cleanPath.includes('custom-weav')
    ? 'custom weaving production'
    : cleanPath.includes('catalogue') || cleanPath.includes('saree')
    ? 'handloom catalogue collection'
    : cleanPath === '/'
    ? 'homepage explore'
    : `${cleanPath.replace(/[/_-]/g, ' ').trim()}`;

  if (type === 'ai') {
    inferredIntent = `Referred by ${name} inquiring about ${pathDescriptor} · Landed on ${cleanPath}`;
  } else if (type === 'search') {
    inferredIntent = `Found via ${name} searching for ${pathDescriptor} · Landed on ${cleanPath}`;
  } else if (type === 'social') {
    inferredIntent = `Arrived from ${name} post or bio link · Landed on ${cleanPath}`;
  } else if (isDarkTraffic) {
    inferredIntent = `Opened direct link to ${cleanPath} from an external app/chat with stripped referrer`;
  } else if (isWebview) {
    inferredIntent = `Tapped in-app link inside ${name} · Landed on ${cleanPath}`;
  } else if (type === 'referral') {
    inferredIntent = `Referred by ${refHost || brand} · Landed on ${cleanPath}`;
  } else {
    inferredIntent = `Direct visit to ${cleanPath}`;
  }

  return {
    category,
    name,
    brand,
    type,
    source_param: sourceParam,
    referrer_domain: refHost,
    landing_path: cleanPath,
    is_dark_traffic: isDarkTraffic,
    is_webview: isWebview,
    inferred_intent: inferredIntent
  };
}
