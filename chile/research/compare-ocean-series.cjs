/*
 * FARO scientific ocean-state verification v0.1
 * Offline CSV -> deterministic observed-vs-issued-forecast metrics.
 * No charts scraped; no simulated observations. Only like-for-like source
 * locations, valid times and marine variables should ever be compared.
 * CLI: node chile/research/compare-ocean-series.cjs forecast.csv observations.csv
 * Rows: stationId,source,issuedAtUtc,validAtUtc,heightM,periodS,directionFromDeg
 * issuedAtUtc mandatory for forecasts, empty for observations.
 */
'use strict';
const fs=require('node:fs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const rad=x=>x*Math.PI/180;
const angleDiff=(a,b)=>((a-b+540)%360)-180;
function parseCsv(text){
 const rows=String(text).replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(Boolean);
 if(!rows.length)return [];
 // Scientific archive schema: deliberately reject quoted CSV fields rather
 // than silently parsing metadata with commas using an incorrect parser.
 if(rows.some(x=>x.includes('"')))throw Error('Quoted CSV unsupported; export simple numeric columns');
 const head=rows.shift().split(',').map(s=>s.trim());
 const required=['stationId','source','issuedAtUtc','validAtUtc','heightM','periodS','directionFromDeg'];
 for(const key of required)if(!head.includes(key))throw Error('CSV missing '+key);
 return rows.map((line,i)=>{
  const values=line.split(',').map(x=>x.trim());
  if(values.length!==head.length)throw Error('Column count row '+(i+2));
  const v=Object.fromEntries(head.map((k,j)=>[k,values[j]]));
  if(!v.stationId||!v.source||!/Z$/.test(v.validAtUtc)||!Number.isFinite(Date.parse(v.validAtUtc)))
   throw Error('Station/source/UTC valid time invalid at row '+(i+2));
  if(v.issuedAtUtc&&(!/Z$/.test(v.issuedAtUtc)||!Number.isFinite(Date.parse(v.issuedAtUtc))))
   throw Error('UTC issue time invalid at row '+(i+2));
  for(const n of ['heightM','periodS','directionFromDeg']){
   if(!v[n]||!Number.isFinite(Number(v[n])))throw Error('Invalid '+n+' at row '+(i+2));
   v[n]=Number(v[n]);
  }
  if(v.heightM<0||v.periodS<=0||v.directionFromDeg<0||v.directionFromDeg>=360)
   throw Error('Invalid physical range at row '+(i+2));
  return v;
 });
}
const metrics=(arr)=>arr.length?{
 n:arr.length,bias:arr.reduce((a,b)=>a+b,0)/arr.length,
 mae:arr.reduce((a,b)=>a+Math.abs(b),0)/arr.length,
 rmse:Math.sqrt(arr.reduce((a,b)=>a+b*b,0)/arr.length)
}:null;
function compare(forecast,observations,{maxGapMinutes=30}={}){
 if(!finite(maxGapMinutes)||maxGapMinutes<0||maxGapMinutes>60)
  throw Error('Time tolerance must be 0–60 minutes');
 const obs=new Map();
 for(const o of observations){
  const key=o.stationId;
  if(!obs.has(key))obs.set(key,[]);
  obs.get(key).push(o);
 }
 const diffs={heightM:[],periodS:[],directionFromDeg:[]};
 const events=[],rejects={noStation:0,noTime:0,futureIssue:0,duplicate:0};
 const keys=new Set();
 for(const f of forecast){
  if(!f.issuedAtUtc)throw Error('Forecast issueAtUtc is REQUIRED for no-lookahead validation');
  if(Date.parse(f.issuedAtUtc)>Date.parse(f.validAtUtc)){rejects.futureIssue++;continue;}
  const key=[f.stationId,f.source,f.validAtUtc,f.issuedAtUtc].join('|');
  if(keys.has(key)){rejects.duplicate++;continue;}
  keys.add(key);
  const series=obs.get(f.stationId);
  if(!series){rejects.noStation++;continue;}
  const t=Date.parse(f.validAtUtc);
  const matches=series.map(x=>({row:x,delta:Math.abs(Date.parse(x.validAtUtc)-t)}))
   .filter(x=>x.delta<=maxGapMinutes*60000).sort((a,b)=>a.delta-b.delta);
  if(!matches.length){rejects.noTime++;continue;}
  const o=matches[0].row;
  const dh=f.heightM-o.heightM,dp=f.periodS-o.periodS,
   da=angleDiff(f.directionFromDeg,o.directionFromDeg);
  diffs.heightM.push(dh);diffs.periodS.push(dp);diffs.directionFromDeg.push(da);
  events.push({stationId:f.stationId,source:f.source,validAtUtc:f.validAtUtc,
   leadHours:(t-Date.parse(f.issuedAtUtc))/3600000,observedSource:o.source,
   errors:{heightM:dh,periodS:dp,directionFromDeg:da},
   spatialComparison:'exact-station-id-only-not-breaking-wave-verification'});
 }
 return {status:events.length?'descriptive-ocean-metrics':'no-matched-observations',
  n:events.length,metrics:{
   heightM:metrics(diffs.heightM),
   periodS:metrics(diffs.periodS),
   directionDeg:metrics(diffs.directionFromDeg)
  },rejects,events,
  caveats:['Model cells and measurements must be independently geolocated at equivalent station IDs',
   'No camera, breaking-height, surf-quality, safety or score accuracy is evaluated',
   'Circular direction errors are signed shortest bearings; RMSE is angular dispersion',
   'Issue times are required to prevent evaluating revised forecasts with hindsight']};
}
module.exports={parseCsv,compare,angleDiff};
if(require.main===module){
 try{
  const [forecastPath,observedPath]=process.argv.slice(2);
  if(!forecastPath||!observedPath)throw Error('Usage: node compare-ocean-series.cjs forecast.csv observations.csv');
  const report=compare(parseCsv(fs.readFileSync(forecastPath,'utf8')),
   parseCsv(fs.readFileSync(observedPath,'utf8')));
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(report.n===0)process.exitCode=2;
 }catch(err){console.error(err.message);process.exitCode=1;}
}
