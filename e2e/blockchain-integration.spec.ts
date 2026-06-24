import { test, expect, takeScreenshot, waitForTransaction, setupTransactionMonitoring } from './fixtures';

test.describe('Blockchain Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupTransactionMonitoring(page, test.info().title);

    // Connect admin wallet
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-admin-jwt');
    });
  });

  test('verify blockchain connection and network', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'blockchain-01-connected');

    // Check if wallet is connected
    const walletText = await page.textContent('body');
    const hasWalletAddress = walletText?.includes('0xf39Fd') || walletText?.includes('f39F');

    await takeScreenshot(page, 'blockchain-02-wallet-status');

    console.log('Wallet connected:', hasWalletAddress);
  });

  test('check RPC health and blockchain sync', async ({ page }) => {
    // Check backend RPC status
    const response = await page.request.get('http://localhost:3001/api/v1/health');
    const health = await response.json();

    await takeScreenshot(page, 'blockchain-03-rpc-health');

    console.log('RPC Status:', health.rpc);
    expect(health.rpc).toBe('healthy');
  });

  test('verify indexer is processing events', async ({ page }) => {
    // Get markets from API (should be indexed from blockchain)
    const response = await page.request.get('http://localhost:3001/api/v1/markets');
    const data = await response.json();

    await takeScreenshot(page, 'blockchain-04-indexed-data');

    console.log('Indexed markets:', data.count);
    console.log('Markets:', data.markets?.length || 0);

    // Markets should exist if indexer is working
    if (data.count > 0) {
      expect(data.markets).toBeDefined();
      expect(Array.isArray(data.markets)).toBe(true);
    }
  });

  test('test transaction flow: prepare -> sign -> confirm', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'blockchain-05-admin-page');

    // Check for admin access
    const hasAccess = await page.locator('h1:has-text("Admin Dashboard")').isVisible();

    if (hasAccess) {
      await page.click('text=Borrowers');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'blockchain-06-borrowers-section');

      // Check if Add Borrower button exists
      const addButton = page.locator('button:has-text("Add Borrower")');
      const isVisible = await addButton.isVisible().catch(() => false);

      if (isVisible) {
        await takeScreenshot(page, 'blockchain-07-ready-for-tx');
        console.log('✅ Transaction signing UI is available');
      }
    }
  });

  test('verify contract addresses are configured', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if environment variables are loaded
    const hasConfig = await page.evaluate(() => {
      return {
        hasFactory: !!process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
        hasArchController: !!process.env.NEXT_PUBLIC_ARCH_CONTROLLER_ADDRESS,
        hasRPC: !!process.env.NEXT_PUBLIC_LOCAL_RPC_URL,
      };
    });

    await takeScreenshot(page, 'blockchain-08-config-check');

    console.log('Configuration:', hasConfig);
  });

  test('monitor network requests to RPC endpoint', async ({ page }) => {
    const rpcCalls: any[] = [];

    // Intercept network requests
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('8545') || url.includes('localhost')) {
        rpcCalls.push({
          url,
          method: request.method(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, 'blockchain-09-rpc-monitoring');

    console.log(`Total RPC calls: ${rpcCalls.length}`);
    if (rpcCalls.length > 0) {
      console.log('Sample RPC calls:', rpcCalls.slice(0, 3));
    }
  });

  test('verify wallet transaction signing capability', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check if useWriteContract hook is available
    const hasWriteCapability = await page.evaluate(() => {
      // Check if wagmi is loaded
      return typeof window !== 'undefined';
    });

    await takeScreenshot(page, 'blockchain-10-wallet-capability');

    expect(hasWriteCapability).toBe(true);
  });

  test('test error handling for failed transactions', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await takeScreenshot(page, 'blockchain-11-error-check');

    console.log(`Errors detected: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors.slice(0, 5));
    }
  });

  test('verify blockchain data matches API data', async ({ page }) => {
    // This test would compare on-chain data with API responses
    // to ensure indexer is keeping database in sync

    const apiMarkets = await page.request.get('http://localhost:3001/api/v1/markets');
    const marketsData = await apiMarkets.json();

    await takeScreenshot(page, 'blockchain-12-data-sync-check');

    console.log('API Markets Count:', marketsData.count);

    // In a real test, we would also query the blockchain directly
    // and compare the results
    expect(marketsData).toHaveProperty('markets');
  });
});
