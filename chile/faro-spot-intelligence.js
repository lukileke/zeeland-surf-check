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
function evaluate(slot,spotId,catalog,locale="es"){
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
 const soft=slot.swellHeightM<.55||slot.swellPeriodS<6.5;
 const bigger=slot.swellHeightM>=1.35&&slot.swellPeriodS>=10;
 const windy=slot.windKmh>=25||(finite(slot.gustKmh)&&slot.gustKmh>=38);
 const calm=slot.windKmh<=12&&(!finite(slot.gustKmh)||slot.gustKmh<=22);
 const crossing=physics?.crossingAngleDeg!==null&&finite(physics?.crossingAngleDeg)&&
  physics.crossingAngleDeg>=50&&physics.systems[1]?.available&&
  physics.systems[1].proxyM2S>=physics.systems[0].proxyM2S*.25;
 const notes=[],evidenceLabels=[];
 if(swell.state==="convergent")evidenceLabels.push({type:"swell",state:"supported",label:say("Swell coincide con las guías","Swell fits the guides")});
 else if(swell.state==="disputed")evidenceLabels.push({type:"swell",state:"disputed",label:say("Swell: guías divididas","Swell: guides disagree")});
 else if(swell.state==="outside")evidenceLabels.push({type:"swell",state:"outside",label:say("Swell fuera de referencias","Swell outside guide ranges")});
 if(wind.state==="disputed")evidenceLabels.push({type:"wind",state:"disputed",label:say("Viento: guías divididas","Wind: guides disagree")});
 else if(wind.state==="convergent")evidenceLabels.push({type:"wind",state:"supported",label:say("Viento coincide con las guías","Wind fits the guides")});
 else if(wind.state==="outside")evidenceLabels.push({type:"wind",state:"outside",label:say("Viento fuera de referencias","Wind outside guide ranges")});
 if(crossing)evidenceLabels.push({type:"partitions",state:"mixed",label:say("Swells cruzados en el modelo","Crossing modelled swells")});
 if(tide.state==="disputed")notes.push(say("Las guías discrepan sobre la marea ideal; no se calcula su efecto.",
  "Published guides disagree on ideal tide; no tidal effect is calculated."));
 let headline,description,vibe;
 if(windy){
  vibe={id:"windy",label:say("💨 Ventoso","💨 Windy")};
  headline=say("El viento puede pesar más que el swell","Wind could dominate this window");
 }else if(soft){
  vibe={id:"soft",label:say("☀️ Suavecitas","☀️ Soft surf potential")};
  headline=say("Swell oceánico limitado","Limited offshore swell");
 }else if(crossing){
  vibe={id:"mixed",label:"🌊 Mixed Bag"};
  headline=say("Dos direcciones de swell en juego","Multiple swell directions in play");
 }else if(swell.state==="outside"){
  vibe={id:"mixed",label:"🌊 Mixed Bag"};
  headline=say("Swell alejado de las referencias locales","Swell outside local guide directions");
 }else if(calm&&swell.state==="convergent"&&wind.state==="convergent"){
  vibe={id:"clean-potential",label:say("🌊 Líneas con potencial","🌊 Potential lines")};
  headline=say("Viento suave y orientaciones compatibles","Light wind and guide-compatible directions");
 }else{
  vibe={id:"mixed",label:"🌊 Mixed Bag"};
  headline=say("Condiciones con matices locales","Conditions depend on local details");
 }
 if(spotId==="CL-VS:la-boca-concon"){
  description=soft?
   say("En La Boca, un swell limitado podría dar olas suaves. Los bancos junto al Aconcagua cambian y no sabemos cuál está activo.",
    "Limited swell could mean softer waves at La Boca. Aconcagua sandbanks shift; the active bank is unknown."):
   bigger?
   say("Hay más swell oceánico disponible, pero en La Boca los bancos de la desembocadura deciden cómo rompe. Revisa corriente y estado del río.",
    "There is more offshore swell, but river-mouth sandbanks determine the actual breaking wave. Check current and river conditions."):
   say("La Boca puede ofrecer olas suaves y variables; el modelo no ve los bancos móviles ni la corriente de la desembocadura.",
    "La Boca may offer softer, variable surf; the model cannot see shifting river-mouth banks or currents.");
 }else if(spotId==="CL-VS:renaca"){
  description=soft?
   say("Con poco swell, no se puede anticipar si los picos del norte tendrán pared. El banco actual manda.",
    "With limited swell it is unclear whether the northern peaks will have a surfable face. The current bank matters."):
   bigger?
   say("El swell tiene más presencia: las guías describen picos rápidos al norte, pero también secciones que cierran. No se conoce el banco activo.",
    "More swell is present: guides describe punchier northern peaks, but also sections that close out. The active bank is unknown."):
   say("Las guías describen picos tipo A-frame al norte de Reñaca. La forma y el posible cierre dependen de la arena actual.",
    "Guides describe A-frame peaks in northern Reñaca. Shape and possible closeouts depend on the current sandbanks.");
 }else if(spotId==="CL-VS:ritoque"){
  description=soft?
   say("Los picos del norte podrían estar suaves; las guías describen un canal de remada, pero su estado actual no está verificado.",
    "Northern peaks could be soft; guides describe a paddle channel, but its current state is unverified."):
   bigger?
   say("El swell oceánico aumenta. Las guías describen un norte más suave y un sur más expuesto; esta lectura solo corresponde al sector norte.",
    "Offshore swell is stronger. Guides describe a mellower north and a more exposed south; this read applies only to the north."):
   say("En Ritoque Norte las guías describen izquierdas suaves y un canal de entrada; más al sur cambia la exposición.",
    "Guides describe soft lefts and a paddle channel in northern Ritoque; exposure changes farther south.");
 }else{
  description=say("Las guías describen el spot, pero falta una lectura sectorial comprobada.",
   "Published guides describe the spot but sector-specific verification is missing.");
 }
 if(wind.state==="disputed")notes.push(say("La dirección de viento encaja con algunas guías y con otras no.",
  "Wind direction fits some guides but not others."));
 if(swell.state==="disputed")notes.push(say("La dirección del swell encaja solo con parte de las guías.",
  "Swell direction fits only some published guides."));
 if(windy)notes.push(say("El viento fuerte podría desordenar la superficie, con independencia del banco.",
  "Strong wind may disturb the surface, regardless of sandbank shape."));
 if(crossing)notes.push(say("Hay swells cruzados, pero eso no demuestra olas desordenadas en la rompiente.",
  "Swells are crossing, but this does not prove that breaking waves are disorganised."));
 return {...neutral,headline,read:description,vibe,evidenceLabels,notes,
  drivers:{soft,bigger,windy,calm,crossing,guideDisagreement:wind.state==="disputed"||swell.state==="disputed",sectorDependent:true},
  method:say("Comparación de hipótesis publicadas y datos oceánicos, no observación ni predicción de altura rompiente.",
   "Comparison of published hypotheses with offshore data, not observed surf or breaking-height prediction.")};
}
root.FaroChileSpotIntelligence=Object.freeze({evaluate,assessDirection,angularDistance,tideAgreement});
})(typeof globalThis!=="undefined"?globalThis:this);
