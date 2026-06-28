import type { Trade, Account, Evaluation, Payout } from './types'

export interface Stats {
  totalTrades: number; wins: number; losses: number; breakevens: number
  winRate: number; profitFactor: number; expectancy: number
  totalPnl: number; totalCommissions: number; netPnl: number
  avgWin: number; avgLoss: number; avgRR: number
  maxWinStreak: number; maxLossStreak: number
  maxDrawdown: number; sharpe: number
  bestDay: string; worstDay: string
  bySymbol: Record<string, { trades: number; pnl: number; wr: number }>
  byHour:   Record<number, { trades: number; pnl: number }>
  byDay:    Record<string, { trades: number; pnl: number }>
  byWeekday:Record<number, { trades: number; pnl: number }>
  monthly:  { month: string; pnl: number; trades: number; wr: number }[]
}

export function calcStats(trades: Trade[]): Stats {
  if (!trades.length) return emptyStats()

  const wins      = trades.filter(t => t.result === 'win')
  const losses    = trades.filter(t => t.result === 'loss')
  const bes       = trades.filter(t => t.result === 'breakeven')
  const totalPnl  = trades.reduce((s, t) => s + t.pnl, 0)
  const totalComm = trades.reduce((s, t) => s + (t.commission || 0), 0)
  const grossWin  = wins.reduce((s, t) => s + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0))
  const avgWin    = wins.length  ? grossWin / wins.length   : 0
  const avgLoss   = losses.length? grossLoss / losses.length: 0
  const winRate   = trades.length ? (wins.length / trades.length) * 100 : 0
  const pf        = grossLoss > 0 ? grossWin / grossLoss : wins.length > 0 ? 99 : 0
  const expectancy= (winRate/100 * avgWin) - ((1 - winRate/100) * avgLoss)
  const avgRR     = trades.filter(t=>t.rr).reduce((s,t)=>s+t.rr,0) / Math.max(1,trades.filter(t=>t.rr).length)

  // Streaks
  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0
  ;[...trades].reverse().forEach(t => {
    if (t.result === 'win')  { curWin++; curLoss = 0; maxWin  = Math.max(maxWin, curWin)  }
    else if (t.result === 'loss') { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss) }
    else { curWin = 0; curLoss = 0 }
  })

  // Max drawdown (simple peak-to-trough)
  let peak = 0, dd = 0, running = 0
  ;[...trades].reverse().forEach(t => {
    running += t.pnl
    if (running > peak) peak = running
    const cur = peak - running
    if (cur > dd) dd = cur
  })

  // By symbol
  const bySymbol: Record<string, any> = {}
  trades.forEach(t => {
    if (!bySymbol[t.symbol]) bySymbol[t.symbol] = { trades: 0, pnl: 0, wins: 0 }
    bySymbol[t.symbol].trades++
    bySymbol[t.symbol].pnl += t.pnl
    if (t.result === 'win') bySymbol[t.symbol].wins++
  })
  Object.keys(bySymbol).forEach(k => { bySymbol[k].wr = bySymbol[k].trades ? Math.round(bySymbol[k].wins / bySymbol[k].trades * 100) : 0 })

  // By hour
  const byHour: Record<number, any> = {}
  trades.forEach(t => {
    const h = t.trade_time ? parseInt(t.trade_time.split(':')[0]) : -1
    if (h < 0) return
    if (!byHour[h]) byHour[h] = { trades: 0, pnl: 0 }
    byHour[h].trades++; byHour[h].pnl += t.pnl
  })

  // By weekday
  const byWeekday: Record<number, any> = {}
  trades.forEach(t => {
    const d = new Date(t.trade_date + 'T00:00:00').getDay()
    if (!byWeekday[d]) byWeekday[d] = { trades: 0, pnl: 0 }
    byWeekday[d].trades++; byWeekday[d].pnl += t.pnl
  })

  // By day (date string)
  const byDay: Record<string, any> = {}
  trades.forEach(t => {
    if (!byDay[t.trade_date]) byDay[t.trade_date] = { trades: 0, pnl: 0 }
    byDay[t.trade_date].trades++; byDay[t.trade_date].pnl += t.pnl
  })
  const dayEntries = Object.entries(byDay)
  const bestDay  = dayEntries.sort((a,b)=>b[1].pnl-a[1].pnl)[0]?.[0]  || '—'
  const worstDay = dayEntries.sort((a,b)=>a[1].pnl-b[1].pnl)[0]?.[0]  || '—'

  // Monthly
  const monthlyMap: Record<string, any> = {}
  trades.forEach(t => {
    const m = t.trade_date?.slice(0, 7) || 'unknown'
    if (!monthlyMap[m]) monthlyMap[m] = { pnl: 0, trades: 0, wins: 0 }
    monthlyMap[m].pnl += t.pnl; monthlyMap[m].trades++
    if (t.result === 'win') monthlyMap[m].wins++
  })
  const monthly = Object.entries(monthlyMap)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k, v]) => {
      const [y, mo] = k.split('-')
      return { month: new Date(+y, +mo-1).toLocaleDateString('es-DO',{month:'short',year:'2-digit'}), pnl: Math.round(v.pnl), trades: v.trades, wr: v.trades ? Math.round(v.wins/v.trades*100) : 0 }
    })

  return {
    totalTrades: trades.length, wins: wins.length, losses: losses.length, breakevens: bes.length,
    winRate: Math.round(winRate * 10) / 10, profitFactor: Math.round(pf * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100, totalCommissions: Math.round(totalComm * 100) / 100,
    netPnl: Math.round((totalPnl - totalComm) * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100, avgLoss: Math.round(avgLoss * 100) / 100,
    avgRR: Math.round(avgRR * 100) / 100,
    maxWinStreak: maxWin, maxLossStreak: maxLoss, maxDrawdown: Math.round(dd * 100) / 100,
    sharpe: 0, bestDay, worstDay,
    bySymbol, byHour, byDay, byWeekday, monthly,
  }
}

export function calcFinancials(evaluations: Evaluation[], payouts: Payout[]) {
  const totalInvested  = evaluations.reduce((s, e) => s + e.amount, 0)
  const evalCost       = evaluations.filter(e=>e.type==='evaluation').reduce((s,e)=>s+e.amount,0)
  const activationCost = evaluations.filter(e=>e.type==='activation').reduce((s,e)=>s+e.amount,0)
  const resetCost      = evaluations.filter(e=>e.type==='reset').reduce((s,e)=>s+e.amount,0)
  const totalPayouts   = payouts.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0)
  const pendingPayouts = payouts.filter(p=>p.status!=='paid'&&p.status!=='rejected').reduce((s,p)=>s+p.amount,0)
  const netProfit      = totalPayouts - totalInvested
  const roi            = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0
  const recovered      = Math.min(totalPayouts, totalInvested)
  const pending        = Math.max(0, totalInvested - totalPayouts)
  return { totalInvested, evalCost, activationCost, resetCost, totalPayouts, pendingPayouts, netProfit, roi, recovered, pending }
}

function emptyStats(): Stats {
  return { totalTrades:0, wins:0, losses:0, breakevens:0, winRate:0, profitFactor:0, expectancy:0, totalPnl:0, totalCommissions:0, netPnl:0, avgWin:0, avgLoss:0, avgRR:0, maxWinStreak:0, maxLossStreak:0, maxDrawdown:0, sharpe:0, bestDay:'—', worstDay:'—', bySymbol:{}, byHour:{}, byDay:{}, byWeekday:{}, monthly:[] }
}
