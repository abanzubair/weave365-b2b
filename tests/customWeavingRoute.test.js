import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { NON_PRODUCT_ROUTES } from '../src/config.js';
import { ROUTE_FIRST_IMAGES, seoOverrideForPath, getSeoMetadata } from '../src/utils/seoHelper.js';
import nextConfig from '../next.config.js';

describe('Custom Weaving Route Migration & 301/308 Permanent Redirect', () => {

  test('Requirement 1: next.config.js contains permanent redirect from /custom-woven to /custom-weaving', async () => {
    assert(typeof nextConfig.redirects === 'function', 'nextConfig must have redirects function');
    const redirects = await nextConfig.redirects();
    const redirect = redirects.find(r => r.source === '/custom-woven');
    assert(redirect, 'Redirect from /custom-woven must exist in nextConfig.redirects');
    assert.strictEqual(redirect.destination, '/custom-weaving');
    assert.strictEqual(redirect.permanent, true, 'Redirect must be permanent (308/301)');
  });

  test('Requirement 2: NON_PRODUCT_ROUTES contains custom-weaving and retains custom-woven for legacy protection', () => {
    assert(NON_PRODUCT_ROUTES.has('custom-weaving'), 'NON_PRODUCT_ROUTES must contain custom-weaving');
    assert(NON_PRODUCT_ROUTES.has('custom-woven'), 'NON_PRODUCT_ROUTES must retain custom-woven');
  });

  test('Requirement 3: ROUTE_FIRST_IMAGES contains /custom-weaving image mapping', () => {
    assert.strictEqual(ROUTE_FIRST_IMAGES['/custom-weaving'], '/banarasi_loom_detail.webp');
    assert.strictEqual(ROUTE_FIRST_IMAGES['/custom-woven'], '/banarasi_loom_detail.webp');
  });

  test('Requirement 4: seoOverrideForPath supports direct match and legacy alias fallback', () => {
    const mockSettingsDirect = [
      { path: '/custom-weaving', metaTitle: 'Direct Weaving Title', canonicalPath: '/custom-weaving' },
    ];
    const matchDirect = seoOverrideForPath(mockSettingsDirect, '/custom-weaving');
    assert(matchDirect, 'Should match /custom-weaving directly');
    assert.strictEqual(matchDirect.metaTitle, 'Direct Weaving Title');

    const mockSettingsLegacy = [
      { path: '/custom-woven', metaTitle: 'Legacy Woven Title', canonicalPath: '/custom-woven' },
    ];
    const matchFallback = seoOverrideForPath(mockSettingsLegacy, '/custom-weaving');
    assert(matchFallback, 'Should fall back to /custom-woven row if /custom-weaving row is not present');
    assert.strictEqual(matchFallback.metaTitle, 'Legacy Woven Title');
  });

  test('Requirement 5: getSeoMetadata normalizes legacy /custom-woven canonical to /custom-weaving', async () => {
    const meta = await getSeoMetadata('/custom-weaving', {
      alternates: { canonical: 'https://www.weave365.com/custom-woven' },
    });
    assert.strictEqual(meta.alternates.canonical, 'https://www.weave365.com/custom-weaving');
  });

  test('Requirement 6: sitemapHandler.js includes /custom-weaving and excludes /custom-woven', () => {
    const sitemapContent = fs.readFileSync(path.resolve('app/api/[[...route]]/sitemapHandler.js'), 'utf8');
    assert(sitemapContent.includes('/custom-weaving'), 'sitemapHandler must include /custom-weaving');
    assert(!sitemapContent.includes('/custom-woven'), 'sitemapHandler must not include /custom-woven');
  });

  test('Requirement 7: VisualPageEditor keeps id: custom-woven and updates path to /custom-weaving', () => {
    const editorContent = fs.readFileSync(path.resolve('src/components/admin/VisualPageEditor.jsx'), 'utf8');
    assert(
      editorContent.includes("{ id: 'custom-woven', label: 'Custom Woven Sarees', path: '/custom-weaving' }"),
      'VisualPageEditor must keep id custom-woven and point path to /custom-weaving'
    );
  });

  test('Requirement 8: Navigation components and pages link to /custom-weaving', () => {
    const headerContent = fs.readFileSync(path.resolve('src/components/SiteHeader.jsx'), 'utf8');
    assert(headerContent.includes('to="custom-weaving" href="/custom-weaving"'));
    assert(headerContent.includes('to="custom-weaving#weaving-techniques"'));
    assert(headerContent.includes('href="/custom-weaving#weaving-techniques"'));

    const mobileContent = fs.readFileSync(path.resolve('src/components/MobileMenu.jsx'), 'utf8');
    assert(mobileContent.includes('to="custom-weaving" href="/custom-weaving"'));
    assert(mobileContent.includes('to="custom-weaving#weaving-techniques"'));
    assert(mobileContent.includes('href="/custom-weaving#weaving-techniques"'));

    const footerContent = fs.readFileSync(path.resolve('src/components/Footer.jsx'), 'utf8');
    assert(footerContent.includes('to="custom-weaving" href="/custom-weaving"'));

    const privateLabelContent = fs.readFileSync(path.resolve('src/components/PrivateLabelSection.jsx'), 'utf8');
    assert(privateLabelContent.includes('to="custom-weaving"'));
    assert(privateLabelContent.includes('href="/custom-weaving"'));

    const segContent = fs.readFileSync(path.resolve('src/components/CustomerSegmentation.jsx'), 'utf8');
    assert(segContent.includes("route: 'custom-weaving'"));
    assert(segContent.includes("href: '/custom-weaving'"));

    const navContent = fs.readFileSync(path.resolve('src/hooks/useAppNavigate.js'), 'utf8');
    assert(navContent.includes("nextRoute === 'custom-woven'"));
    assert(navContent.includes("href = '/custom-weaving'"));

    const newPageContent = fs.readFileSync(path.resolve('app/custom-weaving/page.jsx'), 'utf8');
    assert(newPageContent.includes("canonical: `${siteUrl}/custom-weaving`"));
    assert(newPageContent.includes("getSeoMetadata('/custom-weaving'"));

    const oldPageContent = fs.readFileSync(path.resolve('app/custom-woven/page.jsx'), 'utf8');
    assert(oldPageContent.includes("permanentRedirect('/custom-weaving')"));
  });

});
