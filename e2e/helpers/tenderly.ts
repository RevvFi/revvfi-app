/**
 * Tenderly Integration Helpers for Playwright Tests
 *
 * These helpers enable debugging of captured transaction hashes
 * using Tenderly's simulation and debugging tools.
 */

import fs from 'fs';
import path from 'path';

export interface TransactionRecord {
  timestamp: string;
  testName: string;
  action: string;
  hash: string;
}

/**
 * Parse tx-hashes.txt file and return structured data
 */
export function parseTransactionHashes(): TransactionRecord[] {
  const txHashesFile = path.join(process.cwd(), 'artifacts', 'tx-hashes.txt');

  if (!fs.existsSync(txHashesFile)) {
    return [];
  }

  const content = fs.readFileSync(txHashesFile, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  return lines.map(line => {
    const parts = line.split('|').map(p => p.trim());
    return {
      timestamp: parts[0] || '',
      testName: parts[1] || '',
      action: parts[2] || '',
      hash: parts[3] || '',
    };
  });
}

/**
 * Generate Tenderly debug URLs for all captured transactions
 */
export function generateTenderlyLinks(networkId: string = '31337'): string[] {
  const transactions = parseTransactionHashes();

  return transactions.map(tx =>
    `https://dashboard.tenderly.co/tx/${networkId}/${tx.hash}`
  );
}

/**
 * Export transaction hashes to a Tenderly-compatible format
 */
export function exportForTenderly(): void {
  const transactions = parseTransactionHashes();
  const tenderlyExport = {
    network_id: '31337',
    transactions: transactions.map(tx => ({
      hash: tx.hash,
      timestamp: tx.timestamp,
      metadata: {
        test: tx.testName,
        action: tx.action,
      },
    })),
  };

  const exportFile = path.join(process.cwd(), 'artifacts', 'tenderly-export.json');
  fs.writeFileSync(exportFile, JSON.stringify(tenderlyExport, null, 2));

  console.log(`Exported ${transactions.length} transactions to ${exportFile}`);
}

/**
 * Generate a summary report of all captured transactions
 */
export function generateTransactionReport(): string {
  const transactions = parseTransactionHashes();

  let report = '# Transaction Report\n\n';
  report += `Total Transactions: ${transactions.length}\n\n`;

  report += '## Transactions by Test\n\n';
  const byTest: Record<string, TransactionRecord[]> = {};

  transactions.forEach(tx => {
    if (!byTest[tx.testName]) {
      byTest[tx.testName] = [];
    }
    byTest[tx.testName].push(tx);
  });

  for (const [testName, txs] of Object.entries(byTest)) {
    report += `### ${testName}\n\n`;
    txs.forEach(tx => {
      report += `- **${tx.action}**: \`${tx.hash}\`\n`;
      report += `  - Timestamp: ${tx.timestamp}\n`;
      report += `  - [Debug on Tenderly](https://dashboard.tenderly.co/tx/31337/${tx.hash})\n\n`;
    });
  }

  const reportFile = path.join(process.cwd(), 'artifacts', 'transaction-report.md');
  fs.writeFileSync(reportFile, report);

  return reportFile;
}

/**
 * Check if a transaction was successful by querying local RPC
 */
export async function checkTransactionStatus(
  hash: string,
  rpcUrl: string = 'http://localhost:8545'
): Promise<{ success: boolean; receipt?: any }> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [hash],
        id: 1,
      }),
    });

    const data = await response.json();

    if (data.result) {
      return {
        success: data.result.status === '0x1',
        receipt: data.result,
      };
    }

    return { success: false };
  } catch (error) {
    console.error('Failed to check transaction status:', error);
    return { success: false };
  }
}

/**
 * Batch check all captured transaction statuses
 */
export async function verifyAllTransactions(): Promise<{
  total: number;
  successful: number;
  failed: number;
  pending: number;
}> {
  const transactions = parseTransactionHashes();
  const results = await Promise.all(
    transactions.map(tx => checkTransactionStatus(tx.hash))
  );

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && r.receipt).length;
  const pending = results.filter(r => !r.receipt).length;

  return {
    total: transactions.length,
    successful,
    failed,
    pending,
  };
}
