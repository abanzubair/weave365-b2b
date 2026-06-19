/**
 * CartDrawer Component
 * Purpose: Renders the slide-out B2B order drawer (cart).
 * Enables real-time order list compilations, quantity adjustments, catalog color selection,
 * PAN India delivery pincode check status, and dynamic WhatsApp checkouts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowRight, ArrowLeft, Plus, Zap } from 'lucide-react';
import { storeConfig } from '../config.js';
import {
  customerPrice,
  buildWhatsappUrl,
  fallbackProductImage,
  formatMoney,
  normalizePincodeInput,
} from '../storefrontShared.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { EnquiryPopup } from './EnquiryPopup.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

export function CartDrawer({
  open,
  onClose,
  items,
  updateQuantity,
  addCartColor,
  pincode,
  setPincode,
  codStatus,
  checkPincode,
  priceAccess,
}) {
  const [enquiryState, setEnquiryState] = useState('idle');
  const [enquiryPopupOpen, setEnquiryPopupOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpiDetails, setShowUpiDetails] = useState(false);
  const drawerBodyRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasUnselectedColors = useMemo(() => {
    return items.some(item => item.selectedColorName === 'Select Color');
  }, [items]);

  useEffect(() => {
    if (!open) {
      setShowUpiDetails(false);
      setEnquiryState('idle');
    }
  }, [open]);

  useEffect(() => {
    if (showUpiDetails && drawerBodyRef.current) {
      const timer = setTimeout(() => {
        drawerBodyRef.current.scrollTo({
          top: drawerBodyRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showUpiDetails]);

  const canViewPrices = priceAccess?.canViewPrices !== false;
  const total = useMemo(
    () => canViewPrices
      ? items.reduce((sum, item) => sum + (customerPrice(item.variant.prices, priceAccess) || 0) * item.quantity, 0)
      : null,
    [canViewPrices, items, priceAccess],
  );
  const whatsappUrl = useMemo(
    () => buildWhatsappUrl(items, total, pincode, codStatus, priceAccess),
    [codStatus, items, pincode, priceAccess, total],
  );

  const showPayment = priceAccess?.priceGroup !== 'wholesale' && priceAccess?.buyerType !== 'wholesale';
  const upiUrl = useMemo(() => {
    if (!showPayment || !total) return '';
    return `upi://pay?pa=${storeConfig.upiId}&pn=${encodeURIComponent(storeConfig.name)}&am=${total}&cu=INR`;
  }, [showPayment, total]);

  const copyUpiId = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(storeConfig.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const groupedItems = useMemo(() => {
    const groups = new Map();

    items.forEach((item) => {
      const key = item.productGroupKey;
      const group = groups.get(key) || {
        key,
        product: item.product,
        variant: item.variant,
        colorOptions: item.colorOptions,
        items: [],
      };

      group.items.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      selectedColorNames: new Set(group.items.map((item) => item.selectedColorName).filter(Boolean)),
      totalQuantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
    }));
  }, [items]);

  async function handleEnquiryClick() {
    if (hasUnselectedColors) {
      alert('Please select a color for all items before making an enquiry.');
      return;
    }
    if (enquiryState === 'sending' || items.length === 0) return;
    setEnquiryState('sending');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('inquiries').insert({
          user_id: priceAccess?.userId || undefined,
          email: priceAccess?.userEmail || undefined,
          buyer_name: priceAccess?.buyerName || 'Guest Buyer',
          phone: priceAccess?.buyerPhone || undefined,
          pincode: pincode || priceAccess?.buyerPincode || undefined,
          inquiry_type: 'cart',
          status: 'new',
          message: `Enquiry for ${items.length} items in cart`,
          items: items.map(item => ({
            product_id: item.productGroupKey,
            product_title: item.product.title,
            variant_code: item.variant.code,
            color: item.selectedColorName,
            quantity: item.quantity,
            price: customerPrice(item.variant.prices, priceAccess),
          })),
        });
      } catch (err) {
        console.error('Failed to log inquiry to Supabase:', err);
      }
    }

    setEnquiryState('sent');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  const handlePaidConfirmClick = () => {
    if (hasUnselectedColors) {
      alert('Please select a color for all items before sharing payment.');
      return;
    }
    if (enquiryState === 'uploading' || enquiryState === 'sending' || items.length === 0) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setEnquiryState('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Screenshot upload failed');
      }

      const uploadData = await uploadRes.json();
      if (uploadData.status !== 'success' || !uploadData.url) {
        throw new Error(uploadData.error || 'Failed to retrieve uploaded image URL');
      }

      const screenshotUrl = uploadData.url;

      setEnquiryState('sending');
      if (isSupabaseConfigured) {
        try {
          await supabase.from('inquiries').insert({
            user_id: priceAccess?.userId || undefined,
            email: priceAccess?.userEmail || undefined,
            buyer_name: priceAccess?.buyerName || 'Guest Buyer',
            phone: priceAccess?.buyerPhone || undefined,
            pincode: pincode || priceAccess?.buyerPincode || undefined,
            inquiry_type: 'cart_payment',
            status: 'new',
            message: `Order paid via UPI. Screenshot: ${screenshotUrl}`,
            items: items.map(item => ({
              product_id: item.productGroupKey,
              product_title: item.product.title,
              variant_code: item.variant.code,
              color: item.selectedColorName,
              quantity: item.quantity,
              price: customerPrice(item.variant.prices, priceAccess),
            })),
          });
        } catch (err) {
          console.error('Failed to log payment inquiry to Supabase:', err);
        }
      }

      setEnquiryState('sent');
      const paidWhatsappUrl = buildWhatsappUrl(items, total, pincode, codStatus, priceAccess, screenshotUrl);
      window.open(paidWhatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Payment screenshot upload error:', err);
      alert('Could not upload screenshot. Opening WhatsApp with order details so you can paste the screenshot manually.');

      setEnquiryState('sending');
      if (isSupabaseConfigured) {
        try {
          await supabase.from('inquiries').insert({
            user_id: priceAccess?.userId || undefined,
            email: priceAccess?.userEmail || undefined,
            buyer_name: priceAccess?.buyerName || 'Guest Buyer',
            phone: priceAccess?.buyerPhone || undefined,
            pincode: pincode || priceAccess?.buyerPincode || undefined,
            inquiry_type: 'cart_payment_fallback',
            status: 'new',
            message: 'Order checkout via UPI (Screenshot upload failed)',
            items: items.map(item => ({
              product_id: item.productGroupKey,
              product_title: item.product.title,
              variant_code: item.variant.code,
              color: item.selectedColorName,
              quantity: item.quantity,
              price: customerPrice(item.variant.prices, priceAccess),
            })),
          });
        } catch (sErr) {
          console.error('Fallback Supabase insert failed:', sErr);
        }
      }
      setEnquiryState('sent');
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div 
      className={`cart-drawer-shell ${open ? 'open' : ''}`} 
      onMouseDown={onClose}
    >
      <aside 
        className={`cart-drawer ${open ? 'open' : ''}`} 
        aria-hidden={!open}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="drawer-head">
          <h2>Order List</h2>
          <button type="button" className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="drawer-body" ref={drawerBodyRef}>
          {showUpiDetails ? (
            <div className="cart-upi-view">
              <button 
                type="button" 
                className="cart-back-btn" 
                onClick={() => setShowUpiDetails(false)}
              >
                <ArrowLeft size={16} /> Back to Order List
              </button>

              <div className="upi-payment-header">
                <strong>UPI Payment Details</strong>
                <span className="upi-payment-badge">Instant Order</span>
              </div>
              <p className="upi-payment-instructions">
                Scan QR code or click pay to complete payment. Order will be processed instantly.
              </p>
              <div className="upi-qr-wrapper">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                  alt="UPI QR Code"
                  width={180}
                  height={180}
                  loading="lazy"
                  className="upi-qr-image"
                />
              </div>
              <div className="upi-details-grid">
                <div className="upi-detail-row">
                  <span>Payee Name</span>
                  <strong>{storeConfig.name}</strong>
                </div>
                <div className="upi-detail-row">
                  <span>UPI ID</span>
                  <div className="upi-id-copy-wrapper">
                    <strong>{storeConfig.upiId}</strong>
                    <button 
                      type="button" 
                      onClick={copyUpiId}
                      className="upi-copy-btn"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div className="upi-detail-row">
                  <span>Amount to Pay</span>
                  <strong className="upi-pay-amount">{formatMoney(total)}</strong>
                </div>
              </div>
              <a 
                href={upiUrl}
                className="upi-pay-app-btn"
              >
                <Zap size={15} /> Pay via GPay / PhonePe / UPI
              </a>
            </div>
          ) : (
            <>
              {items.length === 0 && <p className="empty-state">Order list is empty.</p>}
              {groupedItems.map((group) => (
                <article className="cart-product-card" key={group.key}>
                  <div className="cart-product-head">
                    <img
                      className="cart-product-image"
                      src={group.items[0]?.selectedColorImage || group.product.images[0] || fallbackProductImage}
                      alt={group.product.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.target.style.opacity = '0'; }}
                    />
                    <div>
                      <strong>{group.product.title}</strong>
                      <span className="cart-item-code">{group.variant.code}</span>
                      <span className="cart-group-summary">
                        {group.items.length} color{group.items.length === 1 ? '' : 's'} selected · {group.totalQuantity} pc
                      </span>
                    </div>
                  </div>

                  <div className="cart-color-lines">
                    {group.items.map((item) => (
                      <div className={`cart-color-line ${item.selectedColorName === 'Select Color' ? 'unselected-color' : ''}`} key={item.variantCode}>
                        <span className="cart-selected-swatch">
                          <img
                            src={item.selectedColorImage || fallbackProductImage}
                            alt={item.selectedColorName || 'Color swatch'}
                            loading="lazy"
                            decoding="async"
                          />
                        </span>
                        <div className="cart-color-line-copy">
                          <strong className={item.selectedColorName === 'Select Color' ? 'unselected-color-notice' : ''}>
                            {item.selectedColorName || 'Selected color'}
                          </strong>
                          <span>
                            {canViewPrices
                              ? `${formatMoney(customerPrice(item.variant.prices, priceAccess))} / pc`
                              : priceNoticeForAccess(priceAccess)}
                          </span>
                        </div>
                        <div className="qty-row">
                          <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            disabled={item.selectedColorName === 'Select Color'}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {group.colorOptions.length > 0 && (
                    <div className="cart-color-picker">
                      <span>{group.selectedColorNames.has('Select Color') ? 'Choose color' : 'Add more colors'}</span>
                      <div className="cart-color-swatch-row">
                        {group.colorOptions.map((color) => (
                          <button
                            key={`${color.name}-${color.image}`}
                            type="button"
                            className={group.selectedColorNames.has(color.name) ? 'active' : ''}
                            onClick={() => addCartColor(group.items[0], color)}
                            aria-label={`Add ${color.name}`}
                            title={`Add ${color.name}`}
                          >
                            <img
                              src={color.image || fallbackProductImage}
                              alt={color.name || 'Color option'}
                              loading="lazy"
                              decoding="async"
                            />
                            <Plus size={11} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </>
          )}
        </div>
        <div className="drawer-foot">
          <div className="total-row">
            <span>Total</span>
            <strong>{total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)}</strong>
          </div>
          
          {showUpiDetails ? (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button 
                type="button"
                className="primary-button paid-confirm-btn"
                onClick={handlePaidConfirmClick}
                disabled={enquiryState === 'uploading' || enquiryState === 'sending'}
                style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff', borderColor: '#128C7E' } : {}}
              >
                <WhatsappIcon size={20} /> {
                  enquiryState === 'sent' ? 'Payment Shared' :
                  enquiryState === 'uploading' ? 'Uploading Screenshot...' :
                  enquiryState === 'sending' ? 'Logging Payment...' : 'Share Payment Screenshot'
                } <ArrowRight size={18} />
              </button>
            </>
          ) : (
            <>
              {hasUnselectedColors && (
                <div className="cart-info-alert warning-alert animate-shake">
                  <svg className="alert-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <span>Please select a color for all items before making an enquiry.</span>
                </div>
              )}

              {items.length > 0 && !hasUnselectedColors && (
                <div className="cart-info-alert">
                  <svg className="alert-icon" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Kindly share order quantity and delivery pincode for shipping charges.</span>
                </div>
              )}

              <div className="cart-action-group">
                {items.length > 0 && showPayment && !hasUnselectedColors && (
                  <button 
                    type="button"
                    className={`payment-trigger-btn ${showUpiDetails ? 'active' : ''}`}
                    onClick={() => setShowUpiDetails(prev => !prev)}
                  >
                    <Zap size={15} /> {showUpiDetails ? 'Hide Payment' : 'Make Payment'}
                  </button>
                )}
                <button 
                  type="button"
                  className={`enquiry-submit-btn ${items.length && !hasUnselectedColors ? '' : 'disabled'}`} 
                  onClick={handleEnquiryClick}
                  disabled={!items.length || hasUnselectedColors}
                  style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff', borderColor: '#128C7E' } : {}}
                >
                  <WhatsappIcon size={15} /> {enquiryState === 'sent' ? 'Sent' : 'Submit Enquiry'}
                </button>
              </div>
            </>
          )}
        </div>
        <EnquiryPopup
          open={enquiryPopupOpen}
          onClose={() => setEnquiryPopupOpen(false)}
          whatsappUrl={whatsappUrl}
        />
      </aside>
    </div>
  );
}
