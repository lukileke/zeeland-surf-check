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
function bearingFromArrow(value){return deg(value)?(((value+180)%360)+360)%360:null}
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
 let map=null,markers=new Map(),modelGridMarker=null,windGridMarker=null,opened=false,latest=null,loadError=false;
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
  // Geographical relative positions; dynamic extent includes Maitencillo and the grid cell.
  const grid=current.marineGrid,atmosphere=current.weatherGrid;
  const locations=spots
   .concat(deg(grid?.lat)&&deg(grid?.lon)?[{latitude:grid.lat,longitude:grid.lon}]:[])
   .concat(deg(atmosphere?.lat)&&deg(atmosphere?.lon)?[{latitude:atmosphere.lat,longitude:atmosphere.lon}]:[]);
  const latMin=Math.min(...locations.map(x=>x.latitude)),latMax=Math.max(...locations.map(x=>x.latitude));
  const lonMin=Math.min(...locations.map(x=>x.longitude)),lonMax=Math.max(...locations.map(x=>x.longitude));
  const dy=Math.max(.10,latMax-latMin),dx=Math.max(.10,lonMax-lonMin);
  const project=sp=>({x:80+((sp.longitude-lonMin)/dx)*450,
                      y:300-((sp.latitude-latMin)/dy)*225});
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
  if(deg(grid?.lat)&&deg(grid?.lon)){
   const q=project({latitude:grid.lat,longitude:grid.lon});
   shape("circle",{cx:q.x,cy:q.y,r:7,fill:"#137d9f",stroke:"#fff","stroke-width":2});
   if(deg(current.slot?.swellDirection))ray(q.x,q.y,current.slot.swellDirection,"#137d9f",0);
   if(deg(current.slot?.secondarySwell?.fromDeg))ray(q.x,q.y,current.slot.secondarySwell.fromDeg,"#8384b8",-7);
   if(deg(current.slot?.tertiarySwell?.fromDeg))ray(q.x,q.y,current.slot.tertiarySwell.fromDeg,"#95a5b0",7);
   shape("text",{x:q.x+11,y:q.y-14,fill:"#235363","font-family":"sans-serif",
    "font-size":12,"font-weight":800,stroke:"#dceef1","stroke-width":3,"paint-order":"stroke"},
    es?"Celda del modelo":"Model grid cell");
  }
  if(deg(atmosphere?.lat)&&deg(atmosphere?.lon)){
   const q=project({latitude:atmosphere.lat,longitude:atmosphere.lon});
   shape("circle",{cx:q.x,cy:q.y,r:6,fill:"#ca8b4a",stroke:"#fff","stroke-width":2});
   if(deg(current.slot?.windDirection))ray(q.x,q.y,current.slot.windDirection,"#ba7628",0);
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
  if(slot?.date&&slot?.label)append("p","faro-map-grid-note",slot.date+" · "+slot.label+" · America/Santiago");
  if(!slot?.modelComplete){
   append("p","faro-map-summary",es?"Todavía no hay condiciones horarias completas para este spot.":"Hourly model values are not yet complete.");return;
  }
  const dir=x=>deg(x)?Math.round(x)+"°":"—";
  const row=append("div","faro-map-readings");
  const cards=[
   [es?"OLEAJE TOTAL · DESDE":"TOTAL WAVES · FROM",
    dir(slot.totalWaveDirection)+" · "+(deg(slot.totalWaveHeightM)?slot.totalWaveHeightM.toFixed(1)+" m":"—"),
    es?"Modelo mar abierto · no altura rompiente":"Offshore model · not breaking height"],
   [es?" SWELL · DESDE":" SWELL · FROM",
    dir(slot.swellDirection)+" · "+(deg(slot.swellHeightM)?slot.swellHeightM.toFixed(1)+" m":"—"),
    es?"Período "+(deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s":"—"):"Period "+(deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s":"—")],
   [es?" VIENTO · DESDE":" WIND · FROM",
    dir(slot.windDirection)+" · "+(deg(slot.windKmh)?slot.windKmh.toFixed(0)+" km/h":"—"),
    deg(slot.gustKmh)?(es?"Rachas ":"Gusts ")+slot.gustKmh.toFixed(0)+" km/h":""]
  ];
  if(deg(slot.secondarySwell?.heightM)&&deg(slot.secondarySwell?.fromDeg)){
   cards.push([es?"SWELL SECUNDARIO · DESDE":"SECONDARY SWELL · FROM",
    dir(slot.secondarySwell.fromDeg)+" · "+slot.secondarySwell.heightM.toFixed(1)+" m",
    (es?"Período ":"Period ")+(deg(slot.secondarySwell.periodS)?slot.secondarySwell.periodS.toFixed(0)+" s":"—")]);
  }
  if(deg(slot.tertiarySwell?.heightM)&&deg(slot.tertiarySwell?.fromDeg)){
   cards.push([es?"SWELL TERCIARIO · DESDE":"TERTIARY SWELL · FROM",
    dir(slot.tertiarySwell.fromDeg)+" · "+slot.tertiarySwell.heightM.toFixed(1)+" m",
    (es?"Período ":"Period ")+(deg(slot.tertiarySwell.periodS)?slot.tertiarySwell.periodS.toFixed(0)+" s":"—")]);
  }
  if(deg(slot.windSeaHeightM)&&deg(slot.windSeaDirection)){
   cards.push([es?"MAR DE VIENTO · DESDE":"WIND SEA · FROM",
    dir(slot.windSeaDirection)+" · "+slot.windSeaHeightM.toFixed(1)+" m",
    es?"Componente del modelo, no un swell adicional":"Model wind-wave component, not an extra swell"]);
  }
  for(const [label,value,meta]of cards){
   const c=append("div","faro-map-reading",null,row);append("small","",label,c);append("strong","",value,c);append("span","",meta,c);
  }
  const grid=v.marineGrid;
  if(deg(grid?.lat)&&deg(grid?.lon)){
   append("p","faro-map-grid-note",
    (es?"Celda marina del modelo: ":"Offshore model cell: ")+grid.lat.toFixed(3)+", "+grid.lon.toFixed(3)+
    (deg(grid.distanceKm)?" · "+grid.distanceKm.toFixed(1)+" km "+(es?"de la referencia costera":"from coastal reference"):""));
  }
  // Each arrow is a modelled component vector. Swell and atmospheric
  // samples may come from distinct geographic grid points.
  const legends=[
   ["var(--faro-primary-swell)",es?"Swell principal":"Primary swell",""],
   ...(deg(slot.secondarySwell?.fromDeg)?[["var(--faro-secondary-swell)",es?"Secundario":"Secondary","is-secondary"]]:[]),
   ...(deg(slot.tertiarySwell?.fromDeg)?[["var(--faro-tertiary-swell)",es?"Terciario":"Tertiary","is-tertiary"]]:[]),
   ["var(--faro-atmosphere)",es?"Viento":"Wind",""]
  ];
  const legend=append("div","faro-map-vector-legend");
  legend.setAttribute("aria-label",es?"Leyenda de componentes oceanográficos":"Oceanographic component legend");
  for(const [colour,label,variant]of legends){
   const t=append("span",variant,null,legend);
   const i=document.createElement("i");i.style.setProperty("--legend",colour);
   t.append(i,document.createTextNode(label));
  }
  const atmospheric=v.weatherGrid;
  append("p","faro-map-location-note",
    es?"Las flechas de swell nacen de la celda marina; el viento se muestra en su celda atmosférica si está disponible. No son rayos de refracción ni imágenes en directo.":
       "Swell vectors originate at the marine grid sample; wind is shown at its atmospheric sample when available. These are not refraction rays or live imagery.");
  if(deg(atmospheric?.distanceKm)){
   append("p","faro-map-grid-note",
    (es?"Viento · celda atmosférica a ":"Wind · atmospheric grid cell ")+atmospheric.distanceKm.toFixed(1)+
    (es?" km de la referencia costera":" km from coastal reference"));
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
    (es?" Ver Marejadas UV":" View Marejadas UV"):
    (es?" Ver La Boca en Lineup":" See La Boca on Lineup"),shortcuts);
   view.href=camera.page;view.target="_blank";view.rel="noopener noreferrer";
  }
  const note=append("button","faro-map-shortcut secondary",es?" Registrar olas observadas":" Log observed waves",shortcuts);
  note.type="button";note.addEventListener("click",()=>{
   const panel=document.getElementById("fieldNotesExpand");
   if(panel){panel.open=true;panel.scrollIntoView({block:"start",behavior:"smooth"})}
  });
  attr.textContent=es?
   "Puntos de referencia, no bancos exactos. El marcador de swell está en la celda oceánica real del modelo cuando se conoce. Flecha = rumbo de viaje (dirección DESDE +180°), no refracción ni altura rompiente. © OpenStreetMap contributors.":
   "Reference points, not exact surf banks. The swell marker is placed at the actual offshore model grid cell where known. Arrow = travel bearing (FROM +180°), not refraction or breaking height. © OpenStreetMap contributors.";
 }
 function markerIcon(L,spot,selected){
  // A named beach reference pin, not a wave-front observation.
  const base=document.createElement("div");
  base.className=selected?"faro-map-pin is-current":"faro-map-pin";
  const name=document.createElement("span");name.className="faro-map-pin-name";
  name.textContent=spot.shortName||spot.name;base.append(name);
  return L.divIcon({className:"faro-leaflet-marker",html:base.outerHTML,
   iconSize:[112,36],iconAnchor:[56,18]});
 }
 function vectorSvg(slot){
  const ns="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 132 132");
  svg.classList.add("faro-map-vector-rose");svg.setAttribute("role","img");
  svg.setAttribute("aria-label","Offshore swell component travel directions, referenced to true north");
  const node=(tag,attrs,parent=svg)=>{
   const e=document.createElementNS(ns,tag);
   for(const [k,v]of Object.entries(attrs))e.setAttribute(k,String(v));
   parent.append(e);return e;
  };
  node("circle",{cx:66,cy:66,r:51,fill:"#f7ffff",stroke:"#b4d3d6","stroke-width":1});
  node("circle",{cx:66,cy:66,r:35,fill:"none",stroke:"#b4d3d6","stroke-width":1,"stroke-dasharray":"3 5"});
  for(const degVal of [0,90,180,270]){
   const radians=degVal*Math.PI/180;
   node("circle",{cx:66+Math.sin(radians)*51,cy:66-Math.cos(radians)*51,r:2,fill:"#87aeb1"});
  }
  const N=node("text",{x:66,y:10,"text-anchor":"middle",fill:"#32666f","font-size":10,"font-weight":850});N.textContent="N";
  const vectors=[
   {deg:slot?.swellDirection,colour:"#2b94b8",width:4.5,extent:45,offset:0},
   {deg:slot?.secondarySwell?.fromDeg,colour:"#8384b8",width:3,extent:36,offset:-6,dash:"3 4"},
   {deg:slot?.tertiarySwell?.fromDeg,colour:"#95a5b0",width:2,extent:29,offset:6,dash:"2 5"}
  ];
  for(const v of vectors){
   const bearing=bearingFromArrow(v.deg);if(bearing===null)continue;
   const g=node("g",{transform:"translate(66 66) rotate("+bearing+")"});
   const line=node("line",{x1:v.offset,y1:8,x2:v.offset,y2:-v.extent,
    stroke:v.colour,"stroke-width":v.width,"stroke-linecap":"round"},g);
   if(v.dash)line.setAttribute("stroke-dasharray",v.dash);
   node("path",{d:"M "+(v.offset-5)+" "+(-v.extent+9)+" L "+v.offset+" "+(-v.extent-1)+
    " L "+(v.offset+5)+" "+(-v.extent+9),fill:"none",
    stroke:v.colour,"stroke-width":v.width,"stroke-linejoin":"round","stroke-linecap":"round"},g);
  }
  node("circle",{cx:66,cy:66,r:5,fill:"#275e68",stroke:"#fff","stroke-width":2});
  return svg;
 }
 function modelGridIcon(L,slot,lang){
  const es=lang!=="en",wrap=document.createElement("div");
  wrap.className="faro-map-vector-panel";
  wrap.append(vectorSvg(slot));
  const label=document.createElement("span");label.className="faro-map-vector-caption";
  const h=deg(slot?.swellHeightM)?slot.swellHeightM.toFixed(1)+" m":"—";
  const period=deg(slot?.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s":"—";
  label.textContent=(es?"SWELL · ":"SWELL · ")+h+" · "+period;
  wrap.append(label);
  return L.divIcon({className:"faro-map-grid-marker",html:wrap.outerHTML,
   iconSize:[154,151],iconAnchor:[66,66]});
 }
 function windGridIcon(L,slot,lang){
  const es=lang!=="en",wrap=document.createElement("div");
  wrap.className="faro-map-wind-chip";
  const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");
  const bearing=bearingFromArrow(slot?.windDirection);
  if(bearing!==null){
   const g=document.createElementNS(ns,"g");
   g.setAttribute("transform","rotate("+bearing+" 12 12)");
   const line=document.createElementNS(ns,"path");
   line.setAttribute("d","M12 20 V4 M7 9 L12 4 L17 9");
   line.setAttribute("fill","none");line.setAttribute("stroke","#9a642f");
   line.setAttribute("stroke-width","2.2");line.setAttribute("stroke-linecap","round");
   line.setAttribute("stroke-linejoin","round");g.append(line);svg.append(g);
  }
  wrap.append(svg);
  const info=document.createElement("div");
  const title=document.createElement("strong");title.textContent=es?"VIENTO · MODELO":"WIND · MODEL";
  const body=document.createElement("small");
  body.textContent=(deg(slot?.windKmh)?slot.windKmh.toFixed(0)+" km/h":"—")+" · "+
    (es?"desde ":"from ")+(deg(slot?.windDirection)?Math.round(slot.windDirection)+"°":"—");
  info.append(title,body);wrap.append(info);
  return L.divIcon({className:"faro-map-wind-marker",html:wrap.outerHTML,
   iconSize:[155,46],iconAnchor:[12,34]});
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
   markers.get(sp.id).setIcon(markerIcon(L,sp,sp.id===sel));
   markers.get(sp.id).setZIndexOffset(sp.id===sel?150:0);
  }
  const grid=latest.marineGrid;
  const hasGrid=deg(grid?.lat)&&deg(grid?.lon);
  if(hasGrid){
   const pos=[grid.lat,grid.lon];
   if(!modelGridMarker){
    modelGridMarker=L.marker(pos,{title:"Offshore marine model grid point",interactive:false,keyboard:false});
    modelGridMarker.addTo(map);
   }else modelGridMarker.setLatLng(pos);
   modelGridMarker.setIcon(modelGridIcon(L,latest.slot,latest.lang));
   modelGridMarker.setZIndexOffset(250);
  }else if(modelGridMarker){
   map.removeLayer(modelGridMarker);modelGridMarker=null;
  }
  const atmosphere=latest.weatherGrid;
  const hasWindGrid=deg(atmosphere?.lat)&&deg(atmosphere?.lon)&&deg(latest.slot?.windDirection);
  if(hasWindGrid){
   const pos=[atmosphere.lat,atmosphere.lon];
   if(!windGridMarker){
    windGridMarker=L.marker(pos,{title:"Atmospheric model grid point",interactive:false,keyboard:false});
    windGridMarker.addTo(map);
   }else windGridMarker.setLatLng(pos);
   windGridMarker.setIcon(windGridIcon(L,latest.slot,latest.lang));
   windGridMarker.setZIndexOffset(260);
  }else if(windGridMarker){
   map.removeLayer(windGridMarker);windGridMarker=null;
  }
  if(latest.spot&&deg(latest.spot.latitude)&&deg(latest.spot.longitude)){
   const coast=[latest.spot.latitude,latest.spot.longitude];
   // Display both actual model sample and documented beach reference if nearby.
   if(hasGrid&&deg(grid.distanceKm)&&grid.distanceKm<=25){
    const bounds=L.latLngBounds(coast,[grid.lat,grid.lon]);
    if(hasWindGrid&&deg(atmosphere.distanceKm)&&atmosphere.distanceKm<=25)
     bounds.extend([atmosphere.lat,atmosphere.lon]);
    map.fitBounds(bounds,{padding:[85,90],maxZoom:12,animate:false});
   }else map.setView(coast,13,{animate:false});
   opened=true;
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
