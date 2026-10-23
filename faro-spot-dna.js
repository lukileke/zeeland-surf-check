/* FARO Spot DNA: local observation prototype (v0.1).
 * This module does NOT alter Surf Quality or assert spot-calibrated accuracy.
 * Stored notes never leave the browser unless a person exports them.
 */
(function (root) {
'use strict';
const VERSION=1;
const KEY='faro-spot-observations-v1';
const MAX_ENTRIES=500;
const catalogue=[
 ['Domburg','Noordduine',51.566,3.489,325],
 ['Domburg','Central beach',51.564,3.496,325],
 ['Domburg','West sector',51.566,3.476,325],
 ['Westkapelle','North beach',51.540,3.435,305],
 ['Westkapelle','Central area',51.528,3.437,290],
 ['Oostkapelle','Main beach',51.585,3.547,330],
 ['Oostkapelle','West sector',51.579,3.528,330],
 ['Cadzand','Cadzand-Bad',51.378,3.382,315],
 ['Cadzand','West sector',51.382,3.365,315],
 ['Brouwersdam','North beach',51.765,3.856,300],
 ['Brouwersdam','Central beach',51.755,3.850,300],
 ['Brouwersdam','South beach',51.742,3.837,300]
].map(([beach,spot,lat,lon,orientation])=>Object.freeze({
 id:beach+'::'+spot,beach,spot,lat,lon,orientation,
 source:'existing FARO location catalogue; unverified spot orientation',
 tideWindow:null,breakingWaveCalibration:null,evidence:'unvalidated'
}));
const validIds=new Set(catalogue.map(p=>p.id));
function read(store=root.localStorage){
 const raw=store.getItem(KEY);
 if(!raw)return [];
 const parsed=JSON.parse(raw);
 if(!Array.isArray(parsed))throw Error('Stored FARO observations have an unsupported format. Export or inspect them before changing anything.');
 return parsed;
}
function validate(data){
 if(!data||!validIds.has(data.spotId))throw Error('Choose a registered Faro spot.');
 if(!['water','shore'].includes(data.observationType))throw Error('Choose how you observed the surf.');
 if(!Number.isInteger(Number(data.quality))||Number(data.quality)<1||Number(data.quality)>5)throw Error('Observed rideability must be 1 to 5.');
 if(!['clean','mixed','choppy','unknown'].includes(data.surface))throw Error('Choose a wave-surface description.');
 const note=String(data.notes||'').trim();
 if(note.length>450)throw Error('Keep the field note below 450 characters.');
 const observedLocal=String(data.observedLocal||'');
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(observedLocal))throw Error('Enter an observed date and local time.');
 const parsed=new Date(observedLocal+':00Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,16)!==observedLocal)throw Error('Invalid local date or time.');
 return {spotId:data.spotId,observationType:data.observationType,quality:Number(data.quality),surface:data.surface,notes:note,
  observedLocal,observationTimeZone:'Europe/Amsterdam'};
}
function save(data,store=root.localStorage,now=new Date()){
 const clean=validate(data);
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
  timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const localNow=parts.year+'-'+parts.month+'-'+parts.day+'T'+parts.hour+':'+parts.minute;
 if(clean.observedLocal>localNow)throw Error('Observed time cannot be in the future.');
 const list=read(store);
 const snap=data.forecastSnapshot&&typeof data.forecastSnapshot==='object'?data.forecastSnapshot:null;
 const finite=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
 const forecastSnapshot=snap?{
  fetchedAt:typeof snap.fetchedAt==='string'?snap.fetchedAt:null,
  modelHour:typeof snap.modelHour==='string'?snap.modelHour:null,
  quality:finite(snap.quality),height:finite(snap.height),
  period:finite(snap.period),wind:finite(snap.wind),
  direction:finite(snap.direction),
  type:'Open-Meteo model estimate; not measured surf'
 }:null;
 const observation={schemaVersion:VERSION,id:'field-'+now.getTime()+'-'+Math.random().toString(36).slice(2,9),
  recordedAt:now.toISOString(),...clean,forecastSnapshot};
 const next=[...list,observation].slice(-MAX_ENTRIES);
 store.setItem(KEY,JSON.stringify(next));
 return observation;
}
function summary(spotId,store=root.localStorage){
 const rows=read(store).filter(row=>row.spotId===spotId);
 return {count:rows.length,mean:rows.length?rows.reduce((sum,row)=>sum+Number(row.quality),0)/rows.length:null};
}
function clear(store=root.localStorage){store.removeItem(KEY);}
function exportData(store=root.localStorage){
 return JSON.stringify({schema:'FARO_FIELD_OBSERVATIONS',schemaVersion:VERSION,exportedAt:new Date().toISOString(),
  privacy:'Local observations only; no server submission',observations:read(store)},null,2);
}
root.FaroSpotDNA=Object.freeze({VERSION,KEY,catalogue,validate,read,save,summary,clear,exportData});
})(typeof globalThis!=='undefined'?globalThis:this);
