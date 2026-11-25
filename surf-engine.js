/* Zeeland Surf Check shared scoring engine. Used by web app and iOS widget. */
(function(root){
/* Emoji field retained as empty for backwards compatibility; approved SVG iconIds will replace it. */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angle=(a,b)=>Math.abs(((a-b+540)%360)-180);
const surfProfiles=[
 {name:'Domburg',min:.45,ideal:1.05,max:2.05,periodMin:4.2,periodIdeal:8.0},
 {name:'Westkapelle',min:.55,ideal:1.15,max:2.15,periodMin:4.5,periodIdeal:8.0},
 {name:'Oostkapelle',min:.45,ideal:.95,max:1.85,periodMin:4.2,periodIdeal:7.8},
 {name:'Cadzand',min:.45,ideal:.95,max:1.9,periodMin:4.2,periodIdeal:7.8},
 {name:'Brouwersdam',min:.5,ideal:1.05,max:1.95,periodMin:4.3,periodIdeal:8.0}
];
function qualityComponents(h,period,wd,wind,dir,orientation,ai){
 const p=surfProfiles[ai],off=(orientation+180)%360;
 const windQuality=clamp(10-angle(dir,off)/18,0,10)*clamp(1-Math.max(0,wind-14)/40,.15,1);
 const swellQuality=clamp(10-angle(wd,orientation)/15,0,10);
 const heightQuality=h<p.min?clamp(6*h/p.min,0,6):h<=p.ideal?6+4*(h-p.min)/(p.ideal-p.min):clamp(10-8*(h-p.ideal)/(p.max-p.ideal),0,10);
 const periodQuality=clamp(10*(period-p.periodMin)/(p.periodIdeal-p.periodMin),0,10);
 const surf=clamp(.3*windQuality+.25*swellQuality+.25*heightQuality+.2*periodQuality,0,10);
 return {windQuality,swellQuality,heightQuality,periodQuality,surf};
}


function weatherPenalty(p,c){let x=p>=7?2.5:p>=2?1.2:p>=.5?.4:p>0?.1:0;return x+(c===48?3:c===45?1.5:0)+(c>=95&&c<=99?5:0)}
function waveCharacter(x){if(!x)return {name:'Forecast unavailable',emoji:'',description:'No wave data for this window.'};let name,emoji,detail;if(x.wind>=38){name='Wild & Windy';emoji='';detail='Strong wind is likely to disrupt the surface and make paddling demanding.'}else if(x.period<5&&x.wind>=18){name='Choppy & Messy';emoji='';detail='Short-period wind waves with closely spaced, bumpy sections.'}else if(x.h<.45){name='Tiny & Tricky';emoji='';detail='Small waves: bring extra volume if you want to catch more rides.'}else if(x.period<5){name='Short & Soft';emoji='〰';detail='Very short-period waves may arrive close together; the shape and push at the beach remain uncertain.'}else if(x.period>=8&&x.wind<20&&x.h<=1.7){name='Clean Lines';emoji='';detail='Longer-period energy and relatively light wind could offer more defined lines.'}else if(x.period>=5.5&&x.h<=1.5&&x.wind<25){name='Mellow & Cruisy';emoji='';detail='Potentially playful waves for relaxed trimming, carving and smooth turns.'}else if(x.h>=1.8){name='Punchy & Powerful';emoji='';detail='More energy and potentially challenging sections; check the break carefully.'}else if(x.wind<20){name='Easygoing Sessions';emoji='';detail='Manageable-looking conditions, though actual wave shape depends on the beach.'}else{name='Mixed Bag';emoji='';detail='Variable conditions: some rideable sections may be mixed with chop.'}return {name,emoji,description:detail+' Modelled waves '+x.h.toFixed(1)+' m · '+x.period.toFixed(1)+' s · wind '+x.wind.toFixed(0)+' km/h. These are offshore indicators, not measured breaking-wave shape.'}}
/* FARO READ: model-derived editorial interpretation. No change to the
   numeric Surf Quality algorithm; wording never claims measured surf, tides
   or actual breaking-wave shape. Both web and Scriptable use this function. */
function quickRead(x,locale='en'){
 const es=locale==='es';
 if(!x||![x.h,x.period,x.wind].every(Number.isFinite)){
  return {key:'unknown',headline:es?'Sin lectura disponible':'No model read available',
   detail:es?'Revisa los datos de pronóstico antes de decidir.':'Check the model forecast before deciding.',
   short:es?'Sin datos':'No data'};
 }
 const storm=Number.isFinite(x.code)&&x.code>=95&&x.code<=99;
 const gust=Number.isFinite(x.gust)?x.gust:0;
 let key='mixed';
 if(storm)key='storm';
 else if(gust>=75||x.wind>=55)key='windRisk';
 else if(x.wind>=38)key='windy';
 else if(x.period<5&&x.wind>=18)key='choppy';
 else if(x.h<.45)key='small';
 else if(x.period<5)key='short';
 else if(x.period>=8&&x.wind<20&&x.h<=1.7)key='clean';
 else if(x.period>=5.5&&x.h<=1.5&&x.wind<25)key='mellow';
 else if(x.h>=1.8)key='powerful';
 else if(x.wind<20)key='easy';
 const reads={
  storm:[
   'Modelled thunderstorm risk','Modelo: riesgo de tormentas',
   'Thunderstorms may affect this window. Check KNMI and local warnings before entering the water.',
   'Podrían producirse tormentas. Revisa KNMI y las alertas locales antes de entrar al agua.',
   'Storm risk','Riesgo de tormenta'],
  windRisk:[
   'Very strong wind signal','Viento muy intenso',
   'The model indicates potentially dangerous wind. Check official warnings; this is not a safety clearance.',
   'El modelo indica viento potencialmente peligroso. Revisa las alertas oficiales; esto no garantiza seguridad.',
   'Strong wind risk','Viento intenso'],
  windy:[
   'Wind may dominate','El viento puede dominar',
   'Strong wind could make the surface messy and paddling harder. Actual conditions may vary.',
   'El viento fuerte podría desordenar el mar y dificultar la remada. Las condiciones reales pueden variar.',
   'Windy surf','Surf ventoso'],
  choppy:[
   'Short-period, bumpy surf','Mar picado y período corto',
   'Short-period waves and wind suggest less organised sections. Check the actual break.',
   'El período corto y el viento sugieren secciones más desordenadas. Revisa cómo está quebrando.',
   'Choppy','Mar picado'],
  small:[
   'Small, lower-energy waves','Olas pequeñas y con poca fuerza',
   'The model suggests limited push. A board with more volume may help, depending on the break.',
   'El modelo sugiere poca fuerza. Una tabla con más volumen podría ayudar, según el spot.',
   'Small waves','Olas pequeñas'],
  short:[
   'Short-period, closely spaced waves','Olas de período corto y próximas entre sí',
   'With a very short modelled period, waves may be closely spaced; check the actual beach for shape and rideability.',
   'Con un período modelado muy corto, las olas podrían llegar muy juntas. Revisa la playa para conocer su forma y si son surfeables.',
   'Short period','Período corto'],
  clean:[
   'Potentially more organised','Podría estar más ordenado',
   'Longer-period energy and lighter wind could help the wave shape. Not a measured beach report.',
   'El mayor período y el viento suave podrían favorecer la forma de las olas. No son mediciones de la playa.',
   'Cleaner potential','Posible orden'],
  mellow:[
   'Mellow, flowing potential','Potencial para surf fluido',
   'Moderate swell and manageable wind could favour a relaxed session. Check the break before leaving.',
   'El swell moderado y el viento manejable podrían favorecer un surf fluido. Revisa el spot antes de salir.',
   'Mellow & cruisy','Mellow y fluido'],
  powerful:[
   'More energy in the water','Más energía en el agua',
   'Larger modelled waves could mean more demanding sections; local breaking size can differ.',
   'Las olas modeladas son más grandes y podrían traer secciones exigentes. La rompiente real puede variar.',
   'More powerful','Más fuerza'],
  easy:[
   'Manageable-looking outlook','Pronóstico relativamente manejable',
   'Relatively light wind could help, but the actual wave face depends on the local break.',
   'El viento relativamente suave podría ayudar, pero la pared real depende de cómo quiebre la ola.',
   'Easygoing potential','Potencial tranquilo'],
  mixed:[
   'Mixed conditions ahead','Condiciones variables',
   'Wave energy and wind point to an uneven outlook. Expect variability and check local conditions.',
   'El oleaje y el viento apuntan a condiciones variables. Revisa cómo está la playa antes de ir.',
   'Mixed outlook','Pronóstico mixto']
 };
 const v=reads[key];
 return {key,headline:v[es?1:0],detail:v[es?3:2],short:v[es?5:4]};
}
function evaluate(x,orientation,ai){const q=qualityComponents(x.h,x.period,x.wd,x.wind,x.dir,orientation,ai);const penalty=weatherPenalty(x.precip,x.code);return {...q,penalty,v:Math.round(clamp(q.surf-penalty,0,10)*10)/10};}

// FARO model contract v1. Shared by the web, ranking and Scriptable.
// All bearings are FROM; missing observations are null, never fabricated zero.
const finite=Number.isFinite;
const mean=a=>{const v=a.filter(finite);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};
const circleMean=a=>{const v=a.filter(finite);if(!v.length)return null;const x=v.reduce((n,d)=>n+Math.cos(d*Math.PI/180),0),y=v.reduce((n,d)=>n+Math.sin(d*Math.PI/180),0);return Math.hypot(x,y)<1e-6?null:((Math.atan2(y,x)*180/Math.PI)%360+360)%360};
const round=(v,n=1)=>finite(v)?Math.round(v*10**n)/10**n:null;
const at=(row,key,i)=>finite(row?.[key]?.[i])?row[key][i]:null;
const marineRequiredFields="wave_height,wave_direction,wave_period,sea_surface_temperature";
const marineFields="wave_height,wave_direction,wave_period,sea_surface_temperature,swell_wave_height,swell_wave_direction,swell_wave_period,secondary_swell_wave_height,secondary_swell_wave_direction,secondary_swell_wave_period,tertiary_swell_wave_height,tertiary_swell_wave_direction,tertiary_swell_wave_period,wind_wave_height,wind_wave_direction,wind_wave_period";
const weatherFields="wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover,weather_code,temperature_2m,apparent_temperature";
function readHour(m,w,i,j){
 if(!Number.isInteger(i)||!Number.isInteger(j)||m?.time?.[i]===undefined||m.time[i]!==w?.time?.[j])return null;
 const M=k=>at(m,k,i),W=k=>at(w,k,j);
 const partition=prefix=>{const p={heightM:M(prefix+"_wave_height"),periodS:M(prefix+"_wave_period"),fromDeg:M(prefix+"_wave_direction")};return Object.values(p).every(finite)&&p.heightM>=0&&p.periodS>0?p:null};
 const x={h:M("wave_height"),period:M("wave_period"),wd:M("wave_direction"),wind:W("wind_speed_10m"),dir:W("wind_direction_10m"),gust:W("wind_gusts_10m"),precip:W("precipitation"),code:W("weather_code"),cloud:W("cloud_cover"),air:W("temperature_2m"),feels:W("apparent_temperature"),water:M("sea_surface_temperature"),primarySwell:partition("swell"),secondarySwell:partition("secondary_swell"),tertiarySwell:partition("tertiary_swell"),windSea:partition("wind"),windSeaHeightM:M("wind_wave_height")};
 if(![x.h,x.period,x.wd,x.wind,x.dir].every(finite)||x.h<0||x.period<=0||x.wind<0)return null;
 return x;
}
function averagePartition(rows,key){
 const a=rows.map(x=>x[key]);if(!a.every(Boolean))return null;
 const p={heightM:mean(a.map(x=>x.heightM)),periodS:mean(a.map(x=>x.periodS)),fromDeg:circleMean(a.map(x=>x.fromDeg))};
 return Object.values(p).every(finite)?p:null;
}
function scienceInput(rows){
 if(!Array.isArray(rows)||rows.length!==2||!rows.every(Boolean))return null;
 const primary=averagePartition(rows,"primarySwell"),windFromDeg=circleMean(rows.map(x=>x.dir));
 if(!primary||!finite(windFromDeg))return null;
 const completeMean=k=>rows.every(x=>finite(x[k]))?mean(rows.map(x=>x[k])):null;
 return {swellHeightM:primary.heightM,swellPeriodS:primary.periodS,swellFromDeg:primary.fromDeg,swellDirection:primary.fromDeg,
  secondarySwell:averagePartition(rows,"secondarySwell"),tertiarySwell:averagePartition(rows,"tertiarySwell"),windSea:averagePartition(rows,"windSea"),windSeaHeightM:completeMean("windSeaHeightM"),totalWaveHeightM:completeMean("h"),windFromDeg,windDirection:windFromDeg,windKmh:completeMean("wind"),gustKmh:rows.every(x=>finite(x.gust))?Math.max(...rows.map(x=>x.gust)):null};
}
function windowSamples(m,w,date,hour){
 if(!Array.isArray(m?.time)||!Array.isArray(w?.time)||!Number.isInteger(hour))return null;
 const stamps=[hour,hour+1].map(h=>date+"T"+String(h).padStart(2,"0")+":00");
 const rows=stamps.map(t=>{const i=m.time.indexOf(t),j=w.time.indexOf(t);return readHour(m,w,i,j)});
 return rows.every(Boolean)?rows:null;
}
// Retain the raw Zeeland quality equation; separately apply the common
// conservative recommendation policy. No regional recalibration is implied.
const known=new Set(["none","caution","danger","unknown"]);
function decideSession({potentialScore=null,slotRisk="unknown",access=null,officialAlert=null,modelCoverage="unknown",daylight=true,windSpeedRangeKmh=null}={}){
 const raw=finite(potentialScore)?Math.max(0,Math.min(10,potentialScore)):null;
 const restricted=access?.publicRecommendationAllowed===false||
   (access?.status==="restriction_reported_not_live_verified"&&access?.clearanceVerified!==true);
 // External official alerts are accepted only with traceable, independently
 // fetched evidence. We DO NOT claim FARO automatically checks these.
 const verified=officialAlert?.verified===true &&
  typeof officialAlert?.authority==="string"&&officialAlert.authority.trim() &&
  /^https:\/\//.test(officialAlert.sourceUrl||"") &&
  !Number.isNaN(Date.parse(officialAlert.checkedAtUtc||""));
 const officialLevel=verified&&known.has(officialAlert?.level)?officialAlert.level:null;
 const risk=known.has(slotRisk)?slotRisk:"unknown";
 const hard=restricted||officialLevel==="danger"||risk==="danger";
 const blocked=hard||!daylight||raw===null||risk==="unknown"||modelCoverage!=="complete";
 const caution=risk==="caution"||officialLevel==="caution";
 // Bounded, explicit conservative *session* policy: when caution is known,
 // cap recommended opportunity at 5.9, but preserve raw offshore potential.
 // Explicitly provisional forecast-window regulariser (not empirically
 // fitted): rapid 2-hour changes may reduce usable time inside the window.
 // No assumption of a 'stable' sea state if optional variability is absent.
 const variationPenalty=finite(windSpeedRangeKmh)&&windSpeedRangeKmh>10?
  round(Math.min(0.5,(windSpeedRangeKmh-10)/40)):0;
 const adjusted=blocked?null:round(Math.max(0,
  (caution?Math.min(raw,5.9):raw)-variationPenalty));
 const reasons=[];
 if(restricted)reasons.push("reported_access_restriction");
 if(officialLevel==="danger")reasons.push("verified_official_danger");
 if(risk==="danger")reasons.push("dangerous_model_window");
 if(risk==="unknown")reasons.push("risk_data_incomplete");
 if(!daylight)reasons.push("no_daylight");
 if(raw===null)reasons.push("no_potential_score");
 if(modelCoverage!=="complete")reasons.push("forecast_incomplete");
 if(caution)reasons.push("model_or_official_caution");
 return Object.freeze({
  potentialScore:raw,sessionScore:adjusted,canRecommend:!blocked,
  windVariabilityAdjustment:variationPenalty,
  windVariabilityEvidence:finite(windSpeedRangeKmh)?"complete_2h_model":"not_measured",
  status:hard?"blocked":blocked?"unassessed":caution?"caution":"eligible",
  reasons,officialAlertChecked:verified,officialLevel,
  safetyProbability:null,confidenceInterval:null,
  policy:"faro-session-policy-v0.5",
  warning:"Advisory gate, not a certified safety forecast; official warnings are not synchronised automatically."
 });
}

function zeelandRisk(rows){
 if(!Array.isArray(rows)||rows.length!==2)return "unknown";
 const danger=rows.some(x=>finite(x.code)&&x.code>=95&&x.code<=99||finite(x.gust)&&x.gust>=75||finite(x.wind)&&x.wind>=55||x.code===48||finite(x.h)&&x.h>=3||finite(x.water)&&x.water<7);
 if(danger)return "danger";
 const caution=rows.some(x=>finite(x.gust)&&x.gust>=50||finite(x.wind)&&x.wind>=35||finite(x.h)&&x.h>=2||x.code===45||finite(x.precip)&&x.precip>=7);
 if(!rows.every(x=>[x.gust,x.wind,x.code,x.precip].every(finite)))return "unknown";
 return caution?"caution":"none";
}
function summarizeWindow(rows,orientation,ai){
 if(!Array.isArray(rows)||rows.length!==2||!rows.every(Boolean)||!surfProfiles[ai])return null;
 const scored=rows.map(x=>({...x,...evaluate(x,orientation,ai)})),last=scored[1];
 const avg=k=>mean(scored.map(x=>x[k])),optional=k=>scored.every(x=>finite(x[k]))?avg(k):null;
 const maximum=k=>scored.every(x=>finite(x[k]))?Math.max(...scored.map(x=>x[k])):null;
 const wd=circleMean(scored.map(x=>x.wd)),dir=circleMean(scored.map(x=>x.dir));
 // A contradictory mean direction is unknown, not an invented 0 degrees.
 // Retain no window if the direction cannot be represented coherently.
 if(!finite(wd)||!finite(dir))return null;
 const rawScore=round(avg("v")),windSpeedRangeKmh=Math.abs(rows[0].wind-rows[1].wind),risk=zeelandRisk(rows),decision=decideSession({potentialScore:rawScore,slotRisk:risk,modelCoverage:"complete",daylight:true,windSpeedRangeKmh});
 return {...last,h:avg("h"),period:avg("period"),wd,wind:avg("wind"),dir,
  gust:maximum("gust"),code:scored.some(x=>finite(x.code)&&x.code>=95&&x.code<=99)?95:maximum("code"),
  precip:optional("precip"),air:optional("air"),feels:optional("feels"),water:optional("water"),cloud:optional("cloud"),
  windQuality:avg("windQuality"),swellQuality:avg("swellQuality"),heightQuality:avg("heightQuality"),periodQuality:avg("periodQuality"),
  surf:round(avg("surf")),penalty:avg("penalty"),v:decision.sessionScore??rawScore,rawScore,sessionScore:decision.sessionScore,canRecommend:decision.canRecommend,risk,decision,modelCoverage:"complete",science:scienceInput(rows),
  windSpeedRangeKmh,scoreVersion:"zeeland-operational-v1+session-policy-v0.5"};
}
function eligibleWindow(date,hour,rise,set,now){
 if(![hour,rise,set,now?.minutes].every(finite)||typeof date!=="string"||typeof now?.date!=="string")return null;
 const from=Math.max(hour*60,rise+15),to=Math.min((hour+2)*60,set-30),available=Math.max(0,to-from);
 return {from,to,available,valid:available>=40,upcoming:available>=40&&(date>now.date||(date===now.date&&to-now.minutes>=40))};
}
root.FaroModelCore=Object.freeze({version:"1.0.0",mean,circleMean,readHour,windowSamples,summarizeWindow,scienceInput,eligibleWindow,marineFields,marineRequiredFields,weatherFields,decideSession,zeelandRisk});

root.ZeelandEngine={surfProfiles,qualityComponents,weatherPenalty,waveCharacter,quickRead,evaluate};
})(typeof globalThis!=='undefined'?globalThis:this);
