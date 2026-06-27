import { createPortal } from 'react-dom';
import {
  BarChart3,
  Bookmark,
  ClipboardList,
  Heart,
  LineChart,
  ShoppingBag,
  Users,
  MessageSquareText,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { adminEmails, getProductCategorySlug } from '../../config.js';
import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
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

export const handleViewAgreement = (agreement, whatsapp) => {
  if (!agreement) return;

  if (agreement.document_url && agreement.document_url.startsWith('http') && !agreement.document_url.toUpperCase().includes('EMPTY')) {
    window.open(agreement.document_url, '_blank');
    return;
  }

  const agreementId = `WM-AG-${agreement.id ? agreement.id.slice(0, 8) : Date.now()}`;
  const vendorName = agreement.vendor_signed_name || 'Authorized Signatory';
  const date = agreement.signed_date || new Date().toLocaleDateString('en-IN');
  const cleanPhone = String(whatsapp || '').replace(/\D/g, '').slice(-10);

  const docHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Weave365 B2B Merchant Agreement - Signed Copy</title>
<style>
  body {
    background-color: #faf8f5;
    color: #1a1715;
    font-family: 'Georgia', 'Times New Roman', serif;
    line-height: 1.6;
    padding: 40px;
  }
  .agreement-container {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    border: 2px solid #b78646;
    padding: 60px 50px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.03);
    position: relative;
  }
  .agreement-header {
    text-align: center;
    margin-bottom: 40px;
    border-bottom: 2px double #b78646;
    padding-bottom: 20px;
  }
  .logo-text {
    font-size: 32px;
    font-weight: bold;
    color: #b78646;
    letter-spacing: 2px;
    margin: 0 0 10px 0;
    text-transform: uppercase;
  }
  .doc-title {
    font-size: 20px;
    letter-spacing: 1px;
    color: #1a1715;
    margin: 0;
    text-transform: uppercase;
    font-family: sans-serif;
    font-weight: 600;
  }
  .meta-box {
    background: #fdfbf7;
    border: 1px solid rgba(183, 134, 70, 0.2);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 30px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    font-size: 13px;
    font-family: sans-serif;
  }
  .meta-item strong {
    color: #b78646;
  }
  .clause-section {
    margin-bottom: 30px;
  }
  .clause-title {
    font-size: 16px;
    font-weight: bold;
    color: #b78646;
    border-bottom: 1px solid rgba(183, 134, 70, 0.15);
    padding-bottom: 5px;
    margin-bottom: 15px;
    text-transform: uppercase;
    font-family: sans-serif;
  }
  .clause-item {
    margin-bottom: 15px;
    font-size: 14px;
  }
  .clause-item-head {
    font-weight: bold;
    color: #1a1715;
  }
  .signature-section {
    margin-top: 50px;
    border-top: 1px solid #b78646;
    padding-top: 30px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  .sig-block {
    text-align: center;
  }
  .sig-line {
    border-bottom: 1px dashed #b78646;
    height: 40px;
    margin-bottom: 10px;
  }
  .sig-name {
    font-size: 13px;
    font-weight: bold;
    font-family: sans-serif;
  }
  .sig-meta {
    font-size: 11px;
    color: #666;
    font-family: sans-serif;
  }
  .print-btn-container {
    text-align: center;
    margin-top: 30px;
  }
  .print-btn {
    background: #b78646;
    color: #fff;
    border: none;
    padding: 12px 30px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    font-family: sans-serif;
    transition: background 0.2s;
  }
  .print-btn:hover {
    background: #9d7036;
  }
  @media print {
    body { padding: 0; background: none; }
    .agreement-container { border: none; box-shadow: none; padding: 0; }
    .print-btn-container { display: none; }
  }
</style>
</head>
<body>
<div class="agreement-container">
  <div class="agreement-header">
    <div class="logo-text">Weave 365</div>
    <div class="doc-title">B2B Merchant Agreement & Terms</div>
  </div>
  
  <div class="meta-box">
    <div class="meta-item"><strong>Agreement ID:</strong> ${agreementId}</div>
    <div class="meta-item"><strong>Registered Phone:</strong> +91 ${cleanPhone}</div>
    <div class="meta-item"><strong>Authorized Signatory:</strong> ${vendorName}</div>
    <div class="meta-item"><strong>Date of Signature:</strong> ${date}</div>
  </div>

  <div class="clause-section">
    <div class="clause-title">A. Payment Terms</div>
    <div class="clause-item">
      <span class="clause-item-head">A1 — Payment after delivery confirmation:</span>
      Payment will be released 3 days after successful delivery to the customer.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">A2 — Payment held during dispute period:</span>
      If a return or quality dispute is raised within 3 days of delivery, payment will be withheld until the dispute is resolved.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">A3 — Payment mode as agreed at onboarding:</span>
      Payment will be made via bank transfer (NEFT/IMPS/UPI) to the account details provided during onboarding. Weave 365 is not liable for errors due to incorrect account details submitted by the vendor.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">A4 — No advance payment:</span>
      Weave 365 does not make advance payments. All payments are processed post-delivery only.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">A5 — Deduction for returns and damage:</span>
      Any returned product amount and associated courier charges will be deducted from the vendor's pending payment before disbursement.
    </div>
  </div>

  <div class="clause-section">
    <div class="clause-title">B. Return Policy</div>
    <div class="clause-item">
      <span class="clause-item-head">B1 — Color and quality must match approved photos:</span>
      The product dispatched must exactly match the color, quality, and finish shown in the approved product images submitted during Step 1. Any deviation will be treated as a vendor-side defect.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">B2 — Returns due to quality or color mismatch go back to vendor:</span>
      If a customer return is raised due to quality defect, color variation, or mismatch with listing photos, the returned product will be sent back to the vendor at the vendor's expense. No payment will be made for such orders.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">B3 — Return window — 3 days from delivery:</span>
      Customers may raise a return request within 3 days of delivery. Returns raised after this window will not be accepted and vendor payment will be released normally.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">B4 — Defective or damaged in transit:</span>
      If a product is damaged during courier transit, liability will be assessed jointly. Vendor must ensure proper packaging. Products with inadequate packaging will be vendor's liability.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">B5 — No return for buyer's remorse or size preference:</span>
      Returns due to customer preference change, wrong size ordered, or buyer's remorse will not be charged to the vendor. These are handled by Weave 365's customer policy separately.
    </div>
  </div>

  <div class="clause-section">
    <div class="clause-title">C. Product & Listing Standards</div>
    <div class="clause-item">
      <span class="clause-item-head">C1 — No duplicate listings from other platforms:</span>
      Products listed on Weave 365 must not be sold at a lower price on any other platform (Meesho, Flipkart, own website, etc.) during the period of active listing.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">C2 — Stock availability obligation:</span>
      Once a product is listed, the vendor must maintain stock availability. If stock runs out, the vendor must notify Weave 365 immediately to avoid customer orders being placed on out-of-stock items.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">C3 — Dispatch within agreed timeline:</span>
      Vendor must dispatch orders within the agreed timeline (default: 2 business days from order confirmation). Repeated delays may result in delisting.
    </div>
  </div>

  <div class="clause-section">
    <div class="clause-title">D. General Terms</div>
    <div class="clause-item">
      <span class="clause-item-head">D1 — Right to delist:</span>
      Weave 365 reserves the right to delist a vendor's products at any time if quality standards, return rates, or these terms are not met, with 24 hours notice.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">D2 — Confidentiality of pricing:</span>
      Vendor agrees not to disclose Weave 365's wholesale pricing, commission structure, or internal operational details to any third party.
    </div>
    <div class="clause-item">
      <span class="clause-item-head">D3 — Agreement is binding:</span>
      By submitting this form, the vendor agrees that these terms are legally binding. Weave 365 reserves the right to update these terms with 7 days prior notice.
    </div>
  </div>

  <div class="signature-section">
    <div class="sig-block">
      <div class="sig-line" style="font-family: 'Courier New', monospace; font-size: 18px; color: #3b82f6; display: flex; align-items: center; justify-content: center;">
        <i>WEAVE365 SECURE SIGNED</i>
      </div>
      <div class="sig-name">Weave 365 Operations</div>
      <div class="sig-meta">Counter-signatory and Platform Admin</div>
    </div>
    <div class="sig-block">
      <div class="sig-line" style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #1e3a8a; display: flex; align-items: center; justify-content: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
        ${vendorName}
      </div>
      <div class="sig-name">${vendorName}</div>
      <div class="sig-meta">Authorized Vendor Representative (Electronically Signed)</div>
    </div>
  </div>

  <div class="print-btn-container">
    <button type="button" class="print-btn" onclick="window.print()">Print or Save as PDF</button>
  </div>
</div>
<script>
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 500);
  }
</script>
</body>
</html>`;

  const newWindow = window.open();
  if (newWindow) {
    newWindow.document.write(docHtml);
    newWindow.document.close();
  } else {
    alert('Popup window blocked! Please allow popups for this site to view the counter-signed legal copy.');
  }
};

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
  const title = isCart ? 'Order List Items' : 'Favourites Collection';
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

              const categorySlug = product ? getProductCategorySlug(product.id || product.groupKey) : 'wholesale-catalogue';
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
