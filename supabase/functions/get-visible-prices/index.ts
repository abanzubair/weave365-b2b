import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SheetRow = Record<string, string>;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function base64UrlEncode(input: string | ArrayBuffer) {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
}

async function importPrivateKey(pem: string) {
  const base64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function createGoogleJwt() {
  const clientEmail = requiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = normalizePrivateKey(requiredEnv('GOOGLE_PRIVATE_KEY'));
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({
    iss: clientEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));

  const signingInput = `${header}.${payload}`;
  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

async function getGoogleAccessToken() {
  const assertion = await createGoogleJwt();
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Unable to get Google access token');
  }

  return data.access_token as string;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function rowsFromSheetValues(values: string[][]): SheetRow[] {
  const [headers = [], ...rows] = values;
  const normalizedHeaders = headers.map(normalizeHeader);

  return rows
    .map((row) => Object.fromEntries(
      normalizedHeaders.map((header, index) => [header, String(row[index] || '').trim()]),
    ))
    .filter((row) => row.product_group_key || row.variant_code);
}

function parsePrice(value: string) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  return cleaned ? Number(cleaned) : null;
}

function isActiveRow(row: SheetRow) {
  const value = String(row.active || 'TRUE').trim().toLowerCase();
  return !['false', 'no', '0', 'inactive'].includes(value);
}

function priceRowForBuyer(row: SheetRow, priceGroup: 'wholesale' | 'reseller') {
  const basePrice = priceGroup === 'reseller'
    ? parsePrice(row.reseller_price)
    : parsePrice(row.wholesale_price);
  const offerPrice = priceGroup === 'reseller'
    ? parsePrice(row.reseller_offer_price)
    : parsePrice(row.wholesale_offer_price);

  return {
    product_group_key: row.product_group_key,
    variant_code: row.variant_code,
    prices: {
      mrp: basePrice,
      offer: offerPrice,
      single: priceGroup === 'reseller' ? (offerPrice || basePrice) : null,
      cod: null,
    },
    currency: row.currency || 'INR',
    price_group: priceGroup,
    updated_at: row.updated_at || null,
  };
}

async function fetchPriceRowsFromGoogleSheet() {
  const sheetId = requiredEnv('GOOGLE_PRICE_SHEET_ID');
  const range = Deno.env.get('GOOGLE_PRICE_SHEET_RANGE') || 'Prices!A:J';
  const token = await getGoogleAccessToken();
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Unable to read Google price sheet');
  }

  return rowsFromSheetValues(data.values || []);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization') || '';
    const token = authorization.replace(/^Bearer\s+/i, '');

    if (!token) {
      return jsonResponse({ prices: [], reason: 'missing_token' }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userResult.user) {
      return jsonResponse({ prices: [], reason: 'invalid_user' }, 401);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, approval_status, price_group')
      .eq('id', userResult.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (
      profile?.approval_status !== 'approved' ||
      !['wholesale', 'reseller'].includes(profile?.price_group || '')
    ) {
      return jsonResponse({ prices: [], reason: 'not_approved' });
    }

    const priceGroup = profile.price_group as 'wholesale' | 'reseller';
    const rows = await fetchPriceRowsFromGoogleSheet();
    const prices = rows
      .filter(isActiveRow)
      .map((row) => priceRowForBuyer(row, priceGroup))
      .filter((row) => row.product_group_key && row.variant_code && (row.prices.offer || row.prices.mrp));

    return jsonResponse({
      prices,
      price_group: priceGroup,
      count: prices.length,
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Unexpected price function error',
    }, 500);
  }
});
