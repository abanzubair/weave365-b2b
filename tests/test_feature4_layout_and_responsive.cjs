const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = '/home/aban/.gemini/antigravity/brain/3cc23b6f-8993-4e37-b368-356b35bc5249/scratch/screenshots';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  const errors = [];
  const warnings = [];

  function attachListeners(page, label) {
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        errors.push({ label, text });
      } else if (type === 'warning') {
        warnings.push({ label, text });
      }
    });
    page.on('pageerror', err => {
      errors.push({ label, text: `PAGE ERROR: ${err.message}` });
    });
  }

  console.log('=== TEST 4: Layout & Responsive Checks ===');

  // --- 1. Desktop Tests ---
  const dPage = await desktopContext.newPage();
  attachListeners(dPage, 'desktop');

  console.log('1. Checking Desktop Home layout...');
  await dPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Check horizontal overflow
  const dHomeOverflow = await dPage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Desktop Home has horizontal overflow?', dHomeOverflow);
  await dPage.screenshot({ path: path.join(SCREENSHOT_DIR, '16_desktop_home_layout.png') });

  console.log('2. Checking Desktop ProductPage layout...');
  await dPage.goto('http://localhost:3000/saree/121015', { waitUntil: 'networkidle' });
  const dProdOverflow = await dPage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Desktop ProductPage has horizontal overflow?', dProdOverflow);
  await dPage.screenshot({ path: path.join(SCREENSHOT_DIR, '17_desktop_product_layout.png') });

  console.log('3. Checking Desktop Checkout layout...');
  await dPage.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });
  const dCheckoutOverflow = await dPage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Desktop Checkout has horizontal overflow?', dCheckoutOverflow);
  await dPage.screenshot({ path: path.join(SCREENSHOT_DIR, '18_desktop_checkout_layout.png') });

  // --- 2. Mobile Tests ---
  const mPage = await mobileContext.newPage();
  attachListeners(mPage, 'mobile');

  console.log('4. Checking Mobile Home layout...');
  await mPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const mHomeOverflow = await mPage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Mobile Home has horizontal overflow?', mHomeOverflow);
  await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, '19_mobile_home_layout.png') });

  // Open mobile menu
  console.log('5. Testing Mobile Menu & Mobile Country Switcher...');
  const menuBtn = mPage.locator('.hamburger-btn');
  await menuBtn.click();
  await mPage.waitForSelector('.mobile-menu-bottom-section', { timeout: 5000 });
  await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, '20_mobile_menu_open.png') });

  // Find country switcher trigger in mobile menu
  const mobileCountryTrigger = mPage.locator('.mobile-country-dropdown .mobile-menu-account-trigger');
  console.log('Mobile country trigger visible?', await mobileCountryTrigger.isVisible());
  await mobileCountryTrigger.click();
  await mPage.waitForSelector('.mobile-account-subitem', { timeout: 5000 });
  await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, '21_mobile_country_items.png') });

  // Select USA on mobile
  const mUsaOption = mPage.locator('.mobile-account-subitem').filter({ hasText: 'USA' }).first();
  await mUsaOption.click();
  await mPage.waitForTimeout(600);

  // Check product card price on mobile (should now be USD)
  const mFirstCardPrice = await mPage.locator('.product-card .info-left').first().innerText();
  console.log('Mobile ProductCard price after mobile country switch:', mFirstCardPrice.trim().replace('\n', ' '));
  await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, '22_mobile_home_usd.png') });

  if (!mFirstCardPrice.includes('$')) {
    throw new Error(`Expected mobile card price to update to $, got: ${mFirstCardPrice}`);
  }

  // Mobile Product Page
  console.log('6. Checking Mobile ProductPage layout...');
  await mPage.goto('http://localhost:3000/saree/121015', { waitUntil: 'networkidle' });
  const mProdOverflow = await mPage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Mobile ProductPage has horizontal overflow?', mProdOverflow);
  await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, '23_mobile_product_layout.png') });

  // Mobile Checkout
  console.log('7. Checking Mobile Checkout layout...');
  await mPage.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });
  const mCheckoutOverflow = await mPage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Mobile Checkout has horizontal overflow?', mCheckoutOverflow);
  await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, '24_mobile_checkout_layout.png') });

  console.log('\n--- Console Errors Summary ---');
  console.log('Total console error events:', errors.length);
  errors.forEach((e, idx) => {
    console.log(`[Error ${idx + 1}] (${e.label}):`, e.text.slice(0, 150));
  });

  console.log('\n--- Console Warnings Summary ---');
  console.log('Total console warning events:', warnings.length);

  await browser.close();
  console.log('=== TEST 4 COMPLETED SUCCESSFULLY! ===');
})().catch(err => {
  console.error('Test 4 failed:', err);
  process.exit(1);
});
