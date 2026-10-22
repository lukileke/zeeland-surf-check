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
 // Quality colour follows the actual numeric score, with a distinct band for each verdict.
 const qualityScore=best.score;
 const panelColor=new Color(qualityScore>=8?"#188344":qualityScore>=6.5?"#398B58":qualityScore>=4.5?"#879747":qualityScore>=3?"#B78343":"#A85B52");
 widget.backgroundColor=cream;widget.setPadding(10,13,10,13);
 function txt(parent,value,size,color,bold=false){const t=parent.addText(String(value));t.font=bold?Font.boldSystemFont(size):Font.systemFont(size);t.textColor=color;t.lineLimit=1;t.minimumScaleFactor=0.68;return t}
 function surfWaveImage(){
  // Two flowing white silhouettes, rounded to match the original surf-logo reference.
  const c=new DrawContext();c.size=new Size(72,48);c.opaque=false;c.respectScreenScale=true;
  c.setFillColor(Color.white());
  // Crop transparent space so the actual crest fills its image frame.
  const P=(x,y)=>new Point((x-12)*72/100,(y-26)*48/68);
  const crest=new Path();
  crest.move(P(18,76));
  crest.addCurve(P(39,45),P(27,63),P(31,52));
  crest.addCurve(P(59,33),P(45,37),P(53,33));
  crest.addCurve(P(79,40),P(69,30),P(79,32));
  crest.addCurve(P(75,53),P(81,46),P(79,52));
  crest.addCurve(P(65,50),P(71,55),P(65,54));
  crest.addCurve(P(68,43),P(65,47),P(66,44));
  crest.addCurve(P(53,48),P(63,38),P(57,40));
  crest.addCurve(P(37,65),P(47,54),P(43,60));
  crest.addCurve(P(18,76),P(30,70),P(23,74));
  crest.closeSubpath();c.addPath(crest);c.fillPath();
  const flow=new Path();
  flow.move(P(16,85));
  flow.addCurve(P(47,74),P(28,78),P(37,73));
  flow.addCurve(P(75,79),P(60,74),P(65,80));
  flow.addCurve(P(109,62),P(91,79),P(103,69));
  flow.addCurve(P(79,89),P(101,82),P(91,89));
  flow.addCurve(P(47,83),P(65,88),P(59,80));
  flow.addCurve(P(16,89),P(34,80),P(24,86));
  flow.closeSubpath();c.addPath(flow);c.fillPath();
  return c.getImage();
 }
 const surfWave=surfWaveImage();
 function wizardHat(){
  // Simple outlined conical hat: no internal decoration, only an exterior sparkle.
  const c=new DrawContext();c.size=new Size(48,48);c.opaque=false;c.respectScreenScale=true;
  c.setStrokeColor(ivory);c.setLineWidth(3);
  const cone=new Path();cone.move(new Point(13,33));cone.addCurve(new Point(25,7),new Point(18,24),new Point(22,12));cone.addCurve(new Point(35,33),new Point(28,17),new Point(32,26));c.addPath(cone);c.strokePath();
  const brim=new Path();brim.move(new Point(9,35));brim.addCurve(new Point(39,35),new Point(16,43),new Point(33,43));c.addPath(brim);c.strokePath();
  const sparkle=new Path();sparkle.move(new Point(40,10));sparkle.addLine(new Point(40,18));sparkle.move(new Point(36,14));sparkle.addLine(new Point(44,14));c.addPath(sparkle);c.strokePath();
  return c.getImage();
 }
 // Compact symmetrical cards; natural centring instead of forced 3-row grids.
 const edgeTextSize=11,cardGap=8,cardHeight=111,innerPad=10;
 const cardWidth=Math.floor((Device.screenSize().width-64-26-cardGap)/2);
 const contentWidth=cardWidth*2+cardGap;
 const top=widget.addStack();top.size=new Size(contentWidth,0);top.centerAlignContent();
 txt(top,"ZEELAND SURF CLUB",edgeTextSize,petrol,true);top.addSpacer();
 const dateLabel=best.date===localNow().slice(0,10)?"TODAY":new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"Europe/Amsterdam"}).format(new Date(best.date+"T12:00:00Z")).toUpperCase();
 txt(top,dateLabel,edgeTextSize,petrol,true);
 widget.addSpacer(5);
 const cards=widget.addStack();cards.spacing=cardGap;cards.size=new Size(contentWidth,cardHeight);
 const scoreCard=cards.addStack();scoreCard.size=new Size(cardWidth,cardHeight);scoreCard.backgroundColor=panelColor;scoreCard.cornerRadius=12;scoreCard.setPadding(innerPad,innerPad,innerPad,innerPad);scoreCard.centerAlignContent();
 const scoreLeft=scoreCard.addStack();scoreLeft.layoutVertically();scoreLeft.spacing=2;
 const number=scoreLeft.addStack();number.bottomAlignContent();number.spacing=1;
 txt(number,best.score.toFixed(1),30,Color.white(),true);
 txt(number,"/10",12,Color.white(),true);
 txt(scoreLeft,grade,22,Color.white(),true);
 const waveSpace=scoreCard.addStack();waveSpace.centerAlignContent();waveSpace.addSpacer();
 const waveBlock=waveSpace.addStack();waveBlock.layoutVertically();waveBlock.centerAlignContent();waveBlock.spacing=1;
 const waveEmoji=txt(waveBlock,"🌊",30,Color.white());waveEmoji.centerAlignText();
 const waveHeight=txt(waveBlock,best.x.h.toFixed(1)+" m",17,Color.white(),true);waveHeight.centerAlignText();
 waveSpace.addSpacer();
 const wizard=cards.addStack();wizard.size=new Size(cardWidth,cardHeight);wizard.layoutVertically();wizard.backgroundColor=petrol;wizard.cornerRadius=12;wizard.setPadding(innerPad,innerPad,innerPad,innerPad);wizard.spacing=2;
 const wizardHead=wizard.addStack();wizardHead.centerAlignContent();wizardHead.spacing=3;
 const hat=wizardHead.addImage(wizardHat());hat.imageSize=new Size(25,25);
 txt(wizardHead,"WAVE WIZARD",10,new Color("#D6C5A5"),true);
 wizard.addSpacer();
 const verdict=E.waveCharacter(best.x);
 const verdictLine=wizard.addStack();verdictLine.centerAlignContent();verdictLine.spacing=0;
 const verdictColumn=verdictLine.addStack();verdictColumn.layoutVertically();verdictColumn.spacing=0;
 const words=verdict.name.split(" ");
 let first=verdict.name,second="";
 if(verdict.name.length>12){
  if(words.length===2){first=words[0];second=words[1];}
  else if(words.length===3){first=words[0];second=words.slice(1).join(" ");}
  else {first=words.slice(0,2).join(" ");second=words.slice(2).join(" ");}
 }
 const verdictFirst=txt(verdictColumn,first,18,ivory,true);verdictFirst.minimumScaleFactor=0.72;
 if(second){const verdictSecond=txt(verdictColumn,second,18,ivory,true);verdictSecond.minimumScaleFactor=0.72;}
 const emojiArea=verdictLine.addStack();emojiArea.centerAlignContent();emojiArea.addSpacer();
 const verdictEmoji=txt(emojiArea,verdict.emoji||"✦",34,ivory);verdictEmoji.centerAlignText();
 emojiArea.addSpacer();
 wizard.addSpacer();
 txt(wizard,best.spotName,12,cream);
 widget.addSpacer(5);
 const bottom=widget.addStack();bottom.size=new Size(contentWidth,0);bottom.centerAlignContent();
 const timeText=pad(best.h)+":00–"+pad(best.h+2)+":00";
 txt(bottom,timeText,edgeTextSize,petrol,true);bottom.addSpacer();
 txt(bottom,best.x.period.toFixed(1)+" s · "+Math.round(best.x.wind)+" km/h",edgeTextSize,petrol,true);

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
