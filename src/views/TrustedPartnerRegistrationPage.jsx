/**
 * @file TrustedPartnerRegistrationPage.jsx
 * @description Premium B2B Partner Registration & Product Review Onboarding Page.
 * Features a dual-stage segmented onboarding system:
 * - Tab 1: Submit Products for Review (Step 1)
 * - Tab 2: Advanced Profile (Step 2 - Locked until approved)
 * 
 * Supports base64 CORS-safelisted 'text/plain' uploads to Google Sheets / Drive
 * to bypass CORS options preflight failures. Dynamically reconstructs Google Sheet CSV URLs
 * to bypass Cloudflare Pages build ampersand truncation issues.
 * 
 * @module views/TrustedPartnerRegistrationPage
 */

import { useState, useRef, useEffect } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Lock,
  Unlock,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import artisanImage from '../../assets/artisan_at_loom_premium.webp';
import { assetSrc } from '../utils/assetSrc.js';

// Global polyfill layer to protect edge runtime client evaluation from process.env reference errors.
if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = { env: {} };
}

const businessTypes = ['Weaver', 'Master Weaver', 'Manufacturer', 'Trader', 'Job Worker', 'Supplier'];
const productionCapacities = ['Small Scale', 'Medium Scale', 'Large Scale'];
const experienceRanges = ['0-2 Years', '3-5 Years', '5-10 Years', '10+ Years'];
const dispatchCapabilities = ['Pan India', 'Export Orders', 'Custom Orders', 'Assorted Sets'];

const productCategoriesList = [
  { name: 'Saree', emoji: '🥻' },
  { name: 'Suit', emoji: '👕' },
  { name: 'Dupatta', emoji: '🧣' },
  { name: 'Lehenga', emoji: '👗' },
  { name: 'Fabric', emoji: '🧵' },
  { name: 'Accessories', emoji: '✨' }
];

const initialReviewForm = {
  fullName: '',
  whatsapp: '',
  city: '',
  pincode: '',
  categories: [],
  priceRange: '',
  images: [null, null, null, null], // base64 strings
  agreement: false
};

const initialForm = {
  fullName: '',
  mobile: '',
  email: '',
  city: '',
  aadhaar: '',
  businessType: '',
  productCategories: [],
  productionCapacity: '',
  monthlyCapacity: '',
  readyStock: '',
  bulkOrders: '',
  dispatchCapabilities: [],
  gstAvailable: '',
  gstNumber: '',
  experience: '',
  notes: '',
  agreement: false,
};

const approvalSteps = [
  'Form submission',
  'WhatsApp verification',
  'Sample/product review',
  'Vendor approval',
  'Product onboarding',
];

export function TrustedPartnerRegistrationPage() {
  const heroImage = assetSrc(artisanImage);
  
  // Tab states
  const [activeTab, setActiveTab] = useState('product-review'); // 'product-review' or 'advanced-profile'
  
  // Tab 1: Product Review Form State
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
  // Tab 2: Advanced Profile Form State (Original onboarding form)
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Unlock / Lock verification states
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false);
  const [unlockMobile, setUnlockMobile] = useState('');
  const [isVerifyingUnlock, setIsVerifyingUnlock] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const [unlockError, setUnlockError] = useState('');
  
  const fileInputsRef = useRef([]);

  // Check local storage on mount to see if user has already unlocked Tab 2 or submitted
  useEffect(() => {
    try {
      const unlocked = localStorage.getItem('weave365_profile_unlocked') === 'true';
      if (unlocked) {
        setIsProfileUnlocked(true);
      }
      
      const savedReview = localStorage.getItem('weave365_review_submitted') === 'true';
      if (savedReview) {
        setReviewSubmitted(true);
      }
      
      const savedVendor = localStorage.getItem('weave365_vendor_submitted') === 'true';
      if (savedVendor) {
        setSubmitted(true);
      }
    } catch (e) {
      console.warn('LocalStorage reads are blocked or unsupported:', e);
    }
  }, []);

  // Utility to route published spreadsheet CSV requests through our server-side proxy
  // to completely bypass browser CORS preflight blocks.
  const getSheetCsvUrl = (gid) => {
    return `/api/vendor-registration?gid=${gid}`;
  };

  // Robust, RFC 4180 quote-aware CSV text parser to avoid column shifting
  const parseCsvText = (csvText) => {
    if (!csvText) return [];
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip the escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.length > 0 || rows.length === 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip the LF of CRLF
        }
      } else {
        currentCell += char;
      }
    }
    
    if (currentCell !== '' || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }
    
    return rows;
  };


  // Convert File object to Base64 String
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle selected image slot update
  const handleImageChange = async (file, index) => {
    setReviewError('');
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setReviewError('Please select a valid image file.');
      return;
    }
    
    // Strict <1MB validation
    if (file.size > 1 * 1024 * 1024) {
      setReviewError(`Image in slot ${index + 1} exceeds 1MB limit. Please compress or choose a smaller file.`);
      return;
    }
    
    try {
      const base64 = await fileToBase64(file);
      setReviewForm((prev) => {
        const nextImages = [...prev.images];
        nextImages[index] = base64;
        return { ...prev, images: nextImages };
      });
    } catch (err) {
      console.error('Failed to convert image to Base64:', err);
      setReviewError('Failed to process the image. Please try again.');
    }
  };

  // Handle delete click on slot image
  const handleDeleteImage = (index, e) => {
    e.stopPropagation();
    setReviewForm((prev) => {
      const nextImages = [...prev.images];
      nextImages[index] = null;
      return { ...prev, images: nextImages };
    });
    // Reset file input value to allow selecting same file again
    if (fileInputsRef.current[index]) {
      fileInputsRef.current[index].value = '';
    }
  };

  // Handle click on slot to trigger hidden file selector
  const handleSlotClick = (index) => {
    if (fileInputsRef.current[index]) {
      fileInputsRef.current[index].click();
    }
  };

  // Handle Drag Over event
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle Drop event
  const handleDrop = async (e, index) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleImageChange(file, index);
    }
  };

  // Tab 1 toggles
  const toggleReviewCategory = (categoryName) => {
    setReviewForm((prev) => {
      const existing = prev.categories;
      const nextCategories = existing.includes(categoryName)
        ? existing.filter((c) => c !== categoryName)
        : [...existing, categoryName];
      return { ...prev, categories: nextCategories };
    });
    setReviewError('');
  };

  // Tab 1 Submissions
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    
    if (reviewForm.categories.length === 0) {
      setReviewError('Please select at least one product category.');
      return;
    }
    
    // Check if at least 1 image is uploaded
    const uploadedImagesCount = reviewForm.images.filter(Boolean).length;
    if (uploadedImagesCount === 0) {
      setReviewError('Please upload at least 1 sample product image (maximum 4).');
      return;
    }
    
    setReviewSubmitting(true);

    const cleanWhatsapp = reviewForm.whatsapp.trim().replace(/\s/g, '');
    
    // Local duplicate check
    try {
      const existingReviews = JSON.parse(localStorage.getItem('weave365_local_reviews') || '[]');
      const isDuplicate = existingReviews.some((rev) => {
        const cleanExisting = rev.whatsapp.trim().replace(/\D/g, '').slice(-10);
        const cleanInput = cleanWhatsapp.replace(/\D/g, '').slice(-10);
        return cleanExisting === cleanInput && cleanInput.length === 10;
      });
      
      if (isDuplicate) {
        setReviewError('A review application has already been submitted with this number.');
        setReviewSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('LocalStorage review verification error:', err);
    }

    // Global duplicate checks via parsed CSV GID URL
    const reviewsGid = process.env.NEXT_PUBLIC_PRODUCT_REVIEWS_GID || '1133055182';
    const csvUrl = getSheetCsvUrl(reviewsGid);
    if (csvUrl) {
      try {
        const response = await fetch(`${csvUrl}&_t=${Date.now()}`);
        if (response.ok) {
          const csvText = await response.text();
          const rows = parseCsvText(csvText);
          const isGlobalDuplicate = rows.some(columns => {
            if (columns.length > 2) {
              const cleanExisting = columns[2].replace(/\D/g, '').slice(-10);
              const cleanInput = cleanWhatsapp.replace(/\D/g, '').slice(-10);
              return cleanExisting === cleanInput && cleanInput.length === 10;
            }
            return false;
          });
          
          if (isGlobalDuplicate) {
            setReviewError('A review application has already been submitted with this mobile number.');
            setReviewSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Unable to verify global reviews duplicate status:', err);
      }
    }

    // Prepare payload
    const capitalizedName = reviewForm.fullName
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
      
    const capitalizedCity = reviewForm.city
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const payload = {
      action: 'product_review',
      fullName: capitalizedName,
      whatsapp: cleanWhatsapp,
      city: capitalizedCity,
      pincode: reviewForm.pincode.trim(),
      categories: reviewForm.categories.join(', '),
      priceRange: reviewForm.priceRange,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      // Send images separately
      image1: reviewForm.images[0] || '',
      image2: reviewForm.images[1] || '',
      image3: reviewForm.images[2] || '',
      image4: reviewForm.images[3] || ''
    };

    // Save locally
    try {
      const existingReviews = JSON.parse(localStorage.getItem('weave365_local_reviews') || '[]');
      localStorage.setItem('weave365_local_reviews', JSON.stringify([payload, ...existingReviews]));
      localStorage.setItem('weave365_review_submitted', 'true');
    } catch (err) {
      console.warn('Failed to commit local review record:', err);
    }

    // Submit review payload to Google Sheets via server-side proxy
    try {
      const response = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const resData = await response.json();
      
      if (response.ok && resData.status === 'success') {
        setReviewSubmitted(true);
      } else {
        setReviewError(resData.error || 'Failed to submit product reviews. Please verify sheet configurations.');
      }
    } catch (err) {
      console.error('Failed to post reviews payload:', err);
      setReviewError('Failed to upload review application. Check your connection or contact support.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Tab 2 Unlock Lookup Verification
  const verifyAndUnlockProfile = async (e) => {
    e.preventDefault();
    setUnlockError('');
    setUnlockMessage('');
    
    const inputNum = unlockMobile.trim().replace(/\D/g, '').slice(-10);
    if (inputNum.length !== 10) {
      setUnlockError('Please enter a valid 10-digit Mobile/WhatsApp number.');
      return;
    }
    
    setIsVerifyingUnlock(true);
    
    try {
      const reviewsGid = process.env.NEXT_PUBLIC_PRODUCT_REVIEWS_GID || '1133055182';
      const csvUrl = getSheetCsvUrl(reviewsGid);
      
      if (!csvUrl) {
        throw new Error('Spreadsheet config is missing.');
      }

      const response = await fetch(`${csvUrl}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Sheets lookup failed.');
      }

      const csvText = await response.text();
      const rows = parseCsvText(csvText);

      let foundRow = null;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue;
        
        // Scan direct WhatsApp field (index 2)
        const cellVal = row[2] ? row[2].replace(/\D/g, '').slice(-10) : '';
        let matched = (cellVal === inputNum);
        
        // General backup scanner
        if (!matched) {
          matched = row.some(cell => {
            const cleanVal = cell.replace(/\D/g, '').slice(-10);
            return cleanVal === inputNum && inputNum.length === 10;
          });
        }
        
        if (matched) {
          foundRow = row;
          break;
        }
      }

      if (!foundRow) {
        setUnlockError('No product review submission was found matching this WhatsApp number. Please submit Tab 1 first.');
        setIsVerifyingUnlock(false);
        return;
      }

      // Check status column (index 7 or keyword scan)
      let status = 'pending';
      const approvedKeywords = ['approved', 'approve', 'yes', 'verified'];
      const rejectedKeywords = ['rejected', 'reject', 'no'];
      
      const directStatus = foundRow[7] ? foundRow[7].toLowerCase() : '';
      if (approvedKeywords.some(kw => directStatus.includes(kw))) {
        status = 'approved';
      } else if (rejectedKeywords.some(kw => directStatus.includes(kw))) {
        status = 'rejected';
      } else {
        // scan across columns
        for (const cell of foundRow) {
          const lCell = cell.toLowerCase();
          if (approvedKeywords.some(kw => lCell === kw)) {
            status = 'approved';
            break;
          }
          if (rejectedKeywords.some(kw => lCell === kw)) {
            status = 'rejected';
            break;
          }
        }
      }

      if (status === 'approved') {
        setUnlockMessage('🎉 Verification Successful! Your product review has been approved. Advanced onboarding is now unlocked.');
        setIsProfileUnlocked(true);
        try {
          localStorage.setItem('weave365_profile_unlocked', 'true');
        } catch (e) {
          console.warn('LocalStorage write failed:', e);
        }
      } else if (status === 'rejected') {
        setUnlockError('❌ Your product reviews application was not approved. Please contact our support team for details.');
      } else {
        setUnlockMessage('⏳ Your product review submission is still under review by our team. WhatsApp us for urgent approval checks.');
      }
    } catch (err) {
      console.error('Error during unlock verification lookup:', err);
      // Failover fallback lookup against local database submissions
      try {
        const localReviews = JSON.parse(localStorage.getItem('weave365_local_reviews') || '[]');
        const localMatch = localReviews.find(r => r.whatsapp.replace(/\D/g, '').slice(-10) === inputNum);
        if (localMatch) {
          setUnlockMessage('⏳ Locally recorded review found! Review status is currently: PENDING review approval.');
        } else {
          setUnlockError('Unable to connect to registration lookup systems. Ensure connection is online.');
        }
      } catch (e) {
        setUnlockError('Failed to run verification lookup sequence. Check connection.');
      }
    } finally {
      setIsVerifyingUnlock(false);
    }
  };

  // Tab 2 Original Form State handlers
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const toggleArrayValue = (field, value) => {
    setForm((current) => {
      const existing = current[field];
      return {
        ...current,
        [field]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
    setFormError('');
  };

  // Tab 2 Original Form Submit
  const handleOriginalSubmit = async (event) => {
    event.preventDefault();

    if (form.productCategories.length === 0) {
      setFormError('Please select at least one product category.');
      return;
    }

    if (form.dispatchCapabilities.length === 0) {
      setFormError('Please select at least one dispatch capability.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setSubmitError('');

    const cleanMobile = form.mobile.trim();

    // 1. Check duplicate locally
    try {
      const existing = JSON.parse(localStorage.getItem('weave365_vendor_applications') || '[]');
      const isDuplicate = existing.some((app) => {
        const cleanExisting = app.mobile.trim().replace(/\D/g, '').slice(-10);
        const cleanInput = cleanMobile.replace(/\D/g, '').slice(-10);
        return cleanExisting === cleanInput && cleanInput.length === 10;
      });
      if (isDuplicate) {
        setFormError('An application has already been submitted with this mobile number.');
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.warn('Unable to verify duplicate application locally', error);
    }

    // 2. Check globally via parsed CSV
    const sheetId = process.env.NEXT_PUBLIC_SHEET_ID || '';
    const registrationGid = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_GID || '0';
    const csvUrl = getSheetCsvUrl(registrationGid);
    if (csvUrl) {
      try {
        const response = await fetch(`${csvUrl}&_t=${Date.now()}`);
        if (response.ok) {
          const csvText = await response.text();
          const rows = parseCsvText(csvText);
          const isGlobalDuplicate = rows.some(columns => {
            if (columns.length > 2) {
              const cleanExisting = columns[2].replace(/\D/g, '').slice(-10);
              const cleanInput = cleanMobile.replace(/\D/g, '').slice(-10);
              return cleanExisting === cleanInput && cleanInput.length === 10;
            }
            return false;
          });

          if (isGlobalDuplicate) {
            setFormError('An application has already been submitted with this mobile number.');
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Unable to verify duplicate application globally', err);
      }
    }

    const capitalizeWords = (str) => {
      if (!str) return '';
      return str
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const application = {
      action: 'vendor_registration',
      ...form,
      fullName: capitalizeWords(form.fullName),
      city: capitalizeWords(form.city),
      mobile: form.mobile.replace(/\s/g, ''),
      aadhaar: form.aadhaar.replace(/\s/g, ''),
      gstNumber: form.gstNumber ? form.gstNumber.replace(/\s/g, '') : '',
      submittedAt: new Date().toISOString(),
      status: 'pending_manual_review',
    };

    // Save locally
    try {
      const existing = JSON.parse(localStorage.getItem('weave365_vendor_applications') || '[]');
      localStorage.setItem('weave365_vendor_applications', JSON.stringify([application, ...existing]));
      localStorage.setItem('weave365_vendor_submitted', 'true');
    } catch (error) {
      console.warn('Unable to save vendor application locally', error);
    }

    // Submit registration payload to Google Sheets via server-side proxy
    try {
      const response = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(application),
      });
      
      const resData = await response.json();
      
      if (response.ok && resData.status === 'success') {
        setSubmitted(true);
        setForm(initialForm);
      } else {
        setSubmitError(resData.error || 'Failed to submit registration. Please verify sheet configurations.');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setSubmitError('Failed to send application. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Testing Cache Link (Flush local database status keys to repeat testing easily)
  const handleClearCache = () => {
    try {
      localStorage.removeItem('weave365_vendor_applications');
      localStorage.removeItem('weave365_local_reviews');
      localStorage.removeItem('weave365_review_submitted');
      localStorage.removeItem('weave365_vendor_submitted');
      localStorage.removeItem('weave365_profile_unlocked');
    } catch (err) {
      console.warn('Error clearing localStorage testing keys:', err);
    }
    
    // Reset states
    setSubmitted(false);
    setReviewSubmitted(false);
    setIsProfileUnlocked(false);
    setForm(initialForm);
    setReviewForm(initialReviewForm);
    setUnlockMobile('');
    setUnlockMessage('');
    setUnlockError('');
    setReviewError('');
    setFormError('');
    setSubmitError('');
  };

  return (
    <div className="trusted-registration-page">
      <section className="trusted-registration-hero" aria-labelledby="trusted-registration-heading">
        <img src={heroImage} alt="Weaver preparing textile products for Weave 365" width={1920} height={400} loading="lazy" decoding="async" />
        <div className="trusted-registration-hero-content">
          <h1 id="trusted-registration-heading">Trusted Partner Registration</h1>
          <p>Share your craft, capacity, and product details for manual review by the Weave 365 team.</p>
        </div>
      </section>

      <section className="vendor-onboarding-section trusted-registration-section" id="trusted-partner-registration">
        <div className="vendor-onboarding-shell">
          <aside className="vendor-onboarding-aside" aria-label="Trusted partner approval process">
            <div className="vendor-aside-header">
              <ShieldCheck className="vendor-aside-icon" size={32} />
              <h2>Verification & Onboarding</h2>
            </div>
            <p>
              Apply to list your products on Weave 365. Every supplier is verified before products
              go live, so buyers get consistent quality and partners get a serious marketplace.
            </p>

            <div className="vendor-approval-flow">
              {approvalSteps.map((step, index) => (
                <div className="vendor-approval-step" key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>

            <div className="vendor-quality-note">
              <BadgeCheck size={20} />
              <p>
                No instant self-service onboarding. Our team reviews fulfillment capability,
                product quality, and verification details before approval.
              </p>
            </div>
          </aside>

          <div className="vendor-form-panel">
            {/* Premium segmented tab controls */}
            <div className="vendor-form-tabs">
              <button 
                type="button"
                className={`vendor-tab-btn ${activeTab === 'product-review' ? 'active' : ''}`}
                onClick={() => setActiveTab('product-review')}
              >
                1. Submit Products for Review
              </button>
              <button 
                type="button"
                className={`vendor-tab-btn ${activeTab === 'advanced-profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('advanced-profile')}
              >
                {!isProfileUnlocked && <Lock size={14} className="tab-lock-icon" />}
                {isProfileUnlocked && <Unlock size={14} className="tab-unlock-icon" />}
                2. Advanced Profile
              </button>
            </div>

            {/* TAB 1: PRODUCT REVIEW FORM */}
            {activeTab === 'product-review' && (
              reviewSubmitted ? (
                <div className="vendor-success-card" role="status" aria-live="polite">
                  <CheckCircle2 size={42} />
                  <h2>Products Submitted for Review!</h2>
                  <p>Our verification team will review your product catalog within 24-48 hours.</p>
                  
                  <div className="status-instructions-note">
                    <p>Once approved, copy your submitted WhatsApp number and verify it under the <strong>Advanced Profile</strong> tab to unlock step 2.</p>
                  </div>

                  <button 
                    type="button" 
                    className="vendor-submit-button"
                    onClick={() => setActiveTab('advanced-profile')}
                  >
                    Go to Advanced Profile Status Check
                  </button>

                  <button
                    type="button"
                    className="clear-test-cache-link"
                    onClick={handleClearCache}
                  >
                    Clear cache & test again ↺
                  </button>
                </div>
              ) : (
                <form className="vendor-registration-form" onSubmit={handleReviewSubmit}>
                  <div className="vendor-form-heading">
                    <ClipboardCheck size={24} />
                    <div>
                      <h2>Product Review Submission (Step 1)</h2>
                      <p>Upload a few sample products to get catalog approval.</p>
                    </div>
                  </div>

                  <fieldset className="vendor-form-section">
                    <legend>Contact Information</legend>
                    <div className="vendor-form-grid">
                      <label>
                        Full Name *
                        <input
                          type="text"
                          value={reviewForm.fullName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const capitalized = val
                              .split(' ')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ');
                            setReviewForm((prev) => ({ ...prev, fullName: capitalized }));
                          }}
                          placeholder="Enter your full name"
                          required
                        />
                      </label>
                      <label>
                        WhatsApp Number *
                        <input
                          type="tel"
                          value={reviewForm.whatsapp}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d+]/g, '');
                            setReviewForm((prev) => ({ ...prev, whatsapp: raw }));
                          }}
                          placeholder="+91 9876543210"
                          title="Enter your complete WhatsApp number starting with +91 or + country code"
                          required
                        />
                      </label>
                      <label>
                        City *
                        <input
                          type="text"
                          value={reviewForm.city}
                          onChange={(e) => {
                            const val = e.target.value;
                            const capitalized = val
                              .split(' ')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ');
                            setReviewForm((prev) => ({ ...prev, city: capitalized }));
                          }}
                          placeholder="Varanasi, Kolkata, etc."
                          required
                        />
                      </label>
                      <label>
                        Pincode *
                        <input
                          type="text"
                          value={reviewForm.pincode}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setReviewForm((prev) => ({ ...prev, pincode: raw }));
                          }}
                          placeholder="221001"
                          pattern="\d{6}"
                          inputMode="numeric"
                          title="Enter a 6-digit postal pincode"
                          required
                        />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="vendor-form-section">
                    <legend>Catalog Details</legend>
                    
                    <div className="review-category-group">
                      <span className="group-label">Product Categories *</span>
                      <div className="review-category-grid">
                        {productCategoriesList.map((cat) => {
                          const isChecked = reviewForm.categories.includes(cat.name);
                          return (
                            <button
                              type="button"
                              key={cat.name}
                              className={`review-category-chip ${isChecked ? 'selected' : ''}`}
                              onClick={() => toggleReviewCategory(cat.name)}
                            >
                              <span className="chip-emoji">{cat.emoji}</span>
                              <span className="chip-text">{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="vendor-form-grid" style={{ marginTop: '16px' }}>
                      <label className="vendor-form-wide">
                        Approximate Price Range *
                        <select
                          value={reviewForm.priceRange}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, priceRange: e.target.value }))}
                          required
                        >
                          <option value="">Select price range</option>
                          <option value="Under ₹1,000">Under ₹1,000</option>
                          <option value="₹1,000 - ₹3,000">₹1,000 - ₹3,000</option>
                          <option value="₹3,000 - ₹5,000">₹3,000 - ₹5,000</option>
                          <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                          <option value="₹10,000+">₹10,000+</option>
                        </select>
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="vendor-form-section">
                    <legend>Sample Product Photos</legend>
                    <p className="upload-subtitle">Upload 1 to 4 clear sample photos of your sarees/textiles. E.g., cover, details, back, borders.</p>
                    
                    {/* Responsive Upload Grid */}
                    <div className="review-images-grid">
                      {reviewForm.images.map((imgBase64, index) => (
                        <div
                          key={index}
                          className="review-image-slot"
                          onClick={() => handleSlotClick(index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          <input
                            type="file"
                            ref={(el) => (fileInputsRef.current[index] = el)}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={(e) => handleImageChange(e.target.files[0], index)}
                          />
                          
                          {imgBase64 ? (
                            <div className="review-image-preview">
                              <img src={imgBase64} alt={`Sample ${index + 1}`} />
                              <button
                                type="button"
                                className="delete-image-badge"
                                onClick={(e) => handleDeleteImage(index, e)}
                                title="Delete Image"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="review-image-placeholder">
                              <Upload size={24} className="placeholder-icon" />
                              <span className="slot-title">Photo Slot {index + 1}</span>
                              <span className="slot-helper">Click or Drag & Drop</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Image specifications guidelines box */}
                    <div className="review-rules-card">
                      <div className="rules-header">
                        <AlertCircle size={16} />
                        <h4>Photo Upload Requirements</h4>
                      </div>
                      <ul>
                        <li>Strict maximum file size: <strong>1MB</strong> per image</li>
                        <li>Format: JPEG, PNG or WebP accepted</li>
                        <li>Ensure photos are shot in bright natural light showing weaves clearly</li>
                      </ul>
                    </div>
                  </fieldset>

                  {reviewError && (
                    <div className="vendor-form-error" role="alert">
                      <AlertCircle size={18} />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  <label className="vendor-agreement">
                    <input
                      type="checkbox"
                      checked={reviewForm.agreement}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, agreement: e.target.checked }))}
                      required
                    />
                    I confirm these photos show authentic products produced by my business.
                  </label>

                  <button type="submit" className="vendor-submit-button" disabled={reviewSubmitting}>
                    {reviewSubmitting ? (
                      <>
                        <RefreshCw size={18} className="spinner" />
                        Uploading Catalogs...
                      </>
                    ) : (
                      'Submit Products for Review'
                    )}
                  </button>
                </form>
              )
            )}

            {/* TAB 2: ADVANCED PROFILE FORM (LOCKED VIEW / INTERACTIVE VIEW) */}
            {activeTab === 'advanced-profile' && (
              !isProfileUnlocked ? (
                <div className="vendor-profile-lock">
                  <div className="lock-overlay-content">
                    <div className="lock-illustration">
                      <Lock size={64} className="padlock-icon animate-pulse" />
                    </div>
                    <h2>Advanced Partner Profile Locked</h2>
                    <p className="lock-desc">
                      The Advanced Business Onboarding profile is available exclusively to verified suppliers. 
                      Please complete <strong>Step 1 (Submit Products for Review)</strong> first. 
                      Once verified, enter your registered number below to unlock step 2.
                    </p>

                    <form className="status-check-card" onSubmit={verifyAndUnlockProfile}>
                      <h3>Check Review Verification Status</h3>
                      <div className="status-input-group">
                        <input
                          type="tel"
                          value={unlockMobile}
                          onChange={(e) => setUnlockMobile(e.target.value)}
                          placeholder="Enter WhatsApp/Mobile number"
                          required
                        />
                        <button type="submit" className="status-verify-btn" disabled={isVerifyingUnlock}>
                          {isVerifyingUnlock ? 'Checking...' : 'Check Status 🔓'}
                        </button>
                      </div>
                      {unlockMessage && <p className="status-msg success">{unlockMessage}</p>}
                      {unlockError && <p className="status-msg error">{unlockError}</p>}
                    </form>

                    <button
                      type="button"
                      className="clear-test-cache-link"
                      onClick={handleClearCache}
                      style={{ marginTop: '24px' }}
                    >
                      Clear cache & test again ↺
                    </button>
                  </div>
                </div>
              ) : (
                submitted ? (
                  <div className="vendor-success-card" role="status" aria-live="polite">
                    <CheckCircle2 size={42} />
                    <h2>Thank you for applying.</h2>
                    <p>Our team has received your advanced verification profile and will finalize your supplier listing shortly.</p>
                    
                    <button
                      type="button"
                      className="clear-test-cache-link"
                      onClick={handleClearCache}
                    >
                      Clear cache & test again ↺
                    </button>
                  </div>
                ) : (
                  <form className="vendor-registration-form" onSubmit={handleOriginalSubmit}>
                    <div className="vendor-form-heading">
                      <ClipboardCheck size={24} />
                      <div>
                        <h2>Advanced Profile Registration (Step 2)</h2>
                        <p>Complete your business credentials to setup listing parameters.</p>
                      </div>
                    </div>

                    <fieldset className="vendor-form-section">
                      <legend>Basic Information</legend>
                      <div className="vendor-form-grid">
                        <label>
                          Full Name *
                          <input
                            type="text"
                            value={form.fullName}
                            onChange={(event) => {
                              const val = event.target.value;
                              const capitalized = val
                                .split(' ')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                              updateField('fullName', capitalized);
                            }}
                            placeholder="Enter full name"
                            required
                          />
                        </label>
                        <label>
                          Mobile Number *
                          <input
                            type="tel"
                            value={form.mobile}
                            onChange={(event) => {
                              const raw = event.target.value.replace(/\D/g, '').slice(0, 10);
                              if (raw.length > 5) {
                                updateField('mobile', `${raw.slice(0, 5)} ${raw.slice(5)}`);
                              } else {
                                updateField('mobile', raw);
                              }
                            }}
                            placeholder="12345 67890"
                            inputMode="numeric"
                            pattern="\d{5}\s\d{5}"
                            title="Enter a 10 digit mobile number in the format XXXXX XXXXX"
                            required
                          />
                        </label>
                        <label>
                          Email Address *
                          <input
                            type="email"
                            value={form.email}
                            onChange={(event) => updateField('email', event.target.value)}
                            placeholder="name@example.com"
                            required
                          />
                        </label>
                        <label>
                          Aadhaar Number *
                          <input
                            type="text"
                            value={form.aadhaar}
                            onChange={(event) => {
                              const raw = event.target.value.replace(/\D/g, '').slice(0, 12);
                              const parts = [];
                              for (let i = 0; i < raw.length; i += 4) {
                                parts.push(raw.substring(i, i + 4));
                              }
                              updateField('aadhaar', parts.join(' '));
                            }}
                            placeholder="1234 5678 9012"
                            inputMode="numeric"
                            pattern="\d{4}\s\d{4}\s\d{4}"
                            title="Enter a 12 digit Aadhaar number in the format XXXX XXXX XXXX"
                            required
                          />
                        </label>
                        <label className="vendor-form-wide">
                          City / Location *
                          <input
                            type="text"
                            value={form.city}
                            onChange={(event) => {
                              const val = event.target.value;
                              const capitalized = val
                                .split(' ')
                                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                              updateField('city', capitalized);
                            }}
                            placeholder="Varanasi, Lohta, Kotwa, Ramnagar, etc."
                            required
                          />
                        </label>
                      </div>
                    </fieldset>

                    <fieldset className="vendor-form-section">
                      <legend>Business Information</legend>
                      <div className="vendor-form-grid">
                        <label>
                          Business Type *
                          <select
                            value={form.businessType}
                            onChange={(event) => updateField('businessType', event.target.value)}
                            required
                          >
                            <option value="">Select business type</option>
                            {businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                        </label>
                        <label>
                          Production Capacity *
                          <select
                            value={form.productionCapacity}
                            onChange={(event) => updateField('productionCapacity', event.target.value)}
                            required
                          >
                            <option value="">Select capacity</option>
                            {productionCapacities.map((capacity) => <option key={capacity} value={capacity}>{capacity}</option>)}
                          </select>
                        </label>
                        <label className="vendor-form-wide">
                          Monthly Supply Capacity *
                          <input
                            type="text"
                            value={form.monthlyCapacity}
                            onChange={(event) => updateField('monthlyCapacity', event.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 200"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                          />
                        </label>
                      </div>
                      <div className="vendor-chip-group" role="group" aria-label="Product Category">
                        <span>Product Category *</span>
                        <div className="vendor-grid-2-col">
                          {productCategoriesList.map((cat) => (
                            <label className="vendor-chip-option" key={cat.name}>
                              <input
                                type="checkbox"
                                checked={form.productCategories.includes(cat.name)}
                                onChange={() => toggleArrayValue('productCategories', cat.name)}
                              />
                              {cat.emoji} {cat.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="vendor-form-section">
                      <legend>Quality & Fulfillment</legend>
                      <div className="vendor-radio-grid">
                        <div className="vendor-radio-block">
                          <span>Ready Stock Available? *</span>
                          <label><input type="radio" name="readyStock" value="Yes" checked={form.readyStock === 'Yes'} onChange={(event) => updateField('readyStock', event.target.value)} required /> Yes</label>
                          <label><input type="radio" name="readyStock" value="No" checked={form.readyStock === 'No'} onChange={(event) => updateField('readyStock', event.target.value)} /> No</label>
                        </div>
                        <div className="vendor-radio-block">
                          <span>Can You Handle Bulk Orders? *</span>
                          <label><input type="radio" name="bulkOrders" value="Yes" checked={form.bulkOrders === 'Yes'} onChange={(event) => updateField('bulkOrders', event.target.value)} required /> Yes</label>
                          <label><input type="radio" name="bulkOrders" value="No" checked={form.bulkOrders === 'No'} onChange={(event) => updateField('bulkOrders', event.target.value)} /> No</label>
                        </div>
                      </div>
                      <div className="vendor-chip-group" role="group" aria-label="Dispatch Capability">
                        <span>Dispatch Capability *</span>
                        <div className="vendor-grid-2-col">
                          {dispatchCapabilities.map((capability) => (
                            <label className="vendor-chip-option" key={capability}>
                              <input
                                type="checkbox"
                                checked={form.dispatchCapabilities.includes(capability)}
                                onChange={() => toggleArrayValue('dispatchCapabilities', capability)}
                              />
                              {capability}
                            </label>
                          ))}
                        </div>
                      </div>
                    </fieldset>

                    <fieldset className="vendor-form-section">
                      <legend>Verification</legend>
                      <div className="vendor-form-grid">
                        <label>
                          GST Available? *
                          <select value={form.gstAvailable} onChange={(event) => {
                            const val = event.target.value;
                            updateField('gstAvailable', val);
                            if (val !== 'Yes') {
                              updateField('gstNumber', '');
                            }
                          }} required>
                            <option value="">Select one</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </label>

                        {form.gstAvailable === 'Yes' && (
                          <label>
                            GST Number *
                            <input
                              type="text"
                              value={form.gstNumber || ''}
                              onChange={(event) => {
                                const raw = event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15);
                                let formatted = '';
                                if (raw.length > 0) {
                                  formatted += raw.slice(0, 2);
                                }
                                if (raw.length > 2) {
                                  formatted += ' ' + raw.slice(2, 12);
                                }
                                if (raw.length > 12) {
                                  formatted += ' ' + raw.slice(12, 13);
                                }
                                if (raw.length > 13) {
                                  formatted += ' ' + raw.slice(13, 14);
                                }
                                if (raw.length > 14) {
                                  formatted += ' ' + raw.slice(14, 15);
                                }
                                updateField('gstNumber', formatted);
                              }}
                              placeholder="22 AAAAA0000A 1 Z 5"
                              inputMode="text"
                              pattern="^[0-9]{2}\s[A-Z]{5}[0-9]{4}[A-Z]{1}\s[A-Z0-9]{1}\sZ\s[A-Z0-9]{1}$"
                              title="Enter a 15-character GSTIN in the format: XX XXXXXXXXXX X X X (e.g. 22 AAAAA0000A 1 Z 5)"
                              required
                            />
                          </label>
                        )}
                        <label>
                          Business Experience *
                          <select value={form.experience} onChange={(event) => updateField('experience', event.target.value)} required>
                            <option value="">Select experience</option>
                            {experienceRanges.map((range) => <option key={range} value={range}>{range}</option>)}
                          </select>
                        </label>
                        <label className="vendor-form-wide">
                          Additional Notes
                          <textarea
                            value={form.notes}
                            onChange={(event) => updateField('notes', event.target.value)}
                            placeholder="Tell us about your products or specialization"
                            rows="4"
                          />
                        </label>
                      </div>
                    </fieldset>

                    {formError && <p className="vendor-form-error">{formError}</p>}
                    {submitError && <p className="vendor-form-error">{submitError}</p>}

                    <label className="vendor-agreement">
                      <input
                        type="checkbox"
                        checked={form.agreement}
                        onChange={(event) => updateField('agreement', event.target.checked)}
                        required
                        disabled={isSubmitting}
                      />
                      I confirm that the provided information is correct.
                    </label>

                    <button type="submit" className="vendor-submit-button" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting Application...' : 'Apply as Trusted Partner'}
                    </button>
                    
                    <button
                      type="button"
                      className="clear-test-cache-link"
                      onClick={handleClearCache}
                      style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Clear cache & test again ↺
                    </button>
                  </form>
                )
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
