'use client';

/**
 * NotFoundPage Component
 * Purpose: Renders a premium, branded 404 Not Found experience for Weave 365.
 * Used both by the Next.js app/not-found.jsx (server 404) and as the
 * App.jsx client-side fallback for unknown routes.
 */
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Home, Package } from 'lucide-react';

export function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="nf-page">
      {/* Decorative background orbs */}
      <div className="nf-orb nf-orb-1" aria-hidden="true" />
      <div className="nf-orb nf-orb-2" aria-hidden="true" />

      <main className="nf-main">
        {/* Giant decorative number */}
        <div className="nf-code" aria-hidden="true">404</div>

        {/* Content */}
        <div className="nf-content">
          <span className="nf-kicker">Page Not Found</span>
          <h1 className="nf-heading">This thread leads nowhere.</h1>
          <p className="nf-body">
            The page you're looking for has been moved, removed, or never existed.
            Let us guide you back to our premium wholesale collections.
          </p>

          {/* Action buttons */}
          <div className="nf-actions">
            <a href="/" className="nf-btn nf-btn-primary" onClick={(e) => { e.preventDefault(); router.push('/'); }}>
              <Home size={17} />
              Back to Home
            </a>
            <a href="/catalog" className="nf-btn nf-btn-secondary" onClick={(e) => { e.preventDefault(); router.push('/catalog'); }}>
              <Package size={17} />
              View Collections
            </a>
            <a href="/contact" className="nf-btn nf-btn-ghost" onClick={(e) => { e.preventDefault(); router.push('/contact'); }}>
              <Search size={17} />
              Contact Us
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
