import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  AlertTriangle,
  Check,
  Upload,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { seoCategoryRoutes } from '../../config.js';
import { saveSupabasePageSeoSetting } from '../../productData.js';
import {
  normalizeSeoPath,
  mapSeoRow,
} from './AdminShared.jsx';

const pageSeoTableSql = `CREATE TABLE IF NOT EXISTS public.page_seo_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  path text UNIQUE NOT NULL,
  meta_title text NOT NULL,
  meta_description text NOT NULL,
  og_title text,
  og_description text,
  image_url text,
  canonical_path text,
  robots_index boolean DEFAULT true,
  robots_follow boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.page_seo_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "page seo public read" ON public.page_seo_settings;
CREATE POLICY "page seo public read" ON public.page_seo_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "page seo admin only" ON public.page_seo_settings;
CREATE POLICY "page seo admin only" ON public.page_seo_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());`;

const staticSeoDefaults = [
  {
    path: '/',
    label: 'Home',
    metaTitle: 'Wholesale Banarasi Sarees Online | Saree Supplier India | Weave 365',
    metaDescription: 'Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India. Explore silk, organza, katan and designer Banarasi collections.',
  },
  {
    path: '/about',
    label: 'About',
    metaTitle: 'About Weave 365 | Premium Banarasi Saree Wholesaler India',
    metaDescription: 'Discover Weave 365, India\'s leading Banarasi saree supplier. Learn about our heritage, meet our 200+ Varanasi artisan network, and explore our 5-step quality verification process.',
  },
  {
    path: '/blog',
    label: 'Blog',
    metaTitle: 'Wholesale Banarasi Saree Sourcing & Reselling Blog | Weave 365',
    metaDescription: 'Expert business guides, boutique scaling strategies, saree reselling tips, and fabric guides for wholesale Banarasi sarees and suits direct from Varanasi weavers.',
  },
  {
    path: '/bulk-inquiry',
    label: 'Bulk Inquiry',
    metaTitle: 'Banarasi Saree Wholesale Bulk Inquiry & Sourcing | Weave 365',
    metaDescription: 'Submit a bulk inquiry for premium Banarasi sarees and suits. We curate custom catalogs for boutiques, retailers, and exporters with flexible MOQ.',
  },
  {
    path: '/contact',
    label: 'Contact',
    metaTitle: 'Contact Us | Wholesale Banarasi Sarees Online | Weave 365',
    metaDescription: 'Get in touch with Weave 365, India\'s premier Banarasi saree supplier. Premium Banarasi sarees at wholesale prices for retailers, boutiques and resellers across India.',
  },
  {
    path: '/disclaimer',
    label: 'Disclaimer',
    metaTitle: 'Product Disclaimer & Heritage Weave Variations | Weave 365',
    metaDescription: 'Understand the handwoven integrity, color calibration, and textile variations of our premium Varanasi silk sarees. Essential reading for wholesale buyers.',
  },
  {
    path: '/new-arrivals',
    label: 'New Arrivals',
    metaTitle: 'New Arrivals: Latest Wholesale Banarasi Sarees & Suits | Weave 365',
    metaDescription: 'Explore our latest collection of handwoven pure silk Banarasi sarees, suits, and fabrics direct from Varanasi weavers. Updated weekly with fresh designs.',
  },
  {
    path: '/privacy-security',
    label: 'Privacy & Security',
    metaTitle: 'Data Privacy, GST Security & Transaction Safety | Weave 365',
    metaDescription: 'How we secure your wholesale trade records, verify business profiles, protect GST numbers, and encrypt commercial transactions with top payment gateways.',
  },
  {
    path: '/returns-cancellation',
    label: 'Returns & Cancellation',
    metaTitle: 'Wholesale Saree Returns & Cancellation Policies | Weave 365',
    metaDescription: 'Verify our transparent wholesale policies. Information on manufacturing defect exchanges, unboxing video requirements, and ready-to-ship cancellations.',
  },
  {
    path: '/shipping-delivery',
    label: 'Shipping & Delivery',
    metaTitle: 'Wholesale Saree Shipping & Worldwide Logistics | Weave 365',
    metaDescription: 'Direct Varanasi warehouse dispatch, express domestic delivery, international courier timelines (US, UK, UAE), and bulk freight cargo configurations.',
  },
  {
    path: '/sourcing-partners',
    label: 'Sourcing Partners',
    metaTitle: 'Sourcing Partners for Banarasi Sarees & Suits | Weave 365',
    metaDescription: 'Become a Banarasi saree and suit sourcing partner with Weave 365. Coordinate weavers, MOQ, wholesale pricing, catalog support, quality checks, stock updates, and dispatch.',
  },
  {
    path: '/terms-conditions',
    label: 'Terms & Conditions',
    metaTitle: 'Terms of Use, Wholesale MOQ & Trader Agreement | Weave 365',
    metaDescription: 'Review our commercial wholesale portal terms, minimum order quantity rules (3-saree minimum), payment gateway guidelines, and Varanasi jurisdiction.',
  },
  {
    path: '/sell-banarasi-sarees',
    label: 'Sell Banarasi Sarees',
    metaTitle: 'Sell Banarasi Sarees Online | Varanasi Sellers | Weave 365',
    metaDescription: 'Varanasi weavers and sellers: list Banarasi sarees & suits on Weave 365, reach B2B & B2C buyers across India and worldwide, with fulfilment support.',
  },

  {
    path: '/white-label',
    label: 'White Label Brands',
    metaTitle: 'White Label Banarasi Sarees & Suits Brand Program | Weave 365',
    metaDescription: 'Build a high-margin ethnic wear business with authentic Banarasi sarees and suits from Varanasi. Weave 365 provides direct loom sourcing, unbranded HD catalogues, white label support, and blind dropshipping to your customers.',
  },
  {
    path: '/catalogue',
    label: 'Catalogue',
    metaTitle: 'Wholesale Saree & Suit Catalogue | Weave 365',
    metaDescription: 'Browse our live Banarasi saree and suit wholesale catalogue. Sourced directly from Varanasi weavers for boutiques and retailers.',
  },
  {
    path: '/partner-program',
    label: 'Wholesale Partner Program',
    metaTitle: 'Wholesale & Reseller Partner Program | Weave 365',
    metaDescription: 'Grow your textile business with Weave 365 reseller tools and white-label catalogues. Join our network of successful saree resellers.',
  },
  {
    path: '/reviews',
    label: 'Reviews',
    metaTitle: 'Customer Reviews & Boutique Feedback | Weave 365',
    metaDescription: 'Read reviews and testimonials from registered boutique owners, retail partners, and saree resellers about their sourcing experience with Weave 365.',
  },
  {
    path: '/collaboration',
    label: 'Our Offerings',
    metaTitle: 'Sourcing Services & Weaver Network | Weave 365',
    metaDescription: 'Discover our complete range of offerings: custom catalog curation, quality checks, artisan direct pricing, and worldwide logistics for boutique owners.',
  },
  {
    path: '/affiliate-program',
    label: 'Affiliate Program',
    metaTitle: 'Saree Affiliate Program | Earn Commissions | Weave 365',
    metaDescription: 'Join the Weave 365 Affiliate Program. Refer boutique owners and retail store owners to our Banarasi saree platform and earn attractive commissions.',
  },
  {
    path: '/dropshipping',
    label: 'Dropshipping Program',
    metaTitle: 'Free Saree & Suit Dropshipping Program in India | Weave 365',
    metaDescription: 'Start your free Banarasi saree & suit dropshipping business in India. Sourced directly from Varanasi weavers with WhatsApp sharing, catalog downloads, and white-label website tools.',
  },
  {
    path: '/custom-woven',
    label: 'Custom Woven Sarees',
    metaTitle: 'Custom Woven Sarees & Custom Textile Weaving | Weave 365',
    metaDescription: 'Order custom woven Banarasi sarees, bespoke patterns, and customized fabric lengths direct from Varanasi master weavers. Minimum order quantities apply.',
  },
  {
    path: '/handloom-vs-powerloom-guide',
    label: 'Weave Comparison Guide',
    metaTitle: 'Handloom vs Semi Handloom vs Powerloom Guide | Weave 365',
    metaDescription: 'Understand the real difference between handloom, semi handloom, and powerloom sarees. Practical guide to selecting authentic handwoven Banarasi textiles.',
  },
  {
    path: '/partner',
    label: 'Partner Program (Short URL)',
    metaTitle: 'Wholesale & Reseller Partner Program | Weave 365',
    metaDescription: 'Join the Weave 365 partner network for wholesale saree sourcing, catalog sharing tools, custom pricing rules, and white-label dropshipping.',
  },
  {
    path: '/wholesale-catalogue',
    label: 'Wholesale Catalogue (Alias)',
    metaTitle: 'Wholesale Banarasi Saree & Suit Catalogue | Weave 365',
    metaDescription: 'Explore the complete wholesale catalog of authentic Banarasi sarees and suits direct from Varanasi weavers.',
  },
  {
    path: '/resell-sarees-online',
    label: 'Resell Sarees Online',
    metaTitle: 'Start Reselling Banarasi Sarees Online | Weave 365',
    metaDescription: 'Learn how to start a high-margin online saree reselling business with zero inventory. Access white-label catalogs, WhatsApp sharing, and blind dropshipping.',
  },
  {
    path: '/order-tracking',
    label: 'Order Tracking',
    metaTitle: 'Track Your Wholesale Saree Order | Weave 365',
    metaDescription: 'Track dispatch, shipment status, and live courier tracking for your wholesale Banarasi saree and suit orders from Varanasi.',
  },
  {
    path: '/checkout',
    label: 'Checkout',
    metaTitle: 'Secure Checkout | Wholesale Saree Orders | Weave 365',
    metaDescription: 'Complete your wholesale order safely with 256-bit SSL encryption. Supports instant UPI transfer, bank transfer, and direct dropship dispatch.',
  },
  {
    path: '/reseller-dashboard',
    label: 'Reseller Dashboard',
    metaTitle: 'Reseller Portal & Digital Storefront Tools | Weave 365',
    metaDescription: 'Manage your reseller catalog, customer leads, custom pricing markups, and dropship dispatches from your central Weave 365 dashboard.',
  },
];

const categorySeoDefaults = Object.entries(seoCategoryRoutes || {}).map(([slug, categoryName]) => {
  const pluralName = categoryName === 'Under 999' ? categoryName : (categoryName.endsWith('s') ? categoryName : `${categoryName}s`);
  return {
    path: `/${slug}`,
    label: pluralName,
    metaTitle: `Wholesale Banarasi ${pluralName} Online | Weave 365`,
    metaDescription: `Buy handwoven premium Banarasi ${pluralName.toLowerCase()} at wholesale prices direct from Varanasi weavers. High quality, verified silk collections.`,
  };
});

export default function SeoSettings({
  adminData,
  loadAdminData,
}) {
  const [pageSeoId, setPageSeoId] = useState(null);
  const [pageSeoPath, setPageSeoPath] = useState('/');
  const [pageSeoMetaTitle, setPageSeoMetaTitle] = useState('');
  const [pageSeoMetaDescription, setPageSeoMetaDescription] = useState('');
  const [pageSeoOgTitle, setPageSeoOgTitle] = useState('');
  const [pageSeoOgDescription, setPageSeoOgDescription] = useState('');
  const [pageSeoImageUrl, setPageSeoImageUrl] = useState('');
  const [pageSeoCanonicalPath, setPageSeoCanonicalPath] = useState('/');
  const [pageSeoRobotsIndex, setPageSeoRobotsIndex] = useState(true);
  const [pageSeoRobotsFollow, setPageSeoRobotsFollow] = useState(true);
  const [isSubmittingPageSeo, setIsSubmittingPageSeo] = useState(false);
  const [isSeoSelectOpen, setIsSeoSelectOpen] = useState(false);
  const seoSelectRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (seoSelectRef.current && !seoSelectRef.current.contains(event.target)) {
        setIsSeoSelectOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const pageSeoRows = useMemo(
    () => (adminData.optional.page_seo_settings || []).map(mapSeoRow),
    [adminData.optional.page_seo_settings],
  );

  const defaultSeoPageOptions = useMemo(() => {
    return [
      ...staticSeoDefaults,
      ...categorySeoDefaults,
    ].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const pageSeoOptions = useMemo(() => {
    const options = new Map(defaultSeoPageOptions.map((item) => [normalizeSeoPath(item.path), item]));
    return Array.from(options.values()).sort((a, b) => {
      if (a.path === '/') return -1;
      if (b.path === '/') return 1;
      return (a.label || '').localeCompare(b.label || '');
    });
  }, [defaultSeoPageOptions]);

  const selectedDefaultSeo = useMemo(() => {
    const normalized = normalizeSeoPath(pageSeoPath);
    return pageSeoOptions.find((page) => normalizeSeoPath(page.path) === normalized) || null;
  }, [pageSeoOptions, pageSeoPath]);

  const selectedSavedSeo = useMemo(() => {
    const normalized = normalizeSeoPath(pageSeoPath);
    return pageSeoRows.find((row) => normalizeSeoPath(row.path) === normalized) || null;
  }, [pageSeoRows, pageSeoPath]);

  const currentSeoMeta = useMemo(() => ({
    title: selectedSavedSeo?.metaTitle || selectedDefaultSeo?.metaTitle || '',
    description: selectedSavedSeo?.metaDescription || selectedDefaultSeo?.metaDescription || '',
    source: selectedSavedSeo ? 'Supabase override' : selectedDefaultSeo?.metaTitle ? 'Code default' : 'Not found',
  }), [selectedDefaultSeo, selectedSavedSeo]);

  function resetPageSeoForm(nextPath = '/') {
    const normalizedPath = normalizeSeoPath(nextPath);
    setPageSeoId(null);
    setPageSeoPath(normalizedPath);
    setPageSeoMetaTitle('');
    setPageSeoMetaDescription('');
    setPageSeoOgTitle('');
    setPageSeoOgDescription('');
    setPageSeoImageUrl('');
    setPageSeoCanonicalPath(normalizedPath);
    setPageSeoRobotsIndex(true);
    setPageSeoRobotsFollow(true);
  }

  function loadPageSeoForm(path) {
    const normalizedPath = normalizeSeoPath(path);
    const existing = pageSeoRows.find((row) => normalizeSeoPath(row.path) === normalizedPath);
    if (!existing) {
      resetPageSeoForm(normalizedPath);
      return;
    }

    setPageSeoId(existing.id || null);
    setPageSeoPath(existing.path);
    setPageSeoMetaTitle(existing.metaTitle || '');
    setPageSeoMetaDescription(existing.metaDescription || '');
    setPageSeoOgTitle(existing.ogTitle || '');
    setPageSeoOgDescription(existing.ogDescription || '');
    setPageSeoImageUrl(existing.imageUrl || '');
    setPageSeoCanonicalPath(existing.canonicalPath || existing.path);
    setPageSeoRobotsIndex(existing.robotsIndex !== false);
    setPageSeoRobotsFollow(existing.robotsFollow !== false);
  }

  async function handleSavePageSeo(e) {
    e.preventDefault();
    const normalizedPath = normalizeSeoPath(pageSeoPath);
    if (!pageSeoMetaTitle.trim() || !pageSeoMetaDescription.trim()) {
      alert('Meta title and meta description are required for this page.');
      return;
    }

    setIsSubmittingPageSeo(true);
    try {
      const savedRow = await saveSupabasePageSeoSetting({
        id: pageSeoId,
        path: normalizedPath,
        metaTitle: pageSeoMetaTitle.trim(),
        metaDescription: pageSeoMetaDescription.trim(),
        ogTitle: pageSeoOgTitle.trim() || pageSeoMetaTitle.trim(),
        ogDescription: pageSeoOgDescription.trim() || pageSeoMetaDescription.trim(),
        imageUrl: pageSeoImageUrl.trim(),
        canonicalPath: normalizedPath,
        robotsIndex: pageSeoRobotsIndex,
        robotsFollow: pageSeoRobotsFollow,
      });
      const saved = mapSeoRow(savedRow);
      setPageSeoId(saved.id || null);
      alert('Page SEO settings saved successfully!');
      await loadAdminData();
    } catch (err) {
      alert('Failed to save page SEO settings: ' + err.message);
    } finally {
      setIsSubmittingPageSeo(false);
    }
  }

  return (
    <div className="admin-blog-manager-tab">
      {adminData.errors.page_seo_settings ? (
        <article className="admin-blog-setup-alert">
          <div className="admin-blog-setup-flex">
            <div className="admin-blog-setup-icon-wrap">
              <AlertTriangle size={22} />
            </div>
            <div className="admin-blog-setup-content">
              <h3 className="admin-blog-setup-title">
                Supabase Page SEO Table Required
              </h3>
              <p className="admin-blog-setup-desc">
                Create the <strong>`page_seo_settings`</strong> table so page titles and descriptions can be managed from this admin panel and rendered by Next.js metadata.
              </p>
              <div className="admin-pos-relative">
                <pre className="admin-blog-setup-pre">{pageSeoTableSql}</pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pageSeoTableSql);
                    alert('SQL copied to clipboard!');
                  }}
                  className="admin-blog-setup-copy-btn"
                >
                  Copy SQL
                </button>
              </div>
            </div>
          </div>
        </article>
      ) : (
        <div className="admin-blog-setup-success">
          <Check size={16} />
          <small className="admin-blog-setup-success-text">
            Supabase Connection Active: page metadata overrides are available to server-rendered Google crawlers.
          </small>
        </div>
      )}

      <div className="admin-editor-split-layout">
        <article className="admin-panel admin-m0">
          <div className="admin-panel-head admin-panel-head-border">
            <span className="admin-editor-title">
              Page Meta Title and Description
            </span>
            <small>{pageSeoRows.length} saved overrides</small>
          </div>

          <form onSubmit={handleSavePageSeo} className="admin-editor-form">
            <div className="admin-field-container admin-seo-select-container" ref={seoSelectRef}>
              <label className="admin-field-label">Choose Page</label>
              <div className="admin-custom-select-wrapper">
                <button
                  type="button"
                  className="admin-custom-select-trigger"
                  onClick={() => setIsSeoSelectOpen(prev => !prev)}
                >
                  <span className="admin-custom-select-value">
                    {selectedDefaultSeo
                      ? selectedDefaultSeo.label
                      : pageSeoPath || 'Select a page...'}
                  </span>
                  <ChevronDown size={16} className={`admin-custom-select-icon ${isSeoSelectOpen ? 'open' : ''}`} />
                </button>
                {isSeoSelectOpen && (
                  <div className="admin-custom-select-dropdown">
                    {pageSeoOptions.map((page) => {
                      const isActive = normalizeSeoPath(pageSeoPath) === normalizeSeoPath(page.path);
                      return (
                        <button
                          type="button"
                          key={page.path}
                          className={`admin-custom-select-option ${isActive ? 'active' : ''}`}
                          onClick={() => {
                            loadPageSeoForm(page.path);
                            setIsSeoSelectOpen(false);
                          }}
                        >
                          {page.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>


            <div className="admin-current-meta-box">
              <div className="admin-current-meta-head">
                <div>
                  <span className="admin-current-meta-kicker">Current Meta</span>
                  <strong>{currentSeoMeta.source}</strong>
                </div>
                {(currentSeoMeta.title || currentSeoMeta.description) && (
                  <button
                    type="button"
                    className="admin-current-meta-copy"
                    onClick={() => {
                      setPageSeoMetaTitle(currentSeoMeta.title);
                      setPageSeoMetaDescription(currentSeoMeta.description);
                      if (!pageSeoOgTitle) setPageSeoOgTitle(currentSeoMeta.title);
                      if (!pageSeoOgDescription) setPageSeoOgDescription(currentSeoMeta.description);
                    }}
                  >
                    <Copy size={13} /> Use Values
                  </button>
                )}
              </div>
              {currentSeoMeta.title || currentSeoMeta.description ? (
                <div className="admin-current-meta-grid">
                  <div>
                    <small>Title</small>
                    <p>{currentSeoMeta.title}</p>
                  </div>
                  <div>
                    <small>Description</small>
                    <p>{currentSeoMeta.description}</p>
                  </div>
                </div>
              ) : (
                <p className="admin-current-meta-empty">
                  No existing metadata was found for this custom path yet.
                </p>
              )}
            </div>

            <div className="admin-seo-meta-section">
              <label className="admin-faq-title">Google SEO Meta Settings</label>

              <div className="admin-field-container">
                <div className="admin-flex-between">
                  <label className="admin-field-label">Meta Title Tag *</label>
                  <small className={pageSeoMetaTitle.length > 60 ? 'admin-seo-count-warn' : 'admin-doc-card-muted'}>
                    {pageSeoMetaTitle.length}/60
                  </small>
                </div>
                <input
                  type="text"
                  value={pageSeoMetaTitle}
                  onChange={(e) => {
                    setPageSeoMetaTitle(e.target.value);
                    if (!pageSeoOgTitle || pageSeoOgTitle === pageSeoMetaTitle) {
                      setPageSeoOgTitle(e.target.value);
                    }
                  }}
                  placeholder="Wholesale Banarasi Sarees Online | Weave 365"
                  required
                  className="admin-seo-input"
                />
              </div>

              <div className="admin-field-container">
                <div className="admin-flex-between">
                  <label className="admin-field-label">Meta Description *</label>
                  <small className={pageSeoMetaDescription.length > 155 ? 'admin-seo-count-warn' : 'admin-doc-card-muted'}>
                    {pageSeoMetaDescription.length}/155
                  </small>
                </div>
                <textarea
                  value={pageSeoMetaDescription}
                  onChange={(e) => {
                    setPageSeoMetaDescription(e.target.value);
                    if (!pageSeoOgDescription || pageSeoOgDescription === pageSeoMetaDescription) {
                      setPageSeoOgDescription(e.target.value);
                    }
                  }}
                  placeholder="Short snippet shown on Google search results."
                  rows="3"
                  required
                  className="admin-seo-textarea"
                />
              </div>
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Open Graph Title</label>
              <input
                type="text"
                value={pageSeoOgTitle}
                onChange={(e) => setPageSeoOgTitle(e.target.value)}
                placeholder="Defaults to meta title"
                className="admin-field-input"
              />
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Open Graph Description</label>
              <textarea
                value={pageSeoOgDescription}
                onChange={(e) => setPageSeoOgDescription(e.target.value)}
                placeholder="Defaults to meta description"
                rows="2"
                className="admin-field-textarea"
              />
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Social Preview Image URL</label>
              <input
                type="text"
                value={pageSeoImageUrl}
                onChange={(e) => setPageSeoImageUrl(e.target.value)}
                placeholder="https://..."
                className="admin-field-input"
              />
            </div>

            <div className="admin-robots-row">
              <label className="admin-radio-label">
                <input
                  type="checkbox"
                  checked={pageSeoRobotsIndex}
                  onChange={(e) => setPageSeoRobotsIndex(e.target.checked)}
                />
                Index page
              </label>
              <label className="admin-radio-label">
                <input
                  type="checkbox"
                  checked={pageSeoRobotsFollow}
                  onChange={(e) => setPageSeoRobotsFollow(e.target.checked)}
                />
                Follow links
              </label>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                onClick={() => resetPageSeoForm(pageSeoPath)}
                className="admin-btn-cancel"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmittingPageSeo || Boolean(adminData.errors.page_seo_settings)}
                className="admin-btn-publish"
              >
                {isSubmittingPageSeo ? (
                  <><RefreshCw size={16} className="spin" /> Saving...</>
                ) : (
                  <><Upload size={16} /> Save Page SEO</>
                )}
              </button>
            </div>
          </form>
        </article>

        <aside className="admin-editor-sticky-aside">
          <article className="admin-panel admin-m0">
            <div className="admin-panel-head" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'nowrap' }}>
              <span style={{ fontWeight: '600', fontSize: '15px', whiteSpace: 'nowrap' }}>SERP Preview</span>
              <small style={{ whiteSpace: 'nowrap', color: '#6b7280', margin: 0 }}>Real-time rendering</small>
            </div>
            <div className="admin-p20">
              <div className="admin-serp-preview">
                <div className="admin-serp-url-row">
                  <span>https://www.weave365.com</span>
                  <span className="admin-serp-slug">
                    {normalizeSeoPath(pageSeoPath) === '/' ? '' : normalizeSeoPath(pageSeoPath).replace(/\//g, ' > ')}
                  </span>
                </div>
                <h3 className="admin-serp-title">
                  {pageSeoMetaTitle || currentSeoMeta.title || 'Enter a page title...'}
                </h3>
                <p className="admin-serp-desc">
                  <span className="admin-serp-date">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} -
                  </span>
                  {pageSeoMetaDescription || currentSeoMeta.description || 'Start typing a page description...'}
                </p>
              </div>
            </div>
          </article>

          <article className="admin-panel admin-m0">
            <div className="admin-panel-head">
              <span>Saved Page Overrides</span>
              <small>{pageSeoRows.length} rows</small>
            </div>
            <div className="admin-seo-page-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {pageSeoRows.map((row) => (
                <button
                  type="button"
                  key={row.path}
                  onClick={() => loadPageSeoForm(row.path)}
                  className="admin-seo-page-row"
                >
                  <strong>{row.path}</strong>
                  <span>{row.metaTitle}</span>
                </button>
              ))}
              {pageSeoRows.length === 0 && (
                <p className="admin-muted admin-p20">No saved page metadata overrides yet.</p>
              )}
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
