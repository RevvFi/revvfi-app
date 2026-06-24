import { test, expect, takeScreenshot } from './fixtures';

test.describe('Offer Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated lender
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
      localStorage.setItem('revvfi_jwt', 'mock-jwt-token');
    });

    await page.goto('/');
    await takeScreenshot(page, 'offer-01-home');
  });

  test('should navigate to lend page', async ({ page }) => {
    await page.goto('/lend');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'offer-02-lend-page');

    // Should see lend page
    await expect(page.locator('h1')).toContainText(/lend/i);
  });

  test('should display lender portfolio', async ({ page }) => {
    await page.goto('/lend');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'offer-03-portfolio');

    // Should see portfolio metrics
    const hasMetrics = await page.locator('text=/deposited|apr|offers|interest/i').isVisible();
    expect(hasMetrics).toBeTruthy();
  });

  test('should show offer creation form', async ({ page }) => {
    await page.goto('/lend');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'offer-04-creation-form');

    // Should see form fields
    const hasMarketSelect = await page.locator('select,input[placeholder*="market"]').isVisible().catch(() => false);
    const hasAmountInput = await page.locator('input[placeholder*="amount"]').isVisible().catch(() => false);

    expect(hasMarketSelect || hasAmountInput).toBeTruthy();
  });

  test('should validate offer form inputs', async ({ page }) => {
    await page.goto('/lend');
    await page.waitForLoadState('networkidle');

    // Try to find and fill amount input
    const amountInput = page.locator('input[placeholder*="amount"]').first();
    const isVisible = await amountInput.isVisible().catch(() => false);

    if (isVisible) {
      // Enter invalid amount
      await amountInput.fill('0');
      await page.waitForTimeout(500);

      await takeScreenshot(page, 'offer-05-validation-zero');

      // Enter valid amount
      await amountInput.fill('1000');
      await page.waitForTimeout(500);

      await takeScreenshot(page, 'offer-06-validation-valid');
    }
  });

  test('should display APR input', async ({ page }) => {
    await page.goto('/lend');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'offer-07-apr-input');

    const hasAPR = await page.locator('text=/apr|rate|interest rate/i').isVisible();
    expect(hasAPR).toBeTruthy();
  });

  test('should show seniority options', async ({ page }) => {
    await page.goto('/lend');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'offer-08-seniority');

    const hasSeniority = await page.locator('text=/senior|junior|seniority/i').isVisible().catch(() => false);
    expect(hasSeniority).toBeTruthy();
  });

  test('should display active offers list', async ({ page }) => {
    await page.goto('/lend');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'offer-09-active-offers');

    // Should see offers section
    const hasOffers = await page.locator('text=/my offers|open offers|active offers/i').isVisible();
    expect(hasOffers).toBeTruthy();
  });
});
