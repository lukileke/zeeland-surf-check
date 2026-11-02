/* FARO Deep Ocean hero regression checks. Run: node --test tests/*.test.cjs
 * Static checks complement, but do not replace, Safari screenshot QA.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('chile/index.html');
const css=read('chile/faro-beacon-atmosphere-v4.css');
const ctl=read('chile/chile-forecast.js');
const live=read('chile/faro-chile-live.js');

test('both page themes use one Deep Ocean hero palette',()=>{
 assert.match(css,/html\[data-theme="light"\] #forecastPage > \.faro-forecast-lead,\s*html:not\(\[data-theme="light"\]\) #forecastPage > \.faro-forecast-lead/);
 assert.match(css,/--faro-lead-text:#f4faf7/);
 assert.match(css,/background:[\s\S]*?linear-gradient\(118deg,#123a40/);
});
test('original header mark is unchanged; one authentic beacon has one pulse',()=>{
 assert.match(html,/src="\.\.\/assets\/faro-logo\.svg"/);
 assert.match(html,/src="\.\.\/assets\/faro-logo-dark\.svg"/);
 assert.equal((html.match(/class="faro-beacon-symbol"/g)||[]).length,1);
 assert.equal((html.match(/class="faro-beacon-pulse"/g)||[]).length,1);
 assert.match(html,/href="faro-beacon-atmosphere-v4\.css\?v=1"/);
});
test('iPhone pulse does not animate an SVG shadow filter and respects reduced motion',()=>{
 assert.match(css,/@-webkit-keyframes faro-deep-ocean-pulse/);
 assert.match(css,/@keyframes faro-deep-ocean-pulse/);
 assert.match(css,/-webkit-animation:faro-deep-ocean-pulse 6\.4s/);
 assert.match(css,/@media\(max-width:710px\)/);
 assert.match(css,/-webkit-filter:blur\(1\.8px\)/);
 assert.doesNotMatch(css,/drop-shadow\(/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none!important/);
});
test('HTTP 503 does not create fictional scores or masquerade as a bad surf day',()=>{
 assert.match(live,/\[502,503,504\]\.includes\(status\)/);
 assert.match(ctl,/state\.loadFailed=true;renderLead\(null,null\)/);
 assert.match(ctl,/Sin datos válidos no se calcula ni se inventa un score/);
 assert.match(ctl,/No existe una franja elegible/);
 assert.match(ctl,/ok\(displayScore\)\?num\(displayScore\):"—"/);
});
