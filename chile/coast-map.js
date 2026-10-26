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
const deg=x=>typeof x==="number"&&Number.isFinite(x);
function bearingFromArrow(value){return deg(value)?((value+180)%360):null}
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
 let map=null,markers=new Map(),opened=false,latest=null,loadError=false;
 const section=document.createElement("div");section.className="faro-map-wrap";host.append(section);
 const viewport=document.createElement("div");viewport.className="faro-map-viewport";viewport.setAttribute("aria-label","Valparaíso · mapa de spots");section.append(viewport);
 const brief=document.createElement("div");brief.className="faro-map-brief";brief.setAttribute("aria-live","polite");section.append(brief);
 const attr=document.createElement("p");attr.className="faro-map-note";attr.textContent="";section.append(attr);
 function append(tag,cls,text,parent=brief){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent.append(n);return n}
 function describe(){
  const v=latest||p(),lang=v.lang||"es",es=lang!=="en",spot=v.spot,slot=v.slot,local=v.local;
  brief.replaceChildren();
  if(!spot){append("p","faro-map-summary",es?"Selecciona un spot.":"Select a spot.");return}
  append("strong","faro-map-spot",spot.name||spot.shortName);
  if(!slot?.modelComplete){
   append("p","faro-map-summary",es?"Todavía no hay condiciones horarias completas para este spot.":"Hourly model values are not yet complete.");return;
  }
  const dir=x=>deg(x)?Math.round(x)+"°":"—";
  const row=append("div","faro-map-readings");
  const cards=[
   [es?"🌊 SWELL · DESDE":"🌊 SWELL · FROM",
    dir(slot.swellDirection)+" · "+(deg(slot.swellHeightM)?slot.swellHeightM.toFixed(1)+" m":"—"),
    es?"Período "+(deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s":"—"):"Period "+(deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s":"—")],
   [es?"💨 VIENTO · DESDE":"💨 WIND · FROM",
    dir(slot.windDirection)+" · "+(deg(slot.windKmh)?slot.windKmh.toFixed(0)+" km/h":"—"),
    deg(slot.gustKmh)?(es?"Rachas ":"Gusts ")+slot.gustKmh.toFixed(0)+" km/h":""]
  ];
  for(const [label,value,meta]of cards){
   const c=append("div","faro-map-reading",null,row);append("small","",label,c);append("strong","",value,c);append("span","",meta,c);
  }
  const evidence=append("div","faro-map-evidence");
  append("span","",es?"Swell: "+stateLabel(local?.swell?.state,lang):"Swell: "+stateLabel(local?.swell?.state,lang),evidence);
  append("span","",es?"Viento: "+stateLabel(local?.wind?.state,lang):"Wind: "+stateLabel(local?.wind?.state,lang),evidence);
  const guide=local?.waveShapeGuide?.hypothesis;
  if(guide)append("p","faro-map-insight",guide+" · "+(es?"Hipótesis local por verificar.":"Unverified local hypothesis."));
  attr.textContent=es?
   "Puntos de referencia costera, no picos georreferenciados. Las flechas representan viaje modelado (180° respecto a DESDE), no refracción ni olas rompientes. © OpenStreetMap contributors.":
   "Coastal reference points, not surveyed peaks. Arrows show modelled travel (180° from the FROM bearings), not refraction or breaking direction. © OpenStreetMap contributors.";
 }
 function markerIcon(L,spot,selected,slot){
  const d1=selected?bearingFromArrow(slot?.swellDirection):null;
  const d2=selected?bearingFromArrow(slot?.windDirection):null;
  const cls=selected?"faro-map-pin is-current":"faro-map-pin";
  const base=document.createElement("div");base.className=cls;
  const name=document.createElement("span");name.className="faro-map-pin-name";name.textContent=spot.shortName||spot.name;base.append(name);
  if(d1!==null){const a=document.createElement("span");a.className="faro-map-arrow swell";a.textContent="↑";a.style.transform="rotate("+d1+"deg)";base.append(a)}
  if(d2!==null){const a=document.createElement("span");a.className="faro-map-arrow wind";a.textContent="↑";a.style.transform="rotate("+d2+"deg)";base.append(a)}
  return L.divIcon({className:"faro-leaflet-marker",html:base.outerHTML,iconSize:[112,48],iconAnchor:[56,26]});
 }
 function update(data){
  latest=data||p();describe();
  if(!map)return;
  const L=root.L,sel=latest.spot?.id;
  for(const sp of (latest.spots||[]).filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude))){
   if(!markers.has(sp.id)){
    const m=L.marker([sp.latitude,sp.longitude],{title:sp.name,keyboard:true});
    m.addTo(map).on("click",()=>{
     if(sp.id!==latest.spot?.id)opts.onSelectSpot?.(sp.id);
    });
    markers.set(sp.id,m);
   }
   markers.get(sp.id).setIcon(markerIcon(L,sp,sp.id===sel,sp.id===sel?latest.slot:null));
   markers.get(sp.id).setZIndexOffset(sp.id===sel?150:0);
  }
  if(latest.spot&&Number.isFinite(latest.spot.latitude)&&Number.isFinite(latest.spot.longitude)){
   if(!opened){map.setView([latest.spot.latitude,latest.spot.longitude],11,{animate:false});opened=true}
  }
 }
 async function open(){
  if(loadError)return;
  if(map){map.invalidateSize({pan:false});update(p());return}
  brief.replaceChildren();append("p","faro-map-summary",p().lang==="en"?"Loading coastal map…":"Cargando mapa costero…");
  try{
   const L=await loadLeaflet();if(!d.open)return;
   map=L.map(viewport,{scrollWheelZoom:false,zoomControl:true,attributionControl:true});
   L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:15,minZoom:9,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
   }).addTo(map);
   map.setView([-32.91,-71.53],11);
   update(p());
   requestAnimationFrame(()=>map?.invalidateSize({pan:false}));
  }catch(err){
   loadError=true;
   viewport.textContent=p().lang==="en"?"Map tiles unavailable; the surf-direction read below still works.":
    "Mapa no disponible; puedes consultar igual las direcciones de swell y viento.";
   describe();
  }
 }
 d.addEventListener("toggle",()=>{if(d.open)void open();});
 if(d.open)void open();else describe();
 return {update,getMap:()=>map};
}
root.FaroChileCoastMap=Object.freeze({create,bearingFromArrow,stateLabel});
if(typeof module!=="undefined"&&module.exports)module.exports=root.FaroChileCoastMap;
})(typeof window!=="undefined"?window:globalThis);
