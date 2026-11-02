/* FARO spot research diagnostics — explicit uncalibrated quantities.
 * Shared by legacy JS and React; analysis ONLY, no fitted bank parameters.
 */
(function(root){
"use strict";
const finite=n=>typeof n==="number"&&Number.isFinite(n);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const round=(n,d=2)=>Number(n.toFixed(d));
function diagnose(slot,profile=null){
 if(!slot)return {status:"missing",confidence:"unassessed"};
 const phys=slot.scoreMeta?.physicsProxy||{};
 const range=phys.directionScenario;
 const variation=finite(range?.scoreMin)&&finite(range?.scoreMax)?
  round(range.scoreMax-range.scoreMin,1):null;
 const complete=slot.modelComplete===true && slot.modelCoverage?.required==="complete";
 const partitions=Array.isArray(phys.partitions)?phys.partitions.length:null;
 const risk=slot.scoreMeta?.modelRisk?.isScreened===true;
 const bankKnown=false;
 const tideKnown=false; // Shallow-water morphology not measured at any break.
 const contextual=finite(slot.seaLevelChangeM)?{
  trend:slot.seaLevelChangeM>0.025?"rising":slot.seaLevelChangeM<-.025?"falling":"nearly_stable",
  resolution:"coarse_model_8km_not_local_tide",usedForScore:false}:null;
 const crossed=finite(phys.secondaryCrossingAngleDeg)?phys.secondaryCrossingAngleDeg:null;
 return Object.freeze({
  status:complete?"guide_based":"incomplete",
  confidence:complete?"low_unvalidated":"insufficient_inputs",
  numericalConfidencePercent:null,
  inputCoverage:slot.modelCoverage?.required||"unknown",
  inputPartitions:partitions,
  bearingSensitivityScoreSpan:variation,
  scenarioAngleShiftDeg:range?.bearingShiftDeg||null,
  sensitivityIsProbability:false,
  crossedSwellsAngleDeg:crossed,
  directionalGuideSupport:finite(phys.directionalGuideSupport)?phys.directionalGuideSupport:null,
  energyHs2T:finite(phys.energyHs2T)?phys.energyHs2T:null,
  tideTrendContext:contextual,tideResponseLearned:tideKnown,
  bankObserved:bankKnown,bankStabilityPrediction:null,
  ripCurrentRiskPrediction:null,brokenWaveHeightPrediction:null,
  forecastSafetyApproved:false,
  diagnosticsVersion:"faro-diagnostics-v0.1",
  warnings:["No empirical break-quality validation","No sandbank or nearshore current survey","No live official warnings"]
 });
}
function compare(spots){
 const rows=(spots||[]).map(({spotId,slot,profile})=>({
  spotId,offshorePotential:finite(slot?.score)?slot.score:null,
  diagnostics:diagnose(slot,profile)
 }));
 return Object.freeze({
  rows,rankingSupported:rows.every(r=>r.diagnostics.status==="guide_based"),
  observedSurfRanking:false,modelAccuracyClaim:false,
  comparisonBasis:"independent per-spot model cells when available; no filmed waves"
 });
}
root.FaroSpotDiagnostics=Object.freeze({diagnose,compare});
if(typeof module==="object"&&module.exports)module.exports=root.FaroSpotDiagnostics;
})(typeof window!=="undefined"?window:globalThis);
