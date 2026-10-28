/* FARO · Visual and scientific provenance regression, Oct 2026.
   Node test contract, not an independent field validation. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const load=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const model=load('chile/valparaiso-score-lab.js');
const config=JSON.parse(load('chile/valparaiso-score.config.json'));
const map=load('chile/coast-map.js');
const html=load('chile/index.html');
const css=load('assets/faro-coastal-lens-v4.css');
const controller=load('chile/chile-forecast.js');
const scope={};
new Function('globalThis',model)(scope);
const score=scope.FaroChileScoreLab;
test('experimental score cap and zero actual field observations are unambiguous',()=>{
 assert.equal(config.active,false);
 assert.equal(config.calibration.fieldSessions,0);
 const input={windFromDeg:126,windKmh:8,gustKmh:18,swellFromDeg:240,swellPeriodS:10.3,swellHeightM:.9};
 const boca=score.evaluate(config,'CL-VS:la-boca-concon',input,{locale:'es'});
 const ritoque=score.evaluate(config,'CL-VS:ritoque',input,{locale:'es'});
 assert.equal(boca.score,7.9);
 assert.equal(boca.capActive,true);
 assert.equal(boca.fieldSessions,0);
 assert.equal(boca.confidence,'low');
 assert.equal(ritoque.score,7);
 assert.equal(ritoque.capActive,false);
 assert.ok(boca.rawDirectionalIndex>boca.score);
 assert.equal(boca.nearshoreWaveHeightEstimated,false);
 assert.equal(boca.safetyAssessed,false);
});
test('missing observations and model inputs cannot yield a calibrated rating',()=>{
 const noInput=score.evaluate(config,'CL-VS:la-boca-concon',{}, {locale:'es'});
 assert.equal(noInput.score,null);
 assert.equal(noInput.status,'incomplete');
 assert.equal(noInput.confidence,'incomplete');
});
test('colour and score descriptions come from model guide, not an observed surf rating',()=>{
 assert.match(controller,/experimentalLabel\(s\)/);
 assert.match(controller,/scoreCaveat\(s\)/);
 assert.match(controller,/meta\.capActive/);
 assert.match(controller,/Techo del índice provisional/);
 assert.match(html,/Señales para la semana/);
});
test('beach dial only draws two separate radial lanes and remains on selected beach',()=>{
 assert.match(map,/function beachVectorIcon\(L,data\)/);
 assert.match(map,/const coast=\[sp\.latitude,sp\.longitude\]/);
 assert.match(map,/if\(mode!=="wind"\)spoke\(slot\.swellDirection,tones\[swell\],72,49/);
 assert.match(map,/if\(mode!=="swell"\)spoke\(slot\.windDirection,tones\[wind\],37,20/);
 assert.match(map,/iconAnchor:\[89,89\]/);
 assert.doesNotMatch(map,/faro-beach-vector-svg/);
 assert.match(css,/\.faro-beach-instrument\{/);
});
test('vector basemap is progressive and never removes working raster before vector load',()=>{
 assert.match(map,/loadVectorSupport\(\)/);
 assert.match(map,/tiles\.openfreemap\.org\/styles\/positron/);
 assert.match(map,/detectRetina:true/);
 assert.match(map,/gl\.once\("load",\(\)=>\{/);
 assert.match(map,/map\.removeLayer\(raster\)/);
 assert.match(map,/faro-map-regional/);
});
test('the lower sections are purposeful, discoverable and functional',()=>{
 for(const id of ['waveInsightExpand','faroTechnicalExpand','spotInsightExpand','cameraExpand','wearExpand','fieldNotesExpand']){
  assert.ok(html.includes('id="'+id+'"'));
 }
 assert.equal((html.match(/class="faro-hub-group /g)||[]).length,3);
 assert.match(html,/data-expand-target="forecastSources"/);
 assert.match(controller,/querySelectorAll\("\[data-expand-target\]"\)/);
 assert.match(css,/\.faro-hub-group>details\.forecast-expand>summary/);
});
test('all new frontend script and CSS versions invalidate old cached prototypes',()=>{
 assert.match(html,/coast-map\.js\?v=10/);
 assert.match(html,/chile-forecast\.js\?v=19/);
 assert.match(html,/valparaiso-score-lab\.js\?v=2/);
 assert.match(html,/faro-coastal-lens-v4\.css\?v=6/);
});
