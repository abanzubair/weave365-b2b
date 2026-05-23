/**
 * app/not-found.jsx
 * Next.js Special File — automatically served with a real HTTP 404 status code.
 * Renders whenever notFound() is called server-side or an unmatched route is visited
 * directly (bypassing the catch-all [[...slug]]).
 */
import '../src/styles.css';
import { NotFoundPage } from '../src/views/NotFoundPage.jsx';

export const metadata = {
  title: '404 — Page Not Found | Weave 365',
  description: 'This page could not be found. Return to Weave 365 to explore premium wholesale Banarasi sarees for retailers, boutiques, and resellers.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundPage />;
}
