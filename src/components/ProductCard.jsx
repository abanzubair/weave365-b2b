/**
 * ProductCard Component
 * Purpose: The core visual catalog card displaying individual sarees/suits.
 * Handles interactive zoom, swatch color selection, price locks, user bookmarks (favorites),
 * and links to bulk enquiry or reseller markup WhatsApp share modals.
 */
import { memo, useMemo, useState, useEffect } from 'react';
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
  User,
  X,
  Zap,
} from 'lucide-react';
import { AppLink } from './AppLink.jsx';
import { storeConfig } from '../config.js';
import { priceNoticeForAccess } from '../utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
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
  const basePrice = customerPrice(selectedVariant.prices, priceAccess);
  const canViewPrice = basePrice != null && basePrice > 0;
  const isPriceLocked = !canViewPrice;
  const setPrice = canViewPrice ? basePrice * (product.totalColors || product.variants.length || 1) : null;
  const colorCount = product.totalColors || 1;

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
  const canResellerShare = priceAccess?.canViewPrices && (priceAccess?.priceGroup === 'reseller' || priceAccess?.priceGroup === 'wholesale');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResellerWhatsapp, setShowResellerWhatsapp] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const filteredStatusTags = useMemo(() => {
    const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
    return (product.statusTags || []).filter((tag) => {
      if (tag.key === 'bestseller') return false;
      if (tag.key === 'low-moq' && isUnder999) return false;
      if (!canViewPrice && tag.key === 'low-moq') return false;
      if (tag.key === 'low-moq' && priceAccess?.priceGroup === 'reseller' && priceAccess?.canViewPrices) return false;
      return true;
    });
  }, [product.statusTags, canViewPrice, priceAccess, product.category]);

  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
  const showMoqBadge = priceAccess?.priceGroup === 'wholesale' && !isUnder999;
  const showReadyStockBadge = isUnder999;
  const showColorBadge = colorCount > 1;
  const showRightInfo = showMoqBadge || showColorBadge || showReadyStockBadge;

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

  // Auto-close on outside click for desktop
  useEffect(() => {
    if (!showOptions || isMobile) return;

    const handleOutsideClick = (e) => {
      // If the click is outside the product card
      if (!e.target.closest('.product-card')) {
        handleClose();
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showOptions, isMobile]);

  function handleEnquiryClick() {
    if (colorCount > 1) {
      addToCart(product, selectedVariant, 1, { colorName: 'Select Color' });
    } else {
      addToCart(product, selectedVariant, 1);
    }
  }

  function handleBuyNowClick() {
    if (colorCount > 1) {
      addToCart(product, selectedVariant, 1, { colorName: 'Select Color' });
    } else {
      addToCart(product, selectedVariant, 1);
    }
  }

  return (
    <article className="product-card">
      <div className="card-media">
        <AppLink to="product" productId={product.id} className="image-button" navigate={navigate}>
          <img
            src={image}
            alt={descriptiveAlt}
            width={360}
            height={480}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.target.style.opacity = '0'; }}
          />
          {filteredStatusTags && filteredStatusTags.length > 0 && (
            <div className="card-status-badges">
              {filteredStatusTags.map((tag) => (
                <span key={tag.key} className={`status-badge tag-${tag.key}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </AppLink>
        <button type="button"
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
              <>
                <strong>{formatMoney(basePrice)} {priceAccess?.priceGroup === 'wholesale' && <span>/pc</span>}</strong>
                {priceAccess?.priceGroup === 'wholesale' && !isUnder999 && (
                  <small>{formatMoney(setPrice)} /set</small>
                )}
              </>
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
              {showMoqBadge && (
                <div className="info-item">
                  <ShoppingBag size={15} /> MOQ: 1 Set
                </div>
              )}
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

        <div className={`card-actions-new ${priceAccess?.isLoggedIn !== false ? 'has-reseller-share' : ''}`}>
          <button
            type="button"
            onClick={handleEnquiryClick}
            className="order-now-btn"
            style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff' } : {}}
          >
            <WhatsappIcon size={16} /> {enquiryState === 'sent' ? 'SENT' : 'ENQUIRY'}
          </button>
          {!priceAccess || priceAccess.isLoggedIn === false || priceAccess.buyerType === 'user' || priceAccess.priceGroup === 'guest' ? (
            <button type="button"
              className="add-to-bag-btn options-trigger-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleBuyNowClick();
              }}
            >
              <ShoppingBag size={16} /> BUY NOW
            </button>
          ) : (
            <button type="button"
              className="add-to-bag-btn options-trigger-btn"
              onClick={() => setShowOptions(true)}
            >
              <Menu size={16} /> OPTIONS
            </button>
          )}
        </div>
      </div>

      {showOptions && (() => {
        const content = (
          <div className={`card-options-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`card-options-sheet ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
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
                    <strong>Add to Order List</strong>
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
