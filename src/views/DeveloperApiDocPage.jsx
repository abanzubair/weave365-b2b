/**
 * @file DeveloperApiDocPage.jsx
 * @description Minimalist, Clean Developer API Documentation & Integration Guide
 * Features a flat, modern layout without nested cards or box-within-box clutter.
 * Includes easy step-by-step guides for SyncX and Matrixify.
 * 
 * @module views/DeveloperApiDocPage
 */

'use client';

import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import {
  Code2,
  Terminal,
  Zap,
  KeyRound,
  Copy,
  Check,
  Layers,
  ArrowRight,
  ShoppingBag,
  Sliders,
  DollarSign,
  FileCode2,
  BookOpen,
  Settings,
  FileSpreadsheet,
  Truck,
  PlayIcon,
  Bell,
  GitBranch,
  ShieldCheck,
  Download,
  ExternalLink,
  AlertTriangle
} from '../components/icons.jsx';
import '../styles/developerApiDoc.css';

// Shopify SyncX Catalog API Integration Video Walkthrough
const SHOPIFY_SYNCX_VIDEO_URL = 'https://assets.weave365.com/API%20Guide/catalogue-api-shopify-integration.mp4';
// Shopify Webhook Order API Integration Video Walkthrough
const SHOPIFY_ORDER_VIDEO_URL = 'https://assets.weave365.com/API%20Guide/order-api-shopify-integration.mp4';

const NAV_GROUPS = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview', icon: BookOpen },
      { id: 'quickstart', label: '3-Step Integration', icon: Layers },
      { id: 'authentication', label: 'Authentication', icon: KeyRound },
    ],
  },
  {
    title: 'Storefront Feeds & Orders',
    items: [
      { id: 'shopify-sync', label: 'Shopify (SyncX & Matrixify)', icon: ShoppingBag },
      { id: 'shopify-orders', label: 'Shopify Order Webhooks', icon: Truck },
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
  'shopify-orders',
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

const PLATFORM_TABS = [
  { id: 'woocommerce', label: 'WooCommerce (WordPress)', Icon: FileCode2 },
  { id: 'prestashop', label: 'PrestaShop', Icon: Layers },
  { id: 'nodejs', label: 'Node.js / JS', Icon: Terminal },
  { id: 'curl', label: 'cURL / Shell', Icon: Code2 },
];

const WOO_MARKUP_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'flat', label: 'Fixed (₹)' },
];

const WOO_ROUND_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: '10', label: 'Nearest ₹10' },
  { value: '50', label: 'Nearest ₹50' },
  { value: '99', label: 'End in ₹99' },
];

function SegmentedRadioGroup({ legend, name, idPrefix, options, value, onChange }) {
  return (
    <fieldset className="api-fieldset">
      <legend className="api-legend">{legend}</legend>
      <div className="api-segmented-track">
        {options.map((opt) => {
          const inputId = `${idPrefix}-${opt.value}`;
          return (
            <div key={opt.value} className="api-segmented-item">
              <input
                type="radio"
                id={inputId}
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="api-segmented-input"
              />
              <label htmlFor={inputId} className="api-segmented-label">
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function DeveloperApiDocPage({ onSwitchToLanding }) {
  const wooCsvIdPrefix = useId();
  const [copiedKey, setCopiedKey] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'quarterly'
  const [activeShopifyTab, setActiveShopifyTab] = useState('syncx'); // 'syncx' | 'matrixify'
  const [activeShopifyOrderTab, setActiveShopifyOrderTab] = useState('notifications'); // 'notifications' | 'flow'
  const [activePlatformTab, setActivePlatformTab] = useState('woocommerce'); // 'woocommerce' | 'prestashop' | 'nodejs' | 'curl'
  const [wooMarkupType, setWooMarkupType] = useState('none'); // 'none' | 'percent' | 'flat'
  const [wooMarkupValue, setWooMarkupValue] = useState('');
  const [wooMarkupError, setWooMarkupError] = useState('');
  const [wooRoundTo, setWooRoundTo] = useState('none'); // 'none' | '10' | '50' | '99'
  const [activeSection, setActiveSection] = useState('overview');
  const platformTabRefs = useRef({});
  const shopifyVideoRef = useRef(null);
  const [isShopifyOrderPlaying, setIsShopifyOrderPlaying] = useState(false);
  const userPausedShopifyOrderRef = useRef(false);
  const syncxVideoRef = useRef(null);
  const [isSyncxPlaying, setIsSyncxPlaying] = useState(false);
  const userPausedSyncxRef = useRef(false);
  const mobileTocRef = useRef(null);
  const desktopSidebarRef = useRef(null);
  const isClickScrollingRef = useRef(false);
  const clickScrollTimerRef = useRef(null);

  // SyncX Video Walkthrough: Autoplay on 25% viewport visibility & loop
  useEffect(() => {
    const videoEl = syncxVideoRef.current;
    if (!videoEl || typeof IntersectionObserver === 'undefined') return;

    const onPlay = () => setIsSyncxPlaying(true);
    const onPause = () => setIsSyncxPlaying(false);
    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          // Start playing only when at least 25% of video is in view unless user explicitly paused it
          if (!userPausedSyncxRef.current) {
            videoEl.play().catch(() => {});
          }
        } else if (entry && !entry.isIntersecting) {
          // Pause when scrolling out of view
          videoEl.pause();
        }
      },
      {
        threshold: 0.25,
      }
    );

    observer.observe(videoEl);

    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      observer.disconnect();
    };
  }, [activeShopifyTab]);

  const toggleSyncxPlayback = () => {
    const videoEl = syncxVideoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      userPausedSyncxRef.current = false;
      videoEl.play().catch(() => {});
    } else {
      userPausedSyncxRef.current = true;
      videoEl.pause();
    }
  };

  useEffect(() => {
    const videoEl = shopifyVideoRef.current;
    if (!videoEl || typeof IntersectionObserver === 'undefined') return;

    const onPlay = () => setIsShopifyOrderPlaying(true);
    const onPause = () => setIsShopifyOrderPlaying(false);
    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          if (!userPausedShopifyOrderRef.current) {
            videoEl.play().catch(() => {});
          }
        } else if (entry && !entry.isIntersecting) {
          videoEl.pause();
        }
      },
      {
        threshold: 0.25, // Play when at least 25% of the video is in the viewport
      }
    );

    observer.observe(videoEl);

    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      observer.disconnect();
    };
  }, []);

  const toggleShopifyOrderPlayback = () => {
    const videoEl = shopifyVideoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      userPausedShopifyOrderRef.current = false;
      videoEl.play().catch(() => {});
    } else {
      userPausedShopifyOrderRef.current = true;
      videoEl.pause();
    }
  };

  // Automatically scroll mobile TOC pill rail to keep the active section in view
  useEffect(() => {
    if (!mobileTocRef.current) return;
    const activeChip = mobileTocRef.current.querySelector(`.api-mobile-toc-chip[data-section="${activeSection}"]`);
    if (activeChip) {
      const container = mobileTocRef.current;
      const chipLeft = activeChip.offsetLeft;
      const chipWidth = activeChip.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScrollLeft = chipLeft - (containerWidth / 2) + (chipWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeSection]);

  // Automatically scroll desktop left sidebar to keep the active section link visible
  useEffect(() => {
    if (!desktopSidebarRef.current) return;
    const activeLink = desktopSidebarRef.current.querySelector(`.api-sidebar-link[data-section="${activeSection}"]`);
    if (activeLink) {
      const container = desktopSidebarRef.current;
      const linkRect = activeLink.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Check if active link is out of view (above or below visible region)
      const isAbove = linkRect.top < containerRect.top + 24;
      const isBelow = linkRect.bottom > containerRect.bottom - 24;

      if (isAbove || isBelow) {
        const linkTopRelative = linkRect.top - containerRect.top + container.scrollTop;
        const targetScrollTop = linkTopRelative - (container.clientHeight / 2) + (linkRect.height / 2);

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth',
        });
      }
    }
  }, [activeSection]);

  useEffect(() => {
    return () => {
      if (clickScrollTimerRef.current) clearTimeout(clickScrollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrollingRef.current) return;

      const scrollPos = window.scrollY + 130;

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
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectPlatformTab = (tabId) => {
    setActivePlatformTab(tabId);
    const btn = platformTabRefs.current[tabId];
    if (btn && typeof btn.scrollIntoView === 'function') {
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handlePlatformTabKeyDown = (e, currentIndex) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % PLATFORM_TABS.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + PLATFORM_TABS.length) % PLATFORM_TABS.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = PLATFORM_TABS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = PLATFORM_TABS[nextIndex].id;
      selectPlatformTab(nextTab);
      const nextEl = platformTabRefs.current[nextTab];
      if (nextEl) {
        nextEl.focus();
      }
    }
  };

  const handleWooMarkupTypeChange = (nextType) => {
    setWooMarkupType(nextType);
    setWooMarkupError('');
    if (nextType === 'percent' && wooMarkupValue !== '') {
      const parsed = parseFloat(wooMarkupValue);
      if (Number.isFinite(parsed) && parsed > 500) {
        setWooMarkupValue('500');
      }
    }
  };

  const handleWooMarkupValueChange = (e) => {
    const raw = e.target.value;
    setWooMarkupValue(raw);
    if (wooMarkupError) {
      if (raw.trim() === '' || /^(\d+(\.\d{1,2})?|\.\d{1,2})$/.test(raw.trim())) {
        setWooMarkupError('');
      }
    }
  };

  const handleWooMarkupValueBlur = () => {
    if (wooMarkupType === 'none') {
      setWooMarkupError('');
      return;
    }
    const trimmed = wooMarkupValue.trim();
    if (trimmed === '') {
      setWooMarkupValue('');
      setWooMarkupError('');
      return;
    }
    if (!/^(\d+(\.\d{1,2})?|\.\d{1,2})$/.test(trimmed)) {
      setWooMarkupError('Enter a non-negative number with up to 2 decimal places.');
      return;
    }
    const parsed = parseFloat(trimmed);
    const maxAllowed = wooMarkupType === 'percent' ? 500 : 100000;
    if (!Number.isFinite(parsed) || parsed < 0) {
      setWooMarkupError('Enter a valid number of 0 or greater.');
      return;
    }
    if (parsed > maxAllowed) {
      setWooMarkupValue(String(maxAllowed));
      setWooMarkupError(
        wooMarkupType === 'percent'
          ? 'Maximum percentage markup is 500% (clamped to 500).'
          : 'Maximum fixed markup is ₹1,00,000 (clamped to 100000).'
      );
      return;
    }
    setWooMarkupValue(String(Math.round(parsed * 100) / 100));
    setWooMarkupError('');
  };

  const maxWooMarkup = wooMarkupType === 'percent' ? 500 : 100000;
  const parsedWooMarkup = parseFloat(wooMarkupValue);
  const sanitizedWooMarkup =
    wooMarkupType !== 'none' && Number.isFinite(parsedWooMarkup) && parsedWooMarkup > 0
      ? Math.round(Math.min(maxWooMarkup, Math.max(0, parsedWooMarkup)) * 100) / 100
      : 0;

  const wooCsvUrl = useMemo(() => {
    const params = [
      'key=YOUR_FULL_UNMASKED_KEY',
      'format=woocommerce',
    ];
    if (wooMarkupType === 'percent' && sanitizedWooMarkup > 0) {
      params.push(`markup_pct=${sanitizedWooMarkup}`);
    } else if (wooMarkupType === 'flat' && sanitizedWooMarkup > 0) {
      params.push(`markup_flat=${sanitizedWooMarkup}`);
    }
    if (wooRoundTo !== 'none') {
      params.push(`round_to=${wooRoundTo}`);
    }
    return `https://www.weave365.com/api/v1/catalog.csv?${params.join('&')}`;
  }, [wooMarkupType, sanitizedWooMarkup, wooRoundTo]);

  const wooPricingSummary = useMemo(() => {
    const parts = [];
    if (wooMarkupType === 'percent' && sanitizedWooMarkup > 0) {
      parts.push(`+${sanitizedWooMarkup}%`);
    } else if (wooMarkupType === 'flat' && sanitizedWooMarkup > 0) {
      parts.push(`+₹${sanitizedWooMarkup.toLocaleString('en-IN')}`);
    }
    if (wooRoundTo === '10') parts.push('Nearest ₹10');
    else if (wooRoundTo === '50') parts.push('Nearest ₹50');
    else if (wooRoundTo === '99') parts.push('End in ₹99');
    return parts.length > 0 ? `${parts.join(' · ')} · ≥ B2R cost` : 'Base B2R wholesale cost';
  }, [wooMarkupType, sanitizedWooMarkup, wooRoundTo]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      isClickScrollingRef.current = true;
      if (clickScrollTimerRef.current) clearTimeout(clickScrollTimerRef.current);
      clickScrollTimerRef.current = setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 800);

      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="api-docs-page">
      {/* Mobile Horizontal Navigation Chips */}
      <nav className="api-mobile-toc" aria-label="Mobile Table of Contents">
        <div className="api-mobile-toc-scroll" ref={mobileTocRef}>
          {SECTION_IDS.map((id) => (
            <button
              key={id}
              type="button"
              data-section={id}
              className={`api-mobile-toc-chip ${activeSection === id ? 'active' : ''}`}
              aria-current={activeSection === id ? 'true' : undefined}
              onClick={() => scrollToSection(id)}
            >
              {id === 'shopify-sync' ? 'Shopify Sync' : id === 'shopify-orders' ? 'Shopify Orders' : id.replace('endpoint-', '/').replace('-', ' ')}
            </button>
          ))}
        </div>
      </nav>

      <div className="api-docs-container">
        {/* Sticky Desktop Left Navigation Sidebar */}
        <aside className="api-sidebar-wrapper">
          <div className="api-sidebar" ref={desktopSidebarRef}>
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
                          data-section={item.id}
                          aria-current={isActive ? 'true' : undefined}
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
            </div>
          </header>

          {/* 1. Overview */}
          <section id="overview" className="api-section">
            <h2 className="api-section-title">Overview</h2>
            <p className="api-section-desc">
              The Weave365 REST API connects your boutique or e-commerce storefront directly to our Varanasi handloom &amp; powerloom warehouse. 
              Catalog feeds provide reseller wholesale pricing (B2R), authentic fabric specifications, high-resolution imagery, and color variant groupings.
            </p>

            <div
              className="api-table-scroll"
              tabIndex={0}
              role="region"
              aria-labelledby="overview-spec-caption"
            >
              <table className="api-flat-table">
                <caption id="overview-spec-caption" className="api-visually-hidden">
                  Weave365 Developer API Overview Specifications
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Specification</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Base URL</strong></td>
                    <td><code>https://www.weave365.com/api/v1</code></td>
                  </tr>
                  <tr>
                    <td><strong>Data Formats</strong></td>
                    <td>
                      JSON (REST endpoints &amp; SyncX), CSV (Matrixify, Shopify Native Importer, and <strong>WooCommerce Native CSV</strong> via <code>?format=woocommerce</code> &mdash; 22 columns, UTF-8 BOM, self-serve markup &amp; rounding)
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Authentication</strong></td>
                    <td>API Key via <code>X-API-Key</code> header, <code>Authorization: Bearer</code>, or <code>?key=</code> query param</td>
                  </tr>
                  <tr>
                    <td><strong>Edge Performance</strong></td>
                    <td>Sub-0.5ms stock status lookups with 0ms database lag via global edge network</td>
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
                    For <strong>WooCommerce</strong>, install our official <a href="#platforms" style={{ textDecoration: 'underline' }}>WordPress Sync Plugin (.zip)</a> or connect via REST endpoints.
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

                {/* Video Walkthrough: Shopify SyncX Integration */}
                <div className="api-video-card">
                  <div className="api-video-header">
                    <div className="api-video-title-wrap">
                      <PlayIcon size={18} style={{ color: '#0f172a' }} />
                      <h3 className="api-video-title">Video Walkthrough: Stock Sync (SyncX) Setup</h3>
                    </div>
                    <span className="api-video-badge">2m 38s Quick Guide</span>
                  </div>

                  <div className="api-video-container">
                    <video
                      ref={syncxVideoRef}
                      className="api-video-element"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      loading="lazy"
                      width={1920}
                      height={1080}
                      onClick={toggleSyncxPlayback}
                      title={isSyncxPlaying ? 'Click to pause video' : 'Click to play video'}
                    >
                      <source src={SHOPIFY_SYNCX_VIDEO_URL} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>

                    {/* Minimal Play / Pause Options without cluttered browser controls */}
                    {!isSyncxPlaying && (
                      <button
                        type="button"
                        className="api-video-center-play-btn"
                        onClick={toggleSyncxPlayback}
                        aria-label="Play video"
                      >
                        <PlayIcon size={28} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Phase 1: Initial Import with "Add" */}
                <div className="api-workflow-card">
                  <div className="api-workflow-header">
                    <span className="api-workflow-badge">Phase 1</span>
                    <h3 className="api-workflow-title">Initial Product Import (Using &quot;Add&quot;)</h3>
                  </div>
                  <p className="api-workflow-desc">
                    When setting up a new store, use Stock Sync&apos;s <strong>&quot;Add&quot;</strong> feed once to create all sarees, color variants, high-resolution photos, and authenticity descriptions.
                  </p>

                  <div className="api-clean-steps">
                    <div className="api-step-row">
                      <span className="api-step-circle">1</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Create Feed &rarr; Select &quot;Add&quot;</h4>
                        <p className="api-step-body">
                          In Shopify Admin, open <strong>syncX: Stock Sync</strong> &rarr; Click <strong>Create new feed</strong> &rarr; Select <strong>Add</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">2</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Connection &amp; Source</h4>
                        <p className="api-step-body">
                          Choose <strong>REST API / Download from URL</strong> &rarr; Paste your dedicated SyncX Feed URL from above &rarr; Click <strong>Next</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">3</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Map Product &amp; Variant Fields</h4>
                        <p className="api-step-body">
                          Match the feed fields to your Shopify store columns:
                        </p>

                        <div className="api-table-scroll">
                          <table className="api-flat-table api-field-mapping-table">
                            <thead>
                              <tr>
                                <th>Shopify Target Field</th>
                                <th>Feed Column</th>
                                <th>Notes / Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><strong>SKU</strong></td>
                                <td><code className="api-code-inline">sku</code></td>
                                <td>Unique item code per saree variant</td>
                              </tr>
                              <tr>
                                <td><strong>Title</strong></td>
                                <td><code className="api-code-inline">title</code></td>
                                <td>Product name (e.g., Banarasi Katan Silk Saree)</td>
                              </tr>
                              <tr>
                                <td><strong>Description</strong></td>
                                <td><code className="api-code-inline">description</code></td>
                                <td>Includes authenticity guarantee, fabric specs &amp; disclaimer</td>
                              </tr>
                              <tr>
                                <td><strong>Price</strong></td>
                                <td><code className="api-code-inline">price</code></td>
                                <td>Wholesale rate in ₹ (or apply your retail markup)</td>
                              </tr>
                              <tr>
                                <td><strong>Quantity</strong></td>
                                <td><code className="api-code-inline">quantity</code></td>
                                <td>Live warehouse stock count</td>
                              </tr>
                              <tr>
                                <td><strong>Product Images</strong></td>
                                <td><code className="api-code-inline">image</code></td>
                                <td>High-resolution cover and color variant photos</td>
                              </tr>
                              <tr>
                                <td><strong>Variant Grouping</strong></td>
                                <td>
                                  <div style={{ whiteSpace: 'nowrap', marginBottom: '4px' }}>
                                    Handle: <code className="api-code-inline">handle</code>
                                  </div>
                                  <div style={{ whiteSpace: 'nowrap' }}>
                                    Option 1: <code className="api-code-inline">color</code>
                                  </div>
                                </td>
                                <td>
                                  Under <em>&quot;Combine rows into one product&quot;</em>, groups colors (Rani, Navy, Wine) under the same saree
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="api-gear-callout">
                          <strong>Variant Image Mapping:</strong> Next to <strong>Product Images</strong>, click the settings gear. Under <em>Variant Image Mapping</em>, select <strong>&quot;Link image to variant when image URL is same row as variant&quot;</strong> and make sure <strong>&quot;Assign first product images to all variants&quot;</strong> is <strong>unchecked</strong>. This guarantees that clicking each color swatch in your storefront displays its matching saree photo instead of the first cover image.
                        </div>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">4</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Run Initial Import</h4>
                        <p className="api-step-body">
                          Click <strong>Finish</strong> and run the feed once. Stock Sync will populate your Shopify catalog with all products, colors, and inventory.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 2: Ongoing Stock Sync with "Update" */}
                <div className="api-workflow-card">
                  <div className="api-workflow-header">
                    <span className="api-workflow-badge">Phase 2</span>
                    <h3 className="api-workflow-title">Ongoing Stock &amp; Badge Sync (Using &quot;Update&quot;)</h3>
                  </div>
                  <p className="api-workflow-desc">
                    Once products are created in your store, set up an <strong>&quot;Update&quot;</strong> feed to refresh live inventory hourly and automatically manage &quot;In Stock&quot; / &quot;Sold Out&quot; badges without creating duplicates.
                  </p>

                  <div className="api-clean-steps">
                    <div className="api-step-row">
                      <span className="api-step-circle">1</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Create Feed &rarr; Select &quot;Update&quot;</h4>
                        <p className="api-step-body">
                          In Stock Sync, click <strong>Create new feed</strong> &rarr; Select <strong>Update</strong>. This matches products by SKU and syncs availability without disturbing custom collections or SEO URLs.
                        </p>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">2</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Connection &amp; Store Product Filters</h4>
                        <p className="api-step-body">
                          Select <strong>REST API / Download from URL</strong> and paste your SyncX Feed URL. On the <em>Store product filter</em> screen:
                        </p>
                        <div className="api-note-text" style={{ margin: '0.75rem 0' }}>
                          • Leave <strong>Store field name: Published</strong> as <code>Equal to: Any</code>.<br />
                          • Keep all 3 toggle switches turned <strong>OFF</strong> (ensures items update both when selling out to 0 and when restocked).
                        </div>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">3</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Map Matching &amp; Inventory Columns</h4>
                        <p className="api-step-body">
                          Configure matching and sync fields:
                        </p>

                        <div className="api-table-scroll">
                          <table className="api-flat-table api-field-mapping-table">
                            <thead>
                              <tr>
                                <th>Shopify Target Field</th>
                                <th>Feed Column</th>
                                <th>Purpose</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><strong>SKU (Matching Field)</strong></td>
                                <td><code className="api-code-inline">sku</code></td>
                                <td>Primary key used to locate existing products in your store</td>
                              </tr>
                              <tr>
                                <td><strong>Quantity (Inventory)</strong></td>
                                <td><code className="api-code-inline">quantity</code></td>
                                <td>Updates real-time available stock count</td>
                              </tr>
                              <tr>
                                <td><strong>Price (Optional)</strong></td>
                                <td><code className="api-code-inline">price</code></td>
                                <td>Updates prices when wholesale catalogue rates change</td>
                              </tr>
                              <tr>
                                <td><strong>Product Images (Optional)</strong></td>
                                <td><code className="api-code-inline">image</code></td>
                                <td>Optional: Syncs variant photos if catalog imagery is refreshed</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">4</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Advanced Settings (Crucial for Stock Badges)</h4>
                        <p className="api-step-body">
                          On <strong>Step 4: Advanced settings</strong>, configure these rules to control how Shopify badges and pages behave:
                        </p>

                        <div className="api-table-scroll">
                          <table className="api-flat-table">
                            <thead>
                              <tr>
                                <th>Setting Option</th>
                                <th>Value to Select</th>
                                <th>Behavior &amp; Purpose</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><strong>Auto publish</strong></td>
                                <td><code className="api-code-inline">Publish</code></td>
                                <td>Automatically makes items active &amp; purchasable when stock is available (&gt; 0)</td>
                              </tr>
                              <tr>
                                <td><strong>Auto unpublish / archive</strong></td>
                                <td><code className="api-code-inline">No action</code></td>
                                <td>Keeps product page live so your theme shows the <strong>&quot;Sold Out&quot;</strong> badge while preserving SEO ranking</td>
                              </tr>
                              <tr>
                                <td><strong>Out of stock strategy</strong></td>
                                <td><code className="api-code-inline">OFF</code></td>
                                <td>Prevents deleting or unpublishing listings when inventory hits 0</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="api-step-body">
                          Click the dark <strong>Finish &rarr;</strong> button at the top right to save the feed.
                        </p>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">5</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Set Automated Schedule &amp; Price Markup</h4>
                        <p className="api-step-body">
                          Under <strong>Schedule</strong>, select your desired sync frequency (e.g. <em>Every 1 hour</em> or <em>Daily at 08:00 AM</em>).
                          <br />
                          To automatically apply a standard <strong>+30% retail margin</strong> over wholesale prices, click <strong>Edit / Smart Settings</strong> on the Price field and paste:
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

          {/* Shopify Order Webhooks & Automated Fulfillment */}
          <section id="shopify-orders" className="api-section">
            <h2 className="api-section-title">Shopify Order Webhooks &amp; Automated Fulfillment</h2>
            <p className="api-section-desc">
              Instantly dispatch customer orders from your Shopify checkout directly to Weave 365 warehouse for automated packaging, blind dropshipping, and live courier tracking. No manual order entry or copy-pasting required.
            </p>

            {/* Video Walkthrough Card */}
            <div className="api-video-card">
              <div className="api-video-header">
                <div className="api-video-title-wrap">
                  <PlayIcon size={18} style={{ color: '#0f172a' }} />
                  <h3 className="api-video-title">Video Walkthrough: Shopify Order Webhook Setup</h3>
                </div>
                <span className="api-video-badge">40s Quick Guide</span>
              </div>

              <div className="api-video-container">
                {SHOPIFY_ORDER_VIDEO_URL ? (
                  SHOPIFY_ORDER_VIDEO_URL.includes('youtube.com') || SHOPIFY_ORDER_VIDEO_URL.includes('youtu.be') || SHOPIFY_ORDER_VIDEO_URL.includes('vimeo.com') ? (
                    <iframe
                      className="api-video-frame"
                      src={SHOPIFY_ORDER_VIDEO_URL}
                      title="Shopify Order Webhook Walkthrough"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <>
                      <video
                        ref={shopifyVideoRef}
                        className="api-video-element"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        width={1280}
                        height={720}
                        onClick={toggleShopifyOrderPlayback}
                        title={isShopifyOrderPlaying ? 'Click to pause video' : 'Click to play video'}
                      >
                        <source src={SHOPIFY_ORDER_VIDEO_URL} type="video/mp4" />
                        Your browser does not support video playback.
                      </video>

                      {!isShopifyOrderPlaying && (
                        <button
                          type="button"
                          className="api-video-center-play-btn"
                          onClick={toggleShopifyOrderPlayback}
                          aria-label="Play video"
                        >
                          <PlayIcon size={28} />
                        </button>
                      )}
                    </>
                  )
                ) : (
                  <div className="api-video-placeholder">
                    <div className="api-video-play-icon-box">
                      <PlayIcon size={24} />
                    </div>
                    <h4 className="api-video-placeholder-title">Video Walkthrough: 40-Second Shopify Setup</h4>
                    <p className="api-video-placeholder-desc">
                      Step-by-step screen recording demonstrating how to create the Order Webhook in Shopify Admin and verify automated dropship orders in Weave 365.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Built-In Smart Fulfillment Protections */}
            <div style={{ margin: '2rem 0 1.75rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <ShieldCheck size={18} style={{ color: '#0f172a' }} />
                <h3 className="api-step-heading" style={{ margin: 0, fontSize: '1rem' }}>
                  Built-In Fulfillment Protections
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <h4 className="api-step-heading" style={{ marginBottom: '0.35rem' }}>
                    Smart SKU Filtering
                  </h4>
                  <p className="api-step-body">
                    If an order contains both Weave 365 sarees and other items, Weave 365 filters and fulfills <em>only</em> the Weave items. Non-Weave items are safely ignored.
                  </p>
                </div>
                <div>
                  <h4 className="api-step-heading" style={{ marginBottom: '0.35rem' }}>
                    Automatic Deduplication
                  </h4>
                  <p className="api-step-body">
                    Shopify occasionally retries webhooks. Weave 365 automatically deduplicates incoming Shopify Order IDs to prevent duplicate fulfillment.
                  </p>
                </div>
                <div>
                  <h4 className="api-step-heading" style={{ marginBottom: '0.35rem' }}>
                    100% Blind Dropshipping
                  </h4>
                  <p className="api-step-body">
                    Packages ship directly under your boutique name and details on the label and invoice. Weave 365 warehouse branding never appears.
                  </p>
                </div>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="api-tabs-nav" style={{ marginTop: '1.75rem' }}>
              <button
                type="button"
                className={`api-tab-btn ${activeShopifyOrderTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveShopifyOrderTab('notifications')}
              >
                <Bell size={15} />
                <span>Shopify Native Webhook (Free)</span>
              </button>
              <button
                type="button"
                className={`api-tab-btn ${activeShopifyOrderTab === 'flow' ? 'active' : ''}`}
                onClick={() => setActiveShopifyOrderTab('flow')}
              >
                <GitBranch size={15} />
                <span>Shopify Flow App (Advanced)</span>
              </button>
            </div>

            {/* TAB 1: Method 1 (Shopify Native Webhooks) */}
            {activeShopifyOrderTab === 'notifications' && (
              <div>
                <p className="api-text" style={{ margin: '1rem 0 1.25rem 0' }}>
                  <strong>Recommended for all stores:</strong> Works on <strong>every Shopify plan</strong> (including Shopify Basic $39/mo, Shopify, Advanced, and Plus). It requires zero apps and sends instant real-time order payloads directly from Shopify.
                </p>

                <div style={{ margin: '1.25rem 0 1.5rem 0' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem', letterSpacing: '0.01em' }}>
                    Shopify Webhook Endpoint URL
                  </label>
                  <div className="api-feed-box" style={{ margin: 0 }}>
                    <span className="api-feed-method">POST JSON</span>
                    <input
                      type="text"
                      readOnly
                      value="https://www.weave365.com/api/v1/orders?key=w365_live_YOUR_API_KEY"
                      className="api-feed-input"
                      aria-label="Shopify Webhook Endpoint URL"
                    />
                    <button
                      type="button"
                      className={`api-feed-copy-btn ${copiedKey === 'webhook-url' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard('https://www.weave365.com/api/v1/orders?key=w365_live_YOUR_API_KEY', 'webhook-url')}
                    >
                      {copiedKey === 'webhook-url' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'webhook-url' ? 'Copied' : 'Copy Webhook URL'}</span>
                    </button>
                  </div>
                  <small style={{ color: '#64748b', fontSize: '0.875rem', display: 'block', marginTop: '0.45rem' }}>
                    * Replace <code>w365_live_YOUR_API_KEY</code> with your live API key from the Developer Dashboard.
                  </small>
                </div>

                <div className="api-clean-steps" style={{ marginTop: '1.5rem' }}>
                  <div className="api-step-row">
                    <span className="api-step-circle">1</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Open Shopify Settings &rarr; Notifications</h4>
                      <p className="api-step-body">
                        In your <strong>Shopify Admin</strong>, click the <strong>Settings</strong> gear icon at the bottom-left corner &rarr; select <strong>Notifications</strong> from the left navigation bar.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">2</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Scroll Down to Webhooks &rarr; Click &quot;Create webhook&quot;</h4>
                      <p className="api-step-body">
                        Scroll all the way to the bottom of the Notifications page until you see the <strong>Webhooks</strong> section. Click the <strong>Create webhook</strong> button.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">3</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Configure Webhook Parameters</h4>
                      <p className="api-step-body">
                        Fill in the webhook fields exactly as follows:
                      </p>
                      <div className="api-table-scroll" style={{ margin: '0.75rem 0' }}>
                        <table className="api-flat-table">
                          <thead>
                            <tr>
                              <th>Field</th>
                              <th>Setting / Value</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Event</strong></td>
                              <td><code className="api-code-inline">Order creation</code></td>
                              <td>Triggers automatically whenever a customer places an order</td>
                            </tr>
                            <tr>
                              <td><strong>Format</strong></td>
                              <td><code className="api-code-inline">JSON</code></td>
                              <td>Standard Shopify JSON payload format</td>
                            </tr>
                            <tr>
                              <td><strong>URL</strong></td>
                              <td><code className="api-code-inline">https://www.weave365.com/api/v1/orders?key=YOUR_KEY</code></td>
                              <td>Your Weave 365 orders webhook URL with your live API key</td>
                            </tr>
                            <tr>
                              <td><strong>Webhook API version</strong></td>
                              <td><code className="api-code-inline">Latest (Recommended)</code></td>
                              <td>Uses the current stable Shopify Webhook API format</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">4</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Save and Verify</h4>
                      <p className="api-step-body">
                        Click <strong>Save</strong>. You can click <strong>Send test notification</strong> next to your newly created webhook to verify connectivity. Whenever a customer places an order on your Shopify store containing Weave 365 sarees, Shopify pushes it directly to Weave 365 for dropshipping.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Method 2 (Shopify Flow App) */}
            {activeShopifyOrderTab === 'flow' && (
              <div>
                <p className="api-text" style={{ margin: '1rem 0 1.25rem 0' }}>
                  <strong>Plan Requirement:</strong> Shopify Flow is available on the <strong>Shopify plan ($105/mo)</strong>, <strong>Advanced ($399/mo)</strong>, and <strong>Shopify Plus</strong>. It provides a visual canvas for multi-step automation, tag filters, and conditional routing.
                </p>

                <div className="api-clean-steps">
                  <div className="api-step-row">
                    <span className="api-step-circle">1</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Install &amp; Open Shopify Flow</h4>
                      <p className="api-step-body">
                        In your Shopify Admin, install the free <strong>Shopify Flow</strong> app (if not already installed). Open Flow and click <strong>Create workflow</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">2</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Set Trigger to &quot;Order created&quot;</h4>
                      <p className="api-step-body">
                        Click <strong>Select a trigger</strong> &rarr; choose <strong>Shopify &rarr; Order created</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">3</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">(Optional) Add Condition Filter</h4>
                      <p className="api-step-body">
                        Click <strong>Add criteria / condition</strong> if you only want to forward orders meeting specific criteria (e.g. <code>Order / tags includes &quot;weave365&quot;</code> or <code>LineItems / vendor equals &quot;Weave365&quot;</code>). Note: If omitted, Weave 365&apos;s smart filter will automatically fulfill only Weave SKUs anyway!
                      </p>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">4</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Add Action &rarr; &quot;Send HTTP request&quot;</h4>
                      <p className="api-step-body">
                        Click <strong>Add action</strong> &rarr; select <strong>Shopify &rarr; Send HTTP request</strong>. Configure the action:
                        <br />
                        • <strong>HTTP method:</strong> <code>POST</code>
                        <br />
                        • <strong>URL:</strong> <code>https://www.weave365.com/api/v1/orders?key=w365_live_YOUR_API_KEY</code>
                        <br />
                        • <strong>Headers:</strong> Key: <code>Content-Type</code> &bull; Value: <code>application/json</code>
                        <br />
                        • <strong>Body:</strong> Paste the Liquid template below:
                      </p>

                      <div className="api-code-block" style={{ marginTop: '0.75rem' }}>
                        <div className="api-code-topbar">
                          <span className="api-code-label">Shopify Flow Liquid Body Template</span>
                          <button
                            type="button"
                            className="api-code-copy-btn"
                            onClick={() => copyToClipboard(`{
  "reseller_order_id": "{{ order.name }}",
  "customer": {
    "name": "{{ order.shippingAddress.name }}",
    "phone": "{{ order.shippingAddress.phone }}",
    "email": "{{ order.customer.email }}",
    "address_line1": "{{ order.shippingAddress.address1 }}",
    "address_line2": "{{ order.shippingAddress.address2 }}",
    "city": "{{ order.shippingAddress.city }}",
    "state": "{{ order.shippingAddress.province }}",
    "pincode": "{{ order.shippingAddress.zip }}"
  },
  "items": [
    {% for lineItem in order.lineItems %}
    {
      "sku": "{{ lineItem.sku }}",
      "quantity": {{ lineItem.quantity }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ],
  "shipping_notes": "Dropship order from Shopify Flow"
}`, 'flow-body')}
                          >
                            {copiedKey === 'flow-body' ? <Check size={12} /> : <Copy size={12} />}
                            <span>{copiedKey === 'flow-body' ? 'Copied' : 'Copy Liquid Template'}</span>
                          </button>
                        </div>
                        <pre className="api-code-content">{`{
  "reseller_order_id": "{{ order.name }}",
  "customer": {
    "name": "{{ order.shippingAddress.name }}",
    "phone": "{{ order.shippingAddress.phone }}",
    "email": "{{ order.customer.email }}",
    "address_line1": "{{ order.shippingAddress.address1 }}",
    "address_line2": "{{ order.shippingAddress.address2 }}",
    "city": "{{ order.shippingAddress.city }}",
    "state": "{{ order.shippingAddress.province }}",
    "pincode": "{{ order.shippingAddress.zip }}"
  },
  "items": [
    {% for lineItem in order.lineItems %}
    {
      "sku": "{{ lineItem.sku }}",
      "quantity": {{ lineItem.quantity }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ],
  "shipping_notes": "Dropship order from Shopify Flow"
}`}</pre>
                      </div>
                    </div>
                  </div>

                  <div className="api-step-row">
                    <span className="api-step-circle">5</span>
                    <div className="api-step-content">
                      <h4 className="api-step-heading">Turn On Workflow</h4>
                      <p className="api-step-body">
                        Click the green <strong>Turn on workflow</strong> button in the top right. Every matching order will now trigger an automated HTTP dispatch to Weave 365.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Testing Walkthrough */}
            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.625rem' }}>
                <Check size={18} style={{ color: '#0f172a' }} />
                <h3 className="api-step-heading" style={{ margin: 0 }}>
                  How to Test in 2 Minutes
                </h3>
              </div>
              <p className="api-step-body" style={{ margin: 0 }}>
                1. Enable Shopify&apos;s <strong>Bogus Gateway</strong> (in <strong>Settings &rarr; Payments</strong>) or enable <strong>Cash on Delivery (COD)</strong> for testing.
                <br />
                2. Add any synced Weave 365 saree to your cart on your storefront (e.g., SKU <code>102001-1</code>) and complete checkout.
                <br />
                3. Open your <strong>Weave 365 Developer Dashboard &rarr; Orders</strong> tab. Your order will appear with status <code>Payment Pending</code>, along with the recipient address and items!
              </p>
            </div>
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

            <div
              className="api-tabs-nav"
              role="tablist"
              aria-label="Platform integration guides"
            >
              {PLATFORM_TABS.map(({ id, label, Icon }, index) => {
                const isActive = activePlatformTab === id;
                return (
                  <button
                    key={id}
                    id={`platform-tab-${id}`}
                    ref={(el) => {
                      platformTabRefs.current[id] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={isActive ? 0 : -1}
                    className={`api-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => selectPlatformTab(id)}
                    onKeyDown={(e) => handlePlatformTabKeyDown(e, index)}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div role="tabpanel" aria-labelledby={`platform-tab-${activePlatformTab}`}>
              {activePlatformTab === 'woocommerce' && (
                <div className="api-woo-panel">
                  {/* 1. Official Plugin Header & Download Action */}
                  <div className="api-woo-header">
                    <div className="api-woo-header-top">
                      <div>
                        <div className="api-woo-kicker">WordPress &bull; WooCommerce Plugin</div>
                        <h3 className="api-woo-title">Weave365 Live Stock Sync</h3>
                      </div>

                      <a
                        href="/downloads/weave365-woocommerce-sync.zip"
                        download="weave365-woocommerce-sync.zip"
                        className="api-btn primary api-woo-download-btn"
                      >
                        <Download size={14} aria-hidden="true" />
                        <span>Download Plugin (.zip)</span>
                      </a>
                    </div>

                    <p className="api-woo-desc">
                      Connects WooCommerce to live Weave365 inventory with one-click Catalog CSV Export (markup &amp; rounding), hourly WP-Cron stock sync, Classic &amp; Blocks checkout stock verification, and entitlement-gated Order Fulfillment (HPOS compatible).
                    </p>

                    <div className="api-woo-meta">
                      <span className="api-meta-badge version">v1.2.0</span>
                      <span className="api-meta-badge">
                        <ShieldCheck size={12} aria-hidden="true" />
                        <span>HPOS Ready</span>
                      </span>
                      <span aria-hidden="true">&bull;</span>
                      <span>WooCommerce 5.0+</span>
                      <span aria-hidden="true">&bull;</span>
                      <span>PHP 7.4+</span>
                      <span aria-hidden="true">&bull;</span>
                      <span>WordPress 5.6+</span>
                      <span aria-hidden="true">&bull;</span>
                      <code>weave365-woocommerce-sync.zip</code>
                    </div>
                  </div>

                  <hr className="api-woo-divider" />

                  {/* 2. Step-by-Step Plugin Setup Guide */}
                  <h3 className="api-woo-subheading">Setup Guide (v1.2.0)</h3>

                  <div className="api-clean-steps">
                    <div className="api-step-row">
                      <span className="api-step-circle">1</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Install &amp; Activate Plugin</h4>
                        <p className="api-step-body">
                          In WordPress Admin, open <strong>Plugins &rarr; Add New Plugin &rarr; Upload Plugin</strong>, upload <code>weave365-woocommerce-sync.zip</code>, and click <strong>Install Now</strong> &rarr; <strong>Activate Plugin</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">2</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Connect Live API Key</h4>
                        <p className="api-step-body">
                          Go to <strong>WooCommerce &rarr; Weave365 Sync</strong>, paste your unmasked Live API Key (<code>w365_live_...</code>) from <a href="/account?tab=developer" target="_blank" rel="noopener noreferrer" className="api-inline-link">Weave365 Developer Dashboard</a>, and click <strong>Save API Key</strong>.
                        </p>
                        <ul className="api-substeps-list">
                          <li><strong>Entitlement check:</strong> Saving calls <code>GET /api/v1/me</code> to verify tier, monthly quota, and <code>orders_enabled</code>.</li>
                          <li><strong>6h capability cache:</strong> Click <strong>Refresh Permissions</strong> after plan upgrades or Order API key changes.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">3</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">Export &amp; Import Catalog CSV</h4>
                        <p className="api-step-body">
                          Use <strong>Catalog CSV Export</strong> inside <strong>WooCommerce &rarr; Weave365 Sync</strong> (all plans) to download <code>weave365-woocommerce-catalog.csv</code>.
                        </p>
                        <ul className="api-substeps-list">
                          <li><strong>Markup &amp; rounding:</strong> Select <em>None</em>, <em>Percentage (%)</em> (<code>0&ndash;500%</code>), or <em>Fixed (&#8377;)</em> (<code>0&ndash;100000</code>), plus rounding (<em>None</em>, <em>Nearest &#8377;10</em>, <em>Nearest &#8377;50</em>, <em>End in &#8377;99</em>; never below B2R cost).</li>
                          <li><strong>Server-side auth:</strong> Uses your saved WordPress key directly, avoiding <code>401</code> errors from masked <code>w365_live_...</code> prefixes.</li>
                          <li><strong>Import:</strong> Upload in <strong>WooCommerce &rarr; Products &rarr; Import</strong> (22 auto-mapped columns for <code>simple</code> and <code>variable</code> + <code>variation</code> SKUs) and click <strong>Run the importer</strong>.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">4</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">
                          Sync Stock &amp; Checkout Guard{' '}
                          <span className="api-meta-badge api-badge-inline">Built-in &bull; Mandatory</span>
                        </h4>
                        <p className="api-step-body">
                          Click <strong>Sync Stock Now</strong> for an immediate update; WP-Cron refreshes matching SKU stock automatically every hour.
                        </p>
                        <ul className="api-substeps-list">
                          <li><strong>Checkout guard:</strong> Validates live <code>/api/v1/stock-status</code> on Classic and WooCommerce Blocks (Store API) checkouts (45s browse cache, live check on submit).</li>
                        </ul>
                      </div>
                    </div>

                    <div className="api-step-row">
                      <span className="api-step-circle">5</span>
                      <div className="api-step-content">
                        <h4 className="api-step-heading">
                          Automated Order Fulfillment{' '}
                          <span className="api-meta-badge api-badge-inline">Order API Gated</span>
                        </h4>
                        <p className="api-step-body">
                          Forwarding to <code>POST /api/v1/orders</code> unlocks when <code>orders_enabled === true</code> (Pro Scale or authorized keys).
                        </p>
                        <ul className="api-substeps-list">
                          <li><strong>Opt-in triggers:</strong> Locked keys register zero order hooks; unlocked keys can enable <em>Auto-forward paid orders</em> (<code>processing</code>) and optional <em>COD</em> (<code>on-hold</code> / <code>processing</code>).</li>
                          <li><strong>Sender &amp; packing:</strong> Set <em>Reseller / Sender Name</em>, <em>Sender Contact Phone</em>, and <em>Packing Preference</em>.</li>
                          <li><strong>Mixed-cart filtering:</strong> Non-Weave365 items are excluded; zero-match carts return <code>200 OK</code> (<code>NO_WEAVE365_ITEMS</code>) and are marked <em>Ignored</em>.</li>
                          <li><strong>HPOS &amp; order controls:</strong> Full HPOS (<code>custom_order_tables</code>) support, 60s idempotency locks, Order Notes with <em>Wholesale Payment Link</em>, <em>Weave365 Fulfillment Status</em> meta box, and <em>Order actions &rarr; Send Order to Weave365</em>.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <hr className="api-woo-divider" />

                  {/* 3. Catalog Products & SKU Matching Guide */}
                  <h3 className="api-woo-subheading">Initial Product Import &amp; SKU Matching</h3>
                  <p className="api-text" style={{ marginBottom: '1rem' }}>
                    Items sync by <strong>SKU</strong> (e.g. <code>102001</code> or color variant SKUs). Configure markup below for a direct <code>?format=woocommerce</code> URL, or download inside WordPress.
                  </p>

                  <div className="api-woo-builder">
                    <div className="api-woo-controls-row">
                      <SegmentedRadioGroup
                        legend="Markup Type"
                        name={`${wooCsvIdPrefix}-markup-type`}
                        idPrefix={`${wooCsvIdPrefix}-markup`}
                        options={WOO_MARKUP_OPTIONS}
                        value={wooMarkupType}
                        onChange={handleWooMarkupTypeChange}
                      />

                      {wooMarkupType !== 'none' && (
                        <div className="api-field-stack api-woo-value-field">
                          <div className="api-field-label-row">
                            <label
                              htmlFor={`${wooCsvIdPrefix}-markup-value`}
                              className="api-field-label"
                            >
                              Markup Value
                            </label>
                            <span id={`${wooCsvIdPrefix}-markup-hint`} className="api-field-hint">
                              {wooMarkupType === 'percent' ? '0–500%' : '₹0–₹1,00,000'}
                            </span>
                          </div>
                          <div className={`api-input-wrap ${wooMarkupError ? 'has-error' : ''}`}>
                            {wooMarkupType === 'flat' && (
                              <span className="api-input-affix" aria-hidden="true">&#8377;</span>
                            )}
                            <input
                              id={`${wooCsvIdPrefix}-markup-value`}
                              name="docWooMarkupValue"
                              type="text"
                              inputMode="decimal"
                              pattern="(\d+(\.\d{1,2})?|\.\d{1,2})"
                              enterKeyHint="done"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="none"
                              spellCheck={false}
                              value={wooMarkupValue}
                              placeholder={wooMarkupType === 'percent' ? 'e.g. 30' : 'e.g. 250'}
                              onChange={handleWooMarkupValueChange}
                              onBlur={handleWooMarkupValueBlur}
                              aria-invalid={wooMarkupError ? 'true' : 'false'}
                              aria-describedby={
                                wooMarkupError
                                  ? `${wooCsvIdPrefix}-markup-hint ${wooCsvIdPrefix}-markup-error`
                                  : `${wooCsvIdPrefix}-markup-hint`
                              }
                              className="api-text-input"
                            />
                            {wooMarkupType === 'percent' && (
                              <span className="api-input-affix" aria-hidden="true">%</span>
                            )}
                          </div>
                          {wooMarkupError && (
                            <span id={`${wooCsvIdPrefix}-markup-error`} className="api-field-error">
                              <AlertTriangle size={14} aria-hidden="true" />
                              <span>{wooMarkupError}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <SegmentedRadioGroup
                      legend="Price Rounding"
                      name={`${wooCsvIdPrefix}-round-to`}
                      idPrefix={`${wooCsvIdPrefix}-round`}
                      options={WOO_ROUND_OPTIONS}
                      value={wooRoundTo}
                      onChange={setWooRoundTo}
                    />

                    <div className="api-field-stack">
                      <label htmlFor={`${wooCsvIdPrefix}-csv-url`} className="api-field-label">
                        WooCommerce Catalog CSV URL
                      </label>
                      <div className="api-feed-box">
                        <span className="api-feed-method">CSV FEED</span>
                        <input
                          id={`${wooCsvIdPrefix}-csv-url`}
                          type="text"
                          readOnly
                          value={wooCsvUrl}
                          className="api-feed-input"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                        />
                        <button
                          type="button"
                          className={`api-feed-copy-btn ${copiedKey === 'woo-csv-feed' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(wooCsvUrl, 'woo-csv-feed')}
                        >
                          {copiedKey === 'woo-csv-feed' ? (
                            <Check size={13} aria-hidden="true" />
                          ) : (
                            <Copy size={13} aria-hidden="true" />
                          )}
                          <span>{copiedKey === 'woo-csv-feed' ? 'Copied' : 'Copy CSV URL'}</span>
                        </button>
                      </div>
                      <p className="api-woo-summary">{wooPricingSummary}</p>
                      <p className="api-woo-muted-note">
                        Masked keys (<code>w365_live_...</code>) return 401 &mdash; reveal your key in{' '}
                        <a href="/account?tab=developer" target="_blank" rel="noopener noreferrer">
                          Developer Dashboard
                        </a>{' '}
                        or download directly inside <strong>WooCommerce &rarr; Weave365 Sync</strong>.
                      </p>
                      <span role="status" className="api-visually-hidden">
                        {copiedKey === 'woo-csv-feed'
                          ? 'WooCommerce CSV URL copied to clipboard.'
                          : wooMarkupError || ''}
                      </span>
                    </div>
                  </div>

                  <div className="api-woo-import-block">
                    <div className="api-woo-import-title">Import into WooCommerce</div>
                    <ol className="api-woo-import-list">
                      <li>Download <code>weave365-woocommerce-catalog.csv</code> inside <strong>WooCommerce &rarr; Weave365 Sync</strong> or via the URL above.</li>
                      <li>In WordPress, open <strong>WooCommerce &rarr; Products &rarr; Import</strong> and upload the CSV.</li>
                      <li>Keep all 22 auto-mapped columns (<code>simple</code>, <code>variable</code> + <code>variation</code> SKUs) and click <strong>Run the importer</strong>.</li>
                    </ol>
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
                    <pre className="api-code-content"><code>{`$url = 'https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY';
$json = file_get_contents($url);
$data = json_decode($json, true);
foreach ($data['stock_map'] as $sku => $info) {
  $id = Product::getIdByReference($sku);
  if ($id) StockAvailable::setQuantity($id, 0, $info['quantity']);
}`}</code></pre>
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
                    <pre className="api-code-content"><code>{`const response = await fetch('https://www.weave365.com/api/v1/catalog', {
  headers: {
    'X-API-Key': process.env.WEAVE365_API_KEY,
  },
});
const data = await response.json();
console.log('Total live products:', data.total_products);`}</code></pre>
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
                    <pre className="api-code-content"><code>{`curl -s "https://www.weave365.com/api/v1/stock-status?key=w365_live_YOUR_KEY" | jq .`}</code></pre>
                  </div>
                </div>
              )}
            </div>
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
                Fetches paginated B2R wholesale catalog items. Supports JSON, SyncX flat format, Matrixify CSV, and WooCommerce Native CSV (with optional reseller markup &amp; price rounding).
              </p>

              <div
                className="api-table-scroll"
                tabIndex={0}
                role="region"
                aria-labelledby="catalog-params-caption"
              >
                <table className="api-flat-table">
                  <caption id="catalog-params-caption" className="api-visually-hidden">
                    GET /api/v1/catalog Query Parameters
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Query Parameter</th>
                      <th scope="col">Type</th>
                      <th scope="col">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>format</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>
                        <code>syncx</code> (or <code>stocksync</code>) for flat JSON variant rows.{' '}
                        <code>matrixify</code> (or <code>/catalog.csv</code>) for standard Shopify CSV (<code>weave365-catalog.csv</code>).{' '}
                        <code>woocommerce</code> (or <code>woo</code>) for 22-column UTF-8 BOM WooCommerce Native CSV (<code>weave365-woocommerce-catalog.csv</code>, emitting <code>simple</code> or <code>variable</code> + <code>variation</code> color rows matching <code>stock_map</code> SKUs).{' '}
                        <code>shopify</code> for nested REST JSON.
                      </td>
                    </tr>
                    <tr>
                      <td><code>markup_pct</code></td>
                      <td><span className="api-param-type">number (optional)</span></td>
                      <td>
                        Percentage markup (<code>0</code> to <code>500</code>, e.g. <code>30</code> adds 30%) applied to <code>Regular price</code> when exporting WooCommerce CSV (<code>format=woocommerce</code> / <code>woo</code>).
                      </td>
                    </tr>
                    <tr>
                      <td><code>markup_flat</code></td>
                      <td><span className="api-param-type">number (optional)</span></td>
                      <td>
                        Fixed INR markup (<code>0</code> to <code>100000</code>, e.g. <code>250</code> adds &#8377;250) added after percentage markup on WooCommerce CSV exports.
                      </td>
                    </tr>
                    <tr>
                      <td><code>round_to</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>
                        Price rounding applied after markup on WooCommerce CSV exports: <code>none</code> (default), <code>10</code> (nearest &#8377;10), <code>50</code> (nearest &#8377;50), or <code>99</code> (end in &#8377;99). Final prices are always clamped <code>&gt;= basePrice</code> (never below B2R cost).
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
                  <span className="api-code-label">WooCommerce Native CSV Example (cURL)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`curl -H "X-API-Key: YOUR_FULL_UNMASKED_KEY" \\
  "https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_pct=30&round_to=99" \\
  -o weave365-woocommerce-catalog.csv`, 'cat-woo-curl')}
                  >
                    {copiedKey === 'cat-woo-curl' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'cat-woo-curl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content"><code>{`curl -H "X-API-Key: YOUR_FULL_UNMASKED_KEY" \\
  "https://www.weave365.com/api/v1/catalog.csv?format=woocommerce&markup_pct=30&round_to=99" \\
  -o weave365-woocommerce-catalog.csv`}</code></pre>
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
                Automated Dropship Order Placement (Pro Scale / <code>orders_enabled: true</code>). Dispatches white-label shipments directly to your customer with live tracking.
              </p>

              <div className="api-gear-callout" style={{ margin: '1rem 0' }}>
                <div className="api-gear-callout-title">
                  <Truck size={15} />
                  <span>Shopify Store Owners: Zero Code Automated Setup</span>
                </div>
                <p className="api-step-body" style={{ margin: 0 }}>
                  You don&apos;t need to write custom code or make API calls to send orders. Use Shopify&apos;s free native webhook to automatically forward orders to Weave 365 on checkout.
                  <a href="#shopify-orders" style={{ marginLeft: '6px', fontWeight: 600, color: '#0f172a', textDecoration: 'underline' }}>
                    View Shopify Order Webhooks Setup Guide &rarr;
                  </a>
                </p>
              </div>

              <div className="api-gear-callout" style={{ margin: '1rem 0' }}>
                <div className="api-gear-callout-title">
                  <Truck size={15} />
                  <span>WooCommerce Store Owners: Zero-Code v1.2.0 Plugin</span>
                </div>
                <p className="api-step-body" style={{ margin: 0 }}>
                  Install the official <strong>Weave365 Live Stock Sync (v1.2.0)</strong> WordPress plugin for entitlement-gated automated order forwarding, full HPOS (<code>custom_order_tables</code>) support, mixed-cart filtering, 60s idempotency locks, and manual order actions.
                  <a href="#platforms" style={{ marginLeft: '6px', fontWeight: 600, color: '#0f172a', textDecoration: 'underline' }}>
                    View WooCommerce Setup Guide &rarr;
                  </a>
                </p>
              </div>

              <div
                className="api-table-scroll"
                tabIndex={0}
                role="region"
                aria-labelledby="post-orders-fields-caption"
              >
                <table className="api-flat-table">
                  <caption id="post-orders-fields-caption" className="api-visually-hidden">
                    POST /api/v1/orders Fields and Response Behavior
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Field / Status</th>
                      <th scope="col">Type / Code</th>
                      <th scope="col">Behavior</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>platform</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>
                        Use <code>&quot;woocommerce&quot;</code> or <code>&quot;shopify&quot;</code> (defaults to <code>&quot;api&quot;</code>). Storefront plugins automatically enable mixed-cart filtering so non-Weave365 SKUs in the same order are ignored without error.
                      </td>
                    </tr>
                    <tr>
                      <td><code>reseller_order_id</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>
                        Your store order ID/number. Duplicate submissions matching an existing order return HTTP <code>200 OK</code> with <code>&quot;is_duplicate&quot;: true</code>, the existing <code>order_id</code>, and <code>payment_link</code>.
                      </td>
                    </tr>
                    <tr>
                      <td><code>payment_type</code> / <code>gateway</code></td>
                      <td><span className="api-param-type">string (optional)</span></td>
                      <td>
                        Set <code>&quot;prepaid&quot;</code> or <code>&quot;cod&quot;</code> (or gateway title). Passing <code>cod</code> / <code>cash_on_delivery</code> configures the courier slip for Cash on Delivery collection.
                      </td>
                    </tr>
                    <tr>
                      <td><code>NO_WEAVE365_ITEMS</code></td>
                      <td><span className="api-param-type">200 OK (ignored)</span></td>
                      <td>
                        Returned for <code>woocommerce</code> / <code>shopify</code> mixed-storefront orders that contain zero Weave365 SKUs (<code>&quot;status&quot;: &quot;ignored&quot;</code>, no invoice created).
                      </td>
                    </tr>
                    <tr>
                      <td><code>FORBIDDEN</code></td>
                      <td><span className="api-param-type">403 Forbidden</span></td>
                      <td>
                        Returned when the API key does not have <code>orders_enabled === true</code>. WooCommerce Sync v1.2.0 automatically detects <code>403 FORBIDDEN</code> and disables local auto-forwarding.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">Request Body (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "reseller_order_id": "WC-90412",
  "platform": "woocommerce",
  "payment_type": "prepaid",
  "gateway": "Razorpay",
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
    { "sku": "102001-1", "quantity": 1, "selling_price": 2499 }
  ],
  "shipping_notes": "Blind packaging requested"
}`, 'order-req')}
                  >
                    {copiedKey === 'order-req' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'order-req' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content"><code>{`{
  "reseller_order_id": "WC-90412",
  "platform": "woocommerce",
  "payment_type": "prepaid",
  "gateway": "Razorpay",
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
    { "sku": "102001-1", "quantity": 1, "selling_price": 2499 }
  ],
  "shipping_notes": "Blind packaging requested"
}`}</code></pre>
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
  "order_number": "API-WC-90412",
  "reseller_order_id": "WC-90412",
  "order_status": "payment_pending",
  "payment_status": "pending",
  "payment_link": "https://www.weave365.com/order-tracking/inq_9f81a7b2c?pay=1",
  "tracking_url": "https://www.weave365.com/order-tracking/API-WC-90412",
  "estimated_dispatch": "24-48 Business Hours after payment confirmation"
}`, 'order-resp')}
                  >
                    {copiedKey === 'order-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'order-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content"><code>{`{
  "status": "success",
  "order_id": "inq_9f81a7b2c",
  "order_number": "API-WC-90412",
  "reseller_order_id": "WC-90412",
  "order_status": "payment_pending",
  "payment_status": "pending",
  "payment_link": "https://www.weave365.com/order-tracking/inq_9f81a7b2c?pay=1",
  "tracking_url": "https://www.weave365.com/order-tracking/API-WC-90412",
  "estimated_dispatch": "24-48 Business Hours after payment confirmation"
}`}</code></pre>
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
                Returns authenticated account details, subscription tier, remaining quota, Order API capability entitlement (<code>orders_enabled</code>), and current month request metrics.
              </p>

              <div className="api-note-text" style={{ margin: '0.75rem 0 1rem 0' }}>
                <strong>Storefront Plugin Entitlement Gating:</strong> Plugins like <strong>Weave365 WooCommerce Sync v1.2.0</strong> check <code>orders_enabled</code> via <code>GET /api/v1/me</code> (cached for 6 hours, or refreshed manually via <strong>Refresh Permissions</strong>) to unlock or lock Automated Order Fulfillment controls cleanly.
              </div>

              <div className="api-code-block">
                <div className="api-code-topbar">
                  <span className="api-code-label">200 OK Response (JSON)</span>
                  <button
                    type="button"
                    className="api-code-copy-btn"
                    onClick={() => copyToClipboard(`{
  "status": "success",
  "client_name": "Royal Boutique",
  "client_website": "https://royalboutique.in",
  "tier": "pro",
  "monthly_quota": 25000,
  "month_total_used": 1420,
  "remaining_quota": 23580,
  "rate_limit_rps": 25,
  "is_active": true,
  "orders_enabled": true
}`, 'me-resp')}
                  >
                    {copiedKey === 'me-resp' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'me-resp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="api-code-content"><code>{`{
  "status": "success",
  "client_name": "Royal Boutique",
  "client_website": "https://royalboutique.in",
  "tier": "pro",
  "monthly_quota": 25000,
  "month_total_used": 1420,
  "remaining_quota": 23580,
  "rate_limit_rps": 25,
  "is_active": true,
  "orders_enabled": true
}`}</code></pre>
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

            {/* Billing Frequency Segmented Toggle */}
            <div className="api-billing-toggle-container">
              <div
                role="radiogroup"
                aria-label="Billing frequency"
                className="api-billing-toggle-wrap"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={billingCycle === 'monthly'}
                  className={`api-billing-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={billingCycle === 'quarterly'}
                  className={`api-billing-toggle-btn ${billingCycle === 'quarterly' ? 'active' : ''}`}
                  onClick={() => setBillingCycle('quarterly')}
                >
                  <span>3 Months</span>
                  <span className="api-billing-discount-text">5% Off</span>
                </button>
              </div>
            </div>

            <div className="api-tiers-grid">
              <div className="api-tier-item">
                <div className="api-tier-name">Growth Tier</div>
                {billingCycle === 'quarterly' ? (
                  <div className="api-tier-price-group">
                    <div className="api-tier-price-row">
                      <span className="api-tier-original-price">₹897</span>
                      <div className="api-tier-price">₹852 <span>/ 3 months</span></div>
                    </div>
                    <div className="api-tier-savings-line">₹284 / month · Save 5%</div>
                  </div>
                ) : (
                  <div className="api-tier-price">₹299 <span>/ month</span></div>
                )}
                <div className="api-tier-quota">
                  {billingCycle === 'quarterly' ? '10,000 requests / month (90-day access)' : '10,000 requests / month'}
                </div>
                <ul className="api-tier-features">
                  <li><Check size={14} /> Full B2R Wholesale Catalog Feed</li>
                  <li><Check size={14} /> Real-Time Stock Status Lookups</li>
                  <li><Check size={14} /> Shopify SyncX &amp; Matrixify Feeds</li>
                  <li><Check size={14} /> WooCommerce &amp; PrestaShop Connectors</li>
                  <li><Check size={14} /> 10 req/sec Burst Throughput</li>
                </ul>
                <a
                  href={`/account?tab=developer&plan=growth&cycle=${billingCycle}`}
                  className="api-btn secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Select Growth Tier
                </a>
              </div>

              <div className="api-tier-item featured">
                <div className="api-tier-name">
                  <span>Pro Tier</span>
                  <span className="api-tier-badge">Recommended</span>
                </div>
                {billingCycle === 'quarterly' ? (
                  <div className="api-tier-price-group">
                    <div className="api-tier-price-row">
                      <span className="api-tier-original-price">₹1,497</span>
                      <div className="api-tier-price">₹1,422 <span>/ 3 months</span></div>
                    </div>
                    <div className="api-tier-savings-line">₹474 / month · Save 5%</div>
                  </div>
                ) : (
                  <div className="api-tier-price">₹499 <span>/ month</span></div>
                )}
                <div className="api-tier-quota">
                  {billingCycle === 'quarterly' ? '25,000 requests / month (90-day access)' : '25,000 requests / month'}
                </div>
                <ul className="api-tier-features">
                  <li><Check size={14} /> Everything in Growth Tier</li>
                  <li><Check size={14} /> <strong>Automated Dropship Order Placement API</strong></li>
                  <li><Check size={14} /> Live Carrier AWB &amp; Tracking Webhooks</li>
                  <li><Check size={14} /> 25 req/sec High-Volume Burst Rate</li>
                  <li><Check size={14} /> Priority Loom Warehouse Dispatch</li>
                </ul>
                <a
                  href={`/account?tab=developer&plan=pro&cycle=${billingCycle}`}
                  className="api-btn primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
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
    </div>
  );
}
