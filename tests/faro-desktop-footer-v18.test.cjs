/* FARO desktop day/hour and authentic footer regression.
 * node --test tests/faro-desktop-footer-v18.test.cjs
 * Static selector/contracts; Chrome/WebKit screenshots are separately produced.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('chile/index.html'),js=read('chile/chile-forecast.js');
const css=read('chile/faro-decision-balance-v1.css');

test('fix loaded as the final layout sheet, then immutable score-colour lock',()=>{
 const links=[...html.split('</head>')[0].matchAll(/href="([^"]+\.css\?v=\d+)"/g)].map(x=>x[1]);
 assert.equal(links.at(-1),'faro-score-colour-lock-v1.css?v=1');
 assert.equal(links.at(-2),'faro-bundle-experience-v1.css?v=1');
 assert.doesNotMatch(css,/--faro-score-[0-4]\s*:|--brand-score-ink\s*:/);
});
test('three desktop metrics share a single grid row and do not orphan wind',()=>{
 assert.ok(css.includes('grid-template-columns:minmax(0,1.28fr) minmax(0,.86fr) minmax(0,.86fr)!important'));
 assert.ok(css.includes('grid-template-rows:minmax(0,auto)!important'));
 for(const [type,col] of [['.chile-day-wave-feature',1],['.day-signal-metric:nth-child(2)',2],['.day-signal-metric:nth-child(3)',3]]){
  assert.ok(css.includes(type),'missing '+type);
  assert.ok(css.includes('grid-column:'+col+'!important'));
 }
 assert.ok(css.includes('grid-row:1!important'));
 assert.ok(html.includes('id="dayWaveMeter"'));
 assert.ok(html.includes('id="chileWaveExplain"'));
});
test('the selected two-hour reading has model context that follows the selection',()=>{
 assert.ok(html.includes('id="faroHourlySignals"'));
 assert.ok(js.includes('const signals=$("faroHourlySignals")'));
 for(const key of ['s.totalWaveHeightM','s.swellPeriodS','s.windKmh'])assert.ok(js.includes(key));
 assert.ok(js.includes('if(s?.modelComplete)'));
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
});
test('the duplicate second hero is gone; footer is native and not card-shaped',()=>{
 assert.ok(!html.includes('class="faro-footer-bridge"'));
 assert.ok(html.includes('id="faroSiteFooter"'));
 assert.ok(css.includes('main:has(#forecastPage:not(.hide))>footer'));
 assert.ok(css.includes('border-radius:0!important'));
 assert.ok(css.includes('box-shadow:none!important'));
 assert.ok(css.includes('main:has(#forecastPage:not(.hide))>footer.chile-footer.faro-footer-v2,'));
 assert.ok(css.includes('grid-template-columns:minmax(0,1fr)!important'));
 assert.ok(css.includes('background:transparent!important'));
 ;
 assert.ok(html.includes('class="faro-footer-manifesto"'));
});
test('narrow viewport keeps reading sequence and all facts',()=>{
 assert.ok(css.includes('@media(max-width:1119px)'));
 assert.ok(css.includes('@media(max-width:710px)'));
 assert.ok(css.includes('@media(max-width:375px)'));
 assert.ok(css.includes('grid-column:1/-1!important;grid-row:auto!important'));
 assert.ok(html.includes('chile-forecast.js?v=45'));
});
