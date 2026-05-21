/**
 * @file Admin.jsx
 * @description Back-office administration and pipeline management dashboard. Integrates real-time
 * B2B client profiles, order lists, and favorited collections directly from Supabase, alongside manual Google
 * Sheets data synchronization triggers. Controls user pricing tier authorizations (wholesale vs reseller),
 * white-label dashboard permissions, and embeds a premium editorial blog manager for publishing SEO articles with FAQ schemas.
 * 
 * @module views/Admin
 * @param {Object} props
 * @param {Object} props.user - Active authenticated Supabase user session
 * @param {Object} props.buyerProfile - Buyer profile attributes for the logged-in administrator
 * @param {Function} props.onProfileChange - Callback triggered when the active administrator's profile updates
 * @param {Function} props.openAuth - Trigger to open the authentication modal for credentials verification
 * @param {Array} props.blogs - Collection of currently active B2B blog articles
 * @param {Function} props.setBlogs - State setter to sync and update the parent blogs catalog after CRUD operations
 */

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
  Plus,
  Trash2,
  Upload,
  Edit,
  FileText,
  Eye,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { adminEmails } from '../config.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';
import { blogPosts } from '../data/blogPosts.js';
import { formatMoney } from '../storefrontShared.jsx';
import { isVaranasiPincode, PRICE_GROUPS } from '../utils/buyerAccess.js';
import { syncSheetsToSupabase, saveSupabaseBlogPost, fetchSupabaseBlogPosts } from '../productData.js';

const optionalTables = [
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'saved_customer_orders', label: 'Saved Customer Orders' },
  { key: 'follow_ups', label: 'Follow Ups' },
  { key: 'blog_posts', label: 'Blog Posts' },
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

export function Admin({ user, buyerProfile, onProfileChange, openAuth, blogs = [], setBlogs }) {
  const [status, setStatus] = useState('idle');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [adminData, setAdminData] = useState(emptyAdminData);
  const allowed = isAdminUser(user);

  // Tab control
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'blogs'

  // Blog editor form states
  const [editingPost, setEditingPost] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Business Strategy');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formReadTime, setFormReadTime] = useState('8 Min Read');
  const [formAuthor, setFormAuthor] = useState('Weave 365 Editorial');
  const [formIntro, setFormIntro] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMetaTitle, setFormMetaTitle] = useState('');
  const [formMetaDescription, setFormMetaDescription] = useState('');
  const [formImageInputType, setFormImageInputType] = useState('file'); // 'file' | 'url'
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageBase64, setFormImageBase64] = useState('');
  const [formFaqs, setFormFaqs] = useState([]);
  const [isSubmittingBlog, setIsSubmittingBlog] = useState(false);

  // Form helpers
  function autoSlugify() {
    if (!formTitle) return;
    const generated = formTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove special chars
      .replace(/\s+/g, '-')         // replace spaces with hyphens
      .replace(/-+/g, '-')          // replace duplicate hyphens
      .replace(/(^-|-$)/g, '');     // trim leading/trailing hyphens
    setFormSlug(generated);
    if (!formMetaTitle) {
      setFormMetaTitle(`${formTitle} | Weave 365`);
    }
  }

  function handleImageFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Selected file is too large! Please choose an image smaller than 4MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function addFaqItem() {
    setFormFaqs((prev) => [...prev, { q: '', a: '' }]);
  }

  function updateFaqItem(index, field, value) {
    setFormFaqs((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  }

  function removeFaqItem(index) {
    setFormFaqs((prev) => prev.filter((_, idx) => idx !== index));
  }

  function resetBlogForm() {
    setEditingPost(null);
    setFormTitle('');
    setFormSlug('');
    setFormCategory('Business Strategy');
    setFormCustomCategory('');
    setFormTag('');
    setFormReadTime('8 Min Read');
    setFormAuthor('Weave 365 Editorial');
    setFormIntro('');
    setFormContent('');
    setFormMetaTitle('');
    setFormMetaDescription('');
    setFormImageUrl('');
    setFormImageBase64('');
    setFormFaqs([]);
  }

  function handleEditPost(post) {
    setEditingPost(post);
    setFormTitle(post.title || '');
    setFormSlug(post.slug || '');

    const standardCategories = ['Business Strategy', 'Fabric Education', 'Buying Guides'];
    if (standardCategories.includes(post.category)) {
      setFormCategory(post.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Custom');
      setFormCustomCategory(post.category || '');
    }

    setFormTag(post.tag || '');
    setFormReadTime(post.readTime || post.read_time || '8 Min Read');
    setFormAuthor(post.author || 'Weave 365 Editorial');
    setFormIntro(post.intro || '');
    setFormContent(post.content || '');
    setFormMetaTitle(post.metaTitle || post.meta_title || '');
    setFormMetaDescription(post.metaDescription || post.meta_description || '');

    const img = post.image || '';
    if (img.startsWith('data:image')) {
      setFormImageInputType('file');
      setFormImageBase64(img);
      setFormImageUrl('');
    } else {
      setFormImageInputType('url');
      setFormImageUrl(img);
      setFormImageBase64('');
    }

    setFormFaqs(post.faqs || []);

    const editor = document.getElementById('blog-editor-anchor');
    if (editor) {
      editor.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function handleSaveBlog(e) {
    e.preventDefault();
    if (!formTitle || !formSlug) {
      alert('Title and Slug are required fields!');
      return;
    }

    const finalCategory = formCategory === 'Custom' ? formCustomCategory : formCategory;
    if (!finalCategory) {
      alert('Please specify a category!');
      return;
    }

    const finalImage = formImageInputType === 'file' ? formImageBase64 : formImageUrl;
    if (!finalImage) {
      alert('Please upload an image or paste a cover image URL!');
      return;
    }

    setIsSubmittingBlog(true);
    try {
      const payload = {
        id: editingPost?.id,
        title: formTitle,
        slug: formSlug,
        category: finalCategory,
        tag: formTag || finalCategory,
        readTime: formReadTime,
        author: formAuthor,
        intro: formIntro,
        content: formContent,
        metaTitle: formMetaTitle || `${formTitle} | Weave 365`,
        metaDescription: formMetaDescription || formIntro,
        image: finalImage,
        faqs: formFaqs.filter(item => item.q && item.a),
        createdAt: editingPost?.createdAt || editingPost?.created_at || new Date().toISOString(),
      };

      await saveSupabaseBlogPost(payload);
      alert(editingPost ? 'Blog post updated successfully!' : 'Blog post published successfully!');

      resetBlogForm();
      await loadAdminData();

      if (setBlogs) {
        const dbPosts = await fetchSupabaseBlogPosts();
        setBlogs(() => {
          const slugMap = new Map();
          blogPosts.forEach(p => slugMap.set(p.slug, p));
          dbPosts.forEach(p => slugMap.set(p.slug, p));
          const allPosts = Array.from(slugMap.values());
          if (typeof window !== 'undefined') {
            const deletedSlugs = JSON.parse(localStorage.getItem('deleted_blog_slugs') || '[]');
            return allPosts.filter(b => !deletedSlugs.includes(b.slug));
          }
          return allPosts;
        });
      }
    } catch (err) {
      alert('Failed to save blog post: ' + err.message);
    } finally {
      setIsSubmittingBlog(false);
    }
  }

  async function handleDeleteBlog(postToDelete) {
    if (!window.confirm(`Are you sure you want to permanently delete article "${postToDelete.title}"?`)) return;

    try {
      if (postToDelete.id) {
        const { error } = await supabase.from('blog_posts').delete().eq('id', postToDelete.id);
        if (error) throw error;
      }

      if (typeof window !== 'undefined') {
        const deletedSlugs = JSON.parse(localStorage.getItem('deleted_blog_slugs') || '[]');
        if (!deletedSlugs.includes(postToDelete.slug)) {
          deletedSlugs.push(postToDelete.slug);
          localStorage.setItem('deleted_blog_slugs', JSON.stringify(deletedSlugs));
        }
      }

      alert('Blog post deleted successfully!');
      await loadAdminData();

      if (setBlogs) {
        const dbPosts = await fetchSupabaseBlogPosts();
        setBlogs(() => {
          const slugMap = new Map();
          blogPosts.forEach(p => slugMap.set(p.slug, p));
          dbPosts.forEach(p => slugMap.set(p.slug, p));
          const allPosts = Array.from(slugMap.values());
          if (typeof window !== 'undefined') {
            const deletedSlugs = JSON.parse(localStorage.getItem('deleted_blog_slugs') || '[]');
            return allPosts.filter(b => !deletedSlugs.includes(b.slug));
          }
          return allPosts;
        });
      }
    } catch (err) {
      alert('Failed to delete blog post: ' + err.message);
    }
  }

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
          <h1>Buyer pipeline, orders, order lists and growth signals.</h1>
          <p>Monitor registered buyers, saved order lists, favourites, enquiries, follow-ups, and order activity from Supabase.</p>
        </div>
        <button className="secondary-button" onClick={loadAdminData} disabled={status === 'loading'}>
          <RefreshCw size={17} /> {status === 'loading' ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </div>

      {/* Luxury Tabs Bar */}
      <div className="admin-tabs" style={{ 
        display: 'flex', 
        gap: '24px', 
        borderBottom: '1px solid var(--border)', 
        marginBottom: '32px',
        paddingBottom: '2px'
      }}>
        <button 
          type="button"
          onClick={() => setActiveTab('pipeline')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pipeline' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'pipeline' ? 'var(--primary)' : 'var(--muted)',
            fontFamily: 'var(--font-hero-heading, serif)',
            fontSize: '16px',
            fontWeight: 600,
            padding: '12px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <Users size={18} /> Buyer Pipeline & Growth
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('blogs')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'blogs' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'blogs' ? 'var(--primary)' : 'var(--muted)',
            fontFamily: 'var(--font-hero-heading, serif)',
            fontSize: '16px',
            fontWeight: 600,
            padding: '12px 8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
        >
          <FileText size={18} /> B2B Editorial Blog Manager
        </button>
      </div>

      {activeTab === 'pipeline' ? (
        <>
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
                <h2 style={{ margin: 0, fontSize: '15px' }}>Data Synchronization</h2>
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
            <MetricCard icon={ShoppingBag} label="Order List Rows" value={adminData.cartItems.length} hint="Selected products/colors" />
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
              <span><Users size={18} /> Users, Order Lists & Favourites</span>
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
                    <th>Order List</th>
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
                        <td>
                          {profile.buyer_subtype ? (
                            <span style={{ display: 'block' }}>
                              <span style={{ textTransform: 'capitalize' }}>{profile.buyer_type}</span>
                              <small style={{ display: 'block', color: 'var(--muted)', fontSize: '11px', marginTop: '2px', fontStyle: 'italic' }}>
                                {profile.buyer_subtype}
                              </small>
                            </span>
                          ) : (
                            profile.buyer_type || 'Not set'
                          )}
                        </td>
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
                            {profile.city && (
                              <span style={{ textTransform: 'capitalize' }}>
                                {profile.city}
                              </span>
                            )}
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
              <span><MessageSquareText size={18} /> Product & Order List Inquiries</span>
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
            {optionalTables.filter(t => t.key !== 'inquiries' && t.key !== 'follow_ups' && t.key !== 'blog_posts').map((table) => {
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

          {Object.keys(adminData.errors).filter(k => k !== 'blog_posts').length > 0 && (
            <article className="admin-panel">
              <div className="admin-panel-head">
                <span>Supabase Setup Notices</span>
                <small>Missing tables or RLS policies</small>
              </div>
              <div className="admin-notice-list">
                {Object.entries(adminData.errors).filter(([k]) => k !== 'blog_posts').map(([table, error]) => (
                  <p key={table}><strong>{table}</strong>: {error}</p>
                ))}
              </div>
            </article>
          )}
        </>
      ) : (
        /* ==================== B2B BLOG MANAGER TAB ==================== */
        <div className="admin-blog-manager-tab" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          
          {/* Supabase blog_posts Setup Checklist Alert */}
          {adminData.errors.blog_posts ? (
            <article style={{ 
              background: '#fff9f0', 
              border: '1px solid #ffe3b3', 
              padding: '24px', 
              borderRadius: '8px', 
              marginBottom: '32px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fff0d6', color: '#b26a00', padding: '10px', borderRadius: '8px' }}>
                  <AlertTriangle size={24} />
                </div>
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#804c00', fontFamily: 'var(--font-hero-heading, serif)' }}>
                    Supabase Blog Table Required for Dynamic Publishing
                  </h3>
                  <p style={{ margin: '8px 0 16px', fontSize: '14px', color: '#666', lineHeight: 1.5 }}>
                    Your code is ready for dynamic blogging, but the <strong>`blog_posts`</strong> table doesn't exist in your Supabase database yet. 
                    Copy and run the SQL below inside your <strong>Supabase Dashboard SQL Editor</strong> to go live.
                  </p>
                  
                  <div style={{ position: 'relative' }}>
                    <pre style={{ 
                      background: '#121212', 
                      color: '#a9b2c3', 
                      padding: '16px', 
                      borderRadius: '6px', 
                      fontSize: '12px',
                      overflowX: 'auto',
                      maxHeight: '220px',
                      fontFamily: 'monospace',
                      lineHeight: '1.5'
                    }}>
{`CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_title text,
  meta_description text,
  category text NOT NULL,
  tag text,
  date text NOT NULL,
  read_time text NOT NULL,
  author text NOT NULL,
  image text NOT NULL,
  intro text NOT NULL,
  content text NOT NULL,
  faqs jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Allow admin all access" ON public.blog_posts FOR ALL USING (true);`}
                    </pre>
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_title text,
  meta_description text,
  category text NOT NULL,
  tag text,
  date text NOT NULL,
  read_time text NOT NULL,
  author text NOT NULL,
  image text NOT NULL,
  intro text NOT NULL,
  content text NOT NULL,
  faqs jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Allow admin all access" ON public.blog_posts FOR ALL USING (true);`);
                        alert('SQL copied to clipboard!');
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        fontSize: '11px',
                        padding: '4px 8px',
                        background: '#333',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy SQL
                    </button>
                  </div>
                  
                  <div style={{ marginTop: '16px', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px dashed #ffe3b3', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4caf50', borderRadius: '50%' }}></span>
                    <small style={{ color: '#555' }}>
                      <strong>Draft Mode Active:</strong> You can still draft and preview articles locally, but they won't save to the backend.
                    </small>
                  </div>
                </div>
              </div>
            </article>
          ) : (
            <div style={{ 
              background: '#f4fbf7', 
              border: '1px solid #c2ebd5', 
              padding: '12px 20px', 
              borderRadius: '8px', 
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#1b5e20'
            }}>
              <Check size={18} />
              <small style={{ fontSize: '13px', fontWeight: 600 }}>
                Supabase Connection Active: Dynamic publishing is fully online and responsive.
              </small>
            </div>
          )}

          {/* List of Current Articles */}
          <article className="admin-panel" style={{ marginBottom: '32px' }}>
            <div className="admin-panel-head">
              <span><FileText size={18} /> Current Compiled Articles</span>
              <small>{blogs.length} articles total</small>
            </div>
            
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Read Time</th>
                    <th>Origin Status</th>
                    <th>Date</th>
                    <th>CRM & Editor Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blogs.map((post) => {
                    const isDynamic = Boolean(post.id);
                    return (
                      <tr key={post.slug}>
                        <td>
                          <strong>{post.title}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginTop: '2px' }}>
                            /{post.slug}
                          </span>
                        </td>
                        <td>
                          <span className="card-category-badge" style={{ position: 'static', border: 'none', background: 'var(--blog-light-grey)', color: 'var(--blog-gold-dark)', fontSize: '10px' }}>
                            {post.category}
                          </span>
                        </td>
                        <td>{post.readTime || post.read_time}</td>
                        <td>
                          <span className={`admin-status ${isDynamic ? 'approved' : 'new'}`}>
                            {isDynamic ? 'Supabase Dynamic' : 'Static Editorial'}
                          </span>
                        </td>
                        <td>{post.date}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button 
                              type="button" 
                              onClick={() => handleEditPost(post)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px', background: 'var(--blog-light-grey)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '4px' }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteBlog(post)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '4px' }}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                            <a 
                              href={`/blog/${post.slug}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px', background: '#fff', border: '1px solid rgba(183,134,70,0.3)', color: 'var(--blog-gold-dark)', borderRadius: '4px', textDecoration: 'none' }}
                            >
                              <Eye size={12} /> Live
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>

          {/* Editor Anchor */}
          <div id="blog-editor-anchor" style={{ height: '1px' }}></div>

          {/* Interactive Split Editor Form & Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '32px', alignItems: 'flex-start' }}>
            
            {/* The Form Panel */}
            <article className="admin-panel" style={{ margin: 0 }}>
              <div className="admin-panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingPost ? '✍️ Edit B2B Blog Post' : '✍️ Compose B2B Blog Post'}
                </span>
                {editingPost && (
                  <span style={{ background: 'var(--blog-gold-dark)', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    EDITING DRAFT
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveBlog} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Title */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Article Title *</label>
                  <input 
                    type="text" 
                    value={formTitle} 
                    onChange={(e) => {
                      setFormTitle(e.target.value);
                      if (!formMetaTitle || formMetaTitle.startsWith(formTitle)) {
                        setFormMetaTitle(`${e.target.value} | Weave 365`);
                      }
                    }} 
                    placeholder="e.g. Pure Katan Silk vs. Organza: The Master Weaver's Guide"
                    required
                    style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                  />
                </div>

                {/* Slug Auto Generator */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>URL Slug *</label>
                    <input 
                      type="text" 
                      value={formSlug} 
                      onChange={(e) => setFormSlug(e.target.value)} 
                      placeholder="e.g. katan-silk-vs-organza"
                      required
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={autoSlugify}
                    style={{ padding: '10px 16px', background: 'var(--blog-light-grey)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                  >
                    🔗 Auto-Generate Slug
                  </button>
                </div>

                {/* Category & Tags Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Category *</label>
                    <select 
                      value={formCategory} 
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                    >
                      <option value="Business Strategy">Business Strategy</option>
                      <option value="Fabric Education">Fabric Education</option>
                      <option value="Buying Guides">Buying Guides</option>
                      <option value="Custom">Custom / Add New...</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Tags</label>
                    <input 
                      type="text" 
                      value={formTag} 
                      onChange={(e) => setFormTag(e.target.value)} 
                      placeholder="e.g. Saree Reseller, Wholesale Trends"
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Custom Category (only shown if Custom selected) */}
                {formCategory === 'Custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.3s ease' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Custom Category Name *</label>
                    <input 
                      type="text" 
                      value={formCustomCategory} 
                      onChange={(e) => setFormCustomCategory(e.target.value)} 
                      placeholder="e.g. Saree Care Guides"
                      required
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                )}

                {/* Author & Read Time Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Author Name</label>
                    <input 
                      type="text" 
                      value={formAuthor} 
                      onChange={(e) => setFormAuthor(e.target.value)} 
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Read Duration</label>
                    <input 
                      type="text" 
                      value={formReadTime} 
                      onChange={(e) => setFormReadTime(e.target.value)} 
                      placeholder="e.g. 8 Min Read"
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>

                {/* Cover Image Selector */}
                <div style={{ border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', background: '#fafafa' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blog-dark)', display: 'block', marginBottom: '12px' }}>
                    🖼️ Cover Image Selection
                  </label>
                  
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="imageInputType" 
                        checked={formImageInputType === 'file'} 
                        onChange={() => setFormImageInputType('file')} 
                      /> Upload File (Base64 saved)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="imageInputType" 
                        checked={formImageInputType === 'url'} 
                        onChange={() => setFormImageInputType('url')} 
                      /> Paste Image URL (e.g. Cloudinary)
                    </label>
                  </div>

                  {formImageInputType === 'file' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange}
                        style={{ fontSize: '13px' }}
                      />
                      <small style={{ color: 'var(--muted)', marginTop: '4px' }}>
                        Image file is compiled directly into Base64 format and stored in the database safely. Limit: 4MB.
                      </small>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={formImageUrl} 
                      onChange={(e) => setFormImageUrl(e.target.value)} 
                      placeholder="Paste your image URL here (e.g. res.cloudinary.com/...)"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px' }}
                    />
                  )}
                </div>

                {/* Intro Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Short Intro Description *</label>
                  <textarea 
                    value={formIntro} 
                    onChange={(e) => setFormIntro(e.target.value)} 
                    placeholder="Provide a 2-3 sentence executive summary that grabs search readers and highlights your core keywords."
                    required
                    rows="3"
                    style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', resize: 'vertical', lineHeight: '1.4' }}
                  />
                </div>

                {/* Article Body Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Main Content Body (Markdown Supported) *</label>
                    <span style={{ fontSize: '11px', color: 'var(--blog-gold-dark)', background: 'rgba(183,134,70,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                      Markdown Editor Active
                    </span>
                  </div>
                  <textarea 
                    value={formContent} 
                    onChange={(e) => setFormContent(e.target.value)} 
                    placeholder={`Write your dynamic article in Markdown here. Examples:
## Use H2 Headers for core topics
### Use H3 Headers for detail segments

Use - for Bullet points
Use 1. for Numbered lists

Use > for blockquotes
Use [Internal link label](/katan-silk-sarees) to link back to collections`}
                    required
                    rows="15"
                    style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', fontFamily: 'monospace', resize: 'vertical', lineHeight: '1.5' }}
                  />
                </div>

                {/* FAQ List Builder */}
                <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blog-dark)' }}>❓ B2B Schema FAQ Accordion Builder</label>
                    <button 
                      type="button" 
                      onClick={addFaqItem}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--blog-gold-dark)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                    >
                      <Plus size={14} /> Add FAQ Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {formFaqs.map((faq, index) => (
                      <div key={index} style={{ border: '1px solid var(--border)', padding: '14px', borderRadius: '6px', background: '#fff', position: 'relative' }}>
                        <button 
                          type="button" 
                          onClick={() => removeFaqItem(index)}
                          style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginRight: '24px' }}>
                          <input 
                            type="text" 
                            value={faq.q} 
                            onChange={(e) => updateFaqItem(index, 'q', e.target.value)} 
                            placeholder="Question (e.g. What is the Minimum Order Quantity?)"
                            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}
                          />
                          <textarea 
                            value={faq.a} 
                            onChange={(e) => updateFaqItem(index, 'a', e.target.value)} 
                            placeholder="Answer (e.g. Our MOQ is 12 pieces across colors...)"
                            rows="2"
                            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '13px', resize: 'vertical' }}
                          />
                        </div>
                      </div>
                    ))}

                    {formFaqs.length === 0 && (
                      <small style={{ color: 'var(--muted)', textAlign: 'center', display: 'block', padding: '10px' }}>
                        No FAQ items added yet. Schema accordion will not render.
                      </small>
                    )}
                  </div>
                </div>

                {/* SEO Metas Section */}
                <div style={{ border: '1px solid var(--border)', padding: '20px', borderRadius: '8px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blog-dark)' }}>🔍 Google SEO Meta Settings</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Meta Title Tag</label>
                    <input 
                      type="text" 
                      value={formMetaTitle} 
                      onChange={(e) => setFormMetaTitle(e.target.value)} 
                      placeholder="Title shown on search engine tabs (under 60 chars)"
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blog-dark)' }}>Meta Description</label>
                    <textarea 
                      value={formMetaDescription} 
                      onChange={(e) => setFormMetaDescription(e.target.value)} 
                      placeholder="Short snippet shown on Google search (under 155 chars)"
                      rows="3"
                      style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Save & Reset Actions */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={resetBlogForm}
                    style={{ padding: '12px 24px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
                  >
                    Cancel / Reset Form
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingBlog || (adminData.errors.blog_posts && formImageInputType === 'file' && !formImageBase64)}
                    style={{ 
                      padding: '12px 32px', 
                      background: 'var(--blog-gold-dark)', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontWeight: 700, 
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(128, 93, 49, 0.2)',
                      opacity: (isSubmittingBlog || (adminData.errors.blog_posts && formImageInputType === 'file' && !formImageBase64)) ? 0.6 : 1
                    }}
                  >
                    {isSubmittingBlog ? (
                      <>
                        <RefreshCw size={16} className="spin" /> Publishing...
                      </>
                    ) : (
                      <>
                        <Upload size={16} /> {editingPost ? 'Save Changes' : 'Publish Article'}
                      </>
                    )}
                  </button>
                </div>

              </form>
            </article>

            {/* The Live Previews Panel (Right sticky column) */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '120px' }}>
              
              {/* Google Search Card Preview */}
              <article className="admin-panel" style={{ margin: 0 }}>
                <div className="admin-panel-head">
                  <span>Google Search SERP Inspector</span>
                  <small>Real-time Google rendering</small>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontFamily: 'arial, sans-serif', fontSize: '14px', lineHeight: '1.2' }}>
                    <div style={{ fontSize: '12px', color: '#202124', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>https://www.weave365.in</span>
                      <span style={{ color: '#5f6368' }}>› blog › {formSlug || 'your-slug'}</span>
                    </div>
                    <h3 style={{ fontSize: '20px', color: '#1a0dab', margin: '0 0 4px', fontWeight: 'normal', textDecoration: 'none', cursor: 'pointer' }}>
                      {formMetaTitle || formTitle || 'Please Enter a Title...'}
                    </h3>
                    <p style={{ color: '#4d5156', margin: 0, fontSize: '14px', lineHeight: '1.58' }}>
                      <span style={{ color: '#70757a', marginRight: '4px' }}>
                        {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} —
                      </span>
                      {formMetaDescription || formIntro || 'Start typing your article summary to preview the search result description here...'}
                    </p>
                  </div>
                </div>
              </article>

              {/* Card Listing Grid Preview */}
              <article className="admin-panel" style={{ margin: 0 }}>
                <div className="admin-panel-head">
                  <span>Luxury Grid Card Preview</span>
                  <small>Storefront representation</small>
                </div>
                <div style={{ padding: '24px', background: '#fafafa' }}>
                  <article className="blog-card" style={{ width: '100%', pointerEvents: 'none', margin: '0 auto', border: '1px solid rgba(0, 0, 0, 0.05)', boxShadow: '0 5px 25px rgba(0, 0, 0, 0.02)' }}>
                    <div className="card-img-wrapper" style={{ height: '200px' }}>
                      {formImageInputType === 'file' && formImageBase64 ? (
                        <img src={formImageBase64} alt="Preview" />
                      ) : formImageUrl ? (
                        <img src={formImageUrl} alt="Preview" />
                      ) : (
                        <div style={{ height: '100%', background: 'linear-gradient(135deg, #181512 0%, #2a2219 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>
                          Select an image to preview
                        </div>
                      )}
                      <span className="card-category-badge">{formCategory === 'Custom' ? formCustomCategory || 'Category' : formCategory}</span>
                    </div>
                    <div className="card-info-pane" style={{ padding: '1.5rem' }}>
                      <div className="post-meta-strip" style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '11px' }}>
                          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="meta-divider" style={{ width: '3px', height: '3px' }}></span>
                        <span style={{ fontSize: '11px' }}>{formReadTime}</span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>{formTitle || 'Enter Article Title...'}</h3>
                      <p style={{ fontSize: '0.85rem', lineClamp: '3', margin: 0 }}>{formIntro || 'Enter article intro summary description...'}</p>
                      
                      <button 
                        type="button"
                        className="read-more-link"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '1.5rem', background: 'none', border: 'none', padding: 0 }}
                      >
                        Read Article →
                      </button>
                    </div>
                  </article>
                </div>
              </article>

            </aside>
          </div>

        </div>
      )}
    </section>
  );
}
