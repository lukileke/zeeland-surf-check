/* Synthetic, rights-safe, time-travel-safe research dataset tests. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pair,allowed}=require('./camera-learning.cjs');
const original=JSON.parse(fs.readFileSync(path.join(__dirname,'camera-sources.json'),'utf8'));
assert.equal(allowed(original.sources.find(x=>x.id==='lineup-la-boca-1')),false);
assert.equal(allowed(original.sources.find(x=>x.id==='lineup-la-boca-2')),false);
const owned={id:'test-faro-owned',spotId:'CL-VS:la-boca-concon',trainingRights:'written_training_permission_verified',
 automatedCapturePermitted:true,privacyPolicyReviewed:true,permissionDocumentId:'synthetic-permission-not-real'};
const catalog={sources:[...original.sources,owned]};
const start=Date.parse('2026-01-01T12:00:00Z');
const stamp=(ms)=>new Date(ms).toISOString();
const observations=[],forecasts=[];
for(let k=0;k<36;k++){
 const at=start+k*3*86400000;
 const instant=stamp(at);
 observations.push({observationId:'o'+k,cameraId:owned.id,spotId:owned.spotId,
  observedAtUtc:instant,privacyProcessed:true,mediaConsentScope:'ml_training_approved',
  captureAssetId:'synthetic-'+k,roiVersion:'v1',
  labels:{rideability1to5:1+k%5,waveCount:20,surfableWaveCount:7,closeoutFraction:.4,
   medianWaveFaceSeconds:6,surface:'mixed',visibility:'usable',bankNotes:null}});
 forecasts.push({forecastId:'prior'+k,spotId:owned.spotId,
  issuedAtUtc:stamp(at-7*3600000),ingestedAtUtc:stamp(at-6*3600000),
  validAtUtc:instant,source:'Open-Meteo',model:'test',
  features:{swellHeightM:1.1,swellPeriodS:12,swellFromDeg:230,windKmh:7,windFromDeg:90}});
}
const first=pair(observations,forecasts,catalog);
assert.equal(first.summary.paired,36);
assert.equal(first.summary.splitReady,true);
assert.ok(first.summary.train>0&&first.summary.holdout>0);
const groupsTrain=new Set(first.records.filter(x=>x.split==='train').map(x=>x.eventGroup));
const groupsTest=new Set(first.records.filter(x=>x.split==='holdout').map(x=>x.eventGroup));
assert.equal([...groupsTrain].some(x=>groupsTest.has(x)),false,'Episode leakage');
const duplicateSameEvent={...observations[0],observationId:'o0-extra',captureAssetId:'synthetic-extra',observedAtUtc:stamp(start+3600000)};
const duplicated=pair([...observations,duplicateSameEvent],forecasts,catalog);
assert.equal(duplicated.summary.paired,37);
assert.equal(duplicated.records[0].split,duplicated.records.at(-1).split,'One swell episode has same split');
const noRights=pair([observations[0]],forecasts,original);
assert.equal(noRights.summary.paired,0);
assert.equal(noRights.summary.excluded.source_not_licensed_for_training,1);
const futureOnly=pair([observations[0]],[{...forecasts[0],issuedAtUtc:stamp(start+3600000)}],catalog);
assert.equal(futureOnly.summary.paired,0,'No training with future forecast leakage');
const fetchedTooLate=pair([observations[0]],[{...forecasts[0],ingestedAtUtc:stamp(start+3600000)}],catalog);
assert.equal(fetchedTooLate.summary.paired,0,'No training with forecast obtained only after camera observation');
const missingIssue=pair([observations[0]],[{...forecasts[0],issuedAtUtc:null}],catalog);
assert.equal(missingIssue.summary.paired,0,'Unknown issue time cannot be assumed prior to image');
const badLabels=pair([{...observations[0],labels:{...observations[0].labels,closeoutFraction:1.5}}],forecasts,catalog);
assert.equal(badLabels.summary.paired,0);
assert.equal(badLabels.summary.excluded.invalid_labels,1);
const noConsent=pair([{...observations[0],mediaConsentScope:null}],forecasts,catalog);
assert.equal(noConsent.summary.paired,0);
const noOtherBeach=pair([{...observations[0],spotId:'CL-VS:renaca'}],forecasts,catalog);
assert.equal(noOtherBeach.summary.paired,0);
const tooFew=pair(observations.slice(0,2),forecasts,catalog);
assert.equal(tooFew.summary.splitReady,false);
assert.ok(tooFew.records.every(r=>r.split==='research_only_not_train_ready'));
const laterValid=pair([observations[0]],[
 {...forecasts[0],forecastId:'older',issuedAtUtc:stamp(start-20*3600000)},
 {...forecasts[0],forecastId:'newer',issuedAtUtc:stamp(start-5*3600000),ingestedAtUtc:stamp(start-4*3600000)}
],catalog);
assert.equal(laterValid.records[0].forecastId,'newer','Use newest forecast truly available before observations');
console.log('Camera learning: rights gate, metadata validity, temporal vintage, spatial match and held-out episodes passed.');
