/* FARO design finish contract.
 * Run: node --test tests/faro-finish-pass.test.cjs
 * Static regression tests; real Chrome/Safari visual QA remains separate.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const get=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=get('chile/index.html');
const js=get('chile/chile-forecast.js');
const css=get('chile/faro-finish-pass-v1.css');
const balance=get('chile/faro-decision-balance-v1.css');
const config=JSON.parse(get('chile/valparaiso-live.config.json'));
const links=[...html.split('</head>')[0].matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);

test('priority preserves all 5 canonical score pigments',()=>{
 assert.ok(links.includes('faro-editorial-experience-v2.css?v=3'));
 assert.ok(!links.includes('faro-finish-pass-v1.css?v=1'));
 assert.ok(get('chile/faro-editorial-experience-v2.css').includes('faro-access-mark-core'));
 assert.equal(links.at(-1),'faro-score-colour-lock-v1.css?v=1');
 for(const x of ['--faro-score-0:','--brand-score-ink:','#faroLeadScore'])
  assert.ok(!css.includes(x),'visual finish must not change score pigment: '+x);
 assert.ok(html.includes('faro-beacon-atmosphere-v4.css?v=1'));
});

test('the report is dated, sourced and never calls an unverified closure live',()=>{
 const notice=config.pilots.find(p=>p.accessNotice?.noticeType==='reported_restriction')?.accessNotice;
 assert.equal(notice.lastConfirmedReport,'2026-10-29');
 assert.equal(notice.clearanceVerified,false);
 assert.equal(notice.autoChecked,false);
 assert.equal(notice.liveOfficialStatusVerified,false);
 assert.match(notice.sourceUrl,/2026\/10\/29/);
 assert.ok(js.includes('tr("REPORTE FECHADO","DATED REPORT")'));
 assert.ok(html.includes('class="faro-access-watermark"'));
 assert.ok(css.includes('faro-access-mark-core'));
 assert.ok(css.includes('content:none!important;display:none!important'));
});

test('the selected window is a connected reading, not a distant card',()=>{
 assert.ok(html.includes('id="faroHourlySelectedTime"'));
 assert.ok(html.includes('class="faro-hourly-read-meta"'));
 assert.ok(js.includes('faro-slot-selected-label'));
 assert.ok(js.includes('txt("faroHourlySelectedTime",s?sessionTime(s)'));
 assert.match(css,/\.hourly-section #faroHourlyPreview \{/);
 assert.ok(css.includes('margin:14px 0 0!important'));
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'));
});

test('prep tags use real selected session data, separate from surf-quality scores',()=>{
 assert.ok(js.includes('item.dataset.level=level'));
 assert.ok(js.includes('uv.category'));
 for(const type of ['wetsuit','water','uv','neutral'])
  assert.ok(css.includes('faro-prep-chip--'+type));
 assert.ok(css.includes('data-level="very-high"'));
});

test('the website ends in a real footer instead of a redundant second hero',()=>{
 assert.ok(!html.includes('class="faro-footer-bridge"'));
 assert.ok(html.includes('id="faroSiteFooter"'));
 assert.ok(balance.includes('border-radius:0!important'));
 assert.ok(balance.includes('grid-template-columns:minmax(0,1.1fr) minmax(270px,.9fr)!important'));
 assert.ok(balance.includes('main:has(#forecastPage:not(.hide))>footer'));
});
test('selected session has model facts without altering the score engine',()=>{
 assert.ok(html.includes('id="faroHourlySignals"'));
 assert.ok(js.includes('const signals=$("faroHourlySignals")'));
 assert.ok(balance.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'));
});

test('the model and the original lighthouse brand remain intact',()=>{
 assert.ok(html.includes('faro-chile-live.js?v=11'));
 assert.ok(html.includes('src="../assets/faro-logo-dark.svg"'));
 assert.ok(html.includes('src="../assets/faro-logo.svg"'));
 assert.ok(html.includes('chile-forecast.js?v=45'));
});
