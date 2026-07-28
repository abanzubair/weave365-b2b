'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_THEME_SETTINGS, applyCustomTheme, getCustomContent } from '../../utils/themeEngine.js';
import { fetchSiteCustomizer, saveSiteCustomizer } from '../../productData.js';
import { 
  Save, 
  RotateCcw, 
  Check, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Sparkles, 
  RefreshCw, 
  Palette, 
  Type, 
  FileText, 
  Layers, 
  Eye,
  ExternalLink,
  RotateCw,
  ZoomIn,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Box,
  Move
} from 'lucide-react';

const DEVICE_PRESETS = [
  { id: 'laptop', label: 'Laptop / Desktop (1440 × 900 px)', width: 1440, height: 900 },
  { id: 'iphone-se', label: 'iPhone SE (375 × 667 px)', width: 375, height: 667 },
  { id: 'iphone-14-pro', label: 'iPhone 12/13/14 Pro (390 × 844 px)', width: 390, height: 844 },
  { id: 'iphone-15-max', label: 'iPhone 14/15 Pro Max (430 × 932 px)', width: 430, height: 932 },
  { id: 'galaxy-s20', label: 'Samsung Galaxy S20 (360 × 800 px)', width: 360, height: 800 },
  { id: 'full-hd', label: 'Full HD Mobile / Display (1080 × 1920 px)', width: 1080, height: 1920 },
  { id: 'ipad-air', label: 'iPad Air (820 × 1180 px)', width: 820, height: 1180 },
  { id: 'ipad-pro', label: 'iPad Pro (1024 × 1366 px)', width: 1024, height: 1366 },
  { id: '4k', label: '4K Display (2560 × 1440 px)', width: 2560, height: 1440 },
  { id: 'custom', label: 'Custom Pixel Resolution...', width: 1440, height: 900 },
];

function getUniqueSelector(el) {
  if (!el || el.tagName === 'BODY' || el.tagName === 'HTML') return '';
  if (el.getAttribute('data-editable-key')) return `[data-editable-key="${el.getAttribute('data-editable-key')}"]`;
  if (el.id) return `#${el.id}`;
  
  let path = [];
  let current = el;
  while (current && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
    let selector = current.tagName.toLowerCase();
    if (current.className && typeof current.className === 'string') {
      const validClasses = current.className.trim().split(/\s+/).filter(c => c && !c.startsWith('wysiwyg') && !c.startsWith('is-'));
      if (validClasses.length > 0) {
        selector += '.' + validClasses.slice(0, 2).join('.');
      }
    }
    
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }
    path.unshift(selector);
    current = parent;
  }
  return path.join(' > ');
}

function rgbToHex(rgbStr) {
  if (!rgbStr || typeof rgbStr !== 'string') return '#1a1a1a';
  if (rgbStr.startsWith('#')) return rgbStr;
  const match = rgbStr.match(/\d+/g);
  if (!match || match.length < 3) return '#1a1a1a';
  const r = parseInt(match[0], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[2], 10).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function VisualPageEditor({ user, navigate = () => {} }) {
  const [themeData, setThemeData] = useState(DEFAULT_THEME_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editor controls state (Pixel based dimensions)
  const [activePage, setActivePage] = useState('home');
  const [selectedPresetId, setSelectedPresetId] = useState('laptop');
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isRotated, setIsRotated] = useState(false);

  // DevTools Scale / Zoom state
  const [zoomMode, setZoomMode] = useState('auto'); // 'auto' | '1' | '0.75' | '0.5' | '0.25'
  const [scaleRatio, setScaleRatio] = useState(1);
  const previewAreaRef = useRef(null);

  // Target Inspection Selection (Item vs Parent Section)
  const [targetType, setTargetType] = useState('item'); // 'item' | 'container'
  const [itemSelector, setItemSelector] = useState('');
  const [containerSelector, setContainerSelector] = useState('');
  const [activeDomSelector, setActiveDomSelector] = useState('');

  const [activeElementMeta, setActiveElementMeta] = useState({
    label: 'Homepage Hero Title',
    text: 'Authentic Banarasi Silk & Wholesale Textiles',
    color: '#000000',
    fontSize: 56,
    textAlign: 'left',
    width: 'auto',
    maxWidth: '100%',
    height: 'auto',
    minHeight: 'auto',
    padding: '0px',
    margin: '0px',
  });

  const iframeRef = useRef(null);

  useEffect(() => {
    async function loadCustomizer() {
      try {
        setLoading(true);
        const data = await fetchSiteCustomizer();
        if (data) {
          const merged = {
            colors: { ...DEFAULT_THEME_SETTINGS.colors, ...(data.colors || {}) },
            typography: { ...DEFAULT_THEME_SETTINGS.typography, ...(data.typography || {}) },
            elementStyles: { ...(data.elementStyles || {}) },
            content: { ...DEFAULT_THEME_SETTINGS.content, ...(data.content || {}) },
            domOverrides: { ...(data.domOverrides || {}) },
          };
          setThemeData(merged);
          applyCustomTheme(merged);
        }
      } catch (err) {
        console.error('[VisualPageEditor] Error loading customizer:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomizer();
  }, []);

  // Calculate Auto-Fit Scale Ratio for high resolutions like 1080x1920 or 2560x1440
  useEffect(() => {
    const updateScale = () => {
      if (!previewAreaRef.current) return;
      if (zoomMode !== 'auto') {
        setScaleRatio(parseFloat(zoomMode) || 1);
        return;
      }
      const containerW = previewAreaRef.current.clientWidth - 48;
      const numericW = typeof viewportWidth === 'number' ? viewportWidth : parseFloat(viewportWidth);
      if (numericW && numericW > containerW && containerW > 0) {
        setScaleRatio(containerW / numericW);
      } else {
        setScaleRatio(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [viewportWidth, viewportHeight, zoomMode]);

  // Sync theme variables, styles, dimensions and written text to iframe in real-time
  const syncIframeTheme = (dataToSync = themeData) => {
    if (!iframeRef.current) return;
    try {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      const win = iframeRef.current.contentWindow;
      if (doc && doc.documentElement) {
        const currentData = dataToSync || themeData;

        // 1. Sync CSS variables
        Object.entries(currentData.colors || {}).forEach(([k, v]) => {
          if (v) doc.documentElement.style.setProperty(k, v);
        });
        Object.entries(currentData.typography || {}).forEach(([k, v]) => {
          if (v) doc.documentElement.style.setProperty(k, v);
        });

        // 2. Inject inspect mode hover/selection styles into iframe
        if (!doc.getElementById('wysiwyg-inspect-styles') && doc.head) {
          const style = doc.createElement('style');
          style.id = 'wysiwyg-inspect-styles';
          style.innerHTML = `
            h1, h2, h3, h4, h5, h6, p, button, a, span, label, section, article, div, [data-editable-key] {
              cursor: pointer !important;
              transition: outline 0.15s ease, background 0.15s ease !important;
            }
            h1:hover, h2:hover, h3:hover, h4:hover, h5:hover, h6:hover, p:hover, button:hover, a:hover, span:hover, label:hover, [data-editable-key]:hover {
              outline: 2px dashed #b78646 !important;
              outline-offset: 3px !important;
              background-color: rgba(183, 134, 70, 0.08) !important;
            }
            .wysiwyg-active-selected {
              outline: 2px solid #b78646 !important;
              outline-offset: 3px !important;
              background-color: rgba(183, 134, 70, 0.15) !important;
            }
          `;
          doc.head.appendChild(style);
        }

        // 3. Attach Universal Click Inspector to iframe body
        if (doc.body && !doc.body.__wysiwygInspectBound) {
          doc.body.__wysiwygInspectBound = true;
          doc.body.addEventListener('click', (e) => {
            const target = e.target.closest('h1, h2, h3, h4, h5, h6, p, button, a, span, label, section, article, div, [data-editable-key]');
            if (!target) return;
            e.preventDefault();
            e.stopPropagation();

            doc.querySelectorAll('.wysiwyg-active-selected').forEach(el => el.classList.remove('wysiwyg-active-selected'));
            target.classList.add('wysiwyg-active-selected');

            // Item Selector
            const iSel = getUniqueSelector(target);
            setItemSelector(iSel);

            // Container / Section Selector
            const pCont = target.closest('section, article, div[class*="-section"], div[class*="-band"], div.content-wrapper, div.container') || target.parentElement;
            const cSel = pCont ? getUniqueSelector(pCont) : iSel;
            setContainerSelector(cSel);

            const activeSel = targetType === 'container' ? cSel : iSel;
            setActiveDomSelector(activeSel);

            // Read computed styles
            const inspectNode = targetType === 'container' && pCont ? pCont : target;
            const comp = win ? win.getComputedStyle(inspectNode) : {};
            const existingOverride = currentData.domOverrides?.[activeSel] || {};
            
            const rawText = inspectNode.innerText || inspectNode.textContent || '';
            const tagLabel = inspectNode.tagName.toUpperCase() + (inspectNode.className ? `.${inspectNode.className.trim().split(/\s+/)[0]}` : '');

            setActiveElementMeta({
              label: tagLabel,
              text: existingOverride.text !== undefined ? existingOverride.text : rawText.trim(),
              color: existingOverride.color || rgbToHex(comp.color) || '#1a1a1a',
              fontSize: parseInt(existingOverride.fontSize || comp.fontSize || 16, 10),
              textAlign: existingOverride.textAlign || comp.textAlign || 'left',
              width: existingOverride.width || comp.width || 'auto',
              maxWidth: existingOverride.maxWidth || comp.maxWidth || '100%',
              height: existingOverride.height || comp.height || 'auto',
              minHeight: existingOverride.minHeight || comp.minHeight || 'auto',
              padding: existingOverride.padding || comp.padding || '0px',
              margin: existingOverride.margin || comp.margin || '0px',
            });

          }, true);
        }

        // 4. Apply Universal DOM Overrides by CSS Selector inside iframe
        if (currentData.domOverrides) {
          Object.entries(currentData.domOverrides).forEach(([sel, styleObj]) => {
            try {
              const elements = doc.querySelectorAll(sel);
              elements.forEach(el => {
                if (styleObj.text !== undefined && styleObj.text !== '') el.innerText = styleObj.text;
                if (styleObj.color) el.style.color = styleObj.color;
                if (styleObj.fontSize) el.style.fontSize = typeof styleObj.fontSize === 'number' ? `${styleObj.fontSize}px` : styleObj.fontSize;
                if (styleObj.textAlign) el.style.textAlign = styleObj.textAlign;
                if (styleObj.width) el.style.width = styleObj.width;
                if (styleObj.maxWidth) el.style.maxWidth = styleObj.maxWidth;
                if (styleObj.height) el.style.height = styleObj.height;
                if (styleObj.minHeight) el.style.minHeight = styleObj.minHeight;
                if (styleObj.padding) el.style.padding = styleObj.padding;
                if (styleObj.margin) el.style.margin = styleObj.margin;
              });
            } catch (err) {}
          });
        }
      }
    } catch (err) {
      console.warn('[VisualEditor] Frame sync error:', err);
    }
  };

  useEffect(() => {
    syncIframeTheme();
  }, [themeData, activePage]);

  // Handle Target Type Switch (Item vs Section Container)
  const handleTargetTypeSwitch = (type) => {
    setTargetType(type);
    const newSel = type === 'container' ? containerSelector : itemSelector;
    setActiveDomSelector(newSel);

    if (iframeRef.current && newSel) {
      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        const win = iframeRef.current.contentWindow;
        if (doc) {
          doc.querySelectorAll('.wysiwyg-active-selected').forEach(el => el.classList.remove('wysiwyg-active-selected'));
          const targetNode = doc.querySelector(newSel);
          if (targetNode) {
            targetNode.classList.add('wysiwyg-active-selected');
            const comp = win ? win.getComputedStyle(targetNode) : {};
            const existingOverride = themeData.domOverrides?.[newSel] || {};
            const rawText = targetNode.innerText || targetNode.textContent || '';
            const tagLabel = targetNode.tagName.toUpperCase() + (targetNode.className ? `.${targetNode.className.trim().split(/\s+/)[0]}` : '');

            setActiveElementMeta({
              label: tagLabel,
              text: existingOverride.text !== undefined ? existingOverride.text : rawText.trim(),
              color: existingOverride.color || rgbToHex(comp.color) || '#1a1a1a',
              fontSize: parseInt(existingOverride.fontSize || comp.fontSize || 16, 10),
              textAlign: existingOverride.textAlign || comp.textAlign || 'left',
              width: existingOverride.width || comp.width || 'auto',
              maxWidth: existingOverride.maxWidth || comp.maxWidth || '100%',
              height: existingOverride.height || comp.height || 'auto',
              minHeight: existingOverride.minHeight || comp.minHeight || 'auto',
              padding: existingOverride.padding || comp.padding || '0px',
              margin: existingOverride.margin || comp.margin || '0px',
            });
          }
        }
      } catch (err) {}
    }
  };

  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    const preset = DEVICE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setViewportWidth(preset.width);
      setViewportHeight(preset.height);
      setIsRotated(false);
    }
  };

  const handleWidthInput = (newW) => {
    setSelectedPresetId('custom');
    if (newW === '') {
      setViewportWidth('');
    } else {
      const parsed = parseInt(newW, 10);
      setViewportWidth(isNaN(parsed) ? '' : parsed);
    }
  };

  const handleHeightInput = (newH) => {
    setSelectedPresetId('custom');
    if (newH === '') {
      setViewportHeight('');
    } else {
      const parsed = parseInt(newH, 10);
      setViewportHeight(isNaN(parsed) ? '' : parsed);
    }
  };

  const handleRotateOrientation = () => {
    if (typeof viewportWidth !== 'number' || typeof viewportHeight !== 'number') return;
    setIsRotated(prev => !prev);
    const tempW = viewportWidth;
    setViewportWidth(viewportHeight);
    setViewportHeight(tempW);
  };

  const handleColorChange = (key, val) => {
    const updated = {
      ...themeData,
      colors: { ...themeData.colors, [key]: val },
    };
    setThemeData(updated);
    applyCustomTheme(updated);
    syncIframeTheme(updated);
  };

  const handleTypographyChange = (key, val) => {
    const updated = {
      ...themeData,
      typography: { ...themeData.typography, [key]: String(val) },
    };
    setThemeData(updated);
    applyCustomTheme(updated);
    syncIframeTheme(updated);
  };

  // Universal Element Override Handler (Text, Colors, Width, Height, Spacing)
  const handleUniversalDomOverride = (propName, val) => {
    const selector = activeDomSelector;
    
    // Update local inspector state
    setActiveElementMeta(prev => ({ ...prev, [propName]: val }));

    if (!selector) return;

    const updated = {
      ...themeData,
      domOverrides: {
        ...(themeData.domOverrides || {}),
        [selector]: {
          ...(themeData.domOverrides?.[selector] || {}),
          [propName]: val,
        },
      },
    };
    setThemeData(updated);
    applyCustomTheme(updated);

    // Direct 0ms DOM mutation on iframe active target node
    if (iframeRef.current) {
      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (doc) {
          let elements = doc.querySelectorAll(`.wysiwyg-active-selected, ${selector}`);
          elements.forEach(el => {
            if (propName === 'text') el.innerText = val || '';
            if (propName === 'color') el.style.color = val;
            if (propName === 'fontSize') el.style.fontSize = typeof val === 'number' ? `${val}px` : val.endsWith('px') ? val : `${val}px`;
            if (propName === 'textAlign') el.style.textAlign = val;
            if (propName === 'width') el.style.width = val;
            if (propName === 'maxWidth') el.style.maxWidth = val;
            if (propName === 'height') el.style.height = val;
            if (propName === 'minHeight') el.style.minHeight = val;
            if (propName === 'padding') el.style.padding = val;
            if (propName === 'margin') el.style.margin = val;
          });
        }
      } catch (err) {}
    }

    syncIframeTheme(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      await saveSiteCustomizer(themeData);
      applyCustomTheme(themeData);
      syncIframeTheme();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('[VisualPageEditor] Save failed:', err);
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all colors, font scales, dimensions, and written copy to default branding?')) {
      return;
    }
    try {
      setSaving(true);
      setThemeData(DEFAULT_THEME_SETTINGS);
      applyCustomTheme(DEFAULT_THEME_SETTINGS);
      syncIframeTheme(DEFAULT_THEME_SETTINGS);
      await saveSiteCustomizer(DEFAULT_THEME_SETTINGS);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('[VisualPageEditor] Reset failed:', err);
      alert('Reset failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const PAGE_OPTIONS = [
    { id: 'home', label: 'Homepage', path: '/' },
    { id: 'custom-woven', label: 'Custom Woven Sarees', path: '/custom-woven' },
    { id: 'partner', label: 'Partner & Reseller Program', path: '/partner' },
    { id: 'dropshipping', label: 'Dropshipping Program', path: '/dropshipping' },
    { id: 'affiliate-program', label: 'Affiliate Program', path: '/affiliate-program' },
    { id: 'sourcing-partners', label: 'Sourcing & White Label', path: '/sourcing-partners' },
    { id: 'handloom-vs-powerloom-guide', label: 'Weave Comparison Guide', path: '/handloom-vs-powerloom-guide' },
    { id: 'weaver-onboarding', label: 'Weaver Onboarding', path: '/weaver-onboarding' },
    { id: 'early-access', label: 'Early Access Page', path: '/early-access' },
    { id: 'about', label: 'About Us', path: '/about' },
    { id: 'contact', label: 'Contact Us', path: '/contact' },
    { id: 'terms-conditions', label: 'Terms & Conditions', path: '/terms-conditions' },
    { id: 'global-theme', label: '🎨 Global Colors & Typography', path: '/' },
  ];

  const activePageObj = PAGE_OPTIONS.find(p => p.id === activePage) || PAGE_OPTIONS[0];

  const numericWidth = typeof viewportWidth === 'number' ? viewportWidth : 1440;
  const numericHeight = typeof viewportHeight === 'number' ? viewportHeight : 900;

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
        <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 12px' }} />
        <p style={{ fontWeight: '500' }}>Initializing Visual WYSIWYG Page Editor...</p>
      </div>
    );
  }

  return (
    <div className="visual-page-editor-root" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
      
      {/* 1. Chrome DevTools Style Responsive Control Toolbar */}
      <div style={{ background: '#1e293b', padding: '10px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Left: Page Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#b78646', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} />
            Visual Page Editor
          </span>

          <select
            value={activePage}
            onChange={(e) => setActivePage(e.target.value)}
            style={{
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #475569',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {PAGE_OPTIONS.map((page) => (
              <option key={page.id} value={page.id}>
                Page: {page.label}
              </option>
            ))}
          </select>
        </div>

        {/* Center: Chrome DevTools Device & Manual Resolution Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', padding: '4px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
          
          {/* Device Preset Dropdown */}
          <select
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            style={{
              background: 'transparent',
              color: '#38bdf8',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {DEVICE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                {preset.label}
              </option>
            ))}
          </select>

          <span style={{ color: '#475569', fontSize: '12px' }}>|</span>

          {/* Width Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>W:</span>
            <input
              type="text"
              value={viewportWidth}
              onChange={(e) => handleWidthInput(e.target.value)}
              placeholder="Width"
              style={{
                width: '52px',
                background: '#1e293b',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '12px',
                textAlign: 'center',
                outline: 'none',
              }}
            />
          </div>

          <span style={{ color: '#64748b', fontSize: '12px' }}>×</span>

          {/* Height Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>H:</span>
            <input
              type="text"
              value={viewportHeight}
              onChange={(e) => handleHeightInput(e.target.value)}
              placeholder="Height"
              style={{
                width: '52px',
                background: '#1e293b',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '12px',
                textAlign: 'center',
                outline: 'none',
              }}
            />
          </div>

          {/* Orientation Rotate Button */}
          <button
            onClick={handleRotateOrientation}
            title="Rotate Orientation (Landscape / Portrait)"
            style={{
              background: isRotated ? '#b78646' : 'transparent',
              color: isRotated ? '#ffffff' : '#94a3b8',
              border: 'none',
              padding: '4px 6px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RotateCw size={13} />
          </button>

          <span style={{ color: '#475569', fontSize: '12px' }}>|</span>

          {/* DevTools Auto Scale / Zoom Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ZoomIn size={13} color="#b78646" />
            <select
              value={zoomMode}
              onChange={(e) => setZoomMode(e.target.value)}
              style={{
                background: 'transparent',
                color: '#cbd5e1',
                border: 'none',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="auto" style={{ background: '#0f172a' }}>
                Fit ({Math.round(scaleRatio * 100)}%)
              </option>
              <option value="1" style={{ background: '#0f172a' }}>100%</option>
              <option value="0.75" style={{ background: '#0f172a' }}>75%</option>
              <option value="0.5" style={{ background: '#0f172a' }}>50%</option>
              <option value="0.25" style={{ background: '#0f172a' }}>25%</option>
            </select>
          </div>

        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReset}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            Reset
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: saveSuccess ? '#16a34a' : '#b78646',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {saving ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : saveSuccess ? (
              <Check size={13} />
            ) : (
              <Save size={13} />
            )}
            {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Customizations'}
          </button>
        </div>
      </div>

      {/* 2. Split Main Viewport */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Left 68%: Live Interactive Website Preview Canvas */}
        <div
          ref={previewAreaRef}
          style={{
            flex: '0 0 68%',
            background: '#090d16',
            padding: '16px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          
          {/* Scaled Frame Box Wrapper */}
          <div
            style={{
              width: `${numericWidth}px`,
              transform: scaleRatio !== 1 ? `scale(${scaleRatio})` : 'none',
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease, width 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: scaleRatio !== 1 ? `${Math.round(100 / scaleRatio)}%` : '100%',
            }}
          >
            {/* Top Canvas Device Bar */}
            <div style={{ background: '#b78646', color: '#ffffff', fontSize: '12px', padding: '6px 12px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', fontWeight: '500', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={13} />
                Live Website Render: {activePageObj.label} ({numericWidth} × {numericHeight}px {scaleRatio !== 1 ? `· Scaled ${Math.round(scaleRatio * 100)}%` : ''})
              </span>
              <a href={activePageObj.path} target="_blank" rel="noopener noreferrer" style={{ color: '#ffffff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                Open in New Tab <ExternalLink size={11} />
              </a>
            </div>

            {/* Website iFrame Container */}
            <div
              style={{
                width: '100%',
                height: `${numericHeight}px`,
                background: '#ffffff',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <iframe
                ref={iframeRef}
                src={activePageObj.path}
                title={`Live Preview of ${activePageObj.label}`}
                onLoad={() => syncIframeTheme()}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#ffffff',
                }}
              />
            </div>
          </div>

        </div>

        {/* Right 32%: Control Inspector Sidebar */}
        <div style={{ flex: '0 0 32%', background: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {activePage === 'global-theme' ? (
            /* Global Theme Controls */
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#f8fafc', fontWeight: '700', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Palette size={18} color="#b78646" />
                Global Theme & Colors
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <SidebarColorPicker
                  label="Primary Brand Color"
                  varName="--brand-primary"
                  value={themeData.colors['--brand-primary']}
                  onChange={handleColorChange}
                />
                <SidebarColorPicker
                  label="Secondary / Dark Navy"
                  varName="--brand-secondary"
                  value={themeData.colors['--brand-secondary']}
                  onChange={handleColorChange}
                />
                <SidebarColorPicker
                  label="Page Background"
                  varName="--page-bg"
                  value={themeData.colors['--page-bg']}
                  onChange={handleColorChange}
                />
                <SidebarColorPicker
                  label="Surface / Card Background"
                  varName="--surface-bg"
                  value={themeData.colors['--surface-bg']}
                  onChange={handleColorChange}
                />
                <SidebarColorPicker
                  label="Heading Text Color"
                  varName="--text-heading"
                  value={themeData.colors['--text-heading']}
                  onChange={handleColorChange}
                />
                <SidebarColorPicker
                  label="Body Text Color"
                  varName="--text-body"
                  value={themeData.colors['--text-body']}
                  onChange={handleColorChange}
                />
                <SidebarColorPicker
                  label="Accent Gold Color"
                  varName="--accent-gold"
                  value={themeData.colors['--accent-gold']}
                  onChange={handleColorChange}
                />

                <hr style={{ borderColor: '#334155', margin: '12px 0' }} />

                <h4 style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Type size={16} color="#b78646" />
                  Global Base Font Sizes (in Pixels)
                </h4>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Base Body Font Size</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="8"
                        max="100"
                        value={parseInt(themeData.typography['--body-size'] || 16, 10)}
                        onChange={(e) => handleTypographyChange('--body-size', `${e.target.value}px`)}
                        style={{ width: '52px', background: '#0f172a', color: '#b78646', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="28"
                    step="1"
                    value={parseInt(themeData.typography['--body-size'] || 16, 10)}
                    onChange={(e) => handleTypographyChange('--body-size', `${e.target.value}px`)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Heading 1 (H1) Size</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="16"
                        max="200"
                        value={parseInt(themeData.typography['--h1-size'] || 56, 10)}
                        onChange={(e) => handleTypographyChange('--h1-size', `${e.target.value}px`)}
                        style={{ width: '52px', background: '#0f172a', color: '#b78646', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="96"
                    step="2"
                    value={parseInt(themeData.typography['--h1-size'] || 56, 10)}
                    onChange={(e) => handleTypographyChange('--h1-size', `${e.target.value}px`)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Heading 2 (H2) Size</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="12"
                        max="150"
                        value={parseInt(themeData.typography['--h2-size'] || 36, 10)}
                        onChange={(e) => handleTypographyChange('--h2-size', `${e.target.value}px`)}
                        style={{ width: '52px', background: '#0f172a', color: '#b78646', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', fontWeight: '700', textAlign: 'center', outline: 'none' }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="64"
                    step="2"
                    value={parseInt(themeData.typography['--h2-size'] || 36, 10)}
                    onChange={(e) => handleTypographyChange('--h2-size', `${e.target.value}px`)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Universal Click Inspector */
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#0f172a', borderRadius: '8px', border: '1px solid #334155', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Item vs Container Section Target Switcher */}
                <div style={{ background: '#1e293b', padding: '4px', borderRadius: '6px', display: 'flex', gap: '4px', border: '1px solid #334155' }}>
                  <button
                    onClick={() => handleTargetTypeSwitch('item')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      background: targetType === 'item' ? '#b78646' : 'transparent',
                      color: targetType === 'item' ? '#ffffff' : '#94a3b8',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Box size={13} />
                    Clicked Item
                  </button>

                  <button
                    onClick={() => handleTargetTypeSwitch('container')}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: 'none',
                      background: targetType === 'container' ? '#b78646' : 'transparent',
                      color: targetType === 'container' ? '#ffffff' : '#94a3b8',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <Layers size={13} />
                    Parent Section
                  </button>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '1px', color: '#b78646', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    Target: {targetType === 'container' ? 'Parent Section' : 'Selected Item'}
                  </span>
                  <h4 style={{ fontSize: '13px', color: '#38bdf8', margin: 0, fontWeight: '600', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {activeElementMeta.label || 'Click Any Element on Preview Canvas'}
                  </h4>
                </div>

                {/* 1. Written Copy */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: '500' }}>
                    Written Text Content:
                  </label>
                  <textarea
                    rows={4}
                    value={activeElementMeta.text}
                    placeholder="Click any text element on the left preview to edit..."
                    onChange={(e) => handleUniversalDomOverride('text', e.target.value)}
                    style={{
                      width: '100%',
                      background: '#1e293b',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      lineHeight: '1.5',
                    }}
                  />
                </div>

                {/* 2. Text Color Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1e293b', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
                      Element Text Color
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ position: 'relative', width: '26px', height: '26px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #475569', background: activeElementMeta.color }}>
                        <input
                          type="color"
                          value={activeElementMeta.color || '#1a1a1a'}
                          onChange={(e) => handleUniversalDomOverride('color', e.target.value)}
                          style={{ position: 'absolute', top: '-10px', left: '-10px', width: '50px', height: '50px', cursor: 'pointer', opacity: 0 }}
                        />
                      </div>
                      <input
                        type="text"
                        value={activeElementMeta.color}
                        onChange={(e) => handleUniversalDomOverride('color', e.target.value)}
                        style={{ width: '68px', background: '#0f172a', color: '#38bdf8', border: '1px solid #475569', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Quick Swatches */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', tracking: '0.5px' }}>Presets:</span>
                    {['#b78646', '#0F172A', '#1a1a1a', '#ffffff', '#064e3b', '#780016', '#c69e6a'].map(hex => (
                      <button
                        key={hex}
                        onClick={() => handleUniversalDomOverride('color', hex)}
                        title={`Apply ${hex}`}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: hex,
                          border: activeElementMeta.color?.toLowerCase() === hex.toLowerCase() ? '2px solid #38bdf8' : '1px solid #475569',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 3. Font Size (px) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Element Font Size (in Pixels)</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        min="8"
                        max="200"
                        value={activeElementMeta.fontSize || 16}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          handleUniversalDomOverride('fontSize', `${isNaN(val) ? 16 : val}px`);
                        }}
                        style={{
                          width: '56px',
                          background: '#0f172a',
                          color: '#b78646',
                          border: '1px solid #475569',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="96"
                    step="1"
                    value={activeElementMeta.fontSize || 16}
                    onChange={(e) => handleUniversalDomOverride('fontSize', `${e.target.value}px`)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                {/* 4. Text Alignment */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px', fontWeight: '500' }}>
                    Text Alignment
                  </label>
                  <div style={{ display: 'flex', gap: '6px', background: '#1e293b', padding: '3px', borderRadius: '6px', border: '1px solid #334155' }}>
                    {[
                      { id: 'left', icon: AlignLeft, label: 'Left' },
                      { id: 'center', icon: AlignCenter, label: 'Center' },
                      { id: 'right', icon: AlignRight, label: 'Right' },
                    ].map((align) => {
                      const isSelected = activeElementMeta.textAlign === align.id;
                      const Icon = align.icon;
                      return (
                        <button
                          key={align.id}
                          onClick={() => handleUniversalDomOverride('textAlign', align.id)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            border: 'none',
                            background: isSelected ? '#b78646' : 'transparent',
                            color: isSelected ? '#ffffff' : '#94a3b8',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <Icon size={13} />
                          {align.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr style={{ borderColor: '#334155', margin: '4px 0' }} />

                {/* 5. Box Model & Dimensions Controls (Width, Height, Spacing) */}
                <h4 style={{ fontSize: '13px', color: '#38bdf8', margin: '0 0 4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Maximize2 size={15} color="#b78646" />
                  Dimensions & Box Layout
                </h4>

                {/* Max-Width Control */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
                      Max Width
                    </label>
                    <input
                      type="text"
                      value={activeElementMeta.maxWidth || '100%'}
                      placeholder="e.g. 800px / 100%"
                      onChange={(e) => handleUniversalDomOverride('maxWidth', e.target.value)}
                      style={{
                        width: '90px',
                        background: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {/* Preset Width Buttons */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {['100%', '1200px', '800px', '600px', 'auto'].map(presetW => (
                      <button
                        key={presetW}
                        onClick={() => handleUniversalDomOverride('maxWidth', presetW)}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          background: activeElementMeta.maxWidth === presetW ? '#b78646' : '#1e293b',
                          color: activeElementMeta.maxWidth === presetW ? '#ffffff' : '#94a3b8',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {presetW}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Height / Min-Height Control */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
                      Min Height
                    </label>
                    <input
                      type="text"
                      value={activeElementMeta.minHeight || 'auto'}
                      placeholder="e.g. 400px / auto"
                      onChange={(e) => handleUniversalDomOverride('minHeight', e.target.value)}
                      style={{
                        width: '90px',
                        background: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {/* Preset Height Buttons */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {['auto', '200px', '400px', '600px', '100vh'].map(presetH => (
                      <button
                        key={presetH}
                        onClick={() => handleUniversalDomOverride('minHeight', presetH)}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          background: activeElementMeta.minHeight === presetH ? '#b78646' : '#1e293b',
                          color: activeElementMeta.minHeight === presetH ? '#ffffff' : '#94a3b8',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {presetH}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Padding Control */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
                      Container Padding
                    </label>
                    <input
                      type="text"
                      value={activeElementMeta.padding || '0px'}
                      placeholder="e.g. 20px 40px"
                      onChange={(e) => handleUniversalDomOverride('padding', e.target.value)}
                      style={{
                        width: '90px',
                        background: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {/* Preset Padding Buttons */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    {['0px', '12px 24px', '24px 48px', '40px 60px', '60px 80px'].map(presetP => (
                      <button
                        key={presetP}
                        onClick={() => handleUniversalDomOverride('padding', presetP)}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          background: activeElementMeta.padding === presetP ? '#b78646' : '#1e293b',
                          color: activeElementMeta.padding === presetP ? '#ffffff' : '#94a3b8',
                          border: '1px solid #334155',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {presetP}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Instructions Callout */}
              <div style={{ background: '#0f172a', border: '1px dashed #334155', padding: '14px', borderRadius: '8px', color: '#94a3b8', fontSize: '12px', lineHeight: '1.5' }}>
                <strong style={{ color: '#b78646', display: 'block', marginBottom: '4px' }}>💡 Width, Height & Container Styling</strong>
                Switch between <strong>Clicked Item</strong> and <strong>Parent Section</strong> above to customize width, min-height, padding, and wording across any element or container section!
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SidebarColorPicker({ label, varName, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', padding: '10px 12px', borderRadius: '6px' }}>
      <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #475569', background: value || '#000000' }}>
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(varName, e.target.value)}
            style={{ position: 'absolute', top: '-10px', left: '-10px', width: '45px', height: '45px', cursor: 'pointer', opacity: 0 }}
          />
        </div>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(varName, e.target.value)}
          style={{ width: '68px', background: '#1e293b', color: '#38bdf8', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
        />
      </div>
    </div>
  );
}
