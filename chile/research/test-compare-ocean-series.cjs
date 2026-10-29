/* Deterministic fixtures only: no measured SHOA/UV accuracy is implied. */
'use strict';
const assert=require('node:assert/strict');
const {parseCsv,compare,angleDiff}=require('./compare-ocean-series.cjs');
const h='stationId,source,issuedAtUtc,validAtUtc,heightM,periodS,directionFromDeg';
const F=parseCsv([h,
 'ST-A,open-meteo,2026-10-27T00:00:00Z,2026-10-28T06:00:00Z,1.4,10,355',
 'ST-A,open-meteo,2026-10-27T00:00:00Z,2026-10-28T09:00:00Z,1.1,9,5'
].join('\n'));
const O=parseCsv([h,
 'ST-A,shoa,,2026-10-28T06:00:00Z,1.2,11,5',
 'ST-A,shoa,,2026-10-28T09:00:00Z,1.3,9,355'
].join('\n'));
assert.equal(angleDiff(355,5),-10);
assert.equal(angleDiff(5,355),10);
const report=compare(F,O);
assert.equal(report.status,'descriptive-ocean-metrics');
assert.equal(report.n,2);
assert.ok(Math.abs(report.metrics.heightM.mae-0.2)<1e-10);
assert.ok(Math.abs(report.metrics.heightM.bias)<1e-10);
assert.equal(report.metrics.directionDeg.rmse,10);
assert.equal(report.events[0].leadHours,30);
assert.equal(report.events[0].spatialComparison,'exact-station-id-only-not-breaking-wave-verification');
assert.equal(compare(F,O.map(o=>({...o,stationId:'OTHER'}))).n,0);
assert.equal(compare(F,O.map(o=>({...o,validAtUtc:'2026-10-25T01:00:00Z'}))).n,0);
assert.equal(compare([{...F[0],issuedAtUtc:'2026-10-29T00:00:00Z'}],O).rejects.futureIssue,1);
assert.throws(()=>compare([{...F[0],issuedAtUtc:''}],O),/issueAtUtc/);
assert.throws(()=>parseCsv([h,'ST-A,shoa,,2026-10-28T06:00:00,1,10,20'].join('\n')),/UTC/);
assert.throws(()=>parseCsv([h,'ST-A,shoa,,2026-10-28T06:00:00Z,1,-1,20'].join('\n')),/physical/);
console.log('FARO ocean validation schema and UTC/circular-error QC passed (synthetic fixtures only).');
