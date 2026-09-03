import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from './icons.jsx';
import '../styles/onboardingWalkthrough.css';

export function ResellerOnboardingWalkthrough({ user, buyerProfile, priceAccess }) {
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [step, setStep] = useState(1);
  const [rect, setRect] = useState(null);
  const [cardStyle, setCardStyle] = useState({});
  const observerRef = useRef(null);

  // Check eligibility on mount/login
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user is B2B
    const isB2B =
      buyerProfile?.buyer_type === 'reseller' ||
      buyerProfile?.buyer_type === 'wholesale' ||
      priceAccess?.priceGroup === 'reseller' ||
      priceAccess?.priceGroup === 'wholesale';

    const justRegistered = localStorage.getItem('just_registered_b2b') === 'true';
    const completed = localStorage.getItem('share_walkthrough_completed') === 'true';

    // If eligible and has not completed yet, set up scroll detection
    if (isB2B && justRegistered && !completed) {
      const detectRail = () => {
        const rails = document.querySelectorAll('.product-row, .scrollable-row, .deal-card-grid');
        if (rails.length > 0) {
          observerRef.current = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  // Trigger the walkthrough!
                  setShowWalkthrough(true);
                  // Disconnect to trigger only once
                  if (observerRef.current) {
                    observerRef.current.disconnect();
                  }
                }
              });
            },
            { threshold: 0.1 }
          );
          rails.forEach((rail) => observerRef.current.observe(rail));
        }
      };

      // Delay slightly to ensure page components are fully mounted
      const timer = setTimeout(detectRail, 1000);
      return () => {
        clearTimeout(timer);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }
  }, [user, buyerProfile, priceAccess]);

  // Handle programmatic DOM interactions on step transitions
  useEffect(() => {
    if (!showWalkthrough) return;

    const performTransition = async () => {
      if (step === 1) {
        // Ensure options sheet is closed
        const optionsOverlay = document.querySelector('.card-options-overlay');
        if (optionsOverlay) {
          optionsOverlay.click();
        }
        // Ensure WhatsApp modal is closed
        const whatsappClose = document.querySelector('.reseller-share-modal .modal-close');
        if (whatsappClose) {
          whatsappClose.click();
        }
      } else if (step === 2) {
        // Wait a tiny bit for any manual clicks to finish processing
        await new Promise((r) => setTimeout(r, 50));

        // Ensure options sheet is open
        const optionsSheet = document.querySelector('.card-options-overlay');
        if (!optionsSheet) {
          const optionsBtn = document.querySelector('.options-trigger-btn');
          if (optionsBtn) {
            optionsBtn.click();
            await new Promise((r) => setTimeout(r, 150));
          }
        }
        // Ensure WhatsApp modal is closed
        const whatsappClose = document.querySelector('.reseller-share-modal .modal-close');
        if (whatsappClose) {
          whatsappClose.click();
        }
      } else if (step === 3) {
        // Wait a tiny bit for any manual clicks to finish processing
        await new Promise((r) => setTimeout(r, 50));

        // Ensure WhatsApp modal is open
        const whatsappModal = document.querySelector('.reseller-share-modal');
        if (!whatsappModal) {
          // Open options sheet first if not open
          const optionsSheet = document.querySelector('.card-options-overlay');
          if (!optionsSheet) {
            const optionsBtn = document.querySelector('.options-trigger-btn');
            if (optionsBtn) {
              optionsBtn.click();
              await new Promise((r) => setTimeout(r, 150));
            }
          }
          const shareBtn = document.querySelector('.sheet-item.reseller-primary');
          if (shareBtn) {
            shareBtn.click();
            await new Promise((r) => setTimeout(r, 150));
          }
        }
      }

      // Re-trigger spotlight positioning recalculations
      window.dispatchEvent(new Event('resize'));
    };

    void performTransition();
  }, [step, showWalkthrough]);

  // Scroll target into center and setup rect tracking
  useEffect(() => {
    if (!showWalkthrough) return;

    // Only scroll the first product card into view on step 1
    if (step === 1) {
      const targetCard = document.querySelector('.product-row .product-card, .deal-card');
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    const updateRect = () => {
      let el = null;
      if (step === 1) {
        const targetCard = document.querySelector('.product-row .product-card, .deal-card');
        el = targetCard?.querySelector('.options-trigger-btn');
      } else if (step === 2) {
        el = document.querySelector('.sheet-item.reseller-primary');
      } else if (step === 3) {
        el = document.querySelector('.reseller-share-modal');
      }

      if (el) {
        const bounding = el.getBoundingClientRect();
        setRect({
          top: bounding.top - 4,
          left: bounding.left - 4,
          width: bounding.width + 8,
          height: bounding.height + 8,
        });
      }
    };

    // Initial update
    setTimeout(updateRect, 300);

    // Listen to resize and scroll
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [showWalkthrough, step]);

  // Listen to user clicks on the focused target buttons to advance steps automatically
  useEffect(() => {
    if (!showWalkthrough) return;

    const handleDocumentClick = (e) => {
      const target = e.target;
      if (!target) return;

      if (step === 1) {
        const optionsBtn = target.closest('.options-trigger-btn');
        if (optionsBtn) {
          setStep(2);
        }
      } else if (step === 2) {
        const shareBtn = target.closest('.sheet-item.reseller-primary');
        if (shareBtn) {
          setStep(3);
        }
      }
    };

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, [step, showWalkthrough]);

  // Position the explanation card relative to the spotlight on desktop
  useEffect(() => {
    if (!rect) return;

    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      setCardStyle({}); // Mobile uses standard bottom sheet layout in CSS
      return;
    }

    const cardWidth = 380;
    const cardHeight = 360;
    let top = rect.top + rect.height / 2 - cardHeight / 2;
    let left = rect.left + rect.width + 24;

    // Boundary checks
    if (left + cardWidth > window.innerWidth) {
      // Place on left side instead
      left = rect.left - cardWidth - 24;
    }
    
    // Vertical boundary checks
    if (top < 80) top = 80;
    if (top + cardHeight > window.innerHeight) {
      top = window.innerHeight - cardHeight - 24;
    }

    setCardStyle({
      top: `${top}px`,
      left: `${left}px`,
    });
  }, [rect]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    // Close open sheets and modals
    const whatsappClose = document.querySelector('.reseller-share-modal .modal-close');
    if (whatsappClose) {
      whatsappClose.click();
    }
    const optionsOverlay = document.querySelector('.card-options-overlay');
    if (optionsOverlay) {
      optionsOverlay.click();
    }
    localStorage.removeItem('just_registered_b2b');
    localStorage.setItem('share_walkthrough_completed', 'true');
    setShowWalkthrough(false);
  };

  if (!showWalkthrough || !rect) return null;

  const illustrations = {
    1: (
      <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Step 1: Discover options */}
        <rect x="20" y="10" width="200" height="100" rx="10" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2" />
        <rect x="35" y="25" width="80" height="70" rx="6" fill="#f0e9df" />
        <rect x="130" y="30" width="70" height="10" rx="3" fill="#1a1a1a" />
        <rect x="130" y="48" width="50" height="6" rx="2" fill="#78716c" />
        
        {/* Simulated Options Button */}
        <rect x="130" y="68" width="70" height="24" rx="4" fill="#b78646" />
        <circle cx="142" cy="80" r="2" fill="#fff" />
        <circle cx="148" cy="80" r="2" fill="#fff" />
        <circle cx="154" cy="80" r="2" fill="#fff" />
        <text x="165" y="84" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="sans-serif">OPTIONS</text>

        {/* Floating click cursor */}
        <g className="illustration-bounce">
          <circle cx="160" cy="95" r="12" fill="rgba(183, 134, 70, 0.15)" className="illustration-pulse" />
          <path d="M160 95 L170 108 L165 110 L160 95 Z" fill="#b78646" stroke="#fff" strokeWidth="1.5" />
        </g>
      </svg>
    ),
    2: (
      <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Step 2: Set markup */}
        <rect x="10" y="10" width="220" height="100" rx="10" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2" />
        
        {/* Price Tag Arrow */}
        <path d="M25 35 L105 35 L115 55 L105 75 L25 75 Z" fill="#f0e9df" stroke="#b78646" strokeWidth="1.5" />
        <text x="65" y="52" textAnchor="middle" fill="#78716c" fontSize="9" fontFamily="sans-serif">WHOLESALE</text>
        <text x="65" y="68" textAnchor="middle" fill="#1a1a1a" fontSize="13" fontWeight="bold" fontFamily="sans-serif">₹2,500</text>
        
        {/* Plus Arrow */}
        <text x="130" y="60" fill="#b78646" fontSize="22" fontWeight="bold" fontFamily="sans-serif">+</text>
        
        {/* Markup calculation balloon */}
        <rect x="160" y="32" width="55" height="40" rx="8" fill="#b78646" />
        <text x="187.5" y="50" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="sans-serif">Markup</text>
        <text x="187.5" y="64" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="bold" fontFamily="sans-serif">+ 20%</text>
        
        {/* Dotted link line */}
        <path d="M110 55 Q135 25 160 45" stroke="#b78646" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
      </svg>
    ),
    3: (
      <svg viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Step 3: Share catalog */}
        <rect x="10" y="10" width="220" height="100" rx="10" fill="#fafafa" stroke="#e5e5e5" strokeWidth="2" />
        
        {/* Smartphone mockup */}
        <rect x="30" y="20" width="50" height="85" rx="8" fill="#1a1a1a" />
        <rect x="33" y="25" width="44" height="70" rx="4" fill="#fff" />
        <rect x="38" y="32" width="34" height="24" rx="2" fill="#e5e5e5" />
        <rect x="38" y="62" width="34" height="4" rx="1" fill="#b78646" />
        <rect x="38" y="70" width="26" height="4" rx="1" fill="#78716c" />

        {/* Connecting network dashed lines */}
        <path d="M80 44 L105 44" stroke="#b78646" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
        <path d="M80 82 L105 82" stroke="#b78646" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
        
        {/* WhatsApp Pill Button */}
        <rect x="105" y="30" width="110" height="28" rx="14" fill="#25D366" />
        <path d="M116 44 L120 48 L127 40" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <text x="165" y="47" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">WhatsApp</text>

        {/* Storefront Pill Button */}
        <rect x="105" y="68" width="110" height="28" rx="14" fill="#b78646" />
        <path d="M115 82 A2.5 2.5 0 0 1 120 82 M118 82 A2.5 2.5 0 0 1 123 82" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <text x="165" y="85" textAnchor="middle" fill="#fff" fontSize="9.5" fontWeight="bold" fontFamily="sans-serif">My Website</text>
      </svg>
    ),
  };

  const stepsData = [
    {
      title: 'Discover Option Tools',
      desc: 'Look at the product row below. Tap the "OPTIONS" button on any saree to reveal your custom reseller and wholesaler commands.',
    },
    {
      title: 'Open Sharing Options',
      desc: 'Tap on "Share with Customer" inside the options menu. This is your dedicated reseller tool for unbranded catalogue sharing.',
    },
    {
      title: 'Set Your Markup Price',
      desc: 'Now, customize your profit margin in the markup panel! You can choose percentage, flat, or exact pricing. Our original wholesale cost is completely hidden from your client.',
    },
  ];

  const currentStepData = stepsData[step - 1];

  const walkthroughDOM = (
    <>
      <div className="walkthrough-backdrop" />
      <div className="walkthrough-spotlight" style={rect} />
      
      <div className="walkthrough-card-container" style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div className="walkthrough-card-header">
          <h4>
            <span className="sparkle">✦</span> {currentStepData.title}
          </h4>
          <button type="button" className="walkthrough-close-btn" onClick={handleComplete} aria-label="Dismiss tutorial">
            <X size={16} />
          </button>
        </div>

        <div className="walkthrough-step-content">
          <div className="walkthrough-illustration">
            {illustrations[step]}
          </div>
          <p className="walkthrough-step-desc">
            {currentStepData.desc}
          </p>
        </div>

        <div className="walkthrough-card-footer">
          <button type="button" className="walkthrough-skip-btn" onClick={handleComplete}>
            Skip Tutorial
          </button>
          
          <div className="walkthrough-dots">
            {[1, 2, 3].map((s) => (
              <span key={s} className={`walkthrough-dot ${s === step ? 'active' : ''}`} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 1 && (
              <button 
                type="button" 
                className="walkthrough-skip-btn" 
                style={{ padding: '8px 12px' }} 
                onClick={handleBack}
              >
                Back
              </button>
            )}
            <button type="button" className="walkthrough-next-btn" onClick={handleNext}>
              {step === 3 ? 'Got it! ✦' : (
                <>
                  Next <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(walkthroughDOM, document.body)
    : null;
}
