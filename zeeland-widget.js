// Zeeland Surf Check - Scriptable medium widget
// Widget Parameter: BEST (default), Domburg, Westkapelle, Oostkapelle, Cadzand, Brouwersdam
const SITE="https://lukileke.github.io/zeeland-surf-check/";
const BEACHES=[
 ["Domburg",51.566,3.489,325],["Westkapelle",51.540,3.435,305],
 ["Oostkapelle",51.585,3.547,330],["Cadzand",51.378,3.382,315],
 ["Brouwersdam",51.765,3.856,300]
];
const selected=String(args.widgetParameter||"BEST").trim().toLowerCase();
const fixedIndex=BEACHES.findIndex(x=>x[0].toLowerCase()===selected);
const targets=fixedIndex>=0?[fixedIndex]:BEACHES.map((_,i)=>i);
const fm=FileManager.local();
const engineCache=fm.joinPath(fm.cacheDirectory(),"zeeland-surf-engine.js");
const widget=new ListWidget();widget.backgroundColor=new Color("#090909");widget.setPadding(15,17,13,17);widget.url=SITE;
function label(s,size=12,color="#cccccc",bold=false){let t=widget.addText(String(s));t.font=bold?Font.boldSystemFont(size):Font.systemFont(size);t.textColor=new Color(color);t.lineLimit=1;return t;}
function pad(n){return String(n).padStart(2,"0")}
function minutes(t){return Number(t.slice(11,13))*60+Number(t.slice(14,16))}
async function json(url){const r=new Request(url);r.timeoutInterval=18;return await r.loadJSON()}
async function engine(){
 try{
  const r=new Request(SITE+"surf-engine.js");r.timeoutInterval=15;
  const src=await r.loadString();
  if(!src.includes("ZeelandEngine"))throw Error("Engine missing");
  eval(src);fm.writeString(engineCache,src);
 }catch(e){if(!fm.fileExists(engineCache))throw e;eval(fm.readString(engineCache))}
 if(!globalThis.ZeelandEngine)throw Error("Engine not loaded");
 return globalThis.ZeelandEngine;
}
async function forecast(ai){
 const [name,lat,lon]=BEACHES[ai];
 const cache=fm.joinPath(fm.cacheDirectory(),"zeeland-shared-"+ai+".json");
 const qs="?latitude="+lat+"&longitude="+lon+"&timezone=Europe%2FAmsterdam&forecast_days=3";
 const marine="https://marine-api.open-meteo.com/v1/marine"+qs+"&hourly=wave_height,wave_direction,wave_period";
 const weather="https://api.open-meteo.com/v1/forecast"+qs+"&hourly=wind_speed_10m,wind_direction_10m,precipitation,weather_code&daily=sunrise,sunset";
 try{
  const [m,w]=await Promise.all([json(marine),json(weather)]);
  if(!m.hourly||!w.hourly||!w.daily)throw Error("Incomplete forecast");
  const d={m,w,saved:Date.now()};fm.writeString(cache,JSON.stringify(d));return d;
 }catch(e){if(!fm.fileExists(cache))throw e;return JSON.parse(fm.readString(cache))}
}
function localNow(){return new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date()).replace(" ","T")}
function sessions(d,E,ai){
 const [name,lat,lon,orientation]=BEACHES[ai];
 const m=d.m.hourly,w=d.w.hourly,daily=d.w.daily;
 const wi=new Map(w.time.map((t,i)=>[t,i]));
 const now=localNow(),out=[];
 for(let di=0;di<daily.time.length;di++){
  const date=daily.time[di],from=minutes(daily.sunrise[di])+15,to=minutes(daily.sunset[di])-30;
  for(let h=6;h<22;h+=2){
   const start=h*60,end=start+120,available=Math.max(0,Math.min(end,to)-Math.max(start,from));
   if(available<40||date+"T"+pad(h+2)+":00"<=now)continue;
   let samples=[];
   for(let i=0;i<m.time.length;i++){
    const t=m.time[i],hour=Number(t.slice(11,13));
    if(!t.startsWith(date)||hour<h||hour>=h+2)continue;
    const j=wi.get(t);if(j===undefined)continue;
    const x={h:m.wave_height?.[i],period:m.wave_period?.[i],wd:m.wave_direction?.[i],wind:w.wind_speed_10m?.[j],dir:w.wind_direction_10m?.[j],precip:w.precipitation?.[j],code:w.weather_code?.[j]};
    if([x.h,x.period,x.wd,x.wind,x.dir].some(v=>v==null))continue;
    const score=E.evaluate(x,orientation,ai);samples.push({...x,...score});
   }
   if(!samples.length)continue;
   const representative=samples[Math.floor(samples.length/2)];
   const avg=Math.round(samples.reduce((a,x)=>a+x.v,0)/samples.length*10)/10;
   out.push({date,h,score:avg,x:representative,ai,name,saved:d.saved});
  }
 }
 return out.sort((a,b)=>b.score-a.score);
}
label("◉ ZEELAND SURF  /  "+(fixedIndex>=0?BEACHES[fixedIndex][0].toUpperCase():"BEST IN ZEELAND"),10,"#aaaaaa",true);
widget.addSpacer(8);
try{
 const E=await engine();
 const outcomes=await Promise.allSettled(targets.map(async ai=>sessions(await forecast(ai),E,ai)));
 const available=outcomes.filter(x=>x.status==="fulfilled").flatMap(x=>x.value);
 const s=available.sort((a,b)=>b.score-a.score);
 if(!s.length)throw Error("No available daylight forecasts");
 const best=s[0],row=widget.addStack();row.centerAlignContent();
 const left=row.addStack();left.layoutVertically();
 const big=left.addText(best.score.toFixed(1)+" / 10");big.font=Font.boldSystemFont(28);big.textColor=Color.white();
 const sub=left.addText("SURF QUALITY");sub.font=Font.mediumSystemFont(10);sub.textColor=new Color("#aaaaaa");
 row.addSpacer();
 const right=row.addStack();right.layoutVertically();
 const date=right.addText(best.date===localNow().slice(0,10)?"TODAY":best.date.slice(5));date.font=Font.boldSystemFont(12);date.textColor=Color.white();
 const time=right.addText(pad(best.h)+":00–"+pad(best.h+2)+":00");time.font=Font.systemFont(12);time.textColor=new Color("#dddddd");
 widget.addSpacer(7);
 label(best.name+"  ·  "+E.waveCharacter(best.x).name,14,"#ffffff",true);
 widget.addSpacer(5);
 label(best.x.h.toFixed(1)+" m  ·  "+best.x.period.toFixed(1)+" s  ·  "+Math.round(best.x.wind)+" km/h",11);
 widget.addSpacer();
 const age=Math.max(0,Math.floor((Date.now()-best.saved)/60000));
 label((age<60?"UPDATED "+age+"M AGO":"CACHED "+Math.floor(age/60)+"H AGO")+"  ·  TAP TO OPEN",9,"#888888",true);
}catch(e){
 label("Forecast unavailable",16,"#ffffff",true);
 widget.addSpacer(7);label(String(e).slice(0,45),10);
 console.error(String(e));
}
widget.refreshAfterDate=new Date(Date.now()+30*60*1000);
Script.setWidget(widget);
if(config.runsInApp)await widget.presentMedium();
Script.complete();
