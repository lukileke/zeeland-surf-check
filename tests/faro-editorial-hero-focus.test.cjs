/* FARO concise hero contract. Run: node --test tests/faro-editorial-hero-focus.test.cjs
 * Text, safety, CSS layout and model boundaries are asserted statically.
 * These tests do not replace actual screenshot checks on iPhone Safari.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const h=read('chile/index.html');
const c=read('chile/faro-editorial-hero-focus-v1.css');
const js=read('chile/chile-forecast.js');

test('hero layout loaded immediately before shared score palette',()=>{
 const links=[...h.split('</head>')[0].matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(links.at(-1),'faro-score-colour-lock-v1.css?v=1');
 assert.equal(links.at(-2),'faro-editorial-hero-focus-v1.css?v=1');
 assert.ok(links.includes('faro-hero-synchronised-pulse-v1.css?v=1'));
 assert.ok(!/--faro-score-[0-4]:|--brand-score-ink:/.test(c));
});

test('hero has one visible action, score, window and readable editorial headline',()=>{
 const start=h.indexOf('<section id="faroForecastLead"');
 const end=h.indexOf('</section>',start);
 const hero=h.slice(start,end);
 for(const id of ['faroLeadRead','faroLeadHeadline','faroLeadScore','faroLeadGrade','faroLeadTime'])
  assert.ok(hero.includes('id="'+id+'"'));
 assert.ok(c.includes('.faro-lead-action-secondary {\n  display:none!important'));
 assert.ok(c.includes('.faro-lead-metrics,'));
 assert.ok(c.includes('display:none!important'));
 assert.ok(h.includes('data-es="Ver la lectura" data-en="See the outlook"'));
});

test('numerical wave, period and wind metrics remain available beneath hero',()=>{
 for(const id of ['dayWave','dayPeriod','dayWind'])
  assert.ok(h.includes('id="'+id+'"'),'missing detailed metric '+id);
 for(const id of ['faroLeadWave','faroLeadPeriod','faroLeadWind'])
  assert.ok(h.includes('id="'+id+'"'),'legacy updater target still present '+id);
});

test('no live numerical detail is repeated in ordinary hero subtitle',()=>{
 const from=js.indexOf(' const name=spot()?.shortName',js.indexOf('function renderLead('));
 const to=js.indexOf('\nfunction renderPrepHints',from);
 const copy=js.slice(from,to);
 assert.ok(copy.includes('session.score>=8?'));
 assert.ok(copy.includes('Una señal prometedora'));
 assert.ok(copy.includes('Condiciones variables'));
 assert.ok(!copy.includes('FARO estima '));
 assert.ok(!copy.includes('num(session.windKmh'));
 assert.ok(h.includes('Modelo experimental · no es una medición de la rompiente'));
});

test('critical model and access warnings cannot be hidden by layout cleanup',()=>{
 for(const mode of ['has-model-danger','has-model-caution','is-restricted','is-unavailable'])
  assert.ok(c.includes(mode));
 assert.ok(js.includes('lead.classList.toggle("has-model-caution"'));
 assert.ok(js.includes('lead.classList.toggle("has-model-danger"'));
 assert.ok(js.includes('lead.classList.toggle("is-restricted"'));
 assert.ok(js.includes('Ventanas: restricción reportada'));
 assert.ok(js.includes('No se ha verificado el levantamiento'));
 assert.ok(h.includes('id="ventanasAccessNotice"'));
 assert.ok(c.includes('.faro-lead-fineprint {\n  display:none!important;'));
 assert.ok(c.includes(') .faro-lead-fineprint {\n  display:block!important;'));
});

test('mobile stack has no competing beacon clocks or theme-specific score inks',()=>{
 assert.ok(c.includes('@media(max-width:710px)'));
 assert.ok(c.includes('display:flex!important'));
 assert.ok(c.includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important'));
 assert.ok(!c.includes('animation:'));
 assert.ok(!c.includes('--faro-score-'));
 assert.ok(h.includes('faro-hero-synchronised-pulse-v1.css?v=1'));
 assert.ok(h.includes('chile-forecast.js?v=43'));
});
