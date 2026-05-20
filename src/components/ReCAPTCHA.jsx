import React, { useEffect, useRef } from 'react';

/**
 * A lightweight, dependency-free wrapper for Google reCAPTCHA v2.
 * Fully compatible with React 19.
 */
export default function ReCAPTCHA({ siteKey, onChange, theme = 'dark' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!siteKey) {
      console.warn('reCAPTCHA siteKey is missing.');
      return;
    }

    const scriptId = 'google-recaptcha-script';
    let script = document.getElementById(scriptId);

    const initializeRecaptcha = () => {
      if (window.grecaptcha && containerRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme: theme,
            callback: (token) => {
              if (onChange) onChange(token);
            },
            'expired-callback': () => {
              if (onChange) onChange(null);
            },
            'error-callback': () => {
              if (onChange) onChange(null);
            }
          });
        } catch (err) {
          console.error('Error rendering Google reCAPTCHA:', err);
        }
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
      script.async = true;
      script.defer = true;

      window.onRecaptchaLoaded = () => {
        initializeRecaptcha();
      };

      document.body.appendChild(script);
    } else {
      if (window.grecaptcha && window.grecaptcha.render) {
        initializeRecaptcha();
      } else {
        // Script is already loading, attach initialization callback to the existing global onload function
        const originalOnload = window.onRecaptchaLoaded;
        window.onRecaptchaLoaded = () => {
          if (originalOnload) originalOnload();
          initializeRecaptcha();
        };
      }
    }

    return () => {
      // Cleanup widget reset if component unmounts
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [siteKey, theme, onChange]);

  return (
    <div
      ref={containerRef}
      className="g-recaptcha-container"
      style={{
        minHeight: '78px',
        display: 'flex',
        justifyContent: 'center',
        margin: '1.5rem 0',
      }}
    />
  );
}
