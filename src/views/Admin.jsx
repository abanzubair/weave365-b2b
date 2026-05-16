import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bookmark,
  ClipboardList,
  Heart,
  LineChart,
  LockKeyhole,
  MessageSquareText,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { adminEmails } from '../config.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { formatMoney } from '../storefrontShared.jsx';
import { isVaranasiPincode, PRICE_GROUPS } from '../utils/buyerAccess.js';
import { syncSheetsToSupabase } from '../productData.js';

const optionalTables = [
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'saved_customer_orders', label: 'Saved Customer Orders' },
  { key: 'follow_ups', label: 'Follow Ups' },
];

const emptyAdminData = {
  profiles: [],
  cartItems: [],
  favorites: [],
  optional: {},
  errors: {},
};

function isAdminUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return Boolean(email && adminEmails.includes(email));
}

async function safeSelect(table, query = '*') {
  const { data, error } = await supabase.from(table).select(query).limit(500);
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

function monthKey(dateValue) {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

function buildMonthlySeries(rows, dateField = 'created_at') {
  const buckets = new Map();
  rows.forEach((row) => {
    const key = monthKey(row[dateField]);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });
  return Array.from(buckets, ([label, value]) => ({ label, value })).slice(-8);
}

function joinByUser(rows, userField = 'user_id') {
  return rows.reduce((map, row) => {
    const key = row[userField];
    if (!key) return map;
    const list = map.get(key) || [];
    list.push(row);
    map.set(key, list);
    return map;
  }, new Map());
}

function MiniBarChart({ data }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="admin-bar-chart" aria-label="Growth chart">
      {data.map((item) => (
        <div key={item.label}>
          <span style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <article className="admin-metric-card">
      <Icon size={24} />
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

export function Admin({ user, buyerProfile, onProfileChange, openAuth }) {
  const [status, setStatus] = useState('idle');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [adminData, setAdminData] = useState(emptyAdminData);
  const allowed = isAdminUser(user);

  async function handleManualSync() {
    if (!isSupabaseConfigured || !allowed || syncStatus === 'loading') return;
    setSyncStatus('loading');
    try {
      await syncSheetsToSupabase();
      alert('Successfully synced Google Sheets to Supabase!');
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncStatus('idle');
    }
  }

  async function loadAdminData() {
    if (!isSupabaseConfigured || !allowed) return;

    setStatus('loading');
    const [profiles, cartItems, favorites] = await Promise.all([
      safeSelect('profiles'),
      safeSelect('cart_items'),
      safeSelect('favorites'),
    ]);

    const optionalResults = await Promise.all(
      optionalTables.map(async (table) => {
        const result = await safeSelect(table.key);
        return [table.key, result];
      }),
    );

    const optional = {};
    const errors = {};

    [
      ['profiles', profiles],
      ['cart_items', cartItems],
      ['favorites', favorites],
      ...optionalResults,
    ].forEach(([key, result]) => {
      if (result.error) errors[key] = result.error.message;
    });

    optionalResults.forEach(([key, result]) => {
      optional[key] = result.data;
    });

    setAdminData({
      profiles: profiles.data,
      cartItems: cartItems.data,
      favorites: favorites.data,
      optional,
      errors,
    });
    setStatus('ready');
  }

  async function updateBuyerPriceAccess(profile, approvalStatus, priceGroup) {
    if (!isSupabaseConfigured || !allowed) return;

    const update = {
      approval_status: approvalStatus,
      price_group: priceGroup,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', profile.id);

    if (error) {
      alert(error.message);
      return;
    }

    setAdminData((current) => ({
      ...current,
      profiles: current.profiles.map((row) => (
        row.id === profile.id ? { ...row, ...update } : row
      )),
    }));

    if (profile.id === user?.id && onProfileChange) {
      onProfileChange({ ...(buyerProfile || profile), ...update });
    }
  }

  async function toggleResellerDashboard(profile, isEnabled) {
    if (!isSupabaseConfigured || !allowed) return;

    const { error } = await supabase
      .from('profiles')
      .update({ reseller_dashboard_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) {
      alert(error.message);
      return;
    }

    setAdminData((current) => ({
      ...current,
      profiles: current.profiles.map((row) => (
        row.id === profile.id ? { ...row, reseller_dashboard_enabled: isEnabled } : row
      )),
    }));

    if (profile.id === user?.id && onProfileChange) {
      onProfileChange({ ...(buyerProfile || profile), reseller_dashboard_enabled: isEnabled });
    }
  }

  async function updateInquiryStatus(inquiryId, status) {
    if (!isSupabaseConfigured || !allowed) return;

    const { error } = await supabase
      .from('inquiries')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', inquiryId);

    if (error) {
      alert(error.message);
      return;
    }

    setAdminData((current) => ({
      ...current,
      optional: {
        ...current.optional,
        inquiries: current.optional.inquiries.map((row) =>
          row.id === inquiryId ? { ...row, status } : row
        ),
      },
    }));
  }

  async function moveToFollowUp(inquiry) {
    if (!isSupabaseConfigured || !allowed) return;

    const { data: followUp, error: followUpError } = await supabase
      .from('follow_ups')
      .insert({
        buyer_id: inquiry.user_id,
        title: `Follow up: ${inquiry.buyer_name || 'Buyer'} inquiry`,
        notes: `Inquiry ID: ${inquiry.id}\nProduct: ${inquiry.variant_code || 'Multiple'}\nMessage: ${inquiry.message || 'No message'}`,
        status: 'open',
      })
      .select()
      .single();

    if (followUpError) {
      alert(followUpError.message);
      return;
    }

    await updateInquiryStatus(inquiry.id, 'followed_up');
    
    setAdminData((current) => ({
      ...current,
      optional: {
        ...current.optional,
        follow_ups: [followUp, ...(current.optional.follow_ups || [])],
      },
    }));
  }

  async function updateFollowUpStatus(followUpId, status) {
    if (!isSupabaseConfigured || !allowed) return;

    const { error } = await supabase
      .from('follow_ups')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', followUpId);

    if (error) {
      alert(error.message);
      return;
    }

    setAdminData((current) => ({
      ...current,
      optional: {
        ...current.optional,
        follow_ups: current.optional.follow_ups.map((row) =>
          row.id === followUpId ? { ...row, status } : row
        ),
      },
    }));
  }

  useEffect(() => {
    void loadAdminData();
  }, [allowed, user?.id]);

  const userCartMap = useMemo(() => joinByUser(adminData.cartItems), [adminData.cartItems]);
  const userFavoriteMap = useMemo(() => joinByUser(adminData.favorites), [adminData.favorites]);
  const profileMap = useMemo(() => {
    const map = new Map();
    adminData.profiles.forEach(p => map.set(p.id, p));
    return map;
  }, [adminData.profiles]);
  const orderRows = adminData.optional.saved_customer_orders || [];
  const enquiryRows = adminData.optional.inquiries || [];
  const followUpRows = adminData.optional.follow_ups || [];
  const pendingProfiles = adminData.profiles.filter((profile) => profile.approval_status === 'pending');
  const resellerProfiles = adminData.profiles.filter((profile) => profile.buyer_type === 'reseller');
  const wholesaleProfiles = adminData.profiles.filter((profile) => profile.buyer_type === 'wholesale');
  const monthlyUsers = buildMonthlySeries(adminData.profiles);

  if (!user) {
    return (
      <section className="admin-locked-page">
        <LockKeyhole size={34} />
        <h1>Admin Login Required</h1>
        <p>Login with your admin email and password to open the dashboard.</p>
        <button className="primary-button" onClick={openAuth}>Login as Admin</button>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="admin-locked-page">
        <LockKeyhole size={34} />
        <h1>Admin Access Only</h1>
        <p>{user.email} is logged in, but this email is not in your admin list.</p>
      </section>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="admin-locked-page">
        <LockKeyhole size={34} />
        <h1>Supabase Required</h1>
        <p>Configure Supabase environment variables before using the admin dashboard.</p>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span>Admin Dashboard</span>
          <h1>Buyer pipeline, orders, carts and growth signals.</h1>
          <p>Monitor registered buyers, saved carts, favourites, enquiries, follow-ups, and order activity from Supabase.</p>
        </div>
        <button className="secondary-button" onClick={loadAdminData} disabled={status === 'loading'}>
          <RefreshCw size={17} /> {status === 'loading' ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </div>

      <div className="admin-sync-banner" style={{ 
        background: 'var(--card-bg)', 
        border: '1px solid var(--border)', 
        padding: '16px', 
        borderRadius: '12px', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary-soft)', color: 'var(--primary)', padding: '10px', borderRadius: '10px' }}>
            <RefreshCw size={20} className={syncStatus === 'loading' ? 'spin' : ''} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px' }}>Data Synchronization</h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              Sheets are automatically synced every 15 minutes, but you can force an update here.
            </p>
          </div>
        </div>
        <button 
          className="primary-button" 
          onClick={handleManualSync} 
          disabled={syncStatus === 'loading'}
          style={{ padding: '8px 20px', fontSize: '14px' }}
        >
          {syncStatus === 'loading' ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      <div className="admin-metrics-grid">
        <MetricCard icon={Users} label="Users" value={adminData.profiles.length} hint={`${pendingProfiles.length} pending approval`} />
        <MetricCard icon={ShoppingBag} label="Cart Rows" value={adminData.cartItems.length} hint="Selected products/colors" />
        <MetricCard icon={Heart} label="Favourites" value={adminData.favorites.length} hint="Saved buying intent" />
        <MetricCard icon={MessageSquareText} label="Enquiries" value={enquiryRows.length} hint={adminData.errors.inquiries ? 'Table not connected' : 'Supabase rows'} />
        <MetricCard icon={PackageCheck} label="Saved Orders" value={orderRows.length} hint={adminData.errors.saved_customer_orders ? 'Table not connected' : 'Supabase rows'} />
        <MetricCard icon={ClipboardList} label="Follow Ups" value={followUpRows.length} hint={adminData.errors.follow_ups ? 'Table not connected' : 'Supabase rows'} />
      </div>

      <div className="admin-dashboard-grid">
        <article className="admin-panel admin-growth-panel">
          <div className="admin-panel-head">
            <span><BarChart3 size={18} /> Growth Visualization</span>
            <small>New registered buyers by month</small>
          </div>
          <MiniBarChart data={monthlyUsers.length ? monthlyUsers : [{ label: 'No data', value: 0 }]} />
          <div className="admin-growth-summary">
            <span><LineChart size={16} /> Wholesale: {wholesaleProfiles.length}</span>
            <span>Reseller: {resellerProfiles.length}</span>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <span><Users size={18} /> Buyer Segments</span>
            <small>Based on signup profile</small>
          </div>
          <div className="admin-segment-list">
            <div><strong>{wholesaleProfiles.length}</strong><span>Wholeseller buyers</span></div>
            <div><strong>{resellerProfiles.length}</strong><span>Reseller buyers</span></div>
            <div><strong>{pendingProfiles.length}</strong><span>Pending approvals</span></div>
          </div>
        </article>
      </div>

      <article className="admin-panel">
        <div className="admin-panel-head">
          <span><Users size={18} /> Users, Carts & Favourites</span>
          <small>{adminData.profiles.length} registered profile rows</small>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Type</th>
                <th>Price Group</th>
                <th>Behaviour</th>
                <th>Approval</th>
                <th>Cart</th>
                <th>Favourites</th>
                <th>Reseller Dashboard</th>
                <th>Contact</th>
                <th>CRM Action</th>
              </tr>
            </thead>
            <tbody>
              {adminData.profiles.map((profile) => {
                const cartRows = userCartMap.get(profile.id) || [];
                const favoriteRows = userFavoriteMap.get(profile.id) || [];

                return (
                  <tr key={profile.id}>
                    <td>
                      <strong>{profile.business_name || profile.full_name || 'Unnamed buyer'}</strong>
                      <span>{profile.email}</span>
                    </td>
                    <td>{profile.buyer_type || 'Not set'}</td>
                    <td>{PRICE_GROUPS[profile.price_group] || 'Pending'}</td>
                    <td>{profile.buying_behavior || 'Not set'}</td>
                    <td><span className={`admin-status ${profile.approval_status || 'pending'}`}>{profile.approval_status || 'pending'}</span></td>
                    <td>{cartRows.length} row{cartRows.length === 1 ? '' : 's'}</td>
                    <td>{favoriteRows.length}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`admin-status ${profile.reseller_dashboard_enabled ? 'approved' : 'pending'}`}>
                          {profile.reseller_dashboard_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => toggleResellerDashboard(profile, !profile.reseller_dashboard_enabled)}
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                          {profile.reseller_dashboard_enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="admin-contact-info">
                        <strong>{profile.whatsapp || 'No WhatsApp'}</strong>
                        <span>
                          {profile.pincode ? `PIN ${profile.pincode}` : ''}
                          {isVaranasiPincode(profile.pincode) && ' Varanasi'}
                        </span>
                        {isVaranasiPincode(profile.pincode) && (
                          <span className="admin-status-hint">approval required</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-action-stack">
                        <button type="button" onClick={() => updateBuyerPriceAccess(profile, 'approved', 'wholesale')}>
                          Approve Wholesale
                        </button>
                        <button type="button" onClick={() => updateBuyerPriceAccess(profile, 'approved', 'reseller')}>
                          Approve Reseller
                        </button>
                        <button type="button" onClick={() => updateBuyerPriceAccess(profile, 'pending', 'pending')}>
                          Hold
                        </button>
                        <button type="button" onClick={() => updateBuyerPriceAccess(profile, 'suspended', 'pending')}>
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {adminData.profiles.length === 0 && (
                <tr>
                  <td colSpan="9">No profiles found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head">
          <span><MessageSquareText size={18} /> Product & Cart Inquiries</span>
          <small>{enquiryRows.length} total inquiries logged</small>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Buyer</th>
                <th>Items (Code / Color / Qty)</th>
                <th>Status</th>
                <th>CRM Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiryRows.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>{monthKey(inquiry.created_at)}</td>
                  <td>
                    <strong>{inquiry.buyer_name || 'Guest'}</strong>
                    <span>{inquiry.email || 'No email'}</span>
                    <span>{inquiry.phone || ''}</span>
                  </td>
                  <td>
                    <div className="admin-items-list">
                      {(inquiry.items || []).map((item, idx) => (
                        <div key={idx} className="admin-item-row" style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                          <code style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: '4px' }}>{item.variant_code || inquiry.variant_code}</code>
                          <span>{item.color || 'No color'}</span>
                          <strong>x{item.quantity || 1}</strong>
                        </div>
                      ))}
                      {(!inquiry.items || inquiry.items.length === 0) && (
                        <code>{inquiry.variant_code || 'N/A'}</code>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-status ${inquiry.status || 'new'}`}>
                      {inquiry.status || 'new'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-action-stack">
                      {inquiry.status !== 'done' && inquiry.status !== 'followed_up' && (
                        <>
                          <button type="button" onClick={() => updateInquiryStatus(inquiry.id, 'done')}>
                            Mark Done
                          </button>
                          <button type="button" onClick={() => moveToFollowUp(inquiry)}>
                            Move to Follow-ups
                          </button>
                        </>
                      )}
                      {inquiry.phone && (
                        <a 
                          href={`https://wa.me/${inquiry.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="admin-secondary-link"
                          style={{ fontSize: '11px', marginTop: '4px', textDecoration: 'underline', color: 'var(--primary)' }}
                        >
                          Chat on WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {enquiryRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-muted">No inquiries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="admin-panel">
        <div className="admin-panel-head">
          <span><ClipboardList size={18} /> CRM Follow Ups</span>
          <small>{followUpRows.length} active follow-up tasks</small>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Buyer</th>
                <th>Task / Notes</th>
                <th>Status</th>
                <th>CRM Actions</th>
              </tr>
            </thead>
            <tbody>
              {followUpRows.map((follow) => {
                const profile = profileMap.get(follow.buyer_id);
                return (
                  <tr key={follow.id}>
                    <td>{monthKey(follow.created_at)}</td>
                    <td>
                      <strong>{profile?.business_name || profile?.full_name || 'Unknown Buyer'}</strong>
                      <span>{profile?.email || 'No email'}</span>
                    </td>
                    <td>
                      <strong>{follow.title}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0' }}>{follow.notes}</p>
                    </td>
                    <td>
                      <span className={`admin-status ${follow.status || 'open'}`}>
                        {follow.status || 'open'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-stack">
                        {follow.status !== 'done' && (
                          <button type="button" onClick={() => updateFollowUpStatus(follow.id, 'done')}>
                            End Enquiry (Done)
                          </button>
                        )}
                        {profile?.whatsapp && (
                          <a 
                            href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="admin-secondary-link"
                            style={{ fontSize: '11px', marginTop: '4px', textDecoration: 'underline', color: 'var(--primary)' }}
                          >
                            WhatsApp Buyer
                          </a>
                        )}
                        {profile?.whatsapp && (
                          <a 
                            href={`tel:${profile.whatsapp.replace(/\D/g, '')}`} 
                            className="admin-secondary-link"
                            style={{ fontSize: '11px', marginTop: '4px', textDecoration: 'underline', color: 'var(--primary)' }}
                          >
                            Call Buyer
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {followUpRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="admin-muted">No follow-ups found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <div className="admin-dashboard-grid">
        {optionalTables.filter(t => t.key !== 'inquiries' && t.key !== 'follow_ups').map((table) => {
          const rows = adminData.optional[table.key] || [];
          const error = adminData.errors[table.key];

          return (
            <article className="admin-panel" key={table.key}>
              <div className="admin-panel-head">
                <span>{table.label}</span>
                <small>{error ? 'Setup required' : `${rows.length} rows`}</small>
              </div>
              {error ? (
                <p className="admin-muted">Create the `{table.key}` table and admin RLS policy to show this data.</p>
              ) : (
                <div className="admin-compact-list">
                  {rows.slice(0, 6).map((row, index) => (
                    <div key={row.id || index}>
                      <strong>{row.title || row.status || row.customer_name || row.buyer_name || `Row ${index + 1}`}</strong>
                      <span>
                        {row.total ? formatMoney(Number(row.total)) : row.created_at ? monthKey(row.created_at) : 'Supabase row'}
                      </span>
                    </div>
                  ))}
                  {rows.length === 0 && <p className="admin-muted">No rows yet.</p>}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {Object.keys(adminData.errors).length > 0 && (
        <article className="admin-panel">
          <div className="admin-panel-head">
            <span>Supabase Setup Notices</span>
            <small>Missing tables or RLS policies</small>
          </div>
          <div className="admin-notice-list">
            {Object.entries(adminData.errors).map(([table, error]) => (
              <p key={table}><strong>{table}</strong>: {error}</p>
            ))}
          </div>
        </article>
      )}
    </section>
  );
}
