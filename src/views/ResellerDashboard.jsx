/**
 * @file ResellerDashboard.jsx
 * @description The backend reseller business center control view. Integrates white-label storefront settings
 * such as custom domain slugs, logo images, color themes (e.g. Classic Luxury), and customer-facing portal
 * customizations. Embeds the main ResellerTools configuration component while maintaining a clean,
 * unbranded container layout for professional reseller operations.
 * 
 * @module views/ResellerDashboard
 * @param {Object} props
 * @param {Object} props.user - Active authenticated Supabase user session
 * @param {Object} props.buyerProfile - Active buyer profile metadata including reseller authorizations
 * @param {Function} props.navigate - Internal client router handler
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  LayoutDashboard, 
  ShieldCheck,
  User
} from 'lucide-react';
import { ResellerTools } from '../components/ResellerTools.jsx';
import { resellerService } from '../services/resellerService';
import '../styles/resellerStorefront.css';

export function ResellerDashboard({ user, buyerProfile, navigate }) {
  const [storefront, setStorefront] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorefront() {
      if (!user) return;
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
  }, [user]);

  if (!user) {
    return (
      <div className="reseller-storefront theme-classic-luxury" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="rt-container" style={{ textAlign: 'center', padding: '3rem' }}>
          <h1>Unauthorized</h1>
          <p>Please log in to access your reseller dashboard.</p>
          <button className="sc-contact-btn" style={{ margin: '2rem auto' }} onClick={() => navigate('home')}>Back to Home</button>
        </div>
      </div>
    );
  }

  const themeClass = storefront?.theme_color || 'theme-classic-luxury';

  return (
    <div className={`reseller-storefront ${themeClass}`} style={{ minHeight: '100vh', padding: '0' }}>
      {/* Top Nav (White-label) */}
      <nav className="sc-header" style={{ position: 'sticky', top: 0 }}>
        <div className="sc-brand">
          {storefront?.logo_url ? (
            <img src={storefront.logo_url} alt={storefront.store_name} className="sc-logo" />
          ) : (
            <div className="sc-logo" style={{ background: 'var(--reseller-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <LayoutDashboard size={20} />
            </div>
          )}
          <span className="sc-brand-name">{storefront?.store_name || 'My Reseller Studio'}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="sc-contact-btn" style={{ background: 'transparent', color: 'var(--reseller-primary)', border: '1px solid var(--reseller-border)' }} onClick={() => navigate('account')}>
            <User size={16} /> Back to Weave 365
          </button>
          {storefront?.custom_domain && (
            <a href={`https://${storefront.custom_domain.replace(/\/+$/, '')}`} target="_blank" rel="noopener noreferrer" className="sc-contact-btn">
               Visit Store <ExternalLink size={16} />
            </a>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ marginBottom: '3rem' }}>
           <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>Business Center</h1>
           <p style={{ color: 'var(--reseller-muted)', fontSize: '1.1rem' }}>Manage your white-label boutique and customer shares.</p>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: '1rem', border: '1px solid var(--reseller-border)' }}>
           <ResellerTools user={user} buyerProfile={buyerProfile} />
        </div>


        <div style={{ marginTop: '4rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--reseller-muted)', fontSize: '0.9rem' }}>

          <ShieldCheck size={20} />
          <span>Your business data is secure and white-labeled. Weave 365 branding is suppressed on your customer-facing pages.</span>
        </div>
      </main>
    </div>
  );
}
