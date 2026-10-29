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
assert.equal(Object.hasOwn(cfg.profiles,'CL-VS:ventanas'),true,
 'Ventanas must have sourced research-only directional priors');
const ventanasProfile=cfg.profiles['CL-VS:ventanas'];
assert.equal(ventanasProfile.scoreEnabled,false);
assert.equal(ventanasProfile.observations,0);
assert.equal(ventanasProfile.calibrationStage,'guide-prior-only-no-measured-sessions');
assert.deepEqual(ventanasProfile.waveFromDeg,[[337.5,22.5]],
 'North from-direction is a broad research cardinal hypothesis, not a calibrated window');
assert.deepEqual(ventanasProfile.windFromDeg,[[337.5,22.5],[157.5,202.5]]);
assert.equal(ventanasProfile.nearshoreModel.depthM,20);
assert.equal(ventanasProfile.nearshoreModel.directApiIntegration,false);
assert.equal(ventanasProfile.accessRestriction.newResolutionVerified,false);
const ventanasResearch=score(cfg,'CL-VS:ventanas',
 {...example,swellFromDeg:5,windFromDeg:180,windKmh:4},
 {locale:'es'});
assert.equal(ventanasResearch.status,'guide-only-restricted');
assert.equal(ventanasResearch.score,null,
 'No public score for Ventanas under reported, unverified-lifted recreation restriction');
assert.equal(ventanasResearch.safetyAssessed,false);
assert.equal(ventanasResearch.publicRecommendationAllowed,false);
assert.equal(ventanasResearch.components.swellDirection.value,1);
assert.equal(ventanasResearch.components.windDirection.value,1);
for(const spot of region.spots){
 assert.equal(spot.forecastEnabled,false);
 assert.equal(spot.coordinates,null);
 for(const sourceId of spot.sources)assert.ok(refs[sourceId],'Missing source: '+sourceId);
}
for(const [id,profile] of Object.entries(cfg.profiles)){
 assert.ok(region.spots.some(s=>s.id===id),'Profile must belong to a known named spot: '+id);
 for(const ref of Object.values(profile.origins))assert.ok(refs[ref],'Unknown guide '+ref);
}
assert.equal(Object.keys(cfg.profiles).length,6);
const total=Object.values(cfg.weights).reduce((sum,x)=>sum+x,0);
assert.ok(Math.abs(total-1)<1e-10,'Scoring weights should sum to 1');
assert.equal(laBoca.status,'experimental');
assert.ok(laBoca.score>7.9&&laBoca.score<=10,
 'The previous hard-coded 7.9 ceiling must no longer flatten a good modelled window');
assert.equal(laBoca.scoreCap,null);
const perfect=score(cfg,'CL-VS:la-boca-concon',
 {windFromDeg:140,windKmh:3,gustKmh:4,swellFromDeg:305,swellPeriodS:13,swellHeightM:1.5});
assert.equal(perfect.score,10,'Full theoretical 0–10 range should be reachable');
assert.equal(perfect.confidence,'low','A 10 is not field-validated surf quality');
assert.equal(perfect.safetyAssessed,false);
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
console.log('FARO Valparaíso Lab: full unvalidated 0–10 index; Ventanas guide-only restrictions; 6 research profiles / 22 spots; research lab inactive.');
