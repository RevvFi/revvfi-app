"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSendTransaction } from "wagmi";
import { useAuthStore } from "@/store/auth.store";
import { adminService } from "@/services/admin.service";
import { queryKeys } from "@/constants/query-keys";
import { Card, MetricCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatAddress, formatTimestamp, formatRelativeTime, formatAPR } from "@/lib/utils";
import { Shield, AlertTriangle, Download, CheckCircle, XCircle, RefreshCw, Pause, Play, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";

// ── Sections ────────────────────────────────────────────────────────────────

function OverviewSection() {
  const { data: overview } = useQuery({ queryKey: queryKeys.admin.statsOverview, queryFn: adminService.getStatsOverview });
  const { data: health } = useQuery({ queryKey: queryKeys.admin.health, queryFn: adminService.getHealth, refetchInterval: 30000 });
  const { data: fees } = useQuery({ queryKey: queryKeys.admin.feesCollected, queryFn: adminService.getFeesCollected });

  const ov = overview?.data;
  const h = health?.data;

  return (
    <div className="space-y-5">
      {/* Health banner */}
      <div className={`rounded-lg border p-3 flex items-center gap-3 ${h?.status === "healthy" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-400/30 bg-amber-400/5"}`}>
        {h?.status === "healthy"
          ? <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          : <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />}
        <div className="flex-1">
          <p className="text-sm font-semibold text-on-surface">System Status: <span className={h?.status === "healthy" ? "text-emerald-400" : "text-amber-400"}>{h?.status ?? "checking..."}</span></p>
          <p className="text-xs text-on-surface-variant">
            {h ? `Markets: ${h.total_markets} · Positions: ${h.active_positions}` : "Loading..."}
          </p>
        </div>
        <div className="flex gap-4 text-xs text-right shrink-0">
          <div><p className="text-on-surface-variant">Markets</p><p className="font-bold text-on-surface">{h?.total_markets ?? "—"}</p></div>
          <div><p className="text-on-surface-variant">TVL</p><p className="font-bold text-emerald-400">{h ? `$${(parseFloat(h.total_tvl) / 1e6).toFixed(2)}M` : "—"}</p></div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total TVL" value={`$${(parseFloat(ov?.total_liquidity_wei ?? "0") / 1e6).toFixed(2)}M`} sub="Protocol liquidity" />
        <MetricCard label="Active Markets" value={ov?.active_markets ?? "—"} sub={`${ov?.total_markets ?? 0} total`} />
        <MetricCard label="Active Borrowers" value={ov?.active_borrowers ?? "—"} sub={`${ov?.total_borrowers ?? 0} registered`} />
        <MetricCard label="Fees Collected" value={`${(parseFloat(fees?.data?.total_fees_eth ?? "0")).toFixed(4)} ETH`} sub={formatAddress(fees?.data?.recipient_address ?? "")} />
      </div>

      {/* Protocol config */}
      <ProtocolConfigPanel />
    </div>
  );
}

function ProtocolConfigPanel() {
  const { data: cfg } = useQuery({ queryKey: queryKeys.admin.protocolConfig, queryFn: adminService.getProtocolConfig });
  const { data: sys } = useQuery({ queryKey: queryKeys.admin.systemConfig, queryFn: adminService.getSystemConfig });
  const c = cfg?.data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Protocol Config</p>
        {c ? (
          <div className="space-y-2.5">
            {[
              ["Deployment Fee", `${c.deployment_fee_eth} ETH`],
              ["Fee Recipient", formatAddress(c.fee_recipient)],
              ["Arch Controller", formatAddress(c.arch_controller)],
              ["Position NFT", formatAddress(c.position_nft)],
              ["Liquidator", formatAddress(c.liquidator)],
              ["Timelock Delay", `${c.timelock_delay_days} days`],
              ["Core Contracts Set", c.is_core_contracts_set ? "Yes" : "No"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{k}</span>
                <span className="mono font-medium text-on-surface">{v}</span>
              </div>
            ))}
          </div>
        ) : <Skeleton className="h-40" />}
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">System Config ({sys?.data?.total ?? 0} entries)</p>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {sys?.data?.configs?.map((cfg) => (
            <div key={cfg.key} className="flex justify-between text-sm py-1 border-b border-outline-variant/10">
              <span className="text-on-surface-variant text-xs mono">{cfg.key}</span>
              <span className="text-xs font-medium text-on-surface mono">{cfg.value}</span>
            </div>
          )) ?? <Skeleton className="h-32" />}
        </div>
      </Card>
    </div>
  );
}

function BorrowersSection() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({ queryKey: queryKeys.admin.borrowers(), queryFn: () => adminService.getBorrowers() });
  const { data: pending } = useQuery({ queryKey: queryKeys.admin.pendingBorrowers, queryFn: adminService.getPendingBorrowers });

  const borrowers = data?.data?.borrowers ?? [];
  const filtered = search ? borrowers.filter(b => b.address.toLowerCase().includes(search.toLowerCase())) : borrowers;

  return (
    <div className="space-y-4">
      {pending?.data?.pending_count ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400">{pending.data.pending_count} borrower registration(s) pending approval</p>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
          <input
            className="h-10 w-full rounded border border-outline-variant/50 bg-surface-container-low pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary-container focus:outline-none"
            placeholder="Search by wallet address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <p className="text-xs text-on-surface-variant">{filtered.length} of {borrowers.length} borrowers</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Rep Score</TableHead>
              <TableHead className="text-right">Active Offers</TableHead>
              <TableHead className="text-right">Defaults</TableHead>
              <TableHead className="text-right">Total Borrowed</TableHead>
              <TableHead className="text-right">Total Repaid</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}</TableRow>
              ))
            ) : filtered.length ? (
              filtered.map((b) => (
                <TableRow key={b.address}>
                  <TableCell><span className="mono text-xs">{formatAddress(b.address)}</span></TableCell>
                  <TableCell className="text-right font-bold text-primary">{b.reputation_score}</TableCell>
                  <TableCell className="text-right">{b.active_offers}</TableCell>
                  <TableCell className="text-right"><span className={b.default_count > 0 ? "text-red-400" : "text-emerald-400"}>{b.default_count}</span></TableCell>
                  <TableCell className="text-right mono">${(parseFloat(b.total_borrowed) / 1e6).toFixed(2)}M</TableCell>
                  <TableCell className="text-right mono">${(parseFloat(b.total_repaid) / 1e6).toFixed(2)}M</TableCell>
                  <TableCell><StatusBadge status={b.is_verified ? "active" : "inactive"} /></TableCell>
                  <TableCell className="text-xs text-on-surface-variant">{formatTimestamp(b.added_at)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={8}><EmptyState title="No borrowers" /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function MarketsSection() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.admin.markets(), queryFn: () => adminService.getMarkets() });
  const qc = useQueryClient();
  const markets = data?.data?.markets ?? [];

  const toggleStatus = useMutation({
    mutationFn: ({ address, is_active }: { address: string; is_active: boolean }) =>
      adminService.updateMarketStatus(address, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.admin.markets() });
      toast.success("Market status updated");
    },
  });

  return (
    <Card className="p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">TVL</TableHead>
            <TableHead className="text-right">Available</TableHead>
            <TableHead className="text-right">Utilization</TableHead>
            <TableHead className="text-right">Avg APR</TableHead>
            <TableHead>Borrower</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}</TableRow>
            ))
          ) : markets.length ? (
            markets.map((m) => (
              <TableRow key={m.address}>
                <TableCell><span className="mono text-xs">{formatAddress(m.address)}</span></TableCell>
                <TableCell className="text-right mono">${(parseFloat(m.total_liquidity) / 1e6).toFixed(2)}M</TableCell>
                <TableCell className="text-right mono">${(parseFloat(m.total_principal) / 1e6).toFixed(2)}M</TableCell>
                <TableCell className="text-right">{m.utilization_rate.toFixed(1)}%</TableCell>
                <TableCell className="text-right"><span className="text-primary">{formatAPR(m.weighted_apr)}</span></TableCell>
                <TableCell><span className="mono text-xs">{formatAddress(m.borrower)}</span></TableCell>
                <TableCell><StatusBadge status={m.is_active ? "active" : "inactive"} /></TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="text-xs"
                    onClick={() => toggleStatus.mutate({ address: m.address, is_active: !m.is_active })}
                    loading={toggleStatus.isPending}>
                    {m.is_active ? "Pause" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow><TableCell colSpan={8}><EmptyState title="No markets" /></TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function AuditSection() {
  const { data: logs, isLoading } = useQuery({ queryKey: queryKeys.admin.auditLogs(), queryFn: () => adminService.getAuditLogs() });
  const { data: stats } = useQuery({ queryKey: queryKeys.admin.auditStats, queryFn: adminService.getAuditStats });

  const auditLogs = logs?.data?.logs ?? [];
  const s = stats?.data;

  async function handleExport() {
    const res = await adminService.exportAudit();
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${res.data.total_records} audit records`);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {s ? (
          <>
            <Card className="p-3"><p className="text-xs text-on-surface-variant">Total Actions</p><p className="text-xl font-bold text-on-surface">{s.total_actions}</p></Card>
            <Card className="p-3"><p className="text-xs text-on-surface-variant">Last 24h</p><p className="text-xl font-bold text-on-surface">{s.recent_activity_24h}</p></Card>
            <Card className="p-3"><p className="text-xs text-on-surface-variant">Action Types</p><p className="text-xl font-bold text-on-surface">{Object.keys(s.action_breakdown).length}</p></Card>
            <Card className="p-3"><p className="text-xs text-on-surface-variant">Success Rate</p><p className="text-xl font-bold text-emerald-400">{s.success_rate.toFixed(0)}%</p></Card>
          </>
        ) : Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-3.5 w-3.5" /> Export JSON
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4" /></TableCell>)}</TableRow>
              ))
            ) : auditLogs.length ? (
              auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-on-surface-variant">{formatRelativeTime(log.created_at)}</TableCell>
                  <TableCell><span className="mono text-xs">{log.admin_address ? formatAddress(log.admin_address) : "—"}</span></TableCell>
                  <TableCell><span className="rounded px-2 py-0.5 bg-primary-container/10 text-primary text-xs">{log.action}</span></TableCell>
                  <TableCell><span className="mono text-xs text-on-surface-variant">{log.target_address ? formatAddress(log.target_address) : "—"}</span></TableCell>
                  <TableCell className="text-xs text-on-surface-variant">{log.target_type}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5}><EmptyState title="No audit logs" /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function LiquidatorSection() {
  const { data: cfg } = useQuery({ queryKey: queryKeys.admin.liquidatorConfig, queryFn: adminService.getLiquidatorConfig });
  const { data: auctions } = useQuery({ queryKey: queryKeys.admin.liquidatorAuctions, queryFn: adminService.getLiquidatorAuctions });
  const c = cfg?.data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Liquidator Config</p>
        {c ? (
          <div className="space-y-2.5">
            {[
              ["Auction Duration", `${c.auction_duration_seconds}s`],
              ["Price Drop Rate", `${c.price_drop_rate_bps} BPS`],
              ["Min Bid Increment", `${c.min_bid_increment_bps} BPS`],
              ["Liq. Incentive", `${c.liquidation_incentive_bps} BPS`],
              ["Max Slippage", `${c.max_slippage_bps} BPS`],
              ["Updated By", c.updated_by || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{k}</span>
                <span className="font-medium mono text-on-surface">{String(v)}</span>
              </div>
            ))}
          </div>
        ) : <Skeleton className="h-40" />}
      </Card>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">
          Tracked Auctions ({auctions?.data?.total ?? 0})
        </p>
        {auctions?.data?.auctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
            <p className="text-sm text-on-surface-variant">No active liquidation auctions</p>
          </div>
        ) : (
          <div className="text-sm text-on-surface-variant">{auctions?.data?.total ?? 0} active auctions in the liquidator queue</div>
        )}
      </Card>
    </div>
  );
}

function EmergencySection() {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const [pauseReason, setPauseReason] = useState("");
  const [busy, setBusy] = useState<"pause" | "unpause" | null>(null);

  async function handlePause() {
    if (!pauseReason) { toast.error("Please provide a reason"); return; }
    setBusy("pause");
    try {
      const res = await adminService.prepareEmergencyPause(pauseReason);
      const tx = res.data;
      await sendTransactionAsync({
        to: tx.target as `0x${string}`,
        data: tx.tx_data as `0x${string}`,
        value: BigInt(tx.value ?? 0),
      });
      toast.success("Emergency pause initiated");
      setPauseReason("");
    } catch (e: any) {
      toast.error(e.message ?? "Transaction failed");
    } finally {
      setBusy(null);
    }
  }

  async function handleUnpause() {
    if (!pauseReason) { toast.error("Please provide a reason"); return; }
    setBusy("unpause");
    try {
      const res = await adminService.prepareEmergencyUnpause(pauseReason);
      const tx = res.data;
      await sendTransactionAsync({
        to: tx.target as `0x${string}`,
        data: tx.tx_data as `0x${string}`,
        value: BigInt(tx.value ?? 0),
      });
      toast.success("Protocol unpaused");
      setPauseReason("");
    } catch (e: any) {
      toast.error(e.message ?? "Transaction failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-6 border-red-500/20">
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-red-400">Emergency Controls</p>
          <p className="text-xs text-on-surface-variant mt-0.5">These actions affect all protocol markets. Use only in critical situations. All actions are logged on-chain and in the audit trail.</p>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <Input
          label="Reason / Incident Reference"
          placeholder="e.g. Critical oracle manipulation detected — incident #INX-420"
          value={pauseReason}
          onChange={e => setPauseReason(e.target.value)}
        />
        <div className="flex gap-3">
          <Button variant="destructive" onClick={handlePause} loading={busy === "pause"} className="gap-2 flex-1">
            <Pause className="h-4 w-4" /> Pause Protocol
          </Button>
          <Button variant="outline" onClick={handleUnpause} loading={busy === "unpause"} className="gap-2 flex-1">
            <Play className="h-4 w-4" /> Unpause Protocol
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user } = useAuthStore();
  const { address } = useAccount();

  const { data: adminCheck } = useQuery({
    queryKey: ["admin", "check", address],
    queryFn: () => adminService.checkAdmin(address ?? ""),
    enabled: !!address,
  });

  const isAdmin = adminCheck?.data?.is_admin ?? user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-16 w-16 text-on-surface-variant" />
        <div className="text-center">
          <p className="text-lg font-bold text-on-surface">Access Restricted</p>
          <p className="text-sm text-on-surface-variant mt-1">This area requires administrator privileges. Connect with an admin wallet to proceed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Operator Dashboard</span>
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-400 border border-red-500/20">ADMIN</span>
          </div>
          <h1 className="text-2xl font-semibold text-on-surface">Administration Panel</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Full protocol control and monitoring for <span className="mono text-primary">{formatAddress(address ?? "")}</span></p>
        </div>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh All
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="borrowers">Borrowers</TabsTrigger>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="liquidator">Liquidator</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewSection /></TabsContent>
        <TabsContent value="borrowers"><BorrowersSection /></TabsContent>
        <TabsContent value="markets"><MarketsSection /></TabsContent>
        <TabsContent value="liquidator"><LiquidatorSection /></TabsContent>
        <TabsContent value="audit"><AuditSection /></TabsContent>
        <TabsContent value="emergency"><EmergencySection /></TabsContent>
      </Tabs>
    </div>
  );
}
