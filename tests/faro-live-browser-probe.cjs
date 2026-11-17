/* Live browser health probe. This does not mock external provider responses. */
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'es-CL',timezoneId:'Australia/Sydney'});
 const diagnostics={console:[],failures:[],network:[]};
 page.on('console',msg=>{if(msg.type()==='error')diagnostics.console.push(msg.text().slice(0,280))});
 page.on('pageerror',e=>diagnostics.console.push(String(e).slice(0,280)));
 page.on('requestfailed',r=>diagnostics.failures.push({url:r.url().slice(0,125),error:r.failure()?.errorText}));
 page.on('response',r=>{if(/open-meteo\.com/.test(r.url()))diagnostics.network.push({status:r.status(),url:r.url().slice(0,130)})});
 try{
  const response=await page.goto('https://lukileke.github.io/zeeland-surf-check/chile/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>/SIN CONEXI[ÓO]N|LIVE · MODELO|OFFLINE|MODELO GUARDADO|SIN DATOS/.test(document.getElementById('status')?.textContent||''),{timeout:40000}).catch(()=>{});
  const result=await page.evaluate(()=>({
    status:document.getElementById('status')?.textContent,
    updated:document.getElementById('updated')?.textContent?.slice(0,320),
    hero:document.getElementById('faroLeadHeadline')?.textContent,
    hasModel:!!document.querySelector('#dayStripItems .day-chip'),
    scripts:[...document.querySelectorAll('script[src]')].map(s=>s.src.split('?')[0].split('/').pop()).slice(-4)
  }));
  console.log('LIVE_BROWSER '+JSON.stringify({http:response?.status(),...result,...diagnostics}));
 }catch(error){console.log('LIVE_BROWSER_ERROR '+JSON.stringify({error:String(error),...diagnostics}))}
 finally{await browser.close()}
})().catch(error=>{console.log('LIVE_BROWSER_FATAL '+String(error));process.exitCode=1});
