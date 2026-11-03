/* FARO Native Tide v19: prevent the literal-black backdrop regression.
 * Run node --test tests/faro-widget-v18.test.cjs
 * Scriptable API is simulated. Actual device preview is a separate check.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');

test('v19 source is valid and stays eligible for existing GitHub auto-updater',()=>{
 assert.match(source,/Native Tide Editorial v19/);
 assert.doesNotThrow(()=>new (async()=>{}).constructor(source));
 for(const token of ['// FARO Widget','Script.setWidget(widget)','Script.complete()',
   'const SITE="https://lukileke.github.io/zeeland-surf-check/"'])assert.ok(source.includes(token));
});
test('a native gradient is the ONLY medium/large background',()=>{
 const a=source.indexOf('/* FARO Native Tide v19'),b=source.indexOf('function label(',a);
 assert.ok(a>0&&b>a);
 const backdrop=source.slice(a,b);
 assert.ok(backdrop.includes('widget.backgroundGradient=nativeTideGradient()'));
 assert.ok(backdrop.includes('gradient.locations=[0,.31,.68,1]'));
 assert.ok(!backdrop.includes('new DrawContext()'));
 assert.ok(!source.includes('widget.backgroundImage='));
 assert.ok(!source.includes('widget.backgroundImage ='));
});
test('native Scriptable APIs receive valid sea-coloured stops and points in both themes',()=>{
 const a=source.indexOf('function nativeTideGradient()');
 const b=source.indexOf('function label(',a);
 const part=source.slice(a,b);
 class Color{constructor(hex){this.hex=hex}}
 class Point{constructor(x,y){this.x=x;this.y=y}}
 class LinearGradient{constructor(){this.colors=[];this.locations=[]}}
 for(const theme of ['DARK','LIGHT']){
  const widget={};
  const make=new Function('Color','Point','LinearGradient','widget','EFFECTIVE_THEME','console',
    part+'return {nativeTideGradient,applyCoastalAtmosphere};')(
      Color,Point,LinearGradient,widget,theme,{warn:()=>{}});
  make.applyCoastalAtmosphere('medium');
  assert.ok(widget.backgroundGradient,'native gradient not assigned');
  const g=widget.backgroundGradient;
  assert.deepEqual(g.locations,[0,.31,.68,1]);
  assert.equal(g.colors.length,4);
  assert.equal(g.startPoint.x,0);
  assert.equal(g.endPoint.x,1);
  assert.equal(g.endPoint.y,.9);
  assert.ok(g.colors.every(c=>/^#[0-9A-Fa-f]{6}$/.test(c.hex)));
  assert.ok(!('backgroundImage' in widget),'raster has been reintroduced');
  if(theme==='DARK'){
   assert.equal(g.colors[0].hex,'#0E282E');
   assert.equal(g.colors[3].hex,'#286B69');
  }else{
   assert.equal(g.colors[0].hex,'#F1F9F6');
   assert.equal(g.colors[3].hex,'#BEDFD7');
  }
 }
});
test('meaning, scores, warning horizon and fallback remain intact',()=>{
 for(const ink of ['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'])
  assert.ok(source.includes(ink));
 for(const phrase of ['RIESGO VIENTO · 48 H','ORIGINAL_FARO_SVG',
   'applyCoastalAtmosphere("medium")','applyCoastalAtmosphere(family)',
   'if(family==="small"||lockFamily)applyFallbackGradient()'])
  assert.ok(source.includes(phrase),phrase);
});
