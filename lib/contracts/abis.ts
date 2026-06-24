import type { Abi } from "viem";
import MarketJson from "@/abis/RevvFiMarket.sol/RevvFiMarket.json";
import OfferBookJson from "@/abis/RevvFiOfferBook.sol/RevvFiOfferBook.json";
import CollateralEscrowJson from "@/abis/RevvFiCollateralEscrow.sol/RevvFiCollateralEscrow.json";
import FactoryJson from "@/abis/RevvFiFactory.sol/RevvFiFactory.json";
import LiquidatorJson from "@/abis/RevvFiLiquidator.sol/RevvFiLiquidator.json";
import ArchControllerJson from "@/abis/RevvFiArchController.sol/RevvFiArchController.json";
import ReputationRegistryJson from "@/abis/ReputationRegistry.sol/ReputationRegistry.json";
import PositionNFTJson from "@/abis/RevvFiPositionNFT.sol/RevvFiPositionNFT.json";
import LiquidityQueueJson from "@/abis/RevvFiLiquidityQueue.sol/RevvFiLiquidityQueue.json";

export const MARKET_ABI = MarketJson.abi as Abi;
export const OFFER_BOOK_ABI = OfferBookJson.abi as Abi;
export const COLLATERAL_ESCROW_ABI = CollateralEscrowJson.abi as Abi;
export const FACTORY_ABI = FactoryJson.abi as Abi;
export const LIQUIDATOR_ABI = LiquidatorJson.abi as Abi;
export const ARCH_CONTROLLER_ABI = ArchControllerJson.abi as Abi;
export const REPUTATION_REGISTRY_ABI = ReputationRegistryJson.abi as Abi;
export const POSITION_NFT_ABI = PositionNFTJson.abi as Abi;
export const LIQUIDITY_QUEUE_ABI = LiquidityQueueJson.abi as Abi;

// Standard ERC20 ABI for token interactions (USDC, WETH, etc.)
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "spender", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
] as const satisfies Abi;
