'use client';

import React, { useRef, useState, useLayoutEffect } from 'react';
import '../../styles/segmentedControl.css';

const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: '3 Months', discount: '5% Off' },
];

/**
 * Measures the active option inside a segmented track and writes `--seg-x`,
 * `--seg-y`, `--seg-w`, and `--seg-h` custom properties so the `::before` pill
 * glides smoothly between options on change while skipping mount/resize slides.
 *
 * @param {string} value - Active option value triggering re-measurement.
 * @returns {{ trackRef: React.RefObject<HTMLDivElement | null>, sliderReady: boolean }}
 */
export function useSegmentedSlider(value) {
  const trackRef = useRef(null);
  const hasMountedRef = useRef(false);
  const [sliderReady, setSliderReady] = useState(false);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    let cancelled = false;

    const updateIndicator = (animate) => {
      if (cancelled) return;
      const checkedInput = track.querySelector('input[type="radio"]:checked');
      let target = null;

      if (checkedInput) {
        const label =
          (checkedInput.id && typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? track.querySelector(`label[for="${CSS.escape(checkedInput.id)}"]`)
            : null) || checkedInput.nextElementSibling;

        target =
          label && label.parentElement && label.parentElement !== track
            ? label.parentElement
            : label;
      } else {
        target = track.querySelector('[role="radio"][aria-checked="true"], .active');
      }
      if (!target) return;

      const trackRect = track.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      if (trackRect.width === 0 || targetRect.width === 0) return;

      const x = targetRect.left - trackRect.left - track.clientLeft;
      const y = targetRect.top - trackRect.top - track.clientTop;

      if (!animate) {
        track.dataset.sliderAnimating = '0';
      }

      track.style.setProperty('--seg-x', `${x.toFixed(2)}px`);
      track.style.setProperty('--seg-y', `${y.toFixed(2)}px`);
      track.style.setProperty('--seg-w', `${targetRect.width.toFixed(2)}px`);
      track.style.setProperty('--seg-h', `${targetRect.height.toFixed(2)}px`);

      if (!animate) {
        // Flush layout before re-enabling transitions so mount/resize never animates
        void track.offsetWidth;
        track.dataset.sliderAnimating = '1';
      }
    };

    const isValueChange = hasMountedRef.current;
    hasMountedRef.current = true;
    updateIndicator(isValueChange);
    setSliderReady(true);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => updateIndicator(false));
    }

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        cancelled = true;
      };
    }
    const ro = new ResizeObserver(() => updateIndicator(false));
    ro.observe(track);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [value]);

  return { trackRef, sliderReady };
}

/**
 * Accessible animated segmented radio control with a spring-sliding pill indicator.
 */
export function SegmentedControl({
  legend,
  name,
  idPrefix,
  options,
  value,
  onChange,
  quad = false,
  size = 'md',
  className = '',
}) {
  const { trackRef, sliderReady } = useSegmentedSlider(value);
  const sizeClass = size === 'sm' ? 'w365-seg--sm' : '';
  const trackClasses = ['w365-seg-track', quad ? 'w365-seg-track--quad' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset className={`w365-seg-fieldset ${sizeClass} ${className}`.trim()}>
      <legend className="w365-seg-legend">{legend}</legend>
      <div
        ref={trackRef}
        data-slider={sliderReady ? 'ready' : 'static'}
        className={trackClasses}
      >
        {options.map((opt) => {
          const inputId = `${idPrefix}-${opt.value}`;
          return (
            <div key={opt.value} className="w365-seg-item">
              <input
                type="radio"
                id={inputId}
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="w365-seg-input"
              />
              <label htmlFor={inputId} className="w365-seg-label">
                {opt.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Shared Monthly / 3-Month billing cycle pill toggle with spring-sliding indicator.
 */
export function BillingCycleToggle({
  value,
  onChange,
  align = 'center',
  size = 'md',
  className = '',
}) {
  const { trackRef, sliderReady } = useSegmentedSlider(value);
  const wrapClasses = [
    'w365-billing-wrap',
    align === 'start' ? 'w365-billing-wrap--start' : '',
    size === 'sm' ? 'w365-seg--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClasses}>
      <div
        ref={trackRef}
        data-slider={sliderReady ? 'ready' : 'static'}
        role="radiogroup"
        aria-label="Billing frequency"
        className="w365-seg-track w365-seg-track--pill"
      >
        {BILLING_CYCLE_OPTIONS.map((opt) => {
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`w365-seg-btn ${isActive ? 'active' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              <span>{opt.label}</span>
              {opt.discount && <span className="w365-seg-discount">{opt.discount}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
