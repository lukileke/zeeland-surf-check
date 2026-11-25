/* FARO extended marine outlook · shared NL/CL. Separate from session scoring.
   ECMWF WAM 15-day marine horizon; weather model for daily wind context.
   No model extrapolation, no invented values or future surf quality score. */
(function(root){
"use strict";
const valid=v=>typeof v==="number"&&Number.isFinite(v);
const median=a=>{const b=a.filter(valid).sort((x,y)=>x-y);return b.length? (b[(b.length-1)>>1]+b[b.length>>1])/2:null};
const cache=new Map();
const dateKey=(zone)=>new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()).reduce((o,p)=>(o[p.type]=p.value,o),{});
function startDate(zone){const p=dateKey(zone);return p.year+"-"+p.month+"-"+p.day;}
function datePlus(d,i){const t=new Date(d+"T12:00:00Z");t.setUTCDate(t.getUTCDate()+i);return t.toISOString().slice(0,10)}
function group(hourly,day,key){
 const a=[];for(let i=0;i<(hourly?.time?.length||0);i++)if(hourly.time[i].slice(0,10)===day&&valid(hourly[key]?.[i]))a.push(hourly[key][i]);
 return a.length>=12?median(a):null;
}
function summarise(m,w,today){
 return Array.from({length:8},(_,i)=>{const day=datePlus(today,i+7);return {day,height:group(m.hourly,day,"swell_wave_height"),period:group(m.hourly,day,"swell_wave_period"),wind:group(w.hourly,day,"wind_speed_10m")};});
}
async function query(spot,signal){
 const common={latitude:String(spot.lat),longitude:String(spot.lon),timezone:spot.zone,forecast_days:"15"};
 const m=new URL("https://marine-api.open-meteo.com/v1/marine"),w=new URL("https://api.open-meteo.com/v1/forecast");
 m.search=new URLSearchParams({...common,models:"ecmwf_wam",hourly:"swell_wave_height,swell_wave_period"});
 w.search=new URLSearchParams({...common,hourly:"wind_speed_10m"});
 const get=async url=>{const r=await fetch(url,{signal});if(!r.ok)throw Error("HTTP "+r.status);const data=await r.json();if(!Array.isArray(data.hourly?.time))throw Error("No model hours");return data};
 const [marine,weather]=await Promise.all([get(m),get(w)]);
 return summarise(marine,weather,startDate(spot.zone));
}
function mount({getSpot,getLang}){
 const parent=document.getElementById("forecastPage");if(!parent||parent.querySelector(".faro-extended"))return;
 const host=document.createElement("details");host.className="faro-extended";
 const summary=document.createElement("summary"),caption=document.createElement("span"),kicker=document.createElement("small"),title=document.createElement("strong");
 kicker.className="faro-extended-kicker";title.className="faro-extended-title";caption.append(kicker,title);summary.append(caption);
 const body=document.createElement("div");body.className="faro-extended-body";
 const note=document.createElement("p");note.className="faro-extended-note";
 const status=document.createElement("p");status.className="faro-extended-status";status.setAttribute("role","status");
 const result=document.createElement("div");result.className="faro-extended-scroll";
 const retry=document.createElement("button");retry.type="button";retry.className="faro-extended-retry";retry.hidden=true;
 const source=document.createElement("p");source.className="faro-extended-source";
 const a=document.createElement("a");a.href="https://open-meteo.com/en/docs/marine-weather-api";a.target="_blank";a.rel="noopener noreferrer";a.textContent="Open-Meteo · ECMWF WAM";source.append(a);
 body.append(note,status,result,retry,source);host.append(summary,body);parent.append(host);
 let currentKey="",controller=null,pending=false,serial=0,rows=null,error=false,lang="";
 const tr=(es,en)=>getLang()==="es"?es:en;
 const set=(node,copy)=>{if(node.textContent!==copy)node.textContent=copy;};
 const key=sp=>sp&&valid(sp.lat)&&valid(sp.lon)&&sp.zone?[sp.lat,sp.lon,sp.zone,startDate(sp.zone)].join("|"):"";
 function paint(){
  set(kicker,tr("FARO · HORIZONTE EXTENDIDO","FARO · EXTENDED OUTLOOK"));
  set(title,tr("Días 8–15 · Explorar tendencia","Days 8–15 · Explore the outlook"));
  set(note,tr("Medianas diarias del modelo, no horas recomendadas. Incertidumbre creciente: no es un pronóstico de rompiente ni un score de surf.","Daily model medians, not recommended times. Increasing uncertainty: not a breaking-wave forecast or surf score."));
  set(retry,tr("Reintentar","Retry"));
  retry.hidden=!error;
  const sp=getSpot();
  set(status,pending?tr("Consultando modelos…","Loading models…"):error?tr("No se pudo obtener el horizonte extendido.","Extended outlook unavailable."):rows?((sp?.name||"")+" · "+tr("Medianas diarias · días 8–15","Daily medians · days 8–15")):tr("Abre para consultar el modelo.","Open to load model data."));
  result.replaceChildren();
  if(!rows)return;
  const table=document.createElement("table"),head=document.createElement("thead"),hrow=document.createElement("tr"),tbody=document.createElement("tbody");
  const labels=[tr("Día","Day"),tr("Swell (m)","Swell (m)"),tr("Período (s)","Period (s)"),tr("Viento (km/h)","Wind (km/h)")];
  for(const label of labels){const th=document.createElement("th");th.scope="col";th.textContent=label;hrow.append(th)}head.append(hrow);
  const fmt=new Intl.DateTimeFormat(getLang()==="es"?"es-CL":"en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"});
  for(const row of rows){const r=document.createElement("tr");for(const value of [fmt.format(new Date(row.day+"T12:00:00Z")),valid(row.height)?row.height.toFixed(1):"—",valid(row.period)?row.period.toFixed(1):"—",valid(row.wind)?Math.round(row.wind):"—"]){const td=document.createElement("td");td.textContent=String(value);r.append(td)}tbody.append(r)}
  table.append(head,tbody);result.append(table);
 }
 async function sync(force=false){
  const sp=getSpot(),k=key(sp),nextLang=getLang();
  if(k!==currentKey){currentKey=k;serial++;controller?.abort();controller=null;pending=false;rows=null;error=false;paint()}
  if(nextLang!==lang){lang=nextLang;paint()}
  if(!host.open||!k||pending||(!force&&(rows||error)))return;
  const stored=cache.get(k);if(!force&&stored&&Date.now()-stored.at<30*60*1000){rows=stored.rows;paint();return}
  const own=++serial;controller=new AbortController();const active=controller;pending=true;error=false;paint();
  const timeout=setTimeout(()=>active.abort(),18000);
  try{const next=await query(sp,active.signal);if(own!==serial)return;rows=next;cache.set(k,{at:Date.now(),rows});if(cache.size>20)cache.delete(cache.keys().next().value)}
  catch(e){if(own===serial){error=true;rows=null}}
  finally{clearTimeout(timeout);if(own===serial){pending=false;controller=null;paint()}}
 }
 host.addEventListener("toggle",()=>{if(host.open)void sync()});
 retry.addEventListener("click",()=>void sync(true));
 paint();return {sync};
}
root.FaroExtendedOutlook=Object.freeze({mount,summarise,median});
})(typeof window!=="undefined"?window:globalThis);
