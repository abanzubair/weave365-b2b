import { useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
} from 'lucide-react';
import artisanImage from '../../assets/artisan_at_loom_premium.png';
import { assetSrc } from '../utils/assetSrc.js';

const businessTypes = ['Weaver', 'Master Weaver', 'Manufacturer', 'Trader', 'Job Worker', 'Supplier'];
const productCategories = ['Saree', 'Suit', 'Dupatta', 'Lehenga', 'Fabric', 'Accessories'];
const productionCapacities = ['Small Scale', 'Medium Scale', 'Large Scale'];
const experienceRanges = ['0-2 Years', '3-5 Years', '5-10 Years', '10+ Years'];
const dispatchCapabilities = ['Pan India', 'Export Orders', 'Custom Orders', 'Assorted Sets'];

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

export function TrustedPartnerRegistrationPage() {
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const heroImage = assetSrc(artisanImage);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const toggleArrayValue = (field, value) => {
    setForm((current) => {
      const existing = current[field];
      return {
        ...current,
        [field]: existing.includes(value)
          ? existing.filter((item) => item !== value)
          : [...existing, value],
      };
    });
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.productCategories.length === 0) {
      setFormError('Please select at least one product category.');
      return;
    }

    if (form.dispatchCapabilities.length === 0) {
      setFormError('Please select at least one dispatch capability.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setSubmitError('');

    const cleanMobile = form.mobile.trim();

    // 1. Check locally (immediate check)
    // 1. Check locally (immediate check)
    try {
      const existing = JSON.parse(localStorage.getItem('weave365_vendor_applications') || '[]');
      const isDuplicate = existing.some((app) => {
        const cleanExisting = app.mobile.trim().replace(/\D/g, '').slice(-10);
        const cleanInput = cleanMobile.replace(/\D/g, '').slice(-10);
        return cleanExisting === cleanInput && cleanInput.length === 10;
      });
      if (isDuplicate) {
        setFormError('An application has already been submitted with this mobile number.');
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.warn('Unable to verify duplicate application locally', error);
    }

    // 2. Check globally via CSV if configured
    const csvUrl = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_CSV_URL;
    if (csvUrl) {
      try {
        const response = await fetch(csvUrl);
        if (response.ok) {
          const csvText = await response.text();
          const rows = csvText.split('\n').map(row => row.split(','));
          const isGlobalDuplicate = rows.some(columns => {
            if (columns.length > 2) {
              const cleanExisting = columns[2].replace(/\D/g, '').slice(-10);
              const cleanInput = cleanMobile.replace(/\D/g, '').slice(-10);
              return cleanExisting === cleanInput && cleanInput.length === 10;
            }
            return false;
          });

          if (isGlobalDuplicate) {
            setFormError('An application has already been submitted with this mobile number.');
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Unable to verify duplicate application globally', err);
      }
    }

    const capitalizeWords = (str) => {
      if (!str) return '';
      return str
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const application = {
      ...form,
      fullName: capitalizeWords(form.fullName),
      city: capitalizeWords(form.city),
      mobile: form.mobile.replace(/\s/g, ''),
      aadhaar: form.aadhaar.replace(/\s/g, ''),
      gstNumber: form.gstNumber ? form.gstNumber.replace(/\s/g, '') : '',
      submittedAt: new Date().toISOString(),
      status: 'pending_manual_review',
    };

    // Save locally
    try {
      const existing = JSON.parse(localStorage.getItem('weave365_vendor_applications') || '[]');
      localStorage.setItem('weave365_vendor_applications', JSON.stringify([application, ...existing]));
    } catch (error) {
      console.warn('Unable to save vendor application locally', error);
    }

    // Google Sheets integration via Apps Script Web App
    const endpoint = process.env.NEXT_PUBLIC_VENDOR_REGISTRATION_SHEET_URL;
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          mode: 'no-cors', // Highly recommended to bypass Apps Script CORS redirects
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(application),
        });
        setSubmitted(true);
        setForm(initialForm);
      } catch (error) {
        console.error('Error submitting application:', error);
        setSubmitError('Failed to send application to Google Sheets. Please check your internet connection.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Local fallback success if no sheet API endpoint is set up yet
      setSubmitted(true);
      setForm(initialForm);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="trusted-registration-page">
      <section className="trusted-registration-hero" aria-labelledby="trusted-registration-heading">
        <img src={heroImage} alt="Weaver preparing textile products for Weave365" />
        <div className="trusted-registration-hero-content">
          <h1 id="trusted-registration-heading">Trusted Partner Registration</h1>
          <p>Share your craft, capacity, and product details for manual review by the Weave 365 team.</p>
        </div>
      </section>

      <section className="vendor-onboarding-section trusted-registration-section" id="trusted-partner-registration">
        <div className="vendor-onboarding-shell">
          <aside className="vendor-onboarding-aside" aria-label="Trusted partner approval process">
            <div className="vendor-aside-header">
              <div className="vendor-aside-icon">
                <ShieldCheck size={30} />
              </div>
              <h1>Verification & Onboarding</h1>
            </div>
            <p>
              Apply to list your products on Weave365. Every supplier is verified before products
              go live, so buyers get consistent quality and partners get a serious marketplace.
            </p>

            <div className="vendor-approval-flow">
              {approvalSteps.map((step, index) => (
                <div className="vendor-approval-step" key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step}</strong>
                </div>
              ))}
            </div>

            <div className="vendor-quality-note">
              <BadgeCheck size={20} />
              <p>
                No instant self-service onboarding. Our team reviews fulfillment capability,
                product quality, and verification details before approval.
              </p>
            </div>
          </aside>

          <div className="vendor-form-panel">
            {submitted ? (
              <div className="vendor-success-card" role="status" aria-live="polite">
                <CheckCircle2 size={42} />
                <h2>Thank you for applying.</h2>
                <p>Our team will review your details and contact you shortly.</p>
              </div>
            ) : (
              <form className="vendor-registration-form" onSubmit={handleSubmit}>
                <div className="vendor-form-heading">
                  <ClipboardCheck size={24} />
                  <div>
                    <h2>Onboarding Form</h2>
                    <p>Fields marked with * are required for verification.</p>
                  </div>
                </div>

                <fieldset className="vendor-form-section">
                  <legend>Basic Information</legend>
                  <div className="vendor-form-grid">
                    <label>
                      Full Name *
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(event) => {
                          const val = event.target.value;
                          const capitalized = val
                            .split(' ')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                          updateField('fullName', capitalized);
                        }}
                        placeholder="Enter full name"
                        required
                      />
                    </label>
                    <label>
                      Mobile Number *
                      <input
                        type="tel"
                        value={form.mobile}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/\D/g, '').slice(0, 10);
                          if (raw.length > 5) {
                            updateField('mobile', `${raw.slice(0, 5)} ${raw.slice(5)}`);
                          } else {
                            updateField('mobile', raw);
                          }
                        }}
                        placeholder="12345 67890"
                        inputMode="numeric"
                        pattern="\d{5}\s\d{5}"
                        title="Enter a 10 digit mobile number in the format XXXXX XXXXX"
                        required
                      />
                    </label>
                    <label>
                      Email Address *
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        placeholder="name@example.com"
                        required
                      />
                    </label>
                    <label>
                      Aadhaar Number *
                      <input
                        type="text"
                        value={form.aadhaar}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/\D/g, '').slice(0, 12);
                          const parts = [];
                          for (let i = 0; i < raw.length; i += 4) {
                            parts.push(raw.substring(i, i + 4));
                          }
                          updateField('aadhaar', parts.join(' '));
                        }}
                        placeholder="1234 5678 9012"
                        inputMode="numeric"
                        pattern="\d{4}\s\d{4}\s\d{4}"
                        title="Enter a 12 digit Aadhaar number in the format XXXX XXXX XXXX"
                        required
                      />
                    </label>
                    <label className="vendor-form-wide">
                      City / Location *
                      <input
                        type="text"
                        value={form.city}
                        onChange={(event) => {
                          const val = event.target.value;
                          const capitalized = val
                            .split(' ')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                          updateField('city', capitalized);
                        }}
                        placeholder="Varanasi, Lohta, Kotwa, Ramnagar, etc."
                        required
                      />
                    </label>
                  </div>
                </fieldset>

                <fieldset className="vendor-form-section">
                  <legend>Business Information</legend>
                  <div className="vendor-form-grid">
                    <label>
                      Business Type *
                      <select
                        value={form.businessType}
                        onChange={(event) => updateField('businessType', event.target.value)}
                        required
                      >
                        <option value="">Select business type</option>
                        {businessTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </label>
                    <label>
                      Production Capacity *
                      <select
                        value={form.productionCapacity}
                        onChange={(event) => updateField('productionCapacity', event.target.value)}
                        required
                      >
                        <option value="">Select capacity</option>
                        {productionCapacities.map((capacity) => <option key={capacity} value={capacity}>{capacity}</option>)}
                      </select>
                    </label>
                    <label className="vendor-form-wide">
                      Monthly Supply Capacity *
                      <input
                        type="text"
                        value={form.monthlyCapacity}
                        onChange={(event) => updateField('monthlyCapacity', event.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 200"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                      />
                    </label>
                  </div>
                  <div className="vendor-chip-group" role="group" aria-label="Product Category">
                    <span>Product Category *</span>
                    <div>
                      {productCategories.map((category) => (
                        <label className="vendor-chip-option" key={category}>
                          <input
                            type="checkbox"
                            checked={form.productCategories.includes(category)}
                            onChange={() => toggleArrayValue('productCategories', category)}
                          />
                          {category}
                        </label>
                      ))}
                    </div>
                  </div>
                </fieldset>

                <fieldset className="vendor-form-section">
                  <legend>Quality & Fulfillment</legend>
                  <div className="vendor-radio-grid">
                    <div className="vendor-radio-block">
                      <span>Ready Stock Available? *</span>
                      <label><input type="radio" name="readyStock" value="Yes" checked={form.readyStock === 'Yes'} onChange={(event) => updateField('readyStock', event.target.value)} required /> Yes</label>
                      <label><input type="radio" name="readyStock" value="No" checked={form.readyStock === 'No'} onChange={(event) => updateField('readyStock', event.target.value)} /> No</label>
                    </div>
                    <div className="vendor-radio-block">
                      <span>Can You Handle Bulk Orders? *</span>
                      <label><input type="radio" name="bulkOrders" value="Yes" checked={form.bulkOrders === 'Yes'} onChange={(event) => updateField('bulkOrders', event.target.value)} required /> Yes</label>
                      <label><input type="radio" name="bulkOrders" value="No" checked={form.bulkOrders === 'No'} onChange={(event) => updateField('bulkOrders', event.target.value)} /> No</label>
                    </div>
                  </div>
                  <div className="vendor-chip-group" role="group" aria-label="Dispatch Capability">
                    <span>Dispatch Capability *</span>
                    <div>
                      {dispatchCapabilities.map((capability) => (
                        <label className="vendor-chip-option" key={capability}>
                          <input
                            type="checkbox"
                            checked={form.dispatchCapabilities.includes(capability)}
                            onChange={() => toggleArrayValue('dispatchCapabilities', capability)}
                          />
                          {capability}
                        </label>
                      ))}
                    </div>
                  </div>
                </fieldset>

                <fieldset className="vendor-form-section">
                  <legend>Verification</legend>
                  <div className="vendor-form-grid">
                    <label>
                      GST Available? *
                      <select value={form.gstAvailable} onChange={(event) => {
                        const val = event.target.value;
                        updateField('gstAvailable', val);
                        if (val !== 'Yes') {
                          updateField('gstNumber', '');
                        }
                      }} required>
                        <option value="">Select one</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </label>

                    {form.gstAvailable === 'Yes' && (
                      <label>
                        GST Number *
                        <input
                          type="text"
                          value={form.gstNumber || ''}
                          onChange={(event) => {
                            const raw = event.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 15);
                            let formatted = '';
                            if (raw.length > 0) {
                              formatted += raw.slice(0, 2);
                            }
                            if (raw.length > 2) {
                              formatted += ' ' + raw.slice(2, 12);
                            }
                            if (raw.length > 12) {
                              formatted += ' ' + raw.slice(12, 13);
                            }
                            if (raw.length > 13) {
                              formatted += ' ' + raw.slice(13, 14);
                            }
                            if (raw.length > 14) {
                              formatted += ' ' + raw.slice(14, 15);
                            }
                            updateField('gstNumber', formatted);
                          }}
                          placeholder="22 AAAAA0000A 1 Z 5"
                          inputMode="text"
                          pattern="^[0-9]{2}\s[A-Z]{5}[0-9]{4}[A-Z]{1}\s[A-Z0-9]{1}\sZ\s[A-Z0-9]{1}$"
                          title="Enter a 15-character GSTIN in the format: XX XXXXXXXXXX X X X (e.g. 22 AAAAA0000A 1 Z 5)"
                          required
                        />
                      </label>
                    )}
                    <label>
                      Business Experience *
                      <select value={form.experience} onChange={(event) => updateField('experience', event.target.value)} required>
                        <option value="">Select experience</option>
                        {experienceRanges.map((range) => <option key={range} value={range}>{range}</option>)}
                      </select>
                    </label>
                    <label className="vendor-form-wide">
                      Additional Notes
                      <textarea
                        value={form.notes}
                        onChange={(event) => updateField('notes', event.target.value)}
                        placeholder="Tell us about your products or specialization"
                        rows="4"
                      />
                    </label>
                  </div>
                </fieldset>

                {formError && <p className="vendor-form-error">{formError}</p>}
                {submitError && <p className="vendor-form-error">{submitError}</p>}

                <label className="vendor-agreement">
                  <input
                    type="checkbox"
                    checked={form.agreement}
                    onChange={(event) => updateField('agreement', event.target.checked)}
                    required
                    disabled={isSubmitting}
                  />
                  I confirm that the provided information is correct.
                </label>

                <button type="submit" className="vendor-submit-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting Application...' : 'Apply as Trusted Partner'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
