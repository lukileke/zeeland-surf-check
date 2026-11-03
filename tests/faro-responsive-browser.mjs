/* FARO Chrome + WebKit responsive QA.
 * npm install --no-save playwright
 * npx playwright install chromium webkit
 * python3 -m http.server 8765
 * node tests/faro-responsive-browser.mjs
 *
 * This is a deterministic LAYOUT smoke test with external model requests
 * intentionally disabled. Never pretend it validates real forecast accuracy.
 * WebKit on CI approximates iPhone Safari's engine but is not real hardware.
 */
import {strict as assert} from 'node:assert';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

const origin=process.env.FARO_QA_ORIGIN||'http://127.0.0.1:8765';
const out='artifacts/faro-browser';
await mkdir(out,{recursive:true});

const sizes=[
 {width:320,height:680,name:'iphone-narrow'},
 {width:375,height:812,name:'iphone-small'},
 {width:390,height:844,name:'iphone'},
 {width:710,height:940,name:'mobile-breakpoint'},
 {width:711,height:940,name:'tablet-breakpoint'},
 {width:768,height:1024,name:'tablet'},
 {width:1024,height:768,name:'tablet-wide'},
 {width:1120,height:790,name:'desktop-breakpoint'},
 {width:1440,height:900,name:'desktop'}
];
const rgbByEngine={};
const errors=[];

for(const [engine,driver] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await driver.launch({headless:true});
 rgbByEngine[engine]={};
 try{
  for(const s of sizes)for(const theme of ['dark','light']){
   const mobile=s.width<=390;
   const mobileLayout=s.width<=710;
   const ctx=await browser.newContext({
    viewport:{width:s.width,height:s.height},
    colorScheme:theme,
    deviceScaleFactor:mobile?2:1,
    isMobile:mobile,
    hasTouch:mobile,
    reducedMotion:'reduce'
   });
   await ctx.addInitScript(value=>{
    try{localStorage.setItem('zeeland-theme',value)}catch(_){}
   },theme);
   const page=await ctx.newPage();
   await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===origin?route.continue():route.abort();
   });
   try{
    await page.goto(origin+'/chile/',{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(450);
    const found=await page.evaluate(()=>{
     const rect=selector=>{
      const e=document.querySelector(selector);
      if(!e)return null;
      const b=e.getBoundingClientRect();
      return {top:b.top,left:b.left,width:b.width,right:b.right,height:b.height};
     };
     const lead=document.querySelector('#faroForecastLead');
     const base={
      innerWidth:innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      hero:rect('#faroForecastLead'),
      nav:rect('.app-nav'),
      dock:rect('.faro-context-dock'),
      overview:rect('#dayview>.day-outlook-section'),
      hours:rect('#dayview>.hourly-section'),
      dayview:rect('#dayview'),
      footer:rect('footer.chile-footer'),
      wave:rect('#daySignalMetrics>.chile-day-wave-feature'),
      period:rect('#daySignalMetrics>.day-signal-metric:nth-child(2)'),
      wind:rect('#daySignalMetrics>.day-signal-metric:nth-child(3)'),
      redundantBridge:!!document.querySelector('.faro-footer-bridge'),
      display:lead?getComputedStyle(lead).display:null,
      button:rect('#faroLeadRead')
     };
     if(lead){
      lead.className='faro-forecast-lead brand-band-regular';
      document.querySelector('#faroLeadScore').textContent='6.1';
      base.scoreInk=getComputedStyle(document.querySelector('#faroLeadScore')).color;
     }
     return base;
    });
    assert.ok(found.hero&&found.dock&&found.dayview&&found.footer,
      'key FARO layout missing');
    assert.ok(found.scrollWidth<=s.width+2,
      'horizontal page overflow '+JSON.stringify(found));
    assert.equal(found.redundantBridge,false,'duplicated promotional outro returned');
    for(const k of ['hero','dock','dayview','footer']){
      assert.ok(found[k].width>s.width*.55,'collapsed '+k);
      assert.ok(found[k].left>=-3&&found[k].right<=s.width+3,'offscreen '+k);
    }
    assert.ok(found.footer.top>found.dayview.top,'footer must end the page');
    assert.ok(found.button.height>=40,'hero action must be tappable');
    if(mobileLayout){
      assert.ok(found.nav.top<found.hero.top,'mobile navigation before hero');
      assert.ok(found.hero.top<found.dock.top,'mobile hero before selector');
      assert.equal(found.display,'flex');
      assert.ok(found.button.height>=44,'iPhone action <44pt');
    }else{
      assert.ok(found.dock.top<found.hero.top,'desktop selector before hero');
    }
    if(s.width>=1120){
      assert.ok(Math.abs(found.overview.top-found.hours.top)<=14,
        'desktop day/time panels are not paired');
      // Check three metrics occupy one row, not the former orphan wind row.
      if(found.wave&&found.period&&found.wind&&found.wave.height>0){
        assert.ok(Math.abs(found.wave.top-found.period.top)<=10,'period dropped under wave');
        assert.ok(Math.abs(found.wave.top-found.wind.top)<=10,'wind dropped under wave');
      }
    }
    if(s.width>=711&&s.width<=1030){
      assert.ok(found.hours.top>=found.overview.top,'tablet day/hour order');
    }
    assert.equal(found.scoreInk,'rgb(177, 213, 116)','canonical score');
    rgbByEngine[engine][s.width+'-'+theme]=found.scoreInk;
    if([390,1440].includes(s.width)){
      await page.screenshot({path:`${out}/${engine}-${s.name}-${theme}.png`});
      if(s.width===390&&theme==='dark'){
       await page.locator('footer.chile-footer').scrollIntoViewIfNeeded();
       await page.screenshot({path:`${out}/${engine}-${s.name}-footer.png`});
      }
    }
    console.log('PASS',engine,s.name,theme);
   }catch(error){
    errors.push({engine,size:s.name,theme,message:String(error)});
    console.error('FAIL',engine,s.name,theme,String(error));
   }finally{
    await ctx.close();
   }
  }
 }finally{
  await browser.close();
 }
}
assert.deepEqual(errors,[],'FARO responsive browser smoke checks failed');
console.log('Browser responsive QA passed for Chrome + WebKit, 5 widths, both themes.');
