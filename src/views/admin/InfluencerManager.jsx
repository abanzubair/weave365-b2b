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
  Eye,
  Globe,
  Smartphone,
  Laptop
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { formatMoney } from '../../storefrontShared.jsx';

/**
 * Parses user agent and referrer string to detect origin social media & device type
 */
export function parseClickMetadata(referrer, userAgent) {
  let source = 'Direct / App Link';
  let sourceBadgeBg = '#f1f5f9';
  let sourceBadgeColor = '#475569';
  let sourceIcon = '🔗';

  if (referrer) {
    const refLower = referrer.toLowerCase();
    if (refLower.includes('instagram')) {
      source = 'Instagram';
      sourceBadgeBg = '#fdf2f8';
      sourceBadgeColor = '#db2777';
      sourceIcon = '📷';
    } else if (refLower.includes('facebook') || refLower.includes('fb.')) {
      source = 'Facebook';
      sourceBadgeBg = '#eff6ff';
      sourceBadgeColor = '#2563eb';
      sourceIcon = '📘';
    } else if (refLower.includes('youtube') || refLower.includes('youtu.be')) {
      source = 'YouTube';
      sourceBadgeBg = '#fef2f2';
      sourceBadgeColor = '#dc2626';
      sourceIcon = '▶️';
    } else if (refLower.includes('twitter') || refLower.includes('t.co') || refLower.includes('x.com')) {
      source = 'X (Twitter)';
      sourceBadgeBg = '#f8fafc';
      sourceBadgeColor = '#0f172a';
      sourceIcon = '🐦';
    } else if (refLower.includes('google')) {
      source = 'Google Search';
      sourceBadgeBg = '#f0fdf4';
      sourceBadgeColor = '#16a34a';
      sourceIcon = '🔍';
    } else if (refLower.includes('whatsapp')) {
      source = 'WhatsApp';
      sourceBadgeBg = '#f0fdf4';
      sourceBadgeColor = '#15803d';
      sourceIcon = '💬';
    } else {
      try {
        const host = new URL(referrer).hostname.replace('www.', '');
        source = host;
        sourceBadgeBg = '#f1f5f9';
        sourceBadgeColor = '#334155';
        sourceIcon = '🌐';
      } catch (e) {
        source = 'Website Link';
        sourceBadgeBg = '#f1f5f9';
        sourceBadgeColor = '#334155';
        sourceIcon = '🌐';
      }
    }
  }

  let device = 'Desktop PC';
  let deviceType = 'desktop';
  let os = 'PC / Mac';
  if (userAgent) {
    const ua = userAgent;
    if (/iPhone/i.test(ua)) {
      device = 'iPhone';
      os = 'iOS';
      deviceType = 'mobile';
    } else if (/iPad/i.test(ua)) {
      device = 'iPad';
      os = 'iOS';
      deviceType = 'tablet';
    } else if (/Android/i.test(ua)) {
      deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet';
      device = deviceType === 'mobile' ? 'Android Mobile' : 'Android Tablet';
      os = 'Android';
    } else if (/Mobile/i.test(ua)) {
      device = 'Mobile';
      os = 'Mobile OS';
      deviceType = 'mobile';
    } else if (/Macintosh|Mac OS/i.test(ua)) {
      device = 'Mac Desktop';
      os = 'macOS';
      deviceType = 'desktop';
    } else if (/Windows/i.test(ua)) {
      device = 'Windows PC';
      os = 'Windows';
      deviceType = 'desktop';
    } else if (/Linux/i.test(ua)) {
      device = 'Linux PC';
      os = 'Linux';
      deviceType = 'desktop';
    }
  }

  return { source, sourceIcon, sourceBadgeBg, sourceBadgeColor, device, os, deviceType };
}

export default function InfluencerManager() {
  const [activeSubTab, setActiveSubTab] = useState('applications'); // 'applications' | 'influencers' | 'referrals' | 'clicks'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [clicks, setClicks] = useState([]);
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

      // 3. Fetch link clicks with influencer details joined
      const { data: clickData, error: clickErr } = await supabase
        .from('influencer_clicks')
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
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!clickErr) {
        setClicks(clickData || []);
      }
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

  // Build aggregated metrics for link clicks per influencer
  const clicksPerInfluencer = useMemo(() => {
    const map = {};
    clicks.forEach((c) => {
      const infId = c.influencer_id;
      if (!infId) return;
      if (!map[infId]) {
        map[infId] = { total: 0, sources: {}, devices: { mobile: 0, desktop: 0 } };
      }
      map[infId].total += 1;
      const meta = parseClickMetadata(c.referrer, c.user_agent);
      map[infId].sources[meta.source] = (map[infId].sources[meta.source] || 0) + 1;
      if (meta.deviceType === 'mobile' || meta.deviceType === 'tablet') {
        map[infId].devices.mobile += 1;
      } else {
        map[infId].devices.desktop += 1;
      }
    });
    return map;
  }, [clicks]);

  // Overall traffic overview summary
  const trafficOverview = useMemo(() => {
    let totalVisits = clicks.length;
    let mobileCount = 0;
    let desktopCount = 0;
    const sources = {};

    clicks.forEach((c) => {
      const meta = parseClickMetadata(c.referrer, c.user_agent);
      sources[meta.source] = (sources[meta.source] || 0) + 1;
      if (meta.deviceType === 'mobile' || meta.deviceType === 'tablet') {
        mobileCount++;
      } else {
        desktopCount++;
      }
    });

    const topSources = Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalVisits,
      mobileCount,
      desktopCount,
      mobilePercent: totalVisits ? Math.round((mobileCount / totalVisits) * 100) : 0,
      desktopPercent: totalVisits ? Math.round((desktopCount / totalVisits) * 100) : 0,
      topSources,
    };
  }, [clicks]);

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
      totalVisits: clicks.length
    };
  }, [profiles, referrals, clicks]);

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

  const filteredClicks = clicks.filter(c => {
    const code = c.influencer?.referral_code || '';
    const name = c.influencer?.profiles?.full_name || '';
    const meta = parseClickMetadata(c.referrer, c.user_agent);
    return !query ||
      code.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query) ||
      meta.source.toLowerCase().includes(query) ||
      meta.device.toLowerCase().includes(query);
  });

  return (
    <div className="admin-influencer-tab" style={{ padding: '8px' }}>
      {/* 1. Header Section */}
      <div className="admin-ea-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-ea-header-left" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Users size={24} style={{ color: 'var(--gold-dark)' }} />
          <div>
            <h2 className="admin-ea-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-dark)' }}>Affiliate Program Management</h2>
            <p className="admin-ea-subtitle" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Track referred customer traffic, social origins, device breakdowns, moderate applications, and manage commission payouts.
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

      <div className="admin-dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0, background: 'rgba(183, 134, 70, 0.1)', color: 'var(--gold-dark)' }}>
            <Users size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Active Affiliates</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>{stats.activeInfluencers}</strong>
            {stats.pendingApps > 0 && <small style={{ display: 'block', fontSize: '11px', color: 'var(--gold-dark)', fontWeight: 600 }}>{stats.pendingApps} Pending Apps</small>}
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0, background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <Eye size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Total Link Visits</span>
            <strong style={{ fontSize: '1.25rem', color: '#2563eb' }}>{stats.totalVisits}</strong>
            <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>{trafficOverview.mobilePercent}% Mobile</small>
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0, background: 'rgba(38, 166, 154, 0.1)', color: '#26A69A' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Referred Sales Revenue</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>{formatMoney(stats.totalSales)}</strong>
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0, background: 'rgba(21, 101, 192, 0.1)', color: '#1565C0' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Total Commissions</span>
            <strong style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>{formatMoney(stats.totalCommission)}</strong>
          </div>
        </div>

        <div style={{ background: 'var(--surface-soft)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', flexShrink: 0, background: 'rgba(198, 40, 40, 0.1)', color: '#C62828' }}>
            <CreditCard size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>Unpaid / Pending Payouts</span>
            <strong style={{ fontSize: '1.25rem', color: '#C62828' }}>{formatMoney(stats.pendingCommission)}</strong>
          </div>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="admin-ea-status-filter" style={{ marginBottom: '16px', display: 'flex', borderBottom: '1px solid var(--line)', paddingBottom: '1px', gap: '4px', flexWrap: 'wrap' }}>
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
          Active Affiliates ({profiles.filter(p => p.is_approved).length})
        </button>
        <button
          type="button"
          className={`admin-ea-filter-btn ${activeSubTab === 'clicks' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('clicks'); setSearchQuery(''); }}
          style={{ padding: '8px 16px', borderBottom: activeSubTab === 'clicks' ? '2px solid var(--gold-dark)' : 'none', fontWeight: activeSubTab === 'clicks' ? 600 : 400, color: activeSubTab === 'clicks' ? 'var(--gold-dark)' : 'var(--muted)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          Link Visits & Traffic ({clicks.length})
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
            placeholder={
              activeSubTab === 'clicks' 
                ? 'Search by code, influencer, social source, device…' 
                : activeSubTab === 'referrals' 
                  ? 'Search by code, buyer, order ID…' 
                  : 'Search by name, code, WhatsApp, email…'
            }
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
      ) : activeSubTab === 'clicks' ? (
        /* Link Visits & Traffic Analytics Sub-Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Traffic breakdown summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                <Globe size={18} style={{ color: '#2563eb' }} /> Top Traffic / Social Channels
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {trafficOverview.topSources.length === 0 ? (
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>No traffic logs recorded yet.</span>
                ) : (
                  trafficOverview.topSources.map(([sourceName, cnt]) => (
                    <div key={sourceName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px' }}>
                      <span style={{ fontWeight: 500, color: '#334155' }}>{sourceName}</span>
                      <strong style={{ color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{cnt} visits</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>
                <Smartphone size={18} style={{ color: '#16a34a' }} /> Device Split Ratio
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}><Smartphone size={14} /> Mobile Phones</span>
                    <strong>{trafficOverview.mobileCount} ({trafficOverview.mobilePercent}%)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${trafficOverview.mobilePercent}%`, background: '#16a34a', borderRadius: '4px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155' }}><Laptop size={14} /> Desktops & Laptops</span>
                    <strong>{trafficOverview.desktopCount} ({trafficOverview.desktopPercent}%)</strong>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${trafficOverview.desktopPercent}%`, background: '#2563eb', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visits Table */}
          {filteredClicks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface-soft)', borderRadius: '8px', border: '1px dashed var(--line)', color: 'var(--muted)' }}>
              No visit records found matching your search.
            </div>
          ) : (
            <div className="admin-table-wrap-scroller" style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: '8px', background: '#fff' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-soft)', borderBottom: '1px solid var(--line)' }}>
                    <th style={{ padding: '12px' }}>Date & Time</th>
                    <th style={{ padding: '12px' }}>Referral Code</th>
                    <th style={{ padding: '12px' }}>Affiliate Name</th>
                    <th style={{ padding: '12px' }}>Social Origin / Channel</th>
                    <th style={{ padding: '12px' }}>Device & OS</th>
                    <th style={{ padding: '12px' }}>Referrer URL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClicks.map((c) => {
                    const dateStr = new Date(c.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    const meta = parseClickMetadata(c.referrer, c.user_agent);

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#64748b' }}>{dateStr}</td>
                        <td style={{ padding: '12px' }}>
                          <code style={{ fontWeight: 700, color: 'var(--gold-dark)', fontSize: '13.5px' }}>
                            {c.influencer?.referral_code || 'N/A'}
                          </code>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong>{c.influencer?.profiles?.full_name || 'N/A'}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{c.influencer?.profiles?.email || ''}</span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            background: meta.sourceBadgeBg,
                            color: meta.sourceBadgeColor
                          }}>
                            <span>{meta.sourceIcon}</span> {meta.source}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>
                            {meta.deviceType === 'mobile' || meta.deviceType === 'tablet' ? <Smartphone size={14} style={{ color: '#16a34a' }} /> : <Laptop size={14} style={{ color: '#2563eb' }} />}
                            <span>{meta.device} ({meta.os})</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.referrer ? (
                            <a href={c.referrer} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }} title={c.referrer}>
                              {c.referrer}
                            </a>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Direct Link / App</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                  <th style={{ padding: '12px' }}>Influencer</th>
                  <th style={{ padding: '12px' }}>Visits</th>
                  <th style={{ padding: '12px' }}>WhatsApp</th>
                  <th style={{ padding: '12px' }}>Commission</th>
                  <th style={{ padding: '12px' }}>Payout Info</th>
                  <th style={{ padding: '12px' }}>Applied</th>
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

                  const infClicks = clicksPerInfluencer[inf.id] || { total: 0, sources: {}, devices: { mobile: 0, desktop: 0 } };
                  const topSourceList = Object.entries(infClicks.sources)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 2);

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
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={14} style={{ color: '#2563eb' }} />
                            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{infClicks.total}</strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>visits</span>
                          </div>
                          {infClicks.total > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {topSourceList.map(([src, count]) => (
                                <span key={src} style={{ fontSize: '10.5px', background: '#f1f5f9', color: '#334155', padding: '1px 6px', borderRadius: '4px', fontWeight: 500 }}>
                                  {src}: {count}
                                </span>
                              ))}
                            </div>
                          )}
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
