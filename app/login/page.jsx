import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function LoginPageRoute({ searchParams }) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams || {});
  params.set('mode', 'login');
  redirect(`/signup?${params.toString()}`);
}
