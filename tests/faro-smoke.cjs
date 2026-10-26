'use strict';
/* FARO: dependency-free regression smoke checks.
 * Run: node tests/faro-smoke.cjs
 * These are code/logic checks, not browser or visual Safari tests.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'faro-ui.css'),'utf8');
const engine=fs.readFileSync(path.join(root,'surf-engine.js'),'utf8');
const dnaSource=fs.readFileSync(path.join(root,'faro-spot-dna.js'),'utf8');
const evidenceSource=fs.readFileSync(path.join(root,'faro-spot-evidence.js'),'utf8');
const dnaLabSource=fs.readFileSync(path.join(root,'faro-dna-validation.js'),'utf8');
const safetySource=fs.readFileSync(path.join(root,'faro-safety.js'),'utf8');
const scripts=Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),m=>m[1]);
const brand=fs.readFileSync(path.join(root,'faro-brand.css'),'utf8');
const logo=fs.readFileSync(path.join(root,'assets/faro-logo.svg'),'utf8');
const darkLogo=fs.readFileSync(path.join(root,'assets/faro-logo-dark.svg'),'utf8');
const salva=fs.readFileSync(path.join(root,'assets/faro-salva-red.svg'),'utf8');
assert.ok(html.includes('src="assets/faro-logo.svg"'),'Official vector logo is used in light theme');
assert.ok(html.includes('src="assets/faro-logo-dark.svg"'),'Dark theme loads white-ink wordmark');
assert.ok(darkLogo.includes('fill="#ffffff"')&&darkLogo.includes('fill="#ffda71"'),
 'Dark FARO wordmark has white text and the exact original yellow symbol');
assert.equal(darkLogo.replace('fill="#ffffff"','fill="#1f3b3d"').replace('aria-label="FARO, versión para fondo oscuro"','aria-label="FARO"'),logo,
 'Dark variant changes only ink fill and accessible label; geometry is unmodified');
assert.ok(!brand.includes('background:#eef5f1;border-radius:8px;padding:4px'),
 'Dark FARO logo never uses a paper-coloured badge');
assert.ok(html.includes('href="faro-brand.css?v='),'Official brand layer remains versioned');
assert.ok(brand.includes('Selected = paper. Alternatives = open canvas.'),'FARO distinguishes chosen day from unselected options');
assert.ok(brand.includes('background:transparent!important'),'Unselected surfaces stay transparent');
assert.ok(brand.includes('--faro-choice-selected-stroke:#526a74;'),'Selected light-theme day uses official slate grey');
assert.ok(brand.includes('--faro-choice-stroke:#c9d8da;'),'Unselected light-theme day uses pale official mist grey');
assert.ok(brand.includes('border-color:var(--faro-choice-selected-stroke)!important'),'Active day stroke is grey, not blue');
assert.ok(logo.includes('viewBox="0 0 128.81 43.63"')&&logo.includes('#ffda71')&&logo.includes('#1f3b3d'),'Brand SVG retains original vector proportions and colours');
assert.ok(salva.includes('viewBox="0 0 126.82 126.5"')&&salva.includes('opacity=".13"'),'Salva rojo is an unobtrusive supplied danger watermark');
for(const hex of ['#ce762e','#efbc62','#6b9347','#a4d156','#e55845','#f47b67','#526a74','#c9d8da','#355baf','#5878e0','#1f3b3d','#ffda71'])
 assert.ok(brand.toLowerCase().includes(hex),'Official PDF colour '+hex+' preserved');
assert.ok(brand.includes('assets/faro-salva-red.svg'),'Danger banner actually loads the user-supplied watermark');
assert.ok(html.includes("v>=8?'brand-band-high':v>=6?'brand-band-regular':v>=4?'brand-band-mid':v>=2?'brand-band-low':'brand-band-verylow'"),
 'Visual score bands match the current five-tone FARO UI without altering model or categorical quality thresholds');
assert.ok(scripts.length>=2,'HTML includes application and translation scripts');
scripts.forEach((s,i)=>assert.doesNotThrow(()=>new vm.Script(s), 'Script '+i+' syntax'));
assert.doesNotThrow(()=>new vm.Script(engine),'Shared surf engine syntax');
const faroRuntime={globalThis:{}};
new vm.Script(engine).runInNewContext(faroRuntime);
const sharedEngine=faroRuntime.globalThis.ZeelandEngine;
assert.equal(typeof sharedEngine.quickRead,'function','FARO READ uses the shared forecasting engine');
const mellowRead=sharedEngine.quickRead({h:1.1,period:6.2,wind:12,gust:20,code:0},'en');
assert.equal(mellowRead.headline,'Mellow, flowing potential','Calm conditions receive a cautious FARO interpretation');
assert.equal(sharedEngine.quickRead({h:1.1,period:6.2,wind:12,gust:20,code:0},'es').headline,'Potencial para surf fluido','Shared interpretation supports natural Spanish');
assert.equal(sharedEngine.quickRead({h:1,period:7,wind:19,gust:86,code:0},'en').key,'windRisk','Dangerous gusts override a positive wave description');
assert.equal(sharedEngine.quickRead({h:1,period:7,wind:19,gust:20,code:95},'en').key,'storm','Thunderstorms override positive surf descriptions');
assert.ok(html.includes('id="faroReadTitle"')&&html.includes('id="faroRead"'),'FARO READ is a first-class forecast section');
assert.ok(html.includes('function openFaroMatch(){')&&html.includes("faroStep=1;faroRenderStep();"),'Matching CTA carries current selection into guided flow');
assert.ok(html.includes('>FARO Match</button>'),'Match is a branded primary tab');
assert.doesNotThrow(()=>new vm.Script(dnaSource),'Spot DNA module syntax');
assert.doesNotThrow(()=>new vm.Script(evidenceSource),'Spot evidence module syntax');
assert.doesNotThrow(()=>new vm.Script(dnaLabSource),'Spot validation syntax');
assert.doesNotThrow(()=>new vm.Script(safetySource),'Independent safety module syntax');
const ids=Array.from(html.matchAll(/\bid=["']([^"']+)["']/g),m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'No duplicate static DOM identifiers');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS braces balanced');
assert.ok(css.includes('html[data-theme="light"]'),'Light theme present');
assert.ok(css.includes('html:not([data-theme="light"])'),'Dark theme present');
// A changing asset version must not itself fail a source test.
const cssAsset=html.match(/<link\s+rel="stylesheet"\s+href="faro-ui\.css\?v=(\d+)"\s*\/?\s*>/);
assert.ok(cssAsset&&Number(cssAsset[1])>0,'Local stylesheet has a versioned cache key');
assert.match(css,/#bestPage \.hero-footer \.wizard-pick\s*\{[^}]*border:1px solid/s,'Best character retains badge');
assert.ok(html.includes("['Soft-top','Soft']"),'Spanish Board Wizard calls soft boards Soft');
assert.ok(!html.includes('Tabla blanda'),'Avoid literal non-surf Spanish for soft boards');
assert.ok(!html.includes('<span class="glance-title">YOUR SESSION</span>'), 'Forecast must not imply the reader already booked or chose a surf session');
assert.ok(html.includes("forecastWindowChosenByUser?'SELECTED WINDOW':'SUGGESTED WINDOW'"),'Forecast headline explains user choice versus auto-suggested time');
assert.ok(html.includes("['SUGGESTED WINDOW','HORARIO RECOMENDADO']"),'Automatic time is clearly labelled in Spanish');
assert.ok(html.includes("['SELECTED WINDOW','HORARIO SELECCIONADO']"),'Explicitly chosen time is clearly labelled in Spanish');
assert.ok(html.includes("forecastWindowChosenByUser=true;render()"),'Hour-window buttons explicitly set reader-choice state');
assert.ok(html.includes("forecastWindowChosenByUser=false;slotIndex=marine&&weather?recommendedSlotIndex(i):0"),'Choosing a new day returns the headline to automatic suggestion');
assert.ok(html.includes('id="legacyBoard"'),'Original board wizard kept under details');
assert.ok(html.includes('id="dayPrev"')&&html.includes('id="dayNext"'),'Forecast rail exposes accessible navigation');
assert.ok(html.includes('function scrollForecastDays(')&&html.includes('function updateDayStripControls('),'Forecast rail remains keyboard/button reachable');
assert.ok(html.includes('el.scrollLeft=previousScroll;'),'Forecast selection preserves manual horizontal position');
assert.ok(css.includes('overscroll-behavior-x:contain'),'Horizontal strip keeps its overscroll local');
assert.match(html,/<style>html\{width:100%;max-width:100%;overflow-x:hidden;background:#101517\}/,
 'Root canvas painted before asynchronous CSS loads');
assert.match(css,/html,body\{[^}]*overflow-x:hidden!important;[^}]*background:var\(--bg\)!important;/s,
 'Body and root canvas prohibit horizontal document overflow in Safari');
assert.match(css,/#forecastPage #dayStripItems\{[^}]*overflow-x:auto!important;[^}]*overflow-y:hidden!important;/s,
 'Seven-day strip independently retains horizontal scrolling');
assert.match(css,/@media\(min-width:900px\)\{\s*#forecastPage #dayStripItems\{[^}]*overflow-x:visible!important;/s,
 'Desktop seven-day layout does not acquire a horizontal scroll trap');
assert.ok(css.includes('max-width:100%!important;'),'Root viewport descendants remain constrained');

assert.ok(css.includes('html[data-theme="light"] .wave-size.size-large{--wave-color:#176f9b}'),'Wave height remains in marine-blue family');
assert.ok(css.includes('html:not([data-theme="light"]) .wave-size.size-xl{--wave-color:#9cbcf0}'),'Large waves remain blue in dark theme');
assert.ok(css.includes('--surf-fair:#e3bc56;'),'Fair accent uses brighter amber in light mode');
assert.ok(css.includes('--surf-fair:#ead17a;'),'Fair accent retains luminous contrast in dark mode');
assert.ok(css.includes('#forecastPage .day-chip.tone-fair strong'),'Light-mode Fair day score uses graphite');
assert.ok(css.includes('#dayview .session-glance .hero-score.tone-fair .hero-score-value'),'Main Fair session score uses graphite');
assert.ok(css.includes('#bestPage .hero-rank .hero-score.tone-fair .hero-score-value'),'Weekly Fair score follows the same visual treatment');
assert.ok(css.includes('--faro-selection:#176d78;'),'Selected light-theme day uses ocean-teal, not quality category');
assert.ok(css.includes('--faro-fair-fill:#f8eabc;'),'Fair word has a soft sunlit label');
assert.ok(html.includes('id="fieldNotesExpand"'),'Optional field-note disclosure exists');
assert.ok(html.includes('id="faroSafetyCenter"'),'Safety banner is visible in every tab');
assert.ok(html.includes('<details class="faro-safety-disclosure">'),'Initial warning works as a native disclosure');
assert.ok(css.includes('FARO v23 — Coastal Editorial safety rail'),'Compact safety styles present');
assert.ok(css.includes('.faro-safety-summary'),'Click/tap target styled');
assert.ok(css.includes('.faro-safety-expanded'),'Expanded explanation styled');

assert.ok(html.indexOf('id="faroSafetyCenter"')<html.indexOf('id="forecastPage"'),'Safety banner not trapped inside Forecast');
assert.ok(html.includes('src="faro-safety.js"'),'Dedicated safety module loads');
assert.ok(html.includes('gust:w')===false,'Gusts not accidentally fabricated as constants');
assert.ok(html.includes('gust:scores.reduce('),'Entire two-hour window uses worst gust');
assert.ok(css.includes('.faro-safety-center.danger'),'Severe alert is visible separately from score');
assert.ok(css.includes('#forecastPage #dayStrip{\n contain:layout paint!important'),'Seven-day rail parent isolates paint and layout');
assert.ok(css.includes('#forecastPage #dayStripItems{\n contain:layout paint!important'),'Rail cannot widen document layout');
assert.ok(css.includes('main{overflow-x:clip!important'),'App shell is horizontally clipped');
assert.ok(css.includes('#datehead{text-transform:capitalize'),'Localized weekday headings capitalized');
assert.ok(!html.includes('faro-safety-region-select'),'Zeeland UI never exposes a country selector');
assert.ok(!safetySource.includes('faro-alert-country'),'Legacy alert-country choice cannot affect Zeeland warnings');

assert.ok(html.includes('src="faro-spot-evidence.js"'),'Local beach-level evidence module loaded');
assert.ok(html.includes('marine.hourly.swell_wave_height'),'Shadow-only features read separate swell height');
assert.ok(html.includes('weather.hourly.wind_gusts_10m'),'Shadow-only features read wind gust ratio');
assert.ok(html.includes('<span class="quality-pill">'),'Forecast and ranking use consistent quality tags');
assert.ok(css.includes('FARO COASTAL / V15 semantic grade consistency'),'Single visual grammar covers all quality levels');
assert.ok(html.includes('FaroSpotDNA.save('),'Field-note form writes via the local-only API');
assert.ok(html.includes('FaroSpotDNA.exportData()'),'User can export field notes');
assert.ok(html.includes('FaroSpotDNA.clear()'),'User can delete field notes');
assert.ok(html.includes('aria-disabled="true"'),'Unavailable session controls disabled');

const tStart=html.indexOf('function nlNow('),tEnd=html.indexOf('function chooseForecastDay(',tStart);
assert.ok(tStart>0&&tEnd>tStart,'Time selection helpers found');
const fixedDates=['2026-10-23','2026-10-24'];
const slots=d=>[{valid:true,s:{v:d===0?4.1:6.0},to:1080},
                {valid:false,s:{v:9.0},to:1200}];
const {nlNow,pastWindow,enoughTimeRemaining,upcomingWindow}=new Function('dateTimes','blocks',html.slice(tStart,tEnd)+'; return {nlNow,pastWindow,enoughTimeRemaining,upcomingWindow};')(()=>fixedDates,slots);
assert.deepEqual(nlNow(new Date('2026-10-23T18:55:00Z')),{date:'2026-10-23',minutes:1255},'Netherlands summer clock');
assert.deepEqual(nlNow(new Date('2026-12-01T12:00:00Z')),{date:'2026-12-01',minutes:780},'Netherlands winter clock');
assert.equal(pastWindow('2026-10-23',1080,{date:'2026-10-23',minutes:1255}),true);
assert.equal(enoughTimeRemaining('2026-10-23',1080,{date:'2026-10-23',minutes:1041}),false,'39 min not useful');
assert.equal(enoughTimeRemaining('2026-10-23',1080,{date:'2026-10-23',minutes:1040}),true,'40 min still useful');
assert.equal(upcomingWindow(0,slots(0)[1],{date:'2026-10-23',minutes:900}),false,'Invalid daylight excluded');
assert.equal(upcomingWindow(1,slots(1)[0],{date:'2026-10-23',minutes:1255}),true,'Tomorrow remains selectable');

const translationStart=html.indexOf('/* Display-layer translation:');
const translationEnd=html.indexOf('let siteLanguage=',translationStart);
assert.ok(translationStart>=0&&translationEnd>translationStart,'Translation source found');
const translations=html.slice(translationStart,translationEnd);
const names=Array.from(translations.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=/g),m=>m[1]);
const dict=new Function(translations+';return {'+names.join(',')+'};')();
const pairs=Object.values(dict).filter(Array.isArray).flat().filter(x=>Array.isArray(x)&&typeof x[0]==='string').sort((a,b)=>b[0].length-a[0].length);
function es(s){for(const [en,translated] of pairs)s=s.split(en).join(translated);return s;}
assert.equal(es('Best of the Week'),'Lo mejor de la semana');
assert.equal(es('Best of Week'),'Lo mejor','Condensed mobile navigation');
assert.equal(es('BEACH'),'PLAYA');
assert.equal(es('SURF SPOT'),'SPOT DE SURF');
assert.equal(es('Where should I surf?'),'¿Dónde surfeo?');
assert.equal(es('Today'),'Hoy');
assert.equal(es('Find your next surf session'),'Encuentra tu próxima sesión de surf');
assert.equal(es('What would you like to find?'),'¿Qué quieres encontrar?');
assert.equal(es('Compare 2-hour windows'),'Comparar horarios de dos horas');
assert.equal(es('Refresh forecast'),'Actualizar pronóstico');
assert.ok(html.includes('function applyTranslatedAttributes()'),'Control labels translated in EN/ES');
assert.equal(es('Understand the wave'),'Entiende la ola');
assert.equal(es('Spot notes'),'Notas del spot');
assert.equal(es('Gear advice'),'Equipo recomendado');
assert.ok(html.includes('class="insight-eyebrow"'),'Wave explanation uses an editorial eyebrow');
assert.ok(css.includes('#dayview>details.forecast-expand>summary'),'Evidence accordions share a summary style');
assert.ok(es('Choppy & Messy')!=='Choppy & Messy');


/* FARO Spot DNA observations are deliberately local and do NOT alter quality. */
const memory=new Map();
const store={
 getItem:k=>memory.has(k)?memory.get(k):null,
 setItem:(k,v)=>memory.set(k,String(v)),
 removeItem:k=>memory.delete(k)
};
const dnaContext={localStorage:store};
new Function('globalThis',dnaSource)(dnaContext);
const dna=dnaContext.FaroSpotDNA;
assert.ok(dna,'Spot DNA namespace created');
assert.equal(dna.catalogue.length,12,'Every current surf spot is catalogued');
assert.equal(new Set(dna.catalogue.map(x=>x.id)).size,12,'Every spot key is unique');
assert.ok(dna.catalogue.every(x=>x.evidence==='unvalidated'&&x.tideWindow===null),'No invented tidal optimum or calibrated evidence');
assert.equal(dna.read(store).length,0,'New browser store starts empty');
const first=dna.catalogue[0].id;
dna.save({spotId:first,observationType:'water',quality:3,surface:'mixed',observedLocal:'2026-10-23T14:00',notes:'Variable walls',
 forecastSnapshot:{quality:6.2,height:1.1,period:5.7,wind:23,direction:315,
 fetchedAt:'2026-10-23T12:00:00Z',modelHour:'2026-10-23T14:00'}},
 store,new Date('2026-10-23T14:21:00Z'));
assert.equal(dna.summary(first,store).count,1,'Observation counted at the correct spot');
assert.equal(dna.summary(first,store).mean,3,'Subjective 1–5 observations not confused with 0–10 forecast');
assert.equal(dna.read(store)[0].forecastSnapshot.quality,6.2,'Model forecast preserved separately');
const json=JSON.parse(dna.exportData(store));
assert.equal(json.observations.length,1,'Field notes exportable');
assert.equal(json.observations[0].notes,'Variable walls','Observation notes roundtrip');
let invalidFailed=false;
try{dna.save({spotId:first,observationType:'water',observedLocal:'2026-10-23T14:00',quality:10,surface:'mixed'},store)}catch(e){invalidFailed=true}
assert.ok(invalidFailed,'Subjective observation cannot accidentally use 0–10 forecast score');
assert.equal(dna.read(store).length,1,'Invalid entries do not overwrite prior observations');
dna.clear(store);
assert.equal(dna.read(store).length,0,'User can delete notes');


/* Evidence features are not the production Surf Quality scale. */
const evidContext={};
new Function('globalThis',evidenceSource)(evidContext);
const evid=evidContext.FaroSpotEvidence;
assert.equal(Object.keys(evid.beaches).length,5,'Five beach guide research profiles');
for(const id of dna.catalogue.map(x=>x.id)){
 const info=evid.locate(id);
 assert.ok(info&&info.sources.length>=2,'Each of 12 spots inherits at least two beach-level sources');
 assert.ok(info.spotEvidence.includes('not verified'),'Subspot conditions not presented as calibrated');
}
const sourceSignals=evid.signal({
 orientation:325,windDirection:145,windSpeed:12,windGust:18,
 waveDirection:310,swellDirection:310,swellHeight:1,windWaveHeight:1
},'Domburg::Noordduine');
assert.equal(sourceSignals.windRole,'offshore-influenced','Southeast wind inferred offshore on Domburg');
assert.equal(sourceSignals.reportedIncidentDirection,true,'NW swell in broad Domburg guide window');
assert.equal(sourceSignals.swellEnergyProxyShare,0.5,'Height² mix is a proxy rather than measured energy');
assert.equal(sourceSignals.windGustRatio,1.5,'Gust ratio derived only from available modelled values');
assert.equal(sourceSignals.status,'shadow-evidence-only','Not a score');
assert.equal(evid.signal({},'Domburg::Noordduine').swellEnergyProxyShare,null,'Missing swell height not fabricated');
assert.ok(!Object.prototype.hasOwnProperty.call(sourceSignals,'score'),'Shadow feature has no surf score');



/* FARO weather screening: alerts must not depend on Surf Quality. */
const safetyContext={};
new Function('globalThis',safetySource)(safetyContext);
const safety=safetyContext.FaroSafety;
assert.ok(safety,'Independent safety model loads');
assert.equal(safety.SOURCES.CL.links.length,3,'Chile uses several distinct official sources');
assert.equal(safety.SOURCES.NL.links[0].url,safety.KNMI_URL,'Zeeland uses KNMI');
assert.ok(!Object.hasOwn(safety,'setAlertCountry'),'Country routing is not exposed until local Chile support launches');
assert.equal(safety.translatedReason('Modelled gusts up to 87 km/h',true),
 'Rachas modeladas de hasta 87 km/h','Danger reason has direct Spanish translation');

assert.equal(safety.risk({wind:15,gust:83,code:0},true).level,'danger',
 'Severe gust warns even if average wind is modest');
assert.equal(safety.risk({wind:15,gust:60,code:0},true).level,'caution',
 'Elevated modelled gust is not silently discarded');
assert.equal(safety.risk({wind:10,gust:12,code:95},true).level,'danger',
 'Lightning always outranks a high surf score');
assert.equal(safety.risk({wind:15,code:0},true).level,'low',
 'Gust data absence does not invent dangerous gust');
assert.equal(safety.risk(null,true).level,'unknown',
 'No forecast is not reported as safety clearance');
assert.ok(safety.datedBulletin(new Date('2026-10-24T07:00:00Z')),
 'Dated KNMI notice visible from publication onward');
assert.equal(safety.datedBulletin(new Date('2026-10-26T00:00:00Z')),null,
 'Dated bulletin expires automatically, avoiding permanent false warnings');
const hours=Array.from({length:72},(_,h)=>'2026-10-'+String(24+Math.floor(h/24)).padStart(2,'0')+'T'+String(h%24).padStart(2,'0')+':00');
const example={hourly:{time:hours,wind_speed_10m:hours.map(()=>18),
 wind_gusts_10m:hours.map((_,i)=>i===15?84:25),
 weather_code:hours.map(()=>0)}};
const screening=safety.scan48h(example,new Date('2026-10-24T08:00:00+02:00'));
assert.equal(screening.level,'danger','Storm gust later today remains visible regardless of selected daytime slot');
assert.equal(screening.peakGust,84);
assert.equal(safety.scan48h(null).level,'unknown');
/* The banner itself must remain available in all modes, including failed API
 * reads. A mocked DOM verifies content/link/priority, not Safari layout. */
function fakeNode(tag){
 return {tagName:tag,children:[],attrs:{},className:'',textContent:'',
   append(...children){this.children.push(...children)},
   replaceChildren(...children){this.children=children},
   setAttribute(name,value){this.attrs[name]=value}
 };
}
const fakeDocument={createElement:fakeNode},viewContext={};
new Function('globalThis','document',safetySource)(viewContext,fakeDocument);
const warningBanner=fakeNode('section');
viewContext.FaroSafety.render(warningBanner,example,'Domburg',new Date('2026-10-24T08:00:00+02:00'));
assert.ok(warningBanner.className.includes('danger'),'Danger remains visible independent of Surf Quality');
assert.equal(warningBanner.attrs.role,'alert','Danger is announced accessibly');
assert.equal(warningBanner.children.length,1,'Warning is a single native disclosure');
const details=warningBanner.children[0];
assert.equal(details.tagName,'details','Uses accessible native details');
assert.equal(details.open,false,'Danger details start closed, with essentials remaining visible');
const summary=details.children[0],expanded=details.children[1];
assert.equal(summary.tagName,'summary','Entire compact summary is operable');
assert.ok(summary.children[0].children[0].textContent.includes('MODEL HAZARD'),'Hazard severity heading is visible');
assert.ok(summary.children[1].textContent.includes('84 km/h'),'Critical gust is visible while collapsed');
assert.ok(summary.children[2].textContent.includes('not official alert'),'No misleading official alert status');
assert.ok(expanded.children.some(x=>x.tagName==='ul'),'Reasons are available on expansion');
assert.ok(expanded.children.some(x=>x.textContent.includes('Not updated live')),
 'Dated bulletin is explicitly not a live feed');
assert.equal(expanded.children.at(-1).href,safety.KNMI_URL,'Official KNMI link in expanded panel');

// A legacy country value may be present in localStorage but must not alter NL warnings.
const legacyStore=new Map([['faro-alert-country','CL'],['zeeland-language','es']]);
const legacyContext={localStorage:{getItem:key=>legacyStore.get(key)||null}};
new Function('globalThis','document',safetySource)(legacyContext,fakeDocument);
const legacyBanner=fakeNode('section');
legacyContext.FaroSafety.render(legacyBanner,example,'Domburg',new Date('2026-10-24T08:00:00+02:00'));
const legacyDetails=legacyBanner.children[0];
assert.ok(legacyDetails.children[0].children[0].children[0].textContent.includes('RIESGO SEGÚN EL MODELO'),
 'Spanish danger heading is visible');
assert.ok(legacyDetails.children[0].children[1].textContent.includes('Rachas hasta'),
 'Spanish summary communicates numeric gust');
assert.ok(legacyDetails.children[0].children[2].textContent.includes('no aviso oficial'),
 'Spanish source warning is visible even while collapsed');
assert.equal(legacyDetails.children[1].children.at(-1).href,safety.KNMI_URL,
 'Stale Chile selection must never override Zeeland KNMI');

const fallbackBanner=fakeNode('section');
viewContext.FaroSafety.render(fallbackBanner,null,'Domburg',new Date('2026-10-26T12:00:00+01:00'));
assert.ok(fallbackBanner.className.includes('advisory'),'Missing model is not called safe');
assert.equal(fallbackBanner.children[0].children[1].children.at(-1).href,safety.KNMI_URL,
 'Official link survives unavailable model and expired dated bulletin');
assert.equal(fallbackBanner.attrs.role,'region','Routine notices are not emergency alerts');
assert.ok(fallbackBanner.children[0].children[0].children[1].textContent.includes('Check official warnings'),
 'When status is unknown, users are urged to consult official warnings');

/* Time-separated observations versus pre-observation model snapshots. */
const labContext={};
new Function('globalThis',dnaLabSource)(labContext);
const lab=labContext.FaroDNAValidation;
assert.equal(lab.localTime('2026-10-12T10:00:00Z'),'2026-10-12T12:00','Netherlands CEST');
const sample=(date,value,rating)=>({
 id:'f'+date,spotId:'Domburg::Noordduine',
 observedLocal:'2026-10-'+date+'T12:30',quality:rating,
 forecastSnapshot:{fetchedAt:'2026-10-'+date+'T10:00:00Z',
 modelHour:'2026-10-'+date+'T12:00',quality:value}
});
assert.ok(lab.pair(sample('10',3,1)),'Pre-session model snapshot is acceptable');
const afterSample={...sample('10',3,1),
 forecastSnapshot:{fetchedAt:'2026-10-10T11:00:00Z',
 modelHour:'2026-10-10T12:00',quality:3}};
assert.equal(lab.pair(afterSample),null,'Forecast issued after observation is excluded');
assert.equal(lab.pair({
 observedLocal:'2026-10-25T02:30',quality:3,
 forecastSnapshot:{fetchedAt:'2026-10-24T23:00:00Z',
 modelHour:'2026-10-25T02:00',quality:5}
}),null,'Ambiguous October clock-change hour excluded');
const labRecords=['10','11','12','13','14','15'].map((day,i)=>sample(day,2+i,Math.min(5,i+1)));
const diagnostic=lab.evaluate(labRecords,'Domburg::Noordduine');
assert.equal(diagnostic.paired,6);
assert.equal(diagnostic.independentDays,6);
assert.equal(diagnostic.directionalAgreement,1,'Synthetic concordant ranking');
assert.equal(lab.evaluate([]).directionalAgreement,null,'Insufficient data not rated');

/* Mock a 340 CSS-pixel mobile carousel. This exercises scroll preservation
 * without claiming a real Safari layout/gesture test. */
const railStart=html.indexOf('let lastDayStripSelection=-1;');
const railEnd=html.indexOf('function render(){',railStart);
assert.ok(railStart>=0&&railEnd>railStart,'Seven-day rail module found');
const ctx={
 day:0,marine:{},weather:{},
 window:{matchMedia:()=>({matches:true})},
 dateTimes:()=>['2026-10-23','2026-10-24','2026-10-25','2026-10-26','2026-10-27','2026-10-28','2026-10-29'],
 blocks:()=>[{valid:true,s:{v:6},h:14,to:960,from:840}],
 upcomingWindow:day=>day>0,
 nlNow:()=>({date:'2026-10-23'}),
 pastWindow:()=>true,daylight:()=>({end:960}),enoughTimeRemaining:()=>false,
 scoreTone:()=> 'tone-fair',surfScoreLabel:()=> 'Fair',
 pad:n=>String(n).padStart(2,'0'),requestAnimationFrame:fn=>fn()
};
const rail={
 scrollLeft:0,scrollWidth:840,clientWidth:340,offsetLeft:0,
 getBoundingClientRect(){return {left:0,right:340}},
 scrollBy({left}){this.scrollLeft=Math.min(500,Math.max(0,this.scrollLeft+left))}
};
let railChildren=[];
Object.defineProperty(rail,'innerHTML',{
 set(value){
  this.html=value;
  railChildren=Array.from({length:7},(_,i)=>({
   offsetLeft:i*120,clientWidth:110,
   getBoundingClientRect(){
    const left=i*120-rail.scrollLeft;return {left,right:left+110};
   }
  }));
 },
 get(){return this.html}
});
rail.querySelectorAll=()=>railChildren;
rail.querySelector=()=>railChildren[ctx.day];
const railElements={
 dayStripItems:rail,dayPrev:{disabled:false},dayNext:{disabled:false},
 dayStripCount:{textContent:''},dayStripProgress:{style:{transform:''}}
};
ctx.$=id=>railElements[id];
const railFunctions=new Function('ctx','with(ctx){'+html.slice(railStart,railEnd)+'return {renderDayStrip,scrollForecastDays,updateDayStripControls};}')(ctx);
railFunctions.renderDayStrip();
assert.equal(railElements.dayStripCount.textContent,'1–3 / 7','First carousel page');
rail.scrollLeft=249;
railFunctions.renderDayStrip();
assert.equal(rail.scrollLeft,249,'Re-render must preserve the reader\'s horizontal position');
ctx.day=6;
railFunctions.renderDayStrip();
assert.equal(rail.scrollLeft,500,'Selecting the last day brings it into view');
assert.equal(railElements.dayNext.disabled,true,'Next arrow disabled at right edge');
railFunctions.scrollForecastDays(-1);
railFunctions.updateDayStripControls();
assert.ok(rail.scrollLeft<500,'Previous arrow moves the rail left');

console.log('FARO smoke checks passed: JavaScript, markup, themes, timing, translations, the mobile rail, Spot DNA and observational validation.');
