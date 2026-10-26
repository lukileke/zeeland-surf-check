/* Pure dataset invariants: test only metadata; no webcam/media captured. */
'use strict';
const assert=require('node:assert/strict'),lab=require('./video-observation-lab.js'),map=require('./coast-map.js');
assert.equal(lab.localToUtc('2026-10-26T12:00'),'2026-10-26T15:00:00.000Z');
assert.equal(lab.localToUtc('2026-07-15T12:00'),'2026-07-15T16:00:00.000Z');
assert.equal(lab.localToUtc('nonsense'),null);
assert.equal(lab.localToUtc('2026-02-30T12:00'),null);
assert.equal(lab.localToUtc('2026-04-04T23:30'),null,'DST repeated hour must not be guessed');
const events=[
 {type:'wall',atSeconds:6.5,wallSeconds:4},
 {type:'closeout',atSeconds:22,wallSeconds:null},
 {type:'wall',atSeconds:45,wallSeconds:8},
 {type:'other',atSeconds:66,wallSeconds:null}
];
assert.deepEqual(lab.deriveEvents(events),{waveCount:4,surfableWaveCount:2,closeoutFraction:1/3,
 medianWaveFaceSeconds:6,unclassifiedWaveCount:1});
assert.equal(lab.deriveEvents([]).closeoutFraction,null);
const at='2026-10-26T15:00:00.000Z';
const features={swellHeightM:1.1,swellPeriodS:12,swellFromDeg:232,windKmh:8,windFromDeg:90};
const archive={region:'CL-VS',provider:'Open-Meteo',spots:[{spotId:'CL-VS:la-boca-concon',records:[
 {forecastId:'prior1',spotId:'CL-VS:la-boca-concon',validAtUtc:at,ingestedAtUtc:'2026-10-26T08:00:00Z',
  source:'Open-Meteo',features},
 {forecastId:'prior2',spotId:'CL-VS:la-boca-concon',validAtUtc:at,ingestedAtUtc:'2026-10-26T10:00:00Z',
  source:'Open-Meteo',features},
 {forecastId:'future',spotId:'CL-VS:la-boca-concon',validAtUtc:at,ingestedAtUtc:'2026-10-26T17:00:00Z',
  source:'Open-Meteo',features}
 ]}]};
const found=lab.matchSnapshot(archive,'CL-VS:la-boca-concon',at);
assert.equal(found.forecastId,'prior2','Choose latest snapshot definitely saved before observed time');
assert.equal(lab.matchSnapshot(archive,'CL-VS:renaca',at),null);
assert.equal(lab.matchSnapshot(archive,'CL-VS:la-boca-concon','2026-10-25T15:00:00.000Z'),null,
 'Never match a forecast fetched only after the observations');
assert.equal(lab.matchSnapshot(archive,'CL-VS:la-boca-concon','2026-10-27T18:00:00.000Z'),null,
 'A forecast valid instant must align the observation');
const rec={observationId:'synthetic',spotId:'CL-VS:la-boca-concon',observedAtUtc:at,
 labels:{waveCount:4,surfableWaveCount:2,closeoutFraction:.25,rideability1to5:3}};
assert.equal(lab.validateObservation(rec),true);
assert.equal(lab.validateObservation({...rec,labels:{...rec.labels,rideability1to5:8}}),false);
assert.equal(lab.validateObservation({...rec,labels:{...rec.labels,closeoutFraction:NaN}}),false);
assert.equal(map.bearingFromArrow(270),90,'West-origin swell travels east');
assert.equal(map.bearingFromArrow(90),270,'East-origin wind travels west');
assert.equal(map.bearingFromArrow(null),null);
assert.equal(map.stateLabel('disputed','es'),'Guías difieren');
assert.equal(map.stateLabel('convergent','en'),'Guides agree');
console.log('FARO video annotation and map: UTC/DST, surf event labels, prior vintage join, cross-spot exclusion and FROM arrow direction passed.');
