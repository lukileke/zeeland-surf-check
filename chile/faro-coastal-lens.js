/* FARO Coastal Lens V3 | model-input explanation, not breaking-wave physics.
   Compass arrows START at reported FROM azimuth and point toward centre.
   Never infer onshore/offshore solely from a guide angle or a map pin. */
(function(root){"use strict";
 const finite=x=>typeof x==="number"&&Number.isFinite(x);
 const azimuth=x=>finite(x)?((x%360)+360)%360:null;
 const cardinal=x=>{const a=azimuth(x);return a===null?"—":["N","NE","E","SE","S","SW","W","NW"][Math.round(a/45)%8]};
 function reading(slot,local,lang="es"){
  const es=lang!=="en",s=slot||{};
  const dir=x=>finite(x)?Math.round(azimuth(x))+"° · "+cardinal(x):"—";
  if(!s.modelComplete)return {available:false,headline:es?"Sin ventana completa":"No complete window",
   explanation:es?"Selecciona una ventana con swell y viento disponibles.":"Choose a slot with complete swell and wind.",
   swellFrom:null,windFrom:null,primary:[],notes:[]};
  const swell=azimuth(s.swellDirection),wind=azimuth(s.windDirection);
  const period=s.swellPeriodS,height=s.swellHeightM,windSpeed=s.windKmh;
  const decision=local?.decision;
  const periodState=finite(period)?period<7?"short":period<10?"mid":"long":"unknown";
  const windState=finite(windSpeed)?windSpeed>=30?"strong":windSpeed>=20?"breezy":"light":"unknown";
  const guideState=local?.swell?.state||"unknown";
  const windGuide=local?.wind?.state||"unknown";
  const pulse=periodState==="short"?(es?"Pulso corto":"Short-period pulse"):
   periodState==="mid"?(es?"Pulso intermedio":"Medium-period pulse"):
   periodState==="long"?(es?"Período largo":"Long-period swell"):(es?"Período desconocido":"Unknown period");
  const surface=windState==="strong"?(es?"Viento fuerte":"Strong wind"):
   windState==="breezy"?(es?"Viento moderado":"Moderate wind"):
   windState==="light"?(es?"Viento relativamente suave":"Relatively light wind"):(es?"Viento sin evaluar":"Wind unknown");
  const fit=guideState==="convergent"?(es?"Dirección respaldada por guías":"Direction fits guides"):
   guideState==="disputed"?(es?"Guías no coinciden":"Guides disagree"):
   guideState==="outside"?(es?"Dirección fuera de referencias":"Outside guide ranges"):
   (es?"Dirección no evaluada":"Direction not assessed");
  const caution=decision?.id==="hazard"||decision?.id==="caution"||decision?.id==="unassessed";
  const headline=decision?.verdict||(es?"Lectura del pulso":"Swell read");
  const explanation=caution?decision.reason:
   periodState==="short"?(es?"La altura total puede verse grande, pero el swell principal tiene poco período. No es suficiente para esperar paredes consistentes.":
    "Total wave height can look large, but the primary swell has a short period. Do not assume consistent surf walls."):
   windState==="strong"?(es?"El viento es el limitante de esta franja. Busca una ventana con menos viento antes de priorizar el viaje.":
    "Wind is the limiting factor. Look for a calmer hour before prioritising the trip."):
   guideState==="disputed"?(es?"La dirección puede servir, pero las guías locales difieren. Revisa el spot y contrasta visualmente antes de decidir.":
    "The bearing may work, but local guides differ. Check visual evidence before choosing."):
   (decision?.reason||(es?"Swell, viento y período comparados para esta ventana.":"Swell, wind and period compared for this window."));
  const label=n=>finite(n)?n.toFixed(1):"—";
  const notes=[
   {title:es?"Swell principal · DESDE":"Primary swell · FROM",value:dir(s.swellDirection),
    detail:label(height)+" m · "+(finite(period)?period.toFixed(0)+" s":"—"),
    kind:"swell"},
   {title:es?"Viento · DESDE":"Wind · FROM",value:dir(s.windDirection),
    detail:(finite(windSpeed)?Math.round(windSpeed)+" km/h":"—")+
     (finite(s.gustKmh)?" · "+(es?"rachas ":"gusts ")+Math.round(s.gustKmh):""),
    kind:"wind"}
  ];
  return {available:true,swellFrom:swell,windFrom:wind,headline,explanation,
   primary:[pulse,surface,fit],notes,
   guideState,windGuide,
   preview:es?"La brújula muestra DESDE dónde llega el swell y el viento; las flechas apuntan al centro.":
    "Compass bearings indicate where swell and wind COME FROM; the pointers lead to the centre.",
   modelScope:es?"Coordenadas costeras orientativas, no simulación de refracción sobre los bancos.":
    "Coastal reference points, not modelled refraction over the sandbanks."};
 }
 const NS="http://www.w3.org/2000/svg";
 function compass(read,lang="es"){
  const svg=document.createElementNS(NS,"svg");
  svg.setAttribute("viewBox","0 0 240 240");
  svg.setAttribute("class","faro-lens-compass-svg");svg.setAttribute("role","img");
  svg.setAttribute("aria-label",lang==="en"?
   "Swell and wind incoming bearings shown on a compass":"Brújula con direcciones de procedencia del swell y el viento");
  function node(tag,attrs={},text){const n=document.createElementNS(NS,tag);
   for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));
   if(text!==undefined)n.textContent=text;svg.append(n);return n}
  node("circle",{cx:120,cy:120,r:100,fill:"none",stroke:"currentColor","stroke-opacity":".15","stroke-width":1});
  node("circle",{cx:120,cy:120,r:76,fill:"none",stroke:"currentColor","stroke-opacity":".25","stroke-width":1,"stroke-dasharray":"2 6"});
  node("circle",{cx:120,cy:120,r:55,fill:"none",stroke:"currentColor","stroke-opacity":".12","stroke-width":1});
  for(let a=0;a<360;a+=15){const theta=a*Math.PI/180,s=a%45===0?95:98,e=104;
   node("line",{x1:120+Math.sin(theta)*s,y1:120-Math.cos(theta)*s,
    x2:120+Math.sin(theta)*e,y2:120-Math.cos(theta)*e,
    stroke:"currentColor","stroke-opacity":a%45===0?".6":".22","stroke-width":a%45===0?1.7:1})}
  for(const [name,x,y]of [["N",120,14],["E",227,124],["S",120,236],["W",13,124]]){
   node("text",{x,y,"text-anchor":"middle",fill:"currentColor","font-size":13,"font-weight":900,
    "font-family":"Manrope, sans-serif"},name);
  }
  function fromArrow(degrees,color,outer){
   if(!finite(degrees))return;
   const r=degrees*Math.PI/180,s=120+Math.sin(r)*outer,t=120-Math.cos(r)*outer;
   const end=120+Math.sin(r)*27,endy=120-Math.cos(r)*27;
   node("path",{d:`M ${s.toFixed(2)} ${t.toFixed(2)} L ${end.toFixed(2)} ${endy.toFixed(2)}`,
    stroke:color,"stroke-width":6,"stroke-linecap":"round",fill:"none"});
   const bx=end+Math.sin(r)*13,by=endy-Math.cos(r)*13;
   const perpX=Math.cos(r)*8,perpY=Math.sin(r)*8;
   node("polygon",{points:`${end},${endy} ${bx+perpX},${by+perpY} ${bx-perpX},${by-perpY}`,fill:color});
   node("circle",{cx:s,cy:t,r:5,fill:color,stroke:"#fff","stroke-width":2});
  }
  fromArrow(read.swellFrom,"#2088c5",90);
  fromArrow(read.windFrom,"#e5a43d",65);
  node("circle",{cx:120,cy:120,r:16,fill:"#183841",stroke:"#fff","stroke-width":2});
  node("text",{x:120,y:124,"text-anchor":"middle",fill:"#fff","font-size":10,"font-weight":900},"F");
  return svg;
 }
 root.FaroChileCoastalLens=Object.freeze({reading,compass,cardinal,azimuth});
 if(typeof module!=="undefined"&&module.exports)module.exports=root.FaroChileCoastalLens;
})(typeof window!=="undefined"?window:globalThis);
