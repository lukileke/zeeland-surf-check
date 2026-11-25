/* One connected forecast: test structural and accessibility invariants.
   Browser/WebKit suites remain the authority for computed layout. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('chile/index.html');
const css=read('chile/faro-tide-read.css');
const js=read('chile/chile-forecast.js');

test('one seven-day / hero / hour hierarchy exists, with no duplicate IDs',()=>{
 const ids=['faroDayRail','faroQuickDays','faroForecastLead','faroQuickHourRail','faroQuickHours'];
 for(const id of ids)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 const positions=['id="faroDayRail"','id="faroForecastLead"','id="faroQuickHourRail"'].map(v=>html.indexOf(v));
 assert.ok(positions.every((v,i)=>v>=0&&(i===0||v>positions[i-1])));
 // Structural contract: the week is a sibling above the hero, but the
 // time slots are genuine DOM children of the hero, not a visually adjacent card.
 const leadStart=html.indexOf('<section id="faroForecastLead"');
 const hoursStart=html.indexOf('<section id="faroQuickHourRail"');
 const nextSection=html.indexOf('<details id="ventanasAccessNotice"',hoursStart);
 const leadEnd=html.lastIndexOf('\n  </section>',nextSection);
 assert.ok(positions[0]<leadStart&&leadStart<hoursStart&&hoursStart<leadEnd&&leadEnd<nextSection,
  'Week above hero; 2-hour instrument and analysis link inside hero itself');
 assert.match(css,/#forecastPage>\.faro-forecast-lead>#faroQuickHourRail/);
 assert.match(html,/<\/aside>\s*<section id="faroQuickHourRail"/,
  'The two-hour choices belong inside the hero, after its modelled reading');
 assert.match(html,/<\/section>\s*<\/section>\s*<!-- Zeeland FARO safety-centre/,
  'The embedded hourly section must close before the model hero closes');
 assert.match(css,/@media\(min-width:1120px\)\{[\s\S]*?#forecastPage:not\(\.hide\)>#faroDayRail/);
 assert.match(css,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
 assert.match(css,/grid-template-columns:repeat\(8,minmax\(0,1fr\)\)/);
});
test('window title is computed for the SELECTED day, not hard-coded to today',()=>{
 assert.match(html,/id="faroQuickHourHelp" aria-live="polite"/);
 assert.doesNotMatch(html,/TODAY'S WINDOWS/);
 assert.match(js,/txt\("faroQuickHourHelp",day\?dateLabel\(day.date\):"—"\)/);
 assert.match(js,/d.date===now\(\).date\?tr\("Hoy","Today"\)/);
});
test('controls share one state machine and horizontal keyboard navigation',()=>{
 assert.match(js,/button.dataset.jump==="slots"\?\(window.faroConsole\?"faroSharedConsole":"faroQuickHourRail"\):button.dataset.jump/);
 assert.match(js,/\["ArrowLeft","ArrowRight","Home","End"\]/);
 assert.match(js,/buttons\[next\]\.click\(\)/);
 assert.match(js,/state.day=i;state.hour=null;render\(\)/);
 assert.match(js,/state.hour=s.hour;renderSelectedWindow\(\)/);
});
test('offline rails disappear everywhere and model score colours remain canonical',()=>{
 assert.match(css,/body:is\(\.faro-model-pending,\.faro-model-unavailable\) #forecastPage>#faroDayRail/);
 assert.match(css,/body:is\(\.faro-model-pending,\.faro-model-unavailable\) #forecastPage>\.faro-forecast-lead>#faroQuickHourRail/);
 assert.match(html,/<strong id="faroLeadScore">—<\/strong>/);
 assert.match(css,/color:var\(--brand-score-ink,var\(--faro-quiet\)\)/);
 assert.ok((css.match(/!important/g)||[]).length<=486);
});

test('shared renderer replaces duplicated visual interface without changing the model contract',()=>{
 const nl=read('index.html'), shared=read('assets/faro-forecast-console.js');
 for(const page of [nl,html])assert.match(page,/assets\/faro-forecast-console\.js\?v=\d+/);
 assert.match(shared,/attachShadow\(\{mode:"open"\}\)/);
 assert.match(shared,/container-type:inline-size/);
 assert.match(shared,/@container faro/);
 assert.match(shared,/repeat\(auto-fit,minmax\(min\(100%,/);
 assert.match(nl,/getData:faroNLConsoleData/);
 assert.match(js,/getData:faroCLConsoleData/);
 assert.match(shared,/node\.style\.setProperty\("display","none","important"\)/);
 assert.match(shared,/restoring legacy interface/);
});
