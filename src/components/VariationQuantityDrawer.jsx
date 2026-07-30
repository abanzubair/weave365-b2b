/**
 * VariationQuantityDrawer Component
 * Purpose: A slide-up mobile sheet / desktop side-drawer that lets buyers compile B2B orders.
 * Enables selecting multiple colors, setting design-specific wholesale quantities, and calculating subtotals.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { storeConfig } from '../config.js';
import {
  customerPrice,
  fallbackProductImage,
  formatMoney,
} from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';

function buildQuantityMap(options) {
  return options.reduce((map, option) => ({ ...map, [option.key]: 0 }), {});
}

export function VariationQuantityDrawer({
  open,
  product,
  colorOptions,
  selectedColorName,
  selectedImage,
  onClose,
  onSelectColor,
  onAddToCart,
  priceAccess,
  isSoldAsPc = false,
}) {
  const rows = useMemo(() => {
    const source = colorOptions.length
      ? colorOptions
      : product.variants.map((variant) => ({
        name: variant.color || variant.code,
        image: variant.image,
      }));

    const seen = new Set();
    return source.reduce((acc, option, index) => {
      const name = option.name || `Color ${index + 1}`;
      const variant = product.variants.find((item) => item.color === option.name) || product.variants[0];
      const image = option.image || variant?.image || product.images[index] || product.images[0] || fallbackProductImage;
      const key = `${name}-${image || index}`;

      if (variant && !seen.has(key)) {
        seen.add(key);
        acc.push({
          key,
          name,
          image,
          variant,
          price: customerPrice(variant?.prices || {}, priceAccess),
        });
      }
      return acc;
    }, []);
  }, [colorOptions, priceAccess, product.images, product.variants]);

  const [activeKey, setActiveKey] = useState(rows[0]?.key || '');
  const [quantities, setQuantities] = useState(() => buildQuantityMap(rows));
  const [setQuantityVal, setSetQuantityVal] = useState(1);

  useEffect(() => {
    const isWholesale = priceAccess?.priceGroup === 'wholesale';
    if (isWholesale && !isSoldAsPc) {
      setSetQuantityVal(1);
      const initialMap = rows.reduce((map, option) => ({ ...map, [option.key]: 1 }), {});
      setQuantities(initialMap);
    } else {
      setQuantities(buildQuantityMap(rows));
    }
    const activeRow = rows.find((row) => row.name === selectedColorName || row.image === selectedImage) || rows[0];
    setActiveKey(activeRow?.key || '');
  }, [rows, selectedColorName, selectedImage, priceAccess?.priceGroup, isSoldAsPc]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('drawer-lock');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('drawer-lock');
    };
  }, [open]);

  const selectedRow = rows.find((row) => row.key === activeKey) || rows[0];
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const subtotal = canViewPrices
    ? rows.reduce((total, row) => total + (row.price || 0) * (quantities[row.key] || 0), 0)
    : null;
  const totalQuantity = Object.values(quantities).reduce((total, quantity) => total + quantity, 0);
  const selectedCartRows = useMemo(
    () => rows.reduce((acc, row) => {
      const quantity = quantities[row.key] || 0;
      if (quantity > 0) {
        acc.push({
          variant: row.variant,
          quantity,
          colorName: row.name,
          image: row.image,
        });
      }
      return acc;
    }, []),
    [quantities, rows],
  );

  const setQuantity = useCallback((key, nextQuantity) => {
    setQuantities((current) => ({
      ...current,
      [key]: Math.max(0, nextQuantity),
    }));
  }, []);

  const handleSetQuantityChange = useCallback((nextVal) => {
    const val = Math.max(0, nextVal);
    setSetQuantityVal(val);
    setQuantities((current) => {
      const next = { ...current };
      rows.forEach((row) => {
        next[row.key] = val;
      });
      return next;
    });
  }, [rows]);

  const selectRow = useCallback((row) => {
    setActiveKey(row.key);
    onSelectColor(row.name);
  }, [onSelectColor]);

  if (!open) return null;

  return (
    <div className="variation-drawer-shell" role="presentation" onMouseDown={onClose}>
      <aside
        className="variation-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variation-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="variation-drawer-head">
          <h2 id="variation-drawer-title">Select variations and quantity</h2>
          <button type="button" aria-label="Close variation selector" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="variation-drawer-body">
          <section className="drawer-color-section" aria-label="Available colors">
            <p><strong>Color:</strong> {selectedRow?.name || 'Selected'}</p>
            <div className="drawer-color-row" role="list">
              {rows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className={row.key === activeKey ? 'active' : ''}
                  onClick={() => selectRow(row)}
                  aria-label={`Select ${row.name}`}
                >
                  <img
                    src={row.image}
                    alt={row.name}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => { event.currentTarget.src = fallbackProductImage; }}
                  />
                </button>
              ))}
            </div>
          </section>

          <section className="variation-quantity-section" aria-label="Color quantities">
            {priceAccess?.priceGroup === 'wholesale' && !isSoldAsPc && (
              <div className="wholesale-set-stepper-container" style={{
                margin: '0 0 20px 0',
                padding: '16px',
                background: '#fcf8f0',
                borderRadius: '8px',
                border: '1px solid #ebd3b4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ fontSize: 'var(--body-size)', color: '#8c6239' }}>Quantity</strong>
                  <span style={{ fontSize: 'var(--small-size)', color: '#a08060' }}>
                    1 Set = 1 piece of each color variant ({rows.length} pcs total)
                  </span>
                </div>
                <div className="quantity-stepper" style={{ background: '#fff' }} aria-label="Set quantity">
                  <button type="button" onClick={() => handleSetQuantityChange(setQuantityVal - 1)} aria-label="Decrease sets">
                    <Minus size={16} />
                  </button>
                  <output style={{ minWidth: '32px', textAlign: 'center', fontWeight: 'bold' }}>{setQuantityVal}</output>
                  <button type="button" onClick={() => handleSetQuantityChange(setQuantityVal + 1)} aria-label="Increase sets">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
            <h3>Colors</h3>
            <div className="variation-quantity-list">
              {rows.map((row) => {
                const quantity = quantities[row.key] || 0;

                return (
                  <div className="variation-quantity-row" key={row.key}>
                    <button
                      type="button"
                      className={`color-name-chip ${row.key === activeKey ? 'active' : ''}`}
                      onClick={() => selectRow(row)}
                    >
                      {row.name}
                    </button>
                    <span className="variation-row-price">
                      {row.price != null ? formatMoney(row.price) : priceNoticeForAccess(priceAccess)}
                    </span>
                    {priceAccess?.priceGroup === 'wholesale' && !isSoldAsPc ? (
                      <span className="wholesale-qty-display" style={{ fontSize: 'var(--body-size)', color: 'var(--muted)', fontWeight: '600', paddingRight: '12px' }}>
                        {quantity} {quantity === 1 ? 'pc' : 'pcs'}
                      </span>
                    ) : (
                      <div className="quantity-stepper" aria-label={`${row.name} quantity`}>
                        <button type="button" onClick={() => setQuantity(row.key, quantity - 1)} aria-label={`Decrease ${row.name}`}>
                          <Minus size={16} />
                        </button>
                        <output>{quantity}</output>
                        <button type="button" onClick={() => setQuantity(row.key, quantity + 1)} aria-label={`Increase ${row.name}`}>
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="variation-drawer-foot">
          <div className="drawer-subtotal-row">
            <span>Subtotal</span>
            <strong>{subtotal != null ? formatMoney(subtotal) : priceNoticeForAccess(priceAccess)}</strong>
          </div>
          <div className="drawer-action-row">
            <button
              className="drawer-cart-btn"
              type="button"
              disabled={!totalQuantity}
              onClick={() => onAddToCart(selectedCartRows)}
            >
              <ShoppingBag size={18} /> Add to order list
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
