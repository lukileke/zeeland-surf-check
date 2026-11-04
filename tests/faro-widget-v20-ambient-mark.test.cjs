/* FARO v20: the original O is only a faint local watermark; no widget root bitmap.
 * Run: node --test tests/faro-widget-v20-ambient-mark.test.cjs
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');

const official=(()=>{
 const start=script.indexOf('const ORIGINAL_FARO_SVG=');
 const end=script.indexOf(';',start);
 assert.ok(start>=0&&end>start);
 return new Function(script.slice(start,end+1)+';return ORIGINAL_FARO_SVG')();
})();
function mockMark(family='medium',theme='DARK'){
 const source=script.slice(
  script.indexOf('async function loadFaroAmbientMark(){'),
  script.indexOf('/* Match the five FARO numeric score bands')
 );
 assert.ok(source.startsWith('async function loadFaroAmbientMark(){'));
 const cache=new Map();
 const info={viewCount:0,svg:null,writes:0};
 const fm={
  joinPath:(a,b)=>a+'/'+b,cacheDirectory:()=>'/cache',
  fileExists:p=>cache.has(p),readImage:p=>cache.get(p),
  writeImage:(p,img)=>{info.writes++;cache.set(p,img)}
 };
 class WebView{
  constructor(){info.viewCount++}
  async loadHTML(){}
  async evaluateJavaScript(js){
   const m=js.match(/im\.src=("data:image\/svg\+xml[^\n]*");/);
   assert.ok(m,'webview must set SVG image src');
   const uri=JSON.parse(m[1]);
   info.svg=decodeURIComponent(uri.slice('data:image/svg+xml;charset=utf-8,'.length));
   return 'data:image/png;base64,ZmFrZQ==';
  }
 }
 const Data={fromBase64String:x=>x};
 const Image={fromData:x=>({image:'PNG',payload:x})};
 const log=[];
 const func=new Function('family','lockFamily','fm','LOGO_MODE',
  'ORIGINAL_FARO_SVG','EFFECTIVE_THEME','WebView','Image','Data','console',
  source+'return loadFaroAmbientMark')(
   family,family.startsWith('accessory'),fm,theme==='LIGHT'?'light':'dark',official,theme,
   WebView,Image,Data,{warn:x=>log.push(x)});
 return {load:func,info,cache,log};
}

test('official logo is reused with four matching original O paths',async()=>{
 const m=mockMark();
 const result=await m.load();
 assert.equal(result.image,'PNG');
 assert.equal(m.info.viewCount,1);
 assert.equal(m.info.writes,1);
 assert.ok(m.info.svg.includes('radialGradient'));
 assert.ok(m.info.svg.includes('fill="#C5E9DF"'));
 assert.ok(m.info.svg.includes('opacity=".15"'));
 const paths=[...m.info.svg.matchAll(/<path d="([^"]+)"\/>/g)];
 const originalPaths=[...official.dark.matchAll(/<path d="([^"]+)"\/>/g)];
 assert.equal(paths.length,4);
 assert.deepEqual(paths.map(x=>x[1]),originalPaths.slice(-4).map(x=>x[1]));
 assert.ok(m.info.svg.includes('opacity=".12"')); // golden O centre
 assert.equal(m.log.length,0);
 const again=await m.load();
 assert.deepEqual(again,result);
 assert.equal(m.info.viewCount,1,'cached artwork avoids repeated WebViews');
});

test('dark and light are subdued; small accessories skip logo work',async()=>{
 const light=mockMark('large','LIGHT');
 await light.load();
 assert.ok(light.info.svg.includes('fill="#28776F"'));
 assert.ok(light.info.svg.includes('opacity=".17"'));
 for(const family of ['small','accessoryRectangular']){
  const skipped=mockMark(family);
  const result=await skipped.load();
  assert.equal(result,null);
  assert.equal(skipped.info.viewCount,0);
 }
});

test('the official O watermark cannot replace global native widget background',()=>{
 assert.ok(script.includes('widget.backgroundGradient=nativeTideGradient()'));
 assert.ok(script.includes('wave.backgroundImage=FARO_AMBIENT_MARK_IMAGE'));
 assert.ok(!script.includes('widget.backgroundImage='));
 assert.ok(!script.includes('widget.backgroundImage ='));
 const panel=script.slice(script.indexOf('function editorialHero('),script.indexOf('function vibeRibbon('));
 assert.ok(panel.includes('if(FARO_AMBIENT_MARK_IMAGE)'));
 assert.ok(panel.includes('try{wave.backgroundImage=FARO_AMBIENT_MARK_IMAGE}'));
 assert.ok(panel.includes('catch(e){console.warn("FARO wave mark fallback: "'));
});

test('Scriptable source remains current, valid and model calculations untouched',()=>{
 assert.match(script,/Ambient Mark Editorial v20/);
 assert.doesNotThrow(()=>new (async()=>{}).constructor(script));
 assert.ok(script.includes('FARO_AMBIENT_MARK_IMAGE=await loadFaroAmbientMark()'));
 assert.ok(script.includes('const best=sessions[0],hazard=modelHazard(data)'));
 assert.ok(script.includes('Script.setWidget(widget)'));
 for(const ink of ['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'])
  assert.ok(script.includes(ink));
});
