/* FARO product UX test contract · 27 October 2026
   Source-level checks; browser/device screenshots remain a separate QA step. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
const html=read('chile/index.html');
const ctrl=read('chile/chile-forecast.js');
const map=read('chile/coast-map.js');
const css=read('assets/faro-coastal-lens-v4.css');
test('direct user journey has four unique valid target IDs and accessible button semantics',()=>{
 const targets=[...html.matchAll(/data-jump="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(targets,['slots','coastMapExpand','spotInsightExpand','cameraExpand']);
 for(const name of targets)assert.match(html,new RegExp('id="'+name+'"'));
 assert.match(html,/class="faro-journey-nav" aria-label=/);
 assert.match(ctrl,/querySelectorAll\("\.faro-journey-nav \[data-jump\]"\)/);
 assert.match(ctrl,/target\.tagName==="DETAILS"\)target\.open=true/);
 assert.match(ctrl,/prefers-reduced-motion: reduce/);
 assert.match(ctrl,/head\.focus\(\{preventScroll:true\}\)/);
});
test('map has one-tap reframe and preserves manual zoom on hourly model updates',()=>{
 assert.match(map,/recenter\.addEventListener\("click",\(\)=>\{/);
 assert.match(map,/mapView=mapView==="beach"\?"region":"beach"/);
 assert.match(map,/map\.setView\(coast,viewport\.clientWidth&&viewport\.clientWidth<520\?15:16/);
 assert.match(map,/lastCentered!==latest\.spot\.id/);
 assert.match(map,/map\.on\("dragstart",\(\)=>\{pendingSampleFit=false;\}\)/);
 assert.match(map,/bounds\.extend\(\[grid\.lat,grid\.lon\]\)/);
 assert.match(map,/grid\.distanceKm<=60/);
 assert.doesNotMatch(map,/map\.fitBounds\(bounds,\{padding:\[85,90\]/);
});
test('advanced model display is progressively disclosed and legends match shown overlays',()=>{
 assert.match(map,/document\.createElement\("details"\);advanced\.className="faro-lens-options"/);
 assert.match(map,/advancedSummary\.textContent=es\?"Opciones del mapa":"Map options"/);
 assert.doesNotMatch(map,/entries\.push\(\["#8384b8"/);
 assert.doesNotMatch(map,/faro-lens-partitions/);
 assert.match(map,/technicalSummary\.textContent=es\?"Modelo, detalles y limitaciones"/);
 assert.match(map,/comparison\.open=wasOpen/);
 assert.match(map,/mode==="wind"\?hudProfile\.windFromDeg:hudProfile\.waveFromDeg/);
 assert.match(map,/Guía de viento/);
});
test('map load error retains fixed compass and declares schematic fallback',()=>{
 assert.match(map,/viewport\.replaceChildren\(schematic,compassDock\)/);
 assert.match(map,/Mapa base no disponible/);
 assert.match(map,/status\.setAttribute\("role","status"\)/);
 assert.match(css,/\.faro-lens-status:empty\{display:none\}/);
});
test('controls have minimum 44 px touch targets and clear focus treatment',()=>{
 assert.match(css,/\.faro-journey-nav \[data-jump\]\{[\s\S]*?min-height:44px/);
 assert.match(css,/\.faro-lens-controls \.faro-lens-recenter\{[\s\S]*?min-height:44px/);
 assert.match(css,/\.faro-lens-options>summary\{[\s\S]*?min-height:42px/);
 assert.match(css,/#forecastPage > \.faro-journey-nav\{\s*grid-column:1\/-1!important/);
 assert.match(css,/outline:3px solid var\(--faro-selection\)!important/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('asset versions are updated without overwriting Zeeland visual contract',()=>{
 assert.match(html,/faro-coastal-lens-v4\.css\?v=7/);
 assert.match(html,/coast-map\.js\?v=12/);
 assert.match(html,/chile-forecast\.js\?v=20/);
 assert.match(html,/faro-visual-system-v2\.css\?v=5/);
 assert.match(read('index.html'),/faro-visual-system-v2\.css\?v=5/);
});
