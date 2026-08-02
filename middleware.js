import { NextResponse } from 'next/server';

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
    return NextResponse.next();
  }

  if (host === 'weave365.com') {
    url.hostname = 'www.weave365.com';
    url.port = ''; // Remove port for canonical production redirects
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
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
