/**
 * @file geminiClient.js
 * @description Edge- and Node-compatible Google AI Studio REST client using standard fetch.
 * Supports gemini-3.5-flash-lite chat generation (with fixed KB systemInstruction prefix for prompt caching)
 * and gemini-embedding-2 multimodal embeddings (768 dims).
 */

import { CHAT_SYSTEM_INSTRUCTION } from '../../data/chatbotKnowledgeBase.js';

export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
export const GEMINI_CHAT_MODEL = 'gemini-3.5-flash-lite';
export const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-2';
export const DEFAULT_GEMINI_TIMEOUT_MS = 15000;
export const DEFAULT_EMBEDDING_DIMS = 768;

/**
 * Clean typed error for Gemini REST API failures (429, 5xx, missing key, timeout, network).
 */
export class GeminiApiError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, status?: number, retryable?: boolean, details?: unknown, cause?: unknown }} [options]
   */
  constructor(message, { code = 'GEMINI_ERROR', status = 500, retryable = false, details = null, cause = undefined } = {}) {
    super(message);
    this.name = 'GeminiApiError';
    this.code = code;
    this.status = status;
    this.retryable = Boolean(retryable);
    this.details = details;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

function resolveApiKey(explicitKey) {
  const key = explicitKey !== undefined ? explicitKey : process.env.GEMINI_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

function resolveFetch(fetchImpl) {
  const fn = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!fn) {
    throw new GeminiApiError('No fetch implementation available in this runtime.', {
      code: 'NETWORK_ERROR',
      status: 500,
      retryable: false,
    });
  }
  return fn;
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS) {
  const effectiveTimeout = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0
    ? Number(timeoutMs)
    : DEFAULT_GEMINI_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError' || /abort/i.test(String(err?.message || ''))) {
      throw new GeminiApiError(`Gemini API request timed out after ${effectiveTimeout}ms`, {
        code: 'TIMEOUT',
        status: 504,
        retryable: true,
        cause: err,
      });
    }
    throw new GeminiApiError(`Gemini network error: ${err?.message || 'Request failed'}`, {
      code: 'NETWORK_ERROR',
      status: 502,
      retryable: true,
      cause: err,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function parseErrorResponse(res) {
  let payload = null;
  let text = '';
  try {
    text = await res.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text || null;
  }

  const msg = payload?.error?.message || `Gemini API returned HTTP ${res.status}`;
  if (res.status === 429) {
    return new GeminiApiError(msg, {
      code: 'RATE_LIMITED',
      status: 429,
      retryable: true,
      details: payload,
    });
  }
  if (res.status >= 500) {
    return new GeminiApiError(msg, {
      code: 'SERVER_ERROR',
      status: res.status,
      retryable: true,
      details: payload,
    });
  }
  return new GeminiApiError(msg, {
    code: 'BAD_REQUEST',
    status: res.status,
    retryable: false,
    details: payload,
  });
}

/**
 * Extracts concatenated text from a Gemini generateContent response candidate.
 * Skips internal thought parts if the API ever includes any.
 */
export function extractCandidateText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .filter((p) => p && !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
    .trim();
}

/**
 * Calls Google AI Studio generateContent on gemini-3.5-flash-lite.
 * Always keeps the fixed CHAT_SYSTEM_INSTRUCTION (with KB at the very start) as the first part of systemInstruction.
 *
 * @param {Object} options
 * @param {Array<{ role: 'user'|'model', parts: Array<Object> }>} options.contents
 * @param {string} [options.extraSystemContext] - Optional per-turn catalog/task context appended after fixed KB prompt
 * @param {string} [options.systemInstruction] - Optional override prefix (defaults to CHAT_SYSTEM_INSTRUCTION)
 * @param {'minimal'|'low'|'medium'|'high'} [options.thinkingLevel='minimal']
 * @param {number} [options.temperature=0.15]
 * @param {number} [options.maxOutputTokens=512]
 * @param {string} [options.responseMimeType]
 * @param {Array<Object>} [options.tools] - Optional Gemini function/tool declarations
 * @param {Object} [options.toolConfig] - Optional Gemini toolConfig (e.g. functionCallingConfig)
 * @param {string} [options.model='gemini-3.5-flash-lite']
 * @param {string} [options.apiKey]
 * @param {Function} [options.fetchImpl]
 * @param {number} [options.timeoutMs=15000]
 * @param {string} [options.baseUrl]
 */
export async function generateChatReply({
  contents,
  extraSystemContext = '',
  systemInstruction = CHAT_SYSTEM_INSTRUCTION,
  thinkingLevel = 'minimal',
  temperature = 0.15,
  maxOutputTokens = 512,
  responseMimeType,
  tools,
  toolConfig,
  model = GEMINI_CHAT_MODEL,
  apiKey,
  fetchImpl,
  timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS,
  baseUrl = GEMINI_API_BASE_URL,
} = {}) {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new GeminiApiError('GEMINI_API_KEY is not configured.', {
      code: 'MISSING_API_KEY',
      status: 503,
      retryable: false,
    });
  }

  if (!Array.isArray(contents) || contents.length === 0) {
    throw new GeminiApiError('contents must be a non-empty array.', {
      code: 'BAD_REQUEST',
      status: 400,
      retryable: false,
    });
  }

  const fn = resolveFetch(fetchImpl);
  const systemParts = [{ text: String(systemInstruction || CHAT_SYSTEM_INSTRUCTION) }];
  if (extraSystemContext && String(extraSystemContext).trim()) {
    systemParts.push({ text: String(extraSystemContext).trim() });
  }

  const generationConfig = {
    temperature,
    maxOutputTokens,
    thinkingConfig: {
      thinkingLevel: thinkingLevel || 'minimal',
    },
  };
  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType;
  }

  const requestBody = {
    systemInstruction: {
      parts: systemParts,
    },
    contents,
    generationConfig,
  };
  if (Array.isArray(tools) && tools.length > 0) {
    requestBody.tools = tools;
  }
  if (toolConfig && typeof toolConfig === 'object') {
    requestBody.toolConfig = toolConfig;
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetchWithTimeout(
    fn,
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': resolvedKey,
      },
      body: JSON.stringify(requestBody),
    },
    timeoutMs
  );

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new GeminiApiError('Invalid JSON response from Gemini generateContent.', {
      code: 'SERVER_ERROR',
      status: 502,
      retryable: true,
      cause: err,
    });
  }

  const candidateContent = data?.candidates?.[0]?.content || null;
  const candidateParts = Array.isArray(candidateContent?.parts) ? candidateContent.parts : [];
  const functionCalls = candidateParts
    .filter((p) => p && p.functionCall && typeof p.functionCall.name === 'string')
    .map((p) => ({
      name: p.functionCall.name,
      args:
        p.functionCall.args && typeof p.functionCall.args === 'object' && !Array.isArray(p.functionCall.args)
          ? p.functionCall.args
          : {},
      ...(p.functionCall.id ? { id: p.functionCall.id } : {}),
    }));

  // Preserve the model content turn verbatim (including thoughtSignature & functionCall ids) for tool round-trips.
  const modelContent = candidateContent
    ? {
        ...candidateContent,
        role: candidateContent.role || 'model',
        parts: candidateParts,
      }
    : null;

  const text = extractCandidateText(data);
  if (!text && functionCalls.length === 0) {
    throw new GeminiApiError('Gemini returned an empty response.', {
      code: 'EMPTY_RESPONSE',
      status: 502,
      retryable: true,
      details: data,
    });
  }

  return {
    text,
    functionCalls,
    modelContent,
    raw: data,
    usageMetadata: data?.usageMetadata || null,
  };
}

/**
 * Calls Google AI Studio embedContent on gemini-embedding-2 (768 dimensions)
 * supporting text and/or multimodal inlineData parts.
 *
 * @param {Object} options
 * @param {Array<Object>} [options.parts] - Explicit Gemini content parts ({ text } or { inlineData: { mimeType, data } })
 * @param {string} [options.text] - Convenience text input
 * @param {{ mimeType: string, base64?: string, data?: string }} [options.image] - Convenience image input
 * @param {number} [options.outputDimensionality=768]
 * @param {string} [options.model='gemini-embedding-2']
 * @param {string} [options.apiKey]
 * @param {Function} [options.fetchImpl]
 * @param {number} [options.timeoutMs=15000]
 * @param {string} [options.baseUrl]
 * @returns {Promise<{ embedding: number[], model: string }>}
 */
export async function embedMultimodalContent({
  parts,
  text,
  image,
  outputDimensionality = DEFAULT_EMBEDDING_DIMS,
  model = GEMINI_EMBEDDING_MODEL,
  apiKey,
  fetchImpl,
  timeoutMs = DEFAULT_GEMINI_TIMEOUT_MS,
  baseUrl = GEMINI_API_BASE_URL,
} = {}) {
  const resolvedKey = resolveApiKey(apiKey);
  if (!resolvedKey) {
    throw new GeminiApiError('GEMINI_API_KEY is not configured.', {
      code: 'MISSING_API_KEY',
      status: 503,
      retryable: false,
    });
  }

  const resolvedParts = Array.isArray(parts) && parts.length > 0 ? [...parts] : [];
  if (resolvedParts.length === 0) {
    if (typeof text === 'string' && text.trim()) {
      resolvedParts.push({ text: text.trim() });
    }
    if (image && (image.base64 || image.data)) {
      resolvedParts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: image.base64 || image.data,
        },
      });
    }
  }

  if (resolvedParts.length === 0) {
    throw new GeminiApiError('At least one text or inlineData part is required for embedding.', {
      code: 'BAD_REQUEST',
      status: 400,
      retryable: false,
    });
  }

  const fn = resolveFetch(fetchImpl);
  const endpoint = `${baseUrl.replace(/\/$/, '')}/models/${encodeURIComponent(model)}:embedContent`;

  const res = await fetchWithTimeout(
    fn,
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': resolvedKey,
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: resolvedParts,
        },
        outputDimensionality,
      }),
    },
    timeoutMs
  );

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new GeminiApiError('Invalid JSON response from Gemini embedContent.', {
      code: 'SERVER_ERROR',
      status: 502,
      retryable: true,
      cause: err,
    });
  }

  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new GeminiApiError('Gemini embedding response did not include vector values.', {
      code: 'EMPTY_RESPONSE',
      status: 502,
      retryable: true,
      details: data,
    });
  }

  return {
    embedding: values,
    model,
  };
}
