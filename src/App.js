/* eslint-disable */
import { useState, useRef, useEffect, createContext, useContext } from "react";

/* ════════════════════════════════════════════════════════════════
   MELHORIA 1 — CONTROLE DE USUÁRIOS E PERMISSÕES
   MELHORIA 3 — AUTENTICAÇÃO EM DOIS FATORES (2FA)
   MELHORIA 4 — ESTRUTURA MULTIEMPRESA
   ════════════════════════════════════════════════════════════════ */
const PERFIS={
  Administrador:{cor:"#c9a84c",icon:"👑",desc:"Acesso total",mod:{ia:["ver"],lanc:["ver","criar","editar","excluir"],pagar:["ver","criar","editar","excluir","baixar"],receber:["ver","criar","editar","excluir","baixar"],concil:["ver","executar"],rel:["ver","exportar"],cad:["ver","criar","editar","excluir"],usuarios:["ver","criar","editar","excluir"],empresas:["ver","criar","editar"]}},
  Financeiro:   {cor:"#2dd4a0",icon:"💰",desc:"CP, CR e fluxo",mod:{ia:["ver"],lanc:["ver","criar","editar"],pagar:["ver","criar","editar","baixar"],receber:["ver","criar","editar","baixar"],concil:["ver","executar"],rel:["ver","exportar"],cad:[],usuarios:[],empresas:["ver"]}},
  Comercial:    {cor:"#5b8def",icon:"🤝",desc:"Clientes e recebíveis",mod:{ia:["ver"],lanc:["ver"],pagar:[],receber:["ver","criar","editar"],concil:[],rel:["ver"],cad:["ver"],usuarios:[],empresas:["ver"]}},
  Compras:      {cor:"#f0a843",icon:"🛒",desc:"Fornecedores e CP",mod:{ia:["ver"],lanc:["ver"],pagar:["ver","criar","editar"],receber:[],concil:[],rel:["ver"],cad:["ver","criar","editar"],usuarios:[],empresas:["ver"]}},
  Gestor:       {cor:"#9b6dff",icon:"📊",desc:"Relatórios",mod:{ia:["ver"],lanc:["ver"],pagar:["ver"],receber:["ver"],concil:["ver"],rel:["ver","exportar"],cad:["ver"],usuarios:["ver"],empresas:["ver"]}},
  Auditor:      {cor:"#fb7185",icon:"🔍",desc:"Somente consulta",mod:{ia:["ver"],lanc:["ver"],pagar:["ver"],receber:["ver"],concil:["ver"],rel:["ver","exportar"],cad:["ver"],usuarios:["ver"],empresas:["ver"]}},
  Desenvolvedor:{cor:"#e05252",icon:"⚙",desc:"Acesso total + config",mod:{ia:["ver"],lanc:["ver","criar","editar","excluir"],pagar:["ver","criar","editar","excluir","baixar"],receber:["ver","criar","editar","excluir","baixar"],concil:["ver","executar"],rel:["ver","exportar"],cad:["ver","criar","editar","excluir"],usuarios:["ver","criar","editar","excluir"],empresas:["ver","criar","editar","excluir"]}},
};
const pode=(u,mod,acao)=>{if(!u)return false;return(PERFIS[u.perfil]?.mod[mod]||[]).includes(acao);};
const PLANOS={basico:{nome:"Básico",preco:149,maxUsers:3,cor:"#8b9ab8"},pro:{nome:"Pro",preco:349,maxUsers:10,cor:"#c9a84c"},empresarial:{nome:"Empresarial",preco:749,maxUsers:999,cor:"#2dd4a0"}};
const EMPRESAS_INIT=[
  {id:"e1",nome:"Áureo Indústria Ltda",cnpj:"12.345.678/0001-99",plano:"pro",ativa:true,logo:"AI",cor:"#c9a84c"},
  {id:"e2",nome:"Beta Comércio S.A.",cnpj:"98.765.432/0001-11",plano:"basico",ativa:true,logo:"BC",cor:"#5b8def"},
  {id:"e3",nome:"Gamma Tech ME",cnpj:"11.222.333/0001-44",plano:"empresarial",ativa:true,logo:"GT",cor:"#2dd4a0"},
];
const USUARIOS_INIT=[
  {id:"u1",empresaId:"e1",nome:"Lucas Rossi",email:"admin@aureo.com",senha:"admin123",perfil:"Administrador",status:"ativo",avatar:"LR",tf2Ativo:false,tf2Tipo:null,acesso:"2026-06-01 09:14"},
  {id:"u2",empresaId:"e1",nome:"Carlos Financeiro",email:"carlos@aureo.com",senha:"fin123",perfil:"Financeiro",status:"ativo",avatar:"CF",tf2Ativo:true,tf2Tipo:"email",acesso:"2026-05-31 15:22"},
  {id:"u3",empresaId:"e1",nome:"Ana Comercial",email:"ana@aureo.com",senha:"com123",perfil:"Comercial",status:"ativo",avatar:"AC",tf2Ativo:true,tf2Tipo:"totp",acesso:"2026-05-30 11:05"},
  {id:"u4",empresaId:"e2",nome:"Admin Beta",email:"admin@beta.com",senha:"beta123",perfil:"Administrador",status:"ativo",avatar:"AB",tf2Ativo:false,tf2Tipo:null,acesso:"2026-05-29 08:30"},
  {id:"u5",empresaId:"e3",nome:"Dev Gamma",email:"dev@gamma.com",senha:"dev123",perfil:"Desenvolvedor",status:"ativo",avatar:"DG",tf2Ativo:true,tf2Tipo:"totp",acesso:"2026-06-01 07:50"},
];
const AuthCtx=createContext(null);
const useAuth=()=>useContext(AuthCtx);

/* ── Tela de Login (Melhorias 1, 2, 3, 4) ── */
function TelaLogin({onLogin,usuarios,empresas}){
  const [fase,setFase]=useState("login");
  const [email,setEmail]=useState("");
  const [senha,setSenha]=useState("");
  const [vis,setVis]=useState(false);
  const [erro,setErro]=useState("");
  const [load,setLoad]=useState(false);
  const [userTemp,setUserTemp]=useState(null);
  const [codigo2fa,setCodigo2fa]=useState("");
  const [tentativas,setTentativas]=useState(0);
  const [bloqueado,setBloqueado]=useState(false);
  const [codigoEmail,setCodigoEmail]=useState("");
  const [empresasUser,setEmpresasUser]=useState([]);

  const gerarCodEmail=()=>{const c=String(Math.floor(100000+Math.random()*900000));setCodigoEmail(c);};

  const entrar=()=>{
    setErro("");
    if(!email||!senha){setErro("Preencha e-mail e senha.");return;}
    if(bloqueado){setErro("Conta bloqueada. Aguarde 15 minutos.");return;}
    setLoad(true);
    setTimeout(()=>{
      const u=usuarios.find(x=>x.email.toLowerCase()===email.toLowerCase()&&x.senha===senha);
      if(!u){const nt=tentativas+1;setTentativas(nt);if(nt>=5){setBloqueado(true);setErro("Conta bloqueada após 5 tentativas.");}else setErro(`E-mail ou senha incorretos. ${5-nt} tentativa(s) restante(s).`);setLoad(false);return;}
      if(u.status!=="ativo"){setErro("Usuário inativo.");setLoad(false);return;}
      setTentativas(0);setUserTemp(u);
      const emps=empresas.filter(e=>e.id===u.empresaId);
      if(u.tf2Ativo){if(u.tf2Tipo==="totp"){setFase("2fa_totp");}else{gerarCodEmail();setFase("2fa_email");}}
      else if(emps.length>1){setEmpresasUser(emps);setFase("escolher");}
      else{onLogin(u,empresas.find(e=>e.id===u.empresaId));}
      setLoad(false);
    },600);
  };

  const verificar2fa=()=>{
    setErro("");
    if(!codigo2fa||codigo2fa.length!==6){setErro("Digite 6 dígitos.");return;}
    setLoad(true);
    setTimeout(()=>{
      const ok=userTemp.tf2Tipo==="totp"?/^\d{6}$/.test(codigo2fa):codigo2fa===codigoEmail;
      if(!ok){setErro("Código incorreto.");setLoad(false);return;}
      onLogin(userTemp,empresas.find(e=>e.id===userTemp.empresaId));
      setLoad(false);
    },500);
  };

  const iStyle={width:"100%",background:"#0d1018",border:"1px solid #1e2840",borderRadius:10,padding:"11px 14px",color:"#eae6dc",fontSize:13,outline:"none",fontFamily:"Outfit",boxSizing:"border-box"};
  const btnP={width:"100%",padding:"13px",borderRadius:11,border:"none",background:GRAD,color:"#04050a",fontSize:14,fontWeight:800,cursor:load||bloqueado?"not-allowed":"pointer",opacity:load||bloqueado?.65:1,fontFamily:"Outfit",boxShadow:"0 4px 20px #c9a84c28"};

  return(
    <div style={{minHeight:"100vh",background:"#04050a",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Outfit,sans-serif",overflow:"hidden",position:"relative"}}>
      <style>{`@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.lgA{animation:fadeUp .38s ease both}`}</style>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 25% 50%,#c9a84c08,transparent 55%),radial-gradient(ellipse at 80% 20%,#9b6dff06,transparent 50%)",pointerEvents:"none"}}/>
      <div style={{width:430,zIndex:1}} className="lgA">
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{width:58,height:58,borderRadius:16,background:"linear-gradient(135deg,#8b6914,#c9a84c,#e2c97e)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:25,fontWeight:900,boxShadow:"0 8px 28px #c9a84c28",marginBottom:13}}>$</div>
          <div style={{fontSize:24,fontWeight:700,fontFamily:"Playfair Display",background:"linear-gradient(90deg,#c9a84c,#e2c97e,#c9a84c)",backgroundSize:"200%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 2.5s linear infinite"}}>Áureo ERP</div>
          <div style={{fontSize:10,color:"#4a5568",letterSpacing:1.2,textTransform:"uppercase",marginTop:3}}>Financial Suite · Acesso Seguro</div>
        </div>
        <div style={{background:"#111520",border:"1px solid #c9a84c30",borderRadius:20,padding:30,boxShadow:"0 40px 80px #000b"}}>

          {fase==="login"&&<>
            <div style={{fontSize:14,color:"#f0e4c4",fontWeight:600,marginBottom:3,fontFamily:"Playfair Display"}}>Bem-vindo de volta</div>
            <div style={{fontSize:11,color:"#4a5568",marginBottom:22}}>Acesso seguro ao sistema financeiro</div>
            <div style={{marginBottom:13}}>
              <div style={{fontSize:9,color:"#8b9ab8",marginBottom:4,textTransform:"uppercase",letterSpacing:.8}}>E-mail</div>
              <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrar()} placeholder="seu@email.com" style={{...iStyle,border:`1px solid ${erro?"#e05252":"#1e2840"}`}}/>
            </div>
            <div style={{marginBottom:erro?10:16}}>
              <div style={{fontSize:9,color:"#8b9ab8",marginBottom:4,textTransform:"uppercase",letterSpacing:.8}}>Senha</div>
              <div style={{position:"relative"}}>
                <input value={senha} onChange={e=>setSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&entrar()} type={vis?"text":"password"} placeholder="••••••••" style={{...iStyle,paddingRight:42,border:`1px solid ${erro?"#e05252":"#1e2840"}`}}/>
                <button onClick={()=>setVis(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#4a5568",cursor:"pointer",fontSize:13}}>{vis?"🙈":"👁"}</button>
              </div>
            </div>
            {erro&&<div style={{background:"#e0525218",border:"1px solid #e0525235",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#e05252"}}>⚠ {erro}</div>}
            <button onClick={entrar} disabled={load||bloqueado} style={btnP}>{load?"Verificando...":"✦ Entrar no Sistema"}</button>
            <div style={{marginTop:18,padding:13,background:"#0d1018",borderRadius:10,border:"1px solid #1e2840"}}>
              <div style={{fontSize:9,color:"#4a5568",textTransform:"uppercase",letterSpacing:.8,marginBottom:8}}>Acesso rápido</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                {[["admin@aureo.com","admin123","👑 Admin — Empresa 1"],["carlos@aureo.com","fin123","💰 Financeiro — 2FA Email"],["ana@aureo.com","com123","🤝 Comercial — 2FA TOTP"],["admin@beta.com","beta123","🏢 Admin — Empresa 2"]].map(([e,s,l])=>(
                  <button key={e} onClick={()=>{setEmail(e);setSenha(s);setErro("");}} style={{background:"#161c2a",border:"1px solid #1e2840",borderRadius:7,padding:"7px 9px",cursor:"pointer",textAlign:"left"}}>
                    <div style={{fontSize:10,color:"#e2c97e",fontWeight:700}}>{l}</div>
                    <div style={{fontSize:8,color:"#4a5568",marginTop:1,fontFamily:"DM Mono"}}>{e}</div>
                  </button>
                ))}
              </div>
            </div>
          </>}

          {fase==="2fa_totp"&&<>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:34,marginBottom:9}}>📱</div>
              <div style={{fontSize:14,color:"#f0e4c4",fontWeight:600,fontFamily:"Playfair Display",marginBottom:3}}>Verificação em 2 Fatores</div>
              <div style={{fontSize:11,color:"#4a5568"}}>Abra o <strong style={{color:"#e2c97e"}}>Google</strong> ou <strong style={{color:"#e2c97e"}}>Microsoft Authenticator</strong><br/>e informe o código de 6 dígitos.</div>
            </div>
            <div style={{background:"#0d1018",border:"1px solid #1e2840",borderRadius:11,padding:18,marginBottom:14}}>
              <div style={{fontSize:9,color:"#8b9ab8",marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>Código do Autenticador (TOTP)</div>
              <input value={codigo2fa} onChange={e=>setCodigo2fa(e.target.value.replace(/\D/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&verificar2fa()} placeholder="000000" maxLength={6} style={{width:"100%",background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono",fontSize:30,color:"#c9a84c",letterSpacing:9,textAlign:"center"}}/>
              <div style={{height:2,background:"#1e2840",borderRadius:1,marginTop:7}}><div style={{height:"100%",width:`${(codigo2fa.length/6)*100}%`,background:GRAD,borderRadius:1,transition:"width .15s"}}/></div>
            </div>
            <div style={{background:"#9b6dff18",border:"1px solid #9b6dff35",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:10,color:"#9b6dff",textAlign:"center"}}>🧪 Demo: qualquer 6 dígitos funciona</div>
            {erro&&<div style={{background:"#e0525218",border:"1px solid #e0525235",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#e05252"}}>⚠ {erro}</div>}
            <button onClick={verificar2fa} disabled={load||codigo2fa.length!==6} style={{...btnP,opacity:load||codigo2fa.length!==6?.4:1}}>{load?"Verificando...":"✔ Confirmar"}</button>
            <div style={{textAlign:"center",marginTop:10}}><button onClick={()=>{setFase("login");setCodigo2fa("");setErro("");}} style={{background:"none",border:"none",color:"#8b9ab8",cursor:"pointer",fontSize:10}}>← Voltar</button></div>
          </>}

          {fase==="2fa_email"&&<>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:34,marginBottom:9}}>📧</div>
              <div style={{fontSize:14,color:"#f0e4c4",fontWeight:600,fontFamily:"Playfair Display",marginBottom:3}}>Código por E-mail</div>
              <div style={{fontSize:11,color:"#4a5568"}}>Código enviado para <strong style={{color:"#e2c97e"}}>{userTemp?.email}</strong></div>
            </div>
            <div style={{background:"#c9a84c18",border:"1px solid #c9a84c35",borderRadius:9,padding:"10px 14px",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:9,color:"#8b9ab8",marginBottom:4}}>🧪 Código de demonstração:</div>
              <div style={{fontFamily:"DM Mono",fontSize:26,color:"#c9a84c",letterSpacing:8,fontWeight:600}}>{codigoEmail}</div>
            </div>
            <div style={{background:"#0d1018",border:"1px solid #1e2840",borderRadius:11,padding:18,marginBottom:14}}>
              <div style={{fontSize:9,color:"#8b9ab8",marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>Digite o Código</div>
              <input value={codigo2fa} onChange={e=>setCodigo2fa(e.target.value.replace(/\D/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&verificar2fa()} placeholder="000000" maxLength={6} style={{width:"100%",background:"transparent",border:"none",outline:"none",fontFamily:"DM Mono",fontSize:30,color:"#c9a84c",letterSpacing:9,textAlign:"center"}}/>
              <div style={{height:2,background:"#1e2840",borderRadius:1,marginTop:7}}><div style={{height:"100%",width:`${(codigo2fa.length/6)*100}%`,background:GRAD,borderRadius:1,transition:"width .15s"}}/></div>
            </div>
            {erro&&<div style={{background:"#e0525218",border:"1px solid #e0525235",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#e05252"}}>⚠ {erro}</div>}
            <button onClick={verificar2fa} disabled={load||codigo2fa.length!==6} style={{...btnP,opacity:load||codigo2fa.length!==6?.4:1}}>{load?"Verificando...":"✔ Confirmar"}</button>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10}}>
              <button onClick={()=>{gerarCodEmail();setCodigo2fa("");setErro("");}} style={{background:"none",border:"none",color:"#8b9ab8",cursor:"pointer",fontSize:10}}>↺ Reenviar</button>
              <button onClick={()=>{setFase("login");setCodigo2fa("");setErro("");}} style={{background:"none",border:"none",color:"#8b9ab8",cursor:"pointer",fontSize:10}}>← Voltar</button>
            </div>
          </>}

          {fase==="escolher"&&<>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:34,marginBottom:9}}>🏢</div>
              <div style={{fontSize:14,color:"#f0e4c4",fontWeight:600,fontFamily:"Playfair Display",marginBottom:3}}>Selecionar Empresa</div>
              <div style={{fontSize:11,color:"#4a5568"}}>Você tem acesso a múltiplas empresas.</div>
            </div>
            {empresasUser.map(emp=>{
              const plano=PLANOS[emp.plano]||PLANOS.basico;
              return(<button key={emp.id} onClick={()=>onLogin(userTemp,emp)} style={{width:"100%",background:"#0d1018",border:"1px solid #1e2840",borderRadius:11,padding:"13px 15px",cursor:"pointer",marginBottom:8,textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:10,background:`${emp.cor||"#c9a84c"}20`,border:`1px solid ${emp.cor||"#c9a84c"}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Mono",fontSize:12,fontWeight:700,color:emp.cor||"#c9a84c",flexShrink:0}}>{emp.logo}</div>
                <div style={{flex:1}}><div style={{fontSize:12,color:"#eae6dc",fontWeight:600}}>{emp.nome}</div><div style={{fontSize:9,color:"#4a5568",marginTop:2,fontFamily:"DM Mono"}}>{emp.cnpj}</div></div>
                <span style={{background:`${plano.cor}18`,color:plano.cor,border:`1px solid ${plano.cor}35`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700}}>{plano.nome}</span>
              </button>);
            })}
            <button onClick={()=>{setFase("login");setErro("");}} style={{background:"none",border:"none",color:"#8b9ab8",cursor:"pointer",fontSize:10,width:"100%",textAlign:"center",marginTop:6}}>← Voltar</button>
          </>}
        </div>
      </div>
    </div>
  );
}

function Bloqueado({modulo,usuario}){
  const pd=PERFIS[usuario?.perfil];
  return(<div style={{minHeight:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:36}}><div style={{fontSize:48,opacity:.16}}>🔒</div><div style={{fontFamily:"Playfair Display",fontSize:17,color:"#f0e4c4",fontWeight:600}}>Acesso Restrito</div><div style={{fontSize:12,color:"#8b9ab8",textAlign:"center",maxWidth:320,lineHeight:1.8}}>Perfil <span style={{color:pd?.cor||"#c9a84c",fontWeight:700}}>{pd?.icon} {usuario?.perfil}</span> não tem permissão para este módulo.</div></div>);
}

const MOD_NOMES={ia:"Áureo AI",lanc:"Lançamentos",pagar:"A Pagar",receber:"A Receber",concil:"Conciliação",rel:"Relatórios",cad:"Cadastros",usuarios:"Usuários",empresas:"Empresas"};
const U0={nome:"",email:"",senha:"",perfil:"Financeiro",status:"ativo",avatar:"",tf2Ativo:false,tf2Tipo:null};

function ModUsuarios({usuarios,setUsuarios,userAtual,empresaAtual}){
  const [modal,setModal]=useState(false);
  const [editU,setEditU]=useState(null);
  const [del,setDel]=useState(null);
  const [verP,setVerP]=useState(null);
  const [filP,setFilP]=useState("todos");
  const [form,setForm]=useState(U0);
  const sf=k=>v=>setForm(p=>({...p,[k]:v}));
  const abrir=u=>{setEditU(u||null);setForm(u?{...u}:{...U0});setModal(true);};
  const fechar=()=>{setModal(false);setEditU(null);};
  const salvar=()=>{
    if(!form.nome||!form.email||!form.senha)return;
    const av=form.avatar||(form.nome.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase());
    const it={...form,avatar:av,empresaId:empresaAtual?.id};
    if(editU)setUsuarios(p=>p.map(u=>u.id===editU.id?{...it,id:editU.id}:u));
    else setUsuarios(p=>[...p,{...it,id:"u"+uid(),acesso:"Nunca"}]);
    fechar();
  };
  const excluir=()=>{setUsuarios(p=>p.filter(u=>u.id!==del.id));setDel(null);};
  const toggleSt=id=>setUsuarios(p=>p.map(u=>u.id===id?{...u,status:u.status==="ativo"?"inativo":"ativo"}:u));
  const lista=(filP==="todos"?usuarios:usuarios.filter(u=>u.perfil===filP)).filter(u=>u.empresaId===empresaAtual?.id);
  const iS={width:"100%",background:"#0d1018",border:"1px solid #1e2840",borderRadius:8,padding:"8px 11px",color:"#eae6dc",fontSize:12,outline:"none",fontFamily:"Outfit",boxSizing:"border-box"};
  const Inp=({label,value,onChange,type,opts,ph})=><div style={{marginBottom:11}}><div style={{fontSize:9,color:"#8b9ab8",marginBottom:4,textTransform:"uppercase",letterSpacing:.8}}>{label}</div>{opts?<select value={value||""} onChange={e=>onChange(e.target.value)} style={{...iS,cursor:"pointer"}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input type={type||"text"} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={ph||""} style={iS}/>}</div>;
  const G2x=({c})=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{c}</div>;

  return(<div className="anim">
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
      {[{icon:"👥",label:"Total",value:String(lista.length),sub:"na empresa",cor:"#c9a84c"},{icon:"✔",label:"Ativos",value:String(lista.filter(u=>u.status==="ativo").length),sub:"com acesso",cor:"#2dd4a0"},{icon:"🔐",label:"2FA Ativo",value:String(lista.filter(u=>u.tf2Ativo).length),sub:"usuários protegidos",cor:"#9b6dff"},{icon:"🔑",label:"Perfis",value:String(new Set(lista.map(u=>u.perfil)).size),sub:"em uso",cor:"#5b8def"}].map((k,i)=>(
        <div key={i} className="anim" style={{animationDelay:`${i*.06}s`,background:"#111520",border:"1px solid #1e2840",borderTop:`2px solid ${k.cor}`,borderRadius:12,padding:"15px 13px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,right:0,width:46,height:46,background:`radial-gradient(circle at top right,${k.cor}12,transparent 70%)`}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:9,color:"#8b9ab8",textTransform:"uppercase",letterSpacing:1}}>{k.label}</span><span style={{fontSize:14,color:k.cor}}>{k.icon}</span></div>
          <div style={{fontFamily:"DM Mono",fontSize:21,color:"#eae6dc",marginBottom:3,fontWeight:500}}>{k.value}</div>
          <div style={{fontSize:9,color:"#4a5568"}}>{k.sub}</div>
        </div>
      ))}
    </div>
    <div style={{background:"#111520",border:"1px solid #1e2840",borderRadius:14,overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"12px 17px",borderBottom:"1px solid #1e2840",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,background:"linear-gradient(90deg,#111520,#0d1018)"}}>
        <div><div style={{fontFamily:"Playfair Display",fontSize:13,color:"#f0e4c4",fontWeight:600}}>👥 Usuários — {empresaAtual?.nome}</div><div style={{fontSize:9,color:"#8b9ab8",marginTop:1}}>Perfis · 2FA · Status · Permissões</div></div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",gap:4}}>{["todos",...Object.keys(PERFIS).slice(0,4)].map(p=><button key={p} onClick={()=>setFilP(p)} style={{padding:"4px 9px",borderRadius:7,border:`1px solid ${filP===p?"#c9a84c":"#1e2840"}`,background:filP===p?"#c9a84c18":"transparent",color:filP===p?"#c9a84c":"#4a5568",fontSize:9,cursor:"pointer",fontWeight:700}}>{p==="todos"?"Todos":p}</button>)}</div>
          {pode(userAtual,"usuarios","criar")&&<button onClick={()=>abrir(null)} style={{padding:"5px 12px",borderRadius:8,border:"none",background:GRAD,color:"#04050a",fontSize:10,fontWeight:700,cursor:"pointer"}}>✦ Novo</button>}
        </div>
      </div>
      <div style={{padding:16,overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:780}}>
          <thead><tr>{["Usuário","Perfil","E-mail","2FA","Último Acesso","Status","Ações"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 9px",fontSize:9,color:"#4a5568",textTransform:"uppercase",letterSpacing:.9,borderBottom:"1px solid #1e2840"}}>{h}</th>)}</tr></thead>
          <tbody>{lista.map((u,i)=>{const pd=PERFIS[u.perfil];const sou=u.id===userAtual?.id;return(
            <tr key={u.id} style={{background:i%2===0?"transparent":"#0d101850"}}>
              <td style={{padding:"10px 9px",borderBottom:"1px solid #1e284014"}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:7,background:`${pd?.cor||"#c9a84c"}20`,border:`1px solid ${pd?.cor||"#c9a84c"}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:pd?.cor||"#c9a84c",fontFamily:"DM Mono"}}>{u.avatar}</div><div><div style={{fontSize:11,color:"#eae6dc",fontWeight:600}}>{u.nome}</div>{sou&&<div style={{fontSize:8,color:"#c9a84c",marginTop:1}}>● Você</div>}</div></div></td>
              <td style={{padding:"10px 9px",borderBottom:"1px solid #1e284014"}}><span style={{background:`${pd?.cor||"#c9a84c"}18`,color:pd?.cor||"#c9a84c",border:`1px solid ${pd?.cor||"#c9a84c"}35`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700}}>{pd?.icon} {u.perfil}</span></td>
              <td style={{padding:"10px 9px",borderBottom:"1px solid #1e284014",fontFamily:"DM Mono",fontSize:10,color:"#8b9ab8"}}>{u.email}</td>
              <td style={{padding:"10px 9px",borderBottom:"1px solid #1e284014"}}>{u.tf2Ativo?<span style={{background:u.tf2Tipo==="totp"?"#9b6dff18":"#5b8def18",color:u.tf2Tipo==="totp"?"#9b6dff":"#5b8def",border:`1px solid ${u.tf2Tipo==="totp"?"#9b6dff35":"#5b8def35"}`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700}}>{u.tf2Tipo==="totp"?"📱 TOTP":"📧 Email"}</span>:<span style={{fontSize:9,color:"#4a5568"}}>Desativado</span>}</td>
              <td style={{padding:"10px 9px",borderBottom:"1px solid #1e284014",fontSize:10,color:"#4a5568"}}>{u.acesso}</td>
              <td style={{padding:"10px 9px",borderBottom:"1px solid #1e284014"}}><span style={{background:u.status==="ativo"?"#2dd4a018":"#e0525218",color:u.status==="ativo"?"#2dd4a0":"#e05252",border:`1px solid ${u.status==="ativo"?"#2dd4a030":"#e0525230"}`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700}}>{u.status==="ativo"?"● Ativo":"⊘ Inativo"}</span></td>
              <td style={{padding:"8px 9px",borderBottom:"1px solid #1e284014"}}><div style={{display:"flex",gap:4}}>
                <button onClick={()=>setVerP(u)} style={{background:"#c9a84c18",border:"1px solid #c9a84c35",color:"#c9a84c",borderRadius:6,padding:"4px 7px",cursor:"pointer",fontSize:11}}>🔑</button>
                {pode(userAtual,"usuarios","editar")&&!sou&&<button onClick={()=>toggleSt(u.id)} style={{background:u.status==="ativo"?"#e0525215":"#2dd4a015",border:`1px solid ${u.status==="ativo"?"#e0525235":"#2dd4a035"}`,color:u.status==="ativo"?"#e05252":"#2dd4a0",borderRadius:6,padding:"4px 7px",cursor:"pointer",fontSize:11}}>{u.status==="ativo"?"⊘":"✔"}</button>}
                {pode(userAtual,"usuarios","editar")&&<button onClick={()=>abrir(u)} style={{background:"#c9a84c15",border:"1px solid #c9a84c35",color:"#c9a84c",borderRadius:6,padding:"4px 7px",cursor:"pointer",fontSize:11}}>✎</button>}
                {pode(userAtual,"usuarios","excluir")&&!sou&&<button onClick={()=>setDel(u)} style={{background:"#e0525215",border:"1px solid #e0525235",color:"#e05252",borderRadius:6,padding:"4px 7px",cursor:"pointer",fontSize:11}}>✕</button>}
              </div></td>
            </tr>);
          })}</tbody>
        </table>
      </div>
    </div>
    <div style={{background:"#111520",border:"1px solid #1e2840",borderRadius:14,overflow:"hidden"}}>
      <div style={{padding:"12px 17px",borderBottom:"1px solid #1e2840",background:"linear-gradient(90deg,#111520,#0d1018)"}}><div style={{fontFamily:"Playfair Display",fontSize:13,color:"#f0e4c4",fontWeight:600}}>🔑 Mapa de Perfis & Permissões</div></div>
      <div style={{padding:16,overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:860}}>
        <thead><tr><th style={{textAlign:"left",padding:"7px 9px",fontSize:9,color:"#4a5568",textTransform:"uppercase",letterSpacing:.9,borderBottom:"1px solid #1e2840",minWidth:120}}>Perfil</th>{Object.entries(MOD_NOMES).map(([k,v])=><th key={k} style={{padding:"7px 6px",fontSize:9,color:"#4a5568",textTransform:"uppercase",letterSpacing:.6,borderBottom:"1px solid #1e2840",textAlign:"center"}}>{v}</th>)}</tr></thead>
        <tbody>{Object.keys(PERFIS).map((pn,i)=>{const pd=PERFIS[pn];return(<tr key={pn} style={{background:i%2===0?"transparent":"#0d101850"}}>
          <td style={{padding:"9px",borderBottom:"1px solid #1e284014"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:12}}>{pd.icon}</span><div><div style={{fontSize:10,color:pd.cor,fontWeight:700}}>{pn}</div><div style={{fontSize:8,color:"#4a5568"}}>{lista.filter(u=>u.perfil===pn).length} user(s)</div></div></div></td>
          {Object.keys(MOD_NOMES).map(m=>{const al=pd.mod[m]||[];const esc=al.some(a=>["criar","editar","excluir","baixar","exportar","executar"].includes(a));return(<td key={m} style={{padding:"9px 6px",borderBottom:"1px solid #1e284014",textAlign:"center"}}>{al.length===0?<span style={{fontSize:11,color:"#4a5568"}}>—</span>:esc?<span style={{fontSize:13,color:"#c9a84c"}} title={al.join(", ")}>✦</span>:al.includes("ver")?<span style={{fontSize:12,color:"#8b9ab8"}}>👁</span>:null}</td>);})}
        </tr>);})}
      </tbody></table></div>
    </div>
    {modal&&<div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={fechar}><div style={{background:"#161c2a",border:"1px solid #c9a84c40",borderRadius:18,padding:24,width:470,maxHeight:"86vh",overflowY:"auto",boxShadow:"0 40px 100px #000d"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontFamily:"Playfair Display",fontSize:14,color:"#f0e4c4"}}>{editU?"✎ Editar":"✦ Novo Usuário"}</div><button onClick={fechar} style={{background:"none",border:"none",color:"#4a5568",cursor:"pointer",fontSize:19}}>×</button></div>
      <G2x c={<><Inp label="Nome" value={form.nome} onChange={sf("nome")} ph="João da Silva"/><Inp label="Avatar" value={form.avatar||""} onChange={sf("avatar")} ph="JS"/></>}/>
      <Inp label="E-mail" value={form.email} onChange={sf("email")} ph="joao@empresa.com"/>
      <G2x c={<><Inp label="Senha" value={form.senha} onChange={sf("senha")} type="password" ph="Mínimo 8 chars"/><Inp label="Perfil" value={form.perfil} onChange={sf("perfil")} opts={Object.keys(PERFIS)}/></>}/>
      <G2x c={<><Inp label="Status" value={form.status} onChange={sf("status")} opts={["ativo","inativo"]}/><Inp label="2FA" value={form.tf2Tipo||"none"} onChange={v=>setForm(p=>({...p,tf2Tipo:v==="none"?null:v,tf2Ativo:v!=="none"}))} opts={["none","totp","email"]}/></>}/>
      {form.perfil&&<div style={{background:`${PERFIS[form.perfil]?.cor||"#c9a84c"}10`,border:`1px solid ${PERFIS[form.perfil]?.cor||"#c9a84c"}28`,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:10,color:PERFIS[form.perfil]?.cor}}>{PERFIS[form.perfil]?.icon} {form.perfil} — {PERFIS[form.perfil]?.desc}</div>}
      <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={fechar} style={{padding:"9px 15px",borderRadius:8,border:"1px solid #1e2840",background:"transparent",color:"#8b9ab8",cursor:"pointer",fontSize:12,fontWeight:700}}>Cancelar</button><button onClick={salvar} style={{padding:"9px 15px",borderRadius:8,border:"none",background:GRAD,color:"#04050a",cursor:"pointer",fontSize:12,fontWeight:700}}>✔ Salvar</button></div>
    </div></div>}
    {verP&&<div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={()=>setVerP(null)}><div style={{background:"#161c2a",border:"1px solid #c9a84c40",borderRadius:18,padding:24,width:540,maxHeight:"86vh",overflowY:"auto",boxShadow:"0 40px 100px #000d"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div style={{fontFamily:"Playfair Display",fontSize:14,color:"#f0e4c4"}}>🔑 Permissões — {verP.nome}</div><div style={{fontSize:9,color:"#8b9ab8",marginTop:2}}>{PERFIS[verP.perfil]?.icon} {verP.perfil} · 2FA: {verP.tf2Ativo?(verP.tf2Tipo==="totp"?"📱 TOTP":"📧 Email"):"Desativado"}</div></div><button onClick={()=>setVerP(null)} style={{background:"none",border:"none",color:"#4a5568",cursor:"pointer",fontSize:19}}>×</button></div>
      <div style={{display:"grid",gap:7}}>{Object.entries(MOD_NOMES).map(([mod,nome])=>{const al=PERFIS[verP.perfil]?.mod[mod]||[];return(<div key={mod} style={{background:"#0d1018",border:`1px solid ${al.length>0?"#1e284080":"#1e284020"}`,borderRadius:8,padding:"10px 12px",opacity:al.length===0?.4:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:al.length>0?7:0}}><div style={{fontSize:11,color:al.length>0?"#eae6dc":"#4a5568",fontWeight:600}}>{nome}</div>{al.length===0?<span style={{fontSize:9,color:"#4a5568",background:"#4a556818",borderRadius:20,padding:"2px 7px"}}>Sem acesso</span>:<span style={{fontSize:9,color:"#2dd4a0",background:"#2dd4a018",borderRadius:20,padding:"2px 7px",fontWeight:700}}>✔</span>}</div>
        {al.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{al.map(a=><span key={a} style={{background:"#c9a84c18",color:"#c9a84c",border:"1px solid #c9a84c35",borderRadius:20,padding:"2px 7px",fontSize:9,fontWeight:700}}>{a}</span>)}</div>}
      </div>);})}</div>
      <button onClick={()=>setVerP(null)} style={{marginTop:12,padding:"9px 15px",borderRadius:8,border:"1px solid #1e2840",background:"transparent",color:"#8b9ab8",cursor:"pointer",fontSize:12,fontWeight:700,width:"100%"}}>Fechar</button>
    </div></div>}
    {del&&<div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={()=>setDel(null)}><div style={{background:"#161c2a",border:"1px solid #c9a84c40",borderRadius:18,padding:24,width:350,boxShadow:"0 40px 100px #000d"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontFamily:"Playfair Display",fontSize:14,color:"#f0e4c4",marginBottom:13}}>⚠ Excluir Usuário</div>
      <div style={{background:"#0d1018",border:"1px solid #c9a84c25",borderRadius:8,padding:12,marginBottom:13}}><div style={{fontSize:11,color:"#eae6dc",fontWeight:600,marginBottom:2}}>{del.nome}</div><div style={{fontSize:9,color:"#4a5568"}}>{del.email}</div></div>
      <p style={{color:"#8b9ab8",fontSize:11,marginBottom:13,lineHeight:1.6}}>Esta ação é irreversível.</p>
      <div style={{display:"flex",gap:8}}><button onClick={()=>setDel(null)} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #1e2840",background:"transparent",color:"#8b9ab8",cursor:"pointer",fontSize:12,fontWeight:700}}>Cancelar</button><button onClick={excluir} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #e0525235",background:"#e0525215",color:"#e05252",cursor:"pointer",fontSize:12,fontWeight:700}}>✕ Excluir</button></div>
    </div></div>}
  </div>);
}

const E0={nome:"",cnpj:"",plano:"basico",cor:"#c9a84c",logo:""};
function ModEmpresas({empresas,setEmpresas,usuarios,userAtual,empresaAtual,onTrocar}){
  const [modal,setModal]=useState(false);
  const [editE,setEditE]=useState(null);
  const [del,setDel]=useState(null);
  const [form,setForm]=useState(E0);
  const sf=k=>v=>setForm(p=>({...p,[k]:v}));
  const abrir=e=>{setEditE(e||null);setForm(e?{...e}:{...E0});setModal(true);};
  const fechar=()=>{setModal(false);setEditE(null);};
  const salvar=()=>{if(!form.nome)return;const logo=form.logo||(form.nome.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase());const it={...form,logo,ativa:true};if(editE)setEmpresas(p=>p.map(e=>e.id===editE.id?{...it,id:editE.id}:e));else setEmpresas(p=>[...p,{...it,id:"e"+uid()}]);fechar();};
  const excluir=()=>{setEmpresas(p=>p.filter(e=>e.id!==del.id));setDel(null);};
  const iS={width:"100%",background:"#0d1018",border:"1px solid #1e2840",borderRadius:8,padding:"8px 11px",color:"#eae6dc",fontSize:12,outline:"none",fontFamily:"Outfit",boxSizing:"border-box"};
  const Inp=({label,value,onChange,opts,ph})=><div style={{marginBottom:11}}><div style={{fontSize:9,color:"#8b9ab8",marginBottom:4,textTransform:"uppercase",letterSpacing:.8}}>{label}</div>{opts?<select value={value||""} onChange={e=>onChange(e.target.value)} style={{...iS,cursor:"pointer"}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input value={value||""} onChange={e=>onChange(e.target.value)} placeholder={ph||""} style={iS}/>}</div>;

  return(<div className="anim">
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
      {[{icon:"🏢",label:"Total",value:String(empresas.length),sub:"no sistema",cor:"#c9a84c"},{icon:"✔",label:"Ativas",value:String(empresas.filter(e=>e.ativa).length),sub:"operando",cor:"#2dd4a0"},{icon:"🔄",label:"Ativa Agora",value:empresaAtual?.nome||"—",sub:PLANOS[empresaAtual?.plano]?.nome||"",cor:"#9b6dff"}].map((k,i)=>(
        <div key={i} className="anim" style={{animationDelay:`${i*.06}s`,background:"#111520",border:"1px solid #1e2840",borderTop:`2px solid ${k.cor}`,borderRadius:12,padding:"15px 13px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,right:0,width:46,height:46,background:`radial-gradient(circle at top right,${k.cor}12,transparent 70%)`}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:9,color:"#8b9ab8",textTransform:"uppercase",letterSpacing:1}}>{k.label}</span><span style={{fontSize:14,color:k.cor}}>{k.icon}</span></div>
          <div style={{fontFamily:k.label==="Ativa Agora"?"Outfit":"DM Mono",fontSize:k.label==="Ativa Agora"?12:21,color:"#eae6dc",marginBottom:3,fontWeight:500}}>{k.value}</div>
          <div style={{fontSize:9,color:"#4a5568"}}>{k.sub}</div>
        </div>
      ))}
    </div>
    <div style={{background:"#111520",border:"1px solid #1e2840",borderRadius:14,overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"12px 17px",borderBottom:"1px solid #1e2840",display:"flex",justifyContent:"space-between",alignItems:"center",background:"linear-gradient(90deg,#111520,#0d1018)"}}>
        <div><div style={{fontFamily:"Playfair Display",fontSize:13,color:"#f0e4c4",fontWeight:600}}>🏢 Empresas Cadastradas</div><div style={{fontSize:9,color:"#8b9ab8",marginTop:1}}>Isolamento total de dados · Troca de empresa · Planos SaaS</div></div>
        {pode(userAtual,"empresas","criar")&&<button onClick={()=>abrir(null)} style={{padding:"5px 12px",borderRadius:8,border:"none",background:GRAD,color:"#04050a",fontSize:10,fontWeight:700,cursor:"pointer"}}>✦ Nova</button>}
      </div>
      <div style={{padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:12}}>
          {empresas.map(e=>{const plano=PLANOS[e.plano]||PLANOS.basico;const isAtual=e.id===empresaAtual?.id;const totalU=usuarios.filter(u=>u.empresaId===e.id).length;return(
            <div key={e.id} style={{background:isAtual?`${e.cor||"#c9a84c"}08`:"#0d1018",border:`1px solid ${isAtual?e.cor||"#c9a84c":"#1e2840"}`,borderRadius:12,padding:16,position:"relative",transition:"border-color .15s"}}>
              {isAtual&&<div style={{position:"absolute",top:9,right:9,fontSize:9,color:e.cor||"#c9a84c",fontWeight:700,background:`${e.cor||"#c9a84c"}18`,borderRadius:20,padding:"2px 7px"}}>● Ativa</div>}
              <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:13}}>
                <div style={{width:42,height:42,borderRadius:11,background:`${e.cor||"#c9a84c"}20`,border:`1px solid ${e.cor||"#c9a84c"}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Mono",fontSize:13,fontWeight:700,color:e.cor||"#c9a84c"}}>{e.logo}</div>
                <div><div style={{fontSize:12,color:"#f0e4c4",fontWeight:600,fontFamily:"Playfair Display"}}>{e.nome}</div><div style={{fontSize:9,color:"#4a5568",marginTop:2,fontFamily:"DM Mono"}}>{e.cnpj}</div></div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{background:`${plano.cor}18`,color:plano.cor,border:`1px solid ${plano.cor}35`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700}}>{plano.nome} — R${plano.preco}/mês</span><span style={{fontSize:9,color:"#8b9ab8"}}>{totalU} user(s)</span></div>
              <div style={{display:"flex",gap:6}}>
                {!isAtual&&<button onClick={()=>onTrocar(e)} style={{flex:1,padding:"6px",borderRadius:7,border:"1px solid #c9a84c35",background:"#c9a84c15",color:"#c9a84c",cursor:"pointer",fontSize:9,fontWeight:700}}>🔄 Acessar</button>}
                {pode(userAtual,"empresas","editar")&&<button onClick={()=>abrir(e)} style={{padding:"6px 9px",borderRadius:7,border:"1px solid #1e2840",background:"transparent",color:"#8b9ab8",cursor:"pointer",fontSize:10}}>✎</button>}
                {pode(userAtual,"empresas","excluir")&&!isAtual&&<button onClick={()=>setDel(e)} style={{padding:"6px 9px",borderRadius:7,border:"1px solid #e0525235",background:"#e0525215",color:"#e05252",cursor:"pointer",fontSize:10}}>✕</button>}
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
    <div style={{background:"#111520",border:"1px solid #1e2840",borderRadius:14,padding:18}}>
      <div style={{fontFamily:"Playfair Display",fontSize:13,color:"#f0e4c4",fontWeight:600,marginBottom:4}}>🔒 Isolamento Completo de Dados</div>
      <div style={{fontSize:10,color:"#8b9ab8",marginBottom:14}}>Nenhuma empresa visualiza dados de outra</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:9}}>
        {empresas.map(e=>{const isA=e.id===empresaAtual?.id;return(<div key={e.id} style={{background:isA?`${e.cor||"#c9a84c"}10`:"#0d1018",border:`2px solid ${isA?e.cor||"#c9a84c":"#1e2840"}`,borderRadius:10,padding:12,textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:5}}>{isA?"🔓":"🔒"}</div>
          <div style={{fontFamily:"DM Mono",fontSize:10,color:isA?e.cor||"#c9a84c":"#4a5568",fontWeight:600,marginBottom:3}}>{e.logo}</div>
          <div style={{fontSize:10,color:"#eae6dc",fontWeight:600,marginBottom:2}}>{e.nome}</div>
          <div style={{fontSize:8,color:"#4a5568"}}>{usuarios.filter(u=>u.empresaId===e.id).length} usuário(s)</div>
          {isA&&<div style={{fontSize:8,color:e.cor||"#c9a84c",marginTop:5,fontWeight:700}}>● Sessão Ativa</div>}
        </div>);})}
      </div>
      <div style={{marginTop:12,padding:"9px 13px",background:"#0d1018",borderRadius:8,border:"1px solid #1e2840",fontSize:10,color:"#8b9ab8",lineHeight:1.7}}>
        ✦ Cada empresa possui dados isolados de lançamentos, CP, CR, clientes e fornecedores.<br/>
        ✦ O JWT contém o <code style={{color:"#c9a84c",fontFamily:"DM Mono",fontSize:9}}>empresaId</code> — queries filtradas automaticamente.<br/>
        ✦ Trocar empresa emite novo token com o <code style={{color:"#c9a84c",fontFamily:"DM Mono",fontSize:9}}>empresaId</code> correto.
      </div>
    </div>
    {modal&&<div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={fechar}><div style={{background:"#161c2a",border:"1px solid #c9a84c40",borderRadius:18,padding:24,width:420,boxShadow:"0 40px 100px #000d"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontFamily:"Playfair Display",fontSize:14,color:"#f0e4c4"}}>{editE?"✎ Editar":"✦ Nova Empresa"}</div><button onClick={fechar} style={{background:"none",border:"none",color:"#4a5568",cursor:"pointer",fontSize:19}}>×</button></div>
      <Inp label="Nome da Empresa" value={form.nome} onChange={sf("nome")} ph="Áureo Indústria Ltda"/>
      <Inp label="CNPJ" value={form.cnpj||""} onChange={sf("cnpj")} ph="00.000.000/0001-00"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><Inp label="Plano" value={form.plano||"basico"} onChange={sf("plano")} opts={Object.keys(PLANOS)}/><Inp label="Cor (hex)" value={form.cor||"#c9a84c"} onChange={sf("cor")} ph="#c9a84c"/></div>
      {form.plano&&<div style={{background:`${PLANOS[form.plano]?.cor}18`,border:`1px solid ${PLANOS[form.plano]?.cor}35`,borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:10,color:PLANOS[form.plano]?.cor}}>{form.plano==="basico"?"Básico — 3 usuários — R$ 149/mês":form.plano==="pro"?"Pro — 10 usuários — R$ 349/mês":"Empresarial — ilimitado — R$ 749/mês"}</div>}
      <div style={{display:"flex",gap:8,marginTop:8}}><button onClick={fechar} style={{padding:"9px 15px",borderRadius:8,border:"1px solid #1e2840",background:"transparent",color:"#8b9ab8",cursor:"pointer",fontSize:12,fontWeight:700}}>Cancelar</button><button onClick={salvar} style={{padding:"9px 15px",borderRadius:8,border:"none",background:GRAD,color:"#04050a",cursor:"pointer",fontSize:12,fontWeight:700}}>✔ Salvar</button></div>
    </div></div>}
    {del&&<div style={{position:"fixed",inset:0,background:"#000000bb",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={()=>setDel(null)}><div style={{background:"#161c2a",border:"1px solid #c9a84c40",borderRadius:18,padding:24,width:350,boxShadow:"0 40px 100px #000d"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontFamily:"Playfair Display",fontSize:14,color:"#f0e4c4",marginBottom:13}}>⚠ Excluir Empresa</div>
      <div style={{background:"#0d1018",border:"1px solid #c9a84c25",borderRadius:8,padding:12,marginBottom:13}}><div style={{fontSize:11,color:"#eae6dc",fontWeight:600}}>{del.nome}</div><div style={{fontSize:10,color:"#e05252",marginTop:3}}>⚠ Todos os dados serão removidos permanentemente.</div></div>
      <div style={{display:"flex",gap:8}}><button onClick={()=>setDel(null)} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #1e2840",background:"transparent",color:"#8b9ab8",cursor:"pointer",fontSize:12,fontWeight:700}}>Cancelar</button><button onClick={excluir} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #e0525235",background:"#e0525215",color:"#e05252",cursor:"pointer",fontSize:12,fontWeight:700}}>✕ Excluir</button></div>
    </div></div>}
  </div>);
}

function AuthProvider({children}){
  const [usuario,setUsuario]=useState(null);
  const [empresa,setEmpresa]=useState(null);
  const [usuarios,setUsuarios]=useState(USUARIOS_INIT);
  const [empresas,setEmpresas]=useState(EMPRESAS_INIT);
  const login=(u,e)=>{setUsuario({...u,acesso:new Date().toLocaleString("pt-BR")});setEmpresa(e||empresas.find(x=>x.id===u.empresaId));};
  const logout=()=>{setUsuario(null);setEmpresa(null);};
  const trocarEmpresa=e=>{const uE=usuarios.find(u=>u.email===usuario?.email&&u.empresaId===e.id)||{...usuario,empresaId:e.id};setUsuario({...uE,acesso:new Date().toLocaleString("pt-BR")});setEmpresa(e);};
  const podeAc=(mod,acao)=>pode(usuario,mod,acao);
  return <AuthCtx.Provider value={{usuario,empresa,usuarios,setUsuarios,empresas,setEmpresas,login,logout,trocarEmpresa,podeAc}}>{children}</AuthCtx.Provider>;
}

const G={bg:"#04050a",deep:"#080b12",surface:"#0d1018",panel:"#111520",card:"#161c2a",rim:"#1e2840",rimGold:"#c9a84c40",gold:"#c9a84c",goldL:"#e2c97e",goldD:"#8b6914",champ:"#f0e4c4",text:"#eae6dc",sub:"#8b9ab8",muted:"#4a5568",emerald:"#2dd4a0",crimson:"#e05252",amber:"#f0a843",sapphire:"#5b8def",violet:"#9b6dff",teal:"#14b8a6"};
const GRAD=`linear-gradient(135deg,${G.goldD},${G.gold},${G.goldL})`;
const T=new Date();
const fd=d=>(d instanceof Date?d:new Date(d)).toISOString().split("T")[0];
const brl=(v,s)=>{const a=Math.abs(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});return s?(v>=0?`+R$ ${a}`:`-R$ ${a}`):`R$ ${a}`;};
const uid=()=>String(Date.now()+Math.floor(Math.random()*9999));

/* Gera código sequencial formatado: FRN-001, CLI-001 etc */
const nextCodigo=(lista,prefixo)=>{
  const nums=lista.map(x=>{const m=String(x.codigo||"").match(/(\d+)$/);return m?parseInt(m[1]):0;});
  const max=nums.length?Math.max(...nums):0;
  return `${prefixo}-${String(max+1).padStart(3,"0")}`;
};

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:${G.rim};border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:${G.goldD}}
input[type=date]{display:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
@keyframes calPop{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.anim{animation:fadeUp .35s ease both}
.shimmer{background:linear-gradient(90deg,${G.gold},${G.goldL},${G.gold});background-size:200%;animation:shimmer 2.5s linear infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
select option{background:${G.card};color:${G.text}}
.spin{animation:spin 1s linear infinite}
.slideDown{animation:slideDown .18s ease both}
`;

const INIT_TIPOSMOV=[
  {id:"tm1",nome:"Tarifa de Manutenção",grupo:"tarifa",conta:"Corrente",descricao:"Cobrança mensal de manutenção"},
  {id:"tm2",nome:"Tarifa TED/PIX",grupo:"tarifa",conta:"Corrente",descricao:"Tarifas por transferências"},
  {id:"tm3",nome:"Anuidade Cartão",grupo:"tarifa",conta:"Corrente",descricao:"Cobrança anual de cartão"},
  {id:"tm4",nome:"Rendimento Conta Corrente",grupo:"rendimento_cc",conta:"Corrente",descricao:"Juros sobre saldo em CC"},
  {id:"tm5",nome:"Rendimento Poupança",grupo:"rendimento_cc",conta:"Poupança",descricao:"Rendimento mensal"},
  {id:"tm6",nome:"Rendimento CDB",grupo:"rendimento_inv",conta:"Investimento",descricao:"Rendimento de CDB"},
  {id:"tm7",nome:"Rendimento Tesouro",grupo:"rendimento_inv",conta:"Investimento",descricao:"Rendimento Tesouro Direto"},
  {id:"tm8",nome:"Rendimento RDB",grupo:"rendimento_inv",conta:"Investimento",descricao:"Rendimento de RDB"},
];

/* ── UI ATOMS ── */
const Divider=()=><div style={{height:1,background:`linear-gradient(90deg,transparent,${G.gold}50,transparent)`,margin:"16px 0"}}/>;
function Chip({label,color}){return <span style={{background:`${color}18`,color,border:`1px solid ${color}35`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{label}</span>;}
function Badge({s}){
  const M={pendente:{c:G.amber,l:"Pendente"},vencido:{c:G.crimson,l:"Vencido"},pago:{c:G.emerald,l:"Pago"},efetivado:{c:G.emerald,l:"Efetivado"},agendado:{c:G.sapphire,l:"Agendado"},previsto:{c:G.violet,l:"Previsto"},recebido:{c:G.emerald,l:"Recebido"},conciliado:{c:G.teal,l:"Conciliado"}};
  const x=M[s]||M.pendente;
  return <span style={{background:`${x.c}14`,color:x.c,border:`1px solid ${x.c}30`,borderRadius:20,padding:"2px 11px",fontSize:10,fontWeight:700}}>{x.l}</span>;
}
function DocBadge({tipo}){
  const m={"Nota Fiscal":{c:G.emerald,i:"◈"},"Fatura":{c:G.sapphire,i:"◆"},"Não Fiscal":{c:G.muted,i:"○"}};
  const x=m[tipo]||{c:G.muted,i:"○"};
  return <span style={{background:`${x.c}15`,color:x.c,border:`1px solid ${x.c}30`,borderRadius:6,padding:"2px 9px",fontSize:10,fontWeight:700}}>{x.i} {tipo||"—"}</span>;
}
function Kpi({icon,label,value,sub,color,delay=0}){
  return(
    <div className="anim" style={{animationDelay:`${delay}s`,background:G.panel,border:`1px solid ${G.rim}`,borderTop:`2px solid ${color}`,borderRadius:12,padding:"18px 16px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:`radial-gradient(circle at top right,${color}12,transparent 70%)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:10,color:G.sub,textTransform:"uppercase",letterSpacing:1}}>{label}</span><span style={{fontSize:17,color}}>{icon}</span></div>
      <div style={{fontFamily:"DM Mono",fontSize:18,color:G.text,marginBottom:4}}>{value}</div>
      <div style={{fontSize:10,color:G.muted}}>{sub}</div>
    </div>
  );
}
function Panel({title,sub,children,action}){
  return(
    <div style={{background:G.panel,border:`1px solid ${G.rim}`,borderRadius:14,overflow:"hidden",marginBottom:16}}>
      <div style={{padding:"14px 18px",borderBottom:`1px solid ${G.rim}`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,background:`linear-gradient(90deg,${G.panel},${G.surface})`}}>
        <div><div style={{fontFamily:"Playfair Display",fontSize:14,color:G.champ,fontWeight:600}}>{title}</div>{sub&&<div style={{fontSize:10,color:G.sub,marginTop:2}}>{sub}</div>}</div>
        {action&&<div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>{action}</div>}
      </div>
      <div style={{padding:18}}>{children}</div>
    </div>
  );
}
function Btn({onClick,children,small,v="gold",disabled}){
  const b={border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"Outfit",fontWeight:700,borderRadius:8,transition:"all .15s",padding:small?"5px 12px":"9px 18px",fontSize:small?10:12,opacity:disabled?.5:1};
  if(v==="ghost")return <button onClick={onClick} disabled={disabled} style={{...b,background:"transparent",border:`1px solid ${G.rim}`,color:G.sub}}>{children}</button>;
  if(v==="danger")return <button onClick={onClick} disabled={disabled} style={{...b,background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson}}>{children}</button>;
  if(v==="ok")return <button onClick={onClick} disabled={disabled} style={{...b,background:`${G.emerald}15`,border:`1px solid ${G.emerald}35`,color:G.emerald}}>{children}</button>;
  if(v==="blue")return <button onClick={onClick} disabled={disabled} style={{...b,background:`${G.sapphire}18`,border:`1px solid ${G.sapphire}38`,color:G.sapphire}}>{children}</button>;
  if(v==="teal")return <button onClick={onClick} disabled={disabled} style={{...b,background:`${G.teal}18`,border:`1px solid ${G.teal}38`,color:G.teal}}>{children}</button>;
  if(v==="violet")return <button onClick={onClick} disabled={disabled} style={{...b,background:`${G.violet}18`,border:`1px solid ${G.violet}38`,color:G.violet}}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={{...b,background:GRAD,color:G.bg,boxShadow:`0 4px 14px ${G.gold}28`}}>{children}</button>;
}
function Field({label,value,onChange,type="text",opts,mono,placeholder}){
  const s={width:"100%",background:G.surface,border:`1px solid ${G.rim}`,borderRadius:8,padding:"8px 11px",color:G.text,fontSize:12,outline:"none",fontFamily:mono?"DM Mono":"Outfit"};
  return(
    <div style={{marginBottom:12}}>
      {label&&<div style={{fontSize:10,color:G.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:.7}}>{label}</div>}
      {opts?<select value={value} onChange={e=>onChange(e.target.value)} style={{...s,cursor:"pointer"}}>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
           :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||""} style={s}/>}
    </div>
  );
}
function G2({children}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>{children}</div>;}
function G3({children}){return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:11}}>{children}</div>;}
function Modal({open,onClose,title,children,width=480}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,background:"#000000ba",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{background:G.card,border:`1px solid ${G.rimGold}`,borderRadius:18,padding:26,width,maxHeight:"90vh",overflowY:"auto",boxShadow:`0 40px 100px #000c`}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"Playfair Display",fontSize:16,color:G.champ}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:20}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function FilterBtn({value,current,onClick,label}){
  const active=value===current;
  return <button onClick={()=>onClick(value)} style={{padding:"4px 11px",borderRadius:7,border:`1px solid ${active?G.gold:G.rim}`,background:active?`${G.gold}15`:"transparent",color:active?G.gold:G.muted,fontSize:10,cursor:"pointer",fontFamily:"Outfit",fontWeight:600,whiteSpace:"nowrap"}}>{label}</button>;
}
function TH({children}){return <th style={{textAlign:"left",padding:"8px 11px",fontSize:9,color:G.muted,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${G.rim}`,fontFamily:"Outfit",whiteSpace:"nowrap"}}>{children}</th>;}
function TD({children,mono,color,small,bold,clip}){return <td style={{padding:"10px 11px",borderBottom:`1px solid ${G.rim}15`,fontFamily:mono?"DM Mono":"Outfit",fontSize:small?10:12,color:color||G.text,fontWeight:bold?700:400,maxWidth:clip?140:undefined,overflow:clip?"hidden":undefined,textOverflow:clip?"ellipsis":undefined,whiteSpace:clip?"nowrap":undefined}}>{children}</td>;}
function Empty({msg,sub}){
  return(<div style={{textAlign:"center",padding:"40px 20px",color:G.muted}}><div style={{fontSize:32,marginBottom:10}}>◈</div><div style={{fontSize:13,color:G.sub,marginBottom:4}}>{msg||"Nenhum registro."}</div>{sub&&<div style={{fontSize:11,color:G.muted}}>{sub}</div>}</div>);
}
function exportCSV(nome,cab,rows){
  const bom="\uFEFF";
  const csv=bom+[cab,...rows].map(r=>r.map(c=>`"${String(c||"").replace(/"/g,'""')}"`).join(";")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`${nome}_${fd(T)}.csv`;a.click();URL.revokeObjectURL(url);
}

/* ── DATE PICKER CUSTOMIZADO ──
   Substitui o input[type=date] nativo (sempre branco no browser).
   Exibe um calendário no estilo do ERP: fundo escuro, dourado, DM Mono.
*/
const MESES_PT=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_PT=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function DatePicker({label,value,onChange}){
  // value: "YYYY-MM-DD" string
  const parseVal=v=>{
    if(!v)return null;
    const [y,m,d]=v.split("-").map(Number);
    if(!y||!m||!d)return null;
    return{y,m,d};
  };
  const sel=parseVal(value);
  const today={y:T.getFullYear(),m:T.getMonth()+1,d:T.getDate()};

  const [open,setOpen]=useState(false);
  const [view,setView]=useState(sel?{y:sel.y,m:sel.m}:{y:today.y,m:today.m});
  const ref=useRef(null);

  // Fecha ao clicar fora
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);
  },[]);

  // Sincroniza view com valor externo quando abre
  const handleOpen=()=>{
    if(sel)setView({y:sel.y,m:sel.m});
    setOpen(v=>!v);
  };

  const prevMes=()=>setView(v=>v.m===1?{y:v.y-1,m:12}:{y:v.y,m:v.m-1});
  const nextMes=()=>setView(v=>v.m===12?{y:v.y+1,m:1}:{y:v.y,m:v.m+1});

  const diasNoMes=(y,m)=>new Date(y,m,0).getDate();
  const primeiroDia=(y,m)=>new Date(y,m-1,1).getDay();// 0=dom

  const selecionar=(d)=>{
    const mm=String(view.m).padStart(2,"0");
    const dd=String(d).padStart(2,"0");
    onChange(`${view.y}-${mm}-${dd}`);
    setOpen(false);
  };

  // Formata "DD/MM/AAAA" para exibição
  const displayVal=sel?`${String(sel.d).padStart(2,"0")}/${String(sel.m).padStart(2,"0")}/${sel.y}`:"";

  const total=diasNoMes(view.y,view.m);
  const firstDow=primeiroDia(view.y,view.m);
  // Células: blanks + dias
  const cells=[];
  for(let i=0;i<firstDow;i++)cells.push(null);
  for(let d=1;d<=total;d++)cells.push(d);
  while(cells.length%7!==0)cells.push(null);

  return(
    <div style={{marginBottom:12,position:"relative"}} ref={ref}>
      {label&&<div style={{fontSize:10,color:G.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:.7}}>{label}</div>}
      {/* Campo clicável */}
      <div onClick={handleOpen} style={{display:"flex",alignItems:"center",background:G.surface,border:`1px solid ${open?G.gold:G.rim}`,borderRadius:8,padding:"8px 11px",cursor:"pointer",transition:"border-color .15s",gap:8,userSelect:"none"}}>
        <span style={{fontFamily:"DM Mono",fontSize:12,color:displayVal?G.text:G.muted,flex:1}}>{displayVal||"DD/MM/AAAA"}</span>
        <span style={{fontSize:14,color:open?G.gold:G.muted,transition:"color .15s"}}>📅</span>
      </div>

      {/* Calendário dropdown */}
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:600,background:G.card,border:`1px solid ${G.gold}50`,borderRadius:14,boxShadow:`0 24px 60px #000d`,overflow:"hidden",animation:"calPop .18s ease both",minWidth:280}}>
          {/* Header: mês/ano + navegação */}
          <div style={{display:"flex",alignItems:"center",padding:"12px 14px",borderBottom:`1px solid ${G.rim}`,background:`linear-gradient(90deg,${G.panel},${G.surface})`}}>
            <button onClick={prevMes} style={{background:`${G.gold}12`,border:`1px solid ${G.gold}25`,color:G.gold,borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            <div style={{flex:1,textAlign:"center"}}>
              <span style={{fontFamily:"Playfair Display",fontSize:14,color:G.champ,fontWeight:600}}>{MESES_PT[view.m-1]}</span>
              <span style={{fontFamily:"DM Mono",fontSize:13,color:G.gold,marginLeft:8,fontWeight:700}}>{view.y}</span>
            </div>
            <button onClick={nextMes} style={{background:`${G.gold}12`,border:`1px solid ${G.gold}25`,color:G.gold,borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
          </div>

          {/* Dias da semana */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"8px 10px 4px",gap:2}}>
            {DIAS_PT.map(d=>(
              <div key={d} style={{textAlign:"center",fontSize:9,color:d==="Dom"?G.crimson:d==="Sáb"?G.sapphire:G.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,padding:"3px 0"}}>{d}</div>
            ))}
          </div>

          {/* Grade de dias */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"2px 10px 12px",gap:2}}>
            {cells.map((d,i)=>{
              if(!d)return<div key={`b${i}`}/>;
              const isToday=d===today.d&&view.m===today.m&&view.y===today.y;
              const isSel=sel&&d===sel.d&&view.m===sel.m&&view.y===sel.y;
              const dow=(firstDow+d-1)%7;
              const isWeekend=dow===0||dow===6;
              return(
                <button key={d} onClick={()=>selecionar(d)} style={{
                  background:isSel?GRAD:isToday?`${G.gold}18`:"transparent",
                  border:isSel?"none":isToday?`1px solid ${G.gold}50`:`1px solid transparent`,
                  borderRadius:7,padding:"5px 2px",cursor:"pointer",
                  fontFamily:"DM Mono",fontSize:12,
                  color:isSel?G.bg:isToday?G.gold:isWeekend?(dow===0?G.crimson:G.sapphire):G.text,
                  fontWeight:isSel||isToday?700:400,
                  textAlign:"center",
                  transition:"background .1s",
                }}
                onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=`${G.gold}18`;}}
                onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}
                >{d}</button>
              );
            })}
          </div>

          {/* Rodapé: botão Hoje */}
          <div style={{borderTop:`1px solid ${G.rim}`,padding:"8px 14px",display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>{setView({y:today.y,m:today.m});selecionar(today.d);}} style={{background:`${G.gold}12`,border:`1px solid ${G.gold}30`,color:G.gold,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:11,fontFamily:"Outfit",fontWeight:700}}>Hoje</button>
            {displayVal&&<button onClick={()=>{onChange("");setOpen(false);}} style={{background:"transparent",border:`1px solid ${G.rim}`,color:G.muted,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontFamily:"Outfit"}}>Limpar</button>}
            <span style={{fontFamily:"DM Mono",fontSize:10,color:G.muted,marginLeft:"auto"}}>{displayVal||"—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── COMPONENTE BUSCA COM LUPA ──
   Usado em CP (busca fornecedor) e CR (busca cliente)
   Pesquisa por: código (FRN-001), CNPJ, razão social, nome fantasia
*/
function BuscaCadastro({label,lista,valor,onSelect,placeholder,cor}){
  const [aberto,setAberto]=useState(false);
  const [q,setQ]=useState("");
  const ref=useRef(null);
  const inputRef=useRef(null);
  const acor=cor||G.gold;

  // Fecha ao clicar fora
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setAberto(false);};
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[]);

  const resultados=q.trim()===""?lista:lista.filter(x=>{
    const s=q.toLowerCase();
    return (x.codigo||"").toLowerCase().includes(s)||
           (x.cnpj||"").toLowerCase().includes(s)||
           (x.razao||"").toLowerCase().includes(s)||
           (x.fantasia||"").toLowerCase().includes(s);
  });

  const selecionar=(item)=>{
    onSelect(item);
    setAberto(false);
    setQ("");
  };

  const selecionado=lista.find(x=>x.id===valor?.id);

  return(
    <div style={{marginBottom:12}} ref={ref}>
      <div style={{fontSize:10,color:G.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:.7}}>{label}</div>
      <div style={{display:"flex",gap:6,alignItems:"stretch"}}>
        {/* Campo de exibição do selecionado */}
        <div style={{flex:1,background:G.surface,border:`1px solid ${selecionado?acor:G.rim}`,borderRadius:8,padding:"8px 11px",display:"flex",alignItems:"center",gap:8,minHeight:36}}>
          {selecionado?(
            <>
              <span style={{fontFamily:"DM Mono",fontSize:10,color:acor,background:`${acor}15`,border:`1px solid ${acor}30`,borderRadius:4,padding:"1px 7px",fontWeight:700,whiteSpace:"nowrap"}}>{selecionado.codigo}</span>
              <span style={{fontSize:12,color:G.text,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selecionado.razao}</span>
              <button onClick={()=>onSelect(null)} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>×</button>
            </>
          ):(
            <span style={{fontSize:12,color:G.muted}}>{placeholder||"Nenhum selecionado"}</span>
          )}
        </div>
        {/* Botão lupa */}
        <button onClick={()=>{setAberto(v=>!v);setTimeout(()=>inputRef.current?.focus(),50);}}
          style={{background:aberto?`${acor}20`:`${acor}10`,border:`1px solid ${acor}40`,borderRadius:8,padding:"0 13px",cursor:"pointer",color:acor,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}
          title="Buscar">
          🔍
        </button>
      </div>

      {/* Dropdown de busca */}
      {aberto&&(
        <div className="slideDown" style={{position:"relative",zIndex:200}}>
          <div style={{position:"absolute",top:4,left:0,right:0,background:G.card,border:`1px solid ${acor}40`,borderRadius:12,boxShadow:`0 20px 50px #000a`,overflow:"hidden"}}>
            {/* Input de pesquisa */}
            <div style={{padding:"10px 12px",borderBottom:`1px solid ${G.rim}`,background:G.surface}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{color:G.muted,fontSize:14}}>🔍</span>
                <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)}
                  placeholder="Buscar por código, CNPJ, razão social ou fantasia..."
                  style={{flex:1,background:"transparent",border:"none",color:G.text,fontSize:12,outline:"none",fontFamily:"Outfit"}}
                  onKeyDown={e=>{if(e.key==="Escape")setAberto(false);if(e.key==="Enter"&&resultados.length===1)selecionar(resultados[0]);}}
                />
                {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",color:G.muted,cursor:"pointer",fontSize:13}}>×</button>}
              </div>
              <div style={{fontSize:9,color:G.muted,marginTop:5}}>Pesquise por: <strong style={{color:G.sub}}>Código</strong> · <strong style={{color:G.sub}}>CNPJ</strong> · <strong style={{color:G.sub}}>Razão Social</strong> · <strong style={{color:G.sub}}>Nome Fantasia</strong></div>
            </div>

            {/* Resultados */}
            <div style={{maxHeight:240,overflowY:"auto"}}>
              {lista.length===0?(
                <div style={{padding:"20px 16px",textAlign:"center",color:G.muted,fontSize:11}}>Nenhum cadastro disponível.<br/><span style={{fontSize:10}}>Cadastre um {label.toLowerCase()} primeiro.</span></div>
              ):resultados.length===0?(
                <div style={{padding:"16px",textAlign:"center",color:G.muted,fontSize:11}}>Nenhum resultado para "{q}"</div>
              ):resultados.map(item=>(
                <div key={item.id} onClick={()=>selecionar(item)}
                  style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${G.rim}15`,display:"flex",gap:10,alignItems:"center",transition:"background .12s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=`${acor}08`}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {/* Código badge */}
                  <div style={{fontFamily:"DM Mono",fontSize:10,color:acor,background:`${acor}15`,border:`1px solid ${acor}30`,borderRadius:5,padding:"2px 8px",fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{item.codigo}</div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,color:G.text,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.razao}</div>
                    <div style={{display:"flex",gap:8,marginTop:2,flexWrap:"wrap"}}>
                      {item.fantasia&&<span style={{fontSize:10,color:G.muted}}>{item.fantasia}</span>}
                      {item.cnpj&&<span style={{fontFamily:"DM Mono",fontSize:10,color:G.muted}}>{item.cnpj}</span>}
                      {item.cat&&<span style={{fontSize:9,color:acor,background:`${acor}12`,padding:"1px 5px",borderRadius:3}}>{item.cat}</span>}
                    </div>
                  </div>
                  {item.status==="inativo"&&<span style={{fontSize:9,color:G.crimson,background:`${G.crimson}12`,padding:"1px 6px",borderRadius:4,flexShrink:0}}>Inativo</span>}
                </div>
              ))}
            </div>
            {lista.length>0&&<div style={{padding:"8px 14px",borderTop:`1px solid ${G.rim}`,background:G.surface}}><span style={{fontSize:9,color:G.muted}}>{resultados.length} de {lista.length} resultado(s)</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── AGENTE IA ── */
function ModAgente({cp,cr,lanc,mov,bancos,fornecedores,clientes}){
  const [msgs,setMsgs]=useState([{role:"assistant",text:"Olá! Sou o **Áureo AI**, seu analista financeiro. Posso analisar a saúde da empresa, identificar riscos, comparar receitas e despesas, projetar fluxo de caixa e muito mais. O que deseja saber?"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const buildContext=()=>{
    const totE=lanc.filter(l=>l.tipo==="E").reduce((a,b)=>a+b.valor,0);
    const totS=lanc.filter(l=>l.tipo==="S").reduce((a,b)=>a+b.valor,0);
    const cpPend=cp.filter(t=>t.status==="pendente").reduce((a,b)=>a+b.valor,0);
    const cpVenc=cp.filter(t=>t.status==="vencido").reduce((a,b)=>a+b.valor,0);
    const crPend=cr.filter(t=>t.status==="pendente").reduce((a,b)=>a+b.valor,0);
    const crVenc=cr.filter(t=>t.status==="vencido").reduce((a,b)=>a+b.valor,0);
    const saldoBancos=bancos.reduce((a,b)=>a+b.saldo,0);
    return `Você é um analista financeiro especialista em ERP. Responda SEMPRE em português brasileiro. Seja objetivo, direto e profissional. Use markdown (negrito, listas) quando útil. Data: ${fd(T)}.

LANÇAMENTOS (${lanc.length}): Entradas R$ ${totE.toFixed(2)} | Saídas R$ ${totS.toFixed(2)} | Resultado R$ ${(totE-totS).toFixed(2)}
${lanc.map(l=>`  ${l.tipo==="E"?"↑":"↓"} ${l.desc} | ${l.cat} | ${l.data} | R$ ${l.valor} | ${l.status}`).join("\n")||"  (vazio)"}

CONTAS A PAGAR (${cp.length}): Pendente R$ ${cpPend.toFixed(2)} | Vencido R$ ${cpVenc.toFixed(2)}
${cp.map(t=>`  • ${t.codigo_cad||""} ${t.razao||t.credor} | ${t.tipoDoc} | Venc ${t.venc} | R$ ${t.valor} | ${t.status}`).join("\n")||"  (vazio)"}

CONTAS A RECEBER (${cr.length}): Pendente R$ ${crPend.toFixed(2)} | Vencido R$ ${crVenc.toFixed(2)}
${cr.map(t=>`  • ${t.codigo_cad||""} ${t.razao||t.devedor} | ${t.tipoDoc} | Venc ${t.venc} | R$ ${t.valor} | ${t.status}`).join("\n")||"  (vazio)"}

BANCOS (${bancos.length}): Saldo consolidado R$ ${saldoBancos.toFixed(2)}
${bancos.map(b=>`  • ${b.nome} | ${b.tipo} | R$ ${b.saldo.toFixed(2)}${b.taxa?` | ${b.taxa}%aa`:""}`).join("\n")||"  (vazio)"}

CADASTROS: ${fornecedores.length} fornecedores | ${clientes.length} clientes
INDICADORES: Margem ${totE>0?((totE-totS)/totE*100).toFixed(1):0}% | Inadimpl. ${cr.length>0?(cr.filter(t=>t.status==="vencido").length/cr.length*100).toFixed(1):0}%`;
  };

  const send=async()=>{
    const q=input.trim();if(!q||loading)return;
    setInput("");setMsgs(p=>[...p,{role:"user",text:q}]);setLoading(true);
    try{
      const history=msgs.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:buildContext(),messages:[...history,{role:"user",content:q}]})});
      const data=await res.json();
      setMsgs(p=>[...p,{role:"assistant",text:data.content?.[0]?.text||"Erro."}]);
    }catch(e){setMsgs(p=>[...p,{role:"assistant",text:"Erro de conexão."}]);}
    setLoading(false);
  };

  const sug=["Como está a saúde financeira?","Títulos vencidos","Projeção de caixa","Análise de inadimplência","Risco financeiro atual","Relatório executivo"];
  const renderText=t=>t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>");

  return(
    <div className="anim" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)"}}>
      <div style={{background:`linear-gradient(135deg,${G.panel},${G.card})`,border:`1px solid ${G.rimGold}`,borderRadius:14,padding:"16px 20px",marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:46,height:46,borderRadius:13,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 6px 20px ${G.gold}30`,flexShrink:0}}>✦</div>
        <div><div style={{fontFamily:"Playfair Display",fontSize:16,color:G.champ,fontWeight:600}}>Áureo AI — Analista Financeiro</div><div style={{fontSize:10,color:G.muted,marginTop:2}}>Powered by Claude · Dados em tempo real · Responde em português</div></div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,background:`${G.emerald}10`,border:`1px solid ${G.emerald}30`,borderRadius:8,padding:"5px 12px"}}><div style={{width:6,height:6,borderRadius:"50%",background:G.emerald,animation:"pulse 2s infinite"}}/><span style={{fontSize:10,color:G.emerald,fontWeight:600}}>Online</span></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {sug.map(s=><button key={s} onClick={()=>setInput(s)} style={{background:`${G.gold}08`,border:`1px solid ${G.gold}25`,borderRadius:20,padding:"4px 12px",color:G.sub,fontSize:10,cursor:"pointer",fontFamily:"Outfit"}}>{s}</button>)}
      </div>
      <div style={{flex:1,overflowY:"auto",background:G.surface,border:`1px solid ${G.rim}`,borderRadius:14,padding:16,display:"flex",flexDirection:"column",gap:12}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:10,justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            {m.role==="assistant"&&<div style={{width:30,height:30,borderRadius:9,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,alignSelf:"flex-start",marginTop:2}}>✦</div>}
            <div style={{maxWidth:"78%",background:m.role==="user"?`${G.gold}12`:G.card,border:`1px solid ${m.role==="user"?`${G.gold}30`:G.rim}`,borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"11px 14px",fontSize:12,color:G.text,lineHeight:1.65}} dangerouslySetInnerHTML={{__html:renderText(m.text)}}/>
            {m.role==="user"&&<div style={{width:30,height:30,borderRadius:9,background:`${G.sapphire}25`,border:`1px solid ${G.sapphire}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0,alignSelf:"flex-start",marginTop:2,color:G.sapphire}}>👤</div>}
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:10}}><div style={{width:30,height:30,borderRadius:9,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✦</div><div style={{background:G.card,border:`1px solid ${G.rim}`,borderRadius:"14px 14px 14px 4px",padding:"11px 16px",display:"flex",gap:5,alignItems:"center"}}>{[0,.2,.4].map(d=><div key={d} style={{width:7,height:7,borderRadius:"50%",background:G.gold,animation:`pulse 1.2s ${d}s infinite`}}/>)}</div></div>}
        <div ref={bottomRef}/>
      </div>
      <div style={{display:"flex",gap:10,marginTop:12}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Pergunte sobre saúde financeira, riscos, projeções..." style={{flex:1,background:G.surface,border:`1px solid ${G.rim}`,borderRadius:10,padding:"11px 16px",color:G.text,fontSize:12,outline:"none",fontFamily:"Outfit"}}/>
        <Btn onClick={send} disabled={loading||!input.trim()}>{loading?<span className="spin" style={{display:"inline-block"}}>⟳</span>:"↑ Enviar"}</Btn>
      </div>
    </div>
  );
}

/* ── CONTAS A PAGAR ── */
const CP_BLANK={credor:"",cnpj:"",razao:"",codigo_cad:"",fornecedorId:"",valor:"",venc:fd(T),emissao:fd(T),cat:"Fornecedores",status:"pendente",parcela:"única",obs:"",numDoc:"",tipoDoc:"Nota Fiscal"};
function ModPagar({cp,setCP,fornecedores}){
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [delConfirm,setDelConfirm]=useState(null);
  const [fil,setFil]=useState("todos");
  const [form,setForm]=useState(CP_BLANK);
  const [q,setQ]=useState("");
  const [fornSel,setFornSel]=useState(null);// objeto fornecedor selecionado

  const abrir=(item)=>{
    setEditing(item?item.id:null);
    setForm(item?{...item,valor:String(item.valor)}:{...CP_BLANK});
    // Pré-selecionar fornecedor se já vinculado
    if(item?.fornecedorId){
      const f=fornecedores.find(x=>x.id===item.fornecedorId);
      setFornSel(f||null);
    } else {
      setFornSel(null);
    }
    setModal(true);
  };
  const fechar=()=>{setModal(false);setEditing(null);setFornSel(null);};

  const onSelecionarFornecedor=(f)=>{
    setFornSel(f);
    if(f){
      setForm(p=>({...p,fornecedorId:f.id,cnpj:f.cnpj||"",razao:f.razao||"",credor:f.fantasia||f.razao||"",codigo_cad:f.codigo||"",cat:f.cat||p.cat}));
    } else {
      setForm(p=>({...p,fornecedorId:"",cnpj:"",razao:"",credor:"",codigo_cad:""}));
    }
  };

  const salvar=()=>{
    if(!form.credor||!form.valor)return;
    const item={...form,valor:parseFloat(form.valor)};
    if(editing)setCP(p=>p.map(t=>t.id===editing?{...item,id:editing}:t));
    else setCP(p=>[{...item,id:uid()},...p]);
    fechar();
  };
  const excluir=id=>{setCP(p=>p.filter(t=>t.id!==id));setDelConfirm(null);};
  const pagar=id=>setCP(p=>p.map(t=>t.id===id?{...t,status:"pago"}:t));

  const lista=(fil==="todos"?cp:cp.filter(t=>t.status===fil)).filter(t=>!q||[t.credor,t.razao,t.cnpj,t.numDoc,t.codigo_cad].some(v=>(v||"").toLowerCase().includes(q.toLowerCase())));
  const tots={pend:cp.filter(t=>t.status==="pendente").reduce((a,b)=>a+b.valor,0),venc:cp.filter(t=>t.status==="vencido").reduce((a,b)=>a+b.valor,0),pago:cp.filter(t=>t.status==="pago").reduce((a,b)=>a+b.valor,0),v5:cp.filter(t=>t.status==="pendente"&&new Date(t.venc)<=new Date(Date.now()+5*864e5)).length};

  return(
    <div className="anim">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        <Kpi icon="⏳" label="A Pagar" value={brl(tots.pend)} sub={`${cp.filter(t=>t.status==="pendente").length} títulos`} color={G.amber} delay={0}/>
        <Kpi icon="⚠" label="Vencido" value={brl(tots.venc)} sub={`${cp.filter(t=>t.status==="vencido").length} em atraso`} color={G.crimson} delay={.05}/>
        <Kpi icon="✔" label="Pago" value={brl(tots.pago)} sub={`${cp.filter(t=>t.status==="pago").length} baixas`} color={G.emerald} delay={.1}/>
        <Kpi icon="🔔" label="Vence em 5d" value={String(tots.v5)} sub="títulos próximos" color={G.gold} delay={.15}/>
      </div>
      <Panel title="↓ Contas a Pagar" sub="Gerencie obrigações financeiras"
        action={<>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Buscar..." style={{background:G.surface,border:`1px solid ${G.rim}`,borderRadius:7,padding:"5px 11px",color:G.text,fontSize:11,outline:"none",width:140}}/>
          <div style={{display:"flex",gap:4}}>{["todos","pendente","vencido","pago"].map(f=><FilterBtn key={f} value={f} current={fil} onClick={setFil} label={f.charAt(0).toUpperCase()+f.slice(1)}/>)}</div>
          <Btn v="blue" onClick={()=>exportCSV("cp",["Cód.Cad","Nº Doc","Tipo","Credor","Razão","CNPJ","Cat","Parcela","Venc","Status","Valor"],cp.map(t=>[t.codigo_cad,t.numDoc,t.tipoDoc,t.credor,t.razao,t.cnpj,t.cat,t.parcela,t.venc,t.status,t.valor]))} small>⬇ CSV</Btn>
          <Btn onClick={()=>abrir(null)} small>✦ Lançar</Btn>
        </>}>
        {lista.length===0?<Empty msg="Nenhum título a pagar." sub="Clique em ✦ Lançar para cadastrar."/>:(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:1020}}>
              <thead><tr><TH>Cód.</TH><TH>Nº Lanç.</TH><TH>Tipo Doc</TH><TH>Fornecedor / Razão</TH><TH>CNPJ</TH><TH>Vencimento</TH><TH>Parcela</TH><TH>Status</TH><TH>Valor</TH><TH></TH></tr></thead>
              <tbody>{lista.map((t,i)=>(
                <tr key={t.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}>
                  <TD><span style={{fontFamily:"DM Mono",fontSize:9,color:G.gold,background:`${G.gold}12`,border:`1px solid ${G.gold}25`,borderRadius:4,padding:"1px 6px"}}>{t.codigo_cad||"—"}</span></TD>
                  <TD mono small>{t.numDoc||"—"}</TD>
                  <TD><DocBadge tipo={t.tipoDoc}/></TD>
                  <TD bold clip>{t.razao||t.credor}</TD>
                  <TD mono small>{t.cnpj||"—"}</TD>
                  <TD mono small color={t.status==="vencido"?G.crimson:G.sub}>{t.venc}{t.status==="vencido"&&<span style={{marginLeft:4,fontSize:8,color:G.crimson,background:`${G.crimson}18`,padding:"1px 4px",borderRadius:3}}>VENC</span>}</TD>
                  <TD small>{t.parcela}</TD>
                  <TD><Badge s={t.status}/></TD>
                  <TD mono bold color={G.crimson}>{brl(t.valor)}</TD>
                  <td style={{padding:"7px 8px",borderBottom:`1px solid ${G.rim}15`}}>
                    <div style={{display:"flex",gap:3}}>
                      {t.status!=="pago"&&<button onClick={()=>pagar(t.id)} style={{background:`${G.emerald}15`,border:`1px solid ${G.emerald}35`,color:G.emerald,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}} title="Baixar">✔</button>}
                      <button onClick={()=>abrir(t)} style={{background:`${G.gold}15`,border:`1px solid ${G.gold}35`,color:G.gold,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✎</button>
                      <button onClick={()=>setDelConfirm(t)} style={{background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={modal} onClose={fechar} title={editing?"✎ Editar Conta a Pagar":"✦ Nova Conta a Pagar"} width={540}>
        {/* BUSCA FORNECEDOR */}
        <BuscaCadastro label="Fornecedor" lista={fornecedores} valor={fornSel} onSelect={onSelecionarFornecedor} placeholder="Clique na lupa para buscar fornecedor" cor={G.gold}/>
        {/* Dados preenchidos automaticamente — editáveis manualmente */}
        <div style={{background:`${G.gold}06`,border:`1px solid ${G.gold}20`,borderRadius:9,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:9,color:G.gold,textTransform:"uppercase",letterSpacing:.8,marginBottom:8,fontWeight:700}}>◆ Dados do Fornecedor</div>
          <G2>
            <div>
              <div style={{fontSize:10,color:G.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>Código</div>
              <div style={{fontFamily:"DM Mono",fontSize:12,color:G.gold,fontWeight:700}}>{form.codigo_cad||"—"}</div>
            </div>
            <div>
              <div style={{fontSize:10,color:G.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>CNPJ</div>
              <div style={{fontFamily:"DM Mono",fontSize:12,color:G.text}}>{form.cnpj||"—"}</div>
            </div>
          </G2>
          <div style={{marginTop:4}}>
            <div style={{fontSize:10,color:G.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>Razão Social</div>
            <div style={{fontSize:12,color:G.text}}>{form.razao||"—"}</div>
          </div>
        </div>
        <G2><Field label="Nº do Lançamento" value={form.numDoc||""} onChange={v=>setForm(p=>({...p,numDoc:v}))} mono placeholder="Ex: 4512"/><Field label="Tipo de Documento" value={form.tipoDoc||"Nota Fiscal"} onChange={v=>setForm(p=>({...p,tipoDoc:v}))} opts={["Nota Fiscal","Fatura","Não Fiscal"]}/></G2>
        <G3><Field label="Valor (R$)" value={form.valor||""} onChange={v=>setForm(p=>({...p,valor:v}))} type="number" mono placeholder="0,00"/><DatePicker label="Emissão" value={form.emissao||fd(T)} onChange={v=>setForm(p=>({...p,emissao:v}))}/><DatePicker label="Vencimento" value={form.venc||fd(T)} onChange={v=>setForm(p=>({...p,venc:v}))}/></G3>
        <G2><Field label="Categoria" value={form.cat||"Fornecedores"} onChange={v=>setForm(p=>({...p,cat:v}))} opts={["Fornecedores","Imóveis","RH","Financeiro","Seguros","TI","Marketing","Jurídico","Outros"]}/><Field label="Parcela" value={form.parcela||"única"} onChange={v=>setForm(p=>({...p,parcela:v}))} placeholder="única / 1/12"/></G2>
        <div style={{display:"flex",gap:8,marginTop:10}}><Btn v="ghost" onClick={fechar}>Cancelar</Btn><Btn onClick={salvar} disabled={!form.credor&&!form.razao}>{editing?"✔ Salvar":"✦ Lançar"}</Btn></div>
      </Modal>

      <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="⚠ Excluir Título" width={400}>
        {delConfirm&&<><div style={{background:G.surface,borderRadius:10,padding:14,marginBottom:16,border:`1px solid ${G.rimGold}`}}><div style={{fontSize:13,color:G.text}}>{delConfirm.razao||delConfirm.credor}</div><div style={{fontFamily:"DM Mono",fontSize:16,color:G.crimson,fontWeight:700}}>{brl(delConfirm.valor)}</div></div><p style={{color:G.sub,fontSize:12,marginBottom:16}}>Esta ação é irreversível.</p><div style={{display:"flex",gap:8}}><Btn v="ghost" onClick={()=>setDelConfirm(null)}>Cancelar</Btn><Btn v="danger" onClick={()=>excluir(delConfirm.id)}>✕ Excluir</Btn></div></>}
      </Modal>
    </div>
  );
}

/* ── CONTAS A RECEBER ── */
const CR_BLANK={devedor:"",cnpj:"",razao:"",codigo_cad:"",clienteId:"",valor:"",venc:fd(T),emissao:fd(T),cat:"Vendas",status:"pendente",numDoc:"",tipoDoc:"Nota Fiscal",obs:""};
function ModReceber({cr,setCR,clientes}){
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [delConfirm,setDelConfirm]=useState(null);
  const [fil,setFil]=useState("todos");
  const [form,setForm]=useState(CR_BLANK);
  const [q,setQ]=useState("");
  const [cliSel,setCliSel]=useState(null);

  const abrir=(item)=>{
    setEditing(item?item.id:null);
    setForm(item?{...item,valor:String(item.valor)}:{...CR_BLANK});
    if(item?.clienteId){const c=clientes.find(x=>x.id===item.clienteId);setCliSel(c||null);}
    else setCliSel(null);
    setModal(true);
  };
  const fechar=()=>{setModal(false);setEditing(null);setCliSel(null);};

  const onSelecionarCliente=(c)=>{
    setCliSel(c);
    if(c){setForm(p=>({...p,clienteId:c.id,cnpj:c.cnpj||"",razao:c.razao||"",devedor:c.fantasia||c.razao||"",codigo_cad:c.codigo||"",cat:c.cat||p.cat}));}
    else{setForm(p=>({...p,clienteId:"",cnpj:"",razao:"",devedor:"",codigo_cad:""}));}
  };

  const salvar=()=>{
    if(!form.devedor||!form.valor)return;
    const item={...form,valor:parseFloat(form.valor)};
    if(editing)setCR(p=>p.map(t=>t.id===editing?{...item,id:editing}:t));
    else setCR(p=>[{...item,id:uid()},...p]);
    fechar();
  };
  const excluir=id=>{setCR(p=>p.filter(t=>t.id!==id));setDelConfirm(null);};
  const receber=id=>setCR(p=>p.map(t=>t.id===id?{...t,status:"recebido"}:t));

  const lista=(fil==="todos"?cr:cr.filter(t=>t.status===fil)).filter(t=>!q||[t.devedor,t.razao,t.cnpj,t.numDoc,t.codigo_cad].some(v=>(v||"").toLowerCase().includes(q.toLowerCase())));
  const pend=cr.filter(t=>t.status==="pendente").reduce((a,b)=>a+b.valor,0);
  const venc=cr.filter(t=>t.status==="vencido").reduce((a,b)=>a+b.valor,0);
  const rec=cr.filter(t=>t.status==="recebido").reduce((a,b)=>a+b.valor,0);

  return(
    <div className="anim">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        <Kpi icon="⬆" label="A Receber" value={brl(pend)} sub={`${cr.filter(t=>t.status==="pendente").length} títulos`} color={G.sapphire} delay={0}/>
        <Kpi icon="⚠" label="Inadimplência" value={brl(venc)} sub={`${cr.filter(t=>t.status==="vencido").length} vencidos`} color={G.crimson} delay={.05}/>
        <Kpi icon="✔" label="Recebido" value={brl(rec)} sub={`${cr.filter(t=>t.status==="recebido").length} baixas`} color={G.emerald} delay={.1}/>
        <Kpi icon="%" label="Taxa Inadimpl." value={`${cr.length?Math.round(cr.filter(t=>t.status==="vencido").length/cr.length*100):0}%`} sub="do total" color={G.amber} delay={.15}/>
      </div>
      <Panel title="↑ Contas a Receber" sub="Gerencie recebíveis e cobranças"
        action={<>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Buscar..." style={{background:G.surface,border:`1px solid ${G.rim}`,borderRadius:7,padding:"5px 11px",color:G.text,fontSize:11,outline:"none",width:140}}/>
          <div style={{display:"flex",gap:4}}>{["todos","pendente","vencido","recebido"].map(f=><FilterBtn key={f} value={f} current={fil} onClick={setFil} label={f.charAt(0).toUpperCase()+f.slice(1)}/>)}</div>
          <Btn v="blue" onClick={()=>exportCSV("cr",["Cód.Cad","Nº Doc","Tipo","Devedor","Razão","CNPJ","Cat","Venc","Status","Valor"],cr.map(t=>[t.codigo_cad,t.numDoc,t.tipoDoc,t.devedor,t.razao,t.cnpj,t.cat,t.venc,t.status,t.valor]))} small>⬇ CSV</Btn>
          <Btn onClick={()=>abrir(null)} small>✦ Lançar</Btn>
        </>}>
        {lista.length===0?<Empty msg="Nenhum título a receber." sub="Clique em ✦ Lançar para cadastrar."/>:(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:1000}}>
              <thead><tr><TH>Cód.</TH><TH>Nº Lanç.</TH><TH>Tipo Doc</TH><TH>Cliente / Razão</TH><TH>CNPJ</TH><TH>Vencimento</TH><TH>Status</TH><TH>Valor</TH><TH></TH></tr></thead>
              <tbody>{lista.map((t,i)=>(
                <tr key={t.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}>
                  <TD><span style={{fontFamily:"DM Mono",fontSize:9,color:G.emerald,background:`${G.emerald}12`,border:`1px solid ${G.emerald}25`,borderRadius:4,padding:"1px 6px"}}>{t.codigo_cad||"—"}</span></TD>
                  <TD mono small>{t.numDoc||"—"}</TD>
                  <TD><DocBadge tipo={t.tipoDoc}/></TD>
                  <TD bold clip>{t.razao||t.devedor}</TD>
                  <TD mono small>{t.cnpj||"—"}</TD>
                  <TD mono small color={t.status==="vencido"?G.crimson:G.sub}>{t.venc}{t.status==="vencido"&&<span style={{marginLeft:4,fontSize:8,color:G.crimson,background:`${G.crimson}18`,padding:"1px 4px",borderRadius:3}}>VENC</span>}</TD>
                  <TD><Badge s={t.status}/></TD>
                  <TD mono bold color={G.emerald}>{brl(t.valor)}</TD>
                  <td style={{padding:"7px 8px",borderBottom:`1px solid ${G.rim}15`}}>
                    <div style={{display:"flex",gap:3}}>
                      {t.status!=="recebido"&&<button onClick={()=>receber(t.id)} style={{background:`${G.emerald}15`,border:`1px solid ${G.emerald}35`,color:G.emerald,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}} title="Baixar">✔</button>}
                      <button onClick={()=>abrir(t)} style={{background:`${G.gold}15`,border:`1px solid ${G.gold}35`,color:G.gold,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✎</button>
                      <button onClick={()=>setDelConfirm(t)} style={{background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={modal} onClose={fechar} title={editing?"✎ Editar Recebível":"✦ Novo Recebível"} width={540}>
        <BuscaCadastro label="Cliente" lista={clientes} valor={cliSel} onSelect={onSelecionarCliente} placeholder="Clique na lupa para buscar cliente" cor={G.emerald}/>
        <div style={{background:`${G.emerald}06`,border:`1px solid ${G.emerald}20`,borderRadius:9,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:9,color:G.emerald,textTransform:"uppercase",letterSpacing:.8,marginBottom:8,fontWeight:700}}>◆ Dados do Cliente</div>
          <G2>
            <div><div style={{fontSize:10,color:G.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>Código</div><div style={{fontFamily:"DM Mono",fontSize:12,color:G.emerald,fontWeight:700}}>{form.codigo_cad||"—"}</div></div>
            <div><div style={{fontSize:10,color:G.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>CNPJ</div><div style={{fontFamily:"DM Mono",fontSize:12,color:G.text}}>{form.cnpj||"—"}</div></div>
          </G2>
          <div style={{marginTop:4}}><div style={{fontSize:10,color:G.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:.6}}>Razão Social</div><div style={{fontSize:12,color:G.text}}>{form.razao||"—"}</div></div>
        </div>
        <G2><Field label="Nº do Lançamento" value={form.numDoc||""} onChange={v=>setForm(p=>({...p,numDoc:v}))} mono placeholder="Ex: NF-e 001.892"/><Field label="Tipo de Documento" value={form.tipoDoc||"Nota Fiscal"} onChange={v=>setForm(p=>({...p,tipoDoc:v}))} opts={["Nota Fiscal","Fatura","Não Fiscal"]}/></G2>
        <G3><Field label="Valor (R$)" value={form.valor||""} onChange={v=>setForm(p=>({...p,valor:v}))} type="number" mono placeholder="0,00"/><DatePicker label="Emissão" value={form.emissao||fd(T)} onChange={v=>setForm(p=>({...p,emissao:v}))}/><DatePicker label="Vencimento" value={form.venc||fd(T)} onChange={v=>setForm(p=>({...p,venc:v}))}/></G3>
        <G2><Field label="Categoria" value={form.cat||"Vendas"} onChange={v=>setForm(p=>({...p,cat:v}))} opts={["Vendas","Contratos","Serviços","Outros"]}/><Field label="Observação" value={form.obs||""} onChange={v=>setForm(p=>({...p,obs:v}))} placeholder="Opcional"/></G2>
      </Modal>

      <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="⚠ Excluir Título" width={400}>
        {delConfirm&&<><div style={{background:G.surface,borderRadius:10,padding:14,marginBottom:16,border:`1px solid ${G.rimGold}`}}><div style={{fontSize:13,color:G.text}}>{delConfirm.razao||delConfirm.devedor}</div><div style={{fontFamily:"DM Mono",fontSize:16,color:G.emerald,fontWeight:700}}>{brl(delConfirm.valor)}</div></div><p style={{color:G.sub,fontSize:12,marginBottom:16}}>Esta ação é irreversível.</p><div style={{display:"flex",gap:8}}><Btn v="ghost" onClick={()=>setDelConfirm(null)}>Cancelar</Btn><Btn v="danger" onClick={()=>excluir(delConfirm.id)}>✕ Excluir</Btn></div></>}
      </Modal>
    </div>
  );
}

/* ── LANÇAMENTOS ── */
const L_BLANK={desc:"",tipo:"E",valor:"",data:fd(T),cat:"Vendas",cc:"Comercial",banco:"",status:"efetivado",obs:""};
function ModLancamentos({lanc,setLanc,bancos}){
  const [modal,setModal]=useState(false);const [editing,setEditing]=useState(null);const [delConfirm,setDelConfirm]=useState(null);const [fil,setFil]=useState("todos");const [q,setQ]=useState("");const [form,setForm]=useState(L_BLANK);
  const abrir=item=>{setEditing(item?item.id:null);setForm(item?{...item,valor:String(item.valor)}:{...L_BLANK});setModal(true);};
  const fechar=()=>{setModal(false);setEditing(null);};
  const salvar=()=>{if(!form.desc||!form.valor)return;const item={...form,valor:parseFloat(form.valor)};if(editing)setLanc(p=>p.map(l=>l.id===editing?{...item,id:editing}:l));else setLanc(p=>[{...item,id:uid()},...p]);fechar();};
  const excluir=id=>{setLanc(p=>p.filter(l=>l.id!==id));setDelConfirm(null);};
  const lista=lanc.filter(l=>{const mF=fil==="todos"||l.status===fil||(fil==="E"&&l.tipo==="E")||(fil==="S"&&l.tipo==="S");const mQ=!q||l.desc.toLowerCase().includes(q.toLowerCase())||l.cat.toLowerCase().includes(q.toLowerCase());return mF&&mQ;});
  const totE=lista.filter(l=>l.tipo==="E").reduce((a,b)=>a+b.valor,0);const totS=lista.filter(l=>l.tipo==="S").reduce((a,b)=>a+b.valor,0);
  const cats=form.tipo==="E"?["Vendas","Contratos","Serviços","Investimento","Outros"]:["Fornecedores","RH","Marketing","TI","Imóveis","Financeiro","Outros"];
  return(
    <div className="anim">
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        <Kpi icon="↑" label="Total Entradas" value={brl(lanc.filter(l=>l.tipo==="E").reduce((a,b)=>a+b.valor,0))} sub={`${lanc.filter(l=>l.tipo==="E").length} registros`} color={G.emerald} delay={0}/>
        <Kpi icon="↓" label="Total Saídas" value={brl(lanc.filter(l=>l.tipo==="S").reduce((a,b)=>a+b.valor,0))} sub={`${lanc.filter(l=>l.tipo==="S").length} registros`} color={G.crimson} delay={.05}/>
        <Kpi icon="◈" label="Resultado" value={brl(lanc.filter(l=>l.tipo==="E").reduce((a,b)=>a+b.valor,0)-lanc.filter(l=>l.tipo==="S").reduce((a,b)=>a+b.valor,0),true)} sub="Líquido" color={G.gold} delay={.1}/>
      </div>
      <Panel title="⇄ Livro de Lançamentos" action={<><input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Buscar..." style={{background:G.surface,border:`1px solid ${G.rim}`,borderRadius:7,padding:"5px 11px",color:G.text,fontSize:11,outline:"none",width:140}}/><div style={{display:"flex",gap:4}}>{[["todos","Todos"],["E","↑ Entrada"],["S","↓ Saída"],["agendado","Agendado"]].map(([f,l])=><FilterBtn key={f} value={f} current={fil} onClick={setFil} label={l}/>)}</div><Btn onClick={()=>abrir(null)} small>✦ Novo</Btn></>}>
        {lanc.length>0&&<div style={{display:"flex",gap:16,marginBottom:11,padding:"8px 12px",background:G.surface,borderRadius:7,border:`1px solid ${G.rim}`}}><span style={{fontSize:11,color:G.sub}}>Entradas: <strong style={{color:G.emerald,fontFamily:"DM Mono"}}>{brl(totE)}</strong> · Saídas: <strong style={{color:G.crimson,fontFamily:"DM Mono"}}>{brl(totS)}</strong> · Líq.: <strong style={{color:G.gold,fontFamily:"DM Mono"}}>{brl(totE-totS,true)}</strong></span></div>}
        {lista.length===0?<Empty msg="Nenhum lançamento." sub="Clique em ✦ Novo para registrar."/>:(
          <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:780}}><thead><tr><TH>T</TH><TH>Descrição</TH><TH>Categoria</TH><TH>CC</TH><TH>Banco</TH><TH>Data</TH><TH>Status</TH><TH>Valor</TH><TH></TH></tr></thead>
          <tbody>{lista.map((l,i)=><tr key={l.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}><td style={{padding:"10px 11px",borderBottom:`1px solid ${G.rim}15`}}><div style={{width:26,height:26,borderRadius:6,background:l.tipo==="E"?`${G.emerald}20`:`${G.crimson}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:l.tipo==="E"?G.emerald:G.crimson}}>{l.tipo==="E"?"↑":"↓"}</div></td><TD clip>{l.desc}</TD><TD><Chip label={l.cat} color={l.tipo==="E"?G.emerald:G.amber}/></TD><TD small color={G.muted}>{l.cc}</TD><TD small color={G.muted}>{l.banco||"—"}</TD><TD mono small>{l.data}</TD><TD><Badge s={l.status}/></TD><TD mono bold color={l.tipo==="E"?G.emerald:G.crimson}>{l.tipo==="E"?"+":"-"}{brl(l.valor)}</TD><td style={{padding:"7px 8px",borderBottom:`1px solid ${G.rim}15`}}><div style={{display:"flex",gap:3}}><button onClick={()=>abrir(l)} style={{background:`${G.gold}15`,border:`1px solid ${G.gold}35`,color:G.gold,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✎</button><button onClick={()=>setDelConfirm(l)} style={{background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✕</button></div></td></tr>)}</tbody></table></div>
        )}
      </Panel>
      <Modal open={modal} onClose={fechar} title={editing?"✎ Editar Lançamento":"✦ Novo Lançamento"}>
        <Field label="Descrição" value={form.desc||""} onChange={v=>setForm(p=>({...p,desc:v}))} placeholder="Descreva o lançamento"/>
        <G2><Field label="Tipo" value={form.tipo||"E"} onChange={v=>setForm(p=>({...p,tipo:v}))} opts={["E","S"]}/><Field label="Valor (R$)" value={form.valor||""} onChange={v=>setForm(p=>({...p,valor:v}))} type="number" mono placeholder="0,00"/></G2>
        <G2><DatePicker label="Data" value={form.data||fd(T)} onChange={v=>setForm(p=>({...p,data:v}))}/><Field label="Status" value={form.status||"efetivado"} onChange={v=>setForm(p=>({...p,status:v}))} opts={["efetivado","agendado","previsto"]}/></G2>
        <G2><Field label="Categoria" value={form.cat||"Vendas"} onChange={v=>setForm(p=>({...p,cat:v}))} opts={cats}/><Field label="Centro de Custo" value={form.cc||"Comercial"} onChange={v=>setForm(p=>({...p,cc:v}))} opts={["Comercial","Administrativo","RH","Marketing","TI","Projetos","Financeiro","Compras"]}/></G2>
        <G2><Field label="Banco" value={form.banco||""} onChange={v=>setForm(p=>({...p,banco:v}))} opts={bancos.length?["—",...bancos.map(b=>b.nome)]:["—"]}/><Field label="Observação" value={form.obs||""} onChange={v=>setForm(p=>({...p,obs:v}))} placeholder="Opcional"/></G2>
        <div style={{display:"flex",gap:8,marginTop:10}}><Btn v="ghost" onClick={fechar}>Cancelar</Btn><Btn onClick={salvar}>{editing?"✔ Salvar":"✦ Registrar"}</Btn></div>
      </Modal>
      <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="⚠ Excluir" width={400}>
        {delConfirm&&<><div style={{background:G.surface,borderRadius:10,padding:14,marginBottom:16,border:`1px solid ${G.rimGold}`}}><div style={{fontSize:13,color:G.text}}>{delConfirm.desc}</div><div style={{fontFamily:"DM Mono",fontSize:15,color:delConfirm.tipo==="E"?G.emerald:G.crimson,fontWeight:700}}>{brl(delConfirm.valor)}</div></div><p style={{color:G.sub,fontSize:12,marginBottom:16}}>Esta ação é irreversível.</p><div style={{display:"flex",gap:8}}><Btn v="ghost" onClick={()=>setDelConfirm(null)}>Cancelar</Btn><Btn v="danger" onClick={()=>excluir(delConfirm.id)}>✕ Excluir</Btn></div></>}
      </Modal>
    </div>
  );
}

/* ── CONCILIAÇÃO ── (preservada do v3, resumida) */
function ModConciliacao({cp,setCP,cr,setCR,mov,setMov}){
  const [aba,setAba]=useState("import");const [extratoLinhas,setExtratoLinhas]=useState([]);const [vinculacoes,setVinculacoes]=useState({});const [addMovModal,setAddMovModal]=useState(false);const [movForm,setMovForm]=useState({});const fileRef=useRef(null);
  const baixasCP=cp.filter(t=>t.status==="pago");const baixasCR=cr.filter(t=>t.status==="recebido");
  const calcScore=(e,s)=>{let sc=0;const cnpjOk=e.cnpj&&s.cnpj&&e.cnpj===s.cnpj;const razaoE=(e.descricao||"").toLowerCase();const razaoS=(s.razao||s.credor||s.devedor||"").toLowerCase();const words=razaoS.split(" ").filter(w=>w.length>3);const razaoMatch=words.some(w=>razaoE.includes(w));const valMatch=Math.abs(Math.abs(parseFloat(e.valor))-parseFloat(s.valor))<0.02;if(cnpjOk)sc+=4;if(razaoMatch)sc+=2;if(valMatch)sc+=4;return{score:sc,cnpjOk,razaoMatch,valMatch};};
  const sistemaItens=[...baixasCP.map(t=>({...t,_tipo:"CP",_valor:t.valor,_desc:t.razao||t.credor})),...baixasCR.map(t=>({...t,_tipo:"CR",_valor:t.valor,_desc:t.razao||t.devedor}))];
  const parseCSV=text=>{const linhas=text.trim().split("\n").filter(l=>l.trim());if(linhas.length<2)return null;const sep=linhas[0].includes(";")?";":",";const headers=linhas[0].split(sep).map(h=>h.replace(/"/g,"").trim().toLowerCase());return linhas.slice(1).map(l=>{const cols=l.split(sep).map(c=>c.replace(/"/g,"").trim());const obj={_id:uid()};headers.forEach((h,j)=>{obj[h]=cols[j]||"";});obj.data=obj.data||obj.date||obj.dt||"";obj.descricao=obj.descricao||obj.description||obj.historico||obj.memo||"";obj.valor=parseFloat(String(obj.valor||obj.value||obj.amount||"0").replace(/\./g,"").replace(",","."))||0;obj.cnpj=obj.cnpj||obj.doc||"";obj.conciliado=false;return obj;});};
  const onFileImport=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{const linhas=parseCSV(ev.target.result);if(!linhas){alert("CSV inválido.");return;}setExtratoLinhas(linhas);setVinculacoes({});setAba("extrato");};reader.readAsText(file,"UTF-8");e.target.value="";};
  const vincular=(extId,sisId,sisType)=>setVinculacoes(p=>({...p,[extId]:{sisId,sisType}}));
  const desvincular=extId=>setVinculacoes(p=>{const n={...p};delete n[extId];return n;});
  const fecharConciliacao=()=>{const idsCP=Object.values(vinculacoes).filter(v=>v.sisType==="cp").map(v=>v.sisId);const idsCR=Object.values(vinculacoes).filter(v=>v.sisType==="cr").map(v=>v.sisId);setExtratoLinhas(p=>p.map(m=>vinculacoes[m._id]?{...m,conciliado:true}:m));if(idsCP.length)setCP(p=>p.map(t=>idsCP.includes(t.id)?{...t,status:"pago"}:t));if(idsCR.length)setCR(p=>p.map(t=>idsCR.includes(t.id)?{...t,status:"recebido"}:t));setAba("resultado");};
  const addManual=()=>{setExtratoLinhas(p=>[...p,{_id:uid(),data:movForm.data||fd(T),descricao:movForm.descricao||"",valor:parseFloat(movForm.valor)||0,cnpj:movForm.cnpj||"",conciliado:false}]);setAddMovModal(false);setMovForm({});setAba("extrato");};
  const totalConc=extratoLinhas.filter(m=>m.conciliado||vinculacoes[m._id]).length;
  return(
    <div className="anim">
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        <Kpi icon="📄" label="Extrato (linhas)" value={String(extratoLinhas.length)} sub="movimentações importadas" color={G.sapphire} delay={0}/>
        <Kpi icon="↓" label="Baixas CP" value={String(baixasCP.length)} sub="contas pagas" color={G.gold} delay={.05}/>
        <Kpi icon="↑" label="Baixas CR" value={String(baixasCR.length)} sub="recebimentos" color={G.emerald} delay={.1}/>
        <Kpi icon="⊛" label="Conciliadas" value={String(totalConc)} sub={`${extratoLinhas.length-totalConc} pendentes`} color={G.teal} delay={.15}/>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        {[["import","⬆ Importar"],["extrato","🏦 Extrato"],["sistema","⇄ Sistema"],["comparar","⊛ Conciliar"],["resultado","✔ Resultado"]].map(([id,l])=><FilterBtn key={id} value={id} current={aba} onClick={setAba} label={l}/>)}
      </div>
      {aba==="import"&&<Panel title="⬆ Importar Extrato Bancário" sub="Upload de CSV ou adição manual">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{background:G.surface,border:`2px dashed ${G.rim}`,borderRadius:12,padding:32,textAlign:"center",cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={onFileImport}/>
            <div style={{fontSize:36,marginBottom:12}}>📂</div>
            <div style={{fontSize:14,color:G.champ,fontWeight:600,marginBottom:6}}>Upload CSV do Banco</div>
            <div style={{fontSize:11,color:G.muted,marginBottom:14}}>Clique para selecionar arquivo .csv</div>
            <Btn small>Selecionar Arquivo</Btn>
          </div>
          <div style={{background:G.surface,border:`1px solid ${G.rim}`,borderRadius:12,padding:24}}>
            <div style={{fontSize:14,color:G.champ,fontWeight:600,marginBottom:6,fontFamily:"Playfair Display"}}>✦ Adicionar Manualmente</div>
            <div style={{fontSize:11,color:G.muted,marginBottom:16}}>Adicione movimentações uma a uma.</div>
            <Btn onClick={()=>{setMovForm({data:fd(T),descricao:"",valor:"",cnpj:""});setAddMovModal(true);}}>✦ Nova Movimentação</Btn>
            {extratoLinhas.length>0&&<div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${G.rim}`}}><div style={{fontSize:11,color:G.emerald,marginBottom:8}}>✔ {extratoLinhas.length} linha(s) carregada(s)</div><Btn v="teal" small onClick={()=>setAba("extrato")}>Ver Extrato →</Btn></div>}
          </div>
        </div>
        <div style={{marginTop:16,background:`${G.sapphire}08`,border:`1px solid ${G.sapphire}20`,borderRadius:10,padding:14}}>
          <div style={{fontSize:11,color:G.sapphire,fontWeight:700,marginBottom:6}}>📋 Formato CSV esperado</div>
          <div style={{fontFamily:"DM Mono",fontSize:10,color:G.muted,background:G.deep,borderRadius:7,padding:"8px 12px",lineHeight:1.8}}>data;descricao;valor;cnpj<br/>2026-05-01;Pagamento Fornecedor XYZ;-12800.00;12.345.678/0001-99</div>
        </div>
      </Panel>}
      {aba==="extrato"&&<Panel title="🏦 Extrato Bancário" action={<><Btn v="blue" small onClick={()=>fileRef.current?.click()}>⬆ Re-importar</Btn><input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={onFileImport}/><Btn small onClick={()=>{setMovForm({data:fd(T)});setAddMovModal(true);}}>✦ Adicionar</Btn></>}>
        {extratoLinhas.length===0?<Empty msg="Nenhum extrato carregado." sub='Vá em "⬆ Importar" para carregar.'/>:(
          <><div style={{display:"flex",gap:16,marginBottom:12,padding:"8px 12px",background:G.surface,borderRadius:7,border:`1px solid ${G.rim}`}}>
            <span style={{fontSize:11,color:G.sub}}>Linhas: <strong style={{color:G.text}}>{extratoLinhas.length}</strong></span>
            <span style={{fontSize:11,color:G.sub}}>Entradas: <strong style={{color:G.emerald,fontFamily:"DM Mono"}}>{brl(extratoLinhas.filter(m=>m.valor>0).reduce((a,b)=>a+b.valor,0))}</strong></span>
            <span style={{fontSize:11,color:G.sub}}>Saídas: <strong style={{color:G.crimson,fontFamily:"DM Mono"}}>{brl(extratoLinhas.filter(m=>m.valor<0).reduce((a,b)=>a+Math.abs(b.valor),0))}</strong></span>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Data</TH><TH>Descrição</TH><TH>CNPJ</TH><TH>Valor</TH><TH>Status</TH><TH></TH></tr></thead>
          <tbody>{extratoLinhas.map((m,i)=>{const vinc=vinculacoes[m._id];return(<tr key={m._id} style={{background:m.conciliado||vinc?`${G.teal}08`:i%2===0?"transparent":`${G.surface}55`}}><TD mono small>{m.data}</TD><TD clip>{m.descricao}</TD><TD mono small>{m.cnpj||"—"}</TD><TD mono bold color={m.valor>=0?G.emerald:G.crimson}>{brl(m.valor,true)}</TD><td style={{padding:"8px 11px",borderBottom:`1px solid ${G.rim}15`}}>{m.conciliado?<Badge s="conciliado"/>:vinc?<span style={{fontSize:10,color:G.teal,background:`${G.teal}15`,border:`1px solid ${G.teal}30`,borderRadius:6,padding:"2px 8px",fontWeight:700}}>⇄ Vinculado</span>:<Badge s="pendente"/>}</td><td style={{padding:"6px 8px",borderBottom:`1px solid ${G.rim}15`}}>{!m.conciliado&&(vinc?<button onClick={()=>desvincular(m._id)} style={{background:"transparent",border:`1px solid ${G.muted}30`,color:G.muted,borderRadius:5,padding:"2px 7px",cursor:"pointer",fontSize:10}}>↩</button>:<button onClick={()=>setExtratoLinhas(p=>p.filter(x=>x._id!==m._id))} style={{background:`${G.crimson}12`,border:`1px solid ${G.crimson}30`,color:G.crimson,borderRadius:5,padding:"2px 7px",cursor:"pointer",fontSize:10}}>✕</button>)}</td></tr>);})}</tbody></table></>
        )}
      </Panel>}
      {aba==="sistema"&&<Panel title="⇄ Movimentos do Sistema" sub="Baixas de CP e CR disponíveis">
        {sistemaItens.length===0?<Empty msg="Nenhuma baixa registrada." sub="Dê baixa em CP ou CR primeiro."/>:(
          <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Tipo</TH><TH>Cód.</TH><TH>Nº Doc</TH><TH>Tipo Doc</TH><TH>Razão Social</TH><TH>CNPJ</TH><TH>Valor</TH><TH>Status</TH></tr></thead>
          <tbody>{sistemaItens.map((t,i)=>{const jaVinc=Object.values(vinculacoes).some(v=>v.sisId===t.id);return(<tr key={t.id} style={{background:jaVinc?`${G.teal}08`:i%2===0?"transparent":`${G.surface}55`}}><TD><Chip label={t._tipo} color={t._tipo==="CP"?G.crimson:G.emerald}/></TD><TD><span style={{fontFamily:"DM Mono",fontSize:9,color:G.gold,background:`${G.gold}12`,borderRadius:4,padding:"1px 6px"}}>{t.codigo_cad||"—"}</span></TD><TD mono small>{t.numDoc||"—"}</TD><TD><DocBadge tipo={t.tipoDoc}/></TD><TD clip bold>{t.razao||t.credor||t.devedor}</TD><TD mono small>{t.cnpj||"—"}</TD><TD mono bold color={t._tipo==="CP"?G.crimson:G.emerald}>{brl(t._valor)}</TD><TD>{jaVinc?<span style={{fontSize:10,color:G.teal,background:`${G.teal}15`,border:`1px solid ${G.teal}30`,borderRadius:6,padding:"2px 8px",fontWeight:700}}>⇄ Vinculado</span>:<Badge s={t.status}/>}</TD></tr>);})}</tbody></table>
        )}
      </Panel>}
      {aba==="comparar"&&<div>
        <div style={{background:`${G.sapphire}08`,border:`1px solid ${G.sapphire}22`,borderRadius:10,padding:"10px 16px",marginBottom:14,fontSize:11,color:G.sub}}>
          <strong style={{color:G.sapphire}}>Como conciliar:</strong> O sistema sugere correspondências automáticas por CNPJ, Razão Social e Valor. Clique em <strong style={{color:G.teal}}>⇄ Vincular</strong> para confirmar. Depois clique em <strong style={{color:G.emerald}}>✔ Fechar Conciliação</strong>.
        </div>
        {extratoLinhas.length===0?<Empty msg="Nenhum extrato importado." sub='Importe um extrato primeiro.'/>:(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <span style={{fontSize:12,color:G.sub}}>Vinculadas: <strong style={{color:G.teal}}>{Object.keys(vinculacoes).length}</strong> · Pendentes: <strong style={{color:G.amber}}>{extratoLinhas.filter(m=>!m.conciliado&&!vinculacoes[m._id]).length}</strong></span>
              <Btn v="ok" onClick={fecharConciliacao}>✔ Fechar Conciliação</Btn>
            </div>
            {extratoLinhas.map(extItem=>{
              const vinc=vinculacoes[extItem._id];const jaConc=extItem.conciliado;
              const sugs=sistemaItens.filter(s=>!Object.values(vinculacoes).some(v=>v.sisId===s.id)).map(s=>({...s,...calcScore(extItem,s)})).filter(s=>s.score>=2).sort((a,b)=>b.score-a.score).slice(0,3);
              return(
                <div key={extItem._id} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12,background:jaConc||vinc?`${G.teal}06`:G.panel,border:`1px solid ${jaConc||vinc?G.teal:G.rim}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:16,borderRight:`1px solid ${G.rim}`}}>
                    <div style={{fontSize:9,color:G.sapphire,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:700}}>🏦 Extrato</div>
                    <div style={{fontSize:13,color:G.text,fontWeight:600,marginBottom:6}}>{extItem.descricao||"—"}</div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><span style={{fontFamily:"DM Mono",fontSize:13,color:extItem.valor>=0?G.emerald:G.crimson,fontWeight:700}}>{brl(extItem.valor,true)}</span><span style={{fontSize:10,color:G.muted}}>{extItem.data}</span>{extItem.cnpj&&<span style={{fontFamily:"DM Mono",fontSize:10,color:G.muted}}>{extItem.cnpj}</span>}</div>
                    {jaConc&&<div style={{marginTop:8}}><Badge s="conciliado"/></div>}
                  </div>
                  <div style={{padding:16}}>
                    <div style={{fontSize:9,color:G.emerald,textTransform:"uppercase",letterSpacing:1,marginBottom:8,fontWeight:700}}>⇄ Sistema CP/CR</div>
                    {jaConc?<div style={{fontSize:11,color:G.teal}}>✔ Conciliado</div>:vinc?(
                      <div>{sistemaItens.filter(s=>s.id===vinc.sisId).map(s=><div key={s.id} style={{background:`${G.teal}10`,border:`1px solid ${G.teal}30`,borderRadius:8,padding:"10px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:11,color:G.text,fontWeight:600}}>{s.razao||s.credor||s.devedor}</div><div style={{fontSize:10,color:G.muted}}>{s._tipo} · {brl(s._valor)}</div></div><button onClick={()=>desvincular(extItem._id)} style={{background:"transparent",border:`1px solid ${G.muted}25`,color:G.muted,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:10}}>↩</button></div>)}</div>
                    ):sugs.length===0?(
                      <div>
                        <div style={{background:`${G.amber}10`,border:`1px solid ${G.amber}25`,borderRadius:8,padding:"10px 12px",marginBottom:8}}><div style={{fontSize:11,color:G.amber}}>⚠ Sem correspondência automática</div></div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{sistemaItens.filter(s=>!Object.values(vinculacoes).some(v=>v.sisId===s.id)).slice(0,4).map(s=><button key={s.id} onClick={()=>vincular(extItem._id,s.id,s._tipo.toLowerCase())} style={{background:`${G.sapphire}12`,border:`1px solid ${G.sapphire}30`,color:G.sapphire,borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10}}>⇄ {(s.razao||s.credor||"—").split(" ")[0]} {brl(s._valor)}</button>)}</div>
                      </div>
                    ):(
                      <div>{sugs.map(s=><div key={s.id} style={{background:G.surface,border:`1px solid ${s.score>=8?G.emerald:s.score>=5?G.amber:G.rim}`,borderRadius:8,padding:"10px 12px",marginBottom:7}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div><div style={{fontSize:11,color:G.text,fontWeight:600}}>{s.razao||s.credor||s.devedor}</div><div style={{fontSize:10,color:G.muted}}>{s._tipo} · {s.codigo_cad||s.numDoc||"—"} · {brl(s._valor)}</div></div><Btn v="teal" small onClick={()=>vincular(extItem._id,s.id,s._tipo.toLowerCase())}>⇄ Vincular</Btn></div>
                        <div style={{display:"flex",gap:4}}><span style={{fontSize:9,color:s.score>=8?G.emerald:s.score>=5?G.amber:G.crimson,background:`${s.score>=8?G.emerald:s.score>=5?G.amber:G.crimson}15`,padding:"1px 6px",borderRadius:3,fontWeight:700}}>Score {s.score}/10</span><span style={{fontSize:9,color:s.cnpjOk?G.emerald:G.crimson,background:`${s.cnpjOk?G.emerald:G.crimson}12`,padding:"1px 6px",borderRadius:3}}>{s.cnpjOk?"✔":"✗"} CNPJ</span><span style={{fontSize:9,color:s.razaoMatch?G.emerald:G.crimson,background:`${s.razaoMatch?G.emerald:G.crimson}12`,padding:"1px 6px",borderRadius:3}}>{s.razaoMatch?"✔":"✗"} Razão</span><span style={{fontSize:9,color:s.valMatch?G.emerald:G.crimson,background:`${s.valMatch?G.emerald:G.crimson}12`,padding:"1px 6px",borderRadius:3}}>{s.valMatch?"✔":"✗"} Valor</span></div>
                      </div>)}</div>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}><Btn v="ok" onClick={fecharConciliacao}>✔ Fechar Conciliação</Btn></div>
          </>
        )}
      </div>}
      {aba==="resultado"&&<Panel title="✔ Resultado da Conciliação">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
          <div style={{background:G.surface,border:`1px solid ${G.teal}30`,borderRadius:10,padding:14}}><div style={{fontSize:10,color:G.muted,marginBottom:4}}>Conciliadas</div><div style={{fontFamily:"DM Mono",fontSize:20,color:G.teal,fontWeight:700}}>{extratoLinhas.filter(m=>m.conciliado).length}</div></div>
          <div style={{background:G.surface,border:`1px solid ${G.amber}30`,borderRadius:10,padding:14}}><div style={{fontSize:10,color:G.muted,marginBottom:4}}>Pendentes</div><div style={{fontFamily:"DM Mono",fontSize:20,color:G.amber,fontWeight:700}}>{extratoLinhas.filter(m=>!m.conciliado&&!vinculacoes[m._id]).length}</div></div>
          <div style={{background:G.surface,border:`1px solid ${G.gold}30`,borderRadius:10,padding:14}}><div style={{fontSize:10,color:G.muted,marginBottom:4}}>Total extrato</div><div style={{fontFamily:"DM Mono",fontSize:20,color:G.gold,fontWeight:700}}>{extratoLinhas.length}</div></div>
        </div>
        {extratoLinhas.length===0?<Empty msg="Nenhuma conciliação realizada."/>:(
          <><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Data</TH><TH>Descrição</TH><TH>Valor</TH><TH>Status</TH></tr></thead>
          <tbody>{extratoLinhas.map((m,i)=><tr key={m._id} style={{background:i%2===0?"transparent":`${G.surface}55`}}><TD mono small>{m.data}</TD><TD clip>{m.descricao}</TD><TD mono bold color={m.valor>=0?G.emerald:G.crimson}>{brl(m.valor,true)}</TD><TD><Badge s={m.conciliado||vinculacoes[m._id]?"conciliado":"pendente"}/></TD></tr>)}</tbody></table>
          <div style={{marginTop:12}}><Btn v="blue" onClick={()=>exportCSV("conciliacao",["Data","Descrição","Valor","Status"],extratoLinhas.map(m=>[m.data,m.descricao,m.valor,m.conciliado||vinculacoes[m._id]?"Conciliado":"Pendente"]))}>⬇ Exportar CSV</Btn></div></>
        )}
      </Panel>}
      <Modal open={addMovModal} onClose={()=>setAddMovModal(false)} title="✦ Adicionar Linha do Extrato" width={420}>
        <DatePicker label="Data" value={movForm.data||fd(T)} onChange={v=>setMovForm(p=>({...p,data:v}))}/>
        <Field label="Descrição" value={movForm.descricao||""} onChange={v=>setMovForm(p=>({...p,descricao:v}))} placeholder="Ex: Pagamento Fornecedor XYZ"/>
        <G2><Field label="Valor (negativo = saída)" value={movForm.valor||""} onChange={v=>setMovForm(p=>({...p,valor:v}))} type="number" mono placeholder="-1500.00"/><Field label="CNPJ" value={movForm.cnpj||""} onChange={v=>setMovForm(p=>({...p,cnpj:v}))} mono placeholder="00.000.000/0001-00"/></G2>
        <div style={{display:"flex",gap:8,marginTop:10}}><Btn v="ghost" onClick={()=>setAddMovModal(false)}>Cancelar</Btn><Btn onClick={addManual}>✦ Adicionar</Btn></div>
      </Modal>
    </div>
  );
}

/* ── RELATÓRIOS ── (preservado do v3) */
function ModRelatorios({lanc,cp,cr}){
  const [aba,setAba]=useState("dre");
  const totE=lanc.filter(l=>l.tipo==="E").reduce((a,b)=>a+b.valor,0);const totS=lanc.filter(l=>l.tipo==="S").reduce((a,b)=>a+b.valor,0);const lucro=totE-totS;const margem=totE?Math.round((lucro/totE)*100):0;
  const cpPend=cp.filter(t=>t.status==="pendente");const cpVenc=cp.filter(t=>t.status==="vencido");const crPend=cr.filter(t=>t.status==="pendente");const crVenc=cr.filter(t=>t.status==="vencido");
  return(
    <div className="anim">
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {[["dre","◈ DRE"],["fluxo","〜 Fluxo de Caixa"],["avencer","⏳ A Vencer"],["vencidos","⚠ Vencidos"],["futuros","◆ Futuros"]].map(([id,l])=><FilterBtn key={id} value={id} current={aba} onClick={setAba} label={l}/>)}
        <div style={{flex:1}}/><Btn v="blue" small onClick={()=>exportCSV("lancamentos",["Desc","Tipo","Valor","Data","Cat","Status"],lanc.map(l=>[l.desc,l.tipo,l.valor,l.data,l.cat,l.status]))}>⬇ Lançamentos</Btn>
        <Btn v="blue" small onClick={()=>exportCSV("cp",["Cód","Nº","Tipo","Credor","CNPJ","Valor","Venc","Status"],cp.map(t=>[t.codigo_cad,t.numDoc,t.tipoDoc,t.razao||t.credor,t.cnpj,t.valor,t.venc,t.status]))}>⬇ CP</Btn>
        <Btn v="blue" small onClick={()=>exportCSV("cr",["Cód","Nº","Tipo","Devedor","CNPJ","Valor","Venc","Status"],cr.map(t=>[t.codigo_cad,t.numDoc,t.tipoDoc,t.razao||t.devedor,t.cnpj,t.valor,t.venc,t.status]))}>⬇ CR</Btn>
      </div>
      {aba==="dre"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Panel title="◈ DRE — Demonstração do Resultado">
          {lanc.length===0?<Empty msg="Sem lançamentos." sub="Registre lançamentos para gerar DRE."/>:[
            {l:"RECEITA BRUTA",v:totE,c:G.emerald,bold:true},{l:"Vendas/Serviços",v:lanc.filter(l=>l.tipo==="E"&&(l.cat==="Vendas"||l.cat==="Serviços")).reduce((a,b)=>a+b.valor,0),c:G.muted},{l:"Contratos",v:lanc.filter(l=>l.tipo==="E"&&l.cat==="Contratos").reduce((a,b)=>a+b.valor,0),c:G.muted},{l:"Outros",v:lanc.filter(l=>l.tipo==="E"&&!["Vendas","Serviços","Contratos"].includes(l.cat)).reduce((a,b)=>a+b.valor,0),c:G.muted},
            {sep:true},{l:"(-) DESPESAS",v:-totS,c:G.crimson,bold:true},{l:"RH",v:-lanc.filter(l=>l.tipo==="S"&&l.cat==="RH").reduce((a,b)=>a+b.valor,0),c:G.muted},{l:"Fornecedores",v:-lanc.filter(l=>l.tipo==="S"&&l.cat==="Fornecedores").reduce((a,b)=>a+b.valor,0),c:G.muted},{l:"Marketing",v:-lanc.filter(l=>l.tipo==="S"&&l.cat==="Marketing").reduce((a,b)=>a+b.valor,0),c:G.muted},{l:"Outros",v:-lanc.filter(l=>l.tipo==="S"&&!["RH","Fornecedores","Marketing"].includes(l.cat)).reduce((a,b)=>a+b.valor,0),c:G.muted},
            {sep:true},{l:"LUCRO OPERACIONAL",v:lucro,c:lucro>=0?G.emerald:G.crimson,bold:true},{l:"Margem",pct:`${margem}%`,c:G.gold,bold:true},
          ].map((r,i)=>r.sep?<Divider key={i}/>:<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${G.rim}15`}}><span style={{fontSize:r.bold?13:12,color:r.bold?G.champ:G.sub,fontWeight:r.bold?700:400,paddingLeft:r.bold?0:12}}>{r.l}</span>{r.pct?<span style={{fontFamily:"DM Mono",fontSize:15,color:r.c,fontWeight:800}}>{r.pct}</span>:<span style={{fontFamily:"DM Mono",fontSize:r.bold?15:12,color:r.c,fontWeight:r.bold?800:500}}>{r.v!==0?brl(r.v):"—"}</span>}</div>)}
        </Panel>
        <Panel title="◆ Resumo">
          {[{l:"CP Pendente",v:brl(cpPend.reduce((a,b)=>a+b.valor,0)),c:G.amber},{l:"CR Pendente",v:brl(crPend.reduce((a,b)=>a+b.valor,0)),c:G.sapphire},{l:"CP Vencido",v:brl(cpVenc.reduce((a,b)=>a+b.valor,0)),c:G.crimson},{l:"CR Inadimpl.",v:brl(crVenc.reduce((a,b)=>a+b.valor,0)),c:G.crimson}].map(r=><div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${G.rim}15`}}><span style={{fontSize:12,color:G.sub}}>{r.l}</span><span style={{fontFamily:"DM Mono",fontSize:13,color:r.c,fontWeight:700}}>{r.v}</span></div>)}
        </Panel>
      </div>}
      {aba==="fluxo"&&(()=>{let acum=0;const proj=[...crPend.map(t=>({data:t.venc,desc:`↑ ${t.razao||t.devedor}`,val:t.valor,tipo:"E",doc:t.numDoc})),...cpPend.map(t=>({data:t.venc,desc:`↓ ${t.razao||t.credor}`,val:-t.valor,tipo:"S",doc:t.numDoc}))].sort((a,b)=>new Date(a.data)-new Date(b.data)).map(p=>{acum+=p.val;return{...p,acum};});
        return<Panel title="〜 Fluxo de Caixa Projetado" action={<Btn v="blue" small onClick={()=>exportCSV("fluxo",["Data","Desc","Doc","Tipo","Valor","Acum"],proj.map(p=>[p.data,p.desc,p.doc,p.tipo,p.val,p.acum]))}>⬇ CSV</Btn>}>
          {proj.length===0?<Empty msg="Sem projeção." sub="Cadastre títulos em CP e CR."/>:<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Data</TH><TH>Descrição</TH><TH>Nº Doc</TH><TH>Tipo</TH><TH>Valor</TH><TH>Saldo Acum.</TH></tr></thead><tbody>{proj.map((p,i)=><tr key={i} style={{background:i%2===0?"transparent":`${G.surface}55`}}><TD mono small>{p.data}</TD><TD clip>{p.desc}</TD><TD mono small>{p.doc||"—"}</TD><TD><Chip label={p.tipo==="E"?"↑ Entrada":"↓ Saída"} color={p.tipo==="E"?G.emerald:G.crimson}/></TD><TD mono bold color={p.tipo==="E"?G.emerald:G.crimson}>{brl(p.val,true)}</TD><TD mono bold color={p.acum>=0?G.gold:G.crimson}>{brl(p.acum)}</TD></tr>)}</tbody></table>}
        </Panel>;
      })()}
      {aba==="avencer"&&<Panel title="⏳ A Vencer" action={<Btn v="blue" small onClick={()=>exportCSV("avencer",["Tipo","Razão","CNPJ","Nº","Tipo Doc","Valor","Venc"],[...cpPend.map(t=>["CP",t.razao||t.credor,t.cnpj,t.numDoc,t.tipoDoc,t.valor,t.venc]),...crPend.map(t=>["CR",t.razao||t.devedor,t.cnpj,t.numDoc,t.tipoDoc,t.valor,t.venc])])}>⬇ CSV</Btn>}>
        {[...cpPend,...crPend].length===0?<Empty msg="Nenhum título a vencer."/>:<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Tipo</TH><TH>Cód.</TH><TH>Razão Social</TH><TH>CNPJ</TH><TH>Nº Doc</TH><TH>Tipo Doc</TH><TH>Vencimento</TH><TH>Valor</TH></tr></thead><tbody>{[...cpPend.map(t=>({...t,_tipo:"CP"})),...crPend.map(t=>({...t,_tipo:"CR"}))].sort((a,b)=>new Date(a.venc)-new Date(b.venc)).map((t,i)=><tr key={t.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}><TD><Chip label={t._tipo} color={t._tipo==="CP"?G.crimson:G.emerald}/></TD><TD><span style={{fontFamily:"DM Mono",fontSize:9,color:G.gold,background:`${G.gold}12`,borderRadius:4,padding:"1px 6px"}}>{t.codigo_cad||"—"}</span></TD><TD clip>{t.razao||t.credor||t.devedor}</TD><TD mono small>{t.cnpj||"—"}</TD><TD mono small>{t.numDoc||"—"}</TD><TD><DocBadge tipo={t.tipoDoc||"—"}/></TD><TD mono small>{t.venc}</TD><TD mono bold color={t._tipo==="CP"?G.crimson:G.emerald}>{brl(t.valor)}</TD></tr>)}</tbody></table>}
      </Panel>}
      {aba==="vencidos"&&<Panel title="⚠ Vencidos" action={<Btn v="blue" small onClick={()=>exportCSV("vencidos",["Tipo","Razão","CNPJ","Nº","Valor","Vencido"],[...cpVenc.map(t=>["CP",t.razao||t.credor,t.cnpj,t.numDoc,t.valor,t.venc]),...crVenc.map(t=>["CR",t.razao||t.devedor,t.cnpj,t.numDoc,t.valor,t.venc])])}>⬇ CSV</Btn>}>
        {[...cpVenc,...crVenc].length===0?<Empty msg="✔ Nenhum título vencido!" sub="Tudo em dia."/>:<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Tipo</TH><TH>Cód.</TH><TH>Razão Social</TH><TH>CNPJ</TH><TH>Nº Doc</TH><TH>Tipo Doc</TH><TH>Vencido em</TH><TH>Valor</TH></tr></thead><tbody>{[...cpVenc.map(t=>({...t,_tipo:"CP"})),...crVenc.map(t=>({...t,_tipo:"CR"}))].sort((a,b)=>new Date(a.venc)-new Date(b.venc)).map((t,i)=><tr key={t.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}><TD><Chip label={t._tipo} color={G.crimson}/></TD><TD><span style={{fontFamily:"DM Mono",fontSize:9,color:G.crimson,background:`${G.crimson}12`,borderRadius:4,padding:"1px 6px"}}>{t.codigo_cad||"—"}</span></TD><TD clip color={G.crimson}>{t.razao||t.credor||t.devedor}</TD><TD mono small>{t.cnpj||"—"}</TD><TD mono small>{t.numDoc||"—"}</TD><TD><DocBadge tipo={t.tipoDoc||"—"}/></TD><TD mono small color={G.crimson}>{t.venc}</TD><TD mono bold color={G.crimson}>{brl(t.valor)}</TD></tr>)}</tbody></table>}
      </Panel>}
      {aba==="futuros"&&<Panel title="◆ Pagamentos Futuros — 90 dias">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>{["30","60","90"].map(d=>{const ve=crPend.filter(t=>{const diff=(new Date(t.venc)-T)/(1000*86400);return diff>=0&&diff<=parseInt(d);}).reduce((a,b)=>a+b.valor,0);const vs=cpPend.filter(t=>{const diff=(new Date(t.venc)-T)/(1000*86400);return diff>=0&&diff<=parseInt(d);}).reduce((a,b)=>a+b.valor,0);return<div key={d} style={{background:G.surface,borderRadius:9,padding:13,border:`1px solid ${G.rim}`}}><div style={{fontSize:10,color:G.muted,marginBottom:6}}>Próximos {d} dias</div><div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:10,color:G.emerald}}>↑ CR</span><span style={{fontFamily:"DM Mono",fontSize:12,color:G.emerald,fontWeight:700}}>{brl(ve)}</span></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:G.crimson}}>↓ CP</span><span style={{fontFamily:"DM Mono",fontSize:12,color:G.crimson,fontWeight:700}}>{brl(vs)}</span></div><div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${G.rim}`,display:"flex",justifyContent:"space-between"}}><span style={{fontSize:10,color:G.muted}}>Líquido</span><span style={{fontFamily:"DM Mono",fontSize:12,color:ve-vs>=0?G.gold:G.crimson,fontWeight:700}}>{brl(ve-vs,true)}</span></div></div>;})}
        </div>
        {[...crPend,...cpPend].filter(t=>new Date(t.venc)>T).length===0?<Empty msg="Sem previsões."/>:<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr><TH>Tipo</TH><TH>Cód.</TH><TH>Razão</TH><TH>CNPJ</TH><TH>Nº Doc</TH><TH>Cat.</TH><TH>Vencimento</TH><TH>Valor</TH></tr></thead><tbody>{[...crPend.map(t=>({...t,_tipo:"CR"})),...cpPend.map(t=>({...t,_tipo:"CP"}))].filter(t=>new Date(t.venc)>T).sort((a,b)=>new Date(a.venc)-new Date(b.venc)).map((t,i)=><tr key={t.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}><TD><Chip label={t._tipo} color={t._tipo==="CR"?G.emerald:G.crimson}/></TD><TD><span style={{fontFamily:"DM Mono",fontSize:9,color:G.gold,background:`${G.gold}12`,borderRadius:4,padding:"1px 6px"}}>{t.codigo_cad||"—"}</span></TD><TD clip>{t.razao||t.devedor||t.credor}</TD><TD mono small>{t.cnpj||"—"}</TD><TD mono small>{t.numDoc||"—"}</TD><TD><Chip label={t.cat} color={G.sapphire}/></TD><TD mono small>{t.venc}</TD><TD mono bold color={t._tipo==="CR"?G.emerald:G.crimson}>{brl(t.valor)}</TD></tr>)}</tbody></table>}
      </Panel>}
    </div>
  );
}

/* ── CADASTROS — estado agora é PROP, vindo do App ── */
function ModCadastros({fornecedores,setForn,clientes,setCli,bancos,setBancos,tiposMov,setTiposMov}){
  const [aba,setAba]=useState("fornecedores");const [modal,setModal]=useState(false);const [editItem,setEditItem]=useState(null);const [form,setForm]=useState({});const [delConfirm,setDelConfirm]=useState(null);const [q,setQ]=useState("");
  const GRP_COLORS={tarifa:G.crimson,rendimento_cc:G.emerald,rendimento_inv:G.violet};
  const BLANK={
    fornecedores:{id:"",codigo:"",razao:"",fantasia:"",cnpj:"",cat:"Fornecedores",email:"",tel:"",status:"ativo"},
    clientes:{id:"",codigo:"",razao:"",fantasia:"",cnpj:"",cat:"Vendas",email:"",tel:"",limite:"",status:"ativo"},
    bancos:{id:"",nome:"",numero:"",agencia:"",conta:"",tipo:"Corrente",saldo:"",taxa:"",limite:"",cor:G.gold},
    tiposmov:{id:"",nome:"",grupo:"tarifa",conta:"Corrente",descricao:""},
  };
  const abrir=item=>{
    setEditItem(item||null);
    if(item){setForm({...item});}
    else{
      // Gera código automático
      const newCod=aba==="fornecedores"?nextCodigo(fornecedores,"FRN"):aba==="clientes"?nextCodigo(clientes,"CLI"):""  ;
      setForm({...BLANK[aba],codigo:newCod});
    }
    setModal(true);
  };
  const fechar=()=>{setModal(false);setEditItem(null);};
  const salvar=()=>{
    const item={...form,id:editItem?editItem.id:uid(),saldo:parseFloat(form.saldo)||0,limite:parseFloat(form.limite)||0,taxa:parseFloat(form.taxa)||0};
    const ops={fornecedores:[fornecedores,setForn],clientes:[clientes,setCli],bancos:[bancos,setBancos],tiposmov:[tiposMov,setTiposMov]};
    const [list,setter]=ops[aba];
    if(editItem)setter(list.map(x=>x.id===editItem.id?item:x));else setter([...list,item]);
    fechar();
  };
  const excluir=id=>{const ops={fornecedores:[fornecedores,setForn],clientes:[clientes,setCli],bancos:[bancos,setBancos],tiposmov:[tiposMov,setTiposMov]};const[list,setter]=ops[aba];setter(list.filter(x=>x.id!==id));setDelConfirm(null);};
  const filtrar=lista=>!q?lista:lista.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase()));

  return(
    <div className="anim">
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {[["fornecedores","◆ Fornecedores"],["clientes","◈ Clientes"],["bancos","🏦 Bancos"],["tiposmov","⇄ Tipos de Mov."]].map(([id,l])=><FilterBtn key={id} value={id} current={aba} onClick={v=>{setAba(v);setQ("");}} label={l}/>)}
        <div style={{flex:1}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Buscar..." style={{background:G.surface,border:`1px solid ${G.rim}`,borderRadius:7,padding:"5px 11px",color:G.text,fontSize:11,outline:"none",width:160}}/>
      </div>

      {aba==="fornecedores"&&<Panel title="◆ Cadastro de Fornecedores" sub="Código gerado automaticamente" action={<Btn onClick={()=>abrir(null)} small>✦ Novo Fornecedor</Btn>}>
        {filtrar(fornecedores).length===0?<Empty msg="Nenhum fornecedor cadastrado." sub="Clique em ✦ Novo Fornecedor para cadastrar."/>:(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Código</TH><TH>Razão Social</TH><TH>Fantasia</TH><TH>CNPJ</TH><TH>Categoria</TH><TH>E-mail</TH><TH>Telefone</TH><TH>Status</TH><TH></TH></tr></thead>
            <tbody>{filtrar(fornecedores).map((f,i)=><tr key={f.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}>
              <TD><span style={{fontFamily:"DM Mono",fontSize:10,color:G.gold,background:`${G.gold}15`,border:`1px solid ${G.gold}30`,borderRadius:5,padding:"2px 8px",fontWeight:700}}>{f.codigo||"—"}</span></TD>
              <TD bold>{f.razao}</TD><TD small>{f.fantasia}</TD><TD mono small>{f.cnpj}</TD>
              <TD><Chip label={f.cat} color={G.gold}/></TD><TD small color={G.muted}>{f.email}</TD><TD small color={G.muted}>{f.tel}</TD>
              <TD><Badge s={f.status==="ativo"?"efetivado":"vencido"}/></TD>
              <td style={{padding:"7px 8px",borderBottom:`1px solid ${G.rim}15`}}><div style={{display:"flex",gap:3}}><button onClick={()=>abrir(f)} style={{background:`${G.gold}15`,border:`1px solid ${G.gold}35`,color:G.gold,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✎</button><button onClick={()=>setDelConfirm(f)} style={{background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✕</button></div></td>
            </tr>)}</tbody>
          </table>
        )}
      </Panel>}

      {aba==="clientes"&&<Panel title="◈ Cadastro de Clientes" sub="Código gerado automaticamente" action={<Btn onClick={()=>abrir(null)} small>✦ Novo Cliente</Btn>}>
        {filtrar(clientes).length===0?<Empty msg="Nenhum cliente cadastrado." sub="Clique em ✦ Novo Cliente para cadastrar."/>:(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr><TH>Código</TH><TH>Razão Social</TH><TH>Fantasia</TH><TH>CNPJ</TH><TH>Categoria</TH><TH>E-mail</TH><TH>Limite</TH><TH>Status</TH><TH></TH></tr></thead>
            <tbody>{filtrar(clientes).map((c,i)=><tr key={c.id} style={{background:i%2===0?"transparent":`${G.surface}55`}}>
              <TD><span style={{fontFamily:"DM Mono",fontSize:10,color:G.emerald,background:`${G.emerald}15`,border:`1px solid ${G.emerald}30`,borderRadius:5,padding:"2px 8px",fontWeight:700}}>{c.codigo||"—"}</span></TD>
              <TD bold>{c.razao}</TD><TD small>{c.fantasia}</TD><TD mono small>{c.cnpj}</TD>
              <TD><Chip label={c.cat} color={G.emerald}/></TD><TD small color={G.muted}>{c.email}</TD>
              <TD mono small color={G.gold}>{brl(c.limite||0)}</TD>
              <TD><Badge s={c.status==="ativo"?"efetivado":"vencido"}/></TD>
              <td style={{padding:"7px 8px",borderBottom:`1px solid ${G.rim}15`}}><div style={{display:"flex",gap:3}}><button onClick={()=>abrir(c)} style={{background:`${G.gold}15`,border:`1px solid ${G.gold}35`,color:G.gold,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✎</button><button onClick={()=>setDelConfirm(c)} style={{background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✕</button></div></td>
            </tr>)}</tbody>
          </table>
        )}
      </Panel>}

      {aba==="bancos"&&<Panel title="🏦 Bancos & Contas" action={<Btn onClick={()=>abrir(null)} small>✦ Novo Banco</Btn>}>
        {filtrar(bancos).length===0?<Empty msg="Nenhum banco cadastrado." sub="Clique em ✦ Novo Banco."/>:(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13}}>{filtrar(bancos).map(b=>(
            <div key={b.id} style={{background:G.surface,border:`1px solid ${G.rim}`,borderRadius:11,padding:16,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:b.cor||G.gold}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}><div style={{fontSize:13,color:G.champ,fontWeight:600}}>{b.nome}</div><Chip label={b.tipo} color={b.cor||G.gold}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8}}>
                <div><div style={{fontSize:9,color:G.muted,textTransform:"uppercase"}}>Banco</div><div style={{fontFamily:"DM Mono",fontSize:11,color:G.sub}}>{b.numero||"—"}</div></div>
                <div><div style={{fontSize:9,color:G.muted,textTransform:"uppercase"}}>Agência</div><div style={{fontFamily:"DM Mono",fontSize:11,color:G.sub}}>{b.agencia||"—"}</div></div>
                <div style={{gridColumn:"1/-1"}}><div style={{fontSize:9,color:G.muted,textTransform:"uppercase"}}>Conta</div><div style={{fontFamily:"DM Mono",fontSize:11,color:G.sub}}>{b.conta||"—"}</div></div>
              </div>
              <div style={{fontFamily:"DM Mono",fontSize:18,color:G.text,fontWeight:500}}>{brl(b.saldo)}</div>
              {b.taxa>0&&<div style={{fontSize:10,color:G.emerald,marginTop:3}}>Taxa: {b.taxa}% aa</div>}
              <div style={{display:"flex",gap:6,marginTop:12}}><button onClick={()=>abrir(b)} style={{background:`${G.gold}15`,border:`1px solid ${G.gold}35`,color:G.gold,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11}}>✎ Editar</button><button onClick={()=>setDelConfirm(b)} style={{background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson,borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11}}>✕</button></div>
            </div>
          ))}</div>
        )}
      </Panel>}

      {aba==="tiposmov"&&<Panel title="⇄ Tipos de Movimentação" action={<Btn onClick={()=>abrir(null)} small>✦ Novo Tipo</Btn>}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {["tarifa","rendimento_cc","rendimento_inv"].map(grp=>(
            <div key={grp} style={{background:G.surface,border:`1px solid ${G.rim}`,borderRadius:11,padding:16}}>
              <div style={{fontFamily:"Playfair Display",fontSize:13,color:GRP_COLORS[grp],marginBottom:12}}>{grp==="tarifa"?"◈ Tarifas":grp==="rendimento_cc"?"✦ Rendimento CC/Poupança":"◆ Rendimento Investimento"}</div>
              {filtrar(tiposMov).filter(t=>t.grupo===grp).map(t=><div key={t.id} style={{background:G.card,borderRadius:8,padding:"10px 12px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${G.rim}`}}><div><div style={{fontSize:12,color:G.text,marginBottom:2}}>{t.nome}</div><div style={{fontSize:10,color:G.muted}}>{t.conta} · {t.descricao}</div></div><div style={{display:"flex",gap:4}}><button onClick={()=>abrir(t)} style={{background:`${G.gold}15`,border:`1px solid ${G.gold}35`,color:G.gold,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✎</button><button onClick={()=>setDelConfirm(t)} style={{background:`${G.crimson}15`,border:`1px solid ${G.crimson}35`,color:G.crimson,borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✕</button></div></div>)}
              {filtrar(tiposMov).filter(t=>t.grupo===grp).length===0&&<p style={{fontSize:11,color:G.muted,textAlign:"center",padding:"12px 0"}}>Nenhum.</p>}
            </div>
          ))}
        </div>
      </Panel>}

      <Modal open={modal} onClose={fechar} title={editItem?`✎ Editar ${editItem.codigo||""}`:aba==="fornecedores"?"✦ Novo Fornecedor":aba==="clientes"?"✦ Novo Cliente":aba==="bancos"?"✦ Novo Banco":"✦ Novo Tipo"} width={520}>
        {(aba==="fornecedores"||aba==="clientes")&&<>
          {/* Código gerado automaticamente - exibição */}
          <div style={{background:`${G.gold}08`,border:`1px solid ${G.gold}20`,borderRadius:9,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:9,color:G.muted,textTransform:"uppercase",letterSpacing:.7}}>Código {aba==="fornecedores"?"do Fornecedor":"do Cliente"}</div>
            <div style={{fontFamily:"DM Mono",fontSize:16,color:G.gold,fontWeight:800,marginLeft:"auto"}}>{form.codigo||"—"}</div>
            <div style={{fontSize:9,color:G.muted}}>{editItem?"(existente)":"(gerado automaticamente)"}</div>
          </div>
          <G2><Field label="Razão Social" value={form.razao||""} onChange={v=>setForm(p=>({...p,razao:v}))} placeholder="Razão social completa"/><Field label="Nome Fantasia" value={form.fantasia||""} onChange={v=>setForm(p=>({...p,fantasia:v}))} placeholder="Nome fantasia"/></G2>
          <G2><Field label="CNPJ" value={form.cnpj||""} onChange={v=>setForm(p=>({...p,cnpj:v}))} mono placeholder="00.000.000/0001-00"/><Field label="Categoria" value={form.cat||(aba==="fornecedores"?"Fornecedores":"Vendas")} onChange={v=>setForm(p=>({...p,cat:v}))} opts={aba==="fornecedores"?["Fornecedores","Seguros","Serviços","TI","Imóveis","Outros"]:["Vendas","Contratos","Serviços","Outros"]}/></G2>
          <G2><Field label="E-mail" value={form.email||""} onChange={v=>setForm(p=>({...p,email:v}))} placeholder="email@empresa.com"/><Field label="Telefone" value={form.tel||""} onChange={v=>setForm(p=>({...p,tel:v}))} placeholder="(11) 3000-0000"/></G2>
          {aba==="clientes"&&<Field label="Limite de Crédito (R$)" value={form.limite||""} onChange={v=>setForm(p=>({...p,limite:v}))} type="number" mono placeholder="0,00"/>}
          <Field label="Status" value={form.status||"ativo"} onChange={v=>setForm(p=>({...p,status:v}))} opts={["ativo","inativo"]}/>
        </>}
        {aba==="bancos"&&<><G2><Field label="Nome do Banco" value={form.nome||""} onChange={v=>setForm(p=>({...p,nome:v}))} placeholder="Ex: Banco do Brasil"/><Field label="Número (ISPB)" value={form.numero||""} onChange={v=>setForm(p=>({...p,numero:v}))} mono placeholder="001"/></G2><G2><Field label="Agência" value={form.agencia||""} onChange={v=>setForm(p=>({...p,agencia:v}))} mono placeholder="0001-9"/><Field label="Conta" value={form.conta||""} onChange={v=>setForm(p=>({...p,conta:v}))} mono placeholder="12345-6"/></G2><G2><Field label="Tipo" value={form.tipo||"Corrente"} onChange={v=>setForm(p=>({...p,tipo:v}))} opts={["Corrente","Poupança","Investimento"]}/><Field label="Saldo (R$)" value={form.saldo||""} onChange={v=>setForm(p=>({...p,saldo:v}))} type="number" mono placeholder="0,00"/></G2><G2><Field label="Limite (R$)" value={form.limite||""} onChange={v=>setForm(p=>({...p,limite:v}))} type="number" mono placeholder="0,00"/><Field label="Taxa % aa" value={form.taxa||""} onChange={v=>setForm(p=>({...p,taxa:v}))} type="number" mono placeholder="0"/></G2></>}
        {aba==="tiposmov"&&<><Field label="Nome do Tipo" value={form.nome||""} onChange={v=>setForm(p=>({...p,nome:v}))} placeholder="Ex: Tarifa de Manutenção"/><G2><Field label="Grupo" value={form.grupo||"tarifa"} onChange={v=>setForm(p=>({...p,grupo:v}))} opts={["tarifa","rendimento_cc","rendimento_inv"]}/><Field label="Tipo de Conta" value={form.conta||"Corrente"} onChange={v=>setForm(p=>({...p,conta:v}))} opts={["Corrente","Poupança","Investimento"]}/></G2><Field label="Descrição" value={form.descricao||""} onChange={v=>setForm(p=>({...p,descricao:v}))} placeholder="Breve descrição"/></>}
        <div style={{display:"flex",gap:8,marginTop:12}}><Btn v="ghost" onClick={fechar}>Cancelar</Btn><Btn onClick={salvar}>{editItem?"✔ Salvar":"✦ Cadastrar"}</Btn></div>
      </Modal>
      <Modal open={!!delConfirm} onClose={()=>setDelConfirm(null)} title="⚠ Confirmar Exclusão" width={380}>
        {delConfirm&&<><div style={{background:G.surface,borderRadius:10,padding:14,marginBottom:16,border:`1px solid ${G.rimGold}`}}><span style={{fontFamily:"DM Mono",fontSize:10,color:G.gold,marginRight:8}}>{delConfirm.codigo||""}</span><span style={{fontSize:13,color:G.text}}>{delConfirm.razao||delConfirm.nome||"—"}</span></div><p style={{color:G.sub,fontSize:12,marginBottom:16}}>Esta ação é irreversível.</p><div style={{display:"flex",gap:8}}><Btn v="ghost" onClick={()=>setDelConfirm(null)}>Cancelar</Btn><Btn v="danger" onClick={()=>excluir(delConfirm.id)}>✕ Excluir</Btn></div></>}
      </Modal>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════
   NAV + APP com Melhorias 1, 3 e 4
   ════════════════════════════════════════════════════════════════ */
const NAV=[
  {id:"ia",       icon:"✦", label:"Áureo AI",         sub:"Analista Financeiro IA"},
  {id:"lanc",     icon:"⇄", label:"Lançamentos",       sub:"Registrar · Editar"},
  {id:"pagar",    icon:"↓", label:"Contas a Pagar",    sub:"Títulos & Obrigações"},
  {id:"receber",  icon:"↑", label:"Contas a Receber",  sub:"Recebíveis & Cobranças"},
  {id:"concil",   icon:"⊛", label:"Conciliação",       sub:"Extrato · Vincular · Fechar"},
  {id:"rel",      icon:"◈", label:"Relatórios",        sub:"DRE · Fluxo · Exportar"},
  {id:"cad",      icon:"⚙", label:"Cadastros",         sub:"Fornec. · Clientes · Bancos"},
  {id:"usuarios", icon:"👥", label:"Usuários",          sub:"Perfis · 2FA · Permissões"},
  {id:"empresas", icon:"🏢", label:"Empresas",          sub:"Multiempresa · Isolamento"},
];

function AppInner(){
  const {usuario,empresa,usuarios,setUsuarios,empresas,setEmpresas,logout,trocarEmpresa,podeAc}=useAuth();
  const [tab,setTab]=useState("ia");
  const [fornecedores,setForn]=useState([]);
  const [clientes,setCli]=useState([]);
  const [bancos,setBancos]=useState([]);
  const [tiposMov,setTiposMov]=useState(INIT_TIPOSMOV);
  const [cp,setCP]=useState([]);
  const [cr,setCR]=useState([]);
  const [lanc,setLanc]=useState([]);
  const [mov,setMov]=useState([]);

  const navVisivel=NAV.filter(n=>{
    if(n.id==="usuarios")return podeAc("usuarios","ver");
    if(n.id==="empresas")return podeAc("empresas","ver");
    return podeAc(n.id,"ver");
  });
  const active=NAV.find(n=>n.id===tab);
  const pd=PERFIS[usuario?.perfil];

  return(
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:"Outfit,sans-serif",color:G.text,display:"flex"}}>
      <style>{CSS}</style>
      {/* SIDEBAR */}
      <div style={{width:244,background:G.deep,borderRight:`1px solid ${G.rim}`,display:"flex",flexDirection:"column",padding:"22px 0",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"0 18px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:38,height:38,borderRadius:11,background:GRAD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:19,fontWeight:900,boxShadow:`0 6px 20px ${G.gold}35`}}>$</div>
            <div><div className="shimmer" style={{fontFamily:"Playfair Display",fontSize:17,fontWeight:700}}>Áureo ERP</div><div style={{fontSize:9,color:G.muted,letterSpacing:.8,textTransform:"uppercase"}}>Financial Suite</div></div>
          </div>
          <div style={{height:1,background:`linear-gradient(90deg,${G.gold}55,transparent)`,marginTop:16}}/>
        </div>
        <div style={{flex:1,padding:"0 9px",overflowY:"auto"}}>
          <div style={{fontSize:8,color:G.muted,textTransform:"uppercase",letterSpacing:1.4,padding:"0 9px",marginBottom:7}}>Módulos</div>
          {navVisivel.map(n=>{
            const alertas=n.id==="pagar"?cp.filter(t=>t.status==="vencido").length:n.id==="receber"?cr.filter(t=>t.status==="vencido").length:0;

            const cor=n.id==="ia"?G.violet:n.id==="usuarios"?"#9b6dff":n.id==="empresas"?"#2dd4a0":G.gold;
            return(
              <button key={n.id} onClick={()=>setTab(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 11px",borderRadius:10,border:"none",cursor:"pointer",marginBottom:2,background:tab===n.id?`${cor}15`:"transparent",transition:"all .18s",borderLeft:tab===n.id?`2px solid ${cor}`:"2px solid transparent",textAlign:"left"}}>
                <span style={{fontSize:15,color:tab===n.id?cor:G.muted,width:19,textAlign:"center"}}>{n.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:tab===n.id?G.champ:G.sub,fontWeight:tab===n.id?600:400}}>{n.label}</div>
                  <div style={{fontSize:9,color:G.muted,marginTop:1}}>{n.sub}</div>
                </div>
                {alertas>0&&<span style={{background:G.crimson,color:"#fff",fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 6px"}}>{alertas}</span>}
              </button>
            );
          })}
        </div>
        {/* Card empresa + usuário */}
        <div style={{padding:"12px 9px 0"}}>
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${G.gold}48,transparent)`,marginBottom:12}}/>
          {/* Empresa ativa */}
          <div style={{padding:"8px 11px",background:`${empresa?.cor||G.gold}08`,border:`1px solid ${empresa?.cor||G.gold}22`,borderRadius:9,marginBottom:7}}>
            <div style={{fontSize:8,color:G.muted,textTransform:"uppercase",letterSpacing:.7,marginBottom:3}}>Empresa Ativa</div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{width:24,height:24,borderRadius:6,background:`${empresa?.cor||G.gold}20`,border:`1px solid ${empresa?.cor||G.gold}35`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"DM Mono",fontSize:9,fontWeight:700,color:empresa?.cor||G.gold}}>{empresa?.logo}</div>
              <div>
                <div style={{fontSize:10,color:G.champ,fontWeight:600,lineHeight:1.2}}>{empresa?.nome}</div>
                <div style={{fontSize:8,color:empresa?.cor||G.gold}}>{PLANOS[empresa?.plano]?.nome}</div>
              </div>
            </div>
          </div>
          {/* Usuário logado */}
          <div style={{padding:"9px 11px",background:`${pd?.cor||G.gold}08`,border:`1px solid ${pd?.cor||G.gold}20`,borderRadius:9}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <div style={{width:28,height:28,borderRadius:7,background:`${pd?.cor||G.gold}20`,border:`1px solid ${pd?.cor||G.gold}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:pd?.cor||G.gold,fontFamily:"DM Mono"}}>{usuario?.avatar}</div>
              <div>
                <div style={{fontSize:10,color:G.champ,fontWeight:600,lineHeight:1.2}}>{usuario?.nome}</div>
                <div style={{fontSize:8,color:pd?.cor||G.gold,marginTop:1}}>{pd?.icon} {usuario?.perfil}{usuario?.tf2Ativo&&<span style={{marginLeft:4,color:"#9b6dff"}}>🔐</span>}</div>
              </div>
            </div>
            <button onClick={logout} style={{width:"100%",padding:"5px",borderRadius:7,border:`1px solid ${G.rim}`,background:"transparent",color:G.muted,cursor:"pointer",fontSize:10,fontWeight:600}}>⊗ Sair</button>
          </div>
        </div>
      </div>
      {/* MAIN */}
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{padding:"18px 24px 16px",borderBottom:`1px solid ${G.rim}`,background:`linear-gradient(90deg,${G.deep},${G.bg})`,position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:2}}>
                <span style={{fontSize:18,color:tab==="ia"?G.violet:tab==="usuarios"?"#9b6dff":tab==="empresas"?"#2dd4a0":G.gold}}>{active?.icon}</span>
                <h1 style={{fontFamily:"Playfair Display",fontSize:18,color:G.champ,fontWeight:600}}>{active?.label}</h1>
              </div>
              <p style={{fontSize:10,color:G.muted,letterSpacing:.3}}>{active?.sub} · {fd(T)}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <div style={{background:`${pd?.cor||G.gold}18`,border:`1px solid ${pd?.cor||G.gold}35`,borderRadius:9,padding:"5px 12px",display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:11}}>{pd?.icon}</span>
                <span style={{fontSize:10,color:pd?.cor||G.gold,fontWeight:700}}>{usuario?.perfil}</span>
                {usuario?.tf2Ativo&&<span style={{fontSize:10,color:"#9b6dff",marginLeft:2}}>🔐</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,background:G.panel,border:`1px solid ${G.rim}`,borderRadius:9,padding:"5px 12px"}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:G.emerald,animation:"pulse 2s infinite"}}/>
                <span style={{fontSize:10,color:G.sub}}>Online</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{padding:22}}>
          {tab==="ia"       &&(podeAc("ia","ver")       ?<ModAgente cp={cp} cr={cr} lanc={lanc} mov={mov} bancos={bancos} fornecedores={fornecedores} clientes={clientes}/>:<Bloqueado modulo="ia" usuario={usuario}/>)}
          {tab==="lanc"     &&(podeAc("lanc","ver")      ?<ModLancamentos lanc={lanc} setLanc={setLanc} bancos={bancos}/>:<Bloqueado modulo="lanc" usuario={usuario}/>)}
          {tab==="pagar"    &&(podeAc("pagar","ver")     ?<ModPagar cp={cp} setCP={setCP} fornecedores={fornecedores}/>:<Bloqueado modulo="pagar" usuario={usuario}/>)}
          {tab==="receber"  &&(podeAc("receber","ver")   ?<ModReceber cr={cr} setCR={setCR} clientes={clientes}/>:<Bloqueado modulo="receber" usuario={usuario}/>)}
          {tab==="concil"   &&(podeAc("concil","ver")    ?<ModConciliacao cp={cp} setCP={setCP} cr={cr} setCR={setCR} mov={mov} setMov={setMov}/>:<Bloqueado modulo="concil" usuario={usuario}/>)}
          {tab==="rel"      &&(podeAc("rel","ver")       ?<ModRelatorios lanc={lanc} cp={cp} cr={cr}/>:<Bloqueado modulo="rel" usuario={usuario}/>)}
          {tab==="cad"      &&(podeAc("cad","ver")       ?<ModCadastros fornecedores={fornecedores} setForn={setForn} clientes={clientes} setCli={setCli} bancos={bancos} setBancos={setBancos} tiposMov={tiposMov} setTiposMov={setTiposMov}/>:<Bloqueado modulo="cad" usuario={usuario}/>)}
          {tab==="usuarios" &&(podeAc("usuarios","ver")  ?<ModUsuarios usuarios={usuarios} setUsuarios={setUsuarios} userAtual={usuario} empresaAtual={empresa}/>:<Bloqueado modulo="usuarios" usuario={usuario}/>)}
          {tab==="empresas" &&(podeAc("empresas","ver")  ?<ModEmpresas empresas={empresas} setEmpresas={setEmpresas} usuarios={usuarios} userAtual={usuario} empresaAtual={empresa} onTrocar={trocarEmpresa}/>:<Bloqueado modulo="empresas" usuario={usuario}/>)}
        </div>
      </div>
    </div>
  );
}

function AppAuth(){
  const {usuario,empresa,usuarios,empresas,login}=useAuth();
  if(!usuario)return <TelaLogin onLogin={login} usuarios={usuarios} empresas={empresas}/>;
  return <AppInner/>;
}

export default function App(){
  return(
    <AuthProvider>
      <AppAuth/>
    </AuthProvider>
  );
}
