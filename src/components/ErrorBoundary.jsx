import React from 'react';
import { AlertTriangle, RefreshCw, Mail } from 'lucide-react';
import { storeConfig } from '../config.js';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.stack || this.state.error?.toString() || 'No stack trace available';
      const email = storeConfig?.email || 'weave365@gmail.com';
      const subject = `Weave365 Error Report: ${this.state.error?.toString().slice(0, 50) || 'Component Crash'}`;
      const body = `Hello Weave365 Support Team,

I encountered an error while browsing Weave365.

Error Details:
---------------------------------------------
${errorMsg}

Page URL:
${typeof window !== 'undefined' ? window.location.href : 'Unknown'}

User Agent:
${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}
---------------------------------------------

Please look into this issue.`;

      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e5e7eb)',
          borderRadius: '8px',
          margin: '2rem auto',
          maxWidth: '600px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <AlertTriangle size={48} color="var(--error, #ef4444)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main, #1f2937)' }}>Something went wrong.</h2>
          <p style={{ color: 'var(--text-muted, #6b7280)', marginBottom: '1.5rem' }}>
            We're sorry, but an unexpected error occurred while rendering this component.
          </p>
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            width: '100%',
            overflowX: 'auto',
            textAlign: 'left',
            fontSize: 'var(--small-size)',
            fontFamily: 'monospace'
          }}>
            <strong>{this.state.error?.toString()}</strong>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button"
              onClick={() => window.location.reload()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary-color, #000000)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 'var(--button-size)',
                fontWeight: 'var(--button-weight)'
              }}
            >
              <RefreshCw size={16} />
              Reload Page
            </button>
            <a
              href={mailtoUrl}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--gold-dark, #805d31)',
                border: '1px solid var(--gold-dark, #805d31)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 'var(--button-size)',
                fontWeight: 'var(--button-weight)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Mail size={16} />
              Report Error
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
