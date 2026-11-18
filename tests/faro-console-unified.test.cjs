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
 assert.match(js,/button.dataset.jump==="slots"\?"faroQuickHourRail":button.dataset.jump/);
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
