'use client';

/**
 * NotFoundPage Component
 * Purpose: Renders a premium, branded 404 Not Found experience for Weave 365.
 * Used both by the Next.js app/not-found.jsx (server 404) and as the
 * App.jsx client-side fallback for unknown routes.
 */
import { useRouter } from 'next/navigation';
import { Search, Home, Package } from '../components/icons.jsx';

const NOT_FOUND_STYLES = `
.nf-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cream, #fbf6ee);
  position: relative;
  overflow: hidden;
  padding: 2rem;
}
.nf-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.nf-orb-1 {
  width: 600px;
  height: 600px;
  top: -150px;
  right: -150px;
  background: radial-gradient(circle, rgba(183, 134, 70, 0.07) 0%, transparent 70%);
}
.nf-orb-2 {
  width: 500px;
  height: 500px;
  bottom: -100px;
  left: -100px;
  background: radial-gradient(circle, rgba(234, 216, 191, 0.4) 0%, transparent 70%);
}
.nf-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 600px;
  width: 100%;
}
.nf-code {
  font-family: var(--font-hero-heading, 'Playfair Display', Georgia, serif);
  font-size: clamp(120px, 20vw, 200px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 2px rgba(183, 134, 70, 0.2);
  background: linear-gradient(135deg, rgba(183, 134, 70, 0.12) 0%, rgba(183, 134, 70, 0.04) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  margin-bottom: -1rem;
  user-select: none;
}
.nf-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}
.nf-kicker {
  display: inline-block;
  font-family: var(--font-modern-heading, 'Manrope', sans-serif);
  font-size: var(--small-size);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--gold, #b78646);
  padding: 0.45rem 1.25rem;
  background: rgba(183, 134, 70, 0.08);
  border: 1px solid rgba(183, 134, 70, 0.2);
  border-radius: 100px;
}
.nf-heading {
  font-family: var(--font-hero-heading, 'Marcellus', Georgia, serif);
  font-size: clamp(24px, 5.5vw, var(--h1-size, 44px));
  font-weight: 700;
  color: var(--ink, #241912);
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0;
}
.nf-body {
  font-family: var(--font-hero-body, 'Inter', sans-serif);
  font-size: var(--body-large-size);
  line-height: 1.7;
  color: var(--muted, #6d5946);
  max-width: 440px;
  margin: 0;
  font-weight: 400;
}
.nf-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.875rem;
  justify-content: center;
  margin-top: 0.5rem;
}
.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 100px;
  font-family: var(--font-modern-heading, 'Manrope', sans-serif);
  font-size: var(--button-size);
  font-weight: var(--button-weight);
  letter-spacing: 0.03em;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  border: none;
}
.nf-btn-primary {
  background: var(--gold, #b78646);
  color: #fff;
  box-shadow: 0 4px 16px rgba(183, 134, 70, 0.3);
}
.nf-btn-primary:hover {
  background: var(--gold-dark, #805d31);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(183, 134, 70, 0.35);
}
.nf-btn-secondary {
  background: var(--white, #ffffff);
  color: var(--gold-dark, #805d31);
  border: 1px solid rgba(183, 134, 70, 0.25);
}
.nf-btn-secondary:hover {
  border-color: var(--gold, #b78646);
  background: var(--surface-soft, #faf2e8);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(183, 134, 70, 0.1);
}
.nf-btn-ghost {
  background: transparent;
  color: var(--muted, #6d5946);
  border: 1px solid rgba(109, 89, 70, 0.2);
}
.nf-btn-ghost:hover {
  background: rgba(109, 89, 70, 0.06);
  color: var(--ink, #241912);
  transform: translateY(-2px);
}
@media (max-width: 480px) {
  .nf-actions {
    flex-direction: column;
    width: 100%;
  }
  .nf-btn {
    justify-content: center;
    width: 100%;
  }
}
`;

export function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="nf-page">
      <style dangerouslySetInnerHTML={{ __html: NOT_FOUND_STYLES }} />
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
            <a href="/catalogue" className="nf-btn nf-btn-secondary" onClick={(e) => { e.preventDefault(); router.push('/catalogue'); }}>
              <Package size={17} />
              View Catalogue
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
