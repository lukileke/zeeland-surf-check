/* FARO Chile CSS governance.
 * Baseline independently measured on 2026-11-15. Run: node --test tests/faro-css-budget.test.cjs
 * Protect architecture without rewriting global styles shared with Zeeland.
 */
const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path');
const root=path.resolve(__dirname,'..'),page=fs.readFileSync(path.join(root,'chile/index.html'),'utf8');
const links=[...page.split('</head>')[0].matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+\.css(?:\?[^"]*)?)"/g)].map(m=>m[1]);
const sheets=links.map(href=>{
 const filename=path.resolve(root,'chile',href.split('?')[0]);
 assert.ok(filename.startsWith(root+path.sep),'CSS URL escapes repository');
 const css=fs.readFileSync(filename,'utf8');
 return {href,css,important:(css.match(/!important/g)||[]).length,bytes:Buffer.byteLength(css)};
});
const get=p=>fs.readFileSync(path.join(root,'chile',p),'utf8');
test('only 19 CSS files in Chile; invariant score palette is the last sheet',()=>{
 assert.equal(sheets.length,19,'The 2026-11-15 CSS request budget regressed');
 assert.equal(sheets.at(-1).href,'faro-score-colour-lock-v1.css?v=1');
 assert.equal(sheets.at(-2).href,'faro-tide-read.css?v=5');
 assert.equal(sheets.at(-3).href,'faro-editorial-experience-v2.css?v=4');
 assert.ok(!sheets.some(x=>/@import\s/.test(x.css)),'Avoid hidden extra CSS requests');
});
test('explicit important budget cannot silently grow',()=>{
 const total=sheets.reduce((sum,x)=>sum+x.important,0);
 assert.ok(total<=7634,'CSS important debt increased: '+total+' > 7634. Refactor before adding priority overrides.');
 const bytes=sheets.reduce((sum,x)=>sum+x.bytes,0);
 assert.ok(bytes<=700000,'CSS payload grew past 700 kB: '+bytes);
});
test('component ownership and model colour isolation survive consolidation',()=>{
 const skin=get('faro-editorial-experience-v2.css'),read=get('faro-tide-read.css');
 const skinSources=['faro-coastal-editorial-v3.css','faro-brand-refresh-v1.css',
  'faro-responsive-safety-v3.css','faro-beacon-atmosphere-v4.css','faro-editorial-experience-v2.css'];
 const readSources=['faro-editorial-hero-focus-v1.css','faro-responsive-quality-v1.css',
  'faro-decision-balance-v1.css','faro-tide-read.css'];
 for(const [css,sources]of [[skin,skinSources],[read,readSources]]){
  const starts=sources.map(s=>css.indexOf('FARO source: chile/'+s));
  assert.ok(starts.every((v,i)=>v>=0&&(i===0||v>starts[i-1])),
   'Component cascade order changed: '+sources.join(','));
 }
 assert.ok(!/--faro-score-[0-4]\s*:|--brand-score-ink\s*:/.test(skin+read),
  'Component owners cannot define canonical numerical score colours');
});
