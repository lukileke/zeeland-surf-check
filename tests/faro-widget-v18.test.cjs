/* FARO Widget Ocean Light v18 — offline native canvas contract.
 * node --test tests/faro-widget-v18.test.cjs
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const w=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');

test('widget compiles for Scriptable with Spanish default and auto-update',()=>{
 assert.match(w,/Ocean Light Editorial v18/);
 assert.doesNotThrow(()=>new (async()=>{}).constructor(w));
 assert.ok(w.includes('const LANG=opt("LANG")==="EN"'));
 assert.ok(w.includes('Script.setWidget(widget)'));
 assert.ok(w.includes('const SITE="https://lukileke.github.io/zeeland-surf-check/"'));
});
test('the backdrop is a visible smooth opaque ocean gradient, not translucent circles',()=>{
 const a=w.indexOf('/* FARO Ocean Light v18'),b=w.indexOf('function label(parent',a);
 assert.ok(a>=0&&b>a);
 const src=w.slice(a,b);
 assert.ok(src.includes('const step=large?12:10'));
 assert.ok(src.includes('Math.exp(-.5*(dx*dx+dy*dy))'));
 assert.ok(src.includes('Math.min(step,h-y)'));
 assert.ok(src.includes('widget.backgroundImage=image;return;'));
 for(const unwanted of ['drawRescueRing','dc.fillEllipse(','dc.addPath(wave)','beam.move','setInterval('])
  assert.ok(!src.includes(unwanted),unwanted);
});
test('all original information, hazard, palette and fallbacks remain',()=>{
 for(const ink of ['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'])
  assert.ok(w.includes(ink));
 assert.ok(w.includes('RIESGO VIENTO · 48 H'));
 assert.ok(w.includes('ORIGINAL_FARO_SVG'));
 assert.ok(w.includes('if(family==="small"||lockFamily)applyFallbackGradient()'));
 assert.ok(w.includes('applyCoastalAtmosphere("medium")'));
 assert.ok(w.includes('applyCoastalAtmosphere(family)'));
});
test('background correctly paints four widget/theming combinations',()=>{
 class Color{constructor(hex){this.hex=hex}}
 class Rect{constructor(x,y,w,h){Object.assign(this,{x,y,w,h})}}
 class Size{constructor(w,h){Object.assign(this,{w,h})}}
 class DrawContext{
  constructor(){this.ops=[]}
  setFillColor(c){this.color=c}
  fillRect(r){this.ops.push({rect:r,hex:this.color.hex})}
  getImage(){return {ops:this.ops,size:this.size}}
 }
 const a=w.indexOf('function faroMixColour('),b=w.indexOf('function label(parent',a);
 const source=w.slice(a,b);
 for(const theme of ['DARK','LIGHT'])for(const family of ['medium','large']){
  const widget={};
  const run=new Function('Color','Rect','Size','DrawContext','widget','EFFECTIVE_THEME','applyFallbackGradient','console',
   source+'return {deepOceanCanvas,applyCoastalAtmosphere}')(Color,Rect,Size,DrawContext,widget,theme,
   ()=>{throw Error('unexpected fallback')},{warn:()=>{}});
  run.applyCoastalAtmosphere(family);
  assert.ok(widget.backgroundImage);
  const ops=widget.backgroundImage.ops,colors=new Set(ops.map(x=>x.hex));
  assert.ok(ops.length>2000);
  assert.ok(colors.size>30,'spatial blending invisible');
  assert.ok(ops.every(x=>x.hex.startsWith('#')),'invalid colour');
  assert.equal(ops.reduce((s,x)=>s+x.rect.w*x.rect.h,0),
   widget.backgroundImage.size.w*widget.backgroundImage.size.h);
 }
});
