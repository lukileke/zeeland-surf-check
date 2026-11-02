const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const w=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');
test('v15 uses native offline illumination only for medium and large',()=>{
 assert.match(w,/Deep Ocean Editorial v15/);
 assert.match(w,/function deepOceanCanvas\(kind\)/);
 assert.match(w,/kind==="small"\|\|String\(kind\)\.startsWith\("accessory"\)/);
 assert.match(w,/function applyCoastalAtmosphere\(kind\)/);
 assert.match(w,/applyCoastalAtmosphere\("medium"\)/);
 assert.match(w,/applyCoastalAtmosphere\(family\)/);
 assert.match(w,/widget\.backgroundImage=image/);
});
test('preserves canonical numerical score inks, hazards, logo and engine',()=>{
 for(const pigment of ['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'])
  assert.ok(w.includes(pigment),pigment);
 assert.ok(w.includes('ORIGINAL_FARO_SVG'));
 assert.ok(w.includes('hazardLine(widget,hazard'));
 assert.ok(w.includes('surf-engine.js'));
});
test('no pseudo animation; background can fall back safely',()=>{
 assert.ok(w.includes('new DrawContext()'));
 assert.ok(w.includes('catch(e){console.warn("FARO widget background fallback:'));
 assert.ok(!w.includes('setInterval('));
 assert.ok(!w.includes('setTimeout('));
});
test('top-level Scriptable await remains syntactically valid',()=>{
 assert.doesNotThrow(()=>new Function('return (async()=>{'+w+'})'));
});
