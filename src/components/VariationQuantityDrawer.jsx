/**
 * VariationQuantityDrawer Component
 * Purpose: A slide-up mobile sheet / desktop side-drawer that lets buyers compile B2B orders.
 * Enables selecting multiple colors, setting design-specific wholesale quantities, and calculating subtotals.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
}) {
  const rows = useMemo(() => {
    const source = colorOptions.length
      ? colorOptions
      : product.variants.map((variant) => ({
        name: variant.color || variant.code,
        image: variant.image,
      }));

    const seen = new Set();
    return source
      .map((option, index) => {
        const name = option.name || `Color ${index + 1}`;
        const variant = product.variants.find((item) => item.color === option.name) || product.variants[0];
        const image = option.image || variant?.image || product.images[index] || product.images[0] || fallbackProductImage;
        const key = `${name}-${image || index}`;

        return {
          key,
          name,
          image,
          variant,
          price: customerPrice(variant?.prices || {}, priceAccess),
        };
      })
      .filter((row) => {
        if (!row.variant || seen.has(row.key)) return false;
        seen.add(row.key);
        return true;
      });
  }, [colorOptions, priceAccess, product.images, product.variants]);

  const [activeKey, setActiveKey] = useState(rows[0]?.key || '');
  const [quantities, setQuantities] = useState(() => buildQuantityMap(rows));

  useEffect(() => {
    setQuantities(buildQuantityMap(rows));
    const activeRow = rows.find((row) => row.name === selectedColorName || row.image === selectedImage) || rows[0];
    setActiveKey(activeRow?.key || '');
  }, [rows, selectedColorName, selectedImage]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('drawer-lock');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('drawer-lock');
    };
  }, [onClose, open]);

  const selectedRow = rows.find((row) => row.key === activeKey) || rows[0];
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const subtotal = canViewPrices
    ? rows.reduce((total, row) => total + (row.price || 0) * (quantities[row.key] || 0), 0)
    : null;
  const totalQuantity = Object.values(quantities).reduce((total, quantity) => total + quantity, 0);
  const selectedCartRows = useMemo(
    () => rows
      .map((row) => ({
        variant: row.variant,
        quantity: quantities[row.key] || 0,
        colorName: row.name,
        image: row.image,
      }))
      .filter((row) => row.quantity > 0),
    [quantities, rows],
  );

  const setQuantity = useCallback((key, nextQuantity) => {
    setQuantities((current) => ({
      ...current,
      [key]: Math.max(0, nextQuantity),
    }));
  }, []);

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
                    <div className="quantity-stepper" aria-label={`${row.name} quantity`}>
                      <button type="button" onClick={() => setQuantity(row.key, quantity - 1)} aria-label={`Decrease ${row.name}`}>
                        <Minus size={16} />
                      </button>
                      <output>{quantity}</output>
                      <button type="button" onClick={() => setQuantity(row.key, quantity + 1)} aria-label={`Increase ${row.name}`}>
                        <Plus size={16} />
                      </button>
                    </div>
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
