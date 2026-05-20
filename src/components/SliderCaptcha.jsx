import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, Check } from 'lucide-react';

/**
 * A bespoke, high-end Slide-to-Verify interactive Captcha component.
 * Tailored to match the warm luxury branding of Weave365.
 */
export default function SliderCaptcha({ onVerify, isReset }) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const startXRef = useRef(0);

  // Reset slider state
  useEffect(() => {
    if (isReset) {
      setSliderPosition(0);
      setIsVerified(false);
      if (onVerify) onVerify(false);
    }
  }, [isReset, onVerify]);

  // Event handlers for dragging
  const handleStart = (clientX) => {
    if (isVerified) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  const handleMove = (clientX) => {
    if (!isDragging || isVerified || !containerRef.current || !handleRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const handleWidth = handleRef.current.clientWidth;
    const maxDelta = containerWidth - handleWidth - 6; // Padding/border spacing

    let newPosition = clientX - startXRef.current;
    newPosition = Math.max(0, Math.min(newPosition, maxDelta));

    setSliderPosition(newPosition);

    if (newPosition >= maxDelta - 3) {
      setIsDragging(false);
      setIsVerified(true);
      setSliderPosition(maxDelta);
      if (onVerify) onVerify(true);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (!isVerified) {
      setSliderPosition(0);
      if (onVerify) onVerify(false);
    }
  };

  // Mouse Listeners
  const onMouseDown = (e) => handleStart(e.clientX);
  
  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, isVerified, sliderPosition]);

  // Touch Listeners (Mobile compatibility)
  const onTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      handleStart(e.touches[0].clientX);
    }
  };

  const onTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const onTouchEnd = () => handleEnd();

  return (
    <div className="slider-captcha-wrapper">
      {/* Informative Security Context Message */}
      <div className="slider-captcha-header">
        <ShieldCheck className="security-shield-icon" size={16} />
        <span className="security-text">
          Verification required to secure exclusive B2B wholesale pricing.
        </span>
      </div>

      <div 
        ref={containerRef}
        className={`slider-captcha-container ${isVerified ? 'verified' : ''} ${isDragging ? 'dragging' : ''}`}
      >
        {/* Progress Fill Indicator */}
        <div 
          className="slider-captcha-fill"
          style={{ width: `${sliderPosition + 22}px` }}
        />

        {/* Shimmer Hint Text */}
        <span className="slider-captcha-text">
          {isVerified ? 'Verification Complete' : 'Slide to Verify'}
        </span>

        {/* Interactive Luxury Handle */}
        <div
          ref={handleRef}
          className="slider-captcha-handle"
          style={{ transform: `translateX(${sliderPosition}px)` }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          aria-label="Verification slider handle"
        >
          {isVerified ? (
            <Check size={16} className="verified-icon" />
          ) : (
            <ArrowRight size={16} className="arrow-icon" />
          )}
        </div>
      </div>

      <style jsx>{`
        .slider-captcha-wrapper {
          width: 100%;
          margin: 1.5rem 0 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .slider-captcha-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          color: var(--muted);
          animation: fade-in 0.5s ease;
        }

        .security-shield-icon {
          color: var(--gold);
        }

        .security-text {
          font-family: var(--font-body);
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          text-align: center;
          opacity: 0.85;
        }

        .slider-captcha-container {
          position: relative;
          width: 100%;
          max-width: 440px;
          height: 52px;
          background: var(--cream);
          border: 1px solid var(--surface-accent);
          border-radius: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          user-select: none;
          box-shadow: inset 0 2px 4px rgba(36, 25, 18, 0.03);
          transition: border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
        }

        .slider-captcha-container.dragging {
          border-color: var(--gold-light);
          box-shadow: 0 0 10px rgba(183, 134, 70, 0.08);
        }

        .slider-captcha-container.verified {
          border-color: rgba(76, 175, 80, 0.4);
          background: rgba(76, 175, 80, 0.04);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.06);
        }

        .slider-captcha-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: linear-gradient(90deg, rgba(183, 134, 70, 0.02) 0%, rgba(183, 134, 70, 0.15) 100%);
          border-radius: 26px 0 0 26px;
          pointer-events: none;
        }

        .slider-captcha-container.verified .slider-captcha-fill {
          background: linear-gradient(90deg, rgba(76, 175, 80, 0.02) 0%, rgba(76, 175, 80, 0.12) 100%);
          width: 100% !important;
          border-radius: 26px;
        }

        .slider-captcha-text {
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--ink);
          pointer-events: none;
          z-index: 2;
        }

        .slider-captcha-container:not(.verified) .slider-captcha-text {
          background: linear-gradient(90deg, var(--muted) 0%, var(--gold) 50%, var(--muted) 100%);
          background-size: 200% 100%;
          animation: shimmer-text 2.5s infinite linear;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .slider-captcha-container.verified .slider-captcha-text {
          color: #2e7d32;
          letter-spacing: 2px;
          animation: success-pulse 0.3s ease-out;
        }

        .slider-captcha-handle {
          position: absolute;
          left: 4px;
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--gold-soft) 0%, var(--gold-mid) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--paper);
          cursor: grab;
          z-index: 3;
          box-shadow: 0 3px 8px rgba(36, 25, 18, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.3);
          transition: transform 0.1s ease, background 0.3s ease, box-shadow 0.3s ease;
        }

        .slider-captcha-handle:hover {
          background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 100%);
          box-shadow: 0 4px 12px rgba(36, 25, 18, 0.22);
        }

        .slider-captcha-handle:active {
          cursor: grabbing;
        }

        .slider-captcha-container.verified .slider-captcha-handle {
          background: linear-gradient(135deg, #81c784 0%, #4caf50 100%);
          color: var(--paper);
          cursor: default;
          box-shadow: 0 2px 6px rgba(76, 175, 80, 0.2);
        }

        .arrow-icon {
          animation: nudge-right 1.5s infinite ease-in-out;
        }

        .verified-icon {
          animation: scale-up 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes shimmer-text {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes nudge-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }

        @keyframes scale-up {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes success-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
