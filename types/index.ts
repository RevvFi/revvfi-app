// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface NonceRequest {
  wallet_address: string;
}

export interface NonceResponse {
  nonce: string;
  expires_at: number;
  message: string;
}

export interface LoginRequest {
  wallet_address: string;
  message: string;
  signature: string;
  nonce: string;
}

export interface LoginResponse {
  token: string;
  expires_at: number;
  wallet_address: string;
}

export interface MeResponse {
  wallet_address: string;
  role: "lender" | "borrower" | "admin";
  registered_at: number;
  is_verified: boolean;
}

// ─── Asset ────────────────────────────────────────────────────────────────────

export interface Asset {
  address: string;
  symbol: string;
  decimals: number;
}

// ─── Market ───────────────────────────────────────────────────────────────────

export interface Market {
  address: string;
  borrower: string;
  borrow_asset: Asset;
  collateral_asset: Asset;
  total_principal: string;
  total_liquidity: string;
  total_debt: string;
  utilization_rate: number;
  weighted_apr: number;
  is_active: boolean;
  is_liquidating: boolean;
  is_closed: boolean;
  created_at: number;
}

export interface MarketsResponse {
  count: number;
  markets: Market[];
}

export interface MarketMetrics {
  active_positions: number;
  avg_apr: number;
  tvl: string;
  utilization_rate: number;
}

export interface CreateMarketRequest {
  borrow_asset: string;
  borrow_asset_decimals: number;
  collateral_asset: string;
  collateral_asset_decimals: number;
  collateral_oracle: string;
  min_collateral_ratio: number;
  liquidation_threshold: number;
}

// ─── Offer ────────────────────────────────────────────────────────────────────

export interface Offer {
  offer_id: number;
  lender: string;
  market_address: string;
  amount: string;
  remaining_amount: string;
  filled_amount: string;
  apr: number;
  seniority: 0 | 1;
  status: "active" | "partially_filled" | "filled" | "cancelled" | "expired";
  fill_percentage: number;
  expiry: number;
  created_at: number;
}

export interface OffersResponse {
  count: number;
  offers: Offer[];
}

export interface CreateOfferRequest {
  market_address: string;
  amount: string;
  apr: number;
  seniority: 0 | 1;
  expiry_days: number;
}

export interface QuoteRequest {
  market_address: string;
  borrow_amount: string;
  collateral_amount: string;
}

export interface QuoteResponse {
  apr: number;
  total_cost: string;
  available_liquidity: string;
}

// ─── Borrower ─────────────────────────────────────────────────────────────────

export interface Borrower {
  address: string;
  reputation_score: number;
  risk_label: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "CC" | "C" | "D";
  success_rate: number;
  default_rate: number;
  total_borrowed: string;
  total_repaid: string;
  outstanding_debt: string;
  active_loans: number;
  failed_loans: number;
  registered_at: number;
  last_activity: number;
}

export interface BorrowerRisk {
  default_rate: number;
  health_factor: number;
  reputation_score: number;
  risk_label: string;
  risk_level: "low" | "medium" | "high" | "critical";
  success_rate: number;
}

// ─── Position ─────────────────────────────────────────────────────────────────

export interface Position {
  token_id: number;
  lender: string;
  market_address: string;
  principal: string;
  current_value: string;
  accrued_interest: string;
  claimable_amount: string;
  apr: number;
  seniority: 0 | 1;
  status: "active" | "settled" | "defaulted" | "liquidated";
  minted_at: number;
  settled_at?: number;
}

export interface PositionsResponse {
  count: number;
  positions: Position[];
}

export interface Portfolio {
  active_positions: number;
  avg_apr: number;
  earned_interest: string;
  position_count: number;
  settled_positions: number;
  total_supplied: string;
  total_value: string;
}

export interface ClaimPositionRequest {
  token_id: number;
}

// ─── Withdrawal ───────────────────────────────────────────────────────────────

export type WithdrawalStatus = "pending" | "processing" | "fulfilled" | "cancelled";

export interface Withdrawal {
  request_id: number;
  position_id: number;
  lender: string;
  amount: string;
  status: WithdrawalStatus;
  requested_at: number;
  processed_at?: number;
}

export interface WithdrawalsResponse {
  count: number;
  withdrawals: Withdrawal[];
}

export interface WithdrawalRequest {
  position_id: number;
  amount: string;
}

export interface CancelWithdrawalRequest {
  request_id: number;
}

export interface WithdrawalEpoch {
  epoch_number: number;
  start_time: number;
  end_time: number;
  status: "pending" | "active" | "completed";
  total_requested: string;
  total_fulfilled: string;
  total_unfulfilled: string;
}

// ─── Auction ──────────────────────────────────────────────────────────────────

export interface Auction {
  auction_id: number;
  market_address: string;
  borrower: string;
  collateral_amount: string;
  debt_amount: string;
  current_price: string;
  highest_bid: string;
  highest_bidder: string;
  status: "active" | "settled" | "cancelled";
  time_remaining: number;
  start_time: number;
  end_time: number;
}

export interface LiquidationsResponse {
  markets: Market[];
  count: number;
  total_collateral: string;
  total_debt: string;
}

export interface AuctionPrice {
  auction_id: string;
  current_price: string;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface UnsignedTx {
  data: string;
  to: string;
  value: string;
}

export interface BorrowRequest {
  market_address: string;
  amount: string;
  token_id: number;
  max_apr: number;
}

export interface RepayRequest {
  market_address: string;
  amount: string;
}

export interface LiquidateRequest {
  market_address: string;
  auction_id: number;
  bid_amount: string;
}

export interface QuoteTxRequest {
  type: "borrow" | "repay" | "liquidate" | "claim";
  market_address: string;
  amount: string;
}

export interface GasQuote {
  gas: number;
  gas_price: string;
  params: Record<string, unknown> | null;
  total_cost: string;
  tx_type: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

// AdminMarket has the same shape as Market (admin endpoint returns same fields)
export type AdminMarket = Market;

export interface AdminBorrower {
  address: string;
  is_verified: boolean;
  reputation_score: number;
  total_borrowed: string;
  total_repaid: string;
  active_offers: number;
  default_count: number;
  added_at: number;
}

export interface AdminHealth {
  active_positions: number;
  status: string;
  timestamp: number;
  total_markets: number;
  total_tvl: string;
}

export interface AuditLog {
  id: number;
  admin_address: string;
  action: string;
  target_type: string;
  target_address: string;
  result: "success" | "failure";
  reason: string;
  created_at: number;
}

export interface AuditStats {
  total_actions: number;
  action_breakdown: Record<string, number>;
  admin_breakdown: Record<string, number>;
  recent_activity_24h: number;
  success_rate: number;
}

export interface ProtocolConfig {
  deployment_fee_eth: string;
  deployment_fee_wei: string;
  fee_recipient: string;
  arch_controller: string;
  position_nft: string;
  liquidator: string;
  reputation_registry: string;
  timelock_delay_days: number;
  is_core_contracts_set: boolean;
  last_updated_at: number;
}

export interface SystemConfig {
  key: string;
  value: string;
  description: string;
  config_type: string;
  is_sensitive: boolean;
  updated_at: number;
}

export interface AdminStats {
  total_markets: number;
  active_markets: number;
  total_borrowers: number;
  active_borrowers: number;
  active_positions: number;
  active_offers: number;
  active_auctions: number;
  total_debt_wei: string;
  total_liquidity_wei: string;
  total_principal_wei: string;
  protocol_health: string;
}

export interface LiquidatorConfig {
  auction_duration_seconds: number;
  price_drop_rate_bps: number;
  min_bid_increment_bps: number;
  liquidation_incentive_bps: number;
  max_slippage_bps: number;
  updated_at: number;
  updated_by: string;
}

export interface MarketRisk {
  market_address: string;
  min_collateral_ratio_bps: number;
  liquidation_threshold_bps: number;
  collateral_oracle: string;
  is_active: boolean;
  is_liquidating: boolean;
}

export interface PreparedTx {
  tx_data: string;
  target: string;
  value: string;
  description: string;
  encoded_proposal: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  limit: number;
  total?: number;
  total_pages?: number;
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  success: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type SeniorityLabel = "Senior" | "Junior";

export function seniorityLabel(s: 0 | 1): SeniorityLabel {
  return s === 0 ? "Senior" : "Junior";
}

export function riskLevelColor(level: string): string {
  const map: Record<string, string> = {
    low: "text-emerald-400",
    medium: "text-amber-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };
  return map[level] ?? "text-on-surface-variant";
}
