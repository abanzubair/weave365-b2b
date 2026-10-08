/**
 * @file RoleEntryCards.jsx
 * @description Entry selection screen: "Which best describes you?" with 3 options:
 * Business, Customer, and Supplier.
 */
import { Store, ShoppingBag, Sparkles, ArrowRight } from '../icons.jsx';
import { USER_TYPES } from './signupConstants.js';

export function RoleEntryCards({
  selectedType,
  onSelectType,
  onContinue,
  onSwitchToLogin,
}) {
  const getIcon = (id) => {
    switch (id) {
      case 'business':
        return <Store size={22} />;
      case 'customer':
        return <ShoppingBag size={22} />;
      case 'supplier':
        return <Sparkles size={22} />;
      default:
        return <Store size={22} />;
    }
  };

  return (
    <div className="signup-entry-view">
      <div className="signup-form-header">
        <h2 className="signup-form-title">Which best describes you?</h2>
        <p className="signup-form-subtitle">
          Select how you want to use Weave 365 so we can provide the right experience.
        </p>
      </div>

      <div className="signup-entry-cards-grid" role="radiogroup" aria-label="Which best describes you?">
        {USER_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelectType(type.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectType(type.id);
                }
              }}
              className={`signup-entry-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="signup-entry-card-icon-wrap">
                {getIcon(type.id)}
              </div>
              <div className="signup-entry-card-content">
                <div className="signup-entry-card-top">
                  <h3 className="signup-entry-card-title">{type.title}</h3>
                </div>
                <p className="signup-entry-card-desc">{type.description}</p>
              </div>
              <div className="signup-entry-radio-circle" aria-hidden="true">
                <span className="signup-entry-radio-dot" />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="signup-submit-btn signup-entry-continue-btn"
        disabled={!selectedType}
        onClick={onContinue}
      >
        <span>Continue</span>
        <ArrowRight size={16} />
      </button>

      <div className="signup-switch-link" style={{ marginTop: '20px' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
