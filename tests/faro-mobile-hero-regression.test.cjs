/* FARO iPhone visual-order regression.
 * Run: node --test tests/faro-mobile-hero-regression.test.cjs
 *
 * This checks the exact DOM/CSS-specificity failure behind the November 2
 * regression, including dark/light parity and reduced-motion guarantees.
 * Static checks do not substitute for a rendered iOS Safari screenshot.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('chile/index.html');
const css=read('chile/faro-mobile-reading-order-v1.css');
const originalHero=read('chile/faro-beacon-atmosphere-v4.css');
const pulse=read('chile/faro-hero-synchronised-pulse-v1.css');
const editor=read('chile/faro-editorial-experience-v2.css');

test('the hero remains ahead of dayview, and the real footer ends the page',()=>{
 const a=html.indexOf('id="faroForecastLead"');
 const b=html.indexOf('id="dayview"');
 const c=html.indexOf('id="faroSiteFooter"');
 assert.ok(a>=0 && a<b && b<c);
 assert.ok(!html.includes('class="faro-footer-bridge"'));
 assert.ok(editor.includes('>.faro-forecast-lead{order:1!important'));
});

test('mobile iPhone prioritises hero and keeps beach selection usable below it',()=>{
 assert.match(css,/@media\(max-width:710px\)/);
 for(const [selector,order] of [
  ['.faro-forecast-lead',0],['.faro-context-dock',1],
  ['.faro-access-notice',2],['.faro-journey-nav',3],
  ['#dayview',4],['.chile-method-disclaimer',5]
 ]){
  const sel=selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re=new RegExp(sel+'\\s*\\{\\s*order:'+order+'!important');
  assert.match(css,re,'mobile flex order '+selector);
 }
 for(const id of ['chileSpotSelect','chileSpotButton','chileSpotOptions'])
  assert.equal(html.split('id="'+id+'"').length,2);
 assert.match(css,/\.picker-grid\s*>\s*\.chile-spot-picker:first-child\s*\{/);
});

test('high-specificity theme-symmetric variables defeat desktop optical centre',()=>{
 assert.match(originalHero,/--beacon-y:51%/);
 assert.match(originalHero,/--beacon-size:clamp\(130px,10\.4vw,165px\)/);
 assert.match(css,/html\[data-theme="light"\] body main #forecastPage:not\(\.hide\)/);
 assert.match(css,/html:not\(\[data-theme="light"\]\) body main #forecastPage:not\(\.hide\)/);
 assert.match(css,/--beacon-y:8%/);
 assert.match(css,/--beacon-x:87%/);
 assert.match(css,/--beacon-size:clamp\(64px,18vw,80px\)/);
 assert.match(css,/@media\(max-width:370px\)/);
});

test('underwater pulse is kept and WebKit shadow seam is not reintroduced',()=>{
 assert.doesNotMatch(css,/faro-deep-ocean-pulse 6\.4s/);
 assert.ok(pulse.includes('animation:faro-hero-core-breathe 5.4s ease-in-out 0s infinite both!important'));
 assert.ok(pulse.includes('-webkit-animation:faro-hero-core-breathe 5.4s ease-in-out 0s infinite both!important'));
 assert.match(css,/filter:blur\(2px\)!important/);
 assert.doesNotMatch(css,/drop-shadow\(/);
 assert.match(css,/@media\(max-width:710px\) and \(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none!important/);
});

test('new CSS is before the invariant score palette, with no model changes',()=>{
 const links=[...html.split('</head>')[0].matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(links.at(-1),'faro-score-colour-lock-v1.css?v=1');
 assert.equal(links.at(-2),'faro-tide-read.css?v=4');
 assert.equal(links.at(-3),'faro-decision-balance-v1.css?v=1');
 assert.equal(links.at(-4),'faro-responsive-quality-v1.css?v=1');
 assert.equal(links.at(-5),'faro-editorial-hero-focus-v1.css?v=1');
 assert.ok(links.includes('faro-editorial-experience-v2.css?v=3'));
 assert.ok(!links.includes('faro-hero-synchronised-pulse-v1.css?v=1'));
 assert.ok(!links.includes('faro-mobile-reading-order-v1.css?v=2'));
 assert.ok(!links.includes('faro-finish-pass-v1.css?v=1'));
 assert.ok(editor.includes('@keyframes faro-hero-core-breathe'));
 assert.ok(editor.includes('--beacon-y:8%'));
 assert.ok(!/--faro-score-[0-4]:|--brand-score-ink:/.test(css));
 assert.ok(html.includes('faro-beacon-atmosphere-v4.css?v=1'));
 assert.ok(html.includes('faro-chile-live.js?v=11'));
 assert.ok(html.includes('chile-forecast.js?v=46'));
});

test('five decorative layers share one 5.4-second peak at half-cycle',()=>{
 const layers=['water','halo','core','beam','mark'];
 for(const layer of layers){
  assert.ok(pulse.includes('@keyframes faro-hero-'+layer+'-breathe'));
  assert.ok(pulse.includes('animation:faro-hero-'+layer+'-breathe 5.4s ease-in-out 0s infinite both!important'));
 }
 const keys=pulse.split('@keyframes faro-hero-').slice(1);
 assert.equal(keys.length,5);
 assert.ok(keys.every(k=>k.includes('50%')));
 assert.doesNotMatch(pulse,/drop-shadow/);
 assert.ok(!pulse.includes('--brand-score-ink:'));
 assert.ok(!pulse.includes('html[data-theme'));
});
test('iPhone halo is no longer opacity-locked; all five layers stop for reduced motion',()=>{
 assert.ok(css.includes('opacity:.77; /* let synchronised keyframes modulate luminance */'));
 assert.ok(pulse.includes('@media(prefers-reduced-motion:reduce)'));
 assert.ok(pulse.includes('animation:none!important'));
 assert.ok(pulse.includes('-webkit-animation:none!important'));
 for(const selector of ['::before','::after','.faro-beacon-pulse','.faro-beacon-light','.faro-lead-signature'])
  assert.ok(pulse.includes(selector));
});
