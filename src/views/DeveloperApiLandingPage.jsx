/**
 * @file DeveloperApiLandingPage.jsx
 * @description Minimal, Refined Light-Mode Landing Page for Weave365 B2B Developer API
 * Simple, clean, minimalist design with editorial typography and zero visual bloat:
 * - Pure light mode, true edge-to-edge hairline dividers, ample whitespace
 * - Editorial serif headings (Marcellus / Georgia) matching Weave365 heritage
 * - Clean inline metrics strip with crisp vertical hairlines (zero double-borders)
 * - Restrained, purposeful sections: Primitives, Platforms, Endpoints, Pricing, FAQ, CTA
 * - Strictly adhering to @modern-web-guidance (semantic HTML, native accessible accordion, text-wrap)
 * - Zero bento grids, zero gradients, zero eyebrow kicker headings, zero repetitive buttons
 * 
 * @module views/DeveloperApiLandingPage
 */

'use client';

import React from 'react';
import Breadcrumb from '../components/Breadcrumb.jsx';
import '../styles/developerApiLanding.css';

const PLATFORMS = [
  {
    name: 'Shopify',
    tag: 'SyncX & Matrixify',
    desc: 'Pre-formatted hourly inventory feed URLs. Supports dynamic profit markups (e.g. +35%) and automated variant mapping.'
  },
  {
    name: 'WooCommerce',
    tag: 'Official Plugin v1.2.0 • HPOS Ready',
    desc: 'One-click 22-column catalog CSV import with self-serve markup, hourly stock sync, live Classic & Blocks checkout guard, HPOS compatibility, and optional automated order forwarding.'
  },
  {
    name: 'PrestaShop',
    tag: 'REST Connector',
    desc: 'Turnkey inventory connector designed for European and international multi-currency fashion storefronts.'
  },
  {
    name: 'Custom Apps & SDKs',
    tag: 'REST • JSON',
    desc: 'Clean, predictable JSON payloads. Integrates with Node.js, Python, PHP, mobile applications, or enterprise ERPs.'
  }
];

const CORE_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/catalog',
    desc: 'Full wholesale catalog feed with high-res model photography, zari specs, and reseller wholesale pricing.'
  },
  {
    method: 'GET',
    path: '/api/v1/stock-status',
    desc: 'Sub-40ms live stock status map across Varanasi weaving clusters to verify availability before checkout.'
  },
  {
    method: 'POST',
    path: '/api/v1/orders',
    desc: 'Submit wholesale dropship orders. Varanasi master weavers package and dispatch directly under your white label.'
  },
  {
    method: 'GET',
    path: '/api/v1/orders',
    desc: 'Query fulfillment status and live AWB tracking milestones across Bluedart, Delhivery, and Xpressbees.'
  }
];

export default function DeveloperApiLandingPage({ onSwitchToDocs }) {
  return (
    <div className="api-min-root">
      {/* --------------------------------------------------------------------
          Breadcrumbs Only (Top sub-bar, border, and extra buttons removed)
          -------------------------------------------------------------------- */}
      <div className="api-min-breadcrumb-container">
        <Breadcrumb
          items={[
            { name: 'Home', url: '/' },
            { name: 'Developer API' }
          ]}
        />
      </div>

      {/* --------------------------------------------------------------------
          Minimal Hero Section
          -------------------------------------------------------------------- */}
      <section className="api-min-hero-wrap" aria-labelledby="hero-title">
        <div className="api-min-hero">
          <div className="api-min-hero-content">
            <h1 id="hero-title" className="api-min-hero-title">
              Direct loom sourcing, delivered by API.
            </h1>

            <p className="api-min-hero-subtitle">
              The official REST API for fashion boutiques, dropshippers, and platforms. Programmatically synchronize authentic Banarasi handloom inventory, verify live weaver availability, and automate white-label order fulfillment.
            </p>

            <div className="api-min-hero-actions">
              <a href="/account?tab=developer" className="api-btn-dark">
                Get API Key
              </a>
              {onSwitchToDocs && (
                <button type="button" className="api-btn-light" onClick={onSwitchToDocs}>
                  Read Documentation
                </button>
              )}
            </div>
          </div>

          {/* Minimal inline metrics strip (Zero double-borders, crisp hairlines) */}
          <div className="api-min-metrics-strip" aria-label="Key Weave365 Metrics">
            <div className="api-min-metric">
              <span className="api-min-metric-val">200+</span>
              <span className="api-min-metric-lbl">Varanasi Weavers</span>
            </div>
            <div className="api-min-metric-divider" aria-hidden="true" />
            <div className="api-min-metric">
              <span className="api-min-metric-val">1 Piece</span>
              <span className="api-min-metric-lbl">No Minimum Order</span>
            </div>
            <div className="api-min-metric-divider" aria-hidden="true" />
            <div className="api-min-metric">
              <span className="api-min-metric-val">100%</span>
              <span className="api-min-metric-lbl">Blind White-Label</span>
            </div>
            <div className="api-min-metric-divider" aria-hidden="true" />
            <div className="api-min-metric">
              <span className="api-min-metric-val">40+</span>
              <span className="api-min-metric-lbl">Countries Shipped</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          Core Capabilities: Clean Editorial Grid (Full-bleed hairline top)
          -------------------------------------------------------------------- */}
      <section className="api-min-section-wrap" aria-labelledby="capabilities-title">
        <div className="api-min-section">
          <div className="api-min-section-header">
            <h2 id="capabilities-title">Commerce primitives for modern fashion retailers</h2>
            <p>Everything you need to automate catalog synchronization, stock checks, and blind fulfillment.</p>
          </div>

          <div className="api-min-features-grid">
            <div className="api-min-feature-item">
              <h3>Real-Time Catalog Sync</h3>
              <p>Access high-resolution model photography, zari weave specifications, fabric details, and real-time wholesale reseller rates.</p>
            </div>
            <div className="api-min-feature-item">
              <h3>Live Loom Verification</h3>
              <p>Sub-40ms stock queries directly against Varanasi weaving clusters to verify availability before capturing customer payments.</p>
            </div>
            <div className="api-min-feature-item">
              <h3>Automated Dropshipping</h3>
              <p>Submit wholesale orders programmatically. Varanasi master weavers package and dispatch parcels with your custom white-label packing slip.</p>
            </div>
            <div className="api-min-feature-item">
              <h3>Courier Tracking</h3>
              <p>Live AWB tracking numbers, carrier details (Delhivery, Bluedart, Xpressbees), and milestone updates via <code>GET /orders</code>.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          Supported Platforms: Clean Minimal Cards (Full-bleed hairline top)
          -------------------------------------------------------------------- */}
      <section className="api-min-section-wrap" aria-labelledby="platforms-title">
        <div className="api-min-section">
          <div className="api-min-section-header">
            <h2 id="platforms-title">Seamless platform integrations</h2>
            <p>Connect your existing storefront or build bespoke workflows with standard REST JSON.</p>
          </div>

          <div className="api-min-platforms-grid">
            {PLATFORMS.map((platform) => (
              <div key={platform.name} className="api-min-platform-card">
                <div className="api-min-platform-head">
                  <span className="api-min-platform-name">{platform.name}</span>
                  <span className="api-min-platform-tag">{platform.tag}</span>
                </div>
                <p className="api-min-platform-desc">{platform.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          REST Endpoints: Monospace Clean List (Full-bleed hairline top)
          -------------------------------------------------------------------- */}
      <section className="api-min-section-wrap" aria-labelledby="endpoints-title">
        <div className="api-min-section">
          <div className="api-min-section-header">
            <h2 id="endpoints-title">Core REST Endpoints</h2>
            <p>Clean, predictable endpoints optimized for low latency and zero payload overhead.</p>
          </div>

          <div className="api-min-endpoints-list">
            {CORE_ENDPOINTS.map((endpoint, idx) => (
              <div key={idx} className="api-min-endpoint-row">
                <span className={`api-min-verb ${endpoint.method.toLowerCase()}`}>
                  {endpoint.method}
                </span>
                <code className="api-min-path">{endpoint.path}</code>
                <span className="api-min-desc">{endpoint.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          Transparent Pricing: Minimal 2-Column Comparison (Full-bleed hairline top)
          -------------------------------------------------------------------- */}
      <section className="api-min-section-wrap" aria-labelledby="pricing-title">
        <div className="api-min-section">
          <div className="api-min-section-header">
            <h2 id="pricing-title">Simple, transparent pricing</h2>
            <p>Select the plan matched to your store&apos;s monthly sync and dropship order volume.</p>
          </div>

          <div className="api-min-pricing-wrap">
            <div className="api-min-pricing-card">
              <div className="api-min-pricing-head">
                <div>
                  <h3>Growth Partner</h3>
                  <p>For stores syncing live stock &amp; catalog feeds.</p>
                </div>
                <div className="api-min-price">
                  <span className="amount">₹299</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="api-min-pricing-list">
                <li>10,000 API requests / month (3 req/sec)</li>
                <li>Full B2R catalog feed access (<code>/catalog</code>)</li>
                <li>Real-time stock status sync (<code>/stock-status</code>)</li>
                <li>WooCommerce Plugin (.zip) &amp; Shopify feed compatibility</li>
                <li>Standard B2R wholesale pricing</li>
              </ul>
              <a href="/account?tab=developer" className="api-btn-outline">
                Activate Growth Plan
              </a>
            </div>

            <div className="api-min-pricing-card featured">
              <div className="api-min-pricing-head">
                <div>
                  <h3>Pro Scale</h3>
                  <p>Full automation: Catalog Sync + Dropship Orders API.</p>
                </div>
                <div className="api-min-price">
                  <span className="amount">₹499</span>
                  <span className="period">/mo</span>
                </div>
              </div>
              <ul className="api-min-pricing-list">
                <li>25,000 API requests / month (5 req/sec)</li>
                <li>Automated dropship Orders API (<code>/orders</code>)</li>
                <li>Everything included in Growth Partner</li>
                <li>Priority Varanasi loom dispatch queue</li>
                <li>Dedicated technical account manager</li>
              </ul>
              <a href="/account?tab=developer" className="api-btn-dark">
                Activate Pro Scale
              </a>
            </div>
          </div>

          <p className="api-min-enterprise-note">
            Need higher request quotas or custom ERP integration? <a href="/contact">Talk to our enterprise team &rarr;</a>
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          Accessible Minimal FAQ Accordion (Full-bleed hairline top)
          -------------------------------------------------------------------- */}
      <section className="api-min-section-wrap" aria-labelledby="faq-title">
        <div className="api-min-section">
          <div className="api-min-section-header">
            <h2 id="faq-title">Frequently asked questions</h2>
          </div>

          <section className="accordion api-min-faq-list" aria-labelledby="faq-title">
            <details className="api-min-faq-item">
              <summary className="api-min-faq-summary">
                <span>How do I get access to an API key?</span>
                <span className="api-min-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="api-min-faq-body">
                <p>
                  Sign up for a free Weave365 reseller account and navigate to the <strong>Developer</strong> tab in your account dashboard. You can generate both sandbox test credentials (<code>w365_test_...</code>) and live production keys (<code>w365_live_...</code>) immediately.
                </p>
              </div>
            </details>

            <details className="api-min-faq-item">
              <summary className="api-min-faq-summary">
                <span>Can I connect Shopify or WooCommerce without writing custom backend code?</span>
                <span className="api-min-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="api-min-faq-body">
                <p>
                  Yes. For <strong>Shopify</strong>, we provide pre-formatted JSON and CSV feed URLs compatible with <strong>SyncX</strong>, <strong>Stock Sync</strong>, and <strong>Matrixify</strong>, plus native webhook order forwarding. For <strong>WooCommerce</strong>, our official <strong>v1.2.0 WordPress plugin (.zip)</strong> provides one-click 22-column catalog CSV export with custom markup and rounding, hourly stock sync, live Classic &amp; Blocks checkout protection, HPOS support, and optional automated order forwarding with zero coding.
                </p>
              </div>
            </details>

            <details className="api-min-faq-item">
              <summary className="api-min-faq-summary">
                <span>Does the customer know the parcel came from Weave365?</span>
                <span className="api-min-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="api-min-faq-body">
                <p>
                  No. All dropship orders dispatched through the API feature 100% white-label packaging. The courier dispatch slip displays your store name as the sender, your customer&apos;s retail purchase price, and includes zero Weave365 branding.
                </p>
              </div>
            </details>

            <details className="api-min-faq-item">
              <summary className="api-min-faq-summary">
                <span>How does live loom stock verification work?</span>
                <span className="api-min-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="api-min-faq-body">
                <p>
                  Our <code>GET /stock-status</code> endpoint updates continuously with Varanasi loom production status. If an order is submitted for a SKU that is exhausted, the API immediately returns a <code>409 Conflict</code> with the estimated loom replenishment date to prevent unexpected billing.
                </p>
              </div>
            </details>

            <details className="api-min-faq-item">
              <summary className="api-min-faq-summary">
                <span>What rate limits and monthly quotas apply?</span>
                <span className="api-min-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="api-min-faq-body">
                <p>
                  The Growth Partner plan (₹299/mo) provides 10,000 requests per month (3 req/sec), ideal for automated catalog and stock syncing. The Pro Scale plan (₹499/mo) provides 25,000 requests per month (5 req/sec), including full automated dropship order placement.
                </p>
              </div>
            </details>
          </section>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          Refined Minimal Footer CTA (Full-bleed hairline top)
          -------------------------------------------------------------------- */}
      <section className="api-min-footer-cta-wrap" aria-labelledby="cta-title">
        <div className="api-min-footer-cta">
          <h2 id="cta-title">Start sourcing handlooms via API</h2>
          <p>Generate your API credentials and start syncing your store in minutes.</p>
          <div className="api-min-hero-actions">
            <a href="/account?tab=developer" className="api-btn-dark">
              Get API Key
            </a>
            {onSwitchToDocs && (
              <button type="button" className="api-btn-light" onClick={onSwitchToDocs}>
                Read Documentation
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
