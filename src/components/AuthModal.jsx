/**
 * AuthModal Component
 * Purpose: Provides a premium modal portal handling standard B2B user authentication (login/register).
 * Captures granular corporate profiles (business name, mobile country codes, WhatsApp numbers,
 * buyer roles, buying behaviors, and fabric categories) and integrates with Supabase authentication.
 */
import { useState, useEffect } from 'react';
import { X, LogOut, ArrowLeft, Eye, EyeOff, Mail, Lock, ShieldCheck, ArrowRight, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { normalizePincodeInput } from '../storefrontShared.jsx';
import { syncProfileFromUser } from '../utils/profileHelpers.js';
import { applyAutoApprovalToBuyerProfile, isVaranasiPincode } from '../utils/buyerAccess.js';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', color: '#25D366' }} aria-hidden="true">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.863-9.864.001-2.637-1.03-5.114-2.905-6.989-1.875-1.875-4.37-2.907-7.01-2.908-5.438 0-9.863 4.42-9.866 9.863-.001 1.716.452 3.39 1.312 4.869l-.994 3.633 3.775-.989zm11.517-5.695c-.302-.15-1.786-.882-2.052-.98-.266-.096-.459-.144-.652.146-.193.289-.747.98-.916 1.173-.168.193-.337.217-.639.067-.303-.15-1.277-.47-2.433-1.5-.9-.803-1.507-1.795-1.684-2.1-.177-.302-.019-.465.132-.614.136-.134.303-.35.454-.525.152-.175.202-.299.303-.499.102-.2.05-.375-.025-.525-.075-.15-.652-1.572-.892-2.152-.233-.566-.47-.489-.652-.499-.168-.008-.362-.01-.555-.01-.193 0-.507.073-.772.36-.266.289-1.013.99-1.013 2.414 0 1.423 1.037 2.799 1.182 2.993.145.193 2.036 3.111 4.934 4.364.69.298 1.229.476 1.649.609.694.221 1.327.19 1.827.115.556-.083 1.786-.73 2.036-1.402.25-.672.25-1.25.175-1.373-.075-.124-.266-.197-.568-.347z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', color: '#E1306C' }} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', color: '#1877F2' }} aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const buyerSubtypes = [
  { value: 'Wholesaler (MOQ: 1 Set)', label: 'Wholesaler (MOQ: 1 Set)', type: 'wholesale' },
  { value: 'Reseller (MOQ: Flexible)', label: 'Reseller (MOQ: Flexible)', type: 'reseller' },
  { value: 'User (MOQ: 1 Pc)', label: 'User (MOQ: 1 Pc)', type: 'user' },
];


const buyingBehaviors = [
  { value: 'instant', label: 'Immediate' },
  { value: 'order_basis', label: 'Order Basis' },
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

function B2BSegmentDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.custom-b2b-dropdown-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const selectedOpt = buyerSubtypes.find(opt => opt.value === value);

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container custom-b2b-dropdown-container">
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-value">
          {selectedOpt ? selectedOpt.label : 'Select Segment'}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`custom-select-chevron ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-select-overlay" role="listbox">
          {buyerSubtypes.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt)}
              role="option"
              aria-selected={value === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyingBehaviorDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.custom-behavior-dropdown-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isOpen]);

  const selectedOpt = buyingBehaviors.find(opt => opt.value === value);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container custom-behavior-dropdown-container">
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-value">
          {selectedOpt ? selectedOpt.label : 'Select Buying Behaviour'}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`custom-select-chevron ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-select-overlay" role="listbox">
          {buyingBehaviors.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt)}
              role="option"
              aria-selected={value === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorAlert({ message }) {
  if (!message) return null;
  
  const isEmailNotConfirmed = String(message).toLowerCase().includes('email not confirmed') || 
                              String(message).toLowerCase().includes('confirm your email') ||
                              String(message).toLowerCase().includes('email confirmation');

  return (
    <div 
      className="auth-error-alert" 
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        border: '1px solid rgba(201, 74, 41, 0.25)',
        borderRadius: '8px',
        background: 'rgba(201, 74, 41, 0.05)',
        color: '#c94a29',
        fontSize: '13.5px',
        lineHeight: '1.5',
        marginTop: '14px',
        textAlign: 'left',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <strong style={{ display: 'block', fontWeight: '800', marginBottom: '2px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
          {isEmailNotConfirmed ? 'Verification Required' : 'Submission Error'}
        </strong>
        <span style={{ fontWeight: '500' }}>{message}</span>
      </div>
    </div>
  );
}

export function AuthModal({ open, onClose, user, setUser, buyerProfile, setBuyerProfile, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
    interestedCategories: [],
  });
  const [message, setMessage] = useState('');
  const [tempDemoUser, setTempDemoUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Track open prop to reset mode/message inline during render (no stale flash)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMode(initialMode);
      setMessage('');
      setShowPassword(false);
      setLoading(false);
    }
  }

  if (!open) return null;

  const userProfile = buyerProfile || user?.user_metadata?.buyer_profile || user?.buyer_profile || {};

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
      ? `${window.location.origin}/`
      : 'http://localhost:3000/';

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

        if (!cleanName || !isBusinessValid || !profile.city.trim() || cleanWhatsapp.length !== 10 || normalizePincodeInput(profile.pincode).length !== 6 || profile.interestedCategories.length === 0) {
          setMessage('Please complete every required field. WhatsApp number must be 10 digits, pincode must be 6 digits, and at least one category is required.');
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
          email: email || 'demo@sareeva.local',
          user_metadata: { buyer_profile: demoProfile },
        };

        if (mode === 'register') {
          // Enforce email verification check for new registers in Demo Mode
          setTempDemoUser(demoUser);
          setMessage('demo-verification-sent');
        } else {
          localStorage.setItem('sareeva_user', JSON.stringify(demoUser));
          setUser(demoUser);
          if (setBuyerProfile) setBuyerProfile(demoProfile);
          onClose();
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
          // Enforce verification: check if session exists (if email confirmation is turned off in Supabase, session is returned immediately)
          if (!result.data.session) {
            // No session means they must confirm their email first!
            // Bypassing setUser(result.data.user) so they are NOT auto-logged in!
            setMessage('verification-email-sent');
            setLoading(false);
          } else {
            // If Supabase has email verification disabled, it signs them in and returns a session immediately.
            if (result.data.user) {
              setUser(result.data.user);
            }
            const profileResult = await syncProfileFromUser(result.data.user);
            if (profileResult.error) {
              setMessage(`Account created, but profile could not be saved: ${profileResult.error.message}`);
              setLoading(false);
              return;
            }
            setMessage('Registered and logged in successfully.');
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        } else {
          // Login mode: log them in normally.
          if (result.data.user) {
            setUser(result.data.user);
          }
          onClose();
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
      setUser(demoUserWithConfirmedEmail);
      if (setBuyerProfile) {
        setBuyerProfile(demoUserWithConfirmedEmail.user_metadata.buyer_profile);
      }
      setTempDemoUser(null);
      setMessage('Demo account verified and logged in successfully!');
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  }

  async function logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sareeva_user');
    setUser(null);
    if (setBuyerProfile) setBuyerProfile(null);
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className={`auth-modal ${mode}-mode`}>

        <button type="button" className="icon-button modal-close" onClick={onClose}>
          <X size={18} />
        </button>
        {user && mode !== 'reset-password' ? (
          <>
            <h2>Your Account</h2>
            <p>{user.email || 'Demo account'}</p>
            {!isSupabaseConfigured && <p className="warning">Demo mode: configure Supabase in .env or .env.local for real login.</p>}
            <button type="button" className="secondary-button icon-label" onClick={logout}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            {message === 'verification-email-sent' ? (
              <>
                <div className="auth-header" style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 'var(--h3-size)', fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                    Verify Your Email
                    <span style={{ color: 'var(--gold)', fontFamily: 'serif', fontSize: 'var(--h4-size)', padding: '3px', lineHeight: 1 }}>✦</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: 'var(--small-size)', color: 'var(--muted)' }}>
                    Check your inbox to activate your account
                  </p>
                </div>

                <div className="auth-success-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 16px', gap: '12px', marginTop: '8px', border: '1px solid rgba(183, 134, 70, 0.15)', borderRadius: '12px', background: 'rgba(183, 134, 70, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(183, 134, 70, 0.1)', color: 'var(--gold)' }}>
                    <Mail size={22} />
                  </div>
                  <strong style={{ color: 'var(--ink)', fontSize: 'var(--body-size)', fontWeight: '700' }}>
                    Check your inbox
                  </strong>
                  <p style={{ margin: 0, fontSize: 'var(--body-size)', color: 'var(--muted)', lineHeight: 1.6 }}>
                    We have sent a verification link to <strong style={{ color: 'var(--ink)', wordBreak: 'break-all' }}>{email}</strong>. Please confirm your email address to activate your account.
                  </p>
                </div>
                <p style={{ fontSize: 'var(--small-size)', color: 'var(--muted)', marginTop: '20px', textAlign: 'center', lineHeight: 1.5 }}>
                  Once verified, you will be able to log in to access direct factory pricing and live inventory.
                </p>
                <button type="button"
                  className="auth-primary-submit-btn"
                  style={{ marginTop: '20px', width: '100%' }}
                  onClick={() => {
                    setMode('login');
                    setMessage('');
                  }}
                >
                  Back to Login <ArrowRight size={16} />
                </button>
              </>
            ) : message === 'demo-verification-sent' ? (
              <>
                <div className="auth-header" style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 'var(--h3-size)', fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                    Verify Your Email
                    <span style={{ color: 'var(--gold)', fontFamily: 'serif', fontSize: 'var(--h4-size)', lineHeight: 1 }}>✦</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: 'var(--small-size)', color: 'var(--muted)' }}>
                    Demo Mode — Verification Simulated
                  </p>
                </div>

                <div className="auth-success-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 16px', gap: '12px', marginTop: '8px', border: '1px solid rgba(183, 134, 70, 0.15)', borderRadius: '12px', background: 'rgba(183, 134, 70, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(183, 134, 70, 0.1)', color: 'var(--gold)' }}>
                    <Mail size={22} />
                  </div>
                  <strong style={{ color: 'var(--ink)', fontSize: 'var(--body-size)', fontWeight: '700' }}>
                    Verification Simulated
                  </strong>
                  <p style={{ margin: 0, fontSize: 'var(--body-size)', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '4px' }}>
                    A verification link has been simulated for <strong style={{ color: 'var(--ink)', wordBreak: 'break-all' }}>{email}</strong>. In production, the user must click this link to access the platform.
                  </p>
                  <button type="button"
                    className="primary-button"
                    style={{ width: '100%', background: 'var(--gold)', borderColor: 'var(--gold)', color: '#fff', fontWeight: '700' }}
                    onClick={handleSimulateVerification}
                  >
                    Simulate Verification Link Click
                  </button>
                </div>
                <button type="button"
                  className="auth-primary-submit-btn"
                  style={{ marginTop: '20px', width: '100%' }}
                  onClick={() => {
                    setMode('login');
                    setMessage('');
                    setTempDemoUser(null);
                  }}
                >
                  Back to Login <ArrowRight size={16} />
                </button>
              </>
            ) : mode === 'forgot-password' ? (
              <>
                <button type="button"
                  className="text-button"
                  onClick={() => { setMode('login'); setMessage(''); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '13px', color: 'var(--muted)' }}
                  disabled={loading}
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
                <h2>Reset Password</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 6px' }}>
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
                <form onSubmit={submit}>
                  <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}>
                    <label className="auth-label-styled">
                      Email
                      <input
                        className="auth-input-styled"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                      />
                    </label>
                    <button className="primary-button" type="submit">
                      {loading ? (
                        <>
                          <Loader2 size={16} className="auth-spinner" /> Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </fieldset>
                </form>
                {message === 'reset-link-sent' && (
                  <div className="auth-success-card">
                    <strong>✓ Reset link sent</strong>
                    <p>Check your email inbox (and spam folder) for a password reset link. Click it to set a new password.</p>
                  </div>
                )}
                {message === 'demo-reset-sent' && (
                  <div className="auth-success-card">
                    <strong>✓ Demo mode — email simulated</strong>
                    <p>Supabase is not connected. Click below to simulate clicking the reset link from your email.</p>
                    <button type="button"
                      className="secondary-button"
                      style={{ marginTop: '8px' }}
                      onClick={() => { setMode('reset-password'); setMessage(''); }}
                    >
                      Simulate Email Click →
                    </button>
                  </div>
                )}
                {message && message !== 'reset-link-sent' && message !== 'demo-reset-sent' && (
                  <ErrorAlert message={message} />
                )}
              </>
            ) : mode === 'reset-password' ? (
              <>
                <h2>New Password</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 6px' }}>
                  Choose a strong new password for your account.
                </p>
                <form onSubmit={submit}>
                  <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}>
                    <label className="auth-label-styled">
                      New Password
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                        <input
                          className="auth-input-styled"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          minLength="6"
                          placeholder="Minimum 6 characters"
                          required
                          style={{ paddingRight: '40px', width: '100%' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--muted, #78716c)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                          }}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>
                    <button className="primary-button" type="submit">
                      {loading ? (
                        <>
                          <Loader2 size={16} className="auth-spinner" /> Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </button>
                  </fieldset>
                </form>
                <ErrorAlert message={message} />
              </>
            ) : (
              <>
                <div className="auth-header" style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: '32px', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                    {mode === 'login' ? 'Welcome back' : 'Create account'} 
                    <span style={{ color: 'var(--gold)', fontFamily: 'serif', fontSize: '28px', lineHeight: 1 }}>✦</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)' }}>
                    {mode === 'login' ? 'Login to continue your journey' : 'Access premium factory pricing & live inventory'}
                  </p>
                </div>

                <form onSubmit={submit}>
                  <fieldset disabled={loading} style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}>
                    {mode === 'register' ? (
                      <div className="auth-register-columns">
                        <div className="auth-column">
                          <label className="auth-label-styled">
                            Full Name
                            <input
                              className="auth-input-styled"
                              value={profile.fullName}
                              onChange={(event) => updateProfile('fullName', event.target.value)}
                              onBlur={(event) => updateProfile('fullName', toTitleCaseName(event.target.value))}
                              autoComplete="name"
                              placeholder="Enter your full name"
                              required
                            />
                          </label>
                          <label className="auth-label-styled">
                            {profile.buyerType === 'user' ? 'Business Name (Optional)' : 'Business Name'}
                            <input
                              className="auth-input-styled"
                              value={profile.businessName}
                              onChange={(event) => updateProfile('businessName', event.target.value)}
                              autoComplete="organization"
                              placeholder="Enter your business name"
                              required={profile.buyerType !== 'user'}
                            />
                          </label>
                          <div className="auth-phone-field">
                            <div className="auth-field-label-row">
                              <span>WhatsApp Number</span>
                              <small>Format: {profile.countryCode} xxxxxxxxxx</small>
                            </div>
                            <div>
                              <select
                                className="auth-input-styled"
                                value={profile.countryCode}
                                onChange={(event) => updateProfile('countryCode', event.target.value)}
                                aria-label="Country code"
                                required
                                style={{ paddingRight: '24px' }}
                              >
                                {countryCodes.map((item) => (
                                  <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                              </select>
                              <input
                                className="auth-input-styled"
                                value={profile.whatsapp}
                                onChange={(event) => updateProfile('whatsapp', event.target.value.replace(/D/g, '').replace(/^0+/, '').slice(0, 10))}
                                inputMode="numeric"
                                autoComplete="tel-national"
                                placeholder="xxxxxxxxxx"
                                pattern="[0-9]{10}"
                                required
                              />
                            </div>
                          </div>
                          <label className="auth-label-styled">
                            Email
                            <input
                              className="auth-input-styled"
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              required
                            />
                          </label>
                          <label className="auth-label-styled">
                            Password
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                              <input
                                className="auth-input-styled"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                minLength="6"
                                placeholder="Minimum 6 characters"
                                required
                                style={{ paddingRight: '40px', width: '100%' }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                style={{
                                  position: 'absolute',
                                  right: '10px',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--muted, #78716c)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '4px',
                                }}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </label>
                        </div>

                        <div className="auth-column">
                          <div className="auth-phone-field">
                            <div className="auth-field-label-row">
                              <span>City, State & Pincode *</span>
                            </div>
                            <div className="auth-city-pincode-inputs">
                              <input
                                className="auth-input-styled"
                                value={profile.city}
                                onChange={(event) => updateProfile('city', event.target.value)}
                                placeholder="City name, State name"
                                autoComplete="address-level2"
                                required
                              />
                              <input
                                className="auth-input-styled"
                                value={profile.pincode}
                                onChange={(event) => updateProfile('pincode', normalizePincodeInput(event.target.value))}
                                inputMode="numeric"
                                autoComplete="postal-code"
                                placeholder="Pincode"
                                required
                              />
                            </div>
                            <span className="auth-city-pincode-note">For delivery zone mapping. Full address not required.</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ink)' }}>Buyer Type</span>
                            <B2BSegmentDropdown
                              value={profile.buyerSubtype || 'Wholesaler (MOQ: 1 Set)'}
                              onChange={(opt) => {
                                setProfile(current => ({
                                  ...current,
                                  buyerType: opt.type,
                                  buyerSubtype: opt.value
                                }));
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ink)' }}>Buying Behaviour</span>
                            <BuyingBehaviorDropdown
                              value={profile.buyingBehavior}
                              onChange={(value) => updateProfile('buyingBehavior', value)}
                            />
                          </div>

                          <fieldset className="auth-category-fieldset">
                            <legend>Interested Categories</legend>
                            <div>
                              {categoryOptions.map((category) => (
                                <label key={category}>
                                  <input
                                    type="checkbox"
                                    checked={profile.interestedCategories.includes(category)}
                                    onChange={() => toggleCategory(category)}
                                  />
                                  <span>{category}</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className="auth-label-styled">
                          Email
                          <div className="auth-input-wrapper">
                            <Mail className="auth-input-icon" size={18} />
                            <input
                              value={email}
                              onChange={(event) => setEmail(event.target.value)}
                              type="email"
                              autoComplete="email"
                              placeholder="you@example.com"
                              required
                            />
                          </div>
                        </label>
                        <label className="auth-label-styled">
                          Password
                          <div className="auth-input-wrapper">
                            <Lock className="auth-input-icon" size={18} />
                            <input
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              minLength="6"
                              placeholder="Enter your password"
                              required
                              style={{ paddingRight: '48px' }}
                            />
                            <button
                              type="button"
                              className="auth-password-toggle"
                              onClick={() => setShowPassword(prev => !prev)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </label>
                        <div className="auth-options-row">
                          <label className="auth-remember-label">
                            <input
                              type="checkbox"
                              className="auth-checkbox"
                              checked={profile.rememberMe || false}
                              onChange={(e) => updateProfile('rememberMe', e.target.checked)}
                            />
                            <span>Remember me</span>
                          </label>
                          <button
                            type="button"
                            className="auth-forgot-btn"
                            onClick={() => { setMode('forgot-password'); setMessage(''); }}
                          >
                            Forgot password?
                          </button>
                        </div>
                      </>
                    )}
                    {mode === 'register' ? (
                      <div className="auth-actions-row-buttons" style={{ marginTop: '16px' }}>
                        <button className="auth-primary-submit-btn" type="submit">
                          {loading ? (
                            <>
                              <Loader2 size={16} className="auth-spinner" /> Creating Account...
                            </>
                          ) : (
                            <>
                              Create Account <ArrowRight size={16} />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="auth-secondary-outline-btn"
                          onClick={() => setMode('login')}
                        >
                          Already registered? Login
                        </button>
                      </div>
                    ) : (
                      <button className="auth-primary-submit-btn" type="submit" style={{ marginTop: '8px' }}>
                        {loading ? (
                          <>
                            <Loader2 size={16} className="auth-spinner" /> Logging in...
                          </>
                        ) : (
                          <>
                            Login <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    )}
                  </fieldset>
                </form>

                {mode === 'login' && (
                  <>
                    <div className="auth-divider">
                      <span>OR</span>
                    </div>
                    <button
                      type="button"
                      className="auth-secondary-outline-btn"
                      onClick={() => setMode('register')}
                      disabled={loading}
                    >
                      <UserPlus size={18} className="btn-icon" />
                      Create a new account
                    </button>
                  </>
                )}

                <div className="auth-footer-secure">
                  <ShieldCheck size={16} />
                  <span>Your information is secure with us</span>
                </div>
                <ErrorAlert message={message} />
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
