import { NextResponse } from 'next/server';

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://assets.weave365.com https://drive.google.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://www.googletagmanager.com https://www.google-analytics.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://assets.weave365.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://api.resend.com",
  "frame-src 'self' https://ecom-template-1-tau.vercel.app https://50k-gamma.vercel.app https://e-com-template-3.vercel.app",
  "frame-ancestors 'self' https://ecom-template-1-tau.vercel.app https://50k-gamma.vercel.app https://e-com-template-3.vercel.app",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function applySecurityHeaders(res) {
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  res.headers.set('Content-Security-Policy', CSP_DIRECTIVES);
  // Ensure webpage HTML responses never carry wildcard CORS
  res.headers.delete('Access-Control-Allow-Origin');
  return res;
}

export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');
  const path = url.pathname;

  // Rewrite /sitemap.xml to the unified Edge API sitemap handler
  if (path === '/sitemap.xml' || path === '/sitemap') {
    url.pathname = '/api/sitemap.xml';
    return NextResponse.rewrite(url);
  }

  // Skip redirect for static robots.txt and google verification files
  if (
    path === '/robots.txt' || 
    (path.startsWith('/google') && path.endsWith('.html'))
  ) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  if (host === 'weave365.com') {
    url.hostname = 'www.weave365.com';
    url.port = ''; // Remove port for canonical production redirects
    url.protocol = 'https:';
    const redirectRes = NextResponse.redirect(url, 301);
    return applySecurityHeaders(redirectRes);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (internal assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
