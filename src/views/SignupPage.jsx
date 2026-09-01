/**
 * @file SignupPage.jsx
 * @description Dedicated Signup & Authentication Page matching the modern split-screen
 * mesh-gradient design. Implements an initial role selection step for "Customer Signup"
 * (Wholesaler, Reseller, User) vs "Partner Signup" (Vendor / Weaver) and preserves all
 * corporate B2B profile fields and Supabase authentication.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Store,
  ShoppingBag,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { normalizePincodeInput } from '../storefrontShared.jsx';
import { syncProfileFromUser, loadProfileForUser, isProfileComplete } from '../utils/profileHelpers.js';

import { applyAutoApprovalToBuyerProfile } from '../utils/buyerAccess.js';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

const BehanceIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
    <path d="M7.5 13.5c-1.6 0-2.3.8-2.3 2 0 1.2.7 2 2.3 2 1.3 0 2-.6 2.2-1.5h1.9c-.3 1.9-1.9 3-4.1 3-2.8 0-4.4-1.8-4.4-4.4 0-2.7 1.7-4.5 4.5-4.5 2.5 0 4.1 1.6 4.1 4.2v.7H5.2c.1 1 .8 1.6 2.3 1.6.9 0 1.6-.3 1.9-.9h2.1c-.5 1.4-1.7 2.1-4 2.1zM5.3 12h3.9c-.1-.9-.7-1.4-1.9-1.4-1.2 0-1.9.5-2 1.4zm11.3-4.8h4.5v1.4h-4.5V7.2zm4.1 5.3c0-1.8-1.2-2.7-2.8-2.7h-3.4v8.2h3.6c1.8 0 3-1 3-2.8 0-1.1-.6-1.9-1.5-2.2 1.4-.4 2.1-1.3 2.1-2.5zm-4.3-.2h1.4c.8 0 1.3.4 1.3 1.2 0 .7-.5 1.1-1.3 1.1h-1.4v-2.3zm1.6 5.8h-1.6v-2.4h1.6c.9 0 1.4.4 1.4 1.2 0 .8-.5 1.2-1.4 1.2z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

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

const categoryOptions = ['Saree', 'Suit', 'Lehenga', 'Dupatta', 'Under 999'];

const ACCOUNT_ROLE_OPTIONS = [
  { id: 'customer', label: 'Customer', buyerType: 'customer', buyerSubtype: 'Customer' },
  { id: 'reseller', label: 'Reseller', buyerType: 'customer', buyerSubtype: 'Reseller' },
  { id: 'boutique', label: 'Boutique', buyerType: 'customer', buyerSubtype: 'Boutique' },
  { id: 'wholesaler', label: 'Wholesaler', buyerType: 'customer', buyerSubtype: 'Wholesaler' },
  { id: 'online_store', label: 'Online Store', buyerType: 'customer', buyerSubtype: 'Online Store' },
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
    if (isResettingPassword) {
      return 'reset-password';
    }
    if (isOnboarding) {
      return 'complete-profile';
    }
    if (initialMode === 'complete-profile' || initialMode === 'completion-profile') {
      return 'login';
    }
    return initialMode || 'login';
  }); // 'register' | 'login' | 'forgot-password' | 'reset-password' | 'complete-profile'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tempDemoUser, setTempDemoUser] = useState(null);

  const [profile, setProfile] = useState({
    fullName: '',
    countryCode: '+91',
    whatsapp: '',
    businessName: '',
    buyerType: 'customer',
    buyerSubtype: 'Customer',
    buyingBehavior: 'instant',
    city: '',
    state: '',
    pincode: '',
    interestedCategories: ['Saree'],
    rememberMe: false,
  });

  async function handleSignOut() {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      localStorage.removeItem('sareeva_user');
      localStorage.removeItem('just_registered_b2b');
      if (setUser) setUser(null);
      if (setBuyerProfile) setBuyerProfile(null);
      setEmail('');
      setPassword('');
      setProfile((prev) => ({
        ...prev,
        buyerType: 'customer',
        buyerSubtype: 'Customer',
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

  // Sync initial type when passed via props / query params
  useEffect(() => {
    if (initialType) {
      const lower = String(initialType).toLowerCase().trim();
      const matched = ACCOUNT_ROLE_OPTIONS.find(
        (opt) =>
          opt.id === lower ||
          opt.buyerType === lower ||
          opt.buyerSubtype.toLowerCase() === lower ||
          (lower === 'partner' && opt.id === 'vendor')
      );
      if (matched) {
        setProfile((prev) => ({
          ...prev,
          buyerType: matched.buyerType,
          buyerSubtype: matched.buyerSubtype,
        }));
      }
    }
  }, [initialType]);

  // Pre-fill authenticated Google/User info
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
    if (googleName) {
      setProfile((prev) => ({
        ...prev,
        fullName: prev.fullName || toTitleCaseName(googleName),
      }));
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

    if (user && !isProfileComplete(user, buyerProfile)) {
      setMode('complete-profile');
    }
  }, [user, buyerProfile, initialMode, mode]);

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

  function toggleCategory(category) {
    setProfile((current) => {
      const exists = current.interestedCategories.includes(category);
      return {
        ...current,
        interestedCategories: exists
          ? current.interestedCategories.filter((item) => item !== category)
          : [...current.interestedCategories, category],
      };
    });
  }

  function buildBuyerProfile() {
    const cleanWhatsapp = String(profile.whatsapp || '').replace(/\D/g, '').slice(0, 10);
    const isVendor = profile.buyerType === 'vendor' || 
                     String(profile.buyerSubtype || '').toLowerCase().includes('vendor') ||
                     String(profile.buyerSubtype || '').toLowerCase().includes('weaver');

    return applyAutoApprovalToBuyerProfile({
      full_name: toTitleCaseName(profile.fullName),
      whatsapp: `${profile.countryCode} ${cleanWhatsapp}`,
      whatsapp_country_code: profile.countryCode,
      whatsapp_number: cleanWhatsapp,
      business_name: profile.businessName.trim(),
      buyer_type: isVendor ? 'vendor' : 'customer',
      buyer_subtype: profile.buyerSubtype || (isVendor ? 'Vendor' : 'Customer'),
      role: isVendor ? 'vendor' : 'customer',
      buying_behavior: profile.buyingBehavior,
      city: profile.city?.trim() || '',
      state: profile.state?.trim() || '',
      pincode: normalizePincodeInput(profile.pincode),
      interested_categories: profile.interestedCategories,
      price_group: 'approved',
      approval_status: 'approved',
    });
  }

  async function checkEmailExists(inputEmail) {
    const clean = String(inputEmail || '').trim().toLowerCase();
    if (!clean) return false;

    // 1. Try server-side check-email endpoint (bypasses RLS)
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

    // 2. Client-side Supabase query fallback
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
      setMessage('demo-reset-sent');
      return;
    }

    // Verify if email exists in database before sending password reset link
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
      setMessage('Password updated successfully (demo mode).');
      setTimeout(() => {
        setMode('login');
        setNewPassword('');
        setMessage('');
      }, 1500);
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
      setMessage(`Demo mode: ${provider} OAuth simulated. Log in via email for full mock user.`);
    }
  }

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
          navigate(profile.buyerType === 'vendor' ? 'account' : 'home');
        }, 700);
        return;
      }

      if (mode === 'register') {
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

        setProfile((current) => ({
          ...current,
          fullName: cleanName,
          whatsapp: cleanWhatsapp,
        }));
      }

      const registeredProfile = mode === 'register' ? buildBuyerProfile() : {};
      const isVendorRegister = registeredProfile.buyer_type === 'vendor' || registeredProfile.role === 'vendor';

      if (!isSupabaseConfigured) {
        const demoUser = {
          id: email || 'demo-user',
          email: email || 'demo@weave365.local',
          user_metadata: { buyer_profile: registeredProfile, role: isVendorRegister ? 'vendor' : 'customer' },
        };

        if (mode === 'register') {
          setTempDemoUser(demoUser);
          setMessage('demo-verification-sent');
        } else {
          localStorage.setItem('sareeva_user', JSON.stringify(demoUser));
          if (setUser) setUser(demoUser);
          if (setBuyerProfile) setBuyerProfile(registeredProfile);
          navigate('home');
        }
        setLoading(false);
        return;
      }

      const redirectUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : 'https://www.weave365.com/';

      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: redirectUrl,
                data: {
                  buyer_profile: registeredProfile,
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

          if (!result.data.session) {
            setMessage('verification-email-sent');
            setLoading(false);
          } else {
            if (result.data.user && setUser) {
              setUser(result.data.user);
            }
            const profileResult = await syncProfileFromUser(result.data.user);
            if (profileResult.error) {
              setMessage(`Account created, but profile could not be saved: ${profileResult.error.message}`);
              setLoading(false);
              return;
            }
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

  function handleSimulateVerification() {
    if (tempDemoUser) {
      const demoUserWithConfirmedEmail = {
        ...tempDemoUser,
        email_confirmed_at: new Date().toISOString(),
      };
      localStorage.setItem('sareeva_user', JSON.stringify(demoUserWithConfirmedEmail));
      if (setUser) setUser(demoUserWithConfirmedEmail);
      if (setBuyerProfile) {
        setBuyerProfile(demoUserWithConfirmedEmail.user_metadata.buyer_profile);
      }
      setTempDemoUser(null);
      setMessage('Demo account verified and logged in successfully!');
      setTimeout(() => {
        navigate('home');
      }, 800);
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
            <span className="signup-hero-subtag">You can easily</span>
            <h1 className="signup-hero-headline">
              Get access your personal hub for clarity and productivity
            </h1>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="signup-form-panel">
          <div className="signup-form-inner">
            {/* Verification Email Sent State */}
          {message === 'verification-email-sent' ? (
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
          ) : message === 'demo-verification-sent' ? (
            <div className="signup-status-card">
              <div className="signup-status-icon">
                <Mail size={24} />
              </div>
              <h2 className="signup-status-title">Verify Your Email (Demo Mode)</h2>
              <p className="signup-status-desc">
                A verification link has been simulated for <strong style={{ color: '#0f172a' }}>{email}</strong>.
                In production, clicking the email link activates the account.
              </p>
              <button
                type="button"
                className="signup-submit-btn"
                onClick={handleSimulateVerification}
              >
                Simulate Verification Click →
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
              {message === 'demo-reset-sent' && (
                <div style={{ marginTop: '16px' }}>
                  <p className="signup-demo-notice">Demo mode: click below to simulate password reset.</p>
                  <button type="button" className="signup-submit-btn" onClick={() => { setMode('reset-password'); setMessage(''); }}>
                    Simulate Reset Link →
                  </button>
                </div>
              )}
              {message && message !== 'reset-link-sent' && message !== 'demo-reset-sent' && message !== 'account-not-found' && (
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
               Signup / Complete Profile Form (Customer or Partner)
               ================================================================= */
            <div className="signup-form-view-wrapper">
              <div className="signup-form-centered-body">
                <div className="signup-form-header">
                  <div className="signup-form-title-row">
                    <h2 className="signup-form-title">
                      {isOnboarding ? 'Complete Your Profile' : 'Create an account'}
                    </h2>
                  </div>
                  {isOnboarding && (
                    <p className="signup-form-subtitle">
                      Provide your business details to unlock wholesale catalog access.
                    </p>
                  )}
                </div>

                <form onSubmit={submit} className="signup-form">
                <div className="signup-form-grid">
                  {/* Business Type / Role Selector */}
                  <div className="signup-field signup-field-full">
                    <label className="signup-label">
                      <span>Business Type *</span>
                    </label>
                    <div className="signup-role-radio-group" role="radiogroup" aria-label="Business Type">
                      {ACCOUNT_ROLE_OPTIONS.map((option) => {
                        const isSelected =
                          (profile.buyerSubtype || '').toLowerCase() === option.buyerSubtype.toLowerCase();
                        return (
                          <label
                            key={option.id}
                            className={`signup-role-radio-card ${isSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name="accountRole"
                              value={option.id}
                              checked={isSelected}
                              onChange={() => {
                                setProfile((prev) => ({
                                  ...prev,
                                  buyerType: option.buyerType,
                                  buyerSubtype: option.buyerSubtype,
                                }));
                              }}
                              className="signup-role-radio-input"
                            />
                            <span className="signup-role-custom-radio" aria-hidden="true">
                              <span className="signup-role-radio-inner" />
                            </span>
                            <span className="signup-role-radio-label">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Dedicated Seller & Weaver Partnership Callout */}
                    <div className="signup-seller-callout">
                      <div className="signup-seller-callout-icon-box" aria-hidden="true">
                        <Store size={17} />
                      </div>
                      <div className="signup-seller-callout-text">
                        <span className="signup-seller-callout-title">
                          Want to sell or list products on Weave 365?
                        </span>
                        <span className="signup-seller-callout-desc">
                          Weavers, loom artisans & manufacturers can apply for certified partner onboarding.
                        </span>
                      </div>
                      <a
                        href="/weaver-onboarding"
                        className="signup-seller-callout-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          if (navigate) navigate('weaver-onboarding');
                          else window.location.href = '/weaver-onboarding';
                        }}
                      >
                        <span>Apply as Seller</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="signup-field">
                    <label className="signup-label">Full Name *</label>
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

                  {/* Business Name */}
                  <div className="signup-field">
                    <label className="signup-label">Business Name (Optional)</label>
                    <input
                      type="text"
                      value={profile.businessName}
                      onChange={(e) => updateProfile('businessName', e.target.value)}
                      placeholder="Optional business name"
                      autoComplete="organization"
                      className="signup-input"
                    />
                  </div>




                  {/* WhatsApp Number (Full Width for comfortable digits typing) */}
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

                  {/* Email */}
                  <div className="signup-field">
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

                  {/* Password (Only for standard email registrations, not Google onboarding) */}
                  {!isOnboarding && (
                    <div className="signup-field signup-field-full">
                      <label className="signup-label">Password *</label>
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
                  ) : (
                    'Get Started'
                  )}
                </button>
                  {message && (
                    <div className="signup-alert-error">
                      <AlertCircle size={18} style={{ flexShrink: 0 }} />
                      <span>{message}</span>
                    </div>
                  )}
                </form>
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
