/**
 * @file ShopifyDirectConnectCard.jsx
 * @description 1-Click Native Shopify Integration Card for Weave365 Reseller Dashboard.
 * Plan-Aware: Respects plan tiers (Free, Growth, Pro), rate limits (RPS), monthly quotas,
 * and plan-based sync cooldowns with live countdown timers.
 * 
 * @module components/developer/ShopifyDirectConnectCard
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Check,
  RefreshCw,
  ExternalLink,
  Zap,
  ShieldCheck,
  Power,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Activity,
  Clock,
  Upload,
} from '../icons.jsx';

export function ShopifyDirectConnectCard({ apiKey, user, onStatusChange }) {
  const [shopDomain, setShopDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pushingCatalog, setPushingCatalog] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Extract initial shop domain from API key client website if available
  useEffect(() => {
    if (apiKey?.client_website) {
      let cleaned = apiKey.client_website.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (cleaned.includes('myshopify.com')) {
        setShopDomain(cleaned);
      }
    }
  }, [apiKey?.client_website]);

  // Cooldown countdown interval
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Check connection status on mount and on return from OAuth
  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      setLoading(true);
      setErrorMsg('');

      try {
        const queryParams = new URLSearchParams();
        if (apiKey?.id) queryParams.set('key_id', apiKey.id);
        if (apiKey?.client_website) queryParams.set('shop', apiKey.client_website);

        const res = await fetch(`/api/shopify/status?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStoreStatus(data);
            if (data?.shop) setShopDomain(data.shop);
            if (data?.plan?.cooldown_remaining_sec > 0) {
              setCooldownRemaining(data.plan.cooldown_remaining_sec);
            }
            if (onStatusChange) onStatusChange(data);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch Shopify integration status:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkStatus();

    // Check if redirected with ?shopify_connected=true
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('shopify_connected') === 'true') {
        const shop = urlParams.get('shop');
        if (shop) setShopDomain(shop);
        setSyncResult({
          success: true,
          message: `Shopify store ${shop || ''} successfully connected via 1-Click integration!`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('shopify_error')) {
        setErrorMsg(`Shopify connection error: ${urlParams.get('shopify_error').replace(/_/g, ' ')}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => { isMounted = false; };
  }, [apiKey?.id, apiKey?.client_website]);

  // Handle 1-Click Connect
  const handleConnect = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!shopDomain.trim()) {
      setErrorMsg('Please enter your Shopify store URL (e.g. eleganceofbanaras.myshopify.com)');
      return;
    }

    let cleaned = shopDomain.trim().toLowerCase();
    cleaned = cleaned.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!cleaned.includes('.')) {
      cleaned = `${cleaned}.myshopify.com`;
    }

    const authUrl = `/api/shopify/auth?shop=${encodeURIComponent(cleaned)}&key_id=${encodeURIComponent(apiKey?.id || '')}&return_to=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/account')}`;
    window.location.href = authUrl;
  };

  // Handle Manual Live Sync
  const handleTriggerSync = async () => {
    if (!storeStatus?.shop || syncing || cooldownRemaining > 0) return;
    setSyncing(true);
    setSyncResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: storeStatus.shop,
          key_id: apiKey?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        setSyncResult({
          success: true,
          message: `Successfully synchronized ${data.quantities_updated || data.matched_variants || 0} variants directly with Shopify!`,
        });

        // Set cooldown timer from plan response
        const cooldown = data.plan?.sync_cooldown_sec || 10;
        setCooldownRemaining(cooldown);

        // Update local status timestamp & quota
        setStoreStatus((prev) => ({
          ...prev,
          last_synced_at: data.timestamp || new Date().toISOString(),
          plan: {
            ...(prev?.plan || {}),
            ...(data.plan || {}),
          },
        }));
      } else {
        setErrorMsg(data?.error || 'Stock synchronization failed. Please check rate limits.');
        if (data?.remaining_cooldown_sec) {
          setCooldownRemaining(data.remaining_cooldown_sec);
        }
      }
    } catch (e) {
      setErrorMsg('Network error while triggering stock sync.');
    } finally {
      setSyncing(false);
    }
  };

  // Handle Publishing / Pushing Catalog to Shopify
  const handlePushCatalog = async () => {
    if (!storeStatus?.shop || pushingCatalog) return;
    setPushingCatalog(true);
    setSyncResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/shopify/push-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop: storeStatus.shop,
          key_id: apiKey?.id,
          limit: 25,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        setSyncResult({
          success: true,
          message: `Successfully published ${data.products_created || 0} sarees with all colors and variants directly into your Shopify store!`,
        });
        if (apiKey?.id) {
          fetch(`/api/shopify/status?key_id=${apiKey.id}`)
            .then((r) => r.json())
            .then((d) => { if (d) setStoreStatus(d); })
            .catch(() => {});
        }
      } else {
        setErrorMsg(data?.error || 'Failed to push catalog to Shopify.');
      }
    } catch (e) {
      setErrorMsg('Network error while publishing catalog.');
    } finally {
      setPushingCatalog(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!storeStatus?.shop) return;
    setShowDisconnectModal(false);
    setLoading(true);

    try {
      const res = await fetch('/api/shopify/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop: storeStatus.shop }),
      });

      if (res.ok) {
        setStoreStatus(null);
        setSyncResult({
          success: true,
          message: 'Shopify store disconnected successfully.',
        });
      }
    } catch (e) {
      setErrorMsg('Failed to disconnect store.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="shopify-direct-card loading-state">
        <RefreshCw size={20} className="spin-icon" style={{ color: '#0f172a' }} />
        <span>Checking Shopify connection status &amp; plan limits...</span>
      </div>
    );
  }

  const plan = storeStatus?.plan || {
    name: apiKey?.tier === 'pro' ? 'Pro Scale' : (apiKey?.tier === 'growth' ? 'Growth Partner' : 'Starter Tier'),
    tier: apiKey?.tier || 'growth',
    rate_limit_rps: apiKey?.rate_limit_rps || (apiKey?.tier === 'pro' ? 5 : (apiKey?.tier === 'growth' ? 3 : 1)),
    monthly_quota: apiKey?.monthly_quota || (apiKey?.tier === 'pro' ? 25000 : (apiKey?.tier === 'growth' ? 10000 : 1000)),
    month_used: 0,
    remaining_quota: apiKey?.monthly_quota || 10000,
    sync_cooldown_sec: apiKey?.tier === 'pro' ? 10 : (apiKey?.tier === 'growth' ? 60 : 300),
  };

  return (
    <div className="shopify-direct-card">
      <div className="shopify-card-header">
        <div className="shopify-header-title-row">
          <div className="shopify-icon-wrap">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="shopify-card-title">1-Click Direct Shopify Integration</h3>
            <p className="shopify-card-desc">
              Zero third-party apps. Real-time automatic inventory sync directly from Weave365 for ₹0/mo.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`shopify-plan-pill ${plan.tier}`}>
            {plan.name} • {plan.rate_limit_rps} RPS
          </span>
          {storeStatus?.connected && (
            <span className="shopify-connected-badge">
              <span className="shopify-pulse-dot" />
              Connected &amp; Live
            </span>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {syncResult && (
        <div className="shopify-alert success">
          <Check size={16} />
          <span>{syncResult.message}</span>
          <button
            type="button"
            className="shopify-alert-close"
            onClick={() => setSyncResult(null)}
          >
            ×
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="shopify-alert error">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
          <button
            type="button"
            className="shopify-alert-close"
            onClick={() => setErrorMsg('')}
          >
            ×
          </button>
        </div>
      )}

      {/* STATE 1: Store Connected */}
      {storeStatus?.connected ? (
        <div className="shopify-connected-content">
          <div className="shopify-meta-strip">
            <div className="shopify-meta-item">
              <span className="shopify-meta-label">Connected Store</span>
              <a
                href={`https://${storeStatus.shop}/admin`}
                target="_blank"
                rel="noopener noreferrer"
                className="shopify-store-link"
              >
                <strong>{storeStatus.shop}</strong>
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="shopify-meta-item">
              <span className="shopify-meta-label">Plan &amp; Rate Limit</span>
              <span className="shopify-meta-val">
                <strong>{plan.name}</strong> ({plan.rate_limit_rps} req/sec)
              </span>
            </div>

            <div className="shopify-meta-item">
              <span className="shopify-meta-label">Monthly Quota</span>
              <span className="shopify-meta-val">
                <strong>{plan.month_used?.toLocaleString() || 0}</strong> / {plan.monthly_quota?.toLocaleString() || 0} req
              </span>
            </div>

            <div className="shopify-meta-item">
              <span className="shopify-meta-label">Last Synchronized</span>
              <span className="shopify-meta-val">
                {storeStatus.last_synced_at
                  ? new Date(storeStatus.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date(storeStatus.last_synced_at).toLocaleDateString()
                  : 'Pending first sync'}
              </span>
            </div>
          </div>

          <div className="shopify-actions-row">
            <button
              type="button"
              className={`shopify-btn primary ${cooldownRemaining > 0 ? 'in-cooldown' : ''}`}
              onClick={handleTriggerSync}
              disabled={syncing || cooldownRemaining > 0}
            >
              {syncing ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Syncing Live Stock...</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock size={14} />
                  <span>Cooldown ({cooldownRemaining}s)</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Sync Stock Now (1-Click)</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="shopify-btn secondary"
              onClick={handlePushCatalog}
              disabled={pushingCatalog}
            >
              {pushingCatalog ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Publishing Products...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Publish Catalog to Shopify</span>
                </>
              )}
            </button>

            <a
              href={`https://${storeStatus.shop}/admin/products`}
              target="_blank"
              rel="noopener noreferrer"
              className="shopify-btn secondary"
            >
              <span>View Products in Shopify Admin</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              className="shopify-btn text-danger"
              onClick={() => setShowDisconnectModal(true)}
            >
              <Power size={13} />
              <span>Disconnect</span>
            </button>
          </div>

          <div className="shopify-security-note">
            <ShieldCheck size={14} />
            <span>
              Connected securely via Shopify GraphQL Admin API. Minimum interval between manual syncs: <strong>{plan.sync_cooldown_sec}s</strong> on {plan.name}.
            </span>
          </div>
        </div>
      ) : (
        /* STATE 2: Store NOT Connected */
        <form onSubmit={handleConnect} className="shopify-connect-form">
          <label className="shopify-input-label">Enter your Shopify Store Domain:</label>
          <div className="shopify-input-group">
            <input
              type="text"
              className="shopify-text-input"
              placeholder="e.g. eleganceofbanaras.myshopify.com"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
            />
            <button type="submit" className="shopify-btn primary">
              <span>Connect Shopify Store</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="shopify-benefits-grid">
            <div className="shopify-benefit-item">
              <span className="benefit-check">✓</span>
              <span><strong>100% Free:</strong> No $7/mo Stock Sync or $20/mo Matrixify fees.</span>
            </div>
            <div className="shopify-benefit-item">
              <span className="benefit-check">✓</span>
              <span><strong>Plan-Aware Sync:</strong> Up to {apiKey?.rate_limit_rps || 5} req/sec with high-speed GraphQL updates.</span>
            </div>
            <div className="shopify-benefit-item">
              <span className="benefit-check">✓</span>
              <span><strong>Real-Time Sync:</strong> Saree stock counts update in real-time as vendors update quantities.</span>
            </div>
          </div>
        </form>
      )}

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div className="shopify-modal-overlay">
          <div className="shopify-modal-box">
            <h4>Disconnect Shopify Store?</h4>
            <p>
              Are you sure you want to disconnect <strong>{storeStatus?.shop}</strong> from Weave365? Automated inventory sync will be paused.
            </p>
            <div className="shopify-modal-actions">
              <button
                type="button"
                className="shopify-btn secondary"
                onClick={() => setShowDisconnectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="shopify-btn danger"
                onClick={handleDisconnect}
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
