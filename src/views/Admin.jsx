/**
 * @file Admin.jsx
 * @description Master Coordinator Dashboard for Weave365 Admin operations.
 * Coordinates database actions and renders a modern sidebar-based dashboard layout
 * inspired by the Dashtar Admin interface.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileText,
  Search,
  MessageSquareText,
  Award,
  Truck,
  Inbox,
  LockKeyhole,
  RefreshCw,
  LayoutDashboard,
  ShoppingBag,
  Bell,
  Sun,
  ChevronDown,
  Menu,
  Compass,
  ChevronLeft,
  ChevronRight,
  Layers,
  UserPlus,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { blogPosts } from '../data/blogPosts.js';

// Import split sub-components
import DashboardOverview from './admin/DashboardOverview.jsx';
import BuyerPipeline from './admin/BuyerPipeline.jsx';
import BlogManager from './admin/BlogManager.jsx';
import SeoSettings from './admin/SeoSettings.jsx';
import PageBuilder from './admin/PageBuilder.jsx';
import VendorApplications from './admin/VendorApplications.jsx';
import EarlyAccessManager from './admin/EarlyAccessManager.jsx';
import { ReviewsModeration } from './admin/ReviewsModeration.jsx';
import { AdminTrackingPanel } from './admin/AdminTrackingPanel.jsx';
import DirectoryManager from './admin/DirectoryManager.jsx';
import EnquiresManager from './admin/EnquiresManager.jsx';

import { storeConfig } from '../config.js';

// Import shared helpers and overlays
import {
  isAdminUser,
  safeSelect,
  joinByUser,
  UserListModal,
  LightboxOverlay,
} from './admin/AdminShared.jsx';

const optionalTables = [
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'orders', label: 'Orders' },
  { key: 'blog_posts', label: 'Blog Posts' },
  { key: 'page_seo_settings', label: 'Page SEO Settings' },
];

const emptyAdminData = {
  profiles: [],
  cartItems: [],
  favorites: [],
  optional: {},
  errors: {},
};

export function Admin({ user, buyerProfile, onProfileChange, openAuth, blogs = [], setBlogs, products = [], landingPages = [], setLandingPages }) {
  const [status, setStatus] = useState('idle');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [adminData, setAdminData] = useState(emptyAdminData);
  const allowed = isAdminUser(user) || buyerProfile?.role === 'admin';

  // Tab control: 'dashboard' | 'pipeline' | 'blogs' | 'seo' | 'reviews' | 'partners' | 'tracking' | 'early-access'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Reviews moderation state
  const [pendingReviews, setPendingReviews] = useState([]);
  const [allSiteReviews, setAllSiteReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsFilter, setReviewsFilter] = useState('pending');
  const [reviewActionLoading, setReviewActionLoading] = useState(null);

  // Early Access submissions state
  const [earlyAccessSubmissions, setEarlyAccessSubmissions] = useState([]);
  const [earlyAccessLoading, setEarlyAccessLoading] = useState(false);
  const [earlyAccessError, setEarlyAccessError] = useState('');
  const [earlyAccessActionLoading, setEarlyAccessActionLoading] = useState(null);

  // Vendor Onboarding sheets data
  const [partnerApps, setPartnerApps] = useState({ reviews: [], onboardings: [], loading: false, error: null });
  const [activeAgreement, setActiveAgreement] = useState(null);
  const [updatingWhatsapp, setUpdatingWhatsapp] = useState(null);
  const [localStatuses, setLocalStatuses] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedUserList, setSelectedUserList] = useState(null);

  // Sidebar toggled for responsive viewports & minimize option
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  // API Call: Fetch all admin database tables
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

  // API Call: Sync Google Sheets manual trigger
  async function handleManualSync() {
    if (!isSupabaseConfigured || !allowed || syncStatus === 'loading') return;
    setSyncStatus('loading');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server sync request failed.');
      }
      alert('Successfully synced Google Sheets to Supabase!');
      await loadAdminData();
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncStatus('idle');
    }
  }

  // API Call: Update buyer profile access pricing groups
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

  // API Call: Enable/Disable white-label reseller dashboard
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

  // API Call: Update B2B client inquiry status tags
  async function updateInquiryStatus(inquiryId, status) {
    if (!isSupabaseConfigured || !allowed) return;

    const isOrder = (adminData.optional.orders || []).some(row => row.id === inquiryId);
    const sourceTable = isOrder ? 'orders' : 'inquiries';

    const { error } = await supabase
      .from(sourceTable)
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
        [sourceTable]: (current.optional[sourceTable] || []).map((row) =>
          row.id === inquiryId ? { ...row, status } : row
        ),
      },
    }));
  }

  // API Call: Fetch vendor registration sheets records
  async function loadPartnerApplications() {
    setPartnerApps(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [revRes, onbRes] = await Promise.all([
        fetch(`/api/vendor-registration?type=reviews&_t=${Date.now()}`),
        fetch(`/api/vendor-registration?type=onboardings&_t=${Date.now()}`)
      ]);

      if (!revRes.ok) throw new Error(`Product reviews load failed (Status: ${revRes.status})`);
      if (!onbRes.ok) throw new Error(`Onboarding profiles load failed (Status: ${onbRes.status})`);

      const [revData, onbData] = await Promise.all([
        revRes.json(),
        onbRes.json()
      ]);

      if (revData.status !== 'success') throw new Error(revData.error || 'Reviews load failed');
      if (onbData.status !== 'success') throw new Error(onbData.error || 'Onboardings load failed');

      setPartnerApps({
        reviews: revData.data || [],
        onboardings: onbData.data || [],
        loading: false,
        error: null
      });
    } catch (err) {
      console.error('[loadPartnerApplications] Error:', err);
      setPartnerApps(prev => ({ ...prev, loading: false, error: err.message || 'Unknown network error.' }));
    }
  }

  // API Call: Save spreadsheet partner application statuses
  async function updateDatabaseApplicationStatus(action, whatsapp, statusVal) {
    const cleanWhatsapp = String(whatsapp).replace(/\D/g, '').slice(-10);
    setUpdatingWhatsapp(cleanWhatsapp);
    try {
      const response = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          whatsapp: cleanWhatsapp,
          status: statusVal
        })
      });

      const resData = await response.json();
      if (response.ok && resData.status === 'success') {
        setLocalStatuses(prev => ({
          ...prev,
          [cleanWhatsapp]: statusVal
        }));
        void loadPartnerApplications();
        return true;
      } else {
        console.warn('Database update warning:', resData.error);
        setLocalStatuses(prev => ({
          ...prev,
          [cleanWhatsapp]: statusVal
        }));
        return false;
      }
    } catch (err) {
      console.error('[updateDatabaseApplicationStatus] Error:', err);
      setLocalStatuses(prev => ({
        ...prev,
        [cleanWhatsapp]: statusVal
      }));
      return false;
    } finally {
      setUpdatingWhatsapp(null);
    }
  }

  // API Call: Submit vendor Drive catalog URL
  async function updateDatabaseDriveFolderUrl(whatsapp, driveUrl) {
    const cleanWhatsapp = String(whatsapp).replace(/\D/g, '').slice(-10);
    setUpdatingWhatsapp(cleanWhatsapp);
    try {
      const response = await fetch('/api/vendor-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update_drive_url',
          whatsapp: cleanWhatsapp,
          drive_folder_url: driveUrl
        })
      });

      const resData = await response.json();
      if (response.ok && resData.status === 'success') {
        setPartnerApps(prev => ({
          ...prev,
          onboardings: prev.onboardings.map(o => {
            const ws = String(o.whatsapp_number || '').replace(/\D/g, '').slice(-10);
            return ws === cleanWhatsapp ? { ...o, drive_folder_url: driveUrl } : o;
          })
        }));
        return true;
      } else {
        console.warn('Database drive url update warning:', resData.error);
        return false;
      }
    } catch (err) {
      console.error('[updateDatabaseDriveFolderUrl] Error:', err);
      return false;
    } finally {
      setUpdatingWhatsapp(null);
    }
  }

  // API Call: Fetch Early Access form submissions
  async function loadEarlyAccessSubmissions() {
    setEarlyAccessLoading(true);
    setEarlyAccessError('');
    try {
      const res = await fetch('/api/early-access');
      const json = await res.json();
      if (json.status === 'error') throw new Error(json.error);
      setEarlyAccessSubmissions(json.data || []);
    } catch (err) {
      console.error('[Admin] loadEarlyAccessSubmissions error:', err);
      setEarlyAccessError(err.message || 'Failed to load early access submissions.');
    } finally {
      setEarlyAccessLoading(false);
    }
  }

  // API Call: Patch Early Access approval status
  async function handleEarlyAccessStatusChange(submissionId, newStatus) {
    setEarlyAccessActionLoading(submissionId);
    try {
      const res = await fetch('/api/early-access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId, status: newStatus }),
      });
      const json = await res.json();
      if (json.status === 'error') throw new Error(json.error);
      setEarlyAccessSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, status: newStatus } : s)
      );
    } catch (err) {
      console.error('[Admin] handleEarlyAccessStatusChange error:', err);
      setEarlyAccessError(err.message || 'Failed to update status.');
    } finally {
      setEarlyAccessActionLoading(null);
    }
  }

  // API Call: Fetch all service reviews for moderation
  async function loadSiteReviews() {
    if (!isSupabaseConfigured) {
      setReviewsError('Supabase is not configured.');
      return;
    }
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const { data, error } = await supabase
        .from('service_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      setAllSiteReviews(data || []);
      setPendingReviews((data || []).filter(r => r.status === 'pending'));
    } catch (err) {
      console.error('Error loading reviews for moderation:', err);
      setReviewsError(err.message || 'Failed to load reviews.');
    } finally {
      setReviewsLoading(false);
    }
  }

  // API Call: Approve/Delete service reviews
  async function handleReviewAction(reviewId, action) {
    if (!isSupabaseConfigured) return;
    setReviewActionLoading(reviewId);
    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('service_reviews')
          .update({ status: 'approved' })
          .eq('id', reviewId);
        if (error) throw error;
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('service_reviews')
          .delete()
          .eq('id', reviewId);
        if (error) throw error;
      }
      await loadSiteReviews();
    } catch (err) {
      console.error(`Error ${action} review:`, err);
      setReviewsError(err.message || `Failed to ${action} review.`);
    } finally {
      setReviewActionLoading(null);
    }
  }

  // Lifecycle loading
  useEffect(() => {
    void loadAdminData();
    void loadSiteReviews();
    void loadEarlyAccessSubmissions();
  }, [allowed, user?.id]);

  useEffect(() => {
    if (activeTab === 'partners' && allowed) {
      void loadPartnerApplications();
    }
    if (activeTab === 'reviews' && allowed) {
      void loadSiteReviews();
    }
    if (activeTab === 'early-access' && allowed) {
      void loadEarlyAccessSubmissions();
    }
    if (activeTab === 'enquires' && allowed) {
      void loadAdminData();
    }
  }, [activeTab, allowed]);

  const userCartMap = useMemo(() => joinByUser(adminData.cartItems), [adminData.cartItems]);
  const userFavoriteMap = useMemo(() => joinByUser(adminData.favorites), [adminData.favorites]);

  const sidebarSections = [
    {
      title: 'General',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { key: 'pipeline', label: 'Customers', icon: Users, badge: null },
        { key: 'enquires', label: 'Enquires', icon: Inbox, badge: (adminData.optional.inquiries || []).filter(r => r.status === 'new').length > 0 ? (adminData.optional.inquiries || []).filter(r => r.status === 'new').length : null },
      ],
    },
    {
      title: 'Settings',
      items: [
        { key: 'blogs', label: 'Blog Manager', icon: FileText, badge: null },
        { key: 'seo', label: 'SEO Settings', icon: Search, badge: null },
        { key: 'builder', label: 'Page Builder', icon: Layers, badge: null },
        { key: 'directory', label: 'Internal Links', icon: Compass, badge: null },
      ],
    },
    {
      title: 'Sales',
      items: [
        { key: 'reviews', label: 'Reviews', icon: MessageSquareText, badge: pendingReviews.length > 0 ? pendingReviews.length : null },
        { key: 'partners', label: 'Vendor Applications', icon: Award, badge: null },
        { key: 'tracking', label: 'Order Tracking', icon: Truck, badge: null },
        { key: 'early-access', label: 'Early Access', icon: UserPlus, badge: earlyAccessSubmissions.filter(s => s.status === 'pending_review').length > 0 ? earlyAccessSubmissions.filter(s => s.status === 'pending_review').length : null },
      ],
    },
  ];

  if (!user) {
    return (
      <section className="admin-locked-page">
        <LockKeyhole size={34} />
        <h1>Admin Login Required</h1>
        <p>Login with your admin email and password to open the dashboard.</p>
        <button type="button" className="primary-button" onClick={openAuth}>Login as Admin</button>
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

  const enquiryRows = (adminData.optional.inquiries || []).map(i => ({ ...i, _sourceTable: 'inquiries' }))
    .concat((adminData.optional.orders || []).map(o => ({ ...o, _sourceTable: 'orders' })));

  const userName = user?.email ? user.email.split('@')[0] : 'admin';
  const notificationCount = pendingReviews.length + earlyAccessSubmissions.filter(s => s.status === 'pending_review').length;

  return (
    <section className="admin-layout-container">
      {/* 1. Sidebar Panel */}
      <aside className={`admin-sidebar-nav ${isSidebarOpen ? 'open' : 'closed'} ${isSidebarMinimized ? 'minimized' : ''}`}>
        <div className="admin-sidebar-header">
          {!isSidebarMinimized && <span className="admin-sidebar-brand-text">Navigation</span>}
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarMinimized(prev => !prev)}
            title={isSidebarMinimized ? 'Expand Sidebar' : 'Minimize Sidebar'}
          >
            {isSidebarMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="admin-sidebar-menu-wrapper">
          {sidebarSections.map((section) => (
            <div key={section.title} className="sidebar-group-section">
              {!isSidebarMinimized && <span className="sidebar-group-title">{section.title}</span>}
              <div className="admin-sidebar-menu">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`admin-sidebar-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.key)}
                      title={isSidebarMinimized ? item.label : undefined}
                    >
                      <span className="admin-sidebar-item-content">
                        <Icon size={18} />
                        {!isSidebarMinimized && <span>{item.label}</span>}
                      </span>
                      {!isSidebarMinimized && item.badge && <span className="admin-sidebar-badge">{item.badge}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* 2. Main content area */}
      <main className="admin-main-viewport">
        <div className="admin-page-scrollable-content">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              adminData={adminData}
              updateInquiryStatus={updateInquiryStatus}
              loadAdminData={loadAdminData}
              setSelectedUserList={setSelectedUserList}
              handleManualSync={handleManualSync}
              syncStatus={syncStatus}
            />
          )}

          {activeTab === 'pipeline' && (
            <BuyerPipeline
              adminData={adminData}
              status={status}
              syncStatus={syncStatus}
              loadAdminData={loadAdminData}
              handleManualSync={handleManualSync}
              setSelectedUserList={setSelectedUserList}
              updateBuyerPriceAccess={updateBuyerPriceAccess}
              toggleResellerDashboard={toggleResellerDashboard}
              updateInquiryStatus={updateInquiryStatus}
              user={user}
            />
          )}

          {activeTab === 'blogs' && (
            <BlogManager
              blogs={blogs}
              setBlogs={setBlogs}
              adminData={adminData}
              loadAdminData={loadAdminData}
            />
          )}

          {activeTab === 'seo' && (
            <SeoSettings
              adminData={adminData}
              loadAdminData={loadAdminData}
            />
          )}

          {activeTab === 'builder' && (
            <PageBuilder
              landingPages={landingPages}
              setLandingPages={setLandingPages}
              adminData={adminData}
            />
          )}

          {activeTab === 'directory' && (
            <DirectoryManager />
          )}

          {activeTab === 'reviews' && (
            <ReviewsModeration
              reviewsFilter={reviewsFilter}
              setReviewsFilter={setReviewsFilter}
              allSiteReviews={allSiteReviews}
              reviewsLoading={reviewsLoading}
              reviewsError={reviewsError}
              loadSiteReviews={loadSiteReviews}
              reviewActionLoading={reviewActionLoading}
              handleReviewAction={handleReviewAction}
            />
          )}

          {activeTab === 'partners' && (
            <VendorApplications
              adminData={adminData}
              partnerApps={partnerApps}
              setPartnerApps={setPartnerApps}
              loadPartnerApplications={loadPartnerApplications}
              localStatuses={localStatuses}
              setLocalStatuses={setLocalStatuses}
              updatingWhatsapp={updatingWhatsapp}
              setUpdatingWhatsapp={setUpdatingWhatsapp}
              updateDatabaseApplicationStatus={updateDatabaseApplicationStatus}
              updateDatabaseDriveFolderUrl={updateDatabaseDriveFolderUrl}
              updateBuyerPriceAccess={updateBuyerPriceAccess}
              setLightboxImage={setLightboxImage}
              activeAgreement={activeAgreement}
              setActiveAgreement={setActiveAgreement}
            />
          )}

          {activeTab === 'tracking' && (
            <AdminTrackingPanel
              inquiries={enquiryRows}
              products={products}
              loadAdminData={loadAdminData}
            />
          )}

          {activeTab === 'early-access' && (
            <EarlyAccessManager
              earlyAccessSubmissions={earlyAccessSubmissions}
              earlyAccessLoading={earlyAccessLoading}
              earlyAccessError={earlyAccessError}
              loadEarlyAccessSubmissions={loadEarlyAccessSubmissions}
              handleEarlyAccessStatusChange={handleEarlyAccessStatusChange}
              earlyAccessActionLoading={earlyAccessActionLoading}
            />
          )}

          {activeTab === 'enquires' && (
            <EnquiresManager
              adminData={adminData}
              loadAdminData={loadAdminData}
              products={products}
              loading={status === 'loading'}
            />
          )}
        </div>
      </main>

      {/* 3. Global Dialog Overlays */}
      <UserListModal
        selectedUserList={selectedUserList}
        setSelectedUserList={setSelectedUserList}
        userCartMap={userCartMap}
        userFavoriteMap={userFavoriteMap}
        products={products}
      />

      <LightboxOverlay
        lightboxImage={lightboxImage}
        setLightboxImage={setLightboxImage}
      />
    </section>
  );
}
