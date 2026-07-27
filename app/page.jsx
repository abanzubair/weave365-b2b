import CatchAllPage, { generateMetadata as generateCatchAllMetadata } from './[...slug]/page.jsx';

export const revalidate = 900;
export const runtime = 'edge';

export async function generateMetadata() {
  return generateCatchAllMetadata({ params: Promise.resolve({ slug: [] }) });
}

export default async function HomePage() {
  return <CatchAllPage params={Promise.resolve({ slug: [] })} />;
}
