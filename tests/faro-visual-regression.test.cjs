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
 assert.match(nl,/href="assets\/faro-visual-system-v2\.css\?v=2"/);
 assert.match(cl,/href="\.\.\/assets\/faro-visual-system-v2\.css\?v=2"/);
 assert.ok(nl.indexOf('faro-visual-system-v2.css')>nl.indexOf('faro-desktop.css'));
 assert.ok(cl.indexOf('faro-visual-system-v2.css')>cl.indexOf('chile-visual-contract.css'));
});
test('five brand bands have sufficient contrast in both themes',()=>{
 const light=['a94a33','91601d','79651b','4c712b','2f6c43'];
 const dark=['ef9b77','efbd6e','e0cc73','b1d574','8cc584'];
 for(let i=0;i<5;i++){
  assert.match(css,new RegExp('--faro-score-'+i+':'));
  assert.ok(contrast(light[i],'f6f9f8')>=4.5,'light band '+i+' fails WCAG AA');
  assert.ok(contrast(dark[i],'101517')>=4.5,'dark band '+i+' fails WCAG AA');
 }
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
 assert.match(mapSource,/L\.latLngBounds\(coast,\[grid\.lat,grid\.lon\]\)/);
 assert.doesNotMatch(mapSource,/a\.textContent="↑"/);
 assert.match(mapSource,/no refracción ni altura rompiente/);
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
test('no emoji content remains in primary Zeeland forecast templates',()=>{
 assert.ok(!nl.includes('.emoji'));
 assert.ok(!nl.includes('⭐'));
 assert.ok(!nl.includes(' ↗'));
 assert.ok(!cl.includes(' ↗'));
 assert.ok(!chileJs.includes(' ↗'));
});
