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
    const found=await page.evaluate(async()=>{
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
      footerColumns:getComputedStyle(document.querySelector('footer.chile-footer')).gridTemplateColumns.split(' ').filter(Boolean).length,
      hourlyRailBackground:getComputedStyle(document.querySelector('#slots')).backgroundColor,
      hourlyHeaderInk:getComputedStyle(document.querySelector('#faroHourlyPreview .faro-hourly-read-meta>small')).color,
      wave:rect('#daySignalMetrics>.chile-day-wave-feature'),
      period:rect('#daySignalMetrics>.day-signal-metric:nth-child(2)'),
      wind:rect('#daySignalMetrics>.day-signal-metric:nth-child(3)'),
      redundantBridge:!!document.querySelector('.faro-footer-bridge'),
      display:lead?getComputedStyle(lead).display:null,
      button:rect('#faroLeadRead'),
      days:rect('#faroDayRail'),
      quickHours:rect('#faroQuickHourRail'),
      daysCount:document.querySelectorAll('#faroQuickDays>button').length,
      quickHoursCount:document.querySelectorAll('#faroQuickHours>button').length,
      loading:document.body.classList.contains('faro-model-pending'),
      offline:document.body.classList.contains('faro-model-unavailable'),
      heroBusy:lead?.getAttribute('aria-busy')
     };
     if(lead){
      // Test CSS on a temporary twin, not the live hero: an asynchronous
      // model refresh legitimately changes its class to is-unavailable.
      const sample=lead.cloneNode(false);
      sample.className='faro-forecast-lead brand-band-regular';
      const signal=document.createElement('aside');signal.className='faro-lead-signal';
      const scoreRow=document.createElement('div');scoreRow.className='faro-lead-score-row';
      const score=document.querySelector('#faroLeadScore').cloneNode(false);
      score.textContent='6.1';
      scoreRow.append(score);signal.append(scoreRow);sample.append(signal);
      lead.after(sample);
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const style=getComputedStyle(score);
      base.scoreInk=style.getPropertyValue('-webkit-text-fill-color')||style.color;
      base.scoreProbe={
       matches:score.matches('html body main #forecastPage:not(.hide)>section#faroForecastLead.faro-forecast-lead.brand-band-regular strong#faroLeadScore'),
       className:sample.className,
       tone:getComputedStyle(sample).getPropertyValue('--brand-score-ink'),
       canonical:getComputedStyle(document.documentElement).getPropertyValue('--faro-score-3'),
       fill:style.getPropertyValue('-webkit-text-fill-color'),cssColor:style.color,
       inline:score.getAttribute('style')
      };
      sample.remove();
     }
     return base;
    });
    assert.ok(found.hero&&found.dock&&found.dayview&&found.footer,
      'key FARO layout missing');
    assert.ok(found.scrollWidth<=s.width+2,
      'horizontal page overflow '+JSON.stringify(found));
    assert.equal(found.redundantBridge,false,'duplicated promotional outro returned');
    if(theme==='light'){
      assert.equal(found.hourlyRailBackground,'rgb(25, 54, 58)',
        'Light theme must keep canonical score colours readable on FARO deep-ocean hour rail');
      assert.equal(found.hourlyHeaderInk,'rgb(180, 229, 226)',
        'FARO window label must have legible contrast on the dark light-theme instrument');
    }
    for(const k of ['hero','dock','dayview','footer']){
      assert.ok(found[k].width>s.width*.55,'collapsed '+k);
      assert.ok(found[k].left>=-3&&found[k].right<=s.width+3,'offscreen '+k);
    }
    assert.ok(found.footer.top>found.dayview.top,'footer must end the page');
    if(s.width<=1119){
      assert.equal(found.footerColumns,1,'tablet/iPhone footer must be a single column');
    }else{
      assert.equal(found.footerColumns,2,'desktop footer should retain a balanced two-column ending');
    }
    if(found.loading||found.offline){
      assert.equal(found.button.height,0,'no-data hero hides dead action');
      assert.equal(found.heroBusy,found.loading?'true':'false',
        'loading semantics must reflect provider state');
    }else if(s.width>=1120){
      assert.ok(found.button.height>=40,'desktop hero action must be tappable');
    }
    if(s.width<=1119){
      assert.ok(found.nav.top<found.hero.top,'navigation precedes console');
      assert.ok(found.hero.top<found.dock.top,'console precedes compact spot selector');
      if(!found.loading&&!found.offline){
       assert.equal(found.daysCount,7,'seven interactive forecast days');
       assert.ok(found.quickHoursCount>=7,'two-hour mini-sessions must load');
       assert.ok(found.days.top<found.hero.top&&found.hero.top<found.quickHours.top,
        'days, lead and hours must read as one vertical module');
       assert.ok(found.quickHours.top<found.dock.top,'hourly sessions precede spot selector');
      }
      if(mobileLayout){
       assert.equal(found.display,'flex');
       assert.equal(found.button.height,0,'mobile CTA is redundant with hours directly below hero');
      }
    }else{
      assert.ok(found.dock.top<found.hero.top,'desktop selector before hero');
    }
    if(s.width>=1120&&!found.loading&&!found.offline){
      assert.ok(found.days.width>s.width*.55&&found.quickHours.width>s.width*.55,
       'desktop must show the connected day and two-hour console at full width');
      assert.ok(found.days.top<found.hero.top&&found.hero.top<found.quickHours.top,
       'desktop must show day → hero → hours in that order');
      assert.equal(found.hours.height,0,'the legacy duplicated desktop hour grid must be hidden');
      // Check three metrics occupy one row, not the former orphan wind row.
      if(found.wave&&found.period&&found.wind&&found.wave.height>0){
        assert.ok(Math.abs(found.wave.top-found.period.top)<=10,'period dropped under wave');
        assert.ok(Math.abs(found.wave.top-found.wind.top)<=10,'wind dropped under wave');
      }
    }
    if(s.width>=711&&s.width<=1030&&!found.loading&&!found.offline){
      // On tablet, the compact selectable day/hero/hour console replaces
      // the old detailed hourly card. Test the NEW hierarchy, not its legacy
      // position below the overview.
      assert.ok(found.days.top+found.days.height<=found.hero.top+2,
        'tablet days must precede hero: '+JSON.stringify({days:found.days,hero:found.hero,hours:found.quickHours}));
      assert.ok(found.hero.top+found.hero.height<=found.quickHours.top+2,'tablet hours must follow hero');
      assert.ok(found.quickHours.top+found.quickHours.height<=found.overview.top+2,
        'tablet overview must follow the unified surf console');
    }
    assert.equal(found.scoreInk,'rgb(177, 213, 116)','canonical score '+JSON.stringify(found.scoreProbe));
    rgbByEngine[engine][s.width+'-'+theme]=found.scoreInk;
    if([390,1440].includes(s.width)){
      // This suite deliberately blocks external data requests. Populate
      // the REAL production components with representative test values so
      // layout can be inspected independently of Open-Meteo uptime.
      await page.evaluate(()=>{
       const host=document.querySelector('#sessionAtGlance');
       if(host&&!host.querySelector('.faro-session-kit-reading')){
        const reading=document.createElement('div');reading.className='faro-session-kit-reading';
        for(const [kind,label,value] of [
         ['faro-kit-primary','TRAJE ORIENTATIVO','3/2 mm'],
         ['faro-kit-alternative','MÁS AISLAMIENTO','4/3 mm']
        ]){const cell=document.createElement('div');cell.className=kind;
         const small=document.createElement('small');small.textContent=label;
         const strong=document.createElement('strong');strong.textContent=value;
         cell.append(small,strong);reading.append(cell);}
        host.replaceChildren(reading);
        const note=document.createElement('p');note.className='faro-kit-context';
        note.textContent='Exposición moderada · Agua, aire y viento modelados.';
        host.append(note);
       }
       const essentials=document.querySelector('#sessionEssentials');
       if(essentials&&!essentials.children.length){
        for(const [label,value] of [['AGUA · MODELO','18.1 °C'],['AIRE · MODELO','19.6 °C'],
          ['VIENTO · MODELO','15 km/h'],['ÍNDICE UV','3 · Bajo']]){
         const cell=document.createElement('div');cell.className='faro-kit-signal';
         const small=document.createElement('small');small.textContent=label;
         const strong=document.createElement('strong');strong.textContent=value;
         cell.append(small,strong);essentials.append(cell);
        }
       }
       const lab=document.querySelector('#faroScienceSnapshot');
       if(lab&&!lab.children.length)for(const [key,value] of [
        ['SWELL PRINCIPAL','1.2 m'],['PERÍODO','9.2 s'],
        ['DIRECCIÓN · DESDE','SW · 231°'],['RACHAS','34 km/h']]){
        const cell=document.createElement('div');cell.className='faro-lab-metric';
        const small=document.createElement('small');small.textContent=key;
        const strong=document.createElement('strong');strong.textContent=value;
        cell.append(small,strong);lab.append(cell);
       }
      });
      const prep=page.locator('#sessionDetailExpand');
      await prep.evaluate(el=>el.open=true);
      await page.locator('.faro-kit-primary strong').waitFor({state:'visible',timeout:5000});
      const geometry=await page.evaluate(()=>{
       const r=selector=>document.querySelector(selector).getBoundingClientRect();
       return {body:r('.chile-session-body'),intro:r('#sessionAtGlance'),
        tags:r('#sessionEssentials'),daylight:r('.daylight-disclosure')};
      });
      assert.ok(geometry.intro.width>=geometry.body.width*.76,
       'Session prep has collapsed into a vertical paragraph: '+JSON.stringify(geometry));
      assert.ok(geometry.tags.y>=geometry.intro.bottom-4&&
       geometry.daylight.y>=geometry.tags.bottom-4,
       'Session signals and daylight overlap: '+JSON.stringify(geometry));
      await page.locator('#dayview>.session-section').screenshot({path:`${out}/${engine}-${s.name}-${theme}-session-kit.png`});
      await prep.evaluate(el=>el.open=false);
      await page.locator('.faro-hub-group.is-read').screenshot({path:`${out}/${engine}-${s.name}-${theme}-ocean-lab.png`});
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
