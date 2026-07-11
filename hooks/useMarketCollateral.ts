import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { Address } from 'viem';
import { localChain } from '@/constants/chains';

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
  },
  {
    "inputs": [],
    "name": "liquidationThreshold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "collateralOracle",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "collateralOracleDecimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "collateralDecimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "borrowDecimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const ORACLE_ABI = [
  {
    "inputs": [],
    "name": "latestRoundData",
    "outputs": [
      {"internalType": "uint80", "name": "roundId", "type": "uint80"},
      {"internalType": "int256", "name": "answer", "type": "int256"},
      {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
      {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
      {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
    ],
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
  },
  {
    "inputs": [],
    "name": "getCurrentPrincipal",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Get collateral balance for a specific market
export function useMarketCollateralBalance(marketAddress: Address | undefined, borrowerAddress: Address | undefined) {
  const { data: escrowAddress } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'collateralEscrow',
    query: { enabled: !!marketAddress },
    chainId: localChain.id,
  });

  return useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'getCollateralBalance',
    args: borrowerAddress ? [borrowerAddress] : undefined,
    query: {
      enabled: !!escrowAddress && !!borrowerAddress,
      refetchInterval: 15_000,
    },
    chainId: localChain.id,
  });
}

// Get min collateral ratio
export function useMinCollateralRatio(marketAddress: Address | undefined) {
  const { data: escrowAddress } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'collateralEscrow',
    query: { enabled: !!marketAddress },
    chainId: localChain.id,
  });

  return useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'minCollateralRatio',
    query: {
      enabled: !!escrowAddress,
      refetchInterval: 60_000, // ratio rarely changes
    },
    chainId: localChain.id,
  });
}

// Get liquidation threshold
export function useLiquidationThreshold(marketAddress: Address | undefined) {
  const { data: escrowAddress } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'collateralEscrow',
    query: { enabled: !!marketAddress },
    chainId: localChain.id,
  });

  return useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'liquidationThreshold',
    query: {
      enabled: !!escrowAddress,
      refetchInterval: 60_000, // threshold rarely changes
    },
    chainId: localChain.id,
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
      refetchInterval: 15_000,
    },
    chainId: localChain.id,
  });
}

// Same scope as useMarketTotalDebt, so (totalDebt - currentPrincipal) gives accrued interest.
export function useMarketCurrentPrincipal(marketAddress: Address | undefined) {
  return useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'getCurrentPrincipal',
    query: {
      enabled: !!marketAddress,
      refetchInterval: 15_000,
    },
    chainId: localChain.id,
  });
}

// Mirrors RevvFiCollateralEscrow._getCollateralValueFromAmount() - returns a
// converter to the market's borrow-asset units, using its real oracle/decimals.
export function useCollateralOracleConverter(marketAddress: Address | undefined) {
  const { data: escrowAddress } = useReadContract({
    address: marketAddress,
    abi: MARKET_ABI,
    functionName: 'collateralEscrow',
    query: { enabled: !!marketAddress },
    chainId: localChain.id,
  });

  const { data: oracleAddress } = useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'collateralOracle',
    query: { enabled: !!escrowAddress },
    chainId: localChain.id,
  });
  const { data: oracleDecimals } = useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'collateralOracleDecimals',
    query: { enabled: !!escrowAddress },
    chainId: localChain.id,
  });
  const { data: collateralDecimals } = useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'collateralDecimals',
    query: { enabled: !!escrowAddress },
    chainId: localChain.id,
  });
  const { data: borrowDecimals } = useReadContract({
    address: escrowAddress as Address,
    abi: ESCROW_ABI,
    functionName: 'borrowDecimals',
    query: { enabled: !!escrowAddress },
    chainId: localChain.id,
  });
  const { data: roundData } = useReadContract({
    address: oracleAddress as Address,
    abi: ORACLE_ABI,
    functionName: 'latestRoundData',
    query: { enabled: !!oracleAddress, refetchInterval: 15_000 },
    chainId: localChain.id,
  });

  const ready =
    roundData !== undefined &&
    oracleDecimals !== undefined &&
    collateralDecimals !== undefined &&
    borrowDecimals !== undefined;

  // amountWei is the collateral amount in its own raw decimals (e.g. 18 for WETH)
  const toBorrowUnits = useMemo(() => {
    if (!ready) return null;
    const price = (roundData as readonly [bigint, bigint, bigint, bigint, bigint])[1];
    return (amountWei: bigint): bigint => {
      if (amountWei === BigInt(0) || price <= BigInt(0)) return BigInt(0);
      let value = amountWei * price;
      if (oracleDecimals! > borrowDecimals!) {
        value /= BigInt(10) ** BigInt(oracleDecimals! - borrowDecimals!);
      } else if (oracleDecimals! < borrowDecimals!) {
        value *= BigInt(10) ** BigInt(borrowDecimals! - oracleDecimals!);
      }
      return value / (BigInt(10) ** BigInt(collateralDecimals!));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, roundData, oracleDecimals, collateralDecimals, borrowDecimals]);

  return { toBorrowUnits, ready };
}

// Returns max borrow amount in the borrow asset's native units, converting
// the 8-decimal Chainlink price and collateral decimals down to borrow decimals.
export function calculateMaxBorrow(
  collateralBalance: bigint,
  collateralPrice: bigint,    // Chainlink-style: 8 decimal places (e.g. $2000 → 200_000_000_00)
  minCollateralRatio: bigint, // Basis points (e.g. 11000 = 110%)
  currentDebt: bigint = BigInt(0), // In borrow-asset decimals (e.g. USDC 6-decimal)
  availableLiquidity?: bigint  // Optional cap from offer-book; undefined = no cap
): bigint {
  if (collateralBalance === BigInt(0) || minCollateralRatio === BigInt(0)) {
    return BigInt(0);
  }

  // Step 1 — collateral value in 8-decimal USD
  const collateralValueIn8Dec = (collateralBalance * collateralPrice) / BigInt(1e18);

  // Step 2 — convert to 6-decimal USDC (divide by 10^(8-6) = 100)
  const collateralValueUSDC = collateralValueIn8Dec / BigInt(100);

  // Step 3 — apply min-collateral-ratio then subtract existing debt
  const maxBorrowBeforeDebt = (collateralValueUSDC * BigInt(10000)) / minCollateralRatio;
  const maxBorrow = maxBorrowBeforeDebt > currentDebt ? maxBorrowBeforeDebt - currentDebt : BigInt(0);

  // Step 4 — cap by available offer-book liquidity when provided
  if (availableLiquidity !== undefined) {
    return maxBorrow < availableLiquidity ? maxBorrow : availableLiquidity;
  }
  return maxBorrow;
}
