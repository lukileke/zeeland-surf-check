/* FARO · Camera observation × forecast snapshot dataset (offline only).
 * NO fetching/recording webcams, NO training on proprietary media.
 * Source-level rights must be verified and data acquired BEFORE observation.
 * The only ML input here is labelled metadata; pixel features require
 * separate, explicitly licensed, privacy-filtered source video.
 */
'use strict';
const fs=require('node:fs');
function epoch(iso){if(typeof iso!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(iso))return null;const t=Date.parse(iso);return Number.isFinite(t)?t:null}
function finite(x){return typeof x==='number'&&Number.isFinite(x)}
function dayId(time){return new Date(time).toISOString().slice(0,10)}
function deny(reason,counts){counts[reason]=(counts[reason]||0)+1}
const FEATURES=['swellHeightM','swellPeriodS','swellFromDeg','windKmh','windFromDeg','gustKmh','waveHeightM','wavePeriodS','secondarySwellHeightM','secondarySwellPeriodS','secondarySwellFromDeg','rainMm','tideLevelM'];
const LABELS=['rideability1to5','waveCount','surfableWaveCount','closeoutFraction','medianWaveFaceSeconds','surface','visibility','bankNotes'];
function allowed(camera){
 return camera?.trainingRights==='written_training_permission_verified'&&
  camera?.automatedCapturePermitted===true&&camera?.permissionDocumentId&&
  camera?.privacyPolicyReviewed===true;
}
function validLabels(label){
 if(!label||!Number.isInteger(label.rideability1to5)||label.rideability1to5<1||label.rideability1to5>5)return false;
 if(!Number.isInteger(label.waveCount)||label.waveCount<0)return false;
 if(!Number.isInteger(label.surfableWaveCount)||label.surfableWaveCount<0||label.surfableWaveCount>label.waveCount)return false;
 if(!finite(label.closeoutFraction)||label.closeoutFraction<0||label.closeoutFraction>1)return false;
 if(label.medianWaveFaceSeconds!==null&&label.medianWaveFaceSeconds!==undefined&&(!finite(label.medianWaveFaceSeconds)||label.medianWaveFaceSeconds<0))return false;
 if(label.visibility==='unusable'||label.visibility==='unknown')return false;
 return true;
}
function pair(observations,forecasts,cameras,opts={}){
 const camMap=new Map((cameras.sources||[]).map(x=>[x.id,x]));
 const counts={};
 const records=[];
 const windowMs=(opts.maxValidDeltaMinutes??60)*60000;
 for(const o of observations){
  const cam=camMap.get(o.cameraId),at=epoch(o.observedAtUtc);
  if(!allowed(cam)){deny('source_not_licensed_for_training',counts);continue}
  if(!at||o.spotId!==cam.spotId){deny('invalid_time_or_spot',counts);continue}
  if(o.privacyProcessed!==true||o.mediaConsentScope!=='ml_training_approved'){deny('privacy_or_media_rights_not_confirmed',counts);continue}
  if(!validLabels(o.labels)){deny('invalid_labels',counts);continue}
  const matches=forecasts.filter(f=>{
   const issued=epoch(f.issuedAtUtc),ingested=epoch(f.ingestedAtUtc),valid=epoch(f.validAtUtc);
   return f.spotId===o.spotId&&issued!==null&&ingested!==null&&valid!==null&&
     issued<=ingested&&ingested<=at&&issued<=at&&
     Math.abs(valid-at)<=windowMs&&
     f.source&&FEATURES.slice(0,5).every(key=>finite(f.features?.[key]));
  }).sort((a,b)=>epoch(b.issuedAtUtc)-epoch(a.issuedAtUtc)||Math.abs(epoch(a.validAtUtc)-at)-Math.abs(epoch(b.validAtUtc)-at));
  if(!matches.length){deny('no_prior_valid_forecast_snapshot',counts);continue}
  const f=matches[0];
  const features=Object.fromEntries(FEATURES.map(k=>[k,finite(f.features[k])?f.features[k]:null]));
  const labels=Object.fromEntries(LABELS.map(k=>[k,o.labels[k]??null]));
  records.push({
   observationId:o.observationId,cameraId:o.cameraId,spotId:o.spotId,
   observedAtUtc:o.observedAtUtc,forecastId:f.forecastId,issuedAtUtc:f.issuedAtUtc,
   validAtUtc:f.validAtUtc,forecastSource:f.source,forecastModel:f.model||null,
   cameraPermissionDocumentId:cam.permissionDocumentId,
   captureAssetId:o.captureAssetId,roiVersion:o.roiVersion||null,labels,features
  });
 }
 // Keep same 3-day event in one split. Later replace this with actual swell
 // event segmentation, grouping all windows of one storm for leakage control.
 const daysPerGroup=opts.daysPerGroup??3,epochStart=Date.UTC(2020,0,1);
 const groupOf=r=>r.spotId+':'+Math.floor((epoch(r.observedAtUtc)-epochStart)/(daysPerGroup*86400000));
 const byGroup=new Map();
 for(const row of records){
  const g=groupOf(row);row.eventGroup=g;
  if(!byGroup.has(g))byGroup.set(g,[]);
  byGroup.get(g).push(row);
 }
 const groups=[...byGroup.entries()].sort((a,b)=>Math.min(...a[1].map(x=>epoch(x.observedAtUtc)))-
  Math.min(...b[1].map(x=>epoch(x.observedAtUtc))));
 const minGroups=opts.minimumEventGroups??5;
 const splitReady=groups.length>=minGroups;
 const trainGroups=splitReady?Math.max(1,Math.min(groups.length-1,Math.floor(groups.length*.8))):groups.length;
 const trainIds=new Set(groups.slice(0,trainGroups).map(x=>x[0]));
 for(const row of records)row.split=splitReady?(trainIds.has(row.eventGroup)?'train':'holdout'):'research_only_not_train_ready';
 const summary={observations:observations.length,paired:records.length,excluded:counts,
  eventGroups:groups.length,splitReady,train:records.filter(x=>x.split==='train').length,
  holdout:records.filter(x=>x.split==='holdout').length,
  note:'Research labels and provisional 3-day splits, NOT a trained/validated surf forecasting model. Only authorised media and temporally prior forecasts can enter.'};
 return {summary,records};
}
function readJsonl(path){return fs.readFileSync(path,'utf8').split(/\r?\n/).filter(x=>x.trim()).map((x,i)=>{try{return JSON.parse(x)}catch(err){throw Error('Invalid JSONL line '+(i+1)+' in '+path)}})}
if(require.main===module){
 const args=process.argv.slice(2);const a=name=>{const i=args.indexOf(name);return i<0?null:args[i+1]};
 const catalog=a('--catalog'),obs=a('--observations'),fc=a('--forecasts'),out=a('--out');
 if(!catalog||!obs||!fc||!out){
  process.stderr.write('Usage: node chile/camera-learning.cjs --catalog camera-sources.json --observations authorised-observations.jsonl --forecasts forecast-snapshots.jsonl --out paired.json\n');
  process.exitCode=2;
 }else{
  const result=pair(readJsonl(obs),readJsonl(fc),JSON.parse(fs.readFileSync(catalog,'utf8')));
  fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  process.stdout.write(JSON.stringify(result.summary,null,2)+'\n');
 }
}
module.exports={pair,allowed,validLabels,epoch};
