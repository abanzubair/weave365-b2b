/**
 * Newsletter Component
 * Purpose: Renders a premium, glassmorphism-styled newsletter signup & WhatsApp community link strip.
 * Prompts boutique owners and resellers to join active broadcast lists for instant new arrival alerts.
 */
import { BellRing } from 'lucide-react';
import { storeConfig } from '../config.js';
import { WhatsappIcon } from './WhatsappIcon.jsx';

export function Newsletter() {
  return (
    <section className="newsletter">
      <div>
        <BellRing />
        <span>
          <strong>Stay Updated</strong>
          Sign up for our newsletter and get updates on new arrivals, exclusive offers and more.
        </span>
      </div>
      <div className="newsletter-actions">
        <a
          href={storeConfig.whatsappGroup || `https://wa.me/91${storeConfig.whatsapp}?text=Hi%20I%20want%20to%20join%20the%20updates%20group`}
          target="_blank"
          rel="noreferrer"
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
