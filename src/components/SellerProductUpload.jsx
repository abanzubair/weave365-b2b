/**
 * @file SellerProductUpload.jsx
 * @description Seller Product Upload Component for Weave365.
 * Enables authorized loom and brand partners to upload multi-color single-design products
 * directly to Cloudflare R2 storage, strictly enforcing predefined SKU format,
 * exact attribute taxonomies, conditional suit fabrics, and admin approval workflows.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import '../styles/sellerUpload.css';
import {
  Upload,
  Boxes,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Tag,
  Store,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
} from './icons.jsx';
import { WhatsappIcon } from './WhatsappIcon.jsx';
import {
  PRODUCT_CATEGORIES,
  COLOR_OPTIONS,
  FABRIC_OPTIONS,
  WORK_OPTIONS,
  PATTERN_OPTIONS,
  WEAVE_OPTIONS,
  PURITY_OPTIONS,
  TYPE_OPTIONS,
  SUIT_TOP_FABRICS,
  SUIT_BOTTOM_FABRICS,
  SUIT_DUPATTA_FABRICS,
  getCategoryCode,
  getVendorDigits,
  generateBaseSku,
} from '../constants/sellerProductOptions.js';
import { isStrictImageFile, optimizeImageOnDevice } from '../utils/clientImageOptimizer.js';

/**
 * Upload a file to /api/upload with real-time XMLHttpRequest progress tracking
 * and safety timeout to prevent hanging UI.
 */
function uploadWithProgress(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.timeout = 45000; // 45s safety timeout

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error. Check connection and retry.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out after 45 seconds'));

    xhr.send(formData);
  });
}

export function SellerProductUpload({ user, buyerProfile, catalogProducts = [] }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'submissions'
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [localCatalogProducts, setLocalCatalogProducts] = useState(() => (Array.isArray(catalogProducts) && catalogProducts.length >= 25 ? catalogProducts : []));

  // Ensure full catalog is loaded so SKU design numbers never collide
  useEffect(() => {
    if (Array.isArray(catalogProducts) && catalogProducts.length >= 25) {
      setLocalCatalogProducts(catalogProducts);
    } else {
      import('../productData.js')
        .then((m) => m.fetchProducts())
        .then((all) => {
          if (Array.isArray(all) && all.length > 0) {
            setLocalCatalogProducts(all);
          }
        })
        .catch((err) => console.error('[SellerProductUpload] Error loading full catalog:', err));
    }
  }, [catalogProducts]);

  // 1. Seller Code verification
  const rawSellerCode = String(
    buyerProfile?.vendor_code ||
    user?.user_metadata?.buyer_profile?.vendor_code ||
    user?.buyer_profile?.vendor_code ||
    ''
  ).trim();

  const isAssigned = Boolean(rawSellerCode);
  const sellerCode = rawSellerCode.toUpperCase();
  const sellerName = String(
    buyerProfile?.business_name ||
    buyerProfile?.partner_name ||
    user?.user_metadata?.buyer_profile?.business_name ||
    ''
  ).trim();

  // 2. Form state for Product Attributes (initially blank)
  const [category, setCategory] = useState('');
  const [fabric, setFabric] = useState('');
  const [work, setWork] = useState('');
  const [pattern, setPattern] = useState('');
  const [weave, setWeave] = useState('');
  const [purity, setPurity] = useState('');
  const [productType, setProductType] = useState('');

  // Conditional fields for Suit
  const isSuit = Boolean(category && category.toLowerCase() === 'suit');
  const [fabricTop, setFabricTop] = useState('');
  const [fabricBottom, setFabricBottom] = useState('');
  const [fabricDupatta, setFabricDupatta] = useState('');

  // Optional price and title
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  // 3. Multi-color Single-Design Variations
  const [colorRows, setColorRows] = useState([
    {
      id: 'color-1',
      color: COLOR_OPTIONS[0],
      imageUrl: '',
      thumbUrl: '',
      uploading: false,
      optimizing: false,
      optimizeProgress: 0,
      optimizeStage: '',
      stats: '',
      uploadError: '',
      isCover: true,
    },
  ]);

  // 4. Calculate next available 3-digit design number
  const nextDesignNumber = useMemo(() => {
    if (!sellerCode) return '001';
    const catCode = getCategoryCode(category);
    const venDigits = getVendorDigits(sellerCode);
    const prefix = `${catCode}${venDigits}`;

    const existingDesignNumbers = new Set();
    const allProductsToCheck = localCatalogProducts.length > 0 ? localCatalogProducts : catalogProducts;

    // Check catalog products
    for (const p of allProductsToCheck) {
      const pSku = String(p.id || p.groupKey || p.raw?.Code || '').trim();
      if (pSku.startsWith(prefix) && pSku.length >= 6) {
        const dStr = pSku.slice(3, 6);
        const dNum = parseInt(dStr, 10);
        if (!isNaN(dNum)) existingDesignNumbers.add(dNum);
      }
    }

    // Check seller submissions
    for (const s of mySubmissions) {
      const sSku = String(s.sku || '').trim();
      if (sSku.startsWith(prefix) && sSku.length >= 6) {
        const dStr = sSku.slice(3, 6);
        const dNum = parseInt(dStr, 10);
        if (!isNaN(dNum)) existingDesignNumbers.add(dNum);
      }
    }

    // Find smallest positive integer not in set
    let candidate = 1;
    while (existingDesignNumbers.has(candidate)) {
      candidate += 1;
    }

    return String(candidate).padStart(3, '0').slice(-3);
  }, [sellerCode, category, catalogProducts, localCatalogProducts, mySubmissions]);

  // 5. Predefined Base SKU
  const baseSku = useMemo(() => {
    if (!sellerCode) return '000000';
    return generateBaseSku(category, sellerCode, nextDesignNumber);
  }, [category, sellerCode, nextDesignNumber]);

  // Fetch previous submissions for this seller
  const loadSubmissions = useCallback(async () => {
    if (!sellerCode) return;
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/seller/products?seller_code=${encodeURIComponent(sellerCode)}`);
      const data = await res.json();
      if (data && Array.isArray(data.products)) {
        setMySubmissions(data.products);
      }
    } catch (err) {
      console.warn('Failed to load seller submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [sellerCode]);

  useEffect(() => {
    if (isAssigned) {
      void loadSubmissions();
    }
  }, [isAssigned, loadSubmissions]);

  // Handle uploading an image for a specific color variation to Cloudflare R2
  // Runs on-device 2K optimization before uploading, rejecting non-images and showing progress
  const handleUploadImageForColor = async (rowId, file) => {
    if (!file) return;

    // 1. Strict image verification: Only image files can be uploaded
    if (!isStrictImageFile(file)) {
      setColorRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                uploadError: 'Only image files (JPEG, PNG, WEBP) can be uploaded. Documents or PDFs are not allowed.',
              }
            : r
        )
      );
      return;
    }

    // 2. Maximum file size safety limit (25MB)
    if (file.size > 25 * 1024 * 1024) {
      setColorRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, uploadError: 'File exceeds 25MB limit' } : r))
      );
      return;
    }

    // 3. Start on-device optimization phase
    setColorRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              optimizing: true,
              uploading: false,
              optimizeProgress: 10,
              optimizeStage: 'Inspecting image on device...',
              uploadError: '',
            }
          : r
      )
    );

    let tickerInterval = null;

    try {
      const targetRow = colorRows.find((r) => r.id === rowId);
      const colorName = targetRow?.color || 'Color';

      let fileToUpload = file;
      let statsString = '';

      // Phase 1: On-device 2K optimization (0% to 30%)
      const optResult = await optimizeImageOnDevice(file, {
        maxDimension: 2048,
        quality: 0.88,
        onProgress: (pct, stage) => {
          setColorRows((prev) =>
            prev.map((r) =>
              r.id === rowId
                ? {
                    ...r,
                    optimizing: true,
                    uploading: false,
                    optimizeProgress: Math.max(Math.min(Math.round(pct * 0.3), 30), 8),
                    optimizeStage: stage || 'Optimizing to 2K...',
                  }
                : r
            )
          );
        },
      });

      fileToUpload = optResult.file;
      if (optResult.wasOptimized) {
        statsString = `2K Optimized (${(optResult.originalSize / (1024 * 1024)).toFixed(1)}MB → ${(optResult.optimizedSize / 1024).toFixed(0)}KB • ${optResult.width}×${optResult.height})`;
      } else {
        statsString = `2K Verified (${optResult.width}×${optResult.height} • ${(optResult.originalSize / 1024).toFixed(0)}KB)`;
      }

      // Phase 2: Start Cloudflare R2 upload stream (30% to 85%)
      setColorRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                optimizing: false,
                uploading: true,
                optimizeProgress: 32,
                optimizeStage: 'Uploading photo...',
              }
            : r
        )
      );

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('folder', 'products');
      formData.append('sku', baseSku);
      formData.append('color', colorName);
      formData.append('index', String(colorRows.findIndex((r) => r.id === rowId) + 1));

      // Real upload tracking with XMLHttpRequest
      const uploadPromise = uploadWithProgress(formData, (streamPct) => {
        // Stream progress: 0 to 100% of bytes sent to server
        // Map to 32% -> 85%
        const mappedPct = Math.min(32 + Math.round(streamPct * 0.53), 85);

        setColorRows((prev) =>
          prev.map((r) =>
            r.id === rowId
              ? {
                  ...r,
                  optimizeProgress: mappedPct,
                  optimizeStage: streamPct < 100 ? `Uploading (${streamPct}%)...` : 'Saving to Cloudflare R2...',
                }
              : r
          )
        );

        // When bytes have fully reached server (streamPct === 100), smoothly tick up
        // from 85% to 98% while Cloudflare R2 processes and saves the file
        if (streamPct >= 100 && !tickerInterval) {
          let currentPct = 85;
          tickerInterval = setInterval(() => {
            currentPct = Math.min(currentPct + 2, 98);
            setColorRows((prev) =>
              prev.map((r) =>
                r.id === rowId
                  ? {
                      ...r,
                      optimizeProgress: currentPct,
                      optimizeStage: 'Saving to Cloudflare R2...',
                    }
                  : r
              )
            );
          }, 200);
        }
      });

      const data = await uploadPromise;
      if (tickerInterval) clearInterval(tickerInterval);

      if (!data || data.status !== 'success' || !data.url) {
        throw new Error(data?.error || 'Failed to upload image to Cloudflare');
      }

      setColorRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                imageUrl: data.url,
                thumbUrl: data.thumbUrl || data.url,
                uploading: false,
                optimizing: false,
                optimizeProgress: 100,
                optimizeStage: 'Upload Complete',
                stats: statsString,
                uploadError: '',
              }
            : r
        )
      );
    } catch (err) {
      if (tickerInterval) clearInterval(tickerInterval);
      console.error('Image processing or upload failed:', err);
      setColorRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? {
                ...r,
                uploading: false,
                optimizing: false,
                optimizeProgress: 0,
                optimizeStage: '',
                uploadError: err.message || 'Upload failed',
              }
            : r
        )
      );
    }
  };

  // Add another color row
  const handleAddColorRow = () => {
    const nextIndex = colorRows.length + 1;
    const defaultColor = COLOR_OPTIONS[nextIndex % COLOR_OPTIONS.length] || COLOR_OPTIONS[0];
    setColorRows((prev) => [
      ...prev,
      {
        id: `color-${Date.now()}-${nextIndex}`,
        color: defaultColor,
        imageUrl: '',
        thumbUrl: '',
        uploading: false,
        optimizing: false,
        optimizeProgress: 0,
        optimizeStage: '',
        stats: '',
        uploadError: '',
        isCover: false,
      },
    ]);
  };

  // Remove a color row
  const handleRemoveColorRow = (rowId) => {
    if (colorRows.length <= 1) return;
    setColorRows((prev) => {
      const filtered = prev.filter((r) => r.id !== rowId);
      // If removed was cover, set first as cover
      if (filtered.length && !filtered.some((r) => r.isCover)) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  // Set cover photo
  const handleSetCover = (rowId) => {
    setColorRows((prev) =>
      prev.map((r) => ({
        ...r,
        isCover: r.id === rowId,
      }))
    );
  };

  // Submit product for admin review
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(null);

    // Validation
    const missingImages = colorRows.filter((r) => !r.imageUrl);
    if (missingImages.length > 0) {
      setSubmitError('Please upload an image for all added color variations.');
      return;
    }

    if (!category) {
      setSubmitError('Please select a Category.');
      return;
    }
    if (!fabric) {
      setSubmitError('Please select a Fabric.');
      return;
    }
    if (isSuit && (!fabricTop || !fabricBottom || !fabricDupatta)) {
      setSubmitError('Please select Top, Bottom, and Dupatta fabrics for this Suit design.');
      return;
    }
    if (!work) {
      setSubmitError('Please select Work.');
      return;
    }
    if (!pattern) {
      setSubmitError('Please select a Pattern.');
      return;
    }
    if (!weave) {
      setSubmitError('Please select a Weave.');
      return;
    }
    if (!purity) {
      setSubmitError('Please select Purity.');
      return;
    }
    if (!productType) {
      setSubmitError('Please select a Type.');
      return;
    }

    setSubmitting(true);

    try {
      const coverRow = colorRows.find((r) => r.isCover) || colorRows[0];

      // Form color variants with exact predefined format: `${baseSku}-${idx + 1}`
      const colorsPayload = colorRows.map((r, idx) => ({
        color: r.color,
        image_url: r.imageUrl,
        sku: `${baseSku}-${idx + 1}`,
        is_cover: Boolean(r.isCover),
      }));

      const allImages = colorRows.map((r) => r.imageUrl).filter(Boolean);

      const payload = {
        seller_id: user?.id || null,
        seller_code: sellerCode,
        seller_name: sellerName || `Vendor ${sellerCode}`,
        sku: baseSku,
        category,
        category_code: getCategoryCode(category),
        design_code: nextDesignNumber,
        title: customTitle.trim() || `${fabric} ${work} ${category}`,
        fabric,
        fabric_top: isSuit ? fabricTop : null,
        fabric_bottom: isSuit ? fabricBottom : null,
        fabric_dupatta: isSuit ? fabricDupatta : null,
        work,
        pattern,
        weave,
        purity,
        type: productType,
        colors: colorsPayload,
        images: allImages,
        cover_image: coverRow?.imageUrl || allImages[0] || '',
        wholesale_price: wholesalePrice ? Number(wholesalePrice) : null,
      };

      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Failed to submit product.');
      }

      setSubmitSuccess({
        sku: baseSku,
        message: 'Product design uploaded successfully! It is now pending admin approval before going live on the website.',
      });

      // Reset form colors
      setColorRows([
        {
          id: `color-${Date.now()}`,
          color: COLOR_OPTIONS[0],
          imageUrl: '',
          thumbUrl: '',
          uploading: false,
          optimizing: false,
          optimizeProgress: 0,
          optimizeStage: '',
          stats: '',
          uploadError: '',
          isCover: true,
        },
      ]);
      setCustomTitle('');
      setWholesalePrice('');
      setCategory('');
      setFabric('');
      setWork('');
      setPattern('');
      setWeave('');
      setPurity('');
      setProductType('');
      setFabricTop('');
      setFabricBottom('');
      setFabricDupatta('');

      // Refresh list
      void loadSubmissions();
    } catch (err) {
      console.error('Submit failed:', err);
      setSubmitError(err.message || 'Failed to submit product.');
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // RENDER: Locked View if Seller Code is NOT assigned
  // ----------------------------------------------------
  if (!isAssigned) {
    const businessOrName = sellerName || buyerProfile?.full_name || user?.email || 'Seller Partner';
    const waMsg = `Hello Weave 365 Team,\n\nI have registered as a seller on Weave 365 (${businessOrName}, Email: ${user?.email || ''}). Could you please assign my Seller Code so I can upload our products?`;
    const waUrl = `https://wa.me/919919101369?text=${encodeURIComponent(waMsg)}`;

    return (
      <div className="seller-upload-container">
        <div className="seller-upload-locked-view">
          <div className="seller-locked-icon-wrapper">
            <Lock size={32} />
          </div>
          <h2 className="seller-locked-title">Seller Code Required to Upload</h2>
          <p className="seller-locked-desc">
            Your seller profile for <strong>{businessOrName}</strong> is created, but your{' '}
            <strong>Seller Code (e.g. V02)</strong> must be assigned by the administrator from the Admin Panel before you can upload products.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="seller-locked-wa-btn"
          >
            <WhatsappIcon size={18} />
            <span>Request Seller Code on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: Unlocked Seller Product Uploader
  // ----------------------------------------------------
  return (
    <div className="seller-upload-container">
      {/* Header Card */}
      <div className="seller-upload-header-card">
        <div className="seller-upload-header-top">
          <div>
            <h1 className="seller-upload-title">Product Upload Portal</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="seller-upload-nav-tabs">
          <button
            type="button"
            className={`seller-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} />
            <span className="seller-tab-text-desktop">Upload New Design</span>
            <span className="seller-tab-text-mobile">Upload Design</span>
          </button>
          <button
            type="button"
            className={`seller-tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            <Boxes size={16} />
            <span className="seller-tab-text-desktop">My Uploaded Designs</span>
            <span className="seller-tab-text-mobile">My Uploads</span>
            {mySubmissions.length > 0 && (
              <span className="seller-sku-pill" style={{ marginLeft: 4 }}>
                {mySubmissions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'submissions' ? (
        /* ================= SUBMISSIONS LIST TAB ================= */
        <div className="seller-card-section">
          <div className="seller-section-header">
            <div>
              <h2 className="seller-section-title">
                <Boxes size={18} />
                <span>Uploaded Product Designs</span>
              </h2>
              <p className="seller-section-desc">
                Designs submitted by Seller {sellerCode}. Approved designs are visible on the website.
              </p>
            </div>
            <button
              type="button"
              className="seller-tab-btn"
              onClick={loadSubmissions}
              disabled={loadingSubmissions}
            >
              <RefreshCw size={14} className={loadingSubmissions ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingSubmissions ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#78716c' }}>
              Loading submissions...
            </div>
          ) : mySubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#78716c' }}>
              <Boxes size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No designs uploaded yet</p>
              <p style={{ margin: '4px 0 16px 0', fontSize: 13 }}>
                Click "Upload New Design" to upload your first single-design collection.
              </p>
              <button
                type="button"
                className="seller-submit-btn"
                style={{ fontSize: 13, padding: '10px 20px' }}
                onClick={() => setActiveTab('upload')}
              >
                Upload First Design
              </button>
            </div>
          ) : (
            <div className="submissions-grid">
              {mySubmissions.map((item) => {
                const colors = Array.isArray(item.colors) ? item.colors : [];
                return (
                  <div className="submission-card" key={item.id || item.sku}>
                    <div className="submission-card-img-wrap">
                      <img
                        src={item.cover_image || (colors[0]?.image_url) || '/placeholder.png'}
                        alt={item.title || item.sku}
                        loading="lazy"
                      />
                      <span className={`submission-status-badge ${item.status || 'submitted'}`}>
                        {item.status === 'approved'
                          ? 'Approved & Live'
                          : item.status === 'rejected'
                          ? 'Changes Needed'
                          : 'Pending Review'}
                      </span>
                    </div>
                    <div className="submission-card-body">
                      <div className="submission-sku-title">
                        <span>SKU: {item.sku}</span>
                        <span style={{ fontSize: 12, color: '#0284c7' }}>{item.category}</span>
                      </div>
                      <p className="submission-meta-line">
                        <strong>Fabric:</strong> {item.fabric} • <strong>Work:</strong> {item.work}
                      </p>
                      <p className="submission-meta-line">
                        <strong>Weave:</strong> {item.weave} • <strong>Pattern:</strong> {item.pattern}
                      </p>
                      {item.wholesale_price && (
                        <p className="submission-meta-line" style={{ color: '#059669', fontWeight: 600 }}>
                          Wholesale: ₹{Number(item.wholesale_price).toLocaleString('en-IN')}
                        </p>
                      )}
                      <div className="submission-color-chips">
                        {colors.map((c, i) => (
                          <span className="submission-color-chip" key={i}>
                            {c.color || `Color ${i + 1}`} ({c.sku || `${item.sku}-${i + 1}`})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= UPLOAD FORM TAB ================= */
        <form className="seller-upload-form" onSubmit={handleSubmitProduct}>
          {/* Notifications */}
          {submitSuccess && (
            <div
              style={{
                background: '#ecfdf5',
                color: '#065f46',
                padding: '14px 18px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>
                  Design {submitSuccess.sku} Submitted!
                </strong>
                <span style={{ fontSize: 13 }}>{submitSuccess.message}</span>
              </div>
            </div>
          )}

          {submitError && (
            <div
              style={{
                background: '#fef2f2',
                color: '#991b1b',
                padding: '14px 18px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertCircle size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>Upload Error</strong>
                <span style={{ fontSize: 13 }}>{submitError}</span>
              </div>
            </div>
          )}

          {/* 1. Multi-Color Single-Design Images Card */}
          <div className="seller-card-section">
            <div className="seller-section-header">
              <div>
                <h2 className="seller-section-title">
                  <ImageIcon size={18} />
                  <span>Color Variations</span>
                </h2>
              </div>
            </div>

            <div className="seller-colors-list">
              {colorRows.map((row, idx) => {
                const variantSku = `${baseSku}-${idx + 1}`;
                return (
                  <div className="seller-color-row" key={row.id}>
                    {/* Left: 72x72 Thumbnail Tile */}
                    <div className="seller-color-thumb-box">
                      {row.optimizing || row.uploading ? (
                        <div
                          className="seller-color-thumb-loading"
                          title={`${row.optimizeStage || 'Processing...'} (${row.optimizeProgress || 0}%)`}
                        >
                          <div className="seller-progress-ring-wrap">
                            <svg className="seller-progress-ring-svg" viewBox="0 0 44 44">
                              <circle
                                className="seller-progress-ring-bg"
                                cx="22"
                                cy="22"
                                r="17"
                                strokeWidth="3.5"
                              />
                              <circle
                                className="seller-progress-ring-fill"
                                cx="22"
                                cy="22"
                                r="17"
                                strokeWidth="3.5"
                                strokeDasharray={106.8}
                                strokeDashoffset={
                                  106.8 * (1 - Math.min(Math.max(row.optimizeProgress || 0, 5), 100) / 100)
                                }
                              />
                            </svg>
                            <span className="seller-progress-ring-text">
                              {row.optimizeProgress || 0}%
                            </span>
                          </div>
                          <span className="seller-progress-mini-stage">
                            {row.optimizing ? 'Optimizing' : (row.optimizeProgress || 0) >= 85 ? 'Saving' : 'Uploading'}
                          </span>
                        </div>
                      ) : row.imageUrl ? (
                        <label className="seller-color-thumb-label" title="Click to replace photo">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                void handleUploadImageForColor(row.id, e.target.files[0]);
                              }
                            }}
                          />
                          <img
                            src={row.imageUrl}
                            alt={`${baseSku} ${row.color}`}
                            className="seller-color-thumb-img"
                          />
                          <span className="seller-color-thumb-hover">Replace</span>
                        </label>
                      ) : (
                        <label className="seller-color-thumb-empty" title="Upload photo for this color">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                void handleUploadImageForColor(row.id, e.target.files[0]);
                              }
                            }}
                          />
                          <Upload size={18} />
                          <span>+ Photo</span>
                        </label>
                      )}
                    </div>

                    {/* Details: Dropdown, Meta (SKU/Progress), Actions (Cover, Delete) */}
                    <div className="seller-color-details">
                      <div className="seller-color-dropdown-wrap">
                        <select
                          className="seller-select-input"
                          value={row.color}
                          disabled={row.optimizing || row.uploading}
                          onChange={(e) => {
                            const newCol = e.target.value;
                            setColorRows((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, color: newCol } : r))
                            );
                          }}
                          required
                        >
                          {COLOR_OPTIONS.map((clr) => (
                            <option key={clr} value={clr}>
                              {clr}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="seller-color-meta-and-actions">
                        <div className="seller-color-meta">
                          <span className="seller-color-sku-muted">SKU: {variantSku}</span>

                          {row.uploadError && (
                            <span style={{ fontSize: 11.5, color: '#ef4444', fontWeight: 500, display: 'block', marginTop: 2 }}>
                              {row.uploadError}
                            </span>
                          )}
                        </div>

                        <div className="seller-color-actions">
                          {row.isCover ? (
                            <span className="seller-cover-badge">
                              <Check size={13} /> Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="seller-cover-action-btn"
                              onClick={() => handleSetCover(row.id)}
                            >
                              Set as Cover
                            </button>
                          )}

                          {colorRows.length > 1 && (
                            <button
                              type="button"
                              className="seller-remove-row-btn"
                              onClick={() => handleRemoveColorRow(row.id)}
                              title="Remove variation"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="add-color-btn"
                onClick={handleAddColorRow}
              >
                <Plus size={15} />
                <span>Add Color Variation</span>
              </button>
            </div>
          </div>

          {/* 2. Product Category & Attributes Card */}
          <div className="seller-card-section">
            <div className="seller-section-header">
              <div>
                <h2 className="seller-section-title">
                  <Tag size={18} />
                  <span>Product Classification & Details</span>
                </h2>
                <p className="seller-section-desc">
                  Select the specific values for this design.
                </p>
              </div>
            </div>

            <div className="seller-form-grid-3">
              {/* Category */}
              <div className="seller-form-group">
                <label className="seller-field-label">
                  Category <span className="required">*</span>
                </label>
                <select
                  className={`seller-select-input ${!category ? 'placeholder-selected' : ''}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.code} value={c.label}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fabric */}
              <div className="seller-form-group">
                <label className="seller-field-label">
                  Fabric <span className="required">*</span>
                </label>
                <select
                  className={`seller-select-input ${!fabric ? 'placeholder-selected' : ''}`}
                  value={fabric}
                  onChange={(e) => setFabric(e.target.value)}
                  required
                >
                  <option value="">Select Fabric</option>
                  {FABRIC_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Suit Component Fabrics */}
              {isSuit && (
                <>
                  <div className="seller-form-group">
                    <label className="seller-field-label">
                      Top Fabric <span className="required">*</span>
                    </label>
                    <select
                      className={`seller-select-input ${!fabricTop ? 'placeholder-selected' : ''}`}
                      value={fabricTop}
                      onChange={(e) => setFabricTop(e.target.value)}
                      required
                    >
                      <option value="">Select Top Fabric</option>
                      {SUIT_TOP_FABRICS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="seller-form-group">
                    <label className="seller-field-label">
                      Bottom Fabric <span className="required">*</span>
                    </label>
                    <select
                      className={`seller-select-input ${!fabricBottom ? 'placeholder-selected' : ''}`}
                      value={fabricBottom}
                      onChange={(e) => setFabricBottom(e.target.value)}
                      required
                    >
                      <option value="">Select Bottom Fabric</option>
                      {SUIT_BOTTOM_FABRICS.map((sb) => (
                        <option key={sb} value={sb}>
                          {sb}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="seller-form-group">
                    <label className="seller-field-label">
                      Dupatta Fabric <span className="required">*</span>
                    </label>
                    <select
                      className={`seller-select-input ${!fabricDupatta ? 'placeholder-selected' : ''}`}
                      value={fabricDupatta}
                      onChange={(e) => setFabricDupatta(e.target.value)}
                      required
                    >
                      <option value="">Select Dupatta Fabric</option>
                      {SUIT_DUPATTA_FABRICS.map((sd) => (
                        <option key={sd} value={sd}>
                          {sd}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Work */}
              <div className="seller-form-group">
                <label className="seller-field-label">
                  Work <span className="required">*</span>
                </label>
                <select
                  className={`seller-select-input ${!work ? 'placeholder-selected' : ''}`}
                  value={work}
                  onChange={(e) => setWork(e.target.value)}
                  required
                >
                  <option value="">Select Work</option>
                  {WORK_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pattern */}
              <div className="seller-form-group">
                <label className="seller-field-label">
                  Pattern <span className="required">*</span>
                </label>
                <select
                  className={`seller-select-input ${!pattern ? 'placeholder-selected' : ''}`}
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  required
                >
                  <option value="">Select Pattern</option>
                  {PATTERN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weave */}
              <div className="seller-form-group">
                <label className="seller-field-label">
                  Weave <span className="required">*</span>
                </label>
                <select
                  className={`seller-select-input ${!weave ? 'placeholder-selected' : ''}`}
                  value={weave}
                  onChange={(e) => setWeave(e.target.value)}
                  required
                >
                  <option value="">Select Weave</option>
                  {WEAVE_OPTIONS.map((wv) => (
                    <option key={wv} value={wv}>
                      {wv}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purity */}
              <div className="seller-form-group">
                <label className="seller-field-label">
                  Purity <span className="required">*</span>
                </label>
                <select
                  className={`seller-select-input ${!purity ? 'placeholder-selected' : ''}`}
                  value={purity}
                  onChange={(e) => setPurity(e.target.value)}
                  required
                >
                  <option value="">Select Purity</option>
                  {PURITY_OPTIONS.map((pu) => (
                    <option key={pu} value={pu}>
                      {pu}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="seller-form-group">
                <label className="seller-field-label">
                  Type <span className="required">*</span>
                </label>
                <select
                  className={`seller-select-input ${!productType ? 'placeholder-selected' : ''}`}
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  required
                >
                  <option value="">Select Type</option>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wholesale Price (Optional) */}
              <div className="seller-form-group">
                <label className="seller-field-label">Wholesale Price (₹ / pc)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="seller-text-input"
                  placeholder="e.g. 2400"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                />
              </div>

              {/* Custom Design Title (Optional) */}
              <div className="seller-form-group">
                <label className="seller-field-label">Custom Design Title (Optional)</label>
                <input
                  type="text"
                  className="seller-text-input"
                  placeholder={
                    fabric && work && category
                      ? `e.g. ${fabric} ${work} ${category}`
                      : 'e.g. Art Silk Antique Zari Saree'
                  }
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Submit Bar */}
          <div className="seller-submit-bar">
            <p className="seller-submit-note">
              <strong>Admin Approval Notice:</strong> Once submitted, this design will be saved with SKU <strong>{baseSku}</strong>. It will be reviewed by Weave 365 admin before becoming visible on the live storefront.
            </p>
            <button
              type="submit"
              className="seller-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Submitting Design...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Submit Design for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
