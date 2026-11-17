/* Operational probe: real provider response, never substitute for mocked CI. */
const fs=require('node:fs');
const config=JSON.parse(fs.readFileSync('chile/valparaiso-live.config.json','utf8'));
const spot=config.pilots[0];
const opts={latitude:spot.latitude,longitude:spot.longitude,timezone:config.timezone,timeformat:'unixtime',forecast_days:'7'};
const marine=new URL(config.modelProviders.marine);
marine.search=new URLSearchParams({...opts,cell_selection:'sea',hourly:[...new Set([...config.modelProviders.requiredVariables.marine,...(config.modelProviders.optionalMarineVariables||[])])].join(',')}).toString();
const weather=new URL(config.modelProviders.weather);
weather.search=new URLSearchParams({...opts,hourly:config.modelProviders.requiredVariables.weather.join(','),daily:'sunrise,sunset,uv_index_max,precipitation_sum',wind_speed_unit:'kmh',temperature_unit:'celsius',precipitation_unit:'mm'}).toString();
const core=['wave_height','wave_direction','wave_period','swell_wave_height','swell_wave_direction','swell_wave_period'];
const metcore=['wind_speed_10m','wind_direction_10m','wind_gusts_10m','precipitation','weather_code'];
const valid=n=>typeof n==='number'&&Number.isFinite(n);
async function probe(name,url,required){
 const started=Date.now();
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(18000)});
  const body=await r.json();
  const times=body?.hourly?.time||[];
  let consecutive=0;
  for(let i=1;i<times.length;i++){
   if(times[i]-times[i-1]!==3600)continue;
   if(required.every(k=>valid(body?.hourly?.[k]?.[i])&&valid(body?.hourly?.[k]?.[i-1])))consecutive++;
  }
  const fields=Object.fromEntries(required.map(k=>[k,(body?.hourly?.[k]||[]).filter(valid).length]));
  console.log(JSON.stringify({provider:name,http:r.status,ms:Date.now()-started,hours:times.length,completePairs:consecutive,finiteByField:fields,error:body?.reason||null,model:body?.model||null}));
 }catch(e){console.log(JSON.stringify({provider:name,ms:Date.now()-started,error:String(e.message||e),cause:String(e.cause?.message||'')}))}
}
Promise.all([probe('marine-full',marine,core),probe('marine-core',new URL(marine.toString().replace(/hourly=[^&]+/,'hourly='+core.join('%2C'))),core),probe('weather-full',weather,metcore)]).catch(e=>{console.log('probe orchestration',String(e))});
