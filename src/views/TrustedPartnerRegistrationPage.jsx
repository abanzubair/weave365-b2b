/**
 * @file TrustedPartnerRegistrationPage.jsx
 * @description Premium Partner Registration & Product Review Onboarding Page.
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
  RefreshCw,
  AlertCircle,
  Languages
} from 'lucide-react';
import artisanImage from '../../assets/artisan_at_loom_premium.webp';
import { assetSrc } from '../utils/assetSrc.js';
import SliderCaptcha from '../components/SliderCaptcha.jsx';
import '../styles/weaverRegistrationPage.css';

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
  { name: 'Under 999', emoji: '💰' }
];

const initialReviewForm = {
  fullName: '',
  whatsapp: '',
  city: '',
  pincode: '',
  categories: [],
  priceRange: '',
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

// Convert File object to Base64 String
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export function TrustedPartnerRegistrationPage() {
  const heroImage = assetSrc(artisanImage);
  
  // Language state & helper
  const [lang, setLang] = useState('en');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('weave365_lang');
      if (savedLang && savedLang !== 'en') {
        setLang(savedLang);
      }
    } catch (e) {
      // Ignore localStorage access errors
    }
  }, []);

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

  const generateAgreementHtml = (agreementId, cleanWhatsapp, vendorName, date) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Weave365 Merchant Agreement - Signed Copy</title>
  <style>
    body { background-color: #faf8f5; color: #1a1715; font-family: 'Georgia', serif; padding: 40px; }
    .agreement-container { max-width: 800px; margin: 0 auto; background: #ffffff; border: 2px solid #b78646; padding: 60px 50px; }
    .agreement-header { text-align: center; margin-bottom: 40px; }
    .logo-text { font-size: 32px; font-weight: bold; color: #b78646; }
    .doc-title { font-size: 20px; font-weight: 600; }
    .meta-box { background: #fdfbf7; border: 1px solid rgba(183, 134, 70, 0.2); padding: 20px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .terms-section { margin: 30px 0; border-top: 1px solid rgba(183, 134, 70, 0.2); padding-top: 20px; }
    .terms-section h3 { color: #b78646; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px dashed rgba(183, 134, 70, 0.15); padding-bottom: 4px; }
    .terms-section ul { list-style-type: none; padding-left: 0; margin: 0; }
    .terms-section li { margin-bottom: 14px; font-size: 14px; line-height: 1.6; }
    .terms-section li strong { color: #1a1715; display: block; margin-bottom: 2px; }
    .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; border-top: 1px solid rgba(183, 134, 70, 0.2); padding-top: 30px; }
    .sig-block { text-align: center; }
  </style>
</head>
<body>
  <div class="agreement-container">
    <div class="agreement-header">
      <div class="logo-text">Weave 365</div>
      <div class="doc-title">Merchant Agreement & Terms</div>
    </div>
    <div class="meta-box">
      <div><strong>Agreement ID:</strong> ${agreementId}</div>
      <div><strong>Registered Phone:</strong> +91 ${cleanWhatsapp}</div>
      <div><strong>Authorized Signatory:</strong> ${vendorName}</div>
      <div><strong>Date of Signature:</strong> ${date}</div>
    </div>
    
    <div class="terms-section">
      <h3>${t('secAPaymentTerms')}</h3>
      <ul>
        <li><strong>${t('a1Title')}:</strong> ${t('a1Desc')}</li>
        <li><strong>${t('a2Title')}:</strong> ${t('a2Desc')}</li>
        <li><strong>${t('a3Title')}:</strong> ${t('a3Desc')}</li>
        <li><strong>${t('a4Title')}:</strong> ${t('a4Desc')}</li>
        <li><strong>${t('a5Title')}:</strong> ${t('a5Desc')}</li>
      </ul>
      
      <h3>${t('secBReturnPolicy')}</h3>
      <ul>
        <li><strong>${t('b1Title')}:</strong> ${t('b1Desc')}</li>
        <li><strong>${t('b2Title')}:</strong> ${t('b2Desc')}</li>
        <li><strong>${t('b3Title')}:</strong> ${t('b3Desc')}</li>
        <li><strong>${t('b4Title')}:</strong> ${t('b4Desc')}</li>
        <li><strong>${t('b5Title')}:</strong> ${t('b5Desc')}</li>
      </ul>
      
      <h3>${t('secCListingStandards')}</h3>
      <ul>
        <li><strong>${t('c1Title')}:</strong> ${t('c1Desc')}</li>
        <li><strong>${t('c2Title')}:</strong> ${t('c2Desc')}</li>
        <li><strong>${t('c3Title')}:</strong> ${t('c3Desc')}</li>
      </ul>
      
      <h3>${t('secDGeneralTerms')}</h3>
      <ul>
        <li><strong>${t('d1Title')}:</strong> ${t('d1Desc')}</li>
        <li><strong>${t('d2Title')}:</strong> ${t('d2Desc')}</li>
        <li><strong>${t('d3Title')}:</strong> ${t('d3Desc')}</li>
      </ul>
    </div>
    
    <div class="signature-section">
      <div class="sig-block">
        <div style="font-family: monospace; font-size: 18px; color: #3b82f6;"><i>WEAVE365 SECURE SIGNED</i></div>
        <div>Weave 365 Operations</div>
      </div>
      <div class="sig-block">
        <div style="font-family: cursive; font-size: 24px; color: #1e3a8a;">${vendorName}</div>
        <div>${vendorName}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };
  
  // Step wizard state
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, or 3
  
  // Tab 1: Product Review Form State
  const [reviewForm, setReviewForm] = useState(initialReviewForm);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
  const reviewErrorRef = useRef(null);

  useEffect(() => {
    if (reviewError && reviewErrorRef.current) {
      reviewErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      reviewErrorRef.current.focus();
    }
  }, [reviewError]);
  
  // Tab 2: Payment Agreement Form State
  const [paymentAgreement, setPaymentAgreement] = useState({
    a1: false, a2: false, a3: false, a4: false, a5: false,
    b1: false, b2: false, b3: false, b4: false, b5: false,
    c1: false, c2: false, c3: false,
    d1: false, d2: false, d3: false,
    agreeAll: false,
    vendorName: '',
    date: getLocalDateString()
  });
  
  const [paymentError, setPaymentError] = useState('');
  
  // Agreement Download States
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
  
  // Captcha verification states
  const [isOnboardingCaptchaVerified, setIsOnboardingCaptchaVerified] = useState(false);
  
  // Reset captchas when currentStep changes
  useEffect(() => {
    setIsOnboardingCaptchaVerified(false);
  }, [currentStep]);

  const idProofRef = useRef(null);
  const cancelledChequeRef = useRef(null);

  // Check local storage on mount to see if user has already submitted
  useEffect(() => {
    try {
      const savedVendor = localStorage.getItem('weave365_vendor_submitted') === 'true';
      if (savedVendor) {
        setSubmitted(true);
      }

      const paymentAgreed = localStorage.getItem('weave365_payment_terms_agreed') === 'true';
      if (paymentAgreed) {
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

  // Category & Price Range mappers from Step 1 to Step 3
  const mapStep1ToStep3Categories = (cats) => {
    const mapper = {
      'Saree': 'Sarees',
      'Suit': 'Suits',
      'Dupatta': 'Dupattas',
      'Lehenga': 'Lehengas',
      'Fabric': 'Fabrics',
      'Under 999': 'Under 999'
    };
    return cats.map(c => mapper[c] || c);
  };

  const mapStep1ToStep3PriceRange = (pr) => {
    if (pr === 'Under ₹1,000') return '₹500 – ₹999';
    if (pr === '₹1,000 - ₹3,000') return '₹1,000 – ₹1,999';
    if (pr === '₹3,000 - ₹5,000') return '₹2,000 – ₹4,999';
    if (pr === '₹5,000 - ₹10,000') return '₹5,000 – ₹9,999';
    if (pr === '₹10,000+') return '₹10,000+';
    return '';
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
    
    setReviewSubmitting(true);

    const cleanWhatsapp = reviewForm.whatsapp.trim().replace(/\D/g, '');
    if (cleanWhatsapp.length !== 10) {
      setReviewError('Please enter a valid 10-digit WhatsApp number.');
      setReviewSubmitting(false);
      return;
    }
    
    // Global duplicate checks via database API
    try {
      const response = await fetch(`/api/vendor-registration?whatsapp=${cleanWhatsapp}&_t=${Date.now()}`);
      if (response.ok) {
        const resData = await response.json();
        if (resData.status === 'success' && (resData.review || resData.profile)) {
          setReviewError('A partner registration has already been submitted with this mobile number.');
          setReviewSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Unable to verify global reviews duplicate status:', err);
    }

    // Auto-populate Step 3 onboarding fields
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

    setOnboardingForm((prev) => ({
      ...prev,
      fullName: prev.fullName || capitalizedName,
      whatsapp: prev.whatsapp || cleanWhatsapp,
      city: prev.city || capitalizedCity,
      pincode: prev.pincode || reviewForm.pincode.trim(),
      productCategories: prev.productCategories.length > 0 ? prev.productCategories : mapStep1ToStep3Categories(reviewForm.categories),
      priceRange: prev.priceRange || mapStep1ToStep3PriceRange(reviewForm.priceRange)
    }));

    setPaymentAgreement(prev => ({
      ...prev,
      vendorName: prev.vendorName || capitalizedName
    }));

    setReviewSubmitting(false);
    setCurrentStep(2);
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

    const cleanWhatsapp = reviewForm.whatsapp.trim().replace(/\D/g, '').slice(-10);
    if (cleanWhatsapp.length !== 10) {
      setPaymentError('Registered mobile/WhatsApp number not found. Please complete Step 1 first.');
      return;
    }

    const agreementId = `WM-AG-${Date.now()}`;
    const docHtml = generateAgreementHtml(agreementId, cleanWhatsapp, vendorName, date);

    setPendingAgreementDocHtml(docHtml);
    setPendingWhatsapp(cleanWhatsapp);
    setPendingVendorName(vendorName);
    setPendingDate(date);
    setCurrentStep(3);
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

    // Capitalize inputs
    const capitalizedReviewName = reviewForm.fullName
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
      
    const capitalizedReviewCity = reviewForm.city
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const capitalizedOnboardingName = onboardingForm.fullName
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const capitalizedOnboardingCity = onboardingForm.city
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    // 1. Prepare Step 1 payload
    const reviewPayload = {
      action: 'product_review',
      fullName: capitalizedReviewName,
      whatsapp: cleanWhatsapp,
      city: capitalizedReviewCity,
      pincode: reviewForm.pincode.trim(),
      categories: reviewForm.categories.join(', '),
      priceRange: reviewForm.priceRange,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      image1: '',
      image2: '',
      image3: '',
      image4: ''
    };

    // 2. Prepare Step 2 payload
    let finalDocHtml = pendingAgreementDocHtml;
    if (!finalDocHtml) {
      const agreementId = `WM-AG-${Date.now()}`;
      finalDocHtml = generateAgreementHtml(
        agreementId,
        cleanWhatsapp,
        paymentAgreement.vendorName || capitalizedOnboardingName,
        paymentAgreement.date || getLocalDateString()
      );
    }
    const base64Doc = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(finalDocHtml)));

    const agreementPayload = {
      action: 'submit_agreement',
      whatsapp: cleanWhatsapp,
      vendorName: paymentAgreement.vendorName || capitalizedOnboardingName,
      date: paymentAgreement.date || getLocalDateString(),
      agreementDoc: base64Doc
    };

    // 3. Prepare Step 3 payload
    const onboardingPayload = {
      action: 'vendor_registration',
      ...onboardingForm,
      fullName: capitalizedOnboardingName,
      whatsapp: cleanWhatsapp,
      city: capitalizedOnboardingCity,
      productCategories: onboardingForm.productCategories.join(', '),
      paymentVendorName: paymentAgreement.vendorName || capitalizedOnboardingName,
      paymentAgreementDate: paymentAgreement.date || getLocalDateString(),
      submittedAt: new Date().toISOString(),
      status: 'pending_onboarding_review'
    };

    try {
      // POST review
      const res1 = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload)
      });
      const data1 = await res1.json();
      if (!res1.ok || data1.status !== 'success') {
        throw new Error(data1.error || 'Failed to submit product review application.');
      }

      // POST agreement
      const res2 = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agreementPayload)
      });
      const data2 = await res2.json();
      if (!res2.ok || data2.status !== 'success') {
        throw new Error(data2.error || 'Failed to submit signed payment agreement.');
      }

      // POST onboarding profile
      const res3 = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingPayload)
      });
      const data3 = await res3.json();
      if (!res3.ok || data3.status !== 'success') {
        throw new Error(data3.error || 'Failed to submit onboarding profile.');
      }

      // Auto-download copy locally
      try {
        const blob = new Blob([finalDocHtml], { type: 'text/html' });
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

      // Save local storage status
      try {
        localStorage.setItem('weave365_vendor_submitted', 'true');
        localStorage.setItem('weave365_payment_terms_agreed', 'true');
        localStorage.setItem('weave365_payment_vendor_name', paymentAgreement.vendorName || capitalizedOnboardingName);
        localStorage.setItem('weave365_payment_agreement_date', paymentAgreement.date || getLocalDateString());
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Final onboarding submission error:', err);
      setOnboardingError(err.message || 'Verification / submission failed. Please verify database connection.');
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
    setCurrentStep(1);
    setSubmitted(false);
    setPaymentAgreement({
      a1: false, a2: false, a3: false, a4: false, a5: false,
      b1: false, b2: false, b3: false, b4: false, b5: false,
      c1: false, c2: false, c3: false,
      d1: false, d2: false, d3: false,
      agreeAll: false,
      vendorName: '',
      date: getLocalDateString()
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
    setReviewError('');
    setOnboardingError('');
    setPendingAgreementDocHtml('');
    setPendingWhatsapp('');
    setPendingVendorName('');
    setPendingDate('');
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
            {/* STEP SUITE */}
            {submitted ? (
              <div className="vendor-success-card" role="status" aria-live="polite">
                <CheckCircle2 size={42} />
                <h2>{t('onboardingSuccessTitle')}</h2>
                <p>{t('onboardingSuccessDesc')}</p>
                <p style={{ fontSize: 'var(--body-size)', color: 'var(--color-text-secondary)', marginTop: '8px' }}>{t('onboardingSuccessSub')}</p>

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
            ) : currentStep === 1 ? (
              <form className="vendor-registration-form" onSubmit={handleReviewSubmit}>
                <div className="vendor-form-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '22px', marginBottom: '24px' }}>
                  <div className="vendor-form-heading" style={{ borderBottom: 'none', paddingBottom: 0, gap: '14px' }}>
                    <ClipboardCheck size={24} />
                    <div>
                      <h2>{t('step1Title')}</h2>
                      <p>{t('step1Desc')}</p>
                    </div>
                  </div>
                  {!submitted && (
                    <button 
                      type="button"
                      className="vendor-tab-btn translate-toggle-btn"
                      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                      style={{ marginTop: '4px' }}
                    >
                      <Languages size={16} className="tab-translate-icon" />
                      {lang === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
                    </button>
                  )}
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
                          const raw = e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
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
                        <h3 style={{ fontSize: 'var(--h6-size)', fontWeight: 600, color: '#241912', marginBottom: '8px', fontFamily: "var(--font-heading)" }}>
                          {lang === 'hi' ? 'त्रुटि (Error)' : 'Submission Error'}
                        </h3>
                        <p className="onboarding-modal-message" style={{ fontSize: 'var(--small-size)', margin: '0 0 20px', lineHeight: '1.5' }}>
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
                              fontSize: 'var(--small-size)',
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

                <button type="submit" className="vendor-submit-button" disabled={reviewSubmitting}>
                  {reviewSubmitting ? (
                    <>
                      <RefreshCw size={18} className="spinner" />
                      {t('uploadingCatalogs')}
                    </>
                  ) : (
                    lang === 'hi' ? 'अगला: पेमेंट की शर्तें →' : 'Next: Payment Terms →'
                  )}
                </button>
              </form>
            ) : currentStep === 2 ? (
              <form onSubmit={handlePaymentTermsSubmit}>
                <h2 className="sr-only">{t('paymentTermsReturnPolicy')}</h2>

                <div className="onboarding-step-wrapper">
                  <div className="vendor-form-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '22px', marginBottom: '24px' }}>
                    <div>
                      <span className="onboarding-step-meta">
                        {t('step2of3')}
                      </span>
                      <h3 className="onboarding-step-title" style={{ margin: '6px 0 8px' }}>
                        {t('paymentTermsReturnPolicy')}
                      </h3>
                      <p className="onboarding-step-desc" style={{ margin: 0 }}>
                        {t('step2Desc')}
                      </p>
                    </div>
                    {!submitted && (
                      <button 
                        type="button"
                        className="vendor-tab-btn translate-toggle-btn"
                        onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                        style={{ marginTop: '4px' }}
                      >
                        <Languages size={16} className="tab-translate-icon" />
                        {lang === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
                      </button>
                    )}
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
                          <h3 style={{ fontSize: 'var(--h6-size)', fontWeight: 600, color: '#241912', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                            {lang === 'hi' ? 'त्रुटि (Error)' : 'Submission Error'}
                          </h3>
                          <p className="onboarding-modal-message" style={{ fontSize: 'var(--small-size)', margin: '0 0 20px', lineHeight: '1.5' }}>
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
                                fontSize: 'var(--small-size)',
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

                  <button type="submit" className="onboarding-submit-button">
                    {lang === 'hi' ? 'सहमत हूँ और आगे बढ़ें →' : 'Agree & Proceed to Onboarding →'}
                  </button>

                  <p className="onboarding-step-footer">
                    {lang === 'hi' ? 'स्टेप 2 का 3 — एग्रीमेंट पूरा करने के बाद ऑनबोर्डिंग फॉर्म खुल जाएगा।' : 'Step 2 of 3 — Onboarding form will be shown after completing this agreement.'}
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOnboardingSubmit} className="vendor-registration-form">
                <h2 className="sr-only">{t('onboardingFormTitle')}</h2>

                <div className="onboarding-step-wrapper">
                  <div className="vendor-form-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '22px', marginBottom: '24px' }}>
                    <div>
                      <span className="step3-meta">
                        {t('step3of3')}
                      </span>
                      <h3 className="step3-title" style={{ margin: '6px 0 8px' }}>
                        {t('onboardingFormTitle')}
                      </h3>
                      <p className="step3-desc" style={{ margin: 0 }}>
                        {t('onboardingFormDesc')}
                      </p>
                    </div>
                    {!submitted && (
                      <button 
                        type="button"
                        className="vendor-tab-btn translate-toggle-btn"
                        onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                        style={{ marginTop: '4px' }}
                      >
                        <Languages size={16} className="tab-translate-icon" />
                        {lang === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
                      </button>
                    )}
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
                                onChange={(e) => setOnboardingForm(prev => ({ ...prev, whatsapp: e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10) }))} 
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
                                onChange={(e) => setOnboardingForm(prev => ({ ...prev, alternateContact: e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10) }))} 
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
                              { name: 'Under 999', icon: 'ti-coin', key: 'catUnder999' }
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

                  <SliderCaptcha onVerify={setIsOnboardingCaptchaVerified} isReset={currentStep !== 3 || submitted} />

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
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
