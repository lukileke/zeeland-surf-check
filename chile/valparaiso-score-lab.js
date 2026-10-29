/* FARO Chile research scorer / v0.1 — NOT wired into the active website.
 * Interprets guide-sourced local directions and generic model parameters.
 * Experimental compatibility index: full 0–10 range, NO arbitrary 7.9 cap.
 * Full-range values are still NOT empirically validated as surf quality.
 * NEVER a breaking-wave prediction, safety approval or official alert.
 */
(function(root){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
 const wrap=x=>((x%360)+360)%360;
 const delta=(a,b)=>Math.abs(((wrap(a)-wrap(b)+540)%360)-180);
 function distanceToRange(dir,pair){
  if(!finite(dir)||!Array.isArray(pair)||pair.length!==2||!pair.every(finite))return null;
  const x=wrap(dir),a=wrap(pair[0]),b=wrap(pair[1]);
  const contained=a<=b?(x>=a&&x<=b):(x>=a||x<=b);
  return contained?0:Math.min(delta(x,a),delta(x,b));
 }
 function directionalFit(dir,ranges,falloff){
  if(!finite(dir)||!Array.isArray(ranges)||!ranges.length)return null;
  const distances=ranges.map(range=>distanceToRange(dir,range)).filter(finite);
  if(!distances.length)return null;
  const distance=Math.min(...distances);
  return {value:clamp(1-distance/falloff,0,1),distance};
 }
 function strength(wind,gust,H){
  if(!finite(wind)||wind<0)return null;
  let value=wind<=H.windLowKmh?1:
   wind<=H.windMediumKmh?1-.2*(wind-H.windLowKmh)/(H.windMediumKmh-H.windLowKmh):
   wind<=H.windHighKmh?.8-.6*(wind-H.windMediumKmh)/(H.windHighKmh-H.windMediumKmh):
   Math.max(0,.2-(wind-H.windHighKmh)*.01);
  if(finite(gust)&&gust>=H.gustWarningKmh)value*=.4;
  return clamp(value,0,1);
 }
 function periodFit(sec,H){
  if(!finite(sec)||sec<=0)return null;
  if(sec<H.periodTooShortS)return clamp(.15+sec/H.periodTooShortS*.12,.15,.27);
  if(sec<H.periodModerateS)return .3+(sec-H.periodTooShortS)/(H.periodModerateS-H.periodTooShortS)*.4;
  if(sec<H.periodGoodS)return .7+(sec-H.periodModerateS)/(H.periodGoodS-H.periodModerateS)*.3;
  return 1;
 }
 function presenceFit(height,H){
  // A generic "some swell is present" proxy — not an ideal surf-height range.
  if(!finite(height)||height<0)return null;
  if(height<H.presenceWeakM)return clamp(height/H.presenceWeakM*.25,0,.25);
  if(height<H.presenceModerateM)return .3+.7*(height-H.presenceWeakM)/(H.presenceModerateM-H.presenceWeakM);
  return 1;
 }
 // FARO v0.3: physics-informed, NOT physics-calibrated surfability.
 // Offshore potential ∝ Hs²*T (T here is modelled mean swell period, not Te).
 // This is a relative propagation-energy proxy, never coastal wave power or
 // breaking-wave height. Optional independent partitions add by energy, not Hs.
 function partitions(input){
  const out=[{id:'primary',heightM:input.swellHeightM,
   periodS:input.swellPeriodS,fromDeg:input.swellFromDeg}];
  for(const [id,p]of [['secondary',input.secondarySwell],['tertiary',input.tertiarySwell]]){
   if(p&&[p.heightM,p.periodS,p.fromDeg].every(finite)&&p.heightM>=0&&p.periodS>0)
    out.push({id,heightM:p.heightM,periodS:p.periodS,fromDeg:p.fromDeg});
  }
  return out;
 }
 function potentialEnergy(input,profile,H){
  const parts=partitions(input);
  let energy=0,raw=0,vol=0,wx=0,wy=0;
  const breakdown=parts.map(p=>{
   const fit=directionalFit(p.fromDeg,profile.waveFromDeg,H.angleFalloffDegrees);
   if(!fit)throw Error('Missing guide exposure for wave partition');
   // 5% residual is a bounded, explicitly uncalibrated uncertainty floor,
   // not a claim that the wave reaches the break after coastal refraction.
   const exposure=.05+.95*fit.value;
   const component=p.heightM**2*p.periodS;
   const admitted=component*exposure;
   energy+=admitted;raw+=component;vol+=p.heightM**2;
   wx+=p.heightM**2*Math.cos(wrap(p.fromDeg)*Math.PI/180);
   wy+=p.heightM**2*Math.sin(wrap(p.fromDeg)*Math.PI/180);
   return {id:p.id,fromDeg:p.fromDeg,periodS:p.periodS,heightM:p.heightM,
    relativeFluxH2Tm:+component.toFixed(3),guideFit:+fit.value.toFixed(3),
    admittedProxy:+admitted.toFixed(3)};
  });
  const consistency=vol>0?clamp(Math.hypot(wx,wy)/vol,0,1):null;
  return {admitted:energy,raw,consistency,breakdown};
 }
 function potentialScore(input,profile,H){
  const power=potentialEnergy(input,profile,H);
  const scale=H.energyResponseScaleM2S;
  const gate=clamp(power.admitted/H.minimumEnergyGateM2S,0,1)**H.energyGateExponent;
  const energyResponse=1-Math.exp(-power.admitted/scale);
  const windDirection=directionalFit(input.windFromDeg,profile.windFromDeg,H.angleFalloffDegrees);
  const windStrength=strength(input.windKmh,input.gustKmh,H);
  // Calm wind cannot be deemed bad solely for an 'offshore' direction
  // mismatch. Its angular impact grows with speed (a guide-level prior).
  const windDirectionWeight=clamp((input.windKmh-H.calmWindKmh)/
   (H.windDirectionFullKmh-H.calmWindKmh),0,1);
  const windQuality=clamp(windStrength*
   (1-H.windDirectionPenalty*windDirectionWeight*(1-windDirection.value)),0,1);
  const sea=finite(input.windSeaHeightM)&&input.windSeaHeightM>=0?input.windSeaHeightM:null;
  const primaryHs2=partitions(input).reduce((n,p)=>n+p.heightM**2,0);
  const windSeaFraction=sea===null?null:
   sea**2/Math.max(.00001,primaryHs2+sea**2);
  // Conservative modifiers: spread and local chop are not directly
  // observed breakers. Never double-count windsea as an extra swell.
  const seaModifier=windSeaFraction===null?1:
   1-H.windSeaPenalty*windSeaFraction*clamp(input.windKmh/20,0,1);
  const crossingModifier=1-H.crossingPenalty*(1-(power.consistency??1));
  const unrounded=10*gate*
   (H.energyWeight*energyResponse+(1-H.energyWeight)*windQuality)*
   seaModifier*crossingModifier;
  return {unrounded,energyResponse,gate,windQuality,windDirection,
   windStrength,seaModifier,crossingModifier,windSeaFraction,power};
 }
 const t=(lang,es,en)=>lang==='es'?es:en;
 const bands=[
  {max:2,id:'copper',es:'Muy pobre',en:'Very poor'},
  {max:4,id:'amber',es:'Pobre',en:'Poor'},
  {max:6,id:'sand',es:'Regular',en:'Fair'},
  {max:8,id:'lime',es:'Prometedor',en:'Promising'},
  {max:11,id:'olive',es:'Muy prometedor',en:'Very promising'}
 ];
 function fitTag(key,val,lang){
  const states={windDirection:['Viento','Wind'],swellDirection:['Swell','Swell'],windStrength:['Intensidad','Wind strength'],period:['Período','Period'],swellPresence:['Energía orientativa','Indicative energy']};
  const state=val>=.8?'positive':val>=.45?'mixed':'negative';
  const label=key==='windDirection'?
   [val>=.8?'Dirección favorable':val>=.45?'Viento lateral/mixto':'Dirección desfavorable',val>=.8?'Favourable direction':val>=.45?'Cross/mixed wind':'Unfavourable direction']:
   key==='swellDirection'?
   [val>=.8?'Swell entra bien':val>=.45?'Swell parcial':'Swell fuera de rango',val>=.8?'Swell direction aligns':val>=.45?'Partial swell fit':'Swell out of range']:
   key==='period'?
   [val>=.8?'Período con energía':val>=.45?'Período moderado':'Período corto',val>=.8?'Longer-period swell':val>=.45?'Moderate period':'Short period']:
   key==='windStrength'?
   [val>=.8?'Viento suave':val>=.45?'Viento moderado':'Viento intenso',val>=.8?'Light wind':val>=.45?'Moderate wind':'Strong wind']:
   [val>=.8?'Swell presente':val>=.45?'Swell limitado':'Swell débil',val>=.8?'Swell present':val>=.45?'Limited swell':'Weak swell'];
  return {id:key,label:t(lang,...label),state,criterion:t(lang,...states[key]),value:+val.toFixed(2)};
 }
 function read({windDirection,swellDirection,windStrength,period},locale,name){
  const es=locale==='es';
  if(windDirection.value>=.8&&swellDirection.value>=.8&&windStrength.value>=.65)
   return es?'Viento y dirección de swell bien alineados en el modelo; verifica el banco antes de entrar.':
    'Wind and swell approach look aligned in the model; check the actual sandbank before entering.';
  if(windStrength.value<.4)
   return es?'El viento podría desordenar la pared, aunque el swell tenga buena dirección.':
    'Wind could disturb the wave face even with a favourable swell direction.';
  if(swellDirection.value<.4)
   return es?'La dirección del swell encaja poco con la referencia publicada para este spot.':
    'Swell direction has limited compatibility with the published spot guide.';
  if(period.value<.4)
   return es?'El período corto puede limitar el empuje y la organización de las olas.':
    'Short period could limit wave energy and coherence.';
  return es?'Señales mixtas: el pronóstico orienta, pero la rompiente aún no está calibrada.':
   'Mixed signals: the model is indicative, while the breaking wave remains uncalibrated.';
 }
 function evaluate(config,spotId,input,{locale='es'}={}){
  const es=locale==='es';
  if(config?.active!==false||config?.status!=='experimental')throw Error('Only inactive experimental Chile configuration is supported');
  const profile=config.profiles?.[spotId];
  if(!profile)return {spotId,status:'unconfigured',score:null,tags:[],read:t(locale,'Spot pendiente de calibración.','Spot not yet calibrated.'),confidence:'not-calibrated'};
  // Directions are METEOROLOGICAL FROM; do not infer nearshore refraction.
  const keys=['windFromDeg','windKmh','swellFromDeg','swellPeriodS','swellHeightM'];
  if(!keys.every(key=>finite(input?.[key]))||input.windKmh<0||input.swellHeightM<0||input.swellPeriodS<=0)
   return {spotId,status:'incomplete',score:null,tags:[{id:'missing',state:'unknown',label:t(locale,'Faltan datos del modelo','Model inputs missing')}],read:t(locale,'No hay datos suficientes para generar un índice experimental.','Insufficient data for an experimental index.'),confidence:'incomplete',tideEvaluated:false,safetyAssessed:false};
  const H=config.heuristics;
  const windDirection=directionalFit(input.windFromDeg,profile.windFromDeg,H.angleFalloffDegrees);
  const swellDirection=directionalFit(input.swellFromDeg,profile.waveFromDeg,H.angleFalloffDegrees);
  const windStrength={value:strength(input.windKmh,input.gustKmh,H)};
  const period={value:periodFit(input.swellPeriodS,H)};
  const swellPresence={value:presenceFit(input.swellHeightM,H)};
  if(!windDirection||!swellDirection)throw Error('Profile direction bands not defined');
  const science=potentialScore(input,profile,H);
  // Score is a 0–10 relative offshore surf-potential INDEX. No numerical
  // calibration to observed rideability or transformation into surf height.
  const components={windDirection,swellDirection,
   windStrength:{value:science.windQuality},period,
   swellPresence:{value:science.energyResponse}};
  const unrounded=science.unrounded;
  const score=+clamp(unrounded,0,10).toFixed(1);
  const guideOnly=profile.scoreEnabled===false||profile.accessRestriction?.status==='restriction_reported_not_live_verified';
  const fieldSessions=Number.isInteger(config.calibration?.fieldSessions)?
   config.calibration.fieldSessions:0;
  const band=bands.find(b=>score<b.max);
  const label=t(locale,band.es,band.en);
  const tags=['windDirection','swellDirection','windStrength','period','swellPresence'].map(k=>fitTag(k,components[k].value,locale));
  tags.push({id:'tide',state:'unknown',label:t(locale,'Marea no calibrada','Tide not calibrated')});
  tags.push({id:'confidence',state:'unknown',label:t(locale,'Guía local; sin validar','Guide-based; unvalidated')});
  let vibe='mixed';
  if(windStrength.value<.4)vibe='choppy';
  else if(period.value<.4)vibe='short';
  else if(windDirection.value>=.8&&swellDirection.value>=.8)
   vibe=profile.kind==='river-mouth beachbreak'?'mellow':'clean';
  const vibes={
   mixed:[' MIXED · Variable',' MIXED · Variable'],
   choppy:[' CHOPPY · Picadas',' CHOPPY · Bumpy'],
   short:[' SHORT · Cortas',' SHORT · Short period'],
   mellow:[' EASYGOING · Bancos variables',' EASYGOING · Shifting banks'],
   clean:[' CLEAN LINES · Potenciales',' CLEAN LINES · Potential']
  };
  const modelRisk=finite(input.gustKmh)&&input.gustKmh>=75||input.windKmh>=55;
  return {
   spotId,spot:profile.name,status:guideOnly?'guide-only-restricted':'experimental',
   score:guideOnly?null:score,
   scoreLabel:guideOnly?null:label,band:guideOnly?null:band.id,components,
   fieldSessions,rawDirectionalIndex:null,
   rawSwellAvailability:+science.gate.toFixed(3),
   indexVersion:'faro-offshore-potential-v0.3',
   physicsProxy:{
    energyHs2T:+science.power.raw.toFixed(3),
    admittedEnergyHs2T:+science.power.admitted.toFixed(3),
    energyResponse:+science.energyResponse.toFixed(3),
    energyGate:+science.gate.toFixed(3),
    windQuality:+science.windQuality.toFixed(3),
    windSeaFraction:science.windSeaFraction===null?null:+science.windSeaFraction.toFixed(3),
    windSeaModifier:+science.seaModifier.toFixed(3),
    partitionConsistency:science.power.consistency===null?null:+science.power.consistency.toFixed(3),
    partitions:science.power.breakdown,
    offshoreNotBreakingWave:true,
    optionalPartitionsMissing:!input.secondarySwell&&!input.tertiarySwell,
    tideNotEvaluated:true
   },
   tags,vibe:{id:vibe,label:t(locale,...vibes[vibe])},
   read:read(components,locale,profile.name),
   caution:profile['hazardContext'+(es?'Es':'En')],
   sourceIds:Object.values(profile.origins),modelRisk:{
    isScreened:modelRisk,
    label:modelRisk?t(locale,'Rachas/viento potencialmente peligrosos (criterio FARO)','Potentially hazardous wind (FARO screen)'):null,
    official:false
   },
   swellAvailability:+science.gate.toFixed(2),evidence:'published_guide_not_calibrated',tideEvaluated:false,nearshoreWaveHeightEstimated:false,
   safetyAssessed:false,confidence:'low',scoreCap:null,scoreLimitPolicy:'full-range-unvalidated',
   publicRecommendationAllowed:!guideOnly,
   warning:t(locale,
    guideOnly?
     'Ventanas: sólo hipótesis de guía; sin score ni recomendación mientras la restricción sanitaria no esté verificada como levantada.':
     'FARO 0–10: índice de potencial oceánico (componentes Hs²·T, dirección de guía y viento). Parámetros heurísticos sin calibración local; no predice altura rompiente, marea ni seguridad.',
    guideOnly?
     'Ventanas: guide hypotheses only; no score or recommendation until the health restriction is verified as lifted.':
     'FARO 0–10: offshore-potential index (Hs²·T partitions, guide bearings and wind). Heuristic parameters lack local calibration; not breaking-wave height, tide or safety.')
  };
 }
 root.FaroChileScoreLab=Object.freeze({evaluate,directionalFit,distanceToRange,periodFit,strength,potentialEnergy,potentialScore});
})(typeof globalThis!=='undefined'?globalThis:this);
