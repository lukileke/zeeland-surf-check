/* FARO Chile: immutable research snapshots of forecasts actually fetched BEFORE
 * surf observations. No cameras, no authentication, no invented issue times.
 * Open-Meteo free API is NON-COMMERCIAL ONLY; do not use this workflow for
 * a monetised FARO service without a commercial agreement.
 */
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {join,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {gzipSync,gunzipSync} from "node:zlib";
const REQUIRED={
 marine:["wave_height","wave_direction","wave_period","swell_wave_height","swell_wave_direction","swell_wave_period"],
 weather:["wind_speed_10m","wind_direction_10m"]
};
const WAVE={
 wave_height:"waveHeightM",wave_direction:"waveFromDeg",wave_period:"wavePeriodS",
 swell_wave_height:"swellHeightM",swell_wave_direction:"swellFromDeg",swell_wave_period:"swellPeriodS",
 wind_wave_height:"windSeaHeightM",wind_wave_direction:"windSeaFromDeg",
 secondary_swell_wave_height:"secondarySwellHeightM",secondary_swell_wave_direction:"secondarySwellFromDeg",
 secondary_swell_wave_period:"secondarySwellPeriodS",
 tertiary_swell_wave_height:"tertiarySwellHeightM",tertiary_swell_wave_direction:"tertiarySwellFromDeg",
 tertiary_swell_wave_period:"tertiarySwellPeriodS",sea_surface_temperature:"waterTempC",
 sea_level_height_msl:"seaLevelHeightMslModelM",ocean_current_velocity:"oceanCurrentVelocityKmh",
 ocean_current_direction:"oceanCurrentFromDeg"
};
const MET={
 wind_speed_10m:"windKmh",wind_direction_10m:"windFromDeg",wind_gusts_10m:"gustKmh",
 precipitation:"rainMm",weather_code:"weatherCode",uv_index:"uvIndex",
 temperature_2m:"temperatureC",cloud_cover:"cloudPercent",precipitation_probability:"rainChancePercent"
};
const finite=v=>typeof v==="number"&&Number.isFinite(v);
function urls(spot,cfg,forecastDays=4){
 if(!finite(spot.latitude)||!finite(spot.longitude))throw Error("Invalid coordinate");
 const common={latitude:String(spot.latitude),longitude:String(spot.longitude),forecast_days:String(forecastDays),
  timezone:cfg.timezone,timeformat:"unixtime"};
 const marine=new URL(cfg.modelProviders.marine);
 const weather=new URL(cfg.modelProviders.weather);
 if(marine.hostname!=="marine-api.open-meteo.com"||weather.hostname!=="api.open-meteo.com")
  throw Error("Unsupported endpoint: check contract before commercial use");
 const req=cfg.modelProviders.requiredVariables;
 const optional=[...new Set([...(cfg.modelProviders.optionalMarineVariables||[]),
  "sea_level_height_msl","ocean_current_velocity","ocean_current_direction"])];
 marine.search=new URLSearchParams({...common,cell_selection:"sea",
  hourly:[...new Set([...req.marine,...optional])].join(",")}).toString();
 weather.search=new URLSearchParams({...common,hourly:req.weather.join(","),
  wind_speed_unit:"kmh",precipitation_unit:"mm",temperature_unit:"celsius"}).toString();
 return {marine,weather,marineFallback:new URL(marine),optional};
}
async function request(url,fetcher){
 const r=await fetcher(String(url));
 if(!r?.ok)throw Object.assign(new Error("Provider returned HTTP "+r?.status),{status:r?.status});
 const v=await r.json();
 if(!Array.isArray(v?.hourly?.time)||!v.hourly.time.length||!v.hourly.time.every(finite))
  throw Error("Provider did not return Unix hourly timestamps");
 return v;
}
function toHourly(data,map){
 const t=data.hourly.time;
 const result=new Map();
 for(let i=0;i<t.length;i++){
  const ms=t[i]*1000,dt=new Date(ms);
  if(!Number.isFinite(ms)||Number.isNaN(dt.getTime()))continue;
  const features={};
  for(const [source,key]of Object.entries(map))features[key]=finite(data.hourly[source]?.[i])?data.hourly[source][i]:null;
  result.set(dt.toISOString(),features);
 }
 return result;
}
function combine(marine,weather,spot,stamp){
 for(const [name,obj,keys]of [["marine",marine,REQUIRED.marine],["weather",weather,REQUIRED.weather]]){
  if(!keys.every(k=>Array.isArray(obj.hourly[k])&&obj.hourly[k].length===obj.hourly.time.length))
   throw Error(name+" missing required series at "+spot.id);
 }
 const m=toHourly(marine,WAVE),w=toHourly(weather,MET);
 const times=[...m.keys()].filter(t=>w.has(t)).sort();
 if(times.length<24)throw Error("Insufficient aligned UTC forecast hours for "+spot.id);
 const records=[];
 for(const t of times){
  const v={...m.get(t),...w.get(t)};
  if(!["swellHeightM","swellPeriodS","swellFromDeg","windKmh","windFromDeg"].every(k=>finite(v[k])))continue;
  records.push({forecastId:spot.id+"|"+stamp+"|"+t,
   spotId:spot.id,source:"Open-Meteo",model:null,modelIssueAtUtc:null,issuedAtUtc:null,
   ingestedAtUtc:stamp,validAtUtc:t,features:v});
 }
 if(records.length<24)throw Error("Fewer than 24 complete core records for "+spot.id);
 return {spotId:spot.id,spotName:spot.name,referenceCoordinates:{lat:spot.latitude,lon:spot.longitude},
  marineGrid:{lat:marine.latitude??null,lon:marine.longitude??null},
  weatherGrid:{lat:weather.latitude??null,lon:weather.longitude??null},
  marineHourlyReturned:marine.hourly.time.length,weatherHourlyReturned:weather.hourly.time.length,
  alignedRecords:records.length,records};
}
async function collect(cfg,fetcher=fetch,now=new Date()){
 const fetchedAtUtc=now.toISOString();
 const spots=[];
 for(const spot of cfg.pilots.filter(s=>["CL-VS:la-boca-concon","CL-VS:renaca","CL-VS:ritoque"].includes(s.id))){
  const u=urls(spot,cfg);
  let marine,weather;
  try{marine=await request(u.marine,fetcher)}
  catch(e){
   if(e.status!==400)throw e;
   // Strip optional partitions/currents as a whole, never impute missing swells.
   u.marineFallback.searchParams.set("hourly",cfg.modelProviders.requiredVariables.marine.join(","));
   marine=await request(u.marineFallback,fetcher);
  }
  weather=await request(u.weather,fetcher);
  spots.push(combine(marine,weather,spot,fetchedAtUtc));
 }
 if(spots.length!==3)throw Error("All three distinct spot forecasts required");
 const data={schemaVersion:"1.0.0",region:"CL-VS",fetchedAtUtc,timezone:"America/Santiago",
  provider:"Open-Meteo",providerAccess:"free_api_noncommercial_research",
  licence:"CC BY 4.0 with attribution; API use under Open-Meteo non-commercial free terms",
  url:"https://open-meteo.com/en/docs/marine-weather-api",
  modelIssueAtUtc:null,modelIssueKnown:false,forecastVintage:"retrieved_and_frozen_prior_to_future_observations",
  observedWaveData:false,cameraFramesCollected:false,
  archivedFor:"research_dataset_only_not_observed_surf",forecastHorizonDays:4,spots};
 const canonical=JSON.stringify(data);
 return {data,sha256:createHash("sha256").update(canonical).digest("hex")};
}
function encodeSnapshot(data,sha256){
 return gzipSync(Buffer.from(JSON.stringify({...data,sha256})+"\n"),{level:9,mtime:0});
}
function decodeSnapshot(bytes){return JSON.parse(gunzipSync(bytes).toString("utf8"));}
function outputPath(now=new Date()){
 if(Number.isNaN(now.getTime()))throw Error("Invalid archive time");
 const t=now.toISOString().replace(/[-:]/g,"");
 const yyyy=now.toISOString().slice(0,4),mm=now.toISOString().slice(5,7);
 return join("research-data","chile","forecast-snapshots",yyyy,mm,t+".json.gz");
}
async function main(){
 if(process.env.FARO_RESEARCH_NONCOMMERCIAL_ACK!=="true")
  throw Error("Noncommercial API use must be acknowledged");
 const cfg=JSON.parse(await readFile("chile/valparaiso-live.config.json","utf8"));
 const now=new Date(),result=await collect(cfg,fetch,now);
 const file=outputPath(now);
 await mkdir(dirname(file),{recursive:true});
 await writeFile(file,encodeSnapshot(result.data,result.sha256),{flag:"wx"});
 console.log("Saved immutable research snapshot "+file+"; records "+
  result.data.spots.map(s=>s.spotId+":"+s.records.length).join(",")+
  "; issue date NOT known; no camera data.");
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error(e.message);process.exitCode=1});
export {collect,outputPath,urls,combine,encodeSnapshot,decodeSnapshot};
