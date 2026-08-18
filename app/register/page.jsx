import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function RegisterPageRoute({ searchParams }) {
  const resolvedParams = await searchParams;
  const q = resolvedParams ? new URLSearchParams(resolvedParams).toString() : '';
  redirect(`/signup${q ? `?${q}` : ''}`);
}
