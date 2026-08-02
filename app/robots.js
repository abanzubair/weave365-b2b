import { headers } from 'next/headers';

export const runtime = 'edge';

export default async function robots() {
  const headersList = await headers();
  let host = headersList.get('host') || 'www.weave365.com';
  if (host === 'weave365.com') {
    host = 'www.weave365.com';
  }
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${host}`;
  const siteUrl = rawSiteUrl.replace(/\/$/, '');

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
