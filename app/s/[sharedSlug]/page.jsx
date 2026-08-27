import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function SharedCatalogueRoute({ params }) {
  const resolvedParams = await params;
  const sharedSlug = decodeURIComponent(resolvedParams?.sharedSlug || '');

  const targetUrl = sharedSlug
    ? `https://ecom-template-1-tau.vercel.app/${encodeURIComponent(sharedSlug)}`
    : 'https://ecom-template-1-tau.vercel.app/';

  redirect(targetUrl);
}
