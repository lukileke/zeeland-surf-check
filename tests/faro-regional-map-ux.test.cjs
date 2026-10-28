/* FARO regional vs beach map contracts · 2026-10-28.
   Source-structure and math checks; the integration smoke test exercises
   click/toggle behaviour in a mock DOM. Real device QA is still required. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const js=read('chile/coast-map.js'),css=read('assets/faro-coastal-lens-v4.css');
const html=read('chile/index.html');
const live=JSON.parse(read('chile/valparaiso-live.config.json'));
test('the regional overview fits all four actual beach coordinates, NOT offshore model sample grids',()=>{
 assert.equal(live.pilots.length,4);
 assert.match(js,/const beaches=\(latest\.spots\|\|\[\]\)\.filter/);
 assert.match(js,/for\(const beach of beaches\.slice\(1\)\)bounds\.extend\(\[beach\.latitude,beach\.longitude\]\)/);
 assert.match(js,/maxZoom:11,animate:false/);
 assert.match(js,/const coast=\[sp\.latitude,sp\.longitude\],L=root\.L/);
 assert.match(js,/if\(showSamples\)for\(const grid of \[latest\.marineGrid,latest\.weatherGrid\]\)/);
 assert.match(js,/grid\.distanceKm<=60/);
});
test('regional displays a distinct contextual reading rather than a local beach HUD',()=>{
 assert.match(js,/regionSummary\.hidden=mapView!=="region"/);
 assert.match(js,/compassDock\.hidden=mapView==="region"/);
 assert.match(js,/CUATRO PLAYAS · UNA COSTA/);
 assert.match(js,/comparison\.open=true/);
 assert.match(css,/\.faro-map-viewport\.faro-map-regional \.faro-direction-hud\{\s*display:none!important/);
 assert.match(css,/\[data-map-view="region"\] \.faro-map-brief\{\s*display:none!important/);
});
test('marine and atmospheric point markers are optional technical detail, not standard regional pins',()=>{
 assert.match(js,/showSamples=false/);
 assert.match(js,/samplesFlag=flag\("samples"/);
 assert.match(js,/if\(mapView==="region"\)frameMap\(true\)/);
 assert.match(js,/samplesFlag\.label\.hidden=mapView!=="region"/);
 assert.match(js,/const displayMarine=mapView==="region"&&showSamples&&mode!=="wind"/);
 assert.match(js,/const displayWind=mapView==="region"&&showSamples&&mode!=="swell"/);
});
test('local glass is lighter but retains text contrast and a reduced transparency fallback',()=>{
 assert.match(css,/background:rgba\(243,251,250,\.44\)!important/);
 assert.match(css,/background:rgba\(15,43,47,\.40\)!important/);
 assert.match(css,/backdrop-filter:blur\(18px\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(css,/rgba\(169,206,207,\.25\)/);
});
test('compare-by-beach keeps the scientific caveat, without assigning independent predictions to all beaches',()=>{
 assert.match(js,/Comparación regional de rumbo, sin corregir por bancos, sombra costera, profundidad o refracción/);
 assert.match(js,/v\.profiles\?\.\[sp\.id\]/);
 assert.match(js,/opts\.onSelectSpot\?\.\(sp\.id\)/);
 assert.match(js,/mapView="beach";frameMap\(false\);drawUi\(\)/);
});
test('both map assets are cache-busted for new design',()=>{
 assert.match(html,/coast-map\.js\?v=13/);
 assert.match(html,/faro-coastal-lens-v4\.css\?v=8/);
});
