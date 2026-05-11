import { CheckCircle2, ClipboardList, PackageCheck } from 'lucide-react';
import { storeConfig } from '../config.js';
import { SectionTitle, WhatsappIcon } from '../storefrontShared.jsx';

export function ResellerGrowth({ imageUrl }) {
  const whatsappStartUrl = `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent('Hello Weave365, I want to start buying wholesale catalogues.')}`;

  return (
    <section className="section reseller-growth-section" aria-labelledby="reseller-growth-heading">
      <SectionTitle title="Built For Resellers" />
      <div className="reseller-growth-grid">
        <article className="reseller-growth-card reseller-growth-intro">
          <div className="reseller-growth-copy">
            <span className="reseller-growth-kicker">Wholesale Partner</span>
            <h2 id="reseller-growth-heading">
              <span>Built for resellers</span>
              <span>Made for growth</span>
            </h2>
            <p className="reseller-growth-tagline">Fresh catalogues, ready for repeat buying</p>
            <ul>
              <li><CheckCircle2 size={18} /> Wholesale pricing for stronger margins</li>
              <li><CheckCircle2 size={18} /> Ready inventory with fast dispatch</li>
              <li><CheckCircle2 size={18} /> Quality your customers can trust</li>
              <li><CheckCircle2 size={18} /> Support for boutiques, resellers and exporters</li>
            </ul>
            <a className="reseller-whatsapp-button" href={whatsappStartUrl} target="_blank" rel="noreferrer">
              <WhatsappIcon size={19} /> Start Buying on WhatsApp
            </a>
          </div>
          <div className="reseller-growth-image" aria-hidden="true">
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={(e) => { e.target.style.opacity = '0'; }}
            />
          </div>
        </article>

        <article className="reseller-growth-card how-it-works-card">
          <div className="how-it-works-head">
            <span className="reseller-growth-kicker">Simple Ordering</span>
            <h2>How It Works</h2>
          </div>
          <div className="how-it-works-steps">
            <div className="how-step">
              <span className="step-number">1</span>
              <span className="step-icon"><ClipboardList size={31} /></span>
              <strong>Browse Catalogue</strong>
              <p>Explore products and shortlist styles for your market.</p>
            </div>
            <div className="how-step">
              <span className="step-number">2</span>
              <span className="step-icon whatsapp-step"><WhatsappIcon size={34} /></span>
              <strong>Share on WhatsApp</strong>
              <p>Send product codes, screenshots or your order list.</p>
            </div>
            <div className="how-step">
              <span className="step-number">3</span>
              <span className="step-icon"><PackageCheck size={32} /></span>
              <strong>Confirm & Order</strong>
              <p>Confirm price and quantity. We pack and dispatch.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
