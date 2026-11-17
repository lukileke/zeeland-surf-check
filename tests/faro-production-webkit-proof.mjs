/* Production proof: when both external API hosts fail in WebKit, the publicly
 * deployed FARO Chile must serve verified forecast data from its own origin.
 * No mock data, no local web server, no fabricated scores.
 */
import assert from 'node:assert/strict';
import {webkit,devices} from 'playwright';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({
 ...devices['iPhone 13'],locale:'es-CL',timezoneId:'Australia/Sydney'
});
const logs=[],network=[];
try{
 await context.route('**/marine-api.open-meteo.com/**',r=>r.abort('failed'));
 await context.route('**/api.open-meteo.com/**',r=>r.abort('failed'));
 const page=await context.newPage();
 page.on('pageerror',err=>logs.push('JS '+String(err.message||err)));
 page.on('requestfailed',r=>{
  if(r.url().includes('faro-model-snapshot'))logs.push('FIRST_PARTY_FAIL '+r.url()+' '+r.failure()?.errorText)
 });
 page.on('response',r=>{
  if(r.url().includes('faro-model-snapshot'))network.push({status:r.status(),url:r.url()});
 });
 const response=await page.goto('https://lukileke.github.io/zeeland-surf-check/chile/?proof=webKit-same-origin-1',{
  waitUntil:'domcontentloaded',timeout:35000
 });
 await page.waitForFunction(()=>/MODELO RESPALDO|BACKUP MODEL|LIVE · MODELO/.test(
  document.getElementById('status')?.textContent||''
 ),{timeout:35000}).catch(()=>{});
 const state=await page.evaluate(()=>({
  status:document.getElementById('status')?.textContent||'',
  updated:document.getElementById('updated')?.textContent||'',
  rows:document.querySelectorAll('#dayStripItems .day-chip').length,
  script:[...document.querySelectorAll('script[src]')].find(s=>s.src.includes('chile-forecast.js'))?.src||'',
  location:location.href
 }));
 console.log('WEBKIT_PRODUCTION '+JSON.stringify({http:response?.status(),...state,network,logs}));
 assert.equal(response?.status(),200);
 assert.match(state.status,/MODELO RESPALDO|BACKUP MODEL/,
  'With both external APIs blocked, the deployed page must use same-origin data');
 assert.match(state.updated,/Open-Meteo/);
 assert.ok(state.rows>=3,'Deployed backup must include genuine forecast days');
 assert.ok(network.some(n=>n.status===200),'Published same-origin snapshot must return HTTP 200');
 assert.match(state.script,/chile-forecast\.js\?v=53/);
 assert.equal(logs.length,0);
 console.log('PASS PRODUCTION WEBKIT · BOTH EXTERNAL API HOSTS BLOCKED, VERIFIED SAME-ORIGIN FORECAST LOADED');
}finally{await context.close();await browser.close()}
