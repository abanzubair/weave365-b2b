import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Inbox,
  RefreshCw,
  Search,
  AlertTriangle,
  Phone,
  Mail,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '../../supabaseClient.js';
import { parseCartVariantCode } from '../../utils/cartHelpers.js';
import { fallbackProductImage, formatMoney } from '../../storefrontShared.jsx';
import { getProductCategorySlug } from '../../config.js';
import { WhatsappIcon } from '../../components/WhatsappIcon.jsx';

function getWhatsappUrl(rawPhone) {
  if (!rawPhone) return '#';
  const cleaned = String(rawPhone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `https://wa.me/91${cleaned}`;
  }
  return `https://wa.me/${cleaned}`;
}

function generateWhatsAppInquiryMsg(enquiry, products) {
  const buyerName = enquiry.buyer_name || enquiry.name || 'Customer';
  
  let itemsList = [];
  if (Array.isArray(enquiry.items) && enquiry.items.length > 0) {
    itemsList = enquiry.items;
  } else if (typeof enquiry.items === 'string') {
    try {
      itemsList = JSON.parse(enquiry.items);
    } catch (e) {}
  }

  if (!Array.isArray(itemsList) || itemsList.length === 0) {
    const productKey = enquiry.product_group_key || enquiry.productGroupKey;
    if (productKey || enquiry.variant_code) {
      itemsList = [
        {
          product_group_key: productKey,
          variant_code: enquiry.variant_code,
          color: 'Assorted',
          quantity: 1,
        },
      ];
    }
  }

  let itemsText = '';
  let totalAmt = 0;
  let hasPrice = false;

  itemsList.forEach((row, idx) => {
    const productKey = row.product_group_key || enquiry.product_group_key;
    const product = products.find(p => p.id === productKey || p.groupKey === productKey);
    
    const searchCode = row.variant_code || row.variantCode;
    let matchedProduct = product;
    let resolvedKey = productKey;
    if (!matchedProduct && searchCode) {
      matchedProduct = products.find(p => 
        (p.variants || []).some(v => v.code === searchCode) ||
        p.id === searchCode ||
        p.groupKey === searchCode
      );
      if (matchedProduct) {
        resolvedKey = matchedProduct.id || matchedProduct.groupKey;
      }
    }

    const { baseVariantCode, colorName } = parseCartVariantCode(searchCode || '');
    const variant = matchedProduct?.variants?.find(v => v.code === baseVariantCode);
    const colorOptions = matchedProduct?.colorOptions || [];
    const selectedColorName = colorName || row.color || variant?.color || colorOptions[0]?.name || '';
    
    const itemTitle = matchedProduct?.title || `Product Design Code: ${resolvedKey || 'N/A'}`;
    const displayCode = searchCode || baseVariantCode || resolvedKey || 'N/A';
    const qty = Number(row.quantity) || 1;

    let unitPrice = 0;
    if (row.price !== undefined && row.price !== null) {
      unitPrice = Number(row.price);
      hasPrice = true;
    }

    const lineTotal = unitPrice * qty;
    totalAmt += lineTotal;

    itemsText += `${idx + 1}. ${itemTitle}\n   Code: ${displayCode} | Color: ${selectedColorName} | Qty: ${qty}`;
    if (unitPrice > 0) {
      itemsText += ` | Price: ₹${unitPrice.toLocaleString('en-IN')}`;
    }
    itemsText += '\n\n';
  });

  let msg = `Dear ${buyerName},\nThank you for your enquiry.\n\nWe are happy to inform you that all the items you enquired about are available:\n\n${itemsText}`;
  
  if (hasPrice && totalAmt > 0) {
    msg += `Total Amount: ₹${totalAmt.toLocaleString('en-IN')}\n\n`;
  }
  
  msg += `Kindly confirm your order so we can proceed further.\n\nThank you,\nTeam Weave 365`;
  return msg;
}

export default function EnquiresManager({
  adminData,
  loadAdminData,
  products = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [localMessage, setLocalMessage] = useState(null);
  const [selectedEnquiryForItems, setSelectedEnquiryForItems] = useState(null);

  const handleCardClick = (e, item) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('select')) {
      return;
    }
    setSelectedEnquiryForItems(item);
  };

  // Retrieve the inquiries data from adminData.optional
  const inquiresData = useMemo(() => {
    return adminData.optional?.inquiries || [];
  }, [adminData]);

  // Clean / search matching logic
  const query = searchQuery.toLowerCase().trim();
  const filtered = useMemo(() => {
    const list = inquiresData.filter((row) => {
      const matchesStatus = statusFilter === 'all' || (row.status || '').toLowerCase() === statusFilter.toLowerCase();
      const matchesSearch = !query ||
        (row.buyer_name || row.name || '').toLowerCase().includes(query) ||
        (row.business_name || row.company || '').toLowerCase().includes(query) ||
        (row.email || '').toLowerCase().includes(query) ||
        (row.phone || '').includes(query) ||
        (row.message || row.notes || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });

    return list.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [inquiresData, statusFilter, query]);

  // Status updates
  async function updateStatus(id, newStatus) {
    setActionLoading(id);
    setLocalMessage(null);
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setLocalMessage({ type: 'success', text: `Enquiry status updated to "${newStatus}"` });
      await loadAdminData();
    } catch (err) {
      console.error('[EnquiresManager] Update status error:', err);
      setLocalMessage({ type: 'error', text: err.message || 'Failed to update status.' });
    } finally {
      setActionLoading(null);
    }
  }

  // Delete enquiry
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) {
      return;
    }
    setActionLoading(id);
    setLocalMessage(null);
    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLocalMessage({ type: 'success', text: 'Enquiry deleted successfully.' });
      await loadAdminData();
    } catch (err) {
      console.error('[EnquiresManager] Delete error:', err);
      setLocalMessage({ type: 'error', text: err.message || 'Failed to delete enquiry.' });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="admin-early-access-tab">
      <div className="admin-ea-header">
        <div className="admin-ea-header-left">
          <Inbox size={22} className="admin-ea-header-icon" />
          <div>
            <h2 className="admin-ea-title">B2B Enquiries Manager (Table: inquiries)</h2>
            <p className="admin-ea-subtitle">
              {inquiresData.length} total &bull; {inquiresData.filter((r) => r.status === 'new').length} new enquiries
            </p>
          </div>
        </div>
        <button
          type="button"
          className="admin-ea-refresh-btn"
          onClick={() => loadAdminData()}
          disabled={adminData.loading}
        >
          <RefreshCw size={16} className={adminData.loading ? 'spin' : ''} />
          {adminData.loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div className="admin-ea-filters">
        <div className="admin-ea-search-wrap">
          <Search size={15} className="admin-ea-search-icon" />
          <input
            type="search"
            className="admin-ea-search-input"
            placeholder="Search by name, company, email, WhatsApp…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="admin-ea-status-filter">
          {['all', 'new', 'contacted', 'completed'].map((s) => (
            <button
              key={s}
              type="button"
              className={`admin-ea-filter-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {localMessage && (
        <div className={`admin-ea-error ${localMessage.type === 'success' ? 'admin-ea-success-banner' : ''}`} style={{
          backgroundColor: localMessage.type === 'success' ? '#e6f4ea' : '#fce8e6',
          color: localMessage.type === 'success' ? '#137333' : '#c5221f',
          borderColor: localMessage.type === 'success' ? '#ceead6' : '#fad2cf',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid',
          fontSize: '0.875rem'
        }}>
          {localMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{localMessage.text}</span>
        </div>
      )}

      {adminData.errors?.inquiries && (
        <div className="admin-ea-error">
          <AlertTriangle size={16} />
          <span>Error loading from table 'inquiries': {adminData.errors.inquiries}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="admin-ea-empty">
          <Inbox size={40} opacity={0.25} />
          <p>No enquiries found matching filters.</p>
        </div>
      ) : (
        <div className="admin-enquiries-list">
          {filtered.map((item) => {
            const buyerName = item.buyer_name || item.name || 'Unknown Buyer';
            const businessName = item.business_name || item.company || 'Individual / Direct';
            const email = item.email || '';
            const phone = item.phone || item.whatsapp || '';
            const msg = item.message || item.notes || 'No message provided.';
            const status = (item.status || 'new').toLowerCase();
            const dateStr = item.created_at
              ? new Date(item.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Unknown Date';

            return (
              <div
                key={item.id}
                className={`admin-enquiry-card status-${status}`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleCardClick(e, item)}
              >
                <div className="admin-enquiry-header">
                  <div className="admin-enquiry-buyer-info">
                    <h4>{buyerName}</h4>
                    <div className="admin-enquiry-meta-item" style={{ marginTop: '4px' }}>
                      <Building size={13} />
                      <span>{businessName}</span>
                    </div>
                  </div>
                  <div className="admin-enquiry-right-meta">
                    <span className={`admin-enquiry-status-badge badge-${status}`}>
                      {status}
                    </span>
                    <div className="admin-enquiry-meta-item">
                      <Calendar size={12} />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-enquiry-message-box">
                  <p className="admin-enquiry-message-text">{msg}</p>
                  {item.pincode && (
                    <span className="admin-enquiry-pincode">
                      <strong>Pincode:</strong> {item.pincode}
                    </span>
                  )}
                </div>

                <div className="admin-enquiry-contact-links">
                  {phone && (
                    <a
                      href={getWhatsappUrl(phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-enquiry-link"
                    >
                      <Phone size={13} />
                      <span>{phone}</span>
                    </a>
                  )}
                  {email && (
                    <a href={`mailto:${email}`} className="admin-enquiry-link">
                      <Mail size={13} />
                      <span>{email}</span>
                    </a>
                  )}
                </div>

                <div className="admin-enquiry-actions-bar">
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {phone && (
                      <a
                        href={`${getWhatsappUrl(phone)}?text=${encodeURIComponent(generateWhatsAppInquiryMsg(item, products))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-enquiry-btn-action"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#128C7E',
                          color: '#fff',
                          border: 'none',
                        }}
                      >
                        <WhatsappIcon size={14} /> Send WhatsApp Msg
                      </a>
                    )}
                    {status !== 'contacted' && (
                      <button
                        type="button"
                        disabled={actionLoading === item.id}
                        onClick={() => updateStatus(item.id, 'contacted')}
                        className="admin-enquiry-btn-action btn-contacted"
                      >
                        Contacted
                      </button>
                    )}
                    {status !== 'completed' && (
                      <button
                        type="button"
                        disabled={actionLoading === item.id}
                        onClick={() => updateStatus(item.id, 'completed')}
                        className="admin-enquiry-btn-action btn-completed"
                      >
                        Completed
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    title="Delete Enquiry"
                    disabled={actionLoading === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="admin-enquiry-delete-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EnquiryItemsModal
        isOpen={!!selectedEnquiryForItems}
        onClose={() => setSelectedEnquiryForItems(null)}
        enquiry={selectedEnquiryForItems}
        products={products}
      />
    </div>
  );
}

function EnquiryItemsModal({ isOpen, onClose, enquiry, products }) {
  if (!isOpen || !enquiry) return null;

  let itemsList = [];
  if (Array.isArray(enquiry.items) && enquiry.items.length > 0) {
    itemsList = enquiry.items;
  } else if (typeof enquiry.items === 'string') {
    try {
      itemsList = JSON.parse(enquiry.items);
    } catch (e) {}
  }

  // Fallback to inquiry level product if items array is empty
  if (!Array.isArray(itemsList) || itemsList.length === 0) {
    const productKey = enquiry.product_group_key || enquiry.productGroupKey;
    if (productKey || enquiry.variant_code) {
      itemsList = [
        {
          product_group_key: productKey,
          variant_code: enquiry.variant_code,
          color: 'Assorted',
          quantity: 1,
        },
      ];
    }
  }

  return createPortal(
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-user-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <span className="admin-modal-subtitle">Enquired Items</span>
            <h3 className="admin-modal-title">{enquiry.buyer_name || enquiry.name || 'Unnamed buyer'}</h3>
            <span className="admin-modal-header-meta">
              {enquiry.business_name || enquiry.company || 'Individual / Direct'} &bull; Phone:{' '}
              {enquiry.phone || enquiry.whatsapp ? (
                <a
                  href={getWhatsappUrl(enquiry.phone || enquiry.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#0284c7', textDecoration: 'underline' }}
                >
                  {enquiry.phone || enquiry.whatsapp}
                </a>
              ) : (
                'N/A'
              )}
            </span>
          </div>
          <button type="button" onClick={onClose} className="admin-modal-close-btn" aria-label="Close modal">×</button>
        </div>

        <div className="admin-modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
          {itemsList.length === 0 ? (
            <p className="admin-modal-empty">No items recorded for this enquiry.</p>
          ) : (
            itemsList.map((row, idx) => {
              let productKey = row.product_group_key || row.productGroupKey || enquiry.product_group_key || enquiry.productGroupKey;
              let product = products.find(p => p.id === productKey || p.groupKey === productKey);
              
              const searchCode = row.variant_code || row.variantCode;
              if (!product && searchCode) {
                product = products.find(p => 
                  (p.variants || []).some(v => v.code === searchCode) ||
                  p.id === searchCode ||
                  p.groupKey === searchCode
                );
                if (product) {
                  productKey = product.id || product.groupKey;
                }
              }

              const { baseVariantCode, colorName } = parseCartVariantCode(searchCode || '');
              const variant = product?.variants?.find(v => v.code === baseVariantCode);
              const colorOptions = product?.colorOptions || [];
              const selectedColorName = colorName || row.color || variant?.color || colorOptions[0]?.name || '';
              const selectedColor = colorOptions.find((entry) => entry.name === selectedColorName);
              const itemImage = selectedColor?.image || variant?.image || product?.images?.[0] || fallbackProductImage;
              
              const itemTitle = product?.title || `Product Design Code: ${productKey || 'N/A'}`;
              const displayCode = searchCode || baseVariantCode || productKey || 'N/A';

              const categorySlug = product ? getProductCategorySlug(product.id || product.groupKey) : 'wholesale-catalogue';
              const pId = productKey || product?.id || product?.groupKey;
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
                        <ExternalLink size={16} className="admin-item-ext-icon" style={{ marginLeft: 'auto' }} />
                      </div>
                      <div className="admin-user-item-meta">
                        <span className="admin-item-code">Code: <code>{displayCode}</code></span>
                        {selectedColorName && (
                          <span className="admin-item-color">Color: <strong className="admin-capitalize">{selectedColorName}</strong></span>
                        )}
                        <span className="admin-user-item-qty">Qty: <strong>x{row.quantity || 1}</strong></span>
                      </div>
                      {row.price && (
                        <div className="admin-user-item-price">
                          <span className="price-tag">
                            Price: <strong>{formatMoney(row.price)}</strong>
                          </span>
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
