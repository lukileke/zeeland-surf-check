/* FARO Chile controller, Valparaíso live-model / uncalibrated spot-fit v1 */
(function(){
"use strict";
const $=id=>document.getElementById(id),Live=window.FaroChileLive;
const state={lang:"es",theme:"dark",config:null,profiles:null,registry:null,sources:null,selected:0,day:0,hour:null,tab:"forecast",forecast:null,cache:new Map(),serial:0,page:0};
const tr=(es,en)=>state.lang==="es"?es:en,ok=x=>typeof x==="number"&&Number.isFinite(x),num=(x,d=1)=>ok(x)?x.toFixed(d):"—";
const el=(tag,value,cls)=>{const x=document.createElement(tag);if(value!==undefined&&value!==null)x.textContent=String(value);if(cls)x.className=cls;return x};
const txt=(id,value)=>{$(id).textContent=value},clear=id=>$(id).replaceChildren(),add=(x,...nodes)=>{x.append(...nodes);return x};
const h=n=>String(n).padStart(2,"0");
const band=n=>!ok(n)?"":n>=8?"brand-band-high":n>=6?"brand-band-regular":n>=4?"brand-band-mid":n>=2?"brand-band-low":"brand-band-verylow";
const grade=n=>!ok(n)?tr("Sin datos","No data"):n<2?tr("Muy malo","Very poor"):n<4?tr("Malo","Poor"):n<6?tr("Regular","Fair"):n<8?tr("Prometedor","Promising"):tr("Excelente","Excellent");
const spot=()=>state.config?.pilots?.[state.selected], profile=()=>state.profiles?.profiles?.[spot()?.id];
const regionRecord=()=>state.registry?.spots?.find(s=>s.id===spot()?.id);
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
 return day.slots.filter(s=>s.daylight.eligible&&ok(s.score)&&(day.date>present.date||day.date===present.date&&s.hour+2>present.hour))
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
 for(const item of document.querySelectorAll("[data-es][data-en]"))item.textContent=item.dataset[state.lang];
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
function renderDNA(){
 if(!spot())return;
 const rec=regionRecord(),p=profile(),box=$("spotinsight");
 box.replaceChildren(el("small",tr("SPOT DNA · IDENTIDAD Y EVIDENCIA LOCAL","SPOT DNA · LOCAL EVIDENCE"),"chile-dna-kicker"),el("h3",spot().name,"chile-dna-title"));
 const grid=el("div",null,"chile-dna-grid");
 for(const [name,value]of [
  [tr("Rompiente","Break type"),rec?.breakType||p?.kind||"—"],
  [tr("Viento (guía)","Wind (guide)"),rec?.conditions?.publishedReference?.windFrom||"—"],
  [tr("Swell (guía)","Swell (guide)"),rec?.conditions?.publishedReference?.swellFrom||"—"],
  [tr("Marea","Tide"),tr("No calibrada","Not calibrated")]
 ]){
  const f=el("div",null,"chile-dna-fact");f.append(el("span",name),el("strong",value));grid.append(f);
 }
 box.append(grid);
 box.append(el("p",rec?.conditions?.regionSpecificNoteEs||"", "chile-dna-prose"));
 box.append(el("p",state.lang==="es"?p?.hazardContextEs:p?.hazardContextEn,"chile-dna-warning"));
 box.append(el("p",tr("Los rangos de guía son hipótesis, no validaciones de cada banco. No se evalúan acceso ni seguridad al agua.","Guide ranges are hypotheses, not individual bank calibration. Access and water safety are not evaluated."),"chile-dna-prose"));
 const refs=el("div",null,"chile-source-index");
 for(const key of new Set([...(rec?.sources||[]),...Object.values(p?.origins||{})])){
  const entry=state.sources?.sources?.[key];if(entry?.url)link(refs,entry.name,entry.url);
 }
 box.append(refs);
}
function risk(hazard){
 const container=$("faroSafetyCenter");container.classList.remove("danger","caution","chile-model-danger","chile-model-caution");
 const level=hazard?.level||"unknown";
 if(level==="danger")container.classList.add("danger","chile-model-danger");
 if(level==="caution")container.classList.add("caution","chile-model-caution");
 txt("chileRiskGrade",level==="danger"?tr("RIESGO MODELO","MODEL RISK"):level==="caution"?tr("PRECAUCIÓN","CAUTION"):tr("FUENTES OFICIALES","OFFICIAL SOURCES"));
 txt("chileRiskTitle",["danger","caution"].includes(level)?hazard.label:tr("Consulta marejadas y avisos oficiales","Check official coastal notices"));
 txt("chileRiskMeta",tr("Avisos oficiales no consultados automáticamente · 48 h","Official notices not automatically checked · 48h"));
 txt("chileRiskExplanation",tr("FARO detecta señales de viento, tormentas y lluvia en un modelo. No comprueba avisos oficiales de la Armada, DMC o SENAPRED. "+(hazard?.label||"")+" Revisa los enlaces originales.","FARO screens modelled wind, storms and rainfall, not official Navy, DMC or SENAPRED notices. "+(hazard?.label||"")+" Check the source websites."));
}
function strip(){
 const days=state.forecast?.days||[],host=$("dayStripItems");host.replaceChildren();
 for(const [i,d]of days.entries()){
  const s=bestRemaining(d),button=el("button",null,"day-chip score-tint "+(s?band(s.score):"")+(i===state.day?" selected":""));
  button.type="button";button.setAttribute("aria-pressed",String(i===state.day));
  button.append(el("span",i===0?tr("Hoy","Today"):Live.formatDay(d.date,state.lang),"chile-chip-day"));
  button.append(el(s?"strong":"span",s?num(s.score):"—",s?"chile-chip-number":"chile-chip-empty"));
  button.append(el("span",s?grade(s.score)+" · β":tr("Sin ventana","No daylight window"),"chile-chip-grade"));
  button.append(el("small",s?sessionTime(s):tr("No evaluado","Not evaluated"),"chile-chip-time"));
  button.addEventListener("click",()=>{state.day=i;state.hour=null;render()});host.append(button);
 }
 state.page=Math.min(state.page,Math.max(0,days.length-3));
 txt("dayStripCount",(state.page+1)+"–"+Math.min(days.length,state.page+3)+" / "+days.length);
 $("dayPrev").disabled=state.page===0;$("dayNext").disabled=state.page>=days.length-3;
 $("dayStripProgress").style.width=((state.page+1)/Math.max(1,days.length)*100)+"%";
}
function vibeUI(s){
 const info=Live.vibe(s,state.lang),meta=s?.scoreMeta;
 txt("chileVibeTag",info.label);
 txt("chileVibeHeadline",meta?.read||tr("Selecciona una ventana con datos para interpretar las olas.","Choose a window with data to interpret surf."));
 txt("chileVibeRead",info.description+" "+(meta?.warning||""));
 const tags=$("chileVibeEvidence");tags.replaceChildren();
 for(const t of meta?.tags||[])tags.append(el("span",t.label,"chile-signal-tag "+(t.state==="positive"?"good":t.state==="negative"?"bad":t.state==="mixed"?"mixed":"unknown")));
}
function outlook(){
 const d=state.forecast?.days?.[state.day],s=selection();if(!d)return;
 $("dailyOverview").className="forecast-overview "+band(s?.score);
 txt("datehead",dateLabel(d.date));txt("spotname",spot()?.name||"—");
 txt("bestTime",sessionTime(s));
 txt("dayWave",s?num(s.totalWaveHeightM)+" m":"—");
 txt("dayPeriod",s?num(s.swellPeriodS)+" s":"—");
 txt("dayWind",s?num(s.windKmh,0)+" km/h":"—");
 vibeUI(s);
}
function slots(){
 const container=$("slots");container.replaceChildren();
 const day=state.forecast?.days?.[state.day];if(!day)return;
 for(const s of day.slots){
  const eligible=s.daylight.eligible&&ok(s.score);
  const button=el("button",null,(eligible?band(s.score):"chile-unavailable")+(selection()?.hour===s.hour?" selected":""));
  button.type="button";button.setAttribute("aria-pressed",String(selection()?.hour===s.hour));button.disabled=!s.modelComplete;
  button.append(el("span",h(s.hour)+"–"+h(s.hour+2),"chile-slot-hour"));
  button.append(el("strong",eligible?num(s.score):"—","chile-slot-score"));
  button.append(el("small",eligible?Live.vibe(s,state.lang).label:s.daylight.eligible?tr("Sin score","No score"):tr("Sin luz","No daylight"),"chile-slot-vibe"));
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
 score.append(el("small",tr("SPOT FIT MODELO · β","MODEL SPOT FIT · β"),"chile-session-label"));
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
 content.append(basicTable([
  [tr("Oleaje total del modelo","Model total waves"),num(s.totalWaveHeightM)+" m"],
  [tr("Altura del swell primario","Primary swell height"),num(s.swellHeightM)+" m"],
  [tr("Período swell","Swell period"),num(s.swellPeriodS)+" s"],
  [tr("Dirección swell · DESDE","Swell · FROM"),Live.cardinal(s.swellDirection)+" · "+num(s.swellDirection,0)+"°"],
  [tr("Viento · DESDE","Wind · FROM"),Live.cardinal(s.windDirection)+" · "+num(s.windDirection,0)+"°"],
  [tr("Rachas","Gusts"),num(s.gustKmh,0)+" km/h"],
  [tr("Precipitación ventana","Rain in window"),num(s.precipitationMm)+" mm"],
  [tr("Índice UV","UV index"),num(s.uvIndex)+" · "+s.uv.name],
  [tr("Nubosidad","Cloud cover"),num(s.cloudPercent,0)+" %"],
  [tr("Temperatura aire","Air temperature"),num(s.temperatureC)+" °C"]
 ]));
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
  state.forecast=data;txt("status","MODELO · BETA");render();
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
 txt("rankingstatus",tr("Compatibilidad experimental · β","Experimental spot fit · β"));
 if(!list.length){host.append(el("p",tr("Sin comparaciones suficientes por ahora.","Not enough comparable model values."),"muted"));return}
 for(const item of list.slice(0,12)){
  const b=el("button",null,"highlight chile-ranking "+band(item.s.score));b.type="button";
  const line=el("div",null,"chile-rank-layout"),data=el("div");
  data.append(el("span",item.model.spot.name,"chile-rank-name"),el("div",dateLabel(item.day.date)+" · "+sessionTime(item.s),"chile-rank-when"),el("small",Live.vibe(item.s,state.lang).label+" · β"));
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
  const files=await Promise.all(["valparaiso-live.config.json","valparaiso-score.config.json","regions/CL-VS.json","sources.json"].map(async path=>{
   const response=await fetch(path,{cache:"no-store"});if(!response.ok)throw Error(path+" HTTP "+response.status);return response.json();
  }));
  [state.config,state.profiles,state.registry,state.sources]=files;
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
