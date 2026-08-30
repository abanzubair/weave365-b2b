/**
 * @file AdminsManager.jsx
 * @description Admin Panel Management View for Administrator Accounts & Roles.
 * Displays authorized admin personnel, email access list, security privileges,
 * and direct Reseller Dashboard & Storefront enablement toggles.
 * 
 * @module views/admin/AdminsManager
 */

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Mail,
  Shield,
  CheckCircle2,
  Search,
  Copy,
  Check,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { adminEmails } from '../../config.js';
import { isAdminUser } from './AdminShared.jsx';

export default function AdminsManager({ adminData, user, toggleResellerDashboard }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);

  const storefrontsByReseller = useMemo(() => {
    const list = adminData?.optional?.reseller_storefronts || [];
    const map = {};
    list.forEach((sf) => {
      if (sf?.reseller_id) {
        map[sf.reseller_id] = sf;
      }
    });
    return map;
  }, [adminData?.optional?.reseller_storefronts]);

  const adminList = useMemo(() => {
    const configuredEmails = adminEmails.map((e) => String(e).toLowerCase().trim()).filter(Boolean);
    const profiles = adminData.profiles || [];

    // Find profiles that match configured admin emails or have role === 'admin'
    const matchedProfiles = profiles.filter((p) => {
      const pEmail = String(p.email || '').toLowerCase().trim();
      return configuredEmails.includes(pEmail) || p.role === 'admin' || isAdminUser(p);
    });

    // Also include any configured emails that might not have a profile row yet
    const foundEmails = new Set(matchedProfiles.map((p) => String(p.email || '').toLowerCase().trim()));
    const extraAdmins = configuredEmails
      .filter((e) => !foundEmails.has(e))
      .map((email, idx) => ({
        id: `config-admin-${idx}`,
        email,
        full_name: email.split('@')[0],
        business_name: 'Weave365 System Administrator',
        role: 'admin',
        is_configured_only: true,
        reseller_dashboard_enabled: false,
      }));

    const combined = [...matchedProfiles, ...extraAdmins];

    if (!searchQuery.trim()) return combined;
    const q = searchQuery.toLowerCase().trim();
    return combined.filter((adm) => {
      const name = String(adm.full_name || adm.business_name || '').toLowerCase();
      const email = String(adm.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [adminData.profiles, searchQuery]);

  const handleCopyEmail = (email) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1800);
  };

  return (
    <div className="admin-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
      <div className="dashtar-card" style={{ padding: '1.25rem 1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} style={{ color: '#2563eb' }} />
              Administrator Accounts & Security
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Manage privileged admin personnel, security access, and direct Reseller Dashboard / Storefront toggles.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', background: '#f0fdf4', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={13} /> {adminList.length} Active {adminList.length === 1 ? 'Admin' : 'Admins'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Stats & Privileges Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="dashtar-card" style={{ padding: '1.125rem 1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logged-In Session</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                {user?.email || 'Admin'}
              </div>
            </div>
          </div>
        </div>

        <div className="dashtar-card" style={{ padding: '1.125rem 1.25rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Privilege</div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                Full Read & Write Master Access
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="dashtar-card" style={{ padding: '0.875rem 1.25rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Search size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search admin by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem', color: '#0f172a', background: 'transparent' }}
        />
      </div>

      {/* Admin Table */}
      <div className="dashtar-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin User</th>
                <th style={{ padding: '12px 16px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</th>
                <th style={{ padding: '12px 16px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: '12px 16px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reseller Dashboard</th>
                <th style={{ padding: '12px 16px', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminList.map((adm) => {
                const isCurrentUser = String(adm.email || '').toLowerCase() === String(user?.email || '').toLowerCase();
                const isCopied = copiedEmail === adm.email;

                const storefront = storefrontsByReseller[adm.id] || (adm.user_id ? storefrontsByReseller[adm.user_id] : null);
                const storeSlug = storefront?.slug || adm.reseller_slug || adm.store_slug;
                const rawCustomDomain = storefront?.custom_domain || adm.custom_domain;
                const storeUrl = rawCustomDomain
                  ? (rawCustomDomain.startsWith('http') ? rawCustomDomain : `https://${rawCustomDomain}`)
                  : (storeSlug ? `/s/${storeSlug}` : null);
                const storeDisplayName = storefront?.store_name || (storeSlug ? `/s/${storeSlug}` : 'View Store');

                return (
                  <tr key={adm.id || adm.email} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#334155', fontSize: '0.8125rem' }}>
                          {(adm.full_name || adm.email || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                            {adm.full_name || adm.email.split('@')[0]}
                            {isCurrentUser && (
                              <span style={{ marginLeft: '6px', fontSize: '0.6875rem', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {adm.business_name || 'Weave365 Administrator'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 500 }}>
                        <Mail size={13} style={{ color: '#94a3b8' }} />
                        <span>{adm.email}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4338ca', background: '#eef2ff', padding: '3px 8px', borderRadius: '6px', border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Shield size={11} /> Super Admin
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div className="reseller-dashboard-cell">
                        <div className="reseller-dashboard-status-row">
                          <span className={`reseller-dashboard-status ${adm.reseller_dashboard_enabled ? 'enabled' : 'disabled'}`}>
                            {adm.reseller_dashboard_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          {toggleResellerDashboard && (
                            <button
                              type="button"
                              onClick={() => toggleResellerDashboard(adm, !adm.reseller_dashboard_enabled)}
                              className={`admin-action-link-btn ${adm.reseller_dashboard_enabled ? 'btn-disable' : 'btn-enable'}`}
                            >
                              {adm.reseller_dashboard_enabled ? 'Disable' : 'Enable'}
                            </button>
                          )}
                        </div>
                        {storeUrl && (
                          <a
                            href={storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="reseller-website-link"
                            title={`Open reseller storefront: ${storeDisplayName} (${storeUrl})`}
                          >
                            <Globe size={12} className="reseller-website-icon" />
                            <span className="reseller-website-text">{storeDisplayName}</span>
                            <ExternalLink size={11} className="reseller-website-ext-icon" />
                          </a>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(adm.email)}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 500, color: '#475569', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Copy Admin Email"
                      >
                        {isCopied ? <Check size={12} style={{ color: '#16a34a' }} /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {adminList.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No admin accounts found matching "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
