/**
 * @file EarlyAccessPage.jsx
 * @description Early access request form for boutique owners, retailers, and resellers.
 * Collects name, whatsapp number, business type, buying budget, city/pincode, and online store presence.
 * Form submits data to a Google Sheets API endpoint for team review.
 */

import { useState, useMemo } from 'react';
import { 
  Building2, 
  Store, 
  Sparkles, 
  Ship, 
  Globe, 
  Share2, 
  Home as HomeIcon, 
  Handshake, 
  Tag, 
  Palette, 
  Check, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import SliderCaptcha from '../components/SliderCaptcha';

const buyerTypes = [
  { id: 'wholesaler', label: 'Wholesaler', icon: Building2 },
  { id: 'retail_shop', label: 'Retail shop', icon: Store },
  { id: 'boutique', label: 'Boutique', icon: Sparkles },
  { id: 'exporter', label: 'Exporter', icon: Ship },
  { id: 'online_store', label: 'Online store', icon: Globe },
  { id: 'reseller', label: 'Reseller', icon: Share2 },
  { id: 'home_reseller', label: 'Home-based reseller', icon: HomeIcon },
  { id: 'sourcing_partner', label: 'Sourcing partner', icon: Handshake },
  { id: 'white_label', label: 'White label brand', icon: Tag },
  { id: 'designer', label: 'Fashion designer', icon: Palette }
];

const budgetOptions = [
  { value: 'under_50k', label: 'Under ₹50,000' },
  { value: '50k_100k', label: '₹50,000 - ₹1,00,000' },
  { value: '100k_500k', label: '₹1,00,000 - ₹5,00,000' },
  { value: 'above_500k', label: '₹5,00,000+' }
];

const initialForm = {
  fullName: '',
  whatsappNumber: '',
  buyerType: '',
  monthlyBudget: '',
  buyingPreference: '',
  city: '',
  pincode: '',
  storeLink: '',
  agreement: false
};

export function EarlyAccessPage({ navigate }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetSlider, setResetSlider] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
    setSubmitError('');
  };

  const handleWhatsappChange = (value) => {
    // Keep only digits and plus sign
    const raw = value.replace(/[^\d+]/g, '');
    let formatted = raw;
    
    // Add simple spaces for reading if it starts with +91 or is a 10 digit number
    if (raw.startsWith('+91') && raw.length > 3) {
      const rest = raw.slice(3);
      if (rest.length > 5) {
        formatted = `+91 ${rest.slice(0, 5)} ${rest.slice(5, 10)}`;
      } else {
        formatted = `+91 ${rest}`;
      }
    } else if (raw.length === 10 && !raw.startsWith('+')) {
      formatted = `+91 ${raw.slice(0, 5)} ${raw.slice(5, 10)}`;
    }
    
    updateField('whatsappNumber', formatted);
  };

  const handlePincodeChange = (value) => {
    const raw = value.replace(/\D/g, '').slice(0, 6);
    updateField('pincode', raw);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.buyerType) {
      setFormError('Please select your buyer type.');
      return;
    }
    if (!form.buyingPreference) {
      setFormError('Please select your buying preference.');
      return;
    }
    if (!form.agreement) {
      setFormError('Please accept the buyer terms agreement checkbox.');
      return;
    }

    if (!isVerified) {
      setFormError('Please slide the verification bar to confirm you are a genuine visitor.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setSubmitError('');

    const cleanWhatsapp = form.whatsappNumber.replace(/\s/g, '');

    const capitalize = (str) => {
      if (!str) return '';
      return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    const submissionData = {
      submittedAt: new Date().toISOString(),
      fullName: capitalize(form.fullName),
      whatsappNumber: cleanWhatsapp,
      buyerType: buyerTypes.find(t => t.id === form.buyerType)?.label || form.buyerType,
      buyingPreference: form.buyingPreference === 'ready_to_buy' ? 'Ready to buy (immediately)' : 'Order basis (after confirmation)',
      monthlyBudget: budgetOptions.find(b => b.value === form.monthlyBudget)?.label || form.monthlyBudget || 'Not specified',
      city: capitalize(form.city),
      pincode: form.pincode,
      storeLink: form.storeLink.trim() || 'None provided',
      status: 'pending_review',
      sliderVerified: true
    };

    const handleSuccess = () => {
      setSubmitted(true);
      setForm(initialForm);
      setIsVerified(false);
      setResetSlider(true);
      // Turn off reset trigger after state propagates
      setTimeout(() => setResetSlider(false), 100);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // Submit via server-side API route (avoids CORS/redirect issues with Google Apps Script)
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const data = await res.json();
      console.log('[EarlyAccess] API response:', data);

      if (data.status === 'error') {
        setSubmitError(data.error || 'Submission failed. Please try again.');
        setIsVerified(false);
        setResetSlider(true);
        setTimeout(() => setResetSlider(false), 100);
      } else {
        handleSuccess();
      }
    } catch (err) {
      console.error('[EarlyAccess] Fetch error:', err);
      setSubmitError('Unable to connect to registration servers. Please check your network and try again.');
      setIsVerified(false);
      setResetSlider(true);
      setTimeout(() => setResetSlider(false), 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="early-access-page-wrapper">
      <div className="early-access-container">
        
        {submitted ? (
          <div className="early-access-success-card animate-fade-in" role="status" aria-live="polite">
            <CheckCircle2 className="success-icon" size={60} />
            <h2>Thank you!</h2>
            <p>Our team will review your request within 24–48 hours.</p>
            <button 
              type="button" 
              className="success-home-btn"
              onClick={() => navigate('home')}
            >
              Return to Homepage
            </button>
          </div>
        ) : (
          <div className="early-access-form-card animate-fade-in">
            <div className="early-access-header">
              <span className="early-access-kicker">WEAVE 365 • WHOLESALE</span>
              <h1>Get early access to new arrivals</h1>
              <p>For verified buyers only. Fill in your details — our team will review and share the WhatsApp group link.</p>
            </div>

            <form className="early-access-form" onSubmit={handleSubmit}>
              
              {/* Row 1: Full name and WhatsApp */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label htmlFor="fullName">Full name *</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    placeholder="Your name"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="whatsappNumber">WhatsApp number *</label>
                  <input
                    id="whatsappNumber"
                    type="tel"
                    required
                    value={form.whatsappNumber}
                    onChange={(e) => handleWhatsappChange(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Grid: Buyer Type Select */}
              <div className="form-group select-buyer-type-group">
                <label>I am a — select your buyer type *</label>
                <div className="buyer-type-grid">
                  {buyerTypes.map((type) => {
                    const IconComponent = type.icon;
                    const isSelected = form.buyerType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        className={`buyer-type-card-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => updateField('buyerType', type.id)}
                        disabled={isSubmitting}
                      >
                        <div className="radio-circle">
                          {isSelected && <div className="radio-dot" />}
                        </div>
                        <IconComponent className="buyer-icon" size={16} />
                        <span className="buyer-label">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buying Preference & Budget (swapped order based on user feedback) */}
              <div className="form-group preference-buying-group">
                <label>Buying preference *</label>
                <div className="buying-preference-flex">
                  <button
                    type="button"
                    className={`preference-card-btn ${form.buyingPreference === 'ready_to_buy' ? 'active' : ''}`}
                    onClick={() => updateField('buyingPreference', 'ready_to_buy')}
                    disabled={isSubmitting}
                  >
                    <div className="radio-circle">
                      {form.buyingPreference === 'ready_to_buy' && <div className="radio-dot" />}
                    </div>
                    <div className="pref-content">
                      <strong>Ready to buy</strong>
                      <span>I purchase stock immediately</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`preference-card-btn ${form.buyingPreference === 'order_basis' ? 'active' : ''}`}
                    onClick={() => updateField('buyingPreference', 'order_basis')}
                    disabled={isSubmitting}
                  >
                    <div className="radio-circle">
                      {form.buyingPreference === 'order_basis' && <div className="radio-dot" />}
                    </div>
                    <div className="pref-content">
                      <strong>Order basis</strong>
                      <span>I order after customer confirms</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Budget Option Select */}
              <div className="form-group">
                <label htmlFor="monthlyBudget">Monthly buying budget</label>
                <div className="select-wrapper">
                  <select
                    id="monthlyBudget"
                    value={form.monthlyBudget}
                    onChange={(e) => updateField('monthlyBudget', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Select approximate monthly spend</option>
                    {budgetOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City and Pincode */}
              <div className="form-group">
                <label>City & Pincode *</label>
                <div className="city-pincode-grid">
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="City name"
                    disabled={isSubmitting}
                    className="city-input"
                  />
                  <input
                    type="text"
                    required
                    value={form.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="Pincode"
                    disabled={isSubmitting}
                    pattern="[0-9]{6}"
                    maxLength={6}
                    className="pincode-input"
                  />
                </div>
                <span className="field-hint">For delivery zone mapping. Full address not required.</span>
              </div>

              {/* Optional Store / page link */}
              <div className="form-group">
                <label htmlFor="storeLink">Your shop / page / store link <span className="optional-label">(optional but preferred)</span></label>
                <input
                  id="storeLink"
                  type="text"
                  value={form.storeLink}
                  onChange={(e) => updateField('storeLink', e.target.value)}
                  placeholder="Instagram, Facebook, website, or Meesho link"
                  disabled={isSubmitting}
                />
                <span className="field-hint">Sharing a link speeds up your verification significantly.</span>
              </div>

              {/* Checkbox */}
              <div className="form-group agreement-wrapper">
                <label className="agreement-checkbox-container">
                  <input
                    type="checkbox"
                    checked={form.agreement}
                    onChange={(e) => updateField('agreement', e.target.checked)}
                    disabled={isSubmitting}
                    required
                  />
                  <span className="checkmark-box" />
                  <span className="agreement-text">
                    I am a genuine buyer / reseller and understand that access is subject to Weave 365 team approval.
                  </span>
                </label>
              </div>

              <SliderCaptcha 
                onVerify={setIsVerified}
                isReset={resetSlider}
              />

              {formError && <div className="form-error-msg">{formError}</div>}
              {submitError && <div className="form-error-msg">{submitError}</div>}

              {/* Submit CTA */}
              <button 
                type="submit" 
                className="submit-cta-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="spinner" size={18} /> Processing Request...
                  </>
                ) : (
                  <>
                    Request early access <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="footer-review-caption">We review every request manually. Approval typically takes 24–48 hours.</p>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
