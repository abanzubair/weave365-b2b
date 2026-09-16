import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  Download,
  Check,
  ExternalLink,
} from '../../components/icons.jsx';
import { adminEmails, getProductCategorySlug } from '../../config.js';
import { supabase } from '../../supabaseClient.js';
import { parseCartVariantCode, resolveItemSku, resolveItemVariant } from '../../utils/cartHelpers.js';
import { fallbackProductImage, formatMoney } from '../../storefrontShared.jsx';

export function isAdminUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return Boolean(email && adminEmails.includes(email));
}

export async function safeSelect(table, query = '*') {
  const { data, error } = await supabase.from(table).select(query).limit(500);
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

export function monthKey(dateValue) {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export function buildMonthlySeries(rows, dateField = 'created_at') {
  const buckets = new Map();
  rows.forEach((row) => {
    const key = monthKey(row[dateField]);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });
  return Array.from(buckets, ([label, value]) => ({ label, value })).slice(-8);
}

export function joinByUser(rows, userField = 'user_id') {
  return rows.reduce((map, row) => {
    const key = row[userField];
    if (!key) return map;
    const list = map.get(key) || [];
    list.push(row);
    map.set(key, list);
    return map;
  }, new Map());
}


export const getCrmDropdownClass = (statusVal) => {
  if (statusVal === 'approved-wholesale') return 'admin-crm-select approved-wholesale';
  if (statusVal === 'approved-reseller') return 'admin-crm-select approved-reseller';
  if (statusVal === 'approved-user') return 'admin-crm-select approved-user';
  if (statusVal === 'suspended') return 'admin-crm-select suspended';
  return 'admin-crm-select pending';
};

export function normalizeSeoPath(path) {
  const cleaned = String(path || '/').trim();
  if (!cleaned || cleaned === 'home') return '/';
  const pathOnly = cleaned.split('?')[0];
  const withSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  return withSlash.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function mapSeoRow(row = {}) {
  return {
    id: row.id,
    path: normalizeSeoPath(row.path),
    metaTitle: row.metaTitle || row.meta_title || '',
    metaDescription: row.metaDescription || row.meta_description || '',
    ogTitle: row.ogTitle || row.og_title || '',
    ogDescription: row.ogDescription || row.og_description || '',
    imageUrl: row.imageUrl || row.image_url || '',
    canonicalPath: row.canonicalPath || row.canonical_path || '',
    robotsIndex: row.robotsIndex ?? row.robots_index ?? true,
    robotsFollow: row.robotsFollow ?? row.robots_follow ?? true,
    updatedAt: row.updatedAt || row.updated_at,
  };
}

export function MiniBarChart({ data }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="admin-bar-chart" aria-label="Growth chart">
      {data.map((item) => (
        <div key={item.label}>
          <span style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, hint, colorClass = '' }) {
  return (
    <article className={`admin-metric-card ${colorClass}`}>
      <div className="metric-icon-container">
        <Icon size={20} />
      </div>
      <div className="metric-info">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}

export function UserListModal({ selectedUserList, setSelectedUserList, userCartMap, userFavoriteMap, products }) {
  const [copied, setCopied] = useState(false);

  if (!selectedUserList) return null;

  const { profile, type } = selectedUserList;
  const isCart = type === 'cart';
  const title = isCart ? 'Cart Items' : 'Favourites Collection';
  const rows = isCart
    ? (userCartMap.get(profile.id) || [])
    : (userFavoriteMap.get(profile.id) || []);

  const getResolvedItems = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.weave365.com';
    return rows.map((row, idx) => {
      const product = products.find(p => p.id === row.product_group_key || p.groupKey === row.product_group_key);
      const { baseVariantCode, colorName } = parseCartVariantCode(row.variant_code || row.variantCode || '');
      const variant = resolveItemVariant(product, row.variant_code || row.variantCode || '', colorName);
      const colorOptions = product?.colorOptions || [];
      const selectedColorName = colorName || variant?.color || colorOptions[0]?.name || '';

      const categorySlug = product ? getProductCategorySlug(product.id || product.groupKey, product?.category) : 'catalogue';
      const pId = row.product_group_key || product?.id || product?.groupKey;
      const queryParams = [];
      if (selectedColorName) {
        queryParams.push(`color=${encodeURIComponent(selectedColorName)}`);
      }
      if (variant?.code && variant.code !== pId) {
        queryParams.push(`variant=${encodeURIComponent(variant.code)}`);
      }
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const productUrl = pId ? `${origin}/${categorySlug}/${encodeURIComponent(pId)}${queryString}` : '';
      const displayCode = resolveItemSku(product, row.variant_code || row.variantCode, row.product_group_key, selectedColorName);
      const vendorCode = product?.vendorCode || product?.raw?.VID || product?.raw?.vid || '';
      const vendorName = product?.partner || product?.raw?.Partner || product?.raw?.partner || '';
      const qty = row.quantity || 1;

      return {
        index: idx + 1,
        title: itemTitle,
        code: displayCode,
        color: selectedColorName,
        quantity: qty,
        vendorCode,
        vendorName,
        url: productUrl,
      };
    });
  };

  const generateVendorText = () => {
    const items = getResolvedItems();

    const header = `📦 VENDOR STOCK AVAILABILITY INQUIRY\n` +
      `Total Items: ${items.length}\n` +
      `----------------------------------------\n\n`;

    const itemBlocks = items.map((item) => {
      let block = `${item.index}. ${item.title}\n`;
      block += `   • Code: ${item.code}\n`;
      if (item.color) {
        block += `   • Color: ${item.color}\n`;
      }
      if (isCart) {
        block += `   • Quantity: ${item.quantity} pc${item.quantity > 1 ? 's' : ''}\n`;
      }
      if (item.vendorCode || item.vendorName) {
        block += `   • Loom / Vendor: ${[item.vendorCode, item.vendorName].filter(Boolean).join(' - ')}\n`;
      }
      if (item.url) {
        block += `   • Product URL: ${item.url}\n`;
      }
      return block;
    });

    const footer = `\n----------------------------------------\nPlease confirm stock availability and dispatch readiness.`;
    return header + itemBlocks.join('\n') + footer;
  };

  const generateVendorCSV = () => {
    const items = getResolvedItems();
    const headers = ['Item #', 'Design Code', 'Product Title', 'Color', 'Quantity', 'Vendor Code', 'Vendor Name', 'Product URL'];
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rowsCsv = items.map((item) => [
      escapeCsv(item.index),
      escapeCsv(item.code),
      escapeCsv(item.title),
      escapeCsv(item.color),
      escapeCsv(item.quantity),
      escapeCsv(item.vendorCode),
      escapeCsv(item.vendorName),
      escapeCsv(item.url),
    ].join(','));

    return [headers.map(escapeCsv).join(','), ...rowsCsv].join('\r\n');
  };

  const handleCopy = () => {
    const text = generateVendorText();
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (format = 'txt') => {
    const dateStr = new Date().toISOString().slice(0, 10);

    let content, mime, ext;
    if (format === 'csv') {
      content = generateVendorCSV();
      mime = 'text/csv;charset=utf-8';
      ext = 'csv';
    } else {
      content = generateVendorText();
      mime = 'text/plain;charset=utf-8';
      ext = 'txt';
    }

    const filename = `vendor-stock-inquiry-${dateStr}.${ext}`;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return createPortal(
    <div className="admin-modal-overlay" onClick={() => setSelectedUserList(null)}>
      <div className="admin-review-modal admin-user-list-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-header-info">
            <h3 className="admin-modal-title">{profile.business_name || profile.full_name || 'Unnamed buyer'}</h3>
            <div className="admin-modal-header-meta">
              <span>{title}</span>
              <span className="admin-meta-dot">·</span>
              <span>{profile.email}</span>
              {profile.whatsapp && (
                <>
                  <span className="admin-meta-dot">·</span>
                  <span>WhatsApp: {profile.whatsapp}</span>
                </>
              )}
            </div>
          </div>
          <button type="button" onClick={() => setSelectedUserList(null)} className="admin-modal-close-btn" aria-label="Close modal">×</button>
        </div>

        {/* Vendor Stock Inquiry Toolbar */}
        {rows.length > 0 && (
          <div className="admin-user-list-toolbar">
            <span className="admin-user-list-count">{rows.length} {rows.length === 1 ? 'item' : 'items'}</span>
            <div className="admin-user-list-toolbar-actions">
              <button
                type="button"
                className={`admin-user-list-btn copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy item list with product URLs (no customer info, no prices) to clipboard for WhatsApp/email"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="admin-user-list-btn download-btn"
                onClick={() => handleDownload('txt')}
                title="Download formatted text file with URLs and item specs"
              >
                <Download size={13} />
                <span>.txt</span>
              </button>
              <button
                type="button"
                className="admin-user-list-btn csv-btn"
                onClick={() => handleDownload('csv')}
                title="Download CSV spreadsheet with product URLs (no prices, no customer info)"
              >
                <Download size={13} />
                <span>.csv</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="admin-modal-body">
          {rows.length === 0 ? (
            <p className="admin-modal-empty">This list is currently empty.</p>
          ) : (
            <div className="admin-user-items-list">
              {rows.map((row, idx) => {
                const product = products.find(p => p.id === row.product_group_key || p.groupKey === row.product_group_key);
                const { baseVariantCode, colorName } = parseCartVariantCode(row.variant_code || row.variantCode || '');
                const variant = resolveItemVariant(product, row.variant_code || row.variantCode || '', colorName);
                const colorOptions = product?.colorOptions || [];
                const selectedColorName = colorName || variant?.color || colorOptions[0]?.name || '';
                const selectedColor = colorOptions.find((entry) => entry.name === selectedColorName);
                const itemImage = selectedColor?.image || variant?.image || product?.images?.[0] || fallbackProductImage;

                const itemTitle = product?.title || `Product Design Code: ${row.product_group_key}`;
                const displayCode = resolveItemSku(product, row.variant_code || row.variantCode, row.product_group_key, selectedColorName);

                const categorySlug = product ? getProductCategorySlug(product.id || product.groupKey, product?.category) : 'catalogue';
                const pId = row.product_group_key || product?.id || product?.groupKey;
                const queryParams = [];
                if (selectedColorName) {
                  queryParams.push(`color=${encodeURIComponent(selectedColorName)}`);
                }
                if (variant?.code && variant.code !== pId) {
                  queryParams.push(`variant=${encodeURIComponent(variant.code)}`);
                }
                const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
                const productUrl = pId ? `/${categorySlug}/${encodeURIComponent(pId)}${queryString}` : '#';

                return (
                  <a
                    key={row.id || idx}
                    href={productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-user-item-row"
                    title="Open product page in new tab"
                  >
                    <img
                      src={itemImage}
                      className="admin-user-item-thumb"
                      alt={itemTitle}
                      onError={(e) => { e.target.src = fallbackProductImage; }}
                    />
                    <div className="admin-user-item-info">
                      <div className="admin-user-item-title-wrap">
                        <span className="admin-user-item-title">{itemTitle}</span>
                        <ExternalLink size={13} className="admin-item-ext-icon" />
                      </div>
                      <div className="admin-user-item-meta">
                        <span className="admin-meta-code">{displayCode}</span>
                        {selectedColorName && <span className="admin-meta-dot">·</span>}
                        {selectedColorName && <span className="admin-meta-color">{selectedColorName}</span>}
                        {isCart && <span className="admin-meta-dot">·</span>}
                        {isCart && <span className="admin-meta-qty">Qty {row.quantity || 1}</span>}
                      </div>
                    </div>
                    {variant?.prices && (
                      <div className="admin-user-item-pricing">
                        {variant.prices.mrp && (
                          <div className="admin-pricing-row">
                            <span className="admin-pricing-label">Wholesale</span>
                            <span className="admin-pricing-val">{formatMoney(variant.prices.mrp)}</span>
                          </div>
                        )}
                        {variant.prices.b2r && (
                          <div className="admin-pricing-row">
                            <span className="admin-pricing-label">Reseller</span>
                            <span className="admin-pricing-val">{formatMoney(variant.prices.b2r)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function LightboxOverlay({ lightboxImage, setLightboxImage }) {
  if (!lightboxImage) return null;

  return createPortal(
    <div
      onClick={() => setLightboxImage(null)}
      className="admin-lightbox-overlay"
    >
      <div className="admin-lightbox-container" onClick={(e) => e.stopPropagation()}>
        <div className="admin-lightbox-header">
          <span className="admin-lightbox-title">Document Verification Zoom View</span>
          <button
            type="button"
            className="admin-lightbox-close-btn"
            onClick={() => setLightboxImage(null)}
          >
            ×
          </button>
        </div>
        <div className="admin-lightbox-body">
          <img
            src={lightboxImage}
            className="admin-lightbox-img"
            alt="Detailed Verification Document"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
