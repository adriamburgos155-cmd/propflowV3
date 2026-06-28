"use client"
import { useState, useMemo, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Btn, Badge, Modal, FGroup, FRow, FInput, FSelect, Section, Empty, StatCard, fmtUSD, pnlColor } from "@/components/ui"
import { fmtDate } from "@/lib/utils"
import { calcStats } from "@/lib/analytics"
import type { Trade, Account, Firm } from "@/lib/types"

const SYM_OPTS = [{value:'MNQ',label:'MNQ'},{value:'NQ',label:'NQ'},{value:'MES',label:'MES'},{value:'ES',label:'ES'},{value:'RTY',label:'RTY'}]
const DIR_OPTS = [{value:'long',label:'Long'},{value:'short',label:'Short'}]
const RES_OPTS = [{value:'win',label:'Win'},{value:'loss',label:'Loss'},{value:'breakeven',label:'Breakeven'}]
const WDAYS    = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

const E0 = { account_id:'', symbol:'MNQ', direction:'long', trade_date:'', trade_time:'', contracts:'1', entry_price:'', exit_price:'', stop_loss:'', take_profit:'', pnl:'', rr:'', duration_min:'', commission:'', result:'win', notes:'' }

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'rgba(255,255,255,0.4)', marginBottom:6, fontFamily:"'JetBrains Mono',monospace" }}>{label}</div>
      {payload.map((p:any) => (
        <div key={p.dataKey} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:p.fill||p.stroke }}/>
          <span style={{ color:'rgba(255,255,255,0.4)' }}>{p.dataKey}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:'#fff', marginLeft:'auto' }}>
            {typeof p.value==='number' ? (p.value>=0?'+':'')+fmtUSD(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props { trades: Trade[]; accounts: Account[]; firms: Firm[]; onAdd:(t:any)=>Promise<any>; onDelete:(id:number)=>Promise<void>; onImport:(rows:any[])=>Promise<number>; showToast:(m:string,t?:'success'|'error')=>void }

export default function TradesView({ trades, accounts, firms, onAdd, onDelete, onImport, showToast }: Props) {
  const [tab, setTab]         = useState<'list'|'stats'|'import'>('list')
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState<any>(E0)
  const [saving, setSaving]   = useState(false)
  const [importing, setImp]   = useState(false)
  const [filter, setFilter]   = useState({ account:'', symbol:'', result:'' })
  const fileRef               = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => calcStats(trades), [trades])

  const s = (k:string) => (e:any) => setForm((p:any) => ({...p,[k]:e.target.value}))
  const sf = (k:string) => (e:any) => setFilter(p => ({...p,[k]:e.target.value}))

  const accOpts  = accounts.map(a => ({ value:String(a.id), label:`${firms.find(f=>f.id===a.firm_id)?.name||'?'} ${a.size/1000}K ${a.type}` }))
  const symOpts  = [{value:'',label:'Todos'},...[...new Set(trades.map(t=>t.symbol))].map(s=>({value:s,label:s}))]
  const resOpts  = [{value:'',label:'Todos'},{value:'win',label:'Win'},{value:'loss',label:'Loss'},{value:'breakeven',label:'BE'}]
  const accFOpts = [{value:'',label:'Todas'},...accOpts]

  const filtered = trades.filter(t => {
    if (filter.account && t.account_id !== parseInt(filter.account)) return false
    if (filter.symbol  && t.symbol !== filter.symbol) return false
    if (filter.result  && t.result !== filter.result) return false
    return true
  })

  const save = async () => {
    if (!form.account_id || !form.entry_price || !form.exit_price) { showToast('Cuenta, entrada y salida requeridos','error'); return }
    setSaving(true)
    try {
      const acc = accounts.find(a => a.id === parseInt(form.account_id))
      await onAdd({
        account_id: parseInt(form.account_id),
        firm_id:    acc?.firm_id,
        symbol:     form.symbol,
        direction:  form.direction,
        trade_date: form.trade_date || new Date().toISOString().split('T')[0],
        trade_time: form.trade_time || null,
        contracts:  parseInt(form.contracts)||1,
        entry_price:parseFloat(form.entry_price),
        exit_price: parseFloat(form.exit_price),
        stop_loss:  form.stop_loss  ? parseFloat(form.stop_loss)  : null,
        take_profit:form.take_profit? parseFloat(form.take_profit): null,
        pnl:        parseFloat(form.pnl)||0,
        rr:         form.rr ? parseFloat(form.rr) : null,
        duration_min:form.duration_min ? parseInt(form.duration_min) : null,
        commission: parseFloat(form.commission)||0,
        result:     form.result,
        notes:      form.notes,
      })
      showToast('Trade registrado')
      setOpen(false)
      setForm(E0)
    } catch(e:any) { showToast(e.message,'error') }
    setSaving(false)
  }

  // CSV import
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !accounts.length) { showToast('Selecciona una cuenta primero','error'); return }
    setImp(true)
    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g,''))
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''))
        const obj: any = {}
        headers.forEach((h,i) => obj[h] = vals[i]||'')
        return obj
      }).filter(r => r.pnl !== undefined || r.entry !== undefined)

      // Map CSV columns to our schema (flexible mapping)
      const acc = accounts[0]
      const mapped = rows.map(r => ({
        account_id:  acc.id,
        firm_id:     acc.firm_id,
        symbol:      r.symbol || r.instrument || 'MNQ',
        direction:   (r.side||r.direction||'long').toLowerCase().includes('sell')||r.direction==='short' ? 'short' : 'long',
        trade_date:  r.date || r.trade_date || new Date().toISOString().split('T')[0],
        trade_time:  r.time || r.trade_time || null,
        contracts:   parseInt(r.contracts||r.qty||r.quantity||'1')||1,
        entry_price: parseFloat(r.entry||r.entry_price||'0')||0,
        exit_price:  parseFloat(r.exit||r.exit_price||'0')||0,
        pnl:         parseFloat(r.pnl||r.profit||r.net_pnl||'0')||0,
        commission:  parseFloat(r.commission||r.fees||'0')||0,
        result:      parseFloat(r.pnl||'0') > 0 ? 'win' : parseFloat(r.pnl||'0') < 0 ? 'loss' : 'breakeven',
        rr:          parseFloat(r.rr||'0')||0,
      }))
      const count = await onImport(mapped)
      showToast(`${count} trades importados`)
      if (fileRef.current) fileRef.current.value = ''
    } catch(e:any) { showToast('Error al procesar CSV: '+e.message,'error') }
    setImp(false)
  }

  const TAB = ({ id, label }: { id:any; label:string }) => (
    <button onClick={()=>setTab(id)} style={{ padding:'6px 16px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid', borderColor:tab===id?'rgba(255,255,255,0.15)':'transparent', background:tab===id?'rgba(255,255,255,0.06)':'transparent', color:tab===id?'#fff':'rgba(255,255,255,0.35)', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}>{label}</button>
  )

  const weekdayData = WDAYS.map((d,i) => ({ day:d, ...(stats.byWeekday[i]||{trades:0,pnl:0}) }))
  const symbolData  = Object.entries(stats.bySymbol).map(([sym,v]:any) => ({ sym, ...v }))

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>Trades</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{trades.length} operaciones registradas</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Btn variant="ghost" onClick={()=>fileRef.current?.click()} disabled={importing}>{importing?'Importando...':'↑ CSV'}</Btn>
          <Btn onClick={()=>{ setForm({...E0, account_id:String(accounts[0]?.id||''), trade_date:new Date().toISOString().split('T')[0]}); setOpen(true) }} disabled={accounts.length===0}>+ Trade</Btn>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display:'none' }}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, padding:4, background:'#0A0A0A', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', width:'fit-content' }}>
        <TAB id="list"   label="Lista"/>
        <TAB id="stats"  label="Estadísticas"/>
      </div>

      {/* ── LIST ── */}
      {tab==='list' && (
        <div>
          {/* Filters */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {[
              { label:'Cuenta', val:filter.account, fn:sf('account'), opts:accFOpts },
              { label:'Símbolo',val:filter.symbol,  fn:sf('symbol'),  opts:symOpts  },
              { label:'Resultado',val:filter.result,fn:sf('result'),  opts:resOpts  },
            ].map(({label,val,fn,opts})=>(
              <select key={label} value={val} onChange={fn} style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'6px 12px', fontSize:12, color:'rgba(255,255,255,0.6)', outline:'none', cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
                <option value="" style={{background:'#111'}}>{label}</option>
                {opts.filter(o=>o.value).map(o=><option key={o.value} value={o.value} style={{background:'#111'}}>{o.label}</option>)}
              </select>
            ))}
            {(filter.account||filter.symbol||filter.result) && <Btn variant="ghost" size="sm" onClick={()=>setFilter({account:'',symbol:'',result:''})}>✕ Limpiar</Btn>}
          </div>

          <Section title={`${filtered.length} trades`} sub="">
            {filtered.length===0
              ? <Empty title="Sin trades" sub={trades.length?'Cambia los filtros':'Agrega o importa trades desde CSV'}/>
              : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr>{['Fecha','Símbolo','Dir','Contr.','Entrada','Salida','PnL','RR','Resultado',''].map(h=>(
                        <th key={h} style={{ padding:'8px 16px 8px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', borderBottom:'1px solid rgba(255,255,255,0.06)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0,100).map(t=>(
                        <tr key={t.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.1s', cursor:'default' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'9px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap' }}>{t.trade_date}</td>
                          <td style={{ padding:'9px 16px', fontWeight:700, color:'#fff' }}>{t.symbol}</td>
                          <td style={{ padding:'9px 16px' }}>
                            <span style={{ fontSize:11, fontWeight:700, color: t.direction==='long'?'#10B981':'#EF4444' }}>{t.direction==='long'?'L':'S'}</span>
                          </td>
                          <td style={{ padding:'9px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.5)' }}>{t.contracts}</td>
                          <td style={{ padding:'9px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.5)' }}>{t.entry_price}</td>
                          <td style={{ padding:'9px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.5)' }}>{t.exit_price}</td>
                          <td style={{ padding:'9px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:pnlColor(t.pnl) }}>{t.pnl>=0?'+':''}{fmtUSD(t.pnl)}</td>
                          <td style={{ padding:'9px 16px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.4)' }}>{t.rr?t.rr.toFixed(2):'—'}</td>
                          <td style={{ padding:'9px 16px' }}><Badge variant={t.result==='win'?'green':t.result==='loss'?'red':'dim'}>{t.result.toUpperCase()}</Badge></td>
                          <td style={{ padding:'9px 16px' }}>
                            <button onClick={()=>confirm('¿Eliminar trade?')&&onDelete(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.15)', cursor:'pointer', fontSize:13, opacity:0, transition:'opacity 0.15s' }}
                              onMouseEnter={e=>{ e.currentTarget.style.opacity='1'; e.currentTarget.style.color='#EF4444' }}
                              onMouseLeave={e=>{ e.currentTarget.style.opacity='0'; e.currentTarget.style.color='rgba(255,255,255,0.15)' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length>100&&<div style={{ padding:'10px 16px', fontSize:11, color:'rgba(255,255,255,0.25)', textAlign:'center' }}>Mostrando 100 de {filtered.length} trades</div>}
                </div>
              )
            }
          </Section>
        </div>
      )}

      {/* ── STATS ── */}
      {tab==='stats' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            <StatCard label="Win Rate"      value={stats.winRate+'%'}              sub={`${stats.wins}W · ${stats.losses}L · ${stats.breakevens}BE`}/>
            <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)}  sub={`expectancy ${fmtUSD(stats.expectancy)}`}/>
            <StatCard label="Avg Winner"    value={fmtUSD(stats.avgWin)}           valueColor="#10B981" sub={`avg loser ${fmtUSD(stats.avgLoss)}`}/>
            <StatCard label="Max Drawdown"  value={fmtUSD(stats.maxDrawdown)}      valueColor={stats.maxDrawdown>0?'#EF4444':'#fff'} sub={`streak pérd: ${stats.maxLossStreak}`}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            <StatCard label="PnL Total"     value={(stats.totalPnl>=0?'+':'')+fmtUSD(stats.totalPnl)}   valueColor={pnlColor(stats.totalPnl)}/>
            <StatCard label="Comisiones"    value={fmtUSD(stats.totalCommissions)} valueColor="#EF4444"/>
            <StatCard label="PnL Neto"      value={(stats.netPnl>=0?'+':'')+fmtUSD(stats.netPnl)}       valueColor={pnlColor(stats.netPnl)}/>
            <StatCard label="Avg RR"        value={stats.avgRR.toFixed(2)}         sub={`streak ganadora: ${stats.maxWinStreak}`}/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {/* By weekday */}
            <Section title="PnL por día de semana" sub="Rendimiento según el día">
              <div style={{ padding:'14px 14px 10px' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weekdayData} barSize={28} margin={{top:4,right:4,left:0,bottom:0}}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
                    <XAxis dataKey="day" tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:"'JetBrains Mono'"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'rgba(255,255,255,0.25)',fontSize:10,fontFamily:"'JetBrains Mono'"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?'$'+(v/1000).toFixed(0)+'K':'$'+v} width={42}/>
                    <Tooltip content={<TT/>} cursor={{fill:'rgba(255,255,255,0.03)'}}/>
                    <Bar dataKey="pnl" radius={[3,3,0,0]}>
                      {weekdayData.map((d,i)=>(
                        <rect key={i} fill={d.pnl>=0?'rgba(16,185,129,0.75)':'rgba(239,68,68,0.75)'}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            {/* By symbol */}
            <Section title="PnL por instrumento" sub="Rendimiento por símbolo">
              <div style={{ padding:'14px 20px' }}>
                {symbolData.length===0
                  ? <Empty title="Sin datos"/>
                  : symbolData.map(s=>(
                    <div key={s.sym} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div>
                        <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{s.sym}</span>
                        <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginLeft:8 }}>{s.trades} trades · WR {s.wr}%</span>
                      </div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:pnlColor(s.pnl) }}>{s.pnl>=0?'+':''}{fmtUSD(s.pnl)}</span>
                    </div>
                  ))
                }
              </div>
            </Section>
          </div>

          {/* Best/Worst */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <StatCard label="Mejor día"  value={fmtDate(stats.bestDay)}  sub={stats.bestDay!=='—' ? fmtUSD(stats.byDay[stats.bestDay]?.pnl||0) : ''} valueColor="#10B981"/>
            <StatCard label="Peor día"   value={fmtDate(stats.worstDay)} sub={stats.worstDay!=='—'? fmtUSD(stats.byDay[stats.worstDay]?.pnl||0): ''} valueColor="#EF4444"/>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={open} onClose={()=>setOpen(false)} title="Registrar Trade"
        footer={<><Btn variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Btn><Btn onClick={save} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn></>}>
        <FGroup><FSelect label="Cuenta" value={form.account_id} onChange={s('account_id')} options={accOpts}/></FGroup>
        <FGroup><FRow><FSelect label="Símbolo" value={form.symbol} onChange={s('symbol')} options={SYM_OPTS}/><FSelect label="Dirección" value={form.direction} onChange={s('direction')} options={DIR_OPTS}/></FRow></FGroup>
        <FGroup><FRow><FInput label="Fecha" type="date" value={form.trade_date} onChange={s('trade_date')}/><FInput label="Hora" type="time" value={form.trade_time} onChange={s('trade_time')}/></FRow></FGroup>
        <FGroup><FRow><FInput label="Entrada" type="number" value={form.entry_price} onChange={s('entry_price')} placeholder="21050"/><FInput label="Salida" type="number" value={form.exit_price} onChange={s('exit_price')} placeholder="21100"/></FRow></FGroup>
        <FGroup><FRow><FInput label="PnL ($)" type="number" value={form.pnl} onChange={s('pnl')} placeholder="ej: 125"/><FInput label="Contratos" type="number" value={form.contracts} onChange={s('contracts')} placeholder="1"/></FRow></FGroup>
        <FGroup><FRow><FInput label="RR" type="number" value={form.rr} onChange={s('rr')} placeholder="2.5"/><FInput label="Comisión ($)" type="number" value={form.commission} onChange={s('commission')} placeholder="4"/></FRow></FGroup>
        <FGroup><FSelect label="Resultado" value={form.result} onChange={s('result')} options={RES_OPTS}/></FGroup>
        <FGroup><FInput label="Notas" value={form.notes} onChange={s('notes')} placeholder="opcional"/></FGroup>
      </Modal>
    </div>
  )
}
