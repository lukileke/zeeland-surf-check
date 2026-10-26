/* Live API never called by these tests. Validate archive shapes and provenance. */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {collect,urls,outputPath} from "./archive-forecast.mjs";
const cfg=JSON.parse(await readFile(new URL("./valparaiso-live.config.json",import.meta.url),"utf8"));
const refTime=new Date("2026-10-26T18:00:00Z");
const times=Array.from({length:96},(_,i)=>Math.floor(refTime.getTime()/1000)+i*3600);
const series=(v)=>times.map(()=>v);
function response(type,lat,lon){
 const obj={latitude:Number(lat),longitude:Number(lon),hourly:{time:times}};
 const values=type==="marine"?{
  wave_height:1.3,wave_direction:290,wave_period:10,
  swell_wave_height:1.1,swell_wave_direction:235,swell_wave_period:12,
  wind_wave_height:.2,wind_wave_direction:270,sea_surface_temperature:15
 }:{wind_speed_10m:8,wind_direction_10m:110,wind_gusts_10m:13,precipitation:0,weather_code:1,
  uv_index:5,temperature_2m:20,cloud_cover:20,precipitation_probability:0};
 for(const [name,val]of Object.entries(values))obj.hourly[name]=series(val);
 return obj;
}
let fallback=0,queries=0;
async function mock(url){
 queries++;
 const u=new URL(url),marine=u.hostname==="marine-api.open-meteo.com";
 if(marine&&u.searchParams.get("hourly").includes("sea_level_height_msl")){
  fallback++;return {ok:false,status:400};
 }
 return {ok:true,json:async()=>response(marine?"marine":"weather",
  u.searchParams.get("latitude"),u.searchParams.get("longitude"))};
}
const r=await collect(cfg,mock,refTime);
assert.equal(r.data.spots.length,3);
assert.equal(fallback,3);
assert.equal(queries,9);
assert.equal(r.data.fetchedAtUtc,"2026-10-26T18:00:00.000Z");
assert.equal(r.data.provider,"Open-Meteo");
assert.equal(r.data.modelIssueKnown,false);
assert.equal(r.data.cameraFramesCollected,false);
assert.match(r.sha256,/^[a-f0-9]{64}$/);
for(const spot of r.data.spots){
 assert.equal(spot.records.length,96);
 assert.equal(spot.marineGrid.lat,spot.referenceCoordinates.lat);
 for(const row of spot.records){
  assert.equal(row.issuedAtUtc,null);
  assert.equal(row.ingestedAtUtc,r.data.fetchedAtUtc);
  assert.ok(new Date(row.validAtUtc).getTime()>=refTime.getTime());
  assert.equal(row.features.swellHeightM,1.1);
  assert.equal(row.features.swellPeriodS,12);
  assert.equal(row.features.windKmh,8);
  assert.equal(row.features.secondarySwellHeightM,null,"Do not fabricate optional swell");
  assert.equal(row.features.seaLevelHeightMslModelM,null,"Absent model tide != observed tide");
 }
}
assert.ok(outputPath(refTime).endsWith("2026/10/20261026T180000.000Z.json"));
const one=cfg.pilots.find(s=>s.id==="CL-VS:la-boca-concon");
const q=urls(one,cfg);
assert.equal(q.marine.searchParams.get("timeformat"),"unixtime");
assert.equal(q.weather.searchParams.get("timeformat"),"unixtime");
async function incomplete(url){
 const u=new URL(url),marine=u.hostname==="marine-api.open-meteo.com";
 const json=response(marine?"marine":"weather",one.latitude,one.longitude);
 if(marine)delete json.hourly.swell_wave_period;
 return {ok:true,json:async()=>json};
}
await assert.rejects(collect(cfg,incomplete,refTime),/missing required series/);
async function noAligned(url){
 const u=new URL(url),marine=u.hostname==="marine-api.open-meteo.com";
 const json=response(marine?"marine":"weather",one.latitude,one.longitude);
 if(!marine)json.hourly.time=json.hourly.time.map(t=>t+1800);
 return {ok:true,json:async()=>json};
}
await assert.rejects(collect(cfg,noAligned,refTime),/Insufficient aligned UTC forecast hours/);
console.log("FARO snapshots: 3 distinct spots, UTC, legal provenance, optional fallback, missing-data safety and no camera fabrication passed.");
