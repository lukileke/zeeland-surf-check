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
 let mode="combined",exposure=false,motion=false,inspected="marine",lastCentered=null;
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
 const flags=document.createElement("div");flags.className="faro-lens-flags";controls.append(flags);
 function flag(type,onChange){
  const label=document.createElement("label");label.className="faro-lens-flag";
  const input=document.createElement("input");input.type="checkbox";
  const caption=document.createElement("span");label.append(input,caption);flags.append(label);
  input.addEventListener("change",()=>onChange(input.checked));return {input,caption};
 }
 const exposureFlag=flag("exposure",x=>{exposure=x;update(latest)});
 const motionFlag=flag("motion",x=>{motion=x&&!reduced();update(latest)});
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
   if(mode!=="wind"&&deg(current.slot?.swellDirection))ray(q.x,q.y,current.slot.swellDirection,"#137d9f",0);
   // Only the primary wave bearing appears on the overview.
   shape("text",{x:q.x+11,y:q.y-14,fill:"#235363","font-family":"sans-serif",
    "font-size":12,"font-weight":800,stroke:"#dceef1","stroke-width":3,"paint-order":"stroke"},
    es?"Celda del modelo":"Model grid cell");
  }
  if(deg(atmosphere?.lat)&&deg(atmosphere?.lon)){
   const q=project({latitude:atmosphere.lat,longitude:atmosphere.lon});
   shape("circle",{cx:q.x,cy:q.y,r:6,fill:"#ca8b4a",stroke:"#fff","stroke-width":2});
   if(mode!=="swell"&&deg(current.slot?.windDirection))ray(q.x,q.y,current.slot.windDirection,"#ba7628",0);
  }
  shape("rect",{x:28,y:351,width:11,height:6,rx:2,fill:"#137d9f"});
  shape("text",{x:46,y:358,fill:"#234c5c","font-family":"sans-serif","font-size":11},es?"Swell, viaje del modelo":"Swell model travel");
  shape("rect",{x:220,y:351,width:11,height:6,rx:2,fill:"#ba7628"});
  shape("text",{x:238,y:358,fill:"#234c5c","font-family":"sans-serif","font-size":11},es?"Viento, viaje del modelo":"Wind model travel");
 }
 function append(tag,cls,text,parent=brief){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent.append(n);return n}
 function describe(){
  const v=latest||p(),es=v.lang!=="en",spot=v.spot,slot=v.slot||{},local=v.local;
  brief.replaceChildren();
  details.replaceChildren();
  const header=append("div","faro-lens-read-heading",null,brief);
  append("strong","",es?"LECTURA DEL MAR":"OCEAN READ",header);
  append("span","",(spot?.shortName||"FARO")+" · "+(slot.label||""),header);
  const row=append("div","faro-lens-quick-metrics",null,brief);
  if(spot&&slot.modelComplete){
   for(const [key,label,value,sub,color] of [
     ["swell",es?"SWELL PRINCIPAL":"PRIMARY SWELL",
      deg(slot.swellHeightM)?slot.swellHeightM.toFixed(1)+" m":"—",
      (deg(slot.swellPeriodS)?slot.swellPeriodS.toFixed(0)+" s · ":"")+
       (es?"desde ":"from ")+(deg(slot.swellDirection)?Math.round(slot.swellDirection)+"°":"—"),"#147f9e"],
     ["wind",es?"VIENTO":"WIND",
      deg(slot.windKmh)?slot.windKmh.toFixed(0)+" km/h":"—",
      (es?"desde ":"from ")+(deg(slot.windDirection)?Math.round(slot.windDirection)+"°":"—"),"#b87932"]
   ]){
    const tile=append("div","faro-lens-quick-metric is-"+key,null,row);
    tile.style.setProperty("--signal",color);
    append("small","",label,tile);append("strong","",value,tile);append("span","",sub,tile);
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
  for(const [key,label] of Object.entries({combined:es?"Combinado":"Combined",swell:"Swell",wind:es?"Viento":"Wind"})){
   buttons[key].textContent=label;buttons[key].classList.toggle("active",key===mode);
   buttons[key].setAttribute("aria-pressed",String(key===mode));
  }
  exposureFlag.caption.textContent=es?"Orientación":"Exposure";
  motionFlag.caption.textContent=es?"Movimiento":"Motion";
  motionFlag.input.checked=motion;exposureFlag.input.checked=exposure;
  viewport.classList.toggle("faro-lens-motion",motion&&!reduced()&&deg(slot.swellDirection));
  // The compass is attached to viewport, NOT to the model sample map marker.
  // It therefore cannot vanish when a zoom/pan moves a marine grid outside view.
  compassDock.replaceChildren();
  const svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox","0 0 80 80");
  svg.setAttribute("aria-hidden","true");compassDock.append(svg);
  function shape(tag,attrs={},parent=svg){
   const node=document.createElementNS(NS,tag);
   for(const [k,val] of Object.entries(attrs))node.setAttribute(k,String(val));
   parent.append(node);return node;
  }
  shape("circle",{cx:40,cy:40,r:32,fill:"#f4faf9",stroke:"#a8c6c8"});
  shape("circle",{cx:40,cy:40,r:22,fill:"none",stroke:"#c0d8d9","stroke-dasharray":"2 4"});
  const north=shape("text",{x:40,y:12,"text-anchor":"middle","font-size":10,"font-weight":800,fill:"#315b62"});
  north.textContent="N";
  const ranges=v.profiles?.[v.spot?.id]?.waveFromDeg||[];
  if(exposure)for(const r of ranges.filter(r=>r.length===2&&r.every(deg))){
   let [a,b]=r;const width=((b-a+360)%360)||360,steps=Math.ceil(width/8);
   const points=[[40,40]];
   for(let i=0;i<=steps;i++){
    const angle=(a+(i/steps)*width)*Math.PI/180;
    points.push([40+30*Math.sin(angle),40-30*Math.cos(angle)]);
   }
   shape("polygon",{points:points.map(pair=>pair.join(",")).join(" "),fill:"#55aab3","fill-opacity":.23});
  }
  const needle=(bearing,col,thickness)=>{
   const direction=bearingFromArrow(bearing);
   if(direction===null)return;
   const g=shape("g",{transform:"rotate("+direction+" 40 40)"});
   shape("path",{d:"M40 54 V24 M35 30 L40 23 L45 30",fill:"none",stroke:col,
    "stroke-width":thickness,"stroke-linecap":"round","stroke-linejoin":"round"},g);
  };
  // One compass needle per view, never two crossing in the centre.
  if(mode==="wind")needle(slot.windDirection,"#b97730",3.5);
  else needle(slot.swellDirection,"#147c9d",3.5);
  shape("circle",{cx:40,cy:40,r:2.5,fill:"#244b52"});
  const caption=document.createElement("span");caption.className="faro-lens-compass-caption";
  caption.textContent=(es?"NORTE · ":"NORTH · ")+(v.spot?.shortName||"FARO");
  compassDock.append(caption);
  const windCaption=document.createElement("span");windCaption.className="faro-lens-compass-wind";
  windCaption.textContent=(es?"Viento ":"Wind ")+dir(slot.windDirection);
  compassDock.append(windCaption);
  compassDock.setAttribute("aria-label",(es?"Brújula fija, swell desde ":"Fixed compass, swell from ")+dir(slot.swellDirection)+
   (es?", viento desde ":", wind from ")+dir(slot.windDirection));
  // Tiny legend below map, no floating cards blocking the coast.
  legend.replaceChildren();
  const entries=[];
  if(mode!=="wind"){
   entries.push(["#167fa0",es?"Swell principal":"Primary swell",false]);
   if(mode==="swell"&&deg(slot.secondarySwell?.fromDeg))entries.push(["#8384b8",es?"Secundario":"Secondary",true]);
   if(mode==="swell"&&deg(slot.tertiarySwell?.fromDeg))entries.push(["#95a5b0",es?"Terciario":"Tertiary",true]);
  }
  if(mode!=="swell")entries.push(["#ba7628",es?"Viento":"Wind",false]);
  for(const [color,label,dashed] of entries){
   const item=document.createElement("span");item.className="faro-lens-legend-key";
   const line=document.createElement("i");line.style.borderTop="3px "+(dashed?"dashed ":"solid ")+color;
   item.append(line,document.createTextNode(label));legend.append(item);
  }
  const extra=document.createElement("small");extra.textContent=es?
   "Rumbos del modelo · no refracción local":"Model bearings · not local refraction";
  legend.append(extra);
  const beachKey=document.createElement("span");beachKey.className="faro-lens-map-status";
  beachKey.textContent=es?"Puntos en playas = coincidencia angular de guía, no calidad":
   "Beach dots = guide bearing alignment, not surf quality";
  legend.append(beachKey);
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

 function markerIcon(L,spot,selected,guideStatus){
  // A named beach reference pin, not a wave-front observation.
  const base=document.createElement("div");
  base.className="faro-map-pin"+(selected?" is-current":"")+" guide-"+guideStatus;
  const dot=document.createElement("i");dot.className="faro-map-guide-dot";
  dot.setAttribute("aria-hidden","true");base.append(dot);
  const name=document.createElement("span");name.className="faro-map-pin-name";
  name.textContent=spot.shortName||spot.name;base.append(name);
  return L.divIcon({className:"faro-leaflet-marker",html:base.outerHTML,
   iconSize:[112,36],iconAnchor:[56,18]});
 }
 function modelGridIcon(L,slot){
  const shell=document.createElement("div");shell.className="faro-lens-map-pin is-swell";
  shell.append(document.createElement("b"));
  const arrow=document.createElement("span");arrow.className="faro-lens-arrow";arrow.textContent="↑";
  const bearing=bearingFromArrow(slot?.swellDirection);
  if(bearing!==null){
   arrow.style.transform="rotate("+bearing+"deg)";
   shell.style.setProperty("--lens-bearing",bearing+"deg");
  }
  shell.append(arrow);
  // Secondary and tertiary partitions remain in model details and popup.
  // Never draw intersecting arrows from the same model sample.
 if(mode==="swell"){
   // Compact model-component fan anchored at ONE marine sample location.
   // Dashed strokes indicate separate partitions, never refracted pathways.
   arrow.style.opacity="0";
   const svg=document.createElementNS(NS,"svg");
   svg.setAttribute("viewBox","0 0 82 82");svg.classList.add("faro-lens-partitions");
   const parts=[
    {from:slot?.swellDirection,color:"#147c9d",length:32,width:3.5,dash:null,offset:0},
    {from:slot?.secondarySwell?.fromDeg,color:"#8384b8",length:25,width:2.5,dash:"3 4",offset:-4},
    {from:slot?.tertiarySwell?.fromDeg,color:"#95a5b0",length:19,width:2,dash:"2 5",offset:4}
   ];
   for(const part of parts){
    const az=bearingFromArrow(part.from);if(az===null)continue;
    const g=document.createElementNS(NS,"g");g.setAttribute("transform","rotate("+az+" 41 41)");
    const line=document.createElementNS(NS,"line");
    for(const [k,v] of Object.entries({x1:41+part.offset,y1:41,x2:41+part.offset,y2:41-part.length,
      stroke:part.color,"stroke-width":part.width,"stroke-linecap":"round"}))line.setAttribute(k,String(v));
    if(part.dash)line.setAttribute("stroke-dasharray",part.dash);
    g.append(line);
    const head=document.createElementNS(NS,"path");head.setAttribute("d","M"+(36+part.offset)+" "+(46-part.length)+
      " L"+(41+part.offset)+" "+(40-part.length)+" L"+(46+part.offset)+" "+(46-part.length));
    head.setAttribute("fill","none");head.setAttribute("stroke",part.color);
    head.setAttribute("stroke-width",String(part.width));g.append(head);svg.append(g);
   }
   shell.append(svg);
  }
  return L.divIcon({className:"faro-map-grid-marker",html:shell.outerHTML,iconSize:[48,48],iconAnchor:[24,24]});
 }
 function windGridIcon(L,slot){
  const shell=document.createElement("div");shell.className="faro-lens-map-pin is-wind";
  shell.append(document.createElement("b"));
  const arrow=document.createElement("span");arrow.className="faro-lens-arrow";arrow.textContent="↑";
  const bearing=bearingFromArrow(slot?.windDirection);
  if(bearing!==null){
   arrow.style.transform="rotate("+bearing+"deg)";
   shell.style.setProperty("--lens-bearing",bearing+"deg");
  }
  shell.append(arrow);
  return L.divIcon({className:"faro-map-wind-marker",html:shell.outerHTML,iconSize:[44,44],iconAnchor:[22,22]});
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
 function update(data){
  latest=data||p();describe();drawSchematic();drawUi();
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
   const profile=latest.profiles?.[sp.id]||{};
   const status=mode==="wind"?guideClass(latest.slot?.windDirection,profile.windFromDeg):
    guideClass(latest.slot?.swellDirection,profile.waveFromDeg);
   markers.get(sp.id).setIcon(markerIcon(L,sp,sp.id===sel,status));
   markers.get(sp.id).setZIndexOffset(sp.id===sel?150:0);
  }
  const grid=latest.marineGrid;
  const hasGrid=deg(grid?.lat)&&deg(grid?.lon);
  if(hasGrid){
   const pos=[grid.lat,grid.lon];
   if(!modelGridMarker){
    modelGridMarker=L.marker(pos,{title:"Marine grid sample",interactive:true,keyboard:true});
    modelGridMarker.addTo(map);
   }else modelGridMarker.setLatLng(pos);
   modelGridMarker.setIcon(modelGridIcon(L,latest.slot));
   modelGridMarker.bindPopup(modelPopup(true),{maxWidth:300});
   modelGridMarker.setOpacity(mode==="wind"?0:1);
   if(modelGridMarker.getElement())modelGridMarker.getElement().style.pointerEvents=mode==="wind"?"none":"auto";
   modelGridMarker.setZIndexOffset(250);
  }else if(modelGridMarker){
   map.removeLayer(modelGridMarker);modelGridMarker=null;
  }
  const atmosphere=latest.weatherGrid;
  const hasWindGrid=deg(atmosphere?.lat)&&deg(atmosphere?.lon)&&deg(latest.slot?.windDirection);
  if(hasWindGrid){
   const pos=[atmosphere.lat,atmosphere.lon];
   if(!windGridMarker){
    windGridMarker=L.marker(pos,{title:"Atmospheric grid sample",interactive:true,keyboard:true});
    windGridMarker.addTo(map);
   }else windGridMarker.setLatLng(pos);
   windGridMarker.setIcon(windGridIcon(L,latest.slot));
   windGridMarker.bindPopup(modelPopup(false),{maxWidth:300});
   windGridMarker.setOpacity(mode==="swell"?0:1);
   if(windGridMarker.getElement())windGridMarker.getElement().style.pointerEvents=mode==="swell"?"none":"auto";
   windGridMarker.setZIndexOffset(260);
  }else if(windGridMarker){
   map.removeLayer(windGridMarker);windGridMarker=null;
  }
  if(latest.spot&&deg(latest.spot.latitude)&&deg(latest.spot.longitude)&&lastCentered!==latest.spot.id){
   lastCentered=latest.spot.id;
   const coast=[latest.spot.latitude,latest.spot.longitude];
   // Display both actual model sample and documented beach reference if nearby.
   if(hasGrid&&deg(grid.distanceKm)&&grid.distanceKm<=25){
    const bounds=L.latLngBounds(coast,[grid.lat,grid.lon]);
    if(hasWindGrid&&deg(atmosphere.distanceKm)&&atmosphere.distanceKm<=25)
     bounds.extend([atmosphere.lat,atmosphere.lon]);
    map.fitBounds(bounds,{padding:[85,90],maxZoom:12,animate:false});
   }else map.setView(coast,13,{animate:false});
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
 return {update,getMap:()=>map,setMode:x=>{if(buttons[x]){mode=x;update(latest)}},
  getState:()=>({mode,exposure,motion,lastCentered})};
}
root.FaroChileCoastMap=Object.freeze({create,bearingFromArrow,stateLabel,distanceToGuide,guideClass});
if(typeof module!=="undefined"&&module.exports)module.exports=root.FaroChileCoastMap;
})(typeof window!=="undefined"?window:globalThis);
