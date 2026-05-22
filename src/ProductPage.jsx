/**
 * ProductPage View / ProductDetailWrapper
 * Purpose: Displays comprehensive details for individual catalog designs (sarees, suits, dupattas).
 * Integrates image zoom preview grids, interactive color swatches, dynamic wholesale pricing tiers,
 * volume-based B2B order calculators, shipping/FAQ accordions, and WhatsApp inquiry triggers.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Gift,
  Globe,
  Heart,
  Layers,
  LockKeyhole,
  PackageCheck,
  Share2,
  ShoppingBag,
  Sparkles,
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
  normalizePincodeInput,
  useCurrency,
} from './storefrontShared.jsx';
import { Newsletter } from './components/Newsletter.jsx';
import { ProductTrustStrip } from './components/ProductTrustStrip.jsx';
import { ProductCard } from './components/ProductCard.jsx';
import { ResellerWhatsappShare } from './components/ResellerWhatsappShare.jsx';
import { SectionTitle } from './components/SectionTitle.jsx';
import { WhatsappIcon } from './components/WhatsappIcon.jsx';
import { EnquiryPopup } from './components/EnquiryPopup.jsx';
import { priceNoticeForAccess } from './utils/buyerAccess.js';
import { isSupabaseConfigured, supabase } from './supabaseClient.js';
import Breadcrumb from './components/Breadcrumb.jsx';

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
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const toggleFaq = (index) => setOpenFaqIndex(openFaqIndex === index ? null : index);
  const mainImageRef = useRef(null);

  // Dynamic Tab Title, Meta Description & Canonical Link SEO injection for Product Detail page
  useEffect(() => {
    if (!product || typeof window === 'undefined') return;

    const originalTitle = document.title;
    const metaTitle = product.metaTitle || product.title || `${storeConfig.name} Product`;
    const metaDescription = product.metaDescription || product.summary || product.description || `View ${metaTitle} in the ${storeConfig.name} wholesale catalogue.`;

    document.title = metaTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', metaDescription);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = metaDescription;
      document.head.appendChild(metaDesc);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonicalLink ? canonicalLink.getAttribute('href') : '';
    const newCanonical = `https://www.weave365.in/product/${encodeURIComponent(product.id)}`;

    if (canonicalLink) {
      canonicalLink.setAttribute('href', newCanonical);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = newCanonical;
      document.head.appendChild(canonicalLink);
    }

    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        if (originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        } else {
          metaDesc.remove();
        }
      }
      if (canonicalLink) {
        if (originalCanonical) {
          canonicalLink.setAttribute('href', originalCanonical);
        } else {
          canonicalLink.remove();
        }
      }
    };
  }, [product]);

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

  const pcSetVal = useMemo(() => String(product.raw?.['Pc / Set'] || '').trim().toLowerCase(), [product.raw]);
  const isSoldAsPc = useMemo(() => pcSetVal === 'pc', [pcSetVal]);
  const isSoldAsBoth = useMemo(() => pcSetVal === 'pc, set' || pcSetVal === 'set, pc', [pcSetVal]);
  const isSoldAsSet = useMemo(() => pcSetVal === 'set', [pcSetVal]);

  const moqUnit = isSoldAsPc ? 'Piece' : 'Set';
  const moqUnitShort = isSoldAsPc ? 'pc' : 'Set';
  const moqUnitPlural = isSoldAsPc ? 'Pieces' : 'Sets';
  const moqMultiplier = isSoldAsPc ? 1 : totalColors;

  const longDescriptionSections = useMemo(() => {
    const isSaree = String(product.category || '').toLowerCase() === 'saree';

    return [
      {
        id: 'fabric',
        label: 'Fabric Details',
        content: `Crafted from premium ${product.fabric || 'silk'} (${product.purity || 'Faux'} purity grade) chosen for its luxurious texture, durability, and classic weight.`
      },
      {
        id: 'weave',
        label: 'Weaving Technique',
        content: `Meticulously woven using the traditional ${product.weave || 'weaving'} process in Varanasi. This time-honored technique ensures optimal structural integrity and design definition.`
      },
      {
        id: 'zari',
        label: 'Zari Details',
        content: `Adorned with intricate ${product.work || 'zari'} motifs in a beautiful ${product.pattern || 'designer'} pattern, offering a classic metallic luster and premium feel.`
      },
      {
        id: 'blouse',
        label: 'Blouse Information',
        content: isSaree
          ? 'Includes a matching uncut blouse piece (total saree length 6.3m including blouse).'
          : 'Includes matching salwar/bottom and dupatta cut piece fabric set matching the design motif.'
      },
      {
        id: 'occasion',
        label: 'Occasion Suitability',
        content: `Ideally suited for ${product.occasion || 'weddings, festivals,'} and formal ceremonies, aligning with traditional and contemporary ${product.style || 'timeless'} design aesthetics.`
      },
      {
        id: 'wholesale',
        label: 'Wholesale & B2B Options',
        content: `Weave 365 offers complete boutique support, certified artisan direct pricing, global customs documentation, and seamless bulk ordering services.`
      },
      {
        id: 'moq',
        label: 'Minimum Order Quantity',
        content: isSoldAsBoth
          ? 'Highly flexible MOQ options. You can purchase this design as individual selected pieces or save more by ordering full color matching sets.'
          : `This product has a low minimum order requirement of just 1 ${moqUnit}. Boutiques can order single sample packages with guaranteed quality.`
      },
      {
        id: 'care',
        label: 'Care Instructions',
        content: `Dry clean only is highly recommended to preserve the metallic luster of the zari motifs, structural density of the fabric, and original color vibrance.`
      },
      {
        id: 'shipping',
        label: 'Shipping & Delivery',
        content: 'Expedited worldwide air cargo shipping. Direct customs clearances and documentation are handled by our export division, providing fast delivery timelines to our global buyers in the USA, UK, UAE, Canada, and Europe.'
      }
    ];
  }, [product, totalColors, isSoldAsBoth, moqUnit]);

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
      if (tag.key === 'low-moq' && priceAccess?.priceGroup === 'reseller' && priceAccess?.canViewPrices) return false;
      return true;
    }),
    [product.statusTags, canViewPrice, priceAccess],
  );
  const related = useMemo(() => {
    const others = products.filter((item) => item.id !== product.id);
    const productPattern = product.pattern?.trim().toLowerCase();
    const productFabric = product.fabric?.trim().toLowerCase();

    // Tier 1: both pattern AND fabric match
    const bothMatch = others.filter((item) => {
      const samePattern = productPattern && item.pattern?.trim().toLowerCase() === productPattern;
      const sameFabric = productFabric && item.fabric?.trim().toLowerCase() === productFabric;
      return samePattern && sameFabric;
    });
    if (bothMatch.length >= 3) return bothMatch.slice(0, 5);

    // Tier 2: either pattern OR fabric match
    const eitherMatch = others.filter((item) => {
      const samePattern = productPattern && item.pattern?.trim().toLowerCase() === productPattern;
      const sameFabric = productFabric && item.fabric?.trim().toLowerCase() === productFabric;
      return samePattern || sameFabric;
    });
    if (eitherMatch.length >= 3) return eitherMatch.slice(0, 5);

    // Tier 3: fallback — any other products
    return others.slice(0, 5);
  }, [product.id, product.pattern, product.fabric, products]);
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

  const explorationData = useMemo(() => {
    const currentFabric = (product.fabric || '').trim();
    const currentCategory = (product.category || 'Saree').trim();

    // 1. Gather all unique fabrics & categories from all loaded products
    const allFabrics = new Set();
    const allCategories = new Set();

    products.forEach(p => {
      if (p.fabric) allFabrics.add(p.fabric.trim());
      if (p.category) allCategories.add(p.category.trim());
    });

    // 2. Generate related collections
    const collectionsList = [];

    // Add current category collections
    if (currentFabric) {
      collectionsList.push({
        label: `${currentFabric} ${currentCategory}s`,
        url: `catalog?category=${encodeURIComponent(currentCategory)}&fabric=${encodeURIComponent(currentFabric)}`
      });
    }

    // Add some premium standard SEO collections
    if (currentCategory === 'Saree') {
      collectionsList.push(
        { label: 'Bridal Banarasi Sarees', url: 'catalog?category=Saree&fabric=Katan Silk' },
        { label: 'Organza Banarasi Sarees', url: 'catalog?category=Saree&fabric=Organza' },
        { label: 'Meenakari Silk Sarees', url: 'catalog?category=Saree&fabric=Katan Silk' },
        { label: 'Soft Silk Sarees', url: 'catalog?category=Saree&fabric=Soft Silk' },
        { label: 'Katan Silk Sarees', url: 'catalog?category=Saree&fabric=Katan Silk' }
      );
    } else if (currentCategory === 'Suit') {
      collectionsList.push(
        { label: 'Banarasi Suits', url: 'catalog?category=Suit' },
        { label: 'Katan Silk Suits', url: 'catalog?category=Suit&fabric=Katan Silk' },
        { label: 'Organza Banarasi Suits', url: 'catalog?category=Suit&fabric=Organza' },
        { label: 'Georgette Suits', url: 'catalog?category=Suit&fabric=Georgette' }
      );
    } else {
      collectionsList.push(
        { label: 'Banarasi Dupattas', url: 'catalog?category=Dupatta' },
        { label: 'Katan Silk Collection', url: 'catalog?fabric=Katan Silk' },
        { label: 'Organza Collections', url: 'catalog?fabric=Organza' }
      );
    }

    // Filter out duplicate labels
    const uniqueCollections = [];
    const seenLabels = new Set();

    collectionsList.forEach(item => {
      if (!seenLabels.has(item.label.toLowerCase())) {
        seenLabels.add(item.label.toLowerCase());
        uniqueCollections.push(item);
      }
    });

    // 3. Similar fabrics
    const fabricList = [];
    const mainFabrics = ['Katan Silk', 'Organza', 'Georgette', 'Chiniya Silk', 'Tissue Silk', 'Soft Silk'];
    const seenFabrics = new Set();

    // Add current fabric first
    if (currentFabric) {
      fabricList.push({
        label: `${currentFabric}`,
        url: `catalog?fabric=${encodeURIComponent(currentFabric)}`,
        isCurrent: true
      });
      seenFabrics.add(currentFabric.toLowerCase());
    }

    // Add other premium fabrics
    mainFabrics.forEach(fab => {
      if (fab !== currentFabric && allFabrics.has(fab) && !seenFabrics.has(fab.toLowerCase())) {
        fabricList.push({
          label: fab,
          url: `catalog?fabric=${encodeURIComponent(fab)}`,
          isCurrent: false
        });
        seenFabrics.add(fab.toLowerCase());
      }
    });

    // Fallback to whatever fabrics exist in data if none of mainFabrics match
    if (fabricList.length < 3) {
      Array.from(allFabrics).forEach(fab => {
        if (fab !== currentFabric && !seenFabrics.has(fab.toLowerCase()) && fabricList.length < 5) {
          fabricList.push({
            label: fab,
            url: `catalog?fabric=${encodeURIComponent(fab)}`,
            isCurrent: false
          });
          seenFabrics.add(fab.toLowerCase());
        }
      });
    }

    return {
      collections: uniqueCollections.slice(0, 5),
      fabrics: fabricList.slice(0, 5)
    };
  }, [product, products]);

  const productSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": product.images || [],
    "description": product.description || `Elegant handwoven Banarasi saree styled in ${product.fabric || 'pure silk'}. Sourced directly from Varanasi.`,
    "sku": product.id || variant.code,
    "mpn": variant.code,
    "brand": {
      "@type": "Brand",
      "name": "Weave 365"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": displayPrice || 2500,
      "highPrice": (displayPrice ? displayPrice * 1.5 : 8500),
      "offerCount": totalColors || 1,
      "availability": "https://schema.org/InStock",
      "url": `https://www.weave365.in/product/${product.id}`
    }
  }), [product, variant, displayPrice, totalColors]);

  const breadcrumbSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.weave365.in/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Catalogs",
        "item": "https://www.weave365.in/catalog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.title,
        "item": `https://www.weave365.in/product/${product.id}`
      }
    ]
  }), [product]);

  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the Minimum Order Quantity (MOQ) for wholesale?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For retailers and boutique owners, our MOQ starts at just 1 set (which typically contains all available color variants of the design). This allows you to test our premium Banarasi collection with minimal upfront capital."
        }
      },
      {
        "@type": "Question",
        "name": "Are these Banarasi sarees authentically sourced?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all Weave 365 sarees and suits are crafted directly in Varanasi by expert weavers. We use premium pure katan silk, organza, and georgette with authentic gold and silver zari work, preserving the heritage weaving tradition."
        }
      },
      {
        "@type": "Question",
        "name": "Do you support resellers, boutiques, and dropshipping?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! We support boutiques, resellers, and global export partners. Registered resellers get access to our white-labeled marketing toolkit, live catalog links, and dedicated support for direct boutique dispatch."
        }
      },
      {
        "@type": "Question",
        "name": "Is international shipping available for wholesale orders?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we ship worldwide to over 50 countries, including the USA, UK, Canada, UAE, and Australia. We handle complete B2B customs documentation and provide competitive air and sea freight rates."
        }
      }
    ]
  }), []);
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
            quantity: moqMultiplier,
            priceGroup: priceAccess?.priceGroup || 'pending',
          }],
        });
      } catch (err) {
        console.error('Failed to log inquiry to Supabase:', err);
      }
    }

    setEnquiryState('sent');
    const whatsappUrl = buildSingleProductWhatsappUrl(product, variant, moqMultiplier, pincode, codStatus, priceAccess);
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

  const breadcrumbItems = [
    { name: 'Home', url: '/', route: 'home' },
    { name: 'Catalogs', url: '/catalog', route: 'catalog' },
    ...(product.category ? [{ name: product.category, url: '/catalog', route: 'catalog' }] : []),
    { name: product.title }
  ];

  return (
    <>
      <section className="product-view">
        <Breadcrumb items={breadcrumbItems} navigate={navigate} />

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
                    width={64}
                    height={85}
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
                      width={64}
                      height={85}
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
                    width={600}
                    height={800}
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

            <div className="product-disclaimer-box">
              <p>
                <span className="product-disclaimer-label">Disclaimer:</span> Slight variations in color, fabric, and weaving are possible. Model image is for reference only. Making a payment indicates your agreement to this.
              </p>
            </div>

            <div className="global-sourcing-card desktop-sourcing-only">
              <div className="card-header">
                <Globe className="globe-icon-gold" size={20} />
                <h3>Global B2B Sourcing</h3>
              </div>
              <p>
                Source bulk Banarasi sarees and suits direct from Varanasi. Weave 365 is a wholesale supplier providing international shipping to the USA, UK, UAE, Canada, Australia and more. International courier charges depend on weight; as weight increases, the per-unit cost becomes cheaper. Fast WhatsApp ordering is available for India and global B2B orders.
              </p>
              <div className="card-footer-badges">
                <span>✓ {product.partner ? 'Artisan Partner' : 'Verified Supplier'}</span>
                <span>✓ {product.purity && product.purity.toLowerCase() !== 'faux' ? `${product.purity} Quality` : 'Customs Handled'}</span>
                <span>✓ {isSoldAsBoth ? 'Piece & Set MOQ' : `MOQ 1 ${moqUnit}`}</span>
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

            {(product.metaDescription || product.summary) && (
              <p className="product-short-desc-premium">
                {product.metaDescription || product.summary}
              </p>
            )}

            {product.partner && (
              <div
                className="trusted-partner-card-v2"
                onClick={() => navigate('partner', product.partner)}
                title={`View all products by ${product.partner}`}
              >
                <div className="partner-card-accent-bar" />
                <Award size={18} className="partner-award-icon" />
                <div className="partner-card-info">
                  <span className="partner-label-v2">Trusted Partner</span>
                  <span className="partner-dot">•</span>
                  <span className="partner-name-v2">{product.partner}</span>
                </div>
              </div>
            )}

            <div className="price-moq-row">
              <div className="main-price-wrap">
                {canViewPrice ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {priceAccess?.priceLabel && (
                      <span className="price-label-badge" style={{ fontSize: '11px', textTransform: 'uppercase', color: '#b8924a', letterSpacing: '1.2px', fontWeight: '700' }}>
                        {priceAccess.priceLabel}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
                      <span className="price-value">{formatMoney(displayPrice)}</span>
                      <span className="price-unit">/pc</span>
                      {priceAccess?.priceGroup === 'wholesale' && totalColors > 1 && (
                        <>
                          <span className="price-pipe"></span>
                          <span className="price-value" style={{ fontSize: '28px', color: 'var(--muted)', fontWeight: '600' }}>{formatMoney(displayPrice * totalColors)}</span>
                          <span className="price-unit" style={{ fontSize: '16px' }}>/Set ({totalColors} pcs)</span>
                        </>
                      )}
                      {canViewPrice && priceAccess?.priceGroup === 'wholesale' && (
                        <div className="moq-badge">
                          {isSoldAsBoth ? 'Flexible MOQ' : `MOQ 1 ${moqUnit}`}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button className="guest-price-notice" onClick={openAuth}>
                    <LockKeyhole size={18} /> {priceNoticeForAccess(priceAccess)}
                  </button>
                )}
              </div>
            </div>

            {canViewPrice && priceAccess?.priceGroup === 'wholesale' && (
              <div className="tiered-pricing-card">
                <div className="tier-column">
                  <div className="tier-label">1 - 4 {isSoldAsBoth ? 'Set' : moqUnit}</div>
                  <div className="tier-price">{formatMoney(displayPrice * moqMultiplier)} <span className="unit">/{moqUnitShort}</span></div>
                </div>
                <div className="tier-column">
                  <div className="tier-label">5 - 9 {isSoldAsBoth ? 'Set' : moqUnit}</div>
                  <div className="tier-price">{formatMoney(displayPrice * moqMultiplier * 0.98)} <span className="unit">/{moqUnitShort}</span></div>
                </div>
                <div className="tier-column">
                  <div className="tier-label">10+ {isSoldAsBoth ? 'Set' : moqUnit}</div>
                  <div className="tier-price">{formatMoney(displayPrice * moqMultiplier * 0.95)} <span className="unit">/{moqUnitShort}</span></div>
                </div>
              </div>
            )}

            {priceAccess?.priceGroup === 'reseller' || priceAccess?.priceGroup === 'guest' ? (
              <span className="gst-disclaimer">
                Excluding GST • <span className="free-shipping-highlight">Free Shipping</span>
              </span>
            ) : (
              <>
                <span className="gst-disclaimer" style={{ marginBottom: '10px' }}>Excluding GST & shipping</span>
                <p className="b2b-shipping-note" style={{ 
                  margin: '0 0 24px 0', 
                  fontSize: '15px', 
                  lineHeight: '1.6', 
                  color: 'var(--muted)', 
                  fontFamily: 'var(--font-ui)', 
                  fontWeight: '500'
                }}>
                  For accurate shipping charges and delivery timelines, kindly WhatsApp us your order quantity along with your city and pin code. We will get back to you promptly.
                </p>
              </>
            )}


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
                          width={40}
                          height={40}
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
                    {label === 'Description' && String(product.category || '').toLowerCase() === 'saree' && (
                      <span className="saree-length-display" style={{ display: 'block', marginTop: '12px', fontWeight: '600', color: 'var(--ink)' }}>
                        Saree Length: 6.3m (including 85cm Blouse)
                      </span>
                    )}
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
                  <ShoppingBag size={20} /> Add to order list
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

            <div className="global-sourcing-card mobile-sourcing-only">
              <div className="card-header">
                <Globe className="globe-icon-gold" size={20} />
                <h3>Global B2B Sourcing</h3>
              </div>
              <p>
                Source bulk Banarasi sarees and suits direct from Varanasi. Weave 365 is a wholesale supplier providing international shipping to the USA, UK, UAE, Canada, Australia and more. International courier charges depend on weight; as weight increases, the per-unit cost becomes cheaper. Fast WhatsApp ordering is available for India and global B2B orders.
              </p>
              <div className="card-footer-badges">
                <span>✓ {product.partner ? 'Artisan Partner' : 'Verified Supplier'}</span>
                <span>✓ {product.purity && product.purity.toLowerCase() !== 'faux' ? `${product.purity} Quality` : 'Customs Handled'}</span>
                <span>✓ {isSoldAsBoth ? 'Piece & Set MOQ' : `MOQ 1 ${moqUnit}`}</span>
              </div>
            </div>
          </aside>
        </div>


        <ProductTrustStrip />

        {/* Dynamic Long Description Accordions Grid */}
        <section className="product-long-details-section">
          <div className="long-details-grid">
            <div className="editorial-col">
              <div className="editorial-sticky-card">
                <span className="editorial-tag">Heritage & Sourcing</span>
                <h2 className="editorial-title">Direct from Varanasi Looms</h2>
                <p className="editorial-copy">
                  {product.description || `Enhance your boutique collections with our curated Banarasi products. Direct loom-to-store transparency ensures fair prices for artisans and pristine material quality for global buyers.`}
                  {String(product.category || '').toLowerCase() === 'saree' && (
                    <span className="saree-length-display" style={{ display: 'block', marginTop: '12px', fontWeight: '600', color: 'var(--brown-900)' }}>
                      Saree Length: 6.3m (including 85cm Blouse)
                    </span>
                  )}
                </p>
                <div className="editorial-divider" />
                <div className="editorial-support">
                  <strong>Need custom weave?</strong>
                  <p>Our sourcing team can assist with fabric selection, dye matching, and export documentation.</p>
                </div>
              </div>
            </div>

            <div className="accordions-col">
              <h3 className="accordions-section-title">Product Specifications</h3>
              {longDescriptionSections.map((sec, index) => {
                const isOpen = activeAccordion === sec.id;
                return (
                  <div key={sec.id} className={`accordion-row ${isOpen ? 'open' : ''}`}>
                    <button
                      className="accordion-header"
                      onClick={() => setActiveAccordion(isOpen ? null : sec.id)}
                      aria-expanded={isOpen}
                    >
                      <span className="header-label-wrap">
                        <span className="accordion-number">0{index + 1}</span>
                        {sec.id === 'fabric' && <Layers size={16} className="accordion-icon" />}
                        {sec.id === 'weave' && <Sparkles size={16} className="accordion-icon" />}
                        {sec.id === 'zari' && <Award size={16} className="accordion-icon" />}
                        {sec.id === 'blouse' && <Gift size={16} className="accordion-icon" />}
                        {sec.id === 'occasion' && <Star size={16} className="accordion-icon" />}
                        {sec.id === 'wholesale' && <ShoppingBag size={16} className="accordion-icon" />}
                        {sec.id === 'moq' && <PackageCheck size={16} className="accordion-icon" />}
                        {sec.id === 'care' && <CheckCircle2 size={16} className="accordion-icon" />}
                        {sec.id === 'shipping' && <Globe size={16} className="accordion-icon" />}
                        <span className="accordion-row-title">{sec.label}</span>
                      </span>
                      <ChevronDown size={18} className="chevron-icon" />
                    </button>
                    <div className="accordion-content">
                      <div className="accordion-content-inner">
                        <p>{sec.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="product-highlight-showcase">
          <div className="showcase-image-col">
            <img
              src={product.images[1] || product.images[0] || fallbackProductImage}
              alt={`${product.title} fabric close-up`}
              loading="lazy"
              decoding="async"
              width={500}
              height={600}
              onError={(e) => {
                if (product.images[1] && e.target.src !== product.images[0]) {
                  e.target.src = product.images[0];
                } else {
                  e.target.style.opacity = '0';
                }
              }}
            />
            <div className="showcase-image-badge">
              <Sparkles size={14} /> {product.subCategory || 'Premium Quality'}
            </div>
          </div>

          <div className="showcase-content-col">
            <div className="showcase-header">
              <span className="showcase-subtitle">Craftsmanship & Style</span>
              <h2>Product Highlights</h2>
              <p className="showcase-description">
                Every Weave 365 creation is crafted with meticulous attention to detail, utilizing heritage techniques combined with contemporary comfort and premium design.
              </p>
            </div>

            <div className="showcase-highlights-grid">
              <div className="highlight-card">
                <span className="card-icon"><Star size={18} /></span>
                <div className="card-body">
                  <h3>Heritage Fabric</h3>
                  <p>Premium {product.fabric || 'saree'} with {product.work || 'designer'} work</p>
                </div>
              </div>
              <div className="highlight-card">
                <span className="card-icon"><CheckCircle2 size={18} /></span>
                <div className="card-body">
                  <h3>Lightweight Feel</h3>
                  <p>Smooth texture and lightweight comfortable feel all day</p>
                </div>
              </div>
              <div className="highlight-card">
                <span className="card-icon"><Sparkles size={18} /></span>
                <div className="card-body">
                  <h3>Intricate Detailing</h3>
                  <p>Elegant border with sophisticated and precise detail work</p>
                </div>
              </div>
              <div className="highlight-card">
                <span className="card-icon"><Gift size={18} /></span>
                <div className="card-body">
                  <h3>Complete Set</h3>
                  <p>Comes with matching unstitched designer blouse piece</p>
                </div>
              </div>
            </div>

            <div className="showcase-divider" />

            <div className="showcase-perfect-section">
              <h3>Perfect For</h3>
              <div className="perfect-badges-row">
                <span className="perfect-badge"><PackageCheck size={14} /> Casual Wear</span>
                <span className="perfect-badge"><Heart size={14} /> Daily Wear</span>
                <span className="perfect-badge"><ShoppingBag size={14} /> Office Wear</span>
                <span className="perfect-badge"><Award size={14} /> Small Gatherings</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Collections & Fabrics Exploration Network */}
        <section className="product-exploration-section">
          <div className="exploration-header">
            <span className="subtitle">Sourcing Network</span>
            <h2>Explore Related Collections & Fabrics</h2>
            <p>Direct loom-to-store sourcing pathways. Explore sister catalogs and similar weave structures.</p>
          </div>
          <div className="exploration-grid">
            <div className="exploration-column">
              <h3>Related Collections</h3>
              <div className="exploration-tags-row">
                {explorationData.collections.map((col) => (
                  <button
                    key={col.label}
                    type="button"
                    className="exploration-pill"
                    onClick={() => navigate(col.url)}
                  >
                    <span>{col.label}</span>
                    <ChevronRight size={14} className="pill-arrow" />
                  </button>
                ))}
              </div>
            </div>

            <div className="exploration-column">
              <h3>Similar Fabrics</h3>
              <div className="exploration-tags-row">
                {explorationData.fabrics.map((fab) => (
                  <button
                    key={fab.label}
                    type="button"
                    className={`exploration-pill ${fab.isCurrent ? 'current-active' : ''}`}
                    onClick={() => navigate(fab.url)}
                  >
                    <span>{fab.label}</span>
                    <ChevronRight size={14} className="pill-arrow" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="product-faq-section">
          <div className="faq-header">
            <span className="subtitle">B2B Sourcing Support</span>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-accordion">
            {[
              {
                question: "What is the Minimum Order Quantity (MOQ) for wholesale?",
                answer: "For retailers and boutique owners, our MOQ starts at just 1 set (which typically contains all available color variants of the design). This allows you to test our premium Banarasi collection with minimal upfront capital."
              },
              {
                question: "Are these Banarasi sarees authentically sourced?",
                answer: "Yes, all Weave 365 sarees and suits are crafted directly in Varanasi by expert weavers. We use premium pure katan silk, organza, and georgette with authentic gold and silver zari work, preserving the heritage weaving tradition."
              },
              {
                question: "Do you support resellers, boutiques, and dropshipping?",
                answer: "Absolutely! We support boutiques, resellers, and global export partners. Registered resellers get access to our white-labeled marketing toolkit, live catalog links, and dedicated support for direct boutique dispatch."
              },
              {
                question: "Is international shipping available for wholesale orders?",
                answer: "Yes, we ship worldwide to over 50 countries, including the USA, UK, Canada, UAE, and Australia. We handle complete B2B customs documentation and provide competitive air and sea freight rates."
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`faq-item ${openFaqIndex === index ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="faq-trigger"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaqIndex === index}
                >
                  <h3 className="faq-question">{item.question}</h3>
                  <span className="faq-icon-wrapper">
                    <ChevronDown size={18} />
                  </span>
                </button>
                <div className="faq-content">
                  <p className="faq-answer">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </>
  );
}
