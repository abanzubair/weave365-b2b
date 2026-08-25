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
  ChevronDown,
  Download,
  PackageCheck,
  Palette,
  Share2,
  ShoppingBag,
  X,
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
  const isOutOfStock = Boolean(product.isOutOfStock || product.stockStatusOverride === 'out-of-stock');

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
  const [showBuyPanel, setShowBuyPanel] = useState(false);
  const [showSellPanel, setShowSellPanel] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
  const filteredStatusTags = useMemo(() => {
    let tags = (product.statusTags || []).map((tag) => {
      if (tag && tag.key === 'new-arrivals') {
        return { key: 'new-arrival', label: 'New Arrival' };
      }
      return tag;
    });

    if (product.isNew && !tags.some((t) => t.key === 'new-arrival')) {
      tags = [{ key: 'new-arrival', label: 'New Arrival' }, ...tags];
    }

    return tags.filter((tag) => {
      if (tag.key === 'bestseller') return false;
      if (tag.key === 'ready-stock') return false;
      if (tag.key === 'low-moq' && isUnder999) return false;
      if (!canViewPrice && tag.key === 'low-moq') return false;
      return true;
    });
  }, [product.statusTags, product.isNew, canViewPrice, isUnder999]);

  const showColorBadge = colorCount > 1;
  const showRightInfo = showColorBadge;


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
      setShowBuyPanel(false);
      setShowSellPanel(false);
      setIsClosing(false);
    }, 250); // Match CSS animation duration
  };

  useEffect(() => {
    if (!showBuyPanel && !showSellPanel) return;

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
  }, [showBuyPanel, showSellPanel, isMobile]);

  const handleDownloadPhotos = async () => {
    if (!priceAccess?.userId) {
      handleClose();
      if (typeof navigate === 'function') {
        navigate('signup');
      } else if (typeof openAuth === 'function') {
        openAuth();
      }
      return;
    }

    try {
      setIsDownloading(true);

      const [{ default: JSZip }, fileSaverModule] = await Promise.all([
        import('jszip'),
        import('file-saver'),
      ]);
      const saveAs = fileSaverModule?.saveAs || fileSaverModule?.default || fileSaverModule;
      const zip = new JSZip();

      const isSaree = String(product.category || '').toLowerCase() === 'saree';
      const lengthText = isSaree ? '6.3m (including 85cm Blouse)' : (product.length || 'Standard');
      const isWholesaler = priceAccess?.priceGroup === 'wholesale';
      const shippingLine = isWholesaler ? 'Excluded: GST & Shipping' : 'Included: Free Shipping in India (Excluding GST)';
      let priceText = 'On request';
      if (resellerPrice > 0) {
        priceText = `${formatMoney(resellerPrice)} /pc`;
      }

      const detailsLines = [
        `Code: ${selectedVariant?.code || 'N/A'}`,
        `Price: ${priceText}`,
        shippingLine,
        '',
        `${product.title}`,
        '',
        `Description:`,
        product.description || product.summary || 'No description available.',
        '',
        `Specifications:`,
        `- Fabric: ${product.fabric || ''}`,
        `- Work: ${product.work || ''}`,
        `- Pattern: ${product.pattern || ''}`,
        `- Occasion: ${product.occasion || ''}`,
        `- Weave: ${product.weave || ''}`,
        `- Purity: ${product.purity || ''}`,
        `- Type: ${product.type || ''}`,
        `- Length: ${lengthText}`,
        '',
        `Disclaimer: Slight variations in color, fabric, and weaving are possible. Model images are for reference only.`
      ];
      zip.file('product-details.txt', detailsLines.join('\n'));

      const safeTitle = product.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const validImages = Array.from(new Set(product.images || [])).filter(Boolean);
      let successCount = 0;

      await Promise.allSettled(
        validImages.map(async (url, index) => {
          try {
            let blob = null;
            if (url.startsWith('http')) {
              try {
                const proxyRes = await fetch(`/api/image?url=${encodeURIComponent(url)}`);
                if (proxyRes.ok) {
                  blob = await proxyRes.blob();
                }
              } catch (proxyErr) {
                console.warn(`Proxy fetch failed for image ${index + 1}:`, proxyErr);
              }
            }

            if (!blob) {
              const directRes = await fetch(url);
              if (directRes.ok) {
                blob = await directRes.blob();
              }
            }

            if (blob) {
              const ext = blob.type?.includes('png') ? 'png' : blob.type?.includes('webp') ? 'webp' : 'jpg';
              const filename = `${safeTitle}-${index + 1}.${ext}`;
              zip.file(filename, blob);
              successCount++;
            }
          } catch (imgErr) {
            console.warn(`Failed to process image ${index + 1}:`, imgErr);
          }
        })
      );

      if (successCount === 0 && validImages.length > 0) {
        throw new Error('Failed to download image assets');
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const filename = `${product.title.replace(/\s+/g, '-').toLowerCase()}-catalogue.zip`;
      if (typeof saveAs === 'function') {
        saveAs(content, filename);
      } else {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 40000);
      }
      handleClose();
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download images. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBuyNowDirect = (e) => {
    if (e) e.stopPropagation();
    handleClose();
    if (product.isOutOfStock) {
      handleEnquiryClick(e);
      return;
    }
    if (typeof addToCart === 'function') {
      const defaultColor = selectedVariant?.color || product?.colorOptions?.[0]?.name || '';
      addToCart(product, selectedVariant, 1, { colorName: defaultColor });
    }
  };

  const handleAddToCartOnly = (e) => {
    if (e) e.stopPropagation();
    handleClose();
    if (product.isOutOfStock) {
      handleEnquiryClick(e);
      return;
    }
    if (typeof addToCart === 'function') {
      const defaultColor = selectedVariant?.color || product?.colorOptions?.[0]?.name || '';
      addToCart(product, selectedVariant, 1, { colorName: defaultColor });
    }
  };

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
            onClick={(e) => {
              e.stopPropagation();
              setShowBuyPanel(false);
              setShowSellPanel(true);
            }}
            className="buy-card-btn sell-card-btn"
          >
            SELL THIS
          </button>
          <button type="button"
            className="add-to-bag-btn buy-trigger-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowSellPanel(false);
              setShowBuyPanel(true);
            }}
          >
            BUY NOW
          </button>
        </div>

      </div>

      {showSellPanel && (() => {
        const content = (
          <div className={`card-options-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`card-options-sheet ${isClosing ? 'closing' : ''}`} ref={sheetRef} onClick={e => e.stopPropagation()}>
              <div className="sheet-header">
                <div className="sheet-handle" />
                <span className="sheet-title">Reseller Tools</span>
                <button type="button" className="sheet-close" onClick={handleClose} aria-label="Close panel">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="sheet-list">
                <button
                  type="button"
                  className="sheet-item reseller-primary"
                  onClick={() => {
                    handleClose();
                    setShowResellerWhatsapp(true);
                  }}
                >
                  <div className="item-icon share"><Share2 size={20} /></div>
                  <div className="item-copy">
                    <strong>Share</strong>
                    <span>Share catalog on WhatsApp</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button
                  type="button"
                  className="sheet-item"
                  onClick={async () => {
                    if (isDownloading) return;
                    await handleDownloadPhotos();
                  }}
                  disabled={isDownloading}
                >
                  <div className="item-icon download"><Download size={20} /></div>
                  <div className="item-copy">
                    <strong>{isDownloading ? 'Downloading...' : 'Download'}</strong>
                    <span>Download photos & specs</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>
              </div>
            </div>
          </div>
        );

        return isMobile ? createPortal(content, document.body) : content;
      })()}

      {showBuyPanel && (() => {
        const content = (
          <div className={`card-options-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
            <div className={`card-options-sheet ${isClosing ? 'closing' : ''}`} ref={sheetRef} onClick={e => e.stopPropagation()}>
              <div className="sheet-header">
                <div className="sheet-handle" />
                <span className="sheet-title">Buy Options</span>
                <button type="button" className="sheet-close" onClick={handleClose} aria-label="Close panel">
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="sheet-list">
                <button
                  type="button"
                  className={`sheet-item ${isOutOfStock ? 'disabled' : ''}`}
                  onClick={handleBuyNowDirect}
                  disabled={isOutOfStock}
                >
                  <div className="item-icon package"><PackageCheck size={20} /></div>
                  <div className="item-copy">
                    <strong>Buy Now</strong>
                    <span>{isOutOfStock ? 'Currently out of stock' : 'Add to bag & checkout'}</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button
                  type="button"
                  className={`sheet-item ${isOutOfStock ? 'disabled' : ''}`}
                  onClick={handleAddToCartOnly}
                  disabled={isOutOfStock}
                >
                  <div className="item-icon bag"><ShoppingBag size={20} /></div>
                  <div className="item-copy">
                    <strong>Add to Cart</strong>
                    <span>{isOutOfStock ? 'Currently out of stock' : 'Add item to your cart'}</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button
                  type="button"
                  className="sheet-item"
                  onClick={(e) => {
                    handleClose();
                    handleEnquiryClick(e);
                  }}
                >
                  <div className="item-icon whatsapp"><WhatsappIcon size={20} /></div>
                  <div className="item-copy">
                    <strong>Enquiry</strong>
                    <span>Chat with us on WhatsApp</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>
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
