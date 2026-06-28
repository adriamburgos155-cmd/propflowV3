"use client"
import { useState } from "react"
import { useAuth }     from "@/hooks/useAuth"
import { useData }     from "@/hooks/useData"
import { useToast }    from "@/hooks/useToast"
import AuthScreen      from "@/components/AuthScreen"
import Sidebar         from "@/components/Sidebar"
import DashboardView   from "@/components/DashboardView"
import CuentasView     from "@/components/CuentasView"
import TradesView      from "@/components/TradesView"
import FinanzasView    from "@/components/FinanzasView"
import ConsejeroView   from "@/components/ConsejeroView"
import { Toast }       from "@/components/ui"

const TITLES: Record<string,string> = { dashboard:'Dashboard', cuentas:'Cuentas', trades:'Trades', finanzas:'Finanzas', consejero:'Consejero IA' }

function Loader({ text }: { text:string }) {
  return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, fontWeight:700, color:'#fff', marginBottom:10 }}>PropFlow</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(255,255,255,0.3)', justifyContent:'center' }}>
          <div style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.1)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          {text}
        </div>
      </div>
    </div>
  )
}

export default function AppShell() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const data  = useData(user?.id)
  const { toast, showToast } = useToast()
  const [view, setView] = useState('dashboard')

  if (authLoading)      return <Loader text="Verificando sesión..."/>
  if (!user)            return <AuthScreen onSignIn={signIn} onSignUp={signUp}/>
  if (!data.loaded)     return <Loader text="Cargando portafolio..."/>

  return (
    <>
      <div style={{ display:'flex', minHeight:'100vh', background:'#000' }}>
        <Sidebar
          view={view} setView={setView}
          user={user} onSignOut={signOut}
          accounts={data.accounts} trades={data.trades}
          evaluations={data.evaluations} payouts={data.payouts}
        />

        <div style={{ marginLeft:220, flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {/* Topbar */}
          <header style={{ height:52, borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', background:'#000', position:'sticky', top:0, zIndex:50 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)' }}>{TITLES[view]}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, padding:'4px 10px' }}>
              {new Date().toLocaleDateString('es-DO',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}
            </div>
          </header>

          <main style={{ padding:'24px 28px', flex:1, overflow:'auto' }}>
            {view==='dashboard' && (
              <DashboardView
                firms={data.firms} accounts={data.accounts}
                trades={data.trades} evaluations={data.evaluations} payouts={data.payouts}
              />
            )}
            {view==='cuentas' && (
              <CuentasView
                firms={data.firms} accounts={data.accounts}
                onAdd={data.addAccount} onUpdate={data.updateAccount} onDelete={data.deleteAccount}
                showToast={showToast}
              />
            )}
            {view==='trades' && (
              <TradesView
                trades={data.trades} accounts={data.accounts} firms={data.firms}
                onAdd={data.addTrade} onDelete={data.deleteTrade} onImport={data.importTrades}
                showToast={showToast}
              />
            )}
            {view==='finanzas' && (
              <FinanzasView
                firms={data.firms} accounts={data.accounts}
                evaluations={data.evaluations} payouts={data.payouts}
                onAddFirm={data.addFirm} onDeleteFirm={data.deleteFirm}
                onAddEval={data.addEvaluation} onUpdateEval={data.updateEvaluation}
                onAddPayout={data.addPayout} onUpdatePayout={data.updatePayout}
                showToast={showToast}
              />
            )}
            {view==='consejero' && (
              <ConsejeroView
                firms={data.firms} accounts={data.accounts}
                trades={data.trades} evaluations={data.evaluations} payouts={data.payouts}
              />
            )}
          </main>
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} visible={toast.visible}/>
    </>
  )
}
