import { createPortal } from 'react-dom';
import {
  Copy,
  ExternalLink,
} from '../../components/icons.jsx';
import { adminEmails, getProductCategorySlug } from '../../config.js';
import { supabase } from '../../supabaseClient.js';
import { parseCartVariantCode } from '../../utils/cartHelpers.js';
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
  if (!selectedUserList) return null;

  const { profile, type } = selectedUserList;
  const isCart = type === 'cart';
  const title = isCart ? 'Cart Items' : 'Favourites Collection';
  const rows = isCart
    ? (userCartMap.get(profile.id) || [])
    : (userFavoriteMap.get(profile.id) || []);

  return createPortal(
    <div className="admin-modal-overlay" onClick={() => setSelectedUserList(null)}>
      <div className="admin-review-modal admin-user-list-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div>
            <span className="admin-modal-subtitle">{title}</span>
            <h3 className="admin-modal-title">{profile.business_name || profile.full_name || 'Unnamed buyer'}</h3>
            <span className="admin-modal-header-meta">
              {profile.email} {profile.whatsapp ? ` | WhatsApp: ${profile.whatsapp}` : ''}
            </span>
          </div>
          <button type="button" onClick={() => setSelectedUserList(null)} className="admin-modal-close-btn" aria-label="Close modal">×</button>
        </div>

        {/* Modal Body */}
        <div className="admin-modal-body">
          {rows.length === 0 ? (
            <p className="admin-modal-empty">This list is currently empty.</p>
          ) : (
            rows.map((row, idx) => {
              const product = products.find(p => p.id === row.product_group_key || p.groupKey === row.product_group_key);
              const { baseVariantCode, colorName } = parseCartVariantCode(row.variant_code || row.variantCode || '');
              const variant = product?.variants?.find(v => v.code === baseVariantCode);
              const colorOptions = product?.colorOptions || [];
              const selectedColorName = colorName || variant?.color || colorOptions[0]?.name || '';
              const selectedColor = colorOptions.find((entry) => entry.name === selectedColorName);
              const itemImage = selectedColor?.image || variant?.image || product?.images?.[0] || fallbackProductImage;
              
              const itemTitle = product?.title || `Product Design Code: ${row.product_group_key}`;
              const displayCode = row.variant_code || row.variantCode || baseVariantCode || row.product_group_key;

              const categorySlug = product ? getProductCategorySlug(product.id || product.groupKey) : 'catalogue';
              const pId = row.product_group_key || product?.id || product?.groupKey;
              const productUrl = pId ? `/${categorySlug}/${encodeURIComponent(pId)}` : '#';

              return (
                <a
                  key={row.id || idx}
                  href={productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-user-item-card-link"
                  title="Click to open product page in new tab"
                >
                  <div className="admin-user-item-card">
                    <img
                      src={itemImage}
                      className="admin-user-item-thumb"
                      alt={itemTitle}
                      onError={(e) => { e.target.src = fallbackProductImage; }}
                    />
                    <div className="admin-user-item-details">
                      <div className="admin-user-item-header-row">
                        <h4 className="admin-user-item-title">{itemTitle}</h4>
                        <ExternalLink size={16} className="admin-item-ext-icon" />
                      </div>
                      <div className="admin-user-item-meta">
                        <span className="admin-item-code">Code: <code>{displayCode}</code></span>
                        {selectedColorName && (
                          <span className="admin-item-color">Color: <strong className="admin-capitalize">{selectedColorName}</strong></span>
                        )}
                        {isCart && (
                          <span className="admin-user-item-qty">Qty: <strong>x{row.quantity || 1}</strong></span>
                        )}
                      </div>
                      {variant?.prices && (
                        <div className="admin-user-item-price">
                          {variant.prices.mrp && (
                            <span className="price-tag">
                              Wholesale: <strong>{formatMoney(variant.prices.mrp)}</strong>
                            </span>
                          )}
                          {variant.prices.b2r && (
                            <span className="price-tag">
                              Reseller: <strong>{formatMoney(variant.prices.b2r)}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              );
            })
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
