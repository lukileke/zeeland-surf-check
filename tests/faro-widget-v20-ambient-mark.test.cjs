/* FARO v21: the data tile is an instrument, not a second illustration.
 * Legacy filename keeps GitHub workflow compatibility.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'..','zeeland-widget.js'),'utf8');

test('v21 leaves a single genuine brand mark in the header',()=>{
 assert.match(script,/Coastal Signal Editorial v21/);
 assert.ok(script.includes('ORIGINAL_FARO_SVG'));
 assert.ok(script.includes('const LOGO_MODE='));
 assert.ok(!script.includes('FARO_AMBIENT_MARK_IMAGE'));
 assert.ok(!script.includes('loadFaroAmbientMark'));
 assert.ok(!script.includes('wave.backgroundImage='));
 assert.ok(!script.includes('widget.backgroundImage='));
});

test('the medium and large retain the stable native gradient',()=>{
 assert.ok(script.includes('widget.backgroundGradient=nativeTideGradient()'));
 assert.ok(script.includes('gradient.locations=[0,.31,.68,1]'));
 assert.ok(script.includes('applyCoastalAtmosphere("medium")'));
 assert.ok(script.includes('applyCoastalAtmosphere(family)'));
 assert.ok(script.includes('new Color("#286B69")'));
 assert.ok(script.includes('new Color("#1C4045",.53)'));
 assert.ok(script.includes('wave:palette("#286F86","#ACDBD3")'));
});

test('the wave tile is a translucent readable surface without extra artwork',()=>{
 const a=script.indexOf('function editorialHero('),b=script.indexOf('function vibeRibbon(',a);
 const panel=script.slice(a,b);
 assert.ok(panel.includes('wave.backgroundColor='));
 assert.ok(panel.includes('wave.borderColor='));
 assert.ok(panel.includes('OLEAJE BAJO · MODELO'));
 assert.ok(panel.includes('best.x.h.toFixed(1)+" m"'));
 assert.ok(panel.includes('best.x.period.toFixed(1)+" s'));
 assert.ok(!panel.includes('addImage('));
});

test('model logic, safety labelling and colour contract remain',()=>{
 assert.doesNotThrow(()=>new (async()=>{}).constructor(script));
 assert.ok(script.includes('RIESGO VIENTO · 48 H'));
 assert.ok(script.includes('const best=sessions[0],hazard=modelHazard(data)'));
 assert.ok(script.includes('Script.setWidget(widget)'));
 for(const hex of ['#ef9b77','#efbd6e','#e0cc73','#b1d574','#8cc584'])
  assert.ok(script.includes(hex));
});
