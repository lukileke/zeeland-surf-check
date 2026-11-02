/* FARO Chile: deterministic regression for a 503 best-match model.
 * Run locally: node --test tests/faro-chile-live-failover.test.cjs
 * No live model calls, no fabricated production data.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const config=JSON.parse(read('chile/valparaiso-live.config.json'));
const profiles=JSON.parse(read('chile/valparaiso-score.config.json'));
const spot=config.pilots[0];
function controller(){
 const sandbox={
  URL,URLSearchParams,Intl,Date,Math,Set,Map,
  setTimeout:cb=>cb(),
  FaroChileScoreLab:{evaluate:(_profiles,_id,values)=>({
    score:typeof values.swellHeightM==='number'?7.2:null,
    status:'experimental',tags:[]
  })}
 };
 sandbox.globalThis=sandbox;
 vm.runInNewContext(read('chile/faro-chile-live.js'),sandbox,{filename:'faro-chile-live.js'});
 return sandbox.FaroChileLive;
}
const start=Date.parse('2026-11-02T03:00:00Z')/1000;
const times=Array.from({length:7*24},(_,i)=>start+i*3600);
function payload(kind){
 const fields=kind==='marine'?{
  wave_height:1.8,wave_direction:245,wave_period:11.8,
  swell_wave_height:1.3,swell_wave_direction:240,swell_wave_period:11.5
 }:{
  wind_speed_10m:8,wind_direction_10m:110,wind_gusts_10m:12,
  precipitation:0,weather_code:0,uv_index:4,
  temperature_2m:18,cloud_cover:15,precipitation_probability:5
 };
 const hourly={time:times};
 for(const [key,value]of Object.entries(fields))
  hourly[key]=times.map(()=>value);
 const dailyDates=Array.from({length:7},(_,i)=>start+i*86400);
 return {latitude:spot.latitude,longitude:spot.longitude,hourly,
  daily:{
   time:dailyDates,
   sunrise:dailyDates.map(t=>t+6*3600),
   sunset:dailyDates.map(t=>t+20*3600),
   precipitation_sum:dailyDates.map(()=>0),
   uv_index_max:dailyDates.map(()=>6)
  }};
}
const response=(status,data=null)=>({ok:status===200,status,
 headers:{get:()=>null},json:async()=>data});

test('503 best-match automatically falls back to 6-field GFS Wave and produces REAL model slots',async()=>{
 const requests=[];
 const fetcher=async url=>{
  const u=new URL(url);requests.push(u);
  if(u.pathname==='/v1/marine'){
   if(u.searchParams.get('models')==='ncep_gfswave025')
    return response(200,payload('marine'));
   return response(503);
  }
  if(u.pathname==='/v1/forecast')return response(200,payload('weather'));
  throw Error('Unexpected URL '+url);
 };
 const model=await controller().fetchSpot(config,spot,profiles,fetcher,'es');
 assert.equal(model.model.waveModelFallback,'ncep_gfswave025');
 assert.equal(model.model.reducedMarineRequest,true);
 assert.ok(model.model.coverage.completeSlots>0);
 assert.ok(model.days.some(d=>d.slots.some(s=>s.modelComplete&&s.score===7.2)));
 const ncep=requests.find(u=>u.searchParams.get('models')==='ncep_gfswave025');
 assert.ok(ncep);
 assert.deepEqual(ncep.searchParams.get('hourly').split(','),[
 'wave_height','wave_direction','wave_period',
 'swell_wave_height','swell_wave_direction','swell_wave_period']);
});

test('503 weather best-match switches to documented /v1/gfs model',async()=>{
 const requests=[];
 const fetcher=async url=>{
  const u=new URL(url);requests.push(u.pathname);
  if(u.pathname==='/v1/marine')return response(200,payload('marine'));
  if(u.pathname==='/v1/forecast')return response(503);
  if(u.pathname==='/v1/gfs')return response(200,payload('weather'));
  throw Error('Unexpected '+url);
 };
 const model=await controller().fetchSpot(config,spot,profiles,fetcher,'es');
 assert.equal(model.model.weatherModelFallback,'gfs');
 assert.ok(model.model.coverage.completeSlots>0);
 assert.ok(requests.includes('/v1/gfs'));
});

test('all providers failing 503 must reject rather than invent a score',async()=>{
 const fetcher=async url=>new URL(url).pathname==='/v1/forecast'?
  response(200,payload('weather')):response(503);
 await assert.rejects(
  controller().fetchSpot(config,spot,profiles,fetcher,'es'),
  /HTTP 503 from model provider/
 );
});

test('controller labels 4h local cache as OLD and refuses an unscored snapshot',()=>{
 const controllerSource=read('chile/chile-forecast.js');
 assert.match(controllerSource,/maxModelAgeMs=4\*60\*60\*1000/);
 assert.match(controllerSource,/s\.modelComplete&&ok\(s\.score\)/);
 assert.match(controllerSource,/MODELO GUARDADO/);
 assert.match(controllerSource,/state\.dataStale=true/);
 assert.match(controllerSource,/No es una actualización en vivo/);
});
