/* FARO editorial UX: wave-height readout, clean direction arrows and readable regional comparison.
 * Source contracts complement, but do not replace, browser/device accessibility QA. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.resolve(__dirname,'..',file),'utf8');
const hud=read('chile/coast-map.js');
const app=read('chile/chile-forecast.js');
const styles=read('assets/faro-coastal-lens-v4.css');
const html=read('chile/index.html');
test('HUD arrow is a single clean geometric family, no flourished secondary tails',()=>{
 assert.match(hud,/path\.setAttribute\("d","M9\.5 11 L14 6\.5 L18\.5 11 M14 6\.5 L14 22"\)/);
 assert.match(hud,/stroke-width",kind==="swell"\?"2\.2":"1\.65"/);
 assert.match(hud,/stroke-linecap","round"/);
 assert.match(hud,/stroke-linejoin","round"/);
 assert.doesNotMatch(hud,/M7 22 Q10 20\.6/);
 assert.doesNotMatch(hud,/M8\.3 15\.4 L12\.1/);
});
test('regional markers communicate S/W in text and shape, not naked coloured dashes',()=>{
 assert.match(hud,/micro\.textContent=kind==="swell"\?"S":"W"/);
 assert.match(hud,/micro\.dataset\.fit=status/);
 assert.match(hud,/base\.setAttribute\("aria-label",\(spot\.shortName/);
 assert.match(styles,/\.faro-region-fit-tick\.is-wind\{[\s\S]*?border-style:dashed/);
 assert.match(styles,/\.faro-region-fit-tick\{[\s\S]*?font:850 9px/);
});
test('wave ruler is informational and never visually advertises dragging',()=>{
 assert.match(app,/function waveBars\(h\)/);
 assert.match(app,/gauge\.setAttribute\("role","img"\)/);
 assert.match(app,/Math\.max\(0,Math\.min\(1,h\/2\)\)/);
 assert.match(app,/faro-wave-ruler-labels/);
 assert.match(app,/faro-wave-ruler-caption/);
 assert.doesNotMatch(app,/faro-gauge-position/);
 assert.match(styles,/cursor:default!important;user-select:none/);
 assert.doesNotMatch(styles,/\.faro-gauge-position/);
});
test('selected-window potential and wave read are a single cohesive two-column module',()=>{
 assert.match(app,/chile-session-head faro-session-instrument/);
 assert.match(app,/ALTURA EN MAR ABIERTO/);
 assert.match(app,/POTENCIAL · GUÍA \+ MODELO/);
 assert.match(styles,/\.session-section \.chile-session-head\.faro-session-instrument\{/);
 assert.match(styles,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
 assert.match(styles,/\.chile-session-rating\{[\s\S]*?border-right:1px solid/);
 assert.match(styles,/@media\(max-width:640px\)/);
 assert.match(styles,/grid-template-columns:minmax\(0,1fr\)!important/);
});
test('the product still clearly distinguishes model reading from observed breaking surf',()=>{
 assert.match(app,/not the breaking wave/);
 assert.match(app,/Experimental cap/);
 assert.match(hud,/not observed surf quality/);
 assert.match(html,/faro-coastal-lens-v4\.css\?v=10/);
 assert.match(html,/coast-map\.js\?v=15/);
 assert.match(html,/chile-forecast\.js\?v=21/);
});
