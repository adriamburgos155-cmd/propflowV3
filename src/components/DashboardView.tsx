"use client"
import { useMemo } from "react"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { StatCard, Section, Empty, Badge, fmtUSD, pnlColor, pnlPrefix } from "@/components/ui"
import { calcStats, calcFinancials } from "@/lib/analytics"
import { fmtDate } from "@/lib/utils"
import type { Account, Trade, Evaluation, Payout, Firm } from "@/lib/types"

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'rgba(255,255,255,0.4)', marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>{label}</div>
      {payload.map((p:any) => (
        <div key={p.dataKey} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background: p.stroke||p.fill }}/>
          <span style={{ color:'rgba(255,255,255,0.5)' }}>{p.name||p.dataKey}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#fff', marginLeft:'auto' }}>
            {typeof p.value === 'number' ? (p.value >= 0 ? '+' : '') + fmtUSD(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props { firms: Firm[]; accounts: Account[]; trades: Trade[]; evaluations: Evaluation[]; payouts: Payout[] }

export default function DashboardView({ firms, accounts, trades, evaluations, payouts }: Props) {
  const stats = useMemo(() => calcStats(trades), [trades])
  const fin   = useMemo(() => calcFinancials(evaluations, payouts), [evaluations, payouts])

  const paAccounts   = accounts.filter(a => a.type === 'pa' && a.status === 'active')
  const evalAccounts = accounts.filter(a => a.type === 'evaluation' && a.status === 'active')

  // Today trades
  const today = new Date().toISOString().split('T')[0]
  const todayTrades = trades.filter(t => t.trade_date === today)
  const todayPnl    = todayTrades.reduce((s,t) => s+t.pnl, 0)

  // This week
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekTrades = trades.filter(t => new Date(t.trade_date) >= weekStart)
  const weekPnl    = weekTrades.reduce((s,t) => s+t.pnl, 0)

  // This month
  const monthStr   = today.slice(0,7)
  const monthTrades= trades.filter(t => t.trade_date?.startsWith(monthStr))
  const monthPnl   = monthTrades.reduce((s,t) => s+t.pnl, 0)

  // Pending payouts
  const pendingPay = payouts.filter(p => p.status === 'pending' || p.status === 'approved')

  // Recent alerts
  const alerts: { text: string; color: string }[] = []
  paAccounts.forEach(a => {
    if (a.remaining_dd > 0 && a.current_balance > 0) {
      const ddPct = (a.remaining_dd / a.initial_balance) * 100
      if (ddPct < 20) alerts.push({ text: `⚠ ${a.name || a.size+'K'} — drawdown restante < 20%`, color:'#EF4444' })
    }
  })
  evalAccounts.forEach(a => {
    if (a.consistency_limit > 0) alerts.push({ text: `ℹ ${a.name || a.size+'K'} — límite diario: ${fmtUSD(a.consistency_limit)}`, color:'rgba(255,255,255,0.5)' })
  })
  if (fin.roi > 0 && fin.totalPayouts > fin.totalInvested) alerts.push({ text: `✓ Inversión recuperada — ROI ${fin.roi.toFixed(1)}%`, color:'#10B981' })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── TOP KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <StatCard label="PnL Hoy"        value={(todayPnl>=0?'+':'')+fmtUSD(todayPnl)}     valueColor={pnlColor(todayPnl)} sub={`${todayTrades.length} trades hoy`}/>
        <StatCard label="PnL Semana"     value={(weekPnl>=0?'+':'')+fmtUSD(weekPnl)}        valueColor={pnlColor(weekPnl)}  sub={`${weekTrades.length} trades`}/>
        <StatCard label="PnL Mes"        value={(monthPnl>=0?'+':'')+fmtUSD(monthPnl)}      valueColor={pnlColor(monthPnl)} sub={monthStr}/>
        <StatCard label="Beneficio Neto" value={(fin.netProfit>=0?'+':'')+fmtUSD(fin.netProfit)} valueColor={pnlColor(fin.netProfit)} sub={`ROI ${fin.roi.toFixed(1)}%`}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        <StatCard label="Win Rate"     value={stats.winRate+'%'}           sub={`${stats.wins}W / ${stats.losses}L`}/>
        <StatCard label="Profit Factor"value={stats.profitFactor.toFixed(2)} sub={`expectancy ${fmtUSD(stats.expectancy)}`}/>
        <StatCard label="Total Trades" value={stats.totalTrades}            sub={`${paAccounts.length} PAs activas`}/>
        <StatCard label="Max Drawdown" value={fmtUSD(stats.maxDrawdown)}   valueColor={stats.maxDrawdown>0?'#EF4444':'#fff'} sub={`streak pérd: ${stats.maxLossStreak}`}/>
      </div>

      {/* ── CHARTS ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Monthly PnL bar chart */}
        <Section title="PnL Mensual" sub="Últimos meses">
          <div style={{ padding:'16px 16px 12px' }}>
            {stats.monthly.length === 0
              ? <Empty title="Sin trades registrados" sub="Importa trades para ver el gráfico"/>
              : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.monthly} margin={{top:4,right:4,left:0,bottom:0}} barSize={24}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                    <XAxis dataKey="month" tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:"'JetBrains Mono'"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:"'JetBrains Mono'"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v} width={44}/>
                    <Tooltip content={<TT/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                    <Bar dataKey="pnl" radius={[4,4,0,0]} label={false}>
                      {stats.monthly.map((m,i) => (
                        <rect key={i} fill={m.pnl >= 0 ? '#10B981' : '#EF4444'} fillOpacity={0.8}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </Section>

        {/* Equity curve */}
        <Section title="Equity Curve" sub="PnL acumulado">
          <div style={{ padding:'16px 16px 12px' }}>
            {stats.monthly.length === 0
              ? <Empty title="Sin datos de equity" sub="Los trades generan la curva automáticamente"/>
              : (() => {
                  let cum = 0
                  const eq = stats.monthly.map(m => { cum += m.pnl; return { month: m.month, equity: Math.round(cum) } })
                  const isPositive = eq[eq.length-1]?.equity >= 0
                  return (
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={eq} margin={{top:4,right:4,left:0,bottom:0}}>
                        <defs>
                          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={isPositive?'#10B981':'#EF4444'} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={isPositive?'#10B981':'#EF4444'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                        <XAxis dataKey="month" tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:"'JetBrains Mono'"}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:"'JetBrains Mono'"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v} width={44}/>
                        <Tooltip content={<TT/>}/>
                        <Area type="monotone" dataKey="equity" stroke={isPositive?'#10B981':'#EF4444'} strokeWidth={2} fill="url(#eqGrad)" dot={false} activeDot={{r:4,strokeWidth:0}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                })()
            }
          </div>
        </Section>
      </div>

      {/* ── BOTTOM ROW ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>

        {/* Firms table */}
        <Section title="Empresas" sub="Rendimiento por firma">
          <div style={{ padding:'0 0 8px' }}>
            {firms.length === 0
              ? <Empty title="Sin firmas" sub="Agrega tu primera firma"/>
              : firms.map(firm => {
                  const fAccounts  = accounts.filter(a => a.firm_id === firm.id)
                  const fTrades    = trades.filter(t => t.firm_id === firm.id)
                  const fPayouts   = payouts.filter(p => p.firm_id === firm.id && p.status === 'paid')
                  const fEvals     = evaluations.filter(e => e.firm_id === firm.id)
                  const fPnl       = fTrades.reduce((s,t) => s+t.pnl, 0)
                  const fPaidOut   = fPayouts.reduce((s,p) => s+p.amount, 0)
                  const fInvested  = fEvals.reduce((s,e) => s+e.amount, 0)
                  const fROI       = fInvested > 0 ? ((fPaidOut - fInvested) / fInvested * 100) : 0
                  return (
                    <div key={firm.id} style={{ padding:'10px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{firm.name}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color: fPnl>=0?'#10B981':'#EF4444' }}>{fPnl>=0?'+':''}{fmtUSD(fPnl)}</span>
                      </div>
                      <div style={{ display:'flex', gap:12 }}>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{fAccounts.length} cuentas</span>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>{fTrades.length} trades</span>
                        <span style={{ fontSize:10, color: fROI>=0?'#10B981':'#EF4444' }}>ROI {fROI.toFixed(1)}%</span>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </Section>

        {/* Payouts pending */}
        <Section title="Payouts" sub="Estado de solicitudes">
          <div style={{ padding:'0 0 8px' }}>
            {payouts.length === 0
              ? <Empty title="Sin payouts" sub="Registra tu primer payout"/>
              : payouts.slice(0,6).map(p => (
                  <div key={p.id} style={{ padding:'10px 20px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>{(p.firm as any)?.name || '—'}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                        {p.status === 'paid' ? `Pagado ${fmtDate(p.paid_at)}` : p.status === 'approved' ? 'Aprobado — pendiente pago' : p.status === 'pending' ? 'En revisión' : 'Rechazado'}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color: p.status==='paid'?'#10B981':'#fff' }}>{fmtUSD(p.amount)}</div>
                      <Badge variant={p.status==='paid'?'green':p.status==='rejected'?'red':'white'}>{p.status}</Badge>
                    </div>
                  </div>
                ))
            }
          </div>
        </Section>

        {/* Alerts + AI insight */}
        <Section title="Alertas & Estado" sub="Situación actual">
          <div style={{ padding:'12px 20px', display:'flex', flexDirection:'column', gap:8 }}>
            {alerts.length === 0
              ? <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)', textAlign:'center', padding:'20px 0' }}>Sin alertas activas</div>
              : alerts.map((a,i) => (
                  <div key={i} style={{ fontSize:12, color: a.color, padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8, border:'1px solid rgba(255,255,255,0.06)', lineHeight:1.5 }}>
                    {a.text}
                  </div>
                ))
            }
            {/* Quick stats */}
            <div style={{ marginTop:8, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { l:'Invertido', v: fmtUSD(fin.totalInvested), c:'#fff' },
                { l:'Cobrado',   v: fmtUSD(fin.totalPayouts),  c: fin.totalPayouts>0?'#10B981':'#fff' },
                { l:'Pendiente', v: fmtUSD(fin.pending),       c:'#fff' },
                { l:'Evals.',    v: evaluations.length,         c:'#fff' },
              ].map(({l,v,c})=>(
                <div key={l} style={{ background:'#111', borderRadius:8, padding:'8px 10px', border:'1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:c, marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
