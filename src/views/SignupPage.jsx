/**
 * @file SignupPage.jsx
 * @description Dedicated Signup & Authentication Page matching the modern split-screen
 * mesh-gradient design. Implements an initial role selection step for "Customer Signup"
 * (Wholesaler, Reseller, User) vs "Partner Signup" (Vendor / Weaver) and preserves all
 * corporate B2B profile fields and Supabase authentication.
 */
'use client';

import { useState, useEffect } from 'react';
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
import { syncProfileFromUser } from '../utils/profileHelpers.js';
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

const customerSubtypes = [
  { value: 'Wholesaler (MOQ: 1 Set)', label: 'Wholesaler (MOQ: 1 Set)', type: 'wholesale' },
  { value: 'Reseller (MOQ: Flexible)', label: 'Reseller (MOQ: Flexible)', type: 'reseller' },
  { value: 'User (MOQ: 1 Pc)', label: 'User (MOQ: 1 Pc)', type: 'user' },
];

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

const categoryOptions = ['Saree', 'Suit', 'Lehenga', 'Dupatta', 'Fabric', 'Under 999'];

function toTitleCaseName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function SignupPage({
  user,
  setUser,
  buyerProfile,
  setBuyerProfile,
  navigate,
  initialMode = 'register',
  initialType = null,
}) {
  const [mode, setMode] = useState(initialMode); // 'register' | 'login' | 'forgot-password' | 'reset-password'
  const [signupType, setSignupType] = useState(initialType); // null (step 1) | 'customer' | 'partner'
  
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
    buyerType: 'wholesale',
    buyerSubtype: 'Wholesaler (MOQ: 1 Set)',
    buyingBehavior: 'instant',
    city: '',
    pincode: '',
    interestedCategories: ['Saree'],
    rememberMe: false,
  });

  // Sync initial type when passed via props / query params
  useEffect(() => {
    if (initialType === 'partner') {
      setSignupType('partner');
      setProfile((prev) => ({
        ...prev,
        buyerType: 'vendor',
        buyerSubtype: 'Vendor (Partner / Weaver)',
      }));
    } else if (initialType === 'customer') {
      setSignupType('customer');
      setProfile((prev) => ({
        ...prev,
        buyerType: 'wholesale',
        buyerSubtype: 'Wholesaler (MOQ: 1 Set)',
      }));
    }
  }, [initialType]);

  useEffect(() => {
    document.title = 'Weave 365 Sign-up';
  }, []);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

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

  function selectSignupType(type) {
    setSignupType(type);
    if (type === 'partner') {
      setProfile((prev) => ({
        ...prev,
        buyerType: 'vendor',
        buyerSubtype: 'Vendor (Partner / Weaver)',
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        buyerType: 'wholesale',
        buyerSubtype: 'Wholesaler (MOQ: 1 Set)',
      }));
    }
  }

  function buildBuyerProfile() {
    const cleanWhatsapp = String(profile.whatsapp || '').replace(/\D/g, '').slice(0, 10);
    return applyAutoApprovalToBuyerProfile({
      full_name: toTitleCaseName(profile.fullName),
      whatsapp: `${profile.countryCode} ${cleanWhatsapp}`,
      whatsapp_country_code: profile.countryCode,
      whatsapp_number: cleanWhatsapp,
      business_name: profile.businessName.trim(),
      buyer_type: profile.buyerType,
      buyer_subtype: profile.buyerSubtype || 'Wholesaler (MOQ: 1 Set)',
      buying_behavior: profile.buyingBehavior,
      city: profile.city.trim(),
      pincode: normalizePincodeInput(profile.pincode),
      interested_categories: profile.interestedCategories,
      price_group: profile.buyerType,
      approval_status: 'approved',
    });
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setMessage('');

    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage('demo-reset-sent');
      return;
    }

    const redirectUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/signup?mode=reset-password`
      : 'https://www.weave365.com/signup?mode=reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
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
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setMode('login');
        setNewPassword('');
        setMessage('');
      }, 1800);
    }
  }

  async function handleSocialLogin(provider) {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined,
          },
        });
      } catch (err) {
        setMessage(err.message || 'Social login failed.');
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

      if (mode === 'register') {
        const cleanName = toTitleCaseName(profile.fullName);
        const cleanWhatsapp = String(profile.whatsapp || '').replace(/\D/g, '').slice(0, 10);

        const isBusinessRequired = profile.buyerType !== 'user';
        const isBusinessValid = !isBusinessRequired || profile.businessName.trim().length > 0;
        const isCategoryRequired = profile.buyerType !== 'vendor';
        const isCategoryValid = !isCategoryRequired || profile.interestedCategories.length > 0;

        if (
          !cleanName ||
          !isBusinessValid ||
          !profile.city.trim() ||
          cleanWhatsapp.length !== 10 ||
          normalizePincodeInput(profile.pincode).length !== 6 ||
          !isCategoryValid
        ) {
          const catMsg = isCategoryRequired ? ', and at least one category selection is required.' : '.';
          setMessage(
            `Please complete every required field. WhatsApp number must be 10 digits, pincode must be 6 digits${catMsg}`
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

      if (!isSupabaseConfigured) {
        const demoProfile = mode === 'register' ? buildBuyerProfile() : {};
        const demoUser = {
          id: email || 'demo-user',
          email: email || 'demo@weave365.local',
          user_metadata: { buyer_profile: demoProfile },
        };

        if (mode === 'register') {
          setTempDemoUser(demoUser);
          setMessage('demo-verification-sent');
        } else {
          localStorage.setItem('sareeva_user', JSON.stringify(demoUser));
          if (setUser) setUser(demoUser);
          if (setBuyerProfile) setBuyerProfile(demoProfile);
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
                  buyer_profile: buildBuyerProfile(),
                },
              },
            });

      if (result.error) {
        setMessage(result.error.message);
        setLoading(false);
      } else {
        if (mode === 'register') {
          if (profile.buyerType === 'reseller' || profile.buyerType === 'wholesale') {
            localStorage.setItem('just_registered_b2b', 'true');
          }

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
            setMessage('Registered successfully! Redirecting...');
            setTimeout(() => {
              navigate('home');
            }, 800);
          }
        } else {
          if (result.data.user && setUser) {
            setUser(result.data.user);
          }
          navigate('home');
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
        {/* Left Side: Modern Mesh Gradient Hero Card */}
        <div className="signup-hero-card">
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '8px' }}
                >
                  <ArrowLeft size={14} /> Back to Login
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

              {message === 'reset-link-sent' && (
                <p style={{ marginTop: '16px', color: '#16a34a', fontSize: '13.5px', fontWeight: '500' }}>
                  ✓ Reset link sent! Please check your email inbox and spam folder.
                </p>
              )}
              {message === 'demo-reset-sent' && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ color: '#ca8a04', fontSize: '13.5px' }}>Demo mode: click below to simulate password reset.</p>
                  <button type="button" className="signup-submit-btn" onClick={() => { setMode('reset-password'); setMessage(''); }}>
                    Simulate Reset Link →
                  </button>
                </div>
              )}
              {message && message !== 'reset-link-sent' && message !== 'demo-reset-sent' && (
                <div style={{ marginTop: '14px', color: '#dc2626', fontSize: '13.5px' }}>
                  {message}
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
                <div style={{ marginTop: '14px', color: '#dc2626', fontSize: '13.5px' }}>
                  {message}
                </div>
              )}
            </div>
          ) : mode === 'login' ? (
            /* =================================================================
               Login View
               ================================================================= */
            <div>
              <div className="signup-form-header">
                <h2 className="signup-form-title">Welcome back</h2>
                <p className="signup-form-subtitle">
                  Access your orders, saved collections, and live wholesale catalog in one place.
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

                {message && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{message}</span>
                  </div>
                )}

                <div className="signup-switch-link">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setSignupType(null); // Return to pre-selection
                      setMessage('');
                    }}
                  >
                    Sign up
                  </button>
                </div>
              </form>
            </div>
          ) : signupType === null ? (
            /* =================================================================
               Step 1: Pre-Selection Screen (Customer Signup vs Partner Signup)
               ================================================================= */
            <div>
              <div className="signup-form-header">
                <h2 className="signup-form-title">Create an account</h2>
                <p className="signup-form-subtitle">
                  Select your profile type to access tailored pricing, MOQ terms, and textile tools.
                </p>
              </div>

              <div className="signup-role-selection-grid">
                {/* 1. Customer Signup Card */}
                <div
                  className="signup-role-card"
                  onClick={() => selectSignupType('customer')}
                >
                  <div className="signup-role-card-icon">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="signup-role-card-tag">Buyer & Reseller</span>
                  <h3 className="signup-role-card-title">Customer Signup</h3>
                  <p className="signup-role-card-desc">
                    For wholesalers, boutique owners, resellers, and individual buyers purchasing authentic Banarasi textiles.
                  </p>

                  <ul className="signup-role-card-features">
                    <li>
                      <Check size={14} />
                      <span>Wholesaler (MOQ: 1 Set)</span>
                    </li>
                    <li>
                      <Check size={14} />
                      <span>Reseller (MOQ: Flexible)</span>
                    </li>
                    <li>
                      <Check size={14} />
                      <span>Individual User (MOQ: 1 Pc)</span>
                    </li>
                  </ul>

                  <button type="button" className="signup-role-card-btn">
                    Continue as Customer <ArrowRight size={14} />
                  </button>
                </div>

                {/* 2. Partner Signup Card */}
                <div
                  className="signup-role-card"
                  onClick={() => selectSignupType('partner')}
                >
                  <div className="signup-role-card-icon">
                    <Store size={20} />
                  </div>
                  <span className="signup-role-card-tag">Weaver Network</span>
                  <h3 className="signup-role-card-title">Partner Signup</h3>
                  <p className="signup-role-card-desc">
                    For Varanasi master weavers, loom owners, and production enterprises selling through Weave 365.
                  </p>

                  <ul className="signup-role-card-features">
                    <li>
                      <Check size={14} />
                      <span>Vendor (Partner / Weaver)</span>
                    </li>
                    <li>
                      <Check size={14} />
                      <span>List your loom collections</span>
                    </li>
                    <li>
                      <Check size={14} />
                      <span>Direct verified buyer orders</span>
                    </li>
                  </ul>

                  <button type="button" className="signup-role-card-btn">
                    Continue as Partner <ArrowRight size={14} />
                  </button>
                </div>
              </div>

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
            </div>
          ) : (
            /* =================================================================
               Step 2: Signup Form (Customer or Partner)
               ================================================================= */
            <div>
              <div className="signup-form-header">
                <div className="signup-form-title-row">
                  <h2 className="signup-form-title">
                    {signupType === 'partner' ? 'Partner Registration' : 'Create an account'}
                  </h2>

                  <div className="signup-role-badge">
                    <span>{signupType === 'partner' ? 'Partner / Weaver' : 'Customer'}</span>
                  </div>
                </div>
                <p className="signup-form-subtitle">
                  {signupType === 'partner'
                    ? 'Join Varanasi’s verified weaver network and supply direct to global boutiques.'
                    : 'Access verified factory prices, live inventory, and flexible MOQ orders in one place.'}
                </p>
              </div>

              <form onSubmit={submit} className="signup-form">
                <div className="signup-form-grid">
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

                  {/* Business / Loom Name */}
                  <div className="signup-field">
                    <label className="signup-label">
                      {signupType === 'partner'
                        ? 'Loom / Enterprise Name *'
                        : profile.buyerType === 'user'
                        ? 'Business Name (Optional)'
                        : 'Business / Boutique Name *'}
                    </label>
                    <input
                      type="text"
                      value={profile.businessName}
                      onChange={(e) => updateProfile('businessName', e.target.value)}
                      placeholder={
                        signupType === 'partner'
                          ? 'Enter loom or enterprise name'
                          : profile.buyerType === 'user'
                          ? 'Optional store name'
                          : 'Enter your business name'
                      }
                      autoComplete="organization"
                      required={signupType === 'partner' || profile.buyerType !== 'user'}
                      className="signup-input"
                    />
                  </div>

                  {/* WhatsApp Number with Country Code */}
                  <div className="signup-field signup-field-full">
                    <label className="signup-label">
                      <span>WhatsApp Number *</span>
                      <span className="signup-label-subtext">Format: 10 digits</span>
                    </label>
                    <div className="signup-input-phone-group">
                      <select
                        className="signup-select"
                        value={profile.countryCode}
                        onChange={(e) => updateProfile('countryCode', e.target.value)}
                        aria-label="Country Code"
                      >
                        {countryCodes.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        value={profile.whatsapp}
                        onChange={(e) =>
                          updateProfile('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))
                        }
                        placeholder="xxxxxxxxxx"
                        pattern="[0-9]{10}"
                        required
                        className="signup-input"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="signup-field">
                    <label className="signup-label">Your email *</label>
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

                  {/* Password */}
                  <div className="signup-field">
                    <label className="signup-label">Password *</label>
                    <div className="signup-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        autoComplete="new-password"
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

                  {/* City & State */}
                  <div className="signup-field">
                    <label className="signup-label">City, State *</label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => updateProfile('city', e.target.value)}
                      placeholder="e.g. Surat, Gujarat"
                      autoComplete="address-level2"
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
                      onChange={(e) => updateProfile('pincode', normalizePincodeInput(e.target.value))}
                      placeholder="6-digit pincode"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      className="signup-input"
                    />
                  </div>

                  {/* Account / User Type (Customer Only) */}
                  {signupType === 'customer' && (
                    <div className="signup-field">
                      <label className="signup-label">Account / User Type *</label>
                      <select
                        className="signup-select"
                        value={profile.buyerSubtype || 'Wholesaler (MOQ: 1 Set)'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const found = customerSubtypes.find((item) => item.value === val);
                          updateProfile('buyerSubtype', val);
                          if (found) updateProfile('buyerType', found.type);
                        }}
                      >
                        {customerSubtypes.map((sub) => (
                          <option key={sub.value} value={sub.value}>
                            {sub.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Buying Behaviour (Customer Only) */}
                  {signupType === 'customer' && (
                    <div className="signup-field">
                      <label className="signup-label">Buying Behaviour *</label>
                      <select
                        className="signup-select"
                        value={profile.buyingBehavior}
                        onChange={(e) => updateProfile('buyingBehavior', e.target.value)}
                      >
                        <option value="instant">Immediate Purchase</option>
                        <option value="order_basis">Order Basis</option>
                      </select>
                    </div>
                  )}

                  {/* Interested Categories (Customer Only) */}
                  {signupType === 'customer' && (
                    <div className="signup-field signup-field-full">
                      <label className="signup-label">
                        <span>Interested Categories *</span>
                        <span className="signup-label-subtext">Select all that apply</span>
                      </label>
                      <div className="signup-category-pills">
                        {categoryOptions.map((cat) => (
                          <label key={cat} className="signup-category-pill">
                            <input
                              type="checkbox"
                              checked={profile.interestedCategories.includes(cat)}
                              onChange={() => toggleCategory(cat)}
                            />
                            <span>{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="signup-submit-btn" disabled={loading}>
                  {loading ? (
                    <><Loader2 size={16} className="auth-spinner" /> Creating Account...</>
                  ) : (
                    'Get Started'
                  )}
                </button>

                {message && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{message}</span>
                  </div>
                )}

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
              </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
