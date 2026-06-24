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
// Uses modern ABI format with stateMutability (required by viem)
export const ERC20_ABI = [
  { type: "function", name: "name",        stateMutability: "view",       inputs: [],                                                                                       outputs: [{ name: "",        type: "string"  }] },
  { type: "function", name: "symbol",      stateMutability: "view",       inputs: [],                                                                                       outputs: [{ name: "",        type: "string"  }] },
  { type: "function", name: "decimals",    stateMutability: "view",       inputs: [],                                                                                       outputs: [{ name: "",        type: "uint8"   }] },
  { type: "function", name: "totalSupply", stateMutability: "view",       inputs: [],                                                                                       outputs: [{ name: "",        type: "uint256" }] },
  { type: "function", name: "balanceOf",   stateMutability: "view",       inputs: [{ name: "_owner",   type: "address" }],                                                  outputs: [{ name: "balance", type: "uint256" }] },
  { type: "function", name: "allowance",   stateMutability: "view",       inputs: [{ name: "_owner",   type: "address" }, { name: "_spender", type: "address" }],           outputs: [{ name: "",        type: "uint256" }] },
  { type: "function", name: "approve",     stateMutability: "nonpayable", inputs: [{ name: "_spender", type: "address" }, { name: "_value",   type: "uint256" }],           outputs: [{ name: "",        type: "bool"    }] },
  { type: "function", name: "transfer",    stateMutability: "nonpayable", inputs: [{ name: "_to",      type: "address" }, { name: "_value",   type: "uint256" }],           outputs: [{ name: "",        type: "bool"    }] },
  { type: "function", name: "transferFrom",stateMutability: "nonpayable", inputs: [{ name: "_from",    type: "address" }, { name: "_to",      type: "address" }, { name: "_value", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { type: "event",    name: "Transfer", anonymous: false, inputs: [{ indexed: true,  name: "from",    type: "address" }, { indexed: true,  name: "to",      type: "address" }, { indexed: false, name: "value",   type: "uint256" }] },
  { type: "event",    name: "Approval", anonymous: false, inputs: [{ indexed: true,  name: "owner",   type: "address" }, { indexed: true,  name: "spender", type: "address" }, { indexed: false, name: "value",   type: "uint256" }] },
] as const satisfies Abi;
