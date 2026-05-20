import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check } from 'lucide-react';

/**
 * A luxury Slide-to-Verify interactive Captcha component.
 * Self-contained, premium aesthetic, fully responsive, and mobile-friendly.
 */
export default function SliderCaptcha({ onVerify, isReset }) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const startXRef = useRef(0);

  // Reset slider if requested from parent
  useEffect(() => {
    if (isReset) {
      setSliderPosition(0);
      setIsVerified(false);
      if (onVerify) onVerify(false);
    }
  }, [isReset, onVerify]);

  // Touch and Mouse handlers
  const handleStart = (clientX) => {
    if (isVerified) return;
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
  };

  const handleMove = (clientX) => {
    if (!isDragging || isVerified || !containerRef.current || !handleRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const handleWidth = handleRef.current.clientWidth;
    const maxDelta = containerWidth - handleWidth - 6; // Accounts for border/padding

    let newPosition = clientX - startXRef.current;
    newPosition = Math.max(0, Math.min(newPosition, maxDelta));

    setSliderPosition(newPosition);

    // If slider reaches the end (within 4 pixels), verify successfully
    if (newPosition >= maxDelta - 4) {
      setIsDragging(false);
      setIsVerified(true);
      setSliderPosition(maxDelta);
      if (onVerify) onVerify(true);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Reset back to start if not fully verified
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

  // Touch Listeners (Mobile)
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
      <div 
        ref={containerRef}
        className={`slider-captcha-container ${isVerified ? 'verified' : ''} ${isDragging ? 'dragging' : ''}`}
      >
        {/* Fill background color as handle is dragged */}
        <div 
          className="slider-captcha-fill"
          style={{ width: `${sliderPosition + 24}px` }}
        />

        {/* Dynamic text hint with shimmering glow */}
        <span className="slider-captcha-text">
          {isVerified ? 'Verification Successful' : 'Slide to verify you are human'}
        </span>

        {/* Grab-handle button */}
        <div
          ref={handleRef}
          className="slider-captcha-handle"
          style={{ transform: `translateX(${sliderPosition}px)` }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {isVerified ? (
            <Check size={18} className="verified-icon" />
          ) : (
            <ArrowRight size={18} className="arrow-icon" />
          )}
        </div>
      </div>

      <style jsx>{`
        .slider-captcha-wrapper {
          width: 100%;
          margin: 1.5rem 0;
          display: flex;
          justify-content: center;
        }

        .slider-captcha-container {
          position: relative;
          width: 100%;
          max-width: 420px;
          height: 48px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          user-select: none;
          backdrop-filter: blur(8px);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .slider-captcha-container.dragging {
          border-color: rgba(212, 175, 55, 0.3); /* Premium gold touch border */
        }

        .slider-captcha-container.verified {
          border-color: rgba(76, 175, 80, 0.4);
          background: rgba(76, 175, 80, 0.05);
          box-shadow: 0 0 15px rgba(76, 175, 80, 0.1);
        }

        .slider-captcha-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background: linear-gradient(90deg, rgba(212, 175, 55, 0.02) 0%, rgba(212, 175, 55, 0.12) 100%);
          border-radius: 24px 0 0 24px;
          pointer-events: none;
        }

        .slider-captcha-container.verified .slider-captcha-fill {
          background: linear-gradient(90deg, rgba(76, 175, 80, 0.05) 0%, rgba(76, 175, 80, 0.15) 100%);
          width: 100% !important;
          border-radius: 24px;
        }

        .slider-captcha-text {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          pointer-events: none;
          z-index: 2;
          letter-spacing: 0.5px;
          transition: color 0.3s ease;
        }

        .slider-captcha-container:not(.verified) .slider-captcha-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.5) 100%);
          background-size: 200% 100%;
          animation: shimmer-text 2.5s infinite linear;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .slider-captcha-container.verified .slider-captcha-text {
          color: #81c784;
          font-weight: 600;
        }

        .slider-captcha-handle {
          position: absolute;
          left: 3px;
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #e5c060 0%, #b89333 100%); /* Elegant gold handle */
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #121212;
          cursor: grab;
          z-index: 3;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
          transition: transform 0.1s ease, background 0.3s ease;
        }

        .slider-captcha-handle:active {
          cursor: grabbing;
        }

        .slider-captcha-container.verified .slider-captcha-handle {
          background: linear-gradient(135deg, #81c784 0%, #4caf50 100%);
          color: #ffffff;
          cursor: default;
          box-shadow: 0 2px 5px rgba(76, 175, 80, 0.2);
        }

        .arrow-icon {
          animation: nudge-right 1.5s infinite ease-in-out;
        }

        .verified-icon {
          transform: scale(1.1);
          animation: scale-up 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes shimmer-text {
          0% { background-position: -100% 0; }
          100% { background-position: 100% 0; }
        }

        @keyframes nudge-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }

        @keyframes scale-up {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
