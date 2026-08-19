import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function RegisterPageRoute({ searchParams }) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams || {});
  params.set('mode', 'register');
  redirect(`/signup?${params.toString()}`);
}
