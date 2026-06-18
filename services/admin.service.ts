import { del, get, patch, post } from "@/lib/api";
import type {
  AdminBorrower,
  AdminHealth,
  AdminMarket,
  AdminStats,
  ApiResponse,
  AuditLog,
  AuditStats,
  Borrower,
  LiquidatorConfig,
  Market,
  MarketRisk,
  Pagination,
  PreparedTx,
  ProtocolConfig,
  SystemConfig,
} from "@/types";

// Paginated list wrapper
interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export const adminService = {
  // ── Markets ────────────────────────────────────────────────────────
  async getMarkets(params?: Record<string, unknown>): Promise<ApiResponse<{ markets: AdminMarket[]; pagination: Pagination }>> {
    return get(`/admin/markets`, { params });
  },

  async getMarket(address: string): Promise<ApiResponse<AdminMarket>> {
    return get(`/admin/markets/${address}`);
  },

  async getMarketMetrics(address: string): Promise<ApiResponse<Record<string, unknown>>> {
    return get(`/admin/markets/${address}/metrics`);
  },

  async updateMarketStatus(address: string, payload: { is_active?: boolean; is_liquidating?: boolean }): Promise<ApiResponse<Market>> {
    return patch(`/admin/markets/${address}/status`, payload);
  },

  async getMarketRisk(address: string): Promise<ApiResponse<MarketRisk>> {
    return get(`/admin/markets/${address}/risk`);
  },

  async createMarket(payload: Record<string, unknown>): Promise<ApiResponse<Market>> {
    return post(`/admin/markets`, payload);
  },

  // ── Borrowers ──────────────────────────────────────────────────────
  async getBorrowers(params?: Record<string, unknown>): Promise<ApiResponse<{ borrowers: AdminBorrower[]; pagination: Pagination; total_reputation_average: number }>> {
    return get(`/admin/borrowers`, { params });
  },

  async getBorrower(address: string): Promise<ApiResponse<AdminBorrower>> {
    return get(`/admin/borrowers/${address}`);
  },

  async getPendingBorrowers(): Promise<ApiResponse<{ borrowers: AdminBorrower[]; pending_count: number }>> {
    return get(`/admin/borrowers/pending`);
  },

  async prepareBorrowerAction(address: string, action: string): Promise<ApiResponse<{ tx_data: string }>> {
    return post(`/admin/borrowers/${address}/prepare`, { action });
  },

  // ── Health ─────────────────────────────────────────────────────────
  async getHealth(): Promise<ApiResponse<AdminHealth>> {
    return get(`/admin/health`);
  },

  async checkAdmin(address: string): Promise<ApiResponse<{ is_admin: boolean }>> {
    return get(`/admin/check/${address}`);
  },

  // ── Impersonation ──────────────────────────────────────────────────
  async impersonate(payload: {
    admin_address: string;
    target_wallet: string;
    reason: string;
  }): Promise<ApiResponse<{ token: string; expires_at: number }>> {
    return post(`/admin/auth/impersonate`, payload);
  },

  // ── Reputation ─────────────────────────────────────────────────────
  async getDefaultedBorrowers(): Promise<ApiResponse<{ borrowers: AdminBorrower[]; pagination: Pagination; total_defaulted: number }>> {
    return get(`/admin/reputation/defaulted`);
  },

  async getReputation(address: string): Promise<ApiResponse<Borrower>> {
    return get(`/admin/reputation/${address}`);
  },

  async prepareReputation(address: string, payload: { new_score: number; reason: string }): Promise<ApiResponse<PreparedTx>> {
    return post(`/admin/reputation/${address}/prepare`, payload);
  },

  // ── Audit ──────────────────────────────────────────────────────────
  async getAuditLogs(params?: Record<string, unknown>): Promise<ApiResponse<{ logs: AuditLog[]; pagination: Pagination; total: number }>> {
    return get(`/admin/audit/logs`, { params });
  },

  async getAuditStats(): Promise<ApiResponse<AuditStats>> {
    return get(`/admin/audit/stats`);
  },

  async exportAudit(): Promise<ApiResponse<{ format: string; data: AuditLog[]; exported_at: number; total_records: number }>> {
    return get(`/admin/audit/export`);
  },

  // ── Protocol ───────────────────────────────────────────────────────
  async getProtocolConfig(): Promise<ApiResponse<ProtocolConfig>> {
    return get(`/protocol/config`);
  },

  async getFeesCollected(): Promise<ApiResponse<{ total_fees_eth: string; total_fees_wei: string; recipient_address: string }>> {
    return get(`/protocol/fees-collected`);
  },

  // ── System Config ──────────────────────────────────────────────────
  async getSystemConfig(): Promise<ApiResponse<{ configs: SystemConfig[]; total: number }>> {
    return get(`/admin/system/config`);
  },

  // ── Liquidator ─────────────────────────────────────────────────────
  async getLiquidatorConfig(): Promise<ApiResponse<LiquidatorConfig>> {
    return get(`/admin/liquidator/config`);
  },

  async getLiquidatorAuctions(): Promise<ApiResponse<{ auctions: unknown[]; total: number }>> {
    return get(`/admin/liquidator/auctions`);
  },

  // ── Stats ──────────────────────────────────────────────────────────
  async getStatsOverview(): Promise<ApiResponse<AdminStats>> {
    return get(`/admin/stats/overview`);
  },

  async getStatsBorrowers(): Promise<ApiResponse<{
    total_borrowers: number;
    active_borrowers: number;
    defaulted_count: number;
    average_reputation: number;
    average_success_rate: number;
    total_volume_wei: string;
  }>> {
    return get(`/admin/stats/borrowers`);
  },

  async getStatsMarkets(): Promise<ApiResponse<{
    total_markets: number;
    active_markets: number;
    closed_markets: number;
    liquidating_markets: number;
    average_utilization: number;
    average_apr_bps: number;
  }>> {
    return get(`/admin/stats/markets`);
  },

  async getStatsRevenue(): Promise<ApiResponse<{
    total_interest_collected_wei: string;
    total_repaid_wei: string;
    total_repayments: number;
  }>> {
    return get(`/admin/stats/revenue`);
  },

  async getStatsLiquidations(): Promise<ApiResponse<{
    total_auctions: number;
    active_auctions: number;
    settled_auctions: number;
    average_recovery_rate: number;
    total_collateral_liquidated_wei: string;
    total_debt_liquidated_wei: string;
  }>> {
    return get(`/admin/stats/liquidations`);
  },

  async getStatsPositions(): Promise<ApiResponse<{
    total_positions: number;
    active_positions: number;
    settled_positions: number;
    senior_positions: number;
    junior_positions: number;
    total_principal_locked_wei: string;
    total_accrued_interest_wei: string;
  }>> {
    return get(`/admin/stats/positions`);
  },

  // ── Emergency ──────────────────────────────────────────────────────
  async prepareEmergencyPause(reason: string): Promise<ApiResponse<PreparedTx>> {
    return post(`/admin/emergency/pause/prepare`, { reason });
  },

  async prepareEmergencyUnpause(reason: string): Promise<ApiResponse<PreparedTx>> {
    return post(`/admin/emergency/unpause/prepare`, { reason });
  },
};
