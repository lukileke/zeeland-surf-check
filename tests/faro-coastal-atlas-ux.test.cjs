/* FARO coastal atlas design contract: no visual overload or fictitious
   regional wave rays. Does not substitute real-device visual QA. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const file=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const map=file('chile/coast-map.js'),css=file('assets/faro-coastal-lens-v4.css');
const html=file('chile/index.html');

test('default region does not create any offshore model source marker',()=>{
 assert.match(map,/showSamples=false/);
 assert.match(map,/const displayMarine=mapView==="region"&&showSamples&&mode!=="wind"/);
 assert.match(map,/const displayWind=mapView==="region"&&showSamples&&mode!=="swell"/);
 assert.match(map,/if\(displayMarine&&deg\(grid\?\.lat\)&&deg\(grid\?\.lon\)\)/);
 assert.match(map,/if\(displayWind&&deg\(atmosphere\?\.lat\)&&deg\(atmosphere\?\.lon\)\)/);
 assert.match(map,/map\.removeLayer\(modelGridMarker\);modelGridMarker=null/);
 assert.match(map,/map\.removeLayer\(windGridMarker\);windGridMarker=null/);
 assert.doesNotMatch(map,/modelGridMarker\.setOpacity\(/);
 assert.doesNotMatch(map,/windGridMarker\.setOpacity\(/);
});
test('opt-in model sources are quiet cartographic labels, not colourful arrow bubbles',()=>{
 assert.match(map,/function modelSampleIcon\(L,kind\)/);
 assert.match(map,/className="faro-model-sample"/);
 assert.match(map,/kind==="marine"\?"M":"A"/);
 assert.doesNotMatch(map,/function modelGridIcon\(/);
 assert.doesNotMatch(map,/function windGridIcon\(/);
 assert.doesNotMatch(map,/className="faro-lens-map-pin is-swell"/);
 assert.doesNotMatch(css,/#chileCoastMap \.faro-lens-map-pin\{/);
 assert.match(css,/\.faro-model-sample-anchor/);
});
test('regional overview is beach-centric, with two understated distinguishable guide ticks',()=>{
 assert.match(map,/function markerIcon\(L,spot,selected,swellFit,windFit\)/);
 assert.match(map,/className="faro-region-fit-tracks"/);
 assert.match(map,/className="faro-region-fit-tick is-"/);
 assert.match(map,/micro\.dataset\.fit=status/);
 assert.match(map,/base\.setAttribute\("aria-label"/);
 assert.match(css,/\.faro-region-fit-tick\.is-wind\{\s*border-top-style:dashed/);
 assert.match(css,/\.faro-region-fit-tick\[data-fit="inside"\]/);
 assert.match(css,/\.faro-map-pin\.is-current/);
});
test('regional current beach is itself clickable to open Beach Focus',()=>{
 assert.match(map,/else if\(mapView==="region"\)\{/);
 assert.match(map,/mapView="beach";frameMap\(true\);update\(latest\)/);
 assert.match(map,/opts\.onSelectSpot\?\.\(sp\.id\)/);
 assert.match(map,/Selecciona una playa para acercarte/);
});
test('fallback map does not misleadingly draw swell rays across the coast',()=>{
 assert.doesNotMatch(map,/function ray\(x,y,bearing,color,shift\)/);
 assert.doesNotMatch(map,/if\(mode!=="wind"&&deg\(current\.slot\?\.swellDirection\)\)ray\(/);
 assert.match(map,/const gridVisible=mapView==="region"&&showSamples/);
});
test('a more transparent HUD uses original slim paths and theme-specific grade inks',()=>{
 assert.match(css,/background:rgba\(243,251,250,\.44\)!important/);
 assert.match(css,/background:rgba\(15,43,47,\.40\)!important/);
 assert.match(css,/backdrop-filter:blur\(18px\)/);
 assert.match(css,/@media\(prefers-reduced-transparency:reduce\)/);
 assert.match(map,/const makeArrow=\(from,kind\)=>/);
 assert.match(map,/kind==="swell"/);
 assert.doesNotMatch(map,/const palette=\{favourable:"#6bd0a3"/);
 assert.match(css,/\.faro-hud-row\[data-level="mixed"\]/);
});
test('fresh UI assets are referenced on the published Chile entrypoint',()=>{
 assert.match(html,/coast-map\.js\?v=14/);
 assert.match(html,/faro-coastal-lens-v4\.css\?v=9/);
});
