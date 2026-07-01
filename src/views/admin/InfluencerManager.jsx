import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  RefreshCw,
  Search,
  AlertTriangle,
  Check,
  X,
  CreditCard,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { formatMoney } from '../../storefrontShared.jsx';

export default function InfluencerManager() {
  const [activeSubTab, setActiveSubTab] = useState('applications'); // 'applications' | 'influencers' | 'referrals'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editCommissionId, setEditCommissionId] = useState(null);
  const [commissionRateInput, setCommissionRateInput] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Load all influencer data
  const loadData = async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Fetch influencer profiles with user profiles joined
      const { data: profileData, error: profileErr } = await supabase
        .from('influencer_profiles')
        .select(`
          *,
          profiles:profiles!id (
            email,
            full_name,
            whatsapp,
            business_name
          )
        `)
        .order('created_at', { ascending: false });

      if (profileErr) throw profileErr;
      setProfiles(profileData || []);

      // 2. Fetch referrals with influencer details joined
      const { data: referralData, error: referralErr } = await supabase
        .from('influencer_referrals')
        .select(`
          *,
          influencer:influencer_profiles!influencer_id (
            referral_code,
            profiles:profiles!id (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (referralErr) throw referralErr;
      setReferrals(referralData || []);
    } catch (err) {
      console.error('[InfluencerManager] Error loading influencer data:', err);
      setError(err.message || 'Failed to load influencer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Handle application approval/rejection or status changes
  const handleStatusChange = async (influencerId, approve) => {
    setActionLoadingId(influencerId);
    try {
      if (approve) {
        // Approve application
        const { error: updateErr } = await supabase
          .from('influencer_profiles')
          .update({ is_approved: true })
          .eq('id', influencerId);

        if (updateErr) throw updateErr;
      } else {
        // Reject / delete profile
        const { error: deleteErr } = await supabase
          .from('influencer_profiles')
          .delete()
          .eq('id', influencerId);

        if (deleteErr) throw deleteErr;
      }
      await loadData();
    } catch (err) {
      console.error('[InfluencerManager] Error changing status:', err);
      alert(err.message || 'Failed to update status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Update commission percentage rate
  const handleUpdateCommission = async (influencerId) => {
    const rate = parseFloat(commissionRateInput);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }
    setActionLoadingId(influencerId);
    try {
      const { error: updateErr } = await supabase
        .from('influencer_profiles')
        .update({ commission_percentage: rate })
        .eq('id', influencerId);

      if (updateErr) throw updateErr;
      setEditCommissionId(null);
      await loadData();
    } catch (err) {
      console.error('[InfluencerManager] Error updating commission percentage:', err);
      alert(err.message || 'Failed to update commission rate.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Process referral payout (mark as paid or cancel)
  const handleReferralStatus = async (referralId, status) => {
    setActionLoadingId(referralId);
    try {
      const { error: updateErr } = await supabase
        .from('influencer_referrals')
        .update({ status })
        .eq('id', referralId);

      if (updateErr) throw updateErr;
      await loadData();
    } catch (err) {
      console.error('[InfluencerManager] Error updating referral status:', err);
      alert(err.message || 'Failed to update referral.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Calculate high-level statistics
  const stats = useMemo(() => {
    const activeInfluencers = profiles.filter(p => p.is_approved).length;
    const pendingApps = profiles.filter(p => !p.is_approved).length;
    
    // Total sales referred from approved commissions
    const totalSales = referrals
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (Number(r.sale_amount) || 0), 0);
      
    // Total commission payout (all and pending)
    const totalCommission = referrals
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0);
      
    const pendingCommission = referrals
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (Number(r.commission_amount) || 0), 0);

    return {
      activeInfluencers,
      pendingApps,
      totalSales,
      totalCommission,
      pendingCommission,
    };
  }, [profiles, referrals]);

  // Filters logic
  const query = searchQuery.toLowerCase().trim();
  const filteredProfiles = profiles.filter(p => {
    const isApp = activeSubTab === 'applications' ? !p.is_approved : p.is_approved;
    const userProfile = p.profiles || {};
    const matchesSearch = !query ||
      (p.referral_code || '').toLowerCase().includes(query) ||
      (userProfile.full_name || '').toLowerCase().includes(query) ||
      (userProfile.email || '').toLowerCase().includes(query) ||
      (userProfile.whatsapp || '').includes(query);
    return isApp && matchesSearch;
  });

  const filteredReferrals = referrals.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const influencerCode = r.influencer?.referral_code || '';
    const buyerName = r.buyer_name || '';
    const matchesSearch = !query ||
      influencerCode.toLowerCase().includes(query) ||
      buyerName.toLowerCase().includes(query) ||
      (r.order_id || '').toLowerCase().includes(query) ||
      (r.inquiry_id || '').toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-influencer-tab" style={{ padding: '8px' }}>
      {/* 1. Header Section */}
      <div className="admin-ea-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-ea-header-left" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Users size={24} style={{ color: 'var(--gold-dark)' }} />
          <div>
            <h2 className="admin-ea-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)' }}>Influencer Program Management</h2>
            <p className="admin-ea-subtitle" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Track referred customer traffic, moderate applications, and manage commission payouts.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="admin-ea-refresh-btn"
          onClick={loadData}
          disabled={loading}
          style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* 2. Stats Dashboard Cards */}
      <div className="admin-dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(183, 134, 70, 0.1)', color: 'var(--gold-dark)' }}>
            <Users size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Active Influencers</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>{stats.activeInfluencers}</strong>
            {stats.pendingApps > 0 && <small style={{ display: 'block', fontSize: '11px', color: 'var(--gold-dark)', fontWeight: 600 }}>{stats.pendingApps} Pending Apps</small>}
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(38, 166, 154, 0.1)', color: '#26A69A' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Referred Sales Revenue</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>{formatMoney(stats.totalSales)}</strong>
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(21, 101, 192, 0.1)', color: '#1565C0' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Total Commissions</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>{formatMoney(stats.totalCommission)}</strong>
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', borderRadius: '50%', background: 'rgba(198, 40, 40, 0.1)', color: '#C62828' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Unpaid / Pending Payouts</span>
            <strong style={{ fontSize: '1.25rem', color: '#C62828' }}>{formatMoney(stats.pendingCommission)}</strong>
          </div>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="admin-ea-status-filter" style={{ marginBottom: '16px', display: 'flex', borderBottom: '1px solid var(--line)', paddingBottom: '1px' }}>
        <button
          type="button"
          className={`admin-ea-filter-btn ${activeSubTab === 'applications' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('applications'); setSearchQuery(''); }}
          style={{ padding: '8px 16px', borderBottom: activeSubTab === 'applications' ? '2px solid var(--gold-dark)' : 'none', fontWeight: activeSubTab === 'applications' ? 600 : 400, color: activeSubTab === 'applications' ? 'var(--gold-dark)' : 'var(--muted)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Applications ({profiles.filter(p => !p.is_approved).length})
        </button>
        <button
          type="button"
          className={`admin-ea-filter-btn ${activeSubTab === 'influencers' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('influencers'); setSearchQuery(''); }}
          style={{ padding: '8px 16px', borderBottom: activeSubTab === 'influencers' ? '2px solid var(--gold-dark)' : 'none', fontWeight: activeSubTab === 'influencers' ? 600 : 400, color: activeSubTab === 'influencers' ? 'var(--gold-dark)' : 'var(--muted)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Active Influencers ({profiles.filter(p => p.is_approved).length})
        </button>
        <button
          type="button"
          className={`admin-ea-filter-btn ${activeSubTab === 'referrals' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('referrals'); setSearchQuery(''); }}
          style={{ padding: '8px 16px', borderBottom: activeSubTab === 'referrals' ? '2px solid var(--gold-dark)' : 'none', fontWeight: activeSubTab === 'referrals' ? 600 : 400, color: activeSubTab === 'referrals' ? 'var(--gold-dark)' : 'var(--muted)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Referred Sales / Payouts ({referrals.length})
        </button>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="admin-ea-filters" style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="admin-ea-search-wrap" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={14} className="admin-ea-search-icon" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="search"
            className="admin-ea-search-input"
            placeholder={activeSubTab === 'referrals' ? 'Search by code, buyer, order ID…' : 'Search by name, code, WhatsApp, email…'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--surface-soft)', fontSize: '0.85rem' }}
          />
        </div>

        {activeSubTab === 'referrals' && (
          <div className="admin-ea-status-filter" style={{ display: 'flex', gap: '6px' }}>
            {['all', 'pending', 'paid', 'cancelled'].map(s => (
              <button
                key={s}
                type="button"
                className={`admin-ea-filter-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--line)', background: statusFilter === s ? 'var(--gold-dark)' : 'var(--surface)', color: statusFilter === s ? '#fff' : 'var(--text-dark)' }}
              >
                {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Error alerts */}
      {error && (
        <div className="admin-ea-error" style={{ background: '#FFEBEE', border: '1px solid rgba(198, 40, 40, 0.2)', padding: '12px', borderRadius: '6px', color: '#C62828', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', fontSize: '0.85rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 6. List and Table Rendering */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--muted)', gap: '10px' }}>
          <RefreshCw size={24} className="spin" />
          <span>Loading data...</span>
        </div>
      ) : activeSubTab === 'referrals' ? (
        // Referrals and Commissions Table
        filteredReferrals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px dashed var(--line)', color: 'var(--muted)' }}>
            No referrals record found.
          </div>
        ) : (
          <div className="admin-table-wrap-scroller" style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-soft)', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Referral Code</th>
                  <th style={{ padding: '12px' }}>Influencer</th>
                  <th style={{ padding: '12px' }}>Order/Inquiry ID</th>
                  <th style={{ padding: '12px' }}>Buyer Name</th>
                  <th style={{ padding: '12px' }}>Total Sale</th>
                  <th style={{ padding: '12px' }}>Commission</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Payout Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map(ref => {
                  const dateStr = new Date(ref.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });
                  const isActioning = actionLoadingId === ref.id;

                  let statusBg = '#F5F5F5';
                  let statusColor = '#616161';
                  if (ref.status === 'paid') {
                    statusBg = '#EAFAF1';
                    statusColor = '#2E7D32';
                  } else if (ref.status === 'cancelled') {
                    statusBg = '#FFEBEE';
                    statusColor = '#C62828';
                  } else if (ref.status === 'pending') {
                    statusBg = '#FFF8E1';
                    statusColor = '#B78646';
                  }

                  return (
                    <tr key={ref.id} style={{ borderBottom: '1px solid var(--line)', opacity: isActioning ? 0.6 : 1 }}>
                      <td style={{ padding: '12px' }}>{dateStr}</td>
                      <td style={{ padding: '12px' }}><code style={{ fontWeight: 700, color: 'var(--gold-dark)' }}>{ref.influencer?.referral_code || 'N/A'}</code></td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <strong>{ref.influencer?.profiles?.full_name || 'N/A'}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{ref.influencer?.profiles?.email || ''}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}><code style={{ fontSize: '11px' }}>{ref.order_id || ref.inquiry_id || 'N/A'}</code></td>
                      <td style={{ padding: '12px' }}>{ref.buyer_name || 'Guest Buyer'}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{formatMoney(ref.sale_amount)}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--gold-dark)' }}>{formatMoney(ref.commission_amount)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: statusBg, color: statusColor }}>
                          {ref.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {ref.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReferralStatus(ref.id, 'paid')}
                              disabled={isActioning}
                              style={{ padding: '4px 8px', background: '#2E7D32', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={12} /> Mark Paid
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReferralStatus(ref.id, 'cancelled')}
                              disabled={isActioning}
                              style={{ padding: '4px 8px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <X size={12} /> Cancel
                            </button>
                          </>
                        )}
                        {ref.status === 'paid' && (
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Paid / Settled</span>
                        )}
                        {ref.status === 'cancelled' && (
                          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Void / Cancelled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // Influencer Profiles & Applications lists
        filteredProfiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px dashed var(--line)', color: 'var(--muted)' }}>
            No influencer profiles found.
          </div>
        ) : (
          <div className="admin-table-wrap-scroller" style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-soft)', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '12px' }}>Code</th>
                  <th style={{ padding: '12px' }}>Influencer Detail</th>
                  <th style={{ padding: '12px' }}>WhatsApp</th>
                  <th style={{ padding: '12px' }}>Commission Rate</th>
                  <th style={{ padding: '12px' }}>Payment / Payout Settings</th>
                  <th style={{ padding: '12px' }}>Applied On</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map(inf => {
                  const u = inf.profiles || {};
                  const isActioning = actionLoadingId === inf.id;
                  const dateStr = new Date(inf.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={inf.id} style={{ borderBottom: '1px solid var(--line)', opacity: isActioning ? 0.6 : 1 }}>
                      <td style={{ padding: '12px' }}><code style={{ fontWeight: 700, color: 'var(--gold-dark)', fontSize: '14px' }}>{inf.referral_code}</code></td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <strong style={{ fontSize: '14px' }}>{u.full_name || 'N/A'}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{u.email || ''}</span>
                          {u.business_name && <span style={{ display: 'inline-block', fontSize: '10px', background: 'var(--line)', padding: '1px 4px', borderRadius: '3px', marginTop: '2px' }}>{u.business_name}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {u.whatsapp ? (
                          <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: '#25D366', fontWeight: 600 }}>
                            {u.whatsapp}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {editCommissionId === inf.id ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={commissionRateInput}
                              onChange={e => setCommissionRateInput(e.target.value)}
                              style={{ width: '60px', padding: '4px', border: '1px solid var(--line)', borderRadius: '4px' }}
                            />
                            <span style={{ fontSize: '12px' }}>%</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCommission(inf.id)}
                              style={{ padding: '4px 8px', background: 'var(--gold-dark)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditCommissionId(null)}
                              style={{ padding: '4px 8px', background: 'var(--line)', color: 'var(--text-dark)', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <strong>{inf.commission_percentage}%</strong>
                            <button
                              type="button"
                              onClick={() => { setEditCommissionId(inf.id); setCommissionRateInput(String(inf.commission_percentage)); }}
                              style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', textDecoration: 'underline', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '11px' }}>
                        {inf.payment_details?.payout_method === 'upi' ? (
                          <div>
                            <span style={{ fontWeight: 600, display: 'block' }}>UPI Payout</span>
                            <code>{inf.payment_details?.upi_id}</code>
                          </div>
                        ) : inf.payment_details?.bank_name ? (
                          <div>
                            <span style={{ fontWeight: 600, display: 'block' }}>Bank: {inf.payment_details?.bank_name}</span>
                            <span>A/C: {inf.payment_details?.account_number}</span>
                            <span style={{ display: 'block' }}>IFSC: {inf.payment_details?.ifsc}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>No payment details submitted</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>{dateStr}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {activeSubTab === 'applications' ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(inf.id, true)}
                              disabled={isActioning}
                              style={{ padding: '6px 12px', background: 'var(--gold-dark)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(inf.id, false)}
                              disabled={isActioning}
                              style={{ padding: '6px 12px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to suspend this influencer profile? Their referral links will stop tracking.')) {
                                void handleStatusChange(inf.id, false);
                              }
                            }}
                            disabled={isActioning}
                            style={{ padding: '6px 12px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
