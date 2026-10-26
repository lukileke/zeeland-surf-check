/* FARO Chile isolated browser QA. Mock provider output, never live alerts. */
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
   try{await page.waitForSelector('#dayStripItems .day-chip',{timeout:16000})}
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
   assert.equal(scriptErrors.length,0,'Chile JS should boot cleanly: '+JSON.stringify(scriptErrors));
   assert.equal(await page.locator('#dayStripItems .day-chip').count(),7);
   // One FARO design system, rather than contradictory inherited layout
   // overrides. Mobile has no giant blank vertical bands; desktop does
   // not force the daily card to stretch to the height of hourly content.
   const visual=await page.evaluate(()=>{
    const $=s=>document.querySelector(s),style=s=>getComputedStyle($(s));
    const selectors=['.day-editorial-overline','.day-overview-row','#dayUVBadge',
      '#daySignalMetrics','#chileDecisionBrief','.chile-vibe','#openSpotDNA'];
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
   assert.equal(visual.oceanColumns,2,'Wave height full row + two equal numeric context columns');
   assert.equal(visual.waveSpan,'1');
   assert.match(visual.dateFont,/Archivo/i,'Only editorial headings use Archivo');
   assert.match(visual.numericFont,/Manrope/i,'Numeric wave data uses readable Manrope');
   assert.match(visual.scoreFont,/Manrope/i,'Score numerals match other numeric metrics');
   assert.notEqual(visual.waveColor,visual.scoreColor,
    'Blue/teal ocean measurements and quality-score semantic palette must stay distinct');
   for(const {from,to,gap} of visual.gaps){
    assert.ok(gap>=-4&&gap<=40,
     'Excessive white space or overlap in daily hero: '+JSON.stringify({width,from,to,gap,visual}));
   }
   if(width<=430)assert.ok(visual.heroHeight<770,
    'Mobile daily hero has excessive forced height: '+JSON.stringify(visual));
   assert.ok(visual.scrollWidth<=visual.clientWidth+3,
    'Daily hero overflows viewport: '+JSON.stringify(visual));

   assert.equal(await page.locator('#dayWaveMeter .chile-wave-bars span').count(),8,
    'Zeeland-style wave-height scale must show all eight bars');
   assert.match(await page.locator('#dayWave').textContent(),/m/,'Daily hero must feature modelled wave height');
   assert.equal(await page.locator('#chileWaveExplain').count(),1);
   await page.locator('#chileWaveExplain').evaluate(el=>el.open=true);
   assert.match(await page.locator('#chileWaveHow').textContent(),/SWELL PRINCIPAL|PRIMARY SWELL/);
   assert.match(await page.locator('#chileWaveHow').textContent(),/VIENTO Y RACHAS|WIND & GUSTS/);
   assert.equal(await page.locator('#chileSessionVibe').count(),0);
   assert.equal(await page.locator('#sessionAtGlance .chile-session-overline').count(),1);
   assert.equal(await page.locator('#sessionAtGlance .chile-session-head>.chile-session-wave .chile-wave-bars span').count(),8);
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
     "brand-band-verylow":"rgb(240, 164, 109)",
     "brand-band-low":"rgb(240, 191, 105)",
     "brand-band-mid":"rgb(227, 212, 113)",
     "brand-band-regular":"rgb(176, 219, 117)",
     "brand-band-high":"rgb(150, 198, 122)"
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
      ["hourly","#slots button[class*='brand-band-']",".chile-slot-score"],
      ["session","#sessionAtGlance .chile-session-rating[class*='brand-band-']",".chile-session-score"]
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
   const hourlyScore=Number(await chosen.locator('.chile-slot-score').textContent());
   assert.equal(await chosen.locator('.chile-slot-quality').textContent(),qualityOf(hourlyScore),
    'Hourly score must show the same Zeeland quality caption');
   assert.equal(await page.locator('.chile-session-rating .chile-session-label').last().textContent(),qualityOf(hourlyScore),
    'Session score and hourly category must agree');
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
   // Desktop must show map directly. Mobile can expand it on demand.
   assert.equal(await page.locator('#coastMapExpand').evaluate(el=>el.open),width>=1120,
    'Map opens as a prominent element on desktop, not a buried dropdown');
   assert.equal(await page.locator('#coastMapExpand .leaflet-container').count(),0);
   await page.locator('#coastMapExpand').evaluate(el=>el.open=true);
   await page.waitForFunction(()=>document.querySelector('#chileCoastMap .faro-map-schematic g[data-spot="CL-VS:la-boca-concon"]'),{timeout:8000});
   assert.equal(await page.locator('#chileCoastMap .faro-map-schematic g[data-spot]').count(),3,
    'All 3 published coastal reference positions must render without external CDNs');
   const arrowCount=await page.locator('#chileCoastMap .faro-map-schematic line[stroke="#137d9f"], #chileCoastMap .faro-map-schematic line[stroke="#ba7628"]').count();
   assert.equal(arrowCount,2,'Model swell and wind travel vectors must be visible');
   if(width>=1120){
    const sessionBounds=await page.locator('#dayview > .session-section').boundingBox();
    const mapBounds=await page.locator('#coastMapExpand').boundingBox();
    assert.ok(sessionBounds&&mapBounds,'Session and map must both occupy desktop grid');
    assert.ok(Math.abs(sessionBounds.y-mapBounds.y)<25,'Map must be beside session, not auto-placed below');
    assert.ok(mapBounds.x>sessionBounds.x+sessionBounds.width-20,'Map must occupy right desktop column');
    const font=await page.locator('#dayWave').evaluate(el=>getComputedStyle(el).fontFamily);
    assert.match(font,/Manrope|faro-text|system-ui/i,'Model wave size must use Zeeland number font, not Archivo Black');
   }
   assert.equal(await page.locator('#coastMapExpand .faro-lens-compass-svg').count(),1,
    'Compass must display actual bearing rose for swell and wind');
   assert.equal(await page.locator('#coastMapExpand .faro-lens-compass-svg circle').count()>=3,true,
    'Compass must show actual direction rings, not a decorative emoji');
   assert.match(await page.locator('#coastMapExpand .faro-lens-module').textContent(),/SWELL COMPASS/);
   assert.match(await page.locator('#faroHourlyPreview').textContent(),/COASTAL READ/);
   await page.locator('#faroHourlyGoLens').click();
   assert.equal(await page.locator('#coastMapExpand').evaluate(el=>el.open),true);
   const mapText=await page.locator('#chileCoastMap').textContent();
   assert.match(mapText,/La Boca/);
   assert.match(mapText,/SWELL/);
   assert.match(mapText,/VIENTO|WIND/);
   assert.match(mapText,/OpenStreetMap/,'Map must show attribution and limits');
   assert.ok(await page.locator('#chileCoastMap a[href*="lineup.surf"][href*="camera1"]').count(),
    'Map makes the original free-account La Boca surf camera discoverable');
   await page.locator('#chileCoastMap button.faro-map-shortcut').click();
   assert.equal(await page.locator('#fieldNotesExpand').evaluate(el=>el.open),true,
    'One-click coast-map action should reveal the private observation journal');
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