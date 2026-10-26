/* FARO Observation Lab · local video and ethical annotation + frozen-forecast crossover.
 * Media is NEVER uploaded, copied to a server, or retained in storage.
 * Observations are private local browser metadata until the user exports them.
 * No background recording of third-party streams. NO trained CV inference.
 */
(function(root){
"use strict";
const ZONE="America/Santiago",REPO="lukileke/zeeland-surf-check",DATA_BRANCH="faro-research-data";
const KEY="faro-chile-visual-observations-v1",finite=x=>typeof x==="number"&&Number.isFinite(x);
const pick=(id,rootNode=document)=>rootNode.querySelector("#"+id);
function zonedParts(date){
 const bits=new Intl.DateTimeFormat("en-GB",{timeZone:ZONE,hourCycle:"h23",year:"numeric",month:"2-digit",
  day:"2-digit",hour:"2-digit",minute:"2-digit"}).formatToParts(date);
 const p=Object.fromEntries(bits.map(x=>[x.type,x.value]));
 return p.year+"-"+p.month+"-"+p.day+"T"+p.hour+":"+p.minute;
}
function localToUtc(s){
 if(typeof s!=="string"||!/^(\d{4}-\d\d-\d\d)T(\d\d:\d\d)$/.test(s))return null;
 const ms=Date.parse(s+":00Z");if(!finite(ms))return null;
 const matches=[];
 for(let offset=-12;offset<=14;offset++){
  const candidate=new Date(ms+offset*3600000);
  if(zonedParts(candidate)===s)matches.push(candidate.toISOString());
 }
 // DST repeated clocks are NOT safe for research without offset provenance.
 return matches.length===1?matches[0]:null;
}
function deriveEvents(events){
 const count=events.length,usable=events.filter(x=>x.type==="wall").length;
 const closeouts=events.filter(x=>x.type==="closeout").length;
 const classified=usable+closeouts;
 const seconds=events.filter(x=>x.type==="wall"&&finite(x.wallSeconds)&&x.wallSeconds>0)
  .map(x=>x.wallSeconds).sort((a,b)=>a-b);
 const mid=Math.floor(seconds.length/2),median=seconds.length?
  seconds.length%2?seconds[mid]:(seconds[mid-1]+seconds[mid])/2:null;
 return {waveCount:count,surfableWaveCount:usable,closeoutFraction:classified?closeouts/classified:null,
  medianWaveFaceSeconds:median,unclassifiedWaveCount:count-usable-closeouts};
}
function validateObservation(o){
 if(!o||!o.spotId||!o.observationId||!o.observedAtUtc||Number.isNaN(Date.parse(o.observedAtUtc)))return false;
 if(!o.labels||!Number.isInteger(o.labels.waveCount)||o.labels.waveCount<1)return false;
 if(o.labels.surfableWaveCount>o.labels.waveCount)return false;
 if(!finite(o.labels.closeoutFraction)||o.labels.closeoutFraction<0||o.labels.closeoutFraction>1)return false;
 if(o.observationWindowSeconds!==undefined&&(!finite(o.observationWindowSeconds)||o.observationWindowSeconds<30))return false;
 if(!Number.isInteger(o.labels.rideability1to5)||o.labels.rideability1to5<1||o.labels.rideability1to5>5)return false;
 return true;
}
function matchSnapshot(archive,spotId,atUtc,maxValidMinutes=65){
 const observed=Date.parse(atUtc);if(!finite(observed)||!archive||!Array.isArray(archive.spots))return null;
 const matches=[];
 for(const s of archive.spots){
  if(s.spotId!==spotId)continue;
  for(const f of s.records||[]){
   const fetched=Date.parse(f.ingestedAtUtc||archive.fetchedAtUtc);
   const valid=Date.parse(f.validAtUtc);
   if(!finite(fetched)||!finite(valid)||fetched>observed||Math.abs(valid-observed)>maxValidMinutes*60000)continue;
   if(!["swellHeightM","swellPeriodS","swellFromDeg","windKmh","windFromDeg"].every(k=>finite(f.features?.[k])))continue;
   matches.push({...f,_modelFetchedAtUtc:archive.fetchedAtUtc,_timeDeltaMs:Math.abs(valid-observed)});
  }
 }
 matches.sort((a,b)=>Date.parse(b.ingestedAtUtc)-Date.parse(a.ingestedAtUtc)||
   a._timeDeltaMs-b._timeDeltaMs);
 return matches[0]||null;
}
async function readSnapshot(input){
 const bytes=input instanceof ArrayBuffer?input:await input.arrayBuffer();
 if(bytes.byteLength>12*1024*1024)throw Error("Archivo demasiado grande para este visor.");
 const array=new Uint8Array(bytes);
 const gzip=array[0]===31&&array[1]===139;
 let text;
 if(gzip){
  if(typeof DecompressionStream!=="function")throw Error("El navegador no soporta archivos .gz.");
  text=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
 }else text=new TextDecoder().decode(bytes);
 const obj=JSON.parse(text);
 if(obj?.provider!=="Open-Meteo"||obj?.region!=="CL-VS"||!Array.isArray(obj.spots))
  throw Error("El archivo no corresponde al historial FARO Chile.");
 return obj;
}
function localStore(){try{const s=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(s)?s:[]}catch(_){return []}}
function saveRecord(rec){
 const all=localStore();if(all.length>=300)throw Error("Límite local de 300 registros: exporta los datos primero.");
 all.push(rec);localStorage.setItem(KEY,JSON.stringify(all));return all.length;
}
function downloadRecords(records){
 const json=records.map(x=>JSON.stringify(x)).join("\n")+"\n";
 const url=URL.createObjectURL(new Blob([json],{type:"application/x-ndjson"}));
 const link=document.createElement("a");link.href=url;link.download="faro-chile-observations.jsonl";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function make(tag,parent,attrs={},content){
 const el=document.createElement(tag);
 for(const [k,v]of Object.entries(attrs)){
  if(k==="className")el.className=v;else if(k==="type"||k==="value"||k==="accept"||k==="min"||k==="max"||k==="step"||
   k==="required"||k==="controls"||k==="placeholder"||k==="htmlFor"||k==="id"||k==="name")
   el[k]=v;else el.setAttribute(k,String(v));
 }
 if(content!==undefined)el.textContent=content;
 if(parent)parent.append(el);return el;
}
function init(options={}){
 const target=options.container||document.querySelector("#faroVideoLab");
 if(!target)return null;
 target.replaceChildren();
 let clipUrl=null,events=[],archive=null,cross=null;
 const t=(es,en)=>document.documentElement.lang==="en"?en:es;
 const section=make("section",target,{className:"chile-video-lab"});
 const top=make("div",section,{className:"chile-lab-header"});
 make("strong",top,{}, " FARO OBSERVATION LAB");
 make("small",top,{},t("Vídeo local + comparación con forecast archivado","Local video + archived forecast comparison"));
 const lead=make("p",section,{className:"chile-lab-tip"},
 t("Abre un vídeo propio/autorizado o registra lo que observas en una cámara externa. Nada se graba ni se transmite a FARO.",
   "Open your own/authorised video or record notes from an external camera. FARO neither records nor uploads anything."));
 const fields=make("div",section,{className:"chile-lab-fields"});
 const sourceLabel=make("label",fields,{},t("Tipo de observación","Observation type"));
 const source=make("select",sourceLabel,{id:"faroObsSource"});
 make("option",source,{value:"authorised_clip"},t("Vídeo propio o autorizado","Own / authorised video"));
 make("option",source,{value:"manual_visual"},t("Observación manual de cámara externa","Manual observation of external camera"));
 const cameraLabel=make("label",fields,{id:"faroObsCameraLabel"},t("Cámara / fuente observada","Observed camera / source"));
 const cameraChoice=make("select",cameraLabel,{id:"faroObsCamera"});
 function renderCameraSources(){
  const current=typeof options.spotId==="function"?options.spotId():options.spotId;
  const prev=cameraChoice.value;
  cameraChoice.replaceChildren();
  make("option",cameraChoice,{value:""},t("Observación directa / sin cámara","Direct observation / no camera"));
  const sources=typeof options.cameraSources==="function"?options.cameraSources():options.cameraSources||[];
  for(const cam of sources.filter(c=>c.spotId===current&&c.type!=="coastal_model_not_camera"&&
   c.type!=="regional_context_camera")){
   const access=cam.viewerAccess==="free_account_required"?t(" · cuenta gratis"," · free account"):
    cam.viewerAccess==="premium_subscription"?" · Premium":
    cam.viewerAccess==="public_page_currently_offline"?t(" · señal no confirmada"," · feed unverified"):"";
   make("option",cameraChoice,{value:cam.id},cam.name+access);
  }
  if([...cameraChoice.options].some(o=>o.value===prev))cameraChoice.value=prev;
  cameraLabel.hidden=source.value!=="manual_visual";
 }
 const dateLabel=make("label",fields,{},t("Momento observado · hora de Chile","Observed moment · Chile local time"));
 const date=make("input",dateLabel,{id:"faroObsDate",type:"datetime-local",required:true});
 const nowLocal=zonedParts(new Date());date.value=nowLocal;
 const ratingLabel=make("label",fields,{},t("Calidad observada (1–5)","Observed rideability (1–5)"));
 const rating=make("select",ratingLabel,{id:"faroObsRating"});
 for(let i=1;i<=5;i++)make("option",rating,{value:String(i)},String(i));
 rating.value="3";
 const videoWrap=make("div",section,{className:"chile-lab-video"});
 const fileLabel=make("label",videoWrap,{},t("Abrir clip desde este dispositivo","Open a local video clip"));
 const file=make("input",fileLabel,{id:"faroObsFile",type:"file",accept:"video/mp4,video/webm,video/quicktime,video/*"});
 const video=make("video",videoWrap,{id:"faroObsVideo",controls:true,playsinline:"",preload:"metadata"});
 video.setAttribute("aria-label","FARO local video observation player");
 const videoNote=make("small",videoWrap,{},t("El archivo permanece en tu dispositivo. No se almacena en el historial.",
   "The file stays on your device and is not included in the research archive."));
 const controls=make("div",section,{className:"chile-lab-event-controls"});
 make("small",controls,{},t("Marca cada ola durante el clip. Las cifras salen de tus marcas, no de una IA.",
   "Tag each wave while watching. Counts come from your labels, not an AI model."));
 const buttonRow=make("div",controls,{className:"chile-lab-buttons"});
 const addButton=(txt,kind)=>{const b=make("button",buttonRow,{type:"button","data-type":kind},txt);return b};
 const wall=addButton(t("✓ Pared","✓ Rideable wall"),"wall");
 const closeout=addButton(t("× Campana","× Closeout"),"closeout");
 const other=addButton(t("~ Otra ola","~ Other wave"),"other");
 const undo=addButton(t("↶ Deshacer","↶ Undo"),"undo");
 const windowLabel=make("label",controls,{},t("Ventana observada (minutos)","Observation window (minutes)"));
 const windowMinutes=make("input",windowLabel,{type:"number",step:"0.5",min:"1",max:"180",value:"10"});
 const secondsLabel=make("label",controls,{},t("Duración de pared (s) · opcional","Wall duration (s) · optional"));
 const seconds=make("input",secondsLabel,{type:"number",step:"0.5",min:"0",max:"120",placeholder:"0"});
 const counts=make("p",controls,{className:"chile-lab-count"}, "0 olas");
 const eventsList=make("p",controls,{className:"chile-lab-events"},"—");
 const notesLabel=make("label",section,{className:"chile-lab-notes"},t("Notas del banco / condiciones observadas","Sandbank / observed conditions"));
 const notes=make("textarea",notesLabel,{rows:"2",maxLength:"750",placeholder:t("Ej.: 2 series, paredes cortas, viento en el agua…","e.g. two sets, short walls, surface wind…")});
 const archivePanel=make("div",section,{className:"chile-lab-archive"});
 make("strong",archivePanel,{},t("Cruzar con el pronóstico REAL anterior","Match the genuinely prior forecast"));
 make("p",archivePanel,{},t("Busca automáticamente el historial público de FARO o importa un snapshot descargado. No se aceptan pronósticos obtenidos después de la observación.",
   "Find FARO's public archive or import a downloaded snapshot. Forecasts fetched after the observation are never accepted."));
 const actions=make("div",archivePanel,{className:"chile-lab-buttons"});
 const auto=make("button",actions,{type:"button",id:"faroObsAuto"},t("Buscar en historial","Find archived forecast"));
 const importLabel=make("label",actions,{className:"chile-lab-import"},t("Importar .json.gz / .json","Import .json.gz / .json"));
 const archiveFile=make("input",importLabel,{type:"file",accept:".json,.gz,.json.gz,application/gzip,application/json",id:"faroObsArchive"});
 const comparison=make("div",archivePanel,{className:"chile-lab-comparison",id:"faroObsComparison"});
 const permission=make("label",section,{className:"chile-lab-permission"});
 const consent=make("input",permission,{type:"checkbox",id:"faroObsPermission"});
 make("span",permission,{},t("El clip es mío o tengo permiso para analizarlo; he revisado la privacidad de las personas. Si solo observo una cámara externa, no guardo ni descargo imágenes de ella.",
   "I own or have permission to analyse this clip and have reviewed privacy. For an external camera, I only enter manual observations and do not save or download its images."));
 const buttons=make("div",section,{className:"chile-lab-buttons"});
 const save=make("button",buttons,{type:"button",id:"faroObsSave"},t("Guardar observación en este navegador","Save observation in this browser"));
 const exportButton=make("button",buttons,{type:"button",id:"faroObsExport"},t("Exportar registros JSONL","Export JSONL records"));
 const resetButton=make("button",buttons,{type:"button",id:"faroObsReset"},t("Borrar registros locales","Clear local records"));
 const feedback=make("p",section,{className:"chile-lab-feedback",role:"status",id:"faroObsFeedback"});
 const total=make("small",section,{id:"faroObsTotal"}, "");
 const explain=make("p",section,{className:"chile-lab-tip"},
 t("Guardamos únicamente etiquetas y valores del modelo en tu navegador; no guardamos el vídeo. Los datos exportados requieren revisión antes de entrenar IA. Sin permiso del proveedor no se pueden usar vídeos de Lineup como datos de entrenamiento.",
  "Only labels and model values are stored locally; not the video. Exports require review before ML training. Lineup video cannot be used for training without provider permission."));
 function status(message){feedback.textContent=message}
 function spot(){return typeof options.spotId==="function"?options.spotId():options.spotId||""}
 function resetComparison(){cross=null;archive=null;comparison.replaceChildren();}
 function drawCount(){
  const c=deriveEvents(events);
  counts.textContent=t("Olas ","Waves ")+c.waveCount+" · "+t("Paredes ","Walls ")+c.surfableWaveCount+
   " · "+t("Cerrones ","Closeouts ")+events.filter(e=>e.type==="closeout").length;
  eventsList.textContent=events.length?events.slice(-6).map(e=>e.type+" @"+e.atSeconds+"s").join(" · "):"—";
 }
 function drawMatch(){
  comparison.replaceChildren();
  if(!cross){
   make("p",comparison,{},t("Aún sin cruce verificado. Una ausencia de archivo no demuestra que faltaran olas.",
    "No time-verified forecast match yet. Missing archive does not mean the surf was flat."));
   return;
  }
  const v=cross.features;
  make("strong",comparison,{},t("Pronóstico guardado ANTES de la observación","Forecast frozen BEFORE observation"));
  make("div",comparison,{className:"chile-lab-figures"},
   "Swell "+v.swellHeightM.toFixed(1)+" m · "+v.swellPeriodS.toFixed(0)+" s · "+v.swellFromDeg.toFixed(0)+"°"+
   " | "+t("Viento ","Wind ")+v.windKmh.toFixed(0)+" km/h · "+v.windFromDeg.toFixed(0)+"°");
  make("small",comparison,{},t("Archivado: ","Archived: ")+cross.ingestedAtUtc+
   " · "+t("válido: ","valid: ")+cross.validAtUtc+
   " · "+t("emisión del modelo desconocida","model issue time unknown"));
 }
 function syncMode(){
  const withVideo=source.value==="authorised_clip";
  videoWrap.hidden=!withVideo;
  secondsLabel.hidden=!withVideo;
  cameraLabel.hidden=withVideo;
  status(withVideo?t("Abre un archivo que tengas permiso de analizar.","Open a file you are authorised to analyse."):
    t("Observa la transmisión en el sitio original; marca únicamente las olas vistas. No se captura video.","View the external live stream at its source. Tag visible waves only; no video capture."));
 }
 source.addEventListener("change",()=>{
  if(source.value!=="authorised_clip"){video.pause();if(clipUrl)URL.revokeObjectURL(clipUrl);clipUrl=null;video.removeAttribute("src");video.load();file.value="";}
  syncMode();
 });
 file.addEventListener("change",()=>{
  if(clipUrl){video.pause();URL.revokeObjectURL(clipUrl);clipUrl=null}
  const f=file.files?.[0];
  if(!f){video.removeAttribute("src");video.load();return}
  if(f.size>900*1024*1024){status(t("El clip supera 900 MB; usa un fragmento más corto.","The file exceeds 900 MB; choose a shorter clip."));file.value="";return}
  if(!f.type.startsWith("video/")){status(t("Selecciona un vídeo válido.","Choose a video file."));file.value="";return}
  clipUrl=URL.createObjectURL(f);video.src=clipUrl;video.load();
  status(t("Vídeo local abierto. Reproduce y marca cada ola.","Local video opened. Play it and tag each wave."));
 });
 for(const b of [wall,closeout,other]){
  b.addEventListener("click",()=>{
   const at=source.value==="authorised_clip"&&finite(video.currentTime)?Math.round(video.currentTime*10)/10:0;
   const wallSeconds=b.dataset.type==="wall"&&seconds.value.trim()?Number(seconds.value):null;
   if(wallSeconds!==null&&(!finite(wallSeconds)||wallSeconds<=0||wallSeconds>120)){
    status(t("Duración de pared fuera de rango.","Wall duration out of range."));return;
   }
   events.push({atSeconds:at,type:b.dataset.type,wallSeconds});
   drawCount();
  });
 }
 undo.addEventListener("click",()=>{events.pop();drawCount()});
 async function useArchive(obj){
  archive=obj;
  const at=localToUtc(date.value);
  if(!at){cross=null;drawMatch();throw Error(t("Hora local ambigua o inválida por horario de verano. Selecciona otro momento.","Ambiguous or invalid Chile local clock (DST). Choose another instant."))}
  cross=matchSnapshot(obj,spot(),at);
  drawMatch();
  if(!cross)status(t("Archivo cargado, pero no incluye un pronóstico válido emitido/guardado antes de esa observación.","Archive opened, but no forecast stored before the observation matches this time."));
  else status(t("¡Cruce encontrado! Puedes guardar la observación con la predicción original.","Forecast crossover found. You can now save this observation with its genuinely prior prediction."));
  return cross;
 }
 archiveFile.addEventListener("change",async()=>{
  try{if(archiveFile.files?.[0])await useArchive(await readSnapshot(archiveFile.files[0]));}catch(err){cross=null;drawMatch();status(String(err.message||err))}
 });
 date.addEventListener("change",()=>{if(archive){void useArchive(archive).catch(e=>status(e.message))}});
 auto.addEventListener("click",async()=>{
  const at=localToUtc(date.value);
  if(!at){status(t("Hora chilena inválida o ambigua; revisa la fecha.","Invalid or ambiguous Chile local time."));return}
  auto.disabled=true;status(t("Buscando pronósticos anteriores en GitHub…","Searching previously archived forecasts on GitHub…"));
  try{
   // A four-day marine forecast means archives from 0–4 days before the observed date may apply.
   // Query only the required YYYY/MM folders on the public research-data branch.
   const months=new Set();
   for(let d=0;d<=4;d++){
    const t=new Date(Date.parse(at)-d*86400000);
    months.add(t.toISOString().slice(0,7));
   }
   const listings=await Promise.all([...months].map(async month=>{
    const [year,mm]=month.split("-");
    const url="https://api.github.com/repos/"+REPO+"/contents/research-data/chile/forecast-snapshots/"+
      year+"/"+mm+"?ref="+DATA_BRANCH;
    const res=await fetch(url,{headers:{Accept:"application/vnd.github+json"}});
    if(res.status===404)return[];
    if(!res.ok)throw Error("GitHub archive HTTP "+res.status);
    const list=await res.json();
    return Array.isArray(list)?list.filter(x=>/\.json(\.gz)?$/.test(x.name)&&x.download_url):[];
   }));
   const files=listings.flat().map(x=>({item:x,time:Date.parse(x.name.replace(
    /^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)\.(\d{3})Z\.json(\.gz)?$/,
    "$1-$2-$3T$4:$5:$6.$7Z"))})).
    filter(x=>finite(x.time)&&x.time<=Date.parse(at)).
    sort((a,b)=>b.time-a.time);
   cross=null;
   for(const {item}of files.slice(0,12)){
    const resp=await fetch(item.download_url);
    if(!resp.ok)continue;
    const candidate=await readSnapshot(await resp.arrayBuffer());
    const match=matchSnapshot(candidate,spot(),at);
    if(match){archive=candidate;cross=match;break}
   }
   drawMatch();
   status(cross?t("Cruce verificado con un pronóstico histórico anterior.","Matched an earlier stored forecast."):
    t("No hay un pronóstico archivado compatible con esa fecha. El historial comenzó el 26 de octubre de 2026.",
      "No compatible stored forecast for that time. Archival started on 26 October 2026."));
  }catch(err){drawMatch();status(t("Error consultando el historial: ","Archive error: ")+String(err.message||err))}
  finally{auto.disabled=false}
 });
 function updateTotal(){total.textContent=t("Registros solo en este navegador: ","Records in this browser only: ")+localStore().length}
 save.addEventListener("click",()=>{
  try{
   const at=localToUtc(date.value),c=deriveEvents(events);
   if(!at)throw Error(t("Revisa la fecha/hora de Chile; puede ser ambigua por el cambio de hora.","Chile date/time is invalid or ambiguous because of DST."));
   if(source.value==="authorised_clip"&&!file.files?.length)throw Error(t("Selecciona un clip autorizado.","Select an authorised clip."));
   if(!consent.checked)throw Error(t("Confirma tus derechos para analizar este material y la privacidad.","Confirm permission and privacy review first."));
   if(c.waveCount<1)throw Error(t("Marca al menos una ola antes de registrar.","Tag at least one wave."));
   const clipDuration=source.value==="authorised_clip"&&finite(video.duration)?video.duration:null;
   const windowSeconds=clipDuration!==null&&clipDuration>0?clipDuration:Number(windowMinutes.value)*60;
   if(!finite(windowSeconds)||windowSeconds<30||windowSeconds>10800)
    throw Error(t("Indica una ventana observada válida (0,5–180 min).","Enter a valid observation window (0.5–180 min)."));
   const record={
    schemaVersion:"1.0.0",observationId:"faro-"+crypto.randomUUID(),spotId:spot(),
    observedAtUtc:at,observedAtLocalChile:date.value,timezone:ZONE,
    observationType:source.value==="authorised_clip"?"manual_video_annotation":"manual_external_camera_observation",
    cameraId:source.value==="manual_visual"?(cameraChoice.value||null):null,
    cameraRightsNotVerified:true,permissionClaimByAnnotator:true,
    privacyReviewedByAnnotator:true,mediaConsentScope:"research_review_only",trainingEligible:false,
    captureAssetId:null,clipDurationSeconds:clipDuration,observationWindowSeconds:windowSeconds,
    waveCountPer10Min:Math.round(c.waveCount*600/windowSeconds*10)/10,
    surfableCountPer10Min:Math.round(c.surfableWaveCount*600/windowSeconds*10)/10,
    events:events.map(x=>({...x})),
    labels:{rideability1to5:Number(rating.value),waveCount:c.waveCount,surfableWaveCount:c.surfableWaveCount,
     closeoutFraction:c.closeoutFraction,medianWaveFaceSeconds:c.medianWaveFaceSeconds,
     surface:"unknown",visibility:"manual_observed",bankNotes:notes.value.slice(0,750)},
    forecast:cross?{
     forecastId:cross.forecastId,spotId:spot(),forecastSource:cross.source,ingestedAtUtc:cross.ingestedAtUtc,
     validAtUtc:cross.validAtUtc,issuedAtUtc:cross.issuedAtUtc||null,features:{...cross.features},
     provenance:"retrieved_before_observation_issue_unknown"
    }:null,
    reviewStatus:"pending_review_not_training_data"
   };
   if(!validateObservation(record))throw Error(t("La observación está incompleta.","Incomplete observation."));
   saveRecord(record);events=[];drawCount();updateTotal();
   status(t("Observación guardada solo en este navegador. Exporta JSONL para archivarla fuera del dispositivo.",
     "Observation stored in this browser only. Export JSONL to archive it elsewhere."));
  }catch(err){status(String(err.message||err))}
 });
 exportButton.addEventListener("click",()=>{
  const records=localStore();if(!records.length){status(t("Todavía no hay observaciones para exportar.","No observations to export."));return}
  downloadRecords(records);
  status(t("Exportación iniciada. Solo contiene anotaciones y valores, nunca videos.","Export started: labels and data only, never video."));
 });
 resetButton.addEventListener("click",()=>{
  if(!root.confirm(t("¿Borrar todas las observaciones locales? Exporta primero si quieres conservarlas.","Delete all local observations? Export first to keep them.")))return;
  localStorage.removeItem(KEY);updateTotal();status(t("Registros locales borrados.","Local records cleared."));
 });
 root.addEventListener("beforeunload",()=>{if(clipUrl)URL.revokeObjectURL(clipUrl)},{once:true});
 renderCameraSources();syncMode();drawCount();drawMatch();updateTotal();
 return {element:section,refreshLanguage:()=>{},refreshCameras:renderCameraSources,getRecords:localStore};
}
const api=Object.freeze({init,localToUtc,deriveEvents,validateObservation,matchSnapshot,readSnapshot});
root.FaroChileVideoLab=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
