/* FARO spot registry, pure reusable facade for the legacy site and React.
 * Existing sourced score/live JSON remains canonical; this never invents
 * fitted bank or tide coefficients, nor silently updates published profiles.
 */
(function(root){
"use strict";
function build({live,score,intelligence}={}){
 const profiles=score?.profiles||{},context=intelligence?.spots||{};
 return Object.freeze((live?.pilots||[]).map(s=>{
  const p=profiles[s.id]||{},detail=context[s.id]||{};
  return Object.freeze({
   id:s.id,name:s.name,region:live?.region?.code||"CL-VS",
   latitude:Number.isFinite(s.latitude)?s.latitude:null,
   longitude:Number.isFinite(s.longitude)?s.longitude:null,
   coordinateStatus:s.coordinateStatus||"not_verified",
   breakType:p.kind||detail.type||"unknown",
   guide:Object.freeze({
    swellFrom:p.waveFromDeg||null,windFrom:p.windFromDeg||null,
    sources:p.origins||{}
   }),
   morphology:Object.freeze({
    description:detail.morphology||"not_documented",
    bankObserved:false,activeBankGeometry:null,
    tidalResponseCalibrated:false,ripCurrentModelled:false
   }),
   access:s.accessNotice||null,
   observations:Number.isFinite(p.observations)?p.observations:0,
   calibrationStage:p.calibrationStage||"guide_only_unvalidated",
   confidence:"uncalibrated",
   sourceOfTruth:Object.freeze(["valparaiso-live.config.json","valparaiso-score.config.json","spot-intelligence.json"])
  });
 }));
}
function audit(spots){
 const ids=new Set(),errors=[],gates=[];
 for(const p of spots||[]){
  if(!p.id||ids.has(p.id))errors.push("duplicate_or_missing_id:"+p.id);
  ids.add(p.id);
  if(!p.guide?.swellFrom?.length||!p.guide?.windFrom?.length)
   errors.push("missing_direction_guide:"+p.id);
  if(!p.guide?.sources||!Object.values(p.guide.sources).some(Boolean))
   gates.push("sources_need_review:"+p.id);
  if(!p.morphology.bankObserved)gates.push("bank_unobserved:"+p.id);
  if(!p.morphology.tidalResponseCalibrated)gates.push("tide_uncalibrated:"+p.id);
  if(p.observations===0)gates.push("needs_observations:"+p.id);
 }
 return {valid:errors.length===0,errors,gates,empiricalAccuracyClaim:false};
}
function updateCandidateFromReviewedObservations(spot,observations=[],approvals=[]){
 const approved=new Set(approvals.filter(a=>a.approved===true&&
  a.rightsVerified===true&&a.reviewedBy&&a.reviewedAtUtc).map(a=>a.observationId));
 const valid=observations.filter(o=>o.spotId===spot.id&&approved.has(o.observationId)&&
  typeof o.observedAtUtc==="string"&&Number.isFinite(Date.parse(o.observedAtUtc)));
 const dates=new Set(valid.map(o=>o.observedAtUtc.slice(0,10)));
 return Object.freeze({
  spotId:spot.id,priorStage:spot.calibrationStage,reviewedObservations:valid.length,
  independentDays:dates.size,
  candidateStatus:valid.length>=60&&dates.size>=15?"eligible_for_offline_testing":"insufficient_observations",
  publishAutomatically:false,calibrationLearned:false,
  rationale:"Independent future-event validation and human approval required."
 });
}
root.FaroSpotRegistry=Object.freeze({build,audit,updateCandidateFromReviewedObservations});
if(typeof module==="object"&&module.exports)module.exports=root.FaroSpotRegistry;
})(typeof window!=="undefined"?window:globalThis);
