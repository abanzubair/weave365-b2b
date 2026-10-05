/**
 * @file SupplierOnboardingForm.jsx
 * @description Supplier / Vendor Onboarding Form for Weave 365 (Sections 5.1 - 5.4).
 */
import { ArrowLeft, ArrowRight, AlertCircle, Check } from '../icons.jsx';
import {
  SUPPLIER_EXPERIENCE_OPTIONS,
  SUPPLIER_PRICE_RANGES,
  SUPPLIER_BUSINESS_TYPES,
  SUPPLIER_PRODUCTS,
  SUPPLIER_WEAVING_TYPES,
  SUPPLIER_CATALOGUE_SOURCES,
} from './signupConstants.js';

export function SupplierOnboardingForm({
  formData,
  onChange,
  onBack,
  onContinue,
  validationError,
  errorField,
}) {
  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  const handleCheckboxToggle = (field, item) => {
    const current = Array.isArray(formData[field]) ? [...formData[field]] : [];
    const exists = current.includes(item);
    let next;
    if (exists) {
      next = current.filter((x) => x !== item);
    } else {
      next = [...current, item];
    }
    onChange(field, next);
  };

  return (
    <div className="signup-qual-form-view">
      {/* Header */}
      <div className="signup-qual-header">
        <button
          type="button"
          onClick={onBack}
          className="signup-back-btn"
          aria-label="Back to account type selection"
        >
          <ArrowLeft size={16} /> Choose different account type
        </button>
        <span className="signup-qual-step-pill">Step 1 of 2: Supplier Onboarding</span>
        <h2 className="signup-form-title">Become a Weave 365 Supplier</h2>
        <p className="signup-form-subtitle">
          Tell us about your business and the products you can supply to Weave 365. Our team will review your information and contact you if there is a suitable opportunity to work together.
        </p>
      </div>

      <div className="signup-qual-sections">
        {/* =================================================================
           5.1 Business Information
           ================================================================= */}
        <div className="signup-supplier-section">
          <h3 className="signup-supplier-section-title">5.1 Business Information</h3>

          <div className="signup-form-grid">
            {/* Contact Person Name */}
            <div className={`signup-field ${errorField === 'contact_person' ? 'has-error' : ''}`}>
              <label className="signup-label">
                <span>Contact Person Name *</span>
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Full name of contact person"
                className="signup-input"
                required
              />
            </div>

            {/* Business Name */}
            <div className={`signup-field ${errorField === 'business_name' ? 'has-error' : ''}`}>
              <label className="signup-label">
                <span>Business Name *</span>
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Loom / Firm / Business name"
                className="signup-input"
                required
              />
            </div>

            {/* Location / City */}
            <div className={`signup-field ${errorField === 'location_city' ? 'has-error' : ''}`}>
              <label className="signup-label">
                <span>Location / City *</span>
              </label>
              <input
                type="text"
                value={formData.location_city}
                onChange={(e) => handleInputChange('location_city', e.target.value)}
                placeholder="e.g. Varanasi"
                className="signup-input"
                required
              />
            </div>

            {/* Business Email */}
            <div className={`signup-field ${errorField === 'business_email' ? 'has-error' : ''}`}>
              <label className="signup-label">
                <span>Business Email *</span>
              </label>
              <input
                type="email"
                value={formData.business_email}
                onChange={(e) => handleInputChange('business_email', e.target.value)}
                placeholder="partner@example.com"
                className="signup-input"
                required
              />
            </div>

            {/* WhatsApp / Phone Number */}
            <div className={`signup-field ${errorField === 'phone' ? 'has-error' : ''}`}>
              <label className="signup-label">
                <span>WhatsApp / Phone Number *</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="signup-input"
                required
              />
            </div>

            {/* Instagram Account */}
            <div className={`signup-field ${errorField === 'instagram' ? 'has-error' : ''}`}>
              <label className="signup-label">
                <span>Instagram Account *</span>
              </label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="https://instagram.com/yourhandle or @yourhandle"
                className="signup-input"
                required
              />
            </div>

            {/* eCommerce Website (Optional) */}
            <div className="signup-field signup-field-full">
              <label className="signup-label">
                <span>eCommerce Website</span>
                <span className="signup-label-subtext">(Optional)</span>
              </label>
              <input
                type="url"
                value={formData.ecommerce_website}
                onChange={(e) => handleInputChange('ecommerce_website', e.target.value)}
                placeholder="https://yourbrand.com"
                className="signup-input"
              />
            </div>
          </div>

          {/* Do you have GST registration? */}
          <div className={`signup-qual-question-card ${errorField === 'has_gst' || errorField === 'gstin' ? 'has-error' : ''}`} style={{ marginTop: '14px' }}>
            <label className="signup-qual-qlabel">
              <span>Do you have GST registration? *</span>
            </label>
            <div className="signup-qual-radio-inline" role="radiogroup" aria-label="Do you have GST registration?">
              {['Yes', 'No'].map((choice) => {
                const isSelected = formData.has_gst === choice;
                return (
                  <label key={choice} className={`signup-qual-radio-option inline ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="has_gst"
                      value={choice}
                      checked={isSelected}
                      onChange={() => handleInputChange('has_gst', choice)}
                      className="signup-qual-radio-input"
                    />
                    <span className="signup-qual-radio-indicator" aria-hidden="true">
                      <span className="signup-qual-radio-dot" />
                    </span>
                    <span className="signup-qual-option-text">{choice}</span>
                  </label>
                );
              })}
            </div>

            {formData.has_gst === 'Yes' && (
              <div className="signup-qual-conditional" style={{ marginTop: '12px' }}>
                <label className="signup-label">
                  <span>GSTIN *</span>
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 09AAAAA0000A1Z5"
                  maxLength={15}
                  className="signup-input"
                  required
                />
              </div>
            )}
          </div>

          {/* How long have you been in business? */}
          <div className={`signup-qual-question-card ${errorField === 'business_experience' ? 'has-error' : ''}`} style={{ marginTop: '14px' }}>
            <label className="signup-qual-qlabel">
              <span>How long have you been in business? *</span>
            </label>
            <div className="signup-qual-radio-grid signup-qual-radio-grid-stack" role="radiogroup" aria-label="Supplier Business Experience">
              {SUPPLIER_EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = formData.business_experience === opt;
                return (
                  <label key={opt} className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="supplier_experience"
                      value={opt}
                      checked={isSelected}
                      onChange={() => handleInputChange('business_experience', opt)}
                      className="signup-qual-radio-input"
                    />
                    <span className="signup-qual-radio-indicator" aria-hidden="true">
                      <span className="signup-qual-radio-dot" />
                    </span>
                    <span className="signup-qual-option-text">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* What is your approximate wholesale price range? */}
          <div className={`signup-qual-question-card ${errorField === 'wholesale_price_range' ? 'has-error' : ''}`} style={{ marginTop: '14px' }}>
            <label className="signup-qual-qlabel">
              <span>What is your approximate wholesale price range? *</span>
            </label>
            <div className="signup-qual-radio-grid signup-qual-radio-grid-2col" role="radiogroup" aria-label="Supplier Wholesale Price Range">
              {SUPPLIER_PRICE_RANGES.map((rng) => {
                const isSelected = formData.wholesale_price_range === rng;
                return (
                  <label key={rng} className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="wholesale_price_range"
                      value={rng}
                      checked={isSelected}
                      onChange={() => handleInputChange('wholesale_price_range', rng)}
                      className="signup-qual-radio-input"
                    />
                    <span className="signup-qual-radio-indicator" aria-hidden="true">
                      <span className="signup-qual-radio-dot" />
                    </span>
                    <span className="signup-qual-option-text">{rng}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* =================================================================
           5.2 Your Business
           ================================================================= */}
        <div className="signup-supplier-section">
          <h3 className="signup-supplier-section-title">5.2 Your Business</h3>

          {/* What best describes your business? */}
          <div className={`signup-qual-question-card ${errorField === 'business_type' ? 'has-error' : ''}`}>
            <label className="signup-qual-qlabel">
              <span>What best describes your business? *</span>
            </label>
            <div className="signup-qual-radio-grid signup-qual-radio-grid-2col" role="radiogroup" aria-label="Supplier Business Role">
              {SUPPLIER_BUSINESS_TYPES.map((bType) => {
                const isSelected = formData.business_type === bType;
                return (
                  <label key={bType} className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="supplier_business_type"
                      value={bType}
                      checked={isSelected}
                      onChange={() => handleInputChange('business_type', bType)}
                      className="signup-qual-radio-input"
                    />
                    <span className="signup-qual-radio-indicator" aria-hidden="true">
                      <span className="signup-qual-radio-dot" />
                    </span>
                    <span className="signup-qual-option-text">{bType}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* What products do you supply? */}
          <div className={`signup-qual-question-card ${errorField === 'supplied_products' ? 'has-error' : ''}`} style={{ marginTop: '14px' }}>
            <label className="signup-qual-qlabel">
              <span>What products do you supply? *</span>
            </label>
            <p className="signup-qual-qdesc">Select all that apply (at least one).</p>
            <div className="signup-qual-checkbox-grid">
              {SUPPLIER_PRODUCTS.map((prod) => {
                const isChecked = Array.isArray(formData.supplied_products) && formData.supplied_products.includes(prod);
                return (
                  <label key={prod} className={`signup-qual-checkbox-option ${isChecked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle('supplied_products', prod)}
                      className="signup-qual-checkbox-input"
                    />
                    <span className="signup-qual-checkbox-box" aria-hidden="true">
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="signup-qual-option-text">{prod}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Which types of weaving do you specialise in? */}
          <div className={`signup-qual-question-card ${errorField === 'weaving_specialisation' ? 'has-error' : ''}`} style={{ marginTop: '14px' }}>
            <label className="signup-qual-qlabel">
              <span>Which types of weaving do you specialise in? *</span>
            </label>
            <p className="signup-qual-qdesc">Select all that apply.</p>
            <div className="signup-qual-checkbox-grid">
              {SUPPLIER_WEAVING_TYPES.map((wType) => {
                const isChecked = Array.isArray(formData.weaving_specialisation) && formData.weaving_specialisation.includes(wType);
                return (
                  <label key={wType} className={`signup-qual-checkbox-option ${isChecked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxToggle('weaving_specialisation', wType)}
                      className="signup-qual-checkbox-input"
                    />
                    <span className="signup-qual-checkbox-box" aria-hidden="true">
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="signup-qual-option-text">{wType}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Where do you manufacture / source your products? */}
          <div className={`signup-qual-question-card ${errorField === 'manufacturing_location' || errorField === 'other_city_name' ? 'has-error' : ''}`} style={{ marginTop: '14px' }}>
            <label className="signup-qual-qlabel">
              <span>Where do you manufacture / source your products? *</span>
            </label>
            <div className="signup-qual-radio-inline" role="radiogroup" aria-label="Manufacturing location">
              {['Varanasi', 'Other City'].map((loc) => {
                const isSelected = formData.manufacturing_location === loc;
                return (
                  <label key={loc} className={`signup-qual-radio-option inline ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="manufacturing_location"
                      value={loc}
                      checked={isSelected}
                      onChange={() => handleInputChange('manufacturing_location', loc)}
                      className="signup-qual-radio-input"
                    />
                    <span className="signup-qual-radio-indicator" aria-hidden="true">
                      <span className="signup-qual-radio-dot" />
                    </span>
                    <span className="signup-qual-option-text">{loc}</span>
                  </label>
                );
              })}
            </div>

            {formData.manufacturing_location === 'Other City' && (
              <div className="signup-qual-conditional" style={{ marginTop: '12px' }}>
                <label className="signup-label">
                  <span>Please specify the city *</span>
                </label>
                <input
                  type="text"
                  value={formData.other_city_name}
                  onChange={(e) => handleInputChange('other_city_name', e.target.value)}
                  placeholder="e.g. Surat, Chanderi, Kanchipuram"
                  className="signup-input"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* =================================================================
           5.3 Supply Capability
           ================================================================= */}
        <div className="signup-supplier-section">
          <h3 className="signup-supplier-section-title">5.3 Supply Capability</h3>

          <div className="signup-qual-grid-2col">
            {/* Single-piece supply */}
            <div className={`signup-qual-question-card ${errorField === 'single_piece_supply' ? 'has-error' : ''}`}>
              <label className="signup-qual-qlabel">
                <span>Do you offer single-piece supply? *</span>
              </label>
              <div className="signup-qual-radio-inline" role="radiogroup" aria-label="Single-piece supply">
                {['Yes', 'No'].map((ans) => {
                  const isSelected = formData.single_piece_supply === ans;
                  return (
                    <label key={ans} className={`signup-qual-radio-option inline ${isSelected ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="single_piece_supply"
                        value={ans}
                        checked={isSelected}
                        onChange={() => handleInputChange('single_piece_supply', ans)}
                        className="signup-qual-radio-input"
                      />
                      <span className="signup-qual-radio-indicator" aria-hidden="true">
                        <span className="signup-qual-radio-dot" />
                      </span>
                      <span className="signup-qual-option-text">{ans}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Repeat supply */}
            <div className={`signup-qual-question-card ${errorField === 'repeat_supply' ? 'has-error' : ''}`}>
              <label className="signup-qual-qlabel">
                <span>Can you provide consistent repeat supply? *</span>
              </label>
              <div className="signup-qual-radio-inline" role="radiogroup" aria-label="Consistent repeat supply">
                {['Yes', 'No'].map((ans) => {
                  const isSelected = formData.repeat_supply === ans;
                  return (
                    <label key={ans} className={`signup-qual-radio-option inline ${isSelected ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="repeat_supply"
                        value={ans}
                        checked={isSelected}
                        onChange={() => handleInputChange('repeat_supply', ans)}
                        className="signup-qual-radio-input"
                      />
                      <span className="signup-qual-radio-indicator" aria-hidden="true">
                        <span className="signup-qual-radio-dot" />
                      </span>
                      <span className="signup-qual-option-text">{ans}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
           5.4 Product & Catalogue
           ================================================================= */}
        <div className="signup-supplier-section">
          <h3 className="signup-supplier-section-title">5.4 Product & Catalogue</h3>

          {/* Do you have a product catalogue for your website? */}
          <div className={`signup-qual-question-card ${errorField === 'has_catalogue' ? 'has-error' : ''}`}>
            <label className="signup-qual-qlabel">
              <span>Do you have a product catalogue for your website? *</span>
            </label>
            <div className="signup-qual-radio-inline" role="radiogroup" aria-label="Product catalogue for website">
              {['Yes', 'No'].map((ans) => {
                const isSelected = formData.has_catalogue === ans;
                return (
                  <label key={ans} className={`signup-qual-radio-option inline ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="has_catalogue"
                      value={ans}
                      checked={isSelected}
                      onChange={() => handleInputChange('has_catalogue', ans)}
                      className="signup-qual-radio-input"
                    />
                    <span className="signup-qual-radio-indicator" aria-hidden="true">
                      <span className="signup-qual-radio-dot" />
                    </span>
                    <span className="signup-qual-option-text">{ans}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Do you create your own catalogue or use catalogues available in the market? */}
          <div className={`signup-qual-question-card ${errorField === 'catalogue_source' ? 'has-error' : ''}`} style={{ marginTop: '14px' }}>
            <label className="signup-qual-qlabel">
              <span>Do you create your own catalogue or use catalogues available in the market? *</span>
            </label>
            <div className="signup-qual-radio-grid signup-qual-radio-grid-stack" role="radiogroup" aria-label="Catalogue source">
              {SUPPLIER_CATALOGUE_SOURCES.map((src) => {
                const isSelected = formData.catalogue_source === src;
                return (
                  <label key={src} className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="catalogue_source"
                      value={src}
                      checked={isSelected}
                      onChange={() => handleInputChange('catalogue_source', src)}
                      className="signup-qual-radio-input"
                    />
                    <span className="signup-qual-radio-indicator" aria-hidden="true">
                      <span className="signup-qual-radio-dot" />
                    </span>
                    <span className="signup-qual-option-text">{src}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="signup-alert-error" style={{ marginTop: '16px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="signup-submit-btn"
        style={{ marginTop: '20px' }}
      >
        <span>Continue to Account Creation</span>
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
