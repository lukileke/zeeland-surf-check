/* FARO v0.5 session decision. Pure, UI/framework-independent safety gate.
 * Potential remains a physical-model index (NEVER overwrite it).
 * A separate actionable index is a conservative product policy, NOT a
 * scientifically validated probability of surf safety or a live official alert.
 */
(function(root){
"use strict";
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const round=x=>Math.round(x*10)/10;
const known=new Set(["none","caution","danger","unknown"]);
function evaluate({potentialScore=null,slotRisk="unknown",access=null,officialAlert=null,modelCoverage="unknown",daylight=true}={}){
 const raw=finite(potentialScore)?Math.max(0,Math.min(10,potentialScore)):null;
 const restricted=access?.publicRecommendationAllowed===false||
   (access?.status==="restriction_reported_not_live_verified"&&access?.clearanceVerified!==true);
 // External official alerts are accepted only with traceable, independently
 // fetched evidence. We DO NOT claim FARO automatically checks these.
 const verified=officialAlert?.verified===true &&
  typeof officialAlert?.authority==="string"&&officialAlert.authority.trim() &&
  /^https:\/\//.test(officialAlert.sourceUrl||"") &&
  !Number.isNaN(Date.parse(officialAlert.checkedAtUtc||""));
 const officialLevel=verified&&known.has(officialAlert?.level)?officialAlert.level:null;
 const risk=known.has(slotRisk)?slotRisk:"unknown";
 const hard=restricted||officialLevel==="danger"||risk==="danger";
 const blocked=hard||!daylight||raw===null||risk==="unknown"||modelCoverage!=="complete";
 const caution=risk==="caution"||officialLevel==="caution";
 // Bounded, explicit conservative *session* policy: when caution is known,
 // cap recommended opportunity at 5.9, but preserve raw offshore potential.
 const adjusted=blocked?null:caution?round(Math.min(raw,5.9)):raw;
 const reasons=[];
 if(restricted)reasons.push("reported_access_restriction");
 if(officialLevel==="danger")reasons.push("verified_official_danger");
 if(risk==="danger")reasons.push("dangerous_model_window");
 if(risk==="unknown")reasons.push("risk_data_incomplete");
 if(!daylight)reasons.push("no_daylight");
 if(raw===null)reasons.push("no_potential_score");
 if(modelCoverage!=="complete")reasons.push("forecast_incomplete");
 if(caution)reasons.push("model_or_official_caution");
 return Object.freeze({
  potentialScore:raw,sessionScore:adjusted,canRecommend:!blocked,
  status:hard?"blocked":blocked?"unassessed":caution?"caution":"eligible",
  reasons,officialAlertChecked:verified,officialLevel,
  safetyProbability:null,confidenceInterval:null,
  policy:"faro-session-policy-v0.5",
  warning:"Advisory gate, not a certified safety forecast; official warnings are not synchronised automatically."
 });
}
root.FaroSessionDecision=Object.freeze({evaluate});
if(typeof module==="object"&&module.exports)module.exports=root.FaroSessionDecision;
})(typeof window!=="undefined"?window:globalThis);
