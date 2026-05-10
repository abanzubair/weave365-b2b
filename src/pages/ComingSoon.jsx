import React from 'react';
import { Lock, ScrollText, Award, Handshake } from 'lucide-react';
import comingSoonBg from '../../assets/comingsoon.png';
import brandLogo from '../../assets/Weave365.svg';

export function ComingSoon() {
  return (
    <div className="cs-wrapper" style={{ backgroundImage: `url(${comingSoonBg})` }}>
      <div className="cs-layout">
        
        {/* Top Left */}
        <div className="cs-logo-area">
          <img src={brandLogo} alt="Weave365" className="cs-brand" />
        </div>

        {/* Top Right */}
        <div className="cs-404-area">
          <div className="cs-404-number">404</div>
          <div className="cs-404-text">LOOKS LIKE THIS PAGE<br/>ISN'T READY YET.</div>
          <div className="cs-line cs-line-right"></div>
        </div>

        {/* Middle Left */}
        <div className="cs-hero-text">
          <h1 className="cs-title">COMING<br/>SOON</h1>
          <div className="cs-line cs-line-left"></div>
          <p className="cs-desc">
            We're preparing something<br/>
            beautiful for your business.
          </p>
          <br/>
          <p className="cs-subdesc">
            Wholesale sarees.<br/>
            Timeless elegance.
          </p>
        </div>

        {/* Bottom */}
        <div className="cs-bottom-area">
          <div className="cs-features-grid">
            <div className="cs-feature-item">
              <Lock strokeWidth={1} size={28} />
              <h4>WHOLESALE ONLY</h4>
              <p>For registered<br/>businesses</p>
            </div>
            <div className="cs-feature-item">
              <ScrollText strokeWidth={1} size={28} />
              <h4>PREMIUM QUALITY</h4>
              <p>Handpicked sarees.<br/>Trusted quality.</p>
            </div>
            <div className="cs-feature-item">
              <Award strokeWidth={1} size={28} />
              <h4>WIDE RANGE</h4>
              <p>Latest designs.<br/>Endless varieties.</p>
            </div>
            <div className="cs-feature-item">
              <Handshake strokeWidth={1} size={28} />
              <h4>BUILT FOR RETAILERS</h4>
              <p>Smart deals for<br/>smart businesses.</p>
            </div>
          </div>
          
          <div className="cs-stay-tuned-row">
            <div className="cs-line-long"></div>
            <h3>STAY TUNED</h3>
            <div className="cs-line-long"></div>
          </div>
          <div className="cs-footer-text">
            Something timeless is on the way.
          </div>
        </div>

      </div>
    </div>
  );
}
