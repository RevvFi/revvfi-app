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

// Calculate max borrow amount
export function calculateMaxBorrow(
  collateralBalance: bigint,
  collateralPrice: bigint, // Price in USD with 8 decimals (e.g., $2000 = 200000000000)
  minCollateralRatio: bigint, // In basis points (e.g., 11000 = 110%)
  currentDebt: bigint = BigInt(0)
): bigint {
  if (collateralBalance === BigInt(0) || minCollateralRatio === BigInt(0)) {
    return BigInt(0);
  }

  // collateralValue = collateralBalance * collateralPrice / 1e18 (assuming 18 decimals for collateral)
  // maxBorrow = (collateralValue * 10000) / minCollateralRatio - currentDebt
  // Example: $2000 collateral, 110% ratio = can borrow up to $1818

  const collateralValueUSD = (collateralBalance * collateralPrice) / BigInt(Math.floor(1e18));
  const maxBorrowBeforeDebt = (collateralValueUSD * BigInt(10000)) / minCollateralRatio;
  const maxBorrow = maxBorrowBeforeDebt > currentDebt ? maxBorrowBeforeDebt - currentDebt : BigInt(0);

  return maxBorrow;
}
