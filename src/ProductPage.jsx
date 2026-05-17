import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Layers,
  LockKeyhole,
  PackageCheck,
  Share2,
  ShoppingBag,
  Star,
  ZoomIn,
  X,
} from 'lucide-react';
import { storeConfig } from './config.js';
import { VariationQuantityDrawer } from './components/VariationQuantityDrawer.jsx';
import { ResellerShareModal } from './components/ResellerShareModal.jsx';
import {
  buildSingleProductWhatsappUrl,
  customerPrice,
  expandedProductCards,
  fallbackProductImage,
  formatMoney,
  formatWeight,
  Newsletter,
  ProductTrustStrip,
  ProductCard,
  ResellerWhatsappShare,
  SectionTitle,
  normalizePincodeInput,
  useCurrency,
  WhatsappIcon,
  EnquiryPopup,
} from './storefrontShared.jsx';
import { priceNoticeForAccess } from './utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';

export function ProductDetailWrapper(props) {
  const product = props.productsById?.get(props.productId) || props.products[0] || null;
  const isFavorite = product ? props.favoriteKeys.has(product.id) : false;

  if (!product) return null;

  return <ProductDetail {...props} product={product} isFavorite={isFavorite} />;
}

export function ProductDetail({
  product,
  products,
  navigate,
  addToCart,
  addCartSelections,
  toggleFavorite,
  isFavorite,
  favoriteKeys,
  priceAccess,
  pincode,
  setPincode,
  codStatus,
  checkPincode,
  openAuth,
}) {
  const initialColorName = product.colorOptions?.[0]?.name || product.variants[0]?.color || '';
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedColorName, setSelectedColorName] = useState(initialColorName);
  const [variantCode, setVariantCode] = useState(product.variants[0]?.code);
  const [isDownloading, setIsDownloading] = useState(false);
  const [galleryHeight, setGalleryHeight] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [variationDrawerOpen, setVariationDrawerOpen] = useState(false);
  const [enquiryState, setEnquiryState] = useState('idle');
  const [enquiryPopupOpen, setEnquiryPopupOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const mainImageRef = useRef(null);

  const handleRestrictedAction = useCallback((actionName, actionFn) => {
    if (!priceAccess?.isLoggedIn) {
      setToastMessage(`Login to ${actionName.toLowerCase()}`);
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }
    actionFn();
  }, [priceAccess?.isLoggedIn]);

  const totalColors = useMemo(
    () => product.totalColors ?? (product.variants.length > 1 ? product.variants.length : Math.max(1, Math.min(product.images.length, 4))),
    [product.images.length, product.variants.length, product.totalColors],
  );
  const singleWeight = useMemo(() => Number(product.weight || 1), [product.weight]);
  const catalogWeight = useMemo(() => singleWeight * totalColors, [totalColors, singleWeight]);
  const variant = useMemo(
    () => product.variants.find((item) => item.code === variantCode) || product.variants[0],
    [product.variants, variantCode],
  );
  const displayPrice = useMemo(() => customerPrice(variant.prices, priceAccess), [priceAccess, variant.prices]);
  const canViewPrice = displayPrice != null && displayPrice > 0;
  const colorOptions = useMemo(() => {
    if (product.colorOptions?.length) return product.colorOptions;

    const seen = new Set();
    return product.variants
      .map((item) => ({
        name: item.color,
        image: item.image,
      }))
      .filter((item) => {
        if (!item.name && !item.image) return false;
        const key = `${item.name}|${item.image}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [product.colorOptions, product.variants]);
  const productStatusTags = useMemo(
    () => (product.statusTags || []).filter((tag) => {
      if (tag.key === 'bestseller') return false;
      if (!canViewPrice && tag.key === 'low-moq') return false;
      return true;
    }),
    [product.statusTags, canViewPrice],
  );
  const related = useMemo(
    () => products.filter((item) => item.id !== product.id).slice(0, 5),
    [product.id, products],
  );
  const recommendationItems = useMemo(
    () =>
      related.length
        ? related
        : expandedProductCards([product]).slice(1, 6).map((item) => ({
          ...item.product,
          images: [item.image, ...item.product.images],
        })),
    [product, related],
  );
  const detailRows = useMemo(
    () => [
      ['Description', product.description],
    ],
    [variant, displayPrice, totalColors, catalogWeight, product.fabric, product.description],
  );
  const galleryStyle = useMemo(
    () => (galleryHeight ? { '--gallery-height': `${galleryHeight}px` } : undefined),
    [galleryHeight],
  );

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
          variant_code: variant.code,
          message: `Enquiry for ${product.title}`,
          items: [{
            product_id: product.id,
            product_title: product.title,
            variant_code: variant.code,
            quantity: totalColors,
            priceGroup: priceAccess?.priceGroup || 'pending',
          }],
        });
      } catch (err) {
        console.error('Failed to log inquiry to Supabase:', err);
      }
    }

    setEnquiryState('sent');
    const whatsappUrl = buildSingleProductWhatsappUrl(product, variant, totalColors, pincode, codStatus, priceAccess);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  const downloadImagesAsZip = useCallback(async () => {
    try {
      setIsDownloading(true);
      const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('jszip'),
        import('file-saver'),
      ]);
      const zip = new JSZip();

      const safeTitle = product.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const promises = product.images.map(async (url, index) => {
        const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const filename = `${safeTitle}-${index + 1}.jpg`;
        zip.file(filename, blob);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${product.title.replace(/\s+/g, '-').toLowerCase()}-images.zip`);
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download images. They might be hosted on a server that restricts direct downloads.');
    } finally {
      setIsDownloading(false);
    }
  }, [product.images, product.title]);

  const shareProductImages = useCallback(async () => {
    const text = `*${product.title}*\n\nHere are the product images:\n${product.images.join('\n')}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Image links copied to clipboard!');
      } catch (err) {
        alert('Sharing is not supported on this device.');
      }
    }
  }, [product.images, product.title]);

  useEffect(() => {
    setSelectedImage(product.images[0]);
    setSelectedColorName(product.colorOptions?.[0]?.name || product.variants[0]?.color || '');
    setVariantCode(product.variants[0]?.code);
    setVariationDrawerOpen(false);
  }, [product]);

  useEffect(() => {
    const mainImageElement = mainImageRef.current;
    if (!mainImageElement || typeof ResizeObserver === 'undefined') return undefined;

    const syncGalleryHeight = (height) => {
      const nextHeight = Math.round(height);
      setGalleryHeight((currentHeight) => (currentHeight === nextHeight ? currentHeight : nextHeight));
    };

    syncGalleryHeight(mainImageElement.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (entry) {
        syncGalleryHeight(entry.contentRect.height);
      }
    });

    observer.observe(mainImageElement);

    return () => {
      observer.disconnect();
    };
  }, [product.id]);

  const handleVariantChange = useCallback((nextVariantCode) => {
    setVariantCode(nextVariantCode);
    const nextVariant = product.variants.find((item) => item.code === nextVariantCode);
    if (!nextVariant) return;

    if (nextVariant.color) {
      setSelectedColorName(nextVariant.color);
    }

    if (nextVariant.image) {
      setSelectedImage(nextVariant.image);
    }
  }, [product.variants]);

  const handleColorChange = useCallback((nextColorName) => {
    setSelectedColorName(nextColorName);
    const nextColor = colorOptions.find((item) => item.name === nextColorName);
    if (nextColor?.image) {
      setSelectedImage(nextColor.image);
    }

    const matchingVariant = product.variants.find((item) => item.color === nextColorName);
    if (matchingVariant?.code) {
      setVariantCode(matchingVariant.code);
    }
  }, [colorOptions, product.variants]);

  const scrollProductRail = (rowId, direction) => {
    const rail = document.getElementById(rowId);
    if (!rail) return;

    const card = rail.querySelector('.product-card');
    const styles = window.getComputedStyle(rail);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;
    const distance = card ? card.getBoundingClientRect().width + gap : rail.clientWidth;

    rail.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  return (
    <>
      <section className="product-view">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button onClick={() => navigate('home')}>Home</button>
          <span>/</span>
          <button onClick={() => navigate('catalog')}>Catalogs</button>
          <span>/</span>
          <strong>{product.title}</strong>
        </nav>

        <div className="product-hero-grid">
          <div className="product-media">
            <div className="vertical-thumbs" style={galleryStyle}>
              {product.images.map((image, index) => (
                <button
                  key={image}
                  className={selectedImage === image ? 'active' : ''}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={`${product.title} view ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.target.style.opacity = '0'; }}
                  />
                </button>
              ))}
              {product.video && (
                <button
                  className={selectedImage === product.video ? 'active video-thumb' : 'video-thumb'}
                  onClick={() => setSelectedImage(product.video)}
                >
                  <div className="video-thumb-container">
                    <img
                      src={`https://img.youtube.com/vi/${product.video.split('/').pop().split('?')[0]}/mqdefault.jpg`}
                      alt="Product Video Thumbnail"
                      loading="lazy"
                    />
                    <div className="play-overlay">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div className="catalog-main-image" ref={mainImageRef}>
              {selectedImage && (selectedImage.includes('youtube.com/embed') || selectedImage.includes('youtube-nocookie.com/embed')) ? (
                <div className="video-container">
                  <iframe
                    src={`${selectedImage}${selectedImage.includes('?') ? '&' : '?'}autoplay=1&mute=1&rel=0&modestbranding=1`}
                    title="Product Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
              ) : (
                <>
                  <img
                    src={selectedImage || product.images[0] || fallbackProductImage}
                    alt={product.title}
                    fetchPriority="high"
                    decoding="async"
                    onError={(e) => { e.target.style.opacity = '0'; }}
                  />
                  <button className="zoom-button" aria-label="View larger image" onClick={() => setZoomImage(selectedImage || product.images[0] || fallbackProductImage)}>
                    <ZoomIn size={18} />
                  </button>
                </>
              )}
            </div>

            <div className="product-specs-card">
              <div className="specs-grid">
                {[
                  ['Style', product.style],
                  ['Occasion', product.occasion],
                  ['Fabric', product.fabric],
                  ['Work', product.work],
                  ['Pattern', product.pattern],
                  ['Weave', product.weave],
                  ['Purity', product.purity],
                  ['Type', product.type],
                ].map(([label, value]) => value && (
                  <div key={label} className="spec-item">
                    <span className="spec-label">{label}</span>
                    <span className="spec-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="product-info-panel">
            {productStatusTags.length > 0 && (
              <div className="panel-topline">
                <div className="panel-status-tags">
                  {productStatusTags.map((tag) => (
                    <span key={tag.key} className={`status-badge tag-${tag.key}`}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button className="info-fav" onClick={() => toggleFavorite(product)} aria-label="Save for later">
              <Bookmark size={24} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <h1 className="product-title-serif">{product.title}</h1>
            <div className="product-code-new">
              Code: <strong>{variant.code}</strong>
            </div>

            <div className="price-moq-row">
              <div className="main-price-wrap">
                {canViewPrice ? (
                  <>
                    <span className="price-value">{formatMoney(displayPrice)}</span>
                    <span className="price-unit">/pc</span>
                  </>
                ) : (
                  <button className="guest-price-notice" onClick={openAuth}>
                    <LockKeyhole size={18} /> {priceNoticeForAccess(priceAccess)}
                  </button>
                )}
              </div>
              {canViewPrice && <div className="moq-badge">MOQ 1 Set</div>}
            </div>

            {canViewPrice && (
              <div className="tiered-pricing-card">
                <div className="tier-column">
                  <div className="tier-label">1 - 4 Set</div>
                  <div className="tier-price">{formatMoney(displayPrice * totalColors)} <span className="unit">/Set</span></div>
                </div>
                <div className="tier-column">
                  <div className="tier-label">5 - 9 Set</div>
                  <div className="tier-price">{formatMoney(displayPrice * totalColors * 0.98)} <span className="unit">/Set</span></div>
                </div>
                <div className="tier-column">
                  <div className="tier-label">10+ Set</div>
                  <div className="tier-price">{formatMoney(displayPrice * totalColors * 0.95)} <span className="unit">/Set</span></div>
                </div>
              </div>
            )}

            <span className="gst-disclaimer">Exclusive of GST & shipping</span>


            <div className="quick-facts">
              <span>
                <Layers size={22} />Colors in a set: <strong>{totalColors}</strong>
              </span>
              <span>
                <ShoppingBag size={22} /> Weight per piece: <strong>{formatWeight(singleWeight)}</strong>
              </span>
            </div>

            {colorOptions.length > 0 && (
              <section className="product-variation-card" aria-labelledby="product-variation-heading">
                <div className="variation-card-head">
                  <h2 id="product-variation-heading">Variations</h2>
                  <button type="button" onClick={() => setVariationDrawerOpen(true)}>
                    Select Color
                  </button>
                </div>
                <p className="selected-color-label">
                  <strong>Color:</strong> {selectedColorName || 'Selected'}
                </p>
                <div className="color-swatch-row" role="list" aria-label="Available colors">
                  {colorOptions.map((option, index) => {
                    const optionName = option.name || `Color ${index + 1}`;
                    const isSelected = selectedColorName === option.name || selectedImage === option.image;

                    return (
                      <button
                        key={`${optionName}-${option.image || index}`}
                        type="button"
                        className={isSelected ? 'active' : ''}
                        onClick={() => handleColorChange(option.name)}
                        aria-label={`Select ${optionName}`}
                      >
                        <img
                          src={option.image || fallbackProductImage}
                          alt={optionName}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.target.style.opacity = '0'; }}
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="catalog-table">
              {detailRows.map(([label, value]) => (
                <div key={label} className={label.toLowerCase().replace(/\s+/g, '-') + '-row'}>
                  {label !== 'Description' && <span>{label}</span>}
                  <strong className={label === 'Description' ? 'description-text' : ''}>
                    {value || 'On request'}
                  </strong>
                </div>
              ))}
            </div>







            <div className="product-main-actions">
              <div className="product-secondary-actions">
                <button
                  type="button"
                  className="whatsapp-button"
                  onClick={handleEnquiryClick}
                  style={enquiryState === 'sent' ? { background: '#128C7E', color: '#fff' } : {}}
                >
                  <WhatsappIcon size={20} /> {enquiryState === 'sent' ? 'Sent' : 'Enquiry'}
                </button>
                <button
                  className="catalog-add-button"
                  type="button"
                  onClick={() => setVariationDrawerOpen(true)}
                >
                  <ShoppingBag size={20} /> Add to Bag
                </button>
                <button className="secondary-action-btn" type="button" onClick={() => handleRestrictedAction('Download', downloadImagesAsZip)} disabled={isDownloading}>
                  <Download size={18} /> {isDownloading ? 'Zipping...' : 'Download'}
                </button>
                {priceAccess?.priceGroup === 'reseller' && priceAccess?.canViewPrices ? (
                  <ResellerWhatsappShare
                    product={product}
                    variant={variant}
                    quantity={totalColors}
                    selectedColorName={selectedColorName}
                    imageUrl={selectedImage}
                    priceAccess={priceAccess}
                    triggerClassName="secondary-action-btn reseller-share-detail-btn"
                    triggerLabel="Customer Share"
                  />
                ) : (
                  <button className="secondary-action-btn" type="button" onClick={() => handleRestrictedAction('Share', shareProductImages)}>
                    <Share2 size={18} /> Share
                  </button>
                )}
                {priceAccess?.priceGroup === 'reseller' && priceAccess?.canViewPrices && (
                  <button 
                    className="secondary-action-btn reseller-link-detail-btn" 
                    type="button" 
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 size={18} /> White-label Link
                  </button>
                )}
              </div>
            </div>
            <p className="buyer-note">
              <LockKeyhole size={16} /> Only registered buyers can download and share
            </p>
          </aside>
        </div>


        <ProductTrustStrip />

        <div className="product-highlight-grid">
          <section>
            <div className="highlight-heading">
              <span className="highlight-icon"><Star size={20} /></span>
              <h2>Product Highlights</h2>
            </div>
            <ul className="highlight-list">
              <li><CheckCircle2 size={18} /> Premium {product.fabric || 'saree'} with {product.work || 'designer'} work</li>
              <li><CheckCircle2 size={18} /> Smooth texture and lightweight feel</li>
              <li><CheckCircle2 size={18} /> Elegant border with intricate detailing</li>
              <li><CheckCircle2 size={18} /> Comes with unstitched blouse piece</li>
            </ul>
          </section>
          <div className="highlight-image">
            <img
              src={product.images[1] || product.images[0] || fallbackProductImage}
              alt={`${product.title} fabric close-up`}
              loading="lazy"
              decoding="async"
              onError={(e) => { e.target.style.opacity = '0'; }}
            />
          </div>
          <section>
            <div className="highlight-heading">
              <span className="highlight-icon"><Heart size={20} /></span>
              <h2>Perfect For</h2>
            </div>
            <ul className="perfect-list">
              <li><PackageCheck size={18} /> Casual Wear</li>
              <li><Heart size={18} /> Daily Wear</li>
              <li><ShoppingBag size={18} /> Office Wear</li>
              <li><Award size={18} /> Small Gatherings</li>
            </ul>
          </section>
        </div>

        <section className="you-may-like home-product-section">
          <div className="section-heading-row">
            <SectionTitle title="You May Also Like" align="left" />
          </div>
          <div className="scroll-wrapper">
            <button 
              className="scroll-arrow left" 
              onClick={() => scrollProductRail('recommendations-row', -1)}
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="product-row scrollable-row" id="recommendations-row">
              {recommendationItems.slice(0, 10).map((item, index) => (
                <ProductCard
                  key={`${item.id}-${index}`}
                  product={item}
                  variant={item.variants[0]}
                  navigate={navigate}
                  addToCart={addToCart}
                  toggleFavorite={toggleFavorite}
                  isFavorite={favoriteKeys.has(item.id)}
                  priceAccess={priceAccess}
                  openAuth={openAuth}
                />
              ))}
            </div>

            <button 
              className="scroll-arrow right" 
              onClick={() => scrollProductRail('recommendations-row', 1)}
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        <EnquiryPopup
          open={enquiryPopupOpen}
          onClose={() => setEnquiryPopupOpen(false)}
          whatsappUrl={buildSingleProductWhatsappUrl(product, variant, totalColors, pincode, codStatus, priceAccess)}
        />
      </section>

      <Newsletter />

      {zoomImage && (
        <div className="modal-backdrop" onClick={() => setZoomImage(null)}>
          <button className="icon-button modal-close" onClick={() => setZoomImage(null)} style={{ background: 'white', zIndex: 10 }}>
            <X />
          </button>
          <img 
            src={zoomImage} 
            alt="Zoomed view" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

      <VariationQuantityDrawer
        open={variationDrawerOpen}
        product={product}
        colorOptions={colorOptions}
        selectedColorName={selectedColorName}
        selectedImage={selectedImage}
        onClose={() => setVariationDrawerOpen(false)}
        onSelectColor={handleColorChange}
        onAddToCart={(selections) => {
          addCartSelections(product, selections);
          setVariationDrawerOpen(false);
        }}
        priceAccess={priceAccess}
      />

      <div className={`elegant-toast ${toastMessage ? 'show' : ''}`}>
        <LockKeyhole size={16} />
        {toastMessage}
      </div>

      {showShareModal && (
        <ResellerShareModal 
          product={product}
          variant={variant}
          user={{ id: priceAccess.userId }}
          priceAccess={priceAccess}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}
