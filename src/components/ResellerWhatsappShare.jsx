/**
 * ResellerWhatsappShare Component
 * Purpose: Interactive modal enabling wholesale resellers to customize price markups (percentage or flat)
 * and generate copy-paste product specs with pristine images to share with clients via WhatsApp.
 */
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2 } from 'lucide-react';
import {
  formatMoney,
  customerPrice,
  buildWhatsappShareUrl,
  uniqueProductShareImages,
  safeFileName,
  fileFromImageUrl,
  calculateCustomerPrice,
  buildCustomerProductMessage
} from '../storefrontShared.jsx';

export function ResellerWhatsappShare({
  product,
  variant,
  quantity = 1,
  selectedColorName = '',
  imageUrl = '',
  priceAccess,
  triggerClassName = 'secondary-action-btn',
  triggerLabel = 'Customer WhatsApp',
  onClick,
  open: controlledOpen,
  onClose: controlledOnClose,
  showTrigger = true,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    }
    setInternalOpen(false);
  };
  const [mode, setMode] = useState('percentage');
  const [markupValue, setMarkupValue] = useState('20');
  const [copyState, setCopyState] = useState('idle');
  const [imageShareState, setImageShareState] = useState('idle');
  const [preparedFiles, setPreparedFiles] = useState([]);
  const [isPreparingImages, setIsPreparingImages] = useState(false);

  // Reset image state inline during render when modal reopens (no stale flash)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setPreparedFiles([]);
      setIsPreparingImages(true);
    }
  }

  const isApprovedReseller = priceAccess?.canViewPrices && (priceAccess?.priceGroup === 'reseller' || priceAccess?.priceGroup === 'wholesale');
  const basePrice = customerPrice(variant?.prices, priceAccess);
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const shareImages = useMemo(
    () => uniqueProductShareImages(product, variant, imageUrl),
    [
      imageUrl, 
      product?.id, 
      product?.images?.join(','), 
      variant?.code, 
      variant?.image
    ],
  );

  // Serialize array as a primitive string key to prevent infinite useEffect re-render loops
  const shareImagesKey = useMemo(() => shareImages.join(','), [shareImages]);

  const customerPriceValue = useMemo(
    () => calculateCustomerPrice(basePrice || 0, mode, markupValue),
    [basePrice, mode, markupValue],
  );
  const message = useMemo(
    () => buildCustomerProductMessage({
      product,
      variant,
      quantity: safeQuantity,
      selectedColorName,
      customerPriceValue,
    }),
    [customerPriceValue, product, safeQuantity, selectedColorName, variant],
  );
  const whatsappUrl = useMemo(() => buildWhatsappShareUrl(message), [message]);

  useEffect(() => {
    let isActive = true;
    if (open && isApprovedReseller && shareImages.length > 0) {
      setIsPreparingImages(true);
      setPreparedFiles([]);
      
      void Promise.allSettled(
        shareImages.map((img, i) =>
          fileFromImageUrl(img, safeFileName(`${product.title}-${variant.code}-${i + 1}`)),
        ),
      ).then((results) => {
        if (isActive) {
          const successfulFiles = results.reduce((acc, r) => {
            if (r.status === 'fulfilled') {
              acc.push(r.value);
            }
            return acc;
          }, []);
          setPreparedFiles(successfulFiles);
          setIsPreparingImages(false);
        }
      }).catch((err) => {
        console.warn('Failed to pre-load share images:', err);
        if (isActive) setIsPreparingImages(false);
      });
    } else {
      setPreparedFiles([]);
      setIsPreparingImages(false);
    }
    return () => { isActive = false; };
  }, [open, shareImagesKey, isApprovedReseller, product.title, variant.code]);

  if (!isApprovedReseller || !basePrice || !variant) return null;

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 1800);
    } catch (error) {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 1800);
    }
  }

  async function shareImageAndMessage() {
    if (imageShareState === 'preparing') return;
    
    if (preparedFiles.length === 0) {
      setImageShareState('unsupported');
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => setImageShareState('idle'), 2600);
      return;
    }

    setImageShareState('preparing');

    try {
      const basePayload = {
        title: product.title,
        text: message,
      };

      // 1. Try sharing all prepared images (up to 10)
      let currentFiles = preparedFiles;
      if (navigator.canShare && navigator.canShare({ ...basePayload, files: currentFiles }) && navigator.share) {
        await navigator.share({ ...basePayload, files: currentFiles });
        setImageShareState('shared');
        setTimeout(() => setImageShareState('idle'), 1800);
        return;
      }

      // 2. Fallback: Try sharing just the first 3 images
      if (currentFiles.length > 3) {
        currentFiles = currentFiles.slice(0, 3);
        if (navigator.canShare({ ...basePayload, files: currentFiles })) {
          await navigator.share({ ...basePayload, files: currentFiles });
          setImageShareState('shared');
          setTimeout(() => setImageShareState('idle'), 1800);
          return;
        }
      }

      // 3. Last resort fallback: Try sharing just the PRIMARY image (the one the user is looking at)
      if (currentFiles.length > 1) {
        currentFiles = currentFiles.slice(0, 1);
        if (navigator.canShare({ ...basePayload, files: currentFiles })) {
          await navigator.share({ ...basePayload, files: currentFiles });
          setImageShareState('shared');
          setTimeout(() => setImageShareState('idle'), 1800);
          return;
        }
      }

      // 4. Final fallback for browsers that don't support file sharing at all
      setImageShareState('unsupported');
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => setImageShareState('idle'), 2600);
    } catch (error) {
      console.error('Web Share API error:', error);
      setImageShareState('failed');
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => setImageShareState('idle'), 2600);
    }
  }

  const modal = open ? (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="reseller-share-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="icon-button modal-close" onClick={handleClose} aria-label="Close reseller share">
          <X size={18} />
        </button>

        <div className="reseller-share-head">
          <span>Reseller WhatsApp Share</span>
          <h3>{product.title}</h3>
          <p>Creates a customer message without website links or supplier details.</p>
        </div>

        <div className="reseller-share-summary">
          <div>
            <span>Your price</span>
            <strong>{formatMoney(basePrice)} / pc</strong>
          </div>
          <div>
            <span>Customer price</span>
            <strong>{formatMoney(customerPriceValue)} / pc</strong>
          </div>
          <div>
            <span>{String(product?.category || '').toLowerCase() === 'under 999' ? 'Total' : 'Set total'}</span>
            <strong>{formatMoney(customerPriceValue * safeQuantity)}</strong>
          </div>
        </div>

        <div className="reseller-share-controls">
          <label>
            Markup type
            <div className="reseller-markup-tabs">
              <button type="button" className={mode === 'percentage' ? 'active' : ''} onClick={() => setMode('percentage')}>%</button>
              <button type="button" className={mode === 'amount' ? 'active' : ''} onClick={() => setMode('amount')}>+ Amount</button>
              <button type="button" className={mode === 'final' ? 'active' : ''} onClick={() => setMode('final')}>Final</button>
            </div>
          </label>

          <label>
            {mode === 'percentage' ? 'Markup percentage' : mode === 'final' ? 'Final customer price' : 'Markup amount'}
            <input
              type="number"
              min="0"
              step={mode === 'percentage' ? '1' : '10'}
              value={markupValue}
              onChange={(event) => setMarkupValue(event.target.value)}
            />
          </label>
        </div>

        <label className="reseller-message-preview">
          WhatsApp message preview
          <textarea readOnly rows={10} value={message} />
        </label>

        <div className="reseller-share-actions" style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
          <button type="button" className="secondary-button" style={{ flex: 1 }} onClick={copyMessage}>
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy Description'}
          </button>
          <button 
            type="button" 
            className="primary-button" 
            style={{ 
              flex: 1.5, 
              background: isPreparingImages ? '#6b7280' : 'var(--reseller-primary, #1C1917)',
              color: 'white',
              border: 'none'
            }}
            onClick={shareImageAndMessage} 
            disabled={imageShareState === 'preparing' || (isPreparingImages && preparedFiles.length === 0)}
          >
            {imageShareState === 'shared' ? 'Shared!' : 
             imageShareState === 'preparing' ? 'Sharing...' : 
             isPreparingImages ? `Preparing (${preparedFiles.length}/${shareImages.length})` :
             'Share Catalogue'}
          </button>
        </div>
        {isPreparingImages && (
          <p style={{ fontSize: 'var(--small-size)', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
            Fetching {shareImages.length} images for high-quality sharing...
          </p>
        )}
        {(imageShareState === 'unsupported' || imageShareState === 'failed') && (
          <p className="reseller-share-footnote">
            This browser could not attach the image automatically, so WhatsApp opened with the message text.
          </p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          className={triggerClassName}
          onClick={(e) => {
            if (onClick) onClick(e);
            setInternalOpen(true);
          }}
        >
          <Share2 size={18} /> {triggerLabel}
        </button>
      )}
      {modal && typeof document !== 'undefined' ? createPortal(modal, document.body) : modal}
    </>
  );
}
