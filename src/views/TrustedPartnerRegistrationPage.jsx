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

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function TrustedPartnerRegistrationPage() {
  const heroImage = assetSrc(artisanImage);
  
  // Tab states
  const [activeTab, setActiveTab] = useState('product-review'); // 'product-review', 'payment-terms', or 'onboarding'
  
  // Tab 1: Product Review Form State
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
  // Tab 2: Payment Agreement Form State
  const [isPaymentTermsAgreed, setIsPaymentTermsAgreed] = useState(false);
  const [paymentAgreement, setPaymentAgreement] = useState({
    a1: false, a2: false, a3: false, a4: false, a5: false,
    b1: false, b2: false, b3: false, b4: false, b5: false,
    c1: false, c2: false, c3: false,
    d1: false, d2: false, d3: false,
    agreeAll: false,
    vendorName: '',
    date: getLocalDateString()
  });
  
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Tab 3: Onboarding Form State
  const [onboardingForm, setOnboardingForm] = useState({
    fullName: '',
    whatsapp: '',
    email: '',
    alternateContact: '',
    
    businessName: '',
    businessType: '',
    businessAddress: '',
    city: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    yearsInBusiness: '',
    
    productCategories: [],
    priceRange: '',
    monthlyCapacity: '',
    fabricSpecialisation: '',
    
    dispatchTimeline: '',
    preferredCourier: '',
    dispatchAddressSame: 'same', // 'same' or 'different'
    dispatchAddressDifferent: '',
    
    bankAccountHolder: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankUpi: '',
    
    aadhaar: '',
    panNumberVerify: '',
    idProof: null, // base64 string
    cancelledCheque: null, // base64 string
    
    agreement: false
  });
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  
  // Form submission state
  const [submitted, setSubmitted] = useState(false);
  
  // Unlock / Lock verification states
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false);
  const [unlockMobile, setUnlockMobile] = useState('');
  const [isVerifyingUnlock, setIsVerifyingUnlock] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState('');
  const [unlockError, setUnlockError] = useState('');
  
  const fileInputsRef = useRef([]);
  const idProofRef = useRef(null);
  const cancelledChequeRef = useRef(null);

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

      const paymentAgreed = localStorage.getItem('weave365_payment_terms_agreed') === 'true';
      if (paymentAgreed) {
        setIsPaymentTermsAgreed(true);
        setPaymentAgreement(prev => ({
          ...prev,
          vendorName: localStorage.getItem('weave365_payment_vendor_name') || '',
          date: localStorage.getItem('weave365_payment_agreement_date') || getLocalDateString(),
          agreeAll: true,
          a1: true, a2: true, a3: true, a4: true, a5: true,
          b1: true, b2: true, b3: true, b4: true, b5: true,
          c1: true, c2: true, c3: true,
          d1: true, d2: true, d3: true
        }));
      }
    } catch (e) {
      console.warn('LocalStorage reads are blocked or unsupported:', e);
    }
  }, []);

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
    
    // Check if all 4 images are uploaded
    const uploadedImagesCount = reviewForm.images.filter(Boolean).length;
    if (uploadedImagesCount < 4) {
      setReviewError('Please upload exactly 4 sample product photos (one for each slot) before submitting.');
      return;
    }
    
    setReviewSubmitting(true);

    const cleanWhatsapp = reviewForm.whatsapp.trim().replace(/\D/g, '');
    if (cleanWhatsapp.length !== 10) {
      setReviewError('Please enter a valid 10-digit WhatsApp number.');
      setReviewSubmitting(false);
      return;
    }
    
    // Local duplicate check
    try {
      const existingReviews = JSON.parse(localStorage.getItem('weave365_local_reviews') || '[]');
      const isDuplicate = existingReviews.some((rev) => {
        const cleanExisting = rev.whatsapp.trim().replace(/\D/g, '').slice(-10);
        const cleanInput = cleanWhatsapp.slice(-10);
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

    // Global duplicate checks via database API
    try {
      const response = await fetch(`/api/vendor-registration?whatsapp=${cleanWhatsapp}&_t=${Date.now()}`);
      if (response.ok) {
        const resData = await response.json();
        if (resData.status === 'success' && resData.review) {
          setReviewError('A review application has already been submitted with this mobile number.');
          setReviewSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Unable to verify global reviews duplicate status:', err);
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

    // Submit review payload to database
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
        setReviewError(resData.error || 'Failed to submit product reviews. Please verify database configurations.');
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
      const response = await fetch(`/api/vendor-registration?whatsapp=${inputNum}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Database lookup failed.');
      }

      const resData = await response.json();
      if (resData.status !== 'success') {
        throw new Error(resData.error || 'Database lookup failed.');
      }

      const review = resData.review;
      if (!review) {
        setUnlockMessage("⏳ If you recently submitted Tab 1, your review is currently PENDING approval (please allow a few minutes for the database to sync). If you haven't submitted Tab 1 yet, please submit your products for review first.");
        setIsVerifyingUnlock(false);
        return;
      }

      const status = review.status || 'pending';
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
          setUnlockMessage('⏳ If you recently submitted Tab 1, your review is currently PENDING approval. Please allow a few minutes for the database to sync or check your connection.');
        }
      } catch (e) {
        setUnlockMessage('⏳ If you recently submitted Tab 1, your review is currently PENDING approval. Please check your connection and try again.');
      }
    } finally {
      setIsVerifyingUnlock(false);
    }
  };

  // Tab 2: Payment Agreement Handlers
  const handleAgreeAllChange = (checked) => {
    setPaymentAgreement((prev) => ({
      ...prev,
      a1: checked,
      a2: checked,
      a3: checked,
      a4: checked,
      a5: checked,
      b1: checked,
      b2: checked,
      b3: checked,
      b4: checked,
      b5: checked,
      c1: checked,
      c2: checked,
      c3: checked,
      d1: checked,
      d2: checked,
      d3: checked,
      agreeAll: checked
    }));
  };

  const handlePaymentTermsSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    const { a1, a2, a3, a4, a5, b1, b2, b3, b4, b5, c1, c2, c3, d1, d2, d3, agreeAll, vendorName, date } = paymentAgreement;

    if (!a1 || !a2 || !a3 || !a4 || !a5 || !b1 || !b2 || !b3 || !b4 || !b5 || !c1 || !c2 || !c3 || !d1 || !d2 || !d3 || !agreeAll) {
      setPaymentError('Please read and agree to all clauses and check the "agree to all terms" box.');
      return;
    }

    if (!vendorName.trim()) {
      setPaymentError('Please enter your full name as per your ID proof.');
      return;
    }

    if (!date) {
      setPaymentError('Please select the date.');
      return;
    }

    setPaymentSubmitting(true);

    const cleanWhatsapp = String(unlockMobile || reviewForm.whatsapp || '').trim().replace(/\D/g, '').slice(-10);
    if (cleanWhatsapp.length !== 10) {
      setPaymentError('Registered mobile/WhatsApp number not found. Please complete Step 1 first.');
      setPaymentSubmitting(false);
      return;
    }

    const timestamp = Date.now();
    const agreementId = `WM-AG-${timestamp}`;

    // Compile beautifully styled legal HTML document
    const docHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Weave365 B2B Merchant Agreement - Signed Copy</title>
  <style>
    body {
      background-color: #faf8f5;
      color: #1a1715;
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      padding: 40px;
    }
    .agreement-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #b78646;
      padding: 60px 50px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.03);
      position: relative;
    }
    .agreement-header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px double #b78646;
      padding-bottom: 20px;
    }
    .logo-text {
      font-size: 32px;
      font-weight: bold;
      color: #b78646;
      letter-spacing: 2px;
      margin: 0 0 10px 0;
      text-transform: uppercase;
    }
    .doc-title {
      font-size: 20px;
      letter-spacing: 1px;
      color: #1a1715;
      margin: 0;
      text-transform: uppercase;
      font-family: sans-serif;
      font-weight: 600;
    }
    .meta-box {
      background: #fdfbf7;
      border: 1px solid rgba(183, 134, 70, 0.2);
      border-radius: 6px;
      padding: 20px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      font-size: 13px;
      font-family: sans-serif;
    }
    .meta-item strong {
      color: #b78646;
    }
    .clause-section {
      margin-bottom: 30px;
    }
    .clause-title {
      font-size: 16px;
      font-weight: bold;
      color: #b78646;
      border-bottom: 1px solid rgba(183, 134, 70, 0.15);
      padding-bottom: 5px;
      margin-bottom: 15px;
      text-transform: uppercase;
      font-family: sans-serif;
    }
    .clause-item {
      margin-bottom: 15px;
      font-size: 14px;
    }
    .clause-item-head {
      font-weight: bold;
      color: #1a1715;
    }
    .signature-section {
      margin-top: 50px;
      border-top: 1px solid #b78646;
      padding-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .sig-block {
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px dashed #b78646;
      height: 40px;
      margin-bottom: 10px;
    }
    .sig-name {
      font-size: 13px;
      font-weight: bold;
      font-family: sans-serif;
    }
    .sig-meta {
      font-size: 11px;
      color: #666;
      font-family: sans-serif;
    }
    .print-btn-container {
      text-align: center;
      margin-top: 30px;
    }
    .print-btn {
      background: #b78646;
      color: #fff;
      border: none;
      padding: 12px 30px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      font-family: sans-serif;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #9d7036;
    }
    @media print {
      body { padding: 0; background: none; }
      .agreement-container { border: none; box-shadow: none; padding: 0; }
      .print-btn-container { display: none; }
    }
  </style>
</head>
<body>
  <div class="agreement-container">
    <div class="agreement-header">
      <div class="logo-text">Weave 365</div>
      <div class="doc-title">B2B Merchant Agreement & Terms</div>
    </div>
    
    <div class="meta-box">
      <div class="meta-item"><strong>Agreement ID:</strong> ${agreementId}</div>
      <div class="meta-item"><strong>Registered Phone:</strong> +91 ${cleanWhatsapp}</div>
      <div class="meta-item"><strong>Authorized Signatory:</strong> ${vendorName}</div>
      <div class="meta-item"><strong>Date of Signature:</strong> ${date}</div>
    </div>

    <div class="clause-section">
      <div class="clause-title">A. Payment Terms</div>
      <div class="clause-item">
        <span class="clause-item-head">A1 — Payment after delivery confirmation:</span>
        Payment will be released 3 days after successful delivery to the customer.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">A2 — Payment held during dispute period:</span>
        If a return or quality dispute is raised within 3 days of delivery, payment will be withheld until the dispute is resolved.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">A3 — Payment mode as agreed at onboarding:</span>
        Payment will be made via bank transfer (NEFT/IMPS/UPI) to the account details provided during onboarding. Weave 365 is not liable for errors due to incorrect account details submitted by the vendor.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">A4 — No advance payment:</span>
        Weave 365 does not make advance payments. All payments are processed post-delivery only.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">A5 — Deduction for returns and damage:</span>
        Any returned product amount and associated courier charges will be deducted from the vendor's pending payment before disbursement.
      </div>
    </div>

    <div class="clause-section">
      <div class="clause-title">B. Return Policy</div>
      <div class="clause-item">
        <span class="clause-item-head">B1 — Color and quality must match approved photos:</span>
        The product dispatched must exactly match the color, quality, and finish shown in the approved product images submitted during Step 1. Any deviation will be treated as a vendor-side defect.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">B2 — Returns due to quality or color mismatch go back to vendor:</span>
        If a customer return is raised due to quality defect, color variation, or mismatch with listing photos, the returned product will be sent back to the vendor at the vendor's expense. No payment will be made for such orders.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">B3 — Return window — 3 days from delivery:</span>
        Customers may raise a return request within 3 days of delivery. Returns raised after this window will not be accepted and vendor payment will be released normally.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">B4 — Defective or damaged in transit:</span>
        If a product is damaged during courier transit, liability will be assessed jointly. Vendor must ensure proper packaging. Products with inadequate packaging will be vendor's liability.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">B5 — No return for buyer's remorse or size preference:</span>
        Returns due to customer preference change, wrong size ordered, or buyer's remorse will not be charged to the vendor. These are handled by Weave 365's customer policy separately.
      </div>
    </div>

    <div class="clause-section">
      <div class="clause-title">C. Product & Listing Standards</div>
      <div class="clause-item">
        <span class="clause-item-head">C1 — No duplicate listings from other platforms:</span>
        Products listed on Weave 365 must not be sold at a lower price on any other platform (Meesho, Flipkart, own website, etc.) during the period of active listing.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">C2 — Stock availability obligation:</span>
        Once a product is listed, the vendor must maintain stock availability. If stock runs out, the vendor must notify Weave 365 immediately to avoid customer orders being placed on out-of-stock items.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">C3 — Dispatch within agreed timeline:</span>
        Vendor must dispatch orders within the agreed timeline (default: 2 business days from order confirmation). Repeated delays may result in delisting.
      </div>
    </div>

    <div class="clause-section">
      <div class="clause-title">D. General Terms</div>
      <div class="clause-item">
        <span class="clause-item-head">D1 — Right to delist:</span>
        Weave 365 reserves the right to delist a vendor's products at any time if quality standards, return rates, or these terms are not met, with 24 hours notice.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">D2 — Confidentiality of pricing:</span>
        Vendor agrees not to disclose Weave 365's wholesale pricing, commission structure, or internal operational details to any third party.
      </div>
      <div class="clause-item">
        <span class="clause-item-head">D3 — Agreement is binding:</span>
        By submitting this form, the vendor agrees that these terms are legally binding. Weave 365 reserves the right to update these terms with 7 days prior notice.
      </div>
    </div>

    <div class="signature-section">
      <div class="sig-block">
        <div class="sig-line" style="font-family: 'Courier New', monospace; font-size: 18px; color: #3b82f6; display: flex; align-items: center; justify-content: center;">
          <i>WEAVE365 SECURE SIGNED</i>
        </div>
        <div class="sig-name">Weave 365 Operations</div>
        <div class="sig-meta">Counter-signatory and Platform Admin</div>
      </div>
      <div class="sig-block">
        <div class="sig-line" style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #1e3a8a; display: flex; align-items: center; justify-content: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
          ${vendorName}
        </div>
        <div class="sig-name">${vendorName}</div>
        <div class="sig-meta">Authorized Vendor Representative (Electronically Signed)</div>
      </div>
    </div>

    <div class="print-btn-container">
      <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>`;

    // 1. Download HTML document copy locally
    try {
      const blob = new Blob([docHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Weave365_Signed_Agreement_${cleanWhatsapp}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Failed to download copy locally:', err);
    }

    // 2. Prepare Base64 payload of the agreement document to upload
    const base64Doc = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(docHtml)));

    // 3. Post to API to secure and upload this signed legal document to Supabase
    try {
      const response = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'submit_agreement',
          whatsapp: cleanWhatsapp,
          vendorName,
          date,
          agreementDoc: base64Doc
        })
      });

      const resData = await response.json();
      if (response.ok && resData.status === 'success') {
        try {
          localStorage.setItem('weave365_payment_terms_agreed', 'true');
          localStorage.setItem('weave365_payment_vendor_name', vendorName);
          localStorage.setItem('weave365_payment_agreement_date', date);
        } catch (err) {
          console.warn('LocalStorage save skipped:', err);
        }

        setIsPaymentTermsAgreed(true);
        alert('Terms agreed & official signed agreement copy downloaded successfully! Moving to Step 3 — Onboarding Form.');
        setActiveTab('onboarding');
      } else {
        setPaymentError(resData.error || 'Failed to register your agreement. Please verify connection.');
      }
    } catch (err) {
      console.error('Failed to submit agreement:', err);
      setPaymentError('Connection error occurred while registering terms. Please try again.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Tab 3: Onboarding Form Handlers
  const toggleOnboardingCategory = (categoryName) => {
    setOnboardingForm((prev) => {
      const existing = prev.productCategories;
      const next = existing.includes(categoryName)
        ? existing.filter((c) => c !== categoryName)
        : [...existing, categoryName];
      return { ...prev, productCategories: next };
    });
    setOnboardingError('');
  };

  const handleOnboardingFileChange = async (file, field) => {
    setOnboardingError('');
    if (!file) return;

    // Validate size (<2MB)
    if (file.size > 2 * 1024 * 1024) {
      setOnboardingError(`File exceeds 2MB limit. Please choose a smaller file.`);
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setOnboardingForm((prev) => ({
        ...prev,
        [field]: base64
      }));
    } catch (err) {
      console.error('Failed to convert file to Base64:', err);
      setOnboardingError('Failed to process the uploaded file. Please try again.');
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setOnboardingError('');

    if (onboardingForm.productCategories.length === 0) {
      setOnboardingError('Please select at least one product category.');
      return;
    }

    if (!onboardingForm.agreement) {
      setOnboardingError('Please confirm the accuracy of the provided information by checking the declaration.');
      return;
    }

    setOnboardingSubmitting(true);

    const cleanWhatsapp = onboardingForm.whatsapp.trim().replace(/\D/g, '');
    if (cleanWhatsapp.length !== 10) {
      setOnboardingError('Please enter a valid 10-digit WhatsApp number.');
      setOnboardingSubmitting(false);
      return;
    }

    // Prepare payload
    const capitalizedName = onboardingForm.fullName
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const capitalizedCity = onboardingForm.city
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const payload = {
      action: 'vendor_registration',
      ...onboardingForm,
      fullName: capitalizedName,
      whatsapp: cleanWhatsapp,
      city: capitalizedCity,
      productCategories: onboardingForm.productCategories.join(', '),
      paymentVendorName: paymentAgreement.vendorName,
      paymentAgreementDate: paymentAgreement.date,
      submittedAt: new Date().toISOString(),
      status: 'pending_onboarding_review'
    };

    // Save locally
    try {
      const existing = JSON.parse(localStorage.getItem('weave365_vendor_applications') || '[]');
      localStorage.setItem('weave365_vendor_applications', JSON.stringify([payload, ...existing]));
      localStorage.setItem('weave365_vendor_submitted', 'true');
    } catch (error) {
      console.warn('Unable to save vendor application locally:', error);
    }

    // Submit payload to Google Sheets via proxy
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
        setSubmitted(true);
      } else {
        setOnboardingError(resData.error || 'Failed to submit onboarding form. Please try again.');
      }
    } catch (err) {
      console.error('Failed to submit onboarding payload:', err);
      setOnboardingError('Failed to send onboarding form. Check your internet connection.');
    } finally {
      setOnboardingSubmitting(false);
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
      localStorage.removeItem('weave365_payment_terms_agreed');
      localStorage.removeItem('weave365_payment_vendor_name');
      localStorage.removeItem('weave365_payment_agreement_date');
    } catch (err) {
      console.warn('Error clearing localStorage testing keys:', err);
    }
    
    // Reset states
    setSubmitted(false);
    setReviewSubmitted(false);
    setIsProfileUnlocked(false);
    setIsPaymentTermsAgreed(false);
    setPaymentAgreement({
      a1: false, a2: false, a3: false, a4: false, a5: false,
      b1: false, b2: false, b3: false, b4: false, b5: false,
      c1: false, c2: false, c3: false,
      d1: false, d2: false, d3: false,
      agreeAll: false,
      vendorName: '',
      date: ''
    });
    setOnboardingForm({
      fullName: '',
      whatsapp: '',
      email: '',
      alternateContact: '',
      businessName: '',
      businessType: '',
      businessAddress: '',
      city: '',
      pincode: '',
      gstNumber: '',
      panNumber: '',
      yearsInBusiness: '',
      productCategories: [],
      priceRange: '',
      monthlyCapacity: '',
      fabricSpecialisation: '',
      dispatchTimeline: '',
      preferredCourier: '',
      dispatchAddressSame: 'same',
      dispatchAddressDifferent: '',
      bankAccountHolder: '',
      bankName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      bankUpi: '',
      aadhaar: '',
      panNumberVerify: '',
      idProof: null,
      cancelledCheque: null,
      agreement: false
    });
    setReviewForm(initialReviewForm);
    setUnlockMobile('');
    setUnlockMessage('');
    setUnlockError('');
    setReviewError('');
    setOnboardingError('');
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
                className={`vendor-tab-btn ${activeTab === 'payment-terms' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment-terms')}
              >
                {!isProfileUnlocked && <Lock size={14} className="tab-lock-icon" />}
                {isProfileUnlocked && <Unlock size={14} className="tab-unlock-icon" />}
                2. Payment Terms
              </button>
              <button 
                type="button"
                className={`vendor-tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
                onClick={() => setActiveTab('onboarding')}
              >
                {(!isProfileUnlocked || !isPaymentTermsAgreed) && <Lock size={14} className="tab-lock-icon" />}
                {(isProfileUnlocked && isPaymentTermsAgreed) && <Unlock size={14} className="tab-unlock-icon" />}
                3. Onboarding Form
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
                    onClick={() => setActiveTab('payment-terms')}
                  >
                    Go to Payment Terms Status Check
                  </button>

                  {process.env.NODE_ENV === 'development' && (
                    <button
                      type="button"
                      className="clear-test-cache-link"
                      onClick={handleClearCache}
                    >
                      Clear cache & test again ↺
                    </button>
                  )}
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
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setReviewForm((prev) => ({ ...prev, whatsapp: raw }));
                          }}
                          placeholder="9876543210"
                          pattern="[0-9]{10}"
                          inputMode="numeric"
                          title="Enter a 10-digit WhatsApp number"
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
                    <legend>Sample Product Photos *</legend>
                    <p className="upload-subtitle">Upload exactly 4 clear sample photos of your sarees/textiles (e.g., cover, details, back, borders) to submit for review.</p>
                    
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
                        <li>All <strong>4 image slots</strong> must be uploaded to submit the application</li>
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

            {/* TAB 2: PAYMENT TERMS & RETURN POLICY FORM */}
            {activeTab === 'payment-terms' && (
              !isProfileUnlocked ? (
                <div className="vendor-profile-lock">
                  <div className="lock-overlay-content">
                    <div className="lock-illustration">
                      <Lock size={64} className="padlock-icon animate-pulse" />
                    </div>
                    <h2>Payment Terms & Return Policy Locked</h2>
                    <p className="lock-desc">
                      The Weave365 Payment Terms agreement is available exclusively to verified suppliers. 
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

                    {process.env.NODE_ENV === 'development' && (
                      <button
                        type="button"
                        className="clear-test-cache-link"
                        onClick={handleClearCache}
                        style={{ marginTop: '24px' }}
                      >
                        Clear cache & test again ↺
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePaymentTermsSubmit}>
                  <h2 className="sr-only">Weave 365 vendor payment terms and return policy agreement form — Step 2 of vendor onboarding</h2>

                  <div className="onboarding-step-wrapper">
                    <div>
                      <span className="onboarding-step-meta">
                        Weave 365 · Vendor onboarding · Step 2 of 3
                      </span>
                      <h3 className="onboarding-step-title">
                        Payment terms & return policy
                      </h3>
                      <p className="onboarding-step-desc">
                        Read each clause carefully. You must agree to all terms before onboarding proceeds.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                      {/* Section A: Payment Terms */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-currency-rupee" aria-hidden="true"></i>
                          <span>A. Payment terms</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">A1 — Payment after delivery confirmation</p>
                              <p className="onboarding-clause-desc">Payment will be released 3 days after successful delivery to the customer.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">A2 — Payment held during dispute period</p>
                              <p className="onboarding-clause-desc">If a return or quality dispute is raised within 3 days of delivery, payment will be withheld until the dispute is resolved.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">A3 — Payment mode as agreed at onboarding</p>
                              <p className="onboarding-clause-desc">Payment will be made via bank transfer (NEFT/IMPS/UPI) to the account details provided during onboarding. Weave 365 is not liable for errors due to incorrect account details submitted by the vendor.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a4} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a4: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">A4 — No advance payment</p>
                              <p className="onboarding-clause-desc">Weave 365 does not make advance payments. All payments are processed post-delivery only.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a5} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a5: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">A5 — Deduction for returns and damage</p>
                              <p className="onboarding-clause-desc">Any returned product amount and associated courier charges will be deducted from the vendor's pending payment before disbursement.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Section B: Return Policy */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-arrow-back-up" aria-hidden="true"></i>
                          <span>B. Return policy</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">B1 — Color and quality must match approved photos</p>
                              <p className="onboarding-clause-desc">The product dispatched must exactly match the color, quality, and finish shown in the approved product images submitted during Step 1. Any deviation will be treated as a vendor-side defect.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">B2 — Returns due to quality or color mismatch go back to vendor</p>
                              <p className="onboarding-clause-desc">If a customer return is raised due to quality defect, color variation, or mismatch with listing photos, the returned product will be sent back to the vendor at the vendor's expense. No payment will be made for such orders.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">B3 — Return window — 3 days from delivery</p>
                              <p className="onboarding-clause-desc">Customers may raise a return request within 3 days of delivery. Returns raised after this window will not be accepted and vendor payment will be released normally.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b4} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b4: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">B4 — Defective or damaged in transit</p>
                              <p className="onboarding-clause-desc">If a product is damaged during courier transit, liability will be assessed jointly. Vendor must ensure proper packaging. Products with inadequate packaging will be vendor's liability.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b5} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b5: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">B5 — No return for buyer's remorse or size preference</p>
                              <p className="onboarding-clause-desc">Returns due to customer preference change, wrong size ordered, or buyer's remorse will not be charged to the vendor. These are handled by Weave 365's customer policy separately.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Section C: Product & Listing Standards */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-shield-check" aria-hidden="true"></i>
                          <span>C. Product & listing standards</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.c1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, c1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">C1 — No duplicate listings from other platforms</p>
                              <p className="onboarding-clause-desc">Products listed on Weave 365 must not be sold at a lower price on any other platform (Meesho, Flipkart, own website, etc.) during the period of active listing.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.c2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, c2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">C2 — Stock availability obligation</p>
                              <p className="onboarding-clause-desc">Once a product is listed, the vendor must maintain stock availability. If stock runs out, the vendor must notify Weave 365 immediately to avoid customer orders being placed on out-of-stock items.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.c3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, c3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">C3 — Dispatch within agreed timeline</p>
                              <p className="onboarding-clause-desc">Vendor must dispatch orders within the agreed timeline (default: 2 business days from order confirmation). Repeated delays may result in delisting.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Section D: General Terms */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-gavel" aria-hidden="true"></i>
                          <span>D. General terms</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.d1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, d1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">D1 — Right to delist</p>
                              <p className="onboarding-clause-desc">Weave 365 reserves the right to delist a vendor's products at any time if quality standards, return rates, or these terms are not met, with 24 hours notice.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.d2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, d2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">D2 — Confidentiality of pricing</p>
                              <p className="onboarding-clause-desc">Vendor agrees not to disclose Weave 365's wholesale pricing, commission structure, or internal operational details to any third party.</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.d3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, d3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">D3 — Agreement is binding</p>
                              <p className="onboarding-clause-desc">By submitting this form, the vendor agrees that these terms are legally binding. Weave 365 reserves the right to update these terms with 7 days prior notice.</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="onboarding-agree-all-box">
                      <label className="onboarding-agree-all-label">
                        <input type="checkbox" id="agreeAll" checked={paymentAgreement.agreeAll} onChange={(e) => handleAgreeAllChange(e.target.checked)} className="onboarding-agree-all-checkbox" />
                        <span className="onboarding-agree-all-text">
                          I have read and agree to all payment terms, return policy, product standards, and general terms listed above. I understand that violation of these terms may result in payment hold or delisting.
                        </span>
                      </label>
                    </div>

                    <div className="onboarding-signature-grid">
                      <div className="onboarding-signature-field">
                        <label className="onboarding-signature-label">Vendor full name</label>
                        <input 
                          type="text" 
                          value={paymentAgreement.vendorName} 
                          onChange={(e) => setPaymentAgreement(prev => ({ ...prev, vendorName: e.target.value }))} 
                          placeholder="As per ID proof" 
                          required 
                          className="onboarding-signature-input"
                        />
                      </div>
                      <div className="onboarding-signature-field">
                        <label className="onboarding-signature-label">Date of Submission</label>
                        <input 
                          type="date" 
                          value={paymentAgreement.date} 
                          readOnly
                          required 
                          className="onboarding-signature-input"
                          style={{ color: 'var(--muted)', background: 'var(--surface-soft)', cursor: 'not-allowed' }}
                        />
                      </div>
                    </div>

                    {paymentError && (
                      <div className="vendor-form-error" role="alert" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                        <AlertCircle size={18} />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    <button type="submit" className="onboarding-submit-button" disabled={paymentSubmitting}>
                      {paymentSubmitting ? (
                        <>
                          <RefreshCw size={18} className="spinner" />
                          Registering & Downloading Agreement...
                        </>
                      ) : (
                        'I agree to all terms — proceed to onboarding & download copy →'
                      )}
                    </button>

                    <p className="onboarding-step-footer">Step 2 of 3 — Onboarding form will be unlocked immediately after this agreement copy is verified.</p>
                  </div>
                </form>
              )
            )}

            {/* TAB 3: VENDOR ONBOARDING FORM */}
            {activeTab === 'onboarding' && (
              !isProfileUnlocked ? (
                <div className="vendor-profile-lock">
                  <div className="lock-overlay-content">
                    <div className="lock-illustration">
                      <Lock size={64} className="padlock-icon animate-pulse" />
                    </div>
                    <h2>Onboarding Form Locked</h2>
                    <p className="lock-desc">
                      The Weave365 Full Vendor Onboarding profile is available exclusively to verified suppliers. 
                      Please complete <strong>Step 1 (Submit Products for Review)</strong> first. 
                      Once verified, enter your registered number below to unlock step 3.
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

                    {process.env.NODE_ENV === 'development' && (
                      <button
                        type="button"
                        className="clear-test-cache-link"
                        onClick={handleClearCache}
                        style={{ marginTop: '24px' }}
                      >
                        Clear cache & test again ↺
                      </button>
                    )}
                  </div>
                </div>
              ) : !isPaymentTermsAgreed ? (
                <div className="vendor-profile-lock">
                  <div className="lock-overlay-content">
                    <div className="lock-illustration">
                      <Lock size={64} className="padlock-icon animate-pulse" />
                    </div>
                    <h2>Payment Terms Agreement Required</h2>
                    <p className="lock-desc">
                      Step 3 (Vendor Onboarding Form) will unlock once you review and agree to the 
                      <strong> Step 2 (Payment Terms & Return Policy)</strong>.
                    </p>
                    <button 
                      type="button" 
                      className="vendor-submit-button"
                      onClick={() => setActiveTab('payment-terms')}
                      style={{ marginTop: '16px' }}
                    >
                      Go to Step 2 — Review Payment Terms
                    </button>
                  </div>
                </div>
              ) : submitted ? (
                <div className="vendor-success-card" role="status" aria-live="polite">
                  <CheckCircle2 size={42} />
                  <h2>Thank you for applying!</h2>
                  <p>Our team has received your full onboarding profile and verification documents. We will finalize your supplier listing shortly.</p>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>Account activation takes 3–5 business days after document verification.</p>

                  {process.env.NODE_ENV === 'development' && (
                    <button
                      type="button"
                      className="clear-test-cache-link"
                      onClick={handleClearCache}
                      style={{ marginTop: '24px' }}
                    >
                      Clear cache & test again ↺
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleOnboardingSubmit} className="vendor-registration-form">
                  <h2 className="sr-only">Weave 365 full vendor onboarding form — Step 3 of 3, collecting business details, bank account, product info, and dispatch details</h2>

                  <div className="onboarding-step-wrapper">
                    <div>
                      <span className="step3-meta">
                        Weave 365 · Vendor onboarding · Step 3 of 3
                      </span>
                      <h3 className="step3-title">
                        Vendor onboarding form
                      </h3>
                      <p className="step3-desc">
                        Complete all sections. Your listing will go live after Weave 365 team verification.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Section A: Personal Details */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-user-circle" aria-hidden="true"></i>
                          <span className="step3-section-title">A. Personal details</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Full name</label>
                              <input type="text" value={onboardingForm.fullName} onChange={(e) => setOnboardingForm(prev => ({ ...prev, fullName: e.target.value }))} placeholder="As per Aadhaar / PAN" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">WhatsApp number</label>
                              <div className="tel-input-container">
                                <span className="tel-input-prefix">+91</span>
                                <input 
                                  type="tel" 
                                  value={onboardingForm.whatsapp} 
                                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                                  placeholder="XXXXX XXXXX" 
                                  required 
                                  className="tel-input-field" 
                                />
                              </div>
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Email address</label>
                              <input type="email" value={onboardingForm.email} onChange={(e) => setOnboardingForm(prev => ({ ...prev, email: e.target.value }))} placeholder="your@email.com" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">Alternate contact number</label>
                              <div className="tel-input-container">
                                <span className="tel-input-prefix">+91</span>
                                <input 
                                  type="tel" 
                                  value={onboardingForm.alternateContact} 
                                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, alternateContact: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                                  placeholder="XXXXX XXXXX" 
                                  className="tel-input-field" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Business Details */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-building" aria-hidden="true"></i>
                          <span className="step3-section-title">B. Business details</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Business / shop name</label>
                              <input type="text" value={onboardingForm.businessName} onChange={(e) => setOnboardingForm(prev => ({ ...prev, businessName: e.target.value }))} placeholder="Trade name" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">Business type</label>
                              <select value={onboardingForm.businessType} onChange={(e) => setOnboardingForm(prev => ({ ...prev, businessType: e.target.value }))} required className="step3-select">
                                <option value="" disabled>Select</option>
                                <option value="Sole proprietor / Individual weaver">Sole proprietor / Individual weaver</option>
                                <option value="Partnership firm">Partnership firm</option>
                                <option value="Private limited company">Private limited company</option>
                                <option value="Manufacturer">Manufacturer</option>
                                <option value="Trader / Wholesaler">Trader / Wholesaler</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">Business address</label>
                            <input type="text" value={onboardingForm.businessAddress} onChange={(e) => setOnboardingForm(prev => ({ ...prev, businessAddress: e.target.value }))} placeholder="Shop / unit address" required className="step3-input" style={{ marginBottom: '8px' }} />
                            <div className="step3-grid-3col">
                              <input type="text" value={onboardingForm.city} onChange={(e) => setOnboardingForm(prev => ({ ...prev, city: e.target.value }))} placeholder="City" required className="step3-input" />
                              <input type="text" value={onboardingForm.pincode} onChange={(e) => setOnboardingForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="Pincode" maxLength="6" required className="step3-input" />
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">GST number <span>(if registered)</span></label>
                              <input type="text" value={onboardingForm.gstNumber} onChange={(e) => setOnboardingForm(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">PAN number</label>
                              <input type="text" value={onboardingForm.panNumber} onChange={(e) => setOnboardingForm(prev => ({ ...prev, panNumber: e.target.value.toUpperCase().slice(0, 10) }))} placeholder="AAAAA0000A" maxLength="10" required className="step3-input" />
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">Years in business</label>
                            <select value={onboardingForm.yearsInBusiness} onChange={(e) => setOnboardingForm(prev => ({ ...prev, yearsInBusiness: e.target.value }))} required className="step3-select">
                              <option value="" disabled>Select</option>
                              <option value="Less than 1 year">Less than 1 year</option>
                              <option value="1 – 3 years">1 – 3 years</option>
                              <option value="3 – 7 years">3 – 7 years</option>
                              <option value="7 – 15 years">7 – 15 years</option>
                              <option value="15+ years">15+ years</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section C: Product Details */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-hanger" aria-hidden="true"></i>
                          <span className="step3-section-title">C. Product details</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div>
                            <label className="step3-field-label">Product categories you supply <span>(select all that apply)</span></label>
                            <div className="step3-categories-grid">
                              {[
                                { name: 'Sarees', icon: 'ti-flower' },
                                { name: 'Suits', icon: 'ti-shirt' },
                                { name: 'Dupattas', icon: 'ti-scissors' },
                                { name: 'Lehengas', icon: 'ti-hanger' },
                                { name: 'Fabrics', icon: 'ti-palette' },
                                { name: 'Accessories', icon: 'ti-sparkles' }
                              ].map((cat) => (
                                <label key={cat.name} className="step3-category-card">
                                  <input type="checkbox" checked={onboardingForm.productCategories.includes(cat.name)} onChange={() => toggleOnboardingCategory(cat.name)} />
                                  <i className={`ti ${cat.icon}`} aria-hidden="true"></i> {cat.name}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Price range per piece</label>
                              <select value={onboardingForm.priceRange} onChange={(e) => setOnboardingForm(prev => ({ ...prev, priceRange: e.target.value }))} required className="step3-select">
                                <option value="" disabled>Select</option>
                                <option value="Under ₹500">Under ₹500</option>
                                <option value="₹500 – ₹999">₹500 – ₹999</option>
                                <option value="₹1,000 – ₹1,999">₹1,000 – ₹1,999</option>
                                <option value="₹2,000 – ₹4,999">₹2,000 – ₹4,999</option>
                                <option value="₹5,000 – ₹9,999">₹5,000 – ₹9,999</option>
                                <option value="₹10,000+">₹10,000+</option>
                              </select>
                            </div>
                            <div>
                              <label className="step3-field-label">Monthly supply capacity</label>
                              <select value={onboardingForm.monthlyCapacity} onChange={(e) => setOnboardingForm(prev => ({ ...prev, monthlyCapacity: e.target.value }))} required className="step3-select">
                                <option value="" disabled>Select</option>
                                <option value="Up to 20 pieces">Up to 20 pieces</option>
                                <option value="20 – 50 pieces">20 – 50 pieces</option>
                                <option value="50 – 100 pieces">50 – 100 pieces</option>
                                <option value="100 – 300 pieces">100 – 300 pieces</option>
                                <option value="300+ pieces">300+ pieces</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">Fabric / weave specialisation <span>(e.g. Katan silk, Georgette, Organza, Chanderi)</span></label>
                            <input type="text" value={onboardingForm.fabricSpecialisation} onChange={(e) => setOnboardingForm(prev => ({ ...prev, fabricSpecialisation: e.target.value }))} placeholder="Describe your specialisation" required className="step3-input" />
                          </div>
                        </div>
                      </div>

                      {/* Section D: Dispatch & Operations */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-truck-delivery" aria-hidden="true"></i>
                          <span className="step3-section-title">D. Dispatch & operations</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Dispatch timeline after order</label>
                              <select value={onboardingForm.dispatchTimeline} onChange={(e) => setOnboardingForm(prev => ({ ...prev, dispatchTimeline: e.target.value }))} required className="step3-select">
                                <option value="" disabled>Select</option>
                                <option value="Same day">Same day</option>
                                <option value="1 business day">1 business day</option>
                                <option value="2 business days">2 business days</option>
                                <option value="3 business days">3 business days</option>
                              </select>
                            </div>
                            <div>
                              <label className="step3-field-label">Preferred courier partner</label>
                              <select value={onboardingForm.preferredCourier} onChange={(e) => setOnboardingForm(prev => ({ ...prev, preferredCourier: e.target.value }))} required className="step3-select">
                                <option value="" disabled>Select</option>
                                <option value="Delhivery">Delhivery</option>
                                <option value="Blue Dart">Blue Dart</option>
                                <option value="DTDC">DTDC</option>
                                <option value="India Post">India Post</option>
                                <option value="Shiprocket">Shiprocket</option>
                                <option value="No preference">No preference</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">Dispatch location (pickup address same as business address?)</label>
                            <div className="step3-grid-2col">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', border: onboardingForm.dispatchAddressSame === 'same' ? '1px solid var(--olive)' : '1px solid rgba(117, 111, 79, 0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', background: onboardingForm.dispatchAddressSame === 'same' ? 'rgba(117, 111, 79, 0.05)' : 'var(--white)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                                <input type="radio" name="dispatch_addr" value="same" checked={onboardingForm.dispatchAddressSame === 'same'} onChange={() => setOnboardingForm(prev => ({ ...prev, dispatchAddressSame: 'same' }))} style={{ accentColor: 'var(--olive)' }} />
                                Yes, same address
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', border: onboardingForm.dispatchAddressSame === 'different' ? '1px solid var(--olive)' : '1px solid rgba(117, 111, 79, 0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', background: onboardingForm.dispatchAddressSame === 'different' ? 'rgba(117, 111, 79, 0.05)' : 'var(--white)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                                <input type="radio" name="dispatch_addr" value="different" checked={onboardingForm.dispatchAddressSame === 'different'} onChange={() => setOnboardingForm(prev => ({ ...prev, dispatchAddressSame: 'different' }))} style={{ accentColor: 'var(--olive)' }} />
                                Different address
                              </label>
                            </div>
                            {onboardingForm.dispatchAddressSame === 'different' && (
                              <div style={{ marginTop: '8px' }}>
                                <input type="text" value={onboardingForm.dispatchAddressDifferent} onChange={(e) => setOnboardingForm(prev => ({ ...prev, dispatchAddressDifferent: e.target.value }))} placeholder="Pickup / dispatch address" required className="step3-input" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section E: Bank Account Details */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-building-bank" aria-hidden="true"></i>
                          <span className="step3-section-title">E. Bank account details</span>
                          <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: 'auto', fontFamily: 'var(--font-body)' }}>For payment disbursement</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Account holder name</label>
                              <input type="text" value={onboardingForm.bankAccountHolder} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankAccountHolder: e.target.value }))} placeholder="As per bank records" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">Bank name</label>
                              <input type="text" value={onboardingForm.bankName} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankName: e.target.value }))} placeholder="e.g. SBI, HDFC, Axis" required className="step3-input" />
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Account number</label>
                              <input type="text" value={onboardingForm.bankAccountNumber} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))} placeholder="Enter account number" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">IFSC code</label>
                              <input type="text" value={onboardingForm.bankIfsc} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankIfsc: e.target.value.toUpperCase().slice(0, 11) }))} placeholder="e.g. SBIN0001234" maxLength={11} required className="step3-input" />
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">UPI ID <span>(optional — for faster payments)</span></label>
                            <input type="text" value={onboardingForm.bankUpi} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankUpi: e.target.value }))} placeholder="yourname@upi" className="step3-input" />
                          </div>
                          <div className="step3-info-box">
                            <p className="step3-info-text">
                              <i className="ti ti-info-circle" aria-hidden="true"></i>
                              Weave 365 is not responsible for payment failures due to incorrect bank details. Please double-check before submitting.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section F: Identity Verification */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-id-badge" aria-hidden="true"></i>
                          <span className="step3-section-title">F. Identity verification</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">Aadhaar number</label>
                              <input type="text" value={onboardingForm.aadhaar} onChange={(e) => setOnboardingForm(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) }))} placeholder="XXXX XXXX XXXX" maxLength="12" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">PAN number</label>
                              <input type="text" value={onboardingForm.panNumberVerify} onChange={(e) => setOnboardingForm(prev => ({ ...prev, panNumberVerify: e.target.value.toUpperCase().slice(0, 10) }))} placeholder="AAAAA0000A" maxLength="10" required className="step3-input" />
                            </div>
                          </div>
                          
                          {/* File upload visual selector box */}
                          <div className="step3-upload-grid">
                            <div 
                              className="step3-upload-card"
                              style={{ borderColor: onboardingForm.idProof ? 'var(--olive)' : 'rgba(117, 111, 79, 0.3)' }}
                              onClick={() => idProofRef.current && idProofRef.current.click()}
                            >
                              <input 
                                type="file" 
                                ref={idProofRef} 
                                style={{ display: 'none' }} 
                                accept="image/*,application/pdf"
                                onChange={(e) => handleOnboardingFileChange(e.target.files[0], 'idProof')}
                              />
                              <i className="ti ti-photo-up step3-upload-icon" aria-hidden="true" style={{ color: onboardingForm.idProof ? 'var(--olive)' : 'var(--muted)' }}></i>
                              <p className={`step3-upload-text ${onboardingForm.idProof ? 'uploaded' : ''}`}>
                                {onboardingForm.idProof ? '✓ Aadhaar Uploaded' : 'Aadhaar / ID proof'}
                              </p>
                              <p className="step3-upload-subtext">JPG or PDF, max 2MB</p>
                            </div>
                            
                            <div 
                              className="step3-upload-card"
                              style={{ borderColor: onboardingForm.cancelledCheque ? 'var(--olive)' : 'rgba(117, 111, 79, 0.3)' }}
                              onClick={() => cancelledChequeRef.current && cancelledChequeRef.current.click()}
                            >
                              <input 
                                type="file" 
                                ref={cancelledChequeRef} 
                                style={{ display: 'none' }} 
                                accept="image/*,application/pdf"
                                onChange={(e) => handleOnboardingFileChange(e.target.files[0], 'cancelledCheque')}
                              />
                              <i className="ti ti-photo-up step3-upload-icon" aria-hidden="true" style={{ color: onboardingForm.cancelledCheque ? 'var(--olive)' : 'var(--muted)' }}></i>
                              <p className={`step3-upload-text ${onboardingForm.cancelledCheque ? 'uploaded' : ''}`}>
                                {onboardingForm.cancelledCheque ? '✓ Cheque Uploaded' : 'Cancelled cheque'}
                              </p>
                              <p className="step3-upload-subtext">JPG or PDF, max 2MB</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {onboardingError && (
                      <div className="vendor-form-error" role="alert" style={{ marginTop: '16px' }}>
                        <AlertCircle size={18} />
                        <span>{onboardingError}</span>
                      </div>
                    )}

                    <div className="step3-agreement-box">
                      <label className="step3-agreement-label">
                        <input type="checkbox" checked={onboardingForm.agreement} onChange={(e) => setOnboardingForm(prev => ({ ...prev, agreement: e.target.checked }))} className="step3-agreement-checkbox" />
                        <span className="step3-agreement-text">
                          I confirm that all information provided is accurate. I have read and agreed to the payment terms and return policy (Step 2) and understand that false information may result in permanent delisting.
                        </span>
                      </label>
                    </div>

                    <button type="submit" className="onboarding-submit-button" disabled={onboardingSubmitting} style={{ marginTop: '20px' }}>
                      {onboardingSubmitting ? (
                        <>
                          <RefreshCw size={18} className="spinner" />
                          Submitting Onboarding Form...
                        </>
                      ) : (
                        'Submit onboarding form →'
                      )}
                    </button>

                    <p className="onboarding-step-footer" style={{ marginTop: '14px' }}>Account activation takes 3–5 business days after document verification.</p>
                  </div>
                </form>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
