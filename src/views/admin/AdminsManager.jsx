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
} from '../../components/icons.jsx';
import { adminEmails } from '../../config.js';
import { isAdminUser, AdminLoadingScreen } from './AdminShared.jsx';

export default function AdminsManager({ adminData, user, toggleResellerDashboard, loading = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);

  const storefrontsByReseller = useMemo(() => {
    const list = adminData?.optional?.boutique_tenants || adminData?.optional?.reseller_storefronts || [];
    const map = {};
    list.forEach((sf) => {
      const rid = sf?.reseller_id || sf?.owner_id || sf?.about_text?.match(/"reseller_id":"([^"]+)"/)?.[1];
      if (rid) {
        map[rid] = sf;
      }
    });
    return map;
  }, [adminData?.optional?.boutique_tenants, adminData?.optional?.reseller_storefronts]);

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

  if (loading) {
    return (
      <AdminLoadingScreen
        title="Loading Administrator Accounts..."
        subtitle="Fetching admin permissions, roles, and security access…"
      />
    );
  }

  return (
    <div className="admin-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--admin-space-5, 1.25rem)' }}>
      {/* Header Bar */}
      <div className="dashtar-card" style={{ padding: 'var(--admin-space-5, 1.25rem) var(--admin-space-6, 1.5rem)', background: 'var(--admin-surface, #ffffff)', borderRadius: 'var(--admin-radius-lg, 12px)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--admin-space-4, 1rem)' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(var(--admin-font-size-20, 1.25rem), 2.5vw, var(--admin-font-size-24, 1.5rem))', fontWeight: 'var(--admin-font-weight-bold, 700)', color: 'var(--admin-text-heading, #0f172a)', margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--admin-space-2, 8px)' }}>
              <ShieldCheck size={22} style={{ color: 'var(--admin-info, #2563eb)' }} />
              Administrator Accounts & Security
            </h2>
            <p style={{ fontSize: 'var(--admin-font-size-14, 0.875rem)', color: 'var(--admin-text-muted, #64748b)', margin: 'var(--admin-space-1, 4px) 0 0 0' }}>
              Manage privileged admin personnel, security access, and direct Reseller Dashboard / Storefront toggles.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--admin-space-2, 8px)' }}>
            <span style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-success-text, #166534)', background: 'var(--admin-success-bg, #f0fdf4)', padding: 'var(--admin-space-1, 4px) var(--admin-space-2, 10px)', borderRadius: 'var(--admin-radius-sm, 6px)', border: '1px solid var(--admin-success-border, #bbf7d0)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={13} /> {adminList.length} Active {adminList.length === 1 ? 'Admin' : 'Admins'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Stats & Privileges Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--admin-space-4, 1rem)' }}>
        <div className="dashtar-card" style={{ padding: 'var(--admin-space-4, 1.125rem) var(--admin-space-5, 1.25rem)', background: 'var(--admin-surface, #ffffff)', borderRadius: 'var(--admin-radius-lg, 12px)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--admin-space-2, 10px)' }}>
            <div style={{ width: 'var(--admin-space-10, 40px)', height: 'var(--admin-space-10, 40px)', borderRadius: 'var(--admin-radius-md, 10px)', background: 'var(--admin-info-bg, #eff6ff)', color: 'var(--admin-info, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logged-In Session</div>
              <div style={{ fontSize: 'var(--admin-font-size-16, 1rem)', fontWeight: 'var(--admin-font-weight-bold, 700)', color: 'var(--admin-text-heading, #0f172a)', marginTop: '2px' }}>
                {user?.email || 'Admin'}
              </div>
            </div>
          </div>
        </div>

        <div className="dashtar-card" style={{ padding: 'var(--admin-space-4, 1.125rem) var(--admin-space-5, 1.25rem)', background: 'var(--admin-surface, #ffffff)', borderRadius: 'var(--admin-radius-lg, 12px)', border: '1px solid var(--admin-border, #e2e8f0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--admin-space-2, 10px)' }}>
            <div style={{ width: 'var(--admin-space-10, 40px)', height: 'var(--admin-space-10, 40px)', borderRadius: 'var(--admin-radius-md, 10px)', background: 'var(--admin-success-bg, #f0fdf4)', color: 'var(--admin-success, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Privilege</div>
              <div style={{ fontSize: 'var(--admin-font-size-16, 1rem)', fontWeight: 'var(--admin-font-weight-bold, 700)', color: 'var(--admin-text-heading, #0f172a)', marginTop: '2px' }}>
                Full Read & Write Master Access
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="dashtar-card" style={{ padding: 'var(--admin-space-3, 0.875rem) var(--admin-space-5, 1.25rem)', background: 'var(--admin-surface, #ffffff)', borderRadius: 'var(--admin-radius-md, 10px)', border: '1px solid var(--admin-border, #e2e8f0)', display: 'flex', alignItems: 'center', gap: 'var(--admin-space-2, 10px)' }}>
        <Search size={16} style={{ color: 'var(--admin-text-dim, #94a3b8)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search admin by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: 'var(--admin-font-size-14, 0.875rem)', color: 'var(--admin-text-heading, #0f172a)', background: 'transparent' }}
        />
      </div>

      {/* Admin Table */}
      <div className="dashtar-card" style={{ background: 'var(--admin-surface, #ffffff)', borderRadius: 'var(--admin-radius-lg, 12px)', border: '1px solid var(--admin-border, #e2e8f0)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--admin-font-size-14, 0.875rem)', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--admin-surface-subtle, #f8fafc)', borderBottom: '1px solid var(--admin-border, #e2e8f0)' }}>
                <th style={{ padding: 'var(--admin-space-3, 12px) var(--admin-space-4, 16px)', fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin User</th>
                <th style={{ padding: 'var(--admin-space-3, 12px) var(--admin-space-4, 16px)', fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</th>
                <th style={{ padding: 'var(--admin-space-3, 12px) var(--admin-space-4, 16px)', fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: 'var(--admin-space-3, 12px) var(--admin-space-4, 16px)', fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reseller Dashboard</th>
                <th style={{ padding: 'var(--admin-space-3, 12px) var(--admin-space-4, 16px)', fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
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
                  <tr key={adm.id || adm.email} style={{ borderBottom: '1px solid var(--admin-surface-muted, #f1f5f9)' }}>
                    <td style={{ padding: '14px var(--admin-space-4, 16px)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--admin-space-2, 10px)' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: 'var(--admin-radius-full, 50%)', background: 'var(--admin-surface-muted, #f1f5f9)', border: '1px solid var(--admin-border, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--admin-font-weight-bold, 700)', color: 'var(--admin-text-secondary, #334155)', fontSize: 'var(--admin-font-size-14, 0.875rem)' }}>
                          {(adm.full_name || adm.email || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-text-heading, #0f172a)', fontSize: 'var(--admin-font-size-14, 0.875rem)' }}>
                            {adm.full_name || adm.email.split('@')[0]}
                            {isCurrentUser && (
                              <span style={{ marginLeft: 'var(--admin-space-1, 6px)', fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-info, #2563eb)', background: 'var(--admin-info-bg, #eff6ff)', padding: '1px var(--admin-space-1, 6px)', borderRadius: 'var(--admin-radius-xs, 4px)', border: '1px solid var(--admin-info-border, #bfdbfe)' }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', color: 'var(--admin-text-muted, #64748b)' }}>
                            {adm.business_name || 'Weave365 Administrator'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px var(--admin-space-4, 16px)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--admin-space-1, 6px)', color: 'var(--admin-text-secondary, #334155)', fontWeight: 'var(--admin-font-weight-medium, 500)' }}>
                        <Mail size={13} style={{ color: 'var(--admin-text-dim, #94a3b8)' }} />
                        <span>{adm.email}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px var(--admin-space-4, 16px)', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-semibold, 600)', color: 'var(--admin-metric-purple, #4338ca)', background: 'var(--admin-metric-purple-bg, #eef2ff)', padding: '3px var(--admin-space-2, 8px)', borderRadius: 'var(--admin-radius-sm, 6px)', border: '1px solid var(--admin-metric-purple-border, #c7d2fe)', display: 'inline-flex', alignItems: 'center', gap: 'var(--admin-space-1, 4px)' }}>
                        <Shield size={11} /> Super Admin
                      </span>
                    </td>

                    <td style={{ padding: '14px var(--admin-space-4, 16px)', verticalAlign: 'middle' }}>
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

                    <td style={{ padding: '14px var(--admin-space-4, 16px)', verticalAlign: 'middle', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(adm.email)}
                        style={{ background: 'var(--admin-surface, #ffffff)', border: '1px solid var(--admin-border-strong, #cbd5e1)', borderRadius: 'var(--admin-radius-sm, 6px)', padding: 'var(--admin-space-1, 4px) var(--admin-space-2, 8px)', fontSize: 'var(--admin-font-size-12, 0.75rem)', fontWeight: 'var(--admin-font-weight-medium, 500)', color: 'var(--admin-text-secondary, #475569)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 'var(--admin-space-1, 4px)' }}
                        title="Copy Admin Email"
                      >
                        {isCopied ? <Check size={12} style={{ color: 'var(--admin-success, #16a34a)' }} /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {adminList.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: 'var(--admin-space-12, 3rem) var(--admin-space-4, 1rem)', textAlign: 'center', color: 'var(--admin-text-muted, #64748b)' }}>
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
