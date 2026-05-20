export const runtime = 'edge';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weave365.in';

export default function robots() {
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
