/* FARO Chile controller, Valparaíso live-model / uncalibrated spot-fit v1 */
(function(){
"use strict";
const $=id=>document.getElementById(id),Live=window.FaroChileLive;
const state={lang:"es",theme:"dark",config:null,profiles:null,registry:null,sources:null,intelligence:null,selected:0,day:0,hour:null,tab:"forecast",forecast:null,cache:new Map(),serial:0,page:0};
const tr=(es,en)=>state.lang==="es"?es:en,ok=x=>typeof x==="number"&&Number.isFinite(x),num=(x,d=1)=>ok(x)?x.toFixed(d):"—";
const el=(tag,value,cls)=>{const x=document.createElement(tag);if(value!==undefined&&value!==null)x.textContent=String(value);if(cls)x.className=cls;return x};
const txt=(id,value)=>{$(id).textContent=value},clear=id=>$(id).replaceChildren(),add=(x,...nodes)=>{x.append(...nodes);return x};
const h=n=>String(n).padStart(2,"0");
const band=n=>!ok(n)?"":n>=8?"brand-band-high":n>=6?"brand-band-regular":n>=4?"brand-band-mid":n>=2?"brand-band-low":"brand-band-verylow";
// These are *relative model signals*, never validated observed surf quality.
const grade=n=>!ok(n)?tr("Sin datos","No data"):n<2?tr("Muy flojo","Very slow"):n<4?tr("Flojo","Slow"):n<6?tr("Variable","Mixed"):n<8?tr("Buena pinta","Looking good"):tr("Con potencial","Good potential");
const spot=()=>state.config?.pilots?.[state.selected], profile=()=>state.profiles?.profiles?.[spot()?.id];
const regionRecord=()=>state.registry?.spots?.find(s=>s.id===spot()?.id);
const localRead=s=>window.FaroChileSpotIntelligence&&state.intelligence&&spot()?
 window.FaroChileSpotIntelligence.evaluate(s,spot().id,state.intelligence,state.lang):null;
function now(){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"America/Santiago",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 const obj=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return {date:obj.year+"-"+obj.month+"-"+obj.day,hour:Number(obj.hour)};
}
function dateLabel(iso){
 if(!iso)return "—";
 const date=new Date(iso+"T12:00:00Z");
 return new Intl.DateTimeFormat(state.lang==="es"?"es-CL":"en-GB",{weekday:"long",day:"numeric",month:"short",timeZone:"UTC"}).format(date);
}
function sessionTime(s){return s?h(s.hour)+":00–"+h(s.hour+2)+":00":"—"}
function bestRemaining(day){
 if(!day)return null;
 const present=now();
 return day.slots.filter(s=>s.daylight.eligible&&ok(s.score)&&!["danger","unknown"].includes(Live.slotRisk(s,state.config))&&(day.date>present.date||day.date===present.date&&s.hour+2>present.hour))
  .sort((a,b)=>b.score-a.score||a.hour-b.hour)[0]||null;
}
function selection(){
 const day=state.forecast?.days?.[state.day];
 return state.hour===null?bestRemaining(day):day?.slots.find(s=>s.hour===state.hour)||null;
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
}
function setTheme(toggle){
 if(toggle)state.theme=state.theme==="dark"?"light":"dark";
 else{
  const val=(()=>{try{return localStorage.getItem("zeeland-theme")}catch(e){return null}})();
  state.theme=["light","dark"].includes(val)?val:(matchMedia("(prefers-color-scheme:light)").matches?"light":"dark");
 }
 document.documentElement.dataset.theme=state.theme;
 txt("themeToggle",state.theme==="dark"?tr("☀ Claro","☀ Light"):tr("☾ Oscuro","☾ Dark"));
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
 const a=el("a",title+" ↗");a.href=url;a.target="_blank";a.rel="noopener noreferrer";parent.append(a);
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
 }else{
  lower.append(el("small",tr("PRONÓSTICO LOCAL · POR COMPARAR","LOCAL MODEL · FIT UNAVAILABLE"),"faro-dna-below-title"));
  lower.append(el("p",tr("El ajuste por dirección requiere datos válidos para la franja elegida.",
   "Directional compatibility requires valid data for the selected window."),"faro-dna-method"));
 }
 const safety=state.lang==="es"?p?.hazardContextEs:p?.hazardContextEn;
 if(safety)lower.append(el("p",safety,"faro-dna-safety"));
 lower.append(el("p",tr(
  "Las direcciones proceden de guías; no determinan altura rompiente, marea óptima, zonas permitidas ni seguridad.",
  "These guide directions do not establish breaking-wave height, optimal tide, permitted zones or water-entry safety."
 ),"faro-dna-method"));
 const detail=el("details",null,"faro-dna-source-disclosure");
 const references=new Set([...(rec?.sources||[]),...Object.values(p?.origins||{}),...(state.intelligence?.spots?.[current.id]?
  Object.values(state.intelligence.spots[current.id].guideHypotheses||{}).flat().map(x=>x.source):[])]);
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
 txt("chileRiskMeta",tr("Avisos oficiales no consultados automáticamente · 48 h","Official notices not automatically checked · 48h"));
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
  official.append(el("strong",tr("Marejadas · Armada","Ocean swell · Navy")),el("span",tr("Estado no comprobado · abrir fuente oficial","Status not checked · see official source")));
  host.append(official);
  const uv=el("div",null,"chile-risk-item chile-risk-official");
  uv.append(el("strong",tr("Radiación UV","UV radiation")),el("span",tr("Pronóstico UV en horario; no es alerta oficial","UV forecast shown by hour; not an official warning")));
  host.append(uv);
 }
}
function strip(){
 const days=state.forecast?.days||[],host=$("dayStripItems");host.replaceChildren();
 for(const [i,d]of days.entries()){
  const s=bestRemaining(d),button=el("button",null,"day-chip score-tint "+(s?band(s.score):"")+(i===state.day?" selected":""));
  button.type="button";button.setAttribute("aria-pressed",String(i===state.day));
  button.append(el("span",i===0?tr("Hoy","Today"):Live.formatDay(d.date,state.lang),"chile-chip-day"));
  button.append(el(s?"strong":"span",s?num(s.score):"—",s?"chile-chip-number":"chile-chip-empty"));
  button.append(el("span",s?grade(s.score):tr("Sin ventana","No daylight window"),"chile-chip-grade"));
  button.append(el("small",s?sessionTime(s):tr("No evaluado","Not evaluated"),"chile-chip-time"));
  button.addEventListener("click",()=>{state.day=i;state.hour=null;render()});host.append(button);
 }
 state.page=Math.min(state.page,Math.max(0,days.length-3));
 txt("dayStripCount",(state.page+1)+"–"+Math.min(days.length,state.page+3)+" / "+days.length);
 $("dayPrev").disabled=state.page===0;$("dayNext").disabled=state.page>=days.length-3;
 $("dayStripProgress").style.width=((state.page+1)/Math.max(1,days.length)*100)+"%";
}
function vibeUI(s){
 const info=Live.vibe(s,state.lang),meta=s?.scoreMeta,local=localRead(s);
 txt("chileVibeTag",local?.status==="guide_compared"?local.vibe.label:info.label);
 txt("chileVibeHeadline",local?.status==="guide_compared"?local.headline:meta?.read||
  tr("Selecciona una ventana con datos para interpretar las olas.","Choose a window with data to interpret surf."));
 txt("chileVibeRead",local?.status==="guide_compared"?local.read+" "+(local.notes?.[0]||""):info.description+" "+(meta?.warning||""));
 const tags=$("chileVibeEvidence");tags.replaceChildren();
 if(local?.status==="guide_compared"){
  for(const e of local.evidenceLabels)tags.append(el("span",e.label,"chile-signal-tag "+(e.state==="supported"?"good":e.state==="disputed"?"mixed":"unknown")));
  tags.append(el("span",tr("Lectura de guías · no observada","Guide interpretation · unobserved"),"chile-signal-tag unknown"));
 }else{
  for(const t of meta?.tags||[])tags.append(el("span",t.label,"chile-signal-tag "+(t.state==="positive"?"good":t.state==="negative"?"bad":t.state==="mixed"?"mixed":"unknown")));
 }
}
function outlook(){
 const d=state.forecast?.days?.[state.day],s=selection();if(!d)return;
 $("dailyOverview").className="forecast-overview "+band(s?.score);
 txt("datehead",dateLabel(d.date));txt("spotname",spot()?.name||"—");
 txt("bestTime",sessionTime(s));
 txt("dayWave",s?num(s.totalWaveHeightM)+" m":"—");
 txt("dayPeriod",s?num(s.swellPeriodS)+" s":"—");
 txt("dayWind",s?num(s.windKmh,0)+" km/h":"—");
 const uvMax=ok(d.uvMax)?d.uvMax:null;
 const uv=Live.statusUV(uvMax,state.lang);
 txt("dayUVLabel","☀ UV "+num(uvMax,0)+" · "+uv.name);
 txt("dayUVAdvice",uvMax===null?tr("Sin dato UV","UV unavailable"):uv.protection);
 $("dayUVBadge").dataset.uv=uv.category;
 vibeUI(s);
}
function slots(){
 const container=$("slots");container.replaceChildren();
 const day=state.forecast?.days?.[state.day];if(!day)return;
 for(const s of day.slots){
  const slotSafety=Live.slotRisk(s,state.config);
  const dangerous=slotSafety==="danger",unknownRisk=slotSafety==="unknown";
  const eligible=s.daylight.eligible&&ok(s.score)&&!dangerous&&!unknownRisk;
  const button=el("button",null,(eligible?band(s.score):"chile-unavailable")+(selection()?.hour===s.hour?" selected":""));
  button.type="button";button.setAttribute("aria-pressed",String(selection()?.hour===s.hour));button.disabled=!s.modelComplete;
  button.append(el("span",h(s.hour)+"–"+h(s.hour+2),"chile-slot-hour"));
  button.append(el("strong",eligible?num(s.score):"—","chile-slot-score"));
  button.append(el("small",dangerous?tr("⚠ Riesgo modelo","⚠ Model risk"):unknownRisk?tr("⚠ Riesgo sin evaluar","⚠ Risk unassessed"):eligible?Live.vibe(s,state.lang).label:s.daylight.eligible?tr("Sin score","No score"):tr("Sin luz","No daylight"),"chile-slot-vibe"));
  button.addEventListener("click",()=>{state.hour=s.hour;render()});container.append(button);
 }
 session();
}
function basicTable(rows){
 const t=el("table",null,"chile-model-table");
 for(const [name,value]of rows){const row=el("tr");row.append(el("td",name),el("td",value));t.append(row)}
 return t;
}
function compass(s){
 const box=$("waveinsight");box.replaceChildren();
 if(!s){box.append(el("p",tr("Sin dirección disponible.","Direction unavailable."),"muted"));return}
 const xmlns="http://www.w3.org/2000/svg",svg=document.createElementNS(xmlns,"svg");
 svg.setAttribute("viewBox","0 0 200 200");svg.setAttribute("class","chile-compass-svg");
 svg.setAttribute("role","img");svg.setAttribute("aria-label",tr("Brújula de direcciones del swell y viento","Swell and wind direction compass"));
 const shape=(tag,attrs,value)=>{
  const x=document.createElementNS(xmlns,tag);for(const [key,val]of Object.entries(attrs))x.setAttribute(key,String(val));
  if(value)x.textContent=value;svg.append(x);
 };
 shape("circle",{cx:100,cy:100,r:75,fill:"none",stroke:"currentColor","stroke-opacity":".38","stroke-width":"1.5"});
 for(const [letter,deg]of [["N",0],["E",90],["S",180],["W",270]]){
  const a=deg*Math.PI/180;
  shape("text",{x:100+Math.sin(a)*90,y:104-Math.cos(a)*90,"text-anchor":"middle",fill:"currentColor","font-size":"12","font-weight":"800"},letter);
 }
 function arrow(from,color,width){
  if(!ok(from))return;
  const a=from*Math.PI/180,ux=Math.sin(a),uy=-Math.cos(a);
  const tail=[100+ux*60,100+uy*60],tip=[100-ux*9,100-uy*9];
  shape("line",{x1:tail[0],y1:tail[1],x2:tip[0],y2:tip[1],stroke:color,"stroke-width":width,"stroke-linecap":"round"});
  const left=[tip[0]+ux*10+uy*6,tip[1]+uy*10-ux*6],right=[tip[0]+ux*10-uy*6,tip[1]+uy*10+ux*6];
  shape("polygon",{points:[tip,left,right].map(p=>p.join(",")).join(" "),fill:color});
 }
 arrow(s.swellDirection,"#4d9cc1",5);arrow(s.windDirection,"#d9ba6f",3);
 shape("circle",{cx:100,cy:100,r:3,fill:"currentColor"});
 const wrap=el("div",null,"chile-compass-panel");wrap.append(svg);
 const facts=el("div",null,"chile-compass-details");
 for(const [label,v,unit]of [[tr("Swell · DESDE","Swell · FROM"),s.swellDirection,"°"],[tr("Viento · DESDE","Wind · FROM"),s.windDirection,"°"],[tr("Período","Period"),s.swellPeriodS," s"]]){
  const row=el("p",null,"chile-compass-fact");row.append(el("small",label),el("strong",num(v,0)+unit));facts.append(row);
 }
 wrap.append(facts);box.append(wrap);
 box.append(el("p",tr("Las flechas indican desplazamiento; los números muestran DE DÓNDE vienen. No predice refracción ni dirección de la ola al romper.","Arrows show travel; the numbers show FROM bearings. Local refraction and breaking angle are not modelled."),"chile-compass-note"));
}
function wetsuit(s){
 if(!ok(s?.waterTemperatureC))return tr("Consultar temperatura real","Check observed water temperature");
 const t=s.waterTemperatureC;
 return t<12?tr("5/4 mm + accesorios","5/4 mm + accessories"):t<15?"4/3–5/4 mm":t<18?"3/2–4/3 mm":t<21?"3/2 mm":tr("Shorty o 3/2 mm","Shorty or 3/2 mm");
}
function session(){
 const s=selection(),d=state.forecast?.days?.[state.day],main=$("sessionAtGlance"),ess=$("sessionEssentials");
 main.replaceChildren();ess.replaceChildren();
 if(!s){main.append(el("p",tr("No hay ventana futura con luz y score experimental disponible. Puedes elegir manualmente otra franja.","No upcoming daylight window with experimental fit. Select another window to inspect model data."),"muted"));return}
 const top=el("div",null,"chile-session-head");
 const score=el("div",null,"chile-session-rating "+band(s.score));
 score.append(el("small",tr("COMPATIBILIDAD · MODELO","MODEL COMPATIBILITY"),"chile-session-label"));
 const big=el("strong",num(s.score),"chile-session-score");big.append(el("small"," /10"));
 score.append(big,el("span",grade(s.score),"chile-session-label"));
 const wave=el("div",null,"chile-session-wave");
 wave.append(el("small",tr("ALTURA MODELO OFFSHORE","OFFSHORE MODEL HEIGHT")),el("strong",num(s.totalWaveHeightM)+" m"),el("small",tr("NO altura rompiente","NOT breaking wave height")));
 top.append(score,wave);main.append(top);
 const meta=el("div",null,"chile-session-meta");
 meta.append(el("div",tr("Swell ","Swell ")+num(s.swellHeightM)+" m · "+num(s.swellPeriodS)+" s"));
 meta.append(el("div",tr("Desde ","From ")+Live.cardinal(s.swellDirection)+" · "+num(s.swellDirection,0)+"°"));
 meta.append(el("div",tr("Viento ","Wind ")+num(s.windKmh,0)+" km/h"));
 main.append(meta);
 const essentials=[
  "🧥 "+wetsuit(s),"🌊 "+num(s.waterTemperatureC)+" °C","🌡 "+num(s.temperatureC)+" °C",
  "💨 "+num(s.windKmh,0)+" km/h"
 ];
 for(const label of essentials)ess.append(el("span",label,"essential-tag"));
 ess.append(el("span","☀ UV "+num(s.uvIndex)+" · "+s.uv.name,"essential-tag chile-uv-tag chile-uv-"+s.uv.category));
 txt("rise",d.sunrise?.slice(11,16)||"—");txt("set",d.sunset?.slice(11,16)||"—");
 const sunset=d.sunset?.slice(11,16).split(":").map(Number);
 const cut=sunset?.length===2?Math.max(0,sunset[0]*60+sunset[1]-35):null;
 const out=cut===null?"—":h(Math.floor(cut/60))+":"+h(cut%60);
 txt("cutoff",out);txt("daylightBrief",tr("Salida sugerida ","Suggested exit ")+out);
 const content=$("detail");content.replaceChildren();
 const grid=state.forecast?.model?.marineGrid,metGrid=state.forecast?.model?.weatherGrid;
 const coverage=state.forecast?.model?.coverage;
 const coordinateStatus=state.forecast?.model?.referencePointStatus||"unverified";
 content.append(basicTable([
  [tr("Oleaje total del modelo","Model total waves"),num(s.totalWaveHeightM)+" m"],
  [tr("Altura del swell primario","Primary swell height"),num(s.swellHeightM)+" m"],
  [tr("Período swell","Swell period"),num(s.swellPeriodS)+" s"],
  [tr("Dirección swell · DESDE","Swell · FROM"),Live.cardinal(s.swellDirection)+" · "+num(s.swellDirection,0)+"°"],
  ...[["secondarySwell",tr("Swell secundario","Secondary swell")],["tertiarySwell",tr("Swell terciario","Tertiary swell")]].map(([key,label])=>{
   const part=s[key];return [label,part?num(part.heightM)+" m · "+num(part.periodS)+" s · "+Live.cardinal(part.fromDeg)+" ("+num(part.fromDeg,0)+"°)":tr("No disponible en este modelo","Not available from this model")];
  }),
  [tr("Viento · DESDE","Wind · FROM"),Live.cardinal(s.windDirection)+" · "+num(s.windDirection,0)+"°"],
  [tr("Rachas","Gusts"),num(s.gustKmh,0)+" km/h"],
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
 ]));
 content.append(el("p",tr("Distancias desde una referencia costera, NO desde una rompiente georreferenciada. Estado de referencia: ","Distances from a coastal reference, NOT a surveyed breaking wave. Reference status: ")+coordinateStatus+". "+tr("La hora de consulta no es la hora de emisión del modelo.","Fetch time is not model issue time."),"muted"));
 content.append(el("p",tr("Fuente Open-Meteo. Una celda marina cercana NO representa una ola rompiendo en este banco ni una marea óptima. Sin estado automático de avisos oficiales.","Open-Meteo model. Nearby marine grid cells do NOT give breaking wave height or optimal tide. No automatically checked official notices."),"muted"));
 const UV=el("div","UV "+num(s.uvIndex)+": "+(s.uv.protection||tr("Sin dato","Unavailable")),"chile-uv-note chile-uv-"+s.uv.category);content.append(UV);
 link(content,tr("DMC · Radiación UV oficial","DMC · Official UV forecast"),"https://www.meteochile.gob.cl/PortalDMC-web/otros_pronosticos/radiacion_uv.xhtml");
 const wear=$("wetsuit");wear.replaceChildren(el("h3",tr("Equipo recomendado con cautela","Tentative gear advice")),el("p",wetsuit(s)+" · "+tr("Agua modelada ","Modelled water ")+num(s.waterTemperatureC)+" °C"),el("p",tr("Depende de viento, duración, temperatura real y tolerancia personal al frío.","Depends on wind, duration, real water temperature and personal cold tolerance."),"muted"));
 compass(s);
}
function render(){
 if(!state.forecast)return;
 txt("updated",tr("Modelo consultado ","Model fetched ")+new Intl.DateTimeFormat(state.lang==="es"?"es-CL":"en-GB",{timeZone:"America/Santiago",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(state.forecast.model.fetchedAt))+" · CL");
 risk(state.forecast.hazard);strip();outlook();slots();renderDNA();if(state.tab==="board")match();
}
async function refresh(force=false){
 if(!state.config)return;
 const id=spot().id,serial=++state.serial,stored=state.cache.get(id);
 if(!force&&stored&&Date.now()-stored.at<15*60*1000){state.forecast=stored.forecast;render();return}
 txt("updated",tr("Consultando modelos para ","Loading model for ")+spot().name+"…");
 txt("status",tr("ACTUALIZANDO…","UPDATING…"));
 try{
  const data=await Live.fetchSpot(state.config,spot(),state.profiles,fetch,state.lang);
  state.cache.set(id,{forecast:data,at:Date.now()});if(serial!==state.serial)return;
  state.forecast=data;txt("status",tr("MODELO · EXPERIMENTAL","EXPERIMENTAL MODEL"));render();
 }catch(err){
  if(serial!==state.serial)return;
  state.forecast=null;txt("status",tr("SIN CONEXIÓN","OFFLINE"));
  txt("updated",tr("No se puede cargar el pronóstico: ","Cannot load forecast: ")+String(err.message||err));
  $("dayStripItems").replaceChildren(el("p",tr("No hay datos nuevos; no se muestran scores ficticios.","Fresh data unavailable; no fictional scores shown."),"muted"));
  $("slots").replaceChildren();$("sessionAtGlance").replaceChildren();
  risk(null);
 }
}
function picker(){
 const list=$("chileSpotSelect");list.replaceChildren();
 for(const s of state.config.pilots){const item=el("option",s.name);item.value=s.id;list.append(item)}
 list.value=spot().id;
}
async function rankings(){
 const host=$("highlights");host.replaceChildren(el("p",tr("Comparando pronósticos…","Comparing forecasts…"),"muted"));
 txt("rankingstatus",tr("Actualizando modelos","Loading model data"));
 const results=await Promise.allSettled(state.config.pilots.map(async s=>{
  const cached=state.cache.get(s.id);
  if(cached&&Date.now()-cached.at<15*60*1000)return cached.forecast;
  const data=await Live.fetchSpot(state.config,s,state.profiles,fetch,state.lang);
  state.cache.set(s.id,{forecast:data,at:Date.now()});return data;
 }));
 const list=[];
 for(const item of results)if(item.status==="fulfilled"){
  const model=item.value;
  for(const day of model.days){const s=bestRemaining(day);if(s)list.push({model,day,s})}
 }
 list.sort((a,b)=>b.s.score-a.s.score||a.day.date.localeCompare(b.day.date));
 host.replaceChildren();
 txt("rankingstatus",tr("Compatibilidad modelada · sin calibrar","Modelled compatibility · uncalibrated"));
 if(!list.length){host.append(el("p",tr("Sin comparaciones suficientes por ahora.","Not enough comparable model values."),"muted"));return}
 for(const item of list.slice(0,12)){
  const b=el("button",null,"highlight chile-ranking "+band(item.s.score));b.type="button";
  const line=el("div",null,"chile-rank-layout"),data=el("div");
  data.append(el("span",item.model.spot.name,"chile-rank-name"),el("div",dateLabel(item.day.date)+" · "+sessionTime(item.s),"chile-rank-when"),el("small",(window.FaroChileSpotIntelligence?.evaluate(item.s,item.model.spot.id,state.intelligence,state.lang)?.vibe?.label||Live.vibe(item.s,state.lang).label)));
  line.append(data,el("strong",num(item.s.score)));b.append(line);
  b.addEventListener("click",()=>{
   state.selected=state.config.pilots.findIndex(s=>s.id===item.model.spot.id);
   state.forecast=item.model;state.day=item.day.index;state.hour=item.s.hour;
   picker();tab("forecast");render();
  });
  host.append(b);
 }
}
function match(){
 const s=selection(),fit=Live.boardFit(s,$("matchBoard").value,$("matchAbility").value,$("matchStyle").value,state.lang,state.forecast?.hazard);
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
 $("chileSpotSelect").addEventListener("change",()=>{
  const i=state.config.pilots.findIndex(x=>x.id===$("chileSpotSelect").value);
  if(i>=0){state.selected=i;state.day=0;state.hour=null;renderDNA();void refresh()}
 });
 for(const [id,move]of [["dayPrev",-1],["dayNext",1]])$(id).addEventListener("click",()=>{
  state.page=Math.max(0,Math.min(4,state.page+move));strip();
  if(window.innerWidth<1120)$("dayStripItems").children[state.page]?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"});
 });
 for(const id of ["matchBoard","matchAbility","matchStyle"])$(id).addEventListener("change",match);
 try{
  const files=await Promise.all(["valparaiso-live.config.json","valparaiso-score.config.json","regions/CL-VS.json","sources.json","spot-intelligence.json"].map(async path=>{
   const response=await fetch(path,{cache:"no-store"});if(!response.ok)throw Error(path+" HTTP "+response.status);return response.json();
  }));
  [state.config,state.profiles,state.registry,state.sources,state.intelligence]=files;
   if(!window.FaroChileSpotIntelligence||state.intelligence?.region!=="CL-VS")throw Error("Spot Intelligence version missing");
  if(state.config.region!=="CL-VS"||state.profiles.active!==false||state.registry.forecastEnabled!==false||state.config.noOfficialAlertAssertions!==true)throw Error("Risk isolation failure");
  for(const s of state.config.pilots)if(!state.profiles.profiles?.[s.id]||!state.registry.spots.find(r=>r.id===s.id))throw Error("Unattributed pilot "+s.id);
  const requested=new URLSearchParams(location.search).get("spot");
  state.selected=Math.max(0,state.config.pilots.findIndex(s=>s.id===requested));
  picker();renderDNA();risk(null);await refresh();
 }catch(err){
  txt("updated",tr("Error cargando FARO Chile: ","FARO Chile loading error: ")+String(err.message||err));
  txt("status",tr("SIN DATOS","NO DATA"));risk(null);
 }
}
void initialize();
})();
