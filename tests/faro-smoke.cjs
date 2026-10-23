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
const scripts=Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi),m=>m[1]);
assert.ok(scripts.length>=2,'HTML includes application and translation scripts');
scripts.forEach((s,i)=>assert.doesNotThrow(()=>new vm.Script(s), 'Script '+i+' syntax'));
assert.doesNotThrow(()=>new vm.Script(engine),'Shared surf engine syntax');
assert.doesNotThrow(()=>new vm.Script(dnaSource),'Spot DNA module syntax');
const ids=Array.from(html.matchAll(/\bid=["']([^"']+)["']/g),m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'No duplicate static DOM identifiers');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS braces balanced');
assert.ok(css.includes('html[data-theme="light"]'),'Light theme present');
assert.ok(css.includes('html:not([data-theme="light"])'),'Dark theme present');
assert.ok(html.includes('faro-ui.css?v=13'),'Current CSS cache key');
assert.match(css,/#bestPage \.hero-footer \.wizard-pick\s*\{[^}]*border:1px solid/s,'Best character retains badge');
assert.ok(html.includes('id="legacyBoard"'),'Original board wizard kept under details');
assert.ok(html.includes('id="dayPrev"')&&html.includes('id="dayNext"'),'Forecast rail exposes accessible navigation');
assert.ok(html.includes('function scrollForecastDays(')&&html.includes('function updateDayStripControls('),'Forecast rail remains keyboard/button reachable');
assert.ok(html.includes('el.scrollLeft=previousScroll;'),'Forecast selection preserves manual horizontal position');
assert.ok(css.includes('overscroll-behavior-x:contain'),'Horizontal strip keeps its overscroll local');
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
dna.save({spotId:first,observationType:'water',quality:3,surface:'mixed',notes:'Variable walls',
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
try{dna.save({spotId:first,observationType:'water',quality:10,surface:'mixed'},store)}catch(e){invalidFailed=true}
assert.ok(invalidFailed,'Subjective observation cannot accidentally use 0–10 forecast score');
assert.equal(dna.read(store).length,1,'Invalid entries do not overwrite prior observations');
dna.clear(store);
assert.equal(dna.read(store).length,0,'User can delete notes');

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

console.log('FARO smoke checks passed: JavaScript, markup, themes, timing, translations, the mobile rail and Spot DNA.');
