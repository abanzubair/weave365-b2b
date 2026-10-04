import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('MobileMenu Icon Imports & Regression Tests', () => {
  const mobileMenuPath = path.join(rootDir, 'src/components/MobileMenu.jsx');
  const siteHeaderPath = path.join(rootDir, 'src/components/SiteHeader.jsx');
  const iconsPath = path.join(rootDir, 'src/components/icons.jsx');
  const layoutCssPath = path.join(rootDir, 'src/styles/layout.css');
  const componentsCssPath = path.join(rootDir, 'src/styles/components.css');

  const mobileMenuContent = fs.readFileSync(mobileMenuPath, 'utf8');
  const siteHeaderContent = fs.readFileSync(siteHeaderPath, 'utf8');
  const iconsContent = fs.readFileSync(iconsPath, 'utf8');
  const layoutCssContent = fs.readFileSync(layoutCssPath, 'utf8');
  const componentsCssContent = fs.readFileSync(componentsCssPath, 'utf8');

  test('Requirement 1: LogOut is imported from ./icons.jsx in MobileMenu.jsx', () => {
    const importMatch = mobileMenuContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/icons(?:\.jsx)?['"]/);
    assert(importMatch, 'MobileMenu.jsx must import icons from ./icons.jsx');
    
    const importedIcons = importMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    assert(importedIcons.includes('LogOut'), 'LogOut must be imported from ./icons.jsx');
  });

  test('Requirement 2: All icons imported in MobileMenu.jsx are exported by icons.jsx', () => {
    const importMatch = mobileMenuContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/icons(?:\.jsx)?['"]/);
    assert(importMatch, 'MobileMenu.jsx must import icons from ./icons.jsx');

    const importedIcons = importMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const exportRegex = /export\s+const\s+([A-Za-z0-9_]+)\s*=/g;
    const exportedIcons = new Set();
    let match;
    while ((match = exportRegex.exec(iconsContent)) !== null) {
      exportedIcons.add(match[1]);
    }

    for (const icon of importedIcons) {
      assert(
        exportedIcons.has(icon),
        `Icon "${icon}" imported in MobileMenu.jsx is not exported by icons.jsx`
      );
    }
  });

  test('Requirement 3: Every JSX component used in MobileMenu.jsx has a corresponding import', () => {
    // Find all JSX tags starting with an uppercase letter
    const jsxTagRegex = /<([A-Z][A-Za-z0-9]+)/g;
    const usedComponents = new Set();
    let match;
    while ((match = jsxTagRegex.exec(mobileMenuContent)) !== null) {
      usedComponents.add(match[1]);
    }

    // Find all imported identifiers in MobileMenu.jsx
    const importedIdentifiers = new Set();

    // Default imports: import Foo from '...'
    const defaultImportRegex = /import\s+([A-Za-z0-9_]+)\s+from/g;
    while ((match = defaultImportRegex.exec(mobileMenuContent)) !== null) {
      importedIdentifiers.add(match[1]);
    }

    // Named imports: import { Foo, Bar as Baz } from '...'
    const namedImportBlockRegex = /import\s*\{([^}]+)\}\s*from/g;
    while ((match = namedImportBlockRegex.exec(mobileMenuContent)) !== null) {
      const names = match[1].split(',').map(s => s.trim()).filter(Boolean);
      for (const name of names) {
        const parts = name.split(/\s+as\s+/);
        const importedAs = (parts[1] || parts[0]).trim();
        importedIdentifiers.add(importedAs);
      }
    }

    // Ensure every used component is in importedIdentifiers or defined locally in MobileMenu.jsx
    for (const component of usedComponents) {
      const isImported = importedIdentifiers.has(component);
      const isLocallyDefined = new RegExp(`(?:function|const|let|var|class)\\s+${component}\\b`).test(mobileMenuContent);
      assert(
        isImported || isLocallyDefined,
        `Component <${component}> is used in MobileMenu.jsx but neither imported nor locally defined!`
      );
    }
  });

  test('Requirement 4: Authenticated user menu branch references LogOut without undefined reference', () => {
    // Ensure the authenticated ternary branch contains LogOut
    const userBranchMatch = mobileMenuContent.match(/user\s*\?\s*\[([\s\S]*?)\]\s*:\s*\[([\s\S]*?)\]/);
    assert(userBranchMatch, 'MobileMenu.jsx should have user ? [...] : [...] branch for account menu');

    const authBranch = userBranchMatch[1];
    const guestBranch = userBranchMatch[2];

    assert(authBranch.includes('LogOut'), 'Authenticated branch must contain LogOut');
    assert(authBranch.includes('Account Details'), 'Authenticated branch must contain Account Details');
    assert(guestBranch.includes('Login / Register'), 'Guest branch must contain Login / Register');
  });

  test('Requirement 5: Sliding drill-down track is absolutely positioned and immune to flex shrinkage', () => {
    // Check .mobile-panels-viewport
    const viewportMatch = layoutCssContent.match(/\.mobile-panels-viewport\s*\{([^}]+)\}/);
    assert(viewportMatch, '.mobile-panels-viewport rule must exist in layout.css');
    const viewportRules = viewportMatch[1];
    assert(!viewportRules.includes('display: flex'), '.mobile-panels-viewport must NOT be display: flex to prevent flexbox shrinking');
    assert(viewportRules.includes('overflow: hidden'), '.mobile-panels-viewport must have overflow: hidden');
    assert(viewportRules.includes('position: relative'), '.mobile-panels-viewport must have position: relative');

    // Check .mobile-panels-track
    const trackMatch = layoutCssContent.match(/\.mobile-panels-track\s*\{([^}]+)\}/);
    assert(trackMatch, '.mobile-panels-track rule must exist in layout.css');
    const trackRules = trackMatch[1];
    assert(trackRules.includes('position: absolute'), '.mobile-panels-track must be position: absolute');
    assert(trackRules.includes('width: 200%'), '.mobile-panels-track must have width: 200%');
    assert(trackRules.includes('transform: translate3d(0, 0, 0)'), '.mobile-panels-track must use GPU translate3d');

    // Check .mobile-panel width
    const panelMatch = layoutCssContent.match(/\.mobile-panel\s*\{([^}]+)\}/);
    assert(panelMatch, '.mobile-panel rule must exist in layout.css');
    const panelRules = panelMatch[1];
    assert(panelRules.includes('flex: 0 0 50%') || panelRules.includes('width: 50%'), '.mobile-panel must occupy 50% of the 200% track (100vw)');
  });

  test('Requirement 6: MobileMenu panels have proper aria-hidden accessibility toggles', () => {
    assert(
      mobileMenuContent.includes('className="mobile-panel mobile-panel-root" aria-hidden={activeSubpanel !== null}'),
      'Root panel must have aria-hidden={activeSubpanel !== null}'
    );
    assert(
      mobileMenuContent.includes('className="mobile-panel mobile-panel-sub" aria-hidden={activeSubpanel === null}'),
      'Subpanel must have aria-hidden={activeSubpanel === null}'
    );
  });

  test('Requirement 7: Mobile account and country dropdown has strict overflow and visibility clipping when closed', () => {
    const accountItemsMatch = layoutCssContent.match(/\.mobile-account-items\s*\{([^}]+)\}/);
    assert(accountItemsMatch, '.mobile-account-items rule must exist in layout.css');
    const rules = accountItemsMatch[1];
    assert(rules.includes('overflow: hidden'), '.mobile-account-items must have overflow: hidden to prevent content leakage');
    assert(rules.includes('visibility: hidden'), '.mobile-account-items must have visibility: hidden when collapsed');
  });

  test('Requirement 8: Mobile menu footer uses Phone and Mail icons for contact links', () => {
    assert(mobileMenuContent.includes('<Phone size={15} />'), 'Footer phone link must use <Phone /> icon');
    assert(mobileMenuContent.includes('<Mail size={15} />'), 'Footer email link must use <Mail /> icon');
  });

  test('Requirement 9: SiteHeader imports Bars3Icon and X from ./icons.jsx', () => {
    const importMatch = siteHeaderContent.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/icons(?:\.jsx)?['"]/);
    assert(importMatch, 'SiteHeader.jsx must import icons from ./icons.jsx');
    const importedIcons = importMatch[1].split(',').map(s => s.trim());
    assert(importedIcons.includes('Bars3Icon'), 'SiteHeader must import Bars3Icon from ./icons.jsx');
    assert(importedIcons.includes('X'), 'SiteHeader must import X from ./icons.jsx');
  });

  test('Requirement 10: SiteHeader renders hamburger-box with Bars3Icon and X for smooth animation', () => {
    assert(siteHeaderContent.includes('className="hamburger-icon-bars"'), 'SiteHeader must include Bars3Icon with className hamburger-icon-bars');
    assert(siteHeaderContent.includes('className="hamburger-icon-cross"'), 'SiteHeader must include X with className hamburger-icon-cross');
    assert(componentsCssContent.includes('.hamburger-box'), 'components.css must define .hamburger-box wrapper');
    assert(componentsCssContent.includes('.hamburger-btn.is-active .hamburger-icon-bars'), 'components.css must define active state for bars');
    assert(componentsCssContent.includes('.hamburger-btn.is-active .hamburger-icon-cross'), 'components.css must define active state for cross');
  });
});

