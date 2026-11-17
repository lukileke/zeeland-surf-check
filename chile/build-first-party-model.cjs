/* FARO Chile: verified same-origin Open-Meteo snapshot for browsers that cannot
 * reach third-party marine/weather domains. NOT a buoy or surf observation.
 * Non-commercial research only; review upstream terms before monetisation.
 * This script is an action, not a browser script. No synthetic forecast values.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
require('./valparaiso-score-lab.js');
require('./faro-chile-live.js');
const Live=globalThis.FaroChileLive;
const config=JSON.parse(fs.readFileSync(path.join(__dirname,'valparaiso-live.config.json'),'utf8'));
const profiles=JSON.parse(fs.readFileSync(path.join(__dirname,'valparaiso-score.config.json'),'utf8'));
const output=path.join(__dirname,'data','faro-model-snapshot.json');
async function capture(spot){
 const raw={marine:null,weather:null};
 const observed=async(url,options={})=>{
  const endpoint=new URL(url);
  if(!['marine-api.open-meteo.com','api.open-meteo.com'].includes(endpoint.hostname))
   throw Error('Unrecognised model endpoint: '+endpoint.hostname);
  const response=await fetch(url,{...options,headers:{Accept:'application/json'}});
  if(!response.ok)return response;
  const data=await response.json();
  const kind=endpoint.hostname==='marine-api.open-meteo.com'?'marine':'weather';
  raw[kind]=data;
  return {ok:true,status:response.status,headers:response.headers,json:async()=>data};
 };
 const result=await Live.fetchSpot(config,spot,profiles,observed,'es');
 if(!raw.marine||!raw.weather||!result.model.coverage.completeSlots)
  throw Error('Incomplete authentic model for '+spot.id);
 return {capturedAtUtc:new Date().toISOString(),marine:raw.marine,weather:raw.weather};
}
async function main(){
 if(process.env.FARO_RESEARCH_NONCOMMERCIAL_ACK!=='true')
  throw Error('Explicit Open-Meteo noncommercial usage acknowledgement required');
 // Keep last known authentic data on one-spot failure, but never relabel it fresh.
 let old=null;
 try{old=JSON.parse(fs.readFileSync(output,'utf8'))}catch{}
 const spots={};const errors=[];
 for(const spot of config.pilots){
  try{
   spots[spot.id]=await capture(spot);
   console.log('Captured '+spot.id+' · '+spots[spot.id].capturedAtUtc);
  }catch(err){
   errors.push({spot:spot.id,error:String(err.message||err)});
   const previous=old?.spots?.[spot.id];
   const age=Date.now()-Date.parse(previous?.capturedAtUtc||'');
   if(Number.isFinite(age)&&age>=0&&age<6*60*60*1000&&previous.marine&&previous.weather){
    spots[spot.id]=previous;
    console.warn('Retaining labelled prior snapshot for '+spot.id);
   }else console.warn('No verified model for '+spot.id+': '+String(err.message||err));
  }
 }
 // Do not replace an existing usable snapshot with an empty file.
 if(!spots[config.pilots[0].id]||Object.keys(spots).length<3)
  throw Error('Insufficient valid pilot data, declining to publish: '+JSON.stringify(errors));
 const payload={
  schema:1,region:'CL-VS',source:'Open-Meteo',
  generatedAtUtc:new Date().toISOString(),
  sourcePolicy:'Modelled offshore, not observed breaking waves or official alerts',
  spots
 };
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(payload)+'\n','utf8');
 console.log('Verified snapshot: '+Object.keys(spots).length+'/'+config.pilots.length+
  ' spots; '+fs.statSync(output).size+' bytes; '+errors.length+' provider warnings');
}
if(require.main===module)main().catch(e=>{console.error(e.stack||String(e));process.exitCode=1});
module.exports={capture};
