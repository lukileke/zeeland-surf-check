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
test('five modelled beaches each retain their own guide hypothesis profile',()=>{
 assert.equal(pilot.length,5);
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
test('Ventanas is a separate pilot with an independent restriction',()=>{
 assert.equal(pilot.some(p=>p.id==='CL-VS:ventanas'),true);
 assert.equal(guide['CL-VS:ventanas'].accessRestriction.newResolutionVerified,false);
 assert.match(code,/markers\.get\(sp\.id\)\.setIcon\(markerIcon\(L,sp,sp\.id===sel,reading\)\)/);
});
test('Chile notices share FARO Zeeland presentation with both real map renderers',()=>{
 const notices=require('../chile/faro-notices.js');
 const mapSpot=pilot.find(s=>s.id==='CL-VS:ventanas');
 const info=notices.describe(mapSpot,'es');
 assert.equal(info.type,'reported_restriction');
 assert.equal(info.severity,'caution');
 assert.equal(info.live,false);
 assert.equal(info.lastReport,'2026-10-27');
 assert.match(info.headline,/Ventanas/);
 assert.match(info.tooltipDetail,/27/);
 assert.match(info.subline,/no verificado/i);
 assert.match(info.sourceUrl,/^https:\/\/puranoticia/);
 const eng=notices.describe(mapSpot,'en');
 assert.match(eng.tooltipTitle,/Reported recreation restriction/);
 assert.match(eng.subline,/not verified/i);
 const clear={...mapSpot,accessNotice:{...mapSpot.accessNotice,clearanceVerified:true}};
 assert.equal(notices.describe(clear,'es'),null);
 assert.equal(notices.describe({...mapSpot,accessNotice:{status:'unexpected-status'}},'es'),null);
 assert.match(html,/faro-notices\.js\?v=1/);
 assert.match(html,/faro-access-brand/);
 assert.match(html,/faro-safety-kicker/);
 assert.match(html,/faroAccessSourceLink/);
 assert.match(code,/function showNotice\(sp,anchor,pin=false\)/);
 assert.match(code,/function wireNotice\(sp,anchor\)/);
 assert.match(code,/wireNotice\(sp,alert\)/);
 assert.match(code,/wireNotice\(sp,pin\)/);
 assert.match(code,/stopPropagation\(\)/);
 assert.match(css,/\.faro-map-access-tooltip\[hidden\]/);
});
test('asset version and shared Zeeland colours remain unaffected',()=>{
 assert.match(html,/href="\.\.\/assets\/faro-coastal-lens-v4\.css\?v=16"/);
 assert.match(html,/src="coast-map\.js\?v=20"/);
 assert.match(html,/src="chile-forecast\.js\?v=31"/);
 assert.match(html,/faro-visual-system-v2\.css\?v=5/);
});
