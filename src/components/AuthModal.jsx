/**
 * AuthModal Component
 * Purpose: Provides a premium modal portal handling standard B2B user authentication (login/register).
 * Captures granular corporate profiles (business name, mobile country codes, WhatsApp numbers,
 * buyer roles, buying behaviors, and fabric categories) and integrates with Supabase authentication.
 */
import { useState, useEffect } from 'react';
import { X, LogOut, ArrowLeft } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { normalizePincodeInput } from '../storefrontShared.jsx';
import { syncProfileFromUser } from '../utils/profileHelpers.js';
import { applyAutoApprovalToBuyerProfile, isVaranasiPincode } from '../utils/buyerAccess.js';

const buyerSubtypes = [
  { value: 'Wholesalers', label: 'Wholesalers', type: 'wholesale' },
  { value: 'Retail Shops', label: 'Retail Shops', type: 'wholesale' },
  { value: 'Boutiques', label: 'Boutiques', type: 'wholesale' },
  { value: 'Online Stores', label: 'Online Stores', type: 'wholesale' },
  { value: 'Fashion Designer', label: 'Fashion Designer', type: 'wholesale' },
  { value: 'Exporters', label: 'Exporters', type: 'wholesale' },
  { 
    value: 'Resellers (WhatsApp, Instagram, Facebook)', 
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        Resellers (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', margin: '0 1px' }}>
          {/* WhatsApp Outline SVG */}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', color: 'var(--gold)' }} aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          
          {/* Instagram Outline SVG */}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', color: 'var(--gold)' }} aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          
          {/* Facebook Outline SVG */}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', color: 'var(--gold)' }} aria-hidden="true">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        </span>
        )
      </span>
    ), 
    type: 'reseller' 
  },
  { value: 'Home-Based Reseller', label: 'Home-Based Reseller', type: 'reseller' },
];


const buyingBehaviors = [
  { value: 'instant', label: 'Ready to buy - I purchase stock immediately' },
  { value: 'order_basis', label: 'Order basis - I order after customer confirms' },
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

const categoryOptions = ['Saree', 'Suit', 'Lehenga', 'Dupatta', 'Fabric', 'Accessories'];

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

  const wholesaleOptions = buyerSubtypes.filter(opt => opt.type === 'wholesale');
  const resellerOptions = buyerSubtypes.filter(opt => opt.type === 'reseller');

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
          <div>
            <div className="custom-select-group-title">MOQ: 1 Set (Wholesale Prices)</div>
            {wholesaleOptions.map((opt) => (
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
          <div>
            <div className="custom-select-group-title">MOQ: 1 Piece (Reseller Prices)</div>
            {resellerOptions.map((opt) => (
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
    buyerSubtype: 'Wholesalers',
    buyingBehavior: 'instant',
    city: '',
    pincode: '',
    interestedCategories: [],
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setMessage('');
    }
  }, [open, initialMode]);

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
      buyer_subtype: profile.buyerSubtype || 'Wholesalers',
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
    setMessage('');

    if (mode === 'forgot-password') {
      return handleForgotPassword(event);
    }

    if (mode === 'reset-password') {
      return handleResetPassword(event);
    }

    if (mode === 'register') {
      const cleanName = toTitleCaseName(profile.fullName);
      const cleanWhatsapp = String(profile.whatsapp || '').replace(/\D/g, '').slice(0, 10);

      if (!cleanName || !profile.businessName.trim() || !profile.city.trim() || cleanWhatsapp.length !== 10 || normalizePincodeInput(profile.pincode).length !== 6 || profile.interestedCategories.length === 0) {
        setMessage('Please complete every required field. WhatsApp number must be 10 digits, pincode must be 6 digits, and at least one category is required.');
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
      localStorage.setItem('sareeva_user', JSON.stringify(demoUser));
      setUser(demoUser);
      if (setBuyerProfile) setBuyerProfile(demoProfile);
      setMessage(mode === 'register'
        ? 'Demo registration saved with buyer profile.'
        : 'Demo login active. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env or .env.local for real accounts.');
      return;
    }

    const result =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              buyer_profile: buildBuyerProfile(),
            },
          },
        });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      if (result.data.user) {
        setUser(result.data.user);
      }

      if (mode === 'register' && result.data.session && result.data.user) {
        const profileResult = await syncProfileFromUser(result.data.user);
        if (profileResult.error) {
          setMessage(`Account created, but profile could not be saved: ${profileResult.error.message}`);
          return;
        }
      }

      if (mode === 'login') {
        onClose();
      } else {
        setMessage('Registration saved. Check your email if confirmation is required.');
      }
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
    <div className="modal-backdrop">
      <section className={`auth-modal ${mode}-mode`}>
        <button className="icon-button modal-close" onClick={onClose}>
          <X />
        </button>
        {user ? (
          <>
            <h2>Your Account</h2>
            <p>{user.email || 'Demo account'}</p>
            {/* Welcome Card Disabled per user request */}
            {false && userProfile.buyer_type && (
              <div className="account-profile-card">
                <span>{userProfile.price_group === 'reseller' ? 'Reseller Price' : 'Wholesale Price'}</span>
                <strong>{userProfile.business_name || userProfile.full_name}</strong>
                <small>
                  {userProfile.buying_behavior === 'order_basis' ? 'Order Basis' : 'Instant Buying'}
                  {userProfile.pincode ? ` · Pincode ${userProfile.pincode}` : ''}
                </small>
                <small>
                  {userProfile.approval_status === 'approved'
                    ? 'Price access approved'
                    : isVaranasiPincode(userProfile.pincode)
                      ? 'Varanasi pincode: admin approval required'
                      : 'Approval pending'}
                </small>
              </div>
            )}
            {!isSupabaseConfigured && <p className="warning">Demo mode: configure Supabase in .env or .env.local for real login.</p>}
            <button className="secondary-button icon-label" onClick={logout}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            {mode === 'forgot-password' ? (
              <>
                <button
                  className="text-button"
                  onClick={() => { setMode('login'); setMessage(''); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '13px', color: 'var(--muted)' }}
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
                <h2>Reset Password</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 6px' }}>
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
                <form onSubmit={submit}>
                  <label>
                    Email
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Send Reset Link
                  </button>
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
                    <button
                      className="secondary-button"
                      style={{ marginTop: '8px' }}
                      onClick={() => { setMode('reset-password'); setMessage(''); }}
                    >
                      Simulate Email Click →
                    </button>
                  </div>
                )}
                {message && message !== 'reset-link-sent' && message !== 'demo-reset-sent' && (
                  <p className="form-message">{message}</p>
                )}
              </>
            ) : mode === 'reset-password' ? (
              <>
                <h2>New Password</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, margin: '0 0 6px' }}>
                  Choose a strong new password for your account.
                </p>
                <form onSubmit={submit}>
                  <label>
                    New Password
                    <input
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type="password"
                      autoComplete="new-password"
                      minLength="6"
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Update Password
                  </button>
                </form>
                {message && <p className="form-message">{message}</p>}
              </>
            ) : (
              <>
                <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
                <form onSubmit={submit}>
                  {mode === 'register' && (
                    <>
                      <div className="auth-field-grid">
                        <label>
                          Full Name
                          <input
                            value={profile.fullName}
                            onChange={(event) => updateProfile('fullName', event.target.value)}
                            onBlur={(event) => updateProfile('fullName', toTitleCaseName(event.target.value))}
                            autoComplete="name"
                            required
                          />
                        </label>
                        <label>
                          Business Name
                          <input
                            value={profile.businessName}
                            onChange={(event) => updateProfile('businessName', event.target.value)}
                            autoComplete="organization"
                            required
                          />
                        </label>
                      </div>
                        <div className="auth-phone-field">
                          <div className="auth-field-label-row">
                            <span>City & Pincode *</span>
                          </div>
                          <div className="auth-city-pincode-inputs">
                            <input
                              value={profile.city}
                              onChange={(event) => updateProfile('city', event.target.value)}
                              placeholder="City name"
                              autoComplete="address-level2"
                              required
                            />
                            <input
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
                        <div className="auth-phone-field">
                          <div className="auth-field-label-row">
                            <span>WhatsApp Number</span>
                            <small>Format: {profile.countryCode} xxxxxxxxxx</small>
                          </div>
                          <div>
                            <select
                              value={profile.countryCode}
                              onChange={(event) => updateProfile('countryCode', event.target.value)}
                              aria-label="Country code"
                              required
                            >
                              {countryCodes.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                              ))}
                            </select>
                            <input
                              value={profile.whatsapp}
                              onChange={(event) => updateProfile('whatsapp', event.target.value.replace(/\D/g, '').slice(0, 10))}
                              inputMode="numeric"
                              autoComplete="tel-national"
                              placeholder="xxxxxxxxxx"
                              pattern="[0-9]{10}"
                              required
                            />
                          </div>
                        </div>
                      <div className="auth-field-grid">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--ink)' }}>Buyer Type / Segment</span>
                          <B2BSegmentDropdown
                            value={profile.buyerSubtype || 'Wholesalers'}
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
                    </>
                  )}
                  <label>
                    Email
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      minLength="6"
                      required
                    />
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="text-button auth-forgot-link"
                      onClick={() => { setMode('forgot-password'); setMessage(''); }}
                    >
                      Forgot password?
                    </button>
                  )}
                  <button className="primary-button" type="submit">
                    {mode === 'login' ? 'Login' : 'Create Account'}
                  </button>
                </form>
                <button className="text-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                  {mode === 'login' ? 'Create a new account' : 'Already registered? Login'}
                </button>
                {message && <p className="form-message">{message}</p>}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
