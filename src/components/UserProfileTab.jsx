import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  MapPin, 
  Tag, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Loader2, 
  Lock,
  Save,
  Phone,
  Briefcase,
  Package,
  Landmark,
  Hash,
  ShieldCheck,
  ChevronDown
} from './icons.jsx';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { normalizePincodeInput } from '../storefrontShared.jsx';
import { applyAutoApprovalToBuyerProfile } from '../utils/buyerAccess.js';

const countryCodes = [
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'USA / Canada (+1)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+971', label: 'UAE (+971)' },
  { value: '+65', label: 'Singapore (+65)' },
  { value: '+60', label: 'Malaysia (+60)' },
  { value: '+61', label: 'Australia (+61)' },
  { value: '+974', label: 'Qatar (+974)' },
  { value: '+966', label: 'Saudi Arabia (+966)' },
  { value: '+965', label: 'Kuwait (+965)' },
];

const categoryOptions = ['Saree', 'Suit', 'Lehenga', 'Dupatta', 'Under 999'];

const ACCOUNT_ROLE_OPTIONS = [
  { id: 'customer', label: 'Customer', buyerType: 'customer', buyerSubtype: 'Customer' },
  { id: 'reseller', label: 'Reseller', buyerType: 'customer', buyerSubtype: 'Reseller' },
  { id: 'boutique', label: 'Boutique', buyerType: 'customer', buyerSubtype: 'Boutique' },
  { id: 'wholesaler', label: 'Wholesaler', buyerType: 'customer', buyerSubtype: 'Wholesaler' },
  { id: 'online_store', label: 'Online Store', buyerType: 'customer', buyerSubtype: 'Online Store' },
  { id: 'vendor', label: 'Vendor', buyerType: 'vendor', buyerSubtype: 'Vendor' },
];

function toTitleCase(str) {
  return String(str || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function UserProfileTab({ user, buyerProfile, setBuyerProfile, setUser }) {
  const [formData, setFormData] = useState({
    fullName: '',
    countryCode: '+91',
    whatsappNumber: '',
    businessName: '',
    buyerSubtype: 'Customer',
    buyingBehavior: 'instant',
    city: '',
    state: '',
    pincode: '',
    interestedCategories: ['Saree'],
  });

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Initialize form data from existing buyerProfile and user metadata
  useEffect(() => {
    const p = buyerProfile || user?.user_metadata?.buyer_profile || {};
    const rawWhatsapp = p.whatsapp_number || p.whatsapp || '';
    const cleanWhatsapp = String(rawWhatsapp).replace(/\D/g, '').slice(-10);

    let cleanCity = String(p.city || '').trim();
    let cleanState = String(p.state || '').trim();

    // Auto-decompose legacy "City, State" composite data
    if (cleanCity.includes(',')) {
      const parts = cleanCity.split(',');
      cleanCity = parts[0]?.trim() || '';
      if (!cleanState && parts[1]) {
        cleanState = parts.slice(1).join(',').trim();
      }
    }

    setFormData({
      fullName: p.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '',
      countryCode: p.whatsapp_country_code || '+91',
      whatsappNumber: cleanWhatsapp,
      businessName: p.business_name || '',
      buyerSubtype: p.buyer_subtype || (p.buyer_type === 'vendor' ? 'Vendor' : 'Customer'),
      buyingBehavior: p.buying_behavior || 'instant',
      city: cleanCity,
      state: cleanState,
      pincode: p.pincode || '',
      interestedCategories: Array.isArray(p.interested_categories) && p.interested_categories.length > 0 
        ? p.interested_categories 
        : ['Saree'],
    });
  }, [buyerProfile, user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (statusMessage) setStatusMessage(null);
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const exists = prev.interestedCategories.includes(category);
      if (exists) {
        if (prev.interestedCategories.length === 1) return prev;
        return {
          ...prev,
          interestedCategories: prev.interestedCategories.filter((c) => c !== category),
        };
      }
      return {
        ...prev,
        interestedCategories: [...prev.interestedCategories, category],
      };
    });
  };

  const isComplete = Boolean(
    formData.fullName.trim() &&
    formData.whatsappNumber.length === 10 &&
    formData.city.trim() &&
    formData.state.trim() &&
    formData.pincode.length === 6
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setStatusMessage(null);

    const cleanFullName = toTitleCase(formData.fullName);
    const cleanWhatsapp = String(formData.whatsappNumber || '').replace(/\D/g, '').slice(0, 10);
    const cleanPincode = normalizePincodeInput(formData.pincode);

    // Validation
    if (!cleanFullName) {
      setStatusMessage({ type: 'error', text: 'Please enter your full name.' });
      return;
    }
    if (cleanWhatsapp.length !== 10) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid 10-digit WhatsApp number.' });
      return;
    }
    if (!formData.city.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your city.' });
      return;
    }
    if (!formData.state.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your state.' });
      return;
    }
    if (cleanPincode.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid 6-digit postal pincode.' });
      return;
    }

    setSaving(true);

    try {
      const matchedRole = ACCOUNT_ROLE_OPTIONS.find(
        (opt) => opt.buyerSubtype === formData.buyerSubtype
      );
      const isVendor = matchedRole?.buyerType === 'vendor' || formData.buyerSubtype === 'Vendor';

      const updatedBuyerProfile = applyAutoApprovalToBuyerProfile({
        ...(buyerProfile || {}),
        full_name: cleanFullName,
        whatsapp: `${formData.countryCode} ${cleanWhatsapp}`,
        whatsapp_country_code: formData.countryCode,
        whatsapp_number: cleanWhatsapp,
        business_name: formData.businessName.trim(),
        buyer_type: isVendor ? 'vendor' : 'customer',
        buyer_subtype: formData.buyerSubtype,
        role: isVendor ? 'vendor' : (buyerProfile?.role || 'customer'),
        buying_behavior: formData.buyingBehavior,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: cleanPincode,
        interested_categories: formData.interestedCategories,
        updated_at: new Date().toISOString(),
      });

      if (isSupabaseConfigured && user?.id) {
        // 1. Update Supabase Auth User metadata
        const { data: updatedAuth, error: authError } = await supabase.auth.updateUser({
          data: {
            buyer_profile: updatedBuyerProfile,
            full_name: cleanFullName,
            role: isVendor ? 'vendor' : (buyerProfile?.role || 'customer'),
          },
        });

        if (authError) throw authError;

        // 2. Upsert into Supabase `profiles` table
        const profileRow = {
          id: user.id,
          email: user.email || '',
          full_name: cleanFullName,
          whatsapp: `${formData.countryCode} ${cleanWhatsapp}`,
          whatsapp_country_code: formData.countryCode,
          whatsapp_number: cleanWhatsapp,
          business_name: formData.businessName.trim(),
          buyer_type: isVendor ? 'vendor' : 'customer',
          buyer_subtype: formData.buyerSubtype,
          role: isVendor ? 'vendor' : (buyerProfile?.role || 'customer'),
          buying_behavior: formData.buyingBehavior,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: cleanPincode,
          interested_categories: formData.interestedCategories,
          price_group: updatedBuyerProfile.price_group || 'approved',
          approval_status: updatedBuyerProfile.approval_status || 'approved',
          updated_at: new Date().toISOString(),
        };

        const { error: dbError } = await supabase
          .from('profiles')
          .upsert(profileRow, { onConflict: 'id' });

        if (dbError) {
          console.error('Profiles table sync error:', dbError);
          throw dbError;
        }

        if (setUser && updatedAuth?.user) {
          setUser(updatedAuth.user);
        }
      }

      // 3. Update React parent state
      if (setBuyerProfile) {
        setBuyerProfile(updatedBuyerProfile);
      }

      // 4. Update cached localStorage user
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('sareeva_user');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.user_metadata = {
              ...(parsed.user_metadata || {}),
              buyer_profile: updatedBuyerProfile,
              full_name: cleanFullName,
            };
            localStorage.setItem('sareeva_user', JSON.stringify(parsed));
          }
        } catch (e) {
          console.warn('LocalStorage user update error:', e);
        }
      }

      setStatusMessage({
        type: 'success',
        text: 'Your profile details have been successfully updated.',
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save changes. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-profile-panel">
      {/* Intro Header */}
      <div className="account-profile-header-wrap">
        <div className="account-profile-header-left">
          <h3 className="account-profile-heading">Profile &amp; Business Details</h3>
          <p className="account-profile-subheading">
            Manage your personal contact details, boutique information, and sourcing preferences.
          </p>
        </div>
        <div className="account-profile-header-badge">
          {isComplete ? (
            <span className="profile-status-pill complete">
              <ShieldCheck size={14} />
              <span>Wholesale Verified</span>
            </span>
          ) : (
            <span className="profile-status-pill incomplete">
              <AlertCircle size={14} />
              <span>Incomplete Profile</span>
            </span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className={`account-profile-alert ${statusMessage.type}`} role="alert">
          {statusMessage.type === 'success' ? (
            <Check size={18} className="alert-icon-success" />
          ) : (
            <AlertCircle size={18} className="alert-icon-error" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="account-profile-form">
        {/* SECTION 1: Personal & Contact Details */}
        <div className="account-profile-section">
          <div className="account-profile-section-header">
            <div className="account-profile-section-icon">
              <User size={15} />
            </div>
            <span className="account-profile-section-title">Personal &amp; Contact Information</span>
          </div>

          <div className="account-profile-grid">
            {/* Full Name */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-fullname">
                <span>Full Name</span>
                <span className="account-label-required">*</span>
              </label>
              <div className="account-input-with-icon">
                <User size={16} className="account-field-icon" />
                <input
                  id="profile-fullname"
                  type="text"
                  className="account-form-input"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="e.g. Mehefuj Mondal"
                  required
                />
              </div>
              <span className="account-field-hint">Primary contact name for invoices &amp; dispatch</span>
            </div>

            {/* Email Address (Read-only) */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-email">
                <span>Email Address</span>
                <span className="account-label-badge"><Lock size={11} /> Verified</span>
              </label>
              <div className="account-input-with-icon">
                <Mail size={16} className="account-field-icon" />
                <input
                  id="profile-email"
                  type="email"
                  className="account-form-input readonly"
                  value={user?.email || ''}
                  disabled
                  readOnly
                />
              </div>
              <span className="account-field-hint">Linked to your Supabase login identity</span>
            </div>

            {/* WhatsApp Country Code & Phone */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-whatsapp">
                <span>WhatsApp Number</span>
                <span className="account-label-required">*</span>
              </label>
              <div className="account-phone-group">
                <div className="account-country-select-wrap">
                  <select
                    className="account-country-select"
                    value={formData.countryCode}
                    onChange={(e) => handleChange('countryCode', e.target.value)}
                    aria-label="Country Code"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="account-select-arrow" />
                </div>
                <div className="account-input-with-icon">
                  <Phone size={15} className="account-field-icon" />
                  <input
                    id="profile-whatsapp"
                    type="tel"
                    className="account-form-input"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <span className="account-field-hint">Used for order tracking &amp; dispatch updates</span>
            </div>

            {/* Business / Boutique Name */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-business">
                <span>Business / Boutique Name</span>
              </label>
              <div className="account-input-with-icon">
                <Building2 size={16} className="account-field-icon" />
                <input
                  id="profile-business"
                  type="text"
                  className="account-form-input"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="e.g. Royal Sarees Boutique"
                />
              </div>
              <span className="account-field-hint">Displayed on custom catalogs &amp; wholesale records</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Role & Sourcing Profile */}
        <div className="account-profile-section">
          <div className="account-profile-section-header">
            <div className="account-profile-section-icon">
              <Briefcase size={15} />
            </div>
            <span className="account-profile-section-title">Business Role &amp; Sourcing Requirements</span>
          </div>

          <div className="account-profile-grid">
            {/* Account Role (Read-only / Unchangeable) */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-role">
                <span>Account Role</span>
                <span className="account-label-badge neutral"><Lock size={11} /> Assigned</span>
              </label>
              <div className="account-input-with-icon">
                <Tag size={16} className="account-field-icon" />
                <input
                  id="profile-role"
                  type="text"
                  className="account-form-input readonly"
                  value={formData.buyerSubtype || 'Customer'}
                  disabled
                  readOnly
                />
              </div>
              <span className="account-field-hint">Managed by Weave365 admin &amp; tier verification</span>
            </div>

            {/* Primary Sourcing Need */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-sourcing">
                <span>Primary Sourcing Need</span>
              </label>
              <div className="account-select-with-icon">
                <Package size={16} className="account-field-icon" />
                <select
                  id="profile-sourcing"
                  className="account-form-select"
                  value={formData.buyingBehavior}
                  onChange={(e) => handleChange('buyingBehavior', e.target.value)}
                >
                  <option value="instant">Ready Stock &amp; Instant Dispatch</option>
                  <option value="bulk">Bulk Wholesale / Full Set Orders</option>
                  <option value="custom">Custom Weaving &amp; Production</option>
                </select>
                <ChevronDown size={14} className="account-select-arrow" />
              </div>
              <span className="account-field-hint">Helps our weavers prioritize inventory fulfillment</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Location Details */}
        <div className="account-profile-section">
          <div className="account-profile-section-header">
            <div className="account-profile-section-icon">
              <MapPin size={15} />
            </div>
            <span className="account-profile-section-title">Location &amp; Dispatch Address</span>
          </div>

          <div className="account-profile-grid-3">
            {/* City */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-city">
                <span>City</span>
                <span className="account-label-required">*</span>
              </label>
              <div className="account-input-with-icon">
                <MapPin size={16} className="account-field-icon" />
                <input
                  id="profile-city"
                  type="text"
                  className="account-form-input"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="e.g. Varanasi"
                  required
                />
              </div>
            </div>

            {/* State */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-state">
                <span>State</span>
                <span className="account-label-required">*</span>
              </label>
              <div className="account-input-with-icon">
                <Landmark size={16} className="account-field-icon" />
                <input
                  id="profile-state"
                  type="text"
                  className="account-form-input"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  required
                />
              </div>
            </div>

            {/* Pincode */}
            <div className="account-form-field">
              <label className="account-form-label" htmlFor="profile-pincode">
                <span>Pincode</span>
                <span className="account-label-required">*</span>
              </label>
              <div className="account-input-with-icon">
                <Hash size={16} className="account-field-icon" />
                <input
                  id="profile-pincode"
                  type="text"
                  className="account-form-input"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', normalizePincodeInput(e.target.value))}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  required
                />
              </div>
            </div>
          </div>
          <span className="account-field-hint account-location-hint">
            Primary destination used to calculate wholesale logistics, transit times, and door delivery.
          </span>
        </div>

        {/* SECTION 4: Category Interests */}
        <div className="account-profile-section">
          <div className="account-profile-section-header">
            <div className="account-profile-section-icon">
              <Sparkles size={15} />
            </div>
            <span className="account-profile-section-title">Interested Saree &amp; Apparel Categories</span>
          </div>
          <p className="account-section-desc">
            Select categories you frequently source to curate your personalized catalog recommendations.
          </p>

          <div className="account-category-pills">
            {categoryOptions.map((category) => {
              const isSelected = formData.interestedCategories.includes(category);
              return (
                <button
                  type="button"
                  key={category}
                  className={`account-category-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleCategoryToggle(category)}
                  aria-pressed={isSelected}
                >
                  <span className={`pill-check-indicator ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="pill-label">{category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Action Bar */}
        <div className="account-profile-actions">
          <button
            type="submit"
            disabled={saving}
            className="account-save-profile-btn"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Saving Profile Changes...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
