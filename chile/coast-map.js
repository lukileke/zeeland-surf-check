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
 // Always render an accurate relative-coordinate fallback BEFORE requesting
 // any external map library or tiles. This is a lat/lon reference-point plot,
 // not a coastline, bathymetry survey, or nearshore refraction simulation.
 const NS="http://www.w3.org/2000/svg";
 const schematic=document.createElementNS(NS,"svg");schematic.classList.add("faro-map-schematic");
 schematic.setAttribute("viewBox","0 0 640 370");schematic.setAttribute("role","img");
 schematic.setAttribute("aria-label","Latitud y longitud de los tres spots; flechas del swell y viento");
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
  const project=sp=>({x:50+(sp.longitude+71.70)/.30*520,y:32+(-32.75-sp.latitude)/.25*285});
  function ray(x,y,bearing,color,shift){
   const travel=bearingFromArrow(bearing),r=travel*Math.PI/180;
   const sx=x+shift,sy=y-16;
   const dx=Math.sin(r)*74,dy=-Math.cos(r)*74;
   const endx=sx+dx,endy=sy+dy;
   shape("line",{x1:sx,y1:sy,x2:endx,y2:endy,stroke:color,"stroke-width":5,"stroke-linecap":"round"});
   const backx=endx-Math.sin(r)*13,backy=endy+Math.cos(r)*13;
   const px=Math.cos(r)*7,py=Math.sin(r)*7;
   shape("polygon",{points:[endx+","+endy,(backx+px)+","+(backy+py),(backx-px)+","+(backy-py)].join(" "),
    fill:color});
  }
  for(const sp of spots){
   const pos=project(sp),active=sp.id===current.spot?.id;
   const g=shape("g",{"data-spot":sp.id,role:"button",tabindex:0,"aria-label":sp.name,style:"cursor:pointer"});
   if(active&&deg(current.slot?.swellDirection))ray(pos.x,pos.y,current.slot.swellDirection,"#137d9f",-12);
   if(active&&deg(current.slot?.windDirection))ray(pos.x,pos.y,current.slot.windDirection,"#ba7628",12);
   shape("circle",{cx:pos.x,cy:pos.y,r:active?11:8,stroke:active?"#fff":"#bad8dd",
    "stroke-width":active?4:2,fill:active?"#106382":"#1c3644"},null,g);
   shape("text",{x:pos.x+15,y:pos.y+4,fill:"#173c4a","font-family":"sans-serif",
    "font-size":active?17:14,"font-weight":active?900:750,
    stroke:"#dceef1","stroke-width":3,"paint-order":"stroke"},
    sp.shortName||sp.name,g);
   if(!active){
    const activate=()=>opts.onSelectSpot?.(sp.id);
    g.addEventListener("click",activate);
    g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate()}});
   }
  }
  shape("rect",{x:28,y:351,width:11,height:6,rx:2,fill:"#137d9f"});
  shape("text",{x:46,y:358,fill:"#234c5c","font-family":"sans-serif","font-size":11},es?"Swell, viaje del modelo":"Swell model travel");
  shape("rect",{x:220,y:351,width:11,height:6,rx:2,fill:"#ba7628"});
  shape("text",{x:238,y:358,fill:"#234c5c","font-family":"sans-serif","font-size":11},es?"Viento, viaje del modelo":"Wind model travel");
 }
 function append(tag,cls,text,parent=brief){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent.append(n);return n}
 function describe(){
  const v=latest||p(),lang=v.lang||"es",es=lang!=="en",spot=v.spot,slot=v.slot,local=v.local;
  brief.replaceChildren();
  const lensApi=root.FaroChileCoastalLens;
  const lensRead=lensApi?.reading(slot,local,lang);
  if(lensRead){
   const lens=append("section","faro-lens-module",null);
   const hdr=append("div","faro-lens-title",null,lens);
   append("strong","",es?"SWELL COMPASS":"SWELL COMPASS",hdr);
   append("span","",es?"Lectura de la franja":"Selected time",hdr);
   const inner=append("div","faro-lens-inner",null,lens);
   if(lensRead.available)inner.append(lensApi.compass(lensRead,lang));
   else append("p","faro-map-summary",lensRead.explanation,inner);
   const detail=append("div","faro-lens-detail",null,inner);
   for(const n of lensRead.notes){
    const k=append("div","faro-lens-legend "+n.kind,null,detail);
    append("small","",n.title,k);
    append("strong","",n.value,k);
    append("span","",n.detail,k);
   }
   append("p","faro-lens-caption",lensRead.preview||"",lens);
  }
  if(!spot){append("p","faro-map-summary",es?"Selecciona un spot.":"Select a spot.");return}
  append("strong","faro-map-spot",spot.name||spot.shortName);
  if(!slot?.modelComplete){
   append("p","faro-map-summary",es?"Todavía no hay condiciones horarias completas para este spot.":"Hourly model values are not yet complete.");return;
  }
  const dir=x=>deg(x)?Math.round(x)+"°":"—";
  const row=append("div","faro-map-readings");
  const cards=[
   [es?" SWELL · DESDE":" SWELL · FROM",
    dir(slot.swellDirection)+" · "+(deg(slot.swellHeightM)?slot.swellHeightM.toFixed(1)+" m":"—"),
    es?"Período "+(deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s":"—"):"Period "+(deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s":"—")],
   [es?" VIENTO · DESDE":" WIND · FROM",
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
  const camera=(v.cameras||[]).find(cam=>cam.spotId===spot.id&&
   cam.viewerAccess==="public_youtube_no_account")||
   (v.cameras||[]).find(cam=>cam.spotId===spot.id&&
    cam.type==="surf_camera"&&cam.viewerAccess==="free_account_required");
  const shortcuts=append("div","faro-map-shortcuts");
  if(camera&&/^https:\/\//.test(camera.page)){
   const independent=camera.viewerAccess==="public_youtube_no_account";
   const view=append("a","faro-map-shortcut",independent?
    (es?" Ver Marejadas UV ":" View Marejadas UV "):
    (es?" Ver La Boca en Lineup ":" See La Boca on Lineup "),shortcuts);
   view.href=camera.page;view.target="_blank";view.rel="noopener noreferrer";
  }
  const note=append("button","faro-map-shortcut secondary",es?" Registrar olas observadas":" Log observed waves",shortcuts);
  note.type="button";note.addEventListener("click",()=>{
   const panel=document.getElementById("fieldNotesExpand");
   if(panel){panel.open=true;panel.scrollIntoView({block:"start",behavior:"smooth"})}
  });
  attr.textContent=es?
   "Puntos costeros de referencia, no picos exactos. Brújula: dirección DESDE. Mapa: dirección de viaje (+180°). No estima refracción ni altura rompiente.  OpenStreetMap contributors.":
   "Coastal reference points, not exact peaks. Compass shows FROM bearings; map shows travel (+180°). No refraction or breaking height.  OpenStreetMap contributors.";
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
  latest=data||p();describe();drawSchematic();
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
   const lat=latest.spot.latitude,lon=latest.spot.longitude;
   if(!opened){map.setView([lat,lon],13,{animate:false});opened=true}
   else map.setView([lat,lon],13,{animate:false});
  }
 }
 async function open(){
  if(loadError)return;
  if(map){map.invalidateSize({pan:false});update(p());return}
  brief.replaceChildren();append("p","faro-map-summary",p().lang==="en"?"Loading coastal map…":"Cargando mapa costero…");
  try{
   const L=await loadLeaflet();if(!d.open)return;
   schematic.remove();
   map=L.map(viewport,{scrollWheelZoom:false,zoomControl:true,attributionControl:true});
   L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
    maxZoom:15,minZoom:9,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
   }).addTo(map);
   map.setView([-32.918807,-71.512047],13);
   update(p());
   requestAnimationFrame(()=>map?.invalidateSize({pan:false}));
  }catch(err){
   loadError=true;
   if(!schematic.isConnected){viewport.replaceChildren(schematic)}
   drawSchematic();
   describe();
  }
 }
 d.addEventListener("toggle",()=>{if(d.open)void open();});
 update(p());
 if(d.open)void open();
 return {update,getMap:()=>map};
}
root.FaroChileCoastMap=Object.freeze({create,bearingFromArrow,stateLabel});
if(typeof module!=="undefined"&&module.exports)module.exports=root.FaroChileCoastMap;
})(typeof window!=="undefined"?window:globalThis);
