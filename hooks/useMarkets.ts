"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWriteContract, usePublicClient, useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { toast } from "sonner";
import { marketService, type MarketsParams } from "@/services/market.service";
import { queryKeys } from "@/constants/query-keys";
import { FACTORY_ABI } from "@/lib/contracts/abis";
import { CONTRACT_ADDRESSES } from "@/lib/contracts/addresses";
import { wagmiConfig } from "@/providers/wagmi-config";
import type { CreateMarketRequest } from "@/types";

export interface DeployMarketParams extends CreateMarketRequest {
  borrower_address: string;
}

export function useMarkets(params?: MarketsParams) {
  return useQuery({
    queryKey: queryKeys.markets.all(params),
    queryFn: () => marketService.getMarkets(params),
  });
}

export function useMarket(address: string) {
  return useQuery({
    queryKey: queryKeys.markets.detail(address),
    queryFn: () => marketService.getMarket(address),
    enabled: !!address,
  });
}

export function useMarketMetrics(address: string) {
  return useQuery({
    queryKey: queryKeys.markets.metrics(address),
    queryFn: () => marketService.getMarketMetrics(address),
    enabled: !!address,
    refetchInterval: 30_000,
  });
}

export function useCreateMarket() {
  const qc = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  return useMutation({
    mutationFn: async (payload: DeployMarketParams) => {
      const {
        borrower_address,
        borrow_asset,
        collateral_asset,
        collateral_oracle,
        collateral_asset_decimals,
        borrow_asset_decimals,
        min_collateral_ratio,
        liquidation_threshold,
      } = payload;

      // Read the current deployment fee from the factory
      const deploymentFee = (await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES.factory,
        abi: FACTORY_ABI,
        functionName: "deploymentFee",
      })) as bigint;

      toast.info("Deploying market on-chain…");

      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.factory,
        abi: FACTORY_ABI,
        functionName: "deployMarket",
        args: [
          borrower_address as `0x${string}`,
          borrow_asset as `0x${string}`,
          collateral_asset as `0x${string}`,
          collateral_oracle as `0x${string}`,
          collateral_asset_decimals,
          borrow_asset_decimals,
          BigInt(min_collateral_ratio),
          BigInt(liquidation_threshold),
        ],
        value: deploymentFee,
      });

      toast.info("Waiting for confirmation…");
      const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash });

      // Parse MarketDeployed event to get new market address
      let newMarketAddress: string | null = null;
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === CONTRACT_ADDRESSES.factory.toLowerCase()) {
          try {
            const { decodeEventLog } = await import('viem');
            const decoded = decodeEventLog({
              abi: FACTORY_ABI,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'MarketDeployed') {
              newMarketAddress = (decoded.args as any).market;
              console.log('Market deployed:', newMarketAddress);
              break;
            }
          } catch (e) {
            console.log('Log parsing error:', e);
            // Skip non-matching logs
          }
        }
      }

      // Wait for indexer to sync (give it 3 seconds)
      if (newMarketAddress) {
        toast.info("Syncing with indexer…");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      return { txHash, marketAddress: newMarketAddress };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.markets.all() });
      toast.success(`Market deployed: ${data.marketAddress?.slice(0, 10)}...`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
