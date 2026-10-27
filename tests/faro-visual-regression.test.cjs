/* FARO regression tests. Run: node --test tests/faro-visual-regression.test.cjs
 * Static safety/identity checks complement browser screenshot checks.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const css=read('assets/faro-visual-system-v2.css');
const nl=read('index.html');
const cl=read('chile/index.html');
const chileJs=read('chile/chile-forecast.js');
const map=require('../chile/coast-map.js');
const sources=JSON.parse(read('chile/research/visual-source-registry.v1.json'));
const config=JSON.parse(read('chile/valparaiso-live.config.json'));
function luminance(hex){
 const vals=hex.match(/[0-9a-fA-F]{2}/g).map(x=>parseInt(x,16)/255);
 return vals.map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4)
  .reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
}
function contrast(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test('same final FARO stylesheet loaded in Zeeland and Chile',()=>{
 assert.match(nl,/href="assets\/faro-visual-system-v2\.css\?v=5"/);
 assert.match(cl,/href="\.\.\/assets\/faro-visual-system-v2\.css\?v=5"/);
 assert.ok(nl.indexOf('faro-visual-system-v2.css')>nl.indexOf('faro-desktop.css'));
 assert.ok(cl.indexOf('faro-visual-system-v2.css')>cl.indexOf('chile-visual-contract.css'));
});
test('one immutable FARO palette across LIGHT, DARK and Scriptable',()=>{
 const canonical=['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'];
 // There must be exactly 5 pigment definitions. No second set for light.
 const defs=[...css.matchAll(/--faro-score-([0-4]):(#[a-f0-9]{6})/gi)]
   .map(m=>({index:Number(m[1]),hex:m[2].toLowerCase()}));
 assert.equal(defs.length,5,'duplicated theme-specific score pigment overrides');
 assert.deepEqual(defs.map(x=>x.hex),canonical);
 const widget=read('zeeland-widget.js');
 for(const hex of canonical){
  assert.ok(widget.includes('new Color("'+hex+'")'),'widget mismatch '+hex);
 }
 assert.doesNotMatch(css,/html\[data-theme="light"\]\s*\{[^}]*--faro-score-/);
 for(const band of ['verylow','low','mid','regular','high']){
  assert.ok(css.includes('html[data-theme="light"] .brand-band-'+band));
  assert.ok(css.includes('html:not([data-theme="light"]) .brand-band-'+band));
 }
});
test('selection remains coastal teal; coloured verbal pills are distinct from numeric band pigments',()=>{
 assert.match(css,/\.day-chip\.selected\[class\*="brand-band-"\][^{]*\{\s*border:2px solid var\(--faro-selection\)/);
 for(const grade of ['very-poor','poor','fair','good','excellent','unavailable']){
  assert.ok(css.includes('faro-grade-'+grade),'missing semantic grade '+grade);
 }
 assert.match(nl,/function faroGradeClass\(v\)/);
 assert.match(chileJs,/const gradeClass=n=>/);
 assert.match(css,/\.faro-grade\{/);
 assert.match(css,/--faro-grade-tone/);
 assert.ok(css.includes('.quality-pill.faro-grade'));
 assert.ok(css.includes('.chile-chip-grade.faro-grade'));
});
test('score hue thresholds consistent across country and Scriptable widget',()=>{
 assert.match(nl,/v>=8\?'tone-great':v>=6\?'tone-good':v>=4\?'tone-fair':v>=2\?'tone-poor'/);
 assert.match(chileJs,/n>=8\?"tone-great":n>=6\?"tone-good":n>=4\?"tone-fair":n>=2\?"tone-poor"/);
 const widget=read('zeeland-widget.js');
 for(const boundary of [2,4,6,8])assert.ok(widget.includes('if(v<'+boundary+')'));
});
test('vector convention: FROM bearing to TRAVEL bearing',()=>{
 for(const [incoming,travel] of [[0,180],[90,270],[225,45],[360,180],[-270,270]]){
  assert.equal(map.bearingFromArrow(incoming),travel);
 }
 for(const invalid of [null,undefined,NaN,'180'])assert.equal(map.bearingFromArrow(invalid),null);
});
test('all four pilot spots and actual marine grid used; no fabricated shore vectors',()=>{
 assert.equal(config.pilots.length,4);
 assert.match(chileJs,/spots:state\.config\.pilots/);
 assert.match(chileJs,/marineGrid:state\.forecast\?\.model\?\.marineGrid/);
 const mapSource=read('chile/coast-map.js');
 assert.match(mapSource,/modelGridMarker=L\.marker\(pos/);
 assert.match(mapSource,/L\.latLngBounds\(coast,coast\)/);
 assert.match(mapSource,/bounds\.extend\(\[item\.lat,item\.lon\]\)/);
 assert.doesNotMatch(mapSource,/a\.textContent="↑"/);
 assert.match(mapSource,/Sin simulación de refracción ni altura rompiente/);
});
test('every future training source retains explicit rights and zero observed videos',()=>{
 assert.equal(sources.observedClipCount,0);
 assert.ok(sources.sources.length>=8);
 for(const source of sources.sources){
  assert.equal(typeof source.trainingAllowed,'boolean');
  assert.ok(source.reuseStatus);
  if(source.kind.startsWith('third_party'))assert.equal(source.trainingAllowed,false);
 }
 assert.ok(sources.sources.some(x=>x.id==='int-vwbt9000'&&x.ingestedClipCount===0));
 assert.ok(sources.sources.some(x=>x.id==='usgs-coastal-segmentation'&&x.trainingAllowed===true));
});
test('wave height indicators are enclosed, based on actual model height and do not mark 0 m as a positive bin',()=>{
 assert.match(nl,/faro-wave-instrument/);
 assert.match(nl,/MODEL HEIGHT · VISUAL SCALE/);
 assert.match(nl,/Math\.max\(0,Math\.min\(8,Math\.round\(b\.s\.h\/.25\)\)\)/);
 assert.match(cl,/id="dayWaveMeter" class="chile-wave-bars faro-wave-instrument"/);
 assert.match(chileJs,/Math\.max\(0,Math\.min\(8,Math\.round\(h\/.25\)\)\)/);
 assert.match(css,/html #dayview \.session-glance \.hero-wave-meter/);
});
test('coastal lens displays real swell partitions and separate atmospheric grid',()=>{
 const mapSource=read('chile/coast-map.js');
 assert.doesNotMatch(mapSource,/faro-lens-partitions/);
 assert.match(mapSource,/secondarySwell\?\.fromDeg/);
 assert.match(mapSource,/tertiarySwell\?\.fromDeg/);
 assert.match(mapSource,/windGridMarker=L\.marker\(pos/);
 assert.match(mapSource,/weatherGrid/);
 assert.match(chileJs,/weatherGrid:state\.forecast\?\.model\?\.weatherGrid/);
 assert.match(mapSource,/Sin simulación de refracción ni altura rompiente/);
});
test('no emoji content remains in primary Zeeland forecast templates',()=>{
 assert.ok(!nl.includes('.emoji'));
 assert.ok(!nl.includes('⭐'));
 assert.ok(!nl.includes(' ↗'));
 assert.ok(!cl.includes(' ↗'));
 assert.ok(!chileJs.includes(' ↗'));
});
