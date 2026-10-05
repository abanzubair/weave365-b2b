/**
 * @file SignupPage.jsx
 * @description Dedicated Signup & Authentication Page matching the modern split-screen
 * mesh-gradient design. Implements the new 3-way Signup Entry Flow:
 * - Business: Qualification Form (5 Questions) -> Account Creation
 * - Customer: Direct Account Creation
 * - Supplier: Supplier / Vendor Onboarding (Sections 5.1-5.4) -> Account Creation
 */
'use client';
import '../styles/signupPage.css';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Store,
  AlertCircle,
  Loader2,
} from '../components/icons.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { normalizePincodeInput } from '../storefrontShared.jsx';
import { WhatsappIcon } from '../components/WhatsappIcon.jsx';
import { syncProfileFromUser, loadProfileForUser, isProfileComplete } from '../utils/profileHelpers.js';
import { applyAutoApprovalToBuyerProfile } from '../utils/buyerAccess.js';
import { clearCachedAuth } from '../utils/authCache.js';

import { RoleEntryCards } from '../components/signup/RoleEntryCards.jsx';
import { BusinessQualificationForm } from '../components/signup/BusinessQualificationForm.jsx';
import { SupplierOnboardingForm } from '../components/signup/SupplierOnboardingForm.jsx';
import {
  BUSINESS_TYPES,
  INITIAL_BUSINESS_FORM,
  INITIAL_SUPPLIER_FORM,
  validateBusinessQualification,
  validateSupplierQualification,
} from '../components/signup/signupConstants.js';

const countryCodes = [
  { value: '+91', label: 'India +91' },
  { value: '+1', label: 'USA / Canada +1' },
  { value: '+44', label: 'UK +44' },
  { value: '+971', label: 'UAE +971' },
  { value: '+65', label: 'Singapore +65' },
  { value: '+60', label: 'Malaysia +60' },
  { value: '+61', label: 'Australia +61' },
  { value: '+974', label: 'Qatar +974' },
  { value: '+966', label: 'Saudi Arabia +966' },
  { value: '+965', label: 'Kuwait +965' },
];

function toTitleCaseName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function LegalDisclaimer() {
  return (
    <p className="signup-legal-disclaimer">
      By continuing, you agree to our{' '}
      <a href="/terms-conditions" target="_blank" rel="noopener noreferrer">
        Terms & Conditions
      </a>
      .
    </p>
  );
}

function GoogleButton({ onClick, text = "Continue with Google" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="signup-google-btn"
      aria-label={text}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{text}</span>
    </button>
  );
}

export function SignupPage({
  user,
  setUser,
  buyerProfile,
  setBuyerProfile,
  navigate,
  initialMode = 'login',
  initialType = null,
}) {
  const profileComplete = isProfileComplete(user, buyerProfile);
  const isResettingPassword = initialMode === 'reset-password' ||
    (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'));

  const isOnboarding = Boolean(
    !isResettingPassword &&
    initialMode !== 'forgot-password' &&
    user &&
    (!profileComplete || initialMode === 'complete-profile' || initialMode === 'completion-profile')
  );

  const [mode, setMode] = useState(() => {
    if (isResettingPassword) return 'reset-password';
    if (isOnboarding) return 'complete-profile';
    if (initialMode === 'complete-profile' || initialMode === 'completion-profile') return 'login';
    return initialMode || 'login';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ---------------------------------------------------------------------------
  // NEW SIGNUP FLOW STATE
  // ---------------------------------------------------------------------------
  const [selectedUserType, setSelectedUserType] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('weave365_signup_flow');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.selectedUserType) return parsed.selectedUserType;
        }
      } catch {}
    }
    if (initialType) {
      const lower = String(initialType).toLowerCase().trim();
      if (lower === 'partner' || lower === 'vendor' || lower === 'seller' || lower === 'supplier') {
        return 'supplier';
      }
      if (lower === 'customer' || lower === 'buyer' || lower === 'user') {
        return 'customer';
      }
      return 'business';
    }
    return null;
  }); // 'business' | 'customer' | 'supplier' | null

  const [signupStep, setSignupStep] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('weave365_signup_flow');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.signupStep) return parsed.signupStep;
        }
      } catch {}
    }
    if (initialType) {
      const lower = String(initialType).toLowerCase().trim();
      if (lower === 'partner' || lower === 'vendor' || lower === 'seller' || lower === 'supplier') {
        return 'supplier-qualification';
      }
      if (lower === 'customer' || lower === 'buyer' || lower === 'user') {
        return 'account-form';
      }
      return 'business-qualification';
    }
    return 'select-type';
  }); // 'select-type' | 'business-qualification' | 'supplier-qualification' | 'account-form'

  const [businessForm, setBusinessForm] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('weave365_signup_flow');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.businessForm) return { ...INITIAL_BUSINESS_FORM, ...parsed.businessForm };
        }
      } catch {}
    }
    if (initialType) {
      const lower = String(initialType).toLowerCase().trim();
      const matched = BUSINESS_TYPES.find(b => b.id === lower || b.subtype.toLowerCase() === lower);
      if (matched) {
        return { ...INITIAL_BUSINESS_FORM, business_type: matched.id };
      }
    }
    return { ...INITIAL_BUSINESS_FORM };
  });

  const [supplierForm, setSupplierForm] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('weave365_signup_flow');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.supplierForm) return { ...INITIAL_SUPPLIER_FORM, ...parsed.supplierForm };
        }
      } catch {}
    }
    return { ...INITIAL_SUPPLIER_FORM };
  });

  const [qualValidationError, setQualValidationError] = useState('');
  const [qualErrorField, setQualErrorField] = useState('');

  // Standard Account Profile fields
  const [profile, setProfile] = useState({
    fullName: '',
    countryCode: '+91',
    whatsapp: '',
    businessName: '',
    website: '',
    socialHandle: '',
    buyerType: '',
    buyerSubtype: '',
    buyingBehavior: 'instant',
    city: '',
    state: '',
    pincode: '',
    interestedCategories: ['Saree'],
    rememberMe: false,
  });

  // Sync draft to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        'weave365_signup_flow',
        JSON.stringify({
          selectedUserType,
          signupStep,
          businessForm,
          supplierForm,
        })
      );
    } catch {}
  }, [selectedUserType, signupStep, businessForm, supplierForm]);

  // Sync initial type when passed via props / query params
  useEffect(() => {
    if (initialType) {
      const lower = String(initialType).toLowerCase().trim();
      if (lower === 'partner' || lower === 'vendor' || lower === 'seller' || lower === 'supplier') {
        setSelectedUserType('supplier');
        setSignupStep('supplier-qualification');
        setProfile((prev) => ({ ...prev, buyerType: 'vendor', buyerSubtype: 'Supplier' }));
      } else if (lower === 'customer' || lower === 'buyer' || lower === 'user') {
        setSelectedUserType('customer');
        setSignupStep('account-form');
        setProfile((prev) => ({ ...prev, buyerType: 'customer', buyerSubtype: 'Customer' }));
      } else {
        setSelectedUserType('business');
        const matched = BUSINESS_TYPES.find(
          (b) =>
            b.id === lower ||
            b.subtype.toLowerCase() === lower ||
            (lower === 'website_owner' && b.id === 'online_store') ||
            (lower === 'website owner' && b.id === 'online_store')
        );
        if (matched) {
          setBusinessForm((prev) => ({ ...prev, business_type: matched.id }));
          setProfile((prev) => ({ ...prev, buyerSubtype: matched.subtype, buyerType: 'customer' }));
        }
        setSignupStep('business-qualification');
      }
    }
  }, [initialType]);

  async function handleSignOut() {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      clearCachedAuth();
      if (setUser) setUser(null);
      if (setBuyerProfile) setBuyerProfile(null);
      setEmail('');
      setPassword('');
      setProfile((prev) => ({
        ...prev,
        website: '',
        socialHandle: '',
        buyerType: '',
        buyerSubtype: '',
      }));
      setMode('login');
      setMessage('');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/signup');
      }
      if (navigate) {
        navigate('signup');
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Pre-fill authenticated Google/User info & auto-complete pending registration if present
  useEffect(() => {
    if (!user) return;

    if (user.email) {
      setEmail(user.email);
    }
    const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    if (googleName) {
      setProfile((prev) => ({
        ...prev,
        fullName: prev.fullName || toTitleCaseName(googleName),
      }));
    }

    const existingBuyerProfile = buyerProfile || user.user_metadata?.buyer_profile;
    if (existingBuyerProfile) {
      setProfile((prev) => ({
        ...prev,
        website: prev.website || existingBuyerProfile.website || '',
        socialHandle: prev.socialHandle || existingBuyerProfile.social_handle || existingBuyerProfile.socialHandle || '',
      }));
    }

    // Check if user completed the registration form before clicking "Sign up with Google"
    const pendingRaw = typeof window !== 'undefined' ? localStorage.getItem('pending_b2b_profile') : null;
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        localStorage.removeItem('pending_b2b_profile');

        const cleanName = pending.fullName || toTitleCaseName(googleName || '');
        const cleanWhatsapp = String(pending.whatsapp || '').replace(/\D/g, '').slice(0, 10);
        const cleanPincode = normalizePincodeInput(pending.pincode);

        if (cleanName && cleanWhatsapp.length === 10 && pending.city && cleanPincode.length === 6) {
          const isVendor = pending.buyerType === 'vendor' || pending.buyerSubtype === 'Vendor' || pending.user_type === 'supplier';
          const newProfile = {
            id: user.id,
            email: user.email,
            full_name: cleanName,
            business_name: pending.businessName || '',
            website: (pending.website || '').trim(),
            social_handle: (pending.socialHandle || pending.social_handle || '').trim(),
            whatsapp: cleanWhatsapp,
            whatsapp_country_code: pending.countryCode || '+91',
            whatsapp_number: cleanWhatsapp,
            user_type: pending.user_type || (isVendor ? 'supplier' : 'customer'),
            qualification: pending.qualification || null,
            buyer_type: isVendor ? 'vendor' : (pending.buyerType || 'customer'),
            buyer_subtype: pending.buyerSubtype || (isVendor ? 'Vendor' : 'Customer'),
            role: isVendor ? 'vendor' : 'customer',
            city: pending.city,
            state: pending.state,
            pincode: cleanPincode,
            interested_categories: pending.interestedCategories || ['Saree'],
            buying_behavior: 'instant',
            approval_status: 'approved',
            price_group: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          (async () => {
            setLoading(true);
            if (isSupabaseConfigured) {
              await supabase.auth.updateUser({
                data: {
                  buyer_profile: newProfile,
                  user_type: newProfile.user_type,
                  qualification: newProfile.qualification,
                  role: isVendor ? 'vendor' : 'customer',
                  full_name: cleanName,
                },
              });
              await syncProfileFromUser({ ...user, user_metadata: { ...user.user_metadata, buyer_profile: newProfile } });
            }
            if (setBuyerProfile) setBuyerProfile(newProfile);
            setLoading(false);
            if (navigate) {
              navigate(isVendor ? 'account' : 'home');
            }
          })();
          return;
        }
      } catch (e) {
        console.error('Error applying pending registration:', e);
      }
    }

    // Do NOT hijack mode to complete-profile if resetting password or viewing forgot password
    if (
      mode === 'reset-password' ||
      initialMode === 'reset-password' ||
      mode === 'forgot-password' ||
      initialMode === 'forgot-password' ||
      (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
    ) {
      return;
    }

    if (!isProfileComplete(user, buyerProfile)) {
      setMode('complete-profile');
    }
  }, [user, buyerProfile, initialMode, mode, navigate, setBuyerProfile]);

  useEffect(() => {
    if (isOnboarding || mode === 'complete-profile') {
      document.title = 'Complete Your Profile - Weave 365';
    } else {
      document.title = mode === 'register' ? 'Weave 365 Sign-up' : 'Weave 365 Sign-in';
    }
  }, [mode, isOnboarding]);

  useEffect(() => {
    if (initialMode) {
      if (initialMode === 'reset-password') {
        setMode('reset-password');
      } else if (!user) {
        setMode(
          initialMode === 'complete-profile' || initialMode === 'completion-profile'
            ? 'login'
            : initialMode
        );
      }
    }
  }, [initialMode, user]);

  function updateProfile(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  // ---------------------------------------------------------------------------
  // STEP NAVIGATION HANDLERS (ENFORCING BYPASS PREVENTION)
  // ---------------------------------------------------------------------------
  function handleSelectUserType(typeId) {
    setSelectedUserType(typeId);
    setQualValidationError('');
    setQualErrorField('');

    if (typeId === 'customer') {
      setProfile((prev) => ({
        ...prev,
        buyerType: 'customer',
        buyerSubtype: 'Customer',
      }));
      setSignupStep('account-form');
    } else if (typeId === 'business') {
      setProfile((prev) => ({
        ...prev,
        buyerType: 'customer',
      }));
      setSignupStep('business-qualification');
    } else if (typeId === 'supplier') {
      setProfile((prev) => ({
        ...prev,
        buyerType: 'vendor',
        buyerSubtype: 'Supplier',
      }));
      setSignupStep('supplier-qualification');
    }
  }

  function handleContinueBusinessQualification() {
    const val = validateBusinessQualification(businessForm);
    if (!val.isValid) {
      setQualValidationError(val.error);
      setQualErrorField(val.field);
      return;
    }
    setQualValidationError('');
    setQualErrorField('');

    const matched = BUSINESS_TYPES.find((b) => b.id === businessForm.business_type);
    setProfile((prev) => ({
      ...prev,
      buyerSubtype: matched?.subtype || 'Wholesaler',
      buyerType: 'customer',
    }));
    setSignupStep('account-form');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleContinueSupplierQualification() {
    const val = validateSupplierQualification(supplierForm);
    if (!val.isValid) {
      setQualValidationError(val.error);
      setQualErrorField(val.field);
      return;
    }
    setQualValidationError('');
    setQualErrorField('');

    // Pre-populate account details from supplier answers
    setProfile((prev) => ({
      ...prev,
      fullName: supplierForm.contact_person || prev.fullName,
      businessName: supplierForm.business_name || prev.businessName,
      city: supplierForm.location_city || prev.city,
      whatsapp: String(supplierForm.phone || '').replace(/\D/g, '').slice(0, 10) || prev.whatsapp,
      website: (supplierForm.ecommerce_website || '').trim() || prev.website,
      socialHandle: (supplierForm.instagram || '').trim() || prev.socialHandle,
      buyerType: 'vendor',
      buyerSubtype: supplierForm.business_type || 'Supplier',
    }));
    if (supplierForm.business_email) {
      setEmail(supplierForm.business_email);
    }
    setSignupStep('account-form');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleBackToRoleSelection() {
    setSignupStep('select-type');
    setQualValidationError('');
    setQualErrorField('');
  }

  function handleBackFromAccountForm() {
    if (selectedUserType === 'business') {
      setSignupStep('business-qualification');
    } else if (selectedUserType === 'supplier') {
      setSignupStep('supplier-qualification');
    } else {
      setSignupStep('select-type');
    }
    setQualValidationError('');
    setQualErrorField('');
  }

  // ---------------------------------------------------------------------------
  // PROFILE BUILDER
  // ---------------------------------------------------------------------------
  function buildBuyerProfile() {
    const isVendor = selectedUserType === 'supplier';
    const cleanName = toTitleCaseName(
      isVendor ? (supplierForm.contact_person || profile.fullName) : profile.fullName
    );
    const cleanWhatsapp = String(
      isVendor ? (supplierForm.phone || profile.whatsapp) : (profile.whatsapp || '')
    ).replace(/\D/g, '').slice(0, 10);
    const cleanCity = (
      isVendor ? (supplierForm.location_city || profile.city) : (profile.city || '')
    ).trim();
    const cleanBusinessName = (
      isVendor ? (supplierForm.business_name || profile.businessName) : (profile.businessName || '')
    ).trim();
    const cleanWebsite = (
      isVendor ? (supplierForm.ecommerce_website || profile.website) : (profile.website || '')
    ).trim();
    const cleanSocial = (
      isVendor ? (supplierForm.instagram || profile.socialHandle) : (profile.socialHandle || '')
    ).trim();

    let buyerSubtype = 'Customer';
    if (selectedUserType === 'business') {
      const matched = BUSINESS_TYPES.find((b) => b.id === businessForm.business_type);
      buyerSubtype = matched?.subtype || profile.buyerSubtype || 'Wholesaler';
    } else if (selectedUserType === 'supplier') {
      buyerSubtype = supplierForm.business_type || 'Supplier';
    } else {
      buyerSubtype = 'Customer';
    }

    const qualificationData = selectedUserType === 'business'
      ? {
          ...businessForm,
          user_type: 'business',
          business_type_label: BUSINESS_TYPES.find((b) => b.id === businessForm.business_type)?.label || 'Wholesaler',
        }
      : selectedUserType === 'supplier'
        ? {
            ...supplierForm,
            user_type: 'supplier',
          }
        : null;

    return applyAutoApprovalToBuyerProfile({
      full_name: cleanName,
      whatsapp: `${profile.countryCode} ${cleanWhatsapp}`,
      whatsapp_country_code: profile.countryCode,
      whatsapp_number: cleanWhatsapp,
      business_name: cleanBusinessName,
      website: cleanWebsite,
      social_handle: cleanSocial,
      user_type: selectedUserType || (isVendor ? 'supplier' : 'customer'),
      qualification: qualificationData,
      buyer_type: isVendor ? 'vendor' : 'customer',
      buyer_subtype: buyerSubtype,
      role: isVendor ? 'vendor' : 'customer',
      buying_behavior: profile.buyingBehavior || 'instant',
      city: cleanCity,
      state: profile.state?.trim() || '',
      pincode: normalizePincodeInput(profile.pincode),
      interested_categories: isVendor ? (supplierForm.supplied_products || ['Saree']) : (profile.interestedCategories || ['Saree']),
      price_group: 'approved',
      approval_status: 'approved',
    });
  }

  async function checkEmailExists(inputEmail) {
    const clean = String(inputEmail || '').trim().toLowerCase();
    if (!clean) return false;

    try {
      const res = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data?.exists);
      }
    } catch (e) {
      console.warn('API check-email error:', e);
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', clean)
          .maybeSingle();
        if (!error && data) return true;
      } catch (e) {
        console.warn('Client supabase email check error:', e);
      }
    }

    return false;
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setMessage('');

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setMessage('Please enter your email address.');
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage('Password reset is temporarily unavailable.');
      return;
    }

    const exists = await checkEmailExists(cleanEmail);
    if (!exists) {
      setMessage('account-not-found');
      return;
    }

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/signup?mode=reset-password`
      : 'https://www.weave365.com/signup?mode=reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('reset-link-sent');
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setMessage('');

    if (!newPassword || newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage('Password update is temporarily unavailable.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage(error.message);
    } else {
      await supabase.auth.signOut().catch(() => {});
      if (setUser) setUser(null);
      if (setBuyerProfile) setBuyerProfile(null);
      setMessage('Password updated successfully! Please sign in with your new password.');
      setTimeout(() => {
        setMode('login');
        setNewPassword('');
        setMessage('');
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/signup?mode=login');
        }
      }, 1500);
    }
  }

  async function handleSocialLogin(provider) {
    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/signup?mode=complete-profile` : undefined,
          },
        });
      } catch (err) {
        setMessage(err.message || 'Social login failed.');
        setLoading(false);
      }
    } else {
      setMessage('Social login is temporarily unavailable.');
    }
  }

  // ---------------------------------------------------------------------------
  // GOOGLE REGISTRATION (WITH STRICT BYPASS PREVENTION)
  // ---------------------------------------------------------------------------
  function handleGoogleRegister() {
    if (!selectedUserType) {
      setMessage('Please select which best describes you.');
      setSignupStep('select-type');
      return;
    }

    if (selectedUserType === 'business') {
      const bVal = validateBusinessQualification(businessForm);
      if (!bVal.isValid) {
        setQualValidationError(bVal.error);
        setQualErrorField(bVal.field);
        setSignupStep('business-qualification');
        return;
      }
    } else if (selectedUserType === 'supplier') {
      const sVal = validateSupplierQualification(supplierForm);
      if (!sVal.isValid) {
        setQualValidationError(sVal.error);
        setQualErrorField(sVal.field);
        setSignupStep('supplier-qualification');
        return;
      }
    }

    const cleanName = toTitleCaseName(profile.fullName);
    const cleanWhatsapp = String(profile.whatsapp || '').replace(/\D/g, '').slice(0, 10);
    const cleanPincode = normalizePincodeInput(profile.pincode);

    if (
      !cleanName ||
      !profile.city.trim() ||
      !profile.state.trim() ||
      cleanWhatsapp.length !== 10 ||
      cleanPincode.length !== 6
    ) {
      setMessage(
        'Please enter your Full Name, 10-digit WhatsApp number, City, State, and 6-digit Pincode above to continue with Google.'
      );
      return;
    }

    const isVendor = selectedUserType === 'supplier';
    const buyerSubtype = selectedUserType === 'business'
      ? (BUSINESS_TYPES.find((b) => b.id === businessForm.business_type)?.subtype || 'Wholesaler')
      : selectedUserType === 'supplier'
        ? (supplierForm.business_type || 'Supplier')
        : 'Customer';

    const qualificationData = selectedUserType === 'business'
      ? {
          ...businessForm,
          user_type: 'business',
          business_type_label: BUSINESS_TYPES.find((b) => b.id === businessForm.business_type)?.label || 'Wholesaler',
        }
      : selectedUserType === 'supplier'
        ? {
            ...supplierForm,
            user_type: 'supplier',
          }
        : null;

    const pendingProfile = {
      fullName: cleanName,
      whatsapp: cleanWhatsapp,
      countryCode: profile.countryCode || '+91',
      businessName: profile.businessName || '',
      website: (profile.website || '').trim(),
      socialHandle: (profile.socialHandle || '').trim(),
      user_type: selectedUserType,
      qualification: qualificationData,
      buyerType: isVendor ? 'vendor' : 'customer',
      buyerSubtype: buyerSubtype,
      role: isVendor ? 'vendor' : 'customer',
      city: profile.city.trim(),
      state: profile.state.trim(),
      pincode: cleanPincode,
      interestedCategories: isVendor ? (supplierForm.supplied_products || ['Saree']) : (profile.interestedCategories || ['Saree']),
    };

    try {
      localStorage.setItem('pending_b2b_profile', JSON.stringify(pendingProfile));
    } catch (e) {
      console.error('Storage error:', e);
    }

    handleSocialLogin('google');
  }

  const cleanSellerName = profile.fullName || supplierForm.contact_person || '';
  const cleanSellerBusiness = profile.businessName || supplierForm.business_name || '';
  const cleanSellerPhone = profile.whatsapp || supplierForm.phone || '';
  const cleanSellerCity = profile.city || supplierForm.location_city || '';

  const sellerWaMessage = [
    'Hello Weave 365 Onboarding Team,',
    '',
    'I have just registered as a Seller on Weave 365:',
    cleanSellerName ? `• Name: ${cleanSellerName}` : null,
    cleanSellerBusiness ? `• Business / Loom: ${cleanSellerBusiness}` : null,
    cleanSellerPhone ? `• Phone: ${cleanSellerPhone}` : null,
    cleanSellerCity ? `• Location: ${cleanSellerCity}` : null,
    '',
    'I would like to fast-track my verification and discuss listing my product collection.'
  ].filter(Boolean).join('\n');

  const sellerWaUrl = `https://wa.me/919919101369?text=${encodeURIComponent(sellerWaMessage)}`;

  // ---------------------------------------------------------------------------
  // FORM SUBMISSION (WITH COMPLETE BYPASS ENFORCEMENT)
  // ---------------------------------------------------------------------------
  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'forgot-password') {
        await handleForgotPassword(event);
        setLoading(false);
        return;
      }

      if (mode === 'reset-password') {
        await handleResetPassword(event);
        setLoading(false);
        return;
      }

      // Handle Post-Google Onboarding / Complete Profile
      if (mode === 'complete-profile') {
        if (!selectedUserType) {
          setMessage('Please select which best describes you.');
          setSignupStep('select-type');
          setLoading(false);
          return;
        }

        if (selectedUserType === 'business') {
          const bVal = validateBusinessQualification(businessForm);
          if (!bVal.isValid) {
            setQualValidationError(bVal.error);
            setQualErrorField(bVal.field);
            setSignupStep('business-qualification');
            setLoading(false);
            return;
          }
        } else if (selectedUserType === 'supplier') {
          const sVal = validateSupplierQualification(supplierForm);
          if (!sVal.isValid) {
            setQualValidationError(sVal.error);
            setQualErrorField(sVal.field);
            setSignupStep('supplier-qualification');
            setLoading(false);
            return;
          }
        }

        const cleanName = toTitleCaseName(profile.fullName);
        const cleanWhatsapp = String(profile.whatsapp || '').replace(/\D/g, '').slice(0, 10);

        if (
          !cleanName ||
          !profile.city.trim() ||
          !profile.state.trim() ||
          cleanWhatsapp.length !== 10 ||
          normalizePincodeInput(profile.pincode).length !== 6
        ) {
          setMessage(
            'Please complete every required field. WhatsApp number must be 10 digits, pincode must be 6 digits.'
          );
          setLoading(false);
          return;
        }

        const newProfile = buildBuyerProfile();
        const isVendor = newProfile.buyer_type === 'vendor' || newProfile.role === 'vendor';

        if (isSupabaseConfigured) {
          const { data: updatedAuth, error: authErr } = await supabase.auth.updateUser({
            data: {
              buyer_profile: newProfile,
              user_type: selectedUserType,
              qualification: newProfile.qualification,
              role: isVendor ? 'vendor' : 'customer',
              full_name: cleanName,
            },
          });

          if (authErr) {
            setMessage(authErr.message);
            setLoading(false);
            return;
          }

          const targetUser = updatedAuth?.user || user;
          if (setUser) setUser(targetUser);

          const profileResult = await syncProfileFromUser(targetUser);
          if (profileResult.error) {
            console.error('Profile sync error:', profileResult.error);
          }
        }

        if (setBuyerProfile) {
          setBuyerProfile(newProfile);
        }

        setMessage('Profile completed successfully! Redirecting...');
        setTimeout(() => {
          navigate(newProfile.buyer_type === 'vendor' ? 'account' : 'home');
        }, 700);
        return;
      }

      if (mode === 'register') {
        if (!selectedUserType) {
          setMessage('Please select which best describes you.');
          setSignupStep('select-type');
          setLoading(false);
          return;
        }

        if (selectedUserType === 'business') {
          const bVal = validateBusinessQualification(businessForm);
          if (!bVal.isValid) {
            setQualValidationError(bVal.error);
            setQualErrorField(bVal.field);
            setSignupStep('business-qualification');
            setLoading(false);
            return;
          }
        } else if (selectedUserType === 'supplier') {
          const sVal = validateSupplierQualification(supplierForm);
          if (!sVal.isValid) {
            setQualValidationError(sVal.error);
            setQualErrorField(sVal.field);
            setSignupStep('supplier-qualification');
            setLoading(false);
            return;
          }
        }

        const isVendor = selectedUserType === 'supplier';
        const cleanName = toTitleCaseName(
          isVendor ? (supplierForm.contact_person || profile.fullName) : profile.fullName
        );
        const cleanWhatsapp = String(
          isVendor ? (supplierForm.phone || profile.whatsapp) : (profile.whatsapp || '')
        ).replace(/\D/g, '').slice(0, 10);
        const cleanCity = (
          isVendor ? (supplierForm.location_city || profile.city) : (profile.city || '')
        ).trim();
        const cleanPincode = normalizePincodeInput(profile.pincode);

        if (
          !cleanName ||
          !cleanCity ||
          !profile.state.trim() ||
          cleanWhatsapp.length !== 10 ||
          cleanPincode.length !== 6
        ) {
          setMessage(
            isVendor
              ? 'Please enter your State and 6-digit Pincode to complete registration.'
              : 'Please complete every required field. WhatsApp number must be 10 digits, pincode must be 6 digits.'
          );
          setLoading(false);
          return;
        }

        if (selectedUserType === 'business' && !(profile.businessName || '').trim()) {
          setMessage('Please enter your Business / Store Name.');
          setLoading(false);
          return;
        }

        if (!password || password.length < 6) {
          setMessage('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        setProfile((current) => ({
          ...current,
          fullName: cleanName,
          whatsapp: cleanWhatsapp,
          city: cleanCity,
        }));
      }

      const registeredProfile = mode === 'register' ? buildBuyerProfile() : {};
      const isVendorRegister = selectedUserType === 'supplier' || registeredProfile.buyer_type === 'vendor' || registeredProfile.role === 'vendor';

      if (!isSupabaseConfigured) {
        setMessage('Authentication service is temporarily unavailable. Please try again later.');
        setLoading(false);
        return;
      }

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'https://www.weave365.com/';

      const authEmail = (selectedUserType === 'supplier' ? (supplierForm.business_email || email) : email).trim();

      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
            email: authEmail,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                buyer_profile: registeredProfile,
                user_type: selectedUserType,
                qualification: registeredProfile.qualification,
                role: isVendorRegister ? 'vendor' : 'customer',
                full_name: toTitleCaseName(profile.fullName),
              },
            },
          });

      if (result.error) {
        setMessage(result.error.message);
        setLoading(false);
      } else {
        if (mode === 'register') {
          localStorage.setItem('just_registered_b2b', 'true');

          if (result.data.user && setUser) {
            setUser(result.data.user);
          }
          await syncProfileFromUser(result.data.user);

          if (isVendorRegister) {
            setMessage('seller-registered');
            setLoading(false);
            return;
          }

          if (!result.data.session) {
            setMessage('verification-email-sent');
            setLoading(false);
          } else {
            navigate('home');
          }
        } else {
          const loggedUser = result.data.user;
          if (setUser) setUser(loggedUser);
          await syncProfileFromUser(loggedUser);
          const profileData = await loadProfileForUser(loggedUser);
          if (setBuyerProfile && profileData.profile) {
            setBuyerProfile(profileData.profile);
          }
          if (isProfileComplete(loggedUser, profileData.profile)) {
            navigate('home');
          } else {
            setMode('complete-profile');
            setLoading(false);
          }
        }
      }
    } catch (err) {
      setMessage(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="signup-page-wrapper">
      <div className="signup-container">
        {/* Left Side (Desktop) / Top Banner (Mobile): Modern Hero Card */}
        <div className="signup-hero-card">
          <div className="signup-hero-mobile-content">
            <h1 className="signup-hero-mobile-title">
              {mode === 'login'
                ? 'Welcome back'
                : mode === 'forgot-password'
                  ? 'Reset password'
                  : mode === 'reset-password'
                    ? 'Set new password'
                    : 'Create an account'}
            </h1>
          </div>

          <div className="signup-hero-bottom">
            <span className="signup-hero-subtag">Direct from Varanasi Weavers</span>
            <h1 className="signup-hero-headline">
              Source Authentic Banarasi Handloom at Direct Weaver Prices
            </h1>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="signup-form-panel">
          <div className="signup-form-inner">
            {/* Seller Registration Application Received State */}
            {message === 'seller-registered' ? (
              <div className="signup-status-card signup-seller-status-card">
                <div className="signup-status-icon signup-seller-status-icon">
                  <Store size={26} />
                </div>
                <h2 className="signup-status-title">Application Received</h2>
                <p className="signup-status-desc">
                  We'll review your loom and business details and reach out within <strong>2 business days</strong>.
                </p>

                <div className="signup-seller-fasttrack">
                  <span className="signup-seller-fasttrack-hint">
                    Need faster activation?
                  </span>
                  <a
                    href={sellerWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="signup-seller-whatsapp-btn"
                  >
                    <WhatsappIcon size={17} />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

                <button
                  type="button"
                  className="signup-seller-secondary-btn"
                  onClick={() => navigate('home')}
                >
                  Explore wholesale catalog →
                </button>
              </div>
            ) : message === 'verification-email-sent' ? (
              <div className="signup-status-card">
                <div className="signup-status-icon">
                  <Mail size={24} />
                </div>
                <h2 className="signup-status-title">Check your inbox</h2>
                <p className="signup-status-desc">
                  We sent a verification link to <strong style={{ color: '#0f172a' }}>{email}</strong>.
                  Please confirm your email address to activate your account and unlock factory wholesale pricing.
                </p>
                <button
                  type="button"
                  className="signup-submit-btn"
                  onClick={() => {
                    setMode('login');
                    setMessage('');
                  }}
                >
                  Back to Login <ArrowRight size={16} />
                </button>
              </div>
            ) : mode === 'forgot-password' ? (
              /* Forgot Password Mode */
              <div>
                <div className="signup-form-header">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setMessage(''); }}
                    className="signup-back-btn"
                  >
                    <ArrowLeft size={16} /> Back to Login
                  </button>
                  <h2 className="signup-form-title">Reset your password</h2>
                  <p className="signup-form-subtitle">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={submit} className="signup-form">
                  <div className="signup-field">
                    <label className="signup-label">Your email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="signup-input"
                    />
                  </div>

                  <button type="submit" className="signup-submit-btn" disabled={loading}>
                    {loading ? <><Loader2 size={16} className="auth-spinner" /> Sending Link...</> : 'Send Reset Link'}
                  </button>
                </form>

                {message === 'account-not-found' && (
                  <div className="signup-alert-not-found">
                    <div className="alert-not-found-icon">
                      <AlertCircle size={18} />
                    </div>
                    <div className="alert-not-found-body">
                      <div className="alert-not-found-title">Account Not Found</div>
                      <p className="alert-not-found-desc">
                        No registered wholesale account exists for <strong>{email}</strong>. Please check for typos or create a new account.
                      </p>
                      <button
                        type="button"
                        className="signup-not-found-btn"
                        onClick={() => {
                          setMode('register');
                          setSignupStep('select-type');
                          setMessage('');
                        }}
                      >
                        <span>Sign Up for an Account</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {message === 'reset-link-sent' && (
                  <p className="signup-alert-success">
                    ✓ Reset link sent! Please check your email inbox and spam folder.
                  </p>
                )}
                {message && message !== 'reset-link-sent' && message !== 'account-not-found' && (
                  <div className="signup-alert-error">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{message}</span>
                  </div>
                )}
              </div>
            ) : mode === 'reset-password' ? (
              /* Reset Password Mode */
              <div>
                <div className="signup-form-header">
                  <h2 className="signup-form-title">Set new password</h2>
                  <p className="signup-form-subtitle">Choose a strong new password with at least 6 characters.</p>
                </div>

                <form onSubmit={submit} className="signup-form">
                  <div className="signup-field">
                    <label className="signup-label">New Password</label>
                    <div className="signup-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        minLength={6}
                        className="signup-input"
                      />
                      <button
                        type="button"
                        className="signup-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="signup-submit-btn" disabled={loading}>
                    {loading ? <><Loader2 size={16} className="auth-spinner" /> Updating...</> : 'Update Password'}
                  </button>
                </form>
                {message && (
                  <div className="signup-alert-error">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{message}</span>
                  </div>
                )}
              </div>
            ) : user && profileComplete && mode !== 'register' && !loading ? (
              /* =================================================================
                 Already Logged In (Profile Complete) View
                 ================================================================= */
              <div className="signup-form-view-wrapper">
                <div className="signup-form-centered-body">
                  <div className="signup-form-header">
                    <div className="signup-form-title-row">
                      <h2 className="signup-form-title">You're signed in</h2>
                    </div>
                    <p className="signup-form-subtitle">
                      Welcome, <strong>{buyerProfile?.full_name || buyerProfile?.business_name || user.email}</strong>. Your account is active.
                    </p>
                  </div>

                  <div className="signup-signedin-actions">
                    <button
                      type="button"
                      className="signup-submit-btn signup-signedin-btn"
                      onClick={() => navigate('catalogue')}
                    >
                      Browse Catalogue <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      className="signup-google-btn signup-signedin-btn"
                      onClick={() => navigate('account')}
                    >
                      Go to My Account
                    </button>
                  </div>

                  <div className="signup-switch-link" style={{ marginTop: '16px' }}>
                    Want to switch accounts?{' '}
                    <button
                      type="button"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                </div>

                <div className="signup-form-bottom-footer">
                  <LegalDisclaimer />
                </div>
              </div>
            ) : mode === 'login' && !isOnboarding ? (
              /* =================================================================
                 Login View
                 ================================================================= */
              <div className="signup-form-view-wrapper">
                <div className="signup-form-centered-body">
                  <div className="signup-form-header">
                    <h2 className="signup-form-title">Welcome back</h2>
                  </div>

                  <form onSubmit={submit} className="signup-form">
                    <div className="signup-field">
                      <label className="signup-label">Your email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        autoComplete="email"
                        required
                        className="signup-input"
                      />
                    </div>

                    <div className="signup-field">
                      <label className="signup-label">Password</label>
                      <div className="signup-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          autoComplete="current-password"
                          required
                          minLength={6}
                          className="signup-input"
                        />
                        <button
                          type="button"
                          className="signup-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="signup-options-row">
                      <label className="signup-remember-label">
                        <input
                          type="checkbox"
                          checked={profile.rememberMe || false}
                          onChange={(e) => updateProfile('rememberMe', e.target.checked)}
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="signup-forgot-btn"
                        onClick={() => { setMode('forgot-password'); setMessage(''); }}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button type="submit" className="signup-submit-btn" disabled={loading}>
                      {loading ? (
                        <><Loader2 size={16} className="auth-spinner" /> Signing in...</>
                      ) : (
                        'Sign In'
                      )}
                    </button>

                    <div className="signup-switch-link">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setSignupStep(selectedUserType ? (selectedUserType === 'customer' ? 'account-form' : `${selectedUserType}-qualification`) : 'select-type');
                          setMessage('');
                        }}
                      >
                        Sign up
                      </button>
                    </div>

                    <div className="signup-divider">
                      <span>or</span>
                    </div>

                    <GoogleButton
                      onClick={() => handleSocialLogin('google')}
                      text="Sign in with Google"
                    />

                    {message && (
                      <div className="signup-alert-error">
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{message}</span>
                      </div>
                    )}
                  </form>
                </div>

                <div className="signup-form-bottom-footer">
                  <LegalDisclaimer />
                </div>
              </div>
            ) : (
              /* =================================================================
                 SIGNUP / REGISTRATION FLOW (BUSINESS / CUSTOMER / SUPPLIER)
                 ================================================================= */
              <div className="signup-form-view-wrapper">
                <div className="signup-form-centered-body">
                  {/* STEP 0: Role Selection ("Which best describes you?") */}
                  {signupStep === 'select-type' ? (
                    <RoleEntryCards
                      selectedType={selectedUserType}
                      onSelectType={handleSelectUserType}
                      onContinue={() => {
                        if (selectedUserType) handleSelectUserType(selectedUserType);
                      }}
                      onSwitchToLogin={() => {
                        setMode('login');
                        setMessage('');
                      }}
                    />
                  ) : signupStep === 'business-qualification' ? (
                    /* STEP 1A: Business Qualification Form (5 Questions) */
                    <BusinessQualificationForm
                      formData={businessForm}
                      onChange={(field, val) => setBusinessForm((prev) => ({ ...prev, [field]: val }))}
                      onBack={handleBackToRoleSelection}
                      onContinue={handleContinueBusinessQualification}
                      validationError={qualValidationError}
                      errorField={qualErrorField}
                    />
                  ) : signupStep === 'supplier-qualification' ? (
                    /* STEP 1B: Supplier / Vendor Onboarding Form (5.1 - 5.4) */
                    <SupplierOnboardingForm
                      formData={supplierForm}
                      onChange={(field, val) => setSupplierForm((prev) => ({ ...prev, [field]: val }))}
                      onBack={handleBackToRoleSelection}
                      onContinue={handleContinueSupplierQualification}
                      validationError={qualValidationError}
                      errorField={qualErrorField}
                    />
                  ) : message === 'verification-email-sent' ? (
                    /* Email Verification Sent Card */
                    <div style={{ padding: '36px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Mail size={28} />
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Check Your Email</h3>
                      <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 20px' }}>
                        We have sent an activation link to <strong>{email}</strong>. Please check your inbox (and spam folder) and verify your email to activate your account.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setMessage('');
                          setSignupStep('select-type');
                        }}
                        className="signup-submit-btn"
                        style={{ maxWidth: '240px', margin: '0 auto' }}
                      >
                        Go to Sign In
                      </button>
                    </div>
                  ) : message === 'seller-registered' ? (
                    /* Supplier Registration Complete Card */
                    <div style={{ padding: '36px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Check size={28} />
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Supplier Application Received!</h3>
                      <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto 20px' }}>
                        Thank you for applying to be a Weave 365 supplier. Our team will review your application and contact you directly.
                      </p>
                      {sellerWaUrl && (
                        <a
                          href={sellerWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="signup-submit-btn"
                          style={{ maxWidth: '280px', margin: '0 auto 12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', background: '#25d366' }}
                        >
                          <WhatsappIcon size={18} /> Fast-track on WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setMessage('');
                          setSignupStep('select-type');
                        }}
                        className="signup-not-found-btn"
                        style={{ margin: '10px auto 0', justifyContent: 'center' }}
                      >
                        Back to Home / Login
                      </button>
                    </div>
                  ) : (
                    /* STEP 2: Standard Account Creation Form (Old Business Type field removed) */
                    <div>
                      {/* Role Chip Banner & Back Navigation */}
                      <div className="signup-role-chip-banner">
                        <div className="signup-role-chip-left">
                          <span className="signup-role-chip-title">
                            {selectedUserType === 'business'
                              ? 'Wholesale Business Account'
                              : selectedUserType === 'supplier'
                                ? 'Supplier Partner Account'
                                : 'Personal Customer Account'}
                          </span>
                          <span className="signup-role-chip-badge">
                            {selectedUserType === 'business'
                              ? (BUSINESS_TYPES.find((b) => b.id === businessForm.business_type)?.label || 'Business')
                              : selectedUserType === 'supplier'
                                ? (supplierForm.business_type || 'Artisan Loom')
                                : 'Personal'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleBackFromAccountForm}
                          className="signup-role-chip-change-btn"
                        >
                          {selectedUserType === 'business'
                            ? '← Edit Qualification'
                            : selectedUserType === 'supplier'
                              ? '← Edit Onboarding'
                              : '← Change Type'}
                        </button>
                      </div>

                      <div className="signup-form-header">
                        <div className="signup-form-title-row">
                          <h2 className="signup-form-title">
                            {isOnboarding
                              ? 'Complete Your Profile'
                              : selectedUserType === 'business'
                                ? 'Create Wholesale Account'
                                : selectedUserType === 'supplier'
                                  ? 'Complete Supplier Account'
                                  : 'Create Personal Account'}
                          </h2>
                        </div>
                        <p className="signup-form-subtitle">
                          {selectedUserType === 'business'
                            ? 'Enter your account details to access wholesale factory pricing and live inventory.'
                            : selectedUserType === 'supplier'
                              ? 'Set your dispatch state, pincode, and password to finalize your supplier application.'
                              : 'Enter your details to start shopping authentic handloom.'}
                        </p>
                      </div>

                      {/* Verified Supplier Information Summary Card (Eliminates redundant inputs) */}
                      {selectedUserType === 'supplier' && (
                        <div className="signup-supplier-verified-card">
                          <div className="signup-supplier-verified-header">
                            <div>
                              <span className="signup-supplier-badge">
                                <Check size={11} /> Onboarding Details Verified
                              </span>
                              <h3 className="signup-supplier-firm-name">
                                {supplierForm.business_name || profile.businessName || 'Supplier Firm'}
                              </h3>
                              <p className="signup-supplier-contact-line">
                                Contact: <strong>{supplierForm.contact_person || profile.fullName}</strong> • <strong>{supplierForm.business_email || email}</strong> • <strong>+91 {supplierForm.phone || profile.whatsapp}</strong>
                              </p>
                              <p className="signup-supplier-loc-line">
                                Location: <strong>{supplierForm.location_city || profile.city}</strong>
                                {supplierForm.gstin ? ` • GSTIN: ${supplierForm.gstin}` : ''}
                                {supplierForm.business_type ? ` • Role: ${supplierForm.business_type}` : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleBackFromAccountForm}
                              className="signup-supplier-edit-btn"
                              title="Click to edit contact or business info"
                            >
                              Edit Info
                            </button>
                          </div>
                        </div>
                      )}

                      <form onSubmit={submit} className="signup-form">
                        <div className="signup-form-grid">
                          {/* =======================================================
                              Fields for Business & Customer (Not asked in Supplier form)
                              ======================================================= */}
                          {selectedUserType !== 'supplier' && (
                            <>
                              {/* Full Name */}
                              <div className="signup-field">
                                <label className="signup-label">
                                  <span>Full Name *</span>
                                </label>
                                <input
                                  type="text"
                                  value={profile.fullName}
                                  onChange={(e) => updateProfile('fullName', e.target.value)}
                                  onBlur={(e) => updateProfile('fullName', toTitleCaseName(e.target.value))}
                                  placeholder="Enter your full name"
                                  autoComplete="name"
                                  required
                                  className="signup-input"
                                />
                              </div>

                              {/* Business Name (Required only for Business Wholesale Account) */}
                              {selectedUserType === 'business' && (
                                <div className="signup-field">
                                  <label className="signup-label">
                                    <span>Business / Store Name *</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={profile.businessName}
                                    onChange={(e) => updateProfile('businessName', e.target.value)}
                                    placeholder="e.g. Varanasi Silk Palace"
                                    autoComplete="organization"
                                    required
                                    className="signup-input"
                                  />
                                </div>
                              )}

                              {/* WhatsApp Number */}
                              <div className="signup-field signup-field-full">
                                <label className="signup-label">WhatsApp Number *</label>
                                <div className="signup-input-phone-group">
                                  <select
                                    className="signup-select"
                                    value={profile.countryCode}
                                    onChange={(e) => updateProfile('countryCode', e.target.value)}
                                  >
                                    {countryCodes.map((item) => (
                                      <option key={item.value} value={item.value}>
                                        {item.label}
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="tel"
                                    value={profile.whatsapp}
                                    onChange={(e) =>
                                      updateProfile(
                                        'whatsapp',
                                        e.target.value.replace(/\D/g, '').slice(0, 10)
                                      )
                                    }
                                    placeholder="Enter 10-digit WhatsApp number"
                                    autoComplete="tel-national"
                                    required
                                    className="signup-input"
                                  />
                                </div>
                              </div>

                              {/* City */}
                              <div className="signup-field">
                                <label className="signup-label">City *</label>
                                <input
                                  type="text"
                                  value={profile.city}
                                  onChange={(e) => updateProfile('city', e.target.value)}
                                  placeholder="e.g. Varanasi"
                                  autoComplete="address-level2"
                                  required
                                  className="signup-input"
                                />
                              </div>
                            </>
                          )}

                          {/* =======================================================
                              Fields Common to All (State & Pincode)
                              ======================================================= */}
                          {/* State */}
                          <div className="signup-field">
                            <label className="signup-label">State *</label>
                            <input
                              type="text"
                              value={profile.state}
                              onChange={(e) => updateProfile('state', e.target.value)}
                              placeholder="e.g. Uttar Pradesh"
                              autoComplete="address-level1"
                              required
                              className="signup-input"
                            />
                          </div>

                          {/* Pincode */}
                          <div className="signup-field">
                            <label className="signup-label">Pincode *</label>
                            <input
                              type="text"
                              value={profile.pincode}
                              onChange={(e) =>
                                updateProfile('pincode', normalizePincodeInput(e.target.value))
                              }
                              placeholder="6-digit pincode"
                              inputMode="numeric"
                              required
                              className="signup-input"
                            />
                          </div>

                          {/* Email Address (Only shown for non-suppliers; for suppliers, shown in verified card above) */}
                          {selectedUserType !== 'supplier' && (
                            <div className="signup-field signup-field-full">
                              <label className="signup-label">
                                <span>Email Address *</span>
                                {isOnboarding && (
                                  <span className="signup-verified-badge">
                                    <Check size={11} /> Google Verified
                                  </span>
                                )}
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                                disabled={isOnboarding}
                                className="signup-input"
                              />
                            </div>
                          )}

                          {/* Password (Only for standard email registrations, not Google onboarding) */}
                          {!isOnboarding && (
                            <div className="signup-field signup-field-full">
                              <label className="signup-label">
                                {selectedUserType === 'supplier' ? 'Create Account Password *' : 'Password *'}
                              </label>
                              <div className="signup-input-wrapper">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Minimum 6 characters"
                                  autoComplete="new-password"
                                  minLength={6}
                                  required
                                  className="signup-input"
                                  style={{ paddingRight: '44px' }}
                                />
                                <button
                                  type="button"
                                  className="signup-password-toggle"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <button type="submit" className="signup-submit-btn" disabled={loading}>
                          {loading ? (
                            <><Loader2 size={16} className="auth-spinner" /> {isOnboarding ? 'Saving Profile...' : 'Creating Account...'}</>
                          ) : isOnboarding ? (
                            'Complete Registration & Continue'
                          ) : selectedUserType === 'business' ? (
                            'Create Wholesale Account'
                          ) : selectedUserType === 'supplier' ? (
                            'Submit Application & Create Account'
                          ) : (
                            'Create Account with Password'
                          )}
                        </button>

                        {!isOnboarding && (
                          <>
                            <div className="signup-divider">
                              <span>or</span>
                            </div>

                            <GoogleButton
                              onClick={handleGoogleRegister}
                              text="Sign up with Google"
                            />
                          </>
                        )}

                        {message && message !== 'verification-email-sent' && message !== 'seller-registered' && (
                          <div className="signup-alert-error">
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{message}</span>
                          </div>
                        )}
                      </form>
                    </div>
                  )}
                </div>

                <div className="signup-form-bottom-footer">
                  <LegalDisclaimer />

                  {isOnboarding && user?.email ? (
                    <div className="signup-switch-link">
                      Signed in as {user.email} •{' '}
                      <button
                        type="button"
                        onClick={handleSignOut}
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="signup-switch-link">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setMessage('');
                        }}
                      >
                        Sign in
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
