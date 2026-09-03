import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default function StoreIndexPage() {
  redirect('/resell-sarees-online');
}
