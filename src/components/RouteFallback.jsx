/**
 * RouteFallback Component
 * Purpose: A clean, animated fallback indicator used by React Suspense during lazy route transitions.
 */
import { StateMessage } from './StateMessage.jsx';

export function RouteFallback() {
  return (
    <section className="section">
      <StateMessage status="loading" error="" />
    </section>
  );
}
