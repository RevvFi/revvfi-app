import { test, expect, takeScreenshot } from './fixtures';

test.describe('Navigation and Layout', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'nav-01-homepage');

    // Should see main navigation or content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'nav-02-menu');

    // Should see nav links
    const hasBorrow = await page.locator('a:has-text("Borrow"),a:has-text("borrow")').isVisible().catch(() => false);
    const hasLend = await page.locator('a:has-text("Lend"),a:has-text("lend")').isVisible().catch(() => false);
    const hasMarkets = await page.locator('a:has-text("Markets"),a:has-text("markets")').isVisible().catch(() => false);

    expect(hasBorrow || hasLend || hasMarkets).toBeTruthy();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-jwt-token');
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'nav-03-dashboard');

    await expect(page).toHaveURL(/dashboard/);
  });

  test('should navigate to markets', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'nav-04-markets');

    await expect(page).toHaveURL(/markets/);
  });

  test('should navigate to portfolio', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-jwt-token');
    });

    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'nav-05-portfolio');

    await expect(page).toHaveURL(/portfolio/);
  });

  test('should show connect wallet prompt when not authenticated', async ({ page }) => {
    // Clear any existing auth
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'nav-06-connect-prompt');

    // Should see connect button or prompt
    const hasConnect = await page.locator('button:has-text("Connect"),text=/connect wallet/i').isVisible();
    expect(hasConnect).toBeTruthy();
  });

  test('should check responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'nav-07-mobile-home');

    // Navigate to different pages
    await page.goto('/markets');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'nav-08-mobile-markets');
  });
});
