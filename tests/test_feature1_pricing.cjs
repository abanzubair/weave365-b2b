const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = '/home/aban/.gemini/antigravity/brain/3cc23b6f-8993-4e37-b368-356b35bc5249/scratch/screenshots';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  console.log('=== TEST 1: Header Switcher & Dynamic Pricing ===');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // 1. Initial State: IN (INR)
  const trigger = page.locator('.country-selector-trigger');
  const initialTriggerText = (await trigger.innerText()).trim();
  console.log('1. Initial country code on trigger:', initialTriggerText);

  const firstCard = page.locator('.product-card').first();
  const initialPrice = (await firstCard.locator('.info-left').innerText()).trim().replace('\n', ' ');
  console.log('Initial ProductCard price (INR):', initialPrice);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_home_inr.png') });

  // 2. Open Dropdown & Select USD
  console.log('2. Clicking country selector trigger to open dropdown...');
  await trigger.click();
  await page.waitForSelector('.country-dropdown-menu');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_country_dropdown_open.png') });

  // Find and click USA option
  const usaOption = page.locator('.country-dropdown-item').filter({ hasText: 'USA' }).first();
  await usaOption.click();
  await page.waitForTimeout(600);

  const usdTriggerText = (await trigger.innerText()).trim();
  const usdPrice = (await firstCard.locator('.info-left').innerText()).trim().replace('\n', ' ');
  console.log('Trigger after USD selection:', usdTriggerText);
  console.log('ProductCard price after USD selection:', usdPrice);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_home_usd.png') });

  if (!usdPrice.includes('$')) {
    throw new Error(`Expected USD price to contain '$', got: ${usdPrice}`);
  }

  // 3. Switch to EUR
  console.log('3. Switching to EUR...');
  await trigger.click();
  await page.waitForSelector('.country-dropdown-menu');
  await page.locator('.country-search-input').fill('Euro');
  await page.waitForTimeout(300);
  const eurOption = page.locator('.country-dropdown-item').filter({ hasText: 'Euro' }).first();
  await eurOption.click();
  await page.waitForTimeout(600);

  const eurTriggerText = (await trigger.innerText()).trim();
  const eurPrice = (await firstCard.locator('.info-left').innerText()).trim().replace('\n', ' ');
  console.log('Trigger after EUR selection:', eurTriggerText);
  console.log('ProductCard price after EUR selection:', eurPrice);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_home_eur.png') });

  if (!eurPrice.includes('€')) {
    throw new Error(`Expected EUR price to contain '€', got: ${eurPrice}`);
  }

  // 4. Switch to AED
  console.log('4. Switching to AED (UAE)...');
  await trigger.click();
  await page.waitForSelector('.country-dropdown-menu');
  await page.locator('.country-search-input').fill('UAE');
  await page.waitForTimeout(300);
  const aedOption = page.locator('.country-dropdown-item').filter({ hasText: 'UAE' }).first();
  await aedOption.click();
  await page.waitForTimeout(600);

  const aedTriggerText = (await trigger.innerText()).trim();
  const aedPrice = (await firstCard.locator('.info-left').innerText()).trim().replace('\n', ' ');
  console.log('Trigger after AED selection:', aedTriggerText);
  console.log('ProductCard price after AED selection:', aedPrice);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_home_aed.png') });

  if (!aedPrice.includes('AED')) {
    throw new Error(`Expected AED price to contain 'AED', got: ${aedPrice}`);
  }

  // 5. Test SearchOverlay dynamic price
  console.log('5. Testing SearchOverlay...');
  const searchButton = page.locator('.premium-search-trigger').first();
  await searchButton.click();
  await page.waitForSelector('.premium-search-overlay', { timeout: 5000 });
  await page.locator('.premium-search-input-field').fill('Silk');
  await page.waitForTimeout(1000);

  const firstSearchResultPrice = await page.locator('.result-product-price').first().innerText();
  console.log('SearchOverlay first result price (under AED):', firstSearchResultPrice.trim());
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_search_overlay_aed.png') });

  if (!firstSearchResultPrice.includes('AED')) {
    throw new Error(`Expected SearchOverlay price to contain 'AED', got: ${firstSearchResultPrice}`);
  }

  // Close search overlay
  await page.locator('.search-modal-close-btn').click();
  await page.waitForTimeout(500);

  // 6. Test ProductPage
  console.log('6. Testing ProductPage dynamic price...');
  // Navigate to product page while in AED
  await page.goto('http://localhost:3000/saree/121015', { waitUntil: 'networkidle' });
  await page.waitForSelector('.b2b-price-card .price-card-main');
  const prodAedPrice = await page.locator('.b2b-price-card .price-card-main').first().innerText();
  console.log('ProductPage price (AED):', prodAedPrice.trim().replace('\n', ' '));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_product_page_aed.png') });

  if (!prodAedPrice.includes('AED')) {
    throw new Error(`Expected ProductPage price to contain 'AED', got: ${prodAedPrice}`);
  }

  // Switch to USD while on ProductPage
  console.log('Switching to USD on ProductPage directly...');
  await trigger.click();
  await page.waitForSelector('.country-dropdown-menu');
  await page.locator('.country-search-input').fill('USA');
  await page.waitForTimeout(300);
  const prodUsaOption = page.locator('.country-dropdown-item').filter({ hasText: 'USA' }).first();
  await prodUsaOption.click();
  await page.waitForTimeout(600);

  const prodUsdPrice = await page.locator('.b2b-price-card .price-card-main').first().innerText();
  console.log('ProductPage price after switching to USD:', prodUsdPrice.trim().replace('\n', ' '));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_product_page_usd.png') });

  if (!prodUsdPrice.includes('$')) {
    throw new Error(`Expected ProductPage price to contain '$', got: ${prodUsdPrice}`);
  }

  // Switch back to INR on ProductPage
  console.log('Switching to INR on ProductPage directly...');
  await trigger.click();
  await page.waitForSelector('.country-dropdown-menu');
  await page.locator('.country-search-input').fill('India');
  await page.waitForTimeout(300);
  const inOption = page.locator('.country-dropdown-item').filter({ hasText: 'India' }).first();
  await inOption.click();
  await page.waitForTimeout(600);

  const prodInrPrice = await page.locator('.b2b-price-card .price-card-main').first().innerText();
  console.log('ProductPage price after switching to INR:', prodInrPrice.trim().replace('\n', ' '));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_product_page_inr.png') });

  if (!prodInrPrice.includes('₹')) {
    throw new Error(`Expected ProductPage price to contain '₹', got: ${prodInrPrice}`);
  }

  console.log('Console errors captured during Test 1:', consoleErrors);
  console.log('=== TEST 1 PASSED SUCCESSFULLY! ===');

  await browser.close();
})().catch(err => {
  console.error('Test 1 failed:', err);
  process.exit(1);
});
