/* FARO Chile catalog loader — dormant until Chile deployment.
 * No production UI automatically imports this file.
 * Loading catalogue records never invokes surf-engine.js or scores a wave.
 */
(function(root){
'use strict';
const base='chile/';
async function readJSON(url,fetchFn){
 const response=await fetchFn(url);
 if(!response||!response.ok)throw Error('FARO Chile resource unavailable: '+url);
 return response.json();
}
async function load({fetcher,basePath=base}={}){
 const f=fetcher||((url)=>fetch(url,{cache:'no-store'}));
 const prefix=basePath.endsWith('/')?basePath:basePath+'/';
 const [manifest,sourceRegistry]=await Promise.all([
  readJSON(prefix+'regions.json',f),
  readJSON(prefix+'sources.json',f)
 ]);
 if(manifest.active!==false||manifest.country!=='CL')throw Error('Chile must remain inactive at research stage');
 const regionDocs=await Promise.all(manifest.regions.map(r=>readJSON(prefix+r.file,f)));
 const seen=new Set();
 const regions=regionDocs.map((d,i)=>{
  const m=manifest.regions[i];
  if(d.regionCode!==m.code||d.spots.length!==m.spotCount||d.forecastEnabled!==false)
   throw Error('Chile region mismatch: '+m.code);
  for(const s of d.spots){
   if(seen.has(s.id))throw Error('Duplicate Chile spot '+s.id);
   seen.add(s.id);
   if(s.forecastEnabled!==false||s.coordinates!==null||s.conditions.idealTide!==null)
    throw Error('Chile candidate must not show a live model or calibrated tide: '+s.id);
   for(const id of s.sources)if(!sourceRegistry.sources[id])throw Error('Unknown citation '+id+' in '+s.id);
  }
  return {...m,spots:d.spots};
 });
 return Object.freeze({
  country:'CL',readyForForecast:false,regions,
  getSpot:id=>regions.flatMap(r=>r.spots).find(s=>s.id===id)||null,
  sources:sourceRegistry.sources,
  researchCount:seen.size
 });
}
root.FaroChileCatalog=Object.freeze({load});
})(typeof globalThis!=='undefined'?globalThis:this);
