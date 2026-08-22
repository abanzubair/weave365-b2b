/**
 * ProductCard Component
 * Purpose: The core visual catalog card displaying individual sarees/suits.
 * Handles interactive zoom, swatch color selection, price locks, user bookmarks (favorites),
 * and links to bulk enquiry or reseller markup WhatsApp share modals.
 */
import { memo, useMemo, useState, useEffect, useRef } from 'react';

import Image from 'next/image';
import { createPortal } from 'react-dom';
import {
  Bookmark,
  ChevronRight,
  Heart,
  Layers,
  Menu,
  Palette,
  Share2,
  ShoppingBag,
  X,
  Zap,
} from 'lucide-react';
import { AppLink } from './AppLink.jsx';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import {
  fallbackProductImage,
  buildSingleProductWhatsappUrl,
  customerPrice,
  formatMoney,
  useCurrency
} from '../storefrontShared.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import { ResellerShareModal } from './ResellerShareModal.jsx';
import { ResellerWhatsappShare } from './ResellerWhatsappShare.jsx';
import { EnquiryPopup } from './EnquiryPopup.jsx';

export const ProductCard = memo(function ProductCard({
  product,
  variant,
  navigate,
  addToCart,
  toggleFavorite,
  isFavorite,
  priceAccess,
  openAuth,
}) {
  useCurrency();
  const selectedVariant = variant || product.variants[0];
  const image = product.images[0] || fallbackProductImage;
  const wholesalePrice = Number(selectedVariant?.prices?.mrp || selectedVariant?.prices?.offer || 0);
  const resellerPrice = Number(selectedVariant?.prices?.b2r || selectedVariant?.prices?.single || wholesalePrice);
  const canViewPrice = wholesalePrice > 0 || resellerPrice > 0;
  const isPriceLocked = !canViewPrice;
  const colorCount = product.totalColors || product.variants?.length || 1;
  const setPrice = wholesalePrice * colorCount;

  const descriptiveAlt = useMemo(() => {
    const parts = [];
    const color = selectedVariant?.color || (product.colorOptions && product.colorOptions[0]?.name) || '';
    if (color) parts.push(color);
    if (product.purity) parts.push(product.purity);
    if (product.fabric) parts.push(product.fabric);
    if (product.work) parts.push(product.work);
    parts.push(product.category || 'Saree');
    parts.push('Wholesale');
    return parts.filter(Boolean).join(' ');
  }, [product, selectedVariant]);

  const [enquiryState, setEnquiryState] = useState('idle');
  const [popupOpen, setPopupOpen] = useState(false);
  const whatsappUrl = buildSingleProductWhatsappUrl(product, selectedVariant, 1, undefined, undefined, priceAccess);
  const canResellerShare = priceAccess?.canViewPrices !== false;
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResellerWhatsapp, setShowResellerWhatsapp] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
  const filteredStatusTags = useMemo(() => {
    return (product.statusTags || []).filter((tag) => {
      if (tag.key === 'bestseller') return false;
      if (tag.key === 'low-moq' && isUnder999) return false;
      if (!canViewPrice && tag.key === 'low-moq') return false;
      return true;
    });
  }, [product.statusTags, canViewPrice, isUnder999]);

  const showReadyStockBadge = product.isReadyStock || (isUnder999 && !product.isOutOfStock);
  const showColorBadge = colorCount > 1;
  const showRightInfo = showColorBadge || showReadyStockBadge;


  const cardRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 820px)');
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowOptions(false);
      setIsClosing(false);
    }, 250); // Match CSS animation duration
  };

  useEffect(() => {
    if (!showOptions) return;

    const handleOutsideClick = (e) => {
      // If click is inside the sheet itself, don't close
      if (sheetRef.current && sheetRef.current.contains(e.target)) {
        return;
      }
      // On desktop, if click is outside the product card, close options
      if (!isMobile && cardRef.current && !cardRef.current.contains(e.target)) {
        handleClose();
        return;
      }
      // On mobile portal, if click is outside the sheet, close options
      if (isMobile && sheetRef.current && !sheetRef.current.contains(e.target)) {
        handleClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showOptions, isMobile]);

  const handleBuyNowClick = (e) => {
    if (e) e.stopPropagation();
    if (product.isOutOfStock) {
      handleEnquiryClick(e);
      return;
    }
    if (typeof addToCart === 'function') {
      const defaultColor = selectedVariant?.color || product?.colorOptions?.[0]?.name || '';
      addToCart(product, selectedVariant, 1, { colorName: defaultColor });
    }
  };

  const handleEnquiryClick = (e) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && !window.open(whatsappUrl, '_blank')) {
      setPopupOpen(true);
    }
    setEnquiryState('sent');
    setTimeout(() => setEnquiryState('idle'), 3000);
  };

  return (
    <article className="product-card" ref={cardRef}>
      <div className="card-media">

        <AppLink 
          to="product" 
          productId={product.id} 
          navigate={navigate}
          className="image-button"
          aria-label={`View details for ${product.title}`}
        >
          <img
            src={image}
            alt={descriptiveAlt}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.currentTarget.src = fallbackProductImage; }}
          />
        </AppLink>

        {filteredStatusTags.length > 0 && (
          <div className="card-status-badges">
            {filteredStatusTags.slice(0, 2).map((tag) => (
              <span key={tag.key} className={`status-badge tag-${tag.key}`}>
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className="save-btn-circle"
          onClick={() => toggleFavorite(product)}
          data-selected={isFavorite || undefined}
          aria-label={isFavorite ? "Remove from saved" : "Save for later"}
        >
          <Bookmark size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>


      <div className="product-card-copy">
        <h3 className="card-title" style={{ cursor: 'pointer' }}>
          <AppLink 
            to="product" 
            productId={product.id} 
            navigate={navigate}
            style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}
          >
            {product.title}
          </AppLink>
        </h3>

        <div className={`card-info-grid ${(isPriceLocked || !showRightInfo) ? 'price-locked' : ''}`}>
          <div className="info-left">
            {!isPriceLocked ? (
              <strong>{formatMoney(resellerPrice)} <span className="price-unit">/pc</span></strong>
            ) : (
              <div className="price-pending-notice">
                <div className="notice-text">
                  <strong>{priceNoticeForAccess(priceAccess)}</strong>
                  <span>Prices will be visible once approved</span>
                </div>
              </div>
            )}
          </div>

          {canViewPrice && showRightInfo && (
            <div className="info-right">
              {showReadyStockBadge && (
                <div className="info-item">
                  <Zap size={15} /> Ready Stock
                </div>
              )}
              {showColorBadge && (
                <div className="info-item">
                  <Palette size={15} /> {colorCount} Colors
                </div>
              )}
            </div>
          )}

        </div>

        <div className="card-actions-new has-reseller-share">
          <button
            type="button"
            onClick={handleBuyNowClick}
            className="buy-card-btn"
          >
            <ShoppingBag size={15} /> {product.isOutOfStock ? 'ENQUIRE' : 'BUY'}
          </button>
          <button type="button"
            className="add-to-bag-btn options-trigger-btn"
            onClick={() => setShowOptions(true)}
          >
            <Menu size={16} /> OPTIONS
          </button>
        </div>

      </div>

      {showOptions && (() => {
        const content = (
          <div className={`card-options-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`card-options-sheet ${isClosing ? 'closing' : ''}`} ref={sheetRef} onClick={e => e.stopPropagation()}>
              <div className="sheet-header">

                <div className="sheet-handle" />
                <span className="sheet-title">Product Options</span>
                <button type="button" className="sheet-close" onClick={handleClose}>
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="sheet-list">
                <button type="button" className="sheet-item" onClick={() => { handleClose(); handleEnquiryClick(); }}>
                  <div className="item-icon whatsapp"><WhatsappIcon size={20} /></div>
                  <div className="item-copy">
                    <strong>Buy Now</strong>
                    <span>Place your order on WhatsApp</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button type="button" className="sheet-item" onClick={() => { handleClose(); handleBuyNowClick(); }}>
                  <div className="item-icon bag"><ShoppingBag size={20} /></div>
                  <div className="item-copy">
                    <strong>Add to Cart</strong>
                    <span>Save and shop later</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button type="button" className="sheet-item" onClick={() => { handleClose(); toggleFavorite(product); }}>
                  <div className="item-icon heart"><Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} /></div>
                  <div className="item-copy">
                    <strong>{isFavorite ? 'Remove from Favourite' : 'Add to Favourite'}</strong>
                    <span>Save to your wishlist</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                {priceAccess?.canViewPrices && (
                  <>
                    <div className="sheet-divider" />

                    <button type="button"
                      className="sheet-item reseller-primary"
                      onClick={() => { handleClose(); setShowResellerWhatsapp(true); }}
                    >
                      <div className="item-icon share"><Share2 size={20} /></div>
                      <div className="item-copy">
                        <strong>Share with Customer</strong>
                        <span>Share with your own markup</span>
                      </div>
                      <ChevronRight size={18} className="item-chevron" />
                    </button>

                    {canResellerShare && (
                      <button type="button" className="sheet-item" onClick={() => { handleClose(); setShowShareModal(true); }}>
                        <div className="item-icon link"><Layers size={20} /></div>
                        <div className="item-copy">
                          <strong>White-label Link</strong>
                          <span>Add product to your website</span>
                        </div>
                        <ChevronRight size={18} className="item-chevron" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );

        return isMobile ? createPortal(content, document.body) : content;
      })()}

      <EnquiryPopup
        open={popupOpen}
        onClose={() => setPopupOpen(false)}
        whatsappUrl={whatsappUrl}
      />

      {showShareModal && (
        <ResellerShareModal
          product={product}
          variant={selectedVariant}
          user={{ id: priceAccess.userId }}
          priceAccess={priceAccess}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {priceAccess?.canViewPrices && (
        <ResellerWhatsappShare
          product={product}
          variant={selectedVariant}
          quantity={colorCount}
          priceAccess={priceAccess}
          open={showResellerWhatsapp}
          onClose={() => setShowResellerWhatsapp(false)}
          showTrigger={false}
        />
      )}
    </article>
  );
});
