import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');
  const path = url.pathname;

  // Skip redirect for search engine verification/crawling files (robots.txt, sitemap.xml, google verification files)
  // to ensure they can be served on their respective domains.
  if (
    path === '/robots.txt' || 
    path.includes('sitemap') || 
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
