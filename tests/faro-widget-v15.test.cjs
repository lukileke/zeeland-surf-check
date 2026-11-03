const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const w=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');
test('v18 uses spatial ocean light only for medium and large',()=>{
 assert.match(w,/Ocean Light Editorial v18/);
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
 assert.ok(w.includes('console.warn("FARO widget background fallback:'));
 assert.ok(w.includes('if(family==="small"||lockFamily)applyFallbackGradient();'));
 assert.ok(w.includes('widget.backgroundImage=image;'));
 assert.ok(w.includes('function faroMixColour('));
 assert.ok(!w.includes('drawRescueRing('));
 assert.ok(!w.includes('dc.addPath(wave);dc.strokePath()'));
 assert.ok(!w.includes('beam.move('));
 assert.ok(w.includes('applyFallbackGradient();'));
 assert.ok(!w.includes('widget.backgroundGradient=grad;\n}catch(e)'));
 assert.ok(w.includes('Math.min(step,h-y)'));
 assert.ok(w.includes('const step=large?12:10'));
 assert.ok(w.includes('applyFallbackGradient();'));
 assert.ok(!w.includes('setInterval('));
 assert.ok(!w.includes('setTimeout('));
});
test('top-level Scriptable await remains syntactically valid',()=>{
 assert.doesNotThrow(()=>new Function('return (async()=>{'+w+'})'));
});
