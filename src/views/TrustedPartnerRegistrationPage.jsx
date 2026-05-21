/**
 * @file TrustedPartnerRegistrationPage.jsx
 * @description Manual onboarding application form for supply-side B2B partners (weavers, master weavers,
 * manufacturers, and traders). Collects business types, production capacities, product categories, GST parameters,
 * and experience metrics. Includes local double-submission validation via localStorage and global duplicate verification
 * before pushing clean registration objects to Google Sheets APIs.
 * 
 * @module views/TrustedPartnerRegistrationPage
 */

// Polyfill process in browser environments to prevent edge runtime / webpack ReferenceError crashes
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} };
}

import { useState, useEffect } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Lock,
  Unlock,
  UploadCloud,
  Info,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import artisanImage from '../../assets/artisan_at_loom_premium.webp';
import { assetSrc } from '../utils/assetSrc.js';

const businessTypes = ['Weaver', 'Master Weaver', 'Manufacturer', 'Trader', 'Job Worker', 'Supplier'];
const productCategories = ['Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Accessories'];
const productionCapacities = ['Small Scale', 'Medium Scale', 'Large Scale'];
const experienceRanges = ['0-2 Years', '3-5 Years', '5-10 Years', '10+ Years'];
const dispatchCapabilities = ['Pan India', 'Export Orders', 'Custom Orders', 'Assorted Sets'];

const priceRanges = [
  'Under ₹1,000 per piece',
  '₹1,000 - ₹2,000 per piece',
  '₹2,000 - ₹5,000 per piece',
  '₹5,000 - ₹10,000 per piece',
  'Above ₹10,000 per piece',
];

const reviewCategories = [
  { id: 'Sarees', label: 'Sarees', emoji: '🥻' },
  { id: 'Suits', label: 'Suits', emoji: '👕' },
  { id: 'Dupattas', label: 'Dupattas', emoji: '🧣' },
  { id: 'Lehengas', label: 'Lehengas', emoji: '👗' },
  { id: 'Fabrics', label: 'Fabrics', emoji: '🧵' },
  { id: 'Accessories', label: 'Accessories', emoji: '✨' },
];

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

const initialReviewForm = {
  fullName: '',
  whatsapp: '',
  city: '',
  pincode: '',
  categories: [],
  priceRange: '',
  images: [null, null, null, null],
  imagePreviews: [null, null, null, null],
  confirmGuidelines: false,
};

const approvalSteps = [
  'Form submission',
  'WhatsApp verification',
  'Sample/product review',
  'Vendor approval',
  'Product onboarding',
];

export function TrustedPartnerRegistrationPage() {
  const [activeTab, setActiveTab] = useState('product-review');
  const [isApproved, setIsApproved] = useState(() => {
    try {
      return localStorage.getItem('weave365_review_approved') === 'true';
    } catch {
      return false;
    }
  });

  // Tab 2 (Original Form States)
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const heroImage = assetSrc(artisanImage);

  // Tab 1 (New Review Form States)
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewFormError, setReviewFormError] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      reviewForm.imagePreviews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

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

  // Image Selection Handler for Tab 1
  const handleImageChange = (index, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check size limit: strictly < 1MB
    if (file.size > 1024 * 1024) {
      setReviewFormError('Each image must be under 1MB.');
      return;
    }

    setReviewFormError('');

    // Revoke previous URL if exists
    if (reviewForm.imagePreviews[index]) {
      URL.revokeObjectURL(reviewForm.imagePreviews[index]);
    }

    const previewUrl = URL.createObjectURL(file);

    setReviewForm((current) => {
      const nextImages = [...current.images];
      const nextPreviews = [...current.imagePreviews];
      nextImages[index] = file;
      nextPreviews[index] = previewUrl;
      return {
        ...current,
        images: nextImages,
        imagePreviews: nextPreviews,
      };
    });
  };

  // Remove Selected Image
  const removeImage = (index) => {
    if (reviewForm.imagePreviews[index]) {
      URL.revokeObjectURL(reviewForm.imagePreviews[index]);
    }

    setReviewForm((current) => {
      const nextImages = [...current.images];
      const nextPreviews = [...current.imagePreviews];
      nextImages[index] = null;
      nextPreviews[index] = null;
      return {
        ...current,
        images: nextImages,
        imagePreviews: nextPreviews,
      };
    });
  };

  // Convert File to Base64 Promise
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const getSubmittedWhatsApp = () => {
    try {
      const reviews = JSON.parse(localStorage.getItem('weave365_product_reviews') || '[]');
      if (reviews && reviews.length > 0) {
        return reviews[0].whatsapp;
      }
    } catch (e) {
      console.warn(e);
    }
    return '';
  };

  const checkApprovalStatus = async () => {
    const whatsapp = getSubmittedWhatsApp();
    if (!whatsapp) {
      setStatusMessage('No submitted review found on this device.');
      return;
    }

    setCheckingStatus(true);
    setStatusMessage('');

    const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
    const reviewsGid = process.env.NEXT_PUBLIC_PRODUCT_REVIEWS_GID || '1133055182';
    const csvUrl = sheetId
      ? `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=${reviewsGid}&single=true&output=csv`
      : process.env.NEXT_PUBLIC_PRODUCT_REVIEWS_CSV_URL;

    if (!csvUrl) {
      setStatusMessage('Approval check is only available in production mode once CSV is configured.');
      setCheckingStatus(false);
      return;
    }

    try {
      const response = await fetch(csvUrl);
      if (response.ok) {
        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).map(row => row.split(','));
        const cleanTarget = whatsapp.replace(/\D/g, '').slice(-10);
        
        let foundRow = null;
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i];
          if (cols.length > 2) {
            const cleanExisting = cols[2].replace(/\D/g, '').slice(-10);
            if (cleanExisting === cleanTarget && cleanTarget.length === 10) {
              foundRow = cols;
              break;
            }
          }
        }

        if (foundRow) {
          const status = foundRow[11] ? foundRow[11].trim().toLowerCase() : '';
          if (status === 'approved') {
            try {
              localStorage.setItem('weave365_review_approved', 'true');
            } catch (e) {
              console.warn(e);
            }
            setIsApproved(true);
            setActiveTab('complete-profile');
            setStatusMessage('Congratulations! Your application is approved. Proceeding to onboarding profile.');
          } else if (status === 'rejected' || status === 'declined') {
            setStatusMessage('Your application has been declined. Please contact support via WhatsApp.');
          } else {
            setStatusMessage('Your application is still under review. We typically respond within 48-72 hours.');
          }
        } else {
          setStatusMessage('No active review found for your number in our system.');
        }
      } else {
        setStatusMessage('Unable to connect to verification server. Please try again later.');
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
      setStatusMessage('Error verifying status. Please check your internet connection.');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Submit Handler for Tab 1 (Product Review Form)
  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewForm.fullName.trim()) {
      setReviewFormError('Please enter your full name.');
      return;
    }
    let cleanWhatsapp = reviewForm.whatsapp.trim().replace(/\D/g, '');
    if (cleanWhatsapp.length === 12 && cleanWhatsapp.startsWith('91')) {
      cleanWhatsapp = cleanWhatsapp.slice(2);
    }
    if (cleanWhatsapp.length !== 10) {
      setReviewFormError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }
    if (!reviewForm.city.trim()) {
      setReviewFormError('Please enter your city.');
      return;
    }
    const cleanPincode = reviewForm.pincode.trim().replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      setReviewFormError('Please enter a valid 6-digit Pincode.');
      return;
    }
    if (reviewForm.categories.length === 0) {
      setReviewFormError('Please select at least one product category.');
      return;
    }
    if (!reviewForm.priceRange) {
      setReviewFormError('Please select your approximate price range.');
      return;
    }
    
    // Check if exactly 4 images are uploaded
    const uploadedCount = reviewForm.images.filter(Boolean).length;
    if (uploadedCount !== 4) {
      setReviewFormError('Exactly 4 product images are required.');
      return;
    }

    if (!reviewForm.confirmGuidelines) {
      setReviewFormError('Please confirm that you follow Weave 365 image guidelines.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewFormError('');
    setReviewSubmitError('');

    try {
      // Check local duplicates
      const existingReviews = JSON.parse(localStorage.getItem('weave365_product_reviews') || '[]');
      const isDuplicate = existingReviews.some((app) => {
        const cleanExisting = app.whatsapp.trim().replace(/\D/g, '').slice(-10);
        const cleanInput = cleanWhatsapp.slice(-10);
        return cleanExisting === cleanInput && cleanInput.length === 10;
      });

      if (isDuplicate) {
        setReviewFormError('A review application has already been submitted for this WhatsApp number.');
        setIsSubmittingReview(false);
        return;
      }

      // Convert images to base64 for direct Google Drive / Sheet upload
      const base64Images = await Promise.all(
        reviewForm.images.map((file) => (file ? fileToBase64(file) : Promise.resolve('')))
      );

      const capitalizeWords = (str) => {
        if (!str) return '';
        return str
          .trim()
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      const application = {
        fullName: capitalizeWords(reviewForm.fullName),
        whatsapp: reviewForm.whatsapp.replace(/\s/g, ''),
        city: capitalizeWords(reviewForm.city),
        pincode: cleanPincode,
        categories: reviewForm.categories,
        priceRange: reviewForm.priceRange,
        image1: base64Images[0],
        image2: base64Images[1],
        image3: base64Images[2],
        image4: base64Images[3],
        submittedAt: new Date().toISOString(),
        status: 'pending_review',
        formType: 'product_review',
      };

      // Save locally
      localStorage.setItem('weave365_product_reviews', JSON.stringify([application, ...existingReviews]));

      // POST to Apps Script endpoint
      const endpoint = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_URL;
      if (endpoint) {
        await fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(application),
        });
      }

      setReviewSubmitted(true);
      setReviewForm(initialReviewForm);
    } catch (error) {
      console.error('Error submitting review application:', error);
      setReviewSubmitError('Failed to submit application. Please check your internet connection.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Submit Handler for Tab 2 (Original Onboarding Form)
  const handleSubmit = async (event) => {
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

    const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
    const vendorGid = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_GID || '0';
    const csvUrl = sheetId
      ? `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=${vendorGid}&single=true&output=csv`
      : process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_CSV_URL;

    if (csvUrl) {
      try {
        const response = await fetch(csvUrl);
        if (response.ok) {
          const csvText = await response.text();
          const rows = csvText.split('\n').map(row => row.split(','));
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
      ...form,
      fullName: capitalizeWords(form.fullName),
      city: capitalizeWords(form.city),
      mobile: form.mobile.replace(/\s/g, ''),
      aadhaar: form.aadhaar.replace(/\s/g, ''),
      gstNumber: form.gstNumber ? form.gstNumber.replace(/\s/g, '') : '',
      submittedAt: new Date().toISOString(),
      status: 'pending_manual_review',
      formType: 'onboarding_profile',
    };

    try {
      const existing = JSON.parse(localStorage.getItem('weave365_vendor_applications') || '[]');
      localStorage.setItem('weave365_vendor_applications', JSON.stringify([application, ...existing]));
    } catch (error) {
      console.warn('Unable to save vendor application locally', error);
    }

    const endpoint = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_URL;
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(application),
        });
        setSubmitted(true);
        setForm(initialForm);
      } catch (error) {
        console.error('Error submitting application:', error);
        setSubmitError('Failed to send application to Google Sheets. Please check your internet connection.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setSubmitted(true);
      setForm(initialForm);
      setIsSubmitting(false);
    }
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
            {/* Tabs Controller */}
            <div className="vendor-form-tabs" role="tablist">
              <button
                type="button"
                className={`vendor-tab-btn ${activeTab === 'product-review' ? 'active' : ''}`}
                onClick={() => setActiveTab('product-review')}
                role="tab"
                aria-selected={activeTab === 'product-review'}
              >
                1. Product Review
              </button>
              <button
                type="button"
                className={`vendor-tab-btn ${activeTab === 'complete-profile' ? 'active' : ''}`}
                onClick={() => {
                  if (isApproved) {
                    setActiveTab('complete-profile');
                  }
                }}
                disabled={!isApproved}
                role="tab"
                aria-selected={activeTab === 'complete-profile'}
                title={!isApproved ? 'Locked until Product Review is approved' : ''}
              >
                2. Onboarding Profile
                {!isApproved && <Lock size={14} className="vendor-tab-lock-icon" />}
              </button>
            </div>

            {/* Tab 1 content: Product Review Form */}
            {activeTab === 'product-review' && (
              reviewSubmitted ? (
                <div className="vendor-success-card" role="status" aria-live="polite">
                  <CheckCircle2 size={42} />
                  <h2>Products Submitted!</h2>
                  <p>
                    Step 1 of 2 is complete. Your product review application has been submitted successfully!
                    Our team is reviewing your product images. Advanced onboarding profile access (Step 2) will be unlocked after approval.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', alignItems: 'center', width: '100%' }}>
                    {!isApproved ? (
                      <>
                        <button 
                          type="button"
                          onClick={checkApprovalStatus}
                          className="vendor-submit-button"
                          disabled={checkingStatus}
                          style={{ margin: 0 }}
                        >
                          {checkingStatus ? 'Checking Status...' : 'Check Approval Status ↻'}
                        </button>
                        {statusMessage && (
                          <p style={{ fontSize: '13px', color: 'var(--ink)', fontStyle: 'italic', margin: '4px 0 0', textAlign: 'center' }}>
                            {statusMessage}
                          </p>
                        )}
                      </>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setActiveTab('complete-profile')}
                        className="vendor-submit-button"
                        style={{ margin: 0, background: 'var(--olive)' }}
                      >
                        Complete Onboarding Profile (Step 2) →
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form className="vendor-registration-form" onSubmit={handleReviewSubmit}>
                  <div className="vendor-form-heading">
                    <ClipboardCheck size={24} />
                    <div>
                      <h2>Submit your products for review</h2>
                      <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: 'var(--muted)', fontSize: '14px', lineHeight: '1.4' }}>
                        Step 1 of 2 — Our team reviews your product images first. Onboarding details are shared only after approval.
                      </p>
                    </div>
                  </div>

                  <fieldset className="vendor-form-section">
                    <legend>Contact Information</legend>
                    <div className="vendor-form-grid">
                      <label>
                        Full name *
                        <input
                          type="text"
                          value={reviewForm.fullName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const capitalized = val
                              .split(' ')
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            setReviewForm(curr => ({ ...curr, fullName: capitalized }));
                            setReviewFormError('');
                          }}
                          placeholder="Your full name"
                          required
                        />
                      </label>
                      <label>
                        WhatsApp number *
                        <input
                          type="tel"
                          value={reviewForm.whatsapp}
                          onChange={(e) => {
                            let inputVal = e.target.value;
                            if (!inputVal) {
                              setReviewForm(curr => ({ ...curr, whatsapp: '' }));
                              setReviewFormError('');
                              return;
                            }
                            
                            // Strip any version of "+91 " or "+91" or "91 " country code prefix first
                            if (inputVal.startsWith('+91 ')) {
                              inputVal = inputVal.slice(4);
                            } else if (inputVal.startsWith('+91')) {
                              inputVal = inputVal.slice(3);
                            } else if (inputVal.startsWith('91 ')) {
                              inputVal = inputVal.slice(3);
                            }
                            
                            let digits = inputVal.replace(/\D/g, '');
                            
                            // Handle copy-pasting of raw 12-digit number starting with 91 (e.g. 919919101369)
                            if (digits.length === 12 && digits.startsWith('91')) {
                              digits = digits.slice(2);
                            } else if (digits.length === 11 && digits.startsWith('0')) {
                              digits = digits.slice(1);
                            }
                            
                            digits = digits.slice(0, 10);
                            let formatted = '';
                            if (digits.length > 0) {
                              if (digits.length > 5) {
                                formatted = '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5);
                              } else {
                                formatted = '+91 ' + digits;
                              }
                            }
                            setReviewForm(curr => ({ ...curr, whatsapp: formatted }));
                            setReviewFormError('');
                          }}
                          placeholder="+91 XXXXX XXXXX"
                          inputMode="numeric"
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
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
                            setReviewForm(curr => ({ ...curr, city: capitalized }));
                            setReviewFormError('');
                          }}
                          placeholder="e.g. Varanasi"
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
                            setReviewForm(curr => ({ ...curr, pincode: raw }));
                            setReviewFormError('');
                          }}
                          placeholder="e.g. 221001"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength="6"
                          required
                        />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="vendor-form-section">
                    <legend>Supply Details</legend>
                    <div className="vendor-chip-group" role="group" aria-label="Product Category">
                      <span>Product category you supply *</span>
                      <div className="vendor-grid-2-col">
                        {reviewCategories.map((cat) => {
                          const isChecked = reviewForm.categories.includes(cat.id);
                          return (
                            <label className="vendor-chip-option" key={cat.id}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setReviewForm(curr => {
                                    const nextCats = curr.categories.includes(cat.id)
                                      ? curr.categories.filter(c => c !== cat.id)
                                      : [...curr.categories, cat.id];
                                    return { ...curr, categories: nextCats };
                                  });
                                  setReviewFormError('');
                                }}
                              />
                              {cat.emoji && <span style={{ marginRight: '4px' }}>{cat.emoji}</span>}
                              {cat.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="vendor-form-grid" style={{ marginTop: '8px' }}>
                      <label className="vendor-form-wide">
                        Approximate price range per piece *
                        <select
                          value={reviewForm.priceRange}
                          onChange={(e) => {
                            setReviewForm(curr => ({ ...curr, priceRange: e.target.value }));
                            setReviewFormError('');
                          }}
                          required
                        >
                          <option value="">Select your price range</option>
                          {priceRanges.map((range) => (
                            <option key={range} value={range}>{range}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="vendor-form-section">
                    <legend>Product Verification</legend>
                    
                    {/* Image Rules Box */}
                    <div className="review-rules-card">
                      <div className="review-rules-header">
                        <Info size={18} />
                        <span>Image rules — read before uploading</span>
                      </div>
                      <div className="review-rules-list">
                        <div className="review-rule-item allowed">
                          <Check size={16} />
                          <span>Real product photos only — no stock or borrowed images</span>
                        </div>
                        <div className="review-rule-item allowed">
                          <Check size={16} />
                          <span>Clear and properly lit — fabric texture must be visible</span>
                        </div>
                        <div className="review-rule-item allowed">
                          <Check size={16} />
                          <span>Border and pallu clearly visible (where applicable)</span>
                        </div>
                        <div className="review-rule-item forbidden">
                          <X size={16} />
                          <span>No AI-generated or heavily edited images</span>
                        </div>
                        <div className="review-rule-item forbidden">
                          <X size={16} />
                          <span>No watermarks or images taken from other websites</span>
                        </div>
                      </div>
                    </div>

                    <span>Product images (exactly 4 required) *</span>
                    <span className="review-upload-subtext">JPG or PNG only. Max 1MB per image.</span>

                    <div className="review-images-grid">
                      {[0, 1, 2, 3].map((idx) => {
                        const preview = reviewForm.imagePreviews[idx];
                        return (
                          <div className="review-image-slot" key={idx}>
                            {preview ? (
                              <div className="review-image-preview-container">
                                <img src={preview} alt={`Product ${idx + 1} Preview`} className="review-image-preview" />
                                <button
                                  type="button"
                                  className="review-image-remove-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeImage(idx);
                                  }}
                                  title="Remove image"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <UploadCloud className="review-image-slot-icon" size={28} />
                                <span>Image {idx + 1}</span>
                                <em>Click to upload</em>
                                <input
                                  type="file"
                                  accept="image/png, image/jpeg, image/jpg"
                                  onChange={(e) => handleImageChange(idx, e)}
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  {reviewFormError && <p className="vendor-form-error">{reviewFormError}</p>}
                  {reviewSubmitError && <p className="vendor-form-error">{reviewSubmitError}</p>}

                  <label className="vendor-agreement">
                    <input
                      type="checkbox"
                      checked={reviewForm.confirmGuidelines}
                      onChange={(e) => {
                        setReviewForm(curr => ({ ...curr, confirmGuidelines: e.target.checked }));
                        setReviewFormError('');
                      }}
                      required
                      disabled={isSubmittingReview}
                    />
                    I confirm that all submitted images are of my own products, are real photos, and follow Weave 365 image guidelines.
                  </label>

                  <button type="submit" className="vendor-submit-button" disabled={isSubmittingReview}>
                    {isSubmittingReview ? 'Submitting for review...' : 'Submit for review →'}
                  </button>

                  <div className="review-whatsapp-note">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12.031 6c-3.314 0-6 2.686-6 6 0 1.012.253 1.967.702 2.806L6 20l5.339-.681c.803.39 1.702.613 2.661.613 3.314 0 6-2.686 6-6 0-3.314-2.686-6-6-6zm3.504 8.821c-.154.433-.77.795-1.077.854-.298.058-.68.106-2.091-.453-1.802-.712-2.951-2.548-3.042-2.67-.091-.122-.741-.987-.741-1.884 0-.897.469-1.336.637-1.52.168-.184.368-.23.49-.23h.35c.123 0 .285.016.41.312.138.33.473 1.153.514 1.237.04.084.068.184.012.296-.056.113-.084.184-.168.28-.084.096-.178.214-.254.3-.091.101-.186.211-.079.395.106.184.473.782.101 1.258.484.428.891.702 1.348.902.14.061.277.098.398.138.328.104.628.089.864.054.263-.039.81-.331.925-.651.115-.32.115-.595.08-.651-.035-.056-.13-.089-.272-.16-.14-.071-.828-.408-.956-.454-.127-.046-.22-.071-.314.071-.093.14-.363.454-.445.548-.081.094-.164.106-.305.035-.142-.071-.599-.221-1.141-.705-.422-.376-.707-.841-.79-.982-.083-.142-.009-.219.062-.289.064-.063.142-.165.213-.248.071-.083.095-.142.142-.237.047-.095.024-.178-.012-.249-.036-.071-.314-.757-.43-.13-.113-.377-.247-.41-.376-.033-.129-.01-.25-.005-.305.005-.055.056-.129.071-.247s.376-.118.595.003c.219.121.722.395.956.551s.296.223.364.351c.068.128.068.742.034.87-.034.128-.152.28-.27.408z"/>
                    </svg>
                    <span>Review typically takes 48-72 h. We respond only on WhatsApp.</span>
                  </div>
                </form>
              )
            )}

            {/* Tab 2 content: Onboarding Profile Form */}
            {activeTab === 'complete-profile' && (
              !isApproved ? (
                <div className="vendor-locked-message">
                  <Lock className="vendor-locked-icon" size={48} />
                  <h3>Advanced Profile Locked</h3>
                  <p>To access the comprehensive manual onboarding profile form, your product review application (Step 1) must be approved.</p>
                </div>
              ) : (
                submitted ? (
                  <div className="vendor-success-card" role="status" aria-live="polite">
                    <CheckCircle2 size={42} />
                    <h2>Thank you for applying.</h2>
                    <p>Our team will review your details and contact you shortly.</p>
                  </div>
                ) : (
                  <form className="vendor-registration-form" onSubmit={handleSubmit}>
                    <div className="vendor-form-heading">
                      <ClipboardCheck size={24} />
                      <div>
                        <h2>Onboarding Form</h2>
                        <p>Fields marked with * are required for verification.</p>
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
                          {productCategories.map((category) => (
                            <label className="vendor-chip-option" key={category}>
                              <input
                                type="checkbox"
                                checked={form.productCategories.includes(category)}
                                onChange={() => toggleArrayValue('productCategories', category)}
                              />
                              {category}
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

