export const CONTRACT_ADDRESSES = {
  // Core Protocol Contracts
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`,
  archController: (process.env.NEXT_PUBLIC_ARCH_CONTROLLER_ADDRESS ?? "") as `0x${string}`,
  positionNFT: (process.env.NEXT_PUBLIC_POSITION_NFT_ADDRESS ?? "") as `0x${string}`,
  liquidator: (process.env.NEXT_PUBLIC_LIQUIDATOR_ADDRESS ?? "") as `0x${string}`,
  reputationRegistry: (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS ?? "") as `0x${string}`,

  // Token Addresses (from backend .env - add to frontend .env.local)
  usdc: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as `0x${string}`,
  weth: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as `0x${string}`,

  // Oracle Address
  collateralOracle: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as `0x${string}`,

  // Default Market (can be fetched dynamically from factory)
  defaultMarket: "0x9bd03768a7DCc129555dE410FF8E85528A4F88b5" as `0x${string}`,

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
