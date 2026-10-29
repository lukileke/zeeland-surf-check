/* FARO offline empirical-calibration lab · research only, no deployment.
 * Reads reviewed, rights-cleared manual visual observations and frozen prior
 * forecasts. Does not load, record, download or train on webcam imagery.
 * Requires a human review manifest; screenshots/paid camera data are NOT input.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const features=['swellHeightM','swellPeriodS','swellFromDeg','windKmh','windFromDeg'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const epoch=s=>typeof s==='string'&&/(Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s))?Date.parse(s):null;
const arity=11;
const groupDays=3;
function vector(f){
 if(!features.every(k=>finite(f?.[k])))return null;
 const sh=f.swellHeightM,sp=f.swellPeriodS,w=f.windKmh,g=finite(f.gustKmh)?f.gustKmh:w;
 if(sh<0||sh>16||sp<1||sp>35||w<0||w>150||g<0||g>180)return null;
 const sw=f.swellFromDeg*Math.PI/180,wind=f.windFromDeg*Math.PI/180;
 return [sh,sp,sh*sh*sp/50,w,g,Math.sin(sw),Math.cos(sw),Math.sin(wind),
  Math.cos(wind),sh*w/20,finite(f.waveHeightM)?f.waveHeightM:sh];
}
function reviewable(record,approval){
 const reasons=[];
 if(!record?.observationId||!approval||approval.observationId!==record.observationId||
    approval.qualityStatus!=='accepted'||typeof approval.reviewer!=='string'||approval.reviewer.length<2||
    epoch(approval.reviewedAtUtc)===null)reasons.push('missing_human_review');
 const t=epoch(record?.observedAtUtc),f=record?.forecast;
 if(t===null||epoch(f?.ingestedAtUtc)===null||epoch(f?.ingestedAtUtc)>t||
    epoch(f?.validAtUtc)===null||Math.abs(epoch(f?.validAtUtc)-t)>65*60*1000)
    reasons.push('not_temporally_matched_prior_forecast');
 if(!record.spotId||!f?.forecastId||!f?.spotId)reasons.push('missing_spot_or_forecast_identity');
 else if(record.spotId!==f.spotId)reasons.push('forecast_spot_mismatch');
 if(epoch(f?.issuedAtUtc)!==null&&t!==null&&epoch(f.issuedAtUtc)>t)
  reasons.push('forecast_issued_after_observation');
 const l=record.labels;
 if(!Number.isInteger(l?.waveCount)||l.waveCount<3||
    !Number.isInteger(l?.rideability1to5)||l.rideability1to5<1||l.rideability1to5>5||
    !Number.isInteger(l?.surfableWaveCount)||l.surfableWaveCount<0||l.surfableWaveCount>l.waveCount||
    !finite(l?.closeoutFraction)||l.closeoutFraction<0||l.closeoutFraction>1||
    !finite(record.observationWindowSeconds)||record.observationWindowSeconds<300)
    reasons.push('incomplete_or_short_observation');
 if(!vector(f?.features))reasons.push('missing_core_forecast_features');
 if(record.observationType==='manual_external_camera_observation'){
  if(approval?.dataRightsStatus!=='manual_derived_facts_reviewed'||record.captureAssetId!==null)
   reasons.push('uncleared_manual_derived_data_rights');
 }else if(record.observationType==='manual_video_annotation'){
  if(approval?.dataRightsStatus!=='written_training_licence_verified'||
     typeof approval?.permissionDocumentId!=='string'||!approval.permissionDocumentId)
   reasons.push('missing_authorised_video_training_rights');
 }else reasons.push('unknown_observation_type');
 return reasons;
}
function solve(A,b){
 const n=b.length,M=A.map((row,i)=>[...row,b[i]]);
 for(let k=0;k<n;k++){
  let pivot=k;
  for(let j=k+1;j<n;j++)if(Math.abs(M[j][k])>Math.abs(M[pivot][k]))pivot=j;
  if(Math.abs(M[pivot][k])<1e-10)throw Error('Rank deficient regression');
  [M[k],M[pivot]]=[M[pivot],M[k]];
  const v=M[k][k];for(let j=k;j<=n;j++)M[k][j]/=v;
  for(let i=0;i<n;i++)if(i!==k){
   const f=M[i][k];for(let j=k;j<=n;j++)M[i][j]-=f*M[k][j];
  }
 }
 return M.map(row=>row[n]);
}
function trainRidge(rows,target,lambda=7){
 const dim=arity,mu=Array(dim).fill(0),sd=Array(dim).fill(0);
 for(const {x}of rows)for(let j=0;j<dim;j++)mu[j]+=x[j]/rows.length;
 for(const {x}of rows)for(let j=0;j<dim;j++)sd[j]+=(x[j]-mu[j])**2/rows.length;
 for(let j=0;j<dim;j++)sd[j]=Math.sqrt(sd[j])||1;
 const size=dim+1,gram=Array.from({length:size},()=>Array(size).fill(0));
 const rhs=Array(size).fill(0);
 for(const row of rows){
  const z=[1,...row.x.map((v,i)=>(v-mu[i])/sd[i])],y=row.y[target];
  for(let j=0;j<size;j++){
   rhs[j]+=z[j]*y;
   for(let k=0;k<size;k++)gram[j][k]+=z[j]*z[k];
  }
 }
 for(let j=1;j<size;j++)gram[j][j]+=lambda;
 const coef=solve(gram,rhs);
 return {mean:mu,std:sd,coefficients:coef};
}
function predict(model,x,target){
 const v=model.coefficients[0]+x.reduce((total,f,j)=>
  total+(f-model.mean[j])/model.std[j]*model.coefficients[j+1],0);
 return target==='rideability'?clamp(v,1,5):target==='closeout'?clamp(v,0,1):Math.max(0,v);
}
function mae(actual,pred){return actual.reduce((s,v,i)=>s+Math.abs(v-pred[i]),0)/actual.length}
function calibrate(observations,manifest,options={}){
 const approvals=new Map(manifest.map(x=>[x.observationId,x])),seen=new Set(),rejected={},bySpot=new Map();
 for(const record of observations){
  if(seen.has(record.observationId)){rejected.duplicate_observation_id=(rejected.duplicate_observation_id||0)+1;continue}
  seen.add(record.observationId);
  const fail=reviewable(record,approvals.get(record.observationId));
  if(fail.length){for(const reason of fail)rejected[reason]=(rejected[reason]||0)+1;continue}
  const x=vector(record.forecast.features),y={
   rideability:record.labels.rideability1to5,
   closeout:record.labels.closeoutFraction,
   frequency:record.labels.surfableWaveCount*600/record.observationWindowSeconds
  };
  const time=epoch(record.observedAtUtc);
  const group=record.spotId+':'+Math.floor(time/(groupDays*86400000));
  if(!bySpot.has(record.spotId))bySpot.set(record.spotId,[]);
  bySpot.get(record.spotId).push({id:record.observationId,time,group,x,y,
   features:record.forecast.features});
 }
 const results={schemaVersion:'0.2.0',researchOnly:true,deployed:false,usesImagePixels:false,
  publicationPolicy:'human-reviewed-observations-only; held-out event-days; NO automatic public score updates',
  reviewedLabels: [...bySpot.values()].reduce((n,a)=>n+a.length,0),
  rejectedReasons:rejected,requiredMinimums:{observations:options.minObservations??60,
   eventGroups:options.minGroups??15},spots:{}};
 for(const [spotId,rows]of bySpot){
  rows.sort((a,b)=>a.time-b.time);
  const groups=[...new Set(rows.map(x=>x.group))];
  if(rows.length<(options.minObservations??60)||groups.length<(options.minGroups??15)){
   results.spots[spotId]={status:'not_enough_independent_observations',samples:rows.length,
    eventGroups:groups.length,trainingPerformed:false};
   continue;
  }
  const boundary=Math.max(1,Math.floor(groups.length*.75));
  const trainGroups=new Set(groups.slice(0,boundary));
  const train=rows.filter(x=>trainGroups.has(x.group)),test=rows.filter(x=>!trainGroups.has(x.group));
  if(test.length<Math.max(8,Math.ceil(rows.length*.1))){
   results.spots[spotId]={status:'insufficient_future_holdout',samples:rows.length,
    eventGroups:groups.length,trainingPerformed:false};continue;
  }
  const evaluation={},models={};
  // Optional explicit FARO score baseline: never train on its own outputs as
  // if they were observed surf quality. This is only a frozen, prespecified
  // score-to-ordinal mapping for comparing against human-reviewed labels.
  const cfg=options.scoreProfileConfig;
  const scoreFn=options.scoreEvaluator;
  if(cfg&&typeof scoreFn==='function'&&cfg.profiles?.[spotId]){
   const predicted=[],observed=[];
   for(const record of test){
    const forecast=scoreFn(cfg,spotId,record.features,{locale:'en'});
    if(!finite(forecast.score))continue;
    predicted.push(clamp(1+.4*forecast.score,1,5));
    observed.push(record.y.rideability);
   }
   evaluation.existingFaroPotential={
    evaluated:predicted.length===test.length&&test.length>0,
    samples:predicted.length,ordinalMapping:'predefined_1_plus_0.4_times_score_not_empirical_fit',
    mae:predicted.length===test.length?mae(observed,predicted):null,
    forecastSkillClaim:false
   };
  }
  for(const target of ['rideability','closeout','frequency']){
   const model=trainRidge(train,target);
   models[target]=model;
   const observed=test.map(x=>x.y[target]),estimated=test.map(x=>predict(model,x.x,target));
   const baseline=train.reduce((sum,x)=>sum+x.y[target],0)/train.length;
   const constant=observed.map(()=>baseline);
   evaluation[target]={mae:mae(observed,estimated),constantBaselineMae:mae(observed,constant),
    improvesOverConstant:mae(observed,estimated)<mae(observed,constant)};
  }
  const pass=evaluation.rideability.improvesOverConstant&&
   evaluation.closeout.improvesOverConstant;
  const comparison=evaluation.existingFaroPotential;
  const beatsExisting=(!comparison||!comparison.evaluated)?null:
   evaluation.rideability.mae<comparison.mae;
  results.spots[spotId]={status:pass?'research_model_beats_constant_baseline':'research_model_fails_baseline',
   beatsFrozenFaroOrdinalBaseline:beatsExisting,
   eligibleForLiveDeployment:false,
   modelUpgradeDecision:'requires_independent_multiseason_validation_and_human_review',
   samples:rows.length,eventGroups:groups.length,train:train.length,
   holdout:test.length,holdoutEventGroups:groups.length-boundary,
   evaluation,models,trainingPerformed:true,
   disclaimer:'Provisional 3-day chronological event grouping. Not camera vision, validated breaking surf or safe-to-enter prediction.'};
 }
 return results;
}
function lines(p){return fs.readFileSync(p,'utf8').split(/\r?\n/).filter(x=>x.trim()).map((x,i)=>{
  try{return JSON.parse(x)}catch(e){throw Error('Invalid JSONL line '+(i+1))}
 })}
if(require.main===module){
 const [obs,approvals,out]=process.argv.slice(2);
 if(!obs||!approvals||!out){process.stderr.write('Usage: node chile/calibrate-observations.cjs observations.jsonl human-reviewed-approvals.jsonl private-result.json\n');process.exitCode=2}
 else{
  const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'valparaiso-score.config.json'),'utf8'));
  require('./valparaiso-score-lab.js');
  const output=calibrate(lines(obs),lines(approvals),{
   scoreProfileConfig:cfg,scoreEvaluator:globalThis.FaroChileScoreLab.evaluate
  });
  fs.writeFileSync(out,JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(output.spots).map(([id,s])=>
   [id,{status:s.status,samples:s.samples,eventGroups:s.eventGroups,evaluation:s.evaluation}])),null,2)+'\n');
 }
}
module.exports={calibrate,reviewable,vector,trainRidge,predict};
