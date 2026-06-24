import { test as base, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Extend base test with custom fixtures
export const test = base.extend({
  // Auto-capture console logs and transaction hashes
  page: async ({ page }, use) => {
    const logs: string[] = [];
    const txHashes: string[] = [];

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      logs.push(`[${type}] ${text}`);

      // Capture transaction hashes from console
      if (text.includes('0x') && text.length >= 66) {
        const hashMatch = text.match(/0x[a-fA-F0-9]{64}/);
        if (hashMatch) {
          txHashes.push(hashMatch[0]);
        }
      }
    });

    page.on('pageerror', (error) => {
      logs.push(`[ERROR] ${error.message}`);
    });

    await use(page);

    // Save logs and tx hashes after test
    const testInfo = (test as any).info();
    if (testInfo) {
      const logsDir = path.join(process.cwd(), 'artifacts', 'logs');
      fs.mkdirSync(logsDir, { recursive: true });

      const logFile = path.join(
        logsDir,
        `${testInfo.title.replace(/[^a-z0-9]/gi, '_')}.log`
      );
      fs.writeFileSync(logFile, logs.join('\n'));

      // Save transaction hashes if any were captured
      if (txHashes.length > 0) {
        const txHashesFile = path.join(process.cwd(), 'artifacts', 'tx-hashes.txt');
        const timestamp = new Date().toISOString();
        const txEntries = txHashes.map(hash =>
          `${timestamp} | ${testInfo.title} | ${hash}`
        ).join('\n');
        fs.appendFileSync(txHashesFile, txEntries + '\n');
      }
    }
  },
});

export { expect };

// Helper to connect wallet (mock)
export async function connectWallet(page: Page, address: string = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266') {
  await page.evaluate((addr) => {
    localStorage.setItem('wagmi.connected', 'true');
    localStorage.setItem('wagmi.wallet', 'injected');
    localStorage.setItem('wagmi.address', addr);
  }, address);

  await page.reload();
}

// Helper to take annotated screenshot
export async function takeScreenshot(page: Page, name: string) {
  const screenshotsDir = path.join(process.cwd(), 'artifacts', 'screenshots');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  await page.screenshot({
    path: path.join(screenshotsDir, `${name}.png`),
    fullPage: true,
  });
}

// Helper to capture transaction hash and save artifacts
export async function captureTransaction(
  page: Page,
  action: string,
  testName: string
): Promise<string | null> {
  try {
    // Wait for transaction hash to appear in the page
    const txHashElement = await page.waitForSelector(
      'text=/0x[a-fA-F0-9]{64}/',
      { timeout: 10000 }
    ).catch(() => null);

    if (!txHashElement) {
      console.log('No transaction hash found');
      return null;
    }

    const txHashText = await txHashElement.textContent();
    const hashMatch = txHashText?.match(/0x[a-fA-F0-9]{64}/);
    const txHash = hashMatch ? hashMatch[0] : null;

    if (txHash) {
      // Save to tx-hashes.txt
      const txHashesFile = path.join(process.cwd(), 'artifacts', 'tx-hashes.txt');
      const timestamp = new Date().toISOString();
      const entry = `${timestamp} | ${testName} | ${action} | ${txHash}\n`;

      fs.mkdirSync(path.dirname(txHashesFile), { recursive: true });
      fs.appendFileSync(txHashesFile, entry);

      console.log(`Captured transaction: ${action} - ${txHash}`);

      // Take screenshot of transaction confirmation
      await takeScreenshot(page, `tx-${action}-${txHash.slice(0, 10)}`);
    }

    return txHash;
  } catch (error) {
    console.error('Failed to capture transaction:', error);
    return null;
  }
}

// Helper to wait for transaction and capture hash
export async function waitForTransaction(
  page: Page,
  action: string = 'transaction',
  testName: string = 'unknown'
): Promise<string | null> {
  try {
    // Wait for transaction status message
    await page.waitForSelector('text=/transaction.*sent|confirmed|success/i', {
      timeout: 30000,
    });

    // Capture the transaction hash
    const txHash = await captureTransaction(page, action, testName);

    // Wait a bit for transaction to be mined
    await page.waitForTimeout(2000);

    return txHash;
  } catch (error) {
    console.error('Transaction wait failed:', error);
    await takeScreenshot(page, `tx-failed-${action}`);
    return null;
  }
}

// Helper to monitor Web3 transactions via window object
export async function setupTransactionMonitoring(page: Page, testName: string) {
  await page.addInitScript((testName) => {
    // Intercept Web3 transactions
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const result = await originalFetch(...args);

      // Check if this is an RPC call
      if (args[0]?.toString().includes('8545')) {
        const clonedResponse = result.clone();
        clonedResponse.json().then(data => {
          if (data.result && typeof data.result === 'string' && data.result.startsWith('0x')) {
            console.log(`TX_HASH_DETECTED: ${data.result} | Test: ${testName}`);
          }
        }).catch(() => {});
      }

      return result;
    };

    // Also monitor wagmi/viem events
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'TX_HASH' && event.data?.hash) {
        console.log(`TX_HASH_DETECTED: ${event.data.hash} | Test: ${testName}`);
      }
    });
  }, testName);
}
