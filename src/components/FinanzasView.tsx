"use client"
import { useState } from "react"
import { Btn, Badge, Modal, FGroup, FRow, FInput, FSelect, Section, Empty, StatCard, fmtUSD } from "@/components/ui"
import { fmtDate } from "@/lib/utils"
import { calcFinancials } from "@/lib/analytics"
import type { Firm, Account, Evaluation, Payout } from "@/lib/types"

interface Props { firms:Firm[]; accounts:Account[]; evaluations:Evaluation[]; payouts:Payout[]; onAddFirm:(f:any)=>Promise<any>; onDeleteFirm:(id:number)=>Promise<void>; onAddEval:(e:any)=>Promise<any>; onUpdateEval:(id:number,e:any)=>Promise<void>; onAddPayout:(p:any)=>Promise<any>; onUpdatePayout:(id:number,p:any)=>Promise<void>; showToast:(m:string,t?:'success'|'error')=>void }

const EVAL_TYPE_OPTS   = [{value:'evaluation',label:'Evaluation fee'},{value:'activation',label:'Activation fee'},{value:'reset',label:'Reset fee'}]
const EVAL_STATUS_OPTS = [{value:'active',label:'Activa'},{value:'passed',label:'Pasada'},{value:'failed',label:'Fallida'},{value:'refunded',label:'Reembolsada'}]
const PAY_STATUS_OPTS  = [{value:'pending',label:'Pendiente'},{value:'approved',label:'Aprobada'},{value:'paid',label:'Pagada'},{value:'rejected',label:'Rechazada'}]

export default function FinanzasView({ firms, accounts, evaluations, payouts, onAddFirm, onDeleteFirm, onAddEval, onUpdateEval, onAddPayout, onUpdatePayout, showToast }: Props) {
  const fin = calcFinancials(evaluations, payouts)
  const [tab, setTab] = useState<'firms'|'evals'|'payouts'>('firms')

  // Firm modal
  const [firmOpen, setFirmOpen]   = useState(false)
  const [firmForm, setFirmForm]   = useState({ name:'', website:'', type:'prop_firm' })
  const sf = (k:string) => (e:any) => setFirmForm(p => ({...p,[k]:e.target.value}))
  const saveFirm = async () => {
    if (!firmForm.name) { showToast('Nombre requerido','error'); return }
    try { await onAddFirm(firmForm); showToast('Firma agregada'); setFirmOpen(false); setFirmForm({name:'',website:'',type:'prop_firm'}) }
    catch(e:any) { showToast(e.message,'error') }
  }

  // Eval modal
  const [evalOpen, setEvalOpen]   = useState(false)
  const [evalEdit, setEvalEdit]   = useState<Evaluation|null>(null)
  const [evalForm, setEvalForm]   = useState({ firm_id:'', account_id:'', type:'evaluation', amount:'', purchase_date:new Date().toISOString().split('T')[0], status:'active', notes:'' })
  const se = (k:string) => (e:any) => setEvalForm(p => ({...p,[k]:e.target.value}))
  const openAddEval = () => { setEvalEdit(null); setEvalForm({ firm_id:String(firms[0]?.id||''), account_id:'', type:'evaluation', amount:'', purchase_date:new Date().toISOString().split('T')[0], status:'active', notes:'' }); setEvalOpen(true) }
  const openEditEval = (ev: Evaluation) => { setEvalEdit(ev); setEvalForm({ firm_id:String(ev.firm_id), account_id:String(ev.account_id||''), type:ev.type, amount:String(ev.amount), purchase_date:ev.purchase_date, status:ev.status, notes:ev.notes||'' }); setEvalOpen(true) }
  const saveEval = async () => {
    const amt = parseFloat(evalForm.amount)
    if (!amt || amt <= 0) { showToast('Monto requerido','error'); return }
    try {
      const payload = { firm_id:parseInt(evalForm.firm_id), account_id:evalForm.account_id?parseInt(evalForm.account_id):null, type:evalForm.type, amount:amt, purchase_date:evalForm.purchase_date, status:evalForm.status, notes:evalForm.notes }
      if (evalEdit) { await onUpdateEval(evalEdit.id, payload); showToast('Actualizado') }
      else { await onAddEval(payload); showToast('Fee registrado') }
      setEvalOpen(false)
    } catch(e:any) { showToast(e.message,'error') }
  }

  // Payout modal
  const [payOpen, setPayOpen]     = useState(false)
  const [payEdit, setPayEdit]     = useState<Payout|null>(null)
  const [payForm, setPayForm]     = useState({ firm_id:'', account_id:'', amount:'', requested_at:'', approved_at:'', paid_at:'', status:'pending', notes:'' })
  const sp = (k:string) => (e:any) => setPayForm(p => ({...p,[k]:e.target.value}))
  const openAddPay  = () => { setPayEdit(null); setPayForm({ firm_id:String(firms[0]?.id||''), account_id:'', amount:'', requested_at:new Date().toISOString().split('T')[0], approved_at:'', paid_at:'', status:'pending', notes:'' }); setPayOpen(true) }
  const openEditPay = (p: Payout) => { setPayEdit(p); setPayForm({ firm_id:String(p.firm_id), account_id:String(p.account_id), amount:String(p.amount), requested_at:p.requested_at||'', approved_at:p.approved_at||'', paid_at:p.paid_at||'', status:p.status, notes:p.notes||'' }); setPayOpen(true) }
  const savePay = async () => {
    const amt = parseFloat(payForm.amount)
    if (!amt||!payForm.account_id) { showToast('Monto y cuenta requeridos','error'); return }
    try {
      const payload = { firm_id:parseInt(payForm.firm_id), account_id:parseInt(payForm.account_id), amount:amt, requested_at:payForm.requested_at||null, approved_at:payForm.approved_at||null, paid_at:payForm.paid_at||null, status:payForm.status, notes:payForm.notes }
      if (payEdit) { await onUpdatePayout(payEdit.id, payload); showToast('Payout actualizado') }
      else { await onAddPayout(payload); showToast('Payout registrado') }
      setPayOpen(false)
    } catch(e:any) { showToast(e.message,'error') }
  }

  const firmOpts    = firms.map(f=>({value:String(f.id),label:f.name}))
  const accountOpts = accounts.filter(a=>a.firm_id===parseInt(evalForm.firm_id||payForm.firm_id||'0')).map(a=>({value:String(a.id),label:`${a.size/1000}K ${a.type}`}))
  const payAccOpts  = accounts.filter(a=>a.firm_id===parseInt(payForm.firm_id||'0')).map(a=>({value:String(a.id),label:`${a.size/1000}K ${a.type}`}))

  const statusColor: Record<string,string> = { active:'rgba(255,255,255,0.5)', passed:'#10B981', failed:'#EF4444', refunded:'rgba(255,255,255,0.3)', pending:'rgba(255,255,255,0.5)', approved:'rgba(255,255,255,0.7)', paid:'#10B981', rejected:'#EF4444' }

  const TAB = ({ id, label }: { id:any; label:string }) => (
    <button onClick={()=>setTab(id)} style={{ padding:'6px 16px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid', borderColor: tab===id?'rgba(255,255,255,0.15)':'transparent', background: tab===id?'rgba(255,255,255,0.06)':'transparent', color: tab===id?'#fff':'rgba(255,255,255,0.35)', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}>{label}</button>
  )

  return (
    <div>
      {/* Summary KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <StatCard label="Total invertido"  value={fmtUSD(fin.totalInvested)} sub={`${evaluations.length} registros`}/>
        <StatCard label="Total cobrado"    value={fmtUSD(fin.totalPayouts)}  valueColor={fin.totalPayouts>0?'#10B981':'#fff'} sub={`${payouts.filter(p=>p.status==='paid').length} payouts pagados`}/>
        <StatCard label="Resultado neto"   value={(fin.netProfit>=0?'+':'')+fmtUSD(fin.netProfit)} valueColor={fin.netProfit>=0?'#10B981':'#EF4444'} sub={`ROI ${fin.roi.toFixed(1)}%`}/>
        <StatCard label="Por recuperar"    value={fmtUSD(fin.pending)} sub={fin.pending===0?'✓ Recuperado':'capital pendiente'}/>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, padding:4, background:'#0A0A0A', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', width:'fit-content' }}>
        <TAB id="firms"   label="Firmas"/>
        <TAB id="evals"   label="Fees & Evals"/>
        <TAB id="payouts" label="Payouts"/>
      </div>

      {/* ── FIRMAS ── */}
      {tab === 'firms' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <Btn onClick={()=>setFirmOpen(true)}>+ Nueva firma</Btn>
          </div>
          {firms.length === 0
            ? <Empty title="Sin firmas" sub="Agrega tu primera prop firm para comenzar."/>
            : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                {firms.map(f => {
                  const fEvals   = evaluations.filter(e=>e.firm_id===f.id)
                  const fPays    = payouts.filter(p=>p.firm_id===f.id&&p.status==='paid')
                  const invested = fEvals.reduce((s,e)=>s+e.amount,0)
                  const paid     = fPays.reduce((s,p)=>s+p.amount,0)
                  const roi      = invested>0?((paid-invested)/invested*100):0
                  return (
                    <div key={f.id} style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:16 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                        <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{f.name}</div>
                        <Btn variant="danger" size="sm" onClick={()=>confirm('¿Eliminar firma y todas sus cuentas?')&&onDeleteFirm(f.id)}>✕</Btn>
                      </div>
                      {f.website&&<div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginBottom:10 }}>{f.website}</div>}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        {[{l:'Invertido',v:fmtUSD(invested)},{l:'Cobrado',v:fmtUSD(paid),c:paid>0?'#10B981':undefined},{l:'ROI',v:roi.toFixed(1)+'%',c:roi>=0?'#10B981':'#EF4444'},{l:'Cuentas',v:accounts.filter(a=>a.firm_id===f.id).length}].map(({l,v,c}:any)=>(
                          <div key={l} style={{ background:'#111', borderRadius:6, padding:'7px 9px', border:'1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
                            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:c||'#fff', marginTop:2 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      )}

      {/* ── EVALS ── */}
      {tab === 'evals' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <Btn onClick={openAddEval} disabled={firms.length===0}>+ Registrar fee</Btn>
          </div>
          <Section title="Historial de fees" sub={`${evaluations.length} registros · total ${fmtUSD(fin.totalInvested)}`}>
            <div style={{ overflowX:'auto' }}>
              {evaluations.length===0
                ? <Empty title="Sin registros" sub="Registra tu primera evaluación o fee."/>
                : (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>{['Fecha','Firma','Cuenta','Tipo','Monto','Estado',''].map(h=><th key={h} style={{ padding:'10px 20px 8px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {evaluations.map(e=>(
                        <tr key={e.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'10px 20px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.5)' }}>{fmtDate(e.purchase_date)}</td>
                          <td style={{ padding:'10px 20px', fontSize:13, fontWeight:600, color:'#fff' }}>{(e.firm as any)?.name||'—'}</td>
                          <td style={{ padding:'10px 20px', fontSize:12, color:'rgba(255,255,255,0.4)' }}>{(e.account as any) ? `${(e.account as any).size/1000}K` : '—'}</td>
                          <td style={{ padding:'10px 20px' }}><Badge variant="white">{e.type}</Badge></td>
                          <td style={{ padding:'10px 20px', fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:'#EF4444' }}>-{fmtUSD(e.amount)}</td>
                          <td style={{ padding:'10px 20px' }}><span style={{ fontSize:11, color: statusColor[e.status]||'#fff' }}>{e.status}</span></td>
                          <td style={{ padding:'10px 20px' }}><Btn variant="ghost" size="sm" onClick={()=>openEditEval(e)}>✎</Btn></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          </Section>
        </div>
      )}

      {/* ── PAYOUTS ── */}
      {tab === 'payouts' && (
        <div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
            <Btn onClick={openAddPay} disabled={firms.length===0}>+ Registrar payout</Btn>
          </div>
          <Section title="Historial de payouts" sub={`${payouts.filter(p=>p.status==='paid').length} pagados · total ${fmtUSD(fin.totalPayouts)}`}>
            <div style={{ overflowX:'auto' }}>
              {payouts.length===0
                ? <Empty title="Sin payouts" sub="Registra tu primer payout."/>
                : (
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>{['Solicitado','Firma','Cuenta','Monto','Estado','Pagado',''].map(h=><th key={h} style={{ padding:'10px 20px 8px', textAlign:'left', fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {payouts.map(p=>(
                        <tr key={p.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'10px 20px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.5)' }}>{fmtDate(p.requested_at)}</td>
                          <td style={{ padding:'10px 20px', fontSize:13, fontWeight:600, color:'#fff' }}>{(p.firm as any)?.name||'—'}</td>
                          <td style={{ padding:'10px 20px', fontSize:12, color:'rgba(255,255,255,0.4)' }}>{(p.account as any) ? `${(p.account as any).size/1000}K` : '—'}</td>
                          <td style={{ padding:'10px 20px', fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700, color:p.status==='paid'?'#10B981':'#fff' }}>+{fmtUSD(p.amount)}</td>
                          <td style={{ padding:'10px 20px' }}><Badge variant={p.status==='paid'?'green':p.status==='rejected'?'red':'white'}>{p.status}</Badge></td>
                          <td style={{ padding:'10px 20px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:'rgba(255,255,255,0.4)' }}>{p.paid_at?fmtDate(p.paid_at):'—'}</td>
                          <td style={{ padding:'10px 20px' }}><Btn variant="ghost" size="sm" onClick={()=>openEditPay(p)}>✎</Btn></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              }
            </div>
          </Section>
        </div>
      )}

      {/* Firm Modal */}
      <Modal open={firmOpen} onClose={()=>setFirmOpen(false)} title="Nueva Firma" footer={<><Btn variant="ghost" onClick={()=>setFirmOpen(false)}>Cancelar</Btn><Btn onClick={saveFirm}>Guardar</Btn></>}>
        <FGroup><FInput label="Nombre"   value={firmForm.name}    onChange={sf('name')}    placeholder="ej: Apex Trader Funding"/></FGroup>
        <FGroup><FInput label="Sitio web" value={firmForm.website} onChange={sf('website')} placeholder="apextraderfunding.com"/></FGroup>
      </Modal>

      {/* Eval Modal */}
      <Modal open={evalOpen} onClose={()=>setEvalOpen(false)} title={evalEdit?'Editar Fee':'Registrar Fee'} footer={<><Btn variant="ghost" onClick={()=>setEvalOpen(false)}>Cancelar</Btn><Btn onClick={saveEval}>Guardar</Btn></>}>
        <FGroup><FRow><FSelect label="Firma" value={evalForm.firm_id} onChange={se('firm_id')} options={firmOpts}/><FSelect label="Tipo" value={evalForm.type} onChange={se('type')} options={EVAL_TYPE_OPTS}/></FRow></FGroup>
        <FGroup><FRow><FInput label="Monto ($)" type="number" value={evalForm.amount} onChange={se('amount')} placeholder="140"/><FInput label="Fecha" type="date" value={evalForm.purchase_date} onChange={se('purchase_date')}/></FRow></FGroup>
        <FGroup><FSelect label="Estado" value={evalForm.status} onChange={se('status')} options={EVAL_STATUS_OPTS}/></FGroup>
        <FGroup><FInput label="Notas" value={evalForm.notes} onChange={se('notes')} placeholder="opcional"/></FGroup>
      </Modal>

      {/* Payout Modal */}
      <Modal open={payOpen} onClose={()=>setPayOpen(false)} title={payEdit?'Editar Payout':'Registrar Payout'} footer={<><Btn variant="ghost" onClick={()=>setPayOpen(false)}>Cancelar</Btn><Btn onClick={savePay}>Guardar</Btn></>}>
        <FGroup><FRow><FSelect label="Firma" value={payForm.firm_id} onChange={sp('firm_id')} options={firmOpts}/><FSelect label="Cuenta" value={payForm.account_id} onChange={sp('account_id')} options={payAccOpts}/></FRow></FGroup>
        <FGroup><FRow><FInput label="Monto ($)" type="number" value={payForm.amount} onChange={sp('amount')} placeholder="500"/><FSelect label="Estado" value={payForm.status} onChange={sp('status')} options={PAY_STATUS_OPTS}/></FRow></FGroup>
        <FGroup><FRow><FInput label="Fecha solicitud" type="date" value={payForm.requested_at} onChange={sp('requested_at')}/><FInput label="Fecha pago" type="date" value={payForm.paid_at} onChange={sp('paid_at')}/></FRow></FGroup>
        <FGroup><FInput label="Notas" value={payForm.notes} onChange={sp('notes')} placeholder="opcional"/></FGroup>
      </Modal>
    </div>
  )
}
