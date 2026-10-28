/* FARO Coastal Lens v4: guide-matching, fixed compass, model provenance.
 Run: node --test tests/faro-coastal-lens-v4.test.cjs
 These are SOURCE and pure-math tests, not full browser or physical calibration. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const map=require('../chile/coast-map.js');
const code=read('chile/coast-map.js');
const css=read('assets/faro-coastal-lens-v4.css');
const html=read('chile/index.html');
const guide=JSON.parse(read('chile/valparaiso-score.config.json')).profiles;
const pilot=JSON.parse(read('chile/valparaiso-live.config.json')).pilots;

test('marine and wind direction arrows use FROM + 180 modulo 360',()=>{
 assert.equal(map.bearingFromArrow(241),61);
 assert.equal(map.bearingFromArrow(126),306);
 assert.equal(map.bearingFromArrow(0),180);
 assert.equal(map.bearingFromArrow(null),null);
});
test('guide-sector matching works with angular wrap and does not invent breaking heights',()=>{
 assert.equal(map.distanceToGuide(350,[[337.5,22.5]]),0);
 assert.equal(map.distanceToGuide(10,[[337.5,22.5]]),0);
 assert.equal(map.distanceToGuide(180,[[337.5,22.5]]),157.5);
 assert.equal(map.guideClass(241,guide['CL-VS:la-boca-concon'].waveFromDeg),'inside');
 assert.equal(map.guideClass(241,guide['CL-VS:ritoque'].waveFromDeg),'inside');
 assert.equal(map.guideClass(241,guide['CL-VS:renaca'].waveFromDeg),'inside');
 assert.equal(map.guideClass(241,guide['CL-VS:maitencillo'].waveFromDeg),'inside');
 assert.equal(map.guideClass(null,[]),'unknown');
});
test('full four-beach comparison uses actual published guide profiles',()=>{
 assert.equal(pilot.length,4);
 for(const p of pilot)assert.ok(guide[p.id]?.waveFromDeg?.length>0,p.name);
 assert.match(code,/v\.profiles\?\.\[sp\.id\]/); // see dedicated guide table
});
test('compass stays attached to viewport, not to moving model grid marker',()=>{
 assert.match(code,/viewport\.append\(compassDock\)/);
 assert.match(code,/compassDock\.replaceChildren\(\)/);
 assert.match(css,/\.faro-lens-compass-dock\{pointer-events:none!important;position:absolute!important;\s*z-index:1100!important/);
 assert.match(code,/lastCentered!==latest\.spot\.id/);
 assert.match(code,/frameMap\(false\)/);
 assert.doesNotMatch(code,/\bopened=true/);
});
test('layers are genuine selective controls and point markers remain clickable',()=>{
 for(const mode of ['combined','swell','wind'])assert.ok(code.includes('"'+mode+'"'));
 assert.match(code,/modelGridMarker\.bindPopup\(modelPopup\(true\)/);
 assert.match(code,/windGridMarker\.bindPopup\(modelPopup\(false\)/);
 assert.match(code,/modelGridMarker\.setOpacity\(mapView==="region"&&mode!=="wind"\?1:0\)/);
 assert.match(code,/windGridMarker\.setOpacity\(mapView==="region"&&mode!=="swell"\?1:0\)/);
 assert.doesNotMatch(code,/faro-lens-partitions/);
 assert.match(code,/One primary travel arrow/);
});
test('motion respects reduced-motion, exposure is only an editorial guide',()=>{
 assert.match(code,/prefers-reduced-motion: reduce/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(code,/Comparación regional de rumbo, sin corregir por bancos, sombra costera, profundidad o refracción/);
 assert.match(code,/Sin simulación de refracción ni altura rompiente/);
});
test('asset version and shared Zeeland colours remain unaffected',()=>{
 assert.match(html,/href="\.\.\/assets\/faro-coastal-lens-v4\.css\?v=6"/);
 assert.match(html,/src="coast-map\.js\?v=11"/);
 assert.match(html,/src="chile-forecast\.js\?v=19"/);
 assert.match(html,/faro-visual-system-v2\.css\?v=5/);
});
