/* Actual published site-aggregate wave-breaking labels; NO video training. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=JSON.parse(fs.readFileSync(path.join(__dirname,'research/breaking-types-published-aggregates.json'),'utf8'));
const trained=JSON.parse(fs.readFileSync(path.join(__dirname,'research/breaking-types-trained-priors.json'),'utf8'));
const {evaluate}=require('./train-breaking-priors.cjs');
const v=evaluate(src),tol=1e-11;
assert.equal(v.trainingLabels,9000);
assert.equal(v.trainingVideos,0);
assert.equal(v.trainingImages,0);
assert.equal(v.deployable,false);
assert.equal(v.trainedBreakingVideoModel,false);
assert.deepEqual(v.labels,['plunging','spilling','surging']);
assert.deepEqual(src.sites.map(s=>s.counts.reduce((a,b)=>a+b)),[1999,2558,642,466,694,2641]);
assert.ok(v.overallPrior.every(x=>Math.abs(x-1/3)<tol));
assert.ok(v.leaveOneSiteOut.length===6);
assert.equal(v.bySite.D.majorityClass,'surging');
assert.equal(v.bySite.C.majorityClass,'spilling');
assert.ok(Math.abs(v.acrossUnseenSites.meanLogLoss-trained.acrossUnseenSites.meanLogLoss)<tol);
assert.ok(v.acrossUnseenSites.meanLogLoss>v.acrossUnseenSites.uniformBaselineLogLoss,
 'Labels from 6 other beaches cannot be marketed as calibrated predictive skill on new coast');
assert.equal(v.acrossUnseenSites.beatsUniform,false);
assert.equal(JSON.stringify(v),JSON.stringify(trained),'Commit exact reproducible trained result, no invented results');
console.log('FARO research: trained 9000 real published labels as categorical priors; transfer FAIL correctly reported; no licensed video used.');
