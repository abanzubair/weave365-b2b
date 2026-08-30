/**
 * @file Admin.jsx
 * @description Master Coordinator Dashboard for Weave365 Admin operations.
 * Coordinates database actions and renders a modern sidebar-based dashboard layout
 * inspired by the Dashtar Admin interface.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
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
  Activity,
  Printer,
  Palette,
  Boxes,
  Code2,
  X,
  ShieldCheck,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { blogPosts } from '../data/blogPosts.js';
import { SiteCustomizerTab } from '../components/admin/SiteCustomizerTab.jsx';

// Import split sub-components
import DashboardOverview from './admin/DashboardOverview.jsx';
import AdminsManager from './admin/AdminsManager.jsx';
import '../styles/admin.css';
import BuyerPipeline from './admin/BuyerPipeline.jsx';
import BlogManager from './admin/BlogManager.jsx';
import SeoSettings from './admin/SeoSettings.jsx';
import PageBuilder from './admin/PageBuilder.jsx';
import VendorApplications from './admin/VendorApplications.jsx';
import { ReviewsModeration } from './admin/ReviewsModeration.jsx';
import { AdminTrackingPanel } from './admin/AdminTrackingPanel.jsx';
import DirectoryManager from './admin/DirectoryManager.jsx';
import EnquiresManager from './admin/EnquiresManager.jsx';
import InfluencerManager from './admin/InfluencerManager.jsx';
import BuyerActivity from './admin/BuyerActivity.jsx';
import { InvoiceCourierManager } from './admin/InvoiceCourierManager.jsx';
import AdminStockManager from './admin/AdminStockManager.jsx';
import ApiManager from './admin/ApiManager.jsx';

import { storeConfig } from '../config.js';
import { isVendorProfile } from '../utils/buyerAccess.js';
import brandLogo from '../../assets/Weave365.svg';
import { assetSrc } from '../utils/assetSrc.js';

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
  { key: 'api_orders', label: 'API Orders' },
  { key: 'download_logs', label: 'Download Logs' },
  { key: 'blog_posts', label: 'Blog Posts' },
  { key: 'page_seo_settings', label: 'Page SEO Settings' },
  { key: 'influencer_profiles', label: 'Influencer Profiles' },
  { key: 'reseller_storefronts', label: 'Reseller Storefronts' },
];

const emptyAdminData = {
  profiles: [],
  cartItems: [],
  favorites: [],
  optional: {},
  errors: {},
};

export function Admin({ user, buyerProfile, onProfileChange, openAuth, blogs = [], setBlogs, products = [], landingPages = [], setLandingPages, navigate }) {
  const [status, setStatus] = useState('idle');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [adminData, setAdminData] = useState(emptyAdminData);
  const allowed = isAdminUser(user) || buyerProfile?.role === 'admin';

  // Tab control with automatic URL query persistence & localStorage cache
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab === 'stock' || urlTab === 'vendor-stock' || urlTab === 'inventory') return 'stock';
      if (urlTab) return urlTab;

      try {
        const savedTab = localStorage.getItem('weave365_admin_active_tab');
        if (savedTab) return savedTab;
      } catch {}
    }
    return 'dashboard';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const setActiveTab = useCallback((tabKey) => {
    if (!tabKey) return;
    setActiveTabState(tabKey);
    setIsMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('weave365_admin_active_tab', tabKey);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabKey);
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        console.warn('Failed to persist active tab:', e);
      }
    }
  }, []);

  // Synchronize on browser Back / Forward navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const urlTab = new URLSearchParams(window.location.search).get('tab');
      if (urlTab) {
        setActiveTabState(urlTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Ensure current active tab is mirrored to URL & localStorage on mount / change
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      try {
        localStorage.setItem('weave365_admin_active_tab', activeTab);
        const url = new URL(window.location.href);
        if (url.searchParams.get('tab') !== activeTab) {
          url.searchParams.set('tab', activeTab);
          window.history.replaceState({}, '', url.toString());
        }
      } catch {}
    }
  }, [activeTab]);

  // Reviews moderation state
  const [pendingReviews, setPendingReviews] = useState([]);
  const [allSiteReviews, setAllSiteReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [reviewsFilter, setReviewsFilter] = useState('pending');
  const [reviewActionLoading, setReviewActionLoading] = useState(null);

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

  // API Call: Direct update for vendor profile attributes (vendor_code, approval_status, partner_name, price_group, etc.)
  async function updateVendorProfile(profileId, updateData) {
    if (!isSupabaseConfigured || !allowed || !profileId) return false;

    const update = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', profileId);

    if (error) {
      alert(`Failed to update vendor profile: ${error.message}`);
      return false;
    }

    setAdminData((current) => ({
      ...current,
      profiles: current.profiles.map((row) => (
        row.id === profileId ? { ...row, ...update } : row
      )),
    }));

    if (profileId === user?.id && onProfileChange) {
      onProfileChange({ ...(buyerProfile || {}), ...update });
    }

    return true;
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
  }, [allowed, user?.id]);

  useEffect(() => {
    if ((activeTab === 'partners' || activeTab === 'enquires' || activeTab === 'tracking') && allowed) {
      void loadAdminData();
    }
    if (activeTab === 'reviews' && allowed) {
      void loadSiteReviews();
    }
  }, [activeTab, allowed]);

  const userCartMap = useMemo(() => joinByUser(adminData.cartItems), [adminData.cartItems]);
  const userFavoriteMap = useMemo(() => joinByUser(adminData.favorites), [adminData.favorites]);

  const enquiryRows = useMemo(() => {
    const rawInquiries = (adminData.optional.inquiries || []).map(i => ({ ...i, _sourceTable: 'inquiries' }));
    const rawOrders = (adminData.optional.orders || []).map(o => ({ ...o, _sourceTable: 'orders' }));
    const rawApiOrders = (adminData.optional.api_orders || []).map(a => ({
      ...a,
      _sourceTable: 'api_orders',
      is_dropship: true,
      buyer_name: a.recipient_name || a.buyer_name,
      phone: a.recipient_phone || a.phone,
      email: a.recipient_email || a.email,
      pincode: a.recipient_pincode || a.pincode,
      dropship_sender_name: a.sender_name || a.dropship_sender_name,
      dropship_sender_phone: a.sender_phone || a.dropship_sender_phone,
      dropship_recipient_name: a.recipient_name,
      dropship_recipient_phone: a.recipient_phone,
      dropship_recipient_address: a.recipient_address,
      dropship_recipient_city: a.recipient_city,
      dropship_recipient_state: a.recipient_state,
      dropship_recipient_pincode: a.recipient_pincode,
      dropship_packing_preference: a.packing_preference,
      message: a.shipping_notes || a.message,
    }));

    return [...rawInquiries, ...rawOrders, ...rawApiOrders];
  }, [adminData.optional.inquiries, adminData.optional.orders, adminData.optional.api_orders]);

  const newOrdersCount = useMemo(() => {
    return enquiryRows.filter(i => {
      const isOrder = i._sourceTable === 'orders' ||
        i._sourceTable === 'api_orders' ||
        i.inquiry_type === 'cart_payment' ||
        i.inquiry_type === 'cart_payment_fallback' ||
        i.inquiry_type === 'reseller_api_order';
      const isNew = (i.status || 'new').toLowerCase() === 'new';
      return isOrder && isNew;
    }).length;
  }, [enquiryRows]);

  const newEnquiriesCount = useMemo(() => {
    return (adminData.optional.inquiries || []).filter(r => {
      const isNew = (r.status || 'new').toLowerCase() === 'new';
      const isOrderType = r.inquiry_type === 'reseller_api_order' ||
        r.inquiry_type === 'cart_payment' ||
        r.inquiry_type === 'cart_payment_fallback';
      return isNew && !isOrderType;
    }).length;
  }, [adminData.optional.inquiries]);

  const sidebarSections = [
    {
      title: 'General',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { key: 'admins', label: 'Admins', icon: ShieldCheck, badge: null },
        { key: 'pipeline', label: 'Accounts', icon: Users, badge: null },
        { key: 'partners', label: 'Vendors', icon: Award, badge: null },
        { key: 'stock', label: 'Products', icon: Boxes, badge: null },
      ],
    },
    {
      title: 'Sales',
      items: [
        { key: 'buyer-activity', label: 'Activity', icon: Activity, badge: null },
        { key: 'enquires', label: 'Enquiry', icon: Inbox, badge: newEnquiriesCount > 0 ? newEnquiriesCount : null },
        { key: 'tracking', label: 'Order', icon: Truck, badge: newOrdersCount > 0 ? newOrdersCount : null },
        { key: 'invoice-slip', label: 'Invoice', icon: Printer, badge: null },
        { key: 'influencers', label: 'Affiliate', icon: Users, badge: (adminData.optional.influencer_profiles || []).filter(p => !p.is_approved).length > 0 ? (adminData.optional.influencer_profiles || []).filter(p => !p.is_approved).length : null },
        { key: 'reviews', label: 'Reviews', icon: MessageSquareText, badge: pendingReviews.length > 0 ? pendingReviews.length : null },
      ],
    },
    {
      title: 'Settings',
      items: [
        { key: 'blogs', label: 'Blog Manager', icon: FileText, badge: null },
        { key: 'builder', label: 'Page Builder', icon: Layers, badge: null },
        { key: 'directory', label: 'Internal Link', icon: Compass, badge: null },
        { key: 'seo', label: 'SEO Setting', icon: Search, badge: null },
        { key: 'customizer', label: 'Appearance', icon: Palette, badge: null },
        { key: 'api-manager', label: 'Developer API', icon: Code2, badge: null },
      ],
    },
  ];

  const activeTabItem = useMemo(() => {
    for (const section of sidebarSections) {
      const item = section.items.find((it) => it.key === activeTab);
      if (item) return item;
    }
    return { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard };
  }, [activeTab, sidebarSections]);

  if (!user) {
    return (
      <section className="admin-locked-page">
        <LockKeyhole size={34} />
        <h1>Admin Login Required</h1>
        <p>Login with your admin email and password to open the dashboard.</p>
        <button type="button" className="primary-button" onClick={() => navigate ? navigate('signup', null, null, { mode: 'login' }) : openAuth && openAuth()}>Login as Admin</button>
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

  const userName = user?.email ? user.email.split('@')[0] : 'admin';
  const notificationCount = pendingReviews.length;

  return (
    <section className="admin-layout-container">
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Sidebar Panel (Desktop & Mobile Drawer) */}
      <aside className={`admin-sidebar-nav ${isSidebarOpen ? 'open' : 'closed'} ${isSidebarMinimized ? 'minimized' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          {!isSidebarMinimized ? (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-sidebar-brand-link"
              title="Open Weave365 Homepage in new tab"
            >
              <img
                src={assetSrc(brandLogo)}
                alt={storeConfig.name}
                style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
              />
            </a>
          ) : (
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-sidebar-brand-link"
              title="Open Weave365 Homepage in new tab"
            >
              <img
                src={assetSrc(brandLogo)}
                alt={storeConfig.name}
                style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
              />
            </a>
          )}
          {/* Desktop minimize button */}
          <button
            type="button"
            className="sidebar-toggle-btn admin-desktop-toggle-btn"
            onClick={() => setIsSidebarMinimized((prev) => !prev)}
            title={isSidebarMinimized ? 'Expand Sidebar' : 'Minimize Sidebar'}
          >
            {isSidebarMinimized ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          {/* Mobile drawer close button */}
          <button
            type="button"
            className="sidebar-toggle-btn admin-mobile-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            title="Close Menu"
            aria-label="Close Menu"
          >
            <X size={18} />
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
        {/* Mobile Top Sticky Navigation Bar */}
        <header className="admin-mobile-top-bar">
          <button
            type="button"
            className="admin-mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open Admin Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <div className="admin-mobile-brand">
            <img
              src={assetSrc(brandLogo)}
              alt={storeConfig.name}
              style={{ height: '18px', width: 'auto', objectFit: 'contain' }}
            />
            <span className="admin-mobile-tab-badge">
              {activeTabItem?.label || 'Admin'}
            </span>
          </div>
        </header>

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

          {activeTab === 'admins' && (
            <AdminsManager
              adminData={adminData}
              user={user}
              toggleResellerDashboard={toggleResellerDashboard}
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

          {activeTab === 'customizer' && (
            <SiteCustomizerTab user={user} navigate={navigate} />
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
              loadAdminData={loadAdminData}
              updateBuyerPriceAccess={updateBuyerPriceAccess}
              updateVendorProfile={updateVendorProfile}
              products={products}
              user={user}
              buyerProfile={buyerProfile}
              navigate={navigate}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'tracking' && (
            <AdminTrackingPanel
              inquiries={enquiryRows}
              products={products}
              loadAdminData={loadAdminData}
            />
          )}

          {activeTab === 'stock' && (
            <AdminStockManager
              products={products}
              user={user}
              buyerProfile={buyerProfile}
            />
          )}

          {activeTab === 'influencers' && (
            <InfluencerManager />
          )}

          {activeTab === 'buyer-activity' && (
            <BuyerActivity
              adminData={adminData}
              products={products}
              loadAdminData={loadAdminData}
            />
          )}

          {activeTab === 'invoice-slip' && (
            <InvoiceCourierManager
              inquiries={enquiryRows}
              products={products}
              loadAdminData={loadAdminData}
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

          {activeTab === 'api-manager' && (
            <ApiManager
              adminData={adminData}
              loadAdminData={loadAdminData}
              user={user}
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
