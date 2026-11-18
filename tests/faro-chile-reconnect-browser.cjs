/* Browser regression: initial 503 must recover automatically. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const path=require('node:path');
const zone='America/Santiago',port=18766;
const parts=(epoch)=>Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
 timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',
 minute:'2-digit',hourCycle:'h23'
}).formatToParts(new Date(epoch*1000)).map(p=>[p.type,p.value]));
const clock=epoch=>{const p=parts(epoch);return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute};
const dateParts=(s)=>[Number(s.slice(0,4)),Number(s.slice(5,7)),Number(s.slice(8,10))];
function fromLocal(date,hour=0,minute=0){
 const [y,m,d]=dateParts(date),guess=Date.UTC(y,m-1,d,hour,minute)/1000;
 const target=date+'T'+String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');
 for(let delta=-12*60;delta<=12*60;delta+=1){
  const t=guess+delta*60;if(clock(t)===target)return t;
 }
 throw Error('Local clock instant missing: '+target);
}
function fixture(){
 const now=new Date(),p=parts(Math.floor(now.getTime()/1000));
 const start=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)));
 const dates=Array.from({length:7},(_,i)=>new Date(start.getTime()+i*86400000).toISOString().slice(0,10));
 const epochStart=fromLocal(dates[0]);
 const times=Array.from({length:7*24+4},(_,i)=>epochStart+i*3600);
 const fixed=x=>times.map(()=>x),n=times.length;
 const marine={latitude:-32.93,longitude:-71.52,hourly:{
  time:times,wave_height:fixed(1.3),wave_direction:fixed(282),wave_period:fixed(9),
  swell_wave_height:fixed(1.0),swell_wave_direction:fixed(295),swell_wave_period:fixed(11),
  wind_wave_height:fixed(.25),wind_wave_direction:fixed(255),sea_surface_temperature:fixed(16),
  secondary_swell_wave_height:fixed(.3),secondary_swell_wave_period:fixed(13),
  secondary_swell_wave_direction:fixed(270),tertiary_swell_wave_height:fixed(null),
  tertiary_swell_wave_period:fixed(null),tertiary_swell_wave_direction:fixed(null)
 }};
 const weather={latitude:-32.92,longitude:-71.51,hourly:{
  time:times,wind_speed_10m:times.map(t=>['06','07'].includes(clock(t).slice(11,13))?32:10),wind_direction_10m:fixed(125),
  wind_gusts_10m:times.map(t=>['06','07'].includes(clock(t).slice(11,13))?40:15),
  precipitation:fixed(0),weather_code:fixed(1),uv_index:times.map(t=>Number(clock(t).slice(11,13))>=10?5:0),
  temperature_2m:fixed(21),cloud_cover:fixed(25),precipitation_probability:fixed(0)
 },daily:{time:dates.map(d=>fromLocal(d)),sunrise:dates.map(d=>fromLocal(d,7,15)),
  sunset:dates.map(d=>fromLocal(d,20,15)),uv_index_max:dates.map(()=>7),
  precipitation_sum:dates.map(()=>0)}};
 return {marine,weather,testNowMs:fromLocal(dates[0],9,0)*1000};
}

(async()=>{
 const server=spawn('python3',['-m','http.server','18787','--bind','127.0.0.1'],{
  cwd:path.resolve(__dirname,'..'),stdio:'ignore'
 });
 let browser;
 try{
  await new Promise(resolve=>setTimeout(resolve,700));
  const {marine,weather,testNowMs}=fixture();
  browser=await chromium.launch({headless:true,channel:'chrome'});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(ms=>{
   const D=Date;window.Date=class FaroTestDate extends D{
    constructor(...args){if(args.length)super(...args);else super(ms)}
    static now(){return ms}
   };
  },testNowMs);
  let restored=false,marineCalls=0;
  await context.route('**/marine-api.open-meteo.com/**',route=>{
   marineCalls++;
   return restored?route.fulfill({json:marine}):route.fulfill({status:503,json:{reason:'Temporary ocean provider error'}});
  });
  await context.route('**/api.open-meteo.com/**',route=>route.fulfill({json:weather}));
  // This test isolates recovery from the failing provider when no shared
  // backup is available. The separate fallback suite tests the backup path.
  await context.route('**/faro-model-snapshot.json**',route=>route.abort('failed'));
  await context.route('**/fonts.googleapis.com/**',r=>r.abort());
  await context.route('**/fonts.gstatic.com/**',r=>r.abort());
  await context.route('**/unpkg.com/**',r=>r.abort());
  await context.route('**/raw.githubusercontent.com/**',r=>r.abort());
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:18787/chile/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.body.classList.contains('faro-model-unavailable'),null,{timeout:33000});
  const before=await page.locator('#status').innerText();
  assert.match(before,/PROVEEDOR NO DISPONIBLE|ERROR DE CONEXIÓN|MODELO NO DISPONIBLE/);
  assert.equal(await page.locator('#dayStripItems .day-chip').count(),0);
  restored=true;
  await page.waitForFunction(()=>document.getElementById('status')?.textContent?.includes('LIVE · MODELO'),null,{timeout:21000});
  assert.equal(await page.locator('#dayStripItems .day-chip').count(),7);
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('faro-model-unavailable')),false);
  assert.deepEqual(errors,[]);
  console.log('PASS Chile provider 503 -> automatic valid model recovery ('+marineCalls+' marine calls)');
  await context.close();
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
})().catch(err=>{console.error(err);process.exitCode=1});
