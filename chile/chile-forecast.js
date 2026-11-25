/* FARO Chile controller, Valparaíso live-model / uncalibrated spot-fit v1 */
(function(){
"use strict";
const $=id=>document.getElementById(id),Live=window.FaroChileLive;
const state={lang:"es",theme:"dark",config:null,profiles:null,registry:null,sources:null,intelligence:null,cameras:null,videoLab:null,coastMap:null,selected:0,day:0,hour:null,tab:"forecast",forecast:null,loadFailed:false,dataStale:false,sharedSnapshot:false,cache:new Map(),serial:0,page:0};
let coastSwitchCleanup=null,spotChooser=null;
const tr=(es,en)=>state.lang==="es"?es:en,ok=x=>typeof x==="number"&&Number.isFinite(x),num=(x,d=1)=>ok(x)?x.toFixed(d):"—";
const el=(tag,value,cls)=>{const x=document.createElement(tag);if(value!==undefined&&value!==null)x.textContent=String(value);if(cls)x.className=cls;return x};
const txt=(id,value)=>{$(id).textContent=value},clear=id=>$(id).replaceChildren(),add=(x,...nodes)=>{x.append(...nodes);return x};
const h=n=>String(n).padStart(2,"0");
// Store ONLY valid provider-generated numerical forecasts, for temporary
// outage recovery after an iPhone tab reload. Each cache is spot-specific,
// clearly labelled OLD, and expires after four hours.
const modelCachePrefix="faro-cl-last-valid-v1:";
const maxModelAgeMs=4*60*60*1000;
// Shared snapshot is a real provider capture served by GitHub Pages (same
// origin), useful when iOS blocks the two third-party API connections.
const maxSharedAgeMs=8*60*60*1000;
async function readSharedForecast(id){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),5000);
 try{
  const url="data/faro-model-snapshot.json?r="+Math.floor(Date.now()/120000);
  const response=await fetch(url,{cache:"no-store",signal:controller.signal});
  if(!response.ok)return null;
  const snapshot=await response.json(),record=snapshot?.spots?.[id];
  const age=Date.now()-Date.parse(record?.capturedAtUtc||"");
  if(snapshot?.schema!==1||snapshot.region!=="CL-VS"||
   snapshot.source!=="Open-Meteo"||!record?.marine||!record?.weather||
   !Number.isFinite(age)||age<0||age>maxSharedAgeMs)return null;
  const data=Live.extract(state.config,spot(),record.marine,record.weather,state.profiles,state.lang);
  if(!data?.model?.coverage?.completeSlots||
    !data.days.some(d=>d.date>=now().date&&d.slots.some(s=>s.modelComplete&&ok(s.score))))return null;
  data.model.fetchedAt=record.capturedAtUtc;
  data.model.firstPartySnapshot=true;
  data.model.source="Open-Meteo · copia FARO";
  return data;
 }catch(error){return null}finally{clearTimeout(timer)}
}
function modelState(kind){
 document.body.classList.toggle("faro-model-pending",kind==="pending");
 document.body.classList.toggle("faro-model-unavailable",kind==="unavailable");
 const lead=$("faroForecastLead");
 if(lead)lead.setAttribute("aria-busy",String(kind==="pending"));
 queueMicrotask(()=>window.faroConsole?.update());
}
const activeModelCacheMs=5*60*1000; // avoid presenting 15-minute-old data as current
let lastModelFetchStartedAt=0;
function saveLastValid(id,forecast){
 if(!forecast?.model?.fetchedAt||!forecast?.days?.some(d=>
  d.slots?.some(s=>s.modelComplete&&ok(s.score))))return;
 try{localStorage.setItem(modelCachePrefix+id,JSON.stringify({id,forecast}))}catch(e){}
}
function readLastValid(id){
 try{
  const saved=JSON.parse(localStorage.getItem(modelCachePrefix+id)||"null");
  const forecast=saved?.forecast,age=Date.now()-Date.parse(forecast?.model?.fetchedAt||"");
  if(saved?.id!==id||!forecast?.days?.some(d=>d.slots?.some(s=>s.modelComplete&&ok(s.score)))||
    !forecast?.model?.coverage?.completeSlots||
    !Number.isFinite(age)||age<0||age>maxModelAgeMs||
    !forecast.days.some(d=>d.date>=now().date))return null;
  return forecast;
 }catch(e){return null}
}
function showStaleModel(){
 if(!state.forecast)return;
 const fetched=new Date(state.forecast.model.fetchedAt);
 if(state.sharedSnapshot){
  const stamp=new Intl.DateTimeFormat(state.lang==="es"?"es-CL":"en-GB",{
   timeZone:"America/Santiago",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"
  }).format(fetched);
  txt("status",tr("MODELO RESPALDO","BACKUP MODEL"));
  txt("updated",tr("Datos auténticos de Open-Meteo capturados ","Authentic Open-Meteo data captured ")+stamp+
   tr(" CL · copia FARO, no lectura en vivo."," CL · FARO snapshot, not a live observation."));
  txt("faroLeadSignalTitle",tr("ÍNDICE DE SESIÓN · MODELO DE RESPALDO","SESSION INDEX · BACKUP MODEL"));
  txt("faroLeadWindowLabel",tr("FRANJA DEL MODELO CAPTURADO","CAPTURED MODEL WINDOW"));
  txt("faroLeadStatus",tr("Modelo de respaldo · confirma condiciones reales y avisos oficiales.",
   "Backup forecast · verify actual surf and official warnings."));
  return;
 }
 const stamp=new Intl.DateTimeFormat(state.lang==="es"?"es-CL":"en-GB",{
  timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit"
 }).format(fetched);
 txt("status",tr("MODELO GUARDADO","SAVED MODEL"));
 txt("updated",tr("Sin conexión con el proveedor · mostrando el último modelo válido de las ","Provider unavailable · last valid forecast from ")+stamp+
  tr(" CL. No es una actualización en vivo."," CL. Not live data."));
 txt("faroLeadSignalTitle",tr("ÍNDICE DE SESIÓN · MODELO GUARDADO","SESSION INDEX · SAVED MODEL"));
 txt("faroLeadWindowLabel",tr("FRANJA DEL MODELO ANTERIOR","WINDOW FROM EARLIER MODEL"));
 txt("faroLeadStatus",tr("Último modelo válido de las ","Last valid forecast from ")+stamp+
  tr(" CL · información no actualizada. Verifica las condiciones reales y alertas oficiales.",
   " CL · not current. Verify live conditions and official warnings."));
}
const band=n=>!ok(n)?"":n>=8?"brand-band-high":n>=6?"brand-band-regular":n>=4?"brand-band-mid":n>=2?"brand-band-low":"brand-band-verylow";
// Exact score bands and colour classes from Zeeland. Spot-fit in Chile is
// still experimental, so a quality label is NOT a validated beach observation.
const scoreTone=n=>!ok(n)?"":(n>=8?"tone-great":n>=6?"tone-good":n>=4?"tone-fair":n>=2?"tone-poor":"tone-low")+" "+band(n);
// These are *relative model signals*, never validated observed surf quality.
const grade=n=>!ok(n)?tr("Sin datos","No data"):n>=8.5?tr("Excelente","Excellent"):n>=7?tr("Bueno","Good"):n>=5?tr("Regular","Fair"):n>=3?tr("Malo","Poor"):tr("Muy malo","Very poor");
const gradeClass=n=>!ok(n)?"faro-grade-unavailable":n>=8.5?"faro-grade-excellent":n>=7?"faro-grade-good":n>=5?"faro-grade-fair":n>=3?"faro-grade-poor":"faro-grade-very-poor";

// Keep numerical score badges aligned with Zeeland's five quality bands.
// Experimental status belongs in the explanatory model caveat, not a
// different quality scale with e.g. eight identical 'Promising' labels.
const experimentalLabel=session=>grade(session?.score);
const scoreCaveat=session=>{
 const meta=session?.scoreMeta;
 if(meta?.status!=="experimental")return tr("Sin validación local","No local calibration");
 const sessions=meta.fieldSessions??0;
 return tr("Potencial FARO · modelo v0.4 · "+sessions+" sesiones observadas",
  "FARO potential · model v0.4 · "+sessions+" observed sessions");
};
const waveSize=h=>!ok(h)?"":h<.5?"size-small":h<1.2?"size-medium":h<2?"size-large":"size-xl";
const waveSizeLabel=h=>!ok(h)?"—":h<.5?tr("Pequeñas","Small"):h<1.2?tr("Medianas","Medium"):h<2?tr("Grandes","Large"):tr("Muy grandes","Very large");
function waveBars(h){
 // A passive oceanographic scale. The accessible number is the forecast
 // Hs value, not a slider or an estimate of a breaking wave.
 const gauge=el("div",null,"faro-wave-ruler "+waveSize(h));
 const available=ok(h)&&h>=0;
 const fraction=available?Math.max(0,Math.min(1,h/2)):0;
 gauge.setAttribute("role","img");
 gauge.setAttribute("aria-label",available?
  tr("Altura oceánica modelada: ","Modelled offshore height: ")+num(h)+
   tr(" metros; referencia visual de 0 a 2 metros o más",
      " metres; visual reference from 0 to 2 metres or higher"):
  tr("Altura oceánica no disponible","Offshore height unavailable"));
 const scale=el("div",null,"faro-wave-ruler-scale");
 scale.setAttribute("aria-hidden","true");
 for(let i=0;i<8;i++){
  const mark=el("span",null,"faro-wave-ruler-mark");
  const segmentEnd=(i+1)/8;
  mark.classList.toggle("is-filled",available&&fraction>=segmentEnd);
  mark.classList.toggle("is-partial",available&&fraction>i/8&&fraction<segmentEnd);
  scale.append(mark);
 }
 gauge.append(scale);
 const keys=el("div",null,"faro-wave-ruler-labels");
 keys.setAttribute("aria-hidden","true");
 keys.append(el("span","0 m"),el("span","1 m"),el("span","2 m+"));
 gauge.append(keys);
 gauge.append(el("small",tr("Altura en mar abierto · no la ola que rompe",
  "Offshore height · not the breaking wave"),"faro-wave-ruler-caption"));
 return gauge;
}

const spot=()=>state.config?.pilots?.[state.selected], profile=()=>state.profiles?.profiles?.[spot()?.id];
const regionRecord=()=>state.registry?.spots?.find(s=>s.id===spot()?.id);
const restricted=()=>spot()?.accessNotice?.status==="restriction_reported_not_live_verified"&&
 spot()?.accessNotice?.clearanceVerified!==true;
function paintAccessNotice(){
 const note=$("ventanasAccessNotice");
 if(!note)return;
 const info=window.FaroChileNotices?.describe(spot(),state.lang)||null;
 const oldHidden=note.hidden;
 note.hidden=!info;
 if(!info)return;
 if(oldHidden)note.open=false;
 // Same dated taxonomy and wording as the regional map tooltip.
 note.classList.remove("caution","danger","advisory");
 note.classList.add(info.severity);
 txt("faroAccessKicker",info.kicker);
 txt("faroAccessSeverity",info.type==="reported_restriction"?
  tr("REPORTE FECHADO","DATED REPORT"):info.severityLabel);
 txt("faroAccessHeadline",info.type==="reported_restriction"?
  info.spotName+" · "+tr("restricción recreativa reportada","reported recreational restriction"):info.headline);
 txt("faroAccessSubline",info.subline);
 txt("faroAccessEvidence",info.subline);
 txt("ventanasNoticeText",info.detail);
 note.setAttribute("aria-label",info.headline+" · "+info.statusLabel);
 const source=$("faroAccessSourceLink");
 source.hidden=!info.sourceUrl;
 if(info.sourceUrl)source.href=info.sourceUrl;
}
const localRead=(s,spotId=spot()?.id)=>window.FaroChileSpotIntelligence&&state.intelligence&&spotId?
 window.FaroChileSpotIntelligence.evaluate(s,spotId,state.intelligence,state.lang,
  {risk:Live.slotRisk(s,state.config)}):null;
function now(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 const obj=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return {date:obj.year+"-"+obj.month+"-"+obj.day,hour:Number(obj.hour),minutes:Number(obj.hour)*60+Number(obj.minute)};
}
function dateLabel(iso){
 if(!iso)return "—";
 const date=new Date(iso+"T12:00:00Z");
 return new Intl.DateTimeFormat(state.lang==="es"?"es-CL":"en-GB",{weekday:"long",day:"numeric",month:"short",timeZone:"UTC"}).format(date);
}
function sessionTime(s){return s?h(s.hour)+":00–"+h(s.hour+2)+":00":"—"}
function sessionDecision(s,beach=spot()){
 const fn=window.FaroSessionDecision?.evaluate;
 if(!fn)return {potentialScore:s?.score??null,sessionScore:s?.score??null,
  canRecommend:!!s,status:"eligible",reasons:[]};
 const notice=beach?.accessNotice;
 return fn({
  potentialScore:s?.score,slotRisk:s?Live.slotRisk(s,state.config):"unknown",
  access:notice,modelCoverage:s?.modelComplete===true?"complete":"unknown",
  daylight:s?.daylight?.eligible===true,
  windSpeedRangeKmh:s?.windSpeedRangeKmh
 });
}
function remainingWindow(day,slot,present=now()){
 if(!day||!slot)return false;
 const mins=v=>{const m=String(v??"").match(/T(\d\d):(\d\d)/);return m?Number(m[1])*60+Number(m[2]):null};
 const rise=mins(day.sunrise),set=mins(day.sunset);
 const light=window.FaroModelCore?.eligibleWindow(day.date,slot.hour,rise,set,present);
 return light?.upcoming===true&&slot.daylight?.eligible===true;
}
function bestRemaining(day,spotId=spot()?.id){
 if(!day)return null;
 const present=now();
 // Opportunity first, old guide-fit score only as a tie-breaker.
 // A caution/unknown risk does not become the "best time" by high score.
 return day.slots.filter(s=>sessionDecision(s,state.config.pilots.find(p=>p.id===spotId)).canRecommend&&
  remainingWindow(day,s,present))
  .sort((a,b)=>sessionDecision(b,state.config.pilots.find(p=>p.id===spotId)).sessionScore-
   sessionDecision(a,state.config.pilots.find(p=>p.id===spotId)).sessionScore||
   (localRead(b,spotId)?.decision?.priority??2)-(localRead(a,spotId)?.decision?.priority??2)||
   a.hour-b.hour)[0]||null;
}
function selection(){
 const day=state.forecast?.days?.[state.day];
 const selected=day?.slots.find(s=>s.hour===state.hour);return selected&&remainingWindow(day,selected)?selected:bestRemaining(day);
}
function setLanguage(){
 const saved=(()=>{try{return localStorage.getItem("zeeland-language")}catch(e){return "es"}})();
 state.lang=saved==="en"?"en":"es";document.documentElement.lang=state.lang;
 txt("languageToggle",state.lang==="es"?"EN":"ES");
 for(const item of document.querySelectorAll("[data-es][data-en]")){
   const copy=item.dataset[state.lang];
   if(!item.children.length){item.textContent=copy;continue}
   // Preserve nested readings/buttons. Replacing parent textContent would
   // delete their IDs (e.g. sunrise, sunset and daylight cut-off values).
   const direct=[...item.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
   if(direct.length)direct[0].textContent=copy;
  }
 setTheme(false);
 spotChooser?.sync();
}
function setTheme(toggle){
 if(toggle)state.theme=state.theme==="dark"?"light":"dark";
 else{
  const val=(()=>{try{return localStorage.getItem("zeeland-theme")}catch(e){return null}})();
  state.theme=["light","dark"].includes(val)?val:(matchMedia("(prefers-color-scheme:light)").matches?"light":"dark");
 }
 document.documentElement.dataset.theme=state.theme;
 const colour=document.querySelector('meta[name="theme-color"]');
 if(colour)colour.content=state.theme==="light"?"#f5f9f8":"#102427";
 txt("themeToggle",state.theme==="dark"?tr(" Claro"," Light"):tr(" Oscuro"," Dark"));
 if(toggle)try{localStorage.setItem("zeeland-theme",state.theme)}catch(e){}
}
function tab(name){
 state.tab=name;
 for(const k of ["forecast","best","board"]){
  const n=k==="forecast"?"forecastPage":k==="best"?"bestPage":"boardPage";
  $(n).classList.toggle("hide",k!==name);
  const b=k==="forecast"?"navForecast":k==="best"?"navBest":"navBoard";
  $(b).classList.toggle("active",k===name);$(b).setAttribute("aria-pressed",String(k===name));
 }
 if(name==="best")void rankings();
 if(name==="board")match();
}
function link(parent,title,url){
 if(!/^https:\/\//.test(url||""))return;
 const a=el("a",title+"");a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.append(a);
}
/* Spot DNA · Editorial identity card
 * Stable local facts come from the sourced regional record.
 * Model-vs-guide fit only appears after a 2-hour window is selected.
 * No locally observed breaking height, tide fit or access clearance is inferred.
 */
const dnaIntroductions={
 "CL-VS:la-boca-concon":{
  es:"La desembocadura del Aconcagua da forma a bancos de arena que pueden cambiar con el río y los sedimentos. El carácter de la ola depende del banco y de la orientación del swell; verifica corrientes y acceso al humedal.",
  en:"At the Aconcagua river mouth, shifting sediment can reshape the sandbars. Wave character depends on the active bank and incoming swell; check currents and access around the protected wetland."
 },
 "CL-VS:renaca":{
  es:"En el sector norte se describen picos sobre bancos de arena influenciados por rocas. Más al sur puede haber secciones que cierran. El resultado cambia según el banco y la fuerza del swell.",
  en:"The northern peaks are described as sandbanks influenced by nearby rocks. Southern sections can close out more readily. The active bank and swell energy change the result."
 },
 "CL-VS:ritoque":{
  es:"Esta playa extensa tiene bancos y zonas de entrada diferentes. Las guías describen olas más suaves en sectores del norte, pero el tamaño y la remada pueden cambiar hacia el sur.",
  en:"This long, exposed beach has different sandbanks and entry zones. Guides describe softer waves around northern peaks; size and paddling conditions can change farther south."
 },
 "CL-VS:maitencillo":{
  es:"Maitencillo reúne varios picos y bancos. El swell del suroeste y el viento del este son referencias generales, no una regla comprobada para cada sector.",
  en:"Maitencillo includes multiple peaks and shifting banks. South-westerly swell and easterly wind are general guide references, not verified conditions for every section."
 }
};
function dnaBreakName(type){
 const dictionary={
  "river-mouth":[ "Desembocadura / arena","River mouth / sand"],
  "beach":[ "Playa de arena","Sandy beachbreak"],
  "reef":[ "Arrecife","Reefbreak"],
  "point":[ "Punta / pointbreak","Pointbreak"],
  "mixed":[ "Fondo mixto","Mixed bottom"],
  "unverified":[ "Por verificar","Unverified"]
 };
 return tr(...(dictionary[type]||dictionary.unverified));
}
function renderDNA(){
 const current=spot();if(!current)return;
 const rec=regionRecord(),p=profile(),host=$("spotinsight");
 if(!host)return;
 const context=$("spotInsightContextTag");
 if(context)context.textContent=tr("Perfil local · "+(current.shortName||current.locality||"Valparaíso"),
  "Local profile · "+(current.shortName||current.locality||"Valparaíso"));
 const guide=rec?.conditions?.publishedReference||{};
 const intro=dnaIntroductions[current.id];
 const story=intro?.[state.lang]||tr(
  "Esta playa tiene características propias. Los rangos de guías son orientativos y requieren observaciones antes de representar la ola que rompe.",
  "This break has its own local character. Published guide ranges are indicative until field observations confirm the actual breaking surf."
 );
 const card=el("article",null,"faro-dna-editorial");
 const portrait=el("div",null,"faro-dna-portrait");
 portrait.append(
  el("small",tr("SPOT DNA · GUÍA LOCAL / "+(current.locality||"VALPARAÍSO").toUpperCase(),
    "SPOT DNA · LOCAL GUIDE / "+(current.locality||"VALPARAÍSO").toUpperCase()),"faro-dna-eyebrow"),
  el("h3",rec?.name||current.name,"faro-dna-name"),
  el("p",story,"faro-dna-deck")
 );
 const ids=el("div",null,"faro-dna-identity");
 ids.append(
  el("span",dnaBreakName(rec?.breakType)),
  el("span",current.locality||"Valparaíso")
 );
 portrait.append(ids);
 portrait.append(el("small",
  tr("Basado en guías, no en observaciones en directo","Based on published guides, not live surf observations"),
  "faro-dna-evidence"));
 const facts=el("div",null,"faro-dna-facts");
 const rows=[
  [tr("Tipo de rompiente","Break type"),dnaBreakName(rec?.breakType)],
  ["Swell · "+tr("guía","guide"),guide.swellFrom||tr("Sin verificar","Unverified")],
  [tr("Viento · guía","Wind · guide"),guide.windFrom||tr("Sin verificar","Unverified")],
  [tr("Marea","Tide"),tr("Sin óptimo validado","No validated optimum")],
  [tr("Estado","Status"),tr("Guía · falta calibración","Guide · uncalibrated")]
 ];
 for(const [title,value]of rows){
  const item=el("div",null,"faro-dna-fact");
  item.append(el("span",title),el("strong",value));
  facts.append(item);
 }
 card.append(portrait,facts);
 const lower=el("div",null,"faro-dna-below");
 const selected=selection(),local=localRead(selected);
 if(local?.status==="guide_compared"){
  lower.append(el("small",tr("SPOT INTELLIGENCE · MODELO VS. GUÍAS","SPOT INTELLIGENCE · MODEL VS. GUIDES"),"faro-dna-below-title"));
  const indicators=el("div",null,"faro-dna-signals");
  for(const key of ["wind","swell"]){
   const comparison=local[key];
   const label=key==="wind"?tr("Viento","Wind"):tr("Swell","Swell");
   const message=comparison.state==="convergent"?tr("Guías coinciden","Guides agree"):
    comparison.state==="disputed"?tr("Guías difieren","Guides differ"):
    comparison.state==="outside"?tr("Fuera de referencias","Outside guide ranges"):tr("Sin evaluar","Not assessed");
   indicators.append(el("span",label+" · "+message,"chile-signal-tag "+(comparison.state==="convergent"?"good":comparison.state==="disputed"?"mixed":"unknown")));
  }
  indicators.append(el("span",tr("Marea · pendiente","Tide · not calibrated"),"chile-signal-tag unknown"));
  lower.append(indicators);
  for(const note of local.notes||[])lower.append(el("p",note,"faro-dna-method"));
 }else if(selected?.scoreMeta?.components){
  lower.append(el("small",tr(
    "CÓMO ENCAJA EL PRONÓSTICO SELECCIONADO",
    "HOW THE SELECTED MODEL WINDOW FITS THE GUIDE"),"faro-dna-below-title"));
  const indicators=el("div",null,"faro-dna-signals");
  for(const [key,label]of [
   ["windDirection",tr("Dirección de viento","Wind direction")],
   ["swellDirection",tr("Dirección del swell","Swell direction")],
   ["windStrength",tr("Intensidad del viento","Wind strength")]
  ]){
   const component=selected.scoreMeta.components[key];
   if(!ok(component?.value))continue;
   const stateValue=component.value>=.8?"good":component.value>=.45?"mixed":"bad";
   const assessment=component.value>=.8?tr("Favorable","Favourable"):
      component.value>=.45?tr("Variable","Mixed"):tr("Desfavorable","Unfavourable");
   indicators.append(el("span",label+" · "+assessment,"chile-signal-tag "+stateValue));
  }
  indicators.append(el("span",tr("Marea · no evaluada","Tide · not assessed"),"chile-signal-tag unknown"));
  lower.append(indicators);
  const proxy=selected.scoreMeta.physicsProxy;
  if(proxy?.partitions?.length){
   lower.append(el("p",tr(
    "FARO v0.4 · "+proxy.partitions.length+" swell(s). Potencial oceánico Hs² × T = "+
      num(proxy.admittedEnergyHs2T,1)+" m²·s. Coincidencia con rumbos de guía: "+
      num(proxy.directionalGuideSupport*100,0)+" % de energía relativa; viento: "+
      num(proxy.windQuality,2)+" (factor heurístico 0–1). No simula la ola rompiente.",
    "FARO v0.4 · "+proxy.partitions.length+" swell partition(s). Offshore Hs² × T proxy = "+
      num(proxy.admittedEnergyHs2T,1)+" m²·s. Guide-bearing support: "+
      num(proxy.directionalGuideSupport*100,0)+" % of relative energy; wind factor "+
      num(proxy.windQuality,2)+" (heuristic 0–1). Does not model breaking surf."
   ),"faro-dna-method"));
   lower.append(el("p",tr(
    "La conversión a 0–10 es experimental, sin mediciones locales para comprobar su precisión.",
    "The 0–10 mapping is experimental and lacks local observations to verify its accuracy."
   ),"faro-dna-method"));
   lower.append(el("p",tr(
    "Cobertura de entradas: "+(selected.modelCoverage?.required==="complete"?"2/2 h":"incompleta")+
     " · "+(proxy.partitions.length-1)+" swells adicionales completos. La compatibilidad direccional se basa en guías, NO expresa probabilidad de acierto.",
    "Input coverage: "+(selected.modelCoverage?.required==="complete"?"2/2 hours":"incomplete")+
     " · "+(proxy.partitions.length-1)+" complete additional swells. Directional fit is guide-based, NOT forecast probability or measured skill."
   ),"faro-dna-method"));
   if(Number.isFinite(proxy.approximateDeepwaterWavelengthM)){
    lower.append(el("p",tr(
     "Análisis de tren de swell: longitud de onda profunda aproximada "+
     num(proxy.approximateDeepwaterWavelengthM,0)+" m; esbeltez Hs/L₀ "+
     num(proxy.approximateDeepwaterSteepness,4)+
     (Number.isFinite(proxy.secondaryCrossingAngleDeg)?
      "; separación con swell secundario "+num(proxy.secondaryCrossingAngleDeg,0)+"°":"")+
     ". No estima shoaling, bancos ni altura de rompiente.",
     "Wave-train analysis: approximate deepwater wavelength "+
     num(proxy.approximateDeepwaterWavelengthM,0)+" m; Hs/L₀ steepness "+
     num(proxy.approximateDeepwaterSteepness,4)+
     (Number.isFinite(proxy.secondaryCrossingAngleDeg)?
      "; secondary swell crossing angle "+num(proxy.secondaryCrossingAngleDeg,0)+"°":"")+
     ". Does not estimate shoaling, banks or breaking heights."
    ),"faro-dna-method"));
   }
   lower.append(el("p",tr(
    Number.isFinite(selected.oceanCurrentKmh)?
     "Corriente oceánica modelada (~8 km): "+num(selected.oceanCurrentKmh,1)+
      " km/h hacia "+num(selected.oceanCurrentToDeg,0)+"°. NO representa corrientes de resaca ni riesgo dentro del spot.":
     "Corriente oceánica modelada: no disponible. La dirección de las corrientes de resaca locales sigue desconocida.",
    Number.isFinite(selected.oceanCurrentKmh)?
     "Modelled ocean current (~8 km): "+num(selected.oceanCurrentKmh,1)+
      " km/h flowing TO "+num(selected.oceanCurrentToDeg,0)+"°. NOT local rip current or spot safety.":
     "Modelled ocean current unavailable. Actual local rip currents remain unassessed."
   ),"faro-dna-method"));
   lower.append(el("p",tr(
    "Estado de bancos de arena, fondo, canaletas y caudal del río: no observado y NO incluido en la puntuación.",
    "Sandbars, bathymetry, channels and river discharge: not observed and NOT included in the score."
   ),"faro-dna-method"));
   if(proxy.directionScenario){
    const sensitivity=proxy.directionScenario;
    lower.append(el("p",tr(
     "Prueba de sensibilidad: si los rumbos de swell se desplazaran ±"+
      sensitivity.bearingShiftDeg+"°, el modelo calcularía "+
      num(sensitivity.scoreMin)+"–"+num(sensitivity.scoreMax)+"/10. Escenarios, NO intervalo de confianza ni pronóstico alternativo.",
     "Sensitivity test: shifting swell bearings ±"+
      sensitivity.bearingShiftDeg+"° yields modelled "+
      num(sensitivity.scoreMin)+"–"+num(sensitivity.scoreMax)+"/10. Scenarios, NOT confidence bounds or alternative forecasts."
    ),"faro-dna-method"));
   }
  }
 }else{
  lower.append(el("small",tr("PRONÓSTICO LOCAL · POR COMPARAR","LOCAL MODEL · FIT UNAVAILABLE"),"faro-dna-below-title"));
  lower.append(el("p",tr("El ajuste por dirección requiere datos válidos para la franja elegida.",
   "Directional compatibility requires valid data for the selected window."),"faro-dna-method"));
 }
 const diagnostics=window.FaroSpotDiagnostics?.diagnose(selection(),p);
 if(diagnostics&&selection()){
  const change=diagnostics.windTwoHourRangeKmh;
  lower.append(el("p",tr(
   "Variabilidad del viento durante 2 h: "+(ok(change)?num(change)+" km/h":"sin dato")+
   ". Sensibilidad ±15°: "+(ok(diagnostics.bearingSensitivityScoreSpan)?
    num(diagnostics.bearingSensitivityScoreSpan)+" puntos":"sin dato")+
   ". Confianza empírica: no calibrada; bancos y resacas no observados.",
   "2h wind variation: "+(ok(change)?num(change)+" km/h":"unavailable")+
   ". ±15° bearing sensitivity: "+(ok(diagnostics.bearingSensitivityScoreSpan)?
    num(diagnostics.bearingSensitivityScoreSpan)+" points":"unavailable")+
   ". Empirical confidence uncalibrated; sandbars and rips unobserved."
  ),"faro-dna-method"));
 }
  const safety=state.lang==="es"?p?.hazardContextEs:p?.hazardContextEn;
 if(safety)lower.append(el("p",safety,"faro-dna-safety"));
 lower.append(el("p",tr(
  "Las direcciones proceden de guías; no determinan altura rompiente, marea óptima, zonas permitidas ni seguridad.",
  "These guide directions do not establish breaking-wave height, optimal tide, permitted zones or water-entry safety."
 ),"faro-dna-method"));
 const detail=el("details",null,"faro-dna-source-disclosure");
 const references=new Set([...(rec?.sources||[]),...Object.values(p?.origins||{}),...(state.intelligence?.spots?.[current.id]?
  [...Object.values(state.intelligence.spots[current.id].guideHypotheses||{}).flat().map(x=>x.source),
   ...(state.intelligence.spots[current.id].guideWaveShapeHypotheses||[]).map(x=>x.source)]:[])]);
 detail.append(el("summary",tr("Fuentes y alcance de la investigación","Research sources and limitations")));
 if(state.lang==="es"&&rec?.conditions?.regionSpecificNoteEs){
  detail.append(el("p",rec.conditions.regionSpecificNoteEs,"faro-dna-method"));
 }else{
  detail.append(el("p",tr(
   "La información corresponde a sectores descritos por guías. Los bancos y límites exactos están pendientes de validación.",
   "Guide descriptions refer to particular sectors. Exact banks and access boundaries still require field verification."
  ),"faro-dna-method"));
 }
 const urls=el("div",null,"faro-dna-source-links");
 for(const key of references){
  const source=state.sources?.sources?.[key];
  if(source?.url)link(urls,source.name,source.url);
 }
 if(urls.children.length)detail.append(urls);
 if(state.intelligence?.spots?.[current.id]){
  const g=state.intelligence.spots[current.id].guideHypotheses;
  for(const hypothesis of state.intelligence.spots[current.id].guideWaveShapeHypotheses||[]){
   const source=state.sources?.sources?.[hypothesis.source];
   detail.append(el("p",(state.lang==="es"?hypothesis.es:hypothesis.en)+" · "+
    tr("Hipótesis de pronosticador local, pendiente de comprobar con cámara. Fuente: ","Local forecaster hypothesis, requires camera verification. Source: ")+(source?.name||hypothesis.source),
    "faro-dna-method"));
  }
  detail.append(el("p",tr("CONTRASTE DE GUÍAS · NO CALIBRADO","GUIDE COMPARISON · UNCALIBRATED"),"faro-dna-below-title"));
  for(const [type,key]of [[tr("Swell","Swell"),"swell"],[tr("Viento","Wind"),"wind"],[tr("Marea","Tide"),"tide"]]){
   for(const h of g[key]||[]){
    const source=state.sources?.sources?.[h.source];
    const claim=key==="tide"?h.claim:h.meaning;
    detail.append(el("p",type+" · "+(source?.name||h.source)+": "+claim,"faro-dna-method"));
   }
  }
  detail.append(el("p",tr("Las diferencias pueden reflejar sectores, temporadas, errores o criterios distintos. FARO no las promedia ni calcula porcentajes de confianza sin observaciones.",
   "Differences may reflect sectors, seasons, errors or different criteria. FARO neither averages them nor reports confidence percentages without observations."),"faro-dna-method"));
 }

 const coastal=current.coastalReference;
 if(coastal?.autoIntegrated===false&&/^https:\/\//.test(coastal.url)){
  const label=tr("COMPARACIÓN COSTERA · FUENTE EXTERNA","COASTAL CROSS-CHECK · EXTERNAL SOURCE");
  detail.append(el("p",label+" · "+coastal.depthM+" m. "+tr(
   "Pronóstico costero independiente; FARO aún no recupera ni coteja sus valores automáticamente. No representa altura de rompiente ni una marea SHOA.",
   "Independent coastal model; FARO does not ingest or compare its values automatically. Not breaking-wave height or an official SHOA tide."),"faro-dna-method"));
  const related=el("div",null,"faro-dna-source-links");
  link(related,coastal.label,coastal.url);
  detail.append(related);
 }
 lower.append(detail);
 card.append(lower);
 host.replaceChildren(card);
}

function renderCameras(){
 const host=$("chileCameraSources");if(!host)return;
 host.replaceChildren();
 const id=spot()?.id;
 const entries=(state.cameras?.sources||[]).filter(x=>x.spotId===id&&x.type!=="coastal_model_not_camera");
 if(!entries.length){
  host.append(el("p",tr("Aún no hemos confirmado una cámara pública de este sector. No mostramos videos de otras playas como si fueran la rompiente.",
   "No public camera has been verified for this sector. We do not pretend nearby beaches show this break."),"faro-dna-method"));
  return;
 }
 const info=el("p",tr("Mira las olas en su fuente original. Faro no captura ni analiza automáticamente estas imágenes.",
  "See the surf on the original provider's website. FARO does not automatically capture or analyse these images."),"faro-dna-method");
 host.append(info);
 for(const cam of entries){
  const row=el("div",null,"chile-camera-row");
  const availability=cam.viewerAccess==="free_account_required"?
   tr("Gratis · exige iniciar sesión","Free · sign-in required"):
   cam.viewerAccess==="premium_subscription"?tr("Premium · suscripción","Premium · subscription"):
   cam.viewerAccess==="public_page_currently_offline"?tr("Señal no confirmada · figuraba offline","Feed unverified · previously offline"):
   cam.viewerAccess==="public_youtube_no_account"?tr("YouTube público · emisión actual no verificada","Public YouTube · live status not checked"):
   cam.viewerAccess==="public_page_unverified"?tr("Página abierta · señal no comprobada","Public page · feed not checked"):
   tr("Vista regional · transmisión no verificada","Regional context · unverified feed");
  row.append(el("strong",cam.name),el("small",availability));
  if(/^https:\/\//.test(cam.page)){
   const a=el("a",tr("Ver cámara en origen","Open provider's camera"));
   a.href=cam.page;a.target="_blank";a.rel="noopener noreferrer";row.append(a);
  }
  host.append(row);
 }
 host.append(el("p",tr("Acceso gratuito no equivale a permiso para usar imágenes en entrenamiento de IA. Pendiente convenio con titulares de cámaras.",
  "Free viewing does not grant AI training rights. Written agreement with camera owners is required."),"faro-dna-method"));
}
function risk(hazard){
 const container=$("faroSafetyCenter");container.classList.remove("danger","caution","chile-model-danger","chile-model-caution");
 const level=hazard?.level||"unknown";
 // A model signal is not an official alert. Do not display an alarming,
 // content-free banner in calm modelled conditions. Permanent official-source
 // access remains in the quieter Before You Go disclosure.
 const raised=level==="danger"||level==="caution";
 container.hidden=!raised;
 if(!raised){$("chileRiskDisclosure").open=false;return}
 if(level==="danger")container.classList.add("danger","chile-model-danger");
 if(level==="caution")container.classList.add("caution","chile-model-caution");
 txt("chileRiskGrade",level==="danger"?tr("RIESGO MODELO","MODEL RISK"):level==="caution"?tr("PRECAUCIÓN","CAUTION"):tr("FUENTES OFICIALES","OFFICIAL SOURCES"));
 txt("chileRiskTitle",["danger","caution"].includes(level)?hazard.label:tr("Consulta marejadas y avisos oficiales","Check official coastal notices"));
 txt("chileRiskMeta",tr("Portales oficiales consultados periódicamente · vigencia no certificada","Official portals periodically checked · bulletin validity unverified"));
 txt("chileRiskExplanation",tr("FARO puede detectar viento, tormentas y lluvia en el modelo. Un aviso oficial de marejadas es diferente y todavía requiere consultar a la Armada. La ausencia de riesgo modelado NO significa ausencia de alerta oficial.","FARO can screen wind, thunderstorms and rainfall in the model. Official swell warnings require checking the Navy. No model threshold crossed does NOT mean no official warning."));
 const host=$("chileRiskSignals");
 if(host){
  host.replaceChildren();
  const rows=hazard?.signals||[];
  for(const r of rows){
   const line=el("div",null,"chile-risk-item "+(r.detected?"chile-risk-active":""));
   const name=state.lang==="es"?r.es:r.en;
   line.append(el("strong",name),el("span",!r.evaluated?tr("Sin datos para evaluar","Insufficient model data"):r.detected?tr("Señal modelo · ","Model signal · ")+(r.value||tr("Posible","Possible")):tr("Sin umbral detectado","No model threshold crossed")));
   host.append(line);
  }
  const official=el("div",null,"chile-risk-item chile-risk-official");
  official.append(el("strong",tr("Marejadas · Armada","Ocean swell · Navy")),el("span",tr("Revisión automática parcial · confirmar boletín","Partial automatic check · confirm bulletin")));
  host.append(official);
  const uv=el("div",null,"chile-risk-item chile-risk-official");
  uv.append(el("strong",tr("Radiación UV","UV radiation")),el("span",tr("Pronóstico UV en horario; no es alerta oficial","UV forecast shown by hour; not an official warning")));
  host.append(uv);
 }
}
function strip(){
 const days=state.forecast?.days||[],host=$("dayStripItems"),quick=$("faroQuickDays");
 host.replaceChildren();
 const preservedDaysScroll=quick?.scrollLeft||0;
 quick?.replaceChildren();
 for(const [i,d]of days.entries()){
  const s=bestRemaining(d),button=el("button",null,"day-chip score-tint "+(s?scoreTone(s.score):"")+(i===state.day?" selected":""));
  button.type="button";button.setAttribute("aria-pressed",String(i===state.day));
  button.append(el("span",d.date===now().date?tr("Hoy","Today"):Live.formatDay(d.date,state.lang),"chile-chip-day"));
  button.append(el(s?"strong":"span",s?num(s.score):"—",s?"chile-chip-number":"chile-chip-empty"));
  button.append(el("span",s?experimentalLabel(s):tr("Sin ventana","No daylight window"),"chile-chip-grade faro-grade "+gradeClass(s?.score)));
  button.append(el("small",s?sessionTime(s):tr("No evaluado","Not evaluated"),"chile-chip-time"));
  button.addEventListener("click",()=>{state.day=i;state.hour=null;render()});host.append(button);
  if(quick){
   const decision=s?sessionDecision(s):null;
   const value=decision?.canRecommend?decision.sessionScore:null;
   const today=d.date===now().date;
   const textDay=today?tr("Hoy","Today"):Live.formatDay(d.date,state.lang);
   const mini=el("button",null,"faro-console-day-chip "+
    (ok(value)?scoreTone(value):"faro-console-empty")+
    (i===state.day?" is-selected":""));
   mini.type="button";
   mini.dataset.dayIndex=String(i);
   mini.setAttribute("aria-pressed",String(i===state.day));
   // A restrained day trend bar uses the real eligible 0–10 score. No
   // fabricated value or visual bar for days that cannot be assessed.
   if(ok(value))mini.style.setProperty("--faro-day-pct",
    (Math.max(0,Math.min(10,value))/10).toFixed(3));
   mini.setAttribute("aria-label",textDay+" · "+(ok(value)?
    grade(value)+" · "+num(value)+"/10 · "+sessionTime(s):
    tr("Sin ventana futura evaluable","No eligible future window")));
   mini.append(el("span",textDay,"faro-console-day-date"));
   const verdict=el("span",null,"faro-console-day-verdict");
   if(ok(value)){
    verdict.append(el("strong",num(value),"faro-console-day-score"));
    verdict.append(el("span",grade(value),"faro-console-day-grade"));
   }else verdict.append(el("span",tr("Sin ventana","No window"),"faro-console-day-grade"));
   mini.append(verdict);
   mini.append(el("small",ok(value)?sessionTime(s):
    today?tr("Sin más horas","No more slots"):tr("Sin franja","No slot"),
    "faro-console-day-window"));
   mini.addEventListener("click",()=>{
    state.day=i;state.hour=null;render();
    $("faroQuickDays")?.querySelector('[data-day-index="'+i+'"]')?.focus({preventScroll:true});
   });
   quick.append(mini);
  }
 }
 if(quick)quick.scrollLeft=preservedDaysScroll;
 const chosen=days[state.day],best=bestRemaining(chosen);
 txt("dayStripSelected",chosen?
   dateLabel(chosen.date)+" · "+(best?num(best.score)+"/10 · "+sessionTime(best):tr("Sin horario","No window")):"—");
 state.page=Math.min(state.page,Math.max(0,days.length-3));
 txt("dayStripCount",(state.page+1)+"–"+Math.min(days.length,state.page+3)+" / "+days.length);
 $("dayPrev").disabled=state.page===0;$("dayNext").disabled=state.page>=days.length-3;
 $("dayStripProgress").style.width=((state.page+1)/Math.max(1,days.length)*100)+"%";
}
function betterWindow(s,local){
 if(!s||!local?.decision||local.decision.priority>=4)return null;
 const threshold=local.decision.priority;
 const present=now(),nowKey=present.date+"T"+h(present.hour);
 const selectedKey=s.date+"T"+h(s.hour);
 const candidates=(state.forecast?.days||[]).flatMap(d=>d.slots).filter(t=>
  t.date+"T"+h(t.hour)>selectedKey&&t.date+"T"+h(t.hour)>=nowKey&&
  t.daylight?.eligible&&ok(t.score)&&Live.slotRisk(t,state.config)==="none")
  .map(t=>({t,priority:localRead(t)?.decision?.priority||0}))
  .filter(x=>x.priority>=3&&x.priority>threshold)
  .sort((a,b)=>(a.t.date+a.t.hour.toString().padStart(2,"0")).localeCompare(b.t.date+b.t.hour.toString().padStart(2,"0"))||
   b.priority-a.priority);
 if(!candidates.length)return null;
 const next=candidates[0].t;
 return tr("Mejor candidata para revisar: ","Better option to check: ")+dateLabel(next.date)+" · "+sessionTime(next)+".";
}
function waveExplanation(s){
 const host=$("chileWaveHow");host.replaceChildren();
 if(!s){host.append(el("p",tr("Sin datos para esta ventana.","No data for this window.")));return}
 const local=localRead(s);
 const facts=[
  [tr("ALTURA OCEÁNICA","OFFSHORE HEIGHT"),num(s.totalWaveHeightM)+" m",
   tr("El modelo estima oleaje en una celda marina, no la pared donde surfeas.",
    "The model estimates waves at a marine grid cell, not the face at your break.")],
  [tr("SWELL PRINCIPAL","PRIMARY SWELL"),num(s.swellHeightM)+" m · "+num(s.swellPeriodS)+" s · "+Live.cardinal(s.swellDirection),
   tr("El período y la dirección condicionan cómo puede llegar la energía al spot. No basta la altura total.",
    "Period and bearing affect how swell may approach the break. Total height alone is not enough.")],
  [tr("VIENTO Y RACHAS","WIND & GUSTS"),num(s.windKmh,0)+" / "+num(s.gustKmh,0)+" km/h",
   tr("El viento puede ordenar o desordenar la superficie según dirección y fuerza; el mapa muestra de dónde viene.",
    "Wind can help or disturb the surface depending on bearing and strength; the map shows the incoming direction.")]
 ];
 for(const [heading,value,copy]of facts){
  const row=el("div",null,"chile-wave-how-row");
  row.append(el("span",heading),el("strong",value),el("p",copy));host.append(row);
 }
 if(local?.swell?.state||local?.wind?.state){
  const signal=el("p",null,"chile-wave-how-signal");
  signal.textContent=tr("Para este sector: ","For this sector: ")+
   (local.swell.state==="convergent"?tr("swell respaldado por las guías","swell fits the guides"):
    local.swell.state==="disputed"?tr("guías divididas sobre el swell","swell guidance differs"):
    local.swell.state==="outside"?tr("swell fuera de las referencias","swell outside guide ranges"):
    tr("swell sin contrastar","swell not yet assessed"))+" · "+
   (local.wind.state==="convergent"?tr("viento respaldado","wind fits the guides"):
    local.wind.state==="disputed"?tr("viento discutido entre guías","wind guidance differs"):
    local.wind.state==="outside"?tr("viento fuera de referencias","wind outside guide ranges"):
    tr("viento sin contrastar","wind not yet assessed"))+".";
  host.append(signal);
 }
}
function renderHourlyPreview(){
 const s=selection(),local=localRead(s);
 const read=window.FaroChileCoastalLens?.reading(s,local,state.lang);
 txt("faroHourlySelectedTime",s?sessionTime(s):tr("Sin franja seleccionada","No selected window"));
 txt("faroHourlyHeadline",read?.headline||tr("Sin lectura de esta franja","No outlook for this window"));
 txt("faroHourlyExplanation",read?.explanation||tr("Selecciona un horario para comparar las condiciones.","Select a time window to compare conditions."));
 // Measured model quantities describe THIS selected two-hour slot, not a
 // different day, the full-day UV maximum or an observed breaking wave.
 const signals=$("faroHourlySignals");
 signals.replaceChildren();
 if(s?.modelComplete){
  const facts=[
   [tr("OLEAJE OCEÁNICO","OFFSHORE SWELL"),ok(s.totalWaveHeightM)?num(s.totalWaveHeightM)+" m":"—"],
   [tr("PERÍODO","PERIOD"),ok(s.swellPeriodS)?num(s.swellPeriodS)+" s":"—"],
   [tr("VIENTO MODELO","MODEL WIND"),ok(s.windKmh)?num(s.windKmh,0)+" km/h":"—"]
  ];
  for(const [label,value] of facts){
   const fact=el("span",null,"faro-hourly-signal");
   fact.append(el("small",label),el("strong",value));
   signals.append(fact);
  }
 }
}
function updateCoastMap(){
 const s=selection();
 state.coastMap?.update({spot:spot(),spots:state.config?.pilots||[],
  referenceSpots:state.config?.referenceSpots||[],slot:s,
  marineGrid:state.forecast?.model?.marineGrid||null,
  weatherGrid:state.forecast?.model?.weatherGrid||null,
  profiles:state.profiles?.profiles||{},
  local:localRead(s),lang:state.lang,cameras:state.cameras?.sources||[]});
}
function vibeUI(s){
 const info=Live.vibe(s,state.lang),meta=s?.scoreMeta,local=localRead(s);
 if(restricted()){
  txt("chileDecisionHeadline",tr("Potencial oceánico · acceso no habilitado",
   "Offshore potential · access not cleared"));
  txt("chileDecisionDriver",tr("Ventanas tiene un índice experimental de oleaje, pero la restricción recreativa fue reportada y su levantamiento no ha sido verificado.",
   "Ventanas has a modelled swell index, but a recreational restriction was reported and no lifting has been verified."));
  txt("chileVibeTag",tr("RESTRICCIÓN REPORTADA","REPORTED RESTRICTION"));
  txt("chileVibeHeadline",tr("No es una recomendación de sesión","This is not a session recommendation"));
  txt("chileVibeRead",meta?.read||tr("Guías direccionales no calibradas","Uncalibrated directional guides"));
  txt("chileVibeAction",tr("No entrar al agua sin confirmación de la autoridad sanitaria y marítima.",
   "Do not enter the water without health and maritime authority clearance."));
  $("chileVibeExplained").replaceChildren();
  $("chileVibeEvidence").replaceChildren();
  return;
 }
 const actionable=local?.status==="guide_compared"&&local.decision;
 txt("chileDecisionHeadline",actionable?local.decision.verdict:tr("Sin recomendación para esta franja","No recommendation for this window"));
 txt("chileDecisionDriver",actionable?local.decision.reason:
  tr("Selecciona una ventana con datos suficientes.","Select a window with complete forecast data."));
 txt("chileVibeTag",actionable?local.vibe.label:info.label);
 const vibeIconNames={windy:"windy",glassy:"glassy",choppy:"choppy",mushy:"mushy",
  punchy:"punchy",clean:"clean-lines",mixed:"mixed-bag",short:"small-swell",
  small:"small-swell",unassessed:"unknown-data"};
 const vibeId=(actionable?local.vibe.id:info.id)||"unassessed";
 const tagIcon=el("span",null,"faro-icon-slot");
 tagIcon.setAttribute("data-faro-icon",vibeIconNames[vibeId]||"wave-height");
 $("chileVibeTag").prepend(tagIcon);
 txt("chileVibeHeadline",actionable?tr("Por qué y qué haría","Why it matters & next step"):
  meta?.read||tr("No hay información suficiente.","Not enough information."));
 txt("chileVibeRead",actionable?local.read:info.description);
 txt("chileVibeAction",actionable?local.decision.action+" "+(betterWindow(s,local)||""):
  tr("Revisa otra franja con datos completos.","Check another complete forecast window."));
 const why=$("chileVibeExplained");why.replaceChildren();
 const factors=actionable?[
  [tr("Swell y período","Swell & period"),num(s.swellHeightM)+" m · "+num(s.swellPeriodS)+" s"],
  [tr("Viento","Wind"),num(s.windKmh,0)+" km/h · "+Live.cardinal(s.windDirection)],
  [tr("Factor decisivo","Decisive factor"),local.decision.reason]
 ]:[];
 if(factors.length){
  why.append(el("small",tr("DE DÓNDE SALE ESTE FARO VIBE","WHY FARO CHOSE THIS VIBE"),"chile-vibe-evidence-title"));
  for(const [label,val]of factors){const item=el("div",null,"chile-vibe-factor");item.append(el("span",label),el("strong",val));why.append(item)}
 }
 const tags=$("chileVibeEvidence");tags.replaceChildren();
 if(actionable){
  for(const e of local.evidenceLabels.slice(0,3))tags.append(el("span",e.label,"chile-signal-tag "+
   (e.state==="supported"?"good":e.state==="disputed"?"mixed":"unknown")));
  tags.append(el("span",tr("Modelo + guías locales","Model + local guides"),"chile-signal-tag unknown"));
 }else{
  for(const t of meta?.tags||[])tags.append(el("span",t.label,"chile-signal-tag "+(t.state==="positive"?"good":t.state==="negative"?"bad":t.state==="mixed"?"mixed":"unknown")));
 }
}
function renderLead(day,session){
 const lead=$("faroForecastLead");
 if(!lead)return;
 const decision=sessionDecision(session);
 const displayScore=decision.sessionScore;
 lead.className="faro-forecast-lead "+(ok(displayScore)?scoreTone(displayScore):"is-unavailable");
 lead.classList.toggle("has-model-caution",decision.status==="caution");
 lead.classList.toggle("has-model-danger",decision.status==="blocked");
 lead.classList.toggle("is-restricted",restricted());
 txt("faroLeadLocation",(spot()?.shortName||spot()?.name||"—")+" · "+dateLabel(day?.date));
 const selected=Boolean(session);
 const seaHeight=selected?num(session.totalWaveHeightM)+" m":"—";
 txt("faroLeadScore",ok(displayScore)?num(displayScore):"—");
 txt("faroLeadGrade",selected?decision.status==="blocked"?tr("NO RECOMENDADO","NOT RECOMMENDED"):
  decision.status==="unassessed"?tr("No evaluado","Unassessed"):
  decision.status==="caution"?tr("Precaución","Caution"):grade(displayScore):tr("No evaluado","Unavailable"));
 const title=$("faroLeadSignalTitle");
 if(title)title.textContent=tr("ÍNDICE DE SESIÓN · MODELO","SESSION INDEX · MODEL");
 txt("faroLeadWindowLabel",restricted()?tr("FRANJA MODELADA · NO RECOMENDADA","MODELLED · NOT RECOMMENDED"):
  state.hour!==null?tr("FRANJA SELECCIONADA","SELECTED WINDOW"):
  tr("MEJOR FRANJA EVALUABLE","BEST ELIGIBLE WINDOW"));
 txt("faroLeadTime",selected?sessionTime(session):"—");
 txt("faroLeadWave",seaHeight);
 txt("faroLeadPeriod",selected?num(session.swellPeriodS)+" s":"—");
 txt("faroLeadWind",selected?num(session.windKmh,0)+" km/h":"—");
 txt("faroLeadStatus",decision.status==="caution"?
  tr("Precaución del modelo: índice de sesión limitado a 5,9. Potencial oceánico "+num(session.score)+"/10.",
     "Model caution: session index capped at 5.9. Offshore potential "+num(session.score)+"/10."):
  decision.status==="blocked"?
   tr("Sesión bloqueada por restricción o riesgo grave. Potencial oceánico independiente: "+num(session?.score)+"/10.",
      "Session blocked by restriction or serious model risk. Independent offshore potential: "+num(session?.score)+"/10."):
  tr("Índice experimental de sesión; no equivale a seguridad ni valida la rompiente.",
    "Experimental session index; not a safety certificate or calibrated breaking surf."));
 if(decision.status==="blocked"&&!restricted()){
  txt("faroLeadHeadline",tr("Riesgo detectado: no se recomienda la sesión","Risk flagged: session not recommended"));
  txt("faroLeadDeck",tr("El modelo ha detectado condiciones peligrosas o insuficientemente verificadas. Comprueba las alertas oficiales.",
    "The model flags hazardous or insufficiently assessed conditions. Check official warnings."));
  return;
 }

 if(restricted()){
  txt("faroLeadHeadline",tr("Ventanas: restricción reportada",
   "Ventanas: reported restriction"));
  txt("faroLeadDeck",selected?
   tr("Hay una restricción recreativa reportada. FARO no recomienda entrar al agua.",
      "A recreational restriction has been reported. FARO does not recommend entering the water."):
   tr("No se ha verificado el levantamiento de la restricción reportada. Consulta la autoridad.",
      "The reported restriction has not been verified as lifted. Check with authorities."));
  return;
 }
 if(!selected&&state.forecast?.hazard?.level==="danger"){
  lead.classList.add("has-model-danger");
  txt("faroLeadHeadline",tr("Riesgo importante en el pronóstico","Significant model risk flagged"));
  txt("faroLeadDeck",tr("FARO detecta posibles condiciones peligrosas en el horizonte del modelo. No hay franja recomendada; consulta avisos oficiales.",
   "FARO flags potential hazards in the model horizon. No recommended session; check official warnings."));
  txt("faroLeadStatus",tr("Riesgo modelado · avisos oficiales no sincronizados",
   "Modelled risk · official warnings not automatically checked"));
  return;
 }
  if(!selected){
  if(state.loadFailed){
   txt("faroLeadSignalTitle",tr("MODELO SIN DATOS","MODEL UNAVAILABLE"));
   txt("faroLeadHeadline",tr("Pronóstico temporalmente no disponible","Forecast temporarily unavailable"));
   txt("faroLeadDeck",tr("El proveedor no entregó datos completos. Reintenta actualizar el pronóstico.",
    "The model provider did not return complete data. Try refreshing the forecast."));
   txt("faroLeadStatus",tr("Sin datos válidos no se calcula ni se inventa un score.",
    "No numerical score is calculated or invented without valid model data."));
  }else{
   txt("faroLeadHeadline",tr("Sin una ventana evaluable por ahora","No eligible window right now"));
   txt("faroLeadDeck",tr("Revisa el pronóstico completo, la disponibilidad de luz y los avisos oficiales.",
    "Check the full outlook, daylight and official notices."));
   txt("faroLeadStatus",tr("No existe una franja elegible; el índice de sesión no se calcula.",
    "No eligible window is available, so no session index is calculated."));
  }
  return;
 }
 // Past intervals remain inspectable but are never recommended as future sessions.
 const present=now();
 const past=state.hour!==null&&day?.date&&
  (day.date<present.date||(day.date===present.date&&session.hour+2<=present.hour));
 if(past){
  txt("faroLeadWindowLabel",tr("FRANJA YA TRANSCURRIDA","PAST WINDOW"));
  txt("faroLeadHeadline",tr("Esta franja ya pasó","This window has passed"));
  txt("faroLeadDeck",tr("Valores del modelo para horas anteriores; no representan una observación ni una oportunidad futura.",
   "Model values for earlier hours; not an observation or future surf opportunity."));
  return;
 }
 const name=spot()?.shortName||spot()?.name||tr("este spot","this break");
 txt("faroLeadHeadline",session.score>=8?
  tr("Buena ventana en "+name,"Promising window at "+name):
  session.score>=6?tr("Ventana para explorar en "+name,"Window to explore at "+name):
  tr("Condiciones cambiantes en "+name,"Variable conditions at "+name));
 // Data-first, no double marketing claim: distinguish modelled offshore
 // waves from actual surf and retain the on-site verification caveat.
 txt("faroLeadDeck",tr(
  "Oleaje oceánico "+num(session.totalWaveHeightM)+" m · período "+num(session.swellPeriodS)+" s. Verifica la rompiente.",
  "Offshore waves "+num(session.totalWaveHeightM)+" m · period "+num(session.swellPeriodS)+" s. Check conditions at the break."
 ));
}
function renderPrepHints(s){
 const host=$("faroPrepHints");if(!host)return;
 host.replaceChildren();
 const add=(label,value,type,level)=>{
  const item=el("span",null,"faro-prep-chip faro-prep-chip--"+type);
  if(level)item.dataset.level=level;
  item.append(el("small",label),el("strong",value));host.append(item);
 };
 const day=state.forecast?.days?.[state.day];
 const uv=ok(day?.uvMax)?Live.statusUV(day.uvMax,state.lang):null;
 if(s&&sessionDecision(s).canRecommend)
  add(tr("TRAJE","SUIT"),wetsuit(s),"wetsuit");
 if(ok(s?.waterTemperatureC))
  add(tr("AGUA · MOD.","MODEL WATER"),num(s.waterTemperatureC)+" °C","water");
 if(uv)add(tr("UV MÁX. DÍA","DAY MAX UV"),num(day.uvMax,0)+" · "+uv.name,"uv",uv.category);
 if(!s||!sessionDecision(s).canRecommend){
  add(tr("SESIÓN","SESSION"),tr("Sin franja confirmada","No confirmed window"),"neutral");
 }
}
function outlook(){
 const d=state.forecast?.days?.[state.day],s=selection();if(!d)return;
 $("dailyOverview").className="forecast-overview "+band(s?.score);
 txt("datehead",dateLabel(d.date));txt("spotname",spot()?.name||"—");
 const opportunity=localRead(s)?.decision;
 txt("bestTime",sessionTime(s));
 txt("bestTimeKicker",restricted()?tr("FRANJA MODELADA · NO RECOMENDADA",
  "MODELLED WINDOW · NOT RECOMMENDED"):!s?tr("SIN VENTANA SUGERIDA","NO SUGGESTED WINDOW"):
  opportunity?.priority>=3?tr("MEJOR VENTANA","BEST WINDOW"):
   tr("VENTANA PARA EVALUAR","WINDOW TO REVIEW"));
 txt("dayWave",s?num(s.totalWaveHeightM)+" m":"—");
 txt("dayWaveLabel",s?waveSizeLabel(s.totalWaveHeightM):"—");
 const meter=$("dayWaveMeter");meter.replaceChildren();
 if(s)meter.append(waveBars(s.totalWaveHeightM));
 waveExplanation(s);
 txt("dayPeriod",s?num(s.swellPeriodS)+" s":"—");
 txt("dayWind",s?num(s.windKmh,0)+" km/h":"—");
 const uvMax=ok(d.uvMax)?d.uvMax:null;
 const uv=Live.statusUV(uvMax,state.lang);
 txt("dayUVLabel",tr("UV MÁX. DEL DÍA · ","DAY MAX UV · ")+num(uvMax,0)+" · "+uv.name);
 txt("dayUVAdvice",uvMax===null?tr("Sin dato UV","UV unavailable"):uv.protection);
 $("dayUVBadge").dataset.uv=uv.category;
 renderPrepHints(s);
 vibeUI(s);
 renderLead(d,s);
}
function slots(){
 const container=$("slots"),quick=$("faroQuickHours");
 container.replaceChildren();
 const preservedHoursScroll=quick?.scrollLeft||0;
 quick?.replaceChildren();
 const day=state.forecast?.days?.[state.day];
 txt("faroQuickHourHelp",day?dateLabel(day.date):"—");
 if(quick)quick.setAttribute("aria-label",day?
  tr("Seleccionar horario del ","Choose a time window for ")+dateLabel(day.date):
  tr("Sin horarios disponibles","No time windows available"));
 if(!day)return;
 const present=now();
 for(const s of day.slots){
  const slotSafety=Live.slotRisk(s,state.config);
  const dangerous=slotSafety==="danger",unknownRisk=slotSafety==="unknown";
  const decision=sessionDecision(s),eligible=decision.canRecommend,display=decision.sessionScore;
  const button=el("button",null,(eligible?scoreTone(display):"chile-unavailable")+(selection()?.hour===s.hour?" selected":""));
  button.type="button";button.setAttribute("aria-pressed",String(selection()?.hour===s.hour));button.disabled=!s.modelComplete;
  button.append(el("span",h(s.hour)+"–"+h(s.hour+2),"chile-slot-hour"));
  button.append(el("strong",eligible?num(display):"—","chile-slot-score"));
 if(eligible)button.append(el("span",grade(display),"chile-slot-quality faro-grade "+gradeClass(display)));
  if(decision.status==="caution")button.title=tr("Precaución: potencial oceánico "+num(s.score)+"/10, índice de sesión "+num(display)+"/10.",
  "Caution: offshore potential "+num(s.score)+"/10, session index "+num(display)+"/10.");
  button.append(el("small",dangerous?tr(" Riesgo modelo"," Model risk"):unknownRisk?tr(" Riesgo sin evaluar"," Risk unassessed"):Live.slotRisk(s,state.config)==="caution"?tr(" Precaución"," Caution"):eligible?(localRead(s)?.decision?.shortLabel||Live.vibe(s,state.lang).label):s.daylight.eligible?tr("Sin score","No score"):tr("Sin luz","No daylight"),"chile-slot-vibe"));
  if(selection()?.hour===s.hour){
   const choice=el("span",tr("ELEGIDA","SELECTED"),"faro-slot-selected-label");
   button.append(choice);
  }
  button.addEventListener("click",()=>{state.hour=s.hour;renderSelectedWindow()});container.append(button);
  if(quick){
   const past=day.date<present.date||
    (day.date===present.date&&s.hour+2<=present.hour);
   const value=decision.canRecommend?decision.sessionScore:null;
   const label=past?tr("Ya pasó","Past"):
    dangerous?tr("Riesgo","Risk"):
    unknownRisk?tr("Sin evaluar","Unassessed"):
    !s.daylight?.eligible?tr("Sin luz","No daylight"):
    ok(value)?grade(value):tr("Sin score","No score");
   const current=selection()?.hour===s.hour;
   const mini=el("button",null,"faro-console-hour-chip "+
    (ok(value)?scoreTone(value):"faro-console-empty")+
    (current?" is-selected":"")+(past?" is-past":""));
   mini.type="button";
   mini.dataset.hour=String(s.hour);
   mini.disabled=!s.modelComplete;
   mini.setAttribute("aria-pressed",String(current));
   // Swap repeated quality text for modelled wind in safe, future hours.
   // Preserve risk, caution, darkness and past labels in all other cases.
   const windReady=!past&&!dangerous&&!unknownRisk&&slotSafety!=="caution"&&
    s.daylight?.eligible&&ok(value)&&ok(s.windKmh)&&ok(s.windDirection);
   const compactWind=windReady?Live.cardinal(s.windDirection)+" · "+num(s.windKmh,0):null;
   mini.setAttribute("aria-label",sessionTime(s)+" · "+label+
    (ok(value)?" · "+num(value)+"/10":"")+
    (windReady?tr(" · viento "," · wind ")+num(s.windKmh,0)+" km/h · "+
     Live.cardinal(s.windDirection):""));
   mini.append(el("span",h(s.hour)+"–"+h(s.hour+2),"faro-console-hour-time"));
   mini.append(el("strong",ok(value)?num(value):"—","faro-console-hour-score"));
   mini.append(el("small",compactWind||label,"faro-console-hour-label"+
    (windReady?" is-wind":"")));
   mini.addEventListener("click",()=>{
    state.hour=s.hour;renderSelectedWindow();
    $("faroQuickHours")?.querySelector('[data-hour="'+s.hour+'"]')?.focus({preventScroll:true});
   });
   quick.append(mini);
  }
 }
 if(quick){
  quick.scrollLeft=preservedHoursScroll;
  const selected=quick.querySelector(".is-selected");
  if(selected&&window.innerWidth<1120)requestAnimationFrame(()=>{
   if(!selected.isConnected)return;
   const rail=quick.getBoundingClientRect(),tile=selected.getBoundingClientRect();
   const centre=quick.scrollLeft+tile.left-rail.left-(rail.width-tile.width)/2;
   quick.scrollLeft=Math.max(0,Math.min(quick.scrollWidth-quick.clientWidth,centre));
  });
 }
 // Keep the chosen two-hour window visible in the swipeable mobile rail.
 // Scroll the rail, not the document, so page position never jumps.
 if(window.matchMedia("(max-width:710px)").matches){
  const selected=container.querySelector(":scope > button.selected");
  if(selected)requestAnimationFrame(()=>{
   if(!selected.isConnected||!container.isConnected)return;
   const rail=container.getBoundingClientRect(),tile=selected.getBoundingClientRect();
   const centre=container.scrollLeft+tile.left-rail.left-(rail.width-tile.width)/2;
   container.scrollLeft=Math.max(0,Math.min(container.scrollWidth-container.clientWidth,centre));
  });
 }
 session();
}
function basicTable(rows){
 const t=el("table",null,"chile-model-table");
 for(const [name,value]of rows){const row=el("tr"),label=el("th",name);label.scope="row";row.append(label,el("td",value));t.append(row)}
 return t;
}
/* The map already visualises bearing vectors at the actual break.
 * No oversized duplicate compass diagram: the optional technical drawer
 * exists to explain line colours, origin angles and limits clearly.
 */
function compass(s){
 const box=$("waveinsight");box.replaceChildren();
 if(!s){box.append(el("p",tr("Sin dirección disponible.","Direction unavailable."),"muted"));return}
 const grid=el("div",null,"faro-direction-facts");
 for(const [kind,name,value,detail] of [
   ["swell",tr("Swell · azul","Swell · blue"),s.swellDirection,
    tr("De dónde llega el oleaje oceánico.","Where offshore swell comes from.")],
   ["wind",tr("Viento · ocre","Wind · ochre"),s.windDirection,
    tr("De dónde sopla el viento.","Where the wind blows from.")]
  ]){
  const card=el("div",null,"faro-direction-fact faro-direction-fact--"+kind);
  const header=el("span",null,"faro-direction-fact-label");
  header.append(el("i",null,"faro-direction-dot"),el("strong",name));
  card.append(header,el("b",ok(value)?num(value,0)+"°":"—"),
   el("small",detail));
  grid.append(card);
 }
 box.append(grid);
 const period=el("p",null,"faro-direction-period");
 period.textContent=tr("Período swell: ","Swell period: ")+num(s.swellPeriodS)+" s";
 box.append(period,el("p",tr(
  "Los grados indican DE DÓNDE vienen swell y viento. Las flechas en el mapa muestran hacia dónde viajan. No se modela la refracción local ni el ángulo de rompiente.",
  "Bearings indicate WHERE swell and wind come FROM. Arrows on the map show their direction of travel. Local refraction and breaking angle are not modelled."
 ),"chile-compass-note"));
}
function thermal(s){
 return window.FaroThermalGuide?.guide({
  waterC:s?.waterTemperatureC,airC:s?.temperatureC,windKmh:s?.windKmh
 })||{available:false};
}
function wetsuit(s){
 const g=thermal(s);
 return g.available?g.primary+" mm":tr("Verificar temperatura del agua","Check water temperature");
}
function thermalExposure(g){
 return g.exposure==="high"?tr("Mayor exposición","Higher exposure"):
  g.exposure==="moderate"?tr("Exposición moderada","Moderate exposure"):
  tr("Exposición suave","Mild exposure");
}
function session(){
 const s=selection(),d=state.forecast?.days?.[state.day],main=$("sessionAtGlance"),ess=$("sessionEssentials");
 main.replaceChildren();ess.replaceChildren();
 if(!s){
  txt("sessionDetailSummary",tr("Sin franja","No window"));
  main.append(el("p",tr("No hay una franja evaluable. Selecciona otro horario antes de preparar el equipo.","No assessable window. Choose another time before preparing your gear."),"muted"));
  return;
 }
 txt("sessionDetailSummary",sessionTime(s));
 // FARO Session Kit: one dominant recommendation and a conscious warmer
 // alternative, never a physiological wind-chill temperature prediction.
 const g=thermal(s);
 const heading=el("div",null,"faro-session-kit-reading");
 const primary=el("div",null,"faro-kit-primary");
 primary.append(el("small",tr("TRAJE ORIENTATIVO","SUGGESTED SUIT")));
 primary.append(el("strong",g.available?g.primary+" mm":"—"));
 const alternative=el("div",null,"faro-kit-alternative");
 alternative.append(el("small",tr("MÁS AISLAMIENTO","MORE INSULATION")));
 alternative.append(el("strong",g.available&&g.warmerDistinct?g.warmer+" mm":"—"));
 heading.append(primary,alternative);
 main.append(heading);
 const brief=el("p",g.available?
  thermalExposure(g)+" · "+tr("Agua, aire y viento modelados. Ajusta según duración y tolerancia al frío.",
    "Modelled water, air and wind. Adjust for session length and cold tolerance."):
  tr("Sin datos suficientes para orientar el traje.","Insufficient data for suit guidance."),"faro-kit-context");
 main.append(brief);
 const essentials=[
  ["water-temperature",tr("AGUA · MODELO","WATER · MODEL"),num(s.waterTemperatureC)+" °C"],
  ["air-temperature",tr("AIRE · MODELO","AIR · MODEL"),num(s.temperatureC)+" °C"],
  ["wind-speed",tr("VIENTO · MODELO","WIND · MODEL"),num(s.windKmh,0)+" km/h"],
  ["uv-index",tr("UV · ESTA FRANJA","UV · THIS WINDOW"),num(s.uvIndex)+" · "+s.uv.name]
 ];
 for(const [kind,label,value] of essentials){
  const tag=el("div",null,"faro-kit-signal"+(kind==="uv-index"?" chile-uv-tag chile-uv-"+s.uv.category:""));
  const icon=el("span",null,"faro-icon-slot");icon.setAttribute("data-faro-icon",kind);
  tag.append(icon,el("small",label),el("strong",value));ess.append(tag);
 }
 txt("rise",d.sunrise?.slice(11,16)||"—");txt("set",d.sunset?.slice(11,16)||"—");
 const sunset=d.sunset?.slice(11,16).split(":").map(Number);
 const cut=sunset?.length===2?Math.max(0,sunset[0]*60+sunset[1]-35):null;
 const out=cut===null?"—":h(Math.floor(cut/60))+":"+h(cut%60);
 txt("cutoff",out);txt("daylightBrief",tr("Salida sugerida ","Suggested exit ")+out);
 const science=$("faroScienceSnapshot");
 if(science){
  science.replaceChildren();
  const metrics=[
   [tr("SWELL PRINCIPAL","PRIMARY SWELL"),num(s.swellHeightM)+" m"],
   [tr("PERÍODO","PERIOD"),num(s.swellPeriodS)+" s"],
   [tr("DIRECCIÓN · DESDE","DIRECTION · FROM"),Live.cardinal(s.swellDirection)+" · "+num(s.swellDirection,0)+"°"],
   [tr("RACHA MÁX.","GUSTS"),num(s.gustKmh,0)+" km/h"]
  ];
  for(const [name,value]of metrics){
   const cell=el("div",null,"faro-lab-metric");
   cell.append(el("small",name),el("strong",value));
   science.append(cell);
  }
  const caveat=el("p",tr("Modelo oceánico, no medida de la rompiente.","Offshore model, not a measured breaking wave."),"faro-lab-caveat");
  science.append(caveat);
 }
 const content=$("detail");content.replaceChildren();
 const lab=window.FaroRegionResponse;
 if(lab){
  const input=s.modelComplete?{swellHeightM:s.swellHeightM,swellPeriodS:s.swellPeriodS,swellFromDeg:s.swellDirection,swellDirection:s.swellDirection,secondarySwell:s.secondarySwell,tertiarySwell:s.tertiarySwell,windSeaHeightM:s.windSeaHeightM,totalWaveHeightM:s.totalWaveHeightM,windFromDeg:s.windDirection,windDirection:s.windDirection,windKmh:s.windKmh,gustKmh:s.gustKmh}:null;
  const response=input?lab.chile(input,state.profiles,s.spotId):null;
  content.insertAdjacentHTML("beforeend",lab.markup(lab.report(input,response,{waterC:s.waterTemperatureC,airC:s.temperatureC,windKmh:s.windKmh}),state.lang));
 }
 const grid=state.forecast?.model?.marineGrid,metGrid=state.forecast?.model?.weatherGrid;
 const coverage=state.forecast?.model?.coverage;
 const coordinateStatus=state.forecast?.model?.referencePointStatus||"unverified";
 const scientificRows=[
  [tr("Oleaje total del modelo","Model total waves"),num(s.totalWaveHeightM)+" m"],
  [tr("Altura del swell primario","Primary swell height"),num(s.swellHeightM)+" m"],
  [tr("Período swell","Swell period"),num(s.swellPeriodS)+" s"],
  [tr("Dirección swell · DESDE","Swell · FROM"),Live.cardinal(s.swellDirection)+" · "+num(s.swellDirection,0)+"°"],
  ...[["secondarySwell",tr("Swell secundario","Secondary swell")],["tertiarySwell",tr("Swell terciario","Tertiary swell")]].map(([key,label])=>{
   const part=s[key];return [label,part?num(part.heightM)+" m · "+num(part.periodS)+" s · "+Live.cardinal(part.fromDeg)+" ("+num(part.fromDeg,0)+"°)":tr("No disponible en este modelo","Not available from this model")];
  }),
  [tr("Viento · DESDE","Wind · FROM"),Live.cardinal(s.windDirection)+" · "+num(s.windDirection,0)+"°"],
  [tr("Rachas","Gusts"),num(s.gustKmh,0)+" km/h"],
  [tr("Nivel marino modelado · MSL","Modelled sea level · MSL"),
   ok(s.seaLevelMslM)?
    num(s.seaLevelMslM,2)+" m · "+
     (ok(s.seaLevelChangeM)?
      (s.seaLevelChangeM>.025?tr("subiendo","rising"):s.seaLevelChangeM<-.025?tr("bajando","falling"):tr("casi estable","nearly steady")):
      tr("tendencia desconocida","trend unknown")):
    tr("Sin dato costero","Coastal sea level unavailable")],
  [tr("Precipitación ventana","Rain in window"),num(s.precipitationMm)+" mm"],
  [tr("Índice UV","UV index"),num(s.uvIndex)+" · "+s.uv.name],
  [tr("Nubosidad","Cloud cover"),num(s.cloudPercent,0)+" %"],
  [tr("Temperatura aire","Air temperature"),num(s.temperatureC)+" °C"],
  [tr("Validez UTC de esta ventana","UTC valid time for window"),s.validTimesUtc?.length?s.validTimesUtc.join(" / "):tr("No disponible","Unavailable")],
  [tr("Reloj de datos","Timestamp basis"),state.forecast?.model?.timeBasis==="epoch_utc"?"UTC · IANA "+state.config.timezone:tr("Hora local no verificada","Unverified local time")],
  [tr("Swell opcional","Optional swell"),state.forecast?.model?.optionalSwellFallback?tr("Proveedor no admitió particiones; se usó el pronóstico principal","Provider rejected partitions; primary model used"):tr("Solo componentes disponibles","Available components only")],
  [tr("Ventana · cobertura del modelo","Window · model coverage"),s.coverage?.complete?tr("2/2 horas válidas","2/2 valid hours"):tr("Datos incompletos","Incomplete data")],
  [tr("Ventanas completas · 7 días","Complete windows · 7 days"),coverage?(coverage.completeSlots+"/"+coverage.totalSlots):"—"],
  [tr("Celda oceánica a referencia costera","Marine grid to coastal reference"),ok(grid?.distanceKm)?num(grid.distanceKm)+" km":tr("No disponible","Unavailable")],
  [tr("Celda meteorológica a referencia costera","Weather grid to coastal reference"),ok(metGrid?.distanceKm)?num(metGrid.distanceKm)+" km":tr("No disponible","Unavailable")]
 ];
 const groups=[
  [0,6,tr("Oleaje y swell","Waves & swell")],
  [6,8,tr("Viento","Wind")],
  [8,13,tr("Nivel del mar y ambiente","Sea level & environment")],
  [13,scientificRows.length,tr("Trazabilidad del modelo","Model provenance")]
 ];
 for(const [from,to,title] of groups){
  const section=el("section",null,"faro-lab-readout-group");
  section.append(el("h5",title),basicTable(scientificRows.slice(from,to)));
  content.append(section);
 }
 content.append(el("p",tr("Distancias desde una referencia costera, NO desde una rompiente georreferenciada. Estado de referencia: ","Distances from a coastal reference, NOT a surveyed breaking wave. Reference status: ")+coordinateStatus+". "+tr("La hora de consulta no es la hora de emisión del modelo.","Fetch time is not model issue time."),"muted"));
 content.append(el("p",tr("Open-Meteo: la celda marina NO representa la ola rompiente ni marea óptima. Nivel MSL: modelo grueso (~8 km) que incluye mareas y otros procesos; no es un mareógrafo local ni dato de navegación. La vigilancia oficial automatizada es parcial y no acredita condiciones seguras.","Open-Meteo grids do NOT resolve breaking surf or optimal tide. MSL sea level is a coarse (~8 km) tide-plus-other-process model, not a local gauge or navigation datum. Automated official-source monitoring is partial and does not establish safe conditions."),"muted"));
 const UV=el("div","UV "+num(s.uvIndex)+": "+(s.uv.protection||tr("Sin dato","Unavailable")),"chile-uv-note chile-uv-"+s.uv.category);content.append(UV);
 link(content,tr("DMC · Radiación UV oficial","DMC · Official UV forecast"),"https://www.meteochile.gob.cl/PortalDMC-web/otros_pronosticos/radiacion_uv.xhtml");
 const wear=$("wetsuit");
 wear.replaceChildren(el("p",tr("El traje se calcula para la sesión elegida en el panel de preparación. Esta guía utiliza agua, aire y viento modelados, no una temperatura corporal calculada.",
  "The selected session kit is shown in the preparation panel. The guide uses modelled water, air and wind, not calculated body temperature."),"muted"));
 const goto=el("button",tr("Ver equipo de la sesión","See session kit"),"faro-kit-goto");
 goto.type="button";goto.addEventListener("click",()=>{
  const panel=$("sessionDetailExpand");panel.open=true;panel.scrollIntoView({block:"center",behavior:"smooth"});
 });
 wear.append(goto);
 compass(s);
}

function faroCLConsoleData(){
 const lang=state.lang,es=lang==='es',t=(a,b)=>es?a:b,days=state.forecast?.days||[],d=days[state.day],s=selection(),decision=sessionDecision(s),present=now();
 const past=!!s&&!remainingWindow(d,s,present);
 const read=id=>$(id)?.textContent?.trim()||'';
 const fmt=new Intl.DateTimeFormat(es?'es-CL':'en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});
 const g=s?thermal(s):null,prep=[];if(s&&decision.canRecommend&&g?.available)prep.push({label:t('Traje orientativo','Suggested suit'),value:g.primary+' mm'});if(ok(s?.waterTemperatureC))prep.push({label:t('Agua · modelo','Water · model'),value:num(s.waterTemperatureC)+' °C'});if(ok(d?.uvMax))prep.push({label:t('UV máx. día','Day max UV'),value:num(d.uvMax,0)+' · '+Live.statusUV(d.uvMax,lang).name});
 return {lang,spots:(state.config?.pilots||[]).map(p=>({id:p.id,label:p.name})),spotId:spot()?.id,location:(spot()?.name||'Valparaíso')+(d?' · '+dateLabel(d.date):''),updated:read('updated'),
 days:days.map((v,i)=>{const b=bestRemaining(v),z=b?sessionDecision(b):null;return {id:i,label:v.date===present.date?t('Hoy','Today'):fmt.format(new Date(v.date+'T12:00:00Z')),score:z?.canRecommend?z.sessionScore:null,grade:z?.canRecommend?grade(z.sessionScore):'',note:b?sessionTime(b):t('Sin ventana','No window'),selected:i===state.day}}),
 hours:(d?.slots||[]).map(v=>{const z=sessionDecision(v),past=d.date<present.date||(d.date===present.date&&(v.hour+2)*60<=present.minutes),remaining=remainingWindow(d,v,present),risk=Live.slotRisk(v,state.config);return {id:v.hour,label:h(v.hour)+'–'+h(v.hour+2),selected:s?.hour===v.hour,disabled:!v.modelComplete||!remaining||!z.canRecommend,score:remaining&&z.canRecommend?z.sessionScore:null,note:past?t('Ya pasó','Past'):risk==='danger'?t('Riesgo','Risk'):risk==='caution'?t('Precaución','Caution'):risk==='unknown'?t('Sin evaluar','Unassessed'):!v.daylight?.eligible?t('Sin luz','No daylight'):!remaining?t('Sin tiempo','Too late'):ok(v.windKmh)?(ok(v.windDirection)?Live.cardinal(v.windDirection)+' · ':'')+Math.round(v.windKmh)+' km/h':t('Sin datos','No data')}}),
 prep,local:d?{headline:read('chileVibeHeadline')||read('chileDecisionHeadline'),paragraphs:[read('chileDecisionDriver'),read('chileVibeRead'),read('chileVibeAction'),read('chileVibeEvidence'),read('chileVibeExplained')].filter(Boolean),uvAdvice:ok(d.uvMax)&&d.uvMax>=3?read('dayUVLabel')+' · '+read('dayUVAdvice'):''}:null,hourDate:d?dateLabel(d.date):'',headline:read('faroLeadHeadline'),caution:decision.status==='caution',verdict:decision.status==='caution'?t('Ventana con precaución','Window with caution'):decision.canRecommend?t('Ventana para evaluar','Window to assess'):'',reason:decision.status==='caution'?t('Precaución del modelo. Revisa las condiciones y los avisos oficiales.','Model caution. Check conditions and official notices.'):decision.canRecommend?read('chileDecisionDriver'):'',deck:read('faroLeadDeck'),score:!past&&decision.canRecommend?decision.sessionScore:null,grade:past?t('Ya pasó','Past'):read('faroLeadGrade'),scoreLabel:read('faroLeadSignalTitle'),windowLabel:state.hour!==null&&s?.hour===state.hour?t('Franja seleccionada','Selected window'):t('Mejor franja evaluable','Best eligible window'),window:s?sessionTime(s):'—',wave:s&&ok(s.totalWaveHeightM)?num(s.totalWaveHeightM)+' m':'—',period:s&&ok(s.swellPeriodS)?num(s.swellPeriodS)+' s':'—',wind:s&&ok(s.windKmh)?num(s.windKmh,0)+' km/h':'—',disclaimer:read('faroLeadStatus')};
}
function mountFaroCLConsole(){
 try{window.faroConsole=window.FaroForecastConsole?.mount({
 before:$('faroDayRail'),retire:[document.querySelector('.faro-context-dock'),$('faroDayRail'),$('faroForecastLead'),document.querySelector('#dayview>.faro-decision-intro'),document.querySelector('#dayview>.day-outlook-section'),document.querySelector('#dayview>.hourly-section'),$('dayStrip'),document.querySelector('.faro-journey-nav')],
 getData:faroCLConsoleData,beacon:document.querySelector('#faroForecastLead .faro-beacon-symbol'),regionLinks:[{label:'Zeeland',href:'../'},{label:'Chile',href:'./',current:true}],
 onSpot:id=>{const select=$('chileSpotSelect');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}))},
 onDay:i=>{state.day=i;state.hour=null;render()},onHour:i=>{state.hour=i;renderSelectedWindow()},
 onRefresh:()=>void refresh(true),onDetails:()=>{const d=$('sessionDetailExpand');d.open=true;d.scrollIntoView({block:'start',behavior:'smooth'})},onExplore:()=>$('faroLeadMap').click(),onDNA:()=>{const el=$('spotInsightExpand');el.open=true;el.scrollIntoView({block:'start',behavior:'smooth'})},onCamera:()=>{const el=$('cameraExpand');el.open=true;el.scrollIntoView({block:'start',behavior:'smooth'})},onMatch:()=>tab('board')
 });if(window.faroConsole)document.querySelector('.faro-skip-link')?.setAttribute('href','#faroSharedConsole')}catch(e){console.error('FARO shared console unavailable',e)}
}

function render(){
 if(!state.forecast){window.faroConsole?.update();return;}
 txt("chileLiveState",state.dataStale?tr("GUARDADO","CACHED"):tr("LIVE · MODELO","LIVE · MODEL"));
 paintAccessNotice();
 const session=selection();
 txt("sessionDetailSummary",session?
  sessionTime(session):
  tr("Sin ventana disponible","No available window"));
 txt("updated",tr("Modelo consultado ","Model fetched ")+new Intl.DateTimeFormat(state.lang==="es"?"es-CL":"en-GB",{timeZone:"America/Santiago",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(state.forecast.model.fetchedAt))+" · CL");
 risk(state.forecast.hazard);strip();outlook();slots();renderDNA();renderCameras();
 state.videoLab?.refreshCameras();updateCoastMap();renderHourlyPreview();if(state.tab==="board")match();
 if(state.dataStale)showStaleModel();
 window.faroConsole?.update();
}
// A broken model request must never strand Safari in an offline state.
// Retrying is strictly bounded and only runs while the page is visible.
let reconnectTimer=null,reconnectFailures=0;
function cancelReconnect(){
 if(reconnectTimer!==null){clearTimeout(reconnectTimer);reconnectTimer=null}
}
function queueReconnect(error){
 cancelReconnect();
 if(!state.config||document.hidden)return;
 const delays=[8000,25000,60000,120000];
 const ms=Number(error?.status)===429?120000:delays[Math.min(reconnectFailures,delays.length-1)];
 reconnectFailures=Math.min(reconnectFailures+1,delays.length);
 reconnectTimer=setTimeout(()=>{
  reconnectTimer=null;
  if(!document.hidden&&state.config&&(state.loadFailed||state.dataStale))void refresh(true);
 },ms);
}
function modelErrorTitle(error){
 const status=Number(error?.status);
 if(status===429)return tr("LÍMITE DEL PROVEEDOR","PROVIDER RATE LIMIT");
 if([400,424].includes(status))return tr("DATOS DEL MODELO INCOMPLETOS","INCOMPLETE MODEL DATA");
 if([502,503,504].includes(status))return tr("PROVEEDOR NO DISPONIBLE","PROVIDER UNAVAILABLE");
 if(/failed to fetch|network|load failed|abort|timeout/i.test(String(error?.message||error)))
  return tr("ERROR DE CONEXIÓN","CONNECTION ERROR");
 return tr("MODELO NO DISPONIBLE","MODEL UNAVAILABLE");
}
// A time-slot click changes only the selected window. Keep week choices,
// camera feeds, source checks and the rest of the model DOM intact instead of
// rebuilding the entire forecast (and reinitialising expensive widgets).
function renderSelectedWindow(){
 if(!state.forecast)return;
 outlook();
 slots(); // includes Session Kit and its model/UV provenance
 renderDNA();
 updateCoastMap();
 renderHourlyPreview();
 if(state.tab==="board")match();
 window.faroConsole?.update();
}
async function refresh(force=false,onSettled=null){
 if(!state.config)return;
 void window.faroOutlook?.sync();
 const id=spot().id,serial=++state.serial,stored=state.cache.get(id);
 // Never show conditions from an earlier selected spot during a new request.
 if(state.forecast?.spot?.id!==id){state.forecast=null;state.sharedSnapshot=false;}
 if(!force&&stored&&Date.now()-stored.at<activeModelCacheMs){
  state.forecast=stored.forecast;state.loadFailed=false;state.dataStale=false;state.sharedSnapshot=false;
  modelState("ready");render();onSettled?.();return
 }
 // Paint a labelled, last-valid local snapshot immediately after reload, while
 // two real provider requests run. Never mark this fallback as LIVE.
 if(!force&&!stored&&!state.forecast){
  const saved=readLastValid(id);
  if(saved){state.forecast=saved;state.loadFailed=false;state.dataStale=true;state.sharedSnapshot=false;modelState("ready");render();}
 }
 state.loadFailed=false;
 if(!state.forecast){
  modelState("pending");
  const name=spot()?.shortName||spot()?.name||"Valparaíso";
  txt("faroLeadLocation",spot()?.name||"Valparaíso · Chile");
  txt("faroLeadHeadline",tr("Leyendo el mar en "+name,"Reading the ocean at "+name));
  txt("faroLeadDeck",tr("Conectando oleaje y meteorología. El índice aparecerá solo cuando haya datos válidos.",
   "Loading swell and weather models. The index appears only when valid model data is available."));
 }
 lastModelFetchStartedAt=Date.now();
 txt("updated",tr("Consultando modelos para ","Loading model for ")+spot().name+"…");
 txt("status",tr("ACTUALIZANDO…","UPDATING…"));
 try{
  // Start the live request immediately. A same-origin verified forecast can
  // paint the interface while Safari's direct third-party request is pending.
  // An early network rejection is settled to avoid unhandled promises.
  const live=Live.fetchSpot(state.config,spot(),state.profiles,fetch,state.lang)
   .then(data=>({data}),error=>({error}));
  const backup=await readSharedForecast(id);
  if(serial!==state.serial)return;
  if(backup&&(!state.forecast||state.dataStale)){
   state.forecast=backup;state.loadFailed=false;state.dataStale=true;
   state.sharedSnapshot=true;modelState("ready");render();
  }
  const result=await live;
  if(result.error)throw result.error;
  const data=result.data;
  if(serial!==state.serial)return;
  state.cache.set(id,{forecast:data,at:Date.now()});
  saveLastValid(id,data);
  state.forecast=data;state.loadFailed=false;state.dataStale=false;state.sharedSnapshot=false;
  cancelReconnect();reconnectFailures=0;
   modelState("ready");
   txt("status",tr("LIVE · MODELO","LIVE · MODEL"));render();onSettled?.();
 }catch(err){
  if(serial!==state.serial)return;
  // Prefer a recent, first-party captured forecast over a blank screen;
  // it is labelled BACKUP, never LIVE or a beach observation.
  if(state.sharedSnapshot&&state.forecast?.spot?.id===id){
   state.loadFailed=false;state.dataStale=true;
   modelState("ready");render();queueReconnect(err);
   onSettled?.();return;
  }
  const previous=readLastValid(id);
  if(previous){
   state.forecast=previous;state.day=0;state.hour=null;
   state.loadFailed=false;state.dataStale=true;state.sharedSnapshot=false;
    modelState("ready");render();
   queueReconnect(err);
   onSettled?.();return;
  }
  state.forecast=null;state.loadFailed=true;state.dataStale=false;state.sharedSnapshot=false;
   modelState("unavailable");
   renderPrepHints(null);renderLead(null,null);
  txt("status",modelErrorTitle(err));
  txt("chileLiveState",tr("SIN DATOS","NO DATA"));
  const reason=String(err.message||err);
  txt("updated",tr("Sin datos nuevos · reintento automático. ","No new data · automatic retry. ")+reason);
  $("updated").title=reason;
  queueReconnect(err);
  $("dayStripItems").replaceChildren(el("p",tr("No hay datos nuevos; no se muestran scores ficticios.","Fresh data unavailable; no fictional scores shown."),"muted"));
  $("slots").replaceChildren();$("sessionAtGlance").replaceChildren();
  risk(null);onSettled?.();
 }
}
// Safari can freeze background tabs for hours. Resume with an automatic,
 // bounded-age refresh instead of requiring the surfer to find a reload icon.
function refreshWhenVisible(){
 if(document.hidden||!state.config)return;
 const cached=state.cache.get(spot().id);
 const nowMs=Date.now();
 if(state.loadFailed||state.dataStale){
  if(nowMs-lastModelFetchStartedAt<7000)return;
  cancelReconnect();void refresh(true);return;
 }
 if(cached&&nowMs-cached.at<activeModelCacheMs)return;
 if(nowMs-lastModelFetchStartedAt<activeModelCacheMs)return;
 void refresh(true);
}
document.addEventListener("visibilitychange",()=>{
 if(document.hidden)cancelReconnect();
 else refreshWhenVisible();
});
window.addEventListener("online",()=>{
 if(state.loadFailed||state.dataStale)refreshWhenVisible();
});
window.addEventListener("pageshow",refreshWhenVisible);
window.addEventListener("focus",refreshWhenVisible);
window.setInterval(refreshWhenVisible,120000);

function picker(){
 paintAccessNotice();
 const list=$("chileSpotSelect");list.replaceChildren();
 for(const s of state.config.pilots){const item=el("option",s.name);item.value=s.id;list.append(item)}
 list.value=spot().id;
 spotChooser?.refresh();
}
async function rankings(){
 const host=$("highlights"),more=$("additionalWeekPicks"),moreHost=$("additionalWeekList");
 host.replaceChildren(el("p",tr("Comparando spots con acceso no restringido…","Comparing unrestricted model spots…"),"muted"));
 more.hidden=true;more.open=false;moreHost.replaceChildren();
 txt("rankingstatus",tr("Consultando franjas","Loading windows"));
 const candidateSpots=state.config.pilots.filter(sp=>
   sp.accessNotice?.publicRecommendationAllowed!==false);
 const results=await Promise.allSettled(candidateSpots.map(async sp=>{
  const cached=state.cache.get(sp.id);
  if(cached&&Date.now()-cached.at<activeModelCacheMs)return cached.forecast;
  const data=await Live.fetchSpot(state.config,sp,state.profiles,fetch,state.lang);
  state.cache.set(sp.id,{forecast:data,at:Date.now()});return data;
 }));
 const all=[];
 for(const result of results)if(result.status==="fulfilled"){
  const model=result.value;
  for(const day of model.days){
   const selected=bestRemaining(day,model.spot.id);
   if(selected&&ok(sessionDecision(selected,model.spot).sessionScore))
    all.push({model,day,s:selected,effective:sessionDecision(selected,model.spot).sessionScore});
  }
 }
 all.sort((a,b)=>b.effective-a.effective||
  (localRead(b.s,b.model.spot.id)?.decision?.priority??2)-
  (localRead(a.s,a.model.spot.id)?.decision?.priority??2)||
  a.day.date.localeCompare(b.day.date));
 // A guide-derived 0–10 index still lacks observed-surf calibration. Show
 // one representative window per distinct spot, then disclose alternatives;
 // do not imply that a numerical difference is a measured accuracy ranking.
 const unique=[],seen=new Set();
 for(const item of all){
  if(seen.has(item.model.spot.id))continue;
  seen.add(item.model.spot.id);unique.push(item);
 }
 host.replaceChildren();
 const count=unique.length;
 txt("rankingstatus",tr(count+" spots con datos",""+count+" spots with data"));
 txt("rankingContext",!count?tr(
  "Todavía no hay franjas comparables para recomendar.","No comparable model windows are available yet."
 ):tr(
  "FARO v0.4: swells Hs²·T, direcciones compatibles con cada playa y viento. Orden por potencial calculado; escala 0–10 experimental sin validar en olas rompientes.",
  "FARO v0.4: Hs²·T swells, spot-specific guide bearings and wind. Sorted by modelled potential; experimental 0–10 without breaking-surf validation."
 ));
 if(!count){
  host.append(el("p",tr("Sin candidatos evaluables por ahora.","No assessable candidates yet."),"muted"));return;
 }
 const card=item=>{
  const b=el("button",null,"highlight chile-ranking "+scoreTone(item.effective));
  b.type="button";
  b.setAttribute("aria-label",item.model.spot.name+" · "+dateLabel(item.day.date)+" · "+
   sessionTime(item.s)+" · "+num(item.effective)+"/10");
  const content=el("div",null,"faro-week-pick-content");
  content.append(
   el("strong",item.model.spot.name,"chile-rank-name"),
   el("span",dateLabel(item.day.date)+" · "+sessionTime(item.s),"chile-rank-when")
  );
  const facts=el("div",null,"faro-week-pick-facts");
  if(ok(item.s.swellPeriodS))facts.append(el("span",tr("Período ","Period ")+
   num(item.s.swellPeriodS)+" s"));
  if(ok(item.s.windKmh))facts.append(el("span",tr("Viento ","Wind ")+
   num(item.s.windKmh,0)+" km/h"));
  content.append(facts);
  const rating=el("div",null,"chile-rank-rating");
  rating.append(el("strong",num(item.effective),"chile-rank-score"),
   el("span","/10","chile-rank-denominator"));
  b.append(content,rating);
  b.addEventListener("click",()=>{
   state.selected=state.config.pilots.findIndex(sp=>sp.id===item.model.spot.id);
   state.forecast=item.model;state.day=item.day.index;state.hour=item.s.hour;
   picker();tab("forecast");render();
   document.getElementById("forecastPage")?.scrollIntoView({block:"start",behavior:"instant"});
  });
  return b;
 };
 for(const item of unique.slice(0,3))host.append(card(item));
 const rest=unique.slice(3);
 more.hidden=!rest.length;
 if(rest.length){
  txt("additionalWeekLabel",tr("Ver otro spot comparado","View another compared spot"));
  for(const item of rest)moreHost.append(card(item));
 }
}
function match(){
 if(restricted()){
  const host=$("matchResult");host.replaceChildren(
   el("strong",tr("Ventanas · sin recomendación de equipo o sesión",
    "Ventanas · no gear or session recommendation")),
   el("p",tr("El modelo puede calcular potencial oceánico, pero no se ha verificado el levantamiento de la restricción sanitaria. Consulta fuentes oficiales antes de cualquier actividad.",
    "The model can estimate offshore potential but the health restriction has not been verified lifted. Check official sources before any activity.")));
  return;
 }
 const s=selection(),fit=Live.boardFit(sessionDecision(s).canRecommend?s:null,$("matchBoard").value,$("matchAbility").value,$("matchStyle").value,state.lang,state.forecast?.hazard);
 const host=$("matchResult");host.replaceChildren(el("strong",fit.label),el("p",fit.reason),el("p",tr("Spot: ","Spot: ")+(spot()?.name||"—")+(s?" · "+sessionTime(s):"")));
 const button=el("button",tr("Ver pronóstico","View forecast"));button.type="button";button.addEventListener("click",()=>tab("forecast"));host.append(button);
}
async function initialize(){
 if(!Live||!window.FaroChileScoreLab){txt("updated",tr("Falta el motor de Chile.","Chile model code is unavailable."));return}
 setLanguage();
 $("languageToggle").addEventListener("click",()=>{
  state.lang=state.lang==="es"?"en":"es";
  try{localStorage.setItem("zeeland-language",state.lang)}catch(e){}
  setLanguage();state.cache.clear();void refresh(true);
 });
 $("themeToggle").addEventListener("click",()=>setTheme(true));
 // Arrow/Home/End navigation works within either rail without scrolling
 // the page or competing with the model's existing click state machine.
 for(const railId of ["faroQuickDays","faroQuickHours"]){
  const rail=$(railId);
  rail?.addEventListener("keydown",event=>{
   if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
   const buttons=[...rail.querySelectorAll("button:not(:disabled)")];
   const at=buttons.indexOf(document.activeElement);
   if(at<0||buttons.length<2)return;
   const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:
    Math.max(0,Math.min(buttons.length-1,at+(event.key==="ArrowRight"?1:-1)));
   if(next===at)return;
   const key=railId==="faroQuickDays"?"dayIndex":"hour";
   const value=buttons[next].dataset[key];
   event.preventDefault();
   buttons[next].click();
   const updated=[...rail.querySelectorAll("button")].find(button=>button.dataset[key]===value);
   if(updated){
    const bounds=rail.getBoundingClientRect(),tile=updated.getBoundingClientRect();
    if(tile.left<bounds.left)rail.scrollLeft-=bounds.left-tile.left;
    else if(tile.right>bounds.right)rail.scrollLeft+=tile.right-bounds.right;
   }
  });
 }
 // Four direct, keyboard-accessible jumps. Disclosures open before scrolling;
 // no hidden target or dead anchor, and motion preferences are respected.
 for(const button of document.querySelectorAll(".faro-journey-nav [data-jump]")){
  button.addEventListener("click",()=>{
   const target=$(button.dataset.jump==="slots"?(window.faroConsole?"faroSharedConsole":"faroQuickHourRail"):button.dataset.jump);
   if(!target)return;
   if(target.tagName==="DETAILS")target.open=true;
   const motion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
   const section=target.closest(".hourly-section")||target;
   section.scrollIntoView({behavior:motion,block:"start"});
   if(target.tagName==="DETAILS"){
    const head=target.querySelector("summary");
    if(head){head.setAttribute("tabindex","-1");head.focus({preventScroll:true})}
   }
  });
 }
 // Footer links must open a useful panel, not send surfers to raw Markdown.
 // They work from any page tab, including Best of Week and FARO Match.
 for(const link of document.querySelectorAll("[data-expand-target]")){
  link.addEventListener("click",event=>{
   const disclosure=$(link.dataset.expandTarget);
   if(!disclosure)return;
   event.preventDefault();
   tab("forecast");
   if(disclosure.id==="coastMapExpand"||disclosure.id==="waveInsightExpand"){
    selectOcean(disclosure.id==="coastMapExpand"?"map":"compass");
   }else disclosure.open=true;
   const motion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches?"auto":"smooth";
   disclosure.scrollIntoView({behavior:motion,block:"start"});
   const title=disclosure.querySelector("summary");
   if(title){title.setAttribute("tabindex","-1");title.focus({preventScroll:true})}
  });
 }
 const dnaButton=$("openSpotDNA"),dnaDisclosure=$("spotInsightExpand");
 if(dnaButton&&dnaDisclosure){
  dnaButton.addEventListener("click",()=>{
   dnaDisclosure.open=true;
   dnaButton.setAttribute("aria-expanded","true");
   const motion=window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
   dnaDisclosure.scrollIntoView({behavior:motion,block:"start"});
  });
  dnaDisclosure.addEventListener("toggle",()=>{
   dnaButton.setAttribute("aria-expanded",String(dnaDisclosure.open));
  });
 }
 for(const [name,id]of [["forecast","navForecast"],["best","navBest"],["board","navBoard"]])$(id).addEventListener("click",()=>tab(name));
 $("refreshForecast").addEventListener("click",()=>refresh(true));
 function selectOcean(view,scroll=false){
  // Map is always the primary coastal reading; optional compass detail
  // opens below it instead of replacing it with an empty second chapter.
  const isTechnical=view==="compass";
  $("coastMapExpand").open=true;
  $("waveInsightExpand").open=isTechnical;
  $("openOceanMap").setAttribute("aria-pressed","true");
  $("openOceanCompass").setAttribute("aria-pressed",String(isTechnical));
  if(scroll){
   const motion=window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
   (isTechnical?$("waveInsightExpand"):$("oceanToolsHeading")).scrollIntoView({block:"start",behavior:motion});
  }
 }
 function revealOcean(id){
  selectOcean(id==="waveInsightExpand"?"compass":"map",true);
 }
 const scrollToLeadTarget=id=>{
  const target=$(id);
  if(!target)return;
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";
  target.scrollIntoView({block:"start",behavior:motion});
 };
 $("faroLeadRead").addEventListener("click",()=>scrollToLeadTarget("dailyOverview"));
 $("faroQuickDetails").addEventListener("click",()=>scrollToLeadTarget("dailyOverview"));
 $("faroLeadMap").addEventListener("click",()=>selectOcean("map",true));
  $("faroHourlyGoLens").addEventListener("click",()=>revealOcean("coastMapExpand"));
 $("openOceanMap").addEventListener("click",()=>revealOcean("coastMapExpand"));
 $("openOceanCompass").addEventListener("click",()=>revealOcean("waveInsightExpand"));
 // A direction detail never replaces or closes the primary coastal map.
 $("waveInsightExpand").addEventListener("toggle",()=>{
  $("openOceanCompass").setAttribute("aria-pressed",String($("waveInsightExpand").open));
 });
 $("coastMapExpand").addEventListener("toggle",()=>{
  if(!window.faroConsole&&!$("coastMapExpand").open)$("coastMapExpand").open=true;
 });
 $("chileSpotSelect").addEventListener("change",event=>{
  const i=state.config.pilots.findIndex(x=>x.id===$("chileSpotSelect").value);
  if(i>=0){
    // Preserve the geographic reading position when a map marker initiated
    // the change. The strips and session above the map otherwise collapse
    // while fetching, triggering browser scroll anchoring and a visible jump.
    if(coastSwitchCleanup){coastSwitchCleanup();coastSwitchCleanup=null;}
    const fromCoast=event?.detail?.fromCoastMap===true;
    const anchor=fromCoast?$("coastMapExpand"):null;
    const anchorTop=anchor?.getBoundingClientRect().top;
    const supportsAnchor=Number.isFinite(anchorTop);
    const shelves=supportsAnchor?
      ["#dayStrip",".day-outlook-section","#dayview>.hourly-section","#dayview>.session-section"]
       .map(selector=>document.querySelector("#forecastPage "+selector))
       .filter(Boolean).map(el=>({el,previous:el.style.minHeight,height:el.getBoundingClientRect().height})):[];
    for(const {el,height} of shelves)el.style.minHeight=Math.ceil(height)+"px";
    const keepCoastPosition=()=>{
      if(!supportsAnchor)return;
      const displacement=anchor.getBoundingClientRect().top-anchorTop;
      if(Math.abs(displacement)>1)window.scrollBy({top:displacement,left:0,behavior:"instant"});
    };
    let settled=false;
    const settleCoast=()=>{
      if(settled)return;
      settled=true;
      for(const {el,previous} of shelves)el.style.minHeight=previous;
      keepCoastPosition();
      if(supportsAnchor)requestAnimationFrame(keepCoastPosition);
      if(coastSwitchCleanup===settleCoast)coastSwitchCleanup=null;
    };
    if(supportsAnchor)coastSwitchCleanup=settleCoast;
    state.selected=i;state.day=0;state.hour=null;state.forecast=null;
    paintAccessNotice();
    // Never present prior-spot conditions as if they belong to a newly
    // selected beach while a provider request is still in flight.
    $("dayStripItems").replaceChildren();
    renderPrepHints(null);
    $("slots").replaceChildren();
    $("sessionAtGlance").replaceChildren();
    txt("sessionDetailSummary",tr("Cargando spot…","Loading break…"));
    for(const id of ["dayWave","dayWaveLabel","dayPeriod","dayWind","chileVibeTag","chileVibeRead",
      "chileVibeAction","chileVibeHeadline"])txt(id,"—");
    $("dayWaveMeter").replaceChildren();
    $("chileWaveHow").replaceChildren();
    $("chileVibeExplained").replaceChildren();
    txt("chileDecisionHeadline",tr("Cargando este spot…","Loading this spot…"));
    txt("chileDecisionDriver","");txt("bestTime","—");renderLead(null,null);
    renderDNA();renderCameras();updateCoastMap();
    keepCoastPosition();
    void refresh(false,settleCoast);
   }
 });
 for(const [id,move]of [["dayPrev",-1],["dayNext",1]])$(id).addEventListener("click",()=>{
  state.page=Math.max(0,Math.min(4,state.page+move));strip();
  if(window.innerWidth<1120)$("dayStripItems").children[state.page]?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
 });
 for(const id of ["matchBoard","matchAbility","matchStyle"])$(id).addEventListener("change",match);
 try{
  const files=await Promise.all(["valparaiso-live.config.json","valparaiso-score.config.json","regions/CL-VS.json","sources.json","spot-intelligence.json","camera-sources.json"].map(async path=>{
   const response=await fetch(path,{cache:"no-store"});if(!response.ok)throw Error(path+" HTTP "+response.status);return response.json();
  }));
  [state.config,state.profiles,state.registry,state.sources,state.intelligence,state.cameras]=files;
   if(!window.FaroChileSpotIntelligence||state.intelligence?.region!=="CL-VS")throw Error("Spot Intelligence version missing");
  if(state.config.region!=="CL-VS"||state.profiles.active!==false||state.registry.forecastEnabled!==false||state.config.noOfficialAlertAssertions!==true)throw Error("Risk isolation failure");
  for(const s of state.config.pilots)if(!state.profiles.profiles?.[s.id]||!state.registry.spots.find(r=>r.id===s.id))throw Error("Unattributed pilot "+s.id);
  state.profileLibrary=window.FaroSpotRegistry?.build({
   live:state.config,score:state.profiles,intelligence:state.intelligence
  })||[];
  const libraryCheck=window.FaroSpotRegistry?.audit(state.profileLibrary);
  if(libraryCheck&&!libraryCheck.valid)throw Error("Spot library invalid: "+libraryCheck.errors.join(","));
  const requested=new URLSearchParams(location.search).get("spot");
  state.selected=Math.max(0,state.config.pilots.findIndex(s=>s.id===requested));
  spotChooser=window.FaroChileSpotChooser?.mount({
   select:$("chileSpotSelect"),button:$("chileSpotButton"),panel:$("chileSpotOptions"),
   getLang:()=>state.lang
  })||null;
  picker();
  mountFaroCLConsole();
  if(window.faroConsole&&window.matchMedia("(max-width: 55rem)").matches)$("coastMapExpand").open=false;
  window.faroOutlook=window.FaroExtendedOutlook?.mount({getSpot:()=>{const s=spot();return s?{lat:s.latitude,lon:s.longitude,zone:state.config.timezone,name:s.name}:null},getLang:()=>state.lang});
  if(window.FaroChileVideoLab)state.videoLab=window.FaroChileVideoLab.init({
   container:$("faroVideoLab"),spotId:()=>spot()?.id,
   cameraSources:()=>state.cameras?.sources||[]
  });
  if(window.FaroChileCoastMap)state.coastMap=window.FaroChileCoastMap.create({
   container:$("chileCoastMap"),disclosure:$("coastMapExpand"),
   getCurrent:()=>({spot:spot(),spots:state.config.pilots,
    referenceSpots:state.config.referenceSpots||[],
    slot:selection(),marineGrid:state.forecast?.model?.marineGrid||null,
  weatherGrid:state.forecast?.model?.weatherGrid||null,
  profiles:state.profiles?.profiles||{},
    local:localRead(selection()),lang:state.lang,
    cameras:state.cameras?.sources||[]}),
   onSelectSpot:id=>{
    if(spot()?.id===id)return;
    $("chileSpotSelect").value=id;
    $("chileSpotSelect").dispatchEvent(new CustomEvent("change",{
      bubbles:true,detail:{fromCoastMap:true}
    }));
   }
  });
  // Desktop previews are part of the primary forecast hierarchy.
  // Mobile keeps map detail optional, with a local geolocated SVG fallback.
  if(window.matchMedia("(min-width: 1120px)").matches)$("coastMapExpand").open=true;
  renderDNA();risk(null);await refresh();
  }catch(err){
   modelState("unavailable");
   txt("updated",tr("Error cargando FARO Chile: ","FARO Chile loading error: ")+String(err.message||err));
  txt("status",tr("SIN DATOS","NO DATA"));risk(null);
 }
}
void initialize();
})();
