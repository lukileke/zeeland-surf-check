/* FARO Chile live model adapter v0.2 | Valparaíso only.
 * This module does NOT return locally observed breaking-wave height,
 * calibrated spot quality or official Chilean alert status.
 * Marine variables and weather are from Open-Meteo, nominally refreshed.
 * The spot-dependent fit is guide-based and explicitly experimental.
 */
(function(root){
"use strict";
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const mean=a=>{const f=a.filter(finite);return f.length?f.reduce((x,y)=>x+y,0)/f.length:null};
const max=a=>{const f=a.filter(finite);return f.length?Math.max(...f):null};
// Distance from a documented coastal reference point to the actual model grid.
// It is NOT the distance to a confirmed breaking-wave location.
function gridDistanceKm(aLat,aLon,bLat,bLon){
 if(![aLat,aLon,bLat,bLon].every(finite))return null;
 const rad=Math.PI/180,dl=(bLat-aLat)*rad,dLon=(bLon-aLon)*rad;
 const z=Math.sin(dl/2)**2+Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(z),Math.sqrt(Math.max(0,1-z)));
}
const circleMean=a=>{
 const f=a.filter(finite);if(!f.length)return null;
 const sin=f.reduce((z,n)=>z+Math.sin(n*Math.PI/180),0),cos=f.reduce((z,n)=>z+Math.cos(n*Math.PI/180),0);
 if(Math.hypot(sin,cos)<1e-6)return null;
 return ((Math.atan2(sin,cos)*180/Math.PI)%360+360)%360;
};
// Numeric forecast instants are UTC epoch seconds; render in the real IANA zone.
function wallClock(instant,zone){
 if(!finite(instant))return String(instant);
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",
  day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(instant*1000));
 const p=Object.fromEntries(parts.map(v=>[v.type,v.value]));
 return p.year+"-"+p.month+"-"+p.day+"T"+p.hour+":"+p.minute;
}
const utcInstant=instant=>finite(instant)?new Date(instant*1000).toISOString():null;
const dateFromTime=t=>String(t).slice(0,10);
const hh=t=>parseInt(String(t).slice(11,13),10);
const minutes=t=>{const n=String(t).match(/T(\d\d):(\d\d)/);return n?Number(n[1])*60+Number(n[2]):null};
const cardinal=n=>{if(!finite(n))return "—";const dirs=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];return dirs[Math.round(((n%360)+360)%360/22.5)%16]};
const dayNames={es:["dom","lun","mar","mié","jue","vie","sáb"],en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]};
function formatDay(date,locale="es"){
 const d=new Date(date+"T12:00:00Z");
 const weekday=dayNames[locale==="es"?"es":"en"][d.getUTCDay()];
 return weekday+" "+Number(date.slice(8,10));
}
function statusUV(n,locale="es"){
 const tr=(es,en)=>locale==="es"?es:en;
 if(!finite(n))return {category:"unknown",name:tr("Sin datos UV","UV unavailable"),protection:null};
 if(n<3)return {category:"low",name:tr("Bajo","Low"),protection:tr("Radiación baja; protege la piel igualmente durante exposiciones largas.","Low UV; still consider sun protection for long exposure.")};
 if(n<6)return {category:"moderate",name:tr("Moderado","Moderate"),protection:tr("Usa protección solar; se recomienda desde UV 3.","Use sun protection; recommended from UV 3.")};
 if(n<8)return {category:"high",name:tr("Alto","High"),protection:tr("Ropa, protección solar y descansos a la sombra.","Sun protection, clothing and shade breaks.")};
 if(n<11)return {category:"very-high",name:tr("Muy alto","Very high"),protection:tr("Protección reforzada y evita exposición prolongada al mediodía.","Extra protection; avoid prolonged midday exposure.")};
 return {category:"extreme",name:tr("Extremo","Extreme"),protection:tr("Evita exposición directa prolongada y refuerza la protección.","Avoid prolonged direct exposure and increase protection.")};
}
function buildUrls(spot,config){
 if(!finite(spot.latitude)||!finite(spot.longitude))
  throw Error("Pilot location metadata invalid");
 const common={latitude:spot.latitude,longitude:spot.longitude,timezone:config.timezone,
  timeformat:"unixtime",forecast_days:"7"};
 const marine=new URL(config.modelProviders.marine);
 marine.search=new URLSearchParams({...common,cell_selection:"sea",hourly:config.modelProviders.requiredVariables.marine.join(",")}).toString();
 const weather=new URL(config.modelProviders.weather);
 weather.search=new URLSearchParams({...common,hourly:config.modelProviders.requiredVariables.weather.join(","),daily:"sunrise,sunset,uv_index_max,precipitation_sum",wind_speed_unit:"kmh",temperature_unit:"celsius",precipitation_unit:"mm"}).toString();
 return {marine:marine.toString(),weather:weather.toString()};
}
async function fetchJSON(url,fetcher){
 const res=await fetcher(url);
 if(!res||!res.ok)throw Error("HTTP "+(res?.status||"unknown")+" from model provider");
 return res.json();
}
function hourMap(data,fields,zone){
 const timestamps=data?.hourly?.time||[];
 const out=new Map(),ambiguous=new Set();
 for(let i=0;i<timestamps.length;i++){
  const stamp=wallClock(timestamps[i],zone);
  // On a fall-back DST transition the same wall-clock hour may occur twice.
  // Without an absolute UTC offset we cannot match these hours safely across
  // providers, so exclude both occurrences rather than silently overwrite.
  if(ambiguous.has(stamp))continue;
  if(out.has(stamp)){out.delete(stamp);ambiguous.add(stamp);continue}
  const row={time:stamp,validAtUtc:utcInstant(timestamps[i])};
  for(const key of fields)row[key]=finite(data?.hourly?.[key]?.[i])?data.hourly[key][i]:null;
  out.set(stamp,row);
 }
 return out;
}
function summarize(slotHours,marineHours,weatherHours,profileConfig,spot,config,locale){
 const date=slotHours[0].slice(0,10),startHour=hh(slotHours[0]);
 const mar=slotHours.map(t=>marineHours.get(t)).filter(Boolean);
 const met=slotHours.map(t=>weatherHours.get(t)).filter(Boolean);
 // Do not average 1 valid hour into a 2-hour session and present it as complete.
 // Every hourly input required for the experimental fit must exist at BOTH
 // matching local timestamps; weather and marine hours must overlap exactly.
 const requiredMarine=["wave_height","wave_direction","wave_period","swell_wave_height","swell_wave_direction","swell_wave_period"];
 const requiredWeather=["wind_speed_10m","wind_direction_10m"];
 const complete=slotHours.every(t=>{
  const m=marineHours.get(t),w=weatherHours.get(t);
  return m&&w&&requiredMarine.every(k=>finite(m[k]))&&requiredWeather.every(k=>finite(w[k]));
 });
 const coverage={expectedHours:slotHours.length,marineHours:mar.length,weatherHours:met.length,complete};
 const vals=(rows,key)=>rows.map(x=>x[key]);
 const height=mean(vals(mar,"wave_height")),swellHeight=mean(vals(mar,"swell_wave_height"));
 const swellDirection=circleMean(vals(mar,"swell_wave_direction"));
 const totalDirection=circleMean(vals(mar,"wave_direction"));
 const windSeaHeight=mean(vals(mar,"wind_wave_height"));
 const windSeaDirection=circleMean(vals(mar,"wind_wave_direction"));
 const swellPeriod=mean(vals(mar,"swell_wave_period"));
 const totalPeriod=mean(vals(mar,"wave_period"));
 const wind=mean(vals(met,"wind_speed_10m"));
 const gust=max(vals(met,"wind_gusts_10m"));
 const windDirection=circleMean(vals(met,"wind_direction_10m"));
 const uvIndex=max(vals(met,"uv_index"));
 const temperature=mean(vals(met,"temperature_2m"));
 const sst=mean(vals(mar,"sea_surface_temperature"));
 const cloud=mean(vals(met,"cloud_cover"));
 const precip=vals(met,"precipitation").filter(finite).reduce((a,b)=>a+b,0);
 const precipMissing=vals(met,"precipitation").every(v=>!finite(v));
 const weatherCode=max(vals(met,"weather_code"));
 const validTimesUtc=slotHours.map(t=>weatherHours.get(t)?.validAtUtc).filter(Boolean);
 const fields={windFromDeg:windDirection,windKmh:wind,gustKmh:gust,swellFromDeg:swellDirection,swellPeriodS:swellPeriod,swellHeightM:swellHeight};
 const score=root.FaroChileScoreLab?.evaluate(profileConfig,spot.id,complete?fields:{},{locale})||{score:null,status:"unavailable",tags:[]};
 const modelComplete=complete&&[height,totalDirection,totalPeriod,wind].every(finite);
 return {
  spotId:spot.id,date,hour:startHour,label:String(startHour).padStart(2,"0")+":00–"+String(startHour+2).padStart(2,"0")+":00",
  modelComplete,coverage,validTimesUtc,score:score.score,scoreMeta:score,
  totalWaveHeightM:height,totalWaveDirection:totalDirection,totalWavePeriodS:totalPeriod,
  windSeaHeightM:windSeaHeight,windSeaDirection,
  swellHeightM:swellHeight,swellDirection,swellPeriodS:swellPeriod,
  windKmh:wind,windDirection,gustKmh:gust,uvIndex,uv:statusUV(uvIndex,locale),
  temperatureC:temperature,waterTemperatureC:sst,cloudPercent:cloud,precipitationMm:precipMissing?null:precip,
  weatherCode,weatherSource:"Open-Meteo",observed:false,nearshoreHeightEstimated:false
 };
}
function daylight(slot,sunrise,sunset,minMinutes){
 const a=slot.hour*60,b=a+120,rise=minutes(sunrise),set=minutes(sunset);
 if(!finite(rise)||!finite(set))return {eligible:false,minutes:null};
 const visible=Math.max(0,Math.min(b,set)-Math.max(a,rise));
 return {eligible:visible>=minMinutes,minutes:visible};
}
function extract(config,spot,marine,weather,profileConfig,locale="es"){
 if(!marine?.hourly?.time?.length||!weather?.hourly?.time?.length)
  throw Error("Model response lacks hourly data");
 const marineHours=hourMap(marine,config.modelProviders.requiredVariables.marine,config.timezone);
 const weatherHours=hourMap(weather,config.modelProviders.requiredVariables.weather,config.timezone);
 const weatherTimes=weather.hourly.time;
 const days=[];
 // Derive dates from actual hourly instants. Daily timestamps may encode
 // midnight using a fixed UTC offset across daylight-saving transitions.
 const dailyDates=typeof weatherTimes[0]==="number"?
  [...new Set(weatherTimes.map(t=>dateFromTime(wallClock(t,config.timezone))))].slice(0,7):
  (weather.daily?.time?.length?weather.daily.time:[...new Set(weatherTimes.map(dateFromTime))].slice(0,7));
 for(let di=0;di<7;di++){
  const date=dailyDates[di];if(!date)continue;
  const slots=[];
  for(let hour=config.slots.startHour;hour<config.slots.endHour;hour+=config.slots.stepHours){
   const times=Array.from({length:config.slots.stepHours},(_,i)=>date+"T"+String(hour+i).padStart(2,"0")+":00");
   const x=summarize(times,marineHours,weatherHours,profileConfig,spot,config,locale);
   const sunrise=wallClock(weather.daily?.sunrise?.[di],config.timezone);
   const sunset=wallClock(weather.daily?.sunset?.[di],config.timezone);
   x.daylight=daylight(x,sunrise,sunset,config.slots.minDaylightMinutes);
   x.daylightMinutes=x.daylight.minutes;
   slots.push(x);
  }
  const eligible=slots.filter(x=>x.daylight.eligible&&finite(x.score));
  const best=eligible.length?[...eligible].sort((a,b)=>b.score-a.score||a.hour-b.hour)[0]:null;
  days.push({date,index:di,slots,best,
   sunrise:weather.daily?.sunrise?.[di]==null?null:wallClock(weather.daily.sunrise[di],config.timezone),
   sunset:weather.daily?.sunset?.[di]==null?null:wallClock(weather.daily.sunset[di],config.timezone),
   uvMax:finite(weather.daily?.uv_index_max?.[di])?weather.daily.uv_index_max[di]:null,
   precipitationDailyMm:finite(weather.daily?.precipitation_sum?.[di])?weather.daily.precipitation_sum[di]:null});
 }
 if(!days.length)throw Error("No model days");
 const windows=days.flatMap(d=>d.slots);
 const fetchedAt=new Date().toISOString();
 const completeSlots=windows.filter(w=>w.modelComplete).length;
 return {spot,region:config.region,timezone:config.timezone,model:{fetchedAt,
  marineGrid:{lat:marine.latitude,lon:marine.longitude,distanceKm:gridDistanceKm(spot.latitude,spot.longitude,marine.latitude,marine.longitude)},
  weatherGrid:{lat:weather.latitude,lon:weather.longitude,distanceKm:gridDistanceKm(spot.latitude,spot.longitude,weather.latitude,weather.longitude)},
  issueAt:null,validFrom:utcInstant(weatherTimes[0]),timeBasis:typeof weatherTimes[0]==="number"?"epoch_utc":"legacy_local_unverified",source:"Open-Meteo",
  coverage:{completeSlots,totalSlots:windows.length},
  offshoreApproximation:true,referencePointStatus:spot.coordinateStatus||"unverified"},days,windows,hazard:screenRisk(config,weather,locale),fitExperimental:true};
}
function screenRisk(config,weather,locale="es"){
 const tr=(es,en)=>locale==="es"?es:en;
 const h=config.riskScreen,day=weather.hourly||{};
 const nowParts=new Intl.DateTimeFormat("en-GB",{timeZone:config.timezone||"America/Santiago",
  year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
 const now=Object.fromEntries(nowParts.map(p=>[p.type,p.value]));
 const localHour=now.year+"-"+now.month+"-"+now.day+"T"+now.hour+":00";
 const first=(day.time||[]).findIndex(t=>finite(t)?t*1000>=Date.now()-3600000:t>=localHour);
 const start=Math.max(0,first);
 const hours=first<0?0:Math.min((day.time?.length||0)-start,h.forecastHorizonHours);
 const samples=Array.from({length:hours},(_,i)=>({
  time:day.time[start+i],gust:day.wind_gusts_10m?.[start+i],wind:day.wind_speed_10m?.[start+i],
  rain:day.precipitation?.[start+i],code:day.weather_code?.[start+i]
 }));
 const maxGust=max(samples.map(x=>x.gust)),maxWind=max(samples.map(x=>x.wind));
 const maxRain=max(samples.map(x=>x.rain));
 const thunder=samples.some(x=>finite(x.code)&&x.code>=h.thunderWeatherCodeMin&&x.code<=99);
 const rainDaily=max((weather.daily?.precipitation_sum||[]).slice(0,3));
 let risk="none",reasons=[];
 if(finite(maxGust)&&maxGust>=h.dangerGustKmh||finite(maxWind)&&maxWind>=h.dangerMeanWindKmh){
  risk="danger";reasons.push(tr("Viento o rachas muy intensos","Very strong wind or gusts"));
 }else if(finite(maxGust)&&maxGust>=h.cautionGustKmh){
  risk="caution";reasons.push(tr("Rachas fuertes","Strong gusts"));
 }
 if(thunder){risk="danger";reasons.push(tr("Posibles tormentas eléctricas","Possible thunderstorms"))}
 if(finite(maxRain)&&maxRain>=h.cautionRainHourlyMm||finite(rainDaily)&&rainDaily>=h.cautionRain24hMm){
  if(risk==="none")risk="caution";
  reasons.push(tr("Lluvia intensa modelada","Modelled heavy rain"));
 }
 const windEvaluated=samples.some(x=>finite(x.gust)||finite(x.wind));
 const rainEvaluated=samples.some(x=>finite(x.rain));
 const thunderEvaluated=samples.some(x=>finite(x.code));
 // A silent provider omission must NEVER become "no hazards detected".
 const unknown=!samples.length||!windEvaluated||!rainEvaluated||!thunderEvaluated;
 const signals=[
  {id:"wind",evaluated:windEvaluated,detected:finite(maxGust)&&maxGust>=h.cautionGustKmh||finite(maxWind)&&maxWind>=h.dangerMeanWindKmh,
   severity:finite(maxGust)&&maxGust>=h.dangerGustKmh||finite(maxWind)&&maxWind>=h.dangerMeanWindKmh?"danger":"caution",
   value:finite(maxGust)?Math.round(maxGust)+" km/h":null,
   es:"Viento y rachas",en:"Wind and gusts",source:"open_meteo_model"},
  {id:"thunder",evaluated:thunderEvaluated,detected:thunder,severity:"danger",
   value:null,es:"Tormentas eléctricas",en:"Thunderstorms",source:"open_meteo_model"},
  {id:"rain",evaluated:rainEvaluated,detected:finite(maxRain)&&maxRain>=h.cautionRainHourlyMm||finite(rainDaily)&&rainDaily>=h.cautionRain24hMm,
   severity:"caution",value:finite(maxRain)?maxRain.toFixed(1)+" mm/h":null,
   es:"Lluvia intensa",en:"Heavy rainfall",source:"open_meteo_model"}
 ];
 return {level:unknown&&risk==="none"?"unknown":risk,incomplete:unknown,reasons,maxGust,maxWind,maxRain,thunder,signals,
  coastalSwell:{officialStatus:"not_checked",autoChecked:false,source:"armada"},
  uv:{officialStatus:"not_checked",autoChecked:false,source:"dmc"},
  type:"model_risk_screen",officialStatus:"not_checked",issuedAt:null,forecastHours:hours,
  label:unknown?tr("Riesgo modelo sin datos","No model risk data"):reasons.join(" · ")||
   tr("Sin señales de umbral en el modelo","No model thresholds crossed")};
}
function slotRisk(slot,config){
 if(!slot)return "unknown";
 const h=config?.riskScreen||{};
 if(finite(slot.gustKmh)&&slot.gustKmh>=h.dangerGustKmh||
    finite(slot.windKmh)&&slot.windKmh>=h.dangerMeanWindKmh||
    finite(slot.weatherCode)&&slot.weatherCode>=95&&slot.weatherCode<=99)return "danger";
 if(finite(slot.gustKmh)&&slot.gustKmh>=h.cautionGustKmh||
    finite(slot.precipitationMm)&&slot.precipitationMm>=h.cautionRainHourlyMm)return "caution";
 if(!finite(slot.windKmh)||!finite(slot.gustKmh)||!finite(slot.weatherCode)||!finite(slot.precipitationMm))return "unknown";
 return "none";
}
function vibe(slot,locale="es"){
 const es=locale==="es";
 const tr=(a,b)=>es?a:b;
 if(!slot?.modelComplete||!finite(slot.swellPeriodS)||!finite(slot.swellHeightM))return {id:"unknown",label:tr("Sin datos","Unavailable"),description:tr("No hay suficientes datos de swell para describir la ola.","Not enough swell data to describe the surf.")};
 if(finite(slot.gustKmh)&&slot.gustKmh>=75||slot.windKmh>=38)
  return {id:"windy",label:tr("💨 Ventoso","💨 Windy"),description:tr("Viento fuerte modelado: superficie probablemente desordenada. No evalúa corrientes ni seguridad.","Modelled strong winds could produce bumpy surf. Currents and entry risks not assessed.")};
 if(slot.windKmh<=8&&slot.swellPeriodS>=7)
  return {id:"glassy",label:"✨ Glassy",description:tr("Viento muy suave y algo de período. Podría verse glassy, pero la forma real depende del banco.","Light modelled winds and some swell period. A glassy-looking face is possible, depending on the actual bank.")};
 if(slot.swellPeriodS<5&&slot.windKmh>=18)
  return {id:"choppy",label:tr("🌬 Picadas","🌬 Choppy"),description:tr("Oleaje de período corto junto con viento: podría haber secciones picadas y seguidas.","Short-period waves with wind could produce short, bumpy sections.")};
 if(slot.swellHeightM<.45&&finite(slot.swellHeightM))
  return {id:"mushy",label:tr("☀️ Suavecitas","☀️ Mushy"),description:tr("Poca energía de swell modelada: se pueden necesitar tablas con volumen. No es altura rompiente.","Limited modelled swell energy: a board with more volume may help. Not a breaking surf-height prediction.")};
 if(slot.swellPeriodS>=11&&slot.swellHeightM>=1.4)
  return {id:"punchy",label:tr("⚡ Potentes","⚡ Punchy"),description:tr("Mayor energía del swell. Podrían aparecer secciones exigentes; consulta los riesgos propios del spot.","More swell energy could produce demanding sections; review the spot-specific risks.")};
 if(slot.windKmh<=17&&slot.swellPeriodS>=8)
  return {id:"clean",label:tr("🌊 Líneas limpias","🌊 Clean lines"),description:tr("Viento relativamente suave y período favorable para líneas más definidas, sin garantía sobre el banco.","Relatively light winds and useful period may favour cleaner lines, subject to actual bank shape.")};
 return {id:"mixed",label:tr("🌊 Mixed Bag","🌊 Mixed Bag"),description:tr("Señales mixtas de viento y swell; puede haber momentos surfeables, pero la forma será variable.","Mixed wind and swell signals; surfable sections may appear, but actual shape is uncertain.")};
}
function boardFit(slot,board="mid",ability="intermediate",style="flow",locale="es",hazard){
 const tr=(es,en)=>locale==="es"?es:en;
 if(!slot||!finite(slot.swellHeightM)||!finite(slot.score))
  return {label:tr("Sin datos suficientes","Insufficient data"),reason:tr("No se puede evaluar la compatibilidad.","Board fit cannot be assessed."),tag:"unknown"};
 if(hazard?.level==="danger")return {label:tr("Revisa riesgos primero","Check risks first"),reason:tr("El pronóstico indica posibles condiciones peligrosas: ninguna tabla compensa ese riesgo.","Potentially dangerous conditions are modelled; a board does not compensate for that."),tag:"danger"};
 const easy=slot.swellHeightM<1.0||slot.swellPeriodS<7;
 let preferred=easy?["long","mid","soft"]:["short","mid"];
 if(style==="flow")preferred=easy?["mid","long","soft"]:["mid","long"];
 if(style==="performance")preferred=easy?["short","mid"]:["short"];
 const supported=preferred.includes(board);
 if(ability==="beginner"&&slot.swellHeightM>=1.5)
  return {tag:"caution",label:tr("No recomendar sin evaluación","Not recommended without a local check"),reason:tr("Energía de swell elevada para un principiante; depende de corrientes, zona y tamaño rompiente.","Higher swell energy for a beginner; currents, bank and actual surf height matter.")};
 const messages={
  "soft":tr("La soft-top suele facilitar la remada en olas suaves, pero su control depende de tu nivel.","A soft-top may help with paddling into smaller waves, depending on ability."),
  "long":tr("Una longboard puede aprovechar mejor el swell suave y favorecer líneas largas.","A longboard could make the most of mellow swell and longer trimming lines."),
  "mid":tr("Una mid-length suele equilibrar remada, fluidez y capacidad de giro.","A mid-length can balance paddling, flow and turning."),
  "short":tr("La shortboard puede aprovechar mejor secciones con suficiente energía y pendiente.","A shortboard may suit steeper, more energetic sections.")
 };
 return {tag:supported?"promising":"mixed",label:supported?tr("Posible buen ajuste","Potential fit"):tr("Ajuste condicionado","Conditional fit"),
  reason:messages[board]||messages.mid,confidence:"heuristic_unvalidated",safetyAssessed:false};
}
async function fetchSpot(config,spot,profiles,fetcher=fetch,locale="es"){
 const urls=buildUrls(spot,config);
 const [marine,weather]=await Promise.all([fetchJSON(urls.marine,fetcher),fetchJSON(urls.weather,fetcher)]);
 return extract(config,spot,marine,weather,profiles,locale);
}
root.FaroChileLive=Object.freeze({buildUrls,fetchSpot,extract,screenRisk,slotRisk,statusUV,vibe,boardFit,cardinal,formatDay,daylight,mean,circleMean,wallClock});
})(typeof globalThis!=="undefined"?globalThis:this);
