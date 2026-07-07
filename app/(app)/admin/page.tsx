"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAuthStore } from "@/store/auth.store";
import { useSIWE } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAddress, formatTimestamp } from "@/lib/utils";
import { toast } from "sonner";
import { Shield, Settings, Users, BarChart3, Gavel, DollarSign } from "lucide-react";
import { formatEther } from "viem";

// Import all admin hooks
import {
  useSetDeploymentFee,
  useSetFeeRecipient,
  useDeploymentFee,
  useFeeRecipient,
} from "@/hooks/useFactory";

import {
  useRegisterBorrower,
  useRemoveBorrower,
  useAddBlacklist,
  useRemoveBlacklist,
} from "@/hooks/useArchController";

import {
  usePendingBorrowerRequests,
  useRejectBorrowerRequest,
} from "@/hooks/useBorrowerRequests";

import {
  usePauseMarket,
  useUnpauseMarket,
  useSetGuardian,
  useEndLiquidation,
  useMarketStatus,
} from "@/hooks/useMarketAdmin";

import {
  useSetAuctionDuration,
  useSetMinBidIncrementBps,
  useSetAuctionExtensionWindow,
  useSetDutchAuctionParams,
  useCancelAuction,
  useAuctionParams,
} from "@/hooks/useLiquidatorAdmin";

import {
  useSetMinCollateralRatio,
  useSetLiquidationThreshold,
  useCollateralParams,
} from "@/hooks/useEscrowAdmin";

import {
  useSetOraclePrice,
  useOraclePrice,
} from "@/hooks/useOracleAdmin";

import {
  useRegisterMarket,
  useUnregisterMarket,
  useSetBaseURI,
} from "@/hooks/usePositionNFTAdmin";

import { useProcessEpoch } from "@/hooks/usePositions";
import { useCurrentEpochStatus } from "@/hooks/useLiquidityQueueMetrics";

import { MarketSelector } from "@/components/MarketSelector";
import { useMarkets } from "@/hooks/useMarkets";

// Contract addresses from env
const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "") as `0x${string}`;
const LIQUIDATOR_ADDRESS = (process.env.NEXT_PUBLIC_LIQUIDATOR_ADDRESS || "") as `0x${string}`;
const POSITION_NFT_ADDRESS = (process.env.NEXT_PUBLIC_POSITION_NFT_ADDRESS || "") as `0x${string}`;

export default function AdminDashboard() {
  const { address } = useAccount();
  const { data: adminCheck, isLoading: adminCheckLoading } = useAdminCheck();
  const { isAuthenticated } = useAuthStore();
  const { login, isSigningIn } = useSIWE();
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [selectedMarket, setSelectedMarket] = useState("");
  const [newDeploymentFee, setNewDeploymentFee] = useState("");
  const [newFeeRecipient, setNewFeeRecipient] = useState("");
  const [newBorrowerAddress, setNewBorrowerAddress] = useState("");
  const [removeBorrowerAddress, setRemoveBorrowerAddress] = useState("");
  const [blacklistAssetAddress, setBlacklistAssetAddress] = useState("");
  const [removeBlacklistAddress, setRemoveBlacklistAddress] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("");
  const [minBidIncrement, setMinBidIncrement] = useState("");
  const [extensionWindow, setExtensionWindow] = useState("");
  const [stepDuration, setStepDuration] = useState("");
  const [decrementBps, setDecrementBps] = useState("");
  const [cancelAuctionId, setCancelAuctionId] = useState("");
  const [escrowAddress, setEscrowAddress] = useState("");
  const [minCollateralRatio, setMinCollateralRatio] = useState("");
  const [liquidationThreshold, setLiquidationThreshold] = useState("");
  const [oracleAddress, setOracleAddress] = useState("");
  const [newOraclePrice, setNewOraclePrice] = useState("");

  // New states for PositionNFT and Epoch processing
  const [nftMarketAddress, setNftMarketAddress] = useState("");
  const [nftBaseURI, setNftBaseURI] = useState("");
  const [epochNumber, setEpochNumber] = useState("");
  const [epochLiquidity, setEpochLiquidity] = useState("");

  // Hooks
  const { data: markets } = useMarkets({ is_active: true });
  const { data: deploymentFee } = useDeploymentFee();
  const { data: feeRecipient } = useFeeRecipient();
  const marketStatus = useMarketStatus(selectedMarket as `0x${string}`);
  const auctionParams = useAuctionParams(LIQUIDATOR_ADDRESS);
  const collateralParams = useCollateralParams(escrowAddress as `0x${string}`);
  const oracleData = useOraclePrice(oracleAddress as `0x${string}`);
  const epochStatus = useCurrentEpochStatus(selectedMarket as `0x${string}`);

  // Mutations
  const setDeploymentFee = useSetDeploymentFee();
  const setFeeRecipient = useSetFeeRecipient();
  const registerBorrower = useRegisterBorrower();
  const removeBorrower = useRemoveBorrower();
  const { data: pendingRequests, isLoading: pendingRequestsLoading } = usePendingBorrowerRequests("pending");
  const rejectBorrowerRequest = useRejectBorrowerRequest();
  const addBlacklist = useAddBlacklist();
  const removeBlacklist = useRemoveBlacklist();
  const pauseMarket = usePauseMarket();
  const unpauseMarket = useUnpauseMarket();
  const setGuardian = useSetGuardian();
  const endLiquidation = useEndLiquidation();
  const setAuctionDurationMutation = useSetAuctionDuration(LIQUIDATOR_ADDRESS);
  const registerMarket = useRegisterMarket();
  const unregisterMarket = useUnregisterMarket();
  const setBaseURI = useSetBaseURI();
  const processEpoch = useProcessEpoch();
  const setMinBidIncrementBpsMutation = useSetMinBidIncrementBps(LIQUIDATOR_ADDRESS);
  const setAuctionExtensionWindowMutation = useSetAuctionExtensionWindow(LIQUIDATOR_ADDRESS);
  const setDutchAuctionParamsMutation = useSetDutchAuctionParams(LIQUIDATOR_ADDRESS);
  const cancelAuction = useCancelAuction(LIQUIDATOR_ADDRESS);
  const setMinCollateralRatioMutation = useSetMinCollateralRatio();
  const setLiquidationThresholdMutation = useSetLiquidationThreshold();
  const setOraclePrice = useSetOraclePrice();

  // The admin check itself requires a signed-in (SIWE) session — asking
  // "is this address an admin?" before signing in just 401s, which would
  // otherwise be indistinguishable from a genuine non-admin wallet. Surface
  // this as "please sign in" instead of a hard access-denied screen.
  if (address && !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <Card className="p-8 max-w-md text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold text-on-surface mb-2">Sign In Required</h2>
          <p className="text-on-surface-variant mb-4">
            Sign in with your wallet to verify admin access.
          </p>
          <p className="text-sm text-on-surface-variant/60 mono mb-4">{formatAddress(address)}</p>
          <Button onClick={() => login()} loading={isSigningIn}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (adminCheckLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
          <p className="text-on-surface-variant">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!adminCheck?.is_admin) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <Card className="p-8 max-w-md text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-on-surface mb-2">Access Denied</h2>
          <p className="text-on-surface-variant mb-4">
            You do not have permission to access the admin dashboard.
          </p>
          <p className="text-sm text-on-surface-variant/60 mono">
            {address ? formatAddress(address) : "Not connected"}
          </p>
        </Card>
      </div>
    );
  }

  const selectedMarketData = markets?.markets.find((m) => m.address === selectedMarket);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto" data-testid="admin-dashboard">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1">
          System Administration
        </p>
        <h1 className="text-2xl font-semibold text-on-surface">Admin Dashboard</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Manage protocol configuration, markets, and system parameters
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="factory"><Settings className="h-4 w-4 mr-2" />Factory</TabsTrigger>
          <TabsTrigger value="borrowers"><Users className="h-4 w-4 mr-2" />Borrowers</TabsTrigger>
          <TabsTrigger value="markets"><Shield className="h-4 w-4 mr-2" />Markets</TabsTrigger>
          <TabsTrigger value="liquidator"><Gavel className="h-4 w-4 mr-2" />Liquidator</TabsTrigger>
          <TabsTrigger value="oracle"><DollarSign className="h-4 w-4 mr-2" />Oracle</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Total Markets</p>
              <p className="text-2xl font-bold text-on-surface mt-1">{markets?.count || 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Deployment Fee</p>
              <p className="text-2xl font-bold text-on-surface mt-1">
                {deploymentFee ? formatEther(deploymentFee) : "0"} ETH
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Factory Address</p>
              <p className="text-xs font-mono text-on-surface mt-1">{formatAddress(FACTORY_ADDRESS)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Liquidator Address</p>
              <p className="text-xs font-mono text-on-surface mt-1">{formatAddress(LIQUIDATOR_ADDRESS)}</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setActiveTab("borrowers")} variant="secondary">Manage Borrowers</Button>
              <Button onClick={() => setActiveTab("markets")} variant="secondary">Manage Markets</Button>
              <Button onClick={() => setActiveTab("liquidator")} variant="secondary">Configure Liquidator</Button>
              <Button onClick={() => setActiveTab("oracle")} variant="secondary">Update Oracle Prices</Button>
            </div>
          </Card>
        </TabsContent>

        {/* FACTORY TAB */}
        <TabsContent value="factory" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Deployment Fee</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-on-surface-variant mb-1">Current Fee</p>
                <p className="text-2xl font-bold text-on-surface">
                  {deploymentFee ? formatEther(deploymentFee) : "0"} ETH
                </p>
              </div>
              <Input
                label="New Deployment Fee (ETH)"
                value={newDeploymentFee}
                onChange={(e) => setNewDeploymentFee(e.target.value)}
                placeholder="0.01"
              />
              <Button
                onClick={() => {
                  if (!newDeploymentFee) {
                    toast.error("Please enter a fee amount");
                    return;
                  }
                  setDeploymentFee.mutate({ feeInEther: newDeploymentFee });
                }}
                loading={setDeploymentFee.isPending}
                disabled={!newDeploymentFee}
              >
                Update Deployment Fee
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Fee Recipient</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-on-surface-variant mb-1">Current Recipient</p>
                <p className="text-sm font-mono text-on-surface">
                  {feeRecipient || "Not set"}
                </p>
              </div>
              <Input
                label="New Fee Recipient Address"
                value={newFeeRecipient}
                onChange={(e) => setNewFeeRecipient(e.target.value)}
                placeholder="0x..."
              />
              <Button
                onClick={() => {
                  if (!newFeeRecipient) {
                    toast.error("Please enter a recipient address");
                    return;
                  }
                  setFeeRecipient.mutate({ recipient: newFeeRecipient as `0x${string}` });
                }}
                loading={setFeeRecipient.isPending}
                disabled={!newFeeRecipient}
              >
                Update Fee Recipient
              </Button>
            </div>
          </Card>

          {/* POSITION NFT ADMIN */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Position NFT Management</h3>
            <div className="space-y-6">
              {/* Register Market */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-on-surface-variant">Register Market for NFT Minting</p>
                <Input
                  label="Market Address"
                  value={nftMarketAddress}
                  onChange={(e) => setNftMarketAddress(e.target.value)}
                  placeholder="0x..."
                />
                <Button
                  onClick={() => {
                    if (!nftMarketAddress) {
                      toast.error("Please enter a market address");
                      return;
                    }
                    registerMarket.mutate({ marketAddress: nftMarketAddress as `0x${string}` });
                    setNftMarketAddress("");
                  }}
                  loading={registerMarket.isPending}
                  disabled={!nftMarketAddress}
                >
                  Register Market
                </Button>
              </div>

              {/* Unregister Market */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <p className="text-sm font-semibold text-on-surface-variant">Unregister Market</p>
                <Button
                  onClick={() => {
                    if (!nftMarketAddress) {
                      toast.error("Please enter a market address above");
                      return;
                    }
                    unregisterMarket.mutate({ marketAddress: nftMarketAddress as `0x${string}` });
                  }}
                  loading={unregisterMarket.isPending}
                  disabled={!nftMarketAddress}
                  variant="destructive"
                >
                  Unregister Market
                </Button>
              </div>

              {/* Set Base URI */}
              <div className="space-y-3 pt-4 border-t border-outline-variant/20">
                <p className="text-sm font-semibold text-on-surface-variant">NFT Metadata Base URI</p>
                <Input
                  label="Base URI"
                  value={nftBaseURI}
                  onChange={(e) => setNftBaseURI(e.target.value)}
                  placeholder="https://api.revvfi.com/nft/metadata/"
                />
                <Button
                  onClick={() => {
                    if (!nftBaseURI) {
                      toast.error("Please enter a base URI");
                      return;
                    }
                    setBaseURI.mutate({ baseURI: nftBaseURI });
                    setNftBaseURI("");
                  }}
                  loading={setBaseURI.isPending}
                  disabled={!nftBaseURI}
                >
                  Update Base URI
                </Button>
              </div>

              <div className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded">
                <p className="font-semibold mb-1">ℹ️ Position NFT Info</p>
                <p>Address: <span className="font-mono">{formatAddress(POSITION_NFT_ADDRESS)}</span></p>
                <p className="mt-1">Register markets to allow them to mint position NFTs. Set the base URI for NFT metadata.</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* BORROWERS TAB */}
        <TabsContent value="borrowers" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Pending Access Requests</h3>
              {!!pendingRequests?.count && (
                <span className="text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full px-2 py-0.5">
                  {pendingRequests.count} pending
                </span>
              )}
            </div>
            {pendingRequestsLoading ? (
              <Skeleton className="h-16" />
            ) : !pendingRequests?.requests.length ? (
              <p className="text-sm text-on-surface-variant">No pending borrower access requests.</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/20 bg-surface-container-low p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-on-surface truncate">{req.wallet_address}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Requested {formatTimestamp(req.requested_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectBorrowerRequest.mutate({ id: req.id })}
                        loading={rejectBorrowerRequest.isPending && rejectBorrowerRequest.variables?.id === req.id}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => registerBorrower.mutate({ borrower: req.wallet_address as `0x${string}` })}
                        loading={registerBorrower.isPending && registerBorrower.variables?.borrower === req.wallet_address}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Register Borrower</h3>
            <div className="space-y-3">
              <Input
                label="Borrower Address"
                value={newBorrowerAddress}
                onChange={(e) => setNewBorrowerAddress(e.target.value)}
                placeholder="0x..."
              />
              <Button
                onClick={() => {
                  if (!newBorrowerAddress) {
                    toast.error("Please enter a borrower address");
                    return;
                  }
                  registerBorrower.mutate({ borrower: newBorrowerAddress as `0x${string}` });
                  setNewBorrowerAddress("");
                }}
                loading={registerBorrower.isPending}
                disabled={!newBorrowerAddress}
              >
                Register Borrower
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Remove Borrower</h3>
            <div className="space-y-3">
              <Input
                label="Borrower Address"
                value={removeBorrowerAddress}
                onChange={(e) => setRemoveBorrowerAddress(e.target.value)}
                placeholder="0x..."
              />
              <Button
                onClick={() => {
                  if (!removeBorrowerAddress) {
                    toast.error("Please enter a borrower address");
                    return;
                  }
                  removeBorrower.mutate({ borrower: removeBorrowerAddress as `0x${string}` });
                  setRemoveBorrowerAddress("");
                }}
                loading={removeBorrower.isPending}
                disabled={!removeBorrowerAddress}
                variant="destructive"
              >
                Remove Borrower
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Asset Blacklist</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <Input
                  label="Add Asset to Blacklist"
                  value={blacklistAssetAddress}
                  onChange={(e) => setBlacklistAssetAddress(e.target.value)}
                  placeholder="0x... (asset address)"
                />
                <Button
                  onClick={() => {
                    if (!blacklistAssetAddress) {
                      toast.error("Please enter an asset address");
                      return;
                    }
                    addBlacklist.mutate({ asset: blacklistAssetAddress as `0x${string}` });
                    setBlacklistAssetAddress("");
                  }}
                  loading={addBlacklist.isPending}
                  disabled={!blacklistAssetAddress}
                >
                  Add to Blacklist
                </Button>
              </div>

              <div className="space-y-3">
                <Input
                  label="Remove Asset from Blacklist"
                  value={removeBlacklistAddress}
                  onChange={(e) => setRemoveBlacklistAddress(e.target.value)}
                  placeholder="0x... (asset address)"
                />
                <Button
                  onClick={() => {
                    if (!removeBlacklistAddress) {
                      toast.error("Please enter an asset address");
                      return;
                    }
                    removeBlacklist.mutate({ asset: removeBlacklistAddress as `0x${string}` });
                    setRemoveBlacklistAddress("");
                  }}
                  loading={removeBlacklist.isPending}
                  disabled={!removeBlacklistAddress}
                  variant="secondary"
                >
                  Remove from Blacklist
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* MARKETS TAB */}
        <TabsContent value="markets" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Select Market</h3>
            <MarketSelector
              value={selectedMarket}
              onValueChange={setSelectedMarket}
              showBadge={false}
            />
          </Card>

          {selectedMarket && (
            <>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Market Status</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-on-surface-variant">Paused</p>
                      <p className="text-lg font-semibold text-on-surface">
                        {marketStatus?.isPaused ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant">Liquidating</p>
                      <p className="text-lg font-semibold text-on-surface">
                        {marketStatus?.isLiquidating ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-on-surface-variant">Guardian</p>
                    <p className="text-sm font-mono text-on-surface">
                      {marketStatus?.guardian || "Not set"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Market Controls</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => pauseMarket.mutate({ marketAddress: selectedMarket as `0x${string}` })}
                      loading={pauseMarket.isPending}
                      disabled={marketStatus?.isPaused}
                      variant="destructive"
                      className="flex-1"
                    >
                      Pause Market
                    </Button>
                    <Button
                      onClick={() => unpauseMarket.mutate({ marketAddress: selectedMarket as `0x${string}` })}
                      loading={unpauseMarket.isPending}
                      disabled={!marketStatus?.isPaused}
                      className="flex-1"
                    >
                      Unpause Market
                    </Button>
                  </div>

                  {marketStatus?.isLiquidating && (
                    <Button
                      onClick={() => endLiquidation.mutate({ marketAddress: selectedMarket as `0x${string}` })}
                      loading={endLiquidation.isPending}
                      variant="secondary"
                      className="w-full"
                    >
                      End Liquidation
                    </Button>
                  )}

                  <div className="space-y-2">
                    <Input
                      label="Set Guardian Address"
                      value={guardianAddress}
                      onChange={(e) => setGuardianAddress(e.target.value)}
                      placeholder="0x..."
                    />
                    <Button
                      onClick={() => {
                        if (!guardianAddress) {
                          toast.error("Please enter a guardian address");
                          return;
                        }
                        setGuardian.mutate({
                          marketAddress: selectedMarket as `0x${string}`,
                          guardianAddress: guardianAddress as `0x${string}`
                        });
                        setGuardianAddress("");
                      }}
                      loading={setGuardian.isPending}
                      disabled={!guardianAddress}
                      className="w-full"
                    >
                      Update Guardian
                    </Button>
                  </div>

                  {selectedMarketData && (
                    <div className="mt-4 p-4 bg-surface-container rounded-lg">
                      <h4 className="text-sm font-semibold text-on-surface mb-2">Escrow Controls</h4>
                      <Input
                        label="Escrow Address"
                        value={escrowAddress}
                        onChange={(e) => setEscrowAddress(e.target.value)}
                        placeholder="Get from market contract"
                        className="mb-3"
                      />
                      {escrowAddress && collateralParams && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-on-surface-variant">Min Collateral Ratio</p>
                              <p className="text-sm font-semibold text-on-surface">
                                {collateralParams.minCollateralRatio / 100}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-on-surface-variant">Liquidation Threshold</p>
                              <p className="text-sm font-semibold text-on-surface">
                                {collateralParams.liquidationThreshold / 100}%
                              </p>
                            </div>
                          </div>
                          <Input
                            label="New Min Collateral Ratio (bps, e.g. 11000 = 110%)"
                            value={minCollateralRatio}
                            onChange={(e) => setMinCollateralRatio(e.target.value)}
                            placeholder="11000"
                          />
                          <Button
                            onClick={() => {
                              if (!minCollateralRatio) {
                                toast.error("Please enter a ratio");
                                return;
                              }
                              setMinCollateralRatioMutation.mutate({
                                escrowAddress: escrowAddress as `0x${string}`,
                                ratioBps: parseInt(minCollateralRatio)
                              });
                              setMinCollateralRatio("");
                            }}
                            loading={setMinCollateralRatioMutation.isPending}
                            disabled={!minCollateralRatio}
                            className="w-full"
                          >
                            Update Min Collateral Ratio
                          </Button>
                          <Input
                            label="New Liquidation Threshold (bps, e.g. 10500 = 105%)"
                            value={liquidationThreshold}
                            onChange={(e) => setLiquidationThreshold(e.target.value)}
                            placeholder="10500"
                          />
                          <Button
                            onClick={() => {
                              if (!liquidationThreshold) {
                                toast.error("Please enter a threshold");
                                return;
                              }
                              setLiquidationThresholdMutation.mutate({
                                escrowAddress: escrowAddress as `0x${string}`,
                                thresholdBps: parseInt(liquidationThreshold)
                              });
                              setLiquidationThreshold("");
                            }}
                            loading={setLiquidationThresholdMutation.isPending}
                            disabled={!liquidationThreshold}
                            className="w-full"
                          >
                            Update Liquidation Threshold
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* EPOCH PROCESSING */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">Withdrawal Epoch Processing</h3>
                <div className="space-y-4">
                  {epochStatus && (
                    <div className="p-4 bg-surface-container rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-on-surface-variant">Current Epoch</p>
                          <p className="text-lg font-semibold text-on-surface">
                            #{epochStatus.epochNumber?.toString() || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-on-surface-variant">Time Remaining</p>
                          <p className="text-lg font-semibold text-on-surface">
                            {epochStatus.timeRemaining ?
                              `${(Number(epochStatus.timeRemaining) / 3600).toFixed(1)}h` :
                              "—"}
                          </p>
                        </div>
                      </div>
                      {epochStatus.epochDetails && (
                        <div className="pt-2 border-t border-outline-variant/20 text-xs space-y-1">
                          <p><span className="text-on-surface-variant">Start:</span> {new Date(Number(epochStatus.epochDetails.startTime) * 1000).toLocaleString()}</p>
                          <p><span className="text-on-surface-variant">End:</span> {new Date(Number(epochStatus.epochDetails.endTime) * 1000).toLocaleString()}</p>
                          <p><span className="text-on-surface-variant">Processed:</span> {epochStatus.epochDetails.processed ? "Yes ✓" : "No"}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <Input
                    label="Epoch Number to Process"
                    type="number"
                    value={epochNumber}
                    onChange={(e) => setEpochNumber(e.target.value)}
                    placeholder="Enter epoch number"
                  />
                  <Input
                    label={`Available Liquidity (${selectedMarketData?.borrow_asset.symbol || "USDC"})`}
                    type="number"
                    value={epochLiquidity}
                    onChange={(e) => setEpochLiquidity(e.target.value)}
                    placeholder="0.00"
                  />
                  <Button
                    onClick={() => {
                      if (!epochNumber || !epochLiquidity) {
                        toast.error("Please enter epoch number and liquidity amount");
                        return;
                      }
                      if (!selectedMarket || !selectedMarketData) {
                        toast.error("Please select a market first");
                        return;
                      }
                      processEpoch.mutate({
                        marketAddress: selectedMarket,
                        epochNumber: parseInt(epochNumber),
                        availableLiquidity: epochLiquidity,
                        borrowAssetDecimals: selectedMarketData.borrow_asset.decimals,
                      });
                      setEpochNumber("");
                      setEpochLiquidity("");
                    }}
                    loading={processEpoch.isPending}
                    disabled={!epochNumber || !epochLiquidity}
                    className="w-full"
                  >
                    Process Epoch
                  </Button>

                  <div className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded">
                    <p className="font-semibold mb-1">⏱️ Epoch Processing Info</p>
                    <p>Epochs run for 7 days. Process an epoch after it ends to fulfill pro-rata withdrawal requests based on available liquidity.</p>
                    <p className="mt-1">Users can claim their fulfilled withdrawals after epoch is processed.</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        {/* LIQUIDATOR TAB */}
        <TabsContent value="liquidator" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Current Parameters</h3>
            {auctionParams && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-on-surface-variant">Auction Duration</p>
                  <p className="text-lg font-semibold text-on-surface">
                    {(auctionParams.auctionDuration / 86400).toFixed(1)} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Min Bid Increment</p>
                  <p className="text-lg font-semibold text-on-surface">
                    {auctionParams.minBidIncrementBps / 100}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Extension Window</p>
                  <p className="text-lg font-semibold text-on-surface">
                    {(auctionParams.auctionExtensionWindow / 60).toFixed(0)} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Dutch Step Duration</p>
                  <p className="text-lg font-semibold text-on-surface">
                    {(auctionParams.dutchAuctionStepDuration / 3600).toFixed(0)} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-on-surface-variant">Price Decrement</p>
                  <p className="text-lg font-semibold text-on-surface">
                    {auctionParams.dutchAuctionPriceDecrementBps / 100}% per step
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Update Parameters</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="Auction Duration (seconds, e.g. 259200 = 3 days)"
                  value={auctionDuration}
                  onChange={(e) => setAuctionDuration(e.target.value)}
                  placeholder="259200"
                />
                <Button
                  onClick={() => {
                    if (!auctionDuration) {
                      toast.error("Please enter duration");
                      return;
                    }
                    setAuctionDurationMutation.mutate({ durationSeconds: parseInt(auctionDuration) });
                    setAuctionDuration("");
                  }}
                  loading={setAuctionDurationMutation.isPending}
                  disabled={!auctionDuration}
                  className="w-full"
                >
                  Update Auction Duration
                </Button>
              </div>

              <div className="space-y-2">
                <Input
                  label="Min Bid Increment (bps, e.g. 100 = 1%)"
                  value={minBidIncrement}
                  onChange={(e) => setMinBidIncrement(e.target.value)}
                  placeholder="100"
                />
                <Button
                  onClick={() => {
                    if (!minBidIncrement) {
                      toast.error("Please enter increment");
                      return;
                    }
                    setMinBidIncrementBpsMutation.mutate({ incrementBps: parseInt(minBidIncrement) });
                    setMinBidIncrement("");
                  }}
                  loading={setMinBidIncrementBpsMutation.isPending}
                  disabled={!minBidIncrement}
                  className="w-full"
                >
                  Update Min Bid Increment
                </Button>
              </div>

              <div className="space-y-2">
                <Input
                  label="Extension Window (seconds, e.g. 900 = 15 min)"
                  value={extensionWindow}
                  onChange={(e) => setExtensionWindow(e.target.value)}
                  placeholder="900"
                />
                <Button
                  onClick={() => {
                    if (!extensionWindow) {
                      toast.error("Please enter window");
                      return;
                    }
                    setAuctionExtensionWindowMutation.mutate({ windowSeconds: parseInt(extensionWindow) });
                    setExtensionWindow("");
                  }}
                  loading={setAuctionExtensionWindowMutation.isPending}
                  disabled={!extensionWindow}
                  className="w-full"
                >
                  Update Extension Window
                </Button>
              </div>

              <div className="space-y-2">
                <Input
                  label="Dutch Step Duration (seconds, e.g. 3600 = 1 hour)"
                  value={stepDuration}
                  onChange={(e) => setStepDuration(e.target.value)}
                  placeholder="3600"
                />
                <Input
                  label="Price Decrement (bps, e.g. 500 = 5%)"
                  value={decrementBps}
                  onChange={(e) => setDecrementBps(e.target.value)}
                  placeholder="500"
                />
                <Button
                  onClick={() => {
                    if (!stepDuration || !decrementBps) {
                      toast.error("Please enter both values");
                      return;
                    }
                    setDutchAuctionParamsMutation.mutate({
                      stepDurationSeconds: parseInt(stepDuration),
                      decrementBps: parseInt(decrementBps)
                    });
                    setStepDuration("");
                    setDecrementBps("");
                  }}
                  loading={setDutchAuctionParamsMutation.isPending}
                  disabled={!stepDuration || !decrementBps}
                  className="w-full"
                >
                  Update Dutch Auction Params
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Cancel Auction</h3>
            <div className="space-y-2">
              <Input
                label="Auction ID"
                value={cancelAuctionId}
                onChange={(e) => setCancelAuctionId(e.target.value)}
                placeholder="1"
              />
              <Button
                onClick={() => {
                  if (!cancelAuctionId) {
                    toast.error("Please enter auction ID");
                    return;
                  }
                  cancelAuction.mutate({ auctionId: parseInt(cancelAuctionId) });
                  setCancelAuctionId("");
                }}
                loading={cancelAuction.isPending}
                disabled={!cancelAuctionId}
                variant="destructive"
                className="w-full"
              >
                Cancel Auction
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ORACLE TAB */}
        <TabsContent value="oracle" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Oracle Configuration</h3>
            <div className="space-y-3">
              <Input
                label="Oracle Address"
                value={oracleAddress}
                onChange={(e) => setOracleAddress(e.target.value)}
                placeholder="0x..."
              />
              {oracleAddress && oracleData && (
                <div className="p-4 bg-surface-container rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-on-surface-variant">Current Price</p>
                      <p className="text-xl font-bold text-on-surface">
                        ${oracleData.price.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-on-surface-variant">Status</p>
                      <p className={`text-sm font-semibold ${oracleData.isStale ? "text-red-400" : "text-emerald-400"}`}>
                        {oracleData.isStale ? "Stale" : "Fresh"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">Last Updated</p>
                    <p className="text-xs text-on-surface">
                      {new Date(oracleData.updatedAt * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Update Price</h3>
            <div className="space-y-3">
              <Input
                label="New Price (USD, e.g. 2000 for $2000)"
                value={newOraclePrice}
                onChange={(e) => setNewOraclePrice(e.target.value)}
                placeholder="2000"
              />
              <Button
                onClick={() => {
                  if (!oracleAddress || !newOraclePrice) {
                    toast.error("Please enter oracle address and price");
                    return;
                  }
                  setOraclePrice.mutate({
                    oracleAddress: oracleAddress as `0x${string}`,
                    price: newOraclePrice
                  });
                  setNewOraclePrice("");
                }}
                loading={setOraclePrice.isPending}
                disabled={!oracleAddress || !newOraclePrice}
                className="w-full"
              >
                Update Oracle Price
              </Button>
              <p className="text-xs text-on-surface-variant">
                ⚠️ This only works with MockOracle contracts. Production oracles cannot be updated manually.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
