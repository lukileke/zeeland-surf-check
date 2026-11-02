const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Decision=require("./faro-session-decision.js");
const Registry=require("./faro-spot-registry.js");
const Diagnostics=require("./faro-spot-diagnostics.js");
const dir=__dirname;
const live=JSON.parse(fs.readFileSync(path.join(dir,"valparaiso-live.config.json")));
const score=JSON.parse(fs.readFileSync(path.join(dir,"valparaiso-score.config.json")));
const intel=JSON.parse(fs.readFileSync(path.join(dir,"spot-intelligence.json")));
const spots=Registry.build({live,score,intelligence:intel});
assert.equal(spots.length,live.pilots.length);
const audit=Registry.audit(spots);
assert.equal(audit.valid,true,JSON.stringify(audit));
assert.ok(audit.gates.some(x=>x.startsWith("bank_unobserved:")));
assert.ok(spots.every(x=>x.confidence==="uncalibrated"));
const base={potentialScore:9.2,slotRisk:"none",access:null,daylight:true,modelCoverage:"complete"};
const normal=Decision.evaluate(base);
assert.equal(normal.sessionScore,9.2);
assert.equal(normal.potentialScore,9.2);
assert.equal(normal.canRecommend,true);
const caution=Decision.evaluate({...base,slotRisk:"caution"});
assert.equal(caution.sessionScore,5.9);
assert.equal(caution.potentialScore,9.2);
assert.equal(caution.status,"caution");
const danger=Decision.evaluate({...base,slotRisk:"danger"});
assert.equal(danger.sessionScore,null);
assert.equal(danger.status,"blocked");
assert.equal(danger.canRecommend,false);
const unknown=Decision.evaluate({...base,slotRisk:"unknown"});
assert.equal(unknown.sessionScore,null);
assert.equal(unknown.status,"unassessed");
const incomplete=Decision.evaluate({...base,modelCoverage:"partial"});
assert.equal(incomplete.canRecommend,false);
const reported=spots.find(s=>s.id==="CL-VS:ventanas")?.access;
assert.ok(reported,"Ventanas restriction should exist in canonical live data");
const restricted=Decision.evaluate({...base,access:reported});
assert.equal(restricted.status,"blocked");
assert.equal(restricted.sessionScore,null);
const fake=Decision.evaluate({...base,officialAlert:{verified:true,level:"danger"}});
assert.equal(fake.canRecommend,true,"Unattributed external claim must not be treated as an official warning");
const official=Decision.evaluate({...base,officialAlert:{
 verified:true,level:"danger",authority:"Authority",sourceUrl:"https://example.org/notice",
 checkedAtUtc:"2026-10-30T10:00:00Z"
}});
assert.equal(official.canRecommend,false);
assert.equal(official.officialAlertChecked,true);
const record=Registry.updateCandidateFromReviewedObservations(spots[0],[{
 observationId:"a",spotId:spots[0].id,observedAtUtc:"2026-10-20T09:00:00Z"
}],[{observationId:"a",approved:true,rightsVerified:true,reviewedBy:"QA",reviewedAtUtc:"2026-10-21T10:00:00Z"}]);
assert.equal(record.reviewedObservations,1);
assert.equal(record.publishAutomatically,false);
assert.equal(record.candidateStatus,"insufficient_observations");
const diagnostic=Diagnostics.diagnose({modelComplete:true,modelCoverage:{required:"complete"},
 scoreMeta:{physicsProxy:{directionScenario:{scoreMin:6.8,scoreMax:8.1,bearingShiftDeg:15},
 partitions:[{id:"primary"}],directionalGuideSupport:.67,energyHs2T:25,
 secondaryCrossingAngleDeg:64}},
 seaLevelChangeM:.1});
assert.equal(diagnostic.bearingSensitivityScoreSpan,1.3);
assert.equal(diagnostic.tideResponseLearned,false);
assert.equal(diagnostic.bankObserved,false);
assert.equal(diagnostic.ripCurrentRiskPrediction,null);
assert.equal(diagnostic.numericalConfidencePercent,null);
const learning=require("./research/spot-learning-report.cjs").evaluate([],[]);
assert.equal(learning.autoPublish,false);
assert.equal(learning.scoreRevisionCreated,false);
assert.equal(learning.registry.count,spots.length);
assert.equal(learning.rankedForecastSkillValidated,false);
const unstable=Decision.evaluate({...base,windSpeedRangeKmh:30});
assert.equal(unstable.windVariabilityAdjustment,0.5);
assert.equal(unstable.sessionScore,8.7);
const stable=Decision.evaluate({...base,windSpeedRangeKmh:2});
assert.equal(stable.sessionScore,9.2);
console.log("FARO spot registry, hazard gate and uncalibrated diagnostics: OK");
