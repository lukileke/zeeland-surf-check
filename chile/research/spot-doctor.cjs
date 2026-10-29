/* FARO spot onboarding and evidence-contract checker.
 * Never invent coordinates, favourable bearing sectors, wave heights or
 * observational calibration for candidate spots. Node >=20.
 * node chile/research/spot-doctor.cjs
 * node chile/research/spot-doctor.cjs --draft CL-VS:new-spot "Nuevo spot"
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function validate({live,score,catalog,sources}){
 const ids=new Set(),errors=[],warnings=[],report=[];
 const sourceIds=sources.sources||sources;
 const atlas=new Map((catalog.spots||[]).map(s=>[s.id,s]));
 const pilots=live.pilots||[],profiles=score.profiles||{};
 for(const sp of catalog.spots||[]){
  if(ids.has(sp.id))errors.push('duplicate_catalog_id:'+sp.id);
  ids.add(sp.id);
  for(const id of sp.sources||[])if(!sourceIds[id]?.url)
   errors.push('missing_catalog_source:'+sp.id+':'+id);
 }
 const pairs=arr=>Array.isArray(arr)&&arr.length>0&&arr.every(p=>
  Array.isArray(p)&&p.length===2&&p.every(v=>finite(v)&&v>=0&&v<=360));
 for(const sp of pilots){
  const p=profiles[sp.id],c=atlas.get(sp.id),why=[],gates=[];
  if(!p||!c){errors.push('pilot_without_profile_or_atlas:'+sp.id);continue;}
  if(!finite(sp.latitude)||!finite(sp.longitude)||
   Math.abs(sp.latitude)>90||Math.abs(sp.longitude)>180)
   errors.push('invalid_geo_reference:'+sp.id);
  if(!pairs(p.waveFromDeg)||!pairs(p.windFromDeg))
   errors.push('invalid_compass_guide:'+sp.id);
  if(!p.origins?.swell||!p.origins?.wind)errors.push('guide_provenance_missing:'+sp.id);
  for(const key of ['swell','wind'])if(p.origins?.[key]&&!sourceIds[p.origins[key]]?.url)
   errors.push('guide_source_not_in_catalog:'+sp.id+':'+p.origins[key]);
  if(!p.observations)gates.push('no_verified_surf_observations');
  if(!c.conditions?.breakingHeightCalibration)gates.push('no_calibrated_breaking_height');
  if(!sp.coordinateStatus||/approx|not_surf|beach_centre/.test(sp.coordinateStatus))
   gates.push('takeoff_coordinate_not_verified');
  if(sp.accessNotice?.publicRecommendationAllowed===false)
   gates.push('access_restriction_not_verified_lifted');
  if(!p.nearshoreModel?.directApiIntegration)gates.push('no_numeric_nearshore_model');
  if(c.conditions?.guideHypotheses)why.push('literature_only_bearing');
  if(!p.observations)warnings.push('no_local_surf_validation:'+sp.id);
  report.push({id:sp.id,name:sp.shortName||sp.name,
   modelScoreEnabled:sp.scoreEnabled!==false,
   publicRecommendationAllowed:sp.accessNotice?.publicRecommendationAllowed!==false,
   evidenceStage:'guide-derived-model',
   blockersToCalibratedClaim:gates,
   guideHypotheses:why});
 }
 for(const [id,p]of Object.entries(profiles)){
  if(p.scoreEnabled&&!pilots.some(sp=>sp.id===id))
   errors.push('active_score_profile_without_live_pilot:'+id);
 }
 return {status:errors.length?'invalid':'guide-model-consistent-not-field-validated',
  pilots:pilots.length,registrySpots:catalog.spots.length,
  errors,warnings,report};
}
function draft(id,name){
 if(!/^CL-[A-Z]{2}:[a-z0-9-]+$/.test(id)||!name||name.length>100)
  throw Error('Use CL-XX:slug and a non-empty spot name');
 return {
  id,name,
  workflowStage:'candidate-needs-evidence',
  forecastEnabled:false,scoreEnabled:false,
  latitude:null,longitude:null,
  takeoffCoordinates:null,
  coordinateSource:null,
  windFromDeg:null,waveFromDeg:null,
  swellSourceId:null,windSourceId:null,
  bankLocation:null,bankStateObservedAtUtc:null,
  bathymetrySource:null,sedimentMorphology:'unknown',
  localTideDatum:null,verifiedTideResponse:null,
  ripCurrentsObserved:null,environmentalClearance:null,
  observationCount:0,
  calibrationStage:'none',
  validationRequired:[
   'Map coordinates from attributable source (beach centre != takeoff)',
   'Two independent guide sources or one clearly disclosed provisional source',
   'Separate swell FROM and wind FROM sectors; no auto-inference from coastline',
   'Separate environmental, marine and access checks from numerical model score',
   'Cross-check nearshore model station depth, timing and data licence',
   'Observations and chronological holdout before empirical accuracy claims'
  ]
 };
}
if(require.main===module){
 try{
  if(process.argv[2]==='--draft'){
   console.log(JSON.stringify(draft(process.argv[3],process.argv[4]),null,2));process.exit(0);
  }
  const results=validate({live:load('valparaiso-live.config.json'),
   score:load('valparaiso-score.config.json'),catalog:load('regions/CL-VS.json'),
   sources:load('sources.json')});
  console.log(JSON.stringify(results,null,2));
  if(results.errors.length)process.exitCode=1;
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={validate,draft};
