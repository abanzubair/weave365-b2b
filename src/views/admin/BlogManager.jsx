import { useState, useEffect } from 'react';
import {
  FileText,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Check,
  Plus,
  Upload,
  RefreshCw,
  Copy,
} from '../../components/icons.jsx';
import { saveSupabaseBlogPost, fetchSupabaseBlogPosts } from '../../productData.js';
import { blogPosts } from '../../data/blogPosts.js';
import { supabase } from '../../supabaseClient.js';

export default function BlogManager({
  blogs = [],
  setBlogs,
  adminData,
  loadAdminData,
}) {
  // Blog editor form states
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    async function loadInitialBlogs() {
      try {
        setIsLoadingPosts(true);
        const posts = await fetchSupabaseBlogPosts();
        if (setBlogs && Array.isArray(posts) && posts.length > 0) {
          setBlogs(posts);
        }
      } catch (err) {
        console.error('Error loading initial blogs in BlogManager:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    }
    void loadInitialBlogs();
  }, [setBlogs]);
  const [editingPost, setEditingPost] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('Wholesale Guides');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formReadTime, setFormReadTime] = useState('8 Minutes Read');
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
    setFormCategory('Wholesale Guides');
    setFormCustomCategory('');
    setFormTag('');
    setFormDate('');
    setFormReadTime('8 Minutes Read');
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

    const standardCategories = ['Wholesale Guides', 'Reseller Business', 'Banarasi Insights', 'Business Growth'];
    if (standardCategories.includes(post.category)) {
      setFormCategory(post.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Custom');
      setFormCustomCategory(post.category || '');
    }

    setFormTag(post.tag || '');
    setFormDate(post.date || '');
    setFormReadTime(post.readTime || post.read_time || '8 Minutes Read');
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

    const finalDate = formDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    setIsSubmittingBlog(true);
    try {
      const payload = {
        id: editingPost?.id,
        title: formTitle,
        slug: formSlug,
        category: finalCategory,
        tag: formTag || finalCategory,
        date: finalDate,
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

  return (
    <div className="admin-blog-manager-tab">
      {/* Setup Checklist Alert */}
      {adminData.errors.blog_posts ? (
        <article className="admin-blog-setup-alert">
          <div className="admin-blog-setup-flex">
            <div className="admin-blog-setup-icon-wrap">
              <AlertTriangle size={22} />
            </div>
            <div className="admin-blog-setup-content">
              <h3 className="admin-blog-setup-title">
                Supabase Blog Table Required for Dynamic Publishing
              </h3>
              <p className="admin-blog-setup-desc">
                Your code is ready for dynamic blogging, but the <strong>`blog_posts`</strong> table doesn't exist in your Supabase database yet.
                Copy and run the SQL below inside your <strong>Supabase Dashboard SQL Editor</strong> to go live.
              </p>

              <div className="admin-pos-relative">
                <pre className="admin-blog-setup-pre">
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
                  className="admin-blog-setup-copy-btn"
                >
                  Copy SQL
                </button>
              </div>

              <div className="admin-blog-setup-draft-notice">
                <span className="admin-blog-setup-dot"></span>
                <small className="admin-blog-setup-small">
                  <strong>Draft Mode Active:</strong> You can still draft and preview articles locally, but they won't save to the backend.
                </small>
              </div>
            </div>
          </div>
        </article>
      ) : (
        <div className="admin-blog-setup-success">
          <Check size={16} />
          <small className="admin-blog-setup-success-text">
            Supabase Connection Active: Dynamic publishing is fully online and responsive.
          </small>
        </div>
      )}

      {/* List of Current Articles */}
      <article className="admin-panel admin-panel-margin-bottom">
        <div className="admin-panel-head">
          <span><FileText size={18} /> Current Compiled Articles</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={async () => {
                setIsLoadingPosts(true);
                const posts = await fetchSupabaseBlogPosts();
                if (setBlogs && Array.isArray(posts)) setBlogs(posts);
                setIsLoadingPosts(false);
              }}
              className="admin-btn-icon-subtle"
              style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              title="Refresh blog articles"
            >
              <RefreshCw size={13} style={{ animation: isLoadingPosts ? 'spin 1s linear infinite' : 'none' }} /> Refresh
            </button>
            <small>{blogs.length} articles total</small>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>S.No.</th>
                <th className="admin-col-article">Article</th>
                <th className="admin-col-category">Category</th>
                <th className="admin-col-readtime">Read Time</th>
                <th className="admin-col-date">Date</th>
                <th className="admin-col-actions">Editor Action</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((post, index) => {
                return (
                  <tr key={post.slug}>
                    <td>{blogs.length - index}</td>
                    <td className="admin-col-article"><strong>{post.title}</strong></td>
                    <td className="admin-col-category">
                      <span className="admin-blog-item-category">
                        {post.category || 'Wholesale Guides'}
                      </span>
                    </td>
                    <td className="admin-col-readtime">{post.readTime || post.read_time}</td>
                    <td className="admin-col-date">{post.date}</td>
                    <td className="admin-col-actions">
                      <div className="admin-blog-actions-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEditPost(post)}
                          className="admin-blog-btn-edit"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlog(post)}
                          className="admin-blog-btn-delete"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-blog-btn-live"
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
      <div id="blog-editor-anchor" className="admin-anchor-height1"></div>

      {/* Editor Form & Preview split */}
      <div className="admin-editor-split-layout">
        <article className="admin-panel admin-m0">
          <div className="admin-panel-head admin-panel-head-border">
            <span className="admin-editor-title">
              {editingPost ? '✍️ Edit Blog Post' : '✍️ Compose Blog Post'}
            </span>
            {editingPost && (
              <span className="admin-editor-draft-badge">
                EDITING DRAFT
              </span>
            )}
          </div>

          <form onSubmit={handleSaveBlog} className="admin-editor-form">
            <div className="admin-field-container">
              <label className="admin-field-label">Article Title *</label>
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
                className="admin-field-input"
              />
            </div>

            <div className="admin-slug-row">
              <div className="admin-field-container-w100">
                <label className="admin-field-label">URL Slug *</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. katan-silk-vs-organza"
                  required
                  className="admin-field-input"
                />
              </div>
              <button
                type="button"
                onClick={autoSlugify}
                className="admin-btn-slug"
              >
                🔗 Auto-Generate Slug
              </button>
            </div>

            <div className="admin-grid-2col">
              <div className="admin-field-container">
                <label className="admin-field-label">Category *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="admin-field-input"
                >
                  <option value="Wholesale Guides">Wholesale Guides</option>
                  <option value="Reseller Business">Reseller Business</option>
                  <option value="Banarasi Insights">Banarasi Insights</option>
                  <option value="Business Growth">Business Growth</option>
                  <option value="Custom">Custom / Add New...</option>
                </select>
              </div>

              <div className="admin-field-container">
                <label className="admin-field-label">Tags</label>
                <input
                  type="text"
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  placeholder="e.g. Saree Reseller, Wholesale Trends"
                  className="admin-field-input"
                />
              </div>
            </div>

            {formCategory === 'Custom' && (
              <div className="admin-field-container-animated">
                <label className="admin-field-label">Custom Category Name *</label>
                <input
                  type="text"
                  value={formCustomCategory}
                  onChange={(e) => setFormCustomCategory(e.target.value)}
                  placeholder="e.g. Saree Care Guides"
                  required
                  className="admin-field-input"
                />
              </div>
            )}

            <div className="admin-grid-3col">
              <div className="admin-field-container">
                <label className="admin-field-label">Author Name</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="admin-field-input"
                />
              </div>
              <div className="admin-field-container">
                <label className="admin-field-label">Read Duration</label>
                <input
                  type="text"
                  value={formReadTime}
                  onChange={(e) => setFormReadTime(e.target.value)}
                  placeholder="e.g. 8 Minutes Read"
                  className="admin-field-input"
                />
              </div>
              <div className="admin-field-container">
                <label className="admin-field-label">Publication Date</label>
                <input
                  type="text"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  placeholder="e.g. May 26, 2026"
                  className="admin-field-input"
                />
              </div>
            </div>

            <div className="admin-editor-image-section">
              <label className="admin-editor-image-title">🖼️ Cover Image Selection</label>
              <div className="admin-editor-image-options">
                <label className="admin-radio-label">
                  <input
                    type="radio"
                    name="imageInputType"
                    checked={formImageInputType === 'file'}
                    onChange={() => setFormImageInputType('file')}
                  /> Upload File (Base64)
                </label>
                <label className="admin-radio-label">
                  <input
                    type="radio"
                    name="imageInputType"
                    checked={formImageInputType === 'url'}
                    onChange={() => setFormImageInputType('url')}
                  /> Paste Image URL
                </label>
              </div>

              {formImageInputType === 'file' ? (
                <div className="admin-field-container">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="admin-file-input"
                  />
                  <small className="admin-doc-card-muted">Limit: 4MB.</small>
                </div>
              ) : (
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="Paste cover image URL..."
                  className="admin-field-input-w100"
                />
              )}
            </div>

            <div className="admin-field-container">
              <label className="admin-field-label">Short Intro Description *</label>
              <textarea
                value={formIntro}
                onChange={(e) => setFormIntro(e.target.value)}
                placeholder="Article executive summary (for SEO)..."
                required
                rows="3"
                className="admin-field-textarea"
              />
            </div>

            <div className="admin-field-container">
              <div className="admin-flex-between">
                <label className="admin-field-label">Content Body (Markdown) *</label>
                <span className="admin-markdown-badge">Markdown Supported</span>
              </div>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={`Use H2 and H3 tags, lists, blockquotes, links, etc.`}
                required
                rows="15"
                className="admin-field-textarea-monospace"
              />
              
              {/* Markdown Formatting Cheat Sheet Reference */}
              <div className="admin-markdown-cheatsheet" style={{
                marginTop: '0.75rem',
                padding: '1rem',
                backgroundColor: 'rgba(235, 187, 86, 0.05)',
                border: '1px solid rgba(235, 187, 86, 0.25)',
                borderRadius: '6px',
                fontSize: '0.85rem',
                lineHeight: '1.45'
              }}>
                <div style={{ fontWeight: 600, color: '#c49a3c', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📝 Blog Markdown Reference Guide</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-main)' }}>Headers & Divider</p>
                    <code style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                      ## Main Heading (H2)<br/>
                      ### Sub Heading (H3)<br/>
                      --- (Horizontal Divider)
                    </code>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-main)' }}>Links & Bold Text</p>
                    <code style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                      [Link Text](https://example.com) (External)<br/>
                      [Link Text](/wholesale-catalogue) (Internal)<br/>
                      **Bold Text**
                    </code>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-main)' }}>Lists with Details (Indented)</p>
                    <code style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                      1. Step Title<br/>
                      &nbsp;&nbsp;&nbsp;&nbsp;Step details line (indented)<br/>
                      2. Step Title
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="admin-faq-section">
              <div className="admin-faq-header">
                <label className="admin-faq-title">❓ Schema FAQ Accordion Builder</label>
                <button type="button" onClick={addFaqItem} className="admin-btn-add-faq">
                  <Plus size={14} /> Add FAQ
                </button>
              </div>

              <div className="admin-field-container">
                {formFaqs.map((faq, index) => (
                  <div key={index} className="admin-faq-item">
                    <button type="button" onClick={() => removeFaqItem(index)} className="admin-btn-delete-faq">
                      <Trash2 size={16} />
                    </button>
                    <div className="admin-faq-fields">
                      <input
                        type="text"
                        value={faq.q}
                        onChange={(e) => updateFaqItem(index, 'q', e.target.value)}
                        placeholder="Question"
                        className="admin-faq-input"
                      />
                      <textarea
                        value={faq.a}
                        onChange={(e) => updateFaqItem(index, 'a', e.target.value)}
                        placeholder="Answer"
                        rows="2"
                        className="admin-faq-textarea"
                      />
                    </div>
                  </div>
                ))}
                {formFaqs.length === 0 && (
                  <small className="admin-faq-empty">No FAQ items added.</small>
                )}
              </div>
            </div>

            {/* SEO settings */}
            <div className="admin-seo-meta-section">
              <label className="admin-faq-title">🔍 Google SEO Settings</label>
              <div className="admin-field-container">
                <div className="admin-flex-between">
                  <label className="admin-field-label">Meta Title Tag</label>
                  <small className={formMetaTitle.length > 60 ? 'admin-seo-count-warn' : 'admin-doc-card-muted'}>
                    {formMetaTitle.length}/60
                  </small>
                </div>
                <input
                  type="text"
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  placeholder="Meta title shown on search engines"
                  className="admin-seo-input"
                />
              </div>

              <div className="admin-field-container">
                <div className="admin-flex-between">
                  <label className="admin-field-label">Meta Description</label>
                  <small className={formMetaDescription.length > 155 ? 'admin-seo-count-warn' : 'admin-doc-card-muted'}>
                    {formMetaDescription.length}/155
                  </small>
                </div>
                <textarea
                  value={formMetaDescription}
                  onChange={(e) => setFormMetaDescription(e.target.value)}
                  placeholder="Meta description shown on search results"
                  rows="3"
                  className="admin-seo-textarea"
                />
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="button" onClick={resetBlogForm} className="admin-btn-cancel">
                Cancel / Reset
              </button>
              <button
                type="submit"
                disabled={isSubmittingBlog || (adminData.errors.blog_posts && formImageInputType === 'file' && !formImageBase64)}
                className="admin-btn-publish"
              >
                {isSubmittingBlog ? (
                  <><RefreshCw size={16} className="spin" /> Publishing...</>
                ) : (
                  <><Upload size={16} /> {editingPost ? 'Save Changes' : 'Publish Article'}</>
                )}
              </button>
            </div>
          </form>
        </article>

        {/* Live previews */}
        <aside className="admin-editor-sticky-aside">
          <article className="admin-panel admin-m0">
            <div className="admin-panel-head">
              <span>Google SERP Preview</span>
            </div>
            <div className="admin-p20">
              <div className="admin-serp-preview">
                <div className="admin-serp-url-row">
                  <span>https://www.weave365.com</span>
                  <span className="admin-serp-slug">› blog › {formSlug || 'your-slug'}</span>
                </div>
                <h3 className="admin-serp-title">
                  {formMetaTitle || formTitle || 'Please Enter a Title...'}
                </h3>
                <p className="admin-serp-desc">
                  <span className="admin-serp-date">
                    {formDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} —
                  </span>
                  {formMetaDescription || formIntro || 'Start typing summary...'}
                </p>
              </div>
            </div>
          </article>

          <article className="admin-panel admin-m0">
            <div className="admin-panel-head">
              <span>Grid Card Preview</span>
            </div>
            <div className="admin-p24-bg-fafafa">
              <article className="blog-card admin-blog-card-preview">
                <div className="card-img-wrapper admin-blog-card-img-wrapper">
                  {formImageInputType === 'file' && formImageBase64 ? (
                    <img src={formImageBase64} alt="Preview" />
                  ) : formImageUrl ? (
                    <img src={formImageUrl} alt="Preview" />
                  ) : (
                    <div className="admin-blog-card-img-placeholder">Image Placeholder</div>
                  )}
                  <span className="card-category-badge">
                    {formCategory === 'Custom' ? formCustomCategory || 'Category' : formCategory}
                  </span>
                </div>
                <div className="card-info-pane admin-blog-card-info-pane">
                  <div className="post-meta-strip admin-blog-card-meta-strip">
                    <span className="admin-fs11">
                      {formDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="meta-divider admin-blog-card-meta-divider"></span>
                    <span className="admin-fs11">{formReadTime}</span>
                  </div>
                  <h3 className="admin-blog-card-title">{formTitle || 'Title...'}</h3>
                  <p className="admin-blog-card-desc">{formIntro || 'Description summary...'}</p>
                  <button type="button" className="read-more-link admin-blog-card-read-more">Read Article →</button>
                </div>
              </article>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
}
