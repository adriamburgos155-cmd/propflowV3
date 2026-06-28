"use client"
import { useState } from "react"
import { Btn, Badge, Modal, FGroup, FRow, FInput, FSelect, Empty, ProgressBar, fmtUSD, pnlColor } from "@/components/ui"
import { fmtDate } from "@/lib/utils"
import type { Account, Firm } from "@/lib/types"

const TYPE_OPTS   = [{value:'evaluation',label:'Evaluation'},{value:'pa',label:'PA (Fondeada)'},{value:'live',label:'Live'}]
const STATUS_OPTS = [{value:'active',label:'Activa'},{value:'suspended',label:'Suspendida'},{value:'closed',label:'Cerrada'},{value:'passed',label:'Pasada'}]
const SIZE_OPTS   = [{value:'25000',label:'$25K'},{value:'50000',label:'$50K'},{value:'100000',label:'$100K'},{value:'150000',label:'$150K'},{value:'200000',label:'$200K'}]

const E0 = {
  firm_id:'', name:'', size:'50000', type:'evaluation', status:'active',
  purchase_date:'', activation_date:'', initial_balance:'', current_balance:'',
  max_drawdown:'', remaining_dd:'', daily_loss_limit:'', consistency_limit:'', notes:''
}

function AccountCard({ a, firms, onEdit, onDelete }: { a:Account; firms:Firm[]; onEdit:(a:Account)=>void; onDelete:(id:number)=>void }) {
  const firm   = firms.find(f => f.id === a.firm_id)
  const ddUsed = a.max_drawdown > 0 ? ((a.max_drawdown - a.remaining_dd) / a.max_drawdown) * 100 : 0
  const ddColor = ddUsed > 80 ? '#EF4444' : ddUsed > 50 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'
  const typeColor: Record<string,string> = { pa:'#10B981', evaluation:'rgba(255,255,255,0.5)', live:'#fff' }
  const statusBadge: Record<string,any> = { active:'white', suspended:'red', closed:'red', passed:'green' }

  return (
    <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:18, display:'flex', flexDirection:'column', transition:'border-color 0.15s' }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700 }}>
            {firm?.name || '—'}
          </div>
          <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginTop:2 }}>
            ${(a.size/1000).toFixed(0)}K {a.name ? `· ${a.name}` : ''}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <Badge variant={statusBadge[a.status]||'white'}>{a.type.toUpperCase()}</Badge>
          <span style={{ fontSize:10, color: a.status==='active'?'rgba(255,255,255,0.4)':a.status==='passed'?'#10B981':'#EF4444' }}>
            {a.status}
          </span>
        </div>
      </div>

      {/* Balance */}
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:22, fontWeight:700, color: pnlColor(a.pnl_total), lineHeight:1, marginBottom:3 }}>
        {fmtUSD(a.current_balance || a.initial_balance || a.size)}
      </div>
      <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginBottom:12, fontFamily:"'JetBrains Mono',monospace" }}>
        PnL: {a.pnl_total >= 0 ? '+' : ''}{fmtUSD(a.pnl_total)} · Inicial: {fmtUSD(a.initial_balance || a.size)}
      </div>

      {/* Drawdown */}
      {a.max_drawdown > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.08em' }}>DD usado</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color: ddColor }}>
              {ddUsed.toFixed(0)}% · resta {fmtUSD(a.remaining_dd)}
            </span>
          </div>
          <ProgressBar value={ddUsed} max={100} color={ddColor}/>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:14 }}>
        {[
          { l:'Trades',    v: a.trade_count||'—' },
          { l:'Win Rate',  v: a.win_rate ? a.win_rate.toFixed(1)+'%' : '—' },
          { l:'PF',        v: a.profit_factor ? a.profit_factor.toFixed(2) : '—' },
          ...(a.consistency_limit>0 ? [{ l:'Máx/día', v:fmtUSD(a.consistency_limit) }] : []),
        ].map(({l,v}) => (
          <div key={l}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{l}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginTop:1 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:6, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.05)', marginTop:'auto' }}>
        <Btn variant="ghost" size="sm" onClick={()=>onEdit(a)}>✎ Editar</Btn>
        <Btn variant="danger" size="sm" onClick={()=>confirm('¿Eliminar cuenta?')&&onDelete(a.id)}>✕</Btn>
      </div>
    </div>
  )
}

interface Props {
  firms: Firm[]; accounts: Account[]
  onAdd: (a:any)=>Promise<any>; onUpdate: (id:number,a:any)=>Promise<void>; onDelete: (id:number)=>Promise<void>
  showToast: (m:string, t?:'success'|'error')=>void
}

export default function CuentasView({ firms, accounts, onAdd, onUpdate, onDelete, showToast }: Props) {
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Account|null>(null)
  const [form, setForm]       = useState<any>(E0)
  const [saving, setSaving]   = useState(false)

  const firmOpts = firms.map(f => ({ value:String(f.id), label:f.name }))
  const s = (k:string) => (e:any) => setForm((p:any) => ({...p,[k]:e.target.value}))

  const openAdd = () => {
    setEditing(null)
    setForm({...E0, firm_id: firms[0]?.id?.toString()||''})
    setOpen(true)
  }
  const openEdit = (a: Account) => {
    setEditing(a)
    setForm({
      firm_id: String(a.firm_id), name: a.name||'', size: String(a.size),
      type: a.type, status: a.status,
      purchase_date: a.purchase_date||'', activation_date: a.activation_date||'',
      initial_balance: String(a.initial_balance||''), current_balance: String(a.current_balance||''),
      max_drawdown: String(a.max_drawdown||''), remaining_dd: String(a.remaining_dd||''),
      daily_loss_limit: String(a.daily_loss_limit||''), consistency_limit: String(a.consistency_limit||''),
      notes: a.notes||''
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.firm_id) { showToast('Selecciona una firma','error'); return }
    setSaving(true)
    try {
      const payload = {
        firm_id: parseInt(form.firm_id), name: form.name, size: parseInt(form.size),
        type: form.type, status: form.status,
        purchase_date: form.purchase_date||null, activation_date: form.activation_date||null,
        initial_balance: parseFloat(form.initial_balance)||0,
        current_balance: parseFloat(form.current_balance)||parseFloat(form.initial_balance)||parseInt(form.size),
        max_drawdown: parseFloat(form.max_drawdown)||0, remaining_dd: parseFloat(form.remaining_dd)||0,
        daily_loss_limit: parseFloat(form.daily_loss_limit)||0,
        consistency_limit: parseFloat(form.consistency_limit)||0,
        notes: form.notes,
      }
      if (editing) { await onUpdate(editing.id, payload); showToast('Cuenta actualizada') }
      else         { await onAdd(payload);                 showToast('Cuenta agregada')    }
      setOpen(false)
    } catch(e:any) { showToast(e.message||'Error al guardar','error') }
    setSaving(false)
  }

  const pa      = accounts.filter(a => a.type==='pa')
  const evals   = accounts.filter(a => a.type==='evaluation')
  const closed  = accounts.filter(a => a.status==='closed'||a.status==='suspended')

  const Group = ({ title, items, color }: { title:string; items:Account[]; color:string }) => {
    if (!items.length) return null
    return (
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ width:2, height:14, borderRadius:99, background:color }}/>
          <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)' }}>{title}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'rgba(255,255,255,0.2)' }}>({items.length})</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
          {items.map(a => <AccountCard key={a.id} a={a} firms={firms} onEdit={openEdit} onDelete={onDelete}/>)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>Cuentas</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
            {accounts.length} cuenta{accounts.length!==1?'s':''} registrada{accounts.length!==1?'s':''}
          </div>
        </div>
        <Btn onClick={openAdd} disabled={firms.length===0}>+ Nueva cuenta</Btn>
      </div>

      {firms.length===0 && (
        <div style={{ background:'#0A0A0A', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:28, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
          Primero agrega una firma en <strong style={{color:'rgba(255,255,255,0.6)'}}>Finanzas</strong> para poder crear cuentas.
        </div>
      )}

      {accounts.length===0 && firms.length>0 && (
        <Empty title="Sin cuentas" sub="Agrega tu primera cuenta de prop firm."/>
      )}

      <Group title="PA Activas"    items={pa}    color="#10B981"/>
      <Group title="En Evaluación" items={evals}  color="rgba(255,255,255,0.35)"/>
      <Group title="Cerradas"      items={closed} color="#EF4444"/>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing?'Editar Cuenta':'Nueva Cuenta'}
        footer={<><Btn variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Btn><Btn onClick={save} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn></>}>
        <FGroup>
          <FRow>
            <FSelect label="Firma"  value={form.firm_id} onChange={s('firm_id')} options={firmOpts}/>
            <FSelect label="Tamaño" value={form.size}    onChange={s('size')}    options={SIZE_OPTS}/>
          </FRow>
        </FGroup>
        <FGroup>
          <FRow>
            <FSelect label="Tipo"   value={form.type}   onChange={s('type')}   options={TYPE_OPTS}/>
            <FSelect label="Estado" value={form.status} onChange={s('status')} options={STATUS_OPTS}/>
          </FRow>
        </FGroup>
        <FGroup>
          <FInput label="Nombre / alias (opcional)" value={form.name} onChange={s('name')} placeholder="ej: Cuenta principal NQ"/>
        </FGroup>
        <FGroup>
          <FRow>
            <FInput label="Fecha compra"     type="date" value={form.purchase_date}   onChange={s('purchase_date')}/>
            <FInput label="Fecha activación" type="date" value={form.activation_date} onChange={s('activation_date')}/>
          </FRow>
        </FGroup>
        <FGroup>
          <FRow>
            <FInput label="Balance inicial ($)"  type="number" value={form.initial_balance}  onChange={s('initial_balance')}  placeholder="50000"/>
            <FInput label="Balance actual ($)"   type="number" value={form.current_balance}  onChange={s('current_balance')}  placeholder="50000"/>
          </FRow>
        </FGroup>
        <FGroup>
          <FRow>
            <FInput label="Max drawdown ($)"      type="number" value={form.max_drawdown} onChange={s('max_drawdown')} placeholder="2500"/>
            <FInput label="Drawdown restante ($)" type="number" value={form.remaining_dd} onChange={s('remaining_dd')} placeholder="2500"/>
          </FRow>
        </FGroup>
        {form.type==='evaluation' && (
          <FGroup>
            <FInput label="Límite diario consistencia ($)" type="number" value={form.consistency_limit} onChange={s('consistency_limit')} placeholder="ej: 1500" hint="Máx ganancia/día para pasar el challenge"/>
          </FGroup>
        )}
        <FGroup>
          <FInput label="Notas" value={form.notes} onChange={s('notes')} placeholder="opcional"/>
        </FGroup>
      </Modal>
    </div>
  )
}
