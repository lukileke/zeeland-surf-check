/* Synthetic tests for the private empirical baseline; no real camera data. */
'use strict';
const assert=require('node:assert/strict');
const {calibrate,reviewable,vector}=require('./calibrate-observations.cjs');
assert.equal(calibrate([],[]).reviewedLabels,0);
assert.equal(Object.keys(calibrate([],[]).spots).length,0);
assert.equal(vector({swellHeightM:2,swellPeriodS:9,swellFromDeg:250,windKmh:12,windFromDeg:80}).length,11);
assert.equal(vector({swellHeightM:null,swellPeriodS:9,swellFromDeg:250,windKmh:12,windFromDeg:80}),null);
const records=[],reviews=[],first=Date.parse('2026-01-01T12:00:00Z');
const spot='CL-VS:la-boca-concon';
for(let i=0;i<100;i++){
 const time=new Date(first+i*3*86400000).toISOString(),hours=new Date(Date.parse(time)-7200000).toISOString();
 const h=.35+(i%11)*.14,w=4+(i%7)*3;
 const f={swellHeightM:h,swellPeriodS:8.5+(i%4),swellFromDeg:220+(i%9)*5,
  windKmh:w,windFromDeg:70+(i%8)*8,gustKmh:w+3,waveHeightM:h+.2};
 records.push({
  observationId:'research-synthetic-'+i,spotId:spot,observationType:'manual_external_camera_observation',
  observedAtUtc:time,observationWindowSeconds:600,captureAssetId:null,
  labels:{waveCount:12,surfableWaveCount:Math.max(1,Math.round(2+h*4)),
   closeoutFraction:Math.round(Math.max(.1,.85-h*.35)*100)/100,
   rideability1to5:Math.min(5,Math.max(1,Math.round(1+h*2.1)))},
  forecast:{forecastId:'prior-'+i,spotId:spot,ingestedAtUtc:hours,
   issuedAtUtc:null,validAtUtc:time,features:f}
 });
 reviews.push({observationId:'research-synthetic-'+i,reviewer:'synthetic reviewer',
  reviewedAtUtc:'2026-10-26T11:00:00Z',qualityStatus:'accepted',
  dataRightsStatus:'manual_derived_facts_reviewed'});
}
const out=calibrate(records,reviews);
assert.equal(out.researchOnly,true);assert.equal(out.deployed,false);
assert.equal(out.reviewedLabels,100);
assert.equal(out.spots[spot].trainingPerformed,true);
assert.ok(out.spots[spot].train>60&&out.spots[spot].holdout>=10);
assert.ok(out.spots[spot].evaluation.rideability.mae<
 out.spots[spot].evaluation.rideability.constantBaselineMae,
 'Simplified model should learn synthetic dependence; NOT a real-world accuracy claim');
assert.ok(out.spots[spot].evaluation.closeout.mae<
 out.spots[spot].evaluation.closeout.constantBaselineMae);
const unaudited=calibrate(records,[]);
assert.equal(unaudited.reviewedLabels,0);
assert.equal(unaudited.rejectedReasons.missing_human_review,100);
const wrongSpot={...records[0],forecast:{...records[0].forecast,spotId:'CL-VS:ritoque'}};
assert.ok(reviewable(wrongSpot,reviews[0]).includes('forecast_spot_mismatch'));
const future={...records[0],forecast:{...records[0].forecast,ingestedAtUtc:
 new Date(Date.parse(records[0].observedAtUtc)+3600000).toISOString()}};
assert.ok(reviewable(future,reviews[0]).includes('not_temporally_matched_prior_forecast'));
const disallowedVideo={...records[0],observationType:'manual_video_annotation'};
assert.ok(reviewable(disallowedVideo,reviews[0]).includes('missing_authorised_video_training_rights'));
const permittedVideo={...reviews[0],dataRightsStatus:'written_training_licence_verified',permissionDocumentId:'human-reviewed-example'};
assert.equal(reviewable(disallowedVideo,permittedVideo).length,0);
const small=calibrate(records.slice(0,25),reviews.slice(0,25));
assert.equal(small.spots[spot].trainingPerformed,false);
const duplicate=calibrate([...records,records[0]],reviews);
assert.equal(duplicate.rejectedReasons.duplicate_observation_id,1);
const badLabel={...records[0],labels:{...records[0].labels,waveCount:1}};
assert.ok(reviewable(badLabel,reviews[0]).includes('incomplete_or_short_observation'));
console.log('FARO calibration: synthetic fitting, independent chronological holdout, legal review gate, core forecast provenance, minimum sample sizes and rejection reasons passed.');
