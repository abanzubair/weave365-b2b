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
import { translations } from '../data/vendorTranslations.js';
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
  Image as ImageIcon,
  Languages
} from 'lucide-react';
import artisanImage from '../../assets/artisan_at_loom_premium.webp';
import { assetSrc } from '../utils/assetSrc.js';
import SliderCaptcha from '../components/SliderCaptcha.jsx';

// Global polyfill layer to protect edge runtime client evaluation from process.env reference errors.
if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = { env: {} };
}



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

const acceptedSamples = [
  "https://weave365.in/assets/sample/yes/y01.webp",
  "https://weave365.in/assets/sample/yes/y02.webp",
  "https://weave365.in/assets/sample/yes/y03.webp",
  "https://weave365.in/assets/sample/yes/y04.webp",
  "https://weave365.in/assets/sample/yes/y05.webp",
  "https://weave365.in/assets/sample/yes/y06.webp"
];

const rejectedSamples = [
  "https://weave365.in/assets/sample/no/n01.webp",
  "https://weave365.in/assets/sample/no/n02.webp",
  "https://weave365.in/assets/sample/no/n03.webp",
  "https://weave365.in/assets/sample/no/n04.webp",
  "https://weave365.in/assets/sample/no/n05.webp",
  "https://weave365.in/assets/sample/no/n06.webp",
  "https://weave365.in/assets/sample/no/n07.webp",
  "https://weave365.in/assets/sample/no/n08.webp",
  "https://weave365.in/assets/sample/no/n09.webp",
  "https://weave365.in/assets/sample/no/n10.webp",
  "https://weave365.in/assets/sample/no/n11.webp",
  "https://weave365.in/assets/sample/no/n12.webp",
  "https://weave365.in/assets/sample/no/n13.webp",
  "https://weave365.in/assets/sample/no/n14.webp",
  "https://weave365.in/assets/sample/no/n15.webp",
  "https://weave365.in/assets/sample/no/n16.webp",
  "https://weave365.in/assets/sample/no/n17.webp",
  "https://weave365.in/assets/sample/no/n18.webp",
  "https://weave365.in/assets/sample/no/n19.webp",
  "https://weave365.in/assets/sample/no/n20.webp",
  "https://weave365.in/assets/sample/no/n21.webp",
  "https://weave365.in/assets/sample/no/n22.webp",
  "https://weave365.in/assets/sample/no/n23.webp",
  "https://weave365.in/assets/sample/no/n24.webp",
  "https://weave365.in/assets/sample/no/n25.webp",
  "https://weave365.in/assets/sample/no/n26.webp",
  "https://weave365.in/assets/sample/no/n27.webp",
  "https://weave365.in/assets/sample/no/n28.webp",
  "https://weave365.in/assets/sample/no/n29.webp",
  "https://weave365.in/assets/sample/no/n30.webp",
  "https://weave365.in/assets/sample/no/n31.webp",
  "https://weave365.in/assets/sample/no/n32.webp",
  "https://weave365.in/assets/sample/no/n33.webp",
  "https://weave365.in/assets/sample/no/n34.webp",
  "https://weave365.in/assets/sample/no/n35.webp",
  "https://weave365.in/assets/sample/no/n36.webp",
  "https://weave365.in/assets/sample/no/n37.webp",
  "https://weave365.in/assets/sample/no/n38.webp",
  "https://weave365.in/assets/sample/no/n39.webp",
  "https://weave365.in/assets/sample/no/n40.webp",
  "https://weave365.in/assets/sample/no/n41.webp",
  "https://weave365.in/assets/sample/no/n42.webp",
  "https://weave365.in/assets/sample/no/n43.webp",
  "https://weave365.in/assets/sample/no/n44.webp",
  "https://weave365.in/assets/sample/no/n45.webp",
  "https://weave365.in/assets/sample/no/n46.webp",
  "https://weave365.in/assets/sample/no/n47.webp",
  "https://weave365.in/assets/sample/no/n48.webp",
  "https://weave365.in/assets/sample/no/n49.webp",
  "https://weave365.in/assets/sample/no/n50.webp"
];

// Convert File object to Base64 String
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Handle Drag Over event
const handleDragOver = (e) => {
  e.preventDefault();
};

export function TrustedPartnerRegistrationPage() {
  const heroImage = assetSrc(artisanImage);
  
  // Language state & helper
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('weave365_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const [activeGuidelinesModal, setActiveGuidelinesModal] = useState(null); // 'accepted' | 'not-accepted' | null

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  useEffect(() => {
    try {
      localStorage.setItem('weave365_lang', lang);
    } catch (e) {
      console.warn('Failed to save language choice in localStorage:', e);
    }
  }, [lang]);
  
  // Tab states
  const [activeTab, setActiveTab] = useState('product-review'); // 'product-review', 'payment-terms', or 'onboarding'
  
  // Tab 1: Product Review Form State
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
  const reviewErrorRef = useRef(null);

  useEffect(() => {
    if (reviewError && reviewErrorRef.current) {
      reviewErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      reviewErrorRef.current.focus();
    }
  }, [reviewError]);
  
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
  
  // Agreement Download Modal States
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pendingAgreementDocHtml, setPendingAgreementDocHtml] = useState('');
  const [pendingWhatsapp, setPendingWhatsapp] = useState('');
  const [pendingVendorName, setPendingVendorName] = useState('');
  const [pendingDate, setPendingDate] = useState('');
  
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
  
  // Captcha verification states
  const [isReviewCaptchaVerified, setIsReviewCaptchaVerified] = useState(false);
  const [isUnlockCaptchaVerified, setIsUnlockCaptchaVerified] = useState(false);
  const [isPaymentCaptchaVerified, setIsPaymentCaptchaVerified] = useState(false);
  const [isOnboardingCaptchaVerified, setIsOnboardingCaptchaVerified] = useState(false);
  
  // Reset captchas when activeTab changes
  useEffect(() => {
    setIsReviewCaptchaVerified(false);
    setIsUnlockCaptchaVerified(false);
    setIsPaymentCaptchaVerified(false);
    setIsOnboardingCaptchaVerified(false);
  }, [activeTab]);

  // Handle escape key and background scroll lock for guidelines modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveGuidelinesModal(null);
      }
    };
    if (activeGuidelinesModal) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeGuidelinesModal]);
  
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



  // Handle selected image slot update
  const handleImageChange = async (file, index) => {
    setReviewError('');
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setReviewError('Please select a valid image file.');
      return;
    }
    
    // Strict <2MB validation
    if (file.size > 2 * 1024 * 1024) {
      setReviewError(`Image in slot ${index + 1} exceeds 2MB limit. Please compress or choose a smaller file.`);
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
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const handlePaymentTermsSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

    const cleanWhatsapp = String(unlockMobile || reviewForm.whatsapp || '').trim().replace(/\D/g, '').slice(-10);
    if (cleanWhatsapp.length !== 10) {
      setPaymentError('Registered mobile/WhatsApp number not found. Please complete Step 1 first.');
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

    // Stage modal with details
    setPendingAgreementDocHtml(docHtml);
    setPendingWhatsapp(cleanWhatsapp);
    setPendingVendorName(vendorName);
    setPendingDate(date);
    setShowDownloadModal(true);
  };

  const handleExecuteAgreementDownload = async () => {
    if (!pendingAgreementDocHtml || !pendingWhatsapp) return;

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setPaymentSubmitting(true);
    setPaymentError('');

    // 1. Download HTML document copy locally
    try {
      const blob = new Blob([pendingAgreementDocHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Weave365_Signed_Agreement_${pendingWhatsapp}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Failed to download copy locally:', err);
    }

    // 2. Prepare Base64 payload of the agreement document to upload
    const base64Doc = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(pendingAgreementDocHtml)));

    // 3. Post to API to secure and upload this signed legal document to Supabase
    try {
      const response = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'submit_agreement',
          whatsapp: pendingWhatsapp,
          vendorName: pendingVendorName,
          date: pendingDate,
          agreementDoc: base64Doc
        })
      });

      const resData = await response.json();
      if (response.ok && resData.status === 'success') {
        try {
          localStorage.setItem('weave365_payment_terms_agreed', 'true');
          localStorage.setItem('weave365_payment_vendor_name', pendingVendorName);
          localStorage.setItem('weave365_payment_agreement_date', pendingDate);
        } catch (err) {
          console.warn('LocalStorage save skipped:', err);
        }

        setIsPaymentTermsAgreed(true);
        setShowDownloadModal(false);
        setActiveTab('onboarding');
      } else {
        setPaymentError(resData.error || 'Failed to register your agreement. Please verify connection.');
        setShowDownloadModal(false);
      }
    } catch (err) {
      console.error('Failed to submit agreement:', err);
      setPaymentError('Connection error occurred while registering terms. Please try again.');
      setShowDownloadModal(false);
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
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    setIsReviewCaptchaVerified(false);
    setIsUnlockCaptchaVerified(false);
    setIsPaymentCaptchaVerified(false);
    setIsOnboardingCaptchaVerified(false);
  };

  return (
    <div className={`trusted-registration-page ${lang === 'hi' ? 'lang-hi' : ''}`}>
      <section className="trusted-registration-hero" aria-labelledby="trusted-registration-heading">
        <img src={heroImage} alt="Weaver preparing textile products for Weave 365" width={1920} height={400} loading="lazy" decoding="async" />
        <div className="trusted-registration-hero-content">
          <h1 id="trusted-registration-heading">{t('heroTitleText')}</h1>
          <p>{t('heroDescText')}</p>
        </div>
      </section>

      <section className="vendor-onboarding-section trusted-registration-section" id="trusted-partner-registration">
        <div className="vendor-onboarding-shell">
          <aside className="vendor-onboarding-aside" aria-label={t('verificationOnboarding')}>
            <div className="vendor-aside-header">
              <ShieldCheck className="vendor-aside-icon" size={32} />
              <h2>{t('verificationOnboarding')}</h2>
            </div>
            <p>{t('asideDesc')}</p>

            <div className="vendor-approval-flow">
              {approvalSteps.map((step, index) => (
                <div className="vendor-approval-step" key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{t('step' + String(index + 1).padStart(2, '0'))}</strong>
                </div>
              ))}
            </div>

            <div className="vendor-quality-note">
              <BadgeCheck size={20} />
              <p>{t('noInstantSelfService')}</p>
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
                {t('tab1Submit')}
              </button>
              <button 
                type="button"
                className={`vendor-tab-btn ${activeTab === 'payment-terms' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment-terms')}
              >
                {!isProfileUnlocked && <Lock size={14} className="tab-lock-icon" />}
                {isProfileUnlocked && <Unlock size={14} className="tab-unlock-icon" />}
                {t('tab2Payment')}
              </button>
              <button 
                type="button"
                className={`vendor-tab-btn ${activeTab === 'onboarding' ? 'active' : ''}`}
                onClick={() => setActiveTab('onboarding')}
              >
                {(!isProfileUnlocked || !isPaymentTermsAgreed) && <Lock size={14} className="tab-lock-icon" />}
                {(isProfileUnlocked && isPaymentTermsAgreed) && <Unlock size={14} className="tab-unlock-icon" />}
                {t('tab3Onboarding')}
              </button>
              <button 
                type="button"
                className="vendor-tab-btn translate-toggle-btn"
                onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              >
                <Languages size={16} className="tab-translate-icon" />
                {lang === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
              </button>
            </div>

            {/* TAB 1: PRODUCT REVIEW FORM */}
            {activeTab === 'product-review' && (
              reviewSubmitted ? (
                <div className="vendor-success-card" role="status" aria-live="polite">
                  <CheckCircle2 size={42} />
                  <h2>{t('reviewSubmittedTitle')}</h2>
                  <p>{t('reviewSubmittedDesc')}</p>
                  
                  <div className="status-instructions-note">
                    <p dangerouslySetInnerHTML={{ __html: t('reviewInstruction') }}></p>
                  </div>

                  <button 
                    type="button" 
                    className="vendor-submit-button"
                    onClick={() => setActiveTab('payment-terms')}
                  >
                    {t('goPaymentTermsStatus')}
                  </button>

                  {process.env.NODE_ENV === 'development' && (
                    <button
                      type="button"
                      className="clear-test-cache-link"
                      onClick={handleClearCache}
                    >
                      {t('clearCacheBtn')}
                    </button>
                  )}
                </div>
              ) : (
                <form className="vendor-registration-form" onSubmit={handleReviewSubmit}>
                  <div className="vendor-form-heading">
                    <ClipboardCheck size={24} />
                    <div>
                      <h2>{t('step1Title')}</h2>
                      <p>{t('step1Desc')}</p>
                    </div>
                  </div>

                  <fieldset className="vendor-form-section">
                    <legend>{t('contactInfo')}</legend>
                    <div className="vendor-form-grid">
                      <label>
                        {t('fullName')}
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
                          placeholder={t('fullNamePlaceholder')}
                          required
                        />
                      </label>
                      <label>
                        {t('whatsappNumber')}
                        <input
                          type="tel"
                          value={reviewForm.whatsapp}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setReviewForm((prev) => ({ ...prev, whatsapp: raw }));
                          }}
                          placeholder={t('whatsappPlaceholder')}
                          pattern="[0-9]{10}"
                          inputMode="numeric"
                          title={t('whatsappNumber')}
                          required
                        />
                      </label>
                      <label>
                        {t('city')}
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
                          placeholder={t('cityPlaceholder')}
                          required
                        />
                      </label>
                      <label>
                        {t('pincode')}
                        <input
                          type="text"
                          value={reviewForm.pincode}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setReviewForm((prev) => ({ ...prev, pincode: raw }));
                          }}
                          placeholder={t('pincodePlaceholder')}
                          pattern="\d{6}"
                          inputMode="numeric"
                          title={t('pincode')}
                          required
                        />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="vendor-form-section">
                    <legend>{t('catalogDetails')}</legend>
                    
                    <div className="review-category-group">
                      <span className="group-label">{t('productCategories')}</span>
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
                              <span className="chip-text">{t('cat' + cat.name)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="vendor-form-grid" style={{ marginTop: '16px' }}>
                      <label className="vendor-form-wide">
                        {t('priceRangeLabel')}
                        <select
                          value={reviewForm.priceRange}
                          onChange={(e) => setReviewForm((prev) => ({ ...prev, priceRange: e.target.value }))}
                          required
                        >
                          <option value="">{t('priceRangeSelect')}</option>
                          <option value="Under ₹1,000">{t('priceRangeUnder1k')}</option>
                          <option value="₹1,000 - ₹3,000">{t('priceRange1k3k')}</option>
                          <option value="₹3,000 - ₹5,000">{t('priceRange3k5k')}</option>
                          <option value="₹5,000 - ₹10,000">{t('priceRange5k10k')}</option>
                          <option value="₹10,000+">{t('priceRange10kPlus')}</option>
                        </select>
                      </label>
                    </div>
                  </fieldset>

                  {/* Photo Guidelines Card */}
                  <div className="photo-guidelines-card">
                    <h3>{t('viewPhotoGuidelines')}</h3>
                    <p className="photo-guidelines-subtitle">{t('beforeUploadingDesc')}</p>
                    <div className="guidelines-btn-group">
                      <button
                        type="button"
                        className="guidelines-btn accepted"
                        onClick={() => setActiveGuidelinesModal('sample')}
                      >
                        <ImageIcon size={16} />
                        {t('photoSample')}
                      </button>
                      <button
                        type="button"
                        className="guidelines-btn not-accepted"
                        onClick={() => setActiveGuidelinesModal('context')}
                      >
                        <ClipboardCheck size={16} />
                        {t('photoContext')}
                      </button>
                    </div>
                  </div>

                  <fieldset className="vendor-form-section">
                    <legend>{t('samplePhotos')}</legend>
                    <p className="upload-subtitle">{t('uploadSubtitle')}</p>
                    
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
                              <span className="slot-title">{t('photoSlot')} {index + 1}</span>
                              <span className="slot-helper">{t('dragDrop')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Image specifications guidelines box */}
                    <div className="review-rules-card">
                      <div className="rules-header">
                        <AlertCircle size={18} />
                        <h4>{t('uploadReqs')}</h4>
                      </div>
                      <ul>
                        <li>{t('req1')}</li>
                        <li>{t('req2')}</li>
                        <li>{t('req3')}</li>
                        <li>{t('req4')}</li>
                      </ul>
                    </div>
                  </fieldset>

                  {reviewError && (
                    <div className="onboarding-modal-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', zIndex: 10000 }}>
                      <div className="onboarding-modal-card minimal" style={{ borderColor: 'rgba(139, 47, 47, 0.25)', maxWidth: '380px' }}>
                        <div className="onboarding-modal-body" style={{ padding: '32px 24px' }}>
                          <div 
                            className="onboarding-modal-header-icon" 
                            style={{ 
                              background: 'rgba(139, 47, 47, 0.08)', 
                              color: '#8b2f2f',
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              margin: '0 auto 16px',
                              border: 'none'
                            }}
                          >
                            <AlertCircle size={22} />
                          </div>
                          <h3 style={{ fontSize: '18px', color: '#241912', marginBottom: '8px', fontFamily: "var(--font-heading)" }}>
                            {lang === 'hi' ? 'त्रुटि (Error)' : 'Submission Error'}
                          </h3>
                          <p className="onboarding-modal-message" style={{ fontSize: '13.5px', margin: '0 0 20px', lineHeight: '1.5' }}>
                            {reviewError}
                          </p>
                          <div className="onboarding-modal-actions">
                            <button 
                              type="button" 
                              className="onboarding-modal-btn-download" 
                              style={{ 
                                background: '#8b2f2f', 
                                boxShadow: '0 4px 12px rgba(139, 47, 47, 0.15)',
                                padding: '10px 20px',
                                fontSize: '13px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                border: 'none',
                                color: '#ffffff',
                                width: '100%',
                                display: 'inline-flex',
                                justifyContent: 'center'
                              }}
                              onClick={() => setReviewError('')}
                            >
                              {lang === 'hi' ? 'ठीक है' : 'Dismiss'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="vendor-agreement">
                    <input
                      type="checkbox"
                      checked={reviewForm.agreement}
                      onChange={(e) => setReviewForm((prev) => ({ ...prev, agreement: e.target.checked }))}
                      required
                    />
                    {t('confirmPhotosAuth')}
                  </label>

                  <SliderCaptcha onVerify={setIsReviewCaptchaVerified} isReset={activeTab !== 'product-review'} />

                  <button type="submit" className="vendor-submit-button" disabled={reviewSubmitting || !isReviewCaptchaVerified}>
                    {reviewSubmitting ? (
                      <>
                        <RefreshCw size={18} className="spinner" />
                        {t('uploadingCatalogs')}
                      </>
                    ) : (
                      t('submitReviewBtn')
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
                    <h2>{t('paymentTermsLocked')}</h2>
                    <p className="lock-desc">{t('paymentLockedDesc')}</p>

                    <form className="status-check-card" onSubmit={verifyAndUnlockProfile}>
                      <h3>{t('checkVerificationStatus')}</h3>
                      <div className="status-input-group">
                        <input
                          type="tel"
                          value={unlockMobile}
                          onChange={(e) => setUnlockMobile(e.target.value)}
                          placeholder={t('enterWhatsappPlaceholder')}
                          required
                        />
                        <button type="submit" className="status-verify-btn" disabled={isVerifyingUnlock || !isUnlockCaptchaVerified}>
                          {isVerifyingUnlock ? t('checking') : t('checkStatusBtn')}
                        </button>
                      </div>
                      <SliderCaptcha onVerify={setIsUnlockCaptchaVerified} isReset={activeTab !== 'payment-terms' || isProfileUnlocked} />
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
                        {t('clearCacheBtn')}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePaymentTermsSubmit}>
                  <h2 className="sr-only">{t('paymentTermsReturnPolicy')}</h2>

                  <div className="onboarding-step-wrapper">
                    <div>
                      <span className="onboarding-step-meta">
                        {t('step2of3')}
                      </span>
                      <h3 className="onboarding-step-title">
                        {t('paymentTermsReturnPolicy')}
                      </h3>
                      <p className="onboarding-step-desc">
                        {t('step2Desc')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem' }}>
                      {/* Section A: Payment Terms */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-currency-rupee" aria-hidden="true"></i>
                          <span>{t('secAPaymentTerms')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('a1Title')}</p>
                              <p className="onboarding-clause-desc">{t('a1Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('a2Title')}</p>
                              <p className="onboarding-clause-desc">{t('a2Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('a3Title')}</p>
                              <p className="onboarding-clause-desc">{t('a3Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a4} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a4: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('a4Title')}</p>
                              <p className="onboarding-clause-desc">{t('a4Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.a5} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, a5: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('a5Title')}</p>
                              <p className="onboarding-clause-desc">{t('a5Desc')}</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Section B: Return Policy */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-arrow-back-up" aria-hidden="true"></i>
                          <span>{t('secBReturnPolicy')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('b1Title')}</p>
                              <p className="onboarding-clause-desc">{t('b1Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('b2Title')}</p>
                              <p className="onboarding-clause-desc">{t('b2Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('b3Title')}</p>
                              <p className="onboarding-clause-desc">{t('b3Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b4} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b4: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('b4Title')}</p>
                              <p className="onboarding-clause-desc">{t('b4Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.b5} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, b5: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('b5Title')}</p>
                              <p className="onboarding-clause-desc">{t('b5Desc')}</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Section C: Product & Listing Standards */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-shield-check" aria-hidden="true"></i>
                          <span>{t('secCListingStandards')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.c1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, c1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('c1Title')}</p>
                              <p className="onboarding-clause-desc">{t('c1Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.c2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, c2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('c2Title')}</p>
                              <p className="onboarding-clause-desc">{t('c2Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.c3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, c3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('c3Title')}</p>
                              <p className="onboarding-clause-desc">{t('c3Desc')}</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Section D: General Terms */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-gavel" aria-hidden="true"></i>
                          <span>{t('secDGeneralTerms')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.d1} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, d1: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('d1Title')}</p>
                              <p className="onboarding-clause-desc">{t('d1Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.d2} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, d2: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('d2Title')}</p>
                              <p className="onboarding-clause-desc">{t('d2Desc')}</p>
                            </div>
                          </label>
                          <label className="onboarding-clause-label">
                            <input type="checkbox" checked={paymentAgreement.d3} onChange={(e) => setPaymentAgreement(prev => ({ ...prev, d3: e.target.checked, agreeAll: false }))} className="onboarding-clause-checkbox" />
                            <div>
                              <p className="onboarding-clause-title">{t('d3Title')}</p>
                              <p className="onboarding-clause-desc">{t('d3Desc')}</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="onboarding-agree-all-box">
                      <label className="onboarding-agree-all-label">
                        <input type="checkbox" id="agreeAll" checked={paymentAgreement.agreeAll} onChange={(e) => handleAgreeAllChange(e.target.checked)} className="onboarding-agree-all-checkbox" />
                        <span className="onboarding-agree-all-text">
                          {t('agreeAllCheck')}
                        </span>
                      </label>
                    </div>

                    <div className="onboarding-signature-grid">
                      <div className="onboarding-signature-field">
                        <label className="onboarding-signature-label">{t('vendorFullNameLabel')}</label>
                        <input 
                          type="text" 
                          value={paymentAgreement.vendorName} 
                          onChange={(e) => setPaymentAgreement(prev => ({ ...prev, vendorName: e.target.value }))} 
                          placeholder={t('asPerIdProof')} 
                          required 
                          className="onboarding-signature-input"
                        />
                      </div>
                      <div className="onboarding-signature-field">
                        <label className="onboarding-signature-label">{t('dateOfSubmission')}</label>
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
                      <div className="onboarding-modal-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', zIndex: 10000 }}>
                        <div className="onboarding-modal-card minimal" style={{ borderColor: 'rgba(139, 47, 47, 0.25)', maxWidth: '380px' }}>
                          <div className="onboarding-modal-body" style={{ padding: '32px 24px' }}>
                            <div 
                              className="onboarding-modal-header-icon" 
                              style={{ 
                                background: 'rgba(139, 47, 47, 0.08)', 
                                color: '#8b2f2f',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                margin: '0 auto 16px',
                                border: 'none'
                              }}
                            >
                              <AlertCircle size={22} />
                            </div>
                            <h3 style={{ fontSize: '18px', color: '#241912', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                              {lang === 'hi' ? 'त्रुटि (Error)' : 'Submission Error'}
                            </h3>
                            <p className="onboarding-modal-message" style={{ fontSize: '13.5px', margin: '0 0 20px', lineHeight: '1.5' }}>
                              {paymentError}
                            </p>
                            <div className="onboarding-modal-actions">
                              <button 
                                type="button" 
                                className="onboarding-modal-btn-download" 
                                style={{ 
                                  background: '#8b2f2f', 
                                  boxShadow: '0 4px 12px rgba(139, 47, 47, 0.15)',
                                  padding: '10px 20px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: 'none',
                                  color: '#ffffff',
                                  width: '100%',
                                  display: 'inline-flex',
                                  justifyContent: 'center'
                                }}
                                onClick={() => setPaymentError('')}
                              >
                                {lang === 'hi' ? 'ठीक है' : 'Dismiss'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <SliderCaptcha onVerify={setIsPaymentCaptchaVerified} isReset={activeTab !== 'payment-terms' || isPaymentTermsAgreed} />

                    <button type="submit" className="onboarding-submit-button" disabled={paymentSubmitting || !isPaymentCaptchaVerified}>
                      {paymentSubmitting ? (
                        <>
                          <RefreshCw size={18} className="spinner" />
                          {t('registeringAgreement')}
                        </>
                      ) : (
                        t('agreeAndProceedBtn')
                      )}
                    </button>

                    <p className="onboarding-step-footer">{t('step2Footer')}</p>
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
                    <h2>{t('onboardingLocked')}</h2>
                    <p className="lock-desc">{t('onboardingLockedDesc')}</p>

                    <form className="status-check-card" onSubmit={verifyAndUnlockProfile}>
                      <h3>{t('checkVerificationStatus')}</h3>
                      <div className="status-input-group">
                        <input
                          type="tel"
                          value={unlockMobile}
                          onChange={(e) => setUnlockMobile(e.target.value)}
                          placeholder={t('enterWhatsappPlaceholder')}
                          required
                        />
                        <button type="submit" className="status-verify-btn" disabled={isVerifyingUnlock}>
                          {isVerifyingUnlock ? t('checking') : t('checkStatusBtn')}
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
                        {t('clearCacheBtn')}
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
                    <h2>{t('paymentTermsRequired')}</h2>
                    <p className="lock-desc">{t('paymentTermsReqDesc')}</p>
                    <button 
                      type="button" 
                      className="vendor-submit-button"
                      onClick={() => setActiveTab('payment-terms')}
                      style={{ marginTop: '16px' }}
                    >
                      {t('goReviewPaymentTermsBtn')}
                    </button>
                  </div>
                </div>
              ) : submitted ? (
                <div className="vendor-success-card" role="status" aria-live="polite">
                  <CheckCircle2 size={42} />
                  <h2>{t('onboardingSuccessTitle')}</h2>
                  <p>{t('onboardingSuccessDesc')}</p>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>{t('onboardingSuccessSub')}</p>

                  {process.env.NODE_ENV === 'development' && (
                    <button
                      type="button"
                      className="clear-test-cache-link"
                      onClick={handleClearCache}
                      style={{ marginTop: '24px' }}
                    >
                      {t('clearCacheBtn')}
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleOnboardingSubmit} className="vendor-registration-form">
                  <h2 className="sr-only">{t('onboardingFormTitle')}</h2>

                  <div className="onboarding-step-wrapper">
                    <div>
                      <span className="step3-meta">
                        {t('step3of3')}
                      </span>
                      <h3 className="step3-title">
                        {t('onboardingFormTitle')}
                      </h3>
                      <p className="step3-desc">
                        {t('onboardingFormDesc')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Section A: Personal Details */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-user-circle" aria-hidden="true"></i>
                          <span className="step3-section-title">{t('secAPersonalDetails')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('fullNameLabel')}</label>
                              <input type="text" value={onboardingForm.fullName} onChange={(e) => setOnboardingForm(prev => ({ ...prev, fullName: e.target.value }))} placeholder={t('asPerAadhaarPan')} required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">{t('whatsappLabel')}</label>
                              <div className="tel-input-container">
                                <span className="tel-input-prefix">+91</span>
                                <input 
                                  type="tel" 
                                  value={onboardingForm.whatsapp} 
                                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                                  placeholder={t('whatsappPlaceholder')} 
                                  required 
                                  className="tel-input-field" 
                                />
                              </div>
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('emailLabel')}</label>
                              <input type="email" value={onboardingForm.email} onChange={(e) => setOnboardingForm(prev => ({ ...prev, email: e.target.value }))} placeholder="your@email.com" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">{t('altContactLabel')}</label>
                              <div className="tel-input-container">
                                <span className="tel-input-prefix">+91</span>
                                <input 
                                  type="tel" 
                                  value={onboardingForm.alternateContact} 
                                  onChange={(e) => setOnboardingForm(prev => ({ ...prev, alternateContact: e.target.value.replace(/\D/g, '').slice(0, 10) }))} 
                                  placeholder={t('whatsappPlaceholder')} 
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
                          <span className="step3-section-title">{t('secBBusinessDetails')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('businessShopName')}</label>
                              <input type="text" value={onboardingForm.businessName} onChange={(e) => setOnboardingForm(prev => ({ ...prev, businessName: e.target.value }))} placeholder={t('tradeNamePlaceholder')} required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">{t('businessTypeLabel')}</label>
                              <select value={onboardingForm.businessType} onChange={(e) => setOnboardingForm(prev => ({ ...prev, businessType: e.target.value }))} required className="step3-select">
                                <option value="" disabled>{t('businessTypeSelect')}</option>
                                <option value="Weaver">{t('businessTypeOpt1')}</option>
                                <option value="Master Weaver">{t('businessTypeOpt2')}</option>
                                <option value="Manufacturer">{t('businessTypeOpt3')}</option>
                                <option value="Wholesaler">{t('businessTypeOpt4')}</option>
                                <option value="Retailer">{t('businessTypeOpt5')}</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">{t('businessAddressLabel')}</label>
                            <input type="text" value={onboardingForm.businessAddress} onChange={(e) => setOnboardingForm(prev => ({ ...prev, businessAddress: e.target.value }))} placeholder={t('shopUnitAddressPlaceholder')} required className="step3-input" style={{ marginBottom: '8px' }} />
                            <div className="step3-grid-3col">
                              <input type="text" value={onboardingForm.city} onChange={(e) => setOnboardingForm(prev => ({ ...prev, city: e.target.value }))} placeholder={t('cityPlaceholderStep3')} required className="step3-input" />
                              <input type="text" value={onboardingForm.pincode} onChange={(e) => setOnboardingForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder={t('pincodePlaceholderStep3')} maxLength="6" required className="step3-input" />
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('gstLabelStep3')}</label>
                              <input type="text" value={onboardingForm.gstNumber} onChange={(e) => setOnboardingForm(prev => ({ ...prev, gstNumber: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">{t('panLabelStep3')}</label>
                              <input type="text" value={onboardingForm.panNumber} onChange={(e) => setOnboardingForm(prev => ({ ...prev, panNumber: e.target.value.toUpperCase().slice(0, 10) }))} placeholder="AAAAA0000A" maxLength="10" className="step3-input" />
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">{t('yearsInBusinessLabel')}</label>
                            <select value={onboardingForm.yearsInBusiness} onChange={(e) => setOnboardingForm(prev => ({ ...prev, yearsInBusiness: e.target.value }))} required className="step3-select">
                              <option value="" disabled>{t('yearsSelectPlaceholder')}</option>
                              <option value="Less than 1 year">{t('yearsOpt1')}</option>
                              <option value="1 – 3 years">{t('yearsOpt2')}</option>
                              <option value="3 – 7 years">{t('yearsOpt3')}</option>
                              <option value="7 – 15 years">{t('yearsOpt4')}</option>
                              <option value="15+ years">{t('yearsOpt5')}</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section C: Product Details */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-hanger" aria-hidden="true"></i>
                          <span className="step3-section-title">{t('secCProductDetailsStep3')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div>
                            <label className="step3-field-label">{t('categoriesStep3Label')}</label>
                            <div className="step3-categories-grid">
                              {[
                                { name: 'Sarees', icon: 'ti-flower', key: 'catSarees' },
                                { name: 'Suits', icon: 'ti-shirt', key: 'catSuits' },
                                { name: 'Dupattas', icon: 'ti-scissors', key: 'catDupattas' },
                                { name: 'Lehengas', icon: 'ti-hanger', key: 'catLehengas' },
                                { name: 'Fabrics', icon: 'ti-palette', key: 'catFabrics' },
                                { name: 'Accessories', icon: 'ti-sparkles', key: 'catAccessoriesPlural' }
                              ].map((cat) => (
                                <label key={cat.name} className="step3-category-card">
                                  <input type="checkbox" checked={onboardingForm.productCategories.includes(cat.name)} onChange={() => toggleOnboardingCategory(cat.name)} />
                                  <i className={`ti ${cat.icon}`} aria-hidden="true"></i> {t(cat.key)}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('pricePerPiece')}</label>
                              <select value={onboardingForm.priceRange} onChange={(e) => setOnboardingForm(prev => ({ ...prev, priceRange: e.target.value }))} required className="step3-select">
                                <option value="" disabled>{t('priceOptSelect')}</option>
                                <option value="Under ₹500">{t('priceOptUnder500')}</option>
                                <option value="₹500 – ₹999">{t('priceOpt500_999')}</option>
                                <option value="₹1,000 – ₹1,999">{t('priceOpt1000_1999')}</option>
                                <option value="₹2,000 – ₹4,999">{t('priceOpt2000_4999')}</option>
                                <option value="₹5,000 – ₹9,999">{t('priceOpt5000_9999')}</option>
                                <option value="₹10,000+">{t('priceOpt10000Plus')}</option>
                              </select>
                            </div>
                            <div>
                              <label className="step3-field-label">{t('monthlyCapacityStep3')}</label>
                              <select value={onboardingForm.monthlyCapacity} onChange={(e) => setOnboardingForm(prev => ({ ...prev, monthlyCapacity: e.target.value }))} required className="step3-select">
                                <option value="" disabled>{t('priceOptSelect')}</option>
                                <option value="Up to 20 pieces">{t('monthlyOpt1')}</option>
                                <option value="20 – 50 pieces">{t('monthlyOpt2')}</option>
                                <option value="50 – 100 pieces">{t('monthlyOpt3')}</option>
                                <option value="100 – 300 pieces">{t('monthlyOpt4')}</option>
                                <option value="300+ pieces">{t('monthlyOpt5')}</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">{t('fabricSpecialisation')}</label>
                            <input type="text" value={onboardingForm.fabricSpecialisation} onChange={(e) => setOnboardingForm(prev => ({ ...prev, fabricSpecialisation: e.target.value }))} placeholder={t('specialisationPlaceholder')} className="step3-input" />
                          </div>
                        </div>
                      </div>

                      {/* Section D: Dispatch & Operations */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-truck-delivery" aria-hidden="true"></i>
                          <span className="step3-section-title">{t('secDDispatchOps')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('dispatchTimelineLabel')}</label>
                              <select value={onboardingForm.dispatchTimeline} onChange={(e) => setOnboardingForm(prev => ({ ...prev, dispatchTimeline: e.target.value }))} required className="step3-select">
                                <option value="" disabled>{t('dispatchOptSelect')}</option>
                                <option value="Same day">{t('dispatchOpt1')}</option>
                                <option value="1 business day">{t('dispatchOpt2')}</option>
                                <option value="2 business days">{t('dispatchOpt3')}</option>
                                <option value="3 business days">{t('dispatchOpt4')}</option>
                              </select>
                            </div>
                            <div>
                              <label className="step3-field-label">{t('preferredCourierLabel')}</label>
                              <select value={onboardingForm.preferredCourier} onChange={(e) => setOnboardingForm(prev => ({ ...prev, preferredCourier: e.target.value }))} required className="step3-select">
                                <option value="" disabled>{t('courierOptSelect')}</option>
                                <option value="Delhivery">{t('courierOpt1')}</option>
                                <option value="Blue Dart">{t('courierOpt2')}</option>
                                <option value="DTDC">{t('courierOpt3')}</option>
                                <option value="India Post">{t('courierOpt4')}</option>
                                <option value="Shiprocket">{t('courierOpt5')}</option>
                                <option value="No preference">{t('courierOpt6')}</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">{t('dispatchLocationRadio')}</label>
                            <div className="step3-grid-2col">
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', border: onboardingForm.dispatchAddressSame === 'same' ? '1px solid var(--olive)' : '1px solid rgba(117, 111, 79, 0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', background: onboardingForm.dispatchAddressSame === 'same' ? 'rgba(117, 111, 79, 0.05)' : 'var(--white)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                                <input type="radio" name="dispatch_addr" value="same" checked={onboardingForm.dispatchAddressSame === 'same'} onChange={() => setOnboardingForm(prev => ({ ...prev, dispatchAddressSame: 'same' }))} style={{ accentColor: 'var(--olive)' }} />
                                {t('yesSameAddress')}
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', border: onboardingForm.dispatchAddressSame === 'different' ? '1px solid var(--olive)' : '1px solid rgba(117, 111, 79, 0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', background: onboardingForm.dispatchAddressSame === 'different' ? 'rgba(117, 111, 79, 0.05)' : 'var(--white)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                                <input type="radio" name="dispatch_addr" value="different" checked={onboardingForm.dispatchAddressSame === 'different'} onChange={() => setOnboardingForm(prev => ({ ...prev, dispatchAddressSame: 'different' }))} style={{ accentColor: 'var(--olive)' }} />
                                {t('differentAddress')}
                              </label>
                            </div>
                            {onboardingForm.dispatchAddressSame === 'different' && (
                              <div style={{ marginTop: '8px' }}>
                                <input type="text" value={onboardingForm.dispatchAddressDifferent} onChange={(e) => setOnboardingForm(prev => ({ ...prev, dispatchAddressDifferent: e.target.value }))} placeholder={t('pickupAddressPlaceholder')} required className="step3-input" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section E: Bank Account Details */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-building-bank" aria-hidden="true"></i>
                          <span className="step3-section-title">{t('secEBankDetails')}</span>
                          <span style={{ fontSize: '12px', color: 'var(--muted)', marginLeft: 'auto', fontFamily: 'var(--font-body)' }}>{t('forPaymentDisbursal')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('accountHolderName')}</label>
                              <input type="text" value={onboardingForm.bankAccountHolder} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankAccountHolder: e.target.value }))} placeholder={t('asPerBankRecords')} required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">{t('bankNameLabel')}</label>
                              <input type="text" value={onboardingForm.bankName} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankName: e.target.value }))} placeholder={t('bankNamePlaceholder')} required className="step3-input" />
                            </div>
                          </div>
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('accountNumberLabel')}</label>
                              <input type="text" value={onboardingForm.bankAccountNumber} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))} placeholder={t('accountNumberPlaceholder')} required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">{t('ifscLabel')}</label>
                              <input type="text" value={onboardingForm.bankIfsc} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankIfsc: e.target.value.toUpperCase().slice(0, 11) }))} placeholder={t('ifscPlaceholder')} maxLength={11} required className="step3-input" />
                            </div>
                          </div>
                          <div>
                            <label className="step3-field-label">{t('upiLabel')}</label>
                            <input type="text" value={onboardingForm.bankUpi} onChange={(e) => setOnboardingForm(prev => ({ ...prev, bankUpi: e.target.value }))} placeholder={t('upiPlaceholder')} className="step3-input" />
                          </div>
                          <div className="step3-info-box">
                            <p className="step3-info-text">
                              <i className="ti ti-info-circle" aria-hidden="true"></i>
                              {t('bankInfoText')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section F: Identity Verification */}
                      <div className="onboarding-section-box">
                        <div className="onboarding-section-header">
                          <i className="ti ti-id-badge" aria-hidden="true"></i>
                          <span className="step3-section-title">{t('secFIdentityVerification')}</span>
                        </div>
                        <div className="onboarding-section-body">
                          <div className="step3-grid-2col">
                            <div>
                              <label className="step3-field-label">{t('aadhaarLabel')}</label>
                              <input type="text" value={onboardingForm.aadhaar} onChange={(e) => setOnboardingForm(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, '').slice(0, 12) }))} placeholder={t('aadhaarPlaceholder')} maxLength="12" required className="step3-input" />
                            </div>
                            <div>
                              <label className="step3-field-label">{t('panVerifyLabel')}</label>
                              <input type="text" value={onboardingForm.panNumberVerify} onChange={(e) => setOnboardingForm(prev => ({ ...prev, panNumberVerify: e.target.value.toUpperCase().slice(0, 10) }))} placeholder={t('panVerifyPlaceholder')} maxLength="10" className="step3-input" />
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
                                {onboardingForm.idProof ? t('uploadedSuccessAadhaar') : t('aadhaarUploadLabel')}
                              </p>
                              <p className="step3-upload-subtext">{t('fileUploadSpecs')}</p>
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
                                {onboardingForm.cancelledCheque ? t('uploadedSuccessCheque') : t('chequeUploadLabel')}
                              </p>
                              <p className="step3-upload-subtext">{t('fileUploadSpecs')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {onboardingError && (
                      <div className="onboarding-modal-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', zIndex: 10000 }}>
                        <div className="onboarding-modal-card minimal" style={{ borderColor: 'rgba(139, 47, 47, 0.25)', maxWidth: '380px' }}>
                          <div className="onboarding-modal-body" style={{ padding: '32px 24px' }}>
                            <div 
                              className="onboarding-modal-header-icon" 
                              style={{ 
                                background: 'rgba(139, 47, 47, 0.08)', 
                                color: '#8b2f2f',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                display: 'grid',
                                placeItems: 'center',
                                margin: '0 auto 16px',
                                border: 'none'
                              }}
                            >
                              <AlertCircle size={22} />
                            </div>
                            <h3 style={{ fontSize: '18px', color: '#241912', marginBottom: '8px', fontFamily: "var(--font-heading)" }}>
                              {lang === 'hi' ? 'त्रुटि (Error)' : 'Submission Error'}
                            </h3>
                            <p className="onboarding-modal-message" style={{ fontSize: '13.5px', margin: '0 0 20px', lineHeight: '1.5' }}>
                              {onboardingError}
                            </p>
                            <div className="onboarding-modal-actions">
                              <button 
                                type="button" 
                                className="onboarding-modal-btn-download" 
                                style={{ 
                                  background: '#8b2f2f', 
                                  boxShadow: '0 4px 12px rgba(139, 47, 47, 0.15)',
                                  padding: '10px 20px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: 'none',
                                  color: '#ffffff',
                                  width: '100%',
                                  display: 'inline-flex',
                                  justifyContent: 'center'
                                }}
                                onClick={() => setOnboardingError('')}
                              >
                                {lang === 'hi' ? 'ठीक है' : 'Dismiss'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="step3-agreement-box">
                      <label className="step3-agreement-label">
                        <input type="checkbox" checked={onboardingForm.agreement} onChange={(e) => setOnboardingForm(prev => ({ ...prev, agreement: e.target.checked }))} className="step3-agreement-checkbox" />
                        <span className="step3-agreement-text">
                          {t('declarationCheckbox')}
                        </span>
                      </label>
                    </div>

                    <SliderCaptcha onVerify={setIsOnboardingCaptchaVerified} isReset={activeTab !== 'onboarding' || submitted} />

                    <button type="submit" className="onboarding-submit-button" disabled={onboardingSubmitting || !isOnboardingCaptchaVerified} style={{ marginTop: '20px' }}>
                      {onboardingSubmitting ? (
                        <>
                          <RefreshCw size={18} className="spinner" />
                          {t('submittingOnboardingForm')}
                        </>
                      ) : (
                        t('submitOnboardingFormBtn')
                      )}
                    </button>

                    <p className="onboarding-step-footer" style={{ marginTop: '14px' }}>{t('step3Footer')}</p>
                  </div>
                </form>
              )
            )}
          </div>
        </div>
      </section>

      {showDownloadModal && (
        <div className="onboarding-modal-overlay">
          <div className="onboarding-modal-card minimal">
            <div className="onboarding-modal-body">
              <div className="onboarding-modal-header-icon">
                <ShieldCheck size={28} />
              </div>
              <h3>{t('agreementSigned')}</h3>
              <p className="onboarding-modal-message">
                {t('agreementSignedDesc')}
              </p>
              <div className="onboarding-modal-actions">
                <button 
                  type="button" 
                  className="onboarding-modal-btn-download"
                  onClick={handleExecuteAgreementDownload}
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? (
                    <>
                      <RefreshCw size={16} className="spinner" />
                      {t('savingDownloading')}
                    </>
                  ) : (
                    t('downloadBtn')
                  )}
                </button>
                <button 
                  type="button" 
                  className="onboarding-modal-btn-cancel"
                  onClick={() => setShowDownloadModal(false)}
                  disabled={paymentSubmitting}
                >
                  {t('goBack')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines Modal Popups */}
      {activeGuidelinesModal && (
        <div className="guidelines-modal-overlay" onClick={() => setActiveGuidelinesModal(null)} role="dialog" aria-modal="true">
          <div className="guidelines-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="guidelines-modal-header">
              <h2>
                {activeGuidelinesModal === 'sample' ? (
                  <>
                    <ImageIcon className="guidelines-header-icon success" size={22} />
                    {t('photoSample')}
                  </>
                ) : (
                  <>
                    <ClipboardCheck className="guidelines-header-icon success" size={22} />
                    {t('photoContext')}
                  </>
                )}
              </h2>
              <button 
                type="button" 
                className="guidelines-modal-close" 
                onClick={() => setActiveGuidelinesModal(null)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            {activeGuidelinesModal === 'sample' ? (
              <div className="guidelines-modal-body">
                <p className="guidelines-modal-desc">
                  {t('photoSampleModalDesc')}
                </p>
                
                {/* Section 1: Accepted Samples */}
                <div className="sample-modal-section accepted-section">
                  <h3 className="sample-section-title success">
                    <CheckCircle2 size={24} />
                    {t('acceptedTitle')}
                  </h3>
                  <div className="guidelines-modal-grid">
                    {acceptedSamples.map((url, index) => (
                      <div key={index} className="guidelines-modal-item accepted-item">
                        <div className="guidelines-modal-img-wrapper">
                          <img src={url} alt={`Accepted Sample ${index + 1}`} loading="lazy" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Rejected Samples */}
                <div className="sample-modal-section rejected-section" style={{ marginTop: '32px' }}>
                  <h3 className="sample-section-title danger">
                    <AlertCircle size={24} />
                    {t('notAcceptedTitle')}
                  </h3>
                  <div className="guidelines-modal-grid">
                    {rejectedSamples.map((url, index) => (
                      <div key={index} className="guidelines-modal-item rejected-item">
                        <div className="guidelines-modal-img-wrapper">
                          <img src={url} alt={`Rejected Sample ${index + 1}`} loading="lazy" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="guidelines-modal-body context-body">
                <div className="context-grid">
                  {/* Column 1: Accepted / Required Photos */}
                  <div className="context-card accepted-card">
                    <div className="context-card-header success">
                      <CheckCircle2 size={24} />
                      <h3>{t('acceptedRequiredPhotos')}</h3>
                    </div>
                    <div className="context-card-content">
                      <div className="context-item-group">
                        <h4 className="context-group-title">{t('fullLengthProductViews')}</h4>
                        <p className="context-group-desc">{t('fullLengthDesc')}</p>
                        <ul className="context-sublist">
                          <li>{t('forSarees')}</li>
                          <li>{t('forSuits')}</li>
                        </ul>
                      </div>
                      
                      <ul className="context-mainlist">
                        <li>{t('highResCaptures')}</li>
                        <li>{t('trueColors')}</li>
                        <li>{t('brightLighting')}</li>
                        <li>{t('neutralBackgrounds')}</li>
                        <li>{t('verticalRatio')}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Column 2: Not Accepted Photos */}
                  <div className="context-card rejected-card">
                    <div className="context-card-header danger">
                      <AlertCircle size={24} />
                      <h3>{t('notAcceptedPhotosTitle')}</h3>
                    </div>
                    <div className="context-card-content">
                      <ul className="context-mainlist danger-list">
                        <li>{t('aiDigitalArt')}</li>
                        <li>{t('stockPhotos')}</li>
                        <li>{t('blurredLowRes')}</li>
                        <li>{t('screenshots')}</li>
                        <li>{t('watermarkedImages')}</li>
                        <li>{t('filteredEdited')}</li>
                        <li>{t('groupCollages')}</li>
                        <li>{t('brandingLogos')}</li>
                        <li>{t('fakeSilkMark')}</li>
                        <li>{t('croppedLogos')}</li>
                        <li>{t('stockLogoGraphics')}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Column 3: Important Tips */}
                  <div className="context-card tips-card">
                    <div className="context-card-header info">
                      <BadgeCheck size={24} />
                      <h3>{t('importantTipsTitle')}</h3>
                    </div>
                    <div className="context-card-content">
                      <ul className="context-mainlist tips-list">
                        <li>
                          <strong>{lang === 'hi' ? 'फाइल फॉर्मेट: ' : 'File Format: '}</strong>
                          {lang === 'hi' 
                            ? 'सुनिश्चित करें कि सभी फोटो केवल JPG, JPEG या PNG फॉर्मेट में अपलोड की गई हों।' 
                            : 'Ensure all photos are uploaded in JPG, JPEG, or PNG formats only.'}
                        </li>
                        <li>
                          <strong>{lang === 'hi' ? 'फाइल साइज: ' : 'File Size: '}</strong>
                          {lang === 'hi' 
                            ? 'इमेज का साइज तय सीमा के भीतर रखें (जैसे, प्रति इमेज आमतौर पर 1MB या 2MB से कम)।' 
                            : 'Keep the image size within the allowed limit (e.g., usually under 1MB or 2MB per image).'}
                        </li>
                        <li>
                          <strong>{lang === 'hi' ? 'बैकग्राउंड: ' : 'Background: '}</strong>
                          {lang === 'hi' 
                            ? 'प्रोडक्ट फ़ोटो के लिए एक साफ़, न्यूतरल या बिना क्लटर वाली पृष्ठभूमि का उपयोग करें ताकि पूरा ध्यान साड़ी या सूट पर रहे।' 
                            : 'Use a clean, neutral, or uncluttered background for product photos so the focus remains entirely on the saree or suit.'}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
