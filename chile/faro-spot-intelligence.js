/* FARO Chile Spot Intelligence v0.1 · guide-evidence interpretation.
 * NOT a nearshore wave solver, calibrated surf score or live observation.
 * Does not override the provisional numeric score.
 */
(function(root){
"use strict";
const finite=x=>typeof x==="number"&&Number.isFinite(x);
const wrap=x=>((x%360)+360)%360;
const gap=(a,b)=>Math.abs(((wrap(a)-wrap(b)+540)%360)-180);
function angularDistance(value,range){
 if(!finite(value)||!Array.isArray(range)||range.length!==2||!range.every(finite))return null;
 const a=wrap(range[0]),b=wrap(range[1]),x=wrap(value);
 if(a<=b?x>=a&&x<=b:x>=a||x<=b)return 0;
 return Math.min(gap(x,a),gap(x,b));
}
function assessDirection(value,hypotheses){
 if(!finite(value)||!Array.isArray(hypotheses)||!hypotheses.length)
  return {state:"unknown",matches:[],misses:[],evidence:[],angularDistanceDeg:null};
 const evidence=hypotheses.map(h=>{
  const ds=(h.from||[]).map(range=>angularDistance(value,range)).filter(finite);
  const distance=ds.length?Math.min(...ds):null;
  return {source:h.source,scope:h.scope,withinGuide:distance===0,distanceDeg:distance};
 });
 const observed=evidence.filter(x=>finite(x.distanceDeg));
 const matches=observed.filter(x=>x.withinGuide).map(x=>x.source);
 const misses=observed.filter(x=>!x.withinGuide).map(x=>x.source);
 return {state:!observed.length?"unknown":!matches.length?"outside":
  !misses.length?"convergent":"disputed",matches,misses,evidence,
  angularDistanceDeg:observed.length?Math.min(...observed.map(x=>x.distanceDeg)):null};
}
function tideAgreement(hypotheses){
 const unique=[...new Set((hypotheses||[]).map(x=>x.claim).filter(Boolean))];
 return {state:unique.length>1?"disputed":unique.length===1?"single_guide":"unknown",
  claims:unique,verified:false};
}
const message=(locale,es,en)=>locale==="es"?es:en;
function evaluate(slot,spotId,catalog,locale="es",options={}){
 const spot=catalog?.spots?.[spotId];
 if(!spot)return {status:"unconfigured",read:null,vibe:null,sourceIds:[],safetyAssessed:false};
 const say=(es,en)=>message(locale,es,en);
 const sourceIds=[...new Set(Object.values(spot.guideHypotheses||{}).flat().map(x=>x.source))];
 const tide=tideAgreement(spot.guideHypotheses?.tide);
 const wind=assessDirection(slot?.windDirection,spot.guideHypotheses?.wind);
 const swell=assessDirection(slot?.swellDirection,spot.guideHypotheses?.swell);
 const physics=root.FaroChilePhysicsLab?.evaluate(slot)||null;
 const valid=slot?.modelComplete&&finite(slot.swellPeriodS)&&finite(slot.swellHeightM)&&finite(slot.windKmh);
 const neutral={spotId,sector:spot.area,sourceIds,wind,swell,tide,physics,
  status:valid?"guide_compared":"model_unavailable",safetyAssessed:false,
  observedWaveShape:false,coastalModelIntegrated:false,tideCalibrated:false};
 if(!valid)return {...neutral,vibe:{id:"unknown",label:say("Sin lectura","No read")},
  headline:say("Falta información","Insufficient inputs"),
  read:say("Faltan variables del modelo para comparar este sector con las guías.",
   "Some model variables are missing; the sector cannot be compared to published guides."),
  method:say("Sin datos suficientes para inferir condiciones locales.","Not enough data for local inference.")};

 // A decision requires a falsifiable observation from the *model*.
 // It is never a prediction of breaking-wave size, a safety approval, or a
 // validated quality score. The decision and the guide/source audit are separate.
 const h=slot.swellHeightM,p=slot.swellPeriodS,u=slot.windKmh,g=slot.gustKmh;
 const soft=h<.55||p<6.5;
 const bigger=h>=1.35&&p>=10;
 const windy=u>=25||(finite(g)&&g>=38);
 const calm=u<=12&&(!finite(g)||g<=22);
 const crossing=physics?.crossingAngleDeg!==null&&finite(physics?.crossingAngleDeg)&&
  physics.crossingAngleDeg>=50&&physics.systems[1]?.available&&
  physics.systems[1].proxyM2S>=physics.systems[0].proxyM2S*.25;
 const notes=[],evidenceLabels=[];
 for(const [type,signal,nameEs,nameEn]of [["swell",swell,"Swell","Swell"],["wind",wind,"Viento","Wind"]]){
  const label=signal.state==="convergent"?say(nameEs+" coincide con las guías",nameEn+" fits the guides"):
   signal.state==="disputed"?say(nameEs+": guías divididas",nameEn+": guides disagree"):
   signal.state==="outside"?say(nameEs+" fuera de referencias",nameEn+" outside guide ranges"):null;
  if(label)evidenceLabels.push({type,state:signal.state==="convergent"?"supported":signal.state,label});
 }
 if(crossing)evidenceLabels.push({type:"partitions",state:"mixed",label:say("Swells cruzados en el modelo","Crossing modelled swells")});
 if(tide.state==="disputed")notes.push(say("Las guías discrepan sobre la marea; no se ha modelado el efecto local.",
  "Published tide guidance differs; local tidal response has not been modelled."));
 if(wind.state==="disputed"||swell.state==="disputed")notes.push(say(
  "Hay referencias contradictorias de viento o swell: revisa las fuentes en Spot DNA.",
  "Published wind or swell directions conflict: inspect the sources in Spot DNA."));

 const risk=options?.risk||"unknown";
 const missingRisk=risk==="unknown";
 const danger=risk==="danger",caution=risk==="caution";
 const tooWindy=u>=30||(finite(g)&&g>=45);
 const windySurface=u>=22||(finite(g)&&g>=35);
 const weak=h<.45||p<6;
 const strongSwell=h>=1.5&&p>=10.5;
 const enough=h>=.7&&p>=8.5;
 const score=slot.score;
 const lowFit=finite(score)&&score<3.5;
 const poorFit=finite(score)&&score<4.8;
 const noDaylight=slot.daylight?.eligible===false;
 let decision;
 if(danger){
  decision="hazard";
 }else if(missingRisk){
  decision="unassessed";
 }else if(noDaylight){
  decision="no_daylight";
 }else if(caution){
  decision="caution";
 }else if(tooWindy){
  decision="skip_wind";
 }else if(weak){
  decision="skip_swell";
 }else if(lowFit||swell.state==="outside"&&poorFit){
  decision="skip_direction";
 }else if(windySurface){
  decision="wait_wind";
 }else if(poorFit){
  decision="mixed";
 }else if(enough&&u<=17){
  decision="check";
 }else{
  decision="maybe";
 }
 const outcomes={
  hazard:[say("No recomendar entrada","Do not recommend entry"),0,"model_risk"],
  unassessed:[say("Revisa los riesgos primero","Check risk data first"),0,"risk_unassessed"],
  no_daylight:[say("Fuera de la ventana de luz","Outside daylight"),0,"daylight"],
  caution:[say("Precaución con el tiempo","Weather caution"),1,"model_caution"],
  skip_wind:[say("Mejor esperar al viento","Wait for lighter wind"),1,"wind"],
  skip_swell:[say("No priorizar esta franja","Low priority window"),1,"low_swell"],
  skip_direction:[say("No priorizar esta franja","Low priority window"),1,"spot_fit"],
  wait_wind:[say("Busca una hora más calma","Look for lighter wind"),2,"wind"],
  mixed:[say("Hay opciones, con reservas","Possible, with caveats"),2,"mixed"],
  maybe:[say("Podría valer la pena mirar","Could be worth a look"),3,"model_potential"],
  check:[say("Vale la pena echar un ojo","Worth a closer look"),4,"model_potential"]
 };
 const [verdict,priority,driver]=outcomes[decision];
 const shortNames={
  hazard:say("Riesgo modelo","Model risk"),
  unassessed:say("Sin evaluar","Unassessed"),
  no_daylight:say("Sin luz","No daylight"),
  caution:say("Precaución","Caution"),
  skip_wind:say("Mucho viento","Too windy"),
  skip_swell:say("Poco swell","Small swell"),
  skip_direction:say("Poco encaje","Low fit"),
  wait_wind:say("Esperar viento","Wait for wind"),
  mixed:say("Variable","Mixed"),
  maybe:say("Para mirar","Worth a look"),
  check:say("Vale mirar","Worth checking")
 };
 const measurement=say("Swell "+h.toFixed(1)+" m @ "+p.toFixed(0)+" s; viento "+u.toFixed(0)+" km/h.",
  "Swell "+h.toFixed(1)+" m @ "+p.toFixed(0)+" s; wind "+u.toFixed(0)+" km/h.");
 const mainReason={
  hazard:say("El modelo detecta un umbral meteorológico peligroso; no compenses ese riesgo con un score alto.",
   "A hazardous model threshold is flagged; a high score does not offset this risk."),
  unassessed:say("Faltan variables para descartar riesgos meteorológicos en esta franja.",
   "Risk-screen inputs are missing for this window."),
  no_daylight:say("No hay luz suficiente para sugerir esta sesión.",
   "There is insufficient daylight for a suggested session."),
  caution:say("El modelo señala precaución meteorológica; consulta el detalle antes de decidir.",
   "A modelled weather caution is present; inspect the detail before deciding."),
  skip_wind:say("Demasiado viento o rachas para priorizar esta ventana.",
   "Wind or gusts are too strong to prioritise this window."),
  skip_swell:say("Swell de poca altura o período corto: baja prioridad para desplazarse.",
   "Small or short-period swell: low priority for making a trip."),
  skip_direction:say("La compatibilidad direccional del modelo con la guía de este sector es baja.",
   "The model has low directional fit to this sector's published guide."),
  wait_wind:say("El viento puede afectar la superficie; una franja más calma sería preferible.",
   "Wind may disturb the surface; a calmer window would be preferable."),
  mixed:say("La combinación actual no destaca frente a otras franjas del mismo spot.",
   "This combination does not stand out among this spot's forecast windows."),
  maybe:say("Swell aprovechable, pero los indicadores no destacan lo suficiente para priorizarla.",
   "There is usable swell, but the indicators do not yet make this a priority."),
  check:say("Hay swell con período y viento relativamente suave: buena candidata para revisar.",
   "Swell, period and relatively light wind make this worth checking.")
 }[decision];
 const spotLogic={
  "CL-VS:la-boca-concon":{
   low:say("En La Boca no priorizaría un desplazamiento por este pronóstico; compararía otra hora.",
    "At La Boca I would look for another window rather than travel on this forecast alone."),
   watch:say("Para una sesión suave en La Boca, revisaría el sector permitido desde la orilla y comprobaría corriente y acceso.",
    "For mellow surf, check the permitted surf section from shore before entering; assess current and access."),
   power:say("Con este swell, empezaría observando la corriente y la forma de las series antes de elegir una tabla o entrar.",
    "With this swell, check currents and how the sets break before choosing a board or entering.")
  },
  "CL-VS:renaca":{
   low:say("No contaría con paredes consistentes en los picos norte; buscaría una ventana con mejor combinación.",
    "Do not count on consistent walls at the northern peaks; look for a better window."),
   watch:say("En Reñaca Norte revisaría los picos: ahí las guías describen paredes para giros cuando el banco acompaña.",
    "Check the northern peaks: when there is a wall, guides describe sections suited to turns."),
   power:say("En Reñaca Norte miraría desde la orilla cuántas olas cierran antes de entrar.",
    "Watch how many waves close out from shore before paddling out at Reñaca Norte.")
  },
  "CL-VS:ritoque":{
   low:say("Para Ritoque Norte no haría el viaje basándome solo en este swell; buscaría otra franja.",
    "I would not make the trip to Ritoque North based on this swell alone; look for another window."),
   watch:say("En Ritoque Norte miraría primero los picos si buscas olas más suaves y recorrido.",
    "Check the northern peaks first if you prefer softer waves with room to cruise."),
   power:say("En Ritoque, si quieres algo suave, revisa primero el norte; hacia el sur las guías describen más exposición.",
    "At Ritoque, for softer surf, check the north first; the beach is described as more exposed towards the south.")
  }
 };
 const local=spotLogic[spotId]||spotLogic["CL-VS:la-boca-concon"];
 const low=["hazard","unassessed","no_daylight","caution","skip_wind","skip_swell","skip_direction","wait_wind"].includes(decision);
 const spotAction=low?local.low:(strongSwell?local.power:local.watch);
 const action=decision==="hazard"?say("No recomendar entrada; verifica las advertencias oficiales y las condiciones del lugar.",
   "Do not recommend entry; check official notices and site conditions."):
  decision==="unassessed"?say("Consulta datos meteorológicos y avisos oficiales antes de decidir.",
   "Check risk data and official notices before deciding."):
  decision==="no_daylight"?say("Busca una ventana con luz suficiente.","Choose a daylight window."):
  decision==="caution"?say("Consulta el riesgo modelado y los avisos oficiales antes de considerar la sesión.",
   "Check the modelled caution and official notices before considering this session."):
  decision==="skip_wind"||decision==="wait_wind"?
   say("Prioriza una hora con menos viento y vuelve a comparar el swell.","Prioritise a calmer hour and compare the swell again."):
  spotAction;
 const vibe=decision==="skip_wind"||decision==="wait_wind"?{id:"windy",label:say("💨 Ventoso","💨 Windy")}:
  decision==="skip_swell"?{id:"small",label:say("🌊 Poco swell","🌊 Small swell")}:
  decision==="hazard"||decision==="unassessed"||decision==="caution"?
   {id:"unknown",label:say("⚠ Revisa condiciones","⚠ Check conditions")}:
  crossing?{id:"mixed",label:"🌊 Mixed Bag"}:
  decision==="check"&&calm&&swell.state!=="outside"?{id:"clean-potential",label:say("🌊 Buenas líneas posibles","🌊 Potential lines")}:
  decision==="check"&&strongSwell?{id:"power",label:say("⚡ Con fuerza","⚡ More punch")}:
  decision==="skip_direction"||decision==="mixed"?{id:"mixed",label:"🌊 Mixed Bag"}:
  decision==="maybe"?{id:"cruisy",label:say("🌊 Para mirar","🌊 Worth a look")}:
  {id:"soft",label:say("☀️ Suavecitas posibles","☀️ Mellow potential")};
 // Do not claim measured breaking waves, actual current, tidal preference,
 // a verified sandbank or a safe session. Numeric values are offshore input.
 const read=measurement+" "+mainReason;
 const opportunity={id:decision,priority,driver,verdict,shortLabel:shortNames[decision],reason:mainReason,
  action,modelEvidence:measurement,scope:spot.area,
  basedOn:"offshore_model_and_unvalidated_guide",isObserved:false,
  validated:false,safetyAssessed:false};
 return {...neutral,headline:verdict,read,vibe,decision:opportunity,
  evidenceLabels,notes,
  drivers:{soft,bigger,windy,calm,crossing,guideDisagreement:wind.state==="disputed"||swell.state==="disputed",sectorDependent:true},
  method:say("Primero decisión comparativa con entradas oceánicas; fuentes y límites en Spot DNA. No estima altura rompiente.",
   "Comparative decision using offshore inputs; source conflicts and limits in Spot DNA. No breaking-wave estimate.")};
}
root.FaroChileSpotIntelligence=Object.freeze({evaluate,assessDirection,angularDistance,tideAgreement});
})(typeof globalThis!=="undefined"?globalThis:this);
