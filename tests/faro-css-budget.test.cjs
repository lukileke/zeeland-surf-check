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
 assert.equal(sheets.at(-2).href,'faro-tide-read.css?v=9');
 assert.equal(sheets.at(-3).href,'faro-editorial-experience-v2.css?v=7');
 assert.ok(!sheets.some(x=>/@import\s/.test(x.css)),'Avoid hidden extra CSS requests');
});
test('explicit important budget cannot silently grow',()=>{
 const total=sheets.reduce((sum,x)=>sum+x.important,0);
 assert.ok(total<=5596,'CSS important debt increased: '+total+' > 5596. Refactor before adding priority overrides.');
 const bytes=sheets.reduce((sum,x)=>sum+x.bytes,0);
 assert.ok(bytes<=650000,'CSS payload exceeds the tightened 650 kB budget: '+bytes);
});
// File-level ownership budgets expose migrations that hide new priority rules
// behind an unrelated decrease elsewhere. Decrease each cap with each PR.
const priorityCaps=Object.freeze({
 'assets/faro-icons.css':1,'assets/faro-editorial-polish.css':9,
 'faro-core.css':382,'faro-ui.css':965,'faro-brand.css':560,
 'faro-daily.css':93,'faro-rhythm.css':343,'faro-colours.css':55,
 'faro-spot-signals.css':45,'faro-desktop.css':113,'faro-country.css':1,
 'chile/chile-forecast.css':116,'faro-spot-dna-editorial.css':91,
 'assets/faro-visual-system-v2.css':161,'assets/faro-coastal-lens-v4.css':344,
 'chile/chile-visual-contract.css':444,'chile/faro-editorial-experience-v2.css':1213,
 'chile/faro-tide-read.css':624,'chile/faro-score-colour-lock-v1.css':36
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

// Track real selector blocks, not regex fragments that mistake an @media block
// for a selector. Ignore comments while retaining original source offsets.
function findEmptyCssRules(raw){
 const css=raw.replace(/\/\*[\s\S]*?\*\//g,m=>' '.repeat(m.length));
 const stack=[],empty=[];let begin=0;
 for(let i=0;i<css.length;i++){
  if(css[i]==='{'){
   const head=css.slice(begin,i).trim();
   stack.push({head,contentStart:i+1});begin=i+1;
  }else if(css[i]==='}'){
   const b=stack.pop();
   if(b&&!b.head.startsWith('@')&&!css.slice(b.contentStart,i).includes('{')
      &&!css.slice(b.contentStart,i).replace(/[;\s]/g,'')){
    empty.push(b.head);
   }
   begin=i+1;
  }else if(css[i]===';'&&!stack.length)begin=i+1;
 }
 return empty;
}
test('loaded CSS has no empty selector blocks',()=>{
 for(const sheet of sheets){
  const empty=findEmptyCssRules(sheet.css);
  assert.equal(empty.length,0,'Empty CSS blocks in '+sheet.href+': '+empty.slice(0,4).join(' | '));
 }
});


// A deliberately conservative proxy for selector debt, not the full CSS
// specificity algorithm (:is/:where have special weights). These ceilings
// prevent new deep ancestor chains while older components are refactored.
const selectorComplexityCaps=Object.freeze({
 'assets/faro-editorial-polish.css':[0,2,0,0],
 'faro-ui.css':[2,0,0,2],'faro-brand.css':[2,5,0,2],
 'faro-daily.css':[0,3,0,0],'faro-rhythm.css':[0,3,0,0],
 'faro-colours.css':[1,4,0,1],'faro-desktop.css':[0,6,0,0],
 'chile/chile-forecast.css':[0,34,0,0],
 'faro-spot-dna-editorial.css':[0,42,0,0],
 'assets/faro-visual-system-v2.css':[3,6,0,3],
 'assets/faro-coastal-lens-v4.css':[3,1,0,3],
 'chile/chile-visual-contract.css':[1,55,0,1],
 'chile/faro-editorial-experience-v2.css':[101,55,108,100],
 'chile/faro-tide-read.css':[175,142,188,170],
 'chile/faro-score-colour-lock-v1.css':[10,13,7,10]
});
function splitCssSelectors(source){
 let depth=0,start=0;const result=[];
 for(let i=0;i<source.length;i++){
  if(source[i]==='('||source[i]==='[')depth++;
  else if(source[i]===')'||source[i]===']')depth--;
  else if(source[i]===','&&!depth){
   result.push(source.slice(start,i).trim());start=i+1;
  }
 }
 result.push(source.slice(start).trim());
 return result.filter(Boolean);
}
function countComplexSelectors(raw){
 const css=raw.replace(/\/\*[\s\S]*?\*\//g,m=>' '.repeat(m.length));
 let start=0;const stack=[];const counts=[0,0,0,0];
 for(let i=0;i<css.length;i++){
  if(css[i]==='{'){
   const head=css.slice(start,i).trim();
   stack.push({head,contentStart:i+1,at:head.startsWith('@')});start=i+1;
  }else if(css[i]==='}'){
   const block=stack.pop();
   if(block&&!block.at&&!css.slice(block.contentStart,i).includes('{')){
    const important=css.slice(block.contentStart,i).includes('!important');
    for(const sel of splitCssSelectors(block.head)){
     const ids=(sel.match(/#[a-zA-Z_-][\w-]*/g)||[]).length;
     const parts=sel.replace(/\([^)]*\)/g,' ').split(/[\s>+~]+/).filter(Boolean).length;
     if(parts>=6){counts[0]++;if(important)counts[3]++;}
     if(ids>=3)counts[1]++;
     if(/\bhtml\s+body\s+main\b/.test(sel))counts[2]++;
    }
   }
   start=i+1;
  }else if(css[i]===';'&&!stack.length)start=i+1;
 }
 return counts;
}
test('selector complexity cannot grow silently across CSS component owners',()=>{
 for(const sheet of sheets){
  const p=path.relative(root,path.resolve(root,'chile',sheet.href.split('?')[0])).replaceAll('\\','/');
  const actual=countComplexSelectors(sheet.css);
  const caps=selectorComplexityCaps[p]||[0,0,0,0];
  for(let i=0;i<caps.length;i++){
   assert.ok(actual[i]<=caps[i],
    p+' complexity '+['deep selector','3+ IDs','html/body/main chain','deep important selector'][i]+
    ' increased: '+actual[i]+' > '+caps[i]+'. Consolidate owner rules instead of new overrides.');
  }
 }
});

test('Chile script dependencies load in order without blocking HTML parsing',()=>{
 const all=[...page.matchAll(/<script\s+src="([^"]+\.js\?v=\d+)"([^>]*)><\/script>/g)];
 assert.ok(all.length>=16,'Expected all model and UI modules');
 assert.ok(all.every(match=>/\bdefer\b/.test(match[2])),
  'All external classic scripts should load deferred and preserve source order');
 const names=all.map(x=>x[1]);
 assert.ok(names.findIndex(x=>x.includes('faro-chile-live.js'))<
  names.findIndex(x=>x.includes('chile-forecast.js')),
  'The model adapter must register before the controller');
 assert.ok(names.findIndex(x=>x.includes('chile-forecast.js'))<
  names.findIndex(x=>x.includes('faro-tide-read.js')),
  'UI enhancement must run after core controller registration');
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
