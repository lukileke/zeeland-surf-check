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
assert.equal(ventanasProfile.scoreEnabled,true);
assert.equal(ventanasProfile.observations,0);
assert.equal(ventanasProfile.calibrationStage,'physics-informed-guide-prior-no-observational-validation');
assert.deepEqual(ventanasProfile.waveFromDeg,[[337.5,22.5]],
 'North from-direction is a broad research cardinal hypothesis, not a calibrated window');
assert.deepEqual(ventanasProfile.windFromDeg,[[337.5,22.5],[157.5,202.5]]);
assert.equal(ventanasProfile.nearshoreModel.depthM,20);
assert.equal(ventanasProfile.nearshoreModel.directApiIntegration,false);
assert.equal(ventanasProfile.accessRestriction.newResolutionVerified,false);
const ventanasResearch=score(cfg,'CL-VS:ventanas',
 {...example,swellFromDeg:5,windFromDeg:180,windKmh:4},
 {locale:'es'});
assert.equal(ventanasResearch.status,'experimental-restricted');
assert.ok(Number.isFinite(ventanasResearch.score),
 'Ventanas is numerically modelled without inventing field calibration');
assert.equal(ventanasResearch.publicRecommendationAllowed,false,
 'Model value must never override a reported access restriction');
assert.equal(ventanasResearch.safetyAssessed,false);
assert.equal(ventanasResearch.publicRecommendationAllowed,false);
assert.equal(ventanasResearch.components.swellDirection.value,1);
assert.equal(ventanasResearch.components.windDirection.value,1);
for(const spot of region.spots){
 assert.equal(spot.forecastEnabled,spot.id==='CL-VS:ventanas');
 assert.equal(spot.coordinates,null);
 for(const sourceId of spot.sources)assert.ok(refs[sourceId],'Missing source: '+sourceId);
}
for(const [id,profile] of Object.entries(cfg.profiles)){
 assert.ok(region.spots.some(s=>s.id===id),'Profile must belong to a known named spot: '+id);
 for(const ref of Object.values(profile.origins))assert.ok(refs[ref],'Unknown guide '+ref);
}
assert.equal(Object.keys(cfg.profiles).length,6);
assert.equal(cfg.calibration.modelVersion,'faro-spot-response-v0.4');
assert.equal(cfg.weights,undefined,'Old arbitrary weighted score must be removed');
assert.ok(cfg.heuristics.energyWeight>0&&cfg.heuristics.energyWeight<1);
assert.equal(laBoca.status,'experimental');
assert.ok(laBoca.score>0&&laBoca.score<=10,
 'The guide-derived energy index must remain within the display range');
assert.equal(laBoca.indexVersion,'faro-spot-response-v0.4');
assert.equal(laBoca.physicsProxy.partitions.length,1);
assert.equal(laBoca.physicsProxy.offshoreNotBreakingWave,true);
assert.equal(laBoca.scoreCap,null);
const perfect=score(cfg,'CL-VS:la-boca-concon',
 {windFromDeg:140,windKmh:0,gustKmh:1,swellFromDeg:305,swellPeriodS:16,swellHeightM:3});
assert.ok(perfect.score>9.5&&perfect.score<=10,
 'Highly energetic, gently winded seas should exceed 7.9 without fabricated clipping');
// A serious v0.3 defect: huge swell well outside a break's guide angles
// could still earn ~9/10 through saturated residual offshore energy.
const fullyAligned=score(cfg,'CL-VS:la-boca-concon',{
 windFromDeg:145,windKmh:0,gustKmh:0,
 swellFromDeg:290,swellPeriodS:20,swellHeightM:6
});
const stronglyOffAxis=score(cfg,'CL-VS:la-boca-concon',{
 windFromDeg:145,windKmh:0,gustKmh:0,
 swellFromDeg:100,swellPeriodS:20,swellHeightM:6
});
assert.ok(fullyAligned.score>8,'On-guide energetic swell can score above 7.9');
assert.ok(stronglyOffAxis.score<4,
 'Massive off-guide swell must NOT saturate the offshore score to excellent');
assert.ok(fullyAligned.physicsProxy.directionalGuideSupport>.95);
assert.ok(stronglyOffAxis.physicsProxy.directionalGuideSupport<.05);
assert.equal(stronglyOffAxis.physicsProxy.observationsCount,0);
assert.equal(stronglyOffAxis.guideFitEvidence,'guide-only-unvalidated');
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
// Physics/sensitivity checks, NOT pseudo-observational calibration.
const base={windFromDeg:145,windKmh:5,gustKmh:7,
 swellFromDeg:260,swellPeriodS:10,swellHeightM:1.3};
const evalAt=overrides=>score(cfg,'CL-VS:la-boca-concon',{...base,...overrides});
const low=evalAt({swellHeightM:.6}),mid=evalAt({swellHeightM:1.3}),
 high=evalAt({swellHeightM:2.3});
assert.ok(low.score<mid.score&&mid.score<high.score,
 'More energy from the same direction/period must increase the index without abrupt clipping');
assert.ok(evalAt({swellPeriodS:7}).score<evalAt({swellPeriodS:13}).score,
 'Longer mean period increases offshore Hs²T potential at fixed Hs');
const calmWrong=evalAt({windKmh:2,gustKmh:3,windFromDeg:280});
const calmRight=evalAt({windKmh:2,gustKmh:3,windFromDeg:140});
assert.equal(calmWrong.score,calmRight.score,
 'Under calm wind, compass bearing must not produce a false onshore penalty');
const windyWrong=evalAt({windKmh:28,gustKmh:33,windFromDeg:280});
const windyRight=evalAt({windKmh:28,gustKmh:33,windFromDeg:140});
assert.ok(windyRight.score>windyWrong.score,
 'A strong adverse wind bearing reduces the spot-dependent potential');
const opposite=evalAt({secondarySwell:{heightM:.7,periodS:12,fromDeg:80}});
const aligned=evalAt({secondarySwell:{heightM:.7,periodS:12,fromDeg:250}});
assert.equal(opposite.physicsProxy.partitions.length,2);
assert.ok(aligned.physicsProxy.admittedEnergyHs2T>opposite.physicsProxy.admittedEnergyHs2T,
 'Secondary swell energy is independently exposed by its own guide bearing');
assert.ok(aligned.score>mid.score,'Favourable secondary swell adds energy');
assert.ok(evalAt({secondarySwell:{heightM:null,periodS:12,fromDeg:250}}).score===mid.score,
 'Incomplete optional secondary swell must not be imputed');
assert.ok(evalAt({windSeaHeightM:2}).score<mid.score,
 'Independent local windsea can modestly lower relative orderliness');
assert.equal(evalAt({swellHeightM:0}).score,0,
 'A flat swell has no surf potential even in perfect wind');
assert.ok(Number.isFinite(score(cfg,'CL-VS:ventanas',base).score),
 'Restricted Ventanas is modelled but its score must not count as permission');
assert.equal(score(cfg,'CL-VS:ventanas',base).publicRecommendationAllowed,false);
const english=score(cfg,'CL-VS:la-boca-concon',example,{locale:'en'});
assert.ok(english.read.includes('Wind'));
console.log('FARO Valparaíso Lab: full unvalidated 0–10 index; Ventanas modelled with access block; 6 research profiles / 22 spots; research lab configuration inactive.');
