import { useState } from 'react';
import { X, LogOut } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { normalizePincodeInput } from '../storefrontShared.jsx';

const buyerTypes = [
  { value: 'wholesale', label: 'Wholeseller' },
  { value: 'reseller', label: 'Reseller' },
];

const buyingBehaviors = [
  { value: 'instant', label: 'Instant Buying' },
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

const categoryOptions = ['Saree', 'Suit', 'Lehenga', 'Dupatta', 'Fabric', 'Accessories'];

function toTitleCaseName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function AuthModal({ open, onClose, user, setUser }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState({
    fullName: '',
    countryCode: '+91',
    whatsapp: '',
    businessName: '',
    buyerType: 'wholesale',
    buyingBehavior: 'instant',
    pincode: '',
    interestedCategories: [],
  });
  const [message, setMessage] = useState('');

  if (!open) return null;

  const userProfile = user?.user_metadata?.buyer_profile || user?.buyer_profile || {};

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
    return {
      full_name: toTitleCaseName(profile.fullName),
      whatsapp: `${profile.countryCode} ${cleanWhatsapp}`,
      whatsapp_country_code: profile.countryCode,
      whatsapp_number: cleanWhatsapp,
      business_name: profile.businessName.trim(),
      buyer_type: profile.buyerType,
      buying_behavior: profile.buyingBehavior,
      pincode: normalizePincodeInput(profile.pincode),
      interested_categories: profile.interestedCategories,
      price_group: profile.buyerType,
      approval_status: 'pending',
    };
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    if (mode === 'register') {
      const cleanName = toTitleCaseName(profile.fullName);
      const cleanWhatsapp = String(profile.whatsapp || '').replace(/\D/g, '').slice(0, 10);

      if (!cleanName || !profile.businessName.trim() || cleanWhatsapp.length !== 10 || normalizePincodeInput(profile.pincode).length !== 6 || profile.interestedCategories.length === 0) {
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
      setMessage(mode === 'register'
        ? 'Demo registration saved with buyer profile.'
        : 'Demo login active. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or .env.local for real accounts.');
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
      setMessage(mode === 'login' ? 'Logged in successfully.' : 'Check your email to confirm registration.');
      if (result.data.user) setUser(result.data.user);
    }
  }

  async function logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('sareeva_user');
    setUser(null);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <section className="auth-modal">
        <button className="icon-button modal-close" onClick={onClose}>
          <X />
        </button>
        {user ? (
          <>
            <h2>Your Account</h2>
            <p>{user.email || 'Demo account'}</p>
            {userProfile.buyer_type && (
              <div className="account-profile-card">
                <span>{userProfile.price_group === 'reseller' ? 'Reseller Price' : 'Wholesale Price'}</span>
                <strong>{userProfile.business_name || userProfile.full_name}</strong>
                <small>
                  {userProfile.buying_behavior === 'order_basis' ? 'Order Basis' : 'Instant Buying'}
                  {userProfile.pincode ? ` · Pincode ${userProfile.pincode}` : ''}
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
                    <span>WhatsApp Number</span>
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
                    <small>Format: {profile.countryCode} xxxxxxxxxx</small>
                  </div>
                  <div className="auth-field-grid">
                    <label>
                      Buyer Type
                      <select
                        value={profile.buyerType}
                        onChange={(event) => updateProfile('buyerType', event.target.value)}
                        required
                      >
                        {buyerTypes.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                      <small className="buyer-type-note">
                        Wholesale: Wholesalers, Retail Shops, Boutiques, Exporters, Online Stores.<br />
                        Reseller: Sell on WhatsApp, Instagram, Facebook.
                      </small>
                    </label>
                    <label>
                      Buying Behaviour
                      <select
                        value={profile.buyingBehavior}
                        onChange={(event) => updateProfile('buyingBehavior', event.target.value)}
                        required
                      >
                        {buyingBehaviors.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Pincode
                    <input
                      value={profile.pincode}
                      onChange={(event) => updateProfile('pincode', normalizePincodeInput(event.target.value))}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      required
                    />
                  </label>
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
      </section>
    </div>
  );
}
