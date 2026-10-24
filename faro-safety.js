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


 /* Source registry is retained ONLY for future geographic expansion.
    This build covers Zeeland; Chile is NOT enabled in the current UI.
    None of these links constitute live machine-read government alerts. */
 const SOURCES=Object.freeze({
  NL:Object.freeze({label:'Zeeland · NL',links:Object.freeze([
   Object.freeze({label:'KNMI Zeeland',url:KNMI_URL})
  ])}),
  CL:Object.freeze({label:'Chile · CL',links:Object.freeze([
   Object.freeze({label:'SERVIMET / DIRECTEMAR · marejadas y temporal',url:'https://meteoarmada.directemar.cl/'}),
   Object.freeze({label:'Dirección Meteorológica de Chile',url:'https://www.meteochile.gob.cl/'}),
   Object.freeze({label:'SENAPRED · alertas',url:'https://senapred.cl/alertas/'})
  ])})
 });
 const readStore=(key)=>{try{return root.localStorage?.getItem(key)||null}catch(e){return null}};
 const currentLanguage=()=>readStore('zeeland-language')==='es'?'es':'en';
 function translatedReason(value,es){
  if(!es)return value;
  return String(value)
   .replace('Modelled gusts up to ','Rachas modeladas de hasta ')
   .replace('Modelled sustained wind ','Viento sostenido modelado de ')
   .replace('Thunderstorms are forecast','Se pronostican tormentas eléctricas')
   .replace('Offshore modelled waves ','Olas modeladas mar adentro de ')
   .replace('Elevated offshore wave height ','Altura elevada de olas mar adentro de ')
   .replace('Dense freezing fog possible','Posible niebla densa con heladas')
   .replace('Fog may impair visibility','La niebla podría limitar la visibilidad')
   .replace('Very cold sea water','Agua de mar muy fría')
   .replace('Cold sea water','Agua de mar fría')
   .replace('Freezing air temperature','Temperatura del aire bajo cero')
   .replace('Heavy rain may impair visibility','La lluvia fuerte podría limitar la visibilidad')
   .replace('Insufficient daylight','Luz diurna insuficiente');
 }
 function render(rootEl,weather,beachName,now=new Date()){
  if(!rootEl)return;
  const es=currentLanguage()==='es';
  // FARO Zeeland release: the active authority and forecast geography are fixed.
  // Enable region routing only after launching genuine local surf spots and alerts.
  const source=SOURCES.NL;
  const report=scan48h(weather,now),bulletin=datedBulletin(now);
  const strong=report.level==='danger',notice=Boolean(bulletin);
  rootEl.className='faro-safety-center '+(strong?'danger':notice||report.level==='caution'?'caution':'advisory');
  rootEl.replaceChildren();
  const copy=document.createElement('div');copy.className='faro-safety-copy';
  const head=document.createElement('strong');head.className='faro-safety-kicker';
  head.textContent=strong?(es?'⛔ RIESGO SEGÚN EL MODELO':'⛔ MODEL HAZARD'):
   notice?(es?'⚠️ BOLETÍN KNMI FECHADO':'⚠️ DATED KNMI BULLETIN'):
   (es?'AVISOS METEOROLÓGICOS · FUENTES OFICIALES':'WEATHER ALERTS · OFFICIAL SOURCES');
  const p=document.createElement('p');p.className='faro-safety-headline';
  if(strong||report.level==='caution'){
   p.textContent=(es?'Próximas 48 h cerca de ':'Next 48 h near ')+beachName+': '+
    report.reasons.map(v=>translatedReason(v,es)).join('; ')+'.';
  }else if(notice){
   p.textContent=es?
    'KNMI pronosticó rachas de 75–90 km/h en la costa de Zeeland para la noche del sábado y el domingo.':
    'KNMI forecast 75–90 km/h gusts in coastal Zeeland for Saturday night and Sunday.';
  }else{
   p.textContent=es?
    'Consulta las alertas oficiales antes de viajar o entrar al agua.':
    'Check official weather warnings before travelling or entering the water.';
  }
  const foot=document.createElement('p');foot.className='faro-safety-source';
  const modelLabel=es?'Riesgo estimado por Open-Meteo, no aviso oficial.':'Open-Meteo model risk, not an official alert.';
  const datedLabel=es?
   'Boletín KNMI publicado el 24 oct 2026 a las 07:43 (NL); previsto del 24 oct 22:00 al 25 oct 23:00. No es una alerta en tiempo real.':
   'KNMI bulletin published 24 Oct 2026, 07:43 NL; expected 24 Oct 22:00–25 Oct 23:00. Not a live alert feed.';
  foot.textContent=notice?(strong||report.level==='caution'?modelLabel+' · ':'')+datedLabel:
   report.level==='unknown'?
     (es?'No se reciben alertas oficiales en directo; pueden faltar datos del modelo.':
         'Official alerts are not fetched live; model data may be missing.'):
     (es?'Evaluación mediante modelos Open-Meteo; los avisos oficiales no se consultan automáticamente.':
         'Open-Meteo screening; official alert status is not automatically checked.');
  const action=document.createElement('a');action.className='faro-safety-link';
  action.href=source.links[0].url;action.target='_blank';action.rel='noopener noreferrer';
  action.textContent=(es?'Consultar ':'Check ')+source.links[0].label+' ↗';
  copy.append(head,p,foot);rootEl.append(copy,action);
  rootEl.setAttribute('aria-label',es?'Avisos meteorológicos y evaluación de riesgos del modelo':'Weather warnings and model hazard screening');
  rootEl.setAttribute('role',strong?'alert':'region');
  rootEl.setAttribute('aria-live',strong?'assertive':'polite');
 }
 root.FaroSafety=Object.freeze({KNMI_URL,localStamp,risk,scan48h,datedBulletin,SOURCES,translatedReason,render});
})(typeof globalThis!=='undefined'?globalThis:this);
