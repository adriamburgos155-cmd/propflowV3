"use client"
import { useState } from "react"
interface Props { onSignIn:(e:string,p:string)=>Promise<void>; onSignUp:(e:string,p:string)=>Promise<void> }
function tr(msg:string){
  if(msg.includes("Invalid login")) return "Email o contraseña incorrectos."
  if(msg.includes("Email not confirmed")) return "Confirma tu email antes de entrar."
  if(msg.includes("already registered")) return "Este email ya tiene una cuenta."
  if(msg.includes("Password should")) return "La contraseña debe tener al menos 6 caracteres."
  return msg
}
const inp:React.CSSProperties={width:"100%",background:"#111",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#fff",outline:"none",boxSizing:"border-box"}
export default function AuthScreen({onSignIn,onSignUp}:Props){
  const[mode,setMode]=useState<"login"|"signup">("login")
  const[email,setEmail]=useState("")
  const[pass,setPass]=useState("")
  const[err,setErr]=useState("")
  const[loading,setLoading]=useState(false)
  const[done,setDone]=useState(false)
  const handle=async(e:React.FormEvent)=>{
    e.preventDefault();setErr("");setLoading(true)
    try{ if(mode==="login") await onSignIn(email,pass); else{await onSignUp(email,pass);setDone(true)} }
    catch(e:any){setErr(tr(e.message))}
    setLoading(false)
  }
  if(done) return(
    <Shell>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>✉️</div>
        <div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:8}}>Revisa tu correo</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>Link enviado a<br/><span style={{color:"#fff",fontFamily:"monospace"}}>{email}</span></div>
        <button onClick={()=>{setDone(false);setMode("login")}} style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,0.4)",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"7px 16px",cursor:"pointer"}}>Volver al login</button>
      </div>
    </Shell>
  )
  return(
    <Shell>
      <div style={{display:"flex",background:"#111",borderRadius:8,padding:3,marginBottom:22,border:"1px solid rgba(255,255,255,0.07)"}}>
        {(["login","signup"]as const).map(m=>(
          <button key={m} onClick={()=>{setMode(m);setErr("")}} style={{flex:1,padding:"7px 0",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",transition:"all 0.15s",background:mode===m?"#1a1a1a":"transparent",color:mode===m?"#fff":"rgba(255,255,255,0.3)"}}>
            {m==="login"?"Iniciar sesión":"Crear cuenta"}
          </button>
        ))}
      </div>
      <form onSubmit={handle} style={{display:"flex",flexDirection:"column",gap:14}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Email</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" required style={inp} onFocus={e=>e.target.style.borderColor="rgba(255,255,255,0.25)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",marginBottom:5}}>Contraseña</div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder={mode==="signup"?"Mínimo 6 caracteres":"••••••••"} required minLength={6} style={inp} onFocus={e=>e.target.style.borderColor="rgba(255,255,255,0.25)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
        </div>
        {err&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#EF4444"}}>{err}</div>}
        <button type="submit" disabled={loading} style={{background:"#fff",color:"#000",border:"none",borderRadius:8,padding:"11px 0",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.5:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:2}}>
          {loading&&<span style={{width:13,height:13,border:"2px solid rgba(0,0,0,0.2)",borderTopColor:"#000",borderRadius:"50%",animation:"spin 0.8s linear infinite",display:"inline-block"}}/>}
          {loading?(mode==="login"?"Entrando...":"Creando cuenta..."):mode==="login"?"Entrar a PropFlow":"Crear mi cuenta"}
        </button>
      </form>
      {mode==="signup"&&<p style={{fontSize:11,color:"rgba(255,255,255,0.2)",textAlign:"center",marginTop:14,lineHeight:1.6}}>Tus datos son privados. Solo tú puedes verlos.</p>}
    </Shell>
  )
}
function Shell({children}:{children:React.ReactNode}){
  return(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:"#fff",letterSpacing:"-0.5px"}}>PropFlow</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.2)",letterSpacing:"0.2em",textTransform:"uppercase",marginTop:4}}>Prop Firm Manager</div>
        </div>
        <div style={{background:"#0A0A0A",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:26}}>{children}</div>
      </div>
    </div>
  )
}
