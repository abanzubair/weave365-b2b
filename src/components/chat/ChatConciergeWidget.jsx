'use client';

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUp, MessageCircle, X } from '../icons.jsx';
import { WhatsappIcon } from '../WhatsappIcon.jsx';
import { storeConfig } from '../../config.js';
import { useStorefront } from '../../store/useStorefront.js';
import { useCountryCurrency } from '../../store/useCountryCurrency.js';
import { DEFAULT_BASELINE_RATES } from '../../constants/currencyRates.js';
import {
  QUICK_TAPS,
  QUICK_TAP_REPLIES,
  WHATSAPP_HANDOFF_BASE_URL,
  buildWhatsAppHandoffUrl,
} from '../../data/chatbotKnowledgeBase.js';
import { ChatMessageList } from './ChatMessageList.jsx';
import { ChatImageUpload } from './ChatImageUpload.jsx';

const SESSION_AUTO_SHOWN_KEY = 'w365_chat_auto_shown';
const SESSION_ID_KEY = 'w365_chat_session_id';
const DISMISS_UNTIL_KEY = 'w365_chat_dismissed_until';
const DISMISS_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours

const NON_PRODUCT_TWO_SEG_PREFIXES = new Set([
  'blog',
  'order-tracking',
  'partner',
  's',
  'store',
  'admin',
  'api',
  'signup',
  'login',
  'register',
  'checkout',
  'account',
  'catalogue',
  'wholesale-catalogue',
  'new-arrivals',
]);

const SUPPRESSED_ROUTE_PREFIXES = [
  '/admin',
  '/s/',
  '/signup',
  '/login',
  '/register',
  '/checkout',
];

function isSuppressedAutoOpenRoute(pathname) {
  if (!pathname) return false;
  if (pathname === '/s') return true;
  return SUPPRESSED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

function isProductDetailPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return false;
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  const match = clean.match(/^\/([^/]+)\/([^/]+)$/);
  if (!match) return false;
  const firstSegment = match[1].toLowerCase();
  return !NON_PRODUCT_TWO_SEG_PREFIXES.has(firstSegment);
}

function getOrCreateSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const nextId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `w365_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_ID_KEY, nextId);
    return nextId;
  } catch {
    return `w365_${Date.now().toString(36)}`;
  }
}

function hasSessionAutoShown() {
  try {
    return window.sessionStorage.getItem(SESSION_AUTO_SHOWN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSessionAutoShown() {
  try {
    window.sessionStorage.setItem(SESSION_AUTO_SHOWN_KEY, '1');
  } catch {
    // Ignore storage restriction errors
  }
}

function isDismissedWithinCooldown() {
  try {
    const raw = window.localStorage.getItem(DISMISS_UNTIL_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    if (Date.now() < until) return true;
    window.localStorage.removeItem(DISMISS_UNTIL_KEY);
    return false;
  } catch {
    return false;
  }
}

function markDismissedCooldown() {
  try {
    window.localStorage.setItem(DISMISS_UNTIL_KEY, String(Date.now() + DISMISS_DURATION_MS));
  } catch {
    // Ignore storage restriction errors
  }
}

function resetPopupCooldownOnReload() {
  try {
    const navEntries = window.performance?.getEntriesByType?.('navigation');
    if (Array.isArray(navEntries) && navEntries[0]?.type === 'reload') {
      window.localStorage.removeItem(DISMISS_UNTIL_KEY);
      window.sessionStorage.removeItem(SESSION_AUTO_SHOWN_KEY);
    }
  } catch {
    // Ignore storage/performance errors
  }
}

function buildStoreWhatsAppUrl(question = '', pagePath = '/', reason = '') {
  const built = buildWhatsAppHandoffUrl(question, pagePath, reason);
  const rawPhone = String(storeConfig?.whatsapp || storeConfig?.phone || '').replace(/\D/g, '');
  if (!rawPhone) return built;
  const normalizedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
  const storeBase = `https://wa.me/${normalizedPhone}`;
  if (storeBase === WHATSAPP_HANDOFF_BASE_URL) return built;
  return built.replace(WHATSAPP_HANDOFF_BASE_URL, storeBase);
}

const CHAT_WIDGET_STYLES = `
/* ── Weave 365 AI Sourcing Concierge Widget ── */
.wc-root {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  right: calc(24px + env(safe-area-inset-right, 0px));
  z-index: 9990;
  font-family: var(--font-body, 'Manrope', system-ui, sans-serif);
  color: var(--ink, #1a1a1a);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.wc-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus indicators (>= 3:1 contrast with offset). */
.wc-root :where(button, a, input):focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: 2px;
}

/* Floating Trigger Button */
.wc-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  min-width: 44px;
  min-height: 44px;
  border-radius: 50%;
  background: #e8f4f2;
  color: #128C7E;
  border: 1.5px solid rgba(18, 140, 126, 0.34);
  box-shadow:
    0 10px 26px rgba(18, 140, 126, 0.16),
    0 2px 6px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  padding: 0;
  transition: transform 150ms ease-out, background-color 150ms ease-out, box-shadow 150ms ease-out, border-color 150ms ease-out;
}

.wc-trigger:hover {
  transform: translateY(-2px);
  background: #d7eeea;
  border-color: #128C7E;
  box-shadow:
    0 14px 30px rgba(18, 140, 126, 0.22),
    0 4px 10px rgba(15, 23, 42, 0.1);
}

.wc-trigger:active {
  transform: scale(0.96);
}

/* Proactive Pill Teaser (Desktop & Mobile) */
.wc-teaser {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  max-width: min(304px, calc(100vw - 32px));
  background: #eff6ff;
  border: 1.5px solid rgba(59, 130, 246, 0.28);
  border-radius: 999px;
  padding: 6px 8px 6px 13px;
  box-shadow:
    0 12px 28px -6px rgba(37, 99, 235, 0.16),
    0 4px 10px rgba(15, 23, 42, 0.06);
  transform-origin: bottom right;
}

.wc-teaser:hover {
  background: #f8fbff;
  border-color: rgba(59, 130, 246, 0.45);
  box-shadow:
    0 16px 34px -6px rgba(37, 99, 235, 0.22),
    0 6px 14px rgba(15, 23, 42, 0.08);
}

@keyframes wc-teaser-float {
  0%, 70%, 100% {
    transform: translateY(0) scale(1);
  }
  78% {
    transform: translateY(-6px) scale(1.03);
  }
  84% {
    transform: translateY(0) scale(1);
  }
  90% {
    transform: translateY(-3px) scale(1.015);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .wc-teaser {
    animation: wc-teaser-float 4s cubic-bezier(0.22, 1, 0.36, 1) 0.5s infinite;
  }

  .wc-teaser:hover {
    animation-play-state: paused;
    transform: translateY(-2px);
  }

  .wc-teaser,
  .wc-panel {
    transition:
      opacity 180ms cubic-bezier(0.22, 1, 0.36, 1),
      transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
      width 180ms ease,
      background-color 180ms ease,
      box-shadow 180ms ease;
    @starting-style {
      opacity: 0;
      transform: translateY(6px) scale(0.98);
    }
  }
}

.wc-teaser-open-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 2px 4px 2px 0;
  background: transparent;
  border: none;
  color: #0f172a;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
}

.wc-teaser-open-btn .wc-ai-icon {
  color: #0f172a;
}

.wc-teaser-open-btn:hover {
  color: #020617;
}

.wc-teaser-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 140ms ease, color 140ms ease;
}

.wc-teaser-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

@media (min-width: 769px) {
  .wc-teaser {
    max-width: 316px;
    padding: 7px 10px 7px 15px;
    gap: 8px;
  }

  .wc-teaser-open-btn {
    font-size: 13.5px;
    min-height: 30px;
    gap: 8px;
  }
}

/* Non-modal Dialog Panel */
.wc-panel {
  width: min(304px, calc(100vw - 32px));
  max-block-size: min(560px, calc(100dvh - 104px - env(safe-area-inset-bottom, 0px)));
  background: #ffffff;
  border: none;
  border-radius: 18px;
  box-shadow:
    0 20px 48px -12px rgba(15, 23, 42, 0.16),
    0 0 0 1px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  transition: width 180ms ease;
}

.wc-panel-expanded {
  width: min(356px, calc(100vw - 28px));
}

/* Panel Header */
.wc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 13px 12px 10px 16px;
  background: #ffffff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  flex-shrink: 0;
}

.wc-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.wc-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.wc-back-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.wc-ai-icon {
  color: #0f766e;
  flex-shrink: 0;
}

.wc-desk-label {
  margin: 0;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  color: #111827;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wc-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background-color 140ms ease, color 140ms ease;
}

.wc-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Body Container */
.wc-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

/* Initial Concierge View */
.wc-home {
  padding: 8px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wc-headline {
  margin: 0;
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.3;
  text-wrap: balance;
  color: #111827;
  letter-spacing: -0.02em;
}

.wc-pdp-subcopy {
  margin: 2px 6px 4px;
  font-size: 12.5px;
  line-height: 1.4;
  color: #64748b;
}

.wc-quick-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wc-quick-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-block-size: 36px;
  padding: 8px 10px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #1f2937;
  font-family: inherit;
  font-size: 0.84375rem;
  font-weight: 500;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.wc-chat-empty {
  padding: 18px 16px 8px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #6b7280;
  text-wrap: pretty;
}

.wc-quick-btn:hover {
  background: #f4f5f7;
  color: #0f172a;
}

.wc-quick-btn:active {
  background: #eceef2;
}

.wc-quick-btn-arrow {
  color: #cbd5e1;
  flex-shrink: 0;
  transition: transform 140ms ease, color 140ms ease;
}

.wc-quick-btn:hover .wc-quick-btn-arrow {
  color: #0f172a;
  transform: translateX(2px);
}

/* Chat Thread */
.wc-chat-thread-wrap {
  padding: 14px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wc-chat-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wc-msg-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wc-msg-row-user {
  align-items: flex-end;
}

.wc-msg-row-assistant {
  align-items: flex-start;
}

.wc-msg-bubble {
  max-width: 90%;
  border-radius: 14px;
  padding: 9px 12px;
  font-size: 13.5px;
  line-height: 1.48;
  word-break: break-word;
}

.wc-msg-user {
  background: #eff6ff;
  color: #0f172a;
  border-bottom-right-radius: 4px;
}

.wc-msg-assistant {
  background: #f3f4f6;
  color: #111827;
  border: none;
  border-bottom-left-radius: 4px;
}

.wc-msg-image {
  display: block;
  width: 100%;
  max-width: 180px;
  max-height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 6px;
}

.wc-msg-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wc-msg-p {
  margin: 0;
}

.wc-msg-list {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

/* Product Match Cards */
.wc-products-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wc-product-link {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 12px;
}

.wc-product-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px 7px 7px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid rgba(17, 24, 39, 0.05);
  transition: background-color 140ms ease, border-color 140ms ease;
}

.wc-product-link:hover .wc-product-card {
  background: #f3f4f6;
  border-color: rgba(17, 24, 39, 0.12);
}

.wc-product-thumb {
  display: block;
  width: 50px;
  height: auto;
  aspect-ratio: 4 / 5;
  flex-shrink: 0;
  border-radius: 8px;
  object-fit: cover;
  background: #e5e7eb;
}

.wc-product-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.wc-product-title {
  margin: 0;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  mask-image: linear-gradient(to right, #000 84%, transparent 100%);
}

.wc-product-meta {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.71875rem;
  font-weight: 500;
  line-height: 1.3;
  color: #6b7280;
}

.wc-stock-in {
  color: #047857;
}

.wc-stock-out {
  color: #b91c1c;
}

.wc-product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 1px;
}

.wc-product-price {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
  font-variant-numeric: tabular-nums;
}

.wc-product-chevron {
  color: #9ca3af;
  flex-shrink: 0;
  transition: transform 140ms ease, color 140ms ease;
}

.wc-product-link:hover .wc-product-chevron {
  color: #111827;
  transform: translateX(2px);
}

/* WhatsApp Handoff Card inside Thread */
.wc-handoff-card {
  width: 100%;
  background: #f9fafb;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wc-handoff-copy {
  font-size: 0.78125rem;
  line-height: 1.45;
  color: #374151;
  font-weight: 500;
}

.wc-handoff-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-block-size: 36px;
  padding: 7px 12px;
  border-radius: 9px;
  background: #111827;
  color: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 140ms ease;
}

.wc-handoff-btn:hover {
  background: #1f2937;
}

/* Follow-up Chips */
.wc-followup-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wc-followup-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-block-size: 30px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}

.wc-followup-chip:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.wc-followup-chip-wa {
  border-color: #d1fae5;
  color: #065f46;
  background: #ecfdf5;
}

/* Typing Progress Indicator */
.wc-typing-row {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border-radius: 12px;
  background: #f3f4f6;
  border: none;
  align-self: flex-start;
}

.wc-typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #6b7280;
  animation: wcPulse 1s ease-in-out infinite;
}

.wc-typing-dot:nth-child(2) {
  animation-delay: 0.16s;
}

.wc-typing-dot:nth-child(3) {
  animation-delay: 0.32s;
}

.wc-typing-text {
  font-size: 12px;
  color: #475569;
  margin-left: 4px;
}

@keyframes wcPulse {
  0%, 80%, 100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

/* Inline Composer & Upload */
.wc-footer {
  border-top: none;
  background: #ffffff;
  padding: 4px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.wc-upload-feedback {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wc-upload-error {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 6px 9px;
}

.wc-upload-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e5e0d5;
}

.wc-upload-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.wc-upload-meta {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.wc-upload-name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wc-upload-size {
  font-size: 11px;
  color: #475569;
}

.wc-upload-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  border-radius: 6px;
  border: none;
  background: #f5f2eb;
  color: #334155;
  cursor: pointer;
  padding: 0;
}

.wc-upload-remove:hover {
  background: #e7e1d5;
  color: #0f172a;
}

.wc-composer-row {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f3f4f6;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 6px 6px 6px 8px;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.wc-composer-row:hover {
  background: #eceef2;
}

.wc-composer-row:focus-within,
.wc-composer-row:has(.wc-textarea:focus-visible) {
  background: #ffffff;
  border-color: #111827;
}

@media (forced-colors: active) {
  .wc-composer-row:has(.wc-textarea:focus-visible) {
    outline: 2px solid Highlight;
    outline-offset: 1px;
  }
}

.wc-textarea {
  appearance: none;
  -webkit-appearance: none;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  height: auto;
  field-sizing: content;
  min-block-size: 24px;
  max-block-size: 112px;
  border: 0 !important;
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0;
  background: transparent;
  color: #111827;
  font-family: inherit;
  font-size: 0.84375rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
  resize: none;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 3px 2px;
  margin: 0;
}

.wc-textarea::-webkit-scrollbar {
  display: none;
}

.wc-textarea::placeholder {
  color: #9ca3af;
}

.wc-attach-btn,
.wc-send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  min-height: 30px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  align-self: flex-end;
  transition: background-color 140ms ease, color 140ms ease, transform 140ms ease;
}

.wc-attach-btn {
  background: transparent;
  color: #6b7280;
}

.wc-attach-btn:hover:not(:disabled) {
  background: rgba(17, 24, 39, 0.06);
  color: #111827;
}

.wc-send-btn {
  background: #111827;
  color: #ffffff;
}

.wc-send-btn:hover:not(:disabled) {
  background: #374151;
}

.wc-send-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  opacity: 1;
  cursor: not-allowed;
}

.wc-attach-btn:disabled {
  background: transparent;
  color: #d1d5db;
  opacity: 1;
  cursor: not-allowed;
}

/* Primary AI Concierge CTA (Home) & Secondary WhatsApp Action */
.wc-ai-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-block-size: 40px;
  padding: 9px 14px;
  border-radius: 12px;
  background: #eff6ff;
  color: #0f172a;
  font-family: inherit;
  font-size: 0.84375rem;
  font-weight: 600;
  line-height: 1.3;
  border: 1.5px solid rgba(59, 130, 246, 0.28);
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.wc-ai-cta:hover {
  background: #f8fbff;
  border-color: rgba(59, 130, 246, 0.45);
}

.wc-ai-cta:active {
  transform: scale(0.99);
}

.wc-ai-cta-icon {
  color: #2563eb;
  flex-shrink: 0;
}

.wc-wa-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-block-size: 32px;
  padding: 6px 12px;
  border-radius: 10px;
  background: transparent;
  color: #475569;
  font-family: inherit;
  font-size: 0.78125rem;
  font-weight: 500;
  line-height: 1.3;
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.wc-wa-cta:hover {
  background: #f3f4f6;
  color: #111827;
}

.wc-wa-cta:active {
  transform: scale(0.99);
}

.wc-wa-cta-icon {
  color: #25D366;
  flex-shrink: 0;
}

@media (forced-colors: active) {
  .wc-ai-cta,
  .wc-wa-cta {
    border: 1px solid ButtonText;
  }
}

.wc-wa-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  min-block-size: 38px;
  padding: 8px 12px;
  border-radius: 11px;
  background: #f3f4f6;
  color: #111827;
  font-family: inherit;
  font-size: 0.84375rem;
  font-weight: 600;
  line-height: 1.3;
  text-decoration: none;
  transition: background-color 140ms ease, color 140ms ease;
}

.wc-wa-link:hover {
  background: #e5e7eb;
  color: #111827;
}

@media (pointer: coarse) {
  .wc-close-btn,
  .wc-back-btn,
  .wc-teaser-close-btn,
  .wc-upload-remove,
  .wc-attach-btn,
  .wc-send-btn {
    min-width: 40px;
    min-height: 40px;
  }

  .wc-quick-btn,
  .wc-ai-cta,
  .wc-wa-cta,
  .wc-handoff-btn {
    min-height: 44px;
  }
}

@media (max-width: 768px) {
  .wc-root {
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    right: calc(16px + env(safe-area-inset-right, 0px));
  }

  .wc-panel {
    width: min(304px, calc(100vw - 28px));
    max-block-size: min(520px, calc(100dvh - 96px - env(safe-area-inset-bottom, 0px)));
  }

  .wc-panel-expanded {
    width: min(356px, calc(100vw - 24px));
  }

  .wc-textarea {
    font-size: 16px;
  }
}
`;

export function ChatConciergeWidget() {
  const pathname = usePathname() || '/';
  const headingId = useId();
  const inputId = useId();

  const cartOpen = useStorefront((s) => s.cartOpen);
  const searchActive = useStorefront((s) => s.searchActive);
  const menuOpen = useStorefront((s) => s.menuOpen);
  const currentCountry = useCountryCurrency((s) => s.currentCountry);
  const exchangeRates = useCountryCurrency((s) => s.exchangeRates);

  const currencyContext = useMemo(() => {
    const code = String(currentCountry?.currency || 'INR').toUpperCase();
    if (code === 'INR') {
      return { currency: 'INR', exchangeRate: 1, markupPercent: 0 };
    }
    return {
      currency: code,
      exchangeRate: Number(exchangeRates?.[code] || DEFAULT_BASELINE_RATES[code] || 1),
      markupPercent: Number(currentCountry?.markupPercent || 0),
    };
  }, [currentCountry?.currency, currentCountry?.markupPercent, exchangeRates]);

  const [isOpen, setIsOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [mode, setMode] = useState('home'); // 'home' | 'chat'
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);
  const triggerButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const showTeaserRef = useRef(showTeaser);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    showTeaserRef.current = showTeaser;
  }, [showTeaser]);

  const isProductPage = useMemo(() => isProductDetailPath(pathname), [pathname]);
  const isSuppressedRoute = useMemo(() => isSuppressedAutoOpenRoute(pathname), [pathname]);
  const isOverlayOpen = Boolean(cartOpen || searchActive || menuOpen);

  const primaryWaLabel = inputText.trim().length > 0 ? 'Send on WhatsApp →' : 'Ask on WhatsApp →';
  const primaryWaUrl = useMemo(
    () => buildStoreWhatsAppUrl(inputText.trim(), pathname, inputText.trim() ? 'chat_cta' : ''),
    [inputText, pathname]
  );

  // Scroll latest chat reply into view
  useEffect(() => {
    if (mode === 'chat' && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading, mode, isOpen]);

  // Suppress teaser if cart/search/menu overlays open
  useEffect(() => {
    if (isOverlayOpen && showTeaser) {
      setShowTeaser(false);
    }
  }, [isOverlayOpen, showTeaser]);

  // Reset 3-hour cooldown & session auto-shown state on page reload / hard refresh (Ctrl+Shift+R)
  useEffect(() => {
    resetPopupCooldownOnReload();
  }, []);

  // Subtle proactive teaser trigger (Desktop & Mobile — never auto-opens the full list)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (isSuppressedRoute || isOverlayOpen) return undefined;
    if (isOpenRef.current || showTeaserRef.current) return undefined;
    if (!isProductPage && (hasSessionAutoShown() || isDismissedWithinCooldown())) return undefined;

    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
    const delayMs = isProductPage ? 16000 : (isMobileViewport ? 13000 : 9000);
    const scrollThreshold = isProductPage || isMobileViewport ? 0.5 : 0.35;

    let fired = false;
    let timerId = null;

    const triggerProactive = () => {
      if (fired) return;
      if (isOpenRef.current || showTeaserRef.current) return;
      if (!isProductPage && (hasSessionAutoShown() || isDismissedWithinCooldown())) return;

      const latestStore = useStorefront.getState();
      if (latestStore.cartOpen || latestStore.searchActive || latestStore.menuOpen) return;

      fired = true;
      if (!isProductPage) {
        markSessionAutoShown();
      }
      setShowTeaser(true);
    };

    const handleScroll = () => {
      const doc = document.documentElement;
      const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
      if (maxScroll <= 0) return;
      const ratio = window.scrollY / maxScroll;
      if (ratio >= scrollThreshold) {
        triggerProactive();
        window.removeEventListener('scroll', handleScroll);
        if (timerId) clearTimeout(timerId);
      }
    };

    timerId = setTimeout(() => {
      triggerProactive();
      window.removeEventListener('scroll', handleScroll);
    }, delayMs);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname, isProductPage, isSuppressedRoute, isOverlayOpen]);

  const handleDismiss = useCallback((returnFocus = false) => {
    if (!isProductPage) {
      markDismissedCooldown();
      markSessionAutoShown();
    }
    setIsOpen(false);
    setShowTeaser(false);
    if (returnFocus) {
      requestAnimationFrame(() => {
        triggerButtonRef.current?.focus();
      });
    }
  }, [isProductPage]);

  // Escape key closes open dialog/teaser and returns focus to trigger button
  useEffect(() => {
    if (!isOpen && !showTeaser) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        const shouldReturnFocus =
          isOpen || (containerRef.current && containerRef.current.contains(document.activeElement));
        handleDismiss(Boolean(shouldReturnFocus));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showTeaser, handleDismiss]);

  const handleOpenManual = useCallback(() => {
    markSessionAutoShown();
    setShowTeaser(false);
    setIsOpen(true);
    requestAnimationFrame(() => {
      if (composerExpanded && textareaRef.current) {
        textareaRef.current.focus();
      } else {
        closeButtonRef.current?.focus();
      }
    });
  }, [composerExpanded]);

  const handleToggleTrigger = useCallback(() => {
    if (isOpen) {
      handleDismiss(true);
    } else {
      handleOpenManual();
    }
  }, [isOpen, handleDismiss, handleOpenManual]);

  const focusComposerInput = useCallback(() => {
    setComposerExpanded(true);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, []);

  const handleQuickTap = useCallback(
    (tap) => {
      if (tap.kind === 'input') {
        setMode('chat');
        setComposerExpanded(true);
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
        return;
      }

      const scriptedReply = QUICK_TAP_REPLIES[tap.id];
      if (!scriptedReply) return;

      const userMsgId = `u_${Date.now().toString(36)}`;
      const botMsgId = `a_${Date.now().toString(36)}`;
      const waHref = buildStoreWhatsAppUrl(tap.label, pathname, 'quick_tap_followup');

      setMode('chat');
      setComposerExpanded(true);
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', text: tap.label },
        {
          id: botMsgId,
          role: 'assistant',
          text: scriptedReply,
          isScripted: true,
          followUps: [
            { id: 'ask-question', label: 'Ask a follow-up' },
            { id: 'upload-photo', label: 'Upload fabric photo' },
            { id: 'whatsapp', label: 'Ask on WhatsApp', href: waHref },
          ],
        },
      ]);
    },
    [pathname]
  );

  const handleFollowUpAction = useCallback(
    (actionId) => {
      if (actionId === 'ask-question') {
        focusComposerInput();
      } else if (actionId === 'upload-photo') {
        setComposerExpanded(true);
        requestAnimationFrame(() => {
          fileInputRef.current?.click();
        });
      }
    },
    [focusComposerInput]
  );

  const handleSendChat = useCallback(async () => {
    const trimmed = inputText.trim();
    if ((!trimmed && !attachment) || isLoading) return;

    const currentAttachment = attachment;
    const imagePreviewDataUrl = currentAttachment
      ? `data:${currentAttachment.mimeType};base64,${currentAttachment.base64}`
      : null;

    const userMessage = {
      id: `u_${Date.now().toString(36)}`,
      role: 'user',
      text: trimmed || 'Please check this saree/fabric photo in your catalogue.',
      imagePreviewUrl: imagePreviewDataUrl,
    };

    const historySnapshot = messages.slice(-6).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text,
    }));

    setMode('chat');
    setComposerExpanded(true);
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setAttachment(null);
    setUploadError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historySnapshot,
          pagePath: pathname,
          sessionId: getOrCreateSessionId(),
          currencyContext,
          image: currentAttachment
            ? { mimeType: currentAttachment.mimeType, base64: currentAttachment.base64 }
            : null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.reply) {
        const errorText =
          data?.error ||
          'Our concierge desk is busy right now. Tap below to message our Varanasi team directly on WhatsApp.';
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now().toString(36)}`,
            role: 'assistant',
            text: errorText,
            handoff: {
              show: true,
              reason: 'api_fallback',
              whatsappUrl: buildStoreWhatsAppUrl(trimmed, pathname, 'gemini_error'),
            },
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now().toString(36)}`,
          role: 'assistant',
          text: data.reply,
          products: Array.isArray(data.products) ? data.products : [],
          handoff: data.handoff || null,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now().toString(36)}`,
          role: 'assistant',
          text: 'Could not reach the concierge service right now. You can continue instantly with our Varanasi team on WhatsApp.',
          handoff: {
            show: true,
            reason: 'network_error',
            whatsappUrl: buildStoreWhatsAppUrl(trimmed, pathname, 'gemini_error'),
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, attachment, isLoading, messages, pathname, currencyContext]);

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // IME-safe check (covers both standard isComposing and Safari WebKit keyCode 229)
      if (event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229) {
        return;
      }
      void handleSendChat();
    }
  };

  const handleComposerChange = (event) => {
    setInputText(event.target.value);
    if (typeof window !== 'undefined' && !window.CSS?.supports?.('field-sizing', 'content')) {
      const el = event.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    void handleSendChat();
  };

  const canSend = Boolean((inputText.trim() || attachment) && !isLoading);

  return (
    <div className="wc-root" ref={containerRef}>
      <style dangerouslySetInnerHTML={{ __html: CHAT_WIDGET_STYLES }} />

      {isOpen && (
        <div
          className={`wc-panel${mode === 'chat' || composerExpanded ? ' wc-panel-expanded' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId}
        >
          <div className="wc-header">
            <div className="wc-header-left">
              {mode === 'chat' && (
                <button
                  type="button"
                  className="wc-back-btn"
                  onClick={() => setMode('home')}
                  aria-label="Back to quick topics"
                  title="Back to quick topics"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                </button>
              )}
              <MessageCircle size={19} className="wc-ai-icon" aria-hidden="true" />
              {mode === 'home' ? (
                <h2 id={headingId} className="wc-headline">
                  How may I help you?
                </h2>
              ) : (
                <h2 id={headingId} className="wc-desk-label">
                  Ask Weave 365
                </h2>
              )}
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              className="wc-close-btn"
              onClick={() => handleDismiss(true)}
              aria-label="Close Ask Weave 365"
              title="Close"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="wc-body">
            {mode === 'home' ? (
              <div className="wc-home">
                {isProductPage && (
                  <p className="wc-pdp-subcopy">
                    Need bulk pricing, a fabric video, or stock check for this piece?
                  </p>
                )}

                <div className="wc-quick-list">
                  {QUICK_TAPS.filter((tap) => tap.kind !== 'input').map((tap) => (
                    <button
                      key={tap.id}
                      type="button"
                      className="wc-quick-btn"
                      onClick={() => handleQuickTap(tap)}
                    >
                      <span>{tap.label}</span>
                      <ArrowRight size={14} className="wc-quick-btn-arrow" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.length === 0 && !isLoading ? (
              <div className="wc-chat-empty">
                Ask about wholesale MOQ, zero-inventory reselling, shipping, or upload a saree photo to match in stock.
              </div>
            ) : (
              <ChatMessageList
                messages={messages}
                isLoading={isLoading}
                onFollowUpAction={handleFollowUpAction}
                endRef={messagesEndRef}
              />
            )}
          </div>

          <div className="wc-footer">
            {mode === 'home' && !composerExpanded && (
              <button
                type="button"
                className="wc-ai-cta"
                onClick={() =>
                  handleQuickTap(
                    QUICK_TAPS.find((tap) => tap.kind === 'input') || {
                      id: 'ask-question',
                      label: 'Ask a Question',
                      kind: 'input',
                    }
                  )
                }
              >
                <MessageCircle size={16} className="wc-ai-cta-icon" aria-hidden="true" />
                <span>Ask a Question</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}

            {(composerExpanded || mode === 'chat') && (
              <>
                <ChatImageUpload
                  mode="preview"
                  attachment={attachment}
                  onAttach={setAttachment}
                  onRemove={() => setAttachment(null)}
                  error={uploadError}
                  onError={setUploadError}
                  disabled={isLoading}
                />
                <form className="wc-composer-row" onSubmit={handleFormSubmit}>
                  <label htmlFor={inputId} className="wc-sr-only">
                    Ask a question about wholesale pricing, reselling, or fabric
                  </label>
                  <ChatImageUpload
                    mode="button"
                    inputRef={fileInputRef}
                    attachment={attachment}
                    onAttach={(item) => {
                      setAttachment(item);
                      setMode('chat');
                      setComposerExpanded(true);
                    }}
                    onRemove={() => setAttachment(null)}
                    error={uploadError}
                    onError={setUploadError}
                    disabled={isLoading}
                  />
                  <textarea
                    id={inputId}
                    ref={textareaRef}
                    rows={1}
                    maxLength={600}
                    value={inputText}
                    onChange={handleComposerChange}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Ask anything or upload a photo…"
                    className="wc-textarea"
                  />
                  <button
                    type="submit"
                    className="wc-send-btn"
                    disabled={!canSend}
                    aria-label="Send message"
                    title="Send"
                  >
                    <ArrowUp size={15} aria-hidden="true" />
                  </button>
                </form>
              </>
            )}

            {!(mode === 'chat' && messages.some((m) => Boolean(m.handoff))) && (
              <a
                href={primaryWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={mode === 'chat' || composerExpanded ? 'wc-wa-link' : 'wc-wa-cta'}
              >
                <WhatsappIcon
                  size={16}
                  className="wc-wa-cta-icon"
                  aria-hidden="true"
                />
                <span>{primaryWaLabel}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {!isOpen && showTeaser && (
        <div className="wc-teaser" role="region" aria-label="Quick help prompt">
          <button
            type="button"
            className="wc-teaser-open-btn"
            onClick={handleOpenManual}
          >
            <MessageCircle size={16} className="wc-ai-icon" aria-hidden="true" />
            <span>
              {isProductPage
                ? 'Bulk rates or fabric check?'
                : 'Need help sourcing?'}
            </span>
          </button>
          <button
            type="button"
            className="wc-teaser-close-btn"
            onClick={() => handleDismiss(false)}
            aria-label="Dismiss message"
            title="Dismiss"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        ref={triggerButtonRef}
        type="button"
        className="wc-trigger"
        onClick={handleToggleTrigger}
        aria-label={isOpen ? 'Close Ask Weave 365' : 'Open Ask Weave 365'}
        aria-expanded={isOpen}
        title={isOpen ? 'Close' : 'Ask Weave 365'}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <WhatsappIcon size={24} aria-hidden="true" />}
      </button>
    </div>
  );
}
