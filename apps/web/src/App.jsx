import React,{useEffect,useMemo,useState} from "react";
import liveConfig from "../../../chile/valparaiso-live.config.json";
import scoreConfig from "../../../chile/valparaiso-score.config.json";
import intelligence from "../../../chile/spot-intelligence.json";
import "../../../chile/valparaiso-score-lab.js";
import "../../../chile/faro-chile-live.js";
import "../../../chile/faro-session-decision.js";
import "../../../chile/faro-spot-registry.js";
import "../../../chile/faro-spot-diagnostics.js";
const Live=window.FaroChileLive,Decision=window.FaroSessionDecision;
const Registry=window.FaroSpotRegistry,Diagnostics=window.FaroSpotDiagnostics;
const spots=Registry.build({live:liveConfig,score:scoreConfig,intelligence});
const fmt=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):"—";
const pad=n=>String(n).padStart(2,"0");
const band=n=>!Number.isFinite(n)?"unknown":n>=8?"high":n>=6?"regular":n>=4?"mid":n>=2?"low":"verylow";
const grade=(n,es)=>!Number.isFinite(n)?"—":n>=8.5?(es?"Excelente":"Excellent"):n>=7?(es?"Bueno":"Good"):n>=5?(es?"Regular":"Fair"):n>=3?(es?"Pobre":"Poor"):(es?"Muy pobre":"Very poor");
function decide(s,sp){
 return Decision.evaluate({
  potentialScore:s?.score,slotRisk:s?Live.slotRisk(s,liveConfig):"unknown",
  access:sp?.access,modelCoverage:s?.modelComplete?"complete":"unknown",
  daylight:s?.daylight?.eligible===true
 });
}
function time(s){return s?pad(s.hour)+":00–"+pad(s.hour+2)+":00":"—"}
export default function App(){
 const [id,setId]=useState(spots[0]?.id),[lang,setLang]=useState("es"),[theme,setTheme]=useState("dark");
 const [forecast,setForecast]=useState(null),[pending,setPending]=useState(true),[error,setError]=useState("");
 const [selectedHour,setSelectedHour]=useState(null);
 const [view,setView]=useState("forecast");
 const es=lang==="es",tr=(a,b)=>es?a:b;
 const sp=spots.find(s=>s.id===id)||spots[0];
 useEffect(()=>{
  let cancelled=false;setPending(true);setForecast(null);setError("");setSelectedHour(null);
  const pilot=liveConfig.pilots.find(p=>p.id===id);
  if(!pilot)return;
  Live.fetchSpot(liveConfig,pilot,scoreConfig,fetch,lang)
   .then(result=>{if(!cancelled)setForecast(result)})
   .catch(err=>{if(!cancelled)setError(String(err?.message||err))})
   .finally(()=>{if(!cancelled)setPending(false)});
  return()=>{cancelled=true};
 },[id,lang]);
 const firstDay=forecast?.days?.[0];
 const slots=firstDay?.slots||[];
 const next=slots.filter(s=>decide(s,sp).canRecommend)
  .sort((a,b)=>decide(b,sp).sessionScore-decide(a,sp).sessionScore)[0];
 const slot=selectedHour===null?next:slots.find(s=>s.hour===selectedHour)||null;
 const d=decide(slot,sp);
 const diagnostics=Diagnostics.diagnose(slot);
 const display=d.sessionScore;
 const caution=d.status==="caution"||d.status==="blocked"||d.status==="unassessed";
 const lead=sp.access?.publicRecommendationAllowed===false?
  tr("Restricción reportada: no recomendamos entrar al agua","Reported restriction: no water-entry recommendation"):
  d.status==="blocked"?tr("Riesgo modelado: sesión no recomendada","Modelled risk: session not recommended"):
  !slot?tr("Sin ventana evaluable por ahora","No eligible session window"):
  display>=8?tr("Una buena señal del mar en "+sp.name,"Strong model signal at "+sp.name):
  tr("Una ventana para revisar en "+sp.name,"A window worth checking at "+sp.name);
 return <main className={"app theme-"+theme} data-lang={lang}>
  <header className="top">
   <div className="brand"><b>FAR<span>◉</span></b><small>{tr("PRONÓSTICO COSTERO · VALPARAÍSO","COASTAL FORECAST · VALPARAÍSO")}</small></div>
   <nav aria-label={tr("Secciones","Sections")}>
    {["forecast","method"].map(v=><button key={v} type="button" aria-current={view===v?"page":undefined}
      onClick={()=>setView(v)}>{v==="forecast"?tr("Pronóstico","Forecast"):tr("Método y evidencia","Method & evidence")}</button>)}
   </nav>
   <div className="switches"><button onClick={()=>setLang(es?"en":"es")}>{es?"EN":"ES"}</button>
    <button onClick={()=>setTheme(theme==="dark"?"light":"dark")}>{theme==="dark"?tr("Claro","Light"):tr("Oscuro","Dark")}</button></div>
  </header>
  {view==="forecast"?<>
   <section className="hero">
    <div className="atmosphere" aria-hidden="true"></div>
    <div className="intro">
     <small>FARO · {tr("LEE LA COSTA","READ THE COAST")}</small>
     <p className="spot-meta">{sp.name} · {firstDay?.date||"—"}</p>
     <h1>{lead}</h1>
     <p className="description">{tr("Potencial estimado a partir de modelos y guías. No es una altura de rompiente ni un certificado de seguridad.",
     "Modelled potential and local guides. Not breaking-wave height or a safety clearance.")}</p>
     <a className="cta" href="../chile/">{tr("Mapa y pronóstico completo","Full forecast and map")} ↗</a>
    </div>
    <aside className="signal">
     <small>{tr("ÍNDICE DE SESIÓN · EXPERIMENTAL","SESSION INDEX · EXPERIMENTAL")}</small>
     <div className="score" data-band={band(display)}><strong>{fmt(display)}</strong><span>/10</span><em>{grade(display,es)}</em></div>
     <p>{tr("FRANJA SELECCIONADA","SELECTED WINDOW")} <strong>{time(slot)}</strong></p>
     <div className="facts"><span>{tr("OLEAJE OCEÁNICO","OFFSHORE")}<b>{fmt(slot?.totalWaveHeightM)} m</b></span>
      <span>{tr("PERÍODO","PERIOD")}<b>{fmt(slot?.swellPeriodS)} s</b></span>
      <span>{tr("VIENTO","WIND")}<b>{fmt(slot?.windKmh,0)} km/h</b></span></div>
     {caution&&<p className="warning" role="status">{d.status==="blocked"?tr("Sesión bloqueada por alerta/restricción","Session blocked by risk or restriction"):d.status==="caution"?
      tr("Precaución: índice limitado a 5,9; potencial oceánico "+fmt(d.potentialScore)+"/10",
         "Caution: capped at 5.9; offshore potential "+fmt(d.potentialScore)+"/10"):
      tr("Datos insuficientes para recomendar","Insufficient evidence for session advice")}</p>}
     <small>{tr("Modelo experimental · sin calibración de la ola rompiente","Experimental model · breaking-wave skill unvalidated")}</small>
    </aside>
   </section>
   <div className="utility"><label>{tr("PLAYA / SPOT","BEACH / SPOT")}
    <select value={id} onChange={e=>setId(e.target.value)}>{spots.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    <span>{pending?tr("Consultando pronóstico…","Fetching forecast…"):error?tr("Sin datos","Unavailable"):tr("Pronóstico modelado · revisión local necesaria","Modelled outlook · check conditions locally")}</span></div>
   {error&&<p role="alert" className="warning">{error}</p>}
   <section className="windows"><h2>{tr("Elige tu horario","Choose your time")}</h2>
    <div className="slot-grid">{slots.map(s=>{const x=decide(s,sp),shown=x.sessionScore;return <button type="button" key={s.hour}
     className={selectedHour===s.hour?"chosen":""} disabled={!s.modelComplete}
     onClick={()=>setSelectedHour(s.hour)} aria-pressed={selectedHour===s.hour}>
     <small>{pad(s.hour)}–{pad(s.hour+2)}</small><strong data-band={band(shown)}>{fmt(shown)}</strong>
     <span>{x.status==="blocked"?tr("NO RECOMENDADO","NOT RECOMMENDED"):x.status==="caution"?tr("Precaución","Caution"):grade(shown,es)}</span>
    </button>})}</div></section>
   <section className="evidence">
    <strong>{tr("Lectura del spot","Spot read")}</strong>
    <p>{tr("Confianza: baja y no validada localmente.","Confidence: low and not locally validated.")} {tr("Variación bajo ±15° de dirección:","Directional ±15° sensitivity:")} {fmt(diagnostics.bearingSensitivityScoreSpan)} {tr("puntos.","points.")}</p>
    <p>{tr("Bancos y corrientes de resaca: sin medición.","Sandbars and rip currents: unobserved.")}</p>
    <a href="../chile/">{tr("Explorar Spot DNA, brújula y fuentes","Explore Spot DNA, compass and sources")}</a>
   </section>
  </>:<section className="method"><h1>{tr("Un modelo transparente y verificable","Transparent, testable modelling")}</h1>
   <p>{tr("FARO compara guías locales con pronósticos marinos. El score es experimental. Las alertas oficiales no se sincronizan automáticamente y las observaciones humanas requieren revisión y derechos de uso.",
   "FARO combines local guides and model forecasts. Ratings are experimental. Official notices are not automatically synced; field evidence requires human review and permissions.")}</p>
   <p>{tr("Perfiles auditables: ","Auditable profiles: ")}{spots.length}. {tr("Ningún spot se considera calibrado.","No break is considered empirically calibrated.")}</p>
   <a href="../chile/">{tr("Volver a FARO Chile completo","Open full FARO Chile")}</a></section>}
 </main>;
}
