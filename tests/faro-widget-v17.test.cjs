/* FARO Ambient Mark v20: bilingual, physical meaning, visual restraint.
 * Run node --test tests/faro-widget-v17.test.cjs
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const widget=fs.readFileSync(path.join(root,'zeeland-widget.js'),'utf8');
const webScore=fs.readFileSync(path.join(root,'assets/faro-visual-system-v2.css'),'utf8');
const loader=fs.readFileSync(path.join(root,'FARO_AUTO_WIDGET.js'),'utf8');

test('Scriptable async syntax and GitHub hot-loader eligibility',()=>{
 assert.doesNotThrow(()=>new (async function(){}).constructor(widget));
 assert.match(widget,/Coastal Signal Editorial v21/);
 for(const item of ['// FARO Widget','Script.setWidget(widget)','Script.complete()',
  'const SITE="https://lukileke.github.io/zeeland-surf-check/"'])
  assert.ok(widget.includes(item),item);
 assert.ok(loader.includes('zeeland-widget.js'));
});
test('owner Spanish is default; explicit English overrides with EN or LANG=EN',()=>{
 const from=widget.indexOf('const param=');
 const to=widget.indexOf('const fm=',from);
 assert.ok(from>0&&to>from);
 const header=widget.slice(from,to);
 const evaluate=p=>new Function('args','config','SPOTS',
  header+';return {LANG,STYLE,THEME,family};')(
    {widgetParameter:p},{widgetFamily:'medium'},
    [['Domburg','Noordduine',51.566,3.489,325,0]]
  );
 assert.equal(evaluate('BEST').LANG,'es');
 assert.equal(evaluate('BEST|ES|STYLE=FLOW').LANG,'es');
 assert.equal(evaluate('BEST|EN|STYLE=FLOW').LANG,'en');
 assert.equal(evaluate('BEST|LANG=EN').LANG,'en');
 assert.equal(evaluate('').LANG,'es');
 assert.equal(evaluate('BEST|ES|STYLE=FLOW').STYLE,'FLOW');
});
test('the five meter pigments match numerical FARO inks exactly',()=>{
 const expected=['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'];
 const start=widget.indexOf('function qualityStepInk(');
 const end=widget.indexOf('\nfunction meter(',start);
 const portion=widget.slice(start,end);
 for(let i=0;i<expected.length;i++){
  assert.ok(portion.includes(expected[i]),expected[i]);
  assert.ok(webScore.toLowerCase().includes(expected[i]),'website missing '+expected[i]);
 }
 assert.match(widget,/i===active-1\?2:0/);
});
test('risk labels clearly distinguish the NEXT 48 H from the selected 7-day window',()=>{
 const start=widget.indexOf('function hazardLine('),end=widget.indexOf('\nfunction freshness(',start);
 const frag=widget.slice(start,end);
 assert.ok(frag.includes('48 H'));
 assert.ok(frag.includes('WIND RISK'));
 assert.ok(frag.includes('RIESGO VIENTO'));
 assert.ok(frag.includes('maxWind'));
 assert.ok(!frag.includes('T.risk+" · "'));
 assert.ok(widget.includes('const best=sessions[0],hazard=modelHazard(data)'));
 assert.ok(widget.includes('const toDate=new Date(nowMs+48*3600000)'));
});
test('small offshore wave height is labelled explicitly; model figures unchanged',()=>{
 assert.ok(widget.includes('best.x.h<.45?word("OLEAJE BAJO · MODELO","SMALL SWELL · MODEL")'));
 assert.ok(widget.includes('best.x.h.toFixed(1)+" m"'));
 assert.ok(widget.includes('best.x.period.toFixed(1)+" s'));
 assert.ok(widget.includes('best.x.wind+" km/h"'));
 assert.ok(widget.includes('globalThis.ZeelandEngine'));
});
test('native ocean identity is present with no raster background',()=>{
 const from=widget.indexOf('/* FARO Native Tide v19');
 const to=widget.indexOf('function label(',from);
 const background=widget.slice(from,to);
 assert.ok(background.includes('new LinearGradient()'));
 assert.ok(background.includes('widget.backgroundGradient=nativeTideGradient()'));
 assert.ok(background.includes('gradient.startPoint=new Point(0,0)'));
 assert.ok(background.includes('gradient.endPoint=new Point(1,.9)'));
 for(const invalid of ['drawRescueRing','new DrawContext()','widget.backgroundImage=','setInterval(','drop-shadow'])
  assert.ok(!background.includes(invalid),invalid);
 assert.ok(widget.includes('if(family==="small"||lockFamily)applyFallbackGradient()'));
 assert.ok(widget.includes('ORIGINAL_FARO_SVG'));
});
