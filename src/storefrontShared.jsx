import { memo, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  Download,
  Heart,
  Headphones,
  Layers,
  LockKeyhole,
  Bookmark,
  Package,
  PackageCheck,
  Palette,
  Share2,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  Truck,
  User,
  ZoomIn,
  BellRing,
  X,
  Menu,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { storeConfig } from './config.js';
import { priceForBuyer, priceNoticeForAccess } from './utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import {
  CURRENCIES,
  CurrencyManager,
  useCurrency,
  formatMoney,
  formatWeight,
  customerPrice,
  parsePositiveNumber
} from './utils/priceUtils.js';

export {
  CURRENCIES,
  CurrencyManager,
  useCurrency,
  formatMoney,
  formatWeight,
  customerPrice,
  parsePositiveNumber
};
import { ResellerShareModal } from './components/ResellerShareModal.jsx';

export const fallbackProductImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const WhatsappIcon = ({ size = 14, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

// Moved to ./utils/priceUtils.js

const productTrustItems = [
  { icon: Truck, title: 'Pan India & Worldwide Delivery', copy: 'Secure shipping across India & overseas' },
  { icon: Tag, title: 'Best Wholesale Prices', copy: 'Get the best prices on bulk orders' },
  { icon: ShieldCheck, title: 'Quality Guaranteed', copy: 'Every piece is hand-inspected for perfection' },
  { icon: Headphones, title: 'Dedicated Support', copy: "We're here to help you at every step" },
];

export function SectionTitle({ title, align = 'center' }) {
  return (
    <div className={`section-title ${align}`}>
      <h2>{title}</h2>
      <span />
    </div>
  );
}

export function StateMessage({ status, error }) {
  if (status === 'loading') return <p className="empty-state">Loading live catalogue...</p>;
  if (status === 'error') return <p className="error-state">{error}</p>;
  return null;
}

export function Newsletter() {
  return (
    <section className="newsletter">
      <div>
        <BellRing />
        <span>
          <strong>Stay Updated</strong>
          Sign up for our newsletter and get updates on new arrivals, exclusive offers and more.
        </span>
      </div>
      <div className="newsletter-actions">
        <a
          href={storeConfig.whatsappGroup || "https://chat.whatsapp.com/your-group-id"}
          target="_blank"
          rel="noreferrer"
          className="whatsapp-group-btn"
        >
          <WhatsappIcon size={18} /> Join WhatsApp Group
        </a>
        <span className="divider-text">OR</span>
        <form onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Enter your email" />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </section>
  );
}

export function ProductTrustStrip() {
  return (
    <section className="product-trust-strip">
      {productTrustItems.map(({ icon: Icon, title, copy }) => (
        <div key={title}>
          <Icon />
          <span>
            <strong>{title}</strong>
            {copy}
          </span>
        </div>
      ))}
    </section>
  );
}

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
  const setPrice = canViewPrice ? basePrice * (product.totalColors || product.variants.length || 1) : null;
  const colorCount = product.totalColors || 1;
  const soldCount = Math.floor(50 + (product.id?.charCodeAt?.(0) || 0) % 80) + '+';

  const [enquiryState, setEnquiryState] = useState('idle');
  const [popupOpen, setPopupOpen] = useState(false);
  const whatsappUrl = buildSingleProductWhatsappUrl(product, selectedVariant, 1, undefined, undefined, priceAccess);
  const canResellerShare = priceAccess?.canViewPrices && priceAccess?.priceGroup === 'reseller';
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResellerWhatsapp, setShowResellerWhatsapp] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  async function handleEnquiryClick() {
    if (enquiryState === 'sending') return;
    setEnquiryState('sending');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('inquiries').insert({
          user_id: priceAccess?.userId || undefined,
          email: priceAccess?.userEmail || undefined,
          buyer_name: priceAccess?.buyerName || 'Guest Buyer',
          phone: priceAccess?.buyerPhone || undefined,
          pincode: priceAccess?.buyerPincode || undefined,
          inquiry_type: 'product',
          status: 'new',
          product_group_key: String(product.id),
          variant_code: selectedVariant.code,
          message: `Enquiry for ${product.title}`,
          items: [{
            product_id: product.id,
            product_title: product.title,
            variant_code: selectedVariant.code,
            quantity: 1,
            priceGroup: priceAccess?.priceGroup || 'pending',
          }],
        });
      } catch (err) {
        console.error('Failed to log inquiry to Supabase:', err);
      }
    }

    setEnquiryState('sent');
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <article className="product-card">
      <div className="card-media">
        <button className="image-button" onClick={() => navigate('product', product.id)}>
          <img
            src={image}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onError={(e) => { e.target.style.opacity = '0'; }}
          />
          {product.statusTags && product.statusTags.length > 0 && (
            <div className="card-status-badges">
              {product.statusTags.map((tag) => (
                <span key={tag.key} className={`status-badge tag-${tag.key}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </button>
        <button
          className="save-btn-circle"
          onClick={() => toggleFavorite(product)}
          data-selected={isFavorite || undefined}
          aria-label={isFavorite ? "Remove from saved" : "Save for later"}
        >
          <Bookmark size={15} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="product-card-copy">
        <h3 className="card-title" onClick={() => navigate('product', product.id)}>
          {product.title}
        </h3>

        <div className={`card-info-grid ${priceAccess?.isLoggedIn === false ? 'is-guest' : ''} ${!canViewPrice ? 'price-locked' : ''}`}>
          <div className="info-left">
            {priceAccess?.isLoggedIn !== false && (
              <>
                {canViewPrice && <label>PRICE</label>}
                {canViewPrice ? (
                  <>
                    <strong>{formatMoney(basePrice)} <span>/ pc</span></strong>
                    <small>{formatMoney(setPrice)} / set</small>
                  </>
                ) : (
                  <div className="price-pending-notice">
                    <div className="notice-text">
                      <strong>{priceNoticeForAccess(priceAccess)}</strong>
                      <span>Prices will be visible once approved</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {priceAccess?.isLoggedIn !== false && canViewPrice && (
            <div className="info-right">
              <div className="info-item">
                <ShoppingBag size={15} /> MOQ 1 Set
              </div>
              {colorCount > 1 && (
                <div className="info-item">
                  <Palette size={15} /> {colorCount} Colors
                </div>
              )}
            </div>
          )}
        </div>



        <div className={`card-actions-new ${canResellerShare ? 'has-reseller-share' : ''}`}>
          {priceAccess?.isLoggedIn === false ? (
            <button
              className="order-now-btn guest-login-btn"
              onClick={(e) => {
                e.stopPropagation();
                openAuth();
              }}
            >
              <User size={16} /> LOGIN TO VIEW PRICE
            </button>
          ) : canResellerShare ? (
            <>
              <button
                type="button"
                onClick={handleEnquiryClick}
                className="order-now-btn"
                style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff' } : {}}
              >
                <WhatsappIcon size={16} /> {enquiryState === 'sent' ? 'SENT' : 'ENQUIRY'}
              </button>
              <button
                className="add-to-bag-btn options-trigger-btn"
                onClick={() => setShowOptions(true)}
              >
                <Menu size={16} /> OPTIONS
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleEnquiryClick}
                className="order-now-btn"
                style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff' } : {}}
              >
                <WhatsappIcon size={16} /> {enquiryState === 'sent' ? 'SENT' : 'ENQUIRY'}
              </button>
              <button className="add-to-bag-btn" onClick={() => addToCart(product, selectedVariant, 1)}>
                <ShoppingBag size={16} /> ADD TO BAG
              </button>
            </>
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
                <button className="sheet-close" onClick={handleClose}>
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="sheet-list">
                <button className="sheet-item" onClick={() => { handleClose(); handleEnquiryClick(); }}>
                  <div className="item-icon whatsapp"><WhatsappIcon size={20} /></div>
                  <div className="item-copy">
                    <strong>Buy via WhatsApp</strong>
                    <span>Get assistance & place your order</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button className="sheet-item" onClick={() => { handleClose(); handleEnquiryClick(); }}>
                  <div className="item-icon zap"><Zap size={20} /></div>
                  <div className="item-copy">
                    <strong>Order Now</strong>
                    <span>Quick checkout via enquiry</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button className="sheet-item" onClick={() => { handleClose(); addToCart(product, selectedVariant, 1); }}>
                  <div className="item-icon bag"><ShoppingBag size={20} /></div>
                  <div className="item-copy">
                    <strong>Add to Cart</strong>
                    <span>Save and shop later</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button className="sheet-item" onClick={() => { handleClose(); toggleFavorite(product); }}>
                  <div className="item-icon heart"><Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} /></div>
                  <div className="item-copy">
                    <strong>{isFavorite ? 'Remove from Favourite' : 'Add to Favourite'}</strong>
                    <span>Save to your wishlist</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <div className="sheet-divider" />

                <button
                  className="sheet-item reseller-primary"
                  onClick={() => { handleClose(); setShowResellerWhatsapp(true); }}
                >
                  <div className="item-icon share"><Share2 size={20} /></div>
                  <div className="item-copy">
                    <strong>WhatsApp Customer</strong>
                    <span>Share with your own markup</span>
                  </div>
                  <ChevronRight size={18} className="item-chevron" />
                </button>

                <button className="sheet-item" onClick={() => { handleClose(); setShowShareModal(true); }}>
                  <div className="item-icon link"><Layers size={20} /></div>
                  <div className="item-copy">
                    <strong>Catalog Link</strong>
                    <span>Create white-label customer link</span>
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

      {canResellerShare && (
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

export function expandedProductCards(products) {
  if (!products.length) return [];

  return products.flatMap((product) => {
    const images = product.images.length ? product.images : [fallbackProductImage];
    return images.map((image, index) => ({
      product,
      image,
      variant: product.variants[index] || product.variants[0],
    }));
  });
}



function calculateCustomerPrice(basePrice, mode, value) {
  const amount = parsePositiveNumber(value);

  if (mode === 'percentage') {
    return Math.round(basePrice + (basePrice * amount / 100));
  }

  if (mode === 'final') {
    return Math.max(basePrice, Math.round(amount || basePrice));
  }

  return Math.round(basePrice + amount);
}

function buildCustomerProductMessage({ product, variant, quantity, selectedColorName, customerPriceValue }) {
  const length = product.length || product.sareeLength || product.raw?.Length || product.raw?.['Saree Length'] || '6.3m (incl. 85cm blouse)';
  const lines = [
    product?.title || 'Product details',
    `Code: ${variant?.code || 'On request'}`,
    `Price: ${formatMoney(customerPriceValue)} / piece`,
    '',
    '*Specification:*',
    quantity > 1 ? `Colors: ${quantity}` : '',
    product.fabric ? `Fabric: ${product.fabric}` : '',
    product.work ? `Work: ${product.work}` : '',
    product.pattern ? `Pattern: ${product.pattern}` : '',
    product.weave ? `Weave: ${product.weave}` : '',
    '',
    product.purity ? `Purity: ${product.purity}` : '',
    product.type ? `Type: ${product.type}` : '',
    length ? `Length: ${length}` : '',
    '',
    '*Disclaimer:* Slight variations in color, fabric, and weaving are possible. Making a payment indicates your agreement to this. *Cover image is for reference only.*',
    '',
    'Reply here to order or ask any question.',
  ].filter(Boolean);

  return lines.join('\n');
}

function buildWhatsappShareUrl(message) {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

function uniqueProductShareImages(product, variant, fallbackImage) {
  const images = [
    variant?.image,
    fallbackImage,
    ...(product?.images || []),
    ...(product?.colorOptions || []).map((option) => option.image),
    ...(product?.variants || []).map((item) => item.image),
  ].filter(Boolean);

  // Return unique images. Limit to 15 to prevent Web Share API / App limits (e.g. WhatsApp) from rejecting the payload.
  return Array.from(new Set(images))
    .filter((image) => image !== fallbackProductImage)
    .slice(0, 15);
}

function shareImageProxyUrl(imageUrl) {
  if (!imageUrl || imageUrl.startsWith('data:')) return imageUrl;
  // Further optimize images: 600px width, 60% quality. 
  // Smaller files are MUCH more likely to be accepted by the Web Share API and mobile OSs.
  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=600&q=60&output=jpg`;
}

async function fileFromImageUrl(imageUrl, filename) {
  const response = await fetch(shareImageProxyUrl(imageUrl));
  if (!response.ok) throw new Error('Unable to prepare product image');

  const blob = await response.blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';

  return new File([blob], `${filename}.${extension}`, { type });
}

function safeFileName(value) {
  return String(value || 'product-image').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'product-image';
}

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



  const isApprovedReseller = priceAccess?.canViewPrices && priceAccess?.priceGroup === 'reseller';
  const basePrice = customerPrice(variant?.prices, priceAccess);
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  const shareImages = useMemo(
    () => uniqueProductShareImages(product, variant, imageUrl),
    [imageUrl, product, variant],
  );
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
          const successfulFiles = results
            .filter((r) => r.status === 'fulfilled')
            .map((r) => r.value);
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
  }, [open, shareImages, isApprovedReseller, product.title, variant.code]);

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

      // 1. Try sharing all prepared images (up to 15)
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
        <button className="icon-button modal-close" onClick={handleClose} aria-label="Close reseller share">
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
            <span>Set total</span>
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
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy Message'}
          </button>
          <button 
            type="button" 
            className="primary-button share-btn" 
            style={{ flex: 1.5, background: isPreparingImages ? '#6b7280' : 'var(--primary-color)' }}
            onClick={shareImageAndMessage} 
            disabled={imageShareState === 'preparing' || (isPreparingImages && preparedFiles.length === 0)}
          >
            {imageShareState === 'shared' ? 'Shared!' : 
             imageShareState === 'preparing' ? 'Sharing...' : 
             isPreparingImages ? `Preparing (${preparedFiles.length}/${shareImages.length})` :
             'Share Image + Text'}
          </button>
        </div>
        {isPreparingImages && (
          <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', textAlign: 'center' }}>
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
          {triggerLabel}
        </button>
      )}
      {modal && typeof document !== 'undefined' ? createPortal(modal, document.body) : modal}
    </>
  );
}

export function buildWhatsappUrl(items, total, pincode, codStatus, priceAccess) {
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const lines = [
    `Hello ${storeConfig.name}, I want to enquire about these sarees:`,
    '',
    ...items.map((item) => {
      const price = customerPrice(item.variant.prices, priceAccess);
      const color = item.selectedColorName ? ` | Color: ${item.selectedColorName}` : '';
      const priceText = canViewPrices && price != null ? ` | Price: ${formatMoney(price)}` : '';
      return `${item.product.title} | Code: ${item.variant.code}${color} | Qty: ${item.quantity}${priceText}`;
    }),
    '',
    canViewPrices && total != null ? `Estimated total: ${formatMoney(total)}` : '',
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildSingleProductWhatsappUrl(product, variant, quantity, pincode, codStatus, priceAccess) {
  const price = customerPrice(variant.prices, priceAccess);
  const canViewPrices = priceAccess?.canViewPrices !== false;
  const lines = [
    `Hello ${storeConfig.name}, I want to buy this catalog:`,
    '',
    `${product.title}`,
    `Code: ${variant.code}`,
    `Designs: ${quantity}`,
    canViewPrices && price != null ? `Price: ${formatMoney(price)} / piece` : '',
    pincode ? `Pincode: ${pincode}` : '',
    codStatus === 'available' ? 'COD checked: Available' : '',
  ].filter(Boolean);

  return `https://wa.me/${storeConfig.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function normalizePincodeInput(value) {
  return String(value).replace(/\D/g, '').slice(0, 6);
}

export function EnquiryPopup({ open, onClose, whatsappUrl }) {
  if (!open) return null;

  const popup = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="enquiry-popup-modal" onClick={(e) => e.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close popup">
          <X size={18} />
        </button>
        <h3>Enquiry Sent Successfully</h3>
        <div className="enquiry-popup-actions">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="whatsapp-action-btn"
            onClick={onClose}
          >
            <WhatsappIcon size={18} /> Open WhatsApp Chat
          </a>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(popup, document.body) : popup;
}
