/**
 * @file DirectoryManager.jsx
 * @description Admin panel management tool to fully customize the B2B Directory (InternalLinkNetwork).
 * Provides section header controls, dynamic column management, link items editor, icon selection,
 * and persistent saving to Supabase and local storage.
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Code,
  Copy
} from 'lucide-react';
import {
  getDirectoryConfigLocal,
  saveDirectoryConfig,
  resetDirectoryConfig,
  DIRECTORY_TABLE_SQL,
  DEFAULT_DIRECTORY_CONFIG
} from '../../utils/directoryService.js';

const AVAILABLE_ICONS = [
  'Compass', 'Grid', 'BookOpen', 'Briefcase', 'Layers',
  'ShoppingBag', 'Tag', 'Globe', 'Link', 'FileText',
  'Sparkles', 'Star', 'Award', 'HelpCircle', 'Package'
];

const LINK_TYPES = [
  { label: 'Site Route', value: 'route' },
  { label: 'Product Category', value: 'category' },
  { label: 'Blog Guide', value: 'blog-guide' },
  { label: 'Custom URL / Path', value: 'custom_url' }
];

export default function DirectoryManager() {
  const [config, setConfig] = useState(DEFAULT_DIRECTORY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  useEffect(() => {
    setConfig(getDirectoryConfigLocal());
  }, []);

  const showFeedback = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleHeaderChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // --- Column Operations ---
  const addColumn = () => {
    const newCol = {
      id: `col_${Date.now()}`,
      title: 'New Sourcing Section',
      icon: 'Compass',
      links: [
        { label: 'Sample Link Title', type: 'route', target: 'home', path: '/' }
      ]
    };
    setConfig(prev => ({ ...prev, columns: [...prev.columns, newCol] }));
  };

  const removeColumn = (colIdx) => {
    if (config.columns.length <= 1) {
      alert('Directory must have at least one column.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this directory column?')) {
      setConfig(prev => ({
        ...prev,
        columns: prev.columns.filter((_, idx) => idx !== colIdx)
      }));
    }
  };

  const moveColumn = (colIdx, direction) => {
    const targetIdx = colIdx + direction;
    if (targetIdx < 0 || targetIdx >= config.columns.length) return;
    const newCols = [...config.columns];
    const temp = newCols[colIdx];
    newCols[colIdx] = newCols[targetIdx];
    newCols[targetIdx] = temp;
    setConfig(prev => ({ ...prev, columns: newCols }));
  };

  const handleColumnChange = (colIdx, field, value) => {
    setConfig(prev => {
      const newCols = [...prev.columns];
      newCols[colIdx] = { ...newCols[colIdx], [field]: value };
      return { ...prev, columns: newCols };
    });
  };

  // --- Link Operations ---
  const addLink = (colIdx) => {
    setConfig(prev => {
      const newCols = [...prev.columns];
      const targetCol = newCols[colIdx];
      const newLink = { label: 'New Custom Link', type: 'route', target: 'catalogue', path: '/catalogue' };
      newCols[colIdx] = { ...targetCol, links: [...(targetCol.links || []), newLink] };
      return { ...prev, columns: newCols };
    });
  };

  const removeLink = (colIdx, linkIdx) => {
    setConfig(prev => {
      const newCols = [...prev.columns];
      const targetCol = newCols[colIdx];
      newCols[colIdx] = {
        ...targetCol,
        links: targetCol.links.filter((_, idx) => idx !== linkIdx)
      };
      return { ...prev, columns: newCols };
    });
  };

  const moveLink = (colIdx, linkIdx, direction) => {
    setConfig(prev => {
      const newCols = [...prev.columns];
      const targetCol = newCols[colIdx];
      const targetIdx = linkIdx + direction;
      if (targetIdx < 0 || targetIdx >= targetCol.links.length) return prev;
      
      const newLinks = [...targetCol.links];
      const temp = newLinks[linkIdx];
      newLinks[linkIdx] = newLinks[targetIdx];
      newLinks[targetIdx] = temp;

      newCols[colIdx] = { ...targetCol, links: newLinks };
      return { ...prev, columns: newCols };
    });
  };

  const handleLinkChange = (colIdx, linkIdx, field, value) => {
    setConfig(prev => {
      const newCols = [...prev.columns];
      const targetCol = newCols[colIdx];
      const newLinks = [...targetCol.links];
      const updatedLink = { ...newLinks[linkIdx], [field]: value };

      if (field === 'type' || field === 'target') {
        const type = field === 'type' ? value : updatedLink.type;
        const target = field === 'target' ? value : updatedLink.target;

        if (type === 'category') {
          updatedLink.path = `/catalogue?category=${encodeURIComponent(target || '')}`;
        } else if (type === 'blog-guide') {
          updatedLink.path = `/blog/${target || ''}`;
        } else if (type === 'route') {
          updatedLink.path = target ? (target.startsWith('/') ? target : `/${target}`) : '/';
        }
      }

      newLinks[linkIdx] = updatedLink;
      newCols[colIdx] = { ...targetCol, links: newLinks };
      return { ...prev, columns: newCols };
    });
  };

  // --- Save / Reset Actions ---
  const handleSave = async () => {
    setSaving(true);
    const result = await saveDirectoryConfig(config);
    setSaving(false);
    if (result.success) {
      showFeedback('success', 'Internal Links settings saved successfully! Site live view updated.');
    } else {
      showFeedback('error', 'Failed to save settings: ' + result.error);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset directory layout to default Weave365 network links?')) {
      setSaving(true);
      const result = await resetDirectoryConfig();
      setSaving(false);
      if (result.success) {
        setConfig(getDirectoryConfigLocal());
        showFeedback('success', 'Reset directory configuration to default.');
      }
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(DIRECTORY_TABLE_SQL);
    alert('Supabase SQL copied to clipboard! You can paste and run this in your Supabase SQL Editor if needed.');
  };

  return (
    <div className="directory-manager-container">
      {/* Header Banner */}
      <div className="directory-manager-header">
        <div className="directory-header-text">
          <div className="directory-title-row">
            <Compass className="directory-header-icon" size={24} />
            <h2>Internal Links Customizer</h2>
          </div>
          <p className="directory-header-desc">
            Customize the Sourcing & Craft Heritage Network directory rendered at the bottom of pages.
            Changes update SEO crawling structure and site live views instantly.
          </p>
        </div>
        <div className="directory-header-actions">
          <button
            type="button"
            className="dir-btn dir-btn-secondary"
            onClick={() => setShowSqlModal(true)}
          >
            <Code size={16} />
            <span>Setup DB SQL</span>
          </button>
          <button
            type="button"
            className="dir-btn dir-btn-secondary"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw size={16} />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            className="dir-btn dir-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {message && (
        <div className={`dir-alert-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Form Content */}
      <div className="directory-manager-body">
        {/* 1. Header & Section Settings */}
        <div className="directory-card">
          <h3 className="directory-card-title">Section Header Configuration</h3>
          <div className="directory-form-grid">
            <div className="directory-form-group">
              <label>Header Kicker (Sub-heading)</label>
              <input
                type="text"
                className="directory-input"
                value={config.kicker || ''}
                onChange={(e) => handleHeaderChange('kicker', e.target.value)}
                placeholder="e.g. WEAVE365 B2B DIRECTORY"
              />
            </div>
            <div className="directory-form-group">
              <label>Main Section Title</label>
              <input
                type="text"
                className="directory-input"
                value={config.title || ''}
                onChange={(e) => handleHeaderChange('title', e.target.value)}
                placeholder="e.g. Sourcing & Craft Heritage Network"
              />
            </div>
          </div>
        </div>

        {/* 2. Columns & Link Items Editor */}
        <div className="directory-card">
          <div className="directory-card-header-flex">
            <div>
              <h3 className="directory-card-title mb-1">Directory Columns & Internal Links ({config.columns?.length || 0})</h3>
              <p className="directory-card-subtitle">Manage columns, section icons, link titles, and destination targets.</p>
            </div>
            <button type="button" className="dir-btn dir-btn-primary" onClick={addColumn}>
              <Plus size={16} />
              <span>Add New Column</span>
            </button>
          </div>

          <div className="directory-cols-grid">
            {config.columns && config.columns.map((col, colIdx) => (
              <div className="dir-col-card" key={col.id || colIdx}>
                {/* Column Card Top Control Bar */}
                <div className="dir-col-top-bar">
                  <div className="dir-col-title-wrap">
                    <span className="dir-col-badge">Col #{colIdx + 1}</span>
                    <input
                      type="text"
                      className="directory-input dir-col-input"
                      value={col.title || ''}
                      onChange={(e) => handleColumnChange(colIdx, 'title', e.target.value)}
                      placeholder="Column Header Title"
                    />
                  </div>
                  <div className="dir-col-actions">
                    <button
                      type="button"
                      className="dir-icon-btn"
                      onClick={() => moveColumn(colIdx, -1)}
                      disabled={colIdx === 0}
                      title="Move Left"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="dir-icon-btn"
                      onClick={() => moveColumn(colIdx, 1)}
                      disabled={colIdx === config.columns.length - 1}
                      title="Move Right"
                    >
                      <MoveDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="dir-icon-btn dir-icon-btn-danger"
                      onClick={() => removeColumn(colIdx)}
                      title="Delete Column"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Icon Selector */}
                <div className="dir-icon-select-row">
                  <label>Header Icon:</label>
                  <select
                    value={col.icon || 'Compass'}
                    onChange={(e) => handleColumnChange(colIdx, 'icon', e.target.value)}
                    className="directory-select"
                  >
                    {AVAILABLE_ICONS.map(iconName => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                </div>

                {/* Links List for this column */}
                <div className="dir-links-wrap">
                  <div className="dir-links-header">
                    <span>Links ({col.links?.length || 0})</span>
                    <button type="button" className="dir-text-btn" onClick={() => addLink(colIdx)}>
                      <Plus size={13} /> Add Link
                    </button>
                  </div>

                  <div className="dir-links-list">
                    {col.links && col.links.map((link, linkIdx) => (
                      <div className="dir-link-row" key={linkIdx}>
                        <div className="dir-link-top">
                          <input
                            type="text"
                            className="directory-input dir-link-input"
                            value={link.label || ''}
                            onChange={(e) => handleLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                            placeholder="Link Display Text"
                          />
                          <div className="dir-link-actions">
                            <button
                              type="button"
                              className="dir-icon-btn-sm"
                              onClick={() => moveLink(colIdx, linkIdx, -1)}
                              disabled={linkIdx === 0}
                            >
                              <MoveUp size={12} />
                            </button>
                            <button
                              type="button"
                              className="dir-icon-btn-sm"
                              onClick={() => moveLink(colIdx, linkIdx, 1)}
                              disabled={linkIdx === col.links.length - 1}
                            >
                              <MoveDown size={12} />
                            </button>
                            <button
                              type="button"
                              className="dir-icon-btn-sm dir-icon-btn-danger"
                              onClick={() => removeLink(colIdx, linkIdx)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="dir-link-bottom">
                          <select
                            value={link.type || 'route'}
                            onChange={(e) => handleLinkChange(colIdx, linkIdx, 'type', e.target.value)}
                            className="directory-select dir-type-select"
                          >
                            {LINK_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>

                          <input
                            type="text"
                            className="directory-input dir-target-input"
                            value={link.target || ''}
                            onChange={(e) => handleLinkChange(colIdx, linkIdx, 'target', e.target.value)}
                            placeholder={
                              link.type === 'category' ? 'e.g. Saree, Suit' :
                              link.type === 'blog-guide' ? 'e.g. blog-post-slug' :
                              'Target Route / Path'
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Setup Modal */}
      {showSqlModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <h3>Supabase Table Setup SQL</h3>
              <button type="button" className="close-modal-btn" onClick={() => setShowSqlModal(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p>Run this SQL in your Supabase SQL Editor if you want persistent cloud syncing across devices:</p>
              <pre className="sql-code-block">{DIRECTORY_TABLE_SQL}</pre>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="dir-btn dir-btn-secondary" onClick={copySqlToClipboard}>
                <Copy size={16} /> Copy SQL
              </button>
              <button type="button" className="dir-btn dir-btn-primary" onClick={() => setShowSqlModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
