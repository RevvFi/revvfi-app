import { test, expect, takeScreenshot } from './fixtures';

test.describe('Market Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated borrower
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-jwt-token');
    });

    await page.goto('/');
    await takeScreenshot(page, 'market-01-home');
  });

  test('should navigate to borrow page', async ({ page }) => {
    await page.goto('/borrow');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'market-02-borrow-page');

    // Should see borrow page title
    await expect(page.locator('h1')).toContainText(/borrow/i);
  });

  test('should display borrower status', async ({ page }) => {
    await page.goto('/borrow');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'market-03-borrower-status');

    // Should show borrower info or registration prompt
    const hasRegistration = await page.locator('text=/register/i').isVisible().catch(() => false);
    const hasBorrowerInfo = await page.locator('text=/health factor|collateral|debt/i').isVisible().catch(() => false);

    expect(hasRegistration || hasBorrowerInfo).toBeTruthy();
  });

  test('should show market creation form', async ({ page }) => {
    await page.goto('/borrow');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'market-04-creation-form');

    // Look for market creation elements
    // This depends on your actual UI structure
    const hasCreateButton = await page.locator('button:has-text(/create market/i)').isVisible().catch(() => false);

    if (hasCreateButton) {
      await page.click('button:has-text(/create market/i)');
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'market-05-form-opened');
    }
  });

  test('should display available markets', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'market-06-markets-list');

    // Should see markets page
    await expect(page.locator('h1')).toContainText(/markets/i);
  });

  test('should filter active markets', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'market-07-markets-filtering');

    // Look for filter controls
    const hasFilters = await page.locator('text=/filter|status|active/i').isVisible().catch(() => false);
    expect(hasFilters).toBeTruthy();
  });
});
