"use client"
import type { Firm, Account, Trade, Evaluation, Payout } from "@/lib/types"

const NAV = [
  { id:"dashboard",  label:"Dashboard",   icon:"▦" },
  { id:"cuentas",    label:"Cuentas",     icon:"⊞" },
  { id:"trades",     label:"Trades",      icon:"↕" },
  { id:"finanzas",   label:"Finanzas",    icon:"◈" },
  { id:"consejero",  label:"Consejero IA",icon:"◎" },
]

interface Props {
  view: string; setView: (v:string)=>void
  user: any; onSignOut: ()=>void
  accounts: Account[]; trades: Trade[]
  evaluations: Evaluation[]; payouts: Payout[]
}

export default function Sidebar({ view, setView, user, onSignOut, accounts, trades, evaluations, payouts }: Props) {
  const paActive     = accounts.filter(a=>a.status==='active'&&a.type==='pa').length
  const inEval       = accounts.filter(a=>a.type==='evaluation'&&a.status==='active').length
  const totalInvested= evaluations.reduce((s,e)=>s+e.amount,0)
  const totalPaidOut = payouts.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0)
  const net          = totalPaidOut - totalInvested
  const emailShort   = user?.email ? (user.email.length>22 ? user.email.slice(0,20)+'…' : user.email) : ''
  const initial      = user?.email?.[0]?.toUpperCase()||'?'

  const dotColor = paActive >= 2 ? '#10B981' : paActive === 1 ? 'rgba(255,255,255,0.5)' : '#EF4444'
  const dotLabel = paActive >= 2 ? 'Sostenible' : paActive === 1 ? 'Mínimo' : 'Crítico'

  return (
    <aside style={{ width:220, minWidth:220, background:'#0A0A0A', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100 }}>
      {/* Logo */}
      <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:17, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}>PropFlow</div>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', letterSpacing:'0.18em', textTransform:'uppercase', marginTop:3 }}>Prop Firm Manager</div>
      </div>

      {/* Quick stats */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { l:'PAs activas', v: paActive, color: paActive>=2?'#10B981':'#EF4444' },
          { l:'En eval.',    v: inEval,   color:'#fff' },
        ].map(({l,v,color})=>(
          <div key={l} style={{ background:'#111', borderRadius:8, padding:'8px 10px', border:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:20, fontWeight:700, color, lineHeight:1 }}>{v}</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>{l}</div>
          </div>
        ))}
        <div style={{ gridColumn:'1/-1', background:'#111', borderRadius:8, padding:'8px 10px', border:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color: net>=0?'#10B981':'#EF4444', lineHeight:1 }}>
            {net>=0?'+':''}{net>=0||net<0 ? '$'+Math.abs(Math.round(net)).toLocaleString() : '$0'}
          </div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:3 }}>Resultado neto</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding:'10px 10px', flex:1 }}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setView(item.id)}
            style={{ display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 10px', borderRadius:8, cursor:'pointer', color: view===item.id?'#fff':'rgba(255,255,255,0.4)', fontSize:13, fontWeight: view===item.id?600:400, transition:'all 0.15s', marginBottom:2, border:'1px solid', borderColor: view===item.id?'rgba(255,255,255,0.12)':'transparent', background: view===item.id?'rgba(255,255,255,0.05)':'transparent', fontFamily:'Inter,sans-serif', textAlign:'left' }}>
            <span style={{ fontSize:13, width:16, textAlign:'center', opacity: view===item.id?1:0.5 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:'10px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:6 }}>
        {/* Status */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'#111', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:dotColor, boxShadow:`0 0 6px ${dotColor}`, flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#fff' }}>{dotLabel}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:1 }}>{paActive} PA{paActive!==1?'s':''} activa{paActive!==1?'s':''}</div>
          </div>
        </div>
        {/* User */}
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'#111', borderRadius:8, border:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{initial}</div>
          <div style={{ flex:1, minWidth:0, fontSize:11, color:'rgba(255,255,255,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{emailShort}</div>
          <button onClick={onSignOut} title="Cerrar sesión" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', fontSize:13, padding:'2px 3px', borderRadius:4, flexShrink:0, transition:'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color='#EF4444'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>⏻</button>
        </div>
      </div>
    </aside>
  )
}
