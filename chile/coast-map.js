/* FARO Chile coastal map · real published geolocated reference coordinates.
 * Directions are meteorological/oceanographic FROM directions. Arrowheads show
 * modelled travel direction, NOT refraction / ray-traced shoreline response.
 * Only request OSM tiles on a user's explicit map disclosure; never prefetch.
 */
(function(root){
"use strict";
const leafletCss="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const leafletJs="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const cssHash="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
const jsHash="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
let loader=null;
function loadLeaflet(){
 if(root.L)return Promise.resolve(root.L);
 if(loader)return loader;
 loader=new Promise((resolve,reject)=>{
  const css=document.createElement("link");css.rel="stylesheet";css.href=leafletCss;css.integrity=cssHash;css.crossOrigin="anonymous";
  document.head.append(css);
  const js=document.createElement("script");js.src=leafletJs;js.integrity=jsHash;js.crossOrigin="anonymous";
  js.onload=()=>root.L?resolve(root.L):reject(Error("Leaflet was not exposed"));
  js.onerror=()=>reject(Error("Leaflet download was blocked"));
  document.head.append(js);
 });
 return loader;
}
// Progressive enhancement: OpenFreeMap's Positron vector style stays crisp
// on HiDPI screens. Leaflet coordinates/markers continue to work through
// MapLibre GL Leaflet; raster OSM is the honest fallback on blocked/WebGL-off
// clients. Only requested upon opening the map, never prefetch other beaches.
let vectorLoader=null;
async function loadVectorSupport(){
 if(!root.WebGLRenderingContext)throw Error("WebGL unavailable");
 if(root.L?.maplibreGL&&root.maplibregl)return root.L;
 if(vectorLoader)return vectorLoader;
 const addScript=url=>new Promise((resolve,reject)=>{
  const script=document.createElement("script");script.src=url;
  script.crossOrigin="anonymous";
  script.onload=resolve;script.onerror=()=>reject(Error("Map script blocked: "+url));
  document.head.append(script);
 });
 vectorLoader=(async()=>{
  // MapLibre GL JS 5 browser build exposes global maplibregl, as required by
  // the maplibre-gl-leaflet plugin. MapLibre 6 is ESM-only and its async
  // module namespace is not the plugin's expected browser script API.
  if(!root.maplibregl){
   if(!document.querySelector('link[data-faro-maplibre]')){
    const css=document.createElement("link");css.rel="stylesheet";
    css.dataset.faroMaplibre="true";
    css.href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
    document.head.append(css);
   }
   await addScript("https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js");
   if(!root.maplibregl)throw Error("MapLibre browser global unavailable");
  }
  if(!root.L?.maplibreGL)
   await addScript("https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js");
  if(!root.L?.maplibreGL)throw Error("Leaflet vector adapter unavailable");
  return root.L;
 })().catch(err=>{vectorLoader=null;throw err});
 return vectorLoader;
}

const deg=x=>typeof x==="number"&&Number.isFinite(x);
function bearingFromArrow(value){return deg(value)?(((value+180)%360)+360)%360:null}
function distanceToGuide(value,ranges){
 if(!deg(value)||!Array.isArray(ranges))return null;
 const valid=ranges.filter(r=>Array.isArray(r)&&r.length===2&&r.every(deg));
 if(!valid.length)return null;
 const wrap=a=>((a%360)+360)%360,gap=(a,b)=>Math.abs(((wrap(a)-wrap(b)+540)%360)-180);
 return Math.min(...valid.map(([a,b])=>{
  const x=wrap(value),lo=wrap(a),hi=wrap(b);
  return (lo<=hi?x>=lo&&x<=hi:x>=lo||x<=hi)?0:Math.min(gap(x,lo),gap(x,hi));
 }));
}
const guideClass=(value,ranges)=>{
 const d=distanceToGuide(value,ranges);
 return d===null?"unknown":d===0?"inside":d<=25?"edge":"outside";
};
// The colour grades directional GUIDE compatibility; it is not a surf-quality model.
// Wind above 30 km/h receives an explicit caution even if direction aligns.
function directionalFit(value,ranges,speed,wind=false){
 const fit=guideClass(value,ranges);
 return wind&&deg(speed)&&speed>=30&&fit!=="unknown"?"strong":fit;
}
function fitCopy(fit,lang){
 const es=lang!=="en";
 return fit==="inside"?(es?"Dirección favorable según guía":"Guide-favoured direction"):
  fit==="edge"?(es?"Cerca del rango guía":"Near guide range"):
  fit==="outside"?(es?"Fuera del rango guía":"Outside guide range"):
  fit==="strong"?(es?"Viento ≥30 km/h · precaución":"Wind ≥30 km/h · caution"):
  (es?"Sin rango evaluable":"Guide not assessed");
}
// Heuristic local signal, NOT a calibrated beach forecast or surf score.
// H²×T is only a relative offshore energy proxy.
function signalAssessment(kind,fit,slot={}){
 if(!["inside","edge","outside","strong"].includes(fit))return {level:"unknown",strength:null};
 if(kind==="swell"){
  const h=slot.swellHeightM,t=slot.swellPeriodS;
  if(!deg(h)||!deg(t)||h<0||t<=0)return {level:"unknown",strength:null};
  const p=h*h*t,strength=p>=9?"energetic":p>=3?"moderate":"low";
  if(fit==="outside")return {level:"unfavourable",strength};
  if(strength==="low"||t<7)return {level:"weak",strength};
  return {level:fit==="inside"&&strength==="energetic"?"favourable":"mixed",strength};
 }
 const speed=slot.windKmh,gust=slot.gustKmh;
 if(!deg(speed)||speed<0)return {level:"unknown",strength:null};
 const strength=speed>=26||(deg(gust)&&gust>=40)?"strong":
  speed>=15||(deg(gust)&&gust>=26)?"breezy":"light";
 if(strength==="strong"||fit==="strong")return {level:"unfavourable",strength};
 if(speed<=4&&(!deg(gust)||gust<=12))return {level:"favourable",strength};
 if(fit==="outside")return {level:"unfavourable",strength};
 return {level:fit==="inside"&&strength==="light"?"favourable":"mixed",strength};
}
function signalCopy(result,lang){
 const es=lang!=="en",s=result?.level;
 return s==="favourable"?(es?"Favorable":"Favourable"):
  s==="mixed"?(es?"Variable":"Mixed"):
  s==="weak"?(es?"Poca energía":"Low energy"):
  s==="unfavourable"?(es?"Desfavorable":"Unfavourable"):
  (es?"Sin evaluar":"Not assessed");
}
function stateLabel(value,lang){
 const es=lang!=="en";
 return value==="convergent"?(es?"Guías coinciden":"Guides agree"):
  value==="disputed"?(es?"Guías difieren":"Guides differ"):
  value==="outside"?(es?"Fuera de referencias":"Outside guide ranges"):(es?"Sin evaluar":"Not assessed");
}
function create(opts){
 const host=opts.container;const p=()=>opts.getCurrent?.()||{};
 const d=opts.disclosure;
 if(!host||!d)return null;
 let map=null,markers=new Map(),modelGridMarker=null,windGridMarker=null,latest=null,loadError=false;
 let mode="combined",mapView="beach",exposure=false,motion=false,showSamples=false,inspected="marine",lastCentered=null,pendingSampleFit=false;
 const reduced=()=>typeof root.matchMedia==="function"&&root.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const controls=document.createElement("div");controls.className="faro-lens-controls";host.append(controls);
 const modes=document.createElement("div");modes.className="faro-lens-segments";
 modes.setAttribute("role","group");modes.setAttribute("aria-label","Map model layer");
 controls.append(modes);
 const buttons={};
 for(const id of ["combined","swell","wind"]){
  const button=document.createElement("button");button.type="button";button.dataset.layer=id;
  button.addEventListener("click",()=>{mode=id;update(latest)});
  buttons[id]=button;modes.append(button);
 }
 // Optional interpretation controls do not compete with the three primary modes.
 const advanced=document.createElement("details");advanced.className="faro-lens-options";controls.append(advanced);
 const advancedSummary=document.createElement("summary");advanced.append(advancedSummary);
 const flags=document.createElement("div");flags.className="faro-lens-flags";advanced.append(flags);
 const recenter=document.createElement("button");recenter.type="button";
 recenter.className="faro-lens-recenter";recenter.dataset.action="reframe";
 recenter.addEventListener("click",()=>{
  mapView=mapView==="beach"?"region":"beach";
  if(mapView==="region")comparison.open=true;
  frameMap(true);update(latest);
 });controls.append(recenter);
 const regionSummary=document.createElement("div");regionSummary.className="faro-lens-region-summary";
 regionSummary.hidden=true;host.append(regionSummary);
 const status=document.createElement("p");status.className="faro-lens-status";status.setAttribute("role","status");host.append(status);
 function flag(type,onChange){
  const label=document.createElement("label");label.className="faro-lens-flag";
  const input=document.createElement("input");input.type="checkbox";
  const caption=document.createElement("span");label.append(input,caption);flags.append(label);
  input.addEventListener("change",()=>onChange(input.checked));return {input,caption,label};
 }
 const exposureFlag=flag("exposure",x=>{exposure=x;update(latest)});
 const motionFlag=flag("motion",x=>{motion=x&&!reduced();update(latest)});
 const samplesFlag=flag("samples",x=>{
  showSamples=x;
  if(mapView==="region")frameMap(true);
  update(latest);
 });
 if(reduced())motionFlag.input.disabled=true;
 const section=document.createElement("div");section.className="faro-map-wrap";host.append(section);
 const viewport=document.createElement("div");viewport.className="faro-map-viewport";viewport.setAttribute("aria-label","Valparaíso · mapa de spots");section.append(viewport);
 const compassDock=document.createElement("div");compassDock.className="faro-lens-compass-dock";
 compassDock.setAttribute("role","img");viewport.append(compassDock);
 const legend=document.createElement("div");legend.className="faro-lens-footer-legend";host.append(legend);
 const brief=document.createElement("div");brief.className="faro-map-brief";brief.setAttribute("aria-live","polite");host.append(brief);
 const comparison=document.createElement("details");comparison.className="faro-lens-beaches";host.append(comparison);
 const technical=document.createElement("details");technical.className="faro-lens-selected-detail";host.append(technical);
 const technicalSummary=document.createElement("summary");technical.append(technicalSummary);
 const details=document.createElement("div");details.className="faro-lens-technical-body";technical.append(details);
 const attr=document.createElement("p");attr.className="faro-map-note";attr.textContent="";details.append(attr);
 // Always render an accurate relative-coordinate fallback BEFORE requesting
 // any external map library or tiles. This is a lat/lon reference-point plot,
 // not a coastline, bathymetry survey, or nearshore refraction simulation.
 const NS="http://www.w3.org/2000/svg";
 const schematic=document.createElementNS(NS,"svg");schematic.classList.add("faro-map-schematic");
 schematic.setAttribute("viewBox","0 0 640 370");schematic.setAttribute("role","img");
 schematic.setAttribute("aria-label","Referencias geolocalizadas de cuatro spots; direcciones de swell y viento en sus celdas de modelo");
 viewport.append(schematic);
 function drawSchematic(){
  const current=latest||p(),es=current.lang!=="en";
  schematic.replaceChildren();
  function shape(tag,attrs={},text=null,parent=schematic){
   const node=document.createElementNS(NS,tag);
   for(const [k,v]of Object.entries(attrs))node.setAttribute(k,String(v));
   if(text!==null)node.textContent=text;
   parent.append(node);return node;
  }
  const spots=(current.spots||[]).filter(sp=>deg(sp.latitude)&&deg(sp.longitude));
  shape("rect",{x:0,y:0,width:640,height:370,fill:"#dceef1"});
  for(let i=0;i<7;i++)shape("line",{x1:40+i*94,y1:20,x2:40+i*94,y2:345,stroke:"#bad8dd","stroke-width":1,"stroke-dasharray":"3 8"});
  for(let i=0;i<5;i++)shape("line",{x1:25,y1:25+i*79,x2:610,y2:25+i*79,stroke:"#bad8dd","stroke-width":1,"stroke-dasharray":"3 8"});
  shape("text",{x:38,y:44,fill:"#517a84","font-family":"sans-serif","font-size":18,"font-weight":800},es?"OCÉANO PACÍFICO":"PACIFIC OCEAN");
  shape("text",{x:38,y:66,fill:"#517a84","font-family":"sans-serif","font-size":11},es?"Posiciones costeras aproximadas":"Approximate coastal reference points");
  shape("text",{x:558,y:344,fill:"#517a84","font-family":"sans-serif","font-size":11},es?"ESTE →":"EAST →");
  shape("text",{x:42,y:343,fill:"#517a84","font-family":"sans-serif","font-size":11},es?"← OESTE":"← WEST");
  // Keep the four beaches readable by default. Source cells are included
  // only when explicitly requested, never as large disconnected arrows.
  const grid=current.marineGrid,atmosphere=current.weatherGrid;
  const gridVisible=mapView==="region"&&showSamples;
  const locations=spots
   .concat(gridVisible&&mode!=="wind"&&deg(grid?.lat)&&deg(grid?.lon)?
    [{latitude:grid.lat,longitude:grid.lon}]:[])
   .concat(gridVisible&&mode!=="swell"&&deg(atmosphere?.lat)&&deg(atmosphere?.lon)?
    [{latitude:atmosphere.lat,longitude:atmosphere.lon}]:[]);
  const latMin=Math.min(...locations.map(x=>x.latitude)),latMax=Math.max(...locations.map(x=>x.latitude));
  const lonMin=Math.min(...locations.map(x=>x.longitude)),lonMax=Math.max(...locations.map(x=>x.longitude));
  const dy=Math.max(.10,latMax-latMin),dx=Math.max(.10,lonMax-lonMin);
  const project=sp=>({x:80+((sp.longitude-lonMin)/dx)*450,
                      y:300-((sp.latitude-latMin)/dy)*225});
  for(const sp of spots){
   const pos=project(sp),active=sp.id===current.spot?.id;
   const g=shape("g",{"data-spot":sp.id,role:"button",tabindex:0,"aria-label":sp.name,style:"cursor:pointer"});
   shape("circle",{cx:pos.x,cy:pos.y,r:active?11:8,stroke:active?"#fff":"#bad8dd",
    "stroke-width":active?4:2,fill:active?"#106382":"#1c3644"},null,g);
   shape("text",{x:pos.x>475?pos.x-15:pos.x+15,y:pos.y+4,fill:"#173c4a","font-family":"sans-serif",
    "text-anchor":pos.x>475?"end":"start",
    "font-size":active?17:14,"font-weight":active?900:750,
    stroke:"#dceef1","stroke-width":3,"paint-order":"stroke"},
    sp.shortName||sp.name,g);
   if(!active){
    const activate=()=>opts.onSelectSpot?.(sp.id);
    g.addEventListener("click",activate);
    g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate()}});
   }
  }
  // Intentionally no arrow rays: one source point does not determine
  // the wave path to each local break.
  if(gridVisible){
   for(const [source,kind,visible]of [[grid,"M",mode!=="wind"],[atmosphere,"A",mode!=="swell"]]){
    if(!visible||!deg(source?.lat)||!deg(source?.lon))continue;
    const q=project({latitude:source.lat,longitude:source.lon});
    shape("circle",{cx:q.x,cy:q.y,r:12,fill:"#f3f8f7",stroke:"#567983","stroke-width":1.3});
    shape("text",{x:q.x,y:q.y+4,fill:"#345a63","font-family":"sans-serif",
     "font-size":10,"font-weight":800,"text-anchor":"middle"},kind);
   }
  }
 }
 function append(tag,cls,text,parent=brief){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent.append(n);return n}
 function describe(){
  const v=latest||p(),es=v.lang!=="en",spot=v.spot,slot=v.slot||{},local=v.local;
  const profile=v.profiles?.[spot?.id]||{};
  const swellFit=directionalFit(slot.swellDirection,profile.waveFromDeg);
  const windFit=directionalFit(slot.windDirection,profile.windFromDeg,slot.windKmh,true);
  const swellSignal=signalAssessment("swell",swellFit,slot);
  const windSignal=signalAssessment("wind",windFit,slot);
  brief.replaceChildren();
  details.replaceChildren();
  const header=append("div","faro-lens-read-heading",null,brief);
  append("strong","",es?"LECTURA DEL MAR":"OCEAN READ",header);
  append("span","",(spot?.shortName||"FARO")+" · "+(slot.label||""),header);
  const row=append("div","faro-lens-quick-metrics",null,brief);
  if(spot&&slot.modelComplete){
   for(const [key,label,value,sub,fit,signal] of [
    ["swell",es?"SWELL PRINCIPAL":"PRIMARY SWELL",
     deg(slot.swellHeightM)?slot.swellHeightM.toFixed(1)+" m":"—",
     (deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s · ":"")+
      (es?"desde ":"from ")+(deg(slot.swellDirection)?Math.round(slot.swellDirection)+"°":"—"),swellFit,swellSignal],
    ["wind",es?"VIENTO":"WIND",
     deg(slot.windKmh)?slot.windKmh.toFixed(0)+" km/h":"—",
     (es?"desde ":"from ")+(deg(slot.windDirection)?Math.round(slot.windDirection)+"°":"—"),windFit,windSignal]
   ]){
    const tile=append("div","faro-lens-quick-metric is-"+key,null,row);
    tile.dataset.fit=fit;tile.dataset.signal=signal.level;
    append("small","",label,tile);append("strong","",value,tile);append("span","",sub,tile);
    append("em","faro-lens-local-fit",signalCopy(signal,v.lang),tile);
   }
  }else append("p","faro-map-summary",es?"Aún no hay una franja de modelo completa.":
   "A complete model window is not available.",row);
  technicalSummary.textContent=es?"Modelo, detalles y limitaciones":"Model details & limitations";
  const points=append("div","faro-lens-model-grid",null,details);
  const km=x=>deg(x?.distanceKm)?x.distanceKm.toFixed(1)+" km":"—";
  append("p","",(es?"Celda oceánica: ":"Marine sample: ")+km(v.marineGrid),points);
  append("p","",(es?"Celda atmosférica: ":"Weather sample: ")+km(v.weatherGrid),points);
  if(slot.modelComplete){
   const extra=[
    [es?"Oleaje total":"Total sea",slot.totalWaveHeightM,slot.totalWavePeriodS,slot.totalWaveDirection],
    [es?"Swell secundario":"Secondary swell",slot.secondarySwell?.heightM,slot.secondarySwell?.periodS,slot.secondarySwell?.fromDeg],
    [es?"Swell terciario":"Tertiary swell",slot.tertiarySwell?.heightM,slot.tertiarySwell?.periodS,slot.tertiarySwell?.fromDeg],
    [es?"Mar de viento":"Wind sea",slot.windSeaHeightM,null,slot.windSeaDirection]
   ].filter(x=>deg(x[1]));
   if(extra.length){
    const grid=append("div","faro-lens-advanced-grid",null,details);
    for(const [name,height,period,from]of extra){
     append("p","",name+" · "+height.toFixed(1)+" m"+
      (deg(period)?" · "+period.toFixed(0)+" s":"")+
      (deg(from)?" · "+(es?"desde ":"from ")+Math.round(from)+"°":""),grid);
    }
   }
  }
  const evidence=append("div","faro-map-evidence",null,details);
  append("span","",("Swell: ")+stateLabel(local?.swell?.state,v.lang),evidence);
  append("span","",(es?"Viento: ":"Wind: ")+stateLabel(local?.wind?.state,v.lang),evidence);
  const hypothesis=local?.waveShapeGuide?.hypothesis;
  if(hypothesis)append("p","faro-map-insight",hypothesis+" · "+(es?"Hipótesis local sin verificar":"Unverified local hypothesis"),details);
  const camera=(v.cameras||[]).find(x=>x.spotId===spot?.id&&
   (x.viewerAccess==="public_youtube_no_account"||x.viewerAccess==="free_account_required"));
  const actions=append("div","faro-map-shortcuts",null,details);
  if(camera&&/^https:\/\//.test(camera.page)){
   const link=append("a","faro-map-shortcut",es?"Ver cámara externa":"View external camera",actions);
   link.href=camera.page;link.target="_blank";link.rel="noopener noreferrer";
  }
  const note=append("button","faro-map-shortcut secondary",es?"Registrar olas observadas":"Log observed waves",actions);
  note.type="button";note.addEventListener("click",()=>{
   const panel=document.getElementById("fieldNotesExpand");
   if(panel){panel.open=true;panel.scrollIntoView({block:"start",behavior:"smooth"})}
  });
  attr.textContent=es?
   "Celdas del modelo y referencias costeras, no bancos de surf exactos. Flecha = dirección de viaje (DESDE + 180°). Sin simulación de refracción ni altura rompiente. © OpenStreetMap contributors.":
   "Model grid cells and coastal references, not exact surf banks. Arrows = travel (FROM + 180°). No refraction or breaking-wave simulation. © OpenStreetMap contributors.";
  details.append(attr);
 }
 function drawUi(){
  const v=latest||p(),slot=v.slot||{},es=v.lang!=="en",dir=x=>deg(x)?Math.round(x)+"°":"—";
  advancedSummary.textContent=es?"Opciones del mapa":"Map options";
  recenter.textContent=mapView==="beach"?(es?"Ver región":"Regional view"):
   (es?"Volver a playa":"Beach focus");
  recenter.setAttribute("aria-label",mapView==="beach"?
   (es?"Mostrar celdas oceánicas y atmosféricas en contexto regional":"Show marine and wind model cells in regional context"):
   (es?"Acercar el mapa a la playa seleccionada":"Zoom into the selected beach"));
  recenter.setAttribute("aria-pressed",String(mapView==="region"));
  recenter.disabled=!map;
  for(const [key,label] of Object.entries({combined:es?"Combinado":"Combined",swell:"Swell",wind:es?"Viento":"Wind"})){
   buttons[key].textContent=label;buttons[key].classList.toggle("active",key===mode);
   buttons[key].setAttribute("aria-pressed",String(key===mode));
  }
  exposureFlag.caption.textContent=mode==="wind"?
   (es?"Guía de viento":"Wind guide"):(es?"Guía de swell":"Swell guide");
  motionFlag.caption.textContent=es?"Movimiento":"Motion";
  samplesFlag.caption.textContent=es?"Ver celdas del modelo":"Show model sample points";
  advancedSummary.textContent=mapView==="region"?
   (es?"Datos del modelo":"Model data"):
   (es?"Opciones del mapa":"Map options");
  exposureFlag.label.hidden=mapView==="region";
  motionFlag.label.hidden=mapView==="region";
  samplesFlag.label.hidden=mapView!=="region";
  motionFlag.input.checked=motion;exposureFlag.input.checked=exposure;
  samplesFlag.input.checked=showSamples;
  host.dataset.mapView=mapView;
  regionSummary.hidden=mapView!=="region";
  regionSummary.replaceChildren();
  if(mapView==="region"){
   const regionalTitle=document.createElement("strong");
   regionalTitle.textContent=es?"CUATRO PLAYAS · UNA COSTA":"FOUR BEACHES · ONE COAST";
   const regionalText=document.createElement("span");
   regionalText.textContent=es?
    "Selecciona una playa para acercarte. Los trazos comparan rumbos guía, no olas observadas.":
    "Select a beach to zoom in. The marks compare guide bearings, not observed waves.";
   regionSummary.append(regionalTitle,regionalText);
  }
  viewport.classList.toggle("faro-lens-motion",motion&&!reduced()&&
   (mode==="wind"?deg(slot.windDirection):deg(slot.swellDirection)));
  viewport.classList.toggle("faro-map-regional",mapView==="region");
  // In regional overview there is no direction HUD for the selected beach:
  // the map compares four geographic reference points, not offshore model cells.
  compassDock.hidden=mapView==="region";
  // A compact viewport HUD: it does not move with model sample positions,
  // does not obscure the selected spot and survives pan/zoom.
  compassDock.replaceChildren();
  const hudProfile=v.profiles?.[v.spot?.id]||{};
  const swellFitHUD=directionalFit(slot.swellDirection,hudProfile.waveFromDeg);
  const windFitHUD=directionalFit(slot.windDirection,hudProfile.windFromDeg,slot.windKmh,true);
  const swellHUD=signalAssessment("swell",swellFitHUD,slot);
  const windHUD=signalAssessment("wind",windFitHUD,slot);
  compassDock.className="faro-lens-compass-dock faro-direction-hud";
  const hdr=document.createElement("div");hdr.className="faro-hud-heading";
  const hdrText=document.createElement("strong");
  hdrText.textContent=es?"DIRECCIÓN · MODELO":"DIRECTION · MODEL";
  const hdrNorth=document.createElement("span");hdrNorth.textContent="N ↑";
  hdr.append(hdrText,hdrNorth);compassDock.append(hdr);
  const makeArrow=(from,kind)=>{
   // A single geometric SVG language for both signals. One shaft and one
   // open chevron, no decorative strokes, loose tails, or clip-art tips.
   // Input direction is FROM; arrow points to travel bearing FROM + 180.
   const svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","0 0 28 28");
   svg.setAttribute("aria-hidden","true");svg.classList.add("faro-hud-arrow");
   svg.dataset.kind=kind;
   const vector=document.createElementNS(NS,"g");
   vector.setAttribute("transform","rotate("+(bearingFromArrow(from)??0)+" 14 14)");
   svg.append(vector);
   const path=document.createElementNS(NS,"path");
   path.setAttribute("d","M9.5 11 L14 6.5 L18.5 11 M14 6.5 L14 22");
   path.setAttribute("fill","none");
   path.setAttribute("stroke","currentColor");
   path.setAttribute("stroke-width",kind==="swell"?"2.2":"1.65");
   path.setAttribute("stroke-linecap","round");
   path.setAttribute("stroke-linejoin","round");
   vector.append(path);
   return svg;
  };
  const addSignal=(name,from,signal)=>{
   const item=document.createElement("div");item.className="faro-hud-row is-"+(name==="SWELL"?"swell":"wind");
   item.dataset.level=signal.level;
   // Semantic colours live in CSS light/dark palettes, not inline paint.
   item.append(makeArrow(from,name==="SWELL"?"swell":"wind"));
   const copy=document.createElement("div");copy.className="faro-hud-copy";
   const heading=document.createElement("strong");
   heading.textContent=name+" · "+(deg(from)?Math.round(from)+"°":"—");
   const subtitle=document.createElement("span");subtitle.textContent=signalCopy(signal,v.lang);
   copy.append(heading,subtitle);item.append(copy);compassDock.append(item);
  };
  if(mode!=="wind")addSignal("SWELL",slot.swellDirection,swellHUD);
  if(mode!=="swell")addSignal(es?"VIENTO":"WIND",slot.windDirection,windHUD);
  const hudNote=document.createElement("small");hudNote.className="faro-hud-foot";
  hudNote.textContent=es?"Flechas: hacia dónde viajan":"Arrows: direction of travel";
  compassDock.append(hudNote);
  if(exposure){
   const chosen=(mode==="wind"?hudProfile.windFromDeg:hudProfile.waveFromDeg)||[];
   const ranges=chosen.filter(r=>Array.isArray(r)&&r.length===2&&r.every(deg))
    .map(r=>Math.round(r[0])+"–"+Math.round(r[1])+"°");
   const guideNote=document.createElement("small");guideNote.className="faro-hud-guide";
   guideNote.textContent=(es?"Rango guía: ":"Guide sector: ")+(ranges.join(", ")||
    (es?"no disponible":"unavailable"));
   compassDock.append(guideNote);
  }
  compassDock.setAttribute("aria-label",(v.spot?.name||"")+
    " · swell "+signalCopy(swellHUD,v.lang)+", wind "+signalCopy(windHUD,v.lang));
  legend.replaceChildren();
  if(mapView==="region"){
   const guideLegend=[
    ["#348d71",es?"Dentro de guía":"Within guide"],
    ["#b38b42",es?"Cerca de guía":"Near guide"],
    ["#be6959",es?"Fuera de guía":"Outside guide"]
   ];
   for(const [colour,name]of guideLegend){
    const item=document.createElement("span");item.className="faro-lens-legend-key";
    const dot=document.createElement("i");dot.className="faro-region-legend-dot";
    dot.style.backgroundColor=colour;
    item.append(dot,document.createTextNode(name));legend.append(item);
   }
   const note=document.createElement("small");note.textContent=es?
    "Trazos: swell sólido · viento punteado. Sólo rumbo guía.":
    "Solid = swell · dotted = wind. Guide bearings only.";
   legend.append(note);
  }else{
   const colours={favourable:"#348d71",mixed:"#b38b42",weak:"#c98b55",
    unfavourable:"#be6959",unknown:"#738b93"};
   for(const [visible,name,signal]of [
    [mode!=="wind","Swell",swellHUD],[mode!=="swell",es?"Viento":"Wind",windHUD]]){
    if(!visible)continue;
    const item=document.createElement("span");item.className="faro-lens-legend-key";
    const line=document.createElement("i");
    line.style.borderTop="3px solid "+colours[signal.level];
    item.append(line,document.createTextNode(name+" · "+signalCopy(signal,v.lang)));
    legend.append(item);
   }
   const note=document.createElement("small");
   note.textContent=es?"Guía + intensidad modelada, no surf observado":
    "Guide + modelled strength, not observed surf quality";
   legend.append(note);
  }
  const wasOpen=comparison.open;comparison.replaceChildren();
  const heading=document.createElement("summary");heading.className="faro-lens-beaches-header";
  const title=document.createElement("strong");title.textContent=es?"COMPARAR 4 PLAYAS":"COMPARE 4 BEACHES";
  const blurb=document.createElement("small");blurb.textContent=es?
   "Dirección de swell y viento frente a rangos guía":
   "Swell and wind direction versus guide ranges";
  heading.append(title,blurb);comparison.append(heading);comparison.open=wasOpen;
  const grid=document.createElement("div");grid.className="faro-lens-beaches-grid";comparison.append(grid);
  for(const sp of v.spots||[]){
   const bounds=v.profiles?.[sp.id]?.waveFromDeg||[];
   const windBounds=v.profiles?.[sp.id]?.windFromDeg||[];
   const status=guideClass(slot.swellDirection,bounds);
   const windState=guideClass(slot.windDirection,windBounds);
   const button=document.createElement("button");button.type="button";
   button.className="faro-lens-beach"+(v.spot?.id===sp.id?" is-current":"");
   button.dataset.guide=status;button.setAttribute("aria-pressed",String(v.spot?.id===sp.id));
   const name=document.createElement("strong");name.textContent=sp.shortName||sp.name;
   const info=document.createElement("small");info.textContent=status==="inside"?
    (es?"Dentro del rango guía":"Within guide range"):status==="edge"?
    (es?"Cerca del rango guía":"Near guide range"):status==="outside"?
    (es?"Fuera del rango guía":"Outside guide range"):
    (es?"Orientación no disponible":"Orientation unavailable");
   button.append(name,info);
   const wind=document.createElement("small");wind.className="faro-lens-wind-guide";
   wind.textContent=(es?"Viento: ":"Wind: ")+(windState==="inside"?(es?"dentro de guía":"within guide"):
    windState==="edge"?(es?"cerca de guía":"near guide"):
    windState==="outside"?(es?"fuera de guía":"outside guide"):
    (es?"sin referencia":"not assessed"));
   button.append(wind);
   button.addEventListener("click",()=>{if(v.spot?.id!==sp.id)opts.onSelectSpot?.(sp.id)});
   grid.append(button);
  }
  const caveat=document.createElement("p");caveat.className="faro-lens-uncertainty";
  caveat.textContent=es?
   "Comparación regional de rumbo, sin corregir por bancos, sombra costera, profundidad o refracción. Selecciona la playa para cargar su propio pronóstico.":
   "Regional directional comparison only. Does not resolve local sandbanks, sheltering, bathymetry or refraction. Choose a beach to load its own forecast.";
  comparison.append(caveat);

 }

 function markerIcon(L,spot,selected,swellFit,windFit){
  // The coastline and named breaks remain the central map content.
  // Micro-bars show only angular compatibility with published guides.
  const es=(latest?.lang||"es")!=="en";
  const label=fit=>fit==="inside"?(es?"dentro":"within"):
   fit==="edge"?(es?"cerca":"near"):
   fit==="outside"?(es?"fuera":"outside"):
   es?"sin referencia":"unavailable";
  const base=document.createElement("div");
  base.className="faro-map-pin"+(selected?" is-current":"")+
   (mapView==="region"?" is-regional":" is-beach");
  base.dataset.swellFit=swellFit;
  base.dataset.windFit=windFit;
  const dot=document.createElement("i");dot.className="faro-map-guide-dot";
  dot.setAttribute("aria-hidden","true");base.append(dot);
  const name=document.createElement("span");name.className="faro-map-pin-name";
  name.textContent=spot.shortName||spot.name;base.append(name);
  if(mapView==="region"){
   const tracks=document.createElement("span");tracks.className="faro-region-fit-tracks";
   tracks.setAttribute("aria-hidden","true");
   for(const [kind,status]of [["swell",swellFit],["wind",windFit]]){
    if((mode==="swell"&&kind==="wind")||(mode==="wind"&&kind==="swell"))continue;
    const micro=document.createElement("span");micro.className="faro-region-fit-tick is-"+kind;
    micro.dataset.fit=status;micro.textContent=kind==="swell"?"S":"W";
    micro.title=(kind==="swell"?"Swell":"Wind")+" · "+label(status)+" guide";
    tracks.append(micro);
   }
   base.append(tracks);
   const desc=(es?"Swell: ":"Swell: ")+label(swellFit)+
    (es?" de guía · viento: ":" guide · wind: ")+label(windFit)+
    (es?" de guía":" guide");
   base.setAttribute("aria-label",(spot.shortName||spot.name)+". "+desc);
   base.title=desc;
  }
  return L.divIcon({className:"faro-leaflet-marker",html:base.outerHTML,
   iconSize:[144,38],iconAnchor:[72,19]});
 }
 function modelSampleIcon(L,kind){
  // Source coordinates, not breaking waves and never a directional arrow.
  // These quiet cartographic annotation pins appear only when the surfer
  // explicitly chooses "Show model sample points".
  const shell=document.createElement("div");shell.className="faro-model-sample";
  shell.dataset.source=kind;
  const mark=document.createElement("span");mark.className="faro-model-sample-mark";
  mark.setAttribute("aria-hidden","true");mark.textContent=kind==="marine"?"M":"A";
  const caption=document.createElement("span");caption.className="faro-model-sample-name";
  caption.textContent=kind==="marine"?"MARINE":"ATMOS";
  shell.append(mark,caption);
  return L.divIcon({className:"faro-model-sample-anchor",html:shell.outerHTML,
   iconSize:[78,28],iconAnchor:[39,14]});
 }
 function modelPopup(marine){
  const v=latest||p(),s=v.slot||{},es=v.lang!=="en",node=document.createElement("div");
  node.className="faro-lens-sample-popup";
  const title=document.createElement("strong");title.textContent=marine?
   (es?"CELDA MARINA · MODELO":"MARINE GRID · MODEL"):
   (es?"CELDA ATMOSFÉRICA · MODELO":"ATMOSPHERIC GRID · MODEL");node.append(title);
  const items=marine?[
   ["Swell principal",s.swellHeightM,s.swellPeriodS,s.swellDirection],
   ...(s.secondarySwell?[["Swell secundario",s.secondarySwell.heightM,s.secondarySwell.periodS,s.secondarySwell.fromDeg]]:[]),
   ...(s.tertiarySwell?[["Swell terciario",s.tertiarySwell.heightM,s.tertiarySwell.periodS,s.tertiarySwell.fromDeg]]:[])
  ]:[["Viento",s.windKmh,null,s.windDirection]];
  for(const [name,h,t,d] of items){
   if(!deg(h))continue;
   const item=document.createElement("p");
   item.textContent=name+" · "+h.toFixed(marine?1:0)+(marine?" m":" km/h")+
    (deg(t)?" · "+t.toFixed(0)+" s":"")+(deg(d)?" · "+(es?"desde ":"from ")+Math.round(d)+"°":"");
   node.append(item);
  }
  const sample=marine?v.marineGrid:v.weatherGrid;
  const note=document.createElement("small");note.textContent=(deg(sample?.distanceKm)?
   sample.distanceKm.toFixed(1)+" km "+(es?"de referencia":"from coastal reference"):
    es?"Distancia sin verificar":"Distance unavailable")+
   " · "+(es?"Modelo; no es medición de rompiente":"Model; not breaking-surf measurement");
  node.append(note);return node;
 }
 function frameMap(force){
  const sp=latest?.spot;
  if(!map||!sp||!deg(sp.latitude)||!deg(sp.longitude))return false;
  const coast=[sp.latitude,sp.longitude],L=root.L;
  // The selected beach controls the default zoom; offshore model sampling
  // coordinates are available separately via Regional view.
  if(mapView==="beach"){
   map.setView(coast,viewport.clientWidth&&viewport.clientWidth<520?15:16,{animate:false});
  }else{
   // REGIONAL means compare the FOUR named beaches, NOT fit offshore
   // marine/atmosphere model sample grids which can push beaches off-screen.
   const beaches=(latest.spots||[]).filter(p=>
    deg(p.latitude)&&deg(p.longitude));
   if(beaches.length>1){
    const bounds=L.latLngBounds(
     [beaches[0].latitude,beaches[0].longitude],
     [beaches[0].latitude,beaches[0].longitude]);
    for(const beach of beaches.slice(1))bounds.extend([beach.latitude,beach.longitude]);
    // Only when the surfer explicitly requests model sampling cells should
    // those coordinates expand the region's framing.
    if(showSamples)for(const grid of [latest.marineGrid,latest.weatherGrid]){
     if(deg(grid?.lat)&&deg(grid?.lon)&&deg(grid?.distanceKm)&&grid.distanceKm<=60)
      bounds.extend([grid.lat,grid.lon]);
    }
    map.fitBounds(bounds,{
     padding:viewport.clientWidth&&viewport.clientWidth<520?[48,70]:[65,80],
     maxZoom:11,animate:false
    });
   }else map.setView(coast,12,{animate:false});
  }
  lastCentered=sp.id;pendingSampleFit=false;status.textContent="";
  return true;
 }
 function update(data){
  latest=data||p();describe();drawSchematic();drawUi();
  if(!map)return;
  const L=root.L,sel=latest.spot?.id;
  for(const sp of (latest.spots||[]).filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude))){
   if(!markers.has(sp.id)){
    const m=L.marker([sp.latitude,sp.longitude],{title:sp.name,keyboard:true});
    m.addTo(map).on("click",()=>{
     if(sp.id!==latest.spot?.id){
      opts.onSelectSpot?.(sp.id);
     }else if(mapView==="region"){
      // Even the already-selected beach is a useful regional navigation
      // target: open its beach focus rather than doing nothing.
      mapView="beach";frameMap(true);update(latest);
     }
    });
    markers.set(sp.id,m);
   }
   const profile=latest.profiles?.[sp.id]||{};
   const swellFit=guideClass(latest.slot?.swellDirection,profile.waveFromDeg);
   const windFit=guideClass(latest.slot?.windDirection,profile.windFromDeg);
   markers.get(sp.id).setIcon(markerIcon(L,sp,sp.id===sel,swellFit,windFit));
   markers.get(sp.id).setZIndexOffset(sp.id===sel?150:0);
  }
  // Beach coordinates belong to the spot pin; signals live in the HUD.
  const displayMarine=mapView==="region"&&showSamples&&mode!=="wind";
  const displayWind=mapView==="region"&&showSamples&&mode!=="swell";
  const grid=latest.marineGrid;
  if(displayMarine&&deg(grid?.lat)&&deg(grid?.lon)){
   const pos=[grid.lat,grid.lon];
   if(!modelGridMarker){
    modelGridMarker=L.marker(pos,{title:"Marine model sample",interactive:true,keyboard:true});
    modelGridMarker.addTo(map);
   }else modelGridMarker.setLatLng(pos);
   modelGridMarker.setIcon(modelSampleIcon(L,"marine"));
   modelGridMarker.bindPopup(modelPopup(true),{maxWidth:300});
   modelGridMarker.setZIndexOffset(90);
  }else if(modelGridMarker){
   map.removeLayer(modelGridMarker);modelGridMarker=null;
  }
  const atmosphere=latest.weatherGrid;
  if(displayWind&&deg(atmosphere?.lat)&&deg(atmosphere?.lon)){
   const pos=[atmosphere.lat,atmosphere.lon];
   if(!windGridMarker){
    windGridMarker=L.marker(pos,{title:"Atmospheric model sample",interactive:true,keyboard:true});
    windGridMarker.addTo(map);
   }else windGridMarker.setLatLng(pos);
   windGridMarker.setIcon(modelSampleIcon(L,"atmosphere"));
   windGridMarker.bindPopup(modelPopup(false),{maxWidth:300});
   windGridMarker.setZIndexOffset(90);
  }else if(windGridMarker){
   map.removeLayer(windGridMarker);windGridMarker=null;
  }
  // Switching beach always returns to its local close-up; subsequent
  // hourly changes leave the user's pan and zoom untouched.
  if(latest.spot&&lastCentered!==latest.spot.id){
   mapView="beach";frameMap(false);drawUi();
  }
 }
 async function open(){
  if(loadError)return;
  if(map){map.invalidateSize({pan:false});update(p());return}
  status.textContent=p().lang==="en"?"Loading map…":"Cargando mapa…";
  try{
   const L=await loadLeaflet();if(!d.open)return;
   schematic.remove();
   map=L.map(viewport,{scrollWheelZoom:false,zoomControl:true,attributionControl:true});
   map.on("dragstart",()=>{pendingSampleFit=false;});
   // A raster first frame keeps the map usable if WebGL or the vector CDN
   // is blocked. detectRetina avoids the soft 256px-tile upscaling on HiDPI.
   const raster=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:18,maxNativeZoom:18,minZoom:9,detectRetina:true,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
   }).addTo(map);
   if(root.WebGLRenderingContext){
    // Optional, non-blocking vector enhancement. Never destroy working raster
    // until a complete vector style has actually loaded.
    void loadVectorSupport().then(()=>{
     if(!map||!d.open)return;
     const vector=L.maplibreGL({
      style:"https://tiles.openfreemap.org/styles/positron",
      attribution:'&copy; <a href="https://openfreemap.org/">OpenFreeMap</a> / '+
       '<a href="https://openmaptiles.org/">OpenMapTiles</a> / '+
       '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
     }).addTo(map);
     const gl=vector.getMaplibreMap?.();
     if(!gl)return;
     let ready=false;
     gl.once("load",()=>{
      if(!map||ready)return;
      ready=true;
      if(map.hasLayer?.(raster))map.removeLayer(raster);
      viewport.classList.add("faro-has-vector-basemap");
     });
     gl.on("error",()=>{
      if(ready)return;
      try{map?.removeLayer(vector)}catch(_e){}
      // Keep the OSM fallback. Errors must never erase beach markers.
     });
    }).catch(()=>{ /* already displaying a real raster basemap */ });
   }
   map.setView([-32.918807,-71.512047],13);
   update(p());status.textContent="";
   requestAnimationFrame(()=>map?.invalidateSize({pan:false}));
  }catch(err){
   loadError=true;
   if(!schematic.isConnected){viewport.replaceChildren(schematic,compassDock)}
   status.textContent=p().lang==="en"?
    "Map tiles unavailable. Showing a schematic of model references.":
    "Mapa base no disponible. Se muestran las referencias del modelo.";
   drawSchematic();drawUi();describe();
  }
 }
 d.addEventListener("toggle",()=>{if(d.open)void open();});
 update(p());
 if(d.open)void open();
 return {update,getMap:()=>map,setMode:x=>{if(buttons[x]){mode=x;update(latest)}},
  setMapView:x=>{if(["beach","region"].includes(x)){
   mapView=x;if(x==="region")comparison.open=true;
   frameMap(true);update(latest)}},
  getState:()=>({mode,mapView,exposure,motion,showSamples,lastCentered})};
}
root.FaroChileCoastMap=Object.freeze({create,bearingFromArrow,stateLabel,distanceToGuide,guideClass,directionalFit,fitCopy,signalAssessment});
if(typeof module!=="undefined"&&module.exports)module.exports=root.FaroChileCoastMap;
})(typeof window!=="undefined"?window:globalThis);
