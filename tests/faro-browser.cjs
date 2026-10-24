'use strict';
/* FARO responsive integration test. Real Chromium engine (not Safari).
 * Run locally after: npm install --no-save playwright
 *                    npx playwright install chromium
 *                    node tests/faro-browser.cjs
 */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const PORT=18765;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function data(){
 const days=Array.from({length:7},(_,i)=>{
  const d=new Date(Date.now()+i*86400000);
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
 });
 // en-CA can format day/month order differently on some OS builds:
 const isoDays=days.map((s,i)=>/^\d{4}-\d\d-\d\d$/.test(s)?s:
  new Date(Date.now()+i*86400000).toISOString().slice(0,10));
 const times=isoDays.flatMap(day=>Array.from({length:24},(_,h)=>day+'T'+String(h).padStart(2,'0')+':00'));
 const n=times.length,constant=v=>Array(n).fill(v);
 return {
  marine:{hourly:{time:times,wave_height:constant(1.1),wave_direction:constant(315),
   wave_period:constant(6.2),sea_surface_temperature:constant(13.3),
   swell_wave_height:constant(0.7),swell_wave_direction:constant(315),
   swell_wave_period:constant(7),wind_wave_height:constant(0.4),
   wind_wave_direction:constant(295)}},
  weather:{hourly:{time:times,wind_speed_10m:constant(21),
   wind_direction_10m:constant(145),wind_gusts_10m:constant(87),
   precipitation:constant(0),cloud_cover:constant(30),
   weather_code:constant(2),temperature_2m:constant(11),
   apparent_temperature:constant(9)},
   daily:{time:isoDays,sunrise:isoDays.map(d=>d+'T07:15'),
     sunset:isoDays.map(d=>d+'T19:30')}}
 };
}
function horizontalIssues(){
 const view=document.documentElement.clientWidth;
 const shell=document.querySelector('main');
 const offenders=[...document.querySelectorAll('main *')].filter(el=>{
  if(el.closest('#dayStripItems'))return false; // Inner rail is intentionally scrollable
  const r=el.getBoundingClientRect(),css=getComputedStyle(el);
  return css.display!=='none'&&r.width>0&&r.right>view+3;
 }).slice(0,6).map(el=>({tag:el.tagName,id:el.id,klass:el.className?.toString().slice(0,100),
  right:Math.round(el.getBoundingClientRect().right)}));
 return {view,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,
  win:window.innerWidth,scrollX:window.scrollX,
  shellWidth:shell.getBoundingClientRect().width,offenders};
}
async function swipe(session,x0,y0,x1,y1){
 const tp=(x,y)=>[{x:Math.round(x),y:Math.round(y)}];
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:tp(x0,y0)});
 for(let i=1;i<=12;i++){
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',
   touchPoints:tp(x0+(x1-x0)*i/12,y0+(y1-y0)*i/12)});
  await sleep(8);
 }
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
(async()=>{
 const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  await sleep(800);
  browser=await chromium.launch({headless:true});
  const {marine,weather}=data();
  const failures=[];
  for(const width of [320,375,390,430]){
   const context=await browser.newContext({viewport:{width,height:812},deviceScaleFactor:2,
    isMobile:true,hasTouch:true});
   await context.route('**/marine-api.open-meteo.com/**',route=>route.fulfill({json:marine}));
   await context.route('**/api.open-meteo.com/**',route=>route.fulfill({json:weather}));
   await context.route('**/fonts.googleapis.com/**',route=>route.abort());
   await context.route('**/fonts.gstatic.com/**',route=>route.abort());
   const page=await context.newPage();
   await page.goto('http://127.0.0.1:'+PORT+'/?qa=1',{waitUntil:'domcontentloaded'});
   await page.waitForSelector('#dayStripItems .day-chip',{timeout:15000});
   for(const locale of ['en','es']){
    const actual=await page.evaluate(()=>document.documentElement.lang);
    if(actual!==locale)await page.evaluate(()=>toggleLanguage());
    for(const theme of ['light','dark']){
     await page.evaluate(t=>{
      if(document.documentElement.getAttribute('data-theme')!==t)toggleTheme();
     },theme);
     for(const [tab,nav] of [['forecast','forecastPage'],['best','bestPage'],['board','boardPage']]){
      await page.evaluate(t=>switchTab(t),tab);
      await sleep(100);
      if(tab==='forecast'){
       const hazard=await page.locator('#faroSafetyCenter .faro-safety-kicker').innerText();
       const expected=locale==='es'?'RIESGO SEGÚN EL MODELO':'MODEL HAZARD';
       if(!hazard.includes(expected))failures.push({width,locale,theme,bannerTranslation:hazard,expected});
       const compact=await page.evaluate(()=>{
        const center=document.getElementById('faroSafetyCenter');
        const disclosure=center.querySelector('details'),summary=disclosure.querySelector('summary');
        return {height:Math.round(center.getBoundingClientRect().height),
          closed:!disclosure.open,summaryText:summary.innerText,
          modelDisclaimer:summary.innerText.includes(document.documentElement.lang==='es'?'no aviso oficial':'not official alert')};
       });
       if(!compact.closed||compact.height>170||!compact.modelDisclaimer||
          !compact.summaryText.includes('87 km/h')){
        failures.push({width,locale,theme,issue:'Collapsed danger must be compact and honest',compact});
       }
       await page.locator('#faroSafetyCenter summary').click();
       const expanded=await page.evaluate(()=>{
        const root=document.getElementById('faroSafetyCenter'),d=root.querySelector('details');
        return {open:d.open,height:Math.round(root.getBoundingClientRect().height),
          link:d.querySelector('.faro-safety-link')?.href,
          reasonCount:d.querySelectorAll('.faro-safety-reasons li').length};
       });
       if(!expanded.open||expanded.height<=compact.height||
          !expanded.link.includes('knmi.nl')||expanded.reasonCount<1){
        failures.push({width,locale,theme,issue:'Warning detail failed to expand',expanded});
       }
       await page.locator('#faroSafetyCenter summary').click();
       if(await page.locator('#faroSafetyCenter details').evaluate(d=>d.open)){
        failures.push({width,locale,theme,issue:'Warning failed to collapse'});
       }
      }

      const info=await page.evaluate(horizontalIssues);
      if(info.scroll>info.view+2||info.scrollX!==0||info.offenders.length){
       failures.push({width,locale,theme,tab,...info});
      }
      if(tab==='forecast'){
       const rail=await page.evaluate(()=>{
        const r=document.querySelector('#dayStripItems');
        const before=r.scrollLeft;r.scrollLeft=r.scrollWidth-r.clientWidth;
        return {before,after:r.scrollLeft,extent:r.scrollWidth-r.clientWidth};
       });
       if(rail.extent>5&&rail.after<5)failures.push({width,locale,theme,rail});
       await page.evaluate(()=>{document.querySelector('#dayStripItems').scrollLeft=0});
      }
     }
    }
   }
   if(width===375){
    await page.evaluate(()=>{
     localStorage.setItem('faro-alert-country','CL'); // legacy value from v21
     renderSafetyCenter();
    });
    const regionSelector=await page.locator('.faro-safety-region-select').count();
    const warningUrl=await page.locator('#faroSafetyCenter .faro-safety-link').getAttribute('href');
    if(regionSelector!==0||!warningUrl.includes('knmi.nl'))
     failures.push({width,regionSelector,warningUrl,issue:'Zeeland must not expose Chile source selection'});
   }
   await page.evaluate(()=>switchTab('forecast'));
   const cdpsession=await context.newCDPSession(page);
   await swipe(cdpsession,Math.min(width-25,350),550,25,550);
   await sleep(120);
   const after=await page.evaluate(horizontalIssues);
   if(after.scrollX!==0||after.scroll>after.view+2)failures.push({width,touchSwipe:true,...after});
   if(width===375)await page.screenshot({path:'/tmp/faro-mobile-browser.png',fullPage:true});
   await context.close();
  }
  if(failures.length){
   console.error(JSON.stringify({failures},null,2));
   process.exitCode=1;
  }else console.log('PASS Faro browser QA: mobile viewport, rail, touch gesture, themes and locales.');
 }finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
 }
})().catch(error=>{console.error(error);process.exitCode=1});
