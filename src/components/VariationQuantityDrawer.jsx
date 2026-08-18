/**
 * VariationQuantityDrawer Component
 * Purpose: A slide-up mobile sheet / desktop side-drawer that lets buyers compile B2B orders.
 * Enables selecting multiple colors, setting design-specific wholesale quantities, and calculating subtotals.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, ShoppingBag, X, Sparkles } from 'lucide-react';
import {
  calculateHybridProductPrice,
  fallbackProductImage,
  formatMoney,
} from '../storefrontShared.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import '../styles/variationQuantityDrawer.css';

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
        });
      }
      return acc;
    }, []);
  }, [colorOptions, product.images, product.variants]);

  const [activeKey, setActiveKey] = useState(rows[0]?.key || '');
  const [quantities, setQuantities] = useState(() => buildQuantityMap(rows));
  const [setQuantityVal, setSetQuantityVal] = useState(0);

  useEffect(() => {
    const initialMap = buildQuantityMap(rows);
    const activeRow = rows.find((row) => row.name === selectedColorName || row.image === selectedImage) || rows[0];
    if (activeRow) {
      initialMap[activeRow.key] = 1;
    }
    setQuantities(initialMap);
    setActiveKey(activeRow?.key || rows[0]?.key || '');
    setSetQuantityVal(0);
  }, [rows, selectedColorName, selectedImage]);

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
  const totalQuantity = Object.values(quantities).reduce((total, quantity) => total + quantity, 0);

  const pricing = useMemo(() => {
    return calculateHybridProductPrice(product, totalQuantity, product?.variants?.[0]);
  }, [product, totalQuantity]);

  const subtotal = canViewPrices ? pricing.totalPrice : null;

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
    setQuantities(() => {
      const next = {};
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

  const isUnder999 = String(product?.category || '').toLowerCase() === 'under 999';
  const showSetStepper = !isUnder999 && !isSoldAsPc && rows.length > 1;

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
          <h2 id="variation-drawer-title">Select Variations & Quantity</h2>
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
            {showSetStepper && (
              <div className="wholesale-set-stepper-container" style={{
                margin: '0 0 16px 0',
                padding: '14px 16px',
                background: '#fcf8f0',
                borderRadius: '8px',
                border: '1px solid #ebd3b4',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong style={{ fontSize: 'var(--body-size)', color: '#8c6239' }}>Quick Full Set (1 pc each color)</strong>
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

            <h3>Colors & Pieces</h3>
            <div className="variation-quantity-list">
              {rows.map((row) => {
                const quantity = quantities[row.key] || 0;
                const unitPrice = totalQuantity >= pricing.setSize ? pricing.wholesalePrice : pricing.resellerPrice;

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
                      {canViewPrices ? formatMoney(unitPrice) : priceNoticeForAccess(priceAccess)}
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

            {totalQuantity > 0 && canViewPrices && pricing.setSize > 1 && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                color: '#334155'
              }}>
                {pricing.completeSets > 0 && pricing.extraPieces === 0 && (
                  <span>✓ <strong>{pricing.completeSets} Set{pricing.completeSets > 1 ? 's' : ''} ({pricing.totalQty} pcs)</strong> at Wholesale Rate ({formatMoney(pricing.wholesalePrice)}/pc)</span>
                )}
                {pricing.completeSets === 0 && (
                  <span>ℹ️ <strong>{pricing.totalQty} pc{pricing.totalQty > 1 ? 's' : ''}</strong> at Reseller Rate ({formatMoney(pricing.resellerPrice)}/pc). Add {pricing.setSize - pricing.totalQty} more pc{pricing.setSize - pricing.totalQty > 1 ? 's' : ''} for Wholesale price!</span>
                )}
                {pricing.completeSets > 0 && pricing.extraPieces > 0 && (
                  <span>✓ <strong>{pricing.completeSets} Set</strong> @ Wholesale ({formatMoney(pricing.wholesalePrice)}/pc) + <strong>{pricing.extraPieces} extra pc{pricing.extraPieces > 1 ? 's' : ''}</strong> @ Reseller ({formatMoney(pricing.resellerPrice)}/pc)</span>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="variation-drawer-foot">
          <div className="drawer-subtotal-row">
            <span>Subtotal ({totalQuantity} pc{totalQuantity === 1 ? '' : 's'})</span>
            <strong>{subtotal != null ? formatMoney(subtotal) : priceNoticeForAccess(priceAccess)}</strong>
          </div>
          <div className="drawer-action-row">
            <button
              className="drawer-cart-btn"
              type="button"
              disabled={!totalQuantity}
              onClick={() => onAddToCart(selectedCartRows)}
            >
              <ShoppingBag size={18} /> Add to Cart
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

