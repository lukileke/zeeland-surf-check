// FARO Widget · Coastal Editorial v2 · Scriptable iOS
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
const param=String((typeof args!=="undefined"&&args.widgetParameter)||"BEST").trim();
const tokens=param.split("|").map(s=>s.trim()).filter(Boolean);
const LANG=tokens.some(t=>t.toUpperCase()==="ES")?"es":"en";
const requestTarget=tokens.find(t=>!/^(ES|EN)$/i.test(t))||"BEST";
const isBest=requestTarget.toUpperCase()==="BEST";
const targetParts=requestTarget.split(":").map(t=>t.trim());
let chosen=SPOTS.filter(x=>isBest||x[0].toLowerCase()===targetParts[0].toLowerCase());
if(targetParts.length>1)chosen=chosen.filter(x=>x[1].toLowerCase()===targetParts[1].toLowerCase());
const invalidTarget=!chosen.length;
if(invalidTarget)chosen=SPOTS.slice();
const family=(typeof config!=="undefined"&&config.widgetFamily)||"medium";
const lockFamily=family.startsWith("accessory");
const fm=FileManager.local();
const enginePath=fm.joinPath(fm.cacheDirectory(),"faro-widget-engine-v2.js");
const cacheName=isBest?"all":chosen.map(x=>x[0]+"-"+x[1]).join("_").replace(/[^a-zA-Z0-9_-]/g,"-").slice(0,80);
const dataPath=fm.joinPath(fm.cacheDirectory(),"faro-widget-data-v2-"+cacheName+".json");
const C={
 bg:Color.dynamic(new Color("#E9F1F2"),new Color("#172327")),
 ink:Color.dynamic(new Color("#20323A"),new Color("#F0F6F5")),
 quiet:Color.dynamic(new Color("#5A7079"),new Color("#ADC0C3")),
 teal:Color.dynamic(new Color("#157C89"),new Color("#87D2D3")),
 wave:Color.dynamic(new Color("#147F99"),new Color("#8CCDEC")),
 line:Color.dynamic(new Color("#C6D6D9"),new Color("#394E54")),
 panel:Color.dynamic(new Color("#F5F9F9"),new Color("#202E33")),
 alert:Color.dynamic(new Color("#A43B47"),new Color("#F1A2AC"))
};
const widget=new ListWidget();
widget.backgroundColor=C.bg;
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
const scoreColors={
 excellent:Color.dynamic(new Color("#086C4E"),new Color("#75D9AD")),
 good:Color.dynamic(new Color("#176449"),new Color("#83D6A8")),
 fair:Color.dynamic(new Color("#65561E"),new Color("#EAD17A")),
 poor:Color.dynamic(new Color("#943F2F"),new Color("#F4A08A")),
 veryPoor:Color.dynamic(new Color("#873147"),new Color("#EF9EB2"))
};
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
   const req=new Request(SITE+"surf-engine.js");
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
 const next=new Date();next.setDate(next.getDate()+1);
 if(day===localParts(next).date)return T.tomorrow;
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
function topBar(parent,subtitle){
 const top=hstack(parent,6);top.centerAlignContent();
 label(top,"FARO",16,C.ink,"black");label(top,"≈",16,C.teal,"bold");
 top.addSpacer();
 label(top,subtitle,9,C.quiet,"bold");
 return top;
}
function scoreRow(parent,best,compact=false){
 const grade=gradeOf(best.score),row=hstack(parent,3);row.bottomAlignContent();
 label(row,best.score.toFixed(1),compact?38:45,scoreColors[grade],"black");
 label(row,"/10",12,C.quiet,"semi");
 return row;
}
function scoreChip(parent,best){
 const g=gradeOf(best.score);
 const group=hstack(parent);group.setPadding(3,7,3,7);
 group.backgroundColor=C.panel;group.cornerRadius=6;
 label(group,T[g],11,scoreColors[g],"bold");
 return group;
}
function hazardLine(parent,hazard){
 if(hazard?.level!=="danger"&&hazard?.level!=="caution")return false;
 const row=hstack(parent,5);row.centerAlignContent();
 label(row,hazard.level==="danger"?"!":"·",12,C.alert,"black");
 const msg=hazard.thunder?T.storm:
  T.risk+" · "+Math.max(hazard.gust||0,hazard.mean||0)+" km/h";
 label(row,msg,10,C.alert,"bold");
 return true;
}
function freshness(parent,data){
 const foot=hstack(parent,3);foot.centerAlignContent();
 label(foot,data.stale?T.stale:T.model,9,C.quiet,"semi");
 foot.addSpacer();
 label(foot,timestampLabel(data.saved),9,C.quiet);
}
function renderMedium(best,data,hazard){
 widget.setPadding(13,14,11,14);
 topBar(widget,isBest?T.best:T.spot);
 widget.addSpacer(8);
 const main=hstack(widget,10);main.centerAlignContent();
 const left=vstack(main,2);
 scoreRow(left,best,false);
 scoreChip(left,best);
 main.addSpacer();
 const right=vstack(main,3);
 const wave=hstack(right,3);wave.bottomAlignContent();
 label(wave,best.x.h.toFixed(1),27,C.wave,"black");
 label(wave,"m",13,C.wave,"semi");
 label(right,best.x.period.toFixed(1)+" s · "+best.x.wind+" km/h",10,C.quiet,"semi");
 widget.addSpacer(8);
 thinLine(widget);
 widget.addSpacer(7);
 const site=hstack(widget,5);site.centerAlignContent();
 label(site,locationLabel(best),11,C.ink,"bold");
 site.addSpacer();
 label(site,dayLabel(best.day)+" "+windowLabel(best.h),10,C.quiet,"semi");
 widget.addSpacer(4);
 if(!hazardLine(widget,hazard))freshness(widget,data);
 else{
  const note=hstack(widget,3);note.addSpacer();
  label(note,data.stale?T.stale:T.model,8,C.quiet);
 }
}
function renderSmall(best,data,hazard){
 widget.setPadding(12,12,11,12);
 topBar(widget,"ZEELAND");
 widget.addSpacer(9);
 scoreRow(widget,best,true);
 widget.addSpacer(3);
 scoreChip(widget,best);
 widget.addSpacer();
 label(widget,locationLabel(best,true),12,C.ink,"bold");
 label(widget,dayLabel(best.day)+" · "+windowLabel(best.h),10,C.quiet,"semi");
 if(!hazardLine(widget,hazard)){
  widget.addSpacer(3);
  label(widget,best.x.h.toFixed(1)+" m · "+(data.stale?T.stale:T.model),9,C.wave);
 }
}
function renderLarge(best,data,hazard,sessions){
 widget.setPadding(16,16,14,16);
 topBar(widget,isBest?T.best:T.spot);
 widget.addSpacer(13);
 const row=hstack(widget,15);row.centerAlignContent();
 const left=vstack(row,5);scoreRow(left,best,false);scoreChip(left,best);
 row.addSpacer();
 const wave=vstack(row,3);label(wave,best.x.h.toFixed(1)+" m",26,C.wave,"black");
 label(wave,T.wave+" · "+best.x.period.toFixed(1)+" s",10,C.quiet,"semi");
 widget.addSpacer(13);
 thinLine(widget);widget.addSpacer(9);
 label(widget,locationLabel(best),13,C.ink,"bold");
 label(widget,dayLabel(best.day)+" · "+windowLabel(best.h),11,C.quiet);
 widget.addSpacer(10);
 const character=globalThis.ZeelandEngine.waveCharacter(best.x);
 const characterTag=hstack(widget,5);characterTag.setPadding(6,9,6,9);
 characterTag.cornerRadius=8;characterTag.backgroundColor=C.panel;
 label(characterTag,character.emoji,14,C.wave);
 label(characterTag,character.name,12,C.ink,"semi");
 widget.addSpacer(10);
 label(widget,LANG==="es"?"PRÓXIMAS OPORTUNIDADES":"NEXT SURF WINDOWS",10,C.quiet,"bold");
 widget.addSpacer(5);
 const shortlist=[];
 for(const s of sessions){
  if(s===best)continue;
  if(shortlist.some(item=>item.day===s.day))continue;
  shortlist.push(s);
  if(shortlist.length===2)break;
 }
 for(const next of shortlist){
  const r=hstack(widget,6);r.centerAlignContent();
  label(r,dayLabel(next.day)+" "+windowLabel(next.h),10,C.quiet,"semi");
  r.addSpacer();
  label(r,next.score.toFixed(1)+"/10",11,scoreColors[gradeOf(next.score)],"bold");
  widget.addSpacer(5);
 }
 widget.addSpacer();
 thinLine(widget);widget.addSpacer(7);
 if(!hazardLine(widget,hazard))freshness(widget,data);
 else label(widget,data.stale?T.stale:T.model,9,C.quiet);
}
function renderAccessory(best,hazard){
 widget.backgroundColor=new Color("#000000",0);
 widget.setPadding(0,0,0,0);
 if(family==="accessoryInline"){
  label(widget,"FARO "+best.score.toFixed(1)+" · "+dayLabel(best.day)+" "+windowLabel(best.h),11,Color.white(),"semi");
 }else if(family==="accessoryCircular"){
  const stack=vstack(widget,1);
  label(stack,"FARO",10,Color.white(),"bold");
  label(stack,best.score.toFixed(1),28,Color.white(),"black");
 }else{
  const c=vstack(widget,2);
  label(c,"FARO · "+best.spot[0],12,Color.white(),"semi");
  const r=hstack(c,6);r.centerAlignContent();
  label(r,best.score.toFixed(1),27,Color.white(),"black");
  label(r,hazard?.level==="danger"?"!":T[gradeOf(best.score)].toUpperCase(),11,Color.white(),"semi");
  label(c,dayLabel(best.day)+" "+windowLabel(best.h),10,Color.white());
 }
}
function emptyWidget(message){
 widget.setPadding(lockFamily?0:14,lockFamily?0:14,lockFamily?0:12,lockFamily?0:14);
 if(lockFamily){
  label(widget,"FARO · "+message,12,Color.white(),"semi",1);
  return;
 }
 topBar(widget,"ZEELAND");
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
 else if(family==="small")renderSmall(best,data,hazard);
 else if(family==="large"||family==="extraLarge")renderLarge(best,data,hazard,sessions);
 else renderMedium(best,data,hazard);
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
