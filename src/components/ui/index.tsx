"use client"
import React from "react"

// ── Primitives ─────────────────────────────────────────
export const fmtUSD  = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
export const pnlColor = (n: number) => n > 0 ? '#10B981' : n < 0 ? '#EF4444' : 'rgba(255,255,255,0.35)'
export const pnlPrefix = (n: number) => n > 0 ? '+' : ''

// ── Btn ────────────────────────────────────────────────
interface BtnProps { children: React.ReactNode; onClick?: ()=>void; disabled?: boolean; variant?: 'primary'|'ghost'|'danger'; size?: 'sm'|'md'; type?: 'button'|'submit'; className?: string }
export function Btn({ children, onClick, disabled, variant='primary', size='md', type='button', className='' }: BtnProps) {
  const base: React.CSSProperties = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'Inter,sans-serif', fontWeight:600, cursor: disabled?'not-allowed':'pointer', border:'1px solid', borderRadius:8, transition:'all 0.15s', opacity: disabled?0.4:1, whiteSpace:'nowrap', fontSize: size==='sm'?11:13, padding: size==='sm'?'5px 12px':'8px 16px' }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background:'#fff', color:'#000', borderColor:'transparent' },
    ghost:   { background:'transparent', color:'rgba(255,255,255,0.6)', borderColor:'rgba(255,255,255,0.12)' },
    danger:  { background:'transparent', color:'#EF4444', borderColor:'rgba(239,68,68,0.25)' },
  }
  return <button type={type} onClick={onClick} disabled={disabled} style={{...base,...variants[variant]}}>{children}</button>
}

// ── Badge ──────────────────────────────────────────────
export function Badge({ children, variant='white' }: { children: React.ReactNode; variant?: 'white'|'green'|'red'|'dim' }) {
  const s: Record<string, React.CSSProperties> = {
    white: { background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.7)',  border:'1px solid rgba(255,255,255,0.12)' },
    green: { background:'rgba(16,185,129,0.1)',   color:'#10B981',               border:'1px solid rgba(16,185,129,0.2)'   },
    red:   { background:'rgba(239,68,68,0.1)',    color:'#EF4444',               border:'1px solid rgba(239,68,68,0.2)'    },
    dim:   { background:'transparent',            color:'rgba(255,255,255,0.3)', border:'1px solid rgba(255,255,255,0.08)' },
  }
  return <span style={{ ...s[variant], display:'inline-flex', alignItems:'center', fontSize:10, fontWeight:700, letterSpacing:'0.06em', padding:'2px 8px', borderRadius:99, fontFamily:"'JetBrains Mono',monospace" }}>{children}</span>
}

// ── Modal ──────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, width=480 }: { open:boolean; onClose:()=>void; title:string; children:React.ReactNode; footer?: React.ReactNode; width?: number }) {
  if (!open) return null
  return (
    <div onClick={e => e.target===e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, width, maxWidth:'95vw', overflow:'hidden', animation:'slideUp 0.2s ease' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:18, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:'20px 22px' }}>{children}</div>
        {footer && <div style={{ padding:'14px 22px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, justifyContent:'flex-end' }}>{footer}</div>}
      </div>
    </div>
  )
}

// ── Form helpers ───────────────────────────────────────
const inputStyle: React.CSSProperties = { width:'100%', background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#fff', outline:'none', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }
const labelStyle: React.CSSProperties = { display:'block', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:5 }
export function FGroup({ children, className }: { children: React.ReactNode; className?: string }) { return <div style={{ marginBottom:14 }}>{children}</div> }
export function FRow ({ children }: { children: React.ReactNode }) { return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>{children}</div> }
export function FInput({ label, type='text', value, onChange, placeholder, hint }: { label?:string; type?:string; value:string; onChange:(e:any)=>void; placeholder?:string; hint?:string }) {
  return <div><label style={labelStyle}>{label}</label><input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle}/>{hint&&<div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginTop:4 }}>{hint}</div>}</div>
}
export function FSelect({ label, value, onChange, options }: { label?:string; value:string; onChange:(e:any)=>void; options:{value:string;label:string}[] }) {
  return <div><label style={labelStyle}>{label}</label><select value={value} onChange={onChange} style={{...inputStyle, appearance:'none', cursor:'pointer'}}>{options.map(o=><option key={o.value} value={o.value} style={{background:'#111'}}>{o.label}</option>)}</select></div>
}

// ── Stat Card ──────────────────────────────────────────
export function StatCard({ label, value, sub, valueColor }: { label:string; value:string|number; sub?:string; valueColor?:string }) {
  return (
    <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'18px 20px' }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:10 }}>{label}</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:26, fontWeight:700, color: valueColor||'#fff', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:6, fontFamily:"'JetBrains Mono',monospace" }}>{sub}</div>}
    </div>
  )
}

// ── Section ────────────────────────────────────────────
export function Section({ title, sub, right, children }: { title:string; sub?:string; right?:React.ReactNode; children:React.ReactNode }) {
  return (
    <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)' }}>{title}</div>
          {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:2 }}>{sub}</div>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────
export function Toast({ message, type='success', visible }: { message:string; type?:'success'|'error'; visible:boolean }) {
  if (!visible) return null
  return (
    <div style={{ position:'fixed', bottom:24, right:24, background:'#0A0A0A', border:`1px solid ${type==='error'?'rgba(239,68,68,0.4)':'rgba(255,255,255,0.15)'}`, borderRadius:10, padding:'11px 16px', fontSize:13, color:'#fff', zIndex:9999, display:'flex', alignItems:'center', gap:10, animation:'slideUp 0.2s ease', boxShadow:'0 8px 24px rgba(0,0,0,0.6)' }}>
      <span style={{ color: type==='error'?'#EF4444':'#10B981' }}>{type==='error'?'✕':'✓'}</span>
      {message}
    </div>
  )
}

// ── Empty ──────────────────────────────────────────────
export function Empty({ icon='◈', title, sub }: { icon?:string; title:string; sub?:string }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 20px' }}>
      <div style={{ fontSize:24, opacity:0.15, marginBottom:8 }}>{icon}</div>
      <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.4)' }}>{title}</div>
      {sub && <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', marginTop:4, lineHeight:1.6 }}>{sub}</div>}
    </div>
  )
}

// ── Progress Bar ───────────────────────────────────────
export function ProgressBar({ value, max, color='#fff' }: { value:number; max:number; color?:string }) {
  const pct = max > 0 ? Math.min(100, (value/max)*100) : 0
  return (
    <div style={{ height:2, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99, transition:'width 0.6s ease' }}/>
    </div>
  )
}
