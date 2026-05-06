import { useMemo } from 'react';
import { X, ArrowRight } from 'lucide-react';
import {
  customerPrice,
  buildWhatsappUrl,
  fallbackProductImage,
  PriceLine,
  formatMoney,
  normalizePincodeInput,
  WhatsappIcon,
} from '../storefrontShared.jsx';

export function CartDrawer({
  open,
  onClose,
  items,
  updateQuantity,
  pincode,
  setPincode,
  codStatus,
  checkPincode,
}) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + customerPrice(item.variant.prices) * item.quantity, 0),
    [items],
  );
  const whatsappUrl = useMemo(
    () => buildWhatsappUrl(items, total, pincode, codStatus),
    [codStatus, items, pincode, total],
  );

  return (
    <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="drawer-head">
        <h2>Your Cart</h2>
        <button className="icon-button" onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="drawer-body">
        {items.length === 0 && <p className="empty-state">Your cart is empty.</p>}
        {items.map((item) => (
          <div className="cart-item" key={item.variantCode}>
            <img
              src={item.variant.image || item.product.images[0] || fallbackProductImage}
              alt={item.product.title}
              loading="lazy"
              decoding="async"
              onError={(e) => { e.target.style.opacity = '0'; }}
            />
            <div>
              <strong>{item.product.title}</strong>
              <span>{item.variant.code}</span>
              <PriceLine prices={item.variant.prices} />
              <div className="qty-row">
                <button onClick={() => updateQuantity(item, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="drawer-foot">
        <div className="pincode-box small">
          <label>
            Check COD pincode
            <span>
              <input
                value={pincode}
                onChange={(event) => setPincode(normalizePincodeInput(event.target.value))}
                placeholder="Pincode"
              />
              <button onClick={checkPincode}>Check</button>
            </span>
          </label>
          {codStatus === 'available' && <p className="success">COD price can be discussed for this pincode.</p>}
          {codStatus === 'unavailable' && <p className="warning">COD unavailable for this pincode.</p>}
        </div>
        <div className="total-row">
          <span>Estimated Total</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <a className={`primary-button ${items.length ? '' : 'disabled'}`} href={items.length ? whatsappUrl : undefined} target="_blank" rel="noreferrer">
          <WhatsappIcon size={20} /> Send WhatsApp Enquiry <ArrowRight size={18} />
        </a>
      </div>
    </aside>
  );
}
