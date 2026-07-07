export const CONTRACT_ADDRESSES = {
  // Core Protocol Contracts
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`,
  archController: (process.env.NEXT_PUBLIC_ARCH_CONTROLLER_ADDRESS ?? "") as `0x${string}`,
  positionNFT: (process.env.NEXT_PUBLIC_POSITION_NFT_ADDRESS ?? "") as `0x${string}`,
  liquidator: (process.env.NEXT_PUBLIC_LIQUIDATOR_ADDRESS ?? "") as `0x${string}`,
  reputationRegistry: (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS ?? "") as `0x${string}`,

  // Token Addresses
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "") as `0x${string}`,
  weth: (process.env.NEXT_PUBLIC_WETH_ADDRESS ?? "") as `0x${string}`,

  // Oracle Addresses - two mock oracles, each calibrated for a different
  // collateral-pricing direction (a single oracle can't correctly represent
  // both "1 WETH = X borrow-asset units" and its reciprocal at once - see
  // RevvFiDeployLocalnet.s.sol). Read from env, not hardcoded, so these stay
  // correct across every `make up`/redeploy instead of silently going stale.
  collateralOracle: (process.env.NEXT_PUBLIC_COLLATERAL_ORACLE_ADDRESS ?? "") as `0x${string}`,
  collateralOracleUsdc: (process.env.NEXT_PUBLIC_COLLATERAL_ORACLE_ADDRESS_USDC ?? "") as `0x${string}`,

  // Default Market (can be fetched dynamically from factory)
  defaultMarket: (process.env.NEXT_PUBLIC_DEFAULT_MARKET_ADDRESS ?? "") as `0x${string}`,

  // Market-specific addresses (fetched per market from factory.getMarket())
  // These will be populated dynamically in hooks
} as const;

// Helper to get market-specific contract addresses
export function getMarketAddresses(marketAddress: string) {
  // These should be fetched from the market contract or indexer
  return {
    market: marketAddress as `0x${string}`,
    // offerBook, escrow, etc. should be read from market contract
  };
}
