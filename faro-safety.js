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
  // FARO currently covers Zeeland only. Chilean sources are retained for a
  // future geographic rollout, not offered as an irrelevant user switch.
  const report=scan48h(weather,now);
  const bulletin=datedBulletin(now);
  const dangerous=report.level==='danger';
  const caution=report.level==='caution';
  const hasBulletin=Boolean(bulletin);
  const severity=dangerous?'danger':caution||hasBulletin?'caution':'advisory';
  const previouslyOpen=Boolean(rootEl.querySelector?.('.faro-safety-disclosure')?.open);
  rootEl.className='faro-safety-center '+severity;
  rootEl.replaceChildren();

  // A critical model risk MUST remain visible even when details are closed.
  // Native <details> allows keyboard and assistive-technology activation
  // without building another disclosure state machine.
  const detail=document.createElement('details');
  detail.className='faro-safety-disclosure';
  detail.open=previouslyOpen;
  const summary=document.createElement('summary');
  summary.className='faro-safety-summary';
  const top=document.createElement('span');top.className='faro-safety-top';
  const kicker=document.createElement('strong');kicker.className='faro-safety-kicker';
  kicker.textContent=dangerous?
   (es?'RIESGO SEGÚN EL MODELO':'MODEL HAZARD'):
   caution?(es?'PRECAUCIÓN · MODELO':'CAUTION · MODEL'):
   hasBulletin?(es?'BOLETÍN FECHADO · KNMI':'DATED BULLETIN · KNMI'):
   (es?'AVISOS DE ZEELAND':'ZEELAND WARNINGS');
  const level=document.createElement('span');level.className='faro-safety-severity';
  level.textContent=dangerous?(es?'Peligro':'Danger'):
   caution?(es?'Precaución':'Caution'):
   hasBulletin?(es?'Consultar':'Check'):'KNMI';
  top.append(kicker,level);

  const title=document.createElement('span');title.className='faro-safety-headline';
  let fullSignal='';
  if(dangerous||caution){
   const facts=[];
   if(report.stormAt)facts.push(es?'Tormentas eléctricas':'Thunderstorms');
   if(Number.isFinite(report.peakGust))
    facts.push((es?'Rachas hasta ':'Gusts up to ')+Math.round(report.peakGust)+' km/h');
   if(Number.isFinite(report.peakWind))
    facts.push((es?'Viento sostenido ':'Mean wind ')+Math.round(report.peakWind)+' km/h');
   if(!facts.length)facts.push(...report.reasons.map(x=>translatedReason(x,es)));
   const cause=report.stormAt?(es?'Posibles tormentas eléctricas':'Thunderstorms possible'):
    Number.isFinite(report.peakGust)?(es?'Rachas de hasta ':'Gusts up to ')+Math.round(report.peakGust)+' km/h':
    Number.isFinite(report.peakWind)?(es?'Viento sostenido de ':'Sustained wind ')+Math.round(report.peakWind)+' km/h':
    translatedReason(report.reasons[0]||'',es);
   title.textContent=beachName+' · '+cause;
   fullSignal=facts.join(' · ');
  }else if(hasBulletin){
   title.textContent=es?
    'KNMI previó fuertes rachas costeras este fin de semana':
    'KNMI forecast strong coastal gusts this weekend';
  }else{
   title.textContent=es?
    'Consulta los avisos oficiales antes de entrar al agua':
    'Check official warnings before entering the water';
  }
  const sourceNote=document.createElement('span');sourceNote.className='faro-safety-inline-source';
  sourceNote.textContent=dangerous||caution?
   (es?'Próximas 48 h · Estimación, no aviso oficial':'Next 48 h · Model estimate, not official alert'):
   hasBulletin?(es?'Boletín anterior · Estado actual no verificado':'Dated bulletin · Current status not verified'):
    (es?'KNMI · Consulta oficial, no sincronizada':'KNMI · Official source, not synced');
  const chevron=document.createElement('span');chevron.className='faro-safety-chevron';
  chevron.setAttribute('aria-hidden','true');
  summary.append(top,title,chevron);
  detail.append(summary);

  // A compact risk explanation: no duplication of the summary values or
  // repeated caveat paragraphs. Full methodology belongs to the linked guide.
  const expanded=document.createElement('div');
  expanded.className='faro-safety-expanded';
  const meta=document.createElement('p');
  meta.className='faro-safety-inline-source';
  meta.textContent=dangerous||caution?
   (es?'PRÓXIMAS 48 H · ESTIMACIÓN DEL MODELO, NO AVISO OFICIAL':'NEXT 48 H · MODEL ESTIMATE, NOT OFFICIAL ALERT'):
   hasBulletin?(es?'BOLETÍN ANTERIOR · SIN VERIFICACIÓN EN DIRECTO':'DATED BULLETIN · NOT LIVE'):
   (es?'CONSULTA DE AVISOS OFICIALES · SIN SINCRONIZACIÓN':'OFFICIAL WARNINGS · NOT SYNCED');
  expanded.append(meta);
  if(dangerous||caution){
   const heading=document.createElement('strong');
   heading.className='faro-safety-detail-heading';
   heading.textContent=es?'Por qué destaca FARO este riesgo':'Why FARO flagged this risk';
   expanded.append(heading);
   if(report.reasons.length){
    const list=document.createElement('ul');list.className='faro-safety-reasons';
    report.reasons.forEach(reason=>{
     const li=document.createElement('li');
     li.textContent=translatedReason(reason,es);
     list.append(li);
    });
    expanded.append(list);
   }
  }else{
   const explainer=document.createElement('p');
   explainer.className='faro-safety-detail-description';
   explainer.textContent=hasBulletin?
    (es?'Hay un boletín KNMI fechado; comprueba el estado actual en la fuente oficial.':
        'A dated KNMI bulletin is on record; verify current status with the official source.'):
    (es?'FARO no consulta automáticamente los avisos oficiales. La ausencia de riesgo en el modelo no garantiza condiciones seguras.':
        'FARO does not automatically check official warnings. No model hazard does not guarantee safe conditions.');
   expanded.append(explainer);
  }
  if(hasBulletin){
   const published=document.createElement('p');published.className='faro-safety-bulletin';
   published.textContent=es?
    'KNMI · 24 oct 2026, 07:43 · Previsto hasta el 25 oct a las 23:00 · No en directo.':
    'KNMI · 24 Oct 2026, 07:43 · Forecast until 25 Oct 23:00 · Not live.';
   expanded.append(published);
  }
  const note=document.createElement('p');note.className='faro-safety-source';
  note.textContent=es?
   'No incluye corrientes, mareas ni restricciones locales. Revisa las condiciones en la playa.':
   'Currents, tides and local restrictions are not assessed. Check conditions on the beach.';
  expanded.append(note);
  const actions=document.createElement('div');actions.className='faro-safety-actions';
  const official=document.createElement('a');
  official.className='faro-safety-link';
  official.href=KNMI_URL;official.target='_blank';official.rel='noopener noreferrer';
  official.textContent=es?'Avisos oficiales KNMI ↗':'Official KNMI warnings ↗';
  const more=document.createElement('a');
  more.className='faro-safety-more';more.href='#faroSafetyGuide';
  more.addEventListener('click',event=>{
   event.preventDefault();
   if(typeof root.openFaroSafetyGuide==='function')root.openFaroSafetyGuide();
   else{
    const destination=document.getElementById('faroSafetyGuide');
    if(destination){
     destination.open=true;
     destination.scrollIntoView({block:'start',behavior:'smooth'});
    }
   }
  });
  more.textContent=es?'Más información ↓':'How it works ↓';
  actions.append(official,more);expanded.append(actions);
  detail.append(expanded);
  rootEl.append(detail);
  rootEl.setAttribute('aria-label',es?'Avisos y riesgos meteorológicos de Zeeland':'Zeeland weather notices and model risks');
  rootEl.setAttribute('role',dangerous?'alert':'region');
  rootEl.setAttribute('aria-live',dangerous?'assertive':'polite');
 }
 root.FaroSafety=Object.freeze({KNMI_URL,localStamp,risk,scan48h,datedBulletin,SOURCES,translatedReason,render});
})(typeof globalThis!=='undefined'?globalThis:this);
