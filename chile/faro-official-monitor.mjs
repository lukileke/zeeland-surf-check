/* FARO Official Watch · surveillance of reachable publication portals.
 * This is NOT a formal clearance or complete feed of valid notices. Portal
 * availability and selected dated headlines are recorded, NEVER interpreted
 * as the absence of marine or civil protection warnings.
 */
import fs from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const sources=Object.freeze([
 {id:"armada",name:"SERVIMET · Armada",url:"https://meteoarmada.directemar.cl/"},
 {id:"senapred",name:"SENAPRED",url:"https://www.senapred.cl/alertas/"},
 {id:"dmc",name:"DMC",url:"https://www.meteochile.gob.cl/PortalDMC-web/index.xhtml"}
]);
const clean=s=>String(s||"").replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/\s+/g," ").trim();
async function inspect(now=new Date(),fetcher=fetch){
 const checks=await Promise.all(sources.map(async src=>{
  try{
   const r=await fetcher(src.url,{signal:AbortSignal.timeout(12000),headers:{"User-Agent":"FARO Coast Monitor/1.0 (+https://github.com/lukileke/zeeland-surf-check)"}});
   const body=await r.text();
   const valid=r.ok&&body.length>250&&/(?:<html|<!doctype|senapred|meteorolog|armada)/i.test(body);
   return {id:src.id,name:src.name,url:src.url,reachable:Boolean(valid),http:r.status,
    note:valid?"Portal accesible; vigencia de boletines no certificada":"Contenido oficial no verificable"};
  }catch(e){return {id:src.id,name:src.name,url:src.url,reachable:false,note:"Portal sin respuesta verificable"};}
 }));
 return {schema:1,checkedAt:now.toISOString(),region:"CL-VS",coverage:"partial",
  clearanceVerified:false,bulletinsVerified:false,sources:checks,
  detail:"El acceso a portales oficiales no confirma que todos los avisos estén disponibles, vigentes o descartados."};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 const out=await inspect();
 const target=process.env.FARO_OFFICIAL_WATCH_OUTPUT||"research-data/chile/official-watch.json";
 await fs.mkdir(resolve(target).replace(/\/[^\/]+$/,""),{recursive:true});
 await fs.writeFile(target,JSON.stringify(out,null,2)+"\n");
 console.log("FARO official watch: checked "+out.sources.filter(s=>s.reachable).length+
  "/"+out.sources.length+" portals. State remains partial/unverified.");
}
export {inspect,sources};
