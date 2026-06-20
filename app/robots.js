
import { headers } from 'next/headers';

export default async function robots() {
  const headersList = await headers();
  const host = headersList.get('host') || 'www.weave365.com';
  const proto = headersList.get('x-forwarded-proto') || 'https';
  const siteUrl = `${proto}://${host}`;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/account'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
