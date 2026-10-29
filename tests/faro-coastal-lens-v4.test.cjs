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
 assert.match(css,/\.faro-lens-compass-dock\.faro-direction-hud\{[\s\S]*?z-index:1100!important/);
 assert.match(code,/lastCentered!==latest\.spot\.id/);
 assert.match(code,/frameMap\(false\)/);
 assert.doesNotMatch(code,/\bopened=true/);
});
test('layers are genuine selective controls and point markers remain clickable',()=>{
 for(const mode of ['combined','swell','wind'])assert.ok(code.includes('"'+mode+'"'));
 assert.match(code,/modelGridMarker\.bindPopup\(modelPopup\(true\)/);
 assert.match(code,/windGridMarker\.bindPopup\(modelPopup\(false\)/);
 assert.match(code,/const displayMarine=mapView==="region"&&showSamples&&mode!=="wind"/);
 assert.match(code,/const displayWind=mapView==="region"&&showSamples&&mode!=="swell"/);
 assert.doesNotMatch(code,/faro-lens-partitions/);
 assert.match(code,/function modelSampleIcon\(L,kind\)/);
 assert.doesNotMatch(code,/function modelGridIcon\(/);
});
test('motion respects reduced-motion, exposure is only an editorial guide',()=>{
 assert.match(code,/prefers-reduced-motion: reduce/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(code,/Comparación regional de rumbo e intensidad usando la franja y los datos modelados seleccionados/);
 assert.match(code,/Sin simulación de refracción ni altura rompiente/);
});
test('regional S/W indicators share the exact HUD signal, not colour-only angular guide fit',()=>{
 const slot={swellDirection:238,swellHeightM:1.3,swellPeriodS:9,windDirection:55,windKmh:3,gustKmh:5};
 const reading=map.spotSignals(slot,guide['CL-VS:renaca']);
 assert.equal(reading.swellSignal.level,'favourable');
 assert.equal(reading.windFit,'edge');
 assert.equal(reading.windSignal.level,'favourable');
 assert.match(code,/micro\.dataset\.level=signal\.level/);
 assert.match(code,/markers\.get\(sp\.id\)\.setIcon\(markerIcon\(L,sp,sp\.id===sel,reading\)\)/);
 assert.match(code,/spotSignals\(slot,hudProfile\)/);
 assert.match(css,/\.faro-map-pin \.faro-region-fit-tick\[data-level\]/);
 assert.match(css,/\.faro-region-legend-dot\[data-level\]/);
});

test('regional click retains regional comparison and selected contrast overrides guide colour',()=>{
 assert.match(code,/if\(mapView==="beach"\)frameMap\(false\)/);
 assert.doesNotMatch(code,/mapView="beach";frameMap\(false\);drawUi\(\)/);
 assert.match(code,/base\.dataset\.spotId=spot\.id/);
 assert.match(css,/\.faro-map-pin\.is-current \.faro-region-fit-tick\[data-level="favourable"\]/);
 assert.match(css,/\.faro-map-pin\.is-current \.faro-region-fit-tick\[data-level\]/);
 assert.match(css,/data-spot-id="CL-VS:la-boca-concon"/);
 assert.match(css,/data-spot-id="CL-VS:renaca"/);
});
test('Ventanas is a reference-only marker, not a fifth scored or modelled pilot',()=>{
 assert.match(code,/const references=\(current\.referenceSpots\|\|\[\]\)/);
 assert.match(code,/referenceMarkers=new Map\(\)/);
 assert.match(code,/referenceIcon\(L,sp\)/);
 assert.match(code,/showReference\(sp\)/);
 assert.match(code,/data-reference-spot/);
 assert.doesNotMatch(code,/referenceMarkers\.get\(sp\.id\)\.setIcon\(markerIcon/);
});
test('asset version and shared Zeeland colours remain unaffected',()=>{
 assert.match(html,/href="\.\.\/assets\/faro-coastal-lens-v4\.css\?v=14"/);
 assert.match(html,/src="coast-map\.js\?v=18"/);
 assert.match(html,/src="chile-forecast\.js\?v=27"/);
 assert.match(html,/faro-visual-system-v2\.css\?v=5/);
});
