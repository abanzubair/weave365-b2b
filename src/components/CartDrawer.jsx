import { useMemo, useState } from 'react';
import { X, ArrowRight, Plus } from 'lucide-react';
import {
  customerPrice,
  buildWhatsappUrl,
  fallbackProductImage,
  formatMoney,
  normalizePincodeInput,
  WhatsappIcon,
  EnquiryPopup,
} from '../storefrontShared.jsx';
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
          <h2>Your Cart</h2>
          <button className="icon-button" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="drawer-body">
          {items.length === 0 && <p className="empty-state">Your cart is empty.</p>}
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
                <div className="cart-color-line" key={item.variantCode}>
                  <span className="cart-selected-swatch">
                    <img
                      src={item.selectedColorImage || fallbackProductImage}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <div className="cart-color-line-copy">
                    <strong>{item.selectedColorName || 'Selected color'}</strong>
                    <span>
                      {canViewPrices
                        ? `${formatMoney(customerPrice(item.variant.prices, priceAccess))} / pc`
                        : priceNoticeForAccess(priceAccess)}
                    </span>
                  </div>
                  <div className="qty-row">
                    <button onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {group.colorOptions.length > 0 && (
              <div className="cart-color-picker">
                <span>Add more colors</span>
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
                        alt=""
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
      </div>
        <div className="drawer-foot">
          <div className="total-row">
            <span>Estimated Total</span>
            <strong>{total != null ? formatMoney(total) : priceNoticeForAccess(priceAccess)}</strong>
          </div>
          <p className="shipping-note">
            Kindly share your order quantity and delivery pincode for shipping charges and delivery time.
          </p>
          <button 
            type="button"
            className={`primary-button ${items.length ? '' : 'disabled'}`} 
            onClick={handleEnquiryClick}
            style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff' } : {}}
          >
            <WhatsappIcon size={20} /> {enquiryState === 'sent' ? 'Sent' : 'Submit Enquiry'} <ArrowRight size={18} />
          </button>
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
