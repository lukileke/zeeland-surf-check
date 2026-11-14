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
 assert.equal(sheets.at(-2).href,'faro-tide-read.css?v=6');
 assert.equal(sheets.at(-3).href,'faro-editorial-experience-v2.css?v=4');
 assert.ok(!sheets.some(x=>/@import\s/.test(x.css)),'Avoid hidden extra CSS requests');
});
test('explicit important budget cannot silently grow',()=>{
 const total=sheets.reduce((sum,x)=>sum+x.important,0);
 assert.ok(total<=7540,'CSS important debt increased: '+total+' > 7540. Refactor before adding priority overrides.');
 const bytes=sheets.reduce((sum,x)=>sum+x.bytes,0);
 assert.ok(bytes<=700000,'CSS payload grew past 700 kB: '+bytes);
});
// File-level ownership budgets expose migrations that hide new priority rules
// behind an unrelated decrease elsewhere. Decrease each cap with each PR.
const priorityCaps=Object.freeze({
 'assets/faro-icons.css':1,'assets/faro-editorial-polish.css':9,
 'faro-core.css':526,'faro-ui.css':1212,'faro-brand.css':667,
 'faro-daily.css':228,'faro-rhythm.css':388,'faro-colours.css':55,
 'faro-spot-signals.css':55,'faro-desktop.css':123,'faro-country.css':1,
 'chile/chile-forecast.css':183,'faro-spot-dna-editorial.css':120,
 'assets/faro-visual-system-v2.css':186,'assets/faro-coastal-lens-v4.css':415,
 'chile/chile-visual-contract.css':764,'chile/faro-editorial-experience-v2.css':1742,
 'chile/faro-tide-read.css':829,'chile/faro-score-colour-lock-v1.css':36
});
test('every CSS owner has a hard priority ceiling; do not shift debt between files',()=>{
 assert.equal(sheets.length,Object.keys(priorityCaps).length);
 for(const sheet of sheets){
  const p=path.relative(root,path.resolve(root,'chile',sheet.href.split('?')[0])).replaceAll('\\','/');
  assert.ok(Object.hasOwn(priorityCaps,p),'Unexpected CSS owner: '+p);
  assert.ok(sheet.important<=priorityCaps[p],
   p+' grew from '+priorityCaps[p]+' to '+sheet.important+' !important rules; refactor this owner');
 }
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
