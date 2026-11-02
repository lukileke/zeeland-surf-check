/* FARO editorial experience v2. Run: node --test tests/faro-editorial-experience.test.cjs
 * Static checks; iPhone Safari and full desktop browser QA remain separate.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const html=read('chile/index.html');
const css=read('chile/faro-editorial-experience-v2.css');
const controller=read('chile/chile-forecast.js');
const model=read('chile/faro-chile-live.js');
const ids=[
 'chileSpotSelect','chileSpotButton','chileSpotOptions','faroForecastLead',
 'dailyOverview','faroPrepHints','dayview','slots','dayStrip','chileCoastMap',
 'coastMapExpand','waveInsightExpand','openOceanCompass','sessionDetailExpand',
 'sessionEssentials','faroTechnicalExpand','spotInsightExpand','cameraExpand',
 'fieldNotesExpand','forecastSources','faroLeadScore'
];
test('the working data and navigation controls have unique IDs',()=>{
 for(const id of ids)assert.equal(html.split('id="'+id+'"').length,2,id);
});
test('location dock -> hero -> shared day/hour pair -> map -> prep -> editorial end',()=>{
 const ordered=['class="faro-context-dock"','id="faroForecastLead"',
  'id="dayview"','class="forecast-section day-outlook-section"',
  'class="forecast-section hourly-section"','id="dayStrip"',
  'class="faro-ocean-explorer"','class="forecast-section session-section"',
  'class="faro-detail-hub"'];
 const positions=ordered.map(text=>html.indexOf(text));
 assert.ok(positions.every((n,i)=>n>=0&&(i===0||n>positions[i-1])));
 assert.ok(css.includes('grid-template-columns:minmax(0,.96fr) minmax(0,1.04fr)'));
 assert.ok(css.includes('@media(max-width:1030px)'));
});
test('swell/wind map stays visible when optional direction details open',()=>{
 assert.ok(controller.includes('$("coastMapExpand").open=true'));
 assert.ok(controller.includes('$("waveInsightExpand").open=isTechnical'));
 assert.ok(css.includes('#forecastPage #dayview #coastMapExpand>summary'));
 assert.ok(html.includes('data-es="Orientación técnica"'));
});
test('preparation uses actual selected session model; failed fetch stays neutral',()=>{
 assert.ok(controller.includes('function renderPrepHints(s)'));
 assert.ok(controller.includes('if(s&&sessionDecision(s).canRecommend)'));
 assert.ok(controller.includes('renderPrepHints(s);'));
 assert.ok(controller.includes('renderPrepHints(null)'));
 assert.ok(model.includes('hasConsecutiveCoreRows'));
});
test('dark/light shared hero and scores are retained, logo unchanged',()=>{
 assert.ok(html.includes('faro-beacon-atmosphere-v4.css?v=1'));
 assert.ok(html.includes('src="../assets/faro-logo.svg"'));
 assert.ok(html.includes('src="../assets/faro-logo-dark.svg"'));
 const links=[...html.split('</head>')[0].matchAll(/<link rel="stylesheet" href="([^"]+)"/g)];
 assert.equal(links.at(-1)[1],'faro-score-colour-lock-v1.css?v=1');
 assert.ok(links.some(x=>x[1]==='faro-editorial-experience-v2.css?v=1'));
 assert.ok(!css.includes('--brand-score-ink:')&&!css.includes('--faro-score-0:'));
});
test('editorial finishing preserves external pages and scientific disclaimers',()=>{
 assert.ok(html.includes('class="faro-footer-manifesto"'));
 assert.ok(html.includes('href="atlas.html"'));
 assert.ok(html.includes('href="lab.html"'));
 assert.ok(html.includes('data-expand-target="forecastSources"'));
 assert.ok(html.includes('avisos oficiales requieren comprobación independiente'));
});
