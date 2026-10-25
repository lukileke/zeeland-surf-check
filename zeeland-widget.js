// FARO Widget · Coastal Punch v5 · Scriptable iOS
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
const THEME=["AUTO","LIGHT","DARK"].includes(opt("THEME"))?opt("THEME"):"AUTO";
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
function palette(light,dark){return THEME==="LIGHT"?new Color(light):THEME==="DARK"?new Color(dark):Color.dynamic(new Color(light),new Color(dark))}
const C={
 bg:palette("#F7FAFA","#102427"),ink:palette("#1F3B3D","#F3F8F7"),
 quiet:palette("#526A74","#BBCBCD"),sun:new Color("#FFDA71"),
 wave:palette("#355BAF","#A5BAFF"),line:palette("#C9D8DA","#507074"),
 panel:palette("#FFFFFF","#234347"),subtle:palette("#EFF5F5","#193337"),
 alert:palette("#D85B48","#FF9A87"),caution:palette("#CE762E","#EFBC62")
};
function addBrandLogo(parent,compact=false){
 const row=hstack(parent,3);row.centerAlignContent();
 label(row,"FARO",compact?15:18,C.ink,"black");
 label(row,"◉",compact?12:15,C.sun,"black");
}
function scoreInk(v){
 if(v<2)return palette("#C46639","#F0A46D");
 if(v<4)return palette("#BA7C31","#F0BF69");
 if(v<6)return palette("#9C8431","#E3D471");
 if(v<8)return palette("#6E9E43","#B0DB75");
 return palette("#547642","#96C67A");
}
const widget=new ListWidget();
widget.backgroundColor=C.bg;
try{
 const grad=new LinearGradient();
 grad.colors=[palette("#FFFFFF","#102427"),palette("#EEF6F3","#1F3F42")];
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
// Numeric band colour comes from the official brand PDF; grade labels remain independent.
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
 const row=hstack(parent,5);row.centerAlignContent();
 label(row,"FARO",small?16:19,C.ink,"black");
 label(row,"◒",small?12:15,C.sun,"black");
 row.addSpacer();
 label(row,"ZEELAND",small?8:9,C.quiet,"bold");
}
function scoreRow(parent,best,size){
 const row=hstack(parent,3);row.bottomAlignContent();
 label(row,best.score.toFixed(1),size,scoreInk(best.score),"black");
 label(row,"/10",Math.max(11,Math.floor(size*.28)),C.quiet,"semi");
}
function meter(parent,score,width=23,height=5,gap=5){
 const row=hstack(parent,gap);row.centerAlignContent();
 const active=Math.max(1,Math.min(5,Math.ceil(score/2)));
 for(let i=0;i<5;i++){
  const cell=row.addStack();
  cell.size=new Size(width,height);
  cell.cornerRadius=height/2;
  cell.backgroundColor=i<active?scoreInk(score):C.line;
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
function compactMetric(parent,symbol,title,val,tone=C.ink){
 const unit=hstack(parent,5);unit.centerAlignContent();
 glyph(unit,symbol,12,tone);
 label(unit,val,11,C.ink,"bold",1);
 return unit;
}
function nextWindows(parent,best,sessions,limit=3){
 const seen=new Set([best.day]);let n=0;
 for(const s of sessions){
  if(seen.has(s.day))continue;
  seen.add(s.day);
  const row=hstack(parent,6);row.centerAlignContent();
  label(row,dayLabel(s.day)+"  "+windowLabel(s.h),11,C.quiet,"semi",1);
  row.addSpacer();
  label(row,s.score.toFixed(1),14,scoreInk(s.score),"bold");
  n++;
  if(n>=limit)break;
  parent.addSpacer(6);
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
function renderSmall(best,data,hazard,sessions){
 widget.setPadding(12,13,10,13);
 accentLine(widget,48,4,scoreInk(best.score));widget.addSpacer(7);
 brandRow(widget,true);widget.addSpacer(8);
 scoreRow(widget,best,43);
 meter(widget,best.score,19,4,4);
 widget.addSpacer(6);
 label(widget,best.spot[0],12,C.ink,"bold",1);
 label(widget,dayLabel(best.day)+" · "+windowLabel(best.h),9,C.quiet,"semi",1);
 widget.addSpacer(5);
 if(!hazardLine(widget,hazard,true)){
  if(STYLE==="DATA")label(widget,best.x.h.toFixed(1)+" m  /  "+best.x.period.toFixed(1)+" s",10,C.wave,"bold",1);
  else if(STYLE==="WEEK"){
   const next=sessions.find(x=>x.day!==best.day);
   label(widget,next?dayLabel(next.day)+"  "+next.score.toFixed(1):T.model,9,C.quiet,"semi",1);
  }else if(STYLE==="FLOW")label(widget,waveText(best,true),10,C.ink,"semi",1);
 }
 if(data.stale)label(widget,T.stale,8,C.quiet,"semi");
}
function renderMedium(best,data,hazard,sessions){
 widget.setPadding(9,13,8,13);
 accentLine(widget,58,3,scoreInk(best.score));widget.addSpacer(4);
 brandRow(widget,true);widget.addSpacer(3);
 const main=hstack(widget,7);main.centerAlignContent();
 const quality=vstack(main,1);
 scoreRow(quality,best,40);
 label(quality,T[gradeOf(best.score)].toUpperCase(),9,scoreInk(best.score),"bold");
 main.addSpacer();
 const waves=vstack(main,3);
 heroWave(waves,best);
 label(waves,best.x.period.toFixed(1)+" s · "+best.x.wind+" km/h",9,C.quiet,"semi");
 widget.addSpacer(4);
 meter(widget,best.score,25,3,4);
 widget.addSpacer(4);
 const rule=widget.addStack();rule.size=new Size(0,1);rule.backgroundColor=C.line;
 widget.addSpacer(4);
 const row=hstack(widget,5);row.centerAlignContent();
 label(row,best.spot[0]+" · "+best.spot[1],11,C.ink,"bold",1);
 row.addSpacer();
 label(row,dayLabel(best.day)+" "+windowLabel(best.h),9,C.quiet,"semi",1);
 widget.addSpacer(3);
 if(!hazardLine(widget,hazard,true)){
  if(STYLE==="WEEK"){
   const next=sessions.find(x=>x.day!==best.day);
   label(widget,next?word("PRÓXIMA ","NEXT ")+dayLabel(next.day)+"  "+next.score.toFixed(1):T.model,9,C.quiet,"semi",1);
  }else if(STYLE==="DATA")compactMetric(widget,"wind",T.wind,best.x.wind+" km/h",C.wave);
  else if(STYLE==="FLOW")label(widget,"FARO VIBE  ·  "+waveText(best,true),10,C.ink,"semi",1);
  else label(widget,data.stale?T.stale:T.model,9,C.quiet,"semi",1);
 }
}
function renderLarge(best,data,hazard,sessions){
 widget.setPadding(18,18,16,18);
 accentLine(widget,84,5,scoreInk(best.score));widget.addSpacer(13);
 brandRow(widget);widget.addSpacer(12);
 spotHeading(widget,best);widget.addSpacer(13);
 const top=hstack(widget,10);top.centerAlignContent();
 const score=vstack(top,5);
 scoreRow(score,best,62);
 label(score,T[gradeOf(best.score)].toUpperCase(),12,scoreInk(best.score),"bold");
 top.addSpacer();
 const wave=vstack(top,5);
 heroWave(wave,best);
 label(wave,T.period+" "+best.x.period.toFixed(1)+" s",10,C.quiet,"semi");
 widget.addSpacer(13);
 meter(widget,best.score,37,6,6);
 sectionRule(widget);
 if(hazardLine(widget,hazard))widget.addSpacer(11);
 if(STYLE==="WEEK"){
  label(widget,word("PRÓXIMAS VENTANAS","NEXT SURF WINDOWS"),10,C.quiet,"bold");
  widget.addSpacer(10);nextWindows(widget,best,sessions,3);
 }else if(STYLE==="DATA"){
  label(widget,word("CONDICIONES MODELO","MODEL CONDITIONS"),10,C.quiet,"bold");
  widget.addSpacer(10);
  const metrics=hstack(widget,16);
  compactMetric(metrics,"wind",T.wind,best.x.wind+" km/h",C.wave);
  compactMetric(metrics,"clock",T.period,best.x.period.toFixed(1)+" s",C.wave);
  widget.addSpacer(10);vibePanel(widget,best);
 }else if(STYLE==="MINIMAL"){
  vibePanel(widget,best);widget.addSpacer(12);
  label(widget,best.x.period.toFixed(1)+" s  ·  "+best.x.wind+" km/h",12,C.quiet,"semi");
 }else{
  vibePanel(widget,best);widget.addSpacer(11);
  const insight=globalThis.ZeelandEngine.quickRead(best.x,LANG);
  label(widget,insight.headline,15,C.ink,"bold",2);
  /* Expanded interpretation remains available on the FARO website. */
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
 else if(family==="large"||family==="extraLarge")await widget.presentLarge();
 else await widget.presentMedium();
}
Script.complete();
