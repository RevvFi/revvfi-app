import { useReadContract } from 'wagmi';
import { Address } from 'viem';

const ESCROW_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "borrower", "type": "address"}],
    "name": "getCollateralBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minCollateralRatio",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const MARKET_ABI = [
  {
    "inputs": [],
    "name": "collateralEscrow",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDebt",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Get collateral balance for a specific market
export function useMarketCollateralBalance(marketAddress: Address | undefined, borrowerAddress: Address | undefined) {
  // First get escrow address from market
  const { data: escrowAddress } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'collateralEscrow',
    query: {
      enabled: !!marketAddress,
    }
  });

  // Then get collateral balance from escrow
  return useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'getCollateralBalance',
    args: borrowerAddress ? [borrowerAddress] : undefined,
    query: {
      enabled: !!escrowAddress && !!borrowerAddress,
    }
  });
}

// Get min collateral ratio
export function useMinCollateralRatio(marketAddress: Address | undefined) {
  // Get escrow address
  const { data: escrowAddress } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'collateralEscrow',
    query: {
      enabled: !!marketAddress,
    }
  });

  return useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'minCollateralRatio',
    query: {
      enabled: !!escrowAddress,
    }
  });
}

// Get total debt for market
export function useMarketTotalDebt(marketAddress: Address | undefined) {
  return useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'totalDebt',
    query: {
      enabled: !!marketAddress,
    }
  });
}

// Calculate max borrow amount.
// Returns a value in the borrow asset's native units (e.g. USDC with 6 decimals).
//
// Unit walk-through (1 WETH @ $2000, minRatio = 110%, no existing debt):
//   collateralBalance = 1e18  (18-decimal WETH)
//   collateralPrice   = 2000 * 1e8 = 2e11  (8-decimal Chainlink price)
//
//   collateralValue (8-decimal USD) = 1e18 * 2e11 / 1e18 = 2e11
//   collateralValue (6-decimal USDC) = 2e11 / 100        = 2e9  ($2000)
//   maxBorrow (6-decimal USDC) = 2e9 * 10000 / 11000     ≈ 1.818e9  ($1818)
export function calculateMaxBorrow(
  collateralBalance: bigint,
  collateralPrice: bigint,   // Chainlink-style: 8 decimal places (e.g. $2000 → 200_000_000_00)
  minCollateralRatio: bigint, // Basis points (e.g. 11000 = 110%)
  currentDebt: bigint = BigInt(0) // In borrow-asset decimals (e.g. USDC 6-decimal)
): bigint {
  if (collateralBalance === BigInt(0) || minCollateralRatio === BigInt(0)) {
    return BigInt(0);
  }

  // Step 1 — collateral value in 8-decimal USD
  const collateralValueIn8Dec = (collateralBalance * collateralPrice) / BigInt(1e18);

  // Step 2 — convert to 6-decimal USDC (divide by 10^(8-6) = 100)
  const collateralValueUSDC = collateralValueIn8Dec / BigInt(100);

  // Step 3 — apply min-collateral-ratio to get max borrow in USDC decimals
  const maxBorrowBeforeDebt = (collateralValueUSDC * BigInt(10000)) / minCollateralRatio;

  const maxBorrow = maxBorrowBeforeDebt > currentDebt ? maxBorrowBeforeDebt - currentDebt : BigInt(0);
  return maxBorrow;
}
