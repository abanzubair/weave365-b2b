/**
 * @file chatHandler.js
 * @description Edge-compatible POST /api/chat handler for the Weave 365 AI Concierge.
 * Handles strict payload & image validation, prompt-injection defense, sliding-window rate limiting,
 * live catalog text/visual grounding, Gemini 3.5 Flash Lite generation, graceful WhatsApp fallbacks,
 * and asynchronous handoff logging to public.chat_handoff_logs.
 */

export const runtime = 'edge';

import {
  QUICK_TAP_REPLIES,
  buildWhatsAppHandoffUrl,
  sanitizePagePath,
} from '../../../src/data/chatbotKnowledgeBase.js';
import {
  GeminiApiError,
  generateChatReply as defaultGenerateChatReply,
} from '../../../src/services/chat/geminiClient.js';
import {
  loadLiveCatalog as defaultLoadLiveCatalog,
  searchCatalogProducts as defaultSearchCatalogProducts,
  semanticTextFallbackSearch as defaultSemanticTextFallbackSearch,
  parseCatalogQueryFilters,
  resolveEffectiveSearchQuery,
  isDescriptiveStyleQuery,
  buildInStockCatalogSummary,
  buildCatalogContextPrompt,
  extractActiveProductSku,
  CHAT_TOOL_DECLARATIONS,
  executeCatalogToolCall as defaultExecuteCatalogToolCall,
  toChatProductCard,
  enforceUploadedPhotoPurityGuard,
  visualSearchCatalog as defaultVisualSearchCatalog,
} from '../../../src/services/chat/catalogGrounding.js';
import {
  checkChatRateLimit as defaultCheckChatRateLimit,
  extractClientIp,
} from '../../../src/services/chat/rateLimiter.js';

export const MAX_MESSAGE_LENGTH = 600;
export const MAX_HISTORY_TURNS = 6;
export const MAX_TOOL_CALL_STEPS = 2;
export const MAX_TOOL_INVOCATIONS = 2;
export const MAX_IMAGE_BYTES = 600 * 1024; // 600 KB
export const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Computes exact decoded byte length for a base64 string without using Node Buffer (Edge-safe).
 * Returns -1 if the string is not valid base64.
 */
export function getDecodedBase64ByteLength(base64Str) {
  if (typeof base64Str !== 'string') return -1;
  const cleaned = base64Str.replace(/\s+/g, '');
  if (!cleaned || cleaned.length % 4 !== 0) return -1;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) return -1;

  let padding = 0;
  if (cleaned.endsWith('==')) padding = 2;
  else if (cleaned.endsWith('=')) padding = 1;

  return Math.floor((cleaned.length * 3) / 4) - padding;
}

/**
 * Validates and normalizes incoming POST /api/chat JSON body.
 * Returns { valid: true, data } or { valid: false, error }.
 */
export function validateChatPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  // Validate message
  const rawMessage = body.message;
  if (rawMessage !== undefined && rawMessage !== null && typeof rawMessage !== 'string') {
    return { valid: false, error: 'message must be a string.' };
  }
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`,
    };
  }

  // Validate optional image
  let validatedImage = null;
  if (body.image !== undefined && body.image !== null) {
    if (typeof body.image !== 'object' || Array.isArray(body.image)) {
      return { valid: false, error: 'image must be an object with mimeType and base64.' };
    }
    const mimeType = String(body.image.mimeType || '').trim().toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      return {
        valid: false,
        error: 'Unsupported image format. Allowed formats: image/jpeg, image/png, image/webp.',
      };
    }

    let base64 = String(body.image.base64 || '').trim();
    const dataUrlPrefix = /^data:image\/[a-z0-9.+-]+;base64,/i;
    if (dataUrlPrefix.test(base64)) {
      base64 = base64.replace(dataUrlPrefix, '');
    }
    base64 = base64.replace(/\s+/g, '');

    const decodedBytes = getDecodedBase64ByteLength(base64);
    if (decodedBytes <= 0) {
      return { valid: false, error: 'Invalid or empty base64 image payload.' };
    }
    if (decodedBytes > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: 'Image size exceeds the 600KB limit. Please upload a smaller image.',
      };
    }

    validatedImage = { mimeType, base64, decodedBytes };
  }

  const quickTapId = typeof body.quickTapId === 'string' ? body.quickTapId.trim() : '';

  if (!message && !validatedImage && !quickTapId) {
    return { valid: false, error: 'Please provide a message or an image.' };
  }

  // Sanitize history (max last 6 turns, strictly user/model)
  const sanitizedHistory = [];
  if (Array.isArray(body.history)) {
    const tail = body.history.slice(-MAX_HISTORY_TURNS);
    for (const turn of tail) {
      if (!turn || typeof turn !== 'object') continue;
      const role = turn.role === 'model' || turn.role === 'assistant' ? 'model' : (turn.role === 'user' ? 'user' : null);
      if (!role) continue;
      const text = String(turn.text ?? turn.content ?? '').trim().slice(0, 1000);
      if (!text) continue;
      sanitizedHistory.push({ role, text });
    }
  }

  const pagePath = sanitizePagePath(body.pagePath || '/');
  const sessionId = String(body.sessionId || 'anon')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 120) || 'anon';

  let currencyContext = { currency: 'INR', exchangeRate: 1, markupPercent: 0 };
  if (body.currencyContext && typeof body.currencyContext === 'object' && !Array.isArray(body.currencyContext)) {
    const rawCurr = String(body.currencyContext.currency || 'INR')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 5) || 'INR';
    if (rawCurr === 'INR') {
      currencyContext = { currency: 'INR', exchangeRate: 1, markupPercent: 0 };
    } else {
      const rawRate = Number(body.currencyContext.exchangeRate);
      const rawMarkup = Number(body.currencyContext.markupPercent);
      currencyContext = {
        currency: rawCurr,
        exchangeRate: Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 0,
        markupPercent: Number.isFinite(rawMarkup) && rawMarkup >= 0 && rawMarkup <= 500 ? rawMarkup : 0,
      };
    }
  }

  return {
    valid: true,
    data: {
      message,
      history: sanitizedHistory,
      pagePath,
      sessionId,
      image: validatedImage,
      quickTapId,
      currencyContext,
    },
  };
}

const INJECTION_PATTERNS = [
  /(?:ignore|forget|disregard|override)\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above|system|earlier)\s+(?:instructions?|prompts?|rules?|directives?)/i,
  /disregard\s+(?:all\s+|the\s+)?(?:previous|prior|above|system)/i,
  /(?:new|updated)\s+system\s+(?:instructions?|prompt)/i,
  /reveal\s+(?:your\s+)?(?:system\s+prompt|hidden\s+prompt|instructions|api\s*key|secret)/i,
  /(?:show|print|dump|output|leak|tell\s+me)\s+(?:your\s+)?(?:system\s+prompt|gemini_api_key|service_role|supabase_service_role_key|env\s+var)/i,
  /\b(?:GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY)\b/i,
  /you\s+are\s+now\s+(?:DAN|developer\s+mode|unrestricted|jailbroken)/i,
  /(?:override|bypass)\s+(?:the\s+)?(?:pricing|price|discount|rules|policy|guardrails)/i,
  /give\s+me\s+(?:a\s+)?(?:9[0-9]|8[0-9]|7[0-9]|100)%\s*(?:off|discount)/i,
];

/**
 * Detects obvious prompt-injection, secret-extraction, or unauthorized discount override attempts.
 */
export function detectPromptInjection(message = '') {
  const text = String(message || '').trim();
  if (!text) return false;
  return INJECTION_PATTERNS.some((re) => re.test(text));
}

async function getServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey);
}

/**
 * Asynchronously logs handoff/fallback events to public.chat_handoff_logs via service_role
 * without blocking the HTTP response.
 */
export function scheduleHandoffLog({
  supabasePromise,
  sessionId,
  pagePath,
  triggerReason,
  userQuery,
  hadImage,
}) {
  const logPromise = (async () => {
    try {
      const client = await supabasePromise;
      if (!client || typeof client.from !== 'function') return;

      const preview = String(userQuery || '')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .trim()
        .slice(0, 300);

      await client.from('chat_handoff_logs').insert({
        session_id: String(sessionId || 'anon').slice(0, 120),
        page_path: sanitizePagePath(pagePath),
        trigger_reason: String(triggerReason || 'escalation').slice(0, 80),
        user_query_preview: preview,
        had_image: Boolean(hadImage),
      });
    } catch (err) {
      console.warn('[chatHandler] Handoff log skipped:', err?.message || err);
    }
  })();

  // Register background promise with Cloudflare Edge waitUntil when available
  try {
    import('@cloudflare/next-on-pages')
      .then((mod) => {
        const ctx = mod?.getRequestContext?.()?.ctx;
        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(logPromise);
        }
      })
      .catch(() => {
        // Not running inside Cloudflare Pages worker (e.g. Node unit tests)
      });
  } catch {
    // Ignore
  }

  return logPromise;
}

function buildFallbackResponse({ message, pagePath, reason, reply }) {
  return {
    reply,
    products: [],
    handoff: {
      show: true,
      reason,
      whatsappUrl: buildWhatsAppHandoffUrl(message, pagePath, reason),
    },
  };
}

function shouldOfferHandoff(replyText = '', userMessage = '') {
  const r = replyText.toLowerCase();
  const u = userMessage.toLowerCase();
  if (
    r.includes('whatsapp') ||
    r.includes('9919101369') ||
    r.includes('sales@weave365.com')
  ) {
    return true;
  }
  if (/(bulk\s*quote|custom\s*quote|negotiate|discount|order\s*status|track\s*order)/i.test(u)) {
    return true;
  }
  return false;
}

function dedupeProducts(products = []) {
  const seen = new Set();
  const result = [];
  for (const p of products) {
    if (!p || !p.id) continue;
    const key = `${p.id}:${p.colorName || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}

/**
 * Creates a chat POST handler with injectable dependencies for clean Edge execution & unit testing.
 */
export function createChatHandler(deps = {}) {
  const {
    generateChatReply = defaultGenerateChatReply,
    embedMultimodalContent,
    loadLiveCatalog = defaultLoadLiveCatalog,
    searchCatalogProducts = defaultSearchCatalogProducts,
    semanticTextFallbackSearch = defaultSemanticTextFallbackSearch,
    executeCatalogToolCall = defaultExecuteCatalogToolCall,
    visualSearchCatalog = defaultVisualSearchCatalog,
    checkChatRateLimit = defaultCheckChatRateLimit,
    getSupabase = getServiceRoleSupabase,
    apiKey,
    fetchImpl,
  } = deps;

  return async function handleChatPost(request) {
    let rawBody;
    try {
      rawBody = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON request body.' }, 400);
    }

    const validation = validateChatPayload(rawBody);
    if (!validation.valid) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const { message, history, pagePath, sessionId, image, quickTapId, currencyContext } = validation.data;
    const hadImage = Boolean(image);
    const clientIp = extractClientIp(request);

    // Zero-API scripted shortcut if caller explicitly passes a quickTapId
    if (quickTapId && QUICK_TAP_REPLIES[quickTapId] && !hadImage) {
      return jsonResponse({
        reply: QUICK_TAP_REPLIES[quickTapId],
        products: [],
        handoff: {
          show: false,
          reason: null,
          whatsappUrl: buildWhatsAppHandoffUrl('', pagePath, ''),
        },
      });
    }

    // 1. Prompt injection & secret/discount override defense
    if (detectPromptInjection(message)) {
      return jsonResponse({
        reply:
          'I can only assist with verified Weave 365 products, wholesale orders, free reseller tools, white-label dropshipping, shipping, and custom weaving enquiries. Please connect with our team on WhatsApp for official commercial support.',
        products: [],
        handoff: {
          show: true,
          reason: 'out_of_scope_escalation',
          whatsappUrl: buildWhatsAppHandoffUrl('', pagePath, 'out_of_scope_escalation'),
        },
      });
    }

    // 2. Sliding-window rate limit check (graceful HTTP 200 fallback with WhatsApp handoff)
    const rateResult = checkChatRateLimit({
      ip: clientIp,
      sessionId,
      hasImage: hadImage,
    });

    const supabasePromise = Promise.resolve().then(() => getSupabase()).catch(() => null);

    if (!rateResult.allowed) {
      const reason = 'rate_limit';
      scheduleHandoffLog({
        supabasePromise,
        sessionId,
        pagePath,
        triggerReason: reason,
        userQuery: message || (hadImage ? '[image upload]' : ''),
        hadImage,
      });

      const limitMessage =
        rateResult.reason === 'image_rate_limit'
          ? 'You have reached the hourly limit for photo searches. Please continue directly with our team on WhatsApp and share your photo there!'
          : 'You have sent several messages in a short window. To keep things moving smoothly, please chat directly with our team on WhatsApp (+91 9919101369).';

      return jsonResponse(
        buildFallbackResponse({
          message,
          pagePath,
          reason,
          reply: limitMessage,
        }),
        200
      );
    }

    const resolvedKey = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY;
    if (!resolvedKey || !String(resolvedKey).trim()) {
      const reason = 'missing_api_key';
      scheduleHandoffLog({
        supabasePromise,
        sessionId,
        pagePath,
        triggerReason: reason,
        userQuery: message || (hadImage ? '[image upload]' : ''),
        hadImage,
      });

      return jsonResponse(
        buildFallbackResponse({
          message,
          pagePath,
          reason,
          reply:
            'Our AI concierge is temporarily unavailable right now. Please connect directly with our Varanasi team on WhatsApp (+91 9919101369) for immediate help.',
        }),
        200
      );
    }

    try {
      const supabaseClient = await supabasePromise;

      // 3. Visual Search Flow (when image is uploaded)
      if (hadImage) {
        const visualResult = await visualSearchCatalog({
          image,
          message,
          pagePath,
          supabase: supabaseClient,
          fetchImpl,
          apiKey: resolvedKey,
          geminiClient: {
            generateChatReply,
            ...(embedMultimodalContent ? { embedMultimodalContent } : {}),
          },
        });

        if (visualResult.handoff?.show) {
          scheduleHandoffLog({
            supabasePromise: Promise.resolve(supabaseClient),
            sessionId,
            pagePath,
            triggerReason: visualResult.handoff.reason || 'no_visual_match',
            userQuery: message || '[visual search]',
            hadImage: true,
          });
        }

        return jsonResponse({
          reply: visualResult.reply,
          products: visualResult.products || [],
          handoff: visualResult.handoff || {
            show: false,
            reason: null,
            whatsappUrl: buildWhatsAppHandoffUrl(message, pagePath, ''),
          },
        });
      }

      // 4. Text Flow with Live Catalog Grounding & Gemini Function Calling
      const liveCatalog = await loadLiveCatalog({ supabase: supabaseClient });
      const currentFilters = parseCatalogQueryFilters(message, { currencyContext });
      const effectiveQuery = resolveEffectiveSearchQuery(message, history, currentFilters);
      const effectiveFilters = parseCatalogQueryFilters(effectiveQuery, { currencyContext });

      let initialMatchedProducts = await searchCatalogProducts(effectiveQuery, {
        limit: 4,
        supabase: supabaseClient,
        currencyContext,
      });

      if (
        (!Array.isArray(initialMatchedProducts) || initialMatchedProducts.length === 0) &&
        isDescriptiveStyleQuery(effectiveQuery, effectiveFilters)
      ) {
        initialMatchedProducts = await semanticTextFallbackSearch({
          query: effectiveQuery,
          filters: effectiveFilters,
          supabase: supabaseClient,
          apiKey: resolvedKey,
          fetchImpl,
          geminiClient: embedMultimodalContent ? { embedMultimodalContent } : undefined,
          limit: 3,
        });
      }

      const activeProductSku = extractActiveProductSku(pagePath);
      const catalogSummary =
        Array.isArray(liveCatalog) && liveCatalog.length > 0
          ? buildInStockCatalogSummary(liveCatalog, currencyContext)
          : '';
      const catalogContext = buildCatalogContextPrompt(initialMatchedProducts);
      const currencyNote =
        currencyContext?.currency && currencyContext.currency !== 'INR'
          ? `Active visitor currency: ${currencyContext.currency} (exchangeRate=${currencyContext.exchangeRate || 'baseline'}, markupPercent=${currencyContext.markupPercent || 0}%)`
          : '';
      const pageContextLines = [`Current visitor page path: ${pagePath}`];
      if (activeProductSku) {
        pageContextLines.push(`Active Product Page SKU: ${activeProductSku}`);
      }
      const pageContext = pageContextLines.join('\n');
      const extraSystemContext = [pageContext, currencyNote, catalogSummary, catalogContext]
        .filter(Boolean)
        .join('\n\n');

      const contents = [
        ...history.map((h) => ({
          role: h.role,
          parts: [{ text: h.text }],
        })),
        {
          role: 'user',
          parts: [
            {
              text: `<user_query>\n${message}\n</user_query>\nRespond accurately using the verified Weave 365 knowledge base, current-turn context, and your catalog tools when needed.`,
            },
          ],
        },
      ];

      const tools = [{ functionDeclarations: CHAT_TOOL_DECLARATIONS }];
      const workingContents = [...contents];
      let toolRoundsExecuted = 0;
      let totalToolCallsExecuted = 0;
      const toolMatchedProducts = [];
      let aiResult = null;

      for (let step = 0; step <= MAX_TOOL_CALL_STEPS; step++) {
        const forceTextOnly = step === MAX_TOOL_CALL_STEPS || totalToolCallsExecuted >= MAX_TOOL_INVOCATIONS;
        aiResult = await generateChatReply({
          contents: workingContents,
          extraSystemContext,
          thinkingLevel: 'minimal',
          temperature: 0.15,
          maxOutputTokens: 512,
          tools,
          ...(forceTextOnly ? { toolConfig: { functionCallingConfig: { mode: 'NONE' } } } : {}),
          apiKey: resolvedKey,
          fetchImpl,
        });

        const functionCalls = Array.isArray(aiResult?.functionCalls) ? aiResult.functionCalls : [];
        if (functionCalls.length === 0 || forceTextOnly) {
          break;
        }

        // Preserve model's functionCall turn verbatim (including thoughtSignature & call id) for Gemini REST round-trips
        if (aiResult.modelContent) {
          workingContents.push(aiResult.modelContent);
        } else {
          workingContents.push({
            role: 'model',
            parts: functionCalls.map((fc) => ({
              functionCall: {
                name: fc.name,
                args: fc.args || {},
                ...(fc.id ? { id: fc.id } : {}),
              },
            })),
          });
        }

        const functionResponseParts = [];
        for (const call of functionCalls) {
          if (totalToolCallsExecuted >= MAX_TOOL_INVOCATIONS) {
            functionResponseParts.push({
              functionResponse: {
                name: call.name,
                ...(call.id ? { id: call.id } : {}),
                response: {
                  result: {
                    error: 'Tool call limit reached for this turn. Answer using already retrieved data.',
                  },
                },
              },
            });
            continue;
          }

          totalToolCallsExecuted += 1;
          const execResult = await executeCatalogToolCall(call.name, call.args, {
            catalog: liveCatalog,
            currencyContext,
            activeProductSku,
            supabase: supabaseClient,
            apiKey: resolvedKey,
            fetchImpl,
            geminiClient: embedMultimodalContent ? { embedMultimodalContent } : undefined,
          });
          if (Array.isArray(execResult?.matchedProducts) && execResult.matchedProducts.length > 0) {
            toolMatchedProducts.push(...execResult.matchedProducts);
          }
          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              ...(call.id ? { id: call.id } : {}),
              response: {
                result: execResult?.response || {},
              },
            },
          });
        }

        toolRoundsExecuted += 1;
        workingContents.push({
          role: 'user',
          parts: functionResponseParts,
        });
      }

      if (!aiResult || !aiResult.text) {
        throw new GeminiApiError('Gemini returned an empty response after tool execution.', {
          code: 'EMPTY_RESPONSE',
          status: 502,
          retryable: true,
        });
      }

      const finalProducts =
        toolRoundsExecuted > 0 ? dedupeProducts(toolMatchedProducts) : (initialMatchedProducts || []);
      const safeReply = enforceUploadedPhotoPurityGuard(aiResult.text);
      const showHandoff = shouldOfferHandoff(safeReply, message);
      const handoffReason = showHandoff ? 'out_of_scope_escalation' : null;

      if (showHandoff) {
        scheduleHandoffLog({
          supabasePromise: Promise.resolve(supabaseClient),
          sessionId,
          pagePath,
          triggerReason: handoffReason,
          userQuery: message,
          hadImage: false,
        });
      }

      return jsonResponse({
        reply: safeReply,
        products: finalProducts.slice(0, 3).map(toChatProductCard),
        handoff: {
          show: showHandoff,
          reason: handoffReason,
          whatsappUrl: buildWhatsAppHandoffUrl(message, pagePath, handoffReason || ''),
        },
      });
    } catch (err) {
      const isTimeout = err instanceof GeminiApiError && err.code === 'TIMEOUT';
      const isMissingKey = err instanceof GeminiApiError && err.code === 'MISSING_API_KEY';
      const reason = isTimeout
        ? 'gemini_timeout'
        : isMissingKey
          ? 'missing_api_key'
          : 'gemini_error';

      console.error('[chatHandler] Graceful fallback triggered:', reason, err?.message || err);

      scheduleHandoffLog({
        supabasePromise,
        sessionId,
        pagePath,
        triggerReason: reason,
        userQuery: message || (hadImage ? '[image upload]' : ''),
        hadImage,
      });

      return jsonResponse(
        buildFallbackResponse({
          message,
          pagePath,
          reason,
          reply:
            'I could not complete that request right now, but our Varanasi team is available on WhatsApp (+91 9919101369) to help you immediately with wholesale rates, reselling, or catalog matching.',
        }),
        200
      );
    }
  };
}

export const handleChatPost = createChatHandler();

export async function POST(request) {
  return handleChatPost(request);
}
