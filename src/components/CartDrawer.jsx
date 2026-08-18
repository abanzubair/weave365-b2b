/**
 * CartDrawer Component
 * Purpose: A minimalist, elegant slide-out B2B cart drawer.
 * Displays grouped items, hybrid pricing status, interactive color swatch additions,
 * quantity steppers, and seamless links to Checkout and WhatsApp Enquiry.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowRight, Plus, Minus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react';
import { getProductCategorySlug } from '../config.js';
import {
  calculateHybridCartTotals,
  customerPrice,
  buildWhatsappUrl,
  fallbackProductImage,
  formatMoney,
} from '../storefrontShared.jsx';

import { WhatsappIcon } from './WhatsappIcon.jsx';
import { EnquiryPopup } from './EnquiryPopup.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { recordReferral } from '../utils/influencerHelpers.js';
import { useStorefront } from '../store/useStorefront.js';

function HorizontalScrollRow({ className, children, ...props }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        if (el.scrollWidth > el.clientWidth) {
          const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
          const atEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth && e.deltaY > 0;

          if (!atStart && !atEnd) {
            e.preventDefault();
            e.stopPropagation();
            el.scrollLeft += e.deltaY;
          }
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div ref={scrollRef} className={className} {...props}>
      {children}
    </div>
  );
}

export function CartDrawer(props) {
  const store = useStorefront();

  const open = props.open ?? store.cartOpen;
  const onClose = props.onClose || (() => store.setCartOpen(false));
  const items = props.items || [];
  const updateQuantity = props.updateQuantity;
  const removeProduct = props.removeProduct;
  const addCartColor = props.addCartColor;
  const pincode = props.pincode ?? store.pincode;
  const codStatus = props.codStatus ?? store.codStatus;
  const priceAccess = props.priceAccess;
  const navigate = props.navigate;

  const [enquiryState, setEnquiryState] = useState('idle');
  const [enquiryPopupOpen, setEnquiryPopupOpen] = useState(false);
  const drawerBodyRef = useRef(null);

  const canViewPrices = priceAccess?.canViewPrices !== false;

  const { subtotal, discount, total, productPricing } = useMemo(() => {
    if (!canViewPrices) return { subtotal: null, discount: 0, total: null, productPricing: {} };
    const totals = calculateHybridCartTotals(items, priceAccess);
    return {
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      productPricing: totals.productPricing || {},
    };
  }, [canViewPrices, items, priceAccess]);

  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  const hasUnselectedColors = useMemo(() => {
    return items.some((item) => item.selectedColorName === 'Select Color');
  }, [items]);

  const whatsappUrl = useMemo(
    () => buildWhatsappUrl(items, total, pincode, codStatus, priceAccess, undefined, null),
    [codStatus, items, pincode, priceAccess, total],
  );

  const groupedItems = useMemo(() => {
    const groups = new Map();

    items.forEach((item) => {
      const key = item.productGroupKey;
      const group = groups.get(key) || {
        key,
        product: item.product,
        variant: item.variant,
        colorOptions: item.colorOptions || [],
        items: [],
      };

      group.items.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.values()).map((group) => {
      const activeItems = group.items.filter(
        (item) => item.selectedColorName && item.selectedColorName !== 'Select Color'
      );
      return {
        ...group,
        selectedColorNames: new Set(group.items.map((item) => item.selectedColorName).filter(Boolean)),
        totalQuantity: activeItems.reduce((sum, item) => sum + item.quantity, 0),
        selectedColorsCount: activeItems.length,
      };
    });
  }, [items]);

  const handleGoToCheckout = () => {
    if (onClose) onClose();
    if (navigate) navigate('checkout');
  };

  const handleBrowseCatalog = () => {
    if (onClose) onClose();
    if (navigate) navigate('wholesale-catalogue');
  };

  async function handleEnquiryClick() {
    if (hasUnselectedColors) {
      alert('Please select a color for all items before making an enquiry.');
      return;
    }
    if (enquiryState === 'sending' || items.length === 0) return;
    setEnquiryState('sending');

    if (isSupabaseConfigured) {
      try {
        const enquiryItems = items.map((item) => {
          const categorySlug = item.product
            ? getProductCategorySlug(item.product.id || item.product.groupKey, item.product.category)
            : 'catalogue';
          const pId = item.productGroupKey || item.product?.id || item.product?.groupKey;
          const productUrl = pId ? `/${categorySlug}/${encodeURIComponent(pId)}` : '#';

          return {
            product_id: item.productGroupKey,
            product_title: item.product.title,
            variant_code: item.variant.code,
            color: item.selectedColorName,
            quantity: item.quantity,
            price: customerPrice(item.variant.prices, priceAccess),
            product_url: productUrl,
          };
        });

        const { data: inquiryData, error: inquiryErr } = await supabase
          .from('inquiries')
          .insert({
            user_id: priceAccess?.userId || undefined,
            email: priceAccess?.userEmail || undefined,
            buyer_name: priceAccess?.buyerName || 'Guest Buyer',
            phone: priceAccess?.buyerPhone || undefined,
            pincode: pincode || priceAccess?.buyerPincode || undefined,
            inquiry_type: 'cart',
            status: 'new',
            message: `Enquiry for ${items.length} items in cart`,
            items: enquiryItems,
          })
          .select('id')
          .single();

        if (inquiryErr) throw inquiryErr;

        if (inquiryData?.id) {
          const saleAmount = items.reduce(
            (sum, it) =>
              sum +
              (Number(customerPrice(it.variant.prices, priceAccess)) || 0) *
                (Number(it.quantity) || 1),
            0
          );
          void recordReferral({
            inquiryId: inquiryData.id,
            buyerId: priceAccess?.userId || null,
            buyerName: priceAccess?.buyerName || 'Guest Buyer',
            items: enquiryItems,
            saleAmount: saleAmount,
          });
        }

        fetch('/api/inquiry-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyer_name: priceAccess?.buyerName || 'Guest Buyer',
            email: priceAccess?.userEmail || undefined,
            phone: priceAccess?.buyerPhone || undefined,
            pincode: pincode || priceAccess?.buyerPincode || undefined,
            message: `Enquiry for ${items.length} items in cart`,
            items: enquiryItems,
          }),
        }).catch((err) => console.error('Failed to send inquiry email notification:', err));
      } catch (err) {
        console.error('Failed to log inquiry to Supabase:', err);
      }
    }

    setEnquiryState('sent');
    setEnquiryPopupOpen(true);
  }

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setEnquiryState('idle');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className={`cart-drawer-shell ${open ? 'open' : ''}`} onMouseDown={onClose}>
      <aside
        className={`cart-drawer ${open ? 'open' : ''}`}
        aria-hidden={!open}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-head">
          <div className="drawer-title-group">
            <h2>Shopping Bag</h2>
            {totalItemsCount > 0 && (
              <span className="drawer-item-count-badge">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close bag"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body" ref={drawerBodyRef}>
          {items.length === 0 ? (
            <div className="cart-empty-view">
              <div className="empty-icon-circle">
                <ShoppingBag size={28} strokeWidth={1.5} />
              </div>
              <h3 className="empty-title">Your bag is empty</h3>
              <p className="empty-subtitle">
                Explore our authentic Banarasi silk sarees, suits, and handwoven textiles.
              </p>
              <button
                type="button"
                className="empty-browse-btn"
                onClick={handleBrowseCatalog}
              >
                Browse Catalog <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="cart-items-container">
              {groupedItems.map((group) => {
                const hybridInfo = productPricing[group.product.id];
                const isUnder999 = String(group.product?.category || '').toLowerCase() === 'under 999';

                return (
                  <article className="cart-item-card" key={group.key}>
                    {/* Header: Image, Title, Code & Delete */}
                    <div className="cart-item-header">
                      <img
                        className="cart-item-thumb"
                        src={group.items[0]?.selectedColorImage || group.product.images[0] || fallbackProductImage}
                        alt={group.product.title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.target.src = fallbackProductImage; }}
                      />

                      <div className="cart-item-info">
                        <div className="cart-item-top-row">
                          <h4 className="cart-item-title">{group.product.title}</h4>
                          <button
                            type="button"
                            className="cart-item-delete-btn"
                            onClick={() => removeProduct(group.key)}
                            aria-label={`Remove ${group.product.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <span className="cart-item-code-tag">Code: {group.variant.code}</span>

                        {/* Hybrid Set Rate Pill */}
                        {!isUnder999 && hybridInfo && hybridInfo.setSize > 1 && (
                          <div className="cart-tier-indicator">
                            {hybridInfo.completeSets > 0 && hybridInfo.extraPieces === 0 ? (
                              <span className="tier-tag tier-tag-wholesale">
                                {hybridInfo.completeSets} Full Set{hybridInfo.completeSets > 1 ? 's' : ''} ({group.totalQuantity} pcs) · Wholesale Rate
                              </span>
                            ) : hybridInfo.completeSets > 0 && hybridInfo.extraPieces > 0 ? (
                              <span className="tier-tag tier-tag-hybrid">
                                {hybridInfo.completeSets} Set @ Wholesale + {hybridInfo.extraPieces} extra @ Reseller
                              </span>
                            ) : (
                              <span className="tier-tag tier-tag-reseller">
                                {group.totalQuantity} pcs · Add {hybridInfo.setSize - group.totalQuantity} more for Set Wholesale Price
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Color Variants List */}
                    <div className="cart-variants-list">
                      {group.items.map((item) => {
                        const unitPrice =
                          hybridInfo && group.totalQuantity >= hybridInfo.setSize
                            ? hybridInfo.wholesalePrice
                            : hybridInfo?.resellerPrice || customerPrice(item.variant.prices, priceAccess);

                        return (
                          <div className="cart-variant-row" key={item.variantCode}>
                            <div className="variant-color-info">
                              {item.selectedColorImage && (
                                <img
                                  src={item.selectedColorImage}
                                  alt={item.selectedColorName || 'Color'}
                                  className="variant-swatch-img"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <div className="variant-labels">
                                <span className="variant-name">
                                  {item.selectedColorName || 'Selected Color'}
                                </span>
                                <span className="variant-price">
                                  {canViewPrices
                                    ? `${formatMoney(unitPrice)} / pc`
                                    : priceNoticeForAccess(priceAccess)}
                                </span>
                              </div>
                            </div>

                            {/* Minimal Quantity Stepper */}
                            <div className="cart-qty-stepper">
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="stepper-count">{item.quantity}</span>
                              <button
                                type="button"
                                className="stepper-btn"
                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Color Swatch Addition Row (if multiple color options available) */}
                    {group.colorOptions.length > 1 && (
                      <div className="cart-color-add-row">
                        <span className="add-color-label">Add Colors:</span>
                        <HorizontalScrollRow className="add-swatches-scroll">
                          {group.colorOptions.map((color) => {
                            const isAlreadySelected = group.selectedColorNames.has(color.name);
                            return (
                              <button
                                key={`${color.name}-${color.image}`}
                                type="button"
                                className={`swatch-add-pill ${isAlreadySelected ? 'is-selected' : ''}`}
                                onClick={() => addCartColor(group.items[0], color)}
                                title={isAlreadySelected ? `${color.name} already in bag` : `Add ${color.name}`}
                              >
                                <img
                                  src={color.image || fallbackProductImage}
                                  alt={color.name || 'Color option'}
                                  loading="lazy"
                                />
                                <span>{color.name}</span>
                                {!isAlreadySelected && <Plus size={13} className="plus-icon" />}
                              </button>
                            );
                          })}
                        </HorizontalScrollRow>
                      </div>
                    )}
                  </article>
                );

              })}
            </div>
          )}
        </div>

        {/* Footer with Summary & Actions */}
        {items.length > 0 && (
          <div className="drawer-foot">
            <div className="cart-totals-summary">
              {discount > 0 && (
                <>
                  <div className="totals-line subtotal-line">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="totals-line discount-line">
                    <span>Set Wholesale Savings</span>
                    <span>-{formatMoney(discount)}</span>
                  </div>
                </>
              )}

              <div className="totals-line main-total-line">
                <div>
                  <span className="total-label">Estimated Total</span>
                  <span className="total-tax-note">Excl. GST & Shipping</span>
                </div>
                <strong className="total-value">
                  {total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)}
                </strong>
              </div>
            </div>

            {hasUnselectedColors && (
              <div className="cart-warning-note">
                Please select a color for all items before proceeding.
              </div>
            )}

            <div className="cart-actions-column">
              <button
                type="button"
                className="cart-checkout-btn-primary"
                onClick={handleGoToCheckout}
                disabled={hasUnselectedColors}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="cart-enquiry-btn-secondary"
                onClick={handleEnquiryClick}
                disabled={hasUnselectedColors || enquiryState === 'sending'}
              >
                <WhatsappIcon size={16} />
                <span>
                  {enquiryState === 'sent'
                    ? 'Inquiry Sent'
                    : enquiryState === 'sending'
                    ? 'Sending...'
                    : 'Quick WhatsApp Enquiry'}
                </span>
              </button>
            </div>
          </div>
        )}

        <EnquiryPopup
          open={enquiryPopupOpen}
          onClose={() => setEnquiryPopupOpen(false)}
          whatsappUrl={whatsappUrl}
        />
      </aside>
    </div>
  );
}
