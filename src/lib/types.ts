export interface Firm {
  id: number; user_id: string; name: string
  website: string; type: string; status: string; created_at: string
}
export interface Account {
  id: number; user_id: string; firm_id: number; name: string
  size: number; type: 'evaluation'|'pa'|'live'; status: 'active'|'suspended'|'closed'|'passed'
  purchase_date: string; activation_date: string
  initial_balance: number; current_balance: number; equity: number
  max_drawdown: number; remaining_dd: number; daily_loss_limit: number
  consistency_limit: number; pnl_total: number; trade_count: number
  payout_count: number; roi: number; win_rate: number; profit_factor: number
  notes: string; created_at: string; updated_at: string
  firm?: Firm
}
export interface Trade {
  id: number; user_id: string; account_id: number; firm_id: number
  trade_date: string; trade_time: string; symbol: string
  direction: 'long'|'short'; contracts: number
  entry_price: number; exit_price: number; stop_loss: number; take_profit: number
  pnl: number; pnl_ticks: number; rr: number; duration_min: number
  commission: number; result: 'win'|'loss'|'breakeven'; notes: string
  imported_from: string; created_at: string
}
export interface Evaluation {
  id: number; user_id: string; firm_id: number; account_id: number
  type: 'evaluation'|'activation'|'reset'; amount: number
  purchase_date: string; status: string; notes: string; created_at: string
  firm?: Firm; account?: Account
}
export interface Payout {
  id: number; user_id: string; firm_id: number; account_id: number
  amount: number; requested_at: string; approved_at: string; paid_at: string
  status: 'pending'|'approved'|'paid'|'rejected'; notes: string; created_at: string
  firm?: Firm; account?: Account
}
export interface EquitySnapshot {
  id: number; account_id: number; snap_date: string
  balance: number; equity: number; daily_pnl: number; drawdown: number
}
export interface AiReport {
  id: number; user_id: string; report_date: string
  content: string; type: 'daily'|'weekly'|'alert'; created_at: string
}
export interface FirmSummary {
  id: number; user_id: string; name: string; status: string
  account_count: number; active_accounts: number
  total_pnl: number; total_invested: number; total_payouts: number; roi: number
}
