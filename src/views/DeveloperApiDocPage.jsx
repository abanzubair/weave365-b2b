/**
 * @file DeveloperApiDocPage.jsx
 * @description Comprehensive Developer API Documentation & Platform Integration Guide
 * Minimalist, high-performance developer documentation for Weave365 B2B Resellers.
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
  Sparkles
} from 'lucide-react';
import '../styles/developerApiDoc.css';

export default function DeveloperApiDocPage() {
  const [copiedSection, setCopiedSection] = useState(null);
  const [activePlatformTab, setActivePlatformTab] = useState('shopify');
  const [activeEndpointTab, setActiveEndpointTab] = useState('catalog');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const sectionIds = [
      'overview',
      'authentication',
      'platforms',
      'endpoint-catalog',
      'endpoint-stock',
      'endpoint-product',
      'endpoint-order',
      'endpoint-me',
      'rate-limits',
      'pricing',
      'dashboard-guide',
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sectionIds[i]);
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
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
            'Accept: application/json'
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

    nodejs: `// Node.js (ES Modules) - Fetch Catalog & Forward Dropship Order
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
  }'`
  };

  return (
    <div className="api-docs-page">
      {/* Main Documentation Body */}
      <div className="api-docs-container">
        {/* Sticky Table of Contents Sidebar with Dynamic Scrollspy */}
        <aside className="api-docs-sidebar">
          <div className="api-docs-nav-group">
            <div className="api-docs-nav-title">Getting Started</div>
            <ul className="api-docs-nav-list">
              <li>
                <a
                  href="#overview"
                  className={`api-docs-nav-link ${activeSection === 'overview' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('overview'); }}
                >
                  Overview
                </a>
              </li>
              <li>
                <a
                  href="#authentication"
                  className={`api-docs-nav-link ${activeSection === 'authentication' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('authentication'); }}
                >
                  Authentication
                </a>
              </li>
              <li>
                <a
                  href="#platforms"
                  className={`api-docs-nav-link ${activeSection === 'platforms' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('platforms'); }}
                >
                  Supported Platforms
                </a>
              </li>
              <li>
                <a
                  href="#curated-catalog"
                  className={`api-docs-nav-link ${activeSection === 'curated-catalog' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('curated-catalog'); }}
                >
                  Curated Catalog Sync
                </a>
              </li>
            </ul>
          </div>

          <div className="api-docs-nav-group">
            <div className="api-docs-nav-title">API Endpoints</div>
            <ul className="api-docs-nav-list">
              <li>
                <a
                  href="#endpoint-catalog"
                  className={`api-docs-nav-link ${activeSection === 'endpoint-catalog' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('endpoint-catalog'); }}
                >
                  GET /catalog
                </a>
              </li>
              <li>
                <a
                  href="#endpoint-stock"
                  className={`api-docs-nav-link ${activeSection === 'endpoint-stock' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('endpoint-stock'); }}
                >
                  GET /stock-status
                </a>
              </li>
              <li>
                <a
                  href="#endpoint-product"
                  className={`api-docs-nav-link ${activeSection === 'endpoint-product' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('endpoint-product'); }}
                >
                  GET /products/:sku
                </a>
              </li>
              <li>
                <a
                  href="#endpoint-order"
                  className={`api-docs-nav-link ${activeSection === 'endpoint-order' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('endpoint-order'); }}
                >
                  POST /orders
                </a>
              </li>
              <li>
                <a
                  href="#endpoint-me"
                  className={`api-docs-nav-link ${activeSection === 'endpoint-me' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('endpoint-me'); }}
                >
                  GET /me
                </a>
              </li>
            </ul>
          </div>

          <div className="api-docs-nav-group">
            <div className="api-docs-nav-title">Tiers & Limits</div>
            <ul className="api-docs-nav-list">
              <li>
                <a
                  href="#rate-limits"
                  className={`api-docs-nav-link ${activeSection === 'rate-limits' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('rate-limits'); }}
                >
                  Rate Limits & Quota Reset
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className={`api-docs-nav-link ${activeSection === 'pricing' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}
                >
                  Pricing Tiers
                </a>
              </li>
              <li>
                <a
                  href="#dashboard-guide"
                  className={`api-docs-nav-link ${activeSection === 'dashboard-guide' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); scrollToSection('dashboard-guide'); }}
                >
                  Managing Your Key
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Content Flow */}
        <main className="api-docs-content">
          {/* Section: Overview */}
          <section id="overview" className="api-docs-section">
            <h2>Overview</h2>
            <p>
              The Weave365 REST API allows B2B resellers and eCommerce storefronts to query live catalog pricing, verify real-time inventory availability, and automate dropship order fulfillment directly with weavers in Varanasi.
            </p>
          </section>

          {/* Section: Authentication */}
          <section id="authentication" className="api-docs-section">
            <h2>Authentication</h2>
            <p>
              All requests must include your secret API key. Pass it in the HTTP headers using either <code>x-api-key</code> or as a standard <code>Bearer</code> token.
            </p>

            <div className="api-code-wrapper">
              <div className="api-code-header">
                <span>HTTP Request Headers</span>
                <button
                  type="button"
                  className="api-code-copy-btn"
                  onClick={() => copyToClipboard('x-api-key: w365_live_YOUR_SECRET_KEY\nAuthorization: Bearer w365_live_YOUR_SECRET_KEY', 'auth')}
                >
                  {copiedSection === 'auth' ? <Check size={12} /> : <Copy size={12} />} Copy
                </button>
              </div>
              <pre className="api-code-pre">
x-api-key: w365_live_9a7f8e1b4c3d2e...
# OR
Authorization: Bearer w365_live_9a7f8e1b4c3d2e...</pre>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              You can generate and reveal your API key in your <a href="/account?tab=developer" style={{ color: '#2563eb', fontWeight: 600 }}>Account Developer Dashboard</a>.
            </p>
          </section>

          {/* Section: Platform Integrations */}
          <section id="platforms" className="api-docs-section">
            <h2>Supported Platforms & Integration Guides</h2>
            <p>
              Whether you run a Shopify store, WooCommerce, PrestaShop, or a custom Next.js/Node.js web application, Weave365 provides native support:
            </p>

            <div className="api-platform-tabs-nav">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`api-platform-tab-btn ${activePlatformTab === p.id ? 'active' : ''}`}
                    onClick={() => setActivePlatformTab(p.id)}
                  >
                    <Icon size={15} /> {p.name}
                  </button>
                );
              })}
            </div>

            <div className="api-code-wrapper">
              <div className="api-code-header">
                <span>{platforms.find((p) => p.id === activePlatformTab)?.name} Integration Code</span>
                <button
                  type="button"
                  className="api-code-copy-btn"
                  onClick={() => copyToClipboard(codeSnippets[activePlatformTab], 'platform-code')}
                >
                  {copiedSection === 'platform-code' ? <Check size={12} /> : <Copy size={12} />} Copy Code
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

            <table className="api-params-table" style={{ marginTop: '0.75rem' }}>
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
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Catalog & Reseller Price</span>
              </div>
              <div className="api-endpoint-body">
                <p>Fetches the live Weave365 catalog with high-resolution imagery and strictly the Reseller Procurement Price.</p>

                <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: '#64748b', margin: '1rem 0 0.5rem 0' }}>Query Parameters</h4>
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

                <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: '#64748b', margin: '1rem 0 0.5rem 0' }}>Response (JSON)</h4>
                <div className="api-code-wrapper">
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
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Ultra-Lightweight Stock Map</span>
              </div>
              <div className="api-endpoint-body">
                <p>
                  Returns an ultra-compact map of all SKUs and their instant stock availability. 
                  Ideal for frequent (every 5-15 minute) inventory polling without consuming bandwidth or heavy payloads.
                </p>

                <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: '#64748b', margin: '1rem 0 0.5rem 0' }}>Query Parameters</h4>
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
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Single Product Lookup</span>
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
              </div>
            </div>

            {/* 4. POST /api/v1/orders */}
            <div id="endpoint-order" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge post">POST</span>
                  <span>/api/v1/orders</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Forward Dropship Order</span>
              </div>
              <div className="api-endpoint-body">
                <p>
                  Forward your customer&apos;s order directly to the Weave365 fulfillment center in Varanasi. 
                  All parcels are dispatched under <strong>Blind Packaging</strong> (your store name as the sender, zero supplier branding or invoices).
                </p>

                <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: '#64748b', margin: '1rem 0 0.5rem 0' }}>Request Body (JSON)</h4>
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

                <h4 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', color: '#64748b', margin: '1rem 0 0.5rem 0' }}>Response (HTTP 201 Created)</h4>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "order_id": "ord_8f7b2a19-3c94",
  "reseller_order_id": "RESELLER-ORD-1092",
  "message": "Order received successfully and queued for wholesale fulfillment.",
  "tracking_url": "https://www.weave365.com/order-tracking?id=ord_8f7b2a19-3c94",
  "estimated_dispatch": "24-48 Business Hours"
}`}</pre>
                </div>
              </div>
            </div>

            {/* 5. GET /api/v1/me */}
            <div id="endpoint-me" className="api-endpoint-card">
              <div className="api-endpoint-header">
                <div className="api-endpoint-route">
                  <span className="api-method-badge get">GET</span>
                  <span>/api/v1/me</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Account & Live Quota Metrics</span>
              </div>
              <div className="api-endpoint-body">
                <p>Inspect your current API key details, catalog sync mode, remaining monthly quota, rate limits, and live daily usage statistics.</p>
                <div className="api-code-wrapper">
                  <pre className="api-code-pre">{`{
  "status": "success",
  "client_name": "My Reseller Store",
  "tier": "growth",
  "catalog_mode": "curated",
  "selected_skus_count": 24,
  "monthly_quota": 20000,
  "quota_used_this_month": 1420,
  "quota_remaining": 18580,
  "rate_limit_rps": 3,
  "allowed_endpoints": ["catalog", "stock", "product", "orders"]
}`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Rate Limits & Quotas */}
          <section id="rate-limits" className="api-docs-section">
            <h2>Rate Limits & Quotas</h2>
            <p>
              Request quotas are allocated per calendar month and reset automatically on the 1st of every month at 00:00 UTC. Choose an inventory polling frequency suited to your plan:
            </p>

            <table className="api-params-table" style={{ margin: '1rem 0 1.5rem 0' }}>
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

            <h3>Quota Safety Guard</h3>
            <p>
              When your monthly quota is reached, endpoints safely respond with <code>HTTP 429 Too Many Requests</code> (code <code>QUOTA_EXCEEDED</code>) to prevent serving outdated stock availability.
            </p>

            <div className="api-code-wrapper">
              <div className="api-code-header">
                <span>Quota Exceeded Error Response (HTTP 429)</span>
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
              {/* Tier 1 */}
              <div className="api-pricing-card">
                <div>
                  <h3 className="api-pricing-name">Starter</h3>
                  <div className="api-pricing-price">₹0 <span>/ month</span></div>
                  <ul className="api-pricing-features">
                    <li><CheckCircle2 size={15} /> 2,000 requests / month</li>
                    <li><CheckCircle2 size={15} /> Full API Access (Catalog, Stock & Orders)</li>
                    <li><CheckCircle2 size={15} /> Standard sync (1–2 hr intervals)</li>
                    <li><CheckCircle2 size={15} /> Ideal for testing & store setup</li>
                  </ul>
                </div>
                <a href="/account?tab=developer" className="api-pricing-btn api-pricing-btn-outline">
                  Get Started Free
                </a>
              </div>

              {/* Tier 2 */}
              <div className="api-pricing-card featured">
                <span className="api-pricing-card-badge">Most Popular</span>
                <div>
                  <h3 className="api-pricing-name">Growth Partner</h3>
                  <div className="api-pricing-price">₹699 <span>/ month</span></div>
                  <ul className="api-pricing-features">
                    <li><CheckCircle2 size={15} /> 20,000 requests / month</li>
                    <li><CheckCircle2 size={15} /> 24/7 High-frequency sync (5–15 min)</li>
                    <li><CheckCircle2 size={15} /> Production volume for active stores</li>
                    <li><CheckCircle2 size={15} /> Automated dropship order dispatch</li>
                    <li><CheckCircle2 size={15} /> Priority WhatsApp developer support</li>
                  </ul>
                </div>
                <a
                  href="https://wa.me/919919101369?text=Hi%20Weave365,%20I%20want%20to%20activate%20the%20Growth%20Partner%20API%20Tier%20(₹699/mo)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="api-pricing-btn api-pricing-btn-primary"
                >
                  Upgrade to Growth
                </a>
              </div>

              {/* Tier 3 */}
              <div className="api-pricing-card">
                <div>
                  <h3 className="api-pricing-name">Pro Scale</h3>
                  <div className="api-pricing-price">₹1,499 <span>/ month</span></div>
                  <ul className="api-pricing-features">
                    <li><CheckCircle2 size={15} /> 75,000 requests / month</li>
                    <li><CheckCircle2 size={15} /> High-frequency multi-store sync</li>
                    <li><CheckCircle2 size={15} /> Blind white-label custom packing</li>
                    <li><CheckCircle2 size={15} /> Priority warehouse dispatch queue</li>
                    <li><CheckCircle2 size={15} /> Dedicated technical account manager</li>
                  </ul>
                </div>
                <a
                  href="https://wa.me/919919101369?text=Hi%20Weave365,%20I%20want%20to%20activate%20the%20Pro%20API%20Tier%20(₹1499/mo)"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="api-pricing-btn api-pricing-btn-outline"
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc' }}>
                <KeyRound size={20} style={{ color: '#2563eb', marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem', fontWeight: 600 }}>Key Provisioning</h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>Generate, reveal, copy, or refresh secret API tokens securely.</p>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc' }}>
                <Sliders size={20} style={{ color: '#16a34a', marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem', fontWeight: 600 }}>Live Usage Gauges</h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>Track remaining monthly requests and daily request histograms in real time.</p>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', background: '#f8fafc' }}>
                <Terminal size={20} style={{ color: '#db2777', marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9375rem', fontWeight: 600 }}>In-Browser Test Console</h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>Send live test queries and view response headers directly in the browser.</p>
              </div>
            </div>

            <a href="/account?tab=developer" className="api-pricing-btn api-pricing-btn-primary" style={{ width: 'fit-content' }}>
              Launch Developer Dashboard <ArrowRight size={16} />
            </a>
          </section>
        </main>
      </div>
    </div>
  );
}
