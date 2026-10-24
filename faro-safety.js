/* FARO safety: independent from surf-quality score and board fit.
   KNMI status is NOT polled here. A dated historical bulletin may be shown
   only within its validity window, with publication time and a live-source link.
   All numerical hazard thresholds below are FARO screening heuristics, NOT
   official warning codes or a safety clearance.
*/
(function(root){
 'use strict';
 const KNMI_URL='https://www.knmi.nl/nederland-nu/weer/waarschuwingen/zeeland';
 const ZEELAND_TZ='Europe/Amsterdam';
 function localStamp(date){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{
   timeZone:ZEELAND_TZ,year:'numeric',month:'2-digit',day:'2-digit',
   hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  return parts.year+'-'+parts.month+'-'+parts.day+'T'+parts.hour+':'+parts.minute;
 }
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const isThunder=code=>finite(code)&&code>=95&&code<=99;
 const risk=(x,valid=true)=>{
  if(!x)return {level:'unknown',reasons:[],source:'model-not-available'};
  const danger=[],caution=[];
  if(isThunder(x.code))danger.push('Thunderstorms are forecast');
  if(finite(x.gust)&&x.gust>=75)danger.push('Modelled gusts up to '+Math.round(x.gust)+' km/h');
  else if(finite(x.gust)&&x.gust>=50)caution.push('Modelled gusts up to '+Math.round(x.gust)+' km/h');
  if(finite(x.wind)&&x.wind>=55)danger.push('Modelled sustained wind '+Math.round(x.wind)+' km/h');
  else if(finite(x.wind)&&x.wind>=35)caution.push('Modelled sustained wind '+Math.round(x.wind)+' km/h');
  if(finite(x.h)&&x.h>=3)danger.push('Offshore modelled waves '+x.h.toFixed(1)+' m');
  else if(finite(x.h)&&x.h>=2)caution.push('Elevated offshore wave height '+x.h.toFixed(1)+' m');
  if(x.code===48)danger.push('Dense freezing fog possible');
  else if(x.code===45)caution.push('Fog may impair visibility');
  if(finite(x.water)&&x.water<7)danger.push('Very cold sea water');
  else if(finite(x.water)&&x.water<12)caution.push('Cold sea water');
  if(finite(x.air)&&x.air<=0)caution.push('Freezing air temperature');
  if(finite(x.precip)&&x.precip>=7)caution.push('Heavy rain may impair visibility');
  if(!valid)caution.push('Insufficient daylight');
  const reasons=[...new Set(danger),...new Set(caution)];
  return {level:danger.length?'danger':caution.length?'caution':'low',reasons,source:'Open-Meteo model, not official warning'};
 };
 function scan48h(weather,now=new Date()){
  if(!weather?.hourly?.time||!weather.hourly.wind_speed_10m)return {level:'unknown',reasons:[],peakGust:null,until:null};
  const h=weather.hourly,from=localStamp(now),until=localStamp(new Date(now.getTime()+48*3600000));
  let maxGust=null,maxWind=null,storm=false,stormAt=null,count=0;
  for(let i=0;i<h.time.length;i++){
   const t=h.time[i];if(t<from||t>until)continue;
   count++;
   const gust=h.wind_gusts_10m?.[i],wind=h.wind_speed_10m?.[i],code=h.weather_code?.[i];
   if(finite(gust))maxGust=maxGust===null?gust:Math.max(maxGust,gust);
   if(finite(wind))maxWind=maxWind===null?wind:Math.max(maxWind,wind);
   if(isThunder(code)){storm=true;if(!stormAt)stormAt=t;}
  }
  if(!count)return {level:'unknown',reasons:[],peakGust:null,until};
  const r=risk({gust:maxGust,wind:maxWind,code:storm?95:0},true);
  return {...r,peakGust:maxGust,peakWind:maxWind,stormAt,until,validHours:count,
   scope:'Next 48 h at selected spot; modelled, not a KNMI alert'};
 }
 // Snapshot of a verified KNMI publication; it is NOT a live warning feed.
 // Automatically disappear at its documented end; verify state at official URL.
 const publication=Object.freeze({
  issued:'2026-10-24T07:43',
  showFrom:'2026-10-24T07:43',
  expires:'2026-10-25T23:00',
  onset:'2026-10-24T22:00',
  end:'2026-10-25T23:00',
  level:'yellow',
  area:'coastal Zeeland',
  event:'Strong coastal gusts, 75–90 km/h, forecast for Sat night and Sunday',
  caveat:'Dated KNMI bulletin, not live status; check current update',
  url:KNMI_URL
 });
 function datedBulletin(now=new Date()){
  const t=localStamp(now);
  return t>=publication.showFrom&&t<publication.expires?publication:null;
 }

 function render(rootEl,weather,beachName){
  if(!rootEl)return;
  const report=scan48h(weather),bulletin=datedBulletin();
  const strong=report.level==='danger',notice=Boolean(bulletin);
  rootEl.className='faro-safety-center '+(strong?'danger':notice||report.level==='caution'?'caution':'advisory');
  rootEl.replaceChildren();
  const copy=document.createElement('div');copy.className='faro-safety-copy';
  const head=document.createElement('strong');head.className='faro-safety-kicker';
  head.textContent=strong?'⛔ MODEL HAZARD':notice?'⚠️ DATED KNMI BULLETIN':'KNMI · OFFICIAL WARNINGS';
  const p=document.createElement('p');p.className='faro-safety-headline';
  if(strong||report.level==='caution'){
   p.textContent='Next 48 h near '+beachName+': '+report.reasons.join('; ')+'.';
  }else if(notice){
   p.textContent='KNMI forecast 75–90 km/h gusts in coastal Zeeland for Saturday night and Sunday.';
  }else{
   p.textContent='Check current KNMI Zeeland alerts before travelling or entering the water.';
  }
  const foot=document.createElement('p');foot.className='faro-safety-source';
  foot.textContent=notice?'KNMI bulletin published 24 Oct 2026, 07:43 NL · Expected 24 Oct 22:00–25 Oct 23:00. Not a live alert feed.':
   report.level==='unknown'?'Official alerts are not automatically fetched; local model data may be missing.':
   'Open-Meteo model-based screening; official alert status is not automatically checked.';
  const link=document.createElement('a');link.className='faro-safety-link';
  link.href=KNMI_URL;link.target='_blank';link.rel='noopener noreferrer';
  link.textContent='Check KNMI Zeeland ↗';
  copy.append(head,p,foot);rootEl.append(copy,link);
  rootEl.setAttribute('aria-label','Weather warnings and model hazard screening');
  rootEl.setAttribute('role',strong?'alert':'region');
 }
 root.FaroSafety=Object.freeze({KNMI_URL,localStamp,risk,scan48h,datedBulletin,render});
})(typeof globalThis!=='undefined'?globalThis:this);
