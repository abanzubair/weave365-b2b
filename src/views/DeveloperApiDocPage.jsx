/**
 * @file DeveloperApiDocPage.jsx
 * @description Comprehensive Developer API Documentation & Platform Integration Guide
 * Minimalist, high-performance developer documentation for Weave365 B2B Resellers.
 * Mobile-optimized & responsive architecture.
 * 
 * @module views/DeveloperApiDocPage
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Code2,
  Terminal,
  Zap,
  Shield,
  KeyRound,
  Copy,
  Check,
  Globe,
  Layers,
  ArrowRight,
  ArrowUpIcon,
  ExternalLink,
  Package,
  Truck,
  RefreshCw,
  ShoppingBag,
  Sliders,
  DollarSign,
  CheckCircle2,
  HelpCircle,
  FileCode2,
  Server,
  Sparkles,
  BookOpen,
  ChevronDown,
  AlertTriangle,
  Image as ImageIcon,
  Info,
  Trash2,
  Tag
} from '../components/icons.jsx';
import '../styles/developerApiDoc.css';

const NAV_GROUPS = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview', icon: BookOpen },
      { id: 'quickstart', label: '3-Step Integration', icon: Sparkles },
      { id: 'authentication', label: 'Authentication', icon: KeyRound },
      { id: 'platforms', label: 'Supported Platforms', icon: Layers },
      { id: 'shopify-guide', label: 'Shopify (SyncX) Guide', icon: ShoppingBag },
      { id: 'curated-catalog', label: 'Curated Catalog Sync', icon: Sliders },
    ],
  },
  {
    title: 'API Endpoints',
    items: [
      { id: 'endpoint-catalog', label: 'GET /catalog', method: 'GET', desc: 'B2R Catalog Feed' },
      { id: 'endpoint-stock', label: 'GET /stock-status', method: 'GET', desc: 'Stock Map' },
      { id: 'endpoint-product', label: 'GET /products/:sku', method: 'GET', desc: 'Product Lookup' },
      { id: 'endpoint-order', label: 'POST /orders', method: 'POST', desc: 'Automated Orders' },
      { id: 'endpoint-get-orders', label: 'GET /orders', method: 'GET', desc: 'Tracking & History' },
      { id: 'endpoint-me', label: 'GET /me', method: 'GET', desc: 'Quota & Metrics' },
    ],
  },
  {
    title: 'Tiers & Limits',
    items: [
      { id: 'rate-limits', label: 'Rate Limits & Quota', icon: Zap },
      { id: 'pricing', label: 'Pricing Tiers', icon: DollarSign },
      { id: 'dashboard-guide', label: 'Managing Your Key', icon: Sliders },
    ],
  },
];

const SECTION_IDS = [
  'overview',
  'quickstart',
  'authentication',
  'platforms',
  'shopify-guide',
  'curated-catalog',
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

export default function DeveloperApiDocPage() {
  const [copiedSection, setCopiedSection] = useState(null);
  const [activePlatformTab, setActivePlatformTab] = useState('shopify');
  const [activeSection, setActiveSection] = useState('overview');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 130;
      setShowScrollTop(window.scrollY > 400);

      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTION_IDS[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(SECTION_IDS[i]);
            return;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const navOffset = window.innerWidth <= 900 ? 112 : 80;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: 'smooth',
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const platforms = [
    { id: 'shopify', name: 'Shopify (Matrixify / Sync)', icon: ShoppingBag },
    { id: 'woocommerce', name: 'WooCommerce (WordPress)', icon: FileCode2 },
    { id: 'prestashop', name: 'PrestaShop', icon: Layers },
    { id: 'nodejs', name: 'Node.js / JavaScript', icon: Terminal },
    { id: 'curl', name: 'cURL / Shell', icon: Code2 },
  ];

  const codeSnippets = {
    shopify: `# ============================================================================
# Weave365 Shopify Integration Guide (SyncX / Stock Sync / Matrixify)
# ============================================================================

# 1. DEDICATED SYNC FEED URL (Flat Variant Array - Zero Headers Required):
Feed URL: https://www.weave365.com/api/v1/catalog.json?key=w365_live_YOUR_API_KEY&format=stocksync
HTTP Method: GET
File Format: JSON (Auto-detected by SyncX)

# 2. STEP 2: MATCHING COLUMN (FIELD MAPPING)
Product Identifier:
  SKU (Variant's SKU)           -> sku (or SKU)

Store Product Field(s):
  Product's title               -> title (or Title)
  Price                         -> price (or Price)
  Compare At Price (MRP)        -> compare_at_price (or mrp)
  Quantity / Stock              -> quantity (or stock)
  Product's image (Gallery)     -> images (Smart setting: Delimiter = ,)
  Variant image (Color Swatch)  -> variant_image (or image)
  Description / Body HTML       -> description (or body_html)
  Vendor                        -> vendor
  Product Type / Category       -> category
  Tags                          -> tags

# 3. COMBINE ROWS INTO ONE PRODUCT (SAREE COLOR VARIANTS)
  Variant group                 -> handle (or product_id)
  Variant option 1              -> color (or option1_value)
  * Smart Setting for Option 1: Set Option Name to "Color"
  * Tip: Click Trash icon (🗑️) on any unused option rows (Option 2/3) to prevent errors!

# 4. PRICE MARKUP (+30% PROFIT MARGIN)
  - Method A (Smart Setting): Click ⚙️ Smart setting next to Price -> Price markup -> +30%
  - Method B (Formula Box): {{ data | jmespath: '"price"' | times: 1.3 | round: 2 }}

# 5. FIXING MISSING IMAGES
  - Under "Product's image", click ⚙️ Smart setting.
  - Set "Multiple image delimiter" to comma (,)
  - Allow 1-3 minutes after sync for Shopify CDN to finish downloading images.

# 6. INCOMING FEED FILTERS (OPTIONAL)
  - Delete any empty filter lines with the 🗑️ Trash Can icon.
  - To sync only in-stock sarees: is_available Equal to true
  - Toggle "Skip product(s) with zero quantity" (requires quantity mapped in Step 2).`,

    woocommerce: `<?php
/**
 * Weave365 WooCommerce Automated Hourly Stock & Catalog Sync
 * Add this snippet to your child theme functions.php or custom plugin.
 */

add_action('weave365_hourly_sync_event', 'weave365_sync_catalog');

function weave365_sync_catalog() {
    $api_key = 'w365_live_YOUR_API_KEY';
    $response = wp_remote_get('https://www.weave365.com/api/v1/catalog', [
        'headers' => [
            'x-api-key' => $api_key,
            'Accept'    => 'application/json',
        ],
        'timeout' => 30,
    ]);

    if (is_wp_error($response)) return;

    $body = json_decode(wp_remote_retrieve_body($response), true);
    if (!isset($body['products'])) return;

    foreach ($body['products'] as $product) {
        $sku = $product['sku'];
        $product_id = wc_get_product_id_by_sku($sku);
        if (!$product_id) continue;

        $wc_product = wc_get_product($product_id);
        if (!$wc_product) continue;

        // Update procurement price (Reseller rate) and live stock status
        $wc_product->set_regular_price($product['price']);
        $wc_product->set_stock_status($product['is_available'] ? 'instock' : 'outofstock');
        $wc_product->save();
    }
}

// Schedule hourly sync cron
if (!wp_next_scheduled('weave365_hourly_sync_event')) {
    wp_schedule_event(time(), 'hourly', 'weave365_hourly_sync_event');
}`,

    prestashop: `<?php
/**
 * Weave365 PrestaShop Product & Inventory Connector
 * Synchronizes Weave365 weaver stock into PrestaShop catalog.
 */

class Weave365Connector {
    private $apiKey = 'w365_live_YOUR_API_KEY';
    private $endpoint = 'https://www.weave365.com/api/v1/catalog';

    public function syncInventory() {
        $ch = curl_init($this->endpoint);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . $this->apiKey,
            'Accept'    => 'application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        if (!$data || !isset($data['products'])) return false;

        foreach ($data['products'] as $item) {
            $id_product = (int)Product::getIdByReference($item['sku']);
            if (!$id_product) continue;

            // Update PrestaShop quantity & price
            $quantity = $item['is_available'] ? 10 : 0;
            StockAvailable::setQuantity($id_product, 0, $quantity);
            
            $product = new Product($id_product);
            $product->price = (float)$item['price'];
            $product->save();
        }
        return true;
    }
}`,

    nodejs: `// Node.js (ES Modules) - Fetch Catalog, Place Order & Track Fulfillment
const WEAVE365_API_KEY = 'w365_live_YOUR_API_KEY';
const BASE_URL = 'https://www.weave365.com/api/v1';

// 1. Fetch Real-Time Stock Status
async function checkStock() {
  const res = await fetch(\`\${BASE_URL}/stock-status\`, {
    headers: { 'x-api-key': WEAVE365_API_KEY }
  });
  const data = await res.json();
  console.log('Live Stock Map:', data.stock_map);
}

// 2. Submit Wholesale Order Directly via API
async function placeOrder(orderData) {
  const res = await fetch(\`\${BASE_URL}/orders\`, {
    method: 'POST',
    headers: {
      'x-api-key': WEAVE365_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reseller_order_id: orderData.storeOrderId,
      reseller_email: 'reseller@example.com', // Registered email where invoice & payment link are dispatched
      items: [
        {
          sku: '102001',
          color: 'Copper',
          quantity: 2,
          customer_price: 2899 // Retail price charged to customer for printing on courier parcel slip
        }
      ],
      shipping_address: {
        name: orderData.recipientName,
        phone: orderData.phone,
        address_line1: orderData.address1,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode
      },
      shipping_notes: 'Wholesale handloom pure silk parcel'
    })
  });
  
  const result = await res.json();
  console.log('Order status:', result.order_status); // 'payment_pending'
  console.log('Invoice emailed to:', result.invoice_email_sent_to);
  console.log('Payment Link:', result.payment_link);
  return result;
}

// 3. Fetch Placed Orders & Live Courier Tracking
async function getOrders() {
  const res = await fetch(\`\${BASE_URL}/orders\`, {
    headers: { 'x-api-key': WEAVE365_API_KEY }
  });
  const data = await res.json();
  console.log('My Orders:', data.orders);
  return data.orders;
}`,

    curl: `# 1. Fetch Reseller B2R Catalog (JSON)
curl -X GET "https://www.weave365.com/api/v1/catalog" \\
  -H "x-api-key: w365_live_YOUR_API_KEY"

# 2. Check Lightweight Stock Status
curl -X GET "https://www.weave365.com/api/v1/stock-status" \\
  -H "x-api-key: w365_live_YOUR_API_KEY"

# 3. Lookup Single Saree SKU
curl -X GET "https://www.weave365.com/api/v1/products/102001" \\
  -H "x-api-key: w365_live_YOUR_API_KEY"

# 4. Submit Wholesale Order via API
curl -X POST "https://www.weave365.com/api/v1/orders" \\
  -H "x-api-key: w365_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reseller_order_id": "RESELLER-ORD-1092",
    "reseller_email": "reseller@example.com",
    "items": [
      {
        "sku": "102001",
        "color": "Copper",
        "quantity": 2,
        "customer_price": 2899
      }
    ],
    "shipping_address": {
      "name": "Priya Sharma",
      "phone": "9876543210",
      "address_line1": "Flat 402, Lotus Orchid, Indiranagar",
      "city": "Bengaluru",
      "state": "Karnataka",
      "pincode": "560038"
    },
    "shipping_notes": "Wholesale handloom pure silk parcel"
  }'

# 5. Fetch Placed Orders & Live Courier Tracking
curl -X GET "https://www.weave365.com/api/v1/orders" \\
  -H "x-api-key: w365_live_YOUR_API_KEY"`
  };

  return (
    <div className="api-docs-page">
      {/* Ultra-Minimal Mobile Sticky Section Selector */}
      <div className="api-mobile-toc-bar">
        <div className="api-mobile-select-wrapper">
          <label htmlFor="api-mobile-nav-select" className="api-mobile-select-label">
            Section:
          </label>
          <select
            id="api-mobile-nav-select"
            className="api-mobile-select"
            value={activeSection}
            onChange={(e) => scrollToSection(e.target.value)}
            aria-label="Select documentation section"
          >
            {NAV_GROUPS.map((group) => (
              <optgroup key={group.title} label={group.title}>
                {group.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown size={14} className="api-mobile-select-chevron" />
        </div>
      </div>

      {/* Main Documentation Container */}
      <div className="api-docs-container">
        {/* Desktop Sticky Table of Contents Sidebar */}
        <aside className="api-docs-sidebar" aria-label="Documentation Navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="api-docs-nav-group">
              <div className="api-docs-nav-title">{group.title}</div>
              <ul className="api-docs-nav-list">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`api-docs-nav-link ${activeSection === item.id ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.id);
                      }}
                    >
                      {item.method ? (
                        <span className={`api-method-badge mini ${item.method.toLowerCase()}`}>
                          {item.method}
                        </span>
                      ) : null}
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="api-sidebar-footer">
            <a href="/account?tab=developer" className="api-sidebar-portal-link">
              <KeyRound size={14} /> Developer Dashboard &rarr;
            </a>
          </div>
        </aside>

        {/* Content Flow */}
        <main className="api-docs-content">
          {/* Documentation Hero Header */}
          <header className="api-docs-hero">
            <div className="api-docs-breadcrumbs">
              <a href="/catalogue">Store</a>
              <span className="api-breadcrumb-sep">/</span>
              <a href="/account?tab=developer">Developer</a>
              <span className="api-breadcrumb-sep">/</span>
              <span className="api-breadcrumb-current">REST API Reference</span>
            </div>

            <div className="api-docs-title-row">
              <h1 className="api-docs-main-title">Developer API Reference</h1>
              <div className="api-docs-badges">
                <span className="api-version-pill">v1.0 REST</span>
              </div>
            </div>

            <p className="api-docs-lead">
              High-performance REST API for B2B resellers and automated storefronts. Synchronize wholesale catalogs, verify real-time handloom stock, and submit wholesale procurement orders directly with Varanasi weavers.
            </p>

            <div className="api-docs-hero-actions">
              <a href="/account?tab=developer" className="api-hero-btn primary">
                <KeyRound size={15} /> Get API Key
              </a>
              <button
                type="button"
                className="api-hero-btn secondary"
                onClick={() => scrollToSection('platforms')}
              >
                <Terminal size={15} /> Integration SDKs
              </button>
            </div>
          </header>

          {/* Section: Overview */}
          <section id="overview" className="api-docs-section">
            <h2>Overview</h2>
            <p>
              The Weave365 REST API allows B2B resellers and eCommerce storefronts to query live catalog pricing, verify real-time inventory availability, and automate wholesale order procurement directly with weavers in Varanasi.
            </p>

            <div className="api-key-metrics-grid">
              <div className="api-metric-card">
                <span className="api-metric-label">Base URL</span>
                <code className="api-metric-value">https://www.weave365.com/api/v1</code>
              </div>
              <div className="api-metric-card">
                <span className="api-metric-label">Authentication</span>
                <code className="api-metric-value">Header x-api-key or Bearer</code>
              </div>
              <div className="api-metric-card">
                <span className="api-metric-label">Payload Format</span>
                <code className="api-metric-value">JSON / UTF-8</code>
              </div>
            </div>
          </section>

          {/* Section: 3-Step Integration Quick Start */}
          <section id="quickstart" className="api-docs-section">
            <h2>3-Step Storefront Integration</h2>
            <p>
              Integrating Weave365 with your storefront takes less than 15 minutes. Follow this 3-step blueprint:
            </p>

            <div className="api-quickstart-grid">
              <div className="api-quickstart-card">
                <div className="api-quickstart-num">1</div>
                <h4>Generate Key &amp; Subscribe</h4>
                <p>
                  Submit your API request in your <a href="/account?tab=developer">Developer Dashboard</a>. Once approved, select a 30-day plan (<strong>Growth Partner</strong> for Stock &amp; Catalog sync, or <strong>Pro Scale</strong> for Automated Orders API).
                </p>
              </div>

              <div className="api-quickstart-card">
                <div className="api-quickstart-num">2</div>
                <h4>Sync Catalog &amp; Stock Feeds</h4>
                <p>
                  Fetch products via <code>GET /api/v1/catalog</code> (strictly Reseller B2R prices) and setup an automated 5–15 min cron query to <code>GET /api/v1/stock-status</code> to keep your store inventory in sync with the Varanasi warehouse.
                </p>
              </div>

              <div className="api-quickstart-card">
                <div className="api-quickstart-num">3</div>
                <h4>Forward Orders &amp; Track</h4>
                <p>
                  Submit wholesale procurement orders directly to the Varanasi warehouse queue via <code>POST /api/v1/orders</code> and track live dispatch and courier fulfillment in real time.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Authentication */}
          <section id="authentication" className="api-docs-section">
            <h2>Authentication</h2>
            <p>
              All requests must include your secret API key. Pass it in the HTTP headers using either <code>x-api-key</code> or as a standard <code>Bearer</code> token.
            </p>

            <div className="api-code-wrapper">
              <div className="api-code-header">
                <span className="api-code-title">HTTP Request Headers</span>
                <button
                  type="button"
                  className="api-code-copy-btn"
                  onClick={() => copyToClipboard('x-api-key: w365_live_YOUR_SECRET_KEY\nAuthorization: Bearer w365_live_YOUR_SECRET_KEY', 'auth')}
                  aria-label="Copy HTTP headers snippet"
                >
                  {copiedSection === 'auth' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedSection === 'auth' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="api-code-pre">
x-api-key: w365_live_9a7f8e1b4c3d2e...
# OR
Authorization: Bearer w365_live_9a7f8e1b4c3d2e...</pre>
            </div>

            <div className="api-security-callout">
              <div className="api-security-callout-header">
                <Shield size={16} className="api-security-icon" />
                <span>Zero Plaintext Secret Storage</span>
              </div>
              <p>
                For security, Weave365 stores your API key as a salted SHA-256 cryptographic hash. Your full raw secret key is presented <strong>only once</strong> upon creation or regeneration. Please store it securely in your <code>.env</code> file or server vault. If lost, you can rotate and regenerate a new key anytime from your <a href="/account?tab=developer">Developer Dashboard</a>.
              </p>
            </div>

            <p className="api-meta-note">
              You can generate and manage your API keys in your <a href="/account?tab=developer">Account Developer Dashboard</a>.
            </p>
          </section>

          {/* Section: Platform Integrations */}
          <section id="platforms" className="api-docs-section">
            <h2>Supported Platforms &amp; Integration Guides</h2>
            <p>
              Whether you run a Shopify store, WooCommerce, PrestaShop, or a custom Next.js/Node.js web application, Weave365 provides native support:
            </p>

            <div className="api-platform-tabs-nav" role="tablist" aria-label="SDK Integration options">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={activePlatformTab === p.id}
                    className={`api-platform-tab-btn ${activePlatformTab === p.id ? 'active' : ''}`}
                    onClick={() => setActivePlatformTab(p.id)}
                  >
                    <Icon size={15} />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>

            {activePlatformTab === 'shopify' && (
              <div className="api-clean-banner" style={{ background: '#f8fafc', borderColor: '#e2e8f0', margin: '0 0 1rem 0' }}>
                <ShoppingBag size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5 }}>
                  Setting up <strong>SyncX / Stock Sync</strong> in Shopify? Jump to the detailed <a href="#shopify-guide" onClick={(e) => { e.preventDefault(); scrollToSection('shopify-guide'); }} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>Shopify Column Matching, Margin &amp; Image Guide &rarr;</a> below.
                </div>
              </div>
            )}

            <div className="api-code-wrapper">
              <div className="api-code-header">
                <span className="api-code-title">{platforms.find((p) => p.id === activePlatformTab)?.name} Integration Code</span>
                <button
                  type="button"
                  className="api-code-copy-btn"
                  onClick={() => copyToClipboard(codeSnippets[activePlatformTab], 'platform-code')}
                  aria-label="Copy platform integration code snippet"
                >
                  {copiedSection === 'platform-code' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedSection === 'platform-code' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="api-code-pre">{codeSnippets[activePlatformTab]}</pre>
            </div>
          </section>

          {/* Section: Comprehensive Shopify (SyncX / Stock Sync) Guide */}
          <section id="shopify-guide" className="api-docs-section">
            <div className="api-endpoint-header" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0 }}>Shopify &amp; SyncX (Stock Sync) Complete Setup Guide</h2>
                <p className="api-docs-lead" style={{ margin: '0.35rem 0 0 0', fontSize: '0.9375rem' }}>
                  Step-by-step walkthrough to import the Weave365 wholesale catalog, configure color variants, apply profit margins, and sync images without errors.
                </p>
              </div>
              <span className="api-endpoint-tag">Shopify SyncX</span>
            </div>

            {/* Quick Tip Banner */}
            <div className="api-clean-banner" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
              <CheckCircle2 size={18} style={{ color: '#059669', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8125rem', color: '#065f46', lineHeight: 1.5 }}>
                <strong>Zero-Config Auto Mapping:</strong> By adding <code>&amp;format=stocksync</code> to your catalog URL, the API emits a flat JSON variant array that matches Shopify and SyncX out of the box.
              </div>
            </div>

            {/* Step 1: Dedicated Feed URL */}
            <div className="api-shopify-guide-card">
              <div className="api-shopify-guide-header">
                <span className="api-shopify-step-badge">1</span>
                <h3 className="api-shopify-guide-title">Connect Your Source Feed in SyncX (Step 1)</h3>
              </div>
              <p className="api-shopify-guide-desc">
                In your Shopify admin, open the <strong>SyncX</strong> (or <strong>Stock Sync</strong>) app, click <strong>Add New Update / Add Products</strong>, choose <strong>REST API / URL</strong>, and paste your dedicated feed URL:
              </p>

              <div className="api-code-wrapper" style={{ margin: '0.75rem 0 1rem 0' }}>
                <div className="api-code-header">
                  <span className="api-code-title">SyncX Feed URL (GET Request)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard('https://www.weave365.com/api/v1/catalog.json?key=w365_live_YOUR_API_KEY&format=stocksync', 'shopify-feed-url')}
                    aria-label="Copy feed URL"
                  >
                    {copiedSection === 'shopify-feed-url' ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedSection === 'shopify-feed-url' ? 'Copied' : 'Copy Feed URL'}</span>
                  </button>
                </div>
                <pre className="api-code-pre">https://www.weave365.com/api/v1/catalog.json?key=w365_live_YOUR_API_KEY&amp;format=stocksync</pre>
              </div>

              <div className="api-callout-box">
                <div className="api-callout-header">
                  <Info size={15} style={{ color: '#2563eb' }} />
                  <span>Why use the <code>?key=</code> parameter?</span>
                </div>
                Because Shopify apps make automated server-to-server <code>GET</code> requests without custom HTTP headers, passing your secret key in the query parameter <code>?key=...</code> authenticates requests instantly without needing custom header configuration.
              </div>
            </div>

            {/* Step 2: Matching Column Table */}
            <div className="api-shopify-guide-card">
              <div className="api-shopify-guide-header">
                <span className="api-shopify-step-badge">2</span>
                <h3 className="api-shopify-guide-title">Matching Columns (Step 2: Matching Column)</h3>
              </div>
              <p className="api-shopify-guide-desc">
                SyncX prompts for the exact feed column/property names to match your Shopify store fields. Enter these values into the input boxes:
              </p>

              <div className="api-table-wrapper">
                <table className="api-params-table">
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Search Store Field (Shopify)</th>
                      <th>Value to Type in Box</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Product Identifier</strong></td>
                      <td><code>SKU (Variant&apos;s SKU)</code></td>
                      <td><span className="api-val-highlight">sku</span> <em>(or <code>SKU</code>)</em></td>
                      <td>Matches feed rows to Shopify products/variants for stock and price updates.</td>
                    </tr>
                    <tr>
                      <td rowSpan={8}><strong>Store Product Field(s)</strong></td>
                      <td><code>Product&apos;s title</code></td>
                      <td><span className="api-val-highlight">title</span> <em>(or <code>Title</code>)</em></td>
                      <td>Clean saree title for your storefront catalog.</td>
                    </tr>
                    <tr>
                      <td><code>Price</code></td>
                      <td><span className="api-val-highlight">price</span> <em>(or <code>Price</code>)</em></td>
                      <td>Weave365 wholesale B2R procurement rate (Strictly wholesale; cost prices never exposed).</td>
                    </tr>
                    <tr>
                      <td><code>Compare At Price</code></td>
                      <td><span className="api-val-highlight">compare_at_price</span> <em>(or <code>mrp</code>)</em></td>
                      <td>Suggested retail price / MRP for strikethrough retail discount display.</td>
                    </tr>
                    <tr>
                      <td><code>Quantity</code> <em>(or Inventory)</em></td>
                      <td><span className="api-val-highlight">quantity</span> <em>(or <code>stock</code>)</em></td>
                      <td>Live weaver inventory (5 for ready stock, 0 for out-of-stock).</td>
                    </tr>
                    <tr>
                      <td><code>Product&apos;s image</code></td>
                      <td><span className="api-val-highlight">images</span> <em>(or <code>image</code>)</em></td>
                      <td>Full saree image gallery. <strong>Important:</strong> Set delimiter to comma <code>,</code> in Smart Settings (see Step 5).</td>
                    </tr>
                    <tr>
                      <td><code>Variant image</code></td>
                      <td><span className="api-val-highlight">variant_image</span> <em>(or <code>image</code>)</em></td>
                      <td>Color-specific photo linked directly to the color swatch on Shopify.</td>
                    </tr>
                    <tr>
                      <td><code>Product Description</code></td>
                      <td><span className="api-val-highlight">description</span> <em>(or <code>body_html</code>)</em></td>
                      <td>Rich HTML description including fabric, weave authenticity, and care instructions.</td>
                    </tr>
                    <tr>
                      <td><code>Vendor</code></td>
                      <td><span className="api-val-highlight">vendor</span></td>
                      <td>Defaults to <code>Weave365 Wholesale</code> (can be customized or mapped to a static value).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="api-table-scroll-hint">Swipe horizontally to view all columns &rarr;</div>
            </div>

            {/* Step 3: Profit Markup / Increase Price */}
            <div className="api-shopify-guide-card">
              <div className="api-shopify-guide-header">
                <span className="api-shopify-step-badge">3</span>
                <h3 className="api-shopify-guide-title">Setting Your Profit Margin (+30% Price Markup)</h3>
              </div>
              <p className="api-shopify-guide-desc">
                Since the API provides your wholesale procurement cost, you can automatically add your profit margin so your Shopify store sells at retail:
              </p>

              <div className="api-two-col-grid">
                <div className="api-method-card">
                  <h5>
                    <span>Method 1: UI Smart Setting</span>
                    <span className="api-method-tag recommended">Recommended</span>
                  </h5>
                  <ol style={{ paddingLeft: '1.125rem', margin: '0.5rem 0', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.55 }}>
                    <li>Click the ⚙️ <strong>Smart setting</strong> icon right next to the <code>Price</code> dropdown.</li>
                    <li>Under <strong>Price markup / Adjust price</strong>, choose <strong>Increase by percentage (%)</strong>.</li>
                    <li>Enter <strong><code>30</code></strong> (or your target profit margin percentage).</li>
                    <li>Set <strong>Rounding</strong> to <em>Round to nearest whole number</em> to prevent awkward decimal prices.</li>
                    <li>Click <strong>Done / Save</strong>.</li>
                  </ol>
                </div>

                <div className="api-method-card">
                  <h5>
                    <span>Method 2: Liquid Formula Box</span>
                    <span className="api-method-tag">Direct Formula</span>
                  </h5>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.5rem 0' }}>
                    If you prefer writing expressions directly inside the formula box, replace the default Price expression with:
                  </p>
                  <div className="api-code-wrapper" style={{ margin: '0.5rem 0' }}>
                    <pre className="api-code-pre" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
{`{{ data | jmespath: '"price"' | times: 1.3 | round: 2 }}`}
                    </pre>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    *(Use <code>| round: 0</code> if you want integer prices with no paise).*
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Combine rows into one product (Color Variants) */}
            <div className="api-shopify-guide-card">
              <div className="api-shopify-guide-header">
                <span className="api-shopify-step-badge">4</span>
                <h3 className="api-shopify-guide-title">Combine Rows into One Product (Saree Color Variants)</h3>
              </div>
              <p className="api-shopify-guide-desc">
                Weave365 sarees feature multiple colorways (e.g. Red, Bottle Green, Royal Blue). SyncX provides a section called <strong>Combine rows into one product</strong> so each saree has a single product page with color swatches:
              </p>

              <div className="api-table-wrapper">
                <table className="api-params-table">
                  <thead>
                    <tr>
                      <th>Store Field</th>
                      <th>Value to Type in Box</th>
                      <th>Configuration Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Variant group</strong></td>
                      <td><span className="api-val-highlight">handle</span> <em>(or <code>product_id</code>)</em></td>
                      <td>Groups all color variants belonging to the same saree under one parent product.</td>
                    </tr>
                    <tr>
                      <td><strong>Variant option 1</strong></td>
                      <td><span className="api-val-highlight">color</span> <em>(or <code>option1_value</code>)</em></td>
                      <td>Sets the variant option value to the color name. Click ⚙️ <strong>Smart setting</strong> and verify Option Name is set to <strong><code>Color</code></strong>.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="api-callout-box warning">
                <div className="api-callout-header">
                  <AlertTriangle size={15} style={{ color: '#d97706' }} />
                  <span>Crucial: Delete Unused Option Rows (Trash Icon 🗑️)</span>
                </div>
                If SyncX shows an empty 3rd row (like <em>Variant option 2</em> or <em>Variant option 3</em> with a red error), click the <strong>Trash Can icon (🗑️)</strong> to remove it. Sizing does not apply to unstitched sarees, and leaving empty option rows will cause SyncX to fail with validation errors.
              </div>
            </div>

            {/* Step 5: Images Not Fetching Troubleshooting */}
            <div className="api-shopify-guide-card">
              <div className="api-shopify-guide-header">
                <span className="api-shopify-step-badge">5</span>
                <h3 className="api-shopify-guide-title">Image Sync &amp; Delimiter Setup (Troubleshooting Missing Images)</h3>
              </div>
              <p className="api-shopify-guide-desc">
                If images aren&apos;t appearing on your Shopify store, verify these three essential checks:
              </p>

              <ol style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Map under &quot;Store product field(s)&quot;:</strong> Images must be added under <em>Store product field(s)</em> (click <code>+ Add more field</code>), NOT inside the <em>Product options / variations</em> section.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Configure the comma delimiter in Smart Settings:</strong> Next to <code>Product&apos;s image</code>, click the ⚙️ <strong>Smart setting</strong> icon and set <strong>Multiple image delimiter</strong> to comma (<code>,</code>). The Weave365 API provides all high-resolution saree photos in a comma-separated string under <code>images</code>.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Map Variant Image:</strong> Add a second field for <code>Variant image</code> and map it to <code>variant_image</code> so that selecting a color swatch dynamically swaps the image to that specific colorway.
                </li>
              </ol>

              <div className="api-callout-box">
                <div className="api-callout-header">
                  <Info size={15} style={{ color: '#2563eb' }} />
                  <span>Shopify Asynchronous Download Queue Delay</span>
                </div>
                Shopify imports images in a background queue after product creation. It typically takes <strong>1 to 3 minutes</strong> after products appear in your Shopify admin for all high-resolution photos to finish downloading and display.
              </div>
            </div>

            {/* Step 6: Incoming Feed Filters & Skipping Zero-Quantity */}
            <div className="api-shopify-guide-card" style={{ marginBottom: 0 }}>
              <div className="api-shopify-guide-header">
                <span className="api-shopify-step-badge">6</span>
                <h3 className="api-shopify-guide-title">Incoming Feed Filters &amp; Skipping Out-of-Stock Items</h3>
              </div>
              <p className="api-shopify-guide-desc">
                The <strong>Incoming feed</strong> filter section is entirely optional:
              </p>

              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Removing accidental filter errors:</strong> If you see a red <em>&quot;Required field&quot;</em> error on an empty <em>Feed column name</em> line, click the <strong>Trash Can icon (🗑️)</strong> to delete the filter. This ensures all authorized products from your feed are imported.
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <strong>Skip products with zero quantity:</strong> To enable this toggle switch, you must first map the <code>quantity</code> field in Step 2. Once mapped, toggle <strong>Skip product(s) with zero quantity</strong> to ON.
                </li>
                <li>
                  <strong>Only import ready stock:</strong> If you want to use a filter rule instead, set <code>Feed column name: is_available</code>, <code>Condition: Equal to</code>, and <code>Value: true</code>.
                </li>
              </ul>
            </div>
          </section>

          {/* Section: Curated Catalog Selection */}
          <section id="curated-catalog" className="api-docs-section">
            <h2>Curated Catalog Product Sync</h2>
            <p>
              Weave365 is a curated B2B procurement network. To maintain your storefront&apos;s focus, the API only delivers the exact products you choose to list on your store.
            </p>

            <div className="api-table-wrapper">
              <table className="api-params-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Configuration</th>
                    <th>API Feed Output</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Dashboard Selection</strong></td>
                    <td>Checkmark products in <em>Account &rarr; Developer API</em> and click <em>Save Selection</em></td>
                    <td><code>/api/v1/catalog</code> and <code>/api/v1/stock-status</code> automatically output strictly your chosen products.</td>
                  </tr>
                  <tr>
                    <td><strong>URL Parameter Override</strong></td>
                    <td>Pass <code>?skus=100001,100005</code> in the API request URL</td>
                    <td>Explicit URL query parameters filter the feed directly on demand.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="api-table-scroll-hint">Swipe horizontally to see all columns &rarr;</div>
          </section>

          {/* Section: Endpoints Reference */}
          <section id="endpoints" className="api-docs-section">
            <h2>API Endpoints Reference</h2>

            {/* 1. GET /api/v1/catalog */}
            <div id="endpoint-catalog" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge get">GET</span>
                  <span>/api/v1/catalog</span>
                </div>
                <span className="api-endpoint-tag">Catalog &amp; Reseller Price</span>
              </div>
              <div className="api-endpoint-body">
                <p>Fetches the live Weave365 catalog with high-resolution imagery and strictly the Reseller Procurement Price.</p>

                <div className="api-response-header">
                  <span className="api-response-title">Query Parameters</span>
                </div>
                <div className="api-table-wrapper">
                  <table className="api-params-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="api-param-name">category</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Filter by category (e.g. <code>Kanchipuram Silk</code>, <code>Banarasi Katan</code>).</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">skus</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Filter by specific selected SKUs (comma-separated, e.g. <code>100001,100005,100012</code>). Ideal when only curating selected products.</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">key</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Alternative to <code>x-api-key</code> header. Pass your secret API key directly in the query string (e.g. <code>?key=w365_live_...</code>). Essential for Shopify SyncX, Stock Sync, and automated feed crawlers that do not support custom request headers.</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">format</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>
                          Set to <code>stocksync</code> (or <code>syncx</code>) to emit flattened variant rows with out-of-the-box field auto-matching for Shopify sync apps. Set to <code>shopify</code> or <code>matrixify</code> for standard nested Shopify REST payload.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Response (JSON)</span>
                  <span className="api-status-code-badge success">HTTP 200 OK</span>
                </div>
                <div className="api-code-wrapper">
                  <div className="api-code-header">
                    <span className="api-code-title">200 OK Response Payload</span>
                    <button
                      type="button"
                      className="api-code-copy-btn"
                      onClick={() => copyToClipboard(`{\n  "status": "success",\n  "tier": "growth",\n  "client_name": "My Reseller Store",\n  "catalog_mode": "curated",\n  "total_products": 24,\n  "last_synced_at": "2026-08-27T12:00:00Z",\n  "products": []\n}`, 'catalog-res')}
                    >
                      {copiedSection === 'catalog-res' ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedSection === 'catalog-res' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="api-code-pre">{`{
  "status": "success",
  "tier": "growth",
  "client_name": "My Reseller Store",
  "catalog_mode": "curated",
  "total_products": 24,
  "last_synced_at": "2026-08-27T12:00:00Z",
  "products": [
    {
      "id": "100001",
      "sku": "100001",
      "title": "Pure Kanchipuram Silk Saree",
      "category": "Kanchipuram Silk",
      "fabric": "Pure Silk",
      "weave": "Handloom",
      "price": 3500,
      "currency": "INR",
      "stock_status": "ready-stock",
      "stock_status_label": "Ready Stock",
      "is_available": true,
      "colors": ["Royal Blue", "Crimson Red"],
      "images": ["https://assets.weave365.com/products/kan-001.webp"],
      "description": "Certified authentic pure silk Banarasi handloom saree."
    }
  ]
}`}</pre>
                </div>
              </div>
            </div>

            {/* 2. GET /api/v1/stock-status */}
            <div id="endpoint-stock" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge get">GET</span>
                  <span>/api/v1/stock-status</span>
                </div>
                <span className="api-endpoint-tag">Ultra-Lightweight Stock Map</span>
              </div>
              <div className="api-endpoint-body">
                <p>
                  Returns an ultra-compact map of all SKUs and their instant stock availability. 
                  Ideal for frequent (every 5-15 minute) inventory polling without consuming bandwidth or heavy payloads.
                </p>

                <div className="api-response-header">
                  <span className="api-response-title">Query Parameters</span>
                </div>
                <div className="api-table-wrapper">
                  <table className="api-params-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="api-param-name">skus</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Filter stock verification to only specific selected SKUs (comma-separated, e.g. <code>100001,100005</code>).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Response (JSON)</span>
                  <span className="api-status-code-badge success">HTTP 200 OK</span>
                </div>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "timestamp": "2026-08-26T12:30:00Z",
  "total_items": 240,
  "stock_map": {
    "100001": {
      "title": "Pure Kanchipuram Silk Saree",
      "status": "ready-stock",
      "is_available": true,
      "stock_label": "Ready Stock",
      "updated_at": "2026-08-26 12:15:00 IST"
    },
    "100002": {
      "title": "Banarasi Katan Georgette",
      "status": "out-of-stock",
      "is_available": false,
      "stock_label": "Out of Stock",
      "updated_at": "2026-08-26 11:40:00 IST"
    }
  }
}`}</pre>
                </div>
              </div>
            </div>

            {/* 3. GET /api/v1/products/:sku */}
            <div id="endpoint-product" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge get">GET</span>
                  <span>/api/v1/products/:sku</span>
                </div>
                <span className="api-endpoint-tag">Single Product Lookup</span>
              </div>
              <div className="api-endpoint-body">
                <p>Retrieves real-time details, high-resolution imagery, and live stock availability for a specific product design code / SKU.</p>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "product": {
    "id": "100001",
    "sku": "100001",
    "title": "Pure Kanchipuram Silk Saree",
    "category": "Kanchipuram Silk",
    "fabric": "Pure Silk",
    "price": 3500,
    "currency": "INR",
    "stock_status": "ready-stock",
    "is_available": true,
    "colors": ["Royal Blue", "Crimson Red"],
    "images": ["https://assets.weave365.com/products/kan-001.webp"]
  }
}`}</pre>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Curated Feed Error Response</span>
                  <span className="api-status-code-badge error">HTTP 404 Not Found</span>
                </div>
                <p className="api-endpoint-note">
                  If your API key is in curated catalog mode and the requested SKU is not in your selected products list:
                </p>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "error",
  "code": "NOT_FOUND",
  "message": "Product with SKU 100001 is not found or not included in your curated feed."
}`}</pre>
                </div>
              </div>
            </div>

            {/* 4. POST /api/v1/orders */}
            <div id="endpoint-order" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge post">POST</span>
                  <span>/api/v1/orders</span>
                </div>
                <span className="api-endpoint-tag">Automated Wholesale Order</span>
              </div>
              <div className="api-endpoint-body">
                <p>
                  Submit wholesale procurement orders directly to the Weave365 fulfillment center in Varanasi.
                </p>

                <div className="api-status-flow-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#0f172a', marginBottom: '6px' }}>
                    Automated Reseller Invoice &amp; Payment Flow
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                    <li><strong>1. Initial Placement:</strong> Order is created in <code>payment_pending</code> status.</li>
                    <li><strong>2. Invoice Email:</strong> An itemized B2B wholesale invoice with a direct payment link is automatically emailed to your registered reseller address.</li>
                    <li><strong>3. Payment Settlement:</strong> Settle the wholesale total via UPI, NetBanking, or Cards. Status immediately updates to <code>payment_received</code>.</li>
                    <li><strong>4. Varanasi Fulfillment:</strong> Once payment is confirmed, the parcel enters our quality inspection and courier dispatch queue.</li>
                  </ul>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Request Body (JSON)</span>
                </div>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "reseller_order_id": "RESELLER-ORD-1092",
  "reseller_email": "reseller@example.com",
  "items": [
    {
      "sku": "102001",
      "color": "Copper",
      "quantity": 2,
      "customer_price": 2899
    }
  ],
  "shipping_address": {
    "name": "Priya Sharma",
    "phone": "9876543210",
    "address_line1": "Flat 402, Lotus Orchid, Indiranagar",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560038"
  },
  "shipping_notes": "Wholesale handloom pure silk parcel"
}`}</pre>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Request Parameters</span>
                </div>
                <div className="api-table-wrapper">
                  <table className="api-params-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="api-param-name">reseller_order_id</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Your custom storefront order reference number (e.g. <code>RESELLER-ORD-1092</code>).</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">reseller_email</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Your registered email to receive the itemized B2B wholesale invoice and payment link.</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">items</span></td>
                        <td><span className="api-param-type">array (required)</span></td>
                        <td>Array of items: <code>sku</code>, <code>color</code>, <code>quantity</code>, and <code>customer_price</code> (the retail price you charged the buyer, printed on the courier parcel slip).</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">shipping_address</span></td>
                        <td><span className="api-param-type">object (required)</span></td>
                        <td>End consignee delivery address: <code>name</code>, <code>phone</code>, <code>address_line1</code>, <code>city</code>, <code>state</code>, and <code>pincode</code>.</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">shipping_notes</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Special delivery instructions or packaging references.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Success Response (JSON)</span>
                  <span className="api-status-code-badge success">HTTP 201 Created</span>
                </div>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "order_id": "ord_8f7b2a19-3c94",
  "reseller_order_id": "RESELLER-ORD-1092",
  "order_status": "payment_pending",
  "payment_status": "pending",
  "payment_link": "https://www.weave365.com/order-tracking/ord_8f7b2a19-3c94?pay=1",
  "invoice_email_sent_to": "reseller@example.com",
  "pricing": {
    "wholesale_amount": 3528,
    "customer_billed_price": 5798,
    "reseller_margin": 2270,
    "currency": "INR"
  },
  "courier_slip": {
    "sender_name": "My Reseller Store",
    "recipient_name": "Priya Sharma",
    "recipient_address": "Flat 402, Lotus Orchid, Indiranagar, Bengaluru, Karnataka - PIN: 560038",
    "parcel_declared_value": 5798
  },
  "tracking_url": "https://www.weave365.com/order-tracking/ord_8f7b2a19-3c94",
  "estimated_dispatch": "24-48 Business Hours after payment confirmation"
}`}</pre>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Pro Scale Plan Requirement</span>
                  <span className="api-status-code-badge forbidden">HTTP 403 Forbidden</span>
                </div>
                <p className="api-endpoint-note">
                  Automated wholesale order routing requires an active <strong>Pro Scale Plan (₹499/mo)</strong>. Keys on the <strong>Growth Partner (₹299/mo)</strong> plan have catalog and stock sync enabled; wholesale orders on the Growth plan are placed manually on Weave365:
                </p>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "error",
  "code": "FORBIDDEN",
  "message": "Order API access is not enabled for this API key."
}`}</pre>
                </div>
              </div>
            </div>

            {/* 5. GET /api/v1/orders */}
            <div id="endpoint-get-orders" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge get">GET</span>
                  <span>/api/v1/orders</span>
                </div>
                <span className="api-endpoint-tag">Fetch Orders &amp; Live Tracking</span>
              </div>
              <div className="api-endpoint-body">
                <p>
                  Retrieve orders placed by your account along with live fulfillment stages, courier carrier, and tracking details.
                </p>

                <div className="api-response-header">
                  <span className="api-response-title">Query Parameters</span>
                </div>
                <div className="api-table-wrapper">
                  <table className="api-params-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="api-param-name">id</span> / <span className="api-param-name">order_id</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Filter by specific Weave365 Order ID (or pass as path: <code>/api/v1/orders/:order_id</code>).</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">reseller_order_id</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Filter by your storefront&apos;s custom order number (e.g. <code>RESELLER-ORD-1092</code>).</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">status</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Filter by order status (<code>payment_pending</code>, <code>payment_received</code>, <code>processing</code>, <code>dispatched</code>, <code>delivered</code>, <code>cancelled</code>).</td>
                      </tr>
                      <tr>
                        <td><span className="api-param-name">limit</span></td>
                        <td><span className="api-param-type">number (optional)</span></td>
                        <td>Number of orders to retrieve (default: <code>50</code>, max: <code>100</code>).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Response</span>
                  <span className="api-status-code-badge success">HTTP 200 OK</span>
                </div>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "total_orders": 2,
  "orders": [
    {
      "id": "ord_8f7b2a19-3c94",
      "reseller_order_id": "RESELLER-ORD-1092",
      "created_at": "2026-08-27T01:15:00Z",
      "status": "payment_received",
      "status_label": "Payment Received / In QC",
      "payment_status": "paid",
      "payment_link": null,
      "tracking": {
        "carrier": "Delhivery Express",
        "tracking_number": "DEL198273645",
        "tracking_message": "Quality inspection verified. Prepared for courier dispatch.",
        "tracking_url": "https://www.weave365.com/order-tracking/ord_8f7b2a19-3c94",
        "is_dispatched": false
      },
      "customer": {
        "name": "Priya Sharma",
        "phone": "9876543210",
        "address": "Flat 402, Lotus Orchid, Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560038"
      },
      "items": [
        {
          "sku": "102001",
          "variant_code": "102001",
          "product_title": "Katan Silk Handloom Banarasi Saree",
          "color": "Copper",
          "quantity": 2
        }
      ]
    },
    {
      "id": "ord_a12c45e8-9b10",
      "reseller_order_id": "RESELLER-ORD-1093",
      "created_at": "2026-08-27T03:30:00Z",
      "status": "payment_pending",
      "status_label": "Payment Pending",
      "payment_status": "pending",
      "payment_link": "https://www.weave365.com/order-tracking/ord_a12c45e8-9b10?pay=1",
      "tracking": {
        "carrier": null,
        "tracking_number": null,
        "tracking_message": null,
        "tracking_url": "https://www.weave365.com/order-tracking/ord_a12c45e8-9b10",
        "is_dispatched": false
      },
      "customer": {
        "name": "Ananya Verma",
        "phone": "9812345678",
        "address": "12 Banjara Hills, Road No 3",
        "city": "Hyderabad",
        "state": "Telangana",
        "pincode": "500034"
      },
      "items": [
        {
          "sku": "100001",
          "variant_code": "100001",
          "product_title": "Pure Kanchipuram Silk Saree",
          "color": "Royal Blue",
          "quantity": 1
        }
      ]
    }
  ]
}`}</pre>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Order API Permission Requirement</span>
                  <span className="api-status-code-badge forbidden">HTTP 403 Forbidden</span>
                </div>
                <p className="api-endpoint-note">
                  If Order API permissions are disabled for your key, this endpoint responds with:
                </p>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "error",
  "code": "FORBIDDEN",
  "message": "Order API access is not enabled for this API key."
}`}</pre>
                </div>
              </div>
            </div>

            {/* 6. GET /api/v1/me */}
            <div id="endpoint-me" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge get">GET</span>
                  <span>/api/v1/me</span>
                </div>
                <span className="api-endpoint-tag">Account &amp; Live Quota Metrics</span>
              </div>
              <div className="api-endpoint-body">
                <p>Inspect your current API key details, catalog sync mode, remaining monthly quota, rate limits, active permissions, and live usage statistics.</p>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "client_name": "My Reseller Store",
  "client_website": "https://mystore.com",
  "tier": "growth",
  "monthly_quota": 10000,
  "month_total_used": 1420,
  "remaining_quota": 8580,
  "rate_limit_rps": 3,
  "is_active": true,
  "orders_enabled": true,
  "usage_history": [
    {
      "usage_date": "2026-08-26",
      "total_requests": 142,
      "successful_requests": 140,
      "rate_limited_requests": 2
    }
  ]
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Rate Limits & Quotas */}
          <section id="rate-limits" className="api-docs-section">
            <h2>Rate Limits &amp; Quotas</h2>
            <p>
              Request quotas are allocated per calendar month and reset automatically on the 1st of every month at 00:00 UTC. Choose an inventory polling frequency suited to your plan:
            </p>

            <div className="api-table-wrapper">
              <table className="api-params-table">
                <thead>
                  <tr>
                    <th>Sync Frequency</th>
                    <th>Monthly Requests</th>
                    <th>Recommended Tier</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Every 1–2 Hours</strong></td>
                    <td>~360–720 req / month</td>
                    <td><span style={{ color: '#2563eb', fontWeight: 600 }}>Growth Partner (₹299)</span> — Continuous 24/7 sync</td>
                  </tr>
                  <tr>
                    <td><strong>Every 15 Minutes</strong></td>
                    <td>~2,880 req / month</td>
                    <td><span style={{ color: '#2563eb', fontWeight: 600 }}>Growth Partner (₹299)</span> — High-frequency sync</td>
                  </tr>
                  <tr>
                    <td><strong>Every 5 Minutes</strong></td>
                    <td>~8,640 req / month</td>
                    <td><span style={{ color: '#2563eb', fontWeight: 600 }}>Growth Partner (₹299)</span> — Near real-time sync</td>
                  </tr>
                  <tr>
                    <td><strong>Real-Time / Multi-Store</strong></td>
                    <td>~15,000–25,000 req / month</td>
                    <td><span style={{ color: '#0f172a', fontWeight: 600 }}>Pro Scale (₹499)</span> — Dedicated high volume sync</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3>Quota Safety Guard</h3>
            <p>
              When your monthly quota is reached, endpoints safely respond with <code>HTTP 429 Too Many Requests</code> (code <code>QUOTA_EXCEEDED</code>) to prevent serving outdated stock availability.
            </p>

            <div className="api-code-wrapper">
              <div className="api-code-header">
                <span className="api-code-title">Quota Exceeded Error Response</span>
                <span className="api-status-code-badge warning">HTTP 429 Too Many Requests</span>
              </div>
              <pre className="api-code-pre">{`{
  "status": "error",
  "code": "QUOTA_EXCEEDED",
  "message": "Monthly API quota of 10,000 requests has been exceeded.",
  "upgrade_info": {
    "current_tier": "growth",
    "monthly_quota": 10000,
    "whatsapp_support": "+91 9919101369"
  }
}`}</pre>
            </div>
          </section>

          {/* Section: Pricing Tiers */}
          <section id="pricing" className="api-docs-section">
            <h2>Pricing Tiers</h2>
            <p>Select a plan matched to your store&apos;s monthly catalog sync volume:</p>

            <div className="api-pricing-grid" style={{ maxWidth: '860px', margin: '1.75rem auto' }}>
              {/* Growth Partner */}
              <div className="api-pricing-card">
                <div className="api-pricing-top">
                  <div className="api-pricing-header">
                    <span className="api-pricing-name">Growth Partner</span>
                    <p className="api-pricing-desc">For storefronts syncing live stock &amp; catalog</p>
                  </div>
                  <div className="api-pricing-price-wrap">
                    <span className="api-pricing-amount">₹299</span>
                    <span className="api-pricing-period">/ month</span>
                  </div>

                  <div className="api-pricing-divider" />

                  <ul className="api-pricing-features">
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span><strong>10,000</strong> requests / month (3 req/sec)</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Full B2R Catalog Feed (<code>/api/v1/catalog</code>)</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Real-time stock status sync (<code>/api/v1/stock-status</code>)</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>WooCommerce &amp; Shopify cron sync code</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Standard B2R Reseller pricing feed</span>
                    </li>
                    <li style={{ color: '#94a3b8' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, marginRight: '4px' }}>✕</span>
                      <span>Automated Orders API (Manual orders on Weave365)</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="/account?tab=developer"
                  className="api-pricing-btn secondary"
                >
                  Activate in Dashboard
                </a>
              </div>

              {/* Pro Scale */}
              <div className="api-pricing-card featured">
                <div className="api-pricing-top">
                  <div className="api-pricing-header">
                    <span className="api-pricing-name">Pro Scale</span>
                    <p className="api-pricing-desc">Full Automation: Catalog + Orders API</p>
                  </div>
                  <div className="api-pricing-price-wrap">
                    <span className="api-pricing-amount">₹499</span>
                    <span className="api-pricing-period">/ month</span>
                  </div>

                  <div className="api-pricing-divider" />

                  <ul className="api-pricing-features">
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span><strong>25,000</strong> requests / month (5 req/sec)</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span><strong>Everything in Growth Partner plan</strong></span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span><strong>Automated Orders API (<code>/api/v1/orders</code>)</strong></span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Multi-store SKU routing &amp; priority queue</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Priority warehouse dispatch queue</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Dedicated technical account manager</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="/account?tab=developer"
                  className="api-pricing-btn primary"
                >
                  Activate in Dashboard
                </a>
              </div>
            </div>
          </section>

          {/* Section: Dashboard Management */}
          <section id="dashboard-guide" className="api-docs-section">
            <h2>Managing From Your Developer Dashboard</h2>
            <p>
              Every registered reseller has full access to the self-service Developer Portal inside their account area:
            </p>

            <div className="api-dashboard-features-grid">
              <div className="api-dashboard-feature-card">
                <div className="api-dashboard-feature-icon-wrap blue">
                  <KeyRound size={20} />
                </div>
                <h4>Key Provisioning</h4>
                <p>Generate, reveal, copy, or refresh secret API tokens securely with salted SHA-256 storage.</p>
              </div>

              <div className="api-dashboard-feature-card">
                <div className="api-dashboard-feature-icon-wrap green">
                  <Sliders size={20} />
                </div>
                <h4>Live Usage Gauges</h4>
                <p>Track remaining monthly requests and daily request histograms in real time.</p>
              </div>

              <div className="api-dashboard-feature-card">
                <div className="api-dashboard-feature-icon-wrap pink">
                  <Terminal size={20} />
                </div>
                <h4>In-Browser Test Console</h4>
                <p>Send live test queries and view response headers directly in the browser.</p>
              </div>
            </div>

            <div className="api-dashboard-cta-wrap">
              <a href="/account?tab=developer" className="api-pricing-btn primary api-dashboard-cta">
                Launch Developer Dashboard <ArrowRight size={16} />
              </a>
            </div>
          </section>
        </main>
      </div>

      {/* Floating Scroll-to-Top Button for Mobile */}
      {showScrollTop && (
        <button
          type="button"
          className="api-scroll-top-btn"
          onClick={scrollToTop}
          aria-label="Scroll back to top"
          title="Back to top"
        >
          <ArrowUpIcon size={14} />
          <span>Top</span>
        </button>
      )}
    </div>
  );
}
