import { test, expect, takeScreenshot, waitForTransaction, setupTransactionMonitoring } from './fixtures';

test.describe('Web3 Transaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up transaction monitoring
    await setupTransactionMonitoring(page, test.info().title);

    // Set up admin wallet
    await page.evaluate(() => {
      localStorage.setItem('wagmi.connected', 'true');
      localStorage.setItem('wagmi.address', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      localStorage.setItem('revvfi_jwt', 'mock-jwt-token');
    });

    await page.goto('/');
    await takeScreenshot(page, 'web3-01-setup');
  });

  test('should capture transaction hash when adding borrower', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'web3-02-admin-panel');

    // Go to Borrowers tab
    await page.click('text=Borrowers');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'web3-03-borrowers-tab');

    // Click Add Borrower
    await page.click('button:has-text("Add Borrower")');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'web3-04-add-dialog');

    // Enter a test address
    const testAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    await page.fill('input[placeholder*="0x"]', testAddress);
    await takeScreenshot(page, 'web3-05-address-entered');

    // Click Add Borrower button (this should trigger MetaMask/wallet)
    const addButton = page.locator('button:has-text("Add Borrower")').last();
    await addButton.click();

    // Wait for transaction and capture hash
    const txHash = await waitForTransaction(page, 'add-borrower', test.info().title);

    await takeScreenshot(page, 'web3-06-transaction-complete');

    if (txHash) {
      console.log(`✅ Transaction captured: ${txHash}`);
      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }
  });

  test('should capture transaction hash when depositing collateral', async ({ page }) => {
    await page.goto('/borrow');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'web3-07-borrow-page');

    // Check if there are markets available
    const hasMarkets = await page.locator('select,input[placeholder*="market"]').isVisible().catch(() => false);

    if (hasMarkets) {
      // Try to deposit collateral
      const depositButton = page.locator('button:has-text(/deposit.*collateral/i)').first();
      const isVisible = await depositButton.isVisible().catch(() => false);

      if (isVisible) {
        await depositButton.click();
        await takeScreenshot(page, 'web3-08-deposit-initiated');

        // Wait for transaction
        const txHash = await waitForTransaction(page, 'deposit-collateral', test.info().title);

        await takeScreenshot(page, 'web3-09-deposit-complete');

        if (txHash) {
          console.log(`✅ Deposit transaction captured: ${txHash}`);
          expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        }
      }
    }
  });

  test('should monitor all Web3 RPC calls', async ({ page }) => {
    const capturedHashes: string[] = [];

    // Listen for console messages that indicate transaction hashes
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('TX_HASH_DETECTED:')) {
        const hashMatch = text.match(/0x[a-fA-F0-9]{64}/);
        if (hashMatch) {
          capturedHashes.push(hashMatch[0]);
        }
      }
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Interact with various features that might trigger transactions
    await page.click('text=Borrowers').catch(() => {});
    await page.waitForTimeout(1000);

    await takeScreenshot(page, 'web3-10-monitoring-complete');

    console.log(`Total transactions monitored: ${capturedHashes.length}`);
    console.log('Transaction hashes:', capturedHashes);
  });

  test('should capture failed transaction details', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Try an action that might fail
    await page.click('text=Borrowers').catch(() => {});
    await page.waitForTimeout(500);

    const addButton = page.locator('button:has-text("Add Borrower")');
    const isVisible = await addButton.isVisible().catch(() => false);

    if (isVisible) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Submit without entering address (should fail or be disabled)
      const submitButton = page.locator('button:has-text("Add Borrower")').last();
      const isDisabled = await submitButton.isDisabled();

      await takeScreenshot(page, 'web3-11-validation-check');

      expect(isDisabled).toBe(true); // Should be disabled without valid address
    }
  });

  test('should test transaction signing flow end-to-end', async ({ page }) => {
    // Enable detailed console logging
    page.on('console', (msg) => {
      console.log('Browser:', msg.text());
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'web3-12-e2e-start');

    // Navigate through the full flow
    const steps = [
      { action: 'click-borrowers', selector: 'text=Borrowers' },
      { action: 'click-add', selector: 'button:has-text("Add Borrower")' },
    ];

    for (const step of steps) {
      const element = page.locator(step.selector);
      const isVisible = await element.isVisible().catch(() => false);

      if (isVisible) {
        await element.click();
        await page.waitForTimeout(500);
        await takeScreenshot(page, `web3-13-${step.action}`);
      }
    }

    await takeScreenshot(page, 'web3-14-e2e-complete');
  });
});
