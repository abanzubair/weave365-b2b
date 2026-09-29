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
  ChevronDown
} from '../components/icons.jsx';
import '../styles/developerApiDoc.css';

const NAV_GROUPS = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview', icon: BookOpen },
      { id: 'authentication', label: 'Authentication', icon: KeyRound },
      { id: 'platforms', label: 'Supported Platforms', icon: Layers },
      { id: 'curated-catalog', label: 'Curated Catalog Sync', icon: Sparkles },
    ],
  },
  {
    title: 'API Endpoints',
    items: [
      { id: 'endpoint-catalog', label: 'GET /catalog', method: 'GET', desc: 'Reseller Catalog' },
      { id: 'endpoint-stock', label: 'GET /stock-status', method: 'GET', desc: 'Stock Map' },
      { id: 'endpoint-product', label: 'GET /products/:sku', method: 'GET', desc: 'Product Lookup' },
      { id: 'endpoint-order', label: 'POST /orders', method: 'POST', desc: 'Forward Dropship' },
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
  'authentication',
  'platforms',
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
    shopify: `# Shopify Integration via Live CSV / JSON Sync Feed
# 1. Open Matrixify or Stock Sync app in your Shopify Admin
# 2. Add a new Scheduled Feed with the following parameters:

Feed URL: https://www.weave365.com/api/v1/catalog?format=shopify
HTTP Headers:
  x-api-key: w365_live_YOUR_API_KEY

Frequency: Every 1 Hour (or Daily)
Update Fields: 
  - Variant Price -> Reseller Procurement Price
  - Compare At Price -> Suggested Retail MRP
  - Inventory Quantity -> 5 (In Stock) or 0 (Out of Stock)
  - Images -> Weave365 High-Resolution CDN URLs`,

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

// 2. Forward Customer Order Directly for Blind Dropship Dispatch
async function placeDropshipOrder(orderData) {
  const res = await fetch(\`\${BASE_URL}/orders\`, {
    method: 'POST',
    headers: {
      'x-api-key': WEAVE365_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      reseller_order_id: orderData.storeOrderId,
      items: [
        { sku: '100001', color: 'Royal Blue', quantity: 1 }
      ],
      shipping_address: {
        name: orderData.customerName,
        phone: orderData.customerPhone,
        address_line1: orderData.address1,
        city: orderData.city,
        state: orderData.state,
        pincode: orderData.pincode
      },
      packing_preference: 'Blind Packaging'
    })
  });
  
  const result = await res.json();
  console.log('Order queued for weaver dispatch! Tracking URL:', result.tracking_url);
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

    curl: `# 1. Fetch Reseller Catalog (JSON)
curl -X GET "https://www.weave365.com/api/v1/catalog" \\
  -H "x-api-key: w365_live_YOUR_API_KEY"

# 2. Check Lightweight Stock Status
curl -X GET "https://www.weave365.com/api/v1/stock-status" \\
  -H "x-api-key: w365_live_YOUR_API_KEY"

# 3. Lookup Single Saree SKU
curl -X GET "https://www.weave365.com/api/v1/products/100001" \\
  -H "x-api-key: w365_live_YOUR_API_KEY"

# 4. Push Dropship Customer Order
curl -X POST "https://www.weave365.com/api/v1/orders" \\
  -H "x-api-key: w365_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reseller_order_id": "RESELLER-ORD-1092",
    "items": [{"sku": "100001", "color": "Royal Blue", "quantity": 1}],
    "shipping_address": {
      "name": "Ananya Verma",
      "phone": "9876543210",
      "address_line1": "Flat 302, Green Meadows",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400050"
    }
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
              High-performance REST API for B2B resellers and automated storefronts. Synchronize wholesale catalogs, verify real-time handloom stock, and submit blind dropship fulfillment orders directly with Varanasi weavers.
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
              The Weave365 REST API allows B2B resellers and eCommerce storefronts to query live catalog pricing, verify real-time inventory availability, and automate dropship order fulfillment directly with weavers in Varanasi.
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
                        <td><span className="api-param-name">format</span></td>
                        <td><span className="api-param-type">string (optional)</span></td>
                        <td>Set to <code>shopify</code> to format directly for Shopify Matrixify or automated sync apps.</td>
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
                <span className="api-endpoint-tag">Forward Dropship Order</span>
              </div>
              <div className="api-endpoint-body">
                <p>
                  Forward your customer&apos;s order directly to the Weave365 fulfillment center in Varanasi. 
                  All parcels are dispatched under <strong>Blind Packaging</strong> (your store name as the sender, zero supplier branding or invoices).
                </p>

                <div className="api-response-header">
                  <span className="api-response-title">Request Body (JSON)</span>
                </div>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "reseller_order_id": "RESELLER-ORD-1092",
  "items": [
    {
      "sku": "100001",
      "color": "Royal Blue",
      "quantity": 1
    }
  ],
  "shipping_address": {
    "name": "Priya Sharma",
    "phone": "9876543210",
    "address_line1": "Flat 402, Lotus Residency",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  },
  "packing_preference": "Blind Packaging"
}`}</pre>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Success Response</span>
                  <span className="api-status-code-badge success">HTTP 201 Created</span>
                </div>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "order_id": "ord_8f7b2a19-3c94",
  "reseller_order_id": "RESELLER-ORD-1092",
  "message": "Order received successfully and queued for wholesale fulfillment.",
  "tracking_url": "https://www.weave365.com/order-tracking/ord_8f7b2a19-3c94",
  "estimated_dispatch": "24-48 Business Hours"
}`}</pre>
                </div>

                <div className="api-response-header">
                  <span className="api-response-title">Order API Permission Requirement</span>
                  <span className="api-status-code-badge forbidden">HTTP 403 Forbidden</span>
                </div>
                <p className="api-endpoint-note">
                  Dropship ordering requires active Order API permissions (enabled by default on Growth tier or upon partner onboarding approval):
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
                        <td>Filter by order status (<code>new</code>, <code>verified</code>, <code>processing</code>, <code>dispatched</code>, <code>delivered</code>, <code>cancelled</code>).</td>
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
  "total_orders": 1,
  "orders": [
    {
      "id": "ord_8f7b2a19-3c94",
      "reseller_order_id": "RESELLER-ORD-1092",
      "created_at": "2026-08-27T01:15:00Z",
      "status": "dispatched",
      "status_label": "Dispatched / In Transit",
      "is_dropship": true,
      "tracking": {
        "carrier": "Delhivery Express",
        "tracking_number": "DEL198273645",
        "tracking_message": "Dispatched via Delhivery Surface. Expected delivery in 3 days.",
        "tracking_url": "https://www.weave365.com/order-tracking/ord_8f7b2a19-3c94",
        "is_dispatched": true
      },
      "customer": {
        "name": "Priya Sharma",
        "phone": "9876543210",
        "address": "Flat 402, Lotus Residency",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001"
      },
      "items": [
        {
          "sku": "100001",
          "variant_code": "100001",
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
  "monthly_quota": 20000,
  "month_total_used": 1420,
  "remaining_quota": 18580,
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
                    <td><strong>Every 2 Hours</strong></td>
                    <td>~360 req / month</td>
                    <td><span style={{ color: '#0f172a', fontWeight: 600 }}>Starter (Free)</span> — Runs smoothly all 30 days</td>
                  </tr>
                  <tr>
                    <td><strong>Every 1 Hour</strong></td>
                    <td>~720 req / month</td>
                    <td><span style={{ color: '#0f172a', fontWeight: 600 }}>Starter (Free)</span> — Fits within 2,000 quota</td>
                  </tr>
                  <tr>
                    <td><strong>Every 15 Minutes</strong></td>
                    <td>~2,880 req / month</td>
                    <td><span style={{ color: '#2563eb', fontWeight: 600 }}>Growth Partner (₹699)</span> — Continuous 24/7 sync</td>
                  </tr>
                  <tr>
                    <td><strong>Every 5 Minutes</strong></td>
                    <td>~8,640 req / month</td>
                    <td><span style={{ color: '#2563eb', fontWeight: 600 }}>Growth Partner (₹699)</span> — Near real-time sync</td>
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
  "message": "Monthly API quota of 20,000 requests has been exceeded.",
  "upgrade_info": {
    "current_tier": "growth",
    "monthly_quota": 20000,
    "whatsapp_support": "+91 9919101369"
  }
}`}</pre>
            </div>
          </section>

          {/* Section: Pricing Tiers */}
          <section id="pricing" className="api-docs-section">
            <h2>Pricing Tiers</h2>
            <p>Select a plan matched to your store&apos;s monthly catalog sync volume:</p>

            <div className="api-pricing-grid">
              {/* Starter */}
              <div className="api-pricing-card">
                <div className="api-pricing-top">
                  <div className="api-pricing-header">
                    <span className="api-pricing-name">Starter</span>
                    <p className="api-pricing-desc">For testing &amp; initial catalog sync</p>
                  </div>
                  <div className="api-pricing-price-wrap">
                    <span className="api-pricing-amount">₹0</span>
                    <span className="api-pricing-period">/ month</span>
                  </div>

                  <div className="api-pricing-divider" />

                  <ul className="api-pricing-features">
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span><strong>2,000</strong> requests / month</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Wholesale Catalog &amp; Stock API</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Standard 1–2 hr sync intervals</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Standard community docs &amp; guides</span>
                    </li>
                    <li className="disabled">
                      <span className="api-feature-dash">—</span>
                      <span>Dropship Order API (Growth tier)</span>
                    </li>
                  </ul>
                </div>

                <a href="/account?tab=developer" className="api-pricing-btn secondary">
                  Get Started Free
                </a>
              </div>

              {/* Growth Partner */}
              <div className="api-pricing-card featured">
                <div className="api-pricing-top">
                  <div className="api-pricing-header">
                    <span className="api-pricing-name">Growth Partner</span>
                    <p className="api-pricing-desc">For active stores &amp; automated dropshipping</p>
                  </div>
                  <div className="api-pricing-price-wrap">
                    <span className="api-pricing-amount">₹699</span>
                    <span className="api-pricing-period">/ month</span>
                  </div>

                  <div className="api-pricing-divider" />

                  <ul className="api-pricing-features">
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span><strong>20,000</strong> requests / month</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>High-frequency 5–15 min live sync</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Automated dropship order dispatch</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Curated feed &amp; multi-sku routing</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Priority WhatsApp developer support</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="https://wa.me/919919101369?text=Hi%20Weave365,%20I%20want%20to%20activate%20the%20Growth%20Partner%20API%20Tier%20(₹699/mo)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="api-pricing-btn primary"
                >
                  Upgrade to Growth
                </a>
              </div>

              {/* Pro Scale */}
              <div className="api-pricing-card">
                <div className="api-pricing-top">
                  <div className="api-pricing-header">
                    <span className="api-pricing-name">Pro Scale</span>
                    <p className="api-pricing-desc">For multi-store brands &amp; high volume</p>
                  </div>
                  <div className="api-pricing-price-wrap">
                    <span className="api-pricing-amount">₹1,499</span>
                    <span className="api-pricing-period">/ month</span>
                  </div>

                  <div className="api-pricing-divider" />

                  <ul className="api-pricing-features">
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span><strong>75,000</strong> requests / month</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Real-time multi-store catalog sync</span>
                    </li>
                    <li>
                      <Check size={14} className="api-feature-icon" />
                      <span>Blind white-label custom packaging</span>
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
                  href="https://wa.me/919919101369?text=Hi%20Weave365,%20I%20want%20to%20activate%20the%20Pro%20API%20Tier%20(₹1499/mo)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="api-pricing-btn secondary"
                >
                  Contact for Pro
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
