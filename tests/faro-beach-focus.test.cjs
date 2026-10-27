/* FARO local beach-focus regressions. Direction-fit values are GUIDE annotations,
   not wave-refraction or observed breaking-surf predictions. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const map=require('../chile/coast-map.js');
const js=read('chile/coast-map.js'),css=read('assets/faro-coastal-lens-v4.css'),html=read('chile/index.html');
const profiles=JSON.parse(read('chile/valparaiso-score.config.json')).profiles;
test('relative guide fit differs between beaches on identical offshore bearings',()=>{
 const wind=126;
 assert.equal(map.directionalFit(wind,profiles['CL-VS:la-boca-concon'].windFromDeg,8,true),'inside');
 assert.equal(map.directionalFit(wind,profiles['CL-VS:ritoque'].windFromDeg,8,true),'outside');
 assert.equal(map.directionalFit(wind,profiles['CL-VS:renaca'].windFromDeg,8,true),'edge');
 assert.equal(map.directionalFit(241,profiles['CL-VS:ritoque'].waveFromDeg),'inside');
});
test('strong wind triggers caution even if offshore direction fits guide',()=>{
 assert.equal(map.directionalFit(126,profiles['CL-VS:la-boca-concon'].windFromDeg,30,true),'strong');
 assert.equal(map.directionalFit(126,profiles['CL-VS:la-boca-concon'].windFromDeg,29.9,true),'inside');
 assert.equal(map.directionalFit(null,[],40,true),'unknown');
 assert.equal(map.fitCopy('strong','es'),'Viento ≥30 km/h · precaución');
});
test('selected beach drives focus; model grid is only in regional view',()=>{
 assert.match(js,/let mode="combined",mapView="beach"/);
 assert.match(js,/map\.setView\(coast,viewport\.clientWidth&&viewport\.clientWidth<520\?14:15/);
 assert.match(js,/maxZoom:17,minZoom:9/);
 assert.match(js,/mapView=mapView==="beach"\?"region":"beach"/);
 assert.match(js,/modelGridMarker\.setOpacity\(mapView==="region"&&mode!=="wind"\?1:0\)/);
 assert.match(js,/windGridMarker\.setOpacity\(mapView==="region"&&mode!=="swell"\?1:0\)/);
 assert.match(js,/lastCentered!==latest\.spot\.id/);
});
test('local vectors are geo-anchored to beach and rotated using FROM+180 direction',()=>{
 assert.match(js,/function beachVectorIcon\(L,data\)/);
 assert.match(js,/const az=bearingFromArrow\(from\)/);
 assert.match(js,/L\.marker\(pos,\{interactive:false,keyboard:false/);
 assert.match(js,/beachVectorMarker\.setIcon\(beachVectorIcon\(L,latest\)\)/);
 assert.match(js,/beachVectorMarker\.setOpacity\(mapView==="beach"\?1:0\)/);
 assert.match(css,/\.faro-beach-vectors-anchor\{/);
 assert.match(css,/pointer-events:none!important/);
 assert.doesNotMatch(js,/faro-lens-partitions/);
});
test('model read and legend show guide-fit colours and cautions, never a measured break',()=>{
 assert.match(js,/tile\.dataset\.fit=fit/);
 assert.match(js,/append\("em","faro-lens-local-fit",fitCopy\(fit,v\.lang\),tile\)/);
 assert.match(js,/Rumbos del modelo · no refracción local/);
 assert.match(js,/compatibilidad direccional con la guía/);
 assert.match(css,/\.faro-lens-quick-metric\[data-fit="inside"\]/);
 assert.match(css,/\.faro-lens-quick-metric\[data-fit="strong"\]/);
 assert.match(html,/coast-map\.js\?v=8/);
 assert.match(html,/faro-coastal-lens-v4\.css\?v=4/);
});
