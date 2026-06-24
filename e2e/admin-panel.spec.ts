import { test, expect, takeScreenshot } from './fixtures';

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    await takeScreenshot(page, 'admin-01-home');
  });

  test('should deny access to non-admin users', async ({ page }) => {
    // Try to access admin panel without authentication
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'admin-02-access-denied');

    // Should see access denied message
    await expect(page.locator('text=/access denied/i')).toBeVisible();
    await expect(page.locator('text=/do not have permission/i')).toBeVisible();
  });

  test('should allow admin access with admin wallet', async ({ page }) => {
    // Mock admin wallet connection
    await page.evaluate(() => {
      // Mock wagmi connection
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.wallet', 'injected');
      // Admin wallet from ADMIN_WALLETS env
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

      // Mock JWT token
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'admin-03-dashboard-loaded');

    // Should see admin dashboard
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('text=/protocol management/i')).toBeVisible();
  });

  test('should display overview metrics', async ({ page }) => {
    // Set up admin access
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Click Overview tab
    await page.click('text=Overview');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'admin-04-overview-metrics');

    // Should see metrics cards
    await expect(page.locator('text=/total value locked/i')).toBeVisible();
    await expect(page.locator('text=/total borrowed/i')).toBeVisible();
    await expect(page.locator('text=/active markets/i')).toBeVisible();
  });

  test('should display markets list', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Click Markets tab
    await page.click('text=Markets');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'admin-05-markets-list');

    // Should see markets table
    await expect(page.locator('text=/market address/i')).toBeVisible();
    await expect(page.locator('text=/borrower/i')).toBeVisible();
  });

  test('should display borrowers list', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Click Borrowers tab
    await page.click('text=Borrowers');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'admin-06-borrowers-list');

    // Should see borrower management section
    await expect(page.locator('text=/borrower management/i')).toBeVisible();
    await expect(page.locator('button:has-text("Add Borrower")')).toBeVisible();
  });

  test('should open add borrower dialog', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Go to Borrowers tab
    await page.click('text=Borrowers');
    await page.waitForTimeout(1000);

    // Click Add Borrower button
    await page.click('button:has-text("Add Borrower")');
    await page.waitForTimeout(500);

    await takeScreenshot(page, 'admin-07-add-borrower-dialog');

    // Should see dialog
    await expect(page.locator('text=/add borrower/i')).toBeVisible();
    await expect(page.locator('input[placeholder*="0x"]')).toBeVisible();
  });

  test('should validate borrower address input', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Open add borrower dialog
    await page.click('text=Borrowers');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Add Borrower")');
    await page.waitForTimeout(500);

    // Try to submit without address
    const submitButton = page.locator('button:has-text("Add Borrower")').last();
    await expect(submitButton).toBeDisabled();

    await takeScreenshot(page, 'admin-08-validation-empty');

    // Enter invalid address
    await page.fill('input[placeholder*="0x"]', 'invalid');
    await page.waitForTimeout(500);

    await takeScreenshot(page, 'admin-09-validation-invalid');
  });

  test('should display positions list', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Click Positions tab
    await page.click('text=Positions');
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'admin-10-positions-list');

    // Should see positions table
    await expect(page.locator('text=/all positions/i')).toBeVisible();
  });

  test('should show emergency pause button', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await takeScreenshot(page, 'admin-11-emergency-controls');

    // Should see emergency pause button
    await expect(page.locator('button:has-text("Emergency Pause")')).toBeVisible();
  });
});
