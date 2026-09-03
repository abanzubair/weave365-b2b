import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function SharedCatalogueRoute({ params }) {
  const resolvedParams = await params;
  const sharedSlug = decodeURIComponent(resolvedParams?.sharedSlug || '');

  const targetUrl = sharedSlug
    ? `/store/${encodeURIComponent(sharedSlug)}`
    : '/resell-sarees-online';

  redirect(targetUrl);
}
