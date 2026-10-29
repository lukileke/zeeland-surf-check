/*
 * FARO Open-Meteo snapshot archive. Node >=20, explicit network action.
 * Raw provider values, no observational inference or fitted parameters.
 * CLI: node chile/research/capture-open-meteo.cjs output-directory
 * Provider usage/redistribution terms must be checked before scheduling
 * or making captured artifacts public. No automatic UV/SHOA download.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
require('../faro-chile-live.js');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'../valparaiso-live.config.json'),'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function get(url){
 const response=await fetch(url,{headers:{'Accept':'application/json'},
  signal:AbortSignal.timeout(25000)});
 if(!response.ok){const err=Error('HTTP '+response.status+' from Open-Meteo');err.code=response.status;throw err;}
 return response.json();
}
async function run(outDir){
 if(!outDir)throw Error('Output directory required (no network on --help)');
 fs.mkdirSync(outDir,{recursive:true});
 const archive={schema:'faro-open-meteo-snapshot-v1',
  capturedAtUtc:new Date().toISOString(),issueAtUtc:null,
  issuePolicy:'capture time is NOT original model issue time',
  marineModel:'Open-Meteo sea grid (not measured break)',
  uvNearshore:'not_integrated_visual_source_only',
  shoaObservations:'not_fetched_request_or_import_required',
  spots:[]};
 for(const spot of cfg.pilots){
  const urls=globalThis.FaroChileLive.buildUrls(spot,cfg);
  let marine,fallback=false;
  try{marine=await get(urls.marine)}
  catch(e){
   if(e.code!==400||!cfg.modelProviders.optionalMarineVariables?.length)throw e;
   const url=new URL(urls.marine);
   url.searchParams.set('hourly',cfg.modelProviders.requiredVariables.marine.join(','));
   marine=await get(url.toString());fallback=true;
  }
  const weather=await get(urls.weather);
  archive.spots.push({spotId:spot.id,reference:{lat:spot.latitude,lon:spot.longitude,
   status:spot.coordinateStatus},marineGrid:{lat:marine.latitude,lon:marine.longitude},
   weatherGrid:{lat:weather.latitude,lon:weather.longitude},
   optionalSwellFallback:fallback,marine,weather,
   disclaimer:'These are raw offshore and atmosphere model grid data, NOT breaking waves or safety'});
  await sleep(300);
 }
 const bytes=Buffer.from(JSON.stringify(archive,null,2)+'\n','utf8');
 const file=path.join(outDir,'faro-raw-'+archive.capturedAtUtc.replace(/[:.]/g,'-')+'.json');
 fs.writeFileSync(file,bytes);
 const receipt={path:file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),
  spots:archive.spots.map(s=>s.spotId),capturedAtUtc:archive.capturedAtUtc,
  dataSource:'Open-Meteo',validatedOceanState:false,validatedSurfQuality:false};
 console.log(JSON.stringify(receipt,null,2));
 return receipt;
}
if(require.main===module)run(process.argv[2]).catch(e=>{
 console.error(e.stack||String(e));process.exitCode=1;
});
module.exports={run};
