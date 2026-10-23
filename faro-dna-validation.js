/* FARO DNA Lab — observational model diagnostics, not a production scorer.
 * Compares local notes only with snapshot forecasts demonstrably fetched
 * before the reported session time. Never modifies live Surf Quality.
 * Future backend calibration requires holdouts by independent dates/storms.
 */
(function(root){
'use strict';
function localTime(dateString){
 const date=new Date(dateString);
 if(!Number.isFinite(date.getTime()))return null;
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 return parts.year+'-'+parts.month+'-'+parts.day+'T'+parts.hour+':'+parts.minute;
}
function pair(row){
 if(!row||!row.forecastSnapshot||!row.observedLocal)return null;
 const f=row.forecastSnapshot;
 if(typeof f.fetchedAt!=='string'||typeof f.modelHour!=='string')return null;
 const issue=localTime(f.fetchedAt),observed=row.observedLocal;
 // During Europe's DST fallback, local 02:xx is ambiguous without offset;
 // exclude it until timestamps can be disambiguated.
 const ambiguous=observed.endsWith('T02:'+observed.slice(-2))&&(
  // Month-end October ambiguity is tested conservatively for all 02xx local observations.
  observed.slice(5,7)==='10'&&Number(observed.slice(8,10))>=25
 );
 if(ambiguous||!issue||issue>observed||f.modelHour.slice(0,13)!==observed.slice(0,13))return null;
 if(!Number.isFinite(f.quality)||f.quality<0||f.quality>10)return null;
 const q=Number(row.quality);
 if(!Number.isInteger(q)||q<1||q>5)return null;
 return {id:row.id||'',spotId:row.spotId,day:observed.slice(0,10),
         model:f.quality,observed:q,modelHour:f.modelHour,forecastFetchedAt:f.fetchedAt};
}
function evaluate(list,spotId){
 const rows=(Array.isArray(list)?list:[]).filter(x=>!spotId||x.spotId===spotId);
 const paired=rows.map(pair).filter(Boolean);
 let positive=0,negative=0,ties=0;
 for(let i=0;i<paired.length;i++)for(let j=i+1;j<paired.length;j++){
  // Ranking comparisons are a research diagnostic, not probability forecasts.
  const a=paired[i],b=paired[j];if(a.day===b.day)continue;
  const dModel=Math.sign(a.model-b.model),dHuman=Math.sign(a.observed-b.observed);
  if(!dModel||!dHuman){ties++;continue}
  if(dModel===dHuman)positive++;else negative++;
 }
 const comparable=positive+negative;
 return {
  total:rows.length,paired:paired.length,independentDays:new Set(paired.map(x=>x.day)).size,
  concordantPairs:positive,discordantPairs:negative,tiedPairs:ties,
  directionalAgreement:comparable>=10?positive/comparable:null,
  evidenceStatus:comparable>=10?'pilot-diagnostic-only':'insufficient-ordered-pairs',
  message:'Ordinal rank diagnostic. Not validated per-spot accuracy, probability or beach safety.'
 };
}
root.FaroDNAValidation=Object.freeze({localTime,pair,evaluate});
})(typeof globalThis!=='undefined'?globalThis:this);
