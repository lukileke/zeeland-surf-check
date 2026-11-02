/* FARO scoring invariant: the five canonical pigments are theme-independent.
 * Run: node --test tests/faro-score-palette-parity.test.cjs
 * Static contract tests; a browser screenshot is still desirable for QA.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const html=read('chile/index.html');
const scoreLock=read('chile/faro-score-colour-lock-v1.css');
const canonical=read('assets/faro-visual-system-v2.css');
const controller=read('chile/chile-forecast.js');
const bands=['verylow','low','mid','regular','high'];

test('FARO quality has exactly one shared set of five colour tokens',()=>{
 const values=bands.map((band,i)=>{
  const m=canonical.match(new RegExp('--faro-score-'+i+':(#[0-9a-fA-F]{6})'));
  assert.ok(m,'missing canonical score band '+band);
  return m[1].toLowerCase();
 });
 assert.equal(new Set(values).size,5,'score pigment collisions');
 assert.doesNotMatch(scoreLock,/#[0-9a-fA-F]{3,8}\b/,'colour lock must not create a second palette');
});

test('each band maps to the identical token regardless of theme',()=>{
 for(const [i,band] of bands.entries()){
  const selector='html :is(#forecastPage,#bestPage,#boardPage) .brand-band-'+band;
  const start=scoreLock.indexOf(selector);
  assert.ok(start>=0,'missing score band '+band);
  const next=scoreLock.slice(start,start+220);
  assert.ok(next.includes('--brand-score-color:var(--faro-score-'+i+')!important'));
  assert.ok(next.includes('--brand-score-ink:var(--faro-score-'+i+')!important'));
 }
 assert.doesNotMatch(scoreLock,/html\[data-theme=["']light["']\]/);
 assert.doesNotMatch(scoreLock,/html\[data-theme=["']dark["']\]/);
});

test('numbers in days, hourly slots, weekly rankings and hero share one ink',()=>{
 const selectors=[
  '.chile-chip-number','.chile-slot-score','.chile-session-score',
  '.chile-rank-score','#faroLeadScore'
 ];
 for(const selector of selectors)
  assert.ok(scoreLock.includes(selector),'missing score component '+selector);
 assert.match(scoreLock,/color:var\(--brand-score-ink\)!important/);
 assert.match(scoreLock,/border-top-color:var\(--brand-score-color\)!important/);
 assert.match(scoreLock,/\.is-unavailable #faroLeadScore/);
 assert.match(controller,/const band=n=>!ok\(n\)/);
});

test('palette lock is the final stylesheet, after every competing visual layer',()=>{
 const head=html.split('</head>')[0];
 const matches=[...head.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)];
 assert.ok(matches.length>0);
 assert.equal(matches.at(-1)[1],'faro-score-colour-lock-v1.css?v=1');
 assert.ok(head.indexOf('faro-score-colour-lock-v1.css')>head.indexOf('faro-beacon-atmosphere-v4.css'));
});
