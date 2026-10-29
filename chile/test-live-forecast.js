/* node chile/test-live-forecast.js
 * Deterministic synthetic fixture. No network, no historical claims and
 * no reliance on an actually returned Open-Meteo forecast.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const json=name=>JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
require('./valparaiso-score-lab.js');
require('./faro-chile-live.js');
const L=globalThis.FaroChileLive;
const config=json('valparaiso-live.config.json'),profile=json('valparaiso-score.config.json'),registry=json('regions/CL-VS.json');
assert.equal(config.region,'CL-VS');
assert.equal(config.noOfficialAlertAssertions,true);
assert.equal(config.pilots.length,5);
assert.equal(config.referenceSpots.length,0);
const modelledVentanas=config.pilots.find(x=>x.id==='CL-VS:ventanas');
assert.ok(modelledVentanas,'Ventanas is now a fifth experimental model point');
assert.equal(modelledVentanas.forecastCategory,'research-only-model-estimate');
assert.equal(modelledVentanas.accessNotice.publicRecommendationAllowed,false);
assert.equal(modelledVentanas.accessNotice.clearanceVerified,false);
assert.equal(modelledVentanas.coastalReference.siteId,'CL15QTN03');
const candidate=registry.spots.find(p=>p.id===modelledVentanas.id);
assert.ok(candidate&&candidate.coordinates===null,
 'Coastal coordinates must NOT be presented as exact surf take-off');
assert.equal(candidate.accessNotice.automaticClearance,false);
const sources=json('sources.json').sources;
for(const id of candidate.sources)assert.ok(sources[id]?.url,'Source missing '+id);
const estimated=Lab.evaluate(profile,modelledVentanas.id,{
 windFromDeg:8,windKmh:3,gustKmh:5,
 swellFromDeg:355,swellHeightM:1.6,swellPeriodS:12
},{locale:'es'});
assert.ok(typeof estimated.score==='number'&&estimated.score>=0&&estimated.score<=10,
 'Ventanas must have numerical wave potential');
assert.equal(estimated.status,'experimental-restricted');
assert.equal(estimated.publicRecommendationAllowed,false);
assert.equal(estimated.accessStatus,'reported-restricted-unverified-lift');
assert.equal(estimated.safetyAssessed,false);
for(const p of config.pilots){
 assert.equal(p.coordinateStatus.includes('not_'),true,'Coordinates cannot masquerade as calibrated wave breaks');
 assert.ok(registry.spots.some(s=>s.id===p.id),'Every live-model pilot needs a local guide record');
 assert.ok(profile.profiles[p.id],'Every pilot needs a source-backed experimental profile');
 const query=L.buildUrls(p,config);
 assert.ok(query.marine.includes('cell_selection=sea')&&query.marine.includes('swell_wave_height'));
 assert.ok(query.weather.includes('uv_index')&&query.weather.includes('precipitation'));
 assert.equal(new URL(query.marine).searchParams.get("timeformat"),"unixtime");
 assert.equal(new URL(query.weather).searchParams.get("timeformat"),"unixtime");
 assert.ok(new URL(query.marine).searchParams.get("hourly").includes("secondary_swell_wave_height"));
}
const fmtParts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:config.timezone,
 day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
const nowDate=fmtParts.year+'-'+fmtParts.month+'-'+fmtParts.day;
const days=Array.from({length:7},(_,i)=>{
 const d=new Date(nowDate+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);
});
const times=days.flatMap(d=>Array.from({length:24},(_,h)=>d+'T'+String(h).padStart(2,'0')+':00'));
const repeat=x=>times.map(()=>x);
const marine={latitude:-32.91,longitude:-71.51,hourly:{
 time:times,wave_height:repeat(1.1),wave_direction:repeat(285),wave_period:repeat(8.1),
 swell_wave_height:repeat(.8),swell_wave_direction:repeat(295),swell_wave_period:repeat(10.1),
 wind_wave_height:repeat(.6),wind_wave_direction:repeat(270),sea_surface_temperature:repeat(15.9)
}};
const weather={latitude:-32.92,longitude:-71.5,hourly:{
 time:times,wind_speed_10m:repeat(12),wind_direction_10m:repeat(135),wind_gusts_10m:repeat(19),
 precipitation:repeat(0),weather_code:repeat(1),uv_index:times.map(t=>Number(t.slice(11,13))>=9&&Number(t.slice(11,13))<=17?8:0),
 temperature_2m:repeat(22),cloud_cover:repeat(32),precipitation_probability:repeat(0)
},daily:{time:days,sunrise:days.map(d=>d+'T07:10'),sunset:days.map(d=>d+'T20:10'),
 uv_index_max:days.map(()=>9),precipitation_sum:days.map(()=>0)}
};
const result=L.extract(config,config.pilots[0],marine,weather,profile,'es');
assert.equal(result.days.length,7);
assert.equal(result.windows.length,56);
assert.equal(result.model.offshoreApproximation,true);
assert.ok(result.model.marineGrid.distanceKm>0&&result.model.marineGrid.distanceKm<3);
assert.equal(result.model.coverage.completeSlots,56);
assert.equal(result.model.coverage.totalSlots,56);
assert.equal(result.model.referencePointStatus,config.pilots[0].coordinateStatus);
assert.equal(result.hazard.officialStatus,'not_checked');
const best=result.days[0].best;
assert.ok(best&&best.score>=0&&best.score<=10,'Guide-derived index should use its full numerical domain');
assert.equal(best.scoreMeta.scoreCap,null,'No artificial experimental ceiling should flatten conditions');
assert.equal(best.scoreMeta.confidence,'low','The uncapped index remains unvalidated');
assert.equal(best.scoreMeta.safetyAssessed,false);
assert.equal(best.scoreMeta.physicsProxy.partitions.length,1,
 'Optional swell partitions absent from the model must never be inferred');
assert.equal(best.scoreMeta.physicsProxy.optionalPartitionsMissing,true);

assert.equal(best.nearshoreHeightEstimated,false);
assert.equal(best.observed,false);
assert.equal(best.windSeaHeightM,.6);
assert.equal(best.swellHeightM,.8);
assert.equal(best.uv.category,best.uvIndex>=8?'very-high':best.uv.category);
assert.equal(L.statusUV(11).category,'extreme');
assert.equal(L.statusUV(2).category,'low');
assert.equal(L.slotRisk(best,config),'none');
assert.equal(best.coverage.complete,true);
assert.equal(best.coverage.expectedHours,2);
const hazardousWeather=JSON.parse(JSON.stringify(weather));
const currentHour=times.findIndex(t=>t.slice(0,10)===nowDate&&Number(t.slice(11,13))>=Number(fmtParts.hour));
assert.ok(currentHour>=0);
hazardousWeather.hourly.wind_gusts_10m[currentHour]=79;
assert.equal(L.screenRisk(config,hazardousWeather,'es').level,'danger');
hazardousWeather.hourly.wind_gusts_10m[currentHour]=19;
hazardousWeather.hourly.weather_code[currentHour]=95;
assert.equal(L.screenRisk(config,hazardousWeather,'es').level,'danger');
hazardousWeather.hourly.weather_code[currentHour]=1;
hazardousWeather.hourly.precipitation[currentHour]=21;
assert.equal(L.screenRisk(config,hazardousWeather,'es').level,'caution');
const noSwell=JSON.parse(JSON.stringify(marine));
noSwell.hourly.swell_wave_height=repeat(null);
assert.equal(L.extract(config,config.pilots[0],noSwell,weather,profile,'es').days[0].best,null,
 'Do not invent score from total wave data when partition is absent');
const partialMarine=JSON.parse(JSON.stringify(marine));
const hourIndex=times.findIndex(t=>t.endsWith('T07:00'));
partialMarine.hourly.swell_wave_period[hourIndex]=null;
const withGap=L.extract(config,config.pilots[0],partialMarine,weather,profile,'es');
assert.equal(withGap.days[0].slots[0].modelComplete,false);
assert.equal(withGap.days[0].slots[0].score,null,'One good hour must not produce a two-hour spot score');
assert.equal(withGap.days[0].slots[0].coverage.marineHours,2);
assert.equal(withGap.model.coverage.completeSlots,55);
const ambiguousMarine=JSON.parse(JSON.stringify(marine));
ambiguousMarine.hourly.time[hourIndex]=ambiguousMarine.hourly.time[hourIndex-1];
const withDSTCollision=L.extract(config,config.pilots[0],ambiguousMarine,weather,profile,'es');
assert.equal(withDSTCollision.days[0].slots[0].score,null,
 'Repeated local clock times must not be silently merged into an apparently complete window');
const noThunderCodes=JSON.parse(JSON.stringify(weather));
noThunderCodes.hourly.weather_code=repeat(null);
const screened=L.screenRisk(config,noThunderCodes,'es');
assert.equal(screened.level,'unknown','Missing threat evidence cannot mean no model warning');
assert.equal(screened.signals.find(s=>s.id==='thunder').evaluated,false);
assert.equal(L.slotRisk({...best,weatherCode:null},config),'unknown');
noThunderCodes.hourly.wind_gusts_10m[currentHour]=80;
assert.equal(L.screenRisk(config,noThunderCodes,'es').level,'danger',
 'Detected hazards must remain visible when another risk input is missing');
assert.equal(L.daylight({hour:6},nowDate+'T07:10',nowDate+'T20:10',40).eligible,true);
assert.equal(L.daylight({hour:4},nowDate+'T07:10',nowDate+'T20:10',40).eligible,false);
assert.equal(L.boardFit(best,'mid','intermediate','flow','es',result.hazard).safetyAssessed,false);
assert.equal(config.faroVibeTerms.disallowedChileanLabels.includes('Vidriado'),true);
assert.equal(config.faroVibeTerms.restrictedTags[0].term,'Campana');
// A truly UTC input: winter in Valparaiso (UTC-4), seven complete local days.
const epochStart=Date.parse("2026-05-10T04:00:00Z")/1000;
const epochTimes=Array.from({length:168},(_,i)=>epochStart+i*3600);
const epochMarine=JSON.parse(JSON.stringify(marine)),epochWeather=JSON.parse(JSON.stringify(weather));
epochMarine.hourly.time=epochTimes;epochWeather.hourly.time=epochTimes;
for(const [name,value] of [["secondary_swell_wave_height",.35],["secondary_swell_wave_period",12],
 ["secondary_swell_wave_direction",260],["tertiary_swell_wave_height",.1],
 ["tertiary_swell_wave_period",14],["tertiary_swell_wave_direction",245]]){
 epochMarine.hourly[name]=epochTimes.map(()=>value);
}
epochWeather.daily.time=Array.from({length:7},(_,d)=>epochStart+d*86400);
epochWeather.daily.sunrise=Array.from({length:7},(_,d)=>epochStart+d*86400+7*3600+10*60);
epochWeather.daily.sunset=Array.from({length:7},(_,d)=>epochStart+d*86400+18*3600+10*60);
const utcResult=L.extract(config,config.pilots[0],epochMarine,epochWeather,profile,'es');
assert.equal(utcResult.model.timeBasis,'epoch_utc');
assert.equal(utcResult.model.validFrom,'2026-05-10T04:00:00.000Z');
assert.equal(utcResult.days[0].date,'2026-05-10');
assert.equal(utcResult.days[0].sunrise,'2026-05-10T07:10');
assert.equal(utcResult.days[0].slots[0].validTimesUtc[0],'2026-05-10T10:00:00.000Z');
assert.equal(utcResult.days[0].slots[0].secondarySwell.heightM,.35);
assert.equal(utcResult.days[0].slots[0].tertiarySwell.periodS,14);
assert.equal(utcResult.days[0].slots[0].scoreMeta.indexVersion,'faro-offshore-potential-v0.3');
assert.equal(utcResult.days[0].slots[0].scoreMeta.physicsProxy.partitions.length,3,
 'All available independent wave partitions must enter the physical index');
assert.equal(utcResult.days[0].slots[0].scoreMeta.physicsProxy.offshoreNotBreakingWave,true);
assert.equal(utcResult.days[0].slots[0].scoreMeta.tideEvaluated,false);
assert.ok(utcResult.days[0].slots[0].scoreMeta.physicsProxy.admittedEnergyHs2T>0);

assert.equal(utcResult.model.coverage.completeSlots,56);
const mismatched=JSON.parse(JSON.stringify(epochMarine));
mismatched.hourly.time[6]=epochTimes[6]+3600;
assert.equal(L.extract(config,config.pilots[0],mismatched,epochWeather,profile,'es').days[0].slots[0].score,null,
 'Marine and weather UTC instants may not be joined simply because wall-clock labels agree');
assert.equal(L.wallClock(Date.parse('2026-04-05T02:30:00Z')/1000,'America/Santiago'),
 L.wallClock(Date.parse('2026-04-05T03:30:00Z')/1000,'America/Santiago'),
 'Chilean winter transition repeats a local clock time');
(async()=>{
 let requestedFallback=false;
 const fakeFetch=async uri=>{
  const url=new URL(uri);
  if(url.hostname==='marine-api.open-meteo.com'){
   if(url.searchParams.get("hourly").includes("secondary_swell_wave_height"))
    return {ok:false,status:400};
   requestedFallback=true;
   const fallbackMarine=JSON.parse(JSON.stringify(epochMarine));
   for(const key of Object.keys(fallbackMarine.hourly)){
    if(key.startsWith("secondary_")||key.startsWith("tertiary_"))delete fallbackMarine.hourly[key];
   }
   return {ok:true,json:async()=>fallbackMarine};
  }
  if(url.hostname==='api.open-meteo.com')return {ok:true,json:async()=>epochWeather};
  throw Error("Unexpected provider "+url);
 };
 const fallback=await L.fetchSpot(config,config.pilots[0],profile,fakeFetch,'es');
 assert.equal(requestedFallback,true);
 assert.equal(fallback.model.optionalSwellFallback,true);
 assert.equal(fallback.days[0].slots[0].secondarySwell,null);
 assert.ok(fallback.days[0].best?.score>0,'Optional partitions must not disable primary surf guidance');
 console.log('FARO Chile: UTC/DST, 7-day windows, optional partitions with fallback, risk and provenance checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
