const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const w=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');

// Legacy protection: the v14/v15 failures were caused by treating raster
// and gradient layers as interchangeable. Never layer them again.
test('FARO has one native medium/large background with no raster overlay',()=>{
 assert.match(w,/Ambient Mark Editorial v20/);
 assert.match(w,/function nativeTideGradient\(\)/);
 assert.match(w,/function applyCoastalAtmosphere\(kind\)/);
 assert.match(w,/applyCoastalAtmosphere\("medium"\)/);
 assert.match(w,/applyCoastalAtmosphere\(family\)/);
 assert.ok(w.includes('widget.backgroundGradient=nativeTideGradient()'));
 assert.ok(!w.includes('widget.backgroundImage='));
 assert.ok(!w.includes('new DrawContext()'));
});
test('the original FARO logo, score, storm and surf engine are untouched',()=>{
 for(const ink of ['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'])assert.ok(w.includes(ink));
 for(const keyword of ['ORIGINAL_FARO_SVG','hazardLine(widget,hazard','surf-engine.js',
  'RIESGO VIENTO · 48 H'])assert.ok(w.includes(keyword));
});
test('native background has four stops, directional points and safe fallback',()=>{
 for(const s of ['gradient.locations=[0,.31,.68,1]',
   'gradient.startPoint=new Point(0,0)',
   'gradient.endPoint=new Point(1,.9)',
   'new Color("#286B69")',
   'new Color("#153B40")',
   'if(family==="small"||lockFamily)applyFallbackGradient()'])assert.ok(w.includes(s),s);
 assert.ok(!w.includes('setInterval('));
 assert.ok(!w.includes('setTimeout('));
});
test('Scriptable source remains valid with top-level await',()=>{
 assert.doesNotThrow(()=>new (async()=>{}).constructor(w));
});
