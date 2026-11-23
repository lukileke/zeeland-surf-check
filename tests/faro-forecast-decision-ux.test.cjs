'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('chile/index.html');
const css=read('chile/faro-tide-read.css');
const js=read('chile/chile-forecast.js');
const doc=read('docs/design/faro-forecast-ux-benchmark-2026.md');

test('decision hierarchy remains spot, independent days, HERO, in-HERO hours',()=>{
 const spot=html.indexOf('class="faro-context-dock"');
 const days=html.indexOf('id="faroDayRail"');
 const hero=html.indexOf('id="faroForecastLead"');
 const hours=html.indexOf('id="faroQuickHourRail"');
 const end=html.lastIndexOf('\n  </section>',html.indexOf('id="ventanasAccessNotice"'));
 assert.ok(spot<days&&days<hero&&hero<hours&&hours<end);
 assert.ok(html.includes('FRANJAS · VIENTO (km/h)'));
});
test('seven-day trend is derived only from eligible existing score',()=>{
 assert.match(js,/if\(ok\(value\)\)mini\.style\.setProperty\("--faro-day-pct"/);
 assert.match(js,/Math\.max\(0,Math\.min\(10,value\)\)\/10/);
 assert.match(css,/\.faro-console-day-chip\[class\*="brand-band-"\]::after/);
 assert.match(css,/width:calc\(\(100% - 18px\)\*var\(--faro-day-pct,0\)\)/);
 assert.match(css,/background:var\(--brand-score-ink\)/);
});
test('hourly wind information never supplants risk, caution or missing-data states',()=>{
 for(const piece of ['!past','!dangerous','!unknownRisk','slotSafety!=="caution"','s.daylight?.eligible','ok(value)','ok(s.windKmh)','ok(s.windDirection)'])
  assert.ok(js.includes(piece),'missing guard '+piece);
 assert.match(js,/const compactWind=windReady\?Live\.cardinal\(s\.windDirection\)/);
 assert.match(js,/compactWind\|\|label/);
 assert.match(js,/tr\(" · viento "," · wind "\)/);
 assert.match(js,/mini\.setAttribute\("aria-label",sessionTime\(s\)/);
});
test('desktop surface prioritises forecast without extra CSS priority flags',()=>{
 assert.match(css,/@media\(min-width:1120px\)\{[\s\S]*?grid-template-areas:"spot region updated"/);
 assert.match(css,/faro-context-heading>div:first-child\{display:none\}/);
 assert.match(css,/faro-context-dock \.picker-grid>\.chile-spot-picker:first-child\{display:none\}/);
 assert.ok((css.match(/!important/g)||[]).length<=484);
 assert.match(html,/faro-tide-read\.css\?v=18/);
 assert.match(html,/chile-forecast\.js\?v=57/);
});
test('review knowledge is documented, independently inspectable and evidence-led',()=>{
 assert.match(doc,/Surfline/);
 assert.match(doc,/Lineup/);
 assert.match(doc,/Surf-Forecast/);
 assert.match(doc,/Windy/);
 assert.match(doc,/modelo/);
 assert.match(doc,/no constituyen una validación independiente/);
});
