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
  X,
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
  Download,
  Shield,
  Layers,
  ShoppingBag,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Trash2,
  BookOpen,
  Search,
  Filter,
  CheckSquare,
  Square,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  Building2,
  UserCheck,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  MessageCircle,
  Power,
  CreditCard,
  Lock,
  ArrowRight,
  Sparkles,
} from '../icons.jsx';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import { developerService, TIER_CONFIGS } from '../../services/developerService.js';
import { fetchProducts } from '../../productData.js';
import { storeConfig } from '../../config.js';
import { DispatchLabelCard } from './DispatchLabelCard.jsx';
import '../../styles/developerDashboard.css';

export const BUSINESS_TYPES = [
  'Ethnic Wear Online Store — Banarasi Sarees and Suits',
  'Online Fashion Brand — Ethnic Wear Boutique',
  'eCommerce Website — Multiple Categories',
  'Dropshipping Platform',
  'Marketplace',
  'Other',
];

export const OPERATIONAL_STATUSES = [
  'Currently selling',
  'Recently launched',
  'Launching within 30 days',
  'Planning to launch',
  'Just exploring',
];

export const API_USE_CASES = [
  'Product Catalogue',
  'Product Images and Details',
  'Live Inventory',
  'Wholesale Pricing',
  'Order Creation',
  'Order Tracking',
  'Dropshipping',
];

export const INTEGRATION_PLATFORMS = [
  'Shopify',
  'WooCommerce',
  'PrestaShop',
  'Custom Website',
  'Other',
];

export const MONTHLY_ORDER_VOLUMES = [
  'Not sure yet',
  'Under 50 orders',
  '50 - 200 orders',
  '200 - 500 orders',
  '500 - 2,000 orders',
  '2,000 + orders',
];

export const TIMELINE_OPTIONS = [
  'Immediately',
  'Within 7 days',
  'Within 30 days',
  '1 - 3 months',
  'Just researching',
];

export const OTHER_SUPPLIERS_OPTIONS = [
  'Yes',
  'No',
];

/**
 * Modern confirmation modal for sensitive and dangerous admin actions.
 */
export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  requiredInputText = null, // e.g. "DELETE"
  onConfirm,
  onCancel,
  clientName,
}) {
  const [typedInput, setTypedInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatched = requiredInputText ? typedInput.trim() === requiredInputText : true;
  const isConfirmedDisabled = !isMatched;

  return (
    <div className="dev-confirm-overlay" onClick={onCancel}>
      <div className="dev-confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header with integrated icon and title */}
        <div className="dev-confirm-header">
          <div className={`dev-confirm-icon-badge ${isDanger ? 'danger' : 'warning'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="dev-confirm-header-text">
            <h3 className="dev-confirm-title">{title}</h3>
            {clientName && (
              <div className="dev-confirm-target-row">
                <span className="dev-confirm-target-label">Target Client:</span>
                <strong className="dev-confirm-target-name">{clientName}</strong>
              </div>
            )}
          </div>
          <button type="button" className="dev-confirm-close-btn" onClick={onCancel} aria-label="Close">
            <X size={14} />
          </button>
        </div>

        {/* Body content */}
        <div className="dev-confirm-body">
          <p className="dev-confirm-message">{message}</p>

          {requiredInputText && (
            <div className="dev-confirm-verify-panel">
              <label className="dev-confirm-verify-label" htmlFor="dev-confirm-verify-input">
                <span>Type </span>
                <code className="dev-confirm-keyword">{requiredInputText}</code>
                <span> to confirm:</span>
              </label>
              <div className="dev-confirm-input-wrapper">
                <input
                  id="dev-confirm-verify-input"
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  placeholder={`Type ${requiredInputText}`}
                  className={`dev-confirm-text-input ${isMatched && typedInput ? 'matched' : ''}`}
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
                {isMatched && typedInput && (
                  <span className="dev-confirm-match-badge">
                    <Check size={12} /> Ready
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="dev-confirm-footer">
          <button
            type="button"
            className="dev-confirm-btn-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isConfirmedDisabled}
            className={`dev-confirm-btn-action ${isDanger ? 'danger' : 'warning'} ${isConfirmedDisabled ? 'disabled' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Quiet, elegant card displaying storefront registration and developer activation details.
 */
function UserActivationInfoCard({ apiKey, user, buyerProfile, isAdminMode, copiedField, copyToClipboard, tierInfo, defaultExpanded = false }) {
  const [isCollapsed, setIsCollapsed] = useState(defaultExpanded ? false : !isAdminMode);

  // Extract all data fields with intelligent fallbacks
  const clientName = apiKey?.client_name || apiKey?.profiles?.business_name || buyerProfile?.business_name || 'N/A';
  const clientWebsite = apiKey?.client_website || '';
  const domainOwnerName = apiKey?.domain_owner_name || apiKey?.profiles?.full_name || buyerProfile?.full_name || user?.user_metadata?.full_name || 'N/A';
  const gstNumber = apiKey?.gst_number || apiKey?.profiles?.gstin || apiKey?.profiles?.gst_number || buyerProfile?.gstin || buyerProfile?.gst_number || '';
  const email = apiKey?.profiles?.email || user?.email || 'N/A';
  const phone = apiKey?.profiles?.whatsapp || apiKey?.profiles?.whatsapp_number || apiKey?.profiles?.phone || buyerProfile?.whatsapp || '';

  const city = apiKey?.profiles?.city || buyerProfile?.city || '';
  const state = apiKey?.profiles?.state || buyerProfile?.state || '';
  const pincode = apiKey?.profiles?.pincode || buyerProfile?.pincode || '';
  const locationParts = [city, state, pincode].filter(Boolean);
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Not specified';

  const buyerType = apiKey?.profiles?.buyer_subtype || apiKey?.profiles?.role || buyerProfile?.buyer_subtype || buyerProfile?.buyer_type || 'Reseller / Developer';

  const createdAtFormatted = apiKey?.created_at
    ? new Date(apiKey.created_at).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'N/A';

  const lastUsedFormatted = apiKey?.last_used_at
    ? new Date(apiKey.last_used_at).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'No requests recorded';

  const catalogModeLabel = apiKey?.catalog_mode === 'curated'
    ? `Curated Feed (${(apiKey?.selected_skus || []).length} items)`
    : 'Master Catalog (All SKUs)';

  // Build WhatsApp URL
  const waCleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const waUrl = waCleanPhone
    ? `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(
      `Hi ${domainOwnerName !== 'N/A' ? domainOwnerName : clientName}, regarding your Weave365 Developer API connection for ${clientName}...`
    )}`
    : null;

  return (
    <div className="dev-activation-card">
      <div className="dev-activation-card-head">
        <div className="dev-activation-head-left">
          <div className="dev-activation-icon-wrap">
            <Building2 size={16} />
          </div>
          <div className="dev-activation-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                Storefront &amp; Registration Profile
              </h3>
              {clientName !== 'N/A' && (
                <span className="dev-tier-tag" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                  {clientName}
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {clientWebsite ? `${clientWebsite.replace(/^https?:\/\//, '')} • ` : ''}
              {email !== 'N/A' ? `${email} • ` : ''}
              {gstNumber ? `GSTIN: ${gstNumber} • ` : ''}
              Feed: {catalogModeLabel}
            </p>
          </div>
        </div>

        <div className="dev-activation-head-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dev-quiet-wa-btn"
              style={{ height: '30px', fontSize: '0.75rem' }}
              title="Message reseller on WhatsApp"
            >
              <MessageCircle size={13} />
              <span>Chat on WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="dev-action-chip"
            style={{
              height: '30px',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: isCollapsed ? '#ffffff' : '#f1f5f9',
            }}
            title={isCollapsed ? 'Expand Storefront Profile' : 'Collapse Storefront Profile'}
            aria-label={isCollapsed ? 'Expand Storefront Profile' : 'Collapse Storefront Profile'}
          >
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            <span>{isCollapsed ? 'View Store Details' : 'Hide Details'}</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="dev-activation-grid">
            {/* 1. Storefront / Business Name */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Business / Storefront</span>
              <div className="dev-activation-value-row">
                <span className="dev-activation-value primary" title={clientName}>
                  {clientName}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(clientName, 'act-client-name')}
                  className="dev-quiet-copy-icon"
                  title="Copy Name"
                  aria-label="Copy Business Name"
                >
                  {copiedField === 'act-client-name' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* 2. Storefront Website URL */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Storefront Website</span>
              <div className="dev-activation-value-row">
                {clientWebsite ? (
                  <>
                    <a
                      href={clientWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dev-quiet-link"
                      title={clientWebsite}
                    >
                      <span>{clientWebsite.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={11} className="dev-quiet-ext-icon" />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(clientWebsite, 'act-website')}
                      className="dev-quiet-copy-icon"
                      title="Copy URL"
                      aria-label="Copy Website URL"
                    >
                      {copiedField === 'act-website' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">Not provided</span>
                )}
              </div>
            </div>

            {/* 3. Domain Owner / Developer Name */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Domain Owner / Developer</span>
              <div className="dev-activation-value-row">
                <span className="dev-activation-value" title={domainOwnerName}>
                  {domainOwnerName}
                </span>
                {domainOwnerName !== 'N/A' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(domainOwnerName, 'act-domain-owner')}
                    className="dev-quiet-copy-icon"
                    title="Copy Domain Owner"
                    aria-label="Copy Domain Owner Name"
                  >
                    {copiedField === 'act-domain-owner' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>

            {/* 4. GST Number / GSTIN */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">GST Number / GSTIN</span>
              <div className="dev-activation-value-row">
                {gstNumber ? (
                  <>
                    <code className="dev-quiet-gstin-code" title="Business GSTIN">
                      {gstNumber}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gstNumber, 'act-gstin')}
                      className="dev-quiet-copy-icon"
                      title="Copy GSTIN"
                      aria-label="Copy GSTIN"
                    >
                      {copiedField === 'act-gstin' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">Not provided</span>
                )}
              </div>
            </div>

            {/* 5. User Account Email */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Account Email</span>
              <div className="dev-activation-value-row">
                {email && email !== 'N/A' ? (
                  <>
                    <a href={`mailto:${email}`} className="dev-quiet-link" title={email}>
                      <Mail size={11} className="dev-quiet-inline-icon" />
                      <span>{email}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(email, 'act-email')}
                      className="dev-quiet-copy-icon"
                      title="Copy Email"
                      aria-label="Copy Email"
                    >
                      {copiedField === 'act-email' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">N/A</span>
                )}
              </div>
            </div>

            {/* 6. Phone / WhatsApp Contact */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Phone / WhatsApp</span>
              <div className="dev-activation-value-row">
                {phone ? (
                  <>
                    <span className="dev-activation-value">{phone}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(phone, 'act-phone')}
                      className="dev-quiet-copy-icon"
                      title="Copy Phone"
                      aria-label="Copy Phone Number"
                    >
                      {copiedField === 'act-phone' ? <Check size={12} className="text-green" /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  <span className="dev-activation-value empty">Not on profile</span>
                )}
              </div>
            </div>

            {/* 7. Registered Location */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Location / City</span>
              <div className="dev-activation-value-row">
                <span className="dev-activation-value" title={locationStr}>
                  {locationStr}
                </span>
              </div>
            </div>

            {/* 8. Buyer Role & Classification */}
            <div className="dev-activation-item">
              <span className="dev-activation-label">Classification</span>
              <div className="dev-activation-value-row">
                <span className="dev-quiet-type-pill">
                  {buyerType}
                </span>
              </div>
            </div>
          </div>

          <div className="dev-activation-footer">
            <div className="dev-activation-footer-left">
              <span className="dev-activation-footer-item">
                <Calendar size={12} />
                <span>Activated: <strong>{createdAtFormatted}</strong></span>
              </span>
              <span className="dev-activation-footer-dot">•</span>
              <span className="dev-activation-footer-item">
                <Clock size={12} />
                <span>Last Request: <strong>{lastUsedFormatted}</strong></span>
              </span>
            </div>

            <div className="dev-activation-footer-item">
              <Layers size={12} />
              <span>Feed: <strong>{catalogModeLabel}</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function PlanSelectionCard({
  apiKey,
  user,
  onActivated,
  isRenewal = false,
  isExpired = false,
  onClose = null,
  initialPlan = null,
  initialCycle = null,
}) {
  const [billingCycle, setBillingCycle] = useState(
    initialCycle === 'quarterly' ? 'quarterly' : 'monthly'
  );
  const [selectedPlan, setSelectedPlan] = useState(
    initialPlan || (apiKey?.subscription_plan === 'pro' || apiKey?.tier === 'pro' ? 'pro' : 'growth')
  );
  const [selectedGateway, setSelectedGateway] = useState('cashfree'); // 'cashfree' | 'phonepe'
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isQuarterly = billingCycle === 'quarterly';

  const plans = [
    {
      id: 'growth',
      name: 'Growth Partner',
      price: isQuarterly ? 852 : 299,
      originalPrice: isQuarterly ? 897 : null,
      effectiveMonthly: isQuarterly ? '₹284 / mo' : null,
      priceLabel: isQuarterly ? '₹852' : '₹299',
      period: isQuarterly ? '/ 3 months' : '/ month',
      badge: 'Stock Sync',
      tagline: 'Sync live stock & wholesale catalog automatically.',
      features: [
        { text: 'Live stock status sync (Shopify & WooCommerce)', included: true },
        { text: 'Real-time wholesale catalog & pricing feeds', included: true },
        { text: isQuarterly ? '10,000 API requests / month (90-day access)' : '10,000 API requests / month (3 req/sec)', included: true },
        { text: 'Automated order placement', included: false, notice: 'Manual Orders' },
      ],
      ordersEnabled: false,
    },
    {
      id: 'pro',
      name: 'Pro Scale',
      price: isQuarterly ? 1422 : 499,
      originalPrice: isQuarterly ? 1497 : null,
      effectiveMonthly: isQuarterly ? '₹474 / mo' : null,
      priceLabel: isQuarterly ? '₹1,422' : '₹499',
      period: isQuarterly ? '/ 3 months' : '/ month',
      badge: 'Recommended • Full Automation',
      recommended: true,
      tagline: 'Continuous stock synchronization plus automated order routing.',
      features: [
        { text: 'Everything in Growth Partner plan', included: true },
        { text: 'Automated order placement API (/api/v1/orders)', included: true, highlightNotice: 'Full Automation' },
        { text: 'Multi-store SKU routing & priority warehouse queue', included: true },
        { text: isQuarterly ? '25,000 API requests / month (90-day access)' : '25,000 API requests / month & priority dispatch', included: true },
      ],
      ordersEnabled: true,
    },
  ];

  const currentSelected = plans.find((p) => p.id === selectedPlan) || plans[0];

  const handlePay = async () => {
    if (!apiKey?.id) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const returnUrl = `${window.location.origin}/account?tab=developer&key_id=${apiKey.id}`;
      const data = await developerService.createSubscriptionOrder({
        keyId: apiKey.id,
        plan: selectedPlan,
        billingCycle,
        gateway: selectedGateway,
        returnUrl: selectedGateway === 'phonepe' ? `${returnUrl}&gateway=phonepe` : returnUrl,
      });

      if (selectedGateway === 'phonepe') {
        if (!data.redirect_url) throw new Error('PhonePe did not provide checkout URL.');
        window.location.assign(data.redirect_url);
        return;
      }

      // Cashfree Modal Checkout
      const envMode = (data.environment || 'SANDBOX').toLowerCase() === 'production' ? 'production' : 'sandbox';
      const cashfree = await loadCashfree({ mode: envMode });
      if (!cashfree) throw new Error('Cashfree Payment Gateway SDK failed to initialize.');

      const checkoutResult = await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_modal',
        appearance: { width: '650px', height: '780px' },
      });

      if (checkoutResult?.error) {
        setErrorMsg('Payment cancelled or dismissed. You can retry whenever you are ready.');
        setSubmitting(false);
        return;
      }

      if (checkoutResult?.redirect) {
        return;
      }

      // Customer completed payment -> verify server-to-server
      const verifyRes = await developerService.verifySubscriptionOrder({
        keyId: apiKey.id,
        gateway: 'cashfree',
        orderId: data.order_id,
      });

      if (verifyRes?.success && verifyRes.is_paid) {
        setSuccessMsg(`Payment confirmed! Your ${isQuarterly ? '90-day' : '30-day'} Developer API subscription is now active.`);
        if (onActivated) {
          onActivated(verifyRes.keyRecord);
        }
      } else {
        setErrorMsg('Payment verification unconfirmed. Please wait a moment and refresh.');
      }
    } catch (err) {
      console.error('[PlanSelectionCard] Error:', err);
      setErrorMsg(err.message || 'Payment initiation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dev-plan-selection-card">
      <div className="dev-plan-header">
        <div className={`dev-plan-header-badge ${isExpired ? 'error' : isRenewal ? 'warning' : 'success'}`}>
          {isExpired ? (
            <>
              <AlertTriangle size={12} />
              <span>Subscription Expired</span>
            </>
          ) : isRenewal ? (
            <>
              <RefreshCw size={12} />
              <span>Extend Subscription</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={12} />
              <span>Application Approved</span>
            </>
          )}
        </div>
        <h2 className="dev-plan-title">
          {isExpired
            ? 'Renew API Subscription'
            : isRenewal
              ? 'Extend Your Plan'
              : 'Select Your API Plan'}
        </h2>
        <p className="dev-plan-subtitle">
          {isExpired
            ? (isQuarterly ? 'Choose a plan to restore your credentials with 90-day coverage & 5% savings.' : 'Choose a plan to restore your API credentials and live feeds.')
            : isRenewal
              ? (isQuarterly ? 'Extend your plan by 90 days with 5% discount.' : 'Add 30 days or upgrade to full order automation.')
              : (isQuarterly ? 'Pay for 3 months with 5% discount to activate your credentials.' : 'Choose a monthly plan to activate your credentials.')}
        </p>
      </div>

      {errorMsg && (
        <div className="dev-plan-alert error" role="alert">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="dev-plan-alert success" role="alert">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Billing Frequency Toggle */}
      <div className="dev-plan-cycle-toggle-wrap">
        <div
          role="radiogroup"
          aria-label="Billing frequency"
          className="dev-plan-cycle-toggle"
        >
          <button
            type="button"
            role="radio"
            aria-checked={billingCycle === 'monthly'}
            className={`dev-plan-cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            <span>Monthly</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={billingCycle === 'quarterly'}
            className={`dev-plan-cycle-btn ${billingCycle === 'quarterly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('quarterly')}
          >
            <span>3 Months</span>
            <span className="dev-plan-discount-text">5% Off</span>
          </button>
        </div>
      </div>

      {/* 2 Plans Grid */}
      <div className="dev-plans-grid">
        {plans.map((p) => {
          const isSelected = selectedPlan === p.id;
          return (
            <div
              key={p.id}
              className={`dev-plan-option-box ${isSelected ? 'selected' : ''} ${p.recommended ? 'recommended' : ''}`}
              onClick={() => setSelectedPlan(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setSelectedPlan(p.id);
                }
              }}
            >
              <div className="dev-plan-option-top">
                <span className={`dev-plan-badge-tag ${p.recommended ? 'highlight' : ''}`}>
                  {p.badge}
                </span>
                <div className="dev-plan-radio">
                  <div className={`dev-radio-circle ${isSelected ? 'active' : ''}`}>
                    {isSelected && <div className="dev-radio-dot" />}
                  </div>
                </div>
              </div>

              <div className="dev-plan-name-block">
                <h3 className="dev-plan-name">{p.name}</h3>
                <p className="dev-plan-tagline">{p.tagline}</p>
              </div>

              <div className="dev-plan-price-block">
                {p.originalPrice && (
                  <span className="dev-plan-original-price">₹{p.originalPrice}</span>
                )}
                <span className="dev-plan-amount">{p.priceLabel}</span>
                <span className="dev-plan-period">{p.period}</span>
              </div>
              {p.effectiveMonthly && (
                <div className="dev-plan-effective-monthly">
                  <span>{p.effectiveMonthly}</span>
                  <span className="dev-plan-saved-tag">5% Saved</span>
                </div>
              )}

              <div className="dev-plan-divider" />

              <div className="dev-plan-features-list">
                {p.features.map((feat, idx) => (
                  <div key={idx} className={`dev-plan-feat-item ${feat.included ? 'included' : 'not-included'} ${feat.highlightNotice ? 'highlighted' : ''}`}>
                    {feat.included ? (
                      <Check size={14} className="dev-feat-check" />
                    ) : (
                      <X size={14} className="dev-feat-cross" />
                    )}
                    <div className="dev-feat-content">
                      <span className={`dev-feat-text ${!feat.included ? 'disabled' : ''}`}>
                        {feat.text}
                      </span>
                      {feat.notice && (
                        <span className="dev-feat-pill notice">{feat.notice}</span>
                      )}
                      {feat.highlightNotice && (
                        <span className="dev-feat-pill highlight">{feat.highlightNotice}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Gateway Selector */}
      <div className="dev-gateway-section">
        <div className="dev-gateway-header-row">
          <span className="dev-gateway-title-label">Choose Payment Gateway</span>
        </div>

        <div className="dev-gateways-grid">
          <label className={`dev-gateway-card ${selectedGateway === 'cashfree' ? 'selected' : ''}`}>
            <div className="dev-gateway-card-top">
              <input
                type="radio"
                name="gateway_option"
                value="cashfree"
                checked={selectedGateway === 'cashfree'}
                onChange={() => setSelectedGateway('cashfree')}
              />
              <div className="dev-gateway-logo-badge">
                <img
                  src="/assets/payment-methods/cashfree.svg"
                  alt="Cashfree"
                  width={24}
                  height={24}
                  className="dev-gateway-logo-img"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="dev-gateway-card-body">
              <span className="dev-gateway-title">Cashfree Payments</span>
              <span className="dev-gateway-desc">UPI, Cards & NetBanking</span>
            </div>
          </label>

          <label className={`dev-gateway-card ${selectedGateway === 'phonepe' ? 'selected' : ''}`}>
            <div className="dev-gateway-card-top">
              <input
                type="radio"
                name="gateway_option"
                value="phonepe"
                checked={selectedGateway === 'phonepe'}
                onChange={() => setSelectedGateway('phonepe')}
              />
              <div className="dev-gateway-logo-badge">
                <img
                  src="/assets/payment-methods/phonepe.svg"
                  alt="PhonePe"
                  width={24}
                  height={24}
                  className="dev-gateway-logo-img"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="dev-gateway-card-body">
              <span className="dev-gateway-title">PhonePe Checkout</span>
              <span className="dev-gateway-desc">UPI, QR Code & Cards</span>
            </div>
          </label>
        </div>
      </div>

      {/* Action Footer */}
      <div className="dev-plan-footer">
        <div className="dev-plan-security-inline">
          <Shield size={14} className="dev-shield-icon" />
          <span>{isQuarterly ? 'Prepaid 90-day access (5% OFF applied) • Instant automatic activation' : 'Prepaid 30-day access • Instant automatic activation'}</span>
        </div>

        <div className="dev-plan-footer-actions">
          {onClose && (
            <button
              type="button"
              className="api-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="dev-btn-checkout"
            onClick={handlePay}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="spin-icon" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Pay ₹{currentSelected.price} & Activate {isQuarterly ? '(3 Months)' : ''} →</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeveloperDashboard({
  user,
  buyerProfile,
  onProfileUpdate,
  setBuyerProfile,
  apiKeyRecord: initialKeyRecord,
  isAdminMode = false,
  onAdminUpdate,
  navigate,
}) {
  const [apiKey, setApiKey] = useState(initialKeyRecord || null);
  const [loading, setLoading] = useState(!initialKeyRecord);
  const [revealedKey, setRevealedKey] = useState(null); // transient in-memory ONLY; fetched strictly on user click
  const [revealingKey, setRevealingKey] = useState(false);
  const [copyingKey, setCopyingKey] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [usageStats, setUsageStats] = useState({ usage: [], totalMonth: initialKeyRecord?.monthTotal ?? 0 });
  const [activePlatformTab, setActivePlatformTab] = useState('woocommerce');
  const [activeDevTab, setActiveDevTab] = useState('keys');

  // Subscription Plan & Gateway State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [verifyingSub, setVerifyingSub] = useState(false);
  const [subNotice, setSubNotice] = useState(null);
  const [initialPlanFromUrl, setInitialPlanFromUrl] = useState(null);
  const [initialCycleFromUrl, setInitialCycleFromUrl] = useState(null);

  // Check URL params for pre-selected plan or billing cycle from documentation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    const cycleParam = urlParams.get('cycle');
    if (planParam === 'growth' || planParam === 'pro') {
      setInitialPlanFromUrl(planParam);
      if (apiKey && apiKey.subscription_status === 'active') {
        setPlanModalOpen(true);
      }
    }
    if (cycleParam === 'quarterly' || cycleParam === 'monthly') {
      setInitialCycleFromUrl(cycleParam);
    }
  }, [apiKey]);

  // Auto-verify subscription if returning from gateway redirect (PhonePe / Cashfree)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const ppSubId = urlParams.get('pp_sub_id') || (urlParams.get('gateway') === 'phonepe' ? (urlParams.get('order_id') || urlParams.get('orderId')) : null);
    const cfSubId = urlParams.get('cf_sub_id') || (urlParams.get('gateway') === 'cashfree' ? (urlParams.get('order_id') || urlParams.get('orderId')) : null);
    const subOrderId = ppSubId || cfSubId || urlParams.get('order_id') || urlParams.get('orderId');
    const targetKeyId = urlParams.get('key_id') || apiKey?.id;

    if (subOrderId && targetKeyId) {
      const gateway = (ppSubId || String(subOrderId).startsWith('PP_')) ? 'phonepe' : 'cashfree';
      setVerifyingSub(true);
      developerService.verifySubscriptionOrder({
        keyId: targetKeyId,
        gateway,
        orderId: subOrderId,
      })
        .then((res) => {
          if (res?.success && res.keyRecord) {
            setApiKey(res.keyRecord);
            const is90Days = (res.keyRecord?.subscription_amount > 500) || String(subOrderId).includes('_3M_');
            setSubNotice({ type: 'success', message: `Payment successful! Your ${is90Days ? '90-day' : '30-day'} Developer API subscription is active.` });
            const cleanUrl = window.location.pathname + '?tab=developer';
            window.history.replaceState({}, document.title, cleanUrl);
            if (onAdminUpdate) onAdminUpdate(res.keyRecord);
          } else {
            setSubNotice({ type: 'error', message: 'Could not automatically confirm payment. Please check your transaction status.' });
          }
        })
        .catch((err) => {
          console.warn('[DeveloperDashboard] auto-verify error:', err);
          setSubNotice({ type: 'error', message: err.message || 'Payment verification failed.' });
        })
        .finally(() => {
          setVerifyingSub(false);
        });
    }
  }, [apiKey?.id]);

  // Test Console State
  const [testEndpoint, setTestEndpoint] = useState('/api/v1/stock-status');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  // Curated Catalog Selection State
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [catalogMode, setCatalogMode] = useState(initialKeyRecord?.catalog_mode || 'all');
  const [selectedSkus, setSelectedSkus] = useState(Array.isArray(initialKeyRecord?.selected_skus) ? initialKeyRecord.selected_skus : []);
  const [isCuratorGridOpen, setIsCuratorGridOpen] = useState(false);
  const [curatorSearch, setCuratorSearch] = useState('');
  const [curatorCategory, setCuratorCategory] = useState('all');
  const [curatorStockOnly, setCuratorStockOnly] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const [selectionSuccessMsg, setSelectionSuccessMsg] = useState(null);

  // Admin Override Form State
  const [adminTier, setAdminTier] = useState(initialKeyRecord?.tier || 'free');
  const [adminQuota, setAdminQuota] = useState(initialKeyRecord?.monthly_quota || 2000);
  const [adminRps, setAdminRps] = useState(initialKeyRecord?.rate_limit_rps || 1);
  const [adminIsActive, setAdminIsActive] = useState(initialKeyRecord?.is_active ?? true);
  const [adminOrdersEnabled, setAdminOrdersEnabled] = useState(initialKeyRecord?.orders_enabled ?? false);
  const [adminSaving, setAdminSaving] = useState(false);

  // API Access Request form state
  const [reqGstin, setReqGstin] = useState(
    buyerProfile?.gstin || buyerProfile?.gst_number || initialKeyRecord?.gst_number || ''
  );
  const [reqWebsite, setReqWebsite] = useState(
    initialKeyRecord?.client_website || ''
  );
  const [reqBusinessType, setReqBusinessType] = useState('');
  const [reqOperationalStatus, setReqOperationalStatus] = useState('');
  const [reqUseCases, setReqUseCases] = useState([]);
  const [reqPlatform, setReqPlatform] = useState('');
  const [reqOrderVolume, setReqOrderVolume] = useState('');
  const [reqTimeline, setReqTimeline] = useState('');
  const [reqOtherSuppliers, setReqOtherSuppliers] = useState('');
  const [reqGoals, setReqGoals] = useState('');
  const [reqTechnicalEmail, setReqTechnicalEmail] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Legacy key creation fallback
  const [newClientName, setNewClientName] = useState(buyerProfile?.business_name || buyerProfile?.full_name || '');
  const [newClientWebsite, setNewClientWebsite] = useState('');
  const [domainOwnerName, setDomainOwnerName] = useState(buyerProfile?.full_name || user?.user_metadata?.full_name || '');
  const [gstNumber, setGstNumber] = useState(buyerProfile?.gstin || buyerProfile?.gst_number || '');
  const [creatingKey, setCreatingKey] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGeneratedSecret, setNewGeneratedSecret] = useState(null);

  // Sync profile values if loaded asynchronously
  useEffect(() => {
    if (buyerProfile?.gstin && !reqGstin) {
      setReqGstin(buyerProfile.gstin);
    }
  }, [buyerProfile?.gstin]);

  // Confirmation Modal State for dangerous / impactful admin actions
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    isDanger: false,
    requiredInputText: null,
    clientName: '',
    onConfirm: null,
  });

  const triggerConfirm = ({ title, message, confirmLabel, isDanger = false, requiredInputText = null, onConfirm }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: confirmLabel || (isDanger ? 'Yes, Proceed' : 'Confirm'),
      cancelLabel: 'Cancel',
      isDanger,
      requiredInputText,
      clientName: apiKey?.client_name || 'Client',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

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
        setAdminOrdersEnabled(Boolean(record.orders_enabled));
        setCatalogMode(record.catalog_mode || 'all');
        setSelectedSkus(Array.isArray(record.selected_skus) ? record.selected_skus : []);

        const stats = await developerService.getUsageStats(record.id, 14, record.user_id || user?.id);
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
      setAdminOrdersEnabled(Boolean(initialKeyRecord.orders_enabled));
      setCatalogMode(initialKeyRecord.catalog_mode || 'all');
      setSelectedSkus(Array.isArray(initialKeyRecord.selected_skus) ? initialKeyRecord.selected_skus : []);
      if (typeof initialKeyRecord.monthTotal === 'number') {
        setUsageStats(prev => ({ ...prev, totalMonth: initialKeyRecord.monthTotal }));
      }
      void developerService.getUsageStats(initialKeyRecord.id, 14, initialKeyRecord.user_id || user?.id).then(setUsageStats);
    } else {
      void loadData();
    }
  }, [
    initialKeyRecord?.id,
    initialKeyRecord?.user_id,
    initialKeyRecord?.monthTotal,
    initialKeyRecord?.is_active,
    initialKeyRecord?.orders_enabled,
    initialKeyRecord?.tier,
    initialKeyRecord?.monthly_quota,
    initialKeyRecord?.rate_limit_rps,
    initialKeyRecord?.updated_at,
    user?.id,
  ]);

  // Load Products for Visual Catalog Curator
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setLoadingProducts(true);
      try {
        const prods = await fetchProducts();
        if (isMounted && Array.isArray(prods)) {
          setAvailableProducts(prods);
        }
      } catch (err) {
        console.warn('[DeveloperDashboard] Error loading products for curator:', err);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }
    void loadCatalog();
    return () => { isMounted = false; };
  }, [apiKey?.id]);

  // Categories list derived from products
  const categoriesList = useMemo(() => {
    const set = new Set();
    availableProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [availableProducts]);

  // Filtered products for visual curator
  const filteredCuratorProducts = useMemo(() => {
    return availableProducts.filter(p => {
      const pSku = (p.id || p.groupKey || '').toLowerCase();
      const pTitle = (p.title || p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pFabric = (p.fabric || '').toLowerCase();

      if (curatorSearch.trim()) {
        const q = curatorSearch.toLowerCase().trim();
        const matches = pSku.includes(q) || pTitle.includes(q) || pCat.includes(q) || pFabric.includes(q);
        if (!matches) return false;
      }

      if (curatorCategory !== 'all') {
        if (pCat !== curatorCategory.toLowerCase()) return false;
      }

      if (curatorStockOnly) {
        const isOutOfStock = p.isOutOfStock || p.stockStatusOverride === 'out-of-stock';
        if (isOutOfStock) return false;
      }

      return true;
    });
  }, [availableProducts, curatorSearch, curatorCategory, curatorStockOnly]);

  const toggleSelectSku = (sku) => {
    setSelectedSkus(prev => {
      const skuStr = String(sku);
      if (prev.includes(skuStr)) {
        return prev.filter(s => s !== skuStr);
      } else {
        return [...prev, skuStr];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredSkuSet = new Set(filteredCuratorProducts.map(p => String(p.id || p.groupKey)));
    setSelectedSkus(prev => {
      const combined = new Set([...prev, ...filteredSkuSet]);
      return Array.from(combined);
    });
  };

  const handleDeselectAllFiltered = () => {
    const filteredSkuSet = new Set(filteredCuratorProducts.map(p => String(p.id || p.groupKey)));
    setSelectedSkus(prev => prev.filter(s => !filteredSkuSet.has(s)));
  };

  const handleOpenCuratorGrid = () => {
    if (isAdminMode) {
      triggerConfirm({
        title: 'Edit Curated Catalog',
        message: 'Product changes directly modify what is synced to the client\'s live storefront.',
        confirmLabel: 'Edit Catalog',
        isDanger: false,
        onConfirm: () => setIsCuratorGridOpen(true),
      });
    } else {
      setIsCuratorGridOpen(true);
    }
  };

  const handleClearAllSelections = () => {
    if (isAdminMode) {
      triggerConfirm({
        title: 'Clear Product Selection',
        message: 'This will remove all products from the feed. The storefront sync will be empty until new products are selected.',
        confirmLabel: 'Clear Products',
        isDanger: true,
        onConfirm: () => setSelectedSkus([]),
      });
    } else {
      setSelectedSkus([]);
    }
  };

  const handleSaveCatalogSelection = async () => {
    if (!apiKey?.id) return;

    const executeSave = async () => {
      setSavingSelection(true);
      setSelectionSuccessMsg(null);
      try {
        const { data, error } = await developerService.updateApiKey(apiKey.id, {
          catalog_mode: 'curated',
          selected_skus: selectedSkus,
        });
        if (error) throw error;
        setApiKey(prev => ({
          ...prev,
          catalog_mode: 'curated',
          selected_skus: selectedSkus,
        }));
        setSelectionSuccessMsg(`Saved! API & Feed will now sync your ${selectedSkus.length} selected ${selectedSkus.length === 1 ? 'product' : 'products'}.`);
        setTimeout(() => setSelectionSuccessMsg(null), 4000);
      } catch (err) {
        alert('Failed to save catalog selection: ' + err.message);
      } finally {
        setSavingSelection(false);
      }
    };

    if (isAdminMode) {
      triggerConfirm({
        title: 'Save Curated Feed',
        message: `Update live storefront sync feed to ${selectedSkus.length} selected ${selectedSkus.length === 1 ? 'product' : 'products'}?`,
        confirmLabel: 'Save Feed',
        isDanger: false,
        onConfirm: executeSave,
      });
    } else {
      await executeSave();
    }
  };

  const handleAdminToggleActiveChange = (newChecked) => {
    if (!newChecked) {
      triggerConfirm({
        title: 'Disable API Access',
        message: 'Live storefront requests from this client will immediately receive 403 Forbidden errors and stop syncing products or orders.',
        confirmLabel: 'Disable Access',
        isDanger: true,
        onConfirm: async () => {
          setAdminIsActive(false);
          try {
            const { data, error } = await developerService.updateApiKey(apiKey.id, {
              is_active: false,
              orders_enabled: false,
            });
            if (error) throw error;
            setApiKey(prev => ({ ...prev, is_active: false, orders_enabled: false }));
            setAdminOrdersEnabled(false);
            if (onAdminUpdate) onAdminUpdate({ ...apiKey, is_active: false, orders_enabled: false });
          } catch (e) {
            alert('Failed to update status: ' + e.message);
          }
        }
      });
    } else {
      triggerConfirm({
        title: 'Enable API Access',
        message: 'Restore API access for this client? Incoming requests from their storefront will resume immediately.',
        confirmLabel: 'Enable Access',
        isDanger: false,
        onConfirm: async () => {
          setAdminIsActive(true);
          try {
            const { data, error } = await developerService.updateApiKey(apiKey.id, { is_active: true });
            if (error) throw error;
            setApiKey(prev => ({ ...prev, is_active: true }));
            if (onAdminUpdate) onAdminUpdate({ ...apiKey, is_active: true });
          } catch (e) {
            alert('Failed to update status: ' + e.message);
          }
        }
      });
    }
  };

  const handleAdminToggleOrdersChange = (newChecked) => {
    const keyId = apiKey?.id;
    if (!keyId) return;

    // Guard: Cannot enable Order API if API key / Product API is disabled
    if (!apiKey?.is_active && newChecked) {
      alert('Cannot enable Order API while Product API is disabled. Please activate the API Key first.');
      return;
    }

    triggerConfirm({
      title: newChecked ? 'Enable Order API Access' : 'Disable Order API Access',
      message: newChecked
        ? `Grant /api/v1/orders access to ${apiKey?.client_name || 'this client'}? They will be authorized to submit wholesale orders.`
        : `Revoke /api/v1/orders access for ${apiKey?.client_name || 'this client'}? Any subsequent order requests will receive 403 Forbidden.`,
      confirmLabel: newChecked ? 'Enable Order API' : 'Disable Order API',
      isDanger: !newChecked,
      clientName: apiKey?.client_name,
      onConfirm: async () => {
        try {
          const { data, error } = await developerService.updateApiKey(keyId, {
            orders_enabled: newChecked,
          });
          if (error) throw error;
          setApiKey(prev => ({ ...prev, orders_enabled: newChecked }));
          setAdminOrdersEnabled(newChecked);
          if (onAdminUpdate) onAdminUpdate({ ...apiKey, orders_enabled: newChecked });
        } catch (e) {
          alert('Failed to update Order API access: ' + e.message);
        }
      },
    });
  };

  const copyToClipboard = async (text, fieldId) => {
    if (!text) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleToggleUseCase = (useCase) => {
    setReqUseCases((prev) =>
      prev.includes(useCase)
        ? prev.filter((item) => item !== useCase)
        : [...prev, useCase]
    );
  };

  const handleSubmitApiAccessRequest = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!reqGstin.trim()) {
      alert('Please enter your GSTIN.');
      return;
    }
    if (!reqWebsite.trim()) {
      alert('Please enter your eCommerce Website / Online Store URL.');
      return;
    }
    if (!reqBusinessType) {
      alert('Please select what best describes your business.');
      return;
    }
    if (!reqOperationalStatus) {
      alert('Please select whether your business is currently operational.');
      return;
    }
    if (reqUseCases.length === 0) {
      alert('Please select at least one use case for the Weave 365 API.');
      return;
    }
    if (!reqPlatform) {
      alert('Please select which platform you are integrating with.');
      return;
    }
    if (!reqOrderVolume) {
      alert('Please select your expected monthly order volume.');
      return;
    }
    if (!reqTimeline) {
      alert('Please select when you plan to start using the API.');
      return;
    }
    if (!reqOtherSuppliers) {
      alert('Please select whether you currently sell products from other suppliers.');
      return;
    }
    if (!reqGoals.trim()) {
      alert('Please describe what you are looking to achieve through the integration.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const requestDetails = {
        gstin: reqGstin.trim().toUpperCase(),
        websiteUrl: reqWebsite.trim(),
        businessType: reqBusinessType,
        operationalStatus: reqOperationalStatus,
        apiUseCases: reqUseCases,
        platform: reqPlatform,
        monthlyOrderVolume: reqOrderVolume,
        timeline: reqTimeline,
        sellsOtherSuppliers: reqOtherSuppliers,
        goals: reqGoals.trim(),
        technicalEmail: reqTechnicalEmail.trim(),
        submittedAt: new Date().toISOString(),
      };

      const clientName = buyerProfile?.business_name || buyerProfile?.full_name || user?.user_metadata?.full_name || 'B2B Client Portal';
      const domainOwnerName = buyerProfile?.full_name || user?.user_metadata?.full_name || '';

      const { keyRecord } = await developerService.createApiKey(user.id, {
        clientName,
        clientWebsite: reqWebsite.trim(),
        domainOwnerName,
        gstNumber: reqGstin.trim().toUpperCase(),
        tier: 'free',
        ordersEnabled: false,
        isActive: false, // Critical: Not immediately accessible, requires admin manual approval
        requestDetails,
      });

      setApiKey(keyRecord);
      if (onAdminUpdate) onAdminUpdate(keyRecord);
    } catch (err) {
      alert('Failed to submit API Access Request: ' + err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!newClientName || !newClientName.trim()) {
      alert('Please provide your Business or Storefront name.');
      return;
    }
    if (!newClientWebsite || !newClientWebsite.trim()) {
      alert('Please provide your storefront / website URL.');
      return;
    }
    if (!domainOwnerName || !domainOwnerName.trim()) {
      alert('Please provide the Domain Owner / Developer name.');
      return;
    }
    if (!gstNumber || !gstNumber.trim()) {
      alert('Please provide your Business GST Number / GSTIN.');
      return;
    }
    setCreatingKey(true);
    try {
      const { keyRecord, rawSecretKey } = await developerService.createApiKey(user.id, {
        clientName: newClientName.trim(),
        clientWebsite: newClientWebsite.trim(),
        domainOwnerName: domainOwnerName.trim(),
        gstNumber: gstNumber.trim().toUpperCase(),
        tier: 'free',
        orders_enabled: false,
      });
      setApiKey(keyRecord);
      setNewGeneratedSecret(null);
      setRevealedKey(null);
      setShowKeySecret(false);
      await developerService.getUsageStats(keyRecord.id, 14, keyRecord.user_id || user?.id).then(setUsageStats);
    } catch (err) {
      alert('Failed to generate API Key: ' + err.message);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!apiKey?.id) return;
    triggerConfirm({
      title: 'Regenerate Secret Key',
      message: 'The current production key will stop working immediately. Connected plugins must be updated with the new key.',
      confirmLabel: 'Regenerate Key',
      isDanger: true,
      requiredInputText: 'REGENERATE',
      onConfirm: async () => {
        try {
          const { keyRecord } = await developerService.regenerateApiKey(apiKey.id);
          setApiKey(keyRecord);
          setNewGeneratedSecret(null);
          // Never leave the secret key exposed automatically; fetch strictly when user clicks eye
          setRevealedKey(null);
          setShowKeySecret(false);
          alert('New API Key generated successfully! You can click the eye icon to securely view and copy your secret key anytime.');
        } catch (err) {
          alert('Failed to regenerate key: ' + err.message);
        }
      }
    });
  };

  const handleToggleReveal = async () => {
    if (showKeySecret) {
      setShowKeySecret(false);
      return;
    }

    // If already in transient memory from a previous click in this active session
    if (revealedKey) {
      setShowKeySecret(true);
      return;
    }

    if (!apiKey?.id) return;
    setRevealingKey(true);
    try {
      const fullKey = await developerService.revealApiKey(apiKey.id);
      // Strictly stored in transient React state only. Never in localStorage or browser storage.
      setRevealedKey(fullKey);
      setShowKeySecret(true);
    } catch (err) {
      if (err.code === 'LEGACY_KEY_NEEDS_REGENERATION') {
        alert('This API key was created before secure on-demand retrieval was available. Please click "Regenerate Key" above to generate a new key that supports instant viewing.');
      } else {
        alert(err.message || 'Failed to securely fetch API key.');
      }
    } finally {
      setRevealingKey(false);
    }
  };

  const handleCopyKey = async () => {
    if (revealedKey) {
      copyToClipboard(revealedKey, 'api-key');
      return;
    }

    if (!apiKey?.id) return;
    setCopyingKey(true);
    try {
      const fullKey = await developerService.revealApiKey(apiKey.id);
      // Strictly stored in transient React state only. Never in localStorage or browser storage.
      setRevealedKey(fullKey);
      copyToClipboard(fullKey, 'api-key');
    } catch (err) {
      if (err.code === 'LEGACY_KEY_NEEDS_REGENERATION') {
        alert('This API key was created before secure on-demand retrieval was available. Please click "Regenerate Key" above to generate a new key that can be copied.');
      } else {
        alert(err.message || 'Failed to securely retrieve API key for copying.');
      }
    } finally {
      setCopyingKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!apiKey?.id) return;
    triggerConfirm({
      title: 'Delete API Key',
      message: 'This action cannot be undone. All connected storefront plugins and feeds using this key will immediately lose access.',
      confirmLabel: 'Delete Key',
      isDanger: true,
      requiredInputText: 'DELETE',
      onConfirm: async () => {
        try {
          const targetUserId = apiKey.user_id || user?.id;
          const { error } = await developerService.deleteApiKey(apiKey.id, targetUserId);
          if (error) throw error;
          setApiKey(null);
          setRevealedKey(null);
          setNewGeneratedSecret(null);
          setNewClientName(buyerProfile?.business_name || '');
          setNewClientWebsite('');
          if (buyerProfile?.qualification?.api_access_request) {
            delete buyerProfile.qualification.api_access_request;
          }
          if (onAdminUpdate) onAdminUpdate(null);
          alert('API Key permanently deleted.');
        } catch (err) {
          alert('Failed to delete API Key: ' + err.message);
        }
      }
    });
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
        orders_enabled: adminOrdersEnabled,
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
      const activeKeyToUse = (revealedKey || apiKey?.key_prefix || '').trim();
      if (!activeKeyToUse || activeKeyToUse.includes('...') || activeKeyToUse.includes('••••')) {
        setTestStatus(401);
        setTestResponse({
          status: 'error',
          code: 'UNAUTHORIZED',
          message: 'Full unmasked API secret key required. For security, full keys are shown only once upon generation. Please test using curl or Postman with your saved secret key.',
        });
        setTestLoading(false);
        return;
      }
      const headers = {
        'X-API-Key': activeKeyToUse,
      };
      const res = await fetch(testEndpoint, { headers });
      setTestStatus(res.status);

      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { response: text };
        }
      }
      setTestResponse(data);

      if (apiKey?.id) {
        // Refresh usage metrics after request
        setTimeout(async () => {
          try {
            const updatedStats = await developerService.getUsageStats(apiKey.id, 14, apiKey.user_id || user?.id);
            setUsageStats(updatedStats);
          } catch (e) {
            console.warn('[DeveloperDashboard] Error refreshing usage stats:', e);
          }
        }, 300);
      }
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

  // Display key string (only unmasked when explicitly revealed by user click)
  const displayKey = showKeySecret && revealedKey ? revealedKey : (apiKey?.key_prefix || '••••••••••••••••••••••••••••••••');

  if (loading) {
    return (
      <div className="dev-dashboard-loading">
        <RefreshCw size={28} className="spin-icon" />
        <p>Loading Developer Dashboard & API Metrics...</p>
      </div>
    );
  }

  const hasKey = Boolean(apiKey?.id);
  const isKeyActive = Boolean(apiKey?.is_active);
  const approvalStatus = (apiKey?.approval_status === 'approved' || isKeyActive) ? 'approved' : (apiKey?.approval_status || 'none');
  const subscriptionStatus = apiKey?.subscription_status || (isKeyActive ? 'active' : 'inactive');

  const rawExpiresAt = apiKey?.subscription_expires_at
    ? new Date(apiKey.subscription_expires_at)
    : apiKey?.subscription_started_at
      ? new Date(new Date(apiKey.subscription_started_at).getTime() + 30 * 24 * 60 * 60 * 1000)
      : apiKey?.created_at
        ? new Date(new Date(apiKey.created_at).getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;

  const effectiveExpiryDate = (rawExpiresAt && !isNaN(rawExpiresAt.getTime()))
    ? (isKeyActive && rawExpiresAt.getTime() < Date.now())
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : rawExpiresAt
    : (isKeyActive ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null);

  const expiresAtMs = effectiveExpiryDate ? effectiveExpiryDate.getTime() : null;
  const isSubscriptionExpired = Boolean(apiKey?.subscription_status === 'expired' || (expiresAtMs && expiresAtMs < Date.now() && !isKeyActive));
  const daysRemaining = expiresAtMs ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  const formattedValidUntil = effectiveExpiryDate
    ? effectiveExpiryDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '30 Days from Activation';

  // Navigation Tabs for Google AI Studio Layout (ultra-minimal clean list without tags or subheadings)
  const devNavTabs = [
    {
      id: 'keys',
      label: 'API Keys & Quota',
      icon: KeyRound,
    },
    {
      id: 'dispatch',
      label: 'Dispatch Label',
      icon: MapPin,
    },
    {
      id: 'catalog',
      label: 'Catalog Feed Sync',
      icon: Layers,
    },
    ...(!isAdminMode
      ? [
          {
            id: 'guides',
            label: 'Platform Guides',
            icon: Code2,
          },
          {
            id: 'console',
            label: 'API Test Console',
            icon: Play,
          },
        ]
      : []),
    {
      id: 'profile',
      label: 'Storefront Profile',
      icon: Building2,
    },
  ];

  // 1. Returning from PhonePe or Cashfree redirect, currently verifying
  if (verifyingSub) {
    return (
      <div className="dev-dashboard-loading" style={{ minHeight: '340px' }}>
        <RefreshCw size={36} className="spin-icon" style={{ color: '#0284c7' }} />
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '14px 0 4px' }}>
          Confirming Subscription Payment...
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '380px', textAlign: 'center' }}>
          Verifying your transaction with the payment gateway. Your developer credentials and dashboard will unlock immediately.
        </p>
      </div>
    );
  }

  // 2. Request submitted and pending manual Admin approval
  const isPendingAdminReview = !isAdminMode && hasKey && !isKeyActive && approvalStatus === 'pending';

  if (isPendingAdminReview) {
    const waSupportUrl = `https://wa.me/91${(storeConfig.whatsapp || '9919101369').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      'Hi Weave 365 Team, I have submitted an API Access Request and would like to contact support.'
    )}`;

    return (
      <div className="dev-after-submission-container">
        <div className="dev-after-submission-card">
          <div className="dev-after-icon-wrap">
            <CheckCircle2 size={32} />
          </div>
          <div className="dev-after-status-tag">
            <Clock size={14} />
            <span>Status: Under Review</span>
          </div>
          <h2 className="dev-after-heading">Thanks. We’ve received your API access request.</h2>
          <p className="dev-after-body">
            Our team will review your business and integration requirements and contact you regarding API access and API documentation. Once approved, you will be able to select your monthly developer plan.
          </p>
          <div className="dev-after-actions">
            <button
              type="button"
              className="dev-btn-visit"
              onClick={() => {
                if (navigate) {
                  navigate('catalogue');
                } else {
                  window.location.href = '/';
                }
              }}
            >
              <span>Visit Weave 365</span>
            </button>
            <a
              href="/developer-api"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-btn-docs"
              title="Open Weave 365 Developer API Documentation"
            >
              <BookOpen size={16} />
              <span>API Documentation ↗</span>
            </a>
            <a
              href={waSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="dev-btn-support"
            >
              <MessageCircle size={16} />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Admin approved the request! Now show the Plan Selection UI
  const isPendingPlanPayment = !isAdminMode && hasKey && approvalStatus === 'approved' && (subscriptionStatus === 'pending_payment' || subscriptionStatus === 'inactive');

  if (isPendingPlanPayment) {
    return (
      <div className="dev-plan-selection-container">
        <PlanSelectionCard
          apiKey={apiKey}
          user={user}
          initialPlan={initialPlanFromUrl}
          initialCycle={initialCycleFromUrl}
          onActivated={(updatedRecord) => {
            setApiKey(updatedRecord);
            if (onAdminUpdate) onAdminUpdate(updatedRecord);
          }}
        />
      </div>
    );
  }

  // If user has not submitted request yet (or key was deleted) and not in admin mode
  if (!hasKey && !isAdminMode) {
    return (
      <div className="dev-api-request-container">
        <div className="dev-api-request-card">
          <div className="dev-api-request-header">
            <div className="dev-api-request-header-content">
              <h2 className="dev-api-request-title">API Access Request</h2>
              <p className="dev-api-request-subtitle">
                Submit your business and integration requirements to request access to the Weave 365 Developer API.
              </p>
            </div>
            <a
              href="/developer-api"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-api-doc-link-btn"
              title="Explore Weave 365 REST API Documentation & Endpoints"
            >
              <BookOpen size={15} />
              <span>API Documentation ↗</span>
            </a>
          </div>

          <form onSubmit={handleSubmitApiAccessRequest} className="dev-api-form">
            {/* GSTIN * */}
            <div className="dev-form-group">
              <label className="dev-group-label" htmlFor="dev-req-gstin">
                <span>GSTIN</span>
                <span className="dev-required">*</span>
              </label>
              <input
                id="dev-req-gstin"
                type="text"
                required
                value={reqGstin}
                onChange={(e) => setReqGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 29ABCDE1234F1Z5"
                maxLength={15}
                className="dev-form-input"
              />
            </div>

            {/* Your eCommerce Website / Online Store URL * */}
            <div className="dev-form-group">
              <label className="dev-group-label" htmlFor="dev-req-website">
                <span>Your eCommerce Website / Online Store URL</span>
                <span className="dev-required">*</span>
              </label>
              <input
                id="dev-req-website"
                type="url"
                required
                value={reqWebsite}
                onChange={(e) => setReqWebsite(e.target.value)}
                placeholder="https://www.yourstore.com"
                className="dev-form-input"
              />
            </div>

            {/* What best describes your business? * */}
            <div className="dev-form-group">
              <label className="dev-group-label">
                <span>What best describes your business?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use Radio Buttons. Allow only one selection.</span>
              <div className="dev-options-list">
                {BUSINESS_TYPES.map((type) => (
                  <label
                    key={type}
                    className={`dev-option-label ${reqBusinessType === type ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="business_type"
                      value={type}
                      checked={reqBusinessType === type}
                      onChange={() => setReqBusinessType(type)}
                      className="dev-option-input"
                      required
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Is your business currently operational? * */}
            <div className="dev-form-group">
              <label className="dev-group-label">
                <span>Is your business currently operational?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use Radio Buttons. Allow only one selection.</span>
              <div className="dev-options-list">
                {OPERATIONAL_STATUSES.map((status) => (
                  <label
                    key={status}
                    className={`dev-option-label ${reqOperationalStatus === status ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="operational_status"
                      value={status}
                      checked={reqOperationalStatus === status}
                      onChange={() => setReqOperationalStatus(status)}
                      className="dev-option-input"
                      required
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* What do you want to use the Weave 365 API for? * */}
            <div className="dev-form-group">
              <label className="dev-group-label">
                <span>What do you want to use the Weave 365 API for?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use Checkboxes. Allow multiple selections.</span>
              <div className="dev-options-list">
                {API_USE_CASES.map((useCase) => {
                  const isChecked = reqUseCases.includes(useCase);
                  return (
                    <label
                      key={useCase}
                      className={`dev-option-label ${isChecked ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        name="api_use_cases"
                        value={useCase}
                        checked={isChecked}
                        onChange={() => handleToggleUseCase(useCase)}
                        className="dev-option-input"
                      />
                      <span>{useCase}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Which platform are you integrating with? * */}
            <div className="dev-form-group">
              <label className="dev-group-label">
                <span>Which platform are you integrating with?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use Radio Buttons. Allow only one selection.</span>
              <div className="dev-options-list">
                {INTEGRATION_PLATFORMS.map((platform) => (
                  <label
                    key={platform}
                    className={`dev-option-label ${reqPlatform === platform ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="integration_platform"
                      value={platform}
                      checked={reqPlatform === platform}
                      onChange={() => setReqPlatform(platform)}
                      className="dev-option-input"
                      required
                    />
                    <span>{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* What is your expected monthly order volume? * */}
            <div className="dev-form-group">
              <label className="dev-group-label">
                <span>What is your expected monthly order volume?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use Radio Buttons. Allow only one selection.</span>
              <div className="dev-options-list">
                {MONTHLY_ORDER_VOLUMES.map((vol) => (
                  <label
                    key={vol}
                    className={`dev-option-label ${reqOrderVolume === vol ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="monthly_volume"
                      value={vol}
                      checked={reqOrderVolume === vol}
                      onChange={() => setReqOrderVolume(vol)}
                      className="dev-option-input"
                      required
                    />
                    <span>{vol}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* When do you plan to start using the API? * */}
            <div className="dev-form-group">
              <label className="dev-group-label">
                <span>When do you plan to start using the API?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use Radio Buttons. Allow only one selection.</span>
              <div className="dev-options-list">
                {TIMELINE_OPTIONS.map((time) => (
                  <label
                    key={time}
                    className={`dev-option-label ${reqTimeline === time ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="start_timeline"
                      value={time}
                      checked={reqTimeline === time}
                      onChange={() => setReqTimeline(time)}
                      className="dev-option-input"
                      required
                    />
                    <span>{time}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Do you currently sell products from other suppliers? * */}
            <div className="dev-form-group">
              <label className="dev-group-label">
                <span>Do you currently sell products from other suppliers?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use Radio Buttons. Allow only one selection.</span>
              <div className="dev-options-list">
                {OTHER_SUPPLIERS_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`dev-option-label ${reqOtherSuppliers === opt ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="other_suppliers"
                      value={opt}
                      checked={reqOtherSuppliers === opt}
                      onChange={() => setReqOtherSuppliers(opt)}
                      className="dev-option-input"
                      required
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* What are you looking to achieve through the integration? * */}
            <div className="dev-form-group">
              <label className="dev-group-label" htmlFor="dev-req-goals">
                <span>What are you looking to achieve through the integration?</span>
                <span className="dev-required">*</span>
              </label>
              <span className="dev-group-caption">Use a Long Text field.</span>
              <textarea
                id="dev-req-goals"
                required
                rows={4}
                value={reqGoals}
                onChange={(e) => setReqGoals(e.target.value)}
                placeholder="Please tell us briefly about your business, your current setup, and what you want to automate using the API."
                className="dev-form-textarea"
              />
            </div>

            {/* Technical Contact / Developer Email */}
            <div className="dev-form-group">
              <label className="dev-group-label" htmlFor="dev-req-tech-email">
                <span>Technical Contact / Developer Email</span>
              </label>
              <span className="dev-group-caption">
                Optional. If the developer or technical contact is different from the registered Weave 365 account holder, enter their email address here.
              </span>
              <input
                id="dev-req-tech-email"
                type="email"
                value={reqTechnicalEmail}
                onChange={(e) => setReqTechnicalEmail(e.target.value)}
                placeholder="developer@example.com"
                className="dev-form-input"
              />
            </div>

            {/* Submit Button & Footnote */}
            <div className="dev-api-submit-wrap">
              <button
                type="submit"
                disabled={submittingRequest}
                className="dev-api-submit-btn"
              >
                {submittingRequest ? <RefreshCw size={16} className="spin-icon" /> : <Zap size={16} />}
                <span>{submittingRequest ? 'Submitting Request...' : 'Request API Access'}</span>
              </button>
              <p className="dev-api-footnote">
                Our technology team will review your business and integration requirements before providing API access.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="dev-dashboard-container">
      {/* 0. Subscription Gateway Notice (Success / Error notification) */}
      {subNotice && (
        <div
          className={`dev-plan-alert ${subNotice.type === 'success' ? 'success' : 'error'}`}
          style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {subNotice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{subNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}
            aria-label="Dismiss message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Admin Inspection Header (Admin Mode Only) */}
      {isAdminMode && (
        <div className="dev-admin-banner">
          <div className="dev-admin-banner-info">
            <Sliders size={14} className="dev-admin-sliders-icon" />
            <div>
              <span>Admin Inspection:</span> <strong>{apiKey?.client_name || 'Client'}</strong> <span className="dev-admin-email">({apiKey?.profiles?.email || 'No email'})</span>
            </div>
          </div>
          <div className="dev-admin-quick-toggles">
            <label
              className="dev-toggle-label"
              style={{
                opacity: !adminIsActive ? 0.6 : 1,
                cursor: !adminIsActive ? 'not-allowed' : 'pointer',
              }}
              title={!adminIsActive ? 'Cannot enable Order API: API key is disabled' : undefined}
            >
              <span>Order API:</span>
              <input
                type="checkbox"
                checked={Boolean(apiKey?.orders_enabled && adminIsActive)}
                disabled={!adminIsActive}
                onChange={(e) => handleAdminToggleOrdersChange(e.target.checked)}
              />
              <span className={(apiKey?.orders_enabled && adminIsActive) ? 'dev-status-pill active' : 'dev-status-pill disabled'}>
                {(apiKey?.orders_enabled && adminIsActive) ? 'ON' : 'OFF'}
              </span>
            </label>
            <label className="dev-toggle-label">
              <span>Status:</span>
              <input
                type="checkbox"
                checked={adminIsActive}
                onChange={(e) => handleAdminToggleActiveChange(e.target.checked)}
              />
              <span className={adminIsActive ? 'dev-status-pill active' : 'dev-status-pill disabled'}>
                {adminIsActive ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Expired Subscription Callout (Reseller Mode) */}
      {!isAdminMode && isSubscriptionExpired && (
        <div className="dev-expired-callout-card" role="alert">
          <div className="dev-expired-callout-main">
            <div className="dev-expired-callout-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="dev-expired-callout-text">
              <div className="dev-expired-callout-title-row">
                <h4 className="dev-expired-callout-title">Subscription Expired</h4>
                <span className="dev-status-pill disabled" style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                  HTTP 403 Forbidden
                </span>
              </div>
              <p className="dev-expired-callout-desc">
                Your 30-day billing cycle for the <strong>{apiKey?.subscription_plan === 'pro' ? 'Pro / Scale' : 'Growth Partner'}</strong> plan has expired. Live external API requests to <code>/api/v1/*</code> are currently rejected. Renew now to restore instant catalog sync and inventory feeds.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="dev-btn-renew-hero"
            onClick={() => setPlanModalOpen(true)}
          >
            <RefreshCw size={15} />
            <span>Renew Subscription (₹{apiKey?.subscription_amount || (apiKey?.subscription_plan === 'pro' ? 499 : 299)}/mo)</span>
          </button>
        </div>
      )}

      {/* Distilled, Clarified & Quieter Suspended API Notice */}
      {apiKey && !apiKey.is_active && !isSubscriptionExpired && (
        <div
          className="dev-suspended-quiet-card"
          role="alert"
          aria-live="polite"
        >
          <div className="dev-suspended-quiet-main">
            <div className="dev-suspended-quiet-icon" aria-hidden="true">
              <AlertTriangle size={16} />
            </div>
            <div className="dev-suspended-quiet-text">
              <div className="dev-suspended-quiet-title-row">
                <h4 className="dev-suspended-quiet-title">API Access Suspended</h4>
                <span className="dev-suspended-quiet-code" aria-label="HTTP Status: 403 Forbidden">403 Forbidden</span>
              </div>
              <p className="dev-suspended-quiet-desc">
                {isAdminMode
                  ? 'All external requests to /api/v1 are blocked. Storefront catalog syncing and automated orders are paused.'
                  : 'Your API key is inactive and live requests are blocked. Contact Weave365 support on WhatsApp to restore access.'}
              </p>
            </div>
          </div>

          <div className="dev-suspended-quiet-action">
            {isAdminMode ? (
              <button
                type="button"
                className="dev-quiet-action-btn admin"
                onClick={() => handleAdminToggleActiveChange(true)}
              >
                <Power size={13} aria-hidden="true" />
                <span>Reactivate Key</span>
              </button>
            ) : (
              <a
                href={`https://wa.me/${(String(storeConfig?.whatsapp || '9919101369').replace(/\D/g, '').length === 10 ? '91' : '') + String(storeConfig?.whatsapp || '9919101369').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hi Weave365 team, my API access for ${apiKey?.client_name || 'my storefront'} is currently suspended. Please help review and reactivate.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="dev-quiet-action-btn support"
              >
                <MessageCircle size={14} aria-hidden="true" />
                <span>Contact Support</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Secret Key Notification Banner (When Key is newly generated) */}
      {newGeneratedSecret && (
        <div className="dev-new-secret-alert">
          <button
            type="button"
            className="dev-close-secret"
            onClick={() => setNewGeneratedSecret(null)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>

          <div className="dev-alert-left">
            <CheckCircle2 size={18} className="dev-alert-icon" />
            <div className="dev-alert-content">
              <strong>New API Secret Key Generated</strong>
              <p>Your API key is active. You can copy it now or view and manage it anytime below.</p>
            </div>
          </div>

          <div className="dev-secret-copy-box">
            <input
              type="text"
              readOnly
              value={newGeneratedSecret}
              className="dev-secret-key-input"
            />
            <button
              type="button"
              onClick={() => copyToClipboard(newGeneratedSecret, 'new-secret')}
              className="dev-copy-btn"
            >
              {copiedField === 'new-secret' ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedField === 'new-secret' ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Quota Exceeded Banner */}
      {currentMonthUsed >= monthlyQuota && apiKey?.is_active && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          marginBottom: '0.5rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '1rem' }}>
                Monthly API Quota Reached ({monthlyQuota.toLocaleString()} requests)
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.875rem', color: '#7f1d1d', lineHeight: '1.4' }}>
                Storefront API requests are currently paused and returning HTTP 429 rate limits. Quota resets in {daysInMonthLeft} {daysInMonthLeft === 1 ? 'day' : 'days'} (1st of next month), or contact support to upgrade to Growth Partner (10,000 req/mo) or Pro Scale (25,000 req/mo).
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/919786541444?text=${encodeURIComponent(`Hi Weave365, I reached my monthly API quota (${monthlyQuota} req) for storefront ${apiKey.client_name || ''} and would like to increase my limit.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="dev-action-chip"
            style={{
              background: '#25D366',
              color: '#ffffff',
              borderColor: '#25D366',
              fontWeight: 600,
              padding: '8px 14px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <MessageCircle size={15} />
            <span>Increase Limit on WhatsApp</span>
          </a>
        </div>
      )}

      {/* Unified Developer Dashboard Header */}
      <div className="dev-page-header">
        <div className="dev-page-header-left">
          <div className="dev-page-header-title-row">
            <h2 className="dev-page-header-title">Developer API</h2>
            <span className={`dev-page-header-badge ${apiKey?.is_active && !isSubscriptionExpired ? 'active' : 'suspended'}`}>
              <span className="dev-quiet-dot" />
              {apiKey?.is_active && !isSubscriptionExpired
                ? 'Active'
                : (isSubscriptionExpired ? 'Expired' : 'Suspended')}
            </span>
            {apiKey?.is_active && (
              <span className="dev-page-header-plan-pill">
                {apiKey?.subscription_plan === 'pro' || apiKey?.orders_enabled ? 'Pro Scale' : 'Growth Partner'}
              </span>
            )}
          </div>
          <p className="dev-page-header-desc">
            Production API credentials and live storefront catalog sync
            {daysRemaining !== null && !isSubscriptionExpired && (
              <span className="dev-page-header-validity">
                {' '}• Valid until <strong>{formattedValidUntil}</strong> ({daysRemaining}d left)
              </span>
            )}
          </p>
        </div>

        <div className="dev-page-header-actions">
          <a
            href="/developer-api"
            target="_blank"
            rel="noopener noreferrer"
            className="dev-header-btn-docs"
            title="Open official REST API documentation & endpoint references"
          >
            <BookOpen size={13} />
            <span>Documentation ↗</span>
          </a>
          {!isAdminMode && (
            <button
              type="button"
              className="dev-header-btn-renew"
              onClick={() => setPlanModalOpen(true)}
            >
              <RefreshCw size={12} />
              <span>{isSubscriptionExpired ? 'Renew Subscription' : 'Renew / Change Plan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Google AI Studio Inspired Studio Layout */}
      <div className="dev-studio-container">
        {/* Left Sidebar Navigation */}
        <aside className="dev-studio-sidebar">
          <div className="dev-studio-sidebar-header">
            <span className="dev-studio-brand-title">Developer Studio</span>
          </div>

          <nav className="dev-studio-nav" aria-label="Developer Dashboard Sections">
            {devNavTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDevTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`dev-studio-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveDevTab(tab.id)}
                >
                  <Icon size={16} className="dev-studio-tab-icon" />
                  <span className="dev-studio-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="dev-studio-sidebar-footer">
            <a
              href="/developer-api"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-studio-docs-link"
            >
              <BookOpen size={14} />
              <span>API Documentation</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </aside>

        {/* Right Main Stage */}
        <main className="dev-studio-main">
          {/* TAB 1: API Keys & Quota (Single Unified Card consolidating Credentials, Quotas & Permissions) */}
          {activeDevTab === 'keys' && (
            <div className="dev-card dev-keys-unified-card">
              {/* Card Header with Title, Store, and Action Chips */}
              <div className="dev-card-head">
                <div className="dev-card-title">
                  <KeyRound size={16} />
                  <h3>API Credentials &amp; Quota</h3>
                  {!apiKey?.is_active && (
                    <span className="dev-metric-badge-suspended">
                      <AlertTriangle size={10} /> Suspended
                    </span>
                  )}
                </div>
                <div className="dev-card-head-actions">
                  <span className="dev-studio-brand-pill">
                    Store:&nbsp;{apiKey?.client_name || 'B2B Partner'}
                  </span>
                  <button
                    type="button"
                    className="dev-action-chip dev-key-action-chip"
                    onClick={handleRegenerateKey}
                    title="Generate a new API secret key"
                  >
                    <RefreshCw size={12} />
                    <span>Regenerate Key</span>
                  </button>
                  <button
                    type="button"
                    className="dev-action-chip dev-key-action-chip danger"
                    onClick={handleDeleteApiKey}
                    title="Permanently revoke and delete this API key"
                  >
                    <Trash2 size={12} />
                    <span>Revoke Key</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Credentials Rows */}
              <div className="dev-credentials-list">
                <div className={`dev-cred-row ${!apiKey?.is_active ? 'suspended' : ''}`}>
                  <div className="dev-cred-info">
                    <span className="dev-cred-name">API Secret Key</span>
                    <span className="dev-cred-desc">
                      {!apiKey?.is_active ? (
                        <span style={{ color: '#dc2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={13} /> Inactive: Incoming requests with this key will return 403 Forbidden
                        </span>
                      ) : (
                        <>Pass in HTTP header: <code className="dev-header-code-pill">X-API-Key:&nbsp;&lt;your_key&gt;</code></>
                      )}
                    </span>
                  </div>
                  <div className="dev-cred-input-wrap">
                    <input
                      type={showKeySecret && revealedKey ? 'text' : 'password'}
                      readOnly
                      value={showKeySecret && revealedKey ? revealedKey : (apiKey?.key_prefix || '••••••••••••••••••••••••••••••••')}
                      className="dev-cred-input"
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <button
                      type="button"
                      className="dev-icon-btn"
                      onClick={handleToggleReveal}
                      disabled={revealingKey}
                      title={showKeySecret ? 'Hide Key' : 'Reveal Key'}
                      aria-label={showKeySecret ? 'Hide Key' : 'Reveal Key'}
                    >
                      {revealingKey ? (
                        <RefreshCw size={16} className="spin-icon" />
                      ) : showKeySecret ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                    <button
                      type="button"
                      className="dev-copy-btn"
                      onClick={handleCopyKey}
                      disabled={copyingKey}
                      title="Copy full API Key"
                    >
                      {copiedField === 'api-key' ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedField === 'api-key' ? 'Copied' : (copyingKey ? 'Fetching...' : 'Copy')}</span>
                    </button>
                  </div>
                </div>

                <div className="dev-cred-row">
                  <div className="dev-cred-info">
                    <span className="dev-cred-name">Base API URL</span>
                    <span className="dev-cred-desc">Production Edge endpoint</span>
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
                      <span>{copiedField === 'base-url' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Unified Overview & Usage Metrics Bar (Consolidated 4-Metric Strip) */}
              <div className="dev-unified-stats-bar in-card">
                {/* Tile 1: Subscription */}
                <div className="dev-stat-tile">
                  <div className="dev-stat-tile-head">
                    <span className="dev-stat-tile-label">Subscription</span>
                    <CreditCard size={15} className="dev-stat-tile-icon" />
                  </div>
                  <div className="dev-stat-tile-value">
                    {apiKey?.subscription_plan === 'pro' || apiKey?.orders_enabled
                      ? 'Pro Scale'
                      : 'Growth Partner'}
                  </div>
                  <div className="dev-stat-tile-meta">
                    <strong>{apiKey?.subscription_plan === 'pro' || apiKey?.orders_enabled ? '₹499/mo' : '₹299/mo'}</strong> • {isSubscriptionExpired ? 'Expired' : `Renews ${formattedValidUntil}`}
                  </div>
                </div>

                {/* Tile 2: Monthly Quota */}
                <div className="dev-stat-tile">
                  <div className="dev-stat-tile-head">
                    <span className="dev-stat-tile-label">Monthly Quota</span>
                    <Activity size={15} className="dev-stat-tile-icon" />
                  </div>
                  <div className="dev-stat-tile-value">
                    {currentMonthUsed.toLocaleString()} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>/ {monthlyQuota.toLocaleString()} req</span>
                  </div>
                  <div className="dev-progress-bar-wrap" style={{ margin: '2px 0' }}>
                    <div
                      className={`dev-progress-bar ${!apiKey?.is_active ? 'disabled' : usagePercent > 85 ? 'danger' : usagePercent > 60 ? 'warning' : 'good'}`}
                      style={{
                        transform: `scaleX(${usagePercent / 100})`,
                        background: !apiKey?.is_active ? '#cbd5e1' : undefined,
                      }}
                    />
                  </div>
                  <div className="dev-stat-tile-meta">
                    {!apiKey?.is_active ? 'Paused' : `${remainingQuota.toLocaleString()} remaining • Resets in ${daysInMonthLeft}d`}
                  </div>
                </div>

                {/* Tile 3: Rate Limit */}
                <div className="dev-stat-tile">
                  <div className="dev-stat-tile-head">
                    <span className="dev-stat-tile-label">Rate Limit</span>
                    <Zap size={15} className="dev-stat-tile-icon" />
                  </div>
                  <div className="dev-stat-tile-value">
                    {!apiKey?.is_active ? 0 : (apiKey?.rate_limit_rps || 1)}{' '}
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>
                      {!apiKey?.is_active ? 'req/s (Blocked)' : 'req / sec'}
                    </span>
                  </div>
                  <div className="dev-stat-tile-meta">
                    {!apiKey?.is_active
                      ? 'Requests return 403 Forbidden'
                      : `Burst allowance: ${Math.max(5, (apiKey?.rate_limit_rps || 1) * 3)} concurrent`}
                  </div>
                </div>

                {/* Tile 4: Capabilities */}
                <div className="dev-stat-tile">
                  <div className="dev-stat-tile-head">
                    <span className="dev-stat-tile-label">Order Routing</span>
                    <ShieldCheck size={15} className="dev-stat-tile-icon" />
                  </div>
                  <div className="dev-stat-tile-value">
                    {apiKey?.orders_enabled && apiKey?.is_active
                      ? 'Automated'
                      : !apiKey?.is_active
                        ? 'Suspended'
                        : 'Manual Only'}
                  </div>
                  <div className="dev-stat-tile-meta">
                    {apiKey?.orders_enabled && apiKey?.is_active
                      ? 'POST /orders active (Pro)'
                      : 'Upgrade to Pro for automated orders'}
                  </div>
                </div>
              </div>

              {/* Section 3: API Permissions & Endpoint Access */}
              <div className="dev-card-subhead">
                <Shield size={15} style={{ color: apiKey?.is_active ? '#64748b' : '#ef4444' }} />
                <span className="dev-card-subhead-title">API Permissions &amp; Endpoint Access</span>
              </div>
              <div className="dev-permissions-grid in-card">
                <div className="dev-permission-item">
                  <div className="dev-permission-head">
                    <span className="dev-permission-title">Wholesale Catalog</span>
                    <span className={`dev-permission-status ${apiKey?.is_active ? 'active' : 'suspended'}`}>
                      <span className="dev-permission-dot" />
                      {apiKey?.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div className="dev-permission-foot">
                    <span className="dev-permission-endpoint">GET /catalog, /products/:sku</span>
                    {!apiKey?.is_active && <span className="dev-permission-note" style={{ color: '#dc2626' }}>403 Blocked</span>}
                  </div>
                </div>

                <div className="dev-permission-item">
                  <div className="dev-permission-head">
                    <span className="dev-permission-title">Live Stock Status</span>
                    <span className={`dev-permission-status ${apiKey?.is_active ? 'active' : 'suspended'}`}>
                      <span className="dev-permission-dot" />
                      {apiKey?.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div className="dev-permission-foot">
                    <span className="dev-permission-endpoint">GET /stock-status</span>
                    {!apiKey?.is_active && <span className="dev-permission-note" style={{ color: '#dc2626' }}>403 Blocked</span>}
                  </div>
                </div>

                <div className="dev-permission-item">
                  <div className="dev-permission-head">
                    <span className="dev-permission-title">Order Placement</span>
                    {isAdminMode ? (
                      <button
                        type="button"
                        onClick={() => handleAdminToggleOrdersChange(!apiKey?.orders_enabled)}
                        disabled={!apiKey?.is_active}
                        className={`dev-permission-toggle-btn ${(apiKey?.orders_enabled && apiKey?.is_active) ? 'active' : !apiKey?.is_active ? 'suspended' : 'disabled'}`}
                        title={!apiKey?.is_active ? 'Cannot enable Order API: API key is suspended' : 'Toggle Order API Access'}
                      >
                        <span className="dev-permission-dot" />
                        {(apiKey?.orders_enabled && apiKey?.is_active) ? 'Enabled' : (!apiKey?.is_active ? 'Suspended' : 'Disabled')}
                      </button>
                    ) : (
                      <span className={`dev-permission-status ${(apiKey?.orders_enabled && apiKey?.is_active) ? 'active' : !apiKey?.is_active ? 'suspended' : 'disabled'}`}>
                        <span className="dev-permission-dot" />
                        {(apiKey?.orders_enabled && apiKey?.is_active) ? 'Active' : (!apiKey?.is_active ? 'Suspended' : 'Disabled')}
                      </span>
                    )}
                  </div>
                  <div className="dev-permission-foot">
                    <span className="dev-permission-endpoint">POST /orders</span>
                    {!apiKey?.is_active ? (
                      <span className="dev-permission-note" style={{ color: '#dc2626' }}>API suspended</span>
                    ) : !apiKey?.orders_enabled && !isAdminMode ? (
                      <span className="dev-permission-note" style={{ color: '#b45309', fontWeight: '600' }}>Requires Pro Plan (₹499)</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

  {/* TAB 2: Dispatch Label */}
  {activeDevTab === 'dispatch' && (
    <DispatchLabelCard
      user={user}
      buyerProfile={buyerProfile}
      onProfileUpdate={onProfileUpdate || setBuyerProfile}
      isAdminMode={isAdminMode}
    />
  )}

  {/* TAB 3: Curated Catalog Selection & Storefront Sync */}
  {activeDevTab === 'catalog' && (
    <div className={`dev-card dev-curator-card ${isCuratorGridOpen ? 'open' : ''}`} id="catalog-curator">
        <div
          className="dev-card-head"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderBottom: isCuratorGridOpen ? '1px solid #f1f5f9' : 'none',
          }}
        >
          <div className="dev-card-title">
            <ShoppingBag size={16} style={{ color: '#64748b' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
                  Curated Catalog Sync
                </h3>
                <span className={`dev-quiet-status-tag ${selectedSkus.length > 0 ? 'active' : 'inactive'}`}>
                  <span className="dev-quiet-dot" />
                  {selectedSkus.length > 0
                    ? `${selectedSkus.length} ${selectedSkus.length === 1 ? 'product' : 'products'} selected`
                    : 'No products selected'}
                </span>
              </div>
              <p className="dev-card-subtitle" style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Select the specific products you want to sync with your Shopify or WooCommerce storefront.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="dev-action-chip"
            style={{
              height: '30px',
              fontSize: '0.75rem',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              background: isCuratorGridOpen ? '#f1f5f9' : '#ffffff',
            }}
            onClick={() => {
              if (!isCuratorGridOpen) {
                handleOpenCuratorGrid();
              } else {
                setIsCuratorGridOpen(false);
              }
            }}
          >
            {isCuratorGridOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{isCuratorGridOpen ? 'Close Grid' : (selectedSkus.length > 0 ? 'Edit Selection' : 'Pick Products')}</span>
          </button>
        </div>

        {isCuratorGridOpen && (
          <div className="dev-curator-body">
            {/* Filter Bar */}
            <div className="dev-curator-toolbar">
              <div className="dev-curator-search-box">
                <Search size={15} className="dev-search-icon" />
                <input
                  type="text"
                  placeholder="Search by title, SKU, category, fabric..."
                  value={curatorSearch}
                  onChange={(e) => setCuratorSearch(e.target.value)}
                  className="dev-curator-search-input"
                />
                {curatorSearch && (
                  <button type="button" onClick={() => setCuratorSearch('')} className="dev-clear-search" aria-label="Clear search">
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="dev-curator-actions">
                <label className="dev-stock-filter-toggle">
                  <input
                    type="checkbox"
                    checked={curatorStockOnly}
                    onChange={(e) => setCuratorStockOnly(e.target.checked)}
                  />
                  <span>Ready Stock Only</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="dev-action-chip"
                >
                  Select Visible
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllFiltered}
                  className="dev-action-chip"
                >
                  Deselect Visible
                </button>
                {selectedSkus.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSelections}
                    className="dev-action-chip danger"
                  >
                    Clear All ({selectedSkus.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCuratorGridOpen(false)}
                  className="dev-action-chip"
                  title="Close product grid"
                >
                  <ChevronUp size={13} />
                  <span>Close List</span>
                </button>
              </div>
            </div>

            {/* Category Chips */}
            <div className="dev-curator-cats">
              <button
                type="button"
                className={`dev-cat-chip ${curatorCategory === 'all' ? 'active' : ''}`}
                onClick={() => setCuratorCategory('all')}
              >
                All
              </button>
              {categoriesList.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`dev-cat-chip ${curatorCategory === cat ? 'active' : ''}`}
                  onClick={() => setCuratorCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            {loadingProducts ? (
              <div className="dev-curator-loading">
                <RefreshCw size={22} className="spin-icon" />
                <p>Loading catalog...</p>
              </div>
            ) : filteredCuratorProducts.length === 0 ? (
              <div className="dev-curator-empty">
                <p>No products found matching your filters.</p>
                <button
                  type="button"
                  onClick={() => { setCuratorSearch(''); setCuratorCategory('all'); setCuratorStockOnly(false); }}
                  className="dev-secondary-btn"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="dev-curator-grid">
                {filteredCuratorProducts.map(p => {
                  const sku = String(p.id || p.groupKey);
                  const isSelected = selectedSkus.includes(sku);
                  const isOutOfStock = p.isOutOfStock || p.stockStatusOverride === 'out-of-stock';
                  const firstPrices = p.variants?.[0]?.prices || {};
                  // Strictly B2R Reseller Price
                  const price = Number(firstPrices.b2r || p.resellerPrice || (firstPrices.single ? firstPrices.single : 0));
                  const image = p.images?.[0] || p.image || '/images/placeholder.webp';

                  return (
                    <div
                      key={sku}
                      className={`dev-curator-card-item ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => toggleSelectSku(sku)}
                    >
                      <div className="dev-item-checkbox-wrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => { }} // handled by parent onClick
                          className="dev-item-checkbox"
                        />
                      </div>
                      <div className="dev-item-thumb-wrap">
                        <img src={image} alt={p.title || p.name} className="dev-item-thumb" loading="lazy" />
                        <span className={`dev-item-stock-tag ${isOutOfStock ? 'oos' : 'ready'}`}>
                          {isOutOfStock ? 'OOS' : 'Ready'}
                        </span>
                      </div>
                      <div className="dev-item-info">
                        <div className="dev-item-sku-row">
                          <span className="dev-item-sku">SKU: {sku}</span>
                          <span className="dev-item-price">₹{price.toLocaleString('en-IN')}</span>
                        </div>
                        <h4 className="dev-item-title" title={p.title || p.name}>
                          {p.title || p.name}
                        </h4>
                        <div className="dev-item-meta">
                          <span>{p.category || 'Product'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sticky Save Bar (Shown when product grid is open) */}
        {isCuratorGridOpen && (
          <div className="dev-curator-save-bar">
            <div className="dev-save-bar-info">
              <span><strong>{selectedSkus.length}</strong> {selectedSkus.length === 1 ? 'product' : 'products'} selected for sync</span>
              {selectionSuccessMsg && (
                <span className="dev-save-success-tag">
                  <Check size={13} /> {selectionSuccessMsg}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCuratorGridOpen(false)}
                className="dev-curate-btn"
                style={{ height: '38px' }}
              >
                <ChevronUp size={14} />
                <span>Close List</span>
              </button>
              <button
                type="button"
                onClick={handleSaveCatalogSelection}
                disabled={savingSelection}
                className="dev-btn dev-btn-primary dev-save-selection-btn"
              >
                {savingSelection ? <RefreshCw size={14} className="spin-icon" /> : <Check size={14} />}
                <span>{savingSelection ? 'Saving...' : 'Save Selection'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )}

    {/* TAB 4: Platform Integration Guides (Shopify, WooCommerce, PrestaShop, cURL) - Reseller User Mode Only */}
    {activeDevTab === 'guides' && !isAdminMode && (
      <div className="dev-guides-surface">
          <div className="dev-card-head dev-guides-head">
            <div className="dev-card-title">
              <Code2 size={16} />
              <h3>Platform Integration Guides &amp; Ready-Made Scripts</h3>
            </div>
            <a
              href="/developer-api"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-card-docs-link"
              title="Read complete REST API documentation and payload schemas"
            >
              <ExternalLink size={12} /> Full API Reference
            </a>
          </div>

          <div className="dev-platform-tabs" role="tablist" aria-label="Platform Integration Guides">
            <button
              type="button"
              role="tab"
              id="plat-tab-woocommerce"
              aria-controls="plat-panel-woocommerce"
              aria-selected={activePlatformTab === 'woocommerce'}
              className={`dev-plat-tab ${activePlatformTab === 'woocommerce' ? 'active' : ''}`}
              onClick={() => setActivePlatformTab('woocommerce')}
            >
              WooCommerce (WordPress)
            </button>
            <button
              type="button"
              role="tab"
              id="plat-tab-shopify"
              aria-controls="plat-panel-shopify"
              aria-selected={activePlatformTab === 'shopify'}
              className={`dev-plat-tab ${activePlatformTab === 'shopify' ? 'active' : ''}`}
              onClick={() => setActivePlatformTab('shopify')}
            >
              Shopify
            </button>
            <button
              type="button"
              role="tab"
              id="plat-tab-prestashop"
              aria-controls="plat-panel-prestashop"
              aria-selected={activePlatformTab === 'prestashop'}
              className={`dev-plat-tab ${activePlatformTab === 'prestashop' ? 'active' : ''}`}
              onClick={() => setActivePlatformTab('prestashop')}
            >
              PrestaShop
            </button>
            <button
              type="button"
              role="tab"
              id="plat-tab-curl"
              aria-controls="plat-panel-curl"
              aria-selected={activePlatformTab === 'curl'}
              className={`dev-plat-tab ${activePlatformTab === 'curl' ? 'active' : ''}`}
              onClick={() => setActivePlatformTab('curl')}
            >
              cURL / Terminal
            </button>
            <button
              type="button"
              role="tab"
              id="plat-tab-javascript"
              aria-controls="plat-panel-javascript"
              aria-selected={activePlatformTab === 'javascript'}
              className={`dev-plat-tab ${activePlatformTab === 'javascript' ? 'active' : ''}`}
              onClick={() => setActivePlatformTab('javascript')}
            >
              JavaScript / Node.js
            </button>
          </div>

          <div
            className="dev-platform-content"
            role="tabpanel"
            id={`plat-panel-${activePlatformTab}`}
            aria-labelledby={`plat-tab-${activePlatformTab}`}
            tabIndex={0}
          >
            {activePlatformTab === 'woocommerce' && (
              <div>
                {/* 1. Official Plugin Header & Download */}
                <div className="dev-plat-intro" style={{ marginBottom: '1.25rem' }}>
                  <div className="dev-guide-section-title-wrap" style={{ marginBottom: '0.5rem' }}>
                    <div>
                      <span className="dev-endpoint-tag" style={{ display: 'block', marginBottom: '0.25rem' }}>
                        WordPress · WooCommerce Plugin
                      </span>
                      <h4 className="dev-plat-title" style={{ margin: 0, fontSize: '1.125rem' }}>
                        Weave365 Live Stock Sync
                      </h4>
                    </div>

                    <a
                      href="/downloads/weave365-woocommerce-sync.zip"
                      download="weave365-woocommerce-sync.zip"
                      className="dev-endpoint-copy-btn"
                      style={{
                        height: '2rem',
                        padding: '0 0.875rem',
                        background: '#0f172a',
                        color: '#ffffff',
                        borderColor: '#0f172a',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Download size={13} />
                      <span>Download Plugin (.zip)</span>
                    </a>
                  </div>

                  <p style={{ margin: '0 0 0.5rem 0', maxWidth: '720px' }}>
                    Automated hourly stock and inventory synchronization directly from Varanasi artisan looms. Supports parent &amp; variant SKUs, prevents false restocks, includes transient concurrency locking, and runs hourly via WordPress WP-Cron.
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.75rem',
                    color: 'var(--admin-text-muted, #64748b)',
                    flexWrap: 'wrap'
                  }}>
                    <span>v1.0.0</span>
                    <span>&bull;</span>
                    <span>Requires WooCommerce 5.0+</span>
                    <span>&bull;</span>
                    <span>PHP 7.4+</span>
                    <span>&bull;</span>
                    <span>WordPress 5.6+</span>
                  </div>
                </div>

                {/* 2. Step-by-Step Setup */}
                <section className="dev-guide-section" style={{ borderTop: 'none', paddingTop: 0 }}>
                  <div className="dev-guide-section-header">
                    <h5 className="dev-guide-section-title">
                      Quick Plugin Setup (3 Steps)
                    </h5>
                  </div>
                  <div className="dev-guide-steps">
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">1.</span>
                      <div className="dev-guide-step-body">
                        <strong>Install Plugin:</strong> In WordPress Admin, navigate to <em>Plugins &rarr; Add New Plugin &rarr; Upload Plugin</em>. Upload <code>weave365-woocommerce-sync.zip</code> and click <em>Activate Plugin</em>.
                      </div>
                    </div>
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">2.</span>
                      <div className="dev-guide-step-body">
                        <strong>Enter API Key:</strong> In your WordPress sidebar, open <em>WooCommerce &rarr; Weave365 Sync</em>, paste your Live API Key (<code>{revealedKey || apiKey?.key_prefix || 'w365_live_...'}</code>), and click <em>Save API Key</em>.
                      </div>
                    </div>
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">3.</span>
                      <div className="dev-guide-step-body">
                        <strong>Verify &amp; Sync:</strong> Click <em>Sync Stock Now</em> to verify immediate connectivity. The plugin will continue running in the background hourly via WP-Cron.
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Catalog CSV Import */}
                <section className="dev-guide-section">
                  <div className="dev-guide-section-header">
                    <div className="dev-guide-section-title-wrap">
                      <h5 className="dev-guide-section-title">
                        Initial Product Import (CSV Feed)
                      </h5>
                      <span className="dev-endpoint-tag">
                        Catalog SKU Sync
                      </span>
                    </div>
                    <p className="dev-guide-section-desc">
                      Products are matched by SKU (e.g. <code>102001</code> or <code>102001-1</code>). Use this URL to import products into WooCommerce:
                    </p>
                  </div>

                  <div className="dev-endpoint-bar">
                    <span className="dev-endpoint-tag">CSV Feed</span>
                    <input
                      type="text"
                      readOnly
                      value={`https://www.weave365.com/api/v1/catalog.csv?key=${revealedKey || apiKey?.key_prefix || 'YOUR_API_KEY'}`}
                      className="dev-endpoint-url"
                      aria-label="WooCommerce CSV Catalog Feed URL"
                    />
                    <button
                      type="button"
                      className={`dev-endpoint-copy-btn ${copiedField === 'woo-csv' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(`https://www.weave365.com/api/v1/catalog.csv?key=${revealedKey || apiKey?.key_prefix || 'YOUR_API_KEY'}`, 'woo-csv')}
                      aria-label="Copy WooCommerce CSV Feed URL"
                    >
                      {copiedField === 'woo-csv' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedField === 'woo-csv' ? 'Copied' : 'Copy CSV URL'}</span>
                    </button>
                  </div>

                  <div className="dev-guide-steps" style={{ marginTop: '0.625rem' }}>
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">&bull;</span>
                      <div className="dev-guide-step-body">
                        Open the URL above in your browser to download <code>weave365-catalog.csv</code>.
                      </div>
                    </div>
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">&bull;</span>
                      <div className="dev-guide-step-body">
                        In WordPress Admin, open <strong>Products &rarr; Import</strong>, upload the downloaded CSV, ensure <code>SKU</code>, <code>Name</code>, <code>Regular price</code>, and <code>Images</code> columns are mapped, and click <strong>Run the Importer</strong>.
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activePlatformTab === 'shopify' && (
              <div>
                <div className="dev-plat-intro">
                  <h4 className="dev-plat-title">Shopify Automated Inventory Sync</h4>
                  <p>
                    Connect using Shopify inventory apps such as <strong>Stock Sync (syncX)</strong> or <strong>Matrixify</strong>. Weave365 provides out-of-the-box auto-mapping with zero manual field matching.
                  </p>
                </div>

                {/* Section 1: Stock Sync (syncX) Feed */}
                <section className="dev-guide-section" aria-labelledby="heading-stocksync">
                  <div className="dev-guide-section-header">
                    <div className="dev-guide-section-title-wrap">
                      <h5 id="heading-stocksync" className="dev-guide-section-title">
                        Stock Sync (syncX) Feed URL
                      </h5>
                      <span className="dev-guide-pill dev-pill-recommended">
                        Recommended · Auto-maps fields
                      </span>
                    </div>
                  </div>

                  <div className="dev-endpoint-bar">
                    <span className="dev-endpoint-tag">JSON Feed</span>
                    <input
                      type="text"
                      readOnly
                      value={`https://www.weave365.com/api/v1/catalog.json?key=${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}&format=stocksync`}
                      className="dev-endpoint-url"
                      aria-label="Stock Sync feed URL"
                    />
                    <button
                      type="button"
                      className={`dev-endpoint-copy-btn ${copiedField === 'stocksync-url' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(`https://www.weave365.com/api/v1/catalog.json?key=${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}&format=stocksync`, 'stocksync-url')}
                      aria-label="Copy Stock Sync feed URL"
                    >
                      {copiedField === 'stocksync-url' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedField === 'stocksync-url' ? 'Copied' : 'Copy Feed URL'}</span>
                    </button>
                  </div>

                  <div className="dev-guide-steps">
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">1.</span>
                      <div className="dev-guide-step-body">
                        In Shopify, open <strong>Stock Sync (SyncX)</strong> <ArrowRight size={12} className="dev-inline-svg-arrow" aria-hidden="true" /> Select <strong>Add New Update / Add Products</strong>.
                      </div>
                    </div>
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">2.</span>
                      <div className="dev-guide-step-body">
                        Choose <strong>REST API / URL</strong> and paste the URL above. No custom headers or root node required!
                      </div>
                    </div>
                    <div className="dev-guide-step">
                      <span className="dev-guide-step-badge">3.</span>
                      <div className="dev-guide-step-body">
                        In <strong>Step 2 Matching Column</strong>, map the following fields
                        <ul className="dev-mapping-list">
                          <li className="dev-mapping-item">
                            <span className="dev-mapping-label">Identifier</span>
                            <ArrowRight size={12} className="dev-inline-svg-arrow" aria-hidden="true" />
                            <span className="dev-mapping-code">sku</span>
                          </li>
                          <li className="dev-mapping-item">
                            <span className="dev-mapping-label">Store fields</span>
                            <ArrowRight size={12} className="dev-inline-svg-arrow" aria-hidden="true" />
                            <span className="dev-mapping-tokens">
                              <span>Title <span className="dev-mapping-code">title</span></span>
                              <span className="dev-mapping-bullet" aria-hidden="true">&bull;</span>
                              <span>Price <span className="dev-mapping-code">price</span></span>
                              <span className="dev-mapping-bullet" aria-hidden="true">&bull;</span>
                              <span>Quantity <span className="dev-mapping-code">quantity</span></span>
                            </span>
                          </li>
                          <li className="dev-mapping-item">
                            <span className="dev-mapping-label">Images</span>
                            <ArrowRight size={12} className="dev-inline-svg-arrow" aria-hidden="true" />
                            <span className="dev-mapping-tokens">
                              <span>Gallery <span className="dev-mapping-code">images</span> <span className="dev-mapping-hint">(comma delimiter in Smart Setting)</span></span>
                              <span className="dev-mapping-bullet" aria-hidden="true">&bull;</span>
                              <span>Variant image <span className="dev-mapping-code">variant_image</span></span>
                            </span>
                          </li>
                          <li className="dev-mapping-item">
                            <span className="dev-mapping-label">Variants</span>
                            <ArrowRight size={12} className="dev-inline-svg-arrow" aria-hidden="true" />
                            <span className="dev-mapping-tokens">
                              <span>Group by <span className="dev-mapping-code">handle</span></span>
                              <span className="dev-mapping-bullet" aria-hidden="true">&bull;</span>
                              <span>Option 1 <span className="dev-mapping-code">color</span></span>
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="dev-guide-link-wrap">
                    <a
                      href="/developer-api#shopify-guide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dev-guide-link"
                    >
                      <BookOpen size={13} />
                      <span>View Complete SyncX Setup Guide (30% Price Markup, Images &amp; Variants)</span>
                      <ArrowRight size={12} className="dev-guide-link-arrow" />
                    </a>
                  </div>
                </section>

                {/* Section 2: Matrixify / Shopify Native CSV Feed */}
                <section className="dev-guide-section" aria-labelledby="heading-matrixify">
                  <div className="dev-guide-section-header">
                    <div className="dev-guide-section-title-wrap">
                      <h5 id="heading-matrixify" className="dev-guide-section-title">
                        Matrixify / Shopify Native CSV Feed URL
                      </h5>
                      <span className="dev-guide-pill dev-pill-info">
                        Standard Shopify CSV
                      </span>
                    </div>
                    <p className="dev-guide-section-desc">
                      Paste into Matrixify <strong>From URL</strong> (when prompted under <em>Select Entity</em>, select <strong>Products</strong>), or open in browser to download <code>weave365-catalog.csv</code> for direct drag-and-drop into Matrixify or Shopify Admin.
                    </p>
                  </div>

                  <div className="dev-endpoint-bar">
                    <span className="dev-endpoint-tag">CSV Feed</span>
                    <input
                      type="text"
                      readOnly
                      value={`https://www.weave365.com/api/v1/catalog.csv?key=${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}&format=matrixify`}
                      className="dev-endpoint-url"
                      aria-label="Matrixify CSV feed URL"
                    />
                    <button
                      type="button"
                      className={`dev-endpoint-copy-btn ${copiedField === 'matrixify-url' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(`https://www.weave365.com/api/v1/catalog.csv?key=${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}&format=matrixify`, 'matrixify-url')}
                      aria-label="Copy Matrixify CSV feed URL"
                    >
                      {copiedField === 'matrixify-url' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedField === 'matrixify-url' ? 'Copied' : 'Copy CSV URL'}</span>
                    </button>
                  </div>
                </section>

                {/* Section 3: Standard Shopify REST API Feed */}
                <section className="dev-guide-section" aria-labelledby="heading-shopify-rest">
                  <div className="dev-guide-section-header">
                    <div className="dev-guide-section-title-wrap">
                      <h5 id="heading-shopify-rest" className="dev-guide-section-title">
                        Standard Shopify REST API Feed (Nested Variants)
                      </h5>
                      <span className="dev-guide-pill dev-pill-neutral">
                        REST JSON
                      </span>
                    </div>
                    <p className="dev-guide-section-desc">
                      Direct REST API endpoint with nested variant structures compatible with standard Shopify store sync scripts and custom ERP integrations.
                    </p>
                  </div>

                  <div className="dev-endpoint-bar">
                    <span className="dev-endpoint-tag">REST JSON</span>
                    <input
                      type="text"
                      readOnly
                      value={`https://www.weave365.com/api/v1/catalog.json?key=${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}&format=shopify`}
                      className="dev-endpoint-url"
                      aria-label="Shopify REST API feed URL"
                    />
                    <button
                      type="button"
                      className={`dev-endpoint-copy-btn ${copiedField === 'shopify-url' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(`https://www.weave365.com/api/v1/catalog.json?key=${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}&format=shopify`, 'shopify-url')}
                      aria-label="Copy Shopify REST feed URL"
                    >
                      {copiedField === 'shopify-url' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedField === 'shopify-url' ? 'Copied' : 'Copy Feed URL'}</span>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activePlatformTab === 'prestashop' && (
              <div>
                <div className="dev-plat-intro">
                  <h4 className="dev-plat-title">PrestaShop Sync Script</h4>
                  <p>Run via PrestaShop Cron or custom module connector to synchronize warehouse quantities.</p>
                </div>
                <div className="dev-code-block-wrap">
                  <div className="dev-code-header">
                    <span className="dev-code-lang">PHP · PrestaShop 1.7 / 8.x Synchronizer</span>
                    <button
                      type="button"
                      className={`dev-code-copy-btn ${copiedField === 'prestashop-code' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(`<?php
// === Weave365 PrestaShop 1.7 / 8.x Stock Synchronizer ===
require_once dirname(__FILE__) . '/config/config.inc.php';

$apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';
$url = 'https://www.weave365.com/api/v1/stock-status';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => ["X-API-Key: $apiKey"],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$res = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 200 && $res) {
    $data = json_decode($res, true);
    if (!empty($data['stock_map']) && is_array($data['stock_map'])) {
        $count = 0;
        foreach ($data['stock_map'] as $sku => $item) {
            $is_available = !empty($item['is_available']);
            $qty = $is_available ? 5 : 0;
            
            // 1. Check standard product reference
            $id_product = (int)Db::getInstance()->getValue(
                'SELECT id_product FROM ' . _DB_PREFIX_ . 'product WHERE reference = "' . pSQL($sku) . '"'
            );
            if ($id_product > 0) {
                StockAvailable::setQuantity($id_product, 0, $qty);
                $count++;
            } else {
                // 2. Check product combinations / variant attributes
                $comb = Db::getInstance()->getRow(
                    'SELECT id_product, id_product_attribute FROM ' . _DB_PREFIX_ . 'product_attribute WHERE reference = "' . pSQL($sku) . '"'
                );
                if (!empty($comb['id_product'])) {
                    StockAvailable::setQuantity((int)$comb['id_product'], (int)$comb['id_product_attribute'], $qty);
                    $count++;
                }
            }
        }
        echo "Successfully synced stock for {$count} products from Weave365.\\n";
    }
}`, 'prestashop-code')}
                      aria-label="Copy PrestaShop PHP snippet"
                    >
                      {copiedField === 'prestashop-code' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedField === 'prestashop-code' ? 'Copied' : 'Copy PHP Snippet'}</span>
                    </button>
                  </div>
                  <pre>
                    {`<?php
// === Weave365 PrestaShop 1.7 / 8.x Stock Synchronizer ===
require_once dirname(__FILE__) . '/config/config.inc.php';

$apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_WEAVE365_API_KEY'}';
$url = 'https://www.weave365.com/api/v1/stock-status';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_HTTPHEADER => ["X-API-Key: $apiKey"],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 25,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$res = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 200 && $res) {
    $data = json_decode($res, true);
    if (!empty($data['stock_map']) && is_array($data['stock_map'])) {
        $count = 0;
        foreach ($data['stock_map'] as $sku => $item) {
            $is_available = !empty($item['is_available']);
            $qty = $is_available ? 5 : 0;
            
            // 1. Check standard product reference
            $id_product = (int)Db::getInstance()->getValue(
                'SELECT id_product FROM ' . _DB_PREFIX_ . 'product WHERE reference = "' . pSQL($sku) . '"'
            );
            if ($id_product > 0) {
                StockAvailable::setQuantity($id_product, 0, $qty);
                $count++;
            } else {
                // 2. Check product combinations / variant attributes
                $comb = Db::getInstance()->getRow(
                    'SELECT id_product, id_product_attribute FROM ' . _DB_PREFIX_ . 'product_attribute WHERE reference = "' . pSQL($sku) . '"'
                );
                if (!empty($comb['id_product'])) {
                    StockAvailable::setQuantity((int)$comb['id_product'], (int)$comb['id_product_attribute'], $qty);
                    $count++;
                }
            }
        }
        echo "Successfully synced stock for {$count} products from Weave365.\\n";
    }
}`}
                  </pre>
                </div>
              </div>
            )}

            {activePlatformTab === 'curl' && (
              <div>
                <div className="dev-plat-intro">
                  <h4 className="dev-plat-title">cURL Command Examples</h4>
                </div>
                <div className="dev-code-block-wrap">
                  <div className="dev-code-header">
                    <span className="dev-code-lang">Bash / Terminal · cURL Examples</span>
                    <button
                      type="button"
                      className={`dev-code-copy-btn ${copiedField === 'curl-code' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(`# 1. Fetch Complete Wholesale Catalog (Paginated: page=1, limit=50)
curl -X GET "https://www.weave365.com/api/v1/catalog?page=1&limit=50" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 2. Fetch Lightweight Stock Availability Map
curl -X GET "https://www.weave365.com/api/v1/stock-status" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 3. Query Specific Product by SKU
curl -X GET "https://www.weave365.com/api/v1/products/602008" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 4. Place Automated Dropship Order via API (Pro Tier)
curl -X POST "https://www.weave365.com/api/v1/orders" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reseller_order_id": "ORD-101",
    "customer": {
      "name": "Priya Sharma",
      "phone": "9876543210",
      "pincode": "560038",
      "address_line1": "Flat 402, Lotus Orchid, Indiranagar",
      "city": "Bengaluru",
      "state": "Karnataka"
    },
    "items": [
      {
        "sku": "602008",
        "color": "Green",
        "quantity": 1,
        "selling_price": 1149
      }
    ]
  }'`, 'curl-code')}
                      aria-label="Copy cURL commands"
                    >
                      {copiedField === 'curl-code' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedField === 'curl-code' ? 'Copied' : 'Copy cURL'}</span>
                    </button>
                  </div>
                  <pre>
                    {`# 1. Fetch Complete Wholesale Catalog (Paginated: page=1, limit=50)
curl -X GET "https://www.weave365.com/api/v1/catalog?page=1&limit=50" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 2. Fetch Lightweight Stock Availability Map
curl -X GET "https://www.weave365.com/api/v1/stock-status" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 3. Query Specific Product by SKU
curl -X GET "https://www.weave365.com/api/v1/products/602008" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}"

# 4. Place Automated Dropship Order via API (Pro Tier)
curl -X POST "https://www.weave365.com/api/v1/orders" \\
  -H "X-API-Key: ${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "reseller_order_id": "ORD-101",
    "customer": {
      "name": "Priya Sharma",
      "phone": "9876543210",
      "pincode": "560038",
      "address_line1": "Flat 402, Lotus Orchid, Indiranagar",
      "city": "Bengaluru",
      "state": "Karnataka"
    },
    "items": [
      {
        "sku": "602008",
        "color": "Green",
        "quantity": 1,
        "selling_price": 1149
      }
    ]
  }'`}
                  </pre>
                </div>
              </div>
            )}

            {activePlatformTab === 'javascript' && (
              <div>
                <div className="dev-plat-intro">
                  <h4 className="dev-plat-title">JavaScript / Node.js SDK Examples</h4>
                </div>
                <div className="dev-code-block-wrap">
                  <div className="dev-code-header">
                    <span className="dev-code-lang">JavaScript / Node.js SDK</span>
                    <button
                      type="button"
                      className={`dev-code-copy-btn ${copiedField === 'js-code' ? 'copied' : ''}`}
                      onClick={() => copyToClipboard(`const apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}';
const baseUrl = 'https://www.weave365.com/api/v1';

// 1. Fetch Paginated Catalog Feed
async function getCatalog(page = 1, limit = 50) {
  const res = await fetch(\`\${baseUrl}/catalog?page=\${page}&limit=\${limit}\`, {
    headers: { 'X-API-Key': apiKey },
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  const data = await res.json();
  console.log(\`Synced \${data.page_products} of \${data.total_products} products\`);
  return data.products;
}

// 2. Fetch Real-Time Stock Availability Map
async function getStockStatus() {
  const res = await fetch(\`\${baseUrl}/stock-status\`, {
    headers: { 'X-API-Key': apiKey },
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  const data = await res.json();
  console.log(\`Stock map updated for \${data.total_items} items\`);
  return data.stock_map;
}

// 3. Place Automated Dropship Order (Pro Tier)
async function createOrder(orderPayload) {
  const res = await fetch(\`\${baseUrl}/orders\`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(\`Order placement failed: \${err.message || res.statusText}\`);
  }
  const result = await res.json();
  console.log('Order created successfully:', result.order_id);
  return result;
}

// Example usage:
fetchStockStatus();`, 'js-code')}
                      aria-label="Copy JavaScript snippet"
                    >
                      {copiedField === 'js-code' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedField === 'js-code' ? 'Copied' : 'Copy JavaScript'}</span>
                    </button>
                  </div>
                  <pre>
                    {`const apiKey = '${revealedKey || apiKey?.key_prefix || 'YOUR_KEY'}';
const baseUrl = 'https://www.weave365.com/api/v1';

// 1. Fetch Paginated Catalog Feed
async function getCatalog(page = 1, limit = 50) {
  const res = await fetch(\`\${baseUrl}/catalog?page=\${page}&limit=\${limit}\`, {
    headers: { 'X-API-Key': apiKey },
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  const data = await res.json();
  console.log(\`Synced \${data.page_products} of \${data.total_products} products\`);
  return data.products;
}

// 2. Fetch Real-Time Stock Availability Map
async function getStockStatus() {
  const res = await fetch(\`\${baseUrl}/stock-status\`, {
    headers: { 'X-API-Key': apiKey },
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  const data = await res.json();
  console.log(\`Stock map updated for \${data.total_items} items\`);
  return data.stock_map;
}

// 3. Place Automated Dropship Order (Pro Tier)
async function createOrder(orderPayload) {
  const res = await fetch(\`\${baseUrl}/orders\`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(\`Order placement failed: \${err.message || res.statusText}\`);
  }
  const result = await res.json();
  console.log('Order created successfully:', result.order_id);
  return result;
}

// Example usage:
fetchStockStatus();`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* TAB 5: Interactive Live API Test Console - Reseller User Mode Only */}
      {activeDevTab === 'console' && !isAdminMode && (
        <div className="dev-card">
          <div className="dev-card-head">
            <div className="dev-card-title">
              <Play size={18} />
              <h3>Live API Test Console</h3>
              {!apiKey?.is_active && (
                <span className="dev-metric-badge-suspended">
                  <AlertTriangle size={10} /> Suspended
                </span>
              )}
            </div>
          </div>

          <div className="dev-test-console">
            {!apiKey?.is_active && (
              <div className="dev-test-console-suspended-notice">
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>Your API Key is currently suspended. Requests sent from this console or external storefronts will return <strong>HTTP 403 Forbidden</strong> until reactivated.</span>
              </div>
            )}
            <div className="dev-test-bar">
              <div className="dev-test-input-group">
                <span className="dev-http-badge">GET</span>
                <select
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="dev-endpoint-select"
                >
                  <option value="/api/v1/stock-status">/api/v1/stock-status (Real-Time Stock Map)</option>
                  <option value="/api/v1/catalog">/api/v1/catalog (B2R Reseller Catalog Feed)</option>
                  <option value="/api/v1/catalog.json?format=stocksync">/api/v1/catalog.json?format=stocksync (Stock Sync Feed)</option>
                  <option value="/api/v1/catalog?format=shopify">/api/v1/catalog?format=shopify (Shopify Feed)</option>
                  <option value="/api/v1/orders">/api/v1/orders (My API Orders & Live Tracking)</option>
                  <option value="/api/v1/me">/api/v1/me (Account & Usage Stats)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleRunApiTest}
                disabled={testLoading}
                className="dev-send-btn"
              >
                {testLoading ? <RefreshCw size={15} className="spin-icon" /> : <Play size={15} />}
                <span>{testLoading ? 'SENDING...' : 'SEND REQUEST'}</span>
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
      )}

      {/* TAB 6: Storefront & Registration Parameters */}
      {activeDevTab === 'profile' && (
        <UserActivationInfoCard
          apiKey={apiKey}
          user={user}
          buyerProfile={buyerProfile}
          isAdminMode={isAdminMode}
          copiedField={copiedField}
          copyToClipboard={copyToClipboard}
          tierInfo={tierInfo}
          defaultExpanded={true}
        />
      )}
        </main>
      </div>

      {/* Subscription Renewal / Upgrade Modal */}
      {planModalOpen && (
        <div
          className="dev-plan-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setPlanModalOpen(false)}
        >
          <div className="dev-plan-modal-content" onClick={(e) => e.stopPropagation()}>
            <PlanSelectionCard
              apiKey={apiKey}
              user={user}
              isRenewal={true}
              isExpired={isSubscriptionExpired}
              initialPlan={initialPlanFromUrl}
              initialCycle={initialCycleFromUrl}
              onClose={() => setPlanModalOpen(false)}
              onActivated={(updatedRecord) => {
                setApiKey(updatedRecord);
                setPlanModalOpen(false);
                const is90 = (updatedRecord?.subscription_amount > 500);
                setSubNotice({
                  type: 'success',
                  message: `Subscription renewed successfully! Your ${is90 ? '90-day' : '30-day'} billing cycle is active.`,
                });
                if (onAdminUpdate) onAdminUpdate(updatedRecord);
              }}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Admin Actions */}
      <ConfirmActionModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        isDanger={confirmDialog.isDanger}
        requiredInputText={confirmDialog.requiredInputText}
        clientName={confirmDialog.clientName}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
