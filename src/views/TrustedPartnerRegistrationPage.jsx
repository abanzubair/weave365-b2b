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
  Image as ImageIcon,
  Languages
} from 'lucide-react';
import artisanImage from '../../assets/artisan_at_loom_premium.webp';
import { assetSrc } from '../utils/assetSrc.js';

// Global polyfill layer to protect edge runtime client evaluation from process.env reference errors.
if (typeof globalThis !== 'undefined' && !globalThis.process) {
  globalThis.process = { env: {} };
}


const translations = {
  en: {
    verificationOnboarding: 'Verification & Onboarding',
    asideDesc: 'Apply to list your products on Weave 365. Every supplier is verified before products go live, so buyers get consistent quality and partners get a serious marketplace.',
    noInstantSelfService: 'No instant self-service onboarding. Our team reviews fulfillment capability, product quality, and verification details before approval.',
    step01: 'Form submission',
    step02: 'WhatsApp verification',
    step03: 'Sample/product review',
    step04: 'Vendor approval',
    step05: 'Product onboarding',
    heroTitle: 'Trusted Partner Registration',
    heroDesc: 'Share your craft, capacity, and product details for manual review by the Weave 365 team.',
    tab1Submit: '1. Submit Products for Review',
    tab2Payment: '2. Payment Terms',
    tab3Onboarding: '3. Onboarding Form',
    translateBtn: 'Translate to Hindi',
    translateBtnHi: 'Switch to English',
    step1Title: 'Product Review Submission (Step 1)',
    step1Desc: 'Upload a few sample products to get catalog approval.',
    contactInfo: 'Contact Information',
    fullName: 'Full Name *',
    fullNamePlaceholder: 'Enter your full name',
    whatsappNumber: 'WhatsApp Number *',
    whatsappPlaceholder: '9876543210',
    city: 'City *',
    cityPlaceholder: 'Varanasi, Kolkata, etc.',
    pincode: 'Pincode *',
    pincodePlaceholder: '221001',
    catalogDetails: 'Catalog Details',
    productCategories: 'Product Categories *',
    priceRangeLabel: 'Approximate Price Range *',
    priceRangeSelect: 'Select price range',
    priceRangeUnder1k: 'Under ₹1,000',
    priceRange1k3k: '₹1,000 - ₹3,000',
    priceRange3k5k: '₹3,000 - ₹5,000',
    priceRange5k10k: '₹5,000 - ₹10,000',
    priceRange10kPlus: '₹10,000+',
    samplePhotos: 'Sample Product Photos *',
    uploadSubtitle: 'Upload exactly 4 clear sample photos of your sarees/textiles (e.g., cover, details, back, borders) to submit for review.',
    photoSlot: 'Photo Slot',
    dragDrop: 'Click or Drag & Drop',
    uploadReqs: 'Photo Upload Requirements',
    req1: 'All 4 image slots must be uploaded to submit the application',
    req2: 'Strict maximum file size: 1MB per image',
    req3: 'Format: JPEG, PNG or WebP accepted',
    req4: 'Ensure photos are shot in bright natural light showing weaves clearly',
    confirmPhotosAuth: 'I confirm these photos show authentic products produced by my business.',
    submitReviewBtn: 'Submit Products for Review',
    uploadingCatalogs: 'Uploading Catalogs...',
    reviewSubmittedTitle: 'Products Submitted for Review!',
    reviewSubmittedDesc: 'Our verification team will review your product catalog within 24-48 hours.',
    reviewInstruction: 'Once approved, copy your submitted WhatsApp number and verify it under the Advanced Profile tab to unlock step 2.',
    goPaymentTermsStatus: 'Go to Payment Terms Status Check',
    clearCacheBtn: 'Clear cache & test again ↺',
    paymentTermsLocked: 'Payment Terms & Return Policy Locked',
    paymentLockedDesc: 'The Weave365 Payment Terms agreement is available exclusively to verified suppliers. Please complete Step 1 (Submit Products for Review) first. Once verified, enter your registered number below to unlock step 2.',
    checkVerificationStatus: 'Check Review Verification Status',
    enterWhatsappPlaceholder: 'Enter WhatsApp/Mobile number',
    checkStatusBtn: 'Check Status 🔓',
    checking: 'Checking...',
    paymentTermsReturnPolicy: 'Payment terms & return policy',
    step2of3: 'Weave 365 · Vendor onboarding · Step 2 of 3',
    step2Desc: 'Read each clause carefully. You must agree to all terms before onboarding proceeds.',
    secAPaymentTerms: 'A. Payment terms',
    secBReturnPolicy: 'B. Return policy',
    secCListingStandards: 'C. Product & listing standards',
    secDGeneralTerms: 'D. General terms',
    a1Title: 'A1 — Payment after delivery confirmation',
    a1Desc: 'Payment will be released 3 days after successful delivery to the customer.',
    a2Title: 'A2 — Payment held during dispute period',
    a2Desc: 'If a return or quality dispute is raised within 3 days of delivery, payment will be withheld until the dispute is resolved.',
    a3Title: 'A3 — Payment mode as agreed at onboarding',
    a3Desc: 'Payment will be made via bank transfer (NEFT/IMPS/UPI) to the account details provided during onboarding. Weave 365 is not liable for errors due to incorrect account details submitted by the vendor.',
    a4Title: 'A4 — No advance payment',
    a4Desc: 'Weave 365 does not make advance payments. All payments are processed post-delivery only.',
    a5Title: 'A5 — Deduction for returns and damage',
    a5Desc: 'Any returned product amount and associated courier charges will be deducted from the vendor\'s pending payment before disbursement.',
    b1Title: 'B1 — Color and quality must match approved photos',
    b1Desc: 'The product dispatched must exactly match the color, quality, and finish shown in the approved product images submitted during Step 1. Any deviation will be treated as a vendor-side defect.',
    b2Title: 'B2 — Returns due to quality or color mismatch go back to vendor',
    b2Desc: 'If a customer return is raised due to quality defect, color variation, or mismatch with listing photos, the returned product will be sent back to the vendor at the vendor\'s expense. No payment will be made for such orders.',
    b3Title: 'B3 — Return window — 3 days from delivery',
    b3Desc: 'Customers may raise a return request within 3 days of delivery. Returns raised after this window will not be accepted and vendor payment will be released normally.',
    b4Title: 'B4 — Defective or damaged in transit',
    b4Desc: 'If a product is damaged during courier transit, liability will be assessed jointly. Vendor must ensure proper packaging. Products with inadequate packaging will be vendor\'s liability.',
    b5Title: 'B5 — No return for buyer\'s remorse or size preference',
    b5Desc: 'Returns due to customer preference change, wrong size ordered, or buyer\'s remorse will not be charged to the vendor. These are handled by Weave 365\'s customer policy separately.',
    c1Title: 'C1 — No duplicate listings from other platforms',
    c1Desc: 'Products listed on Weave 365 must not be sold at a lower price on any other platform (Meesho, Flipkart, own website, etc.) during the period of active listing.',
    c2Title: 'C2 — Stock availability obligation',
    c2Desc: 'Once a product is listed, the vendor must maintain stock availability. If stock runs out, the vendor must notify Weave 365 immediately to avoid customer orders being placed on out-of-stock items.',
    c3Title: 'C3 — Dispatch within agreed timeline',
    c3Desc: 'Vendor must dispatch orders within the agreed timeline (default: 2 business days from order confirmation). Repeated delays may result in delisting.',
    d1Title: 'D1 — Right to delist',
    d1Desc: 'Weave 365 reserves the right to delist a vendor\'s products at any time if quality standards, return rates, or these terms are not met, with 24 hours notice.',
    d2Title: 'D2 — Confidentiality of pricing',
    d2Desc: 'Vendor agrees not to disclose Weave 365\'s wholesale pricing, commission structure, or internal operational details to any third party.',
    d3Title: 'D3 — Agreement is binding',
    d3Desc: 'By submitting this form, the vendor agrees that these terms are legally binding. Weave 365 reserves the right to update these terms with 7 days prior notice.',
    agreeAllCheck: 'I have read and agree to all payment terms, return policy, product standards, and general terms listed above. I understand that violation of these terms may result in payment hold or delisting.',
    vendorFullNameLabel: 'Vendor full name',
    asPerIdProof: 'As per ID proof',
    dateOfSubmission: 'Date of Submission',
    agreeAndProceedBtn: 'Agree & Proceed to Onboarding →',
    registeringAgreement: 'Registering & Downloading Agreement...',
    step2Footer: 'Step 2 of 3 — Onboarding form will be unlocked immediately after this agreement copy is verified.',
    onboardingLocked: 'Onboarding Form Locked',
    onboardingLockedDesc: 'The Weave365 Full Vendor Onboarding profile is available exclusively to verified suppliers. Please complete Step 1 (Submit Products for Review) first. Once verified, enter your registered number below to unlock step 3.',
    paymentTermsRequired: 'Payment Terms Agreement Required',
    paymentTermsReqDesc: 'Step 3 (Vendor Onboarding Form) will unlock once you review and agree to the Step 2 (Payment Terms & Return Policy).',
    goReviewPaymentTermsBtn: 'Go to Step 2 — Review Payment Terms',
    step3of3: 'Weave 365 · Vendor onboarding · Step 3 of 3',
    onboardingFormTitle: 'Vendor onboarding form',
    onboardingFormDesc: 'Complete all sections. Your listing will go live after Weave 365 team verification.',
    secAPersonalDetails: 'A. Personal details',
    fullNameLabel: 'Full name',
    asPerAadhaarPan: 'As per Aadhaar / PAN',
    whatsappLabel: 'WhatsApp number',
    emailLabel: 'Email address',
    altContactLabel: 'Alternate contact number',
    secBBusinessDetails: 'B. Business details',
    businessShopName: 'Business name',
    tradeNamePlaceholder: 'Trade name',
    businessTypeLabel: 'Business Role',
    businessTypeSelect: 'Select',
    businessTypeOpt1: 'Weaver',
    businessTypeOpt2: 'Master Weaver',
    businessTypeOpt3: 'Manufacturer',
    businessTypeOpt4: 'Wholesaler',
    businessTypeOpt5: 'Retailer',
    businessAddressLabel: 'Business address',
    shopUnitAddressPlaceholder: 'Shop / unit address',
    cityPlaceholderStep3: 'City',
    pincodePlaceholderStep3: 'Pincode',
    gstLabelStep3: 'GST number (if registered)',
    panLabelStep3: 'PAN number',
    yearsInBusinessLabel: 'Years in business',
    yearsSelectPlaceholder: 'Select',
    yearsOpt1: 'Less than 1 year',
    yearsOpt2: '1 – 3 years',
    yearsOpt3: '3 – 7 years',
    yearsOpt4: '7 – 15 years',
    yearsOpt5: '15+ years',
    secCProductDetailsStep3: 'C. Product details',
    categoriesStep3Label: 'Product categories you supply (select all that apply)',
    pricePerPiece: 'Price range per piece',
    monthlyCapacityStep3: 'Monthly supply capacity',
    monthlyOpt1: 'Up to 20 pieces',
    monthlyOpt2: '20 – 50 pieces',
    monthlyOpt3: '50 – 100 pieces',
    monthlyOpt4: '100 – 300 pieces',
    monthlyOpt5: '300+ pieces',
    fabricSpecialisation: 'Fabric / weave specialisation (e.g. Katan silk, Georgette, Organza, Chanderi)',
    specialisationPlaceholder: 'Describe your specialisation',
    secDDispatchOps: 'D. Dispatch & operations',
    dispatchTimelineLabel: 'Dispatch timeline after order',
    dispatchOpt1: 'Same day',
    dispatchOpt2: '1 business day',
    dispatchOpt3: '2 business days',
    dispatchOpt4: '3 business days',
    preferredCourierLabel: 'Preferred courier partner',
    courierOpt1: 'Delhivery',
    courierOpt2: 'Blue Dart',
    courierOpt3: 'DTDC',
    courierOpt4: 'India Post',
    courierOpt5: 'Shiprocket',
    courierOpt6: 'No preference',
    dispatchLocationRadio: 'Dispatch location (pickup address same as business address?)',
    yesSameAddress: 'Yes, same address',
    differentAddress: 'Different address',
    pickupAddressPlaceholder: 'Pickup / dispatch address',
    secEBankDetails: 'E. Bank account details',
    forPaymentDisbursal: 'For payment disbursement',
    accountHolderName: 'Account holder name',
    asPerBankRecords: 'As per bank records',
    bankNameLabel: 'Bank name',
    bankNamePlaceholder: 'e.g. SBI, HDFC, Axis',
    accountNumberLabel: 'Account number',
    accountNumberPlaceholder: 'Enter account number',
    ifscLabel: 'IFSC code',
    ifscPlaceholder: 'e.g. SBIN0001234',
    upiLabel: 'UPI ID (optional — for faster payments)',
    upiPlaceholder: 'yourname@upi',
    bankInfoText: 'Weave 365 is not responsible for payment failures due to incorrect bank details. Please double-check before submitting.',
    secFIdentityVerification: 'F. Identity verification',
    aadhaarLabel: 'Aadhaar number',
    aadhaarPlaceholder: 'XXXX XXXX XXXX',
    panVerifyLabel: 'PAN number',
    panVerifyPlaceholder: 'AAAAA0000A',
    aadhaarUploadLabel: 'Aadhaar / ID proof',
    chequeUploadLabel: 'Cancelled cheque',
    fileUploadSpecs: 'JPG or PDF, max 2MB',
    uploadedSuccessAadhaar: '✓ Aadhaar Uploaded',
    uploadedSuccessCheque: '✓ Cheque Uploaded',
    declarationCheckbox: 'I confirm that all information provided is accurate. I have read and agreed to the payment terms and return policy (Step 2) and understand that false information may result in permanent delisting.',
    submitOnboardingFormBtn: 'Submit onboarding form →',
    submittingOnboardingForm: 'Submitting Onboarding Form...',
    step3Footer: 'Account activation takes 3–5 business days after document verification.',
    onboardingSuccessTitle: 'Thank you for applying!',
    onboardingSuccessDesc: 'Our team has received your full onboarding profile and verification documents. We will finalize your supplier listing shortly.',
    onboardingSuccessSub: 'Account activation takes 3–5 business days after document verification.',
    agreementSigned: 'Agreement Signed',
    agreementSignedDesc: 'Your B2B Merchant Agreement has been counter-signed. Please download a copy for your records to unlock Step 3 Onboarding.',
    downloadBtn: 'Download Agreement Copy',
    savingDownloading: 'Saving & Downloading...',
    goBack: 'Go Back',
    heroTitleText: 'Trusted Partner Registration',
    heroDescText: 'Share your craft, capacity, and product details for manual review by the Weave 365 team.',
    catSaree: 'Saree',
    catSuit: 'Suit',
    catDupatta: 'Dupatta',
    catLehenga: 'Lehenga',
    catFabric: 'Fabric',
    catAccessories: 'Accessories',
    catSarees: 'Sarees',
    catSuits: 'Suits',
    catDupattas: 'Dupattas',
    catLehengas: 'Lehengas',
    catFabrics: 'Fabrics',
    catAccessoriesPlural: 'Accessories',
    priceOptSelect: 'Select',
    priceOptUnder500: 'Under ₹500',
    priceOpt500_999: '₹500 – ₹999',
    priceOpt1000_1999: '₹1,000 – ₹1,999',
    priceOpt2000_4999: '₹2,000 – ₹4,999',
    priceOpt5000_9999: '₹5,000 – ₹9,999',
    priceOpt10000Plus: '₹10,000+',
    dispatchOptSelect: 'Select',
    dispatchOptSameDay: 'Same day',
    dispatchOpt1Day: '1 business day',
    dispatchOpt2Days: '2 business days',
    dispatchOpt3Days: '3 business days',
    courierOptSelect: 'Select',
    courierOptDelhivery: 'Delhivery',
    courierOptBlueDart: 'Blue Dart',
    courierOptDtdc: 'DTDC',
    courierOptIndiaPost: 'India Post',
    courierOptShiprocket: 'Shiprocket',
    courierOptNoPref: 'No preference',
  },
  hi: {
    verificationOnboarding: 'वेरिफिकेशन और ऑनबोर्डिंग',
    asideDesc: 'वीव 365 पर अपने प्रोडक्ट्स को बेचने के लिए अप्लाई करें। हर सप्लायर का पहले वेरिफिकेशन किया जाता है ताकि ग्राहकों को बढ़िया क्वालिटी मिले और आपको एक अच्छा मार्केट मिले।',
    noInstantSelfService: 'यहाँ कोई तुरंत ऑनबोर्डिंग नहीं होती है। हमारी टीम आपके काम, प्रोडक्ट्स की क्वालिटी और डिटेल्स चेक करने के बाद ही अप्रूवल देती है।',
    step01: 'फॉर्म जमा करना',
    step02: 'व्हाट्सएप वेरिफिकेशन',
    step03: 'सैंपल/प्रोडक्ट रिव्यू',
    step04: 'विक्रेता अप्रूवल',
    step05: 'प्रोडक्ट ऑनबोर्डिंग',
    heroTitle: 'भरोसेमंद पार्टनर रजिस्ट्रेशन',
    heroDesc: 'वीव 365 टीम द्वारा रिव्यू के लिए अपने काम, कैपेसिटी और प्रोडक्ट की जानकारी यहाँ भेजें।',
    tab1Submit: '1. रिव्यू के लिए प्रोडक्ट्स भेजें',
    tab2Payment: '2. पेमेंट की शर्तें',
    tab3Onboarding: '3. ऑनबोर्डिंग फॉर्म',
    translateBtn: 'English में देखें',
    translateBtnHi: 'हिन्दी में बदलें',
    step1Title: 'प्रोडक्ट रिव्यू सबमिशन (स्टेप 1)',
    step1Desc: 'कैटलॉग अप्रूवल पाने के लिए अपने कुछ सैंपल प्रोडक्ट्स अपलोड करें।',
    contactInfo: 'कांटेक्ट डिटेल्स (सम्पर्क जानकारी)',
    fullName: 'पूरा नाम *',
    fullNamePlaceholder: 'अपना पूरा नाम लिखें',
    whatsappNumber: 'व्हाट्सएप नंबर *',
    whatsappPlaceholder: '9876543210',
    city: 'शहर *',
    cityPlaceholder: 'बनारस, कोलकाता, आदि।',
    pincode: 'पिनकोड *',
    pincodePlaceholder: '221001',
    catalogDetails: 'कैटलॉग डिटेल्स',
    productCategories: 'प्रोडक्ट कैटेगरीज़ *',
    priceRangeLabel: 'अनुमानित प्राइस रेंज (कीमत) *',
    priceRangeSelect: 'प्राइस रेंज चुनें',
    priceRangeUnder1k: '₹1,000 से कम',
    priceRange1k3k: '₹1,000 - ₹3,000',
    priceRange3k5k: '₹3,000 - ₹5,000',
    priceRange5k10k: '₹5,000 - ₹10,000',
    priceRange10kPlus: '₹10,000 से ज़्यादा',
    samplePhotos: 'सैंपल प्रोडक्ट की तस्वीरें *',
    uploadSubtitle: 'रिव्यू के लिए सबमिट करने के लिए अपनी साड़ियों/कपड़ों की ठीक 4 साफ़ तस्वीरें अपलोड करें (जैसे: सामने से, काम का क्लोज़-अप, पीछे का हिस्सा, बॉर्डर)।',
    photoSlot: 'फोटो स्लॉट',
    dragDrop: 'क्लिक करें या फोटो यहाँ खींच कर छोड़ें',
    uploadReqs: 'फोटो अपलोड करने के नियम',
    req1: 'फॉर्म सबमिट करने के लिए सभी 4 फोटो स्लॉट अपलोड करना ज़रूरी है',
    req2: 'फोटो का साइज ज़्यादा से ज़्यादा 1MB होना चाहिए',
    req3: 'फोटो फॉर्मेट: JPEG, PNG या WebP ही चलेंगे',
    req4: 'सुनिश्चित करें कि फोटो अच्छी रोशनी में ली गई हो ताकि काम साफ दिखे',
    confirmPhotosAuth: 'मैं पुष्टि करता हूँ कि ये फोटो मेरे अपने काम की असली तस्वीरें हैं।',
    submitReviewBtn: 'रिव्यू के लिए प्रोडक्ट्स भेजें',
    uploadingCatalogs: 'कैटलॉग अपलोड हो रहा है...',
    reviewSubmittedTitle: 'रिव्यू के लिए प्रोडक्ट्स सबमिट हो गए!',
    reviewSubmittedDesc: 'हमारी टीम 24-48 घंटों के भीतर आपके भेजे गए प्रोडक्ट्स का रिव्यू करेगी।',
    reviewInstruction: 'मैसेज आने के बाद, अपने व्हाट्सएप नंबर को कॉपी करें और स्टेप 2 अनलॉक करने के लिए पेमेंट की शर्तें टैब में जाकर वेरिफाई करें।',
    goPaymentTermsStatus: 'पेमेंट की शर्तों का स्टेटस चेक करें',
    clearCacheBtn: 'कैश साफ करें और फिर से टेस्ट करें ↺',
    paymentTermsLocked: 'पेमेंट की शर्तें और रिटर्न पॉलिसी लॉक है',
    paymentLockedDesc: 'वीव365 पेमेंट की शर्तों का एग्रीमेंट सिर्फ वेरिफाइड सप्लायर्स के लिए है। कृपया पहले स्टेप 1 (रिव्यू के लिए प्रोडक्ट्स भेजें) को पूरा करें। वेरिफिकेशन के बाद, स्टेप 2 अनलॉक करने के लिए नीचे अपना नंबर डालें।',
    checkVerificationStatus: 'वेरिफिकेशन का स्टेटस चेक करें',
    enterWhatsappPlaceholder: 'व्हाट्सएप/मोबाइल नंबर यहाँ लिखें',
    checkStatusBtn: 'स्टेटस चेक करें 🔓',
    checking: 'चेक किया जा रहा है...',
    paymentTermsReturnPolicy: 'पेमेंट की शर्तें और रिटर्न पॉलिसी',
    step2of3: 'वीव 365 · विक्रेता ऑनबोर्डिंग · स्टेप 2 का 3',
    step2Desc: 'हर शर्त को ध्यान से पढ़ें। आगे बढ़ने के लिए आपको सभी शर्तों से सहमत होना होगा।',
    secAPaymentTerms: 'क. पेमेंट की शर्तें',
    secBReturnPolicy: 'ख. रिटर्न पॉलिसी',
    secCListingStandards: 'ग. प्रोडक्ट लिस्टिंग के नियम',
    secDGeneralTerms: 'घ. सामान्य नियम (जनरल टर्म्स)',
    a1Title: 'क1 — डिलीवरी कन्फर्म होने के बाद पेमेंट',
    a1Desc: 'कस्टमर को आर्डर डिलीवर होने के 3 दिन बाद पेमेंट रिलीज किया जाएगा।',
    a2Title: 'क2 — विवाद (डिसप्यूट) के दौरान पेमेंट रोका जाएगा',
    a2Desc: 'यदि डिलीवरी के 3 दिनों के भीतर कोई रिटर्न या क्वालिटी को लेकर शिकायत आती है, तो विवाद सुलझने तक पेमेंट होल्ड पर रहेगा।',
    a3Title: 'क3 — ऑनबोर्डिंग के समय दिए गए बैंक खाते में पेमेंट',
    a3Desc: 'पेमेंट ऑनबोर्डिंग के समय दिए गए बैंक अकाउंट में बैंक ट्रांसफर (NEFT/IMPS/UPI) के ज़रिए किया जाएगा। गलत बैंक डिटेल्स देने पर वीव 365 जिम्मेदार नहीं होगा।',
    a4Title: 'क4 — कोई एडवांस पेमेंट नहीं',
    a4Desc: 'वीव 365 कोई एडवांस पेमेंट नहीं देता है। सभी पेमेंट आर्डर डिलीवर होने के बाद ही प्रोसेस होंगे।',
    a5Title: 'क5 — रिटर्न और डैमेज के पैसे काटे जाएंगे',
    a5Desc: 'रिटर्न हुए प्रोडक्ट का अमाउंट और कूरियर चार्जेस आपके पेंडिंग पेमेंट्स में से काट लिए जाएंगे।',
    b1Title: 'ख1 — रंग और क्वालिटी बिल्कुल फोटो जैसी होनी चाहिए',
    b1Desc: 'भेजा गया आर्डर बिल्कुल स्टेप 1 में सबमिट किए गए फोटो के रंग, क्वालिटी और डिज़ाइन से मेल खाना चाहिए। किसी भी गड़बड़ी को सप्लायर की गलती माना जाएगा।',
    b2Title: 'ख2 — क्वालिटी खराब या अलग होने पर प्रोडक्ट वापस सप्लायर के पास जाएगा',
    b2Desc: 'यदि कस्टमर डिफेक्ट या अलग प्रोडक्ट होने के कारण रिटर्न करता है, तो वो प्रोडक्ट सप्लायर के खर्चे पर वापस भेजा जाएगा और उसका कोई पेमेंट नहीं मिलेगा।',
    b3Title: 'ख3 — रिटर्न विंडो — डिलीवरी से 3 दिन तक',
    b3Desc: 'कस्टमर डिलीवरी के 3 दिन के भीतर ही रिटर्न रिक्वेस्ट डाल सकते हैं। इसके बाद कोई रिटर्न स्वीकार नहीं होगा और आपका पेमेंट रिलीज कर दिया जाएगा।',
    b4Title: 'ख4 — रास्ते में नुकसान या खराबी (डैमेज)',
    b4Desc: 'कूरियर से लाते-ले जाते समय डैमेज होने पर दोनों पक्षों द्वारा जांच की जाएगी। सप्लायर की खराब पैकिंग की वजह से नुकसान होने पर पूरी जिम्मेदारी सप्लायर की होगी।',
    b5Title: 'ख5 — कस्टमर का मन बदलने या गलत साइज आर्डर करने पर नुकसान नहीं',
    b5Desc: 'यदि कस्टमर मन बदलने या गलत साइज आर्डर करने की वजह से रिटर्न करता है, तो इसका नुकसान सप्लायर को नहीं भुगतना पड़ेगा। इसका फैसला वीव 365 की अपनी पॉलिसी से होगा।',
    c1Title: 'ग1 — किसी और प्लेटफार्म पर कम दाम में लिस्टिंग नहीं',
    c1Desc: 'वीव 365 पर लिस्टेड प्रोडक्ट्स को आप किसी भी अन्य प्लेटफॉर्म (जैसे: मीशो, फ्लिपकार्ट या अपनी खुद की वेबसाइट) पर कम कीमत में नहीं बेच सकते।',
    c2Title: 'ग2 — स्टॉक की जानकारी देना ज़रूरी है',
    c2Desc: 'एक बार प्रोडक्ट लिस्ट होने के बाद, आपको उसका स्टॉक रखना होगा। स्टॉक खत्म होने पर तुरंत वीव 365 को बताएं ताकि आउट-ऑफ़-स्टॉक आर्डर न आएँ।',
    c3Title: 'ग3 — तय समय के अंदर आर्डर भेजना (डिस्पैच)',
    c3Desc: 'आपको तय समय सीमा के भीतर आर्डर भेजना होगा (आमतौर पर आर्डर कन्फर्म होने के 2 वर्किंग डेज में)। बार-बार देरी करने पर आपकी लिस्टिंग हटाई जा सकती है।',
    d1Title: 'घ1 — डीलिस्ट (लिस्टिंग हटाने) का अधिकार',
    d1Desc: 'यदि क्वालिटी ख़राब होती है, रिटर्न ज़्यादा आते हैं या नियम पूरे नहीं होते हैं, तो वीव 365 24 घंटे का नोटिस देकर किसी भी समय सप्लायर को हटा सकता है।',
    d2Title: 'घ2 — कीमतों की गोपनीयता',
    d2Desc: 'सप्लायर वीव 365 के होलसेल प्राइस, कमीशन और कामकाज से जुड़ी कोई भी जानकारी किसी बाहरी व्यक्ति को नहीं बता सकता।',
    d3Title: 'घ3 — एग्रीमेंट कानूनी रूप से बाध्य है',
    d3Desc: 'इस फॉर्म को सबमिट करके, सप्लायर मानता है कि ये नियम कानूनी रूप से लागू हैं। वीव 365 7 दिन पहले नोटिस देकर इन नियमों को बदल सकता है।',
    agreeAllCheck: 'मैंने ऊपर लिखी पेमेंट की शर्तें, रिटर्न पॉलिसी, और बाकी नियम अच्छे से पढ़ लिए हैं और मैं इन सभी से सहमत हूँ। मैं समझता हूँ कि नियमों का उल्लंघन करने पर पेमेंट रोका जा सकता है।',
    vendorFullNameLabel: 'विक्रेता (सप्लायर) का पूरा नाम',
    asPerIdProof: 'आईडी प्रूफ (आधार/पैन) के अनुसार',
    dateOfSubmission: 'जमा करने की तारीख',
    agreeAndProceedBtn: 'सहमत हूँ और आगे बढ़ें →',
    registeringAgreement: 'एग्रीमेंट रजिस्टर और डाउनलोड किया जा रहा है...',
    step2Footer: 'स्टेप 2 का 3 — इस एग्रीमेंट कॉपी के वेरिफाई होने के तुरंत बाद ऑनबोर्डिंग फॉर्म खुल जाएगा।',
    onboardingLocked: 'ऑनबोर्डिंग फॉर्म लॉक है',
    onboardingLockedDesc: 'वीव365 का फुल ऑनबोर्डिंग फॉर्म सिर्फ वेरिफाइड सप्लायर्स के लिए ही है। कृपया पहले स्टेप 1 (रिव्यू के लिए प्रोडक्ट्स भेजें) को पूरा करें। वेरिफिकेशन के बाद, स्टेप 3 खोलने के लिए अपना नंबर डालें।',
    paymentTermsRequired: 'पेमेंट एग्रीमेंट साइन करना ज़रूरी है',
    paymentTermsReqDesc: 'स्टेप 3 (ऑनबोर्डिंग फॉर्म) आपके द्वारा स्टेप 2 (पेमेंट की शर्तें और रिटर्न पॉलिसी) को पूरा करने और सहमत होने के बाद ही खुलेगा।',
    goReviewPaymentTermsBtn: 'स्टेप 2 पर जाएं — पेमेंट की शर्तें देखें',
    step3of3: 'वीव 365 · विक्रेता ऑनबोर्डिंग · स्टेप 3 का 3',
    onboardingFormTitle: 'विक्रेता (सप्लायर) ऑनबोर्डिंग फॉर्म',
    onboardingFormDesc: 'सभी सेक्शन को पूरा भरें। वीव 365 टीम के वेरिफिकेशन के बाद आपकी लिस्टिंग लाइव हो जाएगी।',
    secAPersonalDetails: 'क. पर्सनल डिटेल्स (व्यक्तिगत जानकारी)',
    fullNameLabel: 'पूरा नाम',
    asPerAadhaarPan: 'आधार कार्ड या पैन कार्ड के अनुसार',
    whatsappLabel: 'व्हाट्सएप नंबर',
    emailLabel: 'ईमेल पता',
    altContactLabel: 'दूसरा कांटेक्ट नंबर (वैकल्पिक)',
    secBBusinessDetails: 'ख. बिज़नेस डिटेल्स (व्यवसाय की जानकारी)',
    businessShopName: 'बिज़नेस का नाम',
    tradeNamePlaceholder: 'दुकान या फर्म का नाम',
    businessTypeLabel: 'व्यवसाय में भूमिका',
    businessTypeSelect: 'चुनें',
    businessTypeOpt1: 'बुनकर (Weaver)',
    businessTypeOpt2: 'मास्टर बुनकर (Master Weaver)',
    businessTypeOpt3: 'निर्माता (Manufacturer)',
    businessTypeOpt4: 'थोक विक्रेता (Wholesaler)',
    businessTypeOpt5: 'रिटेलर / फुटकर विक्रेता (Retailer)',
    businessAddressLabel: 'दुकान/कारखाने का पता',
    shopUnitAddressPlaceholder: 'गली, दुकान या यूनिट नंबर',
    cityPlaceholderStep3: 'शहर',
    pincodePlaceholderStep3: 'पिनकोड',
    gstLabelStep3: 'जीएसटी नंबर (GST - यदि हो तो)',
    panLabelStep3: 'पैन कार्ड नंबर',
    yearsInBusinessLabel: 'काम का अनुभव (कितने साल से कर रहे हैं)',
    yearsSelectPlaceholder: 'चुनें',
    yearsOpt1: '1 साल से कम',
    yearsOpt2: '1 – 3 साल',
    yearsOpt3: '3 – 7 साल',
    yearsOpt4: '7 – 15 साल',
    yearsOpt5: '15 साल से ज़्यादा',
    secCProductDetailsStep3: 'ग. प्रोडक्ट डिटेल्स',
    categoriesStep3Label: 'कैटेगरीज़ जो आप बनाते/बेचते हैं (सभी सही विकल्पों पर टिक करें)',
    pricePerPiece: 'एक पीस की होलसेल प्राइस रेंज',
    monthlyCapacityStep3: '1 महीने में सप्लाई करने की कैपेसिटी',
    monthlyOpt1: '20 पीस तक',
    monthlyOpt2: '20 – 50 पीस',
    monthlyOpt3: '50 – 100 पीस',
    monthlyOpt4: '100 – 300 पीस',
    monthlyOpt5: '300 पीस से ज़्यादा',
    fabricSpecialisation: 'कपड़ा / बुनाई की खासियत (जैसे: कतान सिल्क, जॉर्जेट, ऑर्गेन्जा, चंदेरी)',
    specialisationPlaceholder: 'अपने कपड़े/बुनाई की खासियत बताएं',
    secDDispatchOps: 'घ. डिस्पैच और काम करने का समय',
    dispatchTimelineLabel: 'ऑर्डर आने के कितने समय बाद पार्सल भेजेंगे (डिस्पैच टाइम)',
    dispatchOpt1: 'उसी दिन (Same Day)',
    dispatchOpt2: '1 वर्किंग डे में',
    dispatchOpt3: '2 वर्किंग डेज़ में',
    dispatchOpt4: '3 वर्किंग डेज़ में',
    preferredCourierLabel: 'पसंदीदा कूरियर पार्टनर',
    courierOpt1: 'Delhivery',
    courierOpt2: 'Blue Dart',
    courierOpt3: 'DTDC',
    courierOpt4: 'India Post (सरकारी डाक)',
    courierOpt5: 'Shiprocket',
    courierOpt6: 'कोई प्राथमिकता नहीं',
    dispatchLocationRadio: 'डिस्पैच का पता (क्या पिकअप का पता दुकान के पते जैसा ही है?)',
    yesSameAddress: 'हाँ, वही पता है',
    differentAddress: 'नहीं, अलग पता है',
    pickupAddressPlaceholder: 'पिकअप / पार्सल भेजने का पता',
    secEBankDetails: 'ङ. बैंक डिटेल्स (बैंक खाते की जानकारी)',
    forPaymentDisbursal: 'पेमेंट सीधे बैंक में भेजने के लिए',
    accountHolderName: 'खाताधारक का नाम',
    asPerBankRecords: 'बैंक पासबुक के अनुसार',
    bankNameLabel: 'बैंक का नाम',
    bankNamePlaceholder: 'जैसे: SBI, HDFC, ICICI, Axis',
    accountNumberLabel: 'अकाउंट (खाता) नंबर',
    accountNumberPlaceholder: 'खाता संख्या यहाँ दर्ज करें',
    ifscLabel: 'आईएफएससी (IFSC) कोड',
    ifscPlaceholder: 'जैसे: SBIN0001234',
    upiLabel: 'यूपीआई आईडी (UPI ID - वैकल्पिक - जल्दी पेमेंट के लिए)',
    upiPlaceholder: 'yourname@upi',
    bankInfoText: 'गलत बैंक डिटेल्स देने की वजह से पेमेंट रुकने पर वीव 365 की कोई जिम्मेदारी नहीं होगी। कृपया एक बार दोबारा जांच लें।',
    secFIdentityVerification: 'च. पहचान और डॉक्यूमेंट्स वेरिफिकेशन',
    aadhaarLabel: 'आधार कार्ड नंबर',
    aadhaarPlaceholder: 'XXXX XXXX XXXX',
    panVerifyLabel: 'पैन कार्ड नंबर',
    panVerifyPlaceholder: 'AAAAA0000A',
    aadhaarUploadLabel: 'आधार कार्ड / आईडी प्रूफ अपलोड करें',
    chequeUploadLabel: 'कैंसिल चेक (Cancelled Cheque) अपलोड करें',
    fileUploadSpecs: 'JPG, PNG या PDF, ज़्यादा से ज़्यादा 2MB',
    uploadedSuccessAadhaar: '✓ आधार कार्ड अपलोड हो गया',
    uploadedSuccessCheque: '✓ चेक अपलोड हो गया',
    declarationCheckbox: 'मैं पुष्टि करता हूँ कि दी गई सभी जानकारी बिल्कुल सही है। मैंने स्टेप 2 में पेमेंट की शर्तें और रिटर्न पॉलिसी पढ़ ली हैं और मैं उनसे पूरी तरह सहमत हूँ। गलत जानकारी देने पर हमेशा के लिए ब्लैकलिस्ट किया जा सकता है।',
    submitOnboardingFormBtn: 'ऑनबोर्डिंग फॉर्म सबमिट करें →',
    submittingOnboardingForm: 'ऑनबोर्डिंग फॉर्म सबमिट हो रहा है...',
    step3Footer: 'डॉक्यूमेंट्स वेरिफिकेशन के बाद खाता एक्टिव होने में 3 से 5 वर्किंग डेज़ लगते हैं।',
    onboardingSuccessTitle: 'अप्लाई करने के लिए बहुत-बहुत धन्यवाद!',
    onboardingSuccessDesc: 'हमें आपका ऑनबोर्डिंग फॉर्म और डॉक्यूमेंट्स मिल गए हैं। हमारी टीम जल्द ही आपके अकाउंट को वेरिफाई करके एक्टिवेट कर देगी।',
    onboardingSuccessSub: 'डॉक्यूमेंट्स वेरिफिकेशन के बाद खाता एक्टिव होने में 3 से 5 वर्किंग डेज़ लगते हैं।',
    agreementSigned: 'एग्रीमेंट साइन हो गया',
    agreementSignedDesc: 'आपका बी2बी मर्चेंट एग्रीमेंट साइन हो गया है। कृपया आगे बढ़ने के लिए अपने रिकॉर्ड के लिए कॉपी डाउनलोड करें।',
    downloadBtn: 'एग्रीमेंट डाउनलोड करें',
    savingDownloading: 'डाउनलोड हो रहा है...',
    goBack: 'वापस जाएं',
    heroTitleText: 'विश्वसनीय पार्टनर रजिस्ट्रेशन',
    heroDescText: 'वीव 365 टीम द्वारा रिव्यू के लिए अपने काम, कैपेसिटी और प्रोडक्ट की जानकारी यहाँ भेजें।',
    catSaree: 'साड़ी',
    catSuit: 'सूट',
    catDupatta: 'दुपट्टा',
    catLehenga: 'लहंगा',
    catFabric: 'कपड़ा (फैब्रिक)',
    catAccessories: 'एक्सेसरीज़',
    catSarees: 'साड़ियाँ',
    catSuits: 'सूट',
    catDupattas: 'दुपट्टे',
    catLehengas: 'लहंगे',
    catFabrics: 'कपड़ा (फैब्रिक)',
    catAccessoriesPlural: 'एक्सेसरीज़',
    priceOptSelect: 'चुनें',
    priceOptUnder500: '₹500 से कम',
    priceOpt500_999: '₹500 – ₹999',
    priceOpt1000_1999: '₹1,000 – ₹1,999',
    priceOpt2000_4999: '₹2,000 – ₹4,999',
    priceOpt5000_9999: '₹5,000 – ₹9,999',
    priceOpt10000Plus: '₹10,000 से ज़्यादा',
    dispatchOptSelect: 'चुनें',
    dispatchOptSameDay: 'उसी दिन (Same Day)',
    dispatchOpt1Day: '1 वर्किंग डे में',
    dispatchOpt2Days: '2 वर्किंग डेज़ में',
    dispatchOpt3Days: '3 वर्किंग डेज़ में',
    courierOptSelect: 'चुनें',
    courierOptDelhivery: 'Delhivery',
    courierOptBlueDart: 'Blue Dart',
    courierOptDtdc: 'DTDC',
    courierOptIndiaPost: 'India Post (सरकारी डाक)',
    courierOptShiprocket: 'Shiprocket',
    courierOptNoPref: 'कोई प्राथमिकता नहीं',
  }
};

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
  
  // Language state & helper
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('weave365_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

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
                        <AlertCircle size={16} />
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
                    {t('confirmPhotosAuth')}
                  </label>

                  <button type="submit" className="vendor-submit-button" disabled={reviewSubmitting}>
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
                      <div className="vendor-form-error" role="alert" style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                        <AlertCircle size={18} />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    <button type="submit" className="onboarding-submit-button" disabled={paymentSubmitting}>
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
                              <input type="text" value={onboardingForm.panNumber} onChange={(e) => setOnboardingForm(prev => ({ ...prev, panNumber: e.target.value.toUpperCase().slice(0, 10) }))} placeholder="AAAAA0000A" maxLength="10" required className="step3-input" />
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
                            <input type="text" value={onboardingForm.fabricSpecialisation} onChange={(e) => setOnboardingForm(prev => ({ ...prev, fabricSpecialisation: e.target.value }))} placeholder={t('specialisationPlaceholder')} required className="step3-input" />
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
                              <input type="text" value={onboardingForm.panNumberVerify} onChange={(e) => setOnboardingForm(prev => ({ ...prev, panNumberVerify: e.target.value.toUpperCase().slice(0, 10) }))} placeholder={t('panVerifyPlaceholder')} maxLength="10" required className="step3-input" />
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
                      <div className="vendor-form-error" role="alert" style={{ marginTop: '16px' }}>
                        <AlertCircle size={18} />
                        <span>{onboardingError}</span>
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

                    <button type="submit" className="onboarding-submit-button" disabled={onboardingSubmitting} style={{ marginTop: '20px' }}>
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
    </div>
  );
}
