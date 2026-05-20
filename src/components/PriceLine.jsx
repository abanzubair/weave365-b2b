/**
 * PriceLine Component
 * Purpose: Renders dynamic pricing lines displaying MRP, wholesale rates, and active discount slabs.
 * Handles locking/masking wholesale prices for guest users to protect B2B buyer exclusivity.
 */
import { formatMoney, customerPrice, priceNoticeForAccess } from '../storefrontShared.jsx';

export function PriceLine({ prices, priceAccess }) {
  const buyPrice = customerPrice(prices, priceAccess);

  return (
    <p className="price-line">
      {buyPrice == null ? (
        <strong className="price-locked-text">{priceNoticeForAccess(priceAccess)}</strong>
      ) : prices.offer ? (
        <>
          <strong>{formatMoney(buyPrice)} <small className="price-unit">/piece</small></strong>
          {prices.mrp && (
            <>
              <span>{formatMoney(prices.mrp)}</span>
              <em>MRP</em>
            </>
          )}
        </>
      ) : (
        buyPrice > 0 && <strong>{formatMoney(buyPrice)} <small className="price-unit">/piece</small></strong>
      )}
    </p>
  );
}
