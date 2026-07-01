/**
 * RouteFallback Component
 * Purpose: A clean, animated fallback indicator used by React Suspense during lazy route transitions.
 */
import { Loader } from 'lucide-react';

export function RouteFallback() {
  return (
    <section className="section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <Loader className="spin" size={24} style={{ color: '#c5a880' }} />
    </section>
  );
}
