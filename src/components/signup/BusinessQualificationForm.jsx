/**
 * @file BusinessQualificationForm.jsx
 * @description 5-Question Business Qualification Form for Weave 365.
 */
import { ArrowLeft, ArrowRight, AlertCircle, Check } from '../icons.jsx';
import {
  BUSINESS_TYPES,
  BUSINESS_EXPERIENCE_OPTIONS,
  BUSINESS_BUDGET_OPTIONS,
  BUSINESS_SALES_CHANNELS,
  BUSINESS_PURCHASE_INTENT_OPTIONS,
} from './signupConstants.js';

export function BusinessQualificationForm({
  formData,
  onChange,
  onBack,
  onContinue,
  validationError,
  errorField,
}) {
  const handleRadioChange = (field, value) => {
    onChange(field, value);
  };

  const handleCheckboxToggle = (channelId) => {
    const current = Array.isArray(formData.sales_channels) ? [...formData.sales_channels] : [];
    const exists = current.includes(channelId);
    let next;
    if (exists) {
      next = current.filter((id) => id !== channelId);
    } else {
      next = [...current, channelId];
    }
    onChange('sales_channels', next);
  };

  return (
    <div className="signup-qual-form-view">
      {/* Navigation & Header */}
      <div className="signup-qual-header">
        <button
          type="button"
          onClick={onBack}
          className="signup-back-btn"
          aria-label="Back to account type selection"
        >
          <ArrowLeft size={16} /> Choose different account type
        </button>
        <span className="signup-qual-step-pill">Step 1 of 2: Business Qualification</span>
        <h2 className="signup-form-title">Before You Sign Up</h2>
        <p className="signup-form-subtitle">
          Help us understand your business so we can show you the right products, pricing, buying options and support.
        </p>
      </div>

      <div className="signup-qual-questions-wrap">
        {/* Question 1 — Business Type */}
        <div className={`signup-qual-question-card ${errorField === 'business_type' ? 'has-error' : ''}`}>
          <label className="signup-qual-qlabel">
            <span>What best describes your business?</span>
            <span className="signup-qual-required">*</span>
          </label>
          <p className="signup-qual-qdesc">Select the option that best fits your business model.</p>
          <div className="signup-qual-radio-grid signup-qual-radio-grid-2col" role="radiogroup" aria-label="Business Type">
            {BUSINESS_TYPES.map((item) => {
              const isSelected = formData.business_type === item.id;
              return (
                <label
                  key={item.id}
                  className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="business_type"
                    value={item.id}
                    checked={isSelected}
                    onChange={() => handleRadioChange('business_type', item.id)}
                    className="signup-qual-radio-input"
                  />
                  <span className="signup-qual-radio-indicator" aria-hidden="true">
                    <span className="signup-qual-radio-dot" />
                  </span>
                  <span className="signup-qual-option-text">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Question 2 — Business Experience */}
        <div className={`signup-qual-question-card ${errorField === 'business_experience' ? 'has-error' : ''}`}>
          <label className="signup-qual-qlabel">
            <span>How long have you been in business?</span>
            <span className="signup-qual-required">*</span>
          </label>
          <div className="signup-qual-radio-grid signup-qual-radio-grid-stack" role="radiogroup" aria-label="Business Experience">
            {BUSINESS_EXPERIENCE_OPTIONS.map((item) => {
              const isSelected = formData.business_experience === item.id;
              return (
                <label
                  key={item.id}
                  className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="business_experience"
                    value={item.id}
                    checked={isSelected}
                    onChange={() => handleRadioChange('business_experience', item.id)}
                    className="signup-qual-radio-input"
                  />
                  <span className="signup-qual-radio-indicator" aria-hidden="true">
                    <span className="signup-qual-radio-dot" />
                  </span>
                  <span className="signup-qual-option-text">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Question 3 — Monthly Sourcing Budget */}
        <div className={`signup-qual-question-card ${errorField === 'monthly_budget' ? 'has-error' : ''}`}>
          <label className="signup-qual-qlabel">
            <span>What is your approximate monthly sourcing / purchase budget?</span>
            <span className="signup-qual-required">*</span>
          </label>
          <div className="signup-qual-radio-grid signup-qual-radio-grid-stack" role="radiogroup" aria-label="Monthly Sourcing Budget">
            {BUSINESS_BUDGET_OPTIONS.map((item) => {
              const isSelected = formData.monthly_budget === item.id;
              return (
                <label
                  key={item.id}
                  className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="monthly_budget"
                    value={item.id}
                    checked={isSelected}
                    onChange={() => handleRadioChange('monthly_budget', item.id)}
                    className="signup-qual-radio-input"
                  />
                  <span className="signup-qual-radio-indicator" aria-hidden="true">
                    <span className="signup-qual-radio-dot" />
                  </span>
                  <span className="signup-qual-option-text">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Question 4 — Sales Channels */}
        <div className={`signup-qual-question-card ${errorField === 'sales_channels' ? 'has-error' : ''}`}>
          <label className="signup-qual-qlabel">
            <span>Where do you currently sell?</span>
            <span className="signup-qual-required">*</span>
          </label>
          <p className="signup-qual-qdesc">Select all that apply (at least one).</p>
          <div className="signup-qual-checkbox-grid">
            {BUSINESS_SALES_CHANNELS.map((item) => {
              const isChecked = Array.isArray(formData.sales_channels) && formData.sales_channels.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`signup-qual-checkbox-option ${isChecked ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxToggle(item.id)}
                    className="signup-qual-checkbox-input"
                  />
                  <span className="signup-qual-checkbox-box" aria-hidden="true">
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="signup-qual-option-text">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Question 5 — Purchase Intent */}
        <div className={`signup-qual-question-card ${errorField === 'purchase_intent' ? 'has-error' : ''}`}>
          <label className="signup-qual-qlabel">
            <span>When do you expect to place your first order?</span>
            <span className="signup-qual-required">*</span>
          </label>
          <div className="signup-qual-radio-grid signup-qual-radio-grid-stack" role="radiogroup" aria-label="Purchase Intent">
            {BUSINESS_PURCHASE_INTENT_OPTIONS.map((item) => {
              const isSelected = formData.purchase_intent === item.id;
              return (
                <label
                  key={item.id}
                  className={`signup-qual-radio-option ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="purchase_intent"
                    value={item.id}
                    checked={isSelected}
                    onChange={() => handleRadioChange('purchase_intent', item.id)}
                    className="signup-qual-radio-input"
                  />
                  <span className="signup-qual-radio-indicator" aria-hidden="true">
                    <span className="signup-qual-radio-dot" />
                  </span>
                  <span className="signup-qual-option-text">{item.label}</span>
                </label>
              );
            })}
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
