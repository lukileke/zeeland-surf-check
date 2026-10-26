// FARO Widget · Coastal Editorial v13 · legible model-first widgets · Scriptable iOS
// Scriptable > Edit Widget > Parameter:
//   BEST (default) · Domburg · Westkapelle · Oostkapelle · Cadzand · Brouwersdam
//   Domburg:Noordduine     (optional single spot)
//   BEST|ES or Domburg|ES  (optional Spanish)
// iOS controls refresh timing; figures are Open-Meteo MODEL forecasts, never live beach observations.
const SITE="https://lukileke.github.io/zeeland-surf-check/";
const KNMI="https://www.knmi.nl/nederland-nu/weer/waarschuwingen/zeeland";
const TZ="Europe/Amsterdam";
const SPOTS=[
 ["Domburg","Noordduine",51.566,3.489,325,0],
 ["Domburg","Central beach",51.564,3.496,325,0],
 ["Domburg","West sector",51.566,3.476,325,0],
 ["Westkapelle","North beach",51.540,3.435,305,1],
 ["Westkapelle","Central area",51.528,3.437,290,1],
 ["Oostkapelle","Main beach",51.585,3.547,330,2],
 ["Oostkapelle","West sector",51.579,3.528,330,2],
 ["Cadzand","Cadzand-Bad",51.378,3.382,315,3],
 ["Cadzand","West sector",51.382,3.365,315,3],
 ["Brouwersdam","North beach",51.765,3.856,300,4],
 ["Brouwersdam","Central beach",51.755,3.850,300,4],
 ["Brouwersdam","South beach",51.742,3.837,300,4]
];
// FARO web's source of truth for the numbers is surf-engine.js.
// Spot coordinates and daylight cutoffs match index.html as of October 2026.
const nowMs=Date.now();
// Scriptable parameters: BEST|ES|STYLE=FLOW|THEME=AUTO
// STYLE=FLOW, MINIMAL, DATA, WEEK  · THEME=AUTO, LIGHT, DARK
// SIZE=SMALL/MEDIUM/LARGE controls in-app preview, never the real widget size.
const param=String((typeof args!=="undefined"&&args.widgetParameter)||"BEST").trim();
const tokens=param.split("|").map(v=>v.trim()).filter(Boolean);
const opt=k=>{const v=tokens.find(t=>t.toUpperCase().startsWith(k+"="));return v?v.slice(k.length+1).toUpperCase().trim():null};
const LANG=opt("LANG")==="ES"||tokens.some(t=>t.toUpperCase()==="ES")?"es":"en";
const STYLE=["FLOW","MINIMAL","DATA","WEEK"].includes(opt("STYLE"))?opt("STYLE"):
 (tokens.find(t=>["FLOW","MINIMAL","DATA","WEEK"].includes(t.toUpperCase()))||"FLOW").toUpperCase();
const THEME=["AUTO","LIGHT","DARK"].includes(opt("THEME"))?opt("THEME"):"DARK";
// AUTO deliberately uses a dark coastal widget, avoiding an artificial logo capsule.
// Scriptable cannot inspect system light/dark appearance from a widget reliably.
const EFFECTIVE_THEME=THEME==="AUTO"?"DARK":THEME;
const PREVIEW=["SMALL","MEDIUM","LARGE"].includes(opt("SIZE"))?opt("SIZE").toLowerCase():null;
const requestTarget=tokens.find(t=>!/^(ES|EN|FLOW|MINIMAL|DATA|WEEK)$/i.test(t)&&!t.includes("="))||"BEST";
const isBest=requestTarget.toUpperCase()==="BEST";
const targetParts=requestTarget.split(":").map(t=>t.trim());
let chosen=SPOTS.filter(x=>isBest||x[0].toLowerCase()===targetParts[0].toLowerCase());
if(targetParts.length>1)chosen=chosen.filter(x=>x[1].toLowerCase()===targetParts[1].toLowerCase());
const invalidTarget=!chosen.length;
if(invalidTarget)chosen=SPOTS.slice();
const detectedFamily=(typeof config!=="undefined"&&config.widgetFamily)||"medium";
const family=(typeof config!=="undefined"&&config.runsInApp&&PREVIEW)?PREVIEW:detectedFamily;
const lockFamily=family.startsWith("accessory");
const fm=FileManager.local();
const enginePath=fm.joinPath(fm.cacheDirectory(),"faro-widget-engine-v5.js");
const cacheName=isBest?"all":chosen.map(x=>x[0]+"-"+x[1]).join("_").replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,80);
const dataPath=fm.joinPath(fm.cacheDirectory(),"faro-widget-data-v4-"+cacheName+".json");
function palette(light,dark){return EFFECTIVE_THEME==="LIGHT"?new Color(light):new Color(dark)}
const C={
 bg:palette("#F7FAFA","#102427"),ink:palette("#1F3B3D","#F3F8F7"),
 quiet:palette("#526A74","#BBCBCD"),sun:new Color("#FFDA71"),
 wave:palette("#355BAF","#A5BAFF"),line:palette("#C9D8DA","#507074"),
 panel:palette("#FFFFFF","#234347"),subtle:palette("#EFF5F5","#193337"),
 alert:palette("#D85B48","#FF9A87"),caution:palette("#CE762E","#EFBC62")
};
/* Official FARO artwork copied byte-for-byte from:
 * assets/faro-logo.svg and assets/faro-logo-dark.svg (same repository).
 * The SVG is rasterised once at high resolution via WebView, then cached
 * locally as PNG. This retains the ORIGINAL custom FARO type and rescue ring.
 * AUTO uses the complete dark coastal theme and the transparent original
 * white-and-yellow SVG, with NO pill, plate or synthetic backing.
 * LIGHT and DARK are explicit themes; dynamic appearance detection is
 * unsupported inside Scriptable widgets.
 */
const ORIGINAL_FARO_SVG={"light":"<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 128.81 43.63\" role=\"img\" aria-label=\"FARO\"><circle fill=\"#ffda71\" cx=\"108.11\" cy=\"22.27\" r=\"12.65\"/><g fill=\"#1f3b3d\"><path d=\"M5.62,7.08c0-.3.08-.54.25-.71.16-.17.36-.27.59-.28h20.58c.33,0,.58.09.74.28.17.19.25.44.25.75v5.32c0,.24-.09.48-.26.7-.17.22-.42.33-.75.33h-13.07v6.67h9.65c.27,0,.5.08.69.23.19.15.28.39.28.72v5.14c0,.24-.08.48-.25.7-.17.22-.39.33-.68.33h-9.7v9.85c0,.62-.33.92-.99.92h-6.56c-.52-.07-.77-.37-.77-.9V7.08Z\"/><path d=\"M39.12,6.93c.01-.09.06-.18.14-.28.08-.1.18-.19.29-.28s.24-.15.37-.2.25-.08.37-.08h5.5c.24,0,.45.08.62.23.17.15.3.28.39.4l.54,1.23,11.29,29.11c.11.29.09.52-.06.7-.16.18-.43.27-.82.27h-6.17c-.33,0-.58-.06-.76-.18s-.32-.33-.42-.61c-.29-.73-.57-1.46-.84-2.18s-.54-1.45-.82-2.18h-11.42c-.27.73-.55,1.46-.83,2.18-.28.72-.56,1.45-.83,2.18-.19.53-.55.8-1.1.8h-6.34c-.27,0-.5-.07-.68-.21-.18-.14-.21-.36-.1-.65l11.67-30.23ZM43.03,16.13c-.27.73-.55,1.52-.83,2.37-.28.85-.56,1.7-.83,2.56-.27.86-.55,1.71-.83,2.55-.28.84-.56,1.62-.83,2.35h6.6l-3.29-9.83Z\"/><path d=\"M62.94,7.08c0-.3.08-.54.24-.72.16-.18.39-.27.71-.27h13.89c1.48,0,2.86.28,4.15.83,1.29.55,2.42,1.3,3.38,2.25.96.95,1.72,2.05,2.27,3.32.55,1.27.83,2.62.83,4.05,0,.98-.13,1.9-.4,2.78-.27.88-.63,1.71-1.11,2.47-.47.77-1.04,1.46-1.69,2.09s-1.37,1.16-2.14,1.6l5.53,10.41c.1.2.23.44.39.71.16.27.24.51.24.71,0,.23-.08.41-.23.53s-.35.18-.61.18h-7.37c-.24,0-.46-.07-.66-.21s-.32-.34-.38-.58l-5.22-9.83h-3.48v9.7c0,.62-.33.92-.99.92h-6.39c-.29,0-.52-.08-.69-.23-.17-.15-.26-.38-.26-.7V7.08ZM79.77,16.63c0-.43-.08-.86-.24-1.29-.16-.43-.38-.82-.67-1.18-.29-.36-.63-.66-1.03-.9-.4-.24-.85-.4-1.33-.47-.4-.03-.78-.05-1.13-.08-.35-.02-.73-.03-1.15-.03h-2.97v7.89h3.96c.26,0,.49,0,.69-.02.2-.01.42-.04.67-.06.5-.06.95-.2,1.35-.44.4-.24.74-.53,1.01-.88.27-.35.48-.75.62-1.18.14-.44.21-.88.21-1.34Z\"/><path d=\"M99.98,22.07c0-.39.02-.76.07-1.14.03-.27-.13-.53-.4-.6l-6.99-1.85c-.31-.08-.63.11-.69.42-.2,1.03-.31,2.09-.31,3.18,0,1.22.13,2.41.38,3.55.07.31.38.49.69.41l6.97-1.84c.28-.07.44-.35.4-.63-.08-.49-.12-.99-.12-1.51Z\"/><path d=\"M116.24,22.07c0,.52-.04,1.02-.12,1.51-.05.28.12.56.4.63l6.97,1.84c.3.08.62-.1.69-.41.26-1.14.39-2.33.39-3.55,0-1.09-.11-2.15-.32-3.18-.06-.31-.38-.5-.69-.42l-6.99,1.85c-.27.07-.43.33-.4.6.04.37.07.75.07,1.14Z\"/><path d=\"M104.83,14.2c.99-.44,2.08-.67,3.26-.67s2.28.22,3.27.67c.82.36,1.54.84,2.17,1.43.24.22.59.27.86.09l5.65-3.6c.41-.26.47-.81.15-1.17-.15-.17-.31-.34-.47-.51-1-1-2.12-1.86-3.33-2.57s-2.53-1.26-3.94-1.66c-1.41-.39-2.86-.59-4.37-.59s-2.98.2-4.38.59-2.71.95-3.93,1.66c-1.22.71-2.33,1.57-3.32,2.57-.16.16-.32.33-.47.51-.32.36-.25.92.16,1.17l5.65,3.6c.27.17.62.13.86-.09.63-.59,1.35-1.06,2.16-1.43Z\"/><path d=\"M111.38,29.95c-.99.44-2.08.67-3.26.67s-2.28-.22-3.27-.67c-.82-.36-1.54-.84-2.17-1.43-.24-.22-.59-.27-.86-.09l-5.65,3.6c-.41.26-.47.81-.15,1.17.15.17.31.34.47.51,1,1,2.12,1.86,3.33,2.57s2.53,1.26,3.94,1.66c1.41.39,2.86.59,4.37.59s2.98-.2,4.38-.59,2.71-.95,3.93-1.66c1.22-.71,2.33-1.57,3.32-2.57.16-.16.32-.33.47-.51.32-.36.25-.92-.16-1.17l-5.65-3.6c-.27-.17-.62-.13-.86.09-.63.59-1.35,1.06-2.16,1.43Z\"/></g></svg>","dark":"<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\" viewBox=\"0 0 128.81 43.63\" role=\"img\" aria-label=\"FARO, versión para fondo oscuro\"><circle fill=\"#ffda71\" cx=\"108.11\" cy=\"22.27\" r=\"12.65\"/><g fill=\"#ffffff\"><path d=\"M5.62,7.08c0-.3.08-.54.25-.71.16-.17.36-.27.59-.28h20.58c.33,0,.58.09.74.28.17.19.25.44.25.75v5.32c0,.24-.09.48-.26.7-.17.22-.42.33-.75.33h-13.07v6.67h9.65c.27,0,.5.08.69.23.19.15.28.39.28.72v5.14c0,.24-.08.48-.25.7-.17.22-.39.33-.68.33h-9.7v9.85c0,.62-.33.92-.99.92h-6.56c-.52-.07-.77-.37-.77-.9V7.08Z\"/><path d=\"M39.12,6.93c.01-.09.06-.18.14-.28.08-.1.18-.19.29-.28s.24-.15.37-.2.25-.08.37-.08h5.5c.24,0,.45.08.62.23.17.15.3.28.39.4l.54,1.23,11.29,29.11c.11.29.09.52-.06.7-.16.18-.43.27-.82.27h-6.17c-.33,0-.58-.06-.76-.18s-.32-.33-.42-.61c-.29-.73-.57-1.46-.84-2.18s-.54-1.45-.82-2.18h-11.42c-.27.73-.55,1.46-.83,2.18-.28.72-.56,1.45-.83,2.18-.19.53-.55.8-1.1.8h-6.34c-.27,0-.5-.07-.68-.21-.18-.14-.21-.36-.1-.65l11.67-30.23ZM43.03,16.13c-.27.73-.55,1.52-.83,2.37-.28.85-.56,1.7-.83,2.56-.27.86-.55,1.71-.83,2.55-.28.84-.56,1.62-.83,2.35h6.6l-3.29-9.83Z\"/><path d=\"M62.94,7.08c0-.3.08-.54.24-.72.16-.18.39-.27.71-.27h13.89c1.48,0,2.86.28,4.15.83,1.29.55,2.42,1.3,3.38,2.25.96.95,1.72,2.05,2.27,3.32.55,1.27.83,2.62.83,4.05,0,.98-.13,1.9-.4,2.78-.27.88-.63,1.71-1.11,2.47-.47.77-1.04,1.46-1.69,2.09s-1.37,1.16-2.14,1.6l5.53,10.41c.1.2.23.44.39.71.16.27.24.51.24.71,0,.23-.08.41-.23.53s-.35.18-.61.18h-7.37c-.24,0-.46-.07-.66-.21s-.32-.34-.38-.58l-5.22-9.83h-3.48v9.7c0,.62-.33.92-.99.92h-6.39c-.29,0-.52-.08-.69-.23-.17-.15-.26-.38-.26-.7V7.08ZM79.77,16.63c0-.43-.08-.86-.24-1.29-.16-.43-.38-.82-.67-1.18-.29-.36-.63-.66-1.03-.9-.4-.24-.85-.4-1.33-.47-.4-.03-.78-.05-1.13-.08-.35-.02-.73-.03-1.15-.03h-2.97v7.89h3.96c.26,0,.49,0,.69-.02.2-.01.42-.04.67-.06.5-.06.95-.2,1.35-.44.4-.24.74-.53,1.01-.88.27-.35.48-.75.62-1.18.14-.44.21-.88.21-1.34Z\"/><path d=\"M99.98,22.07c0-.39.02-.76.07-1.14.03-.27-.13-.53-.4-.6l-6.99-1.85c-.31-.08-.63.11-.69.42-.2,1.03-.31,2.09-.31,3.18,0,1.22.13,2.41.38,3.55.07.31.38.49.69.41l6.97-1.84c.28-.07.44-.35.4-.63-.08-.49-.12-.99-.12-1.51Z\"/><path d=\"M116.24,22.07c0,.52-.04,1.02-.12,1.51-.05.28.12.56.4.63l6.97,1.84c.3.08.62-.1.69-.41.26-1.14.39-2.33.39-3.55,0-1.09-.11-2.15-.32-3.18-.06-.31-.38-.5-.69-.42l-6.99,1.85c-.27.07-.43.33-.4.6.04.37.07.75.07,1.14Z\"/><path d=\"M104.83,14.2c.99-.44,2.08-.67,3.26-.67s2.28.22,3.27.67c.82.36,1.54.84,2.17,1.43.24.22.59.27.86.09l5.65-3.6c.41-.26.47-.81.15-1.17-.15-.17-.31-.34-.47-.51-1-1-2.12-1.86-3.33-2.57s-2.53-1.26-3.94-1.66c-1.41-.39-2.86-.59-4.37-.59s-2.98.2-4.38.59-2.71.95-3.93,1.66c-1.22.71-2.33,1.57-3.32,2.57-.16.16-.32.33-.47.51-.32.36-.25.92.16,1.17l5.65,3.6c.27.17.62.13.86-.09.63-.59,1.35-1.06,2.16-1.43Z\"/><path d=\"M111.38,29.95c-.99.44-2.08.67-3.26.67s-2.28-.22-3.27-.67c-.82-.36-1.54-.84-2.17-1.43-.24-.22-.59-.27-.86-.09l-5.65,3.6c-.41.26-.47.81-.15,1.17.15.17.31.34.47.51,1,1,2.12,1.86,3.33,2.57s2.53,1.26,3.94,1.66c1.41.39,2.86.59,4.37.59s2.98-.2,4.38-.59,2.71-.95,3.93-1.66c1.22-.71,2.33-1.57,3.32-2.57.16-.16.32-.33.47-.51.32-.36.25-.92-.16-1.17l-5.65-3.6c-.27-.17-.62-.13-.86.09-.63.59-1.35,1.06-2.16,1.43Z\"/></g></svg>"};
const LOGO_MODE=EFFECTIVE_THEME==="LIGHT"?"light":"dark";
const LOGO_PATH=fm.joinPath(fm.cacheDirectory(),"faro-official-logo-"+LOGO_MODE+"-v1.png");
async function officialFaroLogo(){
 try{
  if(fm.fileExists(LOGO_PATH)){
   const cached=fm.readImage(LOGO_PATH);
   if(cached)return cached;
  }
 }catch(e){/* Corrupt cache: regenerate from the embedded original artwork. */}
 try{
  const svg=ORIGINAL_FARO_SVG[LOGO_MODE];
  const web=new WebView();
  await web.loadHTML("<!doctype html><html><head><meta name='viewport' content='width=device-width'></head><body></body></html>");
  const url="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  const js=`(function(){
    const canvas=document.createElement("canvas");
    canvas.width=516;canvas.height=175;
    const context=canvas.getContext("2d");
    const img=new Image();
    img.onload=()=>{
      context.clearRect(0,0,canvas.width,canvas.height);
      context.drawImage(img,0,0,canvas.width,canvas.height);
      completion(canvas.toDataURL("image/png"));
    };
    img.onerror=()=>completion(null);
    img.src=${JSON.stringify(url)};
  })();`;
  const pngURI=await web.evaluateJavaScript(js,true);
  if(typeof pngURI!=="string"||!pngURI.startsWith("data:image/png;base64,"))throw Error("SVG render unavailable");
  const image=Image.fromData(Data.fromBase64String(pngURI.split(",")[1]));
  if(!image)throw Error("Logo PNG invalid");
  try{fm.writeImage(LOGO_PATH,image)}catch(e){}
  return image;
 }catch(error){
  console.warn("FARO: official logo unavailable, preserving text fallback: "+String(error));
  return null;
 }
}
let ORIGINAL_FARO_IMAGE=null;
/* Match the five FARO numeric score bands across the site and widget. */
function scoreInk(v){
 if(v<2)return palette("#a94a33","#ef9b77");
 if(v<4)return palette("#91601d","#efbd6e");
 if(v<6)return palette("#79651b","#e0cc73");
 if(v<8)return palette("#4c712b","#b1d574");
 return palette("#2f6c43","#8cc584");
}
const widget=new ListWidget();
widget.backgroundColor=C.bg;
try{
 const grad=new LinearGradient();
 grad.colors=[palette("#FFFFFF","#102427"),palette("#EEF6F3","#1B3638")];
 grad.locations=[0,1];
 widget.backgroundGradient=grad;
}catch(e){/* Solid fallback is intentional for older Scriptable versions. */}
widget.url=SITE;
widget.setPadding(13,14,12,14);
function label(parent,value,size=12,color=C.ink,weight="regular",limit=1){
 const t=parent.addText(String(value));
 t.font=weight==="black"?Font.heavySystemFont(size):
  weight==="bold"?Font.boldSystemFont(size):
  weight==="semi"?Font.semiboldSystemFont(size):Font.systemFont(size);
 t.textColor=color;t.lineLimit=limit;t.minimumScaleFactor=.75;
 return t;
}
function hstack(parent,gap=0){const row=parent.addStack();row.layoutHorizontally();row.spacing=gap;return row;}
function vstack(parent,gap=0){const col=parent.addStack();col.layoutVertically();col.spacing=gap;return col;}
function thinLine(parent){const s=parent.addStack();s.size=new Size(0,1);s.backgroundColor=C.line;}
function localParts(date=new Date()){
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
 }).formatToParts(date);
 const x=Object.fromEntries(parts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
 return {date:x.year+"-"+x.month+"-"+x.day,minutes:+x.hour*60+(+x.minute)};
}
function timeMin(text){return +String(text).slice(11,13)*60+ +String(text).slice(14,16)}
function clockHour(h){return String(h).padStart(2,"0")}
function windowLabel(h){return clockHour(h)+"–"+clockHour(h+2);}
function round1(n){return Math.round(n*10)/10}
function gradeOf(n){return n>=8.5?"excellent":n>=7?"good":n>=5?"fair":n>=3?"poor":"veryPoor";}
const copy={
 en:{excellent:"Excellent",good:"Good",fair:"Fair",poor:"Poor",veryPoor:"Very poor",
  best:"BEST OF WEEK",spot:"SPOT OUTLOOK",model:"MODEL OUTLOOK · NOT LIVE",
  wave:"WAVE",wind:"WIND",period:"PERIOD",noDay:"No daylight window",
  offline:"Forecast unavailable",stale:"CACHED MODEL",
  risk:"MODEL WIND RISK",storm:"THUNDERSTORMS",check:"CHECK KNMI",
  today:"Today",tomorrow:"Tomorrow",updated:"Updated"},
 es:{excellent:"Excelente",good:"Bueno",fair:"Regular",poor:"Malo",veryPoor:"Muy malo",
  best:"LO MEJOR DE LA SEMANA",spot:"PRONÓSTICO DEL SPOT",model:"MODELO · NO EN DIRECTO",
  wave:"OLA",wind:"VIENTO",period:"PERÍODO",noDay:"Sin horario con luz",
  offline:"Pronóstico no disponible",stale:"MODELO EN CACHÉ",
  risk:"RIESGO POR VIENTO",storm:"TORMENTAS",check:"REVISAR KNMI",
  today:"Hoy",tomorrow:"Mañana",updated:"Actualizado"}
};
const T=copy[LANG];
const word=(es,en)=>LANG==="es"?es:en;
// Five visual quality bands; original SVG logo is kept separate from score colour.
async function json(url){
 const req=new Request(url);req.timeoutInterval=17;
 return await req.loadJSON();
}
function readCache(path){
 try{if(fm.fileExists(path))return JSON.parse(fm.readString(path))}catch(e){}
 return null;
}
async function engine(){
 let src=null;
 const exists=fm.fileExists(enginePath);
 const age=exists?nowMs-fm.modificationDate(enginePath).getTime():Infinity;
 if(exists&&age<6*3600000)src=fm.readString(enginePath);
 if(!src){
  try{
   const req=new Request(SITE+"surf-engine.js?v=2");
   req.timeoutInterval=12;src=await req.loadString();
   if(!src.includes("root.ZeelandEngine=")||src.length>30000)throw Error("Invalid shared engine");
   fm.writeString(enginePath,src);
  }catch(e){
   if(!exists)throw e;
   src=fm.readString(enginePath);
  }
 }
 // Trusted first-party static engine, cached locally for offline rendering.
 eval(src);
 if(!globalThis.ZeelandEngine||typeof globalThis.ZeelandEngine.evaluate!=="function")
  throw Error("Shared FARO score engine unavailable");
 return globalThis.ZeelandEngine;
}
function forecastUrls(spots){
 const coord=field=>encodeURIComponent(spots.map(s=>s[field]).join(","));
 const qs="latitude="+coord(2)+"&longitude="+coord(3)+
  "&timezone=Europe%2FAmsterdam&forecast_days=7";
 return [
  "https://marine-api.open-meteo.com/v1/marine?"+qs+
   "&hourly=wave_height,wave_direction,wave_period",
  "https://api.open-meteo.com/v1/forecast?"+qs+
   "&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code"+
   "&daily=sunrise,sunset"
 ];
}
async function fetchModel(spots){
 const cached=readCache(dataPath);
 const cacheAge=cached&&typeof cached.saved==="number"?nowMs-cached.saved:Infinity;
 if(cacheAge>=0&&cacheAge<24*60000&&cached.spotCount===spots.length)
  return {...cached,stale:false,fromCache:true};
 try{
  const [marineUrl,weatherUrl]=forecastUrls(spots);
  const [m,w]=await Promise.all([json(marineUrl),json(weatherUrl)]);
  const mm=Array.isArray(m)?m:[m],ww=Array.isArray(w)?w:[w];
  if(mm.length!==spots.length||ww.length!==spots.length)throw Error("Wrong API locations");
  if(mm.some((x,i)=>!x.hourly?.time?.length||!ww[i]?.hourly?.time?.length||!ww[i]?.daily?.time?.length))
   throw Error("Incomplete 7-day model response");
  const pack={marine:mm,weather:ww,saved:nowMs,spotCount:spots.length};
  fm.writeString(dataPath,JSON.stringify(pack));
  return {...pack,stale:false,fromCache:false};
 }catch(error){
  // Never present old model data indefinitely as though it were current.
  if(!cached||cacheAge<0||cacheAge>12*3600000||cached.spotCount!==spots.length)throw error;
  return {...cached,stale:true,fromCache:true};
 }
}
function candidateSessions(data,E,spots,now=localParts()){
 const out=[];
 for(let si=0;si<spots.length;si++){
  const spot=spots[si],m=data.marine[si].hourly,w=data.weather[si].hourly;
  const daily=data.weather[si].daily;
  const wi=new Map(w.time.map((t,i)=>[t,i]));
  const marineByTime=new Map(m.time.map((t,i)=>[t,i]));
  for(let di=0;di<Math.min(7,daily.time.length);di++){
   const day=daily.time[di],rise=timeMin(daily.sunrise[di])+15,set=timeMin(daily.sunset[di])-30;
   if(!Number.isFinite(rise)||!Number.isFinite(set))continue;
   for(let hour=6;hour<22;hour+=2){
    const start=Math.max(hour*60,rise),end=Math.min((hour+2)*60,set);
    if(end-start<40)continue;
    if(day<now.date||(day===now.date&&end-now.minutes<40))continue;
    const indexes=[day+"T"+clockHour(hour)+":00",day+"T"+clockHour(hour+1)+":00"];
    const samples=[];
    for(const t of indexes){
     const i=marineByTime.get(t),j=wi.get(t);
     if(i===undefined||j===undefined)break;
     const x={h:m.wave_height?.[i],period:m.wave_period?.[i],
      wd:m.wave_direction?.[i],wind:w.wind_speed_10m?.[j],
      dir:w.wind_direction_10m?.[j],gust:w.wind_gusts_10m?.[j],
      precip:w.precipitation?.[j],code:w.weather_code?.[j]};
     if([x.h,x.period,x.wd,x.wind,x.dir].some(v=>!Number.isFinite(v)))break;
     samples.push({...x,...E.evaluate(x,spot[4],spot[5])});
    }
    if(samples.length!==2)continue;
    const x=samples[1],score=round1((samples[0].v+samples[1].v)/2);
    out.push({spot,day,h:hour,score,x:{
     ...x,h:round1((samples[0].h+samples[1].h)/2),
     period:round1((samples[0].period+samples[1].period)/2),
     wind:Math.round((samples[0].wind+samples[1].wind)/2),
     gust:Math.max(...samples.map(a=>Number.isFinite(a.gust)?a.gust:0)),
     code:samples.some(a=>a.code>=95&&a.code<=99)?95:x.code
    }});
   }
  }
 }
 return out.sort((a,b)=>b.score-a.score);
}
function modelHazard(data,now=localParts()){
 const from=now.date+"T"+clockHour(Math.floor(now.minutes/60))+":00";
 const toDate=new Date(nowMs+48*3600000);
 const next=localParts(toDate);
 const to=next.date+"T"+clockHour(Math.floor(next.minutes/60))+":00";
 let gust=0,mean=0,thunder=false,hours=0;
 for(const row of data.weather){
  const h=row.hourly;
  for(let i=0;i<h.time.length;i++){
   if(h.time[i]<from||h.time[i]>to)continue;
   hours++;
   gust=Math.max(gust,Number.isFinite(h.wind_gusts_10m?.[i])?h.wind_gusts_10m[i]:0);
   mean=Math.max(mean,Number.isFinite(h.wind_speed_10m?.[i])?h.wind_speed_10m[i]:0);
   const code=h.weather_code?.[i];
   if(code>=95&&code<=99)thunder=true;
  }
 }
 if(!hours)return {level:"unknown"};
 const level=thunder||gust>=75||mean>=55?"danger":gust>=50||mean>=35?"caution":"low";
 return {level,gust:Math.round(gust),mean:Math.round(mean),thunder};
}
function dayLabel(day){
 const today=localParts().date;
 if(day===today)return T.today;
 const next=new Date(today+"T12:00:00Z");next.setUTCDate(next.getUTCDate()+1);
 if(day===next.toISOString().slice(0,10))return T.tomorrow;
 const dt=new Date(day+"T12:00:00Z");
 return new Intl.DateTimeFormat(LANG==="es"?"es-ES":"en-GB",{timeZone:TZ,weekday:"short",day:"numeric",month:"short"}).format(dt);
}
function locationLabel(best,brief=false){
 if(brief)return best.spot[0];
 const text=best.spot[0]+" · "+best.spot[1];
 return text;
}
function timestampLabel(epoch){return new Intl.DateTimeFormat(LANG==="es"?"es-ES":"en-GB",{
 timeZone:TZ,hour:"2-digit",minute:"2-digit",hour12:false
 }).format(new Date(epoch));}
// Editorial surf compositions, purpose-built per iOS widget family.
function accentLine(parent,width=66,height=4,tone=C.sun){
 const line=parent.addStack();
 line.size=new Size(width,height);
 line.backgroundColor=tone;line.cornerRadius=height/2;
 return line;
}
function glyph(parent,name,size=13,tint=C.wave){
 try{
  const sf=SFSymbol.named(name);
  if(!sf||!sf.image)throw Error("Symbol not found");
  const img=parent.addImage(sf.image);
  img.tintColor=tint;img.imageSize=new Size(size,size);
  return img;
 }catch(e){return label(parent,"≈",size,tint,"bold");}
}
function brandRow(parent,small=false){
 const row=hstack(parent,7);row.centerAlignContent();
 if(ORIGINAL_FARO_IMAGE){
  const picture=row.addImage(ORIGINAL_FARO_IMAGE);
  const h=small?22:27;
  picture.imageSize=new Size(Math.round(h*128.81/43.63),h);
  picture.resizable=true;
  picture.tintColor=null;
 }else{
  label(row,"FARO",small?17:20,C.ink,"black");
 }
 row.addSpacer();
 label(row,isBest?word("LO MEJOR · 7D","BEST · 7D"):"ZEELAND",small?8:9,C.quiet,"bold");
}
function scoreRow(parent,best,size){
 const row=hstack(parent,3);row.bottomAlignContent();
 label(row,best.score.toFixed(1),size,scoreInk(best.score),"black");
 label(row,"/10",Math.max(11,Math.floor(size*.28)),C.quiet,"semi");
}
function qualityStepInk(i){
 const light=["#F0A46D","#F0BF69","#E3D471","#B0DB75","#96C67A"];
 const dark=["#F0A46D","#F0BF69","#E3D471","#B0DB75","#96C67A"];
 return new Color((EFFECTIVE_THEME==="LIGHT"?light:dark)[i]||dark[4]);
}
function meter(parent,score,width=23,height=5,gap=5){
 const row=hstack(parent,gap);row.centerAlignContent();
 const active=Math.max(1,Math.min(5,Math.ceil(score/2)));
 for(let i=0;i<5;i++){
  const cell=row.addStack();
  cell.size=new Size(width,height);
  cell.cornerRadius=height/2;
  cell.backgroundColor=i<active?qualityStepInk(i):C.line;
 }
 return row;
}
function gradeRow(parent,best){
 const row=hstack(parent,6);row.centerAlignContent();
 label(row,T[gradeOf(best.score)].toUpperCase(),10,scoreInk(best.score),"bold");
 row.addSpacer();
 label(row,T.model.includes("·")?word("ESTIMACIÓN","MODEL"):"MODEL",8,C.quiet,"semi");
}
function localizedWave(ch,short=false){
 if(LANG!=="es")return ch.name;
 const names={
 "Wild & Windy":short?"WINDY":"WINDY · Viento fuerte",
 "Choppy & Messy":short?"CHOPPY":"CHOPPY · Mar picado",
 "Tiny & Tricky":short?"TINY":"TINY · Pequeñas",
 "Clean Lines":short?"CLEAN":"CLEAN · Ordenadas",
 "Mellow & Cruisy":short?"MELLOW":"MELLOW · Suaves",
 "Punchy & Powerful":short?"PUNCHY":"PUNCHY · Potentes",
 "Easygoing Sessions":short?"EASYGOING":"EASYGOING · Tranquilo",
 "Short & Soft":short?"SHORT":"SHORT · Período corto",
 "Mixed Bag":short?"MIXED":"MIXED · Variable"
 };
 return names[ch.name]||ch.name;
}
function waveText(best,short=false){
 const ch=globalThis.ZeelandEngine.waveCharacter(best.x);
 return localizedWave(ch,short);
}
function hazardLine(parent,hazard,compact=false){
 if(!["danger","caution"].includes(hazard?.level))return false;
 const line=hstack(parent,5);line.centerAlignContent();
 const tone=hazard.level==="danger"?C.alert:C.caution;
 label(line,"!",compact?10:12,tone,"black");
 const info=hazard.thunder?T.storm:(T.risk+" · "+Math.max(hazard.gust||0,hazard.mean||0)+" km/h");
 label(line,info,compact?9:10,tone,"bold",1);
 return true;
}
function freshness(parent,data){
 const row=hstack(parent,4);row.centerAlignContent();
 label(row,data.stale?T.stale:word("PRONÓSTICO MODELADO","MODEL FORECAST"),9,C.quiet,"semi");
 row.addSpacer();
 label(row,timestampLabel(data.saved),9,C.quiet,"semi");
}
function spotHeading(parent,best,small=false){
 label(parent,small?best.spot[0]:locationLabel(best),small?11:13,C.ink,"bold",1);
 label(parent,dayLabel(best.day)+" · "+windowLabel(best.h),small?10:11,C.quiet,"semi",1);
}
// This is a model direction FROM, not a proven direction at the break.
function compassFrom(degrees){
 if(!Number.isFinite(degrees))return "—";
 const names=["N","NNE","NE","ENE","E","ESE","SE","SSE",
 "S","SSW","SW","WSW","W","WNW","NW","NNW"];
 return names[Math.round(((degrees%360)+360)%360/22.5)%16];
}
function compactMetric(parent,symbol,title,val,tone=C.ink){
 const unit=hstack(parent,5);unit.centerAlignContent();
 glyph(unit,symbol,12,tone);
 label(unit,val,11,C.ink,"bold",1);
 return unit;
}
function nextWindows(parent,best,sessions,limit=3){
 // One carefully labelled model measurement per alternative day. Distinct
 // from the locally breaking wave height, which FARO cannot yet estimate.
 const seen=new Set([best.day]);let n=0;
 for(const s of sessions){
  if(seen.has(s.day))continue;
  seen.add(s.day);
  const row=hstack(parent,7);row.centerAlignContent();
  const session=vstack(row,2);
  label(session,dayLabel(s.day)+"  "+windowLabel(s.h),11,C.ink,"semi",1);
  if(Number.isFinite(s.x?.h))
   label(session,word("MODELO ","MODEL ")+s.x.h.toFixed(1)+" m",9,C.quiet,"semi",1);
  row.addSpacer();
  label(row,s.score.toFixed(1),19,scoreInk(s.score),"bold");
  n++;
  if(n>=limit)break;
  parent.addSpacer(10);
 }
 if(!n)label(parent,word("Sin más ventanas con luz","No more daylight windows"),10,C.quiet);
}
function sectionRule(parent){
 parent.addSpacer(7);
 const line=parent.addStack();line.size=new Size(0,1);
 line.backgroundColor=C.line;
 parent.addSpacer(7);
}
function heroWave(parent,best){
 const row=hstack(parent,5);row.centerAlignContent();
 glyph(row,"water.waves",20,C.wave);
 label(row,best.x.h.toFixed(1)+" m",26,C.wave,"black");
}
function vibePanel(parent,best,small=false){
 const block=vstack(parent,4);
 block.backgroundColor=C.panel;block.cornerRadius=10;
 block.setPadding(small?6:9,small?8:10,small?6:9,small?8:10);
 const head=hstack(block,6);head.centerAlignContent();
 label(head,"FARO VIBE",9,C.quiet,"bold");
 head.addSpacer();
 glyph(head,"water.waves",small?11:13,scoreInk(best.score));
 label(block,waveText(best,small),small?11:12,C.ink,"bold",1);
 return block;
}
/* V13 · Coastal Editorial.
 * Truly different composition: a large uncluttered score, a separate
 * marine model panel and a compact, high-contrast FARO VIBE ribbon.
 * The original FARO logo and the IDENTICAL five ink colours in both
 * system themes remain unchanged.
 */
function editorialHero(parent,best,large=false){
 const row=hstack(parent,large?14:9);row.centerAlignContent();
 const quality=vstack(row,large?3:2);
 label(quality,large?word("CALIDAD DE SURF","SURF QUALITY"):word("CALIDAD · ","QUALITY · ")+T[gradeOf(best.score)].toUpperCase(),large?10:8,C.quiet,"bold",1);
 scoreRow(quality,best,large?56:40);
 if(large)label(quality,T[gradeOf(best.score)].toUpperCase(),10,C.ink,"bold",1);
 row.addSpacer();
 const wave=vstack(row,large?6:3);
 wave.backgroundColor=C.panel;wave.cornerRadius=large?15:12;
 wave.setPadding(large?10:6,large?12:9,large?10:6,large?12:9);
 label(wave,word("OLAS MODELO · MAR ABIERTO","MODEL · OFFSHORE WAVES"),large?9:8,C.quiet,"bold",1);
 const measurement=hstack(wave,5);measurement.centerAlignContent();
 glyph(measurement,"water.waves",large?20:15,C.wave);
 label(measurement,best.x.h.toFixed(1)+" m",large?29:22,C.wave,"black",1);
 label(wave,best.x.period.toFixed(1)+" s   ·   "+best.x.wind+" km/h",large?10:9,C.quiet,"semi",1);
 return row;
}
function vibeRibbon(parent,best,large=false){
 const ribbon=hstack(parent,large?10:7);
 ribbon.centerAlignContent();
 ribbon.backgroundColor=C.subtle;ribbon.cornerRadius=large?13:10;
 ribbon.setPadding(large?8:5,large?12:8,large?8:5,large?12:8);
 const stripe=ribbon.addStack();stripe.size=new Size(large?4:3,large?24:17);
 stripe.cornerRadius=2;stripe.backgroundColor=scoreInk(best.score);
 const copy=vstack(ribbon,large?3:1);
 label(copy,"FARO VIBE",large?9:8,C.quiet,"bold",1);
 label(copy,waveText(best,!large),large?14:10,C.ink,"bold",1);
 ribbon.addSpacer();
 glyph(ribbon,"water.waves",large?17:13,scoreInk(best.score));
 return ribbon;
}
function renderSmall(best,data,hazard,sessions){
 widget.setPadding(12,12,10,12);
 brandRow(widget,true);widget.addSpacer(8);
 const row=hstack(widget,5);row.centerAlignContent();
 const quality=vstack(row,2);
 label(quality,word("CALIDAD","QUALITY"),8,C.quiet,"bold");
 scoreRow(quality,best,41);
 row.addSpacer();
 const wave=vstack(row,2);
 label(wave,word("OLAS MODELO","MODEL WAVES"),8,C.quiet,"bold",1);
 label(wave,best.x.h.toFixed(1)+" m",20,C.wave,"black");
 label(wave,best.x.period.toFixed(1)+" s",9,C.quiet,"semi");
 widget.addSpacer(6);meter(widget,best.score,18,4,4);
 widget.addSpacer(7);
 label(widget,best.spot[0],12,C.ink,"bold",1);
 label(widget,dayLabel(best.day)+" · "+windowLabel(best.h),9,C.quiet,"semi",1);
 widget.addSpacer(5);
 if(!hazardLine(widget,hazard,true)){
  if(STYLE==="DATA")label(widget,compassFrom(best.x.wd)+"  ·  "+best.x.wind+" km/h",9,C.wave,"semi",1);
  else if(STYLE==="WEEK"){
   const next=sessions.find(x=>x.day!==best.day);
   label(widget,next?dayLabel(next.day)+" · "+next.score.toFixed(1):T.model,9,C.quiet,"semi",1);
  }else label(widget,"FARO VIBE · "+waveText(best,true),9,C.ink,"bold",1);
 }
 if(data.stale)label(widget,T.stale,8,C.caution,"bold");
}
function renderMedium(best,data,hazard,sessions){
 widget.setPadding(7,13,7,13);
 brandRow(widget,true);
 widget.addSpacer(4);
 editorialHero(widget,best,false);
 widget.addSpacer(4);
 meter(widget,best.score,26,3,4);
 widget.addSpacer(4);
 const position=hstack(widget,8);position.centerAlignContent();
 label(position,best.spot[0]+" · "+best.spot[1],11,C.ink,"bold",1);
 position.addSpacer();
 label(position,dayLabel(best.day)+" "+windowLabel(best.h),10,C.quiet,"semi",1);
 widget.addSpacer(4);
 if(["danger","caution"].includes(hazard?.level)){
  // Preserve the risk signal if vertical room is constrained.
  hazardLine(widget,hazard,true);
 }else if(STYLE==="WEEK"){
  const next=sessions.find(x=>x.day!==best.day);
  const row=hstack(widget,7);row.centerAlignContent();
  label(row,word("SIGUIENTE","NEXT"),8,C.quiet,"bold",1);
  label(row,next?dayLabel(next.day)+" · "+next.score.toFixed(1):T.model,11,scoreInk(next?.score??best.score),"bold",1);
 }else if(STYLE==="DATA"){
  const line=hstack(widget,6);line.centerAlignContent();
  label(line,word("OLAS TOTALES DE","TOTAL WAVES FROM"),9,C.quiet,"bold",1);
  label(line,compassFrom(best.x.wd)+" · "+Math.round(best.x.wd)+"°",11,C.wave,"bold",1);
 }else{
  vibeRibbon(widget,best,false);
 }
 if(data.stale)label(widget,T.stale,8,C.caution,"bold");
}
function renderLarge(best,data,hazard,sessions){
 widget.setPadding(13,17,11,17);
 brandRow(widget);
 widget.addSpacer(9);
 spotHeading(widget,best);
 widget.addSpacer(8);
 editorialHero(widget,best,true);
 widget.addSpacer(10);
 meter(widget,best.score,34,5,6);
 sectionRule(widget);
 const hazardVisible=hazardLine(widget,hazard);
 if(hazardVisible)widget.addSpacer(9);
 if(STYLE==="WEEK"){
  label(widget,word("PRÓXIMAS VENTANAS","NEXT SURF WINDOWS"),10,C.quiet,"bold",1);
  widget.addSpacer(9);
  nextWindows(widget,best,sessions,hazardVisible?2:3);
 }else{
  vibeRibbon(widget,best,true);
  widget.addSpacer(7);
  if(STYLE==="DATA"){
   const metrics=hstack(widget,16);metrics.centerAlignContent();
   compactMetric(metrics,"wind",T.wind,best.x.wind+" km/h",C.wave);
   compactMetric(metrics,"clock",T.period,best.x.period.toFixed(1)+" s",C.wave);
   widget.addSpacer(7);
   label(widget,word("OLAS TOTALES DESDE ","TOTAL WAVES FROM ")+compassFrom(best.x.wd)+" · "+Math.round(best.x.wd)+"°",10,C.quiet,"semi",1);
  }else if(STYLE==="MINIMAL"){
   label(widget,word("VIENTO ","WIND ")+best.x.wind+" km/h · "+best.x.period.toFixed(1)+" s",12,C.quiet,"semi",1);
  }else{
   const insight=globalThis.ZeelandEngine.quickRead(best.x,LANG);
   label(widget,insight.headline,15,C.ink,"bold",2);
   widget.addSpacer(5);
   label(widget,word("OLEAJE TOTAL DE ","TOTAL WAVES FROM ")+compassFrom(best.x.wd)+" · "+best.x.period.toFixed(1)+" s",10,C.quiet,"semi",1);
  }
 }
 widget.addSpacer();
 freshness(widget,data);
}

function renderAccessory(best,hazard){
 widget.backgroundColor=new Color("#000000",0);
 widget.setPadding(0,0,0,0);
 if(family==="accessoryInline"){
  label(widget,"FARO "+best.score.toFixed(1)+" · "+best.spot[0],11,Color.white(),"semi",1);
 }else if(family==="accessoryCircular"){
  const col=vstack(widget,2);
  label(col,"FARO",9,Color.white(),"bold");
  label(col,best.score.toFixed(1),26,Color.white(),"black");
 }else{
  const col=vstack(widget,4);
  label(col,"FARO / "+best.spot[0],11,Color.white(),"bold");
  const row=hstack(col,5);row.centerAlignContent();
  label(row,best.score.toFixed(1),25,Color.white(),"black");
  label(row,hazard?.level==="danger"?"!":T[gradeOf(best.score)],9,Color.white(),"semi");
  label(col,dayLabel(best.day)+" · "+windowLabel(best.h),9,Color.white(),"semi");
 }
}
function emptyWidget(message){
 widget.setPadding(lockFamily?0:14,lockFamily?0:14,lockFamily?0:12,lockFamily?0:14);
 if(lockFamily){
  label(widget,"FARO · "+message,12,Color.white(),"semi",1);
  return;
 }
 brandRow(widget,true);
 widget.addSpacer(11);
 label(widget,message,14,C.ink,"bold",2);
 widget.addSpacer(5);
 label(widget,LANG==="es"?"Consulta Faro para revisar datos y alertas":"Open Faro for data and warnings",11,C.quiet,"regular",2);
}
try{
 ORIGINAL_FARO_IMAGE=await officialFaroLogo();
 if(invalidTarget)throw Error(LANG==="es"?"Parámetro de playa desconocido":"Unknown beach parameter");
 const E=await engine(),data=await fetchModel(chosen);
 const sessions=candidateSessions(data,E,chosen);
 if(!sessions.length)throw Error(T.noDay);
 const best=sessions[0],hazard=modelHazard(data);
 if(lockFamily)renderAccessory(best,hazard);
 else if(family==="small")renderSmall(best,data,hazard,sessions);
 else if(family==="large"||family==="extraLarge")renderLarge(best,data,hazard,sessions);
 else renderMedium(best,data,hazard,sessions);
 // Only model-derived information; tapping opens Faro website.
 widget.url=SITE+"?faroSpot="+encodeURIComponent(best.spot[0]+":"+best.spot[1])+
  "&day="+encodeURIComponent(best.day)+"&hour="+best.h;
}catch(e){
 emptyWidget(String(e.message||e).slice(0,64));
 console.warn("FARO Scriptable widget: "+String(e));
}
widget.refreshAfterDate=new Date(Date.now()+30*60000);
Script.setWidget(widget);
if(config.runsInApp){
 if(family==="accessoryInline")await widget.presentAccessoryInline();
 else if(family==="accessoryCircular")await widget.presentAccessoryCircular();
 else if(family==="accessoryRectangular")await widget.presentAccessoryRectangular();
 else if(family==="small")await widget.presentSmall();
 else if(family==="extraLarge")await widget.presentExtraLarge();
 else if(family==="large")await widget.presentLarge();
 else await widget.presentMedium();
}
Script.complete();
