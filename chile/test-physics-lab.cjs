/* FARO Chile physics laboratory: synthetic invariants, no real-sea validation. */
'use strict';
const assert=require('node:assert/strict');
require('./faro-physics-lab.js');
const L=globalThis.FaroChilePhysicsLab;
const base={swellHeightM:1,swellPeriodS:10,swellDirection:250,
 totalWaveHeightM:1.3,windSeaHeightM:.3,windKmh:12,gustKmh:18,windDirection:95,
 secondarySwell:{heightM:.6,periodS:14,fromDeg:310},
 tertiarySwell:{heightM:.2,periodS:8,fromDeg:225}};
const guide={windFromDeg:[[60,110]],waveFromDeg:[[220,280]]};
const out=L.evaluate(base,guide);
assert.equal(out.status,'diagnostic_only');
assert.equal(out.predictedSurfQuality,null);
assert.equal(out.verifiedLocalPhysics.breakingWaveHeightM,null);
assert.equal(out.verifiedLocalPhysics.tidalStage,null);
assert.equal(out.confidenceProbability,null);
assert.equal(out.validated,false);
assert.equal(out.guideFit.windAngularDistanceDeg,0);
assert.equal(out.guideFit.swellAngularDistanceDeg,0);
assert.equal(out.crossingAngleDeg,60);
assert.equal(out.systems[0].proxyM2S,10);
assert.ok(Math.abs(out.systems[1].proxyM2S-5.04)<1e-12);
assert.ok(Math.abs(out.relativeProxies.reduce((s,x)=>s+x.fraction,0)-1)<1e-12);
const higher=L.evaluate({...base,swellHeightM:2},guide);
assert.equal(higher.systems[0].proxyM2S,40,'Height x2 causes energy proxy x4, not x2');
const missing=L.evaluate({...base,secondarySwell:null,tertiarySwell:null},guide);
assert.equal(missing.secondarySwellAvailable,false);
assert.equal(missing.proxiesComplete,false);
assert.equal(missing.proxySumM2S,null,'Missing partitions cannot be modelled as zero');
assert.equal(missing.relativeProxies,null);
assert.equal(missing.crossingAngleDeg,null);
assert.equal(missing.predictedSurfQuality,null);
const noWindSea=L.evaluate({...base,windSeaHeightM:null,windKmh:null,gustKmh:null},guide);
assert.equal(noWindSea.windSeaToTotalHeightRatio,null);
assert.equal(noWindSea.gustExcessKmh,null);
assert.equal(L.gap(350,10),20);
assert.equal(L.guideDistance(5,[345,15]),0);
assert.equal(L.guideDistance(60,[345,15]),45);
assert.equal(L.evaluate({}).status,'insufficient_inputs');
assert.equal(L.component('negative',-1,8,90).available,false);
console.log('FARO Chile physics lab: relative wave proxies, crossed swell, guide sectors, missing evidence and no false surf prediction passed.');
