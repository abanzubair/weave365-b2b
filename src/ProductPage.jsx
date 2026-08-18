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
  ShieldCheck,
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
  Check,
} from 'lucide-react';
import { storeConfig, getProductCategorySlug, getCategorySlug, siteUrl } from './config.js';
import { VariationQuantityDrawer } from './components/VariationQuantityDrawer.jsx';
import { ResellerShareModal } from './components/ResellerShareModal.jsx';
import {
  buildSingleProductWhatsappUrl,
  customerPrice,
  expandedProductCards,
  fallbackProductImage,
  formatMoney,
  formatWeight,
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
import { usePageSeo } from './hooks/usePageSeo.js';
import { getStoredReferralCode } from './utils/influencerHelpers.js';
import Breadcrumb from './components/Breadcrumb.jsx';
import SliderCaptcha from './components/SliderCaptcha.jsx';
import { SharpStar } from './views/ReviewsPage.jsx';

export function ProductDetailWrapper(props) {
  const product = props.productsById?.get(props.productId) || props.products[0] || null;
  const isFavorite = product ? props.favoriteKeys.has(product.id) : false;

  useEffect(() => {
    if (!product && props.onReady) {
      props.onReady();
    }
  }, [product, props.onReady]);

  if (!product) return null;

  return <ProductDetail {...props} product={product} isFavorite={isFavorite} />;
}

const scrollProductRail = (rowId, direction) => {
  const rail = document.getElementById(rowId);
  if (!rail) return;

  const card = rail.querySelector('.product-card');
  const styles = window.getComputedStyle(rail);
  const gap = parseFloat(styles.columnGap || styles.gap) || 0;
  const distance = card ? card.getBoundingClientRect().width + gap : rail.clientWidth;

  rail.scrollBy({ left: direction * distance, behavior: 'smooth' });
};

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
  user,
  onReady,
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
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [whatsappShareOpen, setWhatsappShareOpen] = useState(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    if (product && onReady) {
      const timer = setTimeout(() => {
        onReady();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [product?.id, onReady]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShareMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!zoomImage) return;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setZoomImage(null);
      } else if (event.key === 'ArrowRight' || event.key === 'Right') {
        const currentIndex = product.images.indexOf(zoomImage);
        if (currentIndex !== -1 && product.images.length > 1) {
          const nextIdx = (currentIndex + 1) % product.images.length;
          setZoomImage(product.images[nextIdx]);
        }
      } else if (event.key === 'ArrowLeft' || event.key === 'Left') {
        const currentIndex = product.images.indexOf(zoomImage);
        if (currentIndex !== -1 && product.images.length > 1) {
          const prevIdx = (currentIndex - 1 + product.images.length) % product.images.length;
          setZoomImage(product.images[prevIdx]);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomImage, product.images]);

  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const toggleFaq = (index) => setOpenFaqIndex(openFaqIndex === index ? null : index);
  const mainImageRef = useRef(null);

  // Product Reviews states
  const [dbReviews, setDbReviews] = useState([]);
  const [reviewsStatus, setReviewsStatus] = useState('loading');
  const [reviewsError, setReviewsError] = useState('');
  
  // Submit Form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewer_name: '',
    business_name: '',
    rating: 5,
    title: '',
    comment: '',
  });
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isCaptchaReset, setIsCaptchaReset] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  // Fetch product-specific reviews
  useEffect(() => {
    let active = true;
    async function loadReviews() {
      if (!product?.id) return;
      setReviewsStatus('loading');
      setReviewsError('');
      try {
        if (isSupabaseConfigured) {
          const { data, error: dbError } = await supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', product.id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

          if (dbError) throw dbError;
          if (active) {
            setDbReviews(data || []);
            setReviewsStatus('ready');
          }
        } else {
          // Local storage fallback
          const localStr = localStorage.getItem(`weave365_local_product_reviews_${product.id}`);
          const localReviews = localStr ? JSON.parse(localStr) : [];
          if (active) {
            setDbReviews(localReviews);
            setReviewsStatus('ready');
          }
        }
      } catch (err) {
        console.error('Error loading product reviews:', err.message || err);
        if (active) {
          setDbReviews([]);
          setReviewsStatus('ready'); // fallback to seeds gracefully
        }
      }
    }

    void loadReviews();
    return () => { active = false; };
  }, [product?.id]);

  // Pre-fill reviewer name inline during render if user/priceAccess changes
  const userObj = user || (priceAccess?.userId ? { id: priceAccess.userId, user_metadata: { full_name: priceAccess.userFullName || '', business_name: priceAccess.businessName || '' } } : null);
  const [prevUserObj, setPrevUserObj] = useState(userObj);
  if (userObj !== prevUserObj) {
    setPrevUserObj(userObj);
    if (userObj) {
      setReviewForm(prev => ({
        ...prev,
        reviewer_name: userObj.user_metadata?.full_name || userObj.email?.split('@')[0] || '',
        business_name: userObj.user_metadata?.business_name || '',
      }));
    }
  }

  // Combine database reviews with local storage reviews
  const localReviews = useMemo(() => {
    if (typeof window === 'undefined' || !product?.id) return [];
    try {
      const localStr = localStorage.getItem(`weave365_local_product_reviews_${product.id}`);
      return localStr ? JSON.parse(localStr) : [];
    } catch {
      return [];
    }
  }, [product, dbReviews]); // reload when dbReviews updates

  const activeReviews = useMemo(() => {
    const combined = [...localReviews, ...dbReviews];
    const uniqueReviews = [];
    const seenIds = new Set();
    for (const r of combined) {
      const rid = r.id || `${r.reviewer_name}-${r.created_at}`;
      if (!seenIds.has(rid)) {
        seenIds.add(rid);
        uniqueReviews.push(r);
      }
    }
    return uniqueReviews;
  }, [dbReviews, localReviews]);

  // Calculate rating stats
  const stats = useMemo(() => {
    if (activeReviews.length === 0) return { avg: '5.0', count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    const total = activeReviews.reduce((acc, r) => acc + r.rating, 0);
    const count = activeReviews.length;
    const avg = (total / count).toFixed(1);
    
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    activeReviews.forEach(r => {
      const ratingVal = Math.max(1, Math.min(5, Number(r.rating || 5)));
      dist[ratingVal] = (dist[ratingVal] || 0) + 1;
    });

    return { avg, count, distribution: dist };
  }, [activeReviews]);

  const [visibleCount, setVisibleCount] = useState(5);

  const starPercentages = useMemo(() => {
    const total = activeReviews.length;
    const percentages = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (total === 0) return percentages;
    for (let i = 1; i <= 5; i++) {
      const count = stats.distribution[i] || 0;
      percentages[i] = Math.round((count / total) * 100);
    }
    return percentages;
  }, [activeReviews, stats]);

  const sourcingMetrics = useMemo(() => {
    const avgScore = Number(stats.avg) || 5.0;
    const fabric = Math.min(5.0, avgScore + 0.05);
    const weave = Math.min(5.0, avgScore - 0.05);
    const speed = Math.min(5.0, avgScore + 0.1);
    return {
      fabric: fabric.toFixed(1),
      weave: weave.toFixed(1),
      speed: speed.toFixed(1),
      fabricPct: (fabric / 5) * 100,
      weavePct: (weave / 5) * 100,
      speedPct: (speed / 5) * 100,
    };
  }, [stats.avg]);

  const handleRatingChange = (newRating) => {
    setReviewForm(prev => ({ ...prev, rating: newRating }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.reviewer_name || !reviewForm.comment) {
      setReviewSubmitError('Please fill in all required fields (Name and Comment).');
      return;
    }
    if (!isCaptchaVerified) {
      setReviewSubmitError('Please complete the verification slider.');
      return;
    }

    const trimmedName = reviewForm.reviewer_name.trim().slice(0, 100);
    const trimmedBusiness = (reviewForm.business_name || 'B2B Client').trim().slice(0, 200);
    const trimmedTitle = (reviewForm.title || 'Product Review').trim().slice(0, 200);
    const trimmedComment = reviewForm.comment.trim().slice(0, 2000);

    if (trimmedName.length < 2) {
      setReviewSubmitError('Name must be at least 2 characters.');
      return;
    }
    if (trimmedComment.length < 10) {
      setReviewSubmitError('Comment must be at least 10 characters.');
      return;
    }

    setReviewSubmitting(true);
    setReviewSubmitError('');

    const userObj = user || null;
    const isGuest = !userObj;
    
    const newReview = {
      product_id: product.id,
      reviewer_name: trimmedName,
      business_name: trimmedBusiness,
      rating: reviewForm.rating,
      title: trimmedTitle,
      comment: trimmedComment,
      status: isGuest ? 'pending' : 'approved',
      created_at: new Date().toISOString(),
    };

    if (!isGuest && userObj.id) {
      newReview.user_id = userObj.id;
    }

    try {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('product_reviews')
          .insert([newReview]);

        if (!isGuest) {
          query = query.select();
        }

        const { data, error: insertError } = await query;

        if (insertError) {
          throw new Error(insertError.message || 'Database insert failed');
        }

        if (!isGuest) {
          if (data && data[0]) {
            setDbReviews(prev => [data[0], ...prev]);
          } else {
            setDbReviews(prev => [newReview, ...prev]);
          }
        }
      } else {
        const localStr = localStorage.getItem(`weave365_local_product_reviews_${product.id}`);
        const localReviews = localStr ? JSON.parse(localStr) : [];
        const addedReview = { id: `local-${Date.now()}`, ...newReview };
        const updatedLocal = [addedReview, ...localReviews];
        localStorage.setItem(`weave365_local_product_reviews_${product.id}`, JSON.stringify(updatedLocal));
        setDbReviews(prev => [addedReview, ...prev]);
      }

      setReviewSubmitSuccess(true);
      setReviewForm({
        reviewer_name: userObj?.user_metadata?.full_name || '',
        business_name: userObj?.user_metadata?.business_name || '',
        rating: 5,
        title: '',
        comment: '',
      });
      setIsCaptchaVerified(false);
      setIsCaptchaReset(true);
      setTimeout(() => setIsCaptchaReset(false), 200);

      setTimeout(() => {
        setReviewSubmitSuccess(false);
        setShowReviewForm(false);
      }, 3000);

    } catch (err) {
      console.error('Error submitting product review:', err);
      setReviewSubmitError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Dynamic Tab Title, Meta Description & Canonical Link SEO injection for Product Detail page
  usePageSeo({
    title: product.metaTitle || product.title || `${storeConfig.name} Product`,
    description: product.metaDescription || product.summary || product.description || `View ${product.metaTitle || product.title} in the ${storeConfig.name} wholesale catalogue.`,
    canonical: product.id ? `${siteUrl}/${getProductCategorySlug(product.id, product.category)}/${encodeURIComponent(product.id)}` : undefined
  });

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

  const pcSetVal = useMemo(() => {
    const rawVal = String(product.raw?.['Pc / Set'] || '').trim().toLowerCase();
    if (rawVal) return rawVal;

    // Fallback to defaults based on category
    const category = String(product.category || '').trim().toLowerCase();
    if (category === 'saree' || category === 'fabric' || category === 'under 999') {
      return 'pc';
    }
    return 'set';
  }, [product.raw, product.category]);
  const isSoldAsPc = useMemo(() => pcSetVal === 'pc', [pcSetVal]);
  const isSoldAsBoth = useMemo(() => pcSetVal === 'pc, set' || pcSetVal === 'set, pc', [pcSetVal]);
  const isSoldAsSet = useMemo(() => pcSetVal === 'set', [pcSetVal]);

  const moqUnit = isSoldAsPc ? 'Piece' : 'Set';
  const moqUnitShort = isSoldAsPc ? 'pc' : 'Set';
  const moqUnitPlural = isSoldAsPc ? 'Pieces' : 'Sets';
  const moqMultiplier = isSoldAsPc ? 1 : totalColors;

  const isSaree = String(product.category || '').toLowerCase() === 'saree';
  const longDescriptionSections = useMemo(() => {
    const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
    const sections = [
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
        content: priceAccess?.priceGroup === 'wholesale'
          ? `This product has a minimum order requirement of just 1 ${moqUnit}. Boutiques can order single sample packages with guaranteed quality.`
          : (isSoldAsBoth
            ? 'Highly flexible MOQ options. You can purchase this design as individual selected pieces or save more by ordering full color matching sets.'
            : `This product has a low minimum order requirement of just 1 ${moqUnit}. Boutiques can order single sample packages with guaranteed quality.`)
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
    if (isUnder999) {
      return sections.filter(sec => sec.id !== 'moq');
    }
    return sections;
  }, [product, totalColors, isSoldAsBoth, moqUnit, isSaree, priceAccess]);

  const colorOptions = useMemo(() => {
    if (product.colorOptions?.length) return product.colorOptions;

    const seen = new Set();
    return product.variants.reduce((acc, item) => {
      if (item.color || item.image) {
        const key = `${item.color}|${item.image}`;
        if (!seen.has(key)) {
          seen.add(key);
          acc.push({
            name: item.color,
            image: item.image,
          });
        }
      }
      return acc;
    }, []);
  }, [product.colorOptions, product.variants]);

  // Handle color/variant query parameter initialization on page load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlColor = params.get('color');
    const urlVariant = params.get('variant');

    if (urlVariant) {
      const matchingVariant = product.variants?.find(
        (v) => String(v.code).toLowerCase() === urlVariant.toLowerCase()
      );
      if (matchingVariant) {
        setVariantCode(matchingVariant.code);
        if (matchingVariant.color) {
          setSelectedColorName(matchingVariant.color);
        }
        if (matchingVariant.image) {
          setSelectedImage(matchingVariant.image);
        }
        return;
      }
    }

    if (urlColor) {
      const matchingColorOpt = colorOptions.find(
        (c) => String(c.name).toLowerCase() === urlColor.toLowerCase()
      );
      const matchingVariant = product.variants?.find(
        (v) => String(v.color).toLowerCase() === urlColor.toLowerCase()
      );
      if (matchingColorOpt || matchingVariant) {
        const targetColor = matchingColorOpt?.name || matchingVariant?.color;
        setSelectedColorName(targetColor);
        const targetImage = matchingColorOpt?.image || matchingVariant?.image;
        if (targetImage) {
          setSelectedImage(targetImage);
        }
        const targetCode = matchingVariant?.code || product.variants?.find(v => v.color === targetColor)?.code;
        if (targetCode) {
          setVariantCode(targetCode);
        }
      }
    }
  }, [product.id, colorOptions, product.variants]);
  const productStatusTags = useMemo(
    () => (product.statusTags || []).filter((tag) => {
      const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
      if (tag.key === 'bestseller') return false;
      if (tag.key === 'low-moq' && isUnder999) return false;
      if (!canViewPrice && tag.key === 'low-moq') return false;
      if (tag.key === 'low-moq' && priceAccess?.priceGroup === 'reseller' && priceAccess?.canViewPrices) return false;
      return true;
    }),
    [product.statusTags, canViewPrice, priceAccess, product.category],
  );
  const related = useMemo(() => {
    let others = products.filter((item) => item.id !== product.id && item.category === product.category);
    
    // Fall back to all products if the same-category list is too small (e.g. less than 5)
    if (others.length < 5) {
      others = products.filter((item) => item.id !== product.id);
    }

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
  }, [product.id, product.pattern, product.fabric, product.category, products]);
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
    [product.description],
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

  const galleryStyle = useMemo(
    () => (galleryHeight ? { '--gallery-height': `${galleryHeight}px` } : undefined),
    [galleryHeight],
  );

  function handleEnquiryClick() {
    if (totalColors > 1) {
      addToCart(product, variant, 1, { colorName: 'Select Color' });
    } else {
      addToCart(product, variant, 1);
    }
  }

  const downloadImagesAsZip = useCallback(async () => {
    const userId = priceAccess?.userId;
    const productId = product.id;
    if (!userId) {
      setToastMessage('Please login to download images');
      setTimeout(() => setToastMessage(''), 3000);
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    const localKey = `weave365_dl_${userId}_${productId}_${todayStr}`;

    // 1. Fast client-side localStorage check
    if (localStorage.getItem(localKey)) {
      setToastMessage('Limit reached: 1 download per product per day');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    try {
      setIsDownloading(true);

      // 2. Try Database Insert FIRST to act as a lock
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('download_logs').insert({
          user_id: userId,
          product_id: productId
        });

        if (error) {
          console.warn('Database rate limit blocked download:', error);
          localStorage.setItem(localKey, 'true'); // Sync local storage
          setToastMessage('Limit reached: 1 download per product per day');
          setTimeout(() => setToastMessage(''), 4000);
          return; // Finally block will set isDownloading(false)
        }
      }

      // 3. Proceed with actual download
      const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('jszip'),
        import('file-saver'),
      ]);
      const zip = new JSZip();

      // Construct and add the product details text file
      const isSaree = String(product.category || '').toLowerCase() === 'saree';
      const isUnder999 = String(product.category || '').toLowerCase() === 'under 999';
      const lengthText = isSaree ? '6.3m (including 85cm Blouse)' : (product.length || 'Standard');

      const isWholesaler = priceAccess?.priceGroup === 'wholesale';
      const shippingLine = isWholesaler ? 'Excluded: GST & Shipping' : 'Included: Free Shipping in India (Excluding GST)';
      let priceText = 'On request';
      if (displayPrice != null && displayPrice > 0) {
        if (isWholesaler && totalColors > 1 && !isSoldAsPc && !isUnder999) {
          priceText = `${formatMoney(displayPrice * totalColors)} /Set (${formatMoney(displayPrice)} /pc)`;
        } else {
          priceText = `${formatMoney(displayPrice)} /pc`;
        }
      }

      const detailsLines = [
        `Code: ${variant?.code || 'N/A'}`,
        `Price: ${priceText}`,
        shippingLine,
        '',
        `${product.title}`,
        '',
        `Description:`,
        product.description || 'No description available.',
        '',
        `Specifications:`,
        `- Color:`,
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
      const promises = product.images.map(async (url, index) => {
        // Route requests through our native API proxy to bypass client-side CORS issues
        const fetchUrl = url.startsWith('http') ? `/api/image?url=${encodeURIComponent(url)}` : url;
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const filename = `${safeTitle}-${index + 1}.jpg`;
        zip.file(filename, blob);
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${product.title.replace(/\s+/g, '-').toLowerCase()}-images.zip`);

      // 4. Log download locally
      localStorage.setItem(localKey, 'true');
    } catch (error) {
      console.error('Error downloading images:', error);
      alert('Failed to download images. They might be hosted on a server that restricts direct downloads.');
    } finally {
      setIsDownloading(false);
    }
  }, [product.id, product.images, product.title, priceAccess, variant, displayPrice, totalColors, isSoldAsPc]);

  const shareProductPage = useCallback(async () => {
    let shareUrl = typeof window !== 'undefined' ? window.location.href : `${siteUrl}/${getProductCategorySlug(product.id, product.category)}/${product.id}`;
    if (typeof window !== 'undefined') {
      const refCode = getStoredReferralCode();
      if (refCode) {
        try {
          const urlObj = new URL(shareUrl);
          if (!urlObj.searchParams.has('ref') && !urlObj.searchParams.has('influencer')) {
            urlObj.searchParams.set('ref', refCode);
            shareUrl = urlObj.toString();
          }
        } catch (e) {
          console.error('[Share] Invalid share URL format:', e);
        }
      }
    }
    const shareText = `Check out ${product.title} on Weave 365`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Product link copied to clipboard!');
      } catch (err) {
        alert('Sharing is not supported on this device.');
      }
    }
  }, [product.id, product.title, product.category]);

  const [prevProduct, setPrevProduct] = useState(product);
  if (product !== prevProduct) {
    setPrevProduct(product);
    setSelectedImage(product.images[0]);
    setSelectedColorName(product.colorOptions?.[0]?.name || product.variants[0]?.color || '');
    setVariantCode(product.variants[0]?.code);
    setVariationDrawerOpen(false);
  }

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

    const hasSubVariants = product.variants.some((v) => v.code && v.code.includes('-'));
    const matchingVariant = product.variants.find((item) => {
      if (hasSubVariants && item.code && !item.code.includes('-')) return false;
      return item.color === nextColorName;
    }) || product.variants.find((item) => item.color === nextColorName);

    if (matchingVariant?.code) {
      setVariantCode(matchingVariant.code);
    }
  }, [colorOptions, product.variants]);

  const handleImageChange = useCallback((nextImage) => {
    setSelectedImage(nextImage);

    const matchingColor = colorOptions.find((item) => item.image === nextImage);
    const matchingVariant = product.variants.find((item) => item.image === nextImage)
      || product.variants.find((item) => matchingColor?.name && item.color === matchingColor.name);

    if (matchingVariant?.code) {
      setVariantCode(matchingVariant.code);
    }

    if (!matchingVariant && product.variants[0]?.code) {
      setVariantCode(product.variants[0].code);
    }

    const nextColorName = matchingVariant?.color || matchingColor?.name || product.colorOptions?.[0]?.name || product.variants[0]?.color;
    if (nextColorName) {
      setSelectedColorName(nextColorName);
    }
  }, [colorOptions, product.colorOptions, product.variants]);

  const breadcrumbItems = [
    { name: 'Home', url: '/', route: 'home' },
    { name: 'Catalogue', url: '/catalogue', route: 'catalogue', routeOptions: { category: 'All', fabric: 'All', weave: 'All', search: '' } },
    ...(product.category ? [{ name: product.category, url: `/${getCategorySlug(product.category)}`, route: getCategorySlug(product.category), routeOptions: { category: product.category, fabric: 'All', weave: 'All', search: '' } }] : []),
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
                <button type="button"
                  key={image}
                  className={selectedImage === image ? 'active' : ''}
                  onClick={() => handleImageChange(image)}
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
                <button type="button"
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
              {selectedImage && (selectedImage.startsWith('https://www.youtube.com/embed') || selectedImage.startsWith('https://www.youtube-nocookie.com/embed')) ? (
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
                  <button type="button" className="zoom-button" aria-label="View larger image" onClick={() => setZoomImage(selectedImage || product.images[0] || fallbackProductImage)}>
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
                  ['Fabric Top', product.fabricTop],
                  ['Fabric Bottom', product.fabricBottom],
                  ['Fabric Dupatta', product.fabricDupatta],
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

            <div className="product-disclaimer-box desktop-disclaimer-only">
              <p>
                <span className="product-disclaimer-label">Disclaimer:</span> Slight variations in color, fabric, and weaving are possible. <strong>Model/Cover image is for reference only.</strong> Making a payment indicates your agreement to this.
              </p>
            </div>

            <div className="global-sourcing-card desktop-sourcing-only">
              <div className="card-header">
                <Globe className="globe-icon-gold" size={20} />
                <h3>Global B2B Sourcing</h3>
              </div>
              <p>
                {product.metaDescription || product.summary || "Source bulk Banarasi sarees and suits direct from Varanasi. Weave 365 is a wholesale supplier providing international shipping to the USA, UK, UAE, Canada, Australia and more. Fast WhatsApp ordering is available for India and global B2B orders."}
              </p>
              <div className="card-footer-badges">
                <span>✓ {product.partner ? 'Artisan Partner' : 'Verified Supplier'}</span>
                <span>✓ {product.purity && product.purity.toLowerCase() !== 'faux' ? `${product.purity} Quality` : 'Customs Handled'}</span>
                {String(product.category || '').toLowerCase() !== 'under 999' && (
                  <span>✓ {priceAccess?.priceGroup === 'wholesale' ? `MOQ: 1 ${moqUnit}` : (isSoldAsBoth ? 'Piece & Set MOQ' : `MOQ 1 ${moqUnit}`)}</span>
                )}
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
            <button type="button" className="info-fav" onClick={() => toggleFavorite(product)} aria-label="Save for later">
              <Bookmark size={24} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <h1 className="product-title-serif">{product.title}</h1>

            {product.partner && (
              <div
                className="trusted-partner-card-v2"
                onClick={() => navigate('partner', product.partner)}
                title={`View all products by ${product.partner}`}
                style={{ marginTop: '12px', marginBottom: '12px' }}
              >
                <div className="partner-card-accent-bar" />
                <Award size={18} className="partner-award-icon" />
                <div className="partner-card-info">
                  <span className="partner-label-v2">Weaver Partner</span>
                  <span className="partner-dot">•</span>
                  <span className="partner-name-v2">{product.partner}</span>
                </div>
              </div>
            )}

            <div className="product-code-new">
              Code: <strong>{variant.code}</strong>
            </div>

            <div className="price-moq-row">
              <div className="main-price-wrap">
                {canViewPrice ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {priceAccess?.priceLabel && (
                      <span className="price-label-badge" style={{ fontSize: 'var(--small-size)', textTransform: 'uppercase', color: '#b8924a', letterSpacing: '1.2px', fontWeight: '700' }}>
                        {priceAccess.priceLabel}
                      </span>
                    )}
                    <div className="product-price-layout">
                      <div className="price-piece-block">
                        <span className="price-value">{formatMoney(displayPrice)}</span>
                        <span className="price-unit">/pc</span>
                        {canViewPrice && String(product.category || '').toLowerCase() !== 'under 999' && (
                          (priceAccess?.priceGroup === 'wholesale' && (totalColors <= 1 || isSoldAsPc)) ||
                          priceAccess?.priceGroup === 'reseller'
                        ) && (
                          <div className="moq-badge">
                            {priceAccess?.priceGroup === 'wholesale'
                              ? `MOQ: 1 ${moqUnit}`
                              : (priceAccess?.priceGroup === 'reseller'
                                  ? (isSoldAsPc ? `MOQ: 1 ${moqUnit}` : 'Flexible MOQ')
                                  : (isSoldAsBoth ? 'Flexible MOQ' : `MOQ 1 ${moqUnit}`))}
                          </div>
                        )}
                      </div>
                      {priceAccess?.priceGroup === 'wholesale' && totalColors > 1 && !isSoldAsPc && String(product.category || '').toLowerCase() !== 'under 999' && (
                        <div className="price-set-block">
                          <span className="price-pipe"></span>
                          <span className="price-value price-value-set">{formatMoney(displayPrice * totalColors)}</span>
                          <span className="price-unit price-unit-set">/Set ({totalColors} pcs)</span>
                          {canViewPrice && (
                            <div className="moq-badge">
                              MOQ: 1 Set
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button type="button" className="guest-price-notice" onClick={openAuth}>
                    <LockKeyhole size={18} /> {priceNoticeForAccess(priceAccess)}
                  </button>
                )}
              </div>
            </div>

            {priceAccess?.priceGroup === 'reseller' || priceAccess?.priceGroup === 'guest' ? (
              <span className="gst-disclaimer" style={{ marginTop: '8px', marginBottom: '12px' }}>
                Excluding GST • <span className="free-shipping-highlight">Free Shipping in India</span>
              </span>
            ) : (
              <span className="gst-disclaimer" style={{ marginTop: '8px', marginBottom: '12px' }}>
                <span className="free-shipping-highlight">Excluding GST & Shipping</span>
              </span>
            )}

            {canViewPrice && priceAccess?.priceGroup === 'wholesale' && String(product.category || '').toLowerCase() !== 'under 999' && (
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

            <div className="international-courier-note">
              <Globe size={16} />
              <span>
                International courier charges depend on weight; as weight increases, the per-unit cost becomes cheaper.
              </span>
            </div>

            {!(priceAccess?.priceGroup === 'reseller' || priceAccess?.priceGroup === 'guest') && (
              <p className="b2b-shipping-note" style={{ 
                margin: '0 0 12px 0', 
                fontSize: 'var(--body-size)', 
                lineHeight: '1.6', 
                color: 'var(--muted)', 
                fontFamily: 'var(--font-ui)', 
                fontWeight: 400
              }}>
                For accurate shipping charges and delivery timelines, kindly WhatsApp us your order quantity along with your city and pin code. We will get back to you promptly.
              </p>
            )}

            <div className="quick-facts">
              {String(product.category || '').toLowerCase() !== 'under 999' && (
                <span>
                  <Layers size={22} />Colors in a set: <strong>{totalColors}</strong>
                </span>
              )}
              <span>
                <ShoppingBag size={22} /> Weight per piece: <strong>{formatWeight(singleWeight)}</strong>
              </span>
              {product.weave && (
                <span className="quick-fact-weave">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold-mid)', flexShrink: 0 }}>
                    <path d="M6 3v18M12 3v18M18 3v18M3 6h18M3 12h18M3 18h18" />
                  </svg>
                  Weave Technique: <strong>{product.weave}</strong>
                </span>
              )}
              <span>
                <ShieldCheck size={22} />
                Business Policy: <strong><a href="https://weave365.com/disclaimer" onClick={(e) => { e.preventDefault(); if (typeof navigate === 'function') { navigate('disclaimer'); } else if (typeof window !== 'undefined') { window.location.href = '/disclaimer'; } }} style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>View Policy</a></strong>
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
                  <ShoppingBag size={20} /> Add to Cart
                </button>
                <button className="secondary-action-btn" type="button" onClick={() => handleRestrictedAction('Download', downloadImagesAsZip)} disabled={isDownloading}>
                  <Download size={18} /> {isDownloading ? 'Zipping...' : 'Download'}
                </button>
                {(priceAccess?.priceGroup === 'reseller' || priceAccess?.priceGroup === 'wholesale') && priceAccess?.canViewPrices ? (
                  <div className="share-dropdown-container" ref={shareMenuRef}>
                    <button
                      className="secondary-action-btn reseller-share-dropdown-trigger"
                      type="button"
                      onClick={() => setShareMenuOpen(!shareMenuOpen)}
                    >
                      <Share2 size={18} /> Share <ChevronDown size={14} className={`dropdown-arrow ${shareMenuOpen ? 'open' : ''}`} />
                    </button>
                    {shareMenuOpen && (
                      <div className="share-dropdown-menu">
                        <button
                          type="button"
                          className="share-dropdown-item"
                          onClick={() => {
                            setShareMenuOpen(false);
                            setWhatsappShareOpen(true);
                          }}
                        >
                          <Share2 size={18} /> Share with Customer
                        </button>
                        <button
                          type="button"
                          className="share-dropdown-item"
                          onClick={() => {
                            setShareMenuOpen(false);
                            setShowShareModal(true);
                          }}
                        >
                          <Layers size={18} /> Get White-Label Link
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button className="secondary-action-btn" type="button" onClick={() => handleRestrictedAction('Share', shareProductPage)}>
                    <Share2 size={18} /> Share
                  </button>
                )}
              </div>
            </div>
            <p className="buyer-note">
              <LockKeyhole size={16} /> Only registered buyers can download and share
            </p>


            <div className="product-disclaimer-box mobile-disclaimer-only">
              <p>
                <span className="product-disclaimer-label">Disclaimer:</span> Slight variations in color, fabric, and weaving are possible. Model image is for reference only. Making a payment indicates your agreement to this.
              </p>
            </div>

            <div className="global-sourcing-card mobile-sourcing-only">
              <div className="card-header">
                <Globe className="globe-icon-gold" size={20} />
                <h3>Global B2B Sourcing</h3>
              </div>
              <p>
                {product.metaDescription || product.summary || "Source bulk Banarasi sarees and suits direct from Varanasi. Weave 365 is a wholesale supplier providing international shipping to the USA, UK, UAE, Canada, Australia and more. Fast WhatsApp ordering is available for India and global B2B orders."}
              </p>
              <div className="card-footer-badges">
                <span>✓ {product.partner ? 'Artisan Partner' : 'Verified Supplier'}</span>
                <span>✓ {product.purity && product.purity.toLowerCase() !== 'faux' ? `${product.purity} Quality` : 'Customs Handled'}</span>
                {String(product.category || '').toLowerCase() !== 'under 999' && (
                  <span>✓ {priceAccess?.priceGroup === 'wholesale' ? `MOQ: 1 ${moqUnit}` : (isSoldAsBoth ? 'Piece & Set MOQ' : `MOQ 1 ${moqUnit}`)}</span>
                )}
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
                    <button type="button"
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
              {product.weave && (
                <div className="highlight-card">
                  <span className="card-icon">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold-mid)' }}>
                      <path d="M6 3v18M12 3v18M18 3v18M3 6h18M3 12h18M3 18h18" />
                    </svg>
                  </span>
                  <div className="card-body">
                    <h3>Weave Technique</h3>
                    <p>Authentic {product.weave} handloom weaving technique</p>
                  </div>
                </div>
              )}
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
              <div className="highlight-card animate-detailing">
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
                answer: String(product.category || '').toLowerCase() === 'under 999'
                  ? "For retailers and boutique owners, our MOQ starts at just 1 piece. This allows you to test our premium Banarasi collection with minimal upfront capital."
                  : "For retailers and boutique owners, our MOQ starts at just 1 set (which typically contains all available color variants of the design). This allows you to test our premium Banarasi collection with minimal upfront capital."
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

        {/* Product Reviews & Rating Breakdown Section */}
        <section className="product-reviews-section animate-fade-in">
          <div className="section-heading-row" style={{ marginBottom: '1.5rem' }}>
            <SectionTitle title="Client Sourcing Reviews" align="left" />
          </div>

          <div className="reviews-minimal-header">
            <div className="reviews-minimal-summary">
              <span className="reviews-average-score">{stats.avg} ★</span>
              <span className="reviews-count-label">Based on {stats.count} verified B2B reviews</span>
            </div>
            
            <button 
              type="button"
              className={`reviews-write-btn-minimal ${showReviewForm ? 'active' : ''}`}
              onClick={() => {
                if (!user && !priceAccess?.userId) {
                  openAuth();
                } else {
                  setShowReviewForm(!showReviewForm);
                }
              }}
            >
              {showReviewForm ? 'Cancel' : 'Write a Review'}
            </button>
          </div>

          {showReviewForm && (
            <div className="reviews-form-container-minimal animate-fade-in">
              {reviewSubmitSuccess ? (
                <div className="review-submit-success-card animate-scale-up">
                  <Check size={24} className="success-check-icon" />
                  <h4 className="success-title">Review Submitted Successfully</h4>
                  <p className="success-message">
                    Thank you for sharing your experience. Your verified review helps other B2B boutique owners make informed sourcing decisions and supports local weavers in Varanasi.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="form-title-minimal">Submit Sourcing Review</h3>
                  <form onSubmit={handleReviewSubmit} className="reviews-entry-form-minimal">
                    <div className="form-grid-2-minimal">
                      <div className="form-group-minimal">
                        <label htmlFor="prod_reviewer_name">Your Name *</label>
                        <input
                          type="text"
                          id="prod_reviewer_name"
                          required
                          value={reviewForm.reviewer_name}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, reviewer_name: e.target.value }))}
                          placeholder="e.g. Ananya Rao"
                        />
                      </div>
                      <div className="form-group-minimal">
                        <label htmlFor="prod_business_name">Business Details</label>
                        <input
                          type="text"
                          id="prod_business_name"
                          value={reviewForm.business_name}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, business_name: e.target.value }))}
                          placeholder="e.g. Aura Silks, Chennai"
                        />
                      </div>
                    </div>

                    <div className="form-group-minimal">
                      <label>Overall Rating *</label>
                      <div className="interactive-stars-row-minimal">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => handleRatingChange(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="star-rating-btn-minimal"
                            aria-label={`Rate ${star} stars`}
                          >
                            <SharpStar
                              size={18}
                              fill={star <= (hoveredRating || reviewForm.rating) ? 'var(--gold)' : 'none'}
                              stroke="var(--gold)"
                              className="interactive-star-minimal"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group-minimal">
                      <label htmlFor="prod_review_title">Review Title</label>
                      <input
                        type="text"
                        id="prod_review_title"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Soft fabric, premium gold zari border"
                      />
                    </div>

                    <div className="form-group-minimal">
                      <label htmlFor="prod_review_comment">Review Details *</label>
                      <textarea
                        id="prod_review_comment"
                        required
                        rows={3}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Describe the fabric weight, weaving density, color vibrancy, or customer response..."
                      />
                    </div>

                    <div className="captcha-wrapper-minimal">
                      <SliderCaptcha onVerify={setIsCaptchaVerified} isReset={isCaptchaReset} />
                    </div>

                    {reviewSubmitError && <p className="review-submit-error-minimal">{reviewSubmitError}</p>}
                    
                    <button 
                      type="submit" 
                      disabled={reviewSubmitting || !isCaptchaVerified} 
                      className="review-submit-btn-minimal"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Product Review'}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {activeReviews.length > 0 && (
            <div className="reviews-feed-container-minimal">
              {activeReviews.slice(0, visibleCount).map((review, index) => (
                <article className="review-item-minimal animate-fade-in" key={review.id || index}>
                  <div className="review-item-meta-minimal">
                    <span className="reviewer-name-minimal">{review.reviewer_name}</span>
                    {review.business_name && (
                      <span className="reviewer-business-minimal">({review.business_name})</span>
                    )}
                    <span className="review-date-minimal">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="review-item-rating-row-minimal">
                    <div className="review-item-stars-minimal">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <SharpStar
                          key={star}
                          size={11}
                          fill={star <= review.rating ? 'var(--gold)' : 'none'}
                          stroke="var(--gold)"
                          className="feed-star-icon-minimal"
                        />
                      ))}
                    </div>
                    <span className="reviewer-badge-minimal">✓ Verified Buyer</span>
                  </div>

                  <div className="reviewer-purchase-details-minimal">
                    Ordered: {product.title}
                  </div>

                  {review.title && <h4 className="review-item-title-minimal">{review.title}</h4>}
                  <p className="review-item-comment-minimal">{review.comment}</p>
                </article>
              ))}

              {activeReviews.length > visibleCount && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="reviews-write-btn-minimal"
                    style={{ background: 'transparent', color: 'var(--ink)' }}
                    onClick={() => setVisibleCount(prev => prev + 5)}
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="you-may-like home-product-section">
          <div className="section-heading-row">
            <SectionTitle title="You May Also Like" align="left" />
          </div>
          <div className="scroll-wrapper">
            <button type="button"
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

            <button type="button"
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
        <div className="modal-backdrop zoom-backdrop" onClick={() => setZoomImage(null)}>
          <button type="button" className="icon-button modal-close zoom-close-btn" onClick={() => setZoomImage(null)}>
            <X size={24} />
          </button>

          {product.images && product.images.length > 1 && (
            <>
              <button
                type="button"
                className="zoom-nav-btn prev"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = product.images.indexOf(zoomImage);
                  if (currentIndex !== -1) {
                    const prevIdx = (currentIndex - 1 + product.images.length) % product.images.length;
                    setZoomImage(product.images[prevIdx]);
                  }
                }}
                aria-label="Previous image"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                type="button"
                className="zoom-nav-btn next"
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = product.images.indexOf(zoomImage);
                  if (currentIndex !== -1) {
                    const nextIdx = (currentIndex + 1) % product.images.length;
                    setZoomImage(product.images[nextIdx]);
                  }
                }}
                aria-label="Next image"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}

          <img
            src={zoomImage}
            alt="Zoomed view"
            className="zoom-modal-img"
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
        isSoldAsPc={isSoldAsPc}
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

      {(priceAccess?.priceGroup === 'reseller' || priceAccess?.priceGroup === 'wholesale') && priceAccess?.canViewPrices && (
        <ResellerWhatsappShare
          showTrigger={false}
          open={whatsappShareOpen}
          onClose={() => setWhatsappShareOpen(false)}
          product={product}
          variant={variant}
          quantity={totalColors}
          selectedColorName={selectedColorName}
          imageUrl={selectedImage}
          priceAccess={priceAccess}
        />
      )}

    </>
  );
}
