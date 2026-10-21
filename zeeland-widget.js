// Zeeland Surf Check - Scriptable home screen + lock screen widget
// Widget Parameter: BEST (default), Domburg, Westkapelle, Oostkapelle, Cadzand, Brouwersdam
const SITE="https://lukileke.github.io/zeeland-surf-check/";
const BEACHES=[
 ["Domburg",51.566,3.489,325],["Westkapelle",51.540,3.435,305],
 ["Oostkapelle",51.585,3.547,330],["Cadzand",51.378,3.382,315],
 ["Brouwersdam",51.765,3.856,300]
];
const SPOTS=[
 [["Noordduine",325],["Central beach",325],["West sector",325]],
 [["North beach",305],["Central area",290]],
 [["Main beach",330],["West sector",330]],
 [["Cadzand-Bad",315],["West sector",315]],
 [["North beach",300],["Central beach",300],["South beach",300]]
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
 const [name,lat,lon]=BEACHES[ai];
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
    samples.push(x);
   }
   if(!samples.length)continue;
   if(samples.length!==2)continue;
   for(const [spotName,orientation] of SPOTS[ai]){
    const scored=samples.map(x=>({...x,...E.evaluate(x,orientation,ai)}));
    const representative=scored[Math.floor(scored.length/2)];
    const avg=Math.round(scored.reduce((a,x)=>a+x.v,0)/scored.length*10)/10;
    out.push({date,h,score:avg,x:representative,ai,name,spotName,saved:d.saved});
   }
  }
 }
 return out.sort((a,b)=>b.score-a.score);
}
try{
 const E=await engine();
 const outcomes=await Promise.allSettled(targets.map(async ai=>sessions(await forecast(ai),E,ai)));
 const available=outcomes.filter(x=>x.status==="fulfilled").flatMap(x=>x.value);
 const s=available.sort((a,b)=>b.score-a.score);
 if(!s.length)throw Error("No available daylight forecasts");
 const best=s[0];
 const grade=best.score>=8?"EXCELLENT":best.score>=6.5?"GOOD":best.score>=5?"FAIR":"POOR";
 const gradeColor=grade==="EXCELLENT"?"#55D6A0":grade==="GOOD"?"#79D77C":grade==="FAIR"?"#C9D95A":"#F18B72";
 if(config.widgetFamily==="accessoryRectangular"||config.widgetFamily==="accessoryInline"){
  // Lock Screen: typographic hierarchy, no artificial card or redundant labels.
  widget.backgroundColor=new Color("#000000",0);
  widget.setPadding(0,0,0,0);
  const isInline=config.widgetFamily==="accessoryInline";
  const nowDay=localNow().slice(0,10);
  const when=best.date===nowDay?"TODAY":new Intl.DateTimeFormat("en-GB",{weekday:"short",timeZone:"Europe/Amsterdam"}).format(new Date(best.date+"T12:00:00Z")).toUpperCase();
  if(isInline){
   const inline=widget.addText("≋ "+best.score.toFixed(1)+" "+grade+" · "+when+" "+pad(best.h)+":00");
   inline.font=Font.semiboldSystemFont(12);
   inline.textColor=Color.white();
  }else{
   // Match the adjacent World Clock: one clear heading, one large value.
   // Keep timing in the home-screen widget, where there is room for it.
   const layout=widget.addStack();
   layout.layoutVertically();
   layout.spacing=0;
   const heading=layout.addStack();
   heading.centerAlignContent();
   heading.spacing=5;
   const symbol=SFSymbol.named("water.waves");
   if(symbol){
    symbol.applyFont(Font.mediumSystemFont(12));
    const wave=heading.addImage(symbol.image);
    wave.imageSize=new Size(15,12);
    wave.tintColor=Color.white();
   }
   const name=heading.addText("Zeeland Surf");
   name.font=Font.semiboldSystemFont(14);
   name.textColor=Color.white();
   const main=layout.addStack();
   main.centerAlignContent();
   main.spacing=8;
   const score=main.addText(best.score.toFixed(1));
   score.font=Font.lightSystemFont(44);
   score.textColor=Color.white();
   score.minimumScaleFactor=0.8;
   const quality=main.addText(grade);
   quality.font=Font.semiboldSystemFont(12);
   quality.textColor=Color.white();
   quality.lineLimit=1;
  }
  // Native iOS lock-screen tint and translucency apply automatically.
 }else{
 // Golden Hour Surf Club: medium home-screen widget only.
 const cream=new Color("#E8D7B7"),petrol=new Color("#304A42"),muted=new Color("#665E4E"),ivory=new Color("#F5E6C8");
 const panelColor=new Color(grade==="EXCELLENT"?"#238B77":grade==="GOOD"?"#438B58":grade==="FAIR"?"#879747":"#B86952");
 widget.backgroundColor=cream;widget.setPadding(10,13,10,13);
 function txt(parent,value,size,color,bold=false){const t=parent.addText(String(value));t.font=bold?Font.boldSystemFont(size):Font.systemFont(size);t.textColor=color;t.lineLimit=1;t.minimumScaleFactor=0.68;return t}
 function surfWaveImage(){
   // Smooth cubic Bezier paths inspired by the supplied surf-break silhouette.
   const c=new DrawContext();c.size=new Size(62,62);c.opaque=false;c.respectScreenScale=true;
   c.setFillColor(Color.white());
   const k=62/112;
   const P=(x,y)=>new Point(x*k,y*k);
   const crest=new Path();
   crest.move(P(18,75));
   crest.addCurve(P(36,51),P(27,65),P(32,37));
   crest.addCurve(P(65,28),P(43,23),P(61,28));
   crest.addCurve(P(78,48),P(78,30),P(82,39));
   crest.addCurve(P(65,45),P(76,52),P(68,42));
   crest.addCurve(P(52,49),P(58,40),P(55,42));
   crest.addCurve(P(38,66),P(48,54),P(43,63));
   crest.addCurve(P(18,75),P(30,70),P(22,74));
   crest.closeSubpath();c.addPath(crest);c.fillPath();
   const flow=new Path();
   flow.move(P(16,84));
   flow.addCurve(P(51,73),P(28,78),P(39,72));
   flow.addCurve(P(76,80),P(61,73),P(64,82));
   flow.addCurve(P(109,64),P(90,79),P(101,70));
   flow.addCurve(P(78,87),P(102,83),P(91,88));
   flow.addCurve(P(50,82),P(66,88),P(62,80));
   flow.addCurve(P(16,89),P(37,79),P(25,86));
   flow.closeSubpath();c.addPath(flow);c.fillPath();
   return c.getImage();
 }
 const surfWave=surfWaveImage();
 function wizardHat(){
  const c=new DrawContext();c.size=new Size(48,48);c.opaque=false;c.respectScreenScale=true;
  c.setStrokeColor(ivory);c.setLineWidth(2.8);
  function line(pts,close=false){const p=new Path();pts.forEach(([x,y],i)=>i?p.addLine(new Point(x,y)):p.move(new Point(x,y)));if(close)p.closeSubpath();c.addPath(p);c.strokePath()}
  line([[13,33],[24,6],[36,33]]);line([[13,33],[20,36],[29,36],[36,33]]);line([[10,35],[5,39],[12,42],[24,43],[38,42],[43,39],[38,35]]);
  line([[17,31],[24,34],[33,31]]);
  line([[24,15],[26,20],[30,22],[26,24],[24,28],[22,24],[18,22],[22,20]],true);
  line([[39,9],[39,16]]);line([[36,12.5],[42,12.5]]);
  return c.getImage();
 }
 const top=widget.addStack();top.centerAlignContent();
 txt(top,"ZEELAND SURF CLUB",10,petrol,true);top.addSpacer();
 const dateLabel=best.date===localNow().slice(0,10)?"TODAY":new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"Europe/Amsterdam"}).format(new Date(best.date+"T12:00:00Z")).toUpperCase();
 txt(top,dateLabel,13,petrol,true);
 widget.addSpacer(7);
 const cards=widget.addStack();cards.spacing=7;cards.size=new Size(0,140);
 const scoreCard=cards.addStack();scoreCard.backgroundColor=panelColor;scoreCard.cornerRadius=12;scoreCard.setPadding(12,10,11,10);scoreCard.centerAlignContent();
 const scoreLeft=scoreCard.addStack();scoreLeft.layoutVertically();scoreLeft.spacing=1;
 const number=scoreLeft.addStack();number.bottomAlignContent();number.spacing=2;
 txt(number,best.score.toFixed(1),34,Color.white(),true);
 txt(number,"/10",15,Color.white(),true);
 txt(scoreLeft,grade,24,Color.white(),true);
 scoreCard.addSpacer(3);
 const waveRight=scoreCard.addStack();waveRight.layoutVertically();waveRight.centerAlignContent();waveRight.spacing=1;
 const img=waveRight.addImage(surfWave);img.imageSize=new Size(56,56);img.centerAlignImage();
 txt(waveRight,best.x.h.toFixed(1)+" m",19,Color.white(),true);
 cards.addSpacer();
 const wizard=cards.addStack();wizard.layoutVertically();wizard.backgroundColor=petrol;wizard.cornerRadius=12;wizard.setPadding(12,10,10,10);wizard.spacing=6;
 const wizardHead=wizard.addStack();wizardHead.centerAlignContent();wizardHead.spacing=4;
 const hat=wizardHead.addImage(wizardHat());hat.imageSize=new Size(34,34);
 txt(wizardHead,"WAVE WIZARD",11,new Color("#D6C5A5"),true);
 const character=E.waveCharacter(best.x).name;
 txt(wizard,character,20,ivory,true);
 txt(wizard,best.spotName,13,cream);
 widget.addSpacer(7);
 const bottom=widget.addStack();bottom.centerAlignContent();
 const timeText=pad(best.h)+":00–"+pad(best.h+2)+":00";
 txt(bottom,timeText,14,petrol,true);bottom.addSpacer();
 txt(bottom,best.x.period.toFixed(1)+" s · "+Math.round(best.x.wind)+" km/h",11,muted,true);
 widget.addSpacer();

 }
}catch(e){
 label("Forecast unavailable",16,"#ffffff",true);
 widget.addSpacer(7);label(String(e).slice(0,45),10);
 console.error(String(e));
}
widget.refreshAfterDate=new Date(Date.now()+30*60*1000);
Script.setWidget(widget);
if(config.runsInApp){
 if(config.widgetFamily==="accessoryRectangular")await widget.presentAccessoryRectangular();
 else await widget.presentMedium();
}
Script.complete();
