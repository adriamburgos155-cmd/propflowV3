"use client"
import { useState, useRef, useEffect } from "react"
import { Section } from "@/components/ui"
import { calcStats, calcFinancials } from "@/lib/analytics"
import { fmtUSD, fmtDate } from "@/lib/utils"
import type { Trade, Account, Firm, Evaluation, Payout } from "@/lib/types"

const QUICK = [
  { label:"¿Cuánto llevo este mes?",        text:"¿Cuánto dinero he ganado este mes y cómo se compara con los meses anteriores?" },
  { label:"¿Cuál cuenta rinde mejor?",      text:"¿Cuál de mis cuentas tiene el mejor ROI y win rate?" },
  { label:"¿Dónde pierdo dinero?",          text:"¿Dónde estoy perdiendo dinero? Detecta patrones negativos en mis trades." },
  { label:"¿Qué día funciona mejor?",       text:"¿Qué día de la semana y horario genera mejores resultados en mis trades?" },
  { label:"¿Cuándo pedir payout?",          text:"¿Cuándo debería solicitar mi próximo payout según el estado actual de mis cuentas?" },
  { label:"Análisis de drawdown",           text:"Analiza mi drawdown actual en todas las cuentas y dime si hay riesgo." },
  { label:"¿Qué errores detectas?",         text:"¿Qué errores o patrones negativos detectas en mi historial de trades?" },
  { label:"Plan de escala",                 text:"¿Cómo puedo escalar mi negocio de prop firms de forma sostenible con los datos actuales?" },
]

function buildContext(firms: Firm[], accounts: Account[], trades: Trade[], evaluations: Evaluation[], payouts: Payout[]) {
  const stats = calcStats(trades)
  const fin   = calcFinancials(evaluations, payouts)
  const today = new Date().toISOString().split('T')[0]
  const month = today.slice(0,7)

  const monthTrades = trades.filter(t => t.trade_date?.startsWith(month))
  const monthPnl    = monthTrades.reduce((s,t) => s+t.pnl, 0)
  const todayTrades = trades.filter(t => t.trade_date === today)
  const todayPnl    = todayTrades.reduce((s,t) => s+t.pnl, 0)

  const paAccounts  = accounts.filter(a => a.type==='pa' && a.status==='active')
  const evalAcc     = accounts.filter(a => a.type==='evaluation' && a.status==='active')
  const pendingPays = payouts.filter(p => p.status==='pending'||p.status==='approved')

  return `Eres el consejero financiero de PropFlow, especializado en prop firms de futuros.
Tienes acceso COMPLETO a todos los datos del trader. NUNCA inventes datos. Si no tienes información, dilo.
Responde SIEMPRE en español. Sé específico con números reales. Usa **negrita** para lo más importante.

═══ DATOS ACTUALES DEL PORTAFOLIO ═══

FIRMAS (${firms.length}):
${firms.map(f => {
  const fa = accounts.filter(a=>a.firm_id===f.id)
  const fp = payouts.filter(p=>p.firm_id===f.id&&p.status==='paid').reduce((s,p)=>s+p.amount,0)
  const fe = evaluations.filter(e=>e.firm_id===f.id).reduce((s,e)=>s+e.amount,0)
  return `- ${f.name}: ${fa.length} cuentas, invertido ${fmtUSD(fe)}, cobrado ${fmtUSD(fp)}, ROI ${fe>0?((fp-fe)/fe*100).toFixed(1):'0'}%`
}).join('\n')||'Sin firmas registradas'}

CUENTAS ACTIVAS:
PAs fondeadas (${paAccounts.length}):
${paAccounts.map(a => `- ${a.name||a.size/1000+'K'}: balance ${fmtUSD(a.current_balance)}, PnL ${fmtUSD(a.pnl_total)}, DD restante ${fmtUSD(a.remaining_dd)}, WR ${a.win_rate?.toFixed(1)||'—'}%${a.consistency_limit>0?', límite/día '+fmtUSD(a.consistency_limit):''}`).join('\n')||'Ninguna PA activa'}

Evaluaciones activas (${evalAcc.length}):
${evalAcc.map(a => `- ${a.size/1000}K: balance ${fmtUSD(a.current_balance)}, DD restante ${fmtUSD(a.remaining_dd)}${a.consistency_limit>0?', límite/día '+fmtUSD(a.consistency_limit):''}`).join('\n')||'Ninguna evaluación activa'}

ESTADÍSTICAS DE TRADING (${stats.totalTrades} trades totales):
- PnL Total: ${fmtUSD(stats.totalPnl)} | Neto (−comis): ${fmtUSD(stats.netPnl)}
- PnL Hoy: ${fmtUSD(todayPnl)} (${todayTrades.length} trades)
- PnL Este mes (${month}): ${fmtUSD(monthPnl)} (${monthTrades.length} trades)
- Win Rate: ${stats.winRate}% | Profit Factor: ${stats.profitFactor} | Expectancy: ${fmtUSD(stats.expectancy)}
- Avg Winner: ${fmtUSD(stats.avgWin)} | Avg Loser: ${fmtUSD(stats.avgLoss)} | Avg RR: ${stats.avgRR.toFixed(2)}
- Max Drawdown: ${fmtUSD(stats.maxDrawdown)} | Max racha pérd: ${stats.maxLossStreak} | Max racha gan: ${stats.maxWinStreak}
- Mejor día: ${fmtDate(stats.bestDay)} | Peor día: ${fmtDate(stats.worstDay)}
${Object.keys(stats.bySymbol).length>0 ? '- Por símbolo: '+Object.entries(stats.bySymbol).map(([s,v]:any)=>`${s}: ${v.trades}tr WR${v.wr}% ${fmtUSD(v.pnl)}`).join(', ') : ''}
${Object.keys(stats.byWeekday).length>0 ? '- Por día semana: '+Object.entries(stats.byWeekday).map(([d,v]:any)=>`${['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][parseInt(d)]}: ${fmtUSD(v.pnl)}`).join(', ') : ''}

FINANZAS:
- Total invertido: ${fmtUSD(fin.totalInvested)} (evals: ${fmtUSD(fin.evalCost)}, activaciones: ${fmtUSD(fin.activationCost)}, resets: ${fmtUSD(fin.resetCost)})
- Total cobrado (payouts pagados): ${fmtUSD(fin.totalPayouts)}
- Resultado neto: ${fmtUSD(fin.netProfit)} | ROI: ${fin.roi.toFixed(1)}%
- Capital pendiente de recuperar: ${fmtUSD(fin.pending)}
- Payouts pendientes/aprobados: ${pendingPays.length} (${fmtUSD(pendingPays.reduce((s,p)=>s+p.amount,0))})

REGLAS DEL NEGOCIO:
- Mínimo sostenible: 2 PAs activas generando payouts/mes
- Estrategia: bola de nieve — parte de ganancias se reinvierte en nuevas evaluaciones
- Opera futuros NQ/MNQ con modelo EOD (End of Day)`
}

interface Msg { role:'user'|'assistant'; content:string; time:string }
interface Props { firms:Firm[]; accounts:Account[]; trades:Trade[]; evaluations:Evaluation[]; payouts:Payout[] }

export default function ConsejeroView({ firms, accounts, trades, evaluations, payouts }: Props) {
  const [msgs, setMsgs]     = useState<Msg[]>([{
    role:'assistant',
    content:`Hola. Soy tu consejero IA de PropFlow.\n\nTengo acceso completo a tu portafolio — ${firms.length} firma${firms.length!==1?'s':''}, ${accounts.length} cuenta${accounts.length!==1?'s':''}, ${trades.length} trade${trades.length!==1?'s':''}, ${evaluations.length} evaluación${evaluations.length!==1?'es':''} y ${payouts.length} payout${payouts.length!==1?'s':''}.\n\n**No invento datos.** Consulto tu base de datos real antes de cada respuesta.\n\n¿Qué quieres analizar?`,
    time: new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})
  }])
  const [input, setInput]   = useState('')
  const [loading, setLoad]  = useState(false)
  const histRef             = useRef<{role:string;content:string}[]>([])
  const msgsRef             = useRef<HTMLDivElement>(null)

  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight }, [msgs, loading])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const time = new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})
    setMsgs(m => [...m, { role:'user', content:msg, time }])
    histRef.current = [...histRef.current, { role:'user', content:msg }]
    setLoad(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-6', max_tokens:1500,
          system: buildContext(firms, accounts, trades, evaluations, payouts),
          messages: histRef.current.slice(-16)
        })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Error al obtener respuesta.'
      histRef.current = [...histRef.current, { role:'assistant', content:reply }]
      setMsgs(m => [...m, { role:'assistant', content:reply, time:new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}) }])
    } catch { setMsgs(m => [...m, { role:'assistant', content:'Error de conexión.', time }]) }
    setLoad(false)
  }

  const handleKey = (e: React.KeyboardEvent) => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); send() } }
  const autoResize = (el: HTMLTextAreaElement) => { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,120)+'px' }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)', background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Consejero IA</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:1 }}>Acceso completo a tu base de datos · {trades.length} trades · {accounts.length} cuentas</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 5px #10B981' }}/>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>Claude Sonnet</span>
        </div>
      </div>

      {/* Quick prompts */}
      <div style={{ display:'flex', gap:6, padding:'10px 16px', overflowX:'auto', flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.04)', scrollbarWidth:'none' }}>
        {QUICK.map(({label,text}) => (
          <button key={label} onClick={()=>send(text)} style={{ flexShrink:0, background:'#111', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'rgba(255,255,255,0.5)', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.2)'; e.currentTarget.style.color='#fff' }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.color='rgba(255,255,255,0.5)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
        {msgs.map((m,i) => (
          <div key={i} style={{ display:'flex', gap:10, maxWidth:'88%', alignSelf:m.role==='user'?'flex-end':'flex-start', flexDirection:m.role==='user'?'row-reverse':'row' }}>
            <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, background:m.role==='assistant'?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.1)', color:m.role==='assistant'?'rgba(255,255,255,0.7)':'#fff', border:'1px solid rgba(255,255,255,0.08)' }}>
              {m.role==='assistant'?'AI':'Tú'}
            </div>
            <div>
              <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, lineHeight:1.65, background:m.role==='assistant'?'#111':'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.06)', color:'#fff', ...(m.role==='assistant'?{borderTopLeftRadius:2}:{borderTopRightRadius:2}) }}
                dangerouslySetInnerHTML={{ __html:m.content.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }}/>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:3, fontFamily:"'JetBrains Mono',monospace", textAlign:m.role==='user'?'right':'left' }}>{m.time}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:10, alignSelf:'flex-start' }}>
            <div style={{ width:26, height:26, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.7)', border:'1px solid rgba(255,255,255,0.08)' }}>AI</div>
            <div style={{ padding:'12px 16px', background:'#111', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, borderTopLeftRadius:2, display:'flex', gap:4, alignItems:'center' }}>
              {[0,150,300].map(d=>(
                <div key={d} style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.3)', animation:`pulse 1.2s ${d}ms infinite` }}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:10, alignItems:'flex-end', flexShrink:0 }}>
        <textarea value={input} onChange={e=>{setInput(e.target.value);autoResize(e.target)}} onKeyDown={handleKey}
          placeholder="Pregunta algo sobre tu negocio... (Enter para enviar)"
          rows={1}
          style={{ flex:1, background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#fff', fontFamily:'Inter,sans-serif', resize:'none', outline:'none', lineHeight:1.5, minHeight:40, maxHeight:120, transition:'border-color 0.15s' }}
          onFocus={e=>e.target.style.borderColor='rgba(255,255,255,0.25)'}
          onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
        <button onClick={()=>send()} disabled={loading||!input.trim()}
          style={{ width:40, height:40, background:'#fff', border:'none', borderRadius:10, cursor:loading||!input.trim()?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, opacity:loading||!input.trim()?0.3:1, transition:'all 0.15s', flexShrink:0 }}>
          ➤
        </button>
      </div>
    </div>
  )
}
