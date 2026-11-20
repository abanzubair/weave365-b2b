'use client';

import React, { useState, useEffect } from 'react';
import DeveloperApiLandingPage from '../../src/views/DeveloperApiLandingPage.jsx';
import DeveloperApiDocPage from '../../src/views/DeveloperApiDocPage.jsx';

export default function DeveloperApiDocClient() {
  const [view, setView] = useState('landing'); // 'landing' | 'docs'

  useEffect(() => {
    // Check hash or URL params on mount
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (hash === '#docs' || params.get('view') === 'docs') {
        setView('docs');
      }
    }
  }, []);

  const switchToDocs = () => {
    setView('docs');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '#docs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const switchToLanding = () => {
    setView('landing');
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return view === 'docs' ? (
    <DeveloperApiDocPage onSwitchToLanding={switchToLanding} />
  ) : (
    <DeveloperApiLandingPage onSwitchToDocs={switchToDocs} />
  );
}
