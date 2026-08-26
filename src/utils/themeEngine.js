/**
 * Theme Engine — Client Self-Service Customization Helper
 * Applies custom CSS properties and content overrides dynamically.
 */

export const DEFAULT_THEME_SETTINGS = {
  colors: {
    '--brand-primary': '#b78646',
    '--brand-secondary': '#0F172A',
    '--page-bg': '#ffffff',
    '--surface-bg': '#fafafa',
    '--text-heading': '#000000',
    '--text-body': '#1a1a1a',
    '--accent-gold': '#c69e6a',
  },
  typography: {
    '--body-size': '16px',
    '--h1-size': '44px',
    '--h2-size': '32px',
  },
  elementStyles: {},
  content: {},
  domOverrides: {}
};

/**
 * Apply CSS variable overrides to document root
 * @param {Object} themeData - Customizer object containing colors and typography
 */
export function applyCustomTheme(themeData) {
  if (typeof window === 'undefined' || !document || !document.documentElement) {
    return;
  }

  const apply = () => {
    const colors = themeData?.colors || DEFAULT_THEME_SETTINGS.colors;
    const typography = themeData?.typography || DEFAULT_THEME_SETTINGS.typography;

    // Apply colors
    Object.entries(colors).forEach(([varName, colorVal]) => {
      if (colorVal) {
        document.documentElement.style.setProperty(varName, colorVal);
      }
    });

    // Apply typography pixel font sizes
    Object.entries(typography).forEach(([varName, val]) => {
      if (val) {
        const pxVal = typeof val === 'number' ? `${val}px` : String(val).endsWith('px') ? val : `${val}px`;
        document.documentElement.style.setProperty(varName, pxVal);
      }
    });

    // Apply element specific styles
    if (themeData?.elementStyles) {
      Object.entries(themeData.elementStyles).forEach(([key, styleObj]) => {
        const elements = document.querySelectorAll(`[data-editable-key="${key}"]`);
        elements.forEach(el => {
          if (styleObj.color) el.style.color = styleObj.color;
          if (styleObj.fontSize) el.style.fontSize = typeof styleObj.fontSize === 'number' ? `${styleObj.fontSize}px` : styleObj.fontSize;
          if (styleObj.textAlign) el.style.textAlign = styleObj.textAlign;
        });
      });
    }

    // Apply written copy content overrides to live website elements
    if (themeData?.content) {
      Object.entries(themeData.content).forEach(([key, customText]) => {
        if (customText === undefined || customText === '') return;
        const elements = document.querySelectorAll(`[data-editable-key="${key}"]`);
        elements.forEach(el => {
          if (el.innerText !== customText) {
            el.innerText = customText;
          }
        });
      });
    }

    // Apply Universal DOM Overrides by CSS selector across all website pages
    if (themeData?.domOverrides) {
      Object.entries(themeData.domOverrides).forEach(([selector, styles]) => {
        try {
          // Ignore legacy un-scoped legal overrides that leak across pages
          if (
            (selector.includes('legal-page-container') || selector.includes('legal-content-card') || selector.includes('legal-sidebar') || selector.includes('legal-text-content')) &&
            !selector.includes('data-page-id')
          ) {
            return;
          }
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (styles.text !== undefined && styles.text !== '') el.innerText = styles.text;
            if (styles.color) el.style.color = styles.color;
            if (styles.fontSize) el.style.fontSize = typeof styles.fontSize === 'number' ? `${styles.fontSize}px` : styles.fontSize;
            if (styles.textAlign) el.style.textAlign = styles.textAlign;
            if (styles.width) el.style.width = styles.width;
            if (styles.maxWidth) el.style.maxWidth = styles.maxWidth;
            if (styles.height) el.style.height = styles.height;
            if (styles.minHeight) el.style.minHeight = styles.minHeight;
            if (styles.padding) el.style.padding = styles.padding;
            if (styles.margin) el.style.margin = styles.margin;
          });
        } catch (err) {}
      });
    }
  };

  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(apply);
  } else {
    apply();
  }
}

/**
 * Get dynamic custom content or fallback to default
 * @param {Object} themeData - Customizer data loaded from Supabase
 * @param {string} key - Content field key
 * @param {string} defaultText - Fallback default text
 */
export function getCustomContent(themeData, key, defaultText) {
  if (themeData?.content?.[key] && themeData.content[key].trim() !== '') {
    return themeData.content[key];
  }
  return defaultText;
}
