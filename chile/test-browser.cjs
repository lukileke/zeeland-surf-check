/* FARO Chile isolated browser QA. Mock provider output, never live alerts. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
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
 return {marine,weather};
}
(async()=>{
 const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{
  cwd:path.resolve(__dirname,'..'),stdio:'ignore'
 });
 let browser;
 try{
  await new Promise(ok=>setTimeout(ok,800));
  const {marine,weather}=fixture();
  browser=await chromium.launch({headless:true,channel:'chrome'});
  for(const width of [375,390,430,768,1180,1440]){
   const context=await browser.newContext({viewport:{width,height:840},deviceScaleFactor:1});
   await context.route('**/marine-api.open-meteo.com/**',route=>route.fulfill({json:marine}));
   await context.route('**/api.open-meteo.com/**',route=>route.fulfill({json:weather}));
   await context.route('**/fonts.googleapis.com/**',route=>route.abort());
   await context.route('**/fonts.gstatic.com/**',route=>route.abort());
   // Exercise the first-party geographic map independently of external CDN uptime.
   await context.route('**/unpkg.com/**',route=>route.abort());
   const page=await context.newPage();
   const scriptErrors=[];
   page.on('pageerror',err=>scriptErrors.push(err.message));
   await page.goto('http://127.0.0.1:'+port+'/chile/',{waitUntil:'domcontentloaded'});
   try{await page.waitForSelector('#dayStripItems .day-chip',{state:'attached',timeout:16000})}
   catch(err){
    const debug=await page.evaluate(()=>({
     title:document.title,ready:document.readyState,
     status:document.getElementById('status')?.textContent,
     updated:document.getElementById('updated')?.textContent,
     dayStrip:document.getElementById('dayStripItems')?.innerText,
     body:document.body?.innerText?.slice(0,1000)
    }));
    throw Error('Chile forecast boot failed: '+JSON.stringify({debug,scriptErrors,original:String(err)}));
   }
   if([390,1440].includes(width)){
    const dir=path.resolve(__dirname,'../artifacts/faro-reading');
    fs.mkdirSync(dir,{recursive:true});
    const originalTheme=await page.evaluate(()=>document.documentElement.dataset.theme);
    for(const theme of ['dark','light']){
     await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
     const tag=width+'-'+theme;
     await page.locator('#dailyOverview').screenshot({path:path.join(dir,tag+'-front.png')});
     await page.locator('.faro-surface-flip').click();
     await page.locator('#dailyOverview').screenshot({path:path.join(dir,tag+'-signals.png')});
     await page.locator('.faro-surface-flip').click();
     await page.locator('#dayview>.hourly-section').screenshot({path:path.join(dir,tag+'-hours.png')});
    }
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;window.scrollTo(0,0)},originalTheme);
   }
   assert.equal(scriptErrors.length,0,'Chile JS should boot cleanly: '+JSON.stringify(scriptErrors));
   const brand=await page.evaluate(()=>{
    const $=id=>document.getElementById(id),rect=id=>$(id).getBoundingClientRect();
    const b=rect('faroForecastLead'),u=document.querySelector('.forecast-toolbar').getBoundingClientRect(),
     d=rect('dailyOverview'),m=rect('faroLeadScore'),
     heroStyle=getComputedStyle($('faroForecastLead'));
    return {top:b.top,bottom:b.bottom,width:b.width,height:b.height,
     toolbar:u.top,daily:d.top,scoreX:m.x,
     headline:$('faroLeadHeadline').textContent,score:$('faroLeadScore').textContent,
     wave:$('faroLeadWave').textContent,period:$('faroLeadPeriod').textContent,
     wind:$('faroLeadWind').textContent,
     minWidth:document.documentElement.clientWidth,
     scrollWidth:document.documentElement.scrollWidth,
     grid:heroStyle.display==="flex"?1:heroStyle.gridTemplateColumns.split(' ').length};
   });
   if(width<=710){
    assert.ok(brand.bottom<=brand.toolbar+3,
     'Phone hero precedes toolbar: '+JSON.stringify(brand));
   }else{
    assert.ok(brand.toolbar<=brand.top+3,
     'Tablet/desktop context controls precede model hero: '+JSON.stringify(brand));
   }
   assert.ok(brand.daily>brand.top,
    'Branded model read must precede detailed Daily Take');

   const art=await page.evaluate(()=>{
    const lead=document.getElementById('faroForecastLead');
    const mark=lead.querySelector('.faro-beacon-symbol');
    const nav=document.querySelector('main > .app-nav');
    const active=nav.querySelector('button.active');
    const theme=document.documentElement.dataset.theme;
    const values={};
    for(const mode of ['dark','light']){
     document.documentElement.dataset.theme=mode;
     values[mode]={
      heroBackground:getComputedStyle(lead).backgroundImage,
      headlineInk:getComputedStyle(document.getElementById('faroLeadHeadline')).color,
      scorePanelBackground:getComputedStyle(lead.querySelector('.faro-lead-signal')).backgroundImage,
      beamOpacity:getComputedStyle(lead.querySelector('.faro-beacon-light')).opacity,
      iconOpacity:getComputedStyle(mark).opacity,
      activeNavBackground:getComputedStyle(active).backgroundImage,
      activeNavRadius:parseFloat(getComputedStyle(active).borderTopLeftRadius),
      navBg:getComputedStyle(nav).backgroundColor
     };
    }
    document.documentElement.dataset.theme=theme;
    return {
     ringSegments:mark.querySelectorAll('.faro-beacon-ring path').length,
     yellowCore:mark.querySelectorAll('.faro-beacon-core').length,
     markRect:mark.getBoundingClientRect().toJSON(),
     contourCount:lead.querySelectorAll('.faro-lead-contours').length,
     navButtons:nav.querySelectorAll('button').length,
     ...values
    };
   });
   assert.equal(art.ringSegments,4,'Beacon must preserve all four original FARO O segments');
   assert.equal(art.yellowCore,1,'Beacon must contain its warm yellow centre');
   assert.equal(art.contourCount,0,'Hero must not include decorative fake depth/swell curves');
   assert.equal(art.navButtons,3);
   assert.ok(art.markRect.width>35,'FARO symbol must be recognisable, not reduced to a tiny icon');
   // The cinematic FARO hero stays deep-ocean in both page themes.
   // The surrounding navigation, by contrast, reacts to the site theme.
   assert.equal(art.light.heroBackground,art.dark.heroBackground,
    'FARO hero dark-ocean treatment should be invariant across page themes');
   assert.equal(art.light.headlineInk,art.dark.headlineInk,
    'FARO hero maintains the same high-contrast white text');
   assert.equal(art.light.scorePanelBackground,art.dark.scorePanelBackground,
    'One dark ocean instrument in both site themes, without reintroducing a competing score tile');
   if(width<=710)assert.equal(art.light.scorePanelBackground,'none',
    'Phone hero uses an integrated signal, not a nested tinted card');
   assert.notEqual(art.light.activeNavBackground,art.dark.activeNavBackground,
    'Premium three-tab navigation should follow the theme');
   assert.ok(art.light.activeNavRadius>=9&&art.dark.activeNavRadius>=9,
    'Tabs must use a unified rounded navigation surface, not outlined rectangles');

   assert.ok(brand.width>=width*.75&&brand.scrollWidth<=brand.minWidth+3,
    'Responsive full-width FARO lead overflows: '+JSON.stringify(brand));
   assert.ok(brand.height<(width<=430?560:550),
    'Brand lead should be concise, not another giant Daily Take: '+JSON.stringify(brand));
   if(width>=1120)assert.equal(brand.grid,2,'Desktop hero splits editorial read and model signal');
   if(width<=430)assert.equal(brand.grid,1,'Mobile hero stacks into one coherent ocean moment');
   if(width<=430){
    const mobileHero=await page.evaluate(()=>{
     const html=document.documentElement,previous=html.dataset.theme;
     const lead=document.getElementById('faroForecastLead');
     const panel=lead.querySelector('.faro-lead-signal');
     const logo=lead.querySelector('.faro-lead-signature .faro-beacon-symbol');
     const main=lead.querySelector('.faro-lead-main');
     const data={};
     for(const theme of ['light','dark']){
      html.dataset.theme=theme;
      const style=getComputedStyle(panel);
      const panelBox=panel.getBoundingClientRect(),mainBox=main.getBoundingClientRect(),
       symbolBox=logo.getBoundingClientRect(),heroBox=lead.getBoundingClientRect();
      data[theme]={
       display:getComputedStyle(lead).display,
       backgroundImage:style.backgroundImage,
       backgroundColor:style.backgroundColor,
       radius:parseFloat(style.borderTopLeftRadius),
       borderTop:parseFloat(style.borderTopWidth),
       panelWidth:panelBox.width,heroWidth:heroBox.width,
       withinHero:panelBox.left>=heroBox.left-1&&panelBox.right<=heroBox.right+1,
       symbolWithinHero:symbolBox.left>=heroBox.left&&symbolBox.right<=heroBox.right+1,
       symbolClearFromContent:symbolBox.bottom<=mainBox.top+75
      };
     }
     html.dataset.theme=previous;
     return data;
    });
    for(const theme of ['light','dark']){
     const p=mobileHero[theme];
     assert.equal(p.display,'flex','Mobile hero uses a single-column flex layout');
     assert.equal(p.backgroundImage,'none','No inset rectangular glass score box on '+theme);
     assert.equal(p.backgroundColor,'rgba(0, 0, 0, 0)','Transparent integrated score rail on '+theme);
     assert.equal(p.radius,0,'Score rail is not a floating square tile on '+theme);
     assert.ok(p.borderTop<=1,'One hairline divider, not full boxed border: '+JSON.stringify(p));
     assert.ok(p.withinHero&&p.symbolWithinHero&&p.symbolClearFromContent,
      'Mobile icon and instrument must fit the hero, without overlap: '+JSON.stringify(p));
    }
   }
   const modelScore=Number(brand.score);
   if(Number.isFinite(modelScore)){
    assert.ok(brand.wave.includes('m')&&brand.period.includes('s')&&brand.wind.includes('km/h'),
     'Actual model variables must power the ocean lead');
   }
   assert.equal(await page.locator('#faroLeadRead').count(),1);
   assert.equal(await page.locator('#faroLeadMap').count(),1);
   const rects=await page.evaluate(()=>({
    daily:document.querySelector('.day-outlook-section').getBoundingClientRect().top,
    route:document.querySelector('.faro-journey-nav').getBoundingClientRect().top,
    week:document.getElementById('dayStrip').getBoundingClientRect().top
   }));
   assert.ok(rects.daily<rects.week,'Daily read must precede the seven-day comparison');
   assert.ok(Number.isFinite(rects.route),'Quick navigation must remain measurable');

   assert.equal(await page.locator('#dayStripItems .day-chip').count(),7);
   // One FARO design system, rather than contradictory inherited layout
   // overrides. Mobile has no giant blank vertical bands; desktop does
   // not force the daily card to stretch to the height of hourly content.
   const visual=await page.evaluate(()=>{
    const $=s=>document.querySelector(s),style=s=>getComputedStyle($(s));
    const selectors=['.day-overview-row','.faro-ocean-surface','#faroPrepHints',
      '#dayUVBadge','#openSpotDNA'];
    const rects=selectors.map(selector=>{
     const r=$(selector).getBoundingClientRect();
     return {selector,top:r.top,bottom:r.bottom,height:r.height,width:r.width};
    });
    const gaps=rects.slice(1).map((r,i)=>({from:rects[i].selector,to:r.selector,gap:r.top-rects[i].bottom}));
    const hero=$('#dailyOverview').getBoundingClientRect();
    return {gaps,heroHeight:hero.height,heroWidth:hero.width,
     display:style('#dailyOverview').display,
     flexDirection:style('#dailyOverview').flexDirection,
     oceanColumns:style('#daySignalMetrics').gridTemplateColumns.split(' ').length,
     waveSpan:style('.chile-day-wave-feature').gridColumnStart,
     dateFont:style('#datehead').fontFamily,
     numericFont:style('#dayWave').fontFamily,
     scoreFont:style('.chile-chip-number').fontFamily,
     waveColor:style('#dayWave').color,
     scoreColor:style('.chile-chip-number').color,
     scrollWidth:document.documentElement.scrollWidth,
     clientWidth:document.documentElement.clientWidth};
   });
   assert.equal(visual.display,'flex','Daily hero must use single vertical design composition');
   assert.equal(visual.flexDirection,'column');
   assert.ok(visual.oceanColumns>=1&&visual.oceanColumns<=3,
    'Offshore evidence must use one to three responsive columns');
   assert.ok(['1','auto'].includes(visual.waveSpan),
    'Technical wave instrument must stay within its responsive grid');
   assert.match(visual.dateFont,/Archivo/i,'Only editorial headings use Archivo');
   assert.match(visual.numericFont,/Manrope/i,'Numeric wave data uses readable Manrope');
   assert.match(visual.scoreFont,/Manrope/i,'Score numerals match other numeric metrics');
   assert.notEqual(visual.waveColor,visual.scoreColor,
    'Blue/teal ocean measurements and quality-score semantic palette must stay distinct');
   for(const {from,to,gap} of visual.gaps){
    assert.ok(gap>=-4&&gap<=48,
     'Unexpected whitespace or overlap between reading, preparation and UV: '+JSON.stringify({width,from,to,gap,visual}));
   }
   // The previous desktop defect hid the eighth slot and left the two
   // instruments visually unrelated. Assert actual boxes, not only CSS rules.
   if(width>=1120){
    const deck=await page.evaluate(()=>{
     const r=s=>document.querySelector(s).getBoundingClientRect();
     const buttons=[...document.querySelectorAll('#slots>button')].map(e=>{
      const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};
     });
     return {daily:r('.day-outlook-section'),hours:r('.hourly-section'),
      rail:r('#slots'),buttons,columns:getComputedStyle(document.querySelector('#slots')).gridTemplateColumns.split(' ').length};
    });
    assert.equal(deck.columns,4,'Four readable score windows per desktop row');
    assert.equal(deck.buttons.length,8,'All eight two-hour windows should remain accessible');
    assert.ok(deck.buttons.every(x=>x.width>=70&&x.right<=deck.rail.right+2),
     'Every hourly score, including 20–22, must fit completely inside its panel');
    assert.ok(Math.abs(deck.buttons[0].y-deck.buttons[3].y)<3&&
      deck.buttons[4].y>deck.buttons[0].y+35,
     'Desktop score windows must form two intentional rows');
    assert.ok(deck.buttons[0].bottom+5<=deck.buttons[4].y,
     'Desktop score rows must have an actual visible gap: '+JSON.stringify(deck.buttons));
    assert.ok(Math.abs(deck.daily.top-deck.hours.top)<12,
     'The two desktop reading instruments should align at the top');
    assert.ok(Math.abs(deck.daily.height-deck.hours.height)<120,
     'Desktop panels should be proportionate without forcing empty space');
    const selectedHeight=await page.locator('#faroHourlyPreview').evaluate(el=>el.getBoundingClientRect().height);
    assert.ok(selectedHeight<=168,
     'Selected-hour card should not stretch into a large blank panel: '+selectedHeight);
    const selected=await page.locator('.faro-hourly-score-value').evaluate(el=>{
      const box=el.getBoundingClientRect();
      const frame=el.closest('#faroHourlyPreview').getBoundingClientRect();
      return {score:{x:box.x,y:box.y,width:box.width,height:box.height},
       frame:{x:frame.x,y:frame.y,width:frame.width,height:frame.height},
       text:el.textContent};
    });
    assert.ok(selected.score.width>22&&selected.score.height>20&&
      selected.score.y>=selected.frame.y&&
      selected.score.y+selected.score.height<=selected.frame.y+selected.frame.height+2,
      'Chosen FARO index must be visible inside the desktop instrument: '+JSON.stringify(selected));
    assert.equal(selected.text.trim(),
      (await page.locator('#slots > button.selected .chile-slot-score').textContent()).trim(),
      'Chosen index and hourly rail must display the same model score');
   }
   // Both depths occupy the same fixed footprint without hiding safety.
   const fixedBefore=await page.locator('.faro-ocean-surface').boundingBox();
   assert.equal(await page.locator('.faro-ocean-surface').getAttribute('data-mode'),'read');
   assert.equal(await page.locator('#chileDecisionHeadline').isVisible(),true);
   assert.equal(await page.locator('#dayUVBadge').isVisible(),true);
   await page.locator('.faro-surface-flip').click();
   assert.equal(await page.locator('.faro-ocean-surface').getAttribute('data-mode'),'signals');
   await page.locator('#faroTechnicalEvidence > summary').click();
   await page.locator('#daySignalMetrics').waitFor({state:'visible',timeout:3000}).catch(async err=>{
    const diag=await page.locator('#daySignalMetrics').evaluate(el=>{
     const styles=getComputedStyle(el),parent=getComputedStyle(el.parentElement);
     return {self:{display:styles.display,visibility:styles.visibility,opacity:styles.opacity,height:el.getBoundingClientRect().height},
      parent:{display:parent.display,visibility:parent.visibility,opacity:parent.opacity},
      panel:el.closest('.faro-ocean-surface')?.dataset.mode};
    });
    throw new Error('Signals not visible: '+JSON.stringify(diag)+'; '+err.message);
   });
   assert.equal(await page.locator('#dayUVBadge').isVisible(),true);
   const fixedAfter=await page.locator('.faro-ocean-surface').boundingBox();
   assert.ok(Math.abs(fixedBefore.height-fixedAfter.height)<2,
    'Wave transition must replace content in place, not grow a new card');
   await page.locator('.faro-surface-flip').click();
   assert.equal(await page.locator('#chileDecisionHeadline').isVisible(),true);
   assert.equal(await page.locator('#faroPrepHints .faro-prep-chip--uv').isVisible(),false,
    'UV appears once in the permanent warning stripe');
   if(width<=430)assert.ok(visual.heroHeight<770,
    'Mobile daily hero has excessive forced height: '+JSON.stringify(visual));
   assert.ok(visual.scrollWidth<=visual.clientWidth+3,
    'Daily hero overflows viewport: '+JSON.stringify(visual));

   assert.equal(await page.locator('#dayWaveMeter .faro-wave-ruler-mark').count(),8,
    'Zeeland-style wave-height scale must show all eight bars');
   assert.match(await page.locator('#dayWave').textContent(),/m/,'Daily hero must feature modelled wave height');
   assert.equal(await page.locator('#chileWaveExplain').count(),1);
   await page.locator('#chileWaveExplain').evaluate(el=>el.open=true);
   assert.match(await page.locator('#chileWaveHow').textContent(),/SWELL PRINCIPAL|PRIMARY SWELL/);
   assert.match(await page.locator('#chileWaveHow').textContent(),/VIENTO Y RACHAS|WIND & GUSTS/);
   assert.equal(await page.locator('#chileSessionVibe').count(),0);
   assert.equal(await page.locator('#sessionAtGlance .chile-session-overline').count(),0,
    'A gear checklist must not repeat the selected session headline');
   assert.equal(await page.locator('#sessionAtGlance .chile-session-head').count(),0,
    'The second score/wave instrument has been removed');
   assert.equal(await page.locator('#sessionAtGlance .chile-session-checklist-intro').count(),1);
   assert.equal(await page.locator('#sessionEssentials .essential-tag').count(),5,
    'The practical checklist retains five relevant equipment and weather signals');
   const qualityOf=v=>v>=8.5?'Excelente':v>=7?'Bueno':v>=5?'Regular':v>=3?'Malo':'Muy malo';
   const toneOf=v=>v>=8.5?'tone-great':v>=7?'tone-good':v>=5?'tone-fair':v>=3?'tone-poor':'tone-low';
   const firstChip=page.locator('#dayStripItems .day-chip').first();
   const displayedValue=Number(await firstChip.locator('.chile-chip-number').textContent());
   assert.equal(await firstChip.locator('.chile-chip-grade').textContent(),qualityOf(displayedValue),
    'Daily scores must use Zeeland score categories, not decisions');
   assert.ok((await firstChip.getAttribute('class')).includes(toneOf(displayedValue)),
    'Daily scores must use Zeeland colour band thresholds');
   // Ensure no future Chile light-mode override darkens any of the
   // original FIVE FARO score inks (computed style in real browser).
   const vivid=await page.evaluate(()=>{
    const html=document.documentElement,prev=html.dataset.theme;
    html.dataset.theme="light";
    const expected={
     "brand-band-verylow":"rgb(239, 155, 119)",
     "brand-band-low":"rgb(239, 189, 110)",
     "brand-band-mid":"rgb(224, 204, 115)",
     "brand-band-regular":"rgb(177, 213, 116)",
     "brand-band-high":"rgb(140, 197, 132)"
    },out=[];
    const band=el=>[...el.classList].find(x=>x.startsWith("brand-band-"));
    try{
     for(const [b,rgb]of Object.entries(expected)){
      const card=document.createElement("button"),score=document.createElement("strong");
      card.className="day-chip score-tint "+b;score.className="chile-chip-number";
      score.textContent="7.5";card.append(score);
      document.getElementById("dayStripItems").append(card);
      out.push({component:b,actual:getComputedStyle(score).color,expected:rgb});
      card.remove();
     }
     for(const [name,outer,inner] of [
      ["daily","#dayStripItems .day-chip[class*='brand-band-']",".chile-chip-number"],
      ["hourly","#slots button[class*='brand-band-']",".chile-slot-score"]
     ]){
      const parent=document.querySelector(outer),score=parent?.querySelector(inner);
      if(!score)throw Error("Missing "+name+" numerical score");
      out.push({component:name,actual:getComputedStyle(score).color,expected:expected[band(parent)]});
     }
    }finally{html.dataset.theme=prev;}
    return out;
   });
   for(const item of vivid)assert.equal(item.actual,item.expected,
    "Light theme must keep FARO's vivid score inks: "+JSON.stringify({width,...item}));
   assert.equal(await page.locator('#dayStrip').evaluate(el=>el.open),false,
    'Weekly comparison must start collapsed so the daily decision comes first');
   assert.equal(await page.locator('#sessionDetailExpand').evaluate(el=>el.open),false,
    'Session instrument must not duplicate daily statistics before expansion');
   assert.match(await page.locator('#dayStripSelected').textContent(),/\/10/,
    'Collapsed weekly summary still identifies the current selection');
   await page.locator('#dayStrip > summary').click();
   assert.equal(await page.locator('#dayStrip').evaluate(el=>el.open),true);
   await page.locator('#dayStripItems .day-chip').nth(1).click();
   // The 06:00 window has stronger wind than 08:00: FARO must say what to
   // do and name the better future slot instead of only mentioning sandbanks.
   await page.locator('#slots button').first().click();
   assert.match(await page.locator('#chileDecisionHeadline').textContent(),/viento|wind/i,
    'A windy slot must lead with a wind-based verdict');
   assert.match(await page.locator('#chileVibeAction').textContent(),/Mejor candidata|Better option/i,
    'A poor slot must point to a grounded better upcoming forecast window');
   await page.locator('#slots button').nth(1).click();
   const chosen=page.locator('#slots button').nth(1);
   assert.equal(await page.locator('#faroLeadWindowLabel').textContent(),
    'FRANJA SELECCIONADA','Lead must reflect manually chosen window, not another best pick');
   assert.equal(await page.locator('#faroLeadScore').textContent(),
    await chosen.locator('.chile-slot-score').textContent(),
    'Branded hero and detailed slot share exactly the same score');

   const hourlyScore=Number(await chosen.locator('.chile-slot-score').textContent());
   assert.equal(await chosen.locator('.chile-slot-quality').textContent(),qualityOf(hourlyScore),
    'Hourly score must show the same Zeeland quality caption');
   assert.equal(await page.locator('#sessionAtGlance .chile-session-rating').count(),0,
    'Gear checklist must not repeat the daily score and offshore wave instrument');
   assert.match(await page.locator('#sessionDetailSummary').textContent(),/mm|Shorty|accesorios/i,
    'Collapsed gear checklist names actual wetsuit guidance, rather than a duplicated score');
   await page.waitForFunction(()=>document.getElementById('detail')?.textContent?.includes('UTC'),{timeout:6000});
   // The technical drawer is intentionally collapsed; innerText is empty
   // for hidden elements, while textContent still exposes populated content.
   const text=await page.locator('#detail').textContent();
   assert.match(text,/Swell secundario|Secondary swell/);
   assert.match(text,/UTC/);
   assert.match(text,/7 d|7 d|ventanas|windows/i);
   assert.ok(!(await page.locator('a[href*="knmi.nl"]').count()),'Netherlands source may not appear on Chile');
   assert.ok(await page.locator('a[href="https://marejadas.uv.cl/CL15CCN01"]').count(),
    'Officially identified university La Boca coastal model needs provenance link');
   assert.equal(await page.locator('#chileRiskDisclosure').count(),1);
   // Single unified ocean reader: Map is the initial view on both layouts,
   // Compass is the only alternative, never another duplicate teaser box.
   assert.equal(await page.locator('.faro-ocean-explorer').count(),1);
   assert.equal(await page.locator('.faro-ocean-tools').count(),0);
   assert.equal(await page.locator('#coastMapExpand').evaluate(el=>el.open),true,
    'Map is immediately available through the unified ocean reader');
   assert.equal(await page.locator('#openOceanMap').getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#openOceanCompass').getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('#coastMapExpand .leaflet-container').count(),0);
   await page.locator('#coastMapExpand').evaluate(el=>el.open=true);
   await page.waitForFunction(()=>document.querySelector('#chileCoastMap .faro-map-schematic g[data-spot="CL-VS:la-boca-concon"]'),{timeout:8000});
   // The selected spot can have an additional focus marker. Confirm every
   // unique reference is present instead of incorrectly requiring 3 nodes.
   for(const id of ['CL-VS:la-boca-concon','CL-VS:renaca','CL-VS:ritoque']){
    assert.ok(await page.locator('#chileCoastMap .faro-map-schematic g[data-spot="'+id+'"]').count()>=1,
     'Map must include published coastal reference '+id);
   }
   if(width===390){
    // The system select is preserved for model state, but only FARO's own
    // keyboard/mobile-friendly listbox may be visible to the surfer.
    assert.equal(await page.locator('#chileSpotSelect').getAttribute('tabindex'),'-1');
    await page.locator('#chileSpotButton').click();
    assert.equal(await page.locator('#chileSpotButton').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#chileSpotOptions').isVisible(),true);
    assert.equal(await page.locator('#chileSpotOptions [role="option"]').count(),5);
    const menu=await page.locator('#chileSpotOptions').evaluate(e=>({
     bg:getComputedStyle(e).backgroundColor,
     theme:document.documentElement.dataset.theme,
     panel:e.getBoundingClientRect().width,
     field:e.closest('.faro-spot-choice').getBoundingClientRect().width
    }));
    if(menu.theme==='dark')assert.notEqual(menu.bg,'rgb(255, 255, 255)',
     'Dark mode cannot open the browser-white native popup');
    assert.ok(menu.panel<=menu.field+2,'Menu remains within selected-spot column');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#chileSpotOptions').isVisible(),false);
    await page.locator('#chileSpotButton').focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#chileSpotOptions').isVisible(),true,
     'ArrowDown opens themed listbox with selected spot focused');
    await page.locator('#chileSpotOptions [role="option"]').nth(1).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#chileSpotSelect').inputValue(),'CL-VS:renaca',
     'Keyboard selection synchronises the original model selector');
    assert.equal(await page.locator('#chileSpotButton').getAttribute('aria-expanded'),'false');
    await page.locator('#chileSpotSelect').selectOption('CL-VS:la-boca-concon');
    await page.waitForFunction(()=>document.querySelector('#chileSpotButton .faro-spot-choice-text')?.textContent?.includes('La Boca'));
    await page.locator('#chileSpotSelect').selectOption('CL-VS:ventanas');
    await page.waitForFunction(()=>document.getElementById('ventanasAccessNotice')?.hidden===false,{timeout:12000});
    const mobile=await page.locator('#ventanasAccessNotice summary').evaluate(e=>{
     const b=e.getBoundingClientRect();
     return {height:b.height,display:getComputedStyle(e).display,
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth};
    });
    assert.ok(['flex','grid'].includes(mobile.display),'Compact access notice supports responsive flex/grid');
    assert.ok(mobile.height<=124,
     'Dated FARO access warning must remain readable and occupy a modest mobile area: '+JSON.stringify(mobile));
    assert.ok(mobile.scrollWidth<=mobile.clientWidth+3,
     'New visual direction introduces horizontal scrolling: '+JSON.stringify(mobile));
    await page.locator('#chileSpotSelect').selectOption('CL-VS:la-boca-concon');
    await page.waitForFunction(()=>document.getElementById('ventanasAccessNotice')?.hidden===true,{timeout:12000});
   }
   if(width===1180){
    // Ventanas is now modelled but legally restricted: the index may be
    // calculated without turning the forecast into an access recommendation.
    const regionButton=page.locator('#chileCoastMap .faro-lens-recenter');
    await regionButton.evaluate(el=>el.disabled=false);
    await regionButton.click();
    assert.equal(await page.locator('#chileCoastMap .faro-map-schematic g[data-reference-spot="CL-VS:ventanas"]').count(),0,
     'Ventanas must no longer be an unscored reference marker');
    const marker=page.locator('#chileCoastMap .faro-map-schematic g[data-spot="CL-VS:ventanas"]');
    assert.equal(await marker.count(),1,'Ventanas is a fifth experimental modelled spot');
    const warning=page.locator('#chileCoastMap .faro-map-schematic g[data-map-access="CL-VS:ventanas"]');
    assert.equal(await warning.count(),1,'Reported restriction must have a separate map warning target');
    await warning.focus();
    assert.equal(await page.locator('#faroMapAccessTip').isVisible(),true,
     'Keyboard focus reveals the type of warning, not just an exclamation mark');
    assert.match(await page.locator('#faroMapAccessTip').textContent(),/restricci[oó]n|restriction/i);
    assert.match(await page.locator('#faroMapAccessTip').textContent(),/29 oct 2026|29 Oct 2026/i,
     'Access warning retains the latest dated report and its unverified status');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#faroMapAccessTip').isVisible(),true,
     'Keyboard Enter pins a mini warning tooltip');
    assert.notEqual(await page.locator('#chileSpotSelect').inputValue(),'CL-VS:ventanas',
     'Activating the warning itself must NOT select a different beach');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#faroMapAccessTip').isVisible(),false);
    await warning.evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));
    assert.equal(await page.locator('#faroMapAccessTip').isVisible(),true,
     'Touch-equivalent click toggles a small warning popover');
    assert.notEqual(await page.locator('#chileSpotSelect').inputValue(),'CL-VS:ventanas');
    await page.keyboard.press('Escape');
    await marker.evaluate(el=>el.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    await page.waitForFunction(()=>document.querySelector('#chileSpotSelect')?.value==='CL-VS:ventanas'&&
     document.querySelector('#ventanasAccessNotice')?.hidden===false,{timeout:12000});
    assert.match(await page.locator('#ventanasAccessNotice').textContent(),/restricci[oó]n|restriction/i);
    assert.equal(await page.locator('#ventanasAccessNotice').evaluate(el=>el.open),false,
     'Restriction must remain compact by default, unlike the old full-screen warning');
    assert.equal(await page.locator('#ventanasAccessNotice .faro-access-brand img').count(),0,
     'FARO mark must be a background watermark, not a foreground sticker');
    assert.match(await page.locator('#faroAccessKicker').textContent(),/FARO/);
    assert.match(await page.locator('#faroAccessSeverity').textContent(),/REPORTED|REPORTADA|REPORTE FECHADO|DATED REPORT/i);
    assert.match(await page.locator('#faroAccessSubline').textContent(),/Último reporte|Last reported/i);
    assert.match(await page.locator('#faroAccessSubline').textContent(),/no verificado|unverified/i);
    const editorial=await page.locator('#ventanasAccessNotice').evaluate(n=>{
     const summary=n.querySelector('summary');
     const get=e=>getComputedStyle(e),watermark=getComputedStyle(n,'::before');
     return {summaryLayout:get(summary).display,
      width:summary.getBoundingClientRect().width,
      height:summary.getBoundingClientRect().height,
      watermarkImage:watermark.backgroundImage,watermarkOpacity:Number(watermark.opacity),
      datedEvidence:n.querySelector('#faroAccessEvidence')?.textContent||'',
      summarySourceDisplay:get(n.querySelector('#faroAccessSubline')).display};
    });
    assert.ok(['flex','grid'].includes(editorial.summaryLayout),'Compact access notice needs a supported row/grid layout');
    assert.ok(editorial.height<=120,'Dated FARO warning must remain reasonably compact: '+JSON.stringify(editorial));
    assert.match(editorial.watermarkImage,/faro-o-favicon\.svg/,
     'FARO O must appear as a background watermark in the alert');
    assert.ok(editorial.watermarkOpacity>0&&editorial.watermarkOpacity<=0.08,
     'Watermark should be an atmospheric texture, not a foreground logo');
    assert.ok(['none','block','inline'].includes(editorial.summarySourceDisplay),
     'Source context must remain available without overflow');
    assert.match(editorial.datedEvidence,/29|oct|October|octubre|2026/i);

    assert.match(await page.locator('#faroAccessSourceLink').getAttribute('href'),
     /^https:\/\/(?:www\.)?(?:soychile\.cl|puranoticia\.pnt\.cl)\//,
     'Access notice must keep a direct dated Chilean source link');

    assert.equal(await page.locator('#chileCoastMap .faro-map-schematic g[data-spot="CL-VS:ventanas"] text').count()>0,true);
    await page.locator('#ventanasAccessNotice > summary').click();
    assert.equal(await page.locator('#ventanasAccessNotice').evaluate(el=>el.open),true);
    await page.locator('#ventanasAccessNotice > summary').click();
    assert.equal(await page.locator('#ventanasAccessNotice').evaluate(el=>el.open),false);
    // A confirmed CURRENT restriction suppresses the score; a dated,
    // explicitly unverified report must not be treated as a current ban.
    const noticeText=(await page.locator('#ventanasAccessNotice').textContent())||'';
    const heroStatus=(await page.locator('#faroLeadStatus').textContent())||'';
    const verifiedRestricted=/restricci[oó]n (?:actual|vigente|confirmada)|current (?:access )?restriction/i.test(noticeText)
      && !/no verificado|unverified/i.test(noticeText);
    if(verifiedRestricted){
      assert.equal((await page.locator('#faroLeadScore').textContent()).trim(),"—",
       'Verified current restriction must suppress actionable score');
      assert.notEqual(await page.locator('#faroLeadGrade').textContent(),'Excelente');
    }else{
      assert.match(noticeText,/no verificado|unverified/i,
       'Historical access news must expose uncertainty');
      assert.ok(!/restricci[oó]n vigente|confirmed restriction/i.test(heroStatus),
       'Historical lifting report must not claim an active verified restriction');
    }

    await page.locator('#chileSpotSelect').selectOption('CL-VS:la-boca-concon');
    await page.waitForFunction(()=>document.querySelector('#ventanasAccessNotice')?.hidden===true,{timeout:12000});
    await regionButton.evaluate(el=>el.disabled=false);
    await regionButton.click();
   }
   const arrowCount=await page.locator('#chileCoastMap .faro-map-schematic line[stroke="#137d9f"], #chileCoastMap .faro-map-schematic line[stroke="#ba7628"]').count();
   assert.equal(arrowCount,0,'Schematic must not invent swell rays from model grid points');
   if(width>=1120){
    const sessionBounds=await page.locator('#dayview > .session-section').boundingBox();
    const mapBounds=await page.locator('#coastMapExpand').boundingBox();
    assert.ok(sessionBounds&&mapBounds,'Session and map must both occupy desktop grid');
    assert.ok(sessionBounds.y>=mapBounds.y+mapBounds.height-10,
     'Practical gear checklist must follow map and swell compass, not conceal them');
    assert.ok(mapBounds.width>=sessionBounds.width*.95,'Coastal map must span the full-width reading area');
    const daily=await page.locator('.day-outlook-section').boundingBox();
    const hourly=await page.locator('#dayview > .hourly-section').boundingBox();
    assert.ok(daily&&hourly,'Daily and hourly decisions both render');
    assert.ok(Math.abs(daily.y-hourly.y)<24,'Daily and hourly must start on the same decision row');
    assert.ok(mapBounds.y>=Math.max(daily.y+daily.height,hourly.y+hourly.height)-10,
     'Ocean tools must follow the paired day and hourly decision row');
    assert.ok(sessionBounds.width>hourly.width*1.5,
     'Selected session disclosure spans the desktop instead of reserving dead left space');
    const font=await page.locator('#dayWave').evaluate(el=>getComputedStyle(el).fontFamily);
    assert.match(font,/Manrope|faro-text|system-ui/i,'Model wave size must use Zeeland number font, not Archivo Black');
   }
   assert.equal(await page.locator('#coastMapExpand .faro-direction-hud').count(),1,
    'Map viewport must display a compact, accessible direction HUD');
   assert.equal(await page.locator('#coastMapExpand .faro-direction-hud svg.faro-hud-arrow').count(),2,
    'Combined layer must show two unambiguous travel-direction arrows');
   assert.equal(await page.locator('#chileCoastMap .faro-lens-quick-metrics').count(),1,
    'Coastal read must separate swell and wind measures from the map');
   assert.match(await page.locator('#faroHourlyPreview').textContent(),/FARO · TU FRANJA|FARO · YOUR WINDOW/);
   await page.locator('#faroLeadRead').click();
   assert.ok((await page.locator('#dailyOverview').boundingBox())!==null,
    'Hero CTA leads to the existing detailed scientific read');
   // The secondary hero action is intentionally hidden at some mobile widths.
   if(await page.locator('#faroLeadMap').isVisible()){
    await page.locator('#faroLeadMap').click();
    assert.equal(await page.locator('#coastMapExpand').evaluate(el=>el.open),true,
     'Visible hero map CTA opens the existing Coastal Lens');
   }
      // Selected-hour details stay in the same footprint as the compact reading.
    assert.equal(await page.locator('#faroHourlyPreview').getAttribute('data-mode'),'read');
    assert.equal(await page.locator('.faro-hourly-score-value').isVisible(),true,
      'Model index is the visible, non-duplicated hourly headline');
    assert.equal((await page.locator('.faro-hourly-score-value').textContent()).trim(),
      (await page.locator('#slots > button.selected .chile-slot-score').textContent()).trim());
    const hourlySize=await page.locator('#faroHourlyPreview').boundingBox();
    await page.locator('.faro-hourly-flip').click();
    assert.equal(await page.locator('#faroHourlyPreview').getAttribute('data-mode'),'signals');
    const hourlyAfter=await page.locator('#faroHourlyPreview').boundingBox();
    assert.ok(Math.abs(hourlyAfter.height-hourlySize.height)<2,
     'Hourly detail must not expand the surface: '+JSON.stringify({
      width,before:hourlySize.height,after:hourlyAfter.height,
      preview:await page.locator('#faroHourlyPreview').evaluate(el=>{
       const read=el.querySelector('.faro-hourly-window');
       const front=el.querySelector('.faro-hourly-front');
       const back=el.querySelector('.faro-hourly-back');
       return {windowHeight:read.getBoundingClientRect().height,
        frontHeight:front.getBoundingClientRect().height,backHeight:back.getBoundingClientRect().height,
        windowDisplay:getComputedStyle(read).display,backPosition:getComputedStyle(back).position};
      })
     }));
    await page.locator('#faroHourlyGoLens').click();
   assert.equal(await page.locator('#coastMapExpand').evaluate(el=>el.open),true);
   // The supplementary map/compass switch is desktop-first. On mobile,
   // the selected-window map entry is the supported primary action.
   const bothOceanControlsVisible=
    await page.locator('#openOceanMap').isVisible()&&
    await page.locator('#openOceanCompass').isVisible();
   if(bothOceanControlsVisible){
    await page.locator('#openOceanCompass').click();
    assert.equal(await page.locator('#waveInsightExpand').evaluate(el=>el.open),true,
     'Compass opens within the same coastal reader');
    assert.equal(await page.locator('#coastMapExpand').evaluate(el=>el.open),false,
     'Compass closes the duplicate map panel');
   }
   if(bothOceanControlsVisible){
    assert.equal(await page.locator('#openOceanCompass').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#waveInsightExpand .chile-compass-svg').count(),1,
     'Swell compass remains data driven');
   }
   assert.equal(await page.locator('#chileCoastMap .faro-lens-stage').count(),1,'Map and ocean read share a stage');
   assert.equal(await page.locator('#chileCoastMap .faro-map-focus').count(),1,'Map has a selected-break label');
   if(await page.locator('#openOceanMap').isVisible()){
    await page.locator('#openOceanMap').click();
    assert.equal(await page.locator('#coastMapExpand').evaluate(el=>el.open),true);
   }
   assert.equal(await page.locator('#waveInsightExpand').evaluate(el=>el.open),false);
   assert.equal(await page.locator('#openOceanMap').getAttribute('aria-pressed'),'true');
   // On phone-width viewports ensure region signal colours agree with the
   // semantic HUD palette, including on the dark selected beach marker.
   const colours=await page.evaluate(()=>{
    const host=document.getElementById('chileCoastMap');
    const html=document.documentElement,original=html.dataset.theme,out={};
    const pins=['regional','selected'].map(type=>{
     const pin=document.createElement('div');
     pin.className='faro-map-pin'+(type==='selected'?' is-current':'');
     const nodes={};
     for(const level of ['favourable','mixed','unfavourable']){
      const tick=document.createElement('span');
      tick.className='faro-region-fit-tick is-wind';
      tick.dataset.fit=level==='favourable'?'inside':level==='unfavourable'?'outside':'edge';
      tick.dataset.level=level;
      tick.textContent='W';pin.append(tick);nodes[level]=tick;
     }
     host.append(pin);return {type,pin,nodes};
    });
    try{
     for(const theme of ['light','dark']){
      html.dataset.theme=theme;
      out[theme]={};
      for(const {type,nodes} of pins){
       out[theme][type]={};
       for(const [level,el] of Object.entries(nodes)){
        const style=getComputedStyle(el);
        out[theme][type][level]={
         ink:style.color,bg:style.backgroundColor
        };
       }
      }
     }
    }finally{
     html.dataset.theme=original;
     pins.forEach(x=>x.pin.remove());
    }
    return out;
   });
   for(const theme of ['light','dark']){
    for(const level of ['favourable','mixed','unfavourable']){
     const expected=theme==='light'?{
      favourable:'rgb(44, 110, 88)',mixed:'rgb(132, 109, 66)',
      unfavourable:'rgb(154, 88, 82)'
     }:{
      favourable:'rgb(167, 211, 191)',mixed:'rgb(222, 199, 157)',
      unfavourable:'rgb(226, 171, 160)'
     };
     assert.equal(colours[theme].regional[level].ink,expected[level],
      'Unselected regional tick must use the HUD palette for '+level);
     const selectedInk={
      favourable:'rgb(34, 94, 78)',mixed:'rgb(114, 83, 27)',
      unfavourable:'rgb(154, 56, 52)'
     }[level];
     assert.equal(colours[theme].selected[level].ink,selectedInk,
      'Selected tick text must be dark on white for legibility: '+theme+' '+level);
     assert.equal(colours[theme].selected[level].bg,'rgb(247, 251, 249)',
      'Selected S/W indicator must have an opaque light background');
    }
   }

   const mapText=await page.locator('#chileCoastMap').textContent();
   assert.match(mapText,/La Boca/);
   assert.match(mapText,/SWELL/);
   assert.match(mapText,/VIENTO|WIND/);
   assert.match(mapText,/OpenStreetMap/,'Map must show attribution and limits');
   assert.ok(await page.locator('#chileCoastMap a[href*="lineup.surf"][href*="camera1"]').count(),
    'Map makes the original free-account La Boca surf camera discoverable');
   await page.locator('#chileCoastMap .faro-lens-selected-detail').evaluate(el=>el.open=true);
   await page.locator('#chileCoastMap button.faro-map-shortcut').click();
   assert.equal(await page.locator('#fieldNotesExpand').evaluate(el=>el.open),true,
    'One-click coast-map action should reveal the private observation journal');
   // Regression for the reported regional-map jump. The browser QA
   // deliberately blocks Leaflet CDN so this uses the same georeferenced SVG
   // fallback. Its regional state and forecast layout must still remain stable
   // during a selection and asynchronous model refresh.
   if(width===1180){
    await page.locator('#fieldNotesExpand').evaluate(el=>el.open=false);
    await page.locator('#chileCoastMap .faro-lens-selected-detail').evaluate(el=>el.open=false);
    await page.locator('#chileCoastMap .faro-lens-recenter').evaluate(el=>el.disabled=false);
    await page.locator('#chileCoastMap .faro-lens-recenter').click();
    assert.equal(await page.locator('#chileCoastMap').getAttribute('data-map-view'),'region');
    await page.locator('#coastMapExpand').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
    const initialTop=await page.locator('#coastMapExpand').evaluate(el=>el.getBoundingClientRect().top);
    await page.locator('#chileCoastMap .faro-map-schematic g[data-spot="CL-VS:renaca"]').evaluate(el=>
      el.dispatchEvent(new MouseEvent('click',{bubbles:true})));
    await page.waitForFunction(()=>
      document.getElementById('chileSpotSelect')?.value==='CL-VS:renaca'&&
      document.querySelector('#chileCoastMap .faro-lens-read-heading')?.textContent?.includes('Reñaca'),
      {timeout:12000});
    assert.equal(await page.locator('#chileCoastMap').getAttribute('data-map-view'),'region',
     'Selecting another beach must not silently revert to Beach focus');
    const finalTop=await page.locator('#coastMapExpand').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(Math.abs(finalTop-initialTop)<20,
     'Regional map must remain anchored after async spot change: '+JSON.stringify({initialTop,finalTop}));
    await page.locator('#chileSpotSelect').selectOption('CL-VS:la-boca-concon');
    await page.waitForFunction(()=>document.querySelector('#chileCoastMap .faro-lens-read-heading')?.textContent?.includes('La Boca'),{timeout:12000});
    await page.locator('#chileCoastMap .faro-lens-recenter').evaluate(el=>el.disabled=false);
    await page.locator('#chileCoastMap .faro-lens-recenter').click();
   }
   // Switch spot by selecting the georeferenced map pin, not just the dropdown.
   if(width>=1120){
    await page.locator('#chileCoastMap .faro-map-schematic g[data-spot="CL-VS:renaca"]').click();
    await page.waitForFunction(()=>document.getElementById('chileSpotSelect')?.value==='CL-VS:renaca',{timeout:6000});
    await page.locator('#chileSpotSelect').selectOption('CL-VS:la-boca-concon');
    await page.waitForFunction(()=>document.getElementById('chileSpotSelect')?.value==='CL-VS:la-boca-concon',{timeout:6000});
   }
   await page.locator('#coastMapExpand').evaluate(el=>el.open=false);
   const cam=page.locator('#cameraExpand');
   await cam.evaluate(el=>el.open=true);
   assert.ok(await page.locator('#chileCameraSources a[href*="lineup.surf"][href*="camera1"]').count(),
    'Direct link to La Boca free-account camera must exist');
   assert.match(await page.locator('#chileCameraSources').textContent(),/Gratis|cuenta/i);
   assert.match(await page.locator('#chileCameraSources').textContent(),/Premium/i);
   assert.equal(await page.locator('#chileCameraSources iframe, #chileCameraSources video').count(),0,
    'No embedded or scraped third-party video without licence');
   const disclaimer=page.locator('.chile-method-disclaimer');
   assert.equal(await disclaimer.count(),1);
   assert.ok(await disclaimer.evaluate(el=>el.closest('#forecastPage')!==null),
    'Uncertainty belongs at the end of forecast instead of a loud top banner');
   assert.equal(await page.locator('.chile-model-provenance').count(),0);
   assert.equal(await page.locator('#faroSafetyCenter').isVisible(),false,
    'No model danger/caution: avoid showing an empty hazard alert as a banner');
   assert.equal(await page.locator('#chileOfficialSources').count(),1,
    'Official sources must remain accessible without modelled risk');
   await page.locator('#chileOfficialSources summary').click();
   assert.ok(await page.locator('#chileOfficialSources a[href="https://meteoarmada.directemar.cl/"]').isVisible(),
    'The Armada source should remain discoverable in Before You Go');
   const chipText=await page.locator('#dayStripItems .day-chip').first().innerText();
   assert.ok(!chipText.includes('β')&&!chipText.includes('Promising'),
    'Model caveats belong in provenance, not duplicated after every score');
   await page.locator('#chileOfficialSources summary').click();
   const firstRead=await page.locator('#chileVibeRead').textContent();
   const bocaAction=await page.locator('#chileVibeAction').textContent();
   assert.match(bocaAction,/La Boca|Aconcagua/i,'La Boca must have a concrete location-specific action');
   assert.ok(await page.locator('#chileDecisionHeadline').isVisible(),
    'Decision must be visible without expanding technical notes');
   assert.ok((await page.locator('#chileDecisionDriver').textContent()).length>20,
    'Decision must state the dominant reason');
   assert.match(firstRead,/swell.*m.*s.*viento|swell.*m.*s.*wind/i,
    'FARO READ must explain the forecast measurements, not generic bank caveats');
   const explained=await page.locator('#chileVibeExplained').textContent();
   assert.match(explained,/SWELL|Swell/i);
   assert.match(explained,/Viento|Wind/i);
   assert.match(explained,/Factor decisivo|Decisive factor/i);
   const hints=await page.locator('#chileVibeEvidence').textContent();
   assert.match(hints,/guías divididas|guides disagree/i,'Conflicting La Boca guide evidence remains accessible');
   await page.locator('#chileSpotSelect').selectOption('CL-VS:renaca');
   await page.waitForFunction(()=>document.getElementById('chileCameraSources')?.textContent?.includes('Marejadas UV'),{timeout:12000});
   assert.ok(await page.locator('#chileCameraSources a[href*="youtube.com/watch?v=NomqMgWrVlY"]').count(),
    'Reñaca must link to independent free Marejadas UV webcam');
   assert.match(await page.locator('#chileCameraSources').textContent(),/YouTube público|Public YouTube/i);
   await page.waitForFunction(()=>document.getElementById('chileCameraSources')?.textContent?.includes('Windmaster · Reñaca'),{timeout:12000});
   assert.match(await page.locator('#chileCameraSources').textContent(),/offline|OFFLINE|Señal no confirmada/);
   await page.waitForFunction(()=>document.getElementById('chileVibeAction')?.textContent?.includes('Reñaca Norte'),{timeout:12000});
   const renacaAction=await page.locator('#chileVibeAction').textContent();
   assert.match(renacaAction,/Reñaca Norte/i);
   assert.notEqual(renacaAction,bocaAction);
   await page.locator('#chileSpotSelect').selectOption('CL-VS:ritoque');
   await page.waitForFunction(()=>document.getElementById('chileVibeAction')?.textContent?.includes('Ritoque Norte'),{timeout:12000});
   const ritoqueAction=await page.locator('#chileVibeAction').textContent();
   assert.match(ritoqueAction,/Ritoque Norte/);
   assert.notEqual(ritoqueAction,renacaAction);
   await page.locator('#fieldNotesExpand').evaluate(el=>el.open=true);
   assert.equal(await page.locator('#faroObsVideo').count(),1,'Local-only camera/clip player is available');
   await page.locator('#faroObsSource').selectOption('manual_visual');
   assert.equal(await page.locator('#faroObsCamera').locator('option').count(),1,
    'Ritoque has no verified camera source; do not invent one');
   assert.equal(await page.locator('#faroObsVideo').isVisible(),false,
    'External third-party camera mode never plays or copies the remote stream');
   const localDay=clock(marine.hourly.time[0]).slice(0,10),localClock=localDay+'T12:00';
   await page.locator('#faroObsDate').fill(localClock);
   const validAt=new Date(fromLocal(localDay,12)*1000).toISOString();
   const before=new Date(Date.parse(validAt)-7200000).toISOString();
   const archive={schemaVersion:'1.0.0',region:'CL-VS',provider:'Open-Meteo',
    fetchedAtUtc:before,spots:[{spotId:'CL-VS:ritoque',records:[{
     forecastId:'mock-archived-prior',spotId:'CL-VS:ritoque',source:'Open-Meteo',
     ingestedAtUtc:before,issuedAtUtc:null,validAtUtc:validAt,
     features:{swellHeightM:1.1,swellPeriodS:11,swellFromDeg:240,windKmh:10,windFromDeg:95}
    }]}]};
   await page.locator('#faroObsArchive').setInputFiles({
    name:'snapshot.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))
   });
   await page.waitForFunction(()=>document.getElementById('faroObsComparison')?.textContent?.includes('mock')||
    document.getElementById('faroObsComparison')?.textContent?.includes('Pronóstico guardado'),{timeout:6000});
   await page.locator('#faroVideoLab button[data-type="wall"]').click();
   await page.locator('#faroVideoLab button[data-type="closeout"]').click();
   await page.locator('#faroObsPermission').check();
   await page.locator('#faroObsSave').click();
   const record=await page.evaluate(()=>{
    const rows=JSON.parse(localStorage.getItem('faro-chile-visual-observations-v1')||'[]');return rows.at(-1)||null
   });
   assert.equal(record.spotId,'CL-VS:ritoque');
   assert.equal(record.forecast.forecastId,'mock-archived-prior');
   assert.equal(record.forecast.spotId,'CL-VS:ritoque',
    'Human labels carry strict geographic identity for future training audit');
   assert.equal(record.trainingEligible,false,'Human annotation is not an automatically permitted AI training sample');
   assert.equal(record.labels.waveCount,2);
   assert.equal(record.labels.closeoutFraction,.5);
   assert.equal(record.observationWindowSeconds,600);
   assert.equal(record.waveCountPer10Min,2);
   assert.equal(record.captureAssetId,null,'No remote video or screenshot storage');
   await page.locator('#spotInsightExpand').evaluate(el=>el.open=true);
   assert.match(await page.locator('#spotinsight').textContent(),/Guías difieren|GUIDES|guías/i);
   assert.match(await page.locator('#spotinsight').textContent(),/surfnerd-ritoque|Surfnerd/i);
   await page.locator('#chileSpotSelect').selectOption('CL-VS:la-boca-concon');
   await page.waitForFunction(()=>document.getElementById('chileVibeAction')?.textContent?.includes('La Boca'),{timeout:12000});
   assert.ok(await page.locator('#faroObsCamera option[value="lineup-la-boca-1"]').count(),
    'La Boca camera should be a named manual observation source');
   assert.ok(await page.locator('#faroObsCamera option[value="lineup-la-boca-2"]').count(),
    'Premium source available only as manual attribution; no extraction or streaming');
   for(const nav of ['#navForecast','#navBest','#navBoard']){
    await page.locator(nav).click();
    const sizes=await page.evaluate(()=>({client:document.documentElement.clientWidth,
     scroll:document.documentElement.scrollWidth}));
    assert.ok(sizes.scroll<=sizes.client+3,
     'Horizontal document overflow '+JSON.stringify({width,nav,...sizes}));
   }
   await page.locator('#navForecast').click();
   await page.locator('#languageToggle').click();
   assert.equal(await page.locator('html').getAttribute('lang'),'en');
   assert.equal(await page.locator('#rise').count(),1,'Translation must preserve sunrise value element');
   assert.equal(await page.locator('#set').count(),1,'Translation must preserve sunset value element');
   assert.equal(await page.locator('#cutoff').count(),1,'Translation must preserve daylight cut-off element');
   await page.locator('#themeToggle').click();
   assert.equal(scriptErrors.length,0,'No runtime errors during locale/theme/tab changes');
   if(width===390||width===1180){
    await page.locator('#navBest').click();
    await page.waitForFunction(()=>document.querySelectorAll('#highlights .chile-ranking').length>0,{timeout:15000});
    const count=await page.locator('#highlights .chile-ranking').count();
    assert.ok(count>=1&&count<=3,'Best of week presents at most three immediate choices');
    assert.ok(await page.locator('#rankingContext').textContent(),
     'Provisional cap must be explained once above cards');
    assert.equal(await page.locator('#highlights .faro-score-cap-note').count(),0,
     'Do not repeat the same score-cap caveat on every pick');
    const scoreLayout=await page.locator('#highlights .chile-ranking').first().evaluate(card=>{
     const number=card.querySelector('.chile-rank-score');
     const area=card.querySelector('.chile-rank-rating');
     return {whiteSpace:getComputedStyle(number).whiteSpace,
      scoreWidth:number.getBoundingClientRect().width,
      areaWidth:area.getBoundingClientRect().width,
      scoreText:number.textContent};
    });
    assert.equal(scoreLayout.whiteSpace,'nowrap',
     'The 7.9 score must never wrap onto two lines');
    assert.ok(scoreLayout.scoreWidth<=scoreLayout.areaWidth+1,
     'The score needs a width-protected column: '+JSON.stringify(scoreLayout));
    assert.match(scoreLayout.scoreText,/^\d+(?:\.\d+)?$/,
     'Each ranking score is one continuous number');
    await page.locator('#navForecast').click();
   }
   // Simulate an actual model threshold crossing to confirm hazards remain prominent.
   const severe=JSON.parse(JSON.stringify(weather));
   severe.hourly.wind_gusts_10m=severe.hourly.wind_gusts_10m.map(()=>80);
   await page.route('**/api.open-meteo.com/**',route=>route.fulfill({json:severe}));
   await page.locator('#refreshForecast').click();
   await page.locator('#faroSafetyCenter').waitFor({state:'visible',timeout:12000});
   assert.match(await page.locator('#chileRiskGrade').innerText(),
    /RIESGO MODELO|MODEL RISK/,'Detected model risk must still display a meaningful warning');
   assert.equal(await page.locator('#chileOfficialSources').count(),1,
    'Warnings may not erase access to real official bulletins');
   await context.close();
  }
  console.log('PASS FARO Chile responsive QA: forecast, UTC, optional swell, sources, translation and mobile overflow.');
 }finally{if(browser)await browser.close();server.kill('SIGTERM')}
})().catch(e=>{console.error(e);process.exitCode=1});