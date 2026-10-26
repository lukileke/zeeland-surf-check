/* FARO Wave science research baseline.
 * This IS fitted to 9,000 actual published aggregate class labels.
 * It IS NOT a video neural network, nor a Chilean surfability forecast.
 * DO NOT wire models into public numerical scores. No camera material is read.
 */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const sourcePath=path.join(__dirname,"research","breaking-types-published-aggregates.json");
const labels=["plunging","spilling","surging"];
function sum(x){return x.reduce((a,b)=>a+b,0)}
function distribution(counts,alpha=1){const total=sum(counts)+alpha*counts.length;
 return counts.map(n=>(n+alpha)/total)}
function crossEntropy(trueCounts,probs){
 const n=sum(trueCounts);return -trueCounts.reduce((s,c,i)=>s+(c/n)*Math.log(probs[i]),0)
}
function evaluate(dataset){
 if(JSON.stringify(dataset.labels)!==JSON.stringify(labels))throw Error("Unknown categories");
 const sites=dataset.sites;
 const pooled=labels.map((_,j)=>sum(sites.map(s=>s.counts[j])));
 if(sum(pooled)!==9000||sites.length!==6)throw Error("Published table does not sum to 9000");
 const overall=distribution(pooled);
 const bySite=Object.fromEntries(sites.map(s=>[s.id,{
  samples:sum(s.counts),probabilities:distribution(s.counts),
  majorityClass:labels[s.counts.indexOf(Math.max(...s.counts))]
 }]));
 const leaveOneSiteOut=sites.map(test=>{
  const train=labels.map((_,j)=>sum(sites.filter(s=>s.id!==test.id).map(s=>s.counts[j])));
  const predicted=distribution(train);
  const logLoss=crossEntropy(test.counts,predicted);
  const uniformLoss=Math.log(3);
  return {heldOutSite:test.id,samples:sum(test.counts),classFractions:test.counts.map(c=>c/sum(test.counts)),
   logLoss,uniformBaselineLogLoss:uniformLoss,beatsUniform:logLoss<uniformLoss};
 });
 const weightedLoss=leaveOneSiteOut.reduce((v,x)=>v+x.samples*x.logLoss,0)/9000;
 return {schemaVersion:"0.1.0",sourceDoi:dataset.doi,trainedOn:"published_tabulated_label_counts",
  trainingLabels:9000,trainingVideos:0,trainingImages:0,trainedBreakingVideoModel:false,
  target:"wave_breaking_type_categorical_prior",notTargets:["closeout","rideable_wall","La_Boca_quality","FARO_score"],
  labels,overallPrior:overall,bySite,leaveOneSiteOut,
  acrossUnseenSites:{meanLogLoss:weightedLoss,uniformBaselineLogLoss:Math.log(3),
   beatsUniform:weightedLoss<Math.log(3)},
  deployable:false,disclaimer:"Actual fitted categorical priors, NOT visual wave recognition, Chilean surf quality, or transfer-tested predictions."};
}
function main(){
 const data=JSON.parse(fs.readFileSync(sourcePath,"utf8"));
 const out=evaluate(data);
 const target=process.argv[2];
 if(target)fs.writeFileSync(target,JSON.stringify(out,null,2)+"\n",{flag:"wx"});
 process.stdout.write(JSON.stringify({trainingLabels:out.trainingLabels,overallPrior:out.overallPrior,
  leaveOneSiteOut:out.acrossUnseenSites,deployable:out.deployable},null,2)+"\n");
}
if(require.main===module)main();
module.exports={evaluate,distribution,crossEntropy};
