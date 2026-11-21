/**
 * @file DeveloperApiDocPage.jsx
 * @description Minimalist, Clean Developer API Documentation & Integration Guide
 * Features a flat, modern layout without nested cards or box-within-box clutter.
 * Includes easy step-by-step guides for SyncX and Matrixify.
 * 
 * @module views/DeveloperApiDocPage
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
  Zap,
  KeyRound,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ArrowUpIcon,
  ShoppingBag,
  Sliders,
  DollarSign,
  FileCode2,
  Sparkles,
  BookOpen,
  Settings,
  FileSpreadsheet
} from '../components/icons.jsx';
import '../styles/developerApiDoc.css';

const NAV_GROUPS = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview', icon: BookOpen },
      { id: 'quickstart', label: '3-Step Integration', icon: Sparkles },
      { id: 'authentication', label: 'Authentication', icon: KeyRound },
    ],
  },
  {
    title: 'Storefront Feeds',
    items: [
      { id: 'shopify-sync', label: 'Shopify (SyncX & Matrixify)', icon: ShoppingBag },
      { id: 'curated-catalog', label: 'Curated Catalog Sync', icon: Sliders },
      { id: 'platforms', label: 'Other Platforms (Woo, cURL)', icon: Layers },
    ],
  },
  {
    title: 'API Endpoints',
    items: [
      { id: 'endpoint-catalog', label: 'GET /catalog', method: 'GET' },
      { id: 'endpoint-stock', label: 'GET /stock-status', method: 'GET' },
      { id: 'endpoint-product', label: 'GET /products/:sku', method: 'GET' },
      { id: 'endpoint-order', label: 'POST /orders', method: 'POST' },
      { id: 'endpoint-get-orders', label: 'GET /orders', method: 'GET' },
      { id: 'endpoint-me', label: 'GET /me', method: 'GET' },
    ],
  },
  {
    title: 'Platform Reference',
    items: [
      { id: 'rate-limits', label: 'Rate Limits & Quota', icon: Zap },
      { id: 'pricing', label: 'Subscription Tiers', icon: DollarSign },
      { id: 'dashboard-guide', label: 'Developer Dashboard', icon: Settings },
    ],
  },
];

const SECTION_IDS = [
  'overview',
  'quickstart',
  'authentication',
  'shopify-sync',
  'curated-catalog',
  'platforms',
  'endpoint-catalog',
  'endpoint-stock',
  'endpoint-product',
  'endpoint-order',
  'endpoint-get-orders',
  'endpoint-me',
  'rate-limits',
  'pricing',
  'dashboard-guide',
];

export default function DeveloperApiDocPage({ onSwitchToLanding }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeShopifyTab, setActiveShopifyTab] = useState('syncx'); // 'syncx' | 'matrixify'
  const [activePlatformTab, setActivePlatformTab] = useState('woocommerce'); // 'woocommerce' | 'prestashop' | 'nodejs' | 'curl'
  const [activeSection, setActiveSection] = useState('overview');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      setShowScrollTop(window.scrollY > 400);

      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTION_IDS[i]);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(SECTION_IDS[i]);
          return;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="api-docs-page">
      {/* Mobile Horizontal Navigation Chips */}
      <nav className="api-mobile-toc" aria-label="Mobile Table of Contents">
        <div className="api-mobile-toc-scroll">
          {SECTION_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={`api-mobile-toc-chip ${activeSection === id ? 'active' : ''}`}
              onClick={() => scrollToSection(id)}
            >
              {id === 'shopify-sync' ? 'Shopify Sync' : id.replace('endpoint-', '/').replace('-', ' ')}
            </button>
          ))}
        </div>
      </nav>

      <div className="api-docs-container">
        {/* Sticky Desktop Left Navigation Sidebar */}
        <aside className="api-sidebar-wrapper">
          <div className="api-sidebar">
            {onSwitchToLanding && (
              <button type="button" onClick={onSwitchToLanding} className="api-sidebar-back-btn">
                &larr; Back to Portal
              </button>
            )}

            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="api-sidebar-group">
                <div className="api-sidebar-title">{group.title}</div>
                <ul className="api-sidebar-nav">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            scrollToSection(item.id);
                          }}
                          className={`api-sidebar-link ${isActive ? 'active' : ''}`}
                        >
                          <span>{item.label}</span>
                          {item.method && (
                            <span className={`api-sidebar-badge ${item.method.toLowerCase()}`}>
                              {item.method}
                            </span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Stream */}
        <main className="api-main-content">
          {/* Header */}
          <header className="api-header">
            <div className="api-breadcrumbs">
              {onSwitchToLanding ? (
                <button type="button" onClick={onSwitchToLanding} className="api-breadcrumb-link">
                  Developer Portal
                </button>
              ) : (
                <span>Developer Portal</span>
              )}
              <span className="api-breadcrumb-sep">/</span>
              <span className="api-breadcrumb-current">Documentation &amp; Integration Guide</span>
            </div>

            <div className="api-title-row">
              <h1 className="api-main-title">Weave365 Developer API</h1>
              <div className="api-badges-row">
                <span className="api-pill live">v1.0 Production</span>
                <span className="api-pill">REST / JSON / CSV</span>
                <span className="api-pill">&lt;1ms Edge Cache</span>
              </div>
            </div>

            <p className="api-lead-text">
              High-speed B2B catalog syncing, sub-millisecond stock verification, and dropship order dispatch for Shopify, WooCommerce, PrestaShop, and custom web applications.
            </p>

            <div className="api-header-actions">
              <a href="/account" className="api-btn primary">
                Open Developer Dashboard &rarr;
              </a>
              <button
                type="button"
                className="api-btn secondary"
                onClick={() => copyToClipboard('https://www.weave365.com/api/v1', 'base-url')}
              >
                {copiedKey === 'base-url' ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey === 'base-url' ? 'Base URL Copied' : 'https://www.weave365.com/api/v1'}</span>
              </button>
            </div>
          </header>

          {/* 1. Overview */}
          <section id="overview" className="api-section">
            <h2 className="api-section-title">Overview</h2>
            <p className="api-section-desc">
              The Weave365 REST API connects your boutique or e-commerce storefront directly to our Varanasi handloom &amp; powerloom warehouse. 
              Catalog feeds provide reseller wholesale pricing (B2R), authentic fabric specifications, high-resolution imagery, and color variant groupings.
            </p>

            <div className="api-table-scroll">
              <table className="api-flat-table">
                <thead>
                  <tr>
                    <th>Specification</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Base URL</strong></td>
                    <td><code>https://www.weave365.com/api/v1</code></td>
                  </tr>
                  <tr>
                    <td><strong>Data Formats</strong></td>
                    <td>JSON (REST endpoints &amp; SyncX), CSV (Matrixify &amp; Shopify Native Importer)</td>
                  </tr>
                  <tr>
                    <td><strong>Authentication</strong></td>
                    <td>API Key via <code>X-API-Key</code> header, <code>Authorization: Bearer</code>, or <code>?key=</code> query param</td>
                  </tr>
                  <tr>
                    <td><strong>Edge Performance</strong></td>
                    <td>Global Cloudflare CDN caching; sub-0.5ms stock status lookups with 0ms database lag</td>
                  </tr>
                  <tr>
                    <td><strong>Wholesale Pricing</strong></td>
                    <td>Strictly Reseller B2R wholesale prices. Master B2B bulk manufacturing costs are securely shielded</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Quickstart */}
          <section id="quickstart" className="api-section">
            <h2 className="api-section-title">3-Step Integration</h2>
            <p className="api-section-desc">
              Connect your store to Weave365 catalog and start retailing Banarasi sarees in under 3 minutes:
            </p>

            <div className="api-clean-steps">
              <div className="api-step-row">
                <span className="api-step-circle">1</span>
                <div className="api-step-content">
                  <h3 className="api-step-heading">Get Your Secret API Key</h3>
                  <p className="api-step-body">
                    Sign in to your Weave365 account, go to the <strong>Developer API</strong> tab, and generate your live key (e.g. <code>w365_live_...</code>).
                  </p>
                </div>
              </div>

              <div className="api-step-row">
                <span className="api-step-circle">2</span>
                <div className="api-step-content">
                  <h3 className="api-step-heading">Connect Your Storefront</h3>
                  <p className="api-step-body">
                    For <strong>Shopify</strong>, choose either <strong>SyncX</strong> (real-time automated JSON feed) or <strong>Matrixify</strong> (Shopify standard CSV). 
                    For <strong>WooCommerce</strong> or custom backends, connect via REST endpoints or our PHP cron script.
                  </p>
                </div>
              </div>

              <div className="api-step-row">
                <span className="api-step-circle">3</span>
                <div className="api-step-content">
                  <h3 className="api-step-heading">Automate Dropship Order Dispatch</h3>
                  <p className="api-step-body">
                    When an order occurs on your website, forward the customer address and SKU to <code>POST /api/v1/orders</code>. 
                    We pack in plain white-label boxes and dispatch directly to your client within 24-48 business hours.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Authentication */}
          <section id="authentication" className="api-section">
            <h2 className="api-section-title">Authentication</h2>
            <p className="api-section-desc">
              Authenticate requests using your private API key. We support three clean authentication methods:
            </p>

            <div className="api-table-scroll">
              <table className="api-flat-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Example</th>
                    <th>Best Used For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Query Parameter</strong></td>
                    <td><code>?key=w365_live_...</code></td>
                    <td>Shopify SyncX, Matrixify, and automated feed crawlers</td>
                  </tr>
                  <tr>
                    <td><strong>Custom Header</strong></td>
                    <td><code>X-API-Key: w365_live_...</code></td>
                    <td>Backend microservices, Webhooks &amp; Node.js applications</td>
                  </tr>
                  <tr>
                    <td><strong>Bearer Token</strong></td>
                    <td><code>Authorization: Bearer w365_live_...</code></td>
                    <td>Standard HTTP clients, Postman &amp; cURL</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="api-code-block">
              <div className="api-code-topbar">
                <span className="api-code-label">cURL Example</span>
                <button
                  type="button"
                  className="api-code-copy-btn"
                  onClick={() => copyToClipboard(`curl -X GET "https://www.weave365.com/api/v1/catalog.json?key=w365_live_YOUR_API_KEY"`, 'curl-auth')}
                >
                  {copiedKey === 'curl-auth' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'curl-auth' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="api-code-content">{`curl -X GET "https://www.weave365.com/api/v1/catalog.json?key=w365_live_YOUR_API_KEY"`}</pre>
            </div>
          </section>

          {/* 4. Shopify Integrations (SyncX & Matrixify) */}
          <section id="shopify-sync" className="api-section">
            <h2 className="api-section-title">Shopify Storefront Integration</h2>
            <p className="api-section-desc">
              Connect your Shopify store using <strong>Stock Sync (SyncX)</strong> for automated real-time inventory updates, or <strong>Matrixify / Native CSV</strong> for spreadsheet imports.
            </p>

            <div className="api-note-text">
              <strong>Why Stock Sync (SyncX) is recommended over Matrixify:</strong>
              <br />
              • <strong>Free for up to 2,000 SKUs:</strong> Stock Sync includes automated hourly and daily scheduling on its free plan, whereas Matrixify&apos;s Demo plan is strictly limited to 10 products per import.
              <br />
              • <strong>Dedicated Stock Automation:</strong> SyncX runs in seconds, specifically refreshing quantities and prices without re-processing entire product sheets.
            </div>

            {/* Clean, Flat Tabs */}
            <div className="api-tabs-nav">
              <button
                type="button"
                className={`api-tab-btn ${activeShopifyTab === 'syncx' ? 'active' : ''}`}
                onClick={() => setActiveShopifyTab('syncx')}
              >
                <span>Stock Sync (SyncX) — Recommended</span>
              </button>
              <button
                type="button"
                className={`api-tab-btn ${activeShopifyTab === 'matrixify' ? 'active' : ''}`}
                onClick={() => setActiveShopifyTab('matrixify')}
              >
                <span>Matrixify &amp; Native CSV (Alternative)</span>
              </button>
            </div>

            {/* TAB 1: SyncX / Stock Sync */}
            {activeShopifyTab === 'syncx' && (
              <div>
                <p className="api-text">
                  Stock Sync consumes our real-time REST API feed. Copy your dedicated feed URL below:
                </p>

                <div className="api-feed-box">
                  <span className="api-feed-method">REST JSON</span>
                  <input
                    type="text"
                    readOnly
                    value="https://www.weave365.com/api/v1/catalog.json?key=w365_live_YOUR_API_KEY&format=syncx"
                    className="api-feed-input"
                  />
                  <button
                    type="button"
                    className={`api-feed-copy-btn ${copiedKey === 'syncx-feed' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard('https://www.weave365.com/api/v1/catalog.json?key=w365_live_YOUR_API_KEY&format=syncx', 'syncx-feed')}
                  >
                    {copiedKey === 'syncx-feed' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'syncx-feed' ? 'Copied' : 'Copy Feed URL'}</span>
                  </button>
                </div>

                {/* Phase 1: Initial Import with "Add" */}
                <h3 className="api-sub-title" style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                  Step 1: Initial Product Import (Using &quot;Add&quot;)
                </h3>
                <p className="api-text">
                  When starting with a new store, use Stock Sync&apos;s <strong>&quot;Add&quot;</strong> feed to create all sarees, color variants, photos, descriptions, and disclaimers.
                </p>

                <div className="api-clean-steps">
                  <div className="api-step-row">
                    <span className="api-step-circle">1</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Create Feed &rarr; Select &quot;Add&quot;</h4>
                      <p className="api-step-body">
                        In your Shopify admin, open <strong>syncX: Stock Sync</strong> &rarr; Click <strong>Create new feed</strong> &rarr; Select <strong>Add</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">2</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Source: REST API / Download from URL</h4>
                      <p className="api-step-body">
                        Choose <strong>REST API / Download from URL</strong> as the connection method &rarr; Paste your dedicated SyncX Feed URL above &rarr; Click <strong>Next</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">3</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Map Product &amp; Variant Fields</h4>
                      <p className="api-step-body">
                        Map the feed columns into your Shopify store fields:
                        <br />
                        • <strong>SKU:</strong> <code>sku</code>
                        <br />
                        • <strong>Title:</strong> <code>title</code>
                        <br />
                        • <strong>Description:</strong> <code>description</code> (includes Authenticity &amp; bold Disclaimer)
                        <br />
                        • <strong>Price:</strong> <code>price</code> (or apply your retail markup)
                        <br />
                        • <strong>Quantity:</strong> <code>quantity</code>
                        <br />
                        • <strong>Images:</strong> <code>images</code> (set delimiter to comma <code>,</code> in Smart Settings)
                        <br />
                        • <strong>Variant Grouping:</strong> Under <em>Combine rows into one product</em>, map Handle to <code>handle</code> and Option 1 (Color) to <code>color</code>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">4</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Run Initial Import</h4>
                      <p className="api-step-body">
                        Click <strong>Finish</strong> and run the feed once. Stock Sync will create all products and color swatches in your Shopify catalog.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phase 2: Ongoing Stock Sync with "Update" */}
                <h3 className="api-sub-title" style={{ marginTop: '2.5rem', marginBottom: '0.5rem' }}>
                  Step 2: Ongoing Stock &amp; Badge Sync (Using &quot;Update&quot;)
                </h3>
                <p className="api-text">
                  Once products exist in your store, create a second feed using <strong>&quot;Update&quot;</strong> mode. This continuously refreshes inventory counts and manages stock badges (<em>&quot;In Stock&quot;</em> / <em>&quot;Sold Out&quot;</em>) without risk of creating duplicate products.
                </p>

                <div className="api-clean-steps">
                  <div className="api-step-row">
                    <span className="api-step-circle">1</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Create Feed &rarr; Select &quot;Update&quot; (Most Popular)</h4>
                      <p className="api-step-body">
                        In Stock Sync, click <strong>Create new feed</strong> &rarr; Select <strong>Update</strong>.
                      </p>
                      <p className="api-step-subnote">
                        <strong>Why Update?</strong> Since products already exist in your store, &quot;Update&quot; matches items by SKU and updates only the live stock availability without creating duplicate listings or disturbing custom collections.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">2</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Source: REST API / Download from URL</h4>
                      <p className="api-step-body">
                        Choose <strong>REST API / Download from URL</strong> as the connection method &rarr; Paste your SyncX Feed URL &rarr; Click <strong>Next</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">3</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Store Product Filters (Keep Defaults)</h4>
                      <p className="api-step-body">
                        On the <em>Store product filter</em> screen:
                        <br />
                        • Leave <strong>Store field name: Published</strong> as <code>Equal to: Any</code>.
                        <br />
                        • Leave all 3 toggle switches turned <strong>OFF</strong> (ensures Stock Sync can update items both when they sell out to 0 and when restocked).
                        <br />
                        • Click <strong>Next</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">4</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Map Matching &amp; Inventory Columns</h4>
                      <p className="api-step-body">
                        In <strong>Matching column</strong>, map:
                        <br />
                        • <strong>SKU (Matching Field):</strong> <code>sku</code>
                        <br />
                        • <strong>Quantity (Inventory):</strong> <code>quantity</code>
                        <br />
                        • <strong>Price (Optional):</strong> <code>price</code> (optional retail price updates)
                        <br />
                        • Click <strong>Next</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">5</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Advanced Settings (Crucial for Stock Badges)</h4>
                      <p className="api-step-body">
                        On the <em>Step 4: Advanced settings</em> screen:
                        <br />
                        • <strong>Auto publish:</strong> Select <strong><code>Publish</code></strong> &mdash; Automatically makes items active and purchasable when stock is available (&gt; 0).
                        <br />
                        • <strong>Auto unpublish / archive:</strong> Select <strong><code>No action</code></strong> &mdash; Keeps the product page active so your Shopify theme displays the <strong>&quot;Sold Out&quot;</strong> badge while preserving SEO.
                        <br />
                        • <strong>Out of stock strategy:</strong> Keep <strong><code>OFF</code></strong>.
                        <br />
                        • Click the dark <strong>Finish &rarr;</strong> button at the top right.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">6</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Set Automated Schedule &amp; Price Markup</h4>
                      <p className="api-step-body">
                        Under <strong>Schedule</strong>, select your update frequency (e.g. <em>Every 1 hour</em> or <em>Daily at 08:00 AM</em>).
                        <br />
                        To add a standard +30% retail margin on wholesale prices, click <strong>Edit / Smart Settings</strong> on the Price field and paste:
                      </p>
                      <div className="api-code-block">
                        <div className="api-code-topbar">
                          <span className="api-code-label">Liquid Price Markup (+30%)</span>
                          <button
                            type="button"
                            className="api-code-copy-btn"
                            onClick={() => copyToClipboard(`{{ data | jmespath: '"price"' | times: 1.3 | round: 2 }}`, 'syncx-markup')}
                          >
                            {copiedKey === 'syncx-markup' ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedKey === 'syncx-markup' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="api-code-content">{`{{ data | jmespath: '"price"' | times: 1.3 | round: 2 }}`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Matrixify / CSV */}
            {activeShopifyTab === 'matrixify' && (
              <div>
                <p className="api-text">
                  Direct CSV feed formatted to official Shopify product specifications. Compatible with Matrixify and Shopify&apos;s native product importer.
                </p>

                <div className="api-feed-box">
                  <span className="api-feed-method">SHOPIFY CSV</span>
                  <input
                    type="text"
                    readOnly
                    value="https://www.weave365.com/api/v1/catalog.csv?key=w365_live_YOUR_API_KEY&format=matrixify"
                    className="api-feed-input"
                  />
                  <button
                    type="button"
                    className={`api-feed-copy-btn ${copiedKey === 'matrixify-feed' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard('https://www.weave365.com/api/v1/catalog.csv?key=w365_live_YOUR_API_KEY&format=matrixify', 'matrixify-feed')}
                  >
                    {copiedKey === 'matrixify-feed' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedKey === 'matrixify-feed' ? 'Copied' : 'Copy CSV URL'}</span>
                  </button>
                </div>

                <div className="api-clean-steps">
                  <div className="api-step-row">
                    <span className="api-step-circle subtle">1</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Open Matrixify in Shopify Admin</h4>
                      <p className="api-step-body">
                        In your Shopify admin, open the <strong>Matrixify</strong> app.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle subtle">2</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Paste Feed URL or Upload CSV</h4>
                      <p className="api-step-body">
                        Matrixify gives you two easy ways to import:
                        <br />
                        • <strong>Automated Import (From URL — Recommended):</strong> In Matrixify, click <strong>&quot;From URL&quot;</strong> &rarr; Paste your CSV Feed URL above (ensure it includes <code>?key=YOUR_KEY</code>) &rarr; Click <strong>Upload from URL</strong>.
                        <br />
                        • <strong>Manual File Import:</strong> Open the CSV Feed URL directly in your browser to download <code>weave365-catalog.csv</code> &rarr; Drag and drop the downloaded file directly into Matrixify.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle subtle">3</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Select Entity &rarr; Choose &quot;Products&quot;</h4>
                      <p className="api-step-body">
                        When Matrixify loads the feed, it displays <strong>&quot;Sheets require entity selection&quot;</strong> with a <em>Select Entity</em> dropdown.
                        <br />
                        Click the dropdown and select <strong>Products</strong> (the very first option at the top). Matrixify will automatically recognize all standard Shopify columns (Handle, Title, Color variants, SKU, Price, and Images).
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle subtle">4</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Click &quot;Import&quot; or Set Automated Schedule</h4>
                      <p className="api-step-body">
                        Once <strong>Products</strong> is selected, the blue <strong>Import</strong> button at the bottom right becomes active. Click <strong>Import</strong> to begin syncing.
                        <br />
                        • <strong>Automated Scheduled Sync:</strong> Under <strong>Options &rarr; Scheduling</strong>, choose daily or hourly sync. Matrixify will automatically pull fresh inventory counts and newly released sarees periodically.
                        <br />
                        • <em>Native Shopify Tip: You can also drag and drop this same <code>weave365-catalog.csv</code> file into Shopify&apos;s native <strong>Products &rarr; Import</strong> tool without any third-party app!</em>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 5. Curated Catalog Selection */}
          <section id="curated-catalog" className="api-section">
            <h2 className="api-section-title">Curated Catalog Selection</h2>
            <p className="api-section-desc">
              By default, feeds include the entire Weave365 catalog. If you only want to curate specific saree designs for your boutique, use one of these two methods:
            </p>

            <div className="api-clean-steps">
              <div className="api-step-row">
                <span className="api-step-circle subtle">A</span>
                <div className="api-step-content">
                  <h4 className="api-step-heading">Dashboard Visual Selection (Recommended)</h4>
                  <p className="api-step-body">
                    In your Weave365 Developer Dashboard &rarr; <strong>Curated Catalog</strong> tab &rarr; Switch mode from &quot;Full Warehouse&quot; to <strong>&quot;Curated Product Selection&quot;</strong>. 
                    Search and pick the exact SKUs you want. Your API key will instantly and securely serve only your selected products without changing any URLs.
                  </p>
                </div>
              </div>

              <div className="api-step-row">
                <span className="api-step-circle subtle">B</span>
                <div className="api-step-content">
                  <h4 className="api-step-heading">URL Query Filter</h4>
                  <p className="api-step-body">
                    Pass specific product codes in the query string:
                    <code>https://www.weave365.com/api/v1/catalog.json?key=YOUR_KEY&amp;skus=102001,102005,102012</code>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Other Platform Connectors */}
          <section id="platforms" className="api-section">
            <h2 className="api-section-title">Other Platform Integrations</h2>
            <p className="api-section-desc">
              Pre-built scripts for WooCommerce, PrestaShop, Node.js, and cURL:
            </p>

            <div className="api-tabs-nav">
              <button
                type="button"
                className={`api-tab-btn ${activePlatformTab === 'woocommerce' ? 'active' : ''}`}
                onClick={() => setActivePlatformTab('woocommerce')}
              >
                <FileCode2 size={14} />
                <span>WooCommerce (WordPress)</span>
              </button>
              <button
                type="button"
                className={`api-tab-btn ${activePlatformTab === 'prestashop' ? 'active' : ''}`}
                onClick={() => setActivePlatformTab('prestashop')}
              >
                <Layers size={14} />
                <span>PrestaShop</span>
              </button>
              <button
                type="button"
                className={`api-tab-btn ${activePlatformTab === 'nodejs' ? 'active' : ''}`}
                onClick={() => setActivePlatformTab('nodejs')}
              >
                <Terminal size={14} />
                <span>Node.js / JS</span>
              </button>
              <button
                type="button"
                className={`api-tab-btn ${activePlatformTab === 'curl' ? 'active' : ''}`}
                onClick={() => setActivePlatformTab('curl')}
              >
                <Code2 size={14} />
                <span>cURL / Shell</span>
              </button>
            </div>

            {activePlatformTab === 'woocommerce' && (
              <div>
                <p className="api-text">Add this snippet to your child theme&apos;s <code>functions.php</code> to schedule automated hourly stock synchronization:</p>
                <div className="api-code-block">
                  <div className="api-code-topbar">
                    <span className="api-code-label">functions.php (WooCommerce Sync)</span>
                    <button
                      type="button"
                      className="api-code-copy-btn"
                      onClick={() => copyToClipboard(`add_action('weave365_hourly_sync', 'weave365_sync_stock');
function weave365_sync_stock() {
  $res = wp_remote_get('https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY');
  if (is_wp_error($res)) return;
  $data = json_decode(wp_remote_retrieve_body($res), true);
  if (!isset($data['stock_map'])) return;
  foreach ($data['stock_map'] as $sku => $stock) {
    $id = wc_get_product_id_by_sku($sku);
    if ($id) {
      $p = wc_get_product($id);
      $p->set_stock_quantity($stock['quantity']);
      $p->set_stock_status($stock['in_stock'] ? 'instock' : 'outofstock');
      $p->save();
    }
  }
}`, 'woo-snippet')}
                    >
                      {copiedKey === 'woo-snippet' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'woo-snippet' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="api-code-content">{`add_action('weave365_hourly_sync', 'weave365_sync_stock');
function weave365_sync_stock() {
  $res = wp_remote_get('https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY');
  if (is_wp_error($res)) return;
  $data = json_decode(wp_remote_retrieve_body($res), true);
  if (!isset($data['stock_map'])) return;
  foreach ($data['stock_map'] as $sku => $stock) {
    $id = wc_get_product_id_by_sku($sku);
    if ($id) {
      $p = wc_get_product($id);
      $p->set_stock_quantity($stock['quantity']);
      $p->set_stock_status($stock['in_stock'] ? 'instock' : 'outofstock');
      $p->save();
    }
  }
}`}</pre>
                </div>
              </div>
            )}

            {activePlatformTab === 'prestashop' && (
              <div>
                <p className="api-text">Run via PrestaShop Cron to synchronize quantities across your catalog:</p>
                <div className="api-code-block">
                  <div className="api-code-topbar">
                    <span className="api-code-label">prestashop_sync.php</span>
                    <button
                      type="button"
                      className="api-code-copy-btn"
                      onClick={() => copyToClipboard(`$url = 'https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY';
$json = file_get_contents($url);
$data = json_decode($json, true);
foreach ($data['stock_map'] as $sku => $info) {
  $id = Product::getIdByReference($sku);
  if ($id) StockAvailable::setQuantity($id, 0, $info['quantity']);
}`, 'presta-snippet')}
                    >
                      {copiedKey === 'presta-snippet' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'presta-snippet' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="api-code-content">{`$url = 'https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY';
$json = file_get_contents($url);
$data = json_decode($json, true);
foreach ($data['stock_map'] as $sku => $info) {
  $id = Product::getIdByReference($sku);
  if ($id) StockAvailable::setQuantity($id, 0, $info['quantity']);
}`}</pre>
                </div>
              </div>
            )}

            {activePlatformTab === 'nodejs' && (
              <div>
                <p className="api-text">Native JavaScript / Node.js fetch with error handling:</p>
                <div className="api-code-block">
                  <div className="api-code-topbar">
                    <span className="api-code-label">syncCatalog.js</span>
                    <button
                      type="button"
                      className="api-code-copy-btn"
                      onClick={() => copyToClipboard(`const response = await fetch('https://www.weave365.com/api/v1/catalog', {
  headers: {
    'X-API-Key': process.env.WEAVE365_API_KEY,
  },
});
const data = await response.json();
console.log('Total live products:', data.total_products);`, 'node-snippet')}
                    >
                      {copiedKey === 'node-snippet' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'node-snippet' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="api-code-content">{`const response = await fetch('https://www.weave365.com/api/v1/catalog', {
  headers: {
    'X-API-Key': process.env.WEAVE365_API_KEY,
  },
});
const data = await response.json();
console.log('Total live products:', data.total_products);`}</pre>
                </div>
              </div>
            )}

            {activePlatformTab === 'curl' && (
              <div>
                <p className="api-text">Quick shell inspection with HTTP headers and jq formatting:</p>
                <div className="api-code-block">
                  <div className="api-code-topbar">
                    <span className="api-code-label">Terminal / Bash</span>
                    <button
                      type="button"
                      className="api-code-copy-btn"
                      onClick={() => copyToClipboard(`curl -s "https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY" | jq .`, 'curl-snippet')}
                    >
                      {copiedKey === 'curl-snippet' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedKey === 'curl-snippet' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="api-code-content">{`curl -s "https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY" | jq .`}</pre>
                </div>
              </div>
            )}
          </section>

          {/* 7. API Endpoints Reference */}
          <section id="endpoints-ref" className="api-section">
            <h2 className="api-section-title">API Endpoints Reference</h2>
            <p className="api-section-desc">
              All endpoints operate over HTTPS with authenticated access. Standard response code is <code>200 OK</code>.
            </p>

            {/* ENDPOINT 1: GET /catalog */}
            <div id="endpoint-catalog" className="api-endpoint-item">
              <div className="api-endpoint-header-row">
                <span className="api-method-badge get">GET</span>
                <span className="api-endpoint-path">/api/v1/catalog</span>
              </div>
              <p className="api-endpoint-summary">
                Fetches paginated B2R wholesale catalog items. Supports JSON, SyncX flat format, and Matrixify CSV.
              </p>

              <div className="api-table-scroll">
                <table className="api-flat-table">
                  <thead>
                    <tr>
                      <th>Query Parameter</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>format</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>
                        <code>syncx</code> (or <code>stocksync</code>) for flat JSON variant rows. 
                        <code>matrixify</code> (or <code>/catalog.csv</code>) for standard Shopify CSV. 
                        <code>shopify</code> for nested REST JSON.
                      </td>
                    </tr>
                    <tr>
                      <td><code>category</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>Filter by category (e.g. <code>Saree</code>, <code>Suit</code>, <code>Dupatta</code>).</td>
                    </tr>
                    <tr>
                      <td><code>skus</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>Filter by specific comma-separated SKUs (e.g. <code>102001,102002</code>).</td>
                    </tr>
                    <tr>
                      <td><code>limit</code></td>
                      <td><span className="api-param-type">number (optional)</span></td>
                      <td>Number of records per page (default: <code>50</code>, max: <code>10000</code> for sync feeds).</td>
                    </tr>
                    <tr>
                      <td><code>page</code></td>
                      <td><span className="api-param-type">number (optional)</span></td>
                      <td>Page number for offset pagination (default: <code>1</code>).</td>
                    </tr>
                    <tr>
                      <td><code>key</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>Alternative to header authentication for feed readers.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">200 OK Response (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "status": "success",
  "tier": "growth",
  "total_products": 240,
  "page_products": 2,
  "products": [
    {
      "id": "102001",
      "sku": "102001",
      "title": "Soft Silk Zari Work Designer Banarasi Saree",
      "category": "Saree",
      "fabric": "Pure Silk",
      "weave": "Powerloom",
      "price": 1200,
      "compare_at_price": 1800,
      "quantity": 5,
      "stock_status": "ready-stock",
      "description": "<p>...</p><p>Authenticity: 100% Banarasi</p><p><strong>Disclaimer:</strong> Slight variations...</p>",
      "images": ["https://www.weave365.com/..."],
      "variants": [
        { "code": "102001-1", "color": "Dusty Pink", "price": 1200, "quantity": 5 }
      ]
    }
  ]
}`, 'cat-resp')}
                  >
                    {copiedKey === 'cat-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'cat-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content">{`{
  "status": "success",
  "tier": "growth",
  "total_products": 240,
  "page_products": 2,
  "products": [
    {
      "id": "102001",
      "sku": "102001",
      "title": "Soft Silk Zari Work Designer Banarasi Saree",
      "category": "Saree",
      "fabric": "Pure Silk",
      "weave": "Powerloom",
      "price": 1200,
      "compare_at_price": 1800,
      "quantity": 5,
      "stock_status": "ready-stock",
      "description": "<p>...</p><p>Authenticity: 100% Banarasi</p><p><strong>Disclaimer:</strong> Slight variations...</p>",
      "images": ["https://www.weave365.com/..."],
      "variants": [
        { "code": "102001-1", "color": "Dusty Pink", "price": 1200, "quantity": 5 }
      ]
    }
  ]
}`}</pre>
              </div>
            </div>

            {/* ENDPOINT 2: GET /stock-status */}
            <div id="endpoint-stock" className="api-endpoint-item">
              <div className="api-endpoint-header-row">
                <span className="api-method-badge get">GET</span>
                <span className="api-endpoint-path">/api/v1/stock-status</span>
              </div>
              <p className="api-endpoint-summary">
                Sub-0.5ms ultra-lightweight stock map. Returns direct key-value pairs of available quantities without downloading product specifications.
              </p>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">200 OK Response (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "status": "success",
  "total_items": 1250,
  "stock_map": {
    "102001-1": { "in_stock": true, "quantity": 5, "stock_status": "ready-stock" },
    "102001-2": { "in_stock": true, "quantity": 3, "stock_status": "ready-stock" },
    "102002-1": { "in_stock": false, "quantity": 0, "stock_status": "out-of-stock" }
  }
}`, 'stock-resp')}
                  >
                    {copiedKey === 'stock-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'stock-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content">{`{
  "status": "success",
  "total_items": 1250,
  "stock_map": {
    "102001-1": { "in_stock": true, "quantity": 5, "stock_status": "ready-stock" },
    "102001-2": { "in_stock": true, "quantity": 3, "stock_status": "ready-stock" },
    "102002-1": { "in_stock": false, "quantity": 0, "stock_status": "out-of-stock" }
  }
}`}</pre>
              </div>
            </div>

            {/* ENDPOINT 3: GET /products/:sku */}
            <div id="endpoint-product" className="api-endpoint-item">
              <div className="api-endpoint-header-row">
                <span className="api-method-badge get">GET</span>
                <span className="api-endpoint-path">/api/v1/products/:sku</span>
              </div>
              <p className="api-endpoint-summary">
                Returns single product metadata, specifications, and full colorway variants by master SKU or variant code.
              </p>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">200 OK Response (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "status": "success",
  "product": {
    "id": "102001",
    "title": "Soft Silk Zari Work Designer Banarasi Saree",
    "price": 1200,
    "compare_at_price": 1800,
    "quantity": 8,
    "is_available": true
  }
}`, 'prod-resp')}
                  >
                    {copiedKey === 'prod-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'prod-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content">{`{
  "status": "success",
  "product": {
    "id": "102001",
    "title": "Soft Silk Zari Work Designer Banarasi Saree",
    "price": 1200,
    "compare_at_price": 1800,
    "quantity": 8,
    "is_available": true
  }
}`}</pre>
              </div>
            </div>

            {/* ENDPOINT 4: POST /orders */}
            <div id="endpoint-order" className="api-endpoint-item">
              <div className="api-endpoint-header-row">
                <span className="api-method-badge post">POST</span>
                <span className="api-endpoint-path">/api/v1/orders</span>
              </div>
              <p className="api-endpoint-summary">
                Automated Dropship Order Placement (Pro Tier). Dispatches white-label shipments directly to your customer with live tracking.
              </p>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">Request Body (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "reseller_order_id": "SHOP-90412",
  "customer": {
    "name": "Priya Sharma",
    "phone": "9876543210",
    "email": "priya@example.com",
    "address_line1": "Flat 402, Lotus Greens, Sector 45",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "pincode": "201303"
  },
  "items": [
    { "sku": "102001-1", "quantity": 1 }
  ],
  "shipping_notes": "Blind packaging requested"
}`, 'order-req')}
                  >
                    {copiedKey === 'order-req' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'order-req' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content">{`{
  "reseller_order_id": "SHOP-90412",
  "customer": {
    "name": "Priya Sharma",
    "phone": "9876543210",
    "email": "priya@example.com",
    "address_line1": "Flat 402, Lotus Greens, Sector 45",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "pincode": "201303"
  },
  "items": [
    { "sku": "102001-1", "quantity": 1 }
  ],
  "shipping_notes": "Blind packaging requested"
}`}</pre>
              </div>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">201 Created Response (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "status": "success",
  "order_id": "inq_9f81a7b2c",
  "reseller_order_id": "SHOP-90412",
  "tracking_url": "https://www.weave365.com/order-tracking?id=inq_9f81a7b2c",
  "estimated_dispatch": "24-48 Business Hours"
}`, 'order-resp')}
                  >
                    {copiedKey === 'order-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'order-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content">{`{
  "status": "success",
  "order_id": "inq_9f81a7b2c",
  "reseller_order_id": "SHOP-90412",
  "tracking_url": "https://www.weave365.com/order-tracking?id=inq_9f81a7b2c",
  "estimated_dispatch": "24-48 Business Hours"
}`}</pre>
              </div>
            </div>

            {/* ENDPOINT 5: GET /orders */}
            <div id="endpoint-get-orders" className="api-endpoint-item">
              <div className="api-endpoint-header-row">
                <span className="api-method-badge get">GET</span>
                <span className="api-endpoint-path">/api/v1/orders</span>
              </div>
              <p className="api-endpoint-summary">
                Fetches fulfillment milestones, courier AWB tracking numbers (Delhivery, Bluedart, Xpressbees), and dropship status history.
              </p>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">200 OK Response (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "status": "success",
  "total_orders": 14,
  "orders": [
    {
      "order_id": "inq_9f81a7b2c",
      "status": "dispatched",
      "courier_partner": "Delhivery",
      "tracking_number": "149204918293",
      "live_tracking_url": "https://www.delhivery.com/track/package/149204918293"
    }
  ]
}`, 'get-orders-resp')}
                  >
                    {copiedKey === 'get-orders-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'get-orders-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content">{`{
  "status": "success",
  "total_orders": 14,
  "orders": [
    {
      "order_id": "inq_9f81a7b2c",
      "status": "dispatched",
      "courier_partner": "Delhivery",
      "tracking_number": "149204918293",
      "live_tracking_url": "https://www.delhivery.com/track/package/149204918293"
    }
  ]
}`}</pre>
              </div>
            </div>

            {/* ENDPOINT 6: GET /me */}
            <div id="endpoint-me" className="api-endpoint-item">
              <div className="api-endpoint-header-row">
                <span className="api-method-badge get">GET</span>
                <span className="api-endpoint-path">/api/v1/me</span>
              </div>
              <p className="api-endpoint-summary">
                Returns authenticated account details, subscription tier, remaining quota, and current month request metrics.
              </p>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">200 OK Response (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "status": "success",
  "client_name": "Royal Boutique",
  "tier": "growth",
  "monthly_quota": 10000,
  "month_total_used": 1420,
  "remaining_quota": 8580,
  "rate_limit_rps": 10,
  "is_active": true
}`, 'me-resp')}
                  >
                    {copiedKey === 'me-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'me-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content">{`{
  "status": "success",
  "client_name": "Royal Boutique",
  "tier": "growth",
  "monthly_quota": 10000,
  "month_total_used": 1420,
  "remaining_quota": 8580,
  "rate_limit_rps": 10,
  "is_active": true
}`}</pre>
              </div>
            </div>
          </section>

          {/* 8. Rate Limits & Quotas */}
          <section id="rate-limits" className="api-section">
            <h2 className="api-section-title">Rate Limits &amp; Quotas</h2>
            <p className="api-section-desc">
              Rate limits guarantee smooth warehouse syncs without latency degradation:
            </p>

            <div className="api-table-scroll">
              <table className="api-flat-table">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Monthly Requests</th>
                    <th>Burst Rate Limit</th>
                    <th>Overage Policy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Growth Tier</strong></td>
                    <td>10,000 req / month</td>
                    <td>10 requests / second</td>
                    <td>HTTP 429 when quota exhausted; renews monthly</td>
                  </tr>
                  <tr>
                    <td><strong>Pro Tier</strong></td>
                    <td>25,000 req / month</td>
                    <td>25 requests / second</td>
                    <td>Priority bandwidth + automated dropship order API</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 9. Pricing Tiers */}
          <section id="pricing" className="api-section">
            <h2 className="api-section-title">Subscription Tiers</h2>
            <p className="api-section-desc">
              Simple, transparent pricing for growing boutiques and high-volume dropshippers:
            </p>

            <div className="api-tiers-grid">
              <div className="api-tier-item">
                <div className="api-tier-name">Growth Tier</div>
                <div className="api-tier-price">₹299 <span>/ month</span></div>
                <div className="api-tier-quota">10,000 requests / month</div>
                <ul className="api-tier-features">
                  <li><Check size={14} /> Full B2R Wholesale Catalog Feed</li>
                  <li><Check size={14} /> Real-Time Stock Status Lookups</li>
                  <li><Check size={14} /> Shopify SyncX &amp; Matrixify Feeds</li>
                  <li><Check size={14} /> WooCommerce &amp; PrestaShop Connectors</li>
                  <li><Check size={14} /> 10 req/sec Burst Throughput</li>
                </ul>
                <a href="/account" className="api-btn secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Select Growth Tier
                </a>
              </div>

              <div className="api-tier-item featured">
                <div className="api-tier-name">
                  <span>Pro Tier</span>
                  <span className="api-tier-badge">Recommended</span>
                </div>
                <div className="api-tier-price">₹499 <span>/ month</span></div>
                <div className="api-tier-quota">25,000 requests / month</div>
                <ul className="api-tier-features">
                  <li><Check size={14} /> Everything in Growth Tier</li>
                  <li><Check size={14} /> <strong>Automated Dropship Order Placement API</strong></li>
                  <li><Check size={14} /> Live Carrier AWB &amp; Tracking Webhooks</li>
                  <li><Check size={14} /> 25 req/sec High-Volume Burst Rate</li>
                  <li><Check size={14} /> Priority Loom Warehouse Dispatch</li>
                </ul>
                <a href="/account" className="api-btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Upgrade to Pro Tier
                </a>
              </div>
            </div>
          </section>

          {/* 10. Managing From Dashboard */}
          <section id="dashboard-guide" className="api-section">
            <h2 className="api-section-title">Developer Dashboard</h2>
            <p className="api-section-desc">
              Manage all credentials, live usage meters, and curated product collections directly in your account:
            </p>

            <div className="api-clean-steps">
              <div className="api-step-row">
                <span className="api-step-circle">1</span>
                <div className="api-step-content">
                  <h4 className="api-step-heading">Real-Time Usage Gauges</h4>
                  <p className="api-step-body">
                    Monitor requests made this month, remaining quota, and daily breakdown charts.
                  </p>
                </div>
              </div>

              <div className="api-step-row">
                <span className="api-step-circle">2</span>
                <div className="api-step-content">
                  <h4 className="api-step-heading">Instant Key Regeneration</h4>
                  <p className="api-step-body">
                    Rotate or deactivate your API key immediately with zero downtime.
                  </p>
                </div>
              </div>

              <div className="api-step-row">
                <span className="api-step-circle">3</span>
                <div className="api-step-content">
                  <h4 className="api-step-heading">Visual Product Curation</h4>
                  <p className="api-step-body">
                    Filter by Fabric, Weave, or Price and toggle which sarees appear on your external website.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <a href="/account" className="api-btn primary">
                Go to Developer Dashboard &rarr;
              </a>
            </div>
          </section>
        </main>
      </div>

      {/* Floating Scroll To Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="api-scroll-top"
          aria-label="Scroll to top"
        >
          <ArrowUpIcon size={16} />
        </button>
      )}
    </div>
  );
}
