/* FARO research health gate: a missed upstream vintage is a warning unless
 * there has been no complete, real model snapshot for longer than 20 hours.
 * Never backfill or invent a model issue time.
 */
const HOUR_MS=60*60*1000;
export function inspectArchiveFreshness(file,now=new Date(),maxAgeHours=20){
 const match=String(file||"").match(/\/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z\.json\.gz$/);
 if(!match)return {ok:false,reason:"No recognised complete .json.gz snapshot on faro-research-data"};
 const [,y,mo,d,h,mi,se,ms]=match;
 const stamp=`${y}-${mo}-${d}T${h}:${mi}:${se}.${ms}Z`;
 const date=new Date(stamp),ageHours=(now.getTime()-date.getTime())/HOUR_MS;
 if(!Number.isFinite(ageHours)||ageHours<0)
  return {ok:false,reason:"Invalid or future archive timestamp",stamp};
 if(ageHours>maxAgeHours)
  return {ok:false,reason:"Latest real archive is stale",stamp,ageHours};
 return {ok:true,reason:"Recent real archive is available",stamp,ageHours};
}
if(import.meta.url===`file://${process.argv[1]||""}`){
 const result=inspectArchiveFreshness(process.env.FARO_LAST_SNAPSHOT);
 console.log(result.reason+"; last="+(result.stamp||"none")+
   "; age="+(result.ageHours?.toFixed(1)??"unknown")+"h");
 if(!result.ok){
  console.error("FARO archive has no recent complete snapshot. Check Open-Meteo and GitHub Actions.");
  process.exitCode=1;
 }else{
  console.log("::warning title=FARO research vintage skipped::Open-Meteo was temporarily unavailable; no vintage was invented. Historical data remains recent.");
 }
}
