/* FARO Chile research explorer.
 * Loads the published source-linked regional catalog, never an ocean model.
 * The live Zeeland API/KNMI risk screening is not imported here.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const regionSelect=$("regionSelect"),search=$("spotSearch");
const grid=$("spotGrid"),summary=$("spotSummary"),more=$("moreSpots");
const pilotIds=new Set(["CL-VS:la-boca-concon","CL-VS:renaca","CL-VS:ritoque","CL-VS:maitencillo","CL-VS:papagayo-quintero"]);
const preference=(key,fallback)=>{try{return localStorage.getItem(key)||fallback}catch(e){return fallback}};
let language=preference("zeeland-language","es")==="en"?"en":"es";
let theme=preference("zeeland-theme",window.matchMedia?.("(prefers-color-scheme: light)").matches?"light":"dark");
let manifest=null,profiles={},sources={},activeRegion="CL-VS",visible=8;
const regionsCache=new Map();
const tr=(es,en)=>language==="es"?es:en;
function setText(selector,content){const target=$(selector);if(target)target.textContent=content}
function applyLocale(){
 document.documentElement.lang=language;
 for(const el of document.querySelectorAll("[data-es][data-en]")){
  el.textContent=el.dataset[language];
 }
 for(const el of document.querySelectorAll("[data-es-placeholder][data-en-placeholder]")){
  el.setAttribute("placeholder",el.dataset[language+"Placeholder"]);
 }
 setText("langButton",language==="es"?"EN":"ES");
 setText("themeButton",theme==="dark"?tr(" Claro"," Light"):tr(" Oscuro"," Dark"));
 document.title=tr("FARO Chile · Atlas de spots","FARO Chile · Surf spot atlas");
 if(manifest)renderCards();
}
function applyTheme(){
 document.documentElement.dataset.theme=theme;
 setText("themeButton",theme==="dark"?tr(" Claro"," Light"):tr(" Oscuro"," Dark"));
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=theme==="dark"?"#102427":"#f7fafa";
}
$("langButton").addEventListener("click",()=>{
 language=language==="es"?"en":"es";
 try{localStorage.setItem("zeeland-language",language)}catch(e){}
 applyLocale();
});
$("themeButton").addEventListener("click",()=>{
 theme=theme==="dark"?"light":"dark";
 try{localStorage.setItem("zeeland-theme",theme)}catch(e){}
 applyTheme();applyLocale();
});
async function getJSON(path){
 const response=await fetch(path,{cache:"no-store"});
 if(!response.ok)throw Error("FARO Chile: "+path+" (HTTP "+response.status+")");
 return response.json();
}
function textElement(tag,value,className){
 const el=document.createElement(tag);el.textContent=value;
 if(className)el.className=className;return el;
}
function typeName(value){
 const names={
  "beach":[ "Playa de arena","Beachbreak"],"river-mouth":["Desembocadura","River-mouth break"],
  "reef":["Arrecife","Reefbreak"],"point":["Punta","Pointbreak"],
  "unverified":["Fondo pendiente","Break type unverified"],"unknown":["Pendiente","Unverified"]
 };
 return tr(...(names[value]||names.unverified));
}
function itemCard(spot){
 const pilot=pilotIds.has(spot.id)&&Boolean(profiles[spot.id]);
 const card=document.createElement("article");
 card.className="spot-card"+(pilot?" featured-spot":"");
 const top=textElement("div","","card-top");
 top.append(textElement("span",pilot?tr("PILOTO FARO","FARO PILOT"):spot.evidenceStatus==="guide_described"?tr("GUÍA LOCAL","LOCAL GUIDE"):tr("EN INVESTIGACIÓN","RESEARCH"),"mini-status"));
 top.append(textElement("span",typeName(spot.breakType),"type"));
 card.append(top);
 const identity=textElement("div");
 identity.append(textElement("h3",spot.name));
 identity.append(textElement("p",spot.locality||"", "locality"));
 card.append(identity);
 const ref=spot.conditions?.publishedReference;
 if(ref?.swellFrom||ref?.windFrom){
  const conditions=textElement("div","","signals");
  for(const [es,en,value]of [["Swell","Swell",ref.swellFrom],["Viento","Wind",ref.windFrom]]){
   const fact=document.createElement("div");fact.append(textElement("small",tr(es,en)));
   fact.append(textElement("strong",value||"—"));
   conditions.append(fact);
  }
  card.append(conditions);
 }else{
  card.append(textElement("p",tr("Exposición, mareas y dirección óptima aún sin verificar.", "Exposure, tide and optimal directions are not yet verified."),"notice"));
 }
 const note=textElement("p",tr(
  pilot?"Compatible con el laboratorio experimental. No hay score en vivo.":"La calidad local y el acceso requieren verificación.",
  pilot?"Available in the experimental lab. Not a live score.":"Local surf quality and access still require verification."
 ),"notice");card.append(note);
 if(pilot){
  const link=document.createElement("a");link.className="card-cta";
  link.href="lab.html?spot="+encodeURIComponent(spot.id);
  link.append(textElement("span",tr("Explorar condiciones de prueba","Explore sample conditions")));
  link.append(textElement("span","↗"));
  card.append(link);
 }else{
  const span=textElement("span",tr("Perfil pendiente de calibración","Awaiting local calibration"),"card-cta disabled");card.append(span);
 }
 return card;
}
function renderCards(){
 if(!manifest)return;
 const reg=regionsCache.get(activeRegion);
 if(!reg)return;
 let spots=reg.spots.filter(spot=>{
  const q=search.value.trim().toLocaleLowerCase();
  return !q||[spot.name,spot.locality,spot.subarea||""].some(x=>(x||"").toLocaleLowerCase().includes(q));
 }).sort((a,b)=>{
  const pa=pilotIds.has(a.id)?0:1,pb=pilotIds.has(b.id)?0:1;
  return pa-pb||a.name.localeCompare(b.name,"es");
 });
 const count=spots.length;
 setText("spotSummary",tr(
  count+" lugares documentados o candidatos. Selecciona un spot para revisar sus referencias.",
  count+" researched or candidate locations. Choose a spot to inspect the source-backed profile."
 ));
 grid.replaceChildren();
 if(!count)grid.append(textElement("p",tr(
  reg.spots.length?"No hay resultados para esta búsqueda.":"No hay spots documentados aún para esta región.",
  reg.spots.length?"No matching spots.":"No sourced surf spots yet in this region."
 ),"empty"));
 else for(const spot of spots.slice(0,visible))grid.append(itemCard(spot));
 more.hidden=count<=visible;
 more.textContent=tr("Mostrar más spots","Show more spots");
}
async function chooseRegion(code){
 const meta=manifest.regions.find(r=>r.code===code);
 if(!meta)return;
 activeRegion=code;visible=8;
 regionSelect.value=code;
 try{
  setText("spotSummary",tr("Cargando los spots…","Loading surf spots…"));
  if(!regionsCache.has(code)){
   const result=await getJSON(meta.file);
   if(result.regionCode!==code||result.forecastEnabled!==false||result.spots.length!==meta.spotCount)
    throw Error("Regional data validation failed: "+code);
   for(const entry of result.spots){
    if(entry.forecastEnabled!==false||entry.coordinates!==null||entry.conditions?.idealTide!==null)
     throw Error("Incomplete research safety gate: "+entry.id);
    for(const source of entry.sources||[])if(!sources[source])
     throw Error("Unattributed entry "+entry.id+" · "+source);
   }
   regionsCache.set(code,result);
  }
  renderCards();
 }catch(error){
  grid.replaceChildren(textElement("p",tr("No se pudo cargar esta región. Revisa la conexión y vuelve a intentarlo.","This region could not be loaded. Check the connection and try again."),"empty"));
  setText("spotSummary",String(error.message||error));
 }
}
regionSelect.addEventListener("change",()=>chooseRegion(regionSelect.value));
search.addEventListener("input",()=>{visible=8;renderCards()});
more.addEventListener("click",()=>{visible+=8;renderCards()});
async function init(){
 applyTheme();applyLocale();
 try{
  const [m,c,s]=await Promise.all([getJSON("regions.json"),getJSON("valparaiso-score.config.json"),getJSON("sources.json")]);
  if(m.country!=="CL"||m.active!==false||c.active!==false||c.status!=="experimental")
   throw Error("Chile research is not cleared for live forecasting");
  manifest=m;profiles=c.profiles||{};sources=s.sources||{};
  const total=m.regions.reduce((n,r)=>n+r.spotCount,0);
  setText("regionCount",String(m.regions.length));
  setText("spotCount",String(total));
  setText("pilotCount",String(Object.keys(profiles).length));
  regionSelect.replaceChildren();
  for(const reg of m.regions){
   const option=document.createElement("option");option.value=reg.code;
   option.textContent=reg.name+" · "+reg.spotCount;
   regionSelect.append(option);
  }
  const params=new URLSearchParams(window.location.search);
  const requested=params.get("region");
  await chooseRegion(m.regions.some(r=>r.code===requested)?requested:"CL-VS");
  applyLocale();
 }catch(error){
  setText("spotSummary",tr("No se puede abrir el atlas chileno: ","Chile catalog unavailable: ")+String(error.message||error));
 }
}
init();
})();
