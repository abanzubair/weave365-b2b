const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = '/home/aban/.gemini/antigravity/brain/3cc23b6f-8993-4e37-b368-356b35bc5249/scratch/screenshots';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
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

  console.log('=== TEST 2 & 3: CheckoutPage Currency, Coupon & PhonePe ===');

  // Step 1: Set country to USD via Home page first
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('weave365_country', 'US');
    localStorage.setItem('weave365_country_manual', 'true');
    localStorage.setItem('cart_guest', JSON.stringify([{
      productGroupKey: '121015',
      variantCode: '121015-1::color=Black',
      quantity: 1,
      weight: 1.2
    }]));
    document.cookie = 'weave365_country=US; path=/';
  });

  // Navigate to /checkout
  console.log('Navigating to /checkout in USD with 1 item...');
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });
  await page.waitForSelector('.checkout-summary-pane');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_checkout_usd_initial.png') });

  // Verify currency in checkout summary
  const summaryText = await page.locator('.checkout-summary-pane').innerText();
  console.log('--- Checkout Summary (USD) ---');
  console.log(summaryText.replace(/\n+/g, ' | '));

  if (!summaryText.includes('$')) {
    throw new Error(`Expected checkout summary to show '$' in USD, but got: ${summaryText}`);
  }

  // Verify GST 5% row is NOT present for USA (India only)
  const gstRowVisible = await page.locator('.checkout-summary-row:has-text("GST 5%")').isVisible();
  console.log('Is GST 5% row visible for US order?', gstRowVisible);
  if (gstRowVisible) {
    throw new Error('GST 5% should not be visible for US orders (India-only)');
  }

  // Step 2: Test coupon validation in foreign currency (under threshold)
  console.log('Testing coupon "TESTINTL" with cart below min_order threshold (1 saree = ~$23.43)...');
  const couponInput = page.locator('.checkout-coupon-input');
  const applyCouponBtn = page.locator('.checkout-coupon-apply-btn');

  await couponInput.fill('TESTINTL');
  await applyCouponBtn.click();
  await page.waitForSelector('.checkout-coupon-alert-error');

  const couponErrorEl = page.locator('.checkout-coupon-alert-error');
  const couponError = (await couponErrorEl.innerText()).trim();
  console.log('Coupon Error message (under min order):', couponError);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_checkout_coupon_below_min.png') });

  if (!couponError.includes('Minimum order amount') || !couponError.includes('$')) {
    throw new Error(`Expected coupon error to specify minimum order amount in USD ($), got: "${couponError}"`);
  }
  console.log('✓ Successfully verified coupon threshold rejection formatted in foreign currency ($)!');

  // Step 3: Update cart to exceed 7500 INR threshold (e.g. 5 sarees = INR 9,450 > 7500)
  console.log('Updating cart quantity to 5 sarees to meet min order threshold...');
  await page.evaluate(() => {
    const item = [{
      productGroupKey: '121015',
      variantCode: '121015-1::color=Black',
      quantity: 5,
      weight: 6.0
    }];
    localStorage.setItem('cart_guest', JSON.stringify(item));
  });

  // Reload checkout page
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' });
  await page.waitForSelector('.checkout-summary-pane');

  const updatedSummary = await page.locator('.checkout-summary-pane').innerText();
  console.log('--- Updated Checkout Summary (5 items) ---');
  console.log(updatedSummary.replace(/\n+/g, ' | '));

  // Apply coupon again
  console.log('Applying coupon "TESTINTL" now with qualifying cart...');
  const couponInput2 = page.locator('.checkout-coupon-input');
  const applyCouponBtn2 = page.locator('.checkout-coupon-apply-btn');
  await couponInput2.fill('TESTINTL');
  await applyCouponBtn2.click();
  await page.waitForSelector('.checkout-coupon-alert-success');

  const couponSuccessEl = page.locator('.checkout-coupon-alert-success');
  const couponSuccess = (await couponSuccessEl.innerText()).trim();
  console.log('Coupon Success message:', couponSuccess);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_checkout_coupon_success.png') });

  if (!couponSuccess.includes('TESTINTL') || !couponSuccess.includes('$')) {
    throw new Error(`Expected coupon success message to mention TESTINTL and saved amount in $, got: "${couponSuccess}"`);
  }
  console.log('✓ Successfully verified coupon validation and savings calculation in foreign currency ($)!');

  // Step 4: Test PhonePe Payment Handling for non-INR orders
  console.log('Testing PhonePe payment method handling for non-INR (USD) orders...');
  const phonepeCard = page.locator('#payment-option-phonepe');
  if (await phonepeCard.isVisible()) {
    await phonepeCard.click();
    await page.waitForTimeout(500);

    // Verify PhonePe non-INR settlement notice is displayed
    const phonepeNoticeEl = page.locator('text=* PhonePe settles in INR');
    const noticeVisible = await phonepeNoticeEl.isVisible();
    const noticeText = noticeVisible ? await phonepeNoticeEl.innerText() : '';
    console.log('PhonePe non-INR notice visible:', noticeVisible);
    console.log('PhonePe notice text:', noticeText);

    // Verify Pay Button shows INR converted settlement amount
    const submitBtn = page.locator('.checkout-submit-btn');
    const submitBtnText = (await submitBtn.innerText()).trim().replace('\n', ' ');
    console.log('Pay button text for PhonePe non-INR order:', submitBtnText);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_checkout_phonepe_usd_notice.png') });

    if (!noticeText.includes('₹') || !submitBtnText.includes('₹')) {
      throw new Error(`Expected PhonePe for non-INR to display INR settlement note and Pay in ₹, got notice: "${noticeText}", button: "${submitBtnText}"`);
    }
    console.log('✓ PhonePe non-INR order correctly settles in marked-up INR total with explicit buyer notice and ₹ amount!');
  } else {
    console.log('PhonePe option not visible in DOM');
  }

  // Step 5: Switch to Cashfree and verify currency
  console.log('Testing Cashfree payment option selection...');
  const cashfreeCard = page.locator('#payment-option-cashfree');
  if (await cashfreeCard.isVisible()) {
    await cashfreeCard.click();
    await page.waitForTimeout(500);

    const submitBtnCashfree = page.locator('.checkout-submit-btn');
    const submitBtnCashfreeText = (await submitBtnCashfree.innerText()).trim().replace('\n', ' ');
    console.log('Pay button text for Cashfree order:', submitBtnCashfreeText);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_checkout_cashfree_usd.png') });

    if (!submitBtnCashfreeText.includes('$')) {
      throw new Error(`Expected Cashfree order button to display '$' for US order, got: "${submitBtnCashfreeText}"`);
    }
    console.log('✓ Cashfree order correctly displays checkout total in USD ($)!');
  }

  // Step 6: Switch country to India (INR) and verify Checkout returns to INR
  console.log('Switching country back to India (IN)...');
  const trigger2 = page.locator('.country-selector-trigger');
  await trigger2.click();
  await page.waitForSelector('.country-dropdown-menu');
  const inOption = page.locator('.country-dropdown-item').filter({ hasText: 'India' }).first();
  await inOption.click();
  await page.waitForTimeout(800);

  const inrSummary = await page.locator('.checkout-summary-pane').innerText();
  console.log('--- Checkout Summary (India / INR) ---');
  console.log(inrSummary.replace(/\n+/g, ' | '));

  const inrGstVisible = await page.locator('.checkout-summary-row:has-text("GST 5%")').isVisible();
  console.log('Is GST 5% row visible for India order?', inrGstVisible);
  if (!inrGstVisible) {
    throw new Error('GST 5% row should be visible for Indian orders');
  }

  // Check PhonePe notice does NOT show when country is India
  const inrPhonepeNotice = await page.locator('text=* PhonePe settles in INR').isVisible();
  console.log('Is PhonePe non-INR notice visible for Indian order?', inrPhonepeNotice);
  if (inrPhonepeNotice) {
    throw new Error('PhonePe foreign conversion notice should NOT be visible for Indian INR orders');
  }

  const submitBtnInr = page.locator('.checkout-submit-btn');
  const submitBtnInrText = (await submitBtnInr.innerText()).trim().replace('\n', ' ');
  console.log('Pay button text for Indian order:', submitBtnInrText);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_checkout_inr_gst.png') });

  console.log('Console errors during Checkout tests:', consoleErrors);
  console.log('=== TEST 2 & 3 PASSED SUCCESSFULLY! ===');

  await browser.close();
})().catch(err => {
  console.error('Test 2 & 3 failed:', err);
  process.exit(1);
});
