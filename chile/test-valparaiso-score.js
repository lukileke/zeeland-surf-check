/* Self-contained Node.js regression tests for the dormant FARO Chile pilot.
 * Run from repository root: node chile/test-valparaiso-score.js
 * No network or third-party packages required.
 */
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=__dirname;
const json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
require('./valparaiso-score-lab.js');
const score=globalThis.FaroChileScoreLab.evaluate;
const cfg=json('valparaiso-score.config.json'),region=json('regions/CL-VS.json'),
 manifest=json('regions.json'),refs=json('sources.json').sources;
const example={windFromDeg:140,windKmh:12,gustKmh:19,swellFromDeg:305,swellPeriodS:12,swellHeightM:1.2};
const laBoca=score(cfg,'CL-VS:la-boca-concon',example,{locale:'es'});
const ritoque=score(cfg,'CL-VS:ritoque',example,{locale:'es'});
const renaca=score(cfg,'CL-VS:renaca',example,{locale:'es'});
assert.equal(cfg.active,false);
assert.equal(region.forecastEnabled,false);
assert.equal(manifest.active,false);
assert.equal(manifest.regions.find(r=>r.code==='CL-VS').spotCount,region.spots.length);
assert.equal(region.spots.length,22);
assert.equal(region.spots.some(s=>s.id==='CL-VS:ventanas'),true);
assert.equal(Object.hasOwn(cfg.profiles,'CL-VS:ventanas'),false,
 'Ventanas must remain unscored while reported access restrictions are not verified lifted');
for(const spot of region.spots){
 assert.equal(spot.forecastEnabled,false);
 assert.equal(spot.coordinates,null);
 for(const sourceId of spot.sources)assert.ok(refs[sourceId],'Missing source: '+sourceId);
}
for(const [id,profile] of Object.entries(cfg.profiles)){
 assert.ok(region.spots.some(s=>s.id===id),'Profile must belong to a known named spot: '+id);
 for(const ref of Object.values(profile.origins))assert.ok(refs[ref],'Unknown guide '+ref);
}
assert.equal(Object.keys(cfg.profiles).length,5);
const total=Object.values(cfg.weights).reduce((sum,x)=>sum+x,0);
assert.ok(Math.abs(total-1)<1e-10,'Scoring weights should sum to 1');
assert.equal(laBoca.status,'experimental');
assert.equal(laBoca.score,7.9);
const nearFlat=score(cfg,'CL-VS:la-boca-concon',{...example,swellHeightM:0.15},{locale:'es'});
assert.ok(nearFlat.score<3,'Near-flat swell must not score highly merely due to favourable directions');
assert.equal(score(cfg,'CL-VS:la-boca-concon',{...example,swellHeightM:0}).score,0);

assert.ok(laBoca.score>ritoque.score,'Same marine input should respond differently to the local spot');
assert.ok(renaca.score>ritoque.score);
assert.equal(laBoca.tags.length,7);
assert.equal(laBoca.tideEvaluated,false);
assert.equal(laBoca.nearshoreWaveHeightEstimated,false);
assert.equal(laBoca.safetyAssessed,false);
assert.equal(laBoca.modelRisk.official,false);
assert.equal(score(cfg,'CL-VS:la-boca-concon',{},{}).score,null);
assert.equal(score(cfg,'CL-VS:playa-negra-concon',example).score,null);
const dangerous=score(cfg,'CL-VS:papagayo-quintero',{...example,windKmh:42,gustKmh:81},{locale:'es'});
assert.ok(dangerous.modelRisk.isScreened);
assert.equal(dangerous.safetyAssessed,false);
assert.ok(dangerous.caution.includes('roca'));
assert.equal(score(cfg,'CL-VS:ritoque',{...example,windFromDeg:359}).components.windDirection.value,1,
 'Wrapped N direction should work');
const english=score(cfg,'CL-VS:la-boca-concon',example,{locale:'en'});
assert.ok(english.read.includes('Wind'));
console.log('FARO Valparaiso Lab: all tests passed. 5 profiles / 21 named spots / Chile remains inactive.');
