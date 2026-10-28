/* FARO directional HUD and visual wave-gauge regression.
   These check model-derived signal rules and source consistency; not browser
   rendering and not validation of physical surf outcomes. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const map=require('../chile/coast-map.js');
const html=read('chile/index.html');
const css=read('assets/faro-coastal-lens-v4.css');
const ctrl=read('chile/chile-forecast.js');
const code=read('chile/coast-map.js');

test('swell combines sector fit with H squared times period; never a surf score',()=>{
 const good={swellHeightM:1.4,swellPeriodS:11};
 assert.deepEqual(map.signalAssessment('swell','inside',good),
  {level:'favourable',strength:'energetic'});
 assert.equal(map.signalAssessment('swell','inside',{swellHeightM:.25,swellPeriodS:5}).level,'weak');
 assert.equal(map.signalAssessment('swell','outside',good).level,'unfavourable');
 assert.equal(map.signalAssessment('swell','edge',good).level,'mixed');
 assert.equal(map.signalAssessment('swell','inside',{}).level,'unknown');
 assert.equal(map.signalAssessment('swell','unknown',good).level,'unknown');
});
test('wind combines local direction, speed and gust; calm wind remains mild',()=>{
 assert.equal(map.signalAssessment('wind','inside',{windKmh:8,gustKmh:12}).level,'favourable');
 assert.equal(map.signalAssessment('wind','outside',{windKmh:3,gustKmh:6}).level,'favourable');
 assert.equal(map.signalAssessment('wind','inside',{windKmh:30,gustKmh:42}).level,'unfavourable');
 assert.equal(map.signalAssessment('wind','edge',{windKmh:17,gustKmh:24}).level,'mixed');
 assert.equal(map.signalAssessment('wind','inside',{windKmh:12,gustKmh:45}).level,'unfavourable');
 assert.equal(map.signalAssessment('wind','inside',{}).level,'unknown');
});
test('beach view contains a corner HUD, no centre beach disc; guide toggle has effect',()=>{
 assert.match(code,/compassDock\.replaceChildren\(\)/);
 assert.match(code,/faro-lens-compass-dock faro-direction-hud/);
 assert.doesNotMatch(code,/function beachVectorIcon\(/);
 assert.doesNotMatch(code,/beachVectorMarker/);
 assert.match(code,/if\(exposure\)\{/);
 assert.match(code,/faro-hud-guide/);
 assert.match(code,/aria-label/);
 assert.match(css,/rgba\(243,251,250,\.44\)/);
 assert.match(css,/rgba\(15,43,47,\.40\)/);
 assert.match(css,/-webkit-backdrop-filter:blur\(18px\)/);
 assert.match(css,/max-width:480px/);
});
test('directional travel arrows use FROM+180, live model inputs and text labels',()=>{
 assert.equal(map.bearingFromArrow(238),58);
 assert.equal(map.bearingFromArrow(81),261);
 assert.match(code,/signalAssessment\("swell",swellFitHUD,slot\)/);
 assert.match(code,/signalAssessment\("wind",windFitHUD,slot\)/);
 assert.match(code,/Flechas: hacia dónde viajan/);
 assert.match(code,/Guía \+ intensidad modelada/);
 assert.doesNotMatch(code,/primarySwellWaveHeightBreakingEstimate/);
});
test('wave height gauge uses a real capped 0–2 m+ scale, not an invented breaker trace',()=>{
 assert.match(ctrl,/function waveBars\(h\)/);
 assert.match(ctrl,/Math\.min\(1,Math\.max\(0,h\/2\)\)/);
 assert.match(ctrl,/Math\.max\(0,Math\.min\(8,Math\.round\(h\/\.25\)\)\)/);
 assert.match(ctrl,/faro-gauge-rail/);
 assert.match(ctrl,/faro-gauge-ticks/);
 assert.match(ctrl,/faro-gauge-position/);
 assert.match(ctrl,/not breaking surf/);
 assert.match(html,/id="dayWaveMeter"/);
 assert.match(css,/\.faro-wave-gauge \.faro-gauge-rail/);
 assert.match(css,/\.faro-gauge-position/);
});
test('MapLibre browser build is compatible with Leaflet adapter, with a retina fallback',()=>{
 assert.match(code,/maplibre-gl@5\.24\.0\/dist\/maplibre-gl\.js/);
 assert.match(code,/maplibre-gl-leaflet@0\.1\.4\/leaflet-maplibre-gl\.js/);
 assert.match(code,/detectRetina:true/);
 assert.match(code,/gl\.once\("load"/);
 assert.match(code,/tiles\.openfreemap\.org\/styles\/positron/);
});
test('cache version and Field Notes row are present',()=>{
 assert.match(html,/faro-coastal-lens-v4\.css\?v=9/);
 assert.match(html,/coast-map\.js\?v=14/);
 assert.match(html,/chile-forecast\.js\?v=20/);
 assert.match(html,/data-faro-icon="field-notes"/);
});
