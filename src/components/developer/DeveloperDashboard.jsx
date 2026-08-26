/**
 * @file DeveloperDashboard.jsx
 * @description Unified Developer & API Integration Dashboard for Weave365.
 * Serves both User Mode (inside Account / Reseller portal) and Admin Mode (inspected by Admin).
 * Features live usage gauges, quota meters, platform integration scripts (Shopify, WooCommerce, PrestaShop),
 * and an interactive API test console.
 * 
 * @module components/developer/DeveloperDashboard
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Activity,
  Server,
  Globe,
  Code2,
  Play,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Shield,
  Layers,
  ShoppingBag,
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { developerService, TIER_CONFIGS } from '../../services/developerService.js';
import '../../styles/developerDashboard.css';

export function DeveloperDashboard({
  user,
  buyerProfile,
  apiKeyRecord: initialKeyRecord,
  isAdminMode = false,
  onAdminUpdate,
}) {
  const [apiKey, setApiKey] = useState(initialKeyRecord || null);
  const [loading, setLoading] = useState(!initialKeyRecord);
  const [revealedKey, setRevealedKey] = useState(null); // only set right after generation/regeneration
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [usageStats, setUsageStats] = useState({ usage: [], totalMonth: 0 });
  const [activePlatformTab, setActivePlatformTab] = useState('woocommerce');
  
  // Test Console State
  const [testEndpoint, setTestEndpoint] = useState('/api/v1/stock-status');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  // Admin Override Form State
  const [adminTier, setAdminTier] = useState(initialKeyRecord?.tier || 'free');
  const [adminQuota, setAdminQuota] = useState(initialKeyRecord?.monthly_quota || 2000);
  const [adminRps, setAdminRps] = useState(initialKeyRecord?.rate_limit_rps || 1);
  const [adminIsActive, setAdminIsActive] = useState(initialKeyRecord?.is_active ?? true);
  const [adminSaving, setAdminSaving] = useState(false);

  // Key creation state for new users
  const [newClientName, setNewClientName] = useState(buyerProfile?.business_name || buyerProfile?.full_name || 'My Website');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGeneratedSecret, setNewGeneratedSecret] = useState(null);

  // Load API Key and Usage
  const loadData = async () => {
    setLoading(true);
    try {
      let record = initialKeyRecord;
      if (!record && user?.id) {
        const { data } = await developerService.getApiKeyForUser(user.id);
        record = data;
      }
      setApiKey(record);
      if (record) {
        setAdminTier(record.tier || 'free');
        setAdminQuota(record.monthly_quota || 2000);
        setAdminRps(record.rate_limit_rps || 1);
        setAdminIsActive(record.is_active ?? true);

        const stats = await developerService.getUsageStats(record.id, 14);
        setUsageStats(stats);
      }
    } catch (err) {
      console.error('[DeveloperDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialKeyRecord) {
      setApiKey(initialKeyRecord);
      setAdminTier(initialKeyRecord.tier || 'free');
      setAdminQuota(initialKeyRecord.monthly_quota || 2000);
      setAdminRps(initialKeyRecord.rate_limit_rps || 1);
      setAdminIsActive(initialKeyRecord.is_active ?? true);
      void developerService.getUsageStats(initialKeyRecord.id, 14).then(setUsageStats);
    } else {
      void loadData();
    }
  }, [initialKeyRecord?.id, user?.id]);

  const copyToClipboard = (text, fieldId) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!newClientWebsite || !newClientWebsite.trim()) {
      alert('Please provide your storefront / website URL.');
      return;
    }
    setCreatingKey(true);
    try {
      const { keyRecord, rawSecretKey } = await developerService.createApiKey(user.id, {
        clientName: newClientName,
        clientWebsite: newClientWebsite.trim(),
        tier: 'free',
      });
      setApiKey(keyRecord);
      setNewGeneratedSecret(rawSecretKey);
      setRevealedKey(rawSecretKey);
      await developerService.getUsageStats(keyRecord.id, 14).then(setUsageStats);
    } catch (err) {
      alert('Failed to generate API Key: ' + err.message);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!apiKey?.id) return;
    if (!window.confirm('Are you sure you want to regenerate your API Key? Your existing key will stop working immediately.')) return;
    try {
      const { keyRecord, rawSecretKey } = await developerService.regenerateApiKey(apiKey.id);
      setApiKey(keyRecord);
      setNewGeneratedSecret(rawSecretKey);
      setRevealedKey(rawSecretKey);
      alert('New API Key generated successfully! Please copy and store it safely.');
    } catch (err) {
      alert('Failed to regenerate key: ' + err.message);
    }
  };

  const handleSaveAdminSettings = async () => {
    if (!apiKey?.id) return;
    setAdminSaving(true);
    try {
      const { data, error } = await developerService.updateApiKey(apiKey.id, {
        tier: adminTier,
        monthly_quota: parseInt(adminQuota, 10) || 2000,
        rate_limit_rps: parseInt(adminRps, 10) || 1,
        is_active: adminIsActive,
      });
      if (error) throw error;
      setApiKey(data);
      if (onAdminUpdate) onAdminUpdate(data);
      alert('API Key settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings: ' + err.message);
    } finally {
      setAdminSaving(false);
    }
  };

  const handleRunApiTest = async () => {
    setTestLoading(true);
    setTestResponse(null);
    setTestStatus(null);
    try {
      const activeKeyToUse = revealedKey || apiKey?.key_prefix || 'w365_demo_test';
      const res = await fetch(testEndpoint, {
        headers: {
          'X-API-Key': activeKeyToUse,
        },
      });
      const data = await res.json();
      setTestStatus(res.status);
      setTestResponse(data);
    } catch (err) {
      setTestStatus(500);
      setTestResponse({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  // Quota and calculations
  const monthlyQuota = apiKey?.monthly_quota || 2000;
  const currentMonthUsed = usageStats.totalMonth || 0;
  const usagePercent = Math.min(100, Math.round((currentMonthUsed / monthlyQuota) * 100));
  const remainingQuota = Math.max(0, monthlyQuota - currentMonthUsed);
  const tierInfo = TIER_CONFIGS[apiKey?.tier] || TIER_CONFIGS.free;

  // Days left in month
  const daysInMonthLeft = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(1, lastDay.getDate() - now.getDate());
  }, []);

  // Display key string
  const displayKey = revealedKey || apiKey?.key_prefix || '••••••••••••••••••••••••••••••••';

  if (loading) {
    return (
      <div className="dev-dashboard-loading">
        <RefreshCw size={28} className="spin-icon" />
        <p>Loading Developer Dashboard & API Metrics...</p>
      </div>
    );
  }

  // If user has no API Key yet and not in admin mode
  if (!apiKey && !isAdminMode) {
    return (
      <div className="dev-dashboard-empty">
        <div className="dev-empty-icon-wrap">
          <KeyRound size={42} />
        </div>
        <h2>Connect Your Website via Weave365 API</h2>
        <p>
          Automate product sync, real-time handloom silk saree stock availability, wholesale pricing, and automated order dropshipping directly to your <strong>WooCommerce</strong>, <strong>Shopify</strong>, or <strong>PrestaShop</strong> portal.
        </p>

        <div className="dev-tier-features-preview">
          <div className="tier-preview-card active">
            <span className="tier-badge">Starter (Free)</span>
            <h3>₹0 <span>/ month</span></h3>
            <ul>
              <li><Check size={14} /> 2,000 monthly requests included</li>
              <li><Check size={14} /> Full Catalog JSON Export</li>
              <li><Check size={14} /> Real-time Stock Status Sync</li>
              <li><Check size={14} /> Ready-made Shopify & WooCommerce Scripts</li>
            </ul>
          </div>
          <div className="tier-preview-card highlighted">
            <span className="tier-badge popular">Growth Partner</span>
            <h3>₹699 <span>/ month</span></h3>
            <ul>
              <li><Check size={14} /> 20,000 monthly requests</li>
              <li><Check size={14} /> Automated Order Placement API</li>
              <li><Check size={14} /> Instant Stock Alert Webhooks</li>
              <li><Check size={14} /> Priority 5 req/sec Rate Limit</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleCreateApiKey} className="dev-new-key-form">
          <div className="dev-form-row">
            <label>
              Business / Storefront Name:
              <input
                type="text"
                required
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g. My Boutique Store"
              />
            </label>
            <label>
              Website URL *:
              <input
                type="url"
                required
                value={newClientWebsite}
                onChange={(e) => setNewClientWebsite(e.target.value)}
                placeholder="https://www.example.com"
              />
            </label>
          </div>
          <button type="submit" disabled={creatingKey} className="primary-button dev-activate-btn">
            {creatingKey ? <RefreshCw size={16} className="spin-icon" /> : <Zap size={16} />}
            Generate Free Starter API Key
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="dev-dashboard-container">
      {/* 1. Admin Inspection Header (Admin Mode Only) */}
      {isAdminMode && (
        <div className="dev-admin-banner">
          <div className="dev-admin-banner-info">
            <Sliders size={18} />
            <div>
              <strong>Admin Inspection Mode:</strong> Live view for <u>{apiKey?.client_name || 'Client'}</u> ({apiKey?.profiles?.email || 'No email'})
            </div>
          </div>
          <div className="dev-admin-quick-toggles">
            <label className="dev-toggle-label">
              <span>Status:</span>
              <input
                type="checkbox"
                checked={adminIsActive}
                onChange={(e) => setAdminIsActive(e.target.checked)}
              />
              <strong className={adminIsActive ? 'text-green' : 'text-red'}>
                {adminIsActive ? 'Active' : 'Disabled'}
              </strong>
            </label>
          </div>
        </div>
      )}

      {/* 2. Top Header & Tier Bar */}
      <div className="dev-dashboard-header">
        <div className="dev-header-title">
          <div className="dev-header-badge-row">
            <span className={`dev-status-pill ${apiKey?.is_active ? 'active' : 'inactive'}`}>
              {apiKey?.is_active ? '🟢 API Live & Active' : '🔴 API Suspended'}
            </span>
            <span className={`dev-tier-pill tier-${apiKey?.tier || 'free'}`}>
              {tierInfo.name} ({tierInfo.priceLabel})
            </span>
          </div>
          <h1>{apiKey?.client_name || 'Developer API Center'}</h1>
          {apiKey?.client_website && (
            <a href={apiKey.client_website} target="_blank" rel="noopener noreferrer" className="dev-client-link">
              <Globe size={13} /> {apiKey.client_website} <ExternalLink size={11} />
            </a>
          )}
        </div>

        <div className="dev-header-actions">
          <button
            type="button"
            className="dev-secondary-btn"
            onClick={handleRegenerateKey}
            title="Generate a new API secret"
          >
            <RefreshCw size={14} /> Regenerate Secret Key
          </button>
        </div>
      </div>

      {/* Secret Key Notification Modal / Banner (When Key is newly generated) */}
      {newGeneratedSecret && (
        <div className="dev-new-secret-alert">
          <div className="dev-alert-icon"><CheckCircle2 size={22} /></div>
          <div className="dev-alert-content">
            <strong>Here is your new API Secret Key:</strong>
            <p>Make sure to copy it right now. For security purposes, you will not be able to see the full secret again.</p>
            <div className="dev-secret-copy-box">
              <code>{newGeneratedSecret}</code>
              <button
                type="button"
                onClick={() => copyToClipboard(newGeneratedSecret, 'new-secret')}
                className="dev-copy-btn"
              >
                {copiedField === 'new-secret' ? <Check size={14} /> : <Copy size={14} />}
                {copiedField === 'new-secret' ? 'Copied!' : 'Copy Key'}
              </button>
            </div>
          </div>
          <button type="button" className="dev-close-secret" onClick={() => setNewGeneratedSecret(null)}>✕</button>
        </div>
      )}

      {/* 3. Metric Gauges (Quota, RPS, Remaining) */}
      <div className="dev-metrics-grid">
        <div className="dev-metric-card">
          <div className="dev-metric-head">
            <span className="dev-metric-label">Monthly Usage</span>
            <Activity size={16} className="dev-metric-icon" />
          </div>
          <div className="dev-metric-value">
            {currentMonthUsed.toLocaleString()} <span>/ {monthlyQuota.toLocaleString()} req</span>
          </div>
          <div className="dev-progress-bar-wrap">
            <div
              className={`dev-progress-bar ${usagePercent > 85 ? 'danger' : usagePercent > 60 ? 'warning' : 'good'}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="dev-metric-footer">
            <span>{usagePercent}% utilized</span>
            <span>Resets in {daysInMonthLeft} days</span>
          </div>
        </div>

        <div className="dev-metric-card">
          <div className="dev-metric-head">
            <span className="dev-metric-label">Remaining Requests</span>
            <Server size={16} className="dev-metric-icon" />
          </div>
          <div className="dev-metric-value text-blue">
            {remainingQuota.toLocaleString()}
          </div>
          <p className="dev-metric-subtext">
            {remainingQuota === 0 ? '⚠️ Quota exhausted. Requests will return HTTP 429.' : 'Available for catalog & stock sync'}
          </p>
        </div>

        <div className="dev-metric-card">
          <div className="dev-metric-head">
            <span className="dev-metric-label">Rate Limit</span>
            <Zap size={16} className="dev-metric-icon" />
          </div>
          <div className="dev-metric-value">
            {apiKey?.rate_limit_rps || 1} <span>req / sec</span>
          </div>
          <p className="dev-metric-subtext">
            Burst buffer: {Math.max(5, (apiKey?.rate_limit_rps || 1) * 3)} requests
          </p>
        </div>
      </div>

      {/* 4. Credentials & Base URLs Card */}
      <div className="dev-card">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <KeyRound size={18} />
            <h3>API Credentials & Endpoint Access</h3>
          </div>
        </div>

        <div className="dev-credentials-list">
          <div className="dev-cred-row">
            <div className="dev-cred-info">
              <span className="dev-cred-name">API Secret Key</span>
              <span className="dev-cred-desc">Pass in HTTP header: <code>X-API-Key: &lt;your_key&gt;</code></span>
            </div>
            <div className="dev-cred-input-wrap">
              <input
                type={showKeySecret ? 'text' : 'password'}
                readOnly
                value={displayKey}
                className="dev-cred-input"
              />
              <button
                type="button"
                className="dev-icon-btn"
                onClick={() => setShowKeySecret(!showKeySecret)}
                title={showKeySecret ? 'Hide Key' : 'Reveal Key'}
              >
                {showKeySecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                className="dev-copy-btn"
                onClick={() => copyToClipboard(revealedKey || apiKey?.key_prefix, 'api-key')}
              >
                {copiedField === 'api-key' ? <Check size={14} /> : <Copy size={14} />}
                {copiedField === 'api-key' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="dev-cred-row">
            <div className="dev-cred-info">
              <span className="dev-cred-name">Base API URL</span>
              <span className="dev-cred-desc">Production Cloudflare Edge endpoint</span>
            </div>
            <div className="dev-cred-input-wrap">
              <input
                type="text"
                readOnly
                value="https://www.weave365.com/api/v1"
                className="dev-cred-input"
              />
              <button
                type="button"
                className="dev-copy-btn"
                onClick={() => copyToClipboard('https://www.weave365.com/api/v1', 'base-url')}
              >
                {copiedField === 'base-url' ? <Check size={14} /> : <Copy size={14} />}
                {copiedField === 'base-url' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Platform Integration Guides (Shopify, WooCommerce, PrestaShop, cURL) */}
      <div className="dev-card">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <Code2 size={18} />
            <h3>Platform Integration Guides & Ready-Made Scripts</h3>
          </div>
        </div>

        <div className="dev-platform-tabs">
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'woocommerce' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('woocommerce')}
          >
            WooCommerce (WordPress)
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'shopify' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('shopify')}
          >
            Shopify
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'prestashop' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('prestashop')}
          >
            PrestaShop
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'curl' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('curl')}
          >
            cURL / Terminal
          </button>
          <button
            type="button"
            className={`dev-plat-tab ${activePlatformTab === 'javascript' ? 'active' : ''}`}
            onClick={() => setActivePlatformTab('javascript')}
          >
            JavaScript / Node.js
          </button>
        </div>

        <div className="dev-platform-content">
          {activePlatformTab === 'woocommerce' && (
            <div>
              <div className="dev-plat-intro">
                <strong>WooCommerce Auto-Sync Snippet:</strong>
                <p>
                  Paste this snippet into your theme's <code>functions.php</code> or the free <em>Code Snippets</em> plugin. It will automatically query Weave365 every 2 hours and sync stock status for all sarees matching your SKU numbers.
                </p>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`// === Weave365 WooCommerce Live Stock & Catalog Sync ===
add_action('weave365_cron_stock_sync', 'sync_weave365_inventory');

function sync_weave365_inventory() {
    $api_key = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';
    $url = 'https://www.weave365.com/api/v1/stock-status';
    
    $response = wp_remote_get($url, [
        'headers' => ['X-API-Key' => $api_key],
        'timeout' => 20
    ]);
    
    if (is_wp_error($response)) return;
    $body = json_decode(wp_remote_retrieve_body($response), true);
    
    if (!empty($body['stock_map'])) {
        foreach ($body['stock_map'] as $sku => $data) {
            $product_id = wc_get_product_id_by_sku($sku);
            if ($product_id) {
                $product = wc_get_product($product_id);
                $is_available = !empty($data['is_available']);
                $product->set_stock_status($is_available ? 'instock' : 'outofstock');
                $product->save();
            }
        }
    }
}

if (!wp_next_scheduled('weave365_cron_stock_sync')) {
    wp_schedule_event(time(), 'hourly', 'weave365_cron_stock_sync');
}`}
                </pre>
                <button
                  type="button"
                  className="dev-code-copy-btn"
                  onClick={() => copyToClipboard(`// === Weave365 WooCommerce Live Stock & Catalog Sync ===\nadd_action('weave365_cron_stock_sync', 'sync_weave365_inventory');\nfunction sync_weave365_inventory() {\n    $api_key = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';\n    $response = wp_remote_get('https://www.weave365.com/api/v1/stock-status', ['headers' => ['X-API-Key' => $api_key], 'timeout' => 20]);\n    if (is_wp_error($response)) return;\n    $body = json_decode(wp_remote_retrieve_body($response), true);\n    if (!empty($body['stock_map'])) {\n        foreach ($body['stock_map'] as $sku => $data) {\n            $id = wc_get_product_id_by_sku($sku);\n            if ($id) {\n                $p = wc_get_product($id);\n                $p->set_stock_status(!empty($data['is_available']) ? 'instock' : 'outofstock');\n                $p->save();\n            }\n        }\n    }\n}\nif (!wp_next_scheduled('weave365_cron_stock_sync')) { wp_schedule_event(time(), 'hourly', 'weave365_cron_stock_sync'); }`, 'woo-code')}
                >
                  {copiedField === 'woo-code' ? <Check size={14} /> : <Copy size={14} />} Copy PHP Snippet
                </button>
              </div>
            </div>
          )}

          {activePlatformTab === 'shopify' && (
            <div>
              <div className="dev-plat-intro">
                <strong>Shopify Automated Integration:</strong>
                <p>
                  Use any Shopify data-sync app (e.g. <strong>Matrixify</strong> or <strong>Stock Sync</strong>). Provide your dedicated Shopify-formatted feed URL below:
                </p>
              </div>
              <div className="dev-shopify-box">
                <label>Your Automated Shopify JSON Feed URL:</label>
                <div className="dev-cred-input-wrap">
                  <input
                    type="text"
                    readOnly
                    value={`https://www.weave365.com/api/v1/catalog?format=shopify`}
                    className="dev-cred-input"
                  />
                  <button
                    type="button"
                    className="dev-copy-btn"
                    onClick={() => copyToClipboard(`https://www.weave365.com/api/v1/catalog?format=shopify`, 'shopify-url')}
                  >
                    {copiedField === 'shopify-url' ? <Check size={14} /> : <Copy size={14} />} Copy Feed URL
                  </button>
                </div>
                <div className="dev-shopify-steps">
                  <div className="step-num">1</div>
                  <div>In Shopify App <strong>Stock Sync</strong> or <strong>Matrixify</strong>, choose <em>New Scheduled Feed</em>.</div>
                </div>
                <div className="dev-shopify-steps">
                  <div className="step-num">2</div>
                  <div>Set Source URL to the URL above and add Header <code>X-API-Key: {revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}</code>.</div>
                </div>
                <div className="dev-shopify-steps">
                  <div className="step-num">3</div>
                  <div>Set schedule to <em>Every 2 hours</em> for automated inventory sync.</div>
                </div>
              </div>
            </div>
          )}

          {activePlatformTab === 'prestashop' && (
            <div>
              <div className="dev-plat-intro">
                <strong>PrestaShop Sync Script:</strong>
                <p>Run via PrestaShop Cron or custom module connector to synchronize warehouse quantities:</p>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`<?php
// PrestaShop 1.7 / 8.x Stock Synchronizer
require_once dirname(__FILE__) . '/config/config.inc.php';

$apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';
$ch = curl_init('https://www.weave365.com/api/v1/stock-status');
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: $apiKey"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);

$data = json_decode($res, true);
if (!empty($data['stock_map'])) {
    foreach ($data['stock_map'] as $sku => $item) {
        $id_product = (int)Db::getInstance()->getValue('SELECT id_product FROM '._DB_PREFIX_.'product WHERE reference = "'.pSQL($sku).'"');
        if ($id_product) {
            $qty = !empty($item['is_available']) ? 5 : 0;
            StockAvailable::setQuantity($id_product, 0, $qty);
        }
    }
    echo "Successfully synced ".count($data['stock_map'])." products from Weave365.";
}`}
                </pre>
              </div>
            </div>
          )}

          {activePlatformTab === 'curl' && (
            <div>
              <div className="dev-plat-intro">
                <strong>cURL Command Examples:</strong>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`# 1. Fetch Complete Wholesale Catalog
curl -X GET "https://www.weave365.com/api/v1/catalog" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 2. Fetch Lightweight Stock Availability Map
curl -X GET "https://www.weave365.com/api/v1/stock-status" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 3. Place Dropship Order via API (Growth Tier)
curl -X POST "https://www.weave365.com/api/v1/orders" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reseller_order_id": "ORD-101",
    "customer": {
      "name": "Priya Sharma",
      "phone": "+919876543210",
      "pincode": "560034",
      "address_line1": "Flat 402, Green Valley",
      "city": "Bangalore",
      "state": "Karnataka"
    },
    "items": [{ "sku": "W365-KAN-001", "quantity": 1 }]
  }'`}
                </pre>
              </div>
            </div>
          )}

          {activePlatformTab === 'javascript' && (
            <div>
              <div className="dev-plat-intro">
                <strong>Node.js / Fetch Example:</strong>
              </div>
              <div className="dev-code-block-wrap">
                <pre>
{`const apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}';

async function fetchWeave365Catalog() {
  const response = await fetch('https://www.weave365.com/api/v1/catalog', {
    headers: {
      'X-API-Key': apiKey,
    },
  });
  const data = await response.json();
  console.log('Total Products Synced:', data.total_products);
  return data.products;
}

fetchWeave365Catalog();`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Interactive Live API Test Console */}
      <div className="dev-card">
        <div className="dev-card-head">
          <div className="dev-card-title">
            <Play size={18} />
            <h3>Live API Test Console</h3>
          </div>
        </div>

        <div className="dev-test-console">
          <div className="dev-test-bar">
            <span className="dev-http-badge">GET</span>
            <select
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              className="dev-endpoint-select"
            >
              <option value="/api/v1/stock-status">/api/v1/stock-status (Real-Time Stock Map)</option>
              <option value="/api/v1/catalog">/api/v1/catalog (Full B2B Product Feed)</option>
              <option value="/api/v1/catalog?format=shopify">/api/v1/catalog?format=shopify (Shopify Feed)</option>
              <option value="/api/v1/me">/api/v1/me (Account & Usage Stats)</option>
            </select>
            <button
              type="button"
              onClick={handleRunApiTest}
              disabled={testLoading}
              className="primary-button dev-send-btn"
            >
              {testLoading ? <RefreshCw size={14} className="spin-icon" /> : <Play size={14} />}
              Send Request
            </button>
          </div>

          {testResponse && (
            <div className="dev-test-output">
              <div className="dev-test-output-head">
                <span>Response Status: <strong className={testStatus === 200 ? 'text-green' : 'text-red'}>HTTP {testStatus}</strong></span>
                <button
                  type="button"
                  className="dev-copy-btn"
                  onClick={() => copyToClipboard(JSON.stringify(testResponse, null, 2), 'test-json')}
                >
                  {copiedField === 'test-json' ? <Check size={12} /> : <Copy size={12} />} Copy JSON
                </button>
              </div>
              <pre>{JSON.stringify(testResponse, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* 7. Admin Settings Modifier (Admin Mode Only) */}
      {isAdminMode && (
        <div className="dev-card dev-admin-config-card">
          <div className="dev-card-head">
            <div className="dev-card-title">
              <Sliders size={18} />
              <h3>Admin Controls: Tier & Quota Overrides</h3>
            </div>
          </div>

          <div className="dev-admin-form-grid">
            <label>
              Plan / Pricing Tier:
              <select value={adminTier} onChange={(e) => {
                setAdminTier(e.target.value);
                const cfg = TIER_CONFIGS[e.target.value];
                if (cfg) {
                  setAdminQuota(cfg.monthlyQuota);
                  setAdminRps(cfg.rateLimitRps);
                }
              }}>
                <option value="free">Starter (Free) - 2,000 req/mo</option>
                <option value="growth">Growth Partner (₹699/mo) - 20,000 req/mo</option>
                <option value="pro">Pro / Scale (₹1,499/mo) - 75,000 req/mo</option>
              </select>
            </label>

            <label>
              Monthly Request Quota:
              <input
                type="number"
                value={adminQuota}
                onChange={(e) => setAdminQuota(e.target.value)}
              />
            </label>

            <label>
              Rate Limit (Req / Sec):
              <input
                type="number"
                value={adminRps}
                onChange={(e) => setAdminRps(e.target.value)}
              />
            </label>
          </div>

          <div className="dev-admin-action-row">
            <button
              type="button"
              onClick={handleSaveAdminSettings}
              disabled={adminSaving}
              className="primary-button"
            >
              {adminSaving ? <RefreshCw size={14} className="spin-icon" /> : <Check size={14} />}
              Save Client API Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
