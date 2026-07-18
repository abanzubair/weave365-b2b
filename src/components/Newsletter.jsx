/**
 * Newsletter Component
 * Purpose: Renders a premium, glassmorphism-styled newsletter signup & WhatsApp community link strip.
 * Prompts boutique owners and resellers to join active broadcast lists for instant new arrival alerts.
 */
import { BellRing } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { storeConfig } from '../config.js';
import { WhatsappIcon } from './WhatsappIcon.jsx';

export function Newsletter() {
  const router = useRouter();

  const handleWhatsappClick = (event) => {
    event.preventDefault();
    router.push('/early-access');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="newsletter">
      <div>
        <span className="newsletter-bell-wrapper">
          <BellRing />
        </span>
        <span>
          <strong>Stay Updated</strong>
          Sign up for our newsletter and get updates on new arrivals, exclusive offers and more.
        </span>
      </div>
      <div className="newsletter-actions">
        <a
          href="/early-access"
          onClick={handleWhatsappClick}
          className="whatsapp-group-btn"
        >
          <WhatsappIcon size={18} /> Get New Arrival Updates
        </a>
        <span className="divider-text">OR</span>
        <form onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Enter your email" />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
