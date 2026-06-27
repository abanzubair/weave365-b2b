import { useState } from 'react';
import {
  Upload,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';
import { saveSupabaseLandingPage, deleteSupabaseLandingPage, fetchSupabaseLandingPages } from '../../productData.js';

export default function PageBuilder({
  landingPages = [],
  setLandingPages,
  adminData,
}) {
  const [selectedBuilderSlug, setSelectedBuilderSlug] = useState('new');
  const [builderPageId, setBuilderPageId] = useState(null);
  const [builderSlug, setBuilderSlug] = useState('');
  const [builderMetaTitle, setBuilderMetaTitle] = useState('');
  const [builderMetaDescription, setBuilderMetaDescription] = useState('');
  const [builderOgTitle, setBuilderOgTitle] = useState('');
  const [builderOgDescription, setBuilderOgDescription] = useState('');
  const [builderImageUrl, setBuilderImageUrl] = useState('');
  const [builderRobotsIndex, setBuilderRobotsIndex] = useState(true);
  const [builderRobotsFollow, setBuilderRobotsFollow] = useState(true);
  const [builderH1, setBuilderH1] = useState('');
  const [builderIntroTitle, setBuilderIntroTitle] = useState('');
  const [builderIntroText, setBuilderIntroText] = useState('');
  const [builderBuyerGuideTitle, setBuilderBuyerGuideTitle] = useState('');
  const [builderBuyerGuideSections, setBuilderBuyerGuideSections] = useState([]);
  const [builderFaqs, setBuilderFaqs] = useState([]);
  const [builderFilter, setBuilderFilter] = useState({ category: '', fabric: '', work: '', search: '' });
  const [isSavingBuilder, setIsSavingBuilder] = useState(false);
  const [isDeletingBuilder, setIsDeletingBuilder] = useState(false);

  // Builder Methods
  function loadBuilderForm(page) {
    if (!page) {
      setBuilderPageId(null);
      setBuilderSlug('');
      setBuilderMetaTitle('');
      setBuilderMetaDescription('');
      setBuilderOgTitle('');
      setBuilderOgDescription('');
      setBuilderImageUrl('');
      setBuilderRobotsIndex(true);
      setBuilderRobotsFollow(true);
      setBuilderH1('');
      setBuilderIntroTitle('');
      setBuilderIntroText('');
      setBuilderBuyerGuideTitle('');
      setBuilderBuyerGuideSections([]);
      setBuilderFaqs([]);
      setBuilderFilter({ category: '', fabric: '', work: '', search: '' });
      setSelectedBuilderSlug('new');
      return;
    }
    setBuilderPageId(page.id || null);
    setBuilderSlug(page.slug || '');
    setBuilderMetaTitle(page.metaTitle || '');
    setBuilderMetaDescription(page.metaDescription || '');
    setBuilderOgTitle(page.ogTitle || '');
    setBuilderOgDescription(page.ogDescription || '');
    setBuilderImageUrl(page.imageUrl || '');
    setBuilderRobotsIndex(page.robotsIndex !== false);
    setBuilderRobotsFollow(page.robotsFollow !== false);
    setBuilderH1(page.h1 || '');
    setBuilderIntroTitle(page.introTitle || '');
    setBuilderIntroText(page.introText || '');
    setBuilderBuyerGuideTitle(page.buyerGuideTitle || '');
    setBuilderBuyerGuideSections(page.buyerGuideSections || []);
    setBuilderFaqs(page.faqs || []);
    setBuilderFilter({
      category: page.filter?.category || '',
      fabric: page.filter?.fabric || '',
      work: page.filter?.work || '',
      search: page.filter?.search || '',
    });
    setSelectedBuilderSlug(page.slug);
  }

  const handleAddGuideSection = () => {
    setBuilderBuyerGuideSections([...builderBuyerGuideSections, { title: '', content: '' }]);
  };
  const handleRemoveGuideSection = (index) => {
    setBuilderBuyerGuideSections(builderBuyerGuideSections.filter((_, i) => i !== index));
  };
  const handleGuideSectionChange = (index, field, value) => {
    setBuilderBuyerGuideSections(builderBuyerGuideSections.map((item, i) => {
      if (i === index) return { ...item, [field]: value };
      return item;
    }));
  };

  const handleAddFaq = () => {
    setBuilderFaqs([...builderFaqs, { q: '', a: '' }]);
  };
  const handleRemoveFaq = (index) => {
    setBuilderFaqs(builderFaqs.filter((_, i) => i !== index));
  };
  const handleFaqChange = (index, field, value) => {
    setBuilderFaqs(builderFaqs.map((item, i) => {
      if (i === index) return { ...item, [field]: value };
      return item;
    }));
  };

  async function handleSaveBuilder(e) {
    e.preventDefault();
    if (!builderSlug.trim()) {
      alert('Page route slug is required.');
      return;
    }
    const cleanSlug = builderSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    if (!builderMetaTitle.trim() || !builderMetaDescription.trim() || !builderH1.trim()) {
      alert('Meta title, meta description, and page H1 Header are required.');
      return;
    }

    setIsSavingBuilder(true);
    try {
      await saveSupabaseLandingPage({
        id: builderPageId,
        slug: cleanSlug,
        metaTitle: builderMetaTitle.trim(),
        metaDescription: builderMetaDescription.trim(),
        ogTitle: builderOgTitle.trim() || builderMetaTitle.trim(),
        ogDescription: builderOgDescription.trim() || builderMetaDescription.trim(),
        imageUrl: builderImageUrl.trim(),
        canonicalPath: '/' + cleanSlug,
        robotsIndex: builderRobotsIndex,
        robotsFollow: builderRobotsFollow,
        h1: builderH1.trim(),
        introTitle: builderIntroTitle.trim(),
        introText: builderIntroText.trim(),
        buyerGuideTitle: builderBuyerGuideTitle.trim(),
        buyerGuideSections: builderBuyerGuideSections.filter(s => s.title.trim() || s.content.trim()),
        faqs: builderFaqs.filter(f => f.q.trim() || f.a.trim()),
        filter: {
          category: builderFilter.category.trim() || undefined,
          fabric: builderFilter.fabric.trim() || undefined,
          work: builderFilter.work.trim() || undefined,
          search: builderFilter.search.trim() || undefined,
        }
      });
      alert('Custom dynamic page saved successfully!');
      
      const updatedList = await fetchSupabaseLandingPages();
      setLandingPages(updatedList);
      loadBuilderForm(updatedList.find(p => p.slug === cleanSlug));
    } catch (err) {
      alert('Failed to save landing page: ' + err.message);
    } finally {
      setIsSavingBuilder(false);
    }
  }

  async function handleDeleteBuilder() {
    if (!builderSlug) return;
    if (!window.confirm(`Are you sure you want to delete the dynamic page "/${builderSlug}"? All layout contents will be lost forever.`)) {
      return;
    }

    setIsDeletingBuilder(true);
    try {
      await deleteSupabaseLandingPage(builderSlug);
      alert('Page deleted successfully!');
      
      const updatedList = await fetchSupabaseLandingPages();
      setLandingPages(updatedList);
      loadBuilderForm(null);
    } catch (err) {
      alert('Failed to delete landing page: ' + err.message);
    } finally {
      setIsDeletingBuilder(false);
    }
  }

  return (
    <div className="admin-editor-split-layout">
      <article className="admin-panel admin-m0">
        <div className="admin-panel-head admin-panel-head-border">
          <span className="admin-editor-title">
            Custom Page Configuration
          </span>
          <small>{landingPages.length} active collection pages</small>
        </div>

        <form onSubmit={handleSaveBuilder} className="admin-editor-form">
          {/* Select or Create Custom Landing Page */}
          <div className="admin-field-container">
            <label className="admin-field-label">Custom Landing Pages</label>
            <select
              value={selectedBuilderSlug}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'new') {
                  loadBuilderForm(null);
                } else {
                  const match = landingPages.find(p => p.slug === val);
                  loadBuilderForm(match);
                }
              }}
              className="admin-field-input"
              style={{ padding: '0.6rem 0.8rem', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="new">+ Create New Custom Landing Page</option>
              {landingPages.map(page => (
                <option key={page.slug} value={page.slug}>
                  {page.h1 || page.slug} (/{page.slug})
                </option>
              ))}
            </select>
          </div>

          {/* URL Slug Field */}
          <div className="admin-field-container">
            <label className="admin-field-label">URL Slug *</label>
            <input
              type="text"
              value={builderSlug}
              onChange={(e) => setBuilderSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''))}
              placeholder="chanderi-suit-fabrics"
              required
              disabled={Boolean(builderPageId)}
              className="admin-field-input"
            />
            <small className="admin-doc-card-muted">Unique route segment (letters, numbers, and dashes). E.g. /katan-silk-sarees to katan-silk-sarees</small>
          </div>

          {/* Google Metadata Configuration */}
          <div className="admin-seo-meta-section">
            <label className="admin-faq-title">Google SEO Settings</label>
            
            <div className="admin-field-container">
              <div className="admin-flex-between">
                <label className="admin-field-label">Meta Title Tag *</label>
                <small className={builderMetaTitle.length > 60 ? 'admin-seo-count-warn' : 'admin-doc-card-muted'}>
                  {builderMetaTitle.length}/60
                </small>
              </div>
              <input
                type="text"
                value={builderMetaTitle}
                onChange={(e) => {
                  setBuilderMetaTitle(e.target.value);
                  if (!builderOgTitle || builderOgTitle === builderMetaTitle) {
                    setBuilderOgTitle(e.target.value);
                  }
                }}
                placeholder="Chanderi Silk Suit Fabrics Wholesale | Weave 365"
                required
                className="admin-seo-input"
              />
            </div>

            <div className="admin-field-container">
              <div className="admin-flex-between">
                <label className="admin-field-label">Meta Description *</label>
                <small className={builderMetaDescription.length > 155 ? 'admin-seo-count-warn' : 'admin-doc-card-muted'}>
                  {builderMetaDescription.length}/155
                </small>
              </div>
              <textarea
                value={builderMetaDescription}
                onChange={(e) => {
                  setBuilderMetaDescription(e.target.value);
                  if (!builderOgDescription || builderOgDescription === builderMetaDescription) {
                    setBuilderOgDescription(e.target.value);
                  }
                }}
                placeholder="Search snippet to summarize collection contents."
                rows="2"
                required
                className="admin-seo-textarea"
              />
            </div>
          </div>

          {/* Page Contents - H1, Intro */}
          <div className="admin-seo-meta-section">
            <label className="admin-faq-title">Page Headers & Narrative</label>
            
            <div className="admin-field-container">
              <label className="admin-field-label">H1 Page Heading *</label>
              <input
                type="text"
                value={builderH1}
                onChange={(e) => setBuilderH1(e.target.value)}
                placeholder="Wholesale Chanderi Suit Fabrics Direct from Varanasi Weavers"
                required
                className="admin-field-input"
              />
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Intro Subtitle / Tagline</label>
              <input
                type="text"
                value={builderIntroTitle}
                onChange={(e) => setBuilderIntroTitle(e.target.value)}
                placeholder="Premium Handwoven Traditional Chanderi Silk Suit Material"
                className="admin-field-input"
              />
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Intro Narrative Text</label>
              <textarea
                value={builderIntroText}
                onChange={(e) => setBuilderIntroText(e.target.value)}
                placeholder="Write 1-2 paragraphs of storytelling copy. Support blank lines to split paragraphs."
                rows="6"
                className="admin-field-textarea"
              />
            </div>
          </div>

          {/* Dynamic Filtering Rules */}
          <div className="admin-seo-meta-section">
            <label className="admin-faq-title">Inventory Filtering Rules</label>
            <p className="admin-doc-card-muted" style={{ margin: '0 0 1rem' }}>Assign which products dynamically populate this collection grid based on their properties.</p>
            
            <div className="admin-field-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="admin-field-label">Filter: Category</label>
                <input
                  type="text"
                  value={builderFilter.category}
                  onChange={(e) => setBuilderFilter({ ...builderFilter, category: e.target.value })}
                  placeholder="e.g. Saree, Suit, Fabric"
                  className="admin-field-input"
                />
              </div>
              <div>
                <label className="admin-field-label">Filter: Fabric</label>
                <input
                  type="text"
                  value={builderFilter.fabric}
                  onChange={(e) => setBuilderFilter({ ...builderFilter, fabric: e.target.value })}
                  placeholder="e.g. Chanderi, Katan Silk"
                  className="admin-field-input"
                />
              </div>
            </div>

            <div className="admin-field-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: 0 }}>
              <div>
                <label className="admin-field-label">Filter: Work Type</label>
                <input
                  type="text"
                  value={builderFilter.work}
                  onChange={(e) => setBuilderFilter({ ...builderFilter, work: e.target.value })}
                  placeholder="e.g. Bridal, Meenakari"
                  className="admin-field-input"
                />
              </div>
              <div>
                <label className="admin-field-label">Filter: Search Keyword</label>
                <input
                  type="text"
                  value={builderFilter.search}
                  onChange={(e) => setBuilderFilter({ ...builderFilter, search: e.target.value })}
                  placeholder="e.g. heavy, gold, zari"
                  className="admin-field-input"
                />
              </div>
            </div>
          </div>

          {/* Sourcing Guide Editor */}
          <div className="admin-seo-meta-section">
            <label className="admin-faq-title">Sourcing & Sizing Guide Content</label>
            
            <div className="admin-field-container">
              <label className="admin-field-label">Buyer Guide Title</label>
              <input
                type="text"
                value={builderBuyerGuideTitle}
                onChange={(e) => setBuilderBuyerGuideTitle(e.target.value)}
                placeholder="Ultimate B2B Sourcing Guide for Chanderi Suit Material"
                className="admin-field-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
              <label className="admin-field-label" style={{ fontWeight: '600', color: '#111827', margin: 0 }}>Sourcing Guide Steps</label>
              <button type="button" onClick={handleAddGuideSection} className="admin-btn-secondary-outline">
                <Plus size={14} /> Add Step
              </button>
            </div>

            {builderBuyerGuideSections.map((section, idx) => (
              <div key={idx} style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', backgroundColor: '#f9fafb', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => handleRemoveGuideSection(idx)}
                  style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Trash2 size={13} /> Remove
                </button>
                
                <div className="admin-field-container">
                  <label className="admin-field-label">Step {idx + 1} Title</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleGuideSectionChange(idx, 'title', e.target.value)}
                    placeholder="e.g. 1. Technical Fabric Structure"
                    className="admin-field-input"
                  />
                </div>
                <div className="admin-field-container" style={{ margin: 0 }}>
                  <label className="admin-field-label">Step Description</label>
                  <textarea
                    value={section.content}
                    onChange={(e) => handleGuideSectionChange(idx, 'content', e.target.value)}
                    placeholder="Guide card content..."
                    rows="3"
                    className="admin-field-textarea"
                  />
                </div>
              </div>
            ))}
            {builderBuyerGuideSections.length === 0 && (
              <p className="admin-muted admin-p20" style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '4px' }}>No guide steps added yet.</p>
            )}
          </div>

          {/* FAQ List Editor */}
          <div className="admin-seo-meta-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label className="admin-faq-title" style={{ margin: 0 }}>FAQ Accordions</label>
              <button type="button" onClick={handleAddFaq} className="admin-btn-secondary-outline">
                <Plus size={14} /> Add FAQ
              </button>
            </div>

            {builderFaqs.map((faq, idx) => (
              <div key={idx} style={{ border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', backgroundColor: '#f9fafb', position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(idx)}
                  style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Trash2 size={13} /> Remove
                </button>
                
                <div className="admin-field-container">
                  <label className="admin-field-label">Question {idx + 1}</label>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={(e) => handleFaqChange(idx, 'q', e.target.value)}
                    placeholder="What is the MOQ for Chanderi Suit sets?"
                    className="admin-field-input"
                  />
                </div>
                <div className="admin-field-container" style={{ margin: 0 }}>
                  <label className="admin-field-label">Answer</label>
                  <textarea
                    value={faq.a}
                    onChange={(e) => handleFaqChange(idx, 'a', e.target.value)}
                    placeholder="FAQ answer details..."
                    rows="3"
                    className="admin-field-textarea"
                  />
                </div>
              </div>
            ))}
            {builderFaqs.length === 0 && (
              <p className="admin-muted admin-p20" style={{ textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '4px' }}>No FAQ accordions added yet.</p>
            )}
          </div>

          {/* Extra SEO fields (social previews) */}
          <div className="admin-seo-meta-section">
            <label className="admin-faq-title">Social Sharing Preview Settings (Optional)</label>
            
            <div className="admin-field-container">
              <label className="admin-field-label">Open Graph Social Title</label>
              <input
                type="text"
                value={builderOgTitle}
                onChange={(e) => setBuilderOgTitle(e.target.value)}
                placeholder="Defaults to meta title"
                className="admin-field-input"
              />
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Open Graph Social Description</label>
              <textarea
                value={builderOgDescription}
                onChange={(e) => setBuilderOgDescription(e.target.value)}
                placeholder="Defaults to meta description"
                rows="2"
                className="admin-field-textarea"
              />
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Preview Image URL (OG Image)</label>
              <input
                type="text"
                value={builderImageUrl}
                onChange={(e) => setBuilderImageUrl(e.target.value)}
                placeholder="e.g. https://assets.weave365.com/banner.jpg"
                className="admin-field-input"
              />
            </div>

            <div className="admin-robots-row">
              <label className="admin-radio-label">
                <input
                  type="checkbox"
                  checked={builderRobotsIndex}
                  onChange={(e) => setBuilderRobotsIndex(e.target.checked)}
                />
                Index page
              </label>
              <label className="admin-radio-label">
                <input
                  type="checkbox"
                  checked={builderRobotsFollow}
                  onChange={(e) => setBuilderRobotsFollow(e.target.checked)}
                />
                Follow links
              </label>
            </div>
          </div>

          <div className="admin-form-actions" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            {builderPageId ? (
              <button
                type="button"
                onClick={handleDeleteBuilder}
                disabled={isDeletingBuilder}
                className="admin-btn-cancel"
                style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
              >
                {isDeletingBuilder ? 'Deleting...' : 'Delete Page'}
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => loadBuilderForm(null)}
                className="admin-btn-cancel"
              >
                Clear / Reset
              </button>
              <button
                type="submit"
                disabled={isSavingBuilder}
                className="admin-btn-publish"
              >
                {isSavingBuilder ? (
                  <><RefreshCw size={16} className="spin" /> Saving...</>
                ) : (
                  <><Upload size={16} /> Save Dynamic Page</>
                )}
              </button>
            </div>
          </div>
        </form>
      </article>

      {/* Right Preview Column */}
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
                  {builderSlug ? ` > ${builderSlug}` : ''}
                </span>
              </div>
              <h3 className="admin-serp-title">
                {builderMetaTitle || 'Enter a meta title...'}
              </h3>
              <p className="admin-serp-desc">
                <span className="admin-serp-date">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} -
                </span>
                {builderMetaDescription || 'Start typing a meta description...'}
              </p>
            </div>
          </div>
        </article>

        {/* List of Custom Dynamic Pages */}
        <article className="admin-panel admin-m0">
          <div className="admin-panel-head">
            <span>Dynamic Custom Pages</span>
            <small>{landingPages.length} rows</small>
          </div>
          <div className="admin-seo-page-list" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {landingPages.map((page) => (
              <button
                type="button"
                key={page.slug}
                onClick={() => loadBuilderForm(page)}
                className={`admin-seo-page-row ${selectedBuilderSlug === page.slug ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  width: '100%',
                  padding: '0.8rem 1rem',
                  borderBottom: '1px solid #e5e7eb',
                  background: selectedBuilderSlug === page.slug ? '#f9fafb' : 'none',
                  borderLeft: selectedBuilderSlug === page.slug ? '3px solid var(--admin-color-accent, #c69e6a)' : '3px solid transparent',
                }}
              >
                <strong>/{page.slug}</strong>
                <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>H1: {page.h1}</span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>
                  Filter: {JSON.stringify(page.filter || {})}
                </span>
              </button>
            ))}
            {landingPages.length === 0 && (
              <p className="admin-muted admin-p20">No dynamic custom pages created yet.</p>
            )}
          </div>
        </article>
      </aside>
    </div>
  );
}
