/**
 * @file ResellerDashboard.jsx
 * @description The reseller business center control view. Integrates external website settings,
 * catalog management, and API endpoints for boutique reseller operations.
 * 
 * @module views/ResellerDashboard
 */

import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  ArrowLeft, 
  ShieldCheck,
  Globe,
  Store
} from '../components/icons.jsx';
import { ResellerTools } from '../components/ResellerTools.jsx';
import { ResellerUpgradeCard } from '../components/ResellerUpgradeCard.jsx';
import { resellerService, normalizeWebsiteUrl } from '../services/resellerService';

export function ResellerDashboard({ user, buyerProfile, navigate }) {
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorefront() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data } = await resellerService.getStorefront(user.id);
        if (data) setStorefront(data);
      } catch (err) {
        console.error('Error loading storefront:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStorefront();
  }, [user?.id]);

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '450px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Store size={40} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>Login Required</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>Please log in to access your website builder.</p>
          <button type="button" className="primary-button" style={{ width: '100%' }} onClick={() => navigate('account')}>
            Go to Account Login
          </button>
        </div>
      </div>
    );
  }

  const isResellerEnabled = Boolean(
    buyerProfile?.reseller_dashboard_enabled === true ||
    user?.user_metadata?.reseller_dashboard_enabled === true ||
    user?.user_metadata?.buyer_profile?.reseller_dashboard_enabled === true
  );

  if (!isResellerEnabled) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '4rem' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button 
              type="button" 
              onClick={() => navigate('account')} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
            >
              <ArrowLeft size={15} /> Back to My Account
            </button>
          </div>
        </header>

        <main style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1.5rem' }}>
          <ResellerUpgradeCard user={user} buyerProfile={buyerProfile} />
        </main>
      </div>
    );
  }

  const rawWebsiteUrl = storefront?.custom_domain || '';
  const externalWebsiteUrl = rawWebsiteUrl ? normalizeWebsiteUrl(rawWebsiteUrl) : '';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '4rem' }}>
      {/* Top Breadcrumb & Action Bar */}
      <header style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              type="button" 
              onClick={() => navigate('account')} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
            >
              <ArrowLeft size={15} /> Back to My Account
            </button>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} style={{ color: 'var(--primary-color)' }} />
              <strong style={{ color: '#0f172a', fontSize: '0.9375rem' }}>{storefront?.store_name || 'Build Your Own Website'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {externalWebsiteUrl && (
              <a 
                href={externalWebsiteUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-color)', color: 'white', textDecoration: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600 }}
              >
                <Globe size={14} /> Open Live Website <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.25rem 0' }}>
            Build Your Own Website
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', margin: 0 }}>
            Manage your boutique website template, sync sarees directly from Weave365, and customize retail profit markups.
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
          <ResellerTools user={user} buyerProfile={buyerProfile} />
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.8125rem', justifyContent: 'center' }}>
          <ShieldCheck size={18} style={{ color: '#10b981' }} />
          <span>Your business data is secure. Products synced to your external website are served with your customized retail markup.</span>
        </div>
      </main>
    </div>
  );
}

