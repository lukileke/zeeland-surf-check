/* Read-only FARO lab: no camera capture, no automatic score publication.
 * Match reviewed, rights-cleared observations to forecasts issued BEFORE the
 * session. Uses existing chronological held-out ridge-vs-constant-vs-FARO lab.
 */
const fs=require("node:fs"),path=require("node:path");
const Registry=require("../faro-spot-registry.js");
const {calibrate}=require("../calibrate-observations.cjs");
require("../valparaiso-score-lab.js");
const basedir=path.join(__dirname,"..");
const live=JSON.parse(fs.readFileSync(path.join(basedir,"valparaiso-live.config.json"),"utf8"));
const cfg=JSON.parse(fs.readFileSync(path.join(basedir,"valparaiso-score.config.json"),"utf8"));
const intel=JSON.parse(fs.readFileSync(path.join(basedir,"spot-intelligence.json"),"utf8"));
function evaluate(records=[],approvals=[]){
 const spots=Registry.build({live,score:cfg,intelligence:intel});
 const inventory=Registry.audit(spots);
 const report=calibrate(records,approvals,{
  scoreProfileConfig:cfg,
  scoreEvaluator:globalThis.FaroChileScoreLab.evaluate,
  minObservations:60,minGroups:15
 });
 return {
  schemaVersion:"faro-research-v0.1",
  producedAtUtc:new Date().toISOString(),
  accessToRealTimeOfficialWarnings:false,
  rankedForecastSkillValidated:false,
  autoPublish:false,
  scoreRevisionCreated:false,
  registry:{count:spots.length,...inventory},
  findings:report,
  requiredBeforeRelease:[
   "rights and time provenance checked",
   "independent future event/season validation",
   "beat both constant and frozen FARO baselines",
   "human model and safety review",
   "separate coast/bank surveys where claims require them"
  ]
 };
}
function loadLines(file){
 return fs.readFileSync(file,"utf8").split(/\r?\n/).filter(x=>x.trim()).map(x=>JSON.parse(x));
}
if(require.main===module){
 const [obs,manifest,out]=process.argv.slice(2);
 if(!obs||!manifest||!out){
  console.error("Usage: node chile/research/spot-learning-report.cjs OBS.jsonl APPROVALS.jsonl OUTPUT.json");
  process.exit(2);
 }
 fs.writeFileSync(out,JSON.stringify(evaluate(loadLines(obs),loadLines(manifest)),null,2)+"\n");
 console.log("Private, read-only evaluation written. No public score updated.");
}
module.exports={evaluate};
